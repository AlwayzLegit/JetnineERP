'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { LoadMore } from '@/components/load-more';
import { useCursorList } from '@/lib/use-cursor-list';
import { Money } from '@/components/money';
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  LoadingRows,
  PageHeader,
  StatusBadge,
} from '@/components/ui';

interface PoRow {
  id: string;
  number: string;
  status: string;
  vendorName: string | null;
  expectedAt: string | null;
  subtotalCents: number;
  createdAt: string;
  /** Soft-deleted draft (CR 2026-08-31); only ever set under "Show deleted". */
  deletedAt: string | null;
  deletedByEmail: string | null;
}

interface SuggestionLine {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  vendorSku: string | null;
  available: number;
  reorderPoint: number;
  suggestedQty: number;
  unitCostCents: number | null;
}
interface SuggestionGroup {
  vendorId: string | null;
  vendorName: string | null;
  lines: SuggestionLine[];
}

export default function PurchaseOrdersPage() {
  const list = useCursorList<PoRow>('/v1/purchase-orders');
  const [suggestions, setSuggestions] = useState<SuggestionGroup[] | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { rows } = list;

  // Vendor door (owner 2026-09-02): /purchase-orders?vendorId=…&vendor=Name
  // from the vendors page's "on PO" count.
  const [vendor, setVendor] = useState<{ id: string; name: string } | null>(null);
  const reload = (deleted = showDeleted, v = vendor) =>
    list.load({
      ...(deleted ? { includeDeleted: '1' } : {}),
      ...(v ? { vendorId: v.id } : {}),
    });

  async function restore(po: PoRow) {
    try {
      await api(`/v1/purchase-orders/${po.id}/restore`, { method: 'POST' });
      toast.success(`${po.number} restored.`);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadSuggestions() {
    try {
      const s = await api<{ vendors: SuggestionGroup[] }>(
        '/v1/purchase-orders/reorder-suggestions',
      );
      setSuggestions(s.vendors);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const vendorId = sp.get('vendorId');
    const v = vendorId ? { id: vendorId, name: sp.get('vendor') ?? 'vendor' } : null;
    setVendor(v);
    void reload(showDeleted, v);
    void loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        actions={
          <LinkButton href="/purchase-orders/new" variant="primary">
            + New PO
          </LinkButton>
        }
      />
      {(error ?? list.error) && <p style={{ color: 'var(--danger)' }}>{error ?? list.error}</p>}

      {suggestions != null && suggestions.length > 0 && (
        <Card
          title="Reorder suggestions"
          actions={
            <Button
              size="sm"
              onClick={() => void loadSuggestions()}
              aria-label="Refresh suggestions"
            >
              <RefreshCw size={13} aria-hidden />
            </Button>
          }
          data-testid="reorder-suggestions"
        >
          <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>
            Items at or below their reorder point (available = on hand − committed, all locations).
            Set points on each product&apos;s variants. <strong>Review &amp; order</strong> opens
            the builder with these lines staged — nothing is written until you save there.
          </p>
          {suggestions.map((g) => (
            <div key={g.vendorId ?? 'unassigned'} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <strong style={{ fontSize: 13.5 }}>
                  {g.vendorName ?? 'No preferred vendor set'}
                </strong>
                {g.vendorId ? (
                  // CR 2026-08-31: this used to POST a numbered draft on
                  // the first click, which is how the list filled with
                  // $0.00 shells. It now opens the staging screen with
                  // the suggestions loaded but nothing written.
                  <LinkButton
                    size="sm"
                    variant="primary"
                    href={`/purchase-orders/new?vendorId=${g.vendorId}&preload=reorder`}
                    data-testid={`review-po-${g.vendorName}`}
                  >
                    Review &amp; order ({g.lines.length} item{g.lines.length === 1 ? '' : 's'})
                  </LinkButton>
                ) : (
                  <span className="muted" style={{ fontSize: 12 }}>
                    <Link href="/vendors" style={{ color: 'inherit' }}>
                      create a vendor
                    </Link>{' '}
                    and assign it on the variant to draft automatically
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="num">Available</th>
                      <th className="num">Point</th>
                      <th className="num">Suggested</th>
                      <th className="num">Unit cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.lines.map((l) => (
                      <tr key={l.variantId}>
                        <td>
                          {l.productName}
                          {l.variantName && (
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {' '}
                              — {l.variantName}
                            </span>
                          )}
                        </td>
                        <td>
                          <code>{l.vendorSku ?? l.sku ?? '—'}</code>
                          {l.vendorSku && l.sku && l.vendorSku !== l.sku && (
                            <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                              ours: {l.sku}
                            </span>
                          )}
                        </td>
                        <td className="num" style={{ color: 'var(--danger)', fontWeight: 600 }}>
                          {l.available}
                        </td>
                        <td className="num">{l.reorderPoint}</td>
                        <td className="num">
                          <strong>{l.suggestedQty}</strong>
                        </td>
                        <td className="num">
                          {l.unitCostCents != null ? <Money cents={l.unitCostCents} /> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ padding: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 14,
            padding: '10px 12px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {vendor && (
            <span style={{ fontSize: 12.5, marginRight: 'auto' }} data-testid="po-vendor-chip">
              Vendor: <strong>{vendor.name}</strong>{' '}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: '0 6px', fontSize: 12 }}
                onClick={() => {
                  setVendor(null);
                  window.history.replaceState(null, '', '/purchase-orders');
                  void reload(showDeleted, null);
                }}
              >
                clear
              </button>
            </span>
          )}
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
            data-testid="show-deleted-toggle"
          >
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                void reload(e.target.checked);
              }}
            />
            Show deleted
          </label>
        </div>
        {rows == null ? (
          <div style={{ padding: 16 }}>
            <LoadingRows />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>No purchase orders yet. Create a PO to restock from a vendor.</EmptyState>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>PO</th>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th className="num">Subtotal</th>
                    <th>Created</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      data-testid={p.deletedAt ? 'po-row-deleted' : 'po-row'}
                      style={p.deletedAt ? { opacity: 0.55 } : undefined}
                    >
                      <td>
                        <code>{p.number}</code>
                        {p.deletedAt && (
                          <div className="muted" style={{ fontSize: 11 }}>
                            deleted {new Date(p.deletedAt).toLocaleString()}
                            {p.deletedByEmail ? ` by ${p.deletedByEmail}` : ''}
                          </div>
                        )}
                      </td>
                      <td>{p.vendorName ?? '—'}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="num">
                        <Money cents={p.subtotalCents} />
                      </td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {p.deletedAt && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => void restore(p)}
                              data-testid={`restore-${p.number}`}
                            >
                              Restore
                            </button>{' '}
                          </>
                        )}
                        <Link href={`/purchase-orders/${p.id}`}>Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LoadMore state={list} noun="purchase orders" />
          </>
        )}
      </Card>
    </div>
  );
}
