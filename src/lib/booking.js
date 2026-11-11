export const TIME_SLOTS = (() => {
  const out = [];
  for (let h = 8; h <= 17; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 17) out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

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