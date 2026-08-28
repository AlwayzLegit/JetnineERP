# Run 02 — Merchandising — Batch 8: ATP, Product Performance and the KPI Formulas

**Status: complete.** 8 articles, two of them the densest in the entire audit.
Findings 105–116.

**This batch corrects batch 1 Finding 17.** The `NET AVAIL` formula quoted in the Purchase Order FAQ
is not the one the system actually documents. See Finding 108.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Available to Promise (ATP) Date Overview** *(linked, Overviews)* | /articles/15201389441940 | EXTRACTED — **the promising engine** |
| 2 | **Report Product Performance** | /articles/15203112358932 | EXTRACTED — **the most detailed article in the run** |
| 3 | **GMROI and Turns** | /articles/15294751622420 | EXTRACTED |
| 4 | Report Beginning of Month and Current Date Inventory Value | /articles/15202503547156 | EXTRACTED |
| 5 | View GMROI for a Vendor | /articles/15295155415316 | EXTRACTED |
| 6 | Report Slow Moving Merchandise | /articles/15203235444244 | EXTRACTED |
| 7 | Report Yearly Vendor Purchases Comparison | /articles/15203214108948 | EXTRACTED |
| 8 | *(also referenced)* Available To Promise (ATP) | /articles/360038892332 | IDENTIFIED — older duplicate |

Discovered and queued: **`BMW_ACF`** *(a configuration file, not a screen)* ·
`Point of Sale Control Settings` → ATP CALCULATION and DELIVERY DATES groups ·
`Inventory Control Settings` → **Stock Reservations** · `Ashley Interface Settings` ·
`Logistical Route Settings` · `Route Capacity Settings` · `Maintain Transfer Schedule Period Days` ·
`View Product Availability` · `Advanced Line Item Display` · `View All Linked Transfers` ·
`Purchase Lead Days` · **vendor subsidiary record** · **Product History File**.

---

## B. Wiring findings

### FINDING 105 — ATP is a real promising engine, and four unrelated settings can make it impossible to switch on
Purpose:    "provide a mechanism where dealers can '**promise**' delivery dates to customers based on
            the vendor's ability to manufacture and ship merchandise."
Four data points (verbatim): "**The `ATP Date`**, or the next date when there is expected to be
            quantity available that does not need to be designated for another order. **The `ATP
            Source`**, or the method by which inventory is made available (e.g., `Current Stock`,
            `Stock PO`). **The `ATP Document`**, or the document number that made inventory available…
            **The `ATP Quantity`**, or the quantity that is expected to be available for sale on the
            ATP Date."
**Activation blockers (verbatim, complete):** "You cannot activate ATP if any of the following is true:
            **Stock reservations are set to `Order Date (Reserve Within Fill Days)`** in Inventory
            Control Settings, Advanced Product Settings, or District and Regional Product Settings.
            **`Purchase Order Assignment Required` is inactive in `Special Order Control Settings`.**
            **`Reserve ASAP Sales` is active, and stock reservations are not set to `Order Date
            (Reserve Immediately)`**… **`Reserve CWC Sales` is active, and stock reservations are not
            set to `Order Date (Reserve Immediately)`**…"
Opt-out:    "**NOTE: To skip the calculation of the ATP date, do NOT check any of the following ATP
            Calculation settings**: `Include New Purchase Orders`, `Include Stock Transfers`,
            `Include Unlinked Purchase Orders`." — and if unset, "the Available to Promise Date and
            Available to Customer Date fields - **neither the labels nor data are displayed**", the ATP
            grid column is absent, and the Actions-menu toggle disappears.
Evidence:   Available to Promise (ATP) Date Overview, /articles/15201389441940
Maps to:    **NEW — and it answers batch 3 Finding 55's open `ATP` question in full**

> ATP is the single largest cross-module mechanism found in this run. Two things stand out. First,
> **the activation blockers are all reservation-policy settings in other modules** — a special order
> control setting and three stock-reservation settings across three files can each independently
> prevent the promising engine from being enabled at all. That is the strongest instance yet of the
> pattern this audit keeps finding: *behaviour is gated by configuration that lives nowhere near it.*
> Second, when ATP is off **the UI silently loses fields, a grid column and a menu option**, so
> "what does the sales order screen look like" has yet another configuration-dependent answer — the
> same lesson as run 1's Dynamic Tab Settings, batch 2's add-on labels and batch 4's vanishing menus.
>
> `ATP Source` and `ATP Document` are the valuable part for a rebuild: **STORIS records *why* a date
> was promised and *which document* made it possible.** Nothing else in this run records the
> provenance of a computed value. It is worth keeping.

### FINDING 106 — ATP's own Net Available is a seventh definition, and it is time-phased
Invariant (verbatim): "**`Net Available` is defined as `Current QOH` + `PO Receipt QTY-to-Date` +
            `Transfer Receipt QTY-to-Date`, minus the sum of `Open Order QTY-to-Date`.**"
General calculation result when no supply is in view: "**`ATP Date` = Current Date + Lead time +
            Pad Days**; `ATP Source` = `New Purchase Order`; `ATP Quantity` = N/A".
