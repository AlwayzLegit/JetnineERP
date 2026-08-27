# 00 — Coverage Matrix

Every question in the STORIS Inventory FAQ section, mapped to the requirement(s) that must satisfy it.

**How to use:** for each row, search the repo for an existing implementation, then fill in **Audit** with
`DONE` / `PARTIAL` / `MISSING` and a file path. Do this **before** writing any new code. When a row is
implemented and its acceptance test (`13-acceptance-tests.md`) passes, flip Audit to `DONE ✓`.

Legend for **Priority**: `P0` = blocks cutover · `P1` = needed within 30 days of go-live · `P2` = fast-follow.

---

## A. Inventory Costing FAQs (3)

| #   | Source question                                               | Requirements                                                  | Priority | Audit |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------- | -------- | ----- |
| A1  | Where do I establish preset landed-freight and add-on values? | `COST-030`, `COST-031`, `COST-032`                            | P1       |       |
| A2  | How are cost exceptions created and how can we resolve them?  | `COST-040`, `COST-041`, `COST-042`, `CFG-COSTING-AUTORESOLVE` | P0       |       |
| A3  | Can I restrict users from accessing/viewing product cost?     | `SEC-COST-VIEW`                                               | P0       |       |

## B. Inventory Management FAQs (16)

| #   | Source question                                                         | Requirements                             | Priority | Audit |
| --- | ----------------------------------------------------------------------- | ---------------------------------------- | -------- | ----- |
| B1  | How can I assign an as-is status to merchandise?                        | `STK-020`, `STK-021`                     | P0       |       |
| B2  | How do I set up storage locations (aisle/rack/bin)?                     | `LOC-020`, `LOC-021`, `CFG-INV-LOCTRACK` | P1       |       |
| B3  | How does STORIS store pricing/discount by district?                     | `ITEM-040`…`ITEM-046`                    | P0       |       |
| B4  | How can I add a freight expense to my inventory value?                  | `RCV-050`, `COST-030`                    | P1       |       |
| B5  | Can I receive a PO with a separate freight bill before I have the bill? | `RCV-051`, `RCV-052`                     | P1       |       |
| B6  | Where do I enter product benefits text?                                 | `ITEM-050`                               | P2       |       |
| B7  | Relationship between products, groups, categories?                      | `ITEM-010`, `ITEM-011`                   | P0       |       |
| B8  | Can we change a special order product to regular inventory?             | `ITEM-030`                               | P1       |       |
| B9  | Print vendor model number instead of SKU on reports?                    | `CFG-INV-VENDORMODEL`, `RPT-*`           | P2       |       |
| B10 | Received inventory into the wrong location — how do I find it?          | `RPT-AVAIL`, `STK-030`                   | P0       |       |
| B11 | How do I correct a receiving error / "un-receive"?                      | `RCV-030`, `RCV-031`, `STK-010`          | P0       |       |
| B12 | "Quantity entered exceeds error level" — how to change?                 | `CFG-POS-QTYERR`                         | P1       |       |
| B13 | Update special order data to reflect pieces actually received           | `PO-041`, `STK-040`                      | P1       |       |
| B14 | Allocate inventory by order date instead of delivery date               | `CFG-INV-RESERVEBY`, `STK-050`           | P0       |       |
| B15 | How is consignment merchandise handled?                                 | `STK-061`, `STK-021`, `PO-060`           | P2       |       |
| B16 | How do you count inventory?                                             | `PHYS-040`, `PHYS-041`                   | P0       |       |

## C. Physical Inventory FAQs (2)

| #   | Source question                                      | Requirements                           | Priority | Audit |
| --- | ---------------------------------------------------- | -------------------------------------- | -------- | ----- |
| C1  | How do I perform a physical inventory?               | `PHYS-001`…`PHYS-080` (full lifecycle) | P0       |       |
| C2  | Physical inventory using an outside counting service | `PHYS-090`                             | P2       |       |

## D. Purchase Order FAQs — Processing (10)

| #   | Source question                                    | Requirements                                             | Priority | Audit |
| --- | -------------------------------------------------- | -------------------------------------------------------- | -------- | ----- |
| D1  | Create a PO for a special order product            | `PO-040`, `PO-041`, `PO-042`, `CFG-SO-*`, `SEC-PO-SOPOS` | P0       |       |
| D2  | Create a PO with multiple distribution locations   | `PO-030`, `PO-031`                                       | P1       |       |
| D3  | Change the delivery date on an open PO             | `PO-070`, `PO-071` (acknowledgement)                     | P0       |       |
| D4  | Change a vendor's ship-from address on a PO        | `PO-020`, `PO-021`                                       | P1       |       |
| D5  | How is "net available" calculated?                 | `STK-050`, `STK-051`, `STK-052`                          | P0       |       |
| D6  | Change line comments after linked PO printed       | `PO-043`                                                 | P2       |       |
| D7  | Add extended descriptive info to a product on a PO | `ITEM-060`, `PO-044`                                     | P2       |       |
| D8  | Why do POs go On Hold / how to remove              | `PO-080`, `PO-081`                                       | P1       |       |
| D9  | How do I delete a purchase order?                  | `PO-090`, `PO-091`, `RCV-030`                            | P0       |       |
| D10 | How do I attach an image to a product?             | `ITEM-070`, `ITEM-071`                                   | P2       |       |

