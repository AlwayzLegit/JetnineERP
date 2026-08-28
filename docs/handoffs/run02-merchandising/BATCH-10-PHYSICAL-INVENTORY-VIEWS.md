# Run 02 — Merchandising — Batch 10: Physical Inventory Variance, Barcode Receiving and the Remaining Views

**Status: complete.** 12 articles. Findings 127–136.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | Report Detail Frozen Quantities | /articles/15202742223764 | EXTRACTED |
| 2 | **Report Frozen to Counted Variances** | /articles/15202930412820 | EXTRACTED |
| 3 | **Report Frozen to Counted Piece Variance by Product** | /articles/15202946246548 | EXTRACTED |
| 4 | Report Barcode Receivings | /articles/15202503183764 | EXTRACTED |
| 5 | Report Collection Performance | /articles/15202503182484 | EXTRACTED |
| 6 | Report Product Comparison | /articles/15203128187156 | EXTRACTED — **duplicate of Report Comparative Kits** |
| 7 | View Monthly Sales Performance for a Product | /articles/15295212729236 | EXTRACTED |
| 8 | Search for Vendor Product | /articles/15295211661332 | EXTRACTED |
| 9 | **View Purchase Orders for a Specific Product** | /articles/15295156878228 | EXTRACTED |
| 10 | Multiple Purchase Order Selection Window | /articles/15294752807316 | EXTRACTED |
| 11 | Multiple Purchase Status Selection Window | /articles/15294767141012 | EXTRACTED — **contains a copy-paste error** |
| 12 | Purchase Order Quantity Detail – Read Only | /articles/15294751789332 | EXTRACTED |

Discovered and queued: `Report Summarized Frozen Quantities` · `Freeze Inventory (Physical Inventory
Freeze)` · `physical inventory update process` · `Assign Purchase Orders to a Bar Code Receiving
Batch` · `To Be Recorded Purchase Orders By Vendor Inquiry` · `View Product Activity` ·
`View Advanced Product Settings` · `View Multiple Postings` · `View Products in a Specific Storage
Location`.

---

## B. Wiring findings

### FINDING 127 — Physical inventory is a freeze-then-count-then-update sequence with its own self-check
Invariant:  "Use this report **with the `Report Summarized Frozen Quantities` (Frozen On-Hand Summary
            Report) to confirm that the freeze process was accurate. The system compares the totals
            from this report with data from the `Report Summarized Frozen Quantities` routine.**"
Invariant:  "**NOTE: This report runs automatically during the `Freeze Inventory` (Physical Inventory
            Freeze) process.**"
Invariant:  "**If you run this report before you run the physical inventory update process**, you can
            use it to analyze the quantity and dollar variances between the frozen and the counted
            inventories."
Blocking rule (batch 2 Finding 31): "**If active cost exceptions exist in the system, you cannot
            perform a physical inventory freeze.**"
Evidence:   Report Detail Frozen Quantities, /articles/15202742223764;
            Report Frozen to Counted Variances, /articles/15202930412820
Maps to:    **NEW — completes batch 2's cost-exception gate**

> The sequence is now legible end to end: **clear all active cost exceptions → freeze → the freeze
> writes a detail report automatically → reconcile detail against summary to prove the freeze itself
> → count → analyse frozen-vs-counted variances → run the update.** Two things are notable. The system
> **checks its own freeze** by cross-footing two reports, which implies the freeze is not trusted to be
> atomic. And the variance analysis window is explicitly **before** the update — after it, the frozen
> baseline is consumed. Combined with batch 2's rule that cost exceptions block the freeze, **the
> annual count depends on a merchandising work queue being empty**, which is the kind of dependency
> that only surfaces the week it bites.

### FINDING 128 — Variance is reported at average cost, and zero cost is called out as a data-quality warning
Invariant:  "**Costs on this report are based on average cost.**"
Invariant:  "**NOTE: For products that report a unit cost of zero, if any of those costs appear to be
            in error, ensure that a frozen count exists for the products in question.**"
Invariant:  "**If '`**`' appears at the end of the row for a product, this signifies that the quantity
            promised is higher than the quantity on hand.**"
Options:    `From Storage Location` · `Through Storage Location` · **`Calculation Type`** ·
            **`Exceptions`** *(limit exception types)* · `Display Vendor` · `Display Vendor Model
            Number` · `Insert Blank Print Lines Between Each Product Listed` · three sort preferences ·
            **`Exclude Promotional Pricing`**