Specific-order-line calculation differs (verbatim): "The order is designated a **position 'in line'**
            for fulfillment… the specific order line calculation seeks the date when quantity will be
            available **for the requested order line**… **It is irrelevant to this calculation whether
            or not there is subsequently available quantity.** … `ATP Quantity` is not a calculated
            data point."
Evidence:   Available to Promise (ATP) Date Overview, /articles/15201389441940
Maps to:    **W-055 / W-056 — CONFIRMED, and the count of availability definitions reaches seven**

> A **running, day-by-day cumulative balance** — quantity-to-date on each of three streams, netted
> against demand-to-date — which is a genuinely different shape from every other availability formula
> in the run. And there are **two variants of the same calculation**: a general one asking "when is
> anything free" and a per-line one asking "when is *this line* free, given its queue position".
> The queue position is the important concept: **ATP models orders as competing for supply in
> sequence**, which no other part of Merchandising does.
>
> Note the fallback: with no supply in sight, the promise date becomes **today + lead time + pad
> days**, i.e. the system promises against a purchase order that does not exist yet. `Pad Days` is
> presumably batch 1's `Days to Pad Auto Reallocation`; not stated.

### FINDING 107 — Promise dates can come from a vendor's web service, with a documented fallback chain
Invariant:  "**The ATP Web Service is an API that provides shipment dates and transit times for
            requested products.**… Contact STORIS sales for more information regarding the purchase of
            the **`ATP - External Ashley`** and **`Replenishment - External Ashley`** modules."
Three conditions (verbatim): lead time calculated **for a specific product**; **for a specific ship-to
            location**; and the ship-to location and product's default vendor "have been associated
            with an **Ashley account ID, ship-to ID, user ID, password, external ID, and key code**
            within the Configurations tab of `Ashley Interface Settings`. **The `ATP Web Service` check
            box must be checked for this combination.**"
Fallback:   "If a transit time is not returned from the interface, the '**In Transit Days**' value as
            established in `Vendor Settings` (including the optional **destination location
            overrides**) is used."
Standard hierarchy used when: "**Any of the conditions for using the ATP web service are not true**…
            **The ATP web service encountered an error, and the service is set to use the standard
            lead time calculation if an error occurs.**"
Override:   "**`Override Ashley ATP Date if Purchase Order Date is Greater`** in Ashley Interface
            Settings. When active, the ATP date may be **extended to include an existing purchase
            order**."
Lead time definition: "**the minimum number of days between placing an order with a vendor and the
            receipt of the merchandise**… **NOTE: The exclude weekends setting controls 'transit
            time', whereas the receiving calendar controls 'receive days'.**"
Evidence:   Available to Promise (ATP) Date Overview, /articles/15201389441940
Maps to:    **NEW — the first external real-time integration found in the audit**

> A **named vendor's API is wired into the promise date**, as a licensed module, with credentials
> stored in a settings screen and a documented degradation path when it errors. That is an operational
> dependency on a third party that no other article in the run hints at. Two consequences worth
> recording plainly. **A promise made to a customer may originate outside STORIS entirely**, so
> reconstructing why a date was given requires the vendor's service, not just our data. And **the
> error path is configurable** — the system can be set to fall back to the standard hierarchy, which
> implies it can also be set not to.
>
> The weekend/calendar distinction finally settles a batch-3 ambiguity: `Exclude Weekends in Vendor
> Lead Days` governs **transit**, and the receiving calendar governs **which days we can receive**.
> They are not the same adjustment and both apply.

### FINDING 108 — **CORRECTION.** The real `NET AVAIL` formula is `QOH - COM - FLR - RSV`, not what the FAQ prints
Invariant (verbatim, `Report Product Performance`): "**`NET AVAIL (-F)`**: The top of the first week's
            column shows the current net available calculated as: **`NET AVAIL = QOH - COM - FLR -
            RSV`**. Each subsequent week then shows the prior week's ending total net available as the
            new week's beginning net available."
Component definitions (verbatim):
            **`QOH`** — "Total number of **saleable** units in all warehouse/store locations."
            **`COM`** — "Total number of units **committed to sales orders and transfers**."
            **`FLR`** — "Total number of units considered to be '**floor samples**'… **If a damaged
              reason code is specified in the `BMW_ACF`, this includes all pieces found in damaged
              (as-is) inventory with that reason code. If an As-Is reason code is not specified in the
              `BMW_ACF`, this includes all saleable pieces at any locations with a warehouse location
              code of 'Store'.** Note that **in either case the FLR quantity is included in the QOH
              total and subtracted from it in the net available calculation.**"
            **`RSV`** — "Total number of units **reserved for potential sales**."
            **`UNCOMTD`** — "Total number of units written on sales orders or transfers… **for which no
              inventory has been committed**."
Batch 1 quoted (Purchase Order FAQs): "`NET AVAIL = QOH - RES - FLR - AI`… 'less the number of items
            reserved to orders, less floor samples, and **less As-Is items**'."
