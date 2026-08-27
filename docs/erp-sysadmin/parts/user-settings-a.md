# Part: User Settings (A) — positions 1–20 of the non-"Security" articles

*Source section:* STORIS Help Center → System Administration → **User Settings**, section id `15172979328660`
*Section total:* **49** articles. Articles whose title contains "Security" (**10**) are excluded — covered by
the `user-security` part (`parts/user-security.md`, `parts/user-security-CATALOG.md`).
*Filtered list:* **39** articles. This part covers **positions 1–20**; the part-B agent covers **21–39**.
*Prefix:* `USR`, IDs `USR-001` … `USR-020`.

## Split manifest (auditable boundary)

Enumeration order is the section listing order returned by the Zendesk section pages (alphabetical by title),
with the 10 "Security" titles removed. Positions 1–20, which are mine:

| # | req_id | article id | Title |
|---|---|---|---|
| 1 | USR-001 | 15185875552660 | Attachment Description Entry Screen |
| 2 | USR-002 | 15185859409172 | Bank to Print Checks by Currency Settings |
| 3 | USR-003 | 15185876528404 | Company Settings |
| 4 | USR-004 | 15185859408788 | Convert Comment Files |
| 5 | USR-005 | 15185876533396 | Country Settings |
| 6 | USR-006 | 15185876530068 | Create a User |
| 7 | USR-007 | 15186132800788 | Create a User Group |
| 8 | USR-008 | 15185859627028 | Customer Purge |
| 9 | USR-009 | 15185875773844 | Customer Service Maintenance - User File |
| 10 | USR-010 | 15185875797140 | Description Field - Language Translation Entry |
| 11 | USR-011 | 15185859629972 | Edit File Attachments |
| 12 | USR-012 | 15185876531220 | Foreign Processing Overview |
| 13 | USR-013 | 15185860429204 | Import Provider Type Settings |
| 14 | USR-014 | 15185860708884 | Individual Zip Codes |
| 15 | USR-015 | 15185875774356 | Installment Credit Approval Limits |
| 16 | USR-016 | 15185859801876 | Installment Credit Approval Rules |
| 17 | USR-017 | 15185860428820 | Insurance Underwriter Settings |
| 18 | USR-018 | 15185860430356 | Miscellaneous Fee Settings |
| 19 | USR-019 | 15185875940884 | PC Applications Window |
| 20 | USR-020 | 15185860706580 | Protection Plans Overview |

**Boundary check for part B:** position 21 is `Rate Table Settings`, 22 `Reason Code Settings`,
23 `Reason Code Spiff Table`, 24 `Receivable Payment Source Settings`, 25 `Regional Processing - Reporting Rules`,
26 `Regional Processing - Rules, Notes, and Exceptions`, 27 `Remove from Hold & Send via EDI Preferences`,
28 `Restricted Payment Type Select Window`, 29 `RF Barcode User Settings`, 30 `Sales Performance Report`, … 39.
Part B should start at **Rate Table Settings**.

---

### `USR-001` Attachment Description Entry Screen
*storis_ref: article 15185875552660*

**Purpose.** Tiny modal that captures a human-readable description for a file being attached to a STORIS
record. Shown as the last step of the File Attach procedure.

**Where it lives.** Not independently reachable — it is raised by the **File Attach** procedure from whichever
record screen the user is on (the paper-clip icon).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Attachment Description | Text | Description of the attachment. Enter and click **Save** to return to the main screen. |

**Behavior & rules.**
- **The File Attach procedure copies the selected file and attaches the copy to the record.** The description
  therefore "describes the attached file and not the original file" — the link to the source file on disk is
  severed at attach time; later edits to the original do not propagate.
- On save the user returns to the main screen and **the paper clip icon becomes active** (if not already), which
  is the only visual indicator that a record has attachments.

**Dependencies.** Paired with `USR-011` Edit File Attachments (the maintenance side of the same subsystem).

**Build notes.**
- Model as `attachment { id, entity_type, entity_id, description, filename, content_type, bytes, sha256, uploaded_by, uploaded_at }`.
- Keep STORIS's copy-on-attach semantics (immutable stored blob) — that is the right behavior; store to object
  storage with a content hash so identical files dedupe.
- Improve on STORIS: description should be **optional with a sensible default** (original filename), not a
  mandatory-feeling modal, and we should also retain the original filename separately from the description.
- Attachment add/remove is a change event; feed `RPT-AUDIT`.

### `USR-002` Bank to Print Checks by Currency Settings
*storis_ref: article 15185859409172*

**Purpose.** Defines, per company, which bank account prints AP checks for each currency, and in what
precedence order.

