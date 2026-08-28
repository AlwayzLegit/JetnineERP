# 01 — The Reporting Platform

Every report in `05` and most inquiries in `03`/`04` are assembled from the same small set of
criteria fields, scoping rules, and output plumbing. Build this once.

---

## The standard criteria vocabulary

These recur across dozens of reports with identical semantics. In `05` they are referenced as
`[STD …]` rather than restated.

### `[STD Date Code]`

A dropdown of named periods that gates a start/end date pair.

| Code | Meaning |
|---|---|
| `CUS` / Custom Dates | Activates Start Date and End Date for manual entry |
| `TDAY` | Today |
| `YDAY` | Yesterday |
| Current Period to Date | Start/End auto-filled from the open sales period |
| `LPTO` / Last Period Total | Start/End auto-filled from the prior period |

**Rules:**
- Selecting anything other than `CUS` **fills in and disables** Start and End Date.
- With `CUS`, a blank Start Date means "earliest available"; a blank End Date means "latest
  available" (stated for several reports; treat as the general rule).
- Start Date cannot be in the future and cannot exceed End Date; End Date cannot precede Start.
- `[GATE]` **`LPTO` against a closed period returns nothing** and displays *"No items
  Selected"* — the data is gone, purged by period close.

Some reports add an **As Of Date** (a point-in-time snapshot rather than a range) and a
**Report on Date Type** switch choosing **System Date** vs **Transaction Date** as the basis
for selection. That distinction matters — a transaction posted late has two different dates —
and should be explicit in our model, not implied.

**Naming inconsistency in the source:** the same control appears as *Date Code*, *Date Type*,
and *Date*; its bounds appear as *Start/End*, *Starting/Ending*, and *From/To*. Normalize to one
component and one vocabulary.

### `[STD District]` and `[STD Location]` — mutually exclusive scoping

Nearly every report offers **District** and **Location/Store/Warehouse Location** as *mutually
exclusive* filters: entering one deactivates the other.

`[GATE]` District is available only when **all three** hold:
1. Regional Processing is active (*Regional Processing* in General System Control Settings),
2. the user is **not** restricted to a store or list of locations (*Location Restrictions* tab
   in Create a User), and
3. the Location field on the screen is blank.

`[GATE]` Conversely, several reports require **at least one location** when not reporting by
district.

Location fields are multi-select through a consistent chain: type a code → or Arrow for a
single pick → or "Multiple Locations" / the Action button for the **Multiple Locations
Selection Window** → or its Search button for the **Multiple Selection Lookup Window** with
Select All.

**Recommendation:** model this as one `ScopeFilter` with a mode (`district` | `location`) rather
than two fields that disable each other, and derive availability from the user's own location
restrictions. The mutual exclusion is then structural instead of a rule each screen re-enforces.

