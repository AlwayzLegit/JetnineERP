'use client';

import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';

interface EntityInfo {
  entity: string;
  label: string;
  fields: { name: string; type: string; required: boolean }[];
}

interface Batch {
  id: string;
  status: string;
  filename: string | null;
  rowCount: number;
  mappingJson: { columns?: Record<string, string>; headers?: string[] } | null;
  validationJson: {
    valid: number;
    invalid: number;
    errors: {
      row: number;
      legacyId: string | null;
      errors: { field: string; message: string }[];
    }[];
  } | null;
  unmappedRequired?: string[];
}

/**
 * Reusable file-upload CSV importer over the D7 import pipeline:
 * pick a file → stage (auto-mapped) → adjust the column mapping →
 * validate with a per-row error preview → commit. Everything is
 * re-runnable — a corrected re-upload updates the same records.
 *
 * Drop it on any page that imports an entity; the full multi-entity
 * wizard at Settings → Import shares the same endpoints.
 */
export function CsvImport({
  entity,
  onCommitted,
}: {
  entity: string;
  onCommitted?: () => void | Promise<void>;
}) {
  const [spec, setSpec] = useState<EntityInfo | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<EntityInfo[]>('/v1/import/entities')
      .then((all) => setSpec(all.find((e) => e.entity === entity) ?? null))
      .catch(() => setSpec(null));
  }, [entity]);

  async function refresh(id: string) {
    setBatch(await api<Batch>(`/v1/import/batches/${id}?rows=none`));
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const csv = await file.text();
      const staged = await api<Batch>('/v1/import/batches', {
        method: 'POST',
        body: JSON.stringify({ entity, filename: file.name, csv }),
      });
      setBatch(staged);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remap(columns: Record<string, string>) {
    if (!batch) return;
    setBusy(true);
    try {
      await api(`/v1/import/batches/${batch.id}/mapping`, {
        method: 'POST',
        body: JSON.stringify({ columns }),
      });
      await refresh(batch.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function run(step: 'validate' | 'commit') {
    if (!batch) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/import/batches/${batch.id}/${step}`, { method: 'POST', body: '{}' });
      await refresh(batch.id);
      if (step === 'commit') {
        toast.success('Import committed');
        await onCommitted?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const mapping = batch?.mappingJson?.columns ?? {};
  const headers = batch?.mappingJson?.headers ?? [];
  const unmappedRequired =
    spec?.fields.filter((f) => f.required && !mapping[f.name]).map((f) => f.name) ?? [];

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
          <Upload size={13} aria-hidden />
          {busy ? 'Working…' : batch ? 'Upload a different file' : 'Upload CSV file'}
          <input
            type="file"
            accept=".csv,.tsv,.txt,text/csv"
            style={{ display: 'none' }}
            disabled={busy}
            data-testid={`csv-import-${entity}`}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
        </label>
        {batch && (
          <>
            <span style={{ fontSize: 13 }}>
              {batch.filename} · {batch.rowCount} rows
            </span>
            <StatusBadge status={batch.status} />
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => void run('validate')}
                disabled={busy || batch.status === 'committed' || unmappedRequired.length > 0}
                data-testid={`csv-validate-${entity}`}
              >
                Validate
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void run('commit')}
                disabled={busy || batch.status !== 'validated'}
                data-testid={`csv-commit-${entity}`}
              >
                Commit
              </Button>
            </div>
          </>
        )}
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}

      {batch && spec && (
        <>
          {unmappedRequired.length > 0 && (
            <p style={{ color: 'var(--warning)', fontSize: 12.5, margin: '8px 0 0' }}>
              Map the required column{unmappedRequired.length === 1 ? '' : 's'}{' '}
              <strong>{unmappedRequired.join(', ')}</strong> below before validating.
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '10px 0 6px' }}>
            Column mapping — file header for each field
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {spec.fields.map((f) => (
              <label key={f.name} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {f.name}
                {f.required ? ' *' : ''}
                <select
                  className="select"
                  value={mapping[f.name] ?? ''}
                  disabled={busy || batch.status === 'committed'}
                  onChange={(e) => {
                    const next = { ...mapping };
                    if (e.target.value === '') delete next[f.name];
                    else next[f.name] = e.target.value;
                    void remap(next);
                  }}
                  style={{ display: 'block', width: '100%', marginTop: 2 }}
                >
                  <option value="">— not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {batch.validationJson && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13, margin: '0 0 6px' }} data-testid={`csv-counts-${entity}`}>
                <strong>{batch.validationJson.valid}</strong> valid ·{' '}
                <strong
                  style={{ color: batch.validationJson.invalid > 0 ? 'var(--danger)' : undefined }}
                >
                  {batch.validationJson.invalid}
                </strong>{' '}
                invalid
              </p>
              {batch.validationJson.errors.length > 0 && (
                <div
                  style={{
                    maxHeight: 200,
                    overflow: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <table className="table" style={{ fontSize: 12 }}>
                    <tbody>
                      {batch.validationJson.errors.map((e) => (
                        <tr key={e.row}>
                          <td style={{ whiteSpace: 'nowrap' }}>row {e.row}</td>
                          <td>{e.legacyId}</td>
                          <td>{e.errors.map((er) => `${er.field}: ${er.message}`).join('; ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
