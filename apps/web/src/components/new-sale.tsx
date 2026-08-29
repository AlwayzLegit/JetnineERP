'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Search, X } from 'lucide-react';
import { formatMoney } from '@jetnine/shared';
import { api, ApiError } from '@/lib/api';
import { SecurityOverrideDialog } from '@/components/security-override-dialog';
import { Money } from '@/components/money';
import { Button, Card, Field, Input, Select } from '@/components/ui';

/**
 * New Sale — the single-screen order entry from PLAN-POS-OPERATIONS §4
 * (amendment A3: supersedes the three-step wizard; A4: the quick-sale
 * register is retired and take-with flows through here).
 *
 * Customer, merchandise, and payment all live on one screen: universal
 * customer search up top, an Add Product popup with stock/ATP awareness,
 * auto recycling-fee lines, and a pinned totals + payments rail. Complete
 * posts the order (or a plain register sale for a fully-paid take-with),
 * Save as Draft parks it store-wide.
 */

const FULFILLMENTS = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'pickup', label: 'Customer pickup' },
  { value: 'take_with', label: 'Take-with' },
  { value: 'direct_ship', label: 'Direct ship' },
] as const;
type Fulfillment = (typeof FULFILLMENTS)[number]['value'];

const TENDERS = [
  { value: 'card', label: 'Credit card' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'synchrony', label: 'Synchrony' },
  { value: 'acima', label: 'Acima' },
  { value: 'store_credit', label: 'Store credit' },
] as const;
type Tender = (typeof TENDERS)[number]['value'];

/** Product categories that legally carry the CA recycling fee per unit. */
const RECYCLING_RE = /\b(mattress|foundation|adjustable\s*base|box\s*spring)\b/i;
const RECYCLING_DESC = 'Recycling Fee';

interface CustomerHit {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  addressesJson: { line1?: string | null; city?: string | null; region?: string | null }[] | null;
}
interface SearchRow {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  priceCents: number;
  vendorId: string | null;
  vendorName: string | null;
  availableHere: number;
  availableTotal: number;
  atpDate: string | null;
}
interface Line {
  key: string;
  variantId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineDiscountCents: number;
  lineType: 'stock' | 'special_order' | 'custom';
  fulfillmentMethod: '' | Fulfillment;
  deliveryDate: string;
  availableHere?: number;
  atpDate?: string | null;
}
interface PaymentLine {
  key: string;
  method: Tender;
  amountCents: number;
  ref: string;
}
interface LocationRow {
  id: string;
  name: string;
  taxRateBps: number | null;
  locationType?: string;
}
interface MemberRow {
  membershipId: string;
  name: string | null;
  email: string;
  status: string;
}
interface VendorRow {
  id: string;
  name: string;
}
interface DraftRow {
  id: string;
  number: string;
  customerId: string;
  totalCents: number;
  createdAt: string;
}

let lineKeySeq = 0;
const nextKey = () => `l${++lineKeySeq}`;