Evidence:   Report Product Performance, /articles/15203112358932;
            Purchase Order FAQs, /articles/36208038538516
Maps to:    **CORRECTION to batch 1 Finding 17; `W-055` / `W-056` — CONTRADICTED as stated in the FAQ**

> Batch 1 recorded the FAQ's formula in good faith and flagged its unlabelled second half. The
> reference article gives a different one, and the difference is not cosmetic:
>
> - The FAQ subtracts **`RES` (reserved)** and **`AI` (as-is)** as separate terms.
> - The reference subtracts **`COM` (committed)**, **`FLR`** and **`RSV`** — three terms — and
>   **`QOH` is already saleable-only**, so as-is is excluded at source rather than subtracted.
> - **`COM` and `RSV` are different things** — committed to a document versus reserved for potential
>   sales — and the FAQ collapses them into one.
>
> **Two published formulas for the same named quantity, with different terms.** I cannot say which the
> code implements; I record both and flag it. Given the reference article defines every component and
> the FAQ defines none, **the reference is the better evidence**, but this must be settled against the
> live system before any availability logic is built. Adding this to batch 6 Finding 93's drift table
> makes it the tenth conflict, and the most consequential.
>
> `FLR` deserves its own note: **what counts as a floor sample is decided by a configuration file**
> (`BMW_ACF`), with a fallback that sweeps in *every saleable piece at any location coded 'Store'*.
> That is a very large default. And floor samples are counted **inside** QOH and then subtracted —
> so inventory value and availability diverge by exactly this quantity, as batch 2 suspected.

### FINDING 109 — `BMW_ACF` is a configuration file that changes what the buyer's report means
Invariant:  "**If a damaged reason code is specified in the `BMW_ACF`**, [FLR] includes all pieces
            found in damaged (as-is) inventory with that reason code. **If an As-Is reason code is not
            specified in the `BMW_ACF`**, this includes all saleable pieces at any locations with a
            warehouse location code of 'Store'."
Invariant:  "**`LOCN`: Each location code as specified in the `BMW_ACF`. If locations are not specified
            in the `BMW_ACF`, the system reports based on the warehouse list in the product record.
            A maximum of ten three-character locations may be reported.**"
Evidence:   Report Product Performance, /articles/15203112358932
Maps to:    **NEW — a configuration surface with no screen**

> `BMW` is evidently **Buyer's Management Worksheet** (the alias batch 5 found for
> `Product Performance and Purchase Recommendations`), and `ACF` is a control file. It governs at
> least two things — which reason code means "floor sample", and which ten locations the report
> covers — **and no article in the help center documents how to edit it.** There is no screen. This is
> a third kind of gated configuration, after "STORIS personnel only" screens (batch 5 Finding 79) and
> unnamed STORIS-only control settings (batch 1 Finding 28).
>
> For the migration this is a concrete extraction item: **`BMW_ACF` must be read directly from the
> system**, because its contents change what the numbers mean and they are not visible anywhere in the
> UI as documented.

### FINDING 110 — Every KPI in Merchandising excludes freight and two of the four add-on costs
Invariant, stated three times (verbatim): "**NOTE: Cost figures in the GMROI formula exclude freight,
            add-on 1 and add-on 2 costs.**" · "**NOTE: Cost figures in the TURNS formula exclude
            freight, add-on 1 and add-on 2 costs.**" · "**NOTE: Cost figures in the Gross Margin
            formula exclude freight, add-on 1 and add-on 2 costs.**"
