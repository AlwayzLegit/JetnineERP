'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LinkButton,
  LoadingRows,
  PageHeader,
  SectionHeading,
  Stack,
  StatGrid,
  StatTile,
  TableEmpty,
  TableWrap,
  Toolbar,
} from '@/components/ui';
import { DateRangePicker, useUrlDateRange } from '@/components/date-range-picker';
import { Money } from '@/components/money';
import { api } from '@/lib/api';
import { formatRange, presetLabel, type DateRange } from '@/lib/date-range';
import { TableCard, usd } from './dashboard-kit';

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

interface StoreDocument {
  id: string;
  kind: 'order' | 'sale';
  number: string;
  customerName: string | null;
  writtenCents: number;
  merchandiseCents: number;
  costCents: number;
  profitCents: number;
}
interface StoreRow {
  locationId: string;
  locationName: string;
  writtenCents: number;
  writtenCount: number;
  collectedCents: number;
  refundedCents: number;
  costCents: number;
  profitCents: number;
  documents: StoreDocument[];
}

interface Summary {
  date: string;
  /** The window the money block and byStore were scoped to (echoed by the API). */
  range: { start: string; end: string };
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
  byStore: StoreRow[];
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

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: 'var(--danger)',
  warning: 'var(--warning, #b26a00)',
  info: 'var(--text-muted)',
};

function subjectKey(r: { subjectType: string; subjectId: string }): string {
  return `${r.subjectType}:${r.subjectId}`;
}

