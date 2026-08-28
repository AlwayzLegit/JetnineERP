/**
 * STORIS's own published expected results, ported per
 * docs/erp-delivery-reprints/07 BEFORE the implementation was written.
 * Fixture A: one order, 3 lines, 3 dates. Flags start at P wherever the
 * rules permit a printed ticket (only the header's first two date slots
 * are ticketable — open question 3).
 */
import { describe, expect, it } from 'vitest';
import {
  applyTicketEdit,
  canPrintSecondDate,
  recordTicketPrint,
  type TicketSnapshot,
} from './ticket-flags';

const D1 = '2026-06-01';
const D2 = '2026-06-03';
const D3 = '2026-06-08';

function slot(
  date: string,
  ticketFlag: 'P' | 'R' | null,
  qty = 2,
  reserved = 2,
  assigned = 0,
): {
  date: string;
  quantityScheduled: number;
  quantityReserved: number;
  quantityAssigned: number;
  ticketFlag: 'P' | 'R' | null;
  pickListFlag: 'P' | null;
} {
  return {
    date,
    quantityScheduled: qty,
    quantityReserved: reserved,
    quantityAssigned: assigned,
    ticketFlag,
    pickListFlag: ticketFlag === null ? null : 'P',
  };
}

function fixtureA(): TicketSnapshot {
  return {
    fulfillmentStatus: 'scheduled',
    headerSlots: [
      { date: D1, ticketFlag: 'P', pickListFlag: 'P' },
      { date: D2, ticketFlag: 'P', pickListFlag: 'P' },
      { date: D3, ticketFlag: null, pickListFlag: null },
    ],
    lines: [
      { id: 'L1', slots: [slot(D1, 'P')] },
      { id: 'L2', slots: [slot(D2, 'P'), slot(D3, null)] },
      { id: 'L3', slots: [slot(D1, 'P'), slot(D2, 'P'), slot(D3, null)] },
    ],
  };
}

function headerFlags(s: TicketSnapshot): ('P' | 'R' | null)[] {
  return s.headerSlots.map((x) => x.ticketFlag);
}
function lineFlags(s: TicketSnapshot, id: string): ('P' | 'R' | null)[] {
  return s.lines.find((l) => l.id === id)!.slots.map((x) => x.ticketFlag);
}
/** T6 / R7 — global post-condition on every result. */
function assertPickListInvariant(s: TicketSnapshot): void {
  for (const h of s.headerSlots) if (h.ticketFlag === null) expect(h.pickListFlag).toBeNull();
  for (const l of s.lines)
    for (const x of l.slots) if (x.ticketFlag === null) expect(x.pickListFlag).toBeNull();
}

