import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_MESSAGES = 12;
const MAX_CHARS = 800;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const history = incoming
      .filter((m) => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role))
      .slice(-MAX_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }));

    if (history.length === 0 || history[history.length - 1].role !== 'user') {
      return Response.json({ error: 'empty_message' }, { status: 400 });
    }

    const [servicesPage, faqsPage] = await Promise.all([
      base44.asServiceRole.entities.Szolgaltatas.filter({ active: true }, { sort: 'order', limit: 50 }),
      base44.asServiceRole.entities.GyikKerdes.filter({ active: true }, { sort: 'order', limit: 50 }),
    ]);
    const services = servicesPage.items || servicesPage;
    const faqs = faqsPage.items || faqsPage;

    const serviceList = services
      .map((s) => `- ${s.name}: ${s.short_description || ''}`)
      .join('\n');
    const faqList = faqs
      .map((f) => `K: ${f.question}\nV: ${f.answer}`)
      .join('\n\n');

    const transcript = history
      .map((m) => `${m.role === 'user' ? 'ÜGYFÉL' : 'ASSZISZTENS'}: ${m.content}`)
      .join('\n');

    const prompt = `Te a "Profi Autószerviz" virtuális asszisztense vagy, egy magyar nyelvű autószerviz weboldalán. Mindig magyarul, röviden (legfeljebb 120 szó), udvariasan és segítőkészen válaszolj.

SZIGORÚ SZABÁLYOK:
1. Soha ne találj ki árat, ne becsülj költséget, ne adj meg összeget. Árral kapcsolatos kérdésnél mondd: árajánlatot a szerviz munkatársa ad, telefonon (+36 1 234 5678 – minta szám) vagy az időpontkérő űrlapon keresztül.
2. Soha ne ígérj garantált javítási időt vagy határidőt. Legfeljebb annyit mondhatsz, hogy a szerviz a kérés beérkezése után visszajelez.
3. Soha ne állíts fel biztos diagnózist. Legfeljebb általánosan tájékoztathatsz a lehetséges okokról, és javasold a szervizben történő ellenőrzést.
4. Ha nem tudod a választ, vagy a kérdés nem kapcsolódik az autószervizhez, ajánld a telefonos kapcsolatfelvételt a +36 1 234 5678 számon (ez minta szám), vagy az időpontkérő űrlapot.
5. Csak autószerviz témában válaszolj: javítás, karbantartás, szolgáltatások, időpontkérés, nyitvatartás, kapcsolat. Más témában udvariasan tereld vissza a beszélgetést.
6. Soha ne mondd magadról, hogy ember vagy. Virtuális asszisztens vagy.
7. Ha az ügyfél időpontot szeretne, hívd fel a figyelmét az online időpontkérőre: az "Időpontot kérek" gombra kattintva az /idopont oldalon tud kérést küldeni. Ez időpontkérelem, nem azonnali foglalás.
8. Nyitvatartás: hétfő–péntek 8:00–17:00, szombat 8:00–12:00, vasárnap zárva. Cím (minta): 1117 Budapest, Minta utca 12.

SZOLGÁLTATÁSOK:
${serviceList || '(nincs adat)'}

GYAKORI KÉRDÉSEK ÉS VÁLASZOK (ezeket használd elsődlegesen):
${faqList || '(nincs adat)'}

EDDIGI BESZÉLGETÉS:
${transcript}

Válaszolj most az ügyfél utolsó üzenetére a fenti szabályok szerint. Csak a válasz szövegét írd le, ne címkézd.`;

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ reply: typeof reply === 'string' ? reply.trim() : String(reply || '') });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}