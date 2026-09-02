'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  StatusBadge,
} from '@/components/ui';

interface Vendor {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  stats: {
    productsCarried: number;
    inStockProducts: number;
    inStockUnits: number;
    onPoUnits: number;
    openPos: number;
  };
}

/** A count that opens the page filtered to this vendor (owner 2026-09-02). */
function CountLink({
  n,
  href,
  sub,
  testid,
}: {
  n: number;
  href: string;
  sub?: string;
  testid: string;
}) {
  if (n === 0) {
    return (
      <span style={{ color: 'var(--text-muted)' }} data-testid={testid}>
        0
      </span>
    );
  }
  return (
    <Link href={href} data-testid={testid} style={{ fontWeight: 600 }}>
      {n}
      {sub && (
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 11.5 }}> {sub}</span>
      )}
    </Link>
  );
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
    // React nulls the synthetic event's currentTarget once the handler
    // yields — grab the form element before any await or reset() throws.
    const form = e.currentTarget;
    try {
      const data = new FormData(form);
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
      form.reset();
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
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Vendors"
        actions={
          <Button
            variant={creating ? 'secondary' : 'primary'}
            onClick={() => setCreating((v) => !v)}
          >
            {creating ? 'Cancel' : '+ New vendor'}
          </Button>
        }
      />

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {creating && (
        <Card style={{ maxWidth: 560, marginBottom: 16 }}>
          <form onSubmit={create} style={{ display: 'grid', gap: 8 }}>
            <Field label="Name *">
              <Input name="name" required style={{ width: '100%' }} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Contact name">
                <Input name="contactName" style={{ width: '100%' }} />
              </Field>
              <Field label="Email">
                <Input name="email" type="email" style={{ width: '100%' }} />
              </Field>
            </div>
            <Field label="Phone">
              <Input name="phone" style={{ width: '100%' }} />
            </Field>
            <Field label="Notes">
              <textarea
                className="textarea"
                name="notes"
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </Field>
            <div>
              <Button type="submit" variant="primary">
                <Plus size={14} />
                Create vendor
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card style={{ padding: 0 }}>
        {rows == null ? (
          <div style={{ padding: 16 }}>
            <LoadingRows />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>No vendors yet. Add a vendor to start placing purchase orders.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th className="num">Products</th>
                  <th className="num">In inventory</th>
                  <th className="num">On PO</th>
                  <th>Status</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.name}</strong>
                    </td>
                    <td>{v.contactName ?? '—'}</td>
                    <td>{v.email ?? '—'}</td>
                    <td>{v.phone ?? '—'}</td>
                    <td className="num">
                      <CountLink
                        n={v.stats.productsCarried}
                        href={`/products?vendorId=${v.id}&vendor=${encodeURIComponent(v.name)}`}
                        testid="vendor-products"
                      />
                    </td>
                    <td className="num">
                      <CountLink
                        n={v.stats.inStockProducts}
                        sub={`· ${v.stats.inStockUnits} units`}
                        href={`/inventory?vendorId=${v.id}&vendor=${encodeURIComponent(v.name)}&locationId=all`}
                        testid="vendor-in-stock"
                      />
                    </td>
                    <td className="num">
                      <CountLink
                        n={v.stats.onPoUnits}
                        sub={`· ${v.stats.openPos} PO${v.stats.openPos === 1 ? '' : 's'}`}
                        href={`/purchase-orders?vendorId=${v.id}&vendor=${encodeURIComponent(v.name)}`}
                        testid="vendor-on-po"
                      />
                    </td>
                    <td>
                      <StatusBadge status={v.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button size="sm" variant="danger" onClick={() => destroy(v.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p style={{ fontSize: 13, marginTop: 12 }}>
        <Link href="/purchase-orders">→ Purchase orders</Link>
      </p>
    </div>
  );
}
