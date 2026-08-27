# Sales Views and Reports — Handoff for Claude Code

## What this is

A functional specification of the STORIS **Sales Views and Reports** section — all **139
articles** — reconstructed from the source. It exists so we can rebuild equivalent capability
in the LA Mattress in-house ERP.

Behavior spec, not a design doc. No stack, ORM, framework, charting library, or directory
layout is prescribed — read the repo and follow the conventions already there.

Source: <https://storis.zendesk.com/hc/en-us/sections/51935617013780-Sales-Views-and-Reports>

## Read in this order

| File | Covers | Articles |
|---|---|---|
| `01-reporting-platform.md` | The shared engine every report sits on: criteria vocabulary, date codes, location/district scoping, sorting, output | (synthesis) |
| `02-shared-components.md` | The 18 multi-select pickers, lookup windows, customer/cart search, phone lookup, Active Locations List | 0, 10–27, 32, 95–97, 99 |
| `03-customer-inquiries.md` | The customer 360: activity, purchases, deposits, receivables, protection plans, rewards, gift certificates | 4–7, 100–112, 121–124, 128, 132, 133 |
| `04-operational-inquiries.md` | Salesperson activity, open-order management, product availability, carts, leads/UP, credit views | 1, 2, 8, 9, 28–31, 98, 113–120, 125–127, 129–131, 134–137 |
| `05-report-catalog.md` | All 63 reports, one entry each | 33–94, 138 |
| `06-cross-cutting-rules.md` | Regional Processing, sales-security scoping, output-format restrictions, EOD/scheduled runs, retention | (synthesis) |
| `07-build-plan.md` | Phasing, acceptance criteria, what to cut | (synthesis) |

## The three things to understand before reading anything else

**1. This is one engine, not 139 screens.** Roughly 64 of these articles are reports and they
share a single criteria vocabulary — date code, district/location, salesperson, product
dimensions, sort, output destination — with per-report additions. Another 18 are the *same
multi-select picker* rendered against different lookup tables. Build the engine and the
component once; the 139 screens are configuration over them. `01` and `02` specify what to
build; `05` is the catalog of what to configure.

**2. Views and reports are the same thing viewed twice.** STORIS separates "views"
(interactive, on-screen, drill-down) from "reports" (criteria → run → output). Many pairs
cover identical data — `View a Customer's Open Orders` and `Report Open Sales Order Summary`
both answer "what's open for this customer." The split is an artifact of a terminal app where
the screen and the printer were different subsystems. **Recommendation:** build one queryable
surface per subject with a shared filter model, where "export" and "schedule" are actions on a
view rather than separate programs. That collapses a large fraction of this section.

**3. DTS is the extension mechanism, and it's load-bearing.** *Dynamic Tab Settings* lets
users assemble inquiry screens from a catalog of tabs. Six of the standard inquiries here are
explicitly DTS-composed, and the source repeatedly warns that "the descriptions in this topic
may not match the DTS you see on your screen." Whatever we build needs an equivalent
composition story — even a modest one — or every customer-view variation becomes a code change.
See `01` § Dynamic Tab Settings.

## Conventions

- **`[GATE]`** — a precondition that blocks or restricts.
- **`[PERM]`** — a named user/group security permission.
- **`[SETTING]`** — a named control setting.
- **`[LEGACY]`** — thick-client / MultiValue artifact. Do not port.
- **`[STD …]`** — one of the standard criteria fields defined in `01`. In `05` these are
  referenced rather than repeated.
- **Recommendation** — our judgment, not STORIS behavior. Never blur that line; if you need a
  rule the spec doesn't state, ask rather than invent.

## Scope note

Article count by kind: **63 reports** (33–94, 138), **18 multi-select pickers** (10–27), and
**58 inquiry, view, lookup, and utility screens**. The pickers are specified once in `02` with
their three real variants rather than eighteen times — that is full coverage done properly,
not sampling. Every article is accounted for in the table above.
