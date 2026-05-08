'use client';

import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';
import { signUp } from '@/lib/auth-client';

export default function SignupPage() {
  return (
    <AuthForm
      title="Create account"
      submitLabel="Sign up"
      successMessage="Check your email for a verification link."
      fields={[
        { name: 'name', label: 'Full name' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'password', label: 'Password (min 12 chars)', type: 'password' },
      ]}
      footer={
        <p>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      }
      onSubmit={async (values) => {
        const res = await signUp.email({
          email: values.email ?? '',
          password: values.password ?? '',
          name: values.name ?? '',
        });
        if (res.error) return { ok: false, message: res.error.message ?? 'Sign-up failed' };
        return { ok: true };
      }}
    />
  );
}
