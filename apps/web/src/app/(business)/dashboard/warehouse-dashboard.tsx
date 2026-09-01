'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Card, EmptyState, LinkButton, LoadingRows, StatusBadge } from '@/components/ui';
import { Money } from '@/components/money';
import { api } from '@/lib/api';

/**
 * The Warehouse home (owner 2026-09-01, §12.2): a day in the building,
 * top to bottom — what's arriving, what's stuck on the dock, what goes
 * on the truck, who's coming to pick up, and every "goods are here,
 * close the loop" queue. Pinned to one location (warehouse-type lead
 * the picker); no money-in tiles, no selling — that's other homes.
 */

interface Summary {
  date: string;
  location: { id: string; name: string; timezone: string };
  locations: { id: string; name: string; locationType: string }[];
  inbound: {
    id: string;
    number: string;
    vendorName: string | null;
    expectedAt: string | null;
    orderedUnits: number;
    receivedUnits: number;
    overdue: boolean;
  }[];
  dock: {
    id: string;
    number: string;
    vendorName: string | null;
    unitsInProgress: number;
    lastActivityAt: string;
  }[];
  pickups: {
    orderId: string;
    number: string;
    customerName: string | null;
    ageDays: number;
    ready: boolean;
  }[];
  arrived: {
    orderId: string;
    orderNumber: string;
    customerName: string | null;
    description: string;
    quantity: number;
    arrivedAt: string;
  }[];
  transfers: {
    rows: {
      id: string;
      number: string;
      direction: 'inbound' | 'outbound';
      otherLocationName: string | null;
      status: string;
      units: number;
      days: number | null;
      awaitingTicket: boolean;
    }[];
    closedShort30d: number;
  };
  asIs: {
    count: number;
    costCents: number;
    oldestAt: string | null;
    rows: {
      id: string;
      productName: string;
      quantity: number;
      condition: string | null;
      createdAt: string;
    }[];
  };
  counts: {
    open: { id: string; countDate: string; status: string }[];
    lastPostedDate: string | null;
    negative: { variantId: string; productName: string; sku: string | null; onHand: number }[];
  };
}

interface Loadout {
  date: string;
  cap: number;
  stops: number;
  pieces: number;
  rows: {
    deliveryId: string;
    orderId: string;
    orderNumber: string;
    customerName: string | null;
    windowStart: string | null;
    windowEnd: string | null;
    route: string | null;
    driverName: string | null;
    status: string;
    pieces: number;
    serialShort: boolean;
  }[];
}

interface Picklist {
  date: string;
  rows: {
    variantId: string;
    productName: string;
    variantName: string | null;
    sku: string | null;
    bin: string | null;
    quantity: number;
    onHand: number;
    short: boolean;
    serialShort: boolean;
  }[];
}

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  return `${days}d`;
}

