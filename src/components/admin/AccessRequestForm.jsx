import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9()\s-]{7,24}$/;

const EMPTY = { name: '', email: '', company: '', phone: '' };

const inputClass =
  'h-12 w-full rounded-lg border border-brand-line bg-white text-[15px] text-brand placeholder:text-brand-engine/45 focus-visible:border-brand-ember focus-visible:ring-2 focus-visible:ring-brand-ember/20';

export default function AccessRequestForm({ defaultEmail = '', defaultName = '' }) {
  const emailLocked = Boolean(defaultEmail);
  const [form, setForm] = useState({ ...EMPTY, email: defaultEmail, name: defaultName });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;
    const next = {};
    if (!form.name.trim()) next.name = 'Adja meg a teljes nevét.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Adjon meg egy érvényes e-mail-címet.';
    if (!form.company.trim()) next.company = 'Adja meg a szerviz vagy cég nevét.';
    if (!PHONE_RE.test(form.phone.trim())) next.phone = 'Adjon meg egy érvényes telefonszámot.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    setServerError('');
    try {
      const response = await base44.functions.invoke('accessRequest', {
        action: 'submit',
        name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone,
      });
      const data = response.data || {};
      if (data.error === 'validation_failed') {
        setErrors(data.fields || {});
        return;
      }
      if (data.error) {
        setServerError('A kérelem elküldése nem sikerült. Kérjük, próbálja újra később.');
        return;
      }
      setSent(true);
    } catch (error) {
      setServerError('A kérelem elküldése nem sikerült. Kérjük, próbálja újra később.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <p className="mt-3 font-heading text-[16px] font-semibold text-emerald-900">
          Hozzáférési kérelmét megkaptuk.
        </p>
        <p className="mt-1 text-[14px] leading-[1.6] text-emerald-800">
          Amint jóváhagyjuk, e-mailben értesítjük.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="req-name">Teljes név *</Label>
        <Input
          id="req-name"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="Kovács Anna"
          className={`mt-2 ${inputClass}`}
          autoComplete="name"
        />
        {errors.name && <p className="mt-1 text-[13px] text-red-600">{errors.name}</p>}
      </div>
      <div>
        <Label htmlFor="req-email">E-mail-cím</Label>
        <Input
          id="req-email"
          type="email"
          value={form.email}
          readOnly={emailLocked}
          onChange={(e) => setField('email', e.target.value)}
          placeholder="munkatars@profiautoszerviz.hu"
          className={`mt-2 ${inputClass} ${
            emailLocked ? 'cursor-not-allowed bg-brand-cream text-brand-engine' : ''
          }`}
          autoComplete="email"
        />
        {emailLocked && (
          <p className="mt-1 text-[12px] text-brand-engine">A belépett Google-fiók e-mail-címe.</p>
        )}
        {errors.email && <p className="mt-1 text-[13px] text-red-600">{errors.email}</p>}
      </div>
      <div>
        <Label htmlFor="req-company">Szerviz / cég neve *</Label>
        <Input
          id="req-company"
          value={form.company}
          onChange={(e) => setField('company', e.target.value)}
          placeholder="Profi Autószerviz"
          className={`mt-2 ${inputClass}`}
          autoComplete="organization"
        />
        {errors.company && <p className="mt-1 text-[13px] text-red-600">{errors.company}</p>}
      </div>
      <div>
        <Label htmlFor="req-phone">Telefonszám *</Label>
        <Input
          id="req-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setField('phone', e.target.value)}
          placeholder="+36 30 123 4567"
          className={`mt-2 ${inputClass}`}
          autoComplete="tel"
        />
        {errors.phone && <p className="mt-1 text-[13px] text-red-600">{errors.phone}</p>}
      </div>

      {serverError && <p className="rounded-lg bg-red-50 p-3 text-[13px] text-red-700">{serverError}</p>}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
      >
        {sending && <Loader2 className="h-4 w-4 animate-spin" />}
        {sending ? 'Küldés…' : 'Hozzáférés kérése'}
      </button>
    </form>
  );
}