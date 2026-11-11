import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  APP_URL,
  SHOP,
  getAdminRecipients,
  sendTemplateEmail,
  sendToAll,
} from '../../shared/access.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9()\s-]{7,24}$/;

const TIMES = (() => {
  const out = [];
  for (let h = 8; h <= 17; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 17) out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const data = {
      customer_name: str(body.customer_name, 120),
      phone: str(body.phone, 32),
      email: str(body.email, 160),
      car_brand: str(body.car_brand, 60),
      car_model: str(body.car_model, 60),
      license_plate: str(body.license_plate, 16).toUpperCase(),
      service: str(body.service, 80),
      problem_description: str(body.problem_description, 2000),
      preferred_date: str(body.preferred_date, 10),
      preferred_time: str(body.preferred_time, 5),
    };

    const errors = {};
    if (!data.customer_name) errors.customer_name = 'Adja meg a nevét.';
    if (!PHONE_RE.test(data.phone)) errors.phone = 'Adjon meg egy érvényes telefonszámot.';
    if (!EMAIL_RE.test(data.email)) errors.email = 'Adjon meg egy érvényes e-mail-címet.';
    if (!data.car_brand) errors.car_brand = 'Adja meg az autó márkáját.';
    if (!data.car_model) errors.car_model = 'Adja meg az autó típusát.';
    if (!data.license_plate) errors.license_plate = 'Adja meg a rendszámot.';
    if (!data.service) errors.service = 'Válasszon szolgáltatást.';
    if (data.problem_description.length < 10) {
      errors.problem_description = 'Írja le röviden a hibát (legalább 10 karakter).';
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.preferred_date)) {
      errors.preferred_date = 'Válasszon egy napot.';
    } else if (data.preferred_date < today) {
      errors.preferred_date = 'Múltbeli dátumot nem lehet választani.';
    }

    if (!TIMES.includes(data.preferred_time)) {
      errors.preferred_time = 'Válasszon egy időpontot 8:00 és 17:00 között.';
    }

    if (Object.keys(errors).length > 0) {
      return Response.json({ error: 'validation_failed', fields: errors }, { status: 400 });
    }

    const servicesPage = await base44.asServiceRole.entities.Szolgaltatas.filter({ active: true }, { limit: 100 });
    const services = servicesPage.items || servicesPage;
    if (!services.some((s) => s.name === data.service)) {
      return Response.json(
        { error: 'validation_failed', fields: { service: 'Válasszon egy érvényes szolgáltatást.' } },
        { status: 400 }
      );
    }

    const request = await base44.asServiceRole.entities.Idopontkeres.create({
      ...data,
      status: 'Új',
    });

    // Ügyfél mentése: anonim beküldés soha nem módosít meglévő ügyfélrekordot
    const existingPage = await base44.asServiceRole.entities.Ugyfel.filter(
      { email: data.email.toLowerCase() },
      { limit: 1 }
    );
    const existing = existingPage.items || existingPage;
    if (existing.length === 0) {
      await base44.asServiceRole.entities.Ugyfel.create({
        name: data.customer_name,
        phone: data.phone,
        email: data.email.toLowerCase(),
      });
    }

    // Értesítő e-mailek: a hibát naplózzuk, a mentés akkor is sikeres marad
    const car = `${data.car_brand} ${data.car_model}`.trim();
    const preferred = `${data.preferred_date} ${data.preferred_time}`.trim();
    const adminRecipients = await getAdminRecipients(base44);

    try {
      await sendToAll(base44, adminRecipients, 'UjIdopontkeresAdmin', {
        customer_name: data.customer_name,
        phone: data.phone,
        customer_email: data.email,
        car,
        license_plate: data.license_plate,
        service: data.service,
        preferred,
        problem_description: data.problem_description,
        admin_url: `${APP_URL}/admin`,
      });

      await sendTemplateEmail(base44, {
        to: data.email,
        template: 'IdopontkeresVisszaigazolas',
        variables: {
          customer_name: data.customer_name,
          service: data.service,
          car,
          license_plate: data.license_plate,
          preferred,
          problem_description: data.problem_description,
          shop_phone: SHOP.phone,
          shop_email: SHOP.email,
          app_url: APP_URL,
        },
      });
    } catch (emailError) {
      console.error('Időpontkérés e-mail értesítés hiba', {
        message: emailError && emailError.message,
      });
    }

    return Response.json({ ok: true, id: request.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}