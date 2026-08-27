# 03 — Printers, Form Queues, and the Print Queue

Covers: **View System Printers**, **Assign Print Forms**, **Change Printer Form Settings**,
**Assign Printer for Enhanced Laser Forms**, **Review Print Jobs**.

STORIS has **two parallel print paths**, and confusing them is the single easiest way to
misread this subsystem.

| | Legacy path | Enhanced Laser path |
|---|---|---|
| Unit of routing | **Form number** → printer queue | **Form type** → Windows printer |
| Configured by | Assign Print Forms, Change Printer Form Settings | Assign Printer for Enhanced Laser Forms |
| Scope | Terminal / session | **Log-on user** |
| Rendering | Host-side spooled output | Forms Designer template |

The legacy path is a MultiValue host spooler addressed by numbered forms — a printer is
loaded with a particular *form* (check stock, label stock, plain paper) and jobs are routed
by form number. The Enhanced Laser path is client-side rendering to a Windows printer.

**We are building one path, not two.** The Enhanced Laser model — resolve a template, render,
send to a destination — is the one to carry forward. The form-number model is
`[LEGACY]` in its entirety. It is documented below because you will meet it in the source
articles and in any data migration, not because it should be rebuilt.

---

## View System Printers

**Entry:** System Administration > Print System Settings > View System Printers (plus ~36
other menu paths that reach the same screen).

Read-only list. Displays: printer type, queue name, device name, device description,
printer status. No create, edit, or delete anywhere in this section.

**Build note:** the equivalent in the new system is a printer registry with a live status
probe. Keep it read-only in the printing UI; printer registration belongs in infrastructure
config, exactly as STORIS has it.

---

## Assign Print Forms `[LEGACY]`

**Also titled:** Printer Output.
**Entry:** ~40 menu paths, all landing on the same screen, most under a `Print Settings`
submenu.

Purpose, verbatim in intent: *enable a specific print form queue.*

| Field | Behavior |
|---|---|
| **Change Output to Form** | Select the STORIS form number to enable. The description from the Form file is displayed |
| **That form is assigned to printer** | Read-only. After selecting the form number, shows the printer that form is assigned to |

That is the entire screen. It is a form-number → printer-queue selector.

---

## Change Printer Form Settings `[LEGACY]`

**Entry:** ~38 menu paths, same `Print Settings` pattern.

Purpose: set **this terminal** to a specific form and print mode, **for one job only**. The
source's own example: jobs from your terminal normally print on the warehouse printer; use
this to send one job elsewhere.

| Field | Behavior |
|---|---|
| **Change Output to Form** | Select the STORIS form number for this print job. Description from the Form file displays |
| **Current Printer Assignment** | Read-only. Displays current **Unit, Mode, Form, Copies, and Line** settings |

`Unit / Mode / Form / Copies / Line` is the MultiValue spooler's addressing tuple. It has no
analogue in a modern system and should not be modeled.

**What survives migration:** the *user intent* — "send this one job somewhere other than my
default." Support that as a per-run destination override on the print dialog. Do not model
form numbers, units, modes, or line settings.

---

## Assign Printer for Enhanced Laser Forms

**Entry:** System Administration > Print System Settings > Advanced Printer Settings >
Enhanced Laser Forms > Assign Printer for Enhanced Laser Forms.

This is the one that matters. It is the **per-user, per-form-type print destination map**.

The screen lists every form type with that user's current print option and specified
printer. `[GATE]` **Changes affect the log-on user only.** `[GATE]` User/User Group security
may prevent a user from changing their own printer assignment.

Editing a row (double-click, or select + Edit) opens the **Print Settings** dialog with three
mutually exclusive options:

| Option | Behavior |
|---|---|
| **Print to Default Printer** | Always use the workstation's OS default printer |
| **Ask Every Time** | Show the OS print dialog on every print of this form type |
| **Specify a Printer** | Bind a named printer to this form type. The picker lists all printers available on the workstation, **including STORIS Print Preview** |

### The first-print bootstrap — port this behavior

The Print Settings dialog **also appears automatically the first time a user prints a given
form type**. The source's example: a user prints a sales order from Enter a Sales Order,
the system asks *"Would you like a printed copy of this order?"*, and because that form type
has never been printed by this user, the destination dialog appears and a destination must
be chosen before printing proceeds.

This is a good pattern and worth keeping. It means destination config is never a
prerequisite chore — it happens lazily, once, at the moment of first need, and the
Assign Printer screen exists only for *reviewing and changing* what was set that way.

**Recommendation:** model this as `UserFormDestination (user, form_type) → {mode, printer}`
where `mode ∈ {default, ask, specific}`, with absence of a row triggering the bootstrap
prompt. In a browser-based ERP, "Specify a Printer" needs a server-side print relay or a
per-location default printer; "Ask Every Time" maps to the browser print dialog; and
"STORIS Print Preview" maps to render-to-PDF-in-tab, which should be our default rather than
a special case.

---

## Review Print Jobs

**Entry:** ~40 menu paths under `Print Settings`.

Purpose: review, print, or delete **saved print jobs sitting in the queue that are not
printing.**

### Fields

- **Filter Display** — checkbox; restrict the grid to jobs created by the current user. The
  creating user's initials are always shown in the `Owner` column regardless.
- **Title Scan Literal** — substring filter on job description. Press Enter to apply.
  **Not case-sensitive.** (Source example: typing `salesperson` narrows to jobs whose
  description contains it.)
- **Action to Perform** — one of:

| Action | Behavior |
|---|---|
| **Review Selected Jobs** | Displays selected jobs on screen, **one at a time**, in the PDF reader |
| **Print Selected Jobs** | Sends selected jobs to the printer |
| **Delete Selected Jobs** | Removes selected jobs from the queue |
| **Move Selected to Desktop** | Exports the jobs to the user's desktop; activates the Format field |

- **Format** — `.PDF` or `.TXT`. Active only when *Move Selected to Desktop* is chosen.
  **All selected reports are written into a single file.**

- **Run** — executes the chosen action against the selected jobs.

### Grid

Columns: `Job ID`, `Owner`, `Pages`, `Date`, `Time`, `Level`, `Code`, `Description`.

`Level` values: blank (not part of a multi-select list), `Corporate`, `Regional`, `Store`.

### Build notes

- Ownership is first-class: jobs carry an owner and the UI is built around "mine vs. all."
  Pair that with a permission check on acting against *other people's* jobs — the source does
  not state one, and its absence is a gap, not a feature.
- Deleting a queued job is destructive and irreversible. Confirm it, and log it with actor
  and job identity.
- "One at a time" review is a modal-stepper idiom; a list with inline preview is better and
  loses nothing.
- The multi-job-into-one-file export is genuinely useful (a warehouse prints a shift's worth
  of documents as one PDF). Keep it.
