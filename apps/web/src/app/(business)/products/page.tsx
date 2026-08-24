'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
} from '@/components/ui';

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
      <PageHeader
        title="Products"
        actions={
          <>
            <LinkButton href="/products/labels" variant="secondary">
              Print labels
            </LinkButton>
            <LinkButton href="/products/new" variant="primary">
              <Plus size={14} />
              Create product
            </LinkButton>
          </>
        }
      />

      <form onSubmit={search} className="mb-4 flex flex-wrap gap-2">
        <Input
          name="q"
          placeholder="Search by name, SKU, or barcode"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setQ('');
            void load('');
          }}
        >
          Clear
        </Button>
      </form>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card style={{ padding: 0 }}>
        {rows == null ? (
          <div style={{ padding: 16 }}>
            <LoadingRows />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>
            No products match{q ? ` "${q}"` : ' yet'}. Create a product or import a CSV below.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Active</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>
                      <code>{p.sku ?? '—'}</code>
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {p.isActive ? 'yes' : 'no'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/products/${p.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <details style={{ marginTop: 24 }}>
        <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>CSV import</summary>
        <Card style={{ marginTop: 8 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 0 }}>
            Headers: <code>name,sku,price,barcode</code>. Price is in dollars (e.g. 12.50).
          </p>
          <textarea
            className="textarea"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={8}
            style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          <div style={{ marginTop: 8 }} className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => importCsv('preview')} disabled={csvBusy}>
              Preview
            </Button>
            <Button variant="primary" onClick={() => importCsv('commit')} disabled={csvBusy}>
              Commit
            </Button>
          </div>
          {csvResult && (
            <pre
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                padding: 8,
                borderRadius: 'var(--radius-sm)',
                marginTop: 8,
                marginBottom: 0,
                fontSize: 12,
                whiteSpace: 'pre-wrap',
              }}
            >
              {csvResult}
            </pre>
          )}
        </Card>
      </details>
    </div>
  );
}
