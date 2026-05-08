import { describe, expect, it } from 'vitest';
import {
  centsToInputString,
  formatMoney,
  fractionDigitsFor,
  isSupportedCurrency,
  parseMoneyToCents,
  SUPPORTED_CURRENCIES,
} from './money.js';

describe('formatMoney', () => {
  it('formats positive cents as USD', () => {
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(50)).toBe('$0.50');
    expect(formatMoney(123456)).toBe('$1,234.56');
    expect(formatMoney(100_000_000)).toBe('$1,000,000.00');
  });

  it('formats negative cents with a leading minus', () => {
    expect(formatMoney(-50)).toBe('-$0.50');
    expect(formatMoney(-123456)).toBe('-$1,234.56');
  });

  it('symbolless option returns digits only', () => {
    expect(formatMoney(123456, { symbolless: true })).toBe('1,234.56');
    expect(formatMoney(-50, { symbolless: true })).toBe('-0.50');
  });
});

describe('parseMoneyToCents', () => {
  it('parses common shapes', () => {
    expect(parseMoneyToCents('1234.56')).toBe(123456);
    expect(parseMoneyToCents('1,234.56')).toBe(123456);
    expect(parseMoneyToCents('$1,234.56')).toBe(123456);
    expect(parseMoneyToCents('  $0.50  ')).toBe(50);
    expect(parseMoneyToCents('1234')).toBe(123400);
    expect(parseMoneyToCents('.5')).toBe(50);
  });

  it('rounds half-cent inputs to the nearest cent', () => {
    expect(parseMoneyToCents('0.005')).toBe(1);
    expect(parseMoneyToCents('0.004')).toBe(0);
  });

  it('handles negatives', () => {
    expect(parseMoneyToCents('-1.50')).toBe(-150);
    expect(parseMoneyToCents('-$1.50')).toBe(-150);
  });

  it('returns null on garbage input', () => {
    expect(parseMoneyToCents('')).toBeNull();
    expect(parseMoneyToCents('abc')).toBeNull();
    expect(parseMoneyToCents('1.2.3')).toBeNull();
    expect(parseMoneyToCents('-')).toBeNull();
    expect(parseMoneyToCents('.')).toBeNull();
    expect(parseMoneyToCents(null)).toBeNull();
    expect(parseMoneyToCents(undefined)).toBeNull();
  });

  it('round-trips with formatMoney', () => {
    for (const cents of [0, 1, 99, 100, 123456, -123456]) {
      const display = formatMoney(cents);
      expect(parseMoneyToCents(display)).toBe(cents);
    }
  });
});

describe('centsToInputString', () => {
  it('renders for input fields without grouping', () => {
    expect(centsToInputString(0)).toBe('0.00');
    expect(centsToInputString(50)).toBe('0.50');
    expect(centsToInputString(123456)).toBe('1234.56');
    expect(centsToInputString(-50)).toBe('-0.50');
  });

  it('round-trips with parseMoneyToCents', () => {
    for (const cents of [0, 1, 99, 100, 123456, -123456]) {
      const s = centsToInputString(cents);
      expect(parseMoneyToCents(s)).toBe(cents);
    }
  });
});

describe('multi-currency', () => {
  it('SUPPORTED_CURRENCIES contains the curated set', () => {
    expect(SUPPORTED_CURRENCIES).toContain('USD');
    expect(SUPPORTED_CURRENCIES).toContain('EUR');
    expect(SUPPORTED_CURRENCIES).toContain('JPY');
  });

  it('isSupportedCurrency narrows correctly', () => {
    expect(isSupportedCurrency('USD')).toBe(true);
    expect(isSupportedCurrency('XXX')).toBe(false);
    expect(isSupportedCurrency('')).toBe(false);
  });

  it('fractionDigitsFor returns 0 for JPY and 2 for the rest', () => {
    expect(fractionDigitsFor('USD')).toBe(2);
    expect(fractionDigitsFor('EUR')).toBe(2);
    expect(fractionDigitsFor('GBP')).toBe(2);
    expect(fractionDigitsFor('JPY')).toBe(0);
  });

  it('formatMoney renders EUR and GBP with their symbols', () => {
    expect(formatMoney(123456, { currency: 'EUR' })).toMatch(/€\s?1,234\.56/);
    expect(formatMoney(123456, { currency: 'GBP' })).toMatch(/£1,234\.56/);
  });

  it('formatMoney renders JPY without decimals', () => {
    expect(formatMoney(1234, { currency: 'JPY' })).toMatch(/¥1,234/);
    expect(formatMoney(0, { currency: 'JPY' })).toMatch(/¥0/);
  });

  it('JPY: minor units = whole yen, parses + formats round-trip', () => {
    expect(parseMoneyToCents('1234', { currency: 'JPY' })).toBe(1234);
    expect(parseMoneyToCents('¥1,234', { currency: 'JPY' })).toBe(1234);
    expect(centsToInputString(1234, 'JPY')).toBe('1234');
  });

  it('symbolless format strips the currency symbol but keeps locale grouping', () => {
    expect(formatMoney(123456, { currency: 'EUR', symbolless: true })).toBe('1,234.56');
    expect(formatMoney(1234, { currency: 'JPY', symbolless: true })).toBe('1,234');
  });
});
