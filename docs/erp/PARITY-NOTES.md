# PARITY-NOTES — spec packs vs. the shipped system (Phase 0)

**Written 2026-08-27.** This is the Phase-0 exit artifact demanded by both parity packs
(`docs/erp/00-HANDOFF.md` Phase 0 rules and `docs/erp-inventory/06-build-order.md`
Phase 0): a mapping from the packs' entities to what the LA Mattress ERP repo already
has, plus the conflict list. **No code was changed for this document.**

Context the packs lack: the repo is not greenfield. Between 2026-08-22 and 2026-08-26
the whole POS/operations surface shipped and is live in production
(`PLAN-STORIS-CUTOVER.md` D1–D12, `PLAN-POS-OPERATIONS.md` P1–P9,
`PLAN-STORIS-GAP.md` G1–G15, ~500 API tests). Real STORIS data (6,909 products /
51,117 customers / 71,246 invoices) has been imported and reconciled to the cent on
staging. The packs describe a from-scratch parity build; the actual question is
**which deltas to adopt**, and each adoption is an owner decision because plan-doc
decisions are locked.

## 1. Entity mapping — Sales Processing pack (`docs/erp/01`)

| Pack entity                | Repo today                                                                                                                              | Verdict                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Customer                   | `customers` (+tags, notes, timeline, tsvector search, addresses_json)                                                                   | **Exists**                                                                                      |
| Store/Location             | `locations` (+order_prefix, timezone, addresses)                                                                                        | **Exists**                                                                                      |
| Order header               | `orders` (order_kind, fulfillment enums, fees, split salespeople, locks, returns, exchanges)                                            | **Exists** (order-centric — see conflict C1)                                                    |
| Fulfillment (unit of work) | Split across `deliveries` (trips), per-line `fulfillment_method`/`delivery_date`, `delivery_runs`                                       | **Partial — C1**                                                                                |
| OrderLine                  | `order_lines` (qty, price, discount, share, qty_returned, per-line fulfillment)                                                         | **Exists**; quantity is integer, pack wants `decimal(12,4)` — C6                                |
| Pricing/discounts/tax      | list price + register-side entry (D12), line/order discounts, discount codes, price-variance 3-tier gate (G6), tax classes per location | **Exists** (hierarchy simpler than pack's)                                                      |
| Tender & deposits          | `payments` (one table, 9 tenders, CHECK one-doc, kinds deposit/balance/installment/refund/adjustment), layaway $100 min                 | **Exists**; minimum-deposit _calculation_ is a suggestion (25%), not a rule engine              |
| Card processing            | Stripe integration (STUB on staging), `external_card` tender for the office terminal                                                    | **Deliberately out** (v1 decision); pack phase 4 unbuilt                                        |
| Completion gate            | G9 print preconditions checklist, balance gate + `orders.complete_with_balance`, A1/A5 locks, run close-out reconciliation              | **Exists** (shape matches "gated event")                                                        |
| Completion → invoice split | Completion advances the order; documents print from the order; no separate invoice entity                                               | **Partial — C1**                                                                                |
| Financing                  | `method='financing'` + provider/ref, payment plans/installments/overdue sweep                                                           | **Partial**; applications/provider routing/promo plans unbuilt (pack Q1 blocks its own phase 7) |
| Settlement & cash          | `cash_shifts`, Z-report, drawer variance, 22:00 close-out                                                                               | **Exists**; processor settlement batching N/A until card processing exists                      |
| Salesperson/Up System/CRM  | memberships + commissions (accrual, clawback, statements); CRM notes/tags/timeline/segments/campaigns                                   | **Partial**; Up/rotation queue absent entirely                                                  |
| Views/reporting            | orders list-view w/ derived statuses, reports hub + CSV, morning brief                                                                  | **Partial**; report _builder_ absent                                                            |
| Security                   | permission catalog + per-user overrides (P1), security-override primitive (G1), append-only audit                                       | **Exists** (different vocabulary)                                                               |

## 2. Entity mapping — Inventory Management pack (`docs/erp-inventory/05`)

| Pack entity               | Repo today                                                                                                                                                               | Verdict                                                                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Movement ledger (§3)      | `inventory_movements` — append-only, signed delta, reason, reference, actor                                                                                              | **Partial**: no from/to bucket pair, no piece link, no cost-layer link, no `reversal_of_id`. Corrections are compensating movements already                                                                                                               |
| Quantity buckets          | `on_hand`, `reserved` on `inventory_levels`; available derived `max(0, onHand−reserved)` in code                                                                         | **Partial — C3**. As-Is lives outside levels (`as_is_items` — goods leave sellable stock at intake, equivalent to a bucket); on-PO derivable from POs; in-transit real (ship deducts origin, receive credits destination); twilight/frozen/counted absent |
| Piece                     | `serial_units` for serial-tracked products only                                                                                                                          | **Partial — C4**: no system-reference pieces for non-serialized stock; everything else is bulk quantity                                                                                                                                                   |
| Costing layer             | absent — single `cost_cents` per variant                                                                                                                                 | **Gap — C2** (the biggest one). Valuation report is replacement-cost; write-offs/transfer shorts value at current variant cost                                                                                                                            |
| Storage bins              | `storage_bins` + `inventory_levels.storage_bin_id` (built 2026-08-27; pick list prints bin)                                                                              | **Exists (lean)**: no velocity/storage-category/as-is-designation flags                                                                                                                                                                                   |
| Route / capacity calendar | free-text `route` + `ops.zipRoutes` suggestion; caps per day: stops / pieces / capacity-units w/ override + exception (G12)                                              | **Partial**: no route entity, no per-route calendar, no dollars dimension                                                                                                                                                                                 |
| Manifest                  | `delivery_runs` (build from day's stops, depart, A5 hard lock, pull-off w/ coded reason + exception, mandatory close-out, COD due vs collected variance, manifest print) | **Exists** — closest match in the whole pack                                                                                                                                                                                                              |
| Transfer                  | `stock_transfers` (draft→ship→receive, in-transit real, close-short w/ write-off, types incl. as-is/floor-sample, aging alert, ticket print)                             | **Exists (lean)**: no multi-leg, no distribution schema, no downstream-leg reservation of in-transit goods                                                                                                                                                |
| Physical inventory        | absent                                                                                                                                                                   | **Gap — C5**                                                                                                                                                                                                                                              |
| Receiving                 | staged receive→inspect→accept/reject (G11), rejects → As-Is, blind receiving toggle                                                                                      | **Exists**; freight batches/landed cost absent (ties to C2)                                                                                                                                                                                               |
| RF/WMS/EDI/parcel         | absent                                                                                                                                                                   | Out of scope unless the owner says otherwise                                                                                                                                                                                                              |
| Kardex/views M1–M83       | movements list + valuation + drift report                                                                                                                                | **Partial**; exact metric parity unattempted                                                                                                                                                                                                              |

## 3. Conflicts requiring an owner decision (the packs' own `[DECIDE]` class)

- **C1 — Fulfillment-centric vs order-centric money.** The sales pack's two structural
  rules (fulfillment carries its own totals/charges/tax and completes into its own
  invoice) contradict the shipped model (order-level totals; deliveries are logistics
  documents; completion is order-level, gated). Adopting it means reworking totals,
  tax, documents, payments attribution, reports, and the D1-amended POS flow — the
  largest single item in either pack. The shipped model passed owner QA and is live.
- **C2 — Costing layers.** Receipt-time cost layers + exact/average/replacement
  valuation vs today's single variant cost. Adoptable incrementally (layers at
  receiving, valuation report reads layers) without touching sales. Highest
  value-for-effort of the inventory deltas; prerequisite for honest margin/GL work.
- **C3 — Bucket-formalized ledger.** Extending `inventory_movements` with
  from/to-bucket, piece and cost-layer links, `reversal_of_id`; defining `Available`
  in exactly one function (pack non-negotiable; Q-I1). Medium effort, mostly additive.
- **C4 — Piece identity for all non-bulk stock.** System-reference pieces for
  non-serialized units. Large data-model change; today's model treats mattresses as
  bulk quantity + optional serials, and the owner has not asked for piece-level
  tracking.
- **C5 — Physical inventory cycle.** Freeze→count→update→clear with commitment
  exceptions. Absent today; a real operational need post-go-live; additive build.
- **C6 — Fractional quantities.** Pack mandates `decimal(12,4)` qty (eighth-yard
  goods). Mattress retail sells integers; changing qty types ripples through every
  totals/tax/commission path. Recommend **not** adopting absent a real fractional SKU.
- **C7 — STORIS vocabulary in the domain layer.** Pack rule: keep STORIS names
  (`ASAP/CWC/EST/SCH`, Kardex) in the model. The shipped system has its own
  owner-approved vocabulary end to end. Renaming now is churn with no behavior change;
  adopt STORIS terms only where a new module is built fresh (e.g. physical inventory).

## 4. Already-answered pack questions (do not re-open)

- Sales pack Q3 (tokenize or store card data): decided — no PAN storage anywhere;
  Stripe tokens or office terminal (D-decision, v1).
- Inventory Q-I1 (`Available` formula): defined in code as
  `max(0, on_hand − reserved)`, with As-Is stock physically outside `inventory_levels`
  (intake removes it) — i.e. As-Is is already excluded by construction. Twilight/float
  don't exist. If C3 is adopted, this formula gets the pack-mandated single function +
  written definition.
- Commission basis (sales pack Q2): percent-of-sale or percent-of-margin in bps per
  plan, split via `split_bps`, clawback on return receipt (G5/P9, owner-confirmed).
- Reason-codes-everywhere, security overrides, exception register, append-only audit:
  shipped (G1–G5, §2) — matches both packs' control philosophy.

## 5. Missing inputs

- `docs/erp-inventory/sections/01–04` (~11,000 lines: the R-F*/R-I*/R-T\* rule and
  M1–M83 metric definitions) and `99-source-index.md` — the parity checklist is keyed
  to those IDs, so checklist execution is blocked until they arrive.
- The sales pack references nothing missing; both zips received were identical.

## 6. Recommendation (owner to confirm, not self-executed)

Treat the packs as the **post-cutover hardening backlog**, not a pre-cutover rebuild:
nothing in them unblocks go-live (prices, accounts, final import, QA step 2 do).
Ranked adoption order if confirmed: C2 costing layers → C3 ledger formalization →
C5 physical inventory → route/capacity calendar → C1 only if per-fulfillment
invoicing is a real business requirement LA Mattress has today, which the shipped
QA'd flows suggest it is not.
