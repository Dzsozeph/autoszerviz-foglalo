import { Star } from 'lucide-react';

const REVIEWS = [
  {
    name: 'Kovács Anita',
    car: 'Opel Astra',
    text: 'Reggel bevittem, délután már hívtak az árajánlattal. Végre egy szerviz, ahol nem kell utánuk telefonálgatni.',
  },
  {
    name: 'Tóth Balázs',
    car: 'Ford Focus',
    text: 'A fékezésnél hallott zajt egy diagnosztikával gyorsan beazonosították. Korrekt, érthető magyarázat.',
  },
  {
    name: 'Szabó Gergő',
    car: 'VW Golf',
    text: 'Műszaki vizsga előtt készítették fel az autót. Minden zöld lett, a folyamat gördülékeny volt.',
  },
];

export default function Testimonials() {
  return (
    <section className="border-y border-brand-silver bg-[#F8FAFC] py-16 sm:py-20">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-ember">
              Minta vélemények
            </p>
            <h2 className="mt-4 font-heading text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight text-brand">
              Amit az ügyfelek mondanak
            </h2>
          </div>
          <p className="max-w-xs text-[14px] leading-[1.6] text-brand-engine">
            Az alábbi vélemények bemutató célú mintaszövegek, nem valós ügyfelektől származnak.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="flex h-full flex-col rounded-xl border border-brand-silver bg-white p-7">
              <div className="flex gap-1 text-brand-ember" aria-label="5 csillag">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 text-[15px] leading-[1.65] text-brand">
                „{r.text}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-brand-silver pt-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-[13px] font-semibold text-white">
                  {r.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-brand">{r.name}</span>
                  <span className="block text-[13px] text-brand-engine">{r.car} · minta vélemény</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}