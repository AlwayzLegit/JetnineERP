'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);

  if (needsTwoFactor) {
    return <TwoFactorChallenge onSuccess={() => router.push('/dashboard')} />;
  }

  return (
    <AuthForm
      title="Sign in"
      submitLabel="Sign in"
      fields={[
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'password', label: 'Password', type: 'password' },
      ]}
      footer={
        <>
          <p>
            Forgot your password? <Link href="/reset">Reset</Link>
          </p>
          <p>
            New here? <Link href="/signup">Create an account</Link>
          </p>
        </>
      }
      onSubmit={async (values) => {
        const res = await signIn.email({
          email: values.email ?? '',
          password: values.password ?? '',
        });
        if (res.error) return { ok: false, message: res.error.message ?? 'Sign-in failed' };
        // The two-factor plugin returns `twoFactorRedirect: true` in `res.data`
        // when the user has 2FA enabled and must complete a TOTP challenge.
        const data = res.data as { twoFactorRedirect?: boolean } | undefined;
        if (data?.twoFactorRedirect) {
          setNeedsTwoFactor(true);
          return { ok: true, message: 'Enter your 6-digit code to continue.' };
        }
        router.push('/dashboard');
        return { ok: true };
      }}
    />
  );
}

function TwoFactorChallenge({ onSuccess }: { onSuccess: () => void }) {
  return (
    <AuthForm
      title="Two-factor code"
      submitLabel="Verify"
      fields={[{ name: 'code', label: '6-digit code' }]}
      onSubmit={async (values) => {
        const { twoFactor } = await import('@/lib/auth-client');
        const res = await twoFactor.verifyTotp({ code: values.code ?? '' });
        if (res.error) return { ok: false, message: res.error.message ?? 'Invalid code' };
        onSuccess();
        return { ok: true };
      }}
    />
  );
}
