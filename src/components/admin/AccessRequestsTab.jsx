import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, ShieldCheck, UserMinus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDateTimeHu } from '@/lib/booking';

const STATUS_STYLES = {
  'Jóváhagyásra vár': 'border-orange-300 bg-orange-50 text-orange-700',
  Jóváhagyva: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  Elutasítva: 'border-red-300 bg-red-50 text-red-700',
};

export default function AccessRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('accessRequest', { action: 'list' });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      setRequests(data.requests || []);
      setAdmins(data.admins || []);
      setError('');
    } catch (err) {
      setError('A kérelmek betöltése nem sikerült. Próbálja újra később.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id, action) => {
    setBusy(`${action}-${id}`);
    setFeedback(null);
    try {
      const response = await base44.functions.invoke('accessRequest', { action, id });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      setFeedback(
        data.emailSent
          ? {
              type: 'success',
              text:
                action === 'approve'
                  ? 'Hozzáférés jóváhagyva, e-mail elküldve a kérelmezőnek.'
                  : 'Kérelem elutasítva, e-mail elküldve a kérelmezőnek.',
            }
          : {
              type: 'warning',
              text: 'A döntést mentettük, de az értesítő e-mailt nem sikerült elküldeni.',
            }
      );
      await load();
    } catch (err) {
      setError('A művelet nem sikerült. Próbálja újra.');
    } finally {
      setBusy('');
    }
  };

  const revoke = async (email) => {
    if (!window.confirm(`Biztosan visszavonja ${email} admin hozzáférését?`)) return;
    setBusy(`revoke-${email}`);
    setFeedback(null);
    try {
      const response = await base44.functions.invoke('accessRequest', { action: 'revoke', email });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      setFeedback({ type: 'success', text: 'Az admin hozzáférése visszavonva.' });
      await load();
    } catch (err) {
      setError('A hozzáférés visszavonása nem sikerült. Próbálja újra.');
    } finally {
      setBusy('');
    }
  };

  const pending = requests.filter((request) => request.status === 'Jóváhagyásra vár');
  const decided = requests.filter((request) => request.status !== 'Jóváhagyásra vár');

  return (
    <div className="space-y-8">
      {error && <p className="rounded-lg bg-red-50 p-3 text-[13px] text-red-700">{error}</p>}
      {feedback && (
        <p
          className={`rounded-lg p-3 text-[13px] ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
          }`}
        >
          {feedback.text}
        </p>
      )}

      <section>
        <h2 className="flex items-center gap-2 font-heading text-[16px] font-semibold text-brand">
          <ShieldCheck className="h-4 w-4 text-brand-ember" />
          Jóváhagyásra váró kérelmek
          <span className="rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-[12px] font-semibold text-orange-700">
            {pending.length}
          </span>
        </h2>

        <div className="mt-4 overflow-hidden rounded-xl border border-brand-line bg-white">
          {loading ? (
            <div className="flex items-center gap-2 px-6 py-10 text-[15px] text-brand-engine">
              <Loader2 className="h-4 w-4 animate-spin" /> Betöltés…
            </div>
          ) : pending.length === 0 ? (
            <p className="px-6 py-10 text-center text-[15px] text-brand-engine">
              Jelenleg nincs jóváhagyásra váró kérelem.
            </p>
          ) : (
            <ul className="divide-y divide-brand-line">
              {pending.map((request) => (
                <li key={request.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-brand">{request.name}</p>
                    <p className="truncate text-[13px] text-brand-engine">{request.email}</p>
                  </div>
                  <div className="min-w-0 text-[13px] text-brand-engine">
                    <p className="truncate">{request.company}</p>
                    <p>{request.phone}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => decide(request.id, 'approve')}
                      disabled={!!busy}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-white disabled:opacity-60"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Jóváhagyás
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(request.id, 'reject')}
                      disabled={!!busy}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-brand-line px-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-brand hover:border-red-300 hover:text-red-700 disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" />
                      Elutasítás
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-[16px] font-semibold text-brand">Jóváhagyott adminok</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-brand-line bg-white">
          {admins.length === 0 ? (
            <p className="px-6 py-8 text-[15px] text-brand-engine">
              Még nincs jóváhagyott admin munkatárs.
            </p>
          ) : (
            <ul className="divide-y divide-brand-line">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-brand">{admin.name}</p>
                    <p className="truncate text-[13px] text-brand-engine">{admin.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revoke(admin.email)}
                    disabled={!!busy}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-brand-line px-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-brand hover:border-red-300 hover:text-red-700 disabled:opacity-60"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Hozzáférés visszavonása
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-[16px] font-semibold text-brand">Korábbi kérelmek</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-brand-line bg-white">
          {decided.length === 0 ? (
            <p className="px-6 py-8 text-[15px] text-brand-engine">Még nincs elbírált kérelem.</p>
          ) : (
            <ul className="divide-y divide-brand-line">
              {decided.map((request) => (
                <li
                  key={request.id}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-brand">{request.name}</p>
                    <p className="truncate text-[13px] text-brand-engine">{request.email}</p>
                  </div>
                  <div className="min-w-0 text-[13px] text-brand-engine">
                    <p className="truncate">{request.company}</p>
                    <p>{formatDateTimeHu(request.reviewed_date || request.created_date)}</p>
                  </div>
                  <span
                    className={`justify-self-start rounded-full border px-3 py-1 text-[12px] font-semibold sm:justify-self-end ${
                      STATUS_STYLES[request.status] || 'border-brand-line bg-white text-brand'
                    }`}
                  >
                    {request.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}