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
}

interface ManagerDashboard {
  date: string;
  location: { id: string; name: string; timezone: string };
  locations: { id: string; name: string }[];
  kpis: {
    mine: {
      writtenCents: number;
      writtenCount: number;
      collectedCents: number;
      openCount: number;
      openBalanceCents: number;
      closed7dCount: number;
      closed7dCents: number;
    };
    store: { writtenCents: number; writtenCount: number; collectedCents: number };
    exceptionsOpen: number;
    pastDuePromises: number;
  };
  salesByDay: { day: string; mineCents: number; storeCents: number }[];
  leaderboardWeek: { name: string; cents: number }[];
  pipeline: { key: string; count: number; cents: number }[];
  queues: {
    myOpen: QueueRow[];
    storeOpen: QueueRow[];
    recentlyClosed: QueueRow[];
    todaysDeliveries: (QueueRow & {
      deliveryId: string;
      deliveryState: string;
      windowStart: string | null;
      windowEnd: string | null;
    })[];
  };
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

/**
 * The store-manager home (owner decision 2026-08-30): everything on the
 * page is scoped to ONE store picked from the member's approved list,
 * with "today" in that store's local time. Written business leads;
 * collected money rides alongside.
 */
export default function ManagerDashboardView({ userName }: { userName: string }) {
  const [data, setData] = useState<ManagerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [queueTab, setQueueTab] = useState<'mine' | 'store'>('mine');

  useEffect(() => {
    // First load: prefer the store they logged in at.
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
      // A store from sessionStorage the member isn't approved for →
      // retry with the server's default before giving up.
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
  const attention = kpis.exceptionsOpen + kpis.pastDuePromises;
  const queueRows = queueTab === 'mine' ? queues.myOpen : queues.storeOpen;

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
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        style={{ marginBottom: 16 }}
        data-testid="manager-kpi-row"
      >
        <Tile
          label="My sales today"
          testid="kpi-my-sales"
          href="/orders?mine=1"
          main={<Money cents={kpis.mine.writtenCents} />}
          sub={`${kpis.mine.writtenCount} written · ${usd(kpis.mine.collectedCents)} collected`}
        />
        <Tile
          label={`${data.location.name} today`}
          testid="kpi-store-sales"
          href="/orders"
          main={<Money cents={kpis.store.writtenCents} />}
          sub={`${kpis.store.writtenCount} written · ${usd(kpis.store.collectedCents)} collected`}
        />
        <Tile
          label="My open sales"
          testid="kpi-my-open"
          href="/orders?mine=1"
          main={String(kpis.mine.openCount)}
          sub={`${usd(kpis.mine.openBalanceCents)} still owed`}
        />
        <Tile
          label="Closed — 7 days"
          testid="kpi-closed"
          href="/orders?mine=1"
          main={<Money cents={kpis.mine.closed7dCents} />}
          sub={`${kpis.mine.closed7dCount} of mine delivered`}
        />
        <Tile
          label="Needs attention"
          testid="kpi-attention"
          href="/exceptions"
          tone={attention > 0 ? 'danger' : undefined}
          main={String(attention)}
          sub={`${kpis.exceptionsOpen} exceptions · ${kpis.pastDuePromises} past promise`}
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
        <QueueTable rows={queueRows} empty="No open sales — write one!" testid="open-queue" />
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Today's deliveries" style={{ padding: 0 }}>
          {queues.todaysDeliveries.length === 0 ? (
            <EmptyState>No deliveries scheduled from this store today.</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" data-testid="today-deliveries">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Window</th>
                    <th>Status</th>
                    <th className="num">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.todaysDeliveries.map((r) => (
                    <tr key={r.deliveryId}>
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
                      <td style={{ fontSize: 13 }}>{r.deliveryState.replace(/_/g, ' ')}</td>
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
        <Card title="Recently closed — 7 days" style={{ padding: 0 }}>
          <QueueTable
            rows={queues.recentlyClosed}
            empty="Nothing delivered in the last week."
            testid="closed-queue"
          />
        </Card>
      </div>
    </div>
  );
}

function Tile({
  label,
  main,
  sub,
  href,
  tone,
  testid,
}: {
  label: string;
  main: React.ReactNode;
  sub: string;
  href: string;
  tone?: 'danger';
  testid: string;
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

function QueueTable({ rows, empty, testid }: { rows: QueueRow[]; empty: string; testid: string }) {
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