But the margin formula includes it (verbatim): "**`Margin % = (Sell - (Cost + (Cost * Freight
            Factor))/Sell) * 100`**" — and `R` / `A` columns are "Gross margin percent based on the
            replacement cost (**plus freight factor**)" / "average cost (**plus freight factor**)".
Zero rule: "**If the item has never been sold in the last twelve (12) months or, there was no inventory
            in stock during the last twelve (12) months, the GMROI is zero (0)**" *(same for TURNS)*.
Source:     all from the **Product History File**.
Evidence:   Report Product Performance, /articles/15203112358932; GMROI and Turns,
            /articles/15294751622420
Maps to:    **W-061 — CONFIRMED, and a material accounting finding**

> **The same report computes margin two ways on the same page.** The `R` and `A` percentage columns
> *add* a freight factor to cost; GMROI, Turns, GM12 and GM4 *exclude* freight and add-ons 1 and 2.
> Add-ons **3 and 4 are not mentioned** — so either they are included, or the note is incomplete.
>
> Batch 2 established that landed cost is material, resolved through a thirteen-level hierarchy, and
> posted to real GL accounts. **The headline merchandising KPIs are computed on unlanded cost**, which
> means GMROI and Turns systematically overstate return on the products with the highest freight and
> duty — imports, exactly the class that batch 4 and 5 showed carries the extra cost. For a mattress
> retailer, that is not a rounding difference. **This belongs in the run summary as a business finding,
> not just a documentation one.**
>
> Note also the **zero rule contradicts batch 5 Finding 76**, which said no history yields *null* and
> received-but-unsold yields `0.00` on the Product Selection screen. Here, never-sold *or*
> never-in-stock yields **zero**. Two screens, two conventions for the same KPI.

### FINDING 111 — `Net PO` on the buyer's report is a third formula, and it nets layaway back in
Invariant (verbatim): "**`Net PO = On PO - (Uncommitted - Layaway Sales)`**"
Compare batch 3 Finding 48: `Net PO = Warehouse Quantity on Order`, then branch on
            `Include All Back Orders` — subtract uncommitted, and optionally subtract layaway when
            `Layaway in Net Purchase Order` is set.
Compare batch 5: the buyer's worksheet Purchasing tab shows `Total Purchase Orders` and
            `Net Purchase Orders` as separate figures.
Also here:  "**`TOT PO`: Total number of unreceived units on open purchase orders.**"
Evidence:   Report Product Performance, /articles/15203112358932
Maps to:    **NEW — and it conflicts with batch 3**

> Batch 3's version **subtracts** layaway when a setting is on. This version **adds it back** — the
> minus-a-negative means layaway sales *increase* Net PO. Whether these are the same quantity under
> one name, or two different quantities, the documentation does not say. Given batch 3's formula came
> from the replenishment calculation article and this one from the buyer's report, **they may
> legitimately differ** — but a buyer looking at `NET PO` on this report and a planner looking at
> `Net PO` in replenishment are not looking at the same number, and nothing warns either of them.
> Eleventh entry for the drift table.

### FINDING 112 — Sales orders are classified by transaction code, and the codes are finally enumerated
Invariant (verbatim): "**`ASAP`: Total number of units on transaction code `00` sales with a status
            code of ASAP. Damaged (`01`) and Layaway (`03`) transactions are not included.**"
            "**`CWC`: Total number of units on transaction code `00` sales with a status code of CWC.**
            Damaged (01) and Layaway (03) transactions are not included."
            "**`DAM`: Total number of units on As Is/Damaged (transaction code `01`) sales.**"
            "**`LAY`: Total number of units on Layaway (transaction code `03`) sales.**"
Also:       "**`OBSOLETE`: If the product has been designated as obsolete (`type 4`)**, this is
            indicated with the text '(OBSOLETE)' on the last line." · "**`DROP`: The contents of the
            drop status field in the product record.**"
Evidence:   Report Product Performance, /articles/15203112358932
Maps to:    **NEW — closes two enumeration gaps at once**

> Two orthogonal classifications on a sales order, finally separated: **transaction code** (`00`
> regular, `01` as-is/damaged, `03` layaway — `02` unaccounted for) and **status code** (`ASAP`,
> `CWC`, and presumably the scheduled/estimated/pickup values from batch 7). Every earlier batch has
> conflated them. `CWC` is a **status code on a transaction-code-00 sale**, which is why it appears
> both as an order class and a delivery status.
>
> And **"obsolete" is `type 4`** — a numeric product classification distinct from the `Dropped` and
> `Discontinued` purchase statuses of batch 1 Finding 27, since `DROP` is reported as its own separate
> field here. So a product carries a purchase status *and* a type *and* a drop status. Note the
> unhappy coincidence: batch 2's cost exception `type 4` is the AP bill variance. **The same numeral
> means two unrelated things in two modules.**

### FINDING 113 — Order and excess warnings are computed formulas, not thresholds
Invariant (verbatim): "**`EXCESS WARNING`: If the estimated net is greater than the result of
            `(SALES RATE * EXCESS STOCK WEEKS)`, an excess warning appears indicating the excess
            quantity.**"
Invariant (verbatim): "**`ORDER WARNING`: The number printed on this line indicates, for each week,
            the quantity needed to be ordered to prevent the quantity on hand [falling] below zero.**
            An order warning is provided if the result of the following calculation falls below zero:
            **`Estimated Net - (Sales Rate * PO Lead Weeks) + (Sales Rate * Minimum Stock Weeks)`**"
Sources:    `PO LEAD WEEKS`, `MIN STOCK WEEKS`, `XS STK WEEKS` all "**from the vendor subsidiary
            record**".
Projection: "**`TOTAL NET AVAIL = NET AVAIL - UNCOMMITTED + PURCHASE ORDERS`**" *(actual)* and
            "**`Estimated Net Avail = Net Avail - Estimated Sales + Purchase Orders`**" *(estimated)*,
            week by week, "the current week, ending on the next Sunday, is always included as the
            first week… **data is shown in a Monday through Sunday format**".
Exclusion:  "**`ASAP` and `CWC` orders are not included in this projection**, nor are sales orders with
            an estimated/promised date beyond the final weekly period. **Written credit memos are
            included… the effect of written credit memos is that they increase the total (projected)
            net available.**"
Sales rate: "**`Sales Rate = (Total Units * Variance)/Number of Weeks`**" where "Total Units is the
            total number of units **invoiced** over the period specified during run-time".
Evidence:   Report Product Performance, /articles/15203112358932
Maps to:    **NEW — completes batch 5 Finding 73**

> Batch 5 found `Order Warning Weeks` and `Excess Warning Weeks` as run-time options; here are the
> formulas they feed, and both draw their week counts from the **vendor subsidiary record** rather
> than the run-time prompt — a fourth place vendor settings govern purchasing arithmetic.
>
> Two things a rebuild must not miss. **ASAP and CWC orders are excluded from the projection** — the
> third time this run that the fastest-promise orders are excluded from a planning mechanism (batch 7
> Findings 96 and 99 were the others). And **credit memos increase projected availability** on the
> strength of a written return that has not arrived. Note the sales rate here is **invoiced** units
> with a run-time variance, which is a third basis alongside batch 3's written (`BTA`) and delivered
> (`PRODUCT.HISTORY`) options.

### FINDING 114 — One report ignores the purchasing retention setting and keeps two years regardless
Invariant:  "The report uses **written purchase dollars** for any given period… **Note that this
            program ignores the `Closed Purchase Order Retention Days` field in the `Purchasing Control
            Settings`, and instead retains 2 years of purchase order data.**"
Evidence:   Report Yearly Vendor Purchases Comparison, /articles/15203214108948
Maps to:    **NEW — and it qualifies batch 1 Finding 28**

> Batch 1 recorded `Days to Keep Closed Purchase Orders` as a purge policy and flagged it as a
> history-retention risk. **At least one report keeps its own two-year store independently**, which
> means purchasing history is not purged uniformly and there is a second retention regime nobody
> configured. Good news for reconstructing vendor spend; bad news for anyone who believed the purge
> setting told them what data exists. **Worth checking in the live system whether other reports do the
> same.**

### FINDING 115 — Vendor and category KPI inquiries are monthly snapshots, not live
Invariant:  "**The data used within this process is updated monthly and reflects activity up to the
            last month-end closing.**"
Fields:     `GMROI` · `Turns` · **`Current Value` · `Percent of Value` · `Total Sales` ·
            `Percent of Sales`** — both by vendor and by category.
Contrast:   GMROI and Turns elsewhere are described as "**including the current month's sales**".
Evidence:   View GMROI for a Vendor, /articles/15295155415316
Maps to:    **NEW**

> The same two KPIs are computed **live including the current month** on the buyer's worksheet, and
> **as of last month-end** on the vendor inquiry — and the vendor inquiry's own field descriptions
> still say "including the current month's sales", contradicting its opening paragraph. So a buyer and
> a category manager comparing GMROI for the same vendor will get different numbers and neither screen
> explains why. Twelfth drift entry.

### FINDING 116 — Two open accounting months make the inventory value report ambiguous by design
Invariant:  "**NOTE: If you have two accounting months open at the same time, the `BGOM Inventory Value
            @ Cost` column displays values from the previous month, while the `Current Inventory Value
            @ Cost` column shows the current month.**"
Also:       "A user **can only run this report for the regions or location to which they have
            access**." · "This report may take several minutes to load."
Slow movers: "products whose revenue accounts for **only 20% (approximately) of total sales**" —
            options include **`Exclude Items Received After`**, `Exclude Zero YTD Sales`,
            `Exclude Zero YTD Units`, `Include Misc Products`, `Include Spec Ord Products`,
            **`Periods Ago to Report on`**, **`Report Based on`**.
Evidence:   Report Beginning of Month and Current Date Inventory Value, /articles/15202503547156;
            Report Slow Moving Merchandise, /articles/15203235444244
Maps to:    **W-012 — relevant; connects to run 1's fiscal period model**

> Run 1 established fiscal periods 1–13 and the End-of-Month process. This is the merchandising
> consequence: **with two periods open, "beginning of month" silently means the earlier one.** A user
> running the report during the overlap gets a different comparison than one running it after the
> close, with no indication on the output. Combined with batch 7's End-of-Day dependencies, the
> section's numbers are **period-state-dependent in ways the reports do not surface**.
>
> Note also that this report *does* honour access restrictions, unlike the four exceptions in batch 6
> Finding 86 — so restriction behaviour is per-report and cannot be assumed.

---

## C. Screen and field inventory

**Report Product Performance** *(the Buyer's Management Worksheet printed form)* —
*Header lines*: `MOD` · `VEND` · `CAT` · `GRP` · `COLL` · **`PP`** *(price point, from the collection
record)* · `DPT` *(open to buy)* · **`STY`** · `V/MOD` · `DESC`.
*Cost and margin*: `NAT ADV` *(suggested retail)* with `R` / `A` margin percentages · `SELL` with
`R` / `A` · `SALE` with `R` / `A` · **`ACST`** *(average cost, from the costing table)* ·
**`RCOST`** *(purchase order replacement cost, from the costing table)*.
*Inventory status*: **`QOH` · `COM` · `FLR` · `RSV` · `UNCOMTD` · `NET PO` · `WKS SUP` · `SLS RATE` ·
`TOT PO` · `F/F`** *(freight factor, product record else vendor subsidiary record)*.
*Bottom left*: `MISCELLANEOUS COMMENTS` · `OBSOLETE` *(type 4)* · `CUT DATE` *(from the vendor
subsidiary record's collection)* · **`ACTION`** *(blank space for hand-written buying notes)*.
*Location section*: `LOCN` *(from `BMW_ACF`; max ten three-character locations)* · `NET AVL` ·
`WBUS/N`.
*Current & historic*: `L7D` · `GMROI` · `TURNS` · `GM12` · `GM4` · `ASAP` · `CWC` · `DAM` · `LAY` ·
`CUR` · previous 12 months · `DROP` · **`TL4` · `TY4` · `TL12` · `AL4` · `AY4` · `AL12`**.
*Planning*: week columns Monday–Sunday · `NET AVAIL (-F)` · `-UNCOMMITTED` · `+ PUR ORDERS` ·
`TOT NET AVAIL` · `-ESTIM SALES` · `+ PUR ORDERS` · `ESTIMATED NET` · `PO LEAD WEEKS` ·
`MIN STOCK WEEKS` · `XS STK WEEKS` · `EXCESS WARNING` · `ORDER WARNING`.
*Open POs*: `PO#` *(asterisk = acknowledged)* · `DATE` · `QTY`.

