# Run 02 — Merchandising — Batch 7: Purchasing Reports, Open Orders and Fill

**Status: complete.** 12 articles. Findings 95–104.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Report Purchase Order Dollar Amounts** | /articles/15203128357780 | EXTRACTED |
| 2 | Report Purchasing Cash Forecast | /articles/15203112476308 | EXTRACTED |
| 3 | Report Purchase Orders to be Received | /articles/15203129109780 | EXTRACTED |
| 4 | Report Purchase Orders by Product | /articles/15203128186772 | EXTRACTED |
| 5 | **Report Purchase Orders Received for Sales Orders** | /articles/15203128182932 | EXTRACTED — rich |
| 6 | Report Purchasing Acknowledgements | /articles/15203113109396 | EXTRACTED |
| 7 | **Report Open Purchase Orders by Vendor** | /articles/15203012633876 | EXTRACTED |
| 8 | Report Special Order Purchase Orders | /articles/15203214872084 | EXTRACTED |
| 9 | **Report Recently Reserved Merchandise** | /articles/15203128184596 | EXTRACTED — rich |
| 10 | Report Inventory Values for Open Orders | /articles/15202930803220 | EXTRACTED — thin |
| 11 | **Report Inventory Fill Dates in Jeopardy** | /articles/15202930802836 | EXTRACTED |
| 12 | **Open Order by Product** | /articles/15295155560212 | EXTRACTED |

Discovered and queued: **`Available To Promise (ATP)`** *(finally located — answers batch 3's open
`ATP` question)* · `Inventory Control Settings` → **`Online Receipts Reservations`** ·
`Report Purchase Order Delivery Information` · `Report Service Orders with Service Dates in Jeopardy` ·
`Generate Daily Reports` · `Schedule and Build a Transfer Manifest` · `Create a Report` ·
`Search for a Sales Order by a Specific Product`.

---

## B. Wiring findings

### FINDING 95 — End-of-Day reserves merchandise against orders, and produces a dated "fill list"
Invariant:  "This report shows the reservation of merchandise for **the day in which the End-of-Day
            process was run**, or **a selected fill date that can be up to 7 days ago**."
Invariant:  "The report includes both stock and special-order items **reserved via warehouse receipts
            or via the End-of-Day process**."
Invariant:  "**If the fill list is not available for the requested date, the system displays a message
            indicating that there is no fill list on file for that date.**"
