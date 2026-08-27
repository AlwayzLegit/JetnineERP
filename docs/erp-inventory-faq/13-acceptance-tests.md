# 13 — Acceptance Tests

One or more per requirement. Follow the repo's existing test framework and naming. Tests marked **★** encode
an exact formula or business rule taken verbatim from the STORIS documentation — these are the parity tests
that must never be softened to make an implementation pass.

---

## Item model & pricing

- `ITEM-010` Creating a product without a group fails at the DB constraint, not just validation.
- `ITEM-010` Changing a group-level setting propagates to products that have not overridden it, and does not
  touch products that have.
- ★ `ITEM-040` **Price resolution precedence.** Seven table-driven cases, one per step, each constructed so
  that exactly one step can match and all lower steps would give a different answer. Assert the resolver
  picks the right step every time.
- ★ `ITEM-041` With `customerContext = null`, steps 3 and 4 are skipped: a customer whose price category
  would win gets the non-customer price in the price book and the customer price on an order. Assert both,
  from the same fixture.
- ★ `ITEM-042` One test per price-matrix usage code, including the two cost-based codes.
- `ITEM-043` With a `Z` price-category entry that is _not_ the highest, the reporting resolver picks `Z` and
  the order resolver does not. (Skip if the decision is not-implemented — record it in the matrix.)
- ★ `ITEM-044` An as-is piece with its own price wins over every step of `ITEM-040`. An as-is piece with a
  null price falls through to the normal chain.
- `ITEM-030` Conversion is blocked by each of the five preconditions independently; each block message names
  the specific blocking documents.

## Costing

- ★ `COST-033` With `freight_costing_mode = ITEMIZED_CONTAINER`, preset vendor and product freight factors
  are ignored by receipt costing. Assert the received unit cost excludes them.
- `COST-033` Changing `freight_costing_mode` while an open receiving batch exists is rejected.
- `COST-032` Product-level factor overrides vendor-level factor.
- ★ `COST-040` A receipt at `0.00` cost raises a cost exception.
- ★ `COST-040` A vendor invoice approved at a cost different from the receipt cost raises a cost exception.
- ★ `COST-042` Auto-resolution never fires on a `$0.00` receipt cost, even when variance is within tolerance.
- `COST-042` Auto-resolution writes an audit row naming the rule that fired.
- ★ `SEC-COST-VIEW` A user without the permission receives an API response with the cost field **absent**
  (not null, not zero), gets no cost column in a CSV export, and sees no cost on the receiving screen.

## Inventory & availability

- ★ `STK-050` `NET_AVAILABLE = QOH − RESERVED − FLOOR_SAMPLES − AS_IS`. Fixture with all four non-zero.
- ★ `STK-051` Week N's beginning net available equals week N−1's ending net available across a 6-week
  projection with receipts and shipments in different weeks.
- ★ `STK-052` `unreserved_quantity` **includes** CWC and ASAP orders, **excludes** layaway, and is **reduced**
  by open credit memos not flagged as-is. Four assertions, one fixture each, plus a combined case.
- ★ `STK-052` An open credit memo **flagged as-is** does _not_ reduce `unreserved_quantity`.
- `STK-021` As-is status can be set from all five entry points; assert the resulting piece record is
  identical in shape regardless of path.
- ★ `STK-060` Flipping `CFG-INV-RESERVEBY` from delivery date to order date changes which of two competing
  orders gets the last unit.
- ★ `STK-100` Quantity above `CFG-POS-QTYERR` raises "Quantity entered exceeds error level"; the message text
  contains the current limit value.
- `LEDGER-001` Ledger rows cannot be updated or deleted (assert at the persistence layer).
- `LEDGER-001` QOH projection recomputed from the ledger equals the stored projection, over a fixture of
  every `transaction_type`.

## Physical inventory

- `PHYS-001` Pre-flight fails, and freeze is blocked, when ledger-vs-projection drift is introduced.
- `PHYS-030` The frozen snapshot is unchanged after post-freeze transactions occur (soft freeze).
- ★ `PHYS-041` A location cannot be marked counted when the bulk piece count ≠ the sum of the count sheet
  line totals; a supervisor override with a note succeeds and is recorded.
