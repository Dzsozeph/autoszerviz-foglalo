const STATS = [
  { value: '12+', label: 'év műhelytapasztalat' },
  { value: '4 000+', label: 'elvégzett javítás' },
  { value: '6', label: 'fő szakterület' },
  { value: '1 nap', label: 'átlagos visszajelzés' },
];

export default function StatsStrip() {
  return (
    <section className="bg-brand-cream">
      <div className="container-page grid grid-cols-2 gap-px overflow-hidden bg-brand-line sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-brand-cream px-6 py-7 text-center sm:py-8">
            <p className="font-heading text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight text-brand">
              {s.value}
            </p>
            <p className="mt-1 text-[13px] uppercase tracking-[0.12em] text-brand-engine">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}