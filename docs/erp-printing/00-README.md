# Printing & Output Subsystem — Handoff for Claude Code

## What this is

A functional specification of the **Printing** subsystem of STORIS ERP, reconstructed
in full from the 28 articles in the STORIS help center's `ERP > Getting Started > Printing`
section. It exists so we can rebuild equivalent capability in the LA Mattress in-house ERP.

This is a **behavior spec, not a design doc**. It describes what each screen accepts, what
rules gate it, and what it changes. It deliberately does **not** prescribe a stack, an ORM,
a queue library, a PDF engine, or a directory layout. Before writing code, read the existing
repo and follow whatever conventions are already there — routing, service layer, background
jobs, permissions, migrations, test framework. Where this spec says "job", "queue", or
"template", map it onto what the repo already does.

## Read in this order

| File                                 | Covers                                                                              | Source articles                                                                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01-architecture-and-data-model.md`  | The five layers, entities, and invariants that everything else assumes              | (synthesis)                                                                                                                                                                      |
| `02-output-and-report-delivery.md`   | Where report output goes: PDF, Excel, ASCII, NFS, archive, viewer                   | Output Settings, Output Report, Download Report, Review Archived Reports, Personal Report Viewer (PRV)                                                                           |
| `03-print-queue-and-printers.md`     | Printers, form queues, the spool queue, per-user print destinations                 | View System Printers, Assign Print Forms, Change Printer Form Settings, Assign Printer for Enhanced Laser Forms, Review Print Jobs                                               |
| `04-forms-designer.md`               | The document template engine: authoring, versioning, resolution, labels, test print | Design Enhanced Laser Forms, Forms Designer Window, Toolbox Tab, Copy Form Window, New Label Wizard, Test-Print Enhanced Laser Forms, Enhanced Laser Processing Form Designation |
| `05-order-and-customer-documents.md` | Customer-facing documents                                                           | Print a Completed Order, Print Completed Orders, Print Status Letter, Print Mailing Lists                                                                                        |
| `06-fulfillment-documents.md`        | The warehouse document chain, and the side effects that make it load-bearing        | Print a Delivery/Pick-Up/Transfer Ticket, Print Delivery Tickets, Print Pick List, Print Pack List, Print a Manifest                                                             |
| `07-inventory-count-sheets.md`       | Physical inventory worksheets                                                       | Print Count Sheets, Print Bar Code Physical Inventory Count Sheets                                                                                                               |
| `08-build-plan.md`                   | Phasing, acceptance criteria, what to cut                                           | (synthesis)                                                                                                                                                                      |

## The one thing to understand before reading anything else

In STORIS, printing is **not** a presentation concern. Three of these routines mutate core
business state, and the warehouse workflow is sequenced by them:

```
Pick List  ──reserves inventory, submits to RF picking, can create the manifest
    │
Delivery Ticket ──assigns inventory to the order, prepares picking,
    │              first step of manifest creation AND of order completion
    │
Pack List  ──pure report, no side effects
    │
Manifest   ──the signed paper trail; built separately, printed here
```

"Print the ticket" is how a STORIS user says "commit this order to fulfillment." If we
rebuild the documents without rebuilding the state transitions, the warehouse breaks.

**Design instruction for the new system:** separate the two. Model the state transitions
(reserve, assign pieces, submit to picking, mark ticketed) as explicit domain operations,
and make document generation a consumer of that state. Then preserve the _combined_
operation as a convenience action so the warehouse workflow still reads the same way. Every
place in these docs where a print routine mutates state is flagged **`[SIDE EFFECT]`** —
those are the ones that need real domain operations behind them.

## Conventions used in these docs

- **`[SIDE EFFECT]`** — this routine changes business state, not just output.
- **`[GATE]`** — a precondition that blocks the operation.
- **`[SETTING]`** — behavior driven by a configuration record; these are the seams where
  STORIS chose configurability over convention. Question each one; many are legacy and we
  may hard-code a sane default instead. Each is marked _keep_ / _simplify_ / _drop_ with a
  reason.
- **`[LEGACY]`** — an artifact of STORIS being a Windows thick-client app on a MultiValue
  backend. Do not port these. Listed so you recognize them in the source and skip them.

## Fidelity note

Everything not marked `[SIDE EFFECT]`-adjacent as commentary is drawn from the source
articles. Where the source is ambiguous or silent, the doc says so explicitly rather than
guessing. Where a recommendation is ours and not STORIS behavior, it appears under a
**Recommendation** heading. Do not blur that line when implementing — if you need a rule the
spec does not state, ask rather than invent.

Source: <https://storis.zendesk.com/hc/en-us/sections/15173205227540-Printing>
