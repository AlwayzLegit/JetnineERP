'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string | null;
  createdAt: string;
  userCount: number;
  locationCount: number;
  lastActivityAt: string | null;
}

export default function BusinessesPage() {
  const [rows, setRows] = useState<BusinessSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await api<BusinessSummary[]>('/v1/admin/businesses'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Businesses</h1>
      <CreateBusinessForm onCreated={load} />
      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {rows && (
        <table
          data-testid="businesses-table"
          style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24, fontSize: 13 }}
        >
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Status</Th>
              <Th>Users</Th>
              <Th>Locations</Th>
              <Th>Last activity</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 16, color: '#888' }}>
                  No businesses yet. Create one above.
                </td>
              </tr>
            )}
            {rows.map((b) => (
              <BusinessRow key={b.id} business={b} onChanged={load} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CreateBusinessForm({ onCreated }: { onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData(e.currentTarget);
      const result = await api<{ businessId: string }>('/v1/admin/businesses', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          slug: String(data.get('slug') ?? ''),
          ownerEmail: String(data.get('ownerEmail') ?? ''),
          ownerName: String(data.get('ownerName') ?? ''),
        }),
      });
      setSuccess(`Created ${result.businessId}. Invitation sent.`);
      e.currentTarget.reset();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: '#fff',
        padding: 16,
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Create business</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <Field label="Name">
          <input name="name" required style={fieldStyle} />
        </Field>
        <Field label="Slug">
          <input name="slug" required pattern="[a-z0-9-]+" style={fieldStyle} />
        </Field>
        <Field label="Owner email">
          <input name="ownerEmail" type="email" required style={fieldStyle} />
        </Field>
        <Field label="Owner name (optional)">
          <input name="ownerName" style={fieldStyle} />
        </Field>
      </div>
      {error && (
        <p data-testid="create-error" style={{ color: '#b00', marginTop: 8, fontSize: 13 }}>
          {error}
        </p>
      )}
      {success && (
        <p data-testid="create-success" style={{ color: '#080', marginTop: 8, fontSize: 13 }}>
          {success}
        </p>
      )}
      <div style={{ marginTop: 12 }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '8px 14px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Working…' : 'Create + invite owner'}
        </button>
      </div>
    </form>
  );
}

function BusinessRow({
  business,
  onChanged,
}: {
  business: BusinessSummary;
  onChanged: () => void;
}) {
  async function setStatus(status: 'active' | 'suspended') {
    try {
      await api(`/v1/admin/businesses/${business.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <tr style={{ borderBottom: '1px solid #f3f3f3' }}>
      <Td>
        <strong>{business.name}</strong>
      </Td>
      <Td>
        <code>{business.slug}</code>
      </Td>
      <Td>
        <StatusPill status={business.status} />
      </Td>
      <Td>{business.userCount}</Td>
      <Td>{business.locationCount}</Td>
      <Td>
        {business.lastActivityAt ? (
          new Date(business.lastActivityAt).toLocaleString()
        ) : (
          <em style={{ color: '#888' }}>—</em>
        )}
      </Td>
      <Td>
        <Link href={`/admin/businesses/${business.id}`}>Open</Link>
        {' · '}
        {business.status === 'suspended' ? (
          <button onClick={() => setStatus('active')} style={linkButtonStyle}>
            Unsuspend
          </button>
        ) : (
          <button onClick={() => setStatus('suspended')} style={linkButtonStyle}>
            Suspend
          </button>
        )}
      </Td>
    </tr>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    active: ['#0a7', '#e7f7ee'],
    trial: ['#48a', '#e7f0f7'],
    suspended: ['#b00', '#fde7e7'],
    cancelled: ['#666', '#eee'],
  };
  const [fg, bg] = colors[status] ?? ['#444', '#eee'];
  return (
    <span
      style={{
        background: bg,
        color: fg,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

const fieldStyle = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
} as const;

const linkButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#06c',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 13,
  padding: 0,
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