- `PHYS-060` Variances above the threshold require `SEC-PHYS-APPROVE` before posting.
- `PHYS-070` Posting is atomic: an injected failure mid-post leaves zero ledger rows and zero GL entries.
- `PHYS-090` Import adapter rejects unmatched SKUs and locations into a rejects file without committing any
  count line.

## Purchase orders

- ★ `PO-022` `Receive At` is editable on an unreceived PO, locked after any receipt.
- ★ `PO-022` Editing an EDI-submitted PO without `SEC-PO-EDIT-EDI` is denied; with it, allowed. Same for a
  printed/faxed/emailed PO and `SEC-PO-EDIT-SENT`.
- ★ `PO-071` Delivery date is editable in PO entry before acknowledgement and rejected after; the
  acknowledgement routine can still change it.
- `PO-031` The line-item distribution window cannot be saved while distributed total ≠ line quantity;
  the even-split default plus deterministic remainder is asserted for a quantity not divisible by the
  location count.
- ★ `PO-091` A PO with `Available < Ordered` on any line **cannot** be fully un-received and **cannot** be
  deleted; the error names the blocking lines and the reason (pick list / manifest / completed).
- ★ `RCV-031` `Available` excludes quantities on a pick list, on a manifest, and completed. One test each.
- `PO-042` Deleting a PO with a linked sales order line is blocked.
- `PO-040` With `CFG-SO-AUTOCREATE = AUTO` a PO is created silently; with `PROMPT` the user is asked; with
  `NEVER` no PO is created. Without `SEC-PO-SOPOS`, no PO is created under any setting.
- ★ `CFG-SO-ASSIGNREQ` on: the created PO line must be reserved to the originating sales order line, and
  saving without the reservation fails.
- ★ `PO-043` Editing special order instructions on the PO **writes back** to the linked sales order line.
- `PO-045` Every creation path stamps the correct `origin` value. One test per path.
- ★ `PO-102` With accounting active, approving a fully-received PO for payment closes it automatically.
- ★ `PO-101` With `CFG-INV-RCVCLOSE` active, receiving a partial PO prompts to close; inactive, it does not.

## Receiving

- ★ `RCV-030` Entering a **positive** number in the Credit column produces a **negative** ledger delta.
  Entering a negative number is rejected with a clear message.
- ★ `RCV-030` Reversing a receipt whose line has been billed/paid is blocked, and the message names the AP
  invoice and points to `RCV-033`.
- ★ `RCV-032` The full over-receipt correction flow reduces QOH and adjusts payables.
- `RCV-033` The paid-vendor path produces a negative stock adjustment with reason `OVER_RECEIPT_PAID` and no
  receipt reversal.
- ★ `RCV-011` A negative quantity against the original reference number and vendor reverses a non-PO receipt.
- ★ `RCV-051` A batch created with `Total Freight Amount = 0.00` and `Action = FINISH_LATER` receives
  merchandise into stock and stays open; entering freight later and closing the batch adjusts inventory cost.
- ★ `RCV-051` Adding freight to a **closed** batch is rejected.
- ★ `RCV-054` Allocated freight sums **exactly** to the freight bill total, with the rounding remainder on the
  largest line. Test with an amount that does not divide evenly (e.g. $1,000.00 across 3 lines).
- `RCV-053` One test per distribution method.

## Replenishment

- `REPL-020` Running sales-rate replenishment with unconfigured replenishment locations fails and names them.
- ★ `REPL-030` With `comprehensive` on, unlinked open PO quantity reduces replenishment need; with it off,
  it does not. Same fixture, two assertions — this is the contradiction in the source docs, pin it down.
- `REPL-040` Dry-run mode creates zero POs and produces the full proposal report.
- `REPL-040` A run breaching a cap creates the PO in `ON_HOLD` with reason `AUTO_REPL_CAP`, not skipped.
- `REPL-041` In `EOD-001`, automatic replenishment runs after receipts, sales, transfers, and PO closings.

## Returns & exchanges

