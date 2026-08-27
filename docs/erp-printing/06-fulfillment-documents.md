# 06 — Fulfillment Documents (the warehouse chain)

Covers: **Print Pick List**, **Print Delivery Tickets**, **Print a Delivery/Pick-Up/Transfer
Ticket**, **Print Pack List**, **Print a Manifest**.

**This is the most important document in the set.** Three of these five routines mutate core
inventory and order state. The warehouse day is sequenced by them.

---

## The chain

```
 Pick List ──────────► Delivery Ticket ──────────► Pack List ──────────► Manifest
 reserves inventory     assigns inventory          no side effects       printed from a
 submits to RF picking  prepares picking           reporting only        pre-built manifest
 can update manifest    starts manifest creation                         signature + COD
 sorted by storage loc  starts order completion    sorted for loading    paper trail
                        can update manifest
```

Ordering, stated in the source: run the pick list **before** generating the pack list,
loading the truck, and completing the order. Run the pack list **after** the pick list and
**during** loading.

### `[SIDE EFFECT]` inventory

- **Pick List** — *"This routine also reserves inventory to the associated line items."*
- **Delivery Ticket** — *"assigns inventory to the order, prepares the order for picking, and
  is the first step in both manifest creation and order completion."*

### `[SIDE EFFECT]` picking status lock — identical on both routines

Once items enter picking status, these fields on the order become **immutable**:

- delivery / pickup status
- route / truck code
- delivery / pickup date

To change any of them: run **Remove Items From Picking (Radio Frequency)** to clear picking
status, then edit the order.

### `[SIDE EFFECT]` picking submission logging — identical on both routines

When an order or transfer is submitted to RF picking:

- success → comment logged: `"Order ~ has been submitted to picking."`
- mapping active at the ship location **and no truck assigned** → **not sent to picking**,
  comment logged: `"Order ~ not submitted to picking. Mapping active and truck has not been
  assigned."`

Restated as a rule: **delivery orders and transfers are not sent to picking if mapping is
active for the shipping location and no truck is assigned.** Pick List states it again as
*"Orders without a route code or truck number are not sent to picking."*

**This is a silent failure mode.** An order that quietly does not reach picking will not be
picked, will not be loaded, and will not be delivered — and the only trace is a comment on
the order. In the new system this must be a **visible, blocking outcome**: the run reports
how many orders were excluded and why, and the excluded orders are listed. Do not bury it in
a comment log.

### `[SETTING]` Assign Specific Pieces At — keep, and read carefully

Point of Sale Control Settings, *Assign Specific Pieces At*:

| Value | Consequence |
|---|---|
| `Creating Pick List` | **Pick list creation is required** |
| `Ticket Print` | Pick list creation is optional; pieces assign at ticket print |

This single setting decides which document is mandatory in the warehouse workflow. It is
real configuration, not legacy — different warehouse operations genuinely differ here — but
it must be surfaced explicitly rather than hidden in a settings tab, because it changes what
"you skipped a step" means.

Interaction worth noting, from Print a Delivery/Pick-Up/Transfer Ticket: with
*Picking Method* = `Minimize Picks` in Warehouse/Store Location Settings **and**
*Assign Specific Pieces Event* = `Ticket Print`, single-ticket printing still evaluates
orders **one at a time, not in batches** — so items may be picked from scattered locations
rather than consolidated. The optimization silently does not apply on this path.

---

## Print Pick List

**Entry:** seven paths under Logistics / Coordination and Logistics for Delivery, Transfer,
and Service processing.

**Purpose:** produce the picking report for a delivery/transfer/service date, used to
consolidate items from the warehouse for staging on a truck. **Reserves inventory.**

**Sort order:** storage location → product → serial number.

`[GATE]` **Excluded entirely:** customer pickups (CPUs) and in-shop service orders. Use the
associated delivery documents to pick those.

**Reprint procedure for manifested orders:** remove the orders from the manifest → reprint
the pick lists → put the orders back on the manifest. (This ordering constraint is a
consequence of manifest/pick coupling and should be designed out, not reproduced — see
Recommendation at the end.)

With multiple fulfillments, the routine uses **linked fulfillment** information to obtain
line-item detail.

Regional Processing may restrict output.

### Fields

