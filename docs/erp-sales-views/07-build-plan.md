# 07 — Build Plan

Phasing for Sales Views and Reports. Read `00-README.md` and `01-reporting-platform.md` first.

Before starting: **read the repo.** This section sits on top of everything else — orders,
customers, inventory, receivables. If those models exist, most of this is query and presentation
work. If they don't, build them first; a report over a model that isn't right is wasted effort.

---

## Phase 0 — Decisions to settle first

1. **One surface or two?** `00` argues that "views" and "reports" are the same queries presented
   twice, and that we should build one filterable surface per subject with export and schedule as
   actions. Confirm — it determines whether this is ~30 screens or ~139.
2. **Retrieve "Regional Processing - Reporting Rules."** Four reports point at its *Report
   Exceptions* section and it is **not in this section**. It likely contains scoping rules this
   handoff does not cover. Get it before building the scoping layer.
3. **Composition model.** Do we build a panel registry now (`01` § DTS) or ship fixed layouts?
   Retrofitting composition is expensive; the customer, product, and salesperson pages all want it.
4. **Which reports does LA Mattress actually run?** 63 reports is a catalog, not a requirement.
   Walk `05` with the business and mark keep / drop / merge. Many exist for STORIS features we may
   not use at all (installment contracts, revolving receivables, gift registries, UP System,
   InTouch CRM, COG, volume rebates, Ensenda, eSTORIS web).
5. **Do we have a batch window at all?** `06` § EOD documents reports that mutate state. If we
   have no nightly batch, several reports (Open Orders on Credit Hold, Deleted Orders) simplify or
   disappear. Decide the architecture before porting their quirks.
6. **Verify the three contradictions** flagged in `05`, each of which changes behavior:
   Report Completed Sales Dollars output restrictions; the "61 and Over Dollars" formula in Report
   Installment Delinquency Statistics Summary; and whether Search for a Customer really OR's its
   filters.
7. **ATP scope.** ATP/ATC dates run through the open-order screens, product availability, and carts.
   Confirm we are implementing availability projection at all — several screens degrade to almost
   nothing without it.

---

## Phase 1 — The query and scoping foundation

**Build:** `01`, `06`

- One **filter model**: date code + range resolver (one component, one vocabulary), scope filter
  (district ↔ location, mutually exclusive by construction), salesperson, product dimensions,
  multi-level sort.
- **Two-axis visibility**, enforced at data access: location/region scope from the user's grants,
  and `data_scope` (self / store / region / all) for sales figures — plus the documented
  exemptions, each with a test.
- **Written vs. delivered** as a first-class dimension of the revenue model.
- One **permission catalog** shared with the order-entry and printing subsystems.
- One **credit hold code** registry with per-code release permissions.
- Result-set → output projection, reusing the output layer from the Printing handoff (`02`).

**Acceptance:**
- A location-restricted user cannot reach district reporting, and cannot see another store's
  salesperson dollars — asserted at the query layer, not the UI.
- View Customer's Historical Purchases returns completed orders **across all locations** for a
  location-restricted user (the documented exemption), and nothing else does.
- Every report renders to every supported output format. **No format is disabled because a column
  doesn't fit** — the `01` § Output-format restrictions list is a bug list, not a spec.
- A query whose range exceeds a retention window says so in its output.
- Protection plan amounts appear identically in every format.

---

## Phase 2 — Shared components

**Build:** `02`

- One `MultiSelectField` with the three variants' behaviors (direct entry + validate, list dialog
  with select-all, chips with remove/clear-all, optional ordering, optional inline create,
  read-only mode). **Not eighteen pickers.**
- **Search for a Customer**, with: Starts With vs. Soundex, the full filter set, the merge-status
  column, and the duplicate-phone and duplicate-email gates.
- Phone-number enrichment behind a pluggable provider interface, with hard timeouts.
- Cart search, folded into **one** screen (product filters + customer filters), not two.

**Acceptance:**
- Adding a picker for a new entity is configuration, not a new component.
- Creating a customer is an **explicit action** — never "exit without selecting."
- Duplicate email requires the permission or a manager override; duplicate phone warns and honors
  Yes/No/Cancel exactly.
- A slow or failed phone lookup never blocks the form.

---

## Phase 3 — Operational queues (build these before the reports)

**Build:** `04` § Open-order management, plus the shape-3 and shape-5 reports from `05`.

These are the screens that change what people do today:

