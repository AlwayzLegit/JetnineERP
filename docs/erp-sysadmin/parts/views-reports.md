# System Administration Views and Reports — `SAR-001` … `SAR-045`

*STORIS section: **System Administration Views and Reports**, section id `51935643676820` (45 articles).*
*Slug: `views-reports`. ID prefix: `SAR`.*

This section is a grab-bag of three genuinely different things, and it is worth separating them before
reading the entries:

1. **`SAR-001`–`SAR-018`, `SAR-027`–`SAR-029`, `SAR-031`** — *shared UI primitives*. Multi-select pickers,
   read-only lookups, a free-text entry grid, time/interval pickers, a Soundex vendor search. These are not
   screens a user navigates to; they are the parameter-entry widgets that every report and inquiry in STORIS
   reuses. In our ERP these collapse to **one** component family, not twenty-one screens.
2. **`SAR-019`–`SAR-025`, `SAR-030`** — *actual reports*. Parameterised, run-and-output, mostly async-capable.
3. **`SAR-026`, `SAR-032`–`SAR-045`** — *read-only "View X Settings" inquiries*. Each is a byte-for-byte
   read-only clone of a maintenance screen owned by another pack. **We should not build these as separate
   screens at all** — see `SAR-SHARED-09`.

---

## Cross-cutting primitives (`SAR-SHARED-*`)

These are the things worth building once. Every individual entry below points back here instead of
re-specifying the same behaviour 45 times. The Inventory pack (`11-reports-and-views.md`) already asserts
most of these as "common requirements for all reports" — this section is the evidence for why.

### `SAR-SHARED-01` — Scope/parameter picker (one component, many bindings)

Eighteen of the 45 articles in this section exist **only** because STORIS built a separate modal per entity
type: Activity Type, Category, Company, District, Exception, Franchise, Function, Location, Prefixes,
Printer, Probability, Reason Code, Region, Staff, plus a generic Entry window, a generic Selection Entry
window, a Mail-user window, and a Read-Only lookup. They are ~95% identical prose.

Build **one** `<ScopeSelect entity="..." />`:

| Capability | Seen in | Notes |
|---|---|---|
| Type-ahead direct entry with validation on commit | all | `<Enter>` commits in most; `<Tab>` / **Plus (Add)** button in Franchise (`SAR-008`); explicit **Add** button in Location (`SAR-010`) and Printer (`SAR-012`) |
| Search button → lookup modal | most | Backing lookup differs: *Multiple Selection Lookup*, *Read-Only Lookup* (`SAR-018`), *Read-Only Staff Lookup* (`SAR-017`), *Printer Zone Lookup* (`SAR-012`) |
| Selected items grid with description column | all | |
| Remove one / clear all | all | Button labels drift: **Clear**/**Delete** (`SAR-001`) vs **Delete** only (most) |
| **Ordered** selection (Promote/Demote or Up/Down) | `SAR-004`, `SAR-005`, `SAR-010`, `SAR-015` | Order is semantically meaningful for some lists (e.g. location lists — the *first* location is the login default) |
| Roll-up populate (pick a Region/District → grid fills with its locations) | `SAR-010` | |
| Unvalidated free text | `SAR-006` | max 20 alphanumeric chars, **no validation at all** |
| Read-only mode | `SAR-004`, `SAR-010`, `SAR-012`, `SAR-015`, `SAR-016` | Rendered when the host screen is a "View …" inquiry |
| Collapsed display as `"..."` when >1 item chosen | all | |
| Save/OK vs Exit-without-applying | all | Confirm button is **OK** in older screens, **Save** in newer ones — same semantics |

**Hard rule:** the picker must be *permission-filtered at the source*, not filtered client-side. `SAR-010`
states location lookups only show locations the user can reach under Regional Processing.

### `SAR-SHARED-02` — Date Code resolver

Nearly every report's date scope is a two-part control: a **Date Code** enum plus **Start Date** / **End Date**.

- Exact enum values observed: **`CUS`** (custom range) and **`TDAY`** (today). `SAR-030` renders the same
  concept with long labels: **Custom Dates**, **Today**, **Yesterday**.
- **Hard rule:** picking any code other than `CUS` **auto-populates Start/End and makes them read-only**.
  Picking `CUS` activates them.
- `SAR-021` degenerates to a single-ended range: `TDAY` = "up to today", `CUS` = "up to the End Date"; the
  Start field is inactive.
- `SAR-024` breaks the pattern entirely — **no Date Code at all**, just an optional Start and optional End,
  each independently blankable to mean "unbounded".

Build a `DateScope` value object with `{code, start, end}`, a resolver that materialises `code` → concrete
dates *at run time* (not at parameter-save time — see `SAR-SHARED-04`), and support for open-ended bounds.

### `SAR-SHARED-03` — Output destination and export

Every report carries the same trailing pair of fields:

| Field | Type | Purpose / business rule |
|---|---|---|
| Send Output to | display + Actions → *Output Settings* | Shows the current destination; changed via a separate Output Settings modal, not inline |
| Export Path | display, read-only | Populated when the destination is **Personal Report Viewer (PRV)**, **Excel Export**, or **ASCII Export**. **Not editable from the report screen** — it is a pre-set client drive/folder |

STORIS destinations seen: Screen, Printer, **PRV**, **Excel Export**, **ASCII Export**, hold queue, plus a
per-user local-printer mode (`SAR-037`).

**Do differently:** we have no fat client, so "Export Path" is meaningless. Replace with
`format ∈ {csv, xlsx, pdf, screen}` plus delivery ∈ `{inline, inbox, email}`. Keep the *idea* of a
per-user default output preference (it lives on the user record in `SAR-037`).

### `SAR-SHARED-04` — Saved parameter sets

Not a STORIS feature in this section, but demanded by the shape of these reports (`SAR-023` has four
interacting parameters with activation rules; `SAR-025` has six). Already asserted by the Inventory pack.
Store the parameter *symbolically* — save `date_code = TDAY`, never the resolved date — so a saved set
re-run tomorrow means tomorrow.

### `SAR-SHARED-05` — Async run + results inbox

STORIS is explicitly synchronous and it hurts: `SAR-023` says **"Once Run is enacted, the Excel report runs
immediately and the spreadsheet opens"**, and `SAR-030` says **"After the report has been run, the Update
History Reports screen closes automatically."** Both are blocking-modal behaviours we should not copy.

Recommended split for this section (opinionated):

| Mode | Reports |
|---|---|
| **Live queryable view** (paged grid, filter-as-you-type, sub-second) | `SAR-026` Staff Location Restriction Review, `SAR-035` Bar Code Scanner Download Activity, `SAR-042` Rebate Plan Status, and every `View … Settings` inquiry |
| **Live view with async export** | `SAR-019` Customer Merge Status, `SAR-020` Error Messages, `SAR-021` Files Created via Entry, `SAR-025` Time Clock Activity, `SAR-030` Updates History |
| **Async-only, run-and-inbox** | `SAR-022` Menu Access matrix, `SAR-023` User Security matrix, `SAR-024` Secured Decryption Activity |

`SAR-022` and `SAR-023` are cross-joins (every user × every security setting; every user group × every menu
item) — they are inherently wide and slow and belong in the inbox pattern with a durable artifact.

### `SAR-SHARED-06` — Report archive and archive visibility

`SAR-037` defines **Access Archived Reports** on the user record with exactly two values:
**`All Archived Reports`** and **`User's Archived Reports`**, feeding the *Review Archived Reports* and
*Review Print Jobs* screens. **New users default to `User's Archived Reports`.**

**Hard rule to carry over:** an async results inbox is a data-leak surface. A completed report artifact
inherits the *row-level* scope of the parameters it was run with, and visibility of the artifact itself is
governed by this two-value permission. Default deny-others.

**Contradiction to note:** `SAR-023` says its Excel output is **"not saved in the report archive"** — i.e.
STORIS has a class of reports that deliberately bypass the archive. Our equivalent decision is whether a
security-matrix export is retained (it is itself sensitive) — see `[DECISION NEEDED]` in `SAR-023`.

### `SAR-SHARED-07` — Cost visibility (`SEC-COST-VIEW`, Inventory pack)

Reuse `SEC-COST-VIEW` from `10-security-permissions.md`. **Omit, do not blank**, cost columns — including in
CSV/XLSX headers and API responses.

Screens in *this* section that must honour it:

| Req | Why |
|---|---|
| `SAR-033` View Advanced Product Settings | Read-only product master — carries cost fields and the Gross Margin Calculator action |
| `SAR-039` View Deduct From Invoice Settings | DFI codes are PO cost discounts; STORIS files it under a menu literally named **Purchasing Cost Views** |
| `SAR-042` View Rebate Plan Status Settings | Goal Type `C = Total Cost of Purchases`, plus per-transaction earned-rebate dollars |
| `SAR-043` View Terms Settings | Discount percentages that change landed cost; also filed under **Purchasing Cost Views** |
| `SAR-044` View Vendor Settings | Vendor cost/terms defaults |
| `SAR-036` View Bill Back Settings | Vendor-owes amounts on PO lines |

**Hard rule:** STORIS groups these under a *menu* called "Purchasing Cost Views". Do **not** implement that as
menu-level hiding only — `SAR-022` exists precisely because menu access and data access are different things
in STORIS and admins cannot tell them apart. Enforce `SEC-COST-VIEW` at the field serializer.

### `SAR-SHARED-08` — Audit / user-activity spine (`RPT-AUDIT`)

**Answer to the standing question: STORIS does *not* have a general change log here.** What this section
contains is four narrow, unrelated activity logs — `SAR-024` (secure-data decryption), `SAR-025` (time clock),
`SAR-030` (software update packets), `SAR-035` (scanner batch downloads) — plus an error log (`SAR-020`) and
an on-the-fly file log (`SAR-021`). There is **no** "who changed what field on what record" report anywhere in
this section. The Inventory pack's assumption that one exists is **not** satisfied by STORIS.

`SAR-024` is nonetheless the best template we have and is spec'd in full below. Generalise it into a single
`RPT-AUDIT` over one append-only `audit_event` stream:

```
audit_event(
  id, occurred_at,
  actor_user_id,            -- SAR-024 "Requested By"
  authorizing_user_id,      -- SAR-024 "Granted By"  (nullable; = actor when self-authorised)
  outcome,                  -- GRANTED | DENIED         (SAR-024 "Attempted Access")
  category,                 -- SECURE_VIEW | SETTING_CHANGE | PERMISSION_CHANGE | RECORD_CHANGE | LOGIN | JOB
  data_type,                -- SAR-024: CA | CC | FR | SS  (extensible)
  subject_type, subject_id, -- e.g. customer, product, purchase_order
  location_id, company_id,
  field, old_value, new_value,   -- null for pure-view events
  source, session_id, ip
)
```

Design rules lifted from `SAR-024` and worth keeping verbatim:

- **A denial is an audit event.** STORIS writes a record when access is *attempted and refused*, and the
  report can be filtered to `Denied` only. This is the single most valuable line in the whole section.
- **Two actors, not one.** `Requested By` (the logged-in user) and `Granted By` (whoever's credentials
  unlocked it). **When the requester has clearance themselves, both columns show the same ID.** Our
  step-up-auth flow must record both.
- **Retention is a setting, with a floor.** STORIS: minimum 12 months, governed by *Secured Audit Retention
  Months* in Accounts Receivable Control Settings, purged at month-end.
- Default sort: **data type → access date → access time**.

Consolidation: this stream should also back the Inventory pack's `RPT-PROD-ACTIVITY` "user" column and
`RPT-RTN-NOORIG` loss-prevention report rather than each keeping a private log.

### `SAR-SHARED-09` — Do not build "View X Settings" screens

Fifteen entries here (`SAR-032`, `SAR-033`, `SAR-034`, `SAR-036`, `SAR-037`, `SAR-038`, `SAR-039`, `SAR-040`,
`SAR-041`, `SAR-043`, `SAR-044`, `SAR-045`, and read-only variants of `SAR-004`/`SAR-010`/`SAR-012`/`SAR-015`/
`SAR-016`) exist solely because STORIS could not render a maintenance screen in read-only mode. Every one of
them says the same sentence: *"The fields displayed in this inquiry are identical to those found on the
&lt;X&gt; screen, but may NOT be updated from this inquiry."*

**Build instead:** one `readOnly` prop on each settings form, driven by the caller's write permission. This
deletes fifteen screens, fifteen menu entries, and fifteen future drift bugs. The *only* thing we must
preserve is the **menu placement**: STORIS surfaces the same read-only record under Payables, Purchasing,
Receivables, Financing, and Buyer Tools menus (see the Access paths in each entry) because different roles
need to see the same reference data. Preserve that with cross-links / a global search, not with copies.

---

## Article entries

### `SAR-001` Mail Multi User/Group Selection Window
*storis_ref: article 15294766344980*

**Purpose.** Multi-select picker for adding users and messenger groups to a STORIS Messenger mail group.

**Where it lives.** Opened from the Mail ID field of the current messenger group screen (no explicit menu
path given in the article).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Mail ID | code entry + Action menu | Code of the user or messenger group to add. Selected items land in the grid. |
| Action → **Staff** | lookup | Lists **mail-eligible users only**. A user is mail-eligible if the **Mail User Flag** checkbox on the **General** tab of their User file is checked. |
| Action → **Mail Group Display** | lookup | Lists messenger groups. |
| Grid | list | Added items with description. |

**Behavior & rules.** Direct entry commits on `<Enter>`; an invalid code raises an error and must be
re-entered or looked up. **Clear** or **Delete** empties the grid; double-click a row to select it and
activate **Remove**. **OK** applies and returns; **Exit** discards. **Hard rule:** eligibility for this
picker is a *flag on the user record*, not a permission — so a user can be permitted to use Messenger and
still be invisible here.

**Dependencies.** User file **Mail User Flag** (`SAR-037` General tab family); STORIS Messenger settings on
the user record (`SAR-037`: Enable Messenger Access, Messenger Administrator, Default Messenger Form).

**Build notes.** Instance of `SAR-SHARED-01` with `entity=user|group` and a server-side eligibility predicate.
We are unlikely to ship an in-ERP messenger; if we do not, this picker survives only as the
"notification recipients" selector for scheduled reports. `[DECISION NEEDED]` Do we build an internal
messenger at all, or route all system notifications to email/Slack? If the latter, `SAR-001` is dropped and
recipient selection becomes an email-address multi-select.

### `SAR-002` Multiple Activity Type Selection Window
*storis_ref: article 15294766350740*

**Purpose.** Generic multi-select picker bound to activity-type codes.

**Where it lives.** Appears at any field that accepts multiple activity types (no menu path — it is a modal).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Direct entry; commits on `<Enter>`; invalid entry errors. |
| Search | button | Opens **Multiple Selection Lookup** window. |
| Grid | list | Item + description. |

**Behavior & rules.** Standard grid behaviour: **Clear**/**Delete** = remove all; double-click a row to
activate **Remove**; up/down arrows navigate; **OK** applies, host field then shows `"..."`; **Exit**
discards.

