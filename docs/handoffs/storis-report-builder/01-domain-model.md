# 01 — Domain model

## Entities

### SourceFile
The single root table/view a report is built on. **Exactly one per report definition.**
- `name` (e.g. `ORDER`, `ORDER.ITEM`, `SALES.ORDER`, `DAILY.DETAIL`, `BMW.WORK.DATA`)
- `description`
- Owns a collection of `Dictionary` records.
- Availability to a given user is gated by `FileSecurityGroup` membership (see `07`).

STORIS ships a downloadable Excel "source file list" per release enumerating every source file and
its dictionaries. Our equivalent should be a **queryable metadata catalog**, not a spreadsheet:
report authors need it inside the product.

### Dictionary
A named, typed, formatted field definition attached to a source file. This is the unit report
authors actually manipulate — they never see raw columns.

| Field | Meaning |
|---|---|
| `dictionary_name` | Identifier, unique within source file. Clone target names capped at 15 chars. |
| `description` | Human text |
| `column_heading` | Default text at the top of the report column |
| `prompt_name` | Reference-only label used when this dictionary drives a prompt |
| `width` | Default column width in character cells |
| `conversion` | Display formatting: decimal places, 2- vs 4-digit year, etc. |
| `attribute` | Physical field/attribute number — used when `type = DIRECT_ATTRIBUTE` |
| `on_file` | A file to validate the value's existence against |
| `formula` | Expression — used when `type = FORMULA` |
| `justification` | `LEFT` \| `RIGHT` \| `CENTERED` |
| `type` | `DIRECT_ATTRIBUTE` \| `FORMULA` |
| `specific_edits` | Closed list of acceptable answers when used as a prompt |
| `security_code` | Optional `FieldSecurityCode` restricting the data (not the column) |

**Invariants**
- `type = DIRECT_ATTRIBUTE` ⇒ `attribute` required, `formula` empty.
- `type = FORMULA` ⇒ `formula` required, `attribute` empty.
- A dictionary whose name contains a `.` (e.g. `OPER.INIT`) **must not be offered as a prompt
  dictionary**. STORIS reports "unpredictable results" — treat as a hard validation error, not a filter.
- Certain key dictionaries are restricted from selection to protect referential integrity. Model this
  as a per-dictionary `selectable_in_builder` flag rather than hard-coding exclusions.

### JoinedDictionary (via File Join Assistant)
A dictionary copied from a *secondary* source file and permanently grafted onto a primary one.
- `host_source_file`, `new_dictionary_name`, `join_source_file`, `join_field_name`
- The new name **must not collide with a STORIS-original dictionary name** on the host file — reject
  with an error before the join screen opens.
- Only source files with a **relation** to the host (a common dictionary) are eligible as join sources.
- Once added, it behaves exactly like a native dictionary of the host file and is usable in any report.

### ReportDefinition
| Field | Notes |
|---|---|
| `report_name` | Primary identifier. Names beginning `S$` are reserved (see below). |
| `description` | Also becomes the label in Schedule a Process |
| `source_file` | FK, immutable in practice — changing it invalidates every child row |
| `title`, `sub_title`, `footer` | Support `{DICTIONARY_NAME}` token substitution |
| `run_time_information` | Free-text instructions shown before the run |
| `add_to_schedule` | Boolean — exposes the report to the scheduler |
| `regional_type` | `NONE` \| `SALES` (district-scoped) \| `INVENTORY` (region-scoped) |
| `owner_user_id`, `owner_name`, `created_at` | System-set, read-only |
| `run_time_language_code` | `EN` (default) \| `FR` \| `ES` \| `ALT` |
| `access` | `ANYONE` \| `WITHIN_STAFF_TYPE` \| `OWNER_ONLY` |
| Children | `columns[]`, `prompts[]`, `filters[]`, `sorts[]` |

**Reserved-name rule:** definitions whose name starts with `S$` are vendor-standard reports —
runnable and cloneable, never editable. Our analogue: a `system_owned` flag plus a name convention.
Enforce that user-created names cannot take the reserved prefix.

### ReportColumn (Output tab row)
`dictionary_item`, `column_heading`, `width`, `break`, `new_page`, `total`, plus ordinal position.
- `new_page` requires `break = true`.
- `break` requires the same dictionary to also exist in `sorts[]`.
- Running `total_report_width` = Σ widths; surface it live to the author.

### ReportPrompt (Prompts tab row)
`dictionary_name`, `prompt_name`, `prompt_label`, `required`, `specific_edits`,
`prompt_type` (`SIMPLE` | `RANGE` | `MULTI_SELECT`), `date_code_enabled`,
`include_exclude` (`INCLUDE` | `EXCLUDE`, only when `MULTI_SELECT`).

### ReportFilter (Selection tab row)
`dictionary_name`, `operator`, `value`.
Operators — closed set: `EQ NE LT GT LE GE TR FL`.

### ReportSort (Sorting tab row)
`dictionary_name`, `sort_order`.

### OutputSetting
Per-run (and per-user-default) destination configuration. See `05`.

### ArchivedReport
A materialised run result. See `05`.

### SavedView
A per-report grid layout for the interactive viewer, at three scopes: `STORIS_DEFAULT` (vendor),
`CORPORATE` (org-wide), `PERSONAL` (per user + per workstation). See `06`.

### FileSecurityGroup / FieldSecurityCode
See `07`.

## Relationship sketch

```
SourceFile 1──* Dictionary ─────*──1 FieldSecurityCode (optional)
     │                 ▲
     │                 └── JoinedDictionary (copied from another SourceFile)
     │
     1
     *
ReportDefinition 1──* ReportColumn
        │         1──* ReportPrompt
        │         1──* ReportFilter
        │         1──* ReportSort
        │         *──1 User (owner)
        │
        └──* ReportRun ──1 OutputSetting
                  └──0..1 ArchivedReport

FileSecurityGroup *──* SourceFile
User *──* FileSecurityGroup     (checked box = access GRANTED / restriction overridden)
User *──* FieldSecurityCode     (checked box = access GRANTED / restriction overridden)
```

## Cross-cutting invariants

1. Every `dictionary_name` referenced by a column, prompt, filter, or sort **must belong to the
   report's source file** (natively or via a join). Validate on save *and* on run — a dictionary can
   be removed from the source file after the definition was written.
2. Deleting a dictionary that is in use must either be blocked or must degrade the affected reports
   visibly. Silent column disappearance is acceptable to STORIS (see `06`, vendor column removal) but
   should be logged and surfaced to the report owner.
3. `Break` + `Total` on *different* dictionaries is the trigger that makes the **Summary Only**
   run-time option appear. This is a derived property of the definition, not a stored flag.
4. Regional Processing (`regional_type`) narrows results by the running user's district/region
   entitlements. It only affects location-derived data.
