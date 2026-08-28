# Run 03 — Sales Processing — Batch 3: Fulfillments, Dates, Routes and Scheduling

**Status: complete.** 9 articles. Findings 25–33.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Fulfillment Selection** | /articles/15201408654612 | EXTRACTED — rich |
| 2 | Additional Fulfillment Information | /articles/15201388922772 | EXTRACTED |
| 3 | **Update Line Item Delivery Dates** | /articles/15201408341908 | EXTRACTED |
| 4 | Select a Fulfillment Date | /articles/15201408965140 | EXTRACTED |
| 5 | Select a Delivery Date | /articles/15201405852692 | EXTRACTED — thin |
| 6 | **Orders To Be Scheduled Window** | /articles/15201389993876 | EXTRACTED |
| 7 | Override a Capacity Date | /articles/15201389993236 | EXTRACTED |
| 8 | Route Code Entry Window | /articles/15201405849620 | EXTRACTED |
| 9 | Route Calendar Display Window | /articles/15201424459796 | EXTRACTED — thin |

Discovered and queued: `Logistical Scheduling` · `Build a Delivery/Service/Transfer Manifest` ·
`Maintain Un-manifested Fulfillments Sent to Dispatch Track` · `Delivery Contact Status Settings` ·
`Zip Code` records *(default route codes)* · `Route Capacity Settings` · `Modules and their Methods`.

---

## B. Wiring findings

### FINDING 25 — Adding a line to an order with several fulfillments forces an explicit routing decision
Invariant:  "It appears **upon saving a new line item when there are multiple fulfillments on the
            order.** The grid contains read-only information about **all fulfillments of the same
            method** as the line being added."
New fulfillment behaviour (verbatim): "**The fulfillment Date is not populated. Because of this, route
            capacity and `Restrict Based on Available Date`… are not checked; these checks are
            performed once the date is specified.** The `Deliver To` defaults to Billing or the primary
            Deliver To for the customer. The `Fulfillment Location` field is defaulted based on the
            Method."
