'use client';

import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card, EmptyState, Field, Input, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';

interface Location {
  id: string;
  name: string;
  timezone: string;
  taxRateBps: number | null;
  isActive: boolean;
}

export default function LocationsPage() {
  const [rows, setRows] = useState<Location[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await api<Location[]>('/v1/business/locations'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const data = new FormData(e.currentTarget);
      const taxRaw = String(data.get('taxRateBps') ?? '').trim();
      await api('/v1/business/locations', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          timezone: String(data.get('timezone') ?? ''),
          taxRateBps: taxRaw ? Number(taxRaw) : null,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function toggle(loc: Location) {
    try {
      await api(`/v1/business/locations/${loc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !loc.isActive }),
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(loc: Location) {
    if (
      !window.confirm(
        `Delete "${loc.name}" permanently? Only possible while nothing references it.`,
      )
    )
      return;
    try {
      await api(`/v1/business/locations/${loc.id}`, { method: 'DELETE' });
      toast.success(`Deleted "${loc.name}"`);
      await load();
    } catch (err) {
      // 409 = has history; the server message says what references it.
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader title="Locations" />
      <Card title="Add location">
        <form onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name">
              <Input name="name" required style={{ width: '100%' }} />
            </Field>
            <Field label="Timezone">
              <Input
                name="timezone"
                defaultValue="America/Los_Angeles"
                required
                style={{ width: '100%' }}
              />
            </Field>
            <Field label="Tax override (bps; blank = inherit)">
              <Input name="taxRateBps" type="number" min={0} style={{ width: '100%' }} />
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Button type="submit" variant="primary">
              <Plus size={14} aria-hidden />
              Create
            </Button>
          </div>
        </form>
      </Card>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!rows && !error && (
        <Card>
          <LoadingRows />
        </Card>
      )}
      {rows && (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Timezone</th>
                <th>Tax</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState>No locations yet.</EmptyState>
                  </td>
                </tr>
              )}
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>
                    <strong>{l.name}</strong>
                  </td>
                  <td>{l.timezone}</td>
                  <td>
                    {l.taxRateBps != null ? `${(l.taxRateBps / 100).toFixed(2)}%` : 'inherit'}
                  </td>
                  <td>
                    <span className={`badge ${l.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {l.isActive ? 'yes' : 'no'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggle(l)}>
                        {l.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      {!l.isActive && (
                        <Button size="sm" variant="danger" onClick={() => void remove(l)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
