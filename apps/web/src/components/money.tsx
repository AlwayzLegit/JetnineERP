import { formatMoney, type CurrencyCode } from '@jetnine/shared';

interface MoneyProps {
  /** Integer cents. Negative values render with a leading minus. */
  cents: number;
  /** Default 'USD'. Reserved for the multi-currency future. */
  currency?: CurrencyCode;
  /** Default 'en-US'. Drives digit grouping + symbol position. */
  locale?: string;
  /**
   * If true, render only the digits — no currency symbol. Useful in
   * tables where the column header already says "USD".
   */
  symbolless?: boolean;
  className?: string;
  /**
   * Optional title attribute. Defaults to the unambiguous form
   * ("$1,234.56" stays "$1,234.56", but you can override for
   * accessibility text).
   */
  title?: string;
}

/**
 * Single source of truth for money rendering. Wraps the cents-aware
 * `formatMoney` helper from `@jetnine/shared`. UI code never touches
 * the cents/100 conversion directly — this is the only spot.
 */
export function Money({ cents, currency, locale, symbolless, className, title }: MoneyProps) {
  const text = formatMoney(cents, { currency, locale, symbolless });
  return (
    <span className={className} title={title ?? text}>
      {text}
    </span>
  );
}
