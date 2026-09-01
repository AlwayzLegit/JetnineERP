import { describe, expect, it } from 'vitest';
import { checkPoDeletable, checkPoRestorable, type PoDeleteFacts } from './po-delete-guard';

function facts(over: Partial<PoDeleteFacts> = {}): PoDeleteFacts {
  return {
    status: 'draft',
    deletedAt: null,
    hasReceivedUnits: false,
    matchedInvoiceNumber: null,
    fulfilledOrderNumber: null,
    ...over,
  };
}

describe('checkPoDeletable', () => {
  it('lets a clean draft through', () => {
    expect(checkPoDeletable(facts())).toBeNull();
  });

  it('refuses every status but draft, pointing at cancel', () => {
    for (const status of ['ordered', 'partially_received', 'received', 'canceled']) {
      const refusal = checkPoDeletable(facts({ status }));
      expect(refusal?.code).toBe('NOT_DRAFT');
      expect(refusal?.message).toBe('Only drafts can be deleted. Cancel this PO instead.');
    }
  });

  it('refuses a PO that already has units at the dock', () => {
    const refusal = checkPoDeletable(facts({ hasReceivedUnits: true }));
    expect(refusal?.code).toBe('HAS_RECEIPTS');
    expect(refusal?.message).toBe('This PO has received units. Un-receive them first.');
  });

  it('refuses while a vendor invoice is matched', () => {
    const refusal = checkPoDeletable(facts({ matchedInvoiceNumber: 'INV-88' }));
    expect(refusal?.code).toBe('INVOICE_MATCHED');
    expect(refusal?.message).toBe('A vendor invoice is matched to this PO. Unmatch it first.');
  });

  it('names the sales order when one sourced from this PO is already fulfilled', () => {
    const refusal = checkPoDeletable(facts({ fulfilledOrderNumber: 'SO-2026-000042' }));
    expect(refusal?.code).toBe('ORDER_FULFILLED');
    expect(refusal?.message).toBe('SO-2026-000042 is sourced from this PO and already fulfilled.');
  });

  it('refuses a second delete of the same row', () => {
    expect(checkPoDeletable(facts({ deletedAt: new Date() }))?.code).toBe('ALREADY_DELETED');
  });

  it('reports status before receipts — a received PO cannot be deleted either way, and "cancel instead" is the useful answer', () => {
    const refusal = checkPoDeletable(facts({ status: 'received', hasReceivedUnits: true }));
    expect(refusal?.code).toBe('NOT_DRAFT');
  });

  it('reports the first blocker when a draft trips several at once', () => {
    const refusal = checkPoDeletable(
      facts({
        hasReceivedUnits: true,
        matchedInvoiceNumber: 'INV-1',
        fulfilledOrderNumber: 'SO-1',
      }),
    );
    expect(refusal?.code).toBe('HAS_RECEIPTS');
  });
});

describe('checkPoRestorable', () => {
  it('restores a deleted draft', () => {
    expect(checkPoRestorable({ status: 'draft', deletedAt: new Date() })).toBeNull();
  });

  it('refuses a row that was never deleted', () => {
    const refusal = checkPoRestorable({ status: 'draft', deletedAt: null });
    expect(refusal?.code).toBe('ALREADY_DELETED');
    expect(refusal?.message).toBe('This purchase order is not deleted.');
  });

  it('refuses anything that is not a draft', () => {
    expect(checkPoRestorable({ status: 'ordered', deletedAt: new Date() })?.code).toBe('NOT_DRAFT');
  });
});
