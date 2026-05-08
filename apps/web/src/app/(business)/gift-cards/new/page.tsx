'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { parseMoneyToCents } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

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
        <h1 style={{ fontSize: 22, marginBottom: 16 }}>Card issued</h1>
        <div
          style={{
            background: '#fff8e1',
            border: '1px solid #f0a000',
            color: '#5a3500',
            padding: 16,
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          <p style={{ marginTop: 0 }}>
            <strong>Save this code — print it on the card before handing it out.</strong>
          </p>
          <p
            style={{
              fontFamily: 'ui-monospace, monospace',
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
        <button onClick={() => router.push(`/gift-cards/${created.id}`)} style={primaryBtn}>
          Open card detail
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ marginBottom: 12 }}>
        <Link href="/gift-cards">← Gift cards</Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Issue a gift card</h1>
      <form
        onSubmit={submit}
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 6,
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
          display: 'grid',
          gap: 12,
        }}
      >
        <Field label="Initial balance ($)">
          <input
            type="text"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Expires (optional)">
          <input
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Notes (optional)">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
        </Field>
        {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={busy} style={primaryBtn}>
          {busy ? 'Issuing…' : 'Issue card'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
} as const;
const primaryBtn = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  width: 'fit-content',
} as const;
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
