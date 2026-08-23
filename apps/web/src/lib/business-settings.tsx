'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isSupportedCurrency, type CurrencyCode } from '@jetnine/shared';
import { api } from './api';

interface BusinessSettingsValue {
  currency: CurrencyCode;
  /** Active business display name; null until loaded or when none selected. */
  businessName: string | null;
  /** True until the first fetch resolves; lets components fall back gracefully. */
  loaded: boolean;
}

const Ctx = createContext<BusinessSettingsValue>({
  currency: 'USD',
  businessName: null,
  loaded: false,
});

/**
 * Fetches `/v1/business/settings` once on mount and provides the
 * active currency to descendants. The (business) layout wraps this
 * around the entire merchant UI so any `<Money>` consumer renders
 * in the right currency without threading props.
 *
 * Falls back to USD until the fetch resolves (or fails silently —
 * this is a presentational concern, not an auth gate).
 */
export function BusinessSettingsProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<BusinessSettingsValue>({
    currency: 'USD',
    businessName: null,
    loaded: false,
  });

  useEffect(() => {
    void (async () => {
      try {
        const settings = await api<{ currencyCode: string; name?: string }>(
          '/v1/business/settings',
        );
        const code = settings.currencyCode?.toUpperCase();
        const currency = code && isSupportedCurrency(code) ? code : 'USD';
        setValue({ currency, businessName: settings.name ?? null, loaded: true });
      } catch {
        // Mark loaded even on failure so we stop showing the
        // initial "USD fallback" indefinitely; the user just sees
        // USD until they hit settings and pick something else.
        setValue({ currency: 'USD', businessName: null, loaded: true });
      }
    })();
  }, []);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBusinessCurrency(): CurrencyCode {
  return useContext(Ctx).currency;
}

export function useBusinessName(): string | null {
  return useContext(Ctx).businessName;
}
