'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Card, EmptyState, Input, Select, Skeleton, StatusBadge } from '@/components/ui';

/**
 * View Customer Activity (owner 2026-09-02, STORIS-style): one customer,
 * eight views down the left — General Information, Open Orders, Order
 * Line Details, Historical Purchases, Current Deposits, Historical
 * Deposits, Open A/R Items, Open Service Orders. Read-only; every number
 * comes from `GET /v1/customers/:id/activity` and links to its document.
 */

interface YearTotals {
  sales: { cents: number; count: number };
  returns: { cents: number; count: number };
  service: { cents: number; count: number };
}
interface Activity {
  customer: {
    id: string;
    code: string;
    name: string;
    phone: string | null;
    phone2: string | null;
    email: string | null;
    address: {
      line1: string | null;
      line2: string | null;
      city: string | null;
      region: string | null;
      postalCode: string | null;
    } | null;
    storeCreditCents: number;
    notes: string | null;
  };
  general: {
    shipFromLocation: string | null;
    totals: { thisYear: YearTotals; lastYear: YearTotals; lifetime: YearTotals };
  };
  openOrders: {
    totalOrdersCents: number;
    depositsCents: number;
    arCents: number;
    unpaidBalanceCents: number;
    rows: {
      id: string;
      number: string;
      orderType: string;
      fulfillmentType: string;
      orderDate: string;
      salespersonName: string | null;
      merchandiseCents: number;
      otherCents: number;
      totalCents: number;
      amountPaidCents: number;
      balanceCents: number;
      displayStatus: string;
    }[];
  };
  orderLines: {
    orderId: string;
    number: string;
    status: string;
    lines: {
      id: string;
      sku: string | null;
      description: string;
      qtyReserved: number;
      qtyOrdered: number;
      backorderQty: number;
      fulfillmentDate: string | null;
      qtyReceived: number;
      poNumber: string | null;
      poId: string | null;
      poDeliveryDate: string | null;
      poQuantity: number;
      fulfillmentMethod: string;
      fulfillmentStatus: string;
    }[];
  }[];
  historicalPurchases: {
    docId: string;
    docType: 'order' | 'sale' | 'return';
    number: string;
    orderType: string;
    invoiceDate: string;
    sku: string | null;
    description: string;
    quantity: number;
    priceCents: number;
  }[];
  currentDeposits: {
    orderId: string;
    number: string;
    depositCents: number;
    orderCents: number;
    orderType: string;
    orderDate: string;
    depositType: string | null;
    arCreditCents: number;
  }[];
  historicalDeposits: {
    totalLiabilityCents: number;
    rows: {
      id: string;
      orderId: string;
      number: string;
      type: string;
      date: string;
      depositCents: number;
      activityCents: number;
      reason: string;
    }[];
  };
  openArItems: {
    id: string;
    orderId: string;
    reference: string;
    transactionDate: string;
    dueDate: string | null;
    inDispute: boolean;
    transactionType: string;
    memo: string;
    amountCents: number;
  }[];
  openServiceOrders: {
    id: string;
    number: string;
    orderDate: string;
    type: string;
    coordinator: string | null;
    status: string;
    product: string;
    description: string;
    estimatedDate: string | null;
    scheduledDate: string | null;
    totalCents: number;
  }[];
}

