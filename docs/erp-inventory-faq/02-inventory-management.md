# 02 — Inventory Management: Locations, Statuses, Availability, Adjustments

---

## LEDGER — the foundation

### `LEDGER-001` Immutable inventory ledger — **build this before anything else in this file**

Every quantity or status change to inventory is an append-only ledger row. Quantity-on-hand is a
**projection** of the ledger, never an independently-mutated number. This is non-negotiable: STORIS's
hardest FAQs (over-receipt correction, un-receiving, RTV, physical reconciliation, cost exceptions) all
depend on being able to reconstruct and reverse history exactly.

Row shape (minimum): id, timestamp, posted_at (business date), product, location, storage_location,
piece/serial ref, quantity delta, status_from, status_to, unit cost, extended cost delta, transaction_type,
document_type, document_id, document_line_id, reason_code, user, reversal_of (nullable self-FK), notes.

`transaction_type` enum must cover at least: `RECEIPT`, `RECEIPT_REVERSAL`, `ADJUSTMENT`, `TRANSFER_OUT`,
`TRANSFER_IN`, `TRANSFER_IN_TRANSIT`, `SALE`, `SALE_REVERSAL`, `RETURN`, `EXCHANGE_RETURN`,
`RTV`, `PHYSICAL_COUNT`, `STATUS_CHANGE`, `COST_ADJUSTMENT`, `MIGRATION_OPENING`.

Rules:

- No UPDATE and no DELETE on ledger rows. Corrections are new rows with `reversal_of` set.
- Every row balances to a GL posting (or is explicitly flagged non-financial).
- The ledger is the source for `RPT-PROD-ACTIVITY` (G3: "which report lists the user who received each PO?").

---

## LOC — Locations and storage locations

### `LOC-010` Location master

Warehouses and stores are the same entity type with a `location_type` discriminator (`STORE`, `WAREHOUSE`,
`WMS`, `VIRTUAL`). Locations roll up to **districts** (districts drive pricing — `ITEM-045`) and optionally
to regions (regions drive inter-regional transfers — `XFR-060`).

Per-location settings needed by this pack: location tracking on/off (`LOC-021`), automatic replenishment days
(`CFG-LOC-REPLDAYS`, used by `XFR-052`), replenishment source location (`REPL-020`), min/max stock levels per
product (`REPL-010`), location selling price (`ITEM-045`), WMS flag (blocks Take-With exchanges — `RTN-052`).

### `LOC-020` Storage locations (aisle / rack / bin)

_Source: B2_

Hierarchical storage locations **within** a location. Support at least three named levels (aisle, rack, bin)
but model it generically as an ordered path so a fourth level can be added without migration.

### `LOC-021` Location tracking — two-step activation

_Source: B2_

STORIS requires two switches, and so must we:

1. **Global:** `CFG-INV-LOCTRACK` in Inventory Control Settings enables the feature system-wide.
2. **Per-location:** each warehouse individually opts in.

Storage locations may only be defined for a location that has opted in, and only when the global switch is on.
When location tracking is off for a location, inventory there has no storage location and all storage-location
prompts are suppressed. Turning tracking **off** for a location that holds located inventory must be blocked
until that inventory is reassigned or the user accepts a documented bulk clear.

---

## STK — Statuses, availability, adjustments

### `STK-010` Enter a Stock Adjustment — the universal correction routine

_Source: B1, B10, B11, B13, B15, E2, H1, J1_

This routine is referenced by more FAQ answers than any other. It is the operational escape hatch and must be
first-class, not an afterthought. Capabilities required:

- Positive adjustment (add quantity)
- Negative adjustment (remove quantity) — used for RTV write-off (`RTV-014`) and over-receipt correction
  after the vendor has been paid (`RCV-033`)
- Status change (saleable ↔ as-is ↔ floor sample ↔ damaged) — `STK-020`
- Location move (`STK-030`) — including the "received into the wrong location" fix (B10)
- Transfer tab — the paperless immediate transfer (`XFR-011`)
- Special-order info tab — reconcile received special-order pieces (`STK-040`, B13)
- Serial/reference selection for specific pieces (`STK-070`)

Every adjustment **requires a reason code** (`STK-080`) and writes a ledger row plus a GL posting.
Adjustments are subject to the quantity error level (`CFG-POS-QTYERR`).

### `STK-020` Inventory piece statuses

_Source: B1, J2, B15_

Status enum at minimum: `SALEABLE`, `AS_IS`, `FLOOR_SAMPLE`, `DAMAGED`, `RESERVED_HOLD`, `IN_TRANSIT`,
`NON_SALEABLE`. Each status carries flags: counts toward on-hand? counts toward net available? saleable?
requires piece-level record?

`AS_IS` and `FLOOR_SAMPLE` pieces are **individually tracked pieces** — each has its own record with its own
cost, own selling price (`ITEM-044`), own reason code, and own storage location. This is required for
consignment tracking (B15) and RTV (`RTV-012`).

### `STK-021` Routes that can set as-is status

_Source: B1_

As-is must be assignable from **all five** of these paths — a UI that supports only one is a parity gap:

1. Stock adjustment (`STK-010`)
2. Mass inventory update (`STK-090`)
3. Transfer entry, with type = Floor Sample (`XFR-030`)
4. Return entry, via a `Return to As-Is` flag on the return line (`RTN-070`)
5. Exchange entry, via the same `Return to As-Is` flag (`RTN-070`)

