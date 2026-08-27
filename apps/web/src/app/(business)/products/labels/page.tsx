'use client';

import Link from 'next/link';
import { Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '@jetnine/shared';
import { Button, Card, EmptyState, Field, Input, PageHeader, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { code128Svg } from '@/lib/code128';

interface LookupRow {
  variantId: string;
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  variantName: string | null;
  priceCents: number;
}

interface PickedLabel extends LookupRow {
  copies: number;
}

/**
 * Two layouts: a 30-up letter sheet (Avery 5160-compatible, 2.625×1")
 * and a single-column thermal label roll (2.25×1.25"). The grid is
 * plain CSS so it prints identically from any register machine.
 */
const SHEETS = {
  avery30: { label: 'Letter sheet, 30-up (Avery 5160)', cols: 3, w: '2.625in', h: '1in' },
  roll: { label: 'Label roll, 2.25 × 1.25 in', cols: 1, w: '2.25in', h: '1.25in' },
} as const;
type SheetKey = keyof typeof SHEETS;

export default function LabelsPage() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<LookupRow[]>([]);
  const [picked, setPicked] = useState<PickedLabel[]>([]);
  const [sheet, setSheet] = useState<SheetKey>('avery30');
  const [error, setError] = useState<string | null>(null);

  async function search() {
    const q = query.trim();
    if (!q) return;
    try {
      setHits(await api<LookupRow[]>(`/v1/pos/lookup?q=${encodeURIComponent(q)}&limit=200`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function add(row: LookupRow) {
    setPicked((cur) => {
      const existing = cur.find((p) => p.variantId === row.variantId);
      if (existing) {
        return cur.map((p) => (p.variantId === row.variantId ? { ...p, copies: p.copies + 1 } : p));
      }
      return [...cur, { ...row, copies: 1 }];
    });
  }

  function setCopies(variantId: string, copies: number) {
    setPicked((cur) =>
      cur.map((p) => (p.variantId === variantId ? { ...p, copies: Math.max(1, copies) } : p)),
    );
  }

  const printable = picked.flatMap((p) => {
    const code = p.barcode ?? p.sku;
    if (!code) return [];
    const svg = code128Svg(code, { height: 44 });
    if (!svg) return [];
    return Array.from({ length: p.copies }, (_, i) => ({
      ...p,
      code,
      svg,
      key: `${p.variantId}-${i}`,
    }));
  });
  const skipped = picked.filter((p) => {
    const code = p.barcode ?? p.sku;
    return !code || !code128Svg(code);
  });
  const layout = SHEETS[sheet];

  return (
    <div>
      <p style={{ marginBottom: 12 }} className="no-print">
        <Link href="/products">← Products</Link>
      </p>
      <PageHeader
        title="Barcode labels"
        sub="Pick items, set copy counts, and print a label sheet. Labels carry the variant barcode when set, otherwise the SKU."
        actions={
          <Button
            variant="primary"
            onClick={() => window.print()}
            disabled={printable.length === 0}
            data-testid="print-labels"
          >
            <Printer size={14} aria-hidden /> Print{' '}
            {printable.length > 0 && `(${printable.length})`}
          </Button>
        }
      />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="no-print">
        <Card title="Find items">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Search by name, SKU, or barcode" className="min-w-64 flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void search();
                }}
                placeholder="e.g. mattress, A-1"
                data-testid="label-search"
                className="w-full"
              />
            </Field>
            <Button variant="secondary" onClick={() => void search()}>
              Search
            </Button>
          </div>
          {hits.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="num">Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {hits.map((h) => (
                    <tr key={h.variantId}>
                      <td>
                        {h.productName}
                        {h.variantName && (
                          <span style={{ color: 'var(--text-secondary)' }}> — {h.variantName}</span>
                        )}
                      </td>
                      <td>
                        <code>{h.barcode ?? h.sku ?? '—'}</code>
                      </td>
                      <td className="num">{formatMoney(h.priceCents)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Button size="sm" onClick={() => add(h)} data-testid={`add-label-${h.sku}`}>
                          Add
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hits.length >= 200 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8 }}>
                  Showing first 200 matches — refine your search.
                </p>
              )}
            </div>
          )}
        </Card>

        <Card title="Print queue">
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <Field label="Label layout">
              <Select value={sheet} onChange={(e) => setSheet(e.target.value as SheetKey)}>
                {Object.entries(SHEETS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {picked.length === 0 ? (
            <EmptyState>Nothing queued — search above and add items.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Code</th>
                    <th className="num">Copies</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {picked.map((p) => (
                    <tr key={p.variantId}>
                      <td>
                        {p.productName}
                        {p.variantName && (
                          <span style={{ color: 'var(--text-secondary)' }}> — {p.variantName}</span>
                        )}
                      </td>
                      <td>
                        <code>{p.barcode ?? p.sku ?? 'no code — skipped'}</code>
                      </td>
                      <td className="num" style={{ width: 90 }}>
                        <Input
                          type="number"
                          min={1}
                          value={p.copies}
                          onChange={(e) => setCopies(p.variantId, Number(e.target.value))}
                          style={{ width: 70 }}
                          data-testid={`copies-${p.sku}`}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPicked((cur) => cur.filter((x) => x.variantId !== p.variantId))
                          }
                          aria-label="Remove"
                        >
                          <Trash2 size={14} aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {skipped.length > 0 && (
            <p style={{ color: 'var(--warning)', fontSize: 12, marginTop: 8 }}>
              {skipped.length} item(s) have no printable code (no barcode or SKU, or characters a
              Code 128 barcode can&apos;t carry) and will be skipped.
            </p>
          )}
        </Card>
      </div>

      {/* Print-only label grid. Same visibility trick as the receipt:
          hidden on screen, and on print everything else hides. */}
      <div className="label-sheet" data-testid="label-sheet">
        <style>{labelCss(layout.cols, layout.w, layout.h)}</style>
        {printable.map((l) => (
          <div className="label" key={l.key}>
            <div className="label-name">
              {l.productName}
              {l.variantName ? ` — ${l.variantName}` : ''}
            </div>
            <div className="label-barcode" dangerouslySetInnerHTML={{ __html: l.svg! }} />
            <div className="label-meta">
              <span className="label-code">{l.code}</span>
              <span className="label-price">{formatMoney(l.priceCents)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function labelCss(cols: number, w: string, h: string): string {
  return `
.label-sheet { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .no-print { display: none !important; }
  .label-sheet { display: grid !important; visibility: visible !important;
    position: absolute; inset: 0; grid-template-columns: repeat(${cols}, ${w});
    align-content: start; justify-content: center; gap: 0; }
  .label-sheet * { visibility: visible !important; }
  .label { width: ${w}; height: ${h}; overflow: hidden; padding: 2mm 3mm;
    box-sizing: border-box; display: flex; flex-direction: column;
    justify-content: space-between; page-break-inside: avoid; color: #000; }
  .label-name { font: 600 8pt/1.15 system-ui, sans-serif; max-height: 2.3em; overflow: hidden; }
  .label-barcode { flex: 1; min-height: 0; margin: 1mm 0; }
  .label-barcode svg { width: 100%; height: 100%; }
  .label-meta { display: flex; justify-content: space-between; align-items: baseline;
    font: 7pt ui-monospace, monospace; }
  .label-price { font-weight: 700; font-size: 9pt; }
  @page { margin: 4mm; }
}
`;
}
