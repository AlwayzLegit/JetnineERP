'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthCard, AuthLink, AuthOutcome } from '@/components/auth/auth-shell';
import {
  Form,
  FormRootError,
  PasswordField,
  SubmitButton,
  TextField,
  useZodForm,
} from '@/components/form/form';
import { Button, LinkButton } from '@/components/ui';
import { authClient, signUp } from '@/lib/auth-client';
import { authErrorMessage } from '@/lib/auth-errors';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(80, 'Keep it under 80 characters.'),
  email: z.email('Enter a valid email address.'),
  password: z
    .string()
    .min(12, 'Use at least 12 characters.')
    .max(128, 'Use at most 128 characters.'),
});
type Values = z.output<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [resent, setResent] = useState(false);
  const form = useZodForm(schema, { name: '', email: '', password: '' });

  async function resend() {
    if (!sentTo) return;
    const res = await authClient.sendVerificationEmail({
      email: sentTo,
      callbackURL: `${window.location.origin}/verify`,
    });
    if (res.error) {
      toast.error(authErrorMessage(res.error, 'Could not send the email.'));
      return;
    }
    setResent(true);
    toast.success(`Verification email sent again to ${sentTo}.`);
  }

  if (sentTo) {
    return (
      <AuthOutcome
        tone="mail"
        title="Check your email"
        testid="auth-success"
        actions={
          <>
            {signedIn && (
              <Button variant="primary" className="w-full" onClick={() => router.push('/welcome')}>
                Continue to set up your store
              </Button>
            )}
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => void resend()}
              disabled={resent}
            >
              {resent ? 'Sent again' : 'Resend the email'}
            </Button>
            {!signedIn && (
              <LinkButton href="/login" variant="ghost">
                Back to sign in
              </LinkButton>
            )}
          </>
        }
      >
        We sent a verification link to <strong>{sentTo}</strong>. Open it to confirm your address.
        The link is good for one hour; check spam if it has not arrived in a minute.
      </AuthOutcome>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Takes a minute. You will verify your email, then set up or join a store."
      footer={
        <span>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </span>
      }
    >
      <Form<Values>
        form={form}
        onSubmit={async (values) => {
          const res = await signUp.email({
            email: values.email,
            password: values.password,
            name: values.name,
          });
          if (res.error) throw new Error(authErrorMessage(res.error, 'Sign-up failed. Try again.'));
          // When email verification is off (no mail provider configured),
          // better-auth signs the user in right away and returns a token;
          // the verification email still goes out, so the outcome panel
          // shows either way and adds a Continue button when signed in.
          const data = res.data as { token?: string | null } | undefined;
          setSignedIn(Boolean(data?.token));
          toast.success('Account created.');
          setSentTo(values.email);
        }}
      >
        <TextField<Values>
          name="name"
          label="Full name"
          autoComplete="name"
          autoFocus
          placeholder="Elyse Morris"
        />
        <TextField<Values>
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@lamattress.com"
        />
        <PasswordField<Values>
          name="password"
          label="Password (min 12 chars)"
          autoComplete="new-password"
          showStrength
          hint="At least 12 characters. A short phrase with a number and a symbol is easiest to remember."
        />
        <FormRootError />
        <SubmitButton pendingLabel="Creating account…">Sign up</SubmitButton>
      </Form>
    </AuthCard>
  );
}
