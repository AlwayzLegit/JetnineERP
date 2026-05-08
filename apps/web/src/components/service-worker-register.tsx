'use client';

import { useEffect } from 'react';

/**
 * Registers `/sw.js` once the page mounts. No UI — just a side-effect
 * component you drop into the POS subtree.
 *
 * The service worker is opt-in per route: only pages that include this
 * component register it. That keeps the back-office (which needs fresh
 * server-rendered HTML for tenant-scoped data) free of caching, while
 * the register page survives reloads while offline.
 *
 * Skipped during SSR and on the dev server (Next.js HMR misbehaves
 * when a SW serves cached chunks); set NEXT_PUBLIC_SW_DEV=1 to opt in
 * for local debugging.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_SW_DEV !== '1') {
      return;
    }
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
      // Don't surface to users; SW failure just means we lose the
      // offline shell, not the rest of the app.
      // eslint-disable-next-line no-console
      console.warn('Service worker registration failed:', err);
    });
  }, []);

  return null;
}
