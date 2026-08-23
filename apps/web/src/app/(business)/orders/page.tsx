'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Orders</h1>
        <Link
          href="/orders/new"
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            background: '#111',
            color: '#fff',
            borderRadius: 4,
            textDecoration: 'none',
            fontSize: 13,
          }}
        >
          Write order
        </Link>
      </div>

      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {!orders && !error && <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>}

      {orders && (
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: 900 }}>
            {PIPELINE.map((status) => (
              <div key={status} style={{ flex: 1, minWidth: 170 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#666',
                    padding: '6px 8px',
                    borderBottom: '2px solid #111',
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{COLUMN_LABEL[status]}</span>
                  <span data-testid={`pipeline-count-${status}`}>{byStatus[status]!.length}</span>
                </div>
                {byStatus[status]!.length === 0 && (
                  <p style={{ color: '#bbb', fontSize: 12, padding: '4px 8px' }}>—</p>
                )}
                {byStatus[status]!.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    data-testid="order-card"
                    style={{
                      display: 'block',
                      background: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: 6,
                      padding: '10px 12px',
                      marginBottom: 8,
                      textDecoration: 'none',
                      color: 'inherit',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{o.number}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {customers[o.customerId] ?? `…${o.customerId.slice(-6)}`}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <Money cents={o.totalCents} />
                      <span style={{ color: '#999' }}>
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
          <summary style={{ cursor: 'pointer', color: '#666' }}>
            Cancelled ({cancelled.length})
          </summary>
          <ul style={{ paddingLeft: 18 }}>
            {cancelled.map((o) => (
              <li key={o.id} style={{ margin: '4px 0' }}>
                <Link href={`/orders/${o.id}`} style={{ color: '#06c' }}>
                  {o.number}
                </Link>{' '}
                — <Money cents={o.totalCents} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
