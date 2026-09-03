'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
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
      <Stack>
        {error && <Alert tone="error">{error}</Alert>}
        {!rows && !error && (
          <Card>
            <LoadingRows />
          </Card>
        )}
        {rows && rows.length === 0 && (
          <Card>
            <EmptyState title="No gift cards issued yet">
              Use “+ Issue new” to create the first one.
            </EmptyState>
          </Card>
        )}
        {rows && rows.length > 0 && (
          <Card flush>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th className="num">Balance</th>
                    <th>Issued for</th>
                    <th>Status</th>
                    <th>Issued</th>
                    <th>Expires</th>
                    <th className="actions" />
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
                        <div className="muted">
                          of <Money cents={g.initialBalanceCents} />
                        </div>
                      </td>
                      <td>—</td>
                      <td>
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="nowrap">{new Date(g.createdAt).toLocaleDateString()}</td>
                      <td className="nowrap">
                        {g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="actions">
                        <LinkButton size="sm" href={`/gift-cards/${g.id}`}>
                          Open
                        </LinkButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        )}
      </Stack>
    </div>
  );
}
