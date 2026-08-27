'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, CreditCard, Lock, Printer, Share2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@jetnine/shared';
import { api, ApiError } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, Card, Input, LinkButton, LoadingRows, Select, StatusBadge } from '@/components/ui';
import { SecurityOverrideDialog } from '@/components/security-override-dialog';

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
  qtyReturned: number;
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
  creditDueCents: number;
  orderKind: string;
  originalOrderId: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressRegion: string | null;
  addressPostalCode: string | null;
  addressPhone: string | null;
  notes: string | null;
  internalNotes: string | null;
  legacyNumber: string | null;
  lockedAt: string | null;
  onOpenRun: { runId: string; runDate: string } | null;
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
interface ReturnableLine {
  id: string;
  description: string;
  qtyFulfilled: number;
  qtyReturned: number;
}

interface AuditRow {
  id: string;
  action: string;
  createdAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  changesJson: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  } | null;
}

/** "$1,234.56" for *_cents fields, plain stringification otherwise. */
function formatAuditValue(field: string, value: unknown): string {
  if (value == null || value === '') return '—';
  if (/cents$/i.test(field) && typeof value === 'number') {
    return `$${(value / 100).toFixed(2)}`;
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * The change-history line for one audit entry: each changed field with
 * its before → after values (PLAN-POS-OPERATIONS §8 — "every field
 * change attributed"). The audit service stores a minimal diff, so
 * every key present actually changed.
 */
function auditChanges(row: AuditRow): { field: string; from: string; to: string }[] {
  const before = row.changesJson?.before ?? {};
  const after = row.changesJson?.after ?? {};
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return fields.map((field) => ({
    field,
    from: formatAuditValue(field, before[field]),
    to: formatAuditValue(field, after[field]),
  }));
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
  const [dayCapacity, setDayCapacity] = useState<{ booked: number; cap: number } | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);

  // §7: the associate sees the day's remaining capacity while booking.
  useEffect(() => {
    if (!deliveryDate) {
      setDayCapacity(null);
      return;
    }
    let stale = false;
    api<{ cap: number; days: { booked: number }[] }>(
      `/v1/deliveries/capacity?from=${deliveryDate}&to=${deliveryDate}`,
    )
      .then((r) => {
        if (!stale) setDayCapacity({ booked: r.days[0]?.booked ?? 0, cap: r.cap });
      })
      .catch(() => setDayCapacity(null));
    return () => {
      stale = true;
    };
  }, [deliveryDate]);

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
      <p style={{ color: 'var(--danger)' }}>
        {error} — <Link href="/orders">back to orders</Link>
      </p>
    );
  }
  if (!order) return <LoadingRows rows={5} />;

  const live = !order.completedAt && !order.cancelledAt;
  const depositOutstanding = Math.max(0, order.depositRequiredCents - order.paidCents);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 4,
          flexWrap: 'wrap',
        }}
      >
        <h1 className="page-title" data-testid="order-number" style={{ margin: 0 }}>
          {order.number}
        </h1>
        <span data-testid="order-status" style={{ display: 'inline-flex' }}>
          <StatusBadge status={order.status} />
        </span>
        {order.legacyNumber && (
          <span className="muted" style={{ fontSize: 12 }}>
            STORIS #{order.legacyNumber}
          </span>
        )}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          <LinkButton
            href={`/print/orders/${id}/invoice`}
            variant="secondary"
            size="sm"
            target="_blank"
            data-testid="print-invoice"
          >
            <Printer size={13} aria-hidden /> Invoice
          </LinkButton>
          <LinkButton
            href={`/print/orders/${id}/delivery-ticket`}
            variant="secondary"
            size="sm"
            target="_blank"
            data-testid="print-delivery-ticket"
          >
            <Printer size={13} aria-hidden /> Delivery ticket
          </LinkButton>
          <LinkButton
            href={`/print/orders/${id}/pick-list`}
            variant="secondary"
            size="sm"
            target="_blank"
            data-testid="print-pick-list"
          >
            <Printer size={13} aria-hidden /> Pick list
          </LinkButton>
          <Button
            size="sm"
            variant="secondary"
            data-testid="share-status-link"
            onClick={async () => {
              try {
                const res = await api<{ path: string }>(`/v1/orders/${id}/share`, {
                  method: 'POST',
                });
                const url = `${window.location.origin}${res.path}`;
                await navigator.clipboard.writeText(url).catch(() => {});
                toast.success('Status link copied — send it to the customer', {
                  description: url,
                });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : String(err));
              }
            }}
          >
            <Share2 size={13} aria-hidden /> Share status link
          </Button>
          <LinkButton href="/orders" variant="ghost" size="sm">
            ← All orders
          </LinkButton>
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
        {order.fulfillmentType}
        {order.requestedDate ? ` · promised ${order.requestedDate}` : ''} · written{' '}
        {new Date(order.createdAt).toLocaleString()}
      </p>

      {order.onOpenRun && (
        <div
          data-testid="run-locked-banner"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            marginBottom: 16,
            borderColor: 'var(--danger)',
            fontSize: 13,
          }}
        >
          <Truck size={15} aria-hidden style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>On the {order.onOpenRun.runDate} delivery run</strong> — the goods are
            manifested against a truck, so this order is locked until the run closes out. Pull the
            stop off the run (with a reason) to edit it first.
          </span>
          <LinkButton href="/deliveries/dispatch" size="sm" variant="secondary">
            Dispatch →
          </LinkButton>
        </div>
      )}

      {order.lockedAt && (
        <div
          data-testid="locked-banner"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            marginBottom: 16,
            borderColor: 'var(--warning)',
            fontSize: 13,
          }}
        >
          <Lock size={15} aria-hidden style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>Locked</strong> — the delivery ticket was printed{' '}
            {new Date(order.lockedAt).toLocaleString()}. No edits while it&apos;s on the truck.
          </span>
          <Button
            size="sm"
            variant="secondary"
            data-testid="unlock-order"
            disabled={busy}
            onClick={() => setUnlockOpen(true)}
          >
            Unlock…
          </Button>
        </div>
      )}

      <SecurityOverrideDialog
        open={unlockOpen}
        title={`Unlock order ${order.number}`}
        usageClass="exception"
        submitLabel="Unlock order"
        perform={(payload) =>
          api(`/v1/orders/${id}/unlock`, { method: 'POST', body: JSON.stringify(payload) }).then(
            () => undefined,
          )
        }
        onClose={() => setUnlockOpen(false)}
        onSuccess={() => void load()}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          <Card title="Lines" style={{ marginBottom: 16 }}>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Reserved</th>
                    <th>Fulfilled</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((l) => (
                    <tr key={l.id}>
                      <td>{l.description}</td>
                      <td>
                        {l.lineType === 'custom' ? (
                          'custom'
                        ) : ['open', 'partially_fulfilled', 'draft', 'quote'].includes(
                            order.status,
                          ) && l.qtyFulfilled === 0 ? (
                          // PO-060: the type stays changeable on an open
                          // line — e.g. flip to direct ship when the
                          // vendor will deliver straight to the customer.
                          <select
                            className="select"
                            value={l.lineType}
                            style={{ fontSize: 12, padding: '2px 4px' }}
                            aria-label={`Line type for ${l.description}`}
                            onChange={async (e) => {
                              try {
                                await api(`/v1/orders/${id}/lines/${l.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ lineType: e.target.value }),
                                });
                                await load();
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : String(err));
                              }
                            }}
                          >
                            <option value="stock">stock</option>
                            <option value="special_order">special order</option>
                            <option value="direct_ship">direct ship</option>
                          </select>
                        ) : l.lineType === 'special_order' ? (
                          <span style={{ color: 'var(--warning)' }}>special order</span>
                        ) : l.lineType === 'direct_ship' ? (
                          <span
                            style={{ color: 'var(--info, var(--warning))' }}
                            title="The vendor ships straight to the customer"
                          >
                            direct ship
                          </span>
                        ) : (
                          'stock'
                        )}
                      </td>
                      <td>{l.quantity}</td>
                      <td>{l.qtyReserved}</td>
                      <td>{l.qtyFulfilled}</td>
                      <td className="num">
                        <Money cents={l.totalCents} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Payments" style={{ marginBottom: 16 }}>
            {order.payments.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                No money taken yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Kind</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.payments.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.createdAt).toLocaleString()}</td>
                        <td>{p.kind}</td>
                        <td>{p.method}</td>
                        <td>
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="num">
                          <Money cents={p.amountCents} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                <Input
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
                  style={{ width: 100 }}
                  data-testid="payment-amount"
                />
                <Select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                  style={{ width: 130 }}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="primary"
                  onClick={() => void takePayment()}
                  disabled={busy}
                  data-testid="take-payment"
                >
                  <CreditCard size={14} aria-hidden />
                  {order.paidCents === 0 ? 'Take deposit' : 'Take payment'}
                </Button>
                {depositOutstanding > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--warning)' }}>
                    Deposit outstanding: {formatMoney(depositOutstanding)}
                  </span>
                )}
              </div>
            )}
          </Card>

          {live && (
            <PaymentPlanCard
              orderId={order.id}
              balanceDueCents={order.balanceDueCents}
              onChanged={load}
            />
          )}

          <Card title="Deliveries & fulfillment" style={{ marginBottom: 16 }}>
            {deliveries.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                {order.fulfillmentType === 'pickup'
                  ? 'Pickup order — hand over the goods below when the customer arrives.'
                  : 'Nothing scheduled yet.'}
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                {deliveries.map((dv) => (
                  <li key={dv.id} style={{ marginBottom: 4 }}>
                    <Link href={`/deliveries/${dv.id}`}>
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
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      style={{ width: 150 }}
                      data-testid="delivery-date"
                    />
                    <Button
                      variant="primary"
                      onClick={async () => {
                        if (!deliveryDate) {
                          setError('Pick a delivery date first.');
                          return;
                        }
                        // Over-cap booking is allowed but deliberate:
                        // the 409 becomes a confirm, and the retry
                        // carries the override flag (logged to the
                        // owner feed server-side).
                        setBusy(true);
                        setError(null);
                        try {
                          await api(`/v1/orders/${id}/deliveries`, {
                            method: 'POST',
                            body: JSON.stringify({ scheduledDate: deliveryDate }),
                          });
                          await load();
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : String(err);
                          if (
                            err instanceof ApiError &&
                            err.code === 'OVER_CAPACITY' &&
                            window.confirm(`${msg}\n\nBook beyond the cap anyway?`)
                          ) {
                            try {
                              await api(`/v1/orders/${id}/deliveries`, {
                                method: 'POST',
                                body: JSON.stringify({
                                  scheduledDate: deliveryDate,
                                  confirmOverCapacity: true,
                                }),
                              });
                              await load();
                            } catch (err2) {
                              setError(err2 instanceof Error ? err2.message : String(err2));
                            }
                          } else {
                            setError(msg);
                          }
                        } finally {
                          setBusy(false);
                        }
                      }}
                      disabled={busy}
                      data-testid="schedule-delivery"
                    >
                      <Truck size={14} aria-hidden />
                      Schedule delivery
                    </Button>
                    {dayCapacity && (
                      <span
                        className={`badge badge-${
                          dayCapacity.booked >= dayCapacity.cap ? 'danger' : 'info'
                        }`}
                        data-testid="capacity-hint"
                      >
                        {dayCapacity.booked}/{dayCapacity.cap} stops booked
                      </span>
                    )}
                  </>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => void act('/fulfill', {})}
                    disabled={busy}
                    data-testid="fulfill-pickup"
                  >
                    Hand over the goods (pickup)
                  </Button>
                )}
              </div>
            )}
          </Card>

          <ReturnsCard order={order} busy={busy} onChanged={load} />

          <Card title="Change history" style={{ marginBottom: 16 }}>
            {timeline.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                No events recorded.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }} data-testid="order-timeline">
                {timeline.map((t) => {
                  const changes = auditChanges(t);
                  return (
                    <li key={t.id} style={{ marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {new Date(t.createdAt).toLocaleString()}
                      </span>{' '}
                      — {t.action.replace('order.', '').replace(/[._]/g, ' ')}
                      {t.actorEmail && (
                        <span style={{ color: 'var(--text-muted)' }}> by {t.actorEmail}</span>
                      )}
                      {changes.length > 0 && (
                        <ul
                          style={{
                            margin: '2px 0 0',
                            paddingLeft: 14,
                            color: 'var(--text-secondary)',
                            fontSize: 12,
                          }}
                        >
                          {changes.map((c) => (
                            <li key={c.field}>
                              {c.field}: {c.from} → {c.to}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0">
          <Card title="Customer" style={{ marginBottom: 16 }}>
            {customer ? (
              <p style={{ fontSize: 13, margin: 0 }}>
                <Link href={`/customers/${customer.id}`}>
                  <strong>
                    {[customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
                      '(no name)'}
                  </strong>
                </Link>
                <br />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {customer.email ?? customer.phone ?? '—'}
                </span>
              </p>
            ) : (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                …
              </p>
            )}
            {order.fulfillmentType === 'delivery' && order.addressLine1 && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
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
          </Card>

          <Card title="Money" style={{ marginBottom: 16 }}>
            <Row label="Subtotal" value={order.subtotalCents} />
            <Row label="Discount" value={-order.discountCents} />
            <Row label="Tax" value={order.taxCents} />
            <Row label="Total" value={order.totalCents} bold />
            <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
            <Row label="Deposit required" value={order.depositRequiredCents} />
            <Row label="Paid" value={order.paidCents} />
            <div data-testid="balance-due">
              <Row label="Balance due" value={order.balanceDueCents} bold />
            </div>
          </Card>

          {live && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {error && <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>{error}</p>}
              {order.status === 'quote' && (
                <Button
                  variant="primary"
                  onClick={() => void act('/reserve')}
                  disabled={busy}
                  data-testid="confirm-reserve"
                >
                  Confirm order (commit stock)
                </Button>
              )}
              {order.status === 'fulfilled' && (
                <Button
                  variant="primary"
                  onClick={() => void act('/complete', {})}
                  disabled={busy || order.balanceDueCents > 0}
                  data-testid="complete-order"
                  title={
                    order.balanceDueCents > 0
                      ? 'Collect the balance first'
                      : 'Close the book on this order'
                  }
                >
                  <CheckCircle2 size={14} aria-hidden />
                  Complete order
                </Button>
              )}
              {order.status === 'fulfilled' && order.balanceDueCents > 0 && (
                <Button
                  onClick={() => void act('/complete', { allowBalance: true })}
                  disabled={busy}
                  data-testid="complete-with-balance"
                >
                  Complete with balance due (AR)
                </Button>
              )}
              {order.status !== 'quote' && order.status !== 'fulfilled' && (
                <Button onClick={() => void act('/release')} disabled={busy}>
                  Release reserved stock
                </Button>
              )}
              <Button
                variant="danger"
                onClick={() => {
                  const reason = prompt('Cancel this order? Reason (optional):');
                  if (reason === null) return;
                  void act('/cancel', { reason: reason || null });
                }}
                disabled={busy}
              >
                Cancel order
              </Button>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Delivery scheduling and fulfillment arrive with the Day 3 build.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span>{label}</span>
      <span>
        <Money cents={value} />
      </span>
    </div>
  );
}

interface PlanInstallment {
  seq: number;
  dueDate: string;
  amountCents: number;
  status: string;
}
interface PlanDetail {
  id: string;
  orderId: string;
  status: string;
  frequency: string;
  installments: PlanInstallment[];
}

/** Layaway / in-house plan (G4): create it here, take installments here. */
function PaymentPlanCard(props: {
  orderId: string;
  balanceDueCents: number;
  onChanged: () => Promise<void> | void;
}) {
  const [plan, setPlan] = useState<PlanDetail | null | undefined>(undefined);
  const [count, setCount] = useState('3');
  const [frequency, setFrequency] = useState('monthly');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const plans = await api<PlanDetail[]>('/v1/payment-plans');
      setPlan(plans.find((p) => p.orderId === props.orderId) ?? null);
    } catch {
      setPlan(null);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.orderId]);

  async function createPlan() {
    setBusy(true);
    setError(null);
    try {
      const created = await api<PlanDetail>(`/v1/orders/${props.orderId}/payment-plan`, {
        method: 'POST',
        body: JSON.stringify({ installmentCount: Number(count), frequency }),
      });
      setPlan(created);
      await props.onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function pay(seq: number) {
    if (!plan) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api<PlanDetail>(
        `/v1/payment-plans/${plan.id}/installments/${seq}/pay`,
        {
          method: 'POST',
          body: JSON.stringify({ method: 'cash' }),
        },
      );
      setPlan(updated);
      await props.onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (plan === undefined) return null;

  return (
    <Card title="Payment plan" style={{ marginBottom: 16 }} data-testid="payment-plan-card">
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      {plan === null ? (
        props.balanceDueCents > 0 ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Split the balance into
            </span>
            <Input
              type="number"
              min={2}
              max={24}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              style={{ width: 60 }}
              data-testid="plan-count"
            />
            <Select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={{ width: 120 }}
            >
              <option value="weekly">weekly</option>
              <option value="biweekly">biweekly</option>
              <option value="monthly">monthly</option>
            </Select>
            <Button
              variant="primary"
              onClick={() => void createPlan()}
              disabled={busy || !(Number(count) >= 1)}
              data-testid="create-plan"
            >
              Start layaway plan
            </Button>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            No plan — the balance is already zero.
          </p>
        )
      ) : (
        <>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>
            {plan.frequency} plan · <span data-testid="plan-status">{plan.status}</span>
          </p>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                  <th className="num"> </th>
                </tr>
              </thead>
              <tbody>
                {plan.installments.map((i) => (
                  <tr key={i.seq}>
                    <td>{i.seq}</td>
                    <td>{i.dueDate}</td>
                    <td>
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="num">
                      <Money cents={i.amountCents} />
                    </td>
                    <td className="num">
                      {i.status !== 'paid' && plan.status === 'active' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => void pay(i.seq)}
                          disabled={busy}
                          data-testid={`pay-installment-${i.seq}`}
                        >
                          Pay cash
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

/**
 * §10 Returns & exchange: delivered units come back through here — the
 * refund reverses original tenders or lands as store credit, the goods
 * go to the As-Is review queue (never straight to stock), and an
 * Exchange Order can be written against this invoice. Price adjustments
 * are the money-only variant.
 */
function ReturnsCard({
  order,
  busy,
  onChanged,
}: {
  order: {
    id: string;
    number: string;
    orderKind: string;
    originalOrderId?: string | null;
    paidCents: number;
    creditDueCents?: number;
    lines: ReturnableLine[];
  };
  busy: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<'original' | 'store_credit'>('original');
  const [fulfillment, setFulfillment] = useState<'drop_off' | 'pickup'>('drop_off');
  const [reason, setReason] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [working, setWorking] = useState(false);
  // A7 lifecycle: authorized returns wait here for the goods; receiving
  // fires the refund. Completed/cancelled returns stay as history.
  const [returns, setReturns] = useState<
    {
      id: string;
      rmaNumber: string;
      status: string;
      fulfillment: string;
      refundMethod: string;
      amountCents: number;
      authorizedAt: string;
    }[]
  >([]);
  const [returnCodes, setReturnCodes] = useState<
    { id: string; code: string; description: string }[]
  >([]);
  const [returnCodeId, setReturnCodeId] = useState('');
  // Cancelling a return authorization is override-gated server-side, so
  // it needs the dialog rather than a native prompt. Declared with the
  // other state — ReturnsCard returns early below.
  const [cancellingReturnId, setCancellingReturnId] = useState<string | null>(null);
  async function loadReturns() {
    try {
      setReturns(await api(`/v1/order-returns?orderId=${order.id}`));
    } catch {
      setReturns([]);
    }
  }
  useEffect(() => {
    void loadReturns();
    api<{ id: string; code: string; description: string }[]>('/v1/reason-codes?usageClass=return')
      .then(setReturnCodes)
      .catch(() => setReturnCodes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);
  // Coded adjustment reasons (gap sprint G2). While the business has no
  // codes of class `adjustment`, the shared free-text reason is sent.
  const [adjustCodes, setAdjustCodes] = useState<
    { id: string; code: string; description: string }[]
  >([]);
  const [adjustCodeId, setAdjustCodeId] = useState('');
  useEffect(() => {
    api<{ id: string; code: string; description: string }[]>(
      '/v1/reason-codes?usageClass=adjustment',
    )
      .then(setAdjustCodes)
      .catch(() => setAdjustCodes([]));
  }, []);

  // I4: a return outside the configured window comes back 403
  // OVERRIDE_REQUIRED — the dialog retries with manager credentials.
  const [windowOverrideOpen, setWindowOverrideOpen] = useState(false);

  const returnable = order.lines.filter((l) => l.qtyFulfilled - l.qtyReturned > 0);
  if (returnable.length === 0 && !order.originalOrderId && order.paidCents === 0) return null;

  function buildReturnBody() {
    return {
      lines: Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([lineId, quantity]) => ({
          lineId,
          quantity,
          ...(returnCodeId ? { reasonCodeId: returnCodeId } : {}),
        })),
      refundMethod: method,
      fulfillment,
      reason: reason || null,
    };
  }

  async function processReturn() {
    const body = buildReturnBody();
    if (body.lines.length === 0) {
      toast.error('Enter a quantity on at least one line.');
      return;
    }
    if (returnCodes.length > 0 && !returnCodeId) {
      toast.error('Select a return reason.');
      return;
    }
    setWorking(true);
    try {
      await api(`/v1/orders/${order.id}/return`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast.success(
        fulfillment === 'drop_off'
          ? 'Return processed — goods staged in As-Is review.'
          : 'Return authorized — the refund fires when the goods are received back.',
      );
      setQty({});
      setReason('');
      await onChanged();
      await loadReturns();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'OVERRIDE_REQUIRED') {
        setWindowOverrideOpen(true);
      } else {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setWorking(false);
    }
  }

  async function receiveReturn(id: string) {
    setWorking(true);
    try {
      await api(`/v1/order-returns/${id}/receive`, { method: 'POST' });
      toast.success('Goods received — refund issued.');
      await onChanged();
      await loadReturns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  }

  async function processAdjustment() {
    const cents = Math.round(Number(adjustAmount) * 100);
    const hasReason = adjustCodes.length > 0 ? Boolean(adjustCodeId) : Boolean(reason.trim());
    if (!Number.isFinite(cents) || cents <= 0 || !hasReason) {
      toast.error('Enter an adjustment amount and a reason.');
      return;
    }
    setWorking(true);
    try {
      await api(`/v1/orders/${order.id}/price-adjustment`, {
        method: 'POST',
        body: JSON.stringify({
          amountCents: cents,
          ...(adjustCodeId ? { reasonCodeId: adjustCodeId } : {}),
          ...(reason.trim() ? { reason: reason.trim() } : {}),
          refundMethod: method,
        }),
      });
      toast.success('Price adjustment recorded.');
      setAdjustAmount('');
      setReason('');
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card title="Returns & exchange" style={{ marginBottom: 16 }}>
      {returns.length > 0 && (
        <table className="table" style={{ marginBottom: 12 }} data-testid="returns-table">
          <thead>
            <tr>
              <th>RMA</th>
              <th>Status</th>
              <th>Refund</th>
              <th className="num">Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.rmaNumber}</td>
                <td>
                  {r.status === 'authorized'
                    ? `awaiting ${r.fulfillment === 'pickup' ? 'pickup' : 'drop-off'}`
                    : r.status}
                </td>
                <td>{r.refundMethod === 'store_credit' ? 'store credit' : 'original tenders'}</td>
                <td className="num">
                  <Money cents={r.amountCents} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {r.status === 'authorized' && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={working}
                        data-testid="receive-return"
                        onClick={() => void receiveReturn(r.id)}
                      >
                        Goods received
                      </Button>{' '}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={working}
                        onClick={() => setCancellingReturnId(r.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SecurityOverrideDialog
        open={windowOverrideOpen}
        title="Outside the return window — manager approval needed"
        usageClass="exception"
        submitLabel="Approve return"
        perform={(payload) =>
          api(`/v1/orders/${order.id}/return`, {
            method: 'POST',
            body: JSON.stringify({ ...buildReturnBody(), override: payload.override }),
          }).then(() => undefined)
        }
        onClose={() => setWindowOverrideOpen(false)}
        onSuccess={() => {
          setQty({});
          setReason('');
          void onChanged();
          void loadReturns();
        }}
      />
      <SecurityOverrideDialog
        open={cancellingReturnId != null}
        title="Cancel this return authorization"
        usageClass="exception"
        submitLabel="Cancel return"
        perform={(payload) =>
          api(`/v1/order-returns/${cancellingReturnId}/cancel`, {
            method: 'POST',
            body: JSON.stringify(payload),
          }).then(() => undefined)
        }
        onClose={() => setCancellingReturnId(null)}
        onSuccess={() => {
          void onChanged();
          void loadReturns();
        }}
      />
      {order.originalOrderId && (
        <p style={{ fontSize: 13, marginTop: 0 }}>
          This is an <strong>Exchange Order</strong> —{' '}
          <Link href={`/orders/${order.originalOrderId}`}>view the original invoice</Link>.
          {(order.creditDueCents ?? 0) > 0 && (
            <>
              {' '}
              Credit due to customer: <Money cents={order.creditDueCents!} />.
            </>
          )}
        </p>
      )}
      {returnable.length > 0 && (
        <>
          <table className="table" style={{ marginBottom: 8 }}>
            <thead>
              <tr>
                <th>Delivered item</th>
                <th className="num">Returnable</th>
                <th>Return qty</th>
              </tr>
            </thead>
            <tbody>
              {returnable.map((l) => {
                const max = l.qtyFulfilled - l.qtyReturned;
                return (
                  <tr key={l.id}>
                    <td>{l.description}</td>
                    <td className="num">{max}</td>
                    <td>
                      <Input
                        type="number"
                        min={0}
                        max={max}
                        value={qty[l.id] ?? 0}
                        data-testid="return-qty"
                        onChange={(e) =>
                          setQty((prev) => ({
                            ...prev,
                            [l.id]: Math.max(0, Math.min(max, Number(e.target.value) || 0)),
                          }))
                        }
                        style={{ width: 70 }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
      <div className="flex flex-wrap items-end gap-2" style={{ fontSize: 13 }}>
        <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
          Refund to
          <select
            className="select"
            value={method}
            data-testid="refund-method"
            onChange={(e) => setMethod(e.target.value as 'original' | 'store_credit')}
          >
            <option value="original">Original tenders</option>
            <option value="store_credit">Store credit</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
          Goods come back by
          <select
            className="select"
            value={fulfillment}
            data-testid="return-fulfillment"
            onChange={(e) => setFulfillment(e.target.value as 'drop_off' | 'pickup')}
          >
            <option value="drop_off">Customer drop-off (refund now)</option>
            <option value="pickup">Truck pickup (refund on receipt)</option>
          </select>
        </label>
        {returnCodes.length > 0 && (
          <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
            Return reason
            <select
              className="select"
              value={returnCodeId}
              data-testid="return-reason-code"
              onChange={(e) => setReturnCodeId(e.target.value)}
            >
              <option value="">Select…</option>
              {returnCodes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.description}
                </option>
              ))}
            </select>
          </label>
        )}
        <label style={{ display: 'grid', gap: 2, fontSize: 12, flex: 1, minWidth: 160 }}>
          Reason
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        {returnable.length > 0 && (
          <Button
            variant="primary"
            disabled={busy || working}
            onClick={() => void processReturn()}
            data-testid="process-return"
          >
            Process return
          </Button>
        )}
        <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
          Adjustment ($)
          <Input
            type="number"
            step="0.01"
            min={0}
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            data-testid="adjust-amount"
            style={{ width: 110 }}
          />
        </label>
        {adjustCodes.length > 0 && (
          <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
            Adjustment reason
            <select
              className="select"
              value={adjustCodeId}
              data-testid="adjust-reason-code"
              onChange={(e) => setAdjustCodeId(e.target.value)}
            >
              <option value="">Select…</option>
              {adjustCodes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.description}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button
          variant="secondary"
          disabled={busy || working}
          onClick={() => void processAdjustment()}
          data-testid="process-adjustment"
        >
          Price adjustment
        </Button>
        {!order.originalOrderId && (
          <LinkButton
            href={`/exchanges/new?originalOrderId=${order.id}`}
            variant="secondary"
            data-testid="write-exchange"
          >
            Write exchange
          </LinkButton>
        )}
      </div>
      <p className="muted" style={{ fontSize: 11.5, margin: '8px 0 0' }}>
        Returned goods go to the As-Is queue for manager/warehouse review — never straight back to
        sellable stock. Exchanges net the return credit against the replacement in one settlement
        (restocking fee per Settings).
      </p>
    </Card>
  );
}
