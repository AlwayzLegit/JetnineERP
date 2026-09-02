'use client';

import { useEffect, useState } from 'react';
import { AuthLink, AuthOutcome } from '@/components/auth/auth-shell';
import { LinkButton } from '@/components/ui';
import { authErrorMessage } from '@/lib/auth-errors';

/**
 * better-auth's verification link points at the API
 * (`/api/auth/verify-email?token=…&callbackURL=/verify`). After verifying
 * it redirects here; an invalid or expired link comes back with `?error=`.
 */
export default function VerifyPage() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error');
    if (err)
      setError(authErrorMessage({ code: err.toUpperCase() }, 'This link is no longer valid.'));
  }, []);

  if (error) {
    return (
      <AuthOutcome
        tone="error"
        title="That link did not work"
        testid="auth-error"
        actions={
          <LinkButton href="/login" variant="primary">
            Go to sign in
          </LinkButton>
        }
      >
        {error} Sign in and we will offer to send a fresh verification email.
      </AuthOutcome>
    );
  }

  return (
    <AuthOutcome
      tone="success"
      title="Email verified"
      testid="auth-success"
      actions={
        <LinkButton href="/login?verified=1" variant="primary">
          Sign in
        </LinkButton>
      }
    >
      Your email is confirmed. Sign in to set up your store or join one.
      <p className="auth-note">
        Invited by a manager? <AuthLink href="/accept-invite">Accept the invitation</AuthLink>{' '}
        instead.
      </p>
    </AuthOutcome>
  );
}