Invariant:  "The **second product description** appears on the report and PDF only."
Evidence:   Report Frozen to Counted Variances, /articles/15202930412820
Maps to:    **W-061 — a sixth cost basis; and a new oversell signal**

> Batch 9 Finding 125 counted five cost bases across the inventory reports. **This is a sixth: physical
> inventory variance is valued at average cost specifically**, not at the GL posting method (as as-is
> reporting is), not at exact cost (as special orders are), not landed. So **the dollar variance
> booked from a physical count is computed on a different cost basis than the inventory it is
> correcting.** That is worth putting to the operator directly.
>
> The `**` marker is a genuine find: **an oversell indicator — promised quantity exceeding quantity on
> hand — printed on a physical inventory report.** Nothing else in the run surfaces oversell as a
> flagged condition. And the zero-cost note ties straight back to batch 2's cost exception types 1–3:
> **a zero unit cost here may be an unresolved zero-cost exception**, and the article's advice is to
> check the frozen count rather than the exception queue.

### FINDING 129 — Piece-level variance reconciles reference numbers, not just quantities
Invariant:  "Use this routine to assist you in **identifying mislabeled pieces**. The report lists
            vendor model number, **scanner ID**, **sales order indicator when pieces are assigned to a
            sales order (`Y` for yes)**, frozen and counted quantities, **the area**, **reference
            numbers** and piece variance."
Invariant:  "You can use this report to verify counts and **to reconcile differences in reference
            numbers that were counted and reference numbers that were assigned to pieces at the
            location being counted.**"
Evidence:   Report Frozen to Counted Piece Variance by Product, /articles/15202946246548
Maps to:    **NEW**

> Physical inventory in STORIS reconciles **identity, not only quantity** — which reference numbers
> were found versus which were expected. That is only possible because pieces carry serial/reference
> numbers (batch 9 Finding 119) and it makes mislabelling a first-class detectable error. **`scanner
> ID`** and **`area`** appear here for the first time and imply a counting infrastructure — handheld
> devices, count areas — that no article in the section describes. The **`Y` sales-order indicator** is
> the operationally important column: it marks pieces that are already promised to a customer, so a
> variance on those rows is a customer problem, not just a valuation one.

### FINDING 130 — Barcode receiving is a batched alternative path with its own register
Invariant:  "Use this report when receiving, **using the `Batch` or `Radio Frequency` Barcode receiving
            methods**. Although this report is **similar to the standard Warehouse Receipts report**,
            this report will **add and sort based on the batch number and date**."
Options:    `Receiving Warehouse` · **`Receipt Batch Number`**
Related:    `Assign Purchase Orders to a Bar Code Receiving Batch`
Evidence:   Report Barcode Receivings, /articles/15202503183764
Maps to:    **NEW — a fourth receiving path**

> The run has now found four ways goods enter inventory: **standard PO receiving** (batch 1), **container
> receiving with a separate freight bill** (batch 2), **receive without a purchase order** (batch 1),
> and **barcode receiving in `Batch` or `Radio Frequency` mode** here — each with its own register or
> report. Batch 2 Finding 44 established that the standard warehouse receipts register runs in
> End-of-Day; this is a parallel register keyed by **receipt batch number**. For the rebuild, the
> question is not "how do we receive" but **"which of four receiving models does each of these flows
> map to, and do they all produce the same inventory and cost effects"** — nothing read so far says
> they do.

### FINDING 131 — Purchase order visibility is filtered to the user's locations, with three documented sort exceptions
Invariant:  "This inquiry **lists purchase orders only for locations valid to the log-on user**,
            includes direct-ship purchase orders, sorts purchase orders in ascending order by receiving
            location and scheduled date **with the following exceptions**:
            - **direct-ship purchase orders sort by the selling location of the associated direct-ship
              sales order. Note that '`Direct Ship`' displays in the grid instead of the location.**
            - **acknowledged purchase orders sort by vendor's acknowledgement date, if available. If a
              line item date exists, the program uses it. Otherwise, it uses the header date of the
              acknowledgement.**
            - **for purchase orders on `approval hold`, '`Hold`' displays in the `Date` column of the
              grid instead of the date.**"
