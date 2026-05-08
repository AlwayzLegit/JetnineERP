'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

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
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Cash drawer</h1>
      {error && <p style={{ color: '#b00' }}>{error}</p>}

      <div style={card}>
        <h2 style={section}>Open new shift</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="Location">
            <select
              value={openLocationId}
              onChange={(e) => setOpenLocationId(e.target.value)}
              style={inputStyle}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Opening float ($)">
            <input
              type="number"
              step="0.01"
              min={0}
              value={floatStr}
              onChange={(e) => setFloatStr(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Notes">
            <input
              value={openNotes}
              onChange={(e) => setOpenNotes(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <button onClick={openShift} disabled={opening || !floatStr} style={primaryBtn}>
            {opening ? 'Opening…' : 'Open shift'}
          </button>
        </div>
      </div>

      <div style={card}>
        <h2 style={section}>Shifts</h2>
        {rows == null ? (
          <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: '#888', fontSize: 13 }}>No shifts yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <Th>Opened</Th>
                <Th>Location</Th>
                <Th>Float</Th>
                <Th>Status</Th>
                <Th>Variance</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <Td>{new Date(r.openedAt).toLocaleString()}</Td>
                  <Td>{r.locationName ?? '—'}</Td>
                  <Td>
                    <Money cents={r.openingFloatCents} />
                  </Td>
                  <Td>
                    {r.closedAt ? (
                      <span style={{ color: '#666' }}>
                        Closed {new Date(r.closedAt).toLocaleString()}
                      </span>
                    ) : (
                      <strong style={{ color: '#070' }}>Open</strong>
                    )}
                  </Td>
                  <Td>{r.varianceCents == null ? '—' : <Money cents={r.varianceCents} />}</Td>
                  <Td>
                    <Link href={`/shifts/${r.id}`}>Open</Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
const section = { fontSize: 16, marginBottom: 12, marginTop: 0 } as const;
const inputStyle = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
} as const;
const primaryBtn = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: '6px 4px',
        fontWeight: 600,
        textAlign: 'left',
        borderBottom: '1px solid #ddd',
      }}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '6px 4px', borderBottom: '1px solid #f3f3f3' }}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
