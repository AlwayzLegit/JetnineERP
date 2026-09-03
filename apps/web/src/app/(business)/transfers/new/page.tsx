'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Alert,
  BackLink,
  Button,
  Card,
  EmptyState,
  Field,
  FormActions,
  FormGrid,
  Input,
  LinkButton,
  PageHeader,
  Select,
  Stack,
  TableWrap,
  Toolbar,
} from '@/components/ui';

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
  /** D18: total wanted; blank = no hold. Remainder above quantity is held. */
  quantityOrdered: string;
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
  const [searching, setSearching] = useState(false);
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
    setSearching(true);
    try {
      const rows = await api<VariantRow[]>(
        `/v1/pos/lookup?q=${encodeURIComponent(search.trim())}&limit=200`,
      );
      setResults(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
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
        quantityOrdered: '',
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
            ...(l.quantityOrdered !== '' && Number(l.quantityOrdered) > Number(l.quantity)
              ? { quantityOrdered: Number(l.quantityOrdered) }
              : {}),
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
      <PageHeader
        eyebrow={<BackLink href="/transfers">All transfers</BackLink>}
        title="New stock transfer"
      />
      <form onSubmit={submit}>
        <Stack>
          <Card title="Details">
            <FormGrid cols={2}>
              <Field label="From location" required>
                <Select value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)}>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="To location" required>
                <Select value={toLocationId} onChange={(e) => setToLocationId(e.target.value)}>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Transfer type">
                <Select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value)}
                  data-testid="transfer-type"
                >
                  <option value="replenishment">Replenishment</option>
                  <option value="floor_sample">Floor sample</option>
                  <option value="customer">Customer-driven</option>
                  <option value="as_is">As-Is consolidation</option>
                </Select>
              </Field>
              <Field label="Notes" className="form-span">
                <textarea
                  className="textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </Field>
              <div className="form-span">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={shipNow}
                    onChange={(e) => setShipNow(e.target.checked)}
                  />
                  Ship immediately (skip the draft step)
                </label>
                {shipNow && (
                  <p className="field-hint">
                    Blocked when a printed transfer ticket is required before shipping (the default)
                    — create the draft, print the ticket, then ship.
                  </p>
                )}
              </div>
            </FormGrid>
          </Card>

          <Card title="Add items">
            <Toolbar>
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
                aria-label="Search items"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={searchVariants}
                disabled={searching}
              >
                <Search size={14} aria-hidden />
                {searching ? 'Searching…' : 'Search'}
              </Button>
            </Toolbar>
            {results.length > 0 && (
              <TableWrap>
                <table className="table table-dense">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th className="actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => {
                      const staged = lines.some((l) => l.variantId === r.variantId);
                      return (
                        <tr key={r.variantId}>
                          <td>
                            <strong>{r.productName}</strong>
                            {r.variantName && <span className="muted"> — {r.variantName}</span>}
                          </td>
                          <td>
                            <code>{r.sku ?? '—'}</code>
                          </td>
                          <td className="actions">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={staged}
                              onClick={() => addLine(r)}
                            >
                              {staged ? 'Added' : 'Add'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {results.length >= 200 && (
                  <div className="table-empty">Showing first 200 matches — refine your search.</div>
                )}
              </TableWrap>
            )}
          </Card>

          <Card title="Lines" flush={lines.length > 0}>
            {lines.length === 0 ? (
              <EmptyState title="No lines yet">
                Search for an item above to add it to the transfer.
              </EmptyState>
            ) : (
              <TableWrap>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="num">Quantity</th>
                      <th className="num">Ordered (hold)</th>
                      <th className="actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <Fragment key={l.variantId}>
                        <tr>
                          <td>{l.description}</td>
                          <td className="num">
                            <Input
                              type="number"
                              min={1}
                              aria-label={`Quantity for ${l.description}`}
                              value={l.quantity}
                              onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
                              className="w-20"
                            />
                          </td>
                          <td className="num">
                            <Input
                              type="number"
                              min={l.quantity}
                              placeholder="—"
                              aria-label={`Ordered quantity for ${l.description}`}
                              title="Total wanted (D18): anything above the shipped quantity is held and rolls into a new draft on receipt"
                              value={l.quantityOrdered}
                              onChange={(e) => setLine(i, { quantityOrdered: e.target.value })}
                              className="w-20"
                            />
                          </td>
                          <td className="actions">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              aria-expanded={pickerLine === i}
                              onClick={() => void togglePicker(i)}
                            >
                              {l.serialIds.length > 0 ? `Pieces (${l.serialIds.length})` : 'Pieces'}
                            </Button>
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
                            <td colSpan={4} className="bg-surface-muted">
                              {pickerSerials.length === 0 ? (
                                <span className="muted">
                                  No in-stock serial pieces of this item at the origin.
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {pickerSerials.map((su) => (
                                    <label key={su.id} className="flex items-center gap-1.5">
                                      <input
                                        type="checkbox"
                                        checked={l.serialIds.includes(su.id)}
                                        onChange={() => toggleSerial(i, su.id)}
                                      />
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
              </TableWrap>
            )}
          </Card>

          {error && <Alert tone="error">{error}</Alert>}
          <FormActions>
            <LinkButton href="/transfers" variant="secondary">
              Cancel
            </LinkButton>
            <Button type="submit" variant="primary" disabled={saving}>
              <Plus size={14} aria-hidden />
              {saving ? 'Saving…' : shipNow ? 'Create + ship' : 'Create draft'}
            </Button>
          </FormActions>
        </Stack>
      </form>
    </div>
  );
}
