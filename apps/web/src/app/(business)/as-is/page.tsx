'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button, EmptyState, LoadingRows, PageHeader, Select, StatusBadge } from '@/components/ui';

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
  source: string;
  status: string;
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

  async function review(id: string, action: 'restock' | 'vendor_return' | 'scrap') {
    const labels = {
      restock: 'Restock into sellable inventory?',
      vendor_return: 'Mark as returned to vendor?',
      scrap: 'Scrap these units?',
    } as const;
    if (!window.confirm(labels[action])) return;
    setBusy(true);
    try {
      await api(`/v1/as-is/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      toast.success(`Reviewed: ${action.replace('_', ' ')}.`);
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
                          onClick={() => void review(r.id, 'vendor_return')}
                        >
                          Vendor
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() => void review(r.id, 'scrap')}
                        >
                          Scrap
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
        <Link href="/inventory">Inventory</Link>.
      </p>
    </div>
  );
}
