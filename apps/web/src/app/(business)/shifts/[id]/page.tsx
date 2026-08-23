'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, Field, Input, LoadingRows, PageHeader } from '@/components/ui';

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
  const id = (params?.id ?? '') as string;
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

  if (error && !shift) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!shift) return <LoadingRows rows={4} />;

  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ marginBottom: 12 }}>
        <Link href="/shifts">← All shifts</Link>
      </p>
      <PageHeader
        title={`Shift at ${shift.locationName ?? '(unknown location)'}`}
        sub={
          <>
            Opened {new Date(shift.openedAt).toLocaleString()}
            {shift.openedByEmail && <> by {shift.openedByEmail}</>}
          </>
        }
      />

      <div className="card" style={{ display: 'grid', gap: 8 }}>
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
                  ? 'var(--success)'
                  : (shift.varianceCents ?? 0) < 0
                    ? 'var(--danger)'
                    : 'var(--warning)'
              }
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 12 }}>
              Closed {new Date(shift.closedAt).toLocaleString()}
              {shift.closedByEmail && <> by {shift.closedByEmail}</>}.
            </p>
          </>
        ) : (
          <>
            <Field label="Counted cash ($)">
              <Input
                type="number"
                step="0.01"
                min={0}
                value={countedStr}
                onChange={(e) => setCountedStr(e.target.value)}
                style={{ width: '100%' }}
              />
            </Field>
            <Field label="Notes">
              <Input
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                style={{ width: '100%' }}
              />
            </Field>
            {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}
            <Button
              variant="primary"
              onClick={closeShift}
              disabled={busy || !countedStr}
              style={{ marginTop: 8, width: 'fit-content' }}
            >
              {busy ? 'Closing…' : 'Close shift'}
            </Button>
          </>
        )}
      </div>
    </div>
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
        fontVariantNumeric: 'tabular-nums',
        color: color ?? 'inherit',
      }}
    >
      <span>{label}</span>
      <span>
        <Money cents={cents} />
      </span>
    </div>
  );
}
