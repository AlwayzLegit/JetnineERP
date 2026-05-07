'use client';

import Link from 'next/link';
import { signOut, useSession } from '@/lib/auth-client';

export default function DashboardPage() {
  const session = useSession();

  if (session.isPending)
    return (
      <Wrapper>
        <p>Loading…</p>
      </Wrapper>
    );

  if (!session.data) {
    return (
      <Wrapper>
        <p>You are not signed in.</p>
        <Link href="/login">Sign in</Link>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>
        Welcome, {session.data.user.name ?? session.data.user.email}
      </h1>
      <p data-testid="dashboard-email" style={{ marginBottom: 16 }}>
        Signed in as <strong>{session.data.user.email}</strong>
      </p>
      <ul style={{ marginBottom: 24 }}>
        <li>
          <Link href="/2fa">Manage two-factor authentication</Link>
        </li>
      </ul>
      <button
        onClick={async () => {
          await signOut();
          window.location.href = '/login';
        }}
        style={{
          padding: '8px 14px',
          background: '#111',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: '64px auto',
        padding: '0 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {children}
    </main>
  );
}
