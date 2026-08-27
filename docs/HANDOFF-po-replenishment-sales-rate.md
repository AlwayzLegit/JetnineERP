# Handoff: Sales-Rate Purchase Order Replenishment

**Target:** LA-Mattress-ERP
**Type:** Feature spec + pseudocode + acceptance tests
**Modeled on:** STORIS ERP "Replenish Stock Inventory Based on Sales Rate" (Merchandising → Purchasing → Purchase Order Replenishment)
**Status:** Ready to implement. Read "Open Questions" before coding — several rules are underspecified in the source docs and need a decision.

---

## 0. Source material

All content below is dissected from these STORIS help-center articles (Aug 2026 capture):

| # | Article | ID |
|---|---------|-----|
| 1 | Replenish Stock Inventory Based on Sales Rate | 15202208983572 |
| 2 | Replenish Stock Inventory Based on Sales Rate Routine — Calculation Information | 15202192345748 |
| 3 | Automatic Purchase Order Replenishment | 15202193113492 |
| 4 | Items for Replenishment Screen | 15202207766420 |
| 5 | Purchasing Control Settings | 15186502233492 |
| 6 | Advanced Vendor Settings | 15243030215572 |
| 7 | Output Settings | 15202105620756 |

Articles 5 and 6 publish field *names* but not field *descriptions*, so several settings below are named accurately but their exact semantics are inferred. Those are flagged `⚠️ INFERRED`.

This handoff is intentionally stack-agnostic. Discover the repo's own conventions (ORM, service layer, job runner, test framework, naming) and follow them; nothing here prescribes a technology.

---

## 1. What the feature does

Given a **vendor** and a **replenishment warehouse**, compute for every eligible product a **recommended order quantity** driven by that product's recent **weekly sales rate**, netted against what is already on hand and already on order. Present the results for buyer review, let the buyer override quantities, and generate a purchase order from the rows with a positive quantity.

Three execution modes, all sharing one calculation engine:

1. **End-of-day batch** — runs automatically per vendor, gated by a day-of-week schedule. May auto-create POs or just produce a report.
2. **On-demand** — a user fills a criteria screen and runs it interactively.
3. **Scheduled process** — the same run queued through the generic job scheduler.

The critical design constraint from STORIS: **all three modes must produce identical numbers.** Build one pure calculation function; the three modes differ only in how criteria are supplied and what happens to the output.

---

## 2. Core equation

```
QuantityToOrder = UnitsRequired + AdditionalUnitsRequired - UnitsAvailable - NetPO
```

Each term below. **Every hierarchy is "first match wins", listed most-specific first.**

### 2.1 UnitsRequired — "Required" column

```
UnitsRequired      = MinimumWeeklySupply * SalesRate
MinimumWeeklySupply = MinimumDaysSupply / 7          # always 7, not the weekend-aware divisor
```

`MinimumDaysSupply` resolution hierarchy:

1. Advanced Vendor Settings → **Group Exception** → Minimum Stock Days
2. Advanced Vendor Settings → **Category Exception** → Minimum Stock Days
3. Advanced Vendor Settings → **Minimum Stock Days** (vendor default)

`MinimumStockDays = 0` is a meaningful configuration: it means *do not order for forecasted sales* — only back-ordered demand should drive the quantity.

Subject to the rounding setting (§2.6).

### 2.2 AdditionalUnitsRequired — "Additional" column

This is the lead-time buffer: sales expected to occur while the PO is in transit.

```
AdditionalUnitsRequired = AdditionalWeeklySupply * SalesRate
AdditionalWeeklySupply  = LeadDays / DaysPerWeek
DaysPerWeek             = 5 if PurchasingControl.ExcludeWeekendsInVendorLeadDays else 7
```

`LeadDays` resolution hierarchy:

1. Vendor Ship-From Settings → Purchase Lead Days
2. Regional Vendor Settings → Lead Time  *(only when regional processing is active)*
3. Advanced Vendor Settings → **Group Exception** → Lead Days
4. Advanced Vendor Settings → **Category Exception** → Lead Days
5. Advanced Vendor Settings → Purchase Lead Days
6. Vendor Settings → Average Lead Time

Note the divisor asymmetry: **§2.1 always divides by 7; §2.2 divides by 5 or 7.** This is not a typo in the source — minimum stock days are calendar days, lead days may be business days. Preserve it.

