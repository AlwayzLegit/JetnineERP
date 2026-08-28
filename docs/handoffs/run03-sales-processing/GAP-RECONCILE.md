# Run-03 Sales Processing pack — gap reconcile vs shipped Jetnine

Authored 2026-08-28 for task #26. Run 03 audited the STORIS domain Jetnine
has rebuilt most completely (sales, orders, returns, exchanges, payments,
cash, commission), so the bulk of its 164 findings adjudicate as **timing
traps Jetnine avoided by construction** — the run's own closing section
("we would get the shape right and the timing wrong") describes exactly the
three places where the *obviously correct* choice breaks STORIS parity, and
in all three Jetnine deliberately chose obviously-correct. Those are
recorded here as **deliberate anti-parity**, not gaps. What remains is a
migration-caution list (§3) and a five-question owner batch (§4).

## 1. The ten headline findings, adjudicated against shipped code

1. **Credit hold released by EOD, not approval (F153)** — Jetnine has no
   EOD-released hold anywhere. The one entry hold in the sales stack (the
   exchange E1 approval hold, `exchanges.status = 'on_hold'`) releases at
   the moment of approval, event-time. **Deliberate anti-parity.** The
   cutover consequence is real though: STORIS orders extracted in the
   approved-but-pre-EOD window (`"D2 - Approved"`) must import as
   *released* → §3.
2. **Five-step, three-location tax algorithm (F5/F6/F86/F131)** — Jetnine
   tax is one resolution: line's product tax class per-location rate
   (`tax_class_rates`), else the class fallback `rate_bps`, else the
   location/business default. LA Mattress operates in one state, so the
   three-candidate-jurisdiction machinery has nothing to resolve. Not
   built: customer-level exemption (resale certificates) → §4 Q3. RTO tax
   stripping n/a (no rent-to-own).
3. **Seven-level price hierarchy + out-the-door destruction (F15–F19,
   F7)** — Jetnine prices are one list price per variant plus discount
   codes (percent bps / fixed cents, clamped, redemptions ledgered).
   There is no customer price matrix, markdown calendar, or reorderable
   hierarchy — and F7's trap cannot happen: every discount is a recorded
   amount, so margin detail survives any manager intervention. Whether LA
   Mattress needs customer/trade tiers or an out-the-door entry
   convenience are the two real questions → §4 Q1/Q2.
4. **Returns hit the GL only at completion; no-order returns create
   untracked inventory (F64/F69)** — **Deliberate anti-parity on timing**:
   Jetnine refunds derive into the GL on the refund's business date
   (derivation family 9, proportional tax split). F69's trap is closed
   structurally: every return — with or without an original invoice —
   lands in the as-is intake queue (`as_is_items`) priced and reviewed
   before anything re-enters sellable stock.
5. **Cost restatement / provisional margin (F144)** — the audit's biggest
   cross-run finding, and Jetnine's FIFO layers dissolve it: cost is the
   actual layer cost at consumption time, margins are final when written,
   and vendor-invoice variance clears in the G11 matching queue without
   ever restating recorded COGS. There is no average-cost interim, so
   there is nothing to restate and no adjustment records to write.
6. **Named GL postings with fall-through (F38/F140/F159)** — Jetnine's GL
   derivation *refuses* an unmapped account key (family skipped with a
   named reason) instead of falling through to a default — the anti-F1
   decision, applied here too. The received-not-recorded accrual exists
   (system account `2100`) and clears the same way STORIS's does: at AP
   approval (vendor-bills family). Returned-not-recorded is not modeled
   separately — vendor returns flow through the RTV path — accepted lean.
7. **Direct-ship completion creates the AP bill and closes the PO (F8)**
   — Jetnine has direct-ship vendor POs, but the bill is *not*
   auto-created at completion: every vendor bill enters through the one
   AP invoice-matching path. Accepted difference (one entry path for AP
   beats a side door), flagged in case AP payment ops (owner-gated, run-01
   Q2) wants the auto-bill later.
8. **Nineteen access mechanisms (F34/F45/F74/F115/F117/F125/F164)** —
   Jetnine has exactly one: permission catalog + system roles + tri-state
   membership overrides + location data scopes. F125's sales-data scope
   switch ≈ `membership_location_scopes`; F164's read-only process ≈ the
   same pages with mutation permissions withheld. STORIS's four separate
   refund permissions and per-payment-type security collapse into single
   catalog entries today; the catalog is extensible if the owner ever
   wants finer grain. `W-050` cannot invert here (same verdict as run 02).
