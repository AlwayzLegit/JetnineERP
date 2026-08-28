# Run 02 — Merchandising — Batch 11 (final): Open To Buy, PO Recall and the Coverage Sweep

**Status: complete.** 9 articles. Findings 137–145.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **View Purchase Orders for a Specific Vendor/Recall** | /articles/15202192545300 | EXTRACTED — rich |
| 2 | **Report Open To Buy Information** *(linked, Inventory Management)* | /articles/15203012632980 | EXTRACTED |
| 3 | **Open To Buy Department Settings** *(linked, System Administration)* | /articles/15242662921876 | EXTRACTED |
| 4 | **Open To Buy Budget by Category** *(linked)* | /articles/15242390968084 | EXTRACTED |
| 5 | Product GMROI and Turns Export | /articles/15203128358164 | EXTRACTED |
| 6 | Unsampled Stock Storage Location Selection | /articles/15202945866260 | EXTRACTED |
| 7 | View Purchase Order Comments | /articles/15295211526292 | EXTRACTED — thin |
| 8 | Multiple Vendor / Brand / Collection / Merchandise Interest / OTB Dept / Trip ID selection windows | *(five articles)* | **NOT SEPARATELY EXTRACTED** — verified as instances of the one template documented at batch 10 Finding 132 |
| 9 | Purchase Order Discounts Window – Read Only | /articles/15202208172692 | **NOT SEPARATELY EXTRACTED** — read-only twin of the window dissected in batch 1 |

---

## B. Wiring findings

### FINDING 137 — Open To Buy is the buying budget, and it is the only place landed costs are fully included
Invariant:  "This report shows the dollar amount (**in thousands, for written sales**) that merchandise
            buyers can purchase to maintain planned inventory quantities of one or all open-to-buy
            departments **for the current fiscal period and up to 5 future periods**. The report bases
            the amounts on **budgeted sales, purchases, and inventory levels**."
Invariant:  "**The report includes landed costs in all calculations.**"
Invariant:  "**Monies not spent in one period carry over to the following periods.**"
Options:    `Department Code` · `Future Periods` · `Sales Order Statistics` ·
            `Details for Stock Purchase Orders` · `Details for Special Order Purchase Orders` ·
            **`Calculate Using`** · Send Output to · Export Path
Evidence:   Report Open To Buy Information, /articles/15203012632980
Maps to:    **W-061 — and it directly contradicts batch 8's KPI treatment**

> **The budget includes landed cost; the performance KPIs exclude it.** Batch 8 Finding 110 established
> that GMROI, Turns, GM12 and GM4 all "exclude freight, add-on 1 and add-on 2 costs". Open To Buy
> includes landed costs in *all* calculations. So a buyer's spend authority is measured on landed
> dollars while the same buyer's return on that spend is measured on unlanded dollars. **The two halves
> of a buyer's scorecard are on different cost bases, and nothing in the system says so.** For an
> importer of bulky goods — which a mattress retailer is — this is a material distortion in both
> directions, and it is the clearest single business finding in run 2.
>
> Two further mechanics: the budget runs on **fiscal periods** (current plus five), tying Merchandising
> to run 1's period model; and **unspent budget carries forward**, so an underspent period silently
> inflates the next one's authority.

### FINDING 138 — Open To Buy departments are configured two mutually exclusive ways, and the choice reshapes three screens
Invariant:  "You can create departments consisting of **either categories and groups or regions and
            buyers** (that is, depending on the setting at the **`Open to Buy Department Control`**
            field in the `Purchasing Control Settings`). **You can assign each category/group or
            region/buyer to a single department only.**"
Options (verbatim, from the report): "**- product category/group** · **- region/buyer**"
Tab gating: the `Category` and `Group` tabs "are active only if the `Open to Buy` field… is set to
            **`Product/Category Group`**"; the `Region` and `Buyer` tabs "are active only if… set to
            **`Region/Buying Group`**".
Constraints: "**You cannot combine the same region and buying group in more than one department.**" ·
            "Records must contain **at least one valid** category/group or region/buying group."
Invariant:  "**Regional Processing rules do not apply when entering or editing records in this routine,
            but they do apply in the `Report Open To Buy Information` routine.**"