`LeadDays = 0` has the same "no forecast ordering" meaning as `MinimumStockDays = 0`.

Subject to the rounding setting (§2.6).

### 2.3 SalesRate

A **weekly** rate, expressed in units per week.

```
SalesRate = (UnitsSold - UnitsReturned) / WeeksInWindow * (VariancePercent / 100)
```

**Written vs. delivered.** `PurchasingControl.UnitSalesRateCalculation` selects the basis:

- *Written* — order-write activity. STORIS reads its BTA (booked transaction activity) file. Week-level granularity, exact.
- *Delivered* — fulfilled activity. STORIS reads PRODUCT.HISTORY, which stores **monthly** buckets, so the weekly figure is explicitly documented as an approximation. If LA-Mattress-ERP keeps day-level delivery records, this becomes exact — a genuine improvement over STORIS, but note it in the report so buyers understand why numbers differ from the legacy system during parallel run.

**Window selection.** `WeeksInWindow` comes from Advanced Vendor Settings → **Weekly Sales Rate Calculation** (number of weeks). The criteria-screen field **Sales to Use for Replenishment Calculations** chooses which window:

| Option | Window |
|--------|--------|
| Use This Year's Prior Week Sales | `[today - X weeks, today]` |
| Use Last Year's Subsequent Sales | `[today - 1 year, today - 1 year + X weeks]` |

The second option is seasonal forecasting: for a seasonal category, what sold in the *coming* weeks last year predicts the coming weeks better than what sold last month.

**Variance.** A multiplier expressed as a percentage where 100 = baseline.

- Screen field `Variance Percent`: integer 0–999, blank = no adjustment (treat blank as 100).
- Vendor field `Variance Percentage` (Advanced Vendor Settings → Auto PO Replen): default 100, and it applies **only within** `Variance Starting Date` … `Variance Ending Date`. Sales history outside that date range is not scaled.
- 50 = project at half the historic rate; 200 = project at double.

**Regionalization.** When regional processing is active, units sold are summed across **all locations in the region** of the replenishment warehouse, not just the warehouse. The region is identified by the Primary Replenishment Warehouse field in Region Settings.

**Store stock.** `PurchasingControl.IncludeStoreStockInAvailability` — when set, store inventory counts toward availability (§2.4), not toward the sales rate.

### 2.4 UnitsAvailable — "Available" column

```
UnitsAvailable = WarehouseQtyOnHand - WarehouseQtyCommitted
                 (+ store stock availability if PurchasingControl.IncludeStoreStockInAvailability)
```

`Committed` = physically present but already spoken for by a reserved sales order.

### 2.5 NetPO — "Net PO" column

The most complex term. Start from incoming supply, then adjust for uncommitted demand.

```
NetPO = WarehouseQtyOnOrder
```

Base rules:

- POs **on hold are included** as supply. (Deliberate: a held PO is still going to arrive.)
- A PO contributes to supply **only if its PO Type has `Include in Supply Calculation` checked.** PO types without that flag are invisible to this calculation. Model this as a per-PO-type boolean.
- Unreserved merchandise is *not* included in the base figure; it enters through the adjustments below.

Then branch on Advanced Vendor Settings → **Include All Back Orders**:

**Branch A — Include All Back Orders is CHECKED**

```
NetPO -= WarehouseQtyUncommitted
if InventoryControl.LayawayInNetPurchaseOrder:
    NetPO -= WarehouseQtyOnLayaway
```

Sold-but-unreserved demand is subtracted wholesale, with no date filtering.

**Branch B — Include All Back Orders is UNCHECKED**

```
NetPO -= sold-but-not-reserved lines where
             (estimated/scheduled delivery date <= today + orderItem.AutoFillDays)
          OR (delivery status == ASAP)
NetPO += inbound transfers arriving within fill days
```

Transfers with **no scheduled date** (e.g. CWC transfers) are excluded from processing entirely.

**Sign convention — read this carefully.** `NetPO` is subtracted in the master equation, so a *negative* NetPO *increases* the quantity to order. That is how back-ordered demand drives ordering when `MinimumStockDays = 0` and `LeadDays = 0` reduce the forecast terms to zero. Do not clamp `NetPO` at zero. Write a test that locks this in (see T-06).

