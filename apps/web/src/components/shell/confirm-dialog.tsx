'use client';

import type { ReactNode } from 'react';

/**
 * The design's small confirmation card: title, one paragraph, optional
 * extra content, Cancel + a primary (or danger) action.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
  testid,
}: {
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testid?: string;
}) {
  return (
    <div className="overlay overlay-center" style={{ zIndex: 70 }} onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal
        aria-label={title}
        data-testid={testid}
        className="dialog"
        style={{ width: 420, padding: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>{title}</h3>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>{children}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={
              tone === 'danger'
                ? { background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' }
                : undefined
            }
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
