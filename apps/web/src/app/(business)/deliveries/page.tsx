'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

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
  scheduled: '#1a5f8a',
  loaded: '#6a4b8a',
  out_for_delivery: '#8a6d1a',
  delivered: '#2c7a4b',
  failed: '#8c2f2f',
  cancelled: '#999',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Deliveries</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => shiftWeek(-7)} style={navBtn}>
            ← Prev
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date()))} style={navBtn}>
            This week
          </button>
          <button onClick={() => shiftWeek(7)} style={navBtn}>
            Next →
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>
        Drag a card to another day to reschedule. Schedule new deliveries from an order&apos;s page.
        Click a day&apos;s heading for its printable day-sheet.
      </p>
      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}

      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 980 }}>
          {days.map((d) => {
            const key = fmtDate(d);
            const list = byDay.get(key) ?? [];
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
                  background: key === today ? '#eef4fa' : '#f4f4f4',
                  borderRadius: 6,
                  padding: 8,
                  minHeight: 220,
                }}
              >
                <Link
                  href={`/deliveries/day/${key}`}
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '2px solid #111',
                    paddingBottom: 4,
                    marginBottom: 8,
                  }}
                >
                  {d.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  <span style={{ float: 'right', color: '#666' }}>{list.length || ''}</span>
                </Link>
                {list.map((r) => (
                  <Link
                    key={r.id}
                    href={`/deliveries/${r.id}`}
                    draggable={r.status === 'scheduled' || r.status === 'loaded'}
                    onDragStart={() => setDragId(r.id)}
                    data-testid="delivery-card"
                    style={{
                      display: 'block',
                      background: '#fff',
                      borderLeft: `4px solid ${STATUS_COLOR[r.status] ?? '#666'}`,
                      borderRadius: 4,
                      padding: '6px 8px',
                      marginBottom: 6,
                      textDecoration: 'none',
                      color: 'inherit',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{r.orderNumber}</div>
                    <div style={{ color: '#666' }}>{r.customerName ?? '—'}</div>
                    {(r.windowStart || r.windowEnd) && (
                      <div style={{ color: '#666' }}>
                        {r.windowStart?.slice(0, 5)}–{r.windowEnd?.slice(0, 5)}
                      </div>
                    )}
                    <div style={{ marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: STATUS_COLOR[r.status] ?? '#666',
                          fontWeight: 700,
                        }}
                      >
                        {r.status.replace(/_/g, ' ')}
                      </span>
                      {r.balanceDueCents > 0 && (
                        <span style={{ float: 'right', color: '#8a6d1a' }}>
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

const navBtn = {
  padding: '6px 12px',
  background: 'transparent',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
