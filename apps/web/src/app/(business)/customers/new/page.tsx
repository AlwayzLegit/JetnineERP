'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
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
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>New customer</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
        <section style={card}>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>
            At least one of name, email, or phone is required.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="First name">
              <input name="firstName" style={fieldStyle} />
            </Field>
            <Field label="Last name">
              <input name="lastName" style={fieldStyle} />
            </Field>
          </div>
          <Field label="Email">
            <input name="email" type="email" style={fieldStyle} />
          </Field>
          <Field label="Phone">
            <input name="phone" style={fieldStyle} />
          </Field>
          <Field label="Notes">
            <textarea name="notes" rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
          </Field>
        </section>

        {error && <p style={{ color: '#b00' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? 'Saving…' : 'Create customer'}
          </button>
          <button type="button" onClick={() => router.back()} style={linkBtn}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function blankToNull(v: FormDataEntryValue | null): string | null {
  const s = v == null ? '' : String(v).trim();
  return s.length > 0 ? s : null;
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  display: 'grid',
  gap: 8,
};
const fieldStyle = {
  width: '100%',
  padding: '6px 8px',
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
  fontSize: 13,
} as const;
const linkBtn = {
  padding: '8px 14px',
  background: 'transparent',
  color: '#444',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
