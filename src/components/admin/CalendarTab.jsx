import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Search,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCegAdat } from '@/components/CegAdatProvider';
import { openingHoursForDate } from '@/lib/cegadat';
import { getBookingUtilization, timeToMinutes } from '@/lib/booking';
import { STATUS_STYLES, STATUSES } from '@/lib/status';
import RequestDetail from './RequestDetail';

const VIEWS = [
  { key: 'day', label: 'Nap' },
  { key: 'week', label: 'Hét' },
  { key: 'month', label: 'Hónap' },
];
const WEEKDAYS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
const WEEKDAY_NAMES = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'];
const SLOT_TIMES = Array.from({ length: 19 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});
const ALL = 'Mindegyik';

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const fromDateKey = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const addDays = (date, amount) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};
const startOfWeek = (date) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
};
const monthGridStart = (date) => startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
const huDate = (date, options = {}) => date.toLocaleDateString('hu-HU', options);
const compactDate = (date) =>
  `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}.`;
const isTerminal = (request) => ['Elutasítva', 'Lezárva'].includes(request.status);
const capacityColor = (percentage) => percentage >= 100
  ? 'bg-red-100 text-red-800'
  : percentage >= 75
    ? 'bg-orange-100 text-orange-800'
    : percentage >= 40
      ? 'bg-amber-100 text-amber-800'
      : 'bg-emerald-100 text-emerald-800';

function Appointment({ request, onSelect, onDragStart, compact = false }) {
  return (
    <button
      type="button"
      draggable={!isTerminal(request)}
      onDragStart={(event) => onDragStart(event, request)}
      onClick={() => onSelect(request)}
      className={`w-full rounded-md border px-2 py-1 text-left text-[11px] leading-[1.35] transition-shadow hover:shadow-sm ${
        STATUS_STYLES[request.status] || 'border-brand-silver bg-white text-brand'
      } ${compact ? 'mb-1' : ''}`}
      title={`${request.customer_name} · ${request.preferred_time || 'időpont nélkül'} · ${request.service || ''}`}
    >
      <span className="block truncate font-bold">
        {request.preferred_time || '–'} · {request.customer_name || 'Névtelen ügyfél'}
      </span>
      <span className="block truncate">
        {[request.car_brand, request.car_model, request.license_plate].filter(Boolean).join(' · ')}
      </span>
      <span className="block truncate opacity-80">
        {request.service} · {request.status}
      </span>
    </button>
  );
}

function OpeningHours({ date, company }) {
  const hours = openingHoursForDate(dateKey(date), company);
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-brand-engine">
      <Clock3 className="h-3 w-3" />
      {hours ? `${hours.open}–${hours.close}` : 'Zárva'}
    </span>
  );
}