const TABS = [
  { key: 'general', label: 'General Information' },
  { key: 'open-orders', label: 'Open Orders' },
  { key: 'order-lines', label: 'Order Line Details' },
  { key: 'history', label: 'Historical Purchases' },
  { key: 'deposits', label: 'Current Deposits' },
  { key: 'deposit-history', label: 'Historical Deposits' },
  { key: 'ar', label: 'Open A/R Items' },
  { key: 'service', label: 'Open Service Orders' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function docHref(docType: 'order' | 'sale' | 'return', docId: string): string {
  if (docType === 'sale') return `/sales/${docId}`;
  return `/orders/${docId}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return m && day && y ? `${m}/${day}/${y}` : d;
}

export default function CustomerActivityPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [data, setData] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('general');

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('tab');
    if (initial && TABS.some((t) => t.key === initial)) setTab(initial as TabKey);
  }, []);

  useEffect(() => {
    if (!id) return;
    api<Activity>(`/v1/customers/${id}/activity`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [id]);

  function pick(next: TabKey) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState(null, '', url.toString());
  }

  if (error && !data) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!data) {
    return (
      <div data-testid="activity-loading">
        <Skeleton style={{ height: 28, width: 320, marginBottom: 12 }} />
        <Skeleton style={{ height: 120, marginBottom: 16 }} />
        <Skeleton style={{ height: 320 }} />
      </div>
    );
  }
  const c = data.customer;

  return (
    <div data-testid="customer-activity">
      <p style={{ margin: '0 0 12px' }}>
        <Link href={`/customers/${c.id}`}>← Customer record</Link>
        <span style={{ color: 'var(--text-muted)' }}> · </span>
        <Link href="/customers/activity">Look up another customer</Link>
      </p>
      <h1 className="page-title" style={{ marginBottom: 12 }}>
        View Customer Activity
      </h1>

      <Card style={{ marginBottom: 16 }} data-testid="activity-header">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Customer code</div>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
              {c.code}
            </div>
            <div
              style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}
              data-testid="activity-name"
            >
              {c.name}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cell phone</div>
            <div>{c.phone ?? '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Home / other phone
            </div>
            <div>{c.phone2 ?? '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email address</div>
            <div style={{ wordBreak: 'break-all' }}>{c.email ?? '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Store credit balance</div>
            <div style={{ fontWeight: 600 }} data-testid="activity-store-credit">
              <Money cents={c.storeCreditCents} />
            </div>
          </div>
        </div>
      </Card>

      <div
        style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}
      >
        <nav
          aria-label="Customer activity views"
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
                data-testid={`activity-tab-${t.key}`}
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
          {tab === 'general' && <GeneralInformation data={data} />}
          {tab === 'open-orders' && <OpenOrders data={data} />}
          {tab === 'order-lines' && <OrderLineDetails data={data} />}
          {tab === 'history' && <HistoricalPurchases data={data} />}
          {tab === 'deposits' && <CurrentDeposits data={data} />}
          {tab === 'deposit-history' && <HistoricalDeposits data={data} />}
          {tab === 'ar' && <OpenArItems data={data} />}
          {tab === 'service' && <OpenServiceOrders data={data} />}
        </div>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{children}</div>
    </div>
  );
}

function MoneyBox({ label, cents, testid }: { label: string; cents: number; testid?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        padding: '6px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }} data-testid={testid}>
        <Money cents={cents} />
      </span>
    </div>
  );
}

function GeneralInformation({ data }: { data: Activity }) {
  const a = data.customer.address;
  const t = data.general.totals;
  const rows: { label: string; y: YearTotals }[] = [
    { label: 'This year', y: t.thisYear },
    { label: 'Last year', y: t.lastYear },
    { label: 'Lifetime', y: t.lifetime },
  ];
  return (
    <>
      <Card title="General information" data-testid="activity-general">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div style={{ display: 'grid', gap: 10 }}>
            <Labeled label="Address 1">{a?.line1 ?? '—'}</Labeled>
            <Labeled label="Address 2">{a?.line2 ?? '—'}</Labeled>
            <Labeled label="City, State Zip Code">
              {a
                ? [a.city, [a.region, a.postalCode].filter(Boolean).join(' ')]
                    .filter(Boolean)
                    .join(', ') || '—'
                : '—'}
            </Labeled>
            <Labeled label="Ship from location">{data.general.shipFromLocation ?? '—'}</Labeled>
          </div>
          <Labeled label="Credit remarks / notes">
            <div style={{ whiteSpace: 'pre-wrap', minHeight: 60 }}>
              {data.customer.notes ?? '—'}
            </div>
          </Labeled>
        </div>
      </Card>
      <Card title="Totals" style={{ marginTop: 16 }} data-testid="activity-totals">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th className="num">Sales</th>
                <th className="num">#</th>
                <th className="num">Returns</th>
                <th className="num">#</th>
                <th className="num">Service</th>
                <th className="num">#</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} data-testid={`totals-${r.label.toLowerCase().replace(' ', '-')}`}>
                  <td style={{ fontWeight: 600 }}>{r.label}</td>
                  <td className="num">
                    <Money cents={r.y.sales.cents} />
                  </td>
                  <td className="num">{r.y.sales.count}</td>
                  <td className="num">
                    <Money cents={r.y.returns.cents} />
                  </td>
                  <td className="num">{r.y.returns.count}</td>
                  <td className="num">
                    <Money cents={r.y.service.cents} />
                  </td>
                  <td className="num">{r.y.service.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function OpenOrdersSummary({ data }: { data: Activity }) {
  const o = data.openOrders;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" style={{ marginBottom: 16 }}>
      <div>
        <Labeled label="Credit limit">Unlimited</Labeled>
      </div>
      <div>
        <MoneyBox label="Total orders" cents={o.totalOrdersCents} testid="sum-total-orders" />
        <MoneyBox label="Deposits" cents={o.depositsCents} testid="sum-deposits" />
        <MoneyBox label="Total A/R" cents={o.arCents} testid="sum-ar" />
        <MoneyBox label="Unpaid balance" cents={o.unpaidBalanceCents} testid="sum-unpaid" />
      </div>
    </div>
  );
}

function OpenOrders({ data }: { data: Activity }) {
  const rows = data.openOrders.rows;
  const sum = (k: keyof (typeof rows)[number]) =>
    rows.reduce((s, r) => s + (typeof r[k] === 'number' ? (r[k] as number) : 0), 0);
  return (
    <Card title="Open orders" data-testid="activity-open-orders">
      <OpenOrdersSummary data={data} />
      {rows.length === 0 ? (
        <EmptyState>No open orders.</EmptyState>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Order type</th>
                <th>Fulfillment</th>
                <th>Order date</th>
                <th>Salesperson</th>
                <th>Status</th>
                <th className="num">Merchandise</th>
                <th className="num">Other</th>
                <th className="num">Total</th>
                <th className="num">Amount paid</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-testid="open-order-row">
                  <td>
                    <Link href={`/orders/${r.id}`}>{r.number}</Link>
                  </td>
                  <td>{r.orderType}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {r.fulfillmentType.replace(/_/g, ' ')}
                  </td>
                  <td>{fmtDate(r.orderDate)}</td>
                  <td>{r.salespersonName ?? '—'}</td>
                  <td>{r.displayStatus}</td>
                  <td className="num">
                    <Money cents={r.merchandiseCents} />
                  </td>
                  <td className="num">
                    <Money cents={r.otherCents} />
                  </td>
                  <td className="num">
                    <Money cents={r.totalCents} />
                  </td>
                  <td className="num">
                    <Money cents={r.amountPaidCents} />
                  </td>
                  <td className="num" style={{ fontWeight: 600 }}>
                    <Money cents={r.balanceCents} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700 }}>
                <td colSpan={6}>Totals</td>
                <td className="num">
                  <Money cents={sum('merchandiseCents')} />
                </td>
                <td className="num">
                  <Money cents={sum('otherCents')} />
                </td>
                <td className="num">
                  <Money cents={sum('totalCents')} />
                </td>
                <td className="num">
                  <Money cents={sum('amountPaidCents')} />
                </td>
                <td className="num">
                  <Money cents={sum('balanceCents')} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}

function OrderLineDetails({ data }: { data: Activity }) {
  const orders = data.orderLines;
  const [orderId, setOrderId] = useState<string>(orders[0]?.orderId ?? '');
  const current = useMemo(() => orders.find((o) => o.orderId === orderId), [orders, orderId]);
  return (
    <Card title="Order line details" data-testid="activity-order-lines">
      {orders.length === 0 ? (
        <EmptyState>No orders yet.</EmptyState>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginBottom: 12 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Order number</span>
              <Select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                data-testid="order-lines-select"
              >
                {orders.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    {o.number} · {o.status.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </label>
            {current && <Link href={`/orders/${current.orderId}`}>Open order</Link>}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Description</th>
                  <th className="num">Qty reserved</th>
                  <th className="num">Qty ordered</th>
                  <th className="num">Backorder qty</th>
                  <th>Fulfillment date</th>
                  <th className="num">Qty received</th>
                  <th>PO number</th>
                  <th>PO delivery date</th>
                  <th className="num">PO qty</th>
                  <th>Fulfillment method</th>
                  <th>Fulfillment status</th>
                </tr>
              </thead>
              <tbody>
                {(current?.lines ?? []).map((l) => (
                  <tr key={l.id} data-testid="order-line-row">
                    <td style={{ whiteSpace: 'nowrap' }}>{l.sku ?? '—'}</td>
                    <td>{l.description}</td>
                    <td className="num">{l.qtyReserved}</td>
                    <td className="num">{l.qtyOrdered}</td>
                    <td className="num">{l.backorderQty}</td>
                    <td>{fmtDate(l.fulfillmentDate)}</td>
                    <td className="num">{l.qtyReceived}</td>
                    <td>
                      {l.poNumber && l.poId ? (
                        <Link href={`/purchase-orders/${l.poId}`}>{l.poNumber}</Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{fmtDate(l.poDeliveryDate)}</td>
                    <td className="num">{l.poQuantity || '—'}</td>
                    <td>{l.fulfillmentMethod}</td>
                    <td>{l.fulfillmentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function HistoricalPurchases({ data }: { data: Activity }) {
  const [filter, setFilter] = useState<'all' | 'order' | 'sale' | 'return'>('all');
  const rows = data.historicalPurchases.filter((r) => filter === 'all' || r.docType === filter);
  return (
    <Card title="Historical purchases" data-testid="activity-history">
      <label style={{ display: 'grid', gap: 4, marginBottom: 12, maxWidth: 260 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Document filter</span>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          data-testid="history-filter"
        >
          <option value="all">All documents</option>
          <option value="order">Delivered orders</option>
          <option value="sale">Register sales</option>
          <option value="return">Returns</option>
        </Select>
      </label>
      {rows.length === 0 ? (
        <EmptyState>No completed purchases yet.</EmptyState>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order number</th>
                <th>Order type</th>
                <th>Invoice date</th>
                <th>Product</th>
                <th>Description</th>
                <th className="num">Quantity</th>
                <th className="num">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.docId}-${i}`} data-testid="history-row">
                  <td>
                    <Link href={docHref(r.docType, r.docId)}>{r.number}</Link>
                  </td>
                  <td>{r.orderType}</td>
                  <td>{fmtDate(r.invoiceDate)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.sku ?? '—'}</td>
                  <td>{r.description}</td>
                  <td className="num">{r.quantity}</td>
                  <td className="num">
                    <Money cents={r.priceCents} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function CurrentDeposits({ data }: { data: Activity }) {
  const rows = data.currentDeposits;
  const totalDeposit = rows.reduce((s, r) => s + r.depositCents, 0);
  const totalCredit = rows.reduce((s, r) => s + r.arCreditCents, 0);
  return (
    <Card title="Current deposits" data-testid="activity-deposits">
      {rows.length === 0 ? (
        <EmptyState>No open orders holding deposits.</EmptyState>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order number</th>
                <th className="num">Deposit amount</th>
                <th className="num">Order amount</th>
                <th>Order type</th>
                <th>Order date</th>
                <th>Deposit type</th>
                <th className="num">A/R credit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.orderId} data-testid="deposit-row">
                  <td>
                    <Link href={`/orders/${r.orderId}`}>{r.number}</Link>
                  </td>
                  <td className="num">
                    <Money cents={r.depositCents} />
                  </td>
                  <td className="num">
                    <Money cents={r.orderCents} />
                  </td>
                  <td>{r.orderType}</td>
                  <td>{fmtDate(r.orderDate)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.depositType ?? '—'}</td>
                  <td className="num">
                    <Money cents={r.arCreditCents} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700 }}>
                <td>Totals</td>
                <td className="num" data-testid="deposits-total">
                  <Money cents={totalDeposit} />
                </td>
                <td colSpan={4}></td>
                <td className="num">
                  <Money cents={totalCredit} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}

function HistoricalDeposits({ data }: { data: Activity }) {
  const h = data.historicalDeposits;
  return (
    <Card title="Historical deposits" data-testid="activity-deposit-history">
      <div style={{ maxWidth: 320, marginBottom: 12 }}>
        <MoneyBox
          label="Total deposit liability"
          cents={h.totalLiabilityCents}
          testid="deposit-liability"
        />
      </div>
      {h.rows.length === 0 ? (
        <EmptyState>No deposit activity yet.</EmptyState>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order number</th>
                <th>Type</th>
                <th>Date</th>
                <th className="num">Deposit amount</th>
                <th className="num">Activity amount</th>
                <th>Reason for activity</th>
              </tr>
            </thead>
            <tbody>
              {h.rows.map((r) => (
                <tr key={r.id} data-testid="deposit-history-row">
                  <td>
                    {r.orderId ? <Link href={`/orders/${r.orderId}`}>{r.number}</Link> : r.number}
                  </td>
                  <td>{r.type}</td>
                  <td>{fmtDate(r.date)}</td>
                  <td className="num">
                    <Money cents={r.depositCents} />
                  </td>
                  <td
                    className="num"
                    style={{ color: r.activityCents < 0 ? 'var(--danger)' : undefined }}
                  >
                    <Money cents={r.activityCents} />
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function OpenArItems({ data }: { data: Activity }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const rows = data.openArItems.filter((r) => {
    const d = r.dueDate ?? r.transactionDate;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
  const total = rows.reduce((s, r) => s + r.amountCents, 0);
  return (
    <Card title="Open A/R items" data-testid="activity-ar">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4" style={{ marginBottom: 12 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Earliest date</span>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            data-testid="ar-from"
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Latest date</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            data-testid="ar-to"
          />
        </label>
        <Labeled label="Credit limit">Unlimited</Labeled>
        <Labeled label="Open receivables">
          <span data-testid="ar-total">
            <Money cents={total} />
          </span>
        </Labeled>
      </div>
      {rows.length === 0 ? (
        <EmptyState>Nothing owed on delivered orders or scheduled installments.</EmptyState>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Transaction date</th>
                <th>Due date</th>
                <th>In dispute</th>
                <th>Transaction type</th>
                <th>Memo reference</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-testid="ar-row">
                  <td>
                    <Link href={`/orders/${r.orderId}`}>{r.reference}</Link>
                  </td>
                  <td>{fmtDate(r.transactionDate)}</td>
                  <td>{fmtDate(r.dueDate)}</td>
                  <td>{r.inDispute ? 'Yes' : 'No'}</td>
                  <td>{r.transactionType}</td>
                  <td>{r.memo}</td>
                  <td className="num" style={{ fontWeight: 600 }}>
                    <Money cents={r.amountCents} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function OpenServiceOrders({ data }: { data: Activity }) {
  const rows = data.openServiceOrders;
  return (
    <Card title="Open service orders" data-testid="activity-service">
      <OpenOrdersSummary data={data} />
      {rows.length === 0 ? (
        <EmptyState>No open service orders.</EmptyState>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order number</th>
                <th>Order date</th>
                <th>Type</th>
                <th>Coordinator</th>
                <th>Status</th>
                <th>Product</th>
                <th>Product description</th>
                <th>Estimated date</th>
                <th>Scheduled date</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-testid="service-row">
                  <td>
                    <Link href={`/service/${r.id}`}>{r.number}</Link>
                  </td>
                  <td>{fmtDate(r.orderDate)}</td>
                  <td>{r.type}</td>
                  <td>{r.coordinator ?? '—'}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.product}</td>
                  <td>{r.description}</td>
                  <td>{fmtDate(r.estimatedDate)}</td>
                  <td>{fmtDate(r.scheduledDate)}</td>
                  <td className="num">
                    <Money cents={r.totalCents} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