Invariant:  "**If the `Online Receipts Reservations` field is active in the `Inventory Control
            Settings`, the report list only sales orders not satisfied by that field.**"
Content:    quantity ordered · quantity reserved · customer name · home and work numbers ·
            **delivery status from the sales order (scheduled delivery, estimated delivery, customer
            pickup)** · delivery date.
Sort:       store location → **first salesperson on the order** *(only if `Sort by Salesperson`)* →
            bill-to customer → order number.
Evidence:   Report Recently Reserved Merchandise, /articles/15203128184596
Maps to:    **NEW — and it is the allocation engine the run had not yet found**

> **Reservation is an End-of-Day process, and it produces a persisted, dated artefact — the fill
> list — that expires after seven days.** That is a significant piece of architecture nothing in
> batches 1–6 hinted at. Two mechanisms coexist: **`Online Receipts Reservations` allocates at the
> moment of receipt**, and End-of-Day sweeps whatever that missed. Which one runs changes what appears
> on this report, and by extension what a scheduler acts on.
>
> This also closes a loop from batch 3. `Units Available = Warehouse QOH – Warehouse Quantity
> Committed`, and "committed" is what reservation creates. **So availability is only as current as the
> last reservation pass** — with `Online Receipts Reservations` off, a full day's receipts are
> unreserved and therefore counted as available to the replenishment engine that runs in the same
> End-of-Day. The ordering of those two EOD steps is not documented anywhere read so far.

### FINDING 96 — Newly received goods and unfilled back orders are matched on a report, not by the system
Invariant:  "Use this report to assist in **allocating unassigned back orders**. The report lists
            **all goods received since the last End-of-Day process was run**, as well as **any open
            sales orders whose merchandise requirements may be filled by the newly received
            inventory**."
Invariant:  "You can also use this report to **identify sales orders with a status of `ASAP` and
            determine those ASAP sales orders to which you want to manually commit goods**."
Invariant:  "**Merchandise that was received via `Receive a Purchase Order with a Separate Freight
            Bill` remain on this report until the freight batches are closed.**"
Constraint: "**To run the report, you must select one or more regions or warehouses. When you edit one
            field, you de-activate the other**, so if the field you want to edit is inactive, clear the
            contents of the other."
Evidence:   Report Purchase Orders Received for Sales Orders, /articles/15203128182932
Maps to:    **NEW**

> `ASAP` orders are **deliberately excluded from automatic allocation** and handed to a person on a
> printed report to commit by hand. Combined with Finding 99 below — where `CWC` and `ASAP` orders are
> also excluded from the jeopardy report — the picture is that **the two fastest-promise order classes
> are the ones the system refuses to manage automatically.** That is worth stating plainly to the
> business: the orders most likely to disappoint a customer are the ones with the least system
> support.
>
> The container note is a second consequence of batch 2 Finding 39: goods received on an open freight
> batch are physically present, visible on this report, but **not yet costed and not yet allocated
> away** — they sit in a window that closes only when someone closes the batch.

### FINDING 97 — Purchase orders read as "open" after full receipt whenever accounting is active
Invariant:  "**If accounting is active on your system, payment approvals close purchase orders.
            Therefore, even fully received purchase orders can appear as 'open' and will appear in
            this report until the AP bill is created and `Generate Daily Reports` (End-of-Day) is
            run.**"
Evidence:   Report Open Purchase Orders by Vendor, /articles/15203012633876
Maps to:    **W-044 — CONFIRMED, third independent statement**

> Batch 1 Finding 4 and batch 1 Finding 20 established this from the entry screen and the FAQ. Here it
> is a third time, stated as a **reporting caveat** — which is where it actually bites. "Open purchase
> orders" in STORIS means *not yet paid*, not *not yet received*, and any operational metric built on
> that report (open PO value, vendor exposure, expected receipts) is measuring a payables state
> dressed as a purchasing state. **The lag is at least one End-of-Day beyond AP bill creation.**
> Anyone rebuilding open-PO reporting has to decide which of the two questions they are answering,
> because STORIS conflates them.

### FINDING 98 — COM purchase orders have no receiving location at all
Invariant:  "**NOTE: Since `COM` purchase orders are shipped to the vendor and do not have a receiving
            location, the `Warehouse Location` column instead displays the vendor being shipped to.**"
Evidence:   Report Purchase Order Dollar Amounts, /articles/15203128357780
Maps to:    **NEW — completes batch 1 Finding 1's COM thread**

> Batch 1 found the COM tab exists only on purchase orders created from Sales Order Entry. This says
> what a COM purchase order physically *is*: **goods flowing outward to the vendor**, not inward.
> The receiving location field is repurposed to hold the destination vendor. That is a polarity
> reversal inside the same record type, and a rebuild that assumes a PO is always inbound will get COM
> wrong. COM also appears as a first-class layer cost component (batch 2 Finding 36) and on the kit /
> special order screens — so customer's own material runs through purchasing, costing and fulfilment
> as a genuine third material flow beside stock and special order.

### FINDING 99 — `CWC` is a delivery status, and jeopardy reporting excludes it along with ASAP and non-saleable stock
Invariant:  "**NOTE: The report does not include - orders with a delivery status of `CWC` or `ASAP`.
            - products with a non-saleable status (for example, floor samples or as-is products).**"
Invariant:  "If using **multiple fulfillments** and those dates are present, **the regular orders
            version displays all delivery dates for an item, while the special orders version displays
            only the first date for which the purchase order will not arrive in time**."
Split:      `Include` → **`Regular Orders`** / **`Special Orders`**; service orders go to a separate
            routine.
Evidence:   Report Inventory Fill Dates in Jeopardy, /articles/15202930802836
Maps to:    **closes the `CWC` question opened in batch 1**

> `CWC` is confirmed as a **delivery status**, sitting beside `ASAP`. Across the run it has appeared
> as: a class counted in unreserved quantity (b1 F17), a counted order class on the buyer's worksheet
> (b5 F75), and now a delivery status excluded from jeopardy. **Its expansion is still never printed
> anywhere in the help center** — recorded as a known-unknown rather than guessed.
>
> The exclusions matter more than the name. Floor samples and as-is products are excluded here for the
> same reason batch 1's `NET AVAIL` subtracts them: **non-saleable stock is systematically outside the
> promise machinery.** And the regular/special asymmetry under multiple fulfillments means the two
> halves of this report answer different questions — all dates versus first failing date.

### FINDING 100 — Region and Location are mutually exclusive selection axes, enforced by field deactivation
Invariant:  "**To run the report, you must select one or more regions or warehouses. When you edit one
            field, you de-activate the other**, so if the field you want to edit is inactive, clear the
            contents of the other."
Invariant (batch 6, restated): "**The District/Region prompts are mutually exclusive from the Location
            prompt. That is, only one can be active at the same time.**"
Seen on:    Report Purchase Orders Received for Sales Orders · Report Purchase Order Dollar Amounts
            *(Region, Location)* · Report Purchase Orders by Product *(Region, Location)* ·
            Report Purchasing Acknowledgements *(Region, Store)* · Report Special Order Purchase Orders
            *(Receiving Region, Receiving Location)* · Report Recently Reserved Merchandise
            *(District, Store)* · Report Inventory Values for Open Orders *(District, Store)*
Evidence:   Report Purchase Orders Received for Sales Orders, /articles/15203128182932;
            Regional Processing - Reporting Rules, /articles/15185859800340
Maps to:    **NEW — a section-wide UI contract**

> Every purchasing report in this batch carries the same paired geography prompt, and **it is
> impossible to ask for "these two regions plus this one extra store".** The pairing also reveals
> which half of Regional Processing each report belongs to: reports using **Region** are inventory
> reports; those using **District** are sales reports — exactly batch 6 Finding 84's split, made
> visible in the prompt names. `Report Recently Reserved Merchandise` and `Report Inventory Values for
> Open Orders` use **District**, which is initially surprising for inventory-sounding reports until
> you notice both are really about *customers waiting for goods*.

### FINDING 101 — Purchase order reporting runs inside End-of-Day, and the run-time options are printed with the output
Invariant:  "**This report also runs as part of the End-of-Day process.**" *(Report Purchase Order
            Dollar Amounts)*
Invariant:  "**The run-time options selected usually print either in the report headers or on the last
            page of the report output.**" *(Report Purchase Orders to be Received)*
Also EOD-resident (accumulated): `Report Active Costing Exceptions` · `Report Solved Costing
            Exceptions` · `Report Automatic Purchase Order Replenishments` · the warehouse receipts
            register · `Automatic Purchase Order Replenishment` · reservation/fill · PO status → CLOSED
            · closed-date stamping · PO↔SO linking *(when enabled)*.
Evidence:   Report Purchase Order Dollar Amounts, /articles/15203128357780;
            Report Purchase Orders to be Received, /articles/15203129109780
Maps to:    **NEW — consolidates the End-of-Day inventory for this run**

> **End-of-Day is the section's real transaction boundary.** Nine distinct merchandising behaviours
> now attach to it, several of which are the only time a thing happens at all: status becomes CLOSED,
> replenishment POs are generated, merchandise is reserved, the receiving register is written, and
> exception reports are produced. Run 1 found the same for Accounting. For the cutover this means
> **End-of-Day is not a batch job to be replaced with real-time processing without deciding, per
> behaviour, what its new trigger is** — and at least three of them (fill list, CLOSED status, closed
> date) are the only source of a fact that other processes depend on.
>
> The printed run-time options are a small but genuine audit feature: **a STORIS report carries its own
> parameters**, so a printout is self-describing. Worth keeping in a rebuild; it is why nobody in the
> business has to ask "what dates was this run for".

### FINDING 102 — Reports select purchase orders on axes the PO screens never expose
Selection axes seen only in reports:
            **`Number of Days Past Due`** · **`Status of PO's to Report`** · **`Days Old`** ·
            **`Dock Scheduled PO's Only`** · **`Zero Cost PO Only`** · **`On-Hold PO Only`** ·
            **`Report EDI Vendors Only`** · **`Direct-Ship PO's`** · **`Inventory or Supplies`** ·
            **`Types to Include`** · **`Report Open Quantity Only`** · **`Include Special Order
            Comments`** · **`Include Purchase Orders On Hold`** · **`Inventory Type`** ·
            **`Aging Period`** · **`Detail or Summary`**
