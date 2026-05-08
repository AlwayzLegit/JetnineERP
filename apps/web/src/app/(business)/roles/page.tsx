'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Roles</h1>
      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {roles && (
        <div style={{ display: 'grid', gap: 12 }}>
          {roles.map((r) => (
            <div key={r.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontSize: 16, margin: 0 }}>{r.name}</h2>
                {r.isSystem && (
                  <span
                    style={{
                      background: '#eee',
                      color: '#444',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    System
                  </span>
                )}
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={() => clone(r)} style={linkBtn}>
                    Clone
                  </button>
                  {!r.isSystem && (
                    <>
                      <button
                        onClick={() => setEditing(editing === r.id ? null : r.id)}
                        style={linkBtn}
                      >
                        {editing === r.id ? 'Cancel' : 'Edit perms'}
                      </button>
                      <button onClick={() => remove(r)} style={linkBtnDanger}>
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </div>
              {r.description && <p style={{ color: '#666', fontSize: 13 }}>{r.description}</p>}
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
            </div>
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
        <div key={prefix} style={{ background: '#fafafa', padding: 8, borderRadius: 4 }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{prefix}</div>
          {entries.map(({ entry, present }) => (
            <div key={entry.key} style={{ fontSize: 12, color: present ? '#080' : '#bbb' }}>
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
        <div key={prefix} style={{ background: '#fafafa', padding: 8, borderRadius: 4 }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{prefix}</div>
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
                style={{ marginRight: 6 }}
              />
              {entry.key}
            </label>
          ))}
        </div>
      ))}
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
        <button type="submit" style={primaryBtn}>
          Save
        </button>
        <button type="button" onClick={onCancel} style={linkBtn}>
          Cancel
        </button>
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

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
};
const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#06c',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 13,
  padding: 0,
} as const;
const linkBtnDanger = { ...linkBtn, color: '#b00' } as const;
const primaryBtn = {
  padding: '6px 12px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