/** "today" / "last 7 days" / "Aug 4 – Sep 2, 2026" — for use inside a heading. */
function windowLabel(range: DateRange): string {
  if (range.preset === 'today') return 'today';
  const label = presetLabel(range.preset);
  return label === 'Custom' ? formatRange(range) : label.toLowerCase();
}

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** The severity dot: colour is the data. */
function SeverityDot({ severity }: { severity: Severity }) {
  return (
    <span
      title={severity}
      className="inline-block size-2 rounded-full align-middle"
      style={{ background: SEVERITY_COLOR[severity] }}
    />
  );
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
  // Page window (owner 2026-09-02): scopes the money block and "By store";
  // the salesperson card carries its own window. Both live in the URL.
  const [range, setRange, rangeReady] = useUrlDateRange('today');
  const [spRange, setSpRange, spReady] = useUrlDateRange('last30', { key: 'salespeople' });
  const summarySeq = useRef(0);
  const spSeq = useRef(0);

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

  // Summary follows the page window; a sequence counter drops a stale
  // response that resolves after a newer window's.
  useEffect(() => {
    if (!rangeReady) return;
    const seq = ++summarySeq.current;
    void api<Summary>(`/v1/dashboard/operations?start=${range.start}&end=${range.end}`)
      .then((s) => {
        if (summarySeq.current !== seq) return;
        setSummary(s);
      })
      .catch((err: unknown) => {
        if (summarySeq.current !== seq) return;
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [rangeReady, range.start, range.end]);

  useEffect(() => {
    if (!spReady) return;
    const seq = ++spSeq.current;
    setSalespeople(null);
    void api<SalespersonRow[]>(
      `/v1/dashboard/operations/salespeople?start=${spRange.start}&end=${spRange.end}`,
    )
      .then((rows) => {
        if (spSeq.current !== seq) return;
        setSalespeople(rows);
      })
      .catch(() => {
        if (spSeq.current !== seq) return;
        setSalespeople(null);
      });
  }, [spReady, spRange.start, spRange.end]);

  useEffect(() => {
    void loadFeed();
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

  const title = `Operations — ${userName}`;

  if (error) {
    return (
      <>
        <PageHeader title={title} />
        <Alert tone="error">{error}</Alert>
      </>
    );
  }
  if (!summary) {
    return (
      <>
        <PageHeader title={title} />
        <LoadingRows />
      </>
    );
  }

  const { money } = summary;

  return (
    <div data-testid="operations-dashboard">
      <PageHeader
        title={title}
        sub={
          <>
            {summary.date} · {summary.stores.length} store
            {summary.stores.length === 1 ? '' : 's'}
          </>
        }
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} align="right" testid="ops-range" />
            <LinkButton variant="primary" href="/orders/new">
              New Sale
            </LinkButton>
          </>
        }
      />

      <Stack>
        {/* ---- The feed. Everything else on this page is context for it. ---- */}
        <Card
          title={
            feedTotal === 0
              ? 'Nothing needs you today'
              : `${feedTotal} thing${feedTotal === 1 ? '' : 's'} need${feedTotal === 1 ? 's' : ''} you today`
          }
        >
          {feed == null ? (
            <LoadingRows rows={4} />
          ) : feed.length === 0 ? (
            <EmptyState>
              Every refund, override, adjustment and drawer count in the last{' '}
              {thresholds?.lookbackDays ?? 7} days has been reviewed.
            </EmptyState>
          ) : (
            <>
              <Toolbar
                end={
                  <>
                    {feedTotal > feed.length && (
                      <span className="muted">
                        Showing {feed.length} of {feedTotal}. Clear some to see the rest.
                      </span>
                    )}
                    <span className="muted">
                      Clearing records your name and the time — it does not approve anything.
                    </span>
                  </>
                }
              >
                <label className="flex items-center gap-1.5">
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
                  variant="secondary"
                  data-testid="ops-feed-clear"
                  disabled={selected.size === 0 || clearing}
                  onClick={() => void clearSelected()}
                >
                  {clearing ? 'Clearing…' : `Clear selected (${selected.size})`}
                </Button>
              </Toolbar>
              {clearError && <Alert tone="error">{clearError}</Alert>}
              <TableWrap maxHeight={460}>
                <table className="table table-dense table-sticky">
                  <thead>
                    <tr>
                      <th aria-label="Select" />
                      <th aria-label="Severity" />
                      <th>What</th>
                      <th>Who</th>
                      <th>Store</th>
                      <th className="num">Amount</th>
                      <th>When</th>
                      <th className="actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {feed.map((r) => {
                      const key = subjectKey(r);
                      return (
                        <tr key={key} data-testid="ops-feed-row">
                          <td>
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
                          <td>
                            <SeverityDot severity={r.severity} />
                          </td>
                          <td>
                            <strong>{r.kind}</strong>
                            <div className="muted">{r.summary}</div>
                          </td>
                          <td className="muted">{r.actorName ?? '—'}</td>
                          <td className="muted">{r.locationName ?? '—'}</td>
                          <td
                            className="num nowrap"
                            style={{
                              color: (r.amountCents ?? 0) < 0 ? 'var(--danger)' : undefined,
                            }}
                          >
                            {r.amountCents == null ? '' : usd(r.amountCents)}
                          </td>
                          <td className="muted nowrap">{ago(r.occurredAt)}</td>
                          <td className="actions">
                            {r.href && (
                              <Link href={r.href} className="btn-link">
                                Open
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrap>
            </>
          )}
        </Card>

        {/* ---- Money in the window, all stores ---- */}
        <SectionHeading title={`Money — ${windowLabel(range)}, every store`} />
        <StatGrid cols={4}>
          <StatTile
            label="Money in"
            data-testid="ops-kpi-in"
            value={<Money cents={money.inCents} />}
            sub={`${money.byTender.length} tender${money.byTender.length === 1 ? '' : 's'}`}
          />
          <StatTile
            label="Money out"
            data-testid="ops-kpi-out"
            tone={money.outCents > 0 ? 'danger' : undefined}
            value={<Money cents={money.outCents} />}
            sub={`${usd(money.out.refundsCents)} refunds · ${usd(money.out.returnsCents)} returns · ${usd(money.out.writeOffsCents)} write-offs`}
          />
          <StatTile
            label="Net"
            data-testid="ops-kpi-net"
            value={<Money cents={money.netCents} />}
            sub="in − out"
          />
          <StatTile
            label="Exchanges entered"
            data-testid="ops-kpi-exchanges"
            value={String(money.exchanges.count)}
            sub={`${usd(money.exchanges.restockingFeeCents)} in restocking fees`}
          />
        </StatGrid>

        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard
            title="Money in by tender"
            isEmpty={money.byTender.length === 0}
            empty={
              range.preset === 'today'
                ? 'Nothing collected yet today.'
                : 'Nothing collected in the window.'
            }
          >
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>Tender</th>
                  <th className="num">Count</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {money.byTender.map((t) => (
                  <tr key={t.method}>
                    <td className="capitalize">{t.method.replace(/_/g, ' ')}</td>
                    <td className="num muted">×{t.count}</td>
                    <td className="num">{usd(t.cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
          <Card title="Written business — 14 days, all stores">
            <SalesByDayChart points={summary.salesByDay} />
          </Card>
        </div>

        {/* ---- Every store, every salesperson ---- */}
        <SectionHeading title={`Selling — ${windowLabel(range)}`} />
        <TableCard
          title={`By store — ${windowLabel(range)}`}
          description="Click a store to see its orders. Cost is the standard cost of the lines; profit is merchandise minus cost — tax, delivery and fees are not counted."
          isEmpty={summary.byStore.length === 0}
          empty="No stores yet."
          maxHeight={420}
        >
          <StoreTable rows={summary.byStore} />
        </TableCard>

        <TableCard
          title={`By salesperson — ${windowLabel(spRange)}`}
          actions={
            <DateRangePicker
              compact
              align="right"
              value={spRange}
              onChange={setSpRange}
              testid="ops-salespeople-range"
            />
          }
          loading={salespeople == null}
          isEmpty={false}
          empty={null}
          maxHeight={320}
        >
          <ScrollTable
            head={['Salesperson', 'Written', 'Sales', 'Collected', 'Refunded', 'Discount']}
            align={['left', 'right', 'right', 'right', 'right', 'right']}
            rows={(salespeople ?? []).map((s) => [
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
        </TableCard>

        {/* ---- Who is generating the exceptions ---- */}
        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard
            title="Flagged activity by person"
            loading={digest == null}
            isEmpty={digest?.length === 0}
            empty="Nobody has tripped a threshold in the window."
          >
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>Who</th>
                  <th>Flags</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(digest ?? []).map((d) => (
                  <tr key={d.actorUserId ?? 'system'}>
                    <td className="nowrap">
                      <SeverityDot severity={d.worstSeverity} />{' '}
                      <strong>{d.actorName ?? 'System'}</strong>
                    </td>
                    <td className="muted">
                      {Object.entries(d.byKind)
                        .map(([kind, n]) => `${n} × ${kind.toLowerCase()}`)
                        .join(' · ')}
                    </td>
                    <td className="num nowrap">{d.amountCents > 0 ? usd(d.amountCents) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard title="Open & close — today" isEmpty={false} empty={null} maxHeight={320}>
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
          </TableCard>
        </div>

        {/* ---- Store activity ---- */}
        <TableCard
          title="Store activity — grouped by order"
          loading={activity == null}
          isEmpty={activity?.length === 0}
          empty="No order changes recorded yet."
          maxHeight={340}
        >
          <table className="table table-dense table-sticky">
            <thead>
              <tr>
                <th>Order</th>
                <th>Changes</th>
                <th className="num">Latest</th>
              </tr>
            </thead>
            <tbody>
              {(activity ?? []).map((g) => (
                <tr key={g.orderId}>
                  <td className="nowrap">
                    <Link href={`/orders/${g.orderId}`}>{g.orderNumber}</Link>
                  </td>
                  <td className="muted">
                    {g.events
                      .slice(0, 4)
                      .map((e) => `${e.action}${e.actorName ? ` (${e.actorName})` : ''}`)
                      .join(' · ')}
                    {g.events.length > 4 ? ` +${g.events.length - 4} more` : ''}
                  </td>
                  <td className="num muted nowrap">{ago(g.latestAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </Stack>
    </div>
  );
}

/**
 * By store — today, with each store expandable to the orders and register
 * sales behind its Written number (owner 2026-09-02): order #, written,
 * cost, profit. Cost is standard cost of the lines; profit is merchandise
 * minus cost (tax, delivery and fees excluded).
 */
function StoreTable({ rows }: { rows: StoreRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <table className="table table-dense table-sticky" data-testid="ops-by-store">
      <thead>
        <tr>
          <th>Store</th>
          <th className="num">Written</th>
          <th className="num">Orders</th>
          <th className="num">Cost</th>
          <th className="num">Profit</th>
          <th className="num">Collected</th>
          <th className="num">Refunded</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => {
          const expandable = s.documents.length > 0;
          const isOpen = !!open[s.locationId];
          return (
            <Fragment key={s.locationId}>
              <tr
                className={expandable ? 'cursor-pointer' : undefined}
                onClick={() =>
                  expandable && setOpen((o) => ({ ...o, [s.locationId]: !o[s.locationId] }))
                }
                data-testid="ops-store-row"
                aria-expanded={expandable ? isOpen : undefined}
              >
                <td className="nowrap">
                  <span
                    aria-hidden
                    className="muted inline-block w-3"
                    style={{ visibility: expandable ? 'visible' : 'hidden' }}
                  >
                    {isOpen ? '▾' : '▸'}
                  </span>
                  {s.locationName}
                </td>
                <td className="num nowrap">{usd(s.writtenCents)}</td>
                <td className="num nowrap">{s.writtenCount}</td>
                <td className="num nowrap">{s.writtenCount > 0 ? usd(s.costCents) : '—'}</td>
                <td
                  className="num nowrap"
                  style={{ color: s.profitCents < 0 ? 'var(--danger)' : undefined }}
                >
                  {s.writtenCount > 0 ? usd(s.profitCents) : '—'}
                </td>
                <td className="num nowrap">{usd(s.collectedCents)}</td>
                <td className="num nowrap">{s.refundedCents > 0 ? usd(s.refundedCents) : '—'}</td>
              </tr>
              {isOpen &&
                s.documents.map((d) => (
                  <tr
                    key={d.id}
                    style={{ background: 'var(--surface-muted)' }}
                    data-testid="ops-store-doc"
                  >
                    <td className="nowrap pl-8">
                      <Link
                        href={d.kind === 'sale' ? `/sales/${d.id}` : `/orders/${d.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {d.number}
                      </Link>{' '}
                      <span className="muted">
                        {d.customerName ?? (d.kind === 'sale' ? 'Register sale' : 'Walk-in')}
                      </span>
                    </td>
                    <td className="num nowrap">{usd(d.writtenCents)}</td>
                    <td />
                    <td className="num nowrap">{usd(d.costCents)}</td>
                    <td
                      className="num nowrap"
                      style={{ color: d.profitCents < 0 ? 'var(--danger)' : undefined }}
                    >
                      {usd(d.profitCents)}
                    </td>
                    <td />
                    <td />
                  </tr>
                ))}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

/** A plain header + string-cell table; empty rows keep the header. */
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
  return (
    <table className="table table-dense table-sticky" data-testid={testid}>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={h} className={align[i] === 'right' ? 'num' : undefined}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <TableEmpty colSpan={head.length}>{empty}</TableEmpty>}
        {rows.map((r) => (
          <tr key={r.join('|')}>
            {r.map((cell, i) => (
              <td key={head[i] ?? String(i)} className={align[i] === 'right' ? 'num' : undefined}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SalesByDayChart({ points }: { points: { day: string; writtenCents: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.writtenCents));
  return (
    <div className="flex items-end gap-1" style={{ height: 110 }}>
      {points.map((p) => (
        <div
          key={p.day}
          title={`${p.day}: ${usd(p.writtenCents)}`}
          className="flex flex-1 flex-col justify-end"
        >
          <div
            className="rounded-t"
            style={{
              height: `${Math.round((p.writtenCents / max) * 100)}%`,
              minHeight: p.writtenCents > 0 ? 2 : 0,
              background: 'var(--accent)',
            }}
          />
        </div>
      ))}
    </div>
  );
}
