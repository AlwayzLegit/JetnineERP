'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Card,
  KeyValue,
  LinkButton,
  LoadingRows,
  PageHeader,
  Select,
  Stack,
  StatGrid,
  StatTile,
  StatusBadge,
} from '@/components/ui';
import { Money } from '@/components/money';
import { api } from '@/lib/api';
import { TableCard } from './dashboard-kit';

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
    locationName: string | null;
    expectedAt: string | null;
    orderedUnits: number;
    receivedUnits: number;
    overdue: boolean;
  }[];
  dock: {
    id: string;
    number: string;
    vendorName: string | null;
    locationName: string | null;
    unitsInProgress: number;
    lastActivityAt: string;
  }[];
  pickups: {
    orderId: string;
    number: string;
    customerName: string | null;
    locationName: string | null;
    ageDays: number;
    ready: boolean;
  }[];
  arrived: {
    orderId: string;
    orderNumber: string;
    customerName: string | null;
    locationName: string | null;
    description: string;
    quantity: number;
    arrivedAt: string;
  }[];
  transfers: {
    rows: {
      id: string;
      number: string;
      direction: 'inbound' | 'outbound' | 'internal';
      fromName: string | null;
      toName: string | null;
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
      locationName: string | null;
      quantity: number;
      condition: string | null;
      createdAt: string;
    }[];
  };
  counts: {
    open: { id: string; countDate: string; status: string; locationName: string | null }[];
    lastPostedDate: string | null;
    negative: {
      variantId: string;
      productName: string;
      sku: string | null;
      locationName: string | null;
      onHand: number;
    }[];
  };
}

interface Loadout {
  date: string;
  /** Null in the combined view — the stop cap is a per-location knob. */
  cap: number | null;
  stops: number;
  pieces: number;
  rows: {
    deliveryId: string;
    orderId: string;
    orderNumber: string;
    customerName: string | null;
    locationName: string | null;
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
    locationId: string;
    locationName: string | null;
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

/** The location line under a number — only in the combined view. */
function LocationSub({ show, name }: { show: boolean; name: string | null }) {
  if (!show || !name) return null;
  return <div className="muted">{name}</div>;
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
      // No selection = the combined view; the server defaults the same way.
      const qs = loc ? `?locationId=${loc}` : '?locationId=all';
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

  const title = `Warehouse — ${userName}`;

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

  const allMode = summary.location.id === 'all';
  const overdueCount = summary.inbound.filter((r) => r.overdue).length;
  const dockUnits = summary.dock.reduce((s, r) => s + r.unitsInProgress, 0);
  const stalePickups = summary.pickups.filter((p) => p.ageDays >= 7).length;

  return (
    <div data-testid="warehouse-dashboard">
      <PageHeader
        title={title}
        sub={
          <>
            {summary.date} ·{' '}
            <strong>
              {summary.location.id === 'all'
                ? `All locations (${summary.locations.length})`
                : summary.location.name}
            </strong>
          </>
        }
        actions={
          <>
            {summary.locations.length > 1 && (
              <Select
                aria-label="Location"
                data-testid="warehouse-location-picker"
                value={locationId ?? 'all'}
                onChange={(e) => {
                  setSummary(null);
                  setLoadout(null);
                  setPicklist(null);
                  void load(e.target.value);
                }}
              >
                <option value="all">All locations</option>
                {summary.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.locationType === 'warehouse' ? ' (warehouse)' : ''}
                  </option>
                ))}
              </Select>
            )}
            <LinkButton size="sm" variant="secondary" href={`/deliveries/day/${summary.date}`}>
              Day sheet
            </LinkButton>
          </>
        }
      />

      <Stack>
        <StatGrid cols={5}>
          <StatTile
            label="Inbound POs"
            data-testid="wh-kpi-inbound"
            tone={overdueCount > 0 ? 'danger' : undefined}
            value={String(summary.inbound.length)}
            sub={overdueCount > 0 ? `${overdueCount} overdue` : 'none overdue'}
          />
          <StatTile
            label="On the dock"
            data-testid="wh-kpi-dock"
            tone={dockUnits > 0 ? 'danger' : undefined}
            value={String(dockUnits)}
            sub="units received, not accepted"
          />
          <StatTile
            label="Load-out today"
            data-testid="wh-kpi-loadout"
            value={
              loadout
                ? loadout.cap != null
                  ? `${loadout.stops}/${loadout.cap}`
                  : String(loadout.stops)
                : '—'
            }
            sub={loadout ? `${loadout.pieces} pieces` : 'loading…'}
          />
          <StatTile
            label="Pickups waiting"
            data-testid="wh-kpi-pickups"
            tone={stalePickups > 0 ? 'danger' : undefined}
            value={String(summary.pickups.length)}
            sub={stalePickups > 0 ? `${stalePickups} waiting 7d+` : 'all fresh'}
          />
          <StatTile
            label="Arrived, unscheduled"
            data-testid="wh-kpi-arrived"
            tone={summary.arrived.length > 0 ? 'danger' : undefined}
            value={String(summary.arrived.length)}
            sub="special orders to book"
          />
        </StatGrid>

