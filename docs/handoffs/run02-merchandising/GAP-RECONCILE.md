# Run-02 Merchandising pack — gap reconcile vs shipped Jetnine

Authored 2026-08-28 for task #30. This run dissects the STORIS domain
Jetnine has already largely rebuilt (PO core, costing, replenishment,
transfers, physical inventory, reports), so most of its 145 findings
adjudicate as **traps Jetnine avoided by construction**. What remains
is a short owner batch (§3).

## 1. The ten headline findings, adjudicated against shipped code

1. **OTB landed vs GMROI unlanded (F137/F110)** — Jetnine has neither
   OTB nor GMROI yet (both deferred); when either is built, one cost
   basis (FIFO layer cost) serves both. Trap avoided by having ONE
   cost.
2. **Cost-exception queue, no PPV account (F29–31)** — Jetnine's G11
   vendor-invoice matching already is the queue done right: variance
   inside tolerance auto-clears, outside lands in the reject bucket
   with an exception. Nothing blocks physical inventory. No change.
3. **Five one-way PO gates (F70)** — Jetnine's PO status is one
   lifecycle with explicit endpoint guards (place/edit/un-receive
   refuse when receipts, pick-list-equivalents, or invoices exist).
   The latches exist as *checks*, not scattered module flags. No
   change.
4. **Nine hold sources, reason never recorded (F12/F52)** — Jetnine
   holds are `draft` + audited reasons (auto-replenishment note,
   sales-rate `automaticallyHoldPos`); held drafts count as supply
   deliberately and the tracker records it. The STORIS trap (unlogged
   inverted-permission holds) does not exist here.
5. **Access from log-on context (F85/F86/F88)** — Jetnine access
   derives from membership + permission overrides + store data scope,
   never from a sign-in location; the report builder just re-used the
   same single evaluation path. `W-050` cannot invert here.
6. **Eight availability definitions (F108)** — Jetnine has exactly
   one: `onHand − reserved − floorSample`, used by POS, transfers,
   replenishment, and reports alike. The two-formula NET AVAIL
   conflict is a STORIS-history note only.
7. **13-level landed cost, never trued up (F34/F35)** — Jetnine
   receipts cost at the PO line (FIFO layers); there are **no landed
   components**. Whether freight/duty should load into unit cost is a
   real business question → §3 Q1.
8. **PO type as a policy object (F83)** — Jetnine has `directShip`
   only. The transfers/SOM reconciles already asked about types; the
   run's advice ("extract the live type table") joins the migration
   checklist → §3 Q2.
9. **EOD as transaction boundary (F101)** — Jetnine's EOD is a
   declared, ordered, idempotent job registry; reservation is
   event-time (B14), not nightly. The undocumented STORIS ordering
   problem does not apply.
10. **PO↔SO is a quantity link, not sync (F50)** — matches shipped
    design: special-order allocations link quantities; stock lines
    never ripple. Documented parity, no change.

Also: the four **Kardex ledgers** ≈ `inventory_movements` (one
append-only ledger, already reconstructable — strictly simpler);
`BMW_ACF`/vendor-subsidiary/Model-Pattern are STORIS-extraction items
for cutover, not build items; the buyer's-worksheet `Build a Report
File` pattern is now served by the report builder's future
WorkingDataSet slice (flagged in task #28's deferrals).

## 2. Migration-time cautions adopted from §G

Recorded for the cutover runbook: clear STORIS cost exceptions before
any inventory freeze/extract; expect landed cost baked into STORIS
inventory values but absent from GMROI history; extract the live PO
type table and `BMW_ACF`; treat STORIS "who can see what" audits as
unreliable (log-on-context access).

## 3. Owner batch — three questions

1. **Landed cost**: should freight/duty/other inbound charges load
   into unit cost (FIFO layers) at receipt? Today vendor-invoice
   variance is matched but unit cost = PO line cost. If yes: one
   freight field per PO (allocated by quantity) is the lean version —
   say "yes lean", "yes with per-component add-ons", or "no, freight
   stays an expense".
2. **PO types**: do you need PO types as policy bundles (as-is intake
   POs, container POs…) beyond the existing direct-ship flag? (Same
   family as transfers Q4/Q6 — answer them together.)
3. **Open To Buy**: build an OTB budget module (period budgets per
   category with committed/received tracking), or is the sales-rate
   replenishment engine + reports enough spend control for now?
   Default: skip until asked.

Everything else in the run is either shipped, superseded, or cutover
reference. No code changes follow from this reconcile until §3 lands.

## §4 Decisions received (owner, 2026-08-28)

- **Q1 Landed cost: yes, lean** — one freight amount per PO, spread
  across units at receipt into the FIFO layer cost.
- Q2 (PO types) and Q3 (Open To Buy) still open.
