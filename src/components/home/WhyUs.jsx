import { Clock, Wrench, BadgeCheck, Cpu } from 'lucide-react';

const ITEMS = [
  {
    icon: Wrench,
    title: 'Tapasztalt szerelők',
    text: 'Több évtizedes műhelytapasztalat márkafüggetlenül, a klasszikus autóktól a legújabb modellekig.',
  },
  {
    icon: Clock,
    title: 'Gyors visszajelzés',
    text: 'Az időpontkéréseket munkanapokon rövid időn belül átnézzük és visszahívjuk Önt.',
  },
  {
    icon: BadgeCheck,
    title: 'Átlátható ügyintézés',
    text: 'A javítás előtt egyeztetjük a teendőket, hogy ne érje meglepetés a számlán.',
  },
  {
    icon: Cpu,
    title: 'Korszerű diagnosztika',
    text: 'Modern diagnosztikai eszközökkel keressük a hibát, találgatás helyett.',
  },
];

export default function WhyUs() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-ember">
            Miért válasszuk minket?
          </p>
          <h2 className="mt-4 font-heading text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight tracking-tight text-brand">
            Precíz munka, kiszámítható folyamat.
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-[1.65] text-brand-engine">
            A műhelyünkben minden javítás dokumentált folyamat szerint készül: állapotfelmérés,
            egyeztetés, javítás, ellenőrzés. Így Ön mindig tudja, mi történik az autójával.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl border border-brand-line bg-brand-line shadow-[0_20px_50px_-40px_rgba(11,31,58,0.55)] sm:grid-cols-2">
          {ITEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white p-7">
              <Icon className="h-6 w-6 text-brand-ember" strokeWidth={1.6} />
              <h3 className="mt-5 font-heading text-[17px] font-semibold text-brand">{title}</h3>
              <p className="mt-2 text-[15px] leading-[1.6] text-brand-engine">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}