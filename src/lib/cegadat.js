export const SITE_URL = 'https://autoszerviz-foglalo.base44.app';

export const DEFAULT_CEGADAT = {
  name: 'Profi Autószerviz',
  address: '1117 Budapest, Minta utca 12.',
  city: 'Budapest',
  phone: '+36 1 234 5678',
  email: 'info@profiautoszerviz.hu',
  whatsapp: '+36 1 234 5678',
  hours_weekdays: '8:00 – 17:00',
  hours_saturday: '8:00 – 12:00',
  hours_sunday: 'zárva',
  map_query: '',
  google_maps_url:
    'https://www.google.com/maps/place/Aut%C3%B3ment%C3%A9s+0-24/@47.4099497,18.2691694,9z/data=!4m10!1m2!2m1!1zYXV0w7NzemVyZWzFkQ!3m6!1s0x4741c6bfc3ab8533:0x8c12eaf3493ebb9e!8m2!3d47.4983077!4d19.2864832!15sCg1hdXTDs3N6ZXJlbMWRkgEOdG93aW5nX3NlcnZpY2XgAQA!16s%2Fg%2F11ggzmrdty?entry=ttu&g_ep=EgoyMDI2MTExMC4wIKXMDSoASAFQAw%3D%3D',
};

export function pickCegAdat(record) {
  const out = { ...DEFAULT_CEGADAT };
  if (!record) return out;
  Object.keys(DEFAULT_CEGADAT).forEach((key) => {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) out[key] = value.trim();
  });
  return out;
}

export const telHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;

export const waHref = (whatsapp) => `https://wa.me/${String(whatsapp || '').replace(/\D/g, '')}`;

export const hoursSummary = (cegadat) =>
  `H–P ${cegadat.hours_weekdays} · Szo ${cegadat.hours_saturday}`;

export const mapQuery = (cegadat) => cegadat.map_query || cegadat.address;

export function openingHoursForDate(date, cegadat) {
  const day = new Date(`${date}T00:00:00`).getDay();
  const value = day === 0
    ? cegadat.hours_sunday
    : day === 6
      ? cegadat.hours_saturday
      : cegadat.hours_weekdays;
  const match = String(value || '').match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  const normalize = (time) => (time.length === 4 ? `0${time}` : time);
  return { open: normalize(match[1]), close: normalize(match[2]) };
}

const parseRange = (value) => {
  const match = String(value || '').match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  const pad = (t) => (t.length === 4 ? `0${t}` : t);
  return [pad(match[1]), pad(match[2])];
};

// JSON-LD openingHoursSpecification a központi nyitvatartásból
export function openingHoursSpecification(cegadat) {
  const spec = [];
  const weekdays = parseRange(cegadat.hours_weekdays);
  if (weekdays) {
    spec.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: weekdays[0],
      closes: weekdays[1],
    });
  }
  const saturday = parseRange(cegadat.hours_saturday);
  if (saturday) {
    spec.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: saturday[0],
      closes: saturday[1],
    });
  }
  return spec;
}