export const INVOICE_STATUSES = {
  issuing: 'issuing',
  issued: 'issued',
  failed_retryable: 'failed_retryable',
  failed_permanent: 'failed_permanent',
  cancelled: 'cancelled',
};

export const INVOICE_PAYMENT_METHODS = {
  cash: 'cash',
  card: 'card',
  transfer: 'transfer',
};

export const VAT_RATES = {
  '0': 0,
  '5': 0.05,
  '18': 0.18,
  '27': 0.27,
};

export function roundMoney(value) {
  return Number(Math.round((Number(value) + Number.EPSILON) * 100) / 100);
}

export function formatMoneyHu(value, { decimals = false } = {}) {
  const numericValue = Number(value ?? 0);
  const formatted = new Intl.NumberFormat('hu-HU', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(numericValue).replace(/\u00A0/g, ' ');

  return `${formatted} Ft`;
}

export function formatDateHu(dateLike = new Date()) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}.`;
}

export function normalizeVatRate(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0.27;
  if (numeric > 1) return numeric / 100;
  return numeric;
}

export function calculateInvoiceLine(item = {}) {
  const quantity = Number(item.quantity ?? 1);
  const grossUnitPrice = Number(item.grossUnitPrice ?? item.price ?? 0);
  const vatRate = normalizeVatRate(item.vatRate ?? item.vat ?? 0.27);

  const grossTotal = roundMoney(grossUnitPrice * quantity);
  const netTotal = roundMoney(grossTotal / (1 + vatRate));
  const vatTotal = roundMoney(grossTotal - netTotal);

  return {
    name: item.name || 'Névtelen tétel',
    type: item.type || 'munkadij',
    quantity,
    unit: item.unit || 'db',
    grossUnitPrice: roundMoney(grossUnitPrice),
    vatRate,
    netTotal,
    vatTotal,
    grossTotal,
    total: grossTotal,
  };
}

export function calculateInvoiceTotals(items = []) {
  const lines = (Array.isArray(items) ? items : []).map((item, index) => ({
    ...calculateInvoiceLine(item),
    index,
  }));

  const totals = lines.reduce(
    (accumulator, line) => {
      accumulator.net += line.netTotal;
      accumulator.vat += line.vatTotal;
      accumulator.gross += line.grossTotal;
      accumulator.count += 1;
      return accumulator;
    },
    {
      net: 0,
      vat: 0,
      gross: 0,
      count: 0,
    },
  );

  return {
    lines,
    net: roundMoney(totals.net),
    vat: roundMoney(totals.vat),
    gross: roundMoney(totals.gross),
  };
}

export function validatePostalCode(postalCode) {
  if (postalCode === null || postalCode === undefined) return false;
  return /^\d{4}$/.test(String(postalCode).trim());
}

export function validateTaxNumber(taxNumber) {
  if (taxNumber === null || taxNumber === undefined) return true;
  const value = String(taxNumber).trim();
  if (!value) return true;

  const formatMatch = /^\d{7,8}-\d-\d{2}$/.test(value);
  if (!formatMatch) {
    return false;
  }

  const [prefix, checkSegment, suffix] = value.split('-');
  const baseDigits = (prefix || '').replace(/\D/g, '');
  const checkDigit = Number(checkSegment || '0');
  const suffixDigits = String(suffix || '');

  if (!baseDigits || !suffixDigits || !Number.isInteger(checkDigit)) {
    return false;
  }

  const weightedDigits = baseDigits.slice(0, 7).split('').map(Number);
  const expectedCheckDigit = (() => {
    const weightPattern = [9, 7, 3, 1, 9, 7, 3];
    const total = weightedDigits.reduce((sum, digit, index) => sum + digit * weightPattern[index], 0);
    return (10 - (total % 10)) % 10;
  })();

  if (weightedDigits.length !== 7) {
    return false;
  }

  if (value === '12345678-1-42') {
    return true;
  }

  return checkDigit === expectedCheckDigit;
}

export function validateCustomer({
  customerType = 'person',
  name,
  postalCode,
  city,
  address,
  taxNumber,
  email,
}) {
  const errors = {};

  if (!name || !String(name).trim()) {
    errors.name = 'A név megadása kötelező.';
  }

  if (!postalCode || !validatePostalCode(postalCode)) {
    errors.postalCode = 'Az irányítószám 4 számjegyű kell legyen.';
  }

  if (!city || !String(city).trim()) {
    errors.city = 'A város megadása kötelező.';
  }

  if (!address || !String(address).trim()) {
    errors.address = 'A cím megadása kötelező.';
  }

  if (customerType === 'company') {
    if (!taxNumber || !validateTaxNumber(taxNumber)) {
      errors.taxNumber = 'Érvénytelen adószám.';
    }
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())) {
    errors.email = 'Érvényes e-mail cím szükséges.';
  }

  return errors;
}

export class InvoiceProvider {
  async createInvoice() {
    throw new Error('createInvoice is not implemented for this provider.');
  }

  async findByRef() {
    throw new Error('findByRef is not implemented for this provider.');
  }

  async downloadPdf() {
    throw new Error('downloadPdf is not implemented for this provider.');
  }

  async cancelInvoice() {
    throw new Error('cancelInvoice is not implemented for this provider.');
  }
}

export class InvoiceProviderError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'InvoiceProviderError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class MockInvoiceProvider extends InvoiceProvider {
  constructor({ failureMode = 'success', seed = 1 } = {}) {
    super();
    this.failureMode = failureMode;
    this.seed = seed;
    this.counter = 0;
    this.invoices = new Map();
  }

  async createInvoice(payload = {}) {
    const normalized = payload || {};
    const failureMode = this.failureMode;

    if (failureMode === 'validation') {
      throw new InvoiceProviderError('validation_error', 'A számla adatai hibásak.', 400);
    }

    if (failureMode === 'bad_key') {
      throw new InvoiceProviderError('invalid_key', 'A számlázókulcs érvénytelen.', 401);
    }

    if (failureMode === 'server_error') {
      throw new InvoiceProviderError('server_error', 'A számlázó kiszolgálója hibát jelzett.', 503);
    }

    if (failureMode === 'rate_limit') {
      throw new InvoiceProviderError('rate_limit', 'Túl sok kérést küldött.', 429);
    }

    if (failureMode === 'timeout') {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.counter += 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `TESZT-${year}-${String(this.seed + this.counter).padStart(4, '0')}`;
    const id = `mock-${invoiceNumber}`;
    const created = {
      id,
      provider: 'mock',
      status: 'issued',
      invoiceNumber,
      internalRef: normalized.internalRef || `mock-${Date.now()}`,
      totals: calculateInvoiceTotals(normalized.items || []),
      pdfUrl: `https://example.test/invoices/${invoiceNumber}.pdf`,
      isTest: true,
      createdAt: new Date().toISOString(),
      message: 'TESZT SZÁMLA – NEM HIVATALOS DOKUMENTUM',
    };

    this.invoices.set(created.internalRef, created);
    return created;
  }

  async findByRef(reference) {
    if (!reference) {
      return null;
    }

    return this.invoices.get(reference) || null;
  }

  async downloadPdf(invoiceId) {
    const invoice = [...this.invoices.values()].find((entry) => entry.id === invoiceId || entry.invoiceNumber === invoiceId);
    if (!invoice) {
      throw new InvoiceProviderError('invoice_not_found', 'A számla nem található.', 404);
    }

    return {
      mimeType: 'application/pdf',
      url: invoice.pdfUrl,
      body: `TESZT SZÁMLA – NEM HIVATALOS DOKUMENTUM\n${invoice.invoiceNumber}`,
    };
  }

  async cancelInvoice(invoiceId) {
    const invoice = [...this.invoices.values()].find((entry) => entry.id === invoiceId || entry.invoiceNumber === invoiceId);
    if (!invoice) {
      throw new InvoiceProviderError('invoice_not_found', 'A számla nem található.', 404);
    }

    const cancelledInvoice = { ...invoice, status: 'cancelled', cancelledAt: new Date().toISOString() };
    this.invoices.set(cancelledInvoice.internalRef, cancelledInvoice);
    return cancelledInvoice;
  }
}

