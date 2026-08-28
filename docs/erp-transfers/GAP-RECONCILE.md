# Transfers pack — gap reconcile vs the shipped Jetnine module

Authored 2026-08-27 per `00-README.md` step 2 and `14-build-plan.md`'s
discovery pass. This maps every pack area onto what LA-Mattress-ERP has
already shipped, marks what is genuinely missing, and batches every
question that needs the owner before code is written. **Nothing below is
built until the owner answers §4** — the pack itself forbids guessing on
[DECISION] items, and most of the missing surface is STORIS machinery
whose value depends on how LA Mattress actually operates.

## 1. Discovery-pass answers (14-build-plan "Before writing code")

| Pack asks about | Jetnine answer |
| --- | --- |
| Location / Product / Serial / Storage Location | `locations` (no location *type*; single-warehouse reality), `products`+`product_variants`, `serial_units` (J3/G7), `storage_bins` on `inventory_levels` |
| Route / Manifest | No route or manifest entities. Deliveries use `ops.zipRoutes` (zip-prefix → route name) + per-day stop/piece/capacity caps |
| Sales Order / Purchase Order | Full modules; auto transfers already link `stock_transfers.order_id` |
| Permission mechanism | `packages/shared/src/permissions.ts` catalog + `@RequirePermission` guards, seeded into system roles |
| Background jobs | `JobsService` registry (EOD-001/JOB-002), per-business-date idempotent |
| Document numbering | Per-business counters (`XFR-…`, `PO-YYYY-…`); no partial-invoice suffixes |
| Audit log | `AuditService` (`audit_logs`), before/after JSON |
| Security override flow | Yes — `SecurityOverrideService` (controls module), manager-credential override with audit |

## 2. Reconcile by pack area

**Shipped (equivalent capability exists; STORIS mechanics intentionally
simplified):**

