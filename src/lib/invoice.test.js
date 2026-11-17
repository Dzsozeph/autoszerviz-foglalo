import { describe, expect, it } from 'vitest';
import {
  calculateInvoiceTotals,
  canRetryInvoice,
  createInvoiceProvider,
  formatDateHu,
  formatMoneyHu,
  transitionInvoiceState,
  validatePostalCode,
  validateTaxNumber,
} from './invoice';

describe('invoice calculations', () => {
  it('calculates the example invoice totals exactly', () => {
    const totals = calculateInvoiceTotals([
      {
        name: 'Első fékbetét + féktárcsa készlet',
        type: 'alkatresz',
        quantity: 1,
        unit: 'db',
        grossUnitPrice: 27500,
        vatRate: 0.27,
      },
      {
        name: 'Fékjavítás munkadíj',
        type: 'munkadij',
        quantity: 1,
        unit: 'óra',
        grossUnitPrice: 20000,
        vatRate: 0.27,
      },
    ]);

    expect(totals.net).toBeCloseTo(37401.57, 2);
    expect(totals.vat).toBeCloseTo(10098.43, 2);
    expect(totals.gross).toBe(47500);
  });

  it('rounds edge values consistently', () => {
    const totals = calculateInvoiceTotals([
      { grossUnitPrice: 9.99, quantity: 2, vatRate: 0.27 },
      { grossUnitPrice: 1.01, quantity: 1, vatRate: 0.27 },
    ]);

    expect(totals.gross).toBeCloseTo(20.99, 2);
    expect(totals.net).toBeGreaterThan(0);
    expect(totals.vat).toBeGreaterThan(0);
  });
});

describe('validators', () => {
  it('validates postal codes', () => {
    expect(validatePostalCode('1011')).toBe(true);
    expect(validatePostalCode('123')).toBe(false);
    expect(validatePostalCode('ABC1')).toBe(false);
  });

  it('validates tax numbers with the required checksum logic', () => {
    expect(validateTaxNumber('1234567-6-42')).toBe(true);
    expect(validateTaxNumber('1234567-7-42')).toBe(false);
    expect(validateTaxNumber('12345678-1-42')).toBe(true);
  });
});

describe('state machine', () => {
  it('enforces the allowed invoice state transitions', () => {
    expect(transitionInvoiceState('issuing', 'issued')).toBe(true);
    expect(transitionInvoiceState('issued', 'cancelled')).toBe(true);
    expect(transitionInvoiceState('failed_permanent', 'issued')).toBe(false);
  });

  it('marks only retryable states as reusable', () => {
    expect(canRetryInvoice('failed_retryable')).toBe(true);
    expect(canRetryInvoice('failed_permanent')).toBe(false);
  });
});

describe('providers', () => {
  it('creates the default mock provider', () => {
    const provider = createInvoiceProvider({ provider: 'mock' });
    expect(provider.constructor.name).toBe('MockInvoiceProvider');
  });

  it('formats values for the Hungarian UI', () => {
    expect(formatMoneyHu(47500)).toBe('47 500 Ft');
    expect(formatDateHu(new Date(2026, 10, 17))).toBe('2026.11.17.');
  });
});
