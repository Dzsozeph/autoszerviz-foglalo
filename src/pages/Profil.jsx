import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, CarFront, FileText, Loader2, UserRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/public/PageHeader';
import { useAuth } from '@/lib/AuthContext';
import { formatDateHu } from '@/lib/booking';
import { STATUS_STYLES } from '@/lib/status';
import usePageMeta from '@/lib/usePageMeta';

function InfoCard({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-brand-line bg-white p-6 shadow-[0_20px_50px_-40px_rgba(11,31,58,0.5)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-sand text-brand-ember">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="font-heading text-[18px] font-semibold text-brand">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function Profil() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      })
      .catch(() => {
        if (active) setError('A profiladatok betöltése nem sikerült. Próbálja újra később.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const displayName = profile?.name || user?.full_name || user?.name || 'Ügyfél';
  const email = profile?.email || user?.email || '';

  return (
    <>
      <PageHeader
        eyebrow="Saját fiók"
        title={`Üdvözöljük${displayName !== 'Ügyfél' ? `, ${displayName}` : ''}!`}
        intro="Itt megtekintheti a fiókjához tartozó adatokat és az időpontkérései állapotát."
      />

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <InfoCard icon={UserRound} title="Fiókadatai">
              <dl className="space-y-4">
                <div>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-engine">
                    Név
                  </dt>
                  <dd className="mt-1 text-[15px] text-brand">{displayName}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-engine">
                    E-mail-cím
                  </dt>
                  <dd className="mt-1 break-all text-[15px] text-brand">{email || '–'}</dd>
                </div>
                {profile?.phone && (
                  <div>
                    <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-engine">
                      Telefonszám
                    </dt>
                    <dd className="mt-1 text-[15px] text-brand">{profile.phone}</dd>
                  </div>
                )}
              </dl>
              <button
                type="button"
                onClick={() => logout()}
                className="mt-6 min-h-[42px] rounded-full border border-brand-line px-5 text-[13px] font-semibold text-brand hover:bg-brand-silver/50"
              >
                Kilépés
              </button>
            </InfoCard>

            <InfoCard icon={FileText} title="Számlák">
              <p className="text-[14px] leading-6 text-brand-engine">
                A számlák online megjelenítése még nincs bekötve a rendszerbe. Amint a számlakezelés
                elérhető lesz, itt találja majd a dokumentumait.
              </p>
            </InfoCard>
          </div>

          <InfoCard icon={CalendarClock} title="Időpontkéréseim">
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-[14px] text-brand-engine">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Betöltés…
              </div>
            ) : error ? (
              <p role="alert" className="rounded-lg bg-red-50 p-4 text-[14px] text-red-700">
                {error}
              </p>
            ) : requests.length === 0 ? (
              <div className="py-6 text-center">
                <CalendarClock className="mx-auto h-8 w-8 text-brand-silver" aria-hidden="true" />
                <p className="mt-3 text-[14px] text-brand-engine">
                  Még nincs a fiókjához tartozó időpontkérés.
                </p>
                <Link
                  to="/idopont"
                  className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-ember px-5 text-[13px] font-semibold text-white hover:shadow-[0_0_0_4px_rgba(249,115,22,0.18)]"
                >
                  Időpontot kérek <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-brand-silver">
                {requests.map((request) => (
                  <li key={request.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-brand">{request.service || 'Szervizkérés'}</p>
                        <p className="mt-1 text-[13px] text-brand-engine">
                          {formatDateHu(request.preferred_date)} · {request.preferred_time || '–'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                          STATUS_STYLES[request.status] || 'border-brand-line bg-brand-silver text-brand'
                        }`}
                      >
                        {request.status || 'Feldolgozás alatt'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[13px] text-brand-engine">
                      <CarFront className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        {[request.car_brand, request.car_model].filter(Boolean).join(' ') || 'Autóadat nincs megadva'}
                        {request.license_plate ? ` · ${request.license_plate}` : ''}
                      </span>
                    </div>
                    {request.problem_description && (
                      <p className="mt-2 text-[13px] leading-5 text-brand-engine">
                        {request.problem_description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </InfoCard>
        </div>
      </section>
    </>
  );
}
