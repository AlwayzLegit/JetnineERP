# 12 — STORIS → LA Mattress ERP Cutover Plan

This is the inventory/purchasing slice of the cutover. Sales, delivery, accounting, and CRM slices are
specified elsewhere; the sequencing here assumes those exist.

---

## MIG — Data migration

### `MIG-001` Migration principles

- **Everything lands through the ledger.** Opening balances are `MIGRATION_OPENING` ledger rows
  (`LEDGER-001`), never direct writes to a quantity column. This means day one is reconcilable and
  every later report can replay to any date.
- **Every migrated record keeps its STORIS key** in a `legacy_id` / `legacy_system` pair. Non-negotiable —
  it is how you answer "what happened to PO 44812" for the next three years.
- **Reconcile at every stage**, on counts _and_ dollars, and refuse to proceed on a mismatch.
- **Idempotent loaders.** Every migration script must be safely re-runnable.

### `MIG-010` Static/master data (migrate first, well before go-live)

Order matters — each depends on the previous:

1. Districts, regions, locations (`LOC-010`), WMS flags
2. Storage locations (`LOC-020`) and per-location tracking flags (`LOC-021`)
3. Product categories → groups → products (`ITEM-010`) — validate the hierarchy is complete; STORIS data
   commonly contains orphans, and `ITEM-010` enforces NOT NULL
4. Vendors, vendor ship-from addresses (`PO-020`), vendor cost factors (`COST-031`)
5. Product cost factors (`COST-032`), PO line text, CFI (`ITEM-060`), benefits text (`ITEM-050`)
6. Pricing: product / district / location scopes and price tables (`ITEM-045`), price matrix (`ITEM-042`)
7. Product images (`ITEM-070`/`071`)
8. Reason codes (`STK-080`), including a seeded `CONSIGNMENT` code
9. Control settings (`09`) — **set deliberately, do not blind-copy STORIS values**; every
   `[DECISION NEEDED]` in this pack must be answered before this step
10. Users, groups, permissions (`10`)

### `MIG-020` Inventory balances (migrate at cutover)

- Quantity on hand by product × location × storage location × status × piece.
- **Piece-level records are mandatory** for as-is and floor-sample inventory (`STK-020`) — each with its own
  cost, selling price (`ITEM-044`), and reason code. Bulk-loading these as plain saleable quantity is the
  most likely serious migration error; it silently inflates net available (`STK-050`).
- Cost per piece / average cost per product×location.
- **Any row arriving without a cost raises a cost exception (`COST-040`) rather than importing at zero.**
  Expect a queue on day one; that is correct and better than silent $0 inventory.
- Reconcile: total units and total extended cost per location against the STORIS valuation report, to the
  penny, before opening the doors.

### `MIG-021` Open documents (migrate at cutover)

| Document                                            | Notes                                                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open POs (`PO-001`)                                 | Including partial receipts, linked SO lines (`PO-042`), acknowledgements (`PO-071`), holds (`PO-080`), distribution splits (`PO-031`). `origin = MIGRATION` (`PO-045`). |
| Open receiving batches (`RCV-050`)                  | **Strongly prefer closing all freight batches in STORIS before cutover.** Migrating a half-allocated freight batch is not worth the complexity.                         |
| Open transfers and manifests (`XFR-012`, `XFR-020`) | In-transit inventory must appear as in-transit, not as on-hand at either end.                                                                                           |
| Open RTVs (`RTV-012`)                               | With expected vendor credits.                                                                                                                                           |
| Open sales orders with reservations                 | Reservations must be reproduced exactly, or net available (`STK-050`) is wrong on day one.                                                                              |
| Open cost exceptions (`COST-040`)                   | Migrate them; do not clear them.                                                                                                                                        |

### `MIG-030` Historical sales — the returns problem

_Source: I1, I8_

**This is the highest-risk item in the cutover and the reason `RTN-010`/`RTN-012` are P0.**

On go-live day, every sale LA Mattress has ever made is a "pre-system" sale to the new ERP. Customers will
walk in with mattresses bought last month and expect a return or a warranty exchange. The STORIS FAQ answers
for "can I return an item we sold pre-STORIS" describe exactly the capability we need on day one.

