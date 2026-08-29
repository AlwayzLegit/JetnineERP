'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Repeat, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
} from '@/components/ui';

interface OrderLine {
  id: string;
  variantId: string | null;
  description: string;
  quantity: number;
  qtyFulfilled: number;
  qtyReturned: number;
  unitPriceCents: number;
  totalCents: number;
  taxCents: number;
}
interface OrderDetail {
  id: string;
  number: string;
  status: string;
  customerId: string;
  locationId: string;
  lines: OrderLine[];
}
interface VariantHit {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  priceCents: number;
}
interface SaleLine {
  variantId: string;
  description: string;
  quantity: number;
  /** List price for the on-screen estimate; the order prices server-side. */
  priceCents: number;
  /** '' = the order's location; anything else ships as sourceLocationId. */
  sourceLocationId: string;
}
interface ReasonCode {
  id: string;
  code: string;
  description: string | null;
}
interface LocationRow {
  id: string;
  name: string;
  locationType?: string;
}
const TENDERS = [
  { value: 'card', label: 'Credit card' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'zelle', label: 'Zelle' },
] as const;

/**
 * Enter an Exchange (docs/erp-exchange): pick what comes back from the
 * original order, pick the replacement, and the credit nets against the
 * new sale in one settlement. Composes the existing surfaces: the
 * replacement order, the return authorization, and the exchange
 * container that binds them.
 */
function NewExchangeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const originalOrderId = params.get('originalOrderId') ?? '';

  const [orderNumberQuery, setOrderNumberQuery] = useState('');
  const [original, setOriginal] = useState<OrderDetail | null>(null);
  const [returnQty, setReturnQty] = useState<Record<string, number>>({});
  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<VariantHit[]>([]);
  const [evenExchange, setEvenExchange] = useState(false);
  const [feeOverride, setFeeOverride] = useState('');
  const [goodsInHand, setGoodsInHand] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Return-class reason codes: once the registry has any, the server
  // refuses uncoded returns, so the picker becomes required.
  const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
  const [reasonCodeId, setReasonCodeId] = useState('');
  const [reasonText, setReasonText] = useState('');
  // Locations for "return goods to" and per-line "inventory from".
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [returnToId, setReturnToId] = useState(''); // '' = the order's location
  // Collect the remaining balance (server-computed, exact) right after
  // the settlement applies the return credit.
  const [collectNow, setCollectNow] = useState(true);
  const [payMethod, setPayMethod] = useState<(typeof TENDERS)[number]['value']>('card');
  useEffect(() => {
    api<ReasonCode[]>('/v1/reason-codes?usageClass=return')
      .then(setReasonCodes)
      .catch(() => setReasonCodes([]));
    api<LocationRow[]>('/v1/business/locations')
      .then(setLocations)
      .catch(() => setLocations([]));
  }, []);
  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? 'this store';

  async function loadOriginal(id: string) {
    try {
      setError(null);
      const detail = await api<OrderDetail>(`/v1/orders/${id}`);
      setOriginal(detail);
      setReturnQty({});
      setSaleLines([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    if (originalOrderId) void loadOriginal(originalOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalOrderId]);

  async function findByNumber() {
    const q = orderNumberQuery.trim();
    if (!q) return;
    try {
      const page = await api<{ data: { id: string; number: string }[] }>(
        `/v1/orders?number=${encodeURIComponent(q)}`,
      );
      const hit = page.data?.[0];
      if (!hit) {
        setError(`No order matches "${q}". Pre-cutover exchange? Use Returns > No original first.`);
        return;
      }
      await loadOriginal(hit.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const returnable = (l: OrderLine) => l.qtyFulfilled - l.qtyReturned;
  const pickedReturns = original
    ? original.lines
        .filter((l) => (returnQty[l.id] ?? 0) > 0)
        .map((l) => ({ line: l, quantity: returnQty[l.id]! }))
    : [];
  // The credit is what the customer actually paid per unit — line total
  // (after discounts) plus its tax share — matching the server's
  // per-unit computation at return authorization exactly.
  const perUnitCredit = (l: OrderLine) => Math.round((l.totalCents + l.taxCents) / l.quantity);
  const returnCreditCents = pickedReturns.reduce(
    (s, p) => s + perUnitCredit(p.line) * p.quantity,
    0,
  );

  function copyReturnsToSale() {
    setSaleLines(
      pickedReturns
        .filter((p) => p.line.variantId)
        .map((p) => ({
          variantId: p.line.variantId!,
          description: p.line.description,
          quantity: p.quantity,
          priceCents: p.line.unitPriceCents,
          sourceLocationId: '',
        })),
    );
  }

  // On-screen estimate only — the replacement order prices at list
  // server-side and the collected balance is read back exactly.
  const replacementEstCents = saleLines.reduce((s, l) => s + l.priceCents * l.quantity, 0);
  const feeEstCents = feeOverride.trim() !== '' ? Math.round(Number(feeOverride) * 100) : 0;
  const estNetCents = replacementEstCents - Math.max(0, returnCreditCents - feeEstCents);

  async function searchVariants() {
    if (!search.trim()) return setResults([]);
    try {
      setResults(
        await api<VariantHit[]>(`/v1/pos/lookup?q=${encodeURIComponent(search.trim())}&limit=200`),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Steps 1–2 create real documents; if a later step fails, remember
  // them so a retry binds the SAME documents instead of writing a
  // duplicate order and RMA.
  const [createdLegs, setCreatedLegs] = useState<{
    saleOrderId: string | null;
    returnId: string | null;
  }>({ saleOrderId: null, returnId: null });

  async function submit() {
    if (!original) return;
    if (pickedReturns.length === 0) return setError('Pick at least one item to return.');
    if (saleLines.length === 0) return setError('Add at least one replacement item.');
    if (reasonCodes.length > 0 && !reasonCodeId)
      return setError('Pick a return reason before writing the exchange.');
    setSaving(true);
    setError(null);
    let saleOrderId = createdLegs.saleOrderId;
    let returnId = createdLegs.returnId;
    try {
      // 1. The replacement order, written against the original (reused
      // on retry after a failed bind).
      if (!saleOrderId) {
        const replacement = await api<{ id: string }>(`/v1/orders/${original.id}/exchange`, {
          method: 'POST',
          body: JSON.stringify({
            locationId: original.locationId,
            confirm: true,
            lines: saleLines.map((l) => ({
              variantId: l.variantId,
              quantity: l.quantity,
              // The price on screen is the price charged — an edited
              // price below list hits the same discount gates as New
              // Sale when the order is written.
              unitPriceCents: l.priceCents,
              ...(l.sourceLocationId && l.sourceLocationId !== original.locationId
                ? { sourceLocationId: l.sourceLocationId }
                : {}),
            })),
          }),
        });
        saleOrderId = replacement.id;
        setCreatedLegs((prev) => ({ ...prev, saleOrderId }));
      }
      // 2. The return authorization (pickup keeps it open until settle).
      if (!returnId) {
        // store_credit: the exchange settlement diverts the money anyway,
        // this skips the cash-refund cap on partially-paid originals, and
        // if the exchange is later split the fallback is credit — never
        // cash out the door.
        await api(`/v1/orders/${original.id}/return`, {
          method: 'POST',
          body: JSON.stringify({
            fulfillment: 'pickup',
            refundMethod: 'store_credit',
            ...(reasonText.trim() ? { reason: reasonText.trim() } : {}),
            lines: pickedReturns.map((p) => ({
              lineId: p.line.id,
              quantity: p.quantity,
              ...(reasonCodeId ? { reasonCodeId } : {}),
            })),
          }),
        });
        const returns = await api<{ data: { id: string }[] }>(
          `/v1/order-returns?orderId=${original.id}&status=authorized`,
        );
        if (!returns.data[0]) throw new Error('Return authorization not found');
        returnId = returns.data[0].id;
        setCreatedLegs((prev) => ({ ...prev, returnId }));
      }
      // 3. Bind the container.
      const fee = feeOverride.trim();
      const exchange = await api<{ id: string; status: string }>('/v1/exchanges', {
        method: 'POST',
        body: JSON.stringify({
          saleOrderId,
          returnId,
          evenExchange,
          ...(fee !== '' ? { restockingFeeCents: Math.round(Number(fee) * 100) } : {}),
        }),
      });
      // 4. Goods in hand → settle now. A held (E1) exchange settles
      // after approval instead, and a receive hiccup must not strand
      // the cashier — the exchange exists; its page has the buttons.
      if (goodsInHand && exchange.status !== 'on_hold') {
        try {
          await api(`/v1/order-returns/${returnId}/receive`, {
            method: 'POST',
            body: JSON.stringify(
              returnToId && returnToId !== original.locationId ? { locationId: returnToId } : {},
            ),
          });
          // 5. Customer owes the difference → take it now, for the exact
          // balance the server computed (credit and tax included). A
          // payment hiccup must not strand the exchange — the
          // replacement order's page collects too.
          if (collectNow) {
            const settled = await api<{
              settlement: { saleBalanceDueCents: number };
            }>(`/v1/exchanges/${exchange.id}`);
            const due = settled.settlement.saleBalanceDueCents;
            if (due > 0) {
              await api(`/v1/orders/${saleOrderId}/payments`, {
                method: 'POST',
                body: JSON.stringify({ method: payMethod, amountCents: due, kind: 'balance' }),
              });
            }
          }
        } catch {
          // Settle (and collect) from the exchange page once whatever
          // blocked it clears.
        }
      }
      router.push(`/exchanges/${exchange.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        saleOrderId || returnId
          ? `${msg} — the replacement order and return are saved; fix the issue and press Write exchange again to bind them (no duplicates will be created).`
          : msg,
      );
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="New exchange"
        sub="The return credits the replacement in one settlement — the customer pays (or keeps as store credit) only the difference."
      />

      {!original && (
        <Card title="Original order">
          <div className="flex flex-wrap gap-2">
            <Input
              value={orderNumberQuery}
              onChange={(e) => setOrderNumberQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void findByNumber();
                }
              }}
              placeholder="Order number (SO-…)"
              className="min-w-[220px] flex-1"
              data-testid="exchange-original-query"
            />
            <Button type="button" variant="primary" onClick={() => void findByNumber()}>
              <Search size={14} />
              Find
            </Button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, margin: '8px 0 0' }}>
            Pre-cutover sale with no order on file? Write the no-original return on the Returns page
            first, then bind it to a new order from the exchange detail — or ask a manager.
          </p>
        </Card>
      )}

      {original && (
        <div style={{ display: 'grid', gap: 16 }}>
          <Card title={`Return — from ${original.number}`}>
            {original.lines.filter((l) => returnable(l) > 0).length === 0 ? (
              <EmptyState>
                Nothing on this order is returnable (only delivered units can come back).
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="num">Delivered</th>
                      <th className="num">Return qty</th>
                      <th className="num">Unit credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {original.lines
                      .filter((l) => returnable(l) > 0)
                      .map((l) => (
                        <tr key={l.id}>
                          <td>{l.description}</td>
                          <td className="num">{returnable(l)}</td>
                          <td className="num">
                            <Input
                              type="number"
                              min={0}
                              max={returnable(l)}
                              value={returnQty[l.id] ?? 0}
                              onChange={(e) =>
                                setReturnQty((prev) => ({
                                  ...prev,
                                  [l.id]: Math.max(
                                    0,
                                    Math.min(returnable(l), Number(e.target.value)),
                                  ),
                                }))
                              }
                              style={{ width: 70 }}
                              aria-label={`Return quantity for ${l.description}`}
                            />
                          </td>
                          <td className="num">
                            <Money cents={perUnitCredit(l)} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {reasonCodes.length > 0 ? (
                <Field label="Return reason (required)">
                  <Select
                    value={reasonCodeId}
                    onChange={(e) => setReasonCodeId(e.target.value)}
                    style={{ width: '100%' }}
                    data-testid="return-reason-code"
                  >
                    <option value="">Pick a reason…</option>
                    {reasonCodes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                        {c.description ? ` — ${c.description}` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <Field label="Return reason (optional note)">
                  <Input
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="Why is it coming back?"
                    style={{ width: '100%' }}
                  />
                </Field>
              )}
              <Field label="Return goods to">
                <Select
                  value={returnToId}
                  onChange={(e) => setReturnToId(e.target.value)}
                  style={{ width: '100%' }}
                  data-testid="return-to-location"
                >
                  <option value="">{locationName(original.locationId)} — this store</option>
                  {locations
                    .filter((l) => l.id !== original.locationId)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                        {l.locationType === 'warehouse' ? ' (warehouse)' : ''}
                      </option>
                    ))}
                </Select>
              </Field>
            </div>
          </Card>

          <Card title="Replacement">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pickedReturns.length === 0}
                onClick={copyReturnsToSale}
                title="Even exchange: replace like for like"
              >
                <Repeat size={14} />
                Same items (even exchange)
              </Button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={evenExchange}
                  onChange={(e) => setEvenExchange(e.target.checked)}
                />
                Mark as even exchange (required when the original was financed)
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void searchVariants();
                  }
                }}
                placeholder="Search replacement by name, SKU, or barcode"
                className="min-w-[200px] flex-1"
              />
              <Button type="button" variant="secondary" onClick={() => void searchVariants()}>
                <Search size={14} />
                Search
              </Button>
            </div>
            {results.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {results.map((r) => (
                  <button
                    key={r.variantId}
                    type="button"
                    onClick={() => {
                      setSaleLines((prev) =>
                        prev.some((l) => l.variantId === r.variantId)
                          ? prev
                          : [
                              ...prev,
                              {
                                variantId: r.variantId,
                                description: [r.productName, r.variantName]
                                  .filter(Boolean)
                                  .join(' — '),
                                quantity: 1,
                                priceCents: r.priceCents,
                                sourceLocationId: '',
                              },
                            ],
                      );
                      setSearch('');
                      setResults([]);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 8px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: 'var(--font)',
                      color: 'var(--text)',
                    }}
                  >
                    <strong>{r.productName}</strong> {r.variantName && <>— {r.variantName}</>}{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{r.sku ?? '—'}</span>
                  </button>
                ))}
              </div>
            )}
            {saleLines.length > 0 && (
              <table className="table" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Qty</th>
                    <th className="num">Unit price</th>
                    <th>Inventory from</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {saleLines.map((l, i) => (
                    <tr key={l.variantId}>
                      <td>{l.description}</td>
                      <td className="num">
                        <Input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) =>
                            setSaleLines((prev) =>
                              prev.map((x, j) =>
                                j === i
                                  ? { ...x, quantity: Math.max(1, Number(e.target.value)) }
                                  : x,
                              ),
                            )
                          }
                          style={{ width: 70 }}
                          aria-label={`Quantity for ${l.description}`}
                        />
                      </td>
                      <td className="num">
                        {/* Editable — this is what the replacement bills at,
                            so a wrong or $0 list price is fixed right here. */}
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          key={`${l.variantId}-price`}
                          defaultValue={(l.priceCents / 100).toFixed(2)}
                          onBlur={(e) => {
                            const n = Number(String(e.target.value).replace(/[$,\s]/g, ''));
                            const cents = Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
                            setSaleLines((prev) =>
                              prev.map((x, j) => (j === i ? { ...x, priceCents: cents } : x)),
                            );
                          }}
                          style={{ width: 90, padding: '4px 8px' }}
                          data-testid="exchange-line-price"
                          aria-label={`Unit price for ${l.description}`}
                        />
                      </td>
                      <td>
                        <Select
                          value={l.sourceLocationId}
                          onChange={(e) =>
                            setSaleLines((prev) =>
                              prev.map((x, j) =>
                                j === i ? { ...x, sourceLocationId: e.target.value } : x,
                              ),
                            )
                          }
                          data-testid="exchange-line-source"
                          aria-label={`Inventory source for ${l.description}`}
                        >
                          <option value="">
                            {original ? locationName(original.locationId) : 'This store'} — this
                            store
                          </option>
                          {locations
                            .filter((loc) => loc.id !== original?.locationId)
                            .map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                                {loc.locationType === 'warehouse' ? ' (warehouse)' : ''}
                              </option>
                            ))}
                        </Select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => setSaleLines((prev) => prev.filter((_, j) => j !== i))}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Settlement">
            <div style={{ fontSize: 13, margin: '0 0 10px', display: 'grid', gap: 2 }}>
              <div>
                Replacement (before tax): <Money cents={replacementEstCents} />
              </div>
              <div>
                Return credit: <Money cents={returnCreditCents} />
                {feeEstCents > 0 && (
                  <>
                    {' '}
                    − restocking fee <Money cents={feeEstCents} />
                  </>
                )}
              </div>
              <div style={{ fontWeight: 600 }} data-testid="exchange-est-due">
                {estNetCents > 0 ? (
                  <>
                    Estimated balance the customer owes: <Money cents={estNetCents} />
                  </>
                ) : (
                  <>
                    Estimated store credit the customer keeps: <Money cents={-estNetCents} />
                  </>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Estimates exclude tax and any configured restocking percent — the exact numbers come
                from the written orders, and the collected payment uses the exact balance.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Restocking fee override ($; blank = calculated from settings)">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={feeOverride}
                  onChange={(e) => setFeeOverride(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={goodsInHand}
                  onChange={(e) => setGoodsInHand(e.target.checked)}
                />
                Goods are in hand — settle immediately (uncheck if the truck picks the return up)
              </label>
            </div>
            {goodsInHand && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={collectNow}
                    onChange={(e) => setCollectNow(e.target.checked)}
                    data-testid="collect-balance-now"
                  />
                  Collect the remaining balance now (charged for the exact amount due after the
                  credit applies)
                </label>
                {collectNow && (
                  <Field label="Payment method">
                    <Select
                      value={payMethod}
                      onChange={(e) =>
                        setPayMethod(e.target.value as (typeof TENDERS)[number]['value'])
                      }
                      style={{ width: '100%' }}
                      data-testid="exchange-pay-method"
                    >
                      {TENDERS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
            )}
          </Card>

          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
          <div>
            <Button
              type="button"
              variant="primary"
              disabled={saving}
              onClick={() => void submit()}
              data-testid="create-exchange"
            >
              <Repeat size={14} />
              {saving ? 'Writing…' : 'Write exchange'}
            </Button>
          </div>
        </div>
      )}
      {!original && error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

export default function NewExchangePage() {
  return (
    <Suspense fallback={<LoadingRows rows={4} />}>
      <NewExchangeInner />
    </Suspense>
  );
}
