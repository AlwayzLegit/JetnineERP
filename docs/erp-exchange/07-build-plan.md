# 07 — Build Plan

Phasing for Enter an Exchange. Read `00-README.md` and `01-domain-model.md` first — the
container-over-two-documents decision in `01` shapes every phase below.

Before starting: **read the repo.** Enter an Exchange overlaps heavily with sales order entry
(Step 3 is essentially full line entry) and with returns. If either already exists in the
codebase, this is largely a composition job, not a new build. Check before writing anything.

---

## Phase 0 — Decisions to settle first

1. **Container or negative lines?** `01` argues for a container over a `CustomerReturn` and a
   `SalesOrder`. Confirm, because everything else assumes it.
2. **Settings triage.** `06` lists 60+ settings. Walk the `keep` list with the business and
   hard-code every answer that doesn't genuinely vary. This conversation happens **before**
   Phase 1 or it never happens.
3. **Return commission policy.** Two independent salesperson attributions, one of them on a
   negative transaction. The source doesn't say how return commission behaves. Ask.
4. **Which vendor integrations are real?** 2020 Spaces, Flexsteel, Pro Kitchen, AFI
   replenishment, EMV terminals, signature capture. Probably most are out.
5. **Protection plan model.** Tiered vs. non-tiered pricing, plan transfer on exchange,
   cancellation restriction windows, plans carried forward vs. cancelled. This needs its own
   spec before Phase 3 — it is the most rule-dense object in the flow.
6. **Pre-cutover returns.** The no-original-order path is a live migration requirement, not an
   edge case. Decide now how a return with no priced original is valued and reported, since the
   source says it produces no selling price and no inventory activity record.
7. **Financed-order exchange policy.** Even-exchange-only on installment/RTO is a real
   constraint. Confirm it matches whatever finance providers LA Mattress uses.

---

## Phase 1 — The exchange container and the happy path

**Build:** `01`, `02`

- `Exchange` container linking a `CustomerReturn` and a `SalesOrder`, with shared customer,
  date, store, fulfillment method, and a single settlement.
- Header: exchange number, original order (including the no-original path with its permission),
  date validation (no future dates, no closed periods), store.
- Per-leg salesperson attribution, both inactive until Original Order is set.
- Customer selection: numeric-vs-alpha entry behavior, merged-customer resolution, on-the-fly
  creation, Regional Processing scoping.
- Tax status inheritance from the original invoice, with expiration checked against the sale's
  written date.
- The three fulfillment methods, switchable at any point.
- Audit log — append-only, structured, with override capture.

**Acceptance:**
- An exchange with no original order can be created **only** with the permission, and prompts
  before proceeding.
- Return and sale salespeople are independently settable, and a change to one does not touch
  the other.
- A return against a tax-exempt original credits at the original's tax treatment, not today's.
- A customer code that was merged resolves to the surviving customer.
- The date validator rejects future dates and closed periods; backdating requires the
  permission.

---

## Phase 2 — Split Exchange

Yes, second. If the container model is right, this is cheap now and impossible later — and it
is the feature that proves the model.

**Build:** `05` § Split Exchange

- Dissolve the container; promote the return and the sale to independent documents; each
  completes on its own.
- Reconcile shared state at split: fulfillment, settlement already applied, holds.

**Acceptance:**
- An exchange with a payment applied splits without losing or double-counting the payment.
- After splitting, each document is independently completable.
- **No edit is possible only-after-split** — if any restriction in the source exists purely
  because the legs were fused, it should not exist in our system at all. If one survives, the
  container model is wrong; stop and revisit `01`.

---

## Phase 3 — The return leg

**Build:** `03`

- Original Order Piece Selection as the default entry path; manual entry as the exception.
- Line fields with the two reduction mechanisms (prorated warranty, reduced return percentage),
  each capped at the original price, each with its own override.
- **Cost reduction decoupled from customer credit** — two separate values.
- Reason codes, including the As-Is Restricted permission gate.
- **Return to As-Is** routing, with the setting default and a reporting hook.
- Inventory Selection for quantity, reference number, storage location, reason.
- Deposit/financing line lock.
- Return window with its override.
- Protection plan transfer on return (per Phase 0 item 5).

