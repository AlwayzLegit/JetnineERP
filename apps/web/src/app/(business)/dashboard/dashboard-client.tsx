'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, EmptyState, LoadingRows, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { signOut, useSession } from '@/lib/auth-client';
import { Money } from '@/components/money';
import { readActiveBusinessId } from '@/lib/offline';
import { RevenueTrend, type TrendPoint } from './revenue-trend';

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
export default function DashboardClient() {
  const session = useSession();
  const router = useRouter();
  const [checklist, setChecklist] = useState<Checklist | null | 'no-business'>(null);
  const [error, setError] = useState<string | null>(null);

  const [z, setZ] = useState<ZReport | null>(null);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [arTotal, setArTotal] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<LowStockRow[] | null>(null);
  const [openOrders, setOpenOrders] = useState<number | null>(null);
  const [salesDenied, setSalesDenied] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null);
  const [morning, setMorning] = useState<MorningBrief | null>(null);

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
    // Sales-gated cards.
    void api<ZReport>('/v1/reports/z')
      .then(setZ)
      .catch(() => setSalesDenied(true));
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10);
    void api<DailyReport>(`/v1/reports/sales/daily?start=${start}&end=${end}`)
      .then((d) => {
        // Fill missing days with zero so the line spans all 30 days.
        const byDay = new Map(d.byDay.map((r) => [r.day, r]));
        const points: TrendPoint[] = [];
        for (let i = 29; i >= 0; i--) {
          const day = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
          const row = byDay.get(day);
          points.push({ day, totalCents: row?.totalCents ?? 0, saleCount: row?.saleCount ?? 0 });
        }
        setTrend(points);
      })
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
    // Open orders for the active business, via the membership overview.
    void api<AgencyOverview>('/v1/agency/overview')
      .then((res) => {
        const activeId = readActiveBusinessId();
        const mine = res.businesses.find((b) => b.businessId === activeId);
        setOpenOrders(mine?.openOrdersCount ?? null);
      })
      .catch(() => {});
  }, [businessActive]);

  if (session.isPending) {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <Skeleton style={{ height: 28, width: 260 }} />
        <Skeleton style={{ height: 16, width: 200 }} />
        <Skeleton style={{ height: 120 }} />
      </div>
    );
  }

  if (!session.data) {
    return (
      <div>
        <p style={{ color: 'var(--text-secondary)' }}>You are not signed in.</p>
        <Link href="/login">Sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome, {session.data.user.name ?? session.data.user.email}
          </h1>
          <p
            data-testid="dashboard-email"
            style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}
          >
            Signed in as <strong>{session.data.user.email}</strong>
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
          >
            <LogOut size={14} aria-hidden />
            Sign out
          </Button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      {businessActive && !checklist.complete && <ChecklistCard checklist={checklist} />}

      {businessActive && !salesDenied && (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          style={{ marginBottom: 16 }}
          data-testid="kpi-row"
        >
          <Kpi label="Sales today" value={z ? String(z.saleCount) : '…'} />
          <Kpi label="Gross today" value={z ? <Money cents={z.grossCents} /> : '…'} />
          <Kpi
            label="Refunds today"
            value={z ? <Money cents={z.refundsCents} /> : '…'}
            tone={z && z.refundsCents > 0 ? 'danger' : undefined}
          />
          <Kpi label="Net today" value={z ? <Money cents={z.netCents} /> : '…'} strong />
          <Kpi
            label="Open orders"
            value={openOrders != null ? String(openOrders) : '—'}
            href="/orders"
          />
          <Kpi
            label="Receivables"
            value={arTotal != null ? <Money cents={arTotal} /> : '—'}
            href="/reports"
          />
        </div>
      )}

      {businessActive && morning != null && <MorningBriefCard brief={morning} />}

      {businessActive && !salesDenied && (
        <Card title="Revenue — last 30 days">
          {trend ? <RevenueTrend points={trend} /> : <LoadingRows />}
        </Card>
      )}

      {businessActive && notifications != null && (
        <Card
          title="Notifications — order changes"
          actions={
            <Link href="/orders" style={{ fontSize: 12.5 }}>
              Orders →
            </Link>
          }
        >
          {notifications.length === 0 ? (
            <EmptyState>No order changes recorded yet.</EmptyState>
          ) : (
            <ul
              data-testid="notifications-feed"
              style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13 }}
            >
              {notifications.map((n) => (
                <li
                  key={n.id}
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                  <span style={{ fontWeight: 600 }}>{n.label}</span>
                  {n.orderId && (
                    <Link href={`/orders/${n.orderId}`}>{n.orderNumber ?? 'order'}</Link>
                  )}
                  <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                    {n.actorName ?? n.actorEmail ?? 'system'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {businessActive && lowStock != null && (
        <Card
          title="Low stock"
          actions={
            <Link href="/inventory" style={{ fontSize: 12.5 }}>
              Inventory →
            </Link>
          }
        >
          {lowStock.length === 0 ? (
            <EmptyState>Nothing at or below 5 available. Shelves look healthy.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
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
                        {r.variantName && (
                          <span style={{ color: 'var(--text-secondary)' }}> — {r.variantName}</span>
                        )}
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
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/**
 * The P9 morning brief (PLAN-POS-OPERATIONS §12): yesterday by store
 * and associate, today's truck load, refunds/cancellations with names,
 * the modification log, and the open exception count.
 */
function MorningBriefCard({ brief }: { brief: MorningBrief }) {
  const usd = (c: number) =>
    `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const over = brief.deliveriesToday.booked > brief.deliveriesToday.cap;
  return (
    <Card
      title={`Morning brief — ${brief.date}`}
      actions={
        <Link href="/exceptions" style={{ fontSize: 12.5 }}>
          {brief.openExceptions.count > 0
            ? `${brief.openExceptions.count} open exception${brief.openExceptions.count === 1 ? '' : 's'} →`
            : 'Exception register →'}
        </Link>
      }
      data-testid="morning-brief"
    >
      <div className="grid gap-4 lg:grid-cols-2" style={{ fontSize: 13 }}>
        <div className="min-w-0">
          <h4 style={{ margin: '0 0 6px', fontSize: 12.5 }}>Yesterday by store</h4>
          {brief.salesByStore.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No business written.
            </p>
          ) : (
            <table className="table">
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
          )}
          <h4 style={{ margin: '12px 0 6px', fontSize: 12.5 }}>By associate</h4>
          {brief.salesByAssociate.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nothing attributed.
            </p>
          ) : (
            <table className="table">
              <tbody>
                {brief.salesByAssociate.map((a) => (
                  <tr key={a.userId ?? 'none'}>
                    <td>{a.name ?? a.email ?? '—'}</td>
                    <td className="num">{usd(a.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="min-w-0">
          <p style={{ margin: '0 0 8px' }}>
            <strong>Today's deliveries:</strong>{' '}
            <span style={{ color: over ? 'var(--danger)' : undefined }}>
              {brief.deliveriesToday.booked} of {brief.deliveriesToday.cap} booked
            </span>
            {Object.entries(brief.deliveriesToday.byStatus).map(([k, v]) => (
              <span key={k} className="muted">
                {' '}
                · {v} {k.replace(/_/g, ' ')}
              </span>
            ))}{' '}
            <Link href="/deliveries/dispatch">Dispatch →</Link>
          </p>
          <h4 style={{ margin: '0 0 6px', fontSize: 12.5 }}>Refunds & cancellations</h4>
          {brief.refundsCancellations.length === 0 ? (
            <p className="muted" style={{ margin: '0 0 10px' }}>
              None yesterday.
            </p>
          ) : (
            <ul style={{ margin: '0 0 10px', padding: 0, listStyle: 'none' }}>
              {brief.refundsCancellations.slice(0, 8).map((r) => (
                <li
                  key={r.id}
                  style={{ padding: '3px 0', borderBottom: '1px solid var(--border)' }}
                >
                  <strong>{r.action.replace(/[._]/g, ' ')}</strong>
                  {r.orderNumber ? ` — ${r.orderNumber}` : ''}
                  <span className="muted"> · {r.actorEmail ?? 'system'}</span>
                </li>
              ))}
            </ul>
          )}
          <h4 style={{ margin: '0 0 6px', fontSize: 12.5 }}>Modified orders</h4>
          {brief.modifiedOrders.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No post-creation edits yesterday.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {brief.modifiedOrders.slice(0, 8).map((m) => (
                <li
                  key={m.orderId}
                  style={{ padding: '3px 0', borderBottom: '1px solid var(--border)' }}
                >
                  <Link href={`/orders/${m.orderId}`}>{m.orderNumber ?? 'order'}</Link>{' '}
                  <span className="muted">
                    {m.changeCount} change{m.changeCount === 1 ? '' : 's'} ·{' '}
                    {m.actorEmails.join(', ') || 'system'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function Kpi({
  label,
  value,
  strong,
  tone,
  href,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  tone?: 'danger';
  href?: string;
}) {
  const inner = (
    <div
      className={href ? 'card-hover' : undefined}
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
          fontWeight: strong ? 700 : 600,
          color: tone === 'danger' ? 'var(--danger)' : 'var(--text)',
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: 'none' }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

function ChecklistCard({ checklist }: { checklist: Checklist }) {
  const doneCount = checklist.steps.filter((s) => s.done).length;
  const total = checklist.steps.length;
  return (
    <Card
      title="Get started"
      actions={
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {doneCount} of {total} complete
        </span>
      }
      style={{ marginBottom: 16 }}
    >
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {checklist.steps.map((s) => (
          <li
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: s.done ? 'var(--success-soft)' : 'var(--surface)',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: s.done ? '2px solid var(--success)' : '2px solid var(--border-strong)',
                background: s.done ? 'var(--success)' : 'var(--surface)',
                color: '#fff',
                fontSize: 12,
                lineHeight: '14px',
                textAlign: 'center',
              }}
            >
              {s.done ? '✓' : ''}
            </span>
            <span
              style={{
                flex: 1,
                color: s.done ? 'var(--text-muted)' : 'var(--text)',
                textDecoration: s.done ? 'line-through' : 'none',
              }}
            >
              {s.label}
            </span>
            {!s.done && (
              <Link href={s.href} style={{ textDecoration: 'none', fontSize: 13 }}>
                Go →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
