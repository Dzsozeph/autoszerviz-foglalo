import { Link } from 'react-router-dom';
import { Wrench, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useCegAdat } from '@/components/CegAdatProvider';
import { telHref, waHref } from '@/lib/cegadat';

export default function SiteFooter() {
  const cegadat = useCegAdat();

  return (
    <footer className="bg-brand text-white"
    style={{
    background: "linear-gradient(320deg, rgba(148, 64, 0, 1) 0%, rgba(0, 0, 0, 1) 34%)"
  }}>
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-brand-ember">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="font-heading text-[17px] font-semibold tracking-tight">
              {cegadat.name}
            </span>
          </div>
          <p className="mt-4 max-w-[280px] text-[15px] leading-relaxed text-white/70">
            Modern műhely, tapasztalt szerelők, átlátható ügyintézés. Az Ön autója jó kezekben van.
          </p>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-ember">
            Oldalak
          </h3>
          <ul className="mt-4 space-y-3 text-[15px] text-white/75">
            <li><Link to="/" className="hover:text-white">Főoldal</Link></li>
            <li><Link to="/szolgaltatasok" className="hover:text-white">Szolgáltatások</Link></li>
            <li><Link to="/gyik" className="hover:text-white">GYIK</Link></li>
            <li><Link to="/kapcsolat" className="hover:text-white">Kapcsolat</Link></li>
            <li><Link to="/idopont" className="hover:text-white">Időpontkérés</Link></li>
            <li><Link to="/adatkezeles" className="hover:text-white">Adatkezelési tájékoztató</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-ember">
            Nyitvatartás
          </h3>
          <ul className="mt-4 space-y-2 text-[15px] text-white/75">
            <li>Hétfő – Péntek: {cegadat.hours_weekdays}</li>
            <li>Szombat: {cegadat.hours_saturday}</li>
            <li>Vasárnap: {cegadat.hours_sunday}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-ember">
            Kapcsolat
          </h3>
          <ul className="mt-4 space-y-3 text-[15px] text-white/75">
            <li className="flex items-start gap-2">
              <Phone className="mt-1 h-4 w-4 shrink-0 text-brand-ember" />
              <a href={telHref(cegadat.phone)} className="hover:text-white hover:underline">
                {cegadat.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-brand-ember" />
              <a
                href={waHref(cegadat.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white hover:underline"
              >
                WhatsApp: {cegadat.whatsapp}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-1 h-4 w-4 shrink-0 text-brand-ember" />
              <a href={`mailto:${cegadat.email}`} className="hover:text-white hover:underline">
                {cegadat.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand-ember" />
              <span>{cegadat.address}</span>
            </li>
          </ul>
          <p className="mt-4 text-[12px] text-white/40">A megadott elérhetőségek minta adatok.</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[14px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {cegadat.name} – Minden jog fenntartva.</p>
          <p className="font-medium text-white/70">Minta oldal – bemutató célú</p>
        </div>
      </div>
    </footer>
  );
}