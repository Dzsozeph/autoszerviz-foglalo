import { Link } from 'react-router-dom';

export default function ConsentField({ id = 'consent', checked, onChange, error }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-[14px] leading-[1.55] text-brand">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-brand-ember"
        />
        <span>
          Elfogadom az{' '}
          <Link
            to="/adatkezeles"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-ember underline underline-offset-2"
          >
            adatkezelési tájékoztatót
          </Link>
          .
        </span>
      </label>
      {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}