        {/* Card 6 first when it has rows — the highest-value queue. */}
        {summary.arrived.length > 0 && (
          <TableCard
            title="Arrived — book the delivery or call the customer"
            isEmpty={false}
            empty={null}
          >
            <table className="table table-dense" data-testid="wh-arrived">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Goods</th>
                  <th className="num">Arrived</th>
                </tr>
              </thead>
              <tbody>
                {summary.arrived.map((r) => (
                  <tr key={`${r.orderId}-${r.description}`}>
                    <td className="nowrap">
                      <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                      <LocationSub show={allMode} name={r.locationName} />
                    </td>
                    <td>{r.customerName ?? '—'}</td>
                    <td className="muted">
                      {r.quantity} × {r.description}
                    </td>
                    <td className="num muted nowrap">arrived {ago(r.arrivedAt)} ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard
            title="Inbound — due and overdue"
            data-testid="wh-inbound"
            isEmpty={summary.inbound.length === 0}
            empty="Nothing on the way to this location."
          >
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>Vendor</th>
                  <th>Received</th>
                  <th className="num">Expected</th>
                </tr>
              </thead>
              <tbody>
                {summary.inbound.map((r) => (
                  <tr key={r.id}>
                    <td className="nowrap">
                      <Link href={`/purchase-orders/${r.id}`}>{r.number}</Link>
                      <LocationSub show={allMode} name={r.locationName} />
                    </td>
                    <td>{r.vendorName ?? '—'}</td>
                    <td className="muted nowrap">
                      {r.receivedUnits}/{r.orderedUnits} units
                    </td>
                    <td
                      className={`num nowrap ${r.overdue ? 'text-danger font-semibold' : 'muted'}`}
                    >
                      {r.expectedAt
                        ? `${r.overdue ? 'overdue — ' : ''}${new Date(r.expectedAt).toLocaleDateString()}`
                        : 'no date'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title="Dock in progress — received, not accepted"
            data-testid="wh-dock"
            isEmpty={summary.dock.length === 0}
            empty="The dock is clear — everything received has been dispositioned."
          >
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>Vendor</th>
                  <th>Open</th>
                  <th className="num">Idle</th>
                </tr>
              </thead>
              <tbody>
                {summary.dock.map((r) => (
                  <tr key={r.id}>
                    <td className="nowrap">
                      <Link href={`/purchase-orders/${r.id}`}>{r.number}</Link>
                      <LocationSub show={allMode} name={r.locationName} />
                    </td>
                    <td>{r.vendorName ?? '—'}</td>
                    <td className="nowrap">
                      <strong className="text-danger">{r.unitsInProgress} units</strong>
                    </td>
                    <td className="num muted nowrap">idle {ago(r.lastActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard
            title={`Today's truck — ${loadout ? `${loadout.stops} stop${loadout.stops === 1 ? '' : 's'}` : '…'}`}
            data-testid="wh-loadout"
            loading={loadout == null}
            isEmpty={loadout?.rows.length === 0}
            empty="No deliveries scheduled from here today."
          >
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Load</th>
                  <th className="actions">Status</th>
                </tr>
              </thead>
              <tbody>
                {(loadout?.rows ?? []).map((r) => (
                  <tr key={r.deliveryId}>
                    <td className="nowrap">
                      <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                    </td>
                    <td>
                      {r.customerName ?? '—'}
                      {r.serialShort && (
                        <strong className="text-danger"> · serials unpicked</strong>
                      )}
                    </td>
                    <td className="muted nowrap">
                      {r.pieces} pc · {r.route ?? 'no route'}
                      {r.driverName ? ` · ${r.driverName}` : ''}
                      {allMode && r.locationName ? ` · from ${r.locationName}` : ''}
                    </td>
                    <td className="actions">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title={`Pick list — tomorrow${picklist ? ` (${picklist.date})` : ''}`}
            data-testid="wh-picklist"
            loading={picklist == null}
            isEmpty={picklist?.rows.length === 0}
            empty="Nothing scheduled to pull for tomorrow yet."
          >
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Bin</th>
                  <th className="num">Pull</th>
                </tr>
              </thead>
              <tbody>
                {(picklist?.rows ?? []).map((r) => (
                  <tr key={`${r.variantId}:${r.locationId}`}>
                    <td>
                      {r.productName}
                      {r.variantName ? ` — ${r.variantName}` : ''}
                      {r.sku && <span className="muted"> ({r.sku})</span>}
                    </td>
                    <td className="nowrap">
                      <code>{r.bin ?? 'unbinned'}</code>
                      <LocationSub show={allMode} name={r.locationName} />
                    </td>
                    <td className="num nowrap">
                      pull <strong>{r.quantity}</strong>
                      {r.short && (
                        <strong className="text-danger"> · only {r.onHand} on hand</strong>
                      )}
                      {r.serialShort && <strong className="text-danger"> · serials</strong>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard
            title="Customer pickups waiting"
            data-testid="wh-pickups"
            isEmpty={summary.pickups.length === 0}
            empty="No pickup orders waiting."
          >
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Stock</th>
                  <th className="num">Waiting</th>
                </tr>
              </thead>
              <tbody>
                {summary.pickups.map((r) => (
                  <tr key={r.orderId}>
                    <td className="nowrap">
                      <Link href={`/orders/${r.orderId}`}>{r.number}</Link>
                      <LocationSub show={allMode} name={r.locationName} />
                    </td>
                    <td>{r.customerName ?? '—'}</td>
                    <td className="muted">{r.ready ? 'ready to stage' : 'stock short'}</td>
                    <td
                      className={`num nowrap ${r.ageDays >= 7 ? 'text-danger font-semibold' : 'muted'}`}
                    >
                      waiting {r.ageDays}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title={`Transfers in motion${summary.transfers.closedShort30d > 0 ? ` · ${summary.transfers.closedShort30d} closed short (30d)` : ''}`}
            data-testid="wh-transfers"
            isEmpty={summary.transfers.rows.length === 0}
            empty="No transfers touching this location."
          >
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>Transfer</th>
                  <th>Route</th>
                  <th>Units</th>
                  <th className="actions">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.transfers.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="nowrap">
                      <Link href="/transfers">{r.number}</Link>
                    </td>
                    <td>
                      {r.fromName ?? '—'} → {r.toName ?? '—'}
                    </td>
                    <td className="muted nowrap">{r.units} units</td>
                    <td className="actions">
                      {r.awaitingTicket ? (
                        <span className="text-danger">awaiting ticket</span>
                      ) : r.days != null && r.days >= 3 ? (
                        <strong className="text-danger">in transit {r.days}d</strong>
                      ) : (
                        <StatusBadge status={r.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard
            title={
              <>
                As-is review — {summary.asIs.count} pc, <Money cents={summary.asIs.costCents} /> at
                cost
              </>
            }
            data-testid="wh-asis"
            actions={
              <Link href="/as-is" className="btn-link">
                Open the review queue →
              </Link>
            }
            isEmpty={summary.asIs.rows.length === 0}
            empty="Nothing waiting for disposition."
          >
            <table className="table table-dense">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Condition</th>
                  <th className="num">Waiting</th>
                </tr>
              </thead>
              <tbody>
                {summary.asIs.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.quantity} × {r.productName}
                    </td>
                    <td className="muted">
                      {r.condition ?? '—'}
                      {allMode && r.locationName ? ` · ${r.locationName}` : ''}
                    </td>
                    <td className="num muted nowrap">waiting {ago(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <Card title="Counts & stock health" data-testid="wh-counts">
            <Stack>
              <KeyValue
                rows={[
                  {
                    label: 'Counts open',
                    value:
                      summary.counts.open.length > 0 ? (
                        <>
                          <strong>{summary.counts.open.length}</strong> count
                          {summary.counts.open.length === 1 ? '' : 's'} open —{' '}
                          <Link href="/inventory/counts">continue counting</Link>
                        </>
                      ) : (
                        'No counts in progress.'
                      ),
                  },
                  {
                    label: 'Last posted count',
                    value: summary.counts.lastPostedDate
                      ? new Date(summary.counts.lastPostedDate).toLocaleDateString()
                      : 'never',
                  },
                ]}
              />
              {summary.counts.negative.length > 0 ? (
                <Alert
                  tone="error"
                  title={`${summary.counts.negative.length} negative on-hand — count these first:`}
                  data-testid="wh-negative"
                >
                  <ul className="list-disc pl-4">
                    {summary.counts.negative.map((n) => (
                      <li key={`${n.variantId}:${n.locationName ?? ''}`}>
                        {n.productName}
                        {n.sku ? ` (${n.sku})` : ''}: {n.onHand}
                        {allMode && n.locationName ? ` — ${n.locationName}` : ''}
                      </li>
                    ))}
                  </ul>
                </Alert>
              ) : (
                <Alert tone="success">No negative on-hand here.</Alert>
              )}
            </Stack>
          </Card>
        </div>
      </Stack>
    </div>
  );
}
