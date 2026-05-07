'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface CustomerRow {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  notes: string | null;
  createdAt: string;
}

export default function CustomersPage() {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load(query: string) {
    setError(null);
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      setRows(await api<CustomerRow[]>(`/v1/customers${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load('');
  }, []);

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void load(q);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Customers</h1>
        <Link
          href="/customers/new"
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            background: '#111',
            color: '#fff',
            borderRadius: 4,
            textDecoration: 'none',
            fontSize: 13,
          }}
        >
          Add customer
        </Link>
      </div>

      <form onSubmit={search} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          name="q"
          placeholder="Search by name, email, or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 10px',
            border: '1px solid #ccc',
            borderRadius: 4,
            fontSize: 14,
          }}
        />
        <button type="submit" style={primaryBtn}>
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            setQ('');
            void load('');
          }}
          style={linkBtn}
        >
          Clear
        </button>
      </form>

      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {rows && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 16, color: '#888' }}>
                  No customers match{q ? ` "${q}"` : ' yet'}.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <Td>
                  <strong>{displayName(c) || <em style={{ color: '#888' }}>—</em>}</strong>
                </Td>
                <Td>{c.email ?? '—'}</Td>
                <Td>{c.phone ?? '—'}</Td>
                <Td>
                  <Link href={`/customers/${c.id}`}>Open</Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function displayName(c: CustomerRow): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ');
}

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

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}
