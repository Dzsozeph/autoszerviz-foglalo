import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function makeInvoiceNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const serial = Number(String(today.getTime()).slice(-4));
  return `TESZT-${year}-${String(serial + 1).padStart(4, '0')}`;
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
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : '';
    const rawAmount = Number(body.amount ?? 47500);

    if (!bookingId) {
      return Response.json({ error: 'invalid_booking' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Idopontkeres.get(bookingId).catch((error) =>
      error.status === 404 ? null : Promise.reject(error)
    );

    if (!booking) {
      return Response.json({ error: 'booking_not_found' }, { status: 404 });
    }

    const existingPage = await base44.asServiceRole.entities.Szamla.filter(
      { booking_id: bookingId },
      { limit: 20 }
    );
    const existing = (existingPage?.items || existingPage || []).find((invoice) => invoice.booking_id === bookingId);
    if (existing) {
      return Response.json({
        ok: true,
        duplicate: true,
        invoice: existing,
      });
    }

    const customerName = String(booking.customer_name || 'Ügyfél').trim() || 'Ügyfél';
    const email = String(booking.email || '').trim().toLowerCase();
    const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 47500;

    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: 'missing_customer_email', message: 'Az ügyfél e-mail címe hiányzik vagy érvénytelen.' }, { status: 400 });
    }

    const invoiceNumber = makeInvoiceNumber();
    const pdfUrl = `https://example.test/invoices/${invoiceNumber}.pdf`;
    const invoiceData = {
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      customer_name: customerName,
      email,
      phone: booking.phone || '',
      service: booking.service || 'Szerviz szolgáltatás',
      amount,
      currency: 'HUF',
      status: 'issued',
      pdf_url: pdfUrl,
      notes: `Foglalás: ${booking.preferred_date || ''} ${booking.preferred_time || ''}`.trim(),
      sent_at: new Date().toISOString(),
    };

    const invoice = await base44.asServiceRole.entities.Szamla.create(invoiceData);

    const subject = `Számla – ${invoiceNumber}`;
    const body = [
      `Tisztelt ${customerName}!`,
      '',
      `A ${invoiceNumber} számlaszámmal kiállított számla a ${booking.service || 'szolgáltatás'} keretében érkezett.`,
      `Összeg: ${amount.toLocaleString('hu-HU')} Ft`,
      `PDF: ${pdfUrl}`,
      '',
      'Köszönjük, hogy minket választott!',
      'Profi Autószerviz',
    ].join('\n');

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body,
        html: `<p>Tisztelt ${customerName}!</p><p>${body.replace(/\n/g, '<br/>')}</p>`,
      });

      await base44.asServiceRole.entities.Szamla.update(invoice.id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      return Response.json({
        ok: true,
        invoice: {
          ...invoice,
          status: 'sent',
          sent_at: new Date().toISOString(),
        },
        emailSent: true,
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
