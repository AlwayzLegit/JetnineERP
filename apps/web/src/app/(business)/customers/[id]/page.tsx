'use client';

import Link from 'next/link';
import { Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, EmptyState, Field, Input, LoadingRows, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { autofillFormFromZip, type ZipHit } from '@/lib/zip-lookup';
import { downloadFile } from '@/lib/download';
import { Money } from '@/components/money';

interface CustomerSummary {
  lifetime: { documents: number; totalCents: number };
  ytd: { documents: number; totalCents: number };
  openOrders: {
    id: string;
    number: string;
    status: string;
    totalCents: number;
    paidCents: number;
    balanceCents: number;
    requestedDate: string | null;
  }[];
}

interface SaleSummary {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  completedAt: string | null;
  createdAt: string;
}
interface CustomerAddress {
  label?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
}
interface Customer {
  id: string;
  email: string | null;
  phone: string | null;
  phone2: string | null;
  firstName: string | null;
  lastName: string | null;
  notes: string | null;
  addressesJson: CustomerAddress[] | null;
  referralSource: string | null;
  createdAt: string;
  updatedAt: string;
  recentSales: SaleSummary[];
}

/** Entry labeled `delivery` (or the first) / labeled `billing` (or the second). */
function pickAddress(
  list: CustomerAddress[] | null,
  kind: 'delivery' | 'billing',
): CustomerAddress {
  const arr = Array.isArray(list) ? list : [];
  const labeled = arr.find((a) => a?.label === kind);
  if (labeled) return labeled;
  return (kind === 'delivery' ? arr.find((a) => a?.label !== 'billing') : arr[1]) ?? {};
}
interface HistoryLine {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  taxCents: number;
  qtyFulfilled: number;
  qtyReturned: number;
  fulfillmentMethod: string | null;
}
interface HistoryOrder {
  id: string;
  docType: 'order' | 'sale';
  number: string;
  status: string;
  orderKind: string;
  fulfillmentType: string;
  requestedDate: string | null;
  importedAt: string | null;
  createdAt: string;
  totalCents: number;
  paidCents: number;
  balanceDueCents: number;
  lines: HistoryLine[];
}

function lineStateLabel(l: HistoryLine): string {
  const parts: string[] = [];
  if (l.qtyFulfilled >= l.quantity) parts.push('delivered');
  else if (l.qtyFulfilled > 0) parts.push(`delivered ${l.qtyFulfilled}/${l.quantity}`);
  else parts.push('pending');
  if (l.qtyReturned > 0) parts.push(`returned ${l.qtyReturned}`);
  if (l.fulfillmentMethod === 'take_with' || l.fulfillmentMethod === 'pickup')
    parts.push('take-with');
  return parts.join(' · ');
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = (params?.id ?? '') as string;
  const [c, setC] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  // ZIP → city/state autofill memory per address block (delivery/billing).
  const zipMemos = useRef<Record<'d' | 'b', { current: ZipHit | null }>>({
    d: { current: null },
    b: { current: null },
  });
  const zipMemo = (prefix: 'd' | 'b') => zipMemos.current[prefix];
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [credit, setCredit] = useState<{
    balanceCents: number;
    entries: { id: string; deltaCents: number; reason: string | null; createdAt: string }[];
  } | null>(null);
  const [history, setHistory] = useState<HistoryOrder[] | null>(null);
  const [dupes, setDupes] = useState<
    {
      id: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      email: string | null;
      matchedBy: string;
      docCount: number;
    }[]
  >([]);
  const [merging, setMerging] = useState(false);

  async function load() {
    setError(null);
    try {
      setC(await api<Customer>(`/v1/customers/${id}`));
      void api<{
        balanceCents: number;
        entries: { id: string; deltaCents: number; reason: string | null; createdAt: string }[];
      }>(`/v1/customers/${id}/store-credit`)
        .then(setCredit)
        .catch(() => setCredit(null));
      void api<HistoryOrder[]>(`/v1/customers/${id}/order-history?limit=25`)
        .then(setHistory)
        .catch(() => setHistory(null));
      void api<typeof dupes>(`/v1/customers/${id}/duplicates`)
        .then(setDupes)
        .catch(() => setDupes([]));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function mergeDupe(sourceId: string) {
    const d = dupes.find((x) => x.id === sourceId);
    const label = d ? [d.firstName, d.lastName].filter(Boolean).join(' ') || 'this duplicate' : '';
    if (
      !window.confirm(
        `Merge ${label} into this record? Their orders, receipts, and credit move here, and the duplicate is deleted. This cannot be undone.`,
      )
    ) {
      return;
    }
    setMerging(true);
    try {
      await api(`/v1/customers/${id}/merge`, {
        method: 'POST',
        body: JSON.stringify({ sourceCustomerId: sourceId }),
      });
      toast.success('Merged — one customer, one history.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setMerging(false);
    }
  }
  useEffect(() => {
    if (!id) return;
    api<CustomerSummary>(`/v1/customers/${id}/summary`)
      .then(setSummary)
      .catch(() => setSummary(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = new FormData(e.currentTarget);
      const addrFrom = (prefix: string, label: string) => {
        const entry = {
          label,
          line1: blankToNull(data.get(`${prefix}_line1`)),
          line2: blankToNull(data.get(`${prefix}_line2`)),
          city: blankToNull(data.get(`${prefix}_city`)),
          region: blankToNull(data.get(`${prefix}_region`)),
          postalCode: blankToNull(data.get(`${prefix}_postalCode`)),
        };
        return entry.line1 || entry.city ? entry : null;
      };
      const delivery = addrFrom('d', 'delivery');
      const billing = addrFrom('b', 'billing');
      const addresses = [...(delivery ? [delivery] : []), ...(billing ? [billing] : [])];
      await api(`/v1/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: blankToNull(data.get('firstName')),
          lastName: blankToNull(data.get('lastName')),
          email: blankToNull(data.get('email')),
          phone: blankToNull(data.get('phone')),
          phone2: blankToNull(data.get('phone2')),
          notes: blankToNull(data.get('notes')),
          referralSource: blankToNull(data.get('referralSource')),
          addressesJson: addresses.length > 0 ? addresses : null,
        }),
      });
      setSaved(true);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!confirm('Delete this customer? Past sales remain but lose the link.')) return;
    try {
      await api(`/v1/customers/${id}`, { method: 'DELETE' });
      router.push('/customers');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  if (error && !c) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!c) return <LoadingRows />;

  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || '(no name)';

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/customers">← All customers</Link>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {name}
        </h1>
        <Link
          href={`/customers/${id}/activity`}
          className="btn"
          data-testid="view-activity"
          style={{ marginLeft: 'auto' }}
        >
          View customer activity
        </Link>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 24px' }}>
        Customer since {new Date(c.createdAt).toLocaleDateString()}
      </p>

      <Card title="Details">
        <form onSubmit={save} style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="First name">
              <Input name="firstName" defaultValue={c.firstName ?? ''} style={{ width: '100%' }} />
            </Field>
            <Field label="Last name">
              <Input name="lastName" defaultValue={c.lastName ?? ''} style={{ width: '100%' }} />
            </Field>
          </div>
          <Field label="Email">
            <Input
              name="email"
              type="email"
              defaultValue={c.email ?? ''}
              style={{ width: '100%' }}
            />
          </Field>
          <Field label="Phone">
            <Input name="phone" defaultValue={c.phone ?? ''} style={{ width: '100%' }} />
          </Field>
          <Field label="2nd phone (optional)">
            <Input name="phone2" defaultValue={c.phone2 ?? ''} style={{ width: '100%' }} />
          </Field>
          <Field label="How did they hear about us?">
            <Input
              name="referralSource"
              defaultValue={c.referralSource ?? ''}
              style={{ width: '100%' }}
            />
          </Field>
          {(['d', 'b'] as const).map((prefix) => {
            const kind = prefix === 'd' ? 'delivery' : 'billing';
            const a = pickAddress(c.addressesJson, kind);
            return (
              <div key={prefix} style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {kind === 'delivery' ? 'Delivery address' : 'Billing address (if different)'}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    name={`${prefix}_line1`}
                    placeholder="Street address"
                    defaultValue={a.line1 ?? ''}
                    style={{ width: '100%' }}
                  />
                  <Input
                    name={`${prefix}_line2`}
                    placeholder="Apt / unit"
                    defaultValue={a.line2 ?? ''}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    name={`${prefix}_city`}
                    placeholder="City"
                    defaultValue={a.city ?? ''}
                    style={{ width: '100%' }}
                  />
                  <Input
                    name={`${prefix}_region`}
                    placeholder="State"
                    defaultValue={a.region ?? ''}
                    style={{ width: '100%' }}
                  />
                  <Input
                    name={`${prefix}_postalCode`}
                    placeholder="ZIP"
                    defaultValue={a.postalCode ?? ''}
                    style={{ width: '100%' }}
                    onChange={(e) =>
                      autofillFormFromZip(
                        e.currentTarget,
                        { city: `${prefix}_city`, region: `${prefix}_region` },
                        zipMemo(prefix),
                      )
                    }
                  />
                </div>
              </div>
            );
          })}
          <Field label="Notes">
            <textarea
              name="notes"
              defaultValue={c.notes ?? ''}
              rows={3}
              className="textarea"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </Field>
          {error && <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
          {saved && <p style={{ color: 'var(--success)', margin: 0, fontSize: 13 }}>Saved.</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save size={14} aria-hidden />
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="danger" onClick={destroy}>
              <Trash2 size={14} aria-hidden />
              Delete customer
            </Button>
          </div>
        </form>
      </Card>

      {dupes.length > 0 && (
        <Card title="Possible duplicates" style={{ marginTop: 16 }} data-testid="duplicates-card">
          <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--text-secondary)' }}>
            These records look like the same person. Merging moves their whole history — orders,
            receipts, store credit, notes — onto THIS record and deletes the duplicate.
          </p>
          <div style={{ display: 'grid', gap: 6 }}>
            {dupes.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  fontSize: 13,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                }}
              >
                <Link href={`/customers/${d.id}`}>
                  <strong>
                    {[d.firstName, d.lastName].filter(Boolean).join(' ') || 'unnamed'}
                  </strong>
                </Link>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {[d.phone, d.email].filter(Boolean).join(' · ') || 'no contact info'} · same{' '}
                  {d.matchedBy} · {d.docCount} document{d.docCount === 1 ? '' : 's'}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={merging}
                  data-testid={`merge-${d.id}`}
                  style={{ marginLeft: 'auto' }}
                  onClick={() => void mergeDupe(d.id)}
                >
                  Merge into this record
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      {credit && (credit.balanceCents > 0 || credit.entries.length > 0) && (
        <Card title="Store credit" style={{ marginTop: 16 }}>
          <p style={{ fontSize: 14, marginTop: 0 }} data-testid="store-credit-balance">
            Balance: <strong>${(credit.balanceCents / 100).toFixed(2)}</strong>
            <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>
              never expires — auto-surfaces at checkout (§10)
            </span>
          </p>
          {credit.entries.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
              {credit.entries.slice(0, 10).map((e) => (
                <li key={e.id}>
                  {new Date(e.createdAt).toLocaleDateString()} —{' '}
                  <span style={{ color: e.deltaCents > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {e.deltaCents > 0 ? '+' : ''}${(e.deltaCents / 100).toFixed(2)}
                  </span>
                  {e.reason ? ` · ${e.reason}` : ''}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {summary && (
        <Card title="Activity totals" style={{ marginTop: 16 }} data-testid="customer-totals">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lifetime documents</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{summary.lifetime.documents}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lifetime total</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                <Money cents={summary.lifetime.totalCents} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>YTD documents</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{summary.ytd.documents}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>YTD total</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                <Money cents={summary.ytd.totalCents} />
              </div>
            </div>
          </div>
        </Card>
      )}
      {summary && summary.openOrders.length > 0 && (
        <Card title="Open orders" style={{ marginTop: 16 }} data-testid="customer-open-orders">
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th className="num">Total</th>
                  <th className="num">Paid</th>
                  <th className="num">Balance</th>
                </tr>
              </thead>
              <tbody>
                {summary.openOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/orders/${o.id}`}>{o.number}</Link>
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td>{o.requestedDate ?? '—'}</td>
                    <td className="num">
                      <Money cents={o.totalCents} />
                    </td>
                    <td className="num">
                      <Money cents={o.paidCents} />
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      <Money cents={o.balanceCents} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Card title="Purchase history" style={{ marginTop: 16 }} data-testid="purchase-history">
        <Button
          size="sm"
          variant="secondary"
          style={{ marginBottom: 10 }}
          onClick={() => {
            const start = '2000-01-01';
            const end = new Date().toISOString().slice(0, 10);
            void downloadFile(
              `/v1/reports/customer-purchases?customerId=${id}&start=${start}&end=${end}&format=csv`,
              `purchases-${id}.csv`,
            ).catch((err: unknown) =>
              toast.error(err instanceof Error ? err.message : String(err)),
            );
          }}
        >
          Export purchase history CSV
        </Button>
        {!history || history.length === 0 ? (
          <EmptyState>No purchases yet.</EmptyState>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {history.map((o) => (
              <div
                key={o.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                }}
                data-testid="history-order"
              >
                <div
                  className="flex flex-wrap items-center gap-2"
                  style={{ justifyContent: 'space-between' }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={o.docType === 'sale' ? `/sales/${o.id}` : `/orders/${o.id}`}
                      style={{ fontWeight: 600 }}
                    >
                      {o.number}
                    </Link>
                    <StatusBadge status={o.status} />
                    {o.docType === 'sale' && (
                      <span className="muted" style={{ fontSize: 12 }}>
                        receipt
                      </span>
                    )}
                    {o.orderKind === 'exchange' && (
                      <span className="muted" style={{ fontSize: 12 }}>
                        exchange
                      </span>
                    )}
                    {o.importedAt && (
                      <span className="muted" style={{ fontSize: 12 }}>
                        imported from STORIS
                      </span>
                    )}
                    <span className="muted" style={{ fontSize: 12.5 }}>
                      {new Date(o.createdAt).toLocaleDateString()}
                      {o.requestedDate ? ` · promised ${o.requestedDate}` : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <Money cents={o.totalCents} />
                    {o.balanceDueCents > 0 ? (
                      <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                        owes <Money cents={o.balanceDueCents} />
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success)', marginLeft: 8 }}>paid</span>
                    )}
                  </div>
                </div>
                {o.lines.length > 0 && (
                  <div style={{ overflowX: 'auto', marginTop: 6 }}>
                    <table className="table" style={{ fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th className="num">Qty</th>
                          <th className="num">Unit price</th>
                          <th className="num">Line total</th>
                          <th>State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.lines.map((l) => (
                          <tr key={l.id}>
                            <td>{l.description}</td>
                            <td className="num">{l.quantity}</td>
                            <td className="num">
                              <Money cents={l.unitPriceCents} />
                            </td>
                            <td className="num">
                              <Money cents={l.totalCents + l.taxCents} />
                            </td>
                            <td className="muted" style={{ fontSize: 12 }}>
                              {lineStateLabel(l)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function blankToNull(v: FormDataEntryValue | null): string | null {
  const s = v == null ? '' : String(v).trim();
  return s.length > 0 ? s : null;
}
