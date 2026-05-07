'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface TaxClass {
  id: string;
  name: string;
  description: string | null;
  rateBps: number;
  isDefault: boolean;
  productCount: number;
}

export default function TaxClassesPage() {
  const [rows, setRows] = useState<TaxClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setError(null);
    try {
      setRows(await api<TaxClass[]>('/v1/business/tax-classes'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const data = new FormData(e.currentTarget);
      await api('/v1/business/tax-classes', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          description: String(data.get('description') ?? '') || null,
          rateBps: Math.round(Number(data.get('rate') ?? 0) * 100),
          isDefault: data.get('isDefault') === 'on',
        }),
      });
      e.currentTarget.reset();
      setCreating(false);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function save(id: string, patch: Partial<TaxClass>) {
    try {
      await api(`/v1/business/tax-classes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setEditing(null);
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function destroy(row: TaxClass) {
    const message =
      row.productCount > 0
        ? `Delete "${row.name}"? ${row.productCount} product(s) will fall back to the location/business default tax rate.`
        : `Delete "${row.name}"?`;
    if (!confirm(message)) return;
    try {
      await api(`/v1/business/tax-classes/${row.id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/settings">← Settings</Link>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Tax classes</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          style={{ marginLeft: 'auto', ...primaryBtn }}
        >
          {creating ? 'Cancel' : '+ New tax class'}
        </button>
      </div>

      <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
        Tax classes override the location/business default rate at the product level. Products
        without a class use the default. Rates are entered as percentages (e.g. <code>8.75</code> =
        8.75%).
      </p>

      {error && <p style={{ color: '#b00' }}>{error}</p>}

      {creating && (
        <form onSubmit={create} style={{ ...card, display: 'grid', gap: 8, maxWidth: 560 }}>
          <Field label="Name *">
            <input name="name" required style={inputStyle} />
          </Field>
          <Field label="Rate (%) *">
            <input
              name="rate"
              type="number"
              step="0.01"
              min={0}
              max={1000}
              required
              style={inputStyle}
            />
          </Field>
          <Field label="Description">
            <input name="description" style={inputStyle} />
          </Field>
          <label style={{ display: 'flex', gap: 6, fontSize: 13 }}>
            <input name="isDefault" type="checkbox" />
            Use as the default class for new products
          </label>
          <button type="submit" style={primaryBtn}>
            Create class
          </button>
        </form>
      )}

      <div style={card}>
        {rows == null ? (
          <p style={{ color: '#888' }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: '#888' }}>No tax classes yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <Th>Name</Th>
                <Th>Rate</Th>
                <Th>Default</Th>
                <Th>Products</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) =>
                editing === r.id ? (
                  <EditRow
                    key={r.id}
                    row={r}
                    onSave={(patch) => save(r.id, patch)}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <Td>
                      <strong>{r.name}</strong>
                      {r.description && (
                        <div style={{ color: '#666', fontSize: 12 }}>{r.description}</div>
                      )}
                    </Td>
                    <Td>{(r.rateBps / 100).toFixed(2)}%</Td>
                    <Td>{r.isDefault ? 'yes' : '—'}</Td>
                    <Td>{r.productCount}</Td>
                    <Td>
                      <button onClick={() => setEditing(r.id)} style={linkBtn}>
                        Edit
                      </button>{' '}
                      <button onClick={() => destroy(r)} style={linkBtnDanger}>
                        Delete
                      </button>
                    </Td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EditRow({
  row,
  onSave,
  onCancel,
}: {
  row: TaxClass;
  onSave: (patch: Partial<TaxClass> & { rateBps?: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [rate, setRate] = useState((row.rateBps / 100).toFixed(2));
  const [isDefault, setIsDefault] = useState(row.isDefault);

  return (
    <tr style={{ borderBottom: '1px solid #f3f3f3' }}>
      <Td>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </Td>
      <Td>
        <input
          type="number"
          step="0.01"
          min={0}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          style={{ ...inputStyle, width: 90 }}
        />
      </Td>
      <Td>
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
      </Td>
      <Td>{row.productCount}</Td>
      <Td>
        <button
          onClick={() =>
            onSave({
              name,
              rateBps: Math.round(Number(rate) * 100),
              isDefault,
            })
          }
          style={primaryBtn}
        >
          Save
        </button>{' '}
        <button onClick={onCancel} style={linkBtn}>
          Cancel
        </button>
      </Td>
    </tr>
  );
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
const inputStyle = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
} as const;
const primaryBtn = {
  padding: '6px 12px',
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
  color: '#444',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
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

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
