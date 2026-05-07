'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface SaleRow {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  customerId: string | null;
  associateUserId: string | null;
  locationId: string;
  completedAt: string | null;
  createdAt: string;
}

export default function SalesPage() {
  const [rows, setRows] = useState<SaleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ data: SaleRow[]; nextCursor: string | null }>('/v1/sales');
        setRows(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Sales</h1>
        <Link
          href="/pos"
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
          Open register
        </Link>
      </div>
      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {rows && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Sale</Th>
              <Th>Status</Th>
              <Th>Total</Th>
              <Th>Date</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: '#888' }}>
                  No sales yet.
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <Td>
                  <code>{s.number}</code>
                </Td>
                <Td>
                  <Badge status={s.status} />
                </Td>
                <Td>${(s.totalCents / 100).toFixed(2)}</Td>
                <Td>{new Date(s.completedAt ?? s.createdAt).toLocaleString()}</Td>
                <Td>
                  <Link href={`/sales/${s.id}`}>Open</Link>
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
    status === 'completed'
      ? '#070'
      : status === 'refunded'
        ? '#b00'
        : status === 'partially_refunded'
          ? '#a60'
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
