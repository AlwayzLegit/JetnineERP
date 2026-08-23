'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, EmptyState, Field, Input, LoadingRows, StatusBadge } from '@/components/ui';
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
  const id = (params?.id ?? '') as string;
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

  if (error && !c) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!c) return <LoadingRows />;

  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || '(no name)';

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/customers">← All customers</Link>
      </p>
      <h1 className="page-title" style={{ marginBottom: 4 }}>
        {name}
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 24px' }}>
        Customer since {new Date(c.createdAt).toLocaleDateString()}
      </p>

      <Card title="Details">
        <form onSubmit={save} style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="First name">
              <Input name="firstName" defaultValue={c.firstName ?? ''} style={{ width: '100%' }} />
            </Field>
            <Field label="Last name">
              <Input name="lastName" defaultValue={c.lastName ?? ''} style={{ width: '100%' }} />
            </Field>
          </div>
          <Field label="Email">
            <Input
              name="email"
              type="email"
              defaultValue={c.email ?? ''}
              style={{ width: '100%' }}
            />
          </Field>
          <Field label="Phone">
            <Input name="phone" defaultValue={c.phone ?? ''} style={{ width: '100%' }} />
          </Field>
          <Field label="Notes">
            <textarea
              name="notes"
              defaultValue={c.notes ?? ''}
              rows={3}
              className="textarea"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </Field>
          {error && <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
          {saved && <p style={{ color: 'var(--success)', margin: 0, fontSize: 13 }}>Saved.</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="danger" onClick={destroy}>
              Delete customer
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Recent purchases">
        {c.recentSales.length === 0 ? (
          <EmptyState>No purchases yet.</EmptyState>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Sale</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {c.recentSales.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code>{s.number}</code>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="num">
                      <Money cents={s.totalCents} />
                    </td>
                    <td>{new Date(s.completedAt ?? s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function blankToNull(v: FormDataEntryValue | null): string | null {
  const s = v == null ? '' : String(v).trim();
  return s.length > 0 ? s : null;
}
