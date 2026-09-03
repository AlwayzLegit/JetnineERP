'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { parseMoneyToCents } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  Alert,
  BackLink,
  Button,
  Card,
  Field,
  FormActions,
  FormGrid,
  Input,
  LoadingRows,
  PageHeader,
  Stack,
  StatGrid,
  StatTile,
  StatusBadge,
  TableEmpty,
  TableWrap,
} from '@/components/ui';

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
  const [busy, setBusy] = useState<'adjust' | 'cancel' | null>(null);

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
    setBusy('adjust');
    try {
      await api(`/v1/gift-cards/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ amountCents: cents }),
      });
      setAdjust('');
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function cancelCard() {
    if (!confirm('Cancel this gift card? Remaining balance will be voided.')) return;
    setBusy('cancel');
    try {
      await api(`/v1/gift-cards/${id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  if (error && !card) {
    return (
      <div>
        <PageHeader
          title="Gift card not found"
          eyebrow={<BackLink href="/gift-cards">Gift cards</BackLink>}
        />
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }
  if (!card) return <LoadingRows rows={4} />;

  const adjustable = card.status !== 'cancelled';

  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/gift-cards">Gift cards</BackLink>}
        title={<code>{card.code}</code>}
        meta={<StatusBadge status={card.status} />}
        sub={`Issued ${new Date(card.createdAt).toLocaleDateString()}`}
      />

      <Stack>
        <StatGrid cols={3}>
          <StatTile
            label="Current balance"
            value={<Money cents={card.currentBalanceCents} />}
            tone="brand"
          />
          <StatTile label="Initial balance" value={<Money cents={card.initialBalanceCents} />} />
          <StatTile
            label="Expires"
            value={card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : 'Never'}
          />
        </StatGrid>

        {/* The adjust card owns the error when it is shown; otherwise the
            page shows it (e.g. a refresh failure on a cancelled card). */}
        {error && !adjustable && <Alert tone="error">{error}</Alert>}

        {adjustable && (
          <Card
            title="Adjust balance"
            description="Use a negative amount to debit, positive to credit. Cancelling voids any remaining balance."
          >
            <FormGrid cols={2}>
              <Field label="Amount">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="±$0.00"
                  value={adjust}
                  onChange={(e) => setAdjust(e.target.value)}
                />
              </Field>
            </FormGrid>
            {error && (
              <Alert tone="error" className="mt-3">
                {error}
              </Alert>
            )}
            <FormActions
              start={
                <Button variant="danger" size="sm" onClick={cancelCard} disabled={busy != null}>
                  {busy === 'cancel' ? 'Cancelling…' : 'Cancel card'}
                </Button>
              }
            >
              <Button variant="primary" onClick={applyAdjust} disabled={busy != null}>
                {busy === 'adjust' ? 'Applying…' : 'Apply'}
              </Button>
            </FormActions>
          </Card>
        )}

        <Card title="Transactions" flush>
          <TableWrap>
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
                {card.transactions.length === 0 && (
                  <TableEmpty colSpan={5}>
                    No activity yet. Redemptions and adjustments will show up here.
                  </TableEmpty>
                )}
                {card.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="nowrap">{new Date(t.createdAt).toLocaleString()}</td>
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
          </TableWrap>
        </Card>
      </Stack>
    </div>
  );
}
