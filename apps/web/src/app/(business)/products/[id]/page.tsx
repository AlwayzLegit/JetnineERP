'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { centsToInputString } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, Card, Input, LoadingRows, PageHeader, Select, StatusBadge } from '@/components/ui';

interface Variant {
  id: string;
  sku: string | null;
  name: string | null;
  barcode: string | null;
  priceCents: number;
  costCents: number | null;
  isActive: boolean;
  reorderPoint: number | null;
  reorderQty: number | null;
  preferredVendorId: string | null;
  vendorSku: string | null;
}
interface Vendor {
  id: string;
  name: string;
}
interface ProductImage {
  id: string;
  storageKey: string;
  altText: string | null;
  position: number;
}
interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  taxClassId: string | null;
  brandId: string | null;
  collectionId: string | null;
  isActive: boolean;
  variants: Variant[];
  images: ProductImage[];
}
interface RefEntity {
  id: string;
  name: string;
  isActive: boolean;
}
interface TaxClass {
  id: string;
  name: string;
  rateBps: number;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [p, setP] = useState<Product | null>(null);
  const [taxClasses, setTaxClasses] = useState<TaxClass[]>([]);
  const [brands, setBrands] = useState<RefEntity[]>([]);
  const [collections, setCollections] = useState<RefEntity[]>([]);
  const [newBrand, setNewBrand] = useState('');
  const [newCollection, setNewCollection] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setP(await api<Product>(`/v1/products/${id}`));
      // Tax classes are gated by business.settings.view; if the
      // current user doesn't have it, just silently render the
      // picker as read-only.
      try {
        setTaxClasses(await api<TaxClass[]>('/v1/business/tax-classes'));
      } catch {
        setTaxClasses([]);
      }
      try {
        setBrands(await api<RefEntity[]>('/v1/brands'));
        setCollections(await api<RefEntity[]>('/v1/collections'));
      } catch {
        setBrands([]);
        setCollections([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function setTaxClass(taxClassId: string | null) {
    try {
      await api(`/v1/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ taxClassId }),
      });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function patchProduct(patch: Record<string, unknown>) {
    try {
      await api(`/v1/products/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function createAndAssign(kind: 'brand' | 'collection', name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const created = await api<{ id: string }>(
        kind === 'brand' ? '/v1/brands' : '/v1/collections',
        {
          method: 'POST',
          body: JSON.stringify({ name: trimmed }),
        },
      );
      await api(`/v1/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(
          kind === 'brand' ? { brandId: created.id } : { collectionId: created.id },
        ),
      });
      if (kind === 'brand') setNewBrand('');
      else setNewCollection('');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function setVariantPrice(variantId: string, dollars: string) {
    try {
      const cents = Math.round(Number(dollars) * 100);
      await api(`/v1/products/variants/${variantId}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ priceCents: cents }),
      });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function deactivateVariant(variantId: string) {
    if (!confirm('Deactivate this variant?')) return;
    try {
      await api(`/v1/products/variants/${variantId}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function registerImage() {
    const contentType = prompt('Content type', 'image/png');
    if (!contentType) return;
    try {
      const url = await api<{ uploadUrl: string; storageKey: string }>(
        `/v1/products/${id}/images/upload-url`,
        {
          method: 'POST',
          body: JSON.stringify({ contentType }),
        },
      );
      // In production the client uploads to url.uploadUrl with PUT; here
      // we just register the key (the test environment uses a placeholder
      // upload URL, and most dev runs don't need to transfer bytes).
      await api(`/v1/products/${id}/images`, {
        method: 'POST',
        body: JSON.stringify({ storageKey: url.storageKey }),
      });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function deleteImage(imageId: string) {
    if (!confirm('Delete this image?')) return;
    try {
      await api(`/v1/products/images/${imageId}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!p) return <LoadingRows rows={5} />;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/products">← All products</Link>
      </p>
      <PageHeader
        title={p.name}
        sub={
          <>
            SKU <code>{p.sku ?? '—'}</code> ·{' '}
            <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
          </>
        }
      />

      {taxClasses.length > 0 && (
        <Card title="Tax class" style={{ marginBottom: 16 }}>
          <p
            style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 0, marginBottom: 8 }}
          >
            Override the location/business default tax rate for this product. Manage classes in{' '}
            <Link href="/settings/tax-classes">Settings → Tax classes</Link>.
          </p>
          <Select value={p.taxClassId ?? ''} onChange={(e) => setTaxClass(e.target.value || null)}>
            <option value="">(use location/business default)</option>
            {taxClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {(c.rateBps / 100).toFixed(2)}%
              </option>
            ))}
          </Select>
        </Card>
      )}

      <Card title="Brand & collection" style={{ marginBottom: 16 }}>
        <div className="flex flex-wrap gap-4">
          <div style={{ minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Brand</label>
            <Select
              value={p.brandId ?? ''}
              onChange={(e) => void patchProduct({ brandId: e.target.value || null })}
            >
              <option value="">(no brand)</option>
              {brands
                .filter((b) => b.isActive || b.id === p.brandId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="New brand…"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                style={{ width: 150 }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!newBrand.trim()}
                onClick={() => void createAndAssign('brand', newBrand)}
              >
                Add
              </Button>
            </div>
          </div>
          <div style={{ minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Collection</label>
            <Select
              value={p.collectionId ?? ''}
              onChange={(e) => void patchProduct({ collectionId: e.target.value || null })}
            >
              <option value="">(no collection)</option>
              {collections
                .filter((c) => c.isActive || c.id === p.collectionId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="New collection…"
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value)}
                style={{ width: 150 }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!newCollection.trim()}
                onClick={() => void createAndAssign('collection', newCollection)}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 0, marginTop: 8 }}>
          The invoice&apos;s Brand column prints this brand; without one it falls back to the
          variant&apos;s preferred vendor.
        </p>
      </Card>

      <Card title="Variants" style={{ marginBottom: 16 }}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Barcode</th>
                <th>Price</th>
                <th>Cost</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {p.variants.map((v) => (
                <tr key={v.id}>
                  <td>{v.name ?? '—'}</td>
                  <td>
                    <code>{v.sku ?? '—'}</code>
                  </td>
                  <td>
                    <code>{v.barcode ?? '—'}</code>
                  </td>
                  <td>
                    <Input
                      defaultValue={centsToInputString(v.priceCents)}
                      type="number"
                      step="0.01"
                      onBlur={(e) => {
                        if (e.target.value !== centsToInputString(v.priceCents)) {
                          void setVariantPrice(v.id, e.target.value);
                        }
                      }}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td>
                    {v.costCents != null ? (
                      <Money cents={v.costCents} />
                    ) : (
                      <em className="muted">hidden</em>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {v.isActive && (
                      <Button size="sm" variant="danger" onClick={() => deactivateVariant(v.id)}>
                        Deactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ReorderSettingsCard variants={p.variants} onSaved={load} />

      <Card title="Images">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {p.images.map((img) => (
            <div
              key={img.id}
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                padding: 8,
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                maxWidth: 220,
              }}
            >
              <code style={{ display: 'block', wordBreak: 'break-all', marginBottom: 6 }}>
                {img.storageKey}
              </code>
              <Button size="sm" variant="danger" onClick={() => deleteImage(img.id)}>
                Delete
              </Button>
            </div>
          ))}
          {p.images.length < 4 && (
            <Button variant="secondary" onClick={registerImage}>
              + Register image (max 4)
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Reorder automation per variant: the stock level that triggers a
 * suggestion, how many to order, and which vendor's PO it lands on.
 * Saved per row — a blank point turns the variant's automation off.
 */
function ReorderSettingsCard({
  variants,
  onSaved,
}: {
  variants: Variant[];
  onSaved: () => Promise<void> | void;
}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<
    Record<string, { point: string; qty: string; vendorId: string; vendorSku: string }>
  >({});

  useEffect(() => {
    void api<Vendor[]>('/v1/vendors')
      .then(setVendors)
      .catch(() => setVendors([]));
  }, []);

  function valueFor(v: Variant) {
    return (
      draft[v.id] ?? {
        point: v.reorderPoint != null ? String(v.reorderPoint) : '',
        qty: v.reorderQty != null ? String(v.reorderQty) : '',
        vendorId: v.preferredVendorId ?? '',
        vendorSku: v.vendorSku ?? '',
      }
    );
  }

  async function save(v: Variant) {
    const d = valueFor(v);
    setSavingId(v.id);
    try {
      const sentVendorSku = d.vendorSku.trim() === '' ? null : d.vendorSku.trim();
      const res = await api<{ vendorSku?: string | null }>(
        `/v1/products/variants/${v.id}/reorder`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            reorderPoint: d.point === '' ? null : Number(d.point),
            reorderQty: d.qty === '' ? null : Number(d.qty),
            preferredVendorId: d.vendorId === '' ? null : d.vendorId,
            vendorSku: sentVendorSku,
          }),
        },
      );
      // Trust but verify: only claim success if the server echoed the
      // vendor SKU back. A backend that predates the field returns 200
      // without the key while silently dropping it — a false "saved"
      // here would tell a buyer the part number reached the PO.
      if (sentVendorSku !== null && (res.vendorSku ?? null) !== sentVendorSku) {
        toast.error(
          'Reorder point saved, but the server did not store the vendor SKU — the API may need an update.',
        );
        await onSaved();
        return;
      }
      toast.success('Reorder settings saved');
      await onSaved();
      setDraft((cur) => {
        const next = { ...cur };
        delete next[v.id];
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card title="Reorder automation" style={{ marginBottom: 16 }}>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>
        When available stock (on hand − committed, all locations) falls to the reorder point, the
        item appears in Purchasing → Reorder suggestions under its vendor. Leave the point blank to
        turn automation off for a variant. If the vendor uses a different part number than your SKU
        (common for Shopify-synced catalogs), set it as the Vendor SKU — purchase orders will show
        the vendor&apos;s number.
      </p>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Variant</th>
              <th className="num">Reorder point</th>
              <th className="num">Order qty</th>
              <th>Preferred vendor</th>
              <th>Vendor SKU</th>
              <th>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {variants
              .filter((v) => v.isActive)
              .map((v) => {
                const d = valueFor(v);
                return (
                  <tr key={v.id}>
                    <td>{v.name ?? <code>{v.sku ?? v.id.slice(0, 8)}</code>}</td>
                    <td className="num">
                      <Input
                        type="number"
                        min={0}
                        value={d.point}
                        placeholder="off"
                        onChange={(e) =>
                          setDraft((cur) => ({ ...cur, [v.id]: { ...d, point: e.target.value } }))
                        }
                        style={{ width: 80 }}
                        data-testid={`reorder-point-${v.sku}`}
                      />
                    </td>
                    <td className="num">
                      <Input
                        type="number"
                        min={1}
                        value={d.qty}
                        placeholder="auto"
                        onChange={(e) =>
                          setDraft((cur) => ({ ...cur, [v.id]: { ...d, qty: e.target.value } }))
                        }
                        style={{ width: 80 }}
                      />
                    </td>
                    <td>
                      <Select
                        value={d.vendorId}
                        onChange={(e) =>
                          setDraft((cur) => ({
                            ...cur,
                            [v.id]: { ...d, vendorId: e.target.value },
                          }))
                        }
                      >
                        <option value="">— none —</option>
                        {vendors.map((vd) => (
                          <option key={vd.id} value={vd.id}>
                            {vd.name}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      <Input
                        value={d.vendorSku}
                        placeholder={v.sku ? `same as ${v.sku}` : 'vendor part #'}
                        onChange={(e) =>
                          setDraft((cur) => ({
                            ...cur,
                            [v.id]: { ...d, vendorSku: e.target.value },
                          }))
                        }
                        style={{ width: 130 }}
                        data-testid={`vendor-sku-${v.sku}`}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={savingId === v.id}
                        onClick={() => void save(v)}
                        data-testid={`save-reorder-${v.sku}`}
                      >
                        Save
                      </Button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
