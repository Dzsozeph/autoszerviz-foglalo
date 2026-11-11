import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { APP_URL, sendTemplateEmail } from '../../shared/access.ts';
import { cegAdatEmailVars, getCegAdat } from '../../shared/cegadat.ts';

const STATUSES = ['Új', 'Folyamatban', 'Jóváhagyva', 'Elutasítva', 'Lezárva'];

const TEMPLATES = {
  Folyamatban: {
    template: 'StatuszFolyamatban',
    subject: 'Időpontkérése feldolgozás alatt van',
  },
  Jóváhagyva: {
    template: 'StatuszJovahagyva',
    subject: 'Időpontkérése jóváhagyva',
  },
  Elutasítva: {
    template: 'StatuszElutasitva',
    subject: 'Időpontkérésével kapcsolatos tájékoztatás',
  },
  Lezárva: {
    template: 'StatuszLezarva',
    subject: 'Köszönjük, hogy minket választott',
  },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const status = typeof body.status === 'string' ? body.status.trim() : '';
    if (!id || !STATUSES.includes(status)) {
      return Response.json({ error: 'invalid_input' }, { status: 400 });
    }

    const record = await base44.asServiceRole.entities.Idopontkeres.get(id).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!record) return Response.json({ error: 'not_found' }, { status: 404 });

    // Ugyanarra a státuszváltásra nem megy ki kétszer e-mail.
    if (record.status === status) {
      return Response.json({
        ok: true,
        status,
        unchanged: true,
        emailSent: false,
        emailSkipped: true,
      });
    }

    const entry = TEMPLATES[status];
    const alreadyNotified = record.notified_status === status;

    const patch = { status };
    if (entry) patch.notified_status = status;
    await base44.asServiceRole.entities.Idopontkeres.update(id, patch);

    if (!entry || alreadyNotified || !record.email) {
      return Response.json({ ok: true, status, emailSent: false, emailSkipped: true });
    }

    const cegadat = await getCegAdat(base44);

    const result = await sendTemplateEmail(base44, {
      to: record.email,
      template: entry.template,
      subject: entry.subject,
      variables: {
        ...cegAdatEmailVars(cegadat),
        customer_name: record.customer_name || '',
        service: record.service || '',
        car: `${record.car_brand || ''} ${record.car_model || ''}`.trim(),
        license_plate: record.license_plate || '',
        preferred: `${record.preferred_date || ''} ${record.preferred_time || ''}`.trim(),
        app_url: APP_URL,
      },
    });

    if (!result.ok) {
      console.error('Státusz értesítő e-mail nem ment ki', {
        request: id,
        status,
        template: entry.template,
        reason: result.error,
      });
    }

    return Response.json({
      ok: true,
      status,
      emailSent: result.ok,
      emailError: result.ok ? null : 'send_failed',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}