Evidence:   View Purchase Orders for a Specific Product, /articles/15295156878228
Maps to:    **NEW — and it names a hold the run has not seen**

> Three findings in one paragraph. **Direct-ship POs have no receiving location** — consistent with
> batch 7 Finding 98's COM orders — and the grid prints the literal string `Direct Ship` where a
> location would go, a third display sentinel after `"..."` and `None`. **Acknowledgement dates
> resolve line-first, header-second**, which is the first statement anywhere of precedence between the
> two acknowledgement date levels batch 1 Finding 13 found. And **`approval hold`** appears for the
> first time in the run — batch 1 catalogued seven automatic hold sources and batch 3 an eighth, none
> of them called approval hold. Either it is a ninth, or it is the payment-approval state batch 1
> Finding 20 described, surfacing under a different name. **Unresolved; recorded as a gap.**

### FINDING 132 — The multi-selection windows are a shared framework, and `"..."` is its universal sentinel
Invariant:  "The `Purchase Order` field displays '`...`' to indicate multiple purchase orders."
            · "If multiple items were selected, the field displays '`...`' to indicate this."
Windows found in the section (10): Purchase Order · Purchase Status · Brand · Collection ·
            Merchandise Interest · Open To Buy Department · Trip IDs · Vendor · Multiple Location
            Selection · Multiple Selection Lookup.
Read-only variant: "The read-only version of this screen appears when accessed through a **view-only
            version of the routine, such as `View Advanced Product Settings`**. In this version, you
            may only view the currently available selection(s)."
Evidence:   Multiple Purchase Order Selection Window, /articles/15294752807316;
            Multiple Purchase Status Selection Window, /articles/15294767141012
Maps to:    **confirms batch 1 Finding 24's sentinel as section-wide**

> Batch 1 found `"..."` in the `Receiving At` field and recorded it as a multi-location sentinel.
> **It is the framework's universal marker for "multiple values selected"**, used by at least ten
> selection windows. Together with `$$$^NN` (run 1), `None` (label forms, batch 6) and `Direct Ship`
> (Finding 131), STORIS has a consistent habit of **encoding state as display strings in value
> fields** — which matters for extraction: a field containing `"..."` is not data, it is a UI marker,
> and the real values live in an associated grid.

### FINDING 133 — The help center contains verbatim copy-paste errors in its reference articles
Invariant (as printed, `Multiple Purchase Status Selection Window`): "You can either enter **product
            names** directly into the `Purchase Status` field… You can also click the `Search` button
            at the **`Collection` field** to use the `Purchase Status` to select from a list of
            available items. Double-click the desired item to add it to the grid of the **`Multiple
            Collection Selection Window`**."
Other instances found in this run: `Condolidate Purchase Orders` *(button label, batch 4)* ·
            `Post RTV Write-off of Landed Cost Assests` *(setting name, batch 2)* ·
            `Units Sold = Units Returned` *(formula, batch 3)* ·
            "**fter** you make all your selections" *(batch 5)* ·
            "**is includes**" for "it includes" *(batch 7)* ·
            "Standard messages… **will not received**" *(batch 4)*
Evidence:   Multiple Purchase Status Selection Window, /articles/15294767141012; accumulated
Maps to:    **NEW — recorded because it changes how the documentation should be used**

> This article was evidently written by copying the Collection window's text and imperfectly
> substituting. It names the wrong field, the wrong window and the wrong object type. **On its own it
> is trivial; as the seventh instance in ten batches it is a calibration fact.** Two of these errors
> were substantive — a settings name we would have searched for verbatim, and a formula that reads as
> an equality where a subtraction is meant.
>
> Combined with batch 6 Finding 93's twelve terminology conflicts and batch 8's contradictory
> `NET AVAIL`, the conclusion for the parity work is firm: **the STORIS help center is a good guide to
> what exists and an unreliable guide to exactly how it behaves.** Field names, enumerations and screen
> inventories from this audit are trustworthy; formulas and precedence rules must be verified against
> the live system.

### FINDING 134 — Two articles document the same report under different names
Invariant:  `Report Product Comparison` (Merchandising, /articles/15203128187156) and
            `Report Comparative Kits` (Views and Reports, /articles/15202503206804) carry **near-
            identical text**: "provides a hard copy comparison of products that belong to the same
            product category and/or product group… lists the current selling price, **weighted average
            cost**, gross profit amount and gross profit percent for each product listed."
