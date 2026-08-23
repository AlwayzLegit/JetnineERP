'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  listPending,
  type QueuedSale,
  readActiveBusinessId,
  removePending,
  syncAll,
} from '@/lib/offline';
import { useOnlineStatus } from '@/lib/use-online-status';
import { Money } from '@/components/money';
import { Button, EmptyState, LoadingRows, PageHeader } from '@/components/ui';

export default function PendingSalesPage() {
  const [rows, setRows] = useState<QueuedSale[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const online = useOnlineStatus();
  const businessId = useState(() => readActiveBusinessId())[0];

  async function load() {
    if (!businessId) return;
    setRows(await listPending(businessId));
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  // Guards the queue against two drains at once — the automatic one below
  // and the "Sync now" button racing each other would try to POST the same
  // queued sales twice. A ref rather than `busy` state so the effect does
  // not re-run when it flips.
  const syncing = useRef(false);

  /**
   * Drain the queue as soon as connectivity returns. The register at /pos
   * already does this on reconnect; this tray did not, which meant the one
   * screen a cashier actually watches to see the queue clear was the one
   * screen that would sit there full until somebody pressed the button.
   *
   * Silent when there is nothing to send: an automatic run should not
   * announce "Nothing to sync." on every visit. Only a real outcome — or a
   * failure the cashier has to know about — sets a message.
   */
  useEffect(() => {
    if (!online || !businessId || syncing.current) return;
    syncing.current = true;
    void (async () => {
      try {
        const result = await syncAll(businessId);
        if (result.succeeded > 0 && result.failed === 0) {
          setMessage(`Synced ${result.succeeded} sale${result.succeeded === 1 ? '' : 's'}.`);
        } else if (result.failed > 0) {
          setMessage(
            `Synced ${result.succeeded}, failed ${result.failed}. First error: ${result.errors[0]?.message ?? 'unknown'}`,
          );
        }
        await load();
      } finally {
        syncing.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, businessId]);

  async function syncNow() {
    if (!businessId || !online || syncing.current) return;
    syncing.current = true;
    setBusy(true);
    setMessage(null);
    const result = await syncAll(businessId);
    setBusy(false);
    if (result.succeeded > 0 && result.failed === 0) {
      setMessage(`Synced ${result.succeeded} sale${result.succeeded === 1 ? '' : 's'}.`);
    } else if (result.failed > 0) {
      setMessage(
        `Synced ${result.succeeded}, failed ${result.failed}. First error: ${result.errors[0]?.message ?? 'unknown'}`,
      );
    } else {
      setMessage('Nothing to sync.');
    }
    syncing.current = false;
    void load();
  }

  async function discard(id: string) {
    if (!confirm('Discard this queued sale? Cash already collected will not be recorded.')) return;
    await removePending(id);
    void load();
  }

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/pos">← Register</Link>
      </p>
      <PageHeader
        title="Pending sales"
        actions={
          <Button
            variant="primary"
            onClick={() => void syncNow()}
            disabled={!online || busy}
            title={!online ? 'You are offline' : ''}
          >
            {busy ? 'Syncing…' : 'Sync now'}
          </Button>
        }
      />
      {!online && (
        <p style={{ color: 'var(--warning-soft-text)', fontSize: 13 }}>
          Offline — queued sales will sync automatically when the connection returns.
        </p>
      )}
      {message && <p style={{ color: 'var(--success)', fontSize: 13 }}>{message}</p>}

      {rows == null ? (
        <div className="card">
          <LoadingRows />
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState>Nothing queued. Offline sales will land here until they sync.</EmptyState>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Queued</th>
                <th className="num">Lines</th>
                <th className="num">Total</th>
                <th className="num">Attempts</th>
                <th>Last error</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const body = r.body as {
                  payments?: { amountCents?: number }[];
                  lines?: {
                    quantity?: number;
                    unitPriceCents?: number;
                    lineDiscountCents?: number;
                  }[];
                };
                const lineCount = body.lines?.length ?? 0;
                const total = (body.payments ?? []).reduce((s, p) => s + (p.amountCents ?? 0), 0);
                return (
                  <tr key={r.id}>
                    <td>{new Date(r.enqueuedAt).toLocaleString()}</td>
                    <td className="num">{lineCount}</td>
                    <td className="num">
                      <Money cents={total} />
                    </td>
                    <td className="num">{r.attempts}</td>
                    <td>
                      {r.lastError ? (
                        <span style={{ color: 'var(--danger)', fontSize: 12 }}>{r.lastError}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <Button variant="danger" size="sm" onClick={() => void discard(r.id)}>
                        Discard
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
        Each queued sale carries an Idempotency-Key so even if the server already accepted the
        original request, the cached response is replayed instead of double-charging.
      </p>
    </div>
  );
}
