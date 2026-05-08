'use client';

import { useEffect, useState } from 'react';
import { api, apiUrl } from '@/lib/api';
import { Money } from '@/components/money';

interface DailyTotalRow {
  day: string;
  saleCount: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
}
interface AssociateTotalRow {
  associateUserId: string | null;
  associateEmail: string | null;
  saleCount: number;
  totalCents: number;
}
interface PaymentMethodRow {
  method: string;
  amountCents: number;
  count: number;
}
interface DailyReport {
  start: string;
  end: string;
  byDay: DailyTotalRow[];
  byAssociate: AssociateTotalRow[];
  byPaymentMethod: PaymentMethodRow[];
}
interface ProductRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  revenueCents: number;
  costCents: number | null;
  marginCents: number | null;
}
interface InventoryRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  onHand: number;
  reserved: number;
  available: number;
}

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400_000).toISOString().slice(0, 10);
  const [start, setStart] = useState(sevenDaysAgo);
  const [end, setEnd] = useState(today);
  const [lowStock, setLowStock] = useState('5');
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [inv, setInv] = useState<InventoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDaily() {
    try {
      setDaily(await api<DailyReport>(`/v1/reports/sales/daily?start=${start}&end=${end}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  async function loadProducts() {
    try {
      setProducts(
        await api<ProductRow[]>(`/v1/reports/sales/by-product?start=${start}&end=${end}`),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  async function loadInv() {
    try {
      setInv(
        await api<InventoryRow[]>(
          `/v1/reports/inventory/on-hand${lowStock ? `?lowStock=${encodeURIComponent(lowStock)}` : ''}`,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void loadDaily();
    void loadProducts();
    void loadInv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Reports</h1>
      {error && <p style={{ color: '#b00' }}>{error}</p>}

      <div style={card}>
        <h2 style={section}>Daily sales</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <Field label="From">
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <button
            onClick={() => {
              void loadDaily();
              void loadProducts();
            }}
            style={{ ...primaryBtn, alignSelf: 'flex-end' }}
          >
            Refresh
          </button>
          <a
            href={`${apiUrl}/v1/reports/sales/daily?start=${start}&end=${end}&format=csv`}
            style={{ ...linkBtn, alignSelf: 'flex-end', textDecoration: 'none' }}
          >
            Download CSV
          </a>
        </div>

        {daily ? (
          <>
            <h3 style={subhead}>By day</h3>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Day</Th>
                  <Th>Sales</Th>
                  <Th>Subtotal</Th>
                  <Th>Discount</Th>
                  <Th>Tax</Th>
                  <Th>Total</Th>
                </tr>
              </thead>
              <tbody>
                {daily.byDay.length === 0 && <Empty colSpan={6} />}
                {daily.byDay.map((d) => (
                  <tr key={d.day}>
                    <Td>{d.day}</Td>
                    <Td>{d.saleCount}</Td>
                    <Td>
                      <Money cents={d.subtotalCents} />
                    </Td>
                    <Td>
                      <Money cents={d.discountCents} />
                    </Td>
                    <Td>
                      <Money cents={d.taxCents} />
                    </Td>
                    <Td>
                      <strong>
                        <Money cents={d.totalCents} />
                      </strong>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={subhead}>By associate</h3>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Associate</Th>
                  <Th>Sales</Th>
                  <Th>Total</Th>
                </tr>
              </thead>
              <tbody>
                {daily.byAssociate.length === 0 && <Empty colSpan={3} />}
                {daily.byAssociate.map((a) => (
                  <tr key={a.associateUserId ?? 'none'}>
                    <Td>{a.associateEmail ?? '(deleted)'}</Td>
                    <Td>{a.saleCount}</Td>
                    <Td>
                      <Money cents={a.totalCents} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={subhead}>By payment method</h3>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Method</Th>
                  <Th>Count</Th>
                  <Th>Amount</Th>
                </tr>
              </thead>
              <tbody>
                {daily.byPaymentMethod.length === 0 && <Empty colSpan={3} />}
                {daily.byPaymentMethod.map((p) => (
                  <tr key={p.method}>
                    <Td>{p.method}</Td>
                    <Td>{p.count}</Td>
                    <Td>
                      <Money cents={p.amountCents} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>
        )}
      </div>

      <div style={card}>
        <h2 style={section}>Sales by product</h2>
        <a
          href={`${apiUrl}/v1/reports/sales/by-product?start=${start}&end=${end}&format=csv`}
          style={{ ...linkBtn, textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}
        >
          Download CSV
        </a>
        {products ? (
          <table style={table}>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Variant</Th>
                <Th>SKU</Th>
                <Th>Qty</Th>
                <Th>Revenue</Th>
                {products[0]?.marginCents != null && <Th>Margin</Th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && <Empty colSpan={6} />}
              {products.map((p) => (
                <tr key={p.variantId}>
                  <Td>{p.productName}</Td>
                  <Td>{p.variantName ?? '—'}</Td>
                  <Td>
                    <code>{p.sku ?? '—'}</code>
                  </Td>
                  <Td>{p.quantity}</Td>
                  <Td>
                    <Money cents={p.revenueCents} />
                  </Td>
                  {p.marginCents != null && (
                    <Td>
                      <Money cents={p.marginCents ?? 0} />
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>
        )}
      </div>

      <div style={card}>
        <h2 style={section}>Inventory on hand</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
          <Field label="Show items with available ≤">
            <input
              type="number"
              min={0}
              value={lowStock}
              onChange={(e) => setLowStock(e.target.value)}
              placeholder="(blank = all)"
              style={inputStyle}
            />
          </Field>
          <button onClick={loadInv} style={primaryBtn}>
            Refresh
          </button>
          <a
            href={`${apiUrl}/v1/reports/inventory/on-hand${lowStock ? `?lowStock=${encodeURIComponent(lowStock)}&format=csv` : '?format=csv'}`}
            style={{ ...linkBtn, textDecoration: 'none' }}
          >
            Download CSV
          </a>
        </div>
        {inv ? (
          <table style={table}>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>On hand</Th>
                <Th>Reserved</Th>
                <Th>Available</Th>
              </tr>
            </thead>
            <tbody>
              {inv.length === 0 && <Empty colSpan={5} />}
              {inv.map((r) => (
                <tr key={r.variantId}>
                  <Td>
                    {r.productName}
                    {r.variantName && <span style={{ color: '#666' }}> — {r.variantName}</span>}
                  </Td>
                  <Td>
                    <code>{r.sku ?? '—'}</code>
                  </Td>
                  <Td>{r.onHand}</Td>
                  <Td>{r.reserved}</Td>
                  <Td>
                    <strong>{r.available}</strong>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>
        )}
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
const section = { fontSize: 16, marginBottom: 12, marginTop: 0 } as const;
const subhead = { fontSize: 13, color: '#444', marginTop: 12, marginBottom: 6 } as const;
const inputStyle = {
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
const table = { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 };

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: '6px 4px',
        fontWeight: 600,
        textAlign: 'left',
        borderBottom: '1px solid #ddd',
      }}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '6px 4px', borderBottom: '1px solid #f3f3f3' }}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
function Empty({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 16, color: '#888', textAlign: 'center' }}>
        No data.
      </td>
    </tr>
  );
}
