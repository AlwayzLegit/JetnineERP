# STORIS System Administration — Part B (`SYS-048` … `SYS-093`)

*Source section: `15172952559508` "System Administration" (93 articles). This part covers
**positions 48 through 93** of the section's enumeration order, 46 articles.*

## Position reconciliation (read this first)

Enumeration order is the help-center section listing order, which is **alphabetical by title**.
Position 47 is `Modify Routeview PC Path` (the last article of part A) and **position 48 is
`Modify UPS Roadnet PC Path`** — the sequence continues sensibly with no gap or overlap. No
re-numbering was required.

My positions, in order, turned out to be:

| # | Article title |
|---|---|
| 48 | Modify UPS Roadnet PC Path |
| 49 | Multi-Lingual Character Sequences (Windows' Control Sequences) |
| 50 | Multi-Lingual Processing Set-Up |
| 51 | Override Time Clock Entry |
| 52 | Phantom Process Log |
| 53 | Phantom Process Settings |
| 54 | Physical Inventory Count Review |
| 55 | Purchase Orders to Export |
| 56 | Purge Costing Audit Data |
| 57 | Purge General Ledger Data |
| 58 | Purge Messenger Activity |
| 59 | Purge of Sensitive Data |
| 60 | Purge Special Order and Obsolete Products |
| 61 | Recover STORIS Licenses |
| 62 | Remove Sales Orders Not Processed Correctly |
| 63 | Report Data Imported Errors and Warnings |
| 64 | Report on Data Warehouse Activity |
| 65 | Resync Data Warehouse |
| 66 | Review Backup Log |
| 67 | Review Settings Activity |
| 68 | Right-Click Menus |
| 69 | Run a System Backup |
| 70 | Schedule Electronic Updates |
| 71 | Select and Configure a Vendor for Import |
| 72 | Select Contract Insurance |
| 73 | Select State Screen |
| 74 | Set Maximum Update Screen |
| 75 | Set Product Purchase Status by Region |
| 76 | Set Up Menus |
| 77 | Set Up Terminal Server for a Printer |
| 78 | Shift4 Cloud Credit Card Processing Overview |
| 79 | Shift4 Shared Token Load |
| 80 | Synchronize OS to STORIS Printers |
| 81 | Translate Bubble Help |
| 82 | Translate Dynamic Searches |
| 83 | Translate File Descriptions |
| 84 | Translate File Dictionaries |
| 85 | Translate Program Errors |
| 86 | Translation Tool |
| 87 | Update Product Configuration Detail |
| 88 | Update Purchase Date |
| 89 | Updating Your Operating System for Electronic Updates |
| 90 | User Defined Menu Description |
| 91 | Validate STORIS License Usage |
| 92 | View Downloaded Update List |
| 93 | View Phantom Processes |

### ⚠️ Scope note on `EOD-001` (end-of-day)

**The end-of-day / end-of-month cluster is NOT in my range.** Alphabetically it lands at
positions 23–32 (`End of Day Reports`, `End of Month Reports`, `End-Of-Month Active Module
Inquiry Screen`, `End-Of-Month Module Detail Screen`, `Generate Daily Reports`, `Generate
Monthly Reports`, `Generate Monthly Reports after Daily Reports`), i.e. **part A**. Part A owns
the `EOD-001` dissection. What I *can* contribute from my range is the scheduling/execution
substrate those routines run on — `Phantom Process Settings` (`SYS-053`), `Phantom Process Log`
(`SYS-052`), `View Phantom Processes` (`SYS-093`) — and the purge utilities that are normally
run alongside period-end. See those entries.

---

### `SYS-048` Modify UPS Roadnet PC Path
*storis_ref: article 15234738252436*

**Purpose.** Creates and maintains the two filesystem data paths used to exchange files with **UPS Roadnet®**, a third-party routing/mapping program that produces delivery itineraries from STORIS order data.

**Where it lives.** `System Administration > System Settings > General Administration System Settings > Interface System Settings > Route Interface System Settings > Modify UPS Roadnet Path`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Path From UPS Roadnet` | Text (filesystem path) | Default path *from* Roadnet *to* STORIS. Editable. "The path carries delivery manifest data created in Roadnet." |
| `Path To UPS Roadnet` | Text (filesystem path) | Default path *to* Roadnet *from* STORIS. Editable. "For delivery-type sales orders, STORIS sends customer and order data to Roadnet." |

**Behavior & rules.**
- The integration is **file-drop based, not API based** — two directories, one each way. There is no field for credentials, endpoint, or polling interval on this screen.
- NOTE from the article: "To use UPS Roadnet, you must first install it on your system. Contact your STORIS representative for more information." **The interface is not self-service; it requires vendor involvement to enable.**
- Only *delivery-type* sales orders are sent outbound.

**Dependencies.** Sibling of `SYS-044` Modify ArcLogistics PC Path, `SYS-047` Modify Routeview PC Path (part A) — all four "Modify … PC Path" routines live under the same `Interface System Settings` parent and follow the identical two-path shape. Related article: `Individual Zip Codes`.

**Build notes.** We should **not** reproduce the "PC path" pattern. Four separate hard-coded directory pairs stored as global settings is a maintenance trap: paths are per-server, untested at save time, and silently break on a machine move. Implement route-optimizer integration as an outbound job with a typed connector record (provider enum, credentials in the secret store, endpoint, retry policy) and a real inbound webhook/poll. If a file drop is genuinely required for a legacy tool, model it as one `integration_channel` row with a validated, existence-checked path rather than a free-text field per vendor.
`[DECISION NEEDED]` Does LA Mattress use a route optimizer at all (Roadnet / Routeview / ArcLogistics / something modern like Onfleet or Circuit)? If none, all four of these path screens are dead scope and should be dropped rather than ported.

---

### `SYS-049` Multi-Lingual Character Sequences (Windows' Control Sequences)
*storis_ref: article 15234737331988*

**Purpose.** A reference table of Windows keyboard control sequences for typing accented Latin characters. It documents OS behavior, not STORIS behavior.

**Where it lives.** No Access path — this is a documentation-only article, not a screen.

**Fields** — none (reference table only).

| Accent mark | Shortcut keys |
|---|---|
| `à è ì ò ù` | Press `Control + \`` (above Tab, next to 1). Release. Press the vowel. |
| `á é í ó ú` | Press `Control + '` (single quote). Release. Press the vowel. |
| `ä ë ï ö ü` | Press `Control + Shift + :` then release. Press the vowel. |
| `â ê î ô û` | Press `Control + Shift + ^` (on the 6 key). Release. Press the vowel. |
| `ç` | Press `Control + ,` then release. Press `c`. |
| `ñ` | Press `Control + Shift + ~` (above Tab, next to 1). Release. Press `n`. |

**Behavior & rules.** Gated on one condition: **"You can use these shortcuts if multi-lingual processing is active on your system."** — i.e. STORIS treats accented input as conditional on a global multi-lingual flag rather than as universally accepted text.

**Dependencies.** `SYS-050` Multi-Lingual Processing Set-Up; the `Multi-Lingual Processing Overview` article (outside this section).

**Build notes.** Nothing to build. **Our system must accept UTF-8 everywhere unconditionally** — no multi-lingual toggle, no character-set gate. Store all text as UTF-8, index case- and accent-insensitively for search. This whole article class disappears in a modern stack.

---

### `SYS-050` Multi-Lingual Processing Set-Up
*storis_ref: article 15234723191572*

**Purpose.** Instructions for configuring the *workstation's* Windows keyboard input language so an operator can type the special characters STORIS' Multi-Lingual Processing feature expects. Client-side setup, not server configuration.

**Where it lives.** No Access path — documentation article. Companion to the `Multi-Lingual Processing Overview`.

**Fields** — none.

**Behavior & rules.**
- **STORIS supports exactly two keyboard input languages:** `English (United States)` and `United States-International`. That is the whole supported set — a hard constraint, and a surprisingly narrow one for a product marketed as multi-lingual.
- With `United States-International` selected, dead-key combinations available in STORIS edit boxes (and Word/Excel): `"` + vowel → `ä ë ü`; `'` + vowel → `á é ú`; `^` + vowel → `â ê û`; `` ` `` + vowel → `à è ù`; `'` + `c` → `ç`.
- **Escape rule:** "To enter a regular double quote, single quote, carat, or grave accent when using United States-International, enter the character and then a space." — i.e. enabling international input **changes the meaning of the apostrophe key system-wide**, which will surprise users entering names like `O'Brien`.
- For Excel work (specifically the **Multi-Lingual Translation Tool**, see `SYS-086`) you must set the *standard* font to one supporting special characters — recommended `Arial Unicode MS`. Article warns: "simply selecting a font from the Formatting toolbar does not change your standard font"; it must be changed on the General tab of Excel Options.
- Windows 10/11 procedure: `Start > Settings > Time & language > Language & region > (ellipses next to display language) > Language Options > Keyboards > Add a keyboard > United States-International`.
- The default input language is the **first entry in the list**; you change the default by highlighting a language and clicking `Move Up`.

**Dependencies.** `SYS-049`; `SYS-081`–`SYS-086` (the Translate * routines and Translation Tool) all depend on the operator being able to type target-language characters.

**Build notes.** Entirely obsolete for a browser-based ERP. Nothing to port. **Do not build any client-machine setup requirement into our product** — if a user can type it into a browser, we must store it. Note for the i18n epic: STORIS' translation model assumes a *single* alternate language configured system-wide (see `SYS-086`), not per-user locale. We should do per-user locale from day one.

---

### `SYS-051` Override Time Clock Entry
*storis_ref: article 15234724184468*

**Purpose.** Lets an administrator edit or create user log-in/log-out records captured by the `Access Time Clock` routine — the manual correction path for STORIS' built-in employee time clock.

**Where it lives.** `System Administration > System Tools > Access Time Clock > Override Time Clock Entry`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `User ID` | Code, lookup to User file | The user whose time-clock entries are being edited. Search button offers a picklist. |
| `Date` | Date | Date of the entries to edit. **"You cannot enter a future edit."** Calendar icon available. |
| `Time In` | Time, 24-hour | Log-in time. **"You must enter 4 digits for every log-in time."** No colon required — `0834` = 8:34 AM. |
| `Time Out` | Time, 24-hour | Log-out time, same format — `1810` = 6:10 PM. |
| Grid: `Time In`, `Time Out`, `Hours Worked` | Read-only computed grid | All log-in/out pairs for the selected user and date plus resultant hours worked for each. |

**Behavior & rules.**
- **Two-digit shortcut:** "If you enter only 2 digits for time and then press [Enter], the system assumes you mean to enter a time on-the-hour" — `09` + Enter becomes `09:00`. This directly contradicts the field-level rule that four digits are mandatory; **both rules are stated in the same article**. Treat the 4-digit rule as the documented intent and the 2-digit interpolation as an undocumented-in-practice convenience.
- Editing: double-click a grid row, then type into `Time In` / `Time Out`.
- Creating: click `Clear` next to the grid to empty `Time In`/`Time Out`, enter the new times, click `Add` to update the grid.
- An open shift (log-in with no log-out) renders `Hours Worked` **empty**, "indicating the employee has not yet logged out."

**Behavior & rules — audit gap (flagged).** This routine lets an administrator **rewrite historical payroll-relevant time records with no stated audit trail, no reason code, no before/after capture, and no record of who made the override.** Nothing in the article indicates the edit is logged. Combined with `Run as User` (free impersonation, established finding) this is a material control weakness. **This is exactly the class of change that must feed `RPT-AUDIT` in our build.**

**Dependencies.** `Access Time Clock` (position 2 of this section, part A); User file / `SEC-*` user records. Permission gating is not stated in the article — but per the wave-1 finding, **any permission that does gate it is inert unless the global Extended Security kill-switch is on**.

**Build notes.**
- Build time-clock override as an **append-only correction**: never mutate the original punch; write a correction record referencing it, carrying `corrected_by`, `corrected_at`, `reason` (required), and original + new values. Show the original in the UI struck through.
- Enforce a real permission (`SEC-TIMECLOCK-OVERRIDE`) evaluated live at most-specific scope, and require it to be distinct from "view time clock".
- Keep the "no future date" rule; drop the 2-digit interpolation entirely (ambiguous input should be rejected, not guessed).
- `[DECISION NEEDED]` Does LA Mattress want an in-ERP time clock at all, or is time/attendance owned by the payroll system (ADP/Gusto/etc.)? If payroll owns it, this whole cluster (`Access Time Clock`, `Override Time Clock Entry`) is out of scope and we integrate instead.

---

### `SYS-052` Phantom Process Log
*storis_ref: article 15234735774356*

**Purpose.** Read-only viewer for the system-generated comment/log trail attached to one background ("phantom") process.

**Where it lives.** Two paths:
- `Administer Phantom Processes > (select a process from the grid) > Add button`
- `View Phantom Processes > (double-click process → Administer Phantom Processes) > Add button`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Process Name` | Read-only | Carried in from the calling routine; cannot be edited. |
| `Process ID` | Read-only | System-assigned process ID number; cannot be edited. |
| `Comments` | Read-only text | System-generated comments about this phantom. **"These comments are read-only and cannot be edited."** |

**Behavior & rules.**
- **The `Add` button opens a read-only log viewer.** That is a genuine UI trap — the affordance says "create", the screen is view-only.
- Log content is unstructured free text ("comments"), not typed events. There is no timestamp, severity, or filter field documented.

**Dependencies.** `SYS-053` Phantom Process Settings; `SYS-093` View Phantom Processes; `Administer Phantom Processes` (position 3, part A).

**Build notes.** Our equivalent is a **job run log**: structured rows (`job_id`, `run_id`, `started_at`, `finished_at`, `status`, `severity`, `message`, `context_json`), filterable and searchable, retained on a policy. Do not model it as an unstructured comment blob. Surface it in the same place an operator sees the job, not behind a mislabeled button.

---

### `SYS-053` Phantom Process Settings
*storis_ref: article 15234721715988*

**Purpose.** The master configuration for STORIS' background-processing engine. "Phantoms" are background workers, each running a STORIS program that processes transactions and updates files *while users work during the day*, so that less work is left for End-of-Day. This screen tunes how many run, how often they wake, and how they auto-scale.

**Where it lives.** Article's Access block is present but empty in the published page; reached from / related to `Administer Phantom Processes` and `View Phantom Processes`.

**Fields** (the article lists the field set; per-field descriptions are collapsed/absent in the published article — names are exact)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Process` | Code | The STORIS process this phantom serves. |
| `Description` | Text | Human-readable name. |
| `Type` | Enum (values not published) | Phantom classification. |
| `Sleep Interval` | Number (time) | How long the worker sleeps between polls of its queue. |
| `Status Interval` | Number (time) | How often the worker reports status / heartbeat. |
| `Auto Start Queue File` | File name | The queue file whose depth drives auto-scaling. |
| `Auto Start Queue Count` | Number | Queue-depth threshold used to compute how many phantoms should run. |
| `Auto Start Max Processes` | Number | Ceiling on auto-started workers for this process. |
| `Extra Information Display Subroutine Name` | Program name | Hook: custom subroutine invoked to render extra status info. |
| `Maximum Number of Concurrent Phantoms` | Number | Hard concurrency ceiling for this phantom type. |
| `Extra Cleanup Subroutine Name` | Program name | Hook: custom subroutine invoked on shutdown/cleanup. |
| `Order Completion Queue` | Queue reference | Queue used for the order-completion phantom specifically. |
| `Maximum Completion Time` | Number (time) | Time budget before an order completion is considered failed. |
| `Maximum Completion Attempts` | Number | **Retry cap** — attempts before giving up on a completion. |
| `Resubmission Interval for Locked Errors` | Number (time) | **Back-off delay before re-attempting an item that failed on a record lock.** |
| `Notify of Completion Errors` | Flag | Whether completion errors raise a notification. |

**Behavior & rules.**
- **This is the single most important architectural fact in my range for `EOD-001`:** phantoms exist explicitly "to reduce the amount of data End-of-Day must process." Example given: **the GL Posting Phantom posts GL during the day so End-of-Day has less to post.** Therefore *the end-of-day step list is not the whole picture* — an unknown fraction of period-end work is done continuously by phantoms, and which work that is depends on **which phantoms are active on a given installation**. Part A's EOD dissection must be read with this caveat.
- **Under-provisioning phantoms creates a backlog that lands on End-of-Day**; over-provisioning slows interactive work. "running too many phantoms can slow down your computing operations, and too few phantoms can result in a backlog of data for another process, for example the End-of-Day process."
- **Auto Start/Stop loop, as documented:** (1) all registered phantoms are checked; **any found inactive (dead) have their registration removed from the phantom record**; (2) the defined auto-start queue is checked and the correct number of phantoms is computed from the auto-start count; if too few are running, new phantoms are **automatically launched**; if too many, the system **stops some and deletes their registrations**. (3) "The automatic update/refresh mode may be exited at any time by pressing any key."
- **Hard operational rule, stated in capitals in the source:** "If you must shut down your server, **STOP ALL PHANTOM PROCESSES RUNNING ON THE SYSTEM BEFORE SHUTTING DOWN.**" No graceful-shutdown handling is claimed — killing the server with phantoms live is treated as a support incident.
- **Hard governance rule:** "STORIS personnel provide the default values in this routine during the installation of your system. **You should NOT change any of these fields without first consulting a STORIS representative.**" The background-processing engine is effectively vendor-owned configuration.
- **"not all STORIS processes have supporting phantoms"** — background processing is opt-in per process and incomplete by design.

**Dependencies.** `SYS-052` Phantom Process Log; `SYS-093` View Phantom Processes; `Administer Phantom Processes` (part A); `Order Completion Exceptions` (related article, outside section); the End-of-Day / End-of-Month routines (`EOD-001`, part A) consume whatever phantoms leave behind; GL posting.

**Build notes.**
- We need a real job runner (queue + workers + scheduler), but with **none of this hand-tuning exposed as business configuration**. Concurrency, sleep interval, and auto-scale thresholds are infrastructure concerns; put them in deployment config, not in an admin screen with a "call the vendor first" warning attached.
- **Do keep** these four as first-class, per-job-type settings because they encode real business semantics: `Maximum Completion Attempts` (retry cap), `Resubmission Interval for Locked Errors` (lock back-off), `Maximum Completion Time` (timeout), `Notify of Completion Errors` (alerting). Add a dead-letter queue, which STORIS lacks — here a permanently failing item just stops.
- **Design the period-close routine so it is idempotent and complete on its own**, rather than depending on how many background workers happened to be running that day. STORIS' "phantoms drain work so EOD is smaller" model means EOD results differ by installation and by load; ours must not.
- The "dead phantom registrations are silently deleted" behavior destroys the evidence of a crash. **Our runner must retain a terminal `crashed` run record**, not delete it.
- `[DECISION NEEDED]` Confirm our target job infrastructure (e.g. a database-backed queue vs. a hosted worker service) before speccing period-close, because the idempotency guarantee above depends on it.

---

### `SYS-054` Physical Inventory Count Review
*storis_ref: article 15234735558420*

**Purpose.** The post-import review/validation screen for physical inventory counts. It appears after count data is read in from a PC via `Import/Export Physical Inventory Count`, and is where an operator inspects imported rows, prints a report, and commits the clean rows to the physical inventory.

**Where it lives.** Appears automatically after reading in data via the `Import / Export Physical Inventory Count` routine (position 33, part A).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Display Options` | Enum | Filters the grid. Exact values: `All Records` (display all imported data), `Update Only` (display updated data only), `Errors Only` (displays lines flagged with errors only). |
| `Total Quantity` | Read-only computed | "The sum of the `Update Qty` and `Error Qty` columns." |
| `Send Output to` | Read-only (set via Actions) | Report output destination. Changed via `Actions > Output Settings`. |
| `Export Path` | Read-only | Shown when destination is `Personal Report Viewer (PRV)`, `Excel Export`, or `ASCII Export`. **"You cannot edit the export path using this process."** |
| Grid: `Label Number` | Read-only | The imported label number. |
| Grid: `Product` | Read-only | Product key (SKU) associated with the label number. |
| Grid: `Storage Locn` | Read-only | Storage location where the piece was counted, **or any notation the import process returns**. |
| Grid: `Update Qty` | Read-only | Count quantity that **will** populate the physical inventory. |
| Grid: `Error Qty` | Read-only | Count quantity attached to an errored line. **"This quantity does not populate the physical inventory."** |
| Grid: `Error Message` | Read-only | The error for the line, if any. |

**Behavior & rules.**
- **Commit semantics — partial-success import.** Clicking `Save` updates physical inventory counts with the imported data. "If errors are found, a warning message appears with the option to continue with the update or cancel the update. **Note that the process does not add lines with errors to the physical inventory count.**" So the operator may knowingly commit a partial count; rejected rows are simply *not applied* and, as documented, are not written anywhere durable — **there is no rejects file or re-import path described.**
- **Label number format is a hard 12-digit positional structure:** digit 1 = label type, digits 2–7 = label cross reference, digits 8–12 = label counter.
- **Exact validation rule set** (each of these prevents that individual count from processing):
  1. `Label number isn't 12 digits (1 - label type, 2-7 label cross reference, 8-12 label counter)`
  2. `Label type incorrect` — **first digit of the label number must start with `7` or `9`.**
  3. `Label cross reference doesn't exist` — digits 2–7 must match an existing product cross reference number.
  4. `Label references product in another location` — **special order, serial-tracked, and as-is labels match specific products and must be counted at the store/warehouse in which they reside.**
  5. `Storage location missing` — location-tracked locations must pass a storage location.
  6. `Storage location not on file` — must be a valid storage location.
  7. `Storage location not valid for location ~` (`~` is the message's substitution token).
  8. `Quantity must be numeric`.
  9. `Quantity must be an integer` — **"Number must be between 1 – 9999."**
  10. `Invalid Quantity for product type ~` — **"Only bulk products accept a quantity greater than 1."** Non-bulk (serialized/piece-tracked) counts are strictly quantity 1.
- Buttons: `Clear` re-initializes the screen; **`Delete` is inactive on this screen**; `Exit` returns to the Import/Export data process.
- Report available from `Actions > Physical Inventory Count Review Report`.

**Dependencies.** `Import / Export Physical Inventory Count` (part A, position 33) and `Import Physical Inventory Count Review Screen` (part A, position 37) — note **two near-identically-named review screens exist in this section**, which is itself worth flagging as a naming hazard. Reads product cross-reference data (`Import Cross Reference Data`, part A), storage locations, product type (bulk vs. serial vs. as-is), and special-order flags.

**Build notes.**
- This is the best-documented **validation contract** in my range and it directly informs `MIG-*`: adopt the shape (import → staging → row-level validation with a named error per row → operator review → commit only clean rows), but **fix the two gaps**: (a) persist rejected rows in a durable rejects table with the original payload so they can be fixed and re-submitted, and (b) make the commit a single atomic, resumable operation keyed by an import batch id.
- **Idempotency:** nothing in the article makes re-import safe — re-reading the same file would re-apply counts. Our import must be idempotent on `(batch_id, label_number)`.
- Keep the quantity rules as real constraints: integer `1–9999`; **quantity > 1 only for bulk product types**.
- Replace the fixed 12-digit positional label format with an opaque label id plus explicit columns; positional parsing of identifiers is a legacy constraint we should not inherit.
- Drop the "can't edit the export path" limitation — exports should go to a download, not a server directory.

---

### `SYS-055` Purchase Orders to Export
*storis_ref: article 15234736541844*

**Purpose.** The selection/confirmation screen for the PO export: it lists the purchase orders picked up by the `Export Purchase Orders` routine and lets the operator narrow that list before the export actually runs.

**Where it lives.** Displayed by the `Export Purchase Orders` routine (position 29, part A). Access block otherwise empty.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Grid checkbox per PO | Boolean | **"The system exports only the purchase order you select on this screen."** Unchecked POs are skipped even though the prior routine selected them. |
| `All` button | Action | Check every PO in the grid. |
| `None` button | Action | Uncheck every PO in the grid. |
| `Run` button | Action | Executes the export. |

**Behavior & rules.**
- On `Run`: "the program creates an **XML file** containing the selected purchase order data and sends it to the **web service program** for export to your outside program."
- If `Report Exported Purchase Orders` was checked in the `Export Purchase Orders` routine, the report is output to the selected location.
- **Result handling is all-or-error, not per-row:** "If any errors occurred, an error message appears. Otherwise, the system displays the number of purchase orders successfully exported." **There is no per-PO success/failure detail and no documented retry of a failed PO.**
- Nothing states whether an already-exported PO is excluded on the next run — **re-export appears possible and unguarded**, i.e. not idempotent as documented.

**Dependencies.** `Export Purchase Orders` (part A, position 29). Ties to Inventory-pack PO requirements (`PO-*`).

**Build notes.** For EDI/PO transmission we need what STORIS lacks: a per-PO transmission record (`sent_at`, `payload_hash`, `ack`, `error`), a guard against double-send, and row-level retry. Keep the human confirmation step — an operator reviewing exactly which POs go out is good practice — but present it as a diff against what has already been sent. XML over a "web service program" should become a versioned, documented integration payload.

---

### `SYS-056` Purge Costing Audit Data
*storis_ref: article 15234723643412*

**Purpose.** On-demand purge of **costed auditing data** — the audit trail generated by every inventory movement.

**Where it lives.** `System Administration > System Tools > Purge Data > Purge Costing Audit Data`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Start Date` | Date, optional | "Enter the start date or leave this field blank to use the earliest available date for this purge." |
| `End Date` | Date, optional | "Enter the end date or leave this field blank to use the latest available date for this purge." |

**Behavior & rules.**
- **What it destroys:** "All inventory updates, creating a product, changing its cost, receiving a PO, adjusting in quantity, selling a piece, transferring a piece, etc., create costed auditing data on the system." This purge **irreversibly deletes that trail**. There is no archive, export, confirmation prompt, or undo documented.
- **⚠️ Both date fields blank = purge everything.** "If you do not specify a date range, all costed auditing data is purged." **A user who presses Run on an empty screen destroys the entire costing audit history.** No confirmation is described.
- **"You can purge the data for any date range you specify, without restrictions."** — explicitly no guard rails: **no minimum retention, no protection of the open period, no check against unclosed months.**
- **This purge also runs automatically.** Retention is governed by the `Costed Auditing Data` field in **Costing Control Settings**, and the data is "purged automatically during month-end processing." This screen is the manual override of that policy.

**Behavior & rules — bearing on the audit-log question.** Costed auditing data *is* a real change trail for cost and inventory movement, but it is (a) scoped to costing/inventory only, (b) **on a retention timer that deletes it automatically at month-end**, and (c) **manually destroyable in full with two blank fields**. It is not a general change-audit log and cannot serve as one.

**Dependencies.** `Costing Control Settings` → `Costed Auditing Data` (retention period) — an existing `CFG-*` setting; month-end processing (`EOD-001` family, part A) invokes this purge automatically. Sibling purges: `SYS-057`, `SYS-058`, `SYS-059`, `SYS-060`.

**Build notes.**
- We want the *data* (a costing/inventory movement audit) but **not this deletion model**. Specify: retention policy configurable but with an enforced **floor** (e.g. cannot purge inside the current fiscal year or any unclosed period); purge always writes an archive/export before deleting; purge requires an explicit typed confirmation naming the row count and date range; **blank date range must be rejected, never interpreted as "everything."**
- Every purge run must itself be logged (who, when, range, rows deleted) into `RPT-AUDIT` — **the purge is the single most audit-worthy action in the whole administration section and STORIS logs none of them.**
- `[DECISION NEEDED]` Minimum retention for costing/inventory audit data at LA Mattress. Tax and inventory-valuation defensibility argue for 7 years; storage argues for less. Pick a number and make it a hard floor in code.

---

### `SYS-057` Purge General Ledger Data
*storis_ref: article 15234737760788*

**Purpose.** Purges **all GL-related files** for a computed range of fiscal years, enforcing the GL history-retention policy.

**Where it lives.** `System Administration > System Tools > Purge Data`

**Fields** — **all fields on this screen are display-only. The operator supplies nothing; the range is computed.**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Start Year` | Display-only | "STORIS searches your database to find the first fiscal year in which general ledger data exists and displays the year in this field." |
| `End Year` | Display-only | Computed — see formula below. "If you run this routine, the system purges all general ledger data **up to and including** the fiscal year specified at this field." |

**Behavior & rules.**
- **Exact formula for `End Year`:** "STORIS references the number in the `Maintain History Years` field in the **General Ledger Control Settings** and subtracts it from the current fiscal year, then subtracts an additional year (`-1`) to determine the year in which to cut off purging GL data."
  → `End Year = current_fiscal_year − Maintain_History_Years − 1`
- **Worked example from the article:** current fiscal year `2008`, first year of data `2001`, `Maintain History Years = 3` → `Start Year = 2001`, `End Year = 2004`. Result: the system **retains 3 years (2005, 2006, 2007) and purges everything from 2001 through 2004 inclusive.** (Note the example's arithmetic: `2008 − 3 − 1 = 2004`, and the retained set excludes the current year 2008 itself.)
- **Guard rail (the only one):** "The `Start Year` must precede the `End Year`, otherwise **you cannot access this routine**. That is, if the `Maintain History Years` field contains a number that causes the `Start Year` to exceed the `End Year`, then no data would be purged by this routine and this field is inactive." **The screen locks itself out rather than running a no-op — this is the one purge in the set with a real safety interlock.**
- **⚠️ Multi-company blast radius:** "If multi-company processing is active, this process **purges files for all companies**." **There is no company selector.** An administrator of one company destroys GL history for every company on the system.
- **What it destroys, irreversibly:** "all GL-related files" for the year range. No archive, export, or undo is documented, and there is no confirmation prompt described.
- Retention is driven entirely by one number in one settings screen; **changing `Maintain History Years` silently changes what the next run of this purge will delete.**

**Dependencies.** `General Ledger Control Settings` → `Maintain History Years` (existing `CFG-*` setting; **this is a destructive-scope setting masquerading as a retention preference**). Multi-company processing flag. `AP and GL History Conversions` (part A, position 4) is the counterpart load routine.

**Build notes.**
- Reuse the retention concept, reject the implementation. Requirements: explicit company scoping (**never implicitly all-companies**); a preview showing exactly which periods and how many journal rows will be deleted; mandatory archive-before-delete; typed confirmation; and a **hard floor** that cannot be configured below statutory retention.
- **Never let a fiscal-period purge be reachable by a user who can also edit the retention setting without a second approval.** In STORIS the same admin can lower `Maintain History Years` and immediately purge — a one-person path to destroying accounting history.
- Log every run to `RPT-AUDIT` with the computed range, company set, and row counts.
- `[DECISION NEEDED]` GL retention floor for LA Mattress. Note that "purge GL detail" is rarely the right answer in a modern stack — cold storage / partition archival is. **Recommend we do not build a GL purge at all in v1** and instead partition by fiscal year.

---

### `SYS-058` Purge Messenger Activity
*storis_ref: article 15234723664916*

**Purpose.** Permanently purges STORIS Messenger (internal mail) messages that users have already marked for deletion, older than a cutoff date.

**Where it lives.** `System Administration > System Tools > Purge Data > Purge Messenger Activity`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Cutoff Date` | Date | "The program purges all STORIS Messenger messages with a **deletion date** prior to the date you enter here." Then `Save` performs the purge. |

**Behavior & rules.**
- **Scope is narrow and safe-ish by design:** it only touches messages **already marked for deletion** — i.e. it empties the trash. Live messages are untouched. Deleted messages are visible beforehand on the `Closed` tab of `Send/Review Mail Messages`.
- The purge key is the **deletion date, not the message date.**
- **This program also runs automatically during End-of-Month processing**, purging messages deleted more than `History Retention Days` (from **STORIS Messenger Control Settings**) ago. This screen is the manual override. **→ Contribution to `EOD-001`: `Purge Messenger Activity` is a confirmed End-of-Month step.**
- **Hard permission rule, and an unusual one:** "This process is available only to users with the **`Mail Administrator`** field enabled in their User file (Staff File) record." **This is a flag on the user record itself, not one of the 355 catalogued permission flags** — a parallel, out-of-band authorization mechanism. Worth flagging: STORIS has at least one privilege that does not live in the permission system.
- Committing action is `Save` (not `Run`, unlike the sibling purges) — inconsistent verb across the purge family.

**Dependencies.** `STORIS Messenger Control Settings` → `History Retention Days` (`CFG-*`). `Send/Review Mail Messages` → `Closed` tab. User file / Staff File → `Mail Administrator` flag (**register as `SEC-MAIL-ADMIN`, noting it is a user-record field, not a permission-catalog entry**). End-of-Month processing (`EOD-001`, part A).

**Build notes.** If we build internal messaging at all, model deletion as soft-delete with a retention job, and treat the purge as routine housekeeping — this one is genuinely low-risk. **The real finding here is architectural: do not create privilege flags outside the permission model.** `Mail Administrator` is precisely the kind of one-off that makes an access review impossible. Every privilege in our system must be a permission evaluated by the same resolver.

---

### `SYS-059` Purge of Sensitive Data
*storis_ref: article 15234723664532*

**Purpose.** Purges **encrypted PII/PCI data** for the primary customer and co-applicant from the STORIS **Secured Data file**, per data type, on a retention-days basis. This is the data-minimization / PCI compliance routine.

**Where it lives.** `System Administration > System Tools > Purge Data > **Purge Encrypted Data**` (note: **the menu label differs from the article title** — the menu says "Purge Encrypted Data", the documentation says "Purge of Sensitive Data").
Also runnable via **`Schedule a Process`** — select `Purge of Sensitive Data` at the `Process` prompt.

**Fields** (grid, one row per data type)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Purge All` (header checkbox) | Boolean | Checks every row's box at once. |
| Check Box column | Boolean per row | "For each type you want to purge, check the box in this column… Leave a box blank if that type is not to be purged." |
| `Type` | Enum, fixed list | The six purgeable record types — see below. |
| `Retention Days` | Number, **1–99** | "enter the number of days between **1 and 99** after which you want to purge sensitive data of this type." |

**Exact list of purgeable data record types:**
1. `Credit Card`
2. `Social Security` — **"(currently not available - for future use)"**. **SSNs cannot actually be purged by this routine.**
3. `Finance Account`
4. `Checking Account`
5. `Date of Birth`
6. `Driver's License`

**Behavior & rules.**
- Run flow: set retention days per type → check the types to purge → click `Run` → **"The program prompts you to verify that you want to run the purge."** (One of the few purges with a confirmation prompt.) "Purging takes place based on the retention days you indicated."
- **Permission required:** the `"Purge secured/encrypted data"` field in `Create a User/Group Actions - System Security` settings. **Per the wave-1 finding, this permission — like all others — is inert unless the global `Extended Security` kill-switch is on. That means on a system with Extended Security off, the PCI purge routine is effectively ungated.** Flag this loudly for the security spec.
- **Hard prerequisite for the Credit Card type:** "To utilize this Credit Card purge, **`Retain Settled Card Number for NN Days` must contain a number greater than or equal to zero** in `Payment Card and Device Settings`." If that field is blank/unset, credit-card purging does not function — **a blank setting silently disables PCI data minimization.**
- **`Retention Days` is capped at 99.** You cannot express a retention of, say, 1 year through this screen. For PCI that is fine (shorter is better), but it means **this routine cannot implement a longer legal-hold retention** for DOB or driver's license.

**Behavior & rules — THIS IS THE AUDIT-LOG EVIDENCE. Read carefully.**
> "When this process is run **from the menu or as a scheduled process**, audit comments are generated that are stored in the **STORIS Log** and **Customer Activity Log**. The **STORIS Log** comments carry a **snapshot of the criteria used for the purge**, while the **Customer Activity Log** pinpoints **the specific data that was purged for the customer**."

This establishes the existence of **two named log destinations previously unregistered in this handoff pack: the `STORIS Log` and the `Customer Activity Log`.** See the consolidated audit-log finding at the end of this file (`SYS-067` and the closing section) — this materially changes the wave-1 conclusion.

**Dependencies.** `Payment Card and Device Settings` → `Retain Settled Card Number for NN Days` (`CFG-POS-*`). `Create a User/Group Actions - System Security` → `Purge secured/encrypted data` (permission — reuse the `SEC-*` id from `parts/user-security-CATALOG.md`). Global `Extended Security` kill-switch. `Schedule a Process` (scheduler). `SAR-024` Report Secured Decryption Activity (the read-side counterpart). Secured Data file.

**Build notes.**
- **We must build this — data minimization is not optional.** But invert the defaults: retention should be enforced **automatically and always**, with the manual screen existing only to run the job early, never as the sole mechanism. A compliance control that depends on an administrator remembering to tick six boxes is not a control.
- Retention per data class should be a policy record (`data_class`, `retention_days`, `legal_hold_exempt`), not a screen the operator retypes each run. Allow retention values well beyond 99 days for classes where the law requires it, and **0 days (never store) for card PAN** — we should tokenize and never hold PAN at all, making the Credit Card row unnecessary.
- **Do not ship an unimplemented enum value.** `Social Security (currently not available - for future use)` sitting in a compliance UI is worse than absent: it tells an auditor SSNs are purged when they are not.
- Purge of PII must write to `RPT-AUDIT` with the criteria snapshot **and** a per-subject record — STORIS' split across two logs is actually the right instinct; we unify it into one audit stream with a `subject_id`.
- `[DECISION NEEDED]` Which sensitive classes does LA Mattress actually store? If we tokenize cards and never store SSN/DOB/DL, most of this routine evaporates. **Strong recommendation: don't store it, so you don't have to purge it.**

---

### `SYS-060` Purge Special Order and Obsolete Products
*storis_ref: article 15234723644692*

**Purpose.** Removes from the **Product file** either (a) products flagged obsolete or (b) "temporary" special-order products created on-the-fly during order entry. It is a **two-phase routine: build a purge list, then purge it.**

**Where it lives.** `System Administration > System Tools > Purge Data > Purge Special Order/Obsolete Products`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Product Type To Purge` | Enum: `Not Selected` / `Obsolete` / `Special Order` | **Defaults to `Not Selected`, "forcing you to choose another option. You cannot edit any other fields in this routine until you choose one of the other options at this field."** `Obsolete` = products flagged via the `Purchase Status` field in `Advanced Product Settings` (also settable via the `Import Product Information` routine). `Special Order` = temporary products created on-the-fly via order entry. |
| `Action Type` | Enum, 5 values | See the exact list and rules below. |
| `Product Categories` | Code / multi-select / blank | Which categories to include. Blank = **All Categories**. Single category = pick a code. Multiple = use the `Multiple Product Category Selection` screen from `Actions`. |
| `Days With No Activity` | Number (days) | The "last-sold" threshold. "the list **includes** products whose last-sold date occurred **more** days in the past than the number you enter here." Worked example: enter `60` → includes last-sold > 60 days ago, **excludes** last-sold within the last 60 days. |
| `Date List Was Created` | Display-only | Shown if a purge list exists but the purge is not yet completed. |
| `List Created By` | Display-only | **User ID of whoever created the pending purge list.** |
| `Number Of Items In List` | Display-only | Count of products on the pending purge list. |
| `Exclude Kits with Active Components` | Checkbox | "the program includes kit master products. To exclude kit masters containing one or more active components… check the box." **Active only if `Product Type To Purge` = `Obsolete` AND a purge list doesn't already exist.** |
| `Send Output to` | Read-only (set via `Actions > Output Settings`) | Report destination. |
| `Export Path` | Read-only | Shown for `Personal Report Viewer (PRV)`, `Excel Export`, or `ASCII Export`. "You cannot edit the export path using this process." |

**`Action Type` — exact enum values and rules**

| Value | Rule |
|---|---|
| `Select Products to Purge` | Builds the list of eligible products. **Must be run first — "The `Purge Products` function is not available unless a purge list exists."** |
| `Purge Products` | "removes products in the current purge list from the Product file." |
| `Clear List, Reset Product Status` | **Only active when `Product Type To Purge` = `Obsolete`.** Deletes the list without purging; **removes the purge status and returns the product to its original obsolete status (i.e. `discontinued`)**. No products removed; a new list must be built before purging. |
| `Clear List, Maintain Purge Status` | **Only active when `Product Type To Purge` = `Obsolete`.** Deletes the list without purging **but retains the purge status on the product**. No products removed; a new list must be built. |
| `Print/Display List` | Generates the list for review. **"active only if you selected either the `Select Products to Purge List` or `Purge Products` option."** |

**Behavior & rules — exact eligibility contract ("Qualifying for the Purge List").** The program includes only special-order or obsolete products **with no activity**, meaning products with **no quantity**:
- on hand
- reserved
- on sales or service orders — **"(if the order is closed, it must purge from the system before you can purge the product)"** — i.e. closed orders must themselves have been purged first; there is an ordering dependency between purges
- on layaway
- on transfers
- in as-is status
- on back-order
- **on open purchase orders\***
- with cost exceptions
- and having a **last-sold date that falls outside the `Days With No Activity` window**

Plus: **"the program excludes products with any invoice history or associated costing data."** That data is itself purged by other policies — invoice history by `Customer Retention Months` in **Point of Sale Control Settings**, costing data by **Costing Control Settings** (see `SYS-056`). **So product purge is effectively gated behind the invoice-history and costing purges having already run — a three-way dependency chain no screen surfaces.**

**Behavior & rules — the `EOD-001` / `PO-104` nugget (highest-value line in my range).** The article's footnote on "open purchase orders":
> "**If Third-Party Accounting is active, received purchase orders remain open until they have been AP approved via `Enter Multiple Vendor Invoices (AP Approval)` and closed during the subsequent End-of-Day processing. The End-of-Day process closes purchase orders provided the orders have been completely AP approved.**"

**This independently confirms the Inventory pack's `PO-104` assumption from a second article: End-of-Day stamps the PO closed date, and the close is conditional on complete AP approval — and that conditionality only applies when Third-Party Accounting is active.** Two consequences the Inventory pack should absorb:
1. **PO close is not "received ⇒ closed". It is "received AND fully AP-approved ⇒ closed at next EOD"** — with a lag of up to one EOD cycle, and indefinitely long if an AP bill is never approved.
2. **When Third-Party Accounting is NOT active, this AP-approval gate does not apply** — implying a different (presumably receipt-driven) close path. Part A should confirm which, from the `Generate Daily Reports` article.

**Other hard rules.**
- **"Products flagged for purging do not appear in the sales-related version of the `Search for a Product` window."** — flagging for purge has an immediate live side effect on order entry *before* the purge runs. A half-finished purge silently hides products from sales.
- `Clear List, Reset Product Status` vs `Clear List, Maintain Purge Status` is the only escape hatch from that hidden state, and **it exists only for `Obsolete`, not for `Special Order`.** There is no documented way to un-flag a special-order product once listed.
- Run via `Actions > Run` once run-time options are selected.

**Dependencies.** `Advanced Product Settings` → `Purchase Status` (obsolete flag; see also `SYS-075` Set Product Purchase Status by Region). `Import Product Information` routine (alternate way to flag obsolete). `Point of Sale Control Settings` → `Customer Retention Months`. `Costing Control Settings`. Third-Party Accounting flag. `Enter Multiple Vendor Invoices (AP Approval)`. End-of-Day processing (`EOD-001`, part A) — **and the Inventory pack's `PO-104`.** Kit master/component structure. Related articles: `Product Details`, `Advanced Product Settings`, `Reopen a Financed Transaction`.

**Build notes.**
- The **two-phase build-list-then-commit pattern is worth keeping** — it gives a reviewable, printable manifest with `created_by` and `created_at` before anything is destroyed. Extend it: make the list immutable, timestamped, expiring, and require the purge to reference the list id.
- **Do not hard-delete products.** Archive/soft-delete with a tombstone so historical documents, reports, and integrations don't develop dangling references. STORIS' whole eligibility gauntlet exists only because it hard-deletes; soft-delete makes most of those ten conditions unnecessary.
- **Never let purge-flagging change search visibility before the purge is committed.** That is a live production side effect from a maintenance routine.
- Special-order products created on the fly should not pollute the product master at all — model them as order-line-scoped items with a nullable product reference. That eliminates this routine's larger half.
- Keep the eligibility checks as a reusable "is this product referenced anywhere?" service, and surface *which* condition blocked each product (STORIS gives no per-product reason).
- `[DECISION NEEDED]` Do we allow product deletion at all, or archive-only? Recommend archive-only.

---

### `SYS-061` Recover STORIS Licenses
*storis_ref: article 15234739734676*

**Purpose.** Shows current **SCiX** sessions and lets an administrator forcibly log a user off in order to free a concurrent-use license. This is the "all licenses consumed, nobody can log in" rescue tool.

**Where it lives.** `System Administration > System Tools > Recover STORIS Licenses`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `STORIS Licenses Consumed` | Display-only | Licenses currently in use. |
| `STORIS Licenses Available` | Display-only | Total licenses available. |
| Grid: `User` | Read-only | STORIS staff name. |
| Grid: `OS Logon ID` | Read-only | The user's operating-system logon ID. |
| Grid: `Login Time` | Read-only | **"Displays in military time."** |
| Grid: `Client Connection Status` | Read-only | Connection state of the SCiX session. **"This will only update if you have the latest version of the communication server; if not, `unsupported` is displayed."** |
| Grid: `Process ID` | Read-only | OS/STORIS process id. |
| Grid: `PC Hostname` | Read-only | User's PC name. **"It is possible that duplicate names may appear if you are using sub-domains. This is blank if the user does not have the latest version of SCiX."** |
| Grid: `Current STORIS Program` | Read-only | The program the user is currently in — **effectively live per-user activity surveillance.** |
| Grid: `Logoff` | Action button | Logs the user off. **"A prompt appears to confirm the action. The STORIS license is released for this session."** |
| `Refresh` | Action | Repopulates the grid. "Released sessions are removed from the grid." |

**Behavior & rules.**
- **Exclusions from the grid — three of them, and they matter:** phantom processes are not shown; companion-product users (`eSTORIS`, etc.) are not shown; **and "The user currently accessing this process is not shown in the grid"** (so you cannot log yourself off). Consequence, stated: "the number of lines in the grid may not equal the number of available licenses."
- **The soft-logoff semantic is unusual and important:** "Once a license is released, **that user can continue processing until a point is reached where a session timeout is allowed, such as a key field or the STORIS menu.**" **Forced logoff is not immediate — it is deferred to the next safe point.** The license is freed straight away, but the user keeps working until they hit a checkpoint. **This means licenses consumed can legitimately exceed licenses available for a period.**
- **Permission model — an explicit exception to the norm:** "This routine can only be accessed by a user with permission assigned in the **`Recover STORIS Licenses`** setting located in `Create a User/Group Actions - System Security`; **there is no security override option.**" **This is the only routine so far documented as having *no* security override — worth registering, because it implies most other routines DO have an override path.**
- **Login-time rescue path:** "If you have permission to access this process and no licenses are available when logging in, a message appears with the option to free up a license via the `Recover STORIS Licenses` process. **Otherwise, you are logged out.**" So a user without this permission is simply denied entry when the pool is full.
- On entry, "the terminal records are validated and the grid is populated."
- **Sync relationship:** "Occasionally license and Terminal records need to be synced using `Validate STORIS License Usage`. **When a user logs in, `Validate STORIS License Usage` is automatically run**, ensuring that when the `Recover STORIS Licenses` screen is accessed, the licenses and TERMINAL records are already in sync." (See `SYS-091`.)
- Use case called out: "especially useful in managing SCiX sessions **if you have one STORIS license per store**."

**Dependencies.** `Create a User/Group Actions - System Security` → `Recover STORIS Licenses` permission (`SEC-*`, in `parts/user-security-CATALOG.md`) — **and per wave 1, still inert unless `Extended Security` is on.** `SYS-091` Validate STORIS License Usage. TERMINAL records. SCiX client / communication server versions.

**Build notes.**
- **We are not building concurrent-user licensing.** This entire routine exists to ration a commercial license pool; it has no analogue in an in-house system. Drop it.
- **Do keep the useful half as an operational tool**, decoupled from licensing: an **active sessions screen** showing user, login time, client/IP, last activity, and current screen, with the ability to **revoke a session (terminate the token) immediately** — not deferred to a "safe point". Session revocation must be instant; that is a security control, not a capacity control.
- Session revocation is a security-relevant action → must write to `RPT-AUDIT` (who revoked whose session, when, why). STORIS logs nothing here.
- **Note the surveillance angle:** `Current STORIS Program` per user is real-time employee monitoring. `[DECISION NEEDED]` for LA Mattress: do we expose "what screen is this user on right now" to administrators? There are legitimate support reasons and obvious privacy concerns. Recommend: show last-activity timestamp, not current screen, unless support explicitly needs it.

---

### `SYS-062` Remove Sales Orders Not Processed Correctly
*storis_ref: article 15234738567700*

**Purpose.** Bulk-voids every sales order left in a corrupt / incompletely-processed state. A data-integrity cleanup for orders whose entry or update aborted partway.

**Where it lives.** `System Administration > System Tools > Remove Sales Orders Not Processed Correctly`

**Fields** — **none.** The routine has no parameters at all: no date range, no store, no order-number filter, no preview.

**Behavior & rules.**
- **The entire user interface is one confirmation prompt, quoted exactly:**
  > `This process will void all orders not processed correctly. Continue?`
- `Yes` → "an information screen appears with the number of documents that have been removed." `No` → returns to the STORIS Main Menu.
- **⚠️ This is a system-wide, unfiltered, unpreviewable bulk void.** The operator sees **no list of what will be voided before committing**, and afterward gets only a count — **not which orders.** There is no way to know what was destroyed. Combined with the absence of a general change log, **this action is effectively unreconstructable after the fact.**
- **It also runs automatically:** "In addition to the ability to run this routine on demand, **this process runs automatically during the end-of-day process in the sales order module.**"
  **→ Contribution to `EOD-001`: `Remove Sales Orders Not Processed Correctly` is a confirmed End-of-Day step, executing within the sales order module.** Part A should place it in the step ordering. Note the phrasing "in the sales order module" implies EOD is **module-partitioned**, i.e. the daily job is a sequence of per-module sub-jobs rather than one flat step list — a structural hint for `EOD-001`.
- "Void" (not delete) is the verb used for the orders, but the confirmation screen reports "the number of **documents that have been removed**" — **the article is inconsistent about whether orders are voided or removed.** Flag as unresolved.

**Dependencies.** End-of-Day processing, sales order module (`EOD-001`, part A). Sales Order file. Related to `SYS-060`'s note that closed orders must purge before their products can.

**Build notes.**
- **We should not need this routine at all.** It exists because STORIS order writes are non-transactional — a partial write leaves a half-order that later has to be swept up. **Wrap order creation/update in a database transaction and the failure mode disappears.** This is the clearest example in my range of a maintenance tool that is really a bug workaround; do not port the workaround, fix the cause.
- If a sweeper is still needed as a belt-and-braces measure (e.g. for multi-service sagas), it must: list candidates before acting, require per-row or explicit-count confirmation, record every affected order id to `RPT-AUDIT`, and be idempotent.
- **Never ship a destructive action whose only affordance is an unfiltered "Continue?" prompt.**

---

### `SYS-063` Report Data Imported Errors and Warnings
*storis_ref: article 15234720861588*

**Purpose.** Re-prints, on demand, the **conversion Error Report** that the data-import/conversion process generates on every run. This is the reject-visibility mechanism for `MIG-*`.

**Where it lives.** `Import Data > Actions button > Error Report`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Date and Time` | Dropdown / lookup | Selects which historical run's report to print. **"If more than one error report is available for the selected conversion file, this field is active. Otherwise, the field is inactive."** Reports are listed by the date and time the conversion process was run; an `Action` button opens a read-only lookup window. |
| `Include Errors` | Checkbox, **default checked** | Prints `"E"` type errors — **"errors that prevent records from being updated."** |
| `Include Warnings` | Checkbox, **default checked** | Prints `"W"` type errors — **"warnings that do not prevent records from being updated."** |
| `Include New Products` | Checkbox | Messages about new products. **"This is active in Product Imports only."** |
| `Include Discontinued Products` | Checkbox | Messages about discontinued products. **Product Imports only.** |
| `Include Other Changes` | Checkbox | Messages on other changes. **Product Imports only.** |
| `Include Activity Summary` | Checkbox, **checked by default** | "generate error reports and the activity summary page in the `Date and Time` drop-down… If unchecked, the activity summary page is excluded, but reports with errors are included." |
| `Save` | Action | **Produces the report.** (Again `Save` is used as the run verb.) |
| `Actions > Output Settings` | Action | Printing/destination preferences. |

**Behavior & rules — the exact per-record disposition contract (directly reusable for `MIG-*`).** The Error Report "marks each record in the data file as one of the following":

| Status | Exact meaning per the article |
|---|---|
| `converted` | "the record was successfully added to the STORIS database." |
| `error` | "the record was **not** converted to the STORIS database, a brief explanation appears." |
| `warning` | "**the record WAS converted to the STORIS database, but with conditions.** A brief explanation appears. **Check the record in STORIS for integrity.**" |

- **`warning` is the dangerous state and the single most important `MIG-*` finding here: STORIS will import a record it knows is questionable and then tell the operator to go check it manually.** There is no queue, no flag on the record, no follow-up workflow — just a line on a printed report. **On a real cutover this is how silent data corruption enters production.**
- **Every conversion run produces a report** ("The system generates an Error Report each time you run the conversion process"), and **reports are retained per run and selectable by date/time** — so there *is* a durable per-run import history, at least for conversions.
- **"Unscheduled data imports display one report and the summary activity is included regardless of errors existing."** — scheduled vs. unscheduled imports behave differently in reporting.

**Dependencies.** `Import Data` (part A, position 35), `Import External Data` (position 36), `Automated Data Import Settings` (position 10), `Assign Conversion Import Translations` (position 6), `Conversion Process Actions Button` (position 14), `Select and Configure a Vendor for Import` (`SYS-071`). Product import specifically for the three product-only checkboxes. Directly informs **`MIG-*`**.

**Build notes — this is the core `MIG-*` contribution from my range.**
- Adopt the three-state per-record disposition (`converted` / `error` / `warning`) — it is the right vocabulary — but **change what `warning` means operationally**: a warning-imported record must be **flagged in the database** (`import_review_required = true`, with the warning text attached), appear in a **work queue**, and block nothing but be impossible to lose. "Check the record in STORIS for integrity" as printed advice is not acceptable.
- **Rejects must be persisted as data, not as a report.** Store the original source row, the reason, and the run id, so rejects can be corrected and re-submitted without re-running the whole file.
- Keep per-run history keyed by `(source_file, run_started_at)` and make it queryable, not just printable.
- **Idempotency, for `MIG-*`:** nothing in this article or `SYS-054` indicates any import routine is idempotent. Assume **it is not**, and design ours with a batch id + natural-key upsert so a re-run is safe. **Explicitly verify this with STORIS before any cutover rehearsal — re-running an import that isn't idempotent is the classic cutover-day disaster.**
- `[DECISION NEEDED]` For cutover: do we accept `warning`-class records at all, or treat every warning as a hard reject until the source data is fixed? Recommend **hard-reject on warning for the initial migration** (clean data in), and allow warnings only for ongoing operational imports.

---

### `SYS-064` Report on Data Warehouse Activity
*storis_ref: article 15234723880468*

**Purpose.** Produces a log identifying **Data Warehouse files whose database triggers are not working properly**, and self-heals what it can. This is the integrity check for the DW replication feed.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Interface System Settings > Data Warehouse Settings > Report on Data Warehouse Activity`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Date` | Date | "Enter the date for which to check trigger statuses for errors." Calendar icon available. |

**Behavior & rules.**
- **Self-healing behavior, exact:** "If a bad or missing trigger is identified, **the system creates a new trigger for that process and sets a flag so that the file is re-synchronized the next time the End of Day export is run.**"
  **→ Contribution to `EOD-001`: there is a "Data Warehouse export" step in End-of-Day**, and it honours a re-sync flag set by this routine. Part A should look for that step by name in `Generate Daily Reports`.
- **Escalation rule:** "**some errors may be serious enough to require manual re-synchronization** via the `Resync Data Warehouse` (`Data Warehouse Resync`) routine." The article does **not** say which errors, how the operator is told, or how to tell the two cases apart — **a silent-failure risk: the routine may report a trigger as fixed when a full resync is actually required.**
- **The whole design implies the data warehouse is fed by database triggers that can silently die**, and that the only way to find out is to run this report for a given date. **There is no proactive alerting.**

**Dependencies.** `Data Warehouse Settings` (`CFG-*`). `SYS-065` Resync Data Warehouse. End-of-Day export step (`EOD-001`, part A). Related article: `Replenish Assigned Stock Levels` — which ties this to the Inventory pack's `REPL-040`/`REPL-041`.

**Build notes.**
- **Do not build analytics replication on database triggers.** Use CDC / an event log / a scheduled ELT with watermarks — mechanisms that are observable and idempotent by construction. Trigger-based replication that can silently stop, and requires a human to run a dated report to notice, is the anti-pattern here.
- Whatever we build must have: a **freshness metric per table** (rows behind / seconds behind), an **automatic alert** when it exceeds threshold, and a **safe full-resync** that does not require an administrator to guess whether the incremental fix was sufficient.
- If we do keep a DW export in the nightly job, it must be idempotent and restartable — see `SYS-053` on not depending on background-worker state.

---

### `SYS-065` Resync Data Warehouse
*storis_ref: article 15234737969044*

**Purpose.** Manually flags Data Warehouse files for full re-synchronization when they are believed to have drifted out of sync.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Interface System Settings > Data Warehouse Settings > Resync Data Warehouse`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `File Name` | Display-only | "The currently selected grid item displays." |
| `Resync Flag` (top-of-screen override) | Enum: `Full File` / `No Override` | `Full File` → "uses the override setting (**`F`** for full re-sync) during the **end-of-day data warehouse data export process**. After you click on `Full File`, click on the `Add` button to update the `Resync Flag` field for the selected grid item." `No Override` → "uses the default type export setting (**`N`**)". |
| Grid: `Resync Flag` | Read-only status | **`N`** = the file does not need re-synchronization. **`F`** = "the `Data Warehouse Trigger Status` routine determined the file needs a full file re-synchronization **or** that the default status of the file is set to `F`." |
| Grid: `Default Type` | Enum, 3 values | **`A` - Audit**, **`F` - Full**, **`S` - Select List**. |
| `Actions > Set all Files` | Action | **"set the `Resync Flag` for all files to `F` (full file)."** |
| `Actions > Clear all Files` | Action | **"set all files to `N`."** |

**Behavior & rules.**
- **Warning printed in the article, quoted:** "**Important! This routine can have a powerful affect on your files. Check with your STORIS representative before running this routine.**" Second vendor-gated routine in my range (cf. `SYS-053`).
- **Resync is deferred, not immediate:** flags set here are consumed **during the End-of-Day data warehouse export process**.
  **→ Contribution to `EOD-001`: confirms a discrete "Data Warehouse data export" step inside End-of-Day, which reads a per-file `Resync Flag` of `N`/`F` and performs either an incremental or a full-file export accordingly.** Combined with `SYS-064`, the DW export step is definitely part of the daily job.
- **Real-time exception:** "If **Real-Time Data Warehouse services** are used, this process **immediately** flags the file for resync and pushes the files to the Data Warehouse **with the next batch export from STORIS**." (Note the internal tension — "immediately" flags, but still ships with the next batch.)
- **`Set all Files` is a one-click full re-sync of every DW file.** On a large database that is a potentially enormous, unthrottled export dropped into the nightly window, with a vendor warning as the only guard. **No confirmation prompt, no size estimate, no scheduling control is documented.**
- **`Clear all Files` is the dangerous inverse: one click clears every pending resync flag, including flags that `Report on Data Warehouse Activity` (`SYS-064`) set automatically because it detected broken triggers.** **An operator "tidying up" the grid can silently discard the system's own repair instructions and leave the warehouse permanently stale.** This is the sharpest foot-gun in the DW pair.
- The `A - Audit` default type is notable: **some DW files export on an audit basis**, implying a change-capture mechanism exists for at least those files (see the audit-log discussion at `SYS-067`).

**Dependencies.** `SYS-064` Report on Data Warehouse Activity (sets `F` automatically). `Data Warehouse Trigger Status` routine (referenced but outside this section). `Data Warehouse Settings` (`CFG-*`). Real-Time Data Warehouse services. End-of-Day export step (`EOD-001`, part A).

**Build notes.**
- See `SYS-064` — replace trigger-based DW feeds with CDC/ELT. If we keep a per-table resync concept, model it as a **queued backfill job with a status and a progress indicator**, not a flag consumed by a nightly batch nobody watches.
- **Never provide `Clear all` on a queue of system-generated repair instructions.** If a manual override of a system-set flag is allowed at all, require a reason and log it.
- `Set all Files` → in our terms, "full rebuild of the analytics store." That should be a deliberate, resource-aware, resumable operation, not a menu item.

---

### `SYS-066` Review Backup Log
*storis_ref: article 15234737083924*

**Purpose.** Displays the history of previous system backups and the detail log for any one of them, including success/failure.

**Where it lives.** `System Administration > System Tools > Review Backup Log`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Grid (initial view) | Read-only | "a grid appears containing the **date and time** of each previous system backup." |
| Backup log detail | Read-only | Opened by **double-clicking a grid row**. "This log provides pertinent details of the system backup, **including whether or not the backup was successful**." |

**Behavior & rules.**
- The article is thin — it documents only that the history exists and that success/failure is visible in the detail.
- **What is conspicuously absent and worth recording as a gap:** no success/failure column in the grid itself (**you must open each backup individually to learn whether it worked**), no filter, no retention statement, no size or duration, **no alerting on failure**, and no restore-test or verification concept anywhere.
- **This, plus `SYS-069` `Run a System Backup`, is the entire backup story in the System Administration section.** Backup monitoring in STORIS is "an administrator remembers to open a screen and double-click rows."

**Dependencies.** `SYS-069` Run a System Backup.

**Build notes.**
- Backups are infrastructure, not an ERP screen. **We should not build a backup module.** Use the database platform's managed backups (PITR + automated snapshots) and monitor them with the same alerting stack as everything else.
- **Non-negotiable requirements regardless of mechanism:** automated verification that a backup completed, **alert on failure to a human channel** (not a screen), documented and *rehearsed* restore procedure with a measured RTO/RPO, and periodic restore tests. STORIS provides none of these; do not inherit the gap.
- If we surface anything in-app, it should be a read-only status tile ("last successful backup: N hours ago") that turns red on staleness — the opposite of a log you must go read.
- `[DECISION NEEDED]` Target RPO and RTO for LA Mattress. This drives the backup/replication design and needs a business answer, not a technical one.

---

### `SYS-067` Review Settings Activity
*storis_ref: article 15234724473876*

**Purpose.** Reports the recorded changes made to the settings routines that were explicitly opted in via the `Track Settings Activity` routine. **This is the read side of STORIS' settings-level audit trail — and the article that settles the contested change-audit question for this handoff.**

**Where it lives.** `System Administration > System Tools > Review Settings Activity`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `File Name` | Code, lookup | "Enter the name of the **routine** whose changes you want to review. If you click on the `Arrow` button, **a list of files selected for auditing appears.**" **The picklist contains only opted-in files — you cannot review what was never tracked.** |
| `Record Key` | Key, lookup | "Enter the record key from the routine for which you want to review editing." Search button lists record keys for the selected routine. |
| `Comment` | Read-only text box | "After you identify a file name and a record key, **all changes made to that record key appear in the Comments box.** You cannot edit the Comments box." |
| `Send Output to` | Read-only (set via `Actions > Output Settings`) | Report destination. |
| `Export Path` | **Inactive** | **"Because the output options for this routine are limited to `Screen` and `Printer`, this field is inactive."** |
| `Actions > Print Comments` | Action | Sends the report to the chosen destination. |

**Behavior & rules — SETTLING THE AUDIT-LOG QUESTION.**

Taking this article together with `SYS-059` (`Purge of Sensitive Data`) and the prior waves' findings, here is what STORIS demonstrably has. **This corrects the wave-1 conclusion that "STORIS has no general change-audit log" — the truthful statement is narrower and more useful:**

**STORIS has no *general* change-audit log. It has four disjoint, partial, and individually defeatable trails:**

| Trail | Covers | Fatal limitation |
|---|---|---|
| `Track Settings Activity` → `Review Settings Activity` (this article) | Changes to **settings routines**, at record-key granularity, as free-text comments | **Opt-in per file** — untracked files have no history at all; **turning tracking off deletes the audit records** (established by a prior agent); **query requires you to know both the file AND the specific record key in advance** — there is no "show me everything that changed yesterday", no "show me everything user X did", no date filter, and no date range field of any kind on this screen |
| `Track Processing Activity` | Field-level before/after, **only across nine transactional files** (Order, PO, AP Bill, Special Order…) | Nine files only; nothing else in the system is covered |
| `STORIS Log` (newly identified, `SYS-059`) | Receives "audit comments" with a **snapshot of criteria** for at least the sensitive-data purge | Scope beyond that one routine is undocumented; no reader UI appears in this section |
| `Customer Activity Log` (newly identified, `SYS-059`) | "pinpoints the specific data that was purged for the customer" | Customer-scoped; scope beyond the purge is undocumented |
| `SAR-024` Report Secured Decryption Activity | Reads of encrypted data | Read-side only |

**Therefore, definitively, the following are NOT auditable in STORIS as documented anywhere in this section:**
- **Who ran any purge** (`SYS-056`, `SYS-057`, `SYS-058`, `SYS-060`) and what it destroyed — **except** the sensitive-data purge (`SYS-059`), which is the one purge that *is* logged.
- **Who bulk-voided orders** via `SYS-062`, and which orders.
- **Who overrode a time-clock entry** (`SYS-051`).
- **Who forcibly logged off a user** (`SYS-061`).
- **Who changed a setting that was never opted into `Track Settings Activity`** — including, critically, **`Extended Security` itself and the retention settings that drive the purges.**
- **Who cleared the Data Warehouse resync flags** (`SYS-065`).
- **Who turned `Track Settings Activity` off** — which deletes the trail.

- **The `Screen`/`Printer`-only output restriction is itself a finding:** the settings audit trail **cannot be exported** to Excel, ASCII, or PRV. It cannot be analysed, diffed, retained outside the system, or fed to a SIEM. An audit trail you can only print is not an audit trail for compliance purposes.
- Change history is stored as **free-text comments**, not structured before/after pairs (contrast `Track Processing Activity`, which does capture field-level before/after). So even where settings *are* tracked, **you get prose, not a diff.**

**Dependencies.** `Track Settings Activity` (the write side / opt-in configuration routine — **not in this section**; a prior agent covered it). `Track Processing Activity`. `STORIS Log`, `Customer Activity Log` (`SYS-059`). `SAR-024`. Directly informs our `RPT-AUDIT` specification.

**Build notes — `RPT-AUDIT` requirements this settles.**
1. **Auditing must be on by default, for everything, and must not be disableable from inside the application.** STORIS' opt-in model plus "turning it off deletes the records" is the exact anti-pattern; an attacker's or a careless admin's first move is to disable it, and doing so erases the evidence of everything before it.
2. **Audit records must be append-only and immutable.** No routine in the product may delete them; retention is enforced by a separate, logged, out-of-band process.
3. **Structured, not prose.** `actor_id`, `acted_as_id` (for impersonation — see `Run as User`), `at`, `entity_type`, `entity_id`, `action`, `before_json`, `after_json`, `scope`, `request_id`, `ip`, `reason`. Free-text comments are unqueryable.
4. **Queryable along every axis, not just `(file, record_key)`:** by actor, by date range, by entity, by action type, by scope. **The absence of a date filter on `Review Settings Activity` is what makes STORIS' trail useless in practice** — you can only answer "what happened to this exact record", never "what happened".
5. **Exportable** (CSV/JSON) and streamable to external log storage. Not screen-and-printer.
6. **Must cover, at minimum, every destructive and privileged action catalogued in this part:** all purges, bulk voids, time-clock overrides, session revocations, permission changes, settings changes (all of them), retention-policy changes, impersonation, and encryption/decryption of sensitive data.
7. **Settings changes are the highest-value target** — especially changes to retention settings, because in STORIS lowering `Maintain History Years` and then running a purge is an untracked two-step path to destroying accounting history (`SYS-057`).

---

### `SYS-068` Right-Click Menus
*storis_ref: article 15234721931156*

**Purpose.** Explains that right-clicking in a STORIS screen surfaces "dynamic escapes" — contextual jumps to related routines. Documentation article about a UI convention, not a screen.

**Where it lives.** No Access path (behavioral documentation).

**Fields** — none.

**Behavior & rules.**
- "Right-click menus provide access to **dynamic escapes**. STORIS comes delivered with many dynamic escapes in various routines. You can use the **`Dynamic Escape Settings`** to modify the default settings."
- **Two hard preconditions for a right-click menu to appear at all:**
  1. **"you must first make a valid entry in the key field (usually the first field in a routine)"** — the context menu is unavailable until the record is identified.
  2. **you must right-click "in an area of the screen where the cursor appears as an arrow"** — i.e. not in an input field.
- **"right-click menus are available only in selected routines"** — coverage is partial and configured, not universal.

**Dependencies.** `Dynamic Escape Settings` (position 21, part A); `Dynamic Tab Settings` (position 22, part A).

**Build notes.** The underlying idea — **configurable contextual navigation between related records** — is genuinely good and worth keeping; the implementation constraints (right-click only, only where the cursor is an arrow, only after the key field is filled, only in selected routines) are artifacts of a 1990s terminal-emulation UI. In our build, contextual actions should be **discoverable** (a visible actions menu on every record), **universal** (every entity gets one), and **permission-filtered** (only show jumps the user may actually perform). Do not hide navigation behind right-click as the sole affordance — it is undiscoverable and inaccessible.

---

### `SYS-069` Run a System Backup
*storis_ref: article 15234737083284*

**Purpose.** Runs a full system backup on demand.

**Where it lives.** `System Administration > System Tools > Run a System Backup`

**Fields** — none documented. The screen is a `Run` button plus prompts.

**Behavior & rules.**
- **The operator procedure, quoted:** "**Be sure the proper tape has been inserted into the tape backup drive**, then click on `Run`." **Backups are to physical tape.** (Cloud customers excepted, below.)
- "The system performs a series of tests, and **if the system passes all the tests**, a prompt appears asking if you want run the system backup." The tests are not enumerated; **behavior on test failure is not documented.**
- **"System backups can take several hours, depending on the size of your data files."**
- **Failure detection is manual:** "When the backup process finishes, **check for error messages**. If error messages appear, contact your system administrator or a STORIS representative." **No automatic alerting.**
- "**We strongly suggest you back up your system data daily.**" — daily backup is a *suggestion*, not enforced.
- **Cloud retention, exact:** "For Cloud customers, STORIS backs up data on servers and **stores it for two weeks before purging the data.**" **A hard two-week backup horizon for cloud customers — no point-in-time recovery beyond 14 days, and no stated PITR granularity within it.**
- **"You can set this program to run automatically as part of the End of Day process."**
  **→ Contribution to `EOD-001`: `Run a System Backup` is an OPTIONAL, configurable End-of-Day step.** This matters for step ordering: if the backup is enabled in EOD, it is a multi-hour step and its position in the sequence determines whether the backup captures pre- or post-EOD state. **The article does not say where in the EOD sequence it falls — part A should determine this from `Generate Daily Reports`; a backup taken *before* the EOD updates is materially less useful than one taken after.**

**Dependencies.** `SYS-066` Review Backup Log. End-of-Day process (`EOD-001`, part A). `SYS-070` Schedule Electronic Updates — note both compete for the same off-peak window.

**Build notes.**
- See `SYS-066`. Managed database backups + PITR, not an application routine, and **not tape**.
- **Two-week retention is too short for an ERP.** Specify a tiered policy (e.g. PITR 7–35 days, daily snapshots 90 days, monthly archives multi-year) driven by the RPO/RTO decision flagged at `SYS-066`.
- **Do not couple backup to the nightly business job.** A multi-hour backup inside the period-close window is a scheduling hazard — if it overruns, close is late; if close overruns, the backup is skipped. Run them independently, with the backup taken from a replica or snapshot so it does not contend with the close.
- Alert on failure automatically; never rely on "check for error messages".

---

### `SYS-070` Schedule Electronic Updates
*storis_ref: article 15234737970964*

**Purpose.** Schedules automatic download and installation of STORIS system updates on a weekly recurring basis, and configures the user-eviction warning sequence that must run first. **Server (on-premise) customers only — not Cloud.**

**Where it lives.** `System Administration > System Tools > Electronic Updates > Schedule Electronic Updates`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Day to Run` | 7 checkboxes (one per weekday) | Days on which to run automatic updates. **"For each day you select, you must use the associated `Time Scheduled` field to enter the time of day at which to run the updates. Otherwise, an error message appears and you must remove the check from any boxes for which you have not entered corresponding times."** |
| `Time Scheduled` | Time, 24-hour, one per selected day | "Enter the time in 24-hour format. For example, for 11:00 PM, enter `'23:00'`." |
| `First Warning` | Number (minutes) | Minutes users have before they must log off. First of three messages. "The message appears on the screen only of users who are logged on to the system **after** you initiate the Automatic Updates process." |
| `Second Warning` | Number (minutes) | Second message; appears to users still logged on after the first warning. |
| `Final Warning` | Number (minutes) | **"The system logs off users still logged on after the time expires."** Last of three. |
| `Automatic History Purge Days` | Number (days) | How long update-import records are kept before purging. Viewable via `Automatic Updates History` in Report Builder. |
| `Max Patch Update Allowed` | Numeric, **up to 6 characters, nullable** | **"the maximum patch number that can be downloaded/installed during the electronic update."** Optional; leave null for no ceiling. **This is a patch-level pin — a real change-control mechanism.** |
| `Contact Name` | Text | User(s) to notify when an update completes. **"If you enter a name in this field, you must also enter their email address in the field below."** |
| `Email Address` | Email | Notification address; **click `Add` to add the pair to the grid** (multiple contacts supported). |
| `Average Automatic Updates Length` | Display-only (minutes) | Average runtime **based on the last seven runs.** |
| `Average End of Month Length` | Display-only (minutes) | **Average EOM runtime, last seven runs.** |
| `Average End of Day Length` | Display-only (minutes) | **Average EOD runtime, last seven runs.** |

**Behavior & rules.**
- **Hard prerequisite:** "**To run automatic updates, all users must be logged off the system.**" STORIS updates require exclusive access — **there is no online/rolling update path.**
- **Exact eviction sequence:**
  1. On initiation, the system checks for logged-on users. **If none, updates proceed immediately.**
  2. If users are on, **the first warning message appears immediately.**
  3. The system then **checks every minute** for users still logged on. **"When the system finds no users logged on, the updates process begins immediately."**
  4. The second and third messages appear after `First Warning` and `Second Warning` minutes respectively.
  5. "**The automatic updates process begins in the number of minutes specified at the `Third Warning` field, provided all users have logged off by then.**" (Note: the field is labelled `Final Warning` but the prose calls it `Third Warning` — **same field, two names in one article.**)
- **⚠️ The forced-eviction rule and its exception — quote it exactly:** "If users are still logged on, **the system may bump the users off the system and proceed with the update. However, if the system senses that the user is performing an important or sensitive task (for example, entering a sales order), the system ABORTS the update process and retries at the next scheduled time.**"
  **This is a major and surprising rule: one salesperson mid-order silently cancels the entire scheduled system update, with no alert, deferring it to the next scheduled slot — potentially a week later.** A busy store can therefore go indefinitely without patches and nobody is told. Note also "**may** bump" — the eviction is not guaranteed even outside sensitive tasks.
- **Platform exception:** "**On UNIX-based servers, users running Automatic Updates do not have permissions that allow them to bump users off the system. Users running Automatic Updates must manually ensure that all users log off.**" **On UNIX the entire automated eviction mechanism does not work.**
- **Cloud customers cannot use this routine at all** — it is explicitly for "'Server' customers (that is, not Cloud customers)."
- Cadence guidance: "**STORIS recommends you update your system once a week**, and perhaps more frequently in the weeks following a new release." Schedule during off-peak hours.
- Update history is stored in the file **`PACKET.LOAD.HISTORY`**, surfaced through `Automatic Updates History` in **Report Builder**, and retained per `Automatic History Purge Days`.
- **OS coordination is required:** "You must coordinate your automatic update schedule with your operating system." (Windows: see linked article, i.e. `SYS-089`; Unix: contact STORIS.)

**Behavior & rules — `EOD-001` contribution.** The three `Average … Length` fields are the most concrete operational data point available anywhere in my range:
- **STORIS tracks the rolling average runtime of the last seven runs of Automatic Updates, End of Month, and End of Day, and surfaces all three on the update-scheduling screen.**
- **The reason they are on *this* screen is scheduling contention: the administrator must fit the update window around EOD and EOM.** This confirms that **EOD, EOM, backups (`SYS-069`), and updates all compete for the same nightly exclusive window**, and that EOM runtime is significant enough to need planning around.
- **→ For `EOD-001`: the end-of-day job is long-running (measured in minutes, averaged over seven runs), requires effectively exclusive system access, and coexists in a nightly window with EOM, the optional system backup, and OS/application updates.**

**Dependencies.** `SYS-011` Automatic Updates Notification Screen (part A, position 11) — receives the list of still-logged-on users **with their telephone extensions (if available)**. `Check and Electronically Install STORIS Updates` (position 12, part A). `Install Software Updates` (position 38, part A). `SYS-074` Set Maximum Update Screen. `SYS-089` Updating Your Operating System for Electronic Updates. `SYS-092` View Downloaded Update List. Report Builder → `Automatic Updates History` → `PACKET.LOAD.HISTORY`. `EOD-001`/EOM (part A). `SYS-069` Run a System Backup.

**Build notes.**
- **We deploy continuously; there is no user-eviction update model.** Do not port any of this. Our updates must be zero-downtime (rolling deploys, backward-compatible migrations, expand/contract schema changes). The entire "log everyone off to patch" architecture is the thing we are escaping.
- **Do keep two ideas:**
  1. **`Max Patch Update Allowed` → a version pin / change-control ceiling.** Environments should be pinnable to a known-good version, with promotion an explicit act. Useful for staged rollout (staging → one store → all stores).
  2. **Rolling average runtime of scheduled jobs, computed over the last N runs, displayed to operators.** This is genuinely good operational hygiene and cheap to build — our job runner should track and expose it, and **alert when a run exceeds its historical average by a threshold** (STORIS displays the average but does not alert on deviation).
- **Never let an in-progress user action silently cancel a scheduled maintenance job with no notification.** If a job must defer, it must alert.
- `[DECISION NEEDED]` Maintenance/deploy window policy for LA Mattress — including whether stores in different time zones require a per-region window. STORIS' single global window will not survive multi-region operation.

---

### `SYS-071` Select and Configure a Vendor for Import
*storis_ref: article 15234720865556*

**Purpose.** Configures, **per vendor**, how that vendor's catalog import behaves — defaults applied to imported products and a set of suppression flags controlling what the import is allowed to overwrite. **This is the per-source import policy record and is directly relevant to `MIG-*`.**

**Where it lives.** Access block is empty in the published article. Reached from the vendor/catalog import flow; siblings are `Create a Catalog Spreadsheet` (position 16) and `Import Data` (position 35), both part A.

**Fields** (the article publishes the field list; per-field descriptions are collapsed/absent — names are exact, and the list appears twice in the source with a small variation, noted below)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Vendor` | Code, lookup | The vendor whose import this configuration governs. |
| `Default Collection` | Code | Collection assigned to imported products lacking one. |
| `Default Product Group` | Code | Product group assigned to imported products lacking one. |
| `WMS Group` | Code | Warehouse-management group assigned on import. |
| `Purchase Status` | Code | Purchase status applied to imported products. **See the hard rule below.** |
| `Do Not Discontinue with Available Stock` | Flag | Suppresses auto-discontinue for products that still have stock on hand. |
| `Do Not Calculate Product Price` | Flag | Import will not compute/overwrite price. |
| `Do Not Perform Final Update` | Flag | **Import runs but does not commit the final update — effectively a dry-run switch.** |
| `Do Not Update Collection Description` | Flag | Protects locally-edited collection descriptions from being overwritten. |
| `Do Not Update Product Description` | Flag | Protects locally-edited product descriptions. (Present in the first field list; absent from the second.) |
| `Do Not Update Product URL` | Flag | Protects locally-set product URLs. |
| `Price Variance %` | Percent | Tolerance threshold for price changes coming from the vendor feed. |
| `Rounded` | Flag/enum | Price rounding behavior. |
| `To $` | Money | Rounding target/increment. |
| `Cost Type` | Enum | Which cost the imported cost populates. |

**Behavior & rules.**
- **Hard cross-field rule, quoted verbatim from the article:** "**NOTE: If a purchase status is chosen, `Do Not Discontinue with Available Stock` must be entered.**" — selecting a `Purchase Status` makes the `Do Not Discontinue with Available Stock` flag mandatory. **This exists to stop a vendor feed from discontinuing products the business still physically has in stock**, which would strand inventory. Register this as a required-if dependency.
- **The five `Do Not Update …` / `Do Not Calculate …` flags together constitute STORIS' field-level "local edits win" policy.** They are the mechanism by which a vendor feed is prevented from clobbering merchandising work. **This is per-vendor and per-field, but only for the five fields listed — every other field the vendor sends overwrites unconditionally.**
- **`Do Not Perform Final Update` is effectively a dry-run flag** and is the closest thing in the import suite to a safe rehearsal mode. Worth confirming with STORIS whether it produces the full error/warning report (`SYS-063`) without committing — **if so, it is the tool to use for cutover rehearsal.**
- `Price Variance %` + `Rounded` + `To $` form a price-acceptance and rounding policy: presumably changes beyond the variance threshold are flagged or rejected, and accepted prices are rounded to the configured increment. **The article does not publish the exact behavior — flag as unresolved; the variance rule is commercially significant and must be confirmed.**
- **The article is published in a degraded state** — the field list is duplicated, with `Do Not Update Product Description` appearing in one copy and not the other, and no per-field descriptions rendered. Field names are reliable; semantics above are inferred from names plus the one published NOTE and are marked as such.

**Dependencies.** Vendor master. `Import Data` / `Import Product Information` (part A). `SYS-063` Report Data Imported Errors and Warnings. `Advanced Product Settings` → `Purchase Status` (also driven by `SYS-060` and `SYS-075`). Collection, Product Group, WMS Group masters. Cost Type / Costing Control Settings. Related articles: `Create a Catalog Spreadsheet`, `Ashley Custom Cost Formula`, `Warehouse/Store Location Settings`, `General Ledger Assigned Account Settings`.

**Build notes — `MIG-*` and ongoing catalog sync.**
- **The per-source, per-field "do not overwrite" policy is the right pattern and we should generalize it**, not copy the five hard-coded flags. Model it as a **field-level ownership map per integration source**: for each field, who wins — `source`, `local`, or `source_unless_locally_modified`. Store `last_modified_by_source` per field so "locally modified" is knowable rather than guessed.
- **Adopt `Do Not Perform Final Update` as a first-class `dry_run` mode on every import**, producing the full validation report without committing. Non-negotiable for cutover rehearsal.
- **Keep the price-variance guard** — a vendor feed that moves a price by 400% because of a decimal error must be stopped, not applied. Make the behavior explicit: variance beyond threshold → reject to the review queue, never silently accept.
- **Keep the discontinue-with-stock interlock.** Never let an external feed discontinue a product with on-hand quantity, reservations, or open orders. Make it unconditional rather than a flag someone can forget.
- `[DECISION NEEDED]` What is the authoritative source of product data at LA Mattress — vendor feeds or our own catalog? The answer determines whether field ownership defaults to `source` or `local`. Recommend `local` wins by default for anything merchandising touches (description, images, price, URL) and `source` wins for physical attributes (dimensions, weight, packaging).

---

### `SYS-072` Select Contract Insurance
*storis_ref: article 15234718086932*

**Purpose.** Adds insurance plans to an installment contract and maintains insurance previously added. **This is a finance/credit routine, not a system-administration one — it appears in this section only because it is reached from the `Installment Contract Load` utility.**

**Where it lives.** "via the `Insurance` Action button in `Installment Contract Load`" (`Installment Contract Load` is position 39, part A).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Grid: Check Box | Boolean per row | "Check the box in this column to **add** this insurance plan, or **remove the check mark to remove** this insurance plan from the contract." |
| Grid: `Amount` | Money, editable | "Click in this column to enter or edit the insurance amount." **The amount is operator-entered per plan, not calculated by the system** — no rate, term, or premium formula is documented. |
| Grid: `Code` | Display-only | Insurance plan code. |
| Grid: `Description` | Display-only | Insurance plan description. |
| `$ ____ Total Insurance` | Display-only, computed | "The total amount of insurance that has been added to the contract displays below the grid." |

**Behavior & rules.**
- **Unchecking a row removes the insurance plan from the contract** — a destructive edit with no confirmation, no effective-date handling, and no documented audit trail on a **financial contract**. For an insurance product on a consumer credit agreement, that is a compliance-relevant gap.
- **Premiums are free-entered.** Nothing validates the amount against the plan, the contract balance, or the term. **No rate table is referenced.**
- No effective date, cancellation date, or refund/rebate handling appears — so mid-term cancellation economics (unearned premium refunds) are not modelled on this screen.

**Dependencies.** `Installment Contract Load` (part A, position 39); `SYS-027` `Enter Payments Applied to a Contract` (part A, position 27) is a sibling in the same contract-loading cluster. Insurance plan master (codes/descriptions). Related: `Reopen a Financed Transaction`.

**Build notes.**
- **This is out of scope for the system-administration rebuild** and belongs to whatever consumer-financing epic LA Mattress runs. Note it in the coverage matrix and route it there.
- If we do build it: premiums must be **calculated from a rate table** (plan × term × amount financed), not typed; plans must carry effective and cancellation dates; removal must be a dated cancellation producing an unearned-premium calculation, never a silent row delete; and **every change must be audited** (`RPT-AUDIT`) because this is a regulated credit product.
- `[DECISION NEEDED]` Does LA Mattress sell credit insurance on installment contracts? If not, drop entirely. If yes, it needs its own compliance review — this screen is nowhere near adequate as a specification.

---

### `SYS-073` Select State Screen
*storis_ref: article 15234718079764*

**Purpose.** Filters a **sales-tax data import** down to the states the business actually operates in, so that a large multi-state tax file loads only the relevant portion.

**Where it lives.** "In the `Import External Data` routine, **when importing tax information, click on `Save`**." (`Import External Data` is position 36, part A.)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `State` | Code, multi-select via Search | "Enter the code of the state whose tax information you want to import into STORIS." Search button lists states; **"you can choose one or more."** **"If you leave this field blank, you select ALL states and thus import everything in the file."** |

**Behavior & rules.**
- **Blank = import everything.** Same dangerous default idiom as `SYS-056` (blank date range = purge everything). **STORIS consistently treats an empty filter as "all", which is fine for an import and catastrophic for a purge — but the UI gives no clue which you are dealing with.**
- **Selection is intersected with file contents, not required to match:** "If your import file contains tax information for one or more of your selected states, the program imports that information into STORIS. **The program ignores states for which no data exists in the import file.**" So selecting a state the file lacks is silently a no-op — **no warning that an expected state was missing.** For a tax import that is a real risk: you believe you loaded CA rates and you did not.
- Guidance: "**as state tax files can be large, STORIS recommends you import data only for states in which you do business.**"

**Dependencies.** `Import External Data` (part A, position 36). `SYS-063` Report Data Imported Errors and Warnings (the run's error report). Tax rate tables / `Individual Zip Codes`. Informs `MIG-*`.

**Build notes.**
- **Sales tax should not be a periodic file import at all.** For LA Mattress, use a tax service (Avalara / TaxJar / Vertex) with real-time rate lookup and nexus management. California district taxes alone change often enough that a manually-imported rate file is a compliance liability.
- If any rate import survives: **selecting a state that yields zero rows must be an error, not a silent skip**, and the run must report per-state row counts loaded. **Blank must mean "nothing selected", not "everything".**
- Rates must be **effective-dated** and historical rates retained, so that a reprint or credit of an old invoice uses the rate in force on the original date. Nothing here suggests STORIS versions rates by effective date — **flag as an open question for the tax epic.**
- `[DECISION NEEDED]` Tax engine vs. in-house rate tables. Recommend a tax service; the build cost of correct multi-jurisdiction tax is not worth owning.

---

### `SYS-074` Set Maximum Update Screen
*storis_ref: article 15234736539540*

**Purpose.** Sets a ceiling on which STORIS updates are offered for installation — a manual version pin for the interactive update routine.

**Where it lives.** `Actions` button in the `Check and Electronically Install STORIS Updates` routine (position 12, part A).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Enter Update Number` | Number | "Enter the number of the most recent update you want to include in your list of updates. **The list of updates includes all available updates up to and including the update you specify here, and excludes all others.** The most recent available update appears, but you can override the default." |

**Behavior & rules.**
- **Defaults to the newest available update** — i.e. the default behavior is "install everything", and pinning is an opt-out.
- Semantics are **inclusive** of the specified update number.
- This is the interactive twin of `SYS-070`'s `Max Patch Update Allowed` (which pins the *scheduled* updater). **Two separate ceilings for the same concept, on two different screens, with no indication that they are kept in sync — a genuine configuration-drift hazard.** An administrator could pin the scheduled updater at patch N and then manually install past it here.

**Dependencies.** `Check and Electronically Install STORIS Updates` (part A, position 12). `SYS-070` Schedule Electronic Updates → `Max Patch Update Allowed`. `SYS-092` View Downloaded Update List.

**Build notes.** The concept — **a pinned, promotable version per environment** — is worth keeping (see `SYS-070`). The lesson from having two of them is: **one authoritative version-pin per environment, one place to change it, and the change is audited.** Never let the same policy be expressible in two screens.

---

### `SYS-075` Set Product Purchase Status by Region
*storis_ref: article 15234738565396*

**Purpose.** Mass-assigns a **purchase status** to products **for a whole region at once**, controlling how those products may be sold at locations in that region (notably whether they can be back-ordered).

**Where it lives.** `System Administration > System Tools > Set Product Status by Region` (**note: the menu path says "Set Product Status by Region"; the article title says "Set Product Purchase Status by Region" — labels differ again**).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Region` | Code, lookup | The region to mass-assign for. Search button lists regions. |
| `Purchase Status` | Code, dropdown | The status assigned "so that when they appear on line items originating from the region selected above, the system uses this purchase status for the items." |

**Behavior & rules.**
- **Hard prerequisite:** "**To access this routine, `Regional Processing` must be active.**" Another global feature flag gating a routine (cf. `Extended Security`, Third-Party Accounting, Multi-Company, Real-Time Data Warehouse). **STORIS is riddled with these global on/off switches that silently change what exists.**
- **Blast radius, quoted:** "The program assigns the selected status to **all products** via the `Purchase Status` field on the **`Regional` tab in `District and Regional Product Settings`**." **There is no product, category, or vendor filter on this screen — it is region-wide, all products, unconditionally.**
- **⚠️ Destructive overwrite with no preview or undo:** "**If a purchase status has already been assigned to the product for the selected region, this program overwrites the status with the new status.**" **Any per-product regional exceptions previously set by merchandising are silently destroyed. No confirmation, no count, no backup, and — per `SYS-067` — no audit record unless `District and Regional Product Settings` happens to be opted into `Track Settings Activity`.**
- **Worked business example from the article** (useful — it shows the intended use):
  > "assume you have a location you designate as your **'clearing center'**. You do not want users entering back-ordered items at such a location. If you (a) create a region containing only the clearing center, and (b) in this routine specify the clearing center region and assign a status of **`Dropped`** to your products, then when a product appears on a sales order created at the clearing center location, **the system makes sure stock exists before allowing the line item entry.**"
  → **`Dropped` is a confirmed `Purchase Status` enum value, and its effect is: sale is permitted only if stock exists — no back-ordering.**
- Purchase status therefore participates in **order-entry validation**, not just purchasing — it is an availability policy, resolved at the region scope.
- Cross-reference note in the article: "For information on STORIS's pricing hierarchy, consult the `Costing and Pricing Rules`."

**Dependencies.** `Regional Processing` global flag. `District and Regional Product Settings` → `Regional` tab → `Purchase Status` (`CFG-*`). `Advanced Product Settings` → `Purchase Status` (the product-level setting; see `SYS-060`, `SYS-071`). Sales order line-item entry validation. Purchase status code table. **Scope resolver: this confirms `REGION` as a settings scope for `Purchase Status`, alongside the product level** — relevant to the scope list in the wave-1 notes (`COMPANY`, `VENDOR_REMIT_TO`, `VENDOR_REGION`, `TERMS_CODE`, `PRODUCT_CATEGORY`) — **add `REGION` and `DISTRICT`.**

**Build notes.**
- **The underlying model is sound and we already have it:** `Purchase Status` is a scoped setting resolved most-specific-scope-wins (product × region), which is exactly the resolver design we chose over STORIS' copy-down. **We get this for free — we do not need a "mass assign" routine at all**, because setting the value at the region scope in our model *is* the region-wide assignment, and it does **not** destroy product-level overrides. Record this as a concrete win for the live-resolution design.
- If we ever do build a bulk-assign tool: mandatory preview with affected count, a filter (category/vendor/product), preservation-or-explicit-overwrite choice for existing overrides, and a full audit entry listing what changed.
- **Keep the `Dropped`-style semantic**: an availability policy that forbids back-order at a given location. Make it an explicit enum on the availability policy (`allow_backorder: true|false`) rather than overloading a "purchase status" code.
- `[DECISION NEEDED]` Confirm the full `Purchase Status` enum from part A / the product settings parts — only `Dropped` and `Obsolete`/`discontinued` are confirmed so far across `SYS-060` and this article.

---

### `SYS-076` Set Up Menus
*storis_ref: article 15234722295828*

**Purpose.** Launches the **STORIS Menu Builder**, a separate Windows application for creating and editing the menu trees that give users access to routines. **Menus are the primary navigation-level access control in STORIS: a menu is bound to a user group, and users see only their group's menu.**

**Where it lives.** `System Administration > System Settings > System Permissions > Set Up Menus`

**Fields / UI structure.** The Menu Builder has **three panes**:

| Pane | Contents |
|---|---|
| `STORIS Menu Builder Toolbar` | Editing options — `Copy`, `Delete`, `New`, `Save`, `Menu Selection`, `Expand All`/`Collapse All`, `Move Item Up`/`Move Item Down`, `Cut`/`Copy`/`Paste`/`Delete Item`, `Export Menu`, `View All Paths`, `Copy Path`. |
| `Menu Tree` | The structure of the selected menu; expandable/collapsible; loads fully collapsed. |
| `Program List` | All programs in the system, filterable/groupable/sortable "similar to the options available in the Personal Report Viewer (PRV)"; drag-and-drop onto the Menu Tree. |

**`Program List` columns (exact)**

| Column | Meaning |
|---|---|
| `Program Shortcut` | "initially displays the STORIS standard name for each item, but you can edit this name." |
| `Program Type` | Enum: **`Entry`, `Inquiry`, `Report`, `Form Print`.** |
| `Program Family` | e.g. **`Sales Order`, `Purchase Order`, `Report Builder`, `DTS`**, etc. |
| `FastKey` | **"This feature is not available in the current release."** (Yet `Menu Fastkeys` are referenced as specifiable in the Menu Tree pane description — **the article contradicts itself on whether FastKeys work.**) |
| `Program ID` | "displays actual STORIS program name." |
| `ID` | "the internal number STORIS uses to identify the routine within the menu system." |

**Behavior & rules.**
- **Authentication gate:** "When you click on this option, the **`User Authentication` window** appears, providing a layer of security protecting your menu system from unauthorized users." **A second, separate authentication step beyond being logged in** — a re-auth for a privileged tool. (Worth noting as one of the few genuinely good security patterns in this section.)
- **The binding rule, and it is a hard one:** "**You must associate a user group with each menu you create, and each user group can have only one menu associated with it.**" → **strict 1:1 between user group and menu.** The `New Menu` window lists only user groups **to which no menu has been associated**; "**If no user groups appear, you must create one before you can create a new menu.**"
- **Standard menus are immutable:** "STORIS comes delivered with several standard menus… including the **`STORIS Business Menu`** [all options, organized generically] … Other standard menus have been designed for specific employee types. For example, the **`Service Staff`** menu…" — "**You cannot edit standard menus. However, you can use them as-is or you can clone them and edit the clones.**" In the `Menu Selection` list, "**If a check appears in either the `Read-Only` or `STORIS Standard` columns for a menu, you can view but not edit that menu.**"
- **Creation paths:** select an unassigned user group, then either `Copy From Existing Menu` (must click that option first, then pick a source menu) or `Empty Menu`; then `Create New Menu`. **"The new menu appears in the Menu Tree, adopting the name of the user group."**
- **Two node types:** `menu options` (containers → sub-menus/shortcuts) and `program shortcuts` (leaf → a STORIS routine). Any number of levels and shortcuts. **"You can add a sub-menu only if a menu item is selected. If a program shortcut is selected, the `Add Sub-Menu` option is disabled."**
- **Global rename side effect — flag this:** "**If you edit a program shortcut name in the menu tree, the application automatically updates ALL program shortcuts with the same program ID throughout the tree, as well as the associated item in the Program List.**" **Renaming one menu entry renames every occurrence everywhere, including the master Program List.** There is no way to give the same routine two different labels in two places, and an innocuous-looking rename has system-wide effect.
- Moving items: `Move Item Up`/`Move Item Down` work **within the same hierarchy level only**; changing level requires `Cut` and `Paste`.
- Copy semantics: "If you copy a menu option and paste it to another menu option, **any sub-menus and program shortcuts associated with the selected menu option copy and paste as well.**"
- Unsaved-changes guard: "Once you edit a menu, you activate the `Save` option and if you attempt to exit or load another menu, a message appears and you must decide whether to save or abandon your changes."
- `Export Menu` destinations: **`Print Preview`, `HTML`, `PDF`.** (Useful — the menu structure is exportable, which makes an access review at least possible.)
- `View All Paths` shows every menu path to a selected routine; `Copy Path` copies them to the clipboard. **This is the tool for answering "how many ways can a user reach this routine?" — important for access review.**
- **Multi-lingual constraints (two distinct rules):**
  1. Creating: "the `New Menu` window lists **only those user groups whose language (specified at the `Language Code` field in the User Group file) matches the language associated with the STORIS Login ID** used to access the Menu Builder."
  2. Editing: "the language that displays on the screen is determined by the `Language Code` field in the User file (or the User Group file)… **if your language is French, you can access only menus that have been translated into French.**"
- **Identity subtlety worth recording:** "**the ID you use to access the Menu Builder (that is, your STORIS Login ID — see the Help for the `Logon ID` field on the `Security` tab in the User file) is not necessarily the same as the User ID you enter at the `User Log In` window.**" **STORIS has two distinct user identifiers per person — a `Logon ID` and a `User ID` — and they can differ.** Combined with the established `Run as User` impersonation finding, **this makes "who did this?" genuinely ambiguous in STORIS.** Our audit records must capture a single canonical `user_id` plus `acted_as` and never rely on a login string.
- Related pointer: "To give users quick access to routines they frequently use, use the **`Quick Launch Menu`**."

**Dependencies.** User Group file (**1:1 menu binding**; `Language Code`). User file → `Security` tab → `Logon ID`, `Language Code`. `SYS-090` User Defined Menu Description. `SYS-009` Assign Screen Action Permission (part A, position 9). `Quick Launch Menu`. Multi-Lingual Processing (`SYS-049`, `SYS-050`, `SYS-081`–`SYS-086`). The 355-flag permission catalog in `parts/user-security-CATALOG.md`. Related articles: `Create a User`, `General Ledger User Permissions`, `Special Character Settings`.

**Build notes.**
- **This is the second, parallel access-control system in STORIS and it must not be reproduced.** Access is determined by (a) which menu your group is bound to — i.e. what you can *see* — and (b) the 355 permission flags — i.e. what you are *allowed* to do, all inert unless `Extended Security` is on. **Two mechanisms that can disagree.** Hiding a routine from a menu is not access control: anything reachable by another path (a right-click dynamic escape, `SYS-068`; a drill-down; a URL) bypasses it.
- **Our model: permissions are the single source of truth; navigation is derived from permissions.** Build the menu automatically from what the user may do. That eliminates the 1:1 group↔menu constraint, the "clone the standard menu" workflow, drift between menu and permission, and the whole Menu Builder as a separate application.
- **Do keep three things:** (1) the **re-authentication gate** on privileged administrative tools; (2) **`View All Paths`** — we need an equivalent "who can reach this capability, and how" access-review report; (3) **export of the effective access model** (STORIS' HTML/PDF menu export) — ours should export effective permissions per user/role as CSV/JSON for audit.
- **Never implement rename-by-identity** (edit one label → all instances change). Labels are presentation; store them per placement, or better, derive them from a single canonical capability name that nobody edits ad hoc.
- Resolve the dual-identifier problem: **one immutable internal user id**, with login handles as mutable attributes. Never key audit or permissions on a login string.
- `[DECISION NEEDED]` Confirm with the security workstream that we are formally abandoning menu-based access control. It has UX consequences (STORIS admins are used to curating menus per role) that should be communicated, not discovered.

---

### `SYS-077` Set Up Terminal Server for a Printer
*storis_ref: article 15234724474388* *(alternate title: "Term Server/Printer Setup")*

**Purpose.** Configures the physical printing infrastructure: registers a **terminal server** (IP + hostname + port count) with the UNIX host, then attaches printers to its ports or creates UNIX print queues.

**Where it lives.** `System Administration > Print System Settings > Set Up Terminal Server for a Printer`

**Fields / prompts** — this is a **character-mode prompt sequence**, not a form.

**Part 1 — Terminal Server Setup** (`Install a Terminal Server on AIX or SCO` → `Run`)

| Prompt | Purpose / business rule |
|---|---|
| Terminal server type | Exact menu: **`Systech`, `Digi Port Server`, `IBM 7318 S20`, `Lantronix`, `Xyplex 416`, `other TERMINAL SERVER not listed`, `Exit`.** |
| `IP address` | "The IP address enables the terminal server to communicate with the main UNIX server required by the STORIS system." |
| `Host name` | Terminal server hostname. |
| Number of available ports | Total ports on that server. |
| Confirmation | **"enter `Y` to complete the terminal server setup. To abort the process, enter `N`."** |

**Part 2 — Printer Setup O/S** (`Add a Printer or UNIX Queue on AIX or SCO`)
Options: `Adding a printer on an existing TERMINAL SERVER`, `Adding a UNIX QUEUE`, `Exit`.

*Option 1 — printer on an existing terminal server:*

| Prompt | Purpose / business rule |
|---|---|
| `IP address` | Of the terminal server. **"if you enter a question mark (`?`), a file displays that you can use to resolve a hostname into an IP address. To abort the process, enter `q`."** |
| (system response) | Displays available port count and the configured terminal-server type at that address. |
| Printer name, Port number | Assigns the printer to a port. |
| Confirmation | `Y` to confirm, `N` to abort. |

*Option 2 — UNIX printer, **AIX**:*

| Prompt | Purpose / business rule |
|---|---|
| Printer name | e.g. `lp100`, `lp200`. |
| UNIX Queue name | e.g. `f0`. |
| **"Is this Queue for CHECKS, AP CHECK REGISTER or BARCODE LABELS?"** | `(Y)es`/`(N)o`. **A queue is flagged for these three sensitive/special output types — checks and check registers are financial instruments, so this is effectively a security-relevant printer designation.** |
| Confirmation | "An entry of `(Y)es` completes the setup of a UNIX printer. An entry of `(N)o` **aborts the entire process**." |

*Option 2 — UNIX printer, **SCO*** (different sequence; `Remote Printing Configuration` window):

| Prompt | Purpose / business rule |
|---|---|
| Printer name | **Strict positional naming convention: `lp1_14` → prefix `lp1` = line printer #1; suffix `14` = terminal-server port #14. `lp2_15` = line printer #2 on port #15.** (Article renders it inconsistently as `"lpl_l4"` and `"lp1_14"` — the intent is `lp<N>_<port>`.) |
| `Is {printer name} a remote printer or a local printer (r/l)?` | **"Enter `R`. That is, Systech printers and terminal server printers are attached via the network to the STORIS system, so they are ALWAYS remote."** |
| `Please enter the name of the remote host that {host name} is attached to:` | Remote host name (e.g. `systech1`) or its IP (e.g. `190.190.190.12`). |
| Confirmation | `Y` if satisfied. |
| "extended RLP protocol should be turned on?" | **"enter `N`. STORIS does not use this protocol."** |
| "would you like this to be the system default printer?" | **"enter `N`."** |

**Behavior & rules.**
- **The entire printing subsystem assumes a UNIX host (AIX or SCO) with serial/network terminal servers.** This is 1990s infrastructure documented as current.
- Ordering dependency: **the terminal server must exist before a printer can be assigned to it**; "After you set up a terminal server, you can assign a printer to it, **making that printer available for use within the STORIS system.**"
- **Aborting mid-sequence discards everything** ("`(N)o` aborts the entire process") — no partial save, no resume.
- **No validation of IP reachability, port availability, or printer existence is described** — misconfiguration is only discovered when printing fails.

**Dependencies.** `SYS-080` Synchronize OS to STORIS Printers (**must be run after printer/form changes**). Printer Settings and Form Settings files. `SYS-019` Cycle Module Multi-Print Assignment Screen (part A, position 19). `SYS-007`/`SYS-008` Assign Daily/Monthly Reports Print Destination (part A). Related: `SCiX Version Guide`.

**Build notes.**
- **Do not build any of this.** Printing in our system is: render a PDF, hand it to the browser or to a print service (e.g. PrintNode / CUPS via a small agent) keyed by a logical printer name. Physical transport is the OS's problem, not the ERP's.
- **Keep exactly one concept from here: the logical designation of special-purpose print queues.** The AIX prompt "Is this Queue for CHECKS, AP CHECK REGISTER or BARCODE LABELS?" encodes a real business need — **check stock and barcode-label stock live in specific physical printers and must never receive ordinary output.** Model that as a typed `printer_role` enum (`CHECK`, `CHECK_REGISTER`, `LABEL`, `DOCUMENT`, `RECEIPT`) with routing rules, and **restrict who may print to `CHECK` roles** (audit it — check printing is a fraud vector).
- Register printer configuration changes as audit-worthy (`RPT-AUDIT`): repointing the check printer is a security event.

---

### `SYS-078` Shift4 Cloud Credit Card Processing Overview
*storis_ref: article 47806055334548*

**Purpose.** End-to-end configuration guide for **Shift4 Cloud** card processing, spanning three separate systems: the **ERP**, **STORIS NextGen** (the modern web workspace), and the **STORIS API Admin**. This is the current-generation payments integration; `SYS-079` covers the legacy path.

**Where it lives.** Multiple locations across three products — see each step below.

**Fields — ERP side**

| Field | Where | Purpose / business rule |
|---|---|---|
| `Credit Card Gateway` module | `General System Control Settings` → **`Licensing`** section | **Must be licensed and active on the account.** "If you are not licensed for `Credit Card Gateway`, contact your STORIS representative." **A licensing flag gates a core business capability** — same pattern as `Extended Security` and `Regional Processing`. |
| `EMV Enabled – NextGen` | `Warehouse/Store Location Settings` | **Per-location flag** — "control[s] whether users can take credit card payments in NextGen during checkout." |
| `EMV Provider` | `Warehouse/Store Location Settings` | **Set to `Credit Card Gateway`, NOT `Shift4`.** The article is emphatic: "**select 'Credit Card Gateway' in the `EMV Provider` field, not Shift4; that option is used to configure the legacy Shift4 UTG server.**" |
| `Card Type` | `Credit Card Payment Settings` | Select the card type associated with this payment type for Shift4 Cloud processing. |
| `Card Type` | `Debit Card Payment Settings` | "You also need to make this change in the `Debit Card Payment Settings` **if you support debit cards as a payment type.**" |

**⚠️ Hard, destructive rule — quoted:**
> "**When you change the `EMV Provider` dropdown to `Credit Card Gateway`, any previous credit card processing will not work at this location. Only make this change when you are ready to completely switch over to Shift4 credit card processing.**"

**This is a one-way, immediate cutover switch on a live payment path, on a per-location dropdown, with no staged rollout, no dual-run, and no warning dialog described. Changing one field stops card payments at that store.** This is the single highest-risk setting in my range.

**Fields — STORIS NextGen Admin app** (`Integrations` page under the `Payment` heading)

| Field | Where | Purpose / business rule |
|---|---|---|
| `Add payment processor` → processor | `Payment Processors` | Choose **`Shift4`** from the dropdown. |
| `Shift4 Account Type` | Payment processor | Enum: **`Test`** or **`Live`**. |
| Location (`+ADD`) → STORIS location | `Locations` | Select the STORIS location from the dropdown. |
| `Shift4 Authorization Token` | Location | **A per-location secret entered into a settings form.** |
| `Customer Signature Required` | Location | "require customers to sign on Shift4 Cloud terminals at this location after a successful card authorization." |
| `Minimum Sale Amount` | Location | "the minimum sale amount that requires a signature. **This field is required when the `Customer Signature Required` field is activated.**" |
| `Enable Location` toggle | Location Details | **Must be active** to enable Shift4 cloud processing at that location. |
| Terminal: `STORIS Terminal Name` | Location Details → Terminal Devices (`+ADD`) | Logical terminal name. |
| Terminal: `Terminal ID` | Terminal Devices | Device identifier. |
| Terminal: `Terminal Brand` | Terminal Devices | Dropdown. |
| Terminal: `Signature Capable` | Terminal Devices | "Activate this setting if the Shift4 device can capture customer signatures." |
| Terminal actions | Terminal Devices | Actions button allows **edit or delete** of a terminal. |

**Fields — STORIS API Admin**

| Field | Purpose / business rule |
|---|---|
| `Active` flag | "The actual API admin must be active. This should be set when the API admin instance is set up." |
| `MVIS Account Name` | "the identifier for the account configured in MVIS. **STORIS sets it up and populates it.**" |
| `NextGen Account Workspace` | "the workspace name is the first part of the NextGen URL. For example, the workspace name for `https://support123.cxm.storis.app/` would be `support123`." |
| `Authenticate For Integrations` | "You must authenticate this API admin instance for integrations. Click the button to authenticate. If successful, you will see the message **'This account has been authenticated'**." |

**Behavior & rules.**
- **"An API instance must be configured for the client to pull the terminal information for Shift4 into the ERP. Your STORIS team will typically set this up during implementation."** — **the terminal roster is pulled from NextGen into the ERP over the API**; terminals are defined in one system and consumed in another.
- **Configuration is spread across three products with no single view of whether payments are correctly configured for a location.** To enable one store you must touch: ERP licensing, ERP location settings (2 fields), ERP credit card settings, ERP debit card settings, NextGen payment processor, NextGen location + token, NextGen enable toggle, NextGen terminals, and API Admin (4 fields). **Nine-plus touchpoints across three systems, any one of which silently breaks checkout.**
- **A `Test`/`Live` account type exists — good — but nothing described prevents a `Test` processor being configured against a live location, or shows which mode a location is in at the point of sale.**

**Dependencies.** `General System Control Settings` → `Licensing` (**note: this is the same settings screen that holds the `Extended Security` global kill-switch — reuse that `CFG-*` reference**). `Warehouse/Store Location Settings` (`EMV Enabled – NextGen`, `EMV Provider`). `Credit Card Payment Settings`, `Debit Card Payment Settings` (`CFG-POS-*`). `Payment Card and Device Settings` (see `SYS-059`, `SYS-079`). STORIS NextGen Admin. STORIS API Admin / MVIS. `SYS-079` Shift4 Shared Token Load (legacy UTG path).

**Build notes.**
- **We should be PCI-scope-minimal: tokenized, processor-hosted card entry, no PAN in our database, ever.** That is consistent with what Shift4 Cloud does, and it is what makes `SYS-059`'s Credit Card purge unnecessary.
- **Consolidate configuration into one place.** A single `payment_configuration` per location — processor, mode (`test`/`live`), credentials reference, terminals, signature policy — with a **readiness check** that validates the whole chain and reports "location X is ready / not ready and why". The nine-touchpoint sprawl is the defect to fix.
- **Never store a processor authorization token in a plain settings field.** Secrets go in a secret manager, referenced by id; the UI shows only a masked value and a "last rotated" date.
- **Never build a one-field switch that silently disables payment acceptance at a store.** Provider changes must be a guarded workflow: confirm, show impact ("card payments at Store 12 will stop until the new provider is verified"), require a successful test transaction before going live, and support rollback.
- **`Test`/`Live` mode must be visually unmistakable at the point of sale** and must be impossible to combine with real orders.
- Signature policy (`Customer Signature Required` + `Minimum Sale Amount`) is a legitimate per-location business rule — keep it, keep the required-if dependency.
- `[DECISION NEEDED]` Which processor does LA Mattress use, and is the terminal fleet EMV cloud-connected or semi-integrated? This determines whether we need a device-management concept at all.

---

### `SYS-079` Shift4 Shared Token Load
*storis_ref: article 15234725686036*

**Purpose.** Back-loads previously issued Shift4 card tokens into the shared-token store so that a customer's saved card can be reused **across all selling locations** rather than only where it was first used. A one-time backfill utility.

**Where it lives.** `System Administration > System Settings > Companion Application System Settings > Credit Card System Settings > Shift4 Shared Token Load`

**⚠️ Scope:** "**This process is only used in conjunction with the Legacy Shift4 UTG configuration.**" — i.e. the pre-Cloud path (`SYS-078`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Start Date` | Date | **Defaulted from `Token Retention Days` in `Payment Card and Device Settings`.** Exact example: "if `Token Retention Days` is set to `30` and the current date is `12/01/2017`, the `Start Date` defaults to `11/01/2017`." **"You cannot choose a date earlier than the defaulted start date or later than the current date."** — the date is bounded on both ends. |
| `Run` | Action | Starts the load. "A status bar is presented and you also have the ability to cancel the process." |

**Behavior & rules.**
- **Load window:** "When the load process is run, tokens obtained **from the start date through the current date** are loaded."
- **⭐ IDEMPOTENCY — the only routine in my entire range that explicitly states it, quoted exactly:**
  > "**Note that if you choose to cancel the process, any tokens that have already been loaded remain. This process can be re-run without any detrimental effects; however, it should only need to be run once to completion to accomplish its goal.**"
  **This is a documented safe-to-re-run, resumable, partial-progress-preserving job.** It is the model the rest of STORIS' import/conversion utilities do *not* follow — and the explicit contrast is itself evidence that **the other import routines should be assumed NOT idempotent** (see `SYS-063`, `MIG-*`).
- **Access prerequisite:** "In order to gain access to this process, **the `Shift4` module must be active on the system.**" (Another module/licensing gate.)
- **Exact rule set governing whether shared tokens are updated at all** — six rules, all hard:
  1. "**The `Token Sharing Active` field in `Payment Card and Device Settings` must be enabled; otherwise shared tokens are not updated.**"
  2. "**There must be a customer number present** in order to update shared tokens." (Anonymous/cash-and-carry sales produce no shared token.)
  3. "**If the transaction was not approved, the shared tokens are not updated.**"
  4. "**Tokens from eCommerce transactions are not stored.**"
  5. "**Debit cards are not stored.**"
  6. "**If voiding a transaction, tokens are not updated.**"
- Mechanism during normal operation: "if `Token Sharing` is active, STORIS records the token received from Shift4 (and other pertinent data) in the database **so that the consumer can reuse the card information for additional transactions**."

**Dependencies.** `Payment Card and Device Settings` → `Token Sharing Active`, `Token Retention Days` (`CFG-POS-*`; the same settings screen carries `Retain Settled Card Number for NN Days` from `SYS-059`). `Shift4` module licensing. Customer master (customer number required). `SYS-078` Shift4 Cloud (the successor path). `SYS-059` Purge of Sensitive Data (token/card retention interacts with the purge).

**Build notes.**
- **Adopt this routine's job contract as the standard for every long-running job we build**, and say so explicitly in the spec: cancellable, progress-reporting, partial work preserved, **safe to re-run**, bounded input range with validated min/max. It is the one genuinely well-designed utility in this section.
- **Card-on-file across locations is a real business requirement** (a customer buying at one store, servicing at another) — keep it. But it is also a consent question: **storing a reusable token is storing a payment credential.** Requirements: explicit customer consent captured and dated, a customer-visible list of saved cards, self-service removal, and automatic expiry per `Token Retention Days`.
- **Keep rules 2–6 as hard constraints** — they are sound: no token without an identified customer, no token from a declined or voided transaction, no debit tokens, no e-commerce tokens crossing into in-store reuse. Rule 3 and 6 in particular prevent phantom credentials.
- **Rule 1 is another global kill-switch** (`Token Sharing Active`) with the same defect pattern as `Extended Security`: a single flag that silently makes a whole subsystem inert. **Our equivalent must at minimum surface its state prominently wherever it has an effect.**
- `[DECISION NEEDED]` Does LA Mattress want card-on-file at all? If yes, it needs a consent/UX review, not just a technical one.

---

### `SYS-080` Synchronize OS to STORIS Printers
*storis_ref: article 15234737966100*

**Purpose.** Re-initializes the printing configuration so that the operating system's printers and STORIS' `Printer Settings` / `Form Settings` agree. It must be run after any change to those files.

**Where it lives.** `System Administration > Print System Settings > Synchronize OS to STORIS Printers`

**Fields** — **none. There is no screen at all.** "When you click on the menu option for this routine, **the program executes automatically**. That is, you do not access a routine and make field selections from the screen."

**Behavior & rules.**
- **Hard rule, capitalised in the source:** "**Important! You MUST run this program each time you modify one of the above files.**" — i.e. after every change to **Printer Settings** or **Form Settings**.
- **Ordering rule:** "**If you modify both the Printer File and Form File, complete your maintenance of each file before you run this program.**" (Finish all edits, then sync once.)
- **This is a manual cache-invalidation step that the operator must remember.** Nothing prompts for it, nothing detects that it is needed, and nothing indicates whether it has been run since the last edit. **Forgetting it means printer/form changes silently do not take effect — a classic stale-configuration bug promoted to documented procedure.**
- The article notes a documentation artifact: because there is no screen, "**you cannot access this Help topic from a routine screen**" — it is reachable only from the Help table of contents or index. (Mentioned because it shows how invisible this step is to an operator.)
- **No feedback is documented** — no success message, no error report, no indication of what was synchronized.

**Dependencies.** Printer Settings file; Form Settings file; `SYS-077` Set Up Terminal Server for a Printer. Related: `SCiX Version Guide`.

**Build notes.**
- **Never require a human to remember a cache-invalidation step.** Configuration changes must take effect on save — invalidate caches in the same transaction, or version the configuration and have consumers read the current version. If a reload genuinely cannot be synchronous, the system must detect the pending state and either apply it automatically or display an unmissable "configuration changed — N changes pending" banner with a one-click apply.
- If we expose any "reinitialize" action at all, it must report what it did and confirm success. A destructive-or-not action with zero feedback is unacceptable.
- **Generalize the lesson:** audit our own design for any other "you must remember to run X after Y" couplings and eliminate them.

---

## The `Translate *` cluster (`SYS-081` – `SYS-085`)

These five routines are near-identical siblings under `System Administration > System Tools > Translation Tools`. **Every one of them has the same core contract**, stated verbatim in each article:

> "export a STORIS source file to an Excel® spreadsheet to create an English-language version of the source file, **or** import a spreadsheet with a foreign-language version of the source file **to overwrite the existing source file**."

**Shared fields present in all five:**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Direction` | Enum, exactly 3 values: **`No Selection Made`**, **`Export From STORIS to Excel`**, **`Import From Excel to STORIS`** | **Defaults to `No Selection Made`, forcing an explicit choice.** |
| *(a domain-specific "all vs. untranslated" radio box)* | Radio | **"To access this field, you must select `Export` at the `Direction` field."** Chooses between exporting *all* items or *only un-translated* items. |
| `Foreign Lang` / `Foreign Language` | Code, lookup | "the code of the language to which you want to translate descriptions"; Arrow button lists **"languages available to you"**. |
| `Send Output to` | Set via `Actions > Output Settings` | Output destination. |
| `Export Path` | Set via `Actions > Output Settings` | "the computer path (drive, folder, file name) to which the report output will be sent." |

**Shared hard rules (apply to all five — stated once here rather than repeated):**
- **Import is a blind overwrite of the source file.** No merge, no diff, no preview, no versioning, and **no undo** is documented for any of the five. A bad spreadsheet replaces the live text.
- The `Export` → *only un-translated* option is the sole incremental-workflow affordance; there is no notion of translation status, reviewer, or approval.
- Round-tripping goes through **Excel and a filesystem path** — see `SYS-050` on the font requirement and `SYS-086` for the strict spreadsheet-integrity rules that govern the file itself.
- **No permission is mentioned on any of the five.** These routines rewrite system-wide UI text; per the wave-1 finding, whatever permission does gate them is inert unless `Extended Security` is on.

**Shared build note (applies to all five):** we replace this entire cluster with a standard i18n pipeline — message catalogs (ICU MessageFormat) in version control, keys referenced from code, translations managed in a TMS or PR workflow, **per-user locale** (not a global system language), and no Excel round-trip. **What is genuinely worth carrying over is the notion of translatable *domains* (`SYS-086`) and the placeholder/line-break conventions**, both covered under `SYS-086`.

---

### `SYS-081` Translate Bubble Help
*storis_ref: article 15234737321236*

**Purpose.** Translates the source file for **bubble help** (field-level tooltips) to or from a foreign language.

**Where it lives.** `System Administration > System Tools > Translation Tools > Translate Bubble Help`

**Fields** — the shared set above, plus:

| Field | Type | Purpose / business rule |
|---|---|---|
| `Module` | Code, dropdown | "the code of the module whose bubble help you want to translate to another language." **Scoped per module, not system-wide.** |
| `Bubble Help` | Radio (the domain-specific radio) | All bubble help vs. only un-translated bubble help. Export-only. |

**Behavior & rules.** Definition given in the article: "**Bubble help appears (if available) when you hover your mouse over a field. A caption appears with a brief explanation of the field.**" Note "**(if available)**" — **coverage is incomplete; not every field has help.**

**Dependencies.** Module code table. `SYS-086` Translation Tool (`HLP Help` domain covers the same content — **two routines edit the same data**). Multi-Lingual Processing.

**Build notes.** Field-level help should be part of the component definition and versioned with the code, not a separately-translated file that can drift from the UI. **Translating help text through a different routine than the screen text it describes guarantees they fall out of sync.**

---

### `SYS-082` Translate Dynamic Searches
*storis_ref: article 15234723190932*

**Purpose.** Translates the source file for **dynamic searches** (the escape/lookup descriptions) to or from a foreign language.

**Where it lives.** `System Administration > System Tools > Translation Tools > Translate Dynamic Searches`

**Fields** — the shared set above, plus:

| Field | Type | Purpose / business rule |
|---|---|---|
| `Escape Description` | Radio | All escape descriptions vs. only un-translated ones. Export-only. |

**Behavior & rules.** No module or file scoping — this routine operates on the whole dynamic-search description set at once. **"Escape description" ties this to the dynamic escapes surfaced by right-click menus (`SYS-068`) and `Dynamic Escape Settings` (part A, position 21).**

**Dependencies.** `Dynamic Escape Settings` (part A). `SYS-068` Right-Click Menus. `SYS-086` Translation Tool.

**Build notes.** See the cluster note. Contextual-navigation labels should be derived from the capability's canonical name (see `SYS-076` build notes), translated once in the message catalog.

---

### `SYS-083` Translate File Descriptions
*storis_ref: article 15234723190676*

**Purpose.** Translates the source file for **data file descriptions** to or from a foreign language.

**Where it lives.** `System Administration > System Tools > Translation Tools > Translate File Descriptions`

**Fields** — the shared set above, plus:

| Field | Type | Purpose / business rule |
|---|---|---|
| `File Name` | Code, dropdown | "the name of the file whose file descriptions you want to translate." |
| `Field` | Code, dropdown | "the name of the field you want to translate. **Most files have only one field but a few such as `Product` have multiple descriptive fields associated with the file name.**" |
| `Descriptions` | Radio | All descriptions vs. only un-translated. Export-only. |

**Behavior & rules.** The `Field` field confirms that **some entities (notably `Product`) carry multiple independently-translatable description fields** — relevant to our product-catalog i18n design if LA Mattress ever goes multi-lingual on customer-facing product text.

**Dependencies.** Data file / field dictionary. `SYS-084` Translate File Dictionaries (adjacent but distinct — descriptions vs. dictionaries). `SYS-086` Translation Tool (`DAT Data` domain).

**Build notes.** **Product-facing descriptive text is customer-visible content, not UI chrome, and must be modelled differently from UI strings** — per-locale columns or a translations table on the entity, editable by merchandising, with fallback to a default locale. Do not put customer-visible product copy in a developer message catalog.

---

### `SYS-084` Translate File Dictionaries
*storis_ref: article 15234737322516*

**Purpose.** Translates the source file for **data dictionaries** to or from a foreign language.

**Where it lives.** `System Administration > System Tools > Translation Tools > Translate File Dictionaries`

**Fields** — the shared set above, plus:

| Field | Type | Purpose / business rule |
|---|---|---|
| `File Name` | Code, dropdown | "the name of the **dictionary** whose data you want to translate." |
| `Dictionaries` | Radio | All dictionaries vs. only un-translated. Export-only. |

**Behavior & rules.** Per `SYS-086`, the `DIC Dictionaries` domain covers "**Dictionary descriptions, column headings, and prompts used for user-defined reports (that is, reports built with the Report Builder)**" — so **this routine controls the labels end users see when building their own reports.** Changing them affects every saved report's headings.

**Dependencies.** Report Builder. `SYS-086` Translation Tool (`DIC` domain). Related to `views-reports` part of this handoff pack.

**Build notes.** Report column labels should come from the same canonical field-metadata registry that drives the UI, so a field is named once and that name appears in screens, exports, and reports. STORIS' split (screen text, file descriptions, dictionaries all separately translated) is exactly how a system ends up calling the same thing three different names.

---

### `SYS-085` Translate Program Errors
*storis_ref: article 15234737333908*

**Purpose.** Translates the source file for **program error messages** to or from a foreign language.

**Where it lives.** `System Administration > System Tools > Translation Tools > Translate Program Errors`

**Fields** — the shared set above, plus:

| Field | Type | Purpose / business rule |
|---|---|---|
| `Program Error Type` | Enum, 5 values, **export-only** | Exact values: **`Audit Comment`**, **`RF Barcode Message`**, **`Word`**, **`Standard Error`**, **`Barcode Prompt`**. |
| `Error Messages` | Radio | All error messages vs. only un-translated. Export-only. |

**Behavior & rules — a finding for the audit-log question.**
- **`Audit Comment` is one of the five "program error" message types.** This is direct evidence that **STORIS' audit comments are generated from a templated, translatable message catalog** — i.e. audit entries are rendered strings assembled from a template plus substitutions (the `~` tilde placeholder convention documented in `SYS-086`), **not structured data.**
- **Consequence, and it is important:** an audit comment such as `"Cannot locate '~' in the ~ file."` is stored/rendered as prose with values interpolated. **You cannot reliably query, filter, or diff an audit trail made of localized template output** — and if someone re-translates the `Audit Comment` catalog, **the historical rendering of past audit entries changes.** This corroborates `SYS-067`: STORIS' audit trails are prose, and that is why they are unusable analytically.
- The `Word` type suggests individual words are translated in isolation for reassembly — a classic i18n anti-pattern that produces ungrammatical output in inflected languages.
- `RF Barcode Message` and `Barcode Prompt` confirm an RF/handheld barcode subsystem with its own message set.

**Dependencies.** `SYS-086` Translation Tool (`MSG Messages` domain). `SYS-067` Review Settings Activity / audit comments. RF barcode subsystem. `Run as User` (which "stamps that identity into audit comments" — established finding; **this article shows those comments are template-rendered strings**).

**Build notes.**
- **Decisive requirement for `RPT-AUDIT`: audit records must store structured data (`action`, `entity`, `before`, `after`, `actor`), and any human-readable sentence must be RENDERED AT DISPLAY TIME from that structure — never stored as prose, and never stored pre-localized.** This one article is the clearest justification for that rule found in my range.
- Error messages themselves: use ICU MessageFormat with **named** placeholders (`{productKey}`, `{fileName}`), never positional tildes, and never translate isolated words for reassembly.

---

### `SYS-086` Translation Tool
*storis_ref: article 15234723476628*

**Purpose.** The master translation utility. Exports a STORIS **"domain"** (screen text, messages, help, reports, etc.) to a tab-separated `.TXT` file, and imports the translated file back. This is the umbrella routine of which `SYS-081`–`SYS-085` are narrow, per-domain shortcuts.

**Where it lives.** `System Administration > System Tools > Translation Tool`

**The three-step process, as documented:**
1. "Use the Translation Tool to **export** English data (in the form of a STORIS domain) to a `.TXT` file."
2. "Translate from English to another language using the program of your choice… **You must then return the translated text back to a `.TXT` file** before importing it back into STORIS."
3. "Use the Translation Tool to **import** the `.TXT` file with the translated text back into STORIS."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Operation` | Enum: `Export To Spreadsheet` / `Import Translation` | Direction of the transfer. |
| `Translate` | Enum — the **domain**, 10 values | See the domain table below. **"Once you select a domain, the version number of the translation spreadsheet appears below the field."** |
| `Text Exceeding Maximum Width` | Enum: **`Truncate Data`** / **`Reject Data`** | **Import-only; activates after the `Translate` prompt is answered.** `Truncate Data` = "Cut off any text that does not fit into the field." `Reject Data` = "If the text exceeds the maximum field width, **reject the text entirely**." |
| `Language` | Code, lookup | The translation language. **"This field activates only after you respond to the `Translate` prompt."** |
| `File` | File name | "For exports, STORIS generates a `.TXT` file. For imports, the file **must** be a `.TXT` file." |
| `Path` | Display | "The directory location of the selected file displays." |
| `Modules` | Multi-select | Selection filter. **"This field is active only if you select a translation domain of `Help`, `Menus`, `Reports`, or `Screens`."** `Multiple Module Window` from the Action button. |
| `Data Files` | Multi-select | Selection filter. **"If you select the `DIC Dictionaries` domain at the `Translate` field, the name of the `Data Files` field changes to `Dictionary File`."** |
| `Translation Types` | Multi-select | Selection filter. **"This field is active only if you select a translation domain of `DDT`, `Dictionaries`, `DTQ`, `Reports`, or `Screens`."** |
| `Only Untranslated Text` | Checkbox | "To generate only text that has not yet been translated, check the box. Otherwise, the program generates all text for translation." |

**The 10 translation domains — exact codes and definitions**

| Code | Name | Definition (verbatim) |
|---|---|---|
| `DAT` | Data | "Selected text data (descriptions, etc.) in selected data files." |
| `DDT` | DTS default tabs | "Default tab labels and descriptions for DTS Queries." |
| `DIC` | Dictionaries | "Dictionary descriptions, column headings, and prompts used for user-defined reports (that is, reports built with the Report Builder)." |
| `DTQ` | DTS Queries | "Screens titles and override tab labels for DTS Queries." |
| `HLP` | Help | "Context-specific 'bubble help' (also known as tool tips) text associated with fields on a screen." |
| `LKU` | Lookups | "In-screen menu titles for lookups." |
| `MNU` | Menus | "Titles used in the menu system." |
| `MSG` | Messages | "Warning, Exception, and other dialogs as well as the translation of words and phrases for diverse purposes." |
| `RPT` | Reports | "All report text for standard reports, **excluding data**." |
| `SCR` | Screens | "All screen text, **excluding data**." |

**Behavior & rules — spreadsheet integrity (all hard rules).**
- **Version locking, quoted:** "**When you import data back into STORIS, the version number of the spreadsheet used for the import must match the spreadsheet version used for the import. The version number appears in cell `A1` in the conversion spreadsheet.**" (The sentence is garbled in the source — it evidently means the import spreadsheet's version must match the version of the *export*. **The mechanism is real and important: `A1` carries a version stamp and a mismatch blocks import.**)
- **"Do not change any of the column headers. When importing translations, the system uses the generated column headers to verify the integrity and version of the spreadsheet. The first row of the spreadsheet must contain the column headers."**
- **"Do not delete any of the generated columns. You can add your own columns, but you must place them outside of the generated columns."** — no inserting columns among the generated ones.
- `<NOTE>` rows: "One or more special Note rows (prefixed with `<NOTE>`) are included at the start of the spreadsheet, below the column headers… **The program ignores these rows when importing** and you can delete them. You can also add your own Note rows anywhere **except the first row**."
- **"You can sort the spreadsheet anyway you like, and you can delete any rows except the column headers."** — **rows are matched by key, not position**, which is why sorting and row deletion are safe. **Deleting a row simply means that item is not updated** — a partial-update model.
- Format: **tab-separated `.TXT`.** "If you convert the `.TXT` file to another format, you must convert it back to a tab-delimited format… with a `.txt` extension before importing."
- **Excel formatting trap, quoted:** "**Important! Do NOT format your spreadsheet as Text (that is, via the Number tab). Otherwise, problems may occur when you import the spreadsheet. For example, the Control ID `$1` converts incorrectly to `1`.**"
- Font: "You must select a standard font that supports special characters" (see `SYS-050` → `Arial Unicode MS`).

**Behavior & rules — width restrictions (a real data-model constraint).**
- **"Maximum width restrictions appear in the `Max` column on conversion spreadsheets."**
- **Hard width:** a plain number in `Max` — text exceeding it is truncated or rejected per `Text Exceeding Maximum Width`.
- **Soft width:** **"If the maximum width for a field is preceded by a dash `-`, the field has a 'soft width' restriction, meaning that the data are NOT truncated and are left as is."** (The article offers reformatting `-160` to display as `(160)`.)
- **"STORIS strongly suggests you not exceed maximum widths for ANY fields as results can be unpredictable."** — **even soft-width overflow is unsafe.** This is a fixed-width-display legacy constraint: translated text is usually longer than English, so **every translation risks breaking layout.**
- **`Exception Report`:** "generates at the conclusion of the import process **(and the export process as well if any errors are found)**, lists any data truncated or rejected during import." **So there IS a per-run reject report for translation imports — same pattern as `SYS-063`.**

**Behavior & rules — special characters (carry these forward).**
- **`^` up caret — line break.** "Up carets are used to represent line breaks in selected translation types (for example, column headings and grid headings)… **Your translated version may not need to have the same number of lines as the corresponding English version.**" Example: `Column^Heading` renders as two lines.
- **`~` tilde — substitution placeholder.** "Tildes are used within selected translation type (for example, Messages) as placeholders for text insertions." Example: `"Cannot locate '~' in the ~ file."` renders as `"Cannot locate 'ABC123' in the PRODUCT file."`
- **⚠️ Hard rule, and the classic i18n defect:** "**The grammar of your translated version must accommodate the same number and sequence of text insertions as the English version.**" **Positional, unnamed placeholders that cannot be reordered.** Any language requiring a different word order produces broken sentences. (And per `SYS-085`, **`Audit Comment` is one of these templated types.**)

**Behavior & rules — scope limits.**
- "**the number of languages to which you can translate is restricted by the extra-English characters required by each language and the ability of your computer system to support them. In addition, STORIS supports only a limited number of ASCII characters.**" **STORIS is ASCII-constrained — it cannot support non-Latin scripts (CJK, Cyrillic, Arabic, Hebrew) at all.**

**Dependencies.** `SYS-081`–`SYS-085` (per-domain shortcuts into the same data). `SYS-049`, `SYS-050` (character entry). `SYS-076` Set Up Menus (`MNU` domain; menu language gating). Report Builder (`DIC`, `RPT`). DTS Queries (`DDT`, `DTQ`). Module list. Related article: `Automated Data Import Settings`.

**Build notes.**
- **Adopt three ideas, reject the rest.**
  1. **Domain segmentation** (`SCR`/`MSG`/`HLP`/`RPT`/`MNU`/`DAT`) is a sensible separation — particularly the `…excluding data` distinction between **UI chrome** and **business content**. Keep that split: UI strings in the message catalog, business content (product descriptions, `DAT`) in the database with per-locale rows.
  2. **A round-trip integrity check.** The `A1` version stamp + header verification is crude but the intent is right: **an import must verify it matches the export it came from.** Our imports (including `MIG-*` templates) should carry a signed/versioned header and refuse mismatched files. **Generalize this to every spreadsheet-based import we build.**
  3. **The `Exception Report` on both import and export.** Same reject-visibility pattern as `SYS-063`; same fix (persist rejects as data).
- **Reject:** ASCII limits, fixed field widths, positional `~` placeholders, `^` as a line-break marker, Excel as the transport, and the single-global-language model.
  - **Use ICU MessageFormat with named, reorderable placeholders.** This is non-negotiable and `SYS-086` documents exactly why.
  - **Never impose display-width limits on translatable text.** Design layouts that reflow; German and Spanish will be 30% longer than English.
  - **Per-user locale**, with fallback chain — not one system language that also determines which menus you may edit (`SYS-076`).
- `[DECISION NEEDED]` Does LA Mattress need Spanish in the ERP UI (likely, for warehouse and delivery staff) and/or in customer-facing documents (invoices, delivery notices)? These are different problems with different owners. Decide early — retrofitting i18n is expensive, and the `DAT`-vs-`SCR` split above only works if it is designed in from the start.

---

### `SYS-087` Update Product Configuration Detail
*storis_ref: article 15234735558164*

**Purpose.** Imports **Product Configurator** data (fabric groups, grades, bases, etc.) into STORIS from a STORIS-supplied Excel workbook, one worksheet/file at a time. Used both for **initial data conversion** and for later Configurator updates. **This is the most `MIG-*`-relevant article in my range after `SYS-063`.**

**Where it lives.** `System Administration > System Tools > **Conversion Tools** > Update Product Configuration Detail`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Current Account` | Display-only | "Your current account appears at the top of the screen. **You can convert data only to the account you are currently running.**" |
| `Conversion File` | Code, grid-selectable | "the STORIS file to which you want to convert data (for example, the `Fabric Type` file). **The grid displays the available files in the order in which you should import them.**" Type-ahead on first letter; arrow keys; Enter; or double-click in the grid. |
| `Data File Name` | File name | "the name of the file containing the data you want to convert… **The file must be a tab-delimited `.txt` file.**" Action button browses. "If a data file exists for the selected conversion file, the filename appears (**do not edit this filename**)." **"The `.txt` file name you indicate here cannot be more than 26 alpha-numeric characters, not including the extension (`.txt`)."** |
| `Clear/Load All Configurator Files for Vendor` | Vendor code | **"This field is not active if you enter a response at the `Conversion File` field."** Used to remove or load **all** Configurator data for one vendor. Search button opens `Vendor Cross Reference`. "**this field does not affect data in the `Vendor Settings`.**" |

**`Actions` menu — exact options and rules**

| Action | Rule |
|---|---|
| `Run Conversion` | Begins converting the selected file. **"If you have already converted this file type (for example, the `Vendor` file), an error message appears and the system prevents you from continuing."** → **the routine is guarded against double-import per file type, i.e. it is NOT re-runnable without first clearing.** "The system keeps a running tally on the screen of records successfully converted, records generating error messages, and records generating warnings." |
| `Clear File Conversion` | Clears existing data from the selected conversion file. **⚠️ "Note that when you select a file to clear, the system ALSO CLEARS DATA FROM RELATED FILES. For example, if you choose to clear the `Product` file, the system also clears the fields in the `Product Category` and the `Product Group` files."** **Cascading destruction whose full extent is undocumented — "Contact your STORIS representative for more information on related files."** |
| `Error Report` | Regenerates the previous Error Report. **Exact procedure: "specify the proper conversion file and data file, enter a sample amount of zero (or leave the field blank), and select `Error Report`."** |
| `Clear Configurator for Vendor` | **"This is a STORIS locked option and must be run by STORIS."** Removes **all** Configurator data for the selected vendor. **A vendor-wide wipe that the customer cannot execute — vendor-gated for good reason.** |
| `Run all Updates for Vendor` | "update all files at once rather than running the update for one file at a time. To use this option, you leave the `Conversion File` prompt blank and specify a vendor… **You are prompted to confirm** that you want to run this option." |

**Behavior & rules — worksheet ordering (a hard `MIG-*` constraint).**
- **"The workbook that contains the worksheets lists them in a specific order. IMPORT THE WORKSHEETS IN THE ORDER PROVIDED. Otherwise, errors can occur."**
- The `Conversion File` grid itself "displays the available files **in the order in which you should import them**" — the required dependency order is encoded in the UI.
- **"If you do not enter data into a worksheet, you do not have to import it."** — worksheets are individually optional.

**Behavior & rules — the two safety warnings, quoted.**
> "**NOTE: Consult with your STORIS representative before running this routine. Running this routine improperly can have CATASTROPHIC RESULTS to data files.**"
> "**Important!! If you are already LIVE on the STORIS system, check with STORIS before running any data conversions in your LIVE account.**"

**These are the strongest warnings in the entire section. Conversion tools are explicitly not safe to run against a live account.**

**Behavior & rules — Error Report / per-record disposition.** Same three-state contract as `SYS-063` (`converted` / `error` / `warning`, with identical wording), **plus one crucial exception:**
> "**The Configurator conversion process rejects Product records if they are only partially converted. That is, a Product record will never generate a 'warning' message, only 'converted' or 'rejected'.**"

**This is the all-or-nothing rule we want everywhere: for Product records, the Configurator conversion is strictly atomic per record — no partial imports.** It is the direct counter-example to the dangerous `warning` semantics in `SYS-063`, and **it proves STORIS is capable of atomic-per-record imports; it just does not apply that discipline uniformly.** Cite this when arguing for hard-reject-on-warning in our migration (`SYS-063` `[DECISION NEEDED]`).

**Behavior & rules — spreadsheet sourcing and versioning.**
- STORIS supplies a **`Configurator Conversion Spreadsheet`** with one worksheet per conversion file. "Enter the data into the worksheet, then when complete, **save the file as a tab-delimited `.txt` file.**"
- **"be sure you have the latest version"** — downloaded from the STORIS secure Customer Service web site (`Documentation, Vision, Spreadsheet Downloads` page), requiring the customer's registered User ID and password. **The import template is versioned and externally hosted; using a stale template is a documented risk.**

**Behavior & rules — multi-lingual import.**
- "Several tabs of the `Configurator Conversion Spreadsheet`… include a **`Language Code`** prompt in the **header row** of the spreadsheet. If you use a language other than English, enter the code **following the colon** in the `Language Code:` prompt in that cell. **If left blank, the system uses a language code of `1` for English.**" The system uses that code to decide what language the imported text is in.
- "The comment for the `Language Code` cell in the spreadsheet also includes a list of the text columns that support multi-lingual processing."

**Other routing guidance from the article.** "To convert data into STORIS **other than** Product Configurator data, use the **`Import Data`** routine for initial conversion and the **`Import Product Information` (Product Conversion)** routine to update the product file." → **three distinct conversion entry points, by data type.**

**Dependencies.** `Import Data` (part A, position 35); `Import Product Information` / Product Conversion; `SYS-063` Report Data Imported Errors and Warnings; `SYS-071` Select and Configure a Vendor for Import; Vendor Cross Reference; `Vendor Settings` (explicitly **not** affected); Product / Product Category / Product Group files (**cascade targets of `Clear File Conversion`**); Product Configurator (bases, grades, fabric groups/types); Multi-Lingual Processing (`SYS-049`, `SYS-050`, `SYS-086`). **Directly informs `MIG-*`.**

**Build notes — `MIG-*` contribution.**
- **Answers the `MIG-*` idempotency question, negatively and explicitly:** `Run Conversion` **refuses to re-run a file type that has already been converted**, and the only way forward is `Clear File Conversion`, **which cascades into related files by an undocumented graph**. **So the STORIS conversion path is: not idempotent, not resumable, and the reset is destructive and imprecisely scoped.** Plan the cutover accordingly — **rehearse on a copy, never iterate in the live account** (which the article itself demands).
  - Practical consequence for the cutover plan: **budget for full-restore-and-retry cycles, not incremental fix-ups.** Each rehearsal iteration needs a clean restored account.
  - See `SYS-015` `Copy Live Data to Learn Account` (part A, position 15) — that is presumably the mechanism for producing a rehearsal account; **part A should confirm it, because our cutover plan depends on being able to make a fresh copy cheaply and repeatedly.**
- **What it can import:** Product Configurator structures only (fabric groups/types, bases, grades — vendor-associated), via STORIS-supplied per-file worksheets. **Product master data goes through `Import Data`/`Import Product Information` instead, not here.**
- **What it cannot do:** import into any account other than the one you are logged into; import worksheets out of dependency order; re-import a file type without a destructive clear; accept a file name over 26 characters; accept anything but tab-delimited `.txt`.
- **Validation/rejects behavior:** three-state Error Report per run, regenerable; **Product records are atomic (converted or rejected, never warning)**; other record types can be accepted with warnings.
- **For our own import framework, adopt:** declared dependency order between entity types with **enforced** ordering (not "please import in this order"); a **versioned, validated template** (reject a stale template outright — cf. `SYS-086`'s `A1` version stamp); **atomic per-record semantics for every entity, not just Product**; a **scoped, previewable rollback** per batch (not a cascading clear with an undocumented blast radius); and **explicit environment guards** so a conversion cannot be pointed at production by accident.
- `[DECISION NEEDED]` Does LA Mattress use a product configurator (custom upholstery/fabric grades)? Mattress retail may not need one, in which case this whole conversion path is out of scope — **but confirm before scoping the migration, because Configurator data has its own separate import path and would otherwise be missed entirely.**

---

### `SYS-088` Update Purchase Date
*storis_ref: article 15234722465300*

**Purpose.** Bulk-marks purchase orders as already-exported, by written date, so they are excluded from future PO exports. Effectively a "catch up the export watermark" utility.

**Where it lives.** "Via the `Actions` button on the `Export Purchase Orders` routine." (`Export Purchase Orders` is position 29, part A.)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (date) | Date | "The program selects and updates **all purchase orders (for all vendors)** with a **written date less than or equal to** the date you enter here." |

**Behavior & rules.**
- **Thin article, dangerous routine.** Three sentences total, and they describe an **unfiltered, all-vendors, date-cutoff bulk state change on purchase orders** — with **no preview, no affected count, no confirmation prompt, and no per-vendor or per-PO filter documented.**
- Semantics are **inclusive** (`<=` the entered date).
- **Consequence not stated in the article but implied:** marking POs as exported means **they will not be sent to the vendor.** A too-late date silently suppresses transmission of real, open purchase orders — **merchandise never gets ordered and nothing reports the omission.** Combined with `SYS-055`'s lack of per-PO transmission tracking, this is unrecoverable without manual reconciliation.
- Confirms that `Export Purchase Orders` **does** maintain some exported/not-exported state per PO (otherwise there would be nothing to update) — **which contradicts nothing in `SYS-055` but does mean re-export suppression exists; `SYS-055`'s silence on it is a documentation gap rather than an absence.** Worth confirming with STORIS.

**Dependencies.** `Export Purchase Orders` (part A, position 29); `SYS-055` Purchase Orders to Export. PO written date. Inventory pack `PO-*`.

**Build notes.**
- **If we build a PO transmission watermark at all, it must be a per-PO transmission record, not a global date cutoff** (see `SYS-055` build notes). With per-PO records, this routine becomes unnecessary — you set `sent_at` on the specific POs you are backfilling.
- Any bulk state change on financial/procurement documents requires: preview with count, explicit confirmation, full audit entry listing affected document ids, and an undo path.
- **Flag for the Inventory workstream:** ask whether their `PO-*` requirements assume a per-PO exported flag or a date watermark. This article shows STORIS has both concepts entangled.

---

### `SYS-089` Updating Your Operating System for Electronic Updates
*storis_ref: article 15234722463508*

**Purpose.** Explains the **OS-side half** of scheduled electronic updates: STORIS' own schedule (`SYS-070`) does not actually run anything — a Windows Scheduled Task must invoke the updater, and the two schedules must match.

**Where it lives.** Documentation article (no Access path). Linked from `SYS-070` Schedule Electronic Updates.

**Fields / configuration values** — these are Windows Task Scheduler settings, but the specific values are STORIS-mandated:

| Setting | Required value / rule |
|---|---|
| Program to run | **`UDT`.** "If `'UDT'` does not appear on your list, make sure you are accessing the server on which STORIS is running." |
| Scheduled-task user name | **`storisau`** — **"Enter the name in lower case letters."** |
| Prerequisite for that user | **"before this screen can accept this user name, you must create a STORIS user in the STORIS User file for `'storisau'`, AS WELL AS a user in Windows for `'storisau'`."** **Two accounts, same name, in two systems.** |
| Days and times | **"The days and times you enter here MUST MATCH EXACTLY the days and times you entered in the `Schedule Electronic Updates` routine."** |
| `Start In` field (Advanced Properties) | **"enter the path to your live account."** Then Save and exit. |

**Behavior & rules.**
- **⚠️ The schedule is duplicated in two systems with no synchronization and no validation.** If the OS task and the STORIS schedule disagree, updates either never run or run at the wrong time — **and nothing detects the mismatch.** This is the same class of defect as `SYS-074` (two version pins) and `SYS-080` (manual cache invalidation): **STORIS repeatedly requires a human to keep two sources of truth in agreement.**
- **A dedicated service account (`storisau`) must exist in both the STORIS User file and Windows.** Note that this account exists to run privileged updates — **a service account whose STORIS-side permissions are, per wave 1, inert unless `Extended Security` is on.**
- **`Start In` must point at "your live account"** — a service account, running an updater, hard-pointed at production, configured by hand. **No environment guard whatsoever.** (Compare `SYS-087`'s explicit "check with STORIS before running conversions in your LIVE account" — the same risk, handled with a warning in one place and unmentioned here.)
- Article disclaims scope: "STORIS assumes that your system administrator is familiar with the Windows operating system. This topic is not intended to be a step-by-step description."
- **UNIX customers get no documentation at all** — "contact your STORIS representative."

**Dependencies.** `SYS-070` Schedule Electronic Updates (**the schedule that must match**). `SYS-011` Automatic Updates Notification Screen (part A). `Check and Electronically Install STORIS Updates` (part A, position 12). STORIS User file (`storisau`). Windows Task Scheduler. `SYS-092` View Downloaded Update List.

**Build notes.**
- **Nothing to port.** Our deploys are pipeline-driven; there is no customer-side scheduler to configure.
- **The transferable lesson, and it applies to our own build:** **never require the same configuration to be entered in two systems.** One source of truth; if an external scheduler is genuinely required, it should read the schedule from the application, not have it retyped. Where duplication is unavoidable, the application must **detect and alarm on divergence**.
- **Service accounts:** ours must be first-class, non-interactive, least-privilege, credential-rotated, and **auditable as actors** (`RPT-AUDIT` must be able to say "the nightly job did this"). A shared named account typed into a Windows dialog in lower case is not that.
- **Environment targeting must be explicit and safe** — a job cannot be pointed at production by editing a text field.

---

### `SYS-090` User Defined Menu Description
*storis_ref: article 15234722085652*

**Purpose.** A small prompt window that captures the label a **Dynamic Tab Set (DTS)** will show on the STORIS menu, presented immediately after a DTS is saved.

**Where it lives.** `Dynamic Tab Settings > Save` after creating or editing a DTS. (`Dynamic Tab Settings` is position 22, part A.)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Enter menu description text` | Text | The description for the DTS as it appears on the STORIS menu. **"This field is populated by the text entered in the `Description` field in `Dynamic Tab Settings`, although this may be edited here."** After entering a name and clicking `Save`, you return to `Dynamic Tab Settings`. |

**Behavior & rules.**
- **Two labels for one object, deliberately divergent:** the DTS `Description` and the DTS *menu* description default to the same text but can differ. Guidance given: "**Since a single DTS can appear on multiple menus, you may want to give each DTS a unique yet related name.**"
- **This directly contradicts `SYS-076`'s rename behavior**, where editing a program shortcut's name **propagates to every instance with the same program ID**. So: **DTS entries may be labelled differently per menu, while ordinary program shortcuts may not.** Two inconsistent labelling models in the same menu system. **Flag as a genuine internal inconsistency in STORIS.**
- Note also that a **single DTS can appear on multiple menus**, i.e. on the menus of multiple user groups — reinforcing that menus (and therefore menu-based access control) overlap in complex ways (`SYS-076`).

**Dependencies.** `Dynamic Tab Settings` (part A, position 22). `SYS-076` Set Up Menus. `SYS-086` Translation Tool (`MNU Menus`, `DDT DTS default tabs`, `DTQ DTS Queries` domains). DTS Queries.

**Build notes.**
- The underlying need is legitimate: **a saved view/query may warrant a different label in different navigation contexts.** Model it properly — one canonical object with an internal name, plus a per-placement display label. That resolves both this screen and the `SYS-076` rename problem with a single design, instead of STORIS' two contradictory ones.
- Labels are presentation data and belong in the translation/message layer, not in the object's identity.

---

### `SYS-091` Validate STORIS License Usage
*storis_ref: article 15234738255508*

**Purpose.** Clears **stale terminal records** — ports still marked in use by users who are no longer logged in — so that other users can log in. The automatic housekeeping counterpart to `SYS-061`.

**Where it lives.** `System Administration > System Tools > Validate STORIS License Usage` (the menu option is referred to as **`Port Usage`**).

**Fields** — **none. There is no screen.** "When you click on the menu option for this routine, **the program executes automatically.** That is, you do not access a routine and make field selections from the screen." (Same no-screen pattern as `SYS-080`.)

**Behavior & rules.**
- **The algorithm, stated precisely:** "The program gathers data from the **Terminal file**, then checks to see if the user is still logged in to that port. **If the user is not logged in, the terminal record is cleared from STORIS.** Another user may then log on to the port."
- Problem it solves: "Occasionally, users are unable to log in to the system because no available ports exist at the time… check for ports no longer being used (that is, **a user is not logged on but port is still not free**) and clear them."
- Feedback: "the system performs the checks and **displays a message indicating that the ports have been validated.**" (Better than `SYS-080`, which reports nothing — but still no detail on how many records were cleared.)
- **Runs automatically at every login:** "**When a user logs in, the `Validate STORIS License Usage` is automatically run**, ensuring that when the `Recover STORIS Licenses` screen is accessed, the licenses and TERMINAL records are already in sync." So the manual menu option is largely redundant — **which raises the question of why the stale-port problem occurs at all if the reconciliation runs on every login.** Unresolved; likely the automatic run is a later addition and the manual routine is legacy.
- **Session state is leaked by design:** the existence of this routine is proof that **STORIS sessions do not reliably clean up after themselves** (crashes, dropped connections, killed clients leave orphaned terminal records).

**Dependencies.** Terminal file / TERMINAL records. `SYS-061` Recover STORIS Licenses. Login process.

**Build notes.**
- **The general lesson is the valuable part: never let session state require manual reconciliation.** Sessions must be **self-expiring** — a TTL with heartbeat renewal, so an orphaned session disappears on its own without any sweeper. That eliminates this routine and half of `SYS-061`.
- Concurrent-session limits (if we want them at all, e.g. one active session per user for security) should be enforced by evicting the oldest session on new login, with the eviction audited — not by a port pool that can leak.
- No licensing concept to port.

---

### `SYS-092` View Downloaded Update List
*storis_ref: article 15234736539156*

**Purpose.** Lists the STORIS updates that have been downloaded, with descriptions, so an administrator can see what is about to be installed.

**Where it lives.** `Check and Electronically Install STORIS Updates > Step 2 - Install the Updates > Install Updates field > Action button` (`Check and Electronically Install STORIS Updates` is position 12, part A).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Type` | Enum, 3 values | Exact values: **`Enhancement`**, **`Internal`**, **`Update`**. |
| `Include` | Enum, 2 values | **`All Downloaded Updates`** — "displays all updates from the recent download." **`Next Install Group`** — "restricts the list to the updates included in the next install group." |
| Grid | Read-only | **"To view the full description for an update, double-click on the item in the grid."** |

**Behavior & rules.**
- **The `Next Install Group` concept is the notable finding: updates are batched into "install groups", and not everything downloaded is necessarily installed in the next run.** The article does not explain how an install group is determined — presumably by dependency and/or the `Max Patch Update Allowed` / `Set Maximum Update Screen` ceilings (`SYS-070`, `SYS-074`). **Flag as unresolved: the grouping rule is undocumented, which means an administrator cannot predict exactly what a scheduled update will install.**
- The `Internal` type suggests some updates are not customer-facing changes — worth knowing that the change log an administrator sees is not the whole change set.
- Reveals a two-step model in the parent routine: **`Step 1` download, `Step 2` install** — download and install are separable, which is why a downloaded-but-not-installed list exists.

**Dependencies.** `Check and Electronically Install STORIS Updates` (part A, position 12). `SYS-074` Set Maximum Update Screen. `SYS-070` Schedule Electronic Updates (`Max Patch Update Allowed`, `PACKET.LOAD.HISTORY`). `Install Software Updates` (part A, position 38). `Automatic Updates History` in Report Builder.

**Build notes.**
- Nothing to port directly. **The one idea worth keeping is the separation of "fetched" from "applied", with a human-readable list of what is about to change** — i.e. our deploys should produce a visible, human-readable changelog per release, and the release notes an operator sees should be complete (no hidden `Internal` category).
- **Never batch changes into groups by an undocumented rule.** A release is an explicit, named, versioned set.

---

### `SYS-093` View Phantom Processes
*storis_ref: article 15234735775892*

**Purpose.** The monitoring and control console for background ("phantom") processes: shows every STORIS process that has phantoms, their status and queue depth, and lets an administrator start new ones.

**Where it lives.** `System Administration > System Tools > **Establish and Review Phantom Processes** > View Phantom Processes`

**Fields**

**`Phantom Processes` tab** — grid of processes, "displayed from `Phantom Process Settings`":

| Column | Purpose / business rule |
|---|---|
| `Process Name` | The STORIS process. |
| `Description` | Human-readable name. |
| `Type` | Phantom type (enum values not published — see `SYS-053`). |
| `Status` | Current state of the process' phantoms. |
| `Number Active` | **How many phantom workers are currently running for this process.** |
| `Queue Count` | **⭐ The depth of the pending work queue — the single most operationally useful number in the whole phantom subsystem.** |

**`System List` tab** — "for the process selected on the `Phantom Processes` tab, all the phantoms running in the background":

| Column | Purpose / business rule |
|---|---|
| `Owner` | The OS/STORIS owner of the background process. |
| `PID` | Process ID. |
| `Start Time` | When this phantom started. |
| `Process` | The process it serves. |
| `Description` | Description. |

**Behavior & rules.**
- Purpose stated: "**monitor and control** existing phantoms **as well as start new ones**" — so worker count can be adjusted manually, in addition to the auto-start/stop logic in `SYS-053`.
- Drill-down: "If you double-click on an item in the grid, the system brings you to the **`Administer Phantom Processes`** routine (**also known as `Phantom Process Control`**) where you can see more information, including **all phantoms executed on the selected process**." → from there, the `Add` button opens the read-only `Phantom Process Log` (`SYS-052`).
- **"The grid may take a moment to load."** — the monitoring console itself is slow, which is a poor property for the screen you open when the system is struggling.
- **The shutdown warning is repeated verbatim from `SYS-053`, in capitals:** "**If you must shutdown your server, STOP ALL PHANTOM PROCESSES RUNNING ON THE SYSTEM BEFORE SHUTTING DOWN.** If you are unable to do so, contact your system administrator or STORIS representative for assistance before shutting down the server." **Repeated on both phantom articles — treat it as the single most emphasized operational rule in the phantom subsystem.**
- **`Queue Count` is the key `EOD-001` signal:** per `SYS-053`, a backlog here becomes End-of-Day's problem. An administrator watching `Queue Count` before period-close is effectively predicting how long EOD will take. **There is no alerting on it** — you must go look.

**Dependencies.** `SYS-053` Phantom Process Settings (source of the displayed configuration). `Administer Phantom Processes` / `Phantom Process Control` (part A, position 3). `SYS-052` Phantom Process Log. End-of-Day / End-of-Month (`EOD-001`, part A). `Order Completion Exceptions`.

**Build notes.**
- **This is the screen we genuinely should build an equivalent of** — a **job/queue dashboard**: per job type, queue depth, in-flight count, oldest pending item age, throughput, error rate, last success, and the rolling average runtime idea borrowed from `SYS-070`.
- **Add what STORIS lacks: alerting.** Queue depth over threshold, oldest-item age over threshold, worker count zero, error rate spike — these must page someone, not wait to be noticed. The whole phantom subsystem is observable only by an administrator choosing to look at a slow-loading grid.
- **Do not expose manual worker start/stop as a business-user action** (see `SYS-053`) — scaling is infrastructure. Expose retry, dead-letter inspection, and requeue, which are the operations that actually need human judgment.
- Make the dashboard fast and cheap to load; it is the screen used during an incident.

---

## Consolidated findings

### A. `EOD-001` — what my range contributes

**The EOD/EOM articles themselves belong to part A** (positions 23–32). I could not produce the step list. What my range does establish, from six independent articles, is the following — **all of it should be reconciled against part A's `Generate Daily Reports` dissection:**

**Confirmed End-of-Day steps (each stated in an article in my range):**
| Step | Source | Exact basis |
|---|---|---|
| Close purchase orders that are fully AP-approved | `SYS-060` | "**The End-of-Day process closes purchase orders provided the orders have been completely AP approved**" (when Third-Party Accounting is active) |
| Remove/void sales orders not processed correctly | `SYS-062` | "**this process runs automatically during the end-of-day process in the sales order module**" |
| Data Warehouse data export (honouring per-file `N`/`F` resync flags) | `SYS-064`, `SYS-065` | "re-synchronized the next time the **End of Day export** is run"; "uses the override setting (`F`…) during the **end-of-day data warehouse data export process**" |
| System backup — **optional/configurable** | `SYS-069` | "You can set this program to run automatically as part of the **End of Day** process." |

**Confirmed End-of-Month steps:**
| Step | Source |
|---|---|
| Purge costing audit data per `Costed Auditing Data` retention | `SYS-056` — "purged automatically during **month-end processing**" |
| Purge Messenger activity per `History Retention Days` | `SYS-058` — "This program runs during **End-of-Month** processing" |

**Structural facts about EOD established here:**
1. **`PO-104` is independently confirmed and refined.** PO close is **not** "received ⇒ closed"; it is **"received AND completely AP-approved ⇒ closed at the next EOD"**, and the AP-approval gate applies **only when Third-Party Accounting is active**. A PO whose AP bill is never approved **never closes**. Part A / the Inventory workstream should adopt this wording.
2. **EOD is module-partitioned.** `SYS-062` says the sweep runs "in the end-of-day process **in the sales order module**" — the daily job is a sequence of per-module sub-jobs, not a flat step list. That shape should frame part A's step ordering (`REPL-041`).
3. **EOD's workload is not fixed — it depends on how much the phantoms drained during the day** (`SYS-053`: "many phantoms such as the GL Posting Phantom process a file in the background… **in order to reduce the amount of data End-of-Day must process**"; too few phantoms "can result in a **backlog** of data for… the End-of-Day process"). **Two installations running the same EOD can do materially different work.** Any assumption in the Inventory pack that EOD performs a fixed set of GL/inventory postings needs this caveat.
4. **EOD is long-running and contends for an exclusive nightly window** with EOM, the optional backup, and OS/application updates — `SYS-070` puts `Average End of Day Length`, `Average End of Month Length`, and `Average Automatic Updates Length` (each averaged over the **last seven runs**) on the *update scheduling* screen precisely so an administrator can fit them together.
5. **Queue depth before close predicts EOD duration** (`SYS-093` `Queue Count`), and there is no alerting on it.

### B. Purge utilities — what is irreversibly destroyed

Five purges fell in my range. **Ranked by blast radius:**

| Req | Destroys | Guard rails | Verdict |
|---|---|---|---|
| `SYS-057` Purge General Ledger Data | **"all GL-related files"** for `first_year … (current_fiscal_year − Maintain_History_Years − 1)` inclusive. **All companies if multi-company is active — no company selector.** | Only one: the screen locks itself out if `Start Year > End Year`. **No archive, no confirmation, no preview.** | **Highest risk.** A single settings change (`Maintain History Years`) silently redefines what it deletes, and the same admin can do both. |
| `SYS-056` Purge Costing Audit Data | The full costing/inventory audit trail (product creation, cost changes, PO receipts, adjustments, sales, transfers). | **None. "You can purge the data for any date range you specify, without restrictions."** **⚠️ Blank start + blank end = purge everything.** | **Also runs automatically at month-end.** No confirmation prompt documented. |
| `SYS-060` Purge Special Order and Obsolete Products | Products removed from the Product file. | **Best-designed of the set:** two-phase (build list → purge), list shows `Date List Was Created` / `List Created By` / `Number Of Items In List`, printable, and clearable two ways. Ten-condition eligibility gauntlet. | **Hidden side effect: "Products flagged for purging do not appear in the sales-related version of the `Search for a Product` window"** — flagging changes live sales behavior before anything is deleted, and only `Obsolete` (not `Special Order`) has an un-flag path. |
| `SYS-059` Purge of Sensitive Data | Encrypted PII/PCI from the Secured Data file: `Credit Card`, `Finance Account`, `Checking Account`, `Date of Birth`, `Driver's License`. | **Best-governed of the set:** dedicated permission, confirmation prompt, per-type opt-in, retention 1–99 days, **and it is the only purge that writes audit records** (`STORIS Log` + `Customer Activity Log`). | **`Social Security` is listed but "currently not available - for future use" — SSNs cannot be purged.** Credit-card purge silently does nothing unless `Retain Settled Card Number for NN Days` ≥ 0 in `Payment Card and Device Settings`. |
| `SYS-058` Purge Messenger Activity | Internal messages already marked deleted, older than the cutoff. | Only touches already-deleted messages; visible beforehand on the `Closed` tab. | Low risk. **But gated by `Mail Administrator`, a flag on the User/Staff record that is NOT in the 355-flag permission catalog** — a privilege outside the permission model. |

**Cross-purge dependency nobody surfaces:** `SYS-060` cannot purge a product with invoice history or costing data, and those are removed by *other* policies (`Customer Retention Months` in POS Control Settings; `Costing Control Settings` via `SYS-056`). Closed orders must purge before their products can. **There is a three-way ordering dependency between purges with no UI showing it.**

### C. Established findings — confirmed, contradicted, extended

**1. Extended Security is a single global kill-switch — CONFIRMED, and the consequences are worse than recorded.**
Two routines in my range name a specific permission as their only gate: `SYS-059` (`Purge secured/encrypted data`) and `SYS-061` (`Recover STORIS Licenses`). **Since every permission is inert unless `Extended Security` is on, on such a system the PCI data-minimization purge and the forced-logoff tool are effectively ungated.** Also newly noted: `SYS-061` is documented as having **"no security override option"**, which implies **most other routines DO have an override path** — worth chasing in the security workstream.

**2. STORIS' change-audit story — SETTLED. Wave 1 was directionally right but the precise statement matters.**
See `SYS-067` for the full table. Summary: **there is no general change-audit log.** There are five disjoint partial trails, and my range adds **two previously unregistered destinations — the `STORIS Log` and the `Customer Activity Log`** (`SYS-059`), which receive purge-criteria snapshots and per-customer purge detail respectively.

Three further nails, from my range:
- **`Review Settings Activity` (`SYS-067`) has no date field at all.** You must already know the file **and** the record key. It can answer "what happened to this record", never "what happened", "what did user X do", or "what changed yesterday". **Output is restricted to `Screen` and `Printer` — the trail cannot be exported.**
- **Audit comments are localized template strings.** `SYS-085` lists **`Audit Comment` as one of five translatable "program error" message types**, rendered with positional `~` placeholders (`SYS-086`). **Audit entries are prose assembled from a translatable catalog, not structured data** — so they cannot be queried or diffed, and re-translating the catalog changes how historical entries read.
- **Not auditable anywhere, confirmed by omission across my 46 articles:** who ran the GL/costing/product/messenger purges and what was destroyed; who bulk-voided orders (`SYS-062`); who overrode a time-clock entry (`SYS-051`); who force-logged-off a user (`SYS-061`); who cleared the DW resync flags (`SYS-065`); who changed any setting not opted into `Track Settings Activity` — **including `Extended Security` itself and the retention settings that drive the purges.**

**3. `Run as User` free impersonation — EXTENDED, with a new and related finding.**
`SYS-076` documents that **the `Logon ID` (`Security` tab of the User file, used for the Menu Builder) "is not necessarily the same as the User ID you enter at the `User Log In` window."** **STORIS carries two distinct identifiers per person which may differ**, on top of `Run as User` impersonation stamped into audit comments. **"Who did this?" is genuinely ambiguous.** → Our audit schema must carry one immutable internal `user_id` plus an explicit `acted_as`, and must never key on a login string.

**4. New privilege outside the permission model.** `Mail Administrator` (`SYS-058`) is a field on the User/Staff record, not a catalog permission. **Any access review built on the 355-flag catalog will miss it.** Flag to the security workstream: audit for other user-record flags that confer privilege.

**5. New settings scopes for the resolver.** `SYS-075` confirms `Purchase Status` resolves at **`REGION`** (via `District and Regional Product Settings`), implying **`DISTRICT`** too. **Add `REGION` and `DISTRICT`** to the scope list alongside `COMPANY`, `VENDOR_REMIT_TO`, `VENDOR_REGION`, `TERMS_CODE`, `PRODUCT_CATEGORY`. Note also a **win for our design**: because we resolve most-specific-scope-wins live, we do not need `SYS-075`'s destructive "mass assign by region" routine at all — and we avoid its silent overwrite of per-product overrides.

### D. `MIG-*` — the cutover picture from my range

**What the conversion path can import:** Product Configurator structures (fabric groups/types, bases, grades — all vendor-associated) via `SYS-087`, from STORIS-supplied per-file worksheets. **Product master data goes through a different routine** (`Import Data` for initial conversion, `Import Product Information` for updates) — three separate entry points by data type. Tax rates via `Import External Data` filtered by state (`SYS-073`). Physical inventory counts via `SYS-054`. Per-vendor catalog import policy via `SYS-071`.

**Validation and rejects behavior (consistent across `SYS-054`, `SYS-063`, `SYS-087`):**
- Three-state per-record disposition: **`converted` / `error` / `warning`**, where **`warning` means "imported anyway, with conditions — go check the record yourself."** That is the silent-corruption vector.
- **One important exception proving atomic import is possible:** "**The Configurator conversion process rejects Product records if they are only partially converted. That is, a Product record will never generate a 'warning' message, only 'converted' or 'rejected'**" (`SYS-087`). **STORIS can do all-or-nothing per record; it just doesn't do it uniformly.**
- An **Error Report is generated on every run** and is regenerable later by date/time (`SYS-063`) — but **rejects are a printed report, not durable, re-submittable data.** No rejects table, no fix-and-retry path.
- `SYS-054` gives the best-documented row-level rule set in the pack (10 named errors, exact text) — a good template for how our own validators should report.

**Idempotency — answered, and the answer is bad:**
- **`SYS-087` `Run Conversion` refuses to re-run a file type already converted.** The only way forward is **`Clear File Conversion`, which cascades into related files by an undocumented graph** ("if you choose to clear the `Product` file, the system also clears… `Product Category` and… `Product Group`… Contact your STORIS representative for more information on related files").
- **⇒ The STORIS conversion path is NOT idempotent, NOT resumable, and its reset is destructive with imprecise scope.**
- **Only one routine in all 46 articles is documented as safe to re-run:** `SYS-079` Shift4 Shared Token Load — "**This process can be re-run without any detrimental effects**", cancellable, with partial progress preserved. **That explicit contrast is itself evidence that the others are not.**
- **Cutover planning consequence: budget for full restore-and-retry rehearsal cycles, not incremental fix-ups.** Each iteration needs a freshly restored account. **Part A should confirm `Copy Live Data to Learn Account` (position 15) as the mechanism — our plan depends on making clean copies cheaply and repeatedly.**

**Hard constraints the cutover must respect:**
- **Worksheets must be imported in the documented order** — "Import the worksheets in the order provided. Otherwise, errors can occur" (`SYS-087`).
- **You can only convert into the account you are currently logged into** (`Current Account`, `SYS-087`).
- **Data files must be tab-delimited `.txt`, name ≤ 26 alphanumeric characters** excluding the extension.
- **Template versioning is real and enforced** — `SYS-086`'s spreadsheet carries a version in cell `A1`, headers are used to verify integrity, and a mismatch blocks import. `SYS-087`'s Configurator spreadsheet must be the latest version, downloaded from the STORIS secure site.
- **Explicit vendor warnings that conversions are unsafe against production:** "Running this routine improperly can have **catastrophic results** to data files"; "**If you are already LIVE on the STORIS system, check with STORIS before running any data conversions in your LIVE account.**"

---

## `[DECISION NEEDED]` — consolidated

**Security & audit**
1. **`RPT-AUDIT` scope.** Confirm the audit stream covers, at minimum, every destructive/privileged action catalogued here: all purges, bulk voids (`SYS-062`), time-clock overrides (`SYS-051`), session revocations (`SYS-061`), **all settings changes** (especially retention settings), permission changes, impersonation, sensitive-data encryption/decryption, printer-role changes (`SYS-077`), and DW resync-flag clears (`SYS-065`). *(From `SYS-067`.)*
2. **Are we formally abandoning menu-based access control** in favour of permissions-only, with navigation derived from permissions? This has UX consequences for admins used to curating per-role menus. *(From `SYS-076`.)*
3. **Do administrators get to see what screen a user is currently on?** Real-time per-user activity is useful for support and is also employee surveillance. Recommend last-activity timestamp only. *(From `SYS-061`.)*

**Data retention**
4. **Minimum retention for costing/inventory audit data** — must become a hard floor in code, not a preference. Tax/valuation defensibility argues 7 years. *(From `SYS-056`.)*
5. **GL retention.** Recommend **we do not build a GL purge at all in v1**; partition by fiscal year and archive instead. Needs sign-off. *(From `SYS-057`.)*
6. **Which sensitive data classes do we actually store?** Strong recommendation: tokenize cards, never store SSN/DOB/DL — then most of `SYS-059` evaporates. *(From `SYS-059`, `SYS-078`.)*
7. **Backup RPO and RTO.** A business answer that drives the whole backup/replication design. Note STORIS Cloud offers only **two weeks**, which is too short for an ERP. *(From `SYS-066`, `SYS-069`.)*

**Migration & imports**
8. **Do we accept `warning`-class records on the initial migration, or hard-reject every warning?** Recommend **hard-reject for cutover**, warnings allowed only for ongoing operational imports. `SYS-087` proves atomic-per-record is achievable. *(From `SYS-063`, `SYS-087`.)*
9. **Does LA Mattress use a product configurator** (custom upholstery/fabric grades)? If not, that whole conversion path is out of scope — **but confirm before scoping, because Configurator data has a separate import path and would otherwise be missed entirely.** *(From `SYS-087`.)*
10. **What is the authoritative source of product data — vendor feeds or our catalog?** Determines whether field ownership defaults to `source` or `local`. Recommend `local` wins for merchandising fields (description, price, images, URL), `source` wins for physical attributes. *(From `SYS-071`.)*
11. **Do we allow product deletion at all, or archive-only?** Recommend archive-only — it removes most of `SYS-060`'s eligibility gauntlet. *(From `SYS-060`.)*

**Operations & infrastructure**
12. **Confirm target job infrastructure** (DB-backed queue vs. hosted workers) before speccing period-close — the idempotency guarantee depends on it. *(From `SYS-053`.)*
13. **Maintenance/deploy window policy**, including whether stores in different time zones need per-region windows. STORIS' single global window will not survive multi-region operation. *(From `SYS-070`.)*

**Integrations & business scope**
14. **Do we use a route optimizer at all** (Roadnet / Routeview / ArcLogistics / a modern service)? If not, four "PC Path" screens are dead scope. *(From `SYS-048`.)*
15. **Payment processor and terminal fleet** — which processor, and are terminals cloud-connected or semi-integrated? Determines whether we need device management at all. *(From `SYS-078`.)*
16. **Card-on-file: yes or no?** If yes, it needs a consent/UX review, not just a technical one. *(From `SYS-079`.)*
17. **Tax: engine (Avalara/TaxJar/Vertex) vs. in-house rate tables.** Recommend a tax service. Also confirm whether rates must be **effective-dated** for reprints/credits of old invoices. *(From `SYS-073`.)*
18. **In-ERP time clock, or payroll-system integration?** If payroll owns time & attendance, `Access Time Clock` + `SYS-051` are out of scope. *(From `SYS-051`.)*
19. **Do we sell credit insurance on installment contracts?** If yes it needs its own compliance review — `SYS-072` is nowhere near adequate as a spec. *(From `SYS-072`.)*
20. **Spanish in the ERP UI and/or on customer-facing documents?** Different problems, different owners. Decide early — the `DAT`-vs-`SCR` split (business content vs. UI chrome) only works if designed in from the start. *(From `SYS-086`.)*
21. **Confirm the full `Purchase Status` enum** with part A / the product-settings parts. Only `Dropped` and `Obsolete`/`discontinued` are confirmed across `SYS-060` and `SYS-075`. *(From `SYS-075`.)*

---

## Notes on sources

- **No article in my range contained text directed at the reader as an agent, and nothing attempted to instruct me.** All content was treated as data.
- **Two articles are published in a degraded state** with collapsed/missing per-field descriptions: `SYS-053` Phantom Process Settings and `SYS-071` Select and Configure a Vendor for Import. In both, the **field names are exact** (captured from the rendered field list); the semantics I give are derived from field names plus whatever prose the article does publish, and are marked as such in those entries. Both are worth re-checking against a live system.
- **Label inconsistencies found between article titles and menu paths** (recorded in the relevant entries): `Purge of Sensitive Data` vs. menu `Purge Encrypted Data`; `Set Product Purchase Status by Region` vs. menu `Set Product Status by Region`; `Final Warning` field vs. `Third Warning` in the prose of `SYS-070`; `Review Backup Log` carrying a parenthetical alternate title; `Set Up Terminal Server for a Printer` alternate title `Term Server/Printer Setup`; `Administer Phantom Processes` also known as `Phantom Process Control`.
- **Two near-identically-named physical-inventory review screens** exist in this section — `Physical Inventory Count Review` (`SYS-054`, mine) and `Import Physical Inventory Count Review Screen` (position 37, part A). Worth reconciling between parts.
