'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
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
  PageHeader,
  Stack,
  StatGrid,
  StatTile,
} from '@/components/ui';

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
      <div>
        <PageHeader
          eyebrow={<BackLink href="/gift-cards">Gift cards</BackLink>}
          title="Card issued"
          actions={
            <Button variant="primary" onClick={() => router.push(`/gift-cards/${created.id}`)}>
              Open card detail
            </Button>
          }
        />
        <Stack className="form-narrow">
          <Alert
            tone="warning"
            title="Save this code — print it on the card before handing it out."
          />
          <StatGrid cols={2}>
            <StatTile
              label="Code"
              value={
                <code className="tracking-wider">{created.code.match(/.{1,4}/g)?.join(' ')}</code>
              }
            />
            <StatTile label="Initial balance" value={<Money cents={created.initial} />} />
          </StatGrid>
        </Stack>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/gift-cards">Gift cards</BackLink>}
        title="Issue a gift card"
      />
      <Card title="Card details" className="form-narrow">
        <form onSubmit={submit}>
          <FormGrid cols={2}>
            <Field label="Initial balance ($)" required>
              <Input
                type="text"
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Expires" hint="Optional">
              <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </Field>
            <Field label="Notes" hint="Optional" className="form-span">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </FormGrid>
          {error && (
            <Alert tone="error" className="mt-3">
              {error}
            </Alert>
          )}
          <FormActions>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Issuing…' : 'Issue card'}
            </Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
