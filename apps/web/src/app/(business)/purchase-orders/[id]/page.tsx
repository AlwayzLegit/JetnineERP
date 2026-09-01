'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, PackageCheck, Printer, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { SecurityOverrideDialog } from '@/components/security-override-dialog';
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
  quantityRejected: number;
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
  /** Q1 landed cost lean: spread into unit cost at receipt. */
  freightCents: number | null;
  notes: string | null;
  createdAt: string;
  blindReceiving: boolean;
  /** PO-060: vendor ships straight to the customer in shipToJson. */
  directShip: boolean;
  shipToJson: unknown;
  /** Soft-deleted draft (CR 2026-08-31); null on every live PO. */
  deletedAt: string | null;
  deletedByEmail: string | null;
  lines: PoLine[];
}

/** One row of the PO's change history, from the audit log. */
interface AuditRow {
  id: string;
  action: string;
  actorEmail: string | null;
  changesJson: unknown;
  createdAt: string;
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
type StageDraft = Record<
  string,
  { received: string; inspected: string; accepted: string; rejected: string }
>;

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [po, setPo] = useState<Po | null>(null);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<StageDraft>({});
  const [recvNotes, setRecvNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [timeline, setTimeline] = useState<AuditRow[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function load() {
    try {
      const data = await api<Po>(`/v1/purchase-orders/${id}`);
      setPo(data);
      void api<VendorInvoice[]>(`/v1/vendor-invoices?purchaseOrderId=${id}`)
        .then(setInvoices)
        .catch(() => setInvoices([]));
      // The audit log is the PO's timeline, the same way it is the
      // order's. A 403 just leaves the card empty.
      void api<{ data: AuditRow[] }>(
        `/v1/audit-logs?targetType=purchase_order&targetId=${id}&limit=50`,
      )
        .then((r) => setTimeline(r.data))
        .catch(() => setTimeline([]));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  type Stage = 'received' | 'inspected' | 'accepted' | 'rejected';
  function stageValue(lineId: string, stage: Stage): string {
    return draft[lineId]?.[stage] ?? '';
  }
  function setStage(lineId: string, stage: Stage, value: string) {
    setDraft((prev) => ({
      ...prev,
      [lineId]: {
        received: prev[lineId]?.received ?? '',
        inspected: prev[lineId]?.inspected ?? '',
        accepted: prev[lineId]?.accepted ?? '',
        rejected: prev[lineId]?.rejected ?? '',
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
        rejected: Number(s.rejected) || 0,
      }))
      .filter((l) => l.received + l.inspected + l.accepted + l.rejected > 0);
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

  async function place() {
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${id}/place`, { method: 'POST' });
      toast.success('Purchase order placed.');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteDraft() {
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${id}`, { method: 'DELETE' });
      setConfirmDelete(false);
      toast.success('Draft deleted.');
      router.push('/purchase-orders');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${id}/restore`, { method: 'POST' });
      toast.success('Draft restored.');
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
  const editable = cancellable;
  const unreceivable =
    (po.status === 'partially_received' || po.status === 'received') &&
    po.lines.some((l) => l.quantityAccepted > 0);

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
            {po.directShip && (
              <>
                {' '}
                <span
                  className="badge badge-info"
                  title="The vendor ships straight to the customer — receiving records the shipment and fulfills the sales order; nothing enters stock"
                >
                  direct ship to{' '}
                  {((po.shipToJson ?? {}) as { name?: string | null }).name ?? 'customer'}
                </span>
              </>
            )}
          </>
        }
        actions={
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {po.status === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => void place()}
                disabled={busy}
                data-testid="place-po"
              >
                Place order
              </Button>
            )}
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
            {po.status === 'draft' && !po.deletedAt && (
              // Deliberately last, behind a spacer: Delete and Place do
              // opposite things and must not sit side by side.
              <Button
                variant="danger"
                size="sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                data-testid="delete-po"
              >
                <Trash2 size={14} aria-hidden />
                Delete draft
              </Button>
            )}
          </span>
        }
      />

      {po.deletedAt && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--danger)' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
            data-testid="po-deleted-banner"
          >
            <div style={{ fontSize: 13 }}>
              <strong>Deleted draft.</strong> Hidden from the purchase-order list since{' '}
              {new Date(po.deletedAt).toLocaleString()}
              {po.deletedByEmail ? ` by ${po.deletedByEmail}` : ''}. The number{' '}
              <code>{po.number}</code> stays retired either way.
            </div>
            <Button
              variant="secondary"
              size="sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => void restore()}
              disabled={busy}
              data-testid="restore-po"
            >
              <Undo2 size={14} aria-hidden />
              Restore
            </Button>
          </div>
        </Card>
      )}

      {confirmDelete && (
        <DeleteDraftDialog
          po={po}
          busy={busy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void deleteDraft()}
        />
      )}
      <PrintablePurchaseOrder po={po} />

      <Card title="Lines & receiving" style={{ marginBottom: 16 }}>
        {receivable && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 8px' }}>
            Per line: <strong>Received</strong> at the dock → <strong>Inspected</strong> →{' '}
            <strong>Accepted</strong> into sellable stock, or <strong>Rejected</strong> into the
            As-Is review queue (damage never silently becomes sellable). Stock moves at Accept.
            Enter increments and record below.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="table" data-testid="receiving-table">
            <thead>
              <tr>
                <th>Item</th>
                {!po.blindReceiving && <th className="num">Ordered</th>}
                <th className="num">Rcvd</th>
                <th className="num">Insp</th>
                <th className="num">Acc</th>
                <th className="num">Rej</th>
                {!po.blindReceiving && <th className="num">Unit cost</th>}
                {receivable && <th>+Received</th>}
                {receivable && <th>+Inspected</th>}
                {receivable && <th>+Accepted</th>}
                {receivable && <th>+Rejected</th>}
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
                      {!po.blindReceiving && remaining > 0 && l.quantityReceived > 0 && (
                        <div
                          style={{ fontSize: 11.5, color: 'var(--warning)' }}
                          data-testid="remaining-note"
                        >
                          {l.quantityAccepted} of {l.quantityOrdered} accepted — {remaining}{' '}
                          remaining
                        </div>
                      )}
                    </td>
                    {!po.blindReceiving && <td className="num">{l.quantityOrdered}</td>}
                    <td className="num">{l.quantityReceived}</td>
                    <td className="num">{l.quantityInspected}</td>
                    <td className="num">
                      {l.quantityAccepted >= l.quantityOrdered ? (
                        <span className="badge badge-success">{l.quantityAccepted}</span>
                      ) : (
                        l.quantityAccepted
                      )}
                    </td>
                    <td className="num">{l.quantityRejected || ''}</td>
                    {!po.blindReceiving && (
                      <td className="num">
                        <Money cents={l.unitCostCents} />
                      </td>
                    )}
                    {receivable &&
                      (['received', 'inspected', 'accepted', 'rejected'] as const).map((stage) => (
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

      {editable && <EditOrderCard po={po} onChanged={load} />}
      {unreceivable && <UnreceiveCard po={po} onChanged={load} />}

      <Card style={{ marginBottom: 16 }}>
        <Row label="Subtotal" cents={po.subtotalCents} bold />
        {po.freightCents != null && po.freightCents > 0 && (
          <Row label="Freight (loads into unit cost at receipt)" cents={po.freightCents} />
        )}
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

      <Card title="Change history" style={{ marginBottom: 16 }}>
        {timeline.length === 0 ? (
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            No events recorded.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }} data-testid="po-timeline">
            {timeline.map((t) => (
              <li key={t.id} style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {new Date(t.createdAt).toLocaleString()}
                </span>{' '}
                — {t.action.replace('purchase_order.', '').replace(/[._]/g, ' ')}
                {t.actorEmail && (
                  <span style={{ color: 'var(--text-muted)' }}> by {t.actorEmail}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/**
 * Deleting a draft is cheap to undo but easy to do by accident on the
 * wrong tab, so the button arms only once the PO number is typed. The
 * dialog shows what is about to go: vendor, line count, subtotal.
 */
function DeleteDraftDialog({
  po,
  busy,
  onCancel,
  onConfirm,
}: {
  po: Po;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');
  const armed = typed.trim().toUpperCase() === po.number.toUpperCase();
  const linked = po.lines.reduce((n, l) => n + l.linkedOrders.length, 0);

  return (
    <div
      role="dialog"
      aria-modal
      data-testid="delete-po-dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="card"
        style={{ width: 'min(460px, 92vw)', padding: 20, display: 'grid', gap: 12 }}
      >
        <strong style={{ fontSize: 15 }}>Delete draft {po.number}?</strong>
        <div style={{ fontSize: 13, display: 'grid', gap: 3 }}>
          <div>
            <span className="muted">Vendor</span> {po.vendorName ?? '(unknown vendor)'}
          </div>
          <div>
            <span className="muted">Lines</span> {po.lines.length}
          </div>
          <div>
            <span className="muted">Subtotal</span> <Money cents={po.subtotalCents} />
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
          The draft leaves the list and can be restored from <em>Show deleted</em>.{' '}
          <code>{po.number}</code> is retired for good — it will never be reused.
          {linked > 0 && (
            <>
              {' '}
              {linked} linked sales-order line{linked === 1 ? '' : 's'} go back on the
              special-orders queue as un-sourced.
            </>
          )}
        </p>
        <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          Type <code>{po.number}</code> to confirm
          <Input
            data-testid="delete-po-confirm"
            value={typed}
            autoFocus
            onChange={(e) => setTyped(e.target.value)}
            placeholder={po.number}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Keep it
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={!armed || busy}
            data-testid="delete-po-submit"
          >
            {busy ? 'Deleting…' : 'Delete draft'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * PO corrections: edit an un-closed order in place. Quantities can never
 * drop below what is already received or committed to a sales order, and
 * only an untouched, unlinked line can be removed — the API enforces the
 * same rules, these are just friendly disables.
 */
function EditOrderCard({ po, onChanged }: { po: Po; onChanged: () => Promise<void> | void }) {
  const [expectedAt, setExpectedAt] = useState(po.expectedAt ? po.expectedAt.slice(0, 10) : '');
  const [notes, setNotes] = useState(po.notes ?? '');
  const [drafts, setDrafts] = useState<
    Record<string, { quantity: string; cost: string; remove: boolean }>
  >({});
  const [added, setAdded] = useState<
    { variantId: string; description: string; quantity: string; cost: string }[]
  >([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<
    { variantId: string; productName: string; variantName: string | null; sku: string | null }[]
  >([]);
  const [busy, setBusy] = useState(false);

  function draftFor(l: PoLine) {
    return (
      drafts[l.id] ?? {
        quantity: String(l.quantityOrdered),
        cost: (l.unitCostCents / 100).toFixed(2),
        remove: false,
      }
    );
  }
  function setDraft(
    l: PoLine,
    patch: Partial<{ quantity: string; cost: string; remove: boolean }>,
  ) {
    setDrafts((prev) => ({ ...prev, [l.id]: { ...draftFor(l), ...prev[l.id], ...patch } }));
  }

  async function searchVariants() {
    if (!search.trim()) return;
    try {
      setResults(
        await api<
          {
            variantId: string;
            productName: string;
            variantName: string | null;
            sku: string | null;
          }[]
        >(`/v1/pos/lookup?q=${encodeURIComponent(search.trim())}`),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function save() {
    const lines: {
      lineId?: string;
      variantId?: string;
      quantity?: number;
      unitCostCents?: number;
      remove?: boolean;
    }[] = [];
    for (const l of po.lines) {
      const d = drafts[l.id];
      if (!d) continue;
      if (d.remove) {
        lines.push({ lineId: l.id, remove: true });
        continue;
      }
      const quantity = Number(d.quantity);
      const unitCostCents = Math.round(Number(d.cost) * 100);
      if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(unitCostCents)) {
        toast.error('Quantities must be positive whole numbers and costs valid amounts.');
        return;
      }
      if (quantity !== l.quantityOrdered || unitCostCents !== l.unitCostCents) {
        lines.push({ lineId: l.id, quantity, unitCostCents });
      }
    }
    for (const a of added) {
      const quantity = Number(a.quantity);
      const unitCostCents = Math.round(Number(a.cost) * 100);
      if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(unitCostCents)) {
        toast.error(`Enter a quantity and cost for ${a.description}.`);
        return;
      }
      lines.push({ variantId: a.variantId, quantity, unitCostCents });
    }
    const body: Record<string, unknown> = {};
    const origExpected = po.expectedAt ? po.expectedAt.slice(0, 10) : '';
    if (expectedAt !== origExpected) body.expectedAt = expectedAt || null;
    if (notes !== (po.notes ?? '')) body.notes = notes || null;
    if (lines.length > 0) body.lines = lines;
    if (Object.keys(body).length === 0) {
      toast.error('Nothing changed.');
      return;
    }
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${po.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setDrafts({});
      setAdded([]);
      toast.success('Purchase order updated.');
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Edit order" style={{ marginBottom: 16 }}>
      <div className="overflow-x-auto">
        <table className="table" data-testid="edit-po-table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Qty</th>
              <th className="num">Unit cost ($)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((l) => {
              const d = draftFor(l);
              const locked = l.quantityReceived > 0 || l.linkedOrders.length > 0;
              return (
                <tr key={l.id} style={d.remove ? { opacity: 0.45 } : undefined}>
                  <td>
                    {l.productName}
                    {l.variantName && (
                      <span style={{ color: 'var(--text-secondary)' }}> — {l.variantName}</span>
                    )}
                  </td>
                  <td className="num">
                    <Input
                      type="number"
                      min={Math.max(l.quantityReceived, 1)}
                      value={d.quantity}
                      disabled={d.remove}
                      onChange={(e) => setDraft(l, { quantity: e.target.value })}
                      style={{ width: 72, padding: '4px 6px' }}
                    />
                  </td>
                  <td className="num">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={d.cost}
                      disabled={d.remove}
                      onChange={(e) => setDraft(l, { cost: e.target.value })}
                      style={{ width: 90, padding: '4px 6px' }}
                    />
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={locked}
                      title={
                        locked
                          ? 'Received or linked to a sales order — cannot remove'
                          : 'Remove line'
                      }
                      onClick={() => setDraft(l, { remove: !d.remove })}
                    >
                      {d.remove ? 'Keep' : 'Remove'}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {added.map((a, i) => (
              <tr key={`add-${a.variantId}`}>
                <td>
                  {a.description} <span className="badge badge-info">new</span>
                </td>
                <td className="num">
                  <Input
                    type="number"
                    min={1}
                    value={a.quantity}
                    onChange={(e) =>
                      setAdded((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)),
                      )
                    }
                    style={{ width: 72, padding: '4px 6px' }}
                  />
                </td>
                <td className="num">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={a.cost}
                    onChange={(e) =>
                      setAdded((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, cost: e.target.value } : x)),
                      )
                    }
                    style={{ width: 90, padding: '4px 6px' }}
                  />
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAdded((prev) => prev.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Field label="Add item (name, SKU, or barcode)">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void searchVariants();
              }
            }}
            style={{ width: 240 }}
          />
        </Field>
        <Button variant="secondary" size="sm" onClick={() => void searchVariants()}>
          Search
        </Button>
      </div>
      {results.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {results.slice(0, 8).map((r) => (
            <Button
              key={r.variantId}
              size="sm"
              variant="ghost"
              disabled={
                po.lines.some((l) => l.variantId === r.variantId) ||
                added.some((a) => a.variantId === r.variantId)
              }
              onClick={() => {
                setAdded((prev) => [
                  ...prev,
                  {
                    variantId: r.variantId,
                    description: [r.productName, r.variantName].filter(Boolean).join(' — '),
                    quantity: '1',
                    cost: '0.00',
                  },
                ]);
                setResults([]);
                setSearch('');
              }}
            >
              + {[r.productName, r.variantName].filter(Boolean).join(' — ')}
              {r.sku ? ` (${r.sku})` : ''}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Field label="Expected date">
          <Input
            type="date"
            value={expectedAt}
            onChange={(e) => setExpectedAt(e.target.value)}
            style={{ width: 150 }}
          />
        </Field>
        <Field label="Notes">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: 280 }} />
        </Field>
        <Button variant="primary" onClick={() => void save()} disabled={busy} data-testid="save-po">
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </Card>
  );
}

/**
 * Receipt corrections: back mis-keyed accepted units out of stock. The
 * ledger gets an `unreceive_po` entry (never a silent edit); the API
 * refuses to cut into reserved or sales-order-committed units.
 */
function UnreceiveCard({ po, onChanged }: { po: Po; onChanged: () => Promise<void> | void }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const lines = Object.entries(drafts)
      .map(([lineId, q]) => ({ lineId, quantity: Number(q) || 0 }))
      .filter((l) => l.quantity > 0);
    if (lines.length === 0) {
      toast.error('Enter how many units to un-receive on at least one line.');
      return;
    }
    if (
      !confirm(
        `Un-receive ${lines.reduce((s, l) => s + l.quantity, 0)} unit(s)? Stock will be reduced and the PO reopened.`,
      )
    )
      return;
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${po.id}/unreceive`, {
        method: 'POST',
        body: JSON.stringify({ notes: notes || null, lines }),
      });
      setDrafts({});
      setNotes('');
      toast.success('Receipt corrected.');
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const lines = po.lines.filter((l) => l.quantityAccepted > 0);
  return (
    <Card title="Correct a receipt (un-receive)" style={{ marginBottom: 16 }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 8px' }}>
        For mis-keyed receipts: backs units out of stock with an audited ledger entry and reopens
        the PO. Units reserved for customers or committed to sales orders cannot be un-received.
      </p>
      <table className="table" data-testid="unreceive-table">
        <thead>
          <tr>
            <th>Item</th>
            <th className="num">Accepted</th>
            <th className="num">Undo</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id}>
              <td>
                {l.productName}
                {l.variantName && (
                  <span style={{ color: 'var(--text-secondary)' }}> — {l.variantName}</span>
                )}
              </td>
              <td className="num">{l.quantityAccepted}</td>
              <td className="num">
                <Input
                  type="number"
                  min={0}
                  max={l.quantityAccepted}
                  placeholder="0"
                  value={drafts[l.id] ?? ''}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [l.id]: e.target.value }))}
                  data-testid="undo-qty"
                  style={{ width: 72, padding: '4px 6px' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Field label="Correction notes (optional)">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: 280 }} />
        </Field>
        <Button
          variant="danger"
          onClick={() => void submit()}
          disabled={busy}
          data-testid="unreceive"
        >
          {busy ? 'Working…' : 'Un-receive'}
        </Button>
      </div>
    </Card>
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

  const [sodInvoiceId, setSodInvoiceId] = useState<string | null>(null);

  async function approve(id: string) {
    setBusy(true);
    try {
      await api(`/v1/vendor-invoices/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('Invoice approved.');
      await onChanged();
    } catch (err) {
      // G11 segregation of duties: you keyed it, so someone else signs.
      if (err instanceof ApiError && err.code === 'OVERRIDE_REQUIRED') {
        setSodInvoiceId(id);
      } else {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Vendor invoices" style={{ marginBottom: 16 }}>
      <SecurityOverrideDialog
        open={sodInvoiceId != null}
        title="Second sign-off needed — you recorded this invoice"
        usageClass={null}
        submitLabel="Approve invoice"
        perform={(payload) =>
          api(`/v1/vendor-invoices/${sodInvoiceId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ override: payload.override }),
          }).then(() => undefined)
        }
        onClose={() => setSodInvoiceId(null)}
        onSuccess={() => void onChanged()}
      />
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
