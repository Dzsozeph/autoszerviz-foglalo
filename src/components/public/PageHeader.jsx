export default function PageHeader({ eyebrow, title, intro, children }) {
  return (
    <section className="border-b border-white/10 bg-brand text-white">
      <div className="container-page py-14 sm:py-16">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-ember">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-4 max-w-3xl font-heading text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight">
          {title}
        </h1>
        {intro && <p className="mt-5 max-w-2xl text-[16px] leading-[1.65] text-white/75">{intro}</p>}
        {children}
      </div>
    </section>
  );
}