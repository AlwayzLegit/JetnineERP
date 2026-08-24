'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileText } from 'lucide-react';
import { formatMoney } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  CustomerPicker,
  customerDisplayName,
  type CustomerRow,
} from '@/components/customer-picker';
import { Button, Card, Field, Input, PageHeader, Select } from '@/components/ui';

/**
 * Order writer (STORIS cutover Day 2). Same cart mechanics as the POS
 * register — lookup, lines, discounts — but the outcome is a sales order:
 * a customer, a fulfillment promise, a deposit, and a balance collected
 * at delivery. "Save as quote" holds no stock; "Confirm" commits it.
 */

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
}
interface LocationRow {
  id: string;
  name: string;
  taxRateBps: number | null;
}
interface OrderDetailResp {
  id: string;
  number: string;
}

export default function OrderWriterPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationId, setLocationId] = useState('');
  const [taxRateBps, setTaxRateBps] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [scan, setScan] = useState('');
  const [results, setResults] = useState<LookupRow[]>([]);
  const [orderDiscount, setOrderDiscount] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [requestedDate, setRequestedDate] = useState('');
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    phone: '',
  });
  const [notes, setNotes] = useState('');
  const [depositOverride, setDepositOverride] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const locs = await api<LocationRow[]>('/v1/pos/locations');
        setLocations(locs);
        if (locs[0]) {
          setLocationId(locs[0].id);
          setTaxRateBps(locs[0].taxRateBps ?? 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

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
      totalCents: taxable + taxCents,
    };
  }, [cart, orderDiscount, taxRateBps]);

  // Mirrors the server's fallback policy (25% down, rounded up) so the
  // suggested deposit on screen matches what the API will store.
  const suggestedDepositCents = Math.ceil((totals.totalCents * 2500) / 10000);

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

  async function save(confirm: boolean) {
    setError(null);
    if (!customer) {
      setError('Attach a customer first — an order is a promise to somebody specific.');
      return;
    }
    if (cart.length === 0) {
      setError('Add at least one line.');
      return;
    }
    setBusy(true);
    try {
      const depositCents = parseDollars(depositOverride);
      const order = await api<OrderDetailResp>('/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          locationId,
          customerId: customer.id,
          lines: cart.map((l) => ({
            variantId: l.variantId,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            lineDiscountCents: l.lineDiscountCents || undefined,
            lineType: l.lineType,
          })),
          orderDiscountCents: parseDollars(orderDiscount) || undefined,
          fulfillmentType,
          requestedDate: requestedDate || null,
          address:
            fulfillmentType === 'delivery'
              ? {
                  line1: address.line1 || null,
                  line2: address.line2 || null,
                  city: address.city || null,
                  region: address.region || null,
                  postalCode: address.postalCode || null,
                  phone: address.phone || null,
                }
              : undefined,
          notes: notes || null,
          depositRequiredCents: depositCents > 0 ? depositCents : undefined,
          confirm,
        }),
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Write order" />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          <form onSubmit={handleScanSubmit} style={{ marginBottom: 12 }}>
            <input
              ref={scanRef}
              autoFocus
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              placeholder="Scan barcode or type to search…"
              className="input"
              style={{ width: '100%', padding: '12px 14px', fontSize: 16 }}
            />
          </form>
          {results.length > 0 && (
            <Card style={{ marginBottom: 12, padding: 8 }}>
              {results.map((r) => (
                <button key={r.variantId} onClick={() => addToCart(r)} style={resultBtn}>
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
                      <th>Price</th>
                      <th>Disc $</th>
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
                            <Select
                              value={l.lineType}
                              onChange={(e) =>
                                patchLine(l.variantId, {
                                  lineType: e.target.value as CartLine['lineType'],
                                })
                              }
                              style={{ width: 130, padding: '4px 8px' }}
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
                              style={{ width: 60, padding: '4px 8px' }}
                            />
                          </td>
                          <td>
                            <Money cents={l.unitPriceCents} />
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

          <Card title="Fulfillment" style={{ marginBottom: 16 }}>
            <div className="grid gap-2 sm:grid-cols-3">
              <Field label="Location">
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
              <Field label="Type">
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
            {fulfillmentType === 'delivery' && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Field label="Address line 1">
                  <Input
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </Field>
                <Field label="Line 2">
                  <Input
                    value={address.line2}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </Field>
                <Field label="State / region">
                  <Input
                    value={address.region}
                    onChange={(e) => setAddress({ ...address, region: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </Field>
                <Field label="Postal code">
                  <Input
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </Field>
                <Field label="Phone at address">
                  <Input
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </Field>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <Field label="Notes (printed on the order)">
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
        </div>

        <div className="min-w-0">
          <Card title="Customer" style={{ marginBottom: 16 }}>
            {customer ? (
              <p style={{ fontSize: 13, margin: 0 }} data-testid="order-customer">
                <strong>{customerDisplayName(customer)}</strong>
                <br />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {customer.email ?? customer.phone ?? '—'}
                </span>
                <br />
                <Button size="sm" onClick={() => setCustomer(null)} style={{ marginTop: 6 }}>
                  Detach
                </Button>
              </p>
            ) : (
              <Button onClick={() => setShowCustomerPicker(true)}>Attach customer</Button>
            )}
          </Card>

          <Card title="Totals" style={{ marginBottom: 16 }}>
            <Row label="Subtotal" value={totals.subtotalCents} />
            <Row label="Discount" value={-totals.discountCents} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)', minWidth: 92 }}>Order disc $</span>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(e.target.value)}
                style={{ width: 80, padding: '4px 8px' }}
              />
            </div>
            <Row label="Tax" value={totals.taxCents} />
            <Row label="Total" value={totals.totalCents} bold />
            <div
              style={{
                borderTop: '1px solid var(--border)',
                marginTop: 8,
                paddingTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--text-secondary)', minWidth: 92 }}>Deposit $</span>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={depositOverride}
                onChange={(e) => setDepositOverride(e.target.value)}
                placeholder={(suggestedDepositCents / 100).toFixed(2)}
                style={{ width: 80, padding: '4px 8px' }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Blank = default policy ({formatMoney(suggestedDepositCents)}, 25% down). The deposit
              itself is taken on the order page or at the register.
            </p>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {error && (
              <p
                style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}
                data-testid="order-error"
              >
                {error}
              </p>
            )}
            <Button
              variant="primary"
              onClick={() => void save(true)}
              disabled={busy || cart.length === 0}
              style={{ padding: '14px', fontSize: 16 }}
              data-testid="confirm-order"
            >
              <CheckCircle2 size={16} aria-hidden />
              Confirm order {formatMoney(totals.totalCents)}
            </Button>
            <Button
              onClick={() => void save(false)}
              disabled={busy || cart.length === 0}
              data-testid="save-quote"
            >
              <FileText size={14} aria-hidden />
              Save as quote (no stock held)
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
    </div>
  );
}

function parseDollars(s: string): number {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

const resultBtn = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 10px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  marginBottom: 4,
  cursor: 'pointer',
  fontSize: 13,
  color: 'var(--text)',
} as const;

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