| Field | Behavior |
|---|---|
| **Pick List Type** | `Deliveries`, `Transfers`, `Service` |
| **Location** | Defaults from the login location; overridable. Arrow-select from available locations |
| **Date Code** | Standard date-code selector |
| **Scheduled Date** | Defaults to today. `[GATE]` editable only when Date Code = `CUS` |
| **New Picks Only** | If a pick list already exists for this location and date, pick **only items added since the last run** |
| **Route Code** | Multi-select via Route Entry Selection. `[GATE]` active only when mapping is **not** active for the location, **or** Pick List Type = `Transfers`. Blank + mapping off → **all routes**; blank + mapping on → **no routes**. Warns if an entered route is not designated Parcel Only while mapping is active |
| **Truck Number** | Multi-select via Multiple Truck Selection. `[GATE]` active only when mapping **is** active, **or** type = `Deliveries`/`Service`. Blank → all trucks |
| **Process Only Manifested Items** | Unchecked by default. Restricts the list to orders already on a manifest, across all pick list types. **Checking it inactivates Update Manifest.** The last page of the report prints `Yes` when this was enabled |
| **Page Break on Route or Truck** | Also **sorts and breaks** by route/truck — nested *within* the sort and break by location |
| **Page Break on Transfer to Location** | `[GATE]` active only when type = `Transfers` |
| **Include Non-Inventory Products** | Prints all non-inventory products **first**, then a page break. **Linked warranties are the exception** — they print with their associated product, not in the non-inventory block |
| **Update Manifest** | `[SIDE EFFECT]` creates/updates the manifest from this run. `[GATE]` active only when **Route has been specified**, and enabled via *Manifests - Allow updates from Delivery Pick List Print* / *…from Transfer Pick List Print* |
| **RF Final Pick** | `[SIDE EFFECT]` **checked = final**: submits items to RF picking and triggers the picking-status lock above. **Unchecked = preliminary list for verification only.** Items are not available to RF picking unless checked |
| **Confirmation Labels** | Prints a confirmation label per selected item, for identifying picked products. Format is fixed: **Avery #5363, 1⅜ × 2¹³⁄₁₆ in** |
| **Form Name** | `[GATE]` active only when Confirmation Labels is checked. Select the ELP form for the labels |
| **Include Second Description** | Prints the product's second description as an extra line below the detail line |
| **Include Special Order Information** | Prints special order info below the description lines, wrapping at **132 characters**. Configurator info also prints if *Add Vendor Model to Reports* is active in Inventory Control Settings. `[GATE]` **screen and printer output only — not available for Excel, ASCII, or PRV** |
| **Send Output to** / **Export Path** | Read-only; change via Actions > Output Settings |

**Extra-line print order** (shared with Pack List): 1) second description, 2) configurator
information, 3) special order information — each after the detail line carrying the first
description, with the second description in the same column as the first.

**Additional rules:**

- If neither Route Code nor Truck Number is specified **and mapping is active**, delivery
  fulfillments with no associated truck number are **ignored**.
- Products covered by a protection plan are flagged under the **Product** column.

**RF Final Pick is the field to get right.** A checkbox is a poor control for "preliminary
draft" versus "commit this to the warehouse floor and lock the orders." Make it an explicit
two-action choice — *Preview pick list* and *Release to picking* — with the consequences
stated on the second.

---

## Print Delivery Tickets

**Entry:** five paths under Delivery Processing and Transfer Processing.

**Purpose:** print or reprint **all** tickets for a location and optional schedule date —
delivery/return, pickup, and transfer orders. The bulk counterpart to the single-document
routine below.

`[SIDE EFFECT]` This step **assigns inventory to the order, prepares the order for picking,
and is the first step in both manifest creation and order completion.** After a ticket
prints, a `Y` appears in the `D` column of the Logistical Scheduling grid.

### `[GATE]` Blocking conditions

- **Credit balance block** — a ticket cannot print when **both**: the order's open balance
  exceeds *Maximum Balance* in Point of Sale Control Settings, **and** *Over Maximum Balance*
  is set to `Disallow Ticket Print`. (Identical rule on the single-ticket routine.)
- **Auth/Capture failure** — when using Auth/Capture, if a credit card capture cannot be
  created, ticket print fails with an error.
- **Prerequisite** — *Print a delivery ticket within POS entry* must be enabled for tickets to
  print from this process.

These are the correct gates in the wrong place. "Don't ship goods when the customer is over
their credit limit and hasn't paid" is an order-state rule; STORIS enforces it at the
printer because the printer is where the state transition happens. In the new system, put
the rule on the **release-to-fulfillment** operation and let the document follow.

### Sorting when neither truck nor route is specified

All orders are selected, sorted by:
- **truck** — if Mapping Active is checked for the location **and** Order Type = `Deliveries`
- **route** — if Order Type ≠ `Deliveries`

### Fields

