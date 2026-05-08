import { formatMoney, type CurrencyCode } from '@jetnine/shared';
import { useBusinessCurrency } from '@/lib/business-settings';

interface MoneyProps {
  /** Integer minor units (cents for USD/EUR/etc., whole yen for JPY). */
  cents: number;
  /**
   * Optional override. When omitted, falls back to the active business's
   * currency from `BusinessSettingsProvider` (which loads
   * `/v1/business/settings` once per layout mount).
   */
  currency?: CurrencyCode;
  /** Default 'en-US'. Drives digit grouping + symbol position. */
  locale?: string;
  /**
   * If true, render only the digits — no currency symbol. Useful in
   * tables where the column header already names the currency.
   */
  symbolless?: boolean;
  className?: string;
  /**
   * Optional title attribute. Defaults to the rendered text so a
   * mouseover always shows the unambiguous formatted form.
   */
  title?: string;
}

/**
 * Single source of truth for money rendering. Pulls the active
 * currency from the business-settings context unless overridden.
 */
export function Money({ cents, currency, locale, symbolless, className, title }: MoneyProps) {
  const businessCurrency = useBusinessCurrency();
  const text = formatMoney(cents, {
    currency: currency ?? businessCurrency,
    locale,
    symbolless,
  });
  return (
    <span className={className} title={title ?? text}>
      {text}
    </span>
  );
}
