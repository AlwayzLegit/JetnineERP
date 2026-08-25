'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatMoney } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  CustomerPicker,
  customerDisplayName,
  type CustomerRow,
} from '@/components/customer-picker';
import { Button, Card, Field, Input, Select } from '@/components/ui';

/**
 * "Enter a Sales Order" — the STORIS-style three-step order writer
 * (Customer → Merchandise → Payment) that replaces both the old order
 * writer and, as the default POS surface, the quick register.
 *
 * Step 1 captures who and how: order type, selling location,
 * salespeople, fulfillment method, dates/status/instructions, customer,
 * shipping + optional separate billing address.
 * Step 2 is the cart: scan/search, quantities, register-side price
 * entry (D12), line discounts, special-order lines, and per-line
 * fulfillment/date overrides (split tickets).
 * Step 3 is the money: discounts, delivery/install/other fees, marketing
 * code, deposit, tender — and the take-with fast lane, which posts a
 * plain POS `sale` when the goods leave now fully paid (decision D1's
 * aggregates are unchanged; only the screen is unified).
 */

const FULFILLMENTS = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'pickup', label: 'Customer pickup' },
  { value: 'take_with', label: 'Take-with' },
  { value: 'direct_ship', label: 'Direct ship' },
] as const;
type Fulfillment = (typeof FULFILLMENTS)[number]['value'];

const DELIVERY_STATUSES = [
  { value: '', label: '—' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'estimated', label: 'Estimated' },
  { value: 'asap', label: 'ASAP' },
  { value: 'will_call', label: 'Customer will call' },
] as const;

type OrderType = 'sales_order' | 'layaway' | 'quote';

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
  lineType: 'stock' | 'special_order';
  fulfillmentMethod: '' | Fulfillment;
  deliveryDate: string;
}
interface LocationRow {
  id: string;
  name: string;
  taxRateBps: number | null;
}
interface MemberRow {
  membershipId: string;
  name: string | null;
  email: string;
  status: string;
}
interface AddressState {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
}
interface OrderResp {
  id: string;
  number: string;
  totalCents: number;
}

const EMPTY_ADDRESS: AddressState = {
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  phone: '',
};

