'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatMoney } from '@jetnine/shared';
import { apiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface PublicOrder {
  businessName: string;
  accentColor: string | null;
  number: string;
  status: string;
  customerFirstName: string | null;
  fulfillmentType: string;
  requestedDate: string | null;
  scheduledDate: string | null;
  lines: { description: string; quantity: number }[];
  totalCents: number;
  paidCents: number;
  balanceCents: number;
}

/**
 * The page a customer opens from a texted/emailed link. No sign-in, no
 * app shell — just their order. Statuses collapse to a customer-sized
 * journey: received → getting ready → scheduled → done.
 */
const JOURNEY: { key: string; label: string; matches: string[] }[] = [
  { key: 'received', label: 'Order received', matches: ['quote', 'open'] },
  { key: 'preparing', label: 'Getting it ready', matches: ['partially_fulfilled'] },
  { key: 'ready', label: 'Ready / scheduled', matches: ['fulfilled'] },
  { key: 'done', label: 'Delivered', matches: ['completed'] },
];

export default function TrackOrderPage() {
  const params = useParams<{ token: string }>();
  const token = (params?.token ?? '') as string;
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`${apiUrl}/v1/public/orders/${encodeURIComponent(token)}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setOrder((await res.json()) as PublicOrder);
      } catch {
        setNotFound(true);
      }
    })();
  }, [token]);

  const accent = order?.accentColor ?? 'var(--brand)';
  const cancelled = order?.status === 'cancelled';
  const statusStage = order
    ? Math.max(
        0,
        JOURNEY.findIndex((s) => s.matches.includes(order.status)),
      )
    : 0;
  // A booked delivery/pickup advances the journey to "Ready / scheduled"
  // even while the order status itself is still open — the customer
  // cares that a date exists, not about internal fulfillment states.
  const stageIndex =
    order && order.scheduledDate && !cancelled ? Math.max(statusStage, 2) : statusStage;

  if (notFound) {
    return (
      <Wrapper>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>We couldn&apos;t find that order</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            The link may have been mistyped. Check the link you were sent, or contact the store.
          </p>
        </div>
      </Wrapper>
    );
  }

  if (!order) {
    return (
      <Wrapper>
        <div className="card">
          <div className="skeleton" style={{ height: 24, width: 180, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 60 }} />
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="card" style={{ borderTop: `4px solid ${accent}`, padding: 24 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          {order.businessName}
        </p>
        <h1 style={{ fontSize: 22, margin: '4px 0 2px' }} data-testid="track-heading">
          {order.customerFirstName ? `${order.customerFirstName}, your` : 'Your'} order{' '}
          <code style={{ fontSize: 16 }}>{order.number}</code>
        </h1>

        {cancelled ? (
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>
            This order was cancelled. Contact the store if that&apos;s unexpected.
          </p>
        ) : (
          <ol
            style={{
              listStyle: 'none',
              display: 'grid',
              gap: 0,
              margin: '18px 0 6px',
              padding: 0,
            }}
          >
            {JOURNEY.map((s, i) => {
              const reached = i <= stageIndex;
              const current = i === stageIndex;
              return (
                <li key={s.key} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span
                      aria-hidden
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `3px solid ${reached ? accent : 'var(--border-strong)'}`,
                        background: reached ? accent : 'var(--surface)',
                      }}
                    />
                    {i < JOURNEY.length - 1 && (
                      <span
                        aria-hidden
                        style={{
                          width: 3,
                          flex: 1,
                          minHeight: 22,
                          background: i < stageIndex ? accent : 'var(--border)',
                        }}
                      />
                    )}
                  </span>
                  <span style={{ paddingBottom: 14 }}>
                    <span
                      style={{
                        fontWeight: current ? 700 : 500,
                        color: reached ? 'var(--text)' : 'var(--text-muted)',
                        fontSize: 14.5,
                      }}
                    >
                      {s.label}
                    </span>
                    {current && s.key === 'ready' && order.scheduledDate && (
                      <span
                        style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)' }}
                      >
                        {order.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'} scheduled for{' '}
                        <strong>{formatDate(order.scheduledDate)}</strong>
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <h2 style={sub}>Items</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <tbody>
            {order.lines.map((l, i) => (
              <tr key={i}>
                <td style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  {l.description}
                </td>
                <td
                  style={{
                    padding: '5px 0',
                    borderBottom: '1px solid var(--border)',
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                  }}
                >
                  ×{l.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={sub}>Balance</h2>
        <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
          <span>
            Total <strong>{formatMoney(order.totalCents)}</strong>
          </span>
          <span>
            Paid <strong>{formatMoney(order.paidCents)}</strong>
          </span>
          <span>
            {order.balanceCents > 0 ? (
              <>
                Remaining{' '}
                <strong style={{ color: 'var(--warning)' }} data-testid="track-balance">
                  {formatMoney(order.balanceCents)}
                </strong>
              </>
            ) : (
              <strong style={{ color: 'var(--success)' }} data-testid="track-balance">
                Paid in full
              </strong>
            )}
          </span>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 20, marginBottom: 0 }}>
          Questions about this order? Contact {order.businessName} — have your order number ready.
        </p>
      </div>
    </Wrapper>
  );
}

const sub: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  margin: '18px 0 8px',
};

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-[560px] px-4 py-10 sm:py-16">{children}</main>;
}
