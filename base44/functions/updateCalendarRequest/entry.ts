import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { APP_URL, sendTemplateEmail } from '../../shared/access.ts';
import { CEGADAT_DEFAULTS, getCegAdat, cegAdatEmailVars } from '../../shared/cegadat.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9()\s-]{7,24}$/;
const CLOSED_STATUSES = ['Elutasítva', 'Lezárva'];
const TIMES = Array.from({ length: 19 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});
const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayInBudapest() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' });
}

function getOpeningRange(date, company) {
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const openingText = weekday === 0
    ? company.hours_sunday
    : weekday === 6
      ? company.hours_saturday
      : company.hours_weekdays;
  const match = String(openingText || '').match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  const pad = (time) => time.length === 4 ? `0${time}` : time;
  return { open: pad(match[1]), close: pad(match[2]) };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) =>
      error.status === 401 ? null : Promise.reject(error)
    );
    if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const updates = body.updates && typeof body.updates === 'object' && !Array.isArray(body.updates)
      ? body.updates
      : {};
    if (!id) return Response.json({ error: 'invalid_input' }, { status: 400 });

    const record = await base44.asServiceRole.entities.Idopontkeres.get(id).catch((error) =>
      error.status === 404 ? null : Promise.reject(error)
    );
    if (!record) return Response.json({ error: 'not_found' }, { status: 404 });

    const patch = {};
    const fields = {
      customer_name: 120,
      phone: 32,
      email: 254,
      car_brand: 60,
      car_model: 60,
      license_plate: 16,
      service: 80,
      problem_description: 2000,
    };
    for (const [field, max] of Object.entries(fields)) {
      if (Object.hasOwn(updates, field)) patch[field] = str(updates[field], max);
    }

    const preferredDate = Object.hasOwn(updates, 'preferred_date')
      ? str(updates.preferred_date, 10)
      : record.preferred_date;
    const preferredTime = Object.hasOwn(updates, 'preferred_time')
      ? str(updates.preferred_time, 5)
      : record.preferred_time;
    const scheduleChanged =
      preferredDate !== record.preferred_date || preferredTime !== record.preferred_time;
    if (Object.hasOwn(updates, 'preferred_date')) patch.preferred_date = preferredDate;
    if (Object.hasOwn(updates, 'preferred_time')) patch.preferred_time = preferredTime;

    const candidate = { ...record, ...patch };
    if (
      !candidate.customer_name ||
      !candidate.phone ||
      !PHONE_RE.test(candidate.phone) ||
      (candidate.email && !EMAIL_RE.test(candidate.email)) ||
      !candidate.service
    ) {
      return Response.json({ error: 'invalid_input' }, { status: 400 });
    }

    if (scheduleChanged) {
      if (
        !isValidDate(preferredDate) ||
        preferredDate < todayInBudapest() ||
        !TIMES.includes(preferredTime)
      ) {
        return Response.json({ error: 'invalid_schedule' }, { status: 400 });
      }

      const company = { ...CEGADAT_DEFAULTS, ...(await getCegAdat(base44)) };
      const hours = getOpeningRange(preferredDate, company);
      if (!hours || preferredTime < hours.open || preferredTime > hours.close) {
        return Response.json({ error: 'outside_business_hours' }, { status: 409 });
      }

      const sameTimePage = await base44.asServiceRole.entities.Idopontkeres.filter(
        { preferred_date: preferredDate, preferred_time: preferredTime },
        { limit: 1000 }
      );
      const sameTimeRequests = sameTimePage?.items || sameTimePage || [];
      const conflict = sameTimeRequests.some((item) =>
        item.id !== id && !CLOSED_STATUSES.includes(item.status)
      );
      if (conflict) return Response.json({ error: 'time_conflict' }, { status: 409 });
    }

    await base44.asServiceRole.entities.Idopontkeres.update(id, patch);
    const updated = { ...record, ...patch };
    let emailSent = false;
    let emailError = null;
    if (scheduleChanged && updated.email) {
      const company = { ...CEGADAT_DEFAULTS, ...(await getCegAdat(base44)) };
      const result = await sendTemplateEmail(base44, {
        to: updated.email,
        template: 'IdopontkeresAthelyezve',
        subject: 'Időpontkérésének időpontja módosult',
        variables: {
          ...cegAdatEmailVars(company),
          customer_name: updated.customer_name || '',
          service: updated.service || '',
          car: `${updated.car_brand || ''} ${updated.car_model || ''}`.trim(),
          license_plate: updated.license_plate || '',
          preferred: `${updated.preferred_date || ''} ${updated.preferred_time || ''}`.trim(),
          app_url: APP_URL,
        },
      });
      emailSent = result.ok;
      if (!result.ok) emailError = result.error || 'send_failed';
    }

    return Response.json({
      ok: true,
      request: updated,
      scheduleChanged,
      emailSent,
      emailSkipped: !scheduleChanged || !updated.email,
      emailError,
    });
  } catch (error) {
    console.error('Naptári foglalás módosítása nem sikerült', { message: error?.message });
    return Response.json({ error: 'calendar_update_failed' }, { status: 500 });
  }
}
