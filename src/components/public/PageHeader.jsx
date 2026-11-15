
export default function PageHeader({ eyebrow, title, intro, children, aside }) {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(313deg,rgb(216,118,61)_0%,rgba(0,0,0,1)_0%)] text-white">
      <div
        className={`container-page ${
          aside
            ? 'grid grid-cols-1 items-center gap-8 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.7fr] lg:gap-10'
            : 'py-14 sm:py-16'
        }`}
      >
        <div className="relative z-10 min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-ember">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-4 max-w-3xl font-heading text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight">
            {title}
          </h1>
          {intro && (
            <p className="mt-5 max-w-2xl text-[16px] leading-[1.65] text-white/75">
              {intro}
            </p>
          )}
          {children}
        </div>

        {aside && (
          <div className="relative min-w-0 w-full lg:translate-x-40">
            {aside}
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className="h-[2px] w-full bg-gradient-to-r from-brand-ember/0 via-brand-honey/70 to-brand-ember/0"
      />
    </section>
  );
}
