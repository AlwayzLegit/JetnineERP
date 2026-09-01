/**
 * Whether a purchase order may be deleted — the pure half (CR
 * 2026-08-31, "Let draft purchase orders be deleted").
 *
 * Delete is a draft-only exit. Everything past Draft has told the
 * outside world something: a placed PO is a commitment to a vendor and
 * cancels rather than vanishes; a received one has moved stock. The
 * four refusals below are the cases where a draft is nonetheless load-
 * bearing, and each says which one it is — "cannot delete" without a
 * reason just sends someone hunting.
 */

export interface PoDeleteFacts {
  status: string;
  /** Already soft-deleted? */
  deletedAt: Date | null;
  /** Any line with received / inspected / accepted / rejected > 0. */
  hasReceivedUnits: boolean;
  /** A vendor invoice is matched or approved against this PO. */
  matchedInvoiceNumber: string | null;
  /**
   * A sales order sourced from this PO whose line is already fulfilled.
   * Deleting would un-source a line the customer has physically been
   * given.
   */
  fulfilledOrderNumber: string | null;
}

export interface PoDeleteRefusal {
  /** Stable code so the UI can react without string-matching prose. */
  code: 'NOT_DRAFT' | 'ALREADY_DELETED' | 'HAS_RECEIPTS' | 'INVOICE_MATCHED' | 'ORDER_FULFILLED';
  message: string;
}

/**
 * Returns the refusal, or null when the delete may proceed. Order
 * matters: status is checked first so a received PO says "cancel this
 * instead" rather than the more specific receipt message, which would
 * be true but unhelpful — you cannot delete it either way.
 */
export function checkPoDeletable(facts: PoDeleteFacts): PoDeleteRefusal | null {
  if (facts.deletedAt) {
    return { code: 'ALREADY_DELETED', message: 'This purchase order is already deleted.' };
  }
  if (facts.status !== 'draft') {
    return {
      code: 'NOT_DRAFT',
      message: 'Only drafts can be deleted. Cancel this PO instead.',
    };
  }
  if (facts.hasReceivedUnits) {
    return {
      code: 'HAS_RECEIPTS',
      message: 'This PO has received units. Un-receive them first.',
    };
  }
  if (facts.matchedInvoiceNumber) {
    return {
      code: 'INVOICE_MATCHED',
      message: 'A vendor invoice is matched to this PO. Unmatch it first.',
    };
  }
  if (facts.fulfilledOrderNumber) {
    return {
      code: 'ORDER_FULFILLED',
      message: `${facts.fulfilledOrderNumber} is sourced from this PO and already fulfilled.`,
    };
  }
  return null;
}

/**
 * Restoring is the mirror: only a deleted row, and only back into
 * Draft. A PO cannot have moved on while deleted — nothing acts on a
 * deleted row — so status is a sanity check rather than a race.
 */
export function checkPoRestorable(facts: {
  status: string;
  deletedAt: Date | null;
}): PoDeleteRefusal | null {
  if (!facts.deletedAt) {
    return { code: 'ALREADY_DELETED', message: 'This purchase order is not deleted.' };
  }
  if (facts.status !== 'draft') {
    return {
      code: 'NOT_DRAFT',
      message: 'Only drafts can be restored.',
    };
  }
  return null;
}
