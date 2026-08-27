'use client';

/**
 * Printable documents (PLAN-POS-OPERATIONS §11): the invoice / sales
 * order and the delivery ticket, both rendered from the API's one-call
 * `/v1/orders/:id/document` payload. Neutral template + tenant logo
 * slot; explicit black-on-white styling so the app theme never bleeds
 * into paper.
 */

export interface OrderDocumentPayload {
  business: {
    name: string;
    logoUrl: string | null;
    invoiceHeaderNote: string | null;
    invoiceFooterNote: string | null;
  };
  location: { name: string; orderPrefix: string | null; addressJson: unknown } | null;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  salespersonName: string | null;
  secondSalespersonName: string | null;
  /** §10: set on exchange orders — the Original Invoice #. */
  originalOrderNumber: string | null;
  scheduledDate: string | null;
  order: {
    id: string;
    number: string;
    status: string;
    orderKind: string;
    fulfillmentType: string;
    subtotalCents: number;
    discountCents: number;
    orderDiscountCents: number;
    taxCents: number;
    totalCents: number;
    paidCents: number;
    balanceDueCents: number;
    creditDueCents: number;
    deliveryFeeCents: number;
    installFeeCents: number;
    otherFeeCents: number;
    otherFeeLabel: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    addressCity: string | null;
    addressRegion: string | null;
    addressPostalCode: string | null;
    addressPhone: string | null;
    deliveryInstructions: string | null;
    notes: string | null;
    lockedAt: string | null;
    createdAt: string;
    payments: {
      id: string;
      method: string;
      amountCents: number;
      status: string;
      createdAt: string;
    }[];
  };
  lines: {
    id: string;
    description: string;
    quantity: number;
    qtyReserved: number;
    qtyFulfilled: number;
    lineType: string;
    unitPriceCents: number;
    discountCents: number;
    totalCents: number;
    fulfillmentMethod: string | null;
    model: string | null;
    brand: string | null;
    bin: string | null;
  }[];
}

export function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** STORIS-style single-letter fulfillment code for the line grid. */
const FULFILLMENT_CODES: Record<string, string> = {
  delivery: 'D',
  pickup: 'P',
  take_with: 'T',
  direct_ship: 'S',
};

function StoreAddress({ addressJson }: { addressJson: unknown }) {
  if (!addressJson || typeof addressJson !== 'object') return null;
  const a = addressJson as Record<string, unknown>;
  const s = (k: string) => (typeof a[k] === 'string' && a[k] ? (a[k] as string) : null);
  const cityLine = [s('city'), s('region') ?? s('state'), s('postalCode') ?? s('zip')]
    .filter(Boolean)
    .join(', ');
  return (
    <>
      {s('line1') && <div>{s('line1')}</div>}
      {s('line2') && <div>{s('line2')}</div>}
      {cityLine && <div>{cityLine}</div>}
      {s('phone') && <div>Ph. {s('phone')}</div>}
    </>
  );
}

const box: React.CSSProperties = { border: '1px solid #000', padding: '4px 8px' };
const label: React.CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#333',
};
const cell: React.CSSProperties = {
  border: '1px solid #000',
  padding: '3px 6px',
  fontSize: 11,
  verticalAlign: 'top',
};

function ShipTo({ doc }: { doc: OrderDocumentPayload }) {
  const o = doc.order;
  const hasAddress = o.addressLine1 || o.addressCity;
  return (
    <>
      <div style={{ fontWeight: 700 }}>{doc.customer?.name ?? '—'}</div>
      {hasAddress ? (
        <>
          {o.addressLine1 && <div>{o.addressLine1}</div>}
          {o.addressLine2 && <div>{o.addressLine2}</div>}
          <div>
            {[o.addressCity, o.addressRegion, o.addressPostalCode].filter(Boolean).join(', ')}
          </div>
        </>
      ) : (
        <div style={{ color: '#333' }}>Same as billing</div>
      )}
      {(o.addressPhone ?? doc.customer?.phone) && (
        <div>Ph. {o.addressPhone ?? doc.customer?.phone}</div>
      )}
    </>
  );
}