Evidence:   Open To Buy Department Settings, /articles/15242662921876
Maps to:    **NEW — and it adds a fifteenth access-control nuance**

> One control setting **switches which half of a settings screen is usable**, and with it the meaning
> of an open-to-buy department: either a merchandise classification or an organisational one. They
> cannot coexist. That is a foundational modelling decision the operator made at some point and which
> is invisible on every report that uses `OTB Department` as a selection axis — batches 5, 8 and 9 all
> use it without saying what it contains.
>
> The Regional Processing split is worth flagging on its own: **you may configure departments for
> regions you cannot report on.** Batch 6 Finding 86 listed four processes that ignore location
> restrictions; this is a fifth pattern — restrictions applying at *report* time but not at *setup*
> time, within the same feature.

### FINDING 139 — The planning table carries gross margin, freight factor and stock percentages as budget inputs
Fields (verbatim, Planning Table tab): **`Gross Margin %` · `Freight Factor %` · `Stock %`** ·
            `Month/Year` · **`Planned Sales` · `Planned Inventory EOM` · `Last Year Planned Sales`**
Invariant:  "You can specify **any month from the previous year or the following year**."
Category budget: "**only categories whose products have had inventory activity within the OTB region
            appear in the grid**" · "**The percentages calculate as each category's percent of the
            total budget for the indicated month.**" · fields `Planned Sales` · `Planned Inventory EOM`
            · `Total Planned Sales` · `Total Planned Inventory EOM`.
Evidence:   Open To Buy Department Settings, /articles/15242662921876;
            Open To Buy Budget by Category, /articles/15242390968084
Maps to:    **NEW**

> **`Freight Factor %` is a budget assumption here**, separate from the actual freight factor that
> resolves through batch 2's thirteen-level landed hierarchy. So the plan carries an assumed freight
> rate and the actuals carry a resolved one, with **no reconciliation between them documented
> anywhere** — which is the same shape as batch 2 Finding 40's estimated-versus-actual add-on loop that
> also never closes. `Stock %` is undefined and is plausibly a stock-to-sales ratio target.
>
> Note the category grid **auto-populates only from categories with inventory activity in the region** —
> so a category with no history is invisible to the budget, and a genuinely new category has to be
> introduced some other way. The article does not say how.

### FINDING 140 — `Recall Purchase Order` copies a previous order's products into a new one, once, under three conditions
Invariant:  "If you **double-click on an item in the grid while creating a purchase order**, the program
            **imports the products from the selected purchase order into the current purchase order**."
