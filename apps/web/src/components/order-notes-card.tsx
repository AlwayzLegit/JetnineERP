'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, EmptyState, Field, FormActions, LoadingRows, Stack } from '@/components/ui';
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
    <Card title="Notes" data-testid="order-notes-card">
      <Stack>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Field label="New note">
            <textarea
              className="textarea"
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
            />
          </Field>
          <FormActions
            start={<span>Saved with your name and the time. Ctrl/⌘+Enter to save.</span>}
          >
            <Button
              type="submit"
              variant="primary"
              disabled={!draft.trim() || saving}
              data-testid="order-note-save"
            >
              {saving ? 'Saving…' : 'Add note'}
            </Button>
          </FormActions>
        </form>

        {notes == null ? (
          <LoadingRows rows={2} />
        ) : notes.length === 0 ? (
          <div data-testid="order-notes-empty">
            <EmptyState>No notes yet.</EmptyState>
          </div>
        ) : (
          <ul className="divide-border divide-y" data-testid="order-notes-list">
            {notes.map((n) => (
              <li key={n.id} className="py-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <strong>{n.mine ? 'You' : (n.authorName ?? n.authorEmail ?? 'Unknown')}</strong>
                  <span className="muted">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-0.5 whitespace-pre-wrap">{n.body}</div>
              </li>
            ))}
          </ul>
        )}
      </Stack>
    </Card>
  );
}
