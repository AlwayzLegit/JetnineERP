# Fulfillment Scheduling — Screen-Level Specification

`03` establishes that the **fulfillment**, not the order, is the unit of scheduling and completion, and covers
Fulfillment Selection and the status machine. This document is the machinery underneath: date selection and
capacity, route assignment, the scheduling worklist, reservation override, pickup, and per-fulfillment address
and shipping detail. Sections 2, 3 and 9 are load-bearing — which date field wins, what recalculates when a
date moves, what freezes once a ticket prints or picking starts.

---

## 1. The scheduling screen graph

The screen you get depends on *why* you arrived.

```
ORDER ENTRY (Enter a Sales Order / Return / Exchange)
├─ Customer page ▸ Route ..... Route Code Entry [136]  (auto-popup, no default route)
│                                → Select Route Code [145] · Route Calendar Display [135]
├─ Merchandise page ▸ Fulfillment Date [73]  (inline; active or inactive by derivation)
│    │    ├─ Action ▸ Select a Delivery Date [142]          (dates already on the order)
│    │    └─ Action ▸ Update Line Item Delivery Dates [165] (split a line across dates)
│    ├─ Action ▸ convert pickup/take-with → delivery: Delivery Date Entry [42]
│    └─ save of a new line → Fulfillment Selection [74]  (see 03)
├─ Order Number ▸ Action → Route Calendar Display [135]
├─ Date ▸ Action → Override a Capacity Date [106]
├─ Fulfillment page ▸ Delivery To ▸ Action → Shipping Information Window [147]
│                   ▸ Additional Fulfillment Information [5] ▸ Route ▸ Action
│                        → Route Calendar / Route Cutoff Calendar
└─ Save ▸ "Reschedule other orders now?" Yes → Orders To Be Scheduled [103]
        ▸ Confirm Address → Shipping Information Window [147]  (setting-driven)
        ▸ Payment Summary → Completion Date Entry [23]

TRANSFERS / EXCHANGES ▸ Actions → Select Fulfillment Date [143]  (also auto-fires, §2.3)

STANDALONE (Customer ▸ Coordination and Logistics · M&D ▸ Logistics ▸ Delivery Processing)
Schedule Fulfillments by Customer [140] · Re-assign a Sales Reservation [125]
Start Customer Pickup Monitor [156] → Customer Pickup Information [39]
Complete a Pickup without Accessing Order Entry [22]
```

`[INFER]` Two tiers — **in-order scheduling** (one fulfillment, inside the order aggregate) and **worklist
scheduling** (§5, outside order entry). Both must call one server-side capacity service.

---

## 2. Date selection — five screens that all set "a date"

| Screen | Trigger | Choosable dates | Sets |
|---|---|---|---|
| **Delivery Date Entry [42]** | converting an existing pickup/take-with **line** to delivery | free entry; no availability filter documented `[PARTIAL]` | the new delivery line's date |
| **Select a Delivery Date [142]** | Merchandise page ▸ Delivery Date ▸ Action | dates **already on this order**; mandatory pick from that list | the selected line's date |
| **Select a Fulfillment Date [143]** | Transfer/Exchange Actions; **auto-fires** in order entry | calendar filtered by four conditions | the document's date + delivery time |
| **Fulfillment Date [73]** | not a screen — an inline field | derived from method + settings; usually inactive | the line's date |
| **Completion Date Entry [23]** | completion, after Payment Summary | current date; backdating gated | the **accounting/GL posting date** |

**How they differ, in one statement.** `[INFER]` Delivery Date Entry is a *conversion* prompt — it exists only
because a line just changed method and has no delivery date at all, so it asks for one with no constraints
attached. Select a Delivery Date is a *consolidation* control — it deliberately refuses new dates and only lets
a line join a date the order already carries, which is how a fragmented order is collapsed onto fewer truck
stops. Select a Fulfillment Date is the *real scheduler* — the only one of the five that evaluates route
capacity, customer day-of-week preference, inventory availability and delivery time, and the only one usable
when no date exists yet. Fulfillment Date on the Merchandise page is not a picker but a derived field whose
editability is computed from method and two settings, and which for multi-date lines is a read-only window onto
the *next* date. Completion Date Entry is on a different axis entirely: it dates the invoice and its GL hits at
the moment of completion, never the delivery, and is the only one of the five bounded by an accounting period
rather than by a truck.

