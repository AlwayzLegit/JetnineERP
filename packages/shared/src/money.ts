/**
 * Money utilities. Cents are the canonical wire + storage unit; this
 * module is the only place that converts to/from human-readable
 * strings. Keep all cents-to-display arithmetic out of UI code.
 *
 * USD-only at MVP. The `currency` parameter is reserved for the day
 * we add multi-currency support; until then it defaults to 'USD' and
 * the helpers ignore non-USD inputs except to track the unit name.
 */

export type CurrencyCode = 'USD';

const FRACTION_DIGITS_BY_CURRENCY: Record<CurrencyCode, number> = { USD: 2 };

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
  const fractionDigits = FRACTION_DIGITS_BY_CURRENCY[currency] ?? 2;
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
  const fractionDigits = FRACTION_DIGITS_BY_CURRENCY[options.currency ?? 'USD'] ?? 2;
  // Round to the nearest cent. Math.round is intentional — Number's
  // floating-point rounding error on '0.1 + 0.2' style inputs can
  // bias by 1 cent if we floor.
  return Math.round(n * Math.pow(10, fractionDigits));
}

/**
 * Convenience for input fields that should hold the textual form
 * of a cents amount. `centsToInputString(123456) === '1234.56'`.
 * Inverse of parseMoneyToCents (sans symbols/grouping) and round-
 * trips losslessly.
 */
export function centsToInputString(cents: number, currency: CurrencyCode = 'USD'): string {
  const fractionDigits = FRACTION_DIGITS_BY_CURRENCY[currency] ?? 2;
  return (cents / Math.pow(10, fractionDigits)).toFixed(fractionDigits);
}
