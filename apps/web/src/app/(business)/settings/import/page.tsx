'use client';

import { Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, PageHeader, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';

/**
 * The STORIS import wizard (§7): pick an entity in dependency order,
 * upload its CSV, check the auto-mapping, validate, commit, and watch
 * the recon gates. Everything is re-runnable — a corrected re-upload
 * updates the same records (D7).
 */

interface EntityInfo {
  entity: string;
  label: string;
  fields: { name: string; type: string; required: boolean }[];
}

interface Batch {
  id: string;
  entity: string;
  filename: string | null;
  status: string;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  committedRowCount: number;
  mappingJson: { columns?: Record<string, string>; headers?: string[] } | null;
  validationJson: {
    valid: number;
    invalid: number;
    errors: {
      row: number;
      legacyId: string | null;
      errors: { field: string; message: string }[];
    }[];
    byMessage: Record<string, number>;
  } | null;
  createdAt: string;
  unmappedRequired?: string[];
}

interface Gate {
  source: number;
  db: number;
  match: boolean;
}
interface Recon {
  generatedAt: string;
  gate1_rowCounts: { entity: string; source: number; db: number; match: boolean }[];
  gate2_inventory: { units: Gate; valuationCents: Gate };
  gate3_depositsHeldCents: Gate;
  gate4_openArCents: Gate;
  gate5: string;
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function ImportWizardPage() {
  const [entities, setEntities] = useState<EntityInfo[]>([]);
  const [entity, setEntity] = useState('customer');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [active, setActive] = useState<Batch | null>(null);
  const [recon, setRecon] = useState<Recon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const spec = useMemo(() => entities.find((e) => e.entity === entity), [entities, entity]);

  async function load() {
    try {
      const [ents, list] = await Promise.all([
        api<EntityInfo[]>('/v1/import/entities'),
        api<Batch[]>(`/v1/import/batches?entity=${entity}`),
      ]);
      setEntities(ents);
      setBatches(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    setActive(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  async function refreshActive(id: string) {
    const batch = await api<Batch>(`/v1/import/batches/${id}?rows=none`);
    setActive(batch);
    await load();
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const csv = await file.text();
      const batch = await api<Batch>('/v1/import/batches', {
        method: 'POST',
        body: JSON.stringify({ entity, filename: file.name, csv }),
      });
      setActive(batch);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveMapping(columns: Record<string, string>) {
    if (!active) return;
    setBusy(true);
    try {
      await api(`/v1/import/batches/${active.id}/mapping`, {
        method: 'POST',
        body: JSON.stringify({ columns }),
      });
      await refreshActive(active.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function run(step: 'validate' | 'commit') {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/import/batches/${active.id}/${step}`, { method: 'POST', body: '{}' });
      await refreshActive(active.id);
      if (step === 'commit') await loadRecon();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function loadRecon() {
    try {
      setRecon(await api<Recon>('/v1/import/recon'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const mapping = active?.mappingJson?.columns ?? {};
  const headers = active?.mappingJson?.headers ?? [];

  return (
    <div>
      <PageHeader
        title="STORIS data import"
        sub="Import in this order — later files reference earlier ones. Re-uploading a corrected file updates the same records instead of duplicating them."
        actions={
          <Button variant="secondary" onClick={() => void loadRecon()} data-testid="recon-refresh">
            Recon report
          </Button>
        }
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {entities.map((e, i) => (
          <Button
            key={e.entity}
            variant={entity === e.entity ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setEntity(e.entity)}
            data-testid={`entity-${e.entity}`}
          >
            {i + 1}. {e.label}
          </Button>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <strong style={{ fontSize: 14 }}>{spec?.label ?? entity}</strong>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={13} aria-hidden />
            {busy ? 'Working…' : 'Upload CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              disabled={busy}
              data-testid="csv-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {batches.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Status</th>
                  <th className="num">Rows</th>
                  <th className="num">Valid</th>
                  <th className="num">Invalid</th>
                  <th className="num">Committed</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.filename ?? b.id.slice(0, 8)}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="num">{b.rowCount}</td>
                    <td className="num">{b.validRowCount}</td>
                    <td
                      className="num"
                      style={{ color: b.invalidRowCount > 0 ? 'var(--danger)' : undefined }}
                    >
                      {b.invalidRowCount}
                    </td>
                    <td className="num">{b.committedRowCount}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button size="sm" variant="ghost" onClick={() => void refreshActive(b.id)}>
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {active && spec && (
        <Card data-testid="batch-panel">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <strong style={{ fontSize: 14 }}>
              {active.filename ?? 'Batch'} — {active.status}
            </strong>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => void run('validate')}
                disabled={busy || active.status === 'committed'}
                data-testid="validate-batch"
              >
                Validate
              </Button>
              <Button
                variant="primary"
                onClick={() => void run('commit')}
                disabled={
                  busy ||
                  !['validated', 'committed'].includes(active.status) ||
                  active.validRowCount === 0
                }
                data-testid="commit-batch"
              >
                Commit
              </Button>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>
            Column mapping
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {spec.fields.map((f) => (
              <label key={f.name} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {f.name}
                {f.required ? ' *' : ''}
                <select
                  className="select"
                  value={mapping[f.name] ?? ''}
                  disabled={active.status === 'committed'}
                  onChange={(e) => {
                    const next = { ...mapping };
                    if (e.target.value === '') delete next[f.name];
                    else next[f.name] = e.target.value;
                    void saveMapping(next);
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

          {active.validationJson && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13, margin: '0 0 6px' }}>
                <strong>{active.validationJson.valid}</strong> valid ·{' '}
                <strong
                  style={{
                    color: active.validationJson.invalid > 0 ? 'var(--danger)' : undefined,
                  }}
                >
                  {active.validationJson.invalid}
                </strong>{' '}
                invalid
              </p>
              {active.validationJson.errors.length > 0 && (
                <div
                  style={{
                    maxHeight: 220,
                    overflow: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <table className="table" style={{ fontSize: 12 }}>
                    <tbody>
                      {active.validationJson.errors.map((e) => (
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
        </Card>
      )}

      {recon && (
        <Card data-testid="recon-panel" title="Reconciliation gates">
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <tbody>
                {recon.gate1_rowCounts.map((g) => (
                  <ReconRow
                    key={g.entity}
                    label={`Gate 1 — ${g.entity} rows`}
                    source={String(g.source)}
                    db={String(g.db)}
                    match={g.match}
                  />
                ))}
                <ReconRow
                  label="Gate 2 — units on hand"
                  source={String(recon.gate2_inventory.units.source)}
                  db={String(recon.gate2_inventory.units.db)}
                  match={recon.gate2_inventory.units.match}
                />
                <ReconRow
                  label="Gate 2 — valuation at cost"
                  source={money(recon.gate2_inventory.valuationCents.source)}
                  db={money(recon.gate2_inventory.valuationCents.db)}
                  match={recon.gate2_inventory.valuationCents.match}
                />
                <ReconRow
                  label="Gate 3 — deposits held"
                  source={money(recon.gate3_depositsHeldCents.source)}
                  db={money(recon.gate3_depositsHeldCents.db)}
                  match={recon.gate3_depositsHeldCents.match}
                />
                <ReconRow
                  label="Gate 4 — open AR"
                  source={money(recon.gate4_openArCents.source)}
                  db={money(recon.gate4_openArCents.db)}
                  match={recon.gate4_openArCents.match}
                />
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{recon.gate5}</p>
        </Card>
      )}
    </div>
  );
}

function ReconRow(props: { label: string; source: string; db: string; match: boolean }) {
  return (
    <tr>
      <td>{props.label}</td>
      <td>STORIS: {props.source}</td>
      <td>Jetnine: {props.db}</td>
      <td style={{ color: props.match ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
        {props.match ? '✓ match' : '✗ mismatch'}
      </td>
    </tr>
  );
}
