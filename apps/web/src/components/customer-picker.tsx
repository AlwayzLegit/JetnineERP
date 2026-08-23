'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

/**
 * Customer search-or-create modal, shared by the POS register and the
 * order writer. Extracted from pos/page.tsx on Day 2 of the STORIS
 * cutover so both surfaces attach customers through the same flow.
 */

export interface CustomerRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

export function customerDisplayName(c: CustomerRow): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '(no name)';
}

export function CustomerPicker({
  onPick,
  onCancel,
}: {
  onPick: (c: CustomerRow) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    try {
      const res = await api<{ data: CustomerRow[]; nextCursor: string | null }>(
        `/v1/customers?q=${encodeURIComponent(q)}`,
      );
      setRows(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createNew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const data = new FormData(e.currentTarget);
      const created = await api<CustomerRow>('/v1/customers', {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.get('firstName') || null,
          lastName: data.get('lastName') || null,
          email: data.get('email') || null,
          phone: data.get('phone') || null,
        }),
      });
      onPick(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={modalBackdrop}>
      <div style={{ ...modal, maxWidth: 480 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Attach customer</h2>
        {creating ? (
          <form onSubmit={createNew} style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input name="firstName" placeholder="First name" style={fieldStyle} />
              <input name="lastName" placeholder="Last name" style={fieldStyle} />
            </div>
            <input name="email" type="email" placeholder="Email" style={fieldStyle} />
            <input name="phone" placeholder="Phone" style={fieldStyle} />
            {error && <p style={{ color: '#b00', fontSize: 12, margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={primaryBtn}>
                Create & attach
              </button>
              <button type="button" onClick={() => setCreating(false)} style={linkBtn}>
                Back
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void search();
                }}
                placeholder="Search by name, email, or phone"
                style={{ ...fieldStyle, flex: 1 }}
              />
              <button onClick={search} style={linkBtn}>
                Search
              </button>
            </div>
            <div style={{ maxHeight: 240, overflow: 'auto' }}>
              {rows.length === 0 && (
                <p style={{ color: '#888', fontSize: 13, margin: 0 }}>No matches.</p>
              )}
              {rows.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onPick(c)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 8,
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 4,
                    marginBottom: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <strong>{customerDisplayName(c)}</strong>{' '}
                  <span style={{ color: '#666' }}>{c.email ?? c.phone ?? ''}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={() => setCreating(true)} style={linkBtn}>
                + New customer
              </button>
              <button onClick={onCancel} style={linkBtn}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
  padding: '8px 14px',
  background: 'transparent',
  color: '#444',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const modalBackdrop = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
} as const;
const modal = {
  background: '#fff',
  padding: 20,
  borderRadius: 6,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  width: '90%',
} as const;
