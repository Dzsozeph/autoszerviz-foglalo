import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { hu } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/public/PageHeader';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  TIME_SLOTS,
  BOOKING_DAY_MINUTES,
  getAvailableBookingSlots,
  getBookingUtilization,
  getServiceDurationMinutes,
  todayISO,
} from '@/lib/booking';
import ConsentField from '@/components/public/ConsentField';
import { useCegAdat } from '@/components/CegAdatProvider';
import { telHref } from '@/lib/cegadat';
import { useAuth } from '@/lib/AuthContext';
import usePageMeta from '@/lib/usePageMeta';

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
  consent: false
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9()\s-]{7,24}$/;

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateFromKey = (value) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

function Field({ id, label, error, children, className = '' }) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
    </div>);

}

const inputClass =
'h-12 w-full rounded-lg border-brand-line bg-brand-cream text-[15px] text-brand placeholder:text-brand-engine/45 focus-visible:border-brand-ember focus-visible:ring-2 focus-visible:ring-brand-ember/20';

const selectClass =
'h-12 w-full rounded-lg border border-brand-line bg-brand-cream px-3 text-[15px] text-brand outline-none transition-colors focus:border-brand-ember focus:ring-2 focus:ring-brand-ember/20';

const textareaClass =
'rounded-lg border-brand-line bg-brand-cream text-[15px] leading-[1.6] text-brand placeholder:text-brand-engine/45 focus-visible:border-brand-ember focus-visible:ring-2 focus-visible:ring-brand-ember/20';

function Legend({ step, children }) {
  return (
    <legend className="flex items-center gap-3 font-heading text-[18px] font-semibold text-brand">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-ember/35 bg-brand-sand text-[13px] font-semibold text-brand-ember">
        {step}
      </span>
      {children}
    </legend>);

}

