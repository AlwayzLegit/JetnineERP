import type { ReactNode } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';

// All auth pages call better-auth client hooks (useSession etc.)
// at module evaluation. Those hooks can't run during Next's
// prerender pass — there's no React dispatcher — so we opt the
// whole segment out of static generation.
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
