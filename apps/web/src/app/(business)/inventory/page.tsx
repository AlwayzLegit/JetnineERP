'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { CsvImport } from '@/components/csv-import';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
  Select,
} from '@/components/ui';

interface Location {
  id: string;
  name: string;
  isActive: boolean;
}
interface Level {
  variantId: string;
  locationId: string;
  productName: string;
  variantSku: string | null;
  variantName: string | null;
  variantBarcode: string | null;
  onHand: number;
  reserved: number;
  floorSample: number;
  available: number;
  storageBinId: string | null;
  storageBinCode: string | null;
}
interface Bin {
  id: string;
  locationId: string;
  code: string;
  description: string | null;
  isActive: boolean;
}

interface ReservationRow {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  requestedDate: string | null;
  customerName: string | null;
  lineId: string;
  description: string;
  qtyReserved: number;
}

const ADJUST_REASONS = ['count_correction', 'damage', 'theft', 'other'] as const;

export default function InventoryPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [levels, setLevels] = useState<Level[] | null>(null);
  const [bins, setBins] = useState<Bin[]>([]);
  const [q, setQ] = useState('');
  const [newBin, setNewBin] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Reserved drill-down: which orders hold this variant's committed units.
  const [resFor, setResFor] = useState<Level | null>(null);
  const [reservations, setReservations] = useState<ReservationRow[] | null>(null);

  async function openReservations(level: Level) {
    setResFor(level);
    setReservations(null);
    try {
      setReservations(
        await api<ReservationRow[]>(
          `/v1/inventory/reservations?variantId=${level.variantId}&locationId=${level.locationId}`,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setResFor(null);
    }
  }

  async function releaseReservation(r: ReservationRow) {
    if (
      !confirm(
        `Release ${r.qtyReserved} reserved unit(s) from ${r.orderNumber}? The stock becomes sellable immediately; re-reserve on ${r.orderNumber} from its page when replacement stock lands.`,
      )
    )
      return;
    try {
      await api(`/v1/orders/${r.orderId}/lines/${r.lineId}/release`, { method: 'POST' });
      toast.success(`Released — ${r.orderNumber} now holds no reservation on this item.`);
      if (resFor) await openReservations(resFor);
      await loadLevels(locationId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadLocations() {
    try {
      const rows = await api<Location[]>('/v1/business/locations');
      const active = rows.filter((l) => l.isActive);
      setLocations(active);
      if (active[0] && !locationId) setLocationId(active[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadLevels(loc: string, query = q) {
    if (!loc) return;
    try {
      const params = new URLSearchParams({ locationId: loc });
      if (query.trim()) params.set('q', query.trim());
      setLevels(await api<Level[]>(`/v1/inventory/levels?${params.toString()}`));
      setBins(await api<Bin[]>(`/v1/inventory/bins?locationId=${loc}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function assignBin(level: Level, storageBinId: string | null) {
    try {
      await api('/v1/inventory/levels/assign-bin', {
        method: 'POST',
        body: JSON.stringify({
          variantId: level.variantId,
          locationId: level.locationId,
          storageBinId,
        }),
      });
      await loadLevels(locationId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function addBin() {
    const code = newBin.trim();
    if (!code || !locationId) return;
    try {
      await api('/v1/inventory/bins', {
        method: 'POST',
        body: JSON.stringify({ locationId, code }),
      });
      setNewBin('');
      await loadLevels(locationId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void loadLocations();
  }, []);
  useEffect(() => {
    if (locationId) void loadLevels(locationId);
  }, [locationId]);

  /** J2: hold N units as floor samples — on hand but never sellable. */
  async function setFloor(level: Level) {
    const qtyStr = prompt(
      `Floor-sample hold for ${level.variantSku ?? level.productName} (currently ${level.floorSample} of ${level.onHand} on hand). Set to:`,
      String(level.floorSample),
    );
    if (qtyStr == null) return;
    const quantity = Number(qtyStr);
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error('Enter a whole number ≥ 0');
      return;
    }
    try {
      await api('/v1/inventory/levels/floor-sample', {
        method: 'POST',
        body: JSON.stringify({
          variantId: level.variantId,
          locationId: level.locationId,
          quantity,
        }),
      });
      await loadLevels(locationId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function adjust(level: Level) {
    const deltaStr = prompt(
      `Adjust ${level.variantSku ?? level.productName} (current ${level.onHand}). Delta:`,
      '0',
    );
    if (!deltaStr) return;
    const delta = Number(deltaStr);
    if (!Number.isInteger(delta) || delta === 0) {
      toast.error('delta must be a non-zero integer');
      return;
    }
    const reason = prompt(`Reason (${ADJUST_REASONS.join(', ')}):`, 'count_correction');
    if (!reason) return;
    const notes = prompt('Optional notes:', '') ?? undefined;
    try {
      await api('/v1/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          variantId: level.variantId,
          locationId: level.locationId,
          delta,
          reason,
          notes: notes || undefined,
        }),
      });
      await loadLevels(locationId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/inventory/counts" variant="secondary">
              <ClipboardList size={14} />
              Count stock
            </LinkButton>
            <LinkButton href="/inventory/receive" variant="primary">
              <PackageCheck size={14} />
              Receive
            </LinkButton>
          </div>
        }
      />

      <form
        className="mb-4 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void loadLevels(locationId);
        }}
      >
        <label
          htmlFor="inventory-location"
          style={{ fontSize: 13, color: 'var(--text-secondary)' }}
        >
          Location:
        </label>
        <Select
          id="inventory-location"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        >
          <option value="">— Pick —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
        <Input
          name="q"
          placeholder="Search by name, SKU, or barcode"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ('');
            void loadLevels(locationId, '');
          }}
        >
          Clear
        </Button>
      </form>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card style={{ padding: 0 }}>
        {levels == null ? (
          <div style={{ padding: 16 }}>
            <LoadingRows />
          </div>
        ) : levels.length === 0 ? (
          <EmptyState>
            {q.trim()
              ? `No stock matches "${q.trim()}" at this location.`
              : 'No stock at this location yet. Use Receive to add some.'}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Barcode</th>
                  <th className="num">On hand</th>
                  <th className="num">Reserved</th>
                  <th className="num" title="Floor samples — on hand but never sellable as new">
                    Floor
                  </th>
                  <th className="num">Available</th>
                  <th>Bin</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((l) => (
                  <tr key={`${l.variantId}-${l.locationId}`}>
                    <td>{l.productName}</td>
                    <td>
                      <code>{l.variantSku ?? '—'}</code>
                    </td>
                    <td>
                      <code>{l.variantBarcode ?? '—'}</code>
                    </td>
                    <td className="num">{l.onHand}</td>
                    <td className="num">
                      {l.reserved > 0 ? (
                        <button
                          type="button"
                          className="badge badge-info"
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="See which orders hold these units — release from there to sell the piece today"
                          data-testid="reserved-count"
                          onClick={() => void openReservations(l)}
                        >
                          {l.reserved}
                        </button>
                      ) : (
                        l.reserved
                      )}
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        className={l.floorSample > 0 ? 'badge badge-info' : undefined}
                        style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
                        title="Click to set the floor-sample hold"
                        onClick={() => void setFloor(l)}
                      >
                        {l.floorSample > 0 ? l.floorSample : '—'}
                      </button>
                    </td>
                    <td className="num">{l.available}</td>
                    <td>
                      <Select
                        value={l.storageBinId ?? ''}
                        onChange={(e) => void assignBin(l, e.target.value || null)}
                        style={{ minWidth: 90 }}
                        aria-label={`Bin for ${l.variantSku ?? l.productName}`}
                      >
                        <option value="">—</option>
                        {bins
                          .filter((b) => b.isActive || b.id === l.storageBinId)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.code}
                            </option>
                          ))}
                      </Select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button size="sm" variant="ghost" onClick={() => adjust(l)}>
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <details style={{ marginTop: 24 }} data-testid="inventory-bins">
        <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          Storage bins at this location ({bins.filter((b) => b.isActive).length})
        </summary>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, margin: '6px 0 8px' }}>
          Bins are named slots inside the warehouse (DOCK, A-14). Assign one per stock row above and
          the pick list prints it.
        </p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Input
            placeholder="New bin code…"
            value={newBin}
            onChange={(e) => setNewBin(e.target.value)}
            style={{ width: 160 }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!newBin.trim() || !locationId}
            onClick={() => void addBin()}
          >
            Add bin
          </Button>
        </div>
        {bins.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {bins.map((b) => (
              <span
                key={b.id}
                className={`badge ${b.isActive ? 'badge-neutral' : 'badge-warning'}`}
              >
                {b.code}
                {!b.isActive && ' (inactive)'}
              </span>
            ))}
          </div>
        )}
      </details>

      <details style={{ marginTop: 24 }} data-testid="inventory-csv-import">
        <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          Import on-hand counts from a CSV file
        </summary>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, margin: '6px 0 8px' }}>
          One row per SKU per location (columns like SKU, LOCATION, ON_HAND, UNIT_COST — the
          location must match a store name exactly). Products must exist first; import the product
          file on the Products page if they don&apos;t.
        </p>
        <CsvImport
          entity="inventory"
          onCommitted={() => (locationId ? loadLevels(locationId) : undefined)}
        />
      </details>

      {resFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          data-testid="reservations-dialog"
        >
          <div
            className="card"
            style={{ maxWidth: 640, width: '100%', padding: 20, background: 'var(--surface)' }}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>
              Reserved — {resFor.productName} {resFor.variantSku ? `(${resFor.variantSku})` : ''}
            </h3>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-secondary)' }}>
              These orders hold the committed units. Release one to sell the piece today, then
              re-reserve it on that order from its page when replacement stock lands.
            </p>
            {!reservations ? (
              <LoadingRows rows={2} />
            ) : reservations.length === 0 ? (
              <EmptyState>No live orders hold this item here.</EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Promised</th>
                      <th className="num">Reserved</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r) => (
                      <tr key={r.lineId}>
                        <td>
                          <a href={`/orders/${r.orderId}`}>{r.orderNumber}</a>
                        </td>
                        <td>{r.customerName ?? '—'}</td>
                        <td>{r.requestedDate ?? '—'}</td>
                        <td className="num">{r.qtyReserved}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => void releaseReservation(r)}
                            data-testid="release-reservation"
                          >
                            Release
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Button variant="secondary" onClick={() => setResFor(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
