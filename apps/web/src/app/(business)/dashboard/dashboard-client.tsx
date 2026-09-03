'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LinkButton,
  LoadingRows,
  PageHeader,
  SectionHeading,
  Skeleton,
  Stack,
  StatGrid,
  StatTile,
  StatusBadge,
  TableWrap,
} from '@/components/ui';
import { DateRangePicker, useUrlDateRange } from '@/components/date-range-picker';
import { api } from '@/lib/api';
import { signOut, useSession } from '@/lib/auth-client';
import { addDays } from '@/lib/date-range';
import { Money } from '@/components/money';
import { readActiveBusinessId } from '@/lib/offline';
import { RevenueTrend, type TrendPoint } from './revenue-trend';
import { StatLink, TableCard, usd } from './dashboard-kit';
import ManagerDashboardView from './manager-dashboard';
import OperationsDashboardView from './operations-dashboard';
import WarehouseDashboardView from './warehouse-dashboard';
import MyDayDashboardView from './my-day-dashboard';

interface ChecklistStep {
  key: string;
  label: string;
  done: boolean;
  href: string;
}
interface Checklist {
  businessId: string;
  steps: ChecklistStep[];
  complete: boolean;
}

interface ZReport {
  saleCount: number;
  grossCents: number;
  refundsCents: number;
  netCents: number;
  taxCents: number;
}
interface DailyReport {
  byDay: { day: string; totalCents: number; saleCount: number }[];
}
interface ArReport {
  totalCents: number;
  rows: unknown[];
}
interface LowStockRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  available: number;
}
interface AgencyOverview {
  businesses: { businessId: string; openOrdersCount: number | null }[];
}
interface MorningBrief {
  date: string;
  today: string;
  salesByStore: {
    locationId: string;
    locationName: string | null;
    saleCount: number;
    saleTotalCents: number;
    orderCount: number;
    orderTotalCents: number;
  }[];
  salesByAssociate: {
    userId: string | null;
    name: string | null;
    email: string | null;
    saleTotalCents: number;
    orderTotalCents: number;
    totalCents: number;
  }[];
  deliveriesToday: { booked: number; cap: number; byStatus: Record<string, number> };
  refundsCancellations: {
    id: string;
    action: string;
    actorEmail: string | null;
    orderNumber: string | null;
    createdAt: string;
  }[];
  modifiedOrders: {
    orderId: string;
    orderNumber: string | null;
    changeCount: number;
    actorEmails: string[];
  }[];
  openExceptions: {
    count: number;
    latest: { id: string; type: string; severity: string; summary: string; createdAt: string }[];
  };
}

interface NotificationRow {
  id: string;
  action: string;
  label: string;
  actorName: string | null;
  actorEmail: string | null;
  orderId: string | null;
  orderNumber: string | null;
  createdAt: string;
}

/**
 * The analytics home. Renders inside the (business) shell; each card
 * loads independently and hides itself when the caller's role can't
 * see that data (reports are permission-gated per card, not per page).
 */
interface MyOrderRow {
  id: string;
  number: string;
  status: string;
  fulfillmentType: string | null;
  requestedDate: string | null;
  totalCents: number;
  createdAt: string;
}

