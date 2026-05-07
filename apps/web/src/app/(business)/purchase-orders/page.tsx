'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Purchase orders</h1>
        <Link
          href="/purchase-orders/new"
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
          + New PO
        </Link>
      </div>
      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {rows && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>PO</Th>
              <Th>Vendor</Th>
              <Th>Status</Th>
              <Th>Subtotal</Th>
              <Th>Created</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16, color: '#888' }}>
                  No purchase orders yet.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <Td>
                  <code>{p.number}</code>
                </Td>
                <Td>{p.vendorName ?? '—'}</Td>
                <Td>
                  <Badge status={p.status} />
                </Td>
                <Td>${(p.subtotalCents / 100).toFixed(2)}</Td>
                <Td>{new Date(p.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <Link href={`/purchase-orders/${p.id}`}>Open</Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const color =
    status === 'received'
      ? '#070'
      : status === 'partially_received'
        ? '#a60'
        : status === 'canceled'
          ? '#b00'
          : status === 'ordered'
            ? '#0066cc'
            : '#666';
  return (
    <span
      style={{
        background: '#f4f4f4',
        color,
        padding: '2px 6px',
        borderRadius: 3,
        fontSize: 12,
      }}
    >
      {status}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}
