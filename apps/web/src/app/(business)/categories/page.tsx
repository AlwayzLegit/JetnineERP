'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
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
    try {
      const data = new FormData(e.currentTarget);
      await api('/v1/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          parentId: String(data.get('parentId') ?? '') || null,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(node: Node) {
    if (!confirm(`Delete "${node.name}"?`)) return;
    try {
      await api(`/v1/categories/${node.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader title="Categories" />

      <Card title="Add category" style={{ marginBottom: 16 }}>
        <form onSubmit={create}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr auto',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <Field label="Name">
              <Input name="name" required style={{ width: '100%' }} />
            </Field>
            <Field label="Parent (optional)">
              <Select name="parentId" defaultValue="" style={{ width: '100%' }}>
                <option value="">— top level —</option>
                {flat.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" variant="primary">
              Add
            </Button>
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{error}</p>}
        </form>
      </Card>

      <Card>
        {tree == null ? (
          <LoadingRows />
        ) : tree.length === 0 ? (
          <EmptyState>
            No categories yet. Add your first category above to organize products.
          </EmptyState>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tree.map((root) => (
              <CategoryNode key={root.id} node={root} onRename={rename} onDelete={remove} />
            ))}
          </ul>
        )}
      </Card>
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
    <li style={{ marginLeft: node.depth * 16, padding: '4px 0', fontSize: 13 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <strong>{node.name}</strong>
        <Button size="sm" variant="ghost" onClick={() => onRename(node)}>
          rename
        </Button>
        <Button
          size="sm"
          variant="ghost"
          style={{ color: 'var(--danger)' }}
          onClick={() => onDelete(node)}
        >
          delete
        </Button>
      </span>
      {node.children.length > 0 && (
        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
          {node.children.map((c) => (
            <CategoryNode key={c.id} node={c} onRename={onRename} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
  );
}
