'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES } from '@jetnine/shared';
import { api } from '@/lib/api';

interface Settings {
  id: string;
  slug: string;
  name: string;
  status: string;
  currencyCode: string;
  defaultTaxRateBps: number;
  receiptHeader: string | null;
  receiptFooter: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    try {
      setSettings(await api<Settings>('/v1/business/settings'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData(e.currentTarget);
      const body = {
        name: String(data.get('name') ?? ''),
        currencyCode: String(data.get('currencyCode') ?? settings.currencyCode),
        defaultTaxRateBps: Number(data.get('defaultTaxRateBps') ?? '0'),
        receiptHeader: String(data.get('receiptHeader') ?? '') || null,
        receiptFooter: String(data.get('receiptFooter') ?? '') || null,
      };
      const updated = await api<Settings>('/v1/business/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setSettings(updated);
      setSuccess('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (error && !settings) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!settings) return <p>Loading…</p>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Business settings</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Link
            href="/settings/tax-classes"
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color: '#444',
              border: '1px solid #ccc',
              borderRadius: 4,
              textDecoration: 'none',
              fontSize: 13,
            }}
          >
            Tax classes
          </Link>
          <Link
            href="/settings/discounts"
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color: '#444',
              border: '1px solid #ccc',
              borderRadius: 4,
              textDecoration: 'none',
              fontSize: 13,
            }}
          >
            Discounts
          </Link>
          <Link
            href="/settings/webhooks"
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color: '#444',
              border: '1px solid #ccc',
              borderRadius: 4,
              textDecoration: 'none',
              fontSize: 13,
            }}
          >
            Webhooks
          </Link>
          <Link
            href="/settings/api-keys"
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color: '#444',
              border: '1px solid #ccc',
              borderRadius: 4,
              textDecoration: 'none',
              fontSize: 13,
            }}
          >
            API keys
          </Link>
          <Link
            href="/settings/billing"
            style={{
              padding: '8px 14px',
              background: '#111',
              color: '#fff',
              borderRadius: 4,
              textDecoration: 'none',
              fontSize: 13,
            }}
          >
            Billing
          </Link>
        </div>
      </div>
      <form onSubmit={submit} style={card}>
        <Field label="Business name">
          <input name="name" defaultValue={settings.name} required style={fieldStyle} />
        </Field>
        <Field label="Currency">
          <select name="currencyCode" defaultValue={settings.currencyCode} style={fieldStyle}>
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} — {CURRENCY_LABELS[code]}
              </option>
            ))}
          </select>
          <span style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
            Switching currency changes how amounts are displayed across the app. Existing balances
            keep their stored minor-unit value; you may want to coordinate the change with your
            bookkeeper.
          </span>
        </Field>
        <Field label="Default tax rate (basis points; 250 = 2.5%)">
          <input
            name="defaultTaxRateBps"
            type="number"
            min={0}
            defaultValue={settings.defaultTaxRateBps}
            style={fieldStyle}
          />
        </Field>
        <Field label="Receipt header">
          <textarea
            name="receiptHeader"
            defaultValue={settings.receiptHeader ?? ''}
            rows={3}
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
        </Field>
        <Field label="Receipt footer">
          <textarea
            name="receiptFooter"
            defaultValue={settings.receiptFooter ?? ''}
            rows={3}
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
        </Field>
        {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}
        {success && (
          <p data-testid="settings-success" style={{ color: '#080', fontSize: 13 }}>
            {success}
          </p>
        )}
        <button type="submit" disabled={saving} style={primaryBtn}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  display: 'grid',
  gap: 12,
  maxWidth: 640,
};
const fieldStyle = {
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
