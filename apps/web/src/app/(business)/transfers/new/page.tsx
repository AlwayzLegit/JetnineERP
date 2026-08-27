'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Card, EmptyState, Field, Input, PageHeader, Select } from '@/components/ui';

interface LocationRow {
  id: string;
  name: string;
}
interface VariantRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
}
interface Line {
  variantId: string;
  description: string;
  quantity: number;
  /** J3: specific pieces riding this line (ids of serial units). */
  serialIds: string[];
}

interface SerialRow {
  id: string;
  serial: string;
  status: string;
}

export default function NewTransferPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [transferType, setTransferType] = useState('replenishment');
  const [shipNow, setShipNow] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<VariantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const ls = await api<LocationRow[]>('/v1/pos/locations');
        setLocations(ls);
        if (ls.length > 0) setFromLocationId(ls[0]!.id);
        if (ls.length > 1) setToLocationId(ls[1]!.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  async function searchVariants() {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    try {
      const rows = await api<VariantRow[]>(
        `/v1/pos/lookup?q=${encodeURIComponent(search.trim())}&limit=200`,
      );
      setResults(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function addLine(v: VariantRow) {
    if (lines.some((l) => l.variantId === v.variantId)) return;
    setLines((prev) => [
      ...prev,
      {
        variantId: v.variantId,
        description: [v.productName, v.variantName].filter(Boolean).join(' — '),
        quantity: 1,
        serialIds: [],
      },
    ]);
    setSearch('');
    setResults([]);
  }

  // J3 serial picker: expand one line at a time; pieces come from the
  // origin location's in-stock serials.
  const [pickerLine, setPickerLine] = useState<number | null>(null);
  const [pickerSerials, setPickerSerials] = useState<SerialRow[]>([]);

  async function togglePicker(index: number) {
    if (pickerLine === index) {
      setPickerLine(null);
      return;
    }
    try {
      const rows = await api<SerialRow[]>(
        `/v1/serials?variantId=${lines[index]!.variantId}&locationId=${fromLocationId}&status=in_stock`,
      );
      setPickerSerials(rows);
      setPickerLine(index);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function toggleSerial(index: number, id: string) {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const has = l.serialIds.includes(id);
        if (!has && l.serialIds.length >= l.quantity) return l; // ≤ quantity
        return {
          ...l,
          serialIds: has ? l.serialIds.filter((x) => x !== id) : [...l.serialIds, id],
        };
      }),
    );
  }

  function setLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (fromLocationId === toLocationId) {
      setError('From and To must be different locations.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one line.');
      return;
    }
    setSaving(true);
    try {
      const created = await api<{ id: string }>('/v1/stock-transfers', {
        method: 'POST',
        body: JSON.stringify({
          fromLocationId,
          transferType,
          toLocationId,
          notes: notes || null,
          ship: shipNow,
          lines: lines.map((l) => ({
            variantId: l.variantId,
            quantity: Number(l.quantity),
            ...(l.serialIds.length > 0 ? { serialIds: l.serialIds } : {}),
          })),
        }),
      });
      router.push(`/transfers/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="New stock transfer" />
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="From location">
              <Select
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                style={{ width: '100%' }}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="To location">
              <Select
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                style={{ width: '100%' }}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Transfer type" style={{ marginTop: 8 }}>
            <Select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              data-testid="transfer-type"
              style={{ width: '100%' }}
            >
              <option value="replenishment">Replenishment</option>
              <option value="floor_sample">Floor sample</option>
              <option value="customer">Customer-driven</option>
              <option value="as_is">As-Is consolidation</option>
            </Select>
          </Field>
          <Field label="Notes" style={{ marginTop: 8 }}>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </Field>
          <label
            style={{ display: 'flex', gap: 6, fontSize: 13, marginTop: 8, alignItems: 'center' }}
          >
            <input
              type="checkbox"
              checked={shipNow}
              onChange={(e) => setShipNow(e.target.checked)}
            />
            Ship immediately (skip the draft step)
          </label>
        </Card>

        <Card title="Add items">
          <div className="flex flex-wrap gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void searchVariants();
                }
              }}
              placeholder="Search by name, SKU, or barcode"
              className="min-w-[200px] flex-1"
            />
            <Button type="button" variant="primary" onClick={searchVariants}>
              <Search size={14} />
              Search
            </Button>
          </div>
          {results.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {results.map((r) => (
                <button
                  key={r.variantId}
                  type="button"
                  onClick={() => addLine(r)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: 'var(--font)',
                    color: 'var(--text)',
                  }}
                >
                  <strong>{r.productName}</strong> {r.variantName && <>— {r.variantName}</>}{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{r.sku ?? '—'}</span>
                </button>
              ))}
              {results.length >= 200 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                  Showing first 200 matches — refine your search.
                </p>
              )}
            </div>
          )}
        </Card>

        <Card title="Lines">
          {lines.length === 0 ? (
            <EmptyState>
              No lines yet. Search for an item above to add it to the transfer.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <Fragment key={l.variantId}>
                      <tr>
                        <td>{l.description}</td>
                        <td>
                          <Input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
                            style={{ width: 80 }}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => void togglePicker(i)}
                          >
                            {l.serialIds.length > 0 ? `Pieces (${l.serialIds.length})` : 'Pieces'}
                          </Button>{' '}
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => removeLine(i)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                      {pickerLine === i && (
                        <tr>
                          <td colSpan={3} style={{ background: 'var(--surface-2, transparent)' }}>
                            {pickerSerials.length === 0 ? (
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                No in-stock serial pieces of this item at the origin.
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {pickerSerials.map((su) => (
                                  <label key={su.id} style={{ fontSize: 12.5 }}>
                                    <input
                                      type="checkbox"
                                      checked={l.serialIds.includes(su.id)}
                                      onChange={() => toggleSerial(i, su.id)}
                                    />{' '}
                                    <code>{su.serial}</code>
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <div>
          <Button type="submit" variant="primary" disabled={saving}>
            <Plus size={14} />
            {saving ? 'Saving…' : shipNow ? 'Create + ship' : 'Create draft'}
          </Button>
        </div>
      </form>
    </div>
  );
}
