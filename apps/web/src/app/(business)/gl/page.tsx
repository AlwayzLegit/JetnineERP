'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
  Select,
} from '@/components/ui';

/**
 * In-house GL slice 1 (owner 2026-08-28): chart of accounts, fiscal
 * periods with cascade close/reopen + the period-13 year latch, and
 * the trial balance. Journal entries live at /gl/journal.
 */

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  systemKey: string | null;
  isActive: boolean;
}

interface Period {
  period: number;
  status: string;
}

interface TrialRow {
  code: string;
  name: string;
  accountType: string;
  debitCents: number;
  creditCents: number;
}

const TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

export default function GlPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [periods, setPeriods] = useState<Period[]>([]);
  const [yearClosed, setYearClosed] = useState(false);
  const [trial, setTrial] = useState<{
    rows: TrialRow[];
    totals: { debitCents: number; creditCents: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newAcc, setNewAcc] = useState({ code: '', name: '', accountType: 'expense' });

  async function load() {
    try {
      setAccounts(await api<Account[]>('/v1/gl/accounts?includeInactive=true'));
      const p = await api<{ yearClosed: boolean; periods: Period[] }>(
        `/v1/gl/periods?year=${year}`,
      );
      setPeriods(p.periods);
      setYearClosed(p.yearClosed);
      setTrial(
        await api<{ rows: TrialRow[]; totals: { debitCents: number; creditCents: number } }>(
          `/v1/gl/trial-balance?year=${year}`,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !accounts) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!accounts) return <LoadingRows rows={6} />;

  return (
    <div>
      <PageHeader
        title="General ledger"
        sub="Chart of accounts · fiscal periods · trial balance"
        actions={
          <LinkButton href="/gl/journal" variant="primary">
            Journal entries
          </LinkButton>
        }
      />

      <Card
        title={`Fiscal periods ${year}${yearClosed ? ' (year closed)' : ''}`}
        style={{ marginBottom: 16 }}
      >
        <div className="flex gap-2" style={{ marginBottom: 10, alignItems: 'center' }}>
          <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </Select>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Closing a period closes all earlier open ones; reopening reopens all later closed ones.
            Period 13 (year-end adjustments) closes the year.
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {periods.map((p) => (
            <button
              key={p.period}
              type="button"
              className={`badge ${p.status === 'closed' ? 'badge-neutral' : 'badge-success'}`}
              style={{ cursor: 'pointer', border: 'none', minWidth: 44 }}
              disabled={busy}
              title={
                p.status === 'closed'
                  ? 'Click to reopen (cascades forward)'
                  : 'Click to close (cascades back)'
              }
              onClick={() => {
                const closing = p.status === 'open';
                const verb = closing ? 'Close' : 'Reopen';
                const warning = closing
                  ? 'This also closes every earlier open period.'
                  : 'This also reopens every later closed period.';
                if (!window.confirm(`${verb} ${year} period ${p.period}? ${warning}`)) return;
                void act(() =>
                  api(`/v1/gl/periods/${closing ? 'close' : 'reopen'}`, {
                    method: 'POST',
                    body: JSON.stringify({ fiscalYear: year, period: p.period }),
                  }),
                );
              }}
            >
              {p.period === 13 ? 'YE' : p.period} {p.status === 'closed' ? '✕' : ''}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Chart of accounts" style={{ marginBottom: 16 }}>
        {accounts.length === 0 ? (
          <div>
            <EmptyState>No accounts yet.</EmptyState>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() =>
                void act(() => api('/v1/gl/accounts/seed-defaults', { method: 'POST', body: '{}' }))
              }
            >
              Seed the default retail chart (20 accounts)
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>System key</th>
                  <th>Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} style={a.isActive ? undefined : { opacity: 0.5 }}>
                    <td>
                      <code>{a.code}</code>
                    </td>
                    <td>{a.name}</td>
                    <td>{a.accountType}</td>
                    <td>{a.systemKey ? <code>{a.systemKey}</code> : '—'}</td>
                    <td>{a.isActive ? 'yes' : 'no'}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void act(() =>
                            api(`/v1/gl/accounts/${a.id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ isActive: !a.isActive }),
                            }),
                          )
                        }
                      >
                        {a.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-4" style={{ marginTop: 12 }}>
          <Field label="Code">
            <Input
              value={newAcc.code}
              onChange={(e) => setNewAcc({ ...newAcc, code: e.target.value })}
              placeholder="6000"
            />
          </Field>
          <Field label="Name">
            <Input
              value={newAcc.name}
              onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })}
            />
          </Field>
          <Field label="Type">
            <Select
              value={newAcc.accountType}
              onChange={(e) => setNewAcc({ ...newAcc, accountType: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <div style={{ alignSelf: 'end' }}>
            <Button
              variant="secondary"
              disabled={busy || !newAcc.code || !newAcc.name}
              onClick={() =>
                void act(async () => {
                  await api('/v1/gl/accounts', { method: 'POST', body: JSON.stringify(newAcc) });
                  setNewAcc({ code: '', name: '', accountType: 'expense' });
                })
              }
            >
              Add account
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`Trial balance ${year}`} style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Type</th>
              <th className="num">Debits</th>
              <th className="num">Credits</th>
            </tr>
          </thead>
          <tbody>
            {(trial?.rows ?? []).length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState>No posted activity in {year}.</EmptyState>
                </td>
              </tr>
            )}
            {(trial?.rows ?? []).map((r) => (
              <tr key={r.code}>
                <td>
                  <code>{r.code}</code> {r.name}
                </td>
                <td>{r.accountType}</td>
                <td className="num">
                  <Money cents={r.debitCents} />
                </td>
                <td className="num">
                  <Money cents={r.creditCents} />
                </td>
              </tr>
            ))}
            {trial && trial.rows.length > 0 && (
              <tr style={{ fontWeight: 700 }}>
                <td colSpan={2}>Totals</td>
                <td className="num">
                  <Money cents={trial.totals.debitCents} />
                </td>
                <td className="num">
                  <Money cents={trial.totals.creditCents} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
        <Link href="/gl/journal">Journal entries →</Link> Posted batches are append-only; correct
        with a new batch, never an edit.
      </p>
    </div>
  );
}
