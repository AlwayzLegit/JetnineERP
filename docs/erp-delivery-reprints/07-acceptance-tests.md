# 07 — Acceptance tests

These are STORIS's own published expected results. Port them into the repo's test framework **before** implementing `02`. They are the specification; the prose in `02` is the commentary.

## Fixture A — the date-change fixture

Used by scenarios S1–S9. One order, **3 line items**, **3 dates**.

| Record | Scheduled dates |
|---|---|
| **Header** | 06/01 (first), 06/03 (second), 06/08 (third) |
| **Line 1** | 06/01 — **plus an additional unscheduled quantity** |
| **Line 2** | 06/03 and 06/08 |
| **Line 3** | 06/01, 06/03 and 06/08 |

Assume tickets have been printed wherever the rules permit, so flags start at `P` in every printable slot.

---

### S1 — new earliest date on any line

**Action:** change the first date on **any** line item to `05/29` — a date not previously on the order and earlier than every existing date.

**Expected:** **all flags are cleared** — there is a new first date on the order.

---

### S2 — line 3's first date moves to a new date that becomes the order's second date

**Action:** change line 3's first date to `06/02` (not previously on the order; becomes the order's new second date).

**Expected:**
- All **line item** flags cleared — there is a new first date on the line.
- **Header first flag → `R`** — it no longer includes line 3.
- **Header second flag cleared** — there is a new second date.

---

### S3 — line 3's first date moves to another new date

**Action:** change line 3's first date to `06/04` (not previously on the order; the source describes this as becoming the order's new second date).

**Expected:**
- All **line item** flags cleared — new first date on the line.
- **Header first flag → `R`** — no longer includes line 3.
- **Header second flag → `R`** — no longer includes line 3.

> Contrast with S2: the same kind of edit, differing only in *which* date, produces `cleared` vs `R` on the header's second slot. The discriminator is whether the order's second **date value** changed (S2) or only its **line membership** changed (S3). See `08` — the source's parenthetical for S3 appears inconsistent with the fixture; transcribed as published.

---

### S4 — line 2's first date moves to a new date that is still the order's second date

**Action:** change line 2's first date to `06/02` (not previously on the order, still the second date on the order).

**Expected:**
- All **line item** flags cleared — new first date on the line.
- **Header first flag unchanged** — this change does not affect it.
- **Header second flag cleared** — there is a new second date.

---

### S5 — line 2's first date moves to a new date that is not the order's second date

**Action:** change line 2's first date to `06/04` (not previously on the order, not the second date on the order).

**Expected:**
- All **line item** flags cleared — new first date on the line.
- **Header first flag unchanged** — this change does not affect it.
- **Header second flag reset** — it no longer includes line 2.

---

### S6 — line 1's first date moves to the order's existing second date

**Action:** change line 1's first date to `06/03` (the order's second date).

**Expected:**
- All **line item** flags cleared — new first date on the line.
- **Header first flag → `R`** — it no longer includes line 1.
- **Header second flag → `R`** — it **now** includes line 1.

---

### S7 — line 3's first date moves to the order's existing second date

**Action:** change line 3's first date to `06/03` (the order's second date).

**Expected:**
- All **line item** flags cleared — new first date on the line.
- **Header first flag → `R`** — no longer includes line 3.
- **Header second flag → `R` if the quantity for line 3 has changed; otherwise it remains `P`.**

> The only scenario whose result is quantity-conditional. The state machine must know whether the *inventory* on the second date changed, not just whether membership changed.

---

### S8 — line 2's first date moves onto the order's first date, partially

**Action:** change line 2's first date to `06/01` (the order's first date), **leaving some inventory scheduled on 06/03**.

**Expected:**
- All **line item** flags cleared — new first date on the line.
- **Header first flag → `R`** — it **now** includes line 2.
- **Header second flag → `R`** — the inventory from line 2 has changed.

---

