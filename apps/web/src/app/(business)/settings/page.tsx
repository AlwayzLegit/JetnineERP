'use client';

import { Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES } from '@jetnine/shared';
import { Button, Field, Input, LinkButton, LoadingRows, PageHeader, Select } from '@/components/ui';
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

  if (error && !settings) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!settings) return <LoadingRows />;

  return (
    <div>
      <PageHeader
        title="Business settings"
        actions={
          <span className="flex flex-wrap items-center justify-end gap-2">
            <LinkButton href="/settings/tax-classes" variant="secondary" size="sm">
              Tax classes
            </LinkButton>
            <LinkButton href="/settings/discounts" variant="secondary" size="sm">
              Discounts
            </LinkButton>
            <LinkButton href="/settings/webhooks" variant="secondary" size="sm">
              Webhooks
            </LinkButton>
            <LinkButton href="/settings/api-keys" variant="secondary" size="sm">
              API keys
            </LinkButton>
            <LinkButton href="/settings/import" variant="secondary" size="sm">
              Data import
            </LinkButton>
            <LinkButton href="/settings/integrations" variant="secondary" size="sm">
              Integrations
            </LinkButton>
            <LinkButton href="/settings/billing" variant="primary" size="sm">
              Billing
            </LinkButton>
          </span>
        }
      />
      <form onSubmit={submit} className="card grid max-w-[640px] gap-3 sm:grid-cols-2">
        <Field label="Business name">
          <Input name="name" defaultValue={settings.name} required style={{ width: '100%' }} />
        </Field>
        <Field label="Currency">
          <Select
            name="currencyCode"
            defaultValue={settings.currencyCode}
            style={{ width: '100%' }}
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} — {CURRENCY_LABELS[code]}
              </option>
            ))}
          </Select>
          <span
            style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, display: 'block' }}
          >
            Switching currency changes how amounts are displayed across the app. Existing balances
            keep their stored minor-unit value; you may want to coordinate the change with your
            bookkeeper.
          </span>
        </Field>
        <Field label="Default tax rate (basis points; 250 = 2.5%)" className="sm:col-span-2">
          <Input
            name="defaultTaxRateBps"
            type="number"
            min={0}
            defaultValue={settings.defaultTaxRateBps}
            style={{ width: '100%' }}
          />
        </Field>
        <Field label="Receipt header">
          <textarea
            name="receiptHeader"
            defaultValue={settings.receiptHeader ?? ''}
            rows={3}
            className="textarea"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </Field>
        <Field label="Receipt footer">
          <textarea
            name="receiptFooter"
            defaultValue={settings.receiptFooter ?? ''}
            rows={3}
            className="textarea"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </Field>
        {error && (
          <p className="sm:col-span-2" style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>
            {error}
          </p>
        )}
        {success && (
          <p
            data-testid="settings-success"
            className="sm:col-span-2"
            style={{ color: 'var(--success)', fontSize: 13, margin: 0 }}
          >
            {success}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={saving}
          className="sm:col-span-2"
          style={{ width: 'fit-content' }}
        >
          <Save size={14} aria-hidden />
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </div>
  );
}
