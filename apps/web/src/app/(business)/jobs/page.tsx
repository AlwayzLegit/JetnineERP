'use client';

import { useEffect, useState } from 'react';
import { MoonStar, Play } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button, Card, EmptyState, Input, LoadingRows, PageHeader } from '@/components/ui';

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
      toast.success(
        `Ran ${res.results.length} step(s) for ${res.businessDate} — ${res.results.filter((r) => r.status === 'succeeded').length} succeeded`,
      );
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
        sub="Every step declared, every run logged. Re-running is always safe — completed steps never repeat."
      />

      <Card title="Registered steps" style={{ marginBottom: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Order</th>
              <th>Step</th>
              <th>What it does</th>
              <th>Destructive</th>
            </tr>
          </thead>
          <tbody>
            {registry.map((j) => (
              <tr key={j.id}>
                <td>{j.order}</td>
                <td>
                  <strong>{j.name}</strong>
                  {j.dependsOn.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      after {j.dependsOn.map(jobName).join(', ')}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: 12.5 }}>{j.description}</td>
                <td>
                  <span className={`badge ${j.destructive ? 'badge-danger' : 'badge-success'}`}>
                    {j.destructive ? 'yes' : 'no'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block' }}>
              Business date (blank = yesterday)
            </label>
            <Input
              type="date"
              value={runDate}
              onChange={(e) => setRunDate(e.target.value)}
              style={{ width: 160 }}
            />
          </div>
          <Button variant="primary" onClick={() => void runNow()} disabled={busy}>
            <Play size={14} />
            {busy ? 'Running…' : 'Run now'}
          </Button>
        </div>
      </Card>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card title="Run report" style={{ padding: 0 }}>
        {runs == null ? (
          <div style={{ padding: 16 }}>
            <LoadingRows />
          </div>
        ) : runs.length === 0 ? (
          <EmptyState>
            <MoonStar size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
            No runs yet — the batch fires automatically overnight, or run it now above.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
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
                    <td>{r.businessDate}</td>
                    <td>{jobName(r.jobId)}</td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === 'succeeded'
                            ? 'badge-success'
                            : r.status === 'failed'
                              ? 'badge-danger'
                              : 'badge-neutral'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="num">{r.recordsAffected}</td>
                    <td className="num">{r.durationMs != null ? `${r.durationMs}ms` : '—'}</td>
                    <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      {r.error ?? r.detailJson ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
