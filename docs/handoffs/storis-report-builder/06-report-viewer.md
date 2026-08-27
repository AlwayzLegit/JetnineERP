# 06 — Interactive report viewer (Personal Report Viewer)

Source: *Personal Report Viewer (PRV)*. STORIS ships this as a Windows desktop grid application.
Our equivalent is a **web data grid**. The desktop chrome is irrelevant; the *feature set and the
view-precedence model* are the parts worth copying exactly.

---

## How a report reaches the viewer

Via `Send Output To` = `V` (Personal Report Viewer) in Output Settings, either as the stored default
or changed per run through Actions → Output Settings → Save → Run.

## Two hard behaviours to replicate

1. **The viewer receives data only, never totals.** Totals are computed *inside* the viewer via
   column aggregations. Consequence: **sending a summary-only report to the viewer yields a blank
   report**, because summary-only suppresses the detail rows and the viewer has nothing to aggregate.
   Detect and block this combination with a clear message.
2. **Schema drift beats saved views.** If a new data column is added to a report, the viewer shows it
   regardless of any saved view. If a column is removed, it disappears regardless of any saved view.
   Saved views must therefore be stored as **column-name-keyed preferences that tolerate unknown and
   missing keys**, never as a positional snapshot.

---

## View precedence (get this exactly right)

Three scopes, in priority order at render time:

1. **Personal view** — per user, and in STORIS per workstation. Used by default…
2. …**unless a Corporate view exists that is newer than the personal view**, in which case the
   corporate view wins and is downloaded to the user's machine, replacing their personal view.
3. **Vendor/STORIS default view** — used when neither a personal nor a corporate view exists.
   Editable only by the vendor.

`Reset Default View` (a checkbox in Output Settings) initialises/removes saved personal settings so
the report falls back to corporate, then vendor default. In STORIS this must be done **per
workstation**; in a web client, do it per user and be done with it.

Saving a corporate view requires the permission **`Edit Personal Report Viewer Corporate Views`**
(user / user-group system security). The same permission gates deleting the corporate view.

> The "newer corporate view silently replaces the personal view" rule is aggressive. It is how an
> org pushes a standard layout. Keep the behaviour, but tell the user it happened rather than
> swapping their layout without a word.

---

## Grid capabilities to implement

### Layout
- Resize column widths by dragging borders; row height adjustable and **applies to all rows**.
- Hide columns via the **Column Chooser** (drag a header into it); hidden columns list
  alphabetically. Restore by dragging back to any position in the header.
- `Best Fit` (one column) and `Best Fit (all columns)`.

### Grouping
- A group panel above the headers: *"Drag a column header here to group by that column."*
- Groups render as expandable/collapsible nodes; `Expand All` / `Collapse All` on the ribbon.
- `Hide Group By Box` collapses the panel while grouping stays active.

### Sorting
- Click a header to sort; the first click sorts **descending**, the next ascending; an arrow shows
  direction. `Clear Sorting` returns to the unsorted view.
- Scroll-anchoring rule worth copying: if a row is selected when the sort runs, the grid scrolls so
  that row's item stays in view after re-sort. If no row is selected, the previously-top item stays
  at the top. To land at the true beginning or end of a sort, deselect and scroll to the extreme
  first.

### Filtering
- Per-column filter button offering: `Custom` (opens a Custom AutoFilter for compound expressions),
  `Blanks`, `Non blanks`, plus the column's distinct values.
- A **filter row** directly beneath the headers for typed filter terms (`Show Filter Row`).
- A **Filter Editor** per column for conditional expressions (e.g. product numbers beginning `ASH`).
- `Clear Filter` clears one column; other columns' filters persist.
- Multiple filters compose across columns.
- A **find panel** toggled by `Show/Hide Find Panel`.

### Aggregation
Right-click the **Total Footer** bar for whole-column aggregates, or the **Group Footer** bar for
per-group subtotals: `Sum` · `Min` · `Max` · `Count` · `Average`.

### Calculated columns
- `Add New Column` → New Calculated Column window: header text, data type (decimal, string, …),
  output format, and a **formula builder**.
- `Expression Editor` edits the expression alone; `Edit Column` opens the full editor;
  `Delete Column` removes it after a Yes/No confirmation.
- Same rule as dictionary formulas (`03`): closed function set, no arbitrary evaluation.

### Conditional formatting
`Condition Editor` creates style conditions per column, evaluated against the **post-calculation**
cell value — e.g. value equals "Good" ⇒ green background.

### Ribbon actions
| Group | Actions |
|---|---|
| File | `Open Report` (browse a saved report file), `Save Report` (writes view settings **and data** to a file for later viewing; STORIS default location `C:\Users\<user>\Documents\My STORIS Documents\Reports`, overridable at save time) |
| View | `Save Personal View`, `Save Default View` (vendor only), `Save Corporate View`, `Delete Corporate View` |
| Print and Export | `Print to Printer`, `Print Preview`, `Save to PDF`, `Save to HTML` |
| Grid Settings | `Show Filter Row`, `Show Group Panel`, `Expand All`, `Collapse All` |
| Quick Access | Add/remove ribbon groups to a quick-access bar; position it above or below the ribbon; minimise/restore the ribbon |

`Save Personal View` does not close the report — the user keeps editing, and the last saved version
becomes their default for that report.

### Exit behaviour
Closing with unsaved view changes prompts *"save the report view?"* — Yes saves the current view,
No exits and the next run reverts to the previously saved view.

---

## Web translation notes

- "Save Report (view + data) to a file you can reopen" maps cleanly onto our **archive** concept
  (`05`) — prefer archiving server-side over local files. Keep an export-to-file affordance for
  offline use.
- Personal views become per-user rows keyed by `(user, report)`. Drop the per-workstation dimension;
  it exists only because STORIS stored templates on the local disk.
- The ribbon/Quick Access customisation is desktop nostalgia. Skip it. Everything else on this page
  is real functionality users will miss if it is absent.
