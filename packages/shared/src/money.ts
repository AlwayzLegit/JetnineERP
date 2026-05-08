/**
 * Money utilities. Cents (or "minor units" — JPY has no decimals, but
 * we still call them "cents" in code for consistency) are the
 * canonical wire + storage unit. This module is the only place that
 * converts to/from human-readable strings.
 *
 * Each business operates in a single currency at a time (set on
 * `business_settings.currency_code`). Cross-currency transactions
 * aren't supported; the helpers below treat the currency as a
 * formatting decision, not a value-conversion one.
 */

/**
 * Curated set of supported ISO 4217 codes. Covers the common
 * 2-decimal currencies plus JPY (which has 0 decimals and exercises
 * the fractional-digits branch). Adding a new code is one line in
 * `FRACTION_DIGITS_BY_CURRENCY` plus a label in `CURRENCY_LABELS`.
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
] as const;

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: 'US dollar',
  EUR: 'Euro',
  GBP: 'British pound',
  CAD: 'Canadian dollar',
  AUD: 'Australian dollar',
  JPY: 'Japanese yen',
};

/**
 * Per-currency minor-unit decimal count. JPY = 0 (no decimals);
 * everything else here = 2. The cents → display arithmetic uses this
 * to compute `cents / 10^digits` rather than the hardcoded `/100`.
 */
const FRACTION_DIGITS_BY_CURRENCY: Record<CurrencyCode, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  CAD: 2,
  AUD: 2,
  JPY: 0,
};

export function fractionDigitsFor(currency: CurrencyCode = 'USD'): number {
  return FRACTION_DIGITS_BY_CURRENCY[currency] ?? 2;
}

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export interface FormatMoneyOptions {
  /** ISO 4217 currency code. Defaults to USD. */
  currency?: CurrencyCode;
  /**
   * BCP 47 locale for digit grouping + symbol placement. Defaults to
   * 'en-US'. The actual currency *unit* is determined by `currency`.
   */
  locale?: string;
  /**
   * If true, returns just the number ('1,234.56') without the currency
   * symbol or code. Useful inside larger phrases that already mention
   * the currency.
   */
  symbolless?: boolean;
}

/**
 * Format an integer cents amount as a human-readable string.
 *
 *   formatMoney(123456) === '$1,234.56'
 *   formatMoney(-50) === '-$0.50'
 *   formatMoney(0) === '$0.00'
 *
 * Negative amounts are formatted with a leading minus sign, not
 * accountant parentheses — the receipt UIs already use parentheses
 * for refund lines and we don't want double-encoding.
 */
export function formatMoney(cents: number, options: FormatMoneyOptions = {}): string {
  const currency = options.currency ?? 'USD';
  const locale = options.locale ?? 'en-US';
  const fractionDigits = fractionDigitsFor(currency);
  const value = cents / Math.pow(10, fractionDigits);
  if (options.symbolless) {
    return value.toLocaleString(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      signDisplay: 'auto',
    });
  }
  return value.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: 'auto',
  });
}

/**
 * Parse a free-form money input ('$1,234.56', '1234.5', '1234',
 * ' .50 ') into integer cents. Returns null on parse failure so
 * callers can show inline validation rather than crashing.
 *
 *   parseMoneyToCents('1,234.56') === 123456
 *   parseMoneyToCents('$0.50') === 50
 *   parseMoneyToCents('') === null
 *   parseMoneyToCents('abc') === null
 *
 * Locale-naive on purpose: the form components already display
 * USD-only, and we don't want a French-locale browser silently
 * reinterpreting commas as decimal separators.
 */
export function parseMoneyToCents(
  raw: string | number | null | undefined,
  options: { currency?: CurrencyCode } = {},
): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s.length === 0) return null;
  // Strip currency symbols, spaces, and grouping commas.
  const cleaned = s.replace(/[\s,$£€¥]/g, '');
  if (!/^-?\d*\.?\d*$/.test(cleaned) || cleaned === '' || cleaned === '-' || cleaned === '.') {
    return null;
  }
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  const fractionDigits = fractionDigitsFor(options.currency);
  // Round to the nearest minor unit. Math.round is intentional —
  // Number's floating-point rounding error on '0.1 + 0.2' style
  // inputs can bias by 1 cent if we floor.
  return Math.round(n * Math.pow(10, fractionDigits));
}

/**
 * Convenience for input fields that should hold the textual form
 * of a cents amount. `centsToInputString(123456) === '1234.56'`.
 * Inverse of parseMoneyToCents (sans symbols/grouping) and round-
 * trips losslessly.
 */
export function centsToInputString(cents: number, currency: CurrencyCode = 'USD'): string {
  const fractionDigits = fractionDigitsFor(currency);
  return (cents / Math.pow(10, fractionDigits)).toFixed(fractionDigits);
}