Difference: `Report Comparative Kits` adds `Group` and `Category` run-time options and the phrase
            "which may be printed on demand"; `Report Product Comparison` lists only output options.
Evidence:   Report Product Comparison, /articles/15203128187156; Report Comparative Kits,
            /articles/15202503206804
Maps to:    **NEW — and it affects the coverage count**

> The 115-article inventory for this section contains **at least one duplicate documented twice under
> different names in different subsections**, one of which mentions kits in its title and neither of
> which mentions kits in its body. Coverage counts in section A of this run should be read as
> *articles read*, not *distinct functions documented*. It also means **a menu search for "product
> comparison" and one for "comparative kits" lead to the same report** — worth knowing when
> interviewing operators about what they use.

### FINDING 135 — Three product inquiries share one General Information page and one Active Locations List
Invariant, stated on four screens: "**It is identical to the `General Information` page in `View
            Product Activity`.**" *(View Product Cost Activity (b2) · Open Order by Product (b7) ·
            View Inbound Transfers (b9) · View Monthly Sales Performance for a Product)*
Invariant:  "**This routine maintains an `Active Locations List`.**" *(Open Order by Product (b7),
            View Monthly Sales Performance for a Product)*
Common quantity block: **On Hand · Net Available · Net PO** — plus `As-Is` on two, `Inbound Quantity`
            on one, `On Hand/Net Available/Net PO` on all.
Also:       "**On some menus, this routine is called `View Sales History for a Product`.**"
Evidence:   View Monthly Sales Performance for a Product, /articles/15295212729236; accumulated
Maps to:    **NEW**

> The product inquiries are **facets of one underlying inquiry** — `View Product Activity` — each
> adding a specialised page over a shared General Information page and a shared quantity block. That is
> a cleaner architecture than most of this section and worth mirroring. Two practical notes: the
> shared **`On Hand · Net Available · Net PO`** header is the closest thing STORIS has to a canonical
> availability display, and given batch 8 found eight competing formulas, **which one populates this
> header is an unanswered question that affects every inquiry at once.** And the alias
> (`View Sales History for a Product`) is a fourteenth naming inconsistency.

### FINDING 136 — Linked COM purchase orders hang off a sales-order-linked PO line
Invariant:  "Use this window to display **linked sales orders (if any)** for the selected grid item…
            Product Code · Product Description 1 · **Product Description 2** · **`Linked COM Purchase
            Orders`** · **`Special Order Detail Information`**"
Reached by: double-clicking a grid item on the **Quantity tab of `View a Purchase Order`** and
            choosing `Select`.
Evidence:   Purchase Order Quantity Detail – Read Only, /articles/15294751789332
Maps to:    **NEW — closes the COM loop**

> A purchase order line can have **linked sales orders and, separately, linked COM purchase orders** —
> so a stock PO line for a piece of furniture can point at the outbound COM purchase order carrying the
> customer's own fabric to the vendor. **That is the complete COM mechanism**, assembled across four
> batches: a COM tab that only exists on sales-order-created POs (b1), COM as a layer cost component
> (b2), COM purchase orders shipped *to* the vendor with no receiving location (b7), and here the link
> between the two orders. For an upholstery-heavy retailer this is a real workflow, and a rebuild that
> models purchase orders as inbound-only cannot represent it.

---

## C. Screen and field inventory

**Report Detail Frozen Quantities** — Warehouse Location · Send Output to · Export Path.
Sorts by product category. **Runs automatically during `Freeze Inventory`.**

**Report Frozen to Counted Variances** — Location · Product · Category · **From Storage Location** ·
**Through Storage Location** · **Exceptions** · Display Vendor · Display Vendor Model Number ·
Insert Blank Print Lines Between Each Product Listed · Sort Preferences #1/#2/#3 ·
**Calculation Type** · Print · **Exclude Promotional Pricing** · Send Output to · Export Path.
Markers: **`**` = quantity promised exceeds quantity on hand.**

**Report Frozen to Counted Piece Variance by Product** — Location · Product · Category ·
**Variance Only** · Display Vendor Model Number · Sort Preference · Send Output to · Export Path.
Columns: vendor model number · **scanner ID** · **sales order indicator (`Y`)** · frozen quantity ·
counted quantity · **area** · **reference numbers** · piece variance.

**Report Barcode Receivings** — Receiving Warehouse · **Receipt Batch Number** · Send Output to ·
Export Path.

**Report Collection Performance** — Send Output to · Export Path. **Ranking** on Units Sold ·
Units Returned · Sales Dollars · Profit Dollars · GMROI · Turns. Output: **Screen · Printer · Excel ·
ASCII Export**.

**Report Product Comparison** / **Report Comparative Kits** — Group · Category · Send Output to ·
Export Path. Current selling price · **weighted average cost** · gross profit amount · gross profit
percent.

**View Monthly Sales Performance for a Product** *(a.k.a. `View Sales History for a Product`)* —
pages **Sales History · General Info**. Product · Vendor · Brand · Vendor Model · Location ·
**On Hand · As-Is · Net Available · Net PO** · grid · Actions. Maintains an **Active Locations List**.

**Search for Vendor Product** — Vendor · Brand · Vendor Model · Description · grid.
"products **not currently carried** by a retailer, and/or that are **not in their product database**".

**View Purchase Orders for a Specific Product** — pages **PO to be Received · General Info**.
Product · Description · Vendor · Vendor Model · Brand · **On Hand · Net Available · Net PO** · grid ·
Actions. Grid shows PO number, **buyer's initials**, date, vendor, expected date, receiving location —
with `Direct Ship` and `Hold` as literal substitutes in the location and date columns.

**Multiple Purchase Order Selection Window** — Purchase Order field · Search →
**`To Be Recorded Purchase Orders By Vendor Inquiry`** · grid (PO number, date, vendor name) ·
Remove · Delete · OK · Exit. Returns `"..."` to the calling field.

**Multiple Purchase Status Selection Window** — Purchase Status · Description · **Add** · **Clear** ·
**Remove** · OK · Exit. Read-only variant via view-only routines.

**Purchase Order Quantity Detail – Read Only** — Product Code · Product Description 1 ·
**Product Description 2** · **Linked COM Purchase Orders** · **Special Order Detail Information** ·
grid · Actions.

---

## D. Control settings catalog

*No new settings.* This batch is entirely reports and windows; the cost bases they use are fixed per
report (average cost for frozen-to-counted variance; weighted average cost for product comparison)
rather than configurable.

---

## E. Security permissions catalog

| Permission / mechanism | System | Gates |
|---|---|---|
| location validity at log-on | Regional Processing / Location Restrictions | `View Purchase Orders for a Specific Product` lists **only valid locations** |
| view-only routine variants | (routine level) | Read-only multi-selection windows via e.g. `View Advanced Product Settings` |

---

## F. State machines and enumerations

**Physical inventory sequence** — clear cost exceptions → **freeze** *(writes the detail report)* →
prove freeze against the summary report → count → **frozen-to-counted variance analysis** →
**update**.
**Barcode receiving methods** — `Batch` · `Radio Frequency`.
**Receiving paths found in the run (four)** — standard PO receiving · container with separate freight
bill · receive without a purchase order · barcode (batch / RF).
**Collection ranking criteria** — Units Sold · Units Returned · Sales Dollars · Profit Dollars ·
GMROI · Turns.
**Report output destinations** — Screen · Printer · Excel · ASCII Export *(plus HTML and PDF elsewhere)*.
**Display sentinels found in the run** — `$$$^NN` *(run 1, blocks save)* · `"..."` *(multiple values
selected)* · `None` *(label form precedence)* · `Direct Ship` *(in place of a location)* ·
`Hold` *(in place of a date)* · `**` *(promised exceeds on hand)* · `*` *(PO acknowledged, batch 8)*.
**Cost bases across inventory reporting (six)** — average · exact · weighted average · landed
*(when allocated on receipt)* · GL-posting-method-derived · unlanded-for-KPIs.

---

## G. Sequencing rules

1. Active cost exceptions block the freeze (batch 2).
2. `Freeze Inventory` automatically produces the detail frozen quantities report.
3. Detail and summary frozen reports are cross-footed to prove the freeze.
4. Frozen-to-counted variance analysis must be run **before** the physical inventory update.
5. Barcode receiving is batched; its register is keyed by receipt batch number.
6. Direct-ship POs sort by the selling location of their sales order, not a receiving location.
7. Acknowledged POs sort by line-item acknowledgement date if present, else the header date.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Report Summarized Frozen Quantities`**, `Freeze Inventory` and the **physical inventory update
  process** — the count itself lives in Inventory Management, not Merchandising. All unread.
