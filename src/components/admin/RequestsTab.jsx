import { useCallback, useEffect, useState } from 'react';
import { Search, Loader2, Inbox, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusSelect from './StatusSelect';
import RequestDetail from './RequestDetail';
import { STATUSES } from '@/lib/status';
import { formatDateHu } from '@/lib/booking';

const ALL = 'Mind';

export default function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const query = statusFilter === ALL ? {} : { status: statusFilter };
    try {
      const page = await base44.entities.Idopontkeres.filter(query, {
        sort: '-created_date',
        limit: 100,
      });
      setRequests(page.items || []);
      setError('');
    } catch (err) {
      setError('A kérések betöltése nem sikerült. Próbálja újra később.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id, status) => {
    const previous = requests;
    setRequests((rows) =>
      statusFilter !== ALL && status !== statusFilter
        ? rows.filter((row) => row.id !== id)
        : rows.map((row) => (row.id === id ? { ...row, status } : row))
    );
    setSelected((current) => (current && current.id === id ? { ...current, status } : current));
    setFeedback(null);
    try {
      const response = await base44.functions.invoke('updateRequestStatus', { id, status });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      setError('');
      if (data.emailSent) {
        setFeedback({
          type: 'success',
          text: 'Státusz módosítva, e-mail elküldve az ügyfélnek.',
        });
      } else if (data.emailSkipped) {
        setFeedback({ type: 'success', text: 'Státusz módosítva.' });
      } else {
        setFeedback({
          type: 'warning',
          text: 'Státusz módosítva, de az értesítő e-mailt nem sikerült elküldeni.',
        });
      }
    } catch (err) {
      setRequests(previous);
      setError('A státusz mentése nem sikerült. Próbálja újra.');
      load();
    }
  };

  const visible = requests.filter((request) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      (request.customer_name || '').toLowerCase().includes(needle) ||
      (request.license_plate || '').toLowerCase().includes(needle)
    );
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[ALL, ...STATUSES].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`min-h-[38px] rounded-full border px-4 text-[13px] font-semibold transition-colors ${
                statusFilter === status
                  ? 'border-brand bg-brand text-white'
                  : 'border-brand-silver bg-white text-brand-engine hover:border-brand/40'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-engine/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés név vagy rendszám szerint"
            aria-label="Keresés név vagy rendszám szerint"
            className="h-11 w-full rounded-full border border-brand-silver bg-white pl-9 pr-4 text-[14px] text-brand outline-none focus:border-brand-ember"
          />
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-700">{error}</p>}
      {feedback && (
        <p
          className={`mt-4 rounded-lg p-3 text-[13px] ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-brand-silver bg-white">
        {loading ? (
          <div className="flex items-center gap-2 px-6 py-12 text-[15px] text-brand-engine">
            <Loader2 className="h-4 w-4 animate-spin" /> Betöltés…
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Inbox className="mx-auto h-8 w-8 text-brand-silver" />
            <p className="mt-3 text-[15px] text-brand-engine">
              Nincs a szűrésnek megfelelő időpontkérés.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-brand-silver">
            {visible.map((request) => (
              <li
                key={request.id}
                className="grid gap-3 px-5 py-4 sm:grid-cols-[1.2fr_1.3fr_1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-brand">
                    {request.customer_name}
                  </p>
                  <a
                    href={`tel:${request.phone}`}
                    className="text-[13px] text-brand-engine hover:text-brand-ember"
                  >
                    {request.phone}
                  </a>
                </div>
                <div className="min-w-0 text-[13px] text-brand-engine">
                  <p className="truncate font-medium text-brand">
                    {request.car_brand} {request.car_model}
                  </p>
                  <p>{request.license_plate}</p>
                </div>
                <div className="min-w-0 text-[13px] text-brand-engine">
                  <p className="truncate">{request.service}</p>
                  <p>
                    {formatDateHu(request.preferred_date)} {request.preferred_time}
                  </p>
                </div>
                <StatusSelect
                  value={request.status}
                  onChange={(status) => changeStatus(request.id, status)}
                />
                <button
                  type="button"
                  onClick={() => setSelected(request)}
                  className="inline-flex min-h-[38px] items-center gap-1 justify-self-start rounded-full border border-brand-silver px-4 text-[13px] font-semibold text-brand hover:border-brand/50 sm:justify-self-end"
                >
                  Részletek <ChevronRight className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <RequestDetail
        request={selected}
        onClose={() => setSelected(null)}
        onStatusChange={changeStatus}
        onNoteSaved={(note) =>
          setRequests((rows) =>
            rows.map((row) => (row.id === selected?.id ? { ...row, internal_note: note } : row))
          )
        }
      />
    </div>
  );
}