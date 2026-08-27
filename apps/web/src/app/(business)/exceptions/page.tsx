'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { LoadMore } from '@/components/load-more';
import { useCursorList } from '@/lib/use-cursor-list';
import {
  Button,
  Card,
  EmptyState,
  LoadingRows,
  PageHeader,
  Select,
  StatusBadge,
} from '@/components/ui';

/**
 * Exception register (PLAN-STORIS-GAP §0.3): overrides, unlocks,
 * over-capacity bookings, write-offs — severity-tagged and
 * acknowledge-able, so nothing gets scrolled past. The ranked digest
 * (§2) is the per-associate outlier report the owner reads weekly.
 */

interface ExceptionRow {
  id: string;
  type: string;
  severity: string;
  actorEmail: string | null;
  summary: string;
  acknowledgedAt: string | null;
  acknowledgedByEmail: string | null;
  createdAt: string;
}

interface DigestRow {
  actorUserId: string | null;
  actorEmail: string | null;
  total: number;
  byType: Record<string, number>;
}

const TYPE_LABELS: Record<string, string> = {
  security_override: 'Security override',
  order_unlock: 'Order unlock',
  delivery_cap_override: 'Over-capacity booking',
  write_off: 'Write-off',
  vendor_credit_write_off: 'Vendor credit given up',
};

export default function ExceptionsPage() {
  const [openOnly, setOpenOnly] = useState(true);
  const [severity, setSeverity] = useState('');
  const list = useCursorList<ExceptionRow>('/v1/exceptions');
  const [digest, setDigest] = useState<DigestRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const { rows, error } = list;

  const load = useCallback(async () => {
    await list.load({
      ...(openOnly ? { open: '1' } : {}),
      ...(severity ? { severity } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openOnly, severity]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    api<DigestRow[]>('/v1/exceptions/digest?days=7')
      .then(setDigest)
      .catch(() => setDigest([]));
  }, []);

  async function ack(id: string) {
    setBusy(true);
    try {
      await api(`/v1/exceptions/${id}/ack`, { method: 'POST' });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Exception register"
        sub="Overrides, unlocks, over-capacity bookings, write-offs. Acknowledge what you've seen."
        actions={
          <span className="flex items-center gap-2">
            <Select
              value={openOnly ? '1' : ''}
              onChange={(e) => setOpenOnly(e.target.value === '1')}
              style={{ width: 150 }}
            >
              <option value="1">Unacknowledged</option>
              <option value="">All</option>
            </Select>
            <Select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={{ width: 130 }}
            >
              <option value="">Any severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </Select>
          </span>
        }
      />

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          {!rows && !error && <LoadingRows rows={4} />}
          {rows && rows.length === 0 && <EmptyState>Nothing waiting. Good.</EmptyState>}
          {rows && rows.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" data-testid="exceptions-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Type</th>
                      <th>Who</th>
                      <th>What</th>
                      <th>Severity</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} data-testid="exception-row">
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td>{TYPE_LABELS[r.type] ?? r.type.replace(/_/g, ' ')}</td>
                        <td>{r.actorEmail ?? 'system'}</td>
                        <td>{r.summary}</td>
                        <td>
                          <StatusBadge status={r.severity} />
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {r.acknowledgedAt ? (
                            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                              ack&apos;d by {r.acknowledgedByEmail ?? '—'}
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              data-testid="ack-exception"
                              onClick={() => void ack(r.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <LoadMore state={list} noun="exceptions" />
            </div>
          )}
        </div>

        <Card title="Last 7 days — by associate (ranked)">
          {!digest && <LoadingRows rows={3} />}
          {digest && digest.length === 0 && (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              No exceptions this week.
            </p>
          )}
          {digest && digest.length > 0 && (
            <table className="table" data-testid="exceptions-digest">
              <thead>
                <tr>
                  <th>Associate</th>
                  <th className="num">Total</th>
                  <th>Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {digest.map((d) => (
                  <tr key={d.actorUserId ?? 'system'}>
                    <td>{d.actorEmail ?? 'system'}</td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {d.total}
                    </td>
                    <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      {Object.entries(d.byType)
                        .map(([t, n]) => `${TYPE_LABELS[t] ?? t.replace(/_/g, ' ')} ×${n}`)
                        .join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
