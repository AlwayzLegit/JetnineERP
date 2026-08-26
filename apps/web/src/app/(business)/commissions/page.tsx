'use client';

import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatMoney } from '@jetnine/shared';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  StatusBadge,
} from '@/components/ui';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

interface ReportRow {
  membershipId: string;
  salesperson: string;
  totalCents: number;
  pendingCents: number;
  entries: number;
}
interface Report {
  period: string;
  bySalesperson: ReportRow[];
}
interface StatementEntry {
  id: string;
  documentNumber: string | null;
  basisCents: number;
  amountCents: number;
  rateBps: number;
  status: string;
  accruedAt: string;
  notes: string | null;
}
interface Statement {
  period: string;
  membershipId: string;
  salesperson: string;
  entries: StatementEntry[];
  totals: {
    accruedCents: number;
    reversalCents: number;
    netCents: number;
    pendingCents: number;
    approvedCents: number;
    paidCents: number;
  };
}

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * The payroll view: monthly totals per associate, and a per-associate
 * statement that prints as the payroll-day paper trail. Approve/paid
 * actions require commissions.manage (buttons fail with a toast for
 * roles without it).
 */
export default function CommissionsPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [report, setReport] = useState<Report | null>(null);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(p: string) {
    setStatement(null);
    try {
      setReport(await api<Report>(`/v1/commissions/report?period=${p}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openStatement(membershipId: string) {
    try {
      setStatement(
        await api<Statement>(
          `/v1/commissions/statement?period=${period}&membershipId=${membershipId}`,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function setStatus(status: 'approved' | 'paid') {
    if (!statement) return;
    const from = status === 'approved' ? 'pending' : 'approved';
    const ids = statement.entries.filter((e) => e.status === from).map((e) => e.id);
    if (ids.length === 0) {
      toast.info(`Nothing ${from} to mark ${status}.`);
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ updated: number }>('/v1/commissions/entries/set-status', {
        method: 'POST',
        body: JSON.stringify({ entryIds: ids, status }),
      });
      toast.success(`${res.updated} entr${res.updated === 1 ? 'y' : 'ies'} marked ${status}`);
      await openStatement(statement.membershipId);
      await load(period);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Commissions"
        sub="Monthly accruals per associate. Open a statement for the payroll-day paper trail."
      />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <Card title="Period" className="no-print">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Payroll month">
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              data-testid="commission-period"
            />
          </Field>
          <Button variant="primary" onClick={() => void load(period)}>
            Load
          </Button>
        </div>
      </Card>

      <Card title="By associate" className="no-print">
        {report == null ? (
          <LoadingRows />
        ) : report.bySalesperson.length === 0 ? (
          <EmptyState>No commission entries for {period}.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Associate</th>
                  <th className="num">Entries</th>
                  <th className="num">Pending</th>
                  <th className="num">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {report.bySalesperson.map((r) => (
                  <tr key={r.membershipId}>
                    <td>{r.salesperson}</td>
                    <td className="num">{r.entries}</td>
                    <td className="num">
                      <Money cents={r.pendingCents} />
                    </td>
                    <td className="num">
                      <strong>
                        <Money cents={r.totalCents} />
                      </strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        size="sm"
                        onClick={() => void openStatement(r.membershipId)}
                        data-testid={`statement-${r.salesperson}`}
                      >
                        Statement
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {statement && (
        <Card
          title={`Statement — ${statement.salesperson} · ${statement.period}`}
          actions={
            <span className="no-print" style={{ display: 'inline-flex', gap: 8 }}>
              <Button size="sm" disabled={busy} onClick={() => void setStatus('approved')}>
                Approve pending
              </Button>
              <Button size="sm" disabled={busy} onClick={() => void setStatus('paid')}>
                Mark approved paid
              </Button>
              <Button size="sm" variant="secondary" onClick={() => window.print()}>
                <Printer size={13} aria-hidden /> Print
              </Button>
            </span>
          }
          data-testid="commission-statement"
        >
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MiniTotal label="Accrued" cents={statement.totals.accruedCents} />
            <MiniTotal label="Reversals" cents={statement.totals.reversalCents} tone="danger" />
            <MiniTotal label="Net" cents={statement.totals.netCents} strong />
            <MiniTotal label="Pending" cents={statement.totals.pendingCents} />
            <MiniTotal label="Approved" cents={statement.totals.approvedCents} />
            <MiniTotal label="Paid" cents={statement.totals.paidCents} />
          </div>
          {statement.entries.length === 0 ? (
            <EmptyState>No entries this period.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Document</th>
                    <th className="num">Basis</th>
                    <th className="num">Rate</th>
                    <th className="num">Commission</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.entries.map((e) => (
                    <tr key={e.id}>
                      <td>{new Date(e.accruedAt).toLocaleDateString()}</td>
                      <td>
                        <code>{e.documentNumber ?? '—'}</code>
                        {e.notes && (
                          <span className="muted" style={{ display: 'block', fontSize: 11.5 }}>
                            {e.notes}
                          </span>
                        )}
                      </td>
                      <td className="num">
                        <Money cents={e.basisCents} />
                      </td>
                      <td className="num">{(e.rateBps / 100).toFixed(2)}%</td>
                      <td
                        className="num"
                        style={{ color: e.amountCents < 0 ? 'var(--danger)' : undefined }}
                      >
                        <strong>{formatMoney(e.amountCents)}</strong>
                      </td>
                      <td>
                        <StatusBadge status={e.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function MiniTotal({
  label,
  cents,
  strong,
  tone,
}: {
  label: string;
  cents: number;
  strong?: boolean;
  tone?: 'danger';
}) {
  return (
    <div
      style={{
        background: 'var(--surface-muted)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 10px',
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: strong ? 700 : 600,
          color: tone === 'danger' && cents !== 0 ? 'var(--danger)' : 'var(--text)',
        }}
      >
        {formatMoney(cents)}
      </div>
      <CommissionPlansCard />
    </div>
  );
}

/**
 * Commission plans + who is on them.
 *
 * The API has had plan CRUD and assignment since G5, but nothing in the
 * app ever exposed it — so no member had a plan, `planFor()` returned
 * null for everyone, and commissions silently never accrued at all
 * ("No commission entries", QA 2026-08-26 D7). Accrual works; it just
 * had no way to be switched on.
 */
function CommissionPlansCard() {
  interface Plan {
    id: string;
    name: string;
    basis: string;
    rateBps: number;
  }
  interface Member {
    membershipId: string;
    email: string;
    name: string | null;
    commissionPlanId?: string | null;
  }
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [basis, setBasis] = useState('percent_of_sale');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setPlans(await api<Plan[]>('/v1/commission-plans'));
    } catch {
      setPlans([]);
    }
    try {
      setMembers(await api<Member[]>('/v1/business/members'));
    } catch {
      setMembers([]);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function createPlan() {
    const pct = Number(rate);
    if (!name.trim() || !Number.isFinite(pct) || pct <= 0) {
      toast.error('Name and a rate above 0 are required.');
      return;
    }
    setBusy(true);
    try {
      await api('/v1/commission-plans', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), basis, rateBps: Math.round(pct * 100) }),
      });
      setName('');
      setRate('');
      toast.success('Plan created. Assign it to a salesperson to start accruing.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function assign(membershipId: string, planId: string) {
    setBusy(true);
    try {
      await api('/v1/commission-plans/assign', {
        method: 'POST',
        body: JSON.stringify({ membershipId, planId: planId || null }),
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Commission plans" style={{ marginTop: 16 }}>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>
        Commission accrues at completion only for salespeople who are on a plan. Nobody on a plan
        means nothing accrues.
      </p>
      {plans === null ? (
        <LoadingRows rows={2} />
      ) : plans.length === 0 ? (
        <EmptyState>No plans yet — create one below.</EmptyState>
      ) : (
        <table className="table" data-testid="commission-plans-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Basis</th>
              <th className="num">Rate</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.basis === 'percent_of_margin' ? 'of margin' : 'of sale'}</td>
                <td className="num">{(p.rateBps / 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex flex-wrap items-end gap-2" style={{ fontSize: 13, marginTop: 10 }}>
        <label style={{ display: 'grid', gap: 2, fontSize: 12, minWidth: 0 }}>
          Plan name
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Flat 5%"
            data-testid="plan-name"
            style={{ minWidth: 0 }}
          />
        </label>
        <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
          Rate (%)
          <Input
            type="number"
            step="0.01"
            min={0}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            data-testid="plan-rate"
            style={{ width: 90 }}
          />
        </label>
        <label style={{ display: 'grid', gap: 2, fontSize: 12 }}>
          Basis
          <select className="select" value={basis} onChange={(e) => setBasis(e.target.value)}>
            <option value="percent_of_sale">Percent of sale</option>
            <option value="percent_of_margin">Percent of margin</option>
          </select>
        </label>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => void createPlan()}
          data-testid="create-plan"
        >
          Add plan
        </Button>
      </div>

      {members.length > 0 && (plans?.length ?? 0) > 0 && (
        <>
          <h4 style={{ margin: '14px 0 6px', fontSize: 12.5 }}>Who is on a plan</h4>
          <table className="table" data-testid="plan-assignments">
            <tbody>
              {members.map((m) => (
                <tr key={m.membershipId}>
                  <td>{m.name ?? m.email}</td>
                  <td>
                    <select
                      className="select"
                      value={m.commissionPlanId ?? ''}
                      disabled={busy}
                      onChange={(e) => void assign(m.membershipId, e.target.value)}
                    >
                      <option value="">Not on commission</option>
                      {plans!.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Card>
  );
}