### 2.1 Delivery Date Entry [42] `[DOC]`

One field, `Delivery Date` — "an estimated or scheduled delivery date" — with a calendar icon. Appears only on
the Merchandise-page Actions path that turns a customer-pickup or take-with line into a delivery line.
`[DECIDE]` No capacity check is documented here — almost certainly a doc gap, since a converted line would land
on a route silently. Route the date through the §3 capacity service and raise `03`'s full-route prompt.

### 2.2 Select a Delivery Date [142] `[DOC]`

`Delivery Date` — arrow button, drop-down of all delivery dates currently on the order; selection mandatory
from that list. `OK` writes back to the Merchandise tab. `[INFER]` Each listed date passed capacity when added,
but capacity can have been consumed since — re-validate.

### 2.3 Select a Fulfillment Date [143] `[DOC]`

The full scheduler. From Enter a Transfer (Merchandise tab Actions) and Enter an Exchange (Customer page or
Sell Merchandise page Actions). Handles deliveries, pickups, or both. **Prerequisite: status must be `EST` or
`SCH`** — `ASAP`/`CWC` carry no date and cannot use this screen. `Earliest Available` displays the first
non-crossed-out date; `Customer Prefers` (`All Days`, `Monday`…`Sunday`, all checked initially) is a **calendar
filter**; `Fulfillment ▸ Current Date` is the date itself, **blank** if none is selected yet, if multiple
delivery dates exist, or if pickup and delivery dates differ. `Delivery Time` resolves `Delivery Scheduling
screen → Zip Code file → blank`, editable only with "Allow Manual Entry of Stop Time in Enter a Sales Order".

A date is available only if **all four** hold:

```
1. not in the past
2. its day of week is checked in Customer Prefers
3. for line types Delivery or Delivery/Pickup:
     the order's route is open on that date
     AND has available capacity
     AND stays within capacity once THIS fulfillment is added
     AND the same holds for shared route capacity        (overridable — §3.3)
4. if POS Control Settings ▸ "Restrict Based on Available Date" is active:
     ALL lines of the selected type(s) have inventory availability on that date
```

**Auto-fire triggers `[DOC]`** — after merchandise is entered, when "Select Delivery Date After Entered
Merchandise" is checked; and whenever a delivery date violates "Restrict Based on Available Date". `[INFER]`
The second makes this the remediation path for a bad date: reopen the scheduler with offending dates crossed
out rather than merely rejecting.

### 2.4 Fulfillment Date on the Merchandise page [73] `[DOC]`

A derived field — a pure function of delivery-info status, method, product type and two settings:

| Condition | Value | Field |
|---|---|---|
| Customer-page delivery info Status ≠ `EST` and ≠ `SCH` | blank | inactive |
| Method = direct shipment | the direct-ship PO's expected receipt date | inactive |
| Method = customer pickup | — | inactive |
| Method = take with | current date | inactive |
| Method = delivery, "DELIVERY DATES - Allow multiple on order" **unchecked** | the Customer-page delivery-info date | inactive |
| Method = delivery, that setting **checked** | defaults to the Customer-page date | **active** |
| Product type = bulk | defaults to the Customer-page date | **active**, but Update Line Item Delivery Dates is suppressed — bulk cannot hold multiple dates |
| Line already has multiple delivery dates | the **next** date | edits rejected with a warning; use Update Line Item Delivery Dates |

**Which date wins.** `[INFER]` The Customer page's delivery-info date is the order default and the line date's
source. With "Allow multiple on order" off it is also the *only* date — the line field mirrors it and cannot
diverge. With the setting on, the line date is authoritative for that line. Once a line is split across dates
(§5.3) neither field is authoritative: the split grid is, and the Merchandise-page field is a read-only
projection of its earliest remaining date.

### 2.5 Completion Date Entry [23] `[DOC]`

From any order-entry completion; with a balance due it appears *after* the Payment Summary Window. Also on save
from Adjust Dollars on a Completed Order. One field, `Completion Date`, defaulting to the current date.

- "All GL hits and date references for this order completion use the date specified here."
- Overridable only with Extended Security ▸ **"Change a transaction's completion date"**.
- Backdating within an open sales period is bounded by **"Days to Allow Completion Backdating"**.

