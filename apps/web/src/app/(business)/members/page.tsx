'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface Member {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  status: string;
  roleId: string;
  roleName: string;
  invitedAt: string | null;
  acceptedAt: string | null;
}

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    try {
      const [m, r] = await Promise.all([
        api<Member[]>('/v1/business/members'),
        api<Role[]>('/v1/business/roles'),
      ]);
      setMembers(m);
      setRoles(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData(e.currentTarget);
      const result = await api<{ alreadyMember: boolean }>('/v1/business/members/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: String(data.get('email') ?? ''),
          name: String(data.get('name') ?? ''),
          roleId: String(data.get('roleId') ?? ''),
        }),
      });
      setSuccess(
        result.alreadyMember
          ? 'That user is already an active member; nothing to do.'
          : 'Invitation sent.',
      );
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function disable(membershipId: string) {
    if (!confirm('Disable this member?')) return;
    try {
      await api(`/v1/business/members/${membershipId}/disable`, { method: 'POST' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function changeRole(membershipId: string, roleId: string) {
    try {
      await api(`/v1/business/members/${membershipId}`, {
        method: 'PATCH',
        body: JSON.stringify({ roleId }),
      });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function resend(membershipId: string) {
    try {
      await api(`/v1/business/members/${membershipId}/resend-invite`, { method: 'POST' });
      setSuccess('Invitation re-sent.');
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Members</h1>
      <form onSubmit={invite} style={card}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Invite member</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: 12 }}>
          <Field label="Email">
            <input name="email" type="email" required style={fieldStyle} />
          </Field>
          <Field label="Name (optional)">
            <input name="name" style={fieldStyle} />
          </Field>
          <Field label="Role">
            <select name="roleId" required style={fieldStyle}>
              <option value="">Select role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.isSystem ? '' : ' (custom)'}
                </option>
              ))}
            </select>
          </Field>
          <button type="submit" style={primaryBtn}>
            Invite
          </button>
        </div>
        {error && <p style={{ color: '#b00', marginTop: 8, fontSize: 13 }}>{error}</p>}
        {success && (
          <p data-testid="invite-success" style={{ color: '#080', marginTop: 8, fontSize: 13 }}>
            {success}
          </p>
        )}
      </form>
      {members && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 16, color: '#888' }}>
                  No members yet. Invite someone above.
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr key={m.membershipId} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <Td>
                  <strong>{m.email}</strong>
                  {m.name && <div style={{ color: '#888', fontSize: 12 }}>{m.name}</div>}
                </Td>
                <Td>
                  <select
                    value={m.roleId}
                    onChange={(e) => changeRole(m.membershipId, e.target.value)}
                    style={fieldStyle}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>{m.status}</Td>
                <Td>
                  {m.status === 'invited' && (
                    <>
                      <button onClick={() => resend(m.membershipId)} style={linkBtn}>
                        Resend invite
                      </button>
                      {' · '}
                    </>
                  )}
                  {m.status !== 'disabled' && (
                    <button onClick={() => disable(m.membershipId)} style={linkBtn}>
                      Disable
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
const fieldStyle = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
} as const;
const primaryBtn = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  alignSelf: 'end',
} as const;
const linkBtn = {
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