export default function DashboardClient() {
  const session = useSession();
  const router = useRouter();
  const [checklist, setChecklist] = useState<Checklist | null | 'no-business'>(null);
  const [error, setError] = useState<string | null>(null);

  const [z, setZ] = useState<ZReport | null>(null);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  // The revenue trend card carries its own window (?trend.range= …).
  const [trendRange, setTrendRange, trendReady] = useUrlDateRange('last30', { key: 'trend' });
  const [arTotal, setArTotal] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<LowStockRow[] | null>(null);
  const [openOrders, setOpenOrders] = useState<number | null>(null);
  const [salesDenied, setSalesDenied] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null);
  const [morning, setMorning] = useState<MorningBrief | null>(null);
  const [myOrders, setMyOrders] = useState<MyOrderRow[] | null>(null);
  // Per-member manager-dashboard toggle (owner decision 2026-08-30):
  // when set, the whole page swaps to the store-scoped manager view.
  const [managerMode, setManagerMode] = useState<boolean | null>(null);
  // Operations role (owner 2026-08-31): fixed by permission rather than a
  // per-member toggle, and it outranks the manager view — a member who is
  // both watches every store rather than one.
  const [opsMode, setOpsMode] = useState<boolean | null>(null);
  // Warehouse role (owner 2026-09-01): same fixed-by-role home switch.
  const [warehouseMode, setWarehouseMode] = useState<boolean | null>(null);
  // Cashier role (owner 2026-09-01): the My Day home.
  const [cashierMode, setCashierMode] = useState<boolean | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!session.data) return;
    void (async () => {
      try {
        const result = await api<Checklist | null>('/v1/onboarding/checklist');
        if (result == null) {
          // Fresh signup with no memberships → punt to /welcome.
          router.replace('/welcome');
          setChecklist('no-business');
        } else {
          setChecklist(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [session.data, router]);

  const businessActive = checklist != null && checklist !== 'no-business';

  useEffect(() => {
    if (!businessActive) return;
    void api<{
      managerDashboard: boolean;
      operationsDashboard: boolean;
      warehouseDashboard: boolean;
      cashierDashboard: boolean;
    }>('/v1/business/members/me')
      .then((r) => {
        setManagerMode(r.managerDashboard);
        setOpsMode(r.operationsDashboard);
        setWarehouseMode(r.warehouseDashboard);
        setCashierMode(r.cashierDashboard);
      })
      .catch(() => {
        setManagerMode(false);
        setOpsMode(false);
        setWarehouseMode(false);
        setCashierMode(false);
      });
    // Sales-gated cards.
    void api<ZReport>('/v1/reports/z')
      .then(setZ)
      .catch(() => setSalesDenied(true));
    // Financial-gated.
    void api<ArReport>('/v1/reports/ar')
      .then((r) => setArTotal(r.totalCents))
      .catch(() => {});
    // Inventory-gated.
    void api<LowStockRow[]>('/v1/reports/inventory/on-hand?lowStock=5')
      .then((rows) => setLowStock(rows.slice(0, 5)))
      .catch(() => {});
    // Audit-gated: post-creation order changes (PLAN-POS-OPERATIONS §12).
    // A 403 hides the card — associates don't see the owner feed.
    void api<{ data: NotificationRow[]; nextCursor: string | null }>('/v1/notifications?limit=10')
      .then((r) => setNotifications(r.data))
      .catch(() => setNotifications(null));
    // P9 morning brief (reports.sales.view; a 403 hides the card).
    void api<MorningBrief>('/v1/dashboard/morning')
      .then(setMorning)
      .catch(() => setMorning(null));
    // My book: orders carrying the signed-in member as salesperson.
    // Every associate gets this card — it needs only orders.view.
    void api<{ data: MyOrderRow[] }>('/v1/orders?mine=1&limit=8')
      .then((r) => setMyOrders(r.data))
      .catch(() => setMyOrders(null));
    // Open orders for the active business, via the membership overview.
    void api<AgencyOverview>('/v1/agency/overview')
      .then((res) => {
        const activeId = readActiveBusinessId();
        const mine = res.businesses.find((b) => b.businessId === activeId);
        setOpenOrders(mine?.openOrdersCount ?? null);
      })
      .catch(() => {});
  }, [businessActive]);

  // Revenue trend: follows its own picker; wait for the URL window to be
  // read so we don't fetch the fallback window and then the real one.
  useEffect(() => {
    if (!businessActive || !trendReady) return;
    const { start, end } = trendRange;
    setTrend(null);
    void api<DailyReport>(`/v1/reports/sales/daily?start=${start}&end=${end}`)
      .then((d) => {
        // Fill missing days with zero so the line spans the whole window.
        const byDay = new Map(d.byDay.map((r) => [r.day, r]));
        const points: TrendPoint[] = [];
        for (let day = start; day <= end; day = addDays(day, 1)) {
          const row = byDay.get(day);
          points.push({ day, totalCents: row?.totalCents ?? 0, saleCount: row?.saleCount ?? 0 });
        }
        setTrend(points);
      })
      .catch(() => setSalesDenied(true));
  }, [businessActive, trendReady, trendRange]);

  if (session.isPending) {
    return (
      <Stack gap="sm">
        <Skeleton style={{ height: 28, width: 260 }} />
        <Skeleton style={{ height: 16, width: 200 }} />
        <Skeleton style={{ height: 120 }} />
      </Stack>
    );
  }

  if (!session.data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Alert
          tone="info"
          action={
            <LinkButton size="sm" variant="primary" href="/login">
              Sign in
            </LinkButton>
          }
        >
          You are not signed in.
        </Alert>
      </>
    );
  }

  if (businessActive && opsMode) {
    return <OperationsDashboardView userName={session.data.user.name ?? session.data.user.email} />;
  }

  if (businessActive && warehouseMode) {
    return <WarehouseDashboardView userName={session.data.user.name ?? session.data.user.email} />;
  }

  if (businessActive && cashierMode) {
    return <MyDayDashboardView userName={session.data.user.name ?? session.data.user.email} />;
  }

  if (businessActive && managerMode) {
    return <ManagerDashboardView userName={session.data.user.name ?? session.data.user.email} />;
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${session.data.user.name ?? session.data.user.email}`}
        sub={
          <span data-testid="dashboard-email">
            Signed in as <strong>{session.data.user.email}</strong>
          </span>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try {
                await signOut();
                window.location.href = '/login';
              } finally {
                setSigningOut(false);
              }
            }}
          >
            <LogOut size={14} aria-hidden />
            Sign out
          </Button>
        }
      />

      <Stack>
        {error && <Alert tone="error">{error}</Alert>}

        {businessActive && !salesDenied && (
          <StatGrid cols={6} data-testid="kpi-row">
            <StatTile label="Sales today" value={z ? String(z.saleCount) : '…'} />
            <StatTile label="Gross today" value={z ? <Money cents={z.grossCents} /> : '…'} />
            <StatTile
              label="Refunds today"
              value={z ? <Money cents={z.refundsCents} /> : '…'}
              tone={z && z.refundsCents > 0 ? 'danger' : undefined}
            />
            <StatTile label="Net today" value={z ? <Money cents={z.netCents} /> : '…'} />
            <StatLink
              label="Open orders"
              value={openOrders != null ? String(openOrders) : '—'}
              href="/orders"
            />
            <StatLink
              label="Receivables"
              value={arTotal != null ? <Money cents={arTotal} /> : '—'}
              href="/reports"
            />
          </StatGrid>
        )}

        {businessActive && myOrders != null && <MyOrdersCard orders={myOrders} />}

        {businessActive && morning != null && <MorningBriefCard brief={morning} />}

        {businessActive && !salesDenied && (
          <Card
            title="Revenue"
            actions={
              <DateRangePicker
                value={trendRange}
                onChange={setTrendRange}
                compact
                align="right"
                testid="trend-range"
              />
            }
          >
            {trend ? <RevenueTrend points={trend} /> : <LoadingRows />}
          </Card>
        )}

        {businessActive && notifications != null && (
          <TableCard
            title="Notifications — order changes"
            actions={
              <Link href="/orders" className="btn-link">
                Orders →
              </Link>
            }
            isEmpty={notifications.length === 0}
            empty="No order changes recorded yet."
          >
            <table className="table table-dense" data-testid="notifications-feed">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Change</th>
                  <th>Order</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td className="muted nowrap">{new Date(n.createdAt).toLocaleString()}</td>
                    <td>
                      <strong>{n.label}</strong>
                    </td>
                    <td>
                      {n.orderId ? (
                        <Link href={`/orders/${n.orderId}`}>{n.orderNumber ?? 'order'}</Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="muted">{n.actorName ?? n.actorEmail ?? 'system'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {businessActive && lowStock != null && (
          <TableCard
            title="Low stock"
            actions={
              <Link href="/inventory" className="btn-link">
                Inventory →
              </Link>
            }
            isEmpty={lowStock.length === 0}
            empty="Nothing at or below 5 available. Shelves look healthy."
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="num">Available</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((r) => (
                  <tr key={r.variantId}>
                    <td>
                      {r.productName}
                      {r.variantName && <span className="muted"> — {r.variantName}</span>}
                    </td>
                    <td>
                      <code>{r.sku ?? '—'}</code>
                    </td>
                    <td className="num">
                      <strong style={{ color: r.available === 0 ? 'var(--danger)' : undefined }}>
                        {r.available}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </Stack>
    </>
  );
}

function MyOrdersCard({ orders }: { orders: MyOrderRow[] }) {
  return (
    <TableCard
      title="My orders"
      actions={
        <>
          <LinkButton size="sm" variant="primary" href="/orders/new">
            New Sale
          </LinkButton>
          <Link href="/orders?mine=1" className="btn-link">
            View all →
          </Link>
        </>
      }
      isEmpty={orders.length === 0}
      empty="Orders you write (or are credited on) appear here for quick follow-up."
      data-testid="my-orders-card"
    >
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Status</th>
            <th>Fulfillment</th>
            <th>Promised</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/orders/${o.id}`}>
                  <strong>{o.number}</strong>
                </Link>
              </td>
              <td>
                <StatusBadge status={o.status} />
              </td>
              <td>{o.fulfillmentType?.replace(/_/g, ' ') ?? '—'}</td>
              <td>{o.requestedDate ?? '—'}</td>
              <td className="num">
                <Money cents={o.totalCents} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

/**
 * The P9 morning brief (PLAN-POS-OPERATIONS §12): yesterday by store
 * and associate, today's truck load, refunds/cancellations with names,
 * the modification log, and the open exception count.
 */
function MorningBriefCard({ brief }: { brief: MorningBrief }) {
  const over = brief.deliveriesToday.booked > brief.deliveriesToday.cap;
  return (
    <Card
      title={`Morning brief — ${brief.date}`}
      actions={
        <Link href="/exceptions" className="btn-link">
          {brief.openExceptions.count > 0
            ? `${brief.openExceptions.count} open exception${brief.openExceptions.count === 1 ? '' : 's'} →`
            : 'Exception register →'}
        </Link>
      }
      data-testid="morning-brief"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <SectionHeading as="h3" title="Yesterday by store" />
          {brief.salesByStore.length === 0 ? (
            <p className="muted">No business written.</p>
          ) : (
            <TableWrap>
              <table className="table table-dense">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th className="num">Orders</th>
                    <th className="num">Written</th>
                    <th className="num">Register</th>
                  </tr>
                </thead>
                <tbody>
                  {brief.salesByStore.map((s) => (
                    <tr key={s.locationId}>
                      <td>{s.locationName ?? '—'}</td>
                      <td className="num">{s.orderCount}</td>
                      <td className="num">{usd(s.orderTotalCents)}</td>
                      <td className="num">{usd(s.saleTotalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
          <SectionHeading as="h3" title="By associate" />
          {brief.salesByAssociate.length === 0 ? (
            <p className="muted">Nothing attributed.</p>
          ) : (
            <TableWrap>
              <table className="table table-dense">
                <thead>
                  <tr>
                    <th>Associate</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {brief.salesByAssociate.map((a) => (
                    <tr key={a.userId ?? 'none'}>
                      <td>{a.name ?? a.email ?? '—'}</td>
                      <td className="num">{usd(a.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
        <div className="min-w-0">
          <SectionHeading
            as="h3"
            title="Today's deliveries"
            actions={
              <Link href="/deliveries/dispatch" className="btn-link">
                Dispatch →
              </Link>
            }
          />
          <p>
            <span style={{ color: over ? 'var(--danger)' : undefined }}>
              {brief.deliveriesToday.booked} of {brief.deliveriesToday.cap} booked
            </span>
            {Object.entries(brief.deliveriesToday.byStatus).map(([k, v]) => (
              <span key={k} className="muted">
                {' '}
                · {v} {k.replace(/_/g, ' ')}
              </span>
            ))}
          </p>
          <SectionHeading as="h3" title="Refunds & cancellations" />
          {brief.refundsCancellations.length === 0 ? (
            <p className="muted">None yesterday.</p>
          ) : (
            <TableWrap>
              <table className="table table-dense">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Order</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {brief.refundsCancellations.slice(0, 8).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.action.replace(/[._]/g, ' ')}</strong>
                      </td>
                      <td>{r.orderNumber ?? '—'}</td>
                      <td className="muted">{r.actorEmail ?? 'system'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
          <SectionHeading as="h3" title="Modified orders" />
          {brief.modifiedOrders.length === 0 ? (
            <p className="muted">No post-creation edits yesterday.</p>
          ) : (
            <TableWrap>
              <table className="table table-dense">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th className="num">Changes</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {brief.modifiedOrders.slice(0, 8).map((m) => (
                    <tr key={m.orderId}>
                      <td>
                        <Link href={`/orders/${m.orderId}`}>{m.orderNumber ?? 'order'}</Link>
                      </td>
                      <td className="num">{m.changeCount}</td>
                      <td className="muted">{m.actorEmails.join(', ') || 'system'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      </div>
    </Card>
  );
}
