'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
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
      <p style={{ marginBottom: 12 }}>
        <Link href="/settings">← Settings</Link>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Discount codes</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          style={{ marginLeft: 'auto', ...primaryBtn }}
        >
          {creating ? 'Cancel' : '+ New code'}
        </button>
      </div>

      <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
        Codes apply at the POS as an order-level discount. Cashiers enter the code on the payment
        screen; the system validates window, limits, and minimum subtotal before the sale completes.
      </p>

      {error && <p style={{ color: '#b00' }}>{error}</p>}

      {creating && (
        <form onSubmit={create} style={{ ...card, display: 'grid', gap: 8, maxWidth: 720 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Code *">
              <input
                name="code"
                required
                placeholder="SAVE15"
                style={{ ...inputStyle, textTransform: 'uppercase' }}
              />
            </Field>
            <Field label="Kind *">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as 'percent' | 'fixed')}
                style={inputStyle}
              >
                <option value="percent">% off</option>
                <option value="fixed">$ off</option>
              </select>
            </Field>
          </div>
          <Field label={kind === 'percent' ? 'Percent (e.g. 15 = 15%) *' : 'Amount in dollars *'}>
            <input name="value" type="number" step="0.01" min={0.01} required style={inputStyle} />
          </Field>
          <Field label="Description (optional)">
            <input name="description" style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Starts (optional)">
              <input name="startsAt" type="datetime-local" style={inputStyle} />
            </Field>
            <Field label="Ends (optional)">
              <input name="endsAt" type="datetime-local" style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Field label="Total uses (optional)">
              <input name="usageLimit" type="number" min={1} style={inputStyle} />
            </Field>
            <Field label="Uses per customer (optional)">
              <input name="perCustomerLimit" type="number" min={1} style={inputStyle} />
            </Field>
            <Field label="Min subtotal $ (optional)">
              <input name="minSubtotal" type="number" step="0.01" min={0} style={inputStyle} />
            </Field>
          </div>
          <button type="submit" style={primaryBtn}>
            Create code
          </button>
        </form>
      )}

      <div style={card}>
        {rows == null ? (
          <p style={{ color: '#888' }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: '#888' }}>No discount codes yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <Th>Code</Th>
                <Th>Discount</Th>
                <Th>Window</Th>
                <Th>Used</Th>
                <Th>Status</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <Td>
                    <code>{r.code}</code>
                    {r.description && (
                      <div style={{ color: '#666', fontSize: 12 }}>{r.description}</div>
                    )}
                  </Td>
                  <Td>
                    {r.kind === 'percent' ? (
                      `${(r.value / 100).toFixed(2)}%`
                    ) : (
                      <Money cents={r.value} />
                    )}
                    {r.minSubtotalCents != null && (
                      <div style={{ color: '#666', fontSize: 12 }}>
                        min <Money cents={r.minSubtotalCents} />
                      </div>
                    )}
                  </Td>
                  <Td>
                    <div style={{ fontSize: 12 }}>
                      {r.startsAt ? new Date(r.startsAt).toLocaleDateString() : '—'} →{' '}
                      {r.endsAt ? new Date(r.endsAt).toLocaleDateString() : '∞'}
                    </div>
                  </Td>
                  <Td>
                    {r.usageCount}
                    {r.usageLimit != null && ` / ${r.usageLimit}`}
                    {r.perCustomerLimit != null && (
                      <div style={{ color: '#666', fontSize: 12 }}>
                        {r.perCustomerLimit}/customer
                      </div>
                    )}
                  </Td>
                  <Td>
                    {r.isActive ? (
                      <span style={{ color: '#070' }}>active</span>
                    ) : (
                      <span style={{ color: '#888' }}>inactive</span>
                    )}
                  </Td>
                  <Td>
                    <button onClick={() => toggleActive(r)} style={linkBtn}>
                      {r.isActive ? 'Disable' : 'Enable'}
                    </button>{' '}
                    <button onClick={() => destroy(r)} style={linkBtnDanger}>
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
const inputStyle = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
} as const;
const primaryBtn = {
  padding: '6px 12px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#444',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
} as const;
const linkBtnDanger = {
  background: 'none',
  border: 'none',
  color: '#b00',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
} as const;

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
