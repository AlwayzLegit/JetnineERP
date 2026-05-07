'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

interface SaleSummary {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  completedAt: string | null;
  createdAt: string;
}
interface Customer {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  recentSales: SaleSummary[];
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id as string;
  const [c, setC] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    setError(null);
    try {
      setC(await api<Customer>(`/v1/customers/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = new FormData(e.currentTarget);
      await api(`/v1/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: blankToNull(data.get('firstName')),
          lastName: blankToNull(data.get('lastName')),
          email: blankToNull(data.get('email')),
          phone: blankToNull(data.get('phone')),
          notes: blankToNull(data.get('notes')),
        }),
      });
      setSaved(true);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!confirm('Delete this customer? Past sales remain but lose the link.')) return;
    try {
      await api(`/v1/customers/${id}`, { method: 'DELETE' });
      router.push('/customers');
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  if (error && !c) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!c) return <p>Loading…</p>;

  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || '(no name)';

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/customers">← All customers</Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{name}</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
        Customer since {new Date(c.createdAt).toLocaleDateString()}
      </p>

      <Section title="Details">
        <form onSubmit={save} style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="First name">
              <input name="firstName" defaultValue={c.firstName ?? ''} style={fieldStyle} />
            </Field>
            <Field label="Last name">
              <input name="lastName" defaultValue={c.lastName ?? ''} style={fieldStyle} />
            </Field>
          </div>
          <Field label="Email">
            <input name="email" type="email" defaultValue={c.email ?? ''} style={fieldStyle} />
          </Field>
          <Field label="Phone">
            <input name="phone" defaultValue={c.phone ?? ''} style={fieldStyle} />
          </Field>
          <Field label="Notes">
            <textarea
              name="notes"
              defaultValue={c.notes ?? ''}
              rows={3}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </Field>
          {error && <p style={{ color: '#b00', margin: 0 }}>{error}</p>}
          {saved && <p style={{ color: '#070', margin: 0, fontSize: 13 }}>Saved.</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={primaryBtn}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={destroy} style={dangerBtn}>
              Delete customer
            </button>
          </div>
        </form>
      </Section>

      <Section title="Recent purchases">
        {c.recentSales.length === 0 ? (
          <p style={{ color: '#888', fontSize: 13, margin: 0 }}>No purchases yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <Th>Sale</Th>
                <Th>Status</Th>
                <Th>Total</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {c.recentSales.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <Td>
                    <code>{s.number}</code>
                  </Td>
                  <Td>{s.status}</Td>
                  <Td>
                    <Money cents={s.totalCents} />
                  </Td>
                  <Td>{new Date(s.completedAt ?? s.createdAt).toLocaleDateString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function blankToNull(v: FormDataEntryValue | null): string | null {
  const s = v == null ? '' : String(v).trim();
  return s.length > 0 ? s : null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: '#fff',
        padding: 16,
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}

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
const dangerBtn = {
  padding: '8px 14px',
  background: 'transparent',
  color: '#b00',
  border: '1px solid #b00',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
