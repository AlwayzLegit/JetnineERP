# 00 — Coverage Matrix

Every question in the STORIS Inventory FAQ section, mapped to the requirement(s) that must satisfy it.

**How to use:** for each row, search the repo for an existing implementation, then fill in **Audit** with
`DONE` / `PARTIAL` / `MISSING` and a file path. Do this **before** writing any new code. When a row is
implemented and its acceptance test (`13-acceptance-tests.md`) passes, flip Audit to `DONE ✓`.

Legend for **Priority**: `P0` = blocks cutover · `P1` = needed within 30 days of go-live · `P2` = fast-follow.

---

## A. Inventory Costing FAQs (3)

| #   | Source question                                               | Requirements                                                  | Priority | Audit                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | Where do I establish preset landed-freight and add-on values? | `COST-030`, `COST-031`, `COST-032`                            | P1       | MISSING — no cost layers/factors; single variant cost (`packages/db/src/schema/catalog.ts`). PARITY-NOTES C2                                                                                                 |
| A2  | How are cost exceptions created and how can we resolve them?  | `COST-040`, `COST-041`, `COST-042`, `CFG-COSTING-AUTORESOLVE` | P0       | MISSING — no cost-exception engine; only PO-cost fallback at generate-PO                                                                                                                                     |
| A3  | Can I restrict users from accessing/viewing product cost?     | `SEC-COST-VIEW`                                               | P0       | DONE ✓ — `products.cost.view` server-side redaction everywhere incl. pricing list (`apps/api/src/catalog/products.controller.ts`, `variants.controller.ts`); valuation report gated `reports.financial.view` |

## B. Inventory Management FAQs (16)

| #   | Source question                                                         | Requirements                             | Priority | Audit                                                                                                                                                         |
| --- | ----------------------------------------------------------------------- | ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | How can I assign an as-is status to merchandise?                        | `STK-020`, `STK-021`                     | P0       | PARTIAL — as-is via refund/return intake + adjustment-scrap review (`apps/api/src/returns/as-is.controller.ts`); not settable from transfer/mass-update paths |
| B2  | How do I set up storage locations (aisle/rack/bin)?                     | `LOC-020`, `LOC-021`, `CFG-INV-LOCTRACK` | P1       | PARTIAL — flat `storage_bins` per location shipped 2026-08-27 (`0050_storage_bins`); no aisle/rack hierarchy, no global+per-location switches                 |
| B3  | How does STORIS store pricing/discount by district?                     | `ITEM-040`…`ITEM-046`                    | P0       | INTENTIONALLY NOT IMPLEMENTED — owner ruled 2026-08-27: skip district pricing entirely; D12 register-side pricing + G6 variance gate are the pricing model    |
| B4  | How can I add a freight expense to my inventory value?                  | `RCV-050`, `COST-030`                    | P1       | MISSING — ties to C2 cost layers                                                                                                                              |
| B5  | Can I receive a PO with a separate freight bill before I have the bill? | `RCV-051`, `RCV-052`                     | P1       | MISSING — no freight batches                                                                                                                                  |
| B6  | Where do I enter product benefits text?                                 | `ITEM-050`                               | P2       | PARTIAL — `products.description` only; no group-level or print-on-tag flow                                                                                    |
| B7  | Relationship between products, groups, categories?                      | `ITEM-010`, `ITEM-011`                   | P0       | PARTIAL — 3-level category tree exists (`categories.controller.ts`) but products.categoryId nullable, no Group tier with cascading policy                     |
| B8  | Can we change a special order product to regular inventory?             | `ITEM-030`                               | P1       | N/A-as-specced — special order is a line property, not a product flag (`order_lines.line_type`); no conversion needed in our model                            |
| B9  | Print vendor model number instead of SKU on reports?                    | `CFG-INV-VENDORMODEL`, `RPT-*`           | P2       | PARTIAL — `variants.vendor_sku` prints on POs with ours-hint; no global reports toggle/fallback helper                                                        |
| B10 | Received inventory into the wrong location — how do I find it?          | `RPT-AVAIL`, `STK-030`                   | P0       | DONE ✓ — inventory search by location+q (2026-08-27) + bins + movements ledger + adjust; move = adjust out/in or transfer                                     |
| B11 | How do I correct a receiving error / "un-receive"?                      | `RCV-030`, `RCV-031`, `STK-010`          | P0       | PARTIAL — no receiving-error reversal transaction (deferred in G11); workaround = negative `inventory.adjust` w/ reason code                                  |
| B12 | "Quantity entered exceeds error level" — how to change?                 | `CFG-POS-QTYERR`                         | P1       | MISSING — no quantity error-level guard on any qty prompt                                                                                                     |
| B13 | Update special order data to reflect pieces actually received           | `PO-041`, `STK-040`                      | P1       | PARTIAL — staged receive splits partials + reallocates (`special-orders`, P6); no post-receipt option/detail reconcile screen                                 |
| B14 | Allocate inventory by order date instead of delivery date               | `CFG-INV-RESERVEBY`, `STK-050`           | P0       | DONE ✓ — 2026-08-27: `ops.reserveBasis` (delivery_date owner-default                                                                                          | order_date) + `allocatePending` backfill (`orders.service.ts`), manual endpoint `POST /v1/orders/allocate-pending`, auto-run after PO receiving; orders.int.spec +5 |
| B15 | How is consignment merchandise handled?                                 | `STK-061`, `STK-021`, `PO-060`           | P2       | PARTIAL — as-is pieces carry reason codes + prices (G10); no CONSIGNMENT seed, no direct-ship PO w/ customer ship-to                                          |
| B16 | How do you count inventory?                                             | `PHYS-040`, `PHYS-041`                   | P0       | MISSING — no physical inventory module (PARITY-NOTES C5)                                                                                                      |

