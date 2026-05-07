'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface Vendor {
  id: string;
  name: string;
}
interface LocationRow {
  id: string;
  name: string;
}
interface VariantRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  priceCents: number;
}
interface Line {
  variantId: string;
  description: string;
  quantity: number;
  unitCostStr: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [expectedAt, setExpectedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<VariantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [vs, ls] = await Promise.all([
          api<Vendor[]>('/v1/vendors'),
          api<LocationRow[]>('/v1/pos/locations'),
        ]);
        setVendors(vs);
        setLocations(ls);
        if (vs.length > 0) setVendorId(vs[0]!.id);
        if (ls.length > 0) setLocationId(ls[0]!.id);
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
        unitCostStr: '',
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
    if (lines.length === 0) {
      setError('Add at least one line.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        vendorId,
        locationId,
        expectedAt: expectedAt || undefined,
        notes: notes || null,
        lines: lines.map((l) => ({
          variantId: l.variantId,
          quantity: Number(l.quantity),
          unitCostCents: Math.round(Number(l.unitCostStr) * 100),
        })),
      };
      for (const l of body.lines) {
        if (!Number.isInteger(l.quantity) || l.quantity <= 0) {
          throw new Error('Each line needs a positive integer quantity.');
        }
        if (!Number.isFinite(l.unitCostCents) || l.unitCostCents < 0) {
          throw new Error('Each line needs a unit cost.');
        }
      }
      const created = await api<{ id: string }>('/v1/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(`/purchase-orders/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  const subtotalCents = lines.reduce(
    (s, l) => s + Math.round(Number(l.unitCostStr) * 100) * Number(l.quantity || 0),
    0,
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>New purchase order</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <section style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Vendor">
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                style={inputStyle}
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <Field label="Expected delivery">
              <input
                type="date"
                value={expectedAt}
                onChange={(e) => setExpectedAt(e.target.value)}
                style={inputStyle}
              />
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
                  <Th>Qty</Th>
                  <Th>Unit cost ($)</Th>
                  <Th align="right">Line total</Th>
                  <Th>&nbsp;</Th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const lineTotal =
                    Math.round(Number(l.unitCostStr) * 100) * Number(l.quantity || 0);
                  return (
                    <tr key={l.variantId} style={{ borderBottom: '1px solid #f3f3f3' }}>
                      <Td>{l.description}</Td>
                      <Td>
                        <input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
                          style={{ ...inputStyle, width: 70 }}
                        />
                      </Td>
                      <Td>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={l.unitCostStr}
                          onChange={(e) => setLine(i, { unitCostStr: e.target.value })}
                          style={{ ...inputStyle, width: 100 }}
                        />
                      </Td>
                      <Td align="right">${(lineTotal / 100).toFixed(2)}</Td>
                      <Td>
                        <button type="button" onClick={() => removeLine(i)} style={linkBtnDanger}>
                          Remove
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: 8, fontWeight: 600, textAlign: 'right' }}>
                    Subtotal
                  </td>
                  <td style={{ padding: 8, fontWeight: 600, textAlign: 'right' }}>
                    ${(subtotalCents / 100).toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {error && <p style={{ color: '#b00' }}>{error}</p>}
        <div>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? 'Saving…' : 'Place order'}
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
function Th({ children, align }: { children: React.ReactNode; align?: 'right' | 'left' }) {
  return (
    <th
      style={{
        padding: '6px 4px',
        fontWeight: 600,
        textAlign: align ?? 'left',
        borderBottom: '1px solid #ddd',
      }}
    >
      {children}
    </th>
  );
}
function Td({ children, align }: { children: React.ReactNode; align?: 'right' | 'left' }) {
  return <td style={{ padding: '6px 4px', textAlign: align ?? 'left' }}>{children}</td>;
}
