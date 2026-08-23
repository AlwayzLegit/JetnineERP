'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
} from '@/components/ui';
import { api } from '@/lib/api';

interface KeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  livemode: 'live' | 'test';
  scopes: string[];
  notes: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [rows, setRows] = useState<KeyRow[] | null>(null);
  const [allScopes, setAllScopes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ id: string; key: string } | null>(null);
  const [filter, setFilter] = useState('');

  async function load() {
    setError(null);
    try {
      const [list, scopes] = await Promise.all([
        api<KeyRow[]>('/v1/business/api-keys'),
        api<{ all: string[] }>('/v1/business/api-keys/scopes'),
      ]);
      setRows(list);
      setAllScopes(scopes.all);
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
      const scopes = data.getAll('scopes').map(String);
      if (scopes.length === 0) throw new Error('Pick at least one scope.');
      const created = await api<KeyRow & { key: string }>('/v1/business/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          notes: String(data.get('notes') ?? '') || null,
          scopes,
          livemode: data.get('livemode') === 'live' ? 'live' : 'test',
        }),
      });
      setNewKey({ id: created.id, key: created.key });
      e.currentTarget.reset();
      setCreating(false);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function revoke(row: KeyRow) {
    if (
      !confirm(
        `Revoke "${row.name}"? Anything still using this key will start getting 401s immediately.`,
      )
    )
      return;
    try {
      await api(`/v1/business/api-keys/${row.id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const visibleScopes = useMemo(() => {
    if (!filter) return allScopes;
    return allScopes.filter((s) => s.includes(filter.toLowerCase()));
  }, [allScopes, filter]);

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/settings">← Settings</Link>
      </p>
      <PageHeader
        title="API keys"
        sub={
          <>
            Send the key as <code>Authorization: Bearer &lt;key&gt;</code>. The key implies the
            business — no <code>X-Business-Id</code> header required. Scopes are checked against the
            platform permission catalog: a key with <code>sales.view</code> can read the sales API
            but not write.{' '}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? ''}/v1/docs`}
              target="_blank"
              rel="noreferrer"
            >
              API reference →
            </a>
          </>
        }
        actions={
          <Button
            variant={creating ? 'secondary' : 'primary'}
            onClick={() => setCreating((v) => !v)}
          >
            {creating ? 'Cancel' : '+ New API key'}
          </Button>
        }
      />

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {newKey && (
        <div
          style={{
            background: 'var(--warning-soft)',
            border: '1px solid var(--warning)',
            color: 'var(--warning-soft-text)',
            padding: 12,
            borderRadius: 'var(--radius)',
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <strong>Save this key — it won&apos;t be shown again:</strong>
          <pre
            style={{
              margin: '6px 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {newKey.key}
          </pre>
          <Button size="sm" variant="secondary" onClick={() => setNewKey(null)}>
            Got it
          </Button>
        </div>
      )}

      {creating && (
        <Card style={{ maxWidth: 720, marginBottom: 16 }}>
          <form onSubmit={create} style={{ display: 'grid', gap: 8 }}>
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
              <Field label="Name *">
                <Input
                  name="name"
                  required
                  placeholder="Read-only integration"
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Mode">
                <Select name="livemode" defaultValue="test" style={{ width: '100%' }}>
                  <option value="test">Test (recommended)</option>
                  <option value="live">Live</option>
                </Select>
              </Field>
            </div>
            <Field label="Notes (optional)">
              <Input name="notes" style={{ width: '100%' }} />
            </Field>
            <Field label="Scopes *">
              <Input
                type="search"
                placeholder="Filter… e.g. sales, inventory"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ width: '100%' }}
              />
            </Field>
            <div
              className="grid gap-1 sm:grid-cols-2"
              style={{
                maxHeight: 240,
                overflow: 'auto',
                border: '1px solid var(--border)',
                padding: 8,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {visibleScopes.map((s) => (
                <label
                  key={s}
                  style={{ display: 'flex', gap: 6, fontSize: 13, alignItems: 'center' }}
                >
                  <input
                    type="checkbox"
                    name="scopes"
                    value={s}
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <code>{s}</code>
                </label>
              ))}
            </div>
            <Button type="submit" variant="primary" style={{ width: 'fit-content' }}>
              Create key
            </Button>
          </form>
        </Card>
      )}

      <Card>
        {rows == null ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState>No API keys yet.</EmptyState>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>Scopes</th>
                  <th>Last used</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ verticalAlign: 'top' }}>
                    <td>
                      <strong>{r.name}</strong>
                      {r.revokedAt && (
                        <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                          revoked
                        </span>
                      )}
                      {r.notes && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {r.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <code style={{ fontSize: 11 }}>{r.keyPrefix}…</code>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.livemode}</div>
                    </td>
                    <td>
                      {r.scopes.map((s) => (
                        <code
                          key={s}
                          style={{
                            fontSize: 11,
                            background: 'var(--neutral-soft)',
                            padding: '1px 4px',
                            borderRadius: 3,
                            marginRight: 3,
                          }}
                        >
                          {s}
                        </code>
                      ))}
                    </td>
                    <td>
                      {r.lastUsedAt ? (
                        new Date(r.lastUsedAt).toLocaleString()
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>never</span>
                      )}
                    </td>
                    <td>
                      {!r.revokedAt && (
                        <Button size="sm" variant="danger" onClick={() => revoke(r)}>
                          Revoke
                        </Button>
                      )}
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
