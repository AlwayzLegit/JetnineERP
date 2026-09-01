'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Card, EmptyState, LinkButton, LoadingRows, StatusBadge } from '@/components/ui';
import { Money } from '@/components/money';
import { api } from '@/lib/api';

/**
 * The Cashier home — "My Day" (owner 2026-09-01, §12.3). Ten cards for
 * the person at the register: how am I doing today, is my drawer right,
 * who do I call back, whose delivery is today, who still owes, who is
 * here to pick up, what have I earned, what can I offer, what did I
 * start that isn't finished, and how the store looks. New Sale stays
 * one click away at the top — the dashboard serves selling, never
 * replaces it.
 */

interface DayStats {
  writtenCents: number;
  documents: number;
  collectedCents: number;
  avgTicketCents: number;
}

interface Summary {
  date: string;
  location: { id: string; name: string; timezone: string };
  locations: { id: string; name: string; locationType: string }[];
  myDay: { today: DayStats; lastWeek: DayStats };
  drawer: {
    shift: {
      id: string;
      locationId: string;
      locationName: string | null;
      openedAt: string;
      hoursOpen: number;
      openingFloatCents: number;
      cashInCents: number;
      expectedCashCents: number;
      suspended: boolean;
      stale: boolean;
    } | null;
    lastClose: { closedAt: string; varianceCents: number | null } | null;
  };
  callbacks: {
    orderId: string;
    number: string;
    status: string;
    customerName: string | null;
    phone: string | null;
    totalCents: number;
    createdAt: string;
    ageDays: number;
  }[];
  myDeliveries: {
    deliveryId: string;
    orderId: string;
    orderNumber: string;
    customerName: string | null;
    phone: string | null;
    scheduledDate: string;
    windowStart: string | null;
    windowEnd: string | null;
    status: string;
    driverName: string | null;
    when: 'today' | 'tomorrow';
  }[];
  balanceDue: {
    totalCents: number;
    rows: {
      orderId: string;
      number: string;
      status: string;
      customerName: string | null;
      phone: string | null;
      fulfillmentType: string | null;
      requestedDate: string | null;
      totalCents: number;
      paidCents: number;
      balanceCents: number;
      dueNow: boolean;
    }[];
  };
  pickups: {
    orderId: string;
    number: string;
    customerName: string | null;
    phone: string | null;
    ageDays: number;
    ready: boolean;
    mine: boolean;
  }[];
  commission: {
    period: string;
    accruedCents: number;
    pendingCents: number;
    approvedCents: number;
    paidCents: number;
    lastPaid: { period: string; cents: number } | null;
  };
  promos: {
    codes: {
      id: string;
      code: string;
      kind: string;
      value: number;
      description: string | null;
      minSubtotalCents: number | null;
      endsAt: string | null;
      remainingUses: number | null;
    }[];
    priceVariance: { tier1Pct: number; tier1MaxCents: number; tier2Pct: number };
  };
  myReturns: {
    id: string;
    kind: 'return' | 'exchange';
    number: string;
    status: string;
    orderId: string | null;
    orderNumber: string | null;
    customerName: string | null;
    amountCents: number | null;
    createdAt: string;
  }[];
  scoreboard: {
    storeTodayCents: number;
    storeTodayDocuments: number;
    myShareCents: number;
    week: { rank: number | null; sellers: number; myCents: number; leaderCents: number };
  };
}

function tickets(n: number): string {
  return `${n} ticket${n === 1 ? '' : 's'}`;
}

