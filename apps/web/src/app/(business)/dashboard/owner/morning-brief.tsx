'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { EmptyRow, ShimmerRows, shortDay, usdShort } from './owner-kit';

/**
 * The morning brief card from the design: yesterday's business by
 * store as bars, then four facts — deliveries, refunds & cancels,
 * modified orders, top associate. Data is /v1/dashboard/morning.
 */
export interface MorningBrief {
  date: string;
  today: string;
  salesByStore: {
    locationId: string;
    locationName: string | null;
    saleCount: number;
    saleTotalCents: number;
    orderCount: number;
    orderTotalCents: number;
  }[];
  salesByAssociate: {
    userId: string | null;
    name: string | null;
    email: string | null;
    totalCents: number;
  }[];
  deliveriesToday: { booked: number; cap: number; byStatus: Record<string, number> };
  refundsCancellations: { id: string }[];
  modifiedOrders: { orderId: string; changeCount: number }[];
  openExceptions: { count: number };
}

export function MorningBriefCard({
  brief,
  loading,
  storeIds,
  handle,
}: {
  brief: MorningBrief | null;
  loading: boolean;
  storeIds: string[] | null;
  handle?: ReactNode;
}) {
  const stores = (brief?.salesByStore ?? [])
    .filter((s) => !storeIds || storeIds.includes(s.locationId))
    .map((s) => ({ ...s, cents: s.saleTotalCents + s.orderTotalCents }))
    .sort((a, b) => b.cents - a.cents);
  const top = stores[0]?.cents ?? 0;
  const changes = brief?.modifiedOrders.reduce((s, m) => s + m.changeCount, 0) ?? 0;
  const topAssoc = brief?.salesByAssociate[0];
  const facts: { label: string; value: string; sub: string; color?: string; href: string }[] = brief
    ? [
        {
          label: 'Deliveries today',
          value: String(brief.deliveriesToday.booked),
          sub: `/ ${brief.deliveriesToday.cap} cap`,
          color:
            brief.deliveriesToday.booked > brief.deliveriesToday.cap ? 'var(--danger)' : undefined,
          href: '/deliveries/dispatch',
        },
        {
          label: 'Refunds & cancels',
          value: String(brief.refundsCancellations.length),
          sub: 'yesterday',
          color: brief.refundsCancellations.length > 0 ? 'var(--danger)' : undefined,
          href: '/exceptions',
        },
        {
          label: 'Modified orders',
          value: String(brief.modifiedOrders.length),
          sub: `${changes} change${changes === 1 ? '' : 's'}`,
          href: '/audit',
        },
        {
          label: 'Top associate',
          value: topAssoc
            ? (topAssoc.name ?? topAssoc.email ?? '—')
                .split(' ')
                .map((w, i) => (i === 0 ? w : `${w[0] ?? ''}.`))
                .join(' ')
            : '—',
          sub: topAssoc ? usdShort(topAssoc.totalCents) : 'nothing attributed',
          href: '/salespeople',
        },
      ]
    : [];
  const exc = brief?.openExceptions.count ?? 0;

  return (
    <section className="panel" data-testid="morning-brief">
      <div className="panel-head">
        <h2>Morning brief</h2>
        <span className="panel-sub">
          {brief ? `yesterday, ${shortDay(brief.date)}` : 'yesterday'}
        </span>
        <Link href="/exceptions" className="panel-link">
          {exc > 0 ? `${exc} open exception${exc === 1 ? '' : 's'} →` : 'Exception register →'}
        </Link>
        {handle}
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="eyebrow">By store</div>
        {loading && <ShimmerRows rows={4} />}
        {!loading && stores.length === 0 && (
          <div style={{ padding: '14px 0', color: 'var(--muted)', fontSize: 12.5 }}>
            No business written yesterday at the selected stores.
          </div>
        )}
        {stores.map((s) => (
          <div
            key={s.locationId}
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 68px',
              alignItems: 'center',
              gap: 10,
              fontSize: 12.5,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.locationName ?? '—'}
            </span>
            <div style={{ height: 8, borderRadius: 2, background: 'var(--surface2)' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  background: 'var(--accent)',
                  width: `${top ? Math.round((s.cents / top) * 100) : 0}%`,
                }}
              />
            </div>
            <span className="mono" style={{ textAlign: 'right' }}>
              {usdShort(s.cents)}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          borderTop: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        {loading && !brief && <EmptyRow>…</EmptyRow>}
        {facts.map((fact) => (
          <Link
            key={fact.label}
            href={fact.href}
            style={{
              textAlign: 'left',
              padding: '11px var(--pad)',
              borderBottom: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
              color: 'inherit',
              textDecoration: 'none',
            }}
            className="hover:bg-surface-2"
          >
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{fact.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                className="mono"
                style={{ fontSize: 17, fontWeight: 500, color: fact.color ?? 'var(--text)' }}
              >
                {fact.value}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{fact.sub}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
