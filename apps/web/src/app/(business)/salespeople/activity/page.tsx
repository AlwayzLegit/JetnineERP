'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, EmptyState, Input, LoadingRows, PageHeader } from '@/components/ui';

/**
 * View Salesperson Activity — lookup (owner 2026-09-02, STORIS-style):
 * pick a member of the business and land on their activity views.
 */

interface MemberRow {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
  roleName?: string | null;
  status?: string;
}

export default function SalespersonActivityLookupPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<MemberRow[]>('/v1/business/members')
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const term = q.trim().toLowerCase();
  const hits = (members ?? []).filter(
    (m) =>
      !term || (m.name ?? '').toLowerCase().includes(term) || m.email.toLowerCase().includes(term),
  );

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/salespeople">← Salespeople</Link>
      </p>
      <PageHeader
        title="View Salesperson Activity"
        sub="Pick a salesperson to see their open, completed and canceled orders, layaways, carts, quotes and leads."
      />
      <Card>
        <label style={{ display: 'grid', gap: 4, maxWidth: 480 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Salesperson</span>
          <div style={{ position: 'relative' }}>
            <Input
              autoFocus
              placeholder="Name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && hits[0]) {
                  router.push(`/salespeople/${hits[0].membershipId}/activity`);
                }
              }}
              data-testid="sp-lookup"
              style={{ paddingRight: 32 }}
            />
            <Search
              size={16}
              aria-hidden
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
          </div>
        </label>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        {!members && !error && <LoadingRows rows={4} />}
        {members && hits.length === 0 && <EmptyState>No salespeople match.</EmptyState>}
        {members && hits.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Salesperson</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hits.map((m) => (
                  <tr
                    key={m.membershipId}
                    data-testid="sp-lookup-hit"
                    onClick={() => router.push(`/salespeople/${m.membershipId}/activity`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600 }}>{m.name ?? '(no name)'}</td>
                    <td>{m.email}</td>
                    <td>{m.roleName ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/salespeople/${m.membershipId}/activity`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View activity
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