## C. Physical Inventory FAQs (2)

| #   | Source question                                      | Requirements                           | Priority | Audit                                                                  |
| --- | ---------------------------------------------------- | -------------------------------------- | -------- | ---------------------------------------------------------------------- |
| C1  | How do I perform a physical inventory?               | `PHYS-001`…`PHYS-080` (full lifecycle) | P0       | MISSING — C5; the freeze/count/reconcile/post lifecycle does not exist |
| C2  | Physical inventory using an outside counting service | `PHYS-090`                             | P2       | MISSING — depends on C1; import pipeline (D7) could seed the adapter   |

## D. Purchase Order FAQs — Processing (10)

| #   | Source question                                    | Requirements                                             | Priority | Audit                                                                                                                                                                                                      |
| --- | -------------------------------------------------- | -------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Create a PO for a special order product            | `PO-040`, `PO-041`, `PO-042`, `CFG-SO-*`, `SEC-PO-SOPOS` | P0       | DONE ✓ — special-order queue → generate PO per vendor w/ `po_line_allocations` linking SO lines; arrival email; builder pre-load (`special-orders.service.ts`, P6)                                         |
| D2  | Create a PO with multiple distribution locations   | `PO-030`, `PO-031`                                       | P1       | MISSING — one receiving location per PO                                                                                                                                                                    |
| D3  | Change the delivery date on an open PO             | `PO-070`, `PO-071` (acknowledgement)                     | P0       | MISSING — no PO PATCH at all (create/receive/cancel/email only); no acknowledgement entity (deferred in G11)                                                                                               |
| D4  | Change a vendor's ship-from address on a PO        | `PO-020`, `PO-021`                                       | P1       | MISSING — vendors have remit_to (G11) but no ship-from list/prompt                                                                                                                                         |
| D5  | How is "net available" calculated?                 | `STK-050`, `STK-051`, `STK-052`                          | P0       | PARTIAL — available = max(0, onHand−reserved) (as-is excluded by construction; floor-sample recorded but not excluded); ATP = next open-PO date, not weekly buckets (`sales.controller.ts` product-search) |
| D6  | Change line comments after linked PO printed       | `PO-043`                                                 | P2       | MISSING — no post-print comment lock or SO write-back                                                                                                                                                      |
| D7  | Add extended descriptive info to a product on a PO | `ITEM-060`, `PO-044`                                     | P2       | PARTIAL — PO notes field; no CFI structure or product-level PO text prefill                                                                                                                                |
| D8  | Why do POs go On Hold / how to remove              | `PO-080`, `PO-081`                                       | P1       | MISSING — PO hold/release deferred (G11 convention note)                                                                                                                                                   |
| D9  | How do I delete a purchase order?                  | `PO-090`, `PO-091`, `RCV-030`                            | P0       | PARTIAL — `POST :id/cancel` for unreceived POs (audited); received-PO full-reversal precondition flow absent with RCV-030                                                                                  |
| D10 | How do I attach an image to a product?             | `ITEM-070`, `ITEM-071`                                   | P2       | PARTIAL — managed images w/ 4-cap + ordered positions (`images.controller.ts`); no URL mode; upload is storage-key stub pending storage decision                                                           |

