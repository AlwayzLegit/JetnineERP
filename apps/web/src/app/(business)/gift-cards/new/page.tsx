'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { parseMoneyToCents } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, Field, Input, PageHeader } from '@/components/ui';

export default function NewGiftCardPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('25.00');
  const [expires, setExpires] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; code: string; initial: number } | null>(
    null,
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const cents = parseMoneyToCents(amount);
    if (cents == null || cents <= 0) {
      setError('Initial balance must be a positive amount');
      return;
    }
    setBusy(true);
    try {
      const card = await api<{ id: string; code: string; initialBalanceCents: number }>(
        '/v1/gift-cards',
        {
          method: 'POST',
          body: JSON.stringify({
            initialBalanceCents: cents,
            expiresAt: expires ? new Date(expires).toISOString() : null,
            notes: notes || null,
          }),
        },
      );
      setCreated({ id: card.id, code: card.code, initial: card.initialBalanceCents });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div style={{ maxWidth: 480 }}>
        <p style={{ marginBottom: 12 }}>
          <Link href="/gift-cards">← Gift cards</Link>
        </p>
        <PageHeader title="Card issued" />
        <div
          style={{
            background: 'var(--warning-soft)',
            border: '1px solid var(--warning)',
            color: 'var(--warning-soft-text)',
            padding: 16,
            borderRadius: 'var(--radius)',
            marginBottom: 16,
          }}
        >
          <p style={{ marginTop: 0 }}>
            <strong>Save this code — print it on the card before handing it out.</strong>
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 22,
              letterSpacing: 1,
              margin: '12px 0',
            }}
          >
            {created.code.match(/.{1,4}/g)?.join(' ')}
          </p>
          <p style={{ fontSize: 13, marginBottom: 0 }}>
            Initial balance: <Money cents={created.initial} />
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push(`/gift-cards/${created.id}`)}>
          Open card detail
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ marginBottom: 12 }}>
        <Link href="/gift-cards">← Gift cards</Link>
      </p>
      <PageHeader title="Issue a gift card" />
      <form onSubmit={submit} className="card" style={{ display: 'grid', gap: 12 }}>
        <Field label="Initial balance ($)">
          <Input
            type="text"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%' }}
          />
        </Field>
        <Field label="Expires (optional)">
          <Input
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            style={{ width: '100%' }}
          />
        </Field>
        <Field label="Notes (optional)">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%' }}
          />
        </Field>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}
        <Button type="submit" variant="primary" disabled={busy} style={{ width: 'fit-content' }}>
          {busy ? 'Issuing…' : 'Issue card'}
        </Button>
      </form>
    </div>
  );
}
