'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { Button, EmptyState, LoadingRows, PageHeader, Select, StatusBadge } from '@/components/ui';
import { SecurityOverrideDialog } from '@/components/security-override-dialog';

/**
 * As-Is review queue (PLAN-POS-OPERATIONS §10): everything a return,
 * warranty, or defect intake brought back. A manager/warehouse review
 * decides each row's fate — restock into sellable inventory (the same
 * variant, or its `-AS` as-is variant), send back to the vendor, or
 * scrap. Nothing here counts as sellable stock until restocked.
 */

interface AsIsRow {
  id: string;
  variantId: string;
  productName: string | null;
  variantName: string | null;
  sku: string | null;
  locationName: string | null;
  quantity: number;
  pieceNumber: string | null;
  condition: string | null;
  asIsPriceCents: number | null;
  storageLocation: string | null;
  source: string;
  status: string;
  vendorRaNumber: string | null;
  vendorCreditCents: number | null;
  vendorCreditStatus: string | null;
  notes: string | null;
  createdAt: string;
}

export default function AsIsPage() {
  const [status, setStatus] = useState('pending_review');
  const [rows, setRows] = useState<AsIsRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (s: string) => {
    try {
      setRows(await api<AsIsRow[]>(`/v1/as-is${s ? `?status=${s}` : ''}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load(status);
  }, [status, load]);

  const [scrapId, setScrapId] = useState<string | null>(null);
  const [pricePending, setPricePending] = useState<{ id: string; cents: number } | null>(null);

  // The as-is selling price is manager-gated (G10), so it needs a
  // dialog that can carry both the price and a manager challenge — a
  // native prompt could do neither.
  const [pricingId, setPricingId] = useState<string | null>(null);
  const [vendorReturnId, setVendorReturnId] = useState<string | null>(null);

  async function review(
    id: string,
    action: 'restock' | 'vendor_return',
    extra: Record<string, unknown> = {},
  ) {
    setBusy(true);
    try {
      await api(`/v1/as-is/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, ...extra }),
      });
      toast.success(`Reviewed: ${action.replace('_', ' ')}.`);
      await load(status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function vendorCredit(id: string, action: 'received' | 'write_off') {
    if (
      !window.confirm(action === 'received' ? 'Vendor credit received?' : 'Give up on this credit?')
    )
      return;
    setBusy(true);
    try {
      await api(`/v1/as-is/${id}/vendor-credit`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      await load(status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="As-Is review"
        sub="Returned, warranty, and defect units. Nothing here is sellable until a review restocks it."
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 180 }}>
            <option value="pending_review">Pending review</option>
            <option value="restocked">Restocked</option>
            <option value="vendor_return">Vendor returns</option>
            <option value="scrapped">Scrapped</option>
            <option value="">All</option>
          </Select>
        }
      />

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      {!rows && !error && <LoadingRows rows={4} />}
      {rows && rows.length === 0 && <EmptyState>Nothing here.</EmptyState>}

      {rows && rows.length > 0 && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" data-testid="as-is-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Qty</th>
                <th>Location</th>
                <th>Source</th>
                <th>Received</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-testid="as-is-row">
                  <td>
                    {r.productName ?? '(deleted)'}
                    {r.variantName && (
                      <span style={{ color: 'var(--text-secondary)' }}> — {r.variantName}</span>
                    )}
                    {r.sku && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 6 }}>
                        <code>{r.sku}</code>
                      </span>
                    )}
                    {r.notes && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.notes}</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {r.pieceNumber && <code>{r.pieceNumber}</code>}
                      {r.condition && <> · {r.condition.replace(/_/g, ' ')}</>}
                      {r.storageLocation && <> · {r.storageLocation}</>}
                      {r.asIsPriceCents != null && (
                        <> · as-is ${(r.asIsPriceCents / 100).toFixed(2)}</>
                      )}
                      {r.status === 'pending_review' && (
                        <>
                          {' '}
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0 4px', fontSize: 11 }}
                            disabled={busy}
                            onClick={() => setPricingId(r.id)}
                          >
                            price…
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="num">{r.quantity}</td>
                  <td>{r.locationName ?? '—'}</td>
                  <td>{r.source.replace(/_/g, ' ')}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.status === 'pending_review' && (
                      <span style={{ display: 'inline-flex', gap: 4 }}>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={busy}
                          onClick={() => void review(r.id, 'restock')}
                          data-testid="review-restock"
                        >
                          Restock
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => setVendorReturnId(r.id)}
                        >
                          Vendor
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          data-testid="review-scrap"
                          onClick={() => setScrapId(r.id)}
                        >
                          Scrap
                        </Button>
                      </span>
                    )}
                    {r.status === 'vendor_return' && r.vendorCreditStatus === 'open' && (
                      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          R/A {r.vendorRaNumber}
                          {r.vendorCreditCents != null &&
                            ` · $${(r.vendorCreditCents / 100).toFixed(2)} open`}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void vendorCredit(r.id, 'received')}
                        >
                          Credit received
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void vendorCredit(r.id, 'write_off')}
                        >
                          Give up
                        </Button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        Restock puts units back into the same SKU at the same location. To sell a unit as As-Is at a
        discount, restock it and adjust it onto the matching <code>-AS</code> SKU from{' '}
        <Link href="/inventory">Inventory</Link>. Scrapping is a write-off: it needs its own
        permission (or a manager&apos;s approval), a coded reason, and lands on the write-off
        register at cost.
      </p>

      <SecurityOverrideDialog
        open={pricingId != null}
        title="Set the as-is selling price"
        usageClass={null}
        submitLabel="Set price"
        fields={[
          {
            name: 'price',
            label: 'As-is selling price ($)',
            type: 'number',
            step: '0.01',
            min: 0,
            required: true,
          },
        ]}
        perform={(payload) =>
          api(`/v1/as-is/${pricingId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              asIsPriceCents: Math.round(Number(payload.values?.price ?? '0') * 100),
              override: payload.override,
            }),
          }).then(() => undefined)
        }
        onClose={() => setPricingId(null)}
        onSuccess={() => void load(status)}
      />

      <SecurityOverrideDialog
        open={vendorReturnId != null}
        title="Return to vendor"
        usageClass={null}
        submitLabel="Send back"
        fields={[
          { name: 'ra', label: 'Vendor R/A number', required: true, placeholder: 'RA-…' },
          {
            name: 'credit',
            label: 'Expected vendor credit ($, blank if unknown)',
            type: 'number',
            step: '0.01',
            min: 0,
          },
        ]}
        perform={async (payload) => {
          const credit = Number(payload.values?.credit ?? '');
          await review(vendorReturnId!, 'vendor_return', {
            raNumber: (payload.values?.ra ?? '').trim(),
            ...(credit > 0 ? { expectedCreditCents: Math.round(credit * 100) } : {}),
          });
        }}
        onClose={() => setVendorReturnId(null)}
        onSuccess={() => void load(status)}
      />

      <SecurityOverrideDialog
        open={scrapId != null}
        title="Scrap — write off these units"
        usageClass="write_off"
        submitLabel="Write off"
        perform={(payload) =>
          api(`/v1/as-is/${scrapId}/review`, {
            method: 'POST',
            body: JSON.stringify({ action: 'scrap', ...payload }),
          }).then(() => undefined)
        }
        onClose={() => setScrapId(null)}
        onSuccess={() => {
          toast.success('Written off — recorded on the shrink register.');
          void load(status);
        }}
      />
    </div>
  );
}
