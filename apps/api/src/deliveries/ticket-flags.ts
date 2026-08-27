/**
 * Delivery-ticket flag state machine (docs/erp-delivery-reprints/02,
 * normative). Pure function: snapshot in, snapshot + transition log out.
 * Every order-mutating path that can affect scheduled inventory must
 * route its effect through applyTicketEdit — scattered flag writes are
 * how this rots.
 *
 * Decisions taken from the pack's open questions (08):
 *  - Q3: only the first TWO header date slots are ticketable; later
 *    dates never carry flags (they roll forward as deliveries complete).
 *  - Q4: edits carry an explicit affected-date set — the enumerated
 *    table below is the one place "affects inventory scheduled for X"
 *    is answered.
 *  - Q8: the transition log (which rule fired, per flag) is returned so
 *    callers can persist "why did this reprint?".
 *  - Q2/S3: scenario S3's published header-second-slot result rests on a
 *    parenthetical the pack itself identifies as a source error; S7 (the
 *    quantity-conditional twin) is implemented as normative. Flagged to
 *    the owner in SPRINT-STATUS.
 */

export type TicketFlag = 'P' | 'R' | null;

export interface HeaderSlot {
  date: string; // ISO YYYY-MM-DD
  ticketFlag: TicketFlag;
  pickListFlag: 'P' | null;
}

export interface LineSlot {
  date: string;
  quantityScheduled: number;
  quantityReserved: number;
  quantityAssigned: number;
  ticketFlag: TicketFlag;
  pickListFlag: 'P' | null;
}

export interface LineSnapshot {
  id: string;
  slots: LineSlot[]; // ordered by date asc
}

export interface TicketSnapshot {
  /** 'scheduled' | 'estimated' — R6 cares about this transition. */
  fulfillmentStatus: string;
  headerSlots: HeaderSlot[]; // ordered by date asc; index 0 = first date
  lines: LineSnapshot[];
}

/** Enumerated edits (open question 4): each carries its affected dates. */
export type TicketEdit =
  | { kind: 'status_change'; from: string; to: string }
  | { kind: 'header_change'; field: 'next_delivery_date' | 'deposit' | 'line_added' }
  | {
      kind: 'line_reschedule';
      lineId: string;
      fromDate: string;
      toDate: string;
      /** Units moved off fromDate onto toDate. */
      movedQuantity: number;
    }
  | { kind: 'line_inventory_change'; lineId: string; dates: string[] };

export interface FlagTransition {
  record: 'header' | string; // line id
  date: string;
  from: TicketFlag;
  to: TicketFlag;
  rule: string;
}

const TICKETABLE_SLOTS = 2; // open question 3