| Field | Behavior |
|---|---|
| **Shipping Location** | The location tickets are printed for. **Exception:** for transfers a user may enter a shipping location they lack access to, provided they have access to the To Location |
| **Order Type** | `Deliveries` (delivery sales orders/returns), `Pickups` (customer pickup orders), `Transfers` |
| **Print Orders, Returns, Exchanges** | Three checkboxes, **all checked by default**. Documents print **first by route/truck, then by stop**. Availability by fulfillment method: Pickups → Orders + Exchanges active; Delivery → Orders + Returns + Exchanges active; Transfers → **none active** |
| **To Location** | `[GATE]` accessible only when Order Type = `Transfers`. Single or multi-select |
| **Selection Options** | `All Documents` (including reprints), `New Prints Only` (never printed), `Reprints Only` (already printed and flagged for reprint in Logistical Scheduling). **Reprints only regenerate for orders that actually changed** — an unchanged order does not reprint |
| **Scheduled Date** | Optional |
| **Route** | Multi-select via Multiple Route Code Selection; single via Route Code Selection. `[GATE]` **inactive** if Order Type = `Pickup` or if Truck has a value |
| **Truck** | `[GATE]` active only when **all** hold: Route Mapping Interface active on the system; Mapping Active set for the location; Order Type = `Deliveries`; Route is empty |
| **Print Preview** | `[GATE]` requires Order Type = `Deliveries`. Previews the run **without affecting print flags or merchandise reservations** — i.e. the read-only version of this routine |
| **Suppress Print** | `[SIDE EFFECT]` **skips printing but performs every other update**: delivery ticket print flags, piece assignment, RF picking additions, WMS Interface updates for customer pickups |
| **Update Manifest** | `[SIDE EFFECT]` create/update the manifest from this process. `[GATE]` requires *Manifests - Allow updates from Delivery Ticket Print* / *…from Transfer Ticket Print* on the Logistics tab of POS Control Settings. **Inactive when Route Map Interface is active** for the location |

**Run** generates tickets and reports the number printed.

**Preview references the same settings as the real run** except back-order quantity, drawing
from the Printed Documents tab of POS Control Settings: *Suppress Selling Prices and Totals*,
*COD Amount*, *All Open Order Balances*, *Partial Order All Open Order Balances*,
*All Receivable Balances*, *Bar Code Order Number*.

**Finance integration:** with **Synchrony** as the finance provider, delivery tickets pull
promotional payment plan information from the **last received authorization**.

### Suppress Print is the tell

A flag whose entire purpose is "do all the state changes, skip the paper" is proof that the
state transition and the document are separate concerns that STORIS fused. In our system
this flag should not need to exist: releasing an order to fulfillment is one operation, and
producing its paperwork is another. Keep a `print: false` option on the combined convenience
action for continuity, but the underlying domain operation must stand alone.

---

## Print a Delivery/Pick-Up/Transfer Ticket

**Entry:** eleven paths; two variants — standard (*Print an Order/Delivery Ticket*) and
**Radio Frequency** (*Print a Delivery Ticket (Radio Frequency)*).

**Purpose:** print or reprint tickets for **specific documents**: delivery, return, pickup,
transfer.

### RF variant `[SIDE EFFECT]`

Printing a single ticket for an **RF bar code location with Picking active** adds the
products to the **Picking File** so bar code users can pick them **that day**. This triggers
the picking-status lock and the submission logging described at the top of this document.

### Fields

| Field | Behavior |
|---|---|
| **Order Number** | Enter a document number, then **Add** to append it to the list; repeat for multiple. Search opens *View a Customer's Open Transactions*. `[GATE]` **rejects quote and layaway document numbers** |
| **Fulfillment** | Which fulfillment to print. Shows each qualifying fulfillment. `[GATE]` **read-only unless** the order has multiple fulfillments **and** more than one delivery date is "in progress" |
| **Suppress Print** | `[SIDE EFFECT]` skip printing, still update delivery ticket print flags and perform piece assignment, RF picking additions (RF variant), and WMS Interface updates for customer pickups |
| **Grid** | Selected documents with Ship-to name, Delivery Type, Document Type (Delivery, Pickup, Transfer, …), Scheduled Date. **Completed documents are excluded** |

**Run** processes the request. **Documents print in grid order** — the grid is the print
queue, so its ordering is meaningful and must be preserved (and ideally reorderable).

`[GATE]` Same credit-balance block as the bulk routine: no ticket when open balance exceeds
*Maximum Balance* and *Over Maximum Balance* = `Disallow Ticket Print`.

Regional Processing may restrict output.

`[LEGACY]` The 52-back-order ceiling: at 53+, this routine **skips documents silently**.
See `01` — do not port.

---

