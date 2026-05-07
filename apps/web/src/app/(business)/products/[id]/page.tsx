'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

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
  isActive: boolean;
  variants: Variant[];
  images: ProductImage[];
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const [p, setP] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setP(await api<Product>(`/v1/products/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function setVariantPrice(variantId: string, dollars: string) {
    try {
      const cents = Math.round(Number(dollars) * 100);
      await api(`/v1/products/variants/${variantId}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ priceCents: cents }),
      });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function deactivateVariant(variantId: string) {
    if (!confirm('Deactivate this variant?')) return;
    try {
      await api(`/v1/products/variants/${variantId}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
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
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function deleteImage(imageId: string) {
    if (!confirm('Delete this image?')) return;
    try {
      await api(`/v1/products/images/${imageId}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  if (error) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!p) return <p>Loading…</p>;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/products">← All products</Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{p.name}</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
        SKU <code>{p.sku ?? '—'}</code> · {p.isActive ? 'active' : 'inactive'}
      </p>

      <Section title="Variants">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Name</Th>
              <Th>SKU</Th>
              <Th>Barcode</Th>
              <Th>Price</Th>
              <Th>Cost</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {p.variants.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <Td>{v.name ?? '—'}</Td>
                <Td>
                  <code>{v.sku ?? '—'}</code>
                </Td>
                <Td>
                  <code>{v.barcode ?? '—'}</code>
                </Td>
                <Td>
                  <input
                    defaultValue={(v.priceCents / 100).toFixed(2)}
                    type="number"
                    step="0.01"
                    onBlur={(e) => {
                      if (e.target.value !== (v.priceCents / 100).toFixed(2)) {
                        void setVariantPrice(v.id, e.target.value);
                      }
                    }}
                    style={{
                      padding: '4px 6px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      width: 90,
                      fontSize: 13,
                    }}
                  />
                </Td>
                <Td>
                  {v.costCents != null ? (
                    `$${(v.costCents / 100).toFixed(2)}`
                  ) : (
                    <em style={{ color: '#888' }}>hidden</em>
                  )}
                </Td>
                <Td>
                  {v.isActive && (
                    <button onClick={() => deactivateVariant(v.id)} style={linkBtnDanger}>
                      Deactivate
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Images">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {p.images.map((img) => (
            <div
              key={img.id}
              style={{
                background: '#fafafa',
                padding: 8,
                borderRadius: 4,
                fontSize: 12,
                maxWidth: 220,
              }}
            >
              <code style={{ display: 'block', wordBreak: 'break-all', marginBottom: 6 }}>
                {img.storageKey}
              </code>
              <button onClick={() => deleteImage(img.id)} style={linkBtnDanger}>
                Delete
              </button>
            </div>
          ))}
          {p.images.length < 4 && (
            <button onClick={registerImage} style={linkBtn}>
              + Register image (max 4)
            </button>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: '#fff',
        padding: 16,
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}

const linkBtn = {
  background: 'none',
  border: '1px dashed #ccc',
  color: '#444',
  padding: '8px 14px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const linkBtnDanger = {
  background: 'none',
  border: 'none',
  color: '#b00',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
} as const;
