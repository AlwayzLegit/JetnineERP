'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  status: string;
  userCount: number;
  locationCount: number;
}

interface Membership {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
  roleName: string;
  status: string;
}

export default function BusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const [biz, setBiz] = useState<BusinessSummary | null>(null);
  const [members, setMembers] = useState<Membership[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      // Until Epic 1.6 ships a dedicated members endpoint we synthesize the
      // list by paging /v1/admin/businesses for the row + a small ad-hoc
      // endpoint won't exist yet. For now we just use the businesses list
      // to find this row.
      const all = await api<BusinessSummary[]>('/v1/admin/businesses');
      const found = all.find((b) => b.id === id);
      setBiz(found ?? null);
      setMembers(null); // Members listing is Epic 1.6 territory.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
    // load() captures `id` via closure; we intentionally only refetch when
    // the route param changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function impersonate(userId: string) {
    try {
      await api('/v1/admin/impersonate', {
        method: 'POST',
        body: JSON.stringify({ userId, businessId: id }),
      });
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  if (error) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!biz) return <p>Loading…</p>;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/admin/businesses">← All businesses</Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{biz.name}</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
        slug <code>{biz.slug}</code> · status <strong>{biz.status}</strong> · users {biz.userCount}{' '}
        · locations {biz.locationCount}
      </p>
      <Section title="Members">
        {members ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '6px' }}>Email</th>
                <th style={{ padding: '6px' }}>Role</th>
                <th style={{ padding: '6px' }}>Status</th>
                <th style={{ padding: '6px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.membershipId} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <td style={{ padding: '6px' }}>{m.email}</td>
                  <td style={{ padding: '6px' }}>{m.roleName}</td>
                  <td style={{ padding: '6px' }}>{m.status}</td>
                  <td style={{ padding: '6px' }}>
                    <button onClick={() => impersonate(m.userId)} style={impersonateBtn}>
                      Impersonate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#666', fontSize: 13 }}>
            Member listing API is Epic 1.6. Use the user&rsquo;s id directly:
          </p>
        )}
        <DirectImpersonate onSubmit={impersonate} />
      </Section>
    </div>
  );
}

function DirectImpersonate({ onSubmit }: { onSubmit: (userId: string) => void }) {
  const [userId, setUserId] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (userId) onSubmit(userId);
      }}
      style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}
    >
      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="user uuid to impersonate"
        style={{
          flex: 1,
          padding: '6px 8px',
          border: '1px solid #ccc',
          borderRadius: 4,
          fontSize: 13,
        }}
      />
      <button type="submit" style={impersonateBtn}>
        Impersonate
      </button>
    </form>
  );
}

const impersonateBtn = {
  padding: '6px 10px',
  background: '#06c',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
} as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: '#fff',
        padding: 16,
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}
