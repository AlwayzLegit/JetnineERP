'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { parseMoneyToCents } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, EmptyState, Input, LoadingRows, StatusBadge } from '@/components/ui';

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

  if (error && !card) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!card) return <LoadingRows rows={4} />;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/gift-cards">← Gift cards</Link>
      </p>
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 22 }}>
          <code>{card.code}</code>
        </h1>
        <StatusBadge status={card.status} />
      </div>

      <div className="card grid gap-4 sm:grid-cols-2">
        <div>
          <div className="field-label">Current balance</div>
          <div style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            <Money cents={card.currentBalanceCents} />
          </div>
        </div>
        <div>
          <div className="field-label">Initial balance</div>
          <div style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
            <Money cents={card.initialBalanceCents} />
          </div>
          {card.expiresAt && (
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Expires {new Date(card.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {card.status !== 'cancelled' && (
        <div className="card">
          <h2 className="card-title">Adjust balance</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="±$0.00"
              value={adjust}
              onChange={(e) => setAdjust(e.target.value)}
              style={{ width: 120 }}
            />
            <Button variant="primary" onClick={applyAdjust}>
              Apply
            </Button>
            <Button variant="danger" onClick={cancelCard}>
              Cancel card
            </Button>
            {error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</span>}
          </div>
          <p
            style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8, marginBottom: 0 }}
          >
            Use a negative amount to debit, positive to credit. Cancelling voids any remaining
            balance.
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Transactions</h2>
        {card.transactions.length === 0 ? (
          <EmptyState>No activity yet. Redemptions and adjustments will show up here.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Kind</th>
                  <th className="num">Amount</th>
                  <th className="num">Balance after</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {card.transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.kind}</td>
                    <td className="num">
                      <Money cents={t.amountCents} />
                    </td>
                    <td className="num">
                      <Money cents={t.balanceAfterCents} />
                    </td>
                    <td>
                      {t.saleId ? (
                        <Link href={`/sales/${t.saleId}`}>sale</Link>
                      ) : t.refundId ? (
                        <em>refund</em>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
