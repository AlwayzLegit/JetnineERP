'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface VariantInput {
  sku: string;
  name: string;
  priceDollars: string;
  costDollars: string;
  barcode: string;
}

const blankVariant: VariantInput = {
  sku: '',
  name: '',
  priceDollars: '',
  costDollars: '',
  barcode: '',
};

export default function NewProductPage() {
  const router = useRouter();
  const [variants, setVariants] = useState<VariantInput[]>([{ ...blankVariant }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setVariant(i: number, patch: Partial<VariantInput>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = new FormData(e.currentTarget);
      const body = {
        name: String(data.get('name') ?? ''),
        sku: String(data.get('sku') ?? '') || null,
        description: String(data.get('description') ?? '') || null,
        variants: variants
          .filter((v) => Number(v.priceDollars) > 0)
          .map((v) => ({
            sku: v.sku || null,
            name: v.name || null,
            priceCents: Math.round(Number(v.priceDollars) * 100),
            costCents: v.costDollars ? Math.round(Number(v.costDollars) * 100) : null,
            barcode: v.barcode || null,
          })),
      };
      const result = await api<{ id: string }>('/v1/products', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(`/products/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>New product</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <section style={card}>
          <h2 style={section}>Basics</h2>
          <Field label="Name">
            <input name="name" required style={fieldStyle} />
          </Field>
          <Field label="SKU (product-level, optional)">
            <input name="sku" style={fieldStyle} />
          </Field>
          <Field label="Description">
            <textarea name="description" rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
          </Field>
        </section>

        <section style={card}>
          <h2 style={section}>Variants</h2>
          {variants.map((v, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr) auto',
                gap: 8,
                marginBottom: 8,
                alignItems: 'end',
              }}
            >
              <Field label="SKU">
                <input
                  value={v.sku}
                  onChange={(e) => setVariant(i, { sku: e.target.value })}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Name">
                <input
                  value={v.name}
                  onChange={(e) => setVariant(i, { name: e.target.value })}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Price">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={v.priceDollars}
                  onChange={(e) => setVariant(i, { priceDollars: e.target.value })}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Cost">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={v.costDollars}
                  onChange={(e) => setVariant(i, { costDollars: e.target.value })}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Barcode">
                <input
                  value={v.barcode}
                  onChange={(e) => setVariant(i, { barcode: e.target.value })}
                  style={fieldStyle}
                />
              </Field>
              <button
                type="button"
                onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#b00',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: 0,
                  height: 32,
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setVariants((prev) => [...prev, { ...blankVariant }])}
            style={linkBtn}
          >
            + Add variant
          </button>
        </section>

        {error && <p style={{ color: '#b00' }}>{error}</p>}
        <div>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? 'Saving…' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
};
const section = { fontSize: 16, marginBottom: 12 } as const;
const fieldStyle = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
} as const;
const primaryBtn = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const linkBtn = {
  background: 'none',
  border: '1px dashed #ccc',
  color: '#444',
  padding: '8px 14px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
