'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthCard, AuthLink, AuthOutcome } from '@/components/auth/auth-shell';
import {
  Form,
  FormAlert,
  FormRootError,
  PasswordField,
  SubmitButton,
  TextField,
  useZodForm,
} from '@/components/form/form';
import { Button, LinkButton } from '@/components/ui';
import { authClient } from '@/lib/auth-client';
import { authErrorMessage } from '@/lib/auth-errors';

/**
 * Two screens on one route: `/reset` asks for the email and sends the
 * link; `/reset?token=…` (where the emailed link lands) sets the new
 * password. Each ends on an outcome panel that says what happens next.
 */
export default function ResetPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [linkError, setLinkError] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setToken(q.get('token'));
    // better-auth bounces an invalid link back here with ?error=…
    const err = q.get('error');
    if (err)
      setLinkError(authErrorMessage({ code: err.toUpperCase() }, 'This link is no longer valid.'));
  }, []);
  if (token === undefined) return null;
  if (token) return <SetPassword token={token} />;
  return <RequestLink linkError={linkError} />;
}

const emailSchema = z.object({ email: z.email('Enter a valid email address.') });
type EmailValues = z.output<typeof emailSchema>;

function RequestLink({ linkError }: { linkError: string | null }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [again, setAgain] = useState(false);
  const [resending, setResending] = useState(false);
  const form = useZodForm(emailSchema, { email: '' });

  async function send(email: string) {
    const res = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset`,
    });
    if (res.error) throw new Error(authErrorMessage(res.error, 'Could not send the email.'));
  }

  if (sentTo) {
    return (
      <AuthOutcome
        tone="mail"
        title="Check your email"
        testid="auth-success"
        actions={
          <>
            <Button
              variant="secondary"
              className="w-full"
              disabled={again || resending}
              aria-busy={resending}
              onClick={() => {
                setResending(true);
                void send(sentTo)
                  .then(() => {
                    setAgain(true);
                    toast.success('Sent again.');
                  })
                  .catch((err: Error) => toast.error(err.message))
                  .finally(() => setResending(false));
              }}
            >
              {again ? 'Sent again' : 'Send it again'}
            </Button>
            <LinkButton href="/login" variant="ghost">
              Back to sign in
            </LinkButton>
          </>
        }
      >
        If an account exists for <strong>{sentTo}</strong>, a reset link is on its way. It expires
        in one hour. Check spam if it has not arrived in a minute.
      </AuthOutcome>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your work email and we will send you a link to choose a new password."
      footer={
        <span>
          Remembered it? <AuthLink href="/login">Back to sign in</AuthLink>
        </span>
      }
    >
      {linkError && <FormAlert tone="warning">{linkError}</FormAlert>}
      <Form<EmailValues>
        form={form}
        onSubmit={async (values) => {
          await send(values.email);
          setSentTo(values.email);
        }}
      >
        <TextField<EmailValues>
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@lamattress.com"
        />
        <FormRootError />
        <SubmitButton pendingLabel="Sending…">Send reset email</SubmitButton>
      </Form>
    </AuthCard>
  );
}

const passwordSchema = z
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
type PasswordValues = z.output<typeof passwordSchema>;

function SetPassword({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);
  const form = useZodForm(passwordSchema, { password: '', confirm: '' });

  if (done) {
    return (
      <AuthOutcome
        tone="success"
        title="Password updated"
        testid="auth-success"
        actions={
          <LinkButton href="/login?reset=1" variant="primary">
            Sign in with the new password
          </LinkButton>
        }
      >
        Password updated. You can now sign in. Any other device that was signed in will need the new
        password too.
      </AuthOutcome>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Pick something you have not used here before."
      footer={
        expired ? (
          <span>
            Need a fresh link? <AuthLink href="/reset">Request a new one</AuthLink>
          </span>
        ) : undefined
      }
    >
      <Form<PasswordValues>
        form={form}
        onSubmit={async (values) => {
          const res = await authClient.resetPassword({ newPassword: values.password, token });
          if (res.error) {
            const msg = authErrorMessage(res.error, 'Could not update the password.');
            if (/link|token|expired/i.test(msg)) setExpired(true);
            throw new Error(msg);
          }
          toast.success('Password updated.');
          setDone(true);
        }}
      >
        <PasswordField<PasswordValues>
          name="password"
          label="New password (min 12 chars)"
          autoComplete="new-password"
          autoFocus
          showStrength
        />
        <PasswordField<PasswordValues>
          name="confirm"
          label="Confirm new password"
          autoComplete="new-password"
        />
        <FormRootError />
        <SubmitButton pendingLabel="Saving…">Set password</SubmitButton>
      </Form>
    </AuthCard>
  );
}
