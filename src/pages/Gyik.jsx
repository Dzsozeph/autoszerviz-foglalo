import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/public/PageHeader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Gyik() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    base44.entities.GyikKerdes.filter({ active: true }, { sort: 'order', limit: 50 })
      .then((page) => {
        if (active) setFaqs(page.items || []);
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
        eyebrow="GYIK"
        title="Gyakori kérdések"
        intro="Összegyűjtöttük, amit a leggyakrabban kérdeznek tőlünk az időpontkérésről, az árakról és a javítás menetéről."
      />

      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
          <div>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg border border-brand-silver bg-slate-50" />
                ))}
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border-brand-silver">
                    <AccordionTrigger className="py-5 text-left font-heading text-[17px] font-semibold text-brand hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-[15px] leading-[1.65] text-brand-engine">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <aside className="h-fit rounded-xl border border-brand-line bg-brand-sand p-7">
            <h2 className="font-heading text-[19px] font-semibold text-brand">
              Nem találta a választ?
            </h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-brand-engine">
              Kérjen időpontot online, vagy hívjon minket a nyitvatartási időben. Munkatársunk
              szívesen segít.
            </p>
            <Link
              to="/idopont"
              className="mt-6 flex min-h-[48px] items-center justify-center rounded-full bg-brand-ember px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-white"
            >
              Időpontot kérek
            </Link>
            <Link
              to="/kapcsolat"
              className="mt-3 flex min-h-[48px] items-center justify-center rounded-full border border-brand px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-brand hover:bg-brand hover:text-white"
            >
              Kapcsolat
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}