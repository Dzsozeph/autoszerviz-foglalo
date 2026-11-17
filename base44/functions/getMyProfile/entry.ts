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
    const invoicesPage = email
      ? await base44.asServiceRole.entities.Szamla.filter(
          { email },
          { sort: '-created_date', limit: 20 }
        )
      : { items: [] };
    const customer = (customers.items || customers)[0];
    const invoices = await Promise.all((invoicesPage.items || invoicesPage)
      .filter((invoice) => invoice.email?.trim().toLowerCase() === email)
      .map(async (invoice) => {
        let pdfUrl = invoice.pdf_url || '';
        let pdfError = false;
        if (invoice.pdf_uri) {
          try {
            const signedFile = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
              file_uri: invoice.pdf_uri,
              expires_in: 3600,
            });
            if (!signedFile?.signed_url) {
              throw new Error('A fájlszolgáltatás nem adott vissza letöltési linket.');
            }
            pdfUrl = signedFile.signed_url;
          } catch (error) {
            pdfError = true;
            console.error('Számla PDF link létrehozása nem sikerült', {
              invoiceId: invoice.id,
              message: error?.message,
            });
          }
        }
        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name,
          service: invoice.service,
          amount: invoice.amount,
          net_amount: invoice.net_amount,
          vat_amount: invoice.vat_amount,
          items: invoice.items || [],
          currency: invoice.currency || 'HUF',
          status: invoice.status,
          pdf_url: pdfUrl,
          pdf_error: pdfError,
          notes: invoice.notes,
          sent_at: invoice.sent_at,
          last_email_error: invoice.last_email_error,
          created_date: invoice.created_date,
        };
      }));

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
      invoices,
    });
  } catch (error) {
    console.error('Profiladatok betöltési hiba', { message: error?.message });
    return Response.json({ error: 'profile_load_failed' }, { status: 500 });
  }
}
