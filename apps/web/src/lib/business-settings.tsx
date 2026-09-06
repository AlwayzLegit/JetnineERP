'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isSupportedCurrency, type CurrencyCode } from '@jetnine/shared';
import { api } from './api';

export interface BusinessBranding {
  accentColor?: string | null;
  logoUrl?: string | null;
  publicName?: string | null;
}

interface BusinessSettingsValue {
  currency: CurrencyCode;
  /** Active business display name; null until loaded or when none selected. */
  businessName: string | null;
  branding: BusinessBranding | null;
  /** True until the first fetch resolves; lets components fall back gracefully. */
  loaded: boolean;
}

const Ctx = createContext<BusinessSettingsValue>({
  currency: 'USD',
  businessName: null,
  branding: null,
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
 *
 * White-label: when the business sets `branding.accentColor`, we
 * override the `--brand` tokens on <html> so the whole app — buttons,
 * links, focus rings, active nav — takes the tenant's color. Reverted
 * on unmount so the platform default returns outside the tenant shell.
 */
export function BusinessSettingsProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<BusinessSettingsValue>({
    currency: 'USD',
    businessName: null,
    branding: null,
    loaded: false,
  });

  useEffect(() => {
    void (async () => {
      try {
        const settings = await api<{
          currencyCode: string;
          name?: string;
          branding?: BusinessBranding | null;
        }>('/v1/business/settings/pos');
        const code = settings.currencyCode?.toUpperCase();
        const currency = code && isSupportedCurrency(code) ? code : 'USD';
        setValue({
          currency,
          businessName: settings.name ?? null,
          branding: settings.branding ?? null,
          loaded: true,
        });
      } catch {
        // Mark loaded even on failure so we stop showing the
        // initial "USD fallback" indefinitely; the user just sees
        // USD until they hit settings and pick something else.
        setValue({ currency: 'USD', businessName: null, branding: null, loaded: true });
      }
    })();
  }, []);

  const accent = value.branding?.accentColor ?? null;
  useEffect(() => {
    if (!accent || !/^#[0-9a-fA-F]{6}$/.test(accent)) return;
    const root = document.documentElement;
    const prev = {
      brand: root.style.getPropertyValue('--brand'),
      hover: root.style.getPropertyValue('--brand-hover'),
      soft: root.style.getPropertyValue('--brand-soft'),
    };
    root.style.setProperty('--brand', accent);
    root.style.setProperty('--brand-hover', shade(accent, -0.15));
    root.style.setProperty('--brand-soft', tint(accent, 0.9));
    return () => {
      root.style.setProperty('--brand', prev.brand);
      root.style.setProperty('--brand-hover', prev.hover);
      root.style.setProperty('--brand-soft', prev.soft);
    };
  }, [accent]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBusinessCurrency(): CurrencyCode {
  return useContext(Ctx).currency;
}

export function useBusinessName(): string | null {
  const { businessName, branding } = useContext(Ctx);
  return branding?.publicName ?? businessName;
}

export function useBusinessBranding(): BusinessBranding | null {
  return useContext(Ctx).branding;
}

/** Mix a #rrggbb color toward black (amount < 0) — for hover states. */
function shade(hex: string, amount: number): string {
  return mix(hex, amount < 0 ? '#000000' : '#ffffff', Math.abs(amount));
}

/** Mix a #rrggbb color toward white — for soft backgrounds. */
function tint(hex: string, amount: number): string {
  return mix(hex, '#ffffff', amount);
}

function mix(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i]! - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function parse(hex: string): number[] {
  return [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16));
}