export function applyTicketEdit(
  input: TicketSnapshot,
  edit: TicketEdit,
): { snapshot: TicketSnapshot; transitions: FlagTransition[] } {
  const snap: TicketSnapshot = structuredClone(input);
  const transitions: FlagTransition[] = [];

  const set = (
    rec: { date: string; ticketFlag: TicketFlag },
    record: 'header' | string,
    to: TicketFlag,
    rule: string,
  ) => {
    if (rec.ticketFlag === to) return;
    transitions.push({ record, date: rec.date, from: rec.ticketFlag, to, rule });
    rec.ticketFlag = to;
  };
  const demote = (
    rec: { date: string; ticketFlag: TicketFlag },
    record: 'header' | string,
    rule: string,
  ) => {
    if (rec.ticketFlag === 'P') set(rec, record, 'R', rule);
  };
  const clear = (
    rec: { date: string; ticketFlag: TicketFlag },
    record: 'header' | string,
    rule: string,
  ) => {
    if (rec.ticketFlag !== null) set(rec, record, null, rule);
  };

  // R6 — scheduled -> estimated clears everything.
  if (edit.kind === 'status_change') {
    snap.fulfillmentStatus = edit.to;
    if (edit.from === 'scheduled' && edit.to === 'estimated') {
      for (const s of snap.headerSlots) clear(s, 'header', 'R6');
      for (const l of snap.lines) for (const s of l.slots) clear(s, l.id, 'R6');
    }
    return finish(snap, transitions);
  }

  // R8 — header-level edits reset every printed flag to R, lines included.
  if (edit.kind === 'header_change') {
    for (const s of snap.headerSlots) demote(s, 'header', 'R8');
    for (const l of snap.lines) for (const s of l.slots) demote(s, l.id, 'R8');
    return finish(snap, transitions);
  }

  const line = snap.lines.find((l) => l.id === edit.lineId);
  if (!line) return finish(snap, transitions);

  const headerDatesBefore = snap.headerSlots.map((s) => s.date);
  const lineFirstBefore = line.slots[0]?.date ?? null;

  // The dates whose scheduled inventory this edit changes.
  const affectedDates = new Set<string>(
    edit.kind === 'line_reschedule' ? [edit.fromDate, edit.toDate] : edit.dates,
  );

  // ---- apply the physical reschedule to the line's slot list ----
  if (edit.kind === 'line_reschedule') {
    const from = line.slots.find((s) => s.date === edit.fromDate);
    if (from) {
      const moved = Math.min(edit.movedQuantity, from.quantityScheduled);
      from.quantityScheduled -= moved;
      let to = line.slots.find((s) => s.date === edit.toDate);
      if (!to) {
        to = {
          date: edit.toDate,
          quantityScheduled: 0,
          quantityReserved: 0,
          quantityAssigned: 0,
          ticketFlag: null,
          pickListFlag: null,
        };
        line.slots.push(to);
      }
      to.quantityScheduled += moved;
      if (from.quantityScheduled <= 0) {
        line.slots = line.slots.filter((s) => s !== from);
      }
      line.slots.sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  const lineFirstAfter = line.slots[0]?.date ?? null;
  const lineFirstChanged = lineFirstBefore !== lineFirstAfter;

  // ---- line flags ----
  // Dates whose line-slot flag is destroyed by an inventory-trust rule
  // (R2/R5) — these propagate to the header slot holding the same date.
  const trustDestroyed = new Set<string>();
  if (lineFirstChanged) {
    // R11 / S1–S8: a new first date on the line clears the line outright.
    for (const s of line.slots) clear(s, line.id, 'R11');
    const before = input.lines.find((l) => l.id === line.id)!;
    for (const s of before.slots) {
      if (!line.slots.some((n) => n.date === s.date) && s.ticketFlag !== null) {
        transitions.push({
          record: line.id,
          date: s.date,
          from: s.ticketFlag,
          to: null,
          rule: 'R11',
        });
      }
    }
  } else {
    // S9: any schedule change on the line demotes its first ticketed slot.
    const first = line.slots[0];
    if (first) demote(first, line.id, 'R1');
    const beforeLine = input.lines.find((l) => l.id === line.id)!;
    const printedTwo = beforeLine.slots.filter((s) => s.ticketFlag !== null).length >= 2;
    const firstAffected = lineFirstBefore !== null && affectedDates.has(lineFirstBefore);
    const second = line.slots[1];
    if (firstAffected && second) {
      // R5 (unconditional with two printed tickets) / R2 (when the same
      // update also touches the second date): the second ticket's
      // contents can no longer be trusted at all.
      if (printedTwo) {
        clear(second, line.id, 'R5');
        trustDestroyed.add(second.date);
      } else if (affectedDates.has(second.date)) {
        clear(second, line.id, 'R2');
        trustDestroyed.add(second.date);
      }
    }
    for (const d of affectedDates) {
      const slot = line.slots.find((s) => s.date === d);
      if (slot && slot !== first && slot !== second) demote(slot, line.id, 'R3');
      else if (slot && slot === second && !firstAffected) demote(slot, line.id, 'R3');
    }
    // A date the edit removed from the line takes its flag with it —
    // schedule housekeeping, not a trust rule (does not propagate).
    for (const s of beforeLine.slots) {
      if (!line.slots.some((n) => n.date === s.date) && s.ticketFlag !== null) {
        transitions.push({
          record: line.id,
          date: s.date,
          from: s.ticketFlag,
          to: null,
          rule: 'date_removed',
        });
      }
    }
  }

  // ---- header slots ----
  // Header dates are the ordered union of line dates after the edit.
  const afterDates = [...new Set(snap.lines.flatMap((l) => l.slots.map((s) => s.date)))].sort();
  const nextHeaderSlots: HeaderSlot[] = afterDates.map((date) => {
    const existing = snap.headerSlots.find((s) => s.date === date);
    return existing ?? { date, ticketFlag: null, pickListFlag: null };
  });

  for (let i = 0; i < Math.min(TICKETABLE_SLOTS, nextHeaderSlots.length); i++) {
    const slot = nextHeaderSlots[i]!;
    const dateValueChanged = headerDatesBefore[i] !== afterDates[i];
    if (dateValueChanged) {
      // The slot now holds a different date — its printed history is void.
      const old = snap.headerSlots[i];
      if (old && old.ticketFlag !== null) {
        transitions.push({
          record: 'header',
          date: old.date,
          from: old.ticketFlag,
          to: null,
          rule: 'R2',
        });
      }
      slot.ticketFlag = null;
      slot.pickListFlag = null;
      continue;
    }
    if (trustDestroyed.has(slot.date)) {
      // R5 cascade (Example A): the line's destroyed second ticket voids
      // the header ticket for the same date.
      clear(slot, 'header', 'R5');
      continue;
    }
    // Same date in this slot: demote when the inventory scheduled for it
    // changed (R1/R3; R4 scoping is implicit — only affected dates move).
    if (affectedDates.has(slot.date)) demote(slot, 'header', i === 0 ? 'R1' : 'R3');
  }
  // Slots beyond the ticketable window never carry flags (Q3).
  for (let i = TICKETABLE_SLOTS; i < nextHeaderSlots.length; i++) {
    nextHeaderSlots[i]!.ticketFlag = null;
    nextHeaderSlots[i]!.pickListFlag = null;
  }
  snap.headerSlots = nextHeaderSlots;

  return finish(snap, transitions);
}

/** R7 — the pick-list flag never survives its ticket flag. */
function finish(
  snap: TicketSnapshot,
  transitions: FlagTransition[],
): { snapshot: TicketSnapshot; transitions: FlagTransition[] } {
  for (const s of snap.headerSlots) if (s.ticketFlag === null) s.pickListFlag = null;
  for (const l of snap.lines)
    for (const s of l.slots) if (s.ticketFlag === null) s.pickListFlag = null;
  // Consistency: line slots outside the header's first two dates are
  // never ticketable (02 §consistency).
  const ticketable = new Set(snap.headerSlots.slice(0, TICKETABLE_SLOTS).map((s) => s.date));
  for (const l of snap.lines)
    for (const s of l.slots)
      if (!ticketable.has(s.date)) {
        s.ticketFlag = null;
        s.pickListFlag = null;
      }
  return { snapshot: snap, transitions };
}

/**
 * R10 — when a ticket may be printed for the header's SECOND date:
 * only once the first date's ticket exists, and (a) a line scheduled
 * only for the second date has pieces reserved, or (b) a line on both
 * dates has all first-date pieces assigned and some reserved for the
 * second.
 */
export function canPrintSecondDate(snap: TicketSnapshot): boolean {
  const [first, second] = snap.headerSlots;
  if (!first || !second) return false;
  if (first.ticketFlag === null) return false;
  for (const l of snap.lines) {
    const onFirst = l.slots.find((s) => s.date === first.date);
    const onSecond = l.slots.find((s) => s.date === second.date);
    if (!onSecond) continue;
    if (!onFirst && onSecond.quantityReserved > 0) return true; // (a)
    if (
      onFirst &&
      onFirst.quantityAssigned >= onFirst.quantityScheduled &&
      onFirst.quantityScheduled > 0 &&
      onSecond.quantityReserved > 0
    )
      return true; // (b)
  }
  return false;
}

/** Print a ticket for a header date slot: header + participating lines go P. */
export function recordTicketPrint(
  input: TicketSnapshot,
  date: string,
): { snapshot: TicketSnapshot; transitions: FlagTransition[] } {
  const snap = structuredClone(input);
  const transitions: FlagTransition[] = [];
  const idx = snap.headerSlots.findIndex((s) => s.date === date);
  if (idx < 0 || idx >= TICKETABLE_SLOTS) return { snapshot: snap, transitions };
  const slot = snap.headerSlots[idx]!;
  if (slot.ticketFlag !== 'P') {
    transitions.push({ record: 'header', date, from: slot.ticketFlag, to: 'P', rule: 'print' });
    slot.ticketFlag = 'P';
  }
  slot.pickListFlag = 'P';
  for (const l of snap.lines) {
    const s = l.slots.find((x) => x.date === date);
    if (!s) continue;
    if (s.ticketFlag !== 'P') {
      transitions.push({ record: l.id, date, from: s.ticketFlag, to: 'P', rule: 'print' });
      s.ticketFlag = 'P';
    }
    s.pickListFlag = 'P';
    // Ticket print performs assignment (01 §quantity states).
    s.quantityAssigned = Math.max(s.quantityAssigned, s.quantityReserved);
  }
  return { snapshot: snap, transitions };
}
