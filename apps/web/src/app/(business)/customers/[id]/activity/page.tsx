'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  Alert,
  BackLink,
  Card,
  DisplayStatusBadge,
  EmptyState,
  Field,
  KeyValue,
  LinkButton,
  PageHeader,
  Select,
  Skeleton,
  Stack,
  StatGrid,
  StatTile,
  StatusBadge,
  TableWrap,
  Toolbar,
} from '@/components/ui';
import { DateRangePicker, useUrlDateRange } from '@/components/date-range-picker';

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

const PAGE_TITLE = 'View Customer Activity';

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

  const backLink = <BackLink href={`/customers/${id}`}>Customer record</BackLink>;

  if (error && !data) {
    return (
      <div>
        <PageHeader eyebrow={backLink} title={PAGE_TITLE} />
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }
  if (!data) {
    return (
      <div data-testid="activity-loading">
        <PageHeader eyebrow={backLink} title={PAGE_TITLE} />
        <Stack>
          <Skeleton style={{ height: 120 }} />
          <Skeleton style={{ height: 320 }} />
        </Stack>
      </div>
    );
  }
  const c = data.customer;

  return (
    <div data-testid="customer-activity">
      <PageHeader
        eyebrow={backLink}
        title={PAGE_TITLE}
        actions={
          <LinkButton size="sm" href="/customers/activity">
            Look up another customer
          </LinkButton>
        }
      />

      <Stack>
        <Card
          title={<span data-testid="activity-name">{c.name}</span>}
          description={
            <>
              Customer code <code>{c.code}</code>
            </>
          }
          data-testid="activity-header"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <KeyValue
              rows={[
                { label: 'Cell phone', value: c.phone ?? '—' },
                { label: 'Home / other phone', value: c.phone2 ?? '—' },
              ]}
            />
            <KeyValue
              rows={[
                { label: 'Email address', value: c.email ?? '—' },
                {
                  label: 'Store credit balance',
                  value: (
                    <strong data-testid="activity-store-credit">
                      <Money cents={c.storeCreditCents} />
                    </strong>
                  ),
                },
              ]}
            />
          </div>
        </Card>

        <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Spec §12.4: the eight views run down the left (stack above the
              content on phones). No shared side-nav primitive exists yet, so
              this uses the card frame plus token utilities. */}
          <nav aria-label="Customer activity views" className="card card-flush lg:sticky lg:top-4">
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => pick(t.key)}
                  aria-current={active ? 'page' : undefined}
                  data-testid={`activity-tab-${t.key}`}
                  className={[
                    'block w-full cursor-pointer border-0 border-b border-l-[3px] border-b-border px-3.5 py-2.5 text-left transition-colors last:border-b-0',
                    active
                      ? 'border-l-brand bg-surface-muted font-bold'
                      : 'border-l-transparent bg-transparent font-medium hover:bg-surface-muted',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>

          <div className="min-w-0">
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
      </Stack>
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
  const cityLine = a
    ? [a.city, [a.region, a.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—'
    : '—';
  return (
    <Stack>
      <Card title="General information" data-testid="activity-general">
        <div className="grid gap-4 md:grid-cols-2">
          <KeyValue
            rows={[
              { label: 'Address 1', value: a?.line1 ?? '—' },
              { label: 'Address 2', value: a?.line2 ?? '—' },
              { label: 'City, State Zip Code', value: cityLine },
              { label: 'Ship from location', value: data.general.shipFromLocation ?? '—' },
            ]}
          />
          <KeyValue
            rows={[
              {
                label: 'Credit remarks / notes',
                value: <div className="whitespace-pre-wrap">{data.customer.notes ?? '—'}</div>,
              },
            ]}
          />
        </div>
      </Card>
      <Card title="Totals" flush data-testid="activity-totals">
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>
                  <span className="sr-only">Period</span>
                </th>
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
                  <td>
                    <strong>{r.label}</strong>
                  </td>
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
        </TableWrap>
      </Card>
    </Stack>
  );
}

function OpenOrdersSummary({ data }: { data: Activity }) {
  const o = data.openOrders;
  return (
    <StatGrid cols={5}>
      <StatTile label="Credit limit" value="Unlimited" />
      <StatTile
        label="Total orders"
        value={<Money cents={o.totalOrdersCents} />}
        data-testid="sum-total-orders"
      />
      <StatTile
        label="Deposits"
        value={<Money cents={o.depositsCents} />}
        data-testid="sum-deposits"
      />
      <StatTile label="Total A/R" value={<Money cents={o.arCents} />} data-testid="sum-ar" />
      <StatTile
        label="Unpaid balance"
        value={<Money cents={o.unpaidBalanceCents} />}
        tone={o.unpaidBalanceCents > 0 ? 'danger' : undefined}
        data-testid="sum-unpaid"
      />
    </StatGrid>
  );
}

function OpenOrders({ data }: { data: Activity }) {
  const rows = data.openOrders.rows;
  const sum = (k: keyof (typeof rows)[number]) =>
    rows.reduce((s, r) => s + (typeof r[k] === 'number' ? (r[k] as number) : 0), 0);
  return (
    <Card title="Open orders" data-testid="activity-open-orders">
      <Stack>
        <OpenOrdersSummary data={data} />
        {rows.length === 0 ? (
          <EmptyState>No open orders.</EmptyState>
        ) : (
          <TableWrap>
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
                    <td className="capitalize">{r.fulfillmentType.replace(/_/g, ' ')}</td>
                    <td>{fmtDate(r.orderDate)}</td>
                    <td>{r.salespersonName ?? '—'}</td>
                    <td>
                      <DisplayStatusBadge displayStatus={r.displayStatus} />
                    </td>
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
                    <td className="num">
                      <strong>
                        <Money cents={r.balanceCents} />
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
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
          </TableWrap>
        )}
      </Stack>
    </Card>
  );
}

function OrderLineDetails({ data }: { data: Activity }) {
  const orders = data.orderLines;
  const [orderId, setOrderId] = useState<string>(orders[0]?.orderId ?? '');
  const current = useMemo(() => orders.find((o) => o.orderId === orderId), [orders, orderId]);
  return (
    <Card
      title="Order line details"
      data-testid="activity-order-lines"
      actions={
        current ? (
          <LinkButton size="sm" href={`/orders/${current.orderId}`}>
            Open order
          </LinkButton>
        ) : undefined
      }
    >
      {orders.length === 0 ? (
        <EmptyState>No orders yet.</EmptyState>
      ) : (
        <>
          <Toolbar>
            <Field label="Order number">
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
            </Field>
          </Toolbar>
          <TableWrap>
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
                    <td className="nowrap">{l.sku ?? '—'}</td>
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
          </TableWrap>
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
      <Toolbar>
        <Field label="Document filter">
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
        </Field>
      </Toolbar>
      {rows.length === 0 ? (
        <EmptyState>No completed purchases yet.</EmptyState>
      ) : (
        <TableWrap>
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
                  <td className="nowrap">{r.sku ?? '—'}</td>
                  <td>{r.description}</td>
                  <td className="num">{r.quantity}</td>
                  <td className="num">
                    <Money cents={r.priceCents} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
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
        <TableWrap>
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
                  <td className="capitalize">{r.depositType ?? '—'}</td>
                  <td className="num">
                    <Money cents={r.arCreditCents} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
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
        </TableWrap>
      )}
    </Card>
  );
}

function HistoricalDeposits({ data }: { data: Activity }) {
  const h = data.historicalDeposits;
  return (
    <Card title="Historical deposits" data-testid="activity-deposit-history">
      <Stack>
        <StatGrid cols={4}>
          <StatTile
            label="Total deposit liability"
            value={<Money cents={h.totalLiabilityCents} />}
            sub="Money held on undelivered orders"
            data-testid="deposit-liability"
          />
        </StatGrid>
        {h.rows.length === 0 ? (
          <EmptyState>No deposit activity yet.</EmptyState>
        ) : (
          <TableWrap>
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
                    <td className={`num${r.activityCents < 0 ? ' text-danger' : ''}`}>
                      <Money cents={r.activityCents} />
                    </td>
                    <td className="capitalize">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Stack>
    </Card>
  );
}

function OpenArItems({ data }: { data: Activity }) {
  // Section-level window (`ar.range` / `ar.start` / `ar.end` in the URL);
  // "All time" is the default and means no filter. Filtering is client-side
  // on the rows already loaded, so there is nothing to wait for.
  const [range, setRange] = useUrlDateRange('all', { key: 'ar' });
  const rows = data.openArItems.filter((r) => {
    if (range.preset === 'all') return true;
    const d = (r.dueDate ?? r.transactionDate).slice(0, 10);
    return d >= range.start && d <= range.end;
  });
  const total = rows.reduce((s, r) => s + r.amountCents, 0);
  return (
    <Card title="Open A/R items" data-testid="activity-ar">
      <Toolbar>
        {/* Not a <label>: the picker's popover has its own controls, and a
            wrapping label would re-dispatch stray clicks to the trigger. */}
        <div className="field">
          <span className="field-label" id="ar-range-label">
            Due / transaction date
          </span>
          <div aria-labelledby="ar-range-label">
            <DateRangePicker
              value={range}
              onChange={setRange}
              compact
              allowAllTime
              align="left"
              testid="ar-range"
            />
          </div>
        </div>
      </Toolbar>
      <Stack>
        <StatGrid cols={4}>
          <StatTile label="Credit limit" value="Unlimited" />
          <StatTile
            label="Open receivables"
            value={<Money cents={total} />}
            tone={total > 0 ? 'danger' : undefined}
            data-testid="ar-total"
          />
        </StatGrid>
        {rows.length === 0 ? (
          <EmptyState>Nothing owed on delivered orders or scheduled installments.</EmptyState>
        ) : (
          <TableWrap>
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
                    <td className="num">
                      <strong>
                        <Money cents={r.amountCents} />
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Stack>
    </Card>
  );
}

function OpenServiceOrders({ data }: { data: Activity }) {
  const rows = data.openServiceOrders;
  return (
    <Card title="Open service orders" data-testid="activity-service">
      <Stack>
        <OpenOrdersSummary data={data} />
        {rows.length === 0 ? (
          <EmptyState>No open service orders.</EmptyState>
        ) : (
          <TableWrap>
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
          </TableWrap>
        )}
      </Stack>
    </Card>
  );
}
