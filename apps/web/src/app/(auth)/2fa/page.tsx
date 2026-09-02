'use client';

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
import { LinkButton } from '@/components/ui';
import { twoFactor, useSession } from '@/lib/auth-client';
import { authErrorMessage } from '@/lib/auth-errors';

interface EnrollmentSecret {
  totpURI: string;
  backupCodes: string[];
}

const passwordSchema = z.object({ password: z.string().min(1, 'Enter your password.') });
type PasswordValues = z.output<typeof passwordSchema>;
const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code from your app.'),
});
type CodeValues = z.output<typeof codeSchema>;

export default function TwoFactorPage() {
  const session = useSession();
  const [enrolment, setEnrolment] = useState<EnrollmentSecret | null>(null);
  const form = useZodForm(passwordSchema, { password: '' });

  if (session.isPending) return null;
  if (!session.data) {
    return (
      <AuthOutcome
        tone="secure"
        title="Two-factor authentication"
        actions={
          <LinkButton href="/login?next=/2fa" variant="primary">
            Sign in
          </LinkButton>
        }
      >
        Sign in first, then come back here to protect your account with an authenticator app.
      </AuthOutcome>
    );
  }

  if (enrolment) return <Confirm enrolment={enrolment} reset={() => setEnrolment(null)} />;

  return (
    <AuthCard
      title="Turn on two-factor authentication"
      subtitle="Confirm your password and we will generate a secret for your authenticator app."
      footer={
        <span>
          Not now? <AuthLink href="/pos">Back to the app</AuthLink>
        </span>
      }
    >
      <Form<PasswordValues>
        form={form}
        onSubmit={async (values) => {
          const res = await twoFactor.enable({ password: values.password });
          if (res.error) throw new Error(authErrorMessage(res.error, 'Could not start enrolment.'));
          const data = res.data as { totpURI?: string; backupCodes?: string[] };
          if (!data.totpURI || !data.backupCodes) {
            throw new Error('Unexpected response from the server. Try again.');
          }
          setEnrolment({ totpURI: data.totpURI, backupCodes: data.backupCodes });
        }}
      >
        <PasswordField<PasswordValues>
          name="password"
          label="Confirm your password"
          autoComplete="current-password"
          autoFocus
        />
        <FormRootError />
        <SubmitButton pendingLabel="Generating…">Generate code</SubmitButton>
      </Form>
    </AuthCard>
  );
}

function Confirm({ enrolment, reset }: { enrolment: EnrollmentSecret; reset: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const form = useZodForm(codeSchema, { code: '' });

  if (enabled) {
    return (
      <AuthOutcome
        tone="secure"
        title="Two-factor is on"
        testid="auth-success"
        actions={
          <LinkButton href="/pos" variant="primary">
            Continue to the app
          </LinkButton>
        }
      >
        2FA is now enabled. Sign-ins will require a code from your authenticator app. Keep your
        backup codes somewhere safe; each one works once.
      </AuthOutcome>
    );
  }

  return (
    <AuthCard
      title="Scan or paste the secret"
      subtitle="Add it to an authenticator app (1Password, Authy, Google Authenticator), then enter the 6-digit code it shows."
      footer={
        <button type="button" className="btn-link" onClick={reset}>
          Restart enrolment
        </button>
      }
    >
      <pre
        data-testid="totp-uri"
        style={{
          background: 'var(--surface-muted)',
          border: '1px solid var(--border)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          overflow: 'auto',
          margin: '0 0 8px',
        }}
      >
        {enrolment.totpURI}
      </pre>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: 12 }}
        onClick={() => {
          void navigator.clipboard?.writeText(enrolment.totpURI).then(() => {
            setCopied(true);
            toast.success('Secret copied.');
          });
        }}
      >
        {copied ? 'Copied' : 'Copy secret'}
      </button>
      <details style={{ marginBottom: 16 }}>
        <summary style={{ fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
          Backup codes (save these)
        </summary>
        <ul
          data-testid="backup-codes"
          style={{
            fontSize: 12,
            marginTop: 8,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
            listStyle: 'none',
            padding: 0,
          }}
        >
          {enrolment.backupCodes.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
      </details>
      <Form<CodeValues>
        form={form}
        onSubmit={async (values) => {
          const res = await twoFactor.verifyTotp({ code: values.code });
          if (res.error) throw new Error(authErrorMessage(res.error, 'That code did not work.'));
          toast.success('Two-factor authentication is on.');
          setEnabled(true);
        }}
      >
        <TextField<CodeValues>
          name="code"
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
        />
        <FormRootError />
        <SubmitButton pendingLabel="Checking…">Verify and turn on</SubmitButton>
      </Form>
    </AuthCard>
  );
}
