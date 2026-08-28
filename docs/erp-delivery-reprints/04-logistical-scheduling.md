# 04 — Logistical Scheduling (where the flags surface)

Two tabs: **Search for Schedules**, **Confirm Schedule**. Schedules one or more deliveries/returns, service orders, or warehouse transfers for a selected date.

**Menu paths:** Merchandising and Distribution > Inventory > Inventory Management > Transfer Processing · Merchandising and Distribution > Logistics > {Delivery | Transfer | Service} Processing · Customer > Coordination and Logistics > {Delivery | Service} Processing.

A **read-only** variant exists: *View Delivery Schedules* — view but not edit, e.g. orders already on a manifest. Build the screen so the read-only mode is a permission flag, not a fork.

## Screen-level rules

- Order entry is reachable directly from Confirm Schedule only if `Allow Order Entry Access in Logistical Scheduling` is checked on the Logistics page of Point of Sale Control Settings.
- If `Recalculate Delivery Charge` is enabled in Point of Sale Control Settings, delivery charges are recalculated when a user changes **delivery date / Fulfillment Date**, **delivery status / Fulfillment Status from EST to SCH**, or **route code**.
- `Consolidate Stops` in Route Capacity Control Settings merges all orders with the same customer **and** Deliver To address into a single delivery stop.
- Service lines whose status is *Closed Without Completion* (per Status Code Settings) count as closed lines.
- Scheduled-date range is checked against `Restrict Scheduled Date` **first** in Warehouse/Store Location Settings, **then** in Point of Sale Control Settings. Scheduling beyond the permitted number of days requires a **security override**.

## Search for Schedules tab

Save and Actions are inactive here. To activate Confirm Schedule you must supply a schedule type, a deliver-from location, and either a start/end date or the Past Dates checkbox. Once you move to Confirm Schedule, the search fields become read-only; **Clear** is the only way back.

| Field | Behavior |
|---|---|
| **Schedule** | Order type being scheduled: `Sales Orders`, `Service Orders`, `Transfers`. |
| **Deliver From** | "From" location code; defaults from the login screen and is overridable. Subject to Regional Processing restrictions. **If a Manifest Location has been specified it takes precedence over the Fulfillment Location** — e.g. fulfillment location 88 with a different manifest location assigned means the order is *not* in the results. Applies only with Advanced Dispatch Track. |
| **Route** | Restricts to one route; blank lists all orders, routed or not. Code must exist in the Route Code file; Search button for a picker. When `Access all Delivery Route Codes` (User/Group Actions – Sales Security) is enabled, all route codes appear in the dropdown. When `Generate Parcel Delivery Fulfillments` (POS Control Settings) is active, selecting a route incompatible with the merchandise on the fulfillment requires adequate security or a manager override. |
| **Truck** | Prompted only if mapping is active; used as a search filter for the Confirm Schedule grid. |
| **Transfer To** | Active only for transfer orders. Receiving warehouse/store; the dropdown is restricted to locations that have transfers assigned from the Deliver From location. Action button → Multiple Location Selection Window (one, several, or all). Selecting multiple enables **Re-schedule Transfers** on the Confirm Schedule Actions menu. |
| **Past Dates** | Lists only orders with estimated/scheduled dates **prior to today**. STORIS recommends daily use. **Consolidate Stops does not apply when this is checked.** |
| **Starting Date / Ending Date** | Date-range filter with calendar pickers. Disabled when Past Dates is checked. |

## Confirm Schedule tab

Selected fulfillments populate the grid. Every row carries the **Order/Transfer number** and the **Deliver-To Name** (customer name for orders, warehouse name for transfers) alongside the columns in the legend below. **With multiple fulfillments, a single order can appear multiple times** — one row per fulfillment. Any grid, list, or export built on this must key on fulfillment, not order.

**Sorting:** defaults to customer name ascending. First click on a header sorts ascending, second descending, third restores the default.

| Field | Behavior |
|---|---|
| **Delivery Status** | Restricts rows to `No Filter`, `Scheduled`, or `Estimated`. Inactive when Schedule = Transfers. |
| **Contact Status** | Restricts by delivery contact status. Arrow → list; Action button → Delivery Contact Status lookup for multi-select. |
| **Total Stops / Units / Dollars / Volume** | Display-only real-time totals. Update as orders are added or removed, as rows flip between Estimated and Scheduled, and as search criteria change. An **asterisk** next to a field name means the total capacity for that item (per Route Capacity Settings) has been **reached**. Stops/units/dollars use the actual quantities from Route Capacity Settings; grid values may not match the route calendar depending on the Route Capacity section of POS Control Settings. |
| **Grid Information** | One row per retrieved order. Double-click opens **Transaction Update – Logistical Scheduling**. If the item is on a manifest, only **Contact Status** and **Time** are editable, and only with the `Update Status and Stop Time for an Order on a Manifest` clearance in Extended Security; without it, a message offers to open the order in *View an Existing Sales Order*. For transfers, the Customer Name column shows the transfer-to location description; `Auto` indicates an auto-transfer, and appears only when the system is set **not** to prefix auto-transfer numbers with `T` (`Use Order Number on Auto Transfers`, POS Control Settings). |
| **Actions** | `Print Delivery Tickets` and `Print Pick List` — open the respective routine with shipping location, scheduled date and route pre-filled; **only available when a single scheduled date was specified** on Search for Schedules. `Re-schedule Transfers` — reschedule multiple transfers to one new date at once. `Toggle Display of Sales/Net Dollars` — switches between `Dollars $` and `Net $` (which includes return dollars on return/exchange orders); default is `Dollars $`; Stops, Units and Volume are unaffected. |

