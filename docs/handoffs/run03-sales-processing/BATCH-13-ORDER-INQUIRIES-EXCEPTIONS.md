# Run 03 — Sales Processing — Batch 13: Order Inquiries, Availability and Sales Exceptions

**Status: complete.** 7 articles. Findings 125–133.
First batch of the `Sales Views and Reports` subsection (139 articles; full inventory captured).

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **View and Manage Open Orders** *(VAMOO)* | /articles/15295156089748 | EXTRACTED — rich |
| 2 | **View and Manage Open Order Lines** *(VAMOOL)* | /articles/15295156090132 | EXTRACTED |
| 3 | **View Product Availability** | /articles/15295156878356 | EXTRACTED |
| 4 | **Report Sales Exceptions** | /articles/15203234860564 | EXTRACTED |
| 5 | Report Sales Tax Exceptions | /articles/15203235034516 | EXTRACTED |
| 6 | Report Open Sales Order Detail | /articles/15203012632212 | EXTRACTED |
| 7 | View Order Discounts | /articles/15295212934548 | EXTRACTED — thin |
| 8 | Transaction Detail Screen | /articles/15294751787796 | EXTRACTED — thin |
| — | Report Improperly Processed Orders | /articles/15203030606100 | **404 — ID re-derivation needed** |

Discovered and queued: `Phantom Process Settings` *(`Maximum Number of Concurrent Phantoms`)* ·
`Output Settings` · `Requested Date Calculation` · `View Current Financing Activity` ·
`Report Sales Tax` · `Avalara Tax Setup` · `Velocity Settings`.

---

## B. Wiring findings

### FINDING 125 — Sales data visibility has a three-way scope switch of its own
Invariant (verbatim, stated on both VAMOO and VAMOOL): "**If the `Sales Security Access` setting on the
            Advanced page of Point of Sale Control Settings is enabled (checked), user settings defined
            in the `View All Sales Information` setting in Create a User/Group Actions - Sales Security
            determine whether you can view your own sales data, only sales data for your login store, or
            access all sales data.**"
Evidence:   View and Manage Open Orders, /articles/15295156089748;
            View and Manage Open Order Lines, /articles/15295156090132
Maps to:    **W-050 — an eighteenth access-control mechanism**