function pctDelta(now: number, then: number): string | null {
  if (then <= 0) return now > 0 ? 'new vs last week' : null;
  const pct = Math.round(((now - then) / then) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}% vs last ${new Date().toLocaleDateString(undefined, { weekday: 'long' })}`;
}

function window(start: string | null, end: string | null): string {
  const fmt = (t: string) => t.slice(0, 5);
  if (start && end) return `${fmt(start)}–${fmt(end)}`;
  if (start) return `from ${fmt(start)}`;
  return 'window TBD';
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export default function MyDayDashboardView({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  const load = useCallback(async (loc: string | null) => {
    setError(null);
    try {
      const qs = loc ? `?locationId=${loc}` : '';
      const s = await api<Summary>(`/v1/dashboard/my-day${qs}`);
      setSummary(s);
      setLocationId(s.location.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load(null);
  }, [load]);

  if (error) {
    return (
      <Card title="My Day">
        <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>{error}</p>
      </Card>
    );
  }
  if (!summary) return <LoadingRows />;

  const { myDay, drawer, scoreboard, commission } = summary;
  const delta = pctDelta(myDay.today.writtenCents, myDay.lastWeek.writtenCents);
  const dueNow = summary.balanceDue.rows.filter((r) => r.dueNow).length;
  const readyPickups = summary.pickups.filter((p) => p.ready).length;
  const todayDeliveries = summary.myDeliveries.filter((d) => d.when === 'today').length;

  return (
    <div data-testid="my-day-dashboard">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">My Day — {userName}</h1>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            {summary.date} · <strong>{summary.location.name}</strong>
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {summary.locations.length > 1 && (
            <select
              data-testid="my-day-location-picker"
              value={locationId ?? ''}
              onChange={(e) => {
                setSummary(null);
                void load(e.target.value);
              }}
              style={{ fontSize: 13 }}
            >
              {summary.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
          <LinkButton size="sm" variant="primary" href="/pos" data-testid="my-day-new-sale">
            New Sale
          </LinkButton>
        </div>
      </div>

      {/* Card 1 + the headline numbers from cards 2, 5, 6, 7 */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        style={{ marginBottom: 16 }}
      >
        <Tile
          label="Written today"
          testid="md-kpi-written"
          main={<Money cents={myDay.today.writtenCents} />}
          sub={`${tickets(myDay.today.documents)} · ${delta ?? 'nothing last week'}`}
        />
        <Tile
          label="Collected today"
          testid="md-kpi-collected"
          main={<Money cents={myDay.today.collectedCents} />}
          sub={
            myDay.today.documents > 0
              ? `avg ticket ${fmtUsd(myDay.today.avgTicketCents)}`
              : 'no tickets yet'
          }
        />
        <Tile
          label="My drawer"
          testid="md-kpi-drawer"
          tone={drawer.shift?.stale || drawer.shift?.suspended ? 'danger' : undefined}
          main={drawer.shift ? <Money cents={drawer.shift.expectedCashCents} /> : 'closed'}
          sub={
            drawer.shift
              ? drawer.shift.suspended
                ? 'suspended — finish the close'
                : drawer.shift.stale
                  ? `open ${drawer.shift.hoursOpen}h — close it`
                  : `open ${drawer.shift.hoursOpen}h · ${drawer.shift.locationName ?? ''}`
              : 'no shift open'
          }
        />
        <Tile
          label="Balance due"
          testid="md-kpi-balance"
          tone={dueNow > 0 ? 'danger' : undefined}
          main={<Money cents={summary.balanceDue.totalCents} />}
          sub={
            dueNow > 0
              ? `${dueNow} due now`
              : `${summary.balanceDue.rows.length} order${summary.balanceDue.rows.length === 1 ? '' : 's'} owing`
          }
        />
        <Tile
          label={`Commission · ${commission.period}`}
          testid="md-kpi-commission"
          main={<Money cents={commission.accruedCents} />}
          sub={
            commission.paidCents > 0
              ? `${fmtUsd(commission.paidCents)} paid`
              : commission.approvedCents > 0
                ? `${fmtUsd(commission.approvedCents)} approved`
                : `${fmtUsd(commission.pendingCents)} pending`
          }
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        {/* Card 3 */}
        <Card
          title="Call-backs — my quotes and drafts"
          style={{ padding: 0 }}
          data-testid="md-callbacks"
          actions={
            <Link href="/orders?mine=1&status=quote" style={{ fontSize: 12.5 }}>
              All quotes →
            </Link>
          }
        >
          {summary.callbacks.length === 0 ? (
            <Pad>No open quotes or drafts. Every lead is either sold or closed.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {summary.callbacks.map((r) => (
                  <tr key={r.orderId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <Link href={`/orders/${r.orderId}`}>{r.number}</Link>
                      <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      {r.customerName ?? '—'}
                      {r.phone && (
                        <a
                          href={`tel:${r.phone}`}
                          className="muted"
                          style={{ fontSize: 11, display: 'block' }}
                        >
                          {r.phone}
                        </a>
                      )}
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Money cents={r.totalCents} />
                    </td>
                    <td
                      style={{
                        padding: '7px 12px',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        color: r.ageDays >= 3 ? 'var(--danger)' : 'var(--text-muted)',
                      }}
                    >
                      {r.ageDays === 0 ? 'today' : `${r.ageDays}d`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Card 4 */}
        <Card
          title={`My deliveries — today${todayDeliveries > 0 ? ` (${todayDeliveries})` : ''} and tomorrow`}
          style={{ padding: 0 }}
          data-testid="md-deliveries"
          actions={
            <Link href={`/deliveries/day/${summary.date}`} style={{ fontSize: 12.5 }}>
              Day sheet →
            </Link>
          }
        >
          {summary.myDeliveries.length === 0 ? (
            <Pad>None of your customers are on the truck today or tomorrow.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {summary.myDeliveries.map((d) => (
                  <tr key={d.deliveryId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: d.when === 'today' ? 'var(--text)' : undefined }}>
                        {d.when}
                      </strong>
                      <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                        {window(d.windowStart, d.windowEnd)}
                      </span>
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      <Link href={`/orders/${d.orderId}`}>{d.orderNumber}</Link>
                      <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                        {d.customerName ?? '—'}
                        {d.phone ? ` · ${d.phone}` : ''}
                      </span>
                    </td>
                    <td style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>
                      {d.driverName ?? 'no driver'}
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        {/* Card 5 */}
        <Card
          title="Balance due — my open orders"
          style={{ padding: 0 }}
          data-testid="md-balance"
          actions={
            <span style={{ fontSize: 12.5 }}>
              <Money cents={summary.balanceDue.totalCents} /> open
            </span>
          }
        >
          {summary.balanceDue.rows.length === 0 ? (
            <Pad>Every open order of yours is paid in full.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {summary.balanceDue.rows.map((r) => (
                  <tr key={r.orderId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <Link href={`/orders/${r.orderId}`}>{r.number}</Link>
                      <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                        {r.fulfillmentType?.replace(/_/g, ' ') ?? '—'}
                        {r.requestedDate ? ` · ${r.requestedDate}` : ''}
                      </span>
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      {r.customerName ?? '—'}
                      {r.phone && (
                        <a
                          href={`tel:${r.phone}`}
                          className="muted"
                          style={{ fontSize: 11, display: 'block' }}
                        >
                          {r.phone}
                        </a>
                      )}
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: r.dueNow ? 'var(--danger)' : undefined }}>
                        <Money cents={r.balanceCents} />
                      </strong>
                      <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                        of <Money cents={r.totalCents} />
                        {r.dueNow ? ' · due now' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Card 6 */}
        <Card
          title={`Pickups waiting at ${summary.location.name}`}
          style={{ padding: 0 }}
          data-testid="md-pickups"
          actions={
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {readyPickups} ready
            </span>
          }
        >
          {summary.pickups.length === 0 ? (
            <Pad>No pickup orders waiting here.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {summary.pickups.map((p) => (
                  <tr key={p.orderId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <Link href={`/orders/${p.orderId}`}>{p.number}</Link>
                      {p.mine && (
                        <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                          mine
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      {p.customerName ?? '—'}
                      {p.phone ? <span className="muted"> · {p.phone}</span> : null}
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ color: p.ready ? 'var(--success)' : 'var(--text-muted)' }}>
                        {p.ready ? 'ready' : 'not all in stock'}
                      </span>
                      <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                        waiting {p.ageDays === 0 ? 'since today' : `${p.ageDays}d`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3" style={{ marginBottom: 16 }}>
        {/* Card 7 */}
        <Card title={`Commission — ${commission.period}`} data-testid="md-commission">
          <dl style={{ margin: 0, fontSize: 13, display: 'grid', gap: 4 }}>
            <Row label="Accrued this period" value={<Money cents={commission.accruedCents} />} />
            <Row label="Pending review" value={<Money cents={commission.pendingCents} />} />
            <Row label="Approved" value={<Money cents={commission.approvedCents} />} />
            <Row label="Paid" value={<Money cents={commission.paidCents} />} />
            <Row
              label="Last payout"
              value={
                commission.lastPaid ? (
                  <>
                    <Money cents={commission.lastPaid.cents} />
                    <span className="muted"> · {commission.lastPaid.period}</span>
                  </>
                ) : (
                  '—'
                )
              }
            />
          </dl>
        </Card>

        {/* Card 8 */}
        <Card title="What I can offer" data-testid="md-promos">
          <p style={{ margin: '0 0 8px', fontSize: 13 }}>
            Discount without a manager: up to{' '}
            <strong>{summary.promos.priceVariance.tier1Pct}%</strong> or{' '}
            <strong>{fmtUsd(summary.promos.priceVariance.tier1MaxCents)}</strong> per ticket.
            Manager approval up to <strong>{summary.promos.priceVariance.tier2Pct}%</strong>.
          </p>
          {summary.promos.codes.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              No promo codes running.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13 }}>
              {summary.promos.codes.map((c) => (
                <li key={c.id} style={{ padding: '4px 0', borderTop: '1px solid var(--border)' }}>
                  <code>{c.code}</code>{' '}
                  <strong>
                    {c.kind === 'percent' ? `${c.value}% off` : `${fmtUsd(c.value)} off`}
                  </strong>
                  {c.minSubtotalCents ? (
                    <span className="muted"> · min {fmtUsd(c.minSubtotalCents)}</span>
                  ) : null}
                  {c.endsAt ? <span className="muted"> · ends {c.endsAt.slice(0, 10)}</span> : null}
                  {c.remainingUses != null ? (
                    <span className="muted"> · {c.remainingUses} left</span>
                  ) : null}
                  {c.description && (
                    <span className="muted" style={{ display: 'block', fontSize: 11.5 }}>
                      {c.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Card 10 */}
        <Card title={`${summary.location.name} today`} data-testid="md-scoreboard">
          <dl style={{ margin: 0, fontSize: 13, display: 'grid', gap: 4 }}>
            <Row
              label="Store written"
              value={
                <>
                  <Money cents={scoreboard.storeTodayCents} />
                  <span className="muted"> · {scoreboard.storeTodayDocuments} tickets</span>
                </>
              }
            />
            <Row label="My share" value={<Money cents={scoreboard.myShareCents} />} />
            <Row
              label="This week"
              value={
                scoreboard.week.rank != null ? (
                  <>
                    <strong>{ordinal(scoreboard.week.rank)}</strong> of {scoreboard.week.sellers} ·{' '}
                    <Money cents={scoreboard.week.myCents} />
                    {scoreboard.week.rank > 1 && (
                      <span className="muted">
                        {' '}
                        · leader <Money cents={scoreboard.week.leaderCents} />
                      </span>
                    )}
                  </>
                ) : (
                  <span className="muted">nothing written yet this week</span>
                )
              }
            />
          </dl>
        </Card>
      </div>

      {/* Card 9 */}
      <Card
        title="My returns and exchanges in progress"
        style={{ padding: 0, marginBottom: 16 }}
        data-testid="md-returns"
      >
        {summary.myReturns.length === 0 ? (
          <Pad>Nothing you started is waiting on goods or a refund.</Pad>
        ) : (
          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
            <tbody>
              {summary.myReturns.map((r) => (
                <tr key={`${r.kind}-${r.id}`} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                    <Link href={r.kind === 'return' ? `/returns/${r.id}` : `/exchanges/${r.id}`}>
                      {r.number}
                    </Link>
                    <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                      {r.kind}
                    </span>
                  </td>
                  <td style={{ padding: '7px 12px' }}>
                    {r.customerName ?? '—'}
                    {r.orderId && r.orderNumber && (
                      <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                        on <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {r.amountCents != null ? <Money cents={r.amountCents} /> : '—'}
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {drawer.lastClose && (
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Last drawer close at {summary.location.name}:{' '}
          {new Date(drawer.lastClose.closedAt).toLocaleString()}
          {drawer.lastClose.varianceCents != null && drawer.lastClose.varianceCents !== 0 ? (
            <>
              {' '}
              · variance <Money cents={drawer.lastClose.varianceCents} />
            </>
          ) : (
            ' · balanced'
          )}
        </p>
      )}
    </div>
  );
}

function fmtUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <dt style={{ color: 'var(--text-secondary)' }}>{label}</dt>
      <dd style={{ margin: 0, textAlign: 'right' }}>{value}</dd>
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

function Pad({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 14 }}>
      <EmptyState>{children}</EmptyState>
    </div>
  );
}
