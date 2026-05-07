'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface TransferRow {
  id: string;
  number: string;
  status: string;
  fromLocationName: string | null;
  toLocationName: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export default function TransfersPage() {
  const [rows, setRows] = useState<TransferRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRows(await api<TransferRow[]>('/v1/stock-transfers'));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Stock transfers</h1>
        <Link
          href="/transfers/new"
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
          + New transfer
        </Link>
      </div>
      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {rows && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Transfer</Th>
              <Th>From</Th>
              <Th>To</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16, color: '#888' }}>
                  No transfers yet.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <Td>
                  <code>{t.number}</code>
                </Td>
                <Td>{t.fromLocationName ?? '—'}</Td>
                <Td>{t.toLocationName ?? '—'}</Td>
                <Td>
                  <Badge status={t.status} />
                </Td>
                <Td>{new Date(t.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <Link href={`/transfers/${t.id}`}>Open</Link>
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
      : status === 'in_transit'
        ? '#0066cc'
        : status === 'canceled'
          ? '#b00'
          : '#666';
  return (
    <span
      style={{ background: '#f4f4f4', color, padding: '2px 6px', borderRadius: 3, fontSize: 12 }}
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