**Where it lives.** `Company Settings > Bank to Print Checks field > Action button` (i.e. a child grid of
`USR-003`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Bank | Code, **required**, lookup (Read-Only Lookup Window) | Bank to add to the grid. **Validated so the bank's company matches the current processing company; on mismatch a warning appears and the user may continue anyway or enter a different bank** (soft validation, not a hard block). Bank name displays under the code. |
| Country | Code, **required**, lookup | Country whose currency is associated with the bank. The country's currency displays under the code. |
| (Add button) | Action | Commits Bank + Country to the grid. |
| Grid: Bank / Description / Country / Currency | Read-only rows | One row per bank-currency pairing. |
| (Remove button, per row) | Action | Deletes the row. |
| (Promote / Demote buttons) | Action | Reorders rows — **order is semantically significant**, see below. |

**Behavior & rules.**
- **Each bank can appear only once, and therefore maps to exactly one currency. A currency may map to many banks.**
- **Default-bank resolution: the first bank listed in the grid for the vendor's currency wins.** Ordering
  (promote/demote) is the tie-break mechanism — there is no explicit "is default" flag.
- **You cannot remove the domestic-currency bank, but you can change which bank is associated with the
  domestic currency.**
- Full AP check-bank hierarchy (from `USR-003`): **vendor remit-to → vendor → company**. At the company level,
  the vendor's currency is looked up in this grid; if the currency is not found, **the domestic-currency bank
  is used as the fallback.**

**Dependencies.** `USR-003` Company Settings (parent); Bank Settings; Vendor / Vendor Remit-To records;
`USR-005` Country Settings (currency definition); Payables Control Settings `Print Bank` (used instead when
multi-company processing is off). Resolver scopes `COMPANY`, `VENDOR_REMIT_TO` (already registered in wave 1).

**Build notes.**
- Implement as a resolver rule set, not an ordered grid: key `(company_id, currency_code) → bank_account_id`
  with a **unique constraint on `bank_account_id`** (a bank belongs to one currency) and a **unique constraint
  on `(company_id, currency_code)`** so there is exactly one answer and no order-dependence. Ordered-list-as-
  precedence is a STORIS wart; do not reproduce it.
- Keep an explicit `is_domestic_fallback` row that cannot be deleted, only repointed.
- Make the company/bank mismatch a **hard validation error**, not a warning-with-continue. Silent cross-company
  bank assignment is a real accounting hazard.
- `[DECISION NEEDED]` LA Mattress: are we multi-currency at all in v1? If USD-only, this whole grid collapses to
  a single `company.default_ap_bank_account_id` and we defer the currency dimension.

### `USR-003` Company Settings
*storis_ref: article 15185876528404*

**Purpose.** Creates the Company record — the legal/reporting entity. **The company is the first element of
the GL account number**, so this is the root of the multi-entity design. At least one Company record is
mandatory at initial startup.

**Where it lives.** Six documented paths, which tells you how central it is:
- `Accounting > General Ledger > General Ledger Settings > Company Settings`
- `Accounting > Third Party Accounting > General Ledger > General Ledger Settings > Company Settings`
- `Accounting > Settings > General Ledger Settings > Company Settings`
- `System Administration > Get Started - Enter Your Information > Get Started Step 3 - Business Information > Company Settings`
- `System Administration > System Settings > Accounting System Settings > General Ledger System Settings > Company Settings`
- `System Administration > System Settings > General Administration System Settings > Company Settings`

Support Files: **Zip Code**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Company Number | Code | Identifies the company. Without multi-company, only one record exists and it is **assigned the number `01`**. With multi-company, numeric codes are recommended. **Max length is 2, 3, or 4 digits, governed by `Company Code Maximum Length` in General Ledger Control Settings.** |
| Company Name | Text | Full legal name. |
| Address Line 1 | Text | |
| Address Line 2 | Text | For PO Box, Dept., etc. |
| Zip Code/Postal Code | Code | **Must already exist in the Zip Code file** (hard rule). |
| City/Town | Text | Defaults from the Zip Code record; overridable by typing. |
| State/Province | Code | Defaults from the Zip Code record; overridable. |
| Telephone | Numeric, 10 digits | **Do not enter hyphens.** |
| Federal ID Number | Text | Optional. |
| State ID Number | Text | Optional (state or province ID). |
| Sales Tax Number | Text | Optional — **except it is required when using Avalara®, where it defines the Company Code used by the AvaTax interface.** |
| Sales Calendar Year | Numeric | Last open sales year. |
| Period | Numeric | Last open sales period. |
| Bank to Print Checks | Code + Action | Active only when using STORIS Accounting. **Required per company when multi-company processing is active. If multi-company is NOT active this field is unavailable and `Print Bank` in Payables Control Settings becomes mandatory instead.** Search → Read-Only Lookup Window; Action → `USR-002` multi-currency grid. |
| General Ledger Cycle | Enum | **(LOCKED — STORIS access ONLY.)** `Calendar` / `Weekly` / `Other`. See below. |
| First Calendar Month | 1–12 | Active only when Cycle = `Calendar`. |
| First Day of the Week | Day | Active only when Cycle = `Calendar`. |
| Current Year | Numeric | Open GL year (display). |
| Period | Numeric | Last open GL period (display). |
| First Posted Year | Picker | First posted year for this company. |
| Retained Earnings | GL account | **Must already exist in the Chart of Accounts.** Total net of P&L accounts posts here for the following year. |
| Multi-Company Transfer | GL account | Active only with multi-company. **Mandatory when `Post GL Account Transfers` = `By Individual Company` in GL Control Settings — in which case the Multi-Company Due From/To fields in General Ledger Assigned Account Settings are no longer used.** Enables due-to/due-from tracking via View Individual Postings with three or more companies. |
| Landed Freight Costs | Checkbox | Activates Landed Freight **at the company level** — includes freight in landed cost. |
| Addon Cost Labels (×4) | Checkbox each | Activates each of four add-on costs for this company. **The four labels' names come from Costing Control Settings.** |
| Amount | Numeric, 2 decimals | Percent or fixed dollar amount of the freight / add-on cost. |
| Type | Enum | `Percent` / `Dollar`. |

**Behavior & rules.**
- **Scope rule (the important one for us):** if **not** using Multi-Company Processing, the fields in this file
  are accessible **only for the default company** named by `Default Company Number` in General System Control
  Settings. If using Multi-Company and the user enters a company other than the default, **the program
  auto-populates the GL fields from the default company and locks them from editing.** So in STORIS, GL
  configuration is effectively global-with-a-company-key, not truly per-company.
- **On filing, G/L Period Table creation branches three ways:**
  - *Any company with Calendar accounting* — G/L Period Table records are created automatically for the
    **prior, current and next fiscal years**; periods are closed based on the fiscal data in the Company record.
  - *Default company without Calendar accounting* — **a warning appears** that G/L Period Table records do not
    exist for prior/current/next fiscal years. (Warning only; nothing is created.)
  - *Other company without Calendar accounting* — period records are created automatically for
    prior/current/next fiscal years **based on the Default Company's tables**; periods closed per this
    company's fiscal data.
- **General Ledger Cycle enum semantics:** `Calendar` = fiscal year/periods follow the calendar.
  `Weekly` = user-defined, **constrained so year and periods are evenly divisible by 7 days**.
  `Other` = user-defined free period definition, **only restriction being that you must define 12 periods**.
  **Any deviation from straight calendar requires a user-built table** and STORIS involvement.
- **Bootstrapping deadlock, documented as a workaround:** to create a new company with a new bank you must
  create the company pointing at an *existing* bank (temporary), save, create the bank in Bank Settings, then
  return and repoint `Bank to Print Checks`. This is a circular FK the product never fixed.
- **Landed-cost / add-on resolution order (verbatim):** "the system checks for freight and landed add-on cost
  settings first at the **regional product level**, next at the **regional vendor level** (with group and
  category exceptions), then at the **advanced product level**, next at the **advanced vendor level** (with
  group and category exceptions), and finally at the **company level**." Company is the last-resort scope.
- Sales-period fields default in from **Fiscal Calendar Settings**; they may be set to any period/year **as long
  as the year is not more than one year greater than the current calendar year**, and thereafter the system
  maintains them automatically via cycle processing.

**Dependencies.** General System Control Settings (`Default Company Number`, `Home Currency`, and the global
**Extended Security** kill-switch noted in wave 1); General Ledger Control Settings (`Company Code Maximum
Length`, `Post GL Account Transfers`); Payables Control Settings (`Print Bank`); Costing Control Settings
(add-on cost labels); Fiscal Calendar Settings; Chart of Accounts; Bank Settings; Zip Code file (`USR-014`);
`USR-002`; `USR-005` Country Settings; Avalara interface. Resolver scope `COMPANY` (wave 1) is anchored here.

**Build notes.**
- `COMPANY` is confirmed as a first-class settings scope. Concretely, **per-company** (must be scoped): legal
  identity + address + phone, Federal/State ID, Sales Tax Number / Avalara company code, AP check bank(s),
  retained-earnings account, multi-company transfer account, fiscal cycle + first month + first day of week,
  current/first-posted year and period, landed-freight flag, and the four add-on cost activations with their
  amount/type. **Global (system-wide, not per company):** the *names* of the four add-on cost labels
  (Costing Control), `Company Code Maximum Length`, `Post GL Account Transfers` mode, `Default Company Number`,
  `Home Currency`, the date format, and the Zip Code and Chart-of-Accounts master files.
- **Deliberately different from STORIS:** do not auto-copy-and-lock GL fields from the default company onto
  other companies. Each company owns its own GL configuration; where we want a shared default, express it as a
  `GLOBAL`-scope value the company row may override, resolved live. Copy-down + lock is the same anti-pattern
  as the group-permission copy-down in `USR-007`.
- Company code: use a surrogate `id` internally and treat the 2–4 digit code as a display/GL-segment attribute.
  Do not let a control setting mutate the width of a primary key.
- Fix the bank bootstrap deadlock: make `default_ap_bank_account_id` nullable at create time.
- Landed-cost resolution is a 6-level most-specific-wins chain
  (`regional product > regional vendor(+group/category exceptions) > advanced product > advanced vendor(+group/category exceptions) > company`).
  That is exactly the evaluation model we want everywhere — implement one generic resolver and register these
  scopes, rather than hand-coding the chain per feature. Add `PRODUCT_CATEGORY` and `VENDOR_REGION` (wave 1).
- `[DECISION NEEDED]` Does LA Mattress need multiple legal entities in v1, or one company with multiple
  locations? Multi-company touches GL account structure, AP bank defaulting, and due-to/due-from postings —
  cheap to design for now, expensive to retrofit.
- `[DECISION NEEDED]` Fiscal calendar: straight calendar, 4-4-5, or 52/53-week? STORIS forces exactly 12
  periods for `Other`; we should allow 12 or 13.
- Company create/edit must feed `RPT-AUDIT` (STORIS has no change log).

### `USR-004` Convert Comment Files
*storis_ref: article 15185859408788*

**Purpose.** A scheduled (phantom) batch job that converts legacy comment files, one file at a time, within a
per-file time budget. A migration/maintenance utility, not day-to-day configuration.

**Where it lives.** `Schedule a Process > Actions button > Enter Process Preferences` (with the Convert
Comment Files process selected).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Select (grid column) | Checkbox per row | Check one or more files to convert during this scheduled phantom. |
| File Name (grid column) | Read-only | Name of the comment file. |
| Runtime (minutes) (grid column) | Integer | **Mandatory if the row is selected. Must be greater than zero.** Maximum minutes the phantom spends on that file before moving to the next, or suspending if it is the last file. |
| Total Runtime | Read-only, footer | Sum of the per-file runtimes = total scheduled phantom duration. |

**Behavior & rules.**
- **Time-boxed, not completion-based: the job stops on a file when its minute budget expires, whether or not
  the conversion finished, and moves on. If it is the last file the process suspends.** Conversion is therefore
  resumable/incremental across runs by design.
- Article carries a gating notice: **"In order to use this feature, you must contact STORIS Product Services"** —
  it is not self-service.

**Dependencies.** Schedule a Process / phantom scheduler framework.

**Build notes.**
- Not a feature to port. Its only value is as a pattern: **long-running data migrations should be
  time-boxed, resumable, and checkpointed**, with a cursor per source file/table so successive runs continue
  where the last one stopped. Adopt that pattern for our own STORIS→LA Mattress data migration jobs.
- Our job runner should record per-run `rows_processed`, `cursor`, `elapsed_ms`, `outcome` and surface them —
  STORIS gives the operator only a minute budget and no progress signal.

### `USR-005` Country Settings
*storis_ref: article 15185876533396*

**Purpose.** Defines a country as a **jurisdiction + currency + address-format** unit. Drives foreign
processing (exchange rates, AP GL accounts by country), currency display, and the shape/labels/validation of
address and phone entry throughout the system. This is the multi-jurisdiction foundation.

**Where it lives.**
- `System Administration > Get Started - Enter Your Information > Get Started Step 6 - Purchasing > Country Settings`
- `System Administration > System Settings > General Administration System Settings > Country Settings`

Tabs: **General**, **Masking**. Actions menu: **Set Domestic**.

**Fields — key**

| Field | Type | Purpose / business rule |
|---|---|---|
| Country Code | Up to **5 alphanumeric** characters | Country to create/edit. **STORIS ships `CAN` (Canada) and `USA` (United States) pre-built.** |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Name | Text | Country name. |
| Name of Currency | Text | e.g. `DOLLAR` for USA, `EURO` for European countries. |
| Name of Fraction | Text | e.g. `CENT` for the US; article's own example says `PESO` for Mexico (which is the currency, not the fraction — **source error, do not copy**). |
| ISO Country Code | Up to 3 chars | **Required when using Avalara.** |
| Currency Symbol | Text | e.g. `$`. |
| Nbr of Decimals | Integer | Decimal places for the currency; `2` for USD. |
| Symbol Placement | Enum | `Before` / `After` the currency figures. |
| Accounts Payable GL Account | GL account | Tracks GL activity for this specific country. Action button → GL Account Entry Screen. |
| Exchange GL Account | GL account | Tracks exchange-rate movement **between AP bill creation and payment issue**. Action button → GL Account Entry Screen. |
| Estimated Exchange Rate | Numeric, 6 dp | Rate used **in Purchase Order Entry**. **Set to `1.000000` for the domestic country.** |
| Actual Exchange Rate | Numeric, 6 dp | Most current rate. **`1.000000` for domestic.** STORIS recommends periodic manual update. **Overridable only at the `Exchange Rate` field in Distribute Add-on Receiving Costs — "in the case of foreign exchange rates only".** |
| National Tax Code | Tax code | Activates the National Tax Feature. **Active only for the domestic country, and only STORIS personnel may edit the domestic country record** — so activating national tax requires a STORIS rep. **The code must exist in Sales Tax Settings with `Type of Tax` = `National`.** Used with `Charge National Tax Sales` (Customer Settings) and `National Tax Exempt` (Advanced Product Settings). |
| Dial Prefix | Text | International dial prefix. |
| TPA Equivalent | Text | Alternate value sent to a third-party accounting package or the Generic Interface when the STORIS code is incompatible. Example given: STORIS `CAN` ↔ QuickBooks® `CANADA`. **Inactive if you use STORIS Accounting.** |
| Date Format (Domestic Country Only) | Enum | `U.S. – MM/DD/YY` / `European – DD/MM/YY`. **System-wide date format, but stored on the domestic country record — and therefore only changeable by a STORIS rep.** |

**Fields — Masking tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| First Address Mask | Mask | Segment 1 of the address. US example: `AXXXXXXXXXXXXXXXXXXX` (City). |
| First Address Prompt | Text | Label for segment 1. US: `CITY`. |
| First Delimiter | Char | Between segments 1 and 2. US: `,`. |
| Second Address Mask | Mask | Segment 2. US: `AA` (State). |
| Second Address Prompt | Text | US: `STATE`. |
| Second Delimiter | Char | Between segments 2 and 3. **US: blank** (no delimiter between State and Zip). |
| Third Address Mask | Mask | Segment 3. US: `99999-9999` (Zip). **Spaces are permitted in zip codes** (for CAN-style postal codes). |
| Third Address Prompt | Text | US: `ZIP CODE`. |
| Telephone Number Mask | Mask + Action | A single mask, **or** click the Action button for **Telephone Mask Settings** to define multiple masks per country. |

**Mask alphabet (verbatim, hard rule).**
- `A` – alpha character only
- `9` – numeric character only
- `X` – alpha or numeric character
- `0` – **optional** use of a space where the character appears (example given: mask `99900` is a three-digit
  number that may or may not carry one or two additional characters)
- `(/)` slash — delimiter; `(-)` dash — delimiter; `( )` space — delimiter

**Behavior & rules.**
- **Every system must have exactly one domestic (home) country, determined by `Home Currency` in General
  System Control Settings.** The Actions menu's **Set Domestic** designates it.
- **The domestic country record is locked: "If you attempt to edit settings for your domestic country, an
  error message appears."** Editing requires a STORIS representative. This means the date format, national tax
  activation, and the home country's own address masks are all effectively vendor-gated. **Flag as a
  serious operability defect — a customer cannot change their own system date format.**
- Country is simultaneously carrying four unrelated concerns: currency definition, FX rates, AP/FX GL account
  mapping, and address/phone input formatting.

**Dependencies.** General System Control Settings (`Home Currency`); Sales Tax Settings (`Type of Tax` =
`National`); Customer Settings (`Charge National Tax Sales`); Advanced Product Settings (`National Tax
Exempt`); Chart of Accounts; Telephone Mask Settings; Zip Code file (`USR-014`); `USR-002`/`USR-003` (currency
→ bank); Distribute Add-on Receiving Costs; Avalara; TPA / Generic Interface.

**Build notes.**
- **Split the concerns STORIS fused.** Model separately: `country` (ISO-3166 alpha-2 + alpha-3, name, dial
  prefix, address format, phone format), `currency` (ISO-4217 code, symbol, minor units, symbol placement),
  and `fx_rate` (currency pair, rate, effective_from, source). A country references a currency; it does not
  *define* one. Multiple countries share EUR; that is impossible in the STORIS model.
- **FX rates must be time-series, not a single mutable field.** STORIS's `Actual Exchange Rate` is a
  destructive overwrite with no effective date and no history, which makes revaluation unauditable. Store
  `(base, quote, rate, effective_from, effective_to, source)` and resolve as-of transaction date. Keep the
  "estimated vs actual" distinction as `rate_type ∈ {ESTIMATED, ACTUAL}` — estimated for PO entry, actual for
  settlement — because the estimate/actual delta is what the Exchange GL Account exists to capture.
- **Do not lock the home country record.** Everything STORIS gates behind a support call (date format, national
  tax, home address masks) must be self-service and permission-gated in our system.
- **Date/number formatting is a display concern and belongs to the user/locale, not to the domestic country
  row.** Store all timestamps UTC, all money as integer minor units + currency code, and format per viewer
  locale. Do not implement a global `MM/DD/YY` vs `DD/MM/YY` switch.
- Address masks: adopt the *idea* (per-country address shape and labels — City/State/Zip vs
  City/Province/Postal Code) but implement as a declarative per-country address schema
  (`{ ordered fields, label, required, validation regex, uppercase }`), not a positional mask string. Keep the
  masks as our seed data for USA and CAN.
- Settings scope: `COUNTRY` should join `COMPANY` in the resolver — AP GL account, FX GL account and tax
  behavior are all country-scoped. National tax being domestic-only is a STORIS limitation, not a requirement.
- `[DECISION NEEDED]` LA Mattress: US-only in v1? If so, seed `USA`, implement the country/currency split
  anyway (it is nearly free at model time), and skip FX, foreign AP GL and TPA equivalents entirely.

### `USR-006` Create a User
*storis_ref: article 15185876530068*

**Purpose.** The master user record. Creates the identity everyone in the organization uses to access STORIS,
and carries — on one row — authentication, session limits, lockout state, printing defaults, messaging,
CRM data scope, report-builder data security, and location/regional data restrictions. **This is the row that
is actually enforced at runtime** (see `USR-007`).

**Where it lives.**
- `System Administration > Get Started - Enter Your Information > Get Started Step 5 - Users > Create a User`
- `System Administration > System Settings > System Permissions > Create a User`

Tabs: **General**, **Output**, **Security**, **Access**.

The article states the file is also used to specify: security settings **if Extended Security is active via
General System Control Settings**; STORIS Messenger settings; Report Builder Security settings; Location and
Regional Processing restrictions; and other staff data.

**Fields — key**

| Field | Type | Purpose / business rule |
|---|---|---|
| User ID | Up to **5 alphanumeric** | Identity used in comment-tracking records and required for access to certain programs. Many clients use the same code as both **Login ID** (accesses SCI and the STORIS server) and **User ID** (accesses STORIS after the server). **Exception: the field accepts 6 alphanumeric characters for RF and Store Barcode Users only** (Barcode User Type set in RF Barcode User Settings); **entering a 6-character ID that is not an existing user raises a warning.** |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Name | Text | Employee name. **Also displayed in the upper-left corner of the main menu when this user signs on.** |
| User Group | Code, **required** | The group this user belongs to. **User groups provide menu security.** (Note: `USR-007` and its read-only twin call this same field the **Type** field — the docs are inconsistent about its name.) **STORIS ships standard user types whose codes always begin with `S$`** — e.g. `S$CS` for customer service. **Standard user types cannot be edited, but can be copied via Create a User Group and the copies edited.** |
| Extension | Text | Telephone extension. Reference only. |
| Email Address | Email | Used to send system email if Email is active. |
| Employee ID | Up to **7 characters** | **Reporting purposes only** (e.g. Report Sales Commissions shows it per salesperson). |
| Email Preference | Enum | `HTML` / `Plain Text` — format for emails generated via Schedule a Process. **Active only if an email address exists for the user.** |
| Salesperson Code | Code, lookup | **Entering a salesperson code grants the user access to CRM information such as sales leads associated with that salesperson.** A permission side effect of a demographic field. |
| Buying Group | Code, lookup | Assigns areas of buying responsibility. Lookup is filtered to **unassigned groups or groups already assigned to this user**. **A single staff member may hold multiple buying groups, but a buying group can have only one set of user (buyer) initials** — i.e. group→user is many-to-one. |
| Language Code | Enum | Active with Multi-Lingual Processing. Default **English**; group article enumerates `English`, `French`, `Spanish`, `Alternate` (`Alternate` for a second version or dialect). |
| Cash Drawer | Code, lookup | Default cash drawer prefilled at `Cash Drawer ID Number` on the Log In screen. **Users can override at login. The drawer must be valid for the user's current location (per `Location` in Cash Drawer Control Settings), otherwise no default appears.** |
| Payment Terminal | Picker, optional | **Validated on save against the location(s) in `Warehouse/Store Location` on the Access tab.** |
| Tethered Terminal | Picker, optional | **Validated on save against the location(s) in `Warehouse/Store Location` on the Access tab.** |
| Enable Signature Capture | Checkbox | For terminal-server logins. **Interaction rule: if `Allow Logon Passthrough` is checked, this field alone decides whether signature capture is enabled (the user never sees the login screen). If passthrough is NOT checked, this field merely supplies the default for the checkbox on the User Log In screen, which the user may change.** |
| Enable Messenger Access | Checkbox | Enables the STORIS Messenger mail system for this user. |
| Review Messages at Logon | Checkbox | For Messenger users with unread mail, opens Send/Review Mail Messages automatically during login. **Precedence rule: enabled → it overrides `Message Review Logon` in STORIS Messenger Control Settings; disabled → it defers to that control setting.** (An "enabled overrides / disabled defers" checkbox — a three-state setting crammed into a boolean.) |
| Messenger Administrator | Checkbox | **Mail administrators can access and modify all Messenger groups and all messages, open or closed. Any number of users may be administrators.** |
| Default Messenger Form | Code, lookup | Default mail form when printing Messenger mail. |

**General tab — Actions menu.** `Access Delivery Time Range`, `Customer Service`, `Folio Settings` (**active
only if a custom plug-in point has been installed**), `Receivables Collector`, `RF Barcode`,
`Salesperson File Maintenance` (**applies to the salesperson at `Salesperson Code`; if that field is blank,
this option creates a salesperson record whose salesperson number equals this user's Employee ID, up to 5
characters**).

**Fields — Output tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Printed Document Destination | Enum | `Standard Printing` (**this option is what grants access to the `Printer Admin Level` field on the Security tab**) / `Local Printer` / `Printing Not Allowed`. |
| Printer Zone | Text | Zone for printing; blank if not using Printer Zones. |
| Default Logical Printer | Printer Number (Printer Settings) | **Fallback printer — "if no other printer is found, the system will print to this printer."** |
| Default Print Form | Form Number (Form Settings) | Default print form. |
| Default Hold Queue | Checkbox | Creates a hold file for all of this user's print jobs, enabling on-screen review and reprint of already-printed output. |
| Default Suppress Queue | Checkbox | Suppresses print jobs. **Can be combined with Default Hold Queue to capture suppressed jobs as hold files instead of losing them.** |
| Default Number Copies | Integer **1–999** | **Default 1.** |
| Include Report Banner | Checkbox | Prints a banner on separate pages carrying user ID, date, time and job info. Normal report headers print regardless. |
| Start Forms Printer at Logon | Checkbox | Preloads the Design Enhanced Laser Forms print application at login. **No jobs print as a result** — it is purely a warm-start optimization for a large, slow-loading program. |

**Local Printer caveats (hard rules, verbatim in substance).**
- **Printing is not available from End-of-Day and End-of-Month processes if Regional Processing is active.**
- **The `Printer` option is unavailable when printing STORIS reports via the Output Settings screen** — the
  user must send the report to another output (e.g. Screen) and print from there.
- End-of-Day writes reports to `C:\Users\USERID\Documents\STORIS\Reports\EOD_YYYYMMDD`
- End-of-Month writes to `C:\Users\USERID\Documents\STORIS\Reports\EOM_YYYYMMDD`
- **For a non-Live account the account name is appended:** `C:\Users\USERID\Documents\STORIS\Reports\EOM_YYYYMMDD_ACCOUNTNAME`

**Fields — Security tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Password | **Up to 50 alphanumeric, UPPER-CASE characters** | Verified during security checks and at the User Log-In screen **if Extended Security is active**. A toggle reveals the text. See the password rules below. |
| Reset Password (button) | Action | Complex-Passwords only. Clears the current password and displays `RESET`; the user is prompted to set a new one via Change User Passwords at next login. Clicking again cancels. |
| Exempt from Active Directory Authentication | Checkbox | Prevents STORIS from validating the login against Windows® Active Directory; the user then has separate STORIS and Windows credentials. **If this box is NOT checked, the ability to change, reset, or view the user's password is disabled.** **STORIS recommends at least one administrative user be exempt, as a break-glass account in case AD login fails.** |
| Login ID | **Up to 40 alphanumeric** | O/S Login ID / Server ID. Not required — leave blank if identical to User ID. |
| Allow Logon Passthrough | Checkbox | Suppresses the User Log-In screen for this user. **Clicking the Restart button shows the User Log-In screen regardless.** |
| Maximum number of concurrent sessions | Integer **1–999**, blank allowed | **Blank = unlimited.** `1` = single session; opening another prompts to terminate the first, and **the first session is terminated (and the STORIS license released) only once the user reaches an input point outside of an entry process** — i.e. termination is deferred, not immediate. `>1` = that many concurrent sessions. |
| User Locked Out | Checkbox + state label | Temporary vs permanent lockout — see below. |
| PC Applications (PC button) | Multi-select window | Opens `USR-019` PC Applications Window. Options: `EIS Merchandising`, `Executive Vision`, `Finance II Rpt Writer`, `Limit to Company`, `Report Builder`. |
| File Security Groups | Multi-select codes | Report Builder / Query Wizard data security. **Inverted semantics — see below.** |
| Field Security Codes | Multi-select codes | Report Builder / Query Wizard field-level security. **Inverted semantics — see below.** |
| Enable Corporate Access | Checkbox | **Unlimited access to CRM data. Checking it de-activates `District Manager` and `Store Manager Locations`.** |
| District Manager | Code, lookup | Access to all CRM data for the stores assigned to that district manager. **Entering a district manager de-activates `Store Manager Locations`.** |
| Store Manager Locations | Multi-select locations | Access to CRM data for a selected group of stores (Multiple Location Selection window). |
| Enable UP System | Checkbox | With the next field, sets Up System access level — see the three-level table below. |
| UP System Administrator | Checkbox | See below. |
| Notify of License Expiration | Checkbox | STORIS software license expiry warnings — see below. **Not available via Create a User Group** (user-only setting). |
| Printer Admin Level | Enum | `Cannot Change Printer` (users print only their own jobs) / `Change Only Within Zone` (may access printers in the current printer zone via the Printer Definitions Screen, plus review and print own jobs) / `Can Make Any Changes` (may print **all** print jobs and establish Printer Zone Settings). **Only accessible when `Printed Document Destination` = `Standard Printing`.** |
| Access Archived Reports | Enum | `All Archived Reports` / `User's Archived Reports`. Governs Review Archived Reports and Review Print Jobs. **New users default to `User's Archived Reports`.** |

**Password and lockout rules (hard rules).**
- **`Password` is documented here as up to 50 alphanumeric UPPER-CASE characters.** **CONTRADICTION with wave 1**,
  which recorded a 10-character cap. Both agree the character set is uppercase alphanumeric only.
  Treat the length as *uncertain* (10 vs 50, likely version- or Complex-Passwords-dependent); treat
  **"uppercase alphanumeric only" as the confirmed, and disqualifying, fact.**
- **Non-complex passwords:** clearing the Password field sets the password to **Null**, which forces the user to
  set a new one via Change User Passwords at next login.
- **Complex passwords in use:** the field is not editable in the usual way. **A newly created user's Password
  field is automatically set to the literal `RESET` and cannot be changed**; the user sets their own at first
  login. Once set, **the field is encrypted and displays exactly 8 asterisks (`********`) regardless of the
  real length.**
- **You cannot change or reset a user's password while they are logged on to any account on the system.**
- **Temporary lockout: after six unsuccessful login attempts the system checks the box and labels it
  "Temporarily", recording the lockout date and time in the form `internal date:internal time`.** It clears via
  any of: **(a) after 30 minutes, when a new logon attempt is entered** (note: it is the *next attempt* that
  clears it, not a timer); (b) an administrator unchecking the box; (c) an administrator clicking **Reset
  Password**.
- **Permanent lockout: an administrator checks the box (label becomes "Permanently"). The system never clears
  it automatically — an administrator must uncheck it.**
- **Login ID resolution:** at the System Login Form the user enters Login ID + password. **Before showing the
  User Log-In screen the system checks the `User ID` field and then the `Login ID` field; a match in either
  proceeds, no match aborts the login with an error.** So two distinct namespaces are searched for one credential.
- Documentation inconsistency to be aware of: the `Login ID` help text refers to "the 4-character maximum
  allowed by the User ID field" while the `User ID` field itself says 5 (6 for barcode users). **Do not trust any
  of these lengths as-is.**

**Report Builder data security — inverted semantics (surprising, verbatim).**
- File Security Groups: "**The presence of a file security group in this window indicates that the staff member
  is restricted from the source files included in the file security groups.** … **To override the restriction …
  check the box next to the group.** The check means you can access all the source files in the group, **even if
  the source file appears in another file security group.**"
- Field Security Codes: "**All users are restricted from accessing Report Builder report data generated from a
  STORIS field to which a field security code has been attached.** To override the restriction, check the box
  next to the code."
- **Both are deny-by-default with an explicit allow-override, and the file-group override is the stronger of the
  two — a check in one group defeats the same file's membership in another group.** Field access additionally
  requires source-file access; the two are ANDed.

**CRM (InTouch) access rules.**
- **Users not defined as one of Corporate / District Manager / Store Manager (or given a Salesperson Code)
  cannot create or update any leads at all.**
- Access is additive: `Salesperson Code` on the General tab grants that salesperson's leads **in addition to**
  whatever Corporate Access / District Manager / Store Manager Locations grant.
- Mutual exclusion is enforced by field de-activation, top down: Corporate ⟹ disables DM and Store Manager;
  DM ⟹ disables Store Manager.

**Up System access levels (exact three-state matrix).**

| Enable Up System | UP System Administrator | Level | Capability |
|---|---|---|---|
| blank | blank | Basic | Can perform only movements from one list to another. |
| checked | blank | Intermediate | Also edit opened or closed assignments (**closed for that day only**). |
| — | checked | Administrator | Create Up system action codes; check out all staff for the day; **purge all activity for a day**; edit/delete completed activity information. |

**License expiration notification (exact thresholds).** Expiry is `Licensing Expires` on the Licensing tab of
General System Control Settings. When `Notify of License Expiration` is checked:
- **15 days out** — the Acknowledge Message window appears for **these users**.
- **10 days out** — Acknowledge Message for these users, **plus all users** get a dismissible notification at
  the bottom of their session after login carrying the same text.
- **3 days out** — Acknowledge Message for **all users**, plus the same dismissible session notification.
- If unchecked, **no users are notified and a log is written recording that the license is expiring and that no
  user has the setting checked.** If no expiration date exists, nothing is deployed.
- **UniData licenses:** if the flag is set and fewer than 15 days remain, a popup appears at login;
  **at 3 or fewer days everyone who logs in sees the popup regardless of the flag.**

**Fields — Access tab (location & regional restrictions)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Warehouse/Store Location | Multi-select | Warehouses/stores this user may access (Multiple Location Selection). **STORIS ships a pre-built location `88`** usable as a temporary valid login location before real locations exist. Also referenced by Report Time Clock Activity when run by store or district. |
| Default a Login Location | Checkbox | Offers a default store on the User Log In screen — **the first location listed in `Valid Logon Locations`**. If blank, no default is offered, **and since Store Location is required the user must supply one to log in.** The user may change their default at the login screen. |
| Fulfillment Location Restrictions — Delivery / Customer Pickup | Enum per method | `Use Access Restrictions` (reuse the Inventory–Entry radio group as the fulfillment location list) or `Location List` (**a Location List must then be selected; the field accepts a list predefined via `List Type` in Process List Settings as `'Accessible Location List'`**). **For Deliveries the list applies to sales order deliveries, exchange deliveries, and return pickups.** |
| Company | Multi-select | **Companies to which this user has informational access. Multiple companies per user. If no companies are defined, the user has access to ALL companies** (blank = unrestricted, the classic dangerous default). **Costing processes present information based on the locations of the companies the user can access, and every process that prompts for Company validates the user's access to it.** |
| Global Location List | List code + Action (Program List Creation Window) | Global list of permitted locations. **Regional Processing does NOT have to be active for this to be enforced, and Global Location Lists override regional and district boundaries.** **At login, if no list is specified on the User record, the system falls back to a list associated with the log-on location in the Location Settings file. The system then verifies the user has list access to the location they are logging on to.** |
| Sales — Entry | Enum | `None` / `Logon Location` / `District` / `Global Location List` / `Location List`. Restricts create/edit/delete of **sales documents**. |
| Sales — Location List | List code | **Required when Sales–Entry (or Sales–View/Report) is `Location List`.** **Note: "This field does not apply to customers. You can manually enter customers from any region."** |
| Sales — View/Report | Enum | Same five options; restricts **inquiry** on sales documents. |
| Inventory — Entry | Enum | `None` / `Logon Location` / **`Region`** / `Global Location List` / `Location List`. Restricts create/edit/delete of inventory documents. |
| Inventory — View/Report | Enum | Same five; restricts inquiry/reporting on inventory data. |
| Inventory — Location List | List code | Required when the corresponding radio is `Location List`. |

**Access-tab rules.**
- **Sales restrictions use `District`; Inventory restrictions use `Region`.** The two axes are deliberately
  different — do not conflate them.
- **The Sales and Inventory radio groups require Regional Processing to be active in General System Control
  Settings, and it must REMAIN active for the restrictions to be enforced** — turning Regional Processing off
  silently disables the restrictions while leaving the settings visibly configured. **Serious failure mode.**
- **STORIS's own recommendation: "assign each user to a single setting across the board (for example, Logon
  Location)"** — an admission that mixing the four axes produces unpredictable results.
