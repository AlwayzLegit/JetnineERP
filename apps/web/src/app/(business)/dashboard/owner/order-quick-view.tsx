'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatMoney } from '@jetnine/shared';
import { useDashboardFilters } from '@/lib/dashboard-filters';
import { ShimmerRows, StatusPill, orderStatusMeta, shortDay, usdWhole } from './owner-kit';

/**
 * The order quick-view modal from the design: header with number and
 * status, customer / fulfillment / balance, the lines, a payment
 * timeline, and actions that hand off to the full order page.
 */
interface OrderDetail {
  id: string;
  number: string;
  status: string;
  locationId: string;
  fulfillmentType: string;
  requestedDate: string | null;
  totalCents: number;
  balanceDueCents: number;
  paidCents: number;
  createdAt: string;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  lines: {
    id: string;
    description: string;
    quantity: number;
    totalCents: number;
    lineType: string;
  }[];
  payments: {
    id: string;
    kind: string;
    method: string;
    amountCents: number;
    status: string;
    createdAt?: string;
  }[];
}

export function OrderQuickView({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const router = useRouter();
  const f = useDashboardFilters();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setOrder(null);
    setFailed(false);
    void api<OrderDetail>(`/v1/orders/${orderId}`)
      .then(setOrder)
      .catch(() => setFailed(true));
  }, [orderId]);

  const store = order ? (f.stores.find((s) => s.id === order.locationId)?.name ?? null) : null;
  const meta = order ? orderStatusMeta(order.status) : null;
  const late =
    !!order &&
    order.status === 'open' &&
    !!order.requestedDate &&
    order.requestedDate < new Date().toISOString().slice(0, 10);
  const open = () => {
    onClose();
    router.push(`/orders/${orderId}`);
  };

  return (
    <div className="overlay overlay-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label={order ? `Order ${order.number}` : 'Order'}
        className="dialog"
        style={{ width: 720 }}
        onClick={(e) => e.stopPropagation()}
        data-testid="order-quick-view"
      >
        <div className="dialog-head">
          <span className="mono" style={{ fontSize: 15, fontWeight: 600 }}>
            {order?.number ?? '…'}
          </span>
          {meta && <StatusPill tone={meta.tone}>{meta.label}</StatusPill>}
          {order && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {store ? `${store} · ` : ''}written {shortDay(order.createdAt.slice(0, 10))}
            </span>
          )}
          <button
            type="button"
            className="icon-btn"
            style={{ marginLeft: 'auto' }}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {failed && (
          <div className="dialog-body" style={{ color: 'var(--danger)' }}>
            This order could not be loaded.
          </div>
        )}
        {!order && !failed && <ShimmerRows rows={5} />}
        {order && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ padding: '12px 18px', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Customer</div>
                <div style={{ fontWeight: 500, marginTop: 2 }}>{order.customer?.name ?? '—'}</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {order.customer?.phone ?? order.customer?.email ?? ''}
                </div>
              </div>
              <div style={{ padding: '12px 18px', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Fulfillment</div>
                <div style={{ fontWeight: 500, marginTop: 2, textTransform: 'capitalize' }}>
                  {order.fulfillmentType.replace(/_/g, ' ')}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 12, color: late ? 'var(--danger)' : 'var(--muted)' }}
                >
                  {order.requestedDate
                    ? `promised ${shortDay(order.requestedDate)}`
                    : 'no date yet'}
                </div>
              </div>
              <div style={{ padding: '12px 18px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Balance due</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    marginTop: 2,
                    color: order.balanceDueCents > 0 ? 'var(--text)' : 'var(--faint)',
                  }}
                >
                  {order.balanceDueCents > 0 ? usdWhole(order.balanceDueCents) : '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  of {usdWhole(order.totalCents)} total
                </div>
              </div>
            </div>
            <div className="dialog-body">
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Lines
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <tbody>
                  {order.lines.map((l) => (
                    <tr key={l.id}>
                      <td style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        {l.description}
                      </td>
                      <td
                        className="mono"
                        style={{
                          padding: '6px 0',
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--muted)',
                          textAlign: 'right',
                        }}
                      >
                        × {l.quantity}
                      </td>
                      <td
                        className="mono"
                        style={{
                          padding: '6px 0',
                          borderBottom: '1px solid var(--border)',
                          textAlign: 'right',
                          width: 90,
                        }}
                      >
                        {formatMoney(l.totalCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="eyebrow" style={{ margin: '16px 0 8px' }}>
                Payments
              </div>
              {order.payments.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No payment taken yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {order.payments.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '110px 1fr auto',
                        gap: 10,
                        fontSize: 12.5,
                      }}
                    >
                      <span className="mono" style={{ color: 'var(--muted)', fontSize: 11.5 }}>
                        {p.createdAt ? shortDay(p.createdAt.slice(0, 10)) : ''}
                      </span>
                      <span style={{ textTransform: 'capitalize' }}>
                        {p.kind.replace(/_/g, ' ')} · {p.method.replace(/_/g, ' ')}
                        <span style={{ color: 'var(--muted)' }}> · {p.status}</span>
                      </span>
                      <span className="mono">{formatMoney(p.amountCents)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="dialog-foot">
              <button type="button" className="btn btn-primary" onClick={open}>
                {order.balanceDueCents > 0 ? 'Collect payment' : 'Open order'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={open}>
                {order.status === 'open' ? 'Schedule delivery' : 'Open full order'}
              </button>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  color: 'var(--muted)',
                  alignSelf: 'center',
                }}
              >
                Esc to close
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
