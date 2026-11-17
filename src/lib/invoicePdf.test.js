import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInvoicePdf } from './invoicePdf';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('invoice PDF', () => {
  it('creates a compact Unicode PDF with item-level VAT totals', async () => {
    const fontBytes = await readFile(new URL('../assets/fonts/DejaVuSans.ttf', import.meta.url));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(fontBytes, { status: 200 })
    ));

    const result = await createInvoicePdf({
      invoiceNumber: 'TESZT-2026-123456',
      issueDate: new Date('2026-11-17T00:00:00Z'),
      customerName: 'Árvíztűrő Tükörfúrógép',
      customerEmail: 'teszt@example.com',
      items: [
        {
          name: 'Fékbetét, első tengely',
          quantity: 1,
          unit: 'készlet',
          grossUnitPrice: 27500,
          vatRate: 0.27,
        },
        {
          name: 'Javítási munkadíj',
          quantity: 1,
          unit: 'óra',
          grossUnitPrice: 20000,
          vatRate: 0.27,
        },
      ],
      notes: 'Demonstrációs számla',
    });

    expect(result.pdfBase64.startsWith('JVBER')).toBe(true);
    expect(result.pdfBase64.length).toBeLessThan(6_800_000);
    expect(result.totals).toMatchObject({
      net: 37401.57,
      vat: 10098.43,
      gross: 47500,
    });
  });

  it('creates additional pages for long item lists', async () => {
    const fontBytes = await readFile(new URL('../assets/fonts/DejaVuSans.ttf', import.meta.url));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(fontBytes, { status: 200 })
    ));

    const { pdfBase64 } = await createInvoicePdf({
      invoiceNumber: 'TESZT-2026-MULTI',
      customerName: 'Teszt Vásárló',
      items: Array.from({ length: 40 }, (_, index) => ({
        name: `Alkatrész és javítási tétel ${index + 1}`,
        quantity: 1,
        unit: 'db',
        grossUnitPrice: 1000,
        vatRate: 0.27,
      })),
    });

    const pageCount = (atob(pdfBase64).match(/\/Type \/Page\b/g) || []).length;
    expect(pageCount).toBeGreaterThan(1);
  });
});
