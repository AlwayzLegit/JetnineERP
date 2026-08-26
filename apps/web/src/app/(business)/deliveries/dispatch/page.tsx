'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  Input,
  LinkButton,
  LoadingRows,
  EmptyState,
  PageHeader,
  StatusBadge,
} from '@/components/ui';

/**
 * Dispatcher view (PLAN-POS-OPERATIONS §7): one day's stops as a simple
 * table sorted by route then stop, with the capacity state ("12/15")
 * up top. Route labels are auto-suggested from zip at scheduling and
 * edited inline here; stop numbers reorder the same way. Drivers never
 * see this screen — they get the printed tickets.
 */

interface DeliveryDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  scheduledDate: string;
  windowStart: string | null;
  windowEnd: string | null;
  status: string;
  routePosition: number | null;
  route: string | null;
  addressLine1: string | null;
  addressCity: string | null;
  addressPostalCode: string | null;
  addressPhone: string | null;
  balanceDueCents: number;
  lines: { id: string; description: string; quantity: number }[];
}

interface Capacity {
  cap: number;
  days: { date: string; booked: number; remaining: number }[];
}

function DispatchInner() {
  const search = useSearchParams();
  const [date, setDate] = useState(
    () => search?.get('date') ?? new Date().toISOString().slice(0, 10),
  );
  const [rows, setRows] = useState<DeliveryDetail[] | null>(null);
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    try {
      const [trips, cap] = await Promise.all([
        api<DeliveryDetail[]>(`/v1/deliveries?from=${d}&to=${d}`),
        api<Capacity>(`/v1/deliveries/capacity?from=${d}&to=${d}`),
      ]);
      trips.sort(
        (a, b) =>
          (a.route ?? '￿').localeCompare(b.route ?? '￿') ||
          (a.routePosition ?? 999) - (b.routePosition ?? 999),
      );
      setRows(trips);
      setCapacity(cap);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load(date);
  }, [date, load]);

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      await api(`/v1/deliveries/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      await load(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const day = capacity?.days[0];
  const atCap = day && capacity && day.booked >= capacity.cap;

  return (
    <div>
      <PageHeader
        title="Dispatch"
        sub="Stops for the day by route. Edit a route label or stop number in place; drivers work off the printed tickets."
        actions={
          <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="dispatch-date"
              style={{ width: 160 }}
            />
            {day && capacity && (
              <span
                className={`badge badge-${atCap ? 'danger' : day.booked >= capacity.cap - 3 ? 'warning' : 'success'}`}
                data-testid="capacity-chip"
                style={{ fontSize: 13 }}
              >
                {day.booked}/{capacity.cap} stops
              </span>
            )}
            <LinkButton
              href={`/print/deliveries?date=${date}`}
              variant="secondary"
              size="sm"
              target="_blank"
            >
              <Printer size={13} aria-hidden /> All tickets
            </LinkButton>
            <LinkButton href="/deliveries" variant="ghost" size="sm">
              ← Calendar
            </LinkButton>
          </span>
        }
      />

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      {!rows && !error && <LoadingRows rows={5} />}
      {rows && rows.length === 0 && <EmptyState>No deliveries scheduled for {date}.</EmptyState>}

      {rows && rows.length > 0 && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" data-testid="dispatch-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Stop</th>
                <th style={{ width: 110 }}>Route</th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Window</th>
                <th>Items</th>
                <th style={{ textAlign: 'right' }}>Collect</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const editable = r.status === 'scheduled' || r.status === 'loaded';
                return (
                  <tr key={r.id} data-testid="dispatch-row">
                    <td>
                      <Input
                        type="number"
                        min={1}
                        defaultValue={r.routePosition ?? ''}
                        disabled={!editable}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isInteger(v) && v > 0 && v !== r.routePosition) {
                            void patch(r.id, { routePosition: v });
                          }
                        }}
                        style={{ width: 56, padding: '4px 6px' }}
                      />
                    </td>
                    <td>
                      <Input
                        defaultValue={r.route ?? ''}
                        placeholder="—"
                        disabled={!editable}
                        data-testid="route-input"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (r.route ?? '')) void patch(r.id, { route: v || null });
                        }}
                        style={{ width: 96, padding: '4px 6px' }}
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                    </td>
                    <td>{r.customerName ?? '—'}</td>
                    <td style={{ fontSize: 12.5 }}>
                      {[r.addressLine1, r.addressCity, r.addressPostalCode]
                        .filter(Boolean)
                        .join(', ') || '—'}
                      {r.addressPhone && (
                        <div style={{ color: 'var(--text-muted)' }}>{r.addressPhone}</div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {r.windowStart && r.windowEnd
                        ? `${r.windowStart.slice(0, 5)}–${r.windowEnd.slice(0, 5)}`
                        : '—'}
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      {r.lines.map((l) => `${l.quantity}× ${l.description}`).join(', ')}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {r.balanceDueCents > 0 ? <Money cents={r.balanceDueCents} /> : '—'}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DispatchPage() {
  return (
    <Suspense fallback={<LoadingRows rows={5} />}>
      <DispatchInner />
    </Suspense>
  );
}
