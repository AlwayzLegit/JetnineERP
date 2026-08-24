'use client';

import { formatMoney } from '@jetnine/shared';
import { code128Svg } from '@/lib/code128';

export interface ReceiptLine {
  description: string;
  quantity: number;
  unitPriceCents?: number;
  totalCents: number;
}

export interface ReceiptPayment {
  method: string;
  amountCents: number;
}

export interface ReceiptSale {
  number: string;
  completedAt: string | null;
  createdAt?: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  lines: ReceiptLine[];
  payments: ReceiptPayment[];
}

export interface ReceiptBusiness {
  name: string;
  receiptHeader: string | null;
  receiptFooter: string | null;
}

/**
 * Prints clean. The wrapper carries `data-printable` so the global
 * print stylesheet can hide everything else on the page; a
 * `print-only` block on the receipt itself ensures the layout is
 * compact and doesn't depend on CSS that's been overridden by app
 * chrome. Designed for an 80mm thermal printer column width but
 * gracefully reflows on a normal printer too.
 */
export function PrintableReceipt({
  sale,
  business,
}: {
  sale: ReceiptSale;
  business: ReceiptBusiness | null;
}) {
  const when = sale.completedAt ?? sale.createdAt ?? null;
  return (
    <div data-printable className="receipt">
      <style>{RECEIPT_CSS}</style>
      <header className="r-head">
        <h2>{business?.name ?? 'Sale'}</h2>
        {business?.receiptHeader && <pre className="r-pre">{business.receiptHeader}</pre>}
        <p className="r-meta">
          <code>{sale.number}</code>
          {when && <span> · {new Date(when).toLocaleString()}</span>}
        </p>
      </header>

      <table className="r-lines">
        <tbody>
          {sale.lines.map((l, i) => (
            <tr key={i}>
              <td className="r-desc">
                {l.description}
                <span className="r-qty"> ×{l.quantity}</span>
              </td>
              <td className="r-amt">{formatMoney(l.totalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="r-totals">
        <tbody>
          <tr>
            <td>Subtotal</td>
            <td className="r-amt">{formatMoney(sale.subtotalCents)}</td>
          </tr>
          {sale.discountCents > 0 && (
            <tr>
              <td>Discount</td>
              <td className="r-amt">-{formatMoney(sale.discountCents)}</td>
            </tr>
          )}
          <tr>
            <td>Tax</td>
            <td className="r-amt">{formatMoney(sale.taxCents)}</td>
          </tr>
          <tr className="r-total">
            <td>Total</td>
            <td className="r-amt">{formatMoney(sale.totalCents)}</td>
          </tr>
          {sale.payments.map((p, i) => (
            <tr key={i} className="r-pay">
              <td>{labelFor(p.method)}</td>
              <td className="r-amt">{formatMoney(p.amountCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {business?.receiptFooter && <pre className="r-pre r-foot">{business.receiptFooter}</pre>}

      {/* Scannable document number — a return starts by scanning this. */}
      <ReceiptBarcode text={sale.number} />
    </div>
  );
}

function ReceiptBarcode({ text }: { text: string }) {
  const svg = code128Svg(text, { height: 36 });
  if (!svg) return null;
  return <div className="r-barcode" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function labelFor(method: string): string {
  if (method === 'cash') return 'Cash';
  if (method === 'card') return 'Card';
  if (method === 'gift_card') return 'Gift card';
  return method;
}

/**
 * Print-only stylesheet. Inlined so the receipt component is fully
 * self-contained — no global stylesheet wiring required.
 *
 * The wrapper is `display: none` on screen so it doesn't double up
 * with whatever in-app receipt UI the surrounding page renders.
 * `@media print` then flips it visible AND hides every other element
 * on the page so the print preview shows only the receipt.
 */
const RECEIPT_CSS = `
.receipt { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .receipt { display: block !important; visibility: visible !important;
    position: absolute; inset: 0; margin: 0 auto;
    font-family: ui-monospace, Menlo, Consolas, monospace; max-width: 320px; color: #111; }
  .receipt * { visibility: visible !important; }
  .receipt .r-head { text-align: center; margin-bottom: 12px; }
  .receipt .r-head h2 { font-size: 16px; margin: 0 0 4px; }
  .receipt .r-pre { font-family: inherit; font-size: 11px; white-space: pre-wrap; margin: 4px 0; }
  .receipt .r-meta { font-size: 11px; color: #444; margin: 4px 0 0; }
  .receipt table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .receipt .r-lines td { padding: 2px 0; vertical-align: top; }
  .receipt .r-amt { text-align: right; white-space: nowrap; }
  .receipt .r-qty { color: #666; font-size: 11px; }
  .receipt .r-totals { margin-top: 8px; border-top: 1px dashed #999; padding-top: 6px; }
  .receipt .r-totals td { padding: 1px 0; }
  .receipt .r-total td { font-weight: 700; padding-top: 4px; border-top: 1px dashed #999; }
  .receipt .r-pay td { color: #555; padding-top: 2px; }
  .receipt .r-foot { text-align: center; margin-top: 12px; }
  .receipt .r-barcode { margin: 10px auto 0; width: 80%; }
  .receipt .r-barcode svg { width: 100%; height: 36px; }
  @page { margin: 8mm; }
}
`;
