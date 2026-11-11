import { useState } from 'react';
import { Loader2, Lock, Mail, ShieldCheck, Wrench } from 'lucide-react';
import { loginWithMfa } from '@/lib/authMfa';
import { signInWithProvider } from '@/lib/authMfaFlow';
import MfaFlow from '@/components/MfaFlow';
import { MfaScreen } from '@/components/MfaParts';
import GoogleIcon from '@/components/GoogleIcon';
import AccessRequestForm from './AccessRequestForm';

const inputClass =
  'h-12 w-full rounded-lg border border-brand-line bg-white pl-10 pr-3 text-[15px] text-brand outline-none transition-colors focus:border-brand-ember';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [showRequest, setShowRequest] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await loginWithMfa(email, password);
      if (result && result.mfa_required) {
        setChallenge(result);
        return;
      }
      window.location.href = '/admin';
    } catch (err) {
      setError('A bejelentkezés nem sikerült. Ellenőrizze az e-mail-címet és a jelszót.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithProvider('google', '/admin');
    } catch (err) {
      setError('A Google-belépés nem sikerült. Próbálja újra, vagy lépjen be e-mail-címmel.');
    }
  };

  if (challenge) {
    return (
      <MfaScreen>
        <MfaFlow challenge={challenge} returnTo="/admin" />
      </MfaScreen>
    );
  }

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
              Az admin felület csak jóváhagyott munkatársak számára érhető el.
            </p>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-700">{error}</p>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-brand-line bg-white text-[14px] font-semibold text-brand hover:border-brand/40"
            >
              <GoogleIcon className="h-5 w-5" />
              Belépés Google-fiókkal
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-line" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11px] uppercase tracking-[0.16em] text-brand-engine">
                  vagy
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="admin-email" className="text-[13px] font-medium text-brand">
                  E-mail-cím
                </label>
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-engine/60" />
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="munkatars@profiautoszerviz.hu"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-password" className="text-[13px] font-medium text-brand">
                  Jelszó
                </label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-engine/60" />
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-brand-ember text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-shadow hover:shadow-[0_0_0_4px_rgba(249,115,22,0.2)] disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Belépés…' : 'Bejelentkezés'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowRequest((current) => !current)}
              className="mt-5 w-full text-center text-[13px] font-semibold text-brand underline hover:text-brand-ember"
            >
              {showRequest ? 'Bejelentkezés megjelenítése' : 'Admin hozzáférés kérése'}
            </button>
          </div>

          {showRequest && (
            <div className="mt-6 rounded-2xl border border-brand-line bg-white p-6 shadow-[0_30px_70px_-50px_rgba(11,31,58,0.55)] sm:p-8">
              <h2 className="font-heading text-[20px] font-semibold text-brand">
                Admin hozzáférés kérése
              </h2>
              <p className="mt-1 text-[14px] text-brand-engine">
                Töltse ki az adatait, és a tulajdonos hamarosan elbírálja a kérelmét.
              </p>
              <div className="mt-5">
                <AccessRequestForm defaultEmail={email} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}