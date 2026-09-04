'use client';

import { useMemo, useState } from 'react';
import { pctDelta, shortDay, usdWhole } from './owner-kit';

/**
 * The written-business chart from the design: stacked bars (orders in
 * the accent, register in the border tone) per day, a dashed
 * comparison line, a dark tooltip on hover, and three stats above.
 * Windows longer than 60 days bucket into ~60 groups so the bars stay
 * readable.
 */
export interface TrendPoint {
  day: string;
  orderCents: number;
  registerCents: number;
}

interface Bucket {
  label: string;
  first: string;
  last: string;
  ord: number;
  reg: number;
}

function bucketize(points: TrendPoint[]): Bucket[] {
  const size = points.length > 60 ? Math.ceil(points.length / 60) : 1;
  const out: Bucket[] = [];
  for (let i = 0; i < points.length; i += size) {
    const g = points.slice(i, i + size);
    const first = g[0]!.day;
    const last = g[g.length - 1]!.day;
    out.push({
      first,
      last,
      label: size > 1 ? `${shortDay(first)} – ${shortDay(last)}` : shortDay(first),
      ord: g.reduce((s, p) => s + p.orderCents, 0),
      reg: g.reduce((s, p) => s + p.registerCents, 0),
    });
  }
  return out;
}

export function WrittenBusinessChart({
  points,
  compare,
  compareLabel,
  loading,
  error,
  empty,
}: {
  points: TrendPoint[];
  compare: TrendPoint[];
  compareLabel: string | null;
  loading: boolean;
  error: boolean;
  empty: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const cur = useMemo(() => bucketize(points), [points]);
  const prev = useMemo(() => bucketize(compare), [compare]);
  const bucketed = points.length > 60;
  const max = Math.max(1, ...cur.map((b) => b.ord + b.reg), ...prev.map((b) => b.ord + b.reg));
  const total = cur.reduce((s, b) => s + b.ord + b.reg, 0);
  const prevTotal = prev.reduce((s, b) => s + b.ord + b.reg, 0);
  const best = Math.max(0, ...cur.map((b) => b.ord + b.reg));
  const days = Math.max(1, points.length);
  const prevDays = Math.max(1, compare.length);
  const hasCompare = !!compareLabel && prev.length > 0 && !loading && !error;
  const h = hover != null ? cur[hover] : undefined;
  const hc = hover != null ? prev[hover] : undefined;

  const stats: { label: string; value: string; delta: string | null; up: boolean }[] = error
    ? [
        { label: 'Total written', value: '—', delta: null, up: true },
        { label: 'Daily avg', value: '—', delta: null, up: true },
        { label: bucketed ? 'Best week' : 'Best day', value: '—', delta: null, up: true },
      ]
    : [
        {
          label: 'Total written',
          value: usdWhole(total),
          delta: hasCompare ? pctDelta(total, prevTotal) : null,
          up: total >= prevTotal,
        },
        {
          label: 'Daily avg',
          value: usdWhole(total / days),
          delta: hasCompare ? pctDelta(total / days, prevTotal / prevDays) : null,
          up: total / days >= prevTotal / prevDays,
        },
        {
          label: bucketed ? 'Best week' : 'Best day',
          value: usdWhole(best),
          delta: null,
          up: true,
        },
      ];

  const mid = cur[Math.floor(cur.length / 2)];
  return (
    <>
      <div
        style={{
          padding: 'var(--pad)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, auto) 1fr',
          gap: 28,
          alignItems: 'baseline',
        }}
      >
        {stats.map((s) => (
          <div key={s.label}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
            {loading ? (
              <div className="shimmer" style={{ height: 20, width: 90, marginTop: 4 }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="mono" style={{ fontSize: 20, fontWeight: 500 }}>
                  {s.value}
                </span>
                {s.delta && (
                  <span
                    className="mono"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: s.up ? 'var(--accent-ink)' : 'var(--danger)',
                    }}
                  >
                    {s.delta}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          padding: '0 var(--pad) var(--pad)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          onMouseLeave={() => setHover(null)}
          data-testid="revenue-trend"
          role="img"
          aria-label={`Written business by ${bucketed ? 'week' : 'day'}`}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            gap: cur.length > 40 ? 1 : 3,
            height: 150,
            borderBottom: '1px solid var(--border)',
          }}
        >
          {loading &&
            Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className="shimmer"
                style={{ flex: 1, height: `${35 + ((i * 37) % 55)}%`, borderRadius: '2px 2px 0 0' }}
              />
            ))}
          {!loading && (error || empty) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--muted)',
                fontSize: 12.5,
              }}
            >
              {error
                ? 'Sales data unavailable — showing nothing rather than stale bars.'
                : 'No business written in this period.'}
            </div>
          )}
          {!loading &&
            !error &&
            cur.map((b, i) => {
              const c = prev[i];
              return (
                <div
                  key={b.first}
                  onMouseEnter={() => setHover(i)}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    borderRadius: 2,
                    background: hover === i ? 'var(--surface2)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '2px 2px 0 0',
                      background: 'var(--border2)',
                      height: `${Math.round((b.reg / max) * 100)}%`,
                    }}
                  />
                  <div
                    style={{
                      width: '100%',
                      background: 'var(--accent)',
                      height: `${Math.round((b.ord / max) * 100)}%`,
                      marginTop: 1,
                    }}
                  />
                  {hasCompare && c && (
                    <div
                      style={{
                        position: 'absolute',
                        left: -1,
                        right: -1,
                        bottom: `${Math.round(((c.ord + c.reg) / max) * 100)}%`,
                        borderTop: '2px dashed var(--warn)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </div>
              );
            })}
          {h && hover != null && (
            <div
              style={{
                position: 'absolute',
                left: `${((hover + 0.5) / cur.length) * 100}%`,
                bottom: `${Math.round(((h.ord + h.reg) / max) * 100)}%`,
                transform: `translateX(${hover < cur.length / 4 ? '0%' : hover > (cur.length * 3) / 4 ? '-100%' : '-50%'})`,
                zIndex: 5,
                pointerEvents: 'none',
                background: 'var(--text)',
                color: 'var(--bg)',
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 11.5,
                boxShadow: 'var(--shadow)',
                minWidth: 170,
                animation: 'fadeIn .1s ease',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.label}</div>
              <div
                className="mono"
                style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2px 14px' }}
              >
                <span style={{ opacity: 0.7 }}>Orders</span>
                <span>{usdWhole(h.ord)}</span>
                <span style={{ opacity: 0.7 }}>Register</span>
                <span>{usdWhole(h.reg)}</span>
                <span style={{ opacity: 0.7 }}>Total</span>
                <span style={{ fontWeight: 600 }}>{usdWhole(h.ord + h.reg)}</span>
                {hasCompare && (
                  <>
                    <span style={{ opacity: 0.7 }}>{compareLabel}</span>
                    <span
                      style={{
                        color:
                          hc && h.ord + h.reg >= hc.ord + hc.reg
                            ? 'var(--accent)'
                            : 'var(--danger)',
                      }}
                    >
                      {hc
                        ? `${usdWhole(hc.ord + hc.reg)} (${pctDelta(h.ord + h.reg, hc.ord + hc.reg) ?? '—'})`
                        : '—'}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div
          className="mono"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--muted)',
          }}
        >
          <span>{cur[0] ? shortDay(cur[0].first) : ''}</span>
          <span>{mid ? shortDay(mid.first) : ''}</span>
          <span>{cur.length ? shortDay(cur[cur.length - 1]!.last) : ''}</span>
        </div>
      </div>
    </>
  );
}
