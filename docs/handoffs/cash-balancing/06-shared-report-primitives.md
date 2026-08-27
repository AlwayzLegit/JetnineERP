# 06 — Shared Report Primitives

Every screen in `03`, `04`, and `05` is assembled from the same handful of
primitives. Build each **once**, in shared code, and consume it from the report
screens. Most of these already have dedicated specs from earlier handoffs
(Sales Views and Reports; Getting Started → Printing) — reuse those rather than
re-specifying.

---

## 1. Date Code resolver

The `Date Code` field appears across many STORIS routines, not just reports.
It resolves a code into a start/end date pair.

| Code | Meaning |
|---|---|
| `CUS` | user-defined start and end dates |
| `TDAY` | today's date |
| `YDAY` | yesterday's date |
| `TMRW` | tomorrow's date |
| `LPTD` | last period to-date — *run on 9/25/13 → 8/01/13 – 8/25/13* |
| `LPTO` | last period total |
| `CPTD` | current period to-date — *run on 9/25/13 → 9/01/13 – 9/25/13* |
| `CYTD` | current year to-date |
| `YPTD` | last year period-to-date |
| `YPTO` | last year period total |
| `LYTD` | last year to-date |
| `LYTO` | last year total |

**[RULE 6.1] Not all codes everywhere.** The available subset varies per field.
The resolver must accept a per-call allow-list; do not hardcode the full set
into every screen.

**[RULE 6.2] CUS activates, everything else populates-and-locks.** Selecting
`CUS` activates the dependent date field(s) — `Start Date`/`End Date`, or in
some routines a single `As-Of Date` or `Starting Date`. Default values may be
accepted as-is. Any other code computes the dates and renders them
**read-only**.

**[RULE 6.3] Period semantics.** `LPTD`/`CPTD`/`YPTD` are **fiscal-period**
relative, not calendar-month relative. They must resolve against the fiscal
calendar. Confirm LA Mattress's fiscal calendar definition — see `09`.

---

## 2. Calendar picker
*(article 15238859217684 — not re-captured this pass; see `09`)*

A date-picker affordance attached to active date fields. Appears on
`Balance Date` (`03`) and `Start Date`/`End Date` (`04`). Behavioral
requirement: it is only offered when the underlying field is active, i.e. when
`Date Code = CUS`.

---

## 3. Multi-select pickers

Three distinct pickers are referenced by the reports in this handoff:

| Picker | Used by |
|---|---|
| **Multiple Staff Selection Window** *(15294752953492)* | `03` → `Operator` |
| **Multiple Location Selection Window** *(15294766862100)* | `03` → `Store`; `04` → `Store` |
| **Multiple District Selection Window** *(15294752249876)* | `03` → `District`; `04` → `District` |

`05` additionally references a **Multiple Bank Selection Window** and a
**Multiple Hold Codes Selection Window**, and `02` references a **Multiple
Selection Lookup Window** for payment types.

**[RULE 6.4] Two affordances, two behaviors.** These fields consistently offer
*two* distinct interactions, and the distinction is meaningful:

- the **arrow / search** affordance → a simple lookup list, choose one (or more)
- the **action** affordance → the dedicated **multi-select window**

Preserve the distinction, or deliberately collapse it to a single modern
multi-select and record that decision. Do not do it accidentally per screen.

**[RULE 6.5] Blank means all.** Across every one of these fields, leaving it
blank means *all* — all drawers, all operators, all locations, all districts,
all companies, all countries. Make that the shared default, not a per-field
rule.

> Earlier handoff coverage: the multi-select pickers were dissected as part of
> the Sales Views and Reports section (18 multi-select pickers). Reuse those
> specs; do not re-derive.

---

## 4. Output destination & export path
*(Output Settings 15202105620756; Personal Report Viewer 15202090257172 — not
re-captured this pass; see `09`)*

Every report screen in this handoff ends with the same pair of fields:

### `Send Output to`
Displays the current output destination. Changed via the actions affordance →
**Output Settings**.

### `Export Path`
**Read-only in every routine.** When the destination is one of:

- **Personal Report Viewer (PRV)**
- **Excel Export**
- **ASCII Export**

…it displays the pre-set drive and folder to which the system exports report
data. It cannot be edited from the report routine — it is set in Output
Settings.