**Available to Promise** — data points `ATP Date` · `ATP Source` · `ATP Document` · `ATP Quantity`;
`Available to Customer (ATC) Date` displayed on order lines.
*Entry screens using it*: Enter a Sales Order · Enter an Exchange · Select a Fulfillment Date ·
Update Line Item Delivery Dates · Select a Delivery Date · Reassign a Sales Reservation ·
Enter a Shopping Cart.
*Views*: Additional Line Item Details (Sales Order tab) · View Product Availability (Locations tab) ·
Additional Order Detail (Delivery Information) · Advanced Line Item Display · Line Item Linked
Document Display · **View All Linked Transfers**.

**View GMROI for a Vendor** — tabs **Vendor · Category**; both show GMROI · Turns · **Current Value ·
Percent of Value · Total Sales · Percent of Sales** · grid. **Monthly snapshot.**

**Report Beginning of Month and Current Date Inventory Value** — Group · Category · Region · Location ·
Break on Location · Send Output to · Export Path. Columns **`BGOM Inventory Value @ Cost`** ·
**`Current Inventory Value @ Cost`**; sorted region → location → category → group.

**Report Slow Moving Merchandise** — Group · Category · Brand · Vendor · Purchase Status · Primary /
Secondary Sort · Region · Location · **Exclude Items Received After** · Exclude Zero YTD Sales ·
Exclude Zero YTD Units · Include Misc Products · Include Spec Ord Products · **Periods Ago to Report
on** · **Report Based on** · Send Output to · Export Path.

