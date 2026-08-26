'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { SecurityOverrideDialog } from '@/components/security-override-dialog';
import { Money } from '@/components/money';
import { toast } from 'sonner';
import {
  Button,
  Input,
  LinkButton,
  LoadingRows,
  EmptyState,
  PageHeader,
  Select,
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
  runId: string | null;
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

interface Run {
  id: string;
  runDate: string;
  route: string | null;
  truck: string | null;
  status: string;
  codDueCents: number;
  codCollectedCents: number | null;
  stops: DeliveryDetail[];
}

interface ReasonCode {
  id: string;
  code: string;
  description: string;
}

/**
 * G7 close-out: the mandatory reconciliation. Every open stop gets an
 * outcome; failed stops take a coded reason and an optional reschedule;
 * COD due vs collected is compared server-side and variances land in
 * the exception register.
 */
function RunCard({
  run,
  failureCodes,
  onChanged,
}: {
  run: Run;
  failureCodes: ReasonCode[];
  onChanged: () => Promise<void> | void;
}) {
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcomes, setOutcomes] = useState<
    Record<
      string,
      {
        outcome: 'delivered' | 'failed';
        reasonCodeId?: string;
        reason?: string;
        rescheduleDate?: string;
      }
    >
  >({});
  const [codCollected, setCodCollected] = useState('');
  const [codReceivedBy, setCodReceivedBy] = useState('');

  const openStops = run.stops.filter(
    (s) => !['delivered', 'failed', 'cancelled'].includes(s.status),
  );

  async function act(path: string, body?: unknown) {
    setBusy(true);
    try {
      await api(`/v1/delivery-runs/${run.id}${path}`, {
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // Pulling a stop off a run is a manifest-removal exception in STORIS
  // terms — it needs a CODED reason and can need a manager. A native
  // window.prompt could carry neither (and froze the QA browser), so it
  // goes through the same dialog every other gated action uses.
  const [removingStopId, setRemovingStopId] = useState<string | null>(null);

  async function submitClose() {
    const missing = openStops.filter((s) => !outcomes[s.id]?.outcome);
    if (missing.length > 0) {
      toast.error('Every stop needs an outcome before close-out.');
      return;
    }
    await act('/close', {
      outcomes: openStops.map((s) => ({ deliveryId: s.id, ...outcomes[s.id] })),
      codCollectedCents: Math.round(Number(codCollected || '0') * 100),
      codReceivedBy: codReceivedBy.trim() || null,
    });
    setClosing(false);
  }

  return (
    <div className="card" style={{ marginBottom: 12, padding: 14 }} data-testid="run-card">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <strong>
          Run {run.route ?? '—'} {run.truck ? `· ${run.truck}` : ''}
        </strong>
        <StatusBadge status={run.status} />
        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
          {run.stops.length} stop(s) · COD due <Money cents={run.codDueCents} />
          {run.codCollectedCents != null && (
            <>
              {' '}
              · collected <Money cents={run.codCollectedCents} />
            </>
          )}
        </span>
        <span style={{ flex: 1 }} />
        <LinkButton
          href={`/print/delivery-runs/${run.id}`}
          variant="secondary"
          size="sm"
          target="_blank"
        >
          <Printer size={13} aria-hidden /> Manifest
        </LinkButton>
        {run.status === 'open' && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act('/depart')}>
            Depart
          </Button>
        )}
        {run.status !== 'completed' && (
          <Button
            size="sm"
            variant="primary"
            disabled={busy}
            data-testid="run-close-toggle"
            onClick={() => setClosing((c) => !c)}
          >
            {closing ? 'Hide close-out' : 'Close out…'}
          </Button>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 12.5 }}>
        {run.stops.map((s, i) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
              padding: '4px 0',
            }}
          >
            <span style={{ width: 24, fontWeight: 600 }}>{s.routePosition ?? i + 1}</span>
            <span>
              {s.orderNumber} · {s.customerName ?? '—'}
            </span>
            <StatusBadge status={s.status} />
            {s.balanceDueCents > 0 && (
              <span style={{ color: 'var(--warning)' }}>
                collect <Money cents={s.balanceDueCents} />
              </span>
            )}
            {closing && !['delivered', 'failed', 'cancelled'].includes(s.status) && (
              <>
                <Select
                  value={outcomes[s.id]?.outcome ?? ''}
                  data-testid="stop-outcome"
                  onChange={(e) =>
                    setOutcomes((prev) => ({
                      ...prev,
                      [s.id]: {
                        ...prev[s.id],
                        outcome: e.target.value as 'delivered' | 'failed',
                      },
                    }))
                  }
                  style={{ width: 120, padding: '3px 6px' }}
                >
                  <option value="">Outcome…</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </Select>
                {outcomes[s.id]?.outcome === 'failed' && (
                  <>
                    {failureCodes.length > 0 ? (
                      <Select
                        value={outcomes[s.id]?.reasonCodeId ?? ''}
                        onChange={(e) =>
                          setOutcomes((prev) => ({
                            ...prev,
                            [s.id]: { ...prev[s.id]!, reasonCodeId: e.target.value },
                          }))
                        }
                        style={{ width: 150, padding: '3px 6px' }}
                      >
                        <option value="">Why…</option>
                        {failureCodes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} — {c.description}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        placeholder="Why?"
                        value={outcomes[s.id]?.reason ?? ''}
                        onChange={(e) =>
                          setOutcomes((prev) => ({
                            ...prev,
                            [s.id]: { ...prev[s.id]!, reason: e.target.value },
                          }))
                        }
                        style={{ width: 140, padding: '3px 6px' }}
                      />
                    )}
                    <Input
                      type="date"
                      title="Reschedule to"
                      value={outcomes[s.id]?.rescheduleDate ?? ''}
                      onChange={(e) =>
                        setOutcomes((prev) => ({
                          ...prev,
                          [s.id]: { ...prev[s.id]!, rescheduleDate: e.target.value },
                        }))
                      }
                      style={{ width: 140, padding: '3px 6px' }}
                    />
                  </>
                )}
              </>
            )}
            {run.status !== 'completed' &&
              !closing &&
              !['delivered', 'failed', 'cancelled'].includes(s.status) && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  data-testid="pull-off-run"
                  onClick={() => setRemovingStopId(s.id)}
                >
                  Pull off run
                </Button>
              )}
          </div>
        ))}
      </div>

      <SecurityOverrideDialog
        open={removingStopId != null}
        title="Pull this stop off the run"
        usageClass="manifest_removal"
        submitLabel="Pull off run"
        perform={async (payload) => {
          await api(`/v1/delivery-runs/${run.id}/remove-delivery`, {
            method: 'POST',
            body: JSON.stringify({ deliveryId: removingStopId, ...payload }),
          });
        }}
        onClose={() => setRemovingStopId(null)}
        onSuccess={() => void onChanged()}
      />

      {closing && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'end',
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
            fontSize: 12.5,
          }}
        >
          <label style={{ display: 'grid', gap: 2 }}>
            COD collected ($)
            <Input
              type="number"
              step="0.01"
              min={0}
              value={codCollected}
              data-testid="cod-collected"
              onChange={(e) => setCodCollected(e.target.value)}
              style={{ width: 120 }}
            />
          </label>
          <label style={{ display: 'grid', gap: 2, flex: 1, minWidth: 140 }}>
            Cash handed to
            <Input
              value={codReceivedBy}
              onChange={(e) => setCodReceivedBy(e.target.value)}
              style={{ minWidth: 0 }}
            />
          </label>
          <Button
            variant="primary"
            disabled={busy}
            data-testid="run-close-submit"
            onClick={() => void submitClose()}
          >
            Complete run
          </Button>
        </div>
      )}
    </div>
  );
}

