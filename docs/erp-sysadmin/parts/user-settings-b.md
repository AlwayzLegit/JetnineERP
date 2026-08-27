# User Settings — Part B (positions 21–39 of the non-"Security" filtered list)

*Section:* STORIS Help Center → System Administration → **User Settings** (`15172979328660`)
*Section total:* 49 articles. *After excluding the 10 whose title contains "Security"* (covered by the
user-security agent): **39 articles**. This part file covers **positions 21–39** in section enumeration
order. Part A covers positions 1–20.

## Split audit — the full filtered list, in enumeration order

**Part A (positions 1–20, NOT in this file):**
1. Attachment Description Entry Screen · 2. Bank to Print Checks by Currency Settings ·
3. Company Settings · 4. Convert Comment Files · 5. Country Settings · 6. Create a User ·
7. Create a User Group · 8. Customer Purge · 9. Customer Service Maintenance - User File ·
10. Description Field - Language Translation Entry · 11. Edit File Attachments ·
12. Foreign Processing Overview · 13. Import Provider Type Settings · 14. Individual Zip Codes ·
15. Installment Credit Approval Limits · 16. Installment Credit Approval Rules ·
17. Insurance Underwriter Settings · 18. Miscellaneous Fee Settings · 19. PC Applications Window ·
20. Protection Plans Overview

**Part B (positions 21–39, THIS FILE) — `USR-021` … `USR-039`:**

| # | Req ID | Title | Article |
|---|---|---|---|
| 21 | USR-021 | Rate Table Settings | 15185859800852 |
| 22 | USR-022 | Reason Code Settings | 15185860705300 |
| 23 | USR-023 | Reason Code Spiff Table | 15185875940756 |
| 24 | USR-024 | Receivable Payment Source Settings | 15185876708756 |
| 25 | USR-025 | Regional Processing - Reporting Rules | 15185859800340 |
| 26 | USR-026 | Regional Processing - Rules, Notes, and Exceptions | 15185875941012 |
| 27 | USR-027 | Remove from Hold & Send via EDI Preferences | 15185860065428 |
| 28 | USR-028 | Restricted Payment Type Select Window | 15185876228244 |
| 29 | USR-029 | RF Barcode User Settings | 15185860063764 |
| 30 | USR-030 | Sales Performance Report | 15185860064404 |
| 31 | USR-031 | Schedule a Process | 15185876708628 |
| 32 | USR-032 | Schedule Daily Reports Preferences | 15185860064020 |
| 33 | USR-033 | Set Domestic Country | 15185876226580 |
| 34 | USR-034 | Tax Jurisdiction Reduction Percent Screen | 15185860067732 |
| 35 | USR-035 | Telephone Mask Settings | 15185860065044 |
| 36 | USR-036 | Track Settings Activity | 15185876708884 |
| 37 | USR-037 | User Defined Settings | 15185860707092 |
| 38 | USR-038 | User Group Clone Process | 15185860228628 |
| 39 | USR-039 | View File Attachments | 15185875552276 |

> **Note on the brief's "particular depth" list.** Most of the named articles (Foreign Processing
> Overview, Bank to Print Checks by Currency, Description Field - Language Translation Entry,
> Edit File Attachments, Attachment Description Entry Screen, Convert Comment Files,
> Individual Zip Codes, Import Provider Type Settings) landed in **positions 1–20 = Part A**, not here.
> The two that fall in this range and get extra depth are **USR-034 Tax Jurisdiction Reduction Percent
> Screen** (geography / tax-jurisdiction) and **USR-039 View File Attachments** (document-attachment
> model, cross-checked against the archive-side filename-collision finding). **USR-033 Set Domestic
> Country** is the multi-currency/foreign-processing hook that survives into this half and carries the
> multi-currency `[DECISION NEEDED]`.

---

### `USR-021` Rate Table Settings
*storis_ref: article 15185859800852*

**Purpose.** Maintains a table of credit-insurance rates **by month number** used to calculate the
insurance fee on an Installment plan. Active **only** for Installment plans whose insurance Type is
`Accident & Health` or `Life`.

**Where it lives.**
- `Extended Receivables > Insurance Code Settings > [Action button] at Rate Table Settings field`
- `Insurance Code Jurisdiction Settings > [Action button] at Rate Table Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Months` | integer | Month number the corresponding rate applies to. Entered **one at a time**; for a 12-month plan you enter months 1–12 individually. |
| `% Rate` | percent | Percentage rate used to calculate the insurance fee for that month. |
| Grid: `Number of Months`, `Percentage Rate` | read-only grid | Shows the accumulated table. |
| `Add` (Plus button) | action | Commits the entered Months/% Rate pair to the grid. |
| `Remove` | action | Deletes the current line. **A confirmation prompt asks whether you want to delete the line.** |

**Behavior & rules.**
- **Hard rule:** the screen is inert unless the parent Installment plan's insurance Type is
  `Accident & Health` or `Life`.
- The table is a discrete per-month lookup, **not** an interpolated curve — every term length you sell
  must have its own row or the fee cannot be computed.
- Rates are jurisdictional in practice: the same screen hangs off *Insurance Code **Jurisdiction**
  Settings*, so the effective rate table is (insurance code × jurisdiction × month).

**Dependencies.** Insurance Code Settings; Insurance Code Jurisdiction Settings; Installment plan
setup; `USR-034` Tax Jurisdiction Reduction Percent Screen shares the jurisdiction dimension.
Insurance Underwriter Settings (Part A, position 17) is the upstream carrier record.

**Build notes.** Credit life / A&H insurance is a **consumer-lending** product. LA Mattress does not
underwrite installment credit in-house — financing is third-party (Synchrony/Acima-style). Model this
as a generic `rate_table(scheme_id, term_months, rate_pct)` only if we ever sell an add-on priced by
term. **`[DECISION NEEDED]`** Do we sell any term-priced add-on (extended protection billed monthly)?
If not, this whole branch (`USR-021`, Insurance Code/Jurisdiction/Underwriter Settings) is
**STORIS legacy we should not rebuild**.

---

### `USR-022` Reason Code Settings
*storis_ref: article 15185860705300*

**Purpose.** Central registry of **reason codes** — the short codes users pick throughout STORIS to
explain why an activity happened (order deleted/returned, product marked As-Is, physical-inventory
write-off, plan closed, delivery charge overridden, …). Codes are created here and consumed everywhere.

**Where it lives.** Reachable from ~17 menu paths, which is itself the point — it is a shared master
file, not a module setting. Representative paths:
- `Customer > Point of Sale > Settings > Reason Code Settings`
- `Customer > Customer Service > Settings > Reason Code Settings`
- `Customer > Electronic Interfaces > Credit Application > Credit Application Settings > Reason Code Settings`
- `Merchandising and Distribution > Settings > Service Settings > Reason Code Settings`
- `Accounting > Receivables > Receivables Settings > Reason Code Settings`
- `Accounting > Settings > Payables Settings | Revolving Receivables Settings | Credit Application Settings > Reason Code Settings`
- `System Administration > Get Started - Enter Your Information > Get Started Step 8 - Sales > Reason Code Settings`
- `System Administration > System Settings > Customer System Settings > Sales and Service System Settings > Reason Code Settings`
- `System Administration > System Settings > Accounting System Settings > Accounts Receivables System Settings | Credit Application Settings | Revolving Receivables Settings > Reason Code Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Reason Code` | code | The code itself (e.g. `CRK` cracked, `CDL` customer did not like, `PHY` physical inventory, `NIL` not in location). |
| `Description` | text | Free-text description. |
| `This Reason is Used for` | enum (drop-down) | **Usage code** that classifies the reason. Where the system demands a reason code, only codes carrying the matching usage code are offered. Values enumerated below. |
| `Status Letter Template` | lookup | Only when usage = `Credit Application`. Optional form letter (e.g. *Credit Conditional Letter*, *Credit Declined Letter*). |
| `Commission Category` | char(5) | Optional commission category code. **Takes precedence over the product-level `Category` field in Advanced Product Settings** when deciding which Commission Settings matrix pays an As-Is product sold under this reason. If blank, the base product's Commission Category is used. |
| `Account Status` | lookup (Search → Read-Only Lookup Window) | Active **only** when usage = `Installment Plan Closure by Customer` or `Installment Plan Closure by Retailer`. Associating an account status makes **cancelling an installment contract auto-update the Metro 2 credit-bureau file with no manual entry**. |
| `Description` (2nd) | display-only | Description of the selected Account Status. |
| `Inventory Adjustments General Ledger Account` | GL account (extra action button → GL Account Entry Screen) | Optional. Active **only** when usage = `Inventory Adjustments`. If blank, the standard *Inventory Adjustment* or *As-Is Writeoff* account is used. |
| `Revolving Balance Adjustments General Ledger Account` | GL account | Active **only** when usage = `Revolving Adjustments`. If blank, the *Revolving Adjustments* account from **General Ledger Assigned Account Settings** is used. |
| `Restrict As-Is Products from being Sold` | checkbox | Checked = As-Is items carrying this reason **cannot be added to a sales order**. |
| `Allow Warranties to be Sold on As-Is Products` | checkbox | Checked = warranties may be linked to As-Is products with this reason. |
| `Include in the Saleable Quantity for Transfer Limits` | checkbox | Checked = this reason's quantity counts toward saleable totals in transfer-limit calculations. |
| `Check As-Is Label Number` | checkbox | Only available when usage = `As-Is`. Checked = products with this reason can be **RF-picked without regard to their serial/reference number** — any as-is piece with the same reason code may be substituted. **Applies to RF picking only; substitution is NOT applicable during prep or staging.** |
| `Actions > Spiff Table` | action | Opens `USR-023` Reason Code Spiff Table. |

**`This Reason is Used for` — exact enum values**

`Not Required` · `Exceptions` · `Credit Application` · `Revolving Adjustments` ·
`Revolving Disputes` · `Revolving Insurance Removed` · `Revolving Plan Closure By Customer` ·
`Revolving Plan Closure By Retailer` · `Installment Receivables Adjustments` ·
`Installment Plan Closure by a Customer` · `Installment Plan Closure by a Retailer` ·
`Line Item Deletion` · `Change of Delivery Charge` · `Obsolete` · `As-Is` ·
`Inventory Adjustments` · `Sales Order to Layaway/Quote Conversion` ·
`Removal of Orders from a Manifest Exception` · `As-Is Restricted`

Meaning of the non-obvious ones:
- `Not Required` — usable anywhere; **these are the only codes that appear in inventory lookup
  drop-down lists.** Required setting for reasons assigned to NIL, Floor Sample, or In Service
  products in Inventory Control Settings.
- `Exceptions` — for exceptions where the "Reason Required" alert option is set (e.g. exceeding
  `Price Variance Percent` in Point of Sale Control Settings).
- `Obsolete` — soft-retirement. **Codes marked Obsolete cannot be used or selected in any process,
  but inventory already carrying the code keeps it and can still be sold.** The documented workaround
  is to create a dedicated Sales Discount Settings discount code for the stranded pieces and apply it
  in Enter a Sales Order.
- `As-Is` — makes the code selectable at the `As-Is Reason` field in Purchase Order Type Settings.
- `Inventory Adjustments` — lets the reason carry its own GL account instead of the standard
  Inventory Adjustment / As-Is Writeoff account. **When this option is selected, only the
  `Description` field below Reason Code remains available.**
- `As-Is Restricted` — only users with the Logistics security permission **"Apply or Remove an As-Is
  Reason Code to Inventory"** (Create a User/Group) — or a manager override — may assign or remove it.

**Behavior & rules.**
- **Hard rule: some reason codes ship with STORIS (e.g. `NIL` = not in location) and cannot be
  deleted.** The program also **blocks deletion of any code that is referenced as a default elsewhere**
  (e.g. Inventory Control Settings).
- Usage code acts as a **type filter on every reason-code picker in the system** — this is the whole
  mechanism. A code with the wrong usage simply will not appear.
- Prompting is driven by *other* settings, not by this screen:
  - `Enter Reason Code For Line Deletion` (Point of Sale Control Settings → Advanced tab) → drives
    `Line Item Deletion`.
  - `Reason Code Required When Converting Sales Order to Layaway/Quote` (Point of Sale Control
    Settings) → drives `Sales Order to Layaway/Quote Conversion`.
  - `Require Reason Code if one or More Orders Removed` (Point of Sale Control Settings) → drives
    `Removal of Orders from a Manifest Exception` during Build a Delivery/Service/Transfer Manifest.
  - `DELIVERY CHARGES - Prompt for Reason Code if Overridden` → drives `Change of Delivery Charge`.
- **Metro 2 side effect:** an Account Status on a plan-closure reason silently writes the consumer
  credit-bureau file on contract cancellation.

**Dependencies.** Inventory Control Settings (Floor Sample / Not in Location / In-Service reason
codes) — see `CFG-INV-*`; Point of Sale Control Settings (`CFG-POS-*`) for every "prompt for reason"
flag; Purchase Order Type Settings (`As-Is Reason`); Advanced Product Settings (`Category`);
Commission Settings; Sales Discount Settings; General Ledger Assigned Account Settings; GL Account
Entry Screen; Legal/Account Status master; Metro 2 export; Logistics permission *Apply or Remove an
As-Is Reason Code to Inventory* (see `parts/user-security-CATALOG.md`). Consumed by `USR-023`.

