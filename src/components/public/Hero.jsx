
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Loader2, RefreshCw, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { siGoogle } from 'simple-icons';
import { useCegAdat } from '@/components/CegAdatProvider';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1771340012378-3c86cb649193?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D';

const REVIEW_ERROR_MESSAGES = {
  google_reviews_not_configured: 'A Google Places API-kulcs még nincs beállítva.',
  google_listing_not_configured: 'A Google Cégprofil adatlapja nincs beállítva.',
  google_listing_not_found: 'A Google Cégprofil nem található a megadott adatlap alapján.',
};

function RatingStars({ rating, size = 'h-4 w-4', emptyClass = 'text-white/25' }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} az 5 csillagból`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`${size} ${index < Math.round(rating) ? 'fill-orange-500 text-orange-500' : emptyClass}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function Hero() {
  const cegadat = useCegAdat();
  const [reviews, setReviews] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError('');

    try {
      const response = await base44.functions.invoke('getGoogleReviews', {});
      const data = response.data || {};

      if (data.error) throw new Error(data.error);

      setReviews(data);
    } catch (error) {
      const errorCode =
        error?.message || error?.data?.error || error?.response?.data?.error;

      setReviewsError(
        REVIEW_ERROR_MESSAGES[errorCode] || 'A Google-értékelések most nem tölthetők be.'
      );
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (!reviewsOpen) return undefined;

    const body = document.body;
    const root = document.documentElement;
    const scrollY = window.scrollY;

    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousRootOverflow = root.style.overflow;
    const previousRootOverscroll = root.style.overscrollBehavior;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';

    return () => {
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      root.style.overflow = previousRootOverflow;
      root.style.overscrollBehavior = previousRootOverscroll;

      window.scrollTo(0, scrollY);
    };
  }, [reviewsOpen]);

  const googleMapsUrl = reviews?.googleMapsUri || cegadat.google_maps_url;

  return (
    <section
      className="relative w-full overflow-hidden bg-brand text-white"
      aria-label="Profi Autószerviz"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(320deg,rgba(148, 64, 0, 1) 0%, rgba(0, 0, 0, 1) 60%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1700px] px-6 pt-8 lg:px-4 lg:pt-0">
        <div className="relative grid items-center gap-10 py-14 lg:min-h-[650px] lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.78fr)] lg:gap-8 lg:py-16">

          <div className="flex min-w-0 flex-col gap-8">

            {/* Felső sor: Prémium autószerviz felirat + Google értékelések */}
            <div className="flex flex-col items-start gap-3">

              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-ember">
                Prémium autószerviz · {cegadat.city}
              </p>

              {/* Google értékelési sáv */}
              <button
                type="button"
                onClick={() => setReviewsOpen(true)}
                aria-haspopup="dialog"
                aria-label="Google-értékelések megtekintése"
                className="group relative z-20 ml-4 -translate-y-1 w-[230px] max-w-full shrink-0"
              >
                <div className="relative z-10 flex h-[45px] w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full border border-white/15 bg-[#171717]/95 shadow-xl backdrop-blur-md transition-colors duration-200 group-hover:bg-[#202020] lg:h-[40px]">

                  <div className="flex w-full items-center justify-center gap-2 px-2">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0"
                      style={{ fill: `#${siGoogle.hex}` }}
                      aria-hidden="true"
                    >
                      <path d={siGoogle.path} />
                    </svg>

                    {reviews?.rating != null ? (
                      <RatingStars rating={reviews.rating} size="h-3 w-3" />
                    ) : (
                      <span className="text-sm text-white/60">–</span>
                    )}

                    <span className="text-[12px] font-bold text-white">
                      {reviews?.rating != null
                        ? reviews.rating.toLocaleString('hu-HU', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })
                        : '–'}
                    </span>

                    <span className="text-[10px] text-white/75">
                      {reviews?.userRatingCount != null
                        ? `${reviews.userRatingCount.toLocaleString('hu-HU')} értékelés`
                        : 'Betöltés…'}
                    </span>
                  </div>

                  <span className="text-[9px] font-medium tracking-wide text-white/65">
                    Google-értékelések
                  </span>
                </div>

                {/* Hover jelzés */}
                <div className="pointer-events-none absolute left-1/2 top-[calc(100%-5px)] z-0 flex w-[205px] -translate-x-1/2 -translate-y-2 flex-col items-center rounded-b-xl border border-t-0 border-white/15 bg-[#171717]/95 px-3 pb-2.5 pt-3 opacity-0 shadow-xl backdrop-blur-md transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  <svg
                    className="mb-1 h-3 w-3 text-orange-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>

                  <span className="text-[10px] font-medium tracking-wide text-white/80">
                    Kattints a véleményekért
                  </span>
                </div>
              </button>
            </div>

            <h1 className="font-heading text-[clamp(2.35rem,7.2vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
              Megbízható autószerviz, egyszerű időpontfoglalás.
            </h1>

            <div className="flex flex-col items-start gap-7">
              <p className="max-w-[30rem] text-[16px] leading-[1.6] text-white/75">
                Korszerű diagnosztika, tapasztalt szerelők és átlátható árajánlat. Kérjen időpontot
                online néhány perc alatt – mi pedig visszajelzünk a lehetséges időponttal.
              </p>

              <Link
                to="/idopont"
                className="group inline-flex min-h-[52px] items-center gap-4 bg-brand-ember px-9 pr-7 text-[13px] font-semibold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:bg-orange-800 hover:shadow-[0_8px_30px_rgba(249,115,22,0.25)] [clip-path:polygon(10%_0,100%_0,90%_100%,0_100%)]"
              >
                Időpontot kérek
                <ArrowRight
                  className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1"
                  strokeWidth={1.6}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <figure className="pointer-events-none relative mt-10 h-[350px] w-full overflow-hidden lg:absolute lg:inset-y-0 lg:right-0 lg:z-0 lg:mt-0 lg:h-auto lg:w-[56%] lg:[clip-path:polygon(32%_0%,100%_0%,100%_100%,0%_100%)]">
        <Image
          src={HERO_IMAGE}
          alt="Modern autó motortere közelről, kék és narancs megvilágítással"
          className="absolute inset-0 h-full w-full object-cover"
          fittingType="fill"
          fetchPriority="high"
        />

        {/* Fekete és narancs gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                to right,
                #000000 0%,
                rgba(0,0,0,0.98) 5%,
                rgba(0,0,0,0.90) 15%,
                rgba(0,0,0,0.75) 25%,
                rgba(0,0,0,0.50) 38%,
                rgba(0,0,0,0.25) 48%,
                rgba(0,0,0,0.08) 58%,
                transparent 68%
              ),
              linear-gradient(
                to top,
                rgba(0,0,0,0.8) 0%,
                transparent 40%
              ),
              linear-gradient(
                135deg,
                transparent 35%,
                rgba(148,64,0,0.18) 100%
              )
            `,
          }}
        />

        <figcaption className="absolute bottom-4 right-6 rounded-full bg-brand/85 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-orange-500 backdrop-blur">
          Minta fotó – bemutató célú
        </figcaption>
      </figure>

      <Dialog open={reviewsOpen} onOpenChange={setReviewsOpen}>
        <DialogContent className="h-[90vh] max-h-[90dvh] max-w-2xl overflow-y-auto overscroll-contain border-brand-silver bg-brand-cream p-5 sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-heading text-[24px] font-semibold text-brand">
              {reviews?.isMock ? 'Tesztértékelések' : 'Google-értékelések'}
            </DialogTitle>

            <DialogDescription className="text-brand-engine">
              {reviews?.isMock
                ? 'Kitalált bemutató adatok – nem valódi Google-vélemények.'
                : reviews?.placeName || cegadat.name}
            </DialogDescription>
          </DialogHeader>

          {reviews?.rating != null && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-line bg-white p-4">
              <span className="font-heading text-[32px] font-semibold text-brand">
                {reviews.rating.toFixed(1)}
              </span>

              <span>
                <span className="block">
                  <RatingStars
                    rating={reviews.rating}
                    size="h-4 w-4"
                    emptyClass="text-brand-silver"
                  />
                </span>

                <span className="mt-1 block text-[12px] text-brand-engine">
                  {reviews.userRatingCount.toLocaleString('hu-HU')}{' '}
                  {reviews.isMock ? 'tesztértékelés átlaga' : 'értékelés a Google Mapsen'}
                </span>
              </span>

              <button
                type="button"
                onClick={loadReviews}
                disabled={reviewsLoading}
                aria-label="Értékelések frissítése"
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-brand-silver text-brand hover:bg-brand-cream disabled:opacity-50"
              >
                {reviewsLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
              </button>
            </div>
          )}

          {reviewsLoading && !reviews && (
            <div className="flex items-center justify-center gap-2 py-10 text-[14px] text-brand-engine">
              <Loader2 className="h-4 w-4 animate-spin" />
              Google-értékelések betöltése…
            </div>
          )}

          {reviewsError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[14px] text-red-700"
            >
              <span>{reviewsError}</span>

              <button
                type="button"
                onClick={loadReviews}
                disabled={reviewsLoading}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-red-300 px-3 text-[12px] font-semibold hover:bg-red-100 disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Újrapróbálás
              </button>
            </div>
          )}

          {reviews?.reviews?.length > 0 && (
            <ul className="space-y-3">
              {reviews.reviews.map((review, index) => (
                <li
                  key={`${review.authorName}-${review.publishTime || index}`}
                  className="rounded-xl border border-brand-line bg-white p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      {review.authorUri ? (
                        <a
                          href={review.authorUri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[14px] font-semibold text-brand hover:underline"
                        >
                          {review.authorName}
                        </a>
                      ) : (
                        <p className="text-[14px] font-semibold text-brand">
                          {review.authorName}
                        </p>
                      )}

                      {review.relativeTime && (
                        <p className="mt-1 text-[12px] text-brand-engine">
                          {review.relativeTime}
                        </p>
                      )}
                    </div>

                    <RatingStars
                      rating={review.rating}
                      size="h-3.5 w-3.5"
                      emptyClass="text-brand-silver"
                    />
                  </div>

                  {review.text && (
                    <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-brand-engine">
                      {review.text}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {reviews && reviews.reviews.length === 0 && (
            <p className="rounded-xl border border-brand-line bg-white p-5 text-[14px] text-brand-engine">
              Jelenleg nem érhetők el megjeleníthető szöveges értékelések.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-line pt-4">
            {reviews?.isMock ? (
              <span className="text-[12px] font-semibold text-amber-800">
                Kitalált tesztadatok – nem Google-értékelések
              </span>
            ) : (
              <>
                <span className="text-[12px] font-semibold text-brand-engine">
                  Google Maps
                </span>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-[12px] font-semibold text-white hover:bg-brand-light"
                >
                  Összes értékelés a Google Mapsen
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