## E. Purchase Order Receiving FAQs (4)

| #   | Source question                               | Requirements                                    | Priority | Audit                                                                                                                                  |
| --- | --------------------------------------------- | ----------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Can I change the receiving location for a PO? | `PO-022`, `SEC-PO-EDIT-EDI`, `SEC-PO-EDIT-SENT` | P1       | MISSING — receiving location fixed at creation (no PATCH)                                                                              |
| E2  | Correct an over-receipt of merchandise        | `RCV-030`, `RCV-032`, `RCV-033`, `STK-010`      | P0       | PARTIAL — workaround = negative adjust w/ reason (paid case); unpaid reversal path absent                                              |
| E3  | Receive POs in bulk-freight quantities        | `RCV-050`…`RCV-054`                             | P1       | MISSING — no freight batches (see B5)                                                                                                  |
| E4  | How do I close a purchase order?              | `PO-100`…`PO-104`, `CFG-INV-RCVCLOSE`           | P0       | PARTIAL — auto-complete when all units accepted/dispositioned incl. rejects (P6/G11); no manual close-short of a partially received PO |

## F. Purchase Order Replenishment FAQs (2)

| #   | Source question                                   | Requirements                       | Priority | Audit                                                                                                                       |
| --- | ------------------------------------------------- | ---------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| F1  | Which replenishment routine should I use and why? | `REPL-010`, `REPL-020`, `REPL-030` | P1       | PARTIAL — back-order needs ≈ builder pre-load (reorder shortfalls + sold-not-in-stock queue, P6); sales-rate routine absent |
| F2  | How do I maintain inventory levels automatically? | `REPL-040`, `REPL-041` (EOD job)   | P1       | MISSING — no automatic nightly replenishment (nightly jobs exist: closeout, overdue, stock release — a slot to ride)        |

## G. Purchase Order Reports FAQs (3)

| #   | Source question                                   | Requirements                               | Priority | Audit                                                                                                            |
| --- | ------------------------------------------------- | ------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------- |
| G1  | Find POs that were created in Sales Order Entry   | `RPT-PO-SPECIAL`, `RPT-PO-DELIV`, `PO-045` | P1       | PARTIAL — SO# rides the PO via allocations (print+detail); no indexed origin field/filter                        |
| G2  | Which report lists POs that have been received?   | `RPT-PO-RECVCOST`                          | P1       | PARTIAL — PO list w/ status + valuation report; no dedicated received-cost report                                |
| G3  | Which report lists the user who received each PO? | `RPT-PROD-ACTIVITY`                        | P0       | DONE ✓ — movements ledger carries actor incl. email; audit log append-only (`inventory.controller.ts` movements) |

## H. Return to Vendor FAQs (2)

| #   | Source question                                            | Requirements                                         | Priority | Audit                                                                                                                                      |
| --- | ---------------------------------------------------------- | ---------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| H1  | How do I return products to the vendor?                    | `RTV-010`…`RTV-014`, `RCV-030`, `RCV-033`, `STK-010` | P1       | DONE ✓ (primary path) — as-is → vendor_return w/ mandatory R/A + credit chase open→received/written-off (G4); un-receive path absent (B11) |
| H2  | We returned items to the wrong vendor — how do we correct? | `RTV-020`, `RTV-021`                                 | P2       | MISSING — no offsetting-bills guidance; vendor_invoices could host it                                                                      |

## I. Returns and Exchanges FAQs (8)

