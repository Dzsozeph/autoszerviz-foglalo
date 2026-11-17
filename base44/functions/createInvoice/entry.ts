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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getItemsText(items, service, amount) {
  if (!Array.isArray(items) || items.length === 0) {
    return `- ${service}: ${amount.toLocaleString('hu-HU')} Ft`;
  }

  return items
    .map((item) => {
      const name = sanitizeText(item?.name, 'Tétel');
      const quantity = Number(item?.quantity ?? 1);
      const price = Number(item?.price ?? 0);
      return `- ${name}: ${Number.isFinite(quantity) ? quantity : 1} db × ${Number.isFinite(price) ? price.toLocaleString('hu-HU') : 0} Ft`;
    })
    .join('\n');
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
    if (existing?.status === 'sent') {
      return Response.json({
        ok: true,
        invoice: existing,
        emailSent: true,
        emailStatus: 'already_sent',
      });
    }

    const pdfUrl = sanitizeText(body.pdfUrl, '');
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
    };

    if (existing?.invoice_number) invoiceData.invoice_number = existing.invoice_number;
    const invoice = existing
      ? await base44.asServiceRole.entities.Szamla.update(existing.id, invoiceData)
      : await base44.asServiceRole.entities.Szamla.create(invoiceData);
    const invoiceEmail = sanitizeText(invoice.email, email).toLowerCase();
    const invoiceName = sanitizeText(invoice.customer_name, finalCustomerName);
    const invoiceService = sanitizeText(invoice.service, serviceName);
    const invoiceAmount = Number(invoice.amount);
    const invoiceNotes = sanitizeText(invoice.notes, '');
    const invoiceNumberToSend = sanitizeText(invoice.invoice_number, invoiceNumber);
    const itemLines = getItemsText(body.items, invoiceService, invoiceAmount);
    const plainBody = [
      `Tisztelt ${invoiceName}!`,
      '',
      `A ${invoiceNumberToSend} számú tesztszámla az alábbi javításról készült: ${invoiceService}.`,
      '',
      'Számlatételek:',
      itemLines,
      '',
      `Fizetendő összeg: ${invoiceAmount.toLocaleString('hu-HU')} Ft`,
      invoiceNotes ? `Megjegyzés: ${invoiceNotes}` : '',
      invoice.pdf_url ? `Dokumentum: ${invoice.pdf_url}` : '',
      '',
      'Ez teszt számla, nem hivatalos bizonylat.',
      'Profi Autószerviz',
    ].filter(Boolean).join('\n');

    const htmlBody = [
      `<p>Tisztelt ${escapeHtml(invoiceName)}!</p>`,
      `<p>A <strong>${escapeHtml(invoiceNumberToSend)}</strong> számú tesztszámla az alábbi javításról készült: <strong>${escapeHtml(invoiceService)}</strong>.</p>`,
      `<p><strong>Számlatételek:</strong><br/>${escapeHtml(itemLines).replaceAll('\n', '<br/>')}</p>`,
      `<p><strong>Fizetendő összeg:</strong> ${invoiceAmount.toLocaleString('hu-HU')} Ft</p>`,
      invoiceNotes ? `<p><strong>Megjegyzés:</strong> ${escapeHtml(invoiceNotes)}</p>` : '',
      invoice.pdf_url ? `<p><a href="${escapeHtml(invoice.pdf_url)}">Dokumentum megtekintése</a></p>` : '',
      '<p><strong>Ez teszt számla, nem hivatalos bizonylat.</strong></p>',
      '<p>Profi Autószerviz</p>',
    ].join('');

    try {
      const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
        to: invoiceEmail,
        subject: `Számla – ${invoiceNumberToSend}`,
        text: plainBody,
        html: htmlBody,
      });

      if (emailResult?.success === false || emailResult?.ok === false) {
        throw new Error(emailResult.reason || emailResult.error || 'A levelezőszolgáltató elutasította az e-mailt.');
      }

      const sentAt = new Date().toISOString();
      const updatedInvoice = await base44.asServiceRole.entities.Szamla.update(invoice.id, {
        status: 'sent',
        sent_at: sentAt,
        last_email_error: '',
      });

      return Response.json({
        ok: true,
        invoice: updatedInvoice || { ...invoice, status: 'sent', sent_at: sentAt },
        emailSent: true,
        emailStatus: 'sent',
      });
    } catch (emailError) {
      const emailErrorMessage = emailError?.message || 'Az e-mail küldése nem sikerült.';
      const updatedInvoice = await base44.asServiceRole.entities.Szamla.update(invoice.id, {
        status: 'failed',
        last_email_error: emailErrorMessage,
      });

      return Response.json({
        ok: false,
        invoice: updatedInvoice || { ...invoice, status: 'failed', last_email_error: emailErrorMessage },
        emailSent: false,
        emailStatus: 'failed',
        emailError: emailErrorMessage,
        message: 'A számla rögzítve, de az e-mail küldése nem sikerült. A küldés újrapróbálható.',
      });
    }
  } catch (error) {
    console.error('Számla létrehozási hiba', { message: error?.message });
    return Response.json({ error: error.message || 'invoice_creation_failed' }, { status: 500 });
  }
}
