'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { EmptyState, LinkButton, LoadingRows, PageHeader, StatusBadge } from '@/components/ui';

interface SaleRow {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  customerId: string | null;
  associateUserId: string | null;
  locationId: string;
  completedAt: string | null;
  createdAt: string;
}

export default function SalesPage() {
  const [rows, setRows] = useState<SaleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ data: SaleRow[]; nextCursor: string | null }>('/v1/sales');
        setRows(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Sales"
        actions={
          <LinkButton href="/pos" variant="primary">
            Open register
          </LinkButton>
        }
      />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!rows && !error && (
        <div className="card">
          <LoadingRows rows={5} />
        </div>
      )}
      {rows && (
        <div className="card">
          {rows.length === 0 ? (
            <EmptyState>No sales yet. Ring one up at the register to see it here.</EmptyState>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Sale</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                  <th>Date</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code>{s.number}</code>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="num">
                      <Money cents={s.totalCents} />
                    </td>
                    <td>{new Date(s.completedAt ?? s.createdAt).toLocaleString()}</td>
                    <td>
                      <Link href={`/sales/${s.id}`}>Open</Link>
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
