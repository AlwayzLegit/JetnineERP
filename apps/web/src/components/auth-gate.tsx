'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '@/lib/auth-client';

/**
 * Gates the (business) shell on the session probe so logged-out
 * visitors never see the sidebar/topbar flash before a page-level
 * "not signed in" state resolves.
 *
 * Fail-open on probe errors: an offline register (POS service
 * worker) can't reach the session endpoint at all — that's not a
 * sign-out, so the shell still renders and the offline flows keep
 * working. Only a definitive "no session" answer redirects.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const signedOut = !session.isPending && !session.data && !session.error;

  useEffect(() => {
    if (signedOut) router.replace('/login');
  }, [signedOut, router]);

  if (session.isPending || signedOut) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'var(--surface-muted, var(--surface))' }}
      >
        <p role="status" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {signedOut ? 'Redirecting to sign in…' : 'Loading…'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
