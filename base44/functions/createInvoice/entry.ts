import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function makeInvoiceNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const serial = Number(String(today.getTime()).slice(-4));
  return `TESZT-${year}-${String(serial + 1).padStart(4, '0')}`;
}

function sanitizeText(value, fallback = '') {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) =>
      error.status === 401 ? null : Promise.reject(error)
    );

    if (!user) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const bookingId = sanitizeText(body.bookingId, '');
    const amount = Number(body.amount ?? 0);
    const customerName = sanitizeText(body.customerName, '');
    const customerEmail = sanitizeText(body.customerEmail, '').toLowerCase();
    const invoiceNumber = sanitizeText(body.invoiceNumber, makeInvoiceNumber());
    const serviceName = sanitizeText(body.service, 'Szerviz javítás');
    const notes = sanitizeText(body.notes, '');

    if (!bookingId) {
      return Response.json({ error: 'invalid_booking', message: 'Hiányzó foglalás azonosító.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Idopontkeres.get(bookingId).catch((error) =>
      error.status === 404 ? null : Promise.reject(error)
    );

    if (!booking) {
      return Response.json({ error: 'booking_not_found', message: 'A foglalás nem található.' }, { status: 404 });
    }

    const email = customerEmail || sanitizeText(booking.email, '').toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: 'missing_customer_email', message: 'Az ügyfél e-mail címe hiányzik vagy érvénytelen.' }, { status: 400 });
    }

    const finalCustomerName = customerName || sanitizeText(booking.customer_name, 'Ügyfél');
    const finalAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
    if (!finalAmount) {
      return Response.json({ error: 'invalid_amount', message: 'A számla összege nagyobb kell legyen nullánál.' }, { status: 400 });
    }

    const existingPage = await base44.asServiceRole.entities.Szamla.filter(
      { booking_id: bookingId },
      { limit: 20 }
    );
    const existing = (existingPage?.items || existingPage || []).find((invoice) => invoice.booking_id === bookingId);
    if (existing) {
      return Response.json({ ok: true, duplicate: true, invoice: existing, emailSent: false });
    }

    const pdfUrl = sanitizeText(body.pdfUrl, `https://example.test/invoices/${invoiceNumber}.pdf`);
    const invoiceData = {
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      customer_name: finalCustomerName,
      email,
      phone: sanitizeText(booking.phone, ''),
      service: serviceName,
      amount: finalAmount,
      currency: 'HUF',
      status: 'issued',
      pdf_url: pdfUrl,
      notes: notes || `Foglalás: ${sanitizeText(booking.preferred_date, '')} ${sanitizeText(booking.preferred_time, '')}`.trim(),
      sent_at: new Date().toISOString(),
    };

    const invoice = await base44.asServiceRole.entities.Szamla.create(invoiceData);

    const itemLines = Array.isArray(body.items) && body.items.length > 0
      ? body.items
          .map((item) => {
            const name = sanitizeText(item?.name, 'Tétel');
            const quantity = Number(item?.quantity ?? 1);
            const price = Number(item?.price ?? 0);
            return `- ${name}: ${Number.isFinite(quantity) ? quantity : 1} db × ${Number.isFinite(price) ? price.toLocaleString('hu-HU') : 0} Ft`;
          })
          .join('\n')
      : `- ${serviceName}: ${finalAmount.toLocaleString('hu-HU')} Ft`;

    const subject = `Számla – ${invoiceNumber}`;
    const plainBody = [
      `Tisztelt ${finalCustomerName}!`,
      '',
      `A ${invoiceNumber} számlaszámmal kiállított számla az alábbi javításért érkezett: ${serviceName}.`,
      '',
      'Számlatétel:',
      itemLines,
      '',
      `Fizetendő összeg: ${finalAmount.toLocaleString('hu-HU')} Ft`,
      `PDF megtekintése: ${pdfUrl}`,
      '',
      'Köszönjük a bizalmat!',
      'Profi Autószerviz',
    ].join('\n');

    const htmlBody = [
      `<p>Tisztelt ${finalCustomerName}!</p>`,
      `<p>A ${invoiceNumber} számlaszámmal kiállított számla az alábbi javításért érkezett: <strong>${serviceName}</strong>.</p>`,
      `<p><strong>Számlatétel:</strong><br/>${itemLines.replace(/\n/g, '<br/>')}</p>`,
      `<p><strong>Fizetendő összeg:</strong> ${finalAmount.toLocaleString('hu-HU')} Ft</p>`,
      `<p><a href="${pdfUrl}">PDF megtekintése</a></p>`,
      '<p>Köszönjük a bizalmat!<br/>Profi Autószerviz</p>',
    ].join('');

    try {
      const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body: plainBody,
        html: htmlBody,
      });

      const sendSuccessful = emailResult && emailResult.success !== false && emailResult.ok !== false;
      await base44.asServiceRole.entities.Szamla.update(invoice.id, {
        status: sendSuccessful ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
      });

      return Response.json({
        ok: true,
        invoice: {
          ...invoice,
          status: sendSuccessful ? 'sent' : 'failed',
          sent_at: new Date().toISOString(),
        },
        emailSent: sendSuccessful,
      });
    } catch (emailError) {
      await base44.asServiceRole.entities.Szamla.update(invoice.id, {
        status: 'failed',
        sent_at: new Date().toISOString(),
      });

      return Response.json({
        ok: false,
        invoice,
        emailSent: false,
        error: emailError?.message || 'email_failed',
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
