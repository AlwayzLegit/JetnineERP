'use client';

import Link from 'next/link';
import { Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
  const [credit, setCredit] = useState<{
    balanceCents: number;
    entries: { id: string; deltaCents: number; reason: string | null; createdAt: string }[];
  } | null>(null);

  async function load() {
    setError(null);
    try {
      setC(await api<Customer>(`/v1/customers/${id}`));
      void api<{
        balanceCents: number;
        entries: { id: string; deltaCents: number; reason: string | null; createdAt: string }[];
      }>(`/v1/customers/${id}/store-credit`)
        .then(setCredit)
        .catch(() => setCredit(null));
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
      toast.error(err instanceof Error ? err.message : String(err));
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
          <div className="grid gap-2 sm:grid-cols-2">
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
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save size={14} aria-hidden />
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="danger" onClick={destroy}>
              <Trash2 size={14} aria-hidden />
              Delete customer
            </Button>
          </div>
        </form>
      </Card>

      {credit && (credit.balanceCents > 0 || credit.entries.length > 0) && (
        <Card title="Store credit" style={{ marginTop: 16 }}>
          <p style={{ fontSize: 14, marginTop: 0 }} data-testid="store-credit-balance">
            Balance: <strong>${(credit.balanceCents / 100).toFixed(2)}</strong>
            <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>
              never expires — auto-surfaces at checkout (§10)
            </span>
          </p>
          {credit.entries.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
              {credit.entries.slice(0, 10).map((e) => (
                <li key={e.id}>
                  {new Date(e.createdAt).toLocaleDateString()} —{' '}
                  <span style={{ color: e.deltaCents > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {e.deltaCents > 0 ? '+' : ''}${(e.deltaCents / 100).toFixed(2)}
                  </span>
                  {e.reason ? ` · ${e.reason}` : ''}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

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