- **`Order Access Limited to Selling Store` in Point of Sale Control Settings can further restrict order access
  on top of the user's location restrictions.**
- **Fulfillment escape hatch: "even if the user is not assigned access to a specific location, editing an order
  with a location that is not normally permitted for the user adds that location to the list of available
  locations for both the stock and fulfillment location selection."** **A documented, silent privilege
  escalation via data, not configuration.**

**Global gotcha.** **"If you make a change to the User file, you must restart STORIS before the change can take
effect."** Permission and restriction changes are not live.

**Dependencies.** General System Control Settings (**Extended Security global kill-switch — every Security-tab
permission is inert without it**; `Menu Timeout`; `Licensing Expires`; Regional Processing flag);
`USR-007` Create a User Group; `parts/user-security-CATALOG.md` (355 permission flags across the 10 Actions-menu
security modules: Import Data, Logistics, Payables, Personal Information, Purchasing, Receivables, Sales,
Service, System, Transfer); Report on User Security; Assign Screen Action Permission; RF Barcode User Settings
(`USR-029`, part B); Cash Drawer Control Settings; Printer Settings / Form Settings / Printer Zone Settings;
Process List Settings (`'Accessible Location List'`); Location Settings; Warehouse/Store Location Settings;
Point of Sale Control Settings (`Order Access Limited to Selling Store`); Salesperson file; Buying Group file;
STORIS Messenger Control Settings; `USR-019` PC Applications Window; `USR-003` Company Settings (the `Company`
multi-select is the `COMPANY` scope in the resolver); Complex Passwords Overview (article 15186451249300,
outside this section).

**Build notes.**
- **Confirmed for the permission model:** the user row is what carries and enforces authorization. Group
  membership is a single scalar field on the user (`User Group`, required), and everything else — location
  restrictions, security-module flags, report-builder data security — is stored *on the user*. `USR-007`
  confirms the group only pushes values *into* those user fields. **So wave 1 is correct: STORIS group
  permissions are a copy-down template, not live inheritance.**
- **Our replacement, specified:**
  1. **Live evaluation, no copy-down.** Nothing is ever written from a role onto a principal. A permission
     decision is computed at request time from the union of the principal's direct grants and the grants of
     every role/group it belongs to. Editing a role changes behavior for its members immediately — no reset
     checkbox, no batch job, and **no STORIS restart**.
  2. **Scoped grants.** A grant is `(subject, permission, effect, scope)` where `subject` is a user or group,
     `effect ∈ {ALLOW, DENY}`, and `scope` is a node in the org hierarchy
     `GLOBAL > COMPANY > REGION > DISTRICT > LOCATION` (plus resource-type scopes like `PRODUCT_CATEGORY`,
     `VENDOR_REGION`, `TERMS_CODE` from wave 1).
  3. **Most-specific scope wins.** Evaluate the grants whose scope contains the resource; the grant at the
     deepest (narrowest) matching scope decides. A `LOCATION`-scoped grant beats a `COMPANY`-scoped one, which
     beats `GLOBAL`.
  4. **Deny beats allow within a scope.** At equal specificity, any `DENY` wins over any `ALLOW`, regardless of
     whether it came from the user directly or from a group. Ties never resolve by row order.
  5. **Default deny.** Absence of a matching grant is a deny. No blank-means-all-companies.
  6. **No global kill-switch.** There is no equivalent of `Extended Security`; permissions are always enforced.
  7. **Explainability.** The evaluator returns the winning grant (subject, scope, effect, source role) so an
     admin can answer "why can/can't this user do X" — replacing STORIS's `Report on User Security`, which can
     only dump the current copied-down state.
  8. **Every grant change is an audit event** feeding `RPT-AUDIT` — created/updated/deleted, before/after,
     actor, timestamp.
- **Split this god-record.** `user` (identity, auth, status) / `employee` (name, extension, employee id,
  salesperson link, buying groups) / `user_preferences` (language, email format, printing defaults, default
  cash drawer/terminal) / `role_membership` / `grant`. STORIS's single User file mixing HR data, device
  bindings, print defaults and authorization is the root cause of most of the weirdness above.
- **Do NOT reproduce the STORIS password policy.** Uppercase-only alphanumeric passwords (with a length cap of
  10 or 50 depending on which doc you believe) is a materially weak scheme: it collapses the alphabet to 36
  symbols and silently destroys any passphrase a user types in mixed case. Our policy: **hash with Argon2id;
  accept the full Unicode printable range with no case folding and no character-class rules; minimum 12
  characters with no maximum below 128; screen candidates against a breached-password list (k-anonymity range
  query); no forced rotation; support TOTP/WebAuthn second factor for admin roles.**
- **Lockout:** STORIS's shape (6 failures → 30-minute temporary lock, clearing on next attempt; permanent lock
  manual-only) is roughly reasonable but the auto-clear-on-attempt trick is a bug magnet. Ours: exponential
  backoff per (account, IP) with a hard 15-minute lock after 10 failures within 15 minutes, a true expiry
  timestamp (not "clears when someone tries again"), an admin `disabled` flag distinct from a lockout, and
  **every failed attempt and every lock/unlock logged to `RPT-AUDIT`**.
- **Kill the "restart STORIS for changes to take effect" rule.** Authorization must be evaluated per request
  against current state; the only cache permitted is one with an explicit invalidation on grant change.
- **Fix the blank-means-everything defaults.** Empty `Company` meaning "all companies" and empty location lists
  meaning "no restriction" are backwards. Empty means none; "all" must be an explicit grant.
- **Fix the fulfillment escape hatch.** Editing an order must never widen a user's location set. If a user
  cannot see a location, they get a read-only view of that line and cannot select it.
- **Keep, and generalize, the deny-by-default field/file data security.** STORIS's File Security Groups /
  Field Security Codes are effectively column- and table-level ACLs for ad-hoc reporting. We want the same for
  our report builder — but expressed as ordinary grants in the same evaluator, not a parallel mechanism with
  inverted checkbox semantics.
- Keep as real requirements: concurrent-session limit, per-user default location, default cash drawer, and
  archived-report scope (`own` vs `all`) — all sensible. Drop: printer zones/logical printers/hold-suppress
  queues (we print to PDF/browser), Messenger, Up System, license-expiry nagging, Active Directory exemption
  (we will use SSO/OIDC with break-glass local admin accounts as the deliberate equivalent), and the `S$`
  standard-user-type convention.
- `[DECISION NEEDED]` LA Mattress: is SSO (Google/Microsoft) the primary auth, with local passwords only for
  break-glass and shared floor terminals? That decision drives whether we build password policy at all.
- `[DECISION NEEDED]` Do we need the Sales/District vs Inventory/Region distinction, or is a single
  `Company > Region > Location` hierarchy sufficient for LA Mattress?
- `[DECISION NEEDED]` Shared store terminals: STORIS binds cash drawer / payment terminal / signature pad to the
  *user*. Device bindings should probably belong to the **workstation**, with the user only supplying identity.

### `USR-007` Create a User Group
*storis_ref: article 15186132800788*

**Purpose.** Classifies users into groups for applying security restrictions to selected STORIS routines —
principally **menu security** (which menus a class of user may reach). Every STORIS user must belong to one.

**Where it lives.** (Access paths are blank in this article; taken from its read-only twin, *View Create a User
Group*, article 15295156484244.)
- `System Administration > Get Started - Enter Your Information > Get Started Step 5 - Users > Create a User Group`
- `System Administration > System Settings > System Permissions > Create a User Group`

Tabs: **General**, **Access**. Support Files: None.

> **Source-quality note (important for coverage honesty).** **The published `Create a User Group` article is
> defective: every field on the General tab is rendered as a bare accordion label with an empty body — the
> field descriptions were not published.** The article body is also duplicated verbatim twice. The field
> semantics below were therefore recovered from the **read-only twin article, `View Create a User Group`
> (id 15295156484244)**, which the article itself states "is identical to the original, Create a User Group
> process. However, user group information may not be modified using this process." That article is in another
> agent's section (System Administration Views and Reports); flagged here so the two write-ups do not
> contradict each other.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| User Group ID | **Up to 6 characters** | The group code, e.g. `SALES`. **STORIS ships a group called `SYSMGR`. Assign your system administrator/manager to it, and assign it ONLY to personnel responsible for maintaining the system, because only users in the `SYSMGR` user group have access to the Get Started menu.** (Compare `USR-006`: the *standard user types* codes begin with `S$`, e.g. `S$CS` — a separate, non-editable, copyable set.) |
| Description | **Up to 20 characters** | Describes the Staff Type / classification, e.g. type `SALES` → `SALESPERSON`. |
| Menu Timeout Active | Checkbox | Activates the Menu Time-Out feature for the group. **Requires a time-out period at `Menu Timeout` in General System Control Settings; if the box is blank OR no period is specified, menu time-out is inactive for the group. This field does NOT affect the Login Time-Out feature.** |
| File Security Groups | Multi-select codes | Same deny-by-default / check-to-override semantics as on the user (`USR-006`), applied to the staff type: presence in the list = restricted from those source files for Query Wizard / Report Builder; **a check overrides, granting all source files in the group even if a file also appears in another group.** |
| Field Security Codes | Multi-select codes | All users are restricted from Query Wizard data generated from a field carrying a field security code; a check overrides. **Field access still requires access to the source file via File Security Groups (the two are ANDed).** |
| Reset User Members | Checkbox | **The copy-down switch. See below — this is the most important field in the section.** |
| Language Code | Enum | With Multi-Lingual Processing: default `English`; also `French`, `Spanish`, `Alternate`. |
| Allow Logon Passthrough | Checkbox | Suppresses the User Log-In screen for the group. **The Restart button shows the login screen regardless.** |
| Enable Signature Capture | Checkbox | Group-level default for terminal-server signature capture. Same interaction as on the user: **passthrough checked ⟹ this field decides; passthrough unchecked ⟹ this field only supplies the login-screen default.** |
| Maximum number of concurrent sessions | Integer **1–999**, blank allowed | **Blank = unlimited.** `1` = single session, with the same deferred-termination behavior as `USR-006`. `>1` = that maximum. |

**General tab — Actions menu.** `Access Delivery Time Range`, **`Clone Info For New User Group`**,
`Folio Settings` (active only with a custom plug-in point), and the ten extended-security modules:
`Import Data Security`, `Logistics Security`, `Payables Security`, `Personal Information Security`,
`Purchasing Security`, `Receivables Security`, `Sales Security`, `Service Security`, `System Security`,
`Transfer Security`. **"Security settings on these screens are only effective if extended security is active on
your system via the General System Control Settings."**

