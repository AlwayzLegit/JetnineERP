'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Card, EmptyState, LoadingRows, PageHeader, Select } from '@/components/ui';

/**
 * F277-lean account drill-down: per-period totals for the year, then
 * the posted lines behind them with the batch each line came from.
 */

interface Activity {
  account: { id: string; code: string; name: string; accountType: string };
  fiscalYear: number;
  byPeriod: { period: number; debitCents: number; creditCents: number }[];
  lines: {
    batchId: string;
    batchNumber: string;
    batchType: string;
    sourceType: string | null;
    businessDate: string;
    period: number;
    memo: string | null;
    debitCents: number;
    creditCents: number;
  }[];
}

export default function GlAccountActivityPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    api<Activity>(`/v1/gl/accounts/${id}/activity?year=${year}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [id, year]);

  if (error && !data) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!data) return <LoadingRows rows={6} />;

  const lines = periodFilter ? data.lines.filter((l) => l.period === periodFilter) : data.lines;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/gl">← General ledger</Link>
      </p>
      <PageHeader
        title={
          <>
            <code>{data.account.code}</code> {data.account.name}
          </>
        }
        sub={`${data.account.accountType} · fiscal ${data.fiscalYear}`}
        actions={
          <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </Select>
        }
      />

      <Card title="By period (click to filter the lines)" style={{ marginBottom: 16, padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Period</th>
              <th className="num">Debits</th>
              <th className="num">Credits</th>
              <th className="num">Net</th>
            </tr>
          </thead>
          <tbody>
            {data.byPeriod.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState>No posted activity in {data.fiscalYear}.</EmptyState>
                </td>
              </tr>
            )}
            {data.byPeriod.map((p) => (
              <tr
                key={p.period}
                style={{
                  cursor: 'pointer',
                  background: periodFilter === p.period ? 'var(--bg-secondary)' : undefined,
                }}
                onClick={() => setPeriodFilter(periodFilter === p.period ? null : p.period)}
              >
                <td>{p.period === 13 ? 'Year-end' : p.period}</td>
                <td className="num">
                  <Money cents={p.debitCents} />
                </td>
                <td className="num">
                  <Money cents={p.creditCents} />
                </td>
                <td className="num">
                  <Money cents={p.debitCents - p.creditCents} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card
        title={`Posted lines${periodFilter ? ` — period ${periodFilter}` : ''} (${lines.length})`}
        style={{ padding: 0, overflowX: 'auto' }}
      >
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Batch</th>
              <th>Type</th>
              <th>Memo</th>
              <th className="num">Debit</th>
              <th className="num">Credit</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState>No lines.</EmptyState>
                </td>
              </tr>
            )}
            {lines.map((l, i) => (
              <tr key={`${l.batchId}-${i}`}>
                <td>{l.businessDate}</td>
                <td>
                  <code>{l.batchNumber}</code>
                </td>
                <td>{l.sourceType ?? l.batchType}</td>
                <td>{l.memo ?? '—'}</td>
                <td className="num">{l.debitCents > 0 ? <Money cents={l.debitCents} /> : '—'}</td>
                <td className="num">{l.creditCents > 0 ? <Money cents={l.creditCents} /> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
