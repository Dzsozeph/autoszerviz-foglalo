import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Hero from '@/components/public/Hero';
import SectionDivider from '@/components/public/SectionDivider';
import StatsStrip from '@/components/home/StatsStrip';
import IntroSection from '@/components/home/IntroSection';
import ServicesGrid from '@/components/home/ServicesGrid';
import WhyUs from '@/components/home/WhyUs';
import Testimonials from '@/components/home/Testimonials';
import CtaBand from '@/components/home/CtaBand';

export default function Home() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    let active = true;
    base44.entities.Szolgaltatas.filter({ active: true }, { sort: 'order', limit: 6 })
      .then((page) => {
        if (active) setServices(page.items || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Hero />
      <StatsStrip />
      <SectionDivider />
      <IntroSection />
      <SectionDivider />

      <section className="bg-brand-sand py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-ember">
                Szolgáltatások
              </p>
              <h2 className="mt-4 max-w-xl font-heading text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight tracking-tight text-brand">
                Amit a műhelyben elvégzünk
              </h2>
            </div>
            <Link
              to="/szolgaltatasok"
              className="inline-flex min-h-[44px] items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-brand hover:text-brand-ember"
            >
              Összes szolgáltatás
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10">
            <ServicesGrid services={services} />
          </div>
        </div>
      </section>

      <SectionDivider />
      <WhyUs />
      <SectionDivider />
      <Testimonials />
      <SectionDivider />
      <CtaBand />
    </>
  );
}