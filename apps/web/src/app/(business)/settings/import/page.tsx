'use client';

import { useEffect, useMemo, useState } from 'react';
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>STORIS data import</h1>
        <button onClick={() => void loadRecon()} style={ghostBtn} data-testid="recon-refresh">
          Recon report
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
        Import in this order — later files reference earlier ones. Re-uploading a corrected file
        updates the same records instead of duplicating them.
      </p>
      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {entities.map((e, i) => (
          <button
            key={e.entity}
            onClick={() => setEntity(e.entity)}
            style={{
              ...ghostBtn,
              background: entity === e.entity ? '#111' : 'transparent',
              color: entity === e.entity ? '#fff' : '#444',
            }}
            data-testid={`entity-${e.entity}`}
          >
            {i + 1}. {e.label}
          </button>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <strong style={{ fontSize: 14 }}>{spec?.label ?? entity}</strong>
          <label style={{ ...ghostBtn, cursor: 'pointer' }}>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 12 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={th}>File</th>
                <th style={th}>Status</th>
                <th style={th}>Rows</th>
                <th style={th}>Valid</th>
                <th style={th}>Invalid</th>
                <th style={th}>Committed</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>{b.filename ?? b.id.slice(0, 8)}</td>
                  <td style={td}>{b.status}</td>
                  <td style={td}>{b.rowCount}</td>
                  <td style={td}>{b.validRowCount}</td>
                  <td style={{ ...td, color: b.invalidRowCount > 0 ? '#b00' : undefined }}>
                    {b.invalidRowCount}
                  </td>
                  <td style={td}>{b.committedRowCount}</td>
                  <td style={td}>
                    <button onClick={() => void refreshActive(b.id)} style={ghostBtn}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {active && spec && (
        <div style={card} data-testid="batch-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <strong style={{ fontSize: 14 }}>
              {active.filename ?? 'Batch'} — {active.status}
            </strong>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                onClick={() => void run('validate')}
                disabled={busy || active.status === 'committed'}
                style={darkBtn}
                data-testid="validate-batch"
              >
                Validate
              </button>
              <button
                onClick={() => void run('commit')}
                disabled={busy || !['validated', 'committed'].includes(active.status)}
                style={darkBtn}
                data-testid="commit-batch"
              >
                Commit
              </button>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>Column mapping</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {spec.fields.map((f) => (
              <label key={f.name} style={{ fontSize: 12, color: '#444' }}>
                {f.name}
                {f.required ? ' *' : ''}
                <select
                  value={mapping[f.name] ?? ''}
                  disabled={active.status === 'committed'}
                  onChange={(e) => {
                    const next = { ...mapping };
                    if (e.target.value === '') delete next[f.name];
                    else next[f.name] = e.target.value;
                    void saveMapping(next);
                  }}
                  style={{ display: 'block', width: '100%', padding: 6, marginTop: 2 }}
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
                <strong style={{ color: active.validationJson.invalid > 0 ? '#b00' : undefined }}>
                  {active.validationJson.invalid}
                </strong>{' '}
                invalid
              </p>
              {active.validationJson.errors.length > 0 && (
                <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #eee' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>
                      {active.validationJson.errors.map((e) => (
                        <tr key={e.row} style={{ borderBottom: '1px solid #f2f2f2' }}>
                          <td style={{ ...td, whiteSpace: 'nowrap' }}>row {e.row}</td>
                          <td style={td}>{e.legacyId}</td>
                          <td style={td}>
                            {e.errors.map((er) => `${er.field}: ${er.message}`).join('; ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {recon && (
        <div style={card} data-testid="recon-panel">
          <strong style={{ fontSize: 14 }}>Reconciliation gates</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
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
          <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>{recon.gate5}</p>
        </div>
      )}
    </div>
  );
}

function ReconRow(props: { label: string; source: string; db: string; match: boolean }) {
  return (
    <tr style={{ borderBottom: '1px solid #eee' }}>
      <td style={td}>{props.label}</td>
      <td style={td}>STORIS: {props.source}</td>
      <td style={td}>Jetnine: {props.db}</td>
      <td style={{ ...td, color: props.match ? '#2c7a4b' : '#b00', fontWeight: 600 }}>
        {props.match ? '✓ match' : '✗ mismatch'}
      </td>
    </tr>
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
const ghostBtn: React.CSSProperties = {
  padding: '6px 12px',
  background: 'transparent',
  color: '#444',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
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