Stock-location prompt (verbatim): "If the default `Stock Location for Delivery/Customer Pickup
            fulfillments` defined in Point of Sale Control Settings is set for the Fulfillment
            Location, and the selected fulfillment has a Fulfillment Location that **does not match**
            the Stock Location, a prompt appears, '**Change line Stock Location to match selected
            Fulfillment Location?**'"
Duplicate:  "**If a new fulfillment is created that matches an existing fulfillment, the user is
            presented with a message but is permitted to continue.**"
Naming:     "**If the fulfillments are identical, they are separated by a parenthesis '(' and number
            beginning at 2.**"
Evidence:   Fulfillment Selection, /articles/15201408654612
Maps to:    **NEW**

> Two things matter here. **A fulfillment created without a date bypasses both route capacity and the
> available-date restriction** until a date is entered — so the controls are deferred, not skipped,
> but there is a window in which an order holds an unvalidated fulfillment. And **duplicate
> fulfillments are permitted with only a message**, disambiguated by an appended `(2`. That means the
> "one CWC and one ASAP per method" rule from batch 1 Finding 4 is the *only* uniqueness constraint;
> dated fulfillments of the same method, date and Deliver To can multiply freely.
>
> The stock-location prompt is the sales-side echo of run 2's sourcing logic: **choosing where a
> fulfillment ships from can retroactively change where the line is sourced from**, on a Yes/No.

### FINDING 26 — The fulfillment grid exposes an ATP variance column, and unscheduled reads as 999
Columns (verbatim): `Fulfillment Description` · `Fulfillment Date` · `Location` · **`Status` (SCH, EST,
            etc.)** · **`Ticket Printed`** *(display-only checkbox)* · **`Route Capacity Available`**
            *(display-only checkbox)* · **`New Product ATP Date`** *(hidden if ATP is not active)* ·
            **`ATP Days Early(-)/Late`** · `Route Code` *(hidden by default)*
Invariant:  "Number of days early or late the Fulfillment Date is from the ATP date. **Days early are
            preceded by '-'** (e.g. five days early displays as '-5'). Days late are displayed as a
            positive value. **If unscheduled, '999' displays.**"
Caveat:     "**NOTE: This window provides no checks for route capacity. Those checks are performed when
            saving the line in the order.**"
Evidence:   Fulfillment Selection, /articles/15201408654612
Maps to:    **W-055 / W-056 — ATP surfaced as a decision aid**

> **`ATP Days Early(-)/Late` is the promise-risk indicator** run 2 could not find: it tells the
> salesperson, at the moment of choosing a fulfillment, how far ahead of availability they are
> committing. Negative means promising earlier than the merchandise can be there.
>
> **`999` as the unscheduled sentinel** joins the audit's growing list of state-encoded-as-value
> markers (`$$$^NN`, `"..."`, `None`, `Direct Ship`, `Hold`, `**`, `*`). And note the honest warning:
> the **`Route Capacity Available` checkbox is display-only and the window performs no checks** — the
> real capacity test happens on save, so the grid can show green and the save can still fail.

### FINDING 27 — One line can carry multiple delivery dates, with documented quantity-reallocation rules
Gate:       "**1) the `Allow multiple on order line` setting on the Logistics page of Point of Sale
            Control Settings OR 2) the order line you are maintaining currently has multiple delivery
            dates.**"
Rules (verbatim, complete): "**Apply to the unscheduled quantity whenever possible.** For quantity
            **increases**, apply to the unscheduled quantity. **The system does not update any delivery
            quantity for any specific date.** For quantity **decreases**, apply to the unscheduled
            quantity. **If insufficient unscheduled quantity exists, apply remaining amount to delivery
            quantities, starting from the last delivery date, until the decrease is satisfied.**"
Evidence:   Update Line Item Delivery Dates, /articles/15201408341908
Maps to:    **NEW**

> A documented allocation algorithm, and a sensible one: **increases never disturb existing promises;
> decreases eat the unscheduled pool first and then unwind from the latest date backwards.** So
> reducing a quantity always protects the *earliest* commitment — which is the right commercial
> instinct and worth preserving explicitly rather than rediscovering.
>
> Note the interaction with batch 2 Finding 21: a partial quantity **cannot** move to a different
> *fulfillment*, but it **can** carry a different *date within the same line*. Those are two different
> mechanisms for what looks like the same thing, and only one of them requires splitting the line.

### FINDING 28 — Date selection is capacity- and availability-aware, and has three separate screens
**`Select a Fulfillment Date`** — "select the delivery/pickup date from a calendar that displays
            **suggested dates based on route capacities and merchandise availability**"; customer
            day-of-week preferences (`All Days`, Monday–Sunday); requires status **Estimated or
            Scheduled**. Auto-appears when **`Select Delivery Date After Entered Merchandise`** is on,
            "and is also called when a delivery date **violates the `Restrict Based on Available Date`**
            setting."
**`Select a Delivery Date`** — "schedule the line item for a date **that already exists on the order**…
            you must choose from the drop-down list of all delivery dates existing on the order."
**`Route Calendar Display Window`** — "display available delivery dates for a selected **zip code or
            delivery route**."
Evidence:   Select a Fulfillment Date, /articles/15201408965140; Select a Delivery Date,
            /articles/15201405852692; Route Calendar Display Window, /articles/15201424459796
Maps to:    **NEW**

> Three date pickers with genuinely different jobs: pick **any** available date (capacity + ATP
> aware), pick **an existing** date on the order (consolidation), or **look up** what a zip code or
> route offers. The middle one is the interesting one — it exists specifically to keep an order's
> dates few, which is what makes a single delivery trip possible.
>
> **Customer day-of-week preference** is a real field here and appears nowhere in run 2's promising
> machinery. ATP produces the earliest possible date; this narrows it to days the customer will accept.

### FINDING 29 — Consolidating delivery dates reaches across orders, with seven eligibility rules
Trigger:    "It appears when you click the `Save` button at the conclusion of order entry, and answer
            **Yes** to the prompt '**Reschedule other orders now?**'"
Eligibility (verbatim, complete): "**Delivery lines or fulfillments exist on the order. The order has
            delivery items that are either partially or fully committed. The `Fulfillment Location`
            must match… The `Deliver To` on the orders must match… Orders with multiple delivery dates
            are excluded. Orders on credit hold are excluded. Orders on manifests are excluded.**"
Grid:       order number · type of order · scheduling status · deliver or pickup date · **fill status**
Restriction: "This process is checked by the **`Restrict Scheduled Date`** setting **first in
            `Warehouse/Store Location Settings` and then in `Point of Sale Control Settings`**… If
            scheduling deliveries beyond the number of days defined in these settings, **a security
            override is required.**"
Multi-fulfilment: "a single order may contain more than one scheduled delivery fulfillment, therefore
            **an order may be listed on the grid more than once.**"
Evidence:   Orders To Be Scheduled Window, /articles/15201389993876
Maps to:    **NEW**

> Selling to a repeat customer **can reschedule their other open orders** onto one date, from inside
> order entry. The eligibility rules are the interesting part: matching **Fulfillment Location and
> Deliver To** is the join key, and three states are excluded — multiple dates, **credit hold**, and
> **manifested**. Credit hold appearing here is the third place it gates something (batch 1: order
> completion; batch 1: the `Credit Hold` header field), which makes credit state a genuine
> cross-cutting concern in Sales Processing rather than a Receivables detail.
>
> The `Restrict Scheduled Date` fall-through is **location first, then company** — the opposite
> direction from most STORIS hierarchies, which start narrow and widen. Worth confirming.

### FINDING 30 — Route code resolution is zip-driven, and the route freezes at manifest
Invariant:  "After you specify a customer… this window appears **if no default route code has been
            specified in the `Zip Code` record associated with the customer's shipping address.**"
Invariant:  "**NOTE: Once an order appears on a manifest, you cannot change the route.**"
Invariant:  "**If you change the stock and ship location, the route code does not update as a result.**
            However, you can access `Logistical Scheduling` to confirm the route."
Quote rule: also appears "during the creation of a sales quote if the **`Sales Order Entry - Require
            Route for Sale Quotes`** box in Point of Sale Control Settings is checked and a default
            route has not been set."
Zip hierarchy (from batch 1): 9-digit zip default route → related 5-digit zip default route → **all
            route codes displayed**.
Evidence:   Route Code Entry Window, /articles/15201405849620;
            Enter a Sales Order, /articles/15201409256084
Maps to:    **NEW — and it extends run 2's zip-as-routing-key finding**

> Run 2 Finding 94 established that **zip codes silently determine stock, ship, service and region**.
> This adds **route code** to that list, with its own two-level zip fall-through (9-digit, then
> 5-digit, then everything). The zip code table is now responsible for five different routing
> decisions and remains undocumented anywhere in the audit.
>
> Two traps. **Changing stock/ship location does not re-derive the route** — the order keeps a route
> that may no longer make sense, and the article's remedy is "go and check it manually in Logistical
> Scheduling." And **the route freezes at manifest**, a sixth manifest-as-freeze finding.

### FINDING 31 — Capacity override is permissioned separately for orders and transfers, and failure leaves lines unscheduled
Invariant:  "you can select a date **outside of the available delivery dates for a route that is
            otherwise full**. If you do not have permission… a prompt appears allowing a user with
            permission to enter valid credentials. **If the user does not have permission to override a
            full scheduled route, the user's line(s) remain unscheduled.**"
Two permissions (verbatim): "**`Override capacities when scheduling routes that are full`**" for orders;
            "**For transfer processing, this screen is available only if you have access via the
            `Override Transfer Capacity Restrictions` field**" — both in Logistics Security.
Evidence:   Override a Capacity Date, /articles/15201389993236
Maps to:    **W-050 — two more Logistics Security permissions**

> The failure mode is the finding: **a refused override leaves the lines unscheduled**, not the order
> rejected. So capacity pressure silently converts scheduled demand into unscheduled demand — which
> then flows into batch 1's `U` line status, run 2's jeopardy exclusions, and the `999` ATP variance
> of Finding 26. **Unscheduled is where the system puts everything it cannot commit**, from four
> different causes, and nothing distinguishes them once the line is in that state.

### FINDING 32 — A fulfillment carries dispatch, contact and COD attributes beyond its date
Tabs (verbatim): **General · Contact Information · Other Information**
*Contact Information*: **`Contact Name` · `Contact Status` · `Contact Date`**
*Other Information*: **`Manifest Location` · `Route` · `Truck` · `Include in Maintain Un-manifested
            Fulfillments Sent to Dispatch Track` · `Ship Via` · `C.O.D.` · `Number of Postponements`**
Cross-ref:  `Additional Order Detail` carries **`Delivery Postponements While Reserved`, `Total
            Delivery Postponements`, `Pickup Postponements While Reserved`, `Total Pickup
            Postponements`** — all read-only *(batch 1)*.
Evidence:   Additional Fulfillment Information, /articles/15201388922772;
            Additional Order Detail, /articles/15201408473492
Maps to:    **NEW**

> **`Number of Postponements` is counted per fulfillment and aggregated four ways on the order** —
> delivery vs pickup, and total vs "while reserved". That is a deliberately built customer-service
> metric: *how many times did we move this, and how many of those times were we holding stock for
> them.* Nothing else in the audit measures broken promises this directly, and it is the natural
> counterpart to run 2's jeopardy reporting.
>
> **`C.O.D.` at fulfillment level** means cash-on-delivery is a per-trip attribute, not a payment type
> on the order — which connects to the Financing subsection's `COD Worksheet` (queued for batch 10).
> And `Contact Status` / `Contact Date` are the delivery-confirmation call, driven by
> `Delivery Contact Status Settings`.

### FINDING 33 — Scheduling has four independent gates, and three of them can be overridden
Consolidated from this batch and batch 1:

| Gate | Enforced by | Override |
|---|---|---|
| **Route capacity** | `Route Capacity Settings`, checked on line save | `Override capacities when scheduling routes that are full` |
| **Available date (ATP/ATC)** | `Restrict Based on Available Date` / `DELIVERY DATES: Restrict based on available date` | security override |
| **Scheduling horizon** | `Restrict Scheduled Date` — Warehouse/Store Location Settings, **then** POS Control Settings | security override |
| **Balance due** | `Change Fulfillment Status to SCH with a Balance Due` | Logistics Security permission |
| **Unscheduled lines** | `Prohibit Unscheduled Lines` | manager credentials |
| **Route compatibility** | product delivery method vs route code | "property security clearance or a manager override" |
Evidence:   accumulated; Enter a Sales Order, /articles/15201409256084;
            Override a Capacity Date, /articles/15201389993236;
            Orders To Be Scheduled Window, /articles/15201389993876
Maps to:    **NEW — stated as a finding because no article collects it**

> Six independent scheduling constraints, each with its own setting and its own override path, spread
> across three settings files and two security files. **Every one of them is bypassable by someone**,
> and the bypass is the normal path when the floor needs a date — which means in practice the
> constraints shape defaults rather than enforce policy.
>
> For the rebuild the useful question is not which constraints to implement but **which overrides
> should be logged**. Batch 1 established that the Access Control Window records who authorised each
> override; that log is the only place this whole system's real behaviour is visible.

---

## C. Screen and field inventory

**Fulfillment Selection** — grid: Fulfillment Description · Fulfillment Date · Location · Status ·
**Ticket Printed** · **Route Capacity Available** · **New Product ATP Date** ·
**ATP Days Early(-)/Late** · Route Code *(hidden by default)*. Buttons: double-click to choose ·
**New Fulfillment**.

**Additional Fulfillment Information** — tabs General · Contact Information · Other Information.
Contact Name · Contact Status · Contact Date · Manifest Location · Route · Truck ·
Include in Maintain Un-manifested Fulfillments Sent to Dispatch Track · Ship Via · **C.O.D.** ·
**Number of Postponements**.

**Update Line Item Delivery Dates** — Product · Order Quantity · Delivery · Date · Quantity · grid.

**Select a Fulfillment Date** — Fulfillment Method · **Earliest Available** · **Customer Prefers**
(All Days, Monday–Sunday) · Fulfillment · Current Date · **Delivery Time**.

**Select a Delivery Date** — `Delivery Date` *(drop-down of dates already on the order)*.

**Orders To Be Scheduled Window** — **`Schedule Orders For`** · grid: order number · order type ·
scheduling status · delivery/pickup date · **fill status** · Reschedule.

**Override a Capacity Date** — `Date`.

**Route Code Entry Window** — `Enter Route Code`.

**Route Calendar Display Window** — `Zip or Postal Code` · `Date` · `Route`.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `Allow multiple on order line` | POS Control Settings → Logistics | Multiple delivery dates per line |
| `Select Delivery Date After Entered Merchandise` | POS Control Settings | Auto-opens the date picker after merchandise entry |
| `Restrict Based on Available Date` | POS Control Settings | Calls the date picker when a date beats availability |
| `Restrict Scheduled Date` | **Warehouse/Store Location Settings, then POS Control Settings** | Scheduling horizon; override required beyond it |
| `Stock Location for Delivery/Customer Pickup fulfillments` | POS Control Settings | Prompts to realign line stock location to the fulfillment |
| `Sales Order Entry - Require Route for Sale Quotes` | POS Control Settings | Forces a route on quotes |
| `DELIVERY DATES - Consolidate Multiple Orders` | POS Control Settings | Triggers the cross-order reschedule prompt |
| default route code | **Zip Code record** (9-digit, then 5-digit) | Route assignment; absent ⇒ all routes offered |
| `Route Capacity Settings` | Logistics | Capacity checked on line save, not in the selection window |
| `Delivery Contact Status Settings` | Logistics | Contact Status values on a fulfillment |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| `Override capacities when scheduling routes that are full` | Logistics Security | Scheduling into a full route *(orders)* |
| **`Override Transfer Capacity Restrictions`** | Logistics Security | The same, for transfers |
| `Change Fulfillment Status to SCH with a Balance Due` | Logistics Security + POS setting | Scheduling with money outstanding |
| `Change Order Fulfillments with a Status of Scheduled` | Sales Security | Editing a scheduled fulfillment |
| `Create multiple fulfillments for a method` | Sales Security | Adding lines to a new fulfillment |
| `Restrict Scheduled Date` override | (security override) | Scheduling beyond the horizon |

---

## F. State machines and enumerations

**Fulfillment statuses** — **`SCH` Scheduled · `EST` Estimated** *(abbreviations confirmed)* ·
`CWC` · `ASAP` · unscheduled.
**ATP variance display** — negative = days early · positive = days late · **`999` = unscheduled**.
**Fulfillment naming** — identical fulfillments disambiguated by `(2`, `(3`, …
**Route resolution** — 9-digit zip default → 5-digit zip default → all routes offered.
**Consolidation exclusions** — multiple delivery dates · **credit hold** · **on a manifest**.
**Quantity reallocation on a multi-date line** — increases → unscheduled only; decreases → unscheduled
first, then **from the last delivery date backwards**.
**Postponement counters (4)** — delivery total · delivery while reserved · pickup total · pickup while
reserved.
**Scheduling gates (6)** — route capacity · available date · scheduling horizon · balance due ·
unscheduled lines · route compatibility.

---

## G. Sequencing rules

1. `Fulfillment Selection` appears on saving a new line when multiple fulfillments exist for its method.
2. A fulfillment created without a date defers capacity and available-date checks until a date is set.
3. Route capacity is checked **on line save**, not in the selection window.
4. Quantity increases on a multi-date line go to unscheduled; decreases unwind from the last date back.
5. `Restrict Scheduled Date` is checked at location level first, then company level.
6. A refused capacity override leaves the lines **unscheduled**, not the order rejected.
7. Changing stock/ship location does **not** re-derive the route code.
8. Once an order is on a manifest, the route cannot be changed and the fulfillment cannot be moved.
9. Cross-order consolidation excludes multi-date, credit-held and manifested orders.

---

## H. Open questions and gaps

**Gated or unreachable**
- `Logistical Scheduling` — named as the remedy when a route needs confirming; run 4's territory.
- `Route Capacity Settings` · `Zip Code` records · `Delivery Contact Status Settings`.
- `Maintain Un-manifested Fulfillments Sent to Dispatch Track` — a dispatch integration surfaced only
  as a checkbox label.
- `Build a Delivery/Service/Transfer Manifest` — the manifest that freezes six different things.

**Documented but ambiguous**
- **`fill status`** on the consolidation grid — a status the audit has not seen elsewhere.
- **`Handling Method`** on the fulfillment — still undefined, now three batches running.
- **`Contact Status`** values — driven by a settings file, enumeration not given.
- **`Ship Via` and `Truck`** at fulfillment level — how they relate to route and manifest is unstated.
- **Whether `Restrict Scheduled Date` really checks location before company** — it is the reverse of
  the usual STORIS direction and is stated once.
- **What distinguishes the four causes of "unscheduled"** once a line is in that state.
- **`Delivery Time`** on the fulfillment date picker vs `Time` on the fulfillment page — same field?
- Whether `Number of Postponements` increments automatically on every date change, or only on
  customer-initiated ones.

**Inferences (not in section B)**
- `999` is presumably a sentinel rather than a real day count; the article states the display, not the
  intent.
- The four postponement counters presumably feed a service-quality report; none is named.
- `fill status` is presumably the reservation state of the order's lines; not stated.

---

## I. Unknown unknowns

- **An `ATP Days Early(-)/Late` column** telling the salesperson how far ahead of availability they are
  promising, at the moment of choice.
- **`999` as the unscheduled sentinel.**
- **A dateless fulfillment that defers capacity and availability checks.**
- **Duplicate fulfillments permitted and auto-numbered `(2`.**
- **Documented quantity-reallocation rules** that protect the earliest promise.
- **Cross-order rescheduling from inside order entry**, joined on Fulfillment Location and Deliver To.
- **Credit hold excluding an order from consolidation** — credit state as a scheduling input.
- **Route code frozen at manifest, and not re-derived when the ship location changes.**
- **A refused capacity override silently unscheduling lines.**
- **Four postponement counters**, split by delivery/pickup and by whether stock was reserved.
- **`C.O.D.` as a fulfillment attribute** rather than a payment type.
- **Six independent scheduling gates, all overridable.**

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| SCH / EST | Scheduled / Estimated fulfillment status |
| ATP Days Early(-)/Late | Days between the promised fulfillment date and the ATP date; 999 = unscheduled |
| Fulfillment Selection | Screen forcing a routing decision when a line joins a multi-fulfillment order |
| Consolidate delivery dates | Rescheduling a customer's other eligible orders onto one date |
| Fill status | Undescribed order status shown on the consolidation grid |
| Number of Postponements | Per-fulfillment count of date changes; aggregated four ways on the order |
| C.O.D. | Cash on delivery, held at fulfillment level |
| Manifest Location / Dispatch Track | Fulfillment dispatch attributes |
| Customer Prefers | Day-of-week delivery preferences used to narrow suggested dates |

---

## Contract adjudication — batch 3

| Contract | Verdict | Basis |
|---|---|---|
| **W-055 / W-056** | **CONFIRMED, extended** | ATP surfaced as a per-fulfillment variance column; capacity and availability are separate gates (F26, F33) |
| **W-050** | **CONFIRMED consistent** | Six scheduling gates, all with override paths; two new Logistics Security permissions (F31, F33) |
| **W-012** | **relevant** | Multi-date lines, postponement counters and horizon restrictions are all date-model behaviours (F27, F32) |
| **W-052 / W-053** | **not documented in this batch** | — |

---

## Next — batch 4: payments and tender types