`03` flags this screen's field list as undocumented; it is documented here. `[INFER]` Validation:
`completion_date ≤ today`, `≥ today − days_to_allow_backdating`, accounting period open; reject forward dating.

---

## 3. Capacity

### 3.1 The model

`[INFER]` Capacity is held **per route, per calendar date** — not per truck, not per order. A route is open or
closed on a date; if open it carries a finite capacity consumed by the fulfillments on it. Routes may join
**shared route capacity**, a pool consumed by several route codes, checked alongside the route's own `[DOC]`.
Capacity is **prospective**: the date must stay within capacity *once this fulfillment is added*.

`[DECIDE]` **The capacity unit is never published.** `Shipping Volume` is "the calculated delivery volume for
sales orders and exchanges" and is **empty for pickup fulfillments** [140]; stop counts are implied by Manifest
Location adding merchandise "to the fulfillment location delivery manifest as a stop" [5]. Pickups carry no
volume yet schedule against route calendars. This changes every availability calendar — settle it first.

**Deliberate deferral `[DOC]`.** Fulfillment Selection's `New Fulfillment` leaves the date unpopulated
specifically so capacity and "Restrict Based on Available Date" are *not* evaluated; both run once a date is
supplied. That window performs no capacity check — the check happens on saving the line.

### 3.2 Route Calendar Display [135] `[DOC]`

Read-only availability viewer, from Enter a Sales Order (Order Number ▸ Action) and Route Code Entry (Actions).
`Zip or Postal Code` is typically the customer's; if it maps to **more than one** route the Select Route window
opens. **"Dates with a red X through them are not available."** The route's weekly availability pattern displays
beneath the prompt. `[INFER]` Same computation as §2.3 condition 3 minus the customer-preference and inventory
filters — build one endpoint keyed by `(route_code, date_range)`.

### 3.3 Override a Capacity Date [106] `[DOC]`

From the `Date` field's Action button in Sales Order Entry; also reachable — as **Override Route Capacity
Date** — from Update Line Item Delivery Dates [165] and the completion detail screen (`03`). One field, `Date`.
Permission: **Logistics Security ▸ "Override capacities when scheduling routes that are full"**; transfers use
**"Override Transfer Capacity Restrictions"**. Without it a credential prompt lets a permitted user authorise.
**"If that user does not have permission to override a full scheduled route, the user's line(s) remain
unscheduled."** `[INFER]` The failure mode is *unscheduled lines*, not an error; unscheduled is persistable
(line status flag `U`, `02` §4), so make it visible. `[DOC]` **No warning appears if a change reduces an
already-exceeded capacity, even if the result is still over.**

---

## 4. Routes

### 4.1 Route Code Entry [136] `[DOC]`

Fires **automatically** during sales, return or exchange entry, after the customer is specified, when no
default route code is found. `Enter Route Code` is **not required** — the window is convenience only; its value
populates `Route` on the Customer page.

```
appears when: the Zip Code record for the customer's shipping address holds no default
              route code (the customer has none, OR the ship-to zip specifies none)
         OR:  creating a sales QUOTE while "Sales Order Entry - Require Route for Sale
              Quotes" is checked and no default route is set
```

`[DOC]` **Once an order appears on a manifest the route cannot be changed.** Changing the stock-and-ship
location does **not** update the route code — confirm via Logistical Scheduling. `[INFER]` A relocated order
keeps a route belonging to the old location; warn rather than reproducing the silence.

### 4.2 Select Route Code [145] `[DOC]`

Appears during sales/return/exchange entry when the Zip Code Settings record for the ship-to address holds
**multiple** route codes. A grid; double-click selects and returns to the order. Also reachable as "Select
Route" from Route Calendar Display's zip lookup.

### 4.3 The zip hierarchy `[DOC]`

Route determination is a three-tier fallback (from `03`); the tier's cardinality decides which screen appears.

```
1. the 9-digit zip's default route(s)   exactly one route → populate silently
2. the parent 5-digit zip's defaults    several routes    → Select Route Code [145]
3. all route codes                      none              → Route Code Entry [136], optional
```

**Lookup scoping `[DOC]`.** To restrict lookup to the zip's routes, **"Access all Delivery Route Codes"** (Sales
Security) must be **unchecked** — note the inverted sense. Changing a route requires **"Override Route on Sales
and Service Transactions"**.

---

## 5. The scheduling worklist

