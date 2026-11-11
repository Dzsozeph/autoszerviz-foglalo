import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SERVICE_ICONS } from '@/lib/serviceIcons';

export default function ServicesGrid({ services = [] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-brand-line bg-brand-line shadow-[0_24px_60px_-48px_rgba(11,31,58,0.5)] sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => {
        const Icon = SERVICE_ICONS[service.icon] || SERVICE_ICONS.wrench;
        return (
          <article key={service.id || service.name} className="flex flex-col bg-white p-7 sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand text-brand-ember">
              <Icon className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <h3 className="mt-6 font-heading text-[20px] font-semibold tracking-tight text-brand">
              {service.name}
            </h3>
            <p className="mt-3 flex-1 text-[15px] leading-[1.6] text-brand-engine">
              {service.short_description}
            </p>
            <Link
              to={`/idopont?szolgaltatas=${encodeURIComponent(service.name)}`}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-brand-ember hover:text-brand"
            >
              Időpontot kérek
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        );
      })}
    </div>
  );
}