**Acceptance:**
- No return credits more than the original price, through any path.
- Editing the reduced return price leaves the cost reduction unchanged — assert on both values.
- As-Is routing lands stock in the As-Is bucket and appears in product activity.
- With a deposit applied, an unprivileged user can neither add nor delete lines.

---

## Phase 4 — The sale leg

**Build:** `04`

Largest phase. If sales order line entry already exists in the repo, **reuse it** — this is
that, plus the even-exchange defaulting.

- Even-exchange prompt and defaulting from the first returned product.
- Product eligibility rules (defective block, warranty-per-category, dropped/discontinued
  availability).
- Pricing: unit price override, discount codes with the formation/location/As-Is filters,
  multiple discounts, coupons, amount overrides, automatic product discounts.
- Sourcing: stock location resolution, alternate stock location logic with its ATP tiebreak and
  formation exclusion, ship location, auto-transfer creation.
- Scheduling: fulfillment date with route capacity, ATP/ATC dates and the restriction override,
  multiple delivery dates.
- Line status flag **set** (not enum), with hold-quantity shipping semantics.
- Special order → PO-or-reserve requirement.

**Acceptance:**
- Applying a discount then overriding the price, and the reverse, both end in a defined state
  the user was told about — no silent discount removal.
- A special order line cannot be saved without either a PO or a reservation.
- Ship ≠ stock location with Auto Schedule Days set creates the auto-transfer; the auto-transfer
  change locks then apply.
- Alternate stock location selection picks the earliest ATP, and skips products in an excluded
  formation.
- A line with 3 of 5 on hold ships no more than 2.
- Route capacity decline leaves the line **visibly** unscheduled.

---

## Phase 5 — Payment, netting, and completion

**Build:** `05`

- Two-sided totals with the sign conventions made explicit (separate refund/fee fields, not one
  signed box).
- Exchange discount caps — sale discount ≤ sale subtotal, and ≤ return discount; fixed amounts
  only.
- Downgrade-exchange minimum-eligibility check with the split-exchange suggestion.
- Restocking fee: auto-calculate, override, override-stops-recalculation, audit write.
- Payments and refunds, gift certificate exclusion, credit-card refund timing tied to return
  completion, builder-allowance certificate path.
- Financing: third-party and revolving, credit line checks, C6 hold, post-authorization lock.
- Protection plan cancellation-restriction check, cancel vs. carry-forward.
- Ticket print gate (all five conditions).
- Completion and the settlement paths.

**Acceptance:**
- A fixed subtotal discount on the sale leg cannot exceed the return leg's discount — test the
  recalculation.
- A downgrade exchange triggers the minimum-eligibility check.
- An overridden restocking fee never silently recalculates, and the override is in the audit log.
- Credit card refunds do not move money until the return is completed.
- Exchanging a plan-covered product **onto the same plan** is allowed past the cancellation
  window; **cancelling** it is not.
- Ticket print is unavailable when any of the five conditions fails — one test per condition.
- Each settlement path (debit, A/R credit, refund check, even) posts exactly once.

**Restructure the save flow.** Replace the seven-prompt modal chain with one review-and-confirm
screen showing the settlement, a single commit, then document offers. Do not port a sequence
that lets someone click through an A/R posting without reading it.

---

## Deliberately out of scope

| Item | Why |
|---|---|
| Right-click menu framework (Dynamic Escape Settings) | Ship the two inquiries as actions |
| Desktop email client launch | Replace with tracked, logged sends |
| Manual order numbering | Always auto-assign |
| Vendor imports (2020 Spaces, Flexsteel, Pro Kitchen) | Pending Phase 0 item 4 |
| Most of the 60+ settings | Pending Phase 0 item 2 |

---

## The four things most likely to go wrong

1. **Modeling the exchange as a sales order with negative lines.** It fails on separate
   salespeople, separate discount subtotals, As-Is routing, and Split Exchange. `01`.
2. **Porting the settings wholesale.** 60+ settings is 60+ permutations to support forever.
   Triage in Phase 0 or inherit STORIS's accumulated policy debt on day one.
3. **Letting refunds exceed what was paid.** Two reduction mechanisms, two override
   permissions, one cap. Every path needs the cap, including the no-original-order path where
   there is no recorded selling price to cap against — decide what happens there in Phase 0.
4. **Treating discount rules as cosmetic.** The exchange-specific caps in `05` are anti-abuse
   controls. A stacked discount surviving a downgrade exchange is cash walking out the door.
