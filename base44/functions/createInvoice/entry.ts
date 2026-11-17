import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VAT_RATES = [0, 0.05, 0.18, 0.27];

function makeInvoiceNumber() {
  const today = new Date();
  return `TESZT-${today.getFullYear()}-${String(today.getTime()).slice(-6)}`;
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

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalizeItems(rawItems, fallbackService, fallbackAmount) {
  const source = Array.isArray(rawItems) && rawItems.length > 0
    ? rawItems
    : [{ name: fallbackService, quantity: 1, unit: 'db', grossUnitPrice: fallbackAmount, vatRate: 0.27, type: 'munkadij' }];
  const items = [];

  for (const rawItem of source) {
    const name = sanitizeText(rawItem?.name, '');
    const quantity = Number(rawItem?.quantity ?? 1);
    const grossUnitPrice = Number(rawItem?.grossUnitPrice ?? rawItem?.price ?? 0);
    const unit = sanitizeText(rawItem?.unit, 'db');
    let vatRate = Number(rawItem?.vatRate ?? 0.27);
    if (vatRate > 1) vatRate /= 100;

    if (
      !name ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(grossUnitPrice) ||
      grossUnitPrice < 0 ||
      !VAT_RATES.includes(vatRate)
    ) {
      return { error: 'Érvénytelen számlatétel: ellenőrizze a nevet, mennyiséget, árat és ÁFA-kulcsot.' };
    }

    const grossTotal = roundMoney(quantity * grossUnitPrice);
    const netTotal = roundMoney(grossTotal / (1 + vatRate));
    items.push({
      name,
      type: sanitizeText(rawItem?.type, 'egyeb'),
      quantity,
      unit,
      gross_unit_price: roundMoney(grossUnitPrice),
      vat_rate: vatRate,
      net_amount: netTotal,
      vat_amount: roundMoney(grossTotal - netTotal),
      gross_amount: grossTotal,
    });
  }

  const totals = items.reduce(
    (result, item) => ({
      net: roundMoney(result.net + item.net_amount),
      vat: roundMoney(result.vat + item.vat_amount),
      gross: roundMoney(result.gross + item.gross_amount),
    }),
    { net: 0, vat: 0, gross: 0 }
  );
  return { items, totals };
}

function pdfDataFromRequest(value) {
  const pdfBase64 = sanitizeText(value, '').replace(/^data:application\/pdf;base64,/i, '');
  if (!pdfBase64.startsWith('JVBER') || pdfBase64.length > 6_800_000) return '';
  return pdfBase64;
}

async function uploadPrivatePdf(base44, invoiceNumber, pdfBase64) {
  const binary = Uint8Array.from(atob(pdfBase64), (character) => character.charCodeAt(0));
  const file = new File([binary], `${invoiceNumber}-MINTA.pdf`, { type: 'application/pdf' });
  const result = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
  if (!result?.file_uri) {
    throw new Error('A számla PDF biztonságos tárolása nem sikerült.');
  }
  return result.file_uri;
}

function getInvoiceSummary(invoice, status = invoice.status) {
  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    email: invoice.email,
    status,
    amount: invoice.amount,
    net_amount: invoice.net_amount,
    vat_amount: invoice.vat_amount,
  };
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

    const existingPage = await base44.asServiceRole.entities.Szamla.filter(
      { booking_id: bookingId },
      { limit: 20 }
    );
    const existing = (existingPage?.items || existingPage || []).find((invoice) => invoice.booking_id === bookingId);
    if (existing?.status === 'sent' && existing.pdf_uri) {
      return Response.json({
        ok: true,
        invoice: getInvoiceSummary(existing),
        emailSent: true,
        emailStatus: 'already_sent',
      });
    }

    const finalCustomerName = customerName || sanitizeText(booking.customer_name, 'Ügyfél');
    const requestedItems = normalizeItems(
      body.items,
      sanitizeText(body.service, booking.service || 'Szerviz javítás'),
      Number.isFinite(amount) && amount > 0 ? amount : 0
    );
    if (requestedItems.error) {
      return Response.json({ error: 'invalid_items', message: requestedItems.error }, { status: 400 });
    }
    const { items, totals } = requestedItems;
    if (!totals.gross) {
      return Response.json({ error: 'invalid_amount', message: 'A számla bruttó összege nagyobb kell legyen nullánál.' }, { status: 400 });
    }

    const pdfBase64 = pdfDataFromRequest(body.pdfBase64);
    if (!pdfBase64) {
      return Response.json({
        error: 'invalid_pdf',
        message: 'A számla PDF nem készült el vagy túl nagy. Készítse el újra a számlát.',
      }, { status: 400 });
    }
    const pdfUri = await uploadPrivatePdf(
      base44,
      invoiceNumber,
      pdfBase64
    );

    const itemNames = items.map((item) => item.name);
    const invoiceData = {
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      customer_name: finalCustomerName,
      email,
      phone: sanitizeText(booking.phone, ''),
      service: itemNames.join(', '),
      items,
      amount: totals.gross,
      net_amount: totals.net,
      vat_amount: totals.vat,
      currency: 'HUF',
      status: 'issued',
      pdf_uri: pdfUri,
      notes: notes || `Foglalás: ${sanitizeText(booking.preferred_date, '')} ${sanitizeText(booking.preferred_time, '')}`.trim(),
      last_email_error: '',
    };

    const invoice = existing
      ? await base44.asServiceRole.entities.Szamla.update(existing.id, invoiceData)
      : await base44.asServiceRole.entities.Szamla.create(invoiceData);
    const invoiceNumberToSend = invoice.invoice_number;
    const formattedItems = items.map((item) => ({
      ...item,
      vat_percent: `${Math.round(item.vat_rate * 100)}%`,
      type_label: {
        alkatresz: 'Alkatrész',
        munkadij: 'Munkadíj',
        egyeb: 'Egyéb',
      }[item.type] || item.type,
    }));
    const textLines = formattedItems.map((item) =>
      `- ${item.type_label}: ${item.name} (${item.quantity} ${item.unit}, ${item.vat_percent} ÁFA): nettó ${item.net_amount.toLocaleString('hu-HU')} Ft, ÁFA ${item.vat_amount.toLocaleString('hu-HU')} Ft, bruttó ${item.gross_amount.toLocaleString('hu-HU')} Ft`
    );
    const plainBody = [
      `Tisztelt ${finalCustomerName}!`,
      '',
      `Csatolva küldjük a ${invoiceNumberToSend} azonosítójú demonstrációs számlamintát.`,
      '',
      ...textLines,
      '',
      `Nettó összesen: ${totals.net.toLocaleString('hu-HU')} Ft`,
      `ÁFA összesen: ${totals.vat.toLocaleString('hu-HU')} Ft`,
      `Fizetendő bruttó összeg: ${totals.gross.toLocaleString('hu-HU')} Ft`,
      notes ? `Megjegyzés: ${notes}` : '',
      '',
      'FIGYELEM: Ez egy demonstrációs minta, nem valódi számla és nem hivatalos bizonylat.',
      'Profi Autószerviz',
    ].filter(Boolean).join('\n');

    const htmlItems = formattedItems.map((item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(item.name)}<br><small>${escapeHtml(item.type_label)}</small></td>
        <td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">${item.quantity} ${escapeHtml(item.unit)}</td>
        <td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">${item.vat_percent}</td>
        <td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">${item.net_amount.toLocaleString('hu-HU')} Ft</td>
        <td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">${item.vat_amount.toLocaleString('hu-HU')} Ft</td>
        <td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">${item.gross_amount.toLocaleString('hu-HU')} Ft</td>
      </tr>`).join('');
    const htmlBody = `
      <div style="font-family:Arial,sans-serif;color:#112641;max-width:720px;margin:auto">
        <div style="background:#112641;color:#fff;padding:22px;border-radius:12px 12px 0 0">
          <strong style="font-size:20px">PROFI AUTÓSZERVIZ</strong>
          <div style="margin-top:5px">Demonstrációs számlaminta · ${escapeHtml(invoiceNumberToSend)}</div>
        </div>
        <div style="padding:22px;border:1px solid #dfe5ec">
          <p>Tisztelt ${escapeHtml(finalCustomerName)}!</p>
          <p>Csatolva küldjük a számlamintát PDF formátumban.</p>
          <div style="background:#fff4e8;border:1px solid #f1c9a7;padding:12px;border-radius:8px;color:#93420e">
            <strong>MINTA – NEM VALÓDI SZÁMLA</strong><br>
            Ez a dokumentum nem hivatalos bizonylat, könyvelési vagy adózási célra nem használható.
          </div>
          <table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:13px">
            <thead style="background:#f1f5f9"><tr>
              <th style="padding:8px;text-align:left">Tétel</th><th style="padding:8px;text-align:right">Menny.</th>
              <th style="padding:8px;text-align:right">ÁFA</th><th style="padding:8px;text-align:right">Nettó</th>
              <th style="padding:8px;text-align:right">ÁFA</th><th style="padding:8px;text-align:right">Bruttó</th>
            </tr></thead><tbody>${htmlItems}</tbody>
          </table>
          <p style="text-align:right;line-height:1.8">
            Nettó összesen: <strong>${totals.net.toLocaleString('hu-HU')} Ft</strong><br>
            ÁFA összesen: <strong>${totals.vat.toLocaleString('hu-HU')} Ft</strong><br>
            Fizetendő bruttó: <strong style="font-size:18px">${totals.gross.toLocaleString('hu-HU')} Ft</strong>
          </p>
          ${notes ? `<p><strong>Megjegyzés:</strong> ${escapeHtml(notes)}</p>` : ''}
        </div>
      </div>`;

    try {
      const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `Számlaminta ${invoiceNumberToSend} – nem hivatalos bizonylat`,
        text: plainBody,
        html: htmlBody,
        attachments: [{
          filename: `${invoiceNumberToSend}-MINTA.pdf`,
          content: pdfBase64,
        }],
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
        invoice: getInvoiceSummary(updatedInvoice || { ...invoice, status: 'sent' }, 'sent'),
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
        invoice: getInvoiceSummary(updatedInvoice || { ...invoice, status: 'failed' }, 'failed'),
        emailSent: false,
        emailStatus: 'failed',
        emailError: emailErrorMessage,
        message: 'A PDF elkészült és a számla rögzítve lett, de az e-mail küldése nem sikerült. A küldés újrapróbálható.',
      });
    }
  } catch (error) {
    console.error('Számla létrehozási hiba', { message: error?.message });
    return Response.json({ error: error.message || 'invoice_creation_failed' }, { status: 500 });
  }
}
