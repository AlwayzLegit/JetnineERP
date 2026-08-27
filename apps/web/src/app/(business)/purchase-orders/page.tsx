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
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { rows } = list;

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
    void list.load();
    void loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function draftPo(group: SuggestionGroup) {
    if (!group.vendorId) return;
    setDrafting(true);
    try {
      const locations = await api<{ id: string }[]>('/v1/business/locations');
      if (locations.length === 0) throw new Error('Create a location first');
      const po = await api<{ id: string; number: string }>('/v1/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: group.vendorId,
          locationId: locations[0]!.id,
          place: false,
          lines: group.lines.map((l) => ({
            variantId: l.variantId,
            quantity: l.suggestedQty,
            unitCostCents: l.unitCostCents ?? 0,
          })),
        }),
      });
      toast.success(`Draft ${po.number} created`);
      await Promise.all([list.load(), loadSuggestions()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setDrafting(false);
    }
  }

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
            Set points on each product&apos;s variants.
          </p>
          {suggestions.map((g) => (
            <div key={g.vendorId ?? 'unassigned'} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <strong style={{ fontSize: 13.5 }}>
                  {g.vendorName ?? 'No preferred vendor set'}
                </strong>
                {g.vendorId ? (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={drafting}
                    onClick={() => void draftPo(g)}
                    data-testid={`draft-po-${g.vendorName}`}
                  >
                    Draft PO ({g.lines.length} item{g.lines.length === 1 ? '' : 's'})
                  </Button>
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
                    <tr key={p.id}>
                      <td>
                        <code>{p.number}</code>
                      </td>
                      <td>{p.vendorName ?? '—'}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="num">
                        <Money cents={p.subtotalCents} />
                      </td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
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
