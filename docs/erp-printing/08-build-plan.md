# 08 — Build Plan

Phasing for rebuilding the printing subsystem. Each phase is independently shippable and
leaves the system working. Read `00-README.md` first; the layering in
`01-architecture-and-data-model.md` is what makes this ordering work.

Before starting: **read the repo.** Match existing conventions for routing, service
boundaries, background jobs, permissions, migrations, and tests. Nothing in these documents
prescribes a stack, and nothing here should override a convention already established in the
codebase.

---

## Phase 0 — Decisions to make before writing code

These are not implementation details; each one changes the shape of everything downstream.
Get answers, then build.

1. **Rendering engine.** HTML→PDF is the default recommendation (it makes templates
   reviewable in git and reuses existing front-end skills). Confirm it handles: banded
   layouts with repeating page headers/footers, barcodes, fixed-width warehouse columns, and
   multi-copy output.
2. **Thermal/label printing.** Separate path or not? Zebra-style continuous roll printing
   generally needs its own renderer (ZPL). If we print hangtags or product labels at all,
   decide now — see `04` § New Label Wizard.
3. **Physical printing from a browser.** "Specify a Printer" and warehouse batch printing
   need either a print relay service or per-location default printers. This is
   infrastructure, and it gates Phase 3.
4. **Does LA Mattress use Ensenda** (or another last-mile carrier with a manifest feed)?
   Determines whether any of `06` § Send to Ensenda is in scope.
5. **Multi-lingual documents** — in scope? If no, all of `04` § Enhanced Laser Processing Form
   Designation and the language leg of form resolution collapse to nothing.
6. **Which grid component** serves as the PRV replacement (`02` § PRV Recommendation).
7. **Do we want end-user form editing at all**, or developer-authored templates in version
   control? (`04` § Read this first.) This is the single largest scope decision in the
   subsystem.

---

## Phase 1 — Output and delivery foundation

**Build:** `02-output-and-report-delivery.md`

- Output destination model as a per-run parameter: PDF, spreadsheet, delimited text, archive,
  network/object storage, interactive viewer.
- Report archive: storage, listing, permission-scoped visibility, retention purge with audit.
- Multi-report batch flow with the three-way per-item prompt (produce / skip / cancel rest).
- Deterministic download filenames: program + date + time.

**Acceptance:**
- A report can be run to every destination we support.
- **Regression test:** a summary-level report exported to a spreadsheet has non-zero totals
  matching the on-screen render. (This is the STORIS Excel bug in `02` — the test exists to
  prove we did not reproduce it.)
- Archived reports honor per-user visibility, and retention purges are logged.

**Skip:** Windows export paths, folder-creation prompts, per-workstation view resets.

---

## Phase 2 — Template engine and form resolution

**Build:** `04-forms-designer.md`, model only

- Per-document-type **data contracts** (typed view models), versioned.
- Template records with: default flag, location bindings, copies, ordered copy labels,
  revision log with mandatory change notes.
- Resolution: `(document_type, location, language)` → template, per the order in `01`.
- Test render with typed placeholder fill (`XXX` / `999` equivalent).
- Copy-a-template flow, landing inactive until explicitly made default.

**Acceptance:**
- Same document at two locations resolves to two different templates.
- Copy labels and copy count cannot silently disagree (`04` § Copies and Copy Labels).
- No template can be saved without a change note; history is queryable.
- System templates cannot be edited, only copied.
- Test render never touches real data.

**Skip:** the WYSIWYG designer, Report Explorer, Properties panel, designer versioning.

---

## Phase 3 — Print destinations and job queue

**Build:** `03-print-queue-and-printers.md`

- Printer registry (read-only in the UI) with live status.
- `UserFormDestination (user, form_type) → {default | ask | specific, printer}`, including the
  **first-print bootstrap prompt** — this is the good pattern from `03`, port it.