### 5.1 Orders To Be Scheduled [103] `[DOC]`

The "consolidate delivery dates" feature. Appears on Save at the end of order entry when the operator answers
**Yes** to **"Reschedule other orders now?"**; with multiple concurrent fulfillments, on Save at the end of
*fulfillment* entry. `Schedule Orders For` defaults to the current order's delivery or return-pickup date; its
**Action button opens View a Delivery Route** to inspect route capacity per day. Grid: `Deliver-To`,
`Schedule Orders For`, `Reschedule`, `Order Number`, `Type`, `Status`, `Delivery Date`, `Fill Status`.

```
eligibility — ALL must hold:
  delivery lines or fulfillments exist on the order
  delivery items are partially OR fully committed
  Fulfillment Location == the specified order's Fulfillment Location
  Deliver To           == the specified order's Deliver To
  NOT multiple delivery dates · NOT on credit hold · NOT on a manifest
```

Double-clicking a row opens that order with `Next Date` (or `Pickup Date` for returns) preset to the
`Schedule Orders For` value, still editable. **Reschedule (in-grid)** reschedules immediately with no round
trip; right-click ▸ **More Details** returns to order entry instead, and the order must then be saved, after
which the window reappears refreshed.

**Validation order `[DOC]`.** **Restrict Scheduled Date** is checked **first in Warehouse/Store Location
Settings, then in POS Control Settings**, and only **after** the in-grid Reschedule is invoked; breaching the
day limit requires a security override. `[INFER]` Location beats global everywhere it appears. An order with
several scheduled delivery fulfillments appears on the grid **more than once** `[DOC]`.

### 5.2 Schedule Fulfillments by Customer [140] `[DOC]`

Bulk re-dating and re-statusing of open fulfillments for **one customer**, **one method at a time**.

- `Customer Number or Last Name or Email or Phone Number` — required, max 50 chars. Numeric ⇒ customer code;
  `@` ⇒ email; 10 digits, no spaces or special characters ⇒ phone; otherwise last name. A merged code offers
  the "merged to" customer. No fulfillments ⇒ **"No items selected."**
- `Fulfillment Method` — set to `Delivery` or `Customer Pickup`, after which it **inactivates** and the grid
  loads all open fulfillments of that method. For `Delivery`, **all selected fulfillments must share one route
  code**, and the date calendar is specific to that route.
- `New Fulfillment Date` — **only dates with available route capacity are eligible**; ≥ current date. With ATP
  active and "Restrict Based on Available Date" in use it cannot precede the earliest ATP or ATC date (which,
  per "Default Display of ATC in Point of Sale") absent an override; Restrict Scheduled Date bounds it above.
  **Both validations run on `Apply`, not on entry.**
- `New Fulfillment Status` — `None Selected` | `Estimated (EST)` | `Scheduled (SCH)` | `As soon as possible
  (ASAP)` | `Customer will call (CWC)`. **`ASAP` or `CWC` clears and inactivates `New Fulfillment Date`.**

Rules `[DOC]`: only sales orders, returns and exchanges appear — **quotes, service orders, transfers and
direct-ship fulfillments are excluded**. Checking a box validates that line **and every other grid line for the
same order**; a completable line must contain a Ship quantity; failure messages and **clears the checkbox**.
The grid also exposes `ATP/ATC Date`, `On Manifest`, `Fulfillment Fully Reserved`, `Credit Hold` and
`Shipping Volume`.

### 5.3 Update Line Item Delivery Dates [165] `[DOC]`

Splits **one line item's quantity across several delivery dates**. From Merchandise page ▸ Fulfillment Date ▸
Action. Available if "1) the **Allow multiple on order line** setting on the Logistics page of Point of Sale
Control Settings **OR** 2) the order line you are maintaining currently has multiple delivery dates."
Suppressed entirely for bulk products [73].

- `Date` — **"Only dates for which there is available route capacity are eligible for selection from the
  calendar. You cannot select a date that is already in the grid on this screen."** Action ▸ Override Route
  Capacity Date, which needs Logistics Security permission.
- `Quantity` — **"Your entry must be between 1 and the total order quantity."** `Add` writes a grid row (`Date`,
  in-cell-editable `Quantity`, `Remove`); repeat until the full quantity is scheduled.

