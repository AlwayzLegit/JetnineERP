'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface LocationRow {
  id: string;
  name: string;
}
interface VariantRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
}
interface Line {
  variantId: string;
  description: string;
  quantity: number;
}

export default function NewTransferPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [shipNow, setShipNow] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<VariantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const ls = await api<LocationRow[]>('/v1/pos/locations');
        setLocations(ls);
        if (ls.length > 0) setFromLocationId(ls[0]!.id);
        if (ls.length > 1) setToLocationId(ls[1]!.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  async function searchVariants() {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    try {
      const rows = await api<VariantRow[]>(`/v1/pos/lookup?q=${encodeURIComponent(search.trim())}`);
      setResults(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function addLine(v: VariantRow) {
    if (lines.some((l) => l.variantId === v.variantId)) return;
    setLines((prev) => [
      ...prev,
      {
        variantId: v.variantId,
        description: [v.productName, v.variantName].filter(Boolean).join(' — '),
        quantity: 1,
      },
    ]);
    setSearch('');
    setResults([]);
  }

  function setLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (fromLocationId === toLocationId) {
      setError('From and To must be different locations.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one line.');
      return;
    }
    setSaving(true);
    try {
      const created = await api<{ id: string }>('/v1/stock-transfers', {
        method: 'POST',
        body: JSON.stringify({
          fromLocationId,
          toLocationId,
          notes: notes || null,
          ship: shipNow,
          lines: lines.map((l) => ({ variantId: l.variantId, quantity: Number(l.quantity) })),
        }),
      });
      router.push(`/transfers/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>New stock transfer</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <section style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="From location">
              <select
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                style={inputStyle}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="To location">
              <select
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                style={inputStyle}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', marginTop: 8 }}
            />
          </Field>
          <label style={{ display: 'flex', gap: 6, fontSize: 13, marginTop: 8 }}>
            <input
              type="checkbox"
              checked={shipNow}
              onChange={(e) => setShipNow(e.target.checked)}
            />
            Ship immediately (skip the draft step)
          </label>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 14, margin: 0, marginBottom: 8 }}>Add items</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void searchVariants();
                }
              }}
              placeholder="Search by name, SKU, or barcode"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="button" onClick={searchVariants} style={primaryBtn}>
              Search
            </button>
          </div>
          {results.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {results.map((r) => (
                <button
                  key={r.variantId}
                  type="button"
                  onClick={() => addLine(r)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 6,
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 4,
                    marginBottom: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <strong>{r.productName}</strong> {r.variantName && <>— {r.variantName}</>}{' '}
                  <span style={{ color: '#666' }}>{r.sku ?? '—'}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 14, margin: 0, marginBottom: 12 }}>Lines</h2>
          {lines.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13 }}>No lines yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th>Quantity</Th>
                  <Th>&nbsp;</Th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={l.variantId} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <Td>{l.description}</Td>
                    <Td>
                      <input
                        type="number"
                        min={1}
                        value={l.quantity}
                        onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
                        style={{ ...inputStyle, width: 80 }}
                      />
                    </Td>
                    <Td>
                      <button type="button" onClick={() => removeLine(i)} style={linkBtnDanger}>
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
        <div>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? 'Saving…' : shipNow ? 'Create + ship' : 'Create draft'}
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
const inputStyle = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
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
const linkBtnDanger = {
  background: 'none',
  border: 'none',
  color: '#b00',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: '6px 4px',
        fontWeight: 600,
        textAlign: 'left',
        borderBottom: '1px solid #ddd',
      }}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '6px 4px' }}>{children}</td>;
}