function DispatchInner() {
  const search = useSearchParams();
  const [date, setDate] = useState(
    () => search?.get('date') ?? new Date().toISOString().slice(0, 10),
  );
  const [rows, setRows] = useState<DeliveryDetail[] | null>(null);
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [failureCodes, setFailureCodes] = useState<ReasonCode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ReasonCode[]>('/v1/reason-codes?usageClass=delivery_failure')
      .then(setFailureCodes)
      .catch(() => setFailureCodes([]));
  }, []);

  const load = useCallback(async (d: string) => {
    try {
      const [trips, cap, dayRuns] = await Promise.all([
        api<DeliveryDetail[]>(`/v1/deliveries?from=${d}&to=${d}`),
        api<Capacity>(`/v1/deliveries/capacity?from=${d}&to=${d}`),
        api<Run[]>(`/v1/delivery-runs?date=${d}`).catch(() => [] as Run[]),
      ]);
      trips.sort(
        (a, b) =>
          (a.route ?? '￿').localeCompare(b.route ?? '￿') ||
          (a.routePosition ?? 999) - (b.routePosition ?? 999),
      );
      setRows(trips);
      setCapacity(cap);
      setRuns(dayRuns);
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
  const unassigned = (rows ?? []).filter(
    (r) => !r.runId && (r.status === 'scheduled' || r.status === 'loaded'),
  );

  async function createRun() {
    try {
      await api('/v1/delivery-runs', {
        method: 'POST',
        body: JSON.stringify({ runDate: date, deliveryIds: unassigned.map((r) => r.id) }),
      });
      await load(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

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
      {rows && rows.length === 0 && runs.length === 0 && (
        <EmptyState>No deliveries scheduled for {date}.</EmptyState>
      )}

      {runs.map((run) => (
        <RunCard key={run.id} run={run} failureCodes={failureCodes} onChanged={() => load(date)} />
      ))}
      {unassigned.length > 0 && (
        <div style={{ margin: '0 0 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            size="sm"
            variant="secondary"
            data-testid="create-run"
            onClick={() => void createRun()}
          >
            Build run from {unassigned.length} unassigned stop(s)
          </Button>
          <span className="muted" style={{ fontSize: 12 }}>
            Building the run hard-locks the orders until close-out.
          </span>
        </div>
      )}

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
