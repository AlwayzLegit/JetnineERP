'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, Card, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

interface PermissionEntry {
  key: string;
  description: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [catalog, setCatalog] = useState<PermissionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    try {
      const [r, p] = await Promise.all([
        api<Role[]>('/v1/business/roles'),
        api<PermissionEntry[]>('/v1/permissions'),
      ]);
      setRoles(r);
      setCatalog(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function clone(role: Role) {
    const name = prompt(
      `Name for the cloned role (based on "${role.name}"):`,
      `${role.name} (custom)`,
    );
    if (!name) return;
    try {
      await api('/v1/business/roles', {
        method: 'POST',
        body: JSON.stringify({ name, basedOnRoleId: role.id }),
      });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(role: Role) {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      await api(`/v1/business/roles/${role.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function savePerms(role: Role, perms: string[]) {
    try {
      await api(`/v1/business/roles/${role.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions: perms }),
      });
      setEditing(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader title="Roles" />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!roles && !error && <LoadingRows />}
      {roles && (
        <div style={{ display: 'grid', gap: 12 }}>
          {roles.map((r) => (
            <Card
              key={r.id}
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {r.name}
                  {r.isSystem && <span className="badge badge-neutral">System</span>}
                </span>
              }
              actions={
                <span style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="secondary" onClick={() => clone(r)}>
                    Clone
                  </Button>
                  {!r.isSystem && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(editing === r.id ? null : r.id)}
                      >
                        {editing === r.id ? 'Cancel' : 'Edit perms'}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(r)}>
                        Delete
                      </Button>
                    </>
                  )}
                </span>
              }
              style={{ marginTop: 0 }}
            >
              {r.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 0 }}>
                  {r.description}
                </p>
              )}
              {editing === r.id ? (
                <PermissionsEditor
                  catalog={catalog}
                  initial={r.permissions}
                  onSave={(perms) => savePerms(r, perms)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <PermissionList catalog={catalog} permissions={r.permissions} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PermissionList({
  catalog,
  permissions,
}: {
  catalog: PermissionEntry[];
  permissions: string[];
}) {
  const grouped = useMemo(
    () => groupCatalog(catalog, new Set(permissions)),
    [catalog, permissions],
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
      {Array.from(grouped.entries()).map(([prefix, entries]) => (
        <div key={prefix} style={groupBox}>
          <div style={groupHeading}>{prefix}</div>
          {entries.map(({ entry, present }) => (
            <div
              key={entry.key}
              style={{
                fontSize: 12,
                color: present ? 'var(--success)' : 'var(--text-muted)',
              }}
            >
              {present ? '✓' : '·'} {entry.key}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PermissionsEditor({
  catalog,
  initial,
  onSave,
  onCancel,
}: {
  catalog: PermissionEntry[];
  initial: string[];
  onSave: (perms: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial));

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave([...selected]);
  }

  const grouped = useMemo(() => groupCatalog(catalog, selected), [catalog, selected]);
  return (
    <form
      onSubmit={handle}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginTop: 8,
      }}
    >
      {Array.from(grouped.entries()).map(([prefix, entries]) => (
        <div key={prefix} style={groupBox}>
          <div style={groupHeading}>{prefix}</div>
          {entries.map(({ entry, present }) => (
            <label
              key={entry.key}
              style={{
                display: 'block',
                fontSize: 12,
                cursor: 'pointer',
                padding: '2px 0',
              }}
              title={entry.description}
            >
              <input
                type="checkbox"
                checked={present}
                onChange={() => toggle(entry.key)}
                style={{ marginRight: 6, accentColor: 'var(--brand)' }}
              />
              {entry.key}
            </label>
          ))}
        </div>
      ))}
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
        <Button type="submit" variant="primary" size="sm">
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function groupCatalog(
  catalog: PermissionEntry[],
  selected: Set<string>,
): Map<string, { entry: PermissionEntry; present: boolean }[]> {
  const map = new Map<string, { entry: PermissionEntry; present: boolean }[]>();
  for (const entry of catalog) {
    const prefix = entry.key.split('.')[0] ?? 'other';
    const list = map.get(prefix) ?? [];
    list.push({ entry, present: selected.has(entry.key) });
    map.set(prefix, list);
  }
  return map;
}

const groupBox = {
  background: 'var(--surface-muted)',
  border: '1px solid var(--border)',
  padding: 8,
  borderRadius: 'var(--radius-sm)',
} as const;
const groupHeading = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  marginBottom: 4,
} as const;