> **Three scopes — own / store / all — gated behind a master switch.** Run 2 found `View All Sales
> Information` mentioned once in passing (run 2 F84's Regional Processing article); here it is
> operational, and it is **a fourth geography model** on top of Regional Processing districts, CRM
> districts (batch 12) and location restrictions.
>
> The `Sales Security Access` master switch is the part to note: **with it off, the per-user setting has
> no effect at all.** So a business can configure salesperson-level data scoping and have it silently
> inert. That is the same shape as batch 10's cash-balancing gate (F104) — a control that does not exist
> until a second setting turns it on.

### FINDING 126 — VAMOO and VAMOOL are two different queries over deliberately different populations
**VAMOO** — "open orders **and transfers**… **While layaways and quotes are included in search results,
            service orders are excluded from all filters on this screen.**"
**VAMOOL** — "open orders that have merchandise **in jeopardy of missing the delivery date**. **This
            process queries only sales orders, the sales portion of exchanges, and layaways.**…
            **Returns, transfers, and quotes are not queried.**" · "**Hard kit masters and intangible
            items are not included in the search results.**"
Manage permissions (verbatim): **`View and Manage Open Orders - Maintain Exchanges` · `- Maintain
            Returns` · `- Maintain Sales Orders` · `- Maintain Transfers`** *(VAMOOL uses only the
            Exchanges and Sales Orders pair)*.
Evidence:   both articles
Maps to:    **NEW**

> Two screens with confusingly similar names covering **overlapping but non-identical document sets**:
> VAMOO includes transfers, returns and quotes; VAMOOL excludes them and adds a jeopardy focus. Neither
> covers service orders.
>
> **Managing is permissioned per document type** — four separate settings — so a user can be allowed to
> maintain sales orders but not returns from the same screen. That is finer-grained than anything in
> run 1 or 2, and it is the fifth place the audit has found document-type-specific permissions.

### FINDING 127 — ASAP and CWC orders are invisible to date-filtered searches, and the docs say so
Invariant (verbatim): "**Orders with a fulfillment status of 'As Soon As Possible' and/or 'Customers
            Will Call' do not have a fulfillment date unless the fulfillment method is a Direct
            Ship.**"
Invariant (verbatim): "**When the fulfillment status is 'As Soon as Possible' and/or 'Customer Will
            Call' and you enter a Start Date for the Fulfillment Dates prompts, then ASAP and CWC orders
            are not [to] be included, due to not having a fulfillment date, in VAMOO, VAMOOL or Open
            Fulfillments.**"
Evidence:   View and Manage Open Orders, /articles/15295156089748
Maps to:    **confirms batch 1 Finding 4; W-055 / W-056**

> **The fifth documented exclusion of ASAP and CWC**, and the most explicit. Batch 1 established they
> are unscheduled by construction; run 2 found them excluded from jeopardy reporting, automatic
> allocation and the weekly projection; **now they vanish from the two main open-order management
> screens whenever a date filter is applied.**
>
> The exception is the interesting part: **direct-ship ASAP and CWC orders *do* have a fulfillment
> date**, because the vendor's PO delivery date supplies one. So the same status behaves differently by
> fulfillment method.
>
> Operationally this is the most consequential ASAP/CWC finding yet: **a manager filtering open orders
> by date will not see them at all.** Anything we build should surface them explicitly rather than
> letting a date filter hide the most urgent orders in the book.

### FINDING 128 — VAMOO runs as a scheduled process with a rolling window and extra output columns
Scheduled mode (verbatim): "**the date selections… are changed to `Past Days` and `Future Days`.**…
            if the process is run on 01/22/21 with Past Days set to 5 and Future Days set to 10, the
            process selects fulfillments scheduled from **01/17/21 to 02/01/21**. **If both Past Days
            and Future Days are set to 0 or are empty (null), fulfillments for the current date are
            selected.**"
Differences: "The `Search` button is available for the on-demand process but **inactive when run as a
            scheduled process**… **the grid is visible in the on-demand process and hidden in the
            scheduled process**." · "`Fulfillment Method` and `Fulfillment Status` are **required**. All…
            **default to being checked.**"
Extra columns (verbatim, scheduled output only): "**Fulfillment Location, Total Fulfillments, Order
            Fully Reserved, Fulfillment Unscheduled Lines, Unscheduled with ATP date, Fulfillment
            Delivery Charge, Fulfillment Total, Stock Location, and Merchandise Total.**"
Output:     **NFS** or **Report Archive** *(default)*, via `Output Settings`.
Concurrency (verbatim): "To run multiple scheduled instances… ensure the **`Maximum Number of Concurrent
            Phantoms`** setting in `Phantom Process Settings` is set appropriately. **Please note that
            setting this field too high may tax system resources.**"
Performance warning: "**A user may expect variations in performance based on use of ATP, number and
            types of orders retrieved, and client server configuration.**"
Evidence:   View and Manage Open Orders, /articles/15295156089748
Maps to:    **NEW**

> **The scheduled version returns nine columns the interactive one cannot show**, including
> `Order Fully Reserved` and `Unscheduled with ATP date`. So the richest view of the open order book is
> available only as a scheduled export — a genuinely odd asymmetry, and worth knowing before anyone
> concludes the data is not there.
>
> **`Past Days` / `Future Days` as a rolling window** is the right pattern for a recurring report, and
> the null-means-today default is sensible. The **phantom-process concurrency warning** is the first
> explicit performance caveat in three runs, and it names the setting that governs it.

### FINDING 129 — Availability display is itself configurable, with a documented tab swap when ATP is off
Invariant (verbatim): "**If you are not using ATP calculations, you can use `Dynamic Tab Settings` to
            select an alternate `Locations` tab that does not display ATP information. Once you select
            the inquiry screen in Dynamic Tab Settings, you can remove the default tab `IC.204.TAB` and
            replace it with `IC.207.TAB Stock Availability Inquiry`… This tab does not display the
            Available to Promise information… and does not include grid columns for ATP Date and ATP
            Quantity.**"
Quantities: **`On Hand` · `Net Available` · `Net PO` · `As-Is` · `As-Is Available` · `Total PO` ·
            `Vendor Quantity on Hand`** · ATP block: **`Desired Quantity` · `ATP Date` · `ATP
            Quantity`**
Also:       Selling Price · Suggested Retail Price · **`Purchase Status`** · **`Product Status`** ·
            "**For products with a check at the `Kit Component` field… `Kit Component Only` displays in
            the header.**"
Evidence:   View Product Availability, /articles/15295156878356
Maps to:    **W-055 / W-056 — extended; confirms run 2's DTS finding**

> **Named tab IDs (`IC.204.TAB`, `IC.207.TAB`)** appear here for the first time in the audit — the
> internal identifiers behind Dynamic Tab Settings. Run 2 established that documented screens are
> shipped defaults; this is the mechanism, and it means **the availability screen a salesperson actually
> sees is a configuration record we can extract by ID.**
>
> **`Vendor Quantity on Hand`** is new and significant: the screen shows **the vendor's stock**, not just
> ours — presumably from the ATP/Ashley integration (run 2 F107). And `As-Is` and `As-Is Available` are
> distinguished, adding a ninth and tenth quantity concept to the availability picture.
>
> `Purchase Status` and `Product Status` appear side by side, confirming run 2's finding that a product
> carries multiple independent status attributes.

### FINDING 130 — Sales exceptions are recorded on every access, and never un-recorded
Invariant (verbatim): "**Note that each time you access a line with an exception, the system records the
            exception. Thus, if you re-access a line with an exception, the system records that
            exception, too.**"
Invariant (verbatim): "**Modifications to orders or line items that cancel their exception status do not
            cancel reporting of the original exception.**"
Invariant:  "The system tracks exceptions based on settings in the **Point of Sale Control Settings**
            file." · "These reports display information generated from exceptions that occur during
            **Sales and/or Service Order Entry**."
Fields:     `Report Type` · **`Exception Report`** *(many types)* · District · Store.
Evidence:   Report Sales Exceptions, /articles/15203234860564
Maps to:    **NEW — and it is a data-quality warning**

> Two behaviours that together make this report unreliable as a count. **Re-opening a line re-records
> its exception**, so the same underlying event can appear many times depending on how often someone
> looked at it. And **fixing the problem does not retract the original exception**, which is correct for
> an audit trail but wrong for a workload measure.
>
> So `Report Sales Exceptions` answers "what unusual things were attempted" — not "how many problems
> exist". Batch 2 Finding 19 routed trade-discount overrides here; batch 1 Finding 13 routed
> special-order price variances here. **This is the section's exception sink, and it double-counts by
> design.** Anyone using it for management reporting needs to know that.

### FINDING 131 — Sales tax reporting splits by whether an Alternate Tax Interface is in use
Invariant (verbatim): "**Use this report with the Alternate Tax Interface to report sales tax exceptions.
            If not using the Alternate Tax Interface, use the `Report Sales Tax` routine to report on
            sales tax.**"
Fields:     Date Code · Start/End Date · **`Company Number`** · **`Tax Exempt Sales Only`** ·
            **`Summary Page Only`** · **`Tax Jurisdictions`** *(one, several or all)*.
Cross-ref:  `Report Sales Tax` carries the **`NT Rsn` (No Tax Reason)** column *(batch 9 F86)*.
Evidence:   Report Sales Tax Exceptions, /articles/15203235034516
Maps to:    **W-052 / W-053 relevant; extends batch 1 Finding 5**

> **Two mutually exclusive tax reports**, chosen by whether ATI is active. Combined with batch 1's
> findings — ATI removes line-level exemption and subtotal discounts — **turning on Avalara or Vertex
> changes the sales floor's capabilities *and* the tax reporting path.**
>
> `Tax Jurisdictions` as a multi-select confirms batch 1 Finding 5's three-zip-code stacking: a single
> order can carry tax from several jurisdictions, and the report is built to slice by them. `Company
> Number` appears for the first time in this run and ties to run 1's GL account structure
> (company · root · sub-account · cost centre).

### FINDING 132 — Multiple delivery dates explode a line across report rows
Invariant (verbatim): "**If using multiple fulfillments and those dates are present for an item in the
            report, all scheduled and unscheduled delivery dates appear on separate lines.**"
Search caveat (verbatim, VAMOO): "**When searching for orders using a single date or date range, only
            the first date (Next Delivery Date) is considered. If an order has multiple delivery dates,
            the search returns the order only if the order's Next Delivery Date falls within the
            specified date(s).**"
Evidence:   Report Open Sales Order Detail, /articles/15203012632212;
            View and Manage Open Orders, /articles/15295156089748
Maps to:    **NEW — and the two behaviours conflict operationally**

> **Reports explode multi-date lines; searches collapse them to the first date.** So a line with
> deliveries in March and June shows twice on the detail report but is findable only by its March date
> in VAMOO — the June delivery is unreachable by date search.
>
> Batch 3 Finding 27 found the quantity-reallocation rules for multi-date lines; this is their reporting
> consequence. For a business using multiple concurrent fulfillments heavily, **the later legs of an
> order are effectively invisible to date-driven management**, which is exactly when they most need
> attention.

### FINDING 133 — A discount ledger exists per order, and financing carries a dispute status
**View Order Discounts** (verbatim): "view **a ledger of how all sales line discounts have been applied
            to the order.**" — Order · Date · Type · Store · **`Original Selling Price` · `Discount
            Total` · `Net Selling Price`** · grid.
**Transaction Detail Screen** — from `View Current Financing Activity`: Reference · Customer Code ·
            Customer Name · **`Authorization Number`** · **`Dispute status`** · **`Due Date`** ·
            **`Amount Due`**; grid of **`Activity Type` · `Date` · `Amount` · `Memo Reference`**.
Evidence:   View Order Discounts, /articles/15295212934548;
            Transaction Detail Screen, /articles/15294751787796
Maps to:    **W-061 — partially answers a batch-2 question**

> Batch 2 Finding 15 flagged that **nothing on an order line records which pricing-hierarchy level
> supplied the price**. `View Order Discounts` is the nearest thing: a per-order ledger of applied
> discounts with original and net selling price. **It shows what was taken off, not where the starting
> price came from** — so the gap remains, but the discount half is traceable.
>
> This also partially mitigates batch 2 Finding 7's warning that out-the-door pricing destroys discount
> attribution: the ledger records what *was* applied before the codes were stripped, if it is written at
> the time. Whether it survives an `Adjust the Net Total` is not stated.
>
> **`Dispute status`** on financing transactions is new — a consumer-credit dispute flag that run 1's
> receivables work did not surface from this angle.

---

## C. Screen and field inventory

**View and Manage Open Orders (VAMOO)** — `Order Type` *(Orders / Transfers)*.
*Orders*: District · Selling Location · Ship From Location · Route Code · **`Backorder Status`** ·
Salesperson · **`Contact Status`** · **`Calculate ATP Dates`** · *(Order Dates)* Date Type · Start ·
End · `Fulfillment Method` · `Fulfillment Status` · *(Fulfillment Dates)* Date Type · Start · End ·
Search · grid.
*Transfers*: Transfer From Location · Transfer To Location · Route Code · Backorder Status ·
*(Delivery Dates)* · *(Transfer Dates)* · Calculate ATP Dates · Search · grid.
*Scheduled mode*: **`Past Days` · `Future Days`**; output **NFS** or **Report Archive**; nine extra
columns (Finding 128).

**View and Manage Open Order Lines (VAMOOL)** — District · Fulfillment Location · Selling Location ·
Stock Location · Salesperson · Contact Status · Fulfillment Method · Fulfillment Status ·
Order Dates · Fulfillment Dates · **`ATP Days Early(-)/Late`** · **`Show all lines of Fulfillment`** ·
**`Include Intangibles`** · Product · Group · Category · Vendor · **`Inventory Formation`** ·
**`Fully Reserved`** · **`Unscheduled Lines Only`** · grid.

**View Product Availability** — pages **Locations · General Info**. Product · Vendor · Brand ·
Vendor Model · *(ATP)* **`Desired Quantity` · `ATP Date` · `ATP Quantity`** · *(Inventory Quantities)*
**On Hand · Net Available · Net PO · As-Is · As-Is Available · Total PO · Vendor Quantity on Hand** ·
*(Merchandising)* Selling Price · Suggested Retail Price · **Purchase Status · Product Status** · grid.
Header shows **`Kit Component Only`** for kit-component products. Default tab **`IC.204.TAB`**;
alternate **`IC.207.TAB Stock Availability Inquiry`**.

**Report Sales Exceptions** — `Report Type` · **`Exception Report`** · District · Store ·
Send Output to · Export Path.

**Report Sales Tax Exceptions** — Date Code · Start/End Date · **Company Number** ·
**Tax Exempt Sales Only** · **Summary Page Only** · **Tax Jurisdictions** · Send Output to · Export Path.

**Report Open Sales Order Detail** — District · Stock Location · Sort By · Product · Brand · Vendor ·
Category · Group · **`Order Source`** · **`Delivery Status`** · **`Back Orders Only`** ·
**`Include Order Types`** · **`Line Type`** · Send Output to · Export Path.

**View Order Discounts** — Order · Date · Type · Store · **Original Selling Price · Discount Total ·
Net Selling Price** · grid.

**Transaction Detail Screen** — Reference · Customer Code · Customer Name · Authorization Number ·
**Dispute status** · Due Date · Amount Due; grid: Activity Type · Date · Amount · **Memo Reference**.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`Sales Security Access`** | POS Control Settings → Advanced | **Master switch enabling `View All Sales Information`** |
| **`View All Sales Information`** | Sales Security | Own data / login store / all sales data |
| `View and Manage Open Orders - Maintain Exchanges / Returns / Sales Orders / Transfers` | Sales Security | Per-document-type management rights |
| **`Maximum Number of Concurrent Phantoms`** | **Phantom Process Settings** | Concurrent scheduled instances; **overuse taxes the system** |
| `Output Settings` | (scheduled process) | NFS vs Report Archive |
| Dynamic Tab Settings — `IC.204.TAB` / `IC.207.TAB` | DTS | **Whether the availability screen shows ATP at all** |
| exception tracking | POS Control Settings | Which sales exceptions are recorded |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| **`View All Sales Information`** *(three scopes)* | Sales Security | Sales data visibility — **inert unless `Sales Security Access` is on** |
| `View and Manage Open Orders - Maintain Exchanges` | Sales Security | Managing exchanges from VAMOO/VAMOOL |
| `- Maintain Returns` | Sales Security | Managing returns from VAMOO |
| `- Maintain Sales Orders` | Sales Security | Managing sales orders |
| `- Maintain Transfers` | Sales Security | Managing transfers from VAMOO |

---

## F. State machines and enumerations

**VAMOO population** — sales orders · exchanges · returns · **layaways · quotes · transfers**;
**service orders excluded**.
**VAMOOL population** — sales orders · sales portion of exchanges · layaways only; **returns,
transfers, quotes, hard kit masters and intangibles excluded**.
**ASAP / CWC visibility** — **no fulfillment date**, therefore excluded from date-filtered searches in
VAMOO, VAMOOL and Open Fulfillments — **unless the fulfillment method is Direct Ship**.
**Availability quantities (10)** — On Hand · Net Available · Net PO · As-Is · **As-Is Available** ·
Total PO · **Vendor Quantity on Hand** · ATP Date · ATP Quantity · Desired Quantity.
**Scheduled-only output columns (9)** — Fulfillment Location · Total Fulfillments ·
**Order Fully Reserved** · Fulfillment Unscheduled Lines · **Unscheduled with ATP date** ·
Fulfillment Delivery Charge · Fulfillment Total · Stock Location · Merchandise Total.
**Tax reporting paths (2)** — `Report Sales Tax` *(standard)* · `Report Sales Tax Exceptions` *(ATI)*.
**Exception sinks in the audit (7)** — cost exceptions · landed add-on distribution · special-order
price variance · trade discount exceptions · external card resolution failures · settlement errors ·
**sales exceptions**.

---

## G. Sequencing rules

1. `View All Sales Information` has no effect unless `Sales Security Access` is enabled.
2. Date-filtered searches exclude ASAP and CWC orders except on direct ship.
3. VAMOO date searches consider only the **Next Delivery Date** of a multi-date order.
4. Reports explode multi-date lines onto separate rows.
5. Accessing a line with an exception records the exception again.
6. Correcting an exception does not retract the original record.
7. Scheduled VAMOO uses a `Past Days` / `Future Days` rolling window; both null means today.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Report Improperly Processed Orders`** — the article ID from the section index returns 404; the name
  suggests a data-integrity report worth having. Needs re-derivation.
- `Phantom Process Settings` · `Output Settings` · `Requested Date Calculation` ·
  `View Current Financing Activity` · `Report Sales Tax`.

**Documented but ambiguous**
- **The `Exception Report` enumeration** — "many different exception types" with none listed. This is
  the destination for at least two exception types found earlier in the run.
- **`Backorder Status`** and **`Contact Status`** as VAMOO filters — neither enumerated.
- **`Vendor Quantity on Hand`** — where it comes from, and how current it is.
- **`As-Is` vs `As-Is Available`** — the distinction is not stated.
- **`Product Status`** vs `Purchase Status` — two status attributes shown together, only one of which
  the audit has partially enumerated.
- **`Dispute status`** on financing transactions — values not given, and no dispute workflow found.
- **Whether `View Order Discounts` survives `Adjust the Net Total`**, which strips discount codes.
- **`Include Intangibles`** and **`Show all lines of Fulfillment`** — behaviour unstated.
- **NFS** as an output destination — an acronym used without expansion.

**Inferences (not in section B)**
- `Vendor Quantity on Hand` is presumably supplied by the ATP web service integration (run 2 F107); the
  article does not say.
- `NFS` is plausibly a network file share destination; not expanded anywhere.
- The `Exception Report` types presumably include the price-variance and trade-discount exceptions found
  in batches 1 and 2, since both articles name this report as their destination; not confirmed.

---

## I. Unknown unknowns

- **A three-scope sales-data visibility model** gated behind a separate master switch.
- **Per-document-type management permissions** on one screen.
- **ASAP and CWC vanishing from date-filtered open-order searches** — with a direct-ship exception.
- **Nine extra columns available only in the scheduled export.**
- **A rolling `Past Days` / `Future Days` window** for scheduled runs.
- **Named DTS tab IDs** (`IC.204.TAB`, `IC.207.TAB`) with a documented swap to remove ATP.
- **`Vendor Quantity on Hand`** displayed alongside our own stock.
- **Exceptions re-recorded on every access, and never retracted when fixed.**
- **Two mutually exclusive tax reports**, chosen by ATI.
- **Reports exploding multi-date lines while searches collapse them to the first date.**
- **A per-order discount ledger.**
- **A dispute status on financing transactions.**
- **A documented performance caveat** and a concurrency setting for scheduled processes.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| VAMOO / VAMOOL | View and Manage Open Orders / Open Order Lines; different document populations |
| Sales Security Access | Master switch enabling per-user sales data scoping |
| View All Sales Information | Three-scope setting: own, login store, or all |
| Past Days / Future Days | Rolling window for scheduled VAMOO runs |
| IC.204.TAB / IC.207.TAB | DTS tab IDs for the availability screen, with and without ATP |
| Vendor Quantity on Hand | The vendor's stock, shown on the availability inquiry |
| As-Is Available | Distinguished from As-Is; difference unstated |
| Dispute status | Flag on a financing transaction; values undocumented |
| NFS | Scheduled-process output destination; not expanded |
| Exception Report | Selector for sales exception types; enumeration not published |

---

## Contract adjudication — batch 13

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** | **CONFIRMED inverted, eighteenth mechanism** | Three-scope sales visibility behind a master switch; four per-document management permissions (F125, F126) |
| **W-055 / W-056** | **CONFIRMED, extended** | Ten availability quantities including vendor stock; ASAP/CWC excluded from date searches (F127, F129) |
| **W-012** | **relevant** | Multi-date lines explode in reports but collapse to Next Delivery Date in searches (F132) |
| **W-061** | **partially answered** | A per-order discount ledger exists; price provenance still absent (F133) |
| **W-052 / W-053** | **relevant** | Two tax reporting paths split by ATI (F131) |

---

## Next — batch 14: customer, receivables and financing inquiries
