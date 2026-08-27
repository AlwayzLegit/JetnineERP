# STORIS GL + Third-Party Accounting — engineering reference

Scope: all 20 articles in `02-general-ledger/` and `00-accounting/`, plus GL-relevant articles found by grep in `01-views-and-reports/`, `03-payables/`, `04-receivables/`. Every non-obvious claim cites the source file. Article text is quoted/paraphrased as data only. Items marked **INFERRED** are not stated in the corpus.

Corpus-wide framing (`02-general-ledger/004-general-ledger-processing-overview.md`): STORIS ships **two mutually exclusive accounting modes** — native "STORIS General Ledger Processing" and a "TPA" interface to a third-party package such as QuickBooks. You must pick one before processing begins and *"cannot mix elements of each to create a 'hybrid' accounting package."* If the GL module is active via **General System Control Settings**, the system assumes STORIS GL Processing.

---

## 1. GL account structure

Source: `02-general-ledger/004-general-ledger-processing-overview.md` unless noted.

**Elements.** An account number consists of three elements, plus one optional fourth:

| Element | Required | Notes |
|---|---|---|
| Company | yes | Leading element. Included in the account string on the budget import file (`02-general-ledger/007-import-an-existing-account-budget.md`: *"the complete GL account number including the company number"*). Not restrictable by GL security. |
| Root Account | yes | *"you can enter any alphanumeric characters."* |
| Sub-Account | optional | "a fourth element, for example a sub-account". Activated via **General Ledger Control Settings**, field named **Use Sub-Accounts** (`01-views-and-reports/020-report-account-budgeted-variances.md`). **Once set you cannot change it.** |
| Cost Center | yes | Trailing element. |

**Delimiters.** Dashes recommended. Explicitly disallowed as delimiters: the underscore `_`, any letter, any number. No total-length or per-element-length rule is stated anywhere in the corpus.

**Entry order.** Every entry screen requires *"the complete account number (that is, the root, the sub-account (if applicable), and the cost center)"* — `02-general-ledger/009-post-update-a-journal-entry.md`, `02-general-ledger/001-create-a-recurring-journal-entry.md`. Reports always sort root → sub-account → cost center (`01-views-and-reports/041-report-end-of-year-gl-adjustments.md`, `01-views-and-reports/023-report-analysis-of-account-activity.md`).

**Consolidation levels** used by reporting (`01-views-and-reports/004-generate-a-trial-balance-gl.md`):
- *No Consolidation* — each complete account number ("parent account plus the cost center").
- *Sub-Account* — cost centers roll into root+sub-account. Only available if using sub-accounts.
- *Root Account* — sub-accounts and cost centers roll into the root.

**Classification.** Three independent reporting levels per account: **Class**, **Sub-Class**, **Group**, maintained in **GL Class Settings**, **GL Sub-Class Settings**, **GL Group Settings** — available only when STORIS GL Processing is active. The hierarchy is Group ⊂ Sub-Class ⊂ Class: selecting a group in `01-views-and-reports/006-gl-account-lookup.md` auto-fills and locks sub-class and class.

**Cost-center wiring.** Cost centers are linked to a root account (or, when sub-accounts are in use, to a selected sub-account) from **GL Account Settings** via the Multiple GL Cost Center Selection screen, which accepts a single cost center, multiple, a range (`Cost Center` + `Through`), a saved list, or *all cost centers associated with one or more districts or regions* — *"Cost centers are associated with regions and districts based on the locations in the selected regions or districts"* (`01-views-and-reports/011-multiple-gl-cost-center-selection-screen.md`). Sub-accounts are linked the same way (`01-views-and-reports/013-multiple-gl-sub-account-selection-screen.md`). Cost centers are created in **GL Cost Center Settings** (`00-accounting/003-log-report-errors.md`).

**Cost-center distribution lists** (`02-general-ledger/006-gl-cost-center-distribution-screen.md`): named, reusable lists of two or more cost centers with a **2-digit percentage (1–99)** each; the total *"must equal 100%"*. Reached from the GL List Entry Window off the GL Distribution Screen, itself reached from Enter/Update Individual Vendor Invoice when saving an expense invoice. Also offered as a "Cost Center Distribution" action on the AR/AP GL Distribution screens (`04-receivables/052-gl-distribution-screen.md`, `04-receivables/051-gl-distribution-vendor-receivables-manual-adjustment-gl-postings.md`).

**Placeholder account.** `$$$$$-NN` is a default/unmapped account marker; a GL batch containing it cannot be saved out of the GL Distribution Screen (`04-receivables/052-gl-distribution-screen.md`).

**"No cost center indicator."** Accounts can carry a no-cost-center indicator; Import Journal Postings needs a Default Company to resolve those rows (`02-general-ledger/008-import-journal-postings.md`). The corpus never states the literal value of this indicator.

**Security.** **General Ledger User Permissions** restricts entry and/or inquiry by *"any combination of root account, sub-account, and cost center"* — but **not** the company element. GL staff security does not apply to control or settings routines, and *"Standard location restrictions, including Regional Processing, do not apply to the STORIS General Ledger Processing module."* Note also: *"GL User Permissions are not enforced"* in General Ledger Control Settings or General Ledger Assigned Account Settings, and GL security is not enforced in Report Suspended Postings (`01-views-and-reports/058-report-suspended-postings.md`).

**Account descriptions.** The TPA account maintenance screen caps description at **30 alphanumeric characters** (`00-accounting/006-tpa-account-settings.md`). No length is stated for the native GL account description.

**Report sign convention.** *"When credit hits mix with debits on a report, the system signs them with a preceding negative sign. When credits are identified as such by a header (for example, GL Recap), the system does not sign them."*

---

## 2. Fiscal calendar

**Period tables.** A **GL period table** exists per company per fiscal year and is the gate on nearly everything: you can only post to a date *"for which a GL period table exists"* (`02-general-ledger/009-post-update-a-journal-entry.md`), only budget a future year *"as long as a GL period table exists"* (`02-general-ledger/002-create-an-account-budget.md`), and report pickers list only years with a period table. Periods can be user-defined or calendar-based (`02-general-ledger/004-...overview.md`). A **weekly calendar** variant exists — the trial balance's Weekly Summary option is *"available only where a weekly calendar is being used"* (`01-views-and-reports/004-generate-a-trial-balance-gl.md`) and View Account Activity exposes a week drill level under the same condition (`01-views-and-reports/078-view-account-activity.md`).