export default function WarehouseDashboardView({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [loadout, setLoadout] = useState<Loadout | null>(null);
  const [picklist, setPicklist] = useState<Picklist | null>(null);

  const load = useCallback(async (loc: string | null) => {
    setError(null);
    try {
      const qs = loc ? `?locationId=${loc}` : '';
      const s = await api<Summary>(`/v1/dashboard/warehouse${qs}`);
      setSummary(s);
      setLocationId(s.location.id);
      const locQs = `?locationId=${s.location.id}`;
      void api<Loadout>(`/v1/dashboard/warehouse/loadout${locQs}`)
        .then(setLoadout)
        .catch(() => setLoadout(null));
      void api<Picklist>(`/v1/dashboard/warehouse/picklist${locQs}`)
        .then(setPicklist)
        .catch(() => setPicklist(null));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load(null);
  }, [load]);

  if (error) {
    return (
      <Card title="Warehouse">
        <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>{error}</p>
      </Card>
    );
  }
  if (!summary) return <LoadingRows />;

  const overdueCount = summary.inbound.filter((r) => r.overdue).length;
  const dockUnits = summary.dock.reduce((s, r) => s + r.unitsInProgress, 0);
  const stalePickups = summary.pickups.filter((p) => p.ageDays >= 7).length;

  return (
    <div data-testid="warehouse-dashboard">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Warehouse — {userName}</h1>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            {summary.date} at <strong>{summary.location.name}</strong>
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {summary.locations.length > 1 && (
            <select
              data-testid="warehouse-location-picker"
              value={locationId ?? ''}
              onChange={(e) => {
                setSummary(null);
                setLoadout(null);
                setPicklist(null);
                void load(e.target.value);
              }}
              style={{ fontSize: 13 }}
            >
              {summary.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.locationType === 'warehouse' ? ' (warehouse)' : ''}
                </option>
              ))}
            </select>
          )}
          <LinkButton size="sm" variant="secondary" href={`/deliveries/day/${summary.date}`}>
            Day sheet
          </LinkButton>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        style={{ marginBottom: 16 }}
      >
        <Tile
          label="Inbound POs"
          testid="wh-kpi-inbound"
          tone={overdueCount > 0 ? 'danger' : undefined}
          main={String(summary.inbound.length)}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : 'none overdue'}
        />
        <Tile
          label="On the dock"
          testid="wh-kpi-dock"
          tone={dockUnits > 0 ? 'danger' : undefined}
          main={String(dockUnits)}
          sub="units received, not accepted"
        />
        <Tile
          label="Load-out today"
          testid="wh-kpi-loadout"
          main={loadout ? `${loadout.stops}/${loadout.cap}` : '—'}
          sub={loadout ? `${loadout.pieces} pieces` : 'loading…'}
        />
        <Tile
          label="Pickups waiting"
          testid="wh-kpi-pickups"
          tone={stalePickups > 0 ? 'danger' : undefined}
          main={String(summary.pickups.length)}
          sub={stalePickups > 0 ? `${stalePickups} waiting 7d+` : 'all fresh'}
        />
        <Tile
          label="Arrived, unscheduled"
          testid="wh-kpi-arrived"
          tone={summary.arrived.length > 0 ? 'danger' : undefined}
          main={String(summary.arrived.length)}
          sub="special orders to book"
        />
      </div>

      {/* Card 6 first when it has rows — the highest-value queue. */}
      {summary.arrived.length > 0 && (
        <Card
          title="Arrived — book the delivery or call the customer"
          style={{ padding: 0, marginBottom: 16 }}
        >
          <table
            style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}
            data-testid="wh-arrived"
          >
            <tbody>
              {summary.arrived.map((r) => (
                <tr
                  key={`${r.orderId}-${r.description}`}
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                    <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                  </td>
                  <td style={{ padding: '7px 12px' }}>{r.customerName ?? '—'}</td>
                  <td style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>
                    {r.quantity} × {r.description}
                  </td>
                  <td
                    style={{
                      padding: '7px 12px',
                      textAlign: 'right',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    arrived {ago(r.arrivedAt)} ago
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <Card title="Inbound — due and overdue" style={{ padding: 0 }} data-testid="wh-inbound">
          {summary.inbound.length === 0 ? (
            <Pad>Nothing on the way to this location.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {summary.inbound.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <Link href={`/purchase-orders/${r.id}`}>{r.number}</Link>
                    </td>
                    <td style={{ padding: '7px 12px' }}>{r.vendorName ?? '—'}</td>
                    <td
                      style={{
                        padding: '7px 12px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.receivedUnits}/{r.orderedUnits} units
                    </td>
                    <td
                      style={{
                        padding: '7px 12px',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        color: r.overdue ? 'var(--danger)' : 'var(--text-muted)',
                        fontWeight: r.overdue ? 600 : 400,
                      }}
                    >
                      {r.expectedAt
                        ? `${r.overdue ? 'overdue — ' : ''}${new Date(r.expectedAt).toLocaleDateString()}`
                        : 'no date'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card
          title="Dock in progress — received, not accepted"
          style={{ padding: 0 }}
          data-testid="wh-dock"
        >
          {summary.dock.length === 0 ? (
            <Pad>The dock is clear — everything received has been dispositioned.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {summary.dock.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <Link href={`/purchase-orders/${r.id}`}>{r.number}</Link>
                    </td>
                    <td style={{ padding: '7px 12px' }}>{r.vendorName ?? '—'}</td>
                    <td
                      style={{
                        padding: '7px 12px',
                        color: 'var(--danger)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.unitsInProgress} units
                    </td>
                    <td
                      style={{
                        padding: '7px 12px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      idle {ago(r.lastActivityAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <Card
          title={`Today's truck — ${loadout ? `${loadout.stops} stop${loadout.stops === 1 ? '' : 's'}` : '…'}`}
          style={{ padding: 0 }}
          data-testid="wh-loadout"
        >
          {loadout == null ? (
            <Pad>Loading…</Pad>
          ) : loadout.rows.length === 0 ? (
            <Pad>No deliveries scheduled from here today.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {loadout.rows.map((r) => (
                  <tr key={r.deliveryId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      {r.customerName ?? '—'}
                      {r.serialShort && (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                          {' '}
                          · serials unpicked
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '7px 12px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.pieces} pc · {r.route ?? 'no route'}
                      {r.driverName ? ` · ${r.driverName}` : ''}
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

        <Card
          title={`Pick list — tomorrow${picklist ? ` (${picklist.date})` : ''}`}
          style={{ padding: 0 }}
          data-testid="wh-picklist"
        >
          {picklist == null ? (
            <Pad>Loading…</Pad>
          ) : picklist.rows.length === 0 ? (
            <Pad>Nothing scheduled to pull for tomorrow yet.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {picklist.rows.map((r) => (
                  <tr key={r.variantId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px' }}>
                      {r.productName}
                      {r.variantName ? ` — ${r.variantName}` : ''}
                      {r.sku && <span style={{ color: 'var(--text-muted)' }}> ({r.sku})</span>}
                    </td>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <code>{r.bin ?? 'unbinned'}</code>
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      pull <strong>{r.quantity}</strong>
                      {r.short && (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                          {' '}
                          · only {r.onHand} on hand
                        </span>
                      )}
                      {r.serialShort && (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}> · serials</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <Card title="Customer pickups waiting" style={{ padding: 0 }} data-testid="wh-pickups">
          {summary.pickups.length === 0 ? (
            <Pad>No pickup orders waiting.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {summary.pickups.map((r) => (
                  <tr key={r.orderId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <Link href={`/orders/${r.orderId}`}>{r.number}</Link>
                    </td>
                    <td style={{ padding: '7px 12px' }}>{r.customerName ?? '—'}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>
                      {r.ready ? 'ready to stage' : 'stock short'}
                    </td>
                    <td
                      style={{
                        padding: '7px 12px',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        color: r.ageDays >= 7 ? 'var(--danger)' : 'var(--text-muted)',
                        fontWeight: r.ageDays >= 7 ? 600 : 400,
                      }}
                    >
                      waiting {r.ageDays}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card
          title={`Transfers in motion${summary.transfers.closedShort30d > 0 ? ` · ${summary.transfers.closedShort30d} closed short (30d)` : ''}`}
          style={{ padding: 0 }}
          data-testid="wh-transfers"
        >
          {summary.transfers.rows.length === 0 ? (
            <Pad>No transfers touching this location.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {summary.transfers.rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                      <Link href="/transfers">{r.number}</Link>
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      {r.direction === 'outbound' ? '→ ' : '← '}
                      {r.otherLocationName ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '7px 12px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.units} units
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {r.awaitingTicket ? (
                        <span style={{ color: 'var(--danger)' }}>awaiting ticket</span>
                      ) : r.days != null && r.days >= 3 ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                          in transit {r.days}d
                        </span>
                      ) : (
                        <StatusBadge status={r.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <Card
          title={
            <>
              As-is review — {summary.asIs.count} pc, <Money cents={summary.asIs.costCents} /> at
              cost
            </>
          }
          style={{ padding: 0 }}
          data-testid="wh-asis"
        >
          {summary.asIs.rows.length === 0 ? (
            <Pad>Nothing waiting for disposition.</Pad>
          ) : (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {summary.asIs.rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px' }}>
                      {r.quantity} × {r.productName}
                    </td>
                    <td style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>
                      {r.condition ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '7px 12px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      waiting {ago(r.createdAt)}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td colSpan={3} style={{ padding: '7px 12px' }}>
                    <Link href="/as-is" style={{ fontSize: 12 }}>
                      Open the review queue →
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Counts & stock health" data-testid="wh-counts">
          <p style={{ margin: '0 0 6px', fontSize: 13 }}>
            {summary.counts.open.length > 0 ? (
              <>
                <strong>{summary.counts.open.length}</strong> count
                {summary.counts.open.length === 1 ? '' : 's'} open —{' '}
                <Link href="/inventory/counts">continue counting</Link>
              </>
            ) : (
              'No counts in progress.'
            )}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Last posted count:{' '}
            {summary.counts.lastPostedDate
              ? new Date(summary.counts.lastPostedDate).toLocaleDateString()
              : 'never'}
          </p>
          {summary.counts.negative.length > 0 ? (
            <div style={{ fontSize: 13, color: 'var(--danger)' }} data-testid="wh-negative">
              <strong>{summary.counts.negative.length} negative on-hand</strong> — count these
              first:
              <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                {summary.counts.negative.map((n) => (
                  <li key={n.variantId}>
                    {n.productName}
                    {n.sku ? ` (${n.sku})` : ''}: {n.onHand}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--success)' }}>
              No negative on-hand here.
            </p>
          )}
        </Card>
      </div>
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
  main: string;
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
