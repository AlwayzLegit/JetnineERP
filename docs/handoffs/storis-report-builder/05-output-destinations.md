# 05 — Output destinations

Sources: *Output Settings*, *Review Archived Reports*, *Output Report*, *Download Report*.

The Output Settings window is reached from the **Actions button on virtually every print/report
routine** — not just Report Builder. Design it as a shared component with a per-routine allow-list,
because **not every option is valid for every report**.

---

## Output Settings window

### `Send Output To`

| Option | Behaviour |
|---|---|
| **Basic PDF** | Renders as one or more PDFs, opened automatically in the local PDF reader. Reports that generate several formats (detail, receivables recap, …) emit each as a separate item. |
| **Enhanced PDF** | PDF using the **Personal Report Viewer layout**, frozen. The PRV template on the local workstation determines the format — so whatever the user last saved as their PRV view for this report shapes the PDF. A footer is stamped on the output stating the PRV format was used. |
| **Personal Report Viewer** | Interactive on-screen grid (see `06`). Selection code is `V`. |
| **Printer** | Sends to the print spooler. |
| **Excel Export** | Writes an `.xlsx` with **live formulas embedded** (see the summary trap below). |
| **ASCII Export** | Writes a plain text file. |
| **Report Archive** | Does *not* display or print. Materialises the run as an archived report available in Review Archived Reports. |
| **NFS Shared Drive** | Exports to a network file system path. |

### The Excel + Summary trap (implement a guard)

Excel Export is the only destination whose output is **editable and formula-bearing** — column totals
are Excel formulas, not pre-computed values. Every other destination computes totals before output.

So: running the **Summary** version of a report to Excel produces **a totals row of all zeros**,
because the detail rows the formulas reference were suppressed.

Documented workaround: export the **detail** version to Excel and hide the detail rows.

**Do better than the doc.** Detect `summary_only && destination == EXCEL` and either (a) warn with
the workaround offered as a one-click alternative, or (b) emit computed values instead of formulas
for summary exports. Pick one and note it as a deliberate divergence.

### Other fields

| Field | Rules |
|---|---|
| `Reset Default View` | Only with PRV selected. Wipes saved PRV settings for this report so it renders with the current corporate view, else the vendor default. **Per workstation** — must be repeated on each machine. |
| `Export Path` | Read-only. For Excel/ASCII/PRV, the pre-set drive+folder. For NFS, the user-defined network path from **Account Statement Cycling Control Settings**, plus the `File Name` value. |
| `File Name` | System supplies a default. **Editable for Excel Export and ASCII Export** (and for NFS). Not editable elsewhere. |
| `Save` | Persists the setting and returns to the report screen. |

### Also relevant

Breaks/groupings from the Output tab are **not rendered when the destination is Excel**. Warn the
author at design time (`02`).

---

## Report Archive

### Review Archived Reports

Access: *System Administration → Print System Settings → Review Archived Reports*.

- **Permission:** `Access Archived Reports` on the Security tab of Create a User. The archived
  reports a user can see are determined by this permission.
- **Retention:** `Report Retention Days` in General System Control Settings.

Two grids. The upper lists available archived reports; the lower starts empty and holds the current
selection. Double-clicking an upper row (or the `Select Archived Report` button) **moves** it down;
`Deselect` moves it back. Deselecting removes it from the selection — it does **not** delete.

### Archive record fields (both grids)

| Column | Meaning |
|---|---|
| `Description` | Report title |
| `Creator` | The user ID that ran it on demand; or the scheduled process's `Run as User`; or, if that was blank, the Schedule a Process operator ID |
| `Date` / `Time` | When the archive was created |
| `File Size` | Size of the resulting **XML** file, in bytes |
| `District/Region` | Populated when the report is scoped to one; else blank |
| `Location` | Populated when scoped to a location; else blank |
| `Source` | How it was generated: `Regular` · `EOD` · `Manual` · `EOM` |
| `Scheduled?` | `Yes` / `No` |

Note the archive stores **XML**, i.e. structured data, not a rendered artifact. That is what lets one
archived run be re-output later to printer, PDF, or the interactive viewer. **Keep this property** —
archive the resolved dataset plus the definition snapshot, and render on demand.

### Actions on the selection

**Output Archived Reports** → opens the Output Report window:
- Destinations: `Printer` · `Basic PDF` · `Enhanced PDF` (only if PRV is allowable for the report) ·
  `Personal Report Viewer` (only if allowed for the report).
- `Reset Default View` and `Export Path` behave as in Output Settings; `File Name` defaults if blank.
- `Save` produces the output. With multiple reports selected, after each one a prompt offers
  **produce the next / ignore the next / cancel the remainder**.
- Availability depends on the compatibility of the selected reports; incompatible selections raise a
  notification.

**Download Archived Reports** → opens the Download Report window:
- `Path` — the default export path, read-only.
- `Name of Folder` — optional. Blank ⇒ default path. A bare name ⇒ relative to the default path; if
  it does not exist, a prompt offers to create it (Yes creates, No cancels the download). An absolute
  path is used as given (e.g. `c:\Users\abn\Documents\Some Other Folder Entirely`). Illegal Windows
  folder characters raise a warning.
- `File Format` — `PDF (*.pdf)` · `Text, tab-delimited (*.txt)` · `Excel Workbook (*.xlsx)`.
- `Run` saves the files. **Default filename = program name + archive date + archive time.**

**Delete Archived Reports** → deletes everything in the lower grid, after confirming
*"Delete all reports that have been moved to the 'Selected Archived Reports' section?"*

---

## Design guidance for our ERP

- The desktop-era assumptions (local drive export paths, per-workstation templates, `C:\Users\...`)
  do not survive a browser client. Replace with: server-side generated artifacts, a per-user
  downloads area, and browser downloads. **Keep the model, drop the drive letters.**
- Model destination availability as a capability matrix `report × destination`, evaluated in one
  place. Both Output Settings and Output Report consult it.
- Archive-then-render is the right default for anything slow, scheduled, or large. Treat immediate
  rendering as the optimisation, not the baseline.
