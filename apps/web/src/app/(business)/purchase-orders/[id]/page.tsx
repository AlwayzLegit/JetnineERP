'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, Card, Field, Input, LoadingRows, PageHeader, StatusBadge } from '@/components/ui';

interface PoLine {
  id: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  /** Vendor's part number; shown to the vendor in preference to sku. */
  vendorSku: string | null;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostCents: number;
  lineTotalCents: number;
}
interface Po {
  id: string;
  number: string;
  status: string;
  vendorId: string;
  vendorName: string | null;
  locationId: string;
  expectedAt: string | null;
  placedAt: string | null;
  closedAt: string | null;
  subtotalCents: number;
  notes: string | null;
  createdAt: string;
  lines: PoLine[];
}

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [po, setPo] = useState<Po | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recvQty, setRecvQty] = useState<Record<string, number>>({});
  const [recvNotes, setRecvNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setPo(await api<Po>(`/v1/purchase-orders/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitReceive() {
    if (!po) return;
    const lines = Object.entries(recvQty)
      .filter(([, q]) => q > 0)
      .map(([lineId, quantity]) => ({ lineId, quantity }));
    if (lines.length === 0) {
      toast.error('Enter a quantity on at least one line.');
      return;
    }
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${id}/receive`, {
        method: 'POST',
        body: JSON.stringify({ notes: recvNotes || null, lines }),
      });
      setRecvQty({});
      setRecvNotes('');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm('Cancel this purchase order?')) return;
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${id}/cancel`, { method: 'POST' });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !po) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!po) return <LoadingRows rows={5} />;

  const receivable = po.status === 'ordered' || po.status === 'partially_received';
  const cancellable =
    po.status === 'draft' || po.status === 'ordered' || po.status === 'partially_received';

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/purchase-orders">← All purchase orders</Link>
      </p>
      <PageHeader
        title={<code>{po.number}</code>}
        sub={
          <>
            <StatusBadge status={po.status} /> · {po.vendorName ?? '(unknown vendor)'} ·{' '}
            {new Date(po.createdAt).toLocaleString()}
          </>
        }
      />

      <Card title="Lines" style={{ marginBottom: 16 }}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Ordered</th>
                <th className="num">Received</th>
                <th className="num">Unit cost</th>
                <th className="num">Line total</th>
                {receivable && <th>Receive qty</th>}
              </tr>
            </thead>
            <tbody>
              {po.lines.map((l) => {
                const remaining = l.quantityOrdered - l.quantityReceived;
                return (
                  <tr key={l.id}>
                    <td>
                      {l.productName}
                      {l.variantName && (
                        <span style={{ color: 'var(--text-secondary)' }}> — {l.variantName}</span>
                      )}
                      {(l.vendorSku ?? l.sku) && (
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 6 }}>
                          <code>{l.vendorSku ?? l.sku}</code>
                          {l.vendorSku && l.sku && l.vendorSku !== l.sku && (
                            <span> (ours: {l.sku})</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="num">{l.quantityOrdered}</td>
                    <td className="num">{l.quantityReceived}</td>
                    <td className="num">
                      <Money cents={l.unitCostCents} />
                    </td>
                    <td className="num">
                      <Money cents={l.lineTotalCents} />
                    </td>
                    {receivable && (
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

      <Card style={{ marginBottom: 16 }}>
        <Row label="Subtotal" cents={po.subtotalCents} bold />
        {po.expectedAt && (
          <Row label="Expected" text={new Date(po.expectedAt).toLocaleDateString()} />
        )}
        {po.placedAt && <Row label="Placed" text={new Date(po.placedAt).toLocaleString()} />}
        {po.closedAt && <Row label="Closed" text={new Date(po.closedAt).toLocaleString()} />}
        {po.notes && <Row label="Notes" text={po.notes} />}
      </Card>

      {receivable && (
        <Card title="Record receipt">
          <p
            style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 0, marginBottom: 8 }}
          >
            Set a quantity above for each line that arrived. Inventory is incremented automatically.
          </p>
          <Field label="Notes (optional)">
            <Input
              value={recvNotes}
              onChange={(e) => setRecvNotes(e.target.value)}
              style={{ width: '100%' }}
            />
          </Field>
          <div style={{ marginTop: 12 }} className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={submitReceive} disabled={busy}>
              <PackageCheck size={14} />
              {busy ? 'Receiving…' : 'Record receipt'}
            </Button>
            {cancellable && (
              <Button variant="danger" onClick={cancel} disabled={busy}>
                Cancel PO
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  cents,
  text,
  bold,
}: {
  label: string;
  cents?: number;
  text?: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: bold ? 700 : 400,
        marginBottom: 4,
      }}
    >
      <span style={{ color: bold ? 'var(--text)' : 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {cents != null ? <Money cents={cents} /> : (text ?? '—')}
      </span>
    </div>
  );
}
