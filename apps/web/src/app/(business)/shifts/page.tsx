'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, EmptyState, Field, Input, LoadingRows, PageHeader, Select } from '@/components/ui';

interface ShiftRow {
  id: string;
  locationId: string;
  locationName: string | null;
  openedByEmail: string | null;
  openedAt: string;
  openingFloatCents: number;
  closedAt: string | null;
  expectedCashCents: number | null;
  countedCashCents: number | null;
  varianceCents: number | null;
  notes: string | null;
}
interface LocationRow {
  id: string;
  name: string;
}

export default function ShiftsPage() {
  const [rows, setRows] = useState<ShiftRow[] | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [openLocationId, setOpenLocationId] = useState('');
  const [floatStr, setFloatStr] = useState('');
  const [openNotes, setOpenNotes] = useState('');

  async function load() {
    try {
      const [shifts, locs] = await Promise.all([
        api<ShiftRow[]>('/v1/cash-shifts'),
        api<LocationRow[]>('/v1/pos/locations'),
      ]);
      setRows(shifts);
      setLocations(locs);
      if (!openLocationId && locs.length > 0) setOpenLocationId(locs[0]!.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openShift() {
    if (!openLocationId) return;
    setError(null);
    setOpening(true);
    try {
      const cents = Math.round(Number(floatStr) * 100);
      if (!Number.isFinite(cents) || cents < 0) throw new Error('Float must be ≥ 0');
      await api('/v1/cash-shifts', {
        method: 'POST',
        body: JSON.stringify({
          locationId: openLocationId,
          openingFloatCents: cents,
          notes: openNotes || null,
        }),
      });
      setFloatStr('');
      setOpenNotes('');
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setOpening(false);
    }
  }

  return (
    <div>
      <PageHeader title="Cash drawer" />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="card">
        <h2 className="card-title">Open new shift</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="Location">
            <Select value={openLocationId} onChange={(e) => setOpenLocationId(e.target.value)}>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Opening float ($)">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={floatStr}
              onChange={(e) => setFloatStr(e.target.value)}
            />
          </Field>
          <Field label="Notes">
            <Input value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} />
          </Field>
          <Button variant="primary" onClick={openShift} disabled={opening || !floatStr}>
            {opening ? 'Opening…' : 'Open shift'}
          </Button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Shifts</h2>
        {rows == null ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState>No shifts yet. Open one above to start tracking the drawer.</EmptyState>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Opened</th>
                <th>Location</th>
                <th className="num">Float</th>
                <th>Status</th>
                <th className="num">Variance</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.openedAt).toLocaleString()}</td>
                  <td>{r.locationName ?? '—'}</td>
                  <td className="num">
                    <Money cents={r.openingFloatCents} />
                  </td>
                  <td>
                    {r.closedAt ? (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Closed {new Date(r.closedAt).toLocaleString()}
                      </span>
                    ) : (
                      <strong style={{ color: 'var(--success)' }}>Open</strong>
                    )}
                  </td>
                  <td className="num">
                    {r.varianceCents == null ? '—' : <Money cents={r.varianceCents} />}
                  </td>
                  <td>
                    <Link href={`/shifts/${r.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