describe('ticket flag state machine — Fixture A scenarios (07)', () => {
  it('S1: a new earliest date clears every flag', () => {
    const { snapshot } = applyTicketEdit(fixtureA(), {
      kind: 'line_reschedule',
      lineId: 'L3',
      fromDate: D1,
      toDate: '2026-05-29',
      movedQuantity: 2,
    });
    expect(headerFlags(snapshot).every((f) => f === null)).toBe(true);
    for (const l of snapshot.lines.filter((x) => x.id === 'L3'))
      expect(l.slots.every((x) => x.ticketFlag === null)).toBe(true);
    assertPickListInvariant(snapshot);
  });

  it("S2: line 3's first date becomes the order's new second date", () => {
    const { snapshot } = applyTicketEdit(fixtureA(), {
      kind: 'line_reschedule',
      lineId: 'L3',
      fromDate: D1,
      toDate: '2026-06-02',
      movedQuantity: 2,
    });
    expect(lineFlags(snapshot, 'L3').every((f) => f === null)).toBe(true);
    expect(snapshot.headerSlots[0]!.ticketFlag).toBe('R'); // no longer includes L3
    expect(snapshot.headerSlots[1]!.date).toBe('2026-06-02');
    expect(snapshot.headerSlots[1]!.ticketFlag).toBeNull(); // new second date
    assertPickListInvariant(snapshot);
  });

  it("S3: line 3's first date moves to a later new date (implemented per S7's coherent rule — divergence from the published parenthetical is recorded in 08 §2)", () => {
    const { snapshot } = applyTicketEdit(fixtureA(), {
      kind: 'line_reschedule',
      lineId: 'L3',
      fromDate: D1,
      toDate: '2026-06-04',
      movedQuantity: 2,
    });
    expect(lineFlags(snapshot, 'L3').every((f) => f === null)).toBe(true);
    expect(snapshot.headerSlots[0]!.ticketFlag).toBe('R');
    // Published S3 says R here, resting on "06/04 becomes the second
    // date" — false for the fixture (06/03 keeps the slot, and line 3's
    // inventory on 06/03 did not change). S7's quantity-conditional rule
    // says unchanged. OWNER: verify against live STORIS.
    expect(snapshot.headerSlots[1]!.date).toBe(D2);
    expect(snapshot.headerSlots[1]!.ticketFlag).toBe('P');
    assertPickListInvariant(snapshot);
  });

  it("S4: line 2's first date becomes the order's new second date — header first untouched", () => {
    const { snapshot } = applyTicketEdit(fixtureA(), {
      kind: 'line_reschedule',
      lineId: 'L2',
      fromDate: D2,
      toDate: '2026-06-02',
      movedQuantity: 2,
    });
    expect(lineFlags(snapshot, 'L2').every((f) => f === null)).toBe(true);
    expect(snapshot.headerSlots[0]!.ticketFlag).toBe('P'); // unchanged
    expect(snapshot.headerSlots[1]!.date).toBe('2026-06-02');
    expect(snapshot.headerSlots[1]!.ticketFlag).toBeNull(); // new second date
    assertPickListInvariant(snapshot);
  });

  it('S5: line 2\'s first date moves to a later new date — second slot demotes ("reset" = R, 08 §1)', () => {
    const { snapshot } = applyTicketEdit(fixtureA(), {
      kind: 'line_reschedule',
      lineId: 'L2',
      fromDate: D2,
      toDate: '2026-06-04',
      movedQuantity: 2,
    });
    expect(lineFlags(snapshot, 'L2').every((f) => f === null)).toBe(true);
    expect(snapshot.headerSlots[0]!.ticketFlag).toBe('P');
    expect(snapshot.headerSlots[1]!.date).toBe(D2); // still 06/03 (line 3)
    expect(snapshot.headerSlots[1]!.ticketFlag).toBe('R'); // L2 left it
    assertPickListInvariant(snapshot);
  });

  it("S6: line 1's first date moves onto the order's second date — both header slots demote", () => {
    const { snapshot } = applyTicketEdit(fixtureA(), {
      kind: 'line_reschedule',
      lineId: 'L1',
      fromDate: D1,
      toDate: D2,
      movedQuantity: 2,
    });
    expect(lineFlags(snapshot, 'L1').every((f) => f === null)).toBe(true);
    expect(snapshot.headerSlots[0]!.ticketFlag).toBe('R'); // lost L1
    expect(snapshot.headerSlots[1]!.ticketFlag).toBe('R'); // gained L1
    assertPickListInvariant(snapshot);
  });

  it("S7: line 3's first date merges into the order's second date — second demotes because quantity changed", () => {
    const { snapshot } = applyTicketEdit(fixtureA(), {
      kind: 'line_reschedule',
      lineId: 'L3',
      fromDate: D1,
      toDate: D2,
      movedQuantity: 2,
    });
    expect(lineFlags(snapshot, 'L3').every((f) => f === null)).toBe(true);
    expect(snapshot.headerSlots[0]!.ticketFlag).toBe('R');
    expect(snapshot.headerSlots[1]!.ticketFlag).toBe('R'); // qty on 06/03 grew
    assertPickListInvariant(snapshot);
  });

  it("S8: line 2 moves partially onto the order's first date — both slots demote", () => {
    const { snapshot } = applyTicketEdit(fixtureA(), {
      kind: 'line_reschedule',
      lineId: 'L2',
      fromDate: D2,
      toDate: D1,
      movedQuantity: 1, // leaves inventory on 06/03
    });
    expect(lineFlags(snapshot, 'L2').every((f) => f === null)).toBe(true);
    expect(snapshot.headerSlots[0]!.ticketFlag).toBe('R'); // now includes L2
    expect(snapshot.headerSlots[1]!.ticketFlag).toBe('R'); // L2's 06/03 inventory changed
    assertPickListInvariant(snapshot);
  });

  it("S9: line 3's second date merges into the third — line collapses to one R; header first untouched, second demotes", () => {
    const { snapshot, transitions } = applyTicketEdit(fixtureA(), {
      kind: 'line_reschedule',
      lineId: 'L3',
      fromDate: D2,
      toDate: D3,
      movedQuantity: 2,
    });
    const l3 = snapshot.lines.find((l) => l.id === 'L3')!;
    expect(l3.slots.map((s) => [s.date, s.ticketFlag])).toEqual([
      [D1, 'R'],
      [D3, null],
    ]);
    expect(snapshot.headerSlots[0]!.ticketFlag).toBe('P'); // unaffected
    expect(snapshot.headerSlots[1]!.ticketFlag).toBe('R'); // lost L3
    // The destroyed 06/03 line flag is recorded for the audit trail (Q8).
    expect(transitions.some((t) => t.record === 'L3' && t.date === D2 && t.to === null)).toBe(true);
    assertPickListInvariant(snapshot);
  });
});

