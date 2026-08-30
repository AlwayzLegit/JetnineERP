'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, EmptyState, LinkButton, LoadingRows, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

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

const usd = (c: number) =>
  c >= 100_000
    ? `$${(c / 100_000).toFixed(1)}k`
    : `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const PIPELINE_LABELS: Record<string, string> = {
  draft: 'Drafts',
  quote: 'Quotes',
  open: 'Open — unscheduled',
  scheduled: 'Scheduled',
};
const PIPELINE_COLORS: Record<string, string> = {
  draft: 'var(--border-strong)',
  quote: 'var(--warning, #b58900)',
  open: 'var(--accent)',
  scheduled: 'var(--success)',
};

function ageDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
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

  if (error) {
    return (
      <Card title="Dashboard">
        <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>{error}</p>
      </Card>
    );
  }
  if (!data) return <LoadingRows />;

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
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Hi, {userName}</h1>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            {data.date} at <strong>{data.location.name}</strong> ({data.location.timezone})
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {data.locations.length > 1 && (
            <select
              data-testid="manager-store-picker"
              value={locationId ?? ''}
              onChange={(e) => {
                setData(null);
                void load(e.target.value);
              }}
              style={{ fontSize: 13 }}
            >
              {data.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
          <LinkButton size="sm" variant="primary" href="/orders/new">
            New Sale
          </LinkButton>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        style={{ marginBottom: 16 }}
        data-testid="manager-kpi-row"
      >
        <Tile
          label="My sales today"
          testid="kpi-my-sales"
          href="/orders?mine=1"
          main={<Money cents={kpis.mine.writtenCents} />}
          sub={`${kpis.mine.writtenCount} written · ${usd(kpis.mine.collectedCents)} collected`}
          delta={delta(kpis.mine.writtenCents, lastWeekMine)}
        />
        <Tile
          label={`${data.location.name} today`}
          testid="kpi-store-sales"
          href="/orders"
          main={<Money cents={kpis.store.writtenCents} />}
          sub={`${kpis.store.writtenCount} written · ${usd(kpis.store.collectedCents)} collected`}
          delta={delta(kpis.store.writtenCents, lastWeekStore)}
        />
        <Tile
          label="My month vs goal"
          testid="kpi-goal"
          href="/orders?mine=1"
          main={<Money cents={kpis.mine.monthWrittenCents} />}
          sub={
            goal && goal > 0 ? `${goalPct}% of ${usd(goal)} goal` : 'no goal set — ask a manager'
          }
          bar={goalPct}
        />
        <Tile
          label="My commission"
          testid="kpi-commission"
          href="/commissions"
          main={<Money cents={kpis.mine.commissionPeriodCents} />}
          sub="accrued this period"
        />
        <Tile
          label="My open sales"
          testid="kpi-my-open"
          href="/orders?mine=1"
          main={String(kpis.mine.openCount)}
          sub={`${usd(kpis.mine.openBalanceCents)} still owed`}
        />
        <Tile
          label="Needs attention"
          testid="kpi-attention"
          href="/exceptions"
          tone={attention > 0 ? 'danger' : undefined}
          main={String(attention)}
          sub={`${kpis.pastDuePromises} past promise · ${kpis.unpaidAging} unpaid 14d+ · ${kpis.exceptionsOpen} exceptions`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <Card title="Sales by day — 14 days (mine vs store)">
          <SalesByDayChart points={data.salesByDay} />
        </Card>
        <Card title="This week's board">
          {data.leaderboardWeek.length === 0 ? (
            <EmptyState>Nothing written at this store this week yet.</EmptyState>
          ) : (
            <div data-testid="leaderboard" style={{ display: 'grid', gap: 6 }}>
              {data.leaderboardWeek.map((row) => {
                const max = data.leaderboardWeek[0]!.cents || 1;
                return (
                  <div
                    key={row.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
                  >
                    <span
                      style={{
                        width: 130,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {row.name}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        background: 'var(--surface-muted, var(--border))',
                        borderRadius: 4,
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(3, Math.round((row.cents / max) * 100))}%`,
                          background: 'var(--accent)',
                          borderRadius: 4,
                          height: 14,
                        }}
                        title={usd(row.cents)}
                      />
                    </div>
                    <span className="num" style={{ width: 80, textAlign: 'right' }}>
                      {usd(row.cents)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <h4 style={{ margin: '0 0 6px', fontSize: 12.5 }}>Open pipeline</h4>
            <PipelineBar segments={data.pipeline} />
          </div>
        </Card>
      </div>

      <Card
        title="Open sales"
        style={{ marginBottom: 16, padding: 0 }}
        actions={
          <span style={{ display: 'inline-flex', gap: 6 }}>
            <TabButton
              active={queueTab === 'mine'}
              onClick={() => setQueueTab('mine')}
              testid="queue-tab-mine"
            >
              Mine
            </TabButton>
            <TabButton
              active={queueTab === 'store'}
              onClick={() => setQueueTab('store')}
              testid="queue-tab-store"
            >
              Whole store
            </TabButton>
          </span>
        }
      >
        <QueueTable
          rows={queueRows}
          empty="No open sales — write one!"
          testid="open-queue"
          actions
        />
      </Card>

      <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Store operations</h3>
      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <Card title="Deliveries — today & tomorrow" style={{ padding: 0 }}>
          {queues.todaysDeliveries.length === 0 ? (
            <EmptyState>No deliveries scheduled from this store today or tomorrow.</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ fontSize: 12.5 }}>
                        {r.scheduledDate === data.date ? 'Today' : 'Tomorrow'}
                      </td>
                      <td>
                        <Link href={`/orders/${r.id}`}>
                          <strong>{r.number}</strong>
                        </Link>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {r.customerName ?? '—'}
                        {r.customerPhone && (
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {' '}
                            · {r.customerPhone}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {r.windowStart
                          ? `${r.windowStart.slice(0, 5)}–${(r.windowEnd ?? '').slice(0, 5)}`
                          : '—'}
                      </td>
                      <td style={{ fontSize: 13 }}>{r.driverName ?? '—'}</td>
                      <td style={{ fontSize: 13 }}>{r.deliveryState.replace(/_/g, ' ')}</td>
                      <td className="num">
                        {r.balanceDueCents > 0 ? (
                          <strong style={{ color: 'var(--danger)' }}>
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
            </div>
          )}
        </Card>

        <Card
          title="Backorder watch"
          style={{ padding: 0 }}
          actions={
            <Link href="/jeopardy" style={{ fontSize: 12.5 }}>
              At risk →
            </Link>
          }
        >
          {queues.backorders.length === 0 ? (
            <EmptyState>Every promised order has its stock reserved.</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ fontSize: 13 }}>
                        {r.customerName ?? '—'}
                        {r.customerPhone && (
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {' '}
                            · {r.customerPhone}
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          fontSize: 13,
                          color:
                            r.requestedDate && r.requestedDate < data.date
                              ? 'var(--danger)'
                              : undefined,
                        }}
                      >
                        {r.requestedDate ?? '—'}
                      </td>
                      <td className="num">
                        <strong style={{ color: 'var(--danger)' }}>{r.shortUnits}</strong>
                      </td>
                      <td style={{ fontSize: 13 }}>{r.salespersonName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Aging carts — drafts & quotes" style={{ padding: 0 }}>
          {queues.staleCarts.length === 0 ? (
            <EmptyState>No parked drafts or quotes. Clean register!</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ fontSize: 13 }}>{r.customerName ?? '—'}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="num">
                        <Money cents={r.totalCents} />
                      </td>
                      <td className="num" style={{ fontSize: 13 }}>
                        {ageDays(r.createdAt)}d
                      </td>
                      <td style={{ fontSize: 13 }}>{r.salespersonName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Returns & exchanges in flight" style={{ padding: 0 }}>
          {data.returnsInFlight.length === 0 ? (
            <EmptyState>Nothing awaiting goods or a refund.</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ fontSize: 13 }}>{r.rmaNumber}</td>
                      <td>
                        {r.orderId ? (
                          <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ fontSize: 13 }}>{r.customerName ?? '—'}</td>
                      <td style={{ fontSize: 13 }}>{r.status.replace(/_/g, ' ')}</td>
                      <td className="num" style={{ fontSize: 13 }}>
                        {ageDays(r.createdAt)}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title="Incoming stock"
          style={{ padding: 0 }}
          actions={
            <span style={{ display: 'inline-flex', gap: 8 }}>
              <Link href="/transfers" style={{ fontSize: 12.5 }}>
                Transfers →
              </Link>
              <Link href="/purchasing" style={{ fontSize: 12.5 }}>
                Purchasing →
              </Link>
            </span>
          }
        >
          {data.incoming.length === 0 ? (
            <EmptyState>Nothing on a truck or on order for this store.</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ fontSize: 13 }}>{r.kind === 'transfer' ? 'Transfer' : 'PO'}</td>
                      <td style={{ fontSize: 13 }}>
                        <strong>{r.number}</strong>
                      </td>
                      <td style={{ fontSize: 13 }}>{r.status.replace(/_/g, ' ')}</td>
                      <td style={{ fontSize: 13 }}>{r.expected ?? 'no date'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Drawer & tenders today">
          <p style={{ margin: '0 0 8px', fontSize: 13 }} data-testid="drawer-status">
            {data.drawer.suspended ? (
              <strong style={{ color: 'var(--danger)' }}>
                Drawer suspended — needs a manager close.
              </strong>
            ) : data.drawer.shiftOpen ? (
              <>
                Drawer is <strong>open</strong> — remember the blind count at close.
              </>
            ) : data.drawer.closedToday ? (
              <>
                Drawer <strong style={{ color: 'var(--success)' }}>balanced and closed</strong> for
                today.
              </>
            ) : (
              <>No drawer session today yet.</>
            )}{' '}
            <Link href="/cash">Cash →</Link>
          </p>
          {kpis.store.tenderMix.length === 0 ? (
            <EmptyState>No money taken yet today.</EmptyState>
          ) : (
            <div data-testid="tender-mix" style={{ display: 'grid', gap: 5 }}>
              {kpis.store.tenderMix.map((t) => {
                const max = kpis.store.tenderMix[0]!.cents || 1;
                return (
                  <div
                    key={t.method}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}
                  >
                    <span style={{ width: 90, textTransform: 'capitalize' }}>
                      {t.method.replace(/_/g, ' ')}
                    </span>
                    <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4 }}>
                      <div
                        style={{
                          width: `${Math.max(3, Math.round((t.cents / max) * 100))}%`,
                          background: 'var(--success)',
                          height: 12,
                          borderRadius: 4,
                        }}
                        title={usd(t.cents)}
                      />
                    </div>
                    <span className="num" style={{ width: 80, textAlign: 'right' }}>
                      {usd(t.cents)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          title="Low stock at this store"
          style={{ padding: 0 }}
          actions={
            <Link href="/inventory" style={{ fontSize: 12.5 }}>
              Inventory →
            </Link>
          }
        >
          {data.lowStock.length === 0 ? (
            <EmptyState>Nothing at or below 5 available here.</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ fontSize: 13 }}>
                        {r.productName}
                        {r.variantName && (
                          <span style={{ color: 'var(--text-secondary)' }}> — {r.variantName}</span>
                        )}
                      </td>
                      <td>
                        <code style={{ fontSize: 12 }}>{r.sku ?? '—'}</code>
                      </td>
                      <td className="num">
                        <strong style={{ color: r.available <= 0 ? 'var(--danger)' : undefined }}>
                          {r.available}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Store activity — grouped by order">
          {data.activity.length === 0 ? (
            <EmptyState>No order changes recorded at this store yet.</EmptyState>
          ) : (
            <div data-testid="store-activity" style={{ display: 'grid', gap: 4 }}>
              {data.activity.map((g) => (
                <details key={g.orderId} style={{ fontSize: 13 }}>
                  <summary style={{ cursor: 'pointer', padding: '3px 0' }}>
                    <Link href={`/orders/${g.orderId}`}>
                      <strong>{g.orderNumber}</strong>
                    </Link>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {g.events.length} change{g.events.length === 1 ? '' : 's'} · latest{' '}
                      {new Date(g.latestAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </summary>
                  <ul style={{ margin: '2px 0 6px', paddingLeft: 18 }}>
                    {g.events.map((e, i) => (
                      <li key={i} style={{ color: 'var(--text-secondary)' }}>
                        {e.action.replace(/[._]/g, ' ')} · {e.actorName ?? 'system'} ·{' '}
                        {new Date(e.createdAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </Card>
      </div>

      <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>My day</h3>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="My call-backs — quotes & drafts going cold" style={{ padding: 0 }}>
          {myCallbacks.length === 0 ? (
            <EmptyState>No parked quotes of yours are waiting on a decision.</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ fontSize: 13 }}>
                        {r.customerName ?? '—'}
                        {r.customerPhone && (
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {' '}
                            · {r.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="num">
                        <Money cents={r.totalCents} />
                      </td>
                      <td className="num" style={{ fontSize: 13 }}>
                        {ageDays(r.createdAt)}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="My deliveries — today & tomorrow" style={{ padding: 0 }}>
          {myDeliveries.length === 0 ? (
            <EmptyState>None of your sales are on a truck today or tomorrow.</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ fontSize: 12.5 }}>
                        {r.scheduledDate === data.date ? 'Today' : 'Tomorrow'}
                      </td>
                      <td>
                        <Link href={`/orders/${r.id}`}>
                          <strong>{r.number}</strong>
                        </Link>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {r.customerName ?? '—'}
                        {r.customerPhone && (
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {' '}
                            · {r.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="num">
                        {r.balanceDueCents > 0 ? <Money cents={r.balanceDueCents} /> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="My wins — closed last 7 days" style={{ padding: 0 }}>
          <QueueTable
            rows={myWins}
            empty="Nothing delivered this week yet — go get one."
            testid="my-wins"
          />
        </Card>

        <Card title="My follow-up money">
          <h4 style={{ margin: '0 0 6px', fontSize: 12.5 }}>Customers holding store credit</h4>
          {myCredit.length === 0 ? (
            <p className="muted" style={{ margin: '0 0 10px', fontSize: 13 }}>
              None of your customers are sitting on credit.
            </p>
          ) : (
            <ul style={{ margin: '0 0 10px', padding: 0, listStyle: 'none', fontSize: 13 }}>
              {myCredit.map((c) => (
                <li key={c.customerId} style={{ padding: '3px 0' }}>
                  <Link href={`/customers/${c.customerId}`}>{c.customerName ?? 'customer'}</Link>
                  {c.phone && (
                    <span style={{ color: 'var(--text-secondary)' }}> · {c.phone}</span>
                  )}{' '}
                  —{' '}
                  <strong>
                    <Money cents={c.balanceCents} />
                  </strong>
                </li>
              ))}
            </ul>
          )}
          <h4 style={{ margin: '0 0 6px', fontSize: 12.5 }}>My returns in flight</h4>
          {myReturns.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              No open returns on your sales.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13 }}>
              {myReturns.map((r) => (
                <li key={r.id} style={{ padding: '3px 0' }}>
                  {r.orderId ? (
                    <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                  ) : (
                    r.rmaNumber
                  )}{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    · {r.status.replace(/_/g, ' ')} · {ageDays(r.createdAt)}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function delta(todayCents: number, lastWeekCents: number): string | null {
  if (lastWeekCents <= 0) return null;
  const pct = Math.round(((todayCents - lastWeekCents) / lastWeekCents) * 100);
  if (pct === 0) return 'even with last week';
  return `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs same day last week`;
}

function Tile({
  label,
  main,
  sub,
  href,
  tone,
  testid,
  delta: deltaText,
  bar,
}: {
  label: string;
  main: React.ReactNode;
  sub: string;
  href: string;
  tone?: 'danger';
  testid: string;
  delta?: string | null;
  bar?: number | null;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }} data-testid={testid}>
      <div
        className="card-hover"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)',
          padding: '12px 14px',
          height: '100%',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: tone === 'danger' ? 'var(--danger)' : 'var(--text)',
            marginTop: 2,
          }}
        >
          {main}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>
        {deltaText && (
          <div
            style={{
              fontSize: 11,
              marginTop: 2,
              color: deltaText.startsWith('▼') ? 'var(--danger)' : 'var(--success)',
            }}
          >
            {deltaText}
          </div>
        )}
        {bar != null && (
          <div style={{ marginTop: 6, background: 'var(--border)', borderRadius: 4 }}>
            <div
              style={{
                width: `${bar}%`,
                height: 5,
                borderRadius: 4,
                background: bar >= 100 ? 'var(--success)' : 'var(--accent)',
              }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

function TabButton({
  active,
  onClick,
  children,
  testid,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      style={{
        fontSize: 12.5,
        padding: '3px 10px',
        borderRadius: 999,
        border: '1px solid var(--border)',
        background: active ? 'var(--accent)' : 'var(--surface)',
        color: active ? '#fff' : 'var(--text)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
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

function QueueTable({
  rows,
  empty,
  testid,
  actions,
}: {
  rows: QueueRow[];
  empty: string;
  testid: string;
  actions?: boolean;
}) {
  if (rows.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <div style={{ overflowX: 'auto' }}>
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
              <td style={{ fontSize: 13 }}>
                {r.customerId ? (
                  <Link href={`/customers/${r.customerId}`}>{r.customerName ?? 'customer'}</Link>
                ) : (
                  (r.customerName ?? '—')
                )}
                {r.customerPhone && (
                  <span style={{ color: 'var(--text-secondary)' }}> · {r.customerPhone}</span>
                )}
              </td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              <td style={{ fontSize: 13 }}>{r.requestedDate ?? '—'}</td>
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
              <td style={{ fontSize: 13 }}>{r.salespersonName ?? '—'}</td>
              {actions && (
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {nextAction(r) ?? '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesByDayChart({
  points,
}: {
  points: { day: string; mineCents: number; storeCents: number }[];
}) {
  const max = Math.max(1, ...points.map((p) => p.storeCents));
  return (
    <div>
      <div
        data-testid="sales-by-day"
        style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}
      >
        {points.map((p) => (
          <div
            key={p.day}
            title={`${p.day}: store ${usd(p.storeCents)} · mine ${usd(p.mineCents)}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              height: '100%',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: `${Math.round((p.storeCents / max) * 100)}%`,
                minHeight: p.storeCents > 0 ? 3 : 0,
                background: 'var(--border-strong)',
                borderRadius: '3px 3px 0 0',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height:
                    p.storeCents > 0 ? `${Math.round((p.mineCents / p.storeCents) * 100)}%` : 0,
                  background: 'var(--accent)',
                  borderRadius: p.mineCents === p.storeCents ? '3px 3px 0 0' : 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10.5,
          color: 'var(--text-muted)',
          marginTop: 4,
        }}
      >
        <span>{points[0]?.day.slice(5)}</span>
        <span>
          <span style={{ color: 'var(--accent)' }}>■</span> mine ·{' '}
          <span style={{ color: 'var(--border-strong)' }}>■</span> store
        </span>
        <span>{points[points.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

function PipelineBar({ segments }: { segments: { key: string; count: number; cents: number }[] }) {
  const total = segments.reduce((s, x) => s + x.cents, 0);
  if (total === 0) return <EmptyState>No open pipeline at this store.</EmptyState>;
  return (
    <div data-testid="pipeline-bar">
      <div style={{ display: 'flex', height: 16, borderRadius: 6, overflow: 'hidden' }}>
        {segments.map((s) => (
          <div
            key={s.key}
            title={`${PIPELINE_LABELS[s.key] ?? s.key}: ${s.count} · ${usd(s.cents)}`}
            style={{
              width: `${Math.max(2, Math.round((s.cents / total) * 100))}%`,
              background: PIPELINE_COLORS[s.key] ?? 'var(--accent)',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, marginTop: 6 }}>
        {segments.map((s) => (
          <span key={s.key} style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: PIPELINE_COLORS[s.key] ?? 'var(--accent)' }}>■</span>{' '}
            {PIPELINE_LABELS[s.key] ?? s.key} {s.count} · {usd(s.cents)}
          </span>
        ))}
      </div>
    </div>
  );
}
