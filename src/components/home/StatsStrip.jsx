
import { useEffect, useRef, useState } from 'react';

const STATS = [
  { value: 12, suffix: '+', label: 'év műhelytapasztalat' },
  { value: 4000, suffix: '+', label: 'elvégzett javítás' },
  { value: 6, suffix: '', label: 'fő szakterület' },
  { value: 1, suffix: ' nap', label: 'átlagos visszajelzés' },
];

function AnimatedNumber({ value, suffix = '', duration = 1800, start }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let animationFrame;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Lassuló animáció a végén
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setCount(Math.floor(easedProgress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [start, value, duration]);

  const formattedValue = count.toLocaleString('hu-HU');

  return (
    <>
      {formattedValue}{suffix}
    </>
  );
}

export default function StatsStrip() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-brand-cream">
      <div className="container-page grid grid-cols-2 gap-px overflow-hidden bg-brand-line sm:grid-cols-4">
        {STATS.map((s, index) => (
          <div
            key={s.label}
            className="bg-brand-cream px-6 py-7 text-center sm:py-8"
          >
            <p className="font-heading text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight text-brand">
              <AnimatedNumber
                value={s.value}
                suffix={s.suffix}
                start={isVisible}
                duration={1800 + index * 150}
              />
            </p>
            <p className="mt-1 text-[13px] uppercase tracking-[0.12em] text-brand-engine">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
