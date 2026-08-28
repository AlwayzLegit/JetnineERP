# Run 02 — Merchandising — Batch 3: Replenishment and Demand-Driven PO Creation

**Status: complete.** 11 articles. Findings 45–58.

**This batch corrects a batch-1 finding.** `W-042` is not what Finding 11 read it as. See Finding 50.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Automatic Purchase Order Replenishment** | /articles/15202193113492 | EXTRACTED |
| 2 | Replenish Inventory for Current Back Order Needs | /articles/15202208983444 | EXTRACTED |
| 3 | **Replenish Inventory for Current Back Order Needs Overview** *(linked, Overviews)* | /articles/15202193282580 | EXTRACTED |
| 4 | Replenish Stock Inventory Based on Sales Rate | /articles/15202208983572 | EXTRACTED |
| 5 | **Replenish Stock Inventory Based on Sales Rate — Calculation Information** | /articles/15202192345748 | EXTRACTED — densest article in the run |
| 6 | **Report Automatic Purchase Order Replenishments** | /articles/15202552856340 | EXTRACTED |
| 7 | Items for Replenishment Screen | /articles/15202207766420 | EXTRACTED |
| 8 | Items for Replenishment Actions Menu | /articles/15202207759380 | EXTRACTED |
| 9 | **Purchase Order Creation from Order Entry** | /articles/15202207999508 | EXTRACTED |
| 10 | **Purchase Order Updates from Sales Order Entry** | /articles/15202207999636 | EXTRACTED — settles W-042 |
| 11 | Sales Order Linkage Screen | /articles/15202208346260 | EXTRACTED |
| 12 | Assign Products to Purchase Orders | /articles/15202192109844 | EXTRACTED |
| 13 | List Previous Open Purchase Orders | /articles/15202207761812 | EXTRACTED — thin |

Discovered and queued: `Purchase Order Type Settings` (`Include in Supply Calculation`) ·
`Warehouse/Store Location Settings` · `Warehouse Inventory Settings` ·
`Advanced Vendor Settings` (General, Auto PO Replen, Shipping tabs) ·
`Advanced Regional Vendor Settings` · `District and Regional Product Settings` ·
`Advanced Vendor Category and Group Exception Settings - Auto-Fill Days` ·
`Region Settings` (Primary Replenishment Warehouse) · `Regional Processing - Reporting Rules` ·
`Point of Sale Control Settings` (`Create a PO for Back Orderable Stock`) ·
`Web Control Settings` (`Allow Auto PO Creation`) · `Product Kit Settings` ·
`Vendor Ship-From Settings` · `Purchase Orders and Vendor Ship From` · `Schedule a Process` ·
`Single Product Review` · `Inventory Control Settings` (`Layaway in Net Purchase Order`).

---

## B. Wiring findings

### FINDING 45 — Replenishment is two mutually exclusive systems, and the docs say so
System A — **`Replenish Stock Inventory Based on Sales Rate`** *(Automatic PO Replenishment)*:
            forecast-driven, vendor-scheduled, runs in End-of-Day.
System B — **`Replenish Inventory for Current Back Order Needs`** *(Manual Purchase Order
            Replenishment)*: demand-driven, run per location, three modes.