9. **Screen composition is configuration; menu-less screens exist
   (F155/F156)** — Jetnine screens are code; there is no configuration
   layer beneath the settings pages (SET-007 *is* the registry, and it is
   enumerated). The finding's real payload is a cutover caution: the
   STORIS field inventory is a lower bound, which is exactly why the
   owner's photograph-the-live-config-screens Ops item exists.
10. **ASAP/CWC invisible to date-filtered searches (F4/F127)** — Jetnine
    order lists show unscheduled orders by default; no query requires a
    date. The finding survives as the single most important migration
    caution: any *STORIS-side* extract or reconciliation driven by date
    ranges silently drops the orders customers are waiting on → §3.

## 2. Cluster sweep — the rest of the 164

- **Cash balancing (F99–F105)** — **confirmed parity, shipped this
  sprint**: blind count by design, tolerance, attempt limits, suspension,
  and approval through `pos.cash.approve` — with one improvement over
  F100: Jetnine never reveals expected/variance to the counter, only to
  the approver. Settlement batches / two-day provider files (F96–F98) are
  gateway-side in our world, not ERP batches.
- **Exceptions have two opposite semantics (F130/F154 vs run-02's cost
  queue)** — Jetnine already implements both on the correct sides:
  `exception_events` is an append-only encounter log (never retracted),
  and the vendor-invoice/cost side is a clearable work queue. The
  build-one-with-the-other's-semantics trap the summary warns about is
  already structurally avoided.
- **Commission (F24, F109–F115, F146–F148)** — `commission_entries` are
  written at event time from the plan and never recomputed — F147
  ("settings changes do not propagate to existing orders") is parity *by
  construction*. Exchanges carry per-leg salesperson attribution.
  Adjustments are offsetting entries, leaner than STORIS's engine but the
  same shape. Imported records never accrue (D8).
- **Line statuses, backorders, splits (F2, F9, F20–F29, F132)** — Jetnine
  fulfillment is explicit: order lines allocate to deliveries, splitting
  is native, nothing suppresses shipment silently, and no 52-suffix
  backorder cap exists because partial fulfillment is the normal path.
  Reports compute from lines, so F132's row-explosion artifact has no
  equivalent. Cross-order delivery consolidation (F29) is not built —
  accepted lean.
- **Route freeze at manifest (F30)** — parity, shipped this sprint: stock
  manifests freeze lane/loads at build; delivery runs do the same for
  customer deliveries.
- **Payments (F34–F44, F51–F54)** — Jetnine has one integrated card path,
  not three selectable integrations; gift cards are ledgered
  (`gift_card_transactions`); refund-to-original-card feasibility is the
  gateway's call. Pre-authorized deposits (F37) and convenience fees
  (F52) not built — accepted lean. The payment-gateway identity question
  (Shift4 legacy vs new; token portability) is already open with the
  owner from run 07.
- **Special order / COM (F13, F55–F63)** — special-order allocations
  couple SO↔PO as a quantity link (the run-02 W-042 verdict, upheld here);
  all-or-nothing PO-family deletion logic is enforced through lifecycle
  guards. The furniture configurator/COM wizard is deliberately not
  rebuilt — LA Mattress does not sell configured furniture.
- **Returns & exchanges (F45–F50, F64–F75, F95)** — the shipped exchange
  container covers one-document/two-net-totals, E1-style entry hold,
  restocking fee, split as the escape hatch. Return windows and overrides
  shipped in task #10. Deposit caps / minimum-deposit derivation
  (F39/F49/F50) not built — balances are computed and
  `orders.complete_with_balance` gates release; accepted lean. Quick Sale
  (F70) is simply the POS sale path; EOD-deleted carts (F71) have no
  equivalent (drafts persist).
- **Customers (F76–F84)** — CRUD, notes, tags, segments shipped;
  duplicate *search* exists at create; duplicate *merge* does not → §4 Q4
  (and it matters for cutover dedupe). We will never replicate F78's
  SSN-keyed duplicate search — Jetnine does not store SSNs. Address
  verification services (F80) and the separate Customer History mailing
  file (F83) are not rebuilt; segments/campaigns and the GHL-style
  platform layer own that surface.
