'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { formatMoney } from '@jetnine/shared';
import {
  Alert,
  BackLink,
  Button,
  Card,
  EmptyState,
  LinkButton,
  LoadingRows,
  PageHeader,
  Stack,
} from '@/components/ui';

/**
 * Driver day-sheet (Day 3): one printable page for one day's route —
 * stop order, address, phone, what's on the truck, and what to collect.
 * The global print stylesheet strips the app chrome (`.no-print`,
 * sidebar, topbar); this page is built to be handed to a driver on paper.
 */

interface DeliveryRow {
  id: string;
  orderNumber: string;
  customerName: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  status: string;
  routePosition: number | null;
  notes: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressRegion: string | null;
  addressPostalCode: string | null;
  addressPhone: string | null;
  balanceDueCents: number;
  lines: { id: string; description: string; quantity: number }[];
}

export default function DaySheetPage() {
  const params = useParams<{ date: string }>();
  const date = (params?.date ?? '') as string;
  const [rows, setRows] = useState<DeliveryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    void (async () => {
      try {
        const all = await import('@/lib/api').then(({ api }) =>
          api<DeliveryRow[]>(`/v1/deliveries?from=${date}&to=${date}`),
        );
        setRows(all.filter((r) => r.status !== 'cancelled'));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [date]);

  return (
    <div className="max-w-[720px]">
      <PageHeader
        eyebrow={
          <span className="no-print">
            <BackLink href="/deliveries">Calendar</BackLink>
          </span>
        }
        title={`Day sheet — ${date}`}
        sub={
          <>
            {rows ? `${rows.length} stop${rows.length === 1 ? '' : 's'}` : '…'} · collect amounts
            are cash/check on delivery; record them on the order when back.
          </>
        }
        actions={
          <span className="no-print contents">
            <LinkButton
              href={`/print/deliveries?date=${date}`}
              variant="secondary"
              size="sm"
              data-testid="print-all-tickets"
            >
              <Printer size={13} aria-hidden />
              All tickets (no lock)
            </LinkButton>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer size={14} aria-hidden />
              Print
            </Button>
          </span>
        }
      />
      <Stack gap="sm">
        {error && <Alert tone="error">{error}</Alert>}
        {!rows && !error && <LoadingRows rows={3} />}

        {rows?.map((r, i) => (
          <Card
            key={r.id}
            className="break-inside-avoid"
            title={
              <>
                #{r.routePosition ?? i + 1} · {r.orderNumber}
                {r.customerName ? (
                  <span className="muted font-normal"> · {r.customerName}</span>
                ) : null}
              </>
            }
            description={
              <>
                {r.addressLine1 ?? '—'}
                {r.addressLine2 ? `, ${r.addressLine2}` : ''}
                {r.addressCity
                  ? ` — ${[r.addressCity, r.addressRegion, r.addressPostalCode].filter(Boolean).join(', ')}`
                  : ''}
                {r.addressPhone ? ` · ☎ ${r.addressPhone}` : ''}
              </>
            }
            actions={
              (r.windowStart || r.windowEnd) && (
                <span className="text-[13px]">
                  {r.windowStart?.slice(0, 5)}–{r.windowEnd?.slice(0, 5)}
                </span>
              )
            }
          >
            <Stack gap="sm">
              <ul className="m-0 list-disc pl-[18px] text-[13px]">
                {r.lines.map((l) => (
                  <li key={l.id}>
                    {l.quantity} × {l.description}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                {r.balanceDueCents > 0 ? (
                  <strong>COLLECT {formatMoney(r.balanceDueCents)}</strong>
                ) : (
                  <span className="text-[var(--success)]">Paid in full</span>
                )}
                <span className="muted ml-auto">Signature: ______________________</span>
              </div>
              {r.notes && <p className="muted m-0 text-[12.5px]">{r.notes}</p>}
            </Stack>
          </Card>
        ))}
        {rows && rows.length === 0 && (
          <EmptyState
            title="No stops on this day"
            action={
              <span className="no-print">
                <LinkButton size="sm" href="/deliveries">
                  Back to calendar
                </LinkButton>
              </span>
            }
          >
            No deliveries scheduled for this day.
          </EmptyState>
        )}
      </Stack>
    </div>
  );
}