- ★ `RTN-010` A return completes with a **non-existent** order number after the prompt is accepted, when the
  user holds `SEC-RTN-NOORIG`; it is denied without the permission.
- ★ `RTN-012` Same for an exchange.
- `RTN-010` A customer created on the fly at the customer-number prompt is persisted and linked to the return.
- ★ `RTN-020` **Positive** amounts in `Delivery/Pickup` and `Installation/Restock` **increase** the refund;
  **negative** amounts **decrease** it. Four assertions (two fields × two signs), plus the live running total.
- ★ `RTN-040` Group-level return days overrides the POS system default; a multi-group return evaluates per
  line; exceeding the window is blocked without `SEC-RTN-OVERRIDE` and logged with it.
- ★ `RTN-051` A Take-With exchange completes immediately — no open document remains, inventory and financials
  post in one transaction.
- ★ `RTN-052` Take-With is rejected **server-side** at a WMS location.
- `RTN-060` Splitting an exchange yields two independently completable documents, both carrying the
  originating exchange id, with payments, fees, and tax correctly divided.
- `RTN-061` Changing a split-off sales order line to direct ship generates a vendor PO with the customer as
  ship-to and no stock receipt.
- `RTN-030` Completing a return with no payment method creates a customer-account credit balance.
- `RTN-070` `Return to As-Is` produces an individually-tracked as-is piece with its own reason code and price.

## Return to vendor

- `RTV-011` Un-receive against the PO is capped by `Available`.
- `RTV-012` The three-step as-is → RTV list → RTV completion flow relieves inventory and creates the expected
  vendor credit in AP.
- ★ `RTV-014` A quantity of −1 against the original reference number and vendor un-receives a non-PO receipt.
- `RTV-020` / `RTV-021` Both wrong-vendor corrections produce a balanced AP position; assert the net effect
  across both vendors is zero plus the correct inventory position.

## Transfers

- ★ `XFR-011` A paperless transfer posts inventory value **immediately** on save.
- ★ `XFR-012` A documented transfer posts **nothing** to inventory value until completion; the goods are
  visible as in-transit between release and completion.
- `XFR-020` Completing a manifest completes all its transfers atomically; a partial completion leaves the
  shortfall in transit with an exception raised.
- ★ `XFR-020` Manifested pieces are excluded from the receiving `Available` column (couples to `RCV-031`).
- `XFR-030` A transfer with `Type = Floor Sample` sets the piece status and removes it from net available.
- `XFR-040` Piece reference can be updated at both individual completion and manifest completion.
- `XFR-050` `Ship Direct` bypasses multi-leg creation; without it, the configured legs are generated in order.
- ★ `XFR-052` `CFG-POS-AUTOSCHED` **blank** creates no auto transfers; `0` creates them dated today + 1.
  Blank and zero must behave differently.
- ★ `XFR-053` **The documented worked example, verbatim:** transfer created **4/6**, `Auto Schedule Days = 2`
  → calculated **Thursday 4/9**; destination `Automatic Replenishment Days` = Tuesdays only → scheduled
  **Tuesday 4/14**. Assert exactly this.
- ★ `XFR-053` `Automatic Replenishment Days` with **no** days checked fails with a clear error and does not
  loop.
- ★ `XFR-051` A sales order line whose stocking location differs from the deliver-from/pick-up location
  generates an auto transfer that is **not** auto-completed — it waits for manual release.
- `XFR-051` Inquiry screens show the auto transfer with order `Type = TRN`.

## Migration

- `MIG-001` Every migration loader is idempotent: running twice produces identical state and no duplicate
  ledger rows.
- ★ `MIG-020` An inventory row imported without a cost raises a cost exception rather than importing at
  `0.00`.
- ★ `MIG-020` As-is and floor-sample inventory imports as individually-tracked pieces with per-piece cost
  and price; assert net available (`STK-050`) is correct afterwards.
- ★ `MIG-021` In-transit inventory appears at neither endpoint as on-hand.
- ★ `MIG-060` The full go/no-go reconciliation suite runs as an automated check against a staging load and
  fails on any single mismatch. Run it as a test, not a checklist.
