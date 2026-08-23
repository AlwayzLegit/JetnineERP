'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatMoney } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

/**
 * Order detail (STORIS cutover Day 2): the working view of one sales
 * order — lines with reservation state, money in vs balance due, and the
 * actions the store takes between writing an order and fulfilling it.
 * Fulfillment itself (deliveries, stock decrement, completion) is Day 3.
 */

interface OrderLine {
  id: string;
  variantId: string | null;
  description: string;
  quantity: number;
  qtyReserved: number;
  qtyFulfilled: number;
  lineType: string;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
}
interface OrderPayment {
  id: string;
  kind: string;
  method: string;
  amountCents: number;
  status: string;
  createdAt: string;
}
interface OrderDetail {
  id: string;
  number: string;
  status: string;
  customerId: string;
  locationId: string;
  fulfillmentType: string;
  requestedDate: string | null;
  subtotalCents: number;
  orderDiscountCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  depositRequiredCents: number;
  paidCents: number;
  balanceDueCents: number;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressRegion: string | null;
  addressPostalCode: string | null;
  addressPhone: string | null;
  notes: string | null;
  internalNotes: string | null;
  legacyNumber: string | null;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  lines: OrderLine[];
  payments: OrderPayment[];
}
interface CustomerRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}
interface DeliveryRow {
  id: string;
  scheduledDate: string;
  status: string;
  windowStart: string | null;
  windowEnd: string | null;
  lines: { id: string; description: string; quantity: number }[];
}
interface AuditRow {
  id: string;
  action: string;
  createdAt: string;
  actorUserId: string | null;
}

const PAYMENT_METHODS = [
  'cash',
  'card',
  'external_card',
  'check',
  'financing',
  'store_credit',
  'gift_card',
] as const;

