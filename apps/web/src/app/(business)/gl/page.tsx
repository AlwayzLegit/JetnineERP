'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  FormActions,
  FormGrid,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
  SectionHeading,
  Select,
  Stack,
  StatusBadge,
  TableEmpty,
  TableWrap,
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

  if (error && !accounts) {
    return (
      <div>
        <PageHeader title="General ledger" />
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }
  if (!accounts) return <LoadingRows rows={6} />;

  const yearOptions = [year - 1, year, year + 1].filter((v, i, a) => a.indexOf(v) === i);
  const trialRows = trial?.rows ?? [];

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

      <Stack>
        <Card
          title={`Fiscal periods ${year}${yearClosed ? ' (year closed)' : ''}`}
          description="Closing a period closes all earlier open ones; reopening reopens all later closed ones. Period 13 (year-end adjustments) closes the year."
          actions={
            <Select
              aria-label="Fiscal year"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          }
        >
          {periods.length === 0 ? (
            <p className="muted">No fiscal periods for {year}.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {periods.map((p) => {
                const closed = p.status === 'closed';
                return (
                  <button
                    key={p.period}
                    type="button"
                    className={`pill ${closed ? '' : 'pill-active'}`}
                    aria-pressed={!closed}
                    disabled={busy}
                    title={
                      closed
                        ? 'Click to reopen (cascades forward)'
                        : 'Click to close (cascades back)'
                    }
                    onClick={() => {
                      const closing = !closed;
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
                    {p.period === 13 ? 'YE' : p.period} {closed ? '✕' : ''}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Chart of accounts">
          {accounts.length === 0 ? (
            <EmptyState
              title="No accounts yet"
              action={
                <Button
                  variant="primary"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    void act(() =>
                      api('/v1/gl/accounts/seed-defaults', { method: 'POST', body: '{}' }),
                    )
                  }
                >
                  Seed the default retail chart (20 accounts)
                </Button>
              }
            >
              Seed the default chart or add accounts one at a time below.
            </EmptyState>
          ) : (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>System key</th>
                    <th>Active</th>
                    <th className="actions" />
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} style={a.isActive ? undefined : { opacity: 0.5 }}>
                      <td>
                        <Link href={`/gl/accounts/${a.id}`}>
                          <code>{a.code}</code>
                        </Link>
                      </td>
                      <td>{a.name}</td>
                      <td>{a.accountType}</td>
                      <td>{a.systemKey ? <code>{a.systemKey}</code> : '—'}</td>
                      <td>
                        <StatusBadge status={a.isActive ? 'active' : 'inactive'} />
                      </td>
                      <td className="actions">
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
            </TableWrap>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (busy || !newAcc.code || !newAcc.name) return;
              void act(async () => {
                await api('/v1/gl/accounts', { method: 'POST', body: JSON.stringify(newAcc) });
                setNewAcc({ code: '', name: '', accountType: 'expense' });
              });
            }}
          >
            <SectionHeading as="h3" title="Add account" />
            <FormGrid cols={3}>
              <Field label="Code" required>
                <Input
                  value={newAcc.code}
                  onChange={(e) => setNewAcc({ ...newAcc, code: e.target.value })}
                  placeholder="6000"
                />
              </Field>
              <Field label="Name" required>
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
            </FormGrid>
            <FormActions>
              <Button
                type="submit"
                variant="primary"
                disabled={busy || !newAcc.code || !newAcc.name}
              >
                Add account
              </Button>
            </FormActions>
          </form>
        </Card>

        <Card
          title={`Trial balance ${year}`}
          description="Posted batches are append-only; correct with a new batch, never an edit."
          actions={
            <LinkButton size="sm" variant="secondary" href="/gl/journal">
              Journal entries →
            </LinkButton>
          }
          flush
        >
          <TableWrap>
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
                {trialRows.length === 0 && (
                  <TableEmpty colSpan={4}>No posted activity in {year}.</TableEmpty>
                )}
                {trialRows.map((r) => (
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
              </tbody>
              {trial && trial.rows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={2}>
                      <strong>Totals</strong>
                    </td>
                    <td className="num">
                      <strong>
                        <Money cents={trial.totals.debitCents} />
                      </strong>
                    </td>
                    <td className="num">
                      <strong>
                        <Money cents={trial.totals.creditCents} />
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </TableWrap>
        </Card>
      </Stack>
    </div>
  );
}