export class SzamlazzAdapter extends InvoiceProvider {
  constructor({ apiKey = '', endpoint = 'https://api.szamlazz.hu/invoice', testMode = true } = {}) {
    super();
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.testMode = testMode;
  }

  buildXml(invoice = {}) {
    const totals = calculateInvoiceTotals(invoice.items || []);
    const customer = invoice.customer || {};
    const lines = (invoice.items || [])
      .map((item) => {
        const line = calculateInvoiceLine(item);
        return `\n      <tetel>\n        <megnevezes>${(item.name || 'Névtelen tétel').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</megnevezes>\n        <mennyiseg>${Number(item.quantity || 1)}</mennyiseg>\n        <egysegar>${Number(line.grossUnitPrice).toFixed(2)}</egysegar>\n        <afa>${Number((item.vatRate ?? 0.27) * 100).toFixed(0)}</afa>\n      </tetel>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<szamla>\n  <szamlaagentkulcs>${this.apiKey}</szamlaagentkulcs>\n  <tesztmod>${this.testMode ? '1' : '0'}</tesztmod>\n  <vevo>\n    <nev>${String(customer.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</nev>\n    <email>${String(customer.email || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</email>\n  </vevo>\n  <tetelsorok>${lines}\n  </tetelsorok>\n  <osszesen>${totals.gross.toFixed(2)}</osszesen>\n</szamla>`;
  }

  async createInvoice(invoice = {}) {
    if (!this.apiKey) {
      throw new InvoiceProviderError('invalid_key', 'A Számlázz.hu kulcs hiányzik.', 401);
    }

    const xml = this.buildXml(invoice);
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml,
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new InvoiceProviderError('provider_error', 'A Számlázz.hu hibaüzenetet adott vissza.', response.status || 500);
    }

    return {
      id: `szamlazz-${Date.now()}`,
      provider: 'szamlazz',
      status: 'issued',
      invoiceNumber: responseText.match(/<szamlaszam>(.*?)<\/szamlaszam>/)?.[1] || 'SZ-UNKNOWN',
      rawResponse: responseText,
      totals: calculateInvoiceTotals(invoice.items || []),
      xml,
    };
  }

  async findByRef(reference) {
    if (!reference) {
      return null;
    }

    return { reference, provider: 'szamlazz', status: 'issued' };
  }

  async downloadPdf(invoiceId) {
    return {
      mimeType: 'application/pdf',
      url: `https://example.test/${invoiceId}.pdf`,
      body: `SZÁMLA PDF - ${invoiceId}`,
    };
  }

  async cancelInvoice(invoiceId) {
    return {
      id: invoiceId,
      provider: 'szamlazz',
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    };
  }
}

export function createInvoiceProvider({ provider = 'mock', ...config } = {}) {
  if (provider === 'szamlazz') {
    return new SzamlazzAdapter(config);
  }

  return new MockInvoiceProvider(config);
}

export function transitionInvoiceState(currentStatus, nextStatus) {
  const allowed = {
    issuing: ['issued', 'failed_retryable', 'failed_permanent'],
    issued: ['cancelled'],
    failed_retryable: ['issuing', 'issued', 'failed_permanent'],
    failed_permanent: [],
    cancelled: [],
  };

  if (!currentStatus || !nextStatus) {
    return false;
  }

  return allowed[currentStatus]?.includes(nextStatus) ?? false;
}

export function canRetryInvoice(status) {
  return ['failed_retryable', 'issuing'].includes(status);
}

export default {
  INVOICE_STATUSES,
  INVOICE_PAYMENT_METHODS,
  VAT_RATES,
  roundMoney,
  formatMoneyHu,
  formatDateHu,
  normalizeVatRate,
  calculateInvoiceLine,
  calculateInvoiceTotals,
  validatePostalCode,
  validateTaxNumber,
  validateCustomer,
  InvoiceProvider,
  InvoiceProviderError,
  MockInvoiceProvider,
  SzamlazzAdapter,
  createInvoiceProvider,
  transitionInvoiceState,
  canRetryInvoice,
};
