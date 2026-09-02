'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { localToday, type DateRange } from '@/lib/date-range';
import { Money } from '@/components/money';
import { Card, EmptyState, Skeleton } from '@/components/ui';
import { DateRangePicker, useUrlDateRange } from '@/components/date-range-picker';

/**
 * View Salesperson Activity (owner 2026-09-02, STORIS-style): one member,
 * eight views down the left — General (totals), Open Orders, Completed
 * Orders, Canceled Orders, Layaways, Carts, Quotes, Leads. Read-only;
 * every number comes from `GET /v1/salespeople/:membershipId/activity`
 * and every row links to its document.
 */

interface OrderRow {
  id: string;
  number: string;
  customerId: string | null;
  customerName: string;
  orderType: string;
  fulfillmentType: string;
  fulfillmentStatus: string;
  orderDate: string;
  fulfillmentDate: string | null;
  completedDate: string | null;
  cancelledDate: string | null;
  merchandiseCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceCents: number;
  salespeople: number;
}
interface Activity {
  salesperson: {
    membershipId: string;
    userId: string;
    code: string;
    name: string;
    email: string | null;
    sellingLocations: string[];
    status: string;
  };
  range: { from: string; to: string; today: string };
  general: {
    ordersCents: number;
    ordersCount: number;
    layawaysCents: number;
    layawaysCount: number;
    quotesCents: number;
    quotesCount: number;
    cartsCents: number;
    cartsCount: number;
    writtenTodayCents: number;
    writtenMtdCents: number;
    deliveredTodayCents: number;
    deliveredMtdCents: number;
  };
  openOrders: OrderRow[];
  completedOrders: OrderRow[];
  canceledOrders: OrderRow[];
  layaways: OrderRow[];
  carts: OrderRow[];
  quotes: OrderRow[];
  leads: {
    customerId: string;
    name: string;
    phone: string | null;
    email: string | null;
    source: string;
    documentId: string;
    documentNumber: string;
    date: string;
  }[];
}

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'open', label: 'Open Orders' },
  { key: 'completed', label: 'Completed Orders' },
  { key: 'canceled', label: 'Canceled Orders' },
  { key: 'layaways', label: 'Layaways' },
  { key: 'carts', label: 'Carts' },
  { key: 'quotes', label: 'Quotes' },
  { key: 'leads', label: 'Leads' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return m && day && y ? `${m}/${day}/${y}` : d;
}