**Days for Replenishment** narrows which orders are considered:

- Integer 0–999, or blank.
- Only orders whose delivery date is **≤ today + N days** are considered.
- Screen value **overrides** the Advanced Vendor Settings value.
- Cannot be used when `Include All Back Orders` is checked — that setting takes all back orders regardless of date. Enforce this as a validation error on the criteria screen, not a silent no-op.

### 2.6 Rounding

`PurchasingControl."SALES RATE REPLENISH - Utilize standard rounding for Recommended Order Quantity"` controls rounding of the **Required** and **Additional** columns (not the final quantity, per the source).

- Checked → standard half-up rounding to whole units.
- Unchecked → ⚠️ INFERRED: truncate toward zero. The source does not state the alternative. Verify against a STORIS instance before go-live.

Round at the column level, then sum — do not round the final result. This matters: `round(6.6) + round(6.6) = 14`, but `round(6.6 + 6.6) = 13`.

---

## 3. Eligibility and filtering

### 3.1 Vendor gate

A vendor is eligible only if **all** hold:

- Exists in Vendor Settings.
- Exists in Advanced Vendor Settings.
- Advanced Vendor Settings → Auto PO Replen → **Generate Automatic POs** is checked.
- For EOD runs only: today's weekday is selected in **Build POs** (a day-of-week set).

Vendor is a **mandatory** field on the criteria screen. There is no all-vendors run.

### 3.2 Warehouse gate

- Location Type must be **warehouse**, not store.
- The location must appear in the **Replenishment Location List** (Warehouse Location record → PO Replenishment tab).
- A single location can replenish itself — enter its own code in its own list. Support that; small operations need it.
- Regional processing may restrict which locations a given user can even see in the picker.

### 3.3 Product exclusions — never replenished

- Special-order products
- Obsolete products (purchase status `Dropped` or `Discontinued`)
- Non-inventory products
- Kit masters

**Kit components ARE replenished.** The kit master is a bundle; its components are real stock. Get this right — it is an easy bug.

### 3.4 Product exclusions — overridable

- Products flagged "orderable" via `PO from Order Entry` (Advanced Product Settings / Product Settings)
- Product kits flagged "orderable" via the `PO from Order Entry` option on the PO field (Product Kit Settings)

Both are excluded **unless** `PurchasingControl."SALES RATE REPLENISH - Replenish Orderable Products"` is checked.

### 3.5 Sales-rate floor

Any product whose computed weekly sales rate is **below** Advanced Vendor Settings → **Minimum Sales Rate** is dropped from the report entirely — not shown with a zero, not shown as an overstock. Apply this filter **after** variance is applied. ⚠️ INFERRED: strict `<` vs `<=`; source says "lower than", implying strict.

### 3.6 Criteria-screen filters

| Field | Behavior |
|-------|----------|
| Product | Multi-select. Blank = all products. |
| Vendor Model | Blank = all. **Mutually exclusive with Product** — the docs say use one or the other, not both. Enforce it. |
| Vendor Ship-From | Disabled until a Vendor is chosen. Blank = all ship-froms. |
| Group / Category / Collection / Buying Group | Single-select each. Blank = all. |
| Reason Codes | Multi-select. Matching items surface in the **As-Is Quantity** column — a buyer aid for spotting as-is stock that may not need a PO. Does not filter rows. |
| Include Overstocks | Unchecked = only rows with `QuantityToOrder > 0`. Checked = all rows, including negatives, so the buyer can spot overstock. **Even when checked, only rows > 0 are written to the PO.** |
| Include Service Items | Checked = include items with service status ≥ 2. |
| Sort Criteria | Product / Group / Category / Vendor Model. |

---

## 4. Screens

### 4.1 Criteria screen

Sections: **General** (Warehouse Location, Vendor*, Product, Vendor Model, Vendor Ship-From, Group, Category, Collection, Buying Group) · **Calculations** (Variance Percent, Days for Replenishment, Sales to Use for Replenishment Calculations) · **Inclusions** (Reason Codes, Include Overstocks, Include Service Items) · **Other** (Sort Criteria) · **Output** (Send Output To, Export Path — read-only, set via an Output Settings action).

`Run` builds the candidate list and opens the results screen.

### 4.2 Items for Replenishment screen