```
quantity change while multiple dates exist  [DOC]
INCREASE → add entirely to the unscheduled quantity;
           NO specific date's delivery quantity is updated.
DECREASE → take from the unscheduled quantity first; if insufficient,
           consume delivery quantities starting from the LAST delivery date,
           working backwards until satisfied.
```

`[INFER]` "Last date first" is deliberate — it protects the imminent delivery and shrinks the furthest-out one.
Intuitive FIFO would strip the truck leaving tomorrow. `[DECIDE]` Whether an unscheduled remainder blocks
completion is never stated; `02` §5 is ambiguous.

---

## 6. Reservation interaction — Re-assign a Sales Reservation [125] `[DOC]`

Manual override of the reserve/back-order decisions made by Just-In-Time Inventory (Automatic Stock
Reservation), moving reserved pieces **between orders** for one product at one location. `Location` defaults to
the login location and may be narrowed by **Regional Processing** restrictions (true at any Location field);
`Action` is `Reserve` or `Back Order`, with `Quantity` to match.

The documented scenario: an order scheduled two weeks out holds the last piece while a later order needing
tomorrow's delivery is back-ordered — back-order the first, reserve the piece to the second. `[INFER]` This is
the escape hatch that makes date-driven scheduling workable against a quantity-driven reservation engine:
reservation is allocated in entry order, but delivery priority is by date. Do not omit it.

The read-only inventory display is what makes the decision defensible:

```
Inventory Quantities  On Hand        total saleable quantity at the selected location
                      Net Available  total saleable NET available quantity there
                      Net PO         net units expected in from outstanding purchase orders
Available to Promise  Quantity       the next available quantity
                      Date           the next availability date
                      Source         "current stock" | "new PO" | "stock transfer"
                      Document       the document expected to generate the inventory
```

**ATP display suppression `[DOC]`:** if the operator does not use the ATP calculation and none of the three
"ATP CALCULATION:" includes is enabled, the ATP `Quantity`, `Date`, `Source` and `Document` **labels and data
are not displayed** — the block disappears rather than showing blanks.

The grid lists each competing document with its Order / Reserved / Available quantities, `Fill By`, an
`Adjustment` flag, and a **`Primary Document`** block — **entirely null when the displayed document is not being
filled by another document** — which is how an operator sees the chained order a piece is really promised to.

Rules `[DOC]`: `Reserve` requires sufficient non-reserved quantity; `Back Order` is limited to the selected
order's `Available` quantity; **special-order products cannot be reassigned**; **sales orders on manifests do
not appear**; products with `Reservation Required` need **Override Reservation Required**. `Add` processes it —
`Reserved` and `Available` update and `Adjustment` shows `"Yes"`.

---

## 7. Pickup

### 7.1 Customer Pickup Information [39] `[DOC]`

A **waiting-room display board**, not an operator screen — the progress of every pickup order at one RF
bar-code location. Columns `Order Number`, `Customer Name`, `Status`.

```
Waiting to be Picked      submitted for picking, not yet assigned to a warehouse associate
Picking in Progress       assigned to a picker (an RF user), currently being picked
Ready for Pickup @ <loc>  all selected items picked and in STAGE status. Rendered IN YELLOW;
                          "<loc>" is the storage/pickup location, replacing "staging".
```

Sorted **by status, then order number**, Ready for Pickup on top. Refreshes at the interval set on Start
Customer Pickup Monitor. Prerequisite: **AWM and RF Bar Code both active.** `[DECIDE]` The board shows customer
names in a public area.

### 7.2 Start Customer Pickup Monitor [156] `[PARTIAL]`

Sets the RF bar-code `Location` and the refresh interval; `Run` displays [39]. Same AWM + RF prerequisite.
**Content defect: both fields are described in prose only** — no validation, interval unit or defaults.
`[DECIDE]` Define the unit and a floor; a board refreshing every second is a load problem.

### 7.3 Complete a Pickup without Accessing Order Entry [22] `[DOC]`

Fast invoicing of pickup orders **at the pickup counter**, by staff who should not be inside order entry.
`Order Number` must name **an open customer-pickup order whose pickup ticket has already been printed**; the
rest of the header is read-only. `Quantity Picked Up` accepts zero to `quantity ordered − quantity
back-ordered`, editable in-grid **only with Extended Security ▸ "Change pickup quantity during quick pickup
order completion"**.