**Periods 1–12 plus period 13.** Period 13 is the year-end adjustment period. Fiscal period pickers on non-GL reports are labelled 01–12 (`01-views-and-reports/026-report-cash-disbursements.md`).

**Close/Update Fiscal Periods** (`02-general-ledger/000-close-update-fiscal-periods.md`):
- Inputs: **Company**, **Fiscal Year**, **Action** (Close / Reopen), **Fiscal Period**. Executes on Save.
- The period table displays with three flags per period: **GL Closed**, **GL Reopened**, **Sales Closed**.
- **Action default:** Close if any period (including 13) is open; Reopen if all are closed.
- Close list offers only open periods, defaulting to the earliest open; Reopen list offers only closed periods, defaulting to the latest closed.

**Close rules:**
- Closing disallows any additional postings to that period.
- *"You can select any open period as long as the sales period has been closed."*
- Selecting period 13 closes the entire year.
- Closing a period while prior periods are open cascades: *"all prior periods being closed"* — warning shown, can proceed.
- Cross-year: closing a period in year N does **not** close period 13 of year N−1. Period 13 must be closed manually to close the prior year.

**Reopen rules:**
- Any closed period may be reopened, including 13 (which reopens the whole year).
- Reopening cascades forward: all subsequent closed periods reopen — warning shown, can proceed.
- **Allow Reopen Years** in **General Ledger Control Settings** *"controls the number of periods you can be reopen"* [sic]. Zero ⇒ current-year periods only, no prior years. *"The check is based on the most recent open year that has not been previously reopened, even if it occurs in the past."*

**GL period vs sales period.** They are separate calendars with an ordering dependency:
- Sales periods close by running the **Sales end-of-month (period)** process and **cannot be reopened**.
- The Sales Closed column in Close/Update Fiscal Periods is display-only.
- A GL period cannot be closed until its sales period is closed.
- Sales-period state gates AP entry independently: an AP bill entry date *"must be from an open sales period"* and a payment date cannot be *"in a closed sales period"* (`03-payables/031-enter-update-individual-vendor-invoice.md`, `01-views-and-reports/080-view-ap-bill.md`, `03-payables/023-date-for-new-batch-window.md`).
- GL batch dating: any date with a period table, not in a **closed GL period**; a **future** GL period produces a warning but is allowed (`02-general-ledger/009-post-update-a-journal-entry.md`).

---

## 3. Journal entries

### Post/Update a Journal Entry — `02-general-ledger/009-post-update-a-journal-entry.md`

Native mode: maintain existing and create new GL batches. TPA mode: *"use this routine to fix bad batches rejected by TPA"*, where only the **Comment** and **Account** fields are editable. Read-only twin: **View Individual Postings** (`01-views-and-reports/091-view-individual-postings.md`, identical body text). Tabs: Header, Detail Postings.

**Batch field.** `<Enter>` creates a new batch; otherwise enter a STORIS GL batch number. Search menu:
- *Bad TPA Batch Lookup* — Bad TPA Posting Selection; lists bad batches with source and comment. TPA only.
- *Suspended Postings* — all invalid and/or "on hold" GL batches.
- *Posted Batch Search* — GL Batch search engine for transmitted batches.

**Header fields:** Company; **Type**; Adjust Year; **Date** (fiscal period shown to the right); **Status** (None / Hold); **Source** ("the GL book of source"); Operator; Created (time+date); Comment.