describe('ticket flag state machine — rule-level tests (07)', () => {
  const J1 = '2026-06-01';
  const J2 = '2026-07-01';

  function twoDateOrder(lineFirstFlag: 'P' | 'R' = 'P'): TicketSnapshot {
    return {
      fulfillmentStatus: 'scheduled',
      headerSlots: [
        { date: J1, ticketFlag: 'P', pickListFlag: 'P' },
        { date: J2, ticketFlag: 'P', pickListFlag: 'P' },
      ],
      lines: [{ id: 'A', slots: [slot(J1, lineFirstFlag), slot(J2, 'P')] }],
    };
  }

  it('T1 (R4): only header slots the line shares can move — R:P', () => {
    const snap: TicketSnapshot = {
      fulfillmentStatus: 'scheduled',
      headerSlots: [
        { date: J1, ticketFlag: 'P', pickListFlag: 'P' },
        { date: J2, ticketFlag: 'P', pickListFlag: 'P' },
      ],
      lines: [
        { id: 'A', slots: [slot(J1, 'P'), slot('2026-08-01', null)] },
        { id: 'B', slots: [slot(J2, 'P')] },
      ],
    };
    const { snapshot } = applyTicketEdit(snap, {
      kind: 'line_inventory_change',
      lineId: 'A',
      dates: [J1, '2026-08-01'],
    });
    expect(headerFlags(snapshot).slice(0, 2)).toEqual(['R', 'P']);
    assertPickListInvariant(snapshot);
  });

  it('T2 (R5 Example A): first-date change with two printed tickets collapses both to a single R', () => {
    const { snapshot } = applyTicketEdit(twoDateOrder(), {
      kind: 'line_inventory_change',
      lineId: 'A',
      dates: [J1],
    });
    expect(lineFlags(snapshot, 'A')).toEqual(['R', null]);
    expect(headerFlags(snapshot)).toEqual(['R', null]);
    assertPickListInvariant(snapshot);
  });

  it('T3 (R5 Example B): first date changed outright clears everything', () => {
    const { snapshot } = applyTicketEdit(twoDateOrder(), {
      kind: 'line_reschedule',
      lineId: 'A',
      fromDate: J1,
      toDate: '2026-08-01',
      movedQuantity: 2,
    });
    expect(headerFlags(snapshot).every((f) => f === null)).toBe(true);
    expect(lineFlags(snapshot, 'A').every((f) => f === null)).toBe(true);
    assertPickListInvariant(snapshot);
  });

  it('T4 (R5): an already-R first flag still clears the second', () => {
    const { snapshot } = applyTicketEdit(twoDateOrder('R'), {
      kind: 'line_inventory_change',
      lineId: 'A',
      dates: [J1],
    });
    expect(lineFlags(snapshot, 'A')).toEqual(['R', null]);
    assertPickListInvariant(snapshot);
  });

  it('T5 (R6): scheduled → estimated clears every flag', () => {
    const { snapshot } = applyTicketEdit(fixtureA(), {
      kind: 'status_change',
      from: 'scheduled',
      to: 'estimated',
    });
    expect(headerFlags(snapshot).every((f) => f === null)).toBe(true);
    for (const l of snapshot.lines) expect(l.slots.every((s) => s.ticketFlag === null)).toBe(true);
    assertPickListInvariant(snapshot);
  });

  it('T7 (R8): header-level edits reset header AND line flags to R', () => {
    for (const field of ['next_delivery_date', 'deposit', 'line_added'] as const) {
      const { snapshot } = applyTicketEdit(fixtureA(), { kind: 'header_change', field });
      expect(headerFlags(snapshot)).toEqual(['R', 'R', null]);
      expect(lineFlags(snapshot, 'L1')).toEqual(['R']);
      expect(lineFlags(snapshot, 'L3')).toEqual(['R', 'R', null]);
      assertPickListInvariant(snapshot);
    }
  });

  it('T9: line dates outside the header first two slots never carry a flag', () => {
    const snap = fixtureA();
    // L2's and L3's 06/08 slots (header slot 3) must stay null after any edit.
    const { snapshot } = applyTicketEdit(snap, {
      kind: 'line_inventory_change',
      lineId: 'L2',
      dates: [D3],
    });
    expect(snapshot.lines.find((l) => l.id === 'L2')!.slots[1]!.ticketFlag).toBeNull();
    assertPickListInvariant(snapshot);
  });

  it('T10: the multiple-fulfillment summary table', () => {
    // first date only, line without two printed tickets → second unchanged
    const split: TicketSnapshot = {
      fulfillmentStatus: 'scheduled',
      headerSlots: [
        { date: J1, ticketFlag: 'P', pickListFlag: 'P' },
        { date: J2, ticketFlag: 'P', pickListFlag: 'P' },
      ],
      lines: [
        { id: 'A', slots: [slot(J1, 'P')] },
        { id: 'B', slots: [slot(J2, 'P')] },
      ],
    };
    let r = applyTicketEdit(split, { kind: 'line_inventory_change', lineId: 'A', dates: [J1] });
    expect(headerFlags(r.snapshot)).toEqual(['R', 'P']);

    // second date only → second R, first unchanged
    r = applyTicketEdit(split, { kind: 'line_inventory_change', lineId: 'B', dates: [J2] });
    expect(headerFlags(r.snapshot)).toEqual(['P', 'R']);

    // both → first R, second cleared
    r = applyTicketEdit(twoDateOrder(), {
      kind: 'line_inventory_change',
      lineId: 'A',
      dates: [J1, J2],
    });
    expect(headerFlags(r.snapshot)).toEqual(['R', null]);
    assertPickListInvariant(r.snapshot);
  });
});