**Dependencies.** Activity type code table; `SAR-SHARED-01`.

**Build notes.** No distinct behaviour from `SAR-003`/`SAR-007`/`SAR-009`/`SAR-013`/`SAR-014`. Collapse.

### `SAR-003` Multiple Category Selection Window
*storis_ref: article 15294752100628*

**Purpose.** Generic multi-select picker bound to product category codes.

**Where it lives.** Modal at any multi-category field.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Commits on `<Enter>`; invalid entry errors. |
| Search | button | **Multiple Selection Lookup** window. |
| Grid | list | Item + description. |

**Behavior & rules.** Identical to `SAR-002` except **remove-all is labelled `Delete` only** (no `Clear`).

**Dependencies.** Product category hierarchy (Inventory pack item model); `SAR-SHARED-01`.

**Build notes.** Category is the one entity here where our picker genuinely needs to differ: categories are
hierarchical, so support "select parent ⇒ include descendants" with an explicit toggle. STORIS has no such
concept and forces users to enumerate leaves.

### `SAR-004` Multiple Company Selection Window
*storis_ref: article 15294752252820*

**Purpose.** Multi-select picker for company codes, with **ordered** selection.

**Where it lives.** Modal at multi-company fields; reached e.g. from the **Company** field on the Access tab
of the user record (`SAR-037`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Commits on `<Enter>`. |
| Search | button | **Multiple Selection Lookup** window. |
| Grid | ordered list | Up/Down arrows **rearrange order**, they do not merely navigate. |

**Behavior & rules.** **Hard rule:** *"The read-only version of this screen appears when accessed through a
view-only version of the routine, such as View Vendor Settings. In this version, you may only view the
currently available selection(s)."* — the read-only variant is a *mode*, not a separate component.
Remove-all = **Delete**; single remove via double-click then **Remove**.

**Dependencies.** Company table; `SAR-037` Access tab **Company** field (which states: blank ⇒ access to all
companies, and costing processes present information based on the locations of accessible companies);
`SAR-SHARED-01`, `SAR-SHARED-09`.

**Build notes.** Ordering matters here — treat the list as an ordered array in the API. `[DECISION NEEDED]`
Is LA Mattress multi-company? If we are single-company today, keep the `company_id` column on every table
and the scope plumbing, but hide the picker behind a feature flag rather than removing it — retrofitting
company scoping later is far more expensive than carrying an unused column.

### `SAR-005` Multiple District Selection Window
*storis_ref: article 15294752249876*

**Purpose.** Multi-select picker for district codes.

**Where it lives.** Modal at multi-district fields (e.g. the **District** parameter of `SAR-025`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Commits on `<Enter>`. |
| Search | button | **Multiple Selection Lookup** window; **deselecting inside the lookup is the documented way to bulk-remove**. |
| Grid | ordered list | **Promote / Demote** buttons reorder. |
| Remove / Clear | buttons | **Remove** deletes the selected grid row. **`Clear` clears the *field*, not the grid — "No action has been taken on the item."** |

**Behavior & rules.** This is the newer of the two picker generations: confirm button is **Save** (not OK).
**Gotcha:** the `Clear` vs `Remove` distinction is genuinely confusing and is a real source of user error —
our component should have one destructive action per scope with unambiguous labels.

**Dependencies.** District table; Regional Processing must be active for districts to exist (`SAR-037`);
`SAR-SHARED-01`.

**Build notes.** Adopt the newer generation's semantics (Save, Promote/Demote, lookup-as-bulk-editor) as the
single implementation, and drop the `Clear`-that-does-nothing affordance.

### `SAR-006` Multiple Entry Window
*storis_ref: article 15202502995604*

**Purpose.** Free-text multi-entry grid for values that have **no** backing code table.

**Where it lives.** *"Action button at the Customer Class field in the Report Aged Trial Balance routine."*

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Entry | free text, **max 20 alphanumeric** | **The items you enter are not validated in the system.** Press `<Enter>` to add to the grid. |
| Grid | list | Entries accumulate as typed. |

**Behavior & rules.** **Hard rule — no validation.** Whatever the user types becomes a filter predicate.
Typos silently produce empty result sets. Cited use cases: customer classes, closed vendor invoices.

**Dependencies.** None (deliberately).

**Build notes.** Keep an unvalidated variant — it is genuinely useful for pasting a list of invoice numbers or
SKUs — but **surface the miss**: after running, show "3 of 5 supplied values matched no records: X, Y". That
one line removes the entire class of silent-empty-report support tickets. Also accept paste-of-newline-list,
which STORIS cannot do.

### `SAR-007` Multiple Exception Selection Window
*storis_ref: article 15294752250772*

**Purpose.** Generic multi-select picker bound to exception codes.

**Where it lives.** Modal at multi-exception fields.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Commits on `<Enter>`. |
| Search | button | **Multiple Selection Lookup** window. |
| Grid | list | Item + description. |

**Behavior & rules.** Identical to `SAR-003`. Remove-all = **Delete**; **OK** applies; **Exit** discards.

**Dependencies.** Exception code table — related to the Inventory pack's cost exceptions
(`COST-040`/`COST-041`, surfaced as `RPT-COST-EXCEPTIONS`); `SAR-SHARED-01`.

**Build notes.** Collapse into the shared picker. Note the entity link: our cost-exception queue filter
should reuse this binding.

### `SAR-008` Multiple Franchise Selection Window
*storis_ref: article 15294752478356*

**Purpose.** Multi-select picker for franchise codes, used in eligibility restrictions.

**Where it lives.** *"Eligibility Restriction Settings > Action button at Franchise field."*

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | code entry | Franchise code. Commit with **`<Tab>` or the Plus (Add) button** — *not* `<Enter>`. |
| Description | display | Fills once a valid code is entered. |
| Search | button | Opens the **Read-Only Lookup Window** (`SAR-018`), not the Multiple Selection Lookup. |
| Grid | list | Code + description; double-click to select. |

**Behavior & rules.** Confirm is **Save**. Remove-all = **Delete**; single remove via double-click →
**Remove**. **Gotcha:** commit key differs from every sibling window (`<Tab>` vs `<Enter>`) — exactly the kind
of inconsistency we must not reproduce.

**Dependencies.** Franchise table; Eligibility Restriction Settings (owned by another pack); `SAR-018`.

**Build notes.** Collapse. `[DECISION NEEDED]` LA Mattress is (presumably) not franchised — confirm whether
`franchise` is a scope dimension we need at all, or whether it collapses into `company`.

### `SAR-009` Multiple Function Selection Window
*storis_ref: article 15294752476692*

**Purpose.** Generic multi-select picker bound to function codes.

**Where it lives.** Modal at multi-function fields.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Commits on `<Enter>`. |
| Search | button | **Multiple Selection Lookup** window. |
| Grid | list | Item + description. |

**Behavior & rules.** Identical to `SAR-003`.

**Dependencies.** Function/routine registry — the same catalogue `SAR-022` reports on; `SAR-SHARED-01`.

**Build notes.** Collapse. The underlying entity (the catalogue of every routine/menu item) is worth having as
a real table in our ERP: it is what makes `SAR-022` and screen-action permissions possible.

### `SAR-010` Multiple Location Selection Window
*storis_ref: article 15294766862100*

**Purpose.** The most-used picker in the system: builds an ordered list of warehouse/store locations, with
region and district roll-ups.

**Where it lives.** Modal at any multi-location field — `SAR-025` **Store**, `SAR-026` **Location**,
`SAR-037` **Warehouse/Store Location** and **Store Manager Locations**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Location | code entry + **Add** button | Enter a valid code then click **Add**. Search opens the Multiple Selection Lookup Window. |
| Description | display | Fills once a valid location is specified. |
| Region | select | **Populates the grid with every location in the chosen region.** Repeatable for multiple regions. **Active only if Regional Processing is active.** |
| District | select | Same, for districts. **Active only if Regional Processing is active.** |
| Clear List | button | Empties the grid. |
| Grid | ordered list | **Promote / Demote** reorder. |

**Behavior & rules.**
- **Hard rule:** *"The locations available to individual users can be affected by Regional Processing
  restrictions, meaning that only locations to which you have access appear in the lookup."* — server-side
  filtering of the option set, not just the result set.
- Read-only variant when hosted by a View routine (e.g. `SAR-045`).
- **Order is load-bearing elsewhere:** `SAR-037` states the system defaults the login location to *the first
  location that appears on the list*, and `SAR-025` filters by *the first location on the list*. So this
  grid's ordering is not cosmetic.
- Confirm = **Save**; host field shows `"..."`.

**Dependencies.** Location/warehouse master (`SAR-045`); Region and District tables; **Regional Processing**
toggle in General System Control Settings; `SAR-037` Access tab.

**Build notes.** This is the one picker worth real investment. Requirements: async search over hundreds of
locations, region/district/"all my locations" roll-up chips, explicit ordering with a designated **primary**
location (rather than "index 0 is magic"), and a saved named list concept (STORIS calls these *Global
Location List* / *Location List* / *Accessible Location List*). **Do differently:** make "primary/default
location" an explicit field on the user record instead of an emergent property of list order — see the
`SAR-025` gotcha for what happens when it stays implicit.

### `SAR-011` Multiple Prefixes Selection Window
*storis_ref: article 15294752807572*

**Purpose.** Multi-entry picker for document prefixes.

**Where it lives.** Modal at multi-prefix fields.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | direct entry only | **No Search button — direct entry only.** |
| Grid | list | Entered prefixes. |

**Behavior & rules.** Remove-all = **Delete**; single remove via double-click → **Remove**; **OK** applies,
**Exit** discards.

**Dependencies.** Document numbering prefixes (order/PO/invoice prefixes, owned by numbering settings).

**Build notes.** Collapse into `SAR-SHARED-01` with a `lookup: false` option. Our numbering scheme should make
prefixes a real enumerable table so the lookup *can* be offered.

### `SAR-012` Multiple Printer Selection Window
*storis_ref: article 15294767010836*

**Purpose.** Multi-select picker for **Printer Zones**.

**Where it lives.** Modal at printer-zone fields; read-only variant reached from `SAR-045` View
Warehouse/Store Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Printer Zone | code entry | On `<Enter>`, **Description** populates and the green **Add** and blue **Clear** buttons activate. Must be entered correctly or an error appears. |
| Description | display | Auto-filled. |
| Search | button | Opens the **Printer Zone Lookup Window**. |
| Grid | list | Items append **at the bottom of the list**. |

**Behavior & rules.** Remove via double-click → red **Remove** (buttons appear *to the right of the Fee
field* — the article's own copy-paste slip; there is no Fee field on this screen). Confirm = **Save**.

**Dependencies.** Printer Zone settings; `SAR-037` **Printer Zone**, **Default Logical Printer**,
**Default Print Form**, **Printer Admin Level**; `SAR-045`.

**Build notes.** Almost certainly **out of scope** for us — a cloud ERP prints via browser/PDF, not zones and
logical printers. Keep only if warehouse label/ticket printers need routing; in that case the concept we
actually need is *printer routing rule per location per document type*, which is a settings table, not a
picker. `[DECISION NEEDED]` Confirm whether warehouse label printing needs server-side routing.

### `SAR-013` Multiple Probability Selection Window
*storis_ref: article 15294752810516*

**Purpose.** Generic multi-select picker bound to CRM/lead probability codes.

**Where it lives.** Modal at multi-probability fields.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Commits on `<Enter>`. |
| Search | button | **Multiple Selection Lookup** window. |
| Grid | list | Item + description. |

**Behavior & rules.** Identical to `SAR-003`.

**Dependencies.** CRM probability codes (InTouch CRM — see `SAR-037` CRM section); `SAR-SHARED-01`.

**Build notes.** Collapse. Only relevant if we build lead/opportunity tracking.

### `SAR-014` Multiple Reason Code Selection Window
*storis_ref: article 15294767144340*

**Purpose.** Generic multi-select picker bound to reason codes.

**Where it lives.** Modal at multi-reason-code fields.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Commits on `<Enter>`. |
| Search | button | **Multiple Selection Lookup** window. |
| Grid | list | Item + description. |

**Behavior & rules.** Identical to `SAR-003`.

**Dependencies.** Reason code table — the same codes the Inventory pack's ledger carries per row
(`RPT-PROD-ACTIVITY` has a reason-code column); `SAR-SHARED-01`.

**Build notes.** Collapse. **Important entity link:** reason codes are a shared dimension across adjustments,
returns, RTVs and transfers; make it one table with a `scope` discriminator so this picker can filter to the
reason codes valid for the calling report.

### `SAR-015` Multiple Region Selection Window
*storis_ref: article 15294752950676*

**Purpose.** Multi-select picker for region codes, with **ordered** selection.

**Where it lives.** Modal at multi-region fields; read-only variant reached from `SAR-033` View Advanced
Product Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Commits on `<Enter>`. |
| Search | button | **Multiple Selection Lookup** window. |
| Grid | ordered list | Up/Down arrows **rearrange order**. |

**Behavior & rules.** Read-only variant when hosted by a View routine. Remove-all = **Delete**; **OK**
applies; **Exit** discards.

**Dependencies.** Region table; Regional Processing toggle; `SAR-SHARED-01`, `SAR-SHARED-09`.

**Build notes.** Collapse. Region/District/Location is a three-level hierarchy in STORIS — model it as one
`org_unit` tree with a level enum rather than three parallel tables, so a single scope picker can span all
three.

### `SAR-016` Multiple Selection Entry Window
*storis_ref: article 15294767616788*

**Purpose.** The most generic member of the family: free-text multi-entry with no lookup and no description.

**Where it lives.** Modal at any generic multi-entry field.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Entry | free text | `<Enter>` appends **to the bottom of the list**. |
| Grid | list | Entries only (no description column). |

**Behavior & rules.** Read-only variant when hosted by a View routine. Double-click a row to activate the red
**Remove**. Confirm = **OK**; host field shows `"..."`; **Exit** discards.

**Dependencies.** None; `SAR-SHARED-01`.

**Build notes.** This plus `SAR-006` are the same thing; ship one unvalidated-list input.

### `SAR-017` Multiple Staff Selection Window
*storis_ref: article 15294752953492*

**Purpose.** Multi-select picker for users/staff. Used by most report parameters that scope by user.

**Where it lives.** Modal at user/staff fields — `SAR-022` **User Group ID**, `SAR-023` **User ID** and
**User Group ID**, `SAR-024` **Requested By** and **Granted By**, `SAR-025` **Select User**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (entry field) | code entry | Commits on `<Enter>`. |
| Search | button | Opens the **Read-Only Staff Lookup** window (a `SAR-018` instance), not the Multiple Selection Lookup. |
| Grid | list | Item + description. |

**Behavior & rules.** Remove-all = **Delete**; **OK** applies; **Exit** discards.

**Dependencies.** User file (`SAR-037`) and User Group file (`SAR-038`); `SAR-018`.

**Build notes.** Collapse — but this instance carries a **privacy consideration STORIS ignores**: a staff
picker enumerates the whole org chart to anyone who can open any report. Gate the option list by the caller's
location/company scope (`SAR-026`, `SAR-037` Access tab) rather than returning all users.

### `SAR-018` Read-Only Lookup Window
*storis_ref: article 15294753602068*

**Purpose.** Generic single-select lookup that lists the records of a file-maintenance routine so the user can
pick one as a response to the current prompt. Cannot create records.

**Where it lives.** Modal opened from the **Search** button next to any coded field. The window is named after
the field — e.g. clicking Search at a **Salesperson** field opens *"Salesperson - Read Only"*.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (result grid) | list | All records from the associated maintenance file. |

**Behavior & rules.** **Hard rule:** *"You can choose an item from the read-only list, but you cannot create
and enter a new response."* To change the list you must go to the associated maintenance routine (e.g. the
Terms Code File for a Terms Code lookup). Up/down arrows navigate; scroll for overflow; `<Enter>` or
double-click selects.

**Dependencies.** Every code table in the system; consumed by `SAR-008`, `SAR-017`, `SAR-026`, and most
`View …` inquiries.

**Build notes.** Our equivalent is a single `<EntityPicker>` with an `allowCreate` capability flag. **Do
differently:** support inline "create new…" *when the caller has the maintenance permission* — the round-trip
through a separate maintenance screen is a real productivity tax and the permission check makes it safe.
Also: these lookups must be **searchable and paged**; STORIS renders the whole file into a scrolling grid,
which will not survive our SKU/customer counts.

### `SAR-019` Report Customer Merge Status
*storis_ref: article 15202553752980*

**Purpose.** Lists the merge status and merge eligibility of customer records that have been selected for
de-duplication, so an operator can review the merge list before/after running it.

**Where it lives.**
- `Point of Sale > Customer Merge > Report Customer Merge Status`
- `Point of Sale > Customer Merge > Manage Customer Merge List > PRINT Button`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Duplicate Customer Code | code entry, blank = all | The *duplicate* (losing) customer to report on. Search button → customer lookup; Action button → **Multiple Customer Selection Window** for several. **Blank includes all duplicate customers.** |
| Merge Status | enum, multi-select | Arrow → single value from drop-down; Action → **Multiple Selection Lookup Window** for one, several, or all. |
| Date Code | enum | Time period basis. See `SAR-SHARED-02`. |
| Start Date | date | Active only when Date Code = **`CUS`**; otherwise auto-filled and **not editable**. Calendar icon available. |
| End Date | date | Same rule as Start Date. |
| Send Output to | display + Actions → Output Settings | `SAR-SHARED-03`. |
| Export Path | display, read-only | Shown for **PRV**, **Excel Export**, **ASCII Export**. **Not editable here.** |

**Merge Status enum — exact values**

`Recommended`, `Pending`, `Attempted`, `Merged`

**Output columns.** Not enumerated in the article. Minimum implied set: duplicate customer code, surviving
customer code, merge status, eligibility, and the date the status was set.

**Behavior & rules.** *"Once the report criteria have been selected, click Run to produce the report."*
Sort order and subtotals are not documented. The four-state lifecycle is the interesting content:
`Recommended` (system-proposed) → `Pending` (queued by an operator) → `Attempted` (tried, presumably failed or
partially applied) → `Merged` (done). **`Attempted` existing as a distinct terminal-ish state means merges can
fail mid-flight** — our implementation must make merge atomic or record a precise failure reason.

**Dependencies.** Customer Merge list (Point of Sale, another pack); customer master (`SAR-032`); Multiple
Customer Selection Window (a `SAR-SHARED-01` instance not itself documented in this section).

**Build notes.** Live queryable view over the merge queue, not a printed report — the whole point is to work
the list. Add: eligibility *reason* per row (why the system says the pair is a duplicate, and why a merge is
blocked), a link to a side-by-side diff of the two records, and an inline merge/reject action. Add an
`Attempted` failure-reason column that STORIS lacks. **Retain an audit event per merge** in the
`SAR-SHARED-08` stream (`category=RECORD_CHANGE`, subject=customer) — a merge destroys data and must be
attributable. `[DECISION NEEDED]` Are merges reversible in our ERP? If not, require a second approver above a
configurable order-count/AR-balance threshold.

### `SAR-020` Report Error Messages
*storis_ref: article 15202742729620*

**Purpose.** Lists system error messages encountered during **End-of-Day (EOD)** or **End-of-Month (EOM)**
processing, filtered by operator, error message, and date range.

**Where it lives.** `System Administration > System Tools > Report Error Messages`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Date Code | enum | `SAR-SHARED-02`. |
| Start Date | date | Active only when Date Code = **`CUS`**; otherwise auto-filled, read-only. |
| End Date | date | Same. |
| Enter Operator | code entry, blank = all | *"the code of the operator whose STORIS Messenger output you want to list"*. Search button lists valid operators. **Blank = all operators.** |
| Enter Error Code | code entry / drop-down, blank = all | Down-arrow lists valid error codes. **Blank = all error codes.** |
| Send Output to | display + Actions | `SAR-SHARED-03`. No Export Path field documented on this one. |

**Output columns.** Not enumerated. Implied: date/time, operator, error code, message text, originating
process (EOD/EOM).

**Behavior & rules.**
- **Hard rule / key operational note:** *"This report runs as part of the End-of-Day process. However, to
  report on errors (if any) that occur in the time between the last End-of-Day process and the next business
  day, you can run this report manually."* So the report has a **scheduled instance** and a **manual
  instance**, and the scheduled one leaves a blind window.
- Errors are routed through **STORIS Messenger** — i.e. the error log and the internal mail system are the
  same pipe, which is why the operator filter is described in Messenger terms.

**Dependencies.** EOD/EOM batch processes; STORIS Messenger (`SAR-001`, `SAR-037` Messenger settings);
Schedule a Process (`SAR-028`, `SAR-029`).

**Build notes.** In our ERP this is **job-run observability**, not a report. Build:
`job_run(id, job, started_at, finished_at, status, actor, params)` +
`job_event(run_id, seq, level, code, message, subject_ref)`. Then this "report" is a filtered view over
`job_event` with `level >= ERROR`. Kill the blind window by making the view live rather than EOD-generated.
Push failures to the operations channel immediately instead of waiting for a nightly report. Feed
`category=JOB` rows into `SAR-SHARED-08` so a single audit query answers "what happened last night".
**Do differently:** do not couple error reporting to an internal mail system.

### `SAR-021` Report Files Created via Entry Processes
*storis_ref: article 15202930411668*

**Purpose.** Lists code-table records that were created **"on-the-fly"** — i.e. new codes an operator invented
mid-transaction rather than through the proper maintenance routine. A data-hygiene report.

**Where it lives.** `System Administration > System Tools > Report Files Created via Entry Processes`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Date Code | enum | **`TDAY`** = range up to today. **`CUS`** = range up to the date entered at **End**. |
| End Date | date | **Inactive when Date Code = `TDAY`.** When `CUS`, the cutoff date up to which data displays. |
| Send Output to | display + Actions | `SAR-SHARED-03`. |
| Export Path | display, read-only | PRV / Excel Export / ASCII Export. |

**Output columns.** Not enumerated. Implied: file/entity, code created, description, creating user, creation
date, originating entry process.

**Behavior & rules.**
- **Hard rule — retention:** *"The system retains this data for 60 days after creation before purging via the
  next End of Month process that occurs after the 60 days expires."* So effective retention is 60 days **plus
  up to a month**, not exactly 60 days.
- **Hard rule — scheduling:** *"this report runs automatically during the End-of-Day process if a check
  appears at the On-The-Fly Maintenance field in the General System Control Settings."* Named setting:
  **On-The-Fly Maintenance** (General System Control Settings).
- Single-ended date range only — there is no start bound.

**Dependencies.** General System Control Settings → **On-The-Fly Maintenance**; EOD/EOM; every code table
that permits on-the-fly creation.

**Build notes.** The underlying feature (create a code table entry from inside a transaction) is worth having —
it prevents blocked sales — but STORIS's follow-up is weak: a report someone might read. **Do differently:**
model on-the-fly creations as a **review queue with states** (`NEW` → `APPROVED` / `RENAMED` / `MERGED` /
`REJECTED`), assigned to a data steward, with the record flagged `provisional` until approved. Emit a
`SAR-SHARED-08` event (`category=RECORD_CHANGE`, `source=on_the_fly`) at creation. **Never purge the audit
row** — purge the queue entry, keep the event. `[DECISION NEEDED]` Which code tables may be created on the
fly at LA Mattress? Default should be *none* except reason codes and customer classes.

### `SAR-022` Report on Menu Access
*storis_ref: article 15203012857236*

**Purpose.** Produces the full **user-group × menu-item** access matrix so an admin can review which groups
can reach which routines.

**Where it lives.**
`System Administration > Get Started > Enter Your Information > Get Started Step 5 - Users > Report on Menu Access`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| User Group ID | code entry, multi, blank = all | Search → list; Actions → **Multiple Staff Selection Window** (`SAR-017`). **If more than one is selected the field shows `"...."`.** If left blank, **"All User Groups"** displays below the field and all groups are included. |

**Output — structure and columns**

- **Output format is Excel only**, saved locally on the PC. No other destination is offered.
- Cells contain the literal strings **`YES`** / **`NO`**.
- Covers **both custom and standard menu items**.
- **The first row corresponds to the Language Code selected for the User Group** — relevant only when
  Multi-Lingual Processing is active.

**Behavior & rules.** **Source contradiction, flag it:** the article's introduction says *"The User Groups are
listed in rows while all the menu items, both custom and standard, are along the column"*, but the note on
the User Group ID field says *"The User Groups are listed in the top row with all the menu items … in the
first column."* The two statements describe transposed layouts. **Treat the orientation as unspecified**; our
implementation should offer both (pivot toggle) and not try to match STORIS.

**Dependencies.** User Group file (`SAR-038` — *"User groups provide menu security"*); the menu/function
catalogue (`SAR-009`); Multi-Lingual Processing (General System Control Settings); companion report `SAR-023`.

**Build notes.** Async run-and-inbox (`SAR-SHARED-05`) — this is a full cross-join and will be wide.
Requirements:
- Emit **XLSX and CSV**, plus a **live pivot view** in-app; STORIS's Excel-only, no-archive posture is a
  compliance liability.
- **Diff mode is the actually useful feature:** "show me what changed in the menu-access matrix since
  &lt;date&gt;". Reviewing a 40×600 YES/NO grid by eye finds nothing; a diff finds everything. This falls out
  free once permission changes are events in `SAR-SHARED-08` (`category=PERMISSION_CHANGE`).
- Include the menu item's **stable key**, not just its display label, so the report survives renames.
- **Do differently:** STORIS separates *menu* access (`SAR-022`) from *security setting* access (`SAR-023`),
  and admins routinely confuse the two. We should have **one** permission model and **one** matrix report,
  with a `kind` column distinguishing route access from capability grants.

### `SAR-023` Report on User Security
*storis_ref: article 15203028700948*

**Purpose.** Produces the **user (or user-group) × security-setting** matrix — every extended-security
checkbox, for every user or group, as a filterable spreadsheet.

**Where it lives.**
`System Administration > Get Started - Enter Your Information > Get Started Step 5 - Users > Report on User Security`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| User ID | code entry, multi, blank = all | Search → list; Actions → **Multiple Staff Selection Window**. Single ⇒ name shown below field; multiple ⇒ `'...'`; all ⇒ **'All Users'**. **Invalid ID ⇒ message displayed and the field is cleared.** |
| User Group ID | code entry, multi, blank = all | Same affordances; single ⇒ description below field; multiple ⇒ `'...'`; all ⇒ **'All User Groups'**. |
| Module | multi-select | Which security module(s) to report. Single, multiple, or all. |
| Report For | enum: `Users` \| `User Groups` | Controls whether rows are individual users or user groups. |

**Mutual-exclusion rules (hard):**
- **When User ID is populated, User Group ID is inactive — *unless* the User ID selection is 'All Users'.**
- **When User Group ID is populated, User ID is inactive — *unless* the selection is 'All User Groups'.**
- **When User ID has been defined (any entry except 'All Users'), the `Report For` field is inactive.**

**Module enum — exact values**

```
Create a User / Create a User Group
Create a User/Group Actions - Import Data Security
Create a User/Group Actions - Logistics Security
Create a User/Group Actions - Payables Security
Create a User/Group Actions - Personal Information Security
Create a User/Group Actions - Purchasing Security
Create a User/Group Actions - Receivables Security
Create a User/Group Actions - Sales Security
Create a User/Group Actions - Service Security
Create a User/Group Actions - System Security
```

*(Note: `SAR-037` and `SAR-038` also list a **Transfer Security** action menu, which does **not** appear in
this report's module list — a genuine coverage gap in STORIS.)*

**Output — structure, columns, sort**

| Aspect | Rule |
|---|---|
| Format | **Always Excel.** *"Once Run is enacted, the Excel report runs immediately and the spreadsheet opens."* |
| Archive | **Not saved in the report archive.** |
| Rows | Users, or user groups when `Report For = User Groups` |
| Columns | One per security setting, using **the same text that appears on the security settings screens** in Create a User / Create a User Group |
| Column header prefix | **The setting's associated module code precedes the header text (e.g. `TE`, `AR`)** |
| Column grouping | **All settings for a module are grouped together; modules appear alphabetically** |
| Row sort | **Users sorted by user ID ascending, regardless of their user group association** |
| Cell values | **`YES`** if the setting is checked, **`NO`** if blank |
| Extra columns | **Logistics, Purchasing, Receivables and Sales Security have additional entries that appear in additional columns** |
| Filtering | The spreadsheet is filterable (Excel autofilter) |

**Behavior & rules.** Blocking-modal execution. No date scope — it is a point-in-time snapshot of *current*
configuration with **no as-of capability**. That is the biggest functional gap: you cannot ask "what could
this user do on the day the discrepancy occurred?"

**Dependencies.** `SAR-037` Create a User (Security tab and its Actions menu); `SAR-038` Create a User Group;
**Extended Security** toggle in General System Control Settings (*"Security settings on these screens are only
effective if extended security is active"*); the `SEC-*` registry in the Inventory pack's
`10-security-permissions.md`; companion `SAR-022`.

**Build notes.** This is the highest-value report in the section for us and needs to be better than STORIS's:

1. **Async run-and-inbox** (`SAR-SHARED-05`), CSV + XLSX + live pivot. Not a blocking modal.
2. **As-of-date parameter.** Rebuild the matrix as of any timestamp by replaying `PERMISSION_CHANGE` events
   from `SAR-SHARED-08`. This is the point-in-time behaviour STORIS lacks entirely and it is what makes
   incident investigation possible.
3. **Effective vs. granted.** STORIS reports the raw checkbox. We must report **effective** permission
   (group grant ∪ user grant, minus denies) *and* show the source of each grant, because
   `SAR-038` **Reset User Members** can mass-overwrite user records from the group.
4. **Include the report itself in `SEC-*`.** A full security matrix is an attacker's shopping list. Gate it
   behind an admin permission, and **write an audit event whenever it is run** (`category=SECURE_VIEW`).
5. `[DECISION NEEDED]` Retention of generated matrices. STORIS deliberately does not archive them. Proposal:
   archive them, but in the restricted-visibility bucket (`SAR-SHARED-06`, `User's Archived Reports`
   semantics) with a short TTL — we want the historical evidence more than we want to avoid the artifact.
6. Include **Transfer Security** — closing the STORIS gap noted above.
7. Cost visibility: the matrix will contain a row/column for `SEC-COST-VIEW` itself. That is fine and
   desirable; `SEC-COST-VIEW` gates *cost values*, not *the name of the permission*.

### `SAR-024` Report Secured Decryption Activity
*storis_ref: article 15203214259476*

**Purpose.** **The audit report.** Reports the audit trail the system writes whenever a user views — or
*attempts and is denied* — secure data such as a customer's full credit-card number. This is the only true
audit/user-activity report in this section and the template for our `RPT-AUDIT`.

**Where it lives.** `System Administration > System Tools > Report Secured Decryption Activity`

**What generates the audit rows.**
- A user "unmasks" secure data — the article's worked example is the **Credit Card Number Full Display**,
  reached from the **View a Customer's Current Deposits - Detail** screen.
- **A user attempts to access secure data and is denied due to security restrictions — this also writes an
  audit record.** (Denials are first-class events, not silent failures.)

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Requested By | user, multi, blank = all | The **login user who requested access**. Search → user list; Action → **Multiple Staff Selection Window** (`SAR-017`). Blank = all users. |
| Granted By | user, multi, blank = all | The user **whose ID and password were entered to permit access**. **If the requesting login user has security clearance themselves, Requested By and Granted By show the same ID.** |
| Customer Code | single customer, blank = all | Search → **Search for a Customer** screen. Only one customer may be specified. |
| Type | enum, single or all | Secure data type. |
| Start Date | date, optional | **Blank = earliest available access / attempted-access date.** Calendar picker. |
| End Date | date, optional | **Blank = latest available.** |
| Attempted Access | enum | Restrict to **Granted** only, **Denied** only, or **All attempts — successful and failed**. |
| Send Output to | display + Actions | `SAR-SHARED-03`. |
| Export Path | display, read-only | PRV / Excel Export / ASCII Export. |

**Type enum — exact values**

```
All – All types
CA  – Checking (online)
CC  – Credit Card
FR  – Finance
SS  – Social Security
```

**Output columns.** Explicitly named in the article: **Requested By**, **Granted By**. Implied by the sort and
the parameters: **data type**, **access date**, **access time**, **customer code**, **granted/denied**.

**Sort order (hard, explicit).** *"The report sorts by data type (credit card, etc.), by access date, and then
by access time."* No subtotal or grouping levels are documented; data type is the natural grouping break.

**Retention (hard).** *"Data available to be reported on is retained on the system for a minimum of 12 months
before it is purged during month-end processing. The **Secured Audit Retention Months** field in **Accounts
Receivable Control Settings** determines how long this data is retained."*

**Behavior & rules.**
- **Point-in-time semantics:** rows are immutable historical events; there is no as-of parameter because
  every row already carries its own timestamp. Correct design — copy it.
- **Two-actor model:** the requester/authoriser split is exactly the shape of a step-up-authorisation
  ("manager override") flow and must be preserved in our audit schema.
- Note the odd placement: a **system-security** retention control lives in **Accounts Receivable** settings.
  Do not replicate that.

**Dependencies.** Accounts Receivable Control Settings → **Secured Audit Retention Months**; Personal
Information Security (an Actions-menu module on `SAR-037`/`SAR-038`, and a module in `SAR-023`); month-end
purge process; customer master (`SAR-032`).

**Build notes.** This becomes `RPT-AUDIT` per `SAR-SHARED-08`. Specifics:

1. **Schema** as given in `SAR-SHARED-08`. `data_type` starts as `CA | CC | FR | SS` and must be extensible
   without migration — we will add at least `BANK_ACCT`, `DL` (driver's licence), `DOB`, `PHONE`, and
   `COST` (see 4 below).
2. **Denied events are mandatory.** Every 403 on a sensitive resource writes a row. Add a
   `denial_reason` column STORIS lacks (`no_permission`, `out_of_scope_location`, `record_locked`,
   `step_up_expired`) — "Denied" with no reason is nearly useless during an investigation.
3. **Live view + async export.** The grid is a live filterable view (`SAR-SHARED-05`); large exports go to the
   inbox. Default sort matches STORIS: `data_type, occurred_at`.
4. **Log cost views.** `SEC-COST-VIEW` denials — and, behind a config flag, successful cost views — should
   write to this stream with `data_type = COST`. STORIS has no equivalent; we get it almost free and it
   answers "who exported our margin data".
5. **Retention:** make it a first-class setting (**not** in an AR settings screen), default **24 months**,
   with a hard floor of 12 and a **legal-hold flag that suspends purging**. Purge by scheduled job, and
   **write an audit event recording the purge itself**.
6. **This report is itself sensitive.** Running it reveals which customers had cards viewed. Gate behind an
   admin permission, restrict the customer-code parameter to users with customer-PII access, and
   **audit every run of the audit report** (`category=SECURE_VIEW`, `subject_type=report`).
7. **Never store the decrypted value in the audit row.** STORIS does not, and neither should we — `old_value`
   / `new_value` must be masked or omitted for `data_type ∈ {CC, SS, CA, FR}`.
8. **Allow multiple customers.** STORIS restricts the Customer Code parameter to exactly one; there is no
   reason for that limit and it blocks "show me all activity on these 12 accounts".
9. Consolidation: this stream also satisfies the Inventory pack's `RPT-RTN-NOORIG` loss-prevention need
   (user, amount, date, referenced order) and the user column on `RPT-PROD-ACTIVITY`.

### `SAR-025` Report Time Clock Activity
*storis_ref: article 15203214462356*

**Purpose.** Lists time-clock punches for a date range and a set of employees, optionally scoped by district
or store.

**Where it lives.** `System Administration > System Tools > Time Clock > Report Time Clock Activity`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Date Code | enum | `SAR-SHARED-02`. |
| Start Date | date | Active only when Date Code = **`CUS`**; otherwise auto-filled, read-only. |
| End Date | date | Same. |
| Start User | user code | First User ID in an **alphabetical range**. Blank = start from the first User ID in the system. |
| End User | user code | Last User ID in the alphabetical range. Blank = end at the last User ID. **Leave both blank to run for all users.** |
| Select User | user, multi | Discrete user list via the **Multiple Selection Lookup Window**. Coexists with the Start/End range fields. |
| District | code, multi | Search → district list; Action → **Multiple District Selection Manager**. **Active only if Regional Processing is active AND the Store field is empty.** |
| Store | code, multi | Arrow → location list; Action → **Multiple Location Selection Window** (`SAR-010`). **Active only if the District field is empty.** |
| Send Output to | display + Actions | `SAR-SHARED-03`. |
| Export Path | display, read-only | PRV / Excel Export / ASCII Export. |

**Output columns.** Not enumerated. Implied: user ID, name, punch date, punch time, in/out, location.

**Behavior & rules.**
- **District and Store are mutually exclusive** — each is inactive while the other has a value.
- **The gotcha of the whole section, quoted in full:** *"If you run this report by district or store, the
  program lists time clock activity for those users whose **first location listed at the Valid Logon
  Locations field in the User file** matches a store specified here. That is, if you run the report for store
  26, the report lists all time clock activity for users whose first location on this list is store 26. If
  you run the report for store 88, the report **excludes activity for users whose first location is not 88,
  even if one or more of those users logged into store 88 at some point within the selected date range**."*

  In other words the store filter matches the employee's *home store as implied by list order*, **not the
  store where the punch happened**. Running "store 88" does **not** give you who worked at store 88. This is
  silently wrong for anyone who floats between stores — precisely the population a store manager cares about.
- Three overlapping user selectors (range + list) with no documented precedence.

**Dependencies.** Time Clock module; `SAR-037` **Warehouse/Store Location** on the Access tab (explicitly:
*"The Report Time Clock Activity routine also references this field when you run the report by store or
district"*); Regional Processing; `SAR-005`, `SAR-010`, `SAR-017`.

**Build notes.**
- **Fix the defect: store the location on the punch.** Every clock event records `location_id` at the time of
  the punch. Filter on that. Offer *both* filters explicitly labelled — **"Punched at location"** (default)
  and **"Employee's home location"** — so the two questions are never confused again.
- Make **home location an explicit field** on the employee record rather than "the first entry in the valid
  logon locations list" (`SAR-010` build notes).
- Collapse Start User / End User / Select User into one multi-select with an optional range mode.
- Live view with async export. Group by employee with **subtotals: hours per day, per week, per pay period**
  — STORIS documents no subtotals at all, and hours-per-period is the only reason anyone runs this.
- Flag exceptions inline: missing punch-out, punch outside scheduled shift, >X hours.
- **Permissions:** time-clock data is employee-personal. Gate by `SEC-*` (HR/manager) and by location scope;
  a store manager sees their own store's employees only. `[DECISION NEEDED]` Are we building time clock in
  the ERP at all, or does it stay in the payroll/scheduling system? If external, we need only the import for
  labour-cost reporting and `SAR-025` is dropped.

### `SAR-026` Staff Location Restriction Review
*storis_ref: article 15295211660436*

**Purpose.** A single grid showing **every user's location restrictions at a glance** — the compliance
counterpart to `SAR-023`, answering "who can see which stores' data?".

**Where it lives.** `System Administration > System Settings > System Permissions > Staff Location Restriction Review`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Location | code, multi, blank = all | Filters the grid. Search → **Read-Only Lookup Window** (`SAR-018`); Action → **Multiple Location Selection Window** (`SAR-010`) for multiple *accessible* locations. **Once one or more locations are selected, the grid shows only users who have access to those location(s).** Blank ⇒ all locations available to the users are shown. |
| (column filters) | per-column | *"You can filter the grid display by location and by column headings."* |

**Output columns (exact, in order)**

```
User ID
Name
User Group
Sales Entry
Sales View/Report
Inventory Entry
Inventory View/Report
```

**Cell semantics (hard).** The four restriction columns render **the radio option selected in the user's
settings**, verbatim:
- `Logon Location` — when the Logon Location option was selected in that section
- `Global` — when Global Location List was selected; **and if a Global Location List was specified, the
  column also displays the list code**
- (by extension from `SAR-037`: `None`, `District` for the Sales pair, `Region` for the Inventory pair, and
  `Location List` + list code)

**Behavior & rules.** **Double-click a grid row to open that user's settings.** The grid is a live inquiry —
no Run button, no date scope, no output destination. It is a point-in-time view of current configuration.

**Dependencies.** `SAR-037` Create a User → **Access** tab (Sales Entry, Sales View/Report, Inventory Entry,
Inventory View/Report, Global Location List, Location List); `SAR-038` user-group restrictions;
Regional Processing; `SAR-010`, `SAR-018`.

**Build notes.** Keep this — it is a good screen and cheap to build. Improvements:
- **Show effective, expanded scope**, not just the mode name. `Global` + a list code tells the reviewer
  nothing; render the resolved location set (or a count with a hover/expand).
- Add the **Company** and **Fulfillment Location Restriction** columns from `SAR-037` — they are equally
  scoping and equally invisible today.
- Add the inverse pivot: **"who can see location X"** as a first-class view (the Location filter half-does
  this).
- Add an **as-of date** by replaying `PERMISSION_CHANGE` events (`SAR-SHARED-08`), same argument as `SAR-023`.
- Live queryable view (`SAR-SHARED-05`), CSV/XLSX export, admin-gated.
- **Merge with `SAR-023` in the UI:** one "Access review" screen with tabs *Capabilities* / *Locations* /
  *Menus* rather than three disconnected reports the admin has to remember exist.

### `SAR-027` Text Entry Screen
*storis_ref: article 15294766048020*

**Purpose.** (Article is nearly a stub.) A generic free-text comment editor for attaching comments to whatever
record the caller was on.

**Where it lives.** Opened from the host routine; no menu path given.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (text area) | multi-line text | Comments associated with the record in the calling routine. *"Some basic text editing features are available."* |

**Behavior & rules.** **Save** keeps changes and returns to the main routine; **Exit** abandons them. No
length limit, formatting rules, or validation documented.

**Dependencies.** Every routine that offers a comment/notes action. Relevant to the Inventory pack's
`RPT-PO-DELIV`, which exposes a **Number of Comment Lines** report parameter — meaning these comment blobs are
line-oriented and get printed.

**Build notes.** One `<NotesEditor>` bound to a polymorphic `note(subject_type, subject_id, body, author,
created_at)` table. **Do differently:** STORIS treats notes as an unstructured blob attached to a record,
which is why `RPT-PO-DELIV` needs a "how many comment lines to print" knob. Store notes as **discrete,
timestamped, attributed entries** (append-only, never edited in place) so reports can show "last 3 notes"
without a line-count parameter, and so notes are attributable in `SAR-SHARED-08`. Support markdown-lite and
@-mentions. Notes on customer records may contain PII — include them in the export-redaction rules.

### `SAR-028` Time Entry
*storis_ref: article 15294767776916*

**Purpose.** Scheduling widget: pick **multiple discrete times of day** at which a scheduled process should
run.

**Where it lives.** `Schedule a Process > Time field > Action button > Multiple Times`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Time | **military time, `HHMM` format** | The time the process should run. **Add** button or `<Enter>` commits it to the grid. Repeat for each run time. |
| Grid | list | Columns: **Time** and **Description**. |

**Behavior & rules.**
- **Times generated by the Specify Interval screen (`SAR-029`) appear in this grid** — the two screens write
  to the same list.
- **This is the only screen that can *edit* the list.** `SAR-029` states: *"To modify the items listed in the
  grid, you must access the Multiple Times screen after you save your entries here."*
- Double-click a line then **Remove** to delete. **Save** returns; host field shows `"..."`.

**Dependencies.** Schedule a Process (another pack); General System Control Settings; `SAR-029`.

**Build notes.** Replace the whole Time Entry / Specify Interval pair with a **cron expression plus a
human-readable builder** and a **"next 10 runs" preview**. Requirements STORIS implies that we must keep:
minute granularity, multiple runs per day, and per-day-of-week variation. Additions STORIS lacks:
**explicit time zone** (critical — LA Mattress is single-TZ today but EOD boundaries are a real correctness
issue), **catch-up/skip policy** if the worker was down, **overlap policy** (skip vs queue), and a
**max-runtime alert**. `[DECISION NEEDED]` Business day boundary and time zone for EOD/EOM — this decides
what "Today" means in every `SAR-SHARED-02` date code.

### `SAR-029` Time Interval Entry - Specify Interval
*storis_ref: article 15294767779604*

**Purpose.** Scheduling widget: generate run times by **interval within a window** (e.g. every 60 minutes
between 10:00 and 17:00), rather than listing each time.

**Where it lives.** `Schedule a Process > Time field > Action button > Specify Interval`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Start | military time | Start of the window during which the process runs at intervals. |
| End | military time | End of the window. |
| Every ____ Minutes | integer (minutes) | The interval. **Add** button commits and expands the window into the grid. |
| Grid | generated list | **Time** column in military format; **Description** column in standard time. |

**Behavior & rules.**
- **Multiple time periods and intervals can be specified for the selected day(s)** — the windows accumulate.
- Worked example from the article, quoted: *"if you entered a start time of 10:00 AM, end time of 17:00, and
  interval of 60 minutes, the process is scheduled to run every 60 minutes during the hours of 10:00 AM and
  5:00 PM."*
- **Hard rule:** the interval is **expanded eagerly into discrete times** at entry. There is no stored
  "every N minutes" rule — which is why editing must happen on `SAR-028`.

**Dependencies.** `SAR-028`; Schedule a Process.

**Build notes.** See `SAR-028`. The key thing to do differently: **store the rule, not the expansion.**
STORIS's eager expansion is why the interval is uneditable, why DST would corrupt it, and why you cannot ask
"why is this job running at 14:00?".

### `SAR-030` Updates History Report
*storis_ref: article 15203235627028*

**Purpose.** Reports which STORIS software updates have been applied to the account — the vendor-side change
log.

**Where it lives.** `System Administration > System Tools > Electronic Updates > Updates History Report`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Date Code | enum | `Custom Dates`, `Today`, `Yesterday`. Choosing Today/Yesterday **auto-populates both Start and End with that date and locks them**. |
| Start Date | date, `MM/DD/YYYY` | Editable **only** when Date Code = **Custom Dates**. Manual entry or calendar icon. |
| End Date | date, `MM/DD/YYYY` | Same rule. |
| Update Type | enum, single or multi | Pull-down; **Multiple Types** or the Action button opens the **Multiple Selection Lookup Window** for a combination. |
| Send Output to | display + Actions | `SAR-SHARED-03`. |
| Export Path | display, read-only | PRV / Excel Export / ASCII Export. |

**Update Type enum — exact values and definitions**

```
All Types       – enhancements, updates, and internal updates
Multiple Types  – opens the Multiple Selection Lookup Window to pick a combination
Enhancements    – updates to a specific feature: a new field, a redesigned screen, or a new process
Updates         – updates that improve how STORIS works; background processes or cosmetic
Internal Updates– modify existing infrastructure code necessary to support development initiatives
```

**Output columns (exact, from the article)**

```
Packet Number   – the update identification number assigned by STORIS
Description     – taken from the client disclosure
Installation Date
Module
Type of Update  – enhancement, update, internal update
```

**Behavior & rules.** **The screen closes automatically once the report has been run** — a blocking, one-shot
interaction. No sort order or subtotals documented; installation date is the obvious break.

**Dependencies.** Electronic Updates subsystem; **Licensing** tab of General System Control Settings (see
`SAR-037` *Notify of License Expiration*).

**Build notes.** For an in-house ERP this is a **deployment/release log**, and we get it nearly free from CI:
`release(id, version, deployed_at, environment, module, kind, summary, commit_range, deployed_by)` with
`kind ∈ {feature, fix, internal}` mapping 1:1 onto the STORIS enum. Requirements worth keeping:
- Filterable by date range and kind; exportable.
- **Joinable to incidents.** The reason anyone reads this report is "what changed just before it broke."
  Surface it as a **timeline overlay** on `SAR-020`'s job-error view and on `SAR-SHARED-08` audit queries —
  that correlation is the actual deliverable, not the list.
- Read-only for everyone; no permission needed beyond login.
- Do **not** copy the auto-closing screen.

### `SAR-031` Vendor Name Search
*storis_ref: article 15294767989268*

**Purpose.** Locate vendor records by name (phonetically), by leading letter, or by phone number.

**Where it lives.** Modal reached from vendor-code fields throughout Purchasing/Payables.

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor Class | code, multi | Filters results. Arrow or Action → list of vendor classes, one or more. Selecting any class **activates the `Classes` field below**. **Entering a vendor class does not itself produce results** — it only filters whatever the name/phone/starts-with search returns. **A default response can be set via Purchasing Control Settings.** |
| Classes | enum: `Include` \| `Exclude` | Whether the selected classes are included in or excluded from results. **Active only when at least one Vendor Class is selected.** Default also settable via Purchasing Control Settings. |
| Vendor Name | text | **Soundex** search (see below). |
| Starts With | single letter | First letter of the vendor name. |
| Phone | text | Vendor telephone number. |

**Mutual exclusion (hard).** *"Once you enter a response at one of the following three fields, you inactivate
the other two."* — Vendor Name, Starts With, and Phone are mutually exclusive.

**Soundex behaviour (hard, quoted).** *"Soundex returns names that sound like the search criteria, as opposed
to an alphanumeric search."* Worked example: searching `SMITH` returns Smith **and** Schmidt, Smitty; an
alphanumeric search of SMITH returns only exact spellings (not Smyth or Smithe). *"The system searches all
words in the vendor name, left to right, until it finds a word that matches the search criteria."*

**Visibility rules (hard, two independent gates).**
1. **Permission:** *"Access to this screen may be restricted by the **Search for Vendors/view vendor
   names/Model numbers** field in the **Sales Security** of User and/or User Group files."*
2. **Per-vendor opt-in:** *"In order for a vendor to display in the result list, the box at **Display in
   Vendor Name Search** field in **Vendor Settings** must be checked."*

**Output columns.** Not enumerated; the result list is a vendor picker.

**Dependencies.** Vendor Settings (`SAR-044`) → **Display in Vendor Name Search**; Purchasing Control Settings
(defaults for Vendor Class / Classes); Sales Security → **Search for Vendors/view vendor names/Model
numbers** (a `SEC-*` permission; note it also gates **model numbers**, which ties to the Inventory pack's
`CFG-INV-VENDORMODEL`); `SAR-018`.

**Build notes.**
- Replace Soundex + Starts With + Phone with **one unified search box** over a trigram/fuzzy index
  (`pg_trgm` similarity, or Postgres FTS with a phonetic fallback) matching across name, DBA, phone, account
  number, and email. The three-mutually-exclusive-fields design is a 1990s constraint, not a requirement.
  **Keep the behaviour, drop the modes.**
- Preserve both gates: the `SEC-*` permission **and** the per-vendor `display_in_search` flag. The second one
  is unusual and worth keeping — it is how one-off/AP-only payees stay out of buyers' pickers.
- **Cost visibility:** the same Sales Security field gates *vendor model numbers*; coordinate with
  `CFG-INV-VENDORMODEL` (Inventory pack) so the product label helper and this search agree.
- Results must be scoped by company (`SAR-037` Access tab) and paged.

### `SAR-032` View Advanced Customer Settings
*storis_ref: article 15295211963924*

**Purpose.** Read-only inquiry over the customer master (records created in **Advanced Customer Settings**).

**Where it lives.**
`Accounting > Receivables > Receivables Views and Reports > Receivables Views > Receivables Settings Views > View Advanced Customer Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer Code | code entry | The customer to view. Search → **Customer Code Look-Up** screen. **After selection, the customer's name, home phone number and work phone number appear on the screen.** |

**Output.** The entire Advanced Customer Settings screen, rendered read-only. Fields not enumerated here —
owned by the Receivables/POS pack.

**Behavior & rules.**
- **Hard rule — row-level scoping:** *"The output of this inquiry may be affected by Regional Processing
  restrictions. That is, you can inquire only about customers and locations to which you have access."*
  Stated twice in the article, including on the Customer Code field itself.
- *"This routine is a read-only version of the Advanced Customer Settings. You can view but not edit the
  fields on this screen."*
- STORIS's own guidance: *"STORIS recommends you create customer records for all of your permanent,
  repeat-business retail and wholesale customers."*

**Dependencies.** Advanced Customer Settings (another pack); Regional Processing / `SAR-037` Access tab;
`SAR-019` (merge status reports on these records); `SAR-018`.

**Build notes.** Per `SAR-SHARED-09`, **do not build this screen** — render the customer form with
`readOnly`. What *must* be carried over is the scoping rule: customer visibility is location-scoped, enforced
server-side, on the record fetch and on every list/search/export that touches customers. Customer records are
PII-bearing; the read-only view must apply the same field-level redaction as the editable one (masked card
numbers, SSN) and any unmask must write a `SAR-024` / `SAR-SHARED-08` audit event.

### `SAR-033` View Advanced Product Settings
*storis_ref: article 15295211514516*

**Purpose.** Read-only inquiry over the product master (records created in **Product Settings** / **Advanced
Product Settings**).

**Where it lives.** Three paths, all read-only entry points for non-merchandising roles:
- `Merchandising and Distribution > Purchasing > Buyer/Merchandiser Tools > Buyer Tools > Buyer Views > Additional Views > View Advanced Product Settings`
- `Merchandising and Distribution > Purchasing > Purchasing Views and Reports > Purchasing Views > View Advanced Product Settings`
- `Accounting > Third Party Accounting > Payables > Payables Views and Reports > View Advanced Product Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | code entry | Product to view. Search → **Search for a Product** window, from which you can **choose a product or create a list of products to view**. |

**Actions menu (exact list)**

```
Add Attachments
Clone info for new product
Configurator Yardage
Edit Attachments
Enter Special Order Options
Gross Margin Calculator
Line Item Text
Product Benefits
View Attachments
```

**Behavior & rules.** *"The fields displayed in this inquiry are identical to those found in Product settings
screens. However, you cannot edit fields in an inquiry program."*

**Surprising:** the Actions menu on a **read-only** inquiry still offers **Add Attachments**, **Edit
Attachments** and **Clone info for new product** — all of which mutate. Either the article is copied verbatim
from the editable screen (likely) or STORIS's read-only mode is incomplete. **Flag: do not assume "view"
screens are side-effect-free when auditing STORIS behaviour.**

*(The article body is duplicated verbatim twice on the page — a Zendesk authoring artifact, not two variants.)*

**Dependencies.** Product Settings / Advanced Product Settings (Inventory pack item model,
`01-item-model-and-costing.md`); `SEC-COST-VIEW`; `SAR-015` (read-only Multiple Region Selection is reached
from here); Search for a Product.

**Build notes.** Per `SAR-SHARED-09`, do not build separately — `readOnly` on the product form.
**Cost visibility is mandatory here:** the product record carries cost, and the **Gross Margin Calculator**
action is a cost-disclosure surface by another name. Under `SEC-COST-VIEW` denial: **omit** cost fields from
the payload (not blank them), and **hide the Gross Margin Calculator action entirely**. Overlaps the Inventory
pack — this screen is the settings-side twin of `RPT-PROD-ACTIVITY-VIEW`; link the two (from the product
record, "view activity"; from activity, "view product") rather than duplicating either.

### `SAR-034` View Bank Settings
*storis_ref: article 15295210638740*

**Purpose.** Read-only inquiry over bank records created in **Bank Settings**, used by AR, Financing and
Third-Party Accounting.

**Where it lives.** Four paths:
- `Accounting > Receivables > Receivables Views and Reports > Receivables Views > Receivables Settings Inquiries > View Bank Settings`
- `Accounting > Financing > Financing Views and Reports > Financing Views > View Bank Settings`
- `Accounting > Payables > Payables Views and Reports > View Bank Settings`
- `Accounting > Vendor Receivables > Vendor Receivables Views > View Bank Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Bank Code | code entry | Bank to view (the "Bank Master"). Search → list of valid Bank Codes. |

**Behavior & rules.** *"The fields displayed in this inquiry are identical to those found on the Bank Settings
screen, but may NOT be updated from this inquiry."*

**Dependencies.** Bank Settings (Accounting pack); AR, Financing, Payables, Vendor Receivables modules.

**Build notes.** `SAR-SHARED-09` — `readOnly` form, four cross-links. **Bank records carry account and routing
numbers: treat them as secure data.** Mask by default, require step-up to unmask, and write a
`SAR-SHARED-08` event with `data_type = CA` (Checking) on both grant and denial — this is exactly the class of
data `SAR-024` was built for, and STORIS does not appear to audit it here.

### `SAR-035` View Bar Code Scanner Download Activity
*storis_ref: article 15295156258068*

**Purpose.** Lists the handheld scanner devices that currently hold **downloaded batch data not yet updated or
deleted** — i.e. work sitting on a gun that has not come back into the system.

**Where it lives.** Five paths:
- `Customer > Coordination and Logistics > Delivery Processing > View Bar Code Scanner Download Activity`
- `Customer > Coordination and Logistics > Transfer Processing > View Bar Code Scanner Download Activity`
- `Merchandising and Distribution > Inventory > Inventory Management > Transfer Processing > View Bar Code Scanner Download Activity`
- `Merchandising and Distribution > Logistics > Delivery Processing > View Bar Code Scanner Download Activity`
- `Merchandising and Distribution > Logistics > Transfer Processing > View Bar Code Scanner Download Activity`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Location Code | code, **required** | **A location must be specified.** The logon location can default, depending on user settings. Search button available. |
| Batch Process Type | enum | Filters the grid. **Default: all batch processes.** |
| Downloaded To | user, blank = all | The user who performed the scanning. Search → user list. **Default: all users.** |

**Batch Process Type enum — exact values**

```
All Batch Processes
Manifest
Receipt
Physical Count
```

**Output columns (exact, in order)**

```
date and time of the download
name of user who performed the scanning
process type
batch number
device name
device ID          (accessible via the horizontal scroll bar)
```

**Sort order (hard, explicit).** *"The data displayed sorts in ascending order by date and time."*

**Behavior & rules.** Live grid inquiry — no Run button, no output destination, no date scope. Scope is
**"currently outstanding"**: only batches that have not been updated or deleted appear, so the grid empties as
work is reconciled. Used with **WiFi batch processing**.

**Dependencies.** WiFi/batch scanner subsystem; Delivery Processing; Transfer Processing (`XFR-*`);
Physical Inventory (`PHYS-040` count sheets); Receiving (`RCV-051` open batches).

**Build notes.** **Overlap flagged:** this is the device-side twin of the Inventory pack's
**`RPT-RCV-BATCH-OPEN`** (open receiving/freight batches, aged — *"open batches = un-costed inventory on the
balance sheet"*) and touches **`RPT-PHYS-COUNTSHEET`** and **`RPT-XFR-OPEN`**. **Consolidate into one
"outstanding batch work" view** with a `source` facet (`scanner | desktop`) and a `process_type` facet
(`manifest | receipt | physical_count | transfer`), rather than a scanner-only screen plus three
process-specific ones.
Requirements to keep: required location scope, ascending date/time sort, device identity (name **and** id) as
first-class columns. Add what STORIS lacks: **age of the outstanding batch** and an aging alert — a batch
sitting on a gun for three days is the same balance-sheet problem `RPT-RCV-BATCH-OPEN` exists to catch. Also
add "last seen" for the device, and a force-reclaim action for a lost/broken gun.
`[DECISION NEEDED]` Do we use dedicated scanners or phone-based scanning? If phones with a live connection,
"downloaded but not uploaded" largely disappears and this collapses into an offline-queue monitor.

### `SAR-036` View Bill Back Settings
*storis_ref: article 15295210665492*

**Purpose.** Read-only inquiry over **Bill Back Codes**, which mark on a PO line that the vendor owes money
that will **not** be automatically deducted from the bill.

**Where it lives.**
- `Accounting > Payables > Payables Views and Reports > View Bill Back Settings`
- `Accounting > Vendor Receivables > Vendor Receivables Views > View Bill Back Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Bill Back Code | code entry | Code to view. Search → list of valid Bill Back Codes. |

**Behavior & rules.** *"The fields displayed in this inquiry are identical to those found on the Bill Back
Settings (Bill Back Codes) screen, but may NOT be updated from this inquiry."*
**Key semantic (hard):** bill-back is the **non-auto-deducted** counterpart to DFI (`SAR-039`). DFI reduces
the invoice automatically; bill-back creates a receivable against the vendor that must be collected
separately. Getting these two backwards mis-states both landed cost and vendor AR.

**Dependencies.** Bill Back Settings (Payables pack); Purchase Order Processing (`PO-*`); Vendor Receivables;
`SEC-COST-VIEW`.

**Build notes.** `SAR-SHARED-09` — `readOnly` form. **Honour `SEC-COST-VIEW`:** bill-back amounts are vendor
cost recoveries and must be omitted for users without cost visibility. Model bill-back as an explicit
**vendor receivable** with a lifecycle (`accrued → claimed → received → written_off`), because the whole point
is that nothing deducts it automatically and it therefore rots silently. That aging report does not exist in
STORIS and should — companion to the Inventory pack's `RPT-RTV-OPEN` (expected vendor credit vs credit
received).

### `SAR-037` View Create a User
*storis_ref: article 15295212294036*

**Purpose.** Read-only inquiry over a user record. **The article is the most valuable in the section** because
it documents the entire user/security/scoping model that `SAR-022`, `SAR-023`, `SAR-025` and `SAR-026` report
on.

**Where it lives.**
- `System Administration > Get Started - Enter Your Information > Get Started Step 5 - Users > Create a User`
- `System Administration > System Settings > System Permissions > Create a User`

Tabs: **General**, **Output**, **Security**, **Access**.

**Fields — identity**

| Field | Type | Purpose / business rule |
|---|---|---|
| User ID | **up to 4 alphanumeric characters** | Primary key. Many clients use it as both the Login ID (server) and the User ID (application). For longer server IDs use **Login ID** on the Security tab (**max 20 chars**). |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Name | text | Also shown in the upper-left of the main menu at sign-on. |
| User Group | code, **required** | Provides **menu security**. **Standard user types ship with codes beginning `S$` (e.g. `S$CS` for customer service). Standard types cannot be edited — copy them via Create a User Group and edit the copy.** |
| Extension | text | Reference only. |
| Email Address | email | Used to send emails if Email is active. |
| Employee ID | **up to 7 characters** | **Reporting only.** e.g. shown per salesperson on Report Sales Commissions. |
| Email Preference | enum: `HTML` \| `Plain Text` | Format for emails generated by **Schedule a Process**. **Active only if an email address exists for the user.** |
| Salesperson Code | code | **Entering a salesperson code grants the user access to CRM information such as sales leads associated with that salesperson.** |
| Buying Group | code | Assigns buying responsibility. **Lookup shows only unassigned groups or groups already assigned to this user. A staff member may be in multiple buying groups, but a buying group can have only one set of user (buyer) initials.** |
| Language Code | enum | Active with Multi-Lingual Processing. Default **English**; `French`, `Spanish`, `Alternate` also available. |
| Cash Drawer | code | Default cash drawer offered at login; user may override. **Must be a valid cash drawer for the user's current location (per Cash Drawer Control Settings) or no default appears.** |
| Payment Terminal | select, optional | **Validated on save against the locations listed in Warehouse/Store Location on the Access tab.** |
| Tethered Terminal | select, optional | Same validation rule. |
| Enable Signature Capture | bool | For terminal-server logins. **If Allow Logon Passthrough is checked, this field decides signature capture. If not checked, this field merely supplies the default for the checkbox on the login screen.** |

**Fields — General tab, STORIS Messenger**

| Field | Type | Purpose / business rule |
|---|---|---|
| Enable Messenger Access | bool | Turns on the internal mail system for this user. |
| Review Messages at Logon | bool | **If enabled it overrides the Message Review Logon field in STORIS Messenger Control Settings; if disabled it defers to that setting.** (Enable-wins precedence.) |
| Messenger Administrator | bool | **Can access and modify all Messenger groups and all messages, open or closed. Any number of users may be administrators.** |
| Default Messenger Form | code | Default print form for Messenger mail. |

**General tab Actions menu (exact)**

```
Access Delivery Time Range
Customer Service
Folio Settings           - active only if a custom plug-in point has been installed
Receivables Collector
RF Barcode
Salesperson File Maintenance - applies to the Salesperson Code field; if blank, can create a
                               salesperson record whose salesperson number equals this user's Employee ID
```

**Fields — Output tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Printed Document Destination | enum | `Standard Printing` (**grants access to the Printer Admin Level field on the Security tab**), `Local Printer`, `Printing Not Allowed`. |
| Printer Zone | text | Zone assignment; blank if zones unused. |
| Default Logical Printer | printer number | From Printer Settings; fallback printer. |
| Default Print Form | form number | From Form Settings. |
| Default Hold Queue | bool | Creates a hold file for all print jobs so the user can view/reprint already-printed output. |
| Default Suppress Queue | bool | Suppresses print jobs. Can combine with Hold Queue to keep files for suppressed jobs. |
| Default Number Copies | int **1–999** | Default **1**. |
| Include Report Banner | bool | Prints a separate banner page carrying **user ID, date, time and other system info** about the print job. Normal report headers print regardless. |
| Start Forms Printer at Logon | bool | Preloads the Design Enhanced Laser Forms application at login for speed. **No jobs print as a result.** |

**Local Printer restrictions (hard).** For users on `Local Printer`:
- **Printing is not available from End-of-Day and End-of-Month if Regional Processing is active.**
- The Printer option is not offered when printing via the Output Settings screen; send to Screen and print
  from there.
- EOD writes to `C:\Users\<USERID>\Documents\STORIS\Reports\EOD_YYYYMMDD`;
  EOM to `C:\Users\<USERID>\Documents\STORIS\Reports\EOM_YYYYMMDD`;
  **non-Live accounts append the account name: `..._EOM_YYYYMMDD_ACCOUNTNAME`.**

**Fields — Security tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Password | **up to 10 alphanumeric, UPPER-CASE** | Verified during security checks and at login **if Extended Security is active**. Without complex passwords, clearing the field sets the password to **Null**, forcing a change via **Change User Passwords** at next login. |
| — complex-password mode | | **New users are automatically set to `RESET` and the field cannot be changed. Once a password exists the field is encrypted and displays exactly 8 asterisks (`********`) regardless of actual length.** |
| Reset Password | button | Complex-password mode only. Clears the current password and displays **`RESET`** in place of the asterisks; user is prompted at next login. Clicking again cancels. |
| — **hard rule** | | **"You cannot change or reset a user's password when they are currently logged on to any account on the system."** (Stated twice.) |
| Exempt from Active Directory Authentication | bool | Prevents validation against Windows Active Directory; user then has separate STORIS and Windows credentials. **If unchecked, the ability to change, reset or view the password is disabled.** **STORIS recommends at least one administrative user be exempt, in case AD failure locks everyone out.** |
| Login ID | **up to 20 alphanumeric**, optional | The O/S / Server ID. Leave blank if identical to User ID. **At login the system matches the entered ID against the User ID field then the Login ID field; no match ⇒ error and the login aborts.** |
| Allow Logon Passthrough | bool | Suppresses the User Log-In screen. **Clicking Restart shows the login screen regardless.** |
| Maximum number of concurrent sessions | int **1–999**, blank = unlimited | **1 ⇒ opening a second session prompts to terminate the first; the first is terminated once the user reaches an input point outside an entry process, at which point the license is released.** |
| User Locked Out | bool + state label | See lockout rules below. |
| PC Applications | multi-select (PC button) | Grants access to: `EIS Merchandising`, `Executive Vision`, `Finance II Rpt Writer`, `Limit to Company`, `Report Builder`. |
| File Security Groups | code, multi | **Inverted semantics — read carefully:** *"The presence of a file security group in this window indicates that the staff member is **restricted** from the source files included in the file security groups. To override the restriction, **check the box** next to the group."* A check means "can access all source files in that group, even if the file also appears in another group." |
| Field Security Codes | code, multi | Same inverted model at field level. **All users are restricted from Report Builder data generated from any field carrying a field security code; checking the box overrides.** **Field access additionally requires access to the source file via File Security Groups.** |
| Printer Admin Level | enum | `Cannot Change Printer` (print own jobs only), `Change Only Within Zone` (access printers in the current zone via Printer Definitions; review and print own jobs), `Can Make Any Changes` (print all jobs and establish Printer Zone Settings). **Only accessible when Printed Document Destination = `Standard Printing`.** |
| Access Archived Reports | enum: `All Archived Reports` \| `User's Archived Reports` | Governs **Review Archived Reports** and **Review Print Jobs**. **New users default to `User's Archived Reports`.** |
| Notify of License Expiration | bool | See escalation ladder below. **Not available via Create a User Group.** |

**User lockout rules (hard, exact).**
- **Temporarily Locked Out** — set **by the system after six unsuccessful login attempts**. The word
  *"Temporarily"* appears beside the checkbox and the field shows the lockout date and time in the form
  `internal date:internal time`. Cleared by any of:
  1. **After 30 minutes, the system clears the lock when a new logon attempt is entered**;
  2. an administrator unchecking the box;
  3. an administrator clicking **Reset Password**.
- **Permanently Locked Out** — set manually by an administrator checking the box; the word *"Permanently"*
  appears. **The system never clears it automatically; an administrator must uncheck it.**

**License-expiration notification ladder (hard, exact).** Based on the **Licensing Expires** date on the
Licensing tab of General System Control Settings:
- **15 days out** — Acknowledge Message window appears **for users with this setting checked**.
- **10 days out** — Acknowledge Message window for those users, **plus all users** receive a dismissible
  post-login notification with the same text.
- **3 days out** — Acknowledge Message window **for all users**, plus the same dismissible notification.
- If nobody has the setting checked, **a log is written indicating the license expiration and that no users
  have this setting checked**. If no expiration date exists, nothing is deployed.

**CRM (InTouch) access rules.**

| Field | Type | Purpose / business rule |
|---|---|---|
| Enable Corporate Access | bool | Unlimited CRM access. **Checking it de-activates District Manager and Store Manager Locations.** |
| District Manager | code | Access to all CRM data for the stores assigned to that district manager. **Entering one de-activates Store Manager Locations.** |
| Store Manager Locations | location, multi | Access to a selected group of stores. Action → **Multiple Location Selection Window** (`SAR-010`). |

**Hard rule:** *"Users who have not been defined as one of the above cannot create or update any leads."*
Salesperson Code on the General tab grants lead access *in addition* to these three.

**UP System access ladder (hard, exact).** Two checkboxes combine into three levels:
- **Both blank — Basic:** users can perform only movements from one list to another.
- **`Enable Up System` checked — Intermediate:** may also edit opened or closed assignments (**closed for
  that day only**).
- **`UP System Administrator` checked — Administrator:** may create Up system action codes; check out all
  staff for the day; purge all activity for a day; edit/delete completed activity information.

**Security tab Actions menu (exact) — the extended-security modules**

```
Import Data Security
Logistics Security
Payables Security
Personal Information Security
Purchasing Security
Receivables Security
Sales Security
Service Security
System Security
Transfer Security
```

**Hard rule:** *"Security settings on these screens are only effective if extended security is active on your
system via the General System Control Settings."* — a single global toggle can silently void every
permission on the system.

**Fields — Access tab (LOGIN)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Warehouse/Store Location | location, multi, ordered | Locations the user may log into. Action → `SAR-010`. **STORIS ships a pre-built location `88` usable as a temporary valid location.** **If Default a Login Location is checked, the system defaults to the *first location in the list*.** **Also referenced by `SAR-025` when reporting by store or district.** |
| Default a Login Location | bool | Offers a default store at login, **using the first location listed**. If blank, no default is offered, **but Store Location is a required field at login so one must be chosen**. Overridable at the login screen. |

**Fields — Access tab (Fulfillment Location Restrictions)**

Per fulfillment method — **Delivery** and **Customer Pickup** — one of:
- **`Use Access Restrictions`** — use the Inventory ▸ Entry radio group on this screen as the list of
  available fulfillment locations.
- **`Location List`** — build an explicit list. **A Location List must then be selected**, drawn from a
  predefined list whose **List Type in Process List Settings is `Accessible Location List`**.

For Deliveries the list applies to **sales order deliveries, exchange deliveries, and return pickups**.

**Hard rule / leak:** *"even if the user is not assigned access to a specific location, **editing an order
with a location that is not normally permitted for the user adds that location to the list of available
locations** for both the stock and fulfillment location selection."* — location scope is **not** a hard
boundary; touching an out-of-scope order widens the user's scope for that order.

**Fields — Access tab (RESTRICTIONS)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Company | company, multi | Companies to which the user has informational access. Search → Multiple Selection Lookup; Action → **Multiple Company Selection Window** (`SAR-004`). **If no companies are defined, the user has access to all companies.** **Costing processes present information based on the locations of companies to which the user has access.** **When prompted for Company, the system validates the user has access to it.** |
| Global Location List | list code | **Regional Processing does *not* have to be active for this to be enforced. Global Location Lists override regional and district boundaries.** **During login, if no list is specified on the user record, the system checks the Location Settings file for a list associated with the log-on location.** **The system verifies the user has list access to the location they log into.** Action → Program List Creation Window. |

**Fields — Access tab (Sales / Inventory scoping)** — four radio groups, the ones `SAR-026` reports on:

| Group | Options |
|---|---|
| **Sales ▸ Entry** (create/edit/delete sales documents) | `None`, `Logon Location`, **`District`**, `Global Location List`, `Location List` (+ required Location List field) |
| **Sales ▸ View/Report** (inquire on sales documents) | `None`, `Logon Location`, **`District`**, `Global Location List`, `Location List` |
| **Inventory ▸ Entry** (create/edit/delete inventory documents) | `None`, `Logon Location`, **`Region`**, `Global Location List`, `Location List` |
| **Inventory ▸ View/Report** (inquire/report on inventory) | `None`, `Logon Location`, **`Region`**, `Global Location List`, `Location List` |

**Note the asymmetry (hard):** Sales scopes by **District**, Inventory scopes by **Region**. They are not
interchangeable.

**Additional Access-tab rules.**
- *"To access the fields below, Regional Processing must be active in your system. After you set your
  preferences, Regional Processing must remain active for the system to enforce regional restrictions."*
  **Turning Regional Processing off silently disables the restrictions** (except Global Location List).
- *"To restrict user access to regions and districts, Regional Processing must be active in the General
  System Control Settings."*
- *"The **Order Access Limited to Selling Store** setting in your Point of Sale Control Settings may also
  affect user access to orders, in addition to the user's location restrictions."*
- **STORIS's own advice:** *"for users on whom you place restrictions, STORIS recommends you assign each user
  to a single setting across the board (for example, Logon Location)"* — i.e. the four-way split is so
  confusing the vendor advises against using it.
- **Location List note:** *"This field does not apply to customers. You can manually enter customers from any
  region."*

**Global behavioural rule.** *"If you make a change to the User file, you must restart STORIS before the
change can take effect."*

**Dependencies.** General System Control Settings (**Extended Security**, **Regional Processing**,
**Multi-Lingual Processing**, **Menu Timeout**, **Licensing Expires**); Point of Sale Control Settings
(**Order Access Limited to Selling Store**); Cash Drawer Control Settings; STORIS Messenger Control Settings;
Process List Settings (**Accessible Location List**); Printer/Form Settings; `SAR-038`; reported on by
`SAR-022`, `SAR-023`, `SAR-026`; referenced by `SAR-025`; the `SEC-*` registry in the Inventory pack.

**Build notes.** Do not build a read-only twin (`SAR-SHARED-09`). What matters is the model underneath:

1. **Permission changes are events.** Every field on this screen writes `category=PERMISSION_CHANGE` to
   `SAR-SHARED-08`. This is what makes `SAR-023`/`SAR-026` as-of-date reporting possible, and the Inventory
   pack already requires *"permission changes are audited like settings changes."*
2. **Kill the global Extended Security kill-switch.** A single toggle that voids every permission is
   indefensible. Permissions are always enforced.
3. **Kill the four-way scope matrix.** Replace Sales/Inventory × Entry/View with **one** location scope per
   user plus explicit *capability* grants. Keep the *ability* to differ (read wider than write) as an
   opt-in override, not the default shape. STORIS itself recommends uniformity.
4. **Fix the scope-widening leak** quoted above. Editing an out-of-scope order must not permanently widen
   scope; require an explicit, audited override.
5. **Password rules to reject outright:** 10 chars, uppercase-only, alphanumeric-only. Use modern password
   policy + SSO/OIDC. **Keep:** the AD-exemption break-glass account (at least one admin not dependent on the
   external IdP), and the rule that you cannot silently change a password out from under an active session
   (we express it as: password change revokes all sessions, with notification).
6. **Keep, and improve, lockout:** 6 failures → 30-minute auto-clearing lock, plus a manual permanent lock.
   Add: per-IP rate limiting, and an audit event on every lock/unlock.
7. **Keep concurrent-session limits** (blank = unlimited, 1..N), but implement as clean session revocation,
   not the STORIS "terminated once the user reaches an input point" fudge.
8. **Keep `Access Archived Reports`** as the async-inbox visibility rule (`SAR-SHARED-06`), defaulting to
   own-reports-only.
9. **Invert the File/Field Security semantics.** STORIS's "presence means restricted, check means allowed" is
   a double negative that guarantees misconfiguration. Use plain allow-lists.
10. **Drop:** printer zones/logical printers/hold queues/local-printer EOD paths (`SAR-012`), the STORIS
    restart requirement, the `S$` magic-prefix convention (use a `system` boolean on roles), and the 4-char
    user ID limit.
11. **Keep the two-tier group/user model** (`SAR-038`) but make the resolution rule explicit and reportable —
    see `SAR-023` build note 3.
12. `[DECISION NEEDED]` Do we need **Company** as a scope dimension (see `SAR-004`)? And do we adopt
    **Region/District** at all, or is a flat store list + tags enough for LA Mattress's footprint?

### `SAR-038` View Create a User Group
*storis_ref: article 15295156484244*

**Purpose.** Read-only inquiry over a user group — the container that provides **menu security** and supplies
defaults to its member users.

**Where it lives.**
- `System Administration > Get Started - Enter Your Information > Get Started Step 5 - Users > Create a User Group`
- `System Administration > System Settings > System Permissions > Create a User Group`

Tabs: **General**, **Access**. Support Files: **None**.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| User Group ID | **up to 6 characters** | e.g. `SALES`. **STORIS ships a group called `SYSMGR`. Assign it only to personnel responsible for maintaining the system — only users in `SYSMGR` have access to the Get Started menu.** |
| Description | **up to 20 characters** | e.g. `SALESPERSON`. |
| Menu Timeout Active | bool | Activates the Menu Time-Out feature for the group. **Requires a time-out period to be set at the Menu Timeout field in General System Control Settings; if the box is blank or no period is set, the feature is inactive for the group. Does not affect the Login Time-Out feature.** |
| File Security Groups | code, multi | Same inverted allow/deny semantics as `SAR-037`, applied to Query Wizard / Report Builder access for the staff type. |
| Field Security Codes | code, multi | Same inverted semantics at field level. **Field access still requires source-file access via File Security Groups.** |
| Reset User Members | bool | **The dangerous one.** *"If you check the box, the system applies any changes you make here to all other users in the current user group (that is, the system updates those individual user records)."* Also usable to mass-update a User record when a user moves group: change the user's group, then open the new group and check this box to push the group's field responses down onto the user record. |
| Language Code | enum | With Multi-Lingual Processing. Default **English**; also `French`, `Spanish`, `Alternate`. |
| Allow Logon Passthrough | bool | Suppresses the login screen for the group. **Restart shows it regardless.** |
| Enable Signature Capture | bool | Same passthrough-dependent precedence as `SAR-037`. |
| Maximum number of concurrent sessions | int **1–999**, blank = unlimited | Same termination semantics as `SAR-037`, applied group-wide. |

**General tab Actions menu (exact)**

```
Access Delivery Time Range
Clone Info For New User Group
Folio Settings           - active only if a custom plug-in point has been installed
Import Data Security
Logistics Security
Payables Security
Personal Information Security
Purchasing Security
Receivables Security
Sales Security
Service Security
System Security
Transfer Security
```

Same hard rule: **effective only if Extended Security is active.**

**Fields — Access tab**

**Hard rule with an internal contradiction — flag it:** the tab preamble says *"To access this tab, Regional
Processing must be active in the General System Control Settings"*, yet the RESTRICTIONS heading immediately
below says *"These settings are active whether or not Regional Processing is active in your system."*
**Treat as: the tab is gated on Regional Processing, but once set the restrictions are enforced regardless.**
Verify against a live system before relying on either reading.

| Group | Options (exact) |
|---|---|
| **Sales ▸ Restrict Entry** | `No Restrictions`, `Logon Location`, `District`, `Global Location List`, `Location List` (+ required Location List field) |
| **Sales ▸ Restrict Inquiry** | `No Restrictions`, `Logon Location`, `District`, `Global Location List`, `Location List` |
| **Inventory ▸ Restrict Entry** | `No Restrictions`, `Logon Location`, `Region`, `Global Location List`, `Location List` |
| **Inventory ▸ Restrict Inquiry** | `No Restrictions`, `Logon Location`, `Region`, `Global Location List`, `Location List` |

**Note:** the group-level enum uses **`No Restrictions`** where the user-level enum (`SAR-037`) uses
**`None`** — same meaning, different label. Also, the group's **Global Location List** option points at *"the
Global Locations List field in Create a User"* — i.e. the group setting depends on a **per-user** field.

**Fulfillment Location Restrictions.** Identical wording to `SAR-037`, including the same scope-widening
leak when editing an order with a non-permitted location.

**Other rules.** *"All STORIS users must be assigned a user group via the Type field in the User file."*
*"Use the **Assign Screen Action Permission** routine to restrict user access to specific functions found on
Actions button menus."* — a **third** permission surface beyond menus (`SAR-022`) and security settings
(`SAR-023`), and it is reported on by neither.

**Dependencies.** `SAR-037`; General System Control Settings (**Extended Security**, **Regional Processing**,
**Menu Timeout**, **Multi-Lingual Processing**); Assign Screen Action Permission; Query Wizard / Report
Builder security; reported on by `SAR-022` and `SAR-023`.

**Build notes.**
- Standard role/permission model: roles carry capability grants and a default scope; users inherit and may be
  granted extra. **Resolution must be explicit and reportable** (`SAR-023` build note 3).
- **`Reset User Members` is a mass-mutation with no preview and no undo.** If we keep the capability at all,
  it must: show a diff of exactly which users and fields change, require confirmation, run as one
  transaction, and write one `PERMISSION_CHANGE` audit event **per affected user**. Better: make group
  attributes *inherited by reference* so no push-down is needed and drift is impossible.
- **Cover all three permission surfaces in one report.** STORIS has menu access, security settings, and
  screen-action permissions, with reports for only the first two. Our matrix (`SAR-022`/`SAR-023` merged)
  must include action-level permissions.
- Keep a protected `SYSMGR`-equivalent role that cannot be deleted or stripped of admin, and keep at least
  one break-glass local account (`SAR-037` build note 5).
- Menu timeout and login timeout are different things — keep both, name them clearly, and make idle timeout a
  security policy setting rather than a per-group flag.

### `SAR-039` View Deduct From Invoice Settings
*storis_ref: article 15295210967700*

**Purpose.** Read-only inquiry over **DFI (Deduct From Invoice)** codes, used to add discounts to purchase
orders.

**Where it lives.** Four paths — note that two of them sit under a menu explicitly named **Purchasing Cost
Views**:
- `Accounting > Payables > Payables Views and Reports > View Deduct From Invoice Settings`
- `Accounting > Vendor Receivables > Vendor Receivables Views > View Deduct From Invoice Settings`
- `Merchandising and Distribution > Purchasing > Buyer\Merchandiser Tools > Buyer Tools > Buyer Views > Additional Views > Purchasing Cost Views > View Deduct From Invoice Settings`
- `Merchandising and Distribution > Purchasing > Purchasing Views and Reports > Purchasing Views > Purchasing Cost Views > View Deduct From Invoice Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| DFI Code | code entry | The Deduct From Invoice discount to view. |

**Behavior & rules.** *"The fields displayed in this inquiry are identical to those found on the DFI Codes
file maintenance screens, but may NOT be updated from this inquiry program."*
**Semantic pair with `SAR-036`:** DFI **is** auto-deducted from the vendor bill; bill-back is **not**.

**Dependencies.** Deduct From Invoice Settings (DFI Codes) maintenance; Purchase Order Processing (`PO-*`);
landed-cost calculation (Inventory pack `COST-*`); **`SEC-COST-VIEW`**.

**Build notes.** `SAR-SHARED-09` — `readOnly` form. **Must honour `SEC-COST-VIEW`** (omit, not blank): DFI
codes are literally PO cost adjustments and STORIS files them under "Purchasing Cost Views". Model DFI as a
typed cost-adjustment component on the PO line so it flows into landed cost deterministically and shows up in
`RPT-PO-RECVCOST` and `RPT-COST-EXCEPTIONS` from the Inventory pack.

### `SAR-040` View Payment Settings
*storis_ref: article 15295211362708*

**Purpose.** Read-only inquiry over **Financing Payment Plan Settings (Third-Party Payment Type)** records —
the third-party financing plans offered to customers.

**Where it lives.**
`Accounting > Financing > Financing Views and Reports > Financing Views > View Payment Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Payment Type Code | code entry | Valid 3rd Party Payment Type code. Search → list of valid codes. |

**Behavior & rules.**
- **Hard rule — row-level scoping:** *"The output of this inquiry may be affected by Regional Processing
  restrictions. That is, you can inquire only about customers and locations to which you have access."*
- *"The fields displayed in this inquiry are identical to those found on the Financing Payment Plan Settings
  (3rd Party Payment Type) screens, but may NOT be updated from this inquiry program."*
- Business rule stated: **all third-party financing payment plans offered to customers should be built in
  this file.**

**Dependencies.** Financing Payment Plan Settings (Financing pack); Regional Processing; `SAR-024`
(`data_type = FR` — Finance is an audited secure data type).

**Build notes.** `SAR-SHARED-09` — `readOnly` form. Relevant to LA Mattress: financing plans are core to
mattress retail, so this table matters even though the *screen* does not. Requirements to carry: plan terms
(promo length, deferred interest, merchant discount rate), effective dating, per-location availability, and
**the merchant discount fee, which is a cost** — gate that field under `SEC-COST-VIEW`. Finance application
data is secure (`FR` in `SAR-024`): every view of a customer's finance detail writes an audit event.

### `SAR-041` View Rebate Plan Settings
*storis_ref: article 15295211517332*

**Purpose.** Read-only inquiry over **Vendor Rebate Settings** — the volume-rebate plan codes offered by
vendors.

**Where it lives.** `Accounting > Vendor Receivables > Vendor Receivables Views > View Rebate Plan Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Plan Code | code entry | Rebate plan to view. Search → list of valid Vendor Rebate Plans. |

**Behavior & rules.** *"The fields displayed in this inquiry are identical to those found in the Vendor Rebate
Settings process, but may NOT be updated from this inquiry."* One plan code per vendor volume-rebate program.

**Dependencies.** Vendor Rebate Settings (Vendor Receivables pack); `SAR-042` (the status/progress view);
`SAR-044`; **`SEC-COST-VIEW`**.

**Build notes.** `SAR-SHARED-09` — `readOnly` form. The plan definition fields we actually need are enumerated
by `SAR-042`: **Goal Type**, **Goal**, **Plan Type**, **Amount**, **Starting Date**, **Ending Date**, vendor.
Rebate rates are cost data — `SEC-COST-VIEW`.

### `SAR-042` View Rebate Plan Status Settings
*storis_ref: article 15295211523476*

**Purpose.** Shows the **progress of a vendor volume-rebate plan** — which PO line items are eligible and how
much rebate has been earned — measured against written, received, or invoiced purchase orders.

**Where it lives.**
`Accounting > Vendor Receivables > Vendor Receivables Views > View Rebate Plan Status Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Based On | enum, **the as-of basis** | `Written` — transactions eligible based on **open purchase orders**. `Received` — based on **purchase orders that have been received**. `Invoiced` — based on **products that were received and have been billed by the vendor**. |
| Plan Code | code entry | The VR Rebate Plan. Search → list of valid Vendor Rebate Plans. **Once entered, transactions with calculated eligible rebate amounts list in the grid.** |

**Fields — display (from the plan record)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display | Code and name of the vendor offering the plan. |
| Goal Type | enum display | **`C` = Total Cost of Purchases**; **`U` = Total Units Purchased**. |
| Goal | display | Goal Amount, from the Vendor Rebate Settings record. |
| Plan Type | enum display | **`P` = Percent of Dollars Purchased**; **`D` = Dollars Per Unit Purchased**. |
| Amount | display | The percentage rate or dollar-per-unit amount used to calculate the earned rebate, per Plan Type and Plan Amount on the plan record. |
| Dates | display | **Starting Date** and **Ending Date** from the Vendor Rebate Settings record. |

**Output columns.** The grid lists the qualifying transactions with their calculated eligible rebate amounts;
individual columns are not enumerated. Implied: PO number, line, product, quantity, cost, eligible rebate.

**Behavior & rules.**
- **The `Based On` selector is a genuine point-in-time / recognition-basis control**, not a filter: the same
  plan yields three different earned amounts depending on whether you count what you ordered, what arrived,
  or what was billed. **Written ≥ Received ≥ Invoiced** in the normal case, and the gap between them is
  exactly the accrual exposure.
- No date-range parameter — the plan's own Starting/Ending Dates bound the window.
- No sort order or subtotals documented. A plan-level total against Goal is the obvious missing summary.

**Dependencies.** Vendor Rebate Settings (`SAR-041`); Purchase Order Processing; Receiving; Vendor invoices /
Payables; **`SEC-COST-VIEW`**.

**Build notes.**
- **Overlap flagged:** the `Received` and `Invoiced` bases read the same data as the Inventory pack's
  **`RPT-PO-RECVCOST`** (*Report Current Costs of Received Purchase Orders*), and the `Written` basis reads
  **`RPT-PO-OPEN`**. **Do not build a private PO roll-up here** — compute rebate status from the same
  PO/receipt/invoice fact tables those reports use, so the three never disagree. Register this as a
  consumer of `RPT-PO-OPEN` / `RPT-PO-RECVCOST` rather than a new source.
- **Cost visibility:** Goal Type `C` is literally total cost of purchases and the grid carries per-line cost
  and earned dollars. **Omit under `SEC-COST-VIEW`** — but note that omitting cost makes the whole screen
  meaningless, so the right behaviour is to **deny access to the screen entirely** rather than serve a
  gutted grid. Register it as a cost-gated route.
- Live queryable view with async export. Add what STORIS lacks: **progress-to-goal** (earned vs Goal, % and
  remaining), **projection to plan end date**, an **alert when a plan is close to a tier boundary** (that is
  the money-making use of this data — buy a little more before the period closes), and the
  **accrued-but-unclaimed** amount as a receivable, tying into `SAR-036`'s bill-back lifecycle.
- Multi-plan overview: STORIS forces one plan code at a time. We need "all active plans, status" as the
  landing view.

### `SAR-043` View Terms Settings
*storis_ref: article 15295213075860*

**Purpose.** Read-only inquiry over **Terms Settings** — the codes that calculate AR due dates and establish
vendor payment terms, including multi-payment schedules.

**Where it lives.** Five paths (two under **Purchasing Cost Views**):
- `Merchandising and Distribution > Purchasing > Buyer/Merchandiser Tools > Buyer Tools > Buyer Views > Additional Views > Purchasing Cost Views > View Terms Code settings`
- `Merchandising and Distribution > Purchasing > Purchasing Views and Reports > Purchasing Views > Purchasing Cost Views > View Terms Code settings`
- `Accounting > Receivables > Receivables Views and Reports > Receivables Views > View Terms Code settings`
- `Accounting > Vendor Receivables > Vendor Receivables Views > View Terms Code settings`
- `Accounting > Third Party Accounting > Payables > Payables Views and Reports > View Terms Code settings`

Tabs: **General**, **Scheduled Payments**.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Terms Code | code, **max 6 characters** | e.g. `N30` (Net 30 Days), `2/10` (2% if paid within 10 days, net due in 30). **STORIS allows two levels of discount within each terms code.** |
| Description | **up to 20 characters** | |
| Due Days | int | **Days from the vendor invoice date that final payment is due, regardless of any discounts.** |
| Terms One Days | int, **mandatory** | Days from vendor invoice date within which the terms-one discount applies. |
| Terms One Discount | decimal (2 dp), **mandatory** | The discount. **Enter 2% as `2.00`.** Applied only if payment is made within Terms One Days. |
| Terms Two Days | int, optional | Second discount window. |
| Terms Two Discount | decimal (2 dp) | **Optional unless Terms Two Days contains a value**, in which case it is required. (The article's own text mislabels this "the terms-one discount" — a copy/paste error; it is the terms-two discount.) |
| Number of Payments | int, default **1** | **Active only if STORIS AP Processing is active.** |
| TPA Equivalent | text, optional | Cross-reference for Third-Party Accounting when the ID differs. **If blank, the TPA system uses the Terms Code itself.** Worked example: QuickBooks record `NET 30 DAYS` ↔ STORIS `N30`, because the Terms Code field accepts only 6 characters. |
| Purchase Order Print Addendum | enum | Form to print with import POs using this terms code: **`None`**, **`Document Against Payment`**, **`Telegraphic Transfer`**. |

**Hard rule — field interlock (stated twice in the article).** *"Entering a value greater than 1 at the Number
Payments field activates the Scheduled Payments tab and inactivates the following fields: Due Days, Terms One
Days, Terms One Discount, Terms Two Days, Terms Two Discount."*

**Fields — Scheduled Payments tab** (active only when Number of Payments > 1)

| Field | Type | Purpose / business rule |
|---|---|---|
| Months Before First Payment | int **1–12** | Months to elapse before the first scheduled payment becomes due. `1` = first month after invoice date, `2` = second, etc. |
| Invoice Cutoff Day | int **1–31**, grid column | **Invoices dated on or before this day of the month become due on the corresponding day in the Due Day column.** **The numbers must be in ascending order with 31 as the last value.** |
| Due Day | int **1–31**, grid column | Day of month payments become due for the associated cutoff day. |

**Calculation rules (hard).**
- **The grid does not affect the number or amount of payments. *"The program distributes payments evenly
  based on the invoice terms amount and the number of payments specified."*** The grid controls **due dates
  only**.
- **Month-end rollback:** *"If you enter a number that doesn't exist in a month, for example 2/31/08, the
  program decrements the number by one until it finds a valid date."* (So 31 → 28 in February.)
- Worked example, quoted: three payments, single cutoff day of 31, due day of 10, 2 months before the first
  payment; **an invoice dated 8/15/09 schedules due dates of 10/10/09, 11/10/09 and 12/10/09.**
- Third-Party Accounting: *"you must set up terms in both STORIS and in the third-party accounting software
  (for example, QuickBooks®). You must do this manually; no automatic transfer of terms codes is possible."*

**Dependencies.** Terms Settings maintenance; AR aging; AP payment scheduling; Purchase Orders (import PO
addendum forms); Third-Party Accounting bridge; **`SEC-COST-VIEW`** (filed under Purchasing Cost Views).

**Build notes.** `SAR-SHARED-09` — `readOnly` form. The **rules** are what we need to port exactly:
- Two-tier discount (`days`, `pct`) plus a net due-days, with `2.00` meaning 2%. Model as an ordered array of
  discount tiers so a third tier needs no migration.
- Installment terms: even distribution of amount, due dates from a cutoff→due-day table, `months_before_first`
  offset, and the **decrement-until-valid** month-end rule. Write property tests for Feb/31 and leap years.
- **Enforce the ascending-cutoff-with-31-last invariant** at save time.
- Keep the field interlock (installments XOR discount terms) — but validate it server-side, not just by
  greying out inputs.
- Keep a `tpa_equivalent` alias field; we will need it for whatever GL/AP system we integrate with, and the
  6-character limit that forced it should not be reproduced.
- Discount percentages materially change landed cost, so terms are cost-adjacent; gate the *discount* fields
  under `SEC-COST-VIEW` even if the code and description stay visible. `[DECISION NEEDED]` Is that split
  (code visible, rate hidden) acceptable to Purchasing, or do we gate the whole record like `SAR-042`?

### `SAR-044` View Vendor Settings
*storis_ref: article 15295155563924*

**Purpose.** Read-only inquiry over vendor records created in **Vendor Settings**. *"A vendor is defined as
any person or company to whom the store may write a check."* Also used to create additional **ship-to
locations** for vendors.

**Where it lives.** Four paths:
- `Merchandising and Distribution > Purchasing > Buyer/Merchandiser Tools > Buyer Tools > Buyer Views > Additional Views > View Vendor Settings`
- `Merchandising and Distribution > Purchasing > Purchasing Views and Reports > Purchasing Views > View Vendor Settings`
- `Accounting > Vendor Receivables > Vendor Receivables Views > View Vendor Settings`
- `Accounting > Third Party Accounting > Payables > Payables Views and Reports > View Vendor Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor Code | code entry | The vendor to view. |

**Behavior & rules.** *"The fields displayed in this inquiry are identical to those found on the Vendor
Settings screens, but cannot be updated from this inquiry program."*
This is the screen that hosts the **read-only Multiple Company Selection Window** variant called out in
`SAR-004`.
Carries the **Display in Vendor Name Search** flag that gates `SAR-031`.

**Dependencies.** Vendor Settings maintenance (Purchasing/Payables packs); `SAR-031` (**Display in Vendor Name
Search**); `SAR-004` (read-only company picker); `SAR-041`/`SAR-042` (rebate plans); `SAR-043` (terms);
`SAR-036` (bill back); `SAR-039` (DFI); **`SEC-COST-VIEW`**.

**Build notes.** `SAR-SHARED-09` — `readOnly` form with four cross-links. The vendor record is a hub: it
carries default terms, DFI/bill-back behaviour, rebate plan membership, lead times, and multiple ship-to
addresses. **Ship-to locations must be first-class child records** with their own addresses and lead times,
not free text. **`SEC-COST-VIEW`** applies to vendor cost/terms defaults. Vendor banking details (for ACH)
are secure data — treat like `SAR-034`. Keep the `display_in_search` flag (`SAR-031`).

### `SAR-045` View Warehouse/Store Settings
*storis_ref: article 15295157262740*

**Purpose.** Read-only inquiry over the records created for each store or warehouse in **Location Settings**
(*Warehouse/Store Location Settings*).

**Where it lives.** Three paths:
- `Merchandising and Distribution > Inventory > Inventory Management > Inventory Views and Reports > Inventory Views > View Warehouse/Store Settings`
- `Merchandising and Distribution > Inventory > Inventory Views and Reports > Inventory Views > View Warehouse/Store Settings`
- `Customer > Point of Sale > POS Views and Reports > POS Views > View Warehouse/Store Settings`

**Fields — selection / parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| Warehouse Code | code entry | The location whose information to view. |

**Behavior & rules.** *"The fields displayed in this inquiry are identical to those found in Warehouse/Store
Location Settings, but cannot be updated from this inquiry program."*
Hosts the read-only variants of the **Multiple Location Selection Window** (`SAR-010`) and the **Multiple
Printer Selection Window** (`SAR-012`).
Referenced elsewhere in this section: `SAR-037`'s Fulfillment Location Restrictions note points at the
**Delivery Locations** and **Customer Pickup Locations** settings held on this record for the selling store.

**Dependencies.** Warehouse/Store Location Settings (Inventory pack — `LOC-*`); `SAR-010`, `SAR-012`;
`SAR-037` Access tab; Regional Processing (region/district membership); Point of Sale Control Settings.

**Build notes.** `SAR-SHARED-09` — `readOnly` form. The location record is the second hub of the system
(after the user record): it holds region/district membership, storage-location structure (`LOC-020` in the
Inventory pack), delivery and pickup fulfillment defaults, printer zone, and a default global location list
consulted at login (`SAR-037`). Make it a single well-modelled `location` entity with an `org_unit` parent
(see `SAR-015` build notes), and expose a **read-only location directory** that anyone can browse — the
information is not sensitive and three separate menu paths exist precisely because everyone needs it.

---

## Summary of overlaps with the Inventory pack's `RPT-*` registry

| This section | Overlaps | Recommendation |
|---|---|---|
| `SAR-035` View Bar Code Scanner Download Activity | **`RPT-RCV-BATCH-OPEN`**, and adjacent to **`RPT-PHYS-COUNTSHEET`**, **`RPT-XFR-OPEN`** | Consolidate into one "outstanding batch work" view with `source` and `process_type` facets. Add batch aging. |
| `SAR-042` View Rebate Plan Status Settings | **`RPT-PO-OPEN`** (`Based On = Written`), **`RPT-PO-RECVCOST`** (`Received` / `Invoiced`) | Do not build a private PO roll-up; consume the same PO/receipt/invoice facts. |
| `SAR-033` View Advanced Product Settings | **`RPT-PROD-ACTIVITY-VIEW`**, **`RPT-AVAIL`** | Same product record. One product page with Settings / Availability / Activity tabs, not three screens. |
| `SAR-024` Report Secured Decryption Activity | **`RPT-PROD-ACTIVITY`** (its `user` column), **`RPT-RTN-NOORIG`** (loss prevention: user, amount, date, order) | All three are user-activity questions. One `audit_event` stream (`SAR-SHARED-08` / `RPT-AUDIT`) backs all of them. |
| `SAR-036` View Bill Back Settings | **`RPT-RTV-OPEN`** (expected vendor credit vs credit received) | Same "money the vendor owes us" lifecycle. One vendor-receivable aging report. |
| `SAR-039` View Deduct From Invoice Settings | **`RPT-PO-RECVCOST`**, **`RPT-COST-EXCEPTIONS`** | DFI is a landed-cost component; it must flow into the same cost pipeline, not a parallel one. |
| `SAR-045` View Warehouse/Store Settings | **`RPT-AVAIL`**, **`RPT-STORAGE-LOC`** (`LOC-020`) | Shared location/storage-location model. |
| `SAR-031` Vendor Name Search | **`CFG-INV-VENDORMODEL`** (the same Sales Security field gates vendor **model numbers**) | One permission, one product-label helper. |
| `SAR-022` / `SAR-023` / `SAR-026` | The `SEC-*` registry (`10-security-permissions.md`), incl. **`SEC-COST-VIEW`** | Merge into a single "Access review" screen: Capabilities / Locations / Menus tabs, with as-of-date. |

## `[DECISION NEEDED]` roll-up

1. **`SAR-001`** — Internal messenger, or route all system notifications to email/Slack?
2. **`SAR-004` / `SAR-037`** — Is LA Mattress multi-company? (Recommendation: keep `company_id` plumbing even if single-company today.)
3. **`SAR-008`** — Is `franchise` a scope dimension we need, or does it collapse into `company`?
4. **`SAR-012`** — Does warehouse label/ticket printing need server-side printer routing?
5. **`SAR-019`** — Are customer merges reversible? If not, second-approver threshold?
6. **`SAR-021`** — Which code tables may be created "on the fly"? (Recommendation: none except reason codes and customer classes.)
7. **`SAR-023`** — Retain generated security matrices, or follow STORIS and never archive them? (Recommendation: retain, restricted bucket, short TTL.)
8. **`SAR-025`** — Is time clock in scope for the ERP at all, or does it stay in payroll/scheduling?
9. **`SAR-028`** — Business-day boundary and time zone for EOD/EOM. This defines what every `SAR-SHARED-02` date code means.
10. **`SAR-035`** — Dedicated scanners or phone-based scanning with a live connection?
11. **`SAR-037`** — Do we adopt Region/District at all, or is a flat store list + tags sufficient?
12. **`SAR-043`** — For terms: gate only the discount rates under `SEC-COST-VIEW`, or the whole record?
