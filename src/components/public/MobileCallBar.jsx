import { Phone } from 'lucide-react';
import { useCegAdat } from '@/components/CegAdatProvider';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { telHref, waHref } from '@/lib/cegadat';

export default function MobileCallBar() {
  const cegadat = useCegAdat();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="container-page flex items-center gap-2 py-2.5">
        <a
          href={telHref(cegadat.phone)}
          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-full bg-brand-ember px-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-white"
        >
          <Phone className="h-4 w-4" />
          Hívjon most
        </a>
        <a
          href={waHref(cegadat.whatsapp)}
          target="_blank"
          rel="noreferrer"
          aria-label="Kapcsolatfelvétel WhatsAppon"
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-brand bg-white px-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-brand"
        >
          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}