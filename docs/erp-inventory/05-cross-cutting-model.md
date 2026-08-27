# Cross-cutting domain model — STORIS Inventory Management

This is the reconciliation layer over the four section specs. Where a section spec is the authority on a screen, this file is the authority on how the screens agree with each other.

---

## 1. Canonical entities

### 1.1 Stock identity

| Entity                         | Key attributes                                                                                                                                                                                                                             | Notes                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Product**                    | product code, description, vendor model, brand, group/collection, product type (incl. `5` = On-The-Fly), `Volume`, `Capacity Units`, handling method, bulk flag, serialized flag, `Product Delivery Method` (Delivery / Parcel / **Both**) | Bulk products **cannot** hold as-is status — no RTV, no as-is adjustment (R-I set)      |
| **Piece**                      | serial number **or** system reference ID, product, location, storage location, status (`On Hand`/`Reserved`/`Sold`/`Vendor Return`/`Write-Off`/`Adjusted`), as-is reason code, twilight flags, float link, WMS tag ID, cost layer link     | The unit of tracking for serialized and non-bulk stock                                  |
| **Bulk quantity**              | product, location, storage location, quantity                                                                                                                                                                                              | Tracked as a number, not as pieces; assignment is all-or-nothing at receipt             |
| **Costing layer**              | product, location, cost, receipt reference (PO / no-PO / `+ADJ`), AP-bill link, landed freight component                                                                                                                                   | Created at receipt, consumed at relief. Special-order stock always values at exact cost |
| **Warehouse / Store Location** | code, location-tracked flag, invisible-location-tracked flag, mapping active, default storage locations (receiving, return pickup), bank, accounts, active types                                                                           | Regional Processing restricts which locations a user may see at _any_ location field    |
| **Storage Location (bin)**     | code, warehouse, velocity, storage category, designated-for-as-is flag, `NIL`/`RESEARCH` special bins                                                                                                                                      | Bin-to-bin moves repartition a location's quantity without changing its totals          |

### 1.2 Demand and movement

| Entity                    | Key attributes                                                                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Order**                 | order type (Sale / Return / Exchange / Transfer / Service), customer, deliver-to, credit-hold code, comments, deposits                                                                                                                                                                                                      |
| **Order line**            | line reference, product, qty ordered / scheduled / reserved / on hold / unscheduled, per-date ticket + pick-list flags, stock location, direct-ship fields                                                                                                                                                                  |
| **Fulfillment**           | order ref, type (Delivery / In-Home / Transfer), method (Delivery / Pickup / Direct Ship / Parcel), status (`ASAP`/`CWC`/`EST`/`SCH`), date, fulfillment location, manifest location, route, truck, stop time, contact status, handling method, sent-to-Dispatch-Track stamp, COD amount, derived flags `D P F M A H S U R` |
| **Transfer**              | transfer document, from/to location, type (generic / As-Is / Floor Sample / Stock), lines with flags `A C H P S T U W X`, distribution schema, schedule period, leg linkage                                                                                                                                                 |
| **Manifest**              | type (Delivery / Transfer / Service), warehouse, date, route **or** truck, carrier, technician, staging area, stops, units, driver, delivery associates, load number, COD + collected                                                                                                                                       |
| **Stop**                  | one document/fulfillment on a manifest: time, quantity, comment; consolidation merges same customer + same deliver-to address                                                                                                                                                                                               |
| **Movement (ledger row)** | see §3 — the single append-only record every quantity change writes                                                                                                                                                                                                                                                         |

### 1.3 Logistics reference data

Route (code, type, account, product delivery method, parcel-only, shared-capacity code) · Route Capacity Calendar (per route per day: status `Open`/`Full`/`Closed`, max/actual/open for **stops, volume, units, dollars**) · Truck / trailer · Driver + Delivery Associates (user IDs) · Carrier (with 3PL EDI code) · Handling Method (2-char code, prioritised per order type, maps to EDI 215) · Reason codes (as-is, manifest-removal exception, `NIL`, `REP`, `PHY`, As-Is Restricted).

---

## 2. The quantity-bucket ledger

Every process in all four sections resolves to a movement between these buckets. This table is the merge of `02-inventory.md` §S3 and `04-transfers.md` §S4.