Evidence:   Report Purchase Orders by Product, /articles/15203128186772; Report Purchasing
            Acknowledgements, /articles/15203113109396; Report Open Purchase Orders by Vendor,
            /articles/15203012633876; Report Special Order Purchase Orders, /articles/15203214872084;
            Report Purchasing Cash Forecast, /articles/15203112476308
Maps to:    **NEW**

> Several of these are **states the entry screens never named**. `Zero Cost PO Only` implies zero-cost
> purchase orders are a recognised population worth filtering for — connecting directly to batch 2's
> zero-cost exception types 1–3. `Days Past Due` and `Days Old` imply a lateness model on purchase
> orders that no entry article describes. `Dock Scheduled PO's Only` promotes batch 1's undescribed
> `Dock Scheduled` field to a filterable state. **The reports are, in effect, the most complete
> documentation of the purchase order data model in the section** — which is a warning: fields matter
> here that the entry screens do not explain.

### FINDING 103 — `Open Order by Product` is the one screen that shows demand and supply for a product together
Invariant:  "Use this screen to view **all open orders (sales or service) for a selected product**…
            **sales, returns, exchanges, and service documents**."
Displays:   **total net PO quantity · quantity on-hand · net available · as-is quantity**; per order,
            **pieces ordered and reserved**.
