'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LoadMore } from '@/components/load-more';
import { useCursorList } from '@/lib/use-cursor-list';
import {
  Alert,
  Card,
  EmptyState,
  LinkButton,
  LoadingRows,
  PageHeader,
  Stack,
  StatusBadge,
  TableWrap,
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
          <>
            <LinkButton href="/transfers/manifests" variant="secondary" size="sm">
              Manifests
            </LinkButton>
            <LinkButton href="/transfers/new" variant="primary">
              + New transfer
            </LinkButton>
          </>
        }
      />
      <Stack>
        {aging.length > 0 && (
          <Alert tone="error" title="In transit too long" data-testid="transfer-aging-alert">
            {aging.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ' · '}
                <Link href={`/transfers/${a.id}`}>
                  {a.number} ({a.daysInTransit}d)
                </Link>
              </span>
            ))}
            <span className="muted">
              {' '}
              — receive them or close them short; goods on the road are sellable nowhere.
            </span>
          </Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        {rows == null ? (
          <Card>
            <LoadingRows />
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <EmptyState
              title="No transfers yet"
              action={
                <LinkButton size="sm" href="/transfers/new">
                  New transfer
                </LinkButton>
              }
            >
              Create a transfer to move stock between locations.
            </EmptyState>
          </Card>
        ) : (
          <Card flush>
            <TableWrap>
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
                    <th className="actions" />
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
                            <Link href={`/orders/${t.orderId}`} className="muted">
                              order
                            </Link>
                          </>
                        )}
                      </td>
                      <td>{t.transferType.replace('_', ' ')}</td>
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
                      <td className="actions">
                        <LinkButton size="sm" href={`/transfers/${t.id}`}>
                          Open
                        </LinkButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <LoadMore state={list} noun="transfers" />
          </Card>
        )}
      </Stack>
    </div>
  );
}
