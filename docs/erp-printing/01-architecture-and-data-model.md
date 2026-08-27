# 01 — Architecture and Data Model

## The five layers

STORIS printing decomposes cleanly into five layers. Build them in this order; each depends
only on the ones above it.

```
1. OUTPUT DESTINATION   Where does the bytes go? printer / PDF / Excel / ASCII /
                        archive / network share / interactive viewer
                              ▲
2. PRINT QUEUE          A spooled job: owned, inspectable, re-printable, deletable
                              ▲
3. FORM RESOLUTION      Given (document type, location, language), which template?
                              ▲
4. TEMPLATE ENGINE      Banded report layout bound to a named data contract
                              ▲
5. DOCUMENT ROUTINES    ~15 business screens that select records and emit documents
```

Layers 1–3 are shared infrastructure and are worth building properly once. Layer 4 is
where STORIS ships a full WYSIWYG designer; we almost certainly should not (see
`04-forms-designer.md` § Recommendation). Layer 5 is the actual business value and is where
the `[SIDE EFFECT]` behavior lives.

---

## Core entities

Names below are descriptive, not prescriptive — match repo naming conventions.

### `Printer`
Sourced from **View System Printers**, which displays exactly these attributes:

| Field | Notes |
|---|---|
| `printer_type` | STORIS distinguishes types; the source does not enumerate them |
| `queue_name` | The spool queue this printer drains |
| `device_name` | OS-level device |
| `device_description` | Human label |
| `status` | Printer status |

The screen is **read-only** — a list view, nothing more. There is no printer CRUD anywhere
in this section; printers are registered outside it.

### `FormType`
A *kind* of document — sales order, purchase order, check, credit card receipt, hangtag,
insurance letter. One form type has many `Form` templates. Form types are system-defined,
not user-created.

Form types are organized into four **form groups** (from the Forms Designer left pane):

- `standard` — print forms for most main features
- `label` — label forms (this is the only group with the New Label Wizard)
- `addendum` — import purchase order addenda
- `insurance_letter` — insurance acceptance and insurance cancellation letters

### `Form` (template)
One layout within a form type. Columns exactly as the Form Management grid presents them:

| Field | Meaning |
|---|---|
| `form_type` | Parent grouping |
| `description` | Editable for user forms; this is the identity users see |
| `is_storis_standard` | Ships with the product. **Cannot be edited** — only copied. In our system: `is_system_template` |
| `is_default` | The template used for this form type absent a location match |
| `locations[]` | Location codes bound to this template — see resolution order below |
| `copies` | How many copies print per document |
| `copy_labels[]` | One label per copy, e.g. "Customer Copy" / "Store Copy" |
| `user_modified` | User code of last editor |
| `modified_date` | Date of last edit |
| `form_notes` | Required change comment, appended on every save — see below |

**Two hard rules from the source:**

1. System templates are immutable. The only path to a custom form is *copy a standard form,
   then edit the copy*. A fresh copy lands with `is_default = false` and
   `is_storis_standard = false` and must be explicitly activated.
2. **Saving a form requires a change comment.** The Save dialog will not complete without
   Form Notes. Notes accumulate and are viewable per-form, or inline in the grid via
   Configure View → Preview Notes.

Rule 2 is a version-history requirement in disguise. Implement it as an append-only
`FormRevision` log (`form_id`, `revised_by`, `revised_at`, `note`, `layout_snapshot`), not as
a single mutable notes field. STORIS also exposes "View Live Data" — replaying a form
against the data of its last actual print — which is only possible with snapshots. Note
that STORIS **suppresses** live-data replay for forms carrying sensitive data (it names AP
check forms). Carry that restriction forward: snapshots of financial-instrument forms must
not be replayable.

### `FormDesignation` (multi-language override)
From **Enhanced Laser Processing Form Designation**. A table of explicit overrides, only
relevant when multi-lingual processing is active:

`(location, language, document_type) → form`

Used only for locations that need a document printed in a language *in addition to* the
location's default language.

### Form resolution order — implement exactly this

Given a document to print at a location:

1. If multi-lingual is active and a `FormDesignation` row matches `(document_type, location,
   language)` → use that form.
2. Else if any form in the form type lists this location in `locations[]` → use that form.
3. Else → use the form flagged `is_default` for the form type.

Language, when not overridden, derives from the **Document Language** field on the location
record (STORIS: Settings tab of Warehouse/Store Location Settings) for the location
associated with the form.