Grid columns: `Product` · `Vendor Product` · `Required` · `Additional Required` · `Available` · `Net PO` · `Volume` · `Order Qty` · `As-Is Qty` · `Last Sale Date`

Selecting a row reveals a detail panel: description, vendor model, sales rate, lead days, **average units sold for two configurable periods** (First / Second Average Units Period, in months, from Advanced Vendor Settings; excludes the current period), **GMROI**, and **turns**.

`Order Qty` is editable — it defaults to the calculated value and the buyer can override it. For overstocks it defaults to zero or a negative number.

Actions:

| Action | Behavior |
|--------|----------|
| **Create Purchase Order** | Creates a PO from rows with `OrderQty > 0`. Prompts to save, then displays the assigned PO number. |
| **Rebuild List** | Resets order-quantity overrides for the current session. |
| **Print Report** | Detailed calculation report for every selected item. |
| **Product File Maintenance** | Jumps to Advanced Product Settings for the selected product. |

Persist the buyer's overrides for the session only; `Rebuild List` discards them.

---

## 5. Purchase order creation

- Only lines with `OrderQty > 0` are written.
- If Advanced Vendor Settings → **Automatically Hold POs** is checked, the created PO gets the On-Hold flag.
- If the **Buying Group** feature is active (`PurchasingControl."GENERAL - Activate Buying Group"`), replenishment POs are created **without a buyer**, and the system keeps such a PO on hold until someone re-opens it and assigns a buyer. Regional installs can pre-empt this with Advanced Regional Vendor Settings → **Default Buyer ID**. Surface this clearly in the UI — a silently-held PO is a support ticket.
- ⚠️ INFERRED: Advanced Vendor Settings → **Volume Limit on Replenishment POs** presumably caps a replenishment PO by total volume (the grid has a `Volume` column). Semantics are not documented — decide and document the behavior (hard cap? split into multiple POs? warn only?).

### 5.1 Delivery dates

Driven by Advanced Vendor Settings → **Default Requested Date**:

- **Use Vendor Lead Days** — each line gets its own delivery date via the standard ATP-date hierarchy; the PO **header** date is the **furthest-future** line date.
- **Use Today's Date** — the PO creation date is used; individual line dates are not considered.

(For contrast: manually-created POs always use a single header date — the furthest-future among their lines.)

---

## 6. Settings inventory

Implement these as configuration; do not hardcode.

**Purchasing Control (system-wide)**
`Unit Sales Rate Calculation` (written | delivered) · `Sales Rate Replenishment Calculation` · `SALES RATE REPLENISH - Replenish Orderable Products` · `SALES RATE REPLENISH - Include Store Stock Availability in Calculations` · `SALES RATE REPLENISH - Utilize standard rounding for Recommended Order Quantity` · `GENERAL - Exclude Weekends in Vendor Lead Days` · `GENERAL - Activate Buying Group` · `LEAD DAYS CALCULATION - Override Lead Days if Purchase Order Date is Greater` · `GENERAL - Include As-Is Quantities in GMROI Calculation` · `BACK ORDER REPLENISH - Comprehensive Replenishment`

**Inventory Control (system-wide)**
`Layaway in Net Purchase Order`

**Advanced Vendor Settings → General**
`Minimum Stock Days` · `Lead Days` · `Auto-Fill Days` · `Lead Pad Days` · `PO Pad Days` · `Excess Stock Days` · `Volume Limit on Replenishment POs` · `Default Requested Date` · `Lead Days Calculation`
Each of the first five supports **Group Exceptions** and **Category Exceptions** overrides.

**Advanced Vendor Settings → Auto PO Replen**
`Generate Automatic POs` · `Automatically Hold POs` · `Weekly Sales Rate Calculation` · `Include All Backorders` · `Days for Replenishment` · `First Average Units Period` · `Second Average Units Period` · `Variance Starting Date` · `Variance Ending Date` · `Variance Percentage` · `Minimum Sales Rate` · `Sort Criteria` · `Build POs`

**Advanced Regional Vendor Settings → PO Replenishment**
All of the above plus `Default Buyer ID`.

**Warehouse/Store Location Settings**
General → `Location Type` · Purchasing → `Replenishment Location` list