### Volume calculation hierarchy

To total volume, the system resolves each item's volume in this order and stops at the first hit:

1. `Volume` field in Advanced Product Settings
2. `Capacity Units` field in Group Settings
3. `Default Weight` field in Route Mapping Control Settings (requires mapping active)

If none resolves, the item's volume is **0**.

## Grid legend

The flag columns. **This is the contract between the state machine and the UI.**

| Column | Values |
|---|---|
| **Status** | `SCD` scheduled · `EST` estimated · or an AR credit hold code (`C1`, `C2`, `D1`, …) |
| **Date** | Scheduled or estimated date. **Blank if the order is on credit hold.** |
| **Route** | Route assignment |
| **Truck** | Truck number, if mapping is active |
| **Time** | Stop time, if established; drives pack list and manifest ordering |
| **T** (Transaction) | `D` Delivery · `X` Exchange · `P` Pickup Customer Return · `T` Transfer · `S` Service Order |
| **D** (Delivery Ticket) | `Y` printed · `R` reprint required · blank not printed |
| **P** (Pick List) | `Y` on pick list · blank not on pick list |
| **F** (Fill Status) | `C` all scheduled quantities reserved, including unreserved quantities for inventory scheduled for a future date or unscheduled · `P` partially reserved · `N` no reserved line items |
| **M** (Manifest) | `Y` on manifest · blank not on manifest |
| **A** (Available to Ship) *hidden by default* | `Y` a portion of the line quantity is **not** available for completion — e.g. a serial-tracked product whose assigned pieces exceed total scheduled quantity, a non-serial-tracked product whose reserved pieces exceed total scheduled quantity, or a system-set hold quantity greater than the quantity to ship in the future · blank all assigned/reserved items available |
| **H** (On Hold) | `Y` one or more lines have Hold status — a scheduled line whose quantity is less than the total quantity reserved for that line and was **not** specifically unscheduled by the user · blank all lines available to schedule |
| **S** (Service) | `H` linked in-home service order · `S` linked in-shop service order (ignored, field blank, if that order's status is Closed) · `B` both (in-shop not Closed) · blank none. **Only flagged when the T column is `D`.** |
| **U** (Unscheduled) | `Y` one or more lines unscheduled — scheduled quantity less than total ordered **and** specifically unscheduled by the user · blank all lines available to schedule |
| **R** (Radio Frequency) | `Y` lines submitted for RF picking via Single Ticket Print (RF) or a Final RF pick list print · blank none |
| **City / Account / Zip Code / State / Contact** | Destination city, customer account number, destination zip, destination state, delivery contact status |
| **OO** | Other Orders — total open orders for the customer, **excluding** the row's own order |
| **Deliver From Location** *hidden by default* | Location of the delivery fulfillment; with Advanced Dispatch Track the Manifest Location takes precedence |
| **Manifest Location** *hidden by default* | The fulfillment's manifest location, which takes precedence over the fulfillment location; null unless using Advanced Dispatch Track |
| **Fulfillment Description** *hidden by default* | Description from the fulfillment |

Note the deliberate contrast between **H (On Hold)** and **U (Unscheduled)**: both describe a line whose scheduled quantity falls short, but they compare against **different** totals. `H` = scheduled quantity less than the total quantity **reserved** for that line, not specifically unscheduled by the user. `U` = scheduled quantity less than the total quantity **ordered** for that line, and specifically unscheduled by the user. Two comparands, two conditions — do not collapse them into one predicate.

## Grid behavior (system-wide)

Applies to grids generally, not just this screen. Worth implementing once as a shared component. (STORIS gates these functions on SCiX version 10.3.30066.0 or higher — a versioning note with no analogue in a greenfield build, recorded only so the source is not misread as describing universal STORIS behavior.)

- Column chooser via **right-click on the header row** to show/hide columns.
- Sorting is type-aware per column; a column holding two or more data types sorts as text. Click once ascending, twice descending.
- Filtering: highlight a header, click the arrow for filter options. Multi-column filtering supported.
- Columns are reorderable by drag.
- Multi-column sort: hold **Shift** and click headers in priority order; blue arrows mark sorted columns; one click ascending, two descending, three removes the sort. **The sort persists as a screen preference.**
- Text over **51 characters** wraps across multiple lines; column filtering is **disabled** for columns over 51 characters.
- Dates display with a four-digit year.
- Column totals are available in many screens; a total moves with its column.
- Hiding, moving, reordering, sorting and resizing are saved automatically as **user-based screen preferences** when the user closes or leaves the screen. `Settings > Reset Current View` resets the current tab; `Reset Entire Screen` resets every grid on every tab.
- **Sorting and filtering are disabled on editable grids and grids with promote/demote features.**
