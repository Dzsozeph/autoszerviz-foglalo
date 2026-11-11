import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

const WORKSHOP_IMAGE =
  'https://media.base44.com/images/public/6af4670961f92c12d456e3c5/ec9e9af42_generated_image.png';

const POINTS = [
  'Márkafüggetlen szerviz, személyautókra specializálódva',
  'Előzetes egyeztetés minden nagyobb javítás előtt',
  'Írásos állapotfelmérés és dokumentált munkafolyamat',
];

export default function IntroSection() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative overflow-hidden rounded-2xl bg-brand-deep">
          <Image
            src={WORKSHOP_IMAGE}
            alt="Letisztult, modern autószerviz műhely emelőkkel"
            className="aspect-[4/3] w-full"
            fittingType="fill"
          />
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-ember">
            Bemutatkozás
          </p>
          <h2 className="mt-4 font-heading text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight tracking-tight text-brand">
            Egy műhely, ahol a részletek számítanak.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.65] text-brand-engine">
            A Profi Autószerviz egy fiktív, bemutató célú szerviz: az oldal azt mutatja meg, hogyan
            működhet egy modern autószerviz online időpontkérése és ügyfélkezelése. A mögötte lévő
            folyamat – kérés, egyeztetés, javítás – valódi.
          </p>
          <ul className="mt-7 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] leading-[1.6] text-brand">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-ember" />
                {p}
              </li>
            ))}
          </ul>
          <Link
            to="/szolgaltatasok"
            className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full border border-brand px-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-brand transition-colors hover:bg-brand hover:text-white"
          >
            Szolgáltatásaink
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}