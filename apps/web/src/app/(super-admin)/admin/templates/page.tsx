'use client';

import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Field,
  FormActions,
  FormGrid,
  Input,
  PageHeader,
  Select,
  Stack,
  TableEmpty,
  TableWrap,
} from '@/components/ui';
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
      <Stack>
        {error && <Alert tone="error">{error}</Alert>}
        {message && <Alert tone="success">{message}</Alert>}

        <Card
          title="Save a business as a template"
          description="Captures custom roles, categories, tax classes, and settings (catalog optional). Pass the template when creating a business, or apply it to an existing one below — applying is additive and skips anything that already exists."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void snapshot();
            }}
          >
            <FormGrid cols={3}>
              <Field label="Source business" required>
                <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                  {businesses.length === 0 && <option value="">No businesses yet</option>}
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.slug})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Template name" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Template name"
                  data-testid="template-name"
                />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2">
                <input
                  type="checkbox"
                  checked={includeProducts}
                  onChange={(e) => setIncludeProducts(e.target.checked)}
                />
                include catalog
              </label>
            </FormGrid>
            <FormActions>
              <Button
                type="submit"
                variant="primary"
                disabled={busy || !name.trim() || !sourceId}
                data-testid="snapshot-template"
              >
                <Camera size={14} aria-hidden />
                Snapshot
              </Button>
            </FormActions>
          </form>
        </Card>

        <Card flush title="Templates">
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Scope</th>
                  <th>Created</th>
                  <th>Apply to</th>
                  <th className="actions" />
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong>
                      {t.description && <span className="muted"> — {t.description}</span>}
                    </td>
                    <td>
                      {Object.entries(t.scopeJson)
                        .filter(([, v]) => v)
                        .map(([k]) => k)
                        .join(', ')}
                    </td>
                    <td className="nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Select
                        aria-label={`Apply "${t.name}" to`}
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
                    <td className="actions">
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
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <TableEmpty colSpan={5}>
                    No templates yet — snapshot a configured business above.
                  </TableEmpty>
                )}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      </Stack>
    </div>
  );
}