- **Financing & receivables (F85–F94, F133–F139, F161)** — financing is a
  tender backed by an external provider; applications, estimators, and
  kiosk mode live with the provider, not the ERP. In-house installments
  exist (`payment_plans`). Charged-off detail (F135), live credit
  inquiry (F136), shared accounts (F137) — not built; AR remainder is
  already owner-gated (run-01 Q2/Q5). F161's trap (deleted orders
  retaining live auth numbers) can't occur: Jetnine cancels, never
  deletes, and payment records keep their gateway references.
- **Up System & InTouch CRM (F106–F124)** — deliberately not rebuilt in
  the ERP. Lead rotation, action codes, and the CRM's five-level security
  belong to the platform layer (GHL model). The Up System's *separate end
  of day* (F106) is exactly the kind of shadow batch Jetnine's single
  declared EOD registry exists to prevent.
- **Reports & purges (F123, F126–F129, F142–F145, F149–F152, F160,
  F164)** — the report builder + report registry cover the
  view/report surface; VAMOO-style saved queries are report definitions.
  **Jetnine never purges** — F145/F160's EOM/retention purge chains have
  no equivalent, and history stays queryable. Availability is one
  definition (run-02 verdict stands against the count now being nine);
  date-bearing ATP (F157) remains deferred with the replenishment engine
  covering supply visibility.
- **Membership rewards (F158)** — the run-03 "cannot reconstruct"
  verdict is **superseded**: run-07 F568 (batch 17) documented the
  earning/redemption mechanics. What remains is a business decision, not
  a documentation gap → §4 Q5.
- **Protection plans / warranty (F12, F48, F60, F151)** — plans sell as
  ordinary line items; warranty intake runs through service orders and
  the as-is queue. Auto-attach tiebreak logic (F12) not built — accepted
  lean.
- **Volume rebates (F163)** — run-02 W-046 territory, still deferred.

## 3. Migration-time cautions adopted (for the cutover runbook)

1. **Never drive a STORIS extract or reconciliation by date range** —
   ASAP/CWC orders are invisible to date-filtered searches (F127). Pull
   open orders by status, then union a date-ranged sweep, and diff.
2. **Import approved-but-pre-EOD held orders as released** (F153) — do
   not carry the hold code into Jetnine.
3. **Clear the cost-exception queue before the inventory freeze** (F144,
   restating run 02) — unresolved exceptions mean STORIS margins on
   recent orders are provisional and will not match ours.
4. **Run STORIS's deleted-orders / finance-auth report** (F161) before
   cutover so no live authorization is stranded on a deleted order.
5. **Extract rewards balances** (F158/run-07 F568) whatever §4 Q5
   decides — even "drop the program" needs the liability number.
6. **Expect duplicate customers** — STORIS merge history and its
   name/phone/email/SSN dedupe (F77–F79) mean the customer extract will
   carry near-duplicates; §4 Q4's merge tool is the cleanup path.
7. **Photograph live config screens** (F155/F156, already an Ops item) —
   the documented field inventory is a lower bound.

## 4. Owner batch — five questions

1. **Customer / trade pricing**: does LA Mattress sell at negotiated
   per-customer or trade prices (contractors, hotels, staff), or is list
   price + discount codes the whole model? If yes: lean build is a price
   tier per customer with per-variant overrides. Default: current model.
2. **Out-the-door price entry**: want a POS "set the final total"
   convenience? Jetnine's version would back-compute a *recorded* order
   discount (line detail preserved — F7's destruction cannot happen).
   Say yes/no.
3. **Tax-exempt customers**: do resale-certificate / exempt customers
   exist? Lean build: an exempt flag + certificate number on the
   customer, zeroing tax at sale with the exemption audited. Default: not
   built.
4. **Customer merge (recommended: yes)**: build a merge tool (pick
   survivor, re-point sales/orders/plans/credits, audit trail) before
   cutover dedupe? Without it, duplicate imports are permanent.
5. **Membership rewards**: does LA Mattress actively run the STORIS
   rewards program? If yes → lean points ledger per the run-07 F568
   mechanics; if no → convert balances to store credit at cutover, or
   drop with notice. Say run / convert / drop.

Everything else in the run is shipped, deliberate anti-parity (recorded
above), platform-layer territory, or cutover reference. No code changes
follow from this reconcile until §4 lands.