export default function CalendarTab() {
  const company = useCegAdat();
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [serviceFilter, setServiceFilter] = useState(ALL);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [dragged, setDragged] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingMove, setSavingMove] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [calendarResponse, servicePage] = await Promise.all([
        base44.functions.invoke('getCalendarRequests', {}),
        base44.entities.Szolgaltatas.filter({ active: true }, { sort: 'order', limit: 100 }),
      ]);
      const data = calendarResponse.data || {};
      if (data.error) throw new Error(data.error);
      setRequests(Array.isArray(data.requests) ? data.requests : []);
      setServices(servicePage.items || []);
      setError('');
    } catch (loadError) {
      setError('A naptári foglalások betöltése nem sikerült. Próbálja újra később.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('hu-HU');
    return requests.filter((request) => {
      if (statusFilter !== ALL && request.status !== statusFilter) return false;
      if (serviceFilter !== ALL && request.service !== serviceFilter) return false;
      if (!needle) return true;
      return [request.customer_name, request.license_plate]
        .some((value) => String(value || '').toLocaleLowerCase('hu-HU').includes(needle));
    });
  }, [requests, statusFilter, serviceFilter, search]);
  const serviceOptions = useMemo(
    () => [...new Set([
      ...services.map((service) => service.name),
      ...requests.map((request) => request.service),
    ].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'hu')),
    [services, requests]
  );

  const days = useMemo(() => {
    if (view === 'day') return [new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())];
    if (view === 'week') {
      const monday = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
    }
    const start = monthGridStart(anchor);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [view, anchor]);
  const visibleCount = filtered.filter((request) =>
    days.some((date) => dateKey(date) === request.preferred_date)
  ).length;

  const requestsOn = (date, time) => filtered
    .filter((request) =>
      request.preferred_date === dateKey(date) &&
      (time === undefined || (request.preferred_time || '') === time)
    )
    .sort((a, b) => (a.preferred_time || '').localeCompare(b.preferred_time || ''));
  const capacityOn = (date) => {
    const key = dateKey(date);
    const dayRequests = requests
      .filter((request) => request.preferred_date === key && !isTerminal(request))
      .map((request) => ({
        ...request,
        service: services.find((service) => service.name === request.service) || request.service,
      }));
    const { bookedMinutes } = getBookingUtilization({ date: key, requests: dayRequests });
    const hours = openingHoursForDate(key, company);
    if (!hours) return { bookedMinutes, totalMinutes: 0, percentage: 0, closed: true };
    const totalMinutes = timeToMinutes(hours.close) - timeToMinutes(hours.open);
    return {
      bookedMinutes,
      totalMinutes,
      percentage: totalMinutes > 0 ? Math.min(100, Math.round((bookedMinutes / totalMinutes) * 100)) : 0,
      closed: false,
    };
  };

  const shift = (direction) => {
    const next = new Date(anchor);
    if (view === 'day') next.setDate(next.getDate() + direction);
    else if (view === 'week') next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    setAnchor(next);
  };

  const periodLabel = view === 'day'
    ? huDate(anchor, { year: 'numeric', month: 'long', day: 'numeric' })
    : view === 'week'
      ? `${huDate(days[0], { month: 'long', day: 'numeric' })} – ${huDate(days[6], { month: 'long', day: 'numeric', year: 'numeric' })}`
      : huDate(anchor, { year: 'numeric', month: 'long' });

  const handleStatusChange = async (id, status) => {
    try {
      const response = await base44.functions.invoke('updateRequestStatus', { id, status });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      setRequests((current) => current.map((request) =>
        request.id === id ? { ...request, status } : request
      ));
      setSelected((current) => current?.id === id ? { ...current, status } : current);
      setFeedback(data.emailError
        ? 'A státusz módosult, de az értesítő e-mail küldése nem sikerült.'
        : data.unchanged
          ? 'A státusz nem változott, e-mailt nem küldtünk.'
          : data.emailSent
            ? 'A státusz módosult, az ügyfél értesítést kapott.'
            : 'A státusz módosult.');
      setError('');
    } catch (statusError) {
      setError('A státusz mentése nem sikerült. Próbálja újra.');
    }
  };

  const handleDragStart = (event, request) => {
    setDragged(request);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', request.id);
  };

  const moveRequest = async (request, date, time) => {
    if (!request || savingMove) return;
    const nextDate = dateKey(date);
    const nextTime = time || request.preferred_time;
    if (request.preferred_date === nextDate && request.preferred_time === nextTime) return;
    if (!window.confirm(
      `Áthelyezi ${request.customer_name} időpontkérését erre az időpontra: ${huDate(date)} ${nextTime}? Az ügyfél értesítést kap.`
    )) return;

    setSavingMove(true);
    setFeedback('');
    setError('');
    try {
      const response = await base44.functions.invoke('updateCalendarRequest', {
        id: request.id,
        updates: { preferred_date: nextDate, preferred_time: nextTime },
      });
      const data = response.data || {};
      if (data.error) {
        const message = {
          time_conflict: 'Erre az időpontra már van aktív foglalás.',
          outside_business_hours: 'A kiválasztott időpont a műhely nyitvatartásán kívül esik.',
          invalid_schedule: 'A kiválasztott időpont nem érvényes.',
        }[data.error] || 'Az áthelyezés nem sikerült.';
        throw new Error(message);
      }
      setRequests((current) => current.map((item) => item.id === request.id ? data.request : item));
      setSelected((current) => current?.id === request.id ? data.request : current);
      setFeedback(data.emailSent
        ? 'Az áthelyezés sikerült, az ügyfél e-mailben értesült.'
        : data.emailSkipped
          ? 'Az áthelyezés sikerült, de nincs megadva ügyfél-e-mail-cím.'
          : 'Az áthelyezés sikerült, de az értesítő e-mail küldése nem sikerült.');
    } catch (moveError) {
      setError(moveError.message || 'Az áthelyezés nem sikerült. Próbálja újra.');
    } finally {
      setSavingMove(false);
      setDragged(null);
    }
  };

  const dropHandler = (date, time) => (event) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    const request = requests.find((item) => item.id === id) || dragged;
    if (request) moveRequest(request, date, time);
    setDragged(null);
  };

  const handleRequestUpdated = (updated) => {
    if (!updated?.id) return;
    setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
  };

  const renderTimedView = () => (
    <div className="overflow-x-auto">
      <div className={`min-w-[760px] ${view === 'day' ? 'max-w-3xl' : ''}`}>
        <div className="grid border-b border-brand-silver" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(100px, 1fr))` }}>
          <div className="p-2" />
          {days.map((date, index) => {
            const capacity = capacityOn(date);
            return (
              <div key={dateKey(date)} className="border-l border-brand-silver px-2 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase text-brand-engine">
                  {view === 'week' ? WEEKDAY_NAMES[index] : WEEKDAY_NAMES[(date.getDay() + 6) % 7]}
                </p>
                <p className={`mt-1 text-[16px] font-semibold ${dateKey(date) === dateKey(new Date()) ? 'text-brand-ember' : 'text-brand'}`}>
                  {compactDate(date)}
                </p>
                <OpeningHours date={date} company={company} />
                {capacity.closed ? (
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Zárva</span>
                ) : (
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${capacityColor(capacity.percentage)}`}>
                    Telítettség {capacity.percentage}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(100px, 1fr))` }}>
          {SLOT_TIMES.map((time) => (
            <div key={time} className="contents">
              <div className="h-[66px] border-b border-brand-silver/70 pr-2 pt-1 text-right text-[11px] text-brand-engine">
                {time.endsWith(':00') ? time : ''}
              </div>
              {days.map((date) => {
                const hours = openingHoursForDate(dateKey(date), company);
                const isOpen = hours && time >= hours.open && time <= hours.close;
                return (
                  <div
                    key={`${dateKey(date)}-${time}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={dropHandler(date, time)}
                    className={`min-h-[66px] border-b border-l border-brand-silver/70 p-1 ${
                      isOpen ? 'bg-white' : 'bg-slate-100/80'
                    }`}
                    aria-label={`${huDate(date)} ${time}${isOpen ? '' : ', nyitvatartáson kívül'}`}
                  >
                    {requestsOn(date, time).map((request) => (
                      <Appointment
                        key={request.id}
                        request={request}
                        onSelect={setSelected}
                        onDragStart={handleDragStart}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-7 border-b border-brand-silver">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-brand-engine">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((date) => {
            const dayRequests = requestsOn(date);
            const capacity = capacityOn(date);
            return (
              <div
                key={dateKey(date)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={dropHandler(date, undefined)}
                className={`min-h-[118px] border-b border-r border-brand-silver p-1.5 ${
                  date.getMonth() === anchor.getMonth() ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-[12px] font-semibold ${dateKey(date) === dateKey(new Date()) ? 'text-brand-ember' : 'text-brand'}`}>
                    {date.getDate()}
                  </span>
                  <OpeningHours date={date} company={company} />
                </div>
                <div className={`mb-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  capacity.closed ? 'bg-slate-100 text-slate-600' : capacityColor(capacity.percentage)
                }`}>
                  {capacity.closed
                    ? 'Zárva'
                    : `Telítettség: ${capacity.percentage}% · ${capacity.bookedMinutes}/${capacity.totalMinutes} perc`}
                </div>
                {dayRequests.slice(0, 3).map((request) => (
                  <Appointment
                    key={request.id}
                    request={request}
                    onSelect={setSelected}
                    onDragStart={handleDragStart}
                    compact
                  />
                ))}
                {dayRequests.length > 3 && (
                  <p className="px-1 text-[10px] font-semibold text-brand-engine">
                    +{dayRequests.length - 3} további
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <section className="rounded-xl border border-brand-silver bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => shift(-1)} aria-label="Előző időszak" className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-silver text-brand hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setAnchor(new Date())} className="h-10 rounded-full border border-brand-silver px-4 text-[13px] font-semibold text-brand hover:bg-slate-50">
            Ma
          </button>
          <button type="button" onClick={() => shift(1)} aria-label="Következő időszak" className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-silver text-brand hover:bg-slate-50">
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-1 font-heading text-[18px] font-semibold capitalize text-brand">{periodLabel}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="calendar-date">Ugrás dátumra</label>
          <input
            id="calendar-date"
            type="date"
            value={dateKey(anchor)}
            onChange={(event) => event.target.value && setAnchor(fromDateKey(event.target.value))}
            className="h-10 rounded-lg border border-brand-silver px-3 text-[13px] text-brand"
          />
          <div className="flex rounded-full border border-brand-silver p-1" role="group" aria-label="Naptár nézet">
            {VIEWS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                aria-pressed={view === item.key}
                className={`min-h-[32px] rounded-full px-3 text-[12px] font-semibold ${
                  view === item.key ? 'bg-brand text-white' : 'text-brand-engine hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_1fr_1.4fr]">
        <label className="sr-only" htmlFor="calendar-status">Szűrés státusz szerint</label>
        <select
          id="calendar-status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-lg border border-brand-silver bg-white px-3 text-[13px] text-brand"
        >
          <option value={ALL}>Minden státusz</option>
          {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <label className="sr-only" htmlFor="calendar-service">Szűrés szolgáltatás szerint</label>
        <select
          id="calendar-service"
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
          className="h-10 rounded-lg border border-brand-silver bg-white px-3 text-[13px] text-brand"
        >
          <option value={ALL}>Minden szolgáltatás</option>
          {serviceOptions.map((service) => <option key={service} value={service}>{service}</option>)}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-engine/60" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ügyfél neve vagy rendszám"
            aria-label="Keresés ügyfélnév vagy rendszám alapján"
            className="h-10 w-full rounded-lg border border-brand-silver pl-9 pr-3 text-[13px] text-brand"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-brand-silver py-3">
        <span className="text-[11px] font-semibold text-brand-engine">Napi kapacitás:</span>
        {[
          ['bg-emerald-200', 'Alacsony 0–39%'],
          ['bg-amber-200', 'Közepes 40–74%'],
          ['bg-orange-300', 'Magas 75–99%'],
          ['bg-red-300', 'Betelt 100%'],
        ].map(([color, label]) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-brand-engine">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
          </span>
        ))}
        {STATUSES.map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5 text-[11px] text-brand-engine">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[status].split(' ')[1]}`} />
            {status}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-brand-engine">
          {visibleCount} időpontkérés ebben az időszakban · áthelyezés húzással
        </span>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-700">{error}</p>}
      {feedback && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-[13px] text-emerald-800">{feedback}</p>}
      {savingMove && <p className="mt-3 text-[12px] text-brand-engine">Időpont áthelyezése…</p>}

      <div className="mt-4 overflow-hidden rounded-lg border border-brand-silver">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[14px] text-brand-engine">
            <Loader2 className="h-4 w-4 animate-spin" /> Naptár betöltése…
          </div>
        ) : (
          <>
            {filtered.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-[13px] font-medium text-brand">Nincs megjeleníthető időpontkérés.</p>
                <p className="mt-1 text-[11px] text-brand-engine">A naptár ettől függetlenül a napi kapacitást mutatja.</p>
              </div>
            )}
            {view === 'month' ? renderMonthView() : renderTimedView()}
          </>
        )}
      </div>
      <p className="mt-3 text-[11px] text-brand-engine">
        Nyitvatartás: H–P {company.hours_weekdays} · Szo {company.hours_saturday} · V {company.hours_sunday || 'zárva'}.
        A szürke sávok nyitvatartáson kívüli időt jelölnek.
      </p>

      <RequestDetail
        request={selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        onRequestUpdated={handleRequestUpdated}
        services={services}
      />
    </section>
  );
}
