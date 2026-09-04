'use client';

import { useEffect, useState } from 'react';
import { pendingCount, readActiveBusinessId } from '@/lib/offline';

/**
 * Sidebar footer: whether the register can reach the API and whether any
 * offline sales are still queued. Polls the queue every 15s; the
 * browser's online/offline events flip the label immediately.
 */
export function SyncStatus() {
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    let alive = true;
    const tick = async () => {
      const biz = readActiveBusinessId();
      if (!biz) return;
      try {
        const n = await pendingCount(biz);
        if (alive) {
          setQueued(n);
          setCheckedAt(new Date());
        }
      } catch {
        // IndexedDB unavailable — treat as nothing queued.
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 15_000);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const bad = !online || queued > 0;
  const label = !online
    ? 'Offline — sales queue locally'
    : queued > 0
      ? `${queued} sale${queued === 1 ? '' : 's'} waiting to sync`
      : 'All systems synced';
  const time = checkedAt
    ? checkedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';
  return (
    <div
      data-testid="sync-status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 6,
        background: bad ? 'var(--danger-soft)' : 'var(--surface2)',
        fontSize: 11.5,
        color: 'var(--text2)',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: bad ? 'var(--danger)' : 'var(--accent)',
          flex: 'none',
        }}
      />
      <span style={{ flex: 1 }}>{label}</span>
      <span className="mono" style={{ color: 'var(--muted)' }}>
        {time}
      </span>
    </div>
  );
}
