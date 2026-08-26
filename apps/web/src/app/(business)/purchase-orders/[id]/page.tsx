'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Mail, PackageCheck, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { PrintablePurchaseOrder } from '@/components/printable-purchase-order';
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
  quantityInspected: number;
  quantityAccepted: number;
  unitCostCents: number;
  lineTotalCents: number;
  linkedOrders: { orderId: string; orderNumber: string; quantity: number }[];
}
interface Po {
  id: string;
  number: string;
  status: string;
  vendorId: string;
  vendorName: string | null;
  vendorContactName: string | null;
  vendorEmail: string | null;
  vendorPhone: string | null;
  locationId: string;
  locationName: string | null;
  expectedAt: string | null;
  placedAt: string | null;
  closedAt: string | null;
  subtotalCents: number;
  notes: string | null;
  createdAt: string;
  lines: PoLine[];
}

interface VendorInvoice {
  id: string;
  number: string;
  invoiceDate: string | null;
  totalCents: number;
  status: string;
  varianceCents: number | null;
  poNumber: string | null;
  createdAt: string;
}

/** Per-line stage increments the receiving screen accumulates. */
type StageDraft = Record<string, { received: string; inspected: string; accepted: string }>;

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [po, setPo] = useState<Po | null>(null);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<StageDraft>({});
  const [recvNotes, setRecvNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await api<Po>(`/v1/purchase-orders/${id}`);
      setPo(data);
      void api<VendorInvoice[]>(`/v1/vendor-invoices?purchaseOrderId=${id}`)
        .then(setInvoices)
        .catch(() => setInvoices([]));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function stageValue(lineId: string, stage: 'received' | 'inspected' | 'accepted'): string {
    return draft[lineId]?.[stage] ?? '';
  }
  function setStage(lineId: string, stage: 'received' | 'inspected' | 'accepted', value: string) {
    setDraft((prev) => ({
      ...prev,
      [lineId]: {
        received: prev[lineId]?.received ?? '',
        inspected: prev[lineId]?.inspected ?? '',
        accepted: prev[lineId]?.accepted ?? '',
        [stage]: value,
      },
    }));
  }

  /** Staged submit: only lines with at least one positive increment go up. */
  async function submitStages() {
    if (!po) return;
    const lines = Object.entries(draft)
      .map(([lineId, s]) => ({
        lineId,
        received: Number(s.received) || 0,
        inspected: Number(s.inspected) || 0,
        accepted: Number(s.accepted) || 0,
      }))
      .filter((l) => l.received + l.inspected + l.accepted > 0);
    if (lines.length === 0) {
      toast.error('Enter a quantity in at least one stage.');
      return;
    }
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${id}/receiving`, {
        method: 'POST',
        body: JSON.stringify({ notes: recvNotes || null, lines }),
      });
      setDraft({});
      setRecvNotes('');
      toast.success('Receiving recorded.');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  /** One-click "everything arrived fine": receive + inspect + accept the rest. */
  async function acceptAllRemaining() {
    if (!po) return;
    const lines = po.lines
      .filter((l) => l.quantityOrdered - l.quantityReceived > 0)
      .map((l) => ({ lineId: l.id, quantity: l.quantityOrdered - l.quantityReceived }));
    if (lines.length === 0) {
      toast.error('Nothing left to receive.');
      return;
    }
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${id}/receive`, {
        method: 'POST',
        body: JSON.stringify({ notes: recvNotes || null, lines }),
      });
      setRecvNotes('');
      toast.success('All remaining units received and accepted.');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function emailVendor() {
    setBusy(true);
    try {
      const res = await api<{ sent: true; to: string }>(`/v1/purchase-orders/${id}/email`, {
        method: 'POST',
      });
      toast.success(`Purchase order emailed to ${res.to}`);
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
        actions={
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer size={14} aria-hidden />
              Print for vendor
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void emailVendor()}
              disabled={busy || po.status === 'draft' || !po.vendorEmail}
              data-testid="email-po"
              title={po.vendorEmail ? `Email to ${po.vendorEmail}` : 'Vendor has no email on file'}
            >
              <Mail size={14} aria-hidden />
              Email vendor
            </Button>
          </span>
        }
      />
      <PrintablePurchaseOrder po={po} />

      <Card title="Lines & receiving" style={{ marginBottom: 16 }}>
        {receivable && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 8px' }}>
            Per line: <strong>Received</strong> at the dock → <strong>Inspected</strong> →{' '}
            <strong>Accepted</strong> into sellable stock. Stock (and any linked sales-order
            reservation) moves at Accept. Enter increments and record below.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="table" data-testid="receiving-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Ordered</th>
                <th className="num">Rcvd</th>
                <th className="num">Insp</th>
                <th className="num">Acc</th>
                <th className="num">Unit cost</th>
                {receivable && <th>+Received</th>}
                {receivable && <th>+Inspected</th>}
                {receivable && <th>+Accepted</th>}
              </tr>
            </thead>
            <tbody>
              {po.lines.map((l) => {
                const remaining = l.quantityOrdered - l.quantityAccepted;
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
                        </span>
                      )}
                      {l.linkedOrders.length > 0 && (
                        <div style={{ fontSize: 11.5, marginTop: 2 }}>
                          {l.linkedOrders.map((o) => (
                            <Link
                              key={o.orderId}
                              href={`/orders/${o.orderId}`}
                              className="badge badge-info"
                              style={{ marginRight: 4, textDecoration: 'none' }}
                            >
                              {o.orderNumber} ×{o.quantity}
                            </Link>
                          ))}
                        </div>
                      )}
                      {remaining > 0 && l.quantityReceived > 0 && (
                        <div
                          style={{ fontSize: 11.5, color: 'var(--warning)' }}
                          data-testid="remaining-note"
                        >
                          {l.quantityAccepted} of {l.quantityOrdered} accepted — {remaining}{' '}
                          remaining
                        </div>
                      )}
                    </td>
                    <td className="num">{l.quantityOrdered}</td>
                    <td className="num">{l.quantityReceived}</td>
                    <td className="num">{l.quantityInspected}</td>
                    <td className="num">
                      {l.quantityAccepted >= l.quantityOrdered ? (
                        <span className="badge badge-success">{l.quantityAccepted}</span>
                      ) : (
                        l.quantityAccepted
                      )}
                    </td>
                    <td className="num">
                      <Money cents={l.unitCostCents} />
                    </td>
                    {receivable &&
                      (['received', 'inspected', 'accepted'] as const).map((stage) => (
                        <td key={stage}>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={stageValue(l.id, stage)}
                            onChange={(e) => setStage(l.id, stage, e.target.value)}
                            data-testid={`stage-${stage}`}
                            style={{ width: 62, padding: '4px 6px' }}
                          />
                        </td>
                      ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {receivable && (
          <div style={{ marginTop: 12 }}>
            <Field label="Receiving notes (optional)">
              <Input
                value={recvNotes}
                onChange={(e) => setRecvNotes(e.target.value)}
                style={{ maxWidth: 420, width: '100%' }}
              />
            </Field>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => void submitStages()}
                disabled={busy}
                data-testid="record-receiving"
              >
                <PackageCheck size={14} />
                {busy ? 'Recording…' : 'Record receiving'}
              </Button>
              <Button variant="secondary" onClick={() => void acceptAllRemaining()} disabled={busy}>
                Receive & accept all remaining
              </Button>
              {cancellable && (
                <Button variant="danger" onClick={cancel} disabled={busy}>
                  Cancel PO
                </Button>
              )}
            </div>
          </div>
        )}
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

      <InvoicesCard
        poId={id}
        poNumber={po.number}
        vendorId={po.vendorId}
        invoices={invoices}
        onChanged={load}
      />
    </div>
  );
}

/**
 * §6 vendor-invoice matching, scoped to this PO: the bill auto-matches
 * by PO number at record time; the variance against the PO subtotal is
 * shown and approval is one click (no approval queue per §13).
 */
function InvoicesCard({
  poId: _poId,
  poNumber,
  vendorId,
  invoices,
  onChanged,
}: {
  poId: string;
  poNumber: string;
  vendorId: string;
  invoices: VendorInvoice[];
  onChanged: () => Promise<void> | void;
}) {
  const [number, setNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [total, setTotal] = useState('');
  const [busy, setBusy] = useState(false);

  async function record() {
    const cents = Math.round(Number(total) * 100);
    if (!number.trim() || !Number.isFinite(cents) || cents < 0) {
      toast.error('Enter the vendor invoice number and total.');
      return;
    }
    setBusy(true);
    try {
      await api('/v1/vendor-invoices', {
        method: 'POST',
        body: JSON.stringify({
          vendorId,
          number: number.trim(),
          invoiceDate: invoiceDate || undefined,
          totalCents: cents,
          poNumber,
        }),
      });
      setNumber('');
      setInvoiceDate('');
      setTotal('');
      toast.success('Invoice recorded and matched.');
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function approve(id: string) {
    setBusy(true);
    try {
      await api(`/v1/vendor-invoices/${id}/approve`, { method: 'POST' });
      toast.success('Invoice approved.');
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Vendor invoices" style={{ marginBottom: 16 }}>
      {invoices.length === 0 ? (
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          No vendor invoice recorded against this PO yet.
        </p>
      ) : (
        <table className="table" style={{ marginBottom: 12 }} data-testid="invoice-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th className="num">Total</th>
              <th className="num">Variance vs PO</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>
                  <code>{inv.number}</code>
                </td>
                <td>{inv.invoiceDate ?? '—'}</td>
                <td className="num">
                  <Money cents={inv.totalCents} />
                </td>
                <td className="num">
                  {inv.varianceCents == null ? (
                    '—'
                  ) : inv.varianceCents === 0 ? (
                    <span className="badge badge-success">exact</span>
                  ) : (
                    <span style={{ color: 'var(--warning)' }}>
                      {inv.varianceCents > 0 ? '+' : ''}
                      <Money cents={inv.varianceCents} />
                    </span>
                  )}
                </td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
                <td>
                  {inv.status === 'matched' && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={busy}
                      onClick={() => void approve(inv.id)}
                      data-testid="approve-invoice"
                    >
                      Approve
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Vendor invoice #">
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            data-testid="invoice-number"
            style={{ width: 160 }}
          />
        </Field>
        <Field label="Invoice date">
          <Input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            style={{ width: 150 }}
          />
        </Field>
        <Field label="Total ($)">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            data-testid="invoice-total"
            style={{ width: 120 }}
          />
        </Field>
        <Button
          variant="secondary"
          onClick={() => void record()}
          disabled={busy}
          data-testid="record-invoice"
        >
          Record & match
        </Button>
      </div>
    </Card>
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
