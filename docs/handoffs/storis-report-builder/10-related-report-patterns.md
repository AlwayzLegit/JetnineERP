# 10 — Worked examples from the linked articles

The four "Related articles" on the Run a Report page are not Report Builder documentation. They are
*examples of the surrounding reporting ecosystem* — one canonical standard report, one inquiry
screen, one structural concept, one calculator. Each teaches something the builder docs assume.

---

## 10.1 Report Summarized Sales Receipts — the canonical standard-report shape

`Accounting → Receivables → Report Sales Receipts → Report Summarized Sales Receipts`
(also under Receivables Views and Reports → Receivables Reports)

**What it produces:** totals of all receipts **by payment type, by bank, by store**, for a custom
date range or a relative period.

**Data lineage — copy this pattern of documentation:**
- Reads the **`DAILY.DETAIL`** file.
- Retention governed by **`Daily Receipts Retention Months`** in Accounts Receivable Control Settings.
- Purged by **Generate Monthly Reports**.

Every report we build should carry this triple in its metadata: *source, retention setting, purging
process*. It is the difference between "the numbers changed" being a bug and being explainable.

**Run-time prompts:**

| Prompt | Behaviour |
|---|---|
| `Date Code` | Pick a relative period. Includes `CUS` (custom) plus today / yesterday / current period to date / last period total. |
| `Start Date` | **Active only when `Date Code = CUS`.** Otherwise auto-filled from the code and read-only. Calendar picker. |
| `End Date` | Same rule as Start Date. |
| `District` | Restrict to a district. Arrow gives a list; the Action button opens a **Multiple District Selection** window. **Entering a district de-activates `Store`.** |
| `Store` | Restrict to a store. Arrow gives a list; Action opens **Multiple Location Selection**. **Entering a store de-activates `District`.** |
| `Payment Type` | `Detail` — break out the Credit Cards and Financed columns into individual payment types *in addition to* the totals. `Summary` — totals only. |
| `Send Output to` | Options here: Screen, Printer, Excel Export, ASCII Export. Change via Actions → Output Settings. |
| `Export Path` | Read-only, shown for PRV / Excel / ASCII. |

**Three transferable patterns:**

1. **Relative-vs-custom date coupling.** One `Date Code` control, with the explicit date fields
   enabling *only* for `CUS` and otherwise showing the resolved dates read-only. Users can always see
   the actual window that will be used. Adopt this as the standard date prompt across the ERP.
2. **Mutually exclusive scope prompts.** District and Store disable each other rather than silently
   intersecting. Model scope pickers as one control with a level selector, or replicate the explicit
   mutual disable — but never let both apply ambiguously.
3. **Detail/Summary as a prompt, not two reports.** One definition, one prompt, two shapes.

**Also:** output is subject to Regional Processing restrictions — you can only inquire about
customers and locations you have access to. And the run-time options selected **print on the last
page of the report output** (see `04`).

---

## 10.2 View GMROI for a Vendor — inquiry screens are a distinct output form

`Merchandising and Distribution → Purchasing → Buyer\Merchandiser Tools → View GMROI for a Vendor`
(plus five other paths under Buyer Views / Merchandiser Reports / Purchasing Cost Views)

Not a report — an **inquiry**: a header block of computed metrics plus a drill-down grid, with two
tabs pivoting the same data.

**Data freshness (state this on the screen):** *"updated monthly and reflects activity up to the last
month-end closing."* An inquiry whose staleness is not visible will be misread. Put an as-of stamp on
every aggregate view.

**Tab: Vendor** — enter a vendor code.
Header metrics: `GMROI` (gross margin return on investment, **including the current month's sales**),
`Turns` (inventory turnover ratio, including current month), `Current Value`, `Percent of Value`,
`Total Sales`, `Percent of Sales`.
Grid, one row per product category for that vendor: Category, Description, GMROI, Turns, Current
Value, Percent of Value, Percent of Vendor, Total Sales, Percent of Sales, Percent of Vendor.

**Tab: Category** — enter a category code. Same header metrics for the category; grid rows are
vendors: Vendor, Vendor Name, GMROI, Turns, Current Value, Percent of Value, Percent of Category,
Total Sales, Percent of Sales, Percent of Category.

**Takeaways**
- The same measures, two pivots, one screen. Build measures once (`GMROI`, `Turns`, value/sales
  shares) and let the pivot be a parameter.
- Percent-of-parent columns appear twice in the documented column list on each tab; treat that as a
  doc artifact, but note that both *"% of this row's parent"* and *"% of the grand total"* are
  genuinely useful — decide which you mean and label it unambiguously.
- These are **cost/margin measures**, so they are exactly the data the `Cost` field security code
  exists to protect (`07`). Wire masking into inquiry screens too, not just reports.

---

## 10.3 Inventory Hierarchy — why breaks and grouping exist

Short article, load-bearing idea:

> *"The structure of the inventory hierarchy is unique to each organization. It is determined by
> choosing the characteristics of each product (or type of product) that are most important to you in
> making your inventory management and purchasing decisions."*

The hierarchy is **configuration, not schema**. It is what the Output tab's `Break` levels, the
viewer's grouping, and GMROI's category pivot all traverse.

**Implication for the build:** do not hard-code a category → subcategory → product ladder. Model the
hierarchy as configurable levels, and let report grouping, subtotals, and roll-ups reference *levels*
rather than named columns. Getting this wrong is expensive to undo later.

For LA Mattress specifically, the hierarchy is the decision to make *before* building reports —
brand, comfort level, size, collection, construction, price band: whichever dimensions the buying and
inventory decisions actually turn on.

---

## 10.4 Gross Margin Calculator — a calculation utility, not a report

Access: **Actions button on the General tab of Advanced Product Settings.**

Bidirectional solver for the current product:
- gross margin **percentage** at a specified selling price, or
- selling **price** at a specified gross margin percentage.

| Field | Behaviour |
|---|---|
| `Product` | Defaults to the selected product |
| `Cost Type` | `Replacement` value or `Average` cost |
| `Landed` | Checkbox — include landed costs |
| `Cost` | Auto-calculated from `Cost Type` + `Landed`, drawn from the corresponding cost fields on the product record |
| `Price` | Calculated from `Cost` and `Gross Margin %`; entering a new price recalculates the margin |
| `Gross Margin %` | Calculated from `Cost` and `Price`; entering a new margin recalculates the price |

**Constraints:** all calculations are in **domestic currency** — the exchange rate is **not**
referenced. May be surfaced as a **dynamic escape** (see Dynamic Escape Settings).

**Takeaways**
- Two-way binding between price and margin, each recomputing the other, with cost as the fixed input.
  Straightforward, and users expect it.
- Four cost bases (replacement/average × landed/not) means "the cost" is never one number. Any
  margin figure in a report must state which basis it used. Add that to report metadata.
- "Dynamic escape" is the pattern of attaching a utility to any screen that has the relevant context.
  Worth having a general version — small calculators reachable from wherever their inputs live.
