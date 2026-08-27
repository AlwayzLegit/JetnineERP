# 02 — Output Destinations and Report Delivery

Covers: **Output Settings**, **Output Report**, **Download Report**, **Review Archived
Reports**, **Personal Report Viewer (PRV)**.

This layer answers one question — *where does report output go?* — and it is shared by every
report and document routine in the system. Build it first.

---

## Output Settings

**Entry:** the `Actions` button on most print/report routines.
**Purpose:** choose the output destination for this run of this report.

### Destinations

Not every destination is offered for every report; availability is a property of the report.

| Destination | Behavior |
|---|---|
| **Printer** | Sends to the print spooler |
| **Basic PDF** | Generates a PDF (possibly several) that opens immediately in the local PDF reader |
| **Enhanced PDF** | Same as Basic PDF, but rendered using the **PRV layout template stored on the user's workstation**, and non-interactive. A footer is stamped on the report noting PRV format was used |
| **Personal Report Viewer** | Opens the interactive grid viewer (see below) |
| **Excel Export** | Editable `.xlsx` with **live formulas embedded** |
| **ASCII Export** | Flat text file |
| **Report Archive** | Not displayed or printed; stored as a new archived report, retrievable via Review Archived Reports |
| **NFS Shared Drive** | Writes to a network share. Path comes from the *Account Statement Cycling Control Settings* network path-name plus the filename field |

### Fields

- **Send Output To** — the destination, from the list above.
- **Reset Default View** — checkbox, only meaningful with PRV. Wipes saved PRV settings for
  this report so it renders with the corporate view, or failing that the system view. **Per
  workstation** — resetting on one machine does not reset others. `[LEGACY]` — an artifact of
  view state living on the client. In our system views are server-side, so this becomes a
  single "reset my view" action.
- **Export Path** — read-only, pre-set. Shown for Excel / ASCII / PRV. For NFS it shows the
  configured network path and the filename **is** editable there.
- **File Name** — defaults if blank. Editable for Excel Export and ASCII Export.
- **Save** — applies the settings and returns to the report screen.

### The Excel summary-mode trap — worth understanding, worth not repeating

STORIS documents this as a known behavior: if you run the **Summary** version of a report and
send it to Excel Export, **every total shows zero**.

The mechanism: every other destination computes totals server-side before emitting. Excel
Export instead emits detail rows plus formula cells that compute the totals. Summary mode
suppresses the detail rows. The formulas are left summing an empty range → 0. The
documented workaround is to export the Detail version and hide the detail rows manually.

This is a genuine correctness bug shipped as documentation. **Do not reproduce it.** Rule for
the new system: an export must always contain the numbers it displays. If we emit formulas,
we emit the rows they reference; if the rows are suppressed, we emit computed literals.
Add a regression test for exactly this case — summary report to spreadsheet, totals must be
non-zero and must match the on-screen render.

---

## Report Archive → Review Archived Reports

**Entry:** System Administration > Print System Settings > Review Archived Reports.

A two-grid transfer UI: **Archived Reports** (all reports visible to you) on top, **Selected
Archived Reports** below. Double-clicking a row, or selecting it and clicking *Select
Archived Report*, **moves** it down. *Deselect* moves it back. Selection is a move, not a
copy — a report appears in exactly one grid at a time.

Both grids show the same columns (see `ArchivedReport` in `01`).

### Actions on the selection

| Button | Result |
|---|---|
| **Output Archived Reports** | Opens the Output Report screen (below) |
| **Download Archived Reports** | Opens the Download Report screen (below) |
| **Delete Archived Reports** | Prompts *"Delete all reports that have been moved to the 'Selected Archived Reports' section?"* — Yes deletes, No cancels |

**Recommendation:** the two-grid move UI is a 1990s thick-client idiom. A checkbox list with
a bulk-action bar is equivalent and better. Keep the *semantics* — multi-select then act,
with a confirm on delete — and drop the transfer-box interaction.

### Governing rules

- `[GATE]` Visibility is scoped by the user's *Access Archived Reports* permission.
- `[SETTING] keep` Retention driven by *Report Retention Days* (global). Implement as a
  scheduled purge with an audit trail of what was purged.

---

## Output Report

**Entry:** Review Archived Reports > Output Archived Reports.
**Purpose:** re-render already-archived reports to a destination.

Destinations are a **subset** of Output Settings — an archived report can only go to:
Printer, Basic PDF, Enhanced PDF (if PRV is allowable for that report), Personal Report
Viewer (if allowed for that report).

`[GATE]` Availability depends on the compatibility of the selected report(s). Selecting an
incompatible destination raises a notification.

Fields: **Send Output to**, **Reset Default View** (as above), **Export Path** (read-only,
shown for Enhanced PDF / PRV), **File Name** (defaults if blank), **Save** to produce output.

**Multi-report flow:** when more than one report is selected, after each report is produced
a prompt offers three choices — *produce the next*, *ignore the next*, *cancel the
remaining*. Preserve this three-way choice; "skip one but keep going" is genuinely useful in
a long batch and is not expressible with a simple cancel.

---

## Download Report

**Entry:** Review Archived Reports > Download Archived Reports.
**Purpose:** write selected archived reports to the user's workstation as files.

