import { useState } from 'react';
import { Clock, LogOut, RefreshCw, ShieldX, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AccessRequestForm from './AccessRequestForm';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#F1F5F9]">
    <header className="bg-brand text-white">
      <div className="container-page flex h-[68px] items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-brand-ember">
          <Wrench className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="font-heading text-[15px] font-semibold">Profi Autószerviz</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Admin felület</p>
        </div>
      </div>
    </header>
    <main className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">{children}</div>
    </main>
  </div>
);

export default function AccessStatusScreen({ status, name, email, onRefresh }) {
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      await onRefresh?.();
    } finally {
      setChecking(false);
    }
  };

  if (status === 'pending') {
    return (
      <Shell>
        <div className="rounded-2xl border border-brand-line bg-white p-7 shadow-[0_30px_70px_-50px_rgba(11,31,58,0.55)] sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-ember/30 bg-brand-sand text-brand-ember">
            <Clock className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <h1 className="mt-4 font-heading text-[22px] font-semibold text-brand">
            Hozzáférési kérelme elbírálás alatt
          </h1>
          <p className="mt-3 text-[15px] leading-[1.65] text-brand-engine">
            Hozzáférési kérelmét megkaptuk. Amint jóváhagyjuk, e-mailben értesítjük.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={check}
              disabled={checking}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand px-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              Állapot ellenőrzése
            </button>
            <button
              type="button"
              onClick={() => base44.auth.logout('/admin')}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-brand-line px-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-brand hover:border-brand/40"
            >
              <LogOut className="h-4 w-4" />
              Kilépés
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (status === 'rejected') {
    return (
      <Shell>
        <div className="rounded-2xl border border-brand-line bg-white p-7 shadow-[0_30px_70px_-50px_rgba(11,31,58,0.55)] sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600">
            <ShieldX className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <h1 className="mt-4 font-heading text-[22px] font-semibold text-brand">
            A hozzáférése jelenleg nem aktív
          </h1>
          <p className="mt-3 text-[15px] leading-[1.65] text-brand-engine">
            Sajnos a hozzáférési kérelmét nem tudtuk jóváhagyni, ezért az admin felület adatai nem
            érhetők el. Ha úgy gondolja, hogy ez tévedés, kérjük, hívjon minket a +36 1 234 5678
            számon.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <details className="rounded-xl border border-brand-line p-4">
              <summary className="cursor-pointer text-[13px] font-semibold text-brand">
                Új kérelem beküldése
              </summary>
              <div className="mt-4">
                <AccessRequestForm defaultEmail={email} defaultName={name} />
              </div>
            </details>
            <button
              type="button"
              onClick={() => base44.auth.logout('/admin')}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-brand-line px-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-brand hover:border-brand/40"
            >
              <LogOut className="h-4 w-4" />
              Kilépés
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (status === 'revoked') {
    return (
      <Shell>
        <div className="rounded-2xl border border-brand-line bg-white p-7 shadow-[0_30px_70px_-50px_rgba(11,31,58,0.55)] sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-600">
            <ShieldX className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <h1 className="mt-4 font-heading text-[22px] font-semibold text-brand">
            A hozzáférése visszavonva
          </h1>
          <p className="mt-3 text-[15px] leading-[1.65] text-brand-engine">
            Az admin felület adatai jelenleg nem érhetők el az Ön számára. Ha ismét szüksége van a
            hozzáférésre, küldjön be új kérelmet.
          </p>
          <div className="mt-6">
            <AccessRequestForm defaultEmail={email} defaultName={name} />
          </div>
          <button
            type="button"
            onClick={() => base44.auth.logout('/admin')}
            className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-brand-line text-[13px] font-semibold uppercase tracking-[0.12em] text-brand hover:border-brand/40"
          >
            <LogOut className="h-4 w-4" />
            Kilépés
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="rounded-2xl border border-brand-line bg-white p-7 shadow-[0_30px_70px_-50px_rgba(11,31,58,0.55)] sm:p-8">
        <h1 className="mt-0 font-heading text-[22px] font-semibold text-brand">
          Admin hozzáférés szükséges
        </h1>
        <p className="mt-2 text-[15px] leading-[1.65] text-brand-engine">
          Az admin felület használatához kérjen hozzáférést. A kérelmet a tulajdonos bírálja el.
        </p>
        <div className="mt-6">
          <AccessRequestForm defaultEmail={email} defaultName={name} />
        </div>
        <button
          type="button"
          onClick={() => base44.auth.logout('/admin')}
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-brand-line text-[13px] font-semibold uppercase tracking-[0.12em] text-brand hover:border-brand/40"
        >
          <LogOut className="h-4 w-4" />
          Kilépés
        </button>
      </div>
    </Shell>
  );
}