Invariant:  "This process can be used as **an alternative to** the `Replenish Stock Inventory Based on
            Sales Rate` routine."
Mode invariant: "**Comprehensive** — … This replenishment mode works with Net Demand. **Using this
            replenishment mode negates the need to run `Allocated Order` and `Stock Level` modes;
            combining Comprehensive with the other modes can lead to over- or under-purchasing.**"
            "**Allocated Order** — Based on back order needs. Looks at only back-ordered lines… Stock
            level requirements are ignored. **This mode is intended to be run in complement to Stock
            Level.**" · "**Stock Level** — Based only on minimum or safety stock level requirements.
            Back-order needs are ignored… Purchase orders created using this type of replenishment are
            **not linked to sales orders**."
Setting:    "`BACK ORDER REPLENISH - Comprehensive Replenishment` setting **controls which
            `Replenishment Type` fields are available for users**. Either two scenarios should occur:
            **the use of Comprehensive OR the use of Allocated Order and Stock Level.**"
Evidence:   Replenish Inventory for Current Back Order Needs, /articles/15202208983444;
            Replenish Inventory for Current Back Order Needs Overview, /articles/15202193282580
Maps to:    **NEW**

> Two whole replenishment engines with different mathematics, and inside the second one, a mode that
> is explicitly incompatible with the other two. **The control setting exists specifically to stop an
> operator running both.** That is a strong signal about what a rebuild must not do: not offer both
> and hope. Note that only `Allocated Order` and `Comprehensive` produce **linked** purchase orders;
> `Stock Level` output is unlinked, so demand traceability depends on which mode ran.

### FINDING 46 — The forecast order quantity is a four-term equation whose every term resolves through its own hierarchy
Invariant (verbatim):
            **`Quantity To Order = Units Required + Additional Units Required - Units Available - Net PO`**
**Units Required** = `Minimum Weekly Supply * Sales Rate`, where
            `Minimum Weekly Supply = Minimum Days Supply / 7` and **Minimum Days Supply** resolves
            through a **three-level hierarchy**: Advanced Vendor Settings General tab →
            **Group Exceptions** → **Category Exceptions** → the plain `Minimum Stock Days` field.
**Additional Units Required** = `Additional Weekly Supply * Sales Rate`, where
            `Additional Weekly Supply = Lead Days / Days Per Week` and **Lead Days** resolves through
            a **six-level hierarchy** (verbatim order): `Vendor Ship-From Settings – Purchase Lead
            Days` → `Regional Processing – Regional Vendor Settings – Lead Time` → `Advanced Vendor
            Settings – Group Exceptions – Lead Days` → `Advanced Vendor Settings – Category
            Exceptions – Lead Days` → `Advanced Vendor Settings – Purchase Lead Days` →
            `Vendor Settings – Average Lead Time`.
            **Days Per Week** = "**`5` if `Purchasing Control Settings – Exclude Weekends in Vendor
            Lead Days` field checked**; **`7`** if unchecked."
**Sales Rate** = `Total Units Sold (Written or Delivered) / Number of Weeks` — number of weeks from
            `Advanced Vendor Settings – Weekly Sales Rate Calculation`; written-vs-delivered from
            `Purchasing Control Settings – Unit Sales Rate Calculation`.
**Units Available** = `Warehouse Quantity on Hand – Warehouse Quantity Committed`
            *(may include store stock — `Include Store Stock In Availability`)*.
**Net PO** = `Warehouse Quantity on Order`, with branch logic — see Finding 48.
Exclusion:  "**All items with weekly sales rates calculated lower than the `Minimum Sales Rate` field
            in Advanced Vendor Settings are excluded from this report.**"
Evidence:   Replenish Stock Inventory Based on Sales Rate — Calculation Information,
            /articles/15202192345748; Report Automatic Purchase Order Replenishments,
            /articles/15202552856340
Maps to:    **NEW — the single densest piece of wiring found in the audit so far**

> This is the whole forecast in one equation, and it is fully documented — a rarity in this help
> center. What matters for the rebuild is that **three of the four terms are configuration lookups,
> not data**: minimum days supply through three levels, lead days through six, and the written-vs-
> delivered basis through a company switch. A vendor with a group exception and a regional lead time
> gets a different order quantity from an identical vendor without one, and **nothing on the resulting
> purchase order records which level supplied which number.** Same structural problem as batch 2's
> thirteen-level landed cost hierarchy. Note also the silent floor: items below `Minimum Sales Rate`
> **never appear at all** — they are not shown as zero, they are absent.

### FINDING 47 — Two articles give contradictory formulas for Additional Units Required
Version A (Calculation Information, verbatim): "`Additional Weekly Supply = Lead Days / Days Per
            Week`" with Days Per Week = 5 or 7 by the weekend switch.
Version B (Report Automatic Purchase Order Replenishments, verbatim): "`Addl Required = Lead days/7 *
            Sales Rate + (.05)`" — worked example: "`14/7*2 + (.05)` rounded up = **5**".
Evidence:   /articles/15202192345748 and /articles/15202552856340
Maps to:    **NEW — an unresolved documentation contradiction on a live formula**

> Version B hardcodes 7 and adds an unexplained **`+ 0.05`** constant; version A parameterises the
> divisor and has no constant. The worked example is itself odd — `14/7*2 = 4`, plus `0.05` is
> `4.05`, "rounded up" to 5. So the constant exists **solely to force a round-up**, which means the
> stated rounding is not standard rounding at all, and there is a separate switch called
> `SALES RATE REPLENISH - Utilize standard rounding for Recommended Order Quantity` that presumably
> turns this behaviour off. **We cannot reproduce this calculation from the documentation with
> confidence.** Recorded as a contradiction, not resolved. This one needs to be settled against the
> live system before cutover — it changes every order quantity.

### FINDING 48 — Net PO branches on a vendor flag, and reaches into layaway and transfers
Invariant:  "`Net PO = Warehouse Quantity on Order`. **This process includes POs on hold** and does
            not include unreserved merchandise."
Branch (verbatim):
            "`Advanced Vendor Settings – Include All Back Orders` field **checked**
             - Subtract **Warehouse Quantity Uncommitted**
             - `Inventory Control Settings – Layaway in Net Purchase Order` field checked
               * Subtract **Warehouse Quantity on Layaway**"
            "`Advanced Vendor Settings – Include All Back Orders` field **unchecked**
             - Subtract **sold-but-not-reserved items** with either an estimated/scheduled delivery
               date within the order item's **auto-fill days** or with a **delivery status of ASAP**
             - **Add transfers coming in within fill days**"
Supply gate: "**If a purchase order's type has the `Include in Supply Calculation` field checked, the
            purchase order is included as a source of supply**, thus reducing the quantity that needs
            to be ordered. If a purchase order's type has this field unchecked, the purchase order is
            **not included as a source of supply** and has no effect."
Evidence:   Replenish Stock Inventory Based on Sales Rate — Calculation Information,
            /articles/15202192345748
Maps to:    **NEW — and it explains batch 1's `PO Type` gap**

> Batch 1 flagged `PO Type` as a header field with no enumeration. Here is why it matters:
> **PO type carries an `Include in Supply Calculation` flag that decides whether that order counts as
> incoming supply at all.** Get the type wrong and the system re-orders merchandise already on the
> water. Three further points. **Purchase orders on hold are counted as supply** — so the seven-source
> hold mechanism of batch 1 does not remove an order from the forecast, it only stops it being sent.
> **Layaway is optionally netted**, via an *Inventory* control setting, inside a *Purchasing*
> calculation. And in the unchecked branch, **inbound transfers are added as supply** — Logistics
> feeding the purchasing forecast. `ASAP` finally gets a meaning here: a **delivery status**, which
> closes part of batch 1's `CWC`/`ASAP` gap.

### FINDING 49 — The sales rate is computed from two different files, and one of them is admitted to be a guess
Invariant (verbatim): "`Units Sold = Units Returned` for the number of weeks defined in the
            `Advanced Vendor Settings – Weekly Sales Rate Calculation`
             - **Written business uses `BTA` file**
             - **Delivered business uses `PRODUCT.HISTORY` file (which is a guesstimate since numbers
               are stored per month, not by week).**"
Regionalisation: "When determining total units sold, the system checks for regionalization and gets
            **all locations for the region of the specified replenishment warehouse**. The **`Primary
            Replenishment Warehouse` in `Region Settings`** is checked and all locations for that
            region are included."
Variance:   `Variance Percentage` — "The default is **100**… to project sales figures cut in half,
            enter **50**. To project sales figures at double the historic sales rate, enter **200**."
            applied only between `Variance Starting/Ending Date`.
Evidence:   Replenish Stock Inventory Based on Sales Rate — Calculation Information,
            /articles/15202192345748; Automatic Purchase Order Replenishment, /articles/15202193113492
Maps to:    **NEW**

> The help center **admits in writing that delivered-basis sales rates are approximate** because the
> underlying history file is monthly and the calculation is weekly. That is a documented accuracy
> limit on every forecast run on the delivered basis, and it is exactly the sort of thing that
> vanishes in a migration unless someone writes it down. Two raw file names surface here — `BTA` and
> `PRODUCT.HISTORY` — the only physical file names seen anywhere in the audit so far; worth keeping
> for the data-extraction phase. The line as printed reads "`Units Sold = Units Returned`", which is
> almost certainly a typo for "Units Sold **minus** Units Returned"; transcribed as printed and
> flagged. The `Variance Percentage` is a **date-bounded manual forecast override** — a buyer can
> double or halve projected demand for a stated window, and nothing on the resulting PO says so.

### FINDING 50 — **CORRECTION.** PO line changes do *not* propagate to sales orders for stock products
Invariant (verbatim, complete):
            "**stock products** – when deleting a line in a sales order, or editing line item
            quantities, **linked quantities update but the purchase order quantities do not. A message
            appears indicating that you must manually update the purchase order** to reflect the
            changes."
            "**special-order or non-inventory products, purchase order not transmitted:**
             – sales order updates to line item quantities or details **reflect in the purchase order**.
             – adding new lines to sales orders **reflects in the purchase order**."
            "**special-order or non-inventory products, purchase order already transmitted:**
             - when **decreasing** quantities on a sales order, linked quantities update but purchase
               order quantities do not. A message appears indicating that you must manually update…
             - when **increasing** a quantity on a sales order, a message appears indicating that you
               must **create a new purchase order** to cover the quantity increase.
             - when changing **special-order details**, the purchase order does not update. However,
               you can manually enter the changes in Purchase Order Entry, **after which the changes
               reflect in Sales Order Entry**."
Evidence:   Purchase Order Updates from Sales Order Entry, /articles/15202207999636
Maps to:    **W-042 — ADJUDICATED, and my batch-1 reading was wrong**

> Batch 1 Finding 11 quoted `Enter a Purchase Order` saying the system "updates sales orders attached
> to purchase order line items each time you change or delete the purchase order line item", and I
> recorded `W-042` as **confirmed in mechanism**. This article gives the real rule and it is far
> narrower and runs mostly the other way:
>
> - **Sales order → purchase order propagation happens only for special-order and non-inventory
>   products, and only before transmission.** For stock products it never happens.
> - **After transmission, nothing propagates automatically in either direction** — the system posts a
>   message telling a human to go do it, and for a quantity increase it will not even amend, it
>   demands a *new purchase order*.
> - The one documented **PO → sales order** flow is special-order *details* typed into PO entry, which
>   then appear on the sales order — matching batch 1's Finding 23 on special order instructions.
>
> So `W-042` as stated is **CONTRADICTED for stock products** and **CONFIRMED, conditionally, for
> untransmitted special orders**. The practical consequence is large: in the live business, **the link
> between a sales order and its purchase order is a quantity link, not a synchronisation**, and
> keeping the two consistent after transmission is manual work backed only by a message box. Anything
> we build that assumes automatic ripple will silently diverge from how the operators actually work.

### FINDING 51 — Creating a PO from a sales order is governed by seven settings across six files
Entry points (verbatim): "It is possible to create a purchase order from within another sales entry
            process (on-the-fly), including **`Enter a Sales Order`, `Enter a Transfer`, `Enter an
            Exchange`, and `eSTORIS`**."
Permissions (Purchasing Security): `Create special-order purchase orders within POS entry` ·
            `Create stock product purchase orders within POS entry` ·
            `Electronically submit (EDI) purchase orders within POS entry`
Override:   "**NOTE: The above fields do not affect direct-ship purchase orders, and the `Purchase
            Order/Assignment Required` field … overrides these fields.**" and again: "this field
            **overrides the `Allow Purchase Order Creation` field** in the User and User Group files."
Auto-create switches: `Advanced Product Settings` → **`PO From Order Entry`** (stock) ·
            `Product Kit Settings` → **`From Enter Sales Order; insufficient Component quantity`**
            (hard-kit master) · `Special Order Control Settings` → **`Purchase Order/Automatically
            Create`** and **`Purchase Order/Assignment Required`** ·
            `Point of Sale Control Settings` → **`Create a PO for Back Orderable Stock`** ·
            `Web Control Settings` → **`Allow Auto PO Creation`**
eSTORIS three-condition rule (verbatim): "eSTORIS creates purchase orders automatically if **1)**
            insufficient quantity exists in inventory to fill the order, **2)** the `Allow Auto PO
            Creation` field is enabled in the Web Control Settings, and **3) manual purchase order
            numbering is active via the `Next Purchase Order Number` field** in the Purchasing Control
            Settings."
Evidence:   Purchase Order Creation from Order Entry, /articles/15202207999508
Maps to:    **W-005 / W-006 — CONFIRMED and enlarged beyond batch 2's five files**

> Batch 1 counted five files. It is at least seven settings across six files, plus three security
> permissions, plus a documented **override chain** in which a Special Order Control Setting beats a
> user permission. And the eSTORIS rule is genuinely strange: **web orders only auto-create purchase
> orders if manual PO numbering is switched on.** That is a numbering setting acting as a functional
> gate on an e-commerce integration — precisely the kind of accidental coupling this audit exists to
> surface, and a live trap for anyone tidying up PO numbering during cutover.

### FINDING 52 — An eighth automatic hold source, and a second minimum-quantity field
Invariant:  "The process that creates purchase orders checks the **`Create replenishment purchase
            order not on hold`** setting in Purchasing Security and the **`Minimum Order Quantity` on
            the Costing page in the `Advanced Product Settings`**. **If the purchasing security
            setting is blank and/or the order quantity is less than the minimum order quantity, the
            purchase order is placed on hold.**"
Evidence:   Replenish Inventory for Current Back Order Needs, /articles/15202208983444
Maps to:    **extends batch 1 Finding 12 from seven sources to eight**

> A second **inverted** permission — blank means hold — matching `Create a purchase order not on hold
> from POS entry` from batch 1. And it resolves batch 1's open question about two thresholds:
> **`Minimum Stock Quantity` lives on the Settings page and `Minimum Order Quantity` lives on the
> Costing page of Advanced Product Settings.** They are different fields on different tabs of the
> same settings file, both capable of putting a purchase order on hold. That is a genuine trap.

### FINDING 53 — Auto-replenishment excludes four product classes outright and two more by default
Excluded outright (verbatim): "**special-order**, **obsolete** (i.e. a purchase status of **`Dropped`
            or `Discontinued`**), **non-inventory**, and **kit-master**."
Excluded but overridable: "products flagged as '**orderable**' via the `PO from Order Entry` field in
            the Advanced Product Settings… and product kits flagged as 'orderable' via the `PO from
            Order Entry` option at the PO field in the `Product Kit Settings`" — overridden by
            **`Include Orderable Products`** in Purchasing Control Settings.
Evidence:   Automatic Purchase Order Replenishment, /articles/15202193113492
Maps to:    **NEW — completes the purchase-status enumeration begun in batch 1 Finding 27**

> "Obsolete" is confirmed as the umbrella for `Dropped` and `Discontinued`. Note the inversion worth
> catching: a product flagged **orderable** — meaning it *can* be bought on demand — is by default
> **excluded** from automatic replenishment, on the reasoning that it is bought as sold rather than
> stocked. Get that flag wrong in migration and stock simply stops being replenished, silently.

### FINDING 54 — Which day a vendor's POs are built is a per-vendor weekday schedule inside End-of-Day
Invariant:  "During EOD processing, the system examines: **all records in the `Advanced Vendor
            Settings` for which the `Generate Automatic POs` field is active**, and then examines
            **the `Build POs` field for each vendor to determine if the Automatic PO Replenishment
            process should occur on that day**."
Invariant:  "`Build POs` – Use this field to **select the days of the week** on which to generate
            automatic purchase orders for a vendor."
Output branch: "If the `Automatically Hold POs` field is selected for the vendor… EOD generates a
            report showing **only the detailed calculations** with a notation: **`Purchase Order
            Number: On Hold`**. If `Automatically Hold POs` is not selected, the report creates
            **one purchase order for each vendor for each warehouse** for items with a Quantity to
            Order greater than zero."
Review path: "The buyer can review the data and decide whether to create a purchase order. Purchase
            orders can then be created via Purchase Order entry. The process can also be run on-demand
            and purchase orders can be created via the **Actions button on the `Items for
            Replenishment` screen**."
Evidence:   Report Automatic Purchase Order Replenishments, /articles/15202552856340;
            Automatic Purchase Order Replenishment, /articles/15202193113492
Maps to:    **NEW**

> Note the documentation conflict hiding in plain sight. `Automatic Purchase Order Replenishment`
> describes `Automatically Hold POs` as *placing the created POs on hold so you can review them*;
> `Report Automatic Purchase Order Replenishments` says that when it is set, **no purchase order is
> created at all** — the report prints "`Purchase Order Number: On Hold`" as a placeholder and a
> buyer creates the order by hand. Those are different behaviours. The vendor's **`Build POs` weekday
> mask** is the real scheduling mechanism, and it means purchasing volume is lumpy by design: a
> vendor set to Monday only accumulates six days of demand.

### FINDING 55 — Delivery date on an auto-generated PO is header-level or line-level depending on a vendor setting
Invariant:  "Each item on an automatic purchase order has its own delivery date calculated using a
            standard hierarchy to obtain an **ATP** date **when the `Default Requested Date` field in
            `Advanced Vendor Setting` is set to `Use Vendor Lead Days`**. In this case, **the purchase
            order header contains the delivery date of the item on the purchase order that is
            furthest in the future.** However, when the `Default Requested Date` field is set to
            **`Use Today's Date`**, **only the purchase order's creation date is used**, meaning that
            the purchase order's individual line item delivery dates are not considered."
