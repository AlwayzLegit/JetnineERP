'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, Card, EmptyState, LinkButton, LoadingRows, PageHeader } from '@/components/ui';

interface DupProduct {
  id: string;
  sku: string | null;
  name: string;
  isActive: boolean;
  createdAt: string;
  priceCents: number | null;
  variants: number;
  onHand: number;
  reserved: number;
  documents: number;
  deletable: boolean;
  source: string | null;
  imported: boolean;
}
interface DupGroup {
  name: string;
  products: DupProduct[];
}

/**
 * Duplicate products (owner ask 2026-09-02): the same mattress showing
 * two or three times in the Add Product popup. One row per product that
 * shares its name with another, with what retiring it would touch, and
 * the two safe ways out — deactivate (hides it from selling, keeps its
 * history) or delete (only when nothing references it).
 */
export default function DuplicateProductsPage() {
  const [groups, setGroups] = useState<DupGroup[] | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ groups: DupGroup[]; productCount: number }>('/v1/products/duplicates');
      setGroups(r.groups);
      setCount(r.productCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function deactivate(p: DupProduct) {
    if (!confirm(`Hide ${p.name} (${p.sku ?? 'no SKU'}) from selling? Its history stays.`)) return;
    setBusy(p.id);
    try {
      await api(`/v1/products/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      });
      toast.success(`${p.sku ?? p.name} deactivated`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function keepImported(names?: string[]) {
    const scope = names ? `for "${names[0]}"` : 'in every group';
    if (
      !confirm(
        `Keep the imported copy ${scope} and deactivate the Shopify / app-built copies? Nothing is deleted.`,
      )
    )
      return;
    setBusy(names ? names[0]! : '*');
    try {
      const r = await api<{ deactivated: unknown[]; kept: number; skippedGroups: number }>(
        '/v1/products/duplicates/keep-imported',
        { method: 'POST', body: JSON.stringify(names ? { names } : {}) },
      );
      toast.success(
        `Deactivated ${r.deactivated.length}, kept ${r.kept} imported` +
          (r.skippedGroups
            ? ` · ${r.skippedGroups} group${r.skippedGroups === 1 ? '' : 's'} had no imported copy`
            : ''),
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: DupProduct) {
    if (!confirm(`Permanently delete ${p.name} (${p.sku ?? 'no SKU'})? This cannot be undone.`))
      return;
    setBusy(p.id);
    try {
      await api(`/v1/products/${p.id}`, { method: 'DELETE' });
      toast.success(`${p.sku ?? p.name} deleted`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div data-testid="duplicate-products">
      <PageHeader
        title="Duplicate products"
        actions={
          <>
            <LinkButton href="/products" variant="secondary">
              Back to products
            </LinkButton>
            {groups && groups.some((g) => canKeepImported(g)) && (
              <Button
                variant="primary"
                disabled={busy != null}
                onClick={() => void keepImported()}
                data-testid="keep-imported-all"
              >
                Keep imported copies everywhere
              </Button>
            )}
          </>
        }
      />
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
        Active products that share a name with another. Each row says where it came from (the
        STORIS/CSV import, a Shopify sync, or built here). &ldquo;Keep imported&rdquo; deactivates
        the non-import copies in a group so they stop showing at the register; nothing is deleted,
        and a deactivated product can be switched back on from its page.
        {groups && groups.length > 0 && (
          <>
            {' '}
            <strong>
              {groups.length} name{groups.length === 1 ? '' : 's'} · {count} products
            </strong>
          </>
        )}
      </p>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {groups == null ? (
        <LoadingRows />
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState>No two active products share a name.</EmptyState>
        </Card>
      ) : (
        groups.map((g) => (
          <Card
            key={g.name}
            title={g.name}
            style={{ padding: 0, marginBottom: 12 }}
            data-testid="duplicate-group"
            actions={
              canKeepImported(g) ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy != null}
                  onClick={() => void keepImported([g.name])}
                  data-testid="keep-imported-group"
                >
                  Keep imported copy
                </Button>
              ) : undefined
            }
          >
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Source</th>
                    <th className="num">Price</th>
                    <th className="num">On hand</th>
                    <th className="num">Reserved</th>
                    <th className="num">Documents</th>
                    <th>Created</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {g.products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <code>{p.sku ?? '—'}</code>
                        {p.variants > 1 && (
                          <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>
                            {p.variants} variants
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${p.imported ? 'badge-success' : 'badge-neutral'}`}
                          data-testid="duplicate-source"
                        >
                          {p.source ?? 'built here'}
                        </span>
                      </td>
                      <td className="num">
                        {p.priceCents != null ? <Money cents={p.priceCents} /> : '—'}
                      </td>
                      <td className="num">
                        <strong style={{ color: p.onHand > 0 ? 'var(--success)' : undefined }}>
                          {p.onHand}
                        </strong>
                      </td>
                      <td className="num">{p.reserved}</td>
                      <td className="num">{p.documents}</td>
                      <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', fontSize: 13 }}>
                        <Link href={`/products/${p.id}`}>Open</Link>
                        <button
                          type="button"
                          disabled={busy === p.id}
                          onClick={() => void deactivate(p)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--text)',
                            fontSize: 13,
                            marginLeft: 12,
                          }}
                          data-testid="duplicate-deactivate"
                        >
                          Deactivate
                        </button>
                        {p.deletable && (
                          <button
                            type="button"
                            disabled={busy === p.id}
                            onClick={() => void remove(p)}
                            style={{
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              color: 'var(--danger)',
                              fontSize: 13,
                              marginLeft: 12,
                            }}
                            data-testid="duplicate-delete"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function canKeepImported(g: DupGroup): boolean {
  return g.products.some((p) => p.imported) && g.products.some((p) => !p.imported);
}
