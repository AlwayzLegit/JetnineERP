'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  Card,
  EmptyState,
  LinkButton,
  LoadingRows,
  PageHeader,
  StatusBadge,
} from '@/components/ui';

interface PoRow {
  id: string;
  number: string;
  status: string;
  vendorName: string | null;
  expectedAt: string | null;
  subtotalCents: number;
  createdAt: string;
}

export default function PurchaseOrdersPage() {
  const [rows, setRows] = useState<PoRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRows(await api<PoRow[]>('/v1/purchase-orders'));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        actions={
          <LinkButton href="/purchase-orders/new" variant="primary">
            + New PO
          </LinkButton>
        }
      />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card style={{ padding: 0 }}>
        {rows == null ? (
          <div style={{ padding: 16 }}>
            <LoadingRows />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>No purchase orders yet. Create a PO to restock from a vendor.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th className="num">Subtotal</th>
                  <th>Created</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <code>{p.number}</code>
                    </td>
                    <td>{p.vendorName ?? '—'}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="num">
                      <Money cents={p.subtotalCents} />
                    </td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/purchase-orders/${p.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
