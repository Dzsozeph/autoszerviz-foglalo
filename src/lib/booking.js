export const BOOKING_START_HOUR = 8;
export const BOOKING_END_HOUR = 17;
export const BOOKING_DAY_MINUTES = (BOOKING_END_HOUR - BOOKING_START_HOUR) * 60;

export const TIME_SLOTS = (() => {
  const out = [];
  for (let h = BOOKING_START_HOUR; h <= BOOKING_END_HOUR; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    if (h < BOOKING_END_HOUR) out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

const DEFAULT_SERVICE_DURATIONS = {
  olaj: 60,
  gumi: 60,
  fek: 90,
  diagnosztika: 45,
  futomu: 90,
  javitas: 120,
  vizsga: 60,
  vizsgara: 60,
  szerviz: 60,
  ellenorzes: 45,
  feltetel: 60,
};

export const normalizeServiceName = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const getServiceDurationMinutes = (service) => {
  if (service == null) return 60;
  if (typeof service === 'number') return service;
  if (typeof service === 'string') {
    const normalized = normalizeServiceName(service);
    for (const [key, duration] of Object.entries(DEFAULT_SERVICE_DURATIONS)) {
      if (normalized.includes(key)) return duration;
    }
    return 60;
  }

  if (Number.isFinite(Number(service.estimated_duration_minutes))) {
    return Number(service.estimated_duration_minutes);
  }
  if (Number.isFinite(Number(service.duration_minutes))) {
    return Number(service.duration_minutes);
  }

  const serviceName = normalizeServiceName(service.name || service.service || service.title || '');
  for (const [key, duration] of Object.entries(DEFAULT_SERVICE_DURATIONS)) {
    if (serviceName.includes(key)) return duration;
  }
  return 60;
};

export const timeToMinutes = (value) => {
  if (!value || typeof value !== 'string') return 0;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

export const getAvailableBookingSlots = ({ date, service, requests = [] }) => {
  if (!date || !service) return [];

  const selectedDate = String(date);
  const durationMinutes = getServiceDurationMinutes(service);
  const conflicts = (Array.isArray(requests) ? requests : []).filter((request) => {
    if (request.preferred_date !== selectedDate) return false;
    if (['Elutasítva', 'Lezárva'].includes(request.status)) return false;
    return true;
  });

  return TIME_SLOTS.filter((slot) => {
    const startMinutes = timeToMinutes(slot);
    const endMinutes = startMinutes + durationMinutes;
    if (endMinutes > BOOKING_END_HOUR * 60) return false;

    return !conflicts.some((request) => {
      const requestedStart = timeToMinutes(request.preferred_time || '08:00');
      const requestedDuration = getServiceDurationMinutes(request.service || request);
      const requestedEnd = requestedStart + requestedDuration;
      return startMinutes < requestedEnd && endMinutes > requestedStart;
    });
  });
};

export const getBookingUtilization = ({ date, requests = [] }) => {
  if (!date) return { bookedMinutes: 0, totalMinutes: BOOKING_DAY_MINUTES, percentage: 0 };
  const selectedDate = String(date);
  const bookedMinutes = (Array.isArray(requests) ? requests : [])
    .filter((request) => request.preferred_date === selectedDate && !['Elutasítva', 'Lezárva'].includes(request.status))
    .reduce((sum, request) => sum + getServiceDurationMinutes(request.service || request), 0);

  const percentage = Math.min(100, Math.round((bookedMinutes / BOOKING_DAY_MINUTES) * 100));

  return {
    bookedMinutes,
    totalMinutes: BOOKING_DAY_MINUTES,
    percentage,
  };
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const formatDateHu = (iso) => (iso ? `${iso.slice(0, 10).replaceAll('-', '.')}.` : '–');

export const formatDateTimeHu = (iso) => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  return d.toLocaleString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};