import { useState } from 'react';
import { Loader2, ShieldCheck, Wrench } from 'lucide-react';
import { signInWithProvider } from '@/lib/authMfaFlow';
import GoogleIcon from '@/components/GoogleIcon';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await signInWithProvider('google', '/admin');
    } catch (err) {
      setError('A Google-belépés nem sikerült. Próbálja újra.');
      setLoading(false);
    }
  };

  return (
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
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-brand-line bg-white p-6 shadow-[0_30px_70px_-50px_rgba(11,31,58,0.55)] sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-ember/30 bg-brand-sand text-brand-ember">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <h1 className="mt-4 font-heading text-[24px] font-semibold tracking-tight text-brand">
              Admin bejelentkezés
            </h1>
            <p className="mt-2 text-[14px] leading-[1.6] text-brand-engine">
              Az admin felület csak jóváhagyott munkatársak számára érhető el. Ha még nincs
              hozzáférése, belépés után kérheti.
            </p>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-700">{error}</p>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-brand-line bg-white text-[14px] font-semibold text-brand hover:border-brand/40 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
              {loading ? 'Belépés…' : 'Belépés Google-fiókkal'}
            </button>

            <p className="mt-3 text-center text-[13px] leading-[1.6] text-brand-engine">
              Használja azt a Google-fiókot, amelyhez a hozzáférését kérte.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}