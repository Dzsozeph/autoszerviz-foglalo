import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/public/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INFO = [
  { icon: Phone, label: 'Telefon', value: '+36 1 234 5678', note: '(minta szám)' },
  { icon: Mail, label: 'E-mail', value: 'info@profiautoszerviz.hu', note: '(minta cím)' },
  { icon: MapPin, label: 'Cím', value: '1117 Budapest, Minta utca 12.', note: '(minta cím)' },
  { icon: Clock, label: 'Nyitvatartás', value: 'H–P 8:00–17:00 · Szo 8:00–12:00', note: 'Vasárnap zárva' },
];

export default function Kapcsolat() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Kérjük, adja meg a nevét.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Adjon meg érvényes e-mail-címet.';
    if (form.message.trim().length < 10) next.message = 'Írja le az üzenetét legalább 10 karakterben.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    setServerError('');
    try {
      await base44.entities.KapcsolatiUzenet.create({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        read: false,
      });
      setForm({ name: '', email: '', message: '' });
      setSent(true);
    } catch (error) {
      setServerError('Az üzenet küldése nem sikerült. Kérjük, próbálja újra, vagy hívjon minket telefonon.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Kapcsolat"
        title="Beszéljünk az autójáról"
        intro="Kérdése van, vagy időpontot egyeztetne? Hívjon minket, írjon e-mailt, vagy küldje el üzenetét az űrlapon – munkanapokon igyekszünk minél előbb válaszolni."
      />

      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="grid gap-px overflow-hidden rounded-xl border border-brand-silver bg-brand-silver sm:grid-cols-2">
              {INFO.map(({ icon: Icon, label, value, note }) => (
                <div key={label} className="bg-white p-6">
                  <Icon className="h-5 w-5 text-brand-ember" strokeWidth={1.7} />
                  <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-engine">
                    {label}
                  </p>
                  <p className="mt-1 text-[15px] font-medium leading-snug text-brand">{value}</p>
                  <p className="mt-1 text-[12px] text-brand-engine/70">{note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-brand-silver">
              <iframe
                title="Profi Autószerviz – minta cím a térképen"
                src="https://www.google.com/maps?q=1117+Budapest+Minta+utca+12&output=embed"
                className="h-[280px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="rounded-xl border border-brand-silver bg-white p-7 sm:p-8">
            <h2 className="font-heading text-[22px] font-semibold tracking-tight text-brand">
              Írjon nekünk
            </h2>
            <p className="mt-2 text-[15px] text-brand-engine">
              Az üzenet a kapcsolati üzenetek között jelenik meg a szerviz munkatársainál.
            </p>

            {sent ? (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <p className="mt-3 font-heading text-[17px] font-semibold text-emerald-900">
                  Köszönjük, megkaptuk az üzenetét!
                </p>
                <p className="mt-1 text-[14px] leading-[1.6] text-emerald-800">
                  Munkatársunk a megadott e-mail-címen jelentkezik.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-emerald-600 px-5 text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-800 hover:bg-emerald-100"
                >
                  Új üzenet írása
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                <div>
                  <Label htmlFor="c-name">Név</Label>
                  <Input
                    id="c-name"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="Kovács Anna"
                    className="mt-2 h-12"
                  />
                  {errors.name && <p className="mt-1 text-[13px] text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="c-email">E-mail</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    placeholder="anna@example.com"
                    className="mt-2 h-12"
                  />
                  {errors.email && <p className="mt-1 text-[13px] text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="c-message">Üzenet</Label>
                  <Textarea
                    id="c-message"
                    rows={6}
                    value={form.message}
                    onChange={(e) => setField('message', e.target.value)}
                    placeholder="Írja le, miben segíthetünk…"
                    className="mt-2"
                  />
                  {errors.message && <p className="mt-1 text-[13px] text-red-600">{errors.message}</p>}
                </div>
                {serverError && (
                  <p className="rounded-lg bg-red-50 p-3 text-[13px] text-red-700">{serverError}</p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-brand-ember px-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-shadow hover:shadow-[0_0_0_4px_rgba(249,115,22,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? 'Küldés folyamatban…' : 'Üzenet küldése'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}