export function NewSale({ exchangeOf }: { exchangeOf?: string } = {}) {
  const router = useRouter();

  // --- reference data ---
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationId, setLocationId] = useState('');
  // Fulfill-from: which location's stock this order reserves/consumes.
  // '' = same as the selling store.
  const [stockLocationId, setStockLocationId] = useState('');
  const [taxRateBps, setTaxRateBps] = useState(0);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [recyclingFeeCents, setRecyclingFeeCents] = useState(1050);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [resumedDraftId, setResumedDraftId] = useState<string | null>(null);

  // --- customer ---
  const [customer, setCustomer] = useState<CustomerHit | null>(null);
  const [storeCredit, setStoreCredit] = useState<number | null>(null);
  const [openOrders, setOpenOrders] = useState<
    { id: string; number: string; requestedDate: string | null; deliveryDate: string | null }[]
  >([]);
  const [exchangeOriginal, setExchangeOriginal] = useState<{
    id: string;
    number: string;
  } | null>(null);
  const [custQuery, setCustQuery] = useState('');
  const [custHits, setCustHits] = useState<CustomerHit[]>([]);
  const [custMore, setCustMore] = useState(false);
  const [custOpen, setCustOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const custTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- ship to ---
  const [shipDiffers, setShipDiffers] = useState(false);
  const [ship, setShip] = useState({
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    phone: '',
  });

  // --- order meta ---
  const [orderType, setOrderType] = useState<'sales_order' | 'layaway' | 'quote'>('sales_order');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [requestedDate, setRequestedDate] = useState('');
  const [dayCapacity, setDayCapacity] = useState<{ booked: number; cap: number } | null>(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [salespeople, setSalespeople] = useState<string[]>([]);

  // --- lines ---
  const [lines, setLines] = useState<Line[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // --- money ---
  const [orderDiscount, setOrderDiscount] = useState('');
  const [installFee, setInstallFee] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [payMethod, setPayMethod] = useState<Tender>('card');
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [priceGateMode, setPriceGateMode] = useState<'complete' | 'draft' | null>(null);
  const [done, setDone] = useState<{ id: string; number: string; kind: 'order' | 'sale' } | null>(
    null,
  );

  // §7: while writing a delivery sale, show how many stops the chosen
  // day still has against the soft cap.
  useEffect(() => {
    if (fulfillment !== 'delivery' || !requestedDate) {
      setDayCapacity(null);
      return;
    }
    let stale = false;
    api<{ cap: number; days: { booked: number }[] }>(
      `/v1/deliveries/capacity?from=${requestedDate}&to=${requestedDate}`,
    )
      .then((r) => {
        if (!stale) setDayCapacity({ booked: r.days[0]?.booked ?? 0, cap: r.cap });
      })
      .catch(() => setDayCapacity(null));
    return () => {
      stale = true;
    };
  }, [fulfillment, requestedDate]);

  // G14: the customer's open orders — two orders, same house, same
  // week is two trucks and pure margin loss.
  useEffect(() => {
    if (!customer) {
      setOpenOrders([]);
      return;
    }
    let stale = false;
    api<
      { id: string; number: string; requestedDate: string | null; deliveryDate: string | null }[]
    >(`/v1/customers/${customer.id}/open-orders`)
      .then((r) => {
        if (!stale) setOpenOrders(r);
      })
      .catch(() => setOpenOrders([]));
    return () => {
      stale = true;
    };
  }, [customer]);

  // §10: store credit auto-surfaces at checkout.
  useEffect(() => {
    if (!customer) {
      setStoreCredit(null);
      return;
    }
    let stale = false;
    api<{ balanceCents: number }>(`/v1/customers/${customer.id}/store-credit`)
      .then((r) => {
        if (!stale) setStoreCredit(r.balanceCents);
      })
      .catch(() => setStoreCredit(null));
    return () => {
      stale = true;
    };
  }, [customer]);

  // §10 exchange mode: pull the original order and pin its customer.
  useEffect(() => {
    if (!exchangeOf) return;
    let stale = false;
    api<{
      id: string;
      number: string;
      customerId: string;
    }>(`/v1/orders/${exchangeOf}`)
      .then(async (o) => {
        if (stale) return;
        setExchangeOriginal({ id: o.id, number: o.number });
        const c = await api<CustomerHit>(`/v1/customers/${o.customerId}`).catch(() => null);
        if (!stale && c) setCustomer(c);
      })
      .catch(() => setExchangeOriginal(null));
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeOf]);

  const loadDrafts = useCallback(() => {
    void api<{ data: DraftRow[] }>('/v1/orders?status=draft&limit=30')
      .then((r) => setDrafts(r.data))
      .catch(() => setDrafts([]));
  }, []);

  useEffect(() => {
    void api<LocationRow[]>('/v1/pos/locations')
      .then((locs) => {
        setLocations(locs);
        if (locs[0]) {
          setLocationId(locs[0].id);
          setTaxRateBps(locs[0].taxRateBps ?? 0);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
    void api<MemberRow[]>('/v1/business/members')
      .then((rows) => setMembers(rows.filter((m) => m.status === 'active')))
      .catch(() => setMembers([]));
    void api<{ ops: { recyclingFeeCents?: number | null } | null }>('/v1/business/settings')
      .then((s) => {
        if (s.ops?.recyclingFeeCents != null) setRecyclingFeeCents(s.ops.recyclingFeeCents);
      })
      .catch(() => undefined);
    loadDrafts();
  }, [loadDrafts]);

  // Universal customer search: name, phone, email, or address — debounced.
  useEffect(() => {
    if (custTimer.current) clearTimeout(custTimer.current);
    const q = custQuery.trim();
    if (q.length < 2) {
      setCustHits([]);
      return;
    }
    custTimer.current = setTimeout(() => {
      void api<{ data: CustomerHit[]; nextCursor: string | null }>(
        `/v1/customers?q=${encodeURIComponent(q)}&limit=20`,
      )
        .then((r) => {
          setCustHits(r.data);
          // The q-search branch server-side is a single ranked page with
          // nextCursor always null, so a full page is the truncation signal.
          setCustMore(r.nextCursor != null || r.data.length >= 20);
          setCustOpen(true);
        })
        .catch(() => {
          setCustHits([]);
          setCustMore(false);
        });
    }, 250);
  }, [custQuery]);

  const sourceLocationId = stockLocationId || locationId;
  const sourceLocation = locations.find((l) => l.id === sourceLocationId);

  const totals = useMemo(() => {
    let merchandise = 0;
    let recycling = 0;
    let lineDiscount = 0;
    for (const l of lines) {
      const gross = l.quantity * l.unitPriceCents;
      if (l.lineType === 'custom' && l.description === RECYCLING_DESC) recycling += gross;
      else merchandise += gross;
      lineDiscount += Math.min(l.lineDiscountCents, gross);
    }
    const install = parseDollars(installFee);
    const delivery = parseDollars(deliveryFee);
    const afterLines = merchandise - lineDiscount;
    const orderDisc = Math.min(parseDollars(orderDiscount), Math.max(0, afterLines));
    // Tax applies to taxable merchandise only — custom lines (fees,
    // removal) are untaxed server-side; mirror that here.
    const taxableBase = lines
      .filter((l) => l.lineType !== 'custom')
      .reduce((sum, l) => sum + l.quantity * l.unitPriceCents - l.lineDiscountCents, 0);
    const taxable = Math.max(0, taxableBase - orderDisc);
    const taxCents = Math.round((taxable * taxRateBps) / 10000);
    const totalCents =
      merchandise + recycling - lineDiscount - orderDisc + taxCents + install + delivery;
    const paidCents = payments.reduce((s, p) => s + p.amountCents, 0);
    return {
      merchandise,
      recycling,
      discounts: lineDiscount + orderDisc,
      install,
      delivery,
      taxCents,
      totalCents,
      paidCents,
      balanceCents: Math.max(0, totalCents - paidCents),
    };
  }, [lines, orderDiscount, installFee, deliveryFee, taxRateBps, payments]);

  function addProduct(row: SearchRow) {
    setLines((prev) => {
      const next = [...prev];
      const existing = next.find((l) => l.variantId === row.variantId);
      if (existing) {
        existing.quantity += 1;
      } else {
        next.push({
          key: nextKey(),
          variantId: row.variantId,
          description: [row.productName, row.variantName].filter(Boolean).join(' — '),
          quantity: 1,
          unitPriceCents: row.priceCents,
          lineDiscountCents: 0,
          lineType: 'stock',
          fulfillmentMethod: '',
          deliveryDate: '',
          availableHere: row.availableHere,
          atpDate: row.atpDate,
        });
        // Auto fee line per unit for mattress/foundation/adjustable base
        // (CA law; PLAN-POS-OPERATIONS §4). One fee line tracks total
        // qualifying units; the associate may remove it.
        if (RECYCLING_RE.test(`${row.productName} ${row.variantName ?? ''}`)) {
          const fee = next.find((l) => l.lineType === 'custom' && l.description === RECYCLING_DESC);
          if (fee) fee.quantity += 1;
          else
            next.push({
              key: nextKey(),
              variantId: null,
              description: RECYCLING_DESC,
              quantity: 1,
              unitPriceCents: recyclingFeeCents,
              lineDiscountCents: 0,
              lineType: 'custom',
              fulfillmentMethod: '',
              deliveryDate: '',
            });
        }
      }
      return next;
    });
    setShowProductSearch(false);
  }

  function patchLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addPayment() {
    const cents = parseDollars(payAmount || (totals.balanceCents / 100).toFixed(2));
    if (cents <= 0) return;
    setPayments((prev) => [
      ...prev,
      { key: nextKey(), method: payMethod, amountCents: cents, ref: payRef.trim() },
    ]);
    setPayAmount('');
    setPayRef('');
  }

  async function resumeDraft(id: string) {
    setError(null);
    try {
      const o = await api<{
        id: string;
        customerId: string;
        locationId: string;
        stockLocationId: string | null;
        fulfillmentType: string;
        requestedDate: string | null;
        deliveryInstructions: string | null;
        notes: string | null;
        orderDiscountCents: number;
        installFeeCents: number;
        deliveryFeeCents: number;
        lines: {
          variantId: string | null;
          description: string;
          quantity: number;
          unitPriceCents: number;
          discountCents: number;
          lineType: string;
          fulfillmentMethod: string | null;
          deliveryDate: string | null;
        }[];
      }>(`/v1/orders/${id}`);
      const cust = await api<CustomerHit>(`/v1/customers/${o.customerId}`);
      setCustomer(cust);
      setLocationId(o.locationId);
      setStockLocationId(o.stockLocationId ?? '');
      setFulfillment((o.fulfillmentType as Fulfillment) ?? 'delivery');
      setRequestedDate(o.requestedDate ?? '');
      setDeliveryInstructions(o.deliveryInstructions ?? '');
      setNotes(o.notes ?? '');
      setOrderDiscount(o.orderDiscountCents ? (o.orderDiscountCents / 100).toFixed(2) : '');
      setInstallFee(o.installFeeCents ? (o.installFeeCents / 100).toFixed(2) : '');
      setDeliveryFee(o.deliveryFeeCents ? (o.deliveryFeeCents / 100).toFixed(2) : '');
      setLines(
        o.lines.map((l) => ({
          key: nextKey(),
          variantId: l.variantId,
          description: l.description,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
          lineDiscountCents: l.discountCents,
          lineType: (l.lineType as Line['lineType']) ?? 'stock',
          fulfillmentMethod: (l.fulfillmentMethod as Line['fulfillmentMethod']) ?? '',
          deliveryDate: l.deliveryDate ?? '',
        })),
      );
      setResumedDraftId(id);
      toast.success('Draft loaded — completing it will replace the draft');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // G6: the server may refuse a deep discount with REASON_REQUIRED
  // (tier 2 — coded reason) or OVERRIDE_REQUIRED (tier 3 — manager
  // credentials); the override dialog collects both and retries.
  interface PriceControl {
    priceReasonCodeId?: string;
    priceReason?: string;
    override?: { email: string; password: string; reasonCodeId?: string; reason?: string };
  }

  async function submit(mode: 'complete' | 'draft') {
    setError(null);
    if (!customer) {
      setError('Attach a customer first.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one line.');
      return;
    }
    if (orderType === 'layaway' && mode === 'complete' && totals.paidCents < 10000) {
      setError('Layaway needs a minimum $100 deposit to open.');
      return;
    }
    // G14: promising a date before the goods can arrive is the #1
    // customer-service failure in furniture — make it a deliberate act.
    if (mode === 'complete' && requestedDate) {
      const lateLines = lines.filter((l) => l.atpDate && l.atpDate > requestedDate);
      if (lateLines.length > 0) {
        const ok = window.confirm(
          `Promised ${requestedDate}, but not expected until ${lateLines
            .map((l) => `${l.description} (${l.atpDate})`)
            .join(', ')}. Promise it anyway?`,
        );
        if (!ok) return;
      }
    }
    setBusy(true);
    try {
      await doSubmit(mode);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === 'REASON_REQUIRED' || err.code === 'OVERRIDE_REQUIRED')
      ) {
        setPriceGateMode(mode);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
    }
  }

  async function doSubmit(mode: 'complete' | 'draft', control?: PriceControl) {
    if (!customer) throw new Error('Attach a customer first.');
    {
      const linePayload = lines.map((l) => ({
        variantId: l.variantId ?? undefined,
        description: l.lineType === 'custom' ? l.description : undefined,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        lineDiscountCents: l.lineDiscountCents || undefined,
        lineType: l.lineType,
        fulfillmentMethod: l.fulfillmentMethod || undefined,
        deliveryDate: l.deliveryDate || undefined,
      }));

      // Take-with fully paid, all real stock → a plain register sale.
      // (Exchanges always stay orders — the document must print as an
      // Exchange Order against the original invoice.)
      const allSellable = lines.every((l) => l.lineType !== 'special_order');
      if (
        !exchangeOriginal &&
        mode === 'complete' &&
        orderType === 'sales_order' &&
        fulfillment === 'take_with' &&
        (!stockLocationId || stockLocationId === locationId) &&
        allSellable &&
        totals.paidCents >= totals.totalCents &&
        totals.totalCents > 0
      ) {
        const sale = await api<{ id: string; number: string }>('/v1/sales', {
          method: 'POST',
          body: JSON.stringify({
            locationId,
            customerId: customer.id,
            lines: lines
              .filter((l) => l.variantId)
              .map((l) => ({
                variantId: l.variantId,
                quantity: l.quantity,
                unitPriceCents: l.unitPriceCents,
                lineDiscountCents: l.lineDiscountCents || undefined,
              })),
            orderDiscountCents: parseDollars(orderDiscount) || undefined,
            // The register honours the same G6 discount gate as an
            // order, so the reason/override travels with it.
            ...(control ?? {}),
            payments: [
              {
                method: payments[0]?.method === 'cash' ? 'cash' : 'card',
                amountCents: totals.totalCents,
              },
            ],
          }),
        });
        if (resumedDraftId) await cancelDraft(resumedDraftId);
        setDone({ id: sale.id, number: sale.number, kind: 'sale' });
        return;
      }

      const sp = salespeople.filter(Boolean);
      const createPath = exchangeOriginal
        ? `/v1/orders/${exchangeOriginal.id}/exchange`
        : '/v1/orders';
      const order = await api<{ id: string; number: string; totalCents: number }>(createPath, {
        method: 'POST',
        body: JSON.stringify({
          locationId,
          stockLocationId:
            stockLocationId && stockLocationId !== locationId ? stockLocationId : undefined,
          customerId: customer.id,
          orderKind: orderType === 'layaway' ? 'layaway' : 'sales_order',
          fulfillmentType: fulfillment,
          requestedDate: requestedDate || null,
          deliveryInstructions: deliveryInstructions || null,
          notes: notes || null,
          address: shipDiffers
            ? {
                line1: ship.line1 || null,
                line2: ship.line2 || null,
                city: ship.city || null,
                region: ship.region || null,
                postalCode: ship.postalCode || null,
                phone: ship.phone || null,
              }
            : addressFromCustomer(customer),
          salespersonMembershipId: sp[0] || undefined,
          secondSalespersonMembershipId: sp[1] || undefined,
          // Equal split by default (PLAN-POS-OPERATIONS §4/§9).
          splitBps: sp.length === 2 ? 5000 : undefined,
          lines: linePayload,
          orderDiscountCents: parseDollars(orderDiscount) || undefined,
          installFeeCents: parseDollars(installFee) || undefined,
          deliveryFeeCents: parseDollars(deliveryFee) || undefined,
          draft: mode === 'draft' ? true : undefined,
          confirm: mode === 'complete' && orderType !== 'quote' ? true : undefined,
          ...(control ?? {}),
        }),
      });

      if (mode === 'complete') {
        for (const p of payments) {
          await api(`/v1/orders/${order.id}/payments`, {
            method: 'POST',
            body: JSON.stringify({
              method: p.method,
              amountCents: p.amountCents,
              kind: 'deposit',
              processorRef: p.ref || undefined,
            }),
          });
        }
      }
      if (resumedDraftId && resumedDraftId !== order.id) await cancelDraft(resumedDraftId);

      if (mode === 'draft') {
        toast.success(`Draft ${order.number} saved — visible store-wide`);
        resetAll();
        loadDrafts();
      } else {
        setDone({ id: order.id, number: order.number, kind: 'order' });
      }
    }
  }

  async function cancelDraft(id: string) {
    await api(`/v1/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'superseded by completed New Sale' }),
    }).catch(() => undefined);
  }

  function resetAll() {
    setCustomer(null);
    setCustQuery('');
    setLines([]);
    setPayments([]);
    setOrderDiscount('');
    setInstallFee('');
    setDeliveryFee('');
    setNotes('');
    setDeliveryInstructions('');
    setRequestedDate('');
    setShipDiffers(false);
    setStockLocationId('');
    setResumedDraftId(null);
    setOrderType('sales_order');
    setDone(null);
  }

  if (done) {
    return (
      <Card>
        <h2 style={{ marginTop: 0 }}>
          {done.kind === 'sale' ? 'Sale' : 'Order'} {done.number} complete
        </h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Print / Email invoice arrive with the documents phase; the order page has the receipt for
          now.
        </p>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() =>
              router.push(done.kind === 'sale' ? `/sales/${done.id}` : `/orders/${done.id}`)
            }
          >
            Open {done.kind}
          </Button>
          <Button variant="secondary" onClick={resetAll} data-testid="new-sale-again">
            New Sale
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]" data-testid="new-sale">
      <SecurityOverrideDialog
        open={priceGateMode != null}
        title="Discount needs approval"
        usageClass="exception"
        submitLabel="Approve & save"
        perform={(payload) =>
          doSubmit(priceGateMode!, {
            priceReasonCodeId: payload.reasonCodeId,
            priceReason: payload.reason,
            override: payload.override,
          })
        }
        onClose={() => setPriceGateMode(null)}
        onSuccess={() => undefined}
      />
      <div className="min-w-0">
        {exchangeOriginal && (
          <div
            className="card mb-3"
            data-testid="exchange-banner"
            style={{ padding: '10px 14px', borderColor: 'var(--warning)', fontSize: 13 }}
          >
            Writing an <strong>Exchange Order</strong> against original invoice{' '}
            <strong>{exchangeOriginal.number}</strong> — the document prints with the original
            number, and the customer is fixed to the original order&apos;s.
          </div>
        )}
        {!exchangeOriginal && openOrders.length > 0 && (
          <div
            className="card mb-3"
            data-testid="duplicate-order-banner"
            style={{ padding: '10px 14px', borderColor: 'var(--warning)', fontSize: 13 }}
          >
            This customer already has {openOrders.length === 1 ? 'an open order' : 'open orders'}:{' '}
            {openOrders.map((o, i) => (
              <span key={o.id}>
                {i > 0 && ', '}
                <strong>{o.number}</strong>
                {(o.deliveryDate ?? o.requestedDate) && ` (${o.deliveryDate ?? o.requestedDate})`}
              </span>
            ))}
            {' — '}consider one truck: add to the existing order or match its delivery date.
          </div>
        )}
        {drafts.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2" data-testid="draft-chips">
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Drafts:</span>
            {drafts.map((d) => (
              <button
                key={d.id}
                className="btn btn-sm"
                style={{ border: '1px dashed var(--border-strong)', background: 'var(--surface)' }}
                onClick={() => void resumeDraft(d.id)}
              >
                {d.number} · {formatMoney(d.totalCents)}
              </button>
            ))}
          </div>
        )}

        <Card title={<StepTitle n={1} label="Customer" />} style={{ marginBottom: 14 }}>
          {customer ? (
            <div className="flex items-center gap-3">
              <div>
                <strong data-testid="order-customer">{customerName(customer)}</strong>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  {[customer.phone, customer.email, addressPreview(customer)]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setCustomer(null)}>
                Change
              </Button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <Input
                value={custQuery}
                onChange={(e) => setCustQuery(e.target.value)}
                placeholder="Search name, phone, email, or address…"
                style={{ width: '100%', padding: '10px 12px', fontSize: 15 }}
                data-testid="customer-search"
                autoFocus
              />
              {custOpen && custHits.length > 0 && (
                <Card
                  style={{
                    position: 'absolute',
                    zIndex: 20,
                    left: 0,
                    right: 0,
                    top: '105%',
                    padding: 6,
                    maxHeight: 280,
                    overflowY: 'auto',
                  }}
                >
                  {custHits.map((c) => (
                    <button
                      key={c.id}
                      style={hitBtn}
                      data-testid="customer-hit"
                      onClick={() => {
                        setCustomer(c);
                        setCustOpen(false);
                        setCustQuery('');
                      }}
                    >
                      <strong>{customerName(c)}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                        {[c.phone, addressPreview(c)].filter(Boolean).join(' · ')}
                      </span>
                    </button>
                  ))}
                  {custMore && (
                    <div className="muted" style={{ fontSize: 12, padding: '4px 8px' }}>
                      More matches — keep typing.
                    </div>
                  )}
                </Card>
              )}
              <div style={{ marginTop: 8 }}>
                {creatingCustomer ? (
                  // Every cell needs min-w-0: grid/flex items refuse to
                  // shrink below their content width by default, and on a
                  // narrow column the overflowing Create button lands
                  // *under* the totals rail, which then swallows its
                  // clicks (caught by the checkpoint-8 e2e run).
                  <div className="grid gap-2 sm:grid-cols-4">
                    <Input
                      placeholder="First name"
                      value={newCust.firstName}
                      onChange={(e) => setNewCust({ ...newCust, firstName: e.target.value })}
                      style={{ minWidth: 0 }}
                    />
                    <Input
                      placeholder="Last name"
                      value={newCust.lastName}
                      onChange={(e) => setNewCust({ ...newCust, lastName: e.target.value })}
                      style={{ minWidth: 0 }}
                    />
                    <Input
                      placeholder="Phone"
                      value={newCust.phone}
                      onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                      style={{ minWidth: 0 }}
                    />
                    <div className="flex min-w-0 gap-2">
                      <Input
                        placeholder="Email"
                        value={newCust.email}
                        onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                        style={{ flex: 1, minWidth: 0 }}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        data-testid="create-customer"
                        onClick={() => {
                          void api<CustomerHit>('/v1/customers', {
                            method: 'POST',
                            body: JSON.stringify({
                              firstName: newCust.firstName || null,
                              lastName: newCust.lastName || null,
                              phone: newCust.phone || null,
                              email: newCust.email || null,
                            }),
                          })
                            .then((c) => {
                              setCustomer(c);
                              setCreatingCustomer(false);
                            })
                            .catch((err) =>
                              setError(err instanceof Error ? err.message : String(err)),
                            );
                        }}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setCreatingCustomer(true)}>
                    <Plus size={13} aria-hidden /> New customer
                  </Button>
                )}
              </div>
            </div>
          )}
          {customer && fulfillment !== 'take_with' && (
            <div style={{ marginTop: 10 }}>
              <label
                className="flex items-center gap-2"
                style={{ fontSize: 13, color: 'var(--text-secondary)' }}
              >
                <input
                  type="checkbox"
                  checked={shipDiffers}
                  onChange={(e) => setShipDiffers(e.target.checked)}
                />
                Ship to a different address (default: billing address)
              </label>
              {shipDiffers && (
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <Input
                    placeholder="Address line 1"
                    value={ship.line1}
                    onChange={(e) => setShip({ ...ship, line1: e.target.value })}
                  />
                  <Input
                    placeholder="Line 2"
                    value={ship.line2}
                    onChange={(e) => setShip({ ...ship, line2: e.target.value })}
                  />
                  <Input
                    placeholder="City"
                    value={ship.city}
                    onChange={(e) => setShip({ ...ship, city: e.target.value })}
                  />
                  <Input
                    placeholder="State"
                    value={ship.region}
                    onChange={(e) => setShip({ ...ship, region: e.target.value })}
                  />
                  <Input
                    placeholder="ZIP"
                    value={ship.postalCode}
                    onChange={(e) => setShip({ ...ship, postalCode: e.target.value })}
                  />
                  <Input
                    placeholder="Phone at address"
                    value={ship.phone}
                    onChange={(e) => setShip({ ...ship, phone: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        <Card
          title={<StepTitle n={2} label="Items" />}
          style={{ marginBottom: 14 }}
          actions={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setLines((prev) => [
                    ...prev,
                    {
                      key: nextKey(),
                      variantId: null,
                      description: 'Mattress Removal',
                      quantity: 1,
                      unitPriceCents: 0,
                      lineDiscountCents: 0,
                      lineType: 'custom',
                      fulfillmentMethod: '',
                      deliveryDate: '',
                    },
                  ])
                }
              >
                + Removal ($0)
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowProductSearch(true)}
                data-testid="add-product"
              >
                <Search size={13} aria-hidden /> Add Product
              </Button>
            </div>
          }
        >
          {lines.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              No items yet — Add Product to start.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price $</th>
                    <th>Disc $</th>
                    <th>Fulfillment</th>
                    <th className="num">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <LineRow
                      key={l.key}
                      line={l}
                      onPatch={patchLine}
                      onRemove={(k) => setLines((p) => p.filter((x) => x.key !== k))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={<StepTitle n={3} label="Order details" />}>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <Field label="Order type">
              <Select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as typeof orderType)}
                style={{ width: '100%' }}
                data-testid="order-type"
              >
                <option value="sales_order">Sales order</option>
                <option value="layaway">Layaway ($100 min deposit)</option>
                <option value="quote">Sales quote</option>
              </Select>
            </Field>
            <Field label="Store">
              <Select
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  const next = locations.find((l) => l.id === e.target.value);
                  if (next) setTaxRateBps(next.taxRateBps ?? taxRateBps);
                }}
                style={{ width: '100%' }}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Inventory from">
              <Select
                value={stockLocationId}
                onChange={(e) => setStockLocationId(e.target.value)}
                style={{ width: '100%' }}
                data-testid="stock-source"
              >
                <option value="">Same as store</option>
                {[...locations]
                  .sort((a, b) =>
                    a.locationType === b.locationType
                      ? a.name.localeCompare(b.name)
                      : a.locationType === 'warehouse'
                        ? -1
                        : 1,
                  )
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                      {l.locationType === 'warehouse' ? ' (warehouse)' : ''}
                    </option>
                  ))}
              </Select>
              {stockLocationId && stockLocationId !== locationId && (
                <span
                  style={{
                    display: 'block',
                    marginTop: 3,
                    fontSize: 11.5,
                    color: 'var(--text-muted)',
                  }}
                >
                  Stock reserves and ships from {sourceLocation?.name ?? 'the selected location'}.
                </span>
              )}
            </Field>
            <Field label="Fulfillment">
              <Select
                value={fulfillment}
                onChange={(e) => setFulfillment(e.target.value as Fulfillment)}
                style={{ width: '100%' }}
                data-testid="fulfillment-method"
              >
                {FULFILLMENTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
            {fulfillment !== 'take_with' && (
              <Field label={fulfillment === 'pickup' ? 'Pickup date' : 'Delivery date'}>
                <Input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  style={{ width: '100%' }}
                />
                {fulfillment === 'delivery' && dayCapacity && (
                  <span
                    data-testid="newsale-capacity"
                    style={{
                      display: 'block',
                      marginTop: 3,
                      fontSize: 11.5,
                      color:
                        dayCapacity.booked >= dayCapacity.cap
                          ? 'var(--danger)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {dayCapacity.booked >= dayCapacity.cap
                      ? `Full — ${dayCapacity.booked}/${dayCapacity.cap} stops (booking will need a capacity override)`
                      : `${dayCapacity.cap - dayCapacity.booked} of ${dayCapacity.cap} stops left that day`}
                  </span>
                )}
              </Field>
            )}
            {members.length > 0 && (
              <>
                <Field label="Salesperson">
                  <Select
                    value={salespeople[0] ?? ''}
                    onChange={(e) => setSalespeople([e.target.value, salespeople[1] ?? ''])}
                    style={{ width: '100%' }}
                  >
                    <option value="">Me (signed in)</option>
                    {members.map((m) => (
                      <option key={m.membershipId} value={m.membershipId}>
                        {m.name ?? m.email}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="2nd salesperson (equal split)">
                  <Select
                    value={salespeople[1] ?? ''}
                    onChange={(e) => setSalespeople([salespeople[0] ?? '', e.target.value])}
                    style={{ width: '100%' }}
                  >
                    <option value="">None</option>
                    {members.map((m) => (
                      <option key={m.membershipId} value={m.membershipId}>
                        {m.name ?? m.email}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
          </div>
          {fulfillment !== 'take_with' && (
            <div style={{ marginTop: 8 }}>
              <Field label="Delivery / pickup instructions">
                <textarea
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  rows={2}
                  className="textarea"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </Field>
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <Field label="Order notes (printed on the invoice)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="textarea"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* Pinned totals + payments rail */}
      <div>
        <div style={{ position: 'sticky', top: 12 }}>
          <Card title="Totals" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13.5 }} data-testid="totals-panel">
              <TotalRow label="Merchandise" cents={totals.merchandise} />
              <TotalRow label="Discounts" cents={-totals.discounts} />
              <div className="my-1 grid grid-cols-2 gap-2">
                <Field label="Installation $">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={installFee}
                    onChange={(e) => setInstallFee(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px' }}
                  />
                </Field>
                <Field label="Delivery $">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px' }}
                  />
                </Field>
              </div>
              <TotalRow label="Recycling" cents={totals.recycling} />
              <TotalRow label={`Tax (${(taxRateBps / 100).toFixed(2)}%)`} cents={totals.taxCents} />
              <div className="my-1 grid grid-cols-1">
                <Field label="Order discount $">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={orderDiscount}
                    onChange={(e) => setOrderDiscount(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px' }}
                  />
                </Field>
              </div>
              <div
                className="flex justify-between"
                style={{ fontWeight: 700, fontSize: 17, margin: '6px 0' }}
              >
                <span>Total</span>
                <span data-testid="grand-total">
                  <Money cents={totals.totalCents} />
                </span>
              </div>
              <TotalRow label="Amount paid" cents={totals.paidCents} />
              <div className="flex justify-between" style={{ fontWeight: 600 }}>
                <span>Balance due</span>
                <span data-testid="balance-due">
                  <Money cents={totals.balanceCents} />
                </span>
              </div>
            </div>
          </Card>

          <Card title="Payments" style={{ marginBottom: 14 }}>
            {storeCredit != null && storeCredit > 0 && (
              <p
                data-testid="store-credit-chip"
                style={{ fontSize: 12.5, margin: '0 0 8px', color: 'var(--success)' }}
              >
                Store credit available: <strong>{formatMoney(storeCredit)}</strong> — use the “Store
                credit” tender to apply it.
              </p>
            )}
            {payments.map((p) => (
              <div key={p.key} className="mb-1 flex items-center gap-2" style={{ fontSize: 13 }}>
                <span style={{ flex: 1 }}>
                  {TENDERS.find((t) => t.value === p.method)?.label}
                  {p.ref ? ` · ${p.ref}` : ''}
                </span>
                <Money cents={p.amountCents} />
                <button
                  onClick={() => setPayments((prev) => prev.filter((x) => x.key !== p.key))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                  aria-label="Remove payment"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 90px' }}>
              <Select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as Tender)}
                data-testid="pay-method"
              >
                {TENDERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder={(totals.balanceCents / 100).toFixed(2)}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                data-testid="pay-amount"
              />
            </div>
            {payMethod !== 'cash' && (
              <Input
                placeholder="Reference / last 4 / approval #"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
              />
            )}
            <div className="flex gap-2" style={{ marginTop: 8 }}>
              <Button size="sm" variant="secondary" onClick={addPayment} data-testid="add-payment">
                Add payment
              </Button>
              {totals.balanceCents > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPayAmount((totals.balanceCents / 100).toFixed(2))}
                >
                  Exact balance
                </Button>
              )}
            </div>
          </Card>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }} role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => void submit('complete')}
              data-testid="complete-sale"
            >
              {busy
                ? 'Working…'
                : orderType === 'quote'
                  ? `Save quote ${formatMoney(totals.totalCents)}`
                  : `Complete ${formatMoney(totals.totalCents)}`}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void submit('draft')}
              data-testid="save-draft"
            >
              Save as Draft
            </Button>
          </div>
        </div>
      </div>

      {showProductSearch && (
        <ProductSearchDialog
          locationId={sourceLocationId}
          locationName={sourceLocation?.name ?? null}
          onAdd={addProduct}
          onClose={() => setShowProductSearch(false)}
        />
      )}
    </div>
  );
}

function LineRow({
  line: l,
  onPatch,
  onRemove,
}: {
  line: Line;
  onPatch: (key: string, patch: Partial<Line>) => void;
  onRemove: (key: string) => void;
}) {
  const amount = l.quantity * l.unitPriceCents - l.lineDiscountCents;
  const outOfStock = l.variantId && (l.availableHere ?? 1) <= 0;
  return (
    <>
      <tr>
        <td style={{ minWidth: 180 }}>{l.description}</td>
        <td>
          <Input
            type="number"
            min={0}
            value={l.quantity}
            onChange={(e) => {
              const qty = Number(e.target.value);
              if (qty <= 0) onRemove(l.key);
              else onPatch(l.key, { quantity: qty });
            }}
            style={{ width: 56, padding: '4px 8px' }}
          />
        </td>
        <td>
          {/* Price override: click, type, done. Small variances stay frictionless;
              deep ones hit the G6 reason/manager gate at save. */}
          <Input
            type="number"
            step="0.01"
            min={0}
            defaultValue={(l.unitPriceCents / 100).toFixed(2)}
            onBlur={(e) => onPatch(l.key, { unitPriceCents: parseDollars(e.target.value) })}
            style={{ width: 84, padding: '4px 8px' }}
            data-testid="line-price"
          />
        </td>
        <td>
          <Input
            type="number"
            step="0.01"
            min={0}
            placeholder="0.00"
            onBlur={(e) => onPatch(l.key, { lineDiscountCents: parseDollars(e.target.value) })}
            style={{ width: 70, padding: '4px 8px' }}
          />
        </td>
        <td>
          {l.lineType === 'custom' ? (
            <span className="muted" style={{ fontSize: 12 }}>
              fee
            </span>
          ) : (
            <Select
              value={l.fulfillmentMethod}
              onChange={(e) =>
                onPatch(l.key, { fulfillmentMethod: e.target.value as Line['fulfillmentMethod'] })
              }
              style={{ width: 116, padding: '4px 8px' }}
            >
              <option value="">order default</option>
              {FULFILLMENTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          )}
        </td>
        <td className="num">
          <Money cents={amount} />
        </td>
        <td>
          <button
            onClick={() => onRemove(l.key)}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            aria-label="Remove line"
          >
            <X size={14} />
          </button>
        </td>
      </tr>
      {outOfStock && (
        <tr>
          <td colSpan={7} style={{ paddingTop: 0 }}>
            <div
              style={{
                background: '#fef3c7',
                color: '#92400e',
                fontSize: 12.5,
                padding: '4px 10px',
                borderRadius: 6,
              }}
              data-testid="atp-banner"
            >
              Not in stock at the selected source location.
              {l.atpDate
                ? ` Available ~${new Date(l.atpDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })} via PO.`
                : ' No open PO — will special-order.'}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ProductSearchDialog({
  locationId,
  locationName,
  onAdd,
  onClose,
}: {
  locationId: string;
  locationName: string | null;
  onAdd: (row: SearchRow) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [stockFilter, setStockFilter] = useState<'' | '1' | '0'>('');
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void api<{ data: VendorRow[] } | VendorRow[]>('/v1/vendors?limit=100')
      .then((r) => setVendors(Array.isArray(r) ? r : r.data))
      .catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (vendorId) params.set('vendorId', vendorId);
      if (stockFilter) params.set('inStock', stockFilter);
      params.set('locationId', locationId);
      params.set('limit', '100');
      void api<SearchRow[]>(`/v1/pos/product-search?${params.toString()}`)
        .then(setRows)
        .catch(() => setRows([]));
    }, 250);
  }, [q, vendorId, stockFilter, locationId]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgb(0 0 0 / 0.4)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '8vh',
      }}
      onClick={onClose}
    >
      <div
        style={{ width: 'min(760px, 94vw)' }}
        onClick={(e) => e.stopPropagation()}
        data-testid="product-search-dialog"
      >
        <Card
          title="Add Product"
          actions={
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X size={14} aria-hidden />
            </Button>
          }
        >
          <div className="mb-2 flex flex-wrap gap-2">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search model, brand, size…"
              style={{ flex: 1, minWidth: 200 }}
              data-testid="product-query"
            />
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">All vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
            <Select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
              data-testid="stock-filter"
            >
              <option value="">All stock</option>
              <option value="1">In stock</option>
              <option value="0">Not in stock</option>
            </Select>
          </div>
          <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
            <table className="table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Vendor</th>
                  <th className="num">Price</th>
                  <th className="num" title={locationName ?? undefined}>
                    {locationName ? `At ${locationName}` : 'Here'}
                  </th>
                  <th className="num">All</th>
                  <th>ATP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.variantId}
                    onClick={() => onAdd(r)}
                    style={{ cursor: 'pointer' }}
                    data-testid="product-result"
                  >
                    <td>
                      {r.productName}
                      {r.variantName ? ` — ${r.variantName}` : ''}
                    </td>
                    <td>
                      <code style={{ fontSize: 11.5 }}>{r.sku ?? '—'}</code>
                    </td>
                    <td>{r.vendorName ?? '—'}</td>
                    <td className="num">
                      <Money cents={r.priceCents} />
                    </td>
                    <td className="num">{r.availableHere}</td>
                    <td className="num">{r.availableTotal}</td>
                    <td style={{ fontSize: 12 }}>
                      {r.availableTotal > 0
                        ? ''
                        : r.atpDate
                          ? `~${new Date(r.atpDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}`
                          : 'no PO'}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted" style={{ fontSize: 13 }}>
                      No matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length >= 100 && (
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              Showing first 100 — refine your search.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StepTitle({ n, label }: { n: number; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'var(--brand)',
          color: '#fff',
          fontSize: 11.5,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {n}
      </span>
      {label}
    </span>
  );
}

function TotalRow({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      <Money cents={cents} />
    </div>
  );
}

function customerName(c: CustomerHit): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || c.phone || 'Customer';
}

function addressPreview(c: CustomerHit): string {
  const a = c.addressesJson?.[0];
  if (!a) return '';
  return [a.line1, a.city].filter(Boolean).join(', ');
}

function addressFromCustomer(c: CustomerHit) {
  const a = c.addressesJson?.[0];
  if (!a) return undefined;
  return {
    line1: a.line1 ?? null,
    line2: null,
    city: a.city ?? null,
    region: a.region ?? null,
    postalCode: null,
    phone: c.phone ?? null,
  };
}

function parseDollars(s: string): number {
  const n = Number(String(s).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

const hitBtn = {
  display: 'block',
  width: '100%',
  textAlign: 'left' as const,
  padding: '8px 10px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 13.5,
};
