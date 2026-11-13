import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useCegAdat } from '@/components/CegAdatProvider';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1771340012378-3c86cb649193?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D';

export default function Hero() {
  const cegadat = useCegAdat();

  return (
    <section className="relative w-full overflow-hidden bg-brand text-white" aria-label="Profi Autószerviz">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(320deg,rgba(148, 64, 0, 1) 0%, rgba(0, 0, 0, 1) 60%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1700px] px-6 lg:px-12">
        <div className="grid items-stretch py-14 lg:min-h-[650px] lg:py-16">
          <div className="flex min-w-0 flex-col justify-between gap-10 lg:w-[45%]">
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
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, #000000 0%, rgba(0,0,0,0.85) 10%, rgba(0,0,0,0.4) 35%, transparent 65%)',
          }}
        />
        <figcaption className="absolute bottom-4 right-6 rounded-full bg-brand/85 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-orange-500 backdrop-blur">
          Minta fotó – bemutató célú
        </figcaption>
      </figure>
    </section>
  );
}