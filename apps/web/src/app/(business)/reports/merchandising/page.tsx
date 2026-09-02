'use client';

import { Download, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Alert,
  BackLink,
  Button,
  Card,
  Field,
  LoadingRows,
  PageHeader,
  Select,
  Stack,
  TableEmpty,
  TableWrap,
  Toolbar,
} from '@/components/ui';
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
  const [running, setRunning] = useState(false);

  function query(): string {
    const p = new URLSearchParams();
    if (vendorId) p.set('vendorId', vendorId);
    if (categoryId) p.set('categoryId', categoryId);
    if (brandId) p.set('brandId', brandId);
    if (includeAll) p.set('includeNoActivity', 'true');
    return p.toString();
  }

  async function load() {
    setRunning(true);
    try {
      setReport(await api<MerchReport>(`/v1/reports/merchandising?${query()}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
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
      <PageHeader
        eyebrow={<BackLink href="/reports">Reports</BackLink>}
        title="Merchandising activity"
        sub="The buyer's report: stock position, inbound supply, as-is holdings and sales velocity per variant."
      />
      <Stack>
        {error && <Alert tone="error">{error}</Alert>}
        <Card>
          <Toolbar
            className="items-end"
            end={
              <Button
                size="sm"
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
                <Download size={13} aria-hidden />
                {busy ? 'Preparing…' : 'CSV'}
              </Button>
            }
          >
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
            <label className="flex items-center gap-2 self-center pb-2">
              <input
                type="checkbox"
                checked={includeAll}
                onChange={(e) => setIncludeAll(e.target.checked)}
              />
              Include no-activity products
            </label>
            <Button size="sm" variant="primary" disabled={running} onClick={() => void load()}>
              <RefreshCw size={13} aria-hidden />
              Run
            </Button>
          </Toolbar>
          {!report ? (
            <LoadingRows />
          ) : (
            <Stack>
              {report.truncated && (
                <Alert tone="warning">
                  Showing the top 2000 rows by YTD units — narrow the filters for full coverage.
                </Alert>
              )}
              <TableWrap>
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
                      <TableEmpty colSpan={13}>No rows match the filters.</TableEmpty>
                    )}
                    {report.rows.map((r) => (
                      <tr key={r.variantId}>
                        <td>
                          {r.productName}
                          {r.variantName && <span className="muted"> · {r.variantName}</span>}
                          {r.sku && <div className="muted">{r.sku}</div>}
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
              </TableWrap>
            </Stack>
          )}
        </Card>
      </Stack>
    </div>
  );
}
