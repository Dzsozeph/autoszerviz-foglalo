import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const requestFields = [
  'id',
  'customer_name',
  'email',
  'phone',
  'car_brand',
  'car_model',
  'license_plate',
  'service',
  'problem_description',
  'preferred_date',
  'preferred_time',
  'status',
  'created_date',
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) =>
      error.status === 401 ? null : Promise.reject(error)
    );
    if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const requestsByUser = user.id
      ? await base44.asServiceRole.entities.Idopontkeres.filter(
          { user_id: user.id },
          { sort: '-created_date', limit: 100 }
        )
      : { items: [] };
    const requestsByEmail = email
      ? await base44.asServiceRole.entities.Idopontkeres.filter(
          { email },
          { sort: '-created_date', limit: 100 }
        )
      : { items: [] };
    const customers = email
      ? await base44.asServiceRole.entities.Ugyfel.filter({ email }, { limit: 1 })
      : { items: [] };
    const customer = (customers.items || customers)[0];

    const requests = new Map();
    for (const request of [
      ...(requestsByUser.items || requestsByUser),
      ...(requestsByEmail.items || requestsByEmail),
    ]) {
      if (request?.id) {
        requests.set(
          request.id,
          Object.fromEntries(requestFields.map((field) => [field, request[field]]))
        );
      }
    }

    return Response.json({
      profile: {
        email,
        name: customer?.name || user.full_name || user.name || '',
        phone: customer?.phone || '',
      },
      requests: [...requests.values()].sort((a, b) =>
        (b.created_date || '').localeCompare(a.created_date || '')
      ),
    });
  } catch (error) {
    console.error('Profiladatok betöltési hiba', { message: error?.message });
    return Response.json({ error: 'profile_load_failed' }, { status: 500 });
  }
}
