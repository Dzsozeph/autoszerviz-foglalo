import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/public/PageHeader';
import { SERVICE_ICONS } from '@/lib/serviceIcons';

export default function Szolgaltatasok() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    base44.entities.Szolgaltatas.filter({ active: true }, { sort: 'order', limit: 50 })
      .then((page) => {
        if (active) setServices(page.items || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Szolgáltatások"
        title="Minden fontos javítás egy helyen"
        intro="Az olajcserétől a műszaki vizsgára felkészítésig a műhelyünkben márkafüggetlenül dolgozunk. Válassza ki a szükséges szolgáltatást, és kérjen időpontot néhány perc alatt."
      />

      <section className="container-page py-14 sm:py-20">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl border border-brand-silver bg-slate-50" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="rounded-xl border border-brand-silver bg-slate-50 p-8 text-center text-[15px] text-brand-engine">
            Jelenleg nincs megjeleníthető szolgáltatás. Kérjük, nézzen vissza később, vagy hívjon minket telefonon.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((service, index) => {
              const Icon = SERVICE_ICONS[service.icon] || SERVICE_ICONS.repair;
              return (
                <article
                  key={service.id}
                  className="group flex flex-col rounded-xl border border-brand-silver bg-white p-7 transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(11,31,58,0.45)] sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand text-brand-ember">
                      <Icon className="h-6 w-6" strokeWidth={1.6} />
                    </span>
                    <span className="font-mono text-[12px] tracking-[0.2em] text-brand-engine/60">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h2 className="mt-6 font-heading text-[22px] font-semibold tracking-tight text-brand">
                    {service.name}
                  </h2>
                  <p className="mt-3 flex-1 text-[15px] leading-[1.65] text-brand-engine">
                    {service.short_description}
                  </p>
                  <Link
                    to={`/idopont?szolgaltatas=${encodeURIComponent(service.name)}`}
                    className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand-ember px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-shadow hover:shadow-[0_0_0_4px_rgba(249,115,22,0.2)] sm:self-start"
                  >
                    Időpontot kérek
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}