'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { EmptyState, LinkButton, LoadingRows, PageHeader, StatusBadge } from '@/components/ui';

interface GiftCard {
  id: string;
  code: string;
  initialBalanceCents: number;
  currentBalanceCents: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function GiftCardsPage() {
  const [rows, setRows] = useState<GiftCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ data: GiftCard[]; nextCursor: string | null }>('/v1/gift-cards');
        setRows(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Gift cards"
        actions={
          <LinkButton href="/gift-cards/new" variant="primary">
            + Issue new
          </LinkButton>
        }
      />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!rows && !error && (
        <div className="card">
          <LoadingRows />
        </div>
      )}
      {rows && (
        <div className="card">
          {rows.length === 0 ? (
            <EmptyState>
              No gift cards issued yet. Use “+ Issue new” to create the first one.
            </EmptyState>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th className="num">Balance</th>
                  <th>Issued for</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Expires</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <code>{g.code}</code>
                    </td>
                    <td className="num">
                      <Money cents={g.currentBalanceCents} />
                      <div className="muted" style={{ fontSize: 11 }}>
                        of <Money cents={g.initialBalanceCents} />
                      </div>
                    </td>
                    <td>—</td>
                    <td>
                      <StatusBadge status={g.status} />
                    </td>
                    <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                    <td>{g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <Link href={`/gift-cards/${g.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