**Report Yearly Vendor Purchases Comparison** — Vendor Class · Vendor Code · **Compare From**
(Start/End Period and Year) · **Compare To** (Start/End Period and Year) · **Minimum Amount** ·
**Rank By** · Send Output to · Export Path.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `ATP CALCULATION - Include New Purchase Orders` · `Include Stock Transfers` · `Include Unlinked Purchase Orders` | **Point of Sale Control Settings** | **All three unchecked ⇒ ATP is not calculated and its UI disappears** |
| `ATP CALCULATION - Default display of ATC date in Point of Sale` | Point of Sale Control Settings | Whether the Available-to-Customer date shows by default |
| `DELIVERY DATES: Restrict based on available date` | Point of Sale Control Settings | **Security override needed to schedule earlier than the ATC date** |
| `DELIVERY DATES: Allow multiple on order line` | Point of Sale Control Settings | Multiple fulfillment dates per line |
| `Schedule Period Days` | Point of Sale Control Settings | Global fallback for transfer scheduling windows |
| **Stock Reservations** (`Order Date (Reserve Within Fill Days)` / `Order Date (Reserve Immediately)`) | **Inventory Control Settings**, Advanced Product Settings, District and Regional Product Settings | **Can make ATP impossible to activate** |
| `Reserve ASAP Sales` · `Reserve CWC Sales` | (reservation settings) | **Can make ATP impossible to activate** |
| `Purchase Order Assignment Required` | **Special Order Control Settings** | **Must be active or ATP cannot be activated** |
| `Ashley Quantity Buffer` | Advanced Product Settings → Interfaces | ATP quantity buffer for Ashley products |
| Ashley account ID / ship-to ID / user ID / password / external ID / key code · `ATP Web Service` | **Ashley Interface Settings** → Configurations | Enables the external promise-date service |
| `Override Ashley ATP Date if Purchase Order Date is Greater` | Ashley Interface Settings | Extends the ATP date to an existing PO |
| `In Transit Days` (+ destination overrides) | Vendor Settings | Transit fallback when the web service returns none |
| purchase order receiving calendar | Warehouse/Store Receiving Settings | "Receive days" — distinct from transit time |
| `Exclude Weekends in Vendor Lead Days` | Purchasing Control Settings | **"Transit time" only** |
| `Logistical Route Settings` · `Route Capacity Settings` | (unread) | Transfer capacity constraining ATP dates |
| `Maintain Transfer Schedule Period Days` | (unread) | Per-route-pair transfer scheduling window |
| **`BMW_ACF`** | **a file, no screen** | Damaged/as-is reason code defining `FLR`; the ten reported locations |
| `Closed Purchase Order Retention Days` | Purchasing Control Settings | **Ignored by the yearly vendor comparison, which keeps 2 years** |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| assign merchandise earlier than automatic assignment | **Create a User/Group Logistics Security** | Overriding ATP-driven allocation order |
| security override for early scheduling | (implied by `DELIVERY DATES: Restrict based on available date`) | Scheduling a line or order before its ATC date |
| region/location access | Regional Processing | `Report Beginning of Month…` **does** honour it |

