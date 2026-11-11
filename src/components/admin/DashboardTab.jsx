import { useEffect, useState } from 'react';
import { CalendarClock, Inbox, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDateHu, formatDateTimeHu } from '@/lib/booking';
import { STATUS_STYLES } from '@/lib/status';
import { useAdminAccess } from './AdminGate';

export default function DashboardTab({ onOpenRequests, onOpenAccess }) {
  const { isOwner } = useAdminAccess();
  const [stats, setStats] = useState({ newCount: 0, total: 0, inProgress: 0 });
  const [latest, setLatest] = useState([]);
  const [pendingAccess, setPendingAccess] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      base44.entities.Idopontkeres.count({ status: 'Új' }),
      base44.entities.Idopontkeres.count(),
      base44.entities.Idopontkeres.count({ status: 'Folyamatban' }),
      base44.entities.Idopontkeres.filter({}, { sort: '-created_date', limit: 5 }),
    ])
      .then(([newCount, total, inProgress, page]) => {
        if (!active) return;
        setStats({ newCount, total, inProgress });
        setLatest(page.items || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    let active = true;
    base44.functions
      .invoke('accessRequest', { action: 'pendingCount' })
      .then((response) => {
        if (active) setPendingAccess(response.data?.count || 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOwner, loading]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-[15px] text-brand-engine">
        <Loader2 className="h-4 w-4 animate-spin" /> Betöltés…
      </div>
    );
  }

  const cards = [
    { label: 'Új időpontkérések', value: stats.newCount, accent: 'text-brand-ember' },
    { label: 'Összes kérés', value: stats.total, accent: 'text-brand' },
    { label: 'Folyamatban lévő', value: stats.inProgress, accent: 'text-blue-600' },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-brand-silver bg-white p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-engine">
              {card.label}
            </p>
            <p className={`mt-3 font-heading text-[34px] font-semibold leading-none ${card.accent}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {isOwner && (
        <button
          type="button"
          onClick={onOpenAccess}
          className="mt-4 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-silver bg-white px-6 py-4 text-left hover:border-brand/40"
        >
          <span className="flex items-center gap-2 text-[14px] font-semibold text-brand">
            <ShieldCheck className="h-4 w-4 text-brand-ember" />
            Hozzáférési kérelmek
          </span>
          <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[13px] font-semibold text-orange-700">
            {pendingAccess} jóváhagyásra vár
          </span>
        </button>
      )}

      <div className="mt-8 rounded-xl border border-brand-silver bg-white">
        <div className="flex items-center justify-between border-b border-brand-silver px-6 py-4">
          <h2 className="flex items-center gap-2 font-heading text-[16px] font-semibold text-brand">
            <CalendarClock className="h-4 w-4 text-brand-ember" />
            Legutóbbi 5 kérés
          </h2>
          <button
            type="button"
            onClick={onOpenRequests}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-ember"
          >
            Összes <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {latest.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Inbox className="mx-auto h-8 w-8 text-brand-silver" />
            <p className="mt-3 text-[15px] text-brand-engine">Még nem érkezett időpontkérés.</p>
          </div>
        ) : (
          <ul className="divide-y divide-brand-silver">
            {latest.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-brand">
                    {request.customer_name} · {request.license_plate}
                  </p>
                  <p className="mt-1 text-[13px] text-brand-engine">
                    {request.service} · {formatDateHu(request.preferred_date)}{' '}
                    {request.preferred_time} · beérkezett: {formatDateTimeHu(request.created_date)}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                    STATUS_STYLES[request.status] || 'border-brand-silver bg-white text-brand'
                  }`}
                >
                  {request.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}