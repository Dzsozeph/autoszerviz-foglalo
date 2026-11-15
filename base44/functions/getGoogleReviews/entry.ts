import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { CEGADAT_DEFAULTS } from '../../shared/cegadat.ts';

const GOOGLE_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const GOOGLE_FIELDS = 'places.id,places.displayName,places.location';
const DETAILS_FIELDS = 'id,displayName,rating,userRatingCount,reviews,googleMapsUri';

// Explicit test fixture: never use these fabricated reviews as real customer feedback.
const MOCK_REVIEWS = {
  placeName: 'Tesztműhely',
  rating: 4.2,
  userRatingCount: 5,
  googleMapsUri: '',
  reviews: [
    {
      authorName: 'Kovács Anna (teszt)',
      authorUri: '',
      rating: 5,
      text: 'Gyors és kedves ügyintézés, az autót a megbeszélt időre elkészítették. Köszönöm!',
      relativeTime: '2 hete',
      publishTime: '',
    },
    {
      authorName: 'Nagy Péter (teszt)',
      authorUri: '',
      rating: 4,
      text: 'Korrekt munkát végeztek, és mindenről előre tájékoztattak.',
      relativeTime: '1 hónapja',
      publishTime: '',
    },
    {
      authorName: 'Tóth Eszter (teszt)',
      authorUri: '',
      rating: 3,
      text: 'A javítás rendben volt, de az egyeztetett időponthoz képest valamivel később vehettem át az autót.',
      relativeTime: '2 hónapja',
      publishTime: '',
    },
    {
      authorName: 'Szabó Gábor (teszt)',
      authorUri: '',
      rating: 5,
      text: 'Részletesen elmagyarázták, mit találtak a diagnosztika során, és csak az előre egyeztetett munkákat végezték el. A javítás után az autóval minden rendben volt, az átvétel is gördülékenyen ment. Jó tapasztalat volt, máskor is ide jövök.',
      relativeTime: '3 hónapja',
      publishTime: '',
    },
    {
      authorName: 'Varga László (teszt)',
      authorUri: '',
      rating: 4,
      text: 'Segítőkész csapat, átlátható tájékoztatás.',
      relativeTime: '4 hónapja',
      publishTime: '',
    },
  ],
  attribution: 'Tesztadatok – nem valódi Google-értékelések',
  isMock: true,
};

function parseListing(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!['google.com', 'www.google.com', 'maps.google.com'].includes(url.hostname) ||
      !url.pathname.startsWith('/maps/place/')) {
    return null;
  }

  const rawName = url.pathname.split('/maps/place/')[1]?.split('/')[0] || '';
  let name = '';
  try {
    name = decodeURIComponent(rawName.replaceAll('+', ' ')).trim();
  } catch {
    return null;
  }

  const coordinates = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (!name || !coordinates) return null;
  const latitude = Number(coordinates[1]);
  const longitude = Number(coordinates[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { name, latitude, longitude, url: url.toString() };
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function distanceMeters(first, second) {
  const radians = (value) => (value * Math.PI) / 180;
  const latitudeDifference = radians(second.latitude - first.latitude);
  const longitudeDifference = radians(second.longitude - first.longitude);
  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(first.latitude)) *
      Math.cos(radians(second.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function safeProfileUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

async function googleFetch(url, apiKey, fieldMask, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    console.error('Google Places API request failed', { status: response.status });
    throw new Error('google_places_request_failed');
  }
  return response.json();
}

export default async function (req) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    if (Deno.env.get('GOOGLE_REVIEWS_MOCK')?.toLowerCase() === 'true') {
      return Response.json(MOCK_REVIEWS, { headers });
    }

    const base44 = createClientFromRequest(req);
    const page = await base44.asServiceRole.entities.CegAdat.list('-updated_date', 1);
    const company = (page?.items || page || [])[0];
    const listing = parseListing(company?.google_maps_url || CEGADAT_DEFAULTS.google_maps_url);
    if (!listing) {
      return Response.json({ error: 'google_listing_not_configured' }, { status: 503, headers });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'google_reviews_not_configured' }, { status: 503, headers });
    }

    const search = await googleFetch(
      GOOGLE_SEARCH_URL,
      apiKey,
      GOOGLE_FIELDS,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textQuery: listing.name,
          languageCode: 'hu',
          regionCode: 'HU',
          pageSize: 5,
          locationBias: {
            circle: {
              center: { latitude: listing.latitude, longitude: listing.longitude },
              radius: 1000,
            },
          },
        }),
      }
    );

    const candidates = Array.isArray(search.places) ? search.places : [];
    const targetName = normalizeName(listing.name);
    const place = candidates.find((candidate) => {
      const name = normalizeName(candidate.displayName?.text);
      const location = candidate.location;
      return (
        candidate.id &&
        name &&
        (name.includes(targetName) || targetName.includes(name)) &&
        location &&
        distanceMeters(listing, location) <= 5000
      );
    });

    if (!place) {
      return Response.json({ error: 'google_listing_not_found' }, { status: 404, headers });
    }

    const detailsUrl = new URL(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(place.id)}`
    );
    detailsUrl.searchParams.set('languageCode', 'hu');
    const details = await googleFetch(
      detailsUrl.toString(),
      apiKey,
      DETAILS_FIELDS
    );
    const reviews = Array.isArray(details.reviews) ? details.reviews.slice(0, 5) : [];

    return Response.json(
      {
        placeName: details.displayName?.text || listing.name,
        rating: Number.isFinite(details.rating) ? details.rating : null,
        userRatingCount: Number.isFinite(details.userRatingCount) ? details.userRatingCount : 0,
        googleMapsUri: safeProfileUrl(details.googleMapsUri) || listing.url,
        reviews: reviews.map((review) => ({
          authorName: review.authorAttribution?.displayName || 'Google-felhasználó',
          authorUri: safeProfileUrl(review.authorAttribution?.uri),
          rating: Number.isFinite(review.rating) ? review.rating : 0,
          text: typeof review.text?.text === 'string' ? review.text.text.slice(0, 4000) : '',
          relativeTime: review.relativePublishTimeDescription || '',
          publishTime: review.publishTime || '',
        })),
        attribution: 'Google Maps',
        isMock: false,
      },
      { headers }
    );
  } catch (error) {
    console.error('Google-értékelések betöltése nem sikerült', {
      message: error?.message || 'unknown_error',
    });
    return Response.json({ error: 'google_reviews_load_failed' }, { status: 502, headers });
  }
}
