'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface Shift {
  id: string;
  locationId: string;
  locationName: string | null;
  openedByEmail: string | null;
  openedAt: string;
  openingFloatCents: number;
  closedByEmail: string | null;
  closedAt: string | null;
  expectedCashCents: number | null;
  countedCashCents: number | null;
  varianceCents: number | null;
  notes: string | null;
}

export default function ShiftDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const [shift, setShift] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countedStr, setCountedStr] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setShift(await api<Shift>(`/v1/cash-shifts/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function closeShift() {
    setBusy(true);
    setError(null);
    try {
      const cents = Math.round(Number(countedStr) * 100);
      if (!Number.isFinite(cents) || cents < 0) throw new Error('Counted cash must be ≥ 0');
      await api(`/v1/cash-shifts/${id}/close`, {
        method: 'POST',
        body: JSON.stringify({ countedCashCents: cents, notes: closeNotes || null }),
      });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !shift) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!shift) return <p>Loading…</p>;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/shifts">← All shifts</Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        Shift at {shift.locationName ?? '(unknown location)'}
      </h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
        Opened {new Date(shift.openedAt).toLocaleString()}
        {shift.openedByEmail && <> by {shift.openedByEmail}</>}
      </p>

      <div style={card}>
        <Row label="Opening float" cents={shift.openingFloatCents} />
        {shift.closedAt ? (
          <>
            <Row label="Expected cash" cents={shift.expectedCashCents ?? 0} />
            <Row label="Counted cash" cents={shift.countedCashCents ?? 0} />
            <Row
              label="Variance"
              cents={shift.varianceCents ?? 0}
              bold
              color={
                (shift.varianceCents ?? 0) === 0
                  ? '#070'
                  : (shift.varianceCents ?? 0) < 0
                    ? '#b00'
                    : '#a60'
              }
            />
            <p style={{ color: '#666', fontSize: 13, marginTop: 12 }}>
              Closed {new Date(shift.closedAt).toLocaleString()}
              {shift.closedByEmail && <> by {shift.closedByEmail}</>}.
            </p>
          </>
        ) : (
          <>
            <Field label="Counted cash ($)">
              <input
                type="number"
                step="0.01"
                min={0}
                value={countedStr}
                onChange={(e) => setCountedStr(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Notes">
              <input
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                style={inputStyle}
              />
            </Field>
            {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}
            <button onClick={closeShift} disabled={busy || !countedStr} style={primaryBtn}>
              {busy ? 'Closing…' : 'Close shift'}
            </button>
          </>
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
  display: 'grid',
  gap: 8,
};
const inputStyle = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
} as const;
const primaryBtn = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  marginTop: 8,
  alignSelf: 'flex-start',
  width: 'fit-content',
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
function Row({
  label,
  cents,
  bold,
  color,
}: {
  label: string;
  cents: number;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: bold ? 700 : 400,
        color: color ?? 'inherit',
      }}
    >
      <span>{label}</span>
      <span>
        {cents < 0 ? '-' : ''}${Math.abs(cents / 100).toFixed(2)}
      </span>
    </div>
  );
}
