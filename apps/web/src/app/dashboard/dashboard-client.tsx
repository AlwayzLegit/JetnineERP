'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, Skeleton } from '@/components/ui';
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

export default function DashboardClient() {
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
          // Fresh signup with no memberships → punt to /welcome.
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
        <div style={{ display: 'grid', gap: 10 }}>
          <Skeleton style={{ height: 28, width: 260 }} />
          <Skeleton style={{ height: 16, width: 200 }} />
          <Skeleton style={{ height: 120 }} />
        </div>
      </Wrapper>
    );

  if (!session.data) {
    return (
      <Wrapper>
        <p style={{ color: 'var(--text-secondary)' }}>You are not signed in.</p>
        <Link href="/login">Sign in</Link>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>
        Welcome, {session.data.user.name ?? session.data.user.email}
      </h1>
      <p
        data-testid="dashboard-email"
        style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13 }}
      >
        Signed in as <strong>{session.data.user.email}</strong>
      </p>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      {checklist && checklist !== 'no-business' && !checklist.complete && (
        <ChecklistCard checklist={checklist} />
      )}

      {checklist && checklist !== 'no-business' && checklist.complete && (
        <p style={{ color: 'var(--success)', fontSize: 14, marginBottom: 16 }}>
          Your business is fully set up. Open the <Link href="/pos">register</Link> to start ringing
          up sales.
        </p>
      )}

      <ul style={{ margin: '0 0 24px', paddingLeft: 18, display: 'grid', gap: 4 }}>
        <li>
          <Link href="/2fa">Manage two-factor authentication</Link>
        </li>
        <li>
          <Link href="/welcome">Switch business</Link>
        </li>
      </ul>
      <Button
        variant="primary"
        onClick={async () => {
          await signOut();
          window.location.href = '/login';
        }}
      >
        <LogOut size={14} aria-hidden />
        Sign out
      </Button>
    </Wrapper>
  );
}

function ChecklistCard({ checklist }: { checklist: Checklist }) {
  const doneCount = checklist.steps.filter((s) => s.done).length;
  const total = checklist.steps.length;
  return (
    <Card
      title="Get started"
      actions={
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {doneCount} of {total} complete
        </span>
      }
      style={{ marginBottom: 24 }}
    >
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {checklist.steps.map((s) => (
          <li
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: s.done ? 'var(--success-soft)' : 'var(--surface)',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: s.done ? '2px solid var(--success)' : '2px solid var(--border-strong)',
                background: s.done ? 'var(--success)' : 'var(--surface)',
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
                color: s.done ? 'var(--text-muted)' : 'var(--text)',
                textDecoration: s.done ? 'line-through' : 'none',
              }}
            >
              {s.label}
            </span>
            {!s.done && (
              <Link href={s.href} style={{ textDecoration: 'none', fontSize: 13 }}>
                Go →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-[720px] px-4 py-8 sm:py-16">{children}</main>;
}
