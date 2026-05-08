'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { signOut, useSession } from '@/lib/auth-client';

interface ChecklistStep {
  key: string;
  label: string;
  done: boolean;
  href: string;
}
interface Checklist {
  businessId: string;
  steps: ChecklistStep[];
  complete: boolean;
}

export default function DashboardPage() {
  const session = useSession();
  const router = useRouter();
  const [checklist, setChecklist] = useState<Checklist | null | 'no-business'>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.data) return;
    void (async () => {
      try {
        const result = await api<Checklist | null>('/v1/onboarding/checklist');
        if (result == null) {
          // The user signed up but has no memberships yet — punt
          // them to /welcome so they can create their first
          // business.
          router.replace('/welcome');
          setChecklist('no-business');
        } else {
          setChecklist(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [session.data, router]);

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
      <p data-testid="dashboard-email" style={{ marginBottom: 16, color: '#555', fontSize: 13 }}>
        Signed in as <strong>{session.data.user.email}</strong>
      </p>

      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}

      {checklist && checklist !== 'no-business' && !checklist.complete && (
        <ChecklistCard checklist={checklist} />
      )}

      {checklist && checklist !== 'no-business' && checklist.complete && (
        <p style={{ color: '#070', fontSize: 14, marginBottom: 16 }}>
          Your business is fully set up. Open the{' '}
          <Link href="/pos" style={{ color: '#0050b3' }}>
            register
          </Link>{' '}
          to start ringing up sales.
        </p>
      )}

      <ul style={{ marginBottom: 24 }}>
        <li>
          <Link href="/2fa">Manage two-factor authentication</Link>
        </li>
        <li>
          <Link href="/welcome">Switch business</Link>
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

function ChecklistCard({ checklist }: { checklist: Checklist }) {
  const doneCount = checklist.steps.filter((s) => s.done).length;
  const total = checklist.steps.length;
  return (
    <div
      style={{
        background: '#fff',
        padding: 16,
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Get started</h2>
        <span style={{ marginLeft: 'auto', color: '#666', fontSize: 13 }}>
          {doneCount} of {total} complete
        </span>
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {checklist.steps.map((s) => (
          <li
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              border: '1px solid #eee',
              borderRadius: 4,
              background: s.done ? '#f5fbf5' : '#fff',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: s.done ? '2px solid #070' : '2px solid #ccc',
                background: s.done ? '#070' : '#fff',
                color: '#fff',
                fontSize: 12,
                lineHeight: '14px',
                textAlign: 'center',
              }}
            >
              {s.done ? '✓' : ''}
            </span>
            <span
              style={{
                flex: 1,
                color: s.done ? '#666' : '#111',
                textDecoration: s.done ? 'line-through' : 'none',
              }}
            >
              {s.label}
            </span>
            {!s.done && (
              <Link
                href={s.href}
                style={{ color: '#0050b3', textDecoration: 'none', fontSize: 13 }}
              >
                Go →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '64px auto',
        padding: '0 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {children}
    </main>
  );
}