## Print Pack List

**Entry:** five paths under Delivery Processing and Transfer Processing.

**Purpose:** specify items to load on the truck for a route. Run **after** the pick list,
**during** loading.

> **`[SIDE EFFECT]` — none. The source is explicit: "This routine affects no processing, and
> is for reporting purposes only."** This is the only fulfillment document that is purely a
> report.

**Columns:** brand, product, description, document number, quantity, serial number, storage
location.

**Forms:** STORIS provides standard forms for pack lists; **the Forms Designer does not
include a pack list form** — pack lists are not customizable through the designer.

### Fields

| Field | Behavior |
|---|---|
| **Deliveries or Transfers** | The fulfillment type |
| **Deliver From Location** | Defaults from login; overridable |
| **Date Code** | Standard date-code selector |
| **Scheduled Delivery Date** | Defaults to today. `[GATE]` editable only when Date Code = `CUS` |
| **Route Code** | Multi-select via Route Entry Selection. `[GATE]` active only when mapping is **not** active for the location, **or** type = `Transfers`. Blank + mapping off → all routes; blank + mapping on → **no routes**. Warns on a non-Parcel-Only route while mapping is active |
| **Delivery Truck Number** | Multi-select via Multiple Truck Selection. `[GATE]` active only when mapping **is** active, or type = `Deliveries`. Blank → all trucks |
| **Load Number** | Optional, **1–99**. When set, the transfer pack list is **limited to that load**. Blank → not limited by load. `[GATE]` **inactive for deliveries** |
| **Print Shipping Instructions** | Includes the **two lines** of delivery instructions entered at order creation |
| **Number of Note Lines** | **0–9** blank lines printed below each order's instructions, for handwritten notes during delivery |
| **Sort by Product** | `[GATE]` transfers only |
| **Primary Sort / Secondary Sort** | `[GATE]` transfers only. Both optional: `Stop`, `Product`, `Load`. Choosing `Load` adds an `LD` column showing the two-digit load number; as **Primary** it also **breaks and subtotals by load**. **Selections persist** to the next visit. **For deliveries both are forced**: Primary = `Stop`, Secondary = `None Selected`, both inactive |
| **Include Second Description** | Second description as an extra line below the detail line |
| **Include Special Order Information** | Same as Pick List: wraps at 132 chars; configurator info requires *Add Vendor Model to Reports* in Inventory Control Settings; `[GATE]` **screen/printer only — not Excel, ASCII, or PRV** |
| **Send Output to** / **Export Path** | Read-only; change via Actions > Output Settings |

**Manifest interaction:** with mapping active and **neither** Route Code nor Delivery Truck
Number specified, only manifests **associated with a truck** are included. To print for
manifests associated with a **route**, Route Code **must** be specified.

---

## Print a Manifest

**Entry:** four paths — Delivery Manifest and Service Manifest under both Logistics and
Coordination and Logistics.

**Purpose:** print a manifest previously created by **Build a Delivery/Service/Transfer
Manifest**. The printed manifest is the warehouse's piece-tracking sheet and the paper trail
for **customer signature and collected dollar amount**.

`[GATE]` **Completed manifests cannot be printed.**

**Forms:** STORIS provides standard forms; **the Forms Designer does not include a manifest
form.**

**Related:** to print return labels from a manifest, use *Print Return Labels from Manifest*.

### Stop ordering

If a stop time was entered during scheduling, the manifest prints **in stop-time order**,
with a stop number per order and the **total stop count at the top**. **Deliveries to the
same address count as one stop.**

### Fields

| Field | Behavior |
|---|---|
| **Manifest Type** | `Deliveries`, `Transfers`, `Service` |
| **Transfers** | `[GATE]` shown when type = `Transfers`. `By Stop` → report by stop, destination location, order — **disables** Back Ordered Details, COD Details, Line Item Totals, Merchandise Subtotal, Order Total. `By Product` → by stop, destination location, product — **disables every Print on Manifest checkbox** |
| **Location** | Defaults from login; overridable. Regional Processing applies |
| **Date Code** | `Custom`, `Today`, `Tomorrow`. `Custom` activates Scheduled Date |
| **Scheduled Date** | `[GATE]` active only with `Custom` |
| **Route Code** | Multi-select. Blank → all routes. `[GATE]` active only when Route Mapping Interface is **not** active for the location, **or** type = `Transfers` |
| **Truck Number** | Multi-select. Blank → all trucks. `[GATE]` active only when Route Mapping Interface **is** active, **or** type = `Deliveries`/`Service` |
| **Page Break on Transfer to Location** | `[GATE]` transfers only |