Invariant:  "**NOTE: Manually-created purchase orders use only one date for the entire purchase order**,
            which is the date furthest in the future from among its lines."
Evidence:   Automatic Purchase Order Replenishment, /articles/15202193113492
Maps to:    **NEW**

> **Automatic and manual purchase orders do not have the same date model.** Auto POs can carry
> per-line delivery dates with a max-rollup on the header; manual POs carry one date. So the same
> data structure means different things depending on how the order was created, and any promise-date
> logic downstream has to know which. `ATP` (available to promise) appears here for the first time and
> its "standard hierarchy" is referenced but **not given**.

### FINDING 56 — Net Demand is a fourth availability formula, different again from NET AVAIL
Invariant (verbatim): "**`Net Demand = (True Demand + Minimum/Safety Stock Demand) - Quantity on Hand
            - Quantity Incoming`**"
            "**True Demand** - Product needed to fill all outstanding orders. From the number of
            scheduled days out, it is determined how many pieces are needed to fill all the orders…"
            "**Minimum/Safety Stock Demand** … can be set in **`District and Regional Product
            Settings`, `Warehouse Inventory Settings`, and `Advanced Product Settings`**."
            "**Quantity Incoming** - The quantity of that product coming in on **unlinked purchase
            orders, transfers, and returns**." — "The inclusion of returns is controlled via the
            **`Include Returns in Availability`** setting." — "**All purchase orders are considered,
            including those on hold.**"
Evidence:   Replenish Inventory for Current Back Order Needs Overview, /articles/15202193282580
Maps to:    **NEW — and it is the fourth distinct availability calculation in this run**

> The audit has now found four different formulas for "how much do we have":
> **`NET AVAIL = QOH - RES - FLR - AI`** (batch 1, FAQ) · the unlabelled forward projection beside it ·
> **`Units Available = Warehouse QOH – Warehouse Quantity Committed`** (Finding 46) ·
> and **Net Demand** here. They use different terms, different exclusions and different settings.
> Minimum/safety stock alone resolves across **three** settings files with no stated precedence — the
> only hierarchy in this batch that is *not* spelled out. For a rebuild this is the headline: **there
> is no single definition of availability in STORIS**, and picking one will change purchasing
> behaviour whichever one we pick.

### FINDING 57 — Linking a PO line to a sales order can overwrite the PO's special-order details, unless it has been printed
Invariant:  "If linking an existing purchase order line to a special order line on a sales order, the
            system checks to see if the **special order information matches**. If it does not match,
            a warning message displays and you have the option of continuing… **If you answer Yes to
            continue, the special order information from the sales order line is copied to the
            purchase order line.** If the **purchase order has already been printed**, and the special
            order information does not match, a message displays stating that the purchase order has
            been printed and that **the linkage is not allowed**."
Fields:     Quantity Available · Order · Quantity Linked · Customer · Open Sales Quantity · Product
Evidence:   Sales Order Linkage Screen, /articles/15202208346260
Maps to:    **W-042 — a third, narrow propagation path**

> A fourth appearance of **printing as a state change that removes options** (batch 1: comments,
> editing, reprints; here: linkage). And the copy direction is sales order → purchase order, on
> operator confirmation, silently overwriting whatever the PO said. Combined with Finding 50, the
> picture is consistent: **STORIS treats "printed/transmitted" as the point after which the purchase
> order is a commitment to the vendor and stops accepting automatic amendment.**

### FINDING 58 — Manual PO assembly groups requests on four keys and silently discards what you do not select
Grouping keys (verbatim): "**vendor · vendor ship-from · receiving location · delivery date**"
Invariant:  "To include a line item in the purchase order, **double-click in the `Add` column so that
            a plus sign (`+`) appears**… As you select lines, **the total shipping weight, volume, and
            cost update**."
Invariant:  "If you chose to leave one or more line items un-selected, those items now appear in the
            grid. You can create other purchase orders for them as described above, **or click on
            `Exit` to abandon the line items.**"
Volume limits: `Advanced Vendor Settings` → **`Volume Limit on Replenishment POs`** "**overrides** the
            `Shipping Volume Limit Per PO` setting in the `Replenish Inventory for Current Back Order
            Needs` process." · `Advanced Product Settings` → "**The `Shipping Volume` setting must be
            set properly or else it is valued at 0 (zero).**"
Evidence:   Assign Products to Purchase Orders, /articles/15202192109844;
            Replenish Inventory for Current Back Order Needs Overview, /articles/15202193282580
Maps to:    **NEW**

> Purchasing requests are ephemeral: **`Exit` abandons them with no queue and no record.** The four
> grouping keys are effectively the identity of a purchase order in this system. And the volume-limit
> note is a live data-quality trap — **a product with no `Shipping Volume` counts as zero volume**, so
> it never contributes to a volume-limited PO split and can silently overfill a truck.

---

## C. Screen and field inventory

**Replenish Stock Inventory Based on Sales Rate** — *General*: Warehouse Location · Vendor · Product ·
Vendor Model · Vendor Ship-From · Group · Category · Collection · **Buying Group**.
*Calculations*: **Variance Percent** · **Days for Replenishment** · **Sales to Use for Replenishment
Calculations**. *Inclusions*: **Reason Codes** · **Include Overstocks** · **Include Service Items**.
*Other*: Sort Criteria. *Output*: Send Output to · Export Path. Actions.
"This process is available as a scheduled process via `Schedule a Process`."

**Replenish Inventory for Current Back Order Needs** — *General*: **Replenishment Type** ·
**Create PO by** · Product · Product Group · Product Category · Vendor · Location ·
**Days for Replenishment**. *Sales Order Options*: **Fulfillment Status** · **Include for
Replenishment** · **Shipping Limit Volume Per PO**. *Stock Replenishment Options*: **Low Stock
Levels** · **Include Floor Sample Quantities** · **Include Returns In Availability**. Grid.
"**This process only allows one location to be run at a time.** To run for multiple locations, simply
set up each location as a separate scheduled process via `Schedule a Process`."

**Items for Replenishment Screen** — grid: Product · Vendor Product · **Required** · **Additional
Required** · **Available** · **Net PO** · Volume · **Order Qty** · **As-Is Qty** · **Last Sale Date**.
Plus Product · Order Quantity · Actions. Double-click pulls additional information.

**Items for Replenishment Actions Menu** — **Create Purchase Order** *(prompt: "Do you want to save the
changes you made? Yes No Cancel"; on Yes: "Purchase Order assigned number NNNNNNN")* · **Rebuild List**
*("reset order quantities for the current session")* · **Print Report** · **Product File Maintenance**
*(access to Advanced Product Settings; requires security clearance via `Create a User`, overridable at
the Actions button "if you have proper security clearance")*.

**Report Automatic Purchase Order Replenishments** — columns: **Minimum Weeks Supply · 4-Week Rate ·
Units Required · Units Avail · Net PO · Lead Days · Addl Required · Quantity to Order ·
4 Month Avg Unit · 12 Month Avg Unit · GMROI · Turns** · Purchase Order Number.

**Sales Order Linkage Screen** — Quantity Available · Order · **Quantity Linked** · Customer ·
**Open Sales Quantity** · Product · Grid.

**Assign Products to Purchase Orders** — grid with **`Add` column (`+`)**; running totals of shipping
weight, volume and cost; Save creates the PO; Exit abandons.

**List Previous Open Purchase Orders** — Purchase Order · **Quantity Due** · **Sched Dlvy Date** ·
Location. Product field auto-populates from the Items for Replenishment screen and is inactive.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `Generate Automatic POs` | Advanced Vendor Settings → Auto PO Replen | Vendor participates in auto replenishment |
| **`Build POs`** | Advanced Vendor Settings → Auto PO Replen | **Weekday mask deciding which days EOD builds this vendor's POs** |
| `Automatically Hold POs` | Advanced Vendor Settings → Auto PO Replen | Report-only vs create-and-hold — **the two articles disagree** |
| `Weekly Sales Rate Calculation` | Advanced Vendor Settings | Number of weeks in the sales rate |
| `First / Second Average Units Period` | Advanced Vendor Settings | The two informational average-units columns (months) |
| `Variance Percentage` + `Variance Starting/Ending Date` | Advanced Vendor Settings | **Date-bounded manual forecast multiplier** (100 = as-is) |
| `Minimum Stock Days` (+ Group / Category Exceptions) | Advanced Vendor Settings → General | Units Required; 3-level hierarchy |
| `Minimum Sales Rate` | Advanced Vendor Settings | **Silent exclusion floor** — slow items never appear |
| `Lead Days` / `Purchase Lead Days` | Advanced Vendor Settings (+ 5 other files) | Additional Units Required; 6-level hierarchy |
| `Include All Back Orders` | Advanced Vendor Settings | Switches the entire Net PO branch |
| `Volume Limit on Replenishment POs` | Advanced Vendor Settings | **Overrides** the routine's own volume limit |
| `Default Requested Date` | Advanced Vendor Settings | `Use Vendor Lead Days` (per-line ATP) vs `Use Today's Date` |
| `Sort Criteria` | Advanced Vendor Settings | Replenishment report ordering |
| `Default Buyer ID` | **Advanced Regional Vendor Settings** → PO Replenishment | Buyer on auto-generated POs |
| `Unit Sales Rate Calculation` | Purchasing Control Settings | **Written vs delivered** basis for every sales rate |
| `Include Store Stock In Availability` | Purchasing Control Settings | Whether store stock counts as available |
| `Include Orderable Products` | Purchasing Control Settings | Overrides the orderable-product exclusion |
| `BACK ORDER REPLENISH - Comprehensive Replenishment` | Purchasing Control Settings | **Which replenishment modes users may pick** |
| `Exclude Weekends in Vendor Lead Days` | Purchasing Control Settings | Days Per Week = 5 or 7 |
| `SALES RATE REPLENISH - Utilize standard rounding…` | Purchasing Control Settings | Rounding of Required / Additional Required |
| `Next Purchase Order Number` (manual numbering) | Purchasing Control Settings | **Gates eSTORIS auto-PO creation** |
| `Layaway in Net Purchase Order` | **Inventory Control Settings** | Whether layaway is netted out of Net PO |
| `Include in Supply Calculation` | **Purchase Order Type Settings** | **Whether a PO type counts as incoming supply** |
| `PO From Order Entry` | Advanced Product Settings / Product Settings | Auto-create PO on insufficient stock |
| `Minimum Order Quantity` (**Costing page**) | Advanced Product Settings | Below it ⇒ replenishment PO on hold |
| `Minimum Stock Quantity` (**Settings page**) | Advanced Product Settings | Below it ⇒ PO on hold (batch 1) |
| `Shipping Volume` | Advanced Product Settings | **Zero if unset** — breaks volume-limited PO splitting |
| `From Enter Sales Order; insufficient Component quantity` | Product Kit Settings | Auto-create PO for hard-kit masters |
| `Purchase Order/Automatically Create` · `Purchase Order/Assignment Required` | Special Order Control Settings | Auto-create / force reserve; **Assignment Required overrides user permissions** |
| `Create a PO for Back Orderable Stock` | **Point of Sale Control Settings** | Prompt behaviour on insufficient stock |
| `Allow Auto PO Creation` | **Web Control Settings** | eSTORIS auto-PO (with two other conditions) |
| `Location Type` · `Replenishment Location` | **Warehouse/Store Location Settings** | Which locations replenish which |
| `Primary Replenishment Warehouse` | **Region Settings** | Which locations' sales roll into the rate |
| minimum/safety stock | District and Regional Product Settings · Warehouse Inventory Settings · Advanced Product Settings | **Three files, no stated precedence** |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| `Create replenishment purchase order not on hold` | Purchasing Security | **Inverted** — blank ⇒ replenishment POs held |
| `Create special-order purchase orders within POS entry` | Purchasing Security | Special-order PO from sales entry |
| `Create stock product purchase orders within POS entry` | Purchasing Security | Stock PO from sales entry |
| `Electronically submit (EDI) purchase orders within POS entry` | Purchasing Security | EDI transmission from sales entry |
| `Allow Purchase Order Creation` | User / User Group | **Overridden by `Purchase Order/Assignment Required`** |
| (Product File access) | `Create a User` | Reaching Advanced Product Settings from the replenishment Actions menu; **overridable at the Actions button** |