**Type** (settable only on a new batch):
| Type | Effect | Source |
|---|---|---|
| Regular Journal Entry | default | (batch's own source) |
| Reversing Journal Entry | final update *"automatically posts a reversing batch for the fiscal period following the period displayed at the Date field"* | **GLRV** |
| End of Year Journal Entry | postings go to **fiscal period 13** of the year at Date; requires that fiscal year open **and** period 12 of that year closed; Company and Type inactivate, **Adjust Year** activates | **GLAJ** |

**Adjust Year** lists each fiscal year that qualifies for adjustment for the company; first available defaults.

**References** (optional, per batch): primary type + number, secondary type + number.
- Primary: `ORH` order/invoice incl. sales, memos, service, transfers · `APB` AP bill · `POH` purchase order · `PRO` product · `CDR` cash drawer · `VOI` vendor open item · `COI` customer open item · `FRA` finance account. Only **APB, ORH, POH, PRO** are validated against file; the rest have no verification.
- Secondary: `CUS` customer · `VEN` vendor · `WLO` location. Validated with a warning if not found.

**Comment vs Remark are mutually exclusive** — header Comment text blocks detail Remark text and vice versa (stated in both `009-post-update-a-journal-entry.md` and `001-create-a-recurring-journal-entry.md`).

**Detail Postings:** Account (full account; Search → GL Account Entry screen, Action → GL Account Lookup); Remark (defaults down to subsequent grid lines, editable); **Debit**; **Credit**; Debit Total / Credit Total (display-only); Message.
- **Both Debit and Credit must be positive numbers**; each line needs one or the other.
- **Duplicate GL accounts are allowed within a batch** — to maintain an existing line you must select it from the grid rather than re-keying the account.
- Under TPA, Debit and Credit are read-only.
- Message shows **"Bad Post"** when the batch is invalid, **"Summary Batch"** when transmitted as part of a summary batch.
- Actions: **Validate Batch** (invalid results shown in a text box), Document Inquiry, **Import Batch** (→ GL Batch Import screen).

**Balancing.** The JE screen itself states no explicit balance check beyond Validate Batch, but the auto-posting distribution screens do: *"to Save and exit … the Proof field must be zero (that is, the general ledger batch must be in balance)"*, where **Proof = Total Debit − Total Credit** (`04-receivables/052-gl-distribution-screen.md`, `04-receivables/051-...-manual-adjustment-gl-postings.md`). Invalid account rows render **red** on those screens.

### Recurring journals — `02-general-ledger/001-create-a-recurring-journal-entry.md`
- Keyed by **Recurring Journal Number**; `<Enter>` for a new definition. **"Recurring journal entry definition numbers are distinct from batch numbers."**
- General tab: Company; **Posting Frequency**; Description (free text); **Delete After Post**; **Last Posting** (date of last actual update, display).
- **Posting Frequency** values: `P` = each fiscal period **except period 13**; `Q` = last fiscal period of each quarter; `1`–`13` = that specific fiscal period. **Report Recurring Journal Entries** reads this field to flag when a batch is due; that report prints an asterisk next to each account due for posting (`01-views-and-reports/054-report-recurring-journal-entries.md`).
- Create the Posting: **Transaction Date** (period displays once entered), then **Update**. Update is active only when all three hold: a transaction date is specified; **at least 2 detail postings** exist; **the detail postings are in balance**.
- On update the definition is saved with the new Last Posting, or deleted if Delete After Post is set (warning with abort option first). Screen refreshes after update.
- Detail tab mirrors the JE detail tab, including TPA read-only Debit/Credit and duplicate-account behaviour.

### Sources, suspension, posting reports
- Sources live on the **GL.SOURCE** file (`02-general-ledger/008-import-journal-postings.md`). Named sources seen in the corpus: `GLRV`, `GLAJ` (`009-post-update-a-journal-entry.md`), `APVE`, `APVM` (`01-views-and-reports/023-report-analysis-of-account-activity.md`), `TEOE` (as an example in `01-views-and-reports/078-view-account-activity.md`). Selection via **Multiple GL Source Selection Window** (`01-views-and-reports/012-multiple-gl-source-selection-window.md`).
- **Suspended postings** have exactly two reasons: **Invalid** and **Hold** (`01-views-and-reports/058-report-suspended-postings.md`; inquiry status All / On Hold / Invalid in `01-views-and-reports/061-suspended-postings-inquiry.md`). Report Suspended Postings breaks by company, then by GL source for Invalid and by operator for Hold; for invalid transactions *"all reasons print beneath each batch."* Correction is always via Post/Update a Journal Entry.
- Posted transactions: **Report Posted Transactions** lists everything posted since the last EOD, a date range, or named batches. Its EOD behaviour is driven by the **End-of-Day Posted Transactions** field in **General Ledger Control Settings**, with four modes: run in EOD reporting all transactions; run in EOD reporting only manual transactions; do not run automatically; or *"suppresses the report and the generation of the GL Post Register records"* (`01-views-and-reports/047-report-posted-transactions.md`).
- AP posts to GL immediately on filing: *"This routine posts to General Ledger immediately upon filing. Summary GL hits stored in the AP bill header are available for change prior to filing via the GL Postings screen"* (`03-payables/031-enter-update-individual-vendor-invoice.md`).

---

## 4. Imports

**Shared harness for all three GL imports** (`005`, `007`, `008` in `02-general-ledger/`):
- STORIS publishes one **GL Import Spreadsheet** workbook containing **three worksheets**: *GL Batch Import*, *Import Journal Postings*, *GL Budget Import*. You must use the STORIS-supplied worksheet.
- Download path stated: STORIS secure web site → log in → **Documentation, Vision, Spreadsheet Downloads** page → **GL Import Spreadsheet** button in the *GL Import Spreadsheets* section. (`007` writes the page name as "Documentation, Vision, Downloads" — minor inconsistency between articles.)
- Save the sheet as a **tab-delimited text file (.txt)** before importing.
- **THE FIRST TWO ROWS must NOT be removed. Import starts at row 3.**

### 4.1 GL Batch Import — `02-general-ledger/005-gl-batch-import-screen.md`
- Access: **Actions button on Post/Update a Journal Entry** (i.e. it imports into the batch context, not from a menu).
- Imports **a single GL batch**. One spreadsheet row per account posting.
- Only documented field: **PC Path of Spreadsheet** (Action button opens a Windows browse dialog).
- Explicitly contrasted with Import Journal Postings, *"except that routine can import multiple journal postings at one time."*
- No column layout, validation rules, or error behaviour are documented for this routine.

### 4.2 Import Journal Postings — `02-general-ledger/008-import-journal-postings.md`
- Access: `Accounting > General Ledger > Import Journal Postings`. One row per account posting.
- Fields:
  - **Default Company** — used *"in the event the import process encounters an account containing the no cost center indicator. … if the process finds a valid cost center for an account, it uses it to determine the company."* So company is normally derived from the cost center.
  - **PC Path of Spreadsheet** (Action → Windows browse).
  - **Post if Non-Fatal Errors Found** (checkbox).
  - **Print Error Report** (checkbox).
- **Amount ceiling:** max journal entry amount **$99,999,999.99**; ≥ $100,000,000 raises an error and aborts.
- **Batching rule:** *"The program assigns to a single batch (GL.POST) all transactions that share the same company, source and date."*
- **Fatal errors** (any one ⇒ whole import aborts, nothing posts):
  - company does not exist in the Company file
  - transaction date not formatted properly, or for a closed period
  - transaction date is for a closed period *(listed a second time in the article — duplicated bullet)*
  - debit or credit amount is not numeric
  - source does not exist on the **GL.SOURCE** file
- **Non-fatal errors** (import proceeds only if *Post if Non-Fatal Errors Found* is checked; otherwise aborts):
  - account number does not exist in the **GL.ACCOUNT** file
  - source does not exist in the GL.SOURCE file *(also listed as fatal — contradiction, see Open questions)*
  - the cost center company does not match the company passed
- Prompts on error: `Fatal Errors Found!` or `Non-Fatal Errors Found!`. The optional Error Report *"lists both fatal and non-fatal errors along with their row location within the import file."*
- Post-import: *"The program flags all batches containing invalid data and does not post them."* Recovery loop is **GL Invalid Transaction Report** → fix → re-submit for posting.
- Files named: `GL.POST`, `GL.SOURCE`, `GL.ACCOUNT`, Company file.

### 4.3 Import an Existing Account Budget — `02-general-ledger/007-import-an-existing-account-budget.md`
- Access: `Accounting > General Ledger > Account Budgets > Import an Existing Account Budget`.
- Fields: **Fiscal Year for Import** (picker of valid fiscal years); **PC Path of Spreadsheet**; **Overwrite Existing Budgets** (checkbox).
- **File layout — the only fully specified layout in the corpus:** one row per budget record, **13 columns**.
  - Column 1: the complete GL account number **including the company number**.
  - Columns 2–13: **12 budget amounts including decimal places**. *"If you do not include decimals, the program assumes you are using whole amounts."*
  - Note the layout has **no period-13 column** — 12 amounts only.
- **Validation is all-or-nothing:** *"The import process first validates the data in the spreadsheet. If the program finds invalid data, the import process aborts."* No partial-post option, no error-report checkbox.

### 4.4 Import Vendors from Third Party Accounting — `00-accounting/002-import-vendors-from-third-party-accounting.md`

Alternate title in the article body: *(Initial Vendor Transfer From TPA)*.
- Access: `Accounting > Third Party Accounting > General Ledger > Import Vendors from Third-Party Accounting`.
- Direction: **QuickBooks → STORIS**. Documented only for the QuickBooks interface.
- **Destructive and one-shot:** *"This process overwrites vendors in STORIS. If you need to run this process, run it once during initial startup only."* STORIS's stated preference is to create vendors in STORIS and push them out instead.
- Preparation in QuickBooks: create a **Vendor Type of 'STORIS'** and set the **Type** field to `STORIS` on each vendor to transfer.
- In the STORIS routine you specify which QuickBooks address lines populate **Address Line 1** and **Address Line 2**.
- **Vendor Code generation:** a 5-character key = first **3 characters of the QuickBooks Company Name** + a **2-digit sequential number starting at `00`**. Consequence stated outright: *"each vendor has a different key in STORIS and in QuickBooks."*
- **Cross-reference:** the Vendor file holds an inaccessible internal field **TPA Equivalent** mapping to the QuickBooks vendor key.
- **Terms-code resolution order:** QuickBooks terms code → if absent in STORIS, check the TPA Equivalent field → if a match exists use that STORIS terms code → otherwise assign a **null** terms code.
- No file format is involved; this is a live interface pull, not a spreadsheet import.

---

## 5. Budgets

**Create an Account Budget** — `02-general-ledger/002-create-an-account-budget.md`. Keyed by **Company + Fiscal Year + Account** (full account including cost center). Any future year is allowed provided a GL period table exists; default is the **next** fiscal year; if you pick the current year *"you can modify only the open periods."*

**Automatic calculation** via **Base on Variance from** + **Variance Percentage**:
| Option | Behaviour | Restriction |
|---|---|---|
| None | no calculation | — |
| Current Year's Total Activity | annual budget = current-year annual activity increased by the variance %, then **1/12 apportioned to each period** | only usable **in the last period of the current fiscal year** |
| Current Year's Period Activity | per-period budget = same period's current-year activity + variance | only in the last period of the current fiscal year |
| This Year's Budget | per-period budget = same period's current-year **budget** + variance | — |

Variance Percentage may be **negative** and **may exceed 100%**. The **Calculate** button is active only once both method and percentage are set and *"overwrites all existing values."*

**Grid columns:** Period Ending · Period Activity · Current Year Budget · Budget (heading built dynamically from the fiscal year). Totals for every column print beneath the grid. Convention: *"For periods with no activity, the period from the previous fiscal year displays and an asterisk appears to indicate it was taken from the prior year."*

**Manual entry:** per period directly, or one annual figure in **Total** which the program apportions 1/12 per period, overriding existing period amounts after a warning with abort.

**View an Existing Account Budget** (`01-views-and-reports/079-view-an-existing-account-budget.md`) — grid of Period Ending · Activity This Year · Budget This Year · **Variance $** · **Variance %**, same prior-year asterisk convention.

**Report Account Budgeted Variances** (`01-views-and-reports/020-report-account-budgeted-variances.md`) — *"compare, on a period basis, amounts budgeted with actual amounts posted."* Selection by company, fiscal year, period, root account, sub-account, cost center. Sort/page-break combos: Account, Sub-Account, Cost Center; the lowest sort level prints in detail so no page break is offered there. Requires permission via the **Inquiry/Report Restrictions** section of **General Ledger User Permissions**.

---

## 6. Year-end

Source: `02-general-ledger/003-end-of-year-overview.md`, with mechanics in `000-close-update-fiscal-periods.md`.

**Preconditions.** All 12 periods of the year must be closed. Period 13 remains open as the adjustment window and **must be closed manually** — *"even if you close period 1 in the following year period 13 will remain open until it is closed."*

**Reconciliation reports named for comparison against GL:** Report Value of Inventory · Report Accounts Receivable Aged Trial Balance · Report Payables Activity · Report Completed Sales Dollars.

**Making adjustments.** Use Post/Update a Journal Entry in period 13. Article instruction verbatim: *"When creating a batch in period 13, do not specify a date and use Type Y (End of Year Journal Entry) for your postings."* (Type Y = the End of Year Journal Entry type, source **GLAJ**, per `009-post-update-a-journal-entry.md`.) Review with **Report End of Year GL Adjustments** (`01-views-and-reports/041-report-end-of-year-gl-adjustments.md`: per company + fiscal year, Summary Only prints one line per account, sorts by class/sub-class/group/account with the final sort always account number).

**Pre-close checks the system performs.** Before closing the period the system checks for **open freight batches** and **unposted transactions prior to the first day of the next period**.
- Open freight batches → **View Open Freight Batches**, reached via the magnifying-glass lookup in *Receive a Purchase Order with a Separate Freight Bill*; close the batch there.
- Unposted transactions → **Report Suspended Postings**, correct in Post/Update a Journal Entry.

**Retained earnings.** Once the 12 periods are closed, retained earnings post to the account named in the **Retained Earnings account** field in **Company Settings**. Mechanic as stated: the program takes the ending balance of the closing year in that GL account and **adds the total from all Profit & Loss accounts for that year**; all P&L accounts reset to a zero beginning balance in the new year, so their net activity is closed into retained earnings. Retained earnings is therefore a **per-company** setting, not per cost center.

---

## 7. Third-Party Accounting (TPA)

### 7.1 What TPA is

An alternative to native GL: STORIS keeps its own GL batch records but **transmits** them to an external accounting package. Packages named across the corpus: **QuickBooks** (the only one documented in detail), **Generic Interface**, and **STORIS Accounting** (`00-accounting/009-update-approved-customer-refunds.md` enumerates all three as "the third-party accounting package your system is using"). Mode is exclusive — no hybrid (`02-general-ledger/004-general-ledger-processing-overview.md`).

Under TPA, native GL screens degrade to repair tools: in Post/Update a Journal Entry and Create a Recurring Journal Entry, **Debit and Credit are display-only for TPA users**, and the JE screen is described as *"use this routine to fix bad batches rejected by TPA"* with only Comment and Account editable.

The **TPA #** field on a GL batch holds *"the reference number assigned by your TPA"* (`02-general-ledger/009-post-update-a-journal-entry.md`).

### 7.2 TPA Account Settings — `00-accounting/006-tpa-account-settings.md`

`Accounting > Third Party Accounting > General Ledger > General Ledger Settings > Account Settings`. Active only when the Third Party Accounting Interface is active. Two documented fields: **Account Number** (Search offers *GL Account* and *GL Account Description Lookup*) and **Description**, up to **30 alphanumeric characters**. This is the TPA-mode chart-of-accounts maintenance screen.

### 7.3 Transfer Third Party Accounting Information (the outbound interface)

`00-accounting/008-transfer-third-party-accounting-information.md` — `Accounting > Third Party Accounting > General Ledger > Transfer Third Party Accounting Information`. A checkbox-driven batch runner with five processes, then **Run**:

| Process | Direction | What it moves | Coupling |
|---|---|---|---|
| **Transfer GL Accounts From TPA** | inbound TPA→STORIS | GL accounts created in QuickBooks after install. The STORIS default chart of accounts is pre-loaded during TPA module installation. | — |
| **Transfer Vendors to TPA** | outbound | **only vendors flagged 'New'** | Auto-selected when Post AP Transactions is selected. Not available under STORIS Accounting (vendor sync is automatic). |
| **Post AP Transactions to TPA** | outbound | un-transmitted **AP approved batches** | *"associated GL transactions are automatically transmitted"*; auto-selects Transfer Vendors to TPA |
| **Post GL Transactions to TPA** | outbound | GL transactions **other than** AP and credit approvals — *"such as sales, inventory adjustments, receipts, etc."* | — |
| **Post Customer Refunds to TPA** | outbound | un-transmitted **approved Customer Refund batches** | *"associated GL transactions are automatically transmitted"* |

Operational constraint: a QuickBooks session should be open **on the correct company** before running transfers. *"If QuickBooks is open for another company … errors occur during the transfer process and the transactions are not posted."*

Run-time feedback: each process shows **In Progress**; a failing process is marked **ERROR**; the interface may emit *"Error(s) occurred in TPA interface. Please review logs."* Diagnosis is via **Report on Third Party Accounting Transmission Errors**.

**Summarization.** If **Summarize GL Postings** is checked in **TPA Control Settings**, GL batches are summarized before transmission and get a **summary batch number**, searchable in View Multiple Postings (`01-views-and-reports/092-view-multiple-postings.md`); the JE screen shows a **"Summary Batch"** message on such batches.

**Batch cross-reference.** `00-accounting/009-update-approved-customer-refunds.md` documents a **TPA Batch Xref** search: *"a cross reference search for the GL batch number that is created in the STORIS AP/GL account during the TPA batch transfer. This option is available for STORIS Accounting only."*

### 7.4 Mapping contract with QuickBooks (from `00-accounting/003-log-report-errors.md`)

This article is the clearest statement of the object mapping. Every error is a broken correspondence:

| STORIS object | QuickBooks object | Rule | Error message when broken |
|---|---|---|---|
| Cost center | **Class** | 1:1 in both directions, at all times | "Cost center missing in QuickBooks" / "Cost center missing in STORIS" |
| GL account | GL account | *"At all times, the GL accounts that your company is using must exist in both STORIS and in QuickBooks."* | "GL account missing in STORIS" |
| Vendor | Vendor | vendor must exist in both | "TPA AP Post failed; invalid reference to QuickBooks Vendor" |
| Terms code | Terms | *"For every Terms code in STORIS, a matching Terms code must be added manually to QuickBooks."* Error text includes the missing terms-code ID. | "TPA Vendor update failed; invalid reference to QuickBooks® Terms" |

Repair routes named in the same article: missing STORIS cost center → **GL Cost Center Settings**; missing STORIS GL account → **Transfer Third-Party Accounting Information → Transfer GL Accounts From TPA**. Two remaining messages: **"Out of balance batch in QuickBooks"** — *"rarely occurs"*, escalate to STORIS Customer Service; and **"Cannot open QuickBooks"** — the transfer-to company could not be opened, no posting took place; close the wrong company, open the right one, re-run.

### 7.5 Repairing rejects

**Correct Transmission Errors** (a.k.a. *TPA Reject Maintenance*) — `00-accounting/001-correct-transmission-errors.md`, `Accounting > Third Party Accounting > General Ledger > Correct Transmission Errors`. Covers *"GL transfer errors, AP transfer errors (receiving and vendor credits), and customer-refund transfer errors."*

| Posting Type | Routes to | Reject lookup reached from |
|---|---|---|
| Bill Payments | TPA AP Bill GL Postings screen | Search at the **Bill** prompt → Bad TPA Batch lookup |
| Bill Credits | TPA AP Bill GL Postings screen | Search at the **Bill** prompt → Bad TPA Batch lookup |
| Customer Refund | Update Approved Customer Refunds | Search at the **Refund Number** prompt |
| GL Batches | Post/Update a Journal Entry | Search at the **Batch** prompt |

**Rejected Items Found** shows the count for the selected posting type. On file: the system re-evaluates; if still invalid the reason is displayed and you may save as-is or abort. If valid and TPA is active, the prompt **"Resubmit this item to TPA?"** appears — Yes *"removes the TPA error flag and resubmits the item to TPA."*

**Bad TPA Posting Selection Screen** — `00-accounting/000-bad-tpa-posting-selection-screen.md`. Reached from the Action button at the Batch field in Post/Update a Journal Entry. Stated purpose is one sentence: *"select AP bills whose GL postings you want to fix."* Elsewhere it is described as listing *"all bad batches along with the source and comment for each"* (`02-general-ledger/009-post-update-a-journal-entry.md`, `00-accounting/009-update-approved-customer-refunds.md`).

**TPA AP Bill GL Postings Screen** — `00-accounting/007-tpa-ap-bill-gl-postings-screen.md`. Key limitation: **"You can only fix postings to the default account."** Fields: **Bill** (search: AP Bill Lookup, Bad TPA Batch Lookup); **Model** — double-click the GL posting in the grid to select it; **Account** — the replacement for the default account, chosen via the GL Account Entry Screen. Bill header info displays once a bill is specified.

**Update Approved Customer Refunds** — `00-accounting/009-update-approved-customer-refunds.md` *(Customer Refund Maintenance)*. Two menu paths (Payables and General Ledger, both under Third Party Accounting). Active only under TPA. Shows open or closed Refund AP bills and lets you change the refund's location; **only invalid records are editable**. Fields: Mode/Status (status = open / invalid / closed; mode = Inquiry / Maintenance) · Refund Number · Transaction Type (read-only) · Customer (read-only) · Document Reference (read-only, *"drawn from the credit memo that generated this refund"*) · Warehouse Location · Amount (read-only) · Account · Message (rejection reason). Refund Number search menu: **GL Post** (all un-transferred GL batches with source), **Bad TPA Batch Lookup**, **TPA Batch Xref** (STORIS Accounting only).

**Delete semantics by package** (this is the sharpest statement of TPA coupling in the corpus):
- Not yet transmitted → STORIS deletes on the STORIS side.
- **STORIS Accounting** → deleted on both sides.
- **QuickBooks** → message that the refund still exists in QuickBooks; delete it in QuickBooks, return to STORIS, run Transfer Third-Party Accounting Information, and STORIS then deletes it.
- **Generic Interface** → STORIS deletes its side only and *"relies on you to delete the refund on the Generic Interface side. Important: If you do not manually delete the refund on the Generic Interface side, the two sides may become out-of-sync and cause significant problems."*

Two settings can block deletion of transmitted AP bills incl. customer refunds: **Third-Party Accounting Control Settings** (Generic tab) and **Delete payable bills after third party accounting transmission** in *Create a User/Group Actions – Payables Security*.

**Log Report Errors** — `00-accounting/003-log-report-errors.md` is not a screen; it is the message catalogue for the **Report on Third Party Accounting Transmission Errors** report. Full list is in §7.4 above.

### 7.6 Note on two of the ten TPA-section articles

`00-accounting/004-report-add-on-distribution-analysis.md` (landed add-on cost variance, menu path under Merchandising and Distribution) and `00-accounting/005-report-pre-approval-credit-statistics.md` (credit pre-approval statistics) are filed in the accounting section but contain **no GL or TPA content**. They are included in the menu-path table for completeness only.

---

## 8. Control settings referenced

| Setting screen | Named field(s) in corpus | What it controls | Cited in |
|---|---|---|---|
| **General System Control Settings** | (module activation); Multi Company Processing (Advanced Setting tab); Regional Processing; Default Company Number; Clear Data/Field Indicator | Whether the GL module is active (⇒ STORIS GL Processing assumed); multi-company; regional processing | `02-general-ledger/004`; `03-payables/*`, `04-receivables/*` |
| **General Ledger Control Settings** | **Use Sub-Accounts** · **Allow Reopen Years** · **End-of-Day Posted Transactions** · Accounts Receivable GL account · Vendor receivable GL account · Manual Posting GL account | Enables the 4th account element (irreversible); how far back periods may be reopened (0 = current year only); EOD posted-transaction report/register behaviour; the default accounts seeded into auto-generated distributions | `02-general-ledger/004`, `02-general-ledger/000`, `01-views-and-reports/020`, `01-views-and-reports/047`, `04-receivables/052`, `04-receivables/051` |
| **General Ledger Assigned Account Settings** | Revolving Credit Write-Offs (Revolving page) | Maps STORIS transaction classes to GL accounts (installment receivables, revolving write-offs, sales-tax adjustments). *GL User Permissions are not enforced here.* | `02-general-ledger/004`, `04-receivables/107`, `04-receivables/059`, `04-receivables/064` |
| **Company Settings** | **Retained Earnings account**; default bank | Where year-end P&L nets close to; per-company | `02-general-ledger/003`, `01-views-and-reports/080` |
| **GL Class / Sub-Class / Group Settings** | — | The three reporting-classification levels; available only under STORIS GL Processing | `02-general-ledger/004` |
| **GL Account Settings** (a.k.a. GL Account Number Settings) | Sub-Account field; Cost Center field | Links sub-accounts and cost centers to a root account | `01-views-and-reports/011`, `01-views-and-reports/013` |
| **GL Cost Center Settings** | — | Creates cost centers (the STORIS counterpart of a QuickBooks Class) | `00-accounting/003` |
| **General Ledger User Permissions** | **No Inquiry Allowed** · **Inquiry/Report Restrictions** section | Entry/inquiry restriction by any combination of root account, sub-account, cost center. Not company. Not enforced in control/settings routines or Report Suspended Postings. | `02-general-ledger/004`, `01-views-and-reports/023`, `01-views-and-reports/020`, `01-views-and-reports/058` |
| **TPA Control Settings** | **Summarize GL Postings** | Whether GL batches are summarized (and given a summary batch number) before transmission | `01-views-and-reports/092` |
| **Third-Party Accounting Control Settings** | Generic tab | Blocks users deleting AP bills already transmitted to TPA | `00-accounting/009` |
| **Create a User/Group Actions – Payables Security** | **Delete payable bills after third party accounting transmission**; Change transaction entry date for new payable bills | Per-user delete/date-override rights over transmitted AP bills | `00-accounting/009`, `03-payables/031` |
| **Extended Security** / **System Security** | **Edit automated general ledger postings** | Right to alter auto-generated GL distributions | `04-receivables/052`, `04-receivables/051` |
| **Costing Control Settings** | Inventory-G/L Reconciliation Audit; Inventory G/L Recon EOD Report | Whether inventory-to-GL reconciliation data is collected and reported at EOD | `01-views-and-reports/051` |
| **Payables Control Settings** | default bank; Next Number; Bill Aging Days/Method | Peripheral to GL but drives AP-side postings | `03-payables/031`, `01-views-and-reports/080` |

---

## 9. Menu paths (the 20 in-scope articles)

| # | File | `Access` path as stated |
|---|---|---|
| 1 | `02-general-ledger/000-close-update-fiscal-periods.md` | Accounting > General Ledger > Fiscal Periods > Close/Update Fiscal Periods |
| 2 | `02-general-ledger/001-create-a-recurring-journal-entry.md` | Accounting > General Ledger > Recurring Entries > Create a Recurring Journal Entry |
| 3 | `02-general-ledger/002-create-an-account-budget.md` | Accounting > General Ledger > Account Budgets > Create an Account Budget |
| 4 | `02-general-ledger/003-end-of-year-overview.md` | *(no Access section — narrative overview)* |
| 5 | `02-general-ledger/004-general-ledger-processing-overview.md` | *(no Access section — narrative overview)* |
| 6 | `02-general-ledger/005-gl-batch-import-screen.md` | Actions button on the Post/Update a Journal Entry routine |
| 7 | `02-general-ledger/006-gl-cost-center-distribution-screen.md` | Via the GL List Entry Window (← GL Distribution Screen ← Enter/Update Individual Vendor Invoice, when saving after entering an expense invoice) |
| 8 | `02-general-ledger/007-import-an-existing-account-budget.md` | Accounting > General Ledger > Account Budgets > Import an Existing Account Budget |
| 9 | `02-general-ledger/008-import-journal-postings.md` | Accounting > General Ledger > Import Journal Postings |
| 10 | `02-general-ledger/009-post-update-a-journal-entry.md` | Accounting > General Ledger > Post/Update a Journal Entry **and** Accounting > Third Party Accounting > General Ledger > Post/Update a Journal Entry *(article header also carries version markers "11.0 / 10.8")* |
| 11 | `00-accounting/000-bad-tpa-posting-selection-screen.md` | Action button at the Batch field in Post/Update a Journal Entry |
| 12 | `00-accounting/001-correct-transmission-errors.md` | Accounting > Third Party Accounting > General Ledger > Correct Transmission Errors |
| 13 | `00-accounting/002-import-vendors-from-third-party-accounting.md` | Accounting > Third Party Accounting > General Ledger > Import Vendors from Third-Party Accounting |
| 14 | `00-accounting/003-log-report-errors.md` | *(no Access section — message catalogue for Report on Third Party Accounting Transmission Errors)* |
| 15 | `00-accounting/004-report-add-on-distribution-analysis.md` | Merchandising and Distribution > Inventory > Inventory Management > Inventory Costing > Reports > Report Add-on Distribution Analysis |
| 16 | `00-accounting/005-report-pre-approval-credit-statistics.md` | *(Access heading present but no path given)* |
| 17 | `00-accounting/006-tpa-account-settings.md` | Accounting > Third Party Accounting > General Ledger > General Ledger Settings > Account Settings |
| 18 | `00-accounting/007-tpa-ap-bill-gl-postings-screen.md` | Select Bill Payments or Bill Credits at the Posting Type field in Correct Transmission Errors |
| 19 | `00-accounting/008-transfer-third-party-accounting-information.md` | Accounting > Third Party Accounting > General Ledger > Transfer Third Party Accounting Information |
| 20 | `00-accounting/009-update-approved-customer-refunds.md` | Accounting > Third Party Accounting > Payables > Update Approved Customer Refunds **and** Accounting > Third Party Accounting > General Ledger > Update Approved Customer Refunds |

Supporting (out-of-scope but cited above): `Accounting > General Ledger > Additional GL Reports > {Generate a Trial Balance, Report End of Year GL Adjustments, Report Suspended Postings, Report Distribution to General Ledger, Report Reconciliation of Inventory to GL values}`; `Accounting > General Ledger > {View Account Activity, View Individual Postings, Report Posted Transactions, Report Analysis of Account Activity}`; `Accounting > General Ledger > GL Views > View Multiple Postings`; `Accounting > General Ledger > Account Budgets > {View an Existing Account Budget, Report Account Budgeted Variances}`; `Accounting > General Ledger > Recurring Entries > Report Recurring Journal Entries`.

---

## 10. Cutover implications

**D = decision, B = build/config, V = verification.**

1. **(D) Native GL vs TPA — decide first, it is irreversible in practice.** The mode choice gates which menu tree exists, whether Debit/Credit are keyable, and whether a chart of accounts is maintained in STORIS or mirrored from an external package (`02-general-ledger/004`). *"you cannot mix elements of each."* If LA Mattress keeps an external package, everything in §7 becomes the integration surface; if not, §7 is dead code.
2. **(D) Sub-accounts: one-way door.** *"You must activate the sub-account feature via the General Ledger Control Settings, and once you set it you cannot change it"* (`02-general-ledger/004`). Decide whether the legacy chart needs a 4th dimension **before** go-live. INFERRED: retro-fitting a sub-account later means a full chart rebuild and re-mapping of history.
3. **(B) Chart-of-accounts mapping — three or four columns, not one.** Legacy account → STORIS `Company + Root + [Sub] + Cost Center`. Watch the delimiter rule: dashes are fine, underscores/letters/digits are not usable as delimiters (`02-general-ledger/004`). No length limits are documented, so the mapping spreadsheet needs a validated max-length assumption confirmed with STORIS.
4. **(B) Cost centers are the store/location dimension.** They are associated with regions and districts through locations (`01-views-and-reports/011`), and under QuickBooks TPA each one must have a matching **Class** (`00-accounting/003`). Build the location↔cost-center table before the first transfer, or every transmission throws "Cost center missing in QuickBooks."
5. **(B) Classification hierarchy.** Class / Sub-Class / Group drive every financial-statement sort (`02-general-ledger/004`, `01-views-and-reports/004`). These are the only grouping levers; if the legacy ERP had more reporting tiers, they have to collapse into three.
6. **(B) Opening balances.** The documented bulk load path is **Import Journal Postings** — tab-delimited .txt from the STORIS worksheet, data starting row 3, batched by company+source+date, capped at **$99,999,999.99 per entry** (`02-general-ledger/008`). INFERRED: an opening-balance load will need to be split by source/date to control batch granularity, and any single balance ≥ $100M must be split across lines.
7. **(B) Import error strategy.** Fatal errors abort the entire file; non-fatal errors abort unless *Post if Non-Fatal Errors Found* is checked, and flagged batches do not post until fixed via the **GL Invalid Transaction Report** loop (`02-general-ledger/008`). Decide policy: pre-validate accounts and sources against `GL.ACCOUNT` / `GL.SOURCE` before submission rather than relying on the non-fatal flag.
8. **(D) Historical periods.** Period tables must exist for every fiscal year you want to load, budget, or report on (`02-general-ledger/002`, `009`). Decide how many prior years to stand up. Note the asymmetry: GL periods can be reopened (subject to **Allow Reopen Years**) but **sales periods can never be reopened once closed** (`02-general-ledger/000`) — so the sales-side close order during cutover is unrecoverable.
9. **(D) Allow Reopen Years value.** Zero means current year only. Set it deliberately for the cutover window, because reopening cascades forward through every subsequent closed period (`02-general-ledger/000`).
10. **(V) Period-close ordering rule.** A GL period cannot close until its sales period is closed; closing period 13 closes the year; prior-year period 13 never closes implicitly (`02-general-ledger/000`, `02-general-ledger/003`). Encode this as a runbook, not tribal knowledge.
11. **(B) Retained earnings account** must be populated in **Company Settings** per company before the first year-end (`02-general-ledger/003`), and every legacy account must be correctly typed as P&L vs balance sheet — the close sums *all* P&L accounts into it. INFERRED: the P&L-vs-balance-sheet determination presumably comes from the Class/Sub-Class/Group classification, but the corpus never says so.
12. **(D) In-flight batches at cutover.** Two states must be drained before the legacy system is retired: **suspended postings** (Invalid and Hold — `01-views-and-reports/058`) and, under TPA, **rejected/bad TPA batches** (`00-accounting/001`). Also drain **open freight batches**, which the period close explicitly checks for (`02-general-ledger/003`).
13. **(B) Recurring journals must be re-created, not migrated.** No import path exists for recurring journal definitions — only the interactive Create a Recurring Journal Entry screen. Definition numbers are a separate number series from batch numbers (`02-general-ledger/001`). Inventory the legacy recurring entries and map each to a Posting Frequency of P / Q / 1–13; note **P skips period 13**.
14. **(B) Budgets.** One import file per fiscal year, 13 columns, account-with-company in column 1, 12 amounts — **no period-13 budget column** (`02-general-ledger/007`). Decide whether the legacy budget has a 13th-period figure and where it goes.
15. **(D) Vendor master direction.** STORIS recommends creating vendors in STORIS and pushing them out. The QuickBooks pull is **destructive and single-use** and generates 5-char keys (`3 chars of company name + 00`) that will not match the external system's keys (`00-accounting/002`). If LA Mattress has existing vendor codes in the legacy ERP, the generated key scheme will collide with them — plan the vendor-code strategy explicitly.
16. **(B) TPA reference-data pre-load (if TPA).** Terms codes, vendors, GL accounts, and cost centers/Classes must exist on **both** sides before the first transmission, or the error log fills with the four mapping failures in §7.4 (`00-accounting/003`).
17. **(D) Summarize GL Postings.** Deciding to summarize before transmission changes the granularity of everything the external package sees and introduces summary batch numbers as a second reconciliation key (`01-views-and-reports/092`). Decide before the first close, not after.
18. **(V) TPA operational fragility to design around.** Transfers require an open QuickBooks session on the right company or nothing posts (`00-accounting/008`); the TPA AP Bill repair screen can only fix postings *to the default account* (`00-accounting/007`); and Generic Interface deletes are not two-phase — STORIS deletes its side and trusts you to delete theirs (`00-accounting/009`). INFERRED: any automation around TPA transfers needs an out-of-band reconciliation job, because the interface has no documented idempotency or acknowledgement beyond the error flag and the TPA # field.
19. **(B) Default-account hygiene.** `$$$$$-NN` is the unmapped-account marker and blocks saves (`04-receivables/052`). Any gap in the mapping tables surfaces here first — worth a pre-go-live sweep query.
20. **(B) GL User Permissions model.** Restrictions attach to root account / sub-account / cost center but never to company, and do not cover settings screens (`02-general-ledger/004`). If store-level segregation of duties is a requirement, cost center is the only lever.

---

## Open questions / not documented here

1. **Field lengths and formats.** No stated length for company code, root account, sub-account, or cost center; no stated total account-string length; no character-set rule for cost centers (only root accounts are described as "any alphanumeric"). Only the TPA account **Description** has a documented cap (30 chars).
2. **Column layouts for two of the three GL import worksheets.** Only the budget import layout is specified (13 columns). Neither **GL Batch Import** (`005`) nor **Import Journal Postings** (`008`) documents its column order, field names, date format, or how debit vs credit is expressed — the articles only say "each spreadsheet row contains the information required to generate a posting to an individual account." The actual worksheet must be obtained from STORIS.
3. **Contradiction in Import Journal Postings error classes.** *"The source does not exist on the GL.SOURCE file"* is listed as **fatal**, and *"The source does not exist in the GL.SOURCE file"* is listed as **non-fatal**, in the same article (`02-general-ledger/008`). Also, "transaction date is for a closed period" appears twice in the fatal list. Needs vendor clarification before building a pre-validator.
4. **"STORIS Accounting" is used two ways.** In `00-accounting/009` and `00-accounting/008` it names a third-party package option alongside QuickBooks and Generic Interface; elsewhere the corpus contrasts "STORIS GL Processing" with "TPA". Whether "STORIS Accounting" is the native module, a separate STORIS-hosted accounting product, or a TPA target needs confirmation — it changes what the "not available if using STORIS Accounting" restrictions mean.
5. **Generic Interface specification.** Named as a supported TPA target but no transport, file format, schema, or acknowledgement protocol is described anywhere in the corpus.
6. **Where the "no cost center indicator" literal is defined**, and how it interacts with the `$$$$$-NN` marker.
7. **Fiscal calendar definition screen.** Period tables are referenced constantly but the routine that *creates* them (period start/end dates, 4-4-5 vs calendar vs weekly, how period 13 is dated) is not in this corpus.
8. **Multi-company setup.** Multi Company Processing is referenced as a General System Control Settings flag on the Advanced Setting tab, but company creation, inter-company posting, and consolidated reporting are undocumented here.
9. **P&L vs balance-sheet account typing.** Year-end close *"adds the total from all Profit & Loss (P&L) accounts"* — but nothing states where an account is designated as P&L.
10. **GL Invalid Transaction Report** and **Report on Third Party Accounting Transmission Errors** are both referenced as the recovery reports but neither has an article in this corpus.
11. **TPA Setup Using Defaults** — referenced twice (`00-accounting/003`, `00-accounting/008`) as the authoritative vendor/TPA setup document. Not present; obtain it before any TPA build.
12. **Batch numbering.** Batch numbers, recurring-journal definition numbers, and TPA reference numbers are all distinct series, but no format, range, or next-number setting is documented for any of them.
13. **Transaction volume / performance.** No stated limits on rows per import file, batch size, or transmission frequency — relevant if LA Mattress transmits daily sales at line-item granularity.
14. **Audit trail on reopen.** The **GL Reopened** flag exists per period, but nothing states whether reopen/close events are logged with operator and timestamp.