describe('ticket print eligibility and recording (R10, T8)', () => {
  const J1 = '2026-06-01';
  const J2 = '2026-06-05';

  it('refuses a second-date print before the first ticket exists', () => {
    const snap: TicketSnapshot = {
      fulfillmentStatus: 'scheduled',
      headerSlots: [
        { date: J1, ticketFlag: null, pickListFlag: null },
        { date: J2, ticketFlag: null, pickListFlag: null },
      ],
      lines: [{ id: 'A', slots: [slot(J2, null, 2, 2)] }],
    };
    expect(canPrintSecondDate(snap)).toBe(false);
  });

  it('(a) allows when a second-date-only line has pieces reserved', () => {
    const snap: TicketSnapshot = {
      fulfillmentStatus: 'scheduled',
      headerSlots: [
        { date: J1, ticketFlag: 'P', pickListFlag: 'P' },
        { date: J2, ticketFlag: null, pickListFlag: null },
      ],
      lines: [
        { id: 'A', slots: [slot(J1, 'P', 2, 2, 2)] },
        { id: 'B', slots: [slot(J2, null, 1, 1)] },
      ],
    };
    expect(canPrintSecondDate(snap)).toBe(true);
  });

  it('(b) allows when a both-dates line has first fully assigned and second reserved — and refuses when assignment is short', () => {
    const make = (assigned: number): TicketSnapshot => ({
      fulfillmentStatus: 'scheduled',
      headerSlots: [
        { date: J1, ticketFlag: 'P', pickListFlag: 'P' },
        { date: J2, ticketFlag: null, pickListFlag: null },
      ],
      lines: [{ id: 'A', slots: [slot(J1, 'P', 2, 2, assigned), slot(J2, null, 1, 1)] }],
    });
    expect(canPrintSecondDate(make(2))).toBe(true);
    expect(canPrintSecondDate(make(1))).toBe(false);
  });

  it('recordTicketPrint sets P on the slot and participating lines, and assigns reserved pieces', () => {
    const snap: TicketSnapshot = {
      fulfillmentStatus: 'scheduled',
      headerSlots: [{ date: J1, ticketFlag: 'R', pickListFlag: null }],
      lines: [{ id: 'A', slots: [slot(J1, 'R', 2, 2, 0)] }],
    };
    const { snapshot, transitions } = recordTicketPrint(snap, J1);
    expect(snapshot.headerSlots[0]!.ticketFlag).toBe('P');
    expect(snapshot.lines[0]!.slots[0]!.ticketFlag).toBe('P');
    expect(snapshot.lines[0]!.slots[0]!.quantityAssigned).toBe(2);
    expect(transitions.length).toBe(2);
  });
});
