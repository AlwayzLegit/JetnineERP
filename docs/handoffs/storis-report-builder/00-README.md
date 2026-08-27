# STORIS Report Builder — Claude Code Handoff (LA-Mattress-ERP)

## What this is

A full dissection of the STORIS **Run a Report** help-center page *and every article it links to*,
rewritten as an implementation brief for the LA Mattress in-house ERP.

This is a **specification**, not a port. Nothing here prescribes a language, framework, database,
or file layout. Before writing code, read the existing repo and follow whatever conventions are
already established there (module boundaries, naming, migration tooling, test framework, API style).
Where this brief says "entity", "field", or "routine", map it onto the repo's existing idioms.

## The domain in one paragraph

STORIS Report Builder (internally "Query Wizard") is an end-user report authoring system. A user
picks one **source file** (a table/view), attaches **dictionaries** (named, typed, formatted field
definitions — including computed ones and ones joined in from other source files), lays out
**columns** with widths/breaks/totals, defines **run-time prompts** and **static filters**, and
saves a named **report definition**. The definition is then executed by a separate runner that
collects prompt answers, applies a chosen **output destination** (PDF, printer, Excel, ASCII,
interactive grid viewer, archive, network drive), and either renders now or runs on a **schedule**.
Access is governed by three independent layers: report-level access, source-file-level security
groups, and field-level security codes.

## File map

| File | Covers |
|---|---|
| `01-domain-model.md` | Entities, relationships, invariants |
| `02-report-definition.md` | Create a Report — all five tabs, every field |
| `03-dictionaries-and-joins.md` | Maintain Report Dictionaries, File Join Assistant |
| `04-run-a-report.md` | Runner, run-time prompt resolution, preview, clone |
| `05-output-destinations.md` | Output Settings, archive, download, output-report |
| `06-report-viewer.md` | Personal Report Viewer — grid features and view precedence |
| `07-security-model.md` | Access field, file security groups, field security codes |
| `08-scheduling.md` | Add to Schedule a Process, scheduled-run constraints |
| `09-menu-integration.md` | USER-DEFINED menu, Menu Builder, program list |
| `10-related-report-patterns.md` | Four linked articles used as worked examples |
| `11-acceptance-tests.md` | Behavioural tests to write first |
| `12-open-questions.md` | What the docs do not answer — decide before building |

## Build order (suggested)

1. `01` + `03` — dictionary/source-file metadata layer. Everything else depends on it.
2. `02` — report definition CRUD and validation.
3. `04` — the runner and prompt resolution.
4. `05` + `06` — output destinations, then the interactive viewer.
5. `07` — security. Retrofit is painful; wire the hooks in from step 1 even if enforcement lands later.
6. `08` + `09` — scheduling and navigation surfacing.

## Ground rules for this domain

- **The report definition is data, not code.** It is authored at runtime by non-developers and must
  round-trip through storage without a deploy.
- **Never let a definition become an injection vector.** Every dictionary reference, operator, and
  sort key must resolve against the registered metadata for the chosen source file; free-text values
  are parameters only. STORIS's `Operator` list is a closed set for a reason — keep it closed.
- **Field-level suppression is a render concern, not a query concern.** When a user lacks a field
  security code, the column header still appears and the cell is blank. Do not drop the column.
- **Legacy naming appears in the UI.** "Query Wizard Builder" = Create a Report, "Query Wizard
  Dictionary Maintenance" = Maintain Report Dictionaries. Preserve the friendly names; the legacy
  ones are only useful when cross-referencing STORIS docs.

## Source articles

All from `storis.zendesk.com/hc/en-us/articles/<id>`:

| ID | Title |
|---|---|
| 15202450129300 | Run a Report *(the page this handoff started from)* |
| 15202401268756 | Create a Report |
| 15202401271700 | Maintain Report Dictionaries |
| 15202401138068 | File Join Assistant |
| 15202401140116 | Preview This Report |
| 15202401137812 | Clone this report to a new name |
| 15202401143956 | Adding Report Builder Reports & DTS Views to Menus |
| 15203127955092 | Build a Report File Option |
| 15203127953556 | Product Selection Actions |
| 15202105620756 | Output Settings |
| 15202090257172 | Personal Report Viewer (PRV) |
| 15202090118036 | Review Archived Reports |
| 15202105496084 | Output Report |
| 15202090117652 | Download Report |
| 15202450036884 | Report Builder Security Overview |
| 15242630130708 | Establish Report Builder Security Groups |
| 15242630129940 | Establish Report Builder Security Codes |
| 15234722295828 | Set Up Menus |
| 15185876708628 | Schedule a Process |
| 15203234860820 | Report Summarized Sales Receipts |
| 15295155415316 | View GMROI for a Vendor |
| 15294469194900 | Inventory Hierarchy |
| 15294468990612 | Gross Margin Calculator |
