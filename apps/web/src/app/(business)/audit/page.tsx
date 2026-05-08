'use client';

import { useEffect, useState, type FormEvent } from 'react';
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
        <p>Loading…</p>
      </Wrapper>
    );
  if (!session.data)
    return (
      <Wrapper>
        <p>Sign in required.</p>
      </Wrapper>
    );

  return (
    <Wrapper>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Audit log</h1>
      <FilterForm filters={filters} onChange={setFilters} onSubmit={(next) => fetchRows(next)} />
      {error && (
        <p data-testid="audit-error" style={{ color: '#b00' }}>
          {error}
        </p>
      )}
      {loading && <p>Loading…</p>}
      {rows && (
        <table
          data-testid="audit-table"
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
        >
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>When</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Target</Th>
              <Th>Diff</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: '#888' }}>
                  No audit log entries match these filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3', verticalAlign: 'top' }}>
                <Td>{new Date(r.createdAt).toLocaleString()}</Td>
                <Td>{r.actorEmail ?? <em>system</em>}</Td>
                <Td>
                  <code>{r.action}</code>
                </Td>
                <Td>
                  {r.targetType ? (
                    <span>
                      {r.targetType}
                      {r.targetId ? `:${r.targetId.slice(0, 8)}…` : ''}
                    </span>
                  ) : (
                    <em style={{ color: '#888' }}>—</em>
                  )}
                </Td>
                <Td>
                  {r.changesJson ? (
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontSize: 12,
                        background: '#fafafa',
                        padding: 6,
                        borderRadius: 4,
                      }}
                    >
                      {JSON.stringify(r.changesJson, null, 2)}
                    </pre>
                  ) : (
                    <em style={{ color: '#888' }}>—</em>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
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
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr) auto',
        gap: 12,
        marginBottom: 24,
        alignItems: 'end',
      }}
    >
      <Field label="Action">
        <input
          name="action"
          value={filters.action}
          onChange={(e) => onChange({ ...filters, action: e.target.value })}
          placeholder="product.variant.price.update"
          style={fieldStyle}
        />
      </Field>
      <Field label="Actor user id">
        <input
          name="actorUserId"
          value={filters.actorUserId}
          onChange={(e) => onChange({ ...filters, actorUserId: e.target.value })}
          placeholder="uuid"
          style={fieldStyle}
        />
      </Field>
      <Field label="Since">
        <input
          name="since"
          type="datetime-local"
          value={filters.since}
          onChange={(e) => onChange({ ...filters, since: e.target.value })}
          style={fieldStyle}
        />
      </Field>
      <Field label="Until">
        <input
          name="until"
          type="datetime-local"
          value={filters.until}
          onChange={(e) => onChange({ ...filters, until: e.target.value })}
          style={fieldStyle}
        />
      </Field>
      <button
        type="submit"
        style={{
          padding: '8px 14px',
          background: '#111',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          height: 32,
        }}
      >
        Apply
      </button>
    </form>
  );
}

const fieldStyle = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '48px auto',
        padding: '0 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {children}
    </main>
  );
}
