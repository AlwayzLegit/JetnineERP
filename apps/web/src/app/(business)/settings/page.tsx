'use client';

import { Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES } from '@jetnine/shared';
import { Button, Field, Input, LinkButton, LoadingRows, PageHeader, Select } from '@/components/ui';
import { api } from '@/lib/api';

interface Branding {
  accentColor?: string | null;
  logoUrl?: string | null;
  publicName?: string | null;
}

interface OpsSettings {
  recyclingFeeCents?: number | null;
  invoiceHeaderNote?: string | null;
  invoiceFooterNote?: string | null;
  deliveryDailyCap?: number | null;
  poReplyTo?: string | null;
}

interface Settings {
  id: string;
  slug: string;
  name: string;
  status: string;
  currencyCode: string;
  defaultTaxRateBps: number;
  receiptHeader: string | null;
  receiptFooter: string | null;
  branding: Branding | null;
  ops: OpsSettings | null;
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

      <OpsCard settings={settings} onSaved={setSettings} />

      <BrandingCard settings={settings} onSaved={setSettings} />
    </div>
  );
}

/**
 * POS-operations knobs (PLAN-POS-OPERATIONS): the per-unit recycling
 * fee New Sale auto-adds, the admin-editable invoice header/footer
 * notes (§11), the daily delivery stop cap (§7), and the PO reply-to.
 * Saved separately, same as branding.
 */
function OpsCard({ settings, onSaved }: { settings: Settings; onSaved: (s: Settings) => void }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const ops = settings.ops ?? {};

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);
    try {
      const data = new FormData(e.currentTarget);
      const feeStr = String(data.get('recyclingFee') ?? '').trim();
      const capStr = String(data.get('deliveryDailyCap') ?? '').trim();
      const body: OpsSettings = {
        recyclingFeeCents: feeStr === '' ? null : Math.round(Number(feeStr) * 100),
        deliveryDailyCap: capStr === '' ? null : Number(capStr),
        invoiceHeaderNote: String(data.get('invoiceHeaderNote') ?? '').trim() || null,
        invoiceFooterNote: String(data.get('invoiceFooterNote') ?? '').trim() || null,
        poReplyTo: String(data.get('poReplyTo') ?? '').trim() || null,
      };
      const updated = await api<Settings>('/v1/business/settings', {
        method: 'PATCH',
        body: JSON.stringify({ ops: body }),
      });
      onSaved(updated);
      setMessage('Saved.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-4 grid max-w-[640px] gap-3 sm:grid-cols-2">
      <h3 className="card-title sm:col-span-2" style={{ margin: 0 }}>
        Store operations
      </h3>
      <Field label="Recycling fee per unit ($; blank = default 10.50)">
        <Input
          name="recyclingFee"
          type="number"
          step="0.01"
          min={0}
          defaultValue={
            ops.recyclingFeeCents != null ? (ops.recyclingFeeCents / 100).toFixed(2) : ''
          }
          data-testid="ops-recycling-fee"
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="Delivery stops per day (soft cap; blank = 15)">
        <Input
          name="deliveryDailyCap"
          type="number"
          min={1}
          defaultValue={ops.deliveryDailyCap ?? ''}
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="Invoice header note (printed top-center)">
        <Input
          name="invoiceHeaderNote"
          defaultValue={ops.invoiceHeaderNote ?? ''}
          placeholder="WE CALL 6-8PM NIGHT BEFORE DEL"
          data-testid="ops-header-note"
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="PO reply-to email">
        <Input
          name="poReplyTo"
          type="email"
          defaultValue={ops.poReplyTo ?? ''}
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="Invoice footer" className="sm:col-span-2">
        <textarea
          name="invoiceFooterNote"
          defaultValue={ops.invoiceFooterNote ?? ''}
          rows={3}
          className="textarea"
          style={{ width: '100%', resize: 'vertical' }}
        />
      </Field>
      {errorMsg && (
        <p className="sm:col-span-2" style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>
          {errorMsg}
        </p>
      )}
      {message && (
        <p
          data-testid="ops-success"
          className="sm:col-span-2"
          style={{ color: 'var(--success)', fontSize: 13, margin: 0 }}
        >
          {message}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={saving} style={{ width: 'fit-content' }}>
        <Save size={14} aria-hidden />
        {saving ? 'Saving…' : 'Save operations'}
      </Button>
    </form>
  );
}

/**
 * White-label branding. Saved separately from the main form so a
 * branding tweak can't accidentally resubmit tax/currency, and vice
 * versa. Changes apply on the next page load (the shell reads branding
 * once per session).
 */
function BrandingCard({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: (s: Settings) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const b = settings.branding ?? {};

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);
    try {
      const data = new FormData(e.currentTarget);
      const accentEnabled = data.get('accentEnabled') === 'on';
      const branding: Branding = {
        accentColor: accentEnabled ? String(data.get('accentColor') || '#4f46e5') : null,
        logoUrl: String(data.get('logoUrl') ?? '').trim() || null,
        publicName: String(data.get('publicName') ?? '').trim() || null,
      };
      const updated = await api<Settings>('/v1/business/settings', {
        method: 'PATCH',
        body: JSON.stringify({ branding }),
      });
      onSaved(updated);
      setMessage('Saved — reload to see the new look everywhere.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-4 grid max-w-[640px] gap-3 sm:grid-cols-2">
      <h3 className="card-title sm:col-span-2" style={{ margin: 0 }}>
        Branding
      </h3>
      <p className="muted sm:col-span-2" style={{ fontSize: 12.5, margin: 0 }}>
        Make the app yours: the accent color re-themes buttons and navigation, the logo shows in the
        sidebar, and the display name appears on the shell and printed receipts (your legal business
        name above stays on record).
      </p>
      <Field label="Display name (optional)">
        <Input
          name="publicName"
          defaultValue={b.publicName ?? ''}
          placeholder={settings.name}
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="Logo URL (https, optional)">
        <Input
          name="logoUrl"
          type="url"
          defaultValue={b.logoUrl ?? ''}
          placeholder="https://…/logo.png"
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="Accent color">
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <input type="checkbox" name="accentEnabled" defaultChecked={Boolean(b.accentColor)} />
            Use custom color
          </label>
          <Input
            name="accentColor"
            type="color"
            defaultValue={b.accentColor ?? '#4f46e5'}
            style={{ width: 48, height: 32, padding: 2 }}
            data-testid="branding-accent"
          />
        </span>
      </Field>
      {errorMsg && (
        <p className="sm:col-span-2" style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>
          {errorMsg}
        </p>
      )}
      {message && (
        <p
          data-testid="branding-success"
          className="sm:col-span-2"
          style={{ color: 'var(--success)', fontSize: 13, margin: 0 }}
        >
          {message}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={saving} style={{ width: 'fit-content' }}>
        <Save size={14} aria-hidden />
        {saving ? 'Saving…' : 'Save branding'}
      </Button>
    </form>
  );
}