export default function SalespersonActivityPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [data, setData] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('general');
  // Completed / Canceled window, carried in the URL as `window.range` /
  // `window.start` / `window.end`. Named `windowRange` (not `window`) so
  // the global stays reachable below.
  const [windowRange, setWindowRange, windowReady] = useUrlDateRange('last30', { key: 'window' });

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('tab');
    if (initial && TABS.some((t) => t.key === initial)) setTab(initial as TabKey);
  }, []);

  const load = useCallback(
    async (range?: { from: string; to: string }): Promise<Activity | null> => {
      if (!id) return null;
      const qs = new URLSearchParams({ today: localToday() });
      if (range?.from) qs.set('from', range.from);
      if (range?.to) qs.set('to', range.to);
      try {
        const d = await api<Activity>(`/v1/salespeople/${id}/activity?${qs.toString()}`);
        setData(d);
        return d;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    [id],
  );

  // First load: if the URL names a window, use it; otherwise let the API
  // pick its own default (first of last month → end of this month) and seed
  // the picker from the response so the button reads what the tables show.
  useEffect(() => {
    if (!windowReady) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('window.range') || params.has('window.start')) {
      void load({ from: windowRange.start, to: windowRange.end });
    } else {
      void load().then((d) => {
        if (d) setWindowRange({ preset: 'custom', start: d.range.from, end: d.range.to });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once the URL has been read
  }, [windowReady, load]);

  function pickWindow(next: DateRange) {
    setWindowRange(next);
    void load({ from: next.start, to: next.end });
  }

  function pick(next: TabKey) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState(null, '', url.toString());
  }

  if (error && !data) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!data) {
    return (
      <div data-testid="sp-activity-loading">
        <Skeleton style={{ height: 28, width: 320, marginBottom: 12 }} />
        <Skeleton style={{ height: 100, marginBottom: 16 }} />
        <Skeleton style={{ height: 320 }} />
      </div>
    );
  }
  const s = data.salesperson;
  const rangeBar = (
    <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 12 }}>
      <DateRangePicker value={windowRange} onChange={pickWindow} align="left" testid="sp-range" />
    </div>
  );

  return (
    <div data-testid="salesperson-activity">
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/salespeople">← Salespeople</Link>
        <span style={{ color: 'var(--text-muted)' }}> · </span>
        <Link href="/salespeople/activity">Look up another salesperson</Link>
      </p>
      <h1 className="page-title" style={{ marginBottom: 12 }}>
        View Salesperson Activity
      </h1>

      <Card style={{ marginBottom: 16 }} data-testid="sp-header">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Salesperson</div>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
              {s.code}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }} data-testid="sp-name">
              {s.name}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email address</div>
            <div style={{ wordBreak: 'break-all' }}>{s.email ?? '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</div>
            <div style={{ textTransform: 'capitalize' }}>{s.status}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selling location</div>
            <div>
              {s.sellingLocations.length > 0 ? s.sellingLocations.join(', ') : 'All stores'}
            </div>
          </div>
        </div>
      </Card>

      <div
        style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'start' }}
      >
        <nav
          aria-label="Salesperson activity views"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--surface)',
            overflow: 'hidden',
            position: 'sticky',
            top: 16,
          }}
        >
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => pick(t.key)}
                aria-current={active ? 'page' : undefined}
                data-testid={`sp-tab-${t.key}`}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  border: 'none',
                  borderLeft: `3px solid ${active ? 'var(--brand)' : 'transparent'}`,
                  borderBottom: '1px solid var(--border)',
                  background: active ? 'var(--surface-2, rgba(0,0,0,0.05))' : 'transparent',
                  color: 'inherit',
                  font: 'inherit',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <div style={{ minWidth: 0 }}>
          {tab === 'general' && <General data={data} />}
          {tab === 'open' && (
            <OrdersTable
              title="Open orders"
              testid="sp-open"
              rows={data.openOrders}
              variant="open"
              empty="No open orders."
            />
          )}
          {tab === 'completed' && (
            <OrdersTable
              title="Completed orders"
              testid="sp-completed"
              rows={data.completedOrders}
              variant="completed"
              empty="No orders completed in this window."
              before={rangeBar}
            />
          )}
          {tab === 'canceled' && (
            <OrdersTable
              title="Canceled orders"
              testid="sp-canceled"
              rows={data.canceledOrders}
              variant="cancelled"
              empty="No orders canceled in this window."
              before={rangeBar}
            />
          )}
          {tab === 'layaways' && (
            <OrdersTable
              title="Layaways"
              testid="sp-layaways"
              rows={data.layaways}
              variant="open"
              empty="No open layaways."
            />
          )}
          {tab === 'carts' && (
            <OrdersTable
              title="Carts"
              testid="sp-carts"
              rows={data.carts}
              variant="draft"
              empty="No saved carts."
            />
          )}
          {tab === 'quotes' && (
            <OrdersTable
              title="Quotes"
              testid="sp-quotes"
              rows={data.quotes}
              variant="draft"
              empty="No open quotes."
            />
          )}
          {tab === 'leads' && <Leads data={data} />}
        </div>
      </div>
    </div>
  );
}

