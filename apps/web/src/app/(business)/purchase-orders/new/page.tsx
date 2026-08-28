'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, Card, EmptyState, Field, Input, PageHeader, Select } from '@/components/ui';

interface Vendor {
  id: string;
  name: string;
}
interface LocationRow {
  id: string;
  name: string;
}
interface VariantRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  priceCents: number;
}
interface Line {
  variantId: string;
  description: string;
  quantity: number;
  unitCostStr: string;
  /** Set when the line buys for a specific customer order (queue pre-load). */
  orderLineId?: string;
  /** Display-only: the sales order this line is bought for. */
  orderNumber?: string;
}

interface ReorderSuggestion {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  available: number;
  reorderPoint: number;
  suggestedQty: number;
  unitCostCents: number | null;
}

interface QueueRow {
  orderLineId: string;
  orderNumber: string;
  customerName: string | null;
  variantId: string | null;
  sku: string | null;
  preferredVendorId: string | null;
  unitCostCents: number | null;
  description: string;
  toOrder: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [expectedAt, setExpectedAt] = useState('');
  const [freightStr, setFreightStr] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<VariantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reorder, setReorder] = useState<ReorderSuggestion[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);

  // §6 builder pre-load for the selected vendor: (a) items at/below
  // their reorder point, (b) sold-not-in-stock special-order lines.
  useEffect(() => {
    if (!vendorId) return;
    let stale = false;
    void api<{
      vendors: { vendorId: string | null; lines: ReorderSuggestion[] }[];
    }>('/v1/purchase-orders/reorder-suggestions')
      .then((r) => {
        if (stale) return;
        setReorder(r.vendors.find((v) => v.vendorId === vendorId)?.lines ?? []);
      })
      .catch(() => setReorder([]));
    void api<QueueRow[]>('/v1/special-orders/queue')
      .then((rows) => {
        if (stale) return;
        setQueue(rows.filter((r) => r.variantId && r.preferredVendorId === vendorId));
      })
      .catch(() => setQueue([]));
    return () => {
      stale = true;
    };
  }, [vendorId]);

  useEffect(() => {
    void (async () => {
      try {
        const [vs, ls] = await Promise.all([
          api<Vendor[]>('/v1/vendors'),
          api<LocationRow[]>('/v1/pos/locations'),
        ]);
        setVendors(vs);
        setLocations(ls);
        if (vs.length > 0) setVendorId(vs[0]!.id);
        if (ls.length > 0) setLocationId(ls[0]!.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  async function searchVariants() {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    try {
      const rows = await api<VariantRow[]>(`/v1/pos/lookup?q=${encodeURIComponent(search.trim())}`);
      setResults(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function addLine(v: VariantRow) {
    if (lines.some((l) => l.variantId === v.variantId)) return;
    setLines((prev) => [
      ...prev,
      {
        variantId: v.variantId,
        description: [v.productName, v.variantName].filter(Boolean).join(' — '),
        quantity: 1,
        unitCostStr: '',
      },
    ]);
    setSearch('');
    setResults([]);
  }

  function setLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (lines.length === 0) {
      setError('Add at least one line.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        vendorId,
        locationId,
        expectedAt: expectedAt || undefined,
        freightCents: freightStr ? Math.round(Number(freightStr) * 100) : null,
        notes: notes || null,
        lines: lines.map((l) => ({
          variantId: l.variantId,
          quantity: Number(l.quantity),
          unitCostCents: Math.round(Number(l.unitCostStr) * 100),
          orderLineId: l.orderLineId,
        })),
      };
      for (const l of body.lines) {
        if (!Number.isInteger(l.quantity) || l.quantity <= 0) {
          throw new Error('Each line needs a positive integer quantity.');
        }
        if (!Number.isFinite(l.unitCostCents) || l.unitCostCents < 0) {
          throw new Error('Each line needs a unit cost.');
        }
      }
      const created = await api<{ id: string }>('/v1/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(`/purchase-orders/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  const subtotalCents = lines.reduce(
    (s, l) => s + Math.round(Number(l.unitCostStr) * 100) * Number(l.quantity || 0),
    0,
  );

  return (
    <div>
      <PageHeader title="New purchase order" />
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Vendor">
              <Select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                style={{ width: '100%' }}
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
              {vendors.length === 0 && (
                <span className="muted" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                  No vendors yet —{' '}
                  <Link href="/vendors" style={{ color: 'inherit' }}>
                    create one first
                  </Link>
                  .
                </span>
              )}
            </Field>
            <Field label="Location">
              <Select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                style={{ width: '100%' }}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div style={{ marginTop: 8 }} className="grid gap-3 sm:grid-cols-2">
            <Field label="Expected delivery">
              <Input
                type="date"
                value={expectedAt}
                onChange={(e) => setExpectedAt(e.target.value)}
                style={{ width: '100%' }}
              />
            </Field>
            <Field label="Freight ($, spread into unit cost at receipt)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={freightStr}
                onChange={(e) => setFreightStr(e.target.value)}
                style={{ width: '100%' }}
              />
            </Field>
          </div>
          <Field label="Notes" style={{ marginTop: 8 }}>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </Field>
        </Card>

        {(reorder.length > 0 || queue.length > 0) && (
          <Card title="Suggested for this vendor" data-testid="builder-suggestions">
            {reorder.length > 0 && (
              <>
                <p className="muted" style={{ fontSize: 12.5, margin: '0 0 6px' }}>
                  At or below reorder point:
                </p>
                {reorder.map((s) => (
                  <div
                    key={s.variantId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      {s.productName}
                      {s.variantName ? ` — ${s.variantName}` : ''}{' '}
                      <span style={{ color: 'var(--text-muted)' }}>
                        ({s.available} avail, point {s.reorderPoint})
                      </span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={lines.some((l) => l.variantId === s.variantId && !l.orderLineId)}
                      onClick={() =>
                        setLines((prev) => [
                          ...prev,
                          {
                            variantId: s.variantId,
                            description: [s.productName, s.variantName].filter(Boolean).join(' — '),
                            quantity: s.suggestedQty,
                            unitCostStr:
                              s.unitCostCents != null ? (s.unitCostCents / 100).toFixed(2) : '',
                          },
                        ])
                      }
                    >
                      Add {s.suggestedQty}
                    </Button>
                  </div>
                ))}
              </>
            )}
            {queue.length > 0 && (
              <>
                <p className="muted" style={{ fontSize: 12.5, margin: '8px 0 6px' }}>
                  Sold, not in stock (order carries the sales order #):
                </p>
                {queue.map((q) => (
                  <div
                    key={q.orderLineId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      {q.description}{' '}
                      <span style={{ color: 'var(--text-muted)' }}>
                        for {q.orderNumber}
                        {q.customerName ? ` (${q.customerName})` : ''}
                      </span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={lines.some((l) => l.orderLineId === q.orderLineId)}
                      onClick={() =>
                        setLines((prev) => [
                          ...prev,
                          {
                            variantId: q.variantId!,
                            description: q.description,
                            quantity: q.toOrder,
                            unitCostStr:
                              q.unitCostCents != null ? (q.unitCostCents / 100).toFixed(2) : '',
                            orderLineId: q.orderLineId,
                            orderNumber: q.orderNumber,
                          },
                        ])
                      }
                    >
                      Add {q.toOrder}
                    </Button>
                  </div>
                ))}
              </>
            )}
          </Card>
        )}

        <Card title="Add items">
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
              placeholder="Search by name, SKU, or barcode"
              className="min-w-[200px] flex-1"
            />
            <Button type="button" variant="primary" onClick={searchVariants}>
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
                  onClick={() => addLine(r)}
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
        </Card>

        <Card title="Lines">
          {lines.length === 0 ? (
            <EmptyState>No lines yet. Search for an item above to add it to the order.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit cost ($)</th>
                    <th className="num">Line total</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => {
                    const lineTotal =
                      Math.round(Number(l.unitCostStr) * 100) * Number(l.quantity || 0);
                    return (
                      <tr key={`${l.variantId}-${l.orderLineId ?? i}`}>
                        <td>
                          {l.description}
                          {l.orderNumber && (
                            <span
                              className="badge badge-info"
                              style={{ marginLeft: 6, fontSize: 11 }}
                            >
                              for {l.orderNumber}
                            </span>
                          )}
                        </td>
                        <td>
                          <Input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
                            style={{ width: 70 }}
                          />
                        </td>
                        <td>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={l.unitCostStr}
                            onChange={(e) => setLine(i, { unitCostStr: e.target.value })}
                            style={{ width: 100 }}
                          />
                        </td>
                        <td className="num">
                          <Money cents={lineTotal} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => removeLine(i)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: 8, fontWeight: 600, textAlign: 'right' }}>
                      Subtotal
                    </td>
                    <td className="num" style={{ padding: 8, fontWeight: 600 }}>
                      <Money cents={subtotalCents} />
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <div>
          <Button type="submit" variant="primary" disabled={saving}>
            <Plus size={14} />
            {saving ? 'Saving…' : 'Place order'}
          </Button>
        </div>
      </form>
    </div>
  );
}