| #   | Source question                                                   | Requirements                                      | Priority | Audit                                                                                                                                                                                                                      |
| --- | ----------------------------------------------------------------- | ------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | Return an item sold pre-STORIS (no original order)                | `RTN-010`, `RTN-011`, `SEC-RTN-NOORIG`, `MIG-030` | **P0**   | PARTIAL — no-original path absent BUT all 71,246 pre-cutover invoices are imported and refundable in-system (D8 excludes drawer/commission only), which removes most of the need; coded-reason + tender-cap controls exist |
| I2  | Delivery/pickup & installation/restock fees positive or negative? | `RTN-020`                                         | P0       | INTENTIONALLY NOT IMPLEMENTED — owner reconfirmed 2026-08-27: P8 'no restocking fee' stands                                                                                                                                |
| I3  | Return when the payment line was fully refunded                   | `RTN-030`, `RTN-031`                              | P1       | DONE ✓ — shortfall blocks with re-authorize-as-store-credit; store-credit ledger + customer balance + redemption (P8/G3)                                                                                                   |
| I4  | Return restrictions (days allowed)                                | `RTN-040`, `CFG-POS-RTNDAYS`, `CFG-GRP-RTNDAYS`   | P0       | MISSING — no return-window config at any scope; returns gated by qty caps + coded reasons instead                                                                                                                          |
| I5  | What types of exchanges can I process?                            | `RTN-050`, `RTN-051`, `RTN-052`                   | P0       | PARTIAL — exchange = linked order (any fulfillment enum incl. take_with/direct_ship); no per-exchange method choreography or WMS gate (no WMS)                                                                             |
| I6  | Complete the return while leaving the replacement sale open       | `RTN-060` (split exchange)                        | P1       | DONE ✓ by construction — return (RMA lifecycle A7) and exchange order are separate documents completing independently, linked via original_order_id                                                                        |
| I7  | Exchange with replacement shipped direct from vendor              | `RTN-061`, `PO-060`                               | P2       | PARTIAL — order lines carry direct_ship enum; no vendor PO with customer ship-to generation                                                                                                                                |
| I8  | Exchange an item sold pre-STORIS                                  | `RTN-012`, `SEC-RTN-NOORIG`, `MIG-030`            | **P0**   | PARTIAL — same as I1 via imported history; exchange without any document absent                                                                                                                                            |

## J. Transfers FAQs (5)

| #   | Source question                                    | Requirements                                          | Priority | Audit                                                                                                                                                                      |
| --- | -------------------------------------------------- | ----------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J1  | How do I enter an inventory transfer?              | `XFR-010`, `XFR-011`, `XFR-012`, `XFR-020`, `XFR-050` | P0       | DONE ✓ (documented path) — draft→ship→receive w/ real in-transit, close-short w/ write-off, ticket print (transfers module); paperless immediate = manual two-sided adjust |
| J2  | "Nail down" a floor sample via transfer            | `XFR-030`, `STK-020`                                  | P1       | PARTIAL — floor_sample transfer type recorded; does not flip a piece status or gate sellability (flagged G8 convention)                                                    |
| J3  | Indicate a specific piece on a transfer            | `XFR-040`, `STK-070` (serial/reference)               | P1       | MISSING — transfers move quantities; serial_units not selectable on transfer lines                                                                                         |
| J4  | What is an auto transfer?                          | `XFR-051`, `XFR-052`, `CFG-POS-AUTOSCHED`             | P0       | MISSING — no auto-transfer generation from order stocking-location mismatch                                                                                                |
| J5  | How is the auto-transfer schedule date calculated? | `XFR-053`, `CFG-LOC-REPLDAYS`                         | P0       | MISSING — with J4; no per-location replenishment-days calendar                                                                                                             |

---

## Cross-cutting rollups

These are not FAQ rows but are required by many of them. Track separately.

| ID           | Item                                                                           | Priority | Audit                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `LEDGER-001` | Immutable inventory ledger behind every quantity change                        | P0       | PARTIAL — `inventory_movements` append-only w/ reason/reference/actor; lacks bucket pair, piece/cost links, reversal_of (PARITY-NOTES C3) |
| `CFG-*`      | Control settings registry (`09`)                                               | P0       | PARTIAL — `ops_settings_json` + locations + business settings; no registry UI for all knobs                                               |
| `SEC-*`      | Permission registry (`10`)                                                     | P0       | DONE ✓ — permission catalog + per-user overrides (P1) + security-override primitive (G1)                                                  |
| `RPT-*`      | Report/inquiry registry (`11`)                                                 | P1       | PARTIAL — reports hub (Z/category/tax/valuation/AR/drift/aging) + CSV; no registry or report builder                                      |
| `EOD-001`    | End-of-day batch runner (closes POs, auto-replenishment, closed-date stamping) | P0       | PARTIAL — in-process nightly jobs exist (22:00 close-out, overdue sweep, auto stock release); no PO-close stamping or replenishment step  |
