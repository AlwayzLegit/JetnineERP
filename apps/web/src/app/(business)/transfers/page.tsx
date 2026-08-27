'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LoadMore } from '@/components/load-more';
import { useCursorList } from '@/lib/use-cursor-list';
import {
  Card,
  EmptyState,
  LinkButton,
  LoadingRows,
  PageHeader,
  StatusBadge,
} from '@/components/ui';

interface TransferRow {
  id: string;
  number: string;
  status: string;
  transferType: string;
  scheduledFor: string | null;
  orderId: string | null;
  fromLocationName: string | null;
  toLocationName: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export default function TransfersPage() {
  const list = useCursorList<TransferRow>('/v1/stock-transfers');
  const [aging, setAging] = useState<{ id: string; number: string; daysInTransit: number }[]>([]);
  const { rows, error } = list;

  useEffect(() => {
    api<{ id: string; number: string; daysInTransit: number }[]>('/v1/stock-transfers/aging?days=3')
      .then(setAging)
      .catch(() => setAging([]));
  }, []);

  useEffect(() => {
    void list.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Stock transfers"
        actions={
          <LinkButton href="/transfers/new" variant="primary">
            + New transfer
          </LinkButton>
        }
      />
      {aging.length > 0 && (
        <div
          className="card"
          data-testid="transfer-aging-alert"
          style={{
            padding: '10px 14px',
            marginBottom: 12,
            borderColor: 'var(--danger)',
            fontSize: 13,
          }}
        >
          <strong>In transit too long:</strong>{' '}
          {aging.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ' · '}
              <Link href={`/transfers/${a.id}`}>
                {a.number} ({a.daysInTransit}d)
              </Link>
            </span>
          ))}
          <span style={{ color: 'var(--text-secondary)' }}>
            {' '}
            — receive them or close them short; goods on the road are sellable nowhere.
          </span>
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card style={{ padding: 0 }}>
        {rows == null ? (
          <div style={{ padding: 16 }}>
            <LoadingRows />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>
            No transfers yet. Create a transfer to move stock between locations.
          </EmptyState>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transfer</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                    <th title="Auto transfers: the XFR-053 schedule date">Scheduled</th>
                    <th>Created</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <code>{t.number}</code>
                        {t.orderId && (
                          <>
                            {' '}
                            <Link href={`/orders/${t.orderId}`} style={{ fontSize: 11.5 }}>
                              order
                            </Link>
                          </>
                        )}
                      </td>
                      <td>
                        {t.transferType === 'auto' ? (
                          <span className="badge badge-info">auto</span>
                        ) : (
                          t.transferType.replace('_', ' ')
                        )}
                      </td>
                      <td>{t.fromLocationName ?? '—'}</td>
                      <td>{t.toLocationName ?? '—'}</td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>
                        {t.scheduledFor
                          ? new Date(`${t.scheduledFor}T00:00:00`).toLocaleDateString()
                          : '—'}
                      </td>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/transfers/${t.id}`}>Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LoadMore state={list} noun="transfers" />
          </>
        )}
      </Card>
    </div>
  );
}
