'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { CsvImport } from '@/components/csv-import';
import { LoadMore } from '@/components/load-more';
import { useCursorList } from '@/lib/use-cursor-list';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
  Stack,
  StatusBadge,
  TableWrap,
  Toolbar,
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
  // Vendor door (owner 2026-09-02): /products?vendorId=…&vendor=Name from
  // the vendors page's "products we carry" count.
  const [vendor, setVendor] = useState<{ id: string; name: string } | null>(null);
  const { rows, error } = list;

  const params = (query: string, v = vendor) => ({
    ...(query ? { q: query } : {}),
    ...(v ? { vendorId: v.id } : {}),
  });

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const vendorId = sp.get('vendorId');
    const v = vendorId ? { id: vendorId, name: sp.get('vendor') ?? 'vendor' } : null;
    setVendor(v);
    void list.load(params('', v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void list.load(params(q));
  }

  // Owner 2026-08-31: delete straight from the list — same endpoint as
  // the product page's button. The server refuses (with the exact
  // reason) any product that still has stock or document history, so a
  // wrong click can never gut an invoice; the refusal shows as a toast.
  async function deleteProduct(p: ProductRow) {
    if (!confirm(`Permanently delete ${p.name} and all its variants? This cannot be undone.`))
      return;
    try {
      await api(`/v1/products/${p.id}`, { method: 'DELETE' });
      toast.success(`${p.name} deleted`);
      void list.load(params(q));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          <>
            <LinkButton href="/products/duplicates" variant="secondary" size="sm">
              Find duplicates
            </LinkButton>
            <LinkButton href="/products/pricing" variant="secondary" size="sm">
              Set prices
            </LinkButton>
            <LinkButton href="/products/labels" variant="secondary" size="sm">
              Print labels
            </LinkButton>
            <LinkButton href="/products/new" variant="primary">
              <Plus size={14} />
              Create product
            </LinkButton>
          </>
        }
      />

      <form onSubmit={search}>
        <Toolbar>
          <Input
            name="q"
            placeholder="Search by name, SKU, or barcode"
            aria-label="Search by name, SKU, or barcode"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ('');
              void list.load(params(''));
            }}
          >
            Clear
          </Button>
        </Toolbar>
      </form>

      <Stack>
        {vendor && (
          <Alert
            tone="info"
            data-testid="products-vendor-chip"
            action={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVendor(null);
                  window.history.replaceState(null, '', '/products');
                  void list.load(params(q, null));
                }}
              >
                clear
              </Button>
            }
          >
            Showing products from <strong>{vendor.name}</strong>
          </Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}

        {rows == null ? (
          <Card>
            <LoadingRows />
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <EmptyState
              title={q ? `No products match "${q}"` : 'No products yet'}
              action={
                q ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQ('');
                      void list.load(params(''));
                    }}
                  >
                    Clear search
                  </Button>
                ) : (
                  <LinkButton href="/products/new" variant="secondary" size="sm">
                    Create product
                  </LinkButton>
                )
              }
            >
              Create a product or import a CSV below.
            </EmptyState>
          </Card>
        ) : (
          <Card flush>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Active</th>
                    <th className="actions" />
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
                        <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                      </td>
                      <td className="actions">
                        <LinkButton href={`/products/${p.id}`} variant="secondary" size="sm">
                          Open
                        </LinkButton>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => void deleteProduct(p)}
                          aria-label={`Delete ${p.name}`}
                          title="Delete this product (only when unused — no stock, no documents)"
                          data-testid="product-row-delete"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <LoadMore state={list} noun="products" />
          </Card>
        )}

        <Card>
          <details data-testid="products-csv-import">
            <summary className="section-title cursor-pointer">
              Import products from a CSV file
            </summary>
            <div className="pt-3">
              <CsvImport entity="product" onCommitted={() => list.load(params(q))} />
            </div>
          </details>
        </Card>
      </Stack>
    </div>
  );
}
