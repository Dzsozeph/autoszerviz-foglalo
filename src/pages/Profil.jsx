
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CarFront,
  Download,
  FileText,
  Loader2,
  LogOut,
  UserRound,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatDateHu } from '@/lib/booking';
import { STATUS_STYLES } from '@/lib/status';
import usePageMeta from '@/lib/usePageMeta';

function InfoCard({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-[0_20px_50px_-40px_rgba(11,31,58,0.5)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-sand text-brand-ember">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="font-heading text-[18px] font-semibold text-brand">
          {title}
        </h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function Profil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('appointments');

  usePageMeta({
    title: 'Profilom – Profi Autószerviz',
    description: 'Saját adatok és időpontkérések megtekintése.',
    path: '/profil',
  });

  useEffect(() => {
    let active = true;

    base44.functions
      .invoke('getMyProfile', {})
      .then((response) => {
        if (!active) return;

        const data = response.data || {};

        if (data.error) throw new Error(data.error);

        setProfile(data.profile || null);
        setRequests(data.requests || []);
        setInvoices(data.invoices || []);
      })
      .catch(() => {
        if (active) {
          setError(
            'A profiladatok betöltése nem sikerült. Próbálja újra később.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const displayName =
    profile?.name || user?.full_name || user?.name || 'Ügyfél';

  const email = profile?.email || user?.email || '';

  const handleLogout = () => {
    setProfile(null);
    setRequests([]);
    setInvoices([]);
    setError('');
    logout(false);
    navigate('/', { replace: true });
  };

  const navigationItems = [
    {
      id: 'profile',
      label: 'Fiókadataim',
      icon: UserRound,
    },
    {
      id: 'invoices',
      label: 'Számláim',
      icon: FileText,
    },
    {
      id: 'appointments',
      label: 'Időpontjaim',
      icon: CalendarClock,
    },
  ];

  return (
    <>
      {/* Fejléc */}
      <div className="container-page py-8 sm:py-12">
        <div className="relative overflow-hidden border border-brand-line bg-brand-orange px-5 py-7 shadow-[0_20px_50px_-35px_#9E4B10] sm:px-10 sm:py-10">
          <div className="flex items-center justify-between gap-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-ember">
                Saját fiók
              </p>

              <h1 className="mt-3 font-heading text-3xl font-bold text-brand sm:text-4xl">
                Üdvözöljük
                {displayName !== 'Ügyfél' ? `, ${displayName}` : ''}!
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-brand-engine sm:text-base">
                Itt megtekintheti a fiókjához tartozó adatokat,
                időpontkéréseit és számláit.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg ring-1 ring-brand-line sm:h-24 sm:w-24">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profilkép"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-heading text-2xl font-bold text-brand-ember sm:text-4xl">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigáció és tartalom */}
      <section className="container-page pb-12 sm:pb-16">

        {/* Három navigációs gomb minden képernyőméreten felül */}
        <div className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-pressed={isActive}
                className={`flex min-h-[40px] flex-col items-center justify-center gap-1  border p-2 text-center transition-all ${
                  isActive
                    ? 'border-brand-ember bg-brand-ember text-white shadow-md'
                    : 'border-brand-line bg-white text-brand hover:bg-brand-sand'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-semibold">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fiókadatok */}
        {activeSection === 'profile' && (
          <div className="animate-in fade-in duration-200">
            <InfoCard icon={UserRound} title="Fiókadataim">
              <dl className="space-y-5">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-brand-engine">
                    Név
                  </dt>
                  <dd className="mt-1 text-base text-brand">
                    {displayName}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-brand-engine">
                    E-mail-cím
                  </dt>
                  <dd className="mt-1 break-all text-base text-brand">
                    {email || '–'}
                  </dd>
                </div>

                {profile?.phone && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-widest text-brand-engine">
                      Telefonszám
                    </dt>
                    <dd className="mt-1 text-base text-brand">
                      {profile.phone}
                    </dd>
                  </div>
                )}
              </dl>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-8 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border border-brand-line px-5 text-sm font-semibold text-brand transition hover:bg-brand-silver/50 sm:w-auto"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Kilépés
              </button>
            </InfoCard>
          </div>
        )}

        {/* Számlák */}
        {activeSection === 'invoices' && (
          <div className="animate-in fade-in duration-200">
            <InfoCard icon={FileText} title="Számláim">
              {loading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-brand-engine">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Betöltés…
                </div>
              ) : error ? (
                <p className="text-sm leading-6 text-brand-engine">
                  A számlák jelenleg nem tölthetők be.
                </p>
              ) : invoices.length === 0 ? (
                <p className="py-4 text-sm leading-6 text-brand-engine">
                  Ehhez az e-mail-címhez még nem tartozik számla.
                </p>
              ) : (
                <ul className="divide-y divide-brand-silver">
                  {invoices.map((invoice) => (
                    <li
                      key={invoice.id}
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-brand">
                            {invoice.invoice_number || 'Számla'}
                          </p>

                          <span className="mt-1 inline-flex rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-800">
                            Minta · nem hivatalos
                          </span>

                          <p className="mt-1 text-sm text-brand-engine">
                            {invoice.service || 'Szerviz szolgáltatás'}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            invoice.status === 'sent'
                              ? 'border-green-200 bg-green-50 text-green-800'
                              : invoice.status === 'failed'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-brand-line bg-brand-silver text-brand'
                          }`}
                        >
                          {invoice.status === 'sent'
                            ? 'Elküldve'
                            : invoice.status === 'failed'
                              ? 'Küldés sikertelen'
                              : 'Kiállítva'}
                        </span>
                      </div>

                      <p className="mt-4 text-base font-bold text-brand">
                        {Number(invoice.amount || 0).toLocaleString('hu-HU')}{' '}
                        {invoice.currency || 'HUF'}
                      </p>

                      <p className="mt-1 text-xs text-brand-engine">
                        Nettó{' '}
                        {Number(invoice.net_amount || 0).toLocaleString('hu-HU')}{' '}
                        Ft · ÁFA{' '}
                        {Number(invoice.vat_amount || 0).toLocaleString('hu-HU')}{' '}
                        Ft
                      </p>

                      {invoice.items?.length > 0 && (
                        <ul className="mt-3 space-y-2 text-xs text-brand-engine">
                          {invoice.items.map((item, index) => (
                            <li
                              key={`${invoice.id}-${index}`}
                              className="flex justify-between gap-3"
                            >
                              <span>
                                {item.name} · {item.quantity} {item.unit} ·{' '}
                                {Math.round(Number(item.vat_rate) * 100)}% ÁFA
                              </span>
                              <span className="shrink-0">
                                {Number(item.gross_amount || 0).toLocaleString('hu-HU')}{' '}
                                Ft
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {invoice.notes && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-5 text-brand-engine">
                          {invoice.notes}
                        </p>
                      )}

                      {invoice.status === 'failed' && invoice.last_email_error && (
                        <p className="mt-2 text-sm text-red-700">
                          E-mail küldési hiba: {invoice.last_email_error}
                        </p>
                      )}

                      {invoice.pdf_url ? (
                        <a
                          href={invoice.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-brand-ember px-5 text-sm font-semibold text-white transition hover:opacity-90 sm:inline-flex"
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                          Minta PDF megnyitása
                        </a>
                      ) : (
                        <p className="mt-3 text-xs text-brand-engine">
                          {invoice.pdf_error
                            ? 'A PDF-link most nem érhető el. Frissítse az oldalt, vagy lépjen kapcsolatba az ügyfélszolgálattal.'
                            : 'Ehhez a régebbi számlához nem tartozik letölthető PDF.'}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </InfoCard>
          </div>
        )}

        {/* Időpontok */}
        {activeSection === 'appointments' && (
          <div className="animate-in fade-in duration-200">
            <InfoCard icon={CalendarClock} title="Időpontkéréseim">
              {loading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-brand-engine">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Betöltés…
                </div>
              ) : error ? (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </p>
              ) : requests.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarClock className="mx-auto h-10 w-10 text-brand-silver" aria-hidden="true" />

                  <p className="mt-4 text-sm text-brand-engine">
                    Még nincs a fiókjához tartozó időpontkérés.
                  </p>

                  <Link
                    to="/idopont"
                    className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand-ember px-6 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Időpontot kérek
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-brand-silver">
                  {requests.map((request) => (
                    <li
                      key={request.id}
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-brand">
                            {request.service || 'Szervizkérés'}
                          </p>

                          <p className="mt-1 text-sm text-brand-engine">
                            {formatDateHu(request.preferred_date)} ·{' '}
                            {request.preferred_time || '–'}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            STATUS_STYLES[request.status] ||
                            'border-brand-line bg-brand-silver text-brand'
                          }`}
                        >
                          {request.status || 'Feldolgozás alatt'}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm text-brand-engine">
                        <CarFront className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>
                          {[request.car_brand, request.car_model]
                            .filter(Boolean)
                            .join(' ') || 'Autóadat nincs megadva'}
                          {request.license_plate
                            ? ` · ${request.license_plate}`
                            : ''}
                        </span>
                      </div>

                      {request.problem_description && (
                        <p className="mt-3 text-sm leading-6 text-brand-engine">
                          {request.problem_description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <Link
                to="/idopont"
                className="mt-6 flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-brand-ember px-5 text-sm font-semibold text-brand-ember transition hover:bg-brand-sand"
              >
                Új időpontot kérek
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </InfoCard>
          </div>
        )}

      </section>
    </>
  );
}
