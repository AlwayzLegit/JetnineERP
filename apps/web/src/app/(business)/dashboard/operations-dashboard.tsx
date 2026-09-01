'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, LinkButton, LoadingRows } from '@/components/ui';
import { Money } from '@/components/money';
import { api } from '@/lib/api';

/**
 * The Operations home (owner 2026-08-31).
 *
 * Exception-first, not selling-first: the page opens on what needs a
 * person today, and the numbers sit underneath. Every store, always —
 * there is no store picker, because the whole point of the role is
 * watching all of them at once. No goal or commission tiles: this
 * member sells occasionally and carries neither.
 *
 * Each card fetches on its own and hides itself on a 403, so a member
 * with a narrower grant sees a smaller page rather than an error.
 */

type Severity = 'critical' | 'warning' | 'info';

interface FeedRow {
  subjectType: string;
  subjectId: string;
  severity: Severity;
  kind: string;
  summary: string;
  amountCents: number | null;
  actorUserId: string | null;
  actorName: string | null;
  locationId: string | null;
  locationName: string | null;
  href: string | null;
  occurredAt: string;
  clearVia: 'exception' | 'review';
}

interface Thresholds {
  refundCents: number;
  discountPct: number;
  overrideCents: number;
  drawerVarianceCents: number;
  inventoryAdjustUnits: number;
  takeWithOpenHours: number;
  lookbackDays: number;
}

interface Summary {
  date: string;
  stores: { id: string; name: string; timezone: string }[];
  money: {
    inCents: number;
    outCents: number;
    netCents: number;
    byTender: { method: string; cents: number; count: number }[];
    out: { refundsCents: number; returnsCents: number; writeOffsCents: number };
    exchanges: { count: number; restockingFeeCents: number };
  };
  salesByDay: { day: string; writtenCents: number }[];
  byStore: {
    locationId: string;
    locationName: string;
    writtenCents: number;
    writtenCount: number;
    collectedCents: number;
    refundedCents: number;
  }[];
  ritual: {
    locationId: string;
    locationName: string;
    date: string;
    drawerOpen: boolean;
    drawerClosed: boolean;
    drawerSuspended: boolean;
    varianceCents: number | null;
    closeoutRan: boolean;
    closeoutExceptions: number;
  }[];
}

interface SalespersonRow {
  key: string;
  name: string;
  writtenCents: number;
  writtenCount: number;
  collectedCents: number;
  refundedCents: number;
  discountCents: number;
  discountPct: number;
}

interface DigestRow {
  actorUserId: string | null;
  actorName: string | null;
  total: number;
  amountCents: number;
  byKind: Record<string, number>;
  worstSeverity: Severity;
}

interface ActivityGroup {
  orderId: string;
  orderNumber: string;
  latestAt: string;
  events: { action: string; actorName: string | null; createdAt: string }[];
}

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: 'var(--danger)',
  warning: 'var(--warning, #b26a00)',
  info: 'var(--text-muted)',
};

