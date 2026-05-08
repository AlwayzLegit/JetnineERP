import type { ReactNode } from 'react';
import { ServiceWorkerRegister } from '@/components/service-worker-register';

/**
 * The POS subtree opts into the offline service worker. Wrapping at
 * the layout level (rather than per-page) means /pos and /pos/pending
 * both get it, and the register component mounts once when the
 * cashier first lands on the route — not on every navigation within.
 */
export default function PosLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ServiceWorkerRegister />
      {children}
    </>
  );
}