**Vendor Settings** — `Average Lead Time`
**Vendor Ship-From Settings** — `Purchase Lead Days`
**PO Type Settings** — `Include in Supply Calculation`
**Region Settings** — `Primary Replenishment Warehouse`

---

## 7. Pseudocode

```
function run_replenishment(criteria, clock) -> ReplenishmentRun:

    vendor = load_vendor(criteria.vendor_id)          # mandatory
    require(vendor.advanced_settings.generate_automatic_pos)

    warehouse = load_location(criteria.warehouse_id)
    require(warehouse.type == WAREHOUSE)
    require(warehouse.in_replenishment_location_list())

    cfg  = load_purchasing_control()
    inv  = load_inventory_control()
    avs  = regional_override(vendor.advanced_settings, warehouse.region)

    # --- validation -------------------------------------------------
    if criteria.product_ids and criteria.vendor_model:
        error("Specify products or a vendor model, not both")
    if avs.include_all_back_orders and criteria.days_for_replenishment is not None:
        error("Days for Replenishment cannot be set when Include All Back Orders is on")

    days_for_replen = criteria.days_for_replenishment ?? avs.days_for_replenishment
    variance_pct    = criteria.variance_percent ?? 100

    # --- candidate set ----------------------------------------------
    products = select_products(vendor, criteria)                # group/category/collection/
                                                                # buying group/ship-from filters
        .exclude(special_order, non_inventory, kit_master)
        .exclude(purchase_status in [DROPPED, DISCONTINUED])
        .exclude_unless(cfg.replenish_orderable_products, flagged_po_from_order_entry)
        .exclude_unless(criteria.include_service_items, service_status >= 2)
    # kit COMPONENTS stay in

    rows = []
    for p in products:

        # ---- sales rate --------------------------------------------
        weeks  = avs.weekly_sales_rate_calculation
        window = criteria.sales_window == LAST_YEAR_SUBSEQUENT
                 ? [clock.today - 1y, clock.today - 1y + weeks]
                 : [clock.today - weeks, clock.today]

        locations = regional_processing_active
                    ? locations_in_region(warehouse.region)
                    : [warehouse]

        basis    = cfg.unit_sales_rate_calculation      # WRITTEN | DELIVERED
        sold     = units_sold(p, locations, window, basis)
        returned = units_returned(p, locations, window, basis)

        rate = (sold - returned) / weeks
        rate = apply_variance(rate, variance_pct, avs.variance_start, avs.variance_end)

        if rate < avs.minimum_sales_rate:
            continue                                   # dropped entirely

        # ---- required ----------------------------------------------
        min_days   = resolve(p, avs, "minimum_stock_days")     # group > category > vendor
        required   = round_qty((min_days / 7) * rate, cfg.standard_rounding)

        # ---- additional --------------------------------------------
        lead_days  = resolve_lead_days(p, vendor, criteria.ship_from, warehouse.region)
        dpw        = cfg.exclude_weekends_in_vendor_lead_days ? 5 : 7
        additional = round_qty((lead_days / dpw) * rate, cfg.standard_rounding)

        # ---- available ---------------------------------------------
        available = qty_on_hand(p, warehouse) - qty_committed(p, warehouse)
        if cfg.include_store_stock_in_availability:
            available += store_stock_availability(p, warehouse)

        # ---- net PO ------------------------------------------------
        net_po = qty_on_order(p, warehouse,
                              include_held = true,
                              po_types     = types_with(include_in_supply_calculation))

        if avs.include_all_back_orders:
            net_po -= qty_uncommitted(p, warehouse)
            if inv.layaway_in_net_purchase_order:
                net_po -= qty_on_layaway(p, warehouse)
        else:
            net_po -= sold_not_reserved(p, warehouse, days_for_replen,
                                        within_auto_fill_days = true,
                                        or_status = ASAP)
            net_po += inbound_transfers(p, warehouse, within_fill_days = true,
                                        exclude_unscheduled = true)
        # net_po may be negative — do NOT clamp

        qty = required + additional - available - net_po

        if qty <= 0 and not criteria.include_overstocks:
            continue

        rows.append(Row(p, required, additional, available, net_po,
                        volume = p.volume * max(qty, 0),
                        order_qty = qty,
                        as_is_qty = as_is_quantity(p, criteria.reason_codes),
                        last_sale_date = last_sale_date(p)))

    return ReplenishmentRun(rows = sort(rows, criteria.sort_criteria), ...)


function create_po(run, overrides, vendor, cfg):
    lines = [ (r.product, overrides.get(r.product, r.order_qty))
              for r in run.rows ]
             .filter(qty > 0)
    require(lines.non_empty)

    po = PurchaseOrder(vendor, warehouse = run.warehouse, lines = lines)

    if vendor.advanced_settings.default_requested_date == USE_VENDOR_LEAD_DAYS:
        for line in po.lines: line.delivery_date = atp_date(line)
        po.header_date = max(line.delivery_date for line in po.lines)
    else:
        po.header_date = clock.today

    if cfg.activate_buying_group:
        po.buyer = regional_default_buyer_id ?? null
        if po.buyer is null: po.on_hold = true          # buyer must be assigned later
    if vendor.advanced_settings.automatically_hold_pos:
        po.on_hold = true

    return po.save()
```

