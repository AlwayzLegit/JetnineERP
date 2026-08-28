# Run 02 — Merchandising — Batch 5: Merchandising Decisions, Buying Analysis and Shared Objects

**Status: complete.** 12 articles. Findings 71–82.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | Process Merchandising Decisions | /articles/15202193119892 | EXTRACTED |
| 2 | Select Products for Merchandising Decisions Screen | /articles/15202192348052 | EXTRACTED |
| 3 | **Single Product Review** | /articles/15202192363412 | EXTRACTED |
| 4 | **Product Performance and Purchase Recommendations** | /articles/15203112479636 | EXTRACTED |
| 5 | **Product Performance and Purchase Recommendations Sample** | /articles/15203112357780 | EXTRACTED — very rich |
| 6 | Product Selection Screen | /articles/15203127954964 | EXTRACTED |
| 7 | Additional Product Quantities | /articles/15202207760020 | EXTRACTED — thin |
| 8 | Place Additional Items on Purchase Order Screen | /articles/15202208173204 | EXTRACTED — thin |
| 9 | **Review Extended Information Window** | /articles/15202208337812 | EXTRACTED |
| 10 | **Selling Location** | /articles/15202192346772 | EXTRACTED |
| 11 | Model Number Patterns Format | /articles/15202208582804 | EXTRACTED |
| 12 | Model Number Pattern Entry Screen | /articles/15202208578964 | EXTRACTED — **gated** |
| 13 | **Program List Creation** | /articles/15202207759636 | EXTRACTED — resolves a batch-4 ambiguity |

Discovered and queued: `Report Merchandising Activity` · `Report Builder` ·
`District and Regional Product Settings` · `Create a User` → **Location Restrictions tab** ·
`Logistical Scheduling` · `Purchase Order Cost Display Screen` · `Automatic Stock Replenishment for
Locations` · `Advanced Vendor Category and Group Exception Settings — Landed Cost Add-Ons` ·
`View Warehouse/Store Settings`.

---

## B. Wiring findings

