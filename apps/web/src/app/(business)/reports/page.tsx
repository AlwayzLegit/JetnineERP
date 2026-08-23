'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Field, Input, LoadingRows, PageHeader } from '@/components/ui';
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
      <PageHeader title="Reports" />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <Card title="Daily sales">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <Field label="From">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <Button
            variant="primary"
            onClick={() => {
              void loadDaily();
              void loadProducts();
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            Refresh
          </Button>
          <a
            className="btn btn-secondary"
            href={`${apiUrl}/v1/reports/sales/daily?start=${start}&end=${end}&format=csv`}
            style={{ alignSelf: 'flex-end' }}
          >
            Download CSV
          </a>
        </div>

        {daily ? (
          <>
            <h3 style={subhead}>By day</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th className="num">Sales</th>
                    <th className="num">Subtotal</th>
                    <th className="num">Discount</th>
                    <th className="num">Tax</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.byDay.length === 0 && <Empty colSpan={6} />}
                  {daily.byDay.map((d) => (
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td className="num">{d.saleCount}</td>
                      <td className="num">
                        <Money cents={d.subtotalCents} />
                      </td>
                      <td className="num">
                        <Money cents={d.discountCents} />
                      </td>
                      <td className="num">
                        <Money cents={d.taxCents} />
                      </td>
                      <td className="num">
                        <strong>
                          <Money cents={d.totalCents} />
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={subhead}>By associate</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Associate</th>
                    <th className="num">Sales</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.byAssociate.length === 0 && <Empty colSpan={3} />}
                  {daily.byAssociate.map((a) => (
                    <tr key={a.associateUserId ?? 'none'}>
                      <td>{a.associateEmail ?? '(deleted)'}</td>
                      <td className="num">{a.saleCount}</td>
                      <td className="num">
                        <Money cents={a.totalCents} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={subhead}>By payment method</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th className="num">Count</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.byPaymentMethod.length === 0 && <Empty colSpan={3} />}
                  {daily.byPaymentMethod.map((p) => (
                    <tr key={p.method}>
                      <td>{p.method}</td>
                      <td className="num">{p.count}</td>
                      <td className="num">
                        <Money cents={p.amountCents} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <LoadingRows />
        )}
      </Card>

      <Card title="Sales by product">
        <a
          className="btn btn-secondary btn-sm"
          href={`${apiUrl}/v1/reports/sales/by-product?start=${start}&end=${end}&format=csv`}
          style={{ display: 'inline-flex', marginBottom: 12 }}
        >
          Download CSV
        </a>
        {products ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th className="num">Qty</th>
                  <th className="num">Revenue</th>
                  {products[0]?.marginCents != null && <th className="num">Margin</th>}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && <Empty colSpan={6} />}
                {products.map((p) => (
                  <tr key={p.variantId}>
                    <td>{p.productName}</td>
                    <td>{p.variantName ?? '—'}</td>
                    <td>
                      <code>{p.sku ?? '—'}</code>
                    </td>
                    <td className="num">{p.quantity}</td>
                    <td className="num">
                      <Money cents={p.revenueCents} />
                    </td>
                    {p.marginCents != null && (
                      <td className="num">
                        <Money cents={p.marginCents ?? 0} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <LoadingRows />
        )}
      </Card>

      <Card title="Inventory on hand">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
          <Field label="Show items with available ≤">
            <Input
              type="number"
              min={0}
              value={lowStock}
              onChange={(e) => setLowStock(e.target.value)}
              placeholder="(blank = all)"
            />
          </Field>
          <Button variant="primary" onClick={loadInv}>
            Refresh
          </Button>
          <a
            className="btn btn-secondary"
            href={`${apiUrl}/v1/reports/inventory/on-hand${lowStock ? `?lowStock=${encodeURIComponent(lowStock)}&format=csv` : '?format=csv'}`}
          >
            Download CSV
          </a>
        </div>
        {inv ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="num">On hand</th>
                  <th className="num">Reserved</th>
                  <th className="num">Available</th>
                </tr>
              </thead>
              <tbody>
                {inv.length === 0 && <Empty colSpan={5} />}
                {inv.map((r) => (
                  <tr key={r.variantId}>
                    <td>
                      {r.productName}
                      {r.variantName && (
                        <span style={{ color: 'var(--text-secondary)' }}> — {r.variantName}</span>
                      )}
                    </td>
                    <td>
                      <code>{r.sku ?? '—'}</code>
                    </td>
                    <td className="num">{r.onHand}</td>
                    <td className="num">{r.reserved}</td>
                    <td className="num">
                      <strong>{r.available}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <LoadingRows />
        )}
      </Card>
    </div>
  );
}

const subhead = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginTop: 16,
  marginBottom: 6,
} as const;

function Empty({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="empty-state" style={{ padding: '16px' }}>
          No data.
        </div>
      </td>
    </tr>
  );
}
