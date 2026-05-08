'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface Vendor {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function VendorsPage() {
  const [rows, setRows] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setError(null);
    try {
      setRows(await api<Vendor[]>('/v1/vendors'));
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
      await api('/v1/vendors', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          contactName: String(data.get('contactName') ?? '') || null,
          email: String(data.get('email') ?? '') || null,
          phone: String(data.get('phone') ?? '') || null,
          notes: String(data.get('notes') ?? '') || null,
        }),
      });
      e.currentTarget.reset();
      setCreating(false);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function destroy(id: string) {
    if (!confirm('Delete this vendor?')) return;
    try {
      await api(`/v1/vendors/${id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Vendors</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          style={{ marginLeft: 'auto', ...primaryBtn }}
        >
          {creating ? 'Cancel' : '+ New vendor'}
        </button>
      </div>

      {error && <p style={{ color: '#b00' }}>{error}</p>}

      {creating && (
        <form onSubmit={create} style={{ ...card, display: 'grid', gap: 8, maxWidth: 560 }}>
          <Field label="Name *">
            <input name="name" required style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Contact name">
              <input name="contactName" style={inputStyle} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" style={inputStyle} />
            </Field>
          </div>
          <Field label="Phone">
            <input name="phone" style={inputStyle} />
          </Field>
          <Field label="Notes">
            <textarea name="notes" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <button type="submit" style={primaryBtn}>
            Create vendor
          </button>
        </form>
      )}

      <div style={card}>
        {rows == null ? (
          <p style={{ color: '#888' }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: '#888' }}>No vendors yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <Th>Name</Th>
                <Th>Contact</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Status</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <Td>
                    <strong>{v.name}</strong>
                  </Td>
                  <Td>{v.contactName ?? '—'}</Td>
                  <Td>{v.email ?? '—'}</Td>
                  <Td>{v.phone ?? '—'}</Td>
                  <Td>{v.isActive ? 'active' : 'inactive'}</Td>
                  <Td>
                    <button onClick={() => destroy(v.id)} style={linkBtnDanger}>
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: 13, marginTop: 12 }}>
        <Link href="/purchase-orders">→ Purchase orders</Link>
      </p>
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
const inputStyle = {
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