| Bucket                  | Increments on                                                                                                                                              | Decrements on                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **On Hand**             | PO receipt · no-PO receipt · positive adjustment · transfer inbound leg · customer return · physical-inventory update (count > frozen)                     | negative adjustment · receiving-error reversal · write-off · RTV completion · transfer outbound leg · delivery/take-with completion · physical-inventory update (count < frozen) |
| **Reserved**            | sales-order reservation · **transfer reservation at entry, not at ship** · physical-inventory reassignment                                                 | cancellation · completion (→ Sold) · PI dropping an unsupportable reservation (→ commitment exception)                                                                           |
| **On P/O**              | purchase order raised for the receiving location                                                                                                           | receipt against the PO · PO cancellation                                                                                                                                         |
| **As-Is**               | move-to-as-is · as-is adjustment · mass update assigning a reason code · PI `As Is` tag flag · return/exchange into as-is · designate-for-as-is (non-bulk) | move-from-as-is · mass update removing as-is status · write-off · RTV completion · transfer out of a designated-as-is bin (with warning)                                         |
| **Twilight**            | add-to-twilight (requires _available_ quantity)                                                                                                            | remove-from-twilight                                                                                                                                                             |
| **In transit**          | transfer completed/shipped, not yet received; trip/container piece count                                                                                   | transfer receipt at destination                                                                                                                                                  |
| **Hold (`H`)**          | scheduled qty < ordered qty on a transfer line; delivery hold                                                                                              | release from hold                                                                                                                                                                |
| **Frozen / Counted**    | freeze snapshot · count tag entry                                                                                                                          | clear-only · tag correction                                                                                                                                                      |
| **Available (derived)** | **STORIS never states the formula.** See Q-I1. Presumed `On Hand − Reserved − As-Is − Twilight − floated − RF-picking`, but this must be confirmed.        |

**Bucket-level invariants to enforce in code**

1. A piece reserved to a sales order, or otherwise unavailable, may only be moved **bin-to-bin** — no warehouse transfer, no as-is status change.
2. A piece loaded on a float cannot be transferred until unloaded (`Review Float Status`).
3. Pieces in RF picking are invisible to mass inventory updates.
4. `NIL` pieces cannot move to a `NIL` location and are excluded from "all" searches.
5. `REP` (repossessed) pieces cannot leave as-is. "In service" pieces cannot be written off.
6. Bin-to-bin moves appear in the Kardex only when `Track Bin to Bin Transfers` is on, and sign as **0** (`M23`).

---

## 3. Movement ledger (the thing to build first)

STORIS's Kardex, `Historical Inventory Adjustments`, `Physical Inventory Update Audit Trail`, `Detailed Product Activity` and `Detailed Put Away Activity` are all views over one append-only movement history. Model it explicitly:

```
Movement
  id, occurred_at, posted_at, user_id
  product_id, piece_id?, quantity (signed), uom
  from_location_id?, from_bin_id?, from_bucket
  to_location_id?,   to_bin_id?,   to_bucket
  cost_layer_id?, unit_cost, extended_cost
  source_type   -- receipt | adjustment | reservation | fulfillment_completion
                -- | transfer_ship | transfer_receive | physical_inventory
                -- | rtv | write_off | as_is_move | twilight | bin_to_bin
  source_id, reason_code?, reference (PO/order/transfer/manifest/count tag)
  reversal_of_id?
```

Rules: never update a movement; a correction is a new movement with `reversal_of_id`. Bucket balances are derived (materialised for speed, never authoritative). Kardex sign convention: `+` additions, `−` deductions, `0` intra-location transfers (`M23`); the first row of the Regular grid is the **ending balance**, not a transaction (`M24`).

---

## 4. Combined state machines

### 4.1 Fulfillment

```
ASAP ─┐
CWC  ─┴─► EST ⇄ SCH ─► on manifest ─► COMPLETED
                                   ├─► PARTIALLY COMPLETED ─► back order (new route/date)
                                   └─► NOT COMPLETED (reason required)
```