### `PrintJob` (spool queue)
From **Review Print Jobs**. Grid columns: `job_id`, `owner`, `pages`, `date`, `time`,
`level`, `code`, `description`.

`level` is one of blank / `Corporate` / `Regional` / `Store`, where blank means "not part of
a multi-select list."

Supported actions on selected jobs: review on screen, print, delete, export to the user's
desktop as `.pdf` or `.txt`. Jobs can be filtered to the current user, and searched by a
case-insensitive substring of the description.

### `ArchivedReport`
From **Review Archived Reports**. A report deliberately routed to storage instead of an
immediate destination.

| Field | Notes |
|---|---|
| `description` | Report title |
| `creator` | The user who ran it on demand; or the "Run as User" of the scheduled process; or the operator named in the scheduler when Run-as-User was blank |
| `date`, `time` | When the archive was created |
| `file_size` | Bytes (STORIS stores the payload as XML) |
| `district_region` | Populated only when the report is district- or region-scoped |
| `location` | Populated only when location-scoped |
| `source` | `Regular` / `EOD` / `Manual` / `EOM` |
| `is_scheduled` | Yes/No |

Two governance rules attach here:

- **Retention** is a global setting: *Report Retention Days*. `[SETTING] keep` — this is a
  real data-lifecycle policy, not legacy cruft.
- **Visibility** is permission-scoped: a user sees only the archived reports their
  *Access Archived Reports* permission allows. `[SETTING] keep` — archived reports contain
  costing, margin, and AP data.

### `ReportView` (PRV saved views)
Three tiers, resolved newest-wins with a specific precedence — see
`02-output-and-report-delivery.md` § PRV.

| Tier | Who can save | Scope |
|---|---|---|
| `system` | Vendor only | Fallback when nothing else exists |
| `corporate` | Users with the *Edit Personal Report Viewer Corporate Views* permission | Distributed to all users |
| `personal` | Any user | That user, that workstation |

---

## Cross-cutting invariants

These hold across every routine in Layer 5. Implement them once, centrally.

**Regional Processing restricts visibility.** Nine of the routines repeat the same sentence:
the locations (and customers) a user can see may be restricted by Regional Processing.
Treat this as a mandatory query scope applied at the data-access layer, not as a per-screen
filter — the repetition in the source is exactly the signature of a rule that was bolted on
per-screen and should have been central.

One documented exception, from **Print Delivery Tickets**: for transfers, a user may enter a
shipping location they do *not* have access to, provided they have access to the **To**
location. Encode this deliberately; it is not an oversight.

**Output destination is chosen per-run, not per-report.** Every report routine shows a
read-only "Send Output to" field and an Actions → Output Settings dialog that changes it.
Model output selection as a run-time parameter object attached to the report request.

**Export path is system-controlled.** Every routine that offers PDF / Excel / ASCII / PRV
displays a pre-set export path the user **cannot edit** — only the filename, and only for
some formats. `[LEGACY]` in its literal form (it names a Windows drive letter), but the
*principle* — the system decides where files land, the user does not — is worth keeping.

**Date Code is a shared control.** Multiple routines use a "date code" selector that gates a
date field: choosing a relative code (`TDAY`/today, `YDAY`/yesterday, tomorrow) fills and
disables the date input; choosing `CUS`/Custom enables it. Build one component and one
resolver. Note the vocabulary is inconsistent across screens in the source (`CUS`/`TDAY`/
`YDAY` in one, `Custom`/`Today`/`Tomorrow` in another) — normalize to one enum.

**Mapping Active is the master switch for route vs. truck.** Across the fulfillment
routines, a per-location *Mapping Active* flag (Route Mapping Interface) flips selection
and sorting between **route** and **truck**:

| Mapping Active | Selection field | Default sort |
|---|---|---|
| off | Route Code | route |
| on | Truck Number | truck |

The two fields are mutually exclusive — entering one disables the other. This one flag
drives field enablement on at least five screens. Model it as a single derived
`fulfillment_selection_mode` on the location and let the UI read that, rather than
re-deriving the condition per screen.

**A back-order ceiling of 52 exists.** Sales orders, service orders, and transfers permit at
most 52 back orders. At 53 the document routines break: `Print a Delivery/Pick-Up/Transfer
Ticket` silently **skips** the document, and `Print Delivery Tickets` raises an error.

This is a hard limit of the legacy record layout, and the divergent handling (silent skip vs.
error) is a bug, not a design. **Do not port the limit.** If a ceiling is needed for
sanity, make it explicit, configurable, and fail loudly and identically everywhere.
