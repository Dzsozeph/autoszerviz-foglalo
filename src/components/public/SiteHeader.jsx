
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Menu,
  X,
  Phone,
  Wrench,
  UserRound,
  UserRoundPlus,
} from 'lucide-react';

import { useCegAdat } from '@/components/CegAdatProvider';
import { useAuth } from '@/lib/AuthContext';
import { telHref } from '@/lib/cegadat';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

const NAV = [
  { to: '/', label: 'Főoldal' },
  { to: '/szolgaltatasok', label: 'Szolgáltatások' },
  { to: '/kapcsolat', label: 'Kapcsolat' },
  { to: '/gyik', label: 'GYIK' },
];

const linkClass = ({ isActive }) =>
  `text-[15px] font-medium transition-colors ${
    isActive ? 'text-brand-ember' : 'text-brand hover:text-brand-ember'
  }`;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const cegadat = useCegAdat();
  const { isAuthenticated, user } = useAuth();

  const profileLabel = isAuthenticated
    ? user?.full_name || user?.name || 'Profil'
    : 'Profil';

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-3 relative xl:-left-[200px]"
          onClick={() => setOpen(false)}
        >
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

        {/* DESKTOP - változatlan */}
        <nav
          aria-label="Fő navigáció"
          className="hidden items-center gap-6 xl:flex relative xl:left-[50px]"
        >
          <div className="relative xl:-left-[80px] flex items-center gap-6">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                end={item.to === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <a
            href={telHref(cegadat.phone)}
            className="flex items-center gap-2 text-[15px] font-medium text-brand-engine hover:text-brand relative xl:left-[50px] whitespace-nowrap shrink-0"
          >
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
            <Phone className="h-4 w-4" />
            {cegadat.phone}
          </a>

          <div className="flex items-center gap-3 relative xl:left-[250px]">
            <Link
              to="/idopont"
              className="inline-flex min-h-[35px] shrink-0 items-center whitespace-nowrap bg-brand-ember px-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition-shadow hover:shadow-[0_0_0_4px_rgba(249,115,22,0.18)] hover:bg-orange-700"
            >
              Időpontot kérek
            </Link>

            <Link
              to="/register"
              className="inline-flex min-h-[40px] ml-8 items-center gap-2 shadow-sm border border-brand-ember px-4 text-[13px] font-semibold text-brand-ember transition-colors hover:bg-brand-ember/5 hover:border-b-2"
            >
              <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
              Regisztráció
            </Link>

            <Link
              to={isAuthenticated ? '/profil' : '/login?returnTo=%2Fprofil'}
              className="inline-flex min-h-[40px] items-center gap-2 border border-brand-line px-4 text-[13px] font-semibold text-brand transition-colors hover:bg-brand-silver/50"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="max-w-[140px] truncate" title={profileLabel}>
                {profileLabel}
              </span>
            </Link>
          </div>
        </nav>

        {/* MOBIL HAMBURGER GOMB */}
        <button
          type="button"
          aria-label={open ? 'Menü bezárása' : 'Menü megnyitása'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="
            flex xl:hidden h-11 w-11 items-center justify-center
            rounded-xl
            border border-white/[0.13]
            bg-black/[0.88]
            text-white/80
            backdrop-blur-2xl
            shadow-[0_4px_20px_rgba(0,0,0,0.35)]
            transition-all duration-300
            hover:bg-white/[0.10]
            hover:border-white/25
            hover:text-white
            active:scale-95
          "
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* MOBIL BLACK GLASS MENÜ */}
      {open && (
        <div
          className="
            relative overflow-hidden
            border-t border-white/[0.10]
            bg-[rgba(5,5,8,0.96)]
            backdrop-blur-[32px]
            shadow-[0_20px_50px_rgba(0,0,0,0.55)]
            xl:hidden
          "
        >
          {/* Finom üvegfény */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.045] via-transparent to-black/[0.20]" />

          <nav
            aria-label="Mobil navigáció"
            className="container-page relative z-10 flex flex-col gap-2 py-5"
          >
            {/* NAVIGÁCIÓS LINKEK */}
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className="
                  flex min-h-[49px] items-center
                  rounded-xl px-4
                  border border-transparent
                  text-[15px] font-medium
                  text-white/65
                  transition-all duration-300
                  hover:border-white/[0.09]
                  hover:bg-white/[0.07]
                  hover:text-white
                  [&.active]:border-white/[0.10]
                  [&.active]:bg-white/[0.09]
                  [&.active]:text-white
                "
              >
                {item.label}
              </NavLink>
            ))}

            {/* IDŐPONTKÉRŐ GOMB */}
            <Link
              to="/idopont"
              onClick={() => setOpen(false)}
              className="
                mt-3 flex min-h-[52px] items-center justify-center
                rounded-xl
                border border-white/[0.20]
                bg-gradient-to-r from-white/[0.16] to-white/[0.06]
                text-[14px] font-bold uppercase tracking-[0.10em]
                text-white
                shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_25px_rgba(0,0,0,0.35)]
                backdrop-blur-xl
                transition-all duration-300
                hover:border-white/[0.30]
                hover:from-white/[0.22]
                hover:to-white/[0.10]
                active:scale-[0.98]
              "
            >
              Időpontot kérek
            </Link>

            {/* REGISZTRÁCIÓ */}
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="
                mt-1 flex min-h-[49px] items-center justify-center gap-2
                rounded-xl
                border border-white/[0.12]
                bg-white/[0.035]
                text-[14px] font-semibold
                text-white/75
                backdrop-blur-xl
                transition-all duration-300
                hover:bg-white/[0.09]
                hover:border-white/[0.22]
                hover:text-white
                active:scale-[0.98]
              "
            >
              <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
              Regisztráció
            </Link>

            {/* PROFIL */}
            <Link
              to={isAuthenticated ? '/profil' : '/login?returnTo=%2Fprofil'}
              onClick={() => setOpen(false)}
              className="
                flex min-h-[49px] items-center justify-center gap-2
                rounded-xl
                border border-white/[0.12]
                bg-white/[0.035]
                text-[14px] font-semibold
                text-white/75
                backdrop-blur-xl
                transition-all duration-300
                hover:bg-white/[0.09]
                hover:border-white/[0.22]
                hover:text-white
                active:scale-[0.98]
              "
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="max-w-[220px] truncate" title={profileLabel}>
                {profileLabel}
              </span>
            </Link>

            {/* TELEFON */}
            <a
              href={telHref(cegadat.phone)}
              className="
                mt-2 flex min-h-[48px] items-center justify-center gap-3
                rounded-xl
                border border-white/[0.08]
                bg-white/[0.025]
                text-[13px] font-medium
                text-white/60
                transition-all duration-300
                hover:bg-white/[0.07]
                hover:text-white
              "
            >
              <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
              <Phone className="h-4 w-4" />
              {cegadat.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
