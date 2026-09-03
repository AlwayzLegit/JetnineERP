'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  FormActions,
  FormGrid,
  Input,
  LoadingRows,
  PageHeader,
  Select,
  Stack,
} from '@/components/ui';

interface Flat {
  id: string;
  parentId: string | null;
  name: string;
  position: number;
}
interface Node extends Flat {
  depth: number;
  children: Node[];
}

export default function CategoriesPage() {
  const [tree, setTree] = useState<Node[] | null>(null);
  const [flat, setFlat] = useState<Flat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await api<{ flat: Flat[]; tree: Node[] }>('/v1/categories');
      setTree(res.tree);
      setFlat(res.flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = e.currentTarget;
    try {
      const data = new FormData(form);
      await api('/v1/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          parentId: String(data.get('parentId') ?? '') || null,
        }),
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function rename(node: Node) {
    const name = prompt('Rename category', node.name);
    if (!name || name === node.name) return;
    try {
      await api(`/v1/categories/${node.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(node: Node) {
    if (!confirm(`Delete "${node.name}"?`)) return;
    try {
      await api(`/v1/categories/${node.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader title="Categories" />

      <Stack>
        <Card title="Add category">
          <form onSubmit={create}>
            <FormGrid cols={2}>
              <Field label="Name" required>
                <Input name="name" required />
              </Field>
              <Field label="Parent (optional)">
                <Select name="parentId" defaultValue="">
                  <option value="">— top level —</option>
                  {flat.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormGrid>
            {error && <Alert tone="error">{error}</Alert>}
            <FormActions>
              <Button type="submit" variant="primary" disabled={saving}>
                <Plus size={14} />
                Add
              </Button>
            </FormActions>
          </form>
        </Card>

        <Card title="Category tree">
          {tree == null ? (
            <LoadingRows />
          ) : tree.length === 0 ? (
            <EmptyState title="No categories yet">
              Add your first category above to organize products.
            </EmptyState>
          ) : (
            <ul className="m-0 list-none p-0">
              {tree.map((root) => (
                <CategoryNode key={root.id} node={root} onRename={rename} onDelete={remove} />
              ))}
            </ul>
          )}
        </Card>
      </Stack>
    </div>
  );
}

function CategoryNode({
  node,
  onRename,
  onDelete,
}: {
  node: Node;
  onRename: (n: Node) => void;
  onDelete: (n: Node) => void;
}) {
  return (
    <li className="py-1" style={{ marginLeft: node.depth * 16 }}>
      <span className="inline-flex items-center gap-2">
        <strong>{node.name}</strong>
        <Button size="sm" variant="ghost" onClick={() => onRename(node)}>
          rename
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(node)}>
          delete
        </Button>
      </span>
      {node.children.length > 0 && (
        <ul className="m-0 list-none p-0">
          {node.children.map((c) => (
            <CategoryNode key={c.id} node={c} onRename={onRename} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
  );
}