**Fields — Access tab (location restrictions)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Sales — Restrict Entry | Enum | `No Restrictions` / `Logon Location` / `District` / `Global Location List` / `Location List`. **Note the label differs from the user screen, which calls the same option `None`.** `Global Location List` refers to **the `Global Locations List` field in Create a User** — i.e. the group setting points at a *user-level* field. |
| Sales — Location List | List code | Required when the adjacent radio is `Location List`. Action button → Program List Creation Window. |
| Sales — Restrict Inquiry | Enum | Same five options, for inquiry on sales data. |
| Inventory — Restrict Entry | Enum | `No Restrictions` / `Logon Location` / **`Region`** / `Global Location List` / `Location List`. |
| Inventory — Restrict Inquiry | Enum | Same five, for inquiry on inventory data. |
| Fulfillment Location Restrictions — Delivery / Customer Pickup | Enum | `Use Access Restrictions` (use the Inventory–Entry radio group as the fulfillment location list) or `Location List` (**a Location List predefined via `List Type` in Process List Settings as `'Accessible Location List'` must be selected**); Delivery covers sales order deliveries, exchange deliveries and return pickups. |

**Behavior & rules.**
- **`Reset User Members` — copy-down, CONFIRMED (verbatim):** *"If you check the box, the system applies any
  changes you make here to all other users in the current user group (that is, the system updates those
  individual user records). If you leave the box blank, the system does not update individual user records."*
  And: *"You can also use this field to mass-update the fields in a User record when the user changes to a new
  user group. If you change the user group to, for example, MANAGER, then access the MANAGER record in the User
  Group file and check the Reset Staff Members box, the system updates the User record so the field responses
  match the responses at the associated fields in the User Group file."*
  - **This settles the wave-1 question: STORIS group settings are a copy-down template, not live inheritance.
    Group values reach users only when an administrator explicitly checks this box; the values then live on,
    and are enforced from, the individual User records.**
  - **Corollaries, all bad:** (a) leaving the box blank makes a group edit a **no-op for existing members** —
    the group screen shows one thing and the system enforces another; (b) checking it **overwrites every member's
    individual settings with no preview, no selection, and no undo** — deliberate per-user exceptions
    (a wider session limit, a different location list) are destroyed silently; (c) after any per-user edit the
    group record no longer describes its members, so **the group screen is not a reliable answer to "what can
    this group do"**; (d) the field is also the *intended* mechanism for onboarding a user into a new group,
    which means the normal workflow is the destructive one.
  - **The field is called `Reset User Members` on the screen and `Reset Staff Members` in the same help text.**
    Same control, two names.
- **Group membership lives on the user** (`User Group` on `USR-006`'s General tab, referred to in this article
  as the **Type** field), is **required**, and is **single-valued — a user belongs to exactly one group.**
- **`Notify of License Expiration` exists on the user but explicitly "is not available via Create a User
  Group"** — so the group is not even a complete template of the user record.
- Access tab availability is self-contradictory in the source: *"To access this tab, Regional Processing must be
  active in the General System Control Settings"*, immediately followed under RESTRICTIONS by *"These settings
  are active whether or not Regional Processing is active in your system."* **Read as: Regional Processing gates
  visibility of the tab, but once set the restrictions are enforced regardless.** That differs from `USR-006`,
  where the user-level Sales/Inventory restrictions are documented as requiring Regional Processing to remain
  active to be enforced. **Flagged contradiction; do not port either behavior.**
- **`Assign Screen Action Permission` is a separate routine** used to restrict access to specific functions on
  Actions button menus per user group — so group authorization is spread across at least three screens
  (this one, the ten Actions-menu security modules, and Assign Screen Action Permission).
- `Report on User Security` is the only way to see what is actually enabled for a user or group.

