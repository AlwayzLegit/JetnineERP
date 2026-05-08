'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface Location {
  id: string;
  name: string;
  timezone: string;
  taxRateBps: number | null;
  isActive: boolean;
}

export default function LocationsPage() {
  const [rows, setRows] = useState<Location[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await api<Location[]>('/v1/business/locations'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const data = new FormData(e.currentTarget);
      const taxRaw = String(data.get('taxRateBps') ?? '').trim();
      await api('/v1/business/locations', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          timezone: String(data.get('timezone') ?? ''),
          taxRateBps: taxRaw ? Number(taxRaw) : null,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function toggle(loc: Location) {
    try {
      await api(`/v1/business/locations/${loc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !loc.isActive }),
      });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Locations</h1>
      <form onSubmit={submit} style={card}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Add location</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Field label="Name">
            <input name="name" required style={fieldStyle} />
          </Field>
          <Field label="Timezone">
            <input name="timezone" defaultValue="America/New_York" required style={fieldStyle} />
          </Field>
          <Field label="Tax override (bps; blank = inherit)">
            <input name="taxRateBps" type="number" min={0} style={fieldStyle} />
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" style={primaryBtn}>
            Create
          </button>
        </div>
      </form>
      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {rows && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Name</Th>
              <Th>Timezone</Th>
              <Th>Tax</Th>
              <Th>Active</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: '#888' }}>
                  No locations yet.
                </td>
              </tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <Td>
                  <strong>{l.name}</strong>
                </Td>
                <Td>{l.timezone}</Td>
                <Td>{l.taxRateBps != null ? `${(l.taxRateBps / 100).toFixed(2)}%` : 'inherit'}</Td>
                <Td>{l.isActive ? 'yes' : 'no'}</Td>
                <Td>
                  <button onClick={() => toggle(l)} style={linkBtn}>
                    {l.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