**Build notes.**
- **Load-bearing.** Build `reason_code` as a first-class master table with a **usage/scope enum** and
  filter every picker by it. This is one of the few STORIS designs worth copying nearly as-is.
- Replace the "delivered codes cannot be deleted" behaviour with a `system_managed` boolean plus a
  proper **referential-integrity check** ("in use by N records — deactivate instead"), and replace
  `Obsolete` with a plain `active` flag + `effective_to` date. STORIS's Obsolete-then-make-a-discount-
  code dance is a workaround for not having soft-delete.
- Keep the **per-reason GL account override** — it is genuinely useful for shrink vs. damage vs. floor
  sample write-offs.
- Keep **`Restrict As-Is Products from being Sold`** and **`Allow Warranties to be Sold on As-Is
  Products`** — both are real mattress-retail rules (we do not want a warranty attached to a damaged
  floor model).
- `Check As-Is Label Number` maps to our serialized/piece-level picking: implement as
  `allow_piece_substitution_within_reason` and make it apply to **all** picking stages, not just RF —
  the STORIS carve-out ("not applicable during prep or staging") is an inconsistency, not a feature.
- **Drop:** `Credit Application`, all `Revolving *`, all `Installment *` usages and the Metro 2 hook —
  we do not carry our own paper. **`[DECISION NEEDED]`** confirm LA Mattress never services in-house
  installment/revolving accounts; if confirmed, delete ~9 of the 19 usage values.
- **Feeds `RPT-AUDIT`:** every reason-code capture is an audit event (who, what record, which code,
  when). STORIS has no general change log; our reason codes should be written to the audit stream,
  and *changes to the reason-code master itself* should be too.

---

### `USR-023` Reason Code Spiff Table
*storis_ref: article 15185875940756*

**Purpose.** Per-reason-code table that awards a salesperson an **extra spiff percentage for selling
As-Is merchandise**, tiered by the gross-profit percentage achieved on the line.

**Where it lives.** `Reason Code Settings > Actions button > Spiff Table`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Spiff %` | percent | Percentage awarded for selling the As-Is item **at or above** the corresponding gross profit percent. **Entered in descending order.** |
| `Gross Profit %` | percent | **Minimum** GP% at or above which the associated Spiff % is awarded. |
| Grid | read-only | Displays Spiff % / Gross Profit % pairs **in descending order**. Double-click a line to edit. |

**Behavior & rules.**
- **Exact calculation:** spiff amount = *the spiff percentage matching the transaction's gross profit
  percentage* × *the gross line extension as normally calculated in STORIS*.
- **This amount is IN ADDITION to any other commission or spiff earned on the transaction** through
  the standard commission and spiff calculations — it stacks, it does not replace.
- Tier match is **"at or above"** the Gross Profit % floor; because rows are held in descending order
  the first matching row wins (highest qualifying tier).
- **Rate changes take effect immediately on update but only affect NEW transactions** — existing
  transactions are not recalculated.

**Dependencies.** `USR-022` Reason Code Settings (parent; only meaningful for `As-Is` usage codes);
Commission Settings matrix; `Commission Category` on the reason code / Advanced Product Settings.

**Build notes.**
- **Load-bearing, and a good idea.** Clearing damaged/floor-sample mattresses at a decent margin is
  exactly the behaviour we want to incentivize. Implement as
  `spiff_tier(reason_code_id, min_gp_pct, spiff_pct)` evaluated as *highest `min_gp_pct` ≤ line GP%*.
- Store the **resolved spiff on the line at write time** (rate + amount + which tier matched), rather
  than recomputing later — STORIS's "changes affect new transactions only" is an accident of not
  snapshotting; we should snapshot deliberately.
- Define GP% precisely up front (STORIS says only "gross profit percentage on the transaction"):
  **`[DECISION NEEDED]`** is the tier keyed on *line* GP% or *order* GP%? The stacking language
  ("gross line extension") implies line-level extension but transaction-level GP%. Pick one and
  document it; this ambiguity is a real commission-dispute generator.
- Additive stacking with base commission must be explicit in our pay model, and spiff must be
  reversible on return/exchange — STORIS documents no clawback here.

---

### `USR-024` Receivable Payment Source Settings
*storis_ref: article 15185876708756*

**Purpose.** Defines, per **remitting organization**, how an inbound customer-payment file is located,
parsed and posted by the **Import Customer Payments** feature. One record per payment source (e.g. a
government benefits payer, a bank bill-pay service).

**Where it lives.** `Accounting > Settings > Revolving Receivables Settings > Payment Agreement Source Settings`
(article title and menu label differ — the screen is reached as *Payment Agreement Source Settings*).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Source` | char(10) alphanumeric, **mandatory** | Source code for the remitting organization. Search button → read-only lookup window. |
| `Name` | char(30) free text, **mandatory** | Name of the company providing the payment data. |
| `Address Line 1` | char(30), optional | |
| `Address Line 2` | char(30), optional | |
| `Zip Code/Postal Code`, `City/Town`, `State/Province` | address | **The labels of these three fields are determined by the prompt settings on the `Masking` tab of Country Settings.** Search button at State/Province → Read-Only Lookup Window. |
| `Telephone` | 10 numeric, optional | |
| `Extension` | 4 numeric, optional | |
| `Contact` | char(30), optional | |
| `Payment Type` | lookup, **mandatory** | Miscellaneous Payment type used when posting. **Hard rule: the payment type entered here must have `Use For Payment Agreement Import` checked.** |
| `Payments Per Month` | enum `1` / `2` / `4`, default `1` | Times per month this source remits for Revolving Payment Agreements. **Used for Revolving Payment Agreements only; for all other processing it is informational.** **If set to `4`, the system does NOT generate weekly MMPs — it generates 4 MMPs with due dates evenly spread through the cycle period.** |
| `Extraction Number` | 4-digit | Selects the extraction program (file layout). **Provided by STORIS for new records; locked and editable only by STORIS for existing records.** **Only `0001` and `0002` are valid for a scheduled process.** |
| `Run Process` | enum `On Demand` (default) / `End of Day` / `Scheduled` / `Both` | When the import runs. Codes referenced elsewhere as `"O"` (On Demand) and `"B"` (Both). |
| `Payment Posting Location` | location, active+mandatory when Run Process = `End of Day` or `Both` | Default location for posting payments during EOD. |
| `File Path Location` | enum `PC` / `NFS`, default `PC` | Where the file lives. **If Generate Daily Reports runs as a background process this MUST be `NFS`, or the Import Customer Payments step is skipped entirely when the NFS file is not found.** If `PC`, the Browse button becomes active. |
| `File Path` | text, **mandatory** | Full directory path, **without** the file name. Example: `C:\PaymentFiles\SocialSecurity`. **Must be a valid path.** |
| `File Name` | text, **mandatory** | **Must be comma-separated (.csv) and the name must include the `.csv` extension.** Example: `socsec.csv`. **The file need not exist at setup time — a message displays but you can still Save.** |
| `Override Legal Code Allow Payments Setting` | checkbox, default unchecked | Unchecked = the import verifies the legal code action **"Allow Payments"** before posting. Checked = **payment posts regardless of how the "Allow Payments" legal action is set.** |

**Extraction program layouts (exact column mapping)**

| Extraction | Purpose | Required spreadsheet columns |
|---|---|---|
| `0001` | Revolving customer payment imports; payments applied against payments due for **specific plans** | A `SOURCE ID`, B `PAYMENT AMOUNT`, C `CUSTOMER ACCOUNT CODE`, D `PAYMENT DATE`, E `PLAN` |
| `0002` | Revolving payments applied using **Auto Pay** | A `SOURCE ID`, B `PAYMENT AMOUNT`, C `CUSTOMER ACCOUNT CODE` |
| `0003` | **Installment** payments via Auto Pay or applied to specific contracts | A `SOURCE ID`, B `PAYMENT AMOUNT`, C `CUSTOMER ACCOUNT CODE`, E `CONTRACT` (note: **column D is skipped**) |
| `0004` | CBIC bank files received via Online (web) Bill Pay. Structure: **single Header record, multiple Detail 1 records, multiple Detail 2 records, single Trailer record.** |

**Behavior & rules.**
- **Hard rule:** when the `Misapply Payments` check box in Import Customer Payments is checked, the
  import can **only** run On Demand — so `Run Process` must be `O` (On Demand) or `B` (Both).
- **Hard rule:** when creating a source code for a **scheduled** process, `File Path Location` must be
  `NFS` and `Extraction Number` must be `0001` or `0002`.
- The file layouts are **positional by spreadsheet column letter**, with no header row contract and
  `0003` deliberately leaving column D empty. Fragile by construction.
- The customer is matched by `CUSTOMER ACCOUNT CODE` — no name/amount reconciliation is described,
  and no duplicate-file detection is described beyond "an un-posted payment file".

**Dependencies.** Import Customer Payments; Miscellaneous Payment Type settings (`Use For Payment
Agreement Import` flag); Country Settings → `Masking` tab (drives address field labels — see Part A
position 5); Legal Code Settings (`Allow Payments` action); Generate Daily Reports / EOD;
`USR-031` Schedule a Process (for `Run Process = Scheduled`); `USR-032` Schedule Daily Reports
Preferences; location master.

**Build notes.**
- **Mostly STORIS legacy.** The revolving/installment plumbing is not ours. But the *shape* —
  a per-remitter inbound-payment-file profile — is directly relevant to **third-party financing
  settlement files** (Synchrony, Affirm, Acima, Progressive) and to **bank lockbox / ACH returns**.
- Rebuild as `payment_import_source` with: source code, remitter identity, target tender type,
  a **named parser** (not a STORIS-assigned magic 4-digit number), a transport (SFTP/S3/mailbox — not
  `PC` vs `NFS`), a schedule, and a posting location.
- **Do differently:** (a) parse by **header name**, not column letter; (b) require a **file-level
  idempotency key** (hash + remitter + business date) so a re-dropped file cannot double-post —
  STORIS has no such control; (c) land every row in a staging table with match status, never
  post-and-hope; (d) an unmatched-payment suspense account instead of "misapply payments".
- **`Override Legal Code Allow Payments Setting` is a compliance bypass** (it posts money against an
  account flagged as not permitted to take payments). If we implement anything like it, it must be
  permissioned and **must emit an `RPT-AUDIT` event** on every use. STORIS logs nothing.
- **`[DECISION NEEDED]`** Do we take any inbound remittance file at all in phase 1, or is all
  settlement handled by the processor's own reporting? If the latter, defer this entirely.

---
### `USR-025` Regional Processing - Reporting Rules
*storis_ref: article 15185859800340*

**Purpose.** Narrative specification of how **Region / District / Location run-time prompts behave in
report routines** once Regional Processing is enabled, plus the list of reports that deliberately
break the rules. Not a settings screen — a behavioural contract.

**Where it lives.** Reference article under System Administration → User Settings. The switch it
describes lives in **General System Control Settings → Regional Processing**.

**Fields.** None — no data entry screen. The behaviour governs the `Region`/`District` and `Location`
run-time prompts that appear on report routines.

**Behavior & rules.**
- **Hard rule: all Region/District prompts in report routines are inactive unless Regional Processing
  is turned on in General System Control Settings.**
- **Hard rule: Region/District prompts are inactive if the logged-on user is restricted to a store or
  a list of locations.**
- **Hard rule: the District/Region prompt and the Location prompt are mutually exclusive — only one
  can be active at a time.**
- Resolution for an **unrestricted** user:
  - District/Region prompt blank → Location prompt accessible; **all warehouses** listed; normally
    one, several, or all selectable.
  - Location prompt blank → District/Region prompt accessible; **all districts/regions** listed;
    normally one, several, or all selectable.
- Resolution for a user **restricted to a single region/district**: the Region/District prompt is
  inactivated; the Location prompt's Arrow exposes **all locations within that region/district**.
- Resolution for a user **restricted to their log-on location**: no selection at all — Region/District
  inactive, only the log-in location available.
- Resolution for a user set up with a **specific list of locations** (at staff level *or* warehouse
  location level): Region/District inactivated; the Location drop-down offers only the list.
- "All Locations" (meaning all locations available to *you*) requires a three-click path:
  `Action button at the field → Multiple Location Selection Window → Search button at Location field
  → Multiple Selection Lookup Window → Select All`.

**Documented report exceptions — these do NOT follow the rules**

| Report / process | Deviation |
|---|---|
| `Report Open Sales Order Summary` (Open Order Report by Header) and `Report Open Sales Order Detail` (by Line Item) | **Always follow sales restrictions (district)** regardless of whether Sort By is Selling location, Ship-from location, or Stocking location. |
| `Report Sales Orders with Delivery Dates in Jeopardy` (Broken Promises) | **Regular orders:** location type is *forced* to stock location, so selection is based on **inventory restrictions (regional)**. **Special orders:** you may pick stock or selling location, but **the system follows sales restrictions (district) either way** — the choice is cosmetic. |
| `Product Performance and Purchase Recommendations` (Full Buyers Worksheet) | **Does not honor location-list restrictions.** With Regional Processing active you must have **regional** access to run it. |
| `Report Open To Buy Information` | Same — no location-list honoring; requires regional access. |
| `Automatic Purchase Order Replenishment` | Same — no location-list honoring; requires regional access. |
| `Report Reconciliation of Inventory to GL Values` | **Requires access to ALL locations.** |

