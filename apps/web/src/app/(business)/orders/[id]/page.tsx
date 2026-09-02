'use client';

import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, CreditCard, Lock, Printer, Share2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@jetnine/shared';
import { api, ApiError } from '@/lib/api';
import { Money } from '@/components/money';
import {
  Button,
  Card,
  Field,
  Input,
  LinkButton,
  LoadingRows,
  Select,
  StatusBadge,
  DisplayStatusBadge,
} from '@/components/ui';
import { SecurityOverrideDialog } from '@/components/security-override-dialog';
import { OrderNotesCard } from '@/components/order-notes-card';
import { ProductSearchDialog, type SearchRow } from '@/components/product-search-dialog';

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
  fulfillmentMethod: string | null;
  sourceLocationId: string | null;
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
  processorRef: string | null;
  createdAt: string;
}
interface OrderDetail {
  /** P-013: the same display vocabulary the orders list shows. */
  displayStatus?: string;
  displayPoNumber?: string | null;
  id: string;
  number: string;
  status: string;
  customerId: string;
  locationId: string;
  stockLocationId: string | null;
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
  family: {
    id: string;
    number: string;
    status: string;
    totalCents: number;
    balanceDueCents: number;
  }[];
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

/** Same tender list (and labels) as the New Sale register. */
const TENDERS = [
  { value: 'card', label: 'Credit card' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'synchrony', label: 'Synchrony' },
  { value: 'acima', label: 'Acima' },
  { value: 'store_credit', label: 'Store credit' },
] as const;

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [locationNames, setLocationNames] = useState<Map<string, string>>(new Map());
  const [locations, setLocations] = useState<{ id: string; name: string; locationType?: string }[]>(
    [],
  );
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addSourceId, setAddSourceId] = useState('');
  // Backorder split: pick lines, give them their own promised date, and
  // they move to a new order.
  const [splitMode, setSplitMode] = useState(false);
  const [splitSel, setSplitSel] = useState<Set<string>>(new Set());
  const [splitDate, setSplitDate] = useState('');
  const [timeline, setTimeline] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  // Add-product price step (owner 2026-08-30): pick the product, set
  // the price it sells at, then the payment form pre-fills with the
  // charge so money can be taken on the new item immediately.
  const [pendingAdd, setPendingAdd] = useState<SearchRow | null>(null);
  const [addPrice, setAddPrice] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [payMethod, setPayMethod] = useState<(typeof TENDERS)[number]['value']>('card');
  const [payRef, setPayRef] = useState('');
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
      void api<{ id: string; name: string; locationType?: string }[]>('/v1/business/locations')
        .then((locs) => {
          setLocations(locs);
          setLocationNames(new Map(locs.map((l) => [l.id, l.name])));
        })
        .catch(() => undefined);
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

  async function moveCredit(toOrderId: string, toNumber: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/orders/${id}/move-credit`, {
        method: 'POST',
        body: JSON.stringify({ toOrderId }),
      });
      toast.success(`Credit moved to ${toNumber}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function splitOrder() {
    if (splitSel.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ newOrder: { id: string; number: string } }>(
        `/v1/orders/${id}/split`,
        {
          method: 'POST',
          body: JSON.stringify({
            lines: [...splitSel].map((lineId) => ({ lineId })),
            requestedDate: splitDate || null,
          }),
        },
      );
      toast.success(
        `Split to ${result.newOrder.number} — money and balances updated on both orders.`,
      );
      setSplitMode(false);
      setSplitSel(new Set());
      setSplitDate('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // A parked draft becomes a live sale: the PATCH reserves stock and
  // re-runs the price-variance gate (G6), unlike the bare /reserve.
  async function confirmDraft() {
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'open' }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function addLine(row: SearchRow, unitPriceCents: number, quantity: number) {
    setBusy(true);
    setError(null);
    try {
      const defaultSource = order?.stockLocationId ?? order?.locationId;
      const prevBalance = order?.balanceDueCents ?? 0;
      const detail = await api<{ balanceDueCents: number }>(`/v1/orders/${id}/lines`, {
        method: 'POST',
        body: JSON.stringify({
          variantId: row.variantId,
          quantity,
          unitPriceCents,
          sourceLocationId: addSourceId && addSourceId !== defaultSource ? addSourceId : undefined,
        }),
      });
      setPendingAdd(null);
      const deltaCents = Math.max(0, detail.balanceDueCents - prevBalance);
      if (deltaCents > 0) {
        // Pre-fill the payment form with exactly what the new item added
        // to the balance so taking the money is one click away.
        setPayAmount((deltaCents / 100).toFixed(2));
        toast.success(
          `Added ${row.productName} — payment form pre-filled with the ${(deltaCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })} it added.`,
        );
      } else {
        toast.success(`Added ${row.productName} — totals and stock updated.`);
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // Take-with hand-over (owner 2026-08-31): Complete on a live order
  // with take-with lines splits them to a -A sibling and completes it
  // when its stock and money are in. The server never errors for a
  // short or unpaid piece — it reports why, and the piece waits.
  async function completeTakeWith() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{
        takeWith?: { number: string; completed: boolean; reason: string | null };
      }>(`/v1/orders/${id}/complete`, { method: 'POST', body: JSON.stringify({}) });
      if (res.takeWith?.completed) {
        toast.success(`${res.takeWith.number} — taken with, paid, and completed.`);
      } else if (res.takeWith) {
        toast(`${res.takeWith.number} is waiting: ${res.takeWith.reason ?? 'not ready yet'}`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // "+ Recycling" (owner 2026-08-31): same button as New Sale — one
  // untaxed fee line; each click counts one more unit on it.
  const [recyclingFeeCents, setRecyclingFeeCents] = useState(1050);
  useEffect(() => {
    api<{ ops: { recyclingFeeCents?: number | null } | null }>('/v1/business/settings')
      .then((s2) => {
        if (s2.ops?.recyclingFeeCents != null) setRecyclingFeeCents(s2.ops.recyclingFeeCents);
      })
      .catch(() => undefined);
  }, []);
  async function addRecyclingFee() {
    if (!order) return;
    const fee = order.lines.find(
      (l) => l.lineType === 'custom' && l.description === 'Recycling Fee',
    );
    setBusy(true);
    try {
      if (fee) {
        await api(`/v1/orders/${id}/lines/${fee.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: fee.quantity + 1 }),
        });
      } else {
        await api(`/v1/orders/${id}/lines`, {
          method: 'POST',
          body: JSON.stringify({
            description: 'Recycling Fee',
            lineType: 'custom',
            quantity: 1,
            unitPriceCents: recyclingFeeCents,
          }),
        });
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // Inline line editing (owner 2026-08-31: order lines look and work
  // like New Sale's). Inputs commit on blur; a failed edit reloads so
  // the boxes snap back to what the server holds.
  async function patchLineField(lineId: string, patch: Record<string, unknown>) {
    setBusy(true);
    try {
      await api(`/v1/orders/${id}/lines/${lineId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeLine(l: OrderLine) {
    if (
      !confirm(
        `Remove "${l.description}" from this order? Its reserved stock goes back to the shelf and the balance recalculates.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/orders/${id}/lines/${l.id}`, { method: 'DELETE' });
      toast.success('Line removed — totals and stock updated.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
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
    await act('/payments', {
      method: payMethod,
      amountCents: cents,
      ...(payRef.trim() ? { processorRef: payRef.trim() } : {}),
    });
    setPayAmount('');
    setPayRef('');
  }

  if (error && !order) {
    return (
      <div>
        <h1 className="page-title">Order not found</h1>
        <div className="card" style={{ padding: 24, maxWidth: 520 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>We couldn&apos;t open this order.</p>
          <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
            {error}
          </p>
          <Link href="/orders" className="btn btn-secondary btn-sm no-underline">
            ← Back to orders
          </Link>
        </div>
      </div>
    );
  }
  if (!order) return <LoadingRows rows={5} />;

  const live = !order.completedAt && !order.cancelledAt;
  const depositOutstanding = Math.max(0, order.depositRequiredCents - order.paidCents);

  return (
    <div>
      {/* P-024: a breadcrumb takes you back; the action row keeps one
          primary control. */}
      <nav aria-label="Breadcrumb" style={{ fontSize: 12.5, marginBottom: 2 }}>
        <Link href="/orders" className="muted no-underline">
          Orders
        </Link>{' '}
        <span className="muted">/</span> {order.number}
      </nav>
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
          {/* P-013 (BA-0017): same badge words as the orders list. */}
          {order.displayStatus ? (
            <DisplayStatusBadge
              displayStatus={order.displayStatus}
              poNumber={order.displayPoNumber}
            />
          ) : (
            <StatusBadge status={order.status} />
          )}
        </span>
        {order.legacyNumber && (
          <span className="muted" style={{ fontSize: 12 }}>
            STORIS #{order.legacyNumber}
          </span>
        )}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
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
          <span style={{ position: 'relative' }}>
            <Button
              size="sm"
              variant="primary"
              data-testid="order-documents-menu"
              aria-haspopup="menu"
              aria-expanded={docsOpen}
              onClick={() => setDocsOpen((v) => !v)}
            >
              <Printer size={13} aria-hidden /> Documents ▾
            </Button>
            {docsOpen && (
              <span
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  zIndex: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 170,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  padding: 4,
                }}
              >
                {[
                  ['invoice', 'Invoice', 'print-invoice'],
                  ['delivery-ticket', 'Delivery ticket', 'print-delivery-ticket'],
                  ['pick-list', 'Pick list', 'print-pick-list'],
                ].map(([slug, label, testid]) => (
                  <Link
                    key={slug}
                    role="menuitem"
                    href={`/print/orders/${id}/${slug}`}
                    target="_blank"
                    data-testid={testid}
                    className="no-underline"
                    style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, color: 'inherit' }}
                    onClick={() => setDocsOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </span>
            )}
          </span>
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

      {showAddProduct && (
        <ProductSearchDialog
          locationId={addSourceId || (order.stockLocationId ?? order.locationId)}
          locationName={
            locationNames.get(addSourceId || (order.stockLocationId ?? order.locationId)) ?? null
          }
          locations={locations}
          storeId={order.locationId}
          onChangeLocation={(locId) => setAddSourceId(locId)}
          onAdd={(row) => {
            setShowAddProduct(false);
            setPendingAdd(row);
            setAddPrice((row.priceCents / 100).toFixed(2));
            setAddQty('1');
          }}
          onClose={() => setShowAddProduct(false)}
        />
      )}

      {pendingAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          data-testid="add-price-dialog"
        >
          <div
            className="card"
            style={{ maxWidth: 420, width: '100%', padding: 20, background: 'var(--surface)' }}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>
              Add {pendingAdd.productName}
              {pendingAdd.variantName ? ` — ${pendingAdd.variantName}` : ''}
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
              Set the price it sells at (list <Money cents={pendingAdd.priceCents} />
              ). The payment form pre-fills with the charge after it&apos;s added.
            </p>
            <div className="grid gap-2 sm:grid-cols-2" style={{ marginBottom: 12 }}>
              <Field label="Unit price ($)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={addPrice}
                  onChange={(e) => setAddPrice(e.target.value)}
                  data-testid="add-line-price"
                  autoFocus
                />
              </Field>
              <Field label="Quantity">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  data-testid="add-line-qty"
                />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => setPendingAdd(null)} disabled={busy}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busy || !(Number(addPrice) >= 0) || !(Number(addQty) >= 1)}
                data-testid="add-line-confirm"
                onClick={() =>
                  void addLine(
                    pendingAdd,
                    Math.round(Number(addPrice) * 100),
                    Math.max(1, Math.round(Number(addQty))),
                  )
                }
              >
                Add to order
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          <Card
            title="Lines"
            style={{ marginBottom: 16 }}
            actions={
              live && !order.lockedAt ? (
                <span style={{ display: 'inline-flex', gap: 8 }}>
                  {order.lines.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        setSplitMode((v) => !v);
                        setSplitSel(new Set());
                      }}
                      data-testid="split-order"
                    >
                      {splitMode ? 'Cancel split' : 'Split order…'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void addRecyclingFee()}
                    data-testid="order-add-recycling"
                  >
                    + Recycling (${(recyclingFeeCents / 100).toFixed(2)})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    data-testid="order-add-declined-foundation"
                    onClick={async () => {
                      // Owner 2026-08-31: no-charge documentation line,
                      // same as New Sale's button.
                      setBusy(true);
                      try {
                        await api(`/v1/orders/${id}/lines`, {
                          method: 'POST',
                          body: JSON.stringify({
                            description: 'Client Declined New Foundation',
                            lineType: 'custom',
                            quantity: 1,
                            unitPriceCents: 0,
                          }),
                        });
                        await load();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : String(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    + Declined foundation ($0)
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      // Goods come off the truck: Add Product defaults to
                      // the warehouse for everyone (owner 2026-08-30).
                      const wh =
                        locations.find((l) => l.locationType === 'warehouse') ??
                        locations.find((l) => /warehouse|whse|\bwh\b/i.test(l.name));
                      setAddSourceId(wh?.id ?? order.stockLocationId ?? order.locationId);
                      setShowAddProduct(true);
                    }}
                    data-testid="order-add-product"
                  >
                    Add product
                  </Button>
                </span>
              ) : undefined
            }
          >
            {splitMode && (
              <div
                className="mb-3 flex flex-wrap items-end gap-2"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px',
                }}
                data-testid="split-bar"
              >
                <span style={{ fontSize: 13, alignSelf: 'center' }}>
                  Tick the backordered lines — they move to a new order with its own promised date.
                  Payments stay here.
                </span>
                <Field label="New promised date">
                  <Input
                    type="date"
                    value={splitDate}
                    onChange={(e) => setSplitDate(e.target.value)}
                    data-testid="split-date"
                  />
                </Field>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={busy || splitSel.size === 0}
                  onClick={() => void splitOrder()}
                  data-testid="split-confirm"
                >
                  Split {splitSel.size || ''} line{splitSel.size === 1 ? '' : 's'} to a new order
                </Button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Price $</th>
                    <th>Disc $</th>
                    <th>Fulfillment</th>
                    <th>Inventory from</th>
                    <th className="num">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((l) => (
                    <Fragment key={l.id}>
                      <tr>
                        <td>
                          {splitMode && l.quantity - l.qtyFulfilled > 0 && (
                            <input
                              type="checkbox"
                              checked={splitSel.has(l.id)}
                              style={{ accentColor: 'var(--brand)', marginRight: 8 }}
                              aria-label={`Split ${l.description} to a new order`}
                              data-testid="split-line"
                              onChange={(e) => {
                                setSplitSel((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(l.id);
                                  else next.delete(l.id);
                                  return next;
                                });
                              }}
                            />
                          )}
                          {l.description}
                          {l.lineType !== 'custom' && (
                            <div className="muted" style={{ fontSize: 11.5 }}>
                              {l.qtyReserved} reserved · {l.qtyFulfilled} fulfilled
                            </div>
                          )}
                        </td>
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
                        <td>
                          {live && !order.lockedAt ? (
                            <Input
                              key={`qty-${l.id}-${l.quantity}`}
                              type="number"
                              min={1}
                              defaultValue={l.quantity}
                              onBlur={(e) => {
                                const qty = Math.round(Number(e.target.value));
                                if (Number.isFinite(qty) && qty >= 1 && qty !== l.quantity)
                                  void patchLineField(l.id, { quantity: qty });
                              }}
                              style={{ width: 56, padding: '4px 8px' }}
                              aria-label={`Quantity for ${l.description}`}
                              data-testid="order-line-qty"
                            />
                          ) : (
                            l.quantity
                          )}
                        </td>
                        <td>
                          {live && !order.lockedAt ? (
                            <Input
                              key={`price-${l.id}-${l.unitPriceCents}`}
                              type="number"
                              step="0.01"
                              min={0}
                              defaultValue={(l.unitPriceCents / 100).toFixed(2)}
                              onBlur={(e) => {
                                const cents = Math.round(Number(e.target.value) * 100);
                                if (
                                  Number.isFinite(cents) &&
                                  cents >= 0 &&
                                  cents !== l.unitPriceCents
                                )
                                  void patchLineField(l.id, { unitPriceCents: cents });
                              }}
                              style={{ width: 84, padding: '4px 8px' }}
                              aria-label={`Unit price for ${l.description}`}
                              data-testid="order-line-price"
                            />
                          ) : (
                            <Money cents={l.unitPriceCents} />
                          )}
                        </td>
                        <td>
                          {live && !order.lockedAt ? (
                            <Input
                              key={`disc-${l.id}-${l.discountCents}`}
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder="0.00"
                              defaultValue={
                                l.discountCents ? (l.discountCents / 100).toFixed(2) : ''
                              }
                              onBlur={(e) => {
                                const cents = Math.round(Number(e.target.value || '0') * 100);
                                if (
                                  Number.isFinite(cents) &&
                                  cents >= 0 &&
                                  cents !== l.discountCents
                                )
                                  void patchLineField(l.id, { lineDiscountCents: cents });
                              }}
                              style={{ width: 70, padding: '4px 8px' }}
                              aria-label={`Discount for ${l.description}`}
                              data-testid="order-line-disc"
                            />
                          ) : l.discountCents > 0 ? (
                            <Money cents={l.discountCents} />
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {l.lineType === 'custom' ? (
                            <span className="muted" style={{ fontSize: 12 }}>
                              fee
                            </span>
                          ) : live && !order.lockedAt ? (
                            <Select
                              value={l.fulfillmentMethod ?? ''}
                              onChange={(e) =>
                                void patchLineField(l.id, {
                                  fulfillmentMethod: e.target.value || null,
                                })
                              }
                              style={{ width: 116, padding: '4px 8px', fontSize: 12 }}
                              aria-label={`Fulfillment for ${l.description}`}
                              data-testid="order-line-fulfillment"
                            >
                              <option value="">order default</option>
                              <option value="delivery">Delivery</option>
                              <option value="pickup">Customer pickup</option>
                              <option value="take_with">Take-with</option>
                              <option value="direct_ship">Direct ship</option>
                            </Select>
                          ) : (
                            (l.fulfillmentMethod ?? 'order default').replace(/_/g, ' ')
                          )}
                        </td>
                        <td>
                          {l.lineType === 'custom' ? (
                            <span className="muted" style={{ fontSize: 12 }}>
                              —
                            </span>
                          ) : live && !order.lockedAt ? (
                            <Select
                              value={
                                l.sourceLocationId ?? order.stockLocationId ?? order.locationId
                              }
                              onChange={(e) => {
                                const fallback = order.stockLocationId ?? order.locationId;
                                void patchLineField(l.id, {
                                  sourceLocationId:
                                    e.target.value === fallback ? null : e.target.value,
                                });
                              }}
                              style={{ width: 130, padding: '4px 8px', fontSize: 12 }}
                              aria-label={`Inventory source for ${l.description}`}
                              data-testid="order-line-source"
                            >
                              {[...locations]
                                .sort((a, b) =>
                                  a.locationType === b.locationType
                                    ? a.name.localeCompare(b.name)
                                    : a.locationType === 'warehouse'
                                      ? -1
                                      : 1,
                                )
                                .map((loc) => (
                                  <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                    {loc.locationType === 'warehouse' ? ' (WH)' : ''}
                                  </option>
                                ))}
                            </Select>
                          ) : (
                            (locationNames.get(
                              l.sourceLocationId ?? order.stockLocationId ?? order.locationId,
                            ) ?? '—')
                          )}
                        </td>
                        <td className="num">
                          <Money cents={l.totalCents} />
                        </td>
                        <td>
                          {live && !order.lockedAt && l.qtyFulfilled === 0 && (
                            <button
                              onClick={() => void removeLine(l)}
                              disabled={busy}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                              }}
                              aria-label={`Remove ${l.description}`}
                              title="Remove line (releases its reserved stock)"
                              data-testid="order-remove-line"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                      {l.lineType === 'stock' &&
                        l.quantity - l.qtyFulfilled - l.qtyReserved > 0 && (
                          <tr>
                            <td colSpan={9} style={{ paddingTop: 0 }}>
                              <div
                                style={{
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  fontSize: 12.5,
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                }}
                                data-testid="order-line-short"
                              >
                                {l.quantity - l.qtyFulfilled - l.qtyReserved} not reserved — not in
                                stock at the selected source location.
                              </div>
                            </td>
                          </tr>
                        )}
                    </Fragment>
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
                      <th>Reference</th>
                      <th>Status</th>
                      <th className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.payments.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.createdAt).toLocaleString()}</td>
                        <td>{p.kind}</td>
                        <td>{TENDERS.find((t) => t.value === p.method)?.label ?? p.method}</td>
                        <td className="muted" style={{ fontSize: 12.5 }}>
                          {p.processorRef ?? '—'}
                        </td>
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
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                    style={{ width: 150 }}
                    data-testid="order-pay-method"
                  >
                    {TENDERS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
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
                    style={{ width: 110 }}
                    data-testid="payment-amount"
                  />
                  {order.balanceDueCents > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPayAmount((order.balanceDueCents / 100).toFixed(2))}
                    >
                      Exact balance
                    </Button>
                  )}
                </div>
                {payMethod !== 'cash' && (
                  <Input
                    placeholder="Reference / last 4 / approval #"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    style={{ maxWidth: 420 }}
                    data-testid="payment-ref"
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
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

          {(() => {
            // Mixed fulfillment: a line's effective method is its own
            // override, else the order's type. Counter lines hand over
            // here; only delivery-bound lines ride the truck (the server
            // enforces the same split when scheduling).
            const effective = (l: OrderLine) => l.fulfillmentMethod ?? order.fulfillmentType;
            const counterLines = order.lines.filter(
              (l) =>
                l.lineType !== 'custom' &&
                l.lineType !== 'direct_ship' &&
                (effective(l) === 'take_with' || effective(l) === 'pickup') &&
                l.quantity - l.qtyFulfilled > 0,
            );
            const counterUnits = counterLines.reduce(
              (n, l) => n + (l.quantity - l.qtyFulfilled),
              0,
            );
            return (
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
                        {['scheduled', 'loaded'].includes(dv.status) && (
                          <>
                            {' · '}
                            <Input
                              key={`resched-${dv.id}-${dv.scheduledDate}`}
                              type="date"
                              defaultValue={dv.scheduledDate}
                              onBlur={async (e) => {
                                const date = e.target.value;
                                if (!date || date === dv.scheduledDate) return;
                                // Owner 2026-08-31: New Sale books the
                                // delivery; date changes happen here.
                                setBusy(true);
                                try {
                                  await api(`/v1/deliveries/${dv.id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ scheduledDate: date }),
                                  });
                                  toast.success(`Delivery moved to ${date}`);
                                  await load();
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : String(err));
                                  await load();
                                } finally {
                                  setBusy(false);
                                }
                              }}
                              style={{ width: 140, padding: '2px 6px', fontSize: 12 }}
                              aria-label="Change the delivery date"
                              data-testid="reschedule-delivery-date"
                            />
                          </>
                        )}
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
                        {counterUnits > 0 && (
                          <span
                            className="muted"
                            style={{ fontSize: 12.5, flexBasis: '100%' }}
                            data-testid="counter-lines-hint"
                          >
                            {counterUnits} unit{counterUnits === 1 ? '' : 's'} marked
                            take-with/pickup stay off the truck — use{' '}
                            <strong>Complete take-with items</strong> in the actions to hand them
                            over.
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
            );
          })()}

          <ReturnsCard order={order} busy={busy} onChanged={load} />

          <OrderNotesCard orderId={order.id} />

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
            {order.creditDueCents > 0 && (
              <div data-testid="credit-due" style={{ color: 'var(--danger)' }}>
                <Row label="Overpaid — credit" value={order.creditDueCents} bold />
              </div>
            )}
            {live &&
              order.creditDueCents > 0 &&
              (order.family ?? [])
                .filter((f) => f.balanceDueCents > 0)
                .map((f) => (
                  <Button
                    key={f.id}
                    variant="secondary"
                    onClick={() => void moveCredit(f.id, f.number)}
                    disabled={busy}
                    data-testid={`move-credit-${f.number}`}
                    style={{ marginTop: 8, width: '100%' }}
                  >
                    Move credit to {f.number} (owes <Money cents={f.balanceDueCents} />)
                  </Button>
                ))}
            {(order.family ?? []).length > 0 && (
              <p
                data-testid="split-family"
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  marginTop: 10,
                  marginBottom: 0,
                }}
              >
                Split family:{' '}
                {(order.family ?? []).map((f, i) => (
                  <span key={f.id}>
                    {i > 0 ? ' · ' : ''}
                    <Link href={`/orders/${f.id}`}>{f.number}</Link>
                  </span>
                ))}
              </p>
            )}
          </Card>

          {live && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {error && <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>{error}</p>}
              {order.status === 'draft' && (
                <Button
                  variant="primary"
                  onClick={() => void confirmDraft()}
                  disabled={busy}
                  data-testid="confirm-draft"
                >
                  <CheckCircle2 size={14} aria-hidden />
                  Confirm order — make it a live sale
                </Button>
              )}
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
              {(() => {
                // Take-with hand-over (owner 2026-08-31): visible while
                // any take-with unit is still owed on a live order.
                if (!['open', 'partially_fulfilled'].includes(order.status)) return null;
                const tw = order.lines.filter(
                  (l) =>
                    l.lineType !== 'direct_ship' &&
                    (l.fulfillmentMethod ?? order.fulfillmentType) === 'take_with' &&
                    l.quantity - l.qtyFulfilled - l.qtyReturned > 0,
                );
                if (tw.length === 0) return null;
                const pureTakeWith = order.lines.every(
                  (l) =>
                    l.lineType === 'custom' ||
                    (l.fulfillmentMethod ?? order.fulfillmentType) === 'take_with',
                );
                const shortUnits = tw
                  .filter((l) => l.variantId && l.lineType !== 'custom')
                  .reduce(
                    (n, l) => n + Math.max(0, l.quantity - l.qtyFulfilled - l.qtyReserved),
                    0,
                  );
                const waiting: string[] = [];
                if (pureTakeWith) {
                  if (shortUnits > 0)
                    waiting.push(
                      `${shortUnits} unit${shortUnits === 1 ? '' : 's'} not in stock at the source — a user with inventory access must adjust them in`,
                    );
                  if (order.balanceDueCents > 0)
                    waiting.push(`$${(order.balanceDueCents / 100).toFixed(2)} still due`);
                }
                return (
                  <>
                    {waiting.length > 0 && (
                      <div
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: 12.5,
                          padding: '6px 10px',
                          borderRadius: 6,
                        }}
                        data-testid="take-with-waiting"
                      >
                        Take-with — waiting on: {waiting.join('; ')}. Then hit Complete.
                      </div>
                    )}
                    <Button
                      variant="primary"
                      onClick={() => void completeTakeWith()}
                      disabled={busy}
                      data-testid="complete-take-with"
                    >
                      <CheckCircle2 size={14} aria-hidden />
                      Complete take-with item{tw.length === 1 ? '' : 's'}
                    </Button>
                  </>
                );
              })()}
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
              {!['quote', 'fulfilled', 'draft'].includes(order.status) && (
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
                Schedule or reschedule delivery in Deliveries &amp; fulfillment below.
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
  // Cancelling a return authorization is override-gated server-side, so
  // it needs the dialog rather than a native prompt. Declared with the
  // other state — ReturnsCard returns early below.
  const [cancellingReturnId, setCancellingReturnId] = useState<string | null>(null);
  async function loadReturns() {
    try {
      const page = await api<{
        data: {
          id: string;
          rmaNumber: string;
          status: string;
          fulfillment: string;
          refundMethod: string;
          amountCents: number;
          authorizedAt: string;
        }[];
      }>(`/v1/order-returns?orderId=${order.id}`);
      setReturns(page.data);
    } catch {
      setReturns([]);
    }
  }
  useEffect(() => {
    void loadReturns();
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
