'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Location {
  id: string;
  name: string;
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
      setLocations(rows);
      if (rows[0]) setLocationId(rows[0].id);
    });
  }, []);

  async function searchProducts() {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const rows = await api<ProductRow[]>(`/v1/products?q=${encodeURIComponent(search)}&limit=10`);
      setSearchResults(rows);
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
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Receive inventory</h1>

      <section style={card}>
        <Field label="Location">
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            style={fieldStyle}
          >
            <option value="">— Pick —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} style={fieldStyle} />
        </Field>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Add products</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Search by name, SKU, or barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void searchProducts();
              }
            }}
            style={{ ...fieldStyle, flex: 1 }}
          />
          <button onClick={searchProducts} style={primaryBtn}>
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul style={{ background: '#fafafa', padding: 8, marginTop: 8, listStyle: 'none' }}>
            {searchResults.map((p) => (
              <li key={p.id} style={{ padding: '4px 0', display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>
                  <strong>{p.name}</strong> <code style={{ color: '#666' }}>{p.sku ?? '—'}</code>
                </span>
                <button onClick={() => addProduct(p.id)} style={linkBtn}>
                  Add variants
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Lines</h2>
        {lines.length === 0 ? (
          <p style={{ color: '#888', fontSize: 13 }}>No lines yet. Search and add a product.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <Th>Variant</Th>
                <Th>Quantity</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.variantId} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <Td>{l.label}</Td>
                  <Td>
                    <input
                      type="number"
                      min={0}
                      value={l.quantity}
                      onChange={(e) => setQty(i, Number(e.target.value))}
                      style={{ ...fieldStyle, width: 100 }}
                    />
                  </Td>
                  <Td>
                    <button onClick={() => removeLine(i)} style={linkBtnDanger}>
                      Remove
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {success && (
        <p data-testid="receive-success" style={{ color: '#080' }}>
          {success}
        </p>
      )}
      <button onClick={commit} disabled={lines.length === 0} style={primaryBtn}>
        Commit
      </button>
    </div>
  );
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
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
  border: 'none',
  color: '#06c',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 13,
  padding: 0,
} as const;
const linkBtnDanger = { ...linkBtn, color: '#b00' } as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}
