'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

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
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Categories</h1>

      <form onSubmit={create} style={card}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Add category</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 12 }}>
          <Field label="Name">
            <input name="name" required style={fieldStyle} />
          </Field>
          <Field label="Parent (optional)">
            <select name="parentId" style={fieldStyle} defaultValue="">
              <option value="">— top level —</option>
              {flat.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
          <button type="submit" style={primaryBtn}>
            Add
          </button>
        </div>
        {error && <p style={{ color: '#b00', fontSize: 13, marginTop: 8 }}>{error}</p>}
      </form>

      {tree && (
        <ul style={{ background: '#fff', padding: 16, borderRadius: 6, listStyle: 'none' }}>
          {tree.length === 0 && <li style={{ color: '#888' }}>No categories yet.</li>}
          {tree.map((root) => (
            <CategoryNode key={root.id} node={root} onRename={rename} onDelete={remove} />
          ))}
        </ul>
      )}
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
      <strong>{node.name}</strong>{' '}
      <button onClick={() => onRename(node)} style={linkBtn}>
        rename
      </button>{' '}
      <button onClick={() => onDelete(node)} style={linkBtnDanger}>
        delete
      </button>
      {node.children.length > 0 && (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {node.children.map((c) => (
            <CategoryNode key={c.id} node={c} onRename={onRename} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
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
  fontSize: 13,
} as const;
const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#06c',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
} as const;
const linkBtnDanger = { ...linkBtn, color: '#b00' } as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
