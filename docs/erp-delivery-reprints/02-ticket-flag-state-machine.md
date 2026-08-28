# 02 — Ticket flag state machine (normative)

This is the part to get right. Implement it as a pure function; everything else is plumbing.

## Trigger

Any change to an order **after** a ticket has been printed re-evaluates the flags. Examples the docs name explicitly: COD amount, line item quantity, delivery date, route code. Treat that as illustrative, not exhaustive — the operative test is *"does this change affect inventory scheduled for date X?"*

## Primary rule

> **R1.** If an update affects any inventory scheduled for the **first** date, the flag for the first date **on the updated line** and the flag on the **header** change `P → R`.
>
> **R2.** If that *same* update also affects inventory scheduled for the **second** date, the second-date flag on the updated line and on the header are **cleared** (set to `null`).
>
> **R3.** If an update affects any inventory scheduled for the **second** date, the second-date flags on the line and on the header change `P → R`. (When the same update also touches the first date, R1 and R2 take precedence — the first-date demotion plus the second-date clear.)

Note the asymmetry: a first-date change *downgrades* the first-date flag to `R` but *destroys* the second-date flag. That is deliberate — once the first delivery's contents shift, the second ticket's contents can no longer be trusted at all.

## Scoping rule

> **R4.** When changing a line item, the only header flags that may change are those for dates **that line is scheduled for**.
>
> *Example.* Header scheduled 06/01 and 07/01. Line scheduled 06/01 and 08/01. Only the header's first flag can change as a result of a change to that line, because 08/01 is not a header date slot the line shares. Result: header becomes `R:P`.

## Two-ticket cascade

> **R5.** When changing a line that has tickets printed for **two** dates, and the change affects the **first** scheduled date, the line's **second**-date flag must be cleared. This applies even when the first flag is already `R`.
>
> *Example A.* Header `P:P`, line `P:P`, both scheduled 06/01 and 07/01. A change to the inventory scheduled for the first date on that line results in **both** the line and the header collapsing to a single `R` — the first date should be reprinted, and the second date *must* be reprinted (its flag is gone).
>
> *Example B.* Header scheduled 06/01 and 07/01, both tickets printed, and the **first date is changed to 08/01**. All flags on both header and line are cleared, requiring a reprint of the 07/01 ticket.

## Whole-order rules

> **R6.** Changing an order's status from **scheduled** to **estimated** clears **all** delivery ticket flags on the header and on every line item.

