import type { ReactNode } from 'react';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { AppShell } from '@/components/app-shell';
import { BusinessSettingsProvider } from '@/lib/business-settings';

// Every (business) page calls per-tenant client hooks (the
// settings provider, useSession, etc.) — none of them are useful
// to prerender, and trying to do so trips Next's static export
// when better-auth's React adapter can't get a dispatcher.
export const dynamic = 'force-dynamic';

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <BusinessSettingsProvider>
      <ImpersonationBanner />
      <AppShell>{children}</AppShell>
    </BusinessSettingsProvider>
  );
}