---

## F. State machines and enumerations

**Transaction codes** — `00` regular sale · `01` As-Is/Damaged · `03` Layaway *(`02` unobserved)*.
**Status codes on transaction-code-00 sales** — `ASAP` · `CWC` *(plus scheduled delivery, estimated
delivery, customer pickup from batch 7)*.
**Product classifications** — purchase status *(`Dropped`, `Discontinued`)* · **type** *(`4` =
obsolete)* · **drop status field** — three separate attributes.
**ATP Sources** — `Current Stock` · `Stock PO` · `New Purchase Order` · auto-transfer / first leg of a
multi-leg transfer.
**ATP data points** — Date · Source · Document · Quantity.
**ATP variants** — general *(next date anything is free)* · specific order line *(queue position;
no Quantity)*.
**Availability formulas — the full set found in this run (seven):**
| # | Formula | Source |
|---|---|---|
| 1 | `QOH - RES - FLR - AI` | Purchase Order FAQs (b1) — **contradicted** |
| 2 | unlabelled forward projection | Purchase Order FAQs (b1) |
| 3 | `Units Available = Warehouse QOH – Warehouse Qty Committed` | Replenishment calc (b3) |
| 4 | `Net Demand = (True Demand + Min/Safety Stock) - QOH - Qty Incoming` | Back-order replenishment (b3) |
| 5 | `Total = Net Available - Back Ordered + P/O` | Buyer's worksheet, 13-week actual (b5) |
| 6 | `Est Net = Net Available - Est Sales + P/O` | Buyer's worksheet, 13-week forecast (b5) |
| 7 | **`NET AVAIL = QOH - COM - FLR - RSV`** | **Report Product Performance (b8) — best evidence** |
| 8 | `Net Available = QOH + PO Receipt QTY-to-Date + Transfer Receipt QTY-to-Date − Open Order QTY-to-Date` | **ATP, time-phased (b8)** |
**Net PO formulas (three)** — `Warehouse Quantity on Order` + branch (b3) · `On PO - (Uncommitted -
Layaway Sales)` (b8) · `Total Purchase Orders` / `Net Purchase Orders` shown separately (b5).
**Sales rate bases (three)** — written (`BTA`) · delivered (`PRODUCT.HISTORY`) · **invoiced × variance**
(Report Product Performance).
**KPI cost basis** — GMROI, Turns, GM12, GM4 **exclude freight and add-ons 1 and 2**; the `R`/`A`
margin columns **include the freight factor**.

---

## G. Sequencing rules

1. ATP cannot be activated while any of four reservation-policy conditions holds.
2. With all three `ATP CALCULATION` settings unchecked, no ATP date is computed and its UI is hidden.
3. The ATP web service is used only when product, ship-to location and Ashley credentials are all
   present and the checkbox is set; otherwise the standard lead-time hierarchy applies.
4. Lead time = hierarchy value, then adjusted for **transit** (exclude weekends) and **receive days**
   (receiving calendar) separately.
5. With no supply in view, ATP Date = today + lead time + pad days, sourced to a not-yet-created PO.
6. For multi-leg transfers, ATP walks each leg in turn against route capacity.
7. An auto-transfer does not reserve until a fulfillment date is selected.
8. Scheduling earlier than the ATC date requires a security override when the restriction is on.
9. Projections start with the current week ending next Sunday, Monday–Sunday.
10. ASAP and CWC orders are excluded from the weekly projection; credit memos increase it.
11. GMROI and Turns are live on the buyer's report and **month-end-only** on the vendor inquiry.
12. With two accounting months open, `BGOM` shows the previous month.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`BMW_ACF`** — a configuration file with no documented screen, governing what `FLR` means and which
  ten locations report. **Must be extracted directly.**
- `Point of Sale Control Settings` — now holding at least six ATP/delivery settings plus batch 3's
  `Create a PO for Back Orderable Stock`. Unread.
- `Inventory Control Settings` — four settings referenced across batches 1, 3, 7, 8. Unread.
- `Ashley Interface Settings` · `Logistical Route Settings` · `Route Capacity Settings` ·
  `Maintain Transfer Schedule Period Days` — the transfer-capacity half of ATP.
- **The "vendor subsidiary record"** — a distinct object from Vendor Settings and Advanced Vendor
  Settings, supplying freight factor, lead weeks, min stock weeks, excess stock weeks and cut dates.
  Never described.
- **The Product History File** — the source for every KPI; monthly granularity (batch 3 established
  this makes weekly rates approximate).

