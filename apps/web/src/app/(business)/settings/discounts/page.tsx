'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
  StatusBadge,
} from '@/components/ui';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

interface DiscountCode {
  id: string;
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  description: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  minSubtotalCents: number | null;
}

export default function DiscountsPage() {
  const [rows, setRows] = useState<DiscountCode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState<'percent' | 'fixed'>('percent');

  async function load() {
    setError(null);
    try {
      setRows(await api<DiscountCode[]>('/v1/business/discount-codes'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const data = new FormData(e.currentTarget);
      const valueRaw = String(data.get('value') ?? '');
      const value =
        kind === 'percent'
          ? Math.round(Number(valueRaw) * 100) // % → basis points
          : Math.round(Number(valueRaw) * 100); // $ → cents
      await api('/v1/business/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: String(data.get('code') ?? '').toUpperCase(),
          kind,
          value,
          description: String(data.get('description') ?? '') || null,
          startsAt: String(data.get('startsAt') ?? '') || null,
          endsAt: String(data.get('endsAt') ?? '') || null,
          usageLimit: parseLimit(data.get('usageLimit')),
          perCustomerLimit: parseLimit(data.get('perCustomerLimit')),
          minSubtotalCents: parseDollarsOrNull(data.get('minSubtotal')),
        }),
      });
      e.currentTarget.reset();
      setKind('percent');
      setCreating(false);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function toggleActive(row: DiscountCode) {
    try {
      await api(`/v1/business/discount-codes/${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function destroy(row: DiscountCode) {
    const message =
      row.usageCount > 0
        ? `Delete "${row.code}"? ${row.usageCount} prior redemption(s) will be removed too. Toggling Inactive instead keeps history.`
        : `Delete "${row.code}"?`;
    if (!confirm(message)) return;
    try {
      await api(`/v1/business/discount-codes/${row.id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/settings">← Settings</Link>
      </p>
      <PageHeader
        title="Discount codes"
        sub="Codes apply at the POS as an order-level discount. Cashiers enter the code on the payment screen; the system validates window, limits, and minimum subtotal before the sale completes."
        actions={
          <Button
            variant={creating ? 'secondary' : 'primary'}
            onClick={() => setCreating((v) => !v)}
          >
            {creating ? 'Cancel' : '+ New code'}
          </Button>
        }
      />

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {creating && (
        <Card style={{ maxWidth: 720, marginBottom: 16 }}>
          <form onSubmit={create} style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Code *">
                <Input
                  name="code"
                  required
                  placeholder="SAVE15"
                  style={{ width: '100%', textTransform: 'uppercase' }}
                />
              </Field>
              <Field label="Kind *">
                <Select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as 'percent' | 'fixed')}
                  style={{ width: '100%' }}
                >
                  <option value="percent">% off</option>
                  <option value="fixed">$ off</option>
                </Select>
              </Field>
            </div>
            <Field label={kind === 'percent' ? 'Percent (e.g. 15 = 15%) *' : 'Amount in dollars *'}>
              <Input
                name="value"
                type="number"
                step="0.01"
                min={0.01}
                required
                style={{ width: '100%' }}
              />
            </Field>
            <Field label="Description (optional)">
              <Input name="description" style={{ width: '100%' }} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Starts (optional)">
                <Input name="startsAt" type="datetime-local" style={{ width: '100%' }} />
              </Field>
              <Field label="Ends (optional)">
                <Input name="endsAt" type="datetime-local" style={{ width: '100%' }} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <Field label="Total uses (optional)">
                <Input name="usageLimit" type="number" min={1} style={{ width: '100%' }} />
              </Field>
              <Field label="Uses per customer (optional)">
                <Input name="perCustomerLimit" type="number" min={1} style={{ width: '100%' }} />
              </Field>
              <Field label="Min subtotal $ (optional)">
                <Input
                  name="minSubtotal"
                  type="number"
                  step="0.01"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Field>
            </div>
            <Button type="submit" variant="primary" style={{ width: 'fit-content' }}>
              Create code
            </Button>
          </form>
        </Card>
      )}

      <Card>
        {rows == null ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState>No discount codes yet.</EmptyState>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Window</th>
                  <th>Used</th>
                  <th>Status</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ verticalAlign: 'top' }}>
                    <td>
                      <code>{r.code}</code>
                      {r.description && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {r.kind === 'percent' ? (
                        `${(r.value / 100).toFixed(2)}%`
                      ) : (
                        <Money cents={r.value} />
                      )}
                      {r.minSubtotalCents != null && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          min <Money cents={r.minSubtotalCents} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        {r.startsAt ? new Date(r.startsAt).toLocaleDateString() : '—'} →{' '}
                        {r.endsAt ? new Date(r.endsAt).toLocaleDateString() : '∞'}
                      </div>
                    </td>
                    <td>
                      {r.usageCount}
                      {r.usageLimit != null && ` / ${r.usageLimit}`}
                      {r.perCustomerLimit != null && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {r.perCustomerLimit}/customer
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={r.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', gap: 6 }}>
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
                          {r.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => destroy(r)}>
                          Delete
                        </Button>
                      </span>
                    </td>
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

function parseLimit(raw: FormDataEntryValue | null): number | null {
  const s = raw == null ? '' : String(raw).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}
function parseDollarsOrNull(raw: FormDataEntryValue | null): number | null {
  const s = raw == null ? '' : String(raw).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