Axes:       `Location` · **`Use Ship From Location`** / **`Use Selling Location`** · `Order Type`
Invariant:  "**This inquiry may be affected by Regional Processing restrictions. That is, you can
            inquire only about customers and locations to which you have access.**"
Invariant:  "**This routine maintains an `Active Locations List`.**"
Evidence:   Open Order by Product, /articles/15295155560212
Maps to:    **W-055 / W-056 — the closest thing to a single availability view**

> Four of the run's availability quantities on one screen, against the open demand that consumes them,
> across **four document types including returns and exchanges** — so inbound customer returns are
> part of the supply picture, matching batch 3's `Include Returns in Availability` setting. The
> `Use Ship From Location` / `Use Selling Location` toggle is the demand-side counterpart of batch 6's
> district/region split: **the same order counts against a different location depending on the toggle.**
> `Active Locations List` appears here for the first time and is presumably the session-scoped list
> batch 6 Finding 88 described as being widened by opening documents — the two articles never connect.

### FINDING 104 — Cash forecasting from purchase orders is a single aged report with an on-hold toggle
Invariant:  "This report provides **projected dollar amounts needed to pay for future deliveries**
            scheduled during user-defined time intervals. **It is based on open purchase order
            amounts** and is used to anticipate needed cash flow."
Options:    `As Of Date` · **`Aging Period`** · **`Include Purchase Orders On Hold`**
Evidence:   Report Purchasing Cash Forecast, /articles/15203112476308
Maps to:    **NEW — links Merchandising to run 1's AP work**

> The only cash-side output in the section, and it is built on **open purchase order amounts** — which
> Finding 97 has just shown includes fully received, unpaid orders. So the cash forecast is measuring
> committed spend, correctly, but its denominator is the same conflated "open" population. The
> `Include Purchase Orders On Hold` toggle is the interesting one: **held POs are excluded by default
> from cash forecasting but included by default in replenishment supply** (batch 3 Finding 48).
> The same population, opposite defaults, in two modules. Neither article acknowledges the other.

---

## C. Screen and field inventory

**Report Purchase Order Dollar Amounts** — Date Code · Start/End Date · **Region** · **Location** ·
`Report Open Quantity Only` · **`Types to Include`** · Send Output to · Export Path · Actions.
Subtotals per vendor, grand total. **Runs as part of End-of-Day.**

**Report Purchasing Cash Forecast** — As Of Date · **Aging Period** · **Include Purchase Orders On
Hold** · Send Output to · Export Path.

**Report Purchase Orders to be Received** — Purchase Order Number · Date Code · Start/End Date ·
Receiving Location · **Include P/O line detail** · **Inventory Type** · Send Output to · Export Path.
Prints space for actual arrived quantity and storage location; up to three special-order options;
excludes fully received orders.

**Report Purchase Orders by Product** — **Number of Days Past Due** · Earliest/Latest Scheduled Date ·
**Status of PO's to Report** · **Include Special Order Comments** · **Report Open Quantity Only** ·
**Direct-Ship PO's** · **Inventory or Supplies** · Product · Category · Buyer · Vendor ·
**Report EDI Vendors Only** · Region · Location · Send Output to · Export Path · Actions.

**Report Purchase Orders Received for Sales Orders** — **Region** *(xor)* **Receiving Warehouse** ·
Product Category · Send Output to · Export Path. Sorts: receiving warehouse → product category →
model number → order number. Output includes bill-to name, home and work phones.

**Report Purchasing Acknowledgements** — Purchase Order Number · Buyer · **Purchase Order Status** ·
**Days Old** · Region · Store · Send Output to · Export Path · Actions. Sort by P/O number.

**Report Open Purchase Orders by Vendor** — Date Selection · From · To · **Type** · Vendor · Buyer ·
**Dock Scheduled PO's Only** · Primary Sort · Secondary Sort · Send Output to · Export Path.

