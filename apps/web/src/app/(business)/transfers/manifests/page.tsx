'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
  StatusBadge,
} from '@/components/ui';

/**
 * Q1 (owner 2026-08-28): manifests without scanning. Build groups draft
 * transfers on one lane onto a truck/date manifest; the same open
 * (to-location, route, date) key appends. Complete ships the truck.
 */

interface ManifestRow {
  id: string;
  number: string;
  status: string;
  manifestDate: string;
  routeName: string | null;
  fromLocationName: string | null;
  toLocationName: string | null;
  transferCount: number;
  createdAt: string;
}

interface Location {
  id: string;
  name: string;
  locationType: string;
}

interface DraftTransfer {
  id: string;
  number: string;
  transferType: string;
  createdAt: string;
}

export default function ManifestsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ManifestRow[] | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Build form
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [manifestDate, setManifestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [routeName, setRouteName] = useState('');
  const [drafts, setDrafts] = useState<DraftTransfer[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [building, setBuilding] = useState(false);

  async function load() {
    try {
      const res = await api<{ rows: ManifestRow[] }>('/v1/stock-manifests');
      setRows(res.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    api<Location[]>('/v1/business/locations')
      .then(setLocations)
      .catch(() => setLocations([]));
  }, []);

  // Eligible drafts refresh whenever the lane changes.
  useEffect(() => {
    setSelected(new Set());
    if (!fromId || !toId || fromId === toId) {
      setDrafts(null);
      return;
    }
    api<{ data: DraftTransfer[] }>(
      `/v1/stock-transfers?status=draft&unmanifested=true&fromLocationId=${fromId}&toLocationId=${toId}&limit=100`,
    )
      .then((res) => setDrafts(res.data))
      .catch((err) => {
        setDrafts([]);
        toast.error(err instanceof Error ? err.message : String(err));
      });
  }, [fromId, toId]);

  async function build() {
    setBuilding(true);
    try {
      const created = await api<{ id: string }>('/v1/stock-manifests', {
        method: 'POST',
        body: JSON.stringify({
          fromLocationId: fromId,
          toLocationId: toId,
          manifestDate,
          routeName: routeName.trim() || null,
          transferIds: [...selected],
        }),
      });
      toast.success('Manifest built');
      router.push(`/transfers/manifests/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setBuilding(false);
    }
  }

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/transfers">← All transfers</Link>
      </p>
      <PageHeader
        title="Transfer manifests"
        sub="One truck run on one lane — build, print, complete"
      />

      <Card title="Build a manifest" style={{ marginBottom: 16 }}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="From">
            <Select value={fromId} onChange={(e) => setFromId(e.target.value)}>
              <option value="">Select…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.locationType === 'warehouse' ? ' (warehouse)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="To">
            <Select value={toId} onChange={(e) => setToId(e.target.value)}>
              <option value="">Select…</option>
              {locations
                .filter((l) => l.id !== fromId)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.locationType === 'warehouse' ? ' (warehouse)' : ''}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Truck date">
            <Input
              type="date"
              value={manifestDate}
              onChange={(e) => setManifestDate(e.target.value)}
            />
          </Field>
          <Field label="Route / truck (optional)">
            <Input
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g. Truck 2 AM"
            />
          </Field>
        </div>

        {drafts && (
          <div style={{ marginTop: 12 }}>
            {drafts.length === 0 ? (
              <EmptyState>No unmanifested draft transfers on this lane.</EmptyState>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }} />
                    <th>Transfer</th>
                    <th>Type</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(t.id);
                            else next.delete(t.id);
                            setSelected(next);
                          }}
                        />
                      </td>
                      <td>
                        <code>{t.number}</code>
                      </td>
                      <td>{t.transferType}</td>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Button
              variant="primary"
              onClick={build}
              disabled={building || selected.size === 0 || !manifestDate}
              style={{ marginTop: 12 }}
            >
              {building
                ? 'Building…'
                : `Build manifest (${selected.size} transfer${selected.size === 1 ? '' : 's'})`}
            </Button>
          </div>
        )}
      </Card>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!rows && !error && (
        <Card>
          <LoadingRows />
        </Card>
      )}
      {rows && (
        <Card title="Manifests" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Manifest</th>
                <th>Date</th>
                <th>Route</th>
                <th>Lane</th>
                <th>Transfers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState>No manifests yet.</EmptyState>
                  </td>
                </tr>
              )}
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/transfers/manifests/${m.id}`}>
                      <code>{m.number}</code>
                    </Link>
                  </td>
                  <td>{m.manifestDate}</td>
                  <td>{m.routeName ?? '—'}</td>
                  <td>
                    {m.fromLocationName ?? '—'} → {m.toLocationName ?? '—'}
                  </td>
                  <td>{m.transferCount}</td>
                  <td>
                    <StatusBadge status={m.status} />
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