Note the vocabulary drifts — *Store*, *Store Location*, *Warehouse Location*, *Selling
Location*, *Ship From Location*, *Stock Location*, *Fulfillment Location* all appear. Some are
genuinely different concepts (a sale's selling location vs. the stock it draws on); some are the
same field named inconsistently. Distinguish deliberately: **selling**, **fulfillment**,
**stock**, and **ship-from** are real and distinct in `04` § View and Manage Open Order Lines.

### `[STD Salesperson]`

Single code, Search for a list, or Action for the **Multiple Salesperson Selection Window**.
Blank = all salespeople. Availability is narrowed by sales-security scoping — see `06`.

### `[STD Product dimensions]`

**Product**, **Group**, **Category**, **Brand**, **Vendor**, **Collection**, **Buying Group**,
**Inventory Formation** all follow one pattern: type a code, Search for a single pick, Action
for the matching Multiple *X* Selection Window, blank for all.

Two variations to preserve:
- On some reports (e.g. Report Open Sales Order Detail) **the Sort By selection determines which
  of these fields is active** — pick "Brand" as the sort and only Brand is enterable.
- On others they are freely combinable filters.

### `[STD Sort]`

Reports offer **Primary / Secondary / Tertiary** (and occasionally **Quaternary**) sort, each
with its own **Ascending / Descending** order, and "None Selected" for the optional levels.
Primary is generally mandatory where the control exists.

### `[STD Detail / Summary]`

Most reports offer Detail, Summary, or Both. **Summary usually restricts the available output
formats** — see Output below, and `06`.

### `[STD Send Output to]` / `[STD Export Path]`

Read-only display fields; changed via **Actions > Output Settings**. Export Path shows a
pre-set drive and folder for PRV / Excel / ASCII output and **cannot be edited**. Full
destination semantics live in the Printing handoff
(`docs/printing/02-output-and-report-delivery.md`); this section only ever *selects* one.

`[LEGACY]` The export path is a Windows drive letter. The *principle* — the system decides
where files land — is worth keeping; the mechanism is not.

---

## Output-format restrictions — the part that will bite

Output availability is **not** uniform. Specific reports restrict it, and the restrictions are
scattered through the source rather than centralized:

| Report | Restriction |
|---|---|
| Report Completed Sales Dollars | Summary → **Printer or Screen only**. Summary and Both → **Basic PDF or Report Archive only** (the source states both; verify against a live system) |
| Report Written Sales Dollars | Summary → **Screen only**. Detail + any of Include Audit Comments / All Salespeople / Customer's Full Address → **Excel unavailable** |
| Report Open Sales Order Summary | Any Details-tab *Include* option → **Screen or Printer only** ("adding any of those fields causes the other output options to format incorrectly") |
| Report InTouch Analysis | **PRV, Excel, or ASCII only** |
| Report InTouch Traffic Analysis | **PRV, Excel, or ASCII only — not Screen** |
| Customer Activity Log, Financing Activity Log | **Screen or Printer only**; Export Path inactive |
| Report Summarized Sales Receipts | Screen, Printer, Excel, ASCII |
| Report Daily Financing Payments (scheduled) | **Report Archive or XML** |
| View and Manage Open Orders (scheduled) | **NFS or Report Archive** (Archive default) |

The pattern: **adding columns or free-text blocks to a report breaks its fixed-width and
columnar output formats.** That is a layout-engine limitation leaking into the feature set.

**Recommendation:** in a modern renderer this restriction should not exist. Build output as a
projection over a result set — every report to every format. If a format genuinely cannot carry
a field (free-text comments in a fixed-width column), degrade that field, don't disable the
format. Where a restriction must remain, surface it as a disabled option with a reason, not a
silent absence.

---

## Columns that appear only in some formats

A recurring, deliberate behavior worth noting because it will surprise people:

- **Protection plan charges** are folded into the **Charges** column when printed or rendered as
  PDF, but broken out into their **own column** for Excel and PRV. Stated for: Report Completed
  Monthly Sales Dollars, Report Completed Sales Dollars, Report Open Sales Order Summary, Report
  Written Sales Dollars, Report Written Sales Summary.
- **Salesperson Init** appears on Report Daily Financing Activity only in Excel/PRV; where an
  order has multiple salespeople, **the first ID is used**.
- Report Written Sales Dollars: **ID, Second Description, Vendor, Category, Marketing Code 1,
  Marketing Code 2, PO** are available only in PRV / Excel / ASCII.

**Recommendation:** do not vary the *data* by output format. Vary presentation density if
needed, but a total that means one thing on paper and another in a spreadsheet is how
reconciliation disputes start. If protection plans deserve their own column, give them one
everywhere.

---

## Run-time options echo

Several reports **print the run-time options selected on the last page of the output** (some in
the header). This is a small, genuinely good practice: a report that has left the building
carries its own provenance. Port it — every export should embed the filter set that produced it,
plus who ran it and when.

Report Pick List's equivalent in the Printing section does the same thing; treat it as a platform
feature, not a per-report one.

---

## Dynamic Tab Settings (DTS)

The composition mechanism for inquiry screens. A DTS inquiry is a **set of tabs assembled from a
catalog**, user-configurable via the *Dynamic Tab Settings* routine.

Facts from the source:
- Standard DTS inquiries **can be modified but not deleted**: View Customer Activity, View
  Product Activity, View Salesperson Activity, View Open Sales Orders with Pending Plans, View
  All Revolving Receivable Activity for a Customer.
- Some screens exist **only** as DTS tabs and are not on any menu — View Customer Summary
  Information, View Customer Rewards.
- Some exist as both a DTS tab and a stand-alone screen — Open Quotes by Salesperson, View Open
  Layaways by Salesperson.
- A tab can be **swapped for an alternate**: if ATP is not in use, `IC.204.TAB` on View Product
  Availability can be replaced with `IC.207.TAB` (Stock Availability Inquiry), which drops the
  ATP columns.
- Several tabs are **shared fragments** reused across inquiries: *General Revolving* ("included in
  every receivables DTS screen"), *View a Customer's General Information* (the General tab on many
  customer inquiries).
- The header (Customer Code + phones + email; or Salesperson + email/phone/location) **repeats on
  every page of a DTS**.

**Recommendation:** this maps cleanly onto a composable panel/widget model — a registry of
named panels, each declaring the context key it needs (customer, product, salesperson), and a
per-screen layout that users can arrange. Build the registry even if the first release ships
fixed layouts; retrofitting composition is far more expensive than designing for it.

`[LEGACY]` Do not port the tab-ID mechanism (`IC.204.TAB`) or a settings screen that edits it by
code. The *capability* is what matters.

---

## Right-click menus (Dynamic Escapes)

`[LEGACY]` User-definable context menus via **Dynamic Escape Settings**. Delivered options vary
by screen — e.g. on View Historical Sales Leads: Customer Buy History Inquiry, Lead Activity Log,
View Product Availability; on the sale-merchandise grid: Kit Inventory/Availability Inquiry,
Warehouse Stock Inquiry, Add Escapes to Current Screen.

`[GATE]` A right-click menu requires a valid entry in the screen's key field first.

Ship the useful destinations as ordinary contextual actions. Skip the user-configurable
framework unless someone asks for it.

---

## The Active Locations List

A small but real piece of shared state, and the only article in the section devoted to it.

Three routines maintain a shared list of locations across their tabs: **View Product
Availability**, **View Monthly Sales Performance for a Product**, **Search for a Sales Order by
a Specific Product**.

Rules:
- Selecting locations at any Location prompt in those routines **adds them to the list**.
- The list **survives tab changes and the Clear button** (Clear behaves this way *only* in these
  routines) but is **cleared on Exit**.
- **One location in the list** → every tab with a Location prompt uses it; tabs without one
  ignore the list.
- **Multiple locations** → multi-select prompts use all of them; **single-select prompts use only
  the first**; tabs without a prompt ignore it.
- Changing a single-select prompt to a location **not** in the list **clears the list** and seeds
  it with the new location.

**Recommendation:** this is session-scoped filter state shared across panels — a good idea
implemented confusingly (the "first location wins" rule is arbitrary and the clear-on-mismatch
rule is surprising). Keep the concept: a sticky location scope for product research. Make it
visible and explicitly editable rather than an invisible side effect of whichever field was
touched last.
