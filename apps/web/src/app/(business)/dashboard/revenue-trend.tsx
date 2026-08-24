'use client';

import { useMemo, useRef, useState } from 'react';
import { formatMoney } from '@jetnine/shared';

export interface TrendPoint {
  day: string; // YYYY-MM-DD
  totalCents: number;
  saleCount: number;
}

const W = 720;
const H = 180;
const PAD = { top: 12, right: 12, bottom: 22, left: 46 };

/**
 * 30-day revenue line. Single series (no legend — the card title names
 * it), brand-colored 2px line over a soft area fill, three recessive
 * gridlines, crosshair + tooltip on hover, and a visually-hidden table
 * so the numbers are readable without the plot.
 */
export function RevenueTrend({ points }: { points: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { path, area, xs, ys, maxY, ticks } = useMemo(() => {
    const max = Math.max(1, ...points.map((p) => p.totalCents));
    // Round the axis top up to a clean number so gridline labels are sane.
    const niceMax = niceCeil(max);
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const xs = points.map((_, i) => PAD.left + (i / Math.max(1, points.length - 1)) * innerW);
    const ys = points.map((p) => PAD.top + innerH - (p.totalCents / niceMax) * innerH);
    const path = xs
      .map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i]!.toFixed(1)}`)
      .join(' ');
    const baseline = PAD.top + innerH;
    const area = `${path} L${xs[xs.length - 1]!.toFixed(1)},${baseline} L${xs[0]!.toFixed(1)},${baseline} Z`;
    const ticks = [0.5, 1].map((f) => ({
      y: PAD.top + innerH - f * innerH,
      value: niceMax * f,
    }));
    return { path, area, xs, ys, maxY: niceMax, ticks };
  }, [points]);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    xs.forEach((x, i) => {
      const d = Math.abs(x - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover(best);
  }

  const h = hover != null ? points[hover] : null;
  const baseline = H - PAD.bottom;
  const last = points[points.length - 1];

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={`Daily revenue for the last ${points.length} days`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          data-testid="revenue-trend"
        >
          {/* Recessive grid: baseline + two gridlines with labels. */}
          <line
            x1={PAD.left}
            y1={baseline}
            x2={W - PAD.right}
            y2={baseline}
            stroke="var(--border)"
          />
          {ticks.map((t) => (
            <g key={t.y}>
              <line
                x1={PAD.left}
                y1={t.y}
                x2={W - PAD.right}
                y2={t.y}
                stroke="var(--border)"
                strokeDasharray="2 4"
              />
              <text
                x={PAD.left - 6}
                y={t.y + 3}
                textAnchor="end"
                fontSize="9.5"
                fill="var(--text-muted)"
              >
                {compactMoney(t.value)}
              </text>
            </g>
          ))}
          {/* First/last date labels only — 30 ticks would be noise. */}
          <text x={PAD.left} y={H - 6} fontSize="9.5" fill="var(--text-muted)">
            {shortDate(points[0]!.day)}
          </text>
          <text
            x={W - PAD.right}
            y={H - 6}
            fontSize="9.5"
            textAnchor="end"
            fill="var(--text-muted)"
          >
            {shortDate(last!.day)}
          </text>

          <path d={area} fill="var(--brand)" opacity="0.08" />
          <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" />

          {/* Direct label on the last point — selective, not every point. */}
          <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" fill="var(--brand)" />

          {h != null && hover != null && (
            <g pointerEvents="none">
              <line
                x1={xs[hover]}
                y1={PAD.top}
                x2={xs[hover]}
                y2={baseline}
                stroke="var(--border-strong)"
              />
              <circle
                cx={xs[hover]}
                cy={ys[hover]}
                r="4"
                fill="var(--brand)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
        {h != null && hover != null && (
          <div
            style={{
              position: 'absolute',
              left: `${(xs[hover]! / W) * 100}%`,
              top: 0,
              transform: `translateX(${hover > points.length / 2 ? '-105%' : '8px'})`,
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)',
              padding: '6px 10px',
              fontSize: 12,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{h.day}</div>
            <div style={{ fontWeight: 700 }}>{formatMoney(h.totalCents)}</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {h.saleCount} sale{h.saleCount === 1 ? '' : 's'}
            </div>
          </div>
        )}
      </div>

      {/* The same data as text, for screen readers and no-SVG contexts. */}
      <table className="sr-only">
        <caption>Daily revenue, last {points.length} days</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Revenue</th>
            <th>Sales</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{p.day}</td>
              <td>{formatMoney(p.totalCents)}</td>
              <td>{p.saleCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function niceCeil(cents: number): number {
  const pow = 10 ** Math.floor(Math.log10(cents));
  const scaled = cents / pow;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return nice * pow;
}

function compactMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(dollars >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(dollars)}`;
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
}
