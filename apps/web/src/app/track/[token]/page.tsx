'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatMoney } from '@jetnine/shared';
import {
  Alert,
  Card,
  PageHeader,
  SectionHeading,
  Skeleton,
  Stack,
  StatGrid,
  StatTile,
  TableWrap,
} from '@/components/ui';
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
        <PageHeader title="We couldn't find that order" />
        <Alert tone="error">
          The link may have been mistyped. Check the link you were sent, or contact the store.
        </Alert>
      </Wrapper>
    );
  }

  if (!order) {
    return (
      <Wrapper>
        <Card aria-busy>
          <Stack gap="sm">
            <Skeleton style={{ height: 24, width: 180 }} />
            <Skeleton style={{ height: 60 }} />
          </Stack>
        </Card>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {/* The accent is the store's own brand colour — a data-driven value. */}
      <Card style={{ borderTop: `4px solid ${accent}` }}>
        <PageHeader
          eyebrow={<span className="muted font-semibold uppercase">{order.businessName}</span>}
          title={
            <span data-testid="track-heading">
              {order.customerFirstName ? `${order.customerFirstName}, your` : 'Your'} order{' '}
              <code>{order.number}</code>
            </span>
          }
        />
        <Stack>
          {cancelled ? (
            <Alert tone="error">
              This order was cancelled. Contact the store if that&apos;s unexpected.
            </Alert>
          ) : (
            <ol className="m-0 grid list-none p-0" aria-label="Order progress">
              {JOURNEY.map((s, i) => {
                const reached = i <= stageIndex;
                const current = i === stageIndex;
                return (
                  <li
                    key={s.key}
                    className="flex gap-3"
                    aria-current={current ? 'step' : undefined}
                  >
                    <span className="flex flex-col items-center">
                      <span
                        aria-hidden
                        className="h-4 w-4 shrink-0 rounded-full"
                        style={{
                          border: `3px solid ${reached ? accent : 'var(--border-strong)'}`,
                          background: reached ? accent : 'var(--surface)',
                        }}
                      />
                      {i < JOURNEY.length - 1 && (
                        <span
                          aria-hidden
                          className="w-[3px] flex-1"
                          style={{
                            minHeight: 22,
                            background: i < stageIndex ? accent : 'var(--border)',
                          }}
                        />
                      )}
                    </span>
                    <span className="pb-3.5">
                      <span
                        className={
                          reached ? (current ? 'font-bold' : 'font-medium') : 'muted font-medium'
                        }
                      >
                        {s.label}
                      </span>
                      {current && s.key === 'ready' && order.scheduledDate && (
                        <span className="muted block">
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

          <div>
            <SectionHeading title="Items" />
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.description}</td>
                      <td className="num">×{l.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>

          <div>
            <SectionHeading title="Balance" />
            <StatGrid cols={3}>
              <StatTile label="Total" value={formatMoney(order.totalCents)} />
              <StatTile label="Paid" value={formatMoney(order.paidCents)} />
              {order.balanceCents > 0 ? (
                <StatTile
                  label="Remaining"
                  tone="warning"
                  value={<span data-testid="track-balance">{formatMoney(order.balanceCents)}</span>}
                />
              ) : (
                <StatTile
                  label="Balance"
                  tone="success"
                  value={<span data-testid="track-balance">Paid in full</span>}
                />
              )}
            </StatGrid>
          </div>

          <p className="muted m-0">
            Questions about this order? Contact {order.businessName} — have your order number ready.
          </p>
        </Stack>
      </Card>
    </Wrapper>
  );
}

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
