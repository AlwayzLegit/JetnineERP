'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

interface GiftCard {
  id: string;
  code: string;
  initialBalanceCents: number;
  currentBalanceCents: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function GiftCardsPage() {
  const [rows, setRows] = useState<GiftCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ data: GiftCard[]; nextCursor: string | null }>('/v1/gift-cards');
        setRows(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Gift cards</h1>
        <Link
          href="/gift-cards/new"
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
          + Issue new
        </Link>
      </div>
      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {rows && (
        <div
          style={{
            background: '#fff',
            padding: 16,
            borderRadius: 6,
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {rows.length === 0 ? (
            <p style={{ color: '#888' }}>No gift cards issued yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                  <Th>Code</Th>
                  <Th>Balance</Th>
                  <Th>Issued for</Th>
                  <Th>Status</Th>
                  <Th>Issued</Th>
                  <Th>Expires</Th>
                  <Th>&nbsp;</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <Td>
                      <code>{g.code}</code>
                    </Td>
                    <Td>
                      <Money cents={g.currentBalanceCents} />
                      <div style={{ color: '#888', fontSize: 11 }}>
                        of <Money cents={g.initialBalanceCents} />
                      </div>
                    </Td>
                    <Td>—</Td>
                    <Td>
                      <Badge status={g.status} />
                    </Td>
                    <Td>{new Date(g.createdAt).toLocaleDateString()}</Td>
                    <Td>{g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : '—'}</Td>
                    <Td>
                      <Link href={`/gift-cards/${g.id}`}>Open</Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const color =
    status === 'active'
      ? '#070'
      : status === 'redeemed'
        ? '#666'
        : status === 'cancelled'
          ? '#b00'
          : '#a60';
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
  return <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>{children}</td>;
}
