'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface ProductRow {
  id: string;
  sku: string | null;
  name: string;
  isActive: boolean;
}

export default function ProductsPage() {
  const [rows, setRows] = useState<ProductRow[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [csv, setCsv] = useState('name,sku,price,barcode\n');
  const [csvBusy, setCsvBusy] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);

  async function load(query: string) {
    setError(null);
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await api<{ data: ProductRow[]; nextCursor: string | null }>(
        `/v1/products${params}`,
      );
      setRows(res.data);
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

  async function importCsv(action: 'preview' | 'commit') {
    setCsvBusy(true);
    setCsvResult(null);
    try {
      const result = await api<unknown>(`/v1/products/import/${action}`, {
        method: 'POST',
        body: JSON.stringify({ csv }),
      });
      setCsvResult(JSON.stringify(result, null, 2));
      if (action === 'commit') void load(q);
    } catch (err) {
      setCsvResult(err instanceof Error ? err.message : String(err));
    } finally {
      setCsvBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Products</h1>
        <Link
          href="/products/new"
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
          Create product
        </Link>
      </div>

      <form onSubmit={search} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          name="q"
          placeholder="Search by name, SKU, or barcode"
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
              <Th>SKU</Th>
              <Th>Active</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 16, color: '#888' }}>
                  No products match{q ? ` "${q}"` : ' yet'}.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <Td>
                  <strong>{p.name}</strong>
                </Td>
                <Td>
                  <code>{p.sku ?? '—'}</code>
                </Td>
                <Td>{p.isActive ? 'yes' : 'no'}</Td>
                <Td>
                  <Link href={`/products/${p.id}`}>Open</Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <details style={{ marginTop: 32 }}>
        <summary style={{ cursor: 'pointer', fontSize: 14 }}>CSV import</summary>
        <p style={{ color: '#666', fontSize: 13 }}>
          Headers: <code>name,sku,price,barcode</code>. Price is in dollars (e.g. 12.50).
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          style={{
            width: '100%',
            fontFamily: 'monospace',
            fontSize: 12,
            padding: 8,
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button onClick={() => importCsv('preview')} disabled={csvBusy} style={primaryBtn}>
            Preview
          </button>
          <button onClick={() => importCsv('commit')} disabled={csvBusy} style={primaryBtn}>
            Commit
          </button>
        </div>
        {csvResult && (
          <pre
            style={{
              background: '#fafafa',
              padding: 8,
              borderRadius: 4,
              marginTop: 8,
              fontSize: 12,
              whiteSpace: 'pre-wrap',
            }}
          >
            {csvResult}
          </pre>
        )}
      </details>
    </div>
  );
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