---

## 8. Acceptance tests

Build these as fixtures. Defaults unless a test says otherwise: `MinimumStockDays = 14`, `LeadDays = 21`, `ExcludeWeekends = false`, `WeeklySalesRateCalculation = 8 weeks`, `Variance = 100`, `MinimumSalesRate = 0`, standard rounding on, `IncludeAllBackOrders = false`, on hand 45, committed 15, on order 5, 80 units sold / 0 returned over 8 weeks (⇒ rate 10.0/wk).

| ID | Scenario | Expected |
|----|----------|----------|
| **T-01** | Baseline | Required `(14/7)*10 = 20`; Additional `(21/7)*10 = 30`; Available `45-15 = 30`; NetPO `5`; **Order Qty = 15** |
| **T-02** | `ExcludeWeekends = true` | Additional `(21/5)*10 = 42`; **Order Qty = 27**. Required stays 20 — the /7 in Required never changes. |
| **T-03** | `VariancePercent = 50` | rate 5.0; Required 10, Additional 15; **Order Qty = -10** → suppressed unless Include Overstocks; never written to a PO. |
| **T-04** | `VariancePercent = 200` | rate 20.0; Required 40, Additional 60; **Order Qty = 65** |
| **T-05** | `MinimumSalesRate = 12`, rate 10.0 | Row **absent from the report entirely** — not zero, not an overstock row. |
| **T-06** | `MinimumStockDays = 0`, `LeadDays = 0`, `IncludeAllBackOrders = true`, uncommitted 40, on hand 0, committed 0, on order 5 | Required 0; Additional 0; Available 0; NetPO `5 - 40 = -35`; **Order Qty = 35**. Locks the negative-NetPO sign convention. |
| **T-07** | T-06 plus `LayawayInNetPurchaseOrder = true`, layaway 10 | NetPO `5 - 40 - 10 = -45`; **Order Qty = 45** |
| **T-08** | Rounding: rate 3.3, `MinimumStockDays = 14`, `LeadDays = 14` | Standard rounding: `round(6.6) + round(6.6) = 7 + 7 = 14`. Assert the engine does **not** produce 13 by summing first. |
| **T-09** | Rounding off, same inputs as T-08 | Truncation: `6 + 6 = 12`. ⚠️ Confirm against a live STORIS instance first. |
| **T-10** | PO type without `Include in Supply Calculation`, 20 units on that PO | Those 20 do **not** count as supply; Order Qty rises by 20 vs. baseline. |
| **T-11** | PO on hold with 5 units | **Counts** as supply. Baseline result unchanged. |
| **T-12** | Kit master with replenishable components | Kit master absent; each component evaluated on its own. |
| **T-13** | Product with purchase status `Discontinued` | Absent. |
| **T-14** | Product flagged `PO from Order Entry`, `ReplenishOrderableProducts = false` / `true` | Absent / present. |
| **T-15** | `IncludeOverstocks = true`, three products with qty `15, -10, 0` | All three rows shown; `Create Purchase Order` writes **only** the qty-15 line. |
| **T-16** | Criteria has both `product_ids` and `vendor_model` | Validation error. |
| **T-17** | `IncludeAllBackOrders = true` and `DaysForReplenishment = 30` | Validation error, not a silent no-op. |
| **T-18** | Screen `DaysForReplenishment = 30`, vendor setting `60` | Screen value wins. |
| **T-19** | Inbound transfer with no scheduled date | Excluded from NetPO entirely. |
| **T-20** | `SalesWindow = LastYearSubsequent`, 8 weeks | Window is `[today-1y, today-1y+8w]`. Assert with a frozen clock. |
| **T-21** | Regional processing on, warehouse in region with 3 locations | Units sold summed across all 3, not just the warehouse. |
| **T-22** | Location Type = store | Run rejected. |
| **T-23** | Warehouse not in its own Replenishment Location List | Run rejected. |
| **T-24** | Warehouse listing itself in its own list | Accepted — self-replenishment is valid. |
| **T-25** | Vendor with `GenerateAutomaticPOs = false` | Run rejected. |
| **T-26** | EOD run, today not in `Build POs` | Vendor skipped. |
| **T-27** | `ActivateBuyingGroup = true`, no `DefaultBuyerID` | PO created with no buyer **and** on hold. |
| **T-28** | `AutomaticallyHoldPOs = true` | PO created on hold. |
| **T-29** | `DefaultRequestedDate = UseVendorLeadDays`, lines dated +14/+21/+30 | Header date = +30. |
| **T-30** | `DefaultRequestedDate = UseTodaysDate` | Header date = today; line dates ignored. |
| **T-31** | Same criteria run via EOD, on-demand, and scheduler | **Identical rows and quantities.** The single most important test in this suite. |
| **T-32** | Buyer overrides qty 15 → 40, then `Rebuild List` | Override discarded; qty back to 15. |

