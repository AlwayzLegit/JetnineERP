'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input, LinkButton, LoadingRows, PageHeader } from '@/components/ui';
import { PermissionGroupsEditor } from '@/components/permission-groups';
import { api } from '@/lib/api';

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

/**
 * One editor for three entries: create from scratch (`/roles/new`),
 * duplicate (`/roles/new?basedOn=<id>` — prefilled, saved as a new
 * role), and edit (`/roles/<id>`). System roles open read-only with a
 * Duplicate escape hatch, mirroring the API's clone-then-edit rule.
 */
export function RoleEditor({ roleId, basedOnId }: { roleId?: string; basedOnId?: string }) {
  const router = useRouter();
  const sourceId = roleId ?? basedOnId;
  const [source, setSource] = useState<Role | null>(null);
  const [loading, setLoading] = useState(Boolean(sourceId));
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sourceId) return;
    api<Role[]>('/v1/business/roles')
      .then((roles) => {
        const r = roles.find((x) => x.id === sourceId);
        if (!r) {
          setError('Role not found');
          return;
        }
        setSource(r);
        setName(roleId ? r.name : `${r.name} (copy)`);
        setDescription(r.description ?? '');
        setSelected(new Set(r.permissions));
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [sourceId, roleId]);

  const isEdit = Boolean(roleId);
  const readOnly = isEdit && Boolean(source?.isSystem);

  async function save() {
    if (!name.trim()) {
      toast.error('Give the role a name.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api(`/v1/business/roles/${roleId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            permissions: [...selected],
          }),
        });
        toast.success('Role saved.');
      } else {
        await api('/v1/business/roles', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            permissions: [...selected],
          }),
        });
        toast.success(`Role "${name.trim()}" created.`);
      }
      router.push('/roles');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  if (loading) return <LoadingRows rows={6} />;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/roles">← Roles</Link>
      </p>
      <PageHeader
        title={
          isEdit ? (
            <>
              {source?.name}
              {source?.isSystem && (
                <span className="badge badge-neutral" style={{ marginLeft: 10 }}>
                  System
                </span>
              )}
            </>
          ) : basedOnId ? (
            `Duplicate ${source?.name ?? 'role'}`
          ) : (
            'Create role'
          )
        }
        sub={
          readOnly
            ? 'System roles ship with Jetnine and cannot be edited. Duplicate it to make a custom version you control.'
            : 'Pick what this role can do. Members with this role inherit every checked permission; individual members can still be fine-tuned on their member page.'
        }
        actions={
          readOnly ? (
            <LinkButton href={`/roles/new?basedOn=${roleId}`} variant="primary">
              Duplicate to customize
            </LinkButton>
          ) : (
            <span style={{ display: 'inline-flex', gap: 8 }}>
              <LinkButton href="/roles" variant="ghost">
                Cancel
              </LinkButton>
              <Button variant="primary" onClick={() => void save()} disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save role' : 'Create role'}
              </Button>
            </span>
          )
        }
      />

      {!readOnly && (
        <Card style={{ marginBottom: 16 }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Warehouse lead"
                style={{ width: '100%' }}
              />
            </Field>
            <Field label="Description (optional)">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this role for?"
                style={{ width: '100%' }}
              />
            </Field>
          </div>
        </Card>
      )}

      <Card
        title="Permissions"
        actions={
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.size} granted</span>
        }
      >
        <PermissionGroupsEditor
          value={selected}
          onChange={readOnly ? undefined : setSelected}
          disabled={readOnly}
        />
      </Card>
    </div>
  );
}
