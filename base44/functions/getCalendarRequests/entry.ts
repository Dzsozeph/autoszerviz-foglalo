import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const page = await base44.asServiceRole.entities.Idopontkeres.list('-preferred_date', 1000);
    const requests = page?.items || page || [];
    const publicRequests = (Array.isArray(requests) ? requests : []).map((request) => ({
      id: request.id,
      preferred_date: request.preferred_date,
      preferred_time: request.preferred_time,
      service: request.service,
      status: request.status,
    }));

    return Response.json({ requests: publicRequests });
  } catch (error) {
    console.error('Naptári foglalások betöltése nem sikerült', { message: error?.message });
    return Response.json({ error: 'calendar_load_failed' }, { status: 500 });
  }
}
