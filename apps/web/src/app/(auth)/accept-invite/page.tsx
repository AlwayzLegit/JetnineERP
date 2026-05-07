'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { api } from '@/lib/api';

function AcceptInviteInner() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  if (!token) {
    return (
      <div>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Invitation</h2>
        <p>Missing invitation token. Check the link in your email.</p>
      </div>
    );
  }

  return (
    <AuthForm
      title="Accept your invitation"
      submitLabel="Set password and activate"
      successMessage="Your account is active. You can now sign in."
      fields={[{ name: 'password', label: 'Choose a password (min 12 chars)', type: 'password' }]}
      footer={
        <p>
          Already accepted? <Link href="/login">Sign in</Link>
        </p>
      }
      onSubmit={async (values) => {
        try {
          await api('/v1/auth/accept-invite', {
            method: 'POST',
            body: JSON.stringify({ token, password: values.password ?? '' }),
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, message: err instanceof Error ? err.message : String(err) };
        }
      }}
    />
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <AcceptInviteInner />
    </Suspense>
  );
}