Two complementary requirements:

1. **Migrate completed sales history** — at minimum: customer, order number, date, product codes, quantities,
   prices, delivery date, warranty terms — for a lookback window covering the longest return/warranty
   obligation (mattress warranties run 10+ years; `[DECISION NEEDED]` — confirm the window, and whether
   full history or a summarized "returnable document" record is migrated).
2. **Support returns with no original document** (`RTN-010`, `RTN-012`) gated by `SEC-RTN-NOORIG`, with the
   loss-prevention exception report (`RTN-011`) actively monitored for the first 90 days. This is the
   safety net for anything history migration misses.

Both. Not one or the other.

### `MIG-040` What not to migrate

Closed POs older than the AP retention window, cleared physical inventory freezes, resolved cost exceptions,
and superseded price history may stay in a read-only STORIS archive. Provide a **legacy lookup** screen that
queries the archive by `legacy_id` so staff are never told "that's gone."

---

## Cutover sequence

### `MIG-050` T-minus timeline

| When  | Action                                                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| T−90d | Complete the repo audit (`00-coverage-matrix.md`). Answer every `[DECISION NEEDED]`.                                                           |
| T−60d | P0 requirements code-complete; acceptance tests (`13`) passing.                                                                                |
| T−45d | **Trial migration #1** into a staging environment from a production STORIS snapshot. Reconcile units and dollars. Record the delta list.       |
| T−30d | Parallel run begins: key transactions entered in both systems, daily reconciliation of QOH and valuation. P1 requirements complete.            |
| T−21d | **Trial migration #2.** Target: zero unexplained variances. Time the run — it must fit the freeze window.                                      |
| T−14d | User training on the routines in `02`, `05`, `07`, `08` — these are the daily-driver screens.                                                  |
| T−7d  | Freeze STORIS configuration changes. Close all open receiving/freight batches (`MIG-021`). Work the cost exception queue to zero (`COST-041`). |
| T−3d  | Complete or cancel in-flight transfers where practical, to minimize in-transit migration.                                                      |
| T−1d  | Final physical verification of high-value/high-velocity SKUs.                                                                                  |

### `MIG-051` Cutover window

1. Stop transactions in STORIS. Announce the freeze to all locations.
2. Run STORIS end-of-day (`EOD-001` equivalent) to settle closed dates and batches.
3. Extract final balances and open documents.
4. Load into LA Mattress ERP. Run all reconciliations (`MIG-060`).
5. **Go / no-go decision** against the criteria below.
6. Open transactions in the new system. STORIS goes read-only, not off.

### `MIG-060` Reconciliation gates — go/no-go criteria

Hard gates. Any failure is a no-go:

- Total inventory units per location: **exact match**.
- Total inventory extended cost per location: **match to the penny**, and ties to the GL inventory account.
- Open PO count and total open PO value: exact match.
- Reserved quantity per product: exact match (drives `STK-050`; a mismatch means salespeople see wrong
  availability on day one).
- In-transit quantity: exact match; appears at neither endpoint as on-hand.
- As-is and floor-sample **piece counts**: exact match, with piece-level prices present.
- Net available (`STK-050`) computed in the new system for the top 200 SKUs matches STORIS: exact match.

### `MIG-070` Day-one operating posture

- Automatic replenishment (`REPL-040`) runs in **dry-run only** for the first 14 days.
- Cost exception queue (`RPT-COST-EXCEPTIONS`) worked **daily**, not weekly, for 30 days.
- `RPT-RTN-NOORIG` reviewed daily for 90 days.
- Open freight batch aging alert (`RPT-RCV-BATCH-OPEN`) reviewed daily.
- Physical inventory (`03`) scheduled at T+30d as a full verification of the migration — budget for it now.
- STORIS retained read-only for a minimum of `[DECISION NEEDED]` months (recommend 24, driven by AP/tax
  retention and warranty lookback).

### `MIG-080` Rollback

Define the point of no return explicitly (recommended: first customer transaction posted in the new system).
Before it, rollback is "reopen STORIS, discard the load." After it, there is no rollback — only forward fixes.
Make sure everyone in the room on cutover day knows which side of that line they are on.