---

## 9. Open questions — decide before coding

1. **Returns in the sales rate.** Article 2 renders the definition as `Units Sold = Units Returned`, which is a documentation typo. Almost certainly `UnitsSold − UnitsReturned`. Confirm against a live instance; if returns are meant to be ignored, the recommendation is materially different for a mattress business with meaningful return rates.
2. **Rounding when the flag is off.** Truncate, floor, or banker's rounding? Undocumented.
3. **Delivered-sales granularity.** STORIS approximates from monthly buckets. If LA-Mattress-ERP has daily delivery data, using it is more accurate but will not tie out to STORIS during parallel run. Recommendation: use the accurate figure and add a reconciliation note to the report.
4. **`Volume Limit on Replenishment POs`.** Semantics undocumented. Decide: hard cap, split, or warn.
5. **Auto-Fill Days.** Referenced by the NetPO branch-B logic but not defined in the captured articles. Needs its own dissection pass (STORIS has "Auto-Fill Days Setup" and "Advanced Vendor Category and Group Exception Settings - Auto-Fill Days").
6. **`Restrict by Fill`.** Named in article 2 as governing unreserved-merchandise requirements, with no definition anywhere in the captured set.
7. **GMROI and turns formulas.** Shown on the detail panel; formulas not captured. `PurchasingControl."GENERAL - Include As-Is Quantities in GMROI Calculation"` suggests as-is stock optionally enters the GMROI denominator.
8. **`LEAD DAYS CALCULATION - Override Lead Days if Purchase Order Date is Greater`.** Named but undefined; likely interacts with the lead-days hierarchy in §2.2.
9. **`Sales Rate Replenishment Calculation`** (Purchasing Control) — a distinct field from `Unit Sales Rate Calculation`; purpose unknown.
10. **Strictness of the Minimum Sales Rate filter** — `<` or `<=`.
11. **Multi-vendor runs.** STORIS requires exactly one vendor per run. Consider whether LA-Mattress-ERP should support a multi-vendor batch that fans out internally — a genuine usability win, but it changes the PO-creation step from one PO to many.

---

## 10. Suggested build order

1. Settings models + the two resolution hierarchies (`resolve_lead_days`, `resolve_minimum_stock_days`) with their own unit tests — these are the highest-risk pure functions.
2. Sales-rate calculator (windows, written/delivered basis, variance, regionalization).
3. NetPO calculator, both branches. Most bug-prone; write T-06/T-07 first.
4. The pure `calculate_row` function and the eligibility filter.
5. Criteria screen + validation.
6. Items for Replenishment screen with editable quantities and Rebuild List.
7. PO creation, holds, buyer assignment, delivery dates.
8. EOD batch and scheduler entry points wrapping the same engine, then T-31.
9. Report output and export destinations.