export default function Idopont() {
  const [params] = useSearchParams();
  const cegadat = useCegAdat();
  const { user } = useAuth();
  const preset = params.get('szolgaltatas') || '';

  usePageMeta({
    title: 'Időpontkérés – Profi Autószerviz',
    description:
    'Kérjen időpontot online a Profi Autószerviznél: adja meg autója adatait, a kért szolgáltatást és a preferált időpontot. Munkatársunk hamarosan visszajelez.',
    path: '/idopont'
  });
  const [services, setServices] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [form, setForm] = useState({
    ...EMPTY,
    customer_name: user?.full_name || user?.name || '',
    email: user?.email || '',
    service: preset
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      base44.entities.Szolgaltatas.filter({ active: true }, { sort: 'order', limit: 50 }),
      base44.functions.invoke('getCalendarRequests', {})
    ]).
    then(([servicePage, calendarResponse]) => {
      const data = calendarResponse?.data || {};
      if (data.error) throw new Error(data.error);
      if (active) {
        setServices(servicePage.items || []);
        setBookingRequests(Array.isArray(data.requests) ? data.requests : []);
        setAvailabilityError(false);
      }
    }).
    catch(() => {
      if (active) {
        setServices([]);
        setBookingRequests([]);
        setAvailabilityError(true);
      }
    }).
    finally(() => {
      if (active) setAvailabilityLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const serviceMeta = services.find((service) => service.name === form.service) || null;
  const estimatedMinutes = getServiceDurationMinutes(serviceMeta || form.service);
  const availableTimes = form.service && form.preferred_date
    ? getAvailableBookingSlots({ date: form.preferred_date, service: serviceMeta || form.service, requests: bookingRequests })
    : TIME_SLOTS;
  const utilization = form.preferred_date
    ? getBookingUtilization({ date: form.preferred_date, requests: bookingRequests })
    : { bookedMinutes: 0, totalMinutes: 0, percentage: 0 };
  const occupancyByDate = bookingRequests.reduce((days, request) => {
    if (!request.preferred_date || ['Elutasítva', 'Lezárva'].includes(request.status)) return days;
    days[request.preferred_date] = (days[request.preferred_date] || 0)
      + getServiceDurationMinutes(request.service);
    return days;
  }, {});
  const occupancyDays = Object.entries(occupancyByDate).reduce((days, [dateKeyValue, bookedMinutes]) => {
    const date = dateFromKey(dateKeyValue);
    if (!date) return days;
    const percentage = Math.min(100, Math.round((bookedMinutes / BOOKING_DAY_MINUTES) * 100));
    const level = percentage >= 100 ? 'full' : percentage >= 75 ? 'high' : percentage >= 40 ? 'medium' : 'low';
    days[level].push(date);
    return days;
  }, { low: [], medium: [], high: [], full: [] });

  useEffect(() => {
    if (form.preferred_time && !availableTimes.includes(form.preferred_time)) {
      setForm((current) => ({ ...current, preferred_time: '' }));
      setErrors((current) => ({ ...current, preferred_time: undefined }));
    }
  }, [availableTimes, form.preferred_time]);

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
    if (!data.preferred_date) e.preferred_date = 'Válasszon egy napot.';else
    if (data.preferred_date < todayISO()) e.preferred_date = 'Múltbeli dátumot nem lehet választani.';
    if (!data.preferred_time) e.preferred_time = 'Válasszon időpontot.';
    if (!data.consent) e.consent = 'Kérjük, fogadja el az adatkezelési tájékoztatót.';
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
      setForm({
        ...EMPTY,
        customer_name: user?.full_name || user?.name || '',
        email: user?.email || ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
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
  image="https://i.ibb.co/5gX5dY5C/Whats-App-Image-2026-11-17-at-20-54-12.jpg"
  imagePosition="center center"
/>
      

      <section className="container-page py-14 sm:py-20">
        {success ?
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
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-white">
              
                Új kérés indítása
              </button>
              <Link
              to="/"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-brand px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-brand hover:bg-brand/5">
              
                Vissza a főoldalra
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div> :

        <div className="grid gap-10 lg:grid-cols-[1.5fr_0.5fr] lg:gap-14">
            <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-brand-line bg-white p-6 shadow-[0_30px_70px_-50px_rgba(11,31,58,0.55)] sm:p-8">
            
              <div
              aria-hidden="true"
              className="-mx-6 -mt-6 mb-7 h-1 bg-gradient-to-r from-brand-ember via-brand-honey to-brand-ember/40 sm:-mx-8 sm:-mt-8" />
            
              <fieldset className="border-0 p-0">
                <Legend step="1">Adatai</Legend>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field id="customer_name" label="Név *" error={errors.customer_name}>
                    <Input
                    id="customer_name"
                    value={form.customer_name}
                    onChange={(e) => setField('customer_name', e.target.value)}
                    placeholder="Kovács Anna"
                    className={inputClass}
                    autoComplete="name" />
                  
                  </Field>
                  <Field id="phone" label="Telefonszám *" error={errors.phone}>
                    <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="+36 30 123 4567"
                    className={inputClass}
                    autoComplete="tel" />
                  
                  </Field>
                  <Field id="email" label="E-mail-cím *" error={errors.email} className="sm:col-span-2">
                    <Input
                    id="email"
                    type="email"
                    value={form.email}
                    readOnly
                    placeholder="anna@example.com"
                    className={`${inputClass} cursor-not-allowed opacity-75`}
                    autoComplete="email" />
                    <p className="mt-1 text-[12px] text-brand-engine">
                      A foglalás a bejelentkezett fiók e-mail-címéhez kapcsolódik.
                    </p>
                  </Field>
                </div>
              </fieldset>

              <div
              aria-hidden="true"
              className="mt-9 h-px w-full bg-gradient-to-r from-transparent via-brand-ember/25 to-transparent" />
            
              <fieldset className="mt-8 border-0 p-0">
                <Legend step="2">Az autó</Legend>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <Field id="car_brand" label="Márka *" error={errors.car_brand}>
                    <Input
                    id="car_brand"
                    value={form.car_brand}
                    onChange={(e) => setField('car_brand', e.target.value)}
                    placeholder="Volkswagen"
                    className={inputClass} />
                  
                  </Field>
                  <Field id="car_model" label="Típus *" error={errors.car_model}>
                    <Input
                    id="car_model"
                    value={form.car_model}
                    onChange={(e) => setField('car_model', e.target.value)}
                    placeholder="Golf 7"
                    className={inputClass} />
                  
                  </Field>
                  <Field id="license_plate" label="Rendszám *" error={errors.license_plate}>
                    <Input
                    id="license_plate"
                    value={form.license_plate}
                    onChange={(e) => setField('license_plate', e.target.value.toUpperCase())}
                    placeholder="ABC-123"
                    className={inputClass} />
                  
                  </Field>
                </div>
              </fieldset>

              <div
              aria-hidden="true"
              className="mt-9 h-px w-full bg-gradient-to-r from-transparent via-brand-ember/25 to-transparent" />
            
              <fieldset className="mt-8 border-0 p-0">
                <Legend step="3">Miben segíthetünk?</Legend>
                <div className="mt-5 grid gap-5">
                  <Field id="service" label="Kért szolgáltatás *" error={errors.service}>
                    <select
                    id="service"
                    value={form.service}
                    onChange={(e) => setField('service', e.target.value)}
                    className={selectClass}>
                    
                      <option value="">Válasszon szolgáltatást…</option>
                      {services.map((service) =>
                    <option key={service.id} value={service.name}>
                          {service.name}
                        </option>
                    )}
                    </select>
                    {form.service && (
                      <p className="mt-2 text-[12px] text-brand-engine">
                        Becsült munkavégzési idő: {estimatedMinutes} perc.
                      </p>
                    )}
                  </Field>
                  <Field
                  id="problem_description"
                  label="A hiba vagy probléma leírása *"
                  error={errors.problem_description}>
                  
                    <Textarea
                    id="problem_description"
                    rows={5}
                    className={textareaClass}
                    value={form.problem_description}
                    onChange={(e) => setField('problem_description', e.target.value)}
                    placeholder="Írja le, mit tapasztal az autónál: mikor jelentkezik a hiba, milyen hangot ad, világít-e valamilyen visszajelző lámpa…" />
                  
                  </Field>
                </div>
              </fieldset>

              <div
              aria-hidden="true"
              className="mt-9 h-px w-full bg-gradient-to-r from-transparent via-brand-ember/25 to-transparent" />
            
              <fieldset className="mt-8 border-0 p-0">
                <Legend step="4">Preferált időpont</Legend>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field id="preferred_date" label="Válasszon napot *" error={errors.preferred_date} className="sm:col-span-2">
                    <div className="rounded-xl border border-brand-line bg-white p-3 sm:max-w-md">
                      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-2 px-2 text-[11px] text-brand-engine" aria-label="Napi telítettség jelmagyarázat">
                        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-200" />Alacsony</span>
                        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-200" />Közepes</span>
                        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-orange-300" />Magas</span>
                        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-300" />Betelt</span>
                      </div>
                      {availabilityLoading ? (
                        <p className="p-4 text-sm text-brand-engine">A szabad kapacitás betöltése…</p>
                      ) : availabilityError ? (
                        <p className="p-4 text-sm text-red-700" role="alert">
                          A naptár kapacitását nem sikerült betölteni. Frissítse az oldalt, mielőtt napot választ.
                        </p>
                      ) : (
                        <>
                          <Calendar
                            mode="single"
                            locale={hu}
                            selected={dateFromKey(form.preferred_date)}
                            onSelect={(date) => setField('preferred_date', date ? dateKey(date) : '')}
                            disabled={{ before: dateFromKey(todayISO()) }}
                            modifiers={{
                              low: occupancyDays.low,
                              medium: occupancyDays.medium,
                              high: occupancyDays.high,
                              full: occupancyDays.full,
                            }}
                            modifiersClassNames={{
                              low: 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200',
                              medium: 'bg-amber-100 text-amber-950 hover:bg-amber-200',
                              high: 'bg-orange-200 text-orange-950 hover:bg-orange-300',
                              full: 'bg-red-200 text-red-950 hover:bg-red-300',
                            }}
                            classNames={{
                              day_selected: 'ring-2 ring-brand-ember ring-offset-2',
                              day_today: 'font-bold underline underline-offset-2',
                            }}
                            showOutsideDays={false}
                            className="mx-auto"
                          />
                        </>
                      )}
                    </div>
                    {form.preferred_date && (
                      <p className="mt-2 text-[12px] text-brand-engine">
                        Kiválasztott nap telítettsége: {utilization.percentage}% ({utilization.bookedMinutes}/{utilization.totalMinutes} perc).
                      </p>
                    )}
                  
                  </Field>
                  <Field id="preferred_time" label="Preferált időpont *" error={errors.preferred_time}>
                    <select
                    id="preferred_time"
                    value={form.preferred_time}
                    onChange={(e) => setField('preferred_time', e.target.value)}
                    className={selectClass}>
                    
                      <option value="">
                        {form.preferred_date && form.service
                          ? availableTimes.length
                            ? 'Válasszon időpontot…'
                            : 'Ez a nap már betelt a kiválasztott szolgáltatásra.'
                          : 'Válasszon dátumot és szolgáltatást…'}
                      </option>
                      {(form.preferred_date && form.service ? availableTimes : TIME_SLOTS).map((time) =>
                    <option key={time} value={time}>
                          {time}
                        </option>
                    )}
                    </select>
                  </Field>
                </div>
              </fieldset>

              {serverError &&
            <p className="mt-6 rounded-lg bg-red-50 p-4 text-[14px] text-red-700">{serverError}</p>
            }

              <div className="mt-8 rounded-xl border border-brand-line bg-brand-sand p-4">
                <ConsentField
                id="consent"
                checked={form.consent}
                onChange={(value) => setField('consent', value)}
                error={errors.consent} />
              
              </div>

              <div className="mt-9 flex flex-col gap-4 border-t border-brand-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] leading-[1.5] text-brand-engine">
                  A beküldés nem jár fizetési kötelezettséggel.
                </p>
                <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-brand-ember px-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-shadow hover:shadow-[0_0_0_4px_rgba(249,115,22,0.2)] disabled:cursor-not-allowed disabled:opacity-60">
                
                  {submitting ? 'Küldés folyamatban…' : 'Időpontkérés elküldése'}
                </button>
              </div>
            </form>

            <aside className="h-fit rounded-2xl border border-brand-line bg-brand-sand p-7 shadow-[0_24px_60px_-50px_rgba(11,31,58,0.6)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-ember/30 bg-white">
                <ShieldCheck className="h-5 w-5 text-brand-ember" strokeWidth={1.7} />
              </span>
              <h2 className="mt-4 font-heading text-[18px] font-semibold text-brand">
                Hogyan működik?
              </h2>
              <ol className="mt-4 space-y-3 text-[14px] leading-[1.6] text-brand-engine">
                <li>1. Kitölti az űrlapot, és elküldi a kérést.</li>
                <li>2. Munkatársunk átnézi, és felveszi Önnel a kapcsolatot.</li>
                <li>kl</li>
              </ol>
              <p className="mt-6 rounded-lg border border-brand-line bg-white p-4 text-[13px] leading-[1.6] text-brand-engine">
                Ez időpontkérelem, nem garantált foglalás. A visszaigazolást telefonon vagy e-mailben
                küldjük.
              </p>
              <p className="mt-4 text-[13px] text-brand-engine">
                Inkább telefonálna?{' '}
                <a href={telHref(cegadat.phone)} className="font-semibold text-brand underline">
                  {cegadat.phone}
                </a>{' '}
                (minta szám)
              </p>
            </aside>
          </div>
        }
      </section>
    </>);

}