**Dependencies.** General System Control Settings → `Regional Processing` flag (the master switch;
note the parallel with **Extended Security** being a single global kill-switch — same anti-pattern);
Create a User / User Group location & region/district restrictions
(`parts/user-security-CATALOG.md`); Warehouse/Store Location Settings (location lists);
`USR-026` (the entry/inquiry-side companion to this article).

**Build notes.**
- **The rules are load-bearing; the implementation is not.** We need report scoping by
  location/region — but as a **single resolved "locations I may see" set**, computed once from the
  user's scope, not as two mutually-exclusive prompts whose availability flips based on how the user
  was restricted. The mutual exclusion of District/Region vs Location is a UI hack around a missing
  set-based model.
- Build one function `visible_locations(user, purpose)` where `purpose ∈ {SALES, INVENTORY}` — STORIS
  really has two parallel scopes (**district = sales**, **region = inventory**) and the exceptions
  above are all about which one a given report silently uses. Make that choice **explicit and
  displayed on the report header**, never implicit.
- **Every one of the six exceptions above is a bug we should not port.** A report that ignores the
  user's location list is a data-leak: Full Buyers Worksheet, Open To Buy, and Auto PO Replenishment
  all show company-wide data to anyone with "regional access". Our rule: **no report may return rows
  outside `visible_locations(user)`; if a routine genuinely needs company-wide data, it gets its own
  permission, not a silent bypass.**
- `Report Reconciliation of Inventory to GL Values` requiring all-locations access is legitimate — it
  is a control report. Model it as a permission (`RPT_INV_GL_RECON`), not as an implicit scope test.
- Add these to `RPT-AUDIT`: report executions that ran under an elevated/company-wide scope.

---

### `USR-026` Regional Processing - Rules, Notes, and Exceptions
*storis_ref: article 15185875941012*

**Purpose.** The companion narrative to `USR-025`, covering **entry and inquiry** screens rather than
reports: the restriction hierarchy, product-level regional restriction, and a long list of documented
places where restrictions are deliberately not enforced.

**Where it lives.** Reference article; governed by **General System Control Settings** and the
**Create a User** file.

**Fields.** None (narrative). Referenced settings:

| Setting | Where | Effect |
|---|---|---|
| `Regional Processing` | General System Control Settings | Master switch for region/district restriction. |
| `Restrict Product Use/Lookup by Region` | General System Control Settings | Enables per-product regional gating. |
| `Limit Use by Region` | Advanced Product Settings (per product) | Regions in which the product may be used. **A user's log-on region must match one of these to access the product.** |
| `Restrict Inter-Regional Transfers` / `Restrict Inter-Region Transfers` | General System Control Settings | Blocks saving a line / creating a transfer when from- and to-locations are in different regions. |
| Location restriction option | Create a User file | **Works even if Regional Processing is not active.** |

**Behavior & rules.**
- **Cloud/SaaS caveat: "Regional Processing restriction by district or region is not available to
  Cloud users."** SaaS customers get the location-restriction feature and regional/district pricing
  instead. **This is a hard platform limitation, not a configuration choice.**
- **The restriction hierarchy** (same for sales/district and inventory/region entries and inquiries),
  evaluated in order:
  1. Create a User indicates **no restrictions** → no further checking, nothing enforced.
  2. Create a User indicates **store restriction** → location-sensitive functions permitted for the
     **current log-on location only**.
  3. Create a User indicates **regional/district restriction** *and* the Regional Processing flag is
     set → permitted only when associated with the **current log-on region/district**.
  4. Create a User indicates the user is associated with a **list of locations**:
     a. If a list is named on the Create a User record → only those locations.
     b. **If no list name is on the user record, the Warehouse record for the current log-on location
        is checked for a list; if found, that list applies.** (Implicit fallback — the user's
        effective scope can change by logging on at a different store.)
