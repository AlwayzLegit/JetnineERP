'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Business templates (platform layer): snapshot a business's config
 * (roles, categories, tax classes, settings, optionally the catalog)
 * and stamp it onto another business — or pass the template id to the
 * create-business form to start a new tenant from it.
 */

interface Template {
  id: string;
  name: string;
  description: string | null;
  sourceBusinessId: string | null;
  scopeJson: Record<string, boolean>;
  createdAt: string;
}
interface BusinessRow {
  id: string;
  name: string;
  slug: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [name, setName] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [includeProducts, setIncludeProducts] = useState(false);
  const [applyTarget, setApplyTarget] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [tpls, bizs] = await Promise.all([
        api<Template[]>('/v1/admin/templates'),
        api<BusinessRow[]>('/v1/admin/businesses'),
      ]);
      setTemplates(tpls);
      setBusinesses(bizs);
      if (bizs[0] && !sourceId) setSourceId(bizs[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function snapshot() {
    if (!name.trim() || !sourceId) return;
    setBusy(true);
    setError(null);
    try {
      await api('/v1/admin/templates/snapshot', {
        method: 'POST',
        body: JSON.stringify({
          businessId: sourceId,
          name,
          scope: { products: includeProducts },
        }),
      });
      setName('');
      setMessage('Template saved.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function apply(tpl: Template) {
    const businessId = applyTarget[tpl.id];
    if (!businessId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<Record<string, number | boolean>>(
        `/v1/admin/templates/${tpl.id}/apply`,
        { method: 'POST', body: JSON.stringify({ businessId }) },
      );
      setMessage(
        `Applied "${tpl.name}": ${Object.entries(res)
          .map(([k, v]) => `${k}=${String(v)}`)
          .join(', ')}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(tpl: Template) {
    if (!window.confirm(`Delete template "${tpl.name}"?`)) return;
    try {
      await api(`/v1/admin/templates/${tpl.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Business templates</h1>
      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}
      {message && <p style={{ color: '#2c7a4b', fontSize: 13 }}>{message}</p>}

      <div style={card}>
        <strong style={{ fontSize: 14 }}>Save a business as a template</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} style={input}>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.slug})
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            style={input}
            data-testid="template-name"
          />
          <label style={{ fontSize: 13, color: '#444' }}>
            <input
              type="checkbox"
              checked={includeProducts}
              onChange={(e) => setIncludeProducts(e.target.checked)}
            />{' '}
            include catalog
          </label>
          <button
            onClick={() => void snapshot()}
            disabled={busy || !name.trim() || !sourceId}
            style={darkBtn}
            data-testid="snapshot-template"
          >
            Snapshot
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#888', margin: '8px 0 0' }}>
          Captures custom roles, categories, tax classes, and settings (catalog optional). Pass the
          template when creating a business, or apply it to an existing one below — applying is
          additive and skips anything that already exists.
        </p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
            <th style={th}>Name</th>
            <th style={th}>Scope</th>
            <th style={th}>Created</th>
            <th style={th}>Apply to</th>
            <th style={th} />
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>
                <strong>{t.name}</strong>
                {t.description && <span style={{ color: '#888' }}> — {t.description}</span>}
              </td>
              <td style={td}>
                {Object.entries(t.scopeJson)
                  .filter(([, v]) => v)
                  .map(([k]) => k)
                  .join(', ')}
              </td>
              <td style={td}>{new Date(t.createdAt).toLocaleDateString()}</td>
              <td style={td}>
                <select
                  value={applyTarget[t.id] ?? ''}
                  onChange={(e) => setApplyTarget({ ...applyTarget, [t.id]: e.target.value })}
                  style={input}
                >
                  <option value="">— pick business —</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                <button
                  onClick={() => void apply(t)}
                  disabled={busy || !applyTarget[t.id]}
                  style={{ ...darkBtn, marginRight: 8 }}
                >
                  Apply
                </button>
                <button onClick={() => void remove(t)} style={ghostBtn}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {templates.length === 0 && (
            <tr>
              <td style={{ ...td, color: '#888' }} colSpan={5}>
                No templates yet — snapshot a configured business above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const card: React.CSSProperties = {
  border: '1px solid #e2e2e2',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  background: '#fff',
};
const th: React.CSSProperties = { padding: '6px 8px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '6px 8px' };
const input: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
};
const darkBtn: React.CSSProperties = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
};
const ghostBtn: React.CSSProperties = {
  padding: '6px 12px',
  background: 'transparent',
  color: '#b00',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
};
