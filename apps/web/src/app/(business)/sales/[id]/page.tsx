'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { PrintableReceipt, type ReceiptBusiness } from '@/components/printable-receipt';
import { Button, Field, Input, LoadingRows, StatusBadge } from '@/components/ui';

interface SaleLine {
  id: string;
  variantId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  totalCents: number;
  refundedQuantity: number;
}
interface Payment {
  id: string;
  method: string;
  amountCents: number;
  status: string;
}
interface Refund {
  id: string;
  amountCents: number;
  reason: string | null;
  createdAt: string;
}
interface Sale {
  id: string;
  number: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  customerId: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  lines: SaleLine[];
  payments: Payment[];
  refunds: Refund[];
}

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [sale, setSale] = useState<Sale | null>(null);
  const [business, setBusiness] = useState<ReceiptBusiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refundQty, setRefundQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setSale(await api<Sale>(`/v1/sales/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    void api<{ name: string; receiptHeader: string | null; receiptFooter: string | null }>(
      '/v1/business/settings',
    )
      .then((s) =>
        setBusiness({
          name: s.name,
          receiptHeader: s.receiptHeader,
          receiptFooter: s.receiptFooter,
        }),
      )
      .catch(() => {
        // Print receipt will fall back to "Sale" as the header.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitRefund() {
    if (!sale) return;
    const lines = Object.entries(refundQty)
      .filter(([, q]) => q > 0)
      .map(([saleLineId, quantity]) => ({ saleLineId, quantity }));
    if (lines.length === 0) {
      toast.error('Select at least one line and a quantity to refund.');
      return;
    }
    setBusy(true);
    try {
      await api(`/v1/sales/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || null, lines }),
      });
      setRefundQty({});
      setReason('');
      toast.success('Refund processed.');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!sale) return <LoadingRows rows={4} />;

  const refundable = sale.status === 'completed' || sale.status === 'partially_refunded';

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/sales">← All sales</Link>
      </p>
      <div className="page-header" style={{ marginBottom: 4 }}>
        <h1 className="page-title" style={{ fontSize: 22 }}>
          <code>{sale.number}</code>
        </h1>
        <StatusBadge status={sale.status} />
        <div style={{ marginLeft: 'auto' }}>
          <Button
            variant="primary"
            size="sm"
            className="inline-flex items-center gap-1.5"
            onClick={() => window.print()}
          >
            <Printer size={14} /> Print receipt
          </Button>
        </div>
      </div>
      <p className="page-sub" style={{ margin: '0 0 24px' }}>
        {sale.status} · {new Date(sale.completedAt ?? sale.createdAt).toLocaleString()}
      </p>
      <PrintableReceipt
        sale={{
          number: sale.number,
          completedAt: sale.completedAt,
          createdAt: sale.createdAt,
          subtotalCents: sale.subtotalCents,
          discountCents: sale.discountCents,
          taxCents: sale.taxCents,
          totalCents: sale.totalCents,
          lines: sale.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            totalCents: l.totalCents,
          })),
          payments: sale.payments,
        }}
        business={business}
      />

      <div className="card">
        <h2 className="card-title">Lines</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Sold</th>
                <th className="num">Refunded</th>
                <th className="num">Unit</th>
                <th className="num">Total</th>
                {refundable && <th>Refund qty</th>}
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((l) => {
                const remaining = l.quantity - l.refundedQuantity;
                return (
                  <tr key={l.id}>
                    <td>{l.description}</td>
                    <td className="num">{l.quantity}</td>
                    <td className="num">{l.refundedQuantity}</td>
                    <td className="num">
                      <Money cents={l.unitPriceCents} />
                    </td>
                    <td className="num">
                      <Money cents={l.totalCents} />
                    </td>
                    {refundable && (
                      <td>
                        {remaining > 0 ? (
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            className="input"
                            value={refundQty[l.id] ?? 0}
                            onChange={(e) =>
                              setRefundQty((prev) => ({
                                ...prev,
                                [l.id]: Math.max(
                                  0,
                                  Math.min(remaining, Number(e.target.value) || 0),
                                ),
                              }))
                            }
                            style={{ width: 64, padding: '5px 6px' }}
                          />
                        ) : (
                          <span className="muted" style={{ fontSize: 12 }}>
                            fully refunded
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Totals</h2>
        <Row label="Subtotal" cents={sale.subtotalCents} />
        {sale.discountCents > 0 && <Row label="Discount" cents={-sale.discountCents} />}
        <Row label="Tax" cents={sale.taxCents} />
        <Row label="Total" cents={sale.totalCents} bold />
      </div>

      <div className="card">
        <h2 className="card-title">Payments</h2>
        {sale.payments.map((p) => (
          <Row key={p.id} label={`${p.method.toUpperCase()} (${p.status})`} cents={p.amountCents} />
        ))}
      </div>

      {sale.refunds.length > 0 && (
        <div className="card">
          <h2 className="card-title">Refunds</h2>
          {sale.refunds.map((r) => (
            <div
              key={r.id}
              style={{
                fontSize: 13,
                paddingBottom: 6,
                marginBottom: 6,
                borderBottom: '1px solid var(--border)',
              }}
            >
              {new Date(r.createdAt).toLocaleString()} —{' '}
              <strong>
                <Money cents={r.amountCents} />
              </strong>
              {r.reason && <span style={{ color: 'var(--text-secondary)' }}> · {r.reason}</span>}
            </div>
          ))}
        </div>
      )}

      {refundable && (
        <div className="card">
          <h2 className="card-title">New refund</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
            Set a quantity in the table above for the lines you want to refund. Inventory is
            restored automatically.
          </p>
          <Field label="Reason (optional)" style={{ marginBottom: 12 }}>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ display: 'block', width: '100%' }}
            />
          </Field>
          <Button
            variant="primary"
            onClick={submitRefund}
            disabled={busy}
            className="min-h-11 inline-flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> {busy ? 'Processing…' : 'Process refund'}
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, cents, bold }: { label: string; cents: number; bold?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: bold ? 700 : 400,
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 4,
      }}
    >
      <span>{label}</span>
      <span>
        <Money cents={cents} />
      </span>
    </div>
  );
}