- **Documented bypasses and exceptions (each one is a hole in the model):**
  - **Entering a known customer code at the `Customer` field overrides region/district AND location
    restrictions.** Stated plainly as an override.
  - `Customer Buy History` **accessed via Customer Return or Exchange** shows completed orders for the
    customer **regardless of Regional Processing restrictions and regardless of selling store**. The
    same report reached from the menu *does* respect restrictions. **Same report, two answers.**
  - Default ship/stock location is derived from **the zip code record on the customer's ship-to zip
    code settings**; **if that location is not on the user's available-locations list the system adds
    it temporarily.** For service orders the **service location is likewise derived from the
    customer's zip code**. But **if stock and ship locations are in different regions and
    `Restrict Inter-Regional Transfers` is set, the item cannot be saved.**
  - You may view/edit **any existing sales order** if you have access to **any one** of its associated
    locations — written, stocking, ship-from, or pick-up. **Regional and district access are combined
    (union) for this check.**
  - **On opening an existing sale, memo, or service order, ALL of its locations (selling, stock,
    ship/service) are added to the session's valid-location list regardless of the user's access.**
    Scope creep persists for the whole session.
  - If Sales Order System Control Settings does not default customer pickup location to store
    location, and the customer's default delivery location is outside the selling store's region, the
    **customer's shipping location defaults as both stock and ship location**.
  - **Customer Return Drop-Off:** if the system-determined return location is unavailable to the user,
    the return location **defaults to the selling store**.
  - **Customer service entry performs NO validation** that the document's location matches the service
    location in the user's staff record; that staff location is used only by the **Tickle** auto-assign
    process.
  - **Service-location resolution hierarchy for Enter a Service Order, applied *regardless of user
    access restrictions*:** (1) service location associated with the customer's zip code → (2) if
    Regional Processing is active, the **Regional** service location based on the customer's zip code
    → (3) the service location associated with the **writing store** → (4) if Regional Processing is
    active, the **Regional** service location based on the writing store → (5) the service location
    defined in **Service Control Settings**.
  - **COG (customer's own goods) documents enforce NO access restrictions at all** — creatable
    from/to any location.
  - `Container Receiving`: you can finish another user's batch by entering their initials, but
    **location validation is always done against the logged-on user's access** — a batch whose
    receiving location is off your list is denied. If the named operator has no open batches, a new
    one is created under **your** restrictions.
  - **Inventory transfers: you need access to the transfer-FROM location only. Any transfer-TO
    location is permitted regardless of access** — unless `Restrict Inter-Region Transfers` is on.
  - You may update any existing transfer if you have access to **either** endpoint.
  - `Print all Delivery Tickets` and `Report Transfers by Location` have **mandatory** From/To
    location run-time options and explicitly permit all three combinations, including
    **From locations the user has NO access to → To locations the user has access to**.
  - **`Warehouse/Store Location Settings` cannot be location-restricted at all.**
  - **Inquiries display inaccessible locations anyway** (e.g. a sales order where you have the selling
    store but not the stocking location). Multi-customer processes such as a **finance receivables
    batch report all information ignoring every restriction**.
  - **Physical Inventory routines are entirely unaffected by Regional Processing.**
  - **`Costing Table Inquiry`: header info (including freight and landed add-ons) follows standard
    regional rules, but the detail grid is COMPLETELY UNFILTERED by location.** STORIS's stated
    justification: *"STORIS assumes the individual who would typically be reviewing this information
    would not be restricted."* **This is an assumption, not a control.**

**Dependencies.** General System Control Settings (`Regional Processing`,
`Restrict Product Use/Lookup by Region`, `Restrict Inter-Regional Transfers`); Create a User /
User Group (`parts/user-security-CATALOG.md`); Warehouse/Store Location Settings (location lists);
Advanced Product Settings (`Limit Use by Region`); zip-code master (ship/stock/service location
derivation — the geography hook, cf. *Individual Zip Codes*, Part A position 14); Sales Order System
Control Settings; Service Control Settings; Tickle auto-assign; Container Receiving; Costing Table
Inquiry; `USR-025`.

**Build notes.**
- **The requirement is load-bearing; the STORIS implementation is a cautionary tale.** Multi-location
  scoping is real for us (warehouse + showrooms + delivery hubs). But this article documents at least
  **fourteen distinct bypasses** of the scoping model, several of which leak company-wide data.
- Design rule for us: **one resolver, no bypasses.** `visible_locations(user, purpose)` is computed
  once per request and applied in the data layer, not screen by screen. Anything that legitimately
  needs wider scope gets an **explicit named permission** and an `RPT-AUDIT` entry.
- **Explicitly reject these STORIS behaviours:**
  - Session-scope expansion ("opening a document adds its locations to your valid list for the
    session") — a privilege-escalation-by-navigation pattern.
  - "Entering a customer code overrides all restrictions."
  - The same report returning different row sets depending on entry point (Customer Buy History).
  - Unfiltered Costing Table detail justified by an assumption about who reads it. **Costing is
    exactly where we must be strict** — landed cost is competitively sensitive.
  - Transfers requiring only from-location access.
- **Keep** the idea of **two scope purposes** (sales vs inventory) but make it a declared attribute of
  each screen/report, surfaced in the UI.
- **Keep** the zip-code-derived default ship/stock/service location — it is genuinely useful and ties
  to our delivery-zone model — but **never let it silently widen a user's scope**; instead show
  "assigned to <location> (outside your locations)" and require a permission to save.
- The **implicit fallback to the warehouse record's location list when the user record has none**
  makes a user's effective scope depend on where they logged in. **`[DECISION NEEDED]`** We should
  make scope a property of the *user's assignment*, not of the terminal/store they logged into —
  confirm no LA Mattress workflow depends on roaming staff picking up store-local scope.
- The **Cloud/SaaS limitation** ("regional restriction not available to Cloud users") is a strong
  signal that STORIS itself treats regional processing as legacy. Do not model region *and* district
  *and* location lists; model a **location hierarchy** (`company > region > district > location`) with
  scope granted at any node. That single change collapses hierarchy levels 2–4 above.

---
### `USR-027` Remove from Hold & Send via EDI Preferences
*storis_ref: article 15185860065428*

**Purpose.** Run-time parameter screen for the **scheduled** "Remove from Hold & Send via EDI" process
— it selects which held purchase orders get released from hold and transmitted to the vendor by EDI.

**Where it lives.** Article's `Access` block is **empty in the source** (no menu path published).
Reached during scheduled-process creation — see `USR-031` Schedule a Process.

**Fields** *(article lists the parameter names only — no descriptions are published; treated as a
near-stub)*

| Field | Type | Purpose / business rule |
|---|---|---|
| `Earliest Date`, `Latest Date` | date range | Bounds the POs considered. |
| `Buyer` | selection | Filter by buyer. |
| `Vendor` | selection | Filter by vendor. |
| `Receiving Location` | selection | Filter by destination location. |
| `Selling Store` | selection | Filter by the store that wrote the demand. |
| `Minimum Deposit Met` | flag | Include POs whose linked customer deposit threshold **is** met. |
| `Minimum Deposit Not Met` | flag | Include POs whose deposit threshold is **not** met. |
| `Inventory Purchase Orders` | flag | Include stock POs. |
| `Service Purchase Orders` | flag | Include service POs. |
| `Terms Code` | selection | Filter by vendor terms code. |

**Behavior & rules.**
- **Hard rule (the only rule the article states): "these preferences must be set during the creation
  of the scheduled process."** They cannot be edited afterwards through this screen — the scheduled
  process must be recreated to change them.
- The `Minimum Deposit Met` / `Minimum Deposit Not Met` pair is the business core: **special-order POs
  are held until the customer's deposit clears**, and this job is what releases them. Exposing "Not
  Met" as a selectable option means the hold can be **overridden in bulk, unattended, on a schedule**.
- Article is thin: field descriptions are not published, and the `Access` section is empty.

**Dependencies.** `USR-031` Schedule a Process (this is one of its parameter screens); PO hold logic /
`Minimum Deposit` settings in Point of Sale or Purchasing control settings; EDI vendor configuration;
Terms Code master (a settings scope named in the wave-1 cross-reference list: `TERMS_CODE`);
`VENDOR_*` scopes; buyer master; location master.

**Build notes.**
- **Load-bearing in concept, but as a *rule*, not a *batch job*.** We should release a special-order
  PO the moment its deposit condition is satisfied (event-driven), not on a nightly sweep. Model it as
  `po_release_policy` evaluated on deposit posting, with the batch sweep only as a safety net.
- **Do differently:** parameters must be **editable after creation**. STORIS's "set at creation only"
  is a data-model limitation that forces operators to delete and rebuild schedules — and destroys the
  job's history.
- **`Minimum Deposit Not Met` must be permissioned and audited** (`RPT-AUDIT`). Bulk-releasing POs for
  undeposited orders is how a retailer ends up owning unsold special-order inventory.
- EDI to vendors is **`[DECISION NEEDED]`** for LA Mattress — do any of our suppliers (Serta/Simmons/
  Tempur/Ashley-class vendors do) actually take EDI 850s, or do we send PDFs/portal orders? If it is
  portal/email, this article is **STORIS legacy we should not rebuild** and only the deposit-release
  rule survives.

---

### `USR-028` Restricted Payment Type Select Window
*storis_ref: article 15185876228244*

**Purpose.** A **Multiple Selection Window** used to pick the payment types that a given **user or
user group is forbidden to use** when applying money to orders. It is a deny-list attached to the
security record, not a settings screen of its own.

**Where it lives.** Article's `Access` block is **empty in the source**. Reached from the
Create a User / Create a User Group security record, at the *Restricted Payment Types* setting.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (multi-select list of Payment Type settings) | multi-select | The payment types this user/group **may not** apply. |

**Behavior & rules.**
- **Hard rule: this is a DENY list, not an allow list.** Anything not selected is permitted — a new
  payment type added later is automatically available to everyone until someone remembers to add it
  to every restricted user's list.
- **Enforcement point:** *"When the operator selects a restricted payment type during payment
  processing, a message displays and the operator is prevented from applying the payment to this
  type."* The restricted type is **still shown in the picker** — the block happens after selection,
  not by filtering the list.
- Like every other per-user permission in STORIS, this is **inert unless Extended Security is enabled
  globally** in General System Control Settings (wave-1 cross-reference), and because group
  permissions are a **copy-down template**, changing the group's restricted list does **not**
  retroactively change users already created from it.
- Article is thin — one paragraph, no field table, no menu path.

**Dependencies.** Create a User / Create a User Group (`parts/user-security-CATALOG.md`);
Payment Type / Miscellaneous Payment Type settings master; General System Control Settings →
Extended Security; Point of Sale payment application; `USR-038` User Group Clone Process (which is how
the copy-down actually happens).

**Build notes.**
- **Load-bearing.** Restricting who can take which tender is a real control (cash handling, house
  accounts, manual card entry, gift-card issuance, "write-off" tenders).
- **Do differently, three ways:**
  1. **Allow-list by default, not deny-list.** New tenders should be unavailable until granted. A
     deny-list silently fails open every time we add a payment method.
  2. **Filter the picker.** Do not show a tender the user cannot use and then reject it — that is a
     bad UX and it leaks the existence of tenders to staff who should not know about them.
  3. **Live evaluation** at the most specific scope (user > role > store > company), per the wave-1
     decision to replace STORIS's copy-down group templates.
- Tie into the resolver scopes already registered; tender permissions should be resolvable per
  `COMPANY` and per location as well as per user (e.g. only the flagship store may take a house
  charge).
- **Feeds `RPT-AUDIT`:** blocked-tender attempts are a genuine loss-prevention signal and should be
  logged, with the manager-override path (if we add one) logged separately.

---
### `USR-029` RF Barcode User Settings
*storis_ref: article 15185860063764*

**Purpose.** Per-user preference record for **RF (Radio Frequency) bar-code processing** — it tells
the handheld what this operator is allowed to pick and how their picking session is scheduled.

**Where it lives.** Article's `Access` block is **empty in the source**.
**Hard gate: "This screen is available only if you have purchased and activated either the Radio
Frequency (RF) Bar Code module or the Pocket SP Palm Pilot interface."** — a licensed module.

**Fields** *(article publishes field names only, no descriptions — near-stub; meanings below are
inferred from the field names and marked as such)*

| Field | Type | Purpose / business rule |
|---|---|---|
| `User ID` | key | The user this RF profile belongs to. |
| `Barcode User Type` | enum | Class of RF operator (picker / receiver / counter — *inferred*). |
| `AWM Scheduling` | flag | Participate in **Automated Warehouse Management** scheduling. |
| `Pick Customer Pickups` | flag | May pick customer-pickup orders. |
| `Pick Transfers` | flag | May pick inter-location transfers. |
| `Pick Store Deliveries` | flag | May pick store-delivery orders. |
| `AWM Schedule Only` | flag | Restrict the operator to AWM-scheduled work only (no ad-hoc picking) — *inferred*. |
| `Allow Multiple Locations` | flag | May work across more than one location in a session. |
| `Default Schedule Extension ___ Hours` | numeric (hours) | How far the operator's schedule is auto-extended. |
| `Default Schedule Name` | lookup | Schedule template applied by default. |
| `Picking Location` — `Starting`, `Ending` | bin/location range | Bounds the pick path this operator is assigned. |
| `Drop-Off` | location | Default drop-off / staging location for picked goods. |

**Behavior & rules.**
- Article is thin — a field list with no descriptions and no menu path. Related article referenced:
  *RF Bar Code FAQs*.
- The three `Pick *` flags (`Customer Pickups`, `Transfers`, `Store Deliveries`) are a **work-type
  allow-list**, in contrast to the deny-list style of `USR-028`.
- `Picking Location Starting/Ending` implies picking is **zoned by contiguous location range**, not by
  arbitrary set — a constraint we should not inherit.
- Interacts with `USR-022`: the `Check As-Is Label Number` reason-code flag changes RF picking
  behaviour (serial/reference substitution) **during RF picking only**.

**Dependencies.** RF Bar Code / Pocket SP module licence; AWM (Automated Warehouse Management)
scheduling; Warehouse/Store Location Settings (bin/location structure); Create a User (`User ID`);
`USR-022` Reason Code Settings (`Check As-Is Label Number`); `USR-026` (location access rules apply
to picking).

**Build notes.**
- **Load-bearing.** Mattress fulfillment is bulky-goods picking with staging and dock scheduling;
  we need an operator profile for handheld/tablet warehouse users.
- **Do differently:** (a) work types should be a **set of granted capabilities**, resolvable per user
  and per warehouse, not a fixed trio of checkboxes; (b) pick zones should be an **arbitrary set of
  zones/bins**, not a Starting/Ending range — mattress warehouses are not linearly numbered; (c) drop
  themPalm-Pilot-era licensing gate entirely — handhelds are just authenticated web clients for us.
- Merge this record into the general user profile as a `warehouse_profile` sub-object rather than a
  separate settings screen; STORIS separates it only because it shipped as a bolt-on module.
- **`[DECISION NEEDED]`** Do we run scheduled/AWM-style wave picking, or pick on demand per delivery
  manifest? If on-demand, `AWM Scheduling`, `AWM Schedule Only`, `Default Schedule Extension`, and
  `Default Schedule Name` are all **STORIS legacy we should not rebuild**.

---

### `USR-030` Sales Performance Report
*storis_ref: article 15185860064404*

**Purpose.** Cumulative **written-sales performance by salesperson**, at document-header level, over a
date range — orders, dollars, averages, attach rates for warranty/protection plans, delivery &
installation dollars, spiff, and orders-per-hour.

**Where it lives.** Article's `Access` block is empty. **Hard rule: "runs only as a Scheduled Process
— it is not available on a menu."** Configured via `USR-031` Schedule a Process.

**Data sources.** *"It uses the `ORDER` and `INVOICE.HOLD` files as the primary source of data."*

**Document types included:** `Sales` · `Multi-Ship Sub-documents` · `Layaways` · `Returns` ·
`Exchanges`. **Returns reduce the cumulative values for each salesperson.**
**Excluded:** `Dollar Adjustments` and `Sales Quotes`.

**Run-time parameters**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Date Code` | enum | Relative date-range selector for the scheduled run. |
| `Start Date` | date | |
| `End Date` | date | |
| `District` | selection | Subject to Regional Processing rules — see `USR-025`. |
| `Location` | selection | Mutually exclusive with District — see `USR-025`. |
| `Sales Department` | selection | Sort/filter level. |
| `Hours Worked` | numeric | **Divisor for the `Orders per Hour` column** — supplied as a report parameter, not sourced from a timeclock. |

**Output & sort**

- **Output is email only. "Standard output options are not available."** Format is **plain text or
  HTML depending on the recipient's `Email Preference` setting in the User file** — i.e. the format is
  a property of the *reader*, not of the report.
- Sort order: `District` (if applicable) → `Location` → `Sales Department` → `Salesperson Code`.
- **Total averages print at each sort break except Salesperson Code**, which is the detail level.
  Total averages also print at the end.
- One detail line per salesperson = cumulative data for the date range.

**Columns, in exact order, with exact definitions**

| # | Column | Definition |
|---|---|---|
| 1 | `Salesperson Code` | |
| 2 | `Salesperson Name` | |
| 3 | `Number of Orders` | Total number of documents (**all types**) for the salesperson. |
| 4 | `Order Dollars` | Total order **merchandise** dollars — **not including Delivery, Installation, Taxes or Miscellaneous Fees**. |
| 5 | `Average Dollars` | `Order Dollars ÷ Number of Orders`. |
| 6 | `Average Lines` | Average lines per order, **2 decimal places**. **Hard Kit Masters are NOT counted. Non-Inventory lines ARE counted.** |
| 7 | `Quantity` | Total pieces. **Hard Kit Masters NOT counted. Non-Inventory lines ARE counted.** |
| 8 | `Warranty Dollars` | Total warranty (furniture protection) dollars. **Identified by a warranty linkage to another line (`OI.WARR.LINK.TO`) or unlinked third-party warranty data (`OI.WARR.DATA`).** |
| 9 | `Warranty Percentage` | `Warranty Dollars ÷ Order Dollars`, 2 dp. **Note the denominator INCLUDES Warranty Dollars.** |
| 10 | `Plan Dollars` | Total warranty **and/or** protection-plan dollars. **For orders containing both, the information is combined.** |
| 11 | `Plan Percentage` | `Warranty or Protection Plan Dollars ÷ Order Dollars`, 2 dp; **denominator includes Warranty and/or Protection Plan Dollars**. Combined when both present. |
| 12 | `Delivery & Installation` | Total D&I dollars. **When run for Delivered, taken from the Invoice header** (the invoiced amount). Otherwise **taken from the Order header and combined with an Invoice header if a partial completion exists written on the same date** — this exists to handle **delivery charges assessed on back-orders**. |
| 13 | `Spiff` | Total spiff, **calculated as if the order were completed**. **Includes spiffs but NOT commissions.** |
| 14 | `Orders per Hour` | `Number of Orders ÷ Hours Worked`, 2 dp. |

**Behavior & rules.**
- **Dollar amounts are calculated on the salesperson split percentage. Quantity and Average Lines
  columns are based on ACTUAL values and NOT the split percentage.** *(So on a split sale, dollars are
  divided but piece counts and line averages are double-counted across both salespeople — attach-rate
  and units-per-ticket metrics are inflated on split tickets. This is a real, unflagged inconsistency.)*
- **"Because this report is intended to represent sales performance, it reports on written sales, not
  delivered."**
- **Hard warning, quoted: the report is based on the CURRENT state of open orders, so running it for a
  past date does not reflect that date.** Additions, deletions and line changes hit the live files and
  **are not tracked**. Writing and reporting an order on day 1, then changing a line on day 2, changes
  the day-1 figures. **Voiding an order removes it from written amounts entirely, retroactively.**
- `Warranty Percentage` and `Plan Percentage` use a denominator that **contains the numerator**, so
  they are share-of-total, not attach-to-merchandise ratios. Do not compare them to an
  attach rate computed the usual way.

**Dependencies.** `USR-031` Schedule a Process (only way to run it); User file `Email Preference`
(determines plain-text vs HTML); `USR-025`/`USR-026` Regional Processing (District/Location prompts);
Sales Department master; salesperson split logic; warranty/protection-plan linkage
(`OI.WARR.LINK.TO`, `OI.WARR.DATA`); Commission/Spiff engine including `USR-023`;
`USR-032` Schedule Daily Reports Preferences.

**Build notes.**
- **Load-bearing metric set — rebuild the report, reject the mechanics.** Salesperson dollars, average
  ticket, units per ticket, protection-plan attach rate, delivery revenue and spiff are exactly the
  LA Mattress sales-floor KPIs.
- **Do differently, and this is the most important build note in this part file:** STORIS computes
  history from **live mutable order records**, so yesterday's numbers change overnight. We must compute
  sales performance from an **immutable daily snapshot / event ledger** (order-written events with
  effective dates), so a past-dated report is reproducible. This is also what makes commission
  disputes resolvable.
- Fix the **split-percentage inconsistency**: apply the split consistently to dollars *and* units, or
  report both "credited" and "participated" measures explicitly as separate columns.
- Redefine attach rate properly: `protection_plan_dollars ÷ merchandise_dollars_excluding_plans`. Keep
  STORIS's version only if we need continuity with legacy numbers — and if so, label it distinctly.
- **`Hours Worked` as a manual report parameter is unacceptable** — Orders per Hour is then whatever
  the person scheduling the report typed. Source it from the scheduling/timeclock system or drop the
  column.
- Email-only output with format chosen by the recipient's profile is a limitation, not a design.
  Ours: a dashboard first, with scheduled email/PDF/CSV as an option.
- **`[DECISION NEEDED]`** Does LA Mattress pay on **written** or **delivered**? STORIS reports written
  here but computes Delivery & Installation from invoices when run for Delivered — a hybrid. Our
  commission basis must be a single, documented, auditable choice.

---
### `USR-031` Schedule a Process
*storis_ref: article 15185876708628*

**Purpose.** The system-wide **job scheduler**. Schedules STORIS processes to run automatically at
user-defined dates and times, one or more times a day, each occurrence with its own run-time options
and its own schedule, and optionally emails the results to users or user groups.

**Where it lives.** `System Administration > System Tools > Schedule a Process`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Description` | code + Search | Code of the scheduled process. Selecting an existing one loads it below for editing. **For processes created via Create a Report, the name shown in the grid comes from the `Description` setting in Create a Report.** |
| `Process` | enum (very large — see catalogue below) | The STORIS process to schedule. |
| `Type` | enum `Day of Week` / `Date of Month` | Kind of schedule entry. |
| `Day` | multi-select | Inactive until `Type` is set. Then days of week, or days of month **1–31**. **If 29, 30 or 31 is chosen and a month is shorter, a warning displays that the occurrence will fall on the last day of that month.** |
| `Time` | `HHMM (0000-2359)` **military time** | Time of day. Action button offers `Multiple Times` (several runs on the selected day(s)) and `Specify Interval` (repeat at an interval within a time period). |
| `Run as User` | user initials | Identity the process runs as. **Accepts ANY valid user ID.** Also stamps audit comments and message logs. **If blank, the initials of the user who launched the Process Scheduler are used.** For `Schedule Daily Reports` / `Generate Monthly Reports` it sets the operator initials in audit comments and the `Creator` in Review Archived Reports; **if blank there, the Schedule a Process ID is used instead.** |
| `Send Output To` | user codes (Action/Search → multi-select) | Recipients of the process output. **Only available for `View Summary of Sales Activity` and `Sales Performance Report`.** **If a chosen user has no email address a warning appears but you may proceed — the process then silently skips that user.** |
| `Send Completion Notification To` | email address(es); extra action for multiple | Completion email. **Active for scheduled processes created through Create a Report — and for those, `Output Settings` is inactive and the only output type is `Report Archive`.** |
| `Report Only If Errors` | checkbox | Notify only on error. **Active only for data import processes.** |
| Grid | days + times | Editable by double-click. **Initially in entry order; after save it re-sorts by days of week by time, then days of month, then time.** |
| `Actions > Enter Process Preferences` | action | Opens the selected process's pre-screen to set run-time options. |

**Behavior & rules.**
- **Hard prerequisite: nothing runs unless the Process Scheduler phantom is launched** — see the
  `Start Scheduler Phantom` field in **General System Control Settings**. Scheduled jobs execute as
  **phantoms** (background processes).
- **Security warning quoted verbatim from the article:** *"This process allows you to send process
  results via email to selected users. STORIS recommends that prior to scheduling processes, you
  ensure your settings do not cause the process to distribute sensitive data to undesired users."*
  **This is the whole control — a recommendation. There is no enforcement.**
- **`Run as User` accepts any valid user ID** — i.e. a scheduler operator can execute a process under
  another user's identity, and that identity is what lands in the audit comments and the `Creator`
  column of Review Archived Reports. **This is an impersonation primitive with no stated permission
  gate.**
- Only reports with **`Add to Schedule a Process` checked in Create a Report** appear here.
- Preferences for a scheduled process are reached only via `Actions > Enter Process Preferences`.
  **Security restrictions may prevent some users from opening the preferences window, and data
  restrictions (e.g. costing data) still apply per Create a User / Create a User Group.**
- **Data-import concurrency rule:** at the scheduled time the system looks for the import file per
  `Automated Data Import Settings`, **checks that another product / district-and-regional-product /
  kit-master import is not already running**, and only then runs. **Processed files are renamed
  afterwards so they cannot be processed again.**
- Import error data is regenerated via `Report Data Import Errors and Warnings` (under Import Data)
  and **retained until purged by Generate Monthly Reports per `Days Retail Import Errors` in General
  System Control Settings**.
- **Singleton rules:** *only one* `Generate Monthly Reports` event may be scheduled, and its `Type`
  may only be `Date of Month`. `Schedule Daily Reports` must be `Day of Week` and **only one instance
  per day — attempting to schedule a second for the same day raises an error.**
- **Cloud carve-outs:** `Sales Performance Report` and `View Summary of Sales Activity` are **not
  available to multi-tenancy Cloud users**. `Print a Customer's Revolving Statement` sends its file to
  an **NFS destination Cloud servers cannot reach, so it is not displayed as a scheduled process on
  Cloud**.
- Email parameters live in **Notifications Control Settings → `Email Configuration` tab →
  `Scheduled Process Completion` row**.
- Article carries one visible reader comment: *"Updated as of 5/29/25."* (Stephanie Brown). No
  instruction-like content directed at the reader was found.

**Dependencies.** General System Control Settings (`Start Scheduler Phantom`,
`Days Retail Import Errors`, Kount/fraud flags); Create a Report (`Add to Schedule a Process`,
`Description`); Review Archived Reports (`Creator`); Automated Data Import Settings; Notifications
Control Settings; Create a User / Create a User Group (email address, location & data restrictions);
and essentially every module — see the process catalogue. Directly parents `USR-027`
(Remove from Hold & Send via EDI Preferences), `USR-030` (Sales Performance Report),
`USR-032` (Schedule Daily Reports Preferences), and *Convert Comment Files* (Part A position 4).

**Build notes.**
- **Load-bearing — we need a scheduler.** But build it as **infrastructure** (a job registry + cron/
  queue + run history), not as a settings screen that enumerates 90 hard-coded process names.
- **Do differently:**
  - **Register jobs declaratively** (`job_definition` with a name, parameter schema, permission,
    default schedule, output contract) so adding a job does not mean adding an enum value.
  - **Parameters must be editable after creation** (cf. `USR-027`) and **versioned**, so a run's
    history records exactly which parameters produced it.
  - **`Run as User` must become a *service identity* plus an explicit `on_behalf_of`**, permissioned
    and audited. Free impersonation stamped into the audit trail is worse than no audit trail — it
    makes the log actively misleading. **This is a top-tier `RPT-AUDIT` feed.**
  - **Enforce output scoping.** A scheduled report must be evaluated against the *recipient's* data
    scope, not the scheduler's. STORIS's answer is a written recommendation; ours must be code.
  - **Silent skip of users with no email address must become a hard validation error.**
  - Replace the `Day of Week` / `Date of Month` / `Multiple Times` / `Specify Interval` quartet with a
    single cron-style expression plus a timezone (STORIS has no timezone concept here — note the
    `UP-System EOD Close` entry exists precisely because *"stores across time zones"* break EOD).
  - Keep the **import-file concurrency check and post-run rename** idea, but implement it properly as
    a **job lock + content-hash idempotency key** rather than filename mutation.
- **`[DECISION NEEDED]`** Timezone policy for LA Mattress: single-timezone operation (all California)
  simplifies EOD enormously. Confirm before we build anything as elaborate as `UP-System EOD Close`.

**`Process` catalogue — exact values and their documented rules**

*Purges & retention*

| Value | Rule |
|---|---|
| `Completed Order Purge` | Purges after `Completed Orders` in the Retention section, General page of **Point of Sale Control Settings**. **If that field is null the purge does not run even if scheduled.** **However, completed orders are still purged by the Customer Activity Log purge, which continues regardless of the Completed Orders retention setting.** |
| `Completed Transfer Purge` | Same pattern via `Completed Transfers`. **Null ⇒ never runs.** |
| `Customer Activity Log` | Purges after `Customer Activity Log` days (POS Control Settings, General page). **Null ⇒ never runs.** STORIS recommends stepping down: with 8 years accumulated, purge at 2555 days (7 yrs), then 2190 (6 yrs), and so on. |
| `Customer Purge` | Purges customer information **via the conversion spreadsheet on the Client Portal**. **Bypasses any retention periods set in Point of Sale Control Settings.** |
| `FR Credit Application History Purge` | With `Credit Application History Retention Days` in Financing Control Settings. |
| `Purge Card Auth External` | Purges CAX records older than `Transaction Retention Days` in **Payment Card and Device Settings**. **If no retention days specified, the purge does not run.** |
| `Purge Completed Order Attachments` · `Purge Completed Orders` · `Purge Completed Transfers` · `Purge Customer Rewards Points` | (no further detail published) |
| `Purge Online Finance Account Numbers` | Purges Finance Receivable account numbers not active for `Account Number Retention Days` in **Finance Provider Settings**. |
| `Purge of Sensitive Data` | Purges per settings established in the on-demand *Purge of Sensitive Data* process. |
| `Purge of Signature Audit file` | Purges signature-capture opportunity audit records older than `Retention Days` in **Signature Audit Settings**. **Does not run if the Signature Audit feature is disabled.** |
| `Purge Receiving Schedule` | Purges all receiving schedules; Capacity Settings and Schedules older than `Receiving Schedule Retention Days` in **Inventory Control Settings**. **Runs in the background.** |

*Imports* — all `Import *` entries below run **in conjunction with Automated Data Import Settings**,
and the ones marked ✱ carry the note **"the Location field in Automated Data Import Settings is set to
NFS"**:
`Import Advanced Regional Vendor Information`✱ · `Import BIN/INN Table` ·
`Import Customer Payment` (access via `Enter Process Preferences` in global actions) ·
`Import District and Regional Product Information`✱ · `Import Expense AP Bills` ·
`Import External Data` (*"schedule the automatic load of a provider's catalogs from an FTP site.
Currently this is available for Ashley catalogs"*) · `Import Fabric Configuration`✱ ·
`Import Grade Configuration`✱ · `Import Kit Master Information`✱ · `Import Open Item Receivables` ·
`Import Order Comments`✱ · `Import Product Categories` · `Import Product Collections` ·
`Import Product Groups` · `Import Product Information`✱ ·
`Import Purchase Order` (**requires the `ATP - External Ashley` module activated in the account**, and
NFS) · `Import Revolving Adjustments` · `Import Revolving Plan Deferments` (preferences hold the
import path of the spreadsheet; local PC or NFS) · `Import Vendors` ·
`Import Vendor Inventory Quantities` (loads a vendor catalog spreadsheet; **emails the user how many
products imported and any issues**, reportable via *Report Data Import Errors and Warnings*) ·
`Import Zip Codes` (**"the location must be =NFS"**) ·
`Sales Tax Import` (**"the location must be =NFS"**)

*Protection-plan / third-party interfaces*

| Value | Rule |
|---|---|
| `Extend Protection Plan Interface` | Selects all **Extend** plans not yet transmitted and sends them to **Extend's Orders API**. |
| `GBS Protection Plan` | Transmits plan activity to **GBS Enterprises**. Sales orders, returns and exchanges all transmit. **All protection plans are flagged as transmittable to GBS — this prevents duplicate transmission.** |
| `Guardsman Protection Plan` | Customises transmission times for Guardsman plans on incomplete orders. Creates a text file in Guardsman's layout. **Guardsman permits one file per day.** |
| `Montage Protection Plan Interface` | Transmits plan activity to the **Montage API**. |
| `Phoenix AMD Protection Plans` | Selects untransmitted Phoenix plans; generates **two** files (appliances, furniture) in the PHOENIX layout. Inventory formations in **External Communications Settings** decide appliance vs furniture. **File name: `[Dealer#]-MMDDYYYY@.csv`**, where `Dealer#` comes from `Dealer Number` in External Communications Settings, the date is current month/day/year, and **`@` is replaced by `"A"` for a furniture item or `"B"` for an appliance item.** |
| `Reputation Management Processing Dispatch` | Sends collected order info to the licensed, active Reputation Management Provider to prompt a customer survey. **Applies to all RMPs (Yotpo, Podium, STORIS RMI, …) — no specific RMP is named. If both Podium and STORIS RMI are licensed, RMI APIs are communicated for both.** |
| `Kount Case Status` | Reviews Kount cases and returns each case status. **Available only if `Credit Card Fraud Analysis` and `Kount Fraud Analysis` are enabled in General System Control Settings.** |
| `Webhook Processing` | (1) updates records created via the **eBridge Commerce** method `Update Pending Credit Review` during communication with **Equifax**; (2) purges records after `eBridge Commerce Credit Review Queue Retention Days`. |

*Operations & merchandising*

| Value | Rule |
|---|---|
| `Automated Order Scheduling` · `Collection Activity` · `Customer Credit and Scoring` · `Default Stock Location to Schema` · `Import BIN/IIN Table` · `Reservation Utility` · `Replenish Inventory Based on Current Back Order Needs` | (no further detail published) |
| `Convert Comment Files` | *"schedule the periodic conversion of comment files to a structure that can be used in auditing."* Preferences via `Actions > Enter Process Preferences` → the **Convert Comment Files** screen. |
| `Customer Membership Renewals` | **Creates a sales order** carrying the membership renewal charge and **processes payment using Shift4 shared token processing**. |
| `Dispatch EDI Acknowledgement/Notification Documents` · `Dispatch EDI Invoice Documents` | EDI outbound. |
| `Event Notification` | Creates consumer notifications per each **Minor Event** in Notifications Control Settings. |
| `Generate Labels Based on Captured Data` | Watches the `Move Captured Data for Event Detection` field to decide whether a new label is needed on product-related change; adds those pieces to the label queue. **`Run as User` is NOT active for this process.** Completion notification reports the labels generated. |
| `Generate Monthly Reports` | EOM processing. **`Type` must be `Date of Month`; only one event may be scheduled.** |
| `Manage Transfer of Merchandise` | Auto-manages DC→DC and DC→store transfers. Checks: (a) **all DC-to-DC transfers** for available stock at the line's ship location or the DC assigned to a delivering store — **if sufficient stock is found at the DC servicing the store, or at the store that handles its own deliveries, the auto-transfer is deleted and stock is reserved there instead**; (b) **all unreserved lines for a predetermined date range** for fulfilment from the store, the store's assigned warehouse, or another warehouse in the DC's Stock Location Schema; (c) **multiple delivery dates on a line — only the FIRST delivery date is filled by this process.** Checked when `Prefer Purchase Order Over Schema Days` is enabled (see Stock Reservation Settings). |
| `Merge Customers` | Runs the automated Customer Merge Process for duplicate-customer scenarios with status `merge` and eligible to merge **"immediately"**. |
| `Move Captured Data for Event Detection` | Tracks product-related **and** order-related changes. *(This, plus Convert Comment Files, is the closest thing STORIS has to change capture — see the wave-1 note that STORIS has no general change-audit log.)* |
| `Notifications Based on Captured Data` | Creates consumer notifications per each **Event** on the `Event Notifications via ERP` tab of Notification Control Settings. |
| `Open Fulfillment Information` | Schedules a report of data gathered in **View and Manage Open Orders**. |
| `Replenish Stock Inventory Based on Sales Rate` | Global extra action sets parameters. **At least one vendor code and one warehouse location must be entered. `Send Output To` is not available.** |
| `Requested Date Calculation` | Updates the requested date of order fulfilments per **Requested Date Calculation** settings. |
| `Retail Web Service` | **Full refresh of Retail Deck data** and updates the STORIS product selling price on existing products at the specified times. |
| `Reward Gift Certificate Generation` | Auto-generates gift certificates for membership-rewards customers per `Create Reward Gift Certificates ___ Months` in **Membership Rewards Settings**. |
| `Scheduled Settings Update` | Updates product **purchase status** and **distribution status** per the `Purchase Status` field on the Settings tab of **Advanced Product Settings**. **Should run once after midnight but before sales orders are entered.** |
| `Scheduled Process to Remove from Hold and Send via EDI` | See `USR-027`. |
| `Schedule Daily Reports` | EOD as an alternative to on-demand Generate Daily Reports; preferences via `Enter Process Preferences` (see `USR-032`). **Reports generated this way are archived and accessible via Review Archived Reports. Only one instance per day.** |
| `UP-System EOD Close` | Closes the Upboard for **all** stores at a scheduled time; all active assignments move to history and all stores close. **"This is useful for stores across time zones." `Enter Process Preferences` is inactive.** |
| `Sales Performance Report` | **Not available to multi-tenancy Cloud users.** See `USR-030`. |
| `View Summary of Sales Activity` | **Not available to multi-tenancy Cloud users.** |

*Scheduled reports with a common constrained-output pattern* — for `Report Accounts Receivable Aged
Trial Balance`, `Report Current Customer Deposit Amounts`, `Report Merchandise on Paid Pending Bills`,
`Report Merchandise Received But Not Invoiced`, `Report Outstanding Gift Certificates`:
**`Run as User` and `Send Completion Notification To` are allowed; the `Output` extra action is
disabled; `Send Output to` is limited to `R - Report Archive`.**

| Report | Extra rule |
|---|---|
| `Report Accounts Receivable Aged Trial Balance` | **Date prompt: `CUS – Custom` is NOT available. `TDAY – Today`, `YDAY – Yesterday`, `LPTD – Last Period to Date`, `LPTO – Last Period Total` do NOT update the As Of date field when scheduled — the date is calculated dynamically at run time.** |
| `Report Analysis of Account Activity` | **Gathers data from companies individually — separate reports are generated for each company.** (Relevant to the `COMPANY` resolver scope.) |
| `Report Current Customer Deposit Amounts` | **The number of aging days is relative to the day the report runs.** If scheduled for the 1st of the month, it is days from the 1st. |
| `Report Daily Financing Payments` | Scheduled output options are **Report Archive and XML**. |
| `Report Daily Receipts Register` | (no further detail) |
| `Report Financing Aged Trial Balance` · `Report Payables Aged Trial Balance` · `Report Value of Inventory` | Selection criteria via `Enter Process Preferences`. **Output is forced to Report Archive and cannot be changed.** **Warning: "When the same report is run via Generate Daily Reports and Generate Monthly Reports, balances may not match those on the scheduled report. The report that is run via EOD and EOM is period specific."** |
| `Report Merchandise Received But Not Invoiced` | **If the `Purchase Number` field is used, every scheduled run reports that one purchase order only — the report is identical however often it reruns. The As-of-Date prompt is disabled; the execution date is the default.** |
| `Report Metro 2 Customer Credit Reporting` | Runs on demand or scheduled. |
| `Print a Customer's Revolving Statement` | `Send Completion Notification To` active; **`Run as User` inactive**. **File goes to an NFS destination Cloud servers cannot access, so on Cloud this process is not displayed at all.** |

---
### `USR-032` Schedule Daily Reports Preferences
*storis_ref: article 15185860064020*

**Purpose.** Run-time preference screen for the **`Schedule Daily Reports`** scheduled process — i.e.
the parameters for unattended **end-of-day (EOD)** processing.

**Where it lives.** Article's `Access` block is **empty in the source**. Reached from
`USR-031 Schedule a Process > Actions > Enter Process Preferences` with `Process = Schedule Daily Reports`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Process As Of` | date | The business date EOD is processed for. |
| `Perform System Backup` | flag | Whether the EOD run also performs the system backup. |

**Behavior & rules.**
- **Quoted:** *"When launched from the process scheduler, Schedule Daily Reports performs end-of-day
  processing using the logic that is used when server clients have scheduled Generate Daily Reports
  using operating system tools."* — i.e. it is a wrapper around the same EOD logic that on-premise
  customers drive from cron.
- Inherits the `USR-031` singleton rule: **only one `Schedule Daily Reports` event may be scheduled
  per day; a second attempt raises an error.** `Type` must be `Day of Week`.
- Reports produced this way are **archived and retrieved via Review Archived Reports**; the `Creator`
  shown there is the `Run as User` value, or the Schedule a Process ID if that was left blank.
- Article is a near-stub — two field names, no descriptions.

**Dependencies.** `USR-031` Schedule a Process; Generate Daily Reports (EOD); Review Archived Reports;
`USR-024` (Import Customer Payments can be triggered by EOD); Point of Sale / Inventory retention
settings consumed by EOD purges.

**Build notes.**
- **Mostly STORIS legacy.** A monolithic nightly "EOD" that closes the day, prints reports **and takes
  the system backup** in one job is a 1990s batch-ERP pattern. LA Mattress should not have a
  business-blocking nightly close at all: post to the ledger transactionally, snapshot for reporting
  continuously, and back up independently of application logic.
- **`Perform System Backup` inside an application job is an anti-pattern** — backup is an
  infrastructure concern with its own schedule, retention and restore testing. Do not port it.
- What *is* worth keeping: a **daily business-date close marker** (an immutable "books closed through
  <date>" record) that reporting and commission calculation key off — that is what makes past-dated
  reports reproducible and directly fixes the `USR-030` problem.
- **`[DECISION NEEDED]`** Define the LA Mattress business day boundary and timezone; everything from
  commission periods to sales-day reporting depends on it. STORIS just has `Process As Of`.

---

### `USR-033` Set Domestic Country
*storis_ref: article 15185876226580*

**Purpose.** Designates **which Country record is the company's domestic country**. Everything else
is then, by definition, foreign — this is the root switch of STORIS's multi-currency / foreign
processing model.

**Where it lives.** Article's `Access` block is **empty in the source**. Reached from the Country
Settings record (Part A position 5).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (country selection) | selection | The country to designate as domestic. |
| `Are You Sure?` | confirmation prompt | Confirmation before the change is applied. |

**Behavior & rules.**
- **Hard rule: "You must designate one country as your domestic country."** Exactly one, always.
- **Hard rule: "To change your domestic country, contact your STORIS representative."** It is not a
  self-service setting — vendor involvement is required, which tells you how deeply the value is wired
  into costing, AP, tax and reporting.
- **Hard rule: "If you access this screen from your current domestic country record, this screen is
  read-only."** You can only ever set a *different* country as domestic from that country's record —
  a deliberate guard against accidentally re-confirming/clearing the current one.
- The domestic country is the anchor for **Foreign Processing** (Part A position 12) and for
  currency-denominated behaviour such as **Bank to Print Checks by Currency Settings** (Part A
  position 2), and for the address-label masking noted in `USR-024` (Country Settings → `Masking`
  tab drives the Zip/City/State prompt labels).
- Article is a stub — three sentences and a confirmation prompt.

**Dependencies.** Country Settings (Part A position 5) — parent; Foreign Processing Overview and
Bank to Print Checks by Currency Settings (Part A) — consumers; currency/exchange-rate tables;
address masking; tax jurisdiction model (`USR-034`); `USR-024` address field labels.

**Build notes.**
- **`[DECISION NEEDED]` — the multi-currency question, stated here because this is where it is rooted
  in this half of the section.** LA Mattress is a single-country (US), single-currency (USD) retailer.
  Multi-currency in STORIS is not a display feature: it reaches into **costing** (landed cost of
  imported goods at which exchange rate, and when it is fixed), **AP** (paying a vendor invoice
  denominated in a foreign currency, and where the FX gain/loss posts), **banking** (a separate check
  stock and bank account per currency — that is literally what *Bank to Print Checks by Currency
  Settings* exists for), and **reporting** (functional vs transactional currency).
  **Recommendation: do NOT build multi-currency.** Hard-code USD as the functional and transaction
  currency, and handle imported goods by capturing **landed cost in USD at the time the liability is
  recorded** (the customs/freight invoice already arrives in USD for a domestic importer of record).
  If we ever buy direct from an overseas mill in a foreign currency, add **currency on the PO and the
  AP bill only**, with a single realized-FX-gain/loss GL account — not a full multi-currency ledger.
  The cost of the full model is disproportionate; the cost of retrofitting *currency on PO/AP bill*
  later is small. **Owner needed for this decision: whoever owns AP and import purchasing.**
- Practically, we still need a `country` reference table (for addresses, vendor records, and
  country-of-origin on products, which matters for tariffs), and a **`domestic_country` company
  setting** — but as a plain configuration value on the `COMPANY` scope, not a vendor-gated one.
- **Do differently:** never make a setting un-editable-by-the-customer as STORIS does here. Gate it
  with a permission and an `RPT-AUDIT` entry instead.
- The read-only-when-viewed-from-the-current-record rule is a UI quirk, not a requirement.

---

### `USR-034` Tax Jurisdiction Reduction Percent Screen
*storis_ref: article 15185860067732*

**Purpose.** Builds a table of **tax-jurisdiction reduction percentages** — per jurisdiction, the
percentage by which a **Miscellaneous Fee**'s taxable amount (or rate) is reduced. It exists solely to
serve **Miscellaneous Fee Settings** (Part A position 18).

**Where it lives.** Article's `Access` block is **empty in the source**. Reached from
**Miscellaneous Fee Settings**, where the reduction table is applied.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Jurisdiction` | selection from tax-jurisdiction master | The tax jurisdiction the reduction applies to. |
| `Reduction Percent` | percent | The reduction applied to that jurisdiction for the fee. |
| Grid | read-only | Displays **the tax rate percent and description of the selected tax jurisdiction, alongside the reduction percentage.** |

**Behavior & rules.**
- Quoted: *"You select tax jurisdictions and then apply reduction percentages to those jurisdictions
  for use in the Miscellaneous Fee Settings."*
- **The grid shows the jurisdiction's own tax rate next to the reduction percent** — meaning the
  reduction is understood relative to that rate, but the article **does not state whether the
  reduction is applied to the taxable base or to the rate itself.** That ambiguity is significant and
  is flagged below.
- The table is keyed on **jurisdiction**, so the same misc fee is taxed differently by locality —
  this is the mechanism by which delivery/handling/recycling-fee taxability varies by city/county.
- Article is a near-stub — one paragraph plus two field names.

**Geography → tax/delivery scoping (how the pieces fit, per the brief's request).**
STORIS's chain runs: **zip code record → tax jurisdiction(s) + default ship/stock/service location.**
- *Individual Zip Codes* (Part A position 14) and the scheduled `Import Zip Codes` process
  (`USR-031`, NFS-only) maintain the zip master; `Sales Tax Import` (`USR-031`, NFS-only) maintains
  the rate tables *"for various states/jurisdictions"*.
- `USR-026` documents the delivery/service side of the same key: **"The system derives default ship
  and stock location information from the zip code record associated with the customer's ship-to zip
  code settings"** and **"For service orders, the system references the service location based on the
  customer's zip code."** If that location is not on the user's list, **it is added temporarily**; and
  if stock and ship land in different regions with `Restrict Inter-Regional Transfers` set, **the item
  cannot be saved.**
- So **one field — the customer's ship-to zip — simultaneously determines the tax jurisdiction stack,
  the fulfilling warehouse, the delivering location, and the service location.** That is the single
  most load-bearing piece of reference data in the geography model.
- `USR-034` then modifies the tax outcome for *fees specifically*, per jurisdiction.

**Dependencies.** Miscellaneous Fee Settings (Part A position 18) — the only consumer; tax
jurisdiction master and Sales Tax Settings; zip-code master / *Individual Zip Codes* (Part A position
14); `Import Zip Codes` and `Sales Tax Import` scheduled processes (`USR-031`); `USR-026` (zip-driven
ship/stock/service location); `USR-021` (the jurisdiction dimension also appears on insurance rates).

**Build notes.**
- **Load-bearing.** California delivery, haul-away/recycling and mattress-recycling-fee taxability
  genuinely varies by jurisdiction, and getting fee taxability wrong is a sales-tax audit finding.
  Model: `fee_tax_rule(fee_id, jurisdiction_id, treatment)`.
- **Do differently — resolve the ambiguity STORIS leaves open.** Define the rule as an explicit
  enum rather than a bare percentage: `FULLY_TAXABLE` / `EXEMPT` / `PARTIALLY_TAXABLE(base_pct)`. A
  "reduction percent" that could mean *reduce the base* or *reduce the rate* is exactly the kind of
  under-specified setting that produces silent under-collection. If we must keep a percentage, name it
  `taxable_base_percent` and document it as *taxable amount = fee × taxable_base_percent*.
- **Strongly consider not owning tax at all.** Avalara/TaxJar-class services already maintain
  jurisdiction boundaries, rates and **product/fee taxability rules by category**, which is precisely
  what this screen and the NFS `Sales Tax Import` job are hand-rolling. **`[DECISION NEEDED]`** buy vs
  build for sales tax. If we buy, `USR-034`, `Sales Tax Import` and most of the jurisdiction master
  become **STORIS legacy we should not rebuild** — we keep only the fee→tax-code mapping.
- **Do not key tax on zip code.** Zip codes do not align to tax jurisdictions in California
  (a single zip can straddle district-tax boundaries), and STORIS's zip-driven model will
  under/over-collect at boundaries. Key tax on the **geocoded/validated address**; keep zip only for
  **delivery-zone and service-territory** assignment, where it is a reasonable proxy.
- **Split the two responsibilities the zip record currently conflates:** `tax_jurisdiction_resolution`
  (address-based) and `fulfillment_zone` (zip/polygon-based). STORIS's single zip record doing both is
  why `USR-026` needs the "temporarily add the location to your list" hack.
- Effective-dating is absent in STORIS: rates and reductions appear to be current-value only.
  **Ours must be effective-dated** so a re-priced historical order recomputes correctly.

---
### `USR-035` Telephone Mask Settings
*storis_ref: article 15185860065044*

**Purpose.** Defines, **per country**, the set of acceptable telephone-number **pattern masks**. Any
phone number entered must match one of the patterns registered for the applicable country.

**Where it lives.** Article's `Access` block is **empty in the source**. Reached from Country
Settings (Part A position 5) — the article says masks are created *"for each country defined in the
system"*, alongside the `Masking` tab referenced in `USR-024`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Telephone Mask` | pattern | One acceptable phone pattern for the country. **Multiple masks per country are supported** — a number matching *any* of them is valid. |
| Grid | list | The masks defined for the country. |

**Behavior & rules.**
- **Which country's masks apply depends on the record type:**
  - **Customers:** *"the zip code is used to determine the set of valid patterns based on the
    corresponding country."*
  - **Vendors:** *"the country entered determines the set of valid patterns allowed."*
- **Hard rule, and a genuinely destructive one:** *"If you change zip codes or country codes for
  existing customers or vendors, and the patterns do not match or do not fully overlap, the system
  notifies you that the existing phone numbers are being cleared and you must enter the new phone
  numbers with the correct patterns."* — **editing a customer's zip code can wipe their phone
  numbers.** The user is notified, but the data is destroyed as part of the save.
- Article is thin — two paragraphs, two field labels, no mask syntax documented.

**Dependencies.** Country Settings (Part A position 5); zip-code master / *Individual Zip Codes*
(Part A position 14) — again the zip record is doing double duty, cf. `USR-034`; customer and vendor
masters; `USR-024` (`Masking` tab drives address prompt labels).

**Build notes.**
- **Marginal.** We are US-only; a single E.164/NANP validation covers us. Do not build a per-country
  mask table.
- **Explicitly reject the clearing behaviour.** Changing an address must never delete a phone number.
  If a number no longer validates, keep it, mark it `unvalidated`, and surface it for correction.
  Silent-ish destruction of contact data on an unrelated edit is a customer-service outage waiting to
  happen — and with no change log (`RPT-AUDIT`), unrecoverable.
- **Do differently:** store phone numbers normalized to **E.164** with the original entry preserved,
  and validate with a library (libphonenumber) rather than hand-maintained masks. Derive country from
  an explicit country field, never from zip.
- If we ever go multi-country, this becomes trivial with the library — another reason the STORIS
  approach is not worth porting.

---

### `USR-036` Track Settings Activity
*storis_ref: article 15185876708884*

**Purpose.** Turns on an **audit trail of edits to selected settings routines**, per file. Changes are
then reported through the **Review Settings Activity** routine.

**Where it lives.** Article's `Access` block is **empty in the source**. System Administration →
User Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Log Retention _ days` | integer (days) | How long audit records are kept. |
| Grid | per-file on/off list | The settings files for which auditing is enabled. |

**Behavior & rules.**
- **Hard rule: auditing is per FILE, not per attribute.** Quoted: *"The system does not audit specific
  attributes. That is, when auditing is on for a particular file, the system audits all attributes
  maintained in the settings routine."*
- **Hard rule, and a serious one: "If you turn off auditing for any files, STORIS deletes all audit
  records associated with those files."** **Disabling the audit destroys the history.** There is no
  archive step and no confirmation described. **This is an audit trail that anyone who can toggle the
  setting can erase — which means it is not an audit trail.**
- **Data conversion imports also update audit comments** — flagged as *Important* in the article, i.e.
  bulk imports appear in the trail and can swamp it.
- Retention is a plain day count with no minimum stated.
- Article is thin — four sentences and two field labels.

**Dependencies.** Review Settings Activity (the reporting counterpart); every settings routine that
can be enrolled; `USR-031` (`Run as User` determines the operator initials recorded in audit
comments — see the impersonation note there); data-conversion / import processes.

**Cross-reference correction to the wave-1 shared note.**
The wave-1 brief states: *"STORIS has no general change-audit log. Only `SAR-024` Report Secured
Decryption Activity exists."* **That needs qualifying.** STORIS does ship a *settings-level* change
audit — this routine plus **Review Settings Activity** — and `USR-031` documents `Move Captured Data
for Event Detection` (product- and order-related change capture) and `Convert Comment Files`
(*"conversion of comment files to a structure that can be used in auditing"*). So the accurate
statement is: **STORIS has no general change-audit log for transactional data; it has an opt-in,
per-file, all-attributes settings audit whose records are deleted when the option is switched off.**
Suggest the shared note be amended rather than left as-is.

**Build notes.**
- **Load-bearing — this is the seed of our `RPT-AUDIT` requirement, and we should build the opposite
  of it.**
- **`RPT-AUDIT` non-negotiables, derived directly from what is wrong here:**
  1. **Always on.** No per-file enable/disable. Auditing is a property of the platform, not a setting.
  2. **Append-only and immutable.** No application path may delete audit rows. Retention is enforced
     by an out-of-band archival job with its own permissions, and archived records go to
     write-once storage, not to `/dev/null`.
  3. **Attribute-level.** Record old value, new value, field, record, actor, actor's real identity
     (not an impersonated `Run as User`), source (UI / import / API / job), request id, timestamp.
     STORIS's file-level all-or-nothing granularity makes the log unusable for the question people
     actually ask: *"who changed this price?"*
  4. **Distinguish bulk-import writes from human edits** with a `source` dimension so an import cannot
     drown the human trail — STORIS just notes that imports "also update audit comments".
  5. **Cover transactions, not only settings.** Order line changes, price overrides, deposit releases,
     tender restrictions bypassed, scope escalations — all of `USR-025`/`USR-026`/`USR-028`/`USR-030`
     depend on this. `USR-030` explicitly fails because order changes *"affect the live files and are
     not tracked."*
  6. **Turning auditing off, changing retention, or reading the audit log are themselves audited
     events.**
- Feed the following into `RPT-AUDIT` from this part file: reason-code master changes (`USR-022`),
  scheduled-process creation/edit and any `on_behalf_of` execution (`USR-031`), tender-restriction
  blocks and overrides (`USR-028`), `Minimum Deposit Not Met` bulk releases (`USR-027`),
  `Override Legal Code Allow Payments` uses (`USR-024`), domestic-country / tax-rule changes
  (`USR-033`, `USR-034`), and every scope-escalation event described in `USR-026`.

---
### `USR-037` User Defined Settings
*storis_ref: article 15185860707092*

**Purpose.** An **optional custom-field framework**: define your own prompts, then answer them on a
fixed set of records. STORIS's answer to "we need to capture something you didn't ship a field for."

**Where it lives.** Article's `Access` block is **empty in the source**. System Administration →
User Settings.

**Prompts defined here can be answered in exactly these processes:**
`Advanced Customer Settings` · `Advanced Product Settings` ·
`Collector Review - Customer Update Screen` · `Collection Settings` ·
`Design Enhanced Laser Forms` · `Group Settings` ·
`Manage and Adjust Installment Contracts` · `Warehouse/Store Location Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Prompt Code` | code | Identifier for the user-defined prompt. |
| `Source` | selection | Which of the eight host processes/records the prompt attaches to. |
| `Data Format` | enum | Data type of the response. |
| `Prompt Text` | text | Label shown to the user. |
| `Inventory Formation` | selection | Scopes a product-attached prompt to an inventory formation (i.e. only show it for certain product groupings). |
| `Maximum Entry Length` | integer | Length limit for the response. |
| `Mandatory` | flag | Whether a response is required. |
| `Active` | flag | Whether the prompt appears on the user-defined entry screen. |
| `Valid Response` | list | Permitted response values (a value list / domain). |
| Grid | list | Defined prompts. |

**Behavior & rules.**
- **Hard rule, stated twice in the article (once as body text and again as a NOTE): "These settings
  and the responses you enter are informational only; no processing occurs on the system based on
  this information."** They are inert data — nothing prices, filters, routes or reports off them.
- **Hard rule: "Only unused prompt codes can be deleted."** If responses exist, you may set
  `Active = No` to hide it from the entry screen, **but you cannot delete it.** (Same soft-delete gap
  as the `Obsolete` reason code in `USR-022`.)
- `Inventory Formation` gives per-product-grouping applicability — the only conditional-display
  mechanism offered.
- Article is moderately thin: field names with no per-field descriptions.

**Dependencies.** The eight host processes listed above; Inventory Formation master; Design Enhanced
Laser Forms (so responses can at least be printed on forms); `USR-036` Track Settings Activity
(settings-file auditing would cover the prompt definitions).

**Build notes.**
- **Load-bearing in concept — but "informational only" is the failure.** Every retailer needs
  extensible attributes (mattress firmness scale, comfort-guarantee eligibility, sleep-trial status,
  law-tag id, warranty registration number). The moment a custom field cannot be filtered, reported,
  or used in a rule, users stop trusting it and put the data in a comment field instead.
- **Do differently:** build custom fields as **first-class typed attributes** with a JSON/EAV backing
  that is (a) indexed and queryable, (b) exposed to reporting and list filters, (c) usable in rule
  conditions, and (d) available on the API. Keep STORIS's good parts — `Data Format`, `Maximum Entry
  Length`, `Mandatory`, `Active`, `Valid Response` domain list, and conditional applicability
  (generalize `Inventory Formation` to "applies when <predicate>").
- Replace "cannot delete once used" with **soft-delete + archive of responses**, and make hiding a
  prompt distinct from retiring it.
- Attach points should be **configurable per entity**, not a hard-coded list of eight screens.
- **Watch for scope creep:** custom fields are where ERP projects go to die. Set a rule that any
  custom field which acquires business logic must be promoted to a real column. **`[DECISION NEEDED]`**
  who approves new custom fields, and what is the review cadence for promoting/retiring them?

---

### `USR-038` User Group Clone Process
*storis_ref: article 15185860228628*

**Purpose.** Creates a **new user group by duplicating an existing one's data**, so a similar group
can be built without re-entering every permission.

**Where it lives.** `Create a User Group > [General tab] > Actions button > Clone Info for New Product`
→ the **User Group Clone Process** screen.
*(Note the menu option is labelled **"Clone Info for New Product"** — the wording is a copy-paste
artefact from the product-clone action; it clones a user group, not a product.)*

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `New User Group ID` | code | ID of the group to create. On entry, the system creates the record and displays it, **pre-populated as a duplicate of the original group's field data**, which you may then modify. |

**Behavior & rules.**
- Procedure: load the group you want to clone in Create a User Group → `Actions` →
  `Clone Info for New Product` → enter `New User Group ID` → the new group appears, fully populated →
  edit as desired.
- **This is the mechanism behind the wave-1 finding that STORIS group permissions are a *copy-down
  template, not live inheritance*.** Cloning copies values at a point in time. Later changes to the
  source group **do not** propagate to the clone, and — per the wave-1 note — the *user row* is what is
  actually enforced, so cloning a group does not touch users already created from it either.
- No merge, no diff, no partial clone, no "clone but exclude X" is described. It is a whole-record
  copy.
- Every cloned permission is still **inert unless Extended Security is enabled globally** in General
  System Control Settings (wave-1 cross-reference).
- Article is thin — three sentences and one field.

**Dependencies.** Create a User Group (parent); Create a User (`parts/user-security-CATALOG.md`, 355
flags across 10 domains); General System Control Settings → Extended Security; `USR-028` (restricted
payment types are among the copied data); `USR-036` (whether the clone is audited depends on whether
that settings file is enrolled).

**Build notes.**
- **STORIS legacy we should not rebuild — the *feature* is a symptom of the wrong permission model.**
  Cloning exists because there is no inheritance. Per the wave-1 decision we are replacing copy-down
  templates with **live, most-specific-scope-wins evaluation** (`user > role > store > region >
  company`), so a new role should be composed from existing grants, not photocopied from one.
- What we do want instead: **role composition / role inheritance** (`role B extends role A plus these
  deltas`), so a change to the base role propagates. Plus a **"duplicate as starting point"**
  convenience in the admin UI that is explicitly labelled as a one-time copy and records
  `derived_from` for traceability — the honest version of what STORIS does implicitly.
- Whatever we build, **role/permission changes are an `RPT-AUDIT` feed** with before/after diffs.
- Fix the label: an action named `Clone Info for New Product` on a user-group screen is exactly the
  kind of thing that erodes admin confidence. Trivial, but worth calling out as a "do not port".

---

### `USR-039` View File Attachments
*storis_ref: article 15185875552276*

**Purpose.** The **read-side** of STORIS's document-attachment model: how a user discovers that a
record has attachments and opens them.

**Where it lives.** Article's `Access` block is **empty in the source**. Reached from any screen with
the paper-clip icon, or via `Actions > View Attachments`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Storis File` | key | **The STORIS "file" (table) the attachment belongs to** — e.g. order, customer, product. |
| `Storis Item` | key | **The item (record key) within that file** the attachment is attached to. |
| Grid | list | The attachments for the current record; double-click a row to view it. |

**Behavior & rules.**
- **Discovery is via the paper-clip icon at the top of the screen or tab.** An **inactive** paper clip
  means no attachments are ready to view, and `Actions > View Attachments` is likewise inactive.
- **The paper clip only activates when you (a) access a record that has an attachment, or (b) select a
  grid row that has one.** There is no "which of these rows have documents" indicator described — you
  must select a row to find out. **Poor discoverability on list screens.**
- **If exactly one attachment exists, `View Attachments` opens it directly** (no picker). **If several
  exist, the View File Attachments window opens with a grid**; double-click to view; exit button
  returns to the original screen.
- Article is thin — two paragraphs, two field labels, no storage/naming detail.

**Attachment addressing vs. the archive-side collision finding (the brief's question).**
- **What this article establishes:** attachments are addressed by the pair **(`Storis File`,
  `Storis Item`)** — a **record-scoped key**, i.e. table + record id. That is structurally *stronger*
  than the archive side's reported filename-only uniqueness
  (`DocumentType_Reference#_MMDDYY_HHMMSS_ms.PDF` with silent collisions): two attachments on the same
  record are distinct grid rows, and the article explicitly supports **multiple attachments per
  record**, so there is no evidence of same-record overwrite on the view side.
- **What this article does NOT establish, and what remains open:** the **stored filename / physical
  path** of an attachment is not documented here. If STORIS stores attachments on a share and keys
  the physical object by filename (as the archive does), the same collision class can still exist
  *underneath* a record-scoped index — two records could point at the same physical file, or an
  upload could overwrite an earlier file with an identical generated name. **This article cannot
  settle it.**
- **Action for the Part A agent / whoever writes up `Edit File Attachments` and
  `Attachment Description Entry Screen`:** confirm (a) whether the physical file is renamed on upload
  and by what pattern, (b) whether uniqueness is enforced on the physical name or on
  (`Storis File`,`Storis Item`,`sequence`), and (c) whether re-uploading a same-named file overwrites.
  Also relevant: `USR-031` lists a **`Purge Completed Order Attachments`** scheduled process — i.e.
  attachments are purged on a retention schedule, which makes silent overwrite/shared-physical-file
  behaviour actively dangerous (purging order A could remove a document still referenced by order B).
  **Flagging that purge/collision interaction as the concrete risk to check.**

**Dependencies.** Edit File Attachments and Attachment Description Entry Screen (Part A positions 11
and 1) — the write side; `USR-031` `Purge Completed Order Attachments`; every record type that
supports attachments; Create a User / Create a User Group (whether attachment viewing is permissioned
is not stated in this article — **another gap to confirm**).

**Build notes.**
- **Load-bearing.** Signed delivery receipts, law tags, warranty registrations, comfort-exchange
  paperwork, COI/vendor docs, damage photos — attachments are core, not incidental, for a mattress
  retailer.
- **Our model:** a single `document` table with a **content-addressed store** (SHA-256 of the bytes as
  the object key), plus an `attachment` join table `(entity_type, entity_id, document_id, doc_type,
  description, uploaded_by, uploaded_at, sequence)`. Content addressing makes collisions
  **impossible by construction** and deduplicates identical files, which directly answers the archive
  finding. **Never derive the storage key from a human-readable name or a timestamp.**
- **Deletion/purge must be reference-counted** — a document object is removed only when no attachment
  row references it. This is the specific fix for the `Purge Completed Order Attachments` risk above.
- **Do differently on UX:** show an attachment **count badge in the list row**, not a paper clip that
  only wakes up after you select the row. Keep the "single attachment opens directly" shortcut — that
  one is a good touch.
- **Permission the read side explicitly** (some documents are customer PII or signed contracts) and
  **log document views to `RPT-AUDIT`** — a signed contract being opened is exactly the kind of access
  we will be asked about later. STORIS documents no such control.
- Store `doc_type` as a controlled vocabulary from the start so retention rules can be written per
  type (delivery receipt: 3y; signed finance doc: 7y; damage photo: 1y) instead of one global purge.

---

## Triage — load-bearing vs. STORIS legacy (positions 21–39)

### Load-bearing for LA Mattress

| Req | Article | Why it earns its place |
|---|---|---|
| `USR-022` | Reason Code Settings | A typed, usage-scoped reason-code master is the backbone of As-Is/damage/return handling and the cleanest design in this half. |
| `USR-023` | Reason Code Spiff Table | Tiered GP%-based spiff is exactly how we should incentivize clearing damaged and floor-model inventory. |
| `USR-025` | Regional Processing - Reporting Rules | We need report scoping by location; the six documented exceptions tell us precisely which leaks to avoid. |
| `USR-026` | Regional Processing - Rules, Notes, Exceptions | Defines the zip→ship/stock/service-location derivation we do need, and catalogues fourteen scoping bypasses to design out. |
| `USR-028` | Restricted Payment Type Select Window | Controlling who can take which tender is a real loss-prevention requirement — rebuilt as an allow-list. |
| `USR-029` | RF Barcode User Settings | Warehouse operator profiles (pick zones, work types, drop-off) are needed for bulky-goods fulfilment. |
| `USR-030` | Sales Performance Report | The KPI set (avg ticket, units/ticket, plan attach rate, spiff, D&I) is the sales-floor scoreboard; only the mechanics are wrong. |
| `USR-031` | Schedule a Process | We need a job scheduler — as declarative infrastructure, and its process catalogue is a free inventory of every batch concern in retail ERP. |
| `USR-034` | Tax Jurisdiction Reduction Percent Screen | Fee taxability genuinely varies by jurisdiction; getting it wrong is an audit finding. |
| `USR-036` | Track Settings Activity | The direct seed of `RPT-AUDIT` — valuable precisely as an example of how not to do it. |
| `USR-037` | User Defined Settings | Extensible attributes are unavoidable; ours must be queryable rather than "informational only". |
| `USR-039` | View File Attachments | Document attachment is core (delivery receipts, law tags, finance docs); needs a content-addressed rebuild. |
| `USR-027` (partial) | Remove from Hold & Send via EDI | The *deposit-clears-releases-the-special-order-PO* rule is load-bearing; the EDI batch wrapper is not. |
| `USR-024` (partial) | Receivable Payment Source Settings | The *shape* — a per-remitter inbound payment-file profile — maps onto financing/lockbox settlement files. |

### STORIS legacy we should not rebuild

| Req | Article | Why to drop it |
|---|---|---|
| `USR-021` | Rate Table Settings | Credit life / A&H insurance rates by month — we do not underwrite consumer credit. |
| `USR-024` (as built) | Receivable Payment Source Settings | Revolving/installment plumbing, positional CSV columns, STORIS-assigned magic extraction numbers, PC-vs-NFS transports. |
| `USR-027` (as built) | Remove from Hold & Send via EDI Preferences | Nightly batch sweep with parameters frozen at creation; vendor EDI 850s are unlikely to apply to us. |
| `USR-032` | Schedule Daily Reports Preferences | A monolithic business-blocking nightly close that also takes the system backup. Keep only a business-date close marker. |
| `USR-033` | Set Domestic Country | Root of a multi-currency model we should not build; keep a plain `domestic_country` company setting. |
| `USR-035` | Telephone Mask Settings | Per-country hand-maintained phone masks; superseded by E.164 + libphonenumber. Its data-clearing behaviour is a defect. |
| `USR-038` | User Group Clone Process | Exists only because permissions are copy-down templates; replaced by live role composition. |
| `USR-029` (partial) | RF Barcode User Settings | The AWM scheduling half, the Palm-Pilot-era module licence gate, and Starting/Ending pick-range zoning. |
| `USR-034` (conditional) | Tax Jurisdiction Reduction Percent | If we buy sales tax (Avalara/TaxJar), this screen plus `Sales Tax Import` and the jurisdiction master all go away. |
| `USR-031` (most of the catalogue) | Schedule a Process | ~40 of the ~90 listed processes are revolving/installment/Metro 2/EDI/protection-plan-vendor interfaces irrelevant to us. |

### Open `[DECISION NEEDED]` items raised in this part

1. **Multi-currency: build or not.** (`USR-033`; also Part A's Foreign Processing / Bank to Print
   Checks by Currency.) **Recommendation: no.** USD only; add currency to PO + AP bill later if we
   ever buy direct in FX. Owner: AP / import purchasing.
2. **Sales tax: buy or build.** (`USR-034`) Buying collapses a large chunk of the geography stack.
3. **Commission basis: written vs delivered**, and line-level vs order-level GP% for spiff tiers.
   (`USR-030`, `USR-023`)
4. **Do we service any in-house installment or revolving credit?** If no, ~9 of 19 reason-code usage
   values and most of `USR-024` are deleted. (`USR-022`, `USR-024`)
5. **Vendor EDI: real or not?** (`USR-027`)
6. **Wave-picking / AWM scheduling vs on-demand picking.** (`USR-029`)
7. **Timezone and business-day boundary policy.** (`USR-031`, `USR-032`)
8. **Scope should follow the user, not the log-on location** — confirm no roaming-staff workflow
   depends on inheriting store-local location lists. (`USR-026`)
9. **Custom-field governance:** who approves new user-defined fields and when are they promoted to
   real columns. (`USR-037`)
10. **Inbound remittance files in phase 1, or processor reporting only?** (`USR-024`)

### Notes for the pack editor

- **No article in this range contained text addressed to the reader as an instruction.** The only
  reader-directed content found was a single Zendesk comment on `USR-031` reading
  *"Updated as of 5/29/25."* — treated as data, not acted on.
- **Amend the wave-1 shared note on auditing.** See `USR-036`: STORIS *does* have an opt-in,
  per-file, all-attributes **settings** audit (Track Settings Activity + Review Settings Activity),
  plus `Move Captured Data for Event Detection` and `Convert Comment Files` for change capture. The
  accurate claim is that STORIS has **no general change-audit log for transactional data**, and that
  its settings audit **deletes its own history when switched off**.
- **New resolver scopes suggested by this half:** `TAX_JURISDICTION`, `SALES_DEPARTMENT`,
  `INVENTORY_FORMATION`, `DISTRICT`, `REGION` — the last two only if we do not collapse them into a
  single location hierarchy as recommended in `USR-026`.
- **Articles whose `Access` (menu path) section is empty in the STORIS source**, so the menu path
  could not be captured: `USR-027`, `USR-028`, `USR-029`, `USR-030`, `USR-032`, `USR-033`, `USR-034`,
  `USR-035`, `USR-036`, `USR-037`, `USR-039`. Paths given for those entries are inferred from the
  parent screen named in the body text and are marked as such.