Rules `[DOC]`: **"For security reasons, this routine does not allow changes to an order."** **Layaways cannot
be completed here.** A balance due warns but proceeds. **Unavailable for WMS locations when WMS is active.**
With multiple concurrent fulfillments, **the earliest Customer Pickup fulfillment by fulfillment date whose
ticket has printed** is displayed.

**Signature capture `[DOC]`.** Activated by "Complete Pickup Transactions Without Accessing Order Entry" in
Payment Card and Device Settings. On `Save` a prompt offers capture; per configuration the system either
prompts each time to save the signature to disc or saves automatically when the customer taps Accept on the
pad. Configure Document Signature Capture and Configure Document Archive govern the ceremony and the archiving,
**both initiated by the same `Save`.** `[INFER]` This screen writes an invoice with none of order entry's
safeguards — it must run through the same completion service as `02` §5.

---

## 8. Per-fulfillment detail

### 8.1 Additional Fulfillment Information [5] `[DOC]`

Enter a Sales Order ▸ Fulfillment ▸ Additional Fulfillment Information. Tabs General, Contact Information,
Other Information. **Content defect: General is a heading with no fields beneath it** `[DECIDE]`.

**Contact Information.** `Contact Status` shows **only codes assigned to the salesperson via "Delivery Contact
Status codes" in Create a User** — but **if no codes are configured there, all system codes appear** (note the
fail-open). Selecting a status reveals `Contact Date`, inactive until the status is other than `None`. `02` §13
lists contact status as unenumerated; this screen confirms it is a user-scoped code list, not a fixed enum.

**Other Information.**

- `Manifest Location` — the flyby location the merchandise is fulfilled from. Visible **only when Advanced
  Dispatch Track is active**; default null. Adds the merchandise **as a stop** to that location's delivery
  manifest, alongside deliveries from that location sharing the same date and route — and it need not belong to
  an order fulfilled from that location. **Once on a manifest it cannot be changed.**
- `Route` — defaults from the route code in Update Zip Code Settings resolved against the customer's zip; blank
  and enterable if the Zip Code file has none. Action offers **Route Calendar Display** and **Route Cutoff
  Calendar**. **Once the order is on a manifest the route cannot be changed (delivery only).**
- `Truck`, `Ship Via` — delivery only; `Ship Via` **defaults from the Route unless a Deliver To is selected**.
- `Include in Maintain Un-manifested Fulfillments Sent to Dispatch Track` — set by Run Dispatch Track Mapping
  Interface. **Unchecking removes the date/time stamp; once unchecked it cannot be re-checked and the setting
  becomes inactive and hidden.** `[INFER]` A one-way latch — a nullable timestamp, not a boolean.
- `C.O.D.` — the entered amount prints as the COD amount on the ticket; blank prints the order balance.
  Warning: **"Overriding the C.O.D. may invalidate the calculated C.O.D.'s on other fulfillments. Continue?"**
- `Number of Postponements` — read-only; delivery and pickup only. **Incremented by 1 when the order is saved
  with a fulfillment date beyond the current fulfillment date; an earlier date does not update it.** Under
  `ASAP`/`CWC` the fulfillment is paused and the field inactivates (still viewable); on being granted `EST` or
  `SCH` **the count increases by 1 again**. `[INFER]` An asymmetric, non-decrementing satisfaction metric.

### 8.2 Shipping Information Window [147] `[DOC]`

Order entry ▸ Fulfillment page ▸ Action at `Delivery To`. Edits the shipping address **for this order** on
sales orders, returns, exchanges and service orders. Also appears automatically as **"Confirm Address"** on
Save of the Payment page for sales orders and exchanges when "Confirm Address on Orders and Exchanges" is
enabled — for new delivery orders and the first time a line is changed to delivery. `Deliver To` is `Billing`,
an alternate Deliver To Description, or `Other`; **if `Billing` or `Other`, `Update Address Information` is
inactive**. `Name` **changes only this order; the master customer record is not updated.**

Three behaviours matter for scheduling:

- **Unknown zip** → **"Zip Code NOT on file. Create new Zip Code?"** OK opens Individual Zip Codes; No returns
  without creating.
- **Cross-location zip edit** → editing a ship-to zip into a **delivery location different from the `Location`
  field** warns, and continuing **updates the delivery location for all delivery line items on the order.**
  `[INFER]` A fulfillment-location change disguised as an address edit — it moves which warehouse ships every
  delivery line. Log it to order comments and require explicit confirmation.