function MoneyBox({ label, cents, testid }: { label: string; cents: number; testid?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      <div
        style={{ fontWeight: 600, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}
        data-testid={testid}
      >
        <Money cents={cents} />
      </div>
    </div>
  );
}

function General({ data }: { data: Activity }) {
  const g = data.general;
  return (
    <Card title="Totals" data-testid="sp-general">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MoneyBox
          label={`Orders (${g.ordersCount})`}
          cents={g.ordersCents}
          testid="sp-orders-total"
        />
        <MoneyBox
          label={`Layaways (${g.layawaysCount})`}
          cents={g.layawaysCents}
          testid="sp-layaways-total"
        />
        <MoneyBox
          label={`Quotes (${g.quotesCount})`}
          cents={g.quotesCents}
          testid="sp-quotes-total"
        />
        <MoneyBox label={`Carts (${g.cartsCount})`} cents={g.cartsCents} testid="sp-carts-total" />
        <MoneyBox
          label="Written sales today"
          cents={g.writtenTodayCents}
          testid="sp-written-today"
        />
        <MoneyBox
          label="Written sales month to date"
          cents={g.writtenMtdCents}
          testid="sp-written-mtd"
        />
        <MoneyBox
          label="Delivered sales today"
          cents={g.deliveredTodayCents}
          testid="sp-delivered-today"
        />
        <MoneyBox
          label="Delivered sales month to date"
          cents={g.deliveredMtdCents}
          testid="sp-delivered-mtd"
        />
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
        Orders, layaways, quotes and carts are the open documents this salesperson wrote or shares.
        Written counts the day the order was taken; delivered counts the day it completed.
      </p>
    </Card>
  );
}

function OrdersTable({
  title,
  testid,
  rows,
  variant,
  empty,
  before,
}: {
  title: string;
  testid: string;
  rows: OrderRow[];
  variant: 'open' | 'completed' | 'cancelled' | 'draft';
  empty: string;
  before?: React.ReactNode;
}) {
  const sum = (k: 'merchandiseCents' | 'totalCents' | 'amountPaidCents' | 'balanceCents') =>
    rows.reduce((s, r) => s + r[k], 0);
  const dateLabel =
    variant === 'completed'
      ? 'Completed date'
      : variant === 'cancelled'
        ? 'Canceled date'
        : 'Order date';
  const dateOf = (r: OrderRow) =>
    variant === 'completed'
      ? (r.completedDate ?? r.orderDate)
      : variant === 'cancelled'
        ? (r.cancelledDate ?? r.orderDate)
        : r.orderDate;
  return (
    <Card title={title} data-testid={testid}>
      {before}
      {rows.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Order type</th>
                <th>Customer name</th>
                <th>Fulfillment type</th>
                {variant === 'open' && <th>Fulfillment status</th>}
                <th>{dateLabel}</th>
                {variant === 'open' && <th>Fulfillment date</th>}
                <th className="num">Merchandise</th>
                <th className="num">Total</th>
                <th className="num">Amount paid</th>
                <th className="num">Balance</th>
                <th className="num">Salespeople</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-testid={`${testid}-row`}>
                  <td>
                    <Link href={`/orders/${r.id}`}>{r.number}</Link>
                  </td>
                  <td>{r.orderType}</td>
                  <td>
                    {r.customerId ? (
                      <Link href={`/customers/${r.customerId}/activity`}>{r.customerName}</Link>
                    ) : (
                      r.customerName
                    )}
                  </td>
                  <td>{r.fulfillmentType}</td>
                  {variant === 'open' && <td>{r.fulfillmentStatus}</td>}
                  <td>{fmtDate(dateOf(r))}</td>
                  {variant === 'open' && <td>{fmtDate(r.fulfillmentDate)}</td>}
                  <td className="num">
                    <Money cents={r.merchandiseCents} />
                  </td>
                  <td className="num">
                    <Money cents={r.totalCents} />
                  </td>
                  <td className="num">
                    <Money cents={r.amountPaidCents} />
                  </td>
                  <td className="num" style={{ fontWeight: r.balanceCents > 0 ? 600 : undefined }}>
                    <Money cents={r.balanceCents} />
                  </td>
                  <td className="num">{r.salespeople}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700 }}>
                <td colSpan={variant === 'open' ? 7 : 5}>Totals ({rows.length})</td>
                <td className="num" data-testid={`${testid}-merch`}>
                  <Money cents={sum('merchandiseCents')} />
                </td>
                <td className="num" data-testid={`${testid}-total`}>
                  <Money cents={sum('totalCents')} />
                </td>
                <td className="num" data-testid={`${testid}-paid`}>
                  <Money cents={sum('amountPaidCents')} />
                </td>
                <td className="num" data-testid={`${testid}-balance`}>
                  <Money cents={sum('balanceCents')} />
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}

function Leads({ data }: { data: Activity }) {
  const rows = data.leads;
  return (
    <Card title="Leads" data-testid="sp-leads">
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 0 }}>
        Customers on this salesperson&apos;s quotes or carts who have not bought yet.
      </p>
      {rows.length === 0 ? (
        <EmptyState>No open leads.</EmptyState>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Source</th>
                <th>Document</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.customerId} data-testid="sp-lead-row">
                  <td>
                    <Link href={`/customers/${l.customerId}`}>{l.name}</Link>
                  </td>
                  <td>{l.phone ?? '—'}</td>
                  <td>{l.email ?? '—'}</td>
                  <td>{l.source}</td>
                  <td>
                    <Link href={`/orders/${l.documentId}`}>{l.documentNumber}</Link>
                  </td>
                  <td>{fmtDate(l.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