### FINDING 71 — Merchandising Decisions is a four-step wizard that writes prices, transfers and purchase orders in one save
Sequence (verbatim step labels): **`Process Merchandising Decisions`** ("the **first step** in a series
            of routines") → **`Select Products for Merchandising Decisions`** ("the **second step**") →
            **`Single Product Review`** ("the **third step**") → save.
Invariant:  "When you have finished editing products, **click on `Save` to update the Product file and
            create the transfers and purchase orders (if any) you specified on the other tabs** of this
            routine. **To abandon your changes, click on `Exit`.**"
Tabs:       **Product** *(pricing and status)* · **Transfer** · **Purchase**
Invariant:  "**The edits you make here update only the `Advanced Product Settings` and not the
            `District and Regional Product Settings`.**"
Consolidation rule: "**transfers for multiple products with the same 'from' and 'to' locations and
            transfer date are consolidated into a single transfer.** Otherwise, a separate transfer is
            created for each product."
Handoff:    "After you click Save to process the transfer requests and have exited the routine, you
            then use the routines on the **transfer menus, such as `Logistical Scheduling`**, to
            process the transfers."
Evidence:   Process Merchandising Decisions, /articles/15202193119892;
            Select Products for Merchandising Decisions Screen, /articles/15202192348052;
            Single Product Review, /articles/15202192363412
Maps to:    **NEW — the largest single write in the section**

> One `Save` writes **selling prices, purchase status, replacement cost, shipping weight and volume to
> the product master; creates inventory transfers; and creates purchase orders** — across three
> modules, for a whole list of products, with `Exit` as the only undo. Three things follow. The
> **transfer consolidation keys** are from-location, to-location and date — matching batch 3's PO
> grouping keys in spirit but not in content. The **regional exclusion is a documented trap**: a buyer
> repricing here changes the base product record and leaves every regional override untouched, so the
> prices actually charged in those regions do not move. And the routine **hands off to Logistics** —
> the transfers it creates are not scheduled, merely requested.

### FINDING 72 — `Single Product Review` can create purchase orders with hand-entered costs, bypassing every cost hierarchy
Purchase tab fields (verbatim): `Vendor` · **`Alternate Ship From`** · `Buyer ID` · `Receiving At` ·
            `Delivery Date` · `Order Quantity` · **`Unit Cost` · `Discounted Cost` · `Extended Cost`** ·
            `Ship Weight` · `Ship Volume` · `Next PO`
Product tab writable fields: `Purchase Status` · `Selling Price` · `Suggested Retail Price` ·
            `Kit Selling Price` · **`Replacement Cost`** · `Markdown Price` · `Shipping Weight` ·
            `Shipping Volume`
Downstream: requests flow to `Assign Products to Purchase Orders` (batch 3 Finding 58), grouped on
            vendor · vendor ship-from · receiving location · delivery date.
Evidence:   Single Product Review, /articles/15202192363412
Maps to:    **NEW — and it is the third screen that can write replacement cost**

> Batch 1 Finding 9 found the PO processing screen writing replacement cost; batch 2 Finding 37 found
> the same write cascading into average cost for foreign vendors from three named routines, one of
> which is `Product Performance and Purchase Recommendations`. **This is a fourth writer**, and it
> sits inside a bulk merchandising wizard. So the product master's cost can be moved from at least
> four screens, three of which a buyer uses routinely. Note also that `Alternate Ship From` here
> silently selects a landed freight factor (batch 2's hierarchy levels 1–4, batch 4 Finding 66), and
> `Unit Cost` is typed directly — **no article says whether the landed hierarchy is applied on top of
> a hand-entered cost or ignored.**

### FINDING 73 — The buyer's worksheet projects thirteen weeks forward and carries its own warning thresholds
Tabs (verbatim): **General · Actual Sales · Sales History · Inventory · Purchasing · Forecast Sales**
**Actual Sales** — "actual total inventory available, based on current net available, back-ordered
            sales, and incoming purchase orders **for 13 weeks in the future**":
            `Week Ending` · **`Net Available` · `- Back Ordered` · `+ P/O` · `= Total`**
**Forecast Sales** — "forecasted information for **13 weeks in the future**, based on the sales rate.
            It also provides **order warning and/or excess warning** based on the options selected":
            `Weeks Supply` · `Sales Rate` · `Based On Calculated Sales` · `Week Ending` ·
            **`Net Available` · `- Est Sales` · `+ P/O` · `= Est Net`** · **`Warning`**
Thresholds: `Order Warning Weeks` · `Excess Warning Weeks` · `Report Product Warnings`
            *(Selection Criteria tab)*
Formula parameters: `Previous or Next Weeks` · **`Variance Percent`** · `Days of Written Business` ·
            **`Written or Delivered Sales Data`**
Purchasing tab: `Lead Weeks` · `Minimum Stock Weeks` · **`Excess Stock Weeks`** ·
            `Total Purchase Orders` · `Net Purchase Orders`
Invariant:  "**This routine bases all quantity-on-hand data on saleable inventory.**"
Evidence:   Product Performance and Purchase Recommendations, /articles/15203112479636;
            Product Performance and Purchase Recommendations Sample, /articles/15203112357780
Maps to:    **W-055 / W-056 — relevant; and a fifth availability formula**

> Two projections, both thirteen weeks, both starting from `Net Available` and adding purchase orders —
> one deducting **back-ordered sales** (actual), one deducting **estimated sales** (forecast). Neither
> matches batch 3's `Units Available` or `Net Demand`, and both restrict to **saleable** inventory,
> which is a sixth qualifier. Note that `Variance Percent` and `Written or Delivered Sales Data`
> appear here as **run-time report parameters**, whereas in replenishment (batch 3 Finding 49) the same
> two concepts are **vendor and company settings**. So the buyer's analysis can be run on a different
> basis from the one that actually generates the purchase orders — the numbers a buyer looks at need
> not be the numbers the system will act on. That is a real operational hazard, not a documentation
> quibble.

### FINDING 74 — Gross profit is reported three ways against two cost bases, simultaneously
Invariant (General tab, verbatim): `Suggested Retail` · `Selling Price` · `Sale Price` · `Average Cost`
            · `Replacement Cost` · **`Freight Factor`** —
            "**`Suggested Retail` - Gross Profit Percentages Based On: `Replacement Cost` / `Average
            Cost`**"; "**`Selling Price` - Gross Profit Percentages Based On: `Replacement Cost` /
            `Average Cost`**"; "**`Sale Price` - Gross Profit Percentages Based On: `Replacement Cost`
            / `Average Cost`**"
Also:       `Written Business (Last NNN Days)` · `Inventory Turns` ·
            **`Landed Add-On Approximations` — `Cost 1`, `Cost 2`**
Evidence:   Product Performance and Purchase Recommendations Sample, /articles/15203112357780
Maps to:    **W-061 — CONFIRMED, extended again**

> **Six gross profit percentages on one screen** — three price points × two cost bases — displayed
> together with no indication which is authoritative. Batch 2 Finding 36 found the costing method is
> chosen separately for cost of sales, commissions and returns; this screen shows the consequence in
> the buyer's face. And **`Landed Add-On Approximations: Cost 1, Cost 2`** is notable: only two of the
> four add-on slots appear, they are labelled generically rather than with the company labels batch 2
> Finding 35 said propagate everywhere, and the word is **approximations** — consistent with batch 2
> Finding 40's conclusion that landed add-ons are estimated and never trued up.

### FINDING 75 — `CWC` finally surfaces as a first-class order class, counted beside ASAP, As-Is and Layaway
Invariant (Sales History tab, verbatim): "order counts for **`ASAP`, `CWC`, `As Is`, and `Layaways`**" —
            fields: **`ASAP Orders` · `CWC Orders` · `As Is Orders` · `Layaway/Quote Orders`**
Also on the tab: `GMROI` · `Gross Margin` · `Gross Margin (12 Periods)` · `Gross Margin (4 Periods)` ·
            `Sales Per Period` · `Current Period Units` · `Last 4 Periods Average` ·
            **`Last Yr Next 4 Periods Average`** · `Last 12 Periods Average (per Period)`
Evidence:   Product Performance and Purchase Recommendations Sample, /articles/15203112357780
Maps to:    **partially closes a batch-1 gap**

> `CWC` has appeared in three batches — in the `NET AVAIL` unreserved-quantity definition (batch 1
> Finding 17), implicitly in replenishment, and now as a **counted order class with its own column**.
> It is still never expanded, but its role is now clear: **it is an order type, alongside ASAP,
> As-Is and Layaway/Quote, and it is one of the classes that makes a sales order "not fully
> reserved".** Note `Layaway/Quote` collapses two things into one counter, and
> **`Last Yr Next 4 Periods Average`** is a genuine seasonality input — the same four periods a year
> ago — which no replenishment formula in batch 3 uses.

### FINDING 76 — Turns and GMROI distinguish "no history" from "no sales", and the distinction is visible
Invariant:  "**If the selected product has no product history at the selected location, the `Inventory
            Turns` and `GMROI` fields display as null (that is, blank). If products have been received
            at the location but no sales have been made, the fields display as `0.00`.**"
Header aggregates: `Gross Margin (12 Periods)` · `Gross Margin (4 Periods)` · `Inventory Turns` ·
            `GMROI` — "display **combined numbers for all products currently in the grid**".
Evidence:   Product Selection Screen, /articles/15203127954964
Maps to:    **NEW — small but worth keeping**

> **Null and zero mean different things here and the docs say so explicitly** — never stocked versus
> stocked and unsold. That is a deliberate three-valued design in a KPI, and it is exactly the sort of
> semantic that a naive migration flattens to zero, quietly turning "we have never carried this" into
> "this does not sell". Also note the header aggregates recompute over the **current grid**, so the
> same product contributes to different headline numbers depending on the filter.

### FINDING 77 — Import purchase orders carry a whole extra document set, keyed off the vendor's country
Invariant:  "**NOTE: If the purchase order is an import purchase order (that is, if the vendor (or the
            vendor ship-from address, if present) has a `Country` code other than `Domestic`), the
            system records the most current revision of each document in the purchase order header
            record in the appropriate field.**"
Fields:     **`Broker` · `FOB` · `Do Not Ship Before Date` · `Do Not Ship After Date` ·
            `Order Description` · `Shipping Terms`**
Invariant:  "Extended information is available for use by the **`Report Builder`**."
Evidence:   Review Extended Information Window, /articles/15202208337812
Maps to:    **NEW — the import dimension, sixth appearance**

> Import status is determined by **the ship-from address's country when present, otherwise the
> vendor's** — the first article to state the precedence, and it matters because batch 4 Finding 66
> showed ship-from can be chosen per product or per operator. **So which product on a purchase order
> you are looking at can change whether the order is an import.** The document-revision behaviour
> ("records the most current revision of each document in the purchase order header") implies
> versioned import documents exist somewhere, but **no article read so far describes them**. The
> import thread now runs through: automatic hold (b1 F12), addendum printing (b1 F26), foreign landed
> replacement cost (b2 F36), the exchange-rate average-cost cascade (b2 F37), currency inquiry
> (b4 F67), and this.

### FINDING 78 — Outbound EDI uses 850 and 860, and the buyer store is the PO's selling location
Invariant:  "Use this routine to indicate the **selling location** for the EDI purchase order. **When
            generating EDI `850` and `860` documents from a purchase order, the `EDI Buyer Store` field
            is set to the purchase order's `Selling Location`.**"
Evidence:   Selling Location, /articles/15202192346772
Maps to:    **completes batch 4 Finding 59's transaction-set enumeration**

> Batch 4 documented seven **inbound** transaction sets. These are the two **outbound** ones: `850`
> purchase order and `860` purchase order change. Two consequences. The vendor is told **which store
> the order is for via `Selling Location`, not the receiving location** — two different location
> fields on the same order serving different purposes, and only one reaches the vendor. And the
> existence of an outbound `860` means STORIS *can* transmit a change to a purchase order — which sits
> awkwardly beside batch 3 Finding 50's rule that a quantity increase after transmission requires a
> brand-new purchase order. **No article read so far explains when an `860` is sent rather than a new
> `850`.**

### FINDING 79 — EDI vendors validate model numbers against a pattern language, and only STORIS can edit the patterns
Pattern grammar (verbatim, complete):
            **`9's`** = numeric · **`A`** = alpha · **`X`** = "if not null, **must be alpha**" ·
            **`0` (zero)** = "if not null, **must be numeric**" · **`"x"`** = "characters in quotes
            interpreted **literally**"
Worked example (verbatim): "A pattern of **`A999"-"9990`** defines the model number as follows: 1st
            character must be alpha, 2nd through 4th characters must be numeric, 5th character must be
            a dash (-), 6th through 8th must be numeric, and **the 9th must be either null or
            numeric**."
Gate:       "**Access to this screen is restricted to STORIS personnel only.** For more information,
            contact STORIS."
Evidence:   Model Number Patterns Format, /articles/15202208582804;
            Model Number Pattern Entry Screen, /articles/15202208578964
Maps to:    **NEW — and the second explicitly operator-gated screen in the run**

> A small domain-specific validation language for vendor model numbers, per EDI vendor, **that the
> operator cannot change.** `A` and `X` differ only in null-tolerance, as do `9` and `0` — so the
> grammar distinguishes required from optional positionally. For a rebuild this is a real migration
> item: **the patterns are configuration we do not control and may not be able to export**, and they
> govern whether a model number is accepted onto an EDI purchase order at all. Batch 1 found
> "many system control settings are accessible by STORIS personnel only" as a general warning; this is
> the first named screen behind that wall.

### FINDING 80 — `Program List Creation` is one generic list facility serving purchasing, logistics and accounting
Invariant:  "Use this screen to create and maintain lists you use frequently, for example lists of
            **distributed purchase orders, transfers, or general ledger accounts**."
Field:      **`List Type`** · `List` · `Description`
Invariant:  "**If locations are added or removed from a Region and/or District after a `General
            Location List` has been created, those locations are not included in the General Location
            List and the list must be rebuilt.**"
Read-only:  "The read-only version of this screen appears when accessed through a view-only version of
            the routine, such as `View Warehouse/Store Settings`."
Evidence:   Program List Creation, /articles/15202207759636
Maps to:    **resolves the batch-4 Finding 65 ambiguity**

> Batch 4 flagged three names — `Program List Creation`, `Store List Entry`, `Receiving At` /
> `Receiving Location`. This settles it: **`Program List Creation` is the general facility, typed by
> `List Type`, and `Store List Entry` is one entry point into it.** The important finding is the
> staleness rule: **a General Location List does not track region or district membership changes and
> must be rebuilt by hand.** So reorganising stores silently leaves distribution lists — and GL
> account lists — pointing at the old world, with no warning and no report. That is a cross-module
> data-integrity hazard reaching into Accounting, found in a Merchandising utility screen.

### FINDING 81 — Location visibility is restricted per user, and it silently narrows merchandising output
Invariant (repeated verbatim on three screens): "**The locations available to you may be affected by
            inquiry restrictions specified on the `Location Restrictions` tab of the `Create a User`
            routine.**"
Invariant (repeated): "**The output of this routine may be affected by `Regional Processing`
            restrictions.**"
Evidence:   Process Merchandising Decisions, /articles/15202193119892;
            Select Products for Merchandising Decisions Screen, /articles/15202192348052;
            Single Product Review, /articles/15202192363412
Maps to:    **W-050 — supports run 1's "inverted" judgment; thirteenth access-control mechanism**

> Run 1 counted twelve distinct access-control mechanisms and judged `W-050` inverted. **`Location
> Restrictions` on `Create a User` is a thirteenth**, and it is different in kind from the rest: it is
> not a permission to do something, it is a **filter on what data exists** for that user. Combined with
> `Regional Processing` (still unread, now referenced in five batches) and batch 2's cost-visibility
> flag, three separate mechanisms can silently reduce what a buyer sees — and the merchandising
> decisions wizard **writes based on that filtered list**. Two buyers running the same routine can
> reprice different sets of products and neither will know.

### FINDING 82 — The buying analysis exports to Excel and to a Report Builder file, creating an uncontrolled data path
Invariant:  "When you click `Run`, you access the **`Product Selection` screen, from which you can
            **export product information to Excel®**. Also available… is the option to **save the
            product data to a file and use it to build a report file. You can then use this data file
            with the `Report Builder`**, from which you can create your own buying reports."
Also:       "To access the `Export to Excel` and `Export to HTML` options, **right-click a line in the
            grid**" *(Purchasing tab)*; extended PO information "is available for use by the
            `Report Builder`"; direct-ship tracking "is available for **`Data Warehouse`**" (batch 4).
Invariant:  "If you enter purchase order information, **the system offers the option to create purchase
            orders when exiting the `Product Selection` screen.**"
Evidence:   Product Performance and Purchase Recommendations, /articles/15203112479636;
            Product Selection Screen, /articles/15203127954964
Maps to:    **NEW**

> Two things worth flagging. **Purchase orders are created on *exit*** — the commit is a side effect of
> leaving the screen, matching batch 2 Finding 43 (running a report creates a worklist) and batch 3
> Finding 58 (Exit abandons requests). STORIS repeatedly attaches consequential writes to navigation.
> And there are now **four documented export paths** out of merchandising — Excel, HTML, Report Builder
> data files, Data Warehouse — none with any stated access control beyond the cost-visibility flag. For
> a business preparing to migrate, the reporting that people actually rely on is likely to live in
> those exports rather than in the ERP, and it will not be visible in any inventory of the system.

---

## C. Screen and field inventory

**Process Merchandising Decisions** — Vendor · Group · Category · Collection · **Region** ·
**Buying Group** · Inventory · Special Order · Sales *(inactive here)* · Sort By Primary/Secondary/
Tertiary · **Purchase Status** · Include As-Is Quantity *(inactive here)* · Output to · Export Path ·
Actions. "identical to the pre-screen on the **`Report Merchandising Activity`** routine".

**Select Products for Merchandising Decisions Screen** — grid with checkboxes · **All** · **None** ·
Save.

**Single Product Review** — tabs **Product · Transfer · Purchase**; header: Product · Description ·
Vendor Model Number; running counter with Previous / Next.
*Product*: Purchase Status · Selling Price · Suggested Retail Price · Kit Selling Price ·
Replacement Cost · Markdown Price · Shipping Weight · Shipping Volume.
*Transfer*: Total Quantity · On Hand · Reserved · On Purchase Order · As Is · Transfer-From Location ·
Quantity Available · Quantity to Transfer · Transfer-To Location · **Transfer Route** · Transfer Date ·
**Next Transfer**.
*Purchase*: Vendor · Alternate Ship From · Buyer ID · Receiving At · Delivery Date · Order Quantity ·
Unit Cost · Discounted Cost · Extended Cost · Ship Weight · Ship Volume · **Next PO**.
Right-click menus on both grids.

**Product Performance and Purchase Recommendations** *(Buyer's Management Worksheet / Full Buyers
Worksheet)* — tabs **Selection Criteria · Formula Parameters · Sort Criteria**.
*Selection*: Product · Group · Category · Collection · **(OTB) Department** · Vendor · Vendor Ship-From ·
Buying Group · Use Product or Model Number · Exclude Special Order Products · Exclude Inactive
Products · Location Type · Location · **Order Warning Weeks** · **Excess Warning Weeks** ·
**Report Product Warnings**.
*Formula Parameters*: Previous or Next Weeks · Variance Percent · Days of Written Business ·
Written or Delivered Sales Data.
*Sort*: Primary / Secondary / Tertiary.

**Product Selection Screen** — header aggregates: Gross Margin (12 Periods) · Gross Margin (4 Periods) ·
Inventory Turns · GMROI · Location · Grid · Actions.

**Product Performance and Purchase Recommendations Sample** — header: Product code · Vendor Model
Number · Vendor · Group · Category · Collection · **Status** · **Style** · **Price Point** ·
**Open to Buy Department**. Tabs: **General · Actual Sales · Sales History · Inventory · Purchasing ·
Forecast Sales** — field lists at Findings 73–75.
*Inventory tab*: Quantity on Hand · Floor Samples · Back Ordered · Quantity Reserved · As-Is Inventory ·
**Written Current Period** · Net Available · **Written Previous Period** · grid by location.

**Additional Product Quantities** — Product · **Required Purchase Quantity** · **Additional Purchase
Quantity** · **Total Purchase Quantity**. "**It is possible for multiple lines within the grid to
contain the same product.**"

**Place Additional Items on Purchase Order Screen** — `Add` column. "**You must enter a positive
amount. That is, you cannot reduce the quantity of any line item.**"

**Review Extended Information Window** — Broker · FOB · Do Not Ship Before Date · Do Not Ship After
Date · Order Description · Shipping Terms.

**Selling Location** — Selling Location · Name · Grid.

**Model Number Pattern Entry Screen** — `Pattern` · grid. **STORIS personnel only.**

**Program List Creation** — **List Type** · List · Description · Actions. Read-only variant.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`Location Restrictions`** tab | **`Create a User`** | Which locations a user's merchandising inquiries and decisions cover |
| `Order Warning Weeks` · `Excess Warning Weeks` · `Report Product Warnings` | Product Performance and Purchase Recommendations *(run-time)* | Forecast warning thresholds |
| `Variance Percent` · `Written or Delivered Sales Data` · `Days of Written Business` · `Previous or Next Weeks` | Product Performance and Purchase Recommendations *(run-time)* | **Run-time equivalents of vendor/company replenishment settings** |
| `List Type` | Program List Creation | Whether a list is distributed POs, transfers or GL accounts |
| model number patterns | Model Number Pattern Entry Screen | EDI model-number validation — **STORIS-only** |
| `Country` code (Domestic or not) | Vendor / Vendor ship-from | **Determines import PO behaviour** |
| `Selling Location` | Purchase order | Populates `EDI Buyer Store` on outbound `850` / `860` |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| `Location Restrictions` | `Create a User` | **Data-level filter** on merchandising inquiry and decision screens |
| Regional Processing restrictions | (unread) | Output of merchandising decisions, buying worksheet, costing reports |
| Model Number Pattern Entry | **STORIS personnel only** | EDI model-number validation patterns |

---

## F. State machines and enumerations

**Merchandising decisions wizard** — Process → Select → Single Product Review → Save *(writes product
master, transfers, purchase orders)* / Exit *(abandons all)*.
**Transfer consolidation keys** — from-location · to-location · transfer date.
**Order classes counted separately** — **`ASAP` · `CWC` · `As Is` · `Layaway/Quote`**.
**Model number pattern grammar** — `9` numeric · `A` alpha · `X` alpha-or-null · `0` numeric-or-null ·
`"…"` literal.
**Outbound EDI** — `850` purchase order · `860` purchase order change.
**Import determination** — ship-from country if present, else vendor country; anything other than
`Domestic` is an import.
**Turns / GMROI tri-state** — null *(no history at location)* · `0.00` *(received, never sold)* · value.
**Product header attributes** — Status · **Style** · **Price Point** · Open to Buy Department ·
Group · Category · Collection.
**Availability formulas now in play (six)** — `NET AVAIL = QOH - RES - FLR - AI` · the unlabelled
forward projection · `Units Available = Warehouse QOH – Warehouse Qty Committed` ·
`Net Demand = (True Demand + Min/Safety Stock) - QOH - Qty Incoming` ·
`Total = Net Available - Back Ordered + P/O` *(13-week actual)* ·
`Est Net = Net Available - Est Sales + P/O` *(13-week forecast, saleable only)*.

---

## G. Sequencing rules

1. `Report Merchandising Activity` is the recommended first step for identifying products; the
   decisions wizard then applies changes.
2. One `Save` in `Single Product Review` writes the product file **and** creates transfers **and**
   purchase orders; `Exit` abandons everything.
3. Merchandising-decision edits update `Advanced Product Settings` only — **never** the District and
   Regional Product Settings.
4. Transfers with matching from/to/date are consolidated; otherwise one per product.
5. Created transfers are then processed on the transfer menus (`Logistical Scheduling`).
6. On the buying worksheet, purchase orders are offered **on exit** from the Product Selection screen.
7. `Place Additional Items on Purchase Order` accepts positive quantities only — additions cannot
   reduce a line.
8. Import status is evaluated from the ship-from country first, the vendor country second.
9. `Selling Location` populates `EDI Buyer Store` when an `850` or `860` is generated.
10. A General Location List does not follow region or district changes and must be rebuilt manually.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Model Number Pattern Entry Screen` — STORIS personnel only.** EDI model validation is
  configuration we cannot see or export.
- **`Regional Processing`** — now referenced in five batches, still unread. It restricts merchandising
  decisions, the buying worksheet, costing reports and replenishment. **This is the single most
  blocking unread article in the run.**
- `Report Merchandising Activity` — the recommended entry point to the whole decisions flow; not in the
  Merchandising section listing under that name.
- `Report Builder` · `Data Warehouse` — the reporting layer outside the application.
- `District and Regional Product Settings` — the settings the decisions wizard pointedly does *not*
  update.
- `Create a User` → `Location Restrictions` tab.

**Documented but ambiguous**
- **Whether a hand-entered `Unit Cost` on the Single Product Review purchase tab is overlaid with the
  landed cost hierarchy** or taken as final. Unstated, and it decides whether freight is double-counted.
- **When an outbound `860` change is sent instead of a new `850`** — the existence of `860` conflicts
  with batch 3 Finding 50's "create a new purchase order" rule.
- **What the "documents" are** whose "most current revision" is recorded on an import PO header. No
  article read so far describes import document versioning.
- **`Transfer Route`** — named, undescribed; presumably a Logistics object.
- **`Style` and `Price Point`** — product header attributes appearing for the first time, undefined.
- **`Based On Calculated Sales`** on the Forecast Sales tab — a flag or a label, unclear.
- **`Landed Add-On Approximations: Cost 1, Cost 2`** — why only two of four slots, and why generic
  labels when batch 2 said labels propagate everywhere.
- **`Written Current Period` / `Written Previous Period`** on the Inventory tab — quantities or values?
- **`Include As-Is Quantity` and `Sales` are inactive** on Process Merchandising Decisions "because
  they do not apply" — but they are active on `Report Merchandising Activity`, so the two screens are
  not in fact identical.
- **`CWC`** — a counted order class in three batches, never expanded.
- Whether `Additional Product Quantities`' warning that "multiple lines within the grid [may] contain
  the same product" implies double-counting risk in the totals. Not stated.

**Inferences (not in section B)**
- `CWC` is plausibly a customer-will-call order class, given it sits beside ASAP, As-Is and Layaway and
  counts as not-fully-reserved. **The docs never say this and it is not recorded as fact.**
- The buying worksheet's run-time `Variance Percent` is presumably the same concept as the vendor's
  `Variance Percentage`, applied for analysis only; not stated.
- `Style` and `Price Point` are presumably merchandising classification attributes alongside Group and
  Category; not stated.
- Import "documents" are presumably the extended-information fields themselves (Broker, FOB, terms);
  the wording suggests something more.

---

## I. Unknown unknowns

- **A four-step wizard whose single Save writes prices, transfers and purchase orders across three
  modules**, with Exit as the only undo.
- **Merchandising edits that deliberately skip regional overrides**, so repriced products keep their
  regional prices.
- **Transfer consolidation on from/to/date**, silently merging separate requests.
- **A fourth screen able to write replacement cost.**
- **Buying analysis run-time parameters that can differ from the settings driving actual replenishment.**
- **Six gross-profit percentages on one screen**, three price points against two cost bases.
- **Two thirteen-week projections** with different deduction terms, both saleable-only.
- **`Last Yr Next 4 Periods Average`** — a seasonality input no replenishment formula uses.
- **`CWC` as a counted order class.**
- **Null vs 0.00 as a deliberate semantic distinction** in Turns and GMROI.
- **Import status determined by ship-from country before vendor country.**
- **Versioned import documents** recorded on the PO header.
- **Outbound `850` / `860`, with `EDI Buyer Store` fed from Selling Location**, not receiving location.
- **A STORIS-only model-number pattern language** governing EDI acceptance.
- **One generic list facility shared by purchasing, transfers and GL accounts.**
- **General Location Lists going stale when regions change**, silently, including GL account lists.
- **A thirteenth access-control mechanism** that filters data rather than gating actions.
- **Purchase orders created as a side effect of exiting a screen.**
- **Four export paths out of merchandising** with no stated controls.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Process Merchandising Decisions | First step of the four-step bulk pricing/transfer/PO wizard |
| Single Product Review | Third step; the screen that actually writes prices, transfers and POs |
| Product Performance and Purchase Recommendations | The buyer's worksheet; a.k.a. Buyer's Management Worksheet / Full Buyers Worksheet |
| Order Warning / Excess Warning Weeks | Forecast thresholds raising warnings on the 13-week projection |
| CWC | Counted order class beside ASAP, As-Is and Layaway; never expanded in the docs |
| Landed Add-On Approximations | Estimated add-on costs shown to buyers; two slots displayed |
| Extended Information | Import-oriented PO header fields: Broker, FOB, ship windows, terms |
| 850 / 860 | Outbound EDI purchase order and purchase order change |
| EDI Buyer Store | Vendor-facing store identifier, populated from the PO's Selling Location |
| Model number pattern | Per-EDI-vendor validation grammar; editable only by STORIS |
| Program List Creation | Generic named-list facility typed by List Type (POs, transfers, GL accounts) |
| General Location List | Location list that does not track region/district changes; must be rebuilt |
| Location Restrictions | Per-user data filter on which locations appear in merchandising screens |
| Transfer Route | Undescribed transfer attribute, presumably a Logistics object |
| Style / Price Point | Undefined product header classification attributes |

---

## Contract adjudication — batch 5

| Contract | Verdict | Basis |
|---|---|---|
| **W-061** | **CONFIRMED, extended again** | Six gross-profit percentages from three prices × two cost bases (F74) |
| **W-050** | **supports "inverted"** | A thirteenth access-control mechanism, filtering data rather than gating actions (F81) |
| **W-055 / W-056** | **relevant, still no single authority** | Two more availability formulas, both saleable-only (F73) |
| **W-042** | **complicated by `860`** | An outbound PO-change transaction exists, which the sales-order-update rules never mention (F78) |
| **W-052 / W-053** | **not documented in this section** | — |

---

## Next — batch 6: kits, special orders, as-is and product-level PO screens
