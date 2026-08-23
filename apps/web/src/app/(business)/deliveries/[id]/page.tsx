'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

/**
 * One truck stop (Day 3). The driver-facing verbs live here: loaded,
 * out for delivery, delivered (which moves the stock and advances the
 * order), failed. Collecting the balance happens on the order page —
 * money and trucks stay separate concerns.
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
  notes: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressRegion: string | null;
  addressPostalCode: string | null;
  addressPhone: string | null;
  balanceDueCents: number;
  lines: { id: string; description: string; quantity: number; lineType: string }[];
}

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const router = useRouter();
  const [d, setD] = useState<DeliveryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setD(await api<DeliveryDetail>(`/v1/deliveries/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/deliveries/${id}${path}`, {
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !d) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!d) return <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>;

  const live = !['delivered', 'failed', 'cancelled'].includes(d.status);

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Delivery — {d.orderNumber}</h1>
        <span
          data-testid="delivery-status"
          style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#555' }}
        >
          {d.status.replace(/_/g, ' ')}
        </span>
        <Link href="/deliveries" style={{ marginLeft: 'auto', fontSize: 13, color: '#06c' }}>
          ← Calendar
        </Link>
      </div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
        {d.scheduledDate}
        {d.windowStart ? ` · ${d.windowStart.slice(0, 5)}–${d.windowEnd?.slice(0, 5) ?? ''}` : ''}
        {' · '}
        <Link href={`/orders/${d.orderId}`} style={{ color: '#06c' }}>
          open the order
        </Link>
      </p>

      <div style={card}>
        <h3 style={section}>Drop-off</h3>
        <p style={{ fontSize: 13, margin: 0 }}>
          <strong>{d.customerName ?? '—'}</strong>
          {d.addressLine1 && (
            <>
              <br />
              {d.addressLine1}
              {d.addressLine2 ? `, ${d.addressLine2}` : ''}
              <br />
              {[d.addressCity, d.addressRegion, d.addressPostalCode].filter(Boolean).join(', ')}
            </>
          )}
          {d.addressPhone && (
            <>
              <br />
              {d.addressPhone}
            </>
          )}
        </p>
        {d.balanceDueCents > 0 && (
          <p style={{ fontSize: 13, color: '#8a6d1a', marginBottom: 0 }}>
            Collect on delivery: <Money cents={d.balanceDueCents} /> (record it on the order page)
          </p>
        )}
      </div>

      <div style={card}>
        <h3 style={section}>On the truck</h3>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
          {d.lines.map((l) => (
            <li key={l.id}>
              {l.quantity} × {l.description}
              {l.lineType === 'special_order' && (
                <span style={{ color: '#8a6d1a' }}> (special order)</span>
              )}
            </li>
          ))}
        </ul>
        {d.notes && <p style={{ fontSize: 12, color: '#666', marginBottom: 0 }}>{d.notes}</p>}
      </div>

      {live && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
          {error && <p style={{ color: '#b00', margin: 0, fontSize: 13 }}>{error}</p>}
          {d.status === 'scheduled' && (
            <button
              onClick={() => void act('/status', { status: 'loaded' })}
              disabled={busy}
              style={linkBtn}
            >
              Mark loaded
            </button>
          )}
          {(d.status === 'scheduled' || d.status === 'loaded') && (
            <button
              onClick={() => void act('/status', { status: 'out_for_delivery' })}
              disabled={busy}
              style={linkBtn}
            >
              Out for delivery
            </button>
          )}
          <button
            onClick={() => void act('/complete', {})}
            disabled={busy}
            style={primaryBtn}
            data-testid="mark-delivered"
          >
            Delivered — hand over the goods
          </button>
          <button
            onClick={() => {
              const notes = prompt('What happened? (optional)');
              if (notes === null) return;
              void act('/complete', { failed: true, notes: notes || null });
            }}
            disabled={busy}
            style={{ ...linkBtn, color: '#8c2f2f', borderColor: '#d9b1ab' }}
          >
            Failed — bring it back
          </button>
          {(d.status === 'scheduled' || d.status === 'loaded') && (
            <button
              onClick={async () => {
                await act('/cancel');
                router.push('/deliveries');
              }}
              disabled={busy}
              style={linkBtn}
            >
              Cancel this delivery
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
const section = { fontSize: 14, marginBottom: 8, marginTop: 0 } as const;
const primaryBtn = {
  padding: '10px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const linkBtn = {
  padding: '8px 14px',
  background: 'transparent',
  color: '#444',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
