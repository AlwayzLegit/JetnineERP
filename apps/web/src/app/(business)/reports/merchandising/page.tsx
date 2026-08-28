'use client';

import { Download, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, EmptyState, Field, LoadingRows, PageHeader, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/download';
import { Money } from '@/components/money';

interface MerchRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  vendorName: string | null;
  categoryName: string | null;
  brandName: string | null;
  onHand: number;
  reserved: number;
  floorSample: number;
  netAvailable: number;
  asIsQty: number;
  onOrder: number;
  soldMtd: number;
  soldYtd: number;
  costCents: number | null;
  priceCents: number;
  markupPct: number | null;
}

interface MerchReport {
  generatedAt: string;
  truncated: boolean;
  rows: MerchRow[];
}

interface NamedRow {
  id: string;
  name: string;
}

/**
 * The buyer's report: stock position, inbound supply, as-is holdings,
 * and sales velocity per variant, with replacement cost and markup.
 */
export default function MerchandisingPage() {
  const [report, setReport] = useState<MerchReport | null>(null);
  const [vendors, setVendors] = useState<NamedRow[]>([]);
  const [categories, setCategories] = useState<NamedRow[]>([]);
  const [brands, setBrands] = useState<NamedRow[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [includeAll, setIncludeAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function query(): string {
    const p = new URLSearchParams();
    if (vendorId) p.set('vendorId', vendorId);
    if (categoryId) p.set('categoryId', categoryId);
    if (brandId) p.set('brandId', brandId);
    if (includeAll) p.set('includeNoActivity', 'true');
    return p.toString();
  }

  async function load() {
    try {
      setReport(await api<MerchReport>(`/v1/reports/merchandising?${query()}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
    void (async () => {
      try {
        const [v, c, b] = await Promise.all([
          api<NamedRow[] | { data: NamedRow[] }>('/v1/vendors'),
          api<NamedRow[] | { data: NamedRow[] }>('/v1/categories'),
          api<NamedRow[] | { data: NamedRow[] }>('/v1/brands'),
        ]);
        const arr = (x: NamedRow[] | { data: NamedRow[] }) => (Array.isArray(x) ? x : x.data);
        setVendors(arr(v));
        setCategories(arr(c));
        setBrands(arr(b));
      } catch {
        // Filters degrade to "all" when a lookup fails; the report still loads.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader title="Merchandising activity" />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <Field label="Vendor">
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">All vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Brand">
            <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <label
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              fontSize: 13,
              paddingBottom: 8,
            }}
          >
            <input
              type="checkbox"
              checked={includeAll}
              onChange={(e) => setIncludeAll(e.target.checked)}
            />
            Include no-activity products
          </label>
          <Button variant="primary" onClick={() => void load()}>
            <RefreshCw size={14} aria-hidden />
            Run
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await downloadFile(
                  `/v1/reports/merchandising?${query()}&format=csv`,
                  'merchandising.csv',
                );
              } catch (err) {
                toast.error(err instanceof Error ? err.message : String(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            <Download size={14} aria-hidden />
            {busy ? 'Preparing…' : 'CSV'}
          </Button>
        </div>
        {report?.truncated && (
          <p style={{ color: 'var(--warning, #b45309)', fontSize: 13 }}>
            Showing the top 2000 rows by YTD units — narrow the filters for full coverage.
          </p>
        )}
        {!report ? (
          <LoadingRows />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" data-testid="merch-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Vendor</th>
                  <th className="num">On hand</th>
                  <th className="num">Rsvd</th>
                  <th className="num">Floor</th>
                  <th className="num">Avail</th>
                  <th className="num">As-Is</th>
                  <th className="num">On order</th>
                  <th className="num">MTD</th>
                  <th className="num">YTD</th>
                  <th className="num">Cost</th>
                  <th className="num">Price</th>
                  <th className="num">Markup</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 && (
                  <tr>
                    <td colSpan={13}>
                      <EmptyState>No rows match the filters.</EmptyState>
                    </td>
                  </tr>
                )}
                {report.rows.map((r) => (
                  <tr key={r.variantId}>
                    <td>
                      {r.productName}
                      {r.variantName && (
                        <span style={{ color: 'var(--text-muted)' }}> · {r.variantName}</span>
                      )}
                      {r.sku && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.sku}</div>
                      )}
                    </td>
                    <td>{r.vendorName ?? '—'}</td>
                    <td className="num">{r.onHand}</td>
                    <td className="num">{r.reserved}</td>
                    <td className="num">{r.floorSample}</td>
                    <td className="num">{r.netAvailable}</td>
                    <td className="num">{r.asIsQty}</td>
                    <td className="num">{r.onOrder}</td>
                    <td className="num">{r.soldMtd}</td>
                    <td className="num">{r.soldYtd}</td>
                    <td className="num">
                      {r.costCents != null ? <Money cents={r.costCents} /> : '—'}
                    </td>
                    <td className="num">
                      <Money cents={r.priceCents} />
                    </td>
                    <td className="num">{r.markupPct != null ? `${r.markupPct}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
