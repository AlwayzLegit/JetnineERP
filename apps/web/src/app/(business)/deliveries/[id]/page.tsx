'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, Card, LinkButton, LoadingRows, StatusBadge } from '@/components/ui';

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

  if (error && !d) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!d) return <LoadingRows rows={4} />;

  const live = !['delivered', 'failed', 'cancelled'].includes(d.status);

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Delivery — {d.orderNumber}
        </h1>
        <span data-testid="delivery-status" style={{ display: 'inline-flex' }}>
          <StatusBadge status={d.status} />
        </span>
        <LinkButton href="/deliveries" variant="ghost" size="sm" style={{ marginLeft: 'auto' }}>
          ← Calendar
        </LinkButton>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
        {d.scheduledDate}
        {d.windowStart ? ` · ${d.windowStart.slice(0, 5)}–${d.windowEnd?.slice(0, 5) ?? ''}` : ''}
        {' · '}
        <Link href={`/orders/${d.orderId}`}>open the order</Link>
      </p>

      <Card title="Drop-off" style={{ marginBottom: 16 }}>
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
          <p style={{ fontSize: 13, color: 'var(--warning)', marginBottom: 0 }}>
            Collect on delivery: <Money cents={d.balanceDueCents} /> (record it on the order page)
          </p>
        )}
      </Card>

      <Card title="On the truck" style={{ marginBottom: 16 }}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
          {d.lines.map((l) => (
            <li key={l.id}>
              {l.quantity} × {l.description}
              {l.lineType === 'special_order' && (
                <span style={{ color: 'var(--warning)' }}> (special order)</span>
              )}
            </li>
          ))}
        </ul>
        {d.notes && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 0 }}>{d.notes}</p>
        )}
      </Card>

      {live && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
          {error && <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>{error}</p>}
          {d.status === 'scheduled' && (
            <Button onClick={() => void act('/status', { status: 'loaded' })} disabled={busy}>
              Mark loaded
            </Button>
          )}
          {(d.status === 'scheduled' || d.status === 'loaded') && (
            <Button
              onClick={() => void act('/status', { status: 'out_for_delivery' })}
              disabled={busy}
            >
              Out for delivery
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => void act('/complete', {})}
            disabled={busy}
            style={{ padding: '10px 14px' }}
            data-testid="mark-delivered"
          >
            Delivered — hand over the goods
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              const notes = prompt('What happened? (optional)');
              if (notes === null) return;
              void act('/complete', { failed: true, notes: notes || null });
            }}
            disabled={busy}
          >
            Failed — bring it back
          </Button>
          {(d.status === 'scheduled' || d.status === 'loaded') && (
            <Button
              variant="ghost"
              onClick={async () => {
                await act('/cancel');
                router.push('/deliveries');
              }}
              disabled={busy}
            >
              Cancel this delivery
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
