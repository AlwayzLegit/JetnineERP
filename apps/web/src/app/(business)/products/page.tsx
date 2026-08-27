'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { CsvImport } from '@/components/csv-import';
import { LoadMore } from '@/components/load-more';
import { useCursorList } from '@/lib/use-cursor-list';
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
  const list = useCursorList<ProductRow>('/v1/products');
  const [q, setQ] = useState('');
  const { rows, error } = list;

  useEffect(() => {
    void list.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void list.load(q ? { q } : {});
  }

  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          <>
            <LinkButton href="/products/pricing" variant="secondary">
              Set prices
            </LinkButton>
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
            void list.load();
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
          <>
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
            <LoadMore state={list} noun="products" />
          </>
        )}
      </Card>

      <details style={{ marginTop: 24 }} data-testid="products-csv-import">
        <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          Import products from a CSV file
        </summary>
        <div style={{ marginTop: 8 }}>
          <CsvImport entity="product" onCommitted={() => list.load(q ? { q } : {})} />
        </div>
      </details>
    </div>
  );
}
