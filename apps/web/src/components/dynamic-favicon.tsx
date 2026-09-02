'use client';

import { useEffect } from 'react';
import { useBusinessBranding } from '@/lib/business-settings';

/**
 * Tab icon = the business logo (owner 2026-09-02): once branding loads,
 * point the favicon and the iOS home-screen icon at `branding.logoUrl`
 * so the POS tab and an installed POS carry the LA Mattress logo. Falls
 * back to the bundled "LA" mark (app/icon.svg) when no logo is set.
 */
export function DynamicFavicon() {
  const branding = useBusinessBranding();
  const logoUrl = branding?.logoUrl ?? null;

  useEffect(() => {
    if (!logoUrl) return;
    const head = document.head;
    const previous = new Map<Element, string | null>();
    const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
    for (const rel of rels) {
      let link = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        head.appendChild(link);
        previous.set(link, null);
      } else {
        previous.set(link, link.getAttribute('href'));
      }
      link.href = logoUrl;
      link.removeAttribute('type');
      link.removeAttribute('sizes');
    }
    return () => {
      for (const [el, href] of previous) {
        if (href === null) el.remove();
        else el.setAttribute('href', href);
      }
    };
  }, [logoUrl]);

  return null;
}
