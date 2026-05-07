'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { authClient } from '@/lib/auth-client';

function ResetInner() {
  const params = useSearchParams();
  const token = params.get('token');

  if (token) {
    return (
      <AuthForm
        title="Choose a new password"
        submitLabel="Set password"
        successMessage="Password updated. You can now sign in."
        fields={[{ name: 'password', label: 'New password (min 12 chars)', type: 'password' }]}
        onSubmit={async (values) => {
          const password = values.password ?? '';
          const res = await authClient.resetPassword({ newPassword: password, token });
          if (res.error) return { ok: false, message: res.error.message ?? 'Reset failed' };
          return { ok: true };
        }}
      />
    );
  }

  return (
    <AuthForm
      title="Reset password"
      submitLabel="Send reset email"
      successMessage="If an account exists for that email, a reset link is on its way."
      fields={[{ name: 'email', label: 'Email', type: 'email' }]}
      onSubmit={async (values) => {
        const email = values.email ?? '';
        const res = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset`,
        });
        if (res.error) return { ok: false, message: res.error.message ?? 'Reset failed' };
        return { ok: true };
      }}
    />
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ResetInner />
    </Suspense>
  );
}