- `ASAP`/`CWC` → `EST`/`SCH` only; **no reverse path**.
- `SCH` → `EST` **clears all delivery-ticket flags** (R-F25) and each cleared ticket flag must clear that date's pick-list flag (R-F26).
- Only `SCH` may be transmitted to a mapping interface or added to a manifest (R-F1).
- AR credit hold **replaces** the displayed status (`C1`,`C2`,`D1`…) and blanks the date; scheduling is blocked until released (R-F6).
- On a manifest, the order is locked to all other processes; only contact status and stop time are editable, with permission (R-F7). Released-for-completion cannot be removed (R-F8).

### 4.2 Transfer

```
OPEN/UNSCHEDULED ─► SCHEDULED ─► IN PICKING (non-final) ─► IN PICKING (final)
                                                        ─► ON MANIFEST ─► SHIPPED / IN TRANSIT
                                                        ─► COMPLETED (history; invoicing enabled)
```

- IN PICKING (non-final) → SCHEDULED is legal (prompts _Submit for Re-Pick_); IN PICKING (final) and ON MANIFEST are re-schedule-blocked.
- SHIPPED → PARTIALLY COMPLETED → SCHEDULED; not-transferred pieces land in **Not Completed Location** and the transfer stays open.
- Any pre-completion state → VOIDED/DELETED (terminal, cannot be printed).
- **Manifest edits are blocked entirely while pending RF transfer-receiving transactions exist.**
- Line flags are not a sequence: `A` as-is, `C` COM, `H` hold, `P` PO, `S` service order, `T` to be filled by multi-leg, `U` unscheduled, `W` warranty, `X` multi-leg filling another transfer.

### 4.3 Piece

```
(none) ─receipt/+adj─► On Hand ⇄ Reserved ─completion─► Sold
           On Hand ⇄ As-Is ─RTV list→print→complete─► Vendor Return
           As-Is ─write-off tab─► Write-Off (terminal)
           On Hand ⇄ Twilight
```

Guards as listed in §2.

### 4.4 Supporting machines

Delivery ticket flag per date: `null → P/Y printed → R reprint → null`. Fill `F`: `N → P → C`. RF handling: `PREP → STAGE → LOAD`. Route day: `Open / Full / Closed`. Manifest doc completion: `None → Part → All`. Freight batch: `open → closed (AP bill) | deleted`. Physical inventory: `not frozen → frozen → updated → cleared`. As-is kit: `Unassigned → Assigned (Order Key)`. RF phantom: `Inactive ⇄ Active`, plus `Suspended` (manual; resumable only via Administer Phantom Processes).

---

## 5. The in-transit question (transfers ↔ inventory)

STORIS never names an in-transit bucket, but the behaviour requires one:

1. Transfer lines **reserve at entry**, not at ship. Shipping volume is computed from reserved pieces.
2. `Scheduled Quantity` < ordered pushes the balance to **Hold (`H`)** — reserved at origin, excluded from the transfer ticket, **not moved at completion**; the transfer stays open.
3. **Complete Transfer is the move**: only non-hold items move; the transfer closes to history.
4. **Receipt is a separate event** — manifest completion (None/Part/All, landing in `Transfer Receiving Location`) or an RF scan creating a pending transaction consumed by the receiving phantom.
5. Between ship and receipt the goods are **reservable by a downstream leg** ("Reserved Linked Transfers" — transfers in anticipation of receipt of another transfer). This is the decisive evidence that in-transit stock must be a real, reservable state, not a gap.

**Implementation consequence:** in transit is a first-class bucket owned by the _destination_ for reservation purposes and by the _origin_ for valuation until receipt — unless the accounting spec says otherwise. Costing and GL treatment of transfers is **entirely absent** from all 22 transfer articles (Q-T1); it must come from the Accounting section before this is finalised.

---

## 6. Configuration surface

Behaviour across these sections is driven by roughly 15 settings files. Model configuration as first-class, scoped, and auditable — many settings are evaluated **location-first, then global**.