### S9 — line 3's second date moves to the order's third date

**Action:** change line 3's second date to `06/08` (the order's third date).

**Expected:**
- **Line item flag → a single `R` for the first date; the second date cleared.**
- **Header first flag unaffected.**
- **Header second flag → `R`** — it no longer includes line 3.

---

## Rule-level tests

### T1 — header/line date sets diverge (R4)

Header scheduled 06/01 and 07/01; line scheduled 06/01 and 08/01. Change the line.
**Expected:** only the header's **first** flag may change → header becomes **`R:P`**.

### T2 — first-date change with two printed tickets (R5, Example A)

Header `P:P`, line `P:P`, both scheduled 06/01 and 07/01. Change the inventory scheduled for the first date on that line.
**Expected:** both the line and the header collapse to a **single `R`** — first date should be reprinted, second date *must* be reprinted.

### T3 — first date changed outright (R5, Example B)

Header scheduled 06/01 and 07/01, both tickets printed. Change the first date to 08/01.
**Expected:** **all flags on both header and line cleared**; the 07/01 ticket requires a reprint.

### T4 — already-`R` first flag still clears the second (R5)

Same as T2 but the line's first flag is already `R`.
**Expected:** the second-date flag is still cleared.

### T5 — scheduled → estimated (R6)

Any order with printed tickets; change status from scheduled to estimated.
**Expected:** **all** ticket flags cleared, header and every line.

### T6 — pick list invariant (R7)

For every case above where a ticket flag becomes `null`.
**Expected:** the pick list print flag for that same date is also `null`. Assert this as a global post-condition on every test, not as an individual case.

### T7 — header-level edits (R8)

Change next delivery date; add a deposit of any kind; add a line item.
**Expected:** header flags reset to `R`, **and** line item flags reset to `R`.

### T8 — second-date print eligibility (R10)

A second-date ticket may print **only if** the first-date ticket has already printed **and**:
- **(a)** one line is scheduled only for the second date and has pieces **reserved** (it may be scheduled for dates other than the first date); **or**
- **(b)** one line is scheduled for both first and second dates, with **all pieces assigned** for the first date and **some or all reserved** for the second.

Write negative cases too: first-date ticket not printed → second-date print refused regardless of (a)/(b).

### T9 — line dates outside the header's first two slots

Per the consistency conditions in `02`: a line whose two dates are neither the header's first nor second date can have **no tickets printed**. Assert the print routine refuses, and that the state machine never writes a non-null flag into those slots.

### T10 — multiple fulfillment summary table

Tickets printed for both first and second dates; apply a change affecting:

| Affected | Expected first flag | Expected second flag |
|---|---|---|
| first date only | `R` | unchanged *(inferred — source states only the affected flag)* |
| second date only | unchanged *(inferred)* | `R` |
| both | `R` | cleared, **and the second date's delivery date information cleared** |

## Print-routine tests

- **P1** Balance gate: open balance > `Maximum Balance` **and** `Over Maximum Balance` = `Disallow Ticket Print` → print refused. Either condition alone → print allowed.
- **P2** Back order counter at 53 → error from the print routine.
- **P3** `Print Preview` = on → no flag changes, no reservation changes; requires Order Type = Deliveries.
- **P4** `Suppress Print` = on → no document produced, but flags updated, pieces assigned, RF picking items added, WMS updated for customer pickups.
- **P5** `Selection Options` = `Reprints Only` → returns only orders flagged `R`; an order flagged `R` that has since been reverted to unchanged does not reprint.
- **P6** Successful print sets the grid `D` column to `Y`, assigns inventory, and makes the order eligible for picking and manifest creation.
- **P7** Neither Route nor Truck specified → sorted by truck when `Mapping Active` and Order Type = Deliveries; by route when Order Type ≠ Deliveries.
- **P8** Order Type = Transfers → none of the Orders/Returns/Exchanges checkboxes are active.