Known destinations referenced across these articles: **Basic PDF** (see `04`
RULE 4.8), **Personal Report Viewer (PRV)**, **Excel Export**, **ASCII Export**,
and screen output (the fallback described in `07` → Switch User Location).

> Earlier handoff coverage: Output Settings, PRV, and the report archive were
> dissected in full as part of the Getting Started → Printing handoff (28
> articles). This handoff assumes that plumbing exists; it only records how
> these three screens consume it.

---

## 5. Regional Processing gate

Both `03` and `04` carry the note: *the output of this report may be affected by
Regional Processing restrictions — you can inquire only about customers and
locations to which you have access.*

### What Regional Processing is
A feature that (a) organizes sales and inventory information into
location-based groups for reporting, and (b) restricts employee access to data
by region and/or district, or by a pre-defined location list.

- **Districts** segregate **sales** information.
- **Regions** segregate **inventory** information.
- Either or both may be used. (Example from the source: sales districts for
  north and south of the state, and one inventory region covering the whole
  state.)
- Each region is geographically associated with a **zip code**.
- **Location restrictions can be applied even when Regional Processing is not
  active.**

> Cloud-tenancy caveat from the source: restriction *by district or region* is
> not available to Cloud users, though location restriction and
> regional/district pricing are. Not binding on an in-house build — noted for
> fidelity.

### Setup sequence
1. License Regional Processing on the **Licensing** tab of General System
   Control Settings.
2. Create districts and/or regions and assign stores/warehouses to them.
3. Activate Regional Processing on the Licensing tab.
4. Report and inquire by district/region; set selling prices by district and
   calculate landed costs by region via District and Regional Product Settings.
5. Restrict employee data access along geographic lines.

**[RULE 6.6] Activation precondition.** Regional Processing can only be set
Active if it is Licensed **and every warehouse location has a District and a
Region set (non-null)**. Otherwise the activation fails with:
*"All Warehouse Locations must have Districts and Regions set up to activate
Regional Processing"*.

### Dependent restriction settings
Available for update only while the module is active:

- **`Restrict Customer Lookup`** — restricts lookup at Customer fields along
  district lines. Off → all customers eligible.
- **`Restrict Inter-Region Transfers`** — prevents automatic or manual
  merchandise transfers crossing regional boundaries.
  **[RULE 6.7]** This setting **overrides everything** — full and unrestricted
  user access, and cases where a user has list access to locations in multiple
  regions. It is an absolute bar, not a permission check.
- **`Restrict Product Use/Lookup By Region`** — restricts product use by the
  regions specified at `Limit Use By Region` in Advanced Product Settings.

### Access model
`Regional Processing` + `Restrict Customer Lookup` both on ⇒ customer-record
access is governed by the **Location Restrictions** tab of the User file, across
four independently configurable areas:

| Area | Keyed on |
|---|---|
| Sales Entry Routines | District |
| Sales Inquiries and Reports | District |
| Inventory Entry Routines | Region |
| Inventory Inquiries and Reports | Region |

Each area takes one of four restriction modes:

- **No Restrictions** — all customers available
- **Logon Location** — only customers of the current log-on location
- **District** — only customers of the current log-on district
- **Location List** — only customers on the `Accessible Locations List` from the
  User file or the log-on Warehouse Location record

**[RULE 6.8] Known-number override.** Regional restriction on a customer record
**can be overridden if the user knows the customer number**. This is a
deliberate escape hatch in STORIS. Decide explicitly whether LA Mattress keeps
it — it is a real access-control hole if kept silently. See `09`.

**[RULE 6.9] Reports read the gate at query time.** The restriction is applied
to the report's dataset, not to the criteria UI. Two users running identical
criteria may legitimately get different rows. Reports must therefore be
reproducible *per user*, and any caching keyed on criteria alone is wrong.

Additional lever noted by the source: user access to sales information can also
be restricted via `View All Sales Information` in **Extended Security (Sales)**
settings.

> Interaction note: when Regional Processing is active, the location-restriction
> fields on the **Access** tab of *Create a User* and *Create a User Group* are
> active. When it is not active, those fields are inactive in *Create a User*
> but remain active in *Create a User Group*.

---

## 6. Report footer convention
See `05` RULE 5.4 — run-time options selected print on the last page of report
output. Implement once in the shared renderer.