- **Phone is mandatory** — **required before saving out of this window, and not auto-populated.**

`Update Address Information` is inactive when `Deliver To` is `Billing` or `Other`, and until an address field
changes; pre-checked if "Update Customer Shipping Information by Default" is set. On Save with it checked:
**`Y` Yes** — the customer Deliver To is updated **and the alternate Deliver To address is updated on all open
orders whose delivery address matches the old address**; **`N` No** — nothing updated; **`C` Cancel** — save
aborted. Updates apply to **all order fulfillments with the same customer number**, and **the box is unchecked
and unavailable if `Name` is changed**. `[INFER]` A cross-order write with real blast radius: show the affected
order count before committing.

`[DOC]` With "Restrict Order to One Delivery Address" in use, changing a Deliver To address to one not already
on the order warns; a duplicate primary email warns when "Warn if Primary Email exists for other Customers" is
checked.

---

## 9. Freeze points and recalculation

| Trigger | Frozen `[DOC]` |
|---|---|
| Ticket printed | nothing structural, but the fulfillment becomes eligible for counter pickup completion [22] |
| Items enter RF picking (`03`) | delivery/pickup **status**, **route**, **truck**, **date** — until removed from picking |
| Order on a manifest | **route code** and **Manifest Location** frozen [5][136]; excluded from Orders To Be Scheduled [103] and Re-assign a Sales Reservation [125]; Complete replaced by "On Manifest" (`03`) |
| Dispatch-Track flag unchecked | one-way; cannot be re-checked, field hides [5] |
| Completion | the Completion Date drives all GL hits [23] |

**What recalculates when a fulfillment date moves**

```
route capacity, OLD date  released                                             [DECIDE]
route capacity, NEW date  consumed, prospectively                            [DOC §2.3]
Number of Postponements   +1 if the new date is LATER; unchanged if earlier;
                          +1 again on ASAP/CWC → EST/SCH                         [DOC]
ATP Days Early(-)/Late    recomputed; 999 if unscheduled                         [DOC]
delivery / installation   re-evaluated per fulfillment; with "one delivery charge per
  / misc charges          order" the fulfillments re-sort (SCH before EST, earliest time
                          breaks ties, ASAP/CWC-only last by creation timestamp) and the
                          charge may move — possibly creating a balance due or a refund
                          due, AND A COMMENT IS WRITTEN                      [DOC, 03]
tax                       recalculated with the charges                      [DOC, 03]
C.O.D.                    a manual override does NOT recalculate                 [DOC]
Delivery Time             re-resolved: Delivery Scheduling → Zip Code → blank    [DOC]
```

`[DECIDE]` Capacity release on the old date is nowhere stated. Without it capacity leaks on every reschedule.
Implement release and reconcile nightly.

---

## 10. Consolidated

### New business rules `[DOC]` unless marked

- Date availability is a four-way conjunction: not past; weekday accepted by the customer; route open, within
  capacity **including this fulfillment**, and within shared route capacity; and, with Restrict Based on
  Available Date on, inventory available for **all** lines of the selected types.
- A failed capacity override leaves lines **unscheduled** — not a hard error.
- Restrict Scheduled Date evaluates **location settings first, POS Control Settings second**, and only after
  the operator commits (Reschedule / Apply).
- Orders To Be Scheduled needs matching Fulfillment Location **and** Deliver To, and excludes multi-date
  orders, credit holds and manifested orders.
- Schedule Fulfillments by Customer takes one method at a time and, for Delivery, one shared route code;
  checking one line validates **every line on the same order**.
- A quantity decrease on a multi-date line consumes the unscheduled quantity first, then works **backwards from
  the last delivery date**.
- `ASAP`/`CWC` clear the fulfillment date; each `ASAP`/`CWC` → `EST`/`SCH` round trip costs one postponement.
- Contact Status codes are user-scoped and **fail open**.

### Enums introduced

