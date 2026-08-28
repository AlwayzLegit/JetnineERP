'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Permission } from '@jetnine/shared';
import { Button, Card, Field, LoadingRows, PageHeader, Select, StatusBadge } from '@/components/ui';
import { PermissionGroupsEditor } from '@/components/permission-groups';
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
  dataScope: 'all' | 'store';
  scopeLocationIds: string[];
  invitedAt: string | null;
  acceptedAt: string | null;
}

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
}

interface LocationRow {
  id: string;
  name: string;
}

interface MemberAccess {
  membershipId: string;
  roleId: string;
  roleName: string;
  rolePermissions: Permission[];
  overrides: { permission: Permission; allowed: boolean }[];
  effective: Permission[];
}

/**
 * One member, everything about their access: profile, role + status,
 * sales-data scope, and the per-permission editor. The permission
 * checkboxes show the member's EFFECTIVE access; ticking something the
 * role doesn't grant (or unticking something it does) stages an
 * override, saved as a diff against the role so a later role change
 * re-inherits cleanly. Works for invited members too — access applies
 * the moment they accept.
 */
export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;

  const [member, setMember] = useState<Member | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [access, setAccess] = useState<MemberAccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Staged (unsaved) effective permission set for the access editor.
  const [staged, setStaged] = useState<Set<string> | null>(null);
  const [savingAccess, setSavingAccess] = useState(false);

  const load = useCallback(async () => {
    try {
      const [membersList, rolesList, locs, acc] = await Promise.all([
        api<Member[]>('/v1/business/members'),
        api<Role[]>('/v1/business/roles'),
        api<LocationRow[]>('/v1/business/locations'),
        api<MemberAccess>(`/v1/business/members/${id}/permissions`),
      ]);
      const m = membersList.find((x) => x.membershipId === id);
      if (!m) {
        setError('Member not found');
        return;
      }
      setMember(m);
      setRoles(rolesList);
      setLocations(locs);
      setAccess(acc);
      setStaged(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [id]);

  useEffect(() => {
    if (id) void load();
  }, [id, load]);

  const roleSet = useMemo(() => new Set<string>(access?.rolePermissions ?? []), [access]);
  const effectiveSet = useMemo(() => new Set<string>(access?.effective ?? []), [access]);
  const value = staged ?? effectiveSet;
  const dirty = staged !== null && !setsEqual(staged, effectiveSet);
  const overrideCount = useMemo(
    () =>
      [...value].filter((p) => !roleSet.has(p)).length +
      [...roleSet].filter((p) => !value.has(p)).length,
    [value, roleSet],
  );

  async function patchMember(body: Record<string, unknown>, okMessage: string) {
    try {
      await api(`/v1/business/members/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      toast.success(okMessage);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function saveAccess() {
    if (!staged) return;
    setSavingAccess(true);
    try {
      const overrides = [
        ...[...staged]
          .filter((p) => !roleSet.has(p))
          .map((p) => ({ permission: p, allowed: true })),
        ...[...roleSet]
          .filter((p) => !staged.has(p))
          .map((p) => ({ permission: p, allowed: false })),
      ];
      await api(`/v1/business/members/${id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ overrides }),
      });
      toast.success('Access saved.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingAccess(false);
    }
  }

  async function resetToRole() {
    setSavingAccess(true);
    try {
      await api(`/v1/business/members/${id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ overrides: [] }),
      });
      toast.success('Overrides cleared — back to role defaults.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingAccess(false);
    }
  }

  async function resend() {
    try {
      const result = await api<{ inviteLink?: string }>(
        `/v1/business/members/${id}/resend-invite`,
        { method: 'POST' },
      );
      if (result.inviteLink) {
        await navigator.clipboard?.writeText(result.inviteLink).catch(() => undefined);
        toast.success('Invitation refreshed — link copied to clipboard.');
      } else {
        toast.success('Invitation re-sent.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  if (error) {
    return (
      <div>
        <p style={{ marginBottom: 12 }}>
          <Link href="/members">← Members</Link>
        </p>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    );
  }
  if (!member || !access) return <LoadingRows rows={6} />;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/members">← Members</Link>
      </p>
      <PageHeader
        title={member.name || member.email}
        sub={
          <>
            {member.email}
            {member.invitedAt && ` · invited ${formatDate(member.invitedAt)}`}
            {member.acceptedAt && ` · joined ${formatDate(member.acceptedAt)}`}
            {!member.emailVerified && ' · email unverified'}
          </>
        }
        actions={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={member.status} />
            {member.status === 'invited' && (
              <Button size="sm" variant="secondary" onClick={() => void resend()}>
                Resend invite
              </Button>
            )}
            {member.status !== 'disabled' ? (
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (confirm('Disable this member? They lose access immediately.')) {
                    void patchMember({ status: 'disabled' }, 'Member disabled.');
                  }
                }}
              >
                Disable
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => void patchMember({ status: 'active' }, 'Member reactivated.')}
              >
                Reactivate
              </Button>
            )}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <Card title="Role">
          <Field label="Assigned role">
            <Select
              value={member.roleId}
              onChange={(e) => void patchMember({ roleId: e.target.value }, 'Role updated.')}
              style={{ width: '100%' }}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.isSystem ? '' : ' (custom)'}
                </option>
              ))}
            </Select>
          </Field>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 0 }}>
            The role sets this member’s default access. Changing it keeps any individual overrides
            below, re-applied on top of the new role.{' '}
            <Link href={`/roles/${member.roleId}`}>View role →</Link>
          </p>
        </Card>

        <Card title="Sales data scope">
          <Field label="Which stores’ sales data can they see?">
            <Select
              value={member.dataScope}
              data-testid={`data-scope-${member.membershipId}`}
              onChange={(e) =>
                void patchMember({ dataScope: e.target.value }, 'Sales data scope updated.')
              }
              style={{ width: '100%' }}
            >
              <option value="all">All locations</option>
              <option value="store">Selected stores only</option>
            </Select>
          </Field>
          {member.dataScope === 'store' && (
            <div style={{ display: 'grid', gap: 4 }}>
              {locations.map((loc) => (
                <label
                  key={loc.id}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={member.scopeLocationIds.includes(loc.id)}
                    style={{ accentColor: 'var(--brand)' }}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...member.scopeLocationIds, loc.id]
                        : member.scopeLocationIds.filter((x) => x !== loc.id);
                      void patchMember({ scopeLocationIds: next }, 'Store scope updated.');
                    }}
                  />
                  {loc.name}
                </label>
              ))}
              {member.scopeLocationIds.length === 0 && (
                <span style={{ fontSize: 12, color: 'var(--danger)' }}>
                  No store selected — this member sees no sales data.
                </span>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card
        title={
          <>
            Permissions
            {overrideCount > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 10 }}>
                {overrideCount} override{overrideCount === 1 ? '' : 's'}
              </span>
            )}
          </>
        }
        actions={
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            {access.overrides.length > 0 && !dirty && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void resetToRole()}
                disabled={savingAccess}
              >
                Reset to role defaults
              </Button>
            )}
            {dirty && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStaged(null)}
                  disabled={savingAccess}
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => void saveAccess()}
                  disabled={savingAccess}
                >
                  {savingAccess ? 'Saving…' : 'Save access'}
                </Button>
              </>
            )}
          </span>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0 }}>
          Checked = what {member.name || member.email} can do, starting from the{' '}
          <strong>{access.roleName}</strong> role. Tick or untick anything to override just for this
          member
          {member.status === 'invited' ? ' — it applies as soon as they accept the invite' : ''}.
        </p>
        <PermissionGroupsEditor
          value={value}
          onChange={(next) => setStaged(next)}
          baseline={roleSet}
        />
      </Card>
    </div>
  );
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}
