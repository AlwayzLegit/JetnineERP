'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, PageHeader } from '@/components/ui';

/**
 * Delivery calendar (STORIS cutover Day 3). Week view by default, one
 * column per day; a card is one truck stop. Click through for the
 * day-sheet (print) or the delivery itself. Drag a card onto another day
 * to reschedule it.
 */

interface DeliveryRow {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  scheduledDate: string;
  windowStart: string | null;
  windowEnd: string | null;
  status: string;
  routePosition: number | null;
  addressLine1: string | null;
  addressCity: string | null;
  balanceDueCents: number;
  fulfillmentType: string;
  lines: { id: string; description: string; quantity: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'var(--info)',
  loaded: 'var(--brand)',
  out_for_delivery: 'var(--warning)',
  delivered: 'var(--success)',
  failed: 'var(--danger)',
  cancelled: 'var(--text-muted)',
};

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setDate(out.getDate() - out.getDay()); // Sunday start
  out.setHours(0, 0, 0, 0);
  return out;
}
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function DeliveriesPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  async function load() {
    try {
      const from = fmtDate(days[0]!);
      const to = fmtDate(days[6]!);
      setRows(await api<DeliveryRow[]>(`/v1/deliveries?from=${from}&to=${to}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const byDay = useMemo(() => {
    const map = new Map<string, DeliveryRow[]>();
    for (const d of days) map.set(fmtDate(d), []);
    for (const r of rows) map.get(r.scheduledDate)?.push(r);
    return map;
  }, [rows, days]);

  async function reschedule(id: string, date: string) {
    try {
      await api(`/v1/deliveries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ scheduledDate: date }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function shiftWeek(deltaDays: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + deltaDays);
    setWeekStart(next);
  }

  const today = fmtDate(new Date());

  return (
    <div>
      <PageHeader
        title="Deliveries"
        sub={
          <>
            Drag a card to another day to reschedule. Schedule new deliveries from an order&apos;s
            page. Click a day&apos;s heading for its printable day-sheet.
          </>
        }
        actions={
          <>
            <Button size="sm" onClick={() => shiftWeek(-7)}>
              ← Prev
            </Button>
            <Button size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              This week
            </Button>
            <Button size="sm" onClick={() => shiftWeek(7)}>
              Next →
            </Button>
          </>
        }
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 980 }}>
          {days.map((d) => {
            const key = fmtDate(d);
            const list = byDay.get(key) ?? [];
            const isToday = key === today;
            return (
              <div
                key={key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) void reschedule(dragId, key);
                  setDragId(null);
                }}
                style={{
                  flex: 1,
                  minWidth: 132,
                  background: isToday ? 'var(--brand-soft)' : 'var(--neutral-soft)',
                  borderRadius: 'var(--radius)',
                  padding: 8,
                  minHeight: 220,
                }}
              >
                <Link
                  href={`/deliveries/day/${key}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isToday ? 'var(--brand-soft-text)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    padding: '2px 4px 8px',
                    marginBottom: 4,
                  }}
                >
                  {d.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  <span style={{ color: 'var(--text-muted)' }}>{list.length || ''}</span>
                </Link>
                {list.map((r) => (
                  <Link
                    key={r.id}
                    href={`/deliveries/${r.id}`}
                    draggable={r.status === 'scheduled' || r.status === 'loaded'}
                    onDragStart={() => setDragId(r.id)}
                    data-testid="delivery-card"
                    className="card"
                    style={{
                      display: 'block',
                      borderLeft: `4px solid ${STATUS_COLOR[r.status] ?? 'var(--text-muted)'}`,
                      padding: '8px 10px',
                      margin: '0 0 6px',
                      textDecoration: 'none',
                      color: 'inherit',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{r.orderNumber}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{r.customerName ?? '—'}</div>
                    {(r.windowStart || r.windowEnd) && (
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {r.windowStart?.slice(0, 5)}–{r.windowEnd?.slice(0, 5)}
                      </div>
                    )}
                    <div style={{ marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: STATUS_COLOR[r.status] ?? 'var(--text-muted)',
                          fontWeight: 700,
                        }}
                      >
                        {r.status.replace(/_/g, ' ')}
                      </span>
                      {r.balanceDueCents > 0 && (
                        <span style={{ float: 'right', color: 'var(--warning)' }}>
                          <Money cents={r.balanceDueCents} /> due
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