export function OrderEntry() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // --- Step 1 state ---
  const [orderType, setOrderType] = useState<OrderType>('sales_order');
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationId, setLocationId] = useState('');
  const [taxRateBps, setTaxRateBps] = useState(0);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [salesperson1, setSalesperson1] = useState('');
  const [salesperson2, setSalesperson2] = useState('');
  const [splitPct, setSplitPct] = useState('50');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [address, setAddress] = useState<AddressState>(EMPTY_ADDRESS);
  const [billingDiffers, setBillingDiffers] = useState(false);
  const [billing, setBilling] = useState<AddressState>(EMPTY_ADDRESS);
  const [notes, setNotes] = useState('');

  // --- Step 2 state ---
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scan, setScan] = useState('');
  const [results, setResults] = useState<LookupRow[]>([]);
  const scanRef = useRef<HTMLInputElement>(null);

  // --- Step 3 state ---
  const [orderDiscount, setOrderDiscount] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [installFee, setInstallFee] = useState('');
  const [otherFee, setOtherFee] = useState('');
  const [otherFeeLabel, setOtherFeeLabel] = useState('');
  const [marketingCode, setMarketingCode] = useState('');
  const [depositOverride, setDepositOverride] = useState('');
  const [tenderMethod, setTenderMethod] = useState<
    'cash' | 'external_card' | 'check' | 'financing'
  >('cash');
  const [tenderAmount, setTenderAmount] = useState('');
  const [tenderRef, setTenderRef] = useState('');
  const [financingProvider, setFinancingProvider] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<LocationRow[]>('/v1/pos/locations')
      .then((locs) => {
        setLocations(locs);
        if (locs[0]) {
          setLocationId(locs[0].id);
          setTaxRateBps(locs[0].taxRateBps ?? 0);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
    // Salesperson tagging is optional chrome: cashiers without users.view
    // simply don't get the picker and the server attributes to them.
    void api<MemberRow[]>('/v1/business/members')
      .then((rows) => setMembers(rows.filter((m) => m.status === 'active')))
      .catch(() => setMembers([]));
  }, []);

  const feesCents = parseDollars(deliveryFee) + parseDollars(installFee) + parseDollars(otherFee);

  const totals = useMemo(() => {
    let gross = 0;
    let lineDiscount = 0;
    for (const l of cart) {
      const lineGross = l.quantity * l.unitPriceCents;
      gross += lineGross;
      lineDiscount += Math.min(l.lineDiscountCents, lineGross);
    }
    const afterLines = gross - lineDiscount;
    const orderDisc = Math.min(parseDollars(orderDiscount), afterLines);
    const taxable = afterLines - orderDisc;
    const taxCents = Math.round((taxable * taxRateBps) / 10000);
    return {
      subtotalCents: gross,
      discountCents: lineDiscount + orderDisc,
      taxCents,
      totalCents: taxable + taxCents + feesCents,
    };
  }, [cart, orderDiscount, taxRateBps, feesCents]);

  const suggestedDepositCents = Math.ceil((totals.totalCents * 2500) / 10000);
  const tenderCents = parseDollars(tenderAmount);
  const allStockLines = cart.every((l) => l.lineType === 'stock');
  const fastLaneEligible =
    orderType === 'sales_order' &&
    fulfillment === 'take_with' &&
    allStockLines &&
    cart.length > 0 &&
    feesCents === 0 &&
    tenderCents >= totals.totalCents &&
    totals.totalCents > 0 &&
    (tenderMethod === 'cash' || tenderMethod === 'external_card' || tenderMethod === 'check');

  async function handleScanSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = scan.trim();
    if (!query) return;
    try {
      const rows = await api<LookupRow[]>(`/v1/pos/lookup?q=${encodeURIComponent(query)}`);
      if (rows.length === 1 && rows[0]!.barcode === query) {
        addToCart(rows[0]!);
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
          lineType: 'stock',
          fulfillmentMethod: '',
          deliveryDate: '',
        },
      ];
    });
    setResults([]);
    setScan('');
    scanRef.current?.focus();
  }

  function patchLine(variantId: string, patch: Partial<CartLine>) {
    setCart((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, ...patch } : l)));
  }

  function validateStep1(): string | null {
    if (!locationId) return 'Pick a selling location.';
    if (!customer) return 'Attach a customer — an order is a promise to somebody specific.';
    return null;
  }

  function goTo(next: 1 | 2 | 3) {
    setError(null);
    if (next >= 2) {
      const e1 = validateStep1();
      if (e1) {
        setStep(1);
        setError(e1);
        return;
      }
    }
    if (next >= 3 && cart.length === 0) {
      setStep(2);
      setError('Add at least one line.');
      return;
    }
    setStep(next);
  }

  function addressPayload(a: AddressState) {
    return {
      line1: a.line1 || null,
      line2: a.line2 || null,
      city: a.city || null,
      region: a.region || null,
      postalCode: a.postalCode || null,
      phone: a.phone || null,
    };
  }

  async function submit() {
    setError(null);
    const e1 = validateStep1();
    if (e1) {
      setStep(1);
      setError(e1);
      return;
    }
    if (cart.length === 0) {
      setStep(2);
      setError('Add at least one line.');
      return;
    }
    setBusy(true);
    try {
      // Take-with fast lane: goods leave now, fully tendered → this is a
      // POS sale, drawer and all. The order machinery never gets involved.
      if (fastLaneEligible) {
        const sale = await api<{ id: string; number: string; changeDueCents?: number }>(
          '/v1/sales',
          {
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
              payments: [
                tenderMethod === 'cash'
                  ? { method: 'cash', amountCents: tenderCents }
                  : { method: 'card', amountCents: totals.totalCents },
              ],
            }),
          },
        );
        toast.success(`Sale ${sale.number} complete — take-with`);
        router.push(`/sales/${sale.id}`);
        return;
      }

      const confirm = orderType !== 'quote';
      const shipAddress =
        fulfillment === 'delivery' || fulfillment === 'direct_ship'
          ? addressPayload(address)
          : undefined;
      const split2 = salesperson2 && salesperson2 !== salesperson1;
      const order = await api<OrderResp>('/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          locationId,
          customerId: customer!.id,
          orderKind: orderType === 'layaway' ? 'layaway' : 'sales_order',
          fulfillmentType: fulfillment,
          deliveryStatus: deliveryStatus || null,
          deliveryInstructions: deliveryInstructions || null,
          pickupLocationId: fulfillment === 'pickup' ? pickupLocationId || null : null,
          billingAddress: billingDiffers ? addressPayload(billing) : null,
          marketingCode: marketingCode.trim() || null,
          deliveryFeeCents: parseDollars(deliveryFee) || undefined,
          installFeeCents: parseDollars(installFee) || undefined,
          otherFeeCents: parseDollars(otherFee) || undefined,
          otherFeeLabel: otherFeeLabel.trim() || null,
          salespersonMembershipId: salesperson1 || undefined,
          secondSalespersonMembershipId: split2 ? salesperson2 : undefined,
          splitBps: split2 ? Math.round(Number(splitPct || '50') * 100) : undefined,
          lines: cart.map((l) => ({
            variantId: l.variantId,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            lineDiscountCents: l.lineDiscountCents || undefined,
            lineType: l.lineType,
            fulfillmentMethod: l.fulfillmentMethod || undefined,
            deliveryDate: l.deliveryDate || undefined,
          })),
          orderDiscountCents: parseDollars(orderDiscount) || undefined,
          requestedDate: requestedDate || null,
          address: shipAddress,
          notes: notes || null,
          depositRequiredCents: parseDollars(depositOverride) || undefined,
          confirm,
        }),
      });

      if (confirm && tenderCents > 0) {
        await api(`/v1/orders/${order.id}/payments`, {
          method: 'POST',
          body: JSON.stringify({
            method: tenderMethod === 'external_card' ? 'external_card' : tenderMethod,
            amountCents: Math.min(tenderCents, order.totalCents),
            kind: 'deposit',
            processorRef: tenderMethod !== 'cash' && tenderRef ? tenderRef : undefined,
            financingProvider:
              tenderMethod === 'financing' ? financingProvider || undefined : undefined,
            financingRef: tenderMethod === 'financing' ? tenderRef || undefined : undefined,
          }),
        });
      }

      toast.success(
        orderType === 'quote'
          ? `Quote ${order.number} saved — no stock held`
          : `Order ${order.number} confirmed`,
      );
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const stepTitles = ['Customer', 'Merchandise', 'Payment'] as const;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2" data-testid="order-entry-steps">
        {stepTitles.map((t, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          return (
            <button
              key={t}
              onClick={() => goTo(n)}
              className="btn btn-sm"
              style={{
                background: step === n ? 'var(--brand)' : 'var(--surface)',
                color: step === n ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-strong)',
                fontWeight: 600,
              }}
              data-testid={`order-entry-step-${n}`}
            >
              {n}. {t}
            </button>
          );
        })}
        <span className="ml-auto" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {cart.length} line{cart.length === 1 ? '' : 's'} · <Money cents={totals.totalCents} />
        </span>
      </div>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }} role="alert">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Order">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Order type">
                <Select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  style={{ width: '100%' }}
                  data-testid="order-type"
                >
                  <option value="sales_order">Sales order</option>
                  <option value="layaway">Layaway</option>
                  <option value="quote">Sales quote</option>
                </Select>
              </Field>
              <Field label="Selling location">
                <Select
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(e.target.value);
                    const next = locations.find((l) => l.id === e.target.value);
                    if (next) setTaxRateBps(next.taxRateBps ?? taxRateBps);
                  }}
                  style={{ width: '100%' }}
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {members.length > 0 && (
                <>
                  <Field label="Salesperson">
                    <Select
                      value={salesperson1}
                      onChange={(e) => setSalesperson1(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="">Me (signed-in user)</option>
                      {members.map((m) => (
                        <option key={m.membershipId} value={m.membershipId}>
                          {m.name ?? m.email}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Second salesperson (split)">
                    <div className="flex gap-2">
                      <Select
                        value={salesperson2}
                        onChange={(e) => setSalesperson2(e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="">None</option>
                        {members.map((m) => (
                          <option key={m.membershipId} value={m.membershipId}>
                            {m.name ?? m.email}
                          </option>
                        ))}
                      </Select>
                      {salesperson2 && (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={splitPct}
                          onChange={(e) => setSplitPct(e.target.value)}
                          style={{ width: 64 }}
                          title="First salesperson's share, %"
                        />
                      )}
                    </div>
                  </Field>
                </>
              )}
            </div>
          </Card>

          <Card title="Customer">
            {customer ? (
              <div className="flex items-center gap-3">
                <div>
                  <strong data-testid="order-customer">{customerDisplayName(customer)}</strong>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    {[customer.phone, customer.email].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowCustomerPicker(true)}>
                  Change
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowCustomerPicker(true)}
                data-testid="attach-customer"
              >
                Attach customer
              </Button>
            )}
            {showCustomerPicker && (
              <CustomerPicker
                onPick={(c) => {
                  setCustomer(c);
                  setShowCustomerPicker(false);
                }}
                onCancel={() => setShowCustomerPicker(false)}
              />
            )}
          </Card>

          <Card title="Fulfillment" className="lg:col-span-2">
            <div className="grid gap-2 sm:grid-cols-4">
              <Field label="Method (order default)">
                <Select
                  value={fulfillment}
                  onChange={(e) => setFulfillment(e.target.value as Fulfillment)}
                  style={{ width: '100%' }}
                  data-testid="fulfillment-method"
                >
                  {FULFILLMENTS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {fulfillment !== 'take_with' && (
                <>
                  <Field label={fulfillment === 'pickup' ? 'Pickup date' : 'Delivery date'}>
                    <Input
                      type="date"
                      value={requestedDate}
                      onChange={(e) => setRequestedDate(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Status">
                    <Select
                      value={deliveryStatus}
                      onChange={(e) => setDeliveryStatus(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      {DELIVERY_STATUSES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              )}
              {fulfillment === 'pickup' && (
                <Field label="Pickup location">
                  <Select
                    value={pickupLocationId}
                    onChange={(e) => setPickupLocationId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Selling location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
            {fulfillment !== 'take_with' && (
              <div style={{ marginTop: 8 }}>
                <Field label="Delivery / pickup instructions">
                  <textarea
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    rows={2}
                    className="textarea"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </Field>
              </div>
            )}
            {(fulfillment === 'delivery' || fulfillment === 'direct_ship') && (
              <AddressFields title="Shipping address" value={address} onChange={setAddress} />
            )}
            <label
              className="mt-2 flex items-center gap-2"
              style={{ fontSize: 13, color: 'var(--text-secondary)' }}
            >
              <input
                type="checkbox"
                checked={billingDiffers}
                onChange={(e) => setBillingDiffers(e.target.checked)}
              />
              Billing address differs from customer record
            </label>
            {billingDiffers && (
              <AddressFields title="Billing address" value={billing} onChange={setBilling} />
            )}
            <div style={{ marginTop: 8 }}>
              <Field label="Order notes (printed)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="textarea"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </Field>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Button variant="primary" onClick={() => goTo(2)} data-testid="to-step-2">
              Continue to merchandise →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <form onSubmit={handleScanSubmit} style={{ marginBottom: 12 }}>
            <input
              ref={scanRef}
              autoFocus
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              placeholder="Scan barcode or type to search…"
              className="input"
              style={{ width: '100%', padding: '12px 14px', fontSize: 16 }}
              data-testid="order-entry-scan"
            />
          </form>
          {results.length > 0 && (
            <Card style={{ marginBottom: 12, padding: 8 }}>
              {results.map((r) => (
                <button
                  key={r.variantId}
                  onClick={() => addToCart(r)}
                  style={resultBtn}
                  data-testid="lookup-result"
                >
                  <strong>{r.productName}</strong> {r.variantName && <>— {r.variantName}</>}{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <Money cents={r.priceCents} /> · {r.sku ?? '—'}
                  </span>
                </button>
              ))}
            </Card>
          )}

          <Card style={{ marginBottom: 16 }}>
            {cart.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                No lines yet. Scan or search to add items.
              </p>
            ) : (
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
                      <th>Line date</th>
                      <th className="num">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((l) => {
                      const lineTotal = l.quantity * l.unitPriceCents - l.lineDiscountCents;
                      return (
                        <tr key={l.variantId}>
                          <td style={{ minWidth: 180 }}>{l.description}</td>
                          <td>
                            <Select
                              value={l.lineType}
                              onChange={(e) =>
                                patchLine(l.variantId, {
                                  lineType: e.target.value as CartLine['lineType'],
                                })
                              }
                              style={{ width: 120, padding: '4px 8px' }}
                            >
                              <option value="stock">stock</option>
                              <option value="special_order">special order</option>
                            </Select>
                          </td>
                          <td>
                            <Input
                              type="number"
                              min={0}
                              value={l.quantity}
                              onChange={(e) => {
                                const qty = Number(e.target.value);
                                if (qty <= 0) {
                                  setCart((prev) =>
                                    prev.filter((x) => x.variantId !== l.variantId),
                                  );
                                } else {
                                  patchLine(l.variantId, { quantity: qty });
                                }
                              }}
                              style={{ width: 58, padding: '4px 8px' }}
                            />
                          </td>
                          <td>
                            {/* Register-side price entry (D12): imported
                                catalogs land at $0 and the floor prices
                                the line here. */}
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              defaultValue={(l.unitPriceCents / 100).toFixed(2)}
                              onBlur={(e) =>
                                patchLine(l.variantId, {
                                  unitPriceCents: parseDollars(e.target.value),
                                })
                              }
                              style={{ width: 80, padding: '4px 8px' }}
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder="0.00"
                              onBlur={(e) =>
                                patchLine(l.variantId, {
                                  lineDiscountCents: parseDollars(e.target.value),
                                })
                              }
                              style={{ width: 70, padding: '4px 8px' }}
                            />
                          </td>
                          <td>
                            <Select
                              value={l.fulfillmentMethod}
                              onChange={(e) =>
                                patchLine(l.variantId, {
                                  fulfillmentMethod: e.target
                                    .value as CartLine['fulfillmentMethod'],
                                })
                              }
                              style={{ width: 120, padding: '4px 8px' }}
                              title="Split ticket: override the order's fulfillment for this line"
                            >
                              <option value="">order default</option>
                              {FULFILLMENTS.map((f) => (
                                <option key={f.value} value={f.value}>
                                  {f.label}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td>
                            <Input
                              type="date"
                              value={l.deliveryDate}
                              onChange={(e) =>
                                patchLine(l.variantId, { deliveryDate: e.target.value })
                              }
                              style={{ width: 130, padding: '4px 8px' }}
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
          </Card>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => goTo(1)}>
              ← Customer
            </Button>
            <Button variant="primary" onClick={() => goTo(3)} data-testid="to-step-3">
              Continue to payment →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card title="Charges & discounts">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Order discount $">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Marketing code">
                <Input
                  value={marketingCode}
                  onChange={(e) => setMarketingCode(e.target.value)}
                  placeholder="LABOR-DAY"
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Delivery charge $">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  style={{ width: '100%' }}
                  data-testid="delivery-fee"
                />
              </Field>
              <Field label="Installation $">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={installFee}
                  onChange={(e) => setInstallFee(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Other fee $">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={otherFee}
                  onChange={(e) => setOtherFee(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Other fee label">
                <Input
                  value={otherFeeLabel}
                  onChange={(e) => setOtherFeeLabel(e.target.value)}
                  placeholder="Recycling fee"
                  style={{ width: '100%' }}
                />
              </Field>
            </div>
            <div style={{ marginTop: 12, fontSize: 14 }} data-testid="order-entry-totals">
              <Row label="Subtotal" cents={totals.subtotalCents} />
              <Row label="Discounts" cents={-totals.discountCents} />
              <Row label="Tax" cents={totals.taxCents} />
              <Row label="Fees" cents={feesCents} />
              <div
                className="flex justify-between"
                style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}
              >
                <span>Total</span>
                <Money cents={totals.totalCents} />
              </div>
            </div>
          </Card>

          <Card title={orderType === 'quote' ? 'Quote' : 'Deposit / tender'}>
            {orderType !== 'quote' && (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field
                    label={`Deposit required (suggested ${formatMoney(suggestedDepositCents)})`}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={depositOverride}
                      onChange={(e) => setDepositOverride(e.target.value)}
                      placeholder={(suggestedDepositCents / 100).toFixed(2)}
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Tender method">
                    <Select
                      value={tenderMethod}
                      onChange={(e) => setTenderMethod(e.target.value as typeof tenderMethod)}
                      style={{ width: '100%' }}
                    >
                      <option value="cash">Cash</option>
                      <option value="external_card">Card (terminal)</option>
                      <option value="check">Check</option>
                      <option value="financing">Financing</option>
                    </Select>
                  </Field>
                  <Field label="Amount collected now $">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={tenderAmount}
                      onChange={(e) => setTenderAmount(e.target.value)}
                      style={{ width: '100%' }}
                      data-testid="tender-amount"
                    />
                  </Field>
                  {tenderMethod === 'financing' && (
                    <Field label="Financing provider">
                      <Input
                        value={financingProvider}
                        onChange={(e) => setFinancingProvider(e.target.value)}
                        placeholder="Synchrony"
                        style={{ width: '100%' }}
                      />
                    </Field>
                  )}
                  {tenderMethod !== 'cash' && (
                    <Field
                      label={
                        tenderMethod === 'financing' ? 'Approval / account ref' : 'Reference #'
                      }
                    >
                      <Input
                        value={tenderRef}
                        onChange={(e) => setTenderRef(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </Field>
                  )}
                </div>
                {orderType === 'layaway' && (
                  <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                    Layaway: after confirming, set up the installment schedule from the order page
                    (Payments → payment plan).
                  </p>
                )}
                {fastLaneEligible && (
                  <p style={{ fontSize: 12.5, marginTop: 8, color: 'var(--success-soft-text)' }}>
                    Take-with, fully paid — this completes as a register sale, not an open order.
                  </p>
                )}
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => goTo(2)}>
                ← Merchandise
              </Button>
              <Button
                variant="primary"
                onClick={() => void submit()}
                disabled={busy}
                data-testid="order-entry-submit"
              >
                {busy
                  ? 'Working…'
                  : fastLaneEligible
                    ? `Complete sale ${formatMoney(totals.totalCents)}`
                    : orderType === 'quote'
                      ? 'Save as quote (no stock held)'
                      : `Confirm ${orderType === 'layaway' ? 'layaway' : 'order'} ${formatMoney(totals.totalCents)}`}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Row({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      <Money cents={cents} />
    </div>
  );
}

function AddressFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: AddressState;
  onChange: (a: AddressState) => void;
}) {
  const set = (k: keyof AddressState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div className="mt-2">
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Address line 1">
          <Input value={value.line1} onChange={set('line1')} style={{ width: '100%' }} />
        </Field>
        <Field label="Line 2">
          <Input value={value.line2} onChange={set('line2')} style={{ width: '100%' }} />
        </Field>
        <Field label="City">
          <Input value={value.city} onChange={set('city')} style={{ width: '100%' }} />
        </Field>
        <Field label="State / region">
          <Input value={value.region} onChange={set('region')} style={{ width: '100%' }} />
        </Field>
        <Field label="Postal code">
          <Input value={value.postalCode} onChange={set('postalCode')} style={{ width: '100%' }} />
        </Field>
        <Field label="Phone">
          <Input value={value.phone} onChange={set('phone')} style={{ width: '100%' }} />
        </Field>
      </div>
    </div>
  );
}

function parseDollars(s: string): number {
  const n = Number(String(s).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

const resultBtn = {
  display: 'block',
  width: '100%',
  textAlign: 'left' as const,
  padding: '8px 10px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 13.5,
};