### `STK-030` Locate misplaced inventory

_Source: B10_

`RPT-AVAIL` ("View Product Availability") must break quantity down **by location and by storage location**,
so inventory received into the wrong place is findable. From that view, a one-click action opens a stock
adjustment prefilled to move the quantity to the correct location.

### `STK-040` Reconcile received special-order pieces

_Source: B13_

After a special-order product is received, the special-order record must be updatable to reflect what was
**actually** received (options, quantities, piece detail may differ from what was ordered). Two entry points
required: from sales order entry (special order entry screen) and from the stock adjustment routine's
special-order tab. Both write to the same underlying record.

### `STK-050` Net available calculation — **exact formula**

_Source: D5, B14_

```
NET_AVAILABLE = QOH − RESERVED − FLOOR_SAMPLES − AS_IS
```

Where `QOH` is total quantity on hand at the location. Implement as one shared function; every screen,
report, API, and replenishment routine uses it. Do not recompute inline.

### `STK-051` Forward-week availability projection

_Source: D5_

Availability is projected forward by week. Each week's **beginning** net available is the prior week's
**ending** net available. Incoming and outgoing per week:

```
week_incoming = total quantity on open purchase orders due that week
week_outgoing = unreserved_quantity + layaway_sales
```

See `STK-052` for the exact definition of `unreserved_quantity`.

### `STK-052` Unreserved quantity — exact definition

_Source: D5_

```
unreserved_quantity =
      quantity on non-layaway sales orders that are NOT fully reserved
        (this INCLUDES CWC — cash-with-customer/will-call — and ASAP orders)
    − open credit memos NOT flagged As-Is
```

Note the two traps: layaway is excluded from `unreserved_quantity` and counted separately; and open credit
memos **reduce** the outgoing figure only when they are not as-is. Write dedicated tests for both.

### `STK-053` Available-to-Promise surface

Expose the weekly projection as an ATP view on the product and on the sales order line, so a salesperson sees
the first week a commitment can be met.

### `STK-060` Reservation basis: order date vs. delivery date

_Source: B14_

A global setting `CFG-INV-RESERVEBY` (Inventory Control Settings → General tab, "Stock Reservations /
Reserve by Date Type") selects whether stock is allocated against **order date** or **delivery date**.
The allocation engine must honor it. Changing the setting must trigger a documented re-allocation batch —
do not let existing reservations silently follow the old basis while new ones follow the new one.

### `STK-061` Consignment handling

_Source: B15_

There is no dedicated consignment feature; support the two documented workarounds and make them clean:

- **Inventory on hand:** move pieces to as-is non-saleable via `STK-010`, assigning a dedicated
  `CONSIGNMENT` reason code (created via `STK-080`). Sales order entry must let the salesperson select an
  as-is piece and choose that specific consignment item. Consignment pieces must be reportable as a set via
  their reason code.
- **Inventory not on hand:** create the sales order as a **direct shipment**, which generates a PO to the
  vendor using the **customer's address as ship-to** (`PO-060`).

`[DECISION NEEDED]` — LA Mattress may want real consignment (vendor-owned inventory on our floor, liability
only on sale). If so, that is a genuine extension beyond STORIS parity: flag it and scope separately.

### `STK-070` Piece-level identification (serial / reference number)

_Source: J3_

Where a product is serialized, or a piece is as-is/floor-sample, transactions must be able to target a
**specific piece** by serial/reference number, with a search/lookup picker. Required on: stock adjustment
transfer, transfer completion (individual and manifest), sales order line, return line, RTV list.

### `STK-080` Reason codes

_Source: B15_

Maintainable reason-code table scoped by transaction type (adjustment, transfer, return, RTV, physical
variance). Each code maps to a GL account and carries a `non_saleable` flag. Reason code is **mandatory** on
every adjustment. Seed with a `CONSIGNMENT` code.

### `STK-090` Mass inventory update

_Source: B1_

Bulk routine to apply a status change (notably as-is), a location change, or a price change to many pieces
at once, with a preview-then-commit flow. Writes one ledger row per affected piece, all sharing a batch id.

### `STK-100` Quantity error level guard

_Source: B12_

`CFG-POS-QTYERR` (Point of Sale Control Settings, "Quantity Error Level") sets the maximum quantity accepted
without challenge in any routine that prompts for a product quantity — receiving, adjustments, transfers,
order entry. Exceeding it raises _"Quantity entered exceeds error level"_.

Parity note: STORIS ships this at `25`, which is the single most-complained-about default in the FAQ.
Make it configurable, make the message name the current limit and where to change it, and
`[DECISION NEEDED]` set LA Mattress's default deliberately — a mattress retailer receiving container
quantities will want it well above 25. Consider making it a soft confirm-to-override rather than a hard
block, with the override captured in the ledger row.

### `CFG-INV-VENDORMODEL` Vendor model number on reports

_Source: B9_

Global flag "Add Vendor Model to Reports" in Inventory Control Settings. When on, reports print the vendor
model number for each product; when the product has no vendor model number, **fall back to the product code
(SKU)** — never print blank. When off, always print the SKU. Implement the fallback in one shared
report-label helper used by every report in `11`.