**Dependencies.** `USR-006` Create a User (membership, and the `Global Locations List` the group's radio buttons
point at); General System Control Settings (**Extended Security kill-switch**, `Menu Timeout`, Regional
Processing); `parts/user-security-CATALOG.md` (the 355 flags behind the ten Actions-menu modules); Assign Screen
Action Permission; Report on User Security; Process List Settings; Program List Creation Window;
Multiple Selection Lookup Window; *View Create a User Group* (article 15295156484244, another agent's section).

**Build notes.**
- **This article is the direct justification for replacing the STORIS model.** Our design, restated concretely
  against what this screen does:
  - **A role is a live object.** `role { id, name, description }`, `role_grant { role_id, permission, effect,
    scope }`, `role_member { role_id, user_id }`. Nothing is ever copied onto a user. Editing a role's grants
    changes every member's effective permissions on the next request.
  - **`Reset User Members` has no counterpart and must not be built.** If an admin genuinely wants to strip
    per-user exceptions, that is a separate, explicit, previewable action ("show me the N users with grants
    outside this role, then let me remove the ones I choose"), fully audited and reversible.
  - **Multiple roles per user**, not STORIS's single mandatory `User Group`. Effective permission = evaluate all
    the user's roles plus the user's own direct grants; **most-specific scope wins; DENY beats ALLOW at equal
    specificity; default deny.**
  - **One evaluator, one screen.** STORIS spreads authorization over the user record, the group record, ten
    Actions-menu security modules, Assign Screen Action Permission, File Security Groups, Field Security Codes,
    menu security, and location/regional radios. All of it is the same question — *may this subject do this
    action to this resource?* — and must go through one grant table and one evaluator, with a single admin UI
    and a single "explain this decision" view.
  - **Effective-permissions view is a first-class feature**, showing for any user: permission, decision, and the
    exact grant (role or direct, scope) that produced it. This subsumes `Report on User Security`.
  - **Menu visibility is derived, never configured.** A menu item renders if the user holds the permission the
    item's action requires. STORIS's separate "menu security" is a second source of truth that inevitably drifts
    from the permission flags.
- Keep the *idea* of a small set of seeded roles (STORIS's `S$` types and `SYSMGR`) as **starter templates** —
  but as normal editable roles created from a template at install time, not as immutable vendor rows that must
  be copied to be useful.
- **`SYSMGR` gating the Get Started menu by group name is a hard-coded string check.** Replace with an ordinary
  permission (`system.setup.access`) held by whatever role the customer chooses.
- Session limit, menu timeout, language and signature-capture defaults are **preferences, not permissions** —
  put them in a `defaults` layer resolved `user → role → global` (live, most-specific wins), which gives the
  useful half of `Reset User Members` for free and none of the destructive half.
- All role, membership, and grant mutations feed `RPT-AUDIT`.
- `[DECISION NEEDED]` Do we need role scoping at the `DISTRICT` level, or do `COMPANY`/`REGION`/`LOCATION`
  suffice? STORIS uses District for sales and Region for inventory; picking one hierarchy would simplify the
  resolver considerably.

### `USR-008` Customer Purge
*storis_ref: article 15185859627028*

**Purpose.** A scheduled batch routine that **deletes whole customer records**, driven either by a
spreadsheet of specific customer IDs or by a global retention period. This is destruction of the record, not
redaction of fields.

**Where it lives.** `Schedule a Process > select Customer Purge at the Process field > select Enter Process
Preferences at global Actions button`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| NFS Filename | Full path + filename | Path to a **tab-text-delimited** file listing the customer IDs to purge. **The only requirement is that the customer Id is in column A.** The purge then affects **only** the listed customers. |
| Run Only With a Spreadsheet | Checkbox | See the two-mode behavior below. |
| (Run button) | Action | Executes the purge. |

**Behavior & rules.**
- **Validation set (hard rule, and the key difference from the standard purge): "The same validations as the
  standard process are performed for open balances, deposits open AR; however, the checks for open date, last
  invoice date, last payment date, and closed date are skipped."** So the spreadsheet path **enforces the
  financial guards but deliberately bypasses every age/recency guard.** A customer invoiced yesterday can be
  purged by putting their ID in column A.
- **`Run Only With a Spreadsheet` = checked:** the purge runs **only** when a tab-delimited file is found. If no
  file is found the process is **skipped until a file appears on a later scheduled run**, and **the Point of
  Sale Control Settings retention period is bypassed entirely.**
- **`Run Only With a Spreadsheet` = unchecked, valid file present:** this run uses the spreadsheet purge, **but
  the next scheduled run reverts to the standard STORIS purge.** Documented intent: "This allows a one-time
  purge to occur while still maintaining the standing scheduled purge."
- **"As with all scheduled processes, once the file is processed, the file is renamed to avoid duplicate
  processing."** The rename is the only idempotency mechanism.
- **Second, independent trigger:** `Customer Retention Period _ Months` on the **Customer** page of
  **Point of Sale Control Settings** purges customer records after N months. **This is a standing, automatic,
  time-based deletion of customer master data configured in a POS settings screen far from this routine.**

**Relationship to `Remove a Customer's Personal Information` (covered by another agent) — asked for explicitly.**

| | **Customer Purge** (`USR-008`) | **Remove a Customer's Personal Information** |
|---|---|---|
| Operation | **Deletes the customer record** | **Field-level scrub** — overwrites name and billing address line 1 with the literal string `"REMOVED"` |
| Data retained | None (record gone) | City / State / ZIP retained; the record and its transaction history survive |
| Selection | Spreadsheet of IDs in column A, **or** an age threshold (`Customer Retention Period _ Months`) | One customer at a time, interactively |
| Guards | Open balances, deposits, open AR enforced. **Open date / last invoice date / last payment date / closed date checks SKIPPED on the spreadsheet path** | **Nine hard blocking reasons** |
| Mode | Scheduled batch (phantom) | Interactive |
| Reversible | No | No |

- **Overlap.** Both are GDPR/CCPA-style erasure tools and both are irreversible, but they answer different
  legal asks: purge = "delete my record", scrub = "stop identifying me while you keep the books." Either can be
  used to satisfy an erasure request, with wildly different consequences for reporting and AR history.
- **Contradiction / hazard to flag.** The scrub is heavily guarded (nine blocking reasons) while the purge —
  which destroys strictly more — is **less** guarded on the spreadsheet path, runs unattended on a schedule,
  and is driven by a file dropped on a filesystem path. **The stricter control is on the weaker operation.**
  There is also no documented ordering rule between the two: a customer can be scrubbed and later purged, and
  nothing records that either happened (**STORIS has no general change-audit log** — wave 1).

**Dependencies.** Schedule a Process; Point of Sale Control Settings → Customer page → `Customer Retention
Period _ Months`; AR / deposits / open-balance checks; `Remove a Customer's Personal Information` (other part);
customer master.

**Build notes.**
- We need **one erasure subsystem with two explicit modes** — `ANONYMIZE` (retain the row and all financial
  history, replace direct identifiers with tokens) and `DELETE` (remove the row) — not two unrelated routines
  in different menus with different guard sets.
- **Prefer `ANONYMIZE` as the default answer to erasure requests.** Deleting a customer row that has invoices,
  deliveries, warranty claims, and AR history damages the ledger; anonymization satisfies the legal ask without
  it. `DELETE` should be reserved for records with no financial history at all.
- **One guard set, applied to both modes, and the destructive mode gets the stricter set, not the looser one.**
  Take the nine blocking reasons from the scrub as the baseline and add the financial checks (open balance,
  deposits, open AR) plus the recency checks the STORIS spreadsheet path skips. **Never allow a bulk path to
  bypass guards that the single-record path enforces.**
- **No filesystem-drop triggers.** Erasure is initiated through an authenticated request with a named requester,
  a reason, and a legal basis. If bulk is needed, it is an uploaded, previewed, approved batch:
  **dry-run first, showing exactly which records would be affected and which would be blocked and why**, then a
  second explicit confirmation to execute.
- **Full audit is mandatory** — `RPT-AUDIT` records who requested, who approved, which customer IDs, which mode,
  which guards passed, and the outcome per record. STORIS's "the file is renamed" is not an audit trail. Note
  the irony: an erasure log must itself be designed to hold no personal data beyond the record ID.
- **Do not build an automatic time-based purge of customer master data.** A retention period buried in POS
  settings that silently deletes customers is a data-loss generator. If retention policy is required, implement
  it as a **review queue**: candidates are surfaced, a human approves, the audited erasure runs.
- Idempotency: batches get a hash/ID and are rejected on re-submission — not solved by renaming a file.
- `[DECISION NEEDED]` LA Mattress retention policy: how long do we keep customer PII after last activity, and
  is our answer anonymize-then-keep or delete? This is a legal/policy call, not an engineering one.

### `USR-009` Customer Service Maintenance - User File
*storis_ref: article 15185875773844*

**Purpose.** Per-user Service-module parameters — whether the user may act as a service coordinator or
technician, their default service location, auto-assignment, and their personal labor rate and cost.

**Where it lives.** `Actions` button on the **General** tab of `Create a User` (`USR-006`) → select
**Customer Service**. **Available only if the Service module has been purchased and activated.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| User ID | Read-only | The user ID from the User file. |
| Service User | Checkbox | Allows this user to act as service coordinator or technician for service orders. **If left blank, every other field on this tab is inaccessible** — it is the gate for the whole tab. |
| Service Location | Location code | Default service (store/warehouse) location. **Referenced when auto-assigning service orders.** |
| Auto-Assign Service Order | Checkbox | **The End-of-Day process automatically assigns "un-assigned" service orders to this employee, updating the `Coordinator` field in Service Order Entry.** |
| Labor Rate | Currency / hour | Default hourly labor rate when this user is the technician. **Overrides both `Default Labor Rate` in Service Control Settings and the `Selling Price` field in Advanced Product Settings.** |
| Approximate Labor Cost | Currency / hour | Default approximate costed value for hourly labor. **Overrides both `Default Labor Cost Per Hour` in Service Control Settings and the `Replacement Cost` field in Advanced Product Settings.** |

**Behavior & rules.**
- **Two-tier permission:** `Service User` here grants the role; **whether the user may enter full service orders
  or only pending ones is a separate flag — `Enter service orders with scheduled/estimated/pending status` on
  the `Create a User/Group Actions - Service Security` screen. A check there means the user can access/enter all
  fields in service order entry.** (That screen is in the `user-security` part's catalog.)
- **Price and cost resolution for service labor is a 3-level most-specific-wins chain:
  `User (technician) > Service Control Settings default > Advanced Product Settings (Selling Price /
  Replacement Cost)`.** The technician row wins.
- Auto-assignment happens in **End-of-Day**, i.e. overnight, not at order creation.

**Dependencies.** `USR-006` Create a User (parent); Service module license; Service Control Settings
(`Default Labor Rate`, `Default Labor Cost Per Hour`); Advanced Product Settings (`Selling Price`,
`Replacement Cost`); Service Order Entry (`Coordinator`); End-of-Day; `Create a User/Group Actions - Service
Security` (see `parts/user-security-CATALOG.md`); Warehouse/Store Location.

**Build notes.**
- Do not put module-specific attributes on the user record. Model as `technician_profile` (or
  `service_staff_profile`) keyed to `user_id`, created only for users holding the `service.technician` /
  `service.coordinator` permission. The `Service User` checkbox becomes the presence of that profile plus the
  permission; the gate-the-whole-tab behavior falls out naturally.
- **Register the labor rate/cost chain in the generic settings resolver** with scopes
  `USER > GLOBAL(service defaults) > PRODUCT`, most-specific wins — same evaluator as `USR-003`'s landed-cost
  chain and `USR-006`'s permissions. This is the third distinct place STORIS hand-codes a precedence chain;
  we implement it once.
- Rate and cost must be **effective-dated** (`effective_from`), not a single overwritable field — labor rates
  change and historical service orders must reprice from the rate in effect on their service date.
- Auto-assignment should be an **explicit, observable rule** (round-robin, by location, by skill/capacity) that
  runs on order creation with a visible reason, not a side effect of a nightly batch. Keep a manual override.
- `[DECISION NEEDED]` Does LA Mattress do in-house service/warranty labor at all? If service is outsourced this
  whole area is out of scope for v1.

### `USR-010` Description Field - Language Translation Entry
*storis_ref: article 15185875797140*

**Purpose.** A shared modal that stores translations of a `Description` field into each configured language.
The multi-lingual content mechanism for master-data descriptions.

**Where it lives.** `Action button at many Description fields` — a generic sub-screen reachable from numerous
file-maintenance routines, not a menu item of its own.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Language | Language code | The language being translated. **The grid contains one row per available language; double-clicking a grid row loads that language into this field.** |
| Translation | Text | The translated text for the selected field in the selected language. |

**Behavior & rules.**
- **Display fallback chain (hard rule): the language shown is driven by the `Language` field on the user's
  User-file record → if no description exists in that language, the system uses the English version → if the
  English version does not exist, NO DESCRIPTION APPEARS AT ALL.** (Blank, not the code, not any other
  language.) **A missing English row is therefore a silent data-quality failure.**
- **Multi-Lingual Processing import/export is language-aware: "the system imports or exports specific
  descriptions based on the language you specify during the import or export process."**
- **A read-only version of this screen appears when it is reached through a view-only version of the routine**,
  showing only the currently available languages. (Consistent with the `View …` twin-article pattern seen at
  `USR-007`.)
- The set of available languages is not self-service — "For more information on the languages available to you,
  contact STORIS."

**Dependencies.** `USR-006` Create a User (`Language Code`); Multi-Lingual Processing feature flag; every file
maintenance routine with a translatable Description; import/export routines.

**Build notes.**
- Model as a generic `translation` table — `(entity_type, entity_id, field, locale, value)` with a unique key —
  rather than a per-screen modal. One mechanism covers product descriptions, reason codes, protection plans,
  fee descriptions, and anything else.
- **Fix the fallback: resolve `user locale → configured default locale → any available locale → the record's
  code/key`. Never render blank.** A blank description in a picklist is worse than an untranslated one.
- Locale should be an **IETF BCP-47 tag** on the user profile (and overridable per session), not a proprietary
  `English/French/Spanish/Alternate` enum. STORIS's `Alternate` slot for "a second version or dialect" is
  exactly what regional subtags exist for (`es-MX` vs `es-ES`).
- Translations must be **importable/exportable in bulk** (CSV or standard localization format) and visible to a
  translator without ERP access.
- Adding a language must be self-service, not a support call.
- `[DECISION NEEDED]` Does LA Mattress need Spanish customer-facing and/or staff-facing descriptions in v1?
  If yes, build the translation table from the start — retrofitting locale onto description columns across
  every master-data table is expensive.

### `USR-011` Edit File Attachments
*storis_ref: article 15185859629972*

**Purpose.** View, edit the description of, or remove file attachments on a STORIS record. The maintenance
counterpart to `USR-001`.

**Where it lives.** `Actions` button on **Sales Order**, **Purchase Order**, **Service Order**, and
**Enter/Update Individual Vendor Invoice** entry routines, plus the **Product**, **Customer**, and **Vendor**
settings routines.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| STORIS File | Read-only | The file (table) the previous screen is based on. |
| STORIS Item | Read-only | The STORIS internal number of the item the attachments belong to. |
| ID | Read-only | Internal number of the attachment. |
| Name | Read-only | **Original file name of the attachment** (so the original name IS retained, alongside the description from `USR-001`). |
| Date | Read-only | Date the file was attached. |
| Saved By | Read-only | **Code of the user who attached the file.** |
| Description | **Editable** | Additional user-defined name for the attachment. The only mutable field. |

**Grid columns.** `Attachment ID`, `Attachment Name`, `Date`, `Saved By`, `Description`, and **`Attached To`** —
the STORIS file the attachment actually belongs to (e.g. Product file or Order file); **displays `Current`
when the attachment belongs to the record you are on.**

**Behavior & rules.**
- **Entry gate: the paper clip icon at the top of the screen or tab must be active. An inactive paper clip means
  no attachments, and the `Edit Attachments` Actions option is greyed out.** To activate it, open a record that
  has an attachment, or — where the screen has a grid — select a grid row that has one.
- **2nd-tier attachments are view-only (hard rule).** Example given verbatim in substance: adding a product that
  carries an attachment to a sales order activates the paper clip on the Merchandise tab, **but clicking Edit
  Attachments reports "no attachments were found to edit."** To edit it you must open the **Product** record and
  use Edit Attachments there. **The `Attached To` column is what tells you which tier you are looking at.**
- **"If you delete or purge a record to which a file has been attached, the system deletes the attached file as
  well."** — cascade delete of blobs, and directly relevant to `USR-008` Customer Purge: **purging a customer
  destroys their attached documents too.**
- Interaction: double-click a grid row → **More/Select** pop-up → **More** views the file; **Select** then edit
  the description, or **Select** then **Remove** to detach. Removal is immediate and undocumented as reversible.

**Dependencies.** `USR-001` Attachment Description Entry Screen; `USR-008` Customer Purge (cascade);
Sales Order / Purchase Order / Service Order / Vendor Invoice entry; Product / Customer / Vendor settings.

**Build notes.**
- One polymorphic `attachment` table (see `USR-001`), plus an **`attachment_link`** join so the same stored blob
  can be referenced from several records. That makes the 1st-tier/2nd-tier distinction explicit and editable
  where it should be: **the link is what a sales order owns; the attachment is owned by the product.** Show
  inherited attachments in the order's list, clearly labelled with their owner and a link to edit at source —
  keep STORIS's read-only rule but with a usable affordance instead of a misleading "no attachments found."
- **Do not cascade-delete blobs on record deletion.** Soft-delete the link, retain the blob until no link
  references it and a retention window has passed. Deleting a customer must not silently destroy a signed
  delivery receipt that a dispute later depends on. (Note this interacts with erasure: a genuine GDPR delete
  does need the blob gone — that is what the audited `DELETE` mode of `USR-008` is for, and it should be the
  only path that removes bytes.)
- Attachment metadata already carries `Saved By` and `Date`; extend to full audit (upload, description edit,
  removal) into `RPT-AUDIT`. Removal should be soft with an admin-visible trash.
- Add what STORIS lacks: MIME type, size, virus scan status, and a permission check on view/download
  (attachments on customer records can contain PII and signatures).

### `USR-012` Foreign Processing Overview
*storis_ref: article 15185876531220*

**Purpose.** Narrative overview (not a settings screen) of how STORIS handles purchasing from foreign vendors
end to end — setup, purchasing, receiving, AP billing, and check processing. Valuable here because it states
the currency rules that `USR-002`, `USR-003` and `USR-005` only imply.

**Where it lives.** Overview article; no menu path. The screens it ties together are Bank Settings,
Country Settings (`USR-005`), Vendor Settings, and Advanced Product Settings.

**Fields.** None of its own. It names the fields on other screens that drive foreign processing:

| Screen | Field | Purpose / business rule |
|---|---|---|
| Bank Settings | AP Cash Account | GL Cash account debited when cash or checks are received. Create a bank record **per foreign country**. |
| Country Settings | currency type, Estimated / Actual exchange rates, AP GL account, Exchange GL account, address mask | See `USR-005`. |
| Vendor Settings | **Country** | Country in which the vendor resides. **Mandatory.** |
| Vendor Settings | **Currency** | Currency printed on purchase orders and AP checks. |
| Vendor Settings | **Update Exchange Rate** | The vendor's method for defaulting the exchange rate into purchasing; **also decides whether check processing re-reads the rate from existing AP bills and posts the adjustment to the Exchange account.** |
| Vendor Settings | **Check Print Bank** | Bank normally drawn on for this vendor's AP checks (top of the hierarchy in `USR-002`). |
| Advanced Product Settings | **Vendor Number** | The foreign vendor supplying the product. |
| Advanced Product Settings | **Replacement Cost** | **Unit cost in the vendor's native foreign currency.** Displays in foreign format on POs; **average cost always displays as a domestic amount.** |

**Behavior & rules (all hard).**
- **"GL hits are always in the domestic currency, regardless of the currency of the invoice and/or payment."**
  The single most important sentence for our design.
- **"You cannot assign non-inventory products to foreign vendors."**
- **"For foreign vendors, the system places on Hold all purchase orders created via order entry."**
- **The country record is a currency-routing key, not a geography.** Verbatim workaround: *"If you have a vendor
  that resides in one country but you pay them in another currency, you must create a country that combines
  those elements. For example, for a vendor physically located in China to whom you remit in US dollars, you can
  create a Country record called `CHNUS` and specify a currency associated of US dollars."* **This is the
  clearest proof that STORIS conflates country and currency — it forces synthetic pseudo-countries.**
- Currency display, by process (exact):
  - Purchase Order Entry uses **`Estimated Exchange Rate` from Country Settings**, per line item, **overridable
    in PO Entry.**
  - PO **inquiry** offers a domestic/foreign display toggle; PO **reports print in foreign currency only.**
  - **Warehouse receiving receives items into inventory in domestic format.**
  - **Container receiving and return-to-vendor display foreign values** (dealing with the vendor directly).
  - AP bill **inquiries** show foreign (the figures used to cut checks); AP bill **reports** show domestic
    ("revealing exactly how much of your company's assets you are spending").
  - **Check processing approval worksheets show both foreign and domestic**, using the rate from the associated
    AP bills; **all GL credits/debits are in domestic accounts.**
- Exchange rates may be changed at three points: PO Entry, `Enter/Update Individual Vendor Invoice`, and — if
  the vendor's `Update Exchange Rate` says so — during actual check processing, **with the difference posted to
  the Exchange account.**
- Recommended GL account types (verbatim intent): **AP GL Account (Country) → liability; Exchange GL Account
  (Country) → profit and loss; foreign check bank cash account → asset.**

**Dependencies.** `USR-005` Country Settings; `USR-002` Bank to Print Checks by Currency; `USR-003` Company
Settings; Bank Settings; Vendor Settings; Advanced Product Settings; Purchase Order Entry; container receiving;
return-to-vendor; `Enter/Update Individual Vendor Invoice`; Check Processing; General System Control Settings
(domestic currency).

**Build notes.**
- **Adopt the one rule worth keeping verbatim: the general ledger is always in functional (domestic) currency.**
  Every monetary row carries `(amount_minor, currency)` **plus** `(functional_amount_minor, functional_currency,
  fx_rate, fx_rate_source, fx_rate_date)`. The rate used is stamped on the transaction, never re-derived later.
- **Separate country from currency** (already argued at `USR-005`). Vendor carries `country_id` (where they are)
  and `payment_currency` (what we remit in) as **independent** fields. The `CHNUS` pseudo-country hack then
  disappears, which is the concrete payoff of the split.
- Model the estimate→actual lifecycle explicitly as a **realized/unrealized FX gain-loss** posting:
  PO commits at the estimated rate; AP bill re-rates; payment re-rates again; each delta posts to an FX
  gain/loss account with a clear trail. STORIS's single "Exchange GL Account" plus a vendor flag is too coarse
  to reconcile.
- Display currency should be a **user/report choice everywhere**, not hard-wired per process. STORIS's "inquiry
  foreign, report domestic" split is arbitrary and confuses users; give every monetary view a currency toggle
  that is honest about which rate it used.
- Drop the arbitrary restrictions: **non-inventory products must be purchasable from any vendor**, and
  **auto-holding every foreign PO** should be a configurable approval rule (e.g. hold above a value threshold),
  not a hard-coded behavior.
- `[DECISION NEEDED]` Does LA Mattress import directly (container purchases from overseas mills), or buy
  domestically from US distributors? If everything is USD-denominated, skip FX entirely in v1 — but keep the
  `(amount, currency)` + functional-amount column shape so it can be switched on without a migration.

### `USR-013` Import Provider Type Settings
*storis_ref: article 15185860429204*

**Purpose.** Stores the SFTP connection details used to automatically pull a supplier's product catalog into
STORIS on a schedule.

**Where it lives.** `System Administration > System Settings > General Administration System Settings >
Interface System Settings > Import Provider Type Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Import Provider | Enum (Arrow picker) | The provider whose catalog is being imported. **The list is fixed — providers are not user-definable.** Ashley is named explicitly. |
| Host Address | Text | Host for the SFTP connection. Supplied by the provider. |
| User ID | Text | SFTP account user ID. |
| User Password | **Text (secret)** | SFTP password. **See the security note below.** |
| Source Path | Text | Path on the SFTP site where the catalog resides. |
| Catalog Filename | Text, **required** | Name of the catalog file being imported. **Not active when importing from Ashley** (Ashley's filename is determined by the integration). |
| Dealer Number | Text | Dealer number assigned by the provider; **used to access the FTP site.** |
| RSA Number | Text, **required** | **"This required field is to use a SFTP connection from a Windows server."** Effectively the key identifier for SFTP public-key auth. |

**Behavior & rules.**
- Consumed by **Schedule a Process** — the settings do nothing on their own; a scheduled job performs the import.
- **The article's own terminology is inconsistent — the purpose line says "FTP information" and "the FTP site"
  while every field says SFTP.** Assume SFTP; verify before assuming transport encryption.
- **`Catalog Filename` is described as required and simultaneously as inactive for Ashley** — a conditional
  requirement the screen expresses badly.
- **Both a password and an RSA key identifier are required at once**, which suggests either mechanism may be
  used depending on the provider, with no field explaining which is active.

**Dependencies.** Schedule a Process; the catalog import routines; provider-specific integrations (Ashley);
Interface System Settings.

**Build notes.**
- **Never store integration credentials as plain columns in a settings table.** Store a reference to a secret
  manager entry (or at minimum envelope-encrypted at rest with a KMS key), never render the value back to the
  UI, and permission-gate who may set it. STORIS has a `User Password` field on an admin settings screen with
  no stated protection — assume it is readable.
- Prefer **SSH key auth over passwords** for SFTP, with key rotation and an explicit "test connection" action
  that reports success/failure without echoing the secret.
- Make the provider list **data-driven**, not an enum: `import_provider { id, name, transport, adapter,
  file_pattern, schedule }`. Each provider gets an adapter for its catalog format. Hard-coding "Ashley" into
  field-activation logic is what makes this screen incoherent.
- **`Catalog Filename` should accept a glob/regex pattern with a date placeholder** — catalogs are usually
  dated files — rather than one literal filename that must be edited by hand.
- Import runs need first-class observability: per-run record counts, rejected rows with reasons, a diff against
  the previous catalog, and a **dry-run mode**. A silent supplier catalog import that changes costs and
  descriptions across the product file is high-risk; feed every run to `RPT-AUDIT`.
- `[DECISION NEEDED]` Which vendors does LA Mattress take electronic catalogs from, and in what format
  (SFTP CSV, EDI 832, API)? That determines whether we build an SFTP poller at all or start with API adapters.

### `USR-014` Individual Zip Codes
*storis_ref: article 15185860708884*

**Purpose.** The zip-code master. Each record ties a postal code to a **tax jurisdiction set** and to
**fulfillment defaults** — normal ship-from warehouse, delivery/transfer/service/parcel route codes, stop time
— optionally varied by region within the same zip.

**Where it lives.** Five paths:
- `Customer > Point of Sale > Settings > Zip Code Settings > Individual Zip Codes`
- `Customer > Settings > Logistical Settings > Zip Code Settings > Individual Zip Codes`
- `Merchandising and Distribution > Settings > Logistical Settings > Zip Code Settings > Individual Zip Codes`
- `System Administration > Get Started - Enter Your Information > Get Started Step 4 - Delivery > Get Started - Update Zip Codes > Individual Zip Codes`
- `System Administration > System Settings > Customer System Settings > Logistical System Settings > Zip Code Settings > Individual Zip Codes`

Tabs: **General**, **Regional Settings**. Bulk maintenance is done via **Update Zip Code Settings**.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Zip or Postal Code | Code | **US: `NNNNN` or `NNNNN-NNNN` — the hyphen must be entered.** Non-US: the format established in the Country record (`USR-005` masks). |
| Country | Code, lookup | Country the zip exists in. |
| City | Text | **If more than one city exists within the zip, enter the most frequently used as the default; it can be overridden per use.** |
| State | Code | **Must exist in the Sales Tax file. STORIS ships all fifty U.S. state codes pre-built.** (Note: the *state* is what carries the state tax code.) |
| Normal Fulfillment Location | Warehouse code | Warehouse goods normally ship from for a delivery address in this zip. |
| Parcel Ship Location | Location | Default shipping location for parcel routes. **If blank, defaults to `Normal Ship Location`.** |
| Delivery Route Code | One or more route codes | **Must be a delivery-type route. Routes with the `Parcel Only` option enabled in Logistical Route Settings are prohibited.** Multi-select via the Multiple Route Selection Window. |
| Delivery Stop Time | Time | Informational, and **used for sort order on the delivery manifest.** STORIS recommends setting it only when using delivery scheduling and manifesting. |
| Transfer Route Code | Route code | Default route when creating transfers **to** this zip. Must be a transfer-type route. |
| Service Route Code | One or more route codes | Must be a service-type route. |
| Parcel Route Code | Route code | **The assigned route must have `Parcel Only` checked in Logistical Route Code Settings; otherwise the route is prohibited and a warning is displayed.** |
| Additional Tax Code | One or more sales tax codes | Additional tax codes applied **in addition to** the code referenced by the `State` field. |
| Delivery Stock Location | Location | Delivery location of delivery sales orders and exchanges **at the location level**. **If null, `Normal Fulfillment Location` is used.** |
| Pickup Fulfillment Location | Location | Pickup location for sales orders and exchanges. **If null, `Normal Fulfillment Location` is used.** |
| Pickup Stock Location | Location | Pickup location at the location level. **If null, `Normal Fulfillment Location` is used.** |

**Fields — Regional Settings tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Region | Code | The region within this zip for which these overrides apply. |
| Normal Ship Location | Warehouse code | **Must already exist in the Warehouse Location file.** During Sales Order entry the program reads the ship-to zip and retrieves the ship-from warehouse from this record. |
| Parcel Ship Location | Location | Same `Parcel Only` validation. **If blank, defaults to `Normal Ship Location`.** |
| Delivery Route Code | One or more | Action button allows multiple. |
| Transfer Route Code | Route code | |
| Service Route Code | One or more | Action button allows multiple. |
| Parcel Route Code | Route code | **If no code is entered, the default `Parcel Route Code` in Point of Sale Control Settings is used.** |

**Behavior & rules.**
- **Zip+4 route-selection hierarchy (verbatim, hard rule):**
  1. **If the 9-digit zip code has a default route/routes, assign the route or allow the user to select one from
     the associated route code list to add to the fulfillment.**
  2. **If the 9-digit zip code does not have a default route code, review the default route codes assigned to
     the related 5-digit zip code and assign or allow the user to select.**
  3. **If neither the 9-digit nor the 5-digit zip code has a default route code, all route codes are displayed.**
  Note step 3: **the failure mode is "show everything", not "block".**
- **Regional Settings override semantics (dangerous, verbatim):** *"Regional Processing does not have to be
  active to edit these fields. The values you enter on this tab override the values entered on the General tab
  for the same zip or postal code. **If you enter a region on this tab and leave some fields blank, the blank
  field value overrides any value entered in the similar field on the General tab.**"* — **a blank on the
  regional row is a null override, not a fall-through. Creating a region and filling in one field silently
  wipes out every other General-tab default for that region.**
- **Ship-from defaulting order for delivery orders:** order entry first reads `Default - Ship From Location` in
  **Point of Sale Control Settings**; **only if that is empty** does it fall back to the zip code's
  `Normal Fulfillment Location`. So a single global setting can mask the entire zip table.
- **Transfer route defaulting order:** a route code is required to complete a transfer manifest. The system
  checks **`Warehouse/Store Location Settings` for the transfer location on the order first**, then this zip
  record; **if neither has one, the user must key it manually.**
- **Tax stacking is additive, and the worked example is worth keeping verbatim:** for a New Jersey business in
  zip `07054` owing an extra 1% to Morris County and 1% to Parsippany, create codes **`NJ` = 6% (state),
  `MORRIS` = 1%, `PARS` = 1%** — **"the system calculates sales tax at an 8% tax rate (6% for the state + 1%
  for the county + 1% for the town)."** Rates are summed, not compounded.
- **Avalara interaction:** when using the Avalara® Tax Interface **with `Use STORIS calculations when offline`
  checked in Alternate Tax Interface Control Settings, this `Additional Tax Code` field is what STORIS uses to
  calculate tax offline.** The `Type` code in Sales Tax Settings may be `Local` or `State`.
- **On-the-fly zip creation:** **new zip codes built on the fly are listed on the End-of-Day report** so a
  manager can verify the ship location and tax codes. **This means order entry can create tax-jurisdiction
  records with no defaults, and the only control is a next-day report.**
- The delivery route code defaults onto any delivery order shipping to this zip and **determines the available
  delivery dates shown via the Calendar Icon at the `Next Date` field.** **Overriding the route in the order's
  Fulfillment Information section requires security permission.**

**Dependencies.** `USR-003` Company Settings (Zip Code is a support file, and the company address must reference
an existing zip); `USR-005` Country Settings (postal code masks); Sales Tax Settings / Sales Tax file;
Alternate Tax Interface Control Settings + Avalara; Logistical Route Settings (`Parcel Only`);
Multiple Route Selection Window; Warehouse/Store Location Settings; Warehouse Location file;
Point of Sale Control Settings (`Default - Ship From Location`, `Parcel Route Code`); Update Zip Code Settings;
End-of-Day; delivery manifesting; `USR-006` (the security permission to override a route).

**Build notes.**
- **Separate the two concerns living on this record: tax jurisdiction and fulfillment routing.** They change for
  different reasons, are owned by different people, and have different update cadences. Model
  `postal_code → jurisdiction_set` and `postal_code(+region) → fulfillment_defaults` as distinct tables.
- **Tax: do not roll our own jurisdiction table.** ZIP codes do not align to taxing jurisdictions (a single ZIP
  can straddle several), which is exactly why STORIS bolts on Avalara. Use a tax service as the source of truth
  with address-level (not ZIP-level) resolution, and keep a **rate cache with effective dates** for offline
  fallback. If we do keep an internal table, rates must be **effective-dated** — STORIS's are not, so historical
  orders cannot be reproduced after a rate change.
- **Fix the blank-overrides-parent rule.** Our override rows must distinguish *unset* (inherit) from *explicitly
  empty* (override with none). This is the same most-specific-wins resolver as elsewhere; register scopes
  `POSTAL_CODE_PLUS4 > POSTAL_CODE > REGION > GLOBAL` and make inheritance the default for absent values.
- **Reverse the global-beats-specific bug:** `Default - Ship From Location` in POS Control Settings currently
  *pre-empts* the zip-level value. In our resolver the global setting is the **fallback**, and the more specific
  zip/region value wins.
- Route/fulfillment defaults should be **suggestions with a visible reason** ("route DEL-3 from ZIP 07054
  region N"), overridable by permission, and the "no default found → show all routes" case should surface a
  warning rather than silently offering everything.
- **On-the-fly jurisdiction creation must not be silent.** Either resolve the address through the tax service at
  entry time, or queue the new postal code for approval and flag orders that used an unverified jurisdiction.
  A next-day report is not a control.
- Keep and generalize: multiple route codes per zip, region-within-zip granularity, and per-fulfillment-method
  (delivery vs pickup vs parcel) locations — those are genuinely useful and map well to LA Mattress's
  multi-warehouse delivery model.
- `[DECISION NEEDED]` Tax engine: Avalara/TaxJar/Vertex versus an internal rate table. Strong recommendation for
  an external service given multi-jurisdiction California local district taxes.
- `[DECISION NEEDED]` Do we need region-within-zip granularity, or is zip+4 sufficient for LA Mattress delivery
  routing?

### `USR-015` Installment Credit Approval Limits
*storis_ref: article 15185875774356*

**Purpose.** Per-user (or per-group) ceilings that decide whether an installment credit request's linked sales
orders can be approved. These are **authorization limits attached to a user**, evaluated during
`Review Pending Credit Requests`.

**Where it lives.** `Create a User/Group Actions - Receivables Security > Actions Button > Installment Credit
Approval Limits`. **Requires Installment Receivables to be active on the system.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Maximum Installment Receivables Approved Term | Integer **0 – 99** | **Checked against the contract term figure.** **If this field is blank, the setting is not used.** |
| Maximum Installment Receivables Approved Finance $ | Currency **0.00 – 9999999.99** | **Checked against the installment contract amount financed.** **"The amount financed includes principal, fee and previous payoff amounts."** **Blank = setting not used.** |
| Maximum Installment Receivables Approved Balance $ | Currency **0.00 – 9999999.99** | **Checked against the remaining installment contract balance.** **"The contract balance includes principal, refinanced payoff, miscellaneous, insurance and interest amounts."** **Blank = setting not used.** |

**Behavior & rules.**
- **Blank means "no limit", not "zero".** A blank field disables that check entirely — the classic
  fail-open default. **All three blank = no limit checking at all** (see `USR-016` for what happens then).
- The three checks are **independent and ANDed**: `USR-016` says "if **any** of the security checks fail, the
  order is not approved."
- The limits do nothing on their own. They are evaluated only in combination with the Receivables security flag
  **`Review Pending Credit Request; Manually approve linked sales order`** — the full matrix is `USR-016`.
- Note the two composition formulas are different and must not be confused:
  - **amount financed = principal + fee + previous payoff amounts**
  - **contract balance = principal + refinanced payoff + miscellaneous + insurance + interest**

**Dependencies.** `USR-016` Installment Credit Approval Rules (the evaluation matrix); `Create a User/Group
Actions - Receivables Security` and the flag `Review Pending Credit Request; Manually approve linked sales
order` (see `parts/user-security-CATALOG.md`); `Review Pending Credit Requests`; Installment Receivables module;
`USR-006`/`USR-007` (these limits are stored on the user or group record and are therefore subject to the
`Reset User Members` copy-down); credit limit and installment classification on the customer.

**Build notes.**
- This is an **approval-authority limit**, the same shape as a PO approval limit or a discount authority. Build
  **one** generic `approval_authority` concept — `(subject, dimension, max_value, scope)` — rather than a
  bespoke screen per module. Dimensions here: `installment.term_months`, `installment.amount_financed`,
  `installment.contract_balance`.
- **Invert the fail-open default: absent limit = not authorized**, with an explicit "unlimited" grant that an
  administrator must deliberately give and that is visible in the effective-permissions view. STORIS's
  blank-means-unlimited on a *credit approval ceiling* is exactly backwards for a financial control.
- **Store the formulas as named, tested computations**, not as prose: `amount_financed = principal + fees +
  prior_payoff` and `contract_balance = principal + refinanced_payoff + miscellaneous + insurance + interest`.
  Both must be unit-tested and surfaced in the UI as a breakdown so an approver sees what the number is made of.
- Limits are **effective-dated and audited** (`RPT-AUDIT`): who granted what ceiling, when, and every approval
  decision with the limit that applied and the values checked.
- Term as a bare integer 0–99 is ambiguous — **store the unit explicitly** (months) rather than inheriting
  STORIS's untyped "contract term figure".
- `[DECISION NEEDED]` Does LA Mattress originate its own installment contracts, or is all financing through
  third parties (Synchrony, Affirm, Progressive)? If it is all third-party, `USR-015`/`USR-016` become
  "approve/decline relay + hold release", which is a much smaller feature.

### `USR-016` Installment Credit Approval Rules
*storis_ref: article 15185859801876*

**Purpose.** Not a settings screen — the **decision table** describing how the Receivables security flag
`Review Pending Credit Request; Manually approve linked sales order` combines with the `USR-015` limits during
`Review Pending Credit Requests`. This is the evaluation order the assignment asked for, captured verbatim.

**Where it lives.** Reference article, linked from `USR-015`.

**Fields.** None.

**Behavior & rules — the full 2×2 matrix.** The two inputs are (A) the security flag
`Review Pending Credit Request; Manually approve linked sales order` checked / not checked, and (B) whether
**any** of the three `USR-015` limits is set.

**Case 1 — flag CHECKED, at least one limit SET.**
1. On save of the manual approval, **a prompt asks if the user wants to approve the linked orders manually.**
2. **Response YES:** each linked sales order is displayed for manual approval; the user may approve or not.
   **If approved, the order is then checked against the Installment Credit Approval Limits. If any of the
   security checks fail, the order is NOT approved — but the credit request IS approved.**
3. **Response NO:** the linked credit hold orders are checked for **automatic approval** against the limits;
   each order is displayed with its approved/not-approved outcome, **and the credit request is approved.**
4. **If the request is Declined:** the sales orders **remain on credit hold** and the credit request is
   **closed.**

**Case 2 — flag CHECKED, NO limits set.**
1. Same prompt on save.
2. **Response YES:** each linked order is displayed for manual approval. **"If the user chooses to authorize the
   sales order, the order is automatically approved without any further checks"** and the credit request is
   approved. **Unlimited authority.**
3. **Response NO:** linked installment credit-hold orders are checked for automatic approval **based on credit
   limit and installment classification** (the customer-level controls, not the user limits); each order shows
   its outcome and the credit request is approved.
4. **Declined:** orders remain on credit hold, request closed.

**Case 3 — flag NOT checked, at least one limit SET.**
1. On save, **no prompt** — the linked installment credit-hold orders are simply checked.
2. **If ALL linked orders pass the security checks, the credit request AND the sales orders are automatically
   approved.**
3. **If ANY linked order fails, ALL orders remain on `F2` credit hold and the credit request is set back to its
   previous status.** **All-or-nothing, and the request is rolled back rather than partially approved — the
   opposite of Case 1, where the request is approved even when orders fail.**
4. **Declined:** orders remain on credit hold, request closed.

**Case 4 — flag NOT checked, NO limits set.**
1. On save, the linked orders are checked for automatic approval **based on credit limit and installment
   classification**; each shows its outcome and **the credit request is approved.**
2. **Declined:** orders remain on credit hold, request closed.

**The rules that matter, extracted.**
- **The credit request and its linked sales orders are approved independently, and the two can disagree.** In
  Cases 1, 2 and 4 the **credit request is approved even when linked orders fail their checks**. Only Case 3
  rolls the request back. **This is the single most surprising behavior in the section.**
- **A declined request never releases a hold**: in all four cases the sales orders remain on credit hold and the
  request is closed.
- **Limits are only ever consulted for installment approval; customer `credit limit` and `installment
  classification` are the fallback checks when no user limits exist.** Two different control planes, chosen by
  whether a field is blank.
- **The security flag does not grant or deny — it selects between an interactive path and a silent automatic
  path.** A permission flag that changes the *workflow* rather than the *authority* is a design smell.
- `F2` is the named credit-hold status in Case 3.

**Dependencies.** `USR-015` Installment Credit Approval Limits; `Create a User/Group Actions - Receivables
Security` flag `Review Pending Credit Request; Manually approve linked sales order` (see
`parts/user-security-CATALOG.md`); `Review Pending Credit Requests`; Installment Receivables; customer credit
limit and installment classification; sales order credit-hold status `F2`.

**Build notes.**
- **Specify our version as one explicit decision function**, not four prose cases:
  `decide(order, approver) → {APPROVED, DENIED, ESCALATE}` where a check that exceeds the approver's authority
  returns `ESCALATE` (routed to someone who holds the authority), never a silent skip.
- **The request and its orders must move together.** Approving a credit request whose orders failed their checks
  produces a state no one can reason about. Either the whole request is approved and all holds released, or it
  is partially approved with each order's outcome explicit and the request left `PARTIALLY_APPROVED` — never a
  bare "approved" that hides failures.
- **All-or-nothing rollback (Case 3) is the right default**; make it the only behavior and make the failure
  reasons visible per order.
- **Record the decision, not just the outcome:** for every order, store the checks run, the values compared, the
  limits that applied, the approver, and the timestamp. Feed `RPT-AUDIT`. STORIS keeps none of this.
- Keep the layered controls but make the layering explicit and always evaluated:
  **customer credit limit → installment classification → approver authority limits**, all three every time,
  rather than "user limits if set, otherwise customer limits".
- The manual-approval prompt ("approve linked orders manually? YES/NO") is a workflow choice, not a permission.
  In our system, holding the approval permission means you may approve; whether you review orders individually
  is a UI affordance, not a security setting.
- `[DECISION NEEDED]` See `USR-015` — if financing is entirely third-party, replace this whole matrix with a
  decision-relay: capture the lender's approve/decline/counteroffer, release or hold the order accordingly, and
  keep only an internal override permission.

### `USR-017` Insurance Underwriter Settings
*storis_ref: article 15185860428820*

**Purpose.** Master file of the insurance underwriters used with Revolving Receivables — credit insurance
carriers whose names and license numbers must appear on printed credit documents.

**Where it lives.** `Accounting > Settings > Revolving Receivables Settings > Insurance Underwriter Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Underwriter | **Up to 5 alphanumeric**, key | Code for the underwriter. Search button lists existing records for editing. |
| Name | **Up to 30 characters, MANDATORY** | **"used during output to show the proper name of the insurance underwriter"** — i.e. it is printed on customer-facing credit documents. |
| License # | **Up to 30 characters, MANDATORY** | The underwriter's license number. Mandatory because it is a regulatory disclosure on credit insurance documents. |
| Creditor's Rep | Up to 30 characters, optional | Name of the creditor representative who deals with the insurance company. |

**Behavior & rules.**
- Both `Name` and `License #` are **hard-mandatory** — unusual for a simple code file, and a strong signal that
  these values are legally required on printed credit-insurance disclosures.
- Click **Save** to commit. No other validation documented; **the license number is free text and is not
  validated against any authority, nor is it effective-dated or state-scoped.**

**Dependencies.** Revolving Receivables module; credit insurance products on installment/revolving contracts;
`USR-015`/`USR-016` (insurance amounts form part of the **contract balance** formula:
`principal + refinanced payoff + miscellaneous + insurance + interest`); printed credit documents.

**Build notes.**
- Small reference table: `insurance_underwriter { id, code, name, license_number, creditor_rep, active }`.
- **Add what a regulated disclosure actually needs and STORIS lacks: license number *per state/jurisdiction*
  with `effective_from` / `effective_to`, plus an `active` flag instead of deletion.** A single free-text
  license number cannot be right for a multi-state operation, and printed documents must reproduce the license
  that was valid on the contract date — so historical contracts must reference the underwriter *version*, not
  the current row.
- Never hard-delete an underwriter that appears on any contract; deactivate.
- Changes here alter customer-facing legal documents — **audit into `RPT-AUDIT`.**
- `[DECISION NEEDED]` Does LA Mattress sell credit insurance / debt cancellation products at all? If not,
  `USR-017` is out of scope, and the `insurance` term drops out of the `USR-015` contract-balance formula.

### `USR-018` Miscellaneous Fee Settings
*storis_ref: article 15185860430356*

**Purpose.** Defines percentage-based fees and surcharges (recycling fees, environmental fees, delivery
surcharges and similar) that the system assesses on sales documents based on the **selling location** and/or the
**tax jurisdiction of the point of customer possession**.

**Where it lives.** Six paths:
- `Customer > Point of Sale > Settings > Miscellaneous Fee Settings`
- `Customer > Settings > Point of Sale Settings > Miscellaneous Fee Settings`
- `Accounting > Third Party Accounting > General Ledger > General Ledger Settings > Miscellaneous Fee Settings`
- `System Administration > Get Started - Enter Your Information > Get Started Step 1 - Tax and Banking > Miscellaneous Fee Settings`
- `System Administration > System Settings > Customer System Settings > Sales and Service System Settings > Miscellaneous Fee Settings`
- `System Administration > System Settings > Accounting System Settings > General Ledger System Settings > Miscellaneous Fee Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Fee Code | **Up to 6 characters**, key | ID of the fee. |
| Description | **Up to 15 characters** | **Appears on printed documents such as delivery tickets.** Action button → `USR-010` Description Field - Language Translation Entry. |
| Percent | Numeric, **up to 8 digits, range `0.0` to `999.9999`** | **The percentage of the merchandise total used to calculate the fee.** |
| GL Account | GL account | Account the collected fee posts to. Action button → GL Account Entry Screen. **If blank, the fee posts to a default account specified in General Ledger Assigned Account Settings.** |
| Taxable | Checkbox | **If checked, the fee amount is included when calculating sales tax** (tax on a fee). |
| Apply to Delivery Charge | Checkbox | Includes delivery charges in the fee's base. **"for split orders, the delivery charge applies only to the part of the calculation for the delivery portion of the order."** |
| Reduce Tax Rate | Checkbox | Activates `Reduce Tax` and `By %`. **If checked you MUST specify at least one tax jurisdiction and a corresponding reduction percentage.** |
| Reduce Tax | One or more tax codes | Tax jurisdictions in which the tax rate is reduced when this fee applies. Action button → Tax Jurisdiction Reduction Percent Screen. **Active only when `Reduce Tax Rate` is checked.** |
| By % | Percentage per jurisdiction | The reduction percentage for each jurisdiction listed. Same Action screen. **Active only when `Reduce Tax Rate` is checked.** |
| Retain for Months | Integer **0 – 99**, blank allowed | Months of fee activity kept before End-of-Month purges it. **`0` = EOM purges the fee's detail records at the end of every month. BLANK = the system NEVER purges the records.** |
| Apply Always | Checkbox | **Assess the fee regardless of the point of customer possession. STORIS recommends checking this for all fees associated with locations. Checking it inactivates `Apply Only When Written at Stores`.** |
| Apply Only When Written at Stores | Store list | Restricts jurisdiction-associated fees to a list of selling stores. **Checking it inactivates `Apply Always`.** See the rule below. |
| Print Additional Text On — Sales Order | **Up to 40 characters** free text | Printed on sales orders carrying this fee. |
| Print Additional Text On — Completed Orders | **Up to 40 characters** free text | Printed on completed orders carrying this fee. |

**Behavior & rules.**
- **Fees are not attached to the fee record — they are attached to warehouse/store locations and/or tax
  jurisdictions elsewhere.** This screen only defines the fee; association is done on the location and
  jurisdiction records. **Multiple fees may be associated with a single location or jurisdiction.**
- **Application base (hard rule): "the system applies the fees to all taxable items on the order. The system
  does not apply miscellaneous fees to products for which the `Taxable` field in the Advanced Product Settings
  is not selected."** Non-taxable products are exempt from fees entirely.
- **Point-of-possession determines the jurisdiction (exact):**
  - **deliveries → the tax jurisdiction of the ship-to location**
  - **customer pickups → the tax jurisdiction of the pick-up location**
  - **take-with orders → the tax jurisdiction of the selling store**
  Order entry references **both** the selling location **and** the point-of-possession jurisdiction.
- **"The system does not apply miscellaneous fees to direct-ship orders."** Hard exclusion.
- **Guidance pairing:** `Apply Always` for fees associated with **locations**; `Apply Only When Written at
  Store(s)` for fees associated with **tax jurisdictions**.
- **`Apply Only When Written at Stores` semantics (verbatim substance):** order entry finds the jurisdiction of
  the point of possession; any fees associated with it are candidates. **For each candidate fee, if a store list
  exists on this field and the order's selling store is not on it, the fee is NOT applied. If the field is
  blank, the fee IS applied.** So blank = apply everywhere.
- **`Reduce Tax Rate` worked example (keep verbatim — it is the only statement of the formula):** a jurisdiction
  with **2% local sales tax**, a fee of **1.25%** associated with that jurisdiction. Set `Reduce Tax` = that
  local jurisdiction, `By %` = **1.0%**. Result for orders whose point of possession is in that jurisdiction:
  **local sales tax = 1.0% (2% reduced by 1%), fee = 1.25%.** **The reduction is subtracted from the tax
  RATE (2 − 1 = 1), not applied as a proportion of the tax.** Note the field help text confusingly says the
  percentage is "the percentage by which to reduce **the fee amount**", which contradicts the example —
  **trust the example: it reduces the tax.**
- Fee amount = `Percent` × merchandise total (plus delivery charge if `Apply to Delivery Charge`), and the
  result is itself taxed if `Taxable`. **Fees can therefore be taxed while simultaneously reducing the tax rate
  — the two features interact and the article never states the order of operations. Flag as under-specified.**
- The total of all fees appears at the **`Fees/Charges`** field on the **Payments** tab of order entry.
- **Additional print text renders only via Design Enhanced Laser Forms — "The text does not appear when printing
  STORIS standard order forms."**
- Reporting: `Report Miscellaneous Fees`, `Report Written Sales Dollars`, `Report Completed Sales Dollars`,
  `Report Completed Monthly Sales Dollars`.

**Dependencies.** Warehouse/Store Location Settings (fee association); `USR-014` Individual Zip Codes and Sales
Tax Settings (tax jurisdictions); Advanced Product Settings (`Taxable`); General Ledger Assigned Account
Settings (default GL account); GL Account Entry Screen; Tax Jurisdiction Reduction Percent Screen;
`USR-010` (description translations); End-of-Month (retention purge); Design Enhanced Laser Forms; order entry
(`Fees/Charges` on the Payments tab); the four fee reports.

**Build notes.**
- Model as `fee { code, description, rate_percent, gl_account, taxable, applies_to_delivery_charge,
  print_text_sales_order, print_text_completed_order }` plus **`fee_applicability { fee_id, scope_type, scope_id,
  mode }`** where `scope_type ∈ {LOCATION, TAX_JURISDICTION}` and `mode ∈ {ALWAYS, WHEN_SOLD_AT_STORES}` with an
  associated store list. That replaces the mutually-inactivating checkbox pair with one explicit mode enum —
  **two checkboxes that disable each other are a two-value enum badly disguised.**
- **Percentage-only is a real limitation.** Many statutory fees are **flat per-unit or per-item** (mattress
  recycling fees in California are per-piece dollar amounts). We need `rate_type ∈ {PERCENT, FLAT_PER_ORDER,
  FLAT_PER_UNIT}`. **This is the single most important divergence from STORIS on this screen for LA Mattress.**
- **Effective-date every fee rate.** Statutory fees change on legislated dates and historical orders must
  reprice at the rate in force on the order date. STORIS has one mutable `Percent`.
- **Specify the order of operations explicitly and test it:** (1) resolve applicable fees from selling location
  and point-of-possession jurisdiction; (2) compute each fee base (taxable merchandise total, plus delivery
  charge if flagged); (3) compute fee amounts; (4) apply any tax-rate reductions; (5) compute tax on
  taxable merchandise plus taxable fees. STORIS leaves steps 4 and 5 ambiguous.
- **Reconsider `Reduce Tax Rate` entirely.** Deliberately under-collecting statutory sales tax to offset a
  private fee is a tax-compliance decision, not a configuration option. If it is needed, it must be
  jurisdiction-approved, documented, and audited — **`[DECISION NEEDED]` for LA Mattress with the tax adviser,
  and default to NOT building it.**
- Keep the point-of-possession jurisdiction rule verbatim — delivery→ship-to, pickup→pickup location,
  take-with→selling store is correct and matches how destination-based sales tax works.
- **Fix the retention default: blank currently means "never purge".** Retention should be an explicit policy
  value, and detail records that back a tax filing should not be purgeable at all by a per-fee setting.
- Fee descriptions are 15 characters and print on customer documents — **give ourselves a real
  customer-facing label field** (and localize it via the `USR-010` replacement).
- All fee definition changes feed `RPT-AUDIT`; fee amounts must be reproducible for any historical order.

### `USR-019` PC Applications Window
*storis_ref: article 15185875940884*

**Purpose.** Sub-window of the User record that grants access to STORIS's Business Intelligence PC
applications — desktop tools that read STORIS data outside the terminal application.

**Where it lives.** `PC` button at the `PC Applications` field on the **Security** tab of `Create a User`
(`USR-006`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| EIS Merchandising | Checkbox | Grants access to the EIS Merchandising PC application. |
| Executive Vision | Checkbox | Grants access to Executive Vision. |
| Finance II Rpt Writer | Checkbox | Grants access to the Finance II report writer. |

**Behavior & rules.**
- **Article/field-list discrepancy to flag: `USR-006`'s `PC Applications` field lists FIVE options —
  `EIS Merchandising`, `Executive Vision`, `Finance II Rpt Writer`, **`Limit to Company`**, and
  **`Report Builder`** — while this article documents only the first three.** Treat `Limit to Company` and
  `Report Builder` as present on the screen but undocumented here. `Limit to Company` in particular is not an
  application at all but a **scoping modifier** (restrict the PC application's data to the user's companies),
  which is a meaningfully different thing to have on the same checkbox list.
- Like everything on the Security tab, these are **inert unless Extended Security is active** in General System
  Control Settings.
- No further validation, dependency or licensing rule is documented.

**Dependencies.** `USR-006` Create a User (parent); General System Control Settings (**Extended Security**);
`USR-003` Company Settings / the user's `Company` access list (for `Limit to Company`); Report Builder security
(`File Security Groups`, `Field Security Codes` on `USR-006`); `parts/user-security-CATALOG.md`.

**Build notes.**
- These are simply **permissions** — `bi.eis_merchandising`, `bi.executive_vision`, `bi.finance_report_writer`,
  `bi.report_builder` — and belong in the one grant table with everything else (`USR-006` build notes), not on a
  bespoke checkbox window.
- **`Limit to Company` must not be a checkbox in an application list.** Data scoping is the `COMPANY` scope on
  the grant itself: `ALLOW bi.report_builder SCOPE company:07`. Modeling it as a peer of application names is
  exactly the category error our resolver is meant to eliminate.
- We will not have desktop BI clients. The equivalent surface is our reporting/analytics module plus any
  external BI tool connecting over a read replica — **and that connection must be governed by the same grants
  (row- and column-level), not by a separate database login with its own privileges.** Otherwise the careful
  Field/File security on `USR-006` is trivially bypassed by pointing Excel at the database.
- `[DECISION NEEDED]` Which BI surface does LA Mattress want — in-app reports only, or a warehouse/read-replica
  for Looker/Metabase/Power BI? The answer determines how far the permission model has to reach.

### `USR-020` Protection Plans Overview
*storis_ref: article 15185860706580*

**Purpose.** Long conceptual overview of the Protection Plan feature — **header-level** coverage products sold
alongside merchandise, with tiered or flat pricing, third-party provider cost, proportional recognition across
partial completions, and a full set of general-ledger postings. Not a settings screen; it is the specification
for how plans behave across the order lifecycle.

**Where it lives.** Overview article. The configuration screens it describes are **Protection Plan Settings**,
**Point of Sale Control Settings**, **Warranty Settings**, and **General Ledger Assigned Account Settings**.
Plans are maintained during: `Enter a Sales Order`, `Enter a Quick Sale`, `Enter an Exchange`,
`Adjust Dollars on Completed Orders`, `Enter a Return`.

**Fields.** None of its own. Settings it names, on other screens:

| Screen | Setting | Purpose / business rule |
|---|---|---|
| Point of Sale Control Settings | `Prompt to Add to Order` | Auto-presents Protection Plan Selection during order entry. |
| Point of Sale Control Settings | `Automatically Add to New Order` | **When active, Protection Plan Selection is NOT presented; STORIS auto-selects the plan covering the greatest amount of qualified merchandise.** |
| Point of Sale Control Settings | `Automatic Add Merchandise Overlap` | **Tie-break when multiple plans qualify for the same merchandise: by price, by profit, or prompt the user.** |
| Point of Sale Control Settings | `Exchanges Use Existing Plan` | Allows the sale portion of an exchange to reuse the returned merchandise's plan. **If not set, a warning appears before completing the exchange.** |
| Point of Sale Control Settings | (commission basis) | Whether plan commission/spiff is earned on **plan price or plan gross profit**. |
| Protection Plan Settings | plan definition | Tax, commission/spiff eligibility, **plan-specific sales and cost-of-sales GL accounts**, qualification (locations, eligible **Inventory Formations**), limits (**Maximum Quantity, Minimum Subtotal, Maximum Subtotal**), and the price/cost table. |
| Warranty Settings | plan terms | **The TERMS of a protection plan are defined in Warranty Settings; the warranty code is then assigned to the plan in Protection Plan Settings.** (Legacy warranties instead take terms from Advanced Product Settings.) |
| General Ledger Assigned Account Settings | `Intangible Assets-Protection Plans`, `Protection Plans not Invoiced`, `Protection Plan Cost of Sales`, plan sales | Default accounts. **A GL account specified in Protection Plan Settings overrides these.** |

**Behavior & rules — structure.**
- **Protection Plans are applied at the ORDER HEADER; legacy warranties are non-inventory LINE ITEMS.**
  Consequences: **plans are not eligible for line discounting**, and **legacy warranty line items must be for the
  same fulfillment method whereas plans can span multiple fulfillments and address variations.**
- **Multiple plans per order are allowed**, associated with multiple fulfillment methods.
- **No licensing required, except when transferring plan activity to a third party via a Protection Plan
  Provider Interface.**
- **Plan linkage and plan price stay with the merchandise through all completions, returns, adjustments,
  services and exchanges.**
- **Partially completed orders require Protection Plan Selection to be invoked manually — "Plans may only be
  automatically linked when working with new orders."**
- Plans may be added to a **Quick Sale only if a valid customer number is on the order.**
- **Qualification only filters on assigned Inventory Formations: "Plan qualification does not discard a plan
  from being listed due to minimum, maximum, and/or quantity limitations since it is not yet known which items
  will be linked."** Limits are checked later, not at listing time.

**Behavior & rules — the three-step selection flow.** (**Steps 2 and 3 are skipped when
`Automatically Add to Order` is enabled.**)
1. **Protection Plan Qualification** — determine which plans qualify given Protection Plan Settings and the
   products on the order. **Only plans based on assigned Inventory Formations qualify.**
2. **Protection Plan Selection** — all qualified plans presented; **multiple may be selected**; existing plans
   may be maintained or removed.
3. **Protection Plan Product Selection** — link a selected plan to individual line items, or maintain/remove
   linkages.
- **Auto-Select:** links all order lines to a plan. **"Merchandise is linked to the plan to which the most lines
  qualify to be linked."** **Tie on line count → `Automatic Add Merchandise Overlap` decides by price or by
  prompting.** `Select All` / `Deselect All` link or unlink every eligible line for a plan.

**Behavior & rules — pricing and cost (exact).**
- **Price and cost are independent values, both defined in a table of one or more tiers.**
  - **Plan PRICE = a fixed amount OR a percentage of the linked merchandise subtotal** (what the customer pays).
  - **Plan COST = a fixed amount OR a percentage of the protection plan PRICE** (what the provider charges the
    retailer). **Note the different bases — price is a % of merchandise, cost is a % of price.**
- **Partial completion proportion (verbatim):** *"the protection plan price and cost amounts completed are based
  on the completed proportion of the total linked merchandise price divided by the completed linked merchandise
  price."* The worked example makes the intent unambiguous:
  **total merchandise $1,000; merchandise linked to the plan $800; linked merchandise being completed $400 →
  proportion = $400/$800 = 50%. Plan price $150 → completed portion $75 (0.50 × $150).**
  **So: `proportion = completed_linked_merchandise / total_linked_merchandise`** — the article's prose has the
  numerator and denominator inverted; **trust the example.**
  **"This is true for each subsequent completion with any adjustment for rounding errors made on the last
  completion."**
- **Cost follows the same proportion: cost $40 at 50% → $20.** The proportionate share of plan cost is assigned
  to each linked merchandise line **based on that line's proportion of the total merchandise covered**, and is
  **maintained through any subsequent adjustments.**
- **Only the proportional selling price realized on completion posts to GL.**
- **Non-tiered plans:** flat rate or percentage, proportionally divided across linked lines; on partial
  completions, adjustments, returns and exchanges **the plan price is always in the same proportion as the
  merchandise on that transaction.**
- **Tiered plans:** priced by merchandise-subtotal band. **Example table quoted verbatim:**

  | Tier | Min | Max | Price |
  |---|---|---|---|
  | 1 | 0 | 999 | 50 |
  | 2 | 1000 | 1999 | 60 |
  | 3 | 2000 | 2999 | 70 |
  | 4 | 3000 | 3999 | 80 |

  **On partial completion, dollar adjustment, return or exchange the tier may change, and "the price of the new
  tier is defaulted."**
- Table configuration: **enter each tier's minimum subtotal with the price and cost amount, or the price
  percentage.** A **non-tiered** plan is simply **one minimum subtotal** (e.g. $0.01), applicable to all
  merchandise above that amount. **"If a Minimum Subtotal is set without an associated Price or Cost Amount, it
  indicates that there is a maximum subtotal for the chosen plan."** (i.e. a price-less tier row is used to
  express an upper bound.)
- Tiered and non-tiered plans may be **mixed** in one system.
- Version note: **"If you used tiered protection plans on revision 10.7, the manual intervention to calculate
  adjustments in tiered plan price is no longer required in 10.8."**

**Behavior & rules — returns.**
- **Plans move to the return automatically based on the selected merchandise, "regardless of the Protection Plan
  Settings in Point of Sale Control Settings."** The `Protection Plan Code` field is display-only and **shows an
  ellipsis (`...`) when multiple plans are associated.**
- **"It is not possible to remove plans or maintain any existing plan linkages when processing a return"** —
  only the returned plan total may be adjusted. Removal/relinking requires a **Credit Dollar Adjustment**.
- **"It is not possible to return a Protection Plan on a return that does not reference a completed order."**
- **Edge case, verbatim in substance:** returning **all** linked lines with **no** price adjustment effectively
  removes the plan from the original order. But if all lines are returned **and the returned plan price is
  reduced**, the original completed order can end up **holding a Protection Plan with no linked lines** — which
  can then only be fixed by a Dollar Adjustment. **A documented way to reach an inconsistent state.**
- **Non-tiered return price** = the proportionate share of price and cost **as of the time of completion, net of
  any subsequent Dollar Adjustments**, accumulated over the returned lines. The default **may be adjusted in
  either direction** (decreasing or increasing the customer's credit). **Even if adjusted to zero, the returned
  lines still reference the plan so the third-party provider is notified of material changes.** The returned
  plan price is distributed across the linked returned lines **in proportion to their return selling price,
  whether or not that price was overridden.**
  - **Use case (verbatim):** Suzie buys three items, merchandise subtotal **$550**, plan price **$50**. She
    returns item 1 at **$250**, leaving **$300** — **below the $500 minimum qualifying amount, so the plan is no
    longer applicable and is also returned**, leaving the other two items uncovered.
- **Tiered return price:** the returned plan amount is calculated **on the new merchandise subtotal; if the tier
  changes, the price DIFFERENCE between the two tiers is returned.**
  - **Use case (verbatim):** subtotal **$1,550**, plan **$60** (tier 2). Return item 1 at **$575** → new subtotal
    **$975** → **below the $1,000 tier-2 minimum, so tier 1 at $50 applies. She receives $585 = returned
    merchandise ($575) + the change in protection plan ($10).**

**Behavior & rules — exchanges.**
- Plans move to the return portion automatically from the referenced completed order, **regardless of
  `Automatically Add to Order` and `Prompt to Add to Order`.** Partially returned lines compute plan price/cost
  **proportionately on the quantity returned.** **Only returned plan totals may be adjusted.**
- **`Exchanges Use Existing Plan`** (POS Control Settings) enables reusing the original plan on the sale portion,
  **only when the exchange references an existing completed order.** When set, on leaving
  **Step 3 – Sale Merchandise** the user is prompted verbatim: **"Retain existing Protection Plans linked to
  returned merchandise?"** with options **Yes / No**.
  - **No (or setting not set):** no linkage to the original order; the sale is treated as a new order.
  - **Yes:** plans from the original order are considered, **and their price takes into account all original
    invoices, completed returns, completed exchanges and Dollar Only Adjustments associated with the original
    order.** The available-plan list is then reconciled by `Plan Code`: **missing plans are added; plans already
    present are REPLACED with the version of the plan used when the returned merchandise was originally
    linked.** (Plan definitions are therefore versioned in practice.)
- **If the original order referenced in an exchange is not on file, the return portion offers no plan return**,
  and: **"Cannot auto apply Protection Plans when an Exchange is not on the original invoice."**
- **Even exchanges should produce no net difference in plan price; uneven exchanges may change the tier and are
  recalculated.**

**Behavior & rules — Adjust Dollars on a Completed Order.**
- Necessary because plans are header charges: **`Enter a Sales Order` cannot add a plan to a completed order,
  and `Enter a Return` sometimes cannot remove one.**
- **Credit Dollar Adjustment** can: remove a plan; reduce a plan's price; reduce the price of linked
  merchandise; unlink lines. **Credit adjustments on tiered plans may change the tier, calculated
  automatically; removing the plan entirely sets its price to zero and unlinks all referenced lines.**
- **Debit Adjustment** can: add a plan; increase a plan's price; increase linked merchandise price; link
  previously unlinked lines. **A check for plan-limitation violations or tier change is performed and a warning
  issued.**
- **Hard rules:** plans are adjustable **only if already linked to an existing completed order**; adjustments
  affect **only the referenced completed order** and not prior changes; **"maintenance of line linkages,
  including adding new plans or removing existing plans, is not allowed in conjunction with line price
  adjustments"** — though price adjustments to existing plans may accompany line price adjustments; **a plan
  limitation violation raises a warning before you can proceed.**

**Behavior & rules — the Protection Plan Register.**
- **The first completion (full or partial) creates a Protection Plan Register record with a unique registration
  code (the protection plan code), used to reference that specific plan for its whole lifecycle.**
- A **Protection Plan Register Item is created for each line associated with the plan**, carrying product
  information, quantity and selling price.
- **The Plan Registration Code is noted in the Audit Comments Log.** (Notable: one of the very few places STORIS
  records anything audit-like — relevant to `RPT-AUDIT`.)
- Register purposes, verbatim: identifying specific plans when the same plan appears more than once on an order;
  tracking a plan through completions/adjustments/returns/exchanges; communicating activity to the third-party
  provider; and feeding reporting including the Data Warehouse.

**Behavior & rules — General Ledger (the important part).**
- **On the FIRST completion, whether full or partial, the FULL cost of the plan is posted to
  `Intangible Assets-Protection Plans` (debit) and `Protection Plans not Invoiced` (credit), "regardless of the
  full or partial plan completion because the full liability of the plan is incurred to the provider at this
  time."** **The intangible asset is then relieved proportionally to `Protection Plan Cost of Sales` on each
  completion.** This is the core accounting rule.
- **Worked example (plan price $100, cost $60), first completion of ½ for $50 — verbatim:**

  | GL Account | Debit | Credit |
  |---|---|---|
  | Cash | 50 | |
  | Plan Sales | | 50 |
  | Cost of Sales | 30 | |
  | Intangible Asset (1/2) | | 30 |
  | Intangible Asset (full) | 60 | |
  | Plans not Recorded | | 60 |
  | **Totals** | **140** | **140** |

  **Completing the balance (½ for $50):** Cash 50 / Plan Sales 50 / Cost of Sales 30 / Intangible Asset (1/2) 30
  — **totals 80/80, and the intangible asset is now fully relieved.**
- **Deleting the balance of a partially completed sale instead:** `Cost of Sales` **debit 30** /
  `Intangible Asset (1/2)` **credit 30** — **the intangible asset is fully relieved by crediting the balance of
  the plan cost, and the offsetting debit to Cost of Sales "results in an increase to the cost, reflecting the
  true cost of the plan sold."**
- **Tiered partial-deletion example (verbatim numbers):** Love Seat 1,998.20 + Sofa 2,398.30 = **4,796.50** →
  **tier 4 (price 399.99, cost 153.00)** on this table:

  | Tier | Min | Max | Price | Cost |
  |---|---|---|---|---|
  | 1 | 0 | 1,999.00 | 259.99 | 93.00 |
  | 2 | 2,000.00 | 2,999.00 | 299.99 | 115.00 |
  | 3 | 3,000.00 | 3,999.00 | 359.99 | 132.00 |
  | 4 | 4,000.00 | 4,999.00 | 399.99 | 153.00 |
  | 5 | 5,000.00 | 5,999.00 | 359.99 | 177.00 |

  Sofa completes, Love Seat backordered: **Plans not Recorded credit 153.00; Intangible Asset debit 153.00 and
  credit 83.46; Cost of Sales debit 83.46** — leaving **69.54** in the intangible asset for the backordered
  line. Cancelling the backordered Love Seat is **treated as a partial return based on the change in cost tier**:
  new subtotal 2,398.30 → **tier 4 → tier 2, cost decrease 38.00 (153.00 − 115.00)**, giving
  **Plans not Recorded debit 38.00; Intangible Asset credit 69.54; Cost of Sales debit 31.54 (69.54 − 38.00).**
  (**Note the table itself is internally odd — tier 5's price 359.99 is lower than tier 4's 399.99. Reproduced
  verbatim; assume a source typo, but it demonstrates that nothing validates tier monotonicity.**)
- **Non-tiered return postings:** returning ¼ of the total for $25 → Cash 25 credit / Plan Sales 25 debit /
  Cost of Sales 15 credit / Intangible Asset (1/4) 15 debit. **On the FINAL return an extra pair posts:
  `Plans not Recorded` debit 60 and `Intangible Asset` credit 60 — "This results in a complete relief of the
  Intangible Asset and a debit to Accounts Payable (refund due from the provider for the fully returned plan)."**
- **Tiered return postings:** with tier table (1: 0–999 price 50 cost 25; 2: 1000–1999 price 60 cost 30;
  3: 2000–2999 price 70 cost 35; 4: 3000–3999 price 80 cost 40), a $1,500 subtotal with $1,000 returned →
  new subtotal $500 → **tier 2 → tier 1**:

  | GL Account | Debit | Credit |
  |---|---|---|
  | Cash | | 10.00 |
  | Plan Sales | 10.00 | |
  | Cost of Sales | | 5.00 |
  | Intangible Asset | 5.00 | |
  | Intangible Asset | | 5.00 |
  | Plans not Recorded | 5.00 | |
  | **Totals** | **15.00** | **15.00** |

  **"Since the change in plan cost is transmitted to the provider when the plan cost is adjusted, an additional
  GL posting is required to move the Intangible Asset to Plan Not Recorded any time the plan cost is changed."**
- **If the plan has a fixed cost but a tiered price, NO cost-related GL postings are generated on return.**
  **If the merchandise total does not change the tier, there are NO additional plan postings at all.**
- **Price override rule (hard):** **when the return price of a plan is overridden, that price is used ONLY for
  the `Plan Sales` posting. `Cost of Sales` and `Intangible Asset` remain proportionate to the total cost of the
  returned merchandise on the linked completed sale.** (Example: default $25 overridden to $20 → Cash 20 /
  Plan Sales 20, but Cost of Sales 15 / Intangible Asset 15 unchanged.)
- **Dollar adjustment postings:** adding a plan posts like an initial completion; removing one posts like a final
  return — **"Only in these situations will a posting be made to `Plans not Recorded` with a full offset to
  `Intangible Asset`."** **If only the plan price is adjusted, the ONLY posting required is `Plan Sales`** (e.g.
  a $50 increase → Cash 50 debit / Plan Sales 50 credit). If linkage maintenance changes both price and cost,
  postings mirror an initial partial completion **but Intangible Asset and Plans Not Recorded are hit only for
  the INCREASED cost**, creating an additional payable to the provider.
- **"Any adjustments required need to be manually handled between the retailer and the plan provider."**
- **"The Protection Plan only shows up in the General Ledger posting after the order it is on has been
  completed."**

**Behavior & rules — Accounts Payable integration.**
- **`Protection Plans not Invoiced` mimics the existing `Received not Recorded` account used for uninvoiced
  inventory, and is relieved automatically as AP Bills are created to pay for completed plans. If bills are
  created manually, or via a manual GL journal entry, it must be relieved manually.**
- `Enter Multiple Vendor Invoices` has a **`Protection Plans`** option; the `Order` option targets the original
  order (lookup calls `View a Customer's Historical Purchases`; the extra action accepts multiple order numbers).
  Running it opens **AP Approval Selection**, **one row per completed/returned plan**.
- Each selection then opens **Individual Vendor Invoice** creating an **expense invoice**; on saving,
  **GL Distribution – AP Bill Entry** defaults **a credit to Accounts Payable and a debit to
  `Protection Plans not Invoiced`.**

**Other.**
- **Commissions/spiffs may be earned on plan sales, based on plan price or plan gross profit**, configured in
  Point of Sale Control Settings; **`Report Sales Commissions` reports them like Delivery Commissions and
  Payment Adjustments.**
- **Service orders:** plans are processed like warranties — **a plan is associated with an extended warranty
  code and selected through Service Detail Information. If the service order has no original invoice, all
  extended warranties associated with qualifying plans for the linked merchandise are listed.**
- Inquiries including plan prices in order totals: `View an Existing Sales Order`,
  `View a Customer's Open Order`, `View a Customer's Historical Purchases`,
  `View a Customer's Protection Plan Activity`, `View a Customer's Protection Plan Details`.
- Reports updated with plan information: `Report Written Sales Dollars`, `Report Written Sales by Salesperson`,
  `Report Written Sales Summary`, `Report Open Sales Order Summary`, `Report Completed Sales Dollars`,
  `Report Completed Monthly Sales Dollars`, `Report Sales Commissions`, `Sales Performance Report`.
- **Enhanced Laser Print forms carrying the header tags `Protection Plan Code`, `Protection Plan Description`
  and `Price`:** Sales Order (including Quotes and Layaways), Cumulative Sales Order, Return, Exchange,
  Delivery/Pickup Ticket.
- `Export Protection Plan Activity` communicates activity to the provider (**no license required**);
  `Protection Plan Import` creates and updates plans in bulk.

**Untrusted-content note.** The article carries one reader comment (Katie Gear, December 13, 2023) stating the
article was updated to reflect changes in tiered protection plan price calculations. It contains no
instructions; recorded only as provenance for the tiered-pricing rules above.

**Dependencies.** Protection Plan Settings; Point of Sale Control Settings (`Prompt to Add to Order`,
`Automatically Add to New Order`, `Automatic Add Merchandise Overlap`, `Exchanges Use Existing Plan`,
commission basis); Warranty Settings; Advanced Product Settings (legacy warranty terms); Inventory Formations;
General Ledger Assigned Account Settings (`Intangible Assets-Protection Plans`, `Protection Plans not Invoiced`,
`Protection Plan Cost of Sales`); Accounts Payable (`Enter Multiple Vendor Invoices`, `Individual Vendor
Invoice`, `GL Distribution – AP Bill Entry`); Protection Plan Provider Interface (**licensed**);
`Export Protection Plan Activity`; `Protection Plan Import`; Protection Plan Register;
`View a Customer's Protection Plan Activity` / `... Details`; Audit Comments Log; `USR-018` (fees also key off
taxability); Report Sales Commissions; Data Warehouse.

**Build notes.**
- **This is the deepest revenue-recognition logic in the whole section and should be treated as a
  first-class subsystem, not an order-entry add-on.** The accounting shape is genuinely correct and worth
  copying: **plan revenue recognized proportionally as linked merchandise is delivered; the full provider
  liability recognized at first completion; an intangible asset relieved proportionally to cost of sales.**
  Keep that. It is the one piece of STORIS design in this part that is better than what we would invent.
- **Data model:** `protection_plan` (definition, **versioned** — the exchange flow already depends on retrieving
  "the version of the plan used when the merchandise was originally linked"); `plan_price_tier`
  (`min_subtotal`, `max_subtotal`, `price_amount` or `price_percent`, `cost_amount` or `cost_percent`,
  `effective_from`); `order_plan` (header-level instance, unique **registration code**); `order_plan_line`
  (link to each merchandise line with its proportional price and cost). **Version the plan definition
  explicitly rather than relying on lookup-by-code, and effective-date the tiers.**
- **Write the proportion rule down once and test it hard:**
  `proportion = completed_linked_merchandise_price / total_linked_merchandise_price`, applied to both plan price
  and plan cost, **with the rounding residual forced onto the final completion** so the sum of recognized
  amounts equals the plan total exactly. STORIS's own prose states this backwards — our spec must not.
- **Tier tables need validation STORIS lacks:** contiguous non-overlapping bands, monotonic pricing, no gaps.
  The source's own example table has a non-monotonic tier 5. Validate on save.
- **Distinguish "unset" from "zero" in tier rows.** STORIS overloads a price-less minimum-subtotal row to mean
  "maximum subtotal" — model `min_subtotal`/`max_subtotal` explicitly instead.
- **Eliminate the inconsistent states the article documents:** a plan on a completed order with no linked lines
  must be unreachable. Enforce the invariant "a plan instance with zero linked lines does not exist" in the
  return path rather than requiring a Dollar Adjustment to clean up afterwards. Likewise, allow plan
  removal/relinking directly in the return flow instead of forcing a separate Credit Dollar Adjustment.
- **Provider communication must be an event stream, not an export report.** Every material change (registration,
  completion, price change, cost/tier change, return, cancellation) emits a versioned event with the
  registration code, delivered with retries and reconciliation. STORIS's "any adjustments required need to be
  manually handled between the retailer and the plan provider" is a standing source of revenue leakage.
- **The Protection Plan Register is effectively an audit log for one feature.** Generalize it: our
  `RPT-AUDIT` should carry the same lifecycle events for every entity, and the plan register becomes a
  projection over it rather than a bespoke file.
- Keep: header-level (not line-item) modeling; multiple plans per order; plans spanning fulfillment methods;
  auto-select with an explicit, configurable tie-break; commission on price or gross profit.
- Reconsider: **`Automatically Add to New Order` silently attaching a paid coverage product to a customer's
  order without presenting the selection screen is a consumer-protection risk**, not just a UX choice.
  **`[DECISION NEEDED]`** — default to prompt-and-confirm, and require an explicit customer-visible line on the
  order and receipt.
- `[DECISION NEEDED]` Does LA Mattress sell protection plans in-house, through a provider (Guardsman,
  Montage, Uniters), or both? A provider integration changes this from an accounting feature into an
  integration feature and makes the event stream mandatory.
- `[DECISION NEEDED]` Tiered vs flat pricing: tiering drives most of the complexity above (tier changes on
  return, exchange and adjustment, with cost-tier deltas posting to GL). If LA Mattress can live with flat or
  simple percentage pricing, the implementation is dramatically smaller.