### Fields

- **Path** — read-only default export path.
- **Name of Folder** — optional, and its semantics are unusually specific:
  - blank → files land at the default `Path`
  - a bare folder name → treated as **relative** to the default path
  - a full path (e.g. `c:\Users\abn\Documents\Some Other Folder Entirely`) → treated as
    **absolute** and used as-is
  - folder does not exist → prompt to create it; *Yes* creates it under the default path,
    *No* cancels the download
  - contains characters illegal in a folder name → warning, rejected
- **File Format** — one of: `PDF (*.pdf)`, `Text (Tab Delimited Values) (*.txt)`,
  `Excel Workbook (*.xlsx)`.
- **Run** — performs the download.

**Default filename** = report program name + archive date + archive time.

`[LEGACY]` The relative/absolute path branching and folder creation are thick-client
filesystem behavior. In a web ERP this collapses to a browser download (or a zip for
multi-select). **Keep** the deterministic filename convention — program + date + time makes
downloaded reports self-identifying, which matters when someone emails you one.

---

## Personal Report Viewer (PRV)

An interactive grid viewer for report output. Reached by setting **Send Output To** to
`V` (Personal Report Viewer) and running the report.

PRV lets a user reshape a report's presentation and persist that shape. **It never alters
underlying data** — the source is explicit about this.

### Two behaviors that will bite if missed

1. **PRV receives data rows only, never totals.** Totals must be produced inside PRV via
   column calculations. Consequence, stated in the source: **sending a summary-only report
   to PRV yields a blank report.** Same root cause as the Excel trap above.
2. **Schema changes override saved views.** If a column is added to a report, it appears for
   every user regardless of their saved view. If a column is removed, it disappears
   regardless. Saved views are *presentation preferences layered over a live schema*, not
   snapshots. Store them as such: a view is a list of directives (order, hidden set,
   widths, groupings, filters, calculated columns, conditions) applied to whatever columns
   currently exist, with unknown references ignored rather than erroring.

### Manipulation capabilities

| Capability | Detail |
|---|---|
| Column width / row height | Drag borders. Row height applies to **all** rows |
| Hide / restore columns | Via the Column Chooser panel; drag out to hide, drag back to restore |
| Group | Drag a column header into the group panel; groups render collapsible, sorted by the grouped value |
| Sort | Click header to toggle descending/ascending. **Sort preserves position:** with a row selected, the view scrolls to keep that row's item visible after sorting; with nothing selected, the previously-top item stays on top |
| Filter | Per-column: `Custom` (expression builder), `Blanks`, `Non blanks`, or pick a distinct value. Multiple filters compose. Also a Filter Row and a Filter Editor |
| Find panel | Toggleable search box below the ribbon |
| Best Fit | Per column or all columns |
| Calculated columns | Add / Edit / Delete a column defined by an expression, with declared header, data type, and output format, built via a formula builder |
| Aggregates | Right-click the Total Footer for a whole column, or the Group Footer for a group: `Sum`, `Min`, `Max`, `Count`, `Average` |
| Conditional styling | Condition Editor — style a cell based on its computed value (e.g. value = "Good" → green background) |

### View persistence and precedence

| Action | Effect |
|---|---|
| **Save Personal View** | Saves for this user. Does not exit the report |
| **Save Corporate View** | `[GATE]` requires the *Edit Personal Report Viewer Corporate Views* permission. Uploaded and distributed; **on next run it replaces each user's personal view** |
| **Delete Corporate View** | Same permission gate |
| **Save Default View** | Vendor-only |

**Resolution rule, exactly as stated:** the personal view is used, **unless a corporate view
exists that is newer than the personal view**. If neither personal nor corporate exists, the
system default is used.

This is a last-write-wins contest between an individual and their organization, and it means
publishing a corporate view silently destroys every user's customization. Implement the
precedence as specified, but **warn on corporate publish** ("this will replace saved views
for N users") and keep the personal view recoverable rather than overwritten. That is a
small deviation from STORIS and a clear improvement.

### Other PRV features

- **Open Report / Save Report** — writes view settings *and data* to a file for later
  offline viewing. STORIS default location `C:\Users\<user>\Documents\My STORIS
  Documents\Reports`, overridable at save time. `[LEGACY]` path; the *capability* (freeze a
  report with its data for later) is worth keeping as a server-side saved snapshot.
- **Print and Export** — Print to Printer (OS dialog), Print Preview, Save to PDF, Save to
  HTML.
- **Grid Settings** — toggles: Show Filter Row, Show Group Panel, Expand All, Collapse All.
- **Quick Access toolbar / ribbon minimize** — `[LEGACY]` Office-ribbon chrome. Skip.
- **On close with unsaved view changes** — prompts to save. Declining reverts to the last
  saved view on next run.

### Recommendation

PRV is a licensed Windows grid control (DevExpress-family) bolted onto a terminal app.
Nearly all of it — grouping, filtering, aggregates, calculated columns, conditional
formatting, saved views — is table stakes in any modern data-grid component. Do not build
this. Pick the grid component the repo already uses (or one, if none), and spend the
effort on the two things a component will *not* give us: the three-tier view precedence, and
the guarantee that totals are always present in the data rather than computed only in the
client.
