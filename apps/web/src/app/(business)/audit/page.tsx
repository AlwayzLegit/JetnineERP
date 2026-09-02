'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card, EmptyState, Field, Input, LoadingRows, PageHeader } from '@/components/ui';
import { DateRangePicker, useUrlDateRange } from '@/components/date-range-picker';
import { useSession } from '@/lib/auth-client';
import { api, apiUrl } from '@/lib/api';
import { addDays, type DateRange } from '@/lib/date-range';

interface AuditLogRow {
  id: string;
  action: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorType: string;
  targetType: string | null;
  targetId: string | null;
  changesJson: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface Filters {
  action: string;
  actorUserId: string;
}

/**
 * Query params for /v1/audit-logs. The API treats `until` as EXCLUSIVE,
 * so an inclusive picker range `[start, end]` becomes
 * `since=start&until=end+1 day`; "All time" sends neither bound.
 */
function auditParams(filters: Filters, range: DateRange): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.action) params.set('action', filters.action);
  if (filters.actorUserId) params.set('actorUserId', filters.actorUserId);
  if (range.preset !== 'all') {
    params.set('since', range.start);
    params.set('until', addDays(range.end, 1));
  }
  return params;
}

export default function AuditLogPage() {
  const session = useSession();
  const [filters, setFilters] = useState<Filters>({ action: '', actorUserId: '' });
  // Page-level window (?range= / ?start=&end=); "All time" restores the
  // unbounded stream the page had before the picker.
  const [range, setRange, rangeReady] = useUrlDateRange('last30');
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchRows(currentFilters: Filters, currentRange: DateRange): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const params = auditParams(currentFilters, currentRange);
      // Uses the shared api() helper like every other page: this one
      // hand-rolled fetch against its own NEXT_PUBLIC_API_URL default,
      // so in production it called http://localhost:4000 and the global
      // audit log was permanently "Failed to fetch" (QA 2026-08-26, D8).
      const body = await api<{ data: AuditLogRow[]; nextCursor: string | null }>(
        `/v1/audit-logs?${params.toString()}`,
      );
      setRows(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Wait for the URL window to be read so we don't fetch twice.
    if (session.data && rangeReady) void fetchRows(filters, range);
    // We refetch on session change and when the picker applies a new
    // window, not on every keystroke; the form submit calls fetchRows
    // explicitly with the current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.data?.user.id, rangeReady, range]);

  if (session.isPending)
    return (
      <Wrapper>
        <LoadingRows />
      </Wrapper>
    );
  if (!session.data)
    return (
      <Wrapper>
        <p style={{ color: 'var(--text-secondary)' }}>Sign in required.</p>
      </Wrapper>
    );

  const exportHref = (() => {
    const qs = auditParams(filters, range).toString();
    return `${apiUrl}/v1/audit-logs/export.csv${qs ? `?${qs}` : ''}`;
  })();

  return (
    <Wrapper>
      <PageHeader
        title="Audit log"
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} allowAllTime testid="audit-range" />
            <a
              className="btn btn-secondary btn-sm"
              href={exportHref}
              title="Download the filtered stream as CSV (the export itself is audited)"
              data-testid="audit-export"
            >
              Export CSV
            </a>
          </>
        }
      />
      <FilterForm
        filters={filters}
        onChange={setFilters}
        onSubmit={(next) => fetchRows(next, range)}
      />
      {error && (
        <p data-testid="audit-error" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
      {loading && !rows && <LoadingRows />}
      {rows && (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table data-testid="audit-table" className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState>No audit log entries match these filters.</EmptyState>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} style={{ verticalAlign: 'top' }}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>{r.actorEmail ?? <em>system</em>}</td>
                  <td>
                    <code>{r.action}</code>
                  </td>
                  <td>
                    {r.targetType ? (
                      <span>
                        {r.targetType}
                        {r.targetId ? `:${r.targetId.slice(0, 8)}…` : ''}
                      </span>
                    ) : (
                      <em style={{ color: 'var(--text-muted)' }}>—</em>
                    )}
                  </td>
                  <td>
                    {r.changesJson ? (
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          background: 'var(--surface-muted)',
                          border: '1px solid var(--border)',
                          padding: 6,
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {JSON.stringify(r.changesJson, null, 2)}
                      </pre>
                    ) : (
                      <em style={{ color: 'var(--text-muted)' }}>—</em>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </Wrapper>
  );
}

function FilterForm({
  filters,
  onChange,
  onSubmit,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  onSubmit: (next: Filters) => void;
}) {
  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(filters);
  }
  return (
    <form
      onSubmit={handle}
      className="mb-6 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(2,1fr)_auto]"
    >
      <Field label="Action">
        <Input
          name="action"
          value={filters.action}
          onChange={(e) => onChange({ ...filters, action: e.target.value })}
          placeholder="product.variant.price.update"
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="Actor user id">
        <Input
          name="actorUserId"
          value={filters.actorUserId}
          onChange={(e) => onChange({ ...filters, actorUserId: e.target.value })}
          placeholder="uuid"
          style={{ width: '100%' }}
        />
      </Field>
      <Button type="submit" variant="primary" className="w-fit">
        Apply
      </Button>
    </form>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '48px auto',
        padding: '0 16px',
      }}
    >
      {children}
    </main>
  );
}
