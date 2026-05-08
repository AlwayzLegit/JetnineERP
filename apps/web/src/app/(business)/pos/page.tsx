'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
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
import { PrintableReceipt, type ReceiptBusiness } from '@/components/printable-receipt';

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
interface CustomerRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
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
  const [phase, setPhase] = useState<'cart' | 'pay' | 'done'>('cart');
  const [completedSale, setCompletedSale] = useState<SaleResp | null>(null);
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
          api<{ name: string; receiptHeader: string | null; receiptFooter: string | null }>(
            '/v1/business/settings',
          ).catch(() => null),
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
            name: settings.name,
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

  async function complete(payments: Payment[]) {
    setError(null);
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
    setError(null);
    setPhase('cart');
  }

  if (phase === 'done' && completedSale) {
    return (
      <Receipt sale={completedSale} onNew={reset} customer={customer} business={receiptBusiness} />
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
            background: '#fff8e1',
            border: '1px solid #f0a000',
            color: '#5a3500',
            padding: '8px 12px',
            borderRadius: 6,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <strong>Offline.</strong> Sales will queue locally and sync when the connection returns.
          Lookups fall back to recently-cached items.
        </div>
      )}
      {online && pendingSync > 0 && (
        <div
          style={{
            background: '#e8f4fd',
            border: '1px solid #4a90d9',
            color: '#1a4870',
            padding: '8px 12px',
            borderRadius: 6,
            marginBottom: 12,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>
            Syncing {pendingSync} queued sale{pendingSync === 1 ? '' : 's'}…
          </span>
          <Link href="/pos/pending" style={{ marginLeft: 'auto', color: '#1a4870' }}>
            View queue →
          </Link>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Register</h1>
        <div style={{ marginLeft: 'auto', fontSize: 13 }}>
          <label style={{ marginRight: 6, color: '#666' }}>Location:</label>
          <select
            value={locationId}
            onChange={(e) => {
              setLocationId(e.target.value);
              const next = locations.find((l) => l.id === e.target.value);
              if (next) setTaxRateBps(next.taxRateBps ?? taxRateBps);
            }}
            style={{ padding: '4px 8px', fontSize: 13 }}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <form onSubmit={handleScanSubmit} style={{ marginBottom: 12 }}>
            <input
              ref={scanRef}
              autoFocus
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              placeholder="Scan barcode or type to search…"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: 16,
                border: '2px solid #111',
                borderRadius: 4,
              }}
            />
          </form>
          {results.length > 0 && (
            <div style={{ ...card, marginBottom: 12 }}>
              {results.map((r) => (
                <button
                  key={r.variantId}
                  onClick={() => addToCart(r)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 8,
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 4,
                    marginBottom: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <strong>{r.productName}</strong> {r.variantName && <>— {r.variantName}</>}{' '}
                  <span style={{ color: '#666' }}>
                    <Money cents={r.priceCents} /> · {r.sku ?? '—'}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div style={card}>
            {cart.length === 0 ? (
              <p style={{ color: '#888', margin: 0, fontSize: 13 }}>
                Cart is empty. Scan a barcode or type to search.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <Th>Item</Th>
                    <Th>Qty</Th>
                    <Th>Price</Th>
                    <Th>Disc</Th>
                    <Th align="right">Line</Th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((l) => {
                    const lineTotal = l.quantity * l.unitPriceCents - l.lineDiscountCents;
                    return (
                      <tr key={l.variantId} style={{ borderBottom: '1px solid #f3f3f3' }}>
                        <Td>{l.description}</Td>
                        <Td>
                          <input
                            type="number"
                            min={0}
                            value={l.quantity}
                            onChange={(e) => setQty(l.variantId, Number(e.target.value))}
                            style={qtyInput}
                          />
                        </Td>
                        <Td>
                          <Money cents={l.unitPriceCents} />
                        </Td>
                        <Td>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="0.00"
                            defaultValue={
                              l.lineDiscountCents ? centsToInputString(l.lineDiscountCents) : ''
                            }
                            onBlur={(e) => setLineDiscount(l.variantId, e.target.value)}
                            style={{ ...qtyInput, width: 60 }}
                          />
                        </Td>
                        <Td align="right">
                          <Money cents={lineTotal} />
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <div style={card}>
            <h3 style={section}>Customer</h3>
            {customer ? (
              <p style={{ fontSize: 13, margin: 0 }}>
                <strong>
                  {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || '(no name)'}
                </strong>
                <br />
                <span style={{ color: '#666' }}>{customer.email ?? customer.phone ?? '—'}</span>
                <br />
                <button
                  onClick={() => setCustomer(null)}
                  style={{ ...linkBtn, marginTop: 6, fontSize: 12 }}
                >
                  Detach
                </button>
              </p>
            ) : (
              <button onClick={() => setShowCustomerPicker(true)} style={linkBtn}>
                Attach customer
              </button>
            )}
          </div>

          <div style={card}>
            <h3 style={section}>Totals</h3>
            <Row label="Subtotal" value={totals.subtotalCents} />
            <Row label="Discount" value={-totals.discountCents} negate />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span style={{ color: '#666', minWidth: 92 }}>Discount code</span>
              <input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="(optional)"
                style={{ ...qtyInput, width: 130, textTransform: 'uppercase' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#666', minWidth: 92 }}>Order disc $</span>
              <input
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
              <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>
                Code overrides the order-discount field. Final amount is computed by the server.
              </p>
            )}
            <Row label="Tax" value={totals.taxCents} />
            <Row label="Total" value={totals.totalCents} bold />
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {error && <p style={{ color: '#b00', margin: 0, fontSize: 13 }}>{error}</p>}
            <button
              onClick={() => setPhase('pay')}
              disabled={cart.length === 0}
              style={{ ...primaryBtn, padding: '14px', fontSize: 16 }}
            >
              Pay {formatMoney(totals.totalCents)}
            </button>
            <button onClick={reset} style={linkBtn}>
              Clear cart
            </button>
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
          background: '#f4faf4',
          border: '1px solid #cfe2cf',
          padding: 8,
          borderRadius: 4,
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
            <span style={{ color: '#666' }}>
              (of <Money cents={applied.cardBalance} />)
            </span>
          </span>
          <button onClick={onClear} style={linkBtn}>
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ color: '#555', fontSize: 12 }}>Gift card</span>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <input
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
          style={{ ...fieldStyle, fontFamily: 'ui-monospace, monospace', flex: 1 }}
        />
        <button
          type="button"
          onClick={() => void lookupAndApply()}
          disabled={busy || !code.trim() || remainingDue <= 0}
          style={{ ...primaryBtn, padding: '6px 12px', fontSize: 13 }}
        >
          {busy ? '…' : 'Apply'}
        </button>
      </div>
      {err && <p style={{ color: '#b00', fontSize: 12, marginTop: 4 }}>{err}</p>}
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
  onConfirm: (payments: Payment[]) => Promise<void>;
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
      return <p>Loading card form…</p>;
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
  onConfirm: (payments: Payment[]) => Promise<void>;
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
    await onConfirm(payments);
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Payment</h1>
      <div style={card}>
        <div style={{ fontSize: 14, marginBottom: 12 }}>
          Total due:{' '}
          <strong>
            <Money cents={totalCents} />
          </strong>
          {giftApplied > 0 && (
            <span style={{ color: '#666', marginLeft: 8 }}>
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
          <input
            autoFocus
            type="number"
            step="0.01"
            min={0}
            value={cashStr}
            onChange={(e) => setCashStr(e.target.value)}
            style={fieldStyle}
          />
        </Field>
        <Field label="Card ($)">
          <input
            type="number"
            step="0.01"
            min={0}
            value={cardStr}
            onChange={(e) => setCardStr(e.target.value)}
            style={fieldStyle}
          />
        </Field>
        <p style={{ fontSize: 12, color: '#666' }}>
          {stripeConnected
            ? 'Stripe is connected but charges are disabled — finish onboarding in Stripe to enable real card capture.'
            : 'Card payments are recorded as manual captures. Connect Stripe in Settings → Billing for real card processing.'}
        </p>
        <div style={{ fontSize: 14, marginTop: 12 }}>
          Tendered: {formatMoney(tendered)} · Change: {formatMoney(change)}
        </div>
      </div>
      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={submit}
          disabled={!ready || busy}
          style={{ ...primaryBtn, padding: '14px', fontSize: 16, flex: 1 }}
        >
          {busy ? 'Processing…' : 'Confirm payment'}
        </button>
        <button onClick={onCancel} style={linkBtn}>
          Back to cart
        </button>
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
  onConfirm: (payments: Payment[]) => Promise<void>;
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

      await onConfirm(payments);
    } catch (err) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Payment</h1>
      <div style={card}>
        <div style={{ fontSize: 14, marginBottom: 12 }}>
          Total due:{' '}
          <strong>
            <Money cents={totalCents} />
          </strong>
          {giftApplied > 0 && (
            <span style={{ color: '#666', marginLeft: 8 }}>
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
          <input
            autoFocus
            type="number"
            step="0.01"
            min={0}
            value={cashStr}
            onChange={(e) => setCashStr(e.target.value)}
            style={fieldStyle}
          />
        </Field>
        <p style={{ fontSize: 12, color: '#666' }}>
          Cash applied: {formatMoney(cashApplied)} · Change: {formatMoney(change)} · Card to charge:{' '}
          <strong>
            <Money cents={cardCents} />
          </strong>
        </p>

        {cardCents > 0 && (
          <div style={{ marginTop: 12 }}>
            <span style={{ color: '#555', fontSize: 12 }}>Card details</span>
            <div
              style={{
                padding: '10px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                marginTop: 4,
              }}
            >
              <CardElement options={{ hidePostalCode: false }} />
            </div>
            {stub && (
              <p style={{ fontSize: 11, color: '#7a4a00', marginTop: 6 }}>
                Stub mode — any input accepts. Set STRIPE_SECRET_KEY for real cards.
              </p>
            )}
          </div>
        )}
      </div>
      {(error || cardError) && <p style={{ color: '#b00', fontSize: 13 }}>{cardError ?? error}</p>}
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={submit}
          disabled={busy}
          style={{ ...primaryBtn, padding: '14px', fontSize: 16, flex: 1 }}
        >
          {busy ? 'Processing…' : `Charge ${formatMoney(cardCents)}`}
        </button>
        <button onClick={onCancel} style={linkBtn}>
          Back to cart
        </button>
      </div>
    </div>
  );
}

function Receipt({
  sale,
  customer,
  business,
  onNew,
}: {
  sale: SaleResp;
  customer: CustomerRow | null;
  business: ReceiptBusiness | null;
  onNew: () => void;
}) {
  const isQueued = sale.number.startsWith('QUEUED');
  return (
    <div style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Sale complete</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
        <code>{sale.number}</code>
      </p>
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
          }}
          business={business}
        />
      )}
      <div style={card}>
        {customer && (
          <p style={{ fontSize: 13 }}>
            {[customer.firstName, customer.lastName].filter(Boolean).join(' ')}
          </p>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {sale.lines.map((l) => (
              <tr key={l.id}>
                <Td>
                  {l.description} <span style={{ color: '#888' }}>×{l.quantity}</span>
                </Td>
                <Td align="right">
                  <Money cents={l.totalCents} />
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <Td>Subtotal</Td>
              <Td align="right">
                <Money cents={sale.subtotalCents} />
              </Td>
            </tr>
            {sale.discountCents > 0 && (
              <tr>
                <Td>Discount</Td>
                <Td align="right">
                  <Money cents={-sale.discountCents} />
                </Td>
              </tr>
            )}
            <tr>
              <Td>Tax</Td>
              <Td align="right">
                <Money cents={sale.taxCents} />
              </Td>
            </tr>
            <tr style={{ fontWeight: 700 }}>
              <Td>Total</Td>
              <Td align="right">
                <Money cents={sale.totalCents} />
              </Td>
            </tr>
            {sale.payments.map((p, i) => (
              <tr key={i} style={{ color: '#666' }}>
                <Td>
                  {p.method === 'cash' ? 'Cash' : p.method === 'gift_card' ? 'Gift card' : 'Card'}
                </Td>
                <Td align="right">
                  <Money cents={p.amountCents} />
                </Td>
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={() => window.print()}
          disabled={isQueued}
          title={isQueued ? 'Sale is still queued; print after it syncs' : ''}
          style={isQueued ? { ...primaryBtn, opacity: 0.5, cursor: 'not-allowed' } : primaryBtn}
        >
          Print receipt
        </button>
        {!isQueued && (
          <Link href={`/sales/${sale.id}`} style={{ ...linkBtn, textDecoration: 'none' }}>
            Open sale
          </Link>
        )}
        <button onClick={onNew} style={linkBtn}>
          New sale
        </button>
      </div>
    </div>
  );
}

function CustomerPicker({
  onPick,
  onCancel,
}: {
  onPick: (c: CustomerRow) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    try {
      const res = await api<{ data: CustomerRow[]; nextCursor: string | null }>(
        `/v1/customers?q=${encodeURIComponent(q)}`,
      );
      setRows(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createNew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const data = new FormData(e.currentTarget);
      const created = await api<CustomerRow>('/v1/customers', {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.get('firstName') || null,
          lastName: data.get('lastName') || null,
          email: data.get('email') || null,
          phone: data.get('phone') || null,
        }),
      });
      onPick(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={modalBackdrop}>
      <div style={{ ...modal, maxWidth: 480 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Attach customer</h2>
        {creating ? (
          <form onSubmit={createNew} style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input name="firstName" placeholder="First name" style={fieldStyle} />
              <input name="lastName" placeholder="Last name" style={fieldStyle} />
            </div>
            <input name="email" type="email" placeholder="Email" style={fieldStyle} />
            <input name="phone" placeholder="Phone" style={fieldStyle} />
            {error && <p style={{ color: '#b00', fontSize: 12, margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={primaryBtn}>
                Create & attach
              </button>
              <button type="button" onClick={() => setCreating(false)} style={linkBtn}>
                Back
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void search();
                }}
                placeholder="Search by name, email, or phone"
                style={{ ...fieldStyle, flex: 1 }}
              />
              <button onClick={search} style={linkBtn}>
                Search
              </button>
            </div>
            <div style={{ maxHeight: 240, overflow: 'auto' }}>
              {rows.length === 0 && (
                <p style={{ color: '#888', fontSize: 13, margin: 0 }}>No matches.</p>
              )}
              {rows.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onPick(c)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 8,
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 4,
                    marginBottom: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <strong>
                    {[c.firstName, c.lastName].filter(Boolean).join(' ') || '(no name)'}
                  </strong>{' '}
                  <span style={{ color: '#666' }}>{c.email ?? c.phone ?? ''}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={() => setCreating(true)} style={linkBtn}>
                + New customer
              </button>
              <button onClick={onCancel} style={linkBtn}>
                Cancel
              </button>
            </div>
          </>
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

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
const section = { fontSize: 14, marginBottom: 8, marginTop: 0 } as const;
const fieldStyle = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
} as const;
const qtyInput = { ...fieldStyle, width: 50, padding: '4px 6px' } as const;
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
  background: '#fff',
  padding: 20,
  borderRadius: 6,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  width: '90%',
} as const;

function Th({ children, align }: { children: React.ReactNode; align?: 'right' | 'left' }) {
  return (
    <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: align ?? 'left' }}>{children}</th>
  );
}
function Td({ children, align }: { children: React.ReactNode; align?: 'right' | 'left' }) {
  return <td style={{ padding: '6px 4px', textAlign: align ?? 'left' }}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
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
