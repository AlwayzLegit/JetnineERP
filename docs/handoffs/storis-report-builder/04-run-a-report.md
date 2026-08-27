# 04 — The runner ("Run a Report")

STORIS name: *Run a Report (Run Query Wizard)*. The final step of the Report Builder process, and the
page this handoff started from.

Reachable from ~18 menu paths (Accounting: Receivables, Financing, Electronic Transmittal, Payables,
Vendor Receivables, General Ledger; Merchandising & Distribution: Purchasing and its Buyer/
Merchandiser Tools, Inventory, Advanced Warehouse Management; System Administration: System Tools,
Electronic Updates; Customer: Point of Sale, Customer Service). Again — **one routine, many
entry points.** The entry point may carry context (module, default filters) but must not fork the code.

---

## Screen 1 — report selection

- `Report Name` — enter directly or pick from a grid of runnable reports.
- The grid must already be filtered by the three security layers in `07`. A report the user cannot
  run should not be listed.
- `Run` advances to screen 2.

## Screen 2 — run-time options

Composed dynamically from the definition. It shows, in order:

1. **`Run Time Information`** text from the definition, if any — the author's instructions, verbatim.
2. **`Summary Only`** checkbox — *only* when the definition has a `break` on one dictionary and a
   `total` on a different one. Checked ⇒ omit detail rows, emit only the totals for the break item.
3. **Every prompt** from the Prompts tab, rendered per `prompt_type`:
   - `Simple` → single-value input (or the closed list from `specific_edits`)
   - `Range` → from/to pair
   - `Multi Select` → multi-picker, with `Include`/`Exclude` semantics applied
   - date-code-enabled prompts additionally offer `TDAY` / `YDAY` / `CPTD` / `LPTD`, resolved at
     execution time
   - `Required` prompts block the run until answered
4. **`Send Output to`** — displays the current destination. Read-only here; change it via
   **Actions → Output Settings** (see `05`).
5. **`Export Path`** — shown when the destination is Personal Report Viewer, Excel Export, or ASCII
   Export. Displays the pre-set drive/folder the system exports to. **Not editable from this screen.**

`Run` produces the report.

---

## Execution semantics

Compose the query from the definition in this order:

```
SELECT   columns[]            -- ordered, widths/conversions applied at render
FROM     source_file          -- plus joins implied by any JoinedDictionary in use
WHERE    filters[]            -- static Selection-tab conditions
  AND    prompt_predicates[]  -- from answered prompts; MULTI_SELECT honours include/exclude
  AND    regional_scope       -- when regional_type != NONE, per the user's districts/regions
  AND    field_security       -- see below: never a WHERE clause
ORDER BY sorts[]
```

Then:
- Apply `break` grouping (breaks require the field to be sorted — enforced at authoring time).
- Emit totals for `total` columns, per break group and overall.
- If `Summary Only`, drop detail rows and keep group totals.
- If `new_page` on a break column, page-break after each group.

**Field security is a rendering rule, not a filter.** A user restricted from a field still gets the
column header; the cells are empty. Never remove the column and never add a WHERE clause for it.

**Regional Processing** narrows location-derived data only, per the definition's `Type`
(`Sales` → districts, `Inventory` → regions) and the running user's entitlements.

---

## Preview This Report

Available from the builder's Actions menu on every tab.

- Shows the same run-time options screen; the author answers prompts and clicks Run.
- Renders **the first page only**, as PDF.
- To view or print the whole thing, use the runner.

Implement preview as the normal pipeline with a hard page-1 limit — not a separate code path, or the
preview will drift from reality.

## Clone this report to a new name

Builder → Actions → *Clone this report to a new name* → enter the new name in the clone window.

- Deep-copies the definition under a new name.
- **The sanctioned way to customise a vendor-standard (`S$`) report**, which cannot be edited but can
  be cloned and then edited.
- Clones must not inherit the reserved prefix.

---

## Run-time options are part of the output

From the *Report Summarized Sales Receipts* article: **"the run-time options selected for each report
will print on the last page of the report output."**

Adopt this as a standing convention for every report. A report page that cannot tell you which
parameters produced it is a support ticket waiting to happen. Include: report name, run timestamp,
running user, every prompt answer, the resolved values of any date codes, and the active regional
scope.

---

## Concurrency and long runs

The docs are silent. Decisions to make (see `12`):
- Synchronous render vs. queued job. STORIS's answer for the scheduled path is "archive it" — the
  same escape hatch works for long on-demand runs.
- Row-count ceiling and what happens at the ceiling.
- Whether a second run of the same report by the same user cancels or queues.
