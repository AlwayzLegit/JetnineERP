'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { PageHeader, LinkButton, LoadingRows } from '@/components/ui';

/**
 * Sales-order pipeline board (STORIS cutover Day 2). One column per live
 * status; an order card moves right as it progresses. Completed and
 * cancelled orders stay off the board — they're history, reachable
 * through the list view below the board.
 */

const PIPELINE = ['quote', 'open', 'partially_fulfilled', 'fulfilled', 'completed'] as const;
const COLUMN_LABEL: Record<string, string> = {
  quote: 'Quotes',
  open: 'Open',
  partially_fulfilled: 'Partially fulfilled',
  fulfilled: 'Fulfilled',
  completed: 'Completed',
};

interface OrderRow {
  id: string;
  number: string;
  status: string;
  customerId: string;
  totalCents: number;
  depositRequiredCents: number;
  fulfillmentType: string;
  requestedDate: string | null;
  createdAt: string;
}
interface CustomerRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState<OrderRow[]>([]);

  async function load() {
    try {
      // One page per pipeline status keeps every column present even when
      // a busy status (open) would otherwise crowd the others out of a
      // single shared page.
      const results = await Promise.all(
        [...PIPELINE, 'cancelled'].map((s) =>
          api<{ data: OrderRow[]; nextCursor: string | null }>(`/v1/orders?status=${s}&limit=50`),
        ),
      );
      const live = results.slice(0, PIPELINE.length).flatMap((r) => r.data);
      setOrders(live);
      setCancelled(results[results.length - 1]!.data);
      const ids = Array.from(new Set(live.map((o) => o.customerId)));
      if (ids.length > 0) {
        // The customers list endpoint pages at 100; a board bigger than
        // that can miss names — the card still renders with the id tail.
        const res = await api<{ data: CustomerRow[]; nextCursor: string | null }>(
          '/v1/customers?limit=100',
        );
        const map: Record<string, string> = {};
        for (const c of res.data) {
          map[c.id] = [c.firstName, c.lastName].filter(Boolean).join(' ') || '(no name)';
        }
        setCustomers(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, OrderRow[]> = {};
    for (const s of PIPELINE) map[s] = [];
    for (const o of orders ?? []) (map[o.status] ??= []).push(o);
    return map;
  }, [orders]);

  return (
    <div>
      <PageHeader
        title="Orders"
        actions={
          <LinkButton href="/orders/new" variant="primary">
            Write order
          </LinkButton>
        }
      />

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      {!orders && !error && <LoadingRows rows={4} />}

      {orders && (
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: 900 }}>
            {PIPELINE.map((status) => (
              <div
                key={status}
                style={{
                  flex: 1,
                  minWidth: 170,
                  background: 'var(--neutral-soft)',
                  borderRadius: 'var(--radius)',
                  padding: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    padding: '4px 6px 8px',
                    marginBottom: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{COLUMN_LABEL[status]}</span>
                  <span
                    data-testid={`pipeline-count-${status}`}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 999,
                      padding: '0 8px',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {byStatus[status]!.length}
                  </span>
                </div>
                {byStatus[status]!.length === 0 && (
                  <p className="muted" style={{ fontSize: 12, padding: '4px 6px', margin: 0 }}>
                    —
                  </p>
                )}
                {byStatus[status]!.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    data-testid="order-card"
                    className="card"
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      margin: '0 0 8px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{o.number}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {customers[o.customerId] ?? `…${o.customerId.slice(-6)}`}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <Money cents={o.totalCents} />
                      <span style={{ color: 'var(--text-muted)' }}>
                        {' · '}
                        {o.fulfillmentType}
                        {o.requestedDate ? ` · ${o.requestedDate}` : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelled.length > 0 && (
        <details style={{ marginTop: 20, fontSize: 13 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Cancelled ({cancelled.length})
          </summary>
          <ul style={{ paddingLeft: 18 }}>
            {cancelled.map((o) => (
              <li key={o.id} style={{ margin: '4px 0' }}>
                <Link href={`/orders/${o.id}`}>{o.number}</Link> — <Money cents={o.totalCents} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