- Print job queue: owner, pages, timestamps, scope level, description; filter-to-mine;
  case-insensitive description search; review / print / delete / export-to-file; multi-job
  export into a single file.
- Permission check for acting on other users' jobs (a gap in STORIS, not a feature).
- Confirm-and-audit on job deletion.

**Acceptance:**
- A user printing a document type for the first time is asked once, and never again.
- Multi-select export produces one file containing all selected jobs.
- Deleting another user's job is either permitted-and-logged or blocked, deliberately.

**Skip:** form numbers, print units/modes/line settings, the entire legacy form-queue path.

---

## Phase 4 — The fulfillment chain (the important one)

**Build:** `06-fulfillment-documents.md`

Build it in the order the recommendation section gives:

1. **Domain operations first**, with tests, before any document exists: `reserveInventory`,
   `assignPieces`, `submitToPicking`, `removeFromPicking`, `markTicketPrinted`,
   `addToManifest`.
2. **Documents as pure renders** of that state: pick list, delivery/pickup/transfer ticket,
   pack list, manifest.
3. **Combined convenience actions** so the warehouse workflow reads unchanged.

**Acceptance — these are the tests that matter most in the whole subsystem:**
- Reprinting any document changes **no** state. Assert on a full state snapshot before/after.
- Picking status locks delivery status, route/truck, and date; removing from picking unlocks
  them.
- An order excluded from picking (mapping active, no truck) appears in the run summary as an
  explicit exclusion with a reason — **not** only as a comment on the order.
- The credit block (`Maximum Balance` + `Over Maximum Balance = Disallow`) prevents release to
  fulfillment, enforced on the domain operation rather than at render time.
- Route/truck field enablement derives from one per-location `fulfillment_selection_mode`.
- Run summaries report `N processed, M excluded` with M itemized, everywhere.

**Explicitly do not port:** the 52-back-order ceiling and its divergent silent-skip/error
handling.

---

## Phase 5 — Order, customer, and inventory documents

**Build:** `05-order-and-customer-documents.md`, `07-inventory-count-sheets.md`

- Completed order reprint (single and criteria-driven bulk), sharing one batch-picker
  component.
- Credit status letters, as **two distinct operations** (approval/decline, limit change)
  sharing a renderer — with the field-level rules in `05` intact, and the print-confirmation
  audit record.
- Mailing lists as a `MailingCampaign` with recipient rows, not a fire-and-forget export.
- Count sheets: one generator, two location-selection strategies, blind mode enforced by the
  *generate with quantities* permission.

**Acceptance:**
- A status letter cannot be produced with a Reason edited outside the one case that allows it.
- Email output for letters is offered only when both gates pass (customer email exists, letter
  type supports email).
- Running a mailing advances last-mailing date, name, and the lifetime counter — and leaves a
  queryable record of who was on it.
- A user without the count-quantities permission can produce only blind sheets, with the
  control disabled rather than merely unchecked.

---

## Deliberately out of scope

| Item | Why |
|---|---|
| WYSIWYG forms designer | See `04`. Revisit only if end-user template editing proves necessary |
| Legacy form-number print path | Superseded entirely by template resolution |
| Windows client-side export paths and folder prompts | Browser downloads replace them |
| Ribbon/Quick Access chrome, designer version negotiation | Thick-client artifacts |
| 52-back-order ceiling | A legacy record-layout limit, and a bug |
| Vendor label-stock catalog | Seed the stocks we buy |

---

## The three things most likely to go wrong

1. **Treating this as a printing project.** It is an inventory state-machine project with
   documents attached. If Phase 4 is built as "render a pick list," the reservations and
   picking locks will be missing and the warehouse will not work.
2. **Losing the silent exclusions.** STORIS drops orders quietly in at least four documented
   places. Each is a delivery that does not happen. Every one must become visible output.
3. **Rebuilding the designer.** Seven of twenty-eight source articles describe a licensed
   Windows report designer. The volume of documentation makes it look central. It is not —
   the data contracts and resolution rules underneath it are.
