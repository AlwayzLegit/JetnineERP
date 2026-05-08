'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { parseMoneyToCents } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

interface GiftCardTransaction {
  id: string;
  kind: string;
  amountCents: number;
  balanceAfterCents: number;
  saleId: string | null;
  refundId: string | null;
  notes: string | null;
  createdAt: string;
}

interface GiftCardDetail {
  id: string;
  code: string;
  initialBalanceCents: number;
  currentBalanceCents: number;
  status: string;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: GiftCardTransaction[];
}

export default function GiftCardDetailPage() {
  const params = useParams();
  const id = (params?.id ?? '') as string;
  const [card, setCard] = useState<GiftCardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjust, setAdjust] = useState('');

  async function load() {
    try {
      setCard(await api<GiftCardDetail>(`/v1/gift-cards/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function applyAdjust() {
    setError(null);
    const cents = parseMoneyToCents(adjust);
    if (cents == null || cents === 0) {
      setError('Adjustment must be a non-zero amount');
      return;
    }
    try {
      await api(`/v1/gift-cards/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ amountCents: cents }),
      });
      setAdjust('');
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function cancelCard() {
    if (!confirm('Cancel this gift card? Remaining balance will be voided.')) return;
    try {
      await api(`/v1/gift-cards/${id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (error && !card) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!card) return <p>Loading…</p>;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/gift-cards">← Gift cards</Link>
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>
          <code>{card.code}</code>
        </h1>
        <span
          style={{
            background: '#f4f4f4',
            color: card.status === 'active' ? '#070' : '#666',
            padding: '2px 8px',
            borderRadius: 3,
            fontSize: 12,
          }}
        >
          {card.status}
        </span>
      </div>

      <div style={{ ...card_style, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ color: '#666', fontSize: 12 }}>Current balance</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            <Money cents={card.currentBalanceCents} />
          </div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: 12 }}>Initial balance</div>
          <div style={{ fontSize: 16 }}>
            <Money cents={card.initialBalanceCents} />
          </div>
          {card.expiresAt && (
            <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
              Expires {new Date(card.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {card.status !== 'cancelled' && (
        <div style={card_style}>
          <h2 style={section}>Adjust balance</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="±$0.00"
              value={adjust}
              onChange={(e) => setAdjust(e.target.value)}
              style={{ ...inputStyle, width: 120 }}
            />
            <button onClick={applyAdjust} style={primaryBtn}>
              Apply
            </button>
            <button onClick={cancelCard} style={dangerBtn}>
              Cancel card
            </button>
            {error && <span style={{ color: '#b00', fontSize: 13 }}>{error}</span>}
          </div>
          <p style={{ color: '#666', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
            Use a negative amount to debit, positive to credit. Cancelling voids any remaining
            balance.
          </p>
        </div>
      )}

      <div style={card_style}>
        <h2 style={section}>Transactions</h2>
        {card.transactions.length === 0 ? (
          <p style={{ color: '#888' }}>No activity yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <Th>When</Th>
                <Th>Kind</Th>
                <Th>Amount</Th>
                <Th>Balance after</Th>
                <Th>Reference</Th>
              </tr>
            </thead>
            <tbody>
              {card.transactions.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <Td>{new Date(t.createdAt).toLocaleString()}</Td>
                  <Td>{t.kind}</Td>
                  <Td>
                    <Money cents={t.amountCents} />
                  </Td>
                  <Td>
                    <Money cents={t.balanceAfterCents} />
                  </Td>
                  <Td>
                    {t.saleId ? (
                      <Link href={`/sales/${t.saleId}`}>sale</Link>
                    ) : t.refundId ? (
                      <em>refund</em>
                    ) : (
                      <span style={{ color: '#888' }}>—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const card_style = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
const section = { fontSize: 16, marginBottom: 12, marginTop: 0 } as const;
const inputStyle = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
} as const;
const primaryBtn = {
  padding: '6px 12px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const dangerBtn = {
  padding: '6px 12px',
  background: 'transparent',
  color: '#b00',
  border: '1px solid #b00',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>{children}</td>;
}
