'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Input, LoadingRows, StatusBadge } from '@/components/ui';
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
  const id = (params?.id ?? '') as string;
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

  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!biz) return <LoadingRows />;

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/admin/businesses">← All businesses</Link>
      </p>
      <h1 className="page-title" style={{ marginBottom: 4 }}>
        {biz.name}
      </h1>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: 13,
          margin: '0 0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        slug <code>{biz.slug}</code> · status <StatusBadge status={biz.status} /> · users{' '}
        {biz.userCount} · locations {biz.locationCount}
      </p>
      <Card title="Members">
        {members ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.membershipId}>
                    <td>{m.email}</td>
                    <td>{m.roleName}</td>
                    <td>
                      <StatusBadge status={m.status} />
                    </td>
                    <td>
                      <Button size="sm" variant="primary" onClick={() => impersonate(m.userId)}>
                        Impersonate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 0 }}>
            Member listing API is Epic 1.6. Use the user&rsquo;s id directly:
          </p>
        )}
        <DirectImpersonate onSubmit={impersonate} />
      </Card>
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
      <Input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="user uuid to impersonate"
        style={{ flex: 1 }}
      />
      <Button type="submit" variant="primary" size="sm">
        Impersonate
      </Button>
    </form>
  );
}
