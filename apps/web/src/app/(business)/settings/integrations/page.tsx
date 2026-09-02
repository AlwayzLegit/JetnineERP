'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Cable, CheckCircle2, FileSpreadsheet, Plug, RefreshCw, Unplug } from 'lucide-react';
import {
  BackLink,
  Button,
  Card,
  Field,
  FormActions,
  FormGrid,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
  Select,
  Stack,
  StatusBadge,
} from '@/components/ui';
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
  /** 'idle' | 'running' | 'error' — background sync job state. */
  syncStatus: string;
  syncProgress: { note?: string; at?: string } | null;
}

interface LocationRow {
  id: string;
  name: string;
}

/**
 * Online orders ship from the warehouse, not a showroom — so when the
 * merchant has a location named like one, default the connector there.
 * Falls back to an online/web-store location, then the first location.
 */
function defaultLandingLocation(locs: LocationRow[]): LocationRow {
  return (
    locs.find((l) => /warehouse|distribution|fulfill/i.test(l.name)) ??
    locs.find((l) => /online|web|e-?comm/i.test(l.name)) ??
    locs[0]!
  );
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
      if (locs[0] && !locationName) setLocationName(defaultLandingLocation(locs).name);
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

  /**
   * Sync runs as a background job server-side (a real store pull takes
   * minutes). Kick it off, then poll the list until the job leaves
   * 'running' and report the outcome.
   */
  async function sync(p: Provider) {
    setBusy(p.provider);
    try {
      await api<{ started: boolean }>(`/v1/integrations/${p.provider}/sync`, {
        method: 'POST',
        body: '{}',
      });
      toast.success('Sync started — progress shows below.');
      for (let i = 0; i < 600; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const list = await api<Provider[]>('/v1/integrations');
        setProviders(list);
        const mine = list.find((x) => x.provider === p.provider);
        if (!mine || mine.syncStatus !== 'running') {
          if (mine?.syncStatus === 'error') {
            toast.error(
              `Sync failed: ${(mine.lastResult as { error?: string } | null)?.error ?? 'unknown error'}`,
            );
          } else {
            const parts = ((mine?.lastResult?.results ?? []) as SyncResult['results'])!.map(
              (r) => `${r.committed} ${r.entity}${r.committed === 1 ? '' : 's'}`,
            );
            toast.success(parts.length ? `Synced ${parts.join(', ')}` : 'Sync finished');
          }
          return;
        }
      }
      toast.error('Sync is still running after 20 minutes — check back later.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
      void load();
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
        eyebrow={<BackLink href="/settings">Settings</BackLink>}
        title="Integrations"
        sub="Connect the platforms you already use — synced data flows through the same idempotent import pipeline as the STORIS migration, so syncing twice never duplicates anything."
      />

      {providers == null ? (
        <LoadingRows />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {providers.map((p) => (
            <Card
              key={p.provider}
              data-testid={`integration-${p.provider}`}
              title={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Cable size={16} className="text-secondary" aria-hidden />
                  {p.label}
                  {p.connected && <StatusBadge status="connected" />}
                  {p.status === 'error' && <StatusBadge status="failed" />}
                </span>
              }
              description={
                p.connected
                  ? `${
                      p.lastSyncAt
                        ? `Last synced ${new Date(p.lastSyncAt).toLocaleString()}`
                        : 'Connected — not synced yet.'
                    }${p.config?.locationName ? ` · history lands at ${p.config.locationName}` : ''}`
                  : openForm === p.provider
                    ? undefined
                    : 'Pulls customers, products, and completed order history.'
              }
              actions={
                p.connected ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy === p.provider || p.syncStatus === 'running'}
                      onClick={() => void sync(p)}
                      data-testid={`sync-${p.provider}`}
                    >
                      <RefreshCw size={13} aria-hidden />
                      {busy === p.provider || p.syncStatus === 'running' ? 'Syncing…' : 'Sync now'}
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
                  </>
                ) : undefined
              }
            >
              {p.connected ? (
                <Stack gap="sm">
                  {p.lastResult?.results && (
                    <ul className="m-0 grid list-none gap-1 p-0">
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
                  {p.syncStatus === 'running' && (
                    <p
                      className="m-0 flex items-center gap-1.5 text-[var(--brand)]"
                      data-testid={`sync-progress-${p.provider}`}
                    >
                      <RefreshCw size={12} className="animate-spin" aria-hidden />
                      {p.syncProgress?.note ?? 'Sync running…'}
                    </p>
                  )}
                </Stack>
              ) : openForm === p.provider ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void connect(p);
                  }}
                >
                  <FormGrid cols={1}>
                    {p.credentialFields.map((f) => (
                      <Field key={f.name} label={f.label}>
                        <Input
                          type={f.secret ? 'password' : 'text'}
                          value={creds[f.name] ?? ''}
                          onChange={(e) => setCreds({ ...creds, [f.name]: e.target.value })}
                          data-testid={`cred-${p.provider}-${f.name}`}
                        />
                      </Field>
                    ))}
                    <Field
                      label="Land order history at location"
                      hint="Where imported online orders live for inventory, tax, and reporting — pick your warehouse (or a dedicated “Online” location) so web sales stay out of showroom numbers."
                    >
                      <Select
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
                  </FormGrid>
                  <FormActions>
                    <Button variant="ghost" onClick={() => setOpenForm(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={busy === p.provider}
                      data-testid={`connect-${p.provider}`}
                    >
                      <Plug size={13} aria-hidden />
                      {busy === p.provider ? 'Connecting…' : 'Connect'}
                    </Button>
                  </FormActions>
                </form>
              ) : (
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
              )}
            </Card>
          ))}

          <Card
            title={
              <span className="inline-flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-secondary" aria-hidden />
                STORIS (and any CSV export)
              </span>
            }
            description="STORIS has no public API — its report-writer exports import through the guided CSV wizard: upload → auto-map → validate → commit, with reconciliation gates that must match to the cent."
          >
            <LinkButton href="/settings/import" variant="secondary" size="sm">
              Open the import wizard
            </LinkButton>
          </Card>
        </div>
      )}
    </div>
  );
}