> **R7.** Any time a delivery ticket flag is set to `null` for a date, the **pick list print flag for that date must also be set to `null`.** This is an invariant, not a step — enforce it centrally (a setter, a trigger, or an assertion in the pure function's output) so no path can violate it.

> **R8.** Changes at the **header** level — next delivery date, deposits of any kind, addition of line items — reset the header flags to `R`, **causing the line items also to reset to `R`.**

## Second delivery status / second route are forward-looking

> **R9.** The *second delivery status* and *second route* fields are **future** settings. They do not describe the current status or route of the associated lines. They are the values the order **inherits when the first date's delivery is completed and the second date becomes the first date.**
>
> The only updates performed using these values are to the **route calendar**: inventory to be delivered on the second and subsequent dates appears in the route calendar under the second status and route when those values are present.

Do not let reporting, dispatch, or capacity code read these as current-state fields.

## When a second-date ticket may be printed at all

> **R10.** A ticket can be printed for the second date **only if** a ticket has already been printed for the first date **and** one of the following is true:
>
> **(a)** There is one line on the order that is scheduled **only for the second date** and also has **pieces reserved**. (That line may be scheduled for dates other than the first date.)
>
> **(b)** There is one line scheduled for **both** the first and second dates that has **all pieces assigned** for the first date and **some or all pieces reserved** for the second date.

## Consistency conditions the docs call out

These are stated as facts about valid data. Use them as invariants in tests and as sanity assertions.

1. The header's first date may not be the first date on all line items.
2. A line may share the header's first **two** dates — both tickets can be printed.
3. A line may share the header's **first** date (ticket printable) but have a **different** second date — no ticket can be printed for that second date.
4. A line's **first** date may equal the header's **second** date (ticket printable) — but then that line's own second date can have no ticket printed.
5. A line may have two dates that are neither the header's first nor second date — **no tickets can be printed** for that line.

The through-line: a line's date is only ticketable if it maps onto the header's first or second date slot.

## Multiple fulfillment dates — summary form

Given tickets already printed for both the first and second delivery fulfillment dates, a change affecting inventory scheduled for the:

| Affected dates | First ticket flag | Second ticket flag |
|---|---|---|
| first date only | → `R` | unchanged — *inferred; the source states only the affected flag* |
| second date only | unchanged — *inferred* | → `R` |
| both first and second | → `R` | **cleared** — the source states the second date's **delivery date information** is cleared; per R2 the flag goes with it |

## Reference algorithm

Pseudocode, deliberately language-neutral. Names should be adapted to repo conventions.

```
applyEdit(header, lines, edit) -> (header, lines)

  # R6 — status transition wins outright
  if edit.type == STATUS_CHANGE and edit.from == SCHEDULED and edit.to == ESTIMATED:
      clearAllTicketFlags(header)
      for line in lines: clearAllTicketFlags(line)
      return enforcePickListInvariant(header, lines)

  # R8 — header-level edits
  if edit.level == HEADER and edit.field in {NEXT_DELIVERY_DATE, DEPOSIT_ANY, LINE_ADDED}:
      setAllPrintedFlagsTo(header, 'R')
      for line in lines: setAllPrintedFlagsTo(line, 'R')
      return enforcePickListInvariant(header, lines)

  # Line-level edits
  line       = edit.line
  affected   = datesAffectedBy(edit)            # set of fulfillment dates
  hdrSlots   = headerSlotsFor(header, affected) # 1 and/or 2, or empty
  lineSlots  = lineSlotsFor(line, affected)

  # R11 — a NEW first date on the line clears that line's flags entirely
  if edit.introducesNewFirstDateOn(line):
      clearAllTicketFlags(line)

  else:
      if 1 in lineSlots:
          demote(line, slot=1)                  # P -> R
          if lineHasPrintedTicketsForTwoDates(line):
              clear(line, slot=2)               # R5
          else if 2 in lineSlots:
              clear(line, slot=2)               # R2
      else if 2 in lineSlots:
          demote(line, slot=2)                  # R3

  # R4 — only header slots this line participates in may move
  permitted = headerSlotsLineIsScheduledFor(header, line)

  for slot in hdrSlots ∩ permitted:
      if slot == 1:
          demote(header, 1)
          if 2 in (hdrSlots ∩ permitted): clear(header, 2)     # R2
      else:
          demote(header, 2)

  # Header slots the line has just LEFT or JOINED also move — see 07 for the
  # exact expected results; the governing question per slot is
  # "does the set of inventory ticketed for this header date still match?"
  for slot in slotsWhoseLineMembershipChanged(header, line, edit):
      if slotNowHasANewDate(header, slot): clear(header, slot)
      else:                                demote(header, slot)

  return enforcePickListInvariant(header, lines)


demote(rec, slot):   if rec.flag[slot] == 'P': rec.flag[slot] = 'R'
clear(rec, slot):    rec.flag[slot] = null

enforcePickListInvariant(header, lines):          # R7
  for rec in [header] + lines:
      for slot in rec.slots:
          if rec.ticketFlag[slot] is null: rec.pickListFlag[slot] = null
```

`slotsWhoseLineMembershipChanged` is the piece the prose does not fully specify. Derive its behavior from the nine scenarios in `07` — they are the specification. Do not ship the state machine until all nine pass.

## Implementation guidance

- **Pure function, no I/O.** Take a snapshot in, return a snapshot out. Persistence and eventing wrap it.
- **Single entry point.** Every order-mutating path — POS entry, Logistical Scheduling inline edit, Transaction Update, API, batch reschedule — must route through it. Scattered flag writes are how this rots.
- **Record *why*.** Log which rule fired for each flag transition. Support staff will ask "why did this reprint?" and the answer must be recoverable.
- **Clearing is destructive.** `R2`/`R5` discard the fact that a ticket was ever printed for that date, and R2's summary form also clears the second date's delivery date information. Confirm with the business whether the new ERP wants an audit trail of destroyed print history that STORIS does not keep.