```
Pickup monitor status  [DOC]  Waiting to be Picked | Picking in Progress
                              | Ready for Pickup @ <storage location>   (yellow)
New Fulfillment Status [DOC]  None Selected | Estimated (EST) | Scheduled (SCH)
                              | As soon as possible (ASAP) | Customer will call (CWC)
Fulfillment Method     [DOC]  None Selected | Delivery | Customer Pickup       [140]
Reservation action     [DOC]  Reserve | Back Order   (Adjustment = "Yes" once processed)
ATP Source         [PARTIAL]  "current stock" | "new PO" | "stock transfer"
Deliver To source      [DOC]  Billing | <alternate Deliver To Description> | Other
Address-update confirm [DOC]  Y Yes | N No | C Cancel
Route calendar state   [DOC]  available | unavailable (red X)
```

### Settings referenced

**POS Control Settings:** `DELIVERY DATES - Allow multiple on order` · `Allow multiple on order line` ·
`Restrict Based on Available Date` · `Restrict Scheduled Date` · `Select Delivery Date After Entered
Merchandise` · `Allow Manual Entry of Stop Time in Enter a Sales Order` · `Default Display of ATC in Point of
Sale` · `Sales Order Entry - Require Route for Sale Quotes` · `Days to Allow Completion Backdating` · `Confirm
Address on Orders and Exchanges` · `Warn if Primary Email exists for other Customers` · `Restrict Order to One
Delivery Address` · `Update Customer Shipping Information by Default` · `Default Email Address` · the three
`ATP CALCULATION:` includes · default Stock Location for Delivery/Customer Pickup fulfillments.

**Elsewhere:** Warehouse/Store Location Settings ▸ `Restrict Scheduled Date` · Advanced Product Settings ▸
`Reservation Required` · Update Zip Code Settings / Zip Code Settings ▸ default route code(s), delivery time ·
Payment Card and Device Settings ▸ `Complete Pickup Transactions Without Accessing Order Entry` · modules
Advanced Dispatch Track, AWM, RF Bar Code, WMS, ATP, Regional Processing, Configure Document Signature
Capture / Archive, Run Dispatch Track Mapping Interface.

### Permissions referenced

| Permission | Where | Gates |
|---|---|---|
| Override capacities when scheduling routes that are full | Logistics Security | Override a Capacity Date [106], [165] |
| Override Transfer Capacity Restrictions | Logistics Security | transfer capacity |
| Override Route on Sales and Service Transactions | Sales Security | changing the Route field [5] |
| Access all Delivery Route Codes | Sales Security | **unchecked** restricts route lookup to the zip's routes |
| Override Reservation Required | Sales Security | unreserving / reassigning reservation-required products [125] |
| Delivery Contact Status codes | Create a User | which Contact Status codes a salesperson sees [5] |
| Change a transaction's completion date | Extended Security | Completion Date Entry [23] |
| Change pickup quantity during quick pickup order completion | Extended Security | `Quantity Picked Up` [22] |
| (unnamed) security override | — | Restrict Scheduled Date breach [103][140] |

### Open questions and content defects

1. `[DECIDE]` **What unit consumes route capacity?** `Shipping Volume` is empty for pickups [140], yet pickups
   schedule against route calendars. Blocks every availability calendar.
2. `[DECIDE]` **Is capacity released when a fulfillment moves off a date?** Never stated; capacity would leak
   on every reschedule.
3. `[DECIDE]` **Delivery Date Entry [42] documents no capacity check.**
4. `[DECIDE]` **Can a line complete with an unscheduled remainder** after a split [165]?
5. `[DECIDE]` **Do the `Customer Prefers` weekday checkboxes [143] persist** to the customer record?
6. `[DECIDE]` **Customer Pickup Information [39] shows customer names on a public board.**
7. **Content defect [5]:** the General tab has a heading and no field documentation.
8. **Content defect [125]:** the body is published twice; the second copy drops the Reservation-Required
   sentence. §6 is the union.
9. **Content defect [143]:** the `Current Date` definition appears twice, the second adding the
   capacity-override sentence. §2.3 merges them.
10. **Content defect [156]:** prose-only — no field definitions, validation, interval unit or defaults.
11. **Corpus defect [74]:** the Fulfillment Selection block in `raw/som-corpus.md` carries an extraction
    agent's completion note and `agentId` — a harvesting artefact, not STORIS content.
12. **Naming defects `[DECIDE]`:** "Override a Capacity Date" [106] vs "Override Route Capacity Date" [165];
    "Select Route Code" [145] vs "Route Code Selection" / "Select Route" [135][136] vs "Route Code Lookup" [5].
