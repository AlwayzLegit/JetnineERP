'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthCard, AuthLink } from '@/components/auth/auth-shell';
import {
  Form,
  FormAlert,
  FormRootError,
  PasswordField,
  SubmitButton,
  TextField,
  useZodForm,
} from '@/components/form/form';
import { authClient, signIn, twoFactor } from '@/lib/auth-client';
import { authErrorMessage, isUnverifiedEmail } from '@/lib/auth-errors';

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});
type Values = z.output<typeof schema>;

/** Only same-site paths may be used as the post-login destination. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/pos';
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const [next, setNext] = useState('/pos');
  const [challenge, setChallenge] = useState(false);
  const [unverified, setUnverified] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useZodForm(schema, { email: '', password: '' });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNext(safeNext(q.get('next')));
    const email = q.get('email');
    if (email) form.setValue('email', email);
    if (q.get('reset') === '1') setNotice('Your password was updated. Sign in with the new one.');
    if (q.get('verified') === '1') setNotice('Your email is verified. Sign in to continue.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resend() {
    if (!unverified) return;
    const res = await authClient.sendVerificationEmail({
      email: unverified,
      callbackURL: `${window.location.origin}/verify`,
    });
    if (res.error) {
      toast.error(authErrorMessage(res.error, 'Could not send the email.'));
      return;
    }
    setResent(true);
    toast.success(`Verification email sent to ${unverified}.`);
  }

  if (challenge) {
    return (
      <TwoFactorChallenge onSuccess={() => router.push(next)} onBack={() => setChallenge(false)} />
    );
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back. Use your work email and password."
      footer={
        <>
          <span>
            New here? <AuthLink href="/signup">Create an account</AuthLink>
          </span>
          <span>
            Got an invite link? <AuthLink href="/accept-invite">Accept the invitation</AuthLink>
          </span>
        </>
      }
    >
      {notice && (
        <FormAlert tone="success" testid="auth-success">
          {notice}
        </FormAlert>
      )}
      {unverified && (
        <FormAlert
          tone="warning"
          title="Verify your email first"
          action={
            <button
              type="button"
              className="btn-link"
              onClick={() => void resend()}
              disabled={resent}
            >
              {resent ? 'Sent' : 'Resend email'}
            </button>
          }
        >
          We sent a verification link to {unverified}. Open it, then sign in.
        </FormAlert>
      )}
      <Form<Values>
        form={form}
        onSubmit={async (values) => {
          setUnverified(null);
          const res = await signIn.email({ email: values.email, password: values.password });
          if (res.error) {
            if (isUnverifiedEmail(res.error)) {
              setUnverified(values.email);
              return;
            }
            throw new Error(authErrorMessage(res.error, 'Sign-in failed. Try again.'));
          }
          // The two-factor plugin returns `twoFactorRedirect: true` when the
          // user has 2FA enabled and must complete a TOTP challenge.
          const data = res.data as { twoFactorRedirect?: boolean } | undefined;
          if (data?.twoFactorRedirect) {
            setChallenge(true);
            return;
          }
          toast.success('Signed in.');
          router.push(next);
        }}
      >
        <TextField<Values>
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@lamattress.com"
        />
        <PasswordField<Values>
          name="password"
          label="Password"
          autoComplete="current-password"
          labelAside={<AuthLink href="/reset">Forgot password?</AuthLink>}
        />
        <FormRootError />
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </Form>
    </AuthCard>
  );
}

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Enter the code from your authenticator app.')
    .regex(/^[0-9A-Za-z-]{6,12}$/, 'Codes are 6 digits (backup codes are longer).'),
});
type CodeValues = z.output<typeof codeSchema>;

function TwoFactorChallenge({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const [useBackup, setUseBackup] = useState(false);
  const form = useZodForm(codeSchema, { code: '' });
  return (
    <AuthCard
      title="Two-factor code"
      subtitle="Your account is protected with two-factor authentication."
      footer={
        <>
          <button type="button" className="btn-link" onClick={() => setUseBackup((v) => !v)}>
            {useBackup ? 'Use my authenticator app instead' : 'Use a backup code instead'}
          </button>
          <button type="button" className="btn-link" onClick={onBack}>
            Back to sign in
          </button>
        </>
      }
    >
      <FormAlert tone="info" testid="auth-success">
        Enter your 6-digit code to continue.
      </FormAlert>
      <Form<CodeValues>
        form={form}
        onSubmit={async (values) => {
          const res = useBackup
            ? await twoFactor.verifyBackupCode({ code: values.code })
            : await twoFactor.verifyTotp({ code: values.code });
          if (res.error) throw new Error(authErrorMessage(res.error, 'That code did not work.'));
          toast.success('Signed in.');
          onSuccess();
        }}
      >
        <TextField<CodeValues>
          name="code"
          label={useBackup ? 'Backup code' : '6-digit code'}
          inputMode={useBackup ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          autoFocus
          maxLength={useBackup ? 16 : 6}
          placeholder={useBackup ? 'xxxxx-xxxxx' : '123456'}
        />
        <FormRootError />
        <SubmitButton pendingLabel="Checking…">Verify</SubmitButton>
      </Form>
    </AuthCard>
  );
}
