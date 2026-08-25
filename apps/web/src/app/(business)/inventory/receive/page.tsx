'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PackageCheck, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Card, EmptyState, Field, Input, PageHeader, Select } from '@/components/ui';

interface Location {
  id: string;
  name: string;
  isActive: boolean;
}
interface ProductRow {
  id: string;
  sku: string | null;
  name: string;
}
interface Variant {
  id: string;
  sku: string | null;
  name: string | null;
  barcode: string | null;
}
interface ProductDetail {
  id: string;
  name: string;
  variants: Variant[];
}

interface Line {
  variantId: string;
  label: string;
  quantity: number;
}

export default function ReceivePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ProductRow[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void api<Location[]>('/v1/business/locations').then((rows) => {
      const active = rows.filter((l) => l.isActive);
      setLocations(active);
      if (active[0]) setLocationId(active[0].id);
    });
  }, []);

  async function searchProducts() {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api<{ data: ProductRow[]; nextCursor: string | null }>(
        `/v1/products?q=${encodeURIComponent(search)}&limit=10`,
      );
      setSearchResults(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function addProduct(productId: string) {
    try {
      const detail = await api<ProductDetail>(`/v1/products/${productId}`);
      // Append every variant of the matched product as a line with qty=0.
      setLines((prev) => {
        const existing = new Set(prev.map((l) => l.variantId));
        const additions = detail.variants
          .filter((v) => !existing.has(v.id))
          .map((v) => ({
            variantId: v.id,
            label: `${detail.name} — ${v.sku ?? v.name ?? v.id.slice(0, 8)}`,
            quantity: 0,
          }));
        return [...prev, ...additions];
      });
      setSearchResults([]);
      setSearch('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function setQty(i: number, qty: number) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, quantity: qty } : l)));
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function commit() {
    setError(null);
    setSuccess(null);
    if (!locationId) {
      setError('Pick a location first');
      return;
    }
    const positive = lines.filter((l) => l.quantity > 0);
    if (positive.length === 0) {
      setError('At least one line must have a positive quantity');
      return;
    }
    try {
      const result = await api<{
        lines: { onHand: number }[];
      }>('/v1/inventory/receive', {
        method: 'POST',
        body: JSON.stringify({
          locationId,
          notes: notes || undefined,
          lines: positive.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        }),
      });
      const total = positive.reduce((s, l) => s + l.quantity, 0);
      setSuccess(
        `Received ${total} unit${total === 1 ? '' : 's'} across ${positive.length} variant${
          positive.length === 1 ? '' : 's'
        }.`,
      );
      setLines([]);
      setNotes('');
      void result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/inventory">← Inventory</Link>
      </p>
      <PageHeader title="Receive inventory" />

      <Card style={{ marginBottom: 16 }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Location">
            <Select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">— Pick —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%' }}
            />
          </Field>
        </div>
      </Card>

      <Card title="Add products" style={{ marginBottom: 16 }}>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search by name, SKU, or barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void searchProducts();
              }
            }}
            className="min-w-[200px] flex-1"
          />
          <Button variant="primary" onClick={searchProducts}>
            <Search size={14} />
            Search
          </Button>
        </div>
        {searchResults.length > 0 && (
          <ul
            style={{
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 8,
              marginTop: 8,
              marginBottom: 0,
              listStyle: 'none',
            }}
          >
            {searchResults.map((p) => (
              <li key={p.id} style={{ padding: '4px 0', display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>
                  <strong>{p.name}</strong>{' '}
                  <code style={{ color: 'var(--text-secondary)' }}>{p.sku ?? '—'}</code>
                </span>
                <Button size="sm" variant="secondary" onClick={() => addProduct(p.id)}>
                  Add variants
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Lines" style={{ marginBottom: 16 }}>
        {lines.length === 0 ? (
          <EmptyState>No lines yet. Search and add a product.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Quantity</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={l.variantId}>
                    <td>{l.label}</td>
                    <td>
                      <Input
                        type="number"
                        min={0}
                        value={l.quantity}
                        onChange={(e) => setQty(i, Number(e.target.value))}
                        style={{ width: 100 }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button size="sm" variant="danger" onClick={() => removeLine(i)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {success && (
        <p data-testid="receive-success" style={{ color: 'var(--success)' }}>
          {success}
        </p>
      )}
      <Button variant="primary" onClick={commit} disabled={lines.length === 0}>
        <PackageCheck size={14} />
        Commit
      </Button>
    </div>
  );
}