function subjectKey(r: { subjectType: string; subjectId: string }): string {
  return `${r.subjectType}:${r.subjectId}`;
}

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function OperationsDashboardView({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedRow[] | null>(null);
  const [feedTotal, setFeedTotal] = useState(0);
  // Thresholds ride on the /feed response — the summary stays cheap.
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [salespeople, setSalespeople] = useState<SalespersonRow[] | null>(null);
  const [digest, setDigest] = useState<DigestRow[] | null>(null);
  const [activity, setActivity] = useState<ActivityGroup[] | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      const r = await api<{ rows: FeedRow[]; total: number; thresholds: Thresholds }>(
        '/v1/dashboard/operations/feed?limit=100',
      );
      setFeed(r.rows);
      setFeedTotal(r.total);
      setThresholds(r.thresholds);
    } catch {
      setFeed([]);
      setFeedTotal(0);
    }
  }, []);

  useEffect(() => {
    void api<Summary>('/v1/dashboard/operations')
      .then(setSummary)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
    void loadFeed();
    void api<SalespersonRow[]>('/v1/dashboard/operations/salespeople?days=30')
      .then(setSalespeople)
      .catch(() => setSalespeople(null));
    void api<DigestRow[]>('/v1/dashboard/operations/digest')
      .then(setDigest)
      .catch(() => setDigest(null));
    void api<ActivityGroup[]>('/v1/dashboard/operations/activity?limit=60')
      .then(setActivity)
      .catch(() => setActivity(null));
  }, [loadFeed]);

  async function clearSelected() {
    if (!feed || selected.size === 0) return;
    setClearing(true);
    setClearError(null);
    const subjects = feed
      .filter((r) => selected.has(subjectKey(r)))
      .map((r) => ({ subjectType: r.subjectType, subjectId: r.subjectId }));
    try {
      await api('/v1/ops-reviews/bulk', {
        method: 'POST',
        body: JSON.stringify({ subjects }),
      });
      setSelected(new Set());
      await loadFeed();
    } catch (err) {
      setClearError(err instanceof Error ? err.message : String(err));
    } finally {
      setClearing(false);
    }
  }

  if (error) {
    return (
      <Card title="Operations">
        <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>{error}</p>
      </Card>
    );
  }
  if (!summary) return <LoadingRows />;

  const { money } = summary;

  return (
    <div data-testid="operations-dashboard">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Operations — {userName}</h1>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            {summary.date} · {summary.stores.length} store
            {summary.stores.length === 1 ? '' : 's'}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <LinkButton size="sm" variant="primary" href="/orders/new">
            New Sale
          </LinkButton>
        </div>
      </div>

      {/* ---- The feed. Everything else on this page is context for it. ---- */}
      <Card
        title={
          feedTotal === 0
            ? 'Nothing needs you today'
            : `${feedTotal} thing${feedTotal === 1 ? '' : 's'} need${feedTotal === 1 ? 's' : ''} you today`
        }
        style={{ padding: 0, marginBottom: 16 }}
      >
        {feed == null ? (
          <div style={{ padding: 12 }}>
            <LoadingRows rows={4} />
          </div>
        ) : feed.length === 0 ? (
          <div style={{ padding: 14 }}>
            <EmptyState>
              Every refund, override, adjustment and drawer count in the last{' '}
              {thresholds?.lookbackDays ?? 7} days has been reviewed.
            </EmptyState>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <label style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  data-testid="ops-feed-select-all"
                  checked={selected.size === feed.length && feed.length > 0}
                  onChange={(e) =>
                    setSelected(e.target.checked ? new Set(feed.map(subjectKey)) : new Set())
                  }
                />
                Select all
              </label>
              <Button
                size="sm"
                data-testid="ops-feed-clear"
                disabled={selected.size === 0 || clearing}
                onClick={() => void clearSelected()}
              >
                {clearing ? 'Clearing…' : `Clear selected (${selected.size})`}
              </Button>
              {clearError && (
                <span style={{ fontSize: 12, color: 'var(--danger)' }}>{clearError}</span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-muted)' }}>
                Clearing records your name and the time — it does not approve anything.
              </span>
            </div>
            <div style={{ maxHeight: 460, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                <tbody>
                  {feed.map((r) => {
                    const key = subjectKey(r);
                    return (
                      <tr
                        key={key}
                        data-testid="ops-feed-row"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <td style={{ padding: '7px 10px', width: 28 }}>
                          <input
                            type="checkbox"
                            aria-label={`Clear ${r.kind}`}
                            checked={selected.has(key)}
                            onChange={(e) =>
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(key);
                                else next.delete(key);
                                return next;
                              })
                            }
                          />
                        </td>
                        <td style={{ padding: '7px 4px', width: 10 }}>
                          <span
                            title={r.severity}
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: SEVERITY_COLOR[r.severity],
                            }}
                          />
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ fontWeight: 600 }}>{r.kind}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{r.summary}</div>
                        </td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>
                          {r.actorName ?? '—'}
                        </td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>
                          {r.locationName ?? '—'}
                        </td>
                        <td
                          style={{
                            padding: '7px 10px',
                            textAlign: 'right',
                            color: (r.amountCents ?? 0) < 0 ? 'var(--danger)' : 'var(--text)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.amountCents == null ? '' : usd(r.amountCents)}
                        </td>
                        <td
                          style={{
                            padding: '7px 10px',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ago(r.occurredAt)}
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          {r.href && (
                            <Link href={r.href} style={{ fontSize: 12 }}>
                              Open
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {feedTotal > feed.length && (
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                Showing {feed.length} of {feedTotal}. Clear some to see the rest.
              </div>
            )}
          </>
        )}
      </Card>

      {/* ---- Money today, all stores ---- */}
      <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Money today — every store</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" style={{ marginBottom: 16 }}>
        <Tile
          label="Money in"
          testid="ops-kpi-in"
          main={<Money cents={money.inCents} />}
          sub={`${money.byTender.length} tender${money.byTender.length === 1 ? '' : 's'}`}
        />
        <Tile
          label="Money out"
          testid="ops-kpi-out"
          tone={money.outCents > 0 ? 'danger' : undefined}
          main={<Money cents={money.outCents} />}
          sub={`${usd(money.out.refundsCents)} refunds · ${usd(money.out.returnsCents)} returns · ${usd(money.out.writeOffsCents)} write-offs`}
        />
        <Tile
          label="Net"
          testid="ops-kpi-net"
          main={<Money cents={money.netCents} />}
          sub="in − out"
        />
        <Tile
          label="Exchanges entered"
          testid="ops-kpi-exchanges"
          main={String(money.exchanges.count)}
          sub={`${usd(money.exchanges.restockingFeeCents)} in restocking fees`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <Card title="Money in by tender">
          {money.byTender.length === 0 ? (
            <EmptyState>Nothing collected yet today.</EmptyState>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5 }}>
              <tbody>
                {money.byTender.map((t) => (
                  <tr key={t.method}>
                    <td style={{ padding: '3px 0', textTransform: 'capitalize' }}>
                      {t.method.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '3px 0', color: 'var(--text-muted)' }}>×{t.count}</td>
                    <td style={{ padding: '3px 0', textAlign: 'right' }}>{usd(t.cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Written business — 14 days, all stores">
          <SalesByDayChart points={summary.salesByDay} />
        </Card>
      </div>

      {/* ---- Every store, every salesperson ---- */}
      <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Selling</h3>
      <div className="grid gap-3" style={{ marginBottom: 16 }}>
        <Card title="By store — today" style={{ padding: 0 }}>
          <ScrollTable
            head={['Store', 'Written', 'Orders', 'Collected', 'Refunded']}
            align={['left', 'right', 'right', 'right', 'right']}
            rows={summary.byStore.map((s) => [
              s.locationName,
              usd(s.writtenCents),
              String(s.writtenCount),
              usd(s.collectedCents),
              s.refundedCents > 0 ? usd(s.refundedCents) : '—',
            ])}
            empty="No stores yet."
            testid="ops-by-store"
          />
        </Card>

        <Card title="By salesperson — last 30 days" style={{ padding: 0 }}>
          {salespeople == null ? (
            <div style={{ padding: 12 }}>
              <LoadingRows rows={3} />
            </div>
          ) : (
            <ScrollTable
              head={['Salesperson', 'Written', 'Sales', 'Collected', 'Refunded', 'Discount']}
              align={['left', 'right', 'right', 'right', 'right', 'right']}
              rows={salespeople.map((s) => [
                s.name,
                usd(s.writtenCents),
                String(s.writtenCount),
                usd(s.collectedCents),
                s.refundedCents > 0 ? usd(s.refundedCents) : '—',
                `${s.discountPct}%`,
              ])}
              empty="Nobody has written business in the window."
              testid="ops-by-salesperson"
            />
          )}
        </Card>
      </div>

      {/* ---- Who is generating the exceptions ---- */}
      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <Card title="Flagged activity by person" style={{ padding: 0 }}>
          {digest == null ? (
            <div style={{ padding: 12 }}>
              <LoadingRows rows={3} />
            </div>
          ) : digest.length === 0 ? (
            <div style={{ padding: 14 }}>
              <EmptyState>Nobody has tripped a threshold in the window.</EmptyState>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {digest.map((d) => (
                  <tr
                    key={d.actorUserId ?? 'system'}
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <td style={{ padding: '7px 12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: SEVERITY_COLOR[d.worstSeverity],
                          marginRight: 7,
                        }}
                      />
                      <strong>{d.actorName ?? 'System'}</strong>
                      <div style={{ color: 'var(--text-secondary)', marginLeft: 15 }}>
                        {Object.entries(d.byKind)
                          .map(([kind, n]) => `${n} × ${kind.toLowerCase()}`)
                          .join(' · ')}
                      </div>
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {d.amountCents > 0 ? usd(d.amountCents) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Open & close — today" style={{ padding: 0 }}>
          <ScrollTable
            head={['Store', 'Drawer', 'Variance', 'Close-out']}
            align={['left', 'left', 'right', 'left']}
            rows={summary.ritual.map((r) => [
              r.locationName,
              r.drawerSuspended
                ? 'suspended'
                : r.drawerOpen
                  ? 'open'
                  : r.drawerClosed
                    ? 'closed'
                    : 'never opened',
              r.varianceCents == null ? '—' : usd(r.varianceCents),
              r.closeoutRan ? `ran · ${r.closeoutExceptions} flagged` : 'not run',
            ])}
            empty="No stores yet."
            testid="ops-ritual"
          />
        </Card>
      </div>

      {/* ---- Store activity ---- */}
      <Card title="Store activity — grouped by order" style={{ padding: 0 }}>
        {activity == null ? (
          <div style={{ padding: 12 }}>
            <LoadingRows rows={3} />
          </div>
        ) : activity.length === 0 ? (
          <div style={{ padding: 14 }}>
            <EmptyState>No order changes recorded yet.</EmptyState>
          </div>
        ) : (
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {activity.map((g) => (
                  <tr key={g.orderId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <Link href={`/orders/${g.orderId}`}>{g.orderNumber}</Link>
                    </td>
                    <td style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>
                      {g.events
                        .slice(0, 4)
                        .map((e) => `${e.action}${e.actorName ? ` (${e.actorName})` : ''}`)
                        .join(' · ')}
                      {g.events.length > 4 ? ` +${g.events.length - 4} more` : ''}
                    </td>
                    <td
                      style={{
                        padding: '7px 12px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ago(g.latestAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Tile({
  label,
  main,
  sub,
  tone,
  testid,
}: {
  label: string;
  main: React.ReactNode;
  sub: string;
  tone?: 'danger';
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
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
  );
}

function ScrollTable({
  head,
  align,
  rows,
  empty,
  testid,
}: {
  head: string[];
  align: ('left' | 'right')[];
  rows: string[][];
  empty: string;
  testid: string;
}) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: 14 }}>
        <EmptyState>{empty}</EmptyState>
      </div>
    );
  }
  return (
    <div style={{ maxHeight: 320, overflowY: 'auto' }} data-testid={testid}>
      <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                style={{
                  padding: '7px 12px',
                  textAlign: align[i] ?? 'left',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} style={{ borderTop: '1px solid var(--border)' }}>
              {r.map((cell, i) => (
                <td
                  key={head[i] ?? String(i)}
                  style={{ padding: '7px 12px', textAlign: align[i] ?? 'left' }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesByDayChart({ points }: { points: { day: string; writtenCents: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.writtenCents));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 110 }}>
      {points.map((p) => (
        <div
          key={p.day}
          title={`${p.day}: ${usd(p.writtenCents)}`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
        >
          <div
            style={{
              height: `${Math.round((p.writtenCents / max) * 100)}%`,
              minHeight: p.writtenCents > 0 ? 2 : 0,
              background: 'var(--accent)',
              borderRadius: '3px 3px 0 0',
            }}
          />
        </div>
      ))}
    </div>
  );
}