Conditions (verbatim): "you must **first select a vendor** at the `Vendor` prompt in `Enter a Purchase
            Order` and then select **`Recall Purchase Order`** from the Actions button on the General
            tab. **This option is only available if an item has not been added to the `Merchandise` tab
            grid. Additionally, this option cannot be accessed if an item was added then removed from
            the grid.**"
Once only:  "**Once you select a purchase order from the grid to import products into the current
            purchase order, you cannot use this action again on the same purchase order.** If you
            attempt to access `Recall Purchase Order` a second time, a warning message appears."
Discount hook: "**If the `Confirm Pre-set Discounts` field in the `Purchasing Control Settings` is
            enabled, and an active discount exists for the vendor, the `Purchase Order Discounts
            Window` appears** in which you can add a discount or modify the current one."
Evidence:   View Purchase Orders for a Specific Vendor/Recall, /articles/15202192545300
Maps to:    **NEW — and it completes batch 1's `Preset Discounts` gap**

> A reorder shortcut with an unusually strict state gate: **available only on a virgin Merchandise
> grid, and poisoned permanently if a line was added and removed.** That implies the screen tracks
> whether the grid has *ever* been touched, not just whether it is empty — a hidden state flag with
> real user-visible consequences.
>
> The discount hook closes a batch-1 open question. `Preset Discounts` appeared in `Purchasing Control
> Settings` as a named-only field; here is a related field, **`Confirm Pre-set Discounts`**, and its
> behaviour: when a vendor has an active preset discount, the discounts window is forced open on
> recall. So **vendor discounts are a standing configuration that can be applied automatically**, which
> reframes batch 1 Finding 3's five-value deduct-type enumeration — those codes can arrive by default,
> not only by hand.

### FINDING 141 — The vendor record supplies the exchange rate, closing a gap open since batch 4
Invariant:  "**The following fields are obtained from the vendor's record and are display only:**
            Vendor · Address · **`Country`** · Contact · Email · Phone · **`AP Terms`** ·
            **`Currency`** · **`Exchange Rate`**"
Evidence:   View Purchase Orders for a Specific Vendor/Recall, /articles/15202192545300
Maps to:    **partially closes batch 4 Finding 67 and batch 6 Finding 92**

> Batch 4 asked where the exchange rate comes from; batch 6 found the PO carries an **`Estimated
> Exchange Rate`**. Here the rate is shown as **a display-only field on the vendor record** — so the
> vendor master holds a rate, and the purchase order copies it as an estimate. **What still is not
> documented anywhere is how the vendor's rate is maintained, how often, and which rate is used when
> the receipt posts.** Batch 2 Finding 37 has that rate feeding average cost for foreign products, so
> this remains a live gap — but it is now narrowed to one question: *who updates the vendor exchange
> rate, and when.*
>
> Note `Country` on the vendor record is the field batch 5 Finding 77 said determines import status,
> and `AP Terms` is the link to run 1's payables terms — three modules meeting on one display panel.

### FINDING 142 — Obsolete products are silently excluded from the GMROI export
Invariant:  "**Important: This report does not report on any obsolete products.**"
Invariant:  "**This report generates a large amount of data. For this reason, it is available only as
            an Excel® or ASCII export.**" · "**Unlike standard STORIS report samples, run-time options
            do not display in the output of this report.**"
Sort:       "**The final sort - `Vendor Model` or `Product Key` - is determined by the setting at the
            `Sort Report By` field in the `Point of Sale Control Settings`.**"
Evidence:   Product GMROI and Turns Export, /articles/15203128358164
Maps to:    **NEW**

> Three quiet traps in one short article. **Obsolete products are excluded** — so the export cannot be
> used to assess what the discontinued range did, which is exactly the question a buyer asks at
> season end. **The run-time options are not printed**, breaking the self-describing-report convention
> batch 7 Finding 101 identified — so an exported file has no record of what produced it. And the
> **final sort key is set in Point of Sale Control Settings**, meaning a merchandising export's row
> order is governed by a sales configuration screen.

### FINDING 143 — Floor-sample comparison is a two-sided storage-location set operation
Invariant:  "the system **compares the inventory specified for the stocked-at location with the
            inventory specified for the displayed-at location** and generates a report **displaying the
            items that appeared at the stocked-at location but not the displayed-at location**. You can
            use the list to **restock the displayed-at location** with the out-of-stock merchandise."
Both sides carry: `Warehouse/Store` · `Storage Location` · `Selection` · `Starting Location` ·
            `Ending Location` · **`Location List`**
Invariant:  "**The locations specified at the `Warehouse/Store` fields here must be location-tracked
            with storage locations already set up.**"
Evidence:   Unsampled Stock Storage Location Selection, /articles/15202945866260
Maps to:    **NEW — completes batch 9 Finding 121**

> A literal **set difference — stocked minus displayed** — expressed as two symmetric location
> specifications, each accepting a range or a named list. It is the only genuine set operation in the
> section's reporting. The finding that matters for the rebuild is the prerequisite: **showroom
> sampling analysis is impossible without storage-location tracking configured on both sides.** That
> is a warehouse configuration decision gating a merchandising capability, and it needs checking
> against how LA Mattress actually operates its stores.

### FINDING 144 — Every entry routine in this section has a documented read-only twin
Pairs found across the run:
| Entry routine | Read-only twin |
|---|---|
| Enter a Purchase Order | **View a Purchase Order** |
| Update Purchase Order Comments | **View Purchase Order Comments** |
| Purchase Order Discounts Window | **Purchase Order Discounts Window – Read Only** |
| Acknowledge a Purchase Order | read-only version "depending on how this screen was accessed" |
| Transfer on Receipt Quantities | read-only from View a Purchase Order |
| Purchase Order Kit Master Maintenance | read-only on the Quantity tab of View a Purchase Order |
| Program List Creation | read-only via view-only routines |
| Multiple selection windows | read-only via e.g. View Advanced Product Settings |
| Purchase Order Quantity Detail | **– Read Only** *(no editable counterpart documented)* |
Evidence:   accumulated across batches 1, 4, 6, 10, 11
Maps to:    **NEW — recorded because it is an architectural convention, not a coincidence**

> **STORIS pairs almost every editable screen with a distinct read-only routine**, and access is
> granted by routing a user to one or the other rather than by permissioning fields. That is a
> coherent and quite defensible design, and it explains an oddity the audit kept hitting: the same
> screen documented twice with slightly different field lists. It also means **the menu is part of the
> security model** — batch 6 Finding 85 found access derived from log-on context, and this is the
> other half: capability derived from which routine you were given.
>
> For a rebuild this is a real decision point. Modern practice is one screen with disabled fields;
> STORIS's approach doubles the surface area but makes "who can edit this" answerable by looking at
> menu assignments. Whichever we choose, **the migration must enumerate both members of each pair** or
> half the operators will lose access to screens they use daily.

### FINDING 145 — Coverage sweep: what run 2 read, and what it deliberately did not
Read: **129 articles** across 11 batches — the full 115-article Merchandising inventory plus **21
linked articles** from Overviews, FAQs, System Administration, Inventory Management and Sales
Processing, less duplicates and the two families below.
**Not separately extracted, with reason:**
- **Five multiple-selection windows** (Vendor, Brand, Collection, Merchandise Interest, Open To Buy
  Department, Trip IDs) — verified as instances of the single template dissected at batch 10
  Finding 132. One of the two read (Purchase Status) contained a copy-paste error proving they are
  produced from a common source. Reading five more would add field names already recorded and no
  wiring.
- **`Purchase Order Discounts Window – Read Only`** — the read-only twin of the window fully dissected
  in batch 1 Finding 3, whose distinguishing property (it is read-only) is the finding.
**Identified but out of section, carried to later runs:**
`Kardex Direct Ship / As-Is / Regular / Summary` · `View Product Activity` · `Inventory Control
Settings` · `Point of Sale Control Settings` · `Product Kit Settings` · `Purchase Status Settings` ·
`Advanced Vendor Settings` · `Advanced Product Settings` · `Warehouse/Store Location Settings` ·
`Freeze Inventory` and the physical inventory update · `Report Invoice Exceptions` ·
`Update a Product Cost` · `Distribute Add-on Receiving Costs` · `Report Add-on Distribution Analysis` ·
`Receive a Purchase Order with a Separate Freight Bill` · `Reverse a Receiving Error` ·
`Ashley Interface Settings` · `Logistical Route Settings` · `Route Capacity Settings` ·
`Review Settings Activity` · `Track Processing Activity` · `Generate Daily Reports` ·
**`BMW_ACF`** *(a file with no screen)*.
Maps to:    **coverage statement, not a wiring finding**

> The two exclusions are deliberate and stated here so the coverage claim is honest. Everything else in
> the section was read. **The single largest remaining gap in Merchandising is the four `Kardex`
> screens** — the per-product movement ledger — which are Inventory Management articles reachable only
> from a Merchandising DTS inquiry. They should be picked up early in whichever run covers Inventory.

---

## C. Screen and field inventory

**Report Open To Buy Information** — Department Code · **Future Periods** *(up to 5)* ·
`Sales Order Statistics` · `Details for Stock Purchase Orders` · `Details for Special Order Purchase
Orders` · **`Calculate Using`** · Send Output to · Export Path. Amounts **in thousands, written sales**.
**Includes landed costs in all calculations.**

**Open To Buy Department Settings** — tabs **Category · Group · Region · Buyer · Planning Table**
*(Category/Group active only under `Product/Category Group`; Region/Buyer only under
`Region/Buying Group`)*. Department Code · Department Description · Category · Group · Region ·
Buying Group. *Planning Table*: **Gross Margin % · Freight Factor % · Stock %** · Month/Year ·
**Planned Sales · Planned Inventory EOM · Last Year Planned Sales**.

**Open To Buy Budget by Category** — Category · **Planned Sales** · **Planned Inventory EOM** ·
Month/Year · **Total Planned Sales** · **Total Planned Inventory EOM** · Add · Clear · grid.

**View Purchase Orders for a Specific Vendor/Recall** — vendor display block: Vendor · Address ·
**Country** · Contact · Email · Phone · **AP Terms** · **Currency** · **Exchange Rate**.
*List View filters*: **Status · Starting Delivery Date · Ending Delivery Date · Location** · Search ·
**Select All Purchase Orders** · grid · Save. Action: **`Recall Purchase Order`** from the General tab.

**Product GMROI and Turns Export** — Product · Group · Category · Vendor · Inventory Type · Region ·
Location · **Starting Period · Year · Ending Period · Year** · Primary/Secondary/Tertiary Sort ·
Send Output to · Export Path. **Excel or ASCII only; excludes obsolete products; run-time options not
printed.**

**Unsampled Stock Storage Location Selection** — two symmetric blocks, **Product Stocked At** and
**Product Displayed At**, each: Warehouse/Store · Storage Location · Selection · Starting Location ·
Ending Location · **Location List**.

**View Purchase Order Comments** — Vendor Code · Purchase Order; displays date, time, **operator's
initials**, comments. Read-only twin of `Update Purchase Order Comments`.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`Open to Buy` / `Open To Buy Department Control`** | Purchasing Control Settings | **`Product/Category Group`** vs **`Region/Buying Group`** — reshapes the settings screen and the department model |
| **`Confirm Pre-set Discounts`** | Purchasing Control Settings | Forces the discounts window open on recall when a vendor discount is active |
| `Preset Discounts` | Purchasing Control Settings *(batch 1)* | Standing vendor discount configuration |
| `Sort Report By` | **Point of Sale Control Settings** | Final sort of the GMROI export: Vendor Model or Product Key |
| `Gross Margin %` · `Freight Factor %` · `Stock %` | Open To Buy Department Settings → Planning Table | **Budget assumptions, separate from actual resolved values** |
| storage-location tracking | Warehouse settings | Prerequisite for floor-sample storage-location comparison |
| vendor `Exchange Rate` / `Currency` / `Country` / `AP Terms` | Vendor record | Feeds PO estimated rate, import status and payables terms |

---

## E. Security permissions catalog

| Mechanism | Note |
|---|---|
| entry vs read-only routine pairs | **Capability is granted by which routine a user is given**, not by field-level permissioning (Finding 144) |
| Regional Processing | **Does not apply** when editing OTB departments; **does** apply to the OTB report (Finding 138) |

---

## F. State machines and enumerations

**Open To Buy department models** — `Product/Category Group` · `Region/Buying Group` *(mutually
exclusive; one department per category/group or region/buyer)*.
**OTB budget horizon** — current fiscal period plus up to **5** future periods; unspent budget
**carries forward**.
**Planning Table months** — any month from the previous year through the following year.
**Recall gate** — available only with an untouched Merchandise grid; **once per source purchase order**.
**Export formats** — Excel · ASCII *(GMROI export)*; Screen · Printer · Excel · ASCII *(collection
performance)*; plus HTML and PDF elsewhere.
**Cost basis, final tally (seven)** — average · exact · weighted average · landed *(when allocated on
receipt)* · GL-posting-method-derived · **unlanded (KPIs)** · **landed (Open To Buy)**.

---

## G. Sequencing rules

1. Set `Open to Buy Department Control` **before** creating departments — it decides which tabs work.
2. A category or group, or a region/buying-group pair, belongs to exactly one department.
3. Budgets are entered per month on the Planning Table; category-level budgets open from a grid
   double-click when the department spans both regions and buying groups.
4. Only categories with inventory activity in the OTB region appear in the category budget grid.
5. `Recall Purchase Order` requires a vendor selected and an untouched Merchandise grid.
6. An active vendor preset discount forces the discounts window open on recall.
7. Regional Processing applies to the OTB report but not to OTB department setup.

---

## H. Open questions and gaps

**Gated or unreachable**
- **The four `Kardex` screens** — the per-product movement ledger. **The largest single gap left in
  Merchandising.**
- **`BMW_ACF`** — a file with no screen, changing what `FLR` means and which locations report.
- `Point of Sale Control Settings` · `Inventory Control Settings` · `Product Kit Settings` ·
  `Purchase Status Settings` — each referenced from three or more batches, none read.
- `Freeze Inventory` and the physical inventory update process.
- The **vendor subsidiary record** (batch 8) — supplies freight factor, lead weeks, stock weeks and
  cut dates; never described.

**Documented but ambiguous**
- **`Calculate Using`** on the OTB report — presumably the cost basis, which would matter given
  Finding 137.
- **`Stock %`** on the planning table — undefined; plausibly a stock-to-sales target.
- **How the budget `Freight Factor %` relates to the resolved landed freight factor** — no
  reconciliation documented, mirroring batch 2's unclosed add-on loop.
- **Who maintains the vendor `Exchange Rate` and when** — narrowed but still open; it feeds average
  cost for foreign products.
- **How a new category enters an OTB budget** when it has no inventory activity yet.
- **What "obsolete" means for the GMROI export** — `type 4` (batch 8), or the `Dropped`/`Discontinued`
  purchase statuses (batch 1)? Three product-status concepts remain unreconciled.
- **`approval hold`** (batch 10) — still unresolved against the eight known hold sources.

**Inferences (not in section B)**
- `Calculate Using` presumably selects the cost basis for the OTB calculation; not stated.
- `Stock %` is presumably a stock-to-sales ratio; not stated.
- The recall gate implies a "grid has been touched" flag distinct from "grid is empty"; the article
  describes the behaviour but not the mechanism.

---

## I. Unknown unknowns

- **Open To Buy including landed cost while the performance KPIs exclude it** — the two halves of a
  buyer's scorecard on different bases.
- **Unspent buying budget carrying forward** between fiscal periods.
- **A single setting that reshapes what an OTB department *is***, and gates half a settings screen.
- **Regional Processing applying at report time but not at setup time** within one feature.
- **A budget freight-factor assumption** with no documented reconciliation to actuals.
- **Categories invisible to the budget** until they have inventory activity.
- **`Recall Purchase Order`** — a reorder shortcut with a once-only, never-touched-the-grid gate.
- **`Confirm Pre-set Discounts`** — standing vendor discounts forced open on recall.
- **The vendor record holding the exchange rate** the purchase order copies as an estimate.
- **Obsolete products silently excluded** from the GMROI export.
- **A report whose run-time options are deliberately not printed**, breaking the section's convention.
- **A merchandising export's sort order set in Point of Sale Control Settings.**
- **A genuine set-difference report** (stocked minus displayed) requiring storage-location tracking.
- **Read-only twins as the section's access-control convention** — capability granted by routing.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Open To Buy (OTB) | Buying budget by department over fiscal periods; **includes landed cost** |
| Open To Buy Department Control | Setting choosing category/group vs region/buying-group departments |
| Planning Table | Where planned sales, planned EOM inventory and budget percentages are entered |
| Planned Inventory EOM | Budgeted end-of-month inventory cost |
| Stock % | Undefined planning-table percentage, plausibly stock-to-sales |
| Recall Purchase Order | Imports a previous order's products into a new one; once only |
| Confirm Pre-set Discounts | Setting forcing the discounts window open when a vendor discount applies |
| Read-only twin | Separate view-only routine paired with an entry routine; the section's access convention |

---

## Contract adjudication — batch 11

| Contract | Verdict | Basis |
|---|---|---|
| **W-061** | **CONFIRMED — with the run's sharpest finding** | Open To Buy includes landed cost; GMROI/Turns exclude it (F137) |
| **W-050** | **CONFIRMED inverted, further evidence** | Capability granted by routine assignment; Regional Processing applies at report but not setup time (F138, F144) |
| **W-012** | **CONFIRMED** | OTB runs on fiscal periods with carry-forward (F137) |
| **W-005 / W-006** | **complete** | Recall and preset discounts close the PO-creation family (F140) |
| **W-052 / W-053** | **NOT DOCUMENTED IN THIS SECTION** | Final verdict: Merchandising documents almost no GL consequences |
