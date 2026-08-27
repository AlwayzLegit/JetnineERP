'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
  Select,
} from '@/components/ui';

interface CountLine {
  id: string;
  variantId: string;
  sku: string | null;
  productName: string;
  binCode: string | null;
  frozenQty: number;
  frozenReserved: number;
  postFreezeDelta: number;
  countedQty: number | null;
  variance: number | null;
  reasonCodeId: string | null;
  postedVariance: number | null;
}

interface CountDetail {
  id: string;
  locationId: string;
  locationName: string;
  status: string;
  countDate: string;
  frozenAt: string;
  postedAt: string | null;
  notes: string | null;
  lines: CountLine[];
}

interface ReasonCode {
  id: string;
  code: string;
  description: string;
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  counting: 'Counting',
  posted: 'Posted',
  cancelled: 'Cancelled',
};

export default function PhysicalCountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [count, setCount] = useState<CountDetail | null>(null);
  const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reasonCodeId, setReasonCodeId] = useState('');
  const [skipUncounted, setSkipUncounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    try {
      setCount(await api<CountDetail>(`/v1/inventory/counts/${id}`));
      setDrafts({});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
    api<ReasonCode[]>('/v1/reason-codes?usageClass=physical_variance')
      .then(setReasonCodes)
      .catch(() => setReasonCodes([]));
  }, [id]);

  const live = count?.status === 'open' || count?.status === 'counting';

  const dirty = useMemo(() => {
    if (!count) return [];
    return count.lines
      .filter((l) => {
        const d = drafts[l.variantId];
        if (d === undefined || d.trim() === '') return false;
        const n = Number(d);
        return Number.isInteger(n) && n >= 0 && n !== l.countedQty;
      })
      .map((l) => ({ variantId: l.variantId, countedQty: Number(drafts[l.variantId]) }));
  }, [count, drafts]);

  const invalid = useMemo(() => {
    return Object.values(drafts).some((d) => {
      if (d.trim() === '') return false;
      const n = Number(d);
      return !Number.isInteger(n) || n < 0;
    });
  }, [drafts]);

  const uncounted = count?.lines.filter((l) => l.countedQty === null).length ?? 0;
  const variances = count?.lines.filter((l) => l.countedQty !== null && l.variance !== 0) ?? [];
  const needsReason = reasonCodes.length > 0 && variances.length > 0;

  async function saveCounts() {
    if (dirty.length === 0 || busy) return;
    setBusy(true);
    try {
      await api(`/v1/inventory/counts/${id}/lines`, {
        method: 'POST',
        body: JSON.stringify({ entries: dirty }),
      });
      toast.success(`Saved ${dirty.length} count(s)`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function post() {
    if (busy) return;
    if (dirty.length > 0) {
      toast.error('Save your entered counts first.');
      return;
    }
    if (needsReason && !reasonCodeId) {
      toast.error('Pick a variance reason code before posting.');
      return;
    }
    const msg =
      `Post this count? ${variances.length} variance line(s) will adjust stock` +
      (uncounted > 0 ? `; ${uncounted} uncounted line(s) will be left unchanged.` : '.');
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      const res = await api<{ posted: number; skipped: number; varianceUnits: number }>(
        `/v1/inventory/counts/${id}/post`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...(reasonCodeId ? { reasonCodeId } : {}),
            ...(uncounted > 0 ? { skipUncounted: true } : {}),
          }),
        },
      );
      toast.success(
        `Posted — ${res.posted} variance line(s), ${res.varianceUnits} unit(s) adjusted`,
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancelCount() {
    if (busy) return;
    if (!confirm('Cancel this count? Entered counts are discarded and stock is unchanged.')) return;
    setBusy(true);
    try {
      await api(`/v1/inventory/counts/${id}/cancel`, { method: 'POST', body: '{}' });
      toast.success('Count cancelled');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={count ? `Count — ${count.locationName}` : 'Physical count'}
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href={`/print/counts/${id}`} variant="secondary">
              <Printer size={14} />
              Count sheet
            </LinkButton>
            <LinkButton href="/inventory/counts" variant="ghost">
              All counts
            </LinkButton>
          </div>
        }
      />

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {count == null ? (
        <Card>
          <LoadingRows />
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1" style={{ fontSize: 13 }}>
              <span>
                Status: <strong>{STATUS_LABEL[count.status] ?? count.status}</strong>
              </span>
              <span>Date: {new Date(`${count.countDate}T00:00:00`).toLocaleDateString()}</span>
              <span>Frozen: {new Date(count.frozenAt).toLocaleString()}</span>
              {count.postedAt && <span>Posted: {new Date(count.postedAt).toLocaleString()}</span>}
              <span>
                Counted: {count.lines.length - uncounted}/{count.lines.length}
              </span>
              {count.notes && <span>Notes: {count.notes}</span>}
            </div>
            {live && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                Expected = frozen snapshot plus stock movement since the freeze, so sales made
                during the count do not show up as shrink. Variance = counted − expected.
              </p>
            )}
          </Card>

          <Card style={{ padding: 0 }} className="mb-4">
            {count.lines.length === 0 ? (
              <EmptyState>No lines on this count.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Bin</th>
                      <th>SKU</th>
                      <th>Item</th>
                      <th className="num">Expected</th>
                      <th className="num">Counted</th>
                      <th className="num">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {count.lines.map((l) => {
                      const expected = l.frozenQty + l.postFreezeDelta;
                      const draft = drafts[l.variantId];
                      const shownVariance =
                        count.status === 'posted' ? l.postedVariance : l.variance;
                      return (
                        <tr key={l.id}>
                          <td>{l.binCode ?? '—'}</td>
                          <td>
                            <code>{l.sku ?? '—'}</code>
                          </td>
                          <td>{l.productName}</td>
                          <td className="num">{expected}</td>
                          <td className="num">
                            {live ? (
                              <Input
                                value={draft ?? (l.countedQty === null ? '' : String(l.countedQty))}
                                onChange={(e) =>
                                  setDrafts((d) => ({ ...d, [l.variantId]: e.target.value }))
                                }
                                inputMode="numeric"
                                placeholder="—"
                                style={{ width: 72, textAlign: 'right' }}
                              />
                            ) : (
                              (l.countedQty ?? '—')
                            )}
                          </td>
                          <td
                            className="num"
                            style={
                              shownVariance != null && shownVariance !== 0
                                ? { color: 'var(--danger)', fontWeight: 600 }
                                : undefined
                            }
                          >
                            {shownVariance == null
                              ? '—'
                              : shownVariance > 0
                                ? `+${shownVariance}`
                                : shownVariance}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {live && (
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  disabled={dirty.length === 0 || invalid || busy}
                  onClick={() => void saveCounts()}
                >
                  {busy ? 'Working…' : `Save ${dirty.length || ''} count(s)`}
                </Button>
                {needsReason && (
                  <Select value={reasonCodeId} onChange={(e) => setReasonCodeId(e.target.value)}>
                    <option value="">— Variance reason —</option>
                    {reasonCodes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} — {r.description}
                      </option>
                    ))}
                  </Select>
                )}
                {uncounted > 0 && (
                  <label
                    className="flex items-center gap-1"
                    style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                  >
                    <input
                      type="checkbox"
                      checked={skipUncounted}
                      onChange={(e) => setSkipUncounted(e.target.checked)}
                    />
                    Leave {uncounted} uncounted line(s) unchanged
                  </label>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || (uncounted > 0 && !skipUncounted)}
                  onClick={() => void post()}
                >
                  Post count
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void cancelCount()}
                >
                  Cancel count
                </Button>
                {invalid && (
                  <span style={{ fontSize: 12, color: 'var(--danger)' }}>
                    Counts must be whole numbers ≥ 0.
                  </span>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
