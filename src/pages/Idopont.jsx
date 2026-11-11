import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/public/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TIME_SLOTS, todayISO } from '@/lib/booking';

const EMPTY = {
  customer_name: '',
  phone: '',
  email: '',
  car_brand: '',
  car_model: '',
  license_plate: '',
  service: '',
  problem_description: '',
  preferred_date: '',
  preferred_time: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9()\s-]{7,24}$/;

function Field({ id, label, error, children, className = '' }) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}

const inputClass = 'h-12 w-full';

export default function Idopont() {
  const [params] = useSearchParams();
  const preset = params.get('szolgaltatas') || '';
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ ...EMPTY, service: preset });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    let active = true;
    base44.entities.Szolgaltatas.filter({ active: true }, { sort: 'order', limit: 50 })
      .then((page) => {
        if (active) setServices(page.items || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (data) => {
    const e = {};
    if (!data.customer_name.trim()) e.customer_name = 'Kérjük, adja meg a nevét.';
    if (!PHONE_RE.test(data.phone.trim())) e.phone = 'Adjon meg érvényes telefonszámot (pl. +36 30 123 4567).';
    if (!EMAIL_RE.test(data.email.trim())) e.email = 'Adjon meg érvényes e-mail-címet.';
    if (!data.car_brand.trim()) e.car_brand = 'Kérjük, adja meg a márkát.';
    if (!data.car_model.trim()) e.car_model = 'Kérjük, adja meg a típust.';
    if (!data.license_plate.trim()) e.license_plate = 'Kérjük, adja meg a rendszámot.';
    if (!data.service) e.service = 'Válasszon szolgáltatást.';
    if (data.problem_description.trim().length < 10) {
      e.problem_description = 'Írja le röviden a hibát (legalább 10 karakter).';
    }
    if (!data.preferred_date) e.preferred_date = 'Válasszon egy napot.';
    else if (data.preferred_date < todayISO()) e.preferred_date = 'Múltbeli dátumot nem lehet választani.';
    if (!data.preferred_time) e.preferred_time = 'Válasszon időpontot.';
    return e;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      const response = await base44.functions.invoke('submitIdopontkeres', form);
      const data = response.data || {};
      if (data.error === 'validation_failed') {
        setErrors(data.fields || {});
        return;
      }
      if (data.error) {
        setServerError('A kérés elküldése nem sikerült. Kérjük, próbálja újra, vagy hívjon minket telefonon.');
        return;
      }
      setSuccess(true);
      setForm({ ...EMPTY });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setServerError('A kérés elküldése nem sikerült. Kérjük, ellenőrizze a kapcsolatot, vagy hívjon minket telefonon.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Időpontkérés"
        title="Kérjen időpontot online"
        intro="Töltse ki az alábbi űrlapot, és munkatársunk hamarosan visszajelez a lehetséges időponttal. Az űrlap kitöltése néhány percet vesz igénybe."
      />

      <section className="container-page py-14 sm:py-20">
        {success ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 sm:p-10">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            <h2 className="mt-4 font-heading text-[24px] font-semibold text-emerald-900">
              Köszönjük, megkaptuk az időpontkérését!
            </h2>
            <p className="mt-3 text-[15px] leading-[1.65] text-emerald-900/80">
              Ez időpontkérelem, nem garantált foglalás. Munkatársunk felveszi Önnel a kapcsolatot a
              visszaigazolás érdekében.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-white"
              >
                Új kérés indítása
              </button>
              <Link
                to="/"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-brand px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-brand hover:bg-brand/5"
              >
                Vissza a főoldalra
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.5fr_0.5fr] lg:gap-14">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-brand-silver bg-white p-6 sm:p-8"
            >
              <fieldset className="border-0 p-0">
                <legend className="font-heading text-[18px] font-semibold text-brand">
                  1. Adatai
                </legend>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field id="customer_name" label="Név *" error={errors.customer_name}>
                    <Input
                      id="customer_name"
                      value={form.customer_name}
                      onChange={(e) => setField('customer_name', e.target.value)}
                      placeholder="Kovács Anna"
                      className={inputClass}
                      autoComplete="name"
                    />
                  </Field>
                  <Field id="phone" label="Telefonszám *" error={errors.phone}>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      placeholder="+36 30 123 4567"
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </Field>
                  <Field id="email" label="E-mail-cím *" error={errors.email} className="sm:col-span-2">
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      placeholder="anna@example.com"
                      className={inputClass}
                      autoComplete="email"
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="mt-9 border-0 border-t border-brand-silver p-0 pt-8">
                <legend className="font-heading text-[18px] font-semibold text-brand">
                  2. Az autó
                </legend>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <Field id="car_brand" label="Márka *" error={errors.car_brand}>
                    <Input
                      id="car_brand"
                      value={form.car_brand}
                      onChange={(e) => setField('car_brand', e.target.value)}
                      placeholder="Volkswagen"
                      className={inputClass}
                    />
                  </Field>
                  <Field id="car_model" label="Típus *" error={errors.car_model}>
                    <Input
                      id="car_model"
                      value={form.car_model}
                      onChange={(e) => setField('car_model', e.target.value)}
                      placeholder="Golf 7"
                      className={inputClass}
                    />
                  </Field>
                  <Field id="license_plate" label="Rendszám *" error={errors.license_plate}>
                    <Input
                      id="license_plate"
                      value={form.license_plate}
                      onChange={(e) => setField('license_plate', e.target.value.toUpperCase())}
                      placeholder="ABC-123"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="mt-9 border-0 border-t border-brand-silver p-0 pt-8">
                <legend className="font-heading text-[18px] font-semibold text-brand">
                  3. Miben segíthetünk?
                </legend>
                <div className="mt-5 grid gap-5">
                  <Field id="service" label="Kért szolgáltatás *" error={errors.service}>
                    <select
                      id="service"
                      value={form.service}
                      onChange={(e) => setField('service', e.target.value)}
                      className="h-12 w-full rounded-md border border-input bg-white px-3 text-[15px] text-brand outline-none focus:border-brand-ember"
                    >
                      <option value="">Válasszon szolgáltatást…</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    id="problem_description"
                    label="A hiba vagy probléma leírása *"
                    error={errors.problem_description}
                  >
                    <Textarea
                      id="problem_description"
                      rows={5}
                      value={form.problem_description}
                      onChange={(e) => setField('problem_description', e.target.value)}
                      placeholder="Írja le, mit tapasztal az autónál: mikor jelentkezik a hiba, milyen hangot ad, világít-e valamilyen visszajelző lámpa…"
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="mt-9 border-0 border-t border-brand-silver p-0 pt-8">
                <legend className="font-heading text-[18px] font-semibold text-brand">
                  4. Preferált időpont
                </legend>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field id="preferred_date" label="Preferált nap *" error={errors.preferred_date}>
                    <Input
                      id="preferred_date"
                      type="date"
                      min={todayISO()}
                      value={form.preferred_date}
                      onChange={(e) => setField('preferred_date', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field id="preferred_time" label="Preferált időpont *" error={errors.preferred_time}>
                    <select
                      id="preferred_time"
                      value={form.preferred_time}
                      onChange={(e) => setField('preferred_time', e.target.value)}
                      className="h-12 w-full rounded-md border border-input bg-white px-3 text-[15px] text-brand outline-none focus:border-brand-ember"
                    >
                      <option value="">Válasszon időpontot…</option>
                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </fieldset>

              {serverError && (
                <p className="mt-6 rounded-lg bg-red-50 p-4 text-[14px] text-red-700">{serverError}</p>
              )}

              <div className="mt-8 flex flex-col gap-4 border-t border-brand-silver pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] leading-[1.5] text-brand-engine">
                  A beküldés nem jár fizetési kötelezettséggel.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-brand-ember px-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-shadow hover:shadow-[0_0_0_4px_rgba(249,115,22,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Küldés folyamatban…' : 'Időpontkérés elküldése'}
                </button>
              </div>
            </form>

            <aside className="h-fit rounded-2xl border border-brand-silver bg-[#F8FAFC] p-7">
              <ShieldCheck className="h-6 w-6 text-brand-ember" />
              <h2 className="mt-4 font-heading text-[18px] font-semibold text-brand">
                Hogyan működik?
              </h2>
              <ol className="mt-4 space-y-3 text-[14px] leading-[1.6] text-brand-engine">
                <li>1. Kitölti az űrlapot, és elküldi a kérést.</li>
                <li>2. Munkatársunk átnézi, és felveszi Önnel a kapcsolatot.</li>
                <li>3. Egyeztetjük a pontos időpontot és a teendőket.</li>
              </ol>
              <p className="mt-6 rounded-lg border border-brand-silver bg-white p-4 text-[13px] leading-[1.6] text-brand-engine">
                Ez időpontkérelem, nem garantált foglalás. A visszaigazolást telefonon vagy e-mailben
                küldjük.
              </p>
              <p className="mt-4 text-[13px] text-brand-engine">
                Inkább telefonálna?{' '}
                <a href="tel:+3612345678" className="font-semibold text-brand underline">
                  +36 1 234 5678
                </a>{' '}
                (minta szám)
              </p>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}