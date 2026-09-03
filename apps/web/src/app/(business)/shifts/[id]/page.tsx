'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Money } from '@/components/money';
import { SecurityOverrideDialog } from '@/components/security-override-dialog';
import {
  Alert,
  BackLink,
  Button,
  Card,
  Field,
  FormActions,
  FormGrid,
  Input,
  LoadingRows,
  PageHeader,
  Stack,
  StatGrid,
  StatTile,
  StatusBadge,
} from '@/components/ui';

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
  closeAttempts: number;
  suspendedAt: string | null;
  approvedByUserId: string | null;
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
  const [overrideOpen, setOverrideOpen] = useState(false);

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

  function closeBody() {
    const cents = Math.round(Number(countedStr) * 100);
    if (!Number.isFinite(cents) || cents < 0) throw new Error('Counted cash must be ≥ 0');
    return { countedCashCents: cents, notes: closeNotes || null };
  }

  async function closeShift() {
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/cash-shifts/${id}/close`, {
        method: 'POST',
        body: JSON.stringify(closeBody()),
      });
      void load();
    } catch (err) {
      // A suspended drawer needs the manager-approval dialog (blind count).
      if (err instanceof ApiError && err.code === 'OVERRIDE_REQUIRED') {
        setOverrideOpen(true);
      } else {
        setError(err instanceof Error ? err.message : String(err));
        void load(); // refresh closeAttempts / suspension state
      }
    } finally {
      setBusy(false);
    }
  }

  if (error && !shift) {
    return (
      <div>
        <PageHeader
          title="Shift not found"
          eyebrow={<BackLink href="/shifts">All shifts</BackLink>}
        />
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }
  if (!shift) return <LoadingRows rows={4} />;

  const variance = shift.varianceCents ?? 0;
  const varianceTone = variance === 0 ? 'success' : variance < 0 ? 'danger' : 'warning';
  const status = shift.closedAt ? 'closed' : shift.suspendedAt ? 'suspended' : 'open';

  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/shifts">All shifts</BackLink>}
        title={`Shift at ${shift.locationName ?? '(unknown location)'}`}
        meta={<StatusBadge status={status} />}
        sub={
          <>
            Opened {new Date(shift.openedAt).toLocaleString()}
            {shift.openedByEmail && <> by {shift.openedByEmail}</>}
          </>
        }
      />

      <Stack className="form-narrow">
        <Card
          title="Drawer"
          description={
            shift.closedAt ? (
              <>
                Closed {new Date(shift.closedAt).toLocaleString()}
                {shift.closedByEmail && <> by {shift.closedByEmail}</>}.
              </>
            ) : undefined
          }
        >
          {shift.closedAt ? (
            <StatGrid cols={4}>
              <StatTile label="Opening float" value={<Money cents={shift.openingFloatCents} />} />
              <StatTile
                label="Expected cash"
                value={<Money cents={shift.expectedCashCents ?? 0} />}
              />
              <StatTile
                label="Counted cash"
                value={<Money cents={shift.countedCashCents ?? 0} />}
              />
              <StatTile label="Variance" value={<Money cents={variance} />} tone={varianceTone} />
            </StatGrid>
          ) : (
            <StatGrid cols={2}>
              <StatTile label="Opening float" value={<Money cents={shift.openingFloatCents} />} />
              <StatTile
                label="Close attempts"
                value={shift.closeAttempts}
                tone={shift.closeAttempts > 0 ? 'warning' : undefined}
              />
            </StatGrid>
          )}
        </Card>

        {!shift.closedAt && (
          <Card title="Count and close">
            {shift.suspendedAt && (
              <Alert tone="error">
                Drawer suspended after {shift.closeAttempts} out-of-tolerance count
                {shift.closeAttempts === 1 ? '' : 's'} — a manager must approve the close.
              </Alert>
            )}
            {!shift.suspendedAt && shift.closeAttempts > 0 && (
              <Alert tone="warning">
                {shift.closeAttempts} out-of-balance count
                {shift.closeAttempts === 1 ? '' : 's'} so far — recount the drawer.
              </Alert>
            )}
            <FormGrid cols={2}>
              <Field label="Counted cash ($)" required>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={countedStr}
                  onChange={(e) => setCountedStr(e.target.value)}
                />
              </Field>
              <Field label="Notes">
                <Input value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} />
              </Field>
            </FormGrid>
            {error && (
              <Alert tone="error" className="mt-3">
                {error}
              </Alert>
            )}
            <FormActions>
              <Button variant="primary" onClick={closeShift} disabled={busy || !countedStr}>
                {busy ? 'Closing…' : 'Close shift'}
              </Button>
            </FormActions>
            <SecurityOverrideDialog
              open={overrideOpen}
              title="Suspended drawer — manager approval needed"
              usageClass="exception"
              submitLabel="Approve close"
              perform={(payload) =>
                api(`/v1/cash-shifts/${id}/close`, {
                  method: 'POST',
                  body: JSON.stringify({ ...closeBody(), override: payload.override }),
                }).then(() => undefined)
              }
              onClose={() => setOverrideOpen(false)}
              onSuccess={() => void load()}
            />
          </Card>
        )}
      </Stack>
    </div>
  );
}