const STATUS_COLORS: Record<string, string> = {
  quote: '#8a6d1a',
  open: '#1a5f8a',
  partially_fulfilled: '#6a4b8a',
  fulfilled: '#2c7a4b',
  completed: '#2c7a4b',
  cancelled: '#8c2f2f',
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [timeline, setTimeline] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<(typeof PAYMENT_METHODS)[number]>('cash');
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');

  async function load() {
    try {
      const o = await api<OrderDetail>(`/v1/orders/${id}`);
      setOrder(o);
      void api<CustomerRow>(`/v1/customers/${o.customerId}`)
        .then(setCustomer)
        .catch(() => setCustomer(null));
      void api<DeliveryRow[]>(`/v1/deliveries?orderId=${o.id}`)
        .then(setDeliveries)
        .catch(() => setDeliveries([]));
      // The audit log is the order's timeline: every mutation the API
      // makes writes an entry with targetId = the order id.
      void api<{ data: AuditRow[]; nextCursor: string | null }>(
        `/v1/audit-logs?targetType=order&targetId=${o.id}&limit=50`,
      )
        .then((r) => setTimeline(r.data))
        .catch(() => setTimeline([]));
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
      await api(`/v1/orders/${id}${path}`, {
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

  async function takePayment() {
    const cents = Math.round(Number(payAmount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Enter a payment amount.');
      return;
    }
    await act('/payments', { method: payMethod, amountCents: cents });
    setPayAmount('');
  }

  if (error && !order) {
    return (
      <p style={{ color: '#b00' }}>
        {error} — <Link href="/orders">back to orders</Link>
      </p>
    );
  }
  if (!order) return <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>;

  const live = !order.completedAt && !order.cancelledAt;
  const depositOutstanding = Math.max(0, order.depositRequiredCents - order.paidCents);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, margin: 0 }} data-testid="order-number">
          {order.number}
        </h1>
        <span
          data-testid="order-status"
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#fff',
            background: STATUS_COLORS[order.status] ?? '#666',
            borderRadius: 999,
            padding: '2px 10px',
          }}
        >
          {order.status.replace('_', ' ')}
        </span>
        {order.legacyNumber && (
          <span style={{ fontSize: 12, color: '#888' }}>STORIS #{order.legacyNumber}</span>
        )}
        <Link href="/orders" style={{ marginLeft: 'auto', fontSize: 13, color: '#06c' }}>
          ← All orders
        </Link>
      </div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
        {order.fulfillmentType}
        {order.requestedDate ? ` · promised ${order.requestedDate}` : ''} · written{' '}
        {new Date(order.createdAt).toLocaleString()}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <div style={card}>
            <h3 style={section}>Lines</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                  <Th>Item</Th>
                  <Th>Type</Th>
                  <Th>Qty</Th>
                  <Th>Reserved</Th>
                  <Th>Fulfilled</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <Td>{l.description}</Td>
                    <Td>
                      {l.lineType === 'special_order' ? (
                        <span style={{ color: '#8a6d1a' }}>special order</span>
                      ) : (
                        'stock'
                      )}
                    </Td>
                    <Td>{l.quantity}</Td>
                    <Td>{l.qtyReserved}</Td>
                    <Td>{l.qtyFulfilled}</Td>
                    <Td align="right">
                      <Money cents={l.totalCents} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={card}>
            <h3 style={section}>Payments</h3>
            {order.payments.length === 0 ? (
              <p style={{ color: '#888', fontSize: 13, margin: 0 }}>No money taken yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <Th>When</Th>
                    <Th>Kind</Th>
                    <Th>Method</Th>
                    <Th>Status</Th>
                    <Th align="right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                      <Td>{new Date(p.createdAt).toLocaleString()}</Td>
                      <Td>{p.kind}</Td>
                      <Td>{p.method}</Td>
                      <Td>{p.status}</Td>
                      <Td align="right">
                        <Money cents={p.amountCents} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {live && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 12,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={
                    depositOutstanding > 0
                      ? (depositOutstanding / 100).toFixed(2)
                      : (order.balanceDueCents / 100).toFixed(2)
                  }
                  style={{ ...fieldStyle, width: 100 }}
                  data-testid="payment-amount"
                />
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                  style={{ ...fieldStyle, width: 130 }}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => void takePayment()}
                  disabled={busy}
                  style={primaryBtn}
                  data-testid="take-payment"
                >
                  {order.paidCents === 0 ? 'Take deposit' : 'Take payment'}
                </button>
                {depositOutstanding > 0 && (
                  <span style={{ fontSize: 12, color: '#8a6d1a' }}>
                    Deposit outstanding: {formatMoney(depositOutstanding)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={card}>
            <h3 style={section}>Deliveries & fulfillment</h3>
            {deliveries.length === 0 ? (
              <p style={{ color: '#888', fontSize: 13, margin: 0 }}>
                {order.fulfillmentType === 'pickup'
                  ? 'Pickup order — hand over the goods below when the customer arrives.'
                  : 'Nothing scheduled yet.'}
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                {deliveries.map((dv) => (
                  <li key={dv.id} style={{ marginBottom: 4 }}>
                    <Link href={`/deliveries/${dv.id}`} style={{ color: '#06c' }}>
                      {dv.scheduledDate}
                      {dv.windowStart ? ` ${dv.windowStart.slice(0, 5)}` : ''}
                    </Link>{' '}
                    — {dv.status.replace(/_/g, ' ')} ·{' '}
                    {dv.lines.reduce((s, l) => s + l.quantity, 0)} unit(s)
                  </li>
                ))}
              </ul>
            )}
            {live && order.status !== 'quote' && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 12,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {order.fulfillmentType === 'delivery' ? (
                  <>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      style={{ ...fieldStyle, width: 150 }}
                      data-testid="delivery-date"
                    />
                    <button
                      onClick={() => {
                        if (!deliveryDate) {
                          setError('Pick a delivery date first.');
                          return;
                        }
                        void act('/deliveries', { scheduledDate: deliveryDate });
                      }}
                      disabled={busy}
                      style={primaryBtn}
                      data-testid="schedule-delivery"
                    >
                      Schedule delivery
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => void act('/fulfill', {})}
                    disabled={busy}
                    style={primaryBtn}
                    data-testid="fulfill-pickup"
                  >
                    Hand over the goods (pickup)
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={card}>
            <h3 style={section}>Timeline</h3>
            {timeline.length === 0 ? (
              <p style={{ color: '#888', fontSize: 13, margin: 0 }}>No events recorded.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                {timeline.map((t) => (
                  <li key={t.id} style={{ marginBottom: 4 }}>
                    <span style={{ color: '#666' }}>{new Date(t.createdAt).toLocaleString()}</span>{' '}
                    — {t.action.replace('order.', '').replace(/[._]/g, ' ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div style={card}>
            <h3 style={section}>Customer</h3>
            {customer ? (
              <p style={{ fontSize: 13, margin: 0 }}>
                <Link href={`/customers/${customer.id}`} style={{ color: '#06c' }}>
                  <strong>
                    {[customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
                      '(no name)'}
                  </strong>
                </Link>
                <br />
                <span style={{ color: '#666' }}>{customer.email ?? customer.phone ?? '—'}</span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>…</p>
            )}
            {order.fulfillmentType === 'delivery' && order.addressLine1 && (
              <p style={{ fontSize: 13, color: '#666', marginTop: 8, marginBottom: 0 }}>
                {order.addressLine1}
                {order.addressLine2 ? <>, {order.addressLine2}</> : null}
                <br />
                {[order.addressCity, order.addressRegion, order.addressPostalCode]
                  .filter(Boolean)
                  .join(', ')}
                {order.addressPhone ? (
                  <>
                    <br />
                    {order.addressPhone}
                  </>
                ) : null}
              </p>
            )}
          </div>

          <div style={card}>
            <h3 style={section}>Money</h3>
            <Row label="Subtotal" value={order.subtotalCents} />
            <Row label="Discount" value={-order.discountCents} />
            <Row label="Tax" value={order.taxCents} />
            <Row label="Total" value={order.totalCents} bold />
            <div style={{ borderTop: '1px solid #eee', margin: '8px 0' }} />
            <Row label="Deposit required" value={order.depositRequiredCents} />
            <Row label="Paid" value={order.paidCents} />
            <div data-testid="balance-due">
              <Row label="Balance due" value={order.balanceDueCents} bold />
            </div>
          </div>

          {live && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {error && <p style={{ color: '#b00', margin: 0, fontSize: 13 }}>{error}</p>}
              {order.status === 'quote' && (
                <button
                  onClick={() => void act('/reserve')}
                  disabled={busy}
                  style={primaryBtn}
                  data-testid="confirm-reserve"
                >
                  Confirm order (commit stock)
                </button>
              )}
              {order.status === 'fulfilled' && (
                <button
                  onClick={() => void act('/complete', {})}
                  disabled={busy || order.balanceDueCents > 0}
                  style={primaryBtn}
                  data-testid="complete-order"
                  title={
                    order.balanceDueCents > 0
                      ? 'Collect the balance first'
                      : 'Close the book on this order'
                  }
                >
                  Complete order
                </button>
              )}
              {order.status === 'fulfilled' && order.balanceDueCents > 0 && (
                <button
                  onClick={() => void act('/complete', { allowBalance: true })}
                  disabled={busy}
                  style={linkBtn}
                  data-testid="complete-with-balance"
                >
                  Complete with balance due (AR)
                </button>
              )}
              {order.status !== 'quote' && order.status !== 'fulfilled' && (
                <button onClick={() => void act('/release')} disabled={busy} style={linkBtn}>
                  Release reserved stock
                </button>
              )}
              <button
                onClick={() => {
                  const reason = prompt('Cancel this order? Reason (optional):');
                  if (reason === null) return;
                  void act('/cancel', { reason: reason || null });
                }}
                disabled={busy}
                style={{ ...linkBtn, color: '#8c2f2f', borderColor: '#d9b1ab' }}
              >
                Cancel order
              </button>
              <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
                Delivery scheduling and fulfillment arrive with the Day 3 build.
              </p>
            </div>
          )}
        </div>
      </div>
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
const fieldStyle = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
} as const;
const primaryBtn = {
  padding: '8px 14px',
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

function Th({ children, align }: { children: React.ReactNode; align?: 'right' | 'left' }) {
  return (
    <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: align ?? 'left' }}>{children}</th>
  );
}
function Td({ children, align }: { children: React.ReactNode; align?: 'right' | 'left' }) {
  return <td style={{ padding: '6px 4px', textAlign: align ?? 'left' }}>{children}</td>;
}
function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: bold ? 700 : 400,
        marginBottom: 4,
      }}
    >
      <span>{label}</span>
      <span>
        <Money cents={value} />
      </span>
    </div>
  );
}
