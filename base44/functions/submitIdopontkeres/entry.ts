import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { APP_URL, getAdminRecipients, sendTemplateEmail, sendToAll } from '../../shared/access.ts';
import { cegAdatEmailVars, getCegAdat } from '../../shared/cegadat.ts';

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

const SERVICE_DURATION_DEFAULTS = {
  olaj: 60,
  gumi: 60,
  fek: 90,
  diagnosztika: 45,
  futomu: 90,
  javitas: 120,
  vizsga: 60,
  vizsgara: 60,
  szerviz: 60,
  ellenorzes: 45,
  feltetel: 60,
};

const normalizeServiceName = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getServiceDurationMinutes = (service) => {
  if (!service) return 60;
  if (typeof service === 'number') return service;
  if (typeof service === 'string') {
    const normalized = normalizeServiceName(service);
    for (const [key, duration] of Object.entries(SERVICE_DURATION_DEFAULTS)) {
      if (normalized.includes(key)) return duration;
    }
    return 60;
  }

  if (Number.isFinite(Number(service.estimated_duration_minutes))) {
    return Number(service.estimated_duration_minutes);
  }
  if (Number.isFinite(Number(service.duration_minutes))) {
    return Number(service.duration_minutes);
  }

  const normalized = normalizeServiceName(service.name || service.service || service.title || '');
  for (const [key, duration] of Object.entries(SERVICE_DURATION_DEFAULTS)) {
    if (normalized.includes(key)) return duration;
  }
  return 60;
};

const timeToMinutes = (value) => {
  if (!value || typeof value !== 'string') return 0;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) =>
      error.status === 401 ? null : Promise.reject(error)
    );
    if (!user?.id || !user.email) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const data = {
      customer_name: str(body.customer_name, 120),
      phone: str(body.phone, 32),
      email: user.email.trim().toLowerCase(),
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

    if (body.consent !== true) {
      errors.consent = 'Az adatkezelési tájékoztató elfogadása kötelező.';
    }

    if (Object.keys(errors).length > 0) {
      return Response.json({ error: 'validation_failed', fields: errors }, { status: 400 });
    }

    data.email = data.email.toLowerCase();

    const servicesPage = await base44.asServiceRole.entities.Szolgaltatas.filter({ active: true }, { limit: 100 });
    const services = servicesPage.items || servicesPage;
    if (!services.some((s) => s.name === data.service)) {
      return Response.json(
        { error: 'validation_failed', fields: { service: 'Válasszon egy érvényes szolgáltatást.' } },
        { status: 400 }
      );
    }

    const serviceDurationMinutes = getServiceDurationMinutes(
      services.find((service) => service.name === data.service) || data.service
    );
    const selectedStart = timeToMinutes(data.preferred_time);
    const selectedEnd = selectedStart + serviceDurationMinutes;
    if (selectedEnd > 17 * 60) {
      return Response.json(
        { error: 'validation_failed', fields: { preferred_time: 'A kiválasztott szolgáltatás nem fér el a műhely nyitvatartási idejébe.' } },
        { status: 400 }
      );
    }

    const existingBookingsPage = await base44.asServiceRole.entities.Idopontkeres.filter(
      { preferred_date: data.preferred_date },
      { limit: 1000 }
    );
    const existingBookings = existingBookingsPage.items || existingBookingsPage || [];
    const hasConflict = existingBookings.some((booking) => {
      if (!booking.preferred_time || booking.id === data.id) return false;
      if (['Elutasítva', 'Lezárva'].includes(booking.status)) return false;
      const bookingStart = timeToMinutes(booking.preferred_time);
      const bookingDuration = getServiceDurationMinutes(booking.service || '');
      const bookingEnd = bookingStart + bookingDuration;
      return selectedStart < bookingEnd && selectedEnd > bookingStart;
    });

    if (hasConflict) {
      return Response.json(
        { error: 'validation_failed', fields: { preferred_time: 'Ez az időpont már foglalt a kiválasztott szolgáltatásra.' } },
        { status: 400 }
      );
    }

    const requestData = {
      ...data,
      status: 'Új',
      user_id: user.id,
    };
    const request = await base44.asServiceRole.entities.Idopontkeres.create(requestData);

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
    const cegadat = await getCegAdat(base44);
    const shopVars = cegAdatEmailVars(cegadat);

    try {
      await sendToAll(
        base44,
        adminRecipients,
        'UjIdopontkeresAdmin',
        {
          ...shopVars,
          customer_name: data.customer_name,
          phone: data.phone,
          customer_email: data.email,
          car,
          license_plate: data.license_plate,
          service: data.service,
          preferred,
          problem_description: data.problem_description,
          admin_url: `${APP_URL}/admin?keres=${request.id}`,
        },
        `Új időpontkérés érkezett – ${data.customer_name}`
      );

      await sendTemplateEmail(base44, {
        to: data.email,
        template: 'IdopontkeresVisszaigazolas',
        variables: {
          ...shopVars,
          customer_name: data.customer_name,
          service: data.service,
          car,
          license_plate: data.license_plate,
          preferred,
          problem_description: data.problem_description,
          app_url: APP_URL,
        },
        subject: `Időpontkérését megkaptuk – ${cegadat.name}`,
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