'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Repeat } from 'lucide-react';
import { LoadMore } from '@/components/load-more';
import { useCursorList } from '@/lib/use-cursor-list';
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

interface ExchangeRow {
  id: string;
  number: string;
  status: string;
  rmaNumber: string | null;
  returnCents: number;
  restockingFeeCents: number;
  saleOrderNumber: string | null;
  saleTotalCents: number;
  originalOrderNumber: string | null;
  referencedOrderNumber: string | null;
  customerName: string | null;
  createdAt: string;
}

export default function ExchangesPage() {
  const list = useCursorList<ExchangeRow>('/v1/exchanges');
  const { rows, error } = list;

  useEffect(() => {
    void list.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Exchanges"
        sub="One settlement over two documents: the return credits the replacement; the difference is the balance due."
        actions={
          <LinkButton href="/exchanges/new" variant="primary">
            <Repeat size={14} />
            New exchange
          </LinkButton>
        }
      />
      <Stack>
        {error && <Alert tone="error">{error}</Alert>}
        {rows == null && !error && <LoadingRows rows={4} />}
        {rows && rows.length === 0 && (
          <EmptyState
            title="No exchanges yet"
            action={
              <LinkButton size="sm" href="/exchanges/new">
                New exchange
              </LinkButton>
            }
          >
            Start one from an order&apos;s detail page or with New exchange.
          </EmptyState>
        )}
        {rows && rows.length > 0 && (
          <Card flush>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Exchange</th>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Original</th>
                    <th className="num">Return credit</th>
                    <th className="num">Fee</th>
                    <th>Replacement</th>
                    <th className="num">Sale total</th>
                    <th>Written</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/exchanges/${r.id}`}>
                          <code>{r.number}</code>
                        </Link>
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>{r.customerName ?? '—'}</td>
                      <td>
                        <code>{r.originalOrderNumber ?? r.referencedOrderNumber ?? '—'}</code>
                      </td>
                      <td className="num">
                        <Money cents={r.returnCents} />
                      </td>
                      <td className="num">
                        {r.restockingFeeCents > 0 ? <Money cents={r.restockingFeeCents} /> : '—'}
                      </td>
                      <td>
                        <code>{r.saleOrderNumber ?? '—'}</code>
                      </td>
                      <td className="num">
                        <Money cents={r.saleTotalCents} />
                      </td>
                      <td className="nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <LoadMore state={list} noun="exchanges" />
          </Card>
        )}
      </Stack>
    </div>
  );
}
