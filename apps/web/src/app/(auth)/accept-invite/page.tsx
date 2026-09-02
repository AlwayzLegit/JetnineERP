'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthCard, AuthLink, AuthOutcome } from '@/components/auth/auth-shell';
import {
  Form,
  FormRootError,
  PasswordField,
  SubmitButton,
  useZodForm,
} from '@/components/form/form';
import { LinkButton } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { authErrorMessage } from '@/lib/auth-errors';

const schema = z
  .object({
    password: z
      .string()
      .min(12, 'Use at least 12 characters.')
      .max(128, 'Use at most 128 characters.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'The two passwords do not match.',
  });
type Values = z.output<typeof schema>;

export default function AcceptInvitePage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [activated, setActivated] = useState<string | null>(null);
  const form = useZodForm(schema, { password: '', confirm: '' });

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'));
  }, []);
  if (token === undefined) return null;

  if (!token) {
    return (
      <AuthOutcome
        tone="error"
        title="Missing invitation link"
        actions={
          <LinkButton href="/login" variant="secondary">
            Go to sign in
          </LinkButton>
        }
      >
        Open the link from your invitation email; it carries the token this page needs. Invites
        expire after 72 hours, so ask your manager to send a new one if it has been longer.
      </AuthOutcome>
    );
  }

  if (activated) {
    return (
      <AuthOutcome
        tone="success"
        title="Your account is active"
        testid="auth-success"
        actions={
          <LinkButton href={`/login?email=${encodeURIComponent(activated)}`} variant="primary">
            Sign in as {activated}
          </LinkButton>
        }
      >
        Your account is active. You can now sign in with the password you just chose.
      </AuthOutcome>
    );
  }

  return (
    <AuthCard
      title="Accept your invitation"
      subtitle="Choose a password to activate your account. You will sign in with it from now on."
      footer={
        <span>
          Already accepted? <AuthLink href="/login">Sign in</AuthLink>
        </span>
      }
    >
      <Form<Values>
        form={form}
        onSubmit={async (values) => {
          try {
            const res = await api<{ userId: string; email: string }>('/v1/auth/accept-invite', {
              method: 'POST',
              body: JSON.stringify({ token, password: values.password }),
            });
            toast.success('Account activated.');
            setActivated(res.email);
          } catch (err) {
            if (err instanceof ApiError) {
              throw new Error(
                authErrorMessage(
                  { code: err.code, message: err.message, status: err.status },
                  'Could not activate the account.',
                ),
              );
            }
            throw err;
          }
        }}
      >
        <PasswordField<Values>
          name="password"
          label="Choose a password (min 12 chars)"
          autoComplete="new-password"
          autoFocus
          showStrength
        />
        <PasswordField<Values>
          name="confirm"
          label="Confirm password"
          autoComplete="new-password"
        />
        <FormRootError />
        <SubmitButton pendingLabel="Activating…">Set password and activate</SubmitButton>
      </Form>
    </AuthCard>
  );
}
