'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PackageCheck, Printer, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { SecurityOverrideDialog } from '@/components/security-override-dialog';
import {
  Button,
  Card,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
  StatusBadge,
} from '@/components/ui';

interface TransferLine {
  id: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantityShipped: number;
  quantityReceived: number;
  quantityOrdered: number | null;
  quantityHeld: number;
}
interface Transfer {
  id: string;
  number: string;
  status: string;
  fromLocationName: string | null;
  toLocationName: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  canceledAt: string | null;
  notes: string | null;
  createdAt: string;
  lines: TransferLine[];
}

export default function TransferDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [t, setT] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recvQty, setRecvQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setT(await api<Transfer>(`/v1/stock-transfers/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [closeShortOpen, setCloseShortOpen] = useState(false);

  async function ship() {
    setBusy(true);
    try {
      await api(`/v1/stock-transfers/${id}/ship`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitReceive() {
    if (!t) return;
    const lines = Object.entries(recvQty)
      .filter(([, q]) => q > 0)
      .map(([lineId, quantity]) => ({ lineId, quantity }));
    if (lines.length === 0) {
      toast.error('Enter a quantity on at least one line.');
      return;
    }
    setBusy(true);
    try {
      await api(`/v1/stock-transfers/${id}/receive`, {
        method: 'POST',
        body: JSON.stringify({ lines }),
      });
      setRecvQty({});
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm('Cancel this transfer? Only allowed before shipping.')) return;
    setBusy(true);
    try {
      await api(`/v1/stock-transfers/${id}/cancel`, { method: 'POST' });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !t) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!t) return <LoadingRows rows={5} />;

  const isDraft = t.status === 'draft';
  const isInTransit = t.status === 'in_transit';

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/transfers">← All transfers</Link>
      </p>
      <PageHeader
        title={<code>{t.number}</code>}
        sub={
          <>
            <StatusBadge status={t.status} /> · <strong>{t.fromLocationName ?? '—'}</strong> →{' '}
            <strong>{t.toLocationName ?? '—'}</strong> · {new Date(t.createdAt).toLocaleString()}
          </>
        }
        actions={
          <LinkButton
            href={`/print/transfers/${id}`}
            variant="secondary"
            size="sm"
            target="_blank"
            data-testid="print-transfer-ticket"
          >
            <Printer size={13} aria-hidden /> Transfer ticket
          </LinkButton>
        }
      />

      <Card title="Lines" style={{ marginBottom: 16 }}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Shipped</th>
                <th className="num">Held</th>
                <th className="num">Received</th>
                {isInTransit && <th>Receive qty</th>}
              </tr>
            </thead>
            <tbody>
              {t.lines.map((l) => {
                const remaining = l.quantityShipped - l.quantityReceived;
                return (
                  <tr key={l.id}>
                    <td>
                      {l.productName}
                      {l.variantName && (
                        <span style={{ color: 'var(--text-secondary)' }}> — {l.variantName}</span>
                      )}
                      {l.sku && (
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 6 }}>
                          <code>{l.sku}</code>
                        </span>
                      )}
                    </td>
                    <td className="num">{l.quantityShipped}</td>
                    <td className="num">{l.quantityHeld > 0 ? l.quantityHeld : '—'}</td>
                    <td className="num">{l.quantityReceived}</td>
                    {isInTransit && (
                      <td>
                        {remaining > 0 ? (
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            value={recvQty[l.id] ?? 0}
                            onChange={(e) =>
                              setRecvQty((prev) => ({
                                ...prev,
                                [l.id]: Math.max(
                                  0,
                                  Math.min(remaining, Number(e.target.value) || 0),
                                ),
                              }))
                            }
                            style={{ width: 70 }}
                          />
                        ) : (
                          <span className="badge badge-success">complete</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {t.notes && (
        <Card style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 13 }}>Notes:</strong>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {t.notes}
          </p>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {isDraft && (
          <>
            <Button variant="primary" onClick={ship} disabled={busy}>
              <Truck size={14} />
              {busy ? 'Shipping…' : 'Ship transfer'}
            </Button>
            <Button variant="danger" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
          </>
        )}
        {isInTransit && (
          <Button variant="primary" onClick={submitReceive} disabled={busy}>
            <PackageCheck size={14} />
            {busy ? 'Receiving…' : 'Record receipt'}
          </Button>
        )}
        {isInTransit && t.lines.some((l) => l.quantityShipped > l.quantityReceived) && (
          <Button
            variant="danger"
            disabled={busy}
            data-testid="close-short"
            onClick={() => setCloseShortOpen(true)}
          >
            Close short…
          </Button>
        )}
      </div>
      {isInTransit && (
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Sent units that never arrive can&apos;t be dismissed — &quot;Close short&quot; writes the
          shortfall off at cost (manager approval + coded reason) and registers the variance.
        </p>
      )}

      <SecurityOverrideDialog
        open={closeShortOpen}
        title={`Close ${t.number} short — write off the missing units`}
        usageClass="transfer_variance"
        submitLabel="Close short"
        perform={(payload) =>
          api(`/v1/stock-transfers/${id}/close-short`, {
            method: 'POST',
            body: JSON.stringify(payload),
          }).then(() => undefined)
        }
        onClose={() => setCloseShortOpen(false)}
        onSuccess={() => {
          toast.success('Closed short — variance registered.');
          void load();
        }}
      />
    </div>
  );
}
