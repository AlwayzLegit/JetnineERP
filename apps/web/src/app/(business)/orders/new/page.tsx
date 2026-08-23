'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  CustomerPicker,
  customerDisplayName,
  type CustomerRow,
} from '@/components/customer-picker';

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
      <h1 style={{ fontSize: 22, margin: '0 0 16px' }}>Write order</h1>

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
                <button key={r.variantId} onClick={() => addToCart(r)} style={resultBtn}>
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
                No lines yet. Scan or search to add items.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <Th>Item</Th>
                    <Th>Type</Th>
                    <Th>Qty</Th>
                    <Th>Price</Th>
                    <Th>Disc $</Th>
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
                          <select
                            value={l.lineType}
                            onChange={(e) =>
                              patchLine(l.variantId, {
                                lineType: e.target.value as CartLine['lineType'],
                              })
                            }
                            style={{ ...qtyInput, width: 110 }}
                          >
                            <option value="stock">stock</option>
                            <option value="special_order">special order</option>
                          </select>
                        </Td>
                        <Td>
                          <input
                            type="number"
                            min={0}
                            value={l.quantity}
                            onChange={(e) => {
                              const qty = Number(e.target.value);
                              if (qty <= 0) {
                                setCart((prev) => prev.filter((x) => x.variantId !== l.variantId));
                              } else {
                                patchLine(l.variantId, { quantity: qty });
                              }
                            }}
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
                            onBlur={(e) =>
                              patchLine(l.variantId, {
                                lineDiscountCents: parseDollars(e.target.value),
                              })
                            }
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

          <div style={card}>
            <h3 style={section}>Fulfillment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <Field label="Location">
                <select
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(e.target.value);
                    const next = locations.find((l) => l.id === e.target.value);
                    if (next) setTaxRateBps(next.taxRateBps ?? taxRateBps);
                  }}
                  style={fieldStyle}
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Type">
                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value as 'delivery' | 'pickup')}
                  style={fieldStyle}
                >
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </Field>
              <Field label="Promised date">
                <input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  style={fieldStyle}
                />
              </Field>
            </div>
            {fulfillmentType === 'delivery' && (
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}
              >
                <Field label="Address line 1">
                  <input
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Line 2">
                  <input
                    value={address.line2}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="City">
                  <input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="State / region">
                  <input
                    value={address.region}
                    onChange={(e) => setAddress({ ...address, region: e.target.value })}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Postal code">
                  <input
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Phone at address">
                  <input
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    style={fieldStyle}
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
                  style={{ ...fieldStyle, resize: 'vertical' }}
                />
              </Field>
            </div>
          </div>
        </div>

        <div>
          <div style={card}>
            <h3 style={section}>Customer</h3>
            {customer ? (
              <p style={{ fontSize: 13, margin: 0 }} data-testid="order-customer">
                <strong>{customerDisplayName(customer)}</strong>
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
            <Row label="Discount" value={-totals.discountCents} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#666', minWidth: 92 }}>Order disc $</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(e.target.value)}
                style={{ ...qtyInput, width: 80 }}
              />
            </div>
            <Row label="Tax" value={totals.taxCents} />
            <Row label="Total" value={totals.totalCents} bold />
            <div
              style={{
                borderTop: '1px solid #eee',
                marginTop: 8,
                paddingTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
              }}
            >
              <span style={{ color: '#666', minWidth: 92 }}>Deposit $</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={depositOverride}
                onChange={(e) => setDepositOverride(e.target.value)}
                placeholder={(suggestedDepositCents / 100).toFixed(2)}
                style={{ ...qtyInput, width: 80 }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>
              Blank = default policy ({formatMoney(suggestedDepositCents)}, 25% down). The deposit
              itself is taken on the order page or at the register.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {error && (
              <p style={{ color: '#b00', margin: 0, fontSize: 13 }} data-testid="order-error">
                {error}
              </p>
            )}
            <button
              onClick={() => void save(true)}
              disabled={busy || cart.length === 0}
              style={{ ...primaryBtn, padding: '14px', fontSize: 16 }}
              data-testid="confirm-order"
            >
              Confirm order {formatMoney(totals.totalCents)}
            </button>
            <button
              onClick={() => void save(false)}
              disabled={busy || cart.length === 0}
              style={linkBtn}
              data-testid="save-quote"
            >
              Save as quote (no stock held)
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
const resultBtn = {
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
