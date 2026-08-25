'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { Plus, Printer } from 'lucide-react';
import { centsToInputString, formatMoney } from '@jetnine/shared';
import { api, apiUrl } from '@/lib/api';
import {
  cacheVariants,
  enqueueSale,
  generateIdempotencyKey,
  lookupVariantsLocally,
  pendingCount,
  readActiveBusinessId,
  syncAll,
} from '@/lib/offline';
import { useOnlineStatus } from '@/lib/use-online-status';
import { Money } from '@/components/money';
import { CustomerPicker, type CustomerRow } from '@/components/customer-picker';
import { PrintableReceipt, type ReceiptBusiness } from '@/components/printable-receipt';
import { Button, Field, Input, LinkButton, Select } from '@/components/ui';

interface LookupRow {
  variantId: string;
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  variantName: string | null;
  priceCents: number;
}
interface CartLine {
  variantId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineDiscountCents: number;
}
interface LocationRow {
  id: string;
  name: string;
  taxRateBps: number | null;
}
interface Payment {
  method: 'cash' | 'card' | 'gift_card';
  amountCents: number;
  stripePaymentMethodId?: string;
  giftCardCode?: string;
}
interface StripeStatus {
  connected: boolean;
  publishableKey: string | null;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  stubMode: boolean;
}
interface SaleResp {
  id: string;
  number: string;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  lines: { id: string; description: string; quantity: number; totalCents: number }[];
  payments: Payment[];
  completedAt: string | null;
}

