'use client';

import { useEffect, useState } from 'react';
import { Button, Card, EmptyState, Input, PageHeader, Select } from '@/components/ui';
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
      <PageHeader title="Business templates" />
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      {message && <p style={{ color: 'var(--success)', fontSize: 13 }}>{message}</p>}

      <Card title="Save a business as a template" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.slug})
              </option>
            ))}
          </Select>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            data-testid="template-name"
          />
          <label
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <input
              type="checkbox"
              checked={includeProducts}
              onChange={(e) => setIncludeProducts(e.target.checked)}
              style={{ accentColor: 'var(--brand)' }}
            />{' '}
            include catalog
          </label>
          <Button
            variant="primary"
            onClick={() => void snapshot()}
            disabled={busy || !name.trim() || !sourceId}
            data-testid="snapshot-template"
          >
            Snapshot
          </Button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
          Captures custom roles, categories, tax classes, and settings (catalog optional). Pass the
          template when creating a business, or apply it to an existing one below — applying is
          additive and skips anything that already exists.
        </p>
      </Card>

      <Card style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Scope</th>
              <th>Created</th>
              <th>Apply to</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.name}</strong>
                  {t.description && (
                    <span style={{ color: 'var(--text-muted)' }}> — {t.description}</span>
                  )}
                </td>
                <td>
                  {Object.entries(t.scopeJson)
                    .filter(([, v]) => v)
                    .map(([k]) => k)
                    .join(', ')}
                </td>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td>
                  <Select
                    value={applyTarget[t.id] ?? ''}
                    onChange={(e) => setApplyTarget({ ...applyTarget, [t.id]: e.target.value })}
                  >
                    <option value="">— pick business —</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', gap: 8 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => void apply(t)}
                      disabled={busy || !applyTarget[t.id]}
                    >
                      Apply
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => void remove(t)}>
                      Delete
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState>No templates yet — snapshot a configured business above.</EmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