- **The four `Kardex` screens** — still the highest-value unread articles (batch 9).
- `Assign Purchase Orders to a Bar Code Receiving Batch` · `To Be Recorded Purchase Orders By Vendor
  Inquiry` · `View Product Activity` *(the base inquiry four screens inherit from)*.

**Documented but ambiguous**
- **`approval hold`** — a hold state not among the eight sources catalogued in batches 1 and 3.
  Ninth source, or the payment-approval state under another name? **Unresolved.**
- **`Calculation Type`** and **`Exceptions`** on the variance report — both undefined, and
  `Calculation Type` plausibly selects the cost basis, which would make Finding 128 conditional.
- **`scanner ID`** and **`area`** — imply a counting infrastructure nothing describes.
- **`Exclude Promotional Pricing`** on a cost variance report — why pricing affects a cost variance is
  not explained.
- **`Programmed`, `Inventory Type`, `Style`, `Reason Code` scope** — still open from earlier batches.
- Which availability formula populates the shared `On Hand / Net Available / Net PO` inquiry header.
- Whether `Search for Vendor Product` implies a vendor catalogue feed, and where its data comes from
  for products "not in their product database".
- Whether the `Y` sales-order indicator on piece variance triggers anything, or is informational.

**Inferences (not in section B)**
- `approval hold` is probably the AP payment-approval state (batch 1 Finding 20), surfacing in a
  purchasing inquiry. **Not stated**, and it may be a distinct ninth hold.
