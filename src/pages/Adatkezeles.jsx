import PageHeader from '@/components/public/PageHeader';
import { useCegAdat } from '@/components/CegAdatProvider';
import { telHref } from '@/lib/cegadat';
import usePageMeta from '@/lib/usePageMeta';

const SECTIONS = [
  {
    title: 'Az adatkezelő',
    body: [
      'Adatkezelő: Profi Autószerviz (minta adatkezelő, bemutató célú tartalom), székhely: 1117 Budapest, Minta utca 12., e-mail: info@profiautoszerviz.hu, telefon: +36 1 234 5678.',
      'Ez az adatkezelési tájékoztató minta szöveg: bemutató oldalról van szó, a valós működéshez a szerviz saját adataival és jogi ellenőrzéssel kell helyettesíteni.',
    ],
  },
  {
    title: 'Kezelt adatok köre',
    body: [
      'Időpontkérés esetén: név, telefonszám, e-mail-cím, az autó márkája, típusa és rendszáma, a kért szolgáltatás, a preferált nap és időpont, valamint a hiba leírása.',
      'Kapcsolati üzenet esetén: név, e-mail-cím és az üzenet szövege.',
      'A weboldal a hozzájárulás tényét és idejét is rögzítheti, hogy igazolható legyen az adatkezelés jogszerűsége.',
    ],
  },
  {
    title: 'Az adatkezelés célja és jogalapja',
    body: [
      'A megadott adatokat kizárólag az időpontkérés feldolgozása, a kapcsolatfelvétel, a szervizmunka egyeztetése és a kapcsolati üzenetek megválaszolása céljából kezeljük.',
      'A jogalap az érintett hozzájárulása, amelyet az űrlap elküldése előtt ad meg. A hozzájárulás bármikor visszavonható; a visszavonás nem érinti a korábbi adatkezelés jogszerűségét.',
    ],
  },
  {
    title: 'Megőrzési idő',
    body: [
      'Az időpontkérések és a kapcsolati üzenetek adatait a kérés lezárását követően legfeljebb 1 évig tároljuk, kivéve, ha jogszabály ennél hosszabb megőrzést ír elő (például számviteli kötelezettség esetén).',
      'A hozzájárulás visszavonása esetén az adatokat haladéktalanul töröljük, kivéve a jogszabály által kötelezően megőrzendő adatokat.',
    ],
  },
  {
    title: 'Adatfeldolgozók és adattovábbítás',
    body: [
      'Az adatok kezeléséhez tárhelyszolgáltatót és e-mail-küldő szolgáltatást veszünk igénybe. Adatot harmadik országba csak akkor továbbítunk, ha arra jogszabályi alap van, és a megfelelő garanciák biztosítottak.',
      'Az adatokat nem értékesítjük, és nem adjuk át marketingcélra harmadik félnek.',
    ],
  },
  {
    title: 'Az érintett jogai',
    body: [
      'Ön jogosult tájékoztatást kérni a kezelt adatairól, kérheti azok helyesbítését, törlését vagy kezelésük korlátozását, tiltakozhat az adatkezelés ellen, és kérheti az adatok hordozhatóságát.',
      'Kérelmét az info@profiautoszerviz.hu címen jelezheti; a kérést legkésőbb 30 napon belül megválaszoljuk. Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH) lehet élni.',
    ],
  },
];

export default function Adatkezeles() {
  const cegadat = useCegAdat();

  usePageMeta({
    title: 'Adatkezelési tájékoztató – Profi Autószerviz',
    description:
      'Minta adatkezelési tájékoztató: az időpontkérés és a kapcsolati űrlap során kezelt adatok köre, az adatkezelés célja, megőrzési idő és az érintett jogai.',
    path: '/adatkezeles',
  });

  return (
    <>
      <PageHeader
        eyebrow="Adatkezelés"
        title="Adatkezelési tájékoztató"
        intro="Az alábbi tájékoztató minta szöveg, amely bemutatja, hogyan kezeljük az időpontkérés és a kapcsolati űrlap során megadott adatokat."
      />

      <section className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-brand-line bg-brand-sand p-5 text-[14px] leading-[1.65] text-brand-engine">
            Minta oldal – bemutató célú. A tájékoztató szövege nem minősül jogi tanácsadásnak; a
            valós adatkezeléshez a szerviz saját adataival és jogi ellenőrzéssel szükséges
            helyettesíteni.
          </div>

          <div className="mt-10 space-y-10">
            {SECTIONS.map((section) => (
              <article key={section.title}>
                <h2 className="font-heading text-[21px] font-semibold tracking-tight text-brand">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-[15px] leading-[1.7] text-brand-engine">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}

            <article>
              <h2 className="font-heading text-[21px] font-semibold tracking-tight text-brand">
                Kapcsolat adatkezelési kérdésben
              </h2>
              <p className="mt-3 text-[15px] leading-[1.7] text-brand-engine">
                {cegadat.name} · {cegadat.address} · e-mail:{' '}
                <a href={`mailto:${cegadat.email}`} className="font-semibold text-brand underline">
                  {cegadat.email}
                </a>{' '}
                · telefon:{' '}
                <a href={telHref(cegadat.phone)} className="font-semibold text-brand underline">
                  {cegadat.phone}
                </a>
              </p>
              <p className="mt-2 text-[13px] text-brand-engine/80">
                A megadott elérhetőségek minta adatok.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}