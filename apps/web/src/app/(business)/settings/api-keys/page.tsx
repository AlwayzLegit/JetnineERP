'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  const visibleScopes = useMemo(() => {
    if (!filter) return allScopes;
    return allScopes.filter((s) => s.includes(filter.toLowerCase()));
  }, [allScopes, filter]);

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/settings">← Settings</Link>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>API keys</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          style={{ marginLeft: 'auto', ...primaryBtn }}
        >
          {creating ? 'Cancel' : '+ New API key'}
        </button>
      </div>

      <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
        Send the key as <code>Authorization: Bearer &lt;key&gt;</code>. The key implies the business
        — no <code>X-Business-Id</code> header required. Scopes are checked against the platform
        permission catalog: a key with <code>sales.view</code> can read the sales API but not write.
      </p>

      {error && <p style={{ color: '#b00' }}>{error}</p>}

      {newKey && (
        <div
          style={{
            background: '#fff8e1',
            border: '1px solid #f0a000',
            color: '#5a3500',
            padding: 12,
            borderRadius: 6,
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
            }}
          >
            {newKey.key}
          </pre>
          <button onClick={() => setNewKey(null)} style={{ ...linkBtn, fontSize: 12 }}>
            Got it
          </button>
        </div>
      )}

      {creating && (
        <form onSubmit={create} style={{ ...card, display: 'grid', gap: 8, maxWidth: 720 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <Field label="Name *">
              <input name="name" required placeholder="Read-only integration" style={inputStyle} />
            </Field>
            <Field label="Mode">
              <select name="livemode" defaultValue="test" style={inputStyle}>
                <option value="test">Test (recommended)</option>
                <option value="live">Live</option>
              </select>
            </Field>
          </div>
          <Field label="Notes (optional)">
            <input name="notes" style={inputStyle} />
          </Field>
          <Field label="Scopes *">
            <input
              type="search"
              placeholder="Filter… e.g. sales, inventory"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 4,
              maxHeight: 240,
              overflow: 'auto',
              border: '1px solid #eee',
              padding: 8,
              borderRadius: 4,
            }}
          >
            {visibleScopes.map((s) => (
              <label key={s} style={{ display: 'flex', gap: 6, fontSize: 13 }}>
                <input type="checkbox" name="scopes" value={s} />
                <code>{s}</code>
              </label>
            ))}
          </div>
          <button type="submit" style={primaryBtn}>
            Create key
          </button>
        </form>
      )}

      <div style={card}>
        {rows == null ? (
          <p style={{ color: '#888' }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: '#888' }}>No API keys yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <Th>Name</Th>
                <Th>Prefix</Th>
                <Th>Scopes</Th>
                <Th>Last used</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <Td>
                    <strong>{r.name}</strong>
                    {r.revokedAt && (
                      <span style={{ color: '#b00', marginLeft: 6, fontSize: 12 }}>revoked</span>
                    )}
                    {r.notes && <div style={{ color: '#666', fontSize: 12 }}>{r.notes}</div>}
                  </Td>
                  <Td>
                    <code style={{ fontSize: 11 }}>{r.keyPrefix}…</code>
                    <div style={{ color: '#888', fontSize: 11 }}>{r.livemode}</div>
                  </Td>
                  <Td>
                    {r.scopes.map((s) => (
                      <code
                        key={s}
                        style={{
                          fontSize: 11,
                          background: '#f4f4f4',
                          padding: '1px 4px',
                          borderRadius: 3,
                          marginRight: 3,
                        }}
                      >
                        {s}
                      </code>
                    ))}
                  </Td>
                  <Td>
                    {r.lastUsedAt ? (
                      new Date(r.lastUsedAt).toLocaleString()
                    ) : (
                      <span style={{ color: '#888' }}>never</span>
                    )}
                  </Td>
                  <Td>
                    {!r.revokedAt && (
                      <button onClick={() => revoke(r)} style={linkBtnDanger}>
                        Revoke
                      </button>
                    )}
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
