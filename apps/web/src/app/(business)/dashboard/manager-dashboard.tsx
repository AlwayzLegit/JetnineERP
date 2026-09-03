'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Alert,
  Card,
  EmptyState,
  LinkButton,
  LoadingRows,
  PageHeader,
  SectionHeading,
  Select,
  Stack,
  StatGrid,
  StatusBadge,
  TableWrap,
} from '@/components/ui';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { StatLink, TableCard, usdShort as usd } from './dashboard-kit';

interface QueueRow {
  id: string;
  number: string;
  status: string;
  deliveryStatus: string | null;
  requestedDate: string | null;
  totalCents: number;
  balanceDueCents: number;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  salespersonName: string | null;
  salespersonMembershipId: string | null;
  secondSalespersonMembershipId: string | null;
  createdAt: string;
  shortUnits: number;
}

type DeliveryRow = QueueRow & {
  deliveryId: string;
  deliveryState: string;
  scheduledDate: string;
  windowStart: string | null;
  windowEnd: string | null;
  driverName: string | null;
};

interface ManagerDashboard {
  date: string;
  location: { id: string; name: string; timezone: string };
  locations: { id: string; name: string }[];
  membershipId: string;
  kpis: {
    mine: {
      writtenCents: number;
      writtenCount: number;
      collectedCents: number;
      openCount: number;
      openBalanceCents: number;
      closed7dCount: number;
      closed7dCents: number;
      monthWrittenCents: number;
      monthlyGoalCents: number | null;
      commissionPeriodCents: number;
    };
    store: {
      writtenCents: number;
      writtenCount: number;
      collectedCents: number;
      tenderMix: { method: string; cents: number }[];
    };
    exceptionsOpen: number;
    pastDuePromises: number;
    unpaidAging: number;
  };
  drawer: { shiftOpen: boolean; closedToday: boolean; suspended: boolean };
  salesByDay: { day: string; mineCents: number; storeCents: number }[];
  leaderboardWeek: { name: string; cents: number }[];
  pipeline: { key: string; count: number; cents: number }[];
  queues: {
    myOpen: QueueRow[];
    storeOpen: QueueRow[];
    recentlyClosed: QueueRow[];
    todaysDeliveries: DeliveryRow[];
    backorders: QueueRow[];
    staleCarts: QueueRow[];
  };
  returnsInFlight: {
    id: string;
    rmaNumber: string;
    status: string;
    createdAt: string;
    orderId: string | null;
    orderNumber: string | null;
    customerName: string | null;
    salespersonMembershipId: string | null;
    salespersonName: string | null;
  }[];
  incoming: {
    kind: 'transfer' | 'po';
    id: string;
    number: string;
    status: string;
    expected: string | null;
  }[];
  lowStock: {
    variantId: string;
    productName: string;
    variantName: string | null;
    sku: string | null;
    available: number;
  }[];
  creditHolders: {
    customerId: string;
    customerName: string | null;
    phone: string | null;
    balanceCents: number;
    salespersonMembershipId: string | null;
    salespersonName: string | null;
  }[];
  activity: {
    orderId: string;
    orderNumber: string;
    latestAt: string;
    events: { action: string; actorName: string | null; createdAt: string }[];
  }[];
}

const PIPELINE_LABELS: Record<string, string> = {
  draft: 'Drafts',
  quote: 'Quotes',
  open: 'Open — unscheduled',
  scheduled: 'Scheduled',
};
/** Tailwind classes (over the theme tokens) for each pipeline stage's bar segment + legend swatch. */
const PIPELINE_DEFAULT_TONE = { bar: 'bg-brand', swatch: 'text-brand' };
const PIPELINE_TONES: Record<string, { bar: string; swatch: string }> = {
  draft: { bar: 'bg-border-strong', swatch: 'text-border-strong' },
  quote: { bar: 'bg-warning', swatch: 'text-warning' },
  open: PIPELINE_DEFAULT_TONE,
  scheduled: { bar: 'bg-success', swatch: 'text-success' },
};

function ageDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * The store-manager home (owner decisions 2026-08-30): everything scoped
 * to ONE store picked from the member's approved list, "today" in that
 * store's local time, written business leading. The daily-ops pack adds
 * the store operations grid (deliveries, backorders, carts, returns,
 * incoming stock, drawer, low stock, activity) and the "my day" section
 * (goal pace, commission, worklist, call-backs, wins, follow-ups).
 */
export default function ManagerDashboardView({ userName }: { userName: string }) {
  const [data, setData] = useState<ManagerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [queueTab, setQueueTab] = useState<'mine' | 'store'>('mine');

  useEffect(() => {
    let initial: string | null = null;
    try {
      const raw = sessionStorage.getItem('jetnine.sellingStore');
      if (raw) initial = (JSON.parse(raw) as { id?: string }).id ?? null;
    } catch {
      initial = null;
    }
    setLocationId(initial);
    void load(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(loc: string | null) {
    setError(null);
    try {
      const qs = loc ? `?locationId=${loc}` : '';
      const d = await api<ManagerDashboard>(`/v1/dashboard/manager${qs}`);
      setData(d);
      setLocationId(d.location.id);
    } catch (err) {
      if (loc) {
        void load(null);
        return;
      }
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const title = `Hi, ${userName}`;

  if (error) {
    return (
      <>
        <PageHeader title={title} />
        <Alert tone="error">{error}</Alert>
      </>
    );
  }
  if (!data) {
    return (
      <>
        <PageHeader title={title} />
        <LoadingRows />
      </>
    );
  }

  const { kpis, queues } = data;
  const mineOf = (r: {
    salespersonMembershipId: string | null;
    secondSalespersonMembershipId?: string | null;
  }) =>
    r.salespersonMembershipId === data.membershipId ||
    r.secondSalespersonMembershipId === data.membershipId;

  // Delta vs the same weekday last week: series index 13 is today,
  // index 6 is exactly seven store-local days earlier.
  const lastWeekStore = data.salesByDay[6]?.storeCents ?? 0;
  const lastWeekMine = data.salesByDay[6]?.mineCents ?? 0;
  const attention = kpis.exceptionsOpen + kpis.pastDuePromises + kpis.unpaidAging;
  const queueRows = queueTab === 'mine' ? queues.myOpen : queues.storeOpen;
  const myCallbacks = queues.staleCarts.filter(mineOf);
  const myDeliveries = queues.todaysDeliveries.filter(mineOf);
  const myWins = queues.recentlyClosed.filter(mineOf);
  const myReturns = data.returnsInFlight.filter(mineOf);
  const myCredit = data.creditHolders.filter(mineOf);
  const goal = kpis.mine.monthlyGoalCents;
  const goalPct =
    goal && goal > 0 ? Math.min(100, Math.round((kpis.mine.monthWrittenCents / goal) * 100)) : null;

  return (
    <div data-testid="manager-dashboard">
      <PageHeader
        title={title}
        sub={
          <>
            {data.date} at <strong>{data.location.name}</strong> ({data.location.timezone})
          </>
        }
        actions={
          <>
            {data.locations.length > 1 && (
              <Select
                aria-label="Store"
                data-testid="manager-store-picker"
                value={locationId ?? ''}
                onChange={(e) => {
                  setData(null);
                  void load(e.target.value);
                }}
              >
                {data.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            )}
            <LinkButton variant="primary" href="/orders/new">
              New Sale
            </LinkButton>
          </>
        }
      />

      <Stack>
        <StatGrid cols={6} data-testid="manager-kpi-row">
          <StatLink
            label="My sales today"
            testid="kpi-my-sales"
            href="/orders?mine=1"
            value={<Money cents={kpis.mine.writtenCents} />}
            sub={
              <TileSub
                text={`${kpis.mine.writtenCount} written · ${usd(kpis.mine.collectedCents)} collected`}
                delta={delta(kpis.mine.writtenCents, lastWeekMine)}
              />
            }
          />
          <StatLink
            label={`${data.location.name} today`}
            testid="kpi-store-sales"
            href="/orders"
            value={<Money cents={kpis.store.writtenCents} />}
            sub={
              <TileSub
                text={`${kpis.store.writtenCount} written · ${usd(kpis.store.collectedCents)} collected`}
                delta={delta(kpis.store.writtenCents, lastWeekStore)}
              />
            }
          />
          <StatLink
            label="My month vs goal"
            testid="kpi-goal"
            href="/orders?mine=1"
            value={<Money cents={kpis.mine.monthWrittenCents} />}
            sub={
              <TileSub
                text={
                  goal && goal > 0
                    ? `${goalPct}% of ${usd(goal)} goal`
                    : 'no goal set — ask a manager'
                }
                bar={goalPct}
              />
            }
          />
          <StatLink
            label="My commission"
            testid="kpi-commission"
            href="/commissions"
            value={<Money cents={kpis.mine.commissionPeriodCents} />}
            sub="accrued this period"
          />
          <StatLink
            label="My open sales"
            testid="kpi-my-open"
            href="/orders?mine=1"
            value={String(kpis.mine.openCount)}
            sub={`${usd(kpis.mine.openBalanceCents)} still owed`}
          />
          <StatLink
            label="Needs attention"
            testid="kpi-attention"
            href="/exceptions"
            tone={attention > 0 ? 'danger' : undefined}
            value={String(attention)}
            sub={`${kpis.pastDuePromises} past promise · ${kpis.unpaidAging} unpaid 14d+ · ${kpis.exceptionsOpen} exceptions`}
          />
        </StatGrid>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Sales by day — 14 days (mine vs store)">
            <SalesByDayChart points={data.salesByDay} />
          </Card>
          <Card title="This week's board">
            {data.leaderboardWeek.length === 0 ? (
              <EmptyState>Nothing written at this store this week yet.</EmptyState>
            ) : (
              <BarList
                testid="leaderboard"
                rows={data.leaderboardWeek.map((r) => ({ label: r.name, cents: r.cents }))}
                tone="brand"
              />
            )}
            <SectionHeading as="h3" title="Open pipeline" />
            <PipelineBar segments={data.pipeline} />
          </Card>
        </div>

        <TableCard
          title="Open sales"
          actions={
            <>
              <button
                type="button"
                className={`pill ${queueTab === 'mine' ? 'pill-active' : ''}`}
                aria-pressed={queueTab === 'mine'}
                onClick={() => setQueueTab('mine')}
                data-testid="queue-tab-mine"
              >
                Mine
              </button>
              <button
                type="button"
                className={`pill ${queueTab === 'store' ? 'pill-active' : ''}`}
                aria-pressed={queueTab === 'store'}
                onClick={() => setQueueTab('store')}
                data-testid="queue-tab-store"
              >
                Whole store
              </button>
            </>
          }
          isEmpty={queueRows.length === 0}
          empty="No open sales — write one!"
        >
          <QueueTable rows={queueRows} testid="open-queue" actions />
        </TableCard>

        <SectionHeading title="Store operations" />
        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard
            title="Deliveries — today & tomorrow"
            isEmpty={queues.todaysDeliveries.length === 0}
            empty="No deliveries scheduled from this store today or tomorrow."
          >
            <table className="table" data-testid="today-deliveries">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Window</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th className="num">Collect</th>
                </tr>
              </thead>
              <tbody>
                {queues.todaysDeliveries.map((r) => (
                  <tr key={r.deliveryId}>
                    <td>{r.scheduledDate === data.date ? 'Today' : 'Tomorrow'}</td>
                    <td>
                      <Link href={`/orders/${r.id}`}>
                        <strong>{r.number}</strong>
                      </Link>
                    </td>
                    <td>
                      {r.customerName ?? '—'}
                      {r.customerPhone && <span className="muted"> · {r.customerPhone}</span>}
                    </td>
                    <td className="nowrap">
                      {r.windowStart
                        ? `${r.windowStart.slice(0, 5)}–${(r.windowEnd ?? '').slice(0, 5)}`
                        : '—'}
                    </td>
                    <td>{r.driverName ?? '—'}</td>
                    <td>
                      <StatusBadge status={r.deliveryState} />
                    </td>
                    <td className="num">
                      {r.balanceDueCents > 0 ? (
                        <strong className="text-danger">
                          <Money cents={r.balanceDueCents} />
                        </strong>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title="Backorder watch"
            actions={
              <Link href="/jeopardy" className="btn-link">
                At risk →
              </Link>
            }
            isEmpty={queues.backorders.length === 0}
            empty="Every promised order has its stock reserved."
          >
            <table className="table" data-testid="backorders">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Promised</th>
                  <th className="num">Short</th>
                  <th>Salesperson</th>
                </tr>
              </thead>
              <tbody>
                {queues.backorders.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/orders/${r.id}`}>
                        <strong>{r.number}</strong>
                      </Link>
                    </td>
                    <td>
                      {r.customerName ?? '—'}
                      {r.customerPhone && <span className="muted"> · {r.customerPhone}</span>}
                    </td>
                    <td
                      className={
                        r.requestedDate && r.requestedDate < data.date ? 'text-danger' : undefined
                      }
                    >
                      {r.requestedDate ?? '—'}
                    </td>
                    <td className="num">
                      <strong className="text-danger">{r.shortUnits}</strong>
                    </td>
                    <td>{r.salespersonName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title="Aging carts — drafts & quotes"
            isEmpty={queues.staleCarts.length === 0}
            empty="No parked drafts or quotes. Clean register!"
          >
            <table className="table" data-testid="stale-carts">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="num">Value</th>
                  <th className="num">Age</th>
                  <th>Salesperson</th>
                </tr>
              </thead>
              <tbody>
                {queues.staleCarts.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/orders/${r.id}`}>
                        <strong>{r.number}</strong>
                      </Link>
                    </td>
                    <td>{r.customerName ?? '—'}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="num">
                      <Money cents={r.totalCents} />
                    </td>
                    <td className="num">{ageDays(r.createdAt)}d</td>
                    <td>{r.salespersonName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title="Returns & exchanges in flight"
            isEmpty={data.returnsInFlight.length === 0}
            empty="Nothing awaiting goods or a refund."
          >
            <table className="table" data-testid="returns-in-flight">
              <thead>
                <tr>
                  <th>RMA</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="num">Age</th>
                </tr>
              </thead>
              <tbody>
                {data.returnsInFlight.map((r) => (
                  <tr key={r.id}>
                    <td>{r.rmaNumber}</td>
                    <td>
                      {r.orderId ? <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link> : '—'}
                    </td>
                    <td>{r.customerName ?? '—'}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="num">{ageDays(r.createdAt)}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title="Incoming stock"
            actions={
              <>
                <Link href="/transfers" className="btn-link">
                  Transfers →
                </Link>
                <Link href="/purchasing" className="btn-link">
                  Purchasing →
                </Link>
              </>
            }
            isEmpty={data.incoming.length === 0}
            empty="Nothing on a truck or on order for this store."
          >
            <table className="table" data-testid="incoming-stock">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Number</th>
                  <th>Status</th>
                  <th>Expected</th>
                </tr>
              </thead>
              <tbody>
                {data.incoming.map((r) => (
                  <tr key={`${r.kind}-${r.id}`}>
                    <td>{r.kind === 'transfer' ? 'Transfer' : 'PO'}</td>
                    <td>
                      <strong>{r.number}</strong>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>{r.expected ?? 'no date'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <Card
            title="Drawer & tenders today"
            actions={
              <Link href="/cash" className="btn-link">
                Cash →
              </Link>
            }
          >
            <p data-testid="drawer-status">
              {data.drawer.suspended ? (
                <strong className="text-danger">Drawer suspended — needs a manager close.</strong>
              ) : data.drawer.shiftOpen ? (
                <>
                  Drawer is <strong>open</strong> — remember the blind count at close.
                </>
              ) : data.drawer.closedToday ? (
                <>
                  Drawer <strong className="text-success">balanced and closed</strong> for today.
                </>
              ) : (
                <>No drawer session today yet.</>
              )}
            </p>
            <SectionHeading as="h3" title="Tender mix" />
            {kpis.store.tenderMix.length === 0 ? (
              <EmptyState>No money taken yet today.</EmptyState>
            ) : (
              <BarList
                testid="tender-mix"
                rows={kpis.store.tenderMix.map((t) => ({
                  label: t.method.replace(/_/g, ' '),
                  cents: t.cents,
                }))}
                tone="success"
                capitalize
              />
            )}
          </Card>

          <TableCard
            title="Low stock at this store"
            actions={
              <Link href="/inventory" className="btn-link">
                Inventory →
              </Link>
            }
            isEmpty={data.lowStock.length === 0}
            empty="Nothing at or below 5 available here."
          >
            <table className="table" data-testid="store-low-stock">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="num">Available</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((r) => (
                  <tr key={r.variantId}>
                    <td>
                      {r.productName}
                      {r.variantName && <span className="muted"> — {r.variantName}</span>}
                    </td>
                    <td>
                      <code>{r.sku ?? '—'}</code>
                    </td>
                    <td className="num">
                      <strong className={r.available <= 0 ? 'text-danger' : undefined}>
                        {r.available}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <Card title="Store activity — grouped by order">
            {data.activity.length === 0 ? (
              <EmptyState>No order changes recorded at this store yet.</EmptyState>
            ) : (
              <Stack gap="sm" data-testid="store-activity">
                {data.activity.map((g) => (
                  <details key={g.orderId}>
                    <summary className="cursor-pointer">
                      <Link href={`/orders/${g.orderId}`}>
                        <strong>{g.orderNumber}</strong>
                      </Link>{' '}
                      <span className="muted">
                        {g.events.length} change{g.events.length === 1 ? '' : 's'} · latest{' '}
                        {timeOf(g.latestAt)}
                      </span>
                    </summary>
                    <ul className="muted list-disc pl-5">
                      {g.events.map((e, i) => (
                        <li key={i}>
                          {e.action.replace(/[._]/g, ' ')} · {e.actorName ?? 'system'} ·{' '}
                          {timeOf(e.createdAt)}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </Stack>
            )}
          </Card>
        </div>

        <SectionHeading title="My day" />
        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard
            title="My call-backs — quotes & drafts going cold"
            isEmpty={myCallbacks.length === 0}
            empty="No parked quotes of yours are waiting on a decision."
          >
            <table className="table" data-testid="my-callbacks">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="num">Value</th>
                  <th className="num">Age</th>
                </tr>
              </thead>
              <tbody>
                {myCallbacks.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/orders/${r.id}`}>
                        <strong>{r.number}</strong>
                      </Link>
                    </td>
                    <td>
                      {r.customerName ?? '—'}
                      {r.customerPhone && <span className="muted"> · {r.customerPhone}</span>}
                    </td>
                    <td className="num">
                      <Money cents={r.totalCents} />
                    </td>
                    <td className="num">{ageDays(r.createdAt)}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title="My deliveries — today & tomorrow"
            isEmpty={myDeliveries.length === 0}
            empty="None of your sales are on a truck today or tomorrow."
          >
            <table className="table" data-testid="my-deliveries">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="num">Collect</th>
                </tr>
              </thead>
              <tbody>
                {myDeliveries.map((r) => (
                  <tr key={r.deliveryId}>
                    <td>{r.scheduledDate === data.date ? 'Today' : 'Tomorrow'}</td>
                    <td>
                      <Link href={`/orders/${r.id}`}>
                        <strong>{r.number}</strong>
                      </Link>
                    </td>
                    <td>
                      {r.customerName ?? '—'}
                      {r.customerPhone && <span className="muted"> · {r.customerPhone}</span>}
                    </td>
                    <td className="num">
                      {r.balanceDueCents > 0 ? <Money cents={r.balanceDueCents} /> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title="My wins — closed last 7 days"
            isEmpty={myWins.length === 0}
            empty="Nothing delivered this week yet — go get one."
          >
            <QueueTable rows={myWins} testid="my-wins" />
          </TableCard>

          <Card title="My follow-up money">
            <SectionHeading as="h3" title="Customers holding store credit" />
            {myCredit.length === 0 ? (
              <p className="muted">None of your customers are sitting on credit.</p>
            ) : (
              <TableWrap>
                <table className="table table-dense">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th className="num">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myCredit.map((c) => (
                      <tr key={c.customerId}>
                        <td>
                          <Link href={`/customers/${c.customerId}`}>
                            {c.customerName ?? 'customer'}
                          </Link>
                          {c.phone && <span className="muted"> · {c.phone}</span>}
                        </td>
                        <td className="num">
                          <strong>
                            <Money cents={c.balanceCents} />
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
            <SectionHeading as="h3" title="My returns in flight" />
            {myReturns.length === 0 ? (
              <p className="muted">No open returns on your sales.</p>
            ) : (
              <TableWrap>
                <table className="table table-dense">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th className="num">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReturns.map((r) => (
                      <tr key={r.id}>
                        <td>
                          {r.orderId ? (
                            <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                          ) : (
                            r.rmaNumber
                          )}
                        </td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="num">{ageDays(r.createdAt)}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Card>
        </div>
      </Stack>
    </div>
  );
}

function delta(todayCents: number, lastWeekCents: number): string | null {
  if (lastWeekCents <= 0) return null;
  const pct = Math.round(((todayCents - lastWeekCents) / lastWeekCents) * 100);
  if (pct === 0) return 'even with last week';
  return `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs same day last week`;
}

/**
 * The sub-line of a KPI tile: the caption, an optional week-over-week
 * delta (coloured by direction — data-driven), and an optional goal bar.
 */
function TileSub({
  text,
  delta: deltaText,
  bar,
}: {
  text: string;
  delta?: string | null;
  bar?: number | null;
}) {
  return (
    <Stack gap="sm">
      {text}
      {deltaText && (
        <div className={deltaText.startsWith('▼') ? 'text-danger' : 'text-success'}>
          {deltaText}
        </div>
      )}
      {bar != null && <Meter value={bar} tone={bar >= 100 ? 'success' : 'brand'} height={5} />}
    </Stack>
  );
}

type MeterTone = 'brand' | 'success';
const METER_FILL: Record<MeterTone, string> = { brand: 'bg-brand', success: 'bg-success' };

/** A horizontal fill bar; width (and height) are data-driven, the colour is a tone. */
function Meter({
  value,
  tone,
  height,
  title,
}: {
  value: number;
  tone: MeterTone;
  height: number;
  title?: string;
}) {
  return (
    <div className="flex-1 rounded bg-border">
      <div
        className={`rounded ${METER_FILL[tone]}`}
        title={title}
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, height }}
      />
    </div>
  );
}

/** Label / bar / amount rows — the leaderboard and the tender mix. */
function BarList({
  rows,
  tone,
  testid,
  capitalize,
}: {
  rows: { label: string; cents: number }[];
  tone: MeterTone;
  testid: string;
  capitalize?: boolean;
}) {
  const max = rows[0]?.cents || 1;
  return (
    <Stack gap="sm" data-testid={testid}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className={`w-32 truncate ${capitalize ? 'capitalize' : ''}`}>{row.label}</span>
          <Meter
            value={Math.max(3, Math.round((row.cents / max) * 100))}
            tone={tone}
            height={12}
            title={usd(row.cents)}
          />
          <span className="w-20 text-right tabular-nums">{usd(row.cents)}</span>
        </div>
      ))}
    </Stack>
  );
}

function nextAction(r: QueueRow): string | null {
  if (r.shortUnits > 0) return `${r.shortUnits} short`;
  if (r.status === 'draft' || r.status === 'quote') return 'confirm the sale';
  if (r.balanceDueCents > 0 && !r.deliveryStatus) return 'collect & schedule';
  if (!r.deliveryStatus) return 'schedule delivery';
  if (r.balanceDueCents > 0) return 'collect balance';
  return null;
}

/** The table body of an order queue; the caller supplies the card and empty state. */
function QueueTable({
  rows,
  testid,
  actions,
}: {
  rows: QueueRow[];
  testid: string;
  actions?: boolean;
}) {
  return (
    <table className="table" data-testid={testid}>
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Promised</th>
          <th className="num">Total</th>
          <th className="num">Balance</th>
          <th>Salesperson</th>
          {actions && <th>Next action</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <Link href={`/orders/${r.id}`}>
                <strong>{r.number}</strong>
              </Link>
            </td>
            <td>
              {r.customerId ? (
                <Link href={`/customers/${r.customerId}`}>{r.customerName ?? 'customer'}</Link>
              ) : (
                (r.customerName ?? '—')
              )}
              {r.customerPhone && <span className="muted"> · {r.customerPhone}</span>}
            </td>
            <td>
              <StatusBadge status={r.status} />
            </td>
            <td>{r.requestedDate ?? '—'}</td>
            <td className="num">
              <Money cents={r.totalCents} />
            </td>
            <td className="num">
              {r.balanceDueCents > 0 ? (
                <strong>
                  <Money cents={r.balanceDueCents} />
                </strong>
              ) : (
                '—'
              )}
            </td>
            <td>{r.salespersonName ?? '—'}</td>
            {actions && <td className="muted">{nextAction(r) ?? '—'}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SalesByDayChart({
  points,
}: {
  points: { day: string; mineCents: number; storeCents: number }[];
}) {
  const max = Math.max(1, ...points.map((p) => p.storeCents));
  return (
    <Stack gap="sm">
      <div data-testid="sales-by-day" className="flex items-end gap-1" style={{ height: 120 }}>
        {points.map((p) => (
          <div
            key={p.day}
            title={`${p.day}: store ${usd(p.storeCents)} · mine ${usd(p.mineCents)}`}
            className="relative flex h-full flex-1 flex-col justify-end"
          >
            <div
              className="relative rounded-t bg-border-strong"
              style={{
                height: `${Math.round((p.storeCents / max) * 100)}%`,
                minHeight: p.storeCents > 0 ? 3 : 0,
              }}
            >
              <div
                className="absolute inset-x-0 bottom-0 bg-brand"
                style={{
                  height:
                    p.storeCents > 0 ? `${Math.round((p.mineCents / p.storeCents) * 100)}%` : 0,
                  borderRadius: p.mineCents === p.storeCents ? '3px 3px 0 0' : 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="muted flex justify-between text-[10.5px]">
        <span>{points[0]?.day.slice(5)}</span>
        <span>
          <span className="text-brand">■</span> mine · <span className="text-border-strong">■</span>{' '}
          store
        </span>
        <span>{points[points.length - 1]?.day.slice(5)}</span>
      </div>
    </Stack>
  );
}

function PipelineBar({ segments }: { segments: { key: string; count: number; cents: number }[] }) {
  const total = segments.reduce((s, x) => s + x.cents, 0);
  if (total === 0) return <EmptyState>No open pipeline at this store.</EmptyState>;
  return (
    <Stack gap="sm" data-testid="pipeline-bar">
      <div className="flex overflow-hidden rounded-md" style={{ height: 16 }}>
        {segments.map((s) => (
          <div
            key={s.key}
            title={`${PIPELINE_LABELS[s.key] ?? s.key}: ${s.count} · ${usd(s.cents)}`}
            className={(PIPELINE_TONES[s.key] ?? PIPELINE_DEFAULT_TONE).bar}
            style={{ width: `${Math.max(2, Math.round((s.cents / total) * 100))}%` }}
          />
        ))}
      </div>
      <div className="muted flex flex-wrap gap-3 text-xs">
        {segments.map((s) => (
          <span key={s.key}>
            <span className={(PIPELINE_TONES[s.key] ?? PIPELINE_DEFAULT_TONE).swatch}>■</span>{' '}
            {PIPELINE_LABELS[s.key] ?? s.key} {s.count} · {usd(s.cents)}
          </span>
        ))}
      </div>
    </Stack>
  );
}
