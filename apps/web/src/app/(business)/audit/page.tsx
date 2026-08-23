'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card, EmptyState, Field, Input, LoadingRows, PageHeader } from '@/components/ui';
import { useSession } from '@/lib/auth-client';

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

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function AuditLogPage() {
  const session = useSession();
  const [filters, setFilters] = useState({ action: '', actorUserId: '', since: '', until: '' });
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchRows(currentFilters: typeof filters): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (currentFilters.action) params.set('action', currentFilters.action);
      if (currentFilters.actorUserId) params.set('actorUserId', currentFilters.actorUserId);
      if (currentFilters.since) params.set('since', currentFilters.since);
      if (currentFilters.until) params.set('until', currentFilters.until);
      const res = await fetch(`${apiUrl}/v1/audit-logs?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        setError(`${res.status} ${res.statusText}`);
        setRows([]);
        return;
      }
      const body = (await res.json()) as { data: AuditLogRow[]; nextCursor: string | null };
      setRows(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session.data) void fetchRows(filters);
    // We only refetch on session change, not on every keystroke; the form
    // submit calls fetchRows explicitly with the current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.data?.user.id]);

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

  return (
    <Wrapper>
      <PageHeader title="Audit log" />
      <FilterForm filters={filters} onChange={setFilters} onSubmit={(next) => fetchRows(next)} />
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
  filters: { action: string; actorUserId: string; since: string; until: string };
  onChange: (next: typeof filters) => void;
  onSubmit: (next: typeof filters) => void;
}) {
  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(filters);
  }
  return (
    <form
      onSubmit={handle}
      className="mb-6 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto]"
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
      <Field label="Since">
        <Input
          name="since"
          type="datetime-local"
          value={filters.since}
          onChange={(e) => onChange({ ...filters, since: e.target.value })}
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="Until">
        <Input
          name="until"
          type="datetime-local"
          value={filters.until}
          onChange={(e) => onChange({ ...filters, until: e.target.value })}
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
