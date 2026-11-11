import { STATUSES, STATUS_STYLES } from '@/lib/status';

export default function StatusSelect({ value, onChange, disabled }) {
  return (
    <select
      aria-label="Státusz módosítása"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 cursor-pointer rounded-full border px-3 text-[13px] font-semibold outline-none disabled:opacity-60 ${
        STATUS_STYLES[value] || 'border-brand-silver bg-white text-brand'
      }`}
    >
      {STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}