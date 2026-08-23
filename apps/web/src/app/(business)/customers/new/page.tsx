'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Card, Field, Input, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';

export default function NewCustomerPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = new FormData(e.currentTarget);
      const body = {
        firstName: blankToNull(data.get('firstName')),
        lastName: blankToNull(data.get('lastName')),
        email: blankToNull(data.get('email')),
        phone: blankToNull(data.get('phone')),
        notes: blankToNull(data.get('notes')),
      };
      const created = await api<{ id: string }>('/v1/customers', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(`/customers/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="New customer" />
      <form onSubmit={submit} style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
        <Card>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 12px' }}>
            At least one of name, email, or phone is required.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="First name">
                <Input name="firstName" style={{ width: '100%' }} />
              </Field>
              <Field label="Last name">
                <Input name="lastName" style={{ width: '100%' }} />
              </Field>
            </div>
            <Field label="Email">
              <Input name="email" type="email" style={{ width: '100%' }} />
            </Field>
            <Field label="Phone">
              <Input name="phone" style={{ width: '100%' }} />
            </Field>
            <Field label="Notes">
              <textarea
                name="notes"
                rows={3}
                className="textarea"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </Field>
          </div>
        </Card>

        {error && <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Create customer'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function blankToNull(v: FormDataEntryValue | null): string | null {
  const s = v == null ? '' : String(v).trim();
  return s.length > 0 ? s : null;
}
