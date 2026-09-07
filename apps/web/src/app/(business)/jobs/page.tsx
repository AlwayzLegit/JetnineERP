'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MoonStar, Play } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  FormActions,
  FormGrid,
  Input,
  LoadingRows,
  PageHeader,
  Stack,
  StatusBadge,
  TableEmpty,
  TableWrap,
} from '@/components/ui';

interface JobDef {
  id: string;
  name: string;
  description: string;
  order: number;
  dependsOn: string[];
  destructive: boolean;
}

interface JobRun {
  id: string;
  jobId: string;
  businessDate: string;
  status: string;
  startedAt: string;
  durationMs: number | null;
  recordsAffected: number;
  detailJson: string | null;
  error: string | null;
  summary: string;
  actionHref?: string;
  actionLabel?: string;
}

/**
 * The nightly batch, made visible (sysadmin pack JOB-002): the declared
 * step list, the morning run report, and a safe re-run — the opposite
 * of STORIS's 48 undeclared steps.
 */
export default function JobsPage() {
  const [registry, setRegistry] = useState<JobDef[]>([]);
  const [runs, setRuns] = useState<JobRun[] | null>(null);
  const [runDate, setRunDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      setRegistry(await api<JobDef[]>('/v1/jobs'));
      setRuns(await api<JobRun[]>('/v1/jobs/runs'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function runNow() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api<{ businessDate: string; results: { jobId: string; status: string }[] }>(
        '/v1/jobs/run',
        { method: 'POST', body: JSON.stringify(runDate ? { businessDate: runDate } : {}) },
      );
      const attention = res.results.filter((r) =>
        ['failed', 'blocked', 'partial', 'skipped'].includes(r.status),
      ).length;
      const disabled = res.results.filter((r) => r.status === 'disabled').length;
      const message = `${res.businessDate}: ${attention} step(s) need attention, ${disabled} disabled. See the run report below.`;
      if (attention) toast.warning(message);
      else toast.success(message);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const jobName = (id: string) => registry.find((j) => j.id === id)?.name ?? id;

  return (
    <div>
      <PageHeader
        title="Nightly jobs"
        sub="Review overnight work, resolve blocked steps, and track what still needs attention."
      />

      <Stack>
        {error && <Alert tone="error">{error}</Alert>}

        <Card title="Registered steps" flush>
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th className="num">Order</th>
                  <th>Step</th>
                  <th>What it does</th>
                  <th>Destructive</th>
                </tr>
              </thead>
              <tbody>
                {registry.length === 0 && <TableEmpty colSpan={4}>No steps registered.</TableEmpty>}
                {registry.map((j) => (
                  <tr key={j.id}>
                    <td className="num">{j.order}</td>
                    <td>
                      <strong>{j.name}</strong>
                      {j.dependsOn.length > 0 && (
                        <div className="muted">after {j.dependsOn.map(jobName).join(', ')}</div>
                      )}
                    </td>
                    <td>{j.description}</td>
                    <td>
                      <span className={`badge ${j.destructive ? 'badge-danger' : 'badge-success'}`}>
                        {j.destructive ? 'yes' : 'no'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <Card
          title="Run the batch"
          description="Completed steps are skipped. Blocked accounting groups can resume after setup is corrected; failed scheduled reports must be run individually."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runNow();
            }}
          >
            <FormGrid cols={3}>
              <Field label="Business date" hint="Blank = yesterday">
                <Input type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} />
              </Field>
            </FormGrid>
            <FormActions>
              <Button type="submit" variant="primary" disabled={busy}>
                <Play size={14} />
                {busy ? 'Running…' : 'Run now'}
              </Button>
            </FormActions>
          </form>
        </Card>

        <Card title="Run report" flush>
          {runs == null ? (
            <div className="p-4">
              <LoadingRows />
            </div>
          ) : runs.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title={
                  <>
                    <MoonStar size={16} className="mr-1.5 inline-block align-text-bottom" />
                    No runs yet
                  </>
                }
              >
                The batch fires automatically overnight, or run it now above.
              </EmptyState>
            </div>
          ) : (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Business date</th>
                    <th>Step</th>
                    <th>Status</th>
                    <th className="num">Records</th>
                    <th className="num">Duration</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td className="nowrap">{r.businessDate}</td>
                      <td>{jobName(r.jobId)}</td>
                      <td>
                        {r.status === 'disabled' ? (
                          <span className="badge badge-neutral">disabled</span>
                        ) : (
                          <StatusBadge status={r.status} />
                        )}
                      </td>
                      <td className="num">{r.recordsAffected}</td>
                      <td className="num">{r.durationMs != null ? `${r.durationMs}ms` : '—'}</td>
                      <td>
                        <div>{r.summary ?? r.error ?? 'Review the run details.'}</div>
                        {r.actionHref && (
                          <Link href={r.actionHref} className="link">
                            {r.actionLabel}
                          </Link>
                        )}
                        {r.detailJson && (
                          <details className="mt-2 muted">
                            <summary className="cursor-pointer">Technical details</summary>
                            <pre className="mt-1 whitespace-pre-wrap break-all text-xs">
                              {r.detailJson}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </Stack>
    </div>
  );
}
