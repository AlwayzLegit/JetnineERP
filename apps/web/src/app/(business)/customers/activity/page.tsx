'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, EmptyState, Input, PageHeader } from '@/components/ui';

/**
 * View Customer Activity — lookup (owner 2026-09-02, STORIS-style blank
 * screen): type a name, phone or email, pick the customer, and land on
 * their activity views.
 */

interface Hit {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
}

export default function CustomerActivityLookupPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits(null);
      return;
    }
    let stale = false;
    const t = setTimeout(() => {
      api<{ data: Hit[] }>(`/v1/customers?q=${encodeURIComponent(term)}&limit=20`)
        .then((r) => {
          if (!stale) setHits(r.data);
        })
        .catch((err) => {
          if (!stale) setError(err instanceof Error ? err.message : String(err));
        });
    }, 200);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/customers">← All customers</Link>
      </p>
      <PageHeader
        title="View Customer Activity"
        sub="Look up a customer to see their orders, line details, purchase history, deposits, receivables and service orders."
      />
      <Card>
        <label style={{ display: 'grid', gap: 4, maxWidth: 480 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Customer</span>
          <div style={{ position: 'relative' }}>
            <Input
              autoFocus
              placeholder="Name, phone or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && hits && hits[0]) {
                  router.push(`/customers/${hits[0].id}/activity`);
                }
              }}
              data-testid="activity-lookup"
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
        {hits && hits.length === 0 && <EmptyState>No customers match.</EmptyState>}
        {hits && hits.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hits.map((h) => (
                  <tr
                    key={h.id}
                    data-testid="activity-lookup-hit"
                    onClick={() => router.push(`/customers/${h.id}/activity`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600 }}>
                      {[h.firstName, h.lastName].filter(Boolean).join(' ') || '(no name)'}
                    </td>
                    <td>{h.phone ?? h.phone2 ?? '—'}</td>
                    <td>{h.email ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/customers/${h.id}/activity`}
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
