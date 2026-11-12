import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Phone, Wrench, UserRound, UserRoundPlus } from 'lucide-react';
import { useCegAdat } from '@/components/CegAdatProvider';
import { useAuth } from '@/lib/AuthContext';
import { telHref } from '@/lib/cegadat';

const NAV = [
  { to: '/', label: 'Főoldal' },
  { to: '/szolgaltatasok', label: 'Szolgáltatások' },
  { to: '/gyik', label: 'GYIK' },
  { to: '/kapcsolat', label: 'Kapcsolat' },
];

const linkClass = ({ isActive }) =>
  `text-[15px] font-medium transition-colors ${
    isActive ? 'text-brand-ember' : 'text-brand hover:text-brand-ember'
  }`;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const cegadat = useCegAdat();
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-brand-ember">
            <Wrench className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-[17px] font-semibold tracking-tight text-brand">
              {cegadat.name}
            </span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-brand-engine">
              {cegadat.city} · Minta szerviz
            </span>
          </span>
        </Link>

        <nav
  aria-label="Fő navigáció"
  className="hidden items-center gap-6 xl:flex relative left-12"
>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
          <a
            href={telHref(cegadat.phone)}
            className="flex items-center gap-2 text-[15px] font-medium text-brand-engine hover:text-brand"
          >
            <Phone className="h-4 w-4" />
            {cegadat.phone}
          </a>
          <Link
            to="/idopont"
            className="inline-flex min-h-[44px] items-center rounded-full bg-brand-ember px-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-shadow hover:shadow-[0_0_0_4px_rgba(249,115,22,0.18)]"
          >
            Időpontot kérek
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-brand-ember px-4 text-[13px] font-semibold text-brand-ember transition-colors hover:bg-brand-ember/5"
          >
            <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
            Regisztráció
          </Link>
          <Link
            to={isAuthenticated ? '/profil' : '/login?returnTo=%2Fprofil'}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-brand-line px-4 text-[13px] font-semibold text-brand transition-colors hover:bg-brand-silver/50"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Profil
          </Link>
        </nav>

        <button
          type="button"
          aria-label={open ? 'Menü bezárása' : 'Menü megnyitása'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-silver text-brand xl:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-brand-silver bg-white xl:hidden">
          <nav aria-label="Mobil navigáció" className="container-page flex flex-col gap-1 py-3">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center rounded-lg px-3 text-[16px] font-medium text-brand hover:bg-brand-silver/50"
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/idopont"
              onClick={() => setOpen(false)}
              className="mt-2 flex min-h-[48px] items-center justify-center rounded-lg bg-brand-ember text-[15px] font-semibold uppercase tracking-[0.08em] text-white"
            >
              Időpontot kérek
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="mt-2 flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-brand-ember text-[15px] font-semibold text-brand-ember"
            >
              <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
              Regisztráció
            </Link>
            <Link
              to={isAuthenticated ? '/profil' : '/login?returnTo=%2Fprofil'}
              onClick={() => setOpen(false)}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-brand-line text-[15px] font-semibold text-brand"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Profil
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}