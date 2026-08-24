'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Cable, CheckCircle2, FileSpreadsheet, Plug, RefreshCw, Unplug } from 'lucide-react';
import { Button, Card, Field, Input, PageHeader, Select, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';

/**
 * One-click integrations: connect Shopify / WooCommerce / Wix once,
 * then sync customers, products, and order history on demand. Synced
 * records flow through the same idempotent import pipeline as the
 * STORIS migration, so re-syncing updates in place. STORIS itself is
 * the CSV wizard (card at the bottom).
 */

interface SyncResult {
  syncedAt?: string;
  results?: { entity: string; pulled: number; committed: number; skipped: number }[];
  detail?: string;
  error?: string;
}

interface Provider {
  provider: string;
  label: string;
  credentialFields: { name: string; label: string; secret?: boolean }[];
  connected: boolean;
  status: string | null;
  lastSyncAt: string | null;
  lastResult: SyncResult | null;
  config: { locationName?: string } | null;
}

interface LocationRow {
  id: string;
  name: string;
}

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [locationName, setLocationName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const [list, locs] = await Promise.all([
        api<Provider[]>('/v1/integrations'),
        api<LocationRow[]>('/v1/pos/locations').catch(() => []),
      ]);
      setProviders(list);
      setLocations(locs);
      if (locs[0] && !locationName) setLocationName(locs[0].name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect(p: Provider) {
    setBusy(p.provider);
    try {
      const res = await api<{ detail: string }>(`/v1/integrations/${p.provider}/connect`, {
        method: 'POST',
        body: JSON.stringify({ credentials: creds, locationName }),
      });
      toast.success(res.detail);
      setOpenForm(null);
      setCreds({});
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function sync(p: Provider) {
    setBusy(p.provider);
    try {
      const res = await api<SyncResult>(`/v1/integrations/${p.provider}/sync`, {
        method: 'POST',
        body: '{}',
      });
      const parts = (res.results ?? []).map(
        (r) => `${r.committed} ${r.entity}${r.committed === 1 ? '' : 's'}`,
      );
      toast.success(`Synced ${parts.join(', ')}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(p: Provider) {
    if (!window.confirm(`Disconnect ${p.label}? Stored credentials are wiped.`)) return;
    setBusy(p.provider);
    try {
      await api(`/v1/integrations/${p.provider}`, { method: 'DELETE' });
      toast.success(`${p.label} disconnected`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Integrations"
        sub="Connect the platforms you already use — synced data flows through the same idempotent import pipeline as the STORIS migration, so syncing twice never duplicates anything."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {(providers ?? []).map((p) => (
          <Card key={p.provider} data-testid={`integration-${p.provider}`}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Cable size={18} className="text-secondary" aria-hidden />
              <strong className="text-[15px]">{p.label}</strong>
              {p.connected && <StatusBadge status="connected" />}
              {p.status === 'error' && <StatusBadge status="failed" />}
            </div>

            {p.connected ? (
              <>
                <p className="muted mb-3 text-[12.5px]">
                  {p.lastSyncAt
                    ? `Last synced ${new Date(p.lastSyncAt).toLocaleString()}`
                    : 'Connected — not synced yet.'}
                  {p.config?.locationName ? ` · history lands at ${p.config.locationName}` : ''}
                </p>
                {p.lastResult?.results && (
                  <ul className="mb-3 grid gap-1 text-[12.5px] text-secondary">
                    {p.lastResult.results.map((r) => (
                      <li key={r.entity} className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-success" aria-hidden />
                        {r.committed} {r.entity}
                        {r.committed === 1 ? '' : 's'} synced
                        {r.skipped > 0 ? ` (${r.skipped} skipped)` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busy === p.provider}
                    onClick={() => void sync(p)}
                    data-testid={`sync-${p.provider}`}
                  >
                    <RefreshCw size={13} aria-hidden />
                    {busy === p.provider ? 'Syncing…' : 'Sync now'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busy === p.provider}
                    onClick={() => void disconnect(p)}
                  >
                    <Unplug size={13} aria-hidden />
                    Disconnect
                  </Button>
                </div>
              </>
            ) : openForm === p.provider ? (
              <div className="grid gap-2">
                {p.credentialFields.map((f) => (
                  <Field key={f.name} label={f.label}>
                    <Input
                      type={f.secret ? 'password' : 'text'}
                      className="w-full"
                      value={creds[f.name] ?? ''}
                      onChange={(e) => setCreds({ ...creds, [f.name]: e.target.value })}
                      data-testid={`cred-${p.provider}-${f.name}`}
                    />
                  </Field>
                ))}
                <Field label="Land order history at location">
                  <Select
                    className="w-full"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.name}>
                        {l.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busy === p.provider}
                    onClick={() => void connect(p)}
                    data-testid={`connect-${p.provider}`}
                  >
                    <Plug size={13} aria-hidden />
                    {busy === p.provider ? 'Connecting…' : 'Connect'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setOpenForm(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="muted mb-3 text-[12.5px]">
                  Pulls customers, products, and completed order history.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setOpenForm(p.provider);
                    setCreds({});
                  }}
                  data-testid={`open-connect-${p.provider}`}
                >
                  <Plug size={13} aria-hidden />
                  Connect
                </Button>
              </>
            )}
          </Card>
        ))}

        <Card>
          <div className="mb-2 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-secondary" aria-hidden />
            <strong className="text-[15px]">STORIS (and any CSV export)</strong>
          </div>
          <p className="muted mb-3 text-[12.5px]">
            STORIS has no public API — its report-writer exports import through the guided CSV
            wizard: upload → auto-map → validate → commit, with reconciliation gates that must match
            to the cent.
          </p>
          <Link href="/settings/import" className="btn btn-secondary btn-sm no-underline">
            Open the import wizard
          </Link>
        </Card>
      </div>
    </div>
  );
}
