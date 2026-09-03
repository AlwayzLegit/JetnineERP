'use client';

import { toast } from 'sonner';
import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  BackLink,
  Button,
  Card,
  EmptyState,
  Field,
  FormActions,
  FormGrid,
  Input,
  LoadingRows,
  PageHeader,
  Stack,
  TableWrap,
} from '@/components/ui';
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
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);
    const form = e.currentTarget;
    try {
      const data = new FormData(form);
      await api('/v1/business/tax-classes', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          description: String(data.get('description') ?? '') || null,
          rateBps: Math.round(Number(data.get('rate') ?? 0) * 100),
          isDefault: data.get('isDefault') === 'on',
        }),
      });
      form.reset();
      setCreating(false);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
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
      <PageHeader
        eyebrow={<BackLink href="/settings">Settings</BackLink>}
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

      <Stack>
        {error && <Alert tone="error">{error}</Alert>}

        {creating && (
          <Card title="New tax class" className="form-narrow">
            <form onSubmit={create}>
              <FormGrid cols={2}>
                <Field label="Name" required>
                  <Input name="name" required />
                </Field>
                <Field label="Rate (%)" required>
                  <Input name="rate" type="number" step="0.01" min={0} max={1000} required />
                </Field>
                <Field label="Description" className="form-span">
                  <Input name="description" />
                </Field>
                <label className="form-span flex items-center gap-2">
                  <input name="isDefault" type="checkbox" />
                  Use as the default class for new products
                </label>
              </FormGrid>
              <FormActions>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create class'}
                </Button>
              </FormActions>
            </form>
          </Card>
        )}

        {rows == null ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState title="No tax classes yet">
            Products use the location/business default rate until you add a class.
          </EmptyState>
        ) : (
          <Card flush>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="num">Rate</th>
                    <th>Default</th>
                    <th className="num">Products</th>
                    <th className="actions">
                      <span className="sr-only">Actions</span>
                    </th>
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
            </TableWrap>
          </Card>
        )}
      </Stack>
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
          {row.description && <div className="muted">{row.description}</div>}
        </td>
        <td className="num">{(row.rateBps / 100).toFixed(2)}%</td>
        <td>{row.isDefault ? <span className="badge badge-brand">yes</span> : '—'}</td>
        <td className="num">{row.productCount}</td>
        <td className="actions">
          <Button size="sm" variant="ghost" onClick={onToggleExpand} aria-expanded={expanded}>
            {expanded ? 'Hide overrides' : 'Per-location'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-[var(--surface-muted)] p-3">
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

  if (overrides == null) return <LoadingRows rows={2} />;
  if (locations.length === 0) {
    return <EmptyState>No locations yet.</EmptyState>;
  }

  return (
    <Stack gap="sm">
      <p className="muted">
        Override the <strong>{(taxClass.rateBps / 100).toFixed(2)}%</strong> fallback per location.
        Leave blank to use the fallback. Empty input + Save removes the override.
      </p>
      {error && <Alert tone="error">{error}</Alert>}
      <TableWrap>
        <table className="table table-dense">
          <thead>
            <tr>
              <th>Location</th>
              <th>Rate (%)</th>
              <th>Source</th>
              <th className="actions">
                <span className="sr-only">Actions</span>
              </th>
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
                      aria-label={`Rate for ${l.name}`}
                      className="w-24"
                    />
                  </td>
                  <td className="muted">{ov ? 'override' : 'class fallback'}</td>
                  <td className="actions">
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
      </TableWrap>
    </Stack>
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
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Name"
          className="w-full"
        />
      </td>
      <td className="num">
        <Input
          type="number"
          step="0.01"
          min={0}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          aria-label="Rate (%)"
          className="w-24"
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          aria-label="Default class"
        />
      </td>
      <td className="num">{row.productCount}</td>
      <td className="actions">
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
      </td>
    </tr>
  );
}
