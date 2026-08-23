'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatMoney } from '@jetnine/shared';

/**
 * Driver day-sheet (Day 3): one printable page for one day's route —
 * stop order, address, phone, what's on the truck, and what to collect.
 * The print stylesheet strips the chrome; this page is built to be
 * handed to a driver on paper.
 */

interface DeliveryRow {
  id: string;
  orderNumber: string;
  customerName: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  status: string;
  routePosition: number | null;
  notes: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressRegion: string | null;
  addressPostalCode: string | null;
  addressPhone: string | null;
  balanceDueCents: number;
  lines: { id: string; description: string; quantity: number }[];
}

export default function DaySheetPage() {
  const params = useParams<{ date: string }>();
  const date = (params?.date ?? '') as string;
  const [rows, setRows] = useState<DeliveryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    void (async () => {
      try {
        const all = await import('@/lib/api').then(({ api }) =>
          api<DeliveryRow[]>(`/v1/deliveries?from=${date}&to=${date}`),
        );
        setRows(all.filter((r) => r.status !== 'cancelled'));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [date]);

  return (
    <div style={{ maxWidth: 720 }}>
      <style>{`@media print { header, nav, .no-print { display: none !important; } body { background: #fff !important; } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Day sheet — {date}</h1>
        <div className="no-print" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '8px 14px',
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Print
          </button>
          <Link href="/deliveries" style={{ fontSize: 13, color: '#06c', alignSelf: 'center' }}>
            ← Calendar
          </Link>
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#666', margin: '0 0 16px' }}>
        {rows ? `${rows.length} stop${rows.length === 1 ? '' : 's'}` : '…'} · collect amounts are
        cash/check on delivery; record them on the order when back.
      </p>
      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}

      {rows?.map((r, i) => (
        <div
          key={r.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: '12px 16px',
            marginBottom: 10,
            pageBreakInside: 'avoid',
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <strong style={{ fontSize: 16 }}>#{r.routePosition ?? i + 1}</strong>
            <strong>{r.orderNumber}</strong>
            <span style={{ color: '#666', fontSize: 13 }}>{r.customerName ?? ''}</span>
            {(r.windowStart || r.windowEnd) && (
              <span style={{ marginLeft: 'auto', fontSize: 13 }}>
                {r.windowStart?.slice(0, 5)}–{r.windowEnd?.slice(0, 5)}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, margin: '6px 0', color: '#333' }}>
            {r.addressLine1}
            {r.addressLine2 ? `, ${r.addressLine2}` : ''}
            {r.addressCity
              ? ` — ${[r.addressCity, r.addressRegion, r.addressPostalCode].filter(Boolean).join(', ')}`
              : ''}
            {r.addressPhone ? ` · ☎ ${r.addressPhone}` : ''}
          </div>
          <ul style={{ margin: '4px 0', paddingLeft: 18, fontSize: 13 }}>
            {r.lines.map((l) => (
              <li key={l.id}>
                {l.quantity} × {l.description}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', fontSize: 13 }}>
            {r.balanceDueCents > 0 ? (
              <strong>COLLECT {formatMoney(r.balanceDueCents)}</strong>
            ) : (
              <span style={{ color: '#2c7a4b' }}>Paid in full</span>
            )}
            <span style={{ marginLeft: 'auto', color: '#666' }}>
              Signature: ______________________
            </span>
          </div>
          {r.notes && <p style={{ fontSize: 12, color: '#666', margin: '6px 0 0' }}>{r.notes}</p>}
        </div>
      ))}
      {rows && rows.length === 0 && (
        <p style={{ color: '#888', fontSize: 13 }}>No deliveries scheduled for this day.</p>
      )}
    </div>
  );
}