- `Point of Sale Control Settings` — Restrict Scheduled Date · Recalculate Delivery Charge · Generate Parcel Delivery Fulfillments · Assign Specific Pieces At · Unassign Piece Not Completed (Yes/No/Prompt) · Manifest Exception Retention · Require Reason Code if one or More Orders Removed · Include Automatic Transfer · Default Handling Methods on Fulfillments · Route Capacity section
- `Warehouse/Store Location Settings` — Restrict Scheduled Date · Mapping Active · Default Storage Locations (Receiving / Return Pickup) · Include Fulfillments with Reserved Auto Transfers on Manifest · Active Types · bank + accounts
- `Route Capacity Control Settings` / `Route Capacity Settings` — Consolidate Stops · Routing Capacity Log Retention Days · max stops/volume/units/dollars per route per day
- `Route Mapping Control Settings` — Default Weight · Include Fulfillments with Reserved Auto Transfers · Include Unreserved Fulfillments (Advanced Dispatch Track only)
- `Logistical Route Settings` · `Advanced Product Settings` (Volume, handling method) · `Group Settings` (Capacity Units) · `Status Code Settings` · `Reason Code Settings` · `Delivery Company Settings` · `Fulfillment Handling Method (Assignment) Settings`
- Inventory-side: physical-inventory retention (`Inventory Adjust Hold Days`, `M68`), `Track Bin to Bin Transfers`, landed-cost allocation, WMS permissions, label queue settings, transfer schema/period settings, transfer security for multiple locations
- Security: `Create a User/Group Actions — Sales / Logistics / Extended Security`, `Assign Screen Action Permission`, Regional Processing, manager-override paths

**Rule:** two settings evaluated in precedence order (location then global) is a pattern, not a one-off — implement it once.

---

## 7. Integration surface

| Integration                                                                            | Direction | Notes                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Route mapping (file)** — ArcLogistics, RouteView, UPS Roadnet, legacy Dispatch Track | out/in    | batch download → external routing → upload trucks + stop times; optional manifest auto-build + ticket print; batch-in-progress detection                                                          |
| **Advanced Dispatch Track (API)**                                                      | out/in    | export `SCH` fulfillments per Account + Date; returns truck + stop time; introduces `Manifest Location`, fly-by fulfillments, account-based routing; un-manifested "sent" stamp must be clearable |
| **EDI**                                                                                | out/in    | 215 (handling-method codes, full-replace semantics), 214 shipment/manifest status, ASN, PO acknowledgement, functional acknowledgement, invoice — each with its own exception report              |
| **RF / barcode (AWM)**                                                                 | both      | picking `PREP/STAGE/LOAD`, put-away, bin-to-bin, physical counts, transfer receiving phantom, as-is designation lists                                                                             |
| **WMS (Unidata export/import)**                                                        | both      | PO / SO / transfer / manifest grids, piece inventory details, interface error review, incomplete shipments report                                                                                 |
| **Parcel carriers**                                                                    | out       | parcel fulfillment generation, parcel-only routes, direct-ship tracking numbers                                                                                                                   |
| **Reporting**                                                                          | out       | `ROUTE.EXCEPTION`, `S$TE_MAINIF_RMV`, Query Wizard Builder / Run a Report, Excel output                                                                                                           |

---

## 8. Where the sections touch

- **Inventory ↔ Fulfillments** — reservation and hold quantities drive the `F H A U` flags; completion relieves stock into sold / not-completed / return / transfer-receiving locations; undelivered pieces may be designated as-is with a reason code; serial confirmation at completion.
- **Inventory ↔ Transfers** — outbound/inbound legs, in-transit, as-is and floor-sample transfer types, RF receiving phantom, distribution schema driving where stock is pulled from.
- **Fulfillments ↔ Transfers** — shared manifest machinery; auto transfers linked to sales orders (`Include Fulfillments with Reserved Auto Transfers` + day offset, R-F12); transfer manifests carry load numbers.
- **All ↔ Accounting** — COD posting bank + bank override, delivery-charge recalculation, AR credit hold gating scheduling, receipt/adjustment GL postings (Inventory Value Dr / Inventory Adjustment Cr / Landed Freight Asset Dr), landed cost, AP bill creation from freight batches.
- **All ↔ Purchasing** — on-order quantity, PO receipt, direct ship, PO acknowledgements, one-time-buy, open-to-buy.
- **All ↔ Views/Reports** — the ledger and bucket definitions above must reproduce `M1–M83` exactly, or reports will disagree with screens.
