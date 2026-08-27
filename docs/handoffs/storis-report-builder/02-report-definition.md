# 02 — Report definition authoring ("Create a Report")

STORIS name: *Create a Report (Query Wizard Builder)*.
Reachable from ~18 different menu paths (every module's "Report Builder" sub-menu). In our ERP this
should be **one routine surfaced in many places**, not copies.

The screen is five tabs: **Headings · Output · Prompts · Selection · Sorting**, plus a persistent
`Report Name` field and an Actions menu.

---

## Report Name (outside the tabs)

- Type a new name to create; type/pick an existing name to edit or clone.
- Names beginning `S$` are STORIS Standard Reports: **printable and cloneable, never editable**.
  Reject user attempts to create a name with the reserved prefix.

## Actions menu (available from every tab)

| Action | Behaviour |
|---|---|
| Edit Dictionaries | Opens Maintain Report Dictionaries scoped to the current source file (see `03`) |
| Clone This Report to a New Name | Prompts for a new name, deep-copies the definition |
| Preview This Report | Runs the definition and renders **only the first page**, as PDF |

**Preview** still shows the run-time options screen first — the author answers prompts, clicks Run,
and gets page one. Full output requires the runner (`04`).

**Clone** is the sanctioned path for customising a vendor-standard report. Implement it as a deep
copy that clears `owner`, `created_at`, and `system_owned`.

---

## Tab 1 — Headings

| Field | Rules |
|---|---|
| `Description` | Free text. **Also becomes the process label in Schedule a Process.** |
| `Source File` | Exactly one per report. Picker lists source files the user may access. Changing it after children exist invalidates them — either block or cascade-clear with confirmation. |
| `Title` | Header line. Supports token substitution (below). |
| `Sub Title` | Second header line. Same token support. |
| `Footer` | Bottom-of-page text. Same token support. |
| `Run Time Information` | Unlimited free text. Stored and redisplayed on the run-time options screen before the run. Use it for "run this after EOD only" style notes. |
| `Add to Schedule a Process` | Checkbox. When on, the report becomes selectable in the scheduler (see `08`). |
| `Type` | Regional Processing scope. Only meaningful when Regional Processing is active. `None` = no location limitation · `Sales` = restrict by selected districts · `Inventory` = restrict by selected regions. Affects location-derived data only. |
| `Owner` | Read-only. User ID + name of the creating user, resolved from the user file. |
| `Creation Date` | Read-only. |
| `Run Time Language Code` | Only when Multi-Lingual Processing is active. Default English; also French, Spanish, Alternate. **Overrides the running user's own language for this report.** "Alternate" exists for a second dialect/variant. Untranslated portions fall back. |
| `Access` | `Anyone Can Run` (no restriction, all users may edit and run) · `Within Staff Type` (run+edit limited to users sharing the owner's staff type) · `Only the Owner`. |

### Token substitution in Title / Sub Title / Footer

Wrap a **prompt dictionary name** in braces and the run-time answer is interpolated into the report
header.

```
Sub Title:  Orders for {ORD_DATE}
Prompt:     ORD_DATE, Prompt Type = Range
Answer:     01/01/07 – 05/01/07
Renders:    Orders for 01/01/07 - 05/01/07
```

Rules to implement:
- Only names that appear in the report's **Prompts** tab are valid tokens. Validate on save.
- Unresolved tokens should render as the literal token, not blank, so authors notice the mistake.
- STORIS's own docs note the footer token also lands "in the header area" — that reads as a doc bug.
  **Implement footer tokens in the footer.** Flag this as a deliberate divergence.

---

## Tab 2 — Output (column layout)

One row per report column, in display order.

| Field | Rules |
|---|---|
| `Dictionary Item` | Picker limited to dictionaries of the chosen source file. |
| `Column Heading` | Auto-populates from the dictionary's heading. **Not editable here** — change it via Actions → Edit Dictionaries, or in Maintain Report Dictionaries. (Worth revisiting: a per-report heading override is a small change and an obvious usability win. Call it out rather than silently adding it.) |
| `Width` | Character-cell width. Defaults from the dictionary; overridable per report. |
| `Break` | Group/break on this column. **Requires the same dictionary to be present on the Sorting tab.** Breaks are *not* rendered when output goes to Excel. |
| `New Page` | Page break after this item. **Only enabled when `Break` is checked.** |
| `Total` | Sum this column. Availability depends on the dictionary (numeric conversions only). |
| `Total Report Width` | Read-only running sum of widths, left to right. |

### Two derived behaviours

1. **Summary Only.** If the definition has `break` on one dictionary *and* `total` on a different
   one, the runner must expose a `Summary Only` checkbox at run time. Checked ⇒ suppress detail rows,
   emit only the break-level totals.
2. **Width overflow.** If `total_report_width > 132` and output is PDF/Acrobat, the excess wraps to
   the next line. Warn the author at 132 rather than letting them discover it in the output.

---

## Tab 3 — Prompts (run-time parameters)

One row per parameter the user answers at run time.

| Field | Rules |
|---|---|
| `Dictionary Name` | Picker limited to the source file's dictionaries, **excluding any name containing a period** (e.g. `OPER.INIT`). A period-bearing prompt produces undefined behaviour — reject it. |
| `Prompt Name` | Reference/identifier only; not shown to the runner. |
| `Prompt Label` | The text the running user actually sees. |
| `Required` | If set, the runner cannot proceed without an answer. |
| `Specific Edits` | Builds a closed list of acceptable responses. Entry window has two columns: `Enter` (the stored selection data) and `Display` (how the option reads on screen). Marked "STORIS use only" — in our system this is a **superuser/admin-only** editor, not a general author capability. Availability depends on the selected prompt. |
| `Prompt Type` | `Simple` — one value (`Y`/`N`, a single date). `Range` — a from/to pair. `Multi Select` — many values. |
| `Date Code` (radio, within Prompt Type) | Makes relative date codes available on the run screen: `TDAY` today, `YDAY` yesterday, `CPTD` current period to date, `LPTD` last period to date. **The code is re-evaluated at every scheduled run**, so a scheduled report follows the calendar instead of freezing one date. `Simple` + date code = a single relative date; `Range` + date code = a relative range. |
| `Include/Exclude` | Only when `Prompt Type = Multi Select`. `Include` — selected items define the criteria. `Exclude` — selected items are removed from the result. |

**Implementation note.** The date-code mechanism is the difference between a scheduled report that
stays useful and one that silently reports the same week forever. Store the *code*, resolve it at
execution time against the fiscal calendar — never materialise the resolved dates into the definition.

---

## Tab 4 — Selection (static filters)

Condition statements baked into the definition. Unlike prompts, the running user cannot change them.

| Field | Rules |
|---|---|
| `Dictionary Name` | Source-file scoped picker. |
| `Operator` | Closed set: `EQ` equal · `NE` not equal · `LT` less than · `GT` greater than · `LE` less or equal · `GE` greater or equal · `TR` true · `FL` false. |
| `Value` | The comparison operand. `TR`/`FL` take no operand. |

Worked example from the docs — purchases on or before a date:
`PURCH_DATE` / `LE` / `<date>`.

**Blank handling.** A value of `""` (two quote characters, no space) means "the empty string".
`EMAIL_ADDR` / `NE` / `""` ⇒ only records that *have* an email address.
This is a real, documented idiom — support it explicitly with a dedicated is-blank / is-not-blank
affordance rather than making users type quote characters, but keep the typed form working.

Multiple rows: the docs do not state the combinator. STORIS behaviour is AND. See `12`.

---

## Tab 5 — Sorting

`Dictionary Name` + `Sort Order` (ordinal). Straightforward, with one coupling: **any dictionary
used as a `Break` on the Output tab must appear here**, or the break will not fire.

---

## Save

Clicking Save persists the definition. If the report is not yet on the USER-DEFINED menu, a prompt
offers to add it (see `09`). The prompt reappears on every save until the author answers Yes.

After save, the next step is the runner (`04`).

## Validation checklist to implement

- [ ] Source file selected before any child row can be added
- [ ] Every dictionary reference resolves against the current source file
- [ ] No period-bearing dictionary used as a prompt
- [ ] `new_page` ⇒ `break`
- [ ] `break` ⇒ dictionary also present in sorts
- [ ] `include_exclude` set ⇔ `prompt_type = MULTI_SELECT`
- [ ] Every `{TOKEN}` in title/subtitle/footer matches a prompt dictionary name
- [ ] Report name does not use the reserved system prefix
- [ ] Warn when `total_report_width > 132`
- [ ] Warn when `break` is set and the likely output is Excel
