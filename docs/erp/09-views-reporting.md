# Operational Views & Reporting

## The two grids that run the business `[DOC]`

STORIS' Sales Views area is ~140 programs, but two do the operational work. Build these; most of the
remaining "Report X" programs are saved queries over the same data and can be replaced by a report
builder plus a handful of pinned views.

### View and Manage Open Orders

**Scope:** all sales transactions — orders, returns, exchanges, quotes, layaways — or, alternatively,
transfers only. **Service orders are excluded from every filter.** Order type is a mandatory
either/or, and inapplicable fields hide rather than disable.

**Filters:** district **or** selling location (**mutually exclusive** — selecting one inactivates the
other), ship-from location, route code, **backorder status** (back-ordered / fully-reserved
fulfillments / fully-reserved orders — one or both boxes), salesperson (only actionable with the
view-all-sales-information permission), contact status, **calculate ATP dates** (off by default,
preference remembered — it computes ATP for every line on every selected order and is slow at volume),
order dates and fulfillment dates (each with date type + start + end), fulfillment method (deliveries
/ pickups / direct ships — at least one required), fulfillment status (SCH / EST / ASAP / CWC — at
least one required).

**Two row actions:** **View** (read-only document) and **Maintain** (actionable; the grid row refreshes
when the order is updated). Documented gotcha: _do not use the filter checkboxes on the View and
Maintain columns — doing so clears the grid._ Design that out rather than reproducing it.

**Columns** (asterisk = totalled at the bottom): sold at, stock location (ellipsis when multiple),
fulfillment location, route code, salesperson (ellipsis when multiple), billing customer name,
fulfillment customer name, order date, order number, view, maintain, order type, fulfillment method,
fulfillment status, fulfillment date, order qty\*, reserved qty\*, back-order qty\*, ATP back-order
qty\*, auto-transfer order/reserved/back-order qty\*, ATP days early/late, fulfillment unscheduled
lines, unscheduled with ATP date (only when ATP is in use), total fulfillments, order fully reserved
Y/N, contact status, contact date, delivery volume\*, shipping volume\*, weight\*, primary document,
fulfillment delivery charge, fulfillment total, merchandise total\*, order total\*, balance\*,
requested date, fulfillment sales tax, order hold code (ellipsis when multiple), fulfillment handling
method, order finance plan.

**ATP days early/late semantics `[DOC]`:** negative = early, positive = late. The value shown is the
**maximum signed value** across all lines — i.e. the worst-case line. One line 15 days early plus one
3 days early shows `-3`; one 3 days early plus one 5 days late shows `5`. (The docs phrase this as
"the largest positive value", which their own first example contradicts; implement max-of-signed and
assert both examples.)

**ATP back-order quantity `[DOC]`** is zero when quantity ordered = quantity committed, or when the
ATP date is on or before the item's delivery date; otherwise `ordered − committed`, divided by the
unit-of-measure conversion unit for case conversions. Fractional selling units are honoured — an
eighth-yard product shows `0.125`.

**Scheduled mode `[DOC]`.** The same view runs as a scheduled process: no grid, no search button,
fulfillment method and status required and defaulted to all, and the date-range filters replaced by
**past days** / **future days** offsets (run on 01/22 with past 5 / future 10 selects 01/17–02/01;
both zero or null = current date only). Output goes to a report archive or a file share. The archive
output carries a slightly _larger_ column set than the interactive grid. Concurrency is bounded by a
max-concurrent-background-processes setting.

**The ASAP/CWC trap `[DOC]`.** ASAP and CWC fulfillments have no fulfillment date unless the method is
direct ship, so **entering any fulfillment-date start value excludes them entirely** from this view,
the lines view, and open-fulfillments. Multi-date orders match only on the **next** delivery date.
`[DECIDE]` Surface this in the UI — an "N ASAP/CWC fulfillments excluded by this date filter" banner —
rather than letting operators silently miss work. The exclusion is documented; the banner is ours.

### View and Manage Open Order Lines

Line-level view of merchandise **in jeopardy of missing its delivery date**. Queries **only** sales
orders, the sale portion of exchanges, and layaways — returns, transfers and quotes are not queried,
and hard kit masters and intangible items are excluded even if explicitly selected. Search criteria
persist per user.

Extra filters beyond the orders view: stock location (defined as the warehouse location of the
associated auto-transfer if one exists, else the fulfillment location), **ATP days early/late** (hidden
when ATP is inactive; null = all), show-all-lines-of-fulfillment, include-intangibles, product / group
/ category, vendor, inventory formation, fully-reserved, unscheduled-lines-only.