---

## F. State machines and enumerations

**Replenishment engines** — `Replenish Stock Inventory Based on Sales Rate` (forecast, EOD) ·
`Replenish Inventory for Current Back Order Needs` (demand, per location).
**Back-order replenishment modes** — **Comprehensive** *(uses Net Demand; excludes the other two)* ·
**Allocated Order** *(linked POs; complements Stock Level)* · **Stock Level** *(unlinked POs)*.
*Terminology drift:* the routine article calls the second mode **`Allocated Stock`**.
**Products excluded from auto replenishment** — special-order · obsolete (`Dropped`, `Discontinued`) ·
non-inventory · kit-master; plus orderable products and orderable kits unless `Include Orderable
Products`.
**Sales rate basis** — written (`BTA` file) · delivered (`PRODUCT.HISTORY` file, monthly, approximate).
**Days Per Week** — 5 (weekends excluded) · 7.
**Delivery status values seen** — `ASAP` (also `CWC` from batch 1, still undefined).
**`Default Requested Date`** — `Use Vendor Lead Days` · `Use Today's Date`.
**Availability formulas in play** — `NET AVAIL = QOH - RES - FLR - AI` · the unlabelled forward
projection · `Units Available = Warehouse QOH – Warehouse Quantity Committed` ·
`Net Demand = (True Demand + Min/Safety Stock Demand) - QOH - Quantity Incoming`.
**Order quantity** — `Quantity To Order = Units Required + Additional Units Required - Units Available - Net PO`.
**GMROI** — `Total Year's Gross Profit $ / (Year's Avg Units on Hand * Year's Avg Unit Cost $)`.
**Turns** — `Year's Cost of Goods Sold $ / (Year's Avg Units on Hand * Year's Avg Unit Cost $)`.
**PO grouping keys (manual assembly)** — vendor · vendor ship-from · receiving location · delivery date.