- **Types & variants (01 §4, 05)** — `replenishment`, `floor_sample`,
  `customer`, `as_is`, `auto` on `stock_transfers.transfer_type`.
  Floor-sample receipt marks pieces/levels non-saleable (J2); `as_is`
  receipt stages pieces into As-Is review (task #15) — this covers the
  pack's *move-to-as-is* outcome, with review replacing the up-front
  reason code. Divergence: Jetnine stages for review instead of
  requiring the reason at entry.
- **Lifecycle (01 §5)** — draft → in_transit → received / closed_short
  (variance reason code, G8) / canceled. Partial receipts auto-complete.
  No pick-list / print-ticket completion gates (see Q3).
- **Serial pieces (04/05)** — per-line `serialIdsJson`, validated at
  ship, status-walked at receive (J3).
- **Auto transfers (05 `auto`, 11)** — created from sales-order
  shortfall (XFR-051), released manually, scheduled by the XFR-053
  formula + per-location replenishment weekdays (J5); aging report.
- **Costing** — FIFO unit cost carried across legs (not in STORIS pack;
  Jetnine-specific).
- **Replenishment engine (10)** — the pack's §10 EOD stock-level model
  is *superseded* by the sales-rate replenishment program (tasks
  #11/#13/#24): min/max auto transfer drafts + the new sales-rate PO
  engine. Pack's [DECISION] on the stock-level model is thereby
  answered: Jetnine uses reorder point/qty per variant for transfers
  and the sales-rate engine for POs. Q100–102's "same engine both
  modes" contract is already how both are built.
- **Inquiries (12)** — transfers list with status/location filters +
  detail; View Inbound/Outbound ≈ list filtered by to/from.

**Partial (exists, pack adds rules we could adopt cheaply):**

- **Hold / scheduled quantity (01 §2, D18–19)** — Jetnine ships partial
  *receipts*, not scheduled-vs-ordered holds at entry.
- **Store↔store gate (E20)** — any location pair is allowed today; a
  `storeToStoreTransfers` ops setting would gate it, but Jetnine has no
  location *type* to distinguish store from warehouse (see Q2).
- **Eligibility (E21–22)** — inactive variants can't ship (stock
  checks), but there is no distribution-status concept.
- **Numbering (A1–3)** — auto only; no manual Transaction Number Entry,
  no back-order suffix chain (B7–10) because Jetnine never splits a
  transfer into partial invoices.

**Missing (real STORIS machinery, all scope-gated on §4):**

- **Transfer security tables (03, F25–29)** — per-user (from, to) pair
  authorization with bypass + override.
- **Carton quantities (G30–33)** — minimum-carton confirmation with
  five location-type-pair override permissions.
- **Route capacity for transfers (H34–38)** — routes/trucks/capacity
  are not modeled for transfers (delivery caps exist for deliveries).
- **Distributed transfers + distributed-quantity allocation (06,
  I/J39–49)** — fan-out to a distribution list; 12-month group-sales
  proration.
- **One-time-buy (K50–53)** — PO class + received-on-PO distribution.
- **Multi-leg transfers (07, L54–62)** — distribution location schemas,
  T/X links, transit-day resolution.
- **Manifests (08, M/N63–81)** — schedule/build/complete, load numbers,
  exception store.
- **RF receiving + phantom worker (09, O82–94)** — barcode scan flow,
  pending-transaction worker, cross-dock labels.
- **Rescheduling screen (11, P95–99)** — bulk date re-schedule with
  in-transaction re-validation.
- **EDI 214 audit comments (U117)** — no EDI feeds exist.

## 3. Acceptance-test coverage map (13)

Already satisfiable against shipped code: parts of A (auto numbering,
immutability via status), C16–17 outcome-wise, E21 partially, Q100–102
in spirit. Everything in B, F, G, H, I, J, K, L, M, N, O, P, R, S, T
depends on the §2 "Missing" machinery and the §4 answers.

## 4. Owner questions — answer these, then the build starts

Scope (the big ones — each is a full phase of `14-build-plan.md`):

1. **Manifests + RF receiving (Phases 4–5)** — Does LA Mattress run
   trucks off manifests with barcode scanning at the dock, or is the
   current ship→receive flow with serial pieces enough? Building
   manifests/RF without scanners is dead weight; say "skip", "later",
   or "build" per piece.
2. **Store vs warehouse** — Jetnine locations have no type. Do you want
   a `location_type` (store/warehouse) so store↔store gating, carton
   overrides by pair, and warehouse-only rules can exist? If yes it
   also sharpens the sales-rate replenishment "warehouse" pick.
3. **Completion gates** — STORIS blocks completion until the transfer
   ticket is printed (and optionally a pick list exists). Adopt a
   print-before-ship gate on Jetnine transfers, or keep ship/receive
   ungated? (Same pattern as the delivery-ticket flags just shipped.)
4. **Distributed transfers (Phase 3)** — Do you ever push one product
   from the warehouse to *all* stores at once? If yes: even split only,
   or the STORIS sales-prorated allocation too (J43 fixture)?
5. **Transfer security tables** — restrict which users may move stock
   between specific location pairs, or is role-based
   `transfers.manage` enough?
6. **Carton quantities / route capacity / one-time-buy / multi-leg /
   EDI 214** — default assumption is **skip** (no data model or feed
   exists to serve them). Object per item if wanted.

Pack [DECISION] markers (needed only if the owning feature is built):

7. `03` §overrides — record overrides as audit rows only (Jetnine
   standard), or also as printed comment lines?
8. `06` distributed-quantity rounding — recommended: round half up per
   store, adjust the largest-remainder store so the sum is exact (the
   J43 fixture holds either way).
9. `07` multi-leg flow chart — needs a human to view the source page
   image and confirm the leg-creation decision tree.
10. `10` stock-level model — **already answered** by the shipped
    replenishment programs (§2); confirm you're happy with reorder
    point/qty + sales-rate rather than a STORIS min/max file.

Decision-free quick wins I will build with the first answer batch
regardless of scope choices: hold/scheduled quantity with `H`-style
line state (D18–19), transfer-comment audit on every mutation the pack
lists, and the Product-Quantity-in-Excess inquiry (12 §64).

## 5. Proposed build order once §4 is answered

1. Quick wins above + any adopted completion gate (Q3).
2. `location_type` + store↔store gate + eligibility rules (Q2, E).
3. Distributed transfers (Q4) with the Q8 rounding rule.
4. Transfer security tables (Q5, F) on the existing override service.
5. Manifest/RF phases only if Q1 says build (M/N/O).

Everything lands as vertical slices with the matching section of
`13-acceptance-tests.md` ported first, per house protocol.

## §6 Decisions received (owner, 2026-08-28)

- **Q1 Manifests/RF**: build **manifests without scanning** — group
  transfers onto truck/date manifests with load numbers; receiving
  stays tap-based, no RF/barcode/phantom worker.
- **Q2 Location type**: **yes** — add `store` / `warehouse` location
  types (owner: "you already have the locations in inventory").
- **Q3 Completion gate**: **yes** — require the transfer ticket to be
  printed before ship (delivery-ticket-flags pattern).
- **Q4 Distributed transfers**: **skip** — store-by-store creation
  stays.
- Q5 (security tables) and items 7–9 remain open; §10's stock-level
  answer stands.
