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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Pending sales</h1>
        <button
          onClick={() => void syncNow()}
          disabled={!online || busy}
          style={{ marginLeft: 'auto', ...primaryBtn }}
          title={!online ? 'You are offline' : ''}
        >
          {busy ? 'Syncing…' : 'Sync now'}
        </button>
      </div>
      {!online && (
        <p style={{ color: '#a60', fontSize: 13 }}>
          Offline — queued sales will sync automatically when the connection returns.
        </p>
      )}
      {message && <p style={{ color: '#070', fontSize: 13 }}>{message}</p>}

      {rows == null ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <div style={card}>
          <p style={{ color: '#888', margin: 0 }}>Nothing queued.</p>
        </div>
      ) : (
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <Th>Queued</Th>
                <Th>Lines</Th>
                <Th>Total</Th>
                <Th>Attempts</Th>
                <Th>Last error</Th>
                <Th>&nbsp;</Th>
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
                  <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <Td>{new Date(r.enqueuedAt).toLocaleString()}</Td>
                    <Td>{lineCount}</Td>
                    <Td>
                      <Money cents={total} />
                    </Td>
                    <Td>{r.attempts}</Td>
                    <Td>
                      {r.lastError ? (
                        <span style={{ color: '#b00', fontSize: 12 }}>{r.lastError}</span>
                      ) : (
                        <span style={{ color: '#888' }}>—</span>
                      )}
                    </Td>
                    <Td>
                      <button onClick={() => void discard(r.id)} style={linkBtnDanger}>
                        Discard
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: '#666', fontSize: 12, marginTop: 16 }}>
        Each queued sale carries an Idempotency-Key so even if the server already accepted the
        original request, the cached response is replayed instead of double-charging.
      </p>
    </div>
  );
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
const primaryBtn = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const linkBtnDanger = {
  background: 'none',
  border: 'none',
  color: '#b00',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
} as const;

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>{children}</td>;
}
