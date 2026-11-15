import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) =>
      error.status === 401 ? null : Promise.reject(error)
    );
    if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'forbidden' }, { status: 403 });

    const page = await base44.asServiceRole.entities.Idopontkeres.list('-preferred_date', 1000);
    const requests = page?.items || page || [];
    return Response.json({ requests: Array.isArray(requests) ? requests : [] });
  } catch (error) {
    console.error('Naptári foglalások betöltése nem sikerült', { message: error?.message });
    return Response.json({ error: 'calendar_load_failed' }, { status: 500 });
  }
}