/** §11 Invoice / Sales Order. */
export function InvoiceDoc({ doc, printedAt }: { doc: OrderDocumentPayload; printedAt: Date }) {
  const o = doc.order;
  const title =
    o.orderKind === 'exchange'
      ? 'Exchange Order'
      : o.orderKind === 'layaway'
        ? 'Layaway'
        : o.status === 'quote'
          ? 'Quote'
          : 'Sales Order';
  const initials = (name: string | null) =>
    name
      ? name
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      : '—';
  const totalDiscount = o.discountCents + o.orderDiscountCents;
  return (
    <div
      style={{
        background: '#fff',
        color: '#000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 12,
        maxWidth: 780,
        margin: '0 auto',
        padding: 24,
      }}
    >
      {/* Header: logo + store block | header note | order # + date boxes */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {doc.business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.business.logoUrl}
              alt={doc.business.name}
              style={{ maxHeight: 48, maxWidth: 200, marginBottom: 4 }}
            />
          ) : (
            <div style={{ fontSize: 18, fontWeight: 700 }}>{doc.business.name}</div>
          )}
          <div style={{ fontSize: 11 }}>
            {doc.location && <div style={{ fontWeight: 700 }}>{doc.location.name}</div>}
            <StoreAddress addressJson={doc.location?.addressJson} />
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', paddingTop: 6 }}>
          {doc.business.invoiceHeaderNote && (
            <div style={{ fontWeight: 700, fontSize: 12, border: '1px solid #000', padding: 6 }}>
              {doc.business.invoiceHeaderNote}
            </div>
          )}
        </div>
        <div style={{ width: 200 }}>
          <div style={{ ...box, textAlign: 'center', marginBottom: 6 }}>
            <div style={label}>{title} #</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{o.number}</div>
          </div>
          {doc.originalOrderNumber && (
            <div style={{ ...box, textAlign: 'center', marginBottom: 6 }}>
              <div style={label}>Original Invoice #</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{doc.originalOrderNumber}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ ...box, flex: 1, textAlign: 'center' }}>
              <div style={label}>Scheduled Date</div>
              <div>{doc.scheduledDate ?? '—'}</div>
            </div>
            <div style={{ ...box, flex: 1, textAlign: 'center' }}>
              <div style={label}>Document Date</div>
              <div>{new Date(o.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sold To / Ship To */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <div style={{ ...box, flex: 1, minHeight: 70 }}>
          <div style={label}>Sold To</div>
          <div style={{ fontWeight: 700 }}>{doc.customer?.name ?? '—'}</div>
          {doc.customer?.phone && <div>Ph. {doc.customer.phone}</div>}
          {doc.customer?.email && <div>{doc.customer.email}</div>}
        </div>
        <div style={{ ...box, flex: 1, minHeight: 70 }}>
          <div style={label}>Ship To</div>
          <ShipTo doc={doc} />
        </div>
      </div>

      {/* Info strip */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
        <thead>
          <tr>
            {['Customer Ph.', 'Terms', 'Salesperson', 'Customer #', 'Store'].map((h) => (
              <th key={h} style={{ ...cell, ...label, textAlign: 'left' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cell}>{doc.customer?.phone ?? '—'}</td>
            <td style={cell}>{o.balanceDueCents > 0 ? 'Balance due' : 'Paid in full'}</td>
            <td style={cell}>
              {initials(doc.salespersonName)}
              {doc.secondSalespersonName ? ` / ${initials(doc.secondSalespersonName)}` : ''}
            </td>
            <td style={cell}>{doc.customer ? doc.customer.id.slice(0, 8).toUpperCase() : '—'}</td>
            <td style={cell}>
              {doc.location?.orderPrefix ?? ''} {doc.location?.name ?? '—'}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10 }}>
        <div>
          Fulfillment: <strong>{o.fulfillmentType.replace(/_/g, ' ')}</strong>
        </div>
        <div>Printed {printedAt.toLocaleString()}</div>
      </div>
      {o.notes && (
        <div style={{ ...box, marginTop: 6, minHeight: 28 }}>
          <div style={label}>Notes</div>
          {o.notes}
        </div>
      )}

      {/* Line grid — $0.00 lines print too (§11) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
        <thead>
          <tr>
            {['Ln#', 'F', 'Model', 'Brand', 'Description', 'Qty', 'Price', 'Amount'].map((h) => (
              <th key={h} style={{ ...cell, ...label, textAlign: 'left' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={l.id}>
              <td style={cell}>{i + 1}</td>
              <td style={cell}>
                {FULFILLMENT_CODES[l.fulfillmentMethod ?? o.fulfillmentType] ?? ''}
              </td>
              <td style={cell}>{l.model ?? '—'}</td>
              <td style={cell}>{l.brand ?? '—'}</td>
              <td style={cell}>{l.description}</td>
              <td style={{ ...cell, textAlign: 'right' }}>{l.quantity}</td>
              <td style={{ ...cell, textAlign: 'right' }}>{usd(l.unitPriceCents)}</td>
              <td style={{ ...cell, textAlign: 'right' }}>{usd(l.totalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + payments */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          {o.payments.length > 0 && (
            <table style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Payment', 'Date', 'Amount'].map((h) => (
                    <th key={h} style={{ ...cell, ...label, textAlign: 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {o.payments
                  .filter((p) => p.status === 'succeeded')
                  .map((p) => (
                    <tr key={p.id}>
                      <td style={cell}>{p.method.replace(/_/g, ' ')}</td>
                      <td style={cell}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ ...cell, textAlign: 'right' }}>{usd(p.amountCents)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
        <table style={{ width: 260, borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            <TotalRow label="Merchandise" value={usd(o.subtotalCents)} />
            {totalDiscount > 0 && <TotalRow label="Discounts" value={`-${usd(totalDiscount)}`} />}
            {o.installFeeCents > 0 && (
              <TotalRow label="Installation" value={usd(o.installFeeCents)} />
            )}
            {o.deliveryFeeCents > 0 && (
              <TotalRow label="Delivery" value={usd(o.deliveryFeeCents)} />
            )}
            {o.otherFeeCents > 0 && (
              <TotalRow label={o.otherFeeLabel ?? 'Other'} value={usd(o.otherFeeCents)} />
            )}
            <TotalRow label="Tax" value={usd(o.taxCents)} />
            <TotalRow label={`Total ${title}`} value={usd(o.totalCents)} bold />
            <TotalRow label="Amount Paid" value={usd(o.paidCents)} />
            {o.creditDueCents > 0 ? (
              <TotalRow label="Credit Due" value={usd(o.creditDueCents)} bold boxed />
            ) : (
              <TotalRow label="Amount Due" value={usd(o.balanceDueCents)} bold boxed />
            )}
          </tbody>
        </table>
      </div>

      {doc.business.invoiceFooterNote && (
        <div style={{ marginTop: 16, fontSize: 10, borderTop: '1px solid #000', paddingTop: 8 }}>
          {doc.business.invoiceFooterNote}
        </div>
      )}
    </div>
  );
}

function TotalRow({
  label: l,
  value,
  bold,
  boxed,
}: {
  label: string;
  value: string;
  bold?: boolean;
  boxed?: boolean;
}) {
  return (
    <tr>
      <td style={{ padding: '2px 8px', fontWeight: bold ? 700 : 400 }}>{l}</td>
      <td
        style={{
          padding: '2px 8px',
          textAlign: 'right',
          fontWeight: bold ? 700 : 400,
          border: boxed ? '2px solid #000' : undefined,
        }}
      >
        {value}
      </td>
    </tr>
  );
}

/** §11 Delivery Ticket: lines, delivery notes, route/date, signature line. */
export function DeliveryTicketDoc({
  doc,
  routeDate,
  routePosition,
  flag,
}: {
  doc: OrderDocumentPayload;
  /** Trip date shown on the ticket; defaults to the order's scheduled date. */
  routeDate?: string | null;
  routePosition?: number | null;
  /** Batch print: why this order is not deliverable today (§7 flag). */
  flag?: string | null;
}) {
  const o = doc.order;
  return (
    <div
      style={{
        background: '#fff',
        color: '#000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 12,
        maxWidth: 780,
        margin: '0 auto',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Delivery Ticket</div>
          <div style={{ fontSize: 11 }}>
            {doc.business.name}
            {doc.location ? ` — ${doc.location.name}` : ''}
          </div>
        </div>
        <div style={{ width: 220 }}>
          <div style={{ ...box, textAlign: 'center', marginBottom: 6 }}>
            <div style={label}>Order #</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{o.number}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ ...box, flex: 1, textAlign: 'center' }}>
              <div style={label}>Date</div>
              <div>{routeDate ?? doc.scheduledDate ?? '—'}</div>
            </div>
            <div style={{ ...box, flex: 1, textAlign: 'center' }}>
              <div style={label}>Stop</div>
              <div>{routePosition ?? '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {flag && (
        <div
          style={{
            border: '2px solid #000',
            padding: 8,
            marginTop: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          ⚠ Not ready: {flag}
        </div>
      )}

      <div style={{ ...box, marginTop: 10 }}>
        <div style={label}>Deliver To</div>
        <ShipTo doc={doc} />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
        <thead>
          <tr>
            {['Qty', 'Model', 'Description'].map((h) => (
              <th key={h} style={{ ...cell, ...label, textAlign: 'left' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((l) => (
            <tr key={l.id}>
              <td style={{ ...cell, width: 40, textAlign: 'right' }}>{l.quantity}</td>
              <td style={{ ...cell, width: 140 }}>{l.model ?? '—'}</td>
              <td style={cell}>{l.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(o.deliveryInstructions ?? o.notes) && (
        <div style={{ ...box, marginTop: 10, minHeight: 36 }}>
          <div style={label}>Delivery Notes</div>
          {o.deliveryInstructions ?? o.notes}
        </div>
      )}

      {o.balanceDueCents > 0 && (
        <div style={{ marginTop: 10, fontWeight: 700 }}>
          Collect on delivery: {usd(o.balanceDueCents)}
        </div>
      )}

      <div style={{ marginTop: 48, display: 'flex', gap: 32 }}>
        <div style={{ flex: 2 }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: 10 }}>
            Customer signature
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: 10 }}>Date</div>
        </div>
      </div>
    </div>
  );
}