**Documented but ambiguous**
- **Two published `NET AVAIL` formulas** (Finding 108). Must be settled against the live system.
- **Two `Net PO` formulas** with opposite layaway treatment (Finding 111).
- **Add-ons 3 and 4** — excluded from the KPIs like 1 and 2, or included? The note names only two.
- **Transaction code `02`** — unobserved; the enumeration has a gap, as run 1 found for AP bill types.
- **`Pad Days`** in the ATP fallback — presumably `Days to Pad Auto Reallocation` (b1); not stated.
- **`type 4` = obsolete** collides with **cost exception `type 4`** = AP bill variance.
- **Null vs zero for GMROI/Turns** — batch 5 and batch 8 give different conventions.
- **`Report Based on`** and **`Periods Ago to Report on`** (slow movers) — undefined.
- **`Current Value` / `Percent of Value`** on the vendor GMROI inquiry — at which cost?
- Whether other reports also keep private retention stores like the yearly vendor comparison.
- Whether the `View GMROI for a Vendor` opening paragraph (monthly snapshot) or its field descriptions
  (including current month) is correct.

**Inferences (not in section B)**
- `BMW` almost certainly means Buyer's Management Worksheet and `ACF` an application control file; the
  articles never expand either.
- The vendor subsidiary record is presumably a per-vendor-per-collection or per-vendor-per-location
  extension; the report references it for four different values and never defines it.
- `Pad Days` is presumably `Days to Pad Auto Reallocation`; not stated.
- Transaction code `02` presumably exists for some document class; not stated.

---

## I. Unknown unknowns

- **ATP as a full promising engine** recording date, source, document and quantity.
- **Four unrelated reservation settings that can block ATP activation entirely.**
- **A vendor's web service supplying promise dates**, with credentials in a settings screen.
- **A configurable error-fallback** on that external service.
- **Transit time and receive days as two separate adjustments** to lead time.
- **A time-phased, day-by-day cumulative availability calculation** unique to ATP.
- **Orders holding a queue position** for supply.
- **A second, contradictory `NET AVAIL` formula** — and the FAQ's being the weaker evidence.
- **`BMW_ACF`** — a screenless configuration file changing what a KPI means.
- **A default that treats every saleable piece at a Store location as a floor sample.**
- **GMROI, Turns and gross margin computed on unlanded cost**, while margin columns on the same report
  include freight.
- **Credit memos increasing projected availability.**
- **ASAP and CWC excluded from the weekly projection** — the third such exclusion in the run.
- **Transaction codes `00`/`01`/`03` as a distinct axis from status codes.**
- **`type 4` meaning obsolete in Merchandising and AP-bill-variance in costing.**
- **A report keeping its own two-year history regardless of the purge setting.**
- **Vendor KPI inquiries frozen at month-end** while the same KPIs run live elsewhere.
- **"Beginning of month" silently meaning the earlier of two open periods.**
- **The "vendor subsidiary record"** as a fourth vendor-configuration object.
- **`ACTION`** — blank space printed on a report for hand-written buying notes.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| ATP Date / Source / Document / Quantity | The promise date, how it becomes available, which document supplies it, how much |
| ATC (Available to Customer) Date | Displayed promise date accounting for merchandise **and** route capacity |
| ATP Web Service | Licensed external interface returning vendor shipment dates and transit times |
| Lead time | Minimum days from placing an order to receipt; hierarchy plus transit and receive-day adjustments |
| Pad Days | Buffer added to the ATP fallback date |
| QOH / COM / FLR / RSV / UNCOMTD | Saleable on hand · committed to documents · floor samples · reserved · written but uncommitted |
| BMW_ACF | Screenless control file defining the floor-sample reason code and reported locations |
| Vendor subsidiary record | Undocumented vendor object supplying freight factor, lead weeks, stock weeks, cut dates |
| Transaction code 00 / 01 / 03 | Regular sale · as-is/damaged · layaway |
| Type 4 | Obsolete product (also, unrelatedly, the AP-bill cost exception type) |
| GM12 / GM4 | Gross margin over 12 and 4 months, excluding the current month and excluding freight |
| Order Warning / Excess Warning | Computed weekly signals from vendor lead, minimum and excess stock weeks |
| BGOM | Beginning of month inventory value at cost |
| Slow mover | Product in the bottom ~20% of revenue for its group, category, brand or vendor |

---

## Contract adjudication — batch 8

| Contract | Verdict | Basis |
|---|---|---|
| **W-055 / W-056** | **CONFIRMED in mechanism; the FAQ formula CONTRADICTED** | Eight availability definitions catalogued; `QOH - COM - FLR - RSV` is the best-evidenced (F106, F108) |
| **W-061** | **CONFIRMED, with a material finding** | KPIs exclude freight and add-ons 1–2 while margin columns include the freight factor (F110) |
| **W-012** | **relevant** | Two open accounting periods change what "beginning of month" means (F116) |
| **W-042** | **unaffected** | — |
| **W-052 / W-053** | **not documented in this section** | — |

---

## Next — batch 9: transfers, as-is, kits and remaining inventory-facing reports
