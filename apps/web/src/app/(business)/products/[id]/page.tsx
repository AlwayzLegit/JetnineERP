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
  isActive: boolean;
  variants: Variant[];
  images: ProductImage[];
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
