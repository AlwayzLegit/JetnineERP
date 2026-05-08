'use client';

import { useEffect, useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { twoFactor, useSession } from '@/lib/auth-client';

interface EnrollmentSecret {
  totpURI: string;
  backupCodes: string[];
}

export default function TwoFactorPage() {
  const session = useSession();
  const [enrolment, setEnrolment] = useState<EnrollmentSecret | null>(null);

  if (!session.data) {
    return (
      <div>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Two-factor authentication</h2>
        <p>Please sign in first.</p>
      </div>
    );
  }

  if (!enrolment) {
    return (
      <AuthForm
        title="Enable two-factor authentication"
        submitLabel="Generate code"
        fields={[{ name: 'password', label: 'Confirm your password', type: 'password' }]}
        onSubmit={async (values) => {
          const res = await twoFactor.enable({ password: values.password ?? '' });
          if (res.error) return { ok: false, message: res.error.message ?? 'Could not enable 2FA' };
          const data = res.data as { totpURI?: string; backupCodes?: string[] };
          if (!data.totpURI || !data.backupCodes) {
            return { ok: false, message: 'Unexpected response from server' };
          }
          setEnrolment({ totpURI: data.totpURI, backupCodes: data.backupCodes });
          return { ok: true };
        }}
      />
    );
  }

  return <Verify enrolment={enrolment} reset={() => setEnrolment(null)} />;
}

function Verify({ enrolment, reset }: { enrolment: EnrollmentSecret; reset: () => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Scan or paste the secret</h2>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
        Add this to an authenticator app (1Password, Authy, Google Authenticator), then enter the
        6-digit code below to confirm.
      </p>
      <pre
        data-testid="totp-uri"
        style={{
          background: '#f3f3f3',
          padding: '8px 10px',
          borderRadius: 4,
          fontSize: 12,
          overflow: 'auto',
          marginBottom: 12,
        }}
      >
        {enrolment.totpURI}
      </pre>
      <details style={{ marginBottom: 16 }}>
        <summary style={{ fontSize: 13, cursor: 'pointer' }}>Backup codes</summary>
        <ul data-testid="backup-codes" style={{ fontSize: 12, marginTop: 8 }}>
          {enrolment.backupCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </details>
      <AuthForm
        title="Confirm 2FA"
        submitLabel="Verify and turn on"
        successMessage="2FA is now enabled. Sign-ins will require a code."
        fields={[{ name: 'code', label: '6-digit code' }]}
        onSubmit={async (values) => {
          const res = await twoFactor.verifyTotp({ code: values.code ?? '' });
          if (res.error) return { ok: false, message: res.error.message ?? 'Invalid code' };
          return { ok: true };
        }}
      />
      <button
        onClick={reset}
        style={{
          marginTop: 12,
          fontSize: 13,
          background: 'none',
          color: '#555',
          border: 'none',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
      >
        Restart enrolment
      </button>
    </div>
  );
}