---

## G. Sequencing rules

1. End-of-Day examines vendors with `Generate Automatic POs` set, then checks each vendor's
   **`Build POs` weekday mask** before doing anything.
2. With `Automatically Hold POs` set, EOD produces **calculations only**, annotated
   `Purchase Order Number: On Hold`; a buyer creates the order afterwards.
3. Without it, EOD creates **one PO per vendor per warehouse** for items with Quantity to Order > 0.
4. Items below `Minimum Sales Rate` are excluded from the calculation entirely.
5. **Purchase orders on hold are counted as supply** in both replenishment engines.
6. A PO type without `Include in Supply Calculation` does not reduce the order quantity.
7. `Comprehensive` must not be run alongside `Allocated Order` / `Stock Level`.
8. `Replenish Inventory for Current Back Order Needs` runs **one location at a time**; multiple
   locations require separate scheduled processes.
9. Replenishment POs go on hold if the security setting is blank **or** the quantity is below
   `Minimum Order Quantity`.
10. Sales order → PO propagation happens **only** for special-order/non-inventory products **before
    transmission**; after transmission everything is manual, and an increase demands a new PO.
11. Linking a PO line to a mismatched special order copies the sales order's details onto the PO —
    **unless the PO has been printed**, in which case linkage is refused.
12. Unselected purchasing requests on `Assign Products to Purchase Orders` are **abandoned on Exit**.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Regional Processing - Reporting Rules`** — named again; affects the replenishment routine's
  output ("read the Report Exceptions portion"). Still unread. Now blocking two batches.
- `Purchase Order Type Settings` — holds `Include in Supply Calculation`, the flag that decides
  whether an order counts as supply. **High priority.**
- `Advanced Vendor Settings` and `Advanced Regional Vendor Settings` — the single most referenced
  settings files in this batch; every hierarchy terminates in them.
- `Advanced Vendor Category and Group Exception Settings - Auto-Fill Days` — `auto-fill days` and
  `fill days` are used in the Net PO branch and never defined elsewhere.

**Documented but ambiguous**
- **The `Addl Required` formula contradicts itself between two articles** (Finding 47), including an
  unexplained `+ 0.05` constant. **This must be settled against the live system.**
- **`Automatically Hold POs` behaviour contradicts itself between two articles** (Finding 54):
  create-then-hold, or do not create at all.
- "**`Units Sold = Units Returned`**" — printed as an equality; almost certainly means minus.
- **`Allocated Stock` vs `Allocated Order`** — the same replenishment mode under two names.
- **Minimum/safety stock resolves across three settings files with no stated precedence** — the only
  unspecified hierarchy in this batch.
- **`ATP`** — "a standard hierarchy to obtain an ATP date" is referenced; the hierarchy is not given.
- **`CWC`** — still undefined. `ASAP` is now known to be a delivery status.
- **`Reason Codes` · `Include Overstocks` · `Include Service Items` · `Sales to Use for Replenishment
  Calculations` · `Days for Replenishment` · `Fulfillment Status` · `Include for Replenishment` ·
  `Low Stock Levels` · `Create PO by` · `Restrict by Fill`** — all named, none described.
- **`As-Is Qty` and `Last Sale Date` on the Items for Replenishment grid** — displayed but with no
  stated role in the calculation.
- Whether the **`Variance Percentage`** override is recorded anywhere on the resulting purchase order.
- Whether `Rebuild List` discards a buyer's manual quantity edits permanently — "reset order
  quantities for the current session" implies yes, but session scope is not defined.
- Whether `Include Store Stock In Availability` and `Include Store Stock Availability in Calculations`
  (batch 1's Purchasing Control Settings list) are the same field. Two names, same page.

**Inferences (not in section B)**
- The `+ 0.05` constant exists to force a round-up; the article's own worked example only makes sense
  that way. Not stated.
- `True Demand`'s "number of scheduled days out" is presumably `Days for Replenishment`; not stated.
- The eSTORIS manual-numbering condition is presumably because eSTORIS must reserve a number before
  the order is committed; the article gives no reason.
- `Restrict by Fill` and `auto-fill days` presumably describe the same fill-window concept; not stated.

---

## I. Unknown unknowns

- **Two mutually exclusive replenishment engines**, and a control setting whose job is to stop you
  running incompatible modes.
- **A six-level lead-days hierarchy and a three-level minimum-stock-days hierarchy** inside a single
  order-quantity equation.
- **Two published, mutually inconsistent versions of that equation.**
- **A `+ 0.05` fudge constant** in a production order-quantity formula.
- **The help center admitting a calculation is "a guesstimate"** because the source file is monthly.
- **Raw file names — `BTA`, `PRODUCT.HISTORY`** — the only ones in the audit so far.
- **A per-vendor weekday mask** deciding when purchase orders are generated.
- **A date-bounded forecast multiplier** (`Variance Percentage`) a buyer can set per vendor.
- **A silent exclusion floor** (`Minimum Sales Rate`) below which items never appear.
- **Purchase orders on hold counting as supply** while being unable to be sent.
- **Layaway netting controlled from Inventory Control Settings** inside a purchasing calculation.
- **Inbound transfers counted as purchasing supply.**
- **PO type carrying a supply-inclusion flag.**
- **Stock products having no sales-order → PO propagation at all.**
- **A quantity increase after transmission requiring a whole new purchase order.**
- **eSTORIS auto-PO creation gated on a PO-numbering setting.**
- **`Assignment Required` overriding user security.**
- **Four different availability formulas** with no single definition.
- **Products with unset `Shipping Volume` silently counting as zero.**
- **Purchasing requests abandoned with no record on `Exit`.**
- **Auto and manual POs having different date models.**
- **An eighth automatic hold source, and a second inverted permission.**

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Automatic PO Replenishment | Forecast-driven engine; runs in EOD per vendor weekday mask |
| Manual PO Replenishment | `Replenish Inventory for Current Back Order Needs`; demand-driven, per location |
| Comprehensive / Allocated Order / Stock Level | The three back-order replenishment modes; Comprehensive excludes the others |
| Net Demand | `(True Demand + Min/Safety Stock Demand) - QOH - Quantity Incoming` |
| True Demand | Pieces needed to fill all outstanding orders within the scheduled days out |
| Units Required | `Minimum Weekly Supply × Sales Rate` |
| Additional Units Required | Lead-time cover; formula disputed between two articles |
| Net PO | Warehouse quantity on order, net of a vendor-flag-dependent branch |
| Sales Rate | `Total Units Sold ÷ Number of Weeks`, on a written or delivered basis |
| BTA | File behind written-business sales rates |
| PRODUCT.HISTORY | File behind delivered-business sales rates; monthly, so weekly rates are approximate |
| Minimum Sales Rate | Vendor-level floor; slower items are excluded from replenishment entirely |
| Variance Percentage | Date-bounded forecast multiplier; 100 = historic rate |
| Build POs | Per-vendor weekday mask for automatic PO generation |
| Include in Supply Calculation | PO type flag deciding whether that order offsets demand |
| ATP | Available-to-promise date; hierarchy referenced but not documented |
| Auto-fill days / fill days | Delivery window used in the Net PO branch; undefined |
| GMROI | `Year's Gross Profit $ ÷ (Year's Avg Units on Hand × Year's Avg Unit Cost $)` |
| Turns | `Year's COGS $ ÷ (Year's Avg Units on Hand × Year's Avg Unit Cost $)` |
| Orderable | Product bought on demand rather than stocked; excluded from auto replenishment by default |
| Obsolete | Umbrella for purchase statuses `Dropped` and `Discontinued` |

---

## Contract adjudication — batch 3

| Contract | Verdict | Basis |
|---|---|---|
| **W-042** | **CONTRADICTED for stock products; CONFIRMED conditionally for untransmitted special orders** | F50 — supersedes my batch-1 Finding 11 reading |
| **W-005 / W-006** | **CONFIRMED, enlarged** | Seven settings across six files plus three permissions and an override chain (F51) |
| **W-041** | *(settled batch 2)* | — |
| **W-052 / W-053** | **not documented in this section** | Replenishment articles state no GL effects |
| **W-055 / W-056** | **relevant, pending** | Availability and demand definitions found (F56) but no single authority |

---

## Next — batch 4: EDI, containers and vendor transmission