Extra columns: line reference, product, product description, vendor, **ATP source** (reserved stock /
assigned pieces / unlinked shipped PO / linked shipped PO), **ATP document** (the auto transfer, linked
PO, stock transfer, or stock PO), ATP date, ATP days early/late (`999` = no ATP availability or
unscheduled; `0` = reserved stock or assigned pieces), linked purchase order, linked PO scheduled date,
**ATC** (available-to-customer date), unscheduled quantity.

---

## Reporting model `[DOC]` / `[PARTIAL]`

STORIS' sales analysis reporting is a **user-configurable report builder**, not a fixed report set.
That is the part worth copying — the ~100 "Report X" programs are largely saved configurations.

**Structure**, tab by tab:

```
Header       report name, heading line 1, heading line 2
Sorting      sort field (a numbered data field) · ascending/descending · alignment ·
             BREAK (insert a break when the column content changes) · PAGE (page-break on change)
Details      detail field · key width (default 4) · description width (default 30) ·
             sort order · alignment · type
Selection    select field · type (default RANGE → a date-range window with a date code plus
             start/end; also LIST and generic RANGE for non-date fields)
Columns      column id (auto from 1) · column header · print-on-report Y/N · column width ·
             scaling code
               └─ per column: a Function tab (total Y/N, function total, function),
                  a Selection tab, and a Select Data tab (the measure)
```

Report width is calculated and displayed. New reports can be seeded from an existing report via a
merge screen. `[INFER]` Dimensions = sort + detail fields; measures = column select-data fields;
parameters = selection-tab entries plus run-time date codes.

**Field metadata** each field carries: name, **usage** (sort / detail / select / data), format
(alphanumeric / alpha / numeric / date `MM/DD/YY` / dollar amount, normally two decimals), key length
in characters, description length in characters.

**Documented data semantics — carry these into any reporting layer:**

- Sales analysis dollar amounts **exclude dollars-only adjustments**
- On written units/dollars/cost-dollars fields, a **negative number indicates the deletion of a
  written sale** — not a return
- **Zip attribution differs by event:** bill-to zip is used for written-sales updates and whole-order
  deletion; deliver-to zip is used for completed updates, written-commission adjustments on completed
  orders, delivered orders during invoicing, and cost changes on a delivered piece
- Retention is governed by a periods-of-data-retention setting; customer service activity is included
  or excluded by another
- Regional processing limits visible data and forces district-first sorting

`[PARTIAL]` **The published field-list article is broken on STORIS' side** — the field table failed to
migrate and no field names, usages, formats, or lengths are retrievable. The numbered field examples
that survive elsewhere (#2 salesperson, #5 delivered sales dollars, #6 selling store, #9 date) are
examples only. We therefore have the report builder's _shape_ but not its _dimension and measure
catalogue_.

`[DECIDE]` Two viable paths:

1. **Derive the catalogue from the cutover extract.** Whatever fields the legacy sales-analysis files
   contain _is_ the catalogue; enumerate them during phase 11 and build the metadata table from real
   data. Recommended.
2. **Skip the builder.** Ship the two operational grids plus a small set of fixed reports and connect
   a BI tool to a read replica. Cheaper, but loses the self-service that store managers currently have.

## Report inventory worth keeping `[DOC]`

From the ~100 documented reports, the clusters that represent genuinely distinct requirements — use
this as a coverage checklist for whichever path is chosen:

- **Written vs completed sales**: written sales dollars, written sales summary, written sales by
  salesperson, completed sales dollars, completed monthly sales dollars, completed orders by
  salesperson, summarized sales receipts
- **Open-order health**: open sales order detail and summary, open non-allocated order detail, orders
  on credit hold, delivery dates in jeopardy, improperly processed orders, deleted orders, sales
  exceptions
- **Deposits & tax**: current customer deposit amounts, outstanding gift certificates, sales tax,
  sales tax exceptions
- **Financing**: daily financing activity / payments / adjustments, financing aged trial balance,
  financing settlement status, credit expirations, financed credit holds, installment credit and
  delinquency statistics, revolving receivables activity, expected revolving statement cycling,
  monthly credit applications, deleted orders with authorized financing
- **Card & check**: external credit card transactions, electronic check pre-settlement amounts,
  receipt lookup by credit card
- **Salesperson & CRM**: sales commissions, salesperson closing performance, salesperson warranty
  activity, detailed / summarized / comparison lead activity
- **Warranty & protection**: products sold without warranties, extended warranties about to expire,
  protection plan activity and details
- **Marketing**: sales history by initial vs adjusted marketing code
- **Customer**: historical purchases, customer activity log, credit status, callback summary
