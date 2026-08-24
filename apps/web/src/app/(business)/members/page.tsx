'use client';

import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
  StatusBadge,
} from '@/components/ui';
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
      toast.error(err instanceof Error ? err.message : String(err));
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
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function resend(membershipId: string) {
    try {
      await api(`/v1/business/members/${membershipId}/resend-invite`, { method: 'POST' });
      setSuccess('Invitation re-sent.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader title="Members" />
      <Card title="Invite member">
        <form onSubmit={invite}>
          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_auto]">
            <Field label="Email">
              <Input name="email" type="email" required style={{ width: '100%' }} />
            </Field>
            <Field label="Name (optional)">
              <Input name="name" style={{ width: '100%' }} />
            </Field>
            <Field label="Role">
              <Select name="roleId" required style={{ width: '100%' }}>
                <option value="">Select role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.isSystem ? '' : ' (custom)'}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" variant="primary" className="w-fit">
              <UserPlus size={14} aria-hidden />
              Invite
            </Button>
          </div>
          {error && (
            <p style={{ color: 'var(--danger)', marginTop: 8, marginBottom: 0, fontSize: 13 }}>
              {error}
            </p>
          )}
          {success && (
            <p
              data-testid="invite-success"
              style={{ color: 'var(--success)', marginTop: 8, marginBottom: 0, fontSize: 13 }}
            >
              {success}
            </p>
          )}
        </form>
      </Card>
      {!members && !error && (
        <Card>
          <LoadingRows />
        </Card>
      )}
      {members && (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState>No members yet. Invite someone above.</EmptyState>
                  </td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m.membershipId}>
                  <td>
                    <strong>{m.email}</strong>
                    {m.name && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.name}</div>
                    )}
                  </td>
                  <td>
                    <Select
                      value={m.roleId}
                      onChange={(e) => changeRole(m.membershipId, e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', gap: 6 }}>
                      {m.status === 'invited' && (
                        <Button size="sm" variant="ghost" onClick={() => resend(m.membershipId)}>
                          Resend invite
                        </Button>
                      )}
                      {m.status !== 'disabled' && (
                        <Button size="sm" variant="danger" onClick={() => disable(m.membershipId)}>
                          Disable
                        </Button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
