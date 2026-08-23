'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Field, Input, PageHeader } from '@/components/ui';

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
      <PageHeader title="New product" />
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <Card title="Basics">
          <div style={{ display: 'grid', gap: 10 }}>
            <Field label="Name">
              <Input name="name" required style={{ width: '100%' }} />
            </Field>
            <Field label="SKU (product-level, optional)">
              <Input name="sku" style={{ width: '100%' }} />
            </Field>
            <Field label="Description">
              <textarea
                className="textarea"
                name="description"
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </Field>
          </div>
        </Card>

        <Card title="Variants">
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
                <Input
                  value={v.sku}
                  onChange={(e) => setVariant(i, { sku: e.target.value })}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Name">
                <Input
                  value={v.name}
                  onChange={(e) => setVariant(i, { name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Price">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={v.priceDollars}
                  onChange={(e) => setVariant(i, { priceDollars: e.target.value })}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Cost">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={v.costDollars}
                  onChange={(e) => setVariant(i, { costDollars: e.target.value })}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Barcode">
                <Input
                  value={v.barcode}
                  onChange={(e) => setVariant(i, { barcode: e.target.value })}
                  style={{ width: '100%' }}
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                style={{ color: 'var(--danger)', marginBottom: 4 }}
                onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setVariants((prev) => [...prev, { ...blankVariant }])}
          >
            + Add variant
          </Button>
        </Card>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <div>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Create product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
