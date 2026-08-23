'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card, EmptyState, Field, Input, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';

interface TaxClass {
  id: string;
  name: string;
  description: string | null;
  rateBps: number;
  isDefault: boolean;
  productCount: number;
}

interface LocationRow {
  id: string;
  name: string;
}

interface OverrideRow {
  id: string;
  locationId: string;
  rateBps: number;
}

export default function TaxClassesPage() {
  const [rows, setRows] = useState<TaxClass[] | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [classes, locs] = await Promise.all([
        api<TaxClass[]>('/v1/business/tax-classes'),
        api<LocationRow[]>('/v1/pos/locations'),
      ]);
      setRows(classes);
      setLocations(locs);
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
      await api('/v1/business/tax-classes', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          description: String(data.get('description') ?? '') || null,
          rateBps: Math.round(Number(data.get('rate') ?? 0) * 100),
          isDefault: data.get('isDefault') === 'on',
        }),
      });
      e.currentTarget.reset();
      setCreating(false);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function save(id: string, patch: Partial<TaxClass>) {
    try {
      await api(`/v1/business/tax-classes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setEditing(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function destroy(row: TaxClass) {
    const message =
      row.productCount > 0
        ? `Delete "${row.name}"? ${row.productCount} product(s) will fall back to the location/business default tax rate.`
        : `Delete "${row.name}"?`;
    if (!confirm(message)) return;
    try {
      await api(`/v1/business/tax-classes/${row.id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/settings">← Settings</Link>
      </p>
      <PageHeader
        title="Tax classes"
        sub={
          <>
            Tax classes override the location/business default rate at the product level. Products
            without a class use the default. Rates are entered as percentages (e.g.{' '}
            <code>8.75</code> = 8.75%).
          </>
        }
        actions={
          <Button
            variant={creating ? 'secondary' : 'primary'}
            onClick={() => setCreating((v) => !v)}
          >
            {creating ? 'Cancel' : '+ New tax class'}
          </Button>
        }
      />

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {creating && (
        <Card style={{ maxWidth: 560, marginBottom: 16 }}>
          <form onSubmit={create} style={{ display: 'grid', gap: 8 }}>
            <Field label="Name *">
              <Input name="name" required style={{ width: '100%' }} />
            </Field>
            <Field label="Rate (%) *">
              <Input
                name="rate"
                type="number"
                step="0.01"
                min={0}
                max={1000}
                required
                style={{ width: '100%' }}
              />
            </Field>
            <Field label="Description">
              <Input name="description" style={{ width: '100%' }} />
            </Field>
            <label style={{ display: 'flex', gap: 6, fontSize: 13, alignItems: 'center' }}>
              <input name="isDefault" type="checkbox" style={{ accentColor: 'var(--brand)' }} />
              Use as the default class for new products
            </label>
            <Button type="submit" variant="primary" style={{ width: 'fit-content' }}>
              Create class
            </Button>
          </form>
        </Card>
      )}

      <Card>
        {rows == null ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState>No tax classes yet.</EmptyState>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Rate</th>
                  <th>Default</th>
                  <th>Products</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) =>
                  editing === r.id ? (
                    <EditRow
                      key={r.id}
                      row={r}
                      onSave={(patch) => save(r.id, patch)}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <FragmentRow
                      key={r.id}
                      row={r}
                      locations={locations}
                      expanded={expanded === r.id}
                      onToggleExpand={() => setExpanded(expanded === r.id ? null : r.id)}
                      onEdit={() => setEditing(r.id)}
                      onDelete={() => destroy(r)}
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FragmentRow({
  row,
  locations,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  row: TaxClass;
  locations: LocationRow[];
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr>
        <td>
          <strong>{row.name}</strong>
          {row.description && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{row.description}</div>
          )}
        </td>
        <td>{(row.rateBps / 100).toFixed(2)}%</td>
        <td>{row.isDefault ? <span className="badge badge-brand">yes</span> : '—'}</td>
        <td>{row.productCount}</td>
        <td>
          <span style={{ display: 'inline-flex', gap: 6 }}>
            <Button size="sm" variant="ghost" onClick={onToggleExpand}>
              {expanded ? 'Hide overrides' : 'Per-location'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} style={{ background: 'var(--surface-muted)', padding: 12 }}>
            <OverridesPanel taxClass={row} locations={locations} />
          </td>
        </tr>
      )}
    </>
  );
}

function OverridesPanel({ taxClass, locations }: { taxClass: TaxClass; locations: LocationRow[] }) {
  const [overrides, setOverrides] = useState<Map<string, OverrideRow> | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const rows = await api<OverrideRow[]>(`/v1/business/tax-classes/${taxClass.id}/rates`);
      const next = new Map<string, OverrideRow>();
      const nextDrafts: Record<string, string> = {};
      for (const r of rows) {
        next.set(r.locationId, r);
        nextDrafts[r.locationId] = (r.rateBps / 100).toFixed(2);
      }
      setOverrides(next);
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxClass.id]);

  async function saveRate(locationId: string) {
    const raw = drafts[locationId]?.trim() ?? '';
    if (raw === '') {
      // Empty input → delete the override (revert to class fallback).
      setBusy(locationId);
      try {
        await api(`/v1/business/tax-classes/${taxClass.id}/rates/${locationId}`, {
          method: 'DELETE',
        });
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(null);
      }
      return;
    }
    const pct = Number(raw);
    if (!Number.isFinite(pct) || pct < 0) {
      setError(`Invalid rate for ${locationId}`);
      return;
    }
    setBusy(locationId);
    try {
      await api(`/v1/business/tax-classes/${taxClass.id}/rates/${locationId}`, {
        method: 'PUT',
        body: JSON.stringify({ rateBps: Math.round(pct * 100) }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  if (overrides == null)
    return <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>Loading…</p>;
  if (locations.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>No locations yet.</p>
    );
  }

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 8px' }}>
        Override the <strong>{(taxClass.rateBps / 100).toFixed(2)}%</strong> fallback per location.
        Leave blank to use the fallback. Empty input + Save removes the override.
      </p>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Rate (%)</th>
              <th>Source</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => {
              const ov = overrides.get(l.id);
              return (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder={(taxClass.rateBps / 100).toFixed(2)}
                      value={drafts[l.id] ?? ''}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [l.id]: e.target.value }))}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {ov ? 'override' : 'class fallback'}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => void saveRate(l.id)}
                      disabled={busy === l.id}
                    >
                      {busy === l.id ? '…' : 'Save'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditRow({
  row,
  onSave,
  onCancel,
}: {
  row: TaxClass;
  onSave: (patch: Partial<TaxClass> & { rateBps?: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [rate, setRate] = useState((row.rateBps / 100).toFixed(2));
  const [isDefault, setIsDefault] = useState(row.isDefault);

  return (
    <tr>
      <td>
        <Input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
      </td>
      <td>
        <Input
          type="number"
          step="0.01"
          min={0}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          style={{ width: 90 }}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          style={{ accentColor: 'var(--brand)' }}
        />
      </td>
      <td>{row.productCount}</td>
      <td>
        <span style={{ display: 'inline-flex', gap: 6 }}>
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              onSave({
                name,
                rateBps: Math.round(Number(rate) * 100),
                isDefault,
              })
            }
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </span>
      </td>
    </tr>
  );
}
