import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { useCegAdat } from '@/components/CegAdatProvider';
import { telHref } from '@/lib/cegadat';

export default function CtaBand() {
  const cegadat = useCegAdat();

  return (
    <section className="bg-#000000 text-white">
      <div className="container-page grid gap-8 py-14 sm:py-16 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div>
          <h2 className="font-heading text-[clamp(1.8rem,3.6vw,2.6rem)] font-semibold leading-tight tracking-tight">
            Kérjen időpontot néhány perc alatt.
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-[1.6] text-white/75">
            Töltse ki az online időpontkérőt, és munkatársunk visszajelez a lehetséges időponttal.
            Telefonon is elér minket a nyitvatartási időben.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
          <Link
            to="/idopont"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-brand-ember px-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-shadow hover:shadow-[0_0_0_5px_rgba(249,115,22,0.22)]"
          >
            Időpontot kérek
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={telHref(cegadat.phone)}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/40 px-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-white/10"
          >
            <Phone className="h-4 w-4" />
            {cegadat.phone}
          </a>
        </div>
      </div>
    </section>
  );
}