### Print On Manifest — content toggles

| Toggle | Behavior |
|---|---|
| **Back-Ordered Details** | `[GATE]` requires Line Items. Partially back-ordered lines print separately from delivery lines; **fully back-ordered sales orders print below the manifest orders for that customer with no order total line**. Back-ordered lines show the **next expected PO delivery date** in the Invoice Total column |
| **COD Details** | Adds three columns — `C.O.D. Amount` (due), `Payment Method` (to record), `Amount` (to record collected) — plus **total C.O.D. due** in the totals section |
| **Extended Instructions** | Prints from the **alternate ship-to** if the order has one, else from customer settings. Starts one line below the order total |
| **Line Items** | Prints line items. Gates Back-Ordered Details and Line Item Comments |
| **Line Item Comments** | `[GATE]` requires Line Items. Prints directly after each line item |
| **Line Item Totals** | Extended line totals for delivered merchandise detail lines |
| **Merchandise Sub-Total** | Sub-total for delivered/service merchandise detail lines; prints just above the invoice total; **excludes back-ordered line amounts** |
| **Order Total** | Includes the order total |
| **Non-Inventory Quantity** | Include non-inventory products. If blank, an **asterisk** prints in place of the quantity. **Either way, non-inventory quantities are excluded from the manifest total piece count** |
| **Order Comments** | Prints after extended instructions. **Only the first five lines** of additional comments appear |
| **Signature Line** | Prints `Customer Signature`, a signature rule, and `Received in good condition` beneath. Starts two lines below the order total, sharing lines with extended-instructions lines 3–4 |
| **Stop Time** | Prints `Time:` and the stop time on the customer's address line |
| **Indicate As-Is** | Adds an As-Is column: `Y` for as-is products, `N` otherwise |
| **Volume** | Delivery volume for sales orders, shipping volume for transfers, plus a manifest total volume |
| **Salesperson** | `[GATE]` delivery and service manifests only, inactive for transfers. Adds the **primary** salesperson's name |

**Asterisk rule:** for **kit masters** and **service lines** (and non-inventory products when
Non-Inventory Quantity is blank), an `*` prints in place of the quantity.

**Totals rule:** checking Merchandise Subtotal and Order Total adds a **Merchandise Total**
and **Invoice Total** at the bottom — grand totals across the report. Leaving Line Item
Totals, Merchandise Sub-Total, **and** Order Total all blank **removes the Invoice Total
column entirely** from the output.

### Actions

- **Output Settings**
- `[SIDE EFFECT]` **Send to Ensenda** — `[GATE]` available when *Activate Service* is enabled
  in External Communications Settings. Transmits manifest order data as XML to Ensenda
  (a third-party delivery provider), using the same selection criteria as entered on this
  screen. Each file gets a unique name: location code + date + time prefixed to the
  *Default File Name* from External Communications Settings. The transmission is validated
  and success/failure reported. **Order data can be re-sent provided the manifest is not
  completed.**

**Run** prints the manifest.

The Ensenda integration is a named third-party dependency. Confirm whether LA Mattress uses
it or an equivalent before deciding whether to build any of it; if we use a different
last-mile provider, the *pattern* — export a manifest as a structured payload to a carrier,
idempotent until the manifest completes — is what transfers, not the vendor.

---

## Recommendation — how to rebuild this chain

1. **Extract the state machine.** Model explicit operations: `reserveInventory`,
   `assignPieces`, `submitToPicking`, `removeFromPicking`, `markTicketPrinted`,
   `addToManifest`. Each is independently callable, independently testable, and independently
   auditable.
2. **Make documents pure.** A pick list, ticket, pack list, or manifest is a *render of
   current state*. Reprinting must never change anything.
3. **Keep the combined actions.** The warehouse thinks in "print the tickets." Provide
   `releaseForFulfillment({ print: true })` so the workflow reads the same — but the
   transition and the paper are separable underneath, which makes `Suppress Print`,
   `Print Preview`, and the reprint-after-unmanifest dance all unnecessary.
4. **Make exclusions loud.** Every rule that silently drops an order (no truck under mapping,
   back-order ceiling, credit block, completed documents) must appear in a run summary:
   *N processed, M excluded*, with M itemized and reasons given.
5. **Preserve the settings that are real policy** — *Assign Specific Pieces At*, *Maximum
   Balance* / *Over Maximum Balance*, the manifest-update permissions — and drop the ones
   that are legacy plumbing.
6. **Unify route-vs-truck.** One derived `fulfillment_selection_mode` per location, read by
   every screen, instead of re-deriving the same condition five times with slightly different
   wording each time.