**Report Special Order Purchase Orders** — Receiving Region · Receiving Location ·
**Include Direct Ship PO** · **Zero Cost PO Only** · **On-Hold PO Only** · Date Code · Start/End Date ·
Vendor · **Detail or Summary** · Send Output to · Export Path. Displays **profit margin (`Mar%`)** for
items on POs linked to sales orders. Summary omits Special Order Instructions / PO comments.

**Report Recently Reserved Merchandise** — Date Code · As Of Date · **District** · Store ·
**Report Type** · **Print Order Details** · **Sort by Salesperson** · Send Output to · Export Path.

**Report Inventory Values for Open Orders** — District · Store · Send Output to · Export Path.
"cost information for goods that have been **sold, but not delivered**… both **reserved and
non-reserved** items."

**Report Inventory Fill Dates in Jeopardy** — Location · Salesperson · **Include: Regular Orders /
Special Orders** · Page Break on Location · Total on Orders · Send Output to · Export Path.

**Open Order by Product** — pages **Open Orders · General Info**. Product · Vendor · Brand ·
Vendor Model · Location · **Use Ship From Location** / **Use Selling Location** · **Order Type** ·
**On Hand · Net Available · Net PO · As-Is** · grid · Actions. Record counter with Previous/Next.
Also known as **`Search for a Sales Order by a Specific Product`**.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`Online Receipts Reservations`** | **Inventory Control Settings** | Whether receipts allocate to orders immediately, or wait for End-of-Day |
| `Sort by Salesperson` | Report Recently Reserved Merchandise *(run-time)* | Adds salesperson as a sort level |
| `Include Purchase Orders On Hold` | Report Purchasing Cash Forecast *(run-time)* | **Held POs excluded from cash forecast by default** |
| Regional Processing | General System Control Settings | Region vs District prompts; mutual exclusion with Location |

---

## E. Security permissions catalog

*No new permissions.* Every report in this batch carries the Regional Processing caveat; `Open Order
by Product` states it as a customer-and-location access restriction, and `Product Performance and
Purchase Recommendations`, `Report Open To Buy Information` and `Automatic Purchase Order
Replenishment` remain the documented exceptions (batch 6 Finding 86).

---

## F. State machines and enumerations

**Delivery statuses** — `scheduled delivery` · `estimated delivery` · `customer pickup` · **`ASAP`** ·
**`CWC`**.
**Order types visible on `Open Order by Product`** — sales · returns · exchanges · service documents.
**Reservation sources** — warehouse receipts *(`Online Receipts Reservations`)* · End-of-Day.
**Fill list** — dated artefact produced by reservation; retrievable for **up to 7 days**.
**PO "open"** — with accounting active, means *not yet paid*, and persists past full receipt until the
AP bill exists **and** End-of-Day runs.
**Non-saleable statuses** — floor samples · as-is products *(excluded from jeopardy and from
`NET AVAIL`)*.
**COM purchase orders** — outbound to the vendor; **no receiving location**.
**Report geography prompts** — Region *(inventory)* xor Location; District *(sales)* xor Store.
**End-of-Day merchandising behaviours (9)** — PO status → CLOSED · closed-date stamping ·
automatic PO replenishment · replenishment report · reservation / fill list · warehouse receipts
register · costing exception reports · PO dollar amounts report · PO↔SO linking *(when enabled)*.

---

## G. Sequencing rules

1. Reservation happens **at receipt** if `Online Receipts Reservations` is active, otherwise at
   **End-of-Day**; either way it produces a dated fill list retained for seven days.
2. `Report Purchase Orders Received for Sales Orders` covers goods received **since the last
   End-of-Day** — so it is a between-runs worklist.
3. Container-received goods stay on that report until the **freight batch is closed**.
4. `ASAP` orders are committed manually from that report, not automatically.
5. With accounting active, a fully received PO stays "open" until the AP bill exists **and** End-of-Day
   has run.