- `Calculation Type` probably selects between cost bases for the variance valuation; not stated.
- `Search for Vendor Product` probably reads a vendor-supplied catalogue, given it covers products not
  in the product database; not stated.
- `area` is probably a physical count zone; not stated.

---

## I. Unknown unknowns

- **A freeze that checks itself** by cross-footing two automatically generated reports.
- **Physical inventory variance valued at average cost specifically** — a sixth cost basis.
- **A `**` marker flagging promised-exceeds-on-hand** on a physical inventory report.
- **Piece-level reconciliation of reference numbers**, not just quantities.
- **`scanner ID` and `area`** — an undocumented counting infrastructure.
- **A fourth receiving path** (barcode, batch or RF) with its own batch-keyed register.
- **`approval hold`** as a named PO state absent from every hold article.
- **`Direct Ship` and `Hold` printed as literal values** in location and date columns.
- **`"..."` as a framework-wide multiple-selection sentinel** across ten windows.
- **Verbatim copy-paste errors in reference articles**, seven instances in ten batches.
- **One report documented twice under two names** in two subsections.
- **Four inquiries sharing one General Information page** and an Active Locations List.
- **Linked COM purchase orders** hanging off a stock PO line.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Freeze / Frozen quantity | Snapshot of on-hand taken before a physical count |
| Frozen to Counted Variance | Quantity and dollar difference between the freeze and the count |
| Scanner ID / area | Undocumented physical-count infrastructure attributes |
| `**` | Report marker: quantity promised exceeds quantity on hand |
| Batch / Radio Frequency receiving | Barcode receiving methods with their own batch-keyed register |
| Receipt Batch Number | Key for a barcode receiving batch |
| Approval hold | PO state displayed as `Hold` in place of a date; not in any hold-source article |
| `"..."` | Universal sentinel meaning "multiple values selected" |
| Active Locations List | Session list of locations an inquiry may reach |
| Linked COM Purchase Orders | Outbound customer's-own-material orders tied to a stock PO line |
| Report Product Comparison / Report Comparative Kits | The same report, documented twice |

---

## Contract adjudication — batch 10

| Contract | Verdict | Basis |
|---|---|---|
| **W-061** | **CONFIRMED, sixth basis** | Physical inventory variance is valued at average cost (F128) |
| **W-044** | **complicated** | `approval hold` is a PO state no hold article documents (F131) |
| **W-050** | **consistent** | PO inquiry lists only locations valid to the log-on user (F131) |
| **W-052 / W-053** | **not documented in this section** | Physical inventory variance postings are not described here |
| **W-005 / W-006** | **extended** | Linked COM purchase orders complete the sales-order-driven PO family (F136) |

---

## Next — batch 11 (final): remaining selection windows, exports and the coverage sweep
