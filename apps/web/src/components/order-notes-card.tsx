'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card } from '@/components/ui';
import { api } from '@/lib/api';

interface OrderNote {
  id: string;
  body: string;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
  mine: boolean;
}

/**
 * The order's running conversation (owner ask 2026-09-01): anyone who can
 * see the order can leave a note; each one keeps who wrote it and when.
 * Append-only by design — what was said stays said.
 */
export function OrderNotesCard({ orderId }: { orderId: string }) {
  const [notes, setNotes] = useState<OrderNote[] | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setNotes(await api<OrderNote[]>(`/v1/orders/${orderId}/notes`));
    } catch {
      setNotes([]);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    const body = draft.trim();
    if (!body || saving) return;
    setSaving(true);
    try {
      const note = await api<OrderNote>(`/v1/orders/${orderId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      setNotes((prev) => [note, ...(prev ?? [])]);
      setDraft('');
      toast.success('Note saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Notes" style={{ marginBottom: 16 }} data-testid="order-notes-card">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        style={{ display: 'grid', gap: 8, marginBottom: notes && notes.length > 0 ? 12 : 0 }}
      >
        <textarea
          aria-label="New note"
          data-testid="order-note-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void save();
          }}
          placeholder="Leave a note for whoever picks this order up next…"
          rows={3}
          maxLength={4000}
          style={{
            width: '100%',
            fontSize: 13,
            fontFamily: 'inherit',
            padding: '8px 10px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            color: 'var(--text)',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!draft.trim() || saving}
            data-testid="order-note-save"
          >
            {saving ? 'Saving…' : 'Add note'}
          </Button>
          <span className="muted" style={{ fontSize: 11.5 }}>
            Saved with your name and the time. Ctrl/⌘+Enter to save.
          </span>
        </div>
      </form>

      {notes == null ? (
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Loading notes…
        </p>
      ) : notes.length === 0 ? (
        <p
          className="muted"
          style={{ fontSize: 13, margin: '10px 0 0' }}
          data-testid="order-notes-empty"
        >
          No notes yet.
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }} data-testid="order-notes-list">
          {notes.map((n) => (
            <li
              key={n.id}
              style={{ padding: '8px 0', borderTop: '1px solid var(--border)', fontSize: 13 }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                <strong>{n.mine ? 'You' : (n.authorName ?? n.authorEmail ?? 'Unknown')}</strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 2 }}>{n.body}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