- **View and Manage Open Order Lines** / **View and Manage Open Orders** — one surface with a
  line/order granularity toggle, retained search criteria, and view/maintain actions gated by
  document type.
- **Delivery Dates in Jeopardy** — the call list.
- The opportunity lists: warranties about to expire, products sold without warranties, missed
  protection-plan opportunities.
- The exception lists: sales exceptions, improperly processed orders, merchandise
  returned-not-credited and received-not-invoiced.

**Build them as queues with resolution state, not as reports.** A record appears, someone acts, it
clears — with the action and actor recorded. That is the single largest improvement available over
the STORIS design, and `05` § Report Sales Exceptions shows why: as specified, that report counts
encounters rather than open problems and cannot answer "are we getting better."

**Acceptance:**
- ATP early/late uses explicit states, not the `999` sentinel.
- "Fully reserved" correctly ignores non-inventory lines (warranties, labor).
- An exception is recorded once per occurrence, carries a resolution state, and re-opening the
  underlying line does not re-record it.
- Search criteria persist per user between visits.

---

## Phase 4 — Customer and product record pages

**Build:** `03`, `04` § Product views

- **Customer page** with panels: profile and totals, open orders, purchase history (plus the
  per-item detail screen), deposits, receivables (open/installment/revolving), protection plans,
  rewards, gift certificates, activity log.
- **Product page**: availability by location with the ATP source hierarchy, purchase orders, open
  orders, sales history, transfers, serial/reference, As-Is detail, open carts.
- **Salesperson page**: one parameterized document grid across orders, completed, quotes, carts,
  layaways, leads.
- **Merged-customer traversal** end to end: merge status in search, merged-from activity logs,
  merged-to redirect on entry.

**Acceptance:**
- `Balance = Total − Amount Paid` and `Fulfillment Date = max(line fulfillment dates)` are computed
  in one place and identical on every grid that shows them.
- The ATP tie-break hierarchy (current stock → stock transfer → acknowledged PO → unacknowledged PO
  → new PO) is implemented and tested.
- **Layaway Reserved is computed, never a frozen stale value.**
- Opening the customer's open orders from an entry process shows only the document types that
  process can act on.
- A protection plan spanning several orders shows all of them, with the original line reference.

---

## Phase 5 — The report catalog

**Build:** whatever survives Phase 0 item 4, from `05`.

Order by the shapes in `05` § Coverage note: the period/scope/sort reports are largely
configuration over Phase 1; the reconciliation extracts need care; the as-of snapshots need a
defined point-in-time semantic.

**Acceptance — the ones that catch real errors:**
- Report Average Value of Sales Orders counts **orders, not order-salesperson pairs**.
- Marketing-code reports never sum across codes (an order with two codes contributes fully to
  each) — and the report says so on its face.
- Report Sales Commissions reproduces the type/error legend, and its documented total mismatch with
  invoice-based reports is either fixed or stated on the output.
- Report Written Sales Dollars' negative-margin behavior is explained in the UI, not just tolerated.
- Every export embeds the criteria that produced it, plus who ran it and when.

---

## Deliberately out of scope

| Item | Why |
|---|---|
| Eighteen separate picker screens | One component (`02`) |
| DTS tab-ID editing (`IC.204.TAB`) | Build composition, not the legacy mechanism |
| Dynamic Escape Settings framework | Ship the destinations as ordinary actions |
| Output-format restrictions | A layout-engine limitation, not a requirement |
| The `999` ATP sentinel | Use explicit states |
| Reports that delete their own source records | See `06` § EOD |
| Features LA Mattress may not use | Pending Phase 0 item 4 |

---

## The four things most likely to go wrong

1. **Building 139 screens.** This is one engine, one picker, and a few dozen genuinely distinct
   queries. If the file count in the repo starts approaching the article count, stop.
2. **Scoping applied per screen.** Regional Processing and sales-security appear in ~40 articles
   because each screen re-implements them. Do it once at data access, or the exceptions will become
   accidents — and note that one required rules document is missing (Phase 0 item 2).
3. **Porting the batch coupling.** Reports that clear holds, flag records as reported, release
   disputes, and delete exception records are not reports. Separate the state transitions before
   any of these are built, not after.
4. **Treating exception and opportunity lists as reports.** They are work queues. Printed, they get
   re-printed forever and nothing is ever measurably fixed — which is exactly what Report Sales
   Exceptions demonstrates.