export default function PosPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [taxRateBps, setTaxRateBps] = useState<number>(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderDiscount, setOrderDiscount] = useState<string>('');
  const [discountCode, setDiscountCode] = useState<string>('');
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [scan, setScan] = useState('');
  const [results, setResults] = useState<LookupRow[]>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [phase, setPhase] = useState<'cart' | 'pay' | 'done'>('cart');
  const [completedSale, setCompletedSale] = useState<SaleResp | null>(null);
  // Cash change owed on the last completed sale. The server only stores
  // the applied tender (cash never exceeds the total), so the change the
  // cashier must hand back exists only here — surfaced prominently on
  // the Sale complete screen and receipt.
  const [changeDueCents, setChangeDueCents] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [receiptBusiness, setReceiptBusiness] = useState<ReceiptBusiness | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const scanRef = useRef<HTMLInputElement>(null);
  const online = useOnlineStatus();
  const businessId = useMemo(() => readActiveBusinessId(), []);

  useEffect(() => {
    void (async () => {
      try {
        const [locs, stripe, settings] = await Promise.all([
          api<LocationRow[]>('/v1/pos/locations'),
          api<StripeStatus>('/v1/business/stripe').catch(() => null),
          api<{
            name: string;
            receiptHeader: string | null;
            receiptFooter: string | null;
            branding?: { publicName?: string | null } | null;
          }>('/v1/business/settings').catch(() => null),
        ]);
        setLocations(locs);
        if (locs.length > 0) {
          const first = locs[0]!;
          setLocationId(first.id);
          setTaxRateBps(first.taxRateBps ?? 0);
        }
        setStripeStatus(stripe);
        if (settings) {
          setReceiptBusiness({
            name: settings.branding?.publicName ?? settings.name,
            receiptHeader: settings.receiptHeader,
            receiptFooter: settings.receiptFooter,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  // Pending count + auto-sync. Drains the queue whenever the browser
  // reports we're back online; the server's idempotency layer (Phase
  // 2.9) makes replays of an already-accepted sale safe.
  useEffect(() => {
    if (!businessId) return;
    void pendingCount(businessId).then(setPendingSync);
  }, [businessId]);

  useEffect(() => {
    if (!online || !businessId) return;
    void (async () => {
      const result = await syncAll(businessId);
      const remaining = await pendingCount(businessId);
      setPendingSync(remaining);
      if (result.succeeded > 0) {
        setError(null);
      } else if (result.failed > 0 && result.errors[0]) {
        setError(`Sync error: ${result.errors[0].message}`);
      }
    })();
  }, [online, businessId]);

  useEffect(() => {
    if (phase === 'cart') scanRef.current?.focus();
  }, [phase]);

  // Live search while typing: results appear after a short pause, no
  // Enter needed. A barcode scanner still ends its burst with Enter,
  // which keeps the exact-match auto-add in handleScanSubmit. Errors
  // here are swallowed — live search is best-effort; submitting
  // surfaces them.
  useEffect(() => {
    const query = scan.trim();
    if (query.length < 2) {
      if (query.length === 0) setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          let rows: LookupRow[] = [];
          if (online) {
            rows = await api<LookupRow[]>(`/v1/pos/lookup?q=${encodeURIComponent(query)}`);
            if (businessId && rows.length > 0) void cacheVariants(businessId, rows);
          } else if (businessId) {
            const cached = await lookupVariantsLocally(businessId, query);
            rows = cached.map((v) => ({
              variantId: v.variantId,
              productId: v.productId,
              productName: v.productName,
              sku: v.sku,
              barcode: v.barcode,
              variantName: v.variantName,
              priceCents: v.priceCents,
            }));
          }
          if (!cancelled) setResults(rows);
        } catch {
          /* best-effort */
        }
      })();
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan, online, businessId]);

  const totals = useMemo(
    () => computeTotals(cart, parseDollars(orderDiscount), taxRateBps),
    [cart, orderDiscount, taxRateBps],
  );

  async function handleScanSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!scan.trim()) return;
    const query = scan.trim();
    try {
      let rows: LookupRow[];
      if (online) {
        rows = await api<LookupRow[]>(`/v1/pos/lookup?q=${encodeURIComponent(query)}`);
        // Lazy-cache hits so we can find them again offline.
        if (businessId && rows.length > 0) {
          void cacheVariants(businessId, rows);
        }
      } else if (businessId) {
        const cached = await lookupVariantsLocally(businessId, query);
        rows = cached.map((v) => ({
          variantId: v.variantId,
          productId: v.productId,
          productName: v.productName,
          sku: v.sku,
          barcode: v.barcode,
          variantName: v.variantName,
          priceCents: v.priceCents,
        }));
        if (rows.length === 0) {
          setError(
            "Offline: no cached match. Connect once to load this item, then it'll work offline.",
          );
          return;
        }
      } else {
        setError('Offline and no business selected; reconnect to continue.');
        return;
      }
      // Exact barcode match → auto-add and clear.
      if (rows.length === 1 && rows[0]!.barcode === query) {
        addToCart(rows[0]!);
        setScan('');
        setResults([]);
        return;
      }
      setResults(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function addToCart(row: LookupRow) {
    const description = [row.productName, row.variantName].filter(Boolean).join(' — ');
    setCart((prev) => {
      const found = prev.find((l) => l.variantId === row.variantId);
      if (found) {
        return prev.map((l) =>
          l.variantId === row.variantId ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          variantId: row.variantId,
          description,
          quantity: 1,
          unitPriceCents: row.priceCents,
          lineDiscountCents: 0,
        },
      ];
    });
    setResults([]);
    setScan('');
    scanRef.current?.focus();
  }

  function setQty(variantId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.variantId !== variantId));
    } else {
      setCart((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, quantity: qty } : l)));
    }
  }
  function setLineDiscount(variantId: string, dollars: string) {
    const cents = parseDollars(dollars);
    setCart((prev) =>
      prev.map((l) => (l.variantId === variantId ? { ...l, lineDiscountCents: cents } : l)),
    );
  }
  /**
   * Register-side price entry (D12): catalogs imported without retail
   * prices land at $0 and the cashier types the negotiated price here.
   * The sale line records whatever was charged, as it always has.
   */
  function setLinePrice(variantId: string, dollars: string) {
    const cents = parseDollars(dollars);
    setCart((prev) =>
      prev.map((l) => (l.variantId === variantId ? { ...l, unitPriceCents: cents } : l)),
    );
  }

  async function complete(payments: Payment[], meta?: { changeDueCents?: number }) {
    setError(null);
    setChangeDueCents(meta?.changeDueCents ?? 0);
    const body = {
      locationId,
      customerId: customer?.id ?? null,
      lines: cart.map((l) => ({
        variantId: l.variantId,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        lineDiscountCents: l.lineDiscountCents || undefined,
      })),
      // Either a manual discount or a code — never both. The code
      // path lets the API validate window/usage/min; manual is
      // owner-overrides.
      ...(discountCode.trim()
        ? { discountCode: discountCode.trim() }
        : { orderDiscountCents: parseDollars(orderDiscount) || undefined }),
      payments,
    };
    const idempotencyKey = generateIdempotencyKey();

    if (online) {
      try {
        const res = await fetch(`${apiUrl}/v1/sales`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          let message = `${res.status} ${res.statusText}`;
          try {
            const parsed = JSON.parse(text) as { message?: string };
            if (parsed.message) message = parsed.message;
          } catch {
            if (text) message = text;
          }
          throw new Error(message);
        }
        const sale = (await res.json()) as SaleResp;
        setCompletedSale(sale);
        setPhase('done');
      } catch (err) {
        // Network error mid-charge — enqueue with the *same* key so a
        // server that already accepted the original request will replay
        // its cached response, never double-charging.
        const looksLikeNetwork =
          err instanceof TypeError || (err instanceof Error && /fetch|network/i.test(err.message));
        if (looksLikeNetwork && businessId) {
          await enqueueSale({ businessId, body, idempotencyKey });
          setPendingSync(await pendingCount(businessId));
          showQueuedReceipt(body, payments, idempotencyKey);
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    } else {
      if (!businessId) {
        setError("Offline and no active business selected — can't queue the sale.");
        return;
      }
      await enqueueSale({ businessId, body, idempotencyKey });
      setPendingSync(await pendingCount(businessId));
      showQueuedReceipt(body, payments, idempotencyKey);
    }
  }

  /**
   * Render a placeholder receipt for an offline-queued sale. The fields
   * the cashier can see come straight from the cart; the totals are
   * recomputed locally so the customer-facing display matches what
   * they'll see when the sale eventually syncs. The `id` is the
   * idempotency key — it's not the server-assigned UUID, but it's
   * stable across retries and lets a cashier reconcile later.
   */
  function showQueuedReceipt(
    saleBody: { lines: { variantId: string; quantity: number; unitPriceCents: number }[] },
    payments: Payment[],
    idempotencyKey: string,
  ): void {
    const lines = cart.map((l) => ({
      id: `queued_line_${l.variantId}`,
      description: l.description,
      quantity: l.quantity,
      totalCents: l.quantity * l.unitPriceCents - (l.lineDiscountCents ?? 0),
    }));
    void saleBody;
    setCompletedSale({
      id: idempotencyKey,
      number: 'QUEUED — will sync',
      totalCents: totals.totalCents,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      taxCents: totals.taxCents,
      lines,
      payments,
      completedAt: null,
    });
    setPhase('done');
  }

  function reset() {
    setCart([]);
    setOrderDiscount('');
    setDiscountCode('');
    setCustomer(null);
    setScan('');
    setResults([]);
    setCompletedSale(null);
    setChangeDueCents(0);
    setError(null);
    setPhase('cart');
  }

  if (phase === 'done' && completedSale) {
    return (
      <Receipt
        sale={completedSale}
        onNew={reset}
        customer={customer}
        business={receiptBusiness}
        changeDueCents={changeDueCents}
      />
    );
  }

  if (phase === 'pay') {
    return (
      <PaymentScreen
        totalCents={totals.totalCents}
        onCancel={() => setPhase('cart')}
        onConfirm={complete}
        error={error}
        stripe={stripeStatus}
      />
    );
  }

  return (
    <div>
      {!online && (
        <div
          style={{
            ...banner,
            background: 'var(--warning-soft)',
            color: 'var(--warning-soft-text)',
            borderColor: 'var(--warning)',
          }}
        >
          <strong>Offline.</strong> Sales will queue locally and sync when the connection returns.
          Lookups fall back to recently-cached items.
        </div>
      )}
      {online && pendingSync > 0 && (
        <div
          style={{
            ...banner,
            background: 'var(--info-soft)',
            color: 'var(--info-soft-text)',
            borderColor: 'var(--info)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>
            Syncing {pendingSync} queued sale{pendingSync === 1 ? '' : 's'}…
          </span>
          <Link href="/pos/pending" style={{ marginLeft: 'auto', color: 'inherit' }}>
            View queue →
          </Link>
        </div>
      )}
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 22 }}>
          Register
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <label className="field-label" style={{ margin: 0 }}>
            Location:
          </label>
          <Select
            value={locationId}
            onChange={(e) => {
              setLocationId(e.target.value);
              const next = locations.find((l) => l.id === e.target.value);
              if (next) setTaxRateBps(next.taxRateBps ?? taxRateBps);
            }}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div>
          <form onSubmit={handleScanSubmit} style={{ marginBottom: 12 }}>
            <input
              ref={scanRef}
              autoFocus
              className="input"
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              placeholder="Scan barcode or type to search…"
              style={{ width: '100%', padding: '12px 14px', fontSize: 16 }}
            />
          </form>
          {results.length > 0 && (
            <div className="card" style={{ marginBottom: 12, padding: 8 }}>
              {results.map((r) => (
                <button key={r.variantId} onClick={() => addToCart(r)} style={resultBtn}>
                  <strong>{r.productName}</strong> {r.variantName && <>— {r.variantName}</>}{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <Money cents={r.priceCents} /> · {r.sku ?? '—'}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="card">
            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 16px' }}>
                Cart is empty. Scan a barcode or type to search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Disc</th>
                      <th className="num">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((l) => {
                      const lineTotal = l.quantity * l.unitPriceCents - l.lineDiscountCents;
                      return (
                        <tr key={l.variantId}>
                          <td>{l.description}</td>
                          <td>
                            <Input
                              type="number"
                              min={0}
                              value={l.quantity}
                              onChange={(e) => setQty(l.variantId, Number(e.target.value))}
                              style={qtyInput}
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              key={`${l.variantId}-${l.unitPriceCents}`}
                              defaultValue={centsToInputString(l.unitPriceCents)}
                              onBlur={(e) => setLinePrice(l.variantId, e.target.value)}
                              style={{ ...qtyInput, width: 88 }}
                              aria-label={`Unit price for ${l.description}`}
                              data-testid={`line-price-${l.variantId}`}
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder="0.00"
                              defaultValue={
                                l.lineDiscountCents ? centsToInputString(l.lineDiscountCents) : ''
                              }
                              onBlur={(e) => setLineDiscount(l.variantId, e.target.value)}
                              style={{ ...qtyInput, width: 72 }}
                            />
                          </td>
                          <td className="num">
                            <Money cents={lineTotal} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="card-title">Customer</h3>
            {customer ? (
              <p style={{ fontSize: 13, margin: 0 }}>
                <strong>
                  {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || '(no name)'}
                </strong>
                <br />
                <span className="muted">{customer.email ?? customer.phone ?? '—'}</span>
                <br />
                <Button size="sm" onClick={() => setCustomer(null)} style={{ marginTop: 6 }}>
                  Detach
                </Button>
              </p>
            ) : (
              <Button onClick={() => setShowCustomerPicker(true)}>Attach customer</Button>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Totals</h3>
            <Row label="Subtotal" value={totals.subtotalCents} />
            <Row label="Discount" value={-totals.discountCents} negate />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              <span style={{ color: 'var(--text-secondary)', minWidth: 92 }}>Discount code</span>
              <Input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="(optional)"
                style={{ ...qtyInput, width: 130, textTransform: 'uppercase' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)', minWidth: 92 }}>Order disc $</span>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(e.target.value)}
                disabled={Boolean(discountCode.trim())}
                style={{ ...qtyInput, width: 80 }}
              />
            </div>
            {discountCode.trim() && (
              <p className="muted" style={{ fontSize: 11, margin: '4px 0 0' }}>
                Code overrides the order-discount field. Final amount is computed by the server.
              </p>
            )}
            <Row label="Tax" value={totals.taxCents} />
            <Row label="Total" value={totals.totalCents} bold />
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {error && <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>{error}</p>}
            <Button
              variant="primary"
              onClick={() => setPhase('pay')}
              disabled={cart.length === 0}
              className="min-h-11"
              style={{ padding: 14, fontSize: 16 }}
            >
              Pay {formatMoney(totals.totalCents)}
            </Button>
            <Button
              onClick={() => setShowOrderDialog(true)}
              disabled={cart.length === 0}
              className="min-h-11"
              data-testid="save-as-order"
            >
              Save as order / take deposit…
            </Button>
            <Button variant="ghost" onClick={reset} className="min-h-11">
              Clear cart
            </Button>
          </div>
        </div>
      </div>

      {showCustomerPicker && (
        <CustomerPicker
          onPick={(c) => {
            setCustomer(c);
            setShowCustomerPicker(false);
          }}
          onCancel={() => setShowCustomerPicker(false)}
        />
      )}
      {showOrderDialog && (
        <SaveAsOrderDialog
          totalCents={totals.totalCents}
          customer={customer}
          onAttachCustomer={() => {
            setShowOrderDialog(false);
            setShowCustomerPicker(true);
          }}
          onCancel={() => setShowOrderDialog(false)}
          onSave={async (opts) => {
            const order = await api<{ id: string }>('/v1/orders', {
              method: 'POST',
              body: JSON.stringify({
                locationId,
                customerId: customer!.id,
                lines: cart.map((l) => ({
                  variantId: l.variantId,
                  quantity: l.quantity,
                  unitPriceCents: l.unitPriceCents,
                  lineDiscountCents: l.lineDiscountCents || undefined,
                })),
                orderDiscountCents: parseDollars(orderDiscount) || undefined,
                fulfillmentType: opts.fulfillmentType,
                requestedDate: opts.requestedDate || null,
                confirm: true,
              }),
            });
            if (opts.depositCents > 0) {
              await api(`/v1/orders/${order.id}/payments`, {
                method: 'POST',
                body: JSON.stringify({
                  method: opts.depositMethod,
                  amountCents: opts.depositCents,
                  kind: 'deposit',
                }),
              });
            }
            router.push(`/orders/${order.id}`);
          }}
        />
      )}
    </div>
  );
}

interface GiftCardTenderState {
  code: string;
  appliedCents: number;
  cardBalance: number;
}

/**
 * Reusable gift-card tender row. Cashier types/scans the code, hits
 * Apply, the widget looks the card up and stages a redemption equal to
 * `min(cardBalance, remainingDue)`. The parent owns the staged state
 * so it can subtract from its cash/card budget.
 */
function GiftCardTender({
  remainingDue,
  applied,
  onApply,
  onClear,
}: {
  remainingDue: number;
  applied: GiftCardTenderState | null;
  onApply: (state: GiftCardTenderState) => void;
  onClear: () => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function lookupAndApply() {
    setErr(null);
    setBusy(true);
    try {
      const found = await api<{
        id: string;
        code: string;
        currentBalanceCents: number;
        status: string;
        expiresAt: string | null;
      }>(`/v1/gift-cards/lookup?code=${encodeURIComponent(code.trim())}`);
      if (found.status !== 'active') {
        throw new Error(`Card is ${found.status}.`);
      }
      if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
        throw new Error('Card has expired.');
      }
      if (found.currentBalanceCents <= 0) {
        throw new Error('Card balance is zero.');
      }
      const useCents = Math.min(found.currentBalanceCents, remainingDue);
      if (useCents <= 0) {
        throw new Error('Cart is fully paid; remove other tenders first.');
      }
      onApply({
        code: found.code,
        appliedCents: useCents,
        cardBalance: found.currentBalanceCents,
      });
      setCode('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <div
        style={{
          background: 'var(--success-soft)',
          border: '1px solid var(--success)',
          color: 'var(--success-soft-text)',
          padding: 8,
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1 }}>
            Gift card <code>{applied.code}</code>: applying{' '}
            <strong>
              <Money cents={applied.appliedCents} />
            </strong>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              (of <Money cents={applied.cardBalance} />)
            </span>
          </span>
          <Button size="sm" onClick={onClear}>
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <span className="field-label" style={{ marginBottom: 0 }}>
        Gift card
      </span>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <Input
          type="text"
          placeholder="Card code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && code.trim()) {
              e.preventDefault();
              void lookupAndApply();
            }
          }}
          style={{ fontFamily: 'var(--font-mono)', flex: 1 }}
        />
        <Button
          variant="primary"
          onClick={() => void lookupAndApply()}
          disabled={busy || !code.trim() || remainingDue <= 0}
          className="min-h-11"
        >
          {busy ? '…' : 'Apply'}
        </Button>
      </div>
      {err && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{err}</p>}
    </div>
  );
}

function PaymentScreen({
  totalCents,
  onCancel,
  onConfirm,
  error,
  stripe,
}: {
  totalCents: number;
  onCancel: () => void;
  onConfirm: (payments: Payment[], meta?: { changeDueCents?: number }) => Promise<void>;
  error: string | null;
  stripe: StripeStatus | null;
}) {
  const useStripeElements = Boolean(
    stripe?.connected && stripe.publishableKey && stripe.chargesEnabled,
  );
  const [stripePromise, setStripePromise] = useState<Promise<StripeJs | null> | null>(null);

  useEffect(() => {
    if (useStripeElements && stripe?.publishableKey && stripe.stripeAccountId) {
      setStripePromise(
        loadStripe(stripe.publishableKey, { stripeAccount: stripe.stripeAccountId }),
      );
    }
  }, [useStripeElements, stripe?.publishableKey, stripe?.stripeAccountId]);

  if (useStripeElements) {
    if (!stripePromise) {
      return <p className="muted">Loading card form…</p>;
    }
    return (
      <Elements stripe={stripePromise}>
        <StripePaymentForm
          totalCents={totalCents}
          onCancel={onCancel}
          onConfirm={onConfirm}
          error={error}
          stub={stripe?.stubMode ?? false}
        />
      </Elements>
    );
  }

  return (
    <ManualPaymentForm
      totalCents={totalCents}
      onCancel={onCancel}
      onConfirm={onConfirm}
      error={error}
      stripeConnected={Boolean(stripe?.connected)}
    />
  );
}

function ManualPaymentForm({
  totalCents,
  onCancel,
  onConfirm,
  error,
  stripeConnected,
}: {
  totalCents: number;
  onCancel: () => void;
  onConfirm: (payments: Payment[], meta?: { changeDueCents?: number }) => Promise<void>;
  error: string | null;
  stripeConnected: boolean;
}) {
  const [cashStr, setCashStr] = useState('');
  const [cardStr, setCardStr] = useState('');
  const [gift, setGift] = useState<GiftCardTenderState | null>(null);
  const [busy, setBusy] = useState(false);
  const giftApplied = gift?.appliedCents ?? 0;
  const remainingAfterGift = Math.max(0, totalCents - giftApplied);
  const cash = parseDollars(cashStr);
  const cardCents = parseDollars(cardStr);
  const tendered = cash + cardCents;
  const change = Math.max(0, tendered - remainingAfterGift);
  const cashApplied = Math.max(0, cash - change);
  const ready =
    cashApplied + cardCents === remainingAfterGift &&
    cashApplied + cardCents + giftApplied === totalCents;

  async function submit() {
    setBusy(true);
    const payments: Payment[] = [];
    if (giftApplied > 0 && gift)
      payments.push({ method: 'gift_card', amountCents: giftApplied, giftCardCode: gift.code });
    if (cashApplied > 0) payments.push({ method: 'cash', amountCents: cashApplied });
    if (cardCents > 0) payments.push({ method: 'card', amountCents: cardCents });
    await onConfirm(payments, { changeDueCents: change });
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 className="page-title" style={{ fontSize: 22, marginBottom: 16 }}>
        Payment
      </h1>
      <div className="card">
        <div style={{ fontSize: 14, marginBottom: 12 }}>
          Total due:{' '}
          <strong>
            <Money cents={totalCents} />
          </strong>
          {giftApplied > 0 && (
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
              · After gift card: <Money cents={remainingAfterGift} />
            </span>
          )}
        </div>
        <GiftCardTender
          remainingDue={remainingAfterGift + (gift?.appliedCents ?? 0)}
          applied={gift}
          onApply={setGift}
          onClear={() => setGift(null)}
        />
        <Field label="Cash tendered ($)" style={{ marginBottom: 10 }}>
          <Input
            autoFocus
            type="number"
            step="0.01"
            min={0}
            value={cashStr}
            onChange={(e) => setCashStr(e.target.value)}
            style={{ width: '100%', fontSize: 16 }}
          />
        </Field>
        <Field label="Card ($)">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={cardStr}
            onChange={(e) => setCardStr(e.target.value)}
            style={{ width: '100%', fontSize: 16 }}
          />
        </Field>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {stripeConnected
            ? 'Stripe is connected but charges are disabled — finish onboarding in Stripe to enable real card capture.'
            : 'Card payments are recorded as manual captures. Connect Stripe in Settings → Billing for real card processing.'}
        </p>
        <div style={{ fontSize: 14, marginTop: 12 }}>
          Tendered: {formatMoney(tendered)} · Change: {formatMoney(change)}
        </div>
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={submit}
          disabled={!ready || busy}
          className="min-h-11"
          style={{ padding: 14, fontSize: 16, flex: 1 }}
        >
          {busy ? 'Processing…' : 'Confirm payment'}
        </Button>
        <Button onClick={onCancel} className="min-h-11">
          Back to cart
        </Button>
      </div>
    </div>
  );
}

function StripePaymentForm({
  totalCents,
  onCancel,
  onConfirm,
  error,
  stub,
}: {
  totalCents: number;
  onCancel: () => void;
  onConfirm: (payments: Payment[], meta?: { changeDueCents?: number }) => Promise<void>;
  error: string | null;
  stub: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cashStr, setCashStr] = useState('');
  const [gift, setGift] = useState<GiftCardTenderState | null>(null);
  const [busy, setBusy] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const giftApplied = gift?.appliedCents ?? 0;
  const remainingAfterGift = Math.max(0, totalCents - giftApplied);
  const cash = parseDollars(cashStr);
  const cashApplied = Math.min(cash, remainingAfterGift);
  const cardCents = Math.max(0, remainingAfterGift - cashApplied);
  const change = Math.max(0, cash - cashApplied);

  async function submit() {
    setBusy(true);
    setCardError(null);
    try {
      const payments: Payment[] = [];
      if (giftApplied > 0 && gift)
        payments.push({ method: 'gift_card', amountCents: giftApplied, giftCardCode: gift.code });
      if (cashApplied > 0) payments.push({ method: 'cash', amountCents: cashApplied });

      if (cardCents > 0) {
        if (!stripe || !elements) throw new Error('Stripe is still initializing — try again.');
        const cardEl = elements.getElement(CardElement);
        if (!cardEl) throw new Error('Card element not mounted.');
        // In stub mode the API ignores the value but expects something
        // truthy; createPaymentMethod fails offline so we synthesize.
        let pmId: string;
        if (stub) {
          pmId = 'pm_card_stub';
        } else {
          const res = await stripe.createPaymentMethod({ type: 'card', card: cardEl });
          if (res.error || !res.paymentMethod) {
            throw new Error(res.error?.message ?? 'Could not collect card details');
          }
          pmId = res.paymentMethod.id;
        }
        payments.push({
          method: 'card',
          amountCents: cardCents,
          stripePaymentMethodId: pmId,
        });
      }

      await onConfirm(payments, { changeDueCents: change });
    } catch (err) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 className="page-title" style={{ fontSize: 22, marginBottom: 16 }}>
        Payment
      </h1>
      <div className="card">
        <div style={{ fontSize: 14, marginBottom: 12 }}>
          Total due:{' '}
          <strong>
            <Money cents={totalCents} />
          </strong>
          {giftApplied > 0 && (
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
              · After gift card: <Money cents={remainingAfterGift} />
            </span>
          )}
        </div>
        <GiftCardTender
          remainingDue={remainingAfterGift + (gift?.appliedCents ?? 0)}
          applied={gift}
          onApply={setGift}
          onClear={() => setGift(null)}
        />
        <Field label="Cash tendered ($)">
          <Input
            autoFocus
            type="number"
            step="0.01"
            min={0}
            value={cashStr}
            onChange={(e) => setCashStr(e.target.value)}
            style={{ width: '100%', fontSize: 16 }}
          />
        </Field>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Cash applied: {formatMoney(cashApplied)} · Change: {formatMoney(change)} · Card to charge:{' '}
          <strong>
            <Money cents={cardCents} />
          </strong>
        </p>

        {cardCents > 0 && (
          <div style={{ marginTop: 12 }}>
            <span className="field-label" style={{ marginBottom: 0 }}>
              Card details
            </span>
            <div
              style={{
                padding: '10px 8px',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                marginTop: 4,
              }}
            >
              <CardElement options={{ hidePostalCode: false }} />
            </div>
            {stub && (
              <p style={{ fontSize: 11, color: 'var(--warning-soft-text)', marginTop: 6 }}>
                Stub mode — any input accepts. Set STRIPE_SECRET_KEY for real cards.
              </p>
            )}
          </div>
        )}
      </div>
      {(error || cardError) && (
        <p style={{ color: 'var(--danger)', fontSize: 13 }}>{cardError ?? error}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={submit}
          disabled={busy}
          className="min-h-11"
          style={{ padding: 14, fontSize: 16, flex: 1 }}
        >
          {busy ? 'Processing…' : `Charge ${formatMoney(cardCents)}`}
        </Button>
        <Button onClick={onCancel} className="min-h-11">
          Back to cart
        </Button>
      </div>
    </div>
  );
}

function Receipt({
  sale,
  customer,
  business,
  onNew,
  changeDueCents = 0,
}: {
  sale: SaleResp;
  customer: CustomerRow | null;
  business: ReceiptBusiness | null;
  onNew: () => void;
  changeDueCents?: number;
}) {
  const isQueued = sale.number.startsWith('QUEUED');
  return (
    <div style={{ maxWidth: 420 }}>
      <h1 className="page-title" style={{ fontSize: 22, marginBottom: 8 }}>
        Sale complete
      </h1>
      <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
        <code>{sale.number}</code>
      </p>
      {changeDueCents > 0 && (
        <div
          data-testid="change-due"
          style={{
            background: 'var(--success-soft)',
            color: 'var(--success-soft-text, var(--success))',
            border: '1px solid var(--success)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Change due: {formatMoney(changeDueCents)}
        </div>
      )}
      {!isQueued && (
        <PrintableReceipt
          sale={{
            number: sale.number,
            completedAt: sale.completedAt,
            subtotalCents: sale.subtotalCents,
            discountCents: sale.discountCents,
            taxCents: sale.taxCents,
            totalCents: sale.totalCents,
            lines: sale.lines.map((l) => ({
              description: l.description,
              quantity: l.quantity,
              totalCents: l.totalCents,
            })),
            payments: sale.payments,
            changeDueCents,
          }}
          business={business}
        />
      )}
      <div className="card">
        {customer && (
          <p style={{ fontSize: 13 }}>
            {[customer.firstName, customer.lastName].filter(Boolean).join(' ')}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="table">
            <tbody>
              {sale.lines.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.description} <span className="muted">×{l.quantity}</span>
                  </td>
                  <td className="num">
                    <Money cents={l.totalCents} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Subtotal</td>
                <td className="num">
                  <Money cents={sale.subtotalCents} />
                </td>
              </tr>
              {sale.discountCents > 0 && (
                <tr>
                  <td>Discount</td>
                  <td className="num">
                    <Money cents={-sale.discountCents} />
                  </td>
                </tr>
              )}
              <tr>
                <td>Tax</td>
                <td className="num">
                  <Money cents={sale.taxCents} />
                </td>
              </tr>
              <tr style={{ fontWeight: 700 }}>
                <td>Total</td>
                <td className="num">
                  <Money cents={sale.totalCents} />
                </td>
              </tr>
              {sale.payments.map((p, i) => (
                <tr key={i} style={{ color: 'var(--text-secondary)' }}>
                  <td>
                    {p.method === 'cash' ? 'Cash' : p.method === 'gift_card' ? 'Gift card' : 'Card'}
                  </td>
                  <td className="num">
                    <Money cents={p.amountCents} />
                  </td>
                </tr>
              ))}
              {changeDueCents > 0 && (
                <tr style={{ fontWeight: 700 }}>
                  <td>Change due</td>
                  <td className="num">
                    <Money cents={changeDueCents} />
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => window.print()}
          disabled={isQueued}
          className="min-h-11 inline-flex items-center gap-1.5"
          title={isQueued ? 'Sale is still queued; print after it syncs' : ''}
        >
          <Printer size={14} /> Print receipt
        </Button>
        {!isQueued && <LinkButton href={`/sales/${sale.id}`}>Open sale</LinkButton>}
        <Button
          variant="ghost"
          onClick={onNew}
          className="min-h-11 inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> New sale
        </Button>
      </div>
    </div>
  );
}

/**
 * "Save as order / take deposit" (STORIS cutover Day 2). Turns the
 * register's cart into a confirmed sales order — the everyday flow for
 * a mattress sale: write it now, deliver later, take money down today.
 * Confirming commits stock immediately; the deposit posts as an order
 * payment, so the drawer math picks it up when Day 3's report union
 * lands.
 */
function SaveAsOrderDialog({
  totalCents,
  customer,
  onAttachCustomer,
  onCancel,
  onSave,
}: {
  totalCents: number;
  customer: CustomerRow | null;
  onAttachCustomer: () => void;
  onCancel: () => void;
  onSave: (opts: {
    fulfillmentType: 'delivery' | 'pickup';
    requestedDate: string;
    depositCents: number;
    depositMethod: 'cash' | 'external_card' | 'check';
  }) => Promise<void>;
}) {
  const suggested = Math.ceil((totalCents * 2500) / 10000);
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [requestedDate, setRequestedDate] = useState('');
  const [deposit, setDeposit] = useState(centsToInputString(suggested));
  const [depositMethod, setDepositMethod] = useState<'cash' | 'external_card' | 'check'>('cash');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await onSave({
        fulfillmentType,
        requestedDate,
        depositCents: parseDollars(deposit),
        depositMethod,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div style={modalBackdrop}>
      <div style={{ ...modal, maxWidth: 420 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 4px' }}>Save as order</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0 }}>
          Order total {formatMoney(totalCents)}. Confirming commits stock now; the balance is
          collected at fulfillment.
        </p>
        {!customer ? (
          <div>
            <p style={{ fontSize: 13, color: 'var(--warning-soft-text)' }}>
              An order needs a customer attached first.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={onAttachCustomer}
                data-testid="order-attach-customer"
              >
                Attach customer
              </Button>
              <Button variant="ghost" onClick={onCancel}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Fulfillment">
                <Select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value as 'delivery' | 'pickup')}
                  style={{ width: '100%' }}
                >
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </Select>
              </Field>
              <Field label="Promised date">
                <Input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Deposit today ($)">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  style={{ width: '100%' }}
                  data-testid="order-deposit"
                />
              </Field>
              <Field label="Deposit method">
                <Select
                  value={depositMethod}
                  onChange={(e) =>
                    setDepositMethod(e.target.value as 'cash' | 'external_card' | 'check')
                  }
                  style={{ width: '100%' }}
                >
                  <option value="cash">Cash</option>
                  <option value="external_card">Card (external terminal)</option>
                  <option value="check">Check</option>
                </Select>
              </Field>
            </div>
            <p className="muted" style={{ fontSize: 11, margin: 0 }}>
              Suggested deposit: {formatMoney(suggested)} (25% down). Set 0 to hold the order
              without money — it still commits stock.
            </p>
            {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => void save()}
                disabled={busy}
                data-testid="order-save-confirm"
              >
                {parseDollars(deposit) > 0
                  ? `Save order & take ${formatMoney(parseDollars(deposit))}`
                  : 'Save order'}
              </Button>
              <Button variant="ghost" onClick={onCancel} disabled={busy}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function computeTotals(cart: CartLine[], orderDiscountCents: number, taxRateBps: number) {
  let gross = 0;
  let lineDiscount = 0;
  for (const l of cart) {
    const lineGross = l.quantity * l.unitPriceCents;
    gross += lineGross;
    lineDiscount += Math.min(l.lineDiscountCents, lineGross);
  }
  const subtotalAfterLines = gross - lineDiscount;
  const orderDisc = Math.min(orderDiscountCents, subtotalAfterLines);
  const taxable = subtotalAfterLines - orderDisc;
  const taxCents = Math.round((taxable * taxRateBps) / 10000);
  return {
    subtotalCents: gross,
    discountCents: lineDiscount + orderDisc,
    taxCents,
    totalCents: taxable + taxCents,
  };
}

function parseDollars(s: string): number {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

const banner = {
  border: '1px solid',
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  marginBottom: 12,
  fontSize: 13,
} as const;
const qtyInput = { width: 56, padding: '5px 6px' } as const;
const resultBtn = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '10px 12px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  marginBottom: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'var(--font)',
  color: 'var(--text)',
} as const;
const modalBackdrop = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
} as const;
const modal = {
  background: 'var(--surface)',
  padding: 20,
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-lg)',
  width: '90%',
} as const;

function Row({
  label,
  value,
  bold,
  negate,
}: {
  label: string;
  value: number;
  bold?: boolean;
  negate?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: bold ? 700 : 400,
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 4,
      }}
    >
      <span>{label}</span>
      <span>
        <Money cents={negate ? -Math.abs(value) : Math.abs(value)} />
      </span>
    </div>
  );
}
