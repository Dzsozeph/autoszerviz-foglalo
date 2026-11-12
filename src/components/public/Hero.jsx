import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useCegAdat } from '@/components/CegAdatProvider';

const HERO_IMAGE =
  'https://media.base44.com/images/public/6af4670961f92c12d456e3c5/0eab8ef47_generated_image.png';

export default function Hero() {
  const cegadat = useCegAdat();

  return (
    <section className="relative w-full overflow-hidden bg-brand text-white" aria-label="Profi Autószerviz">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(320deg,rgba(245, 120, 24, 1) 0%, rgba(0, 0, 0, 1) 76%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1700px] px-6 lg:px-12">
        <div className="grid items-stretch gap-10 py-14 lg:grid-cols-[55%_1fr] lg:gap-[6%] lg:py-16">
          <div className="flex min-w-0 flex-col justify-between gap-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-ember">
              Prémium autószerviz · {cegadat.city}
            </p>

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
                className="group inline-flex min-h-[52px] items-center gap-3 rounded-full bg-brand-ember px-8 text-[13px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:shadow-[0_0_0_5px_rgba(249,115,22,0.22)]"
              >
                Időpontot kérek
                <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" strokeWidth={1.6} />
              </Link>
            </div>
          </div>

          <figure className="relative w-full overflow-hidden rounded-2xl bg-brand-deep">
            <Image
              src={HERO_IMAGE}
              alt="Modern autó motortere közelről, kék és narancs megvilágítással"
              className="aspect-[4/3] w-full lg:aspect-[602/628]"
              fittingType="fill"
              fetchPriority="high"
            />
            <figcaption className="absolute bottom-4 left-4 rounded-full bg-brand/85 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/80 backdrop-blur">
              Minta fotó – bemutató célú
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}