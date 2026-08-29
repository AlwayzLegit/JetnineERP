'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, Card, Input, Select } from '@/components/ui';

/**
 * The Add Product popup shared by New Sale and the order page's line
 * editor: search with vendor/stock filters, availability + ATP for the
 * chosen "From" location, click a row to add it. The caller owns what
 * "add" means (a cart line, an order line).
 */

export interface ProductSearchLocation {
  id: string;
  name: string;
  locationType?: string;
}

export interface SearchRow {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  priceCents: number;
  vendorId: string | null;
  vendorName: string | null;
  availableHere: number;
  availableTotal: number;
  atpDate: string | null;
}
interface VendorRow {
  id: string;
  name: string;
}
export function ProductSearchDialog({
  locationId,
  locationName,
  locations,
  storeId,
  onChangeLocation,
  onAdd,
  onClose,
}: {
  locationId: string;
  locationName: string | null;
  locations: ProductSearchLocation[];
  storeId: string;
  onChangeLocation: (id: string) => void;
  onAdd: (row: SearchRow) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [stockFilter, setStockFilter] = useState<'' | '1' | '0'>('');
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void api<{ data: VendorRow[] } | VendorRow[]>('/v1/vendors?limit=100')
      .then((r) => setVendors(Array.isArray(r) ? r : r.data))
      .catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (vendorId) params.set('vendorId', vendorId);
      if (stockFilter) params.set('inStock', stockFilter);
      params.set('locationId', locationId);
      params.set('limit', '100');
      void api<SearchRow[]>(`/v1/pos/product-search?${params.toString()}`)
        .then(setRows)
        .catch(() => setRows([]));
    }, 250);
  }, [q, vendorId, stockFilter, locationId]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgb(0 0 0 / 0.4)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '8vh',
      }}
      onClick={onClose}
    >
      <div
        style={{ width: 'min(760px, 94vw)' }}
        onClick={(e) => e.stopPropagation()}
        data-testid="product-search-dialog"
      >
        <Card
          title="Add Product"
          actions={
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X size={14} aria-hidden />
            </Button>
          }
        >
          <div className="mb-2 flex flex-wrap gap-2">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search model, brand, size…"
              style={{ flex: 1, minWidth: 200 }}
              data-testid="product-query"
            />
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">All vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
            <Select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
              data-testid="stock-filter"
            >
              <option value="">All stock</option>
              <option value="1">In stock</option>
              <option value="0">Not in stock</option>
            </Select>
            <Select
              value={locationId}
              onChange={(e) => onChangeLocation(e.target.value)}
              data-testid="search-source"
              aria-label="Inventory from"
            >
              {[...locations]
                .sort((a, b) =>
                  a.locationType === b.locationType
                    ? a.name.localeCompare(b.name)
                    : a.locationType === 'warehouse'
                      ? -1
                      : 1,
                )
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    From {loc.name}
                    {loc.locationType === 'warehouse' ? ' (WH)' : ''}
                    {loc.id === storeId ? ' — this store' : ''}
                  </option>
                ))}
            </Select>
          </div>
          <p className="muted" style={{ margin: '0 0 6px', fontSize: 12 }}>
            Availability and the added line&apos;s inventory source follow the &ldquo;From&rdquo;
            location — each line can still be changed on the order afterwards.
          </p>
          <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
            <table className="table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Vendor</th>
                  <th className="num">Price</th>
                  <th className="num" title={locationName ?? undefined}>
                    {locationName ? `At ${locationName}` : 'Here'}
                  </th>
                  <th className="num">All</th>
                  <th>ATP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.variantId}
                    onClick={() => onAdd(r)}
                    style={{ cursor: 'pointer' }}
                    data-testid="product-result"
                  >
                    <td>
                      {r.productName}
                      {r.variantName ? ` — ${r.variantName}` : ''}
                    </td>
                    <td>
                      <code style={{ fontSize: 11.5 }}>{r.sku ?? '—'}</code>
                    </td>
                    <td>{r.vendorName ?? '—'}</td>
                    <td className="num">
                      <Money cents={r.priceCents} />
                    </td>
                    <td className="num">{r.availableHere}</td>
                    <td className="num">{r.availableTotal}</td>
                    <td style={{ fontSize: 12 }}>
                      {r.availableTotal > 0
                        ? ''
                        : r.atpDate
                          ? `~${new Date(r.atpDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}`
                          : 'no PO'}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted" style={{ fontSize: 13 }}>
                      No matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length >= 100 && (
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              Showing first 100 — refine your search.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
