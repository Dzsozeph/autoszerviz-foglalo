import { Link } from 'react-router-dom';
import { Wrench, Phone, Mail, MapPin } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="bg-brand text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-brand-ember">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="font-heading text-[17px] font-semibold tracking-tight">
              Profi Autószerviz
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
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-ember">
            Nyitvatartás
          </h3>
          <ul className="mt-4 space-y-2 text-[15px] text-white/75">
            <li>Hétfő – Péntek: 8:00 – 17:00</li>
            <li>Szombat: 8:00 – 12:00</li>
            <li>Vasárnap: zárva</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-ember">
            Kapcsolat
          </h3>
          <ul className="mt-4 space-y-3 text-[15px] text-white/75">
            <li className="flex items-start gap-2">
              <Phone className="mt-1 h-4 w-4 shrink-0 text-brand-ember" />
              <span>+36 1 234 5678 <em className="not-italic text-white/45">(minta)</em></span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-1 h-4 w-4 shrink-0 text-brand-ember" />
              <span>info@profiautoszerviz.hu <em className="not-italic text-white/45">(minta)</em></span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand-ember" />
              <span>1117 Budapest, Minta utca 12. <em className="not-italic text-white/45">(minta)</em></span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[14px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Profi Autószerviz – Minden jog fenntartva.</p>
          <p className="font-medium text-white/70">Minta oldal – bemutató célú</p>
        </div>
      </div>
    </footer>
  );
}