6. Region/District and Location prompts are mutually exclusive; clear one to use the other.
7. `Report Purchase Orders to be Received` excludes fully received orders.
8. Jeopardy reporting excludes `CWC` and `ASAP` orders and non-saleable products.
9. `Report Purchase Order Dollar Amounts` runs automatically in End-of-Day.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Available To Promise (ATP)`** — located at last, as a related article on the jeopardy report. It
  answers batch 3 Finding 55's open question about the "standard hierarchy to obtain an ATP date".
  **Read it first in batch 8.**
- `Inventory Control Settings` — now referenced for `Allow Receiving to Close Purchase Order` (b1),
  `Layaway in Net Purchase Order` (b3) and `Online Receipts Reservations` (b7). Unread.
- `Report Purchase Order Delivery Information` — referenced from three batches, not in the
  Merchandising section listing.
- `Generate Daily Reports` — the End-of-Day article itself, referenced in six batches.

**Documented but ambiguous**
- **The order of End-of-Day steps.** Reservation and replenishment both run there, and replenishment's
  `Units Available` depends on what reservation has committed. **Nothing states which runs first**, and
  it changes order quantities.
- **`Report Type`** on Report Recently Reserved Merchandise — undefined.
- **`Types to Include`** on Report PO Dollar Amounts — presumably PO types, unstated.
- **`Status of PO's to Report`** / **`Purchase Order Status`** — a status enumeration is filterable but
  never printed. Combined with `Transaction Type` (b6), two unenumerated PO classifications remain.
- **`Inventory Type`** — a selection axis on five reports across two batches; never defined.
- **`Days Old`** vs **`Number of Days Past Due`** — two lateness measures, neither defined.
- **`Mar%`** on the special order report — margin against which cost basis? Batch 2 Finding 36 showed
  three are available.
- **`Active Locations List`** — named once; presumably the session list of batch 6 Finding 88.
- Whether `Open Order by Product` and `Search for a Sales Order by a Specific Product` are the same
  routine under two names — the article uses both.
- Whether the seven-day fill list retention is configurable.

**Inferences (not in section B)**
- `Active Locations List` is presumably the session-widened location list from batch 6; the two
  articles never connect, so this is mine.
- `Types to Include` presumably means purchase order types; not stated.
- The fill list is presumably how Logistics knows what to schedule; the article only says it is used
  for calling customers.

---

## I. Unknown unknowns

- **Reservation as an End-of-Day process producing a dated, expiring fill list.**
- **Two competing reservation mechanisms** — at receipt, or overnight — selected by one setting.
- **`ASAP` orders excluded from automatic allocation** and handed to a person on paper.
- **`CWC` and `ASAP` excluded from jeopardy reporting** — the least-protected order classes.
- **"Open" purchase orders meaning unpaid, not unreceived**, whenever accounting is active.
- **COM purchase orders having no receiving location**, with the column repurposed for the vendor.
- **Container-received goods invisible to allocation until the freight batch closes.**
- **Region xor Location** as a hard UI contract across every purchasing report.
- **Nine distinct End-of-Day merchandising behaviours**, several of them the sole source of a fact.
- **Reports printing their own run-time parameters.**
- **Report-only selection axes** — days past due, days old, zero-cost POs, dock-scheduled — describing
  states the entry screens never mention.
- **Held POs excluded from cash forecasting but included in replenishment supply.**
- **Returns and exchanges appearing as supply** on the open-order inquiry.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Fill list | Dated record of what End-of-Day reserved; retrievable for seven days |
| Online Receipts Reservations | Setting making receipts allocate to orders immediately rather than overnight |
| ASAP | Delivery status; excluded from automatic allocation and from jeopardy reporting |
| CWC | Delivery status beside ASAP; never expanded in the documentation |
| Open purchase order | With accounting active: not yet paid — **not** "not yet received" |
| COM purchase order | Customer's own material sent **to** the vendor; no receiving location |
| Mar% | Profit margin shown for special-order POs linked to sales orders |
| Days Past Due / Days Old | Two undefined lateness measures used as report filters |
| Inventory Type | Undefined selection axis on five reports |
| Active Locations List | Session-scoped list of locations a routine may reach |
| Jeopardy | Orders whose fill date will not be met |

---

## Contract adjudication — batch 7

| Contract | Verdict | Basis |
|---|---|---|
| **W-044** | **CONFIRMED, third independent statement** | "Open" means unpaid; closure needs the AP bill *and* End-of-Day (F97) |
| **W-055 / W-056** | **CONFIRMED in mechanism** | Reservation is an EOD process producing a fill list; availability is only as current as the last pass (F95, F103) |
| **W-012** | **relevant** | Reservation, replenishment and closure all resolve at End-of-Day, in an undocumented order (F101) |
| **W-050** | **consistent** | Every report carries the regional caveat; the batch-6 exceptions stand (F100) |
| **W-052 / W-053** | **not documented in this section** | — |

---

## Next — batch 8: ATP, inventory value, GMROI and the remaining inquiries