## E. Purchase Order Receiving FAQs (4)

| #   | Source question                               | Requirements                                    | Priority | Audit |
| --- | --------------------------------------------- | ----------------------------------------------- | -------- | ----- |
| E1  | Can I change the receiving location for a PO? | `PO-022`, `SEC-PO-EDIT-EDI`, `SEC-PO-EDIT-SENT` | P1       |       |
| E2  | Correct an over-receipt of merchandise        | `RCV-030`, `RCV-032`, `RCV-033`, `STK-010`      | P0       |       |
| E3  | Receive POs in bulk-freight quantities        | `RCV-050`…`RCV-054`                             | P1       |       |
| E4  | How do I close a purchase order?              | `PO-100`…`PO-104`, `CFG-INV-RCVCLOSE`           | P0       |       |

## F. Purchase Order Replenishment FAQs (2)

| #   | Source question                                   | Requirements                       | Priority | Audit |
| --- | ------------------------------------------------- | ---------------------------------- | -------- | ----- |
| F1  | Which replenishment routine should I use and why? | `REPL-010`, `REPL-020`, `REPL-030` | P1       |       |
| F2  | How do I maintain inventory levels automatically? | `REPL-040`, `REPL-041` (EOD job)   | P1       |       |

## G. Purchase Order Reports FAQs (3)

| #   | Source question                                   | Requirements                               | Priority | Audit |
| --- | ------------------------------------------------- | ------------------------------------------ | -------- | ----- |
| G1  | Find POs that were created in Sales Order Entry   | `RPT-PO-SPECIAL`, `RPT-PO-DELIV`, `PO-045` | P1       |       |
| G2  | Which report lists POs that have been received?   | `RPT-PO-RECVCOST`                          | P1       |       |
| G3  | Which report lists the user who received each PO? | `RPT-PROD-ACTIVITY`                        | P0       |       |

## H. Return to Vendor FAQs (2)

| #   | Source question                                            | Requirements                                         | Priority | Audit |
| --- | ---------------------------------------------------------- | ---------------------------------------------------- | -------- | ----- |
| H1  | How do I return products to the vendor?                    | `RTV-010`…`RTV-014`, `RCV-030`, `RCV-033`, `STK-010` | P1       |       |
| H2  | We returned items to the wrong vendor — how do we correct? | `RTV-020`, `RTV-021`                                 | P2       |       |

## I. Returns and Exchanges FAQs (8)

| #   | Source question                                                   | Requirements                                      | Priority | Audit |
| --- | ----------------------------------------------------------------- | ------------------------------------------------- | -------- | ----- |
| I1  | Return an item sold pre-STORIS (no original order)                | `RTN-010`, `RTN-011`, `SEC-RTN-NOORIG`, `MIG-030` | **P0**   |       |
| I2  | Delivery/pickup & installation/restock fees positive or negative? | `RTN-020`                                         | P0       |       |
| I3  | Return when the payment line was fully refunded                   | `RTN-030`, `RTN-031`                              | P1       |       |
| I4  | Return restrictions (days allowed)                                | `RTN-040`, `CFG-POS-RTNDAYS`, `CFG-GRP-RTNDAYS`   | P0       |       |
| I5  | What types of exchanges can I process?                            | `RTN-050`, `RTN-051`, `RTN-052`                   | P0       |       |
| I6  | Complete the return while leaving the replacement sale open       | `RTN-060` (split exchange)                        | P1       |       |
| I7  | Exchange with replacement shipped direct from vendor              | `RTN-061`, `PO-060`                               | P2       |       |
| I8  | Exchange an item sold pre-STORIS                                  | `RTN-012`, `SEC-RTN-NOORIG`, `MIG-030`            | **P0**   |       |

## J. Transfers FAQs (5)

| #   | Source question                                    | Requirements                                          | Priority | Audit |
| --- | -------------------------------------------------- | ----------------------------------------------------- | -------- | ----- |
| J1  | How do I enter an inventory transfer?              | `XFR-010`, `XFR-011`, `XFR-012`, `XFR-020`, `XFR-050` | P0       |       |
| J2  | "Nail down" a floor sample via transfer            | `XFR-030`, `STK-020`                                  | P1       |       |
| J3  | Indicate a specific piece on a transfer            | `XFR-040`, `STK-070` (serial/reference)               | P1       |       |
| J4  | What is an auto transfer?                          | `XFR-051`, `XFR-052`, `CFG-POS-AUTOSCHED`             | P0       |       |
| J5  | How is the auto-transfer schedule date calculated? | `XFR-053`, `CFG-LOC-REPLDAYS`                         | P0       |       |

---

## Cross-cutting rollups

These are not FAQ rows but are required by many of them. Track separately.

| ID           | Item                                                                           | Priority | Audit |
| ------------ | ------------------------------------------------------------------------------ | -------- | ----- |
| `LEDGER-001` | Immutable inventory ledger behind every quantity change                        | P0       |       |
| `CFG-*`      | Control settings registry (`09`)                                               | P0       |       |
| `SEC-*`      | Permission registry (`10`)                                                     | P0       |       |
| `RPT-*`      | Report/inquiry registry (`11`)                                                 | P1       |       |
| `EOD-001`    | End-of-day batch runner (closes POs, auto-replenishment, closed-date stamping) | P0       |       |
