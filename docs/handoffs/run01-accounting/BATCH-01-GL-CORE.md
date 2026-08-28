# Run 01 — Accounting — Batch 1: GL Core / Posting Table / Period Control

10 articles. This batch was scoped to answer run-card questions 1–4.
Two of the ten sit outside the Accounting section (System Administration) but are
directly linked from `General Ledger Processing Overview` and carry the answer to
question 1 — included per handoff rule 2 (follow the links).

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | General Ledger Processing Overview | /articles/15186368847124-General-Ledger-Processing-Overview | EXTRACTED |
| 2 | Post/Update a Journal Entry | /articles/15186352935316-Post-Update-a-Journal-Entry | EXTRACTED |
| 3 | Close/Update Fiscal Periods | /articles/15186352924564-Close-Update-Fiscal-Periods | EXTRACTED |
| 4 | End of Year Overview | /articles/50891164193940-End-of-Year-Overview | EXTRACTED |
| 5 | GL Cost Center Distribution Screen | /articles/15186368710804-GL-Cost-Center-Distribution-Screen | EXTRACTED |
| 6 | Report Distribution to General Ledger | /articles/15202676863764-Report-Distribution-to-General-Ledger | EXTRACTED |
| 7 | Report Suspended Postings | /articles/15203214448020-Report-Suspended-Postings | EXTRACTED |
| 8 | Suspended Postings Inquiry | /articles/15294767782036-Suspended-Postings-Inquiry | EXTRACTED |
| 9 | General Ledger Assigned Account Settings *(System Administration → Customer Settings)* | /articles/15242612074516-General-Ledger-Assigned-Account-Settings | EXTRACTED |
| 10 | General Ledger Control Settings *(System Administration → System Control Settings)* | /articles/15186501980436-General-Ledger-Control-Settings | EXTRACTED |

Newly discovered, queued for later batches: `General Ledger User Permissions`,
`GL Source Settings`, `GL Class Settings`, `GL Sub-Class Settings`, `GL Group Settings`,
`GL Account Entry Screen`, `Account Number Entry Screen`, `Company Settings`,
`View Open Freight Batches`, `Bank Settings`, `Third Party Accounting FAQs`,
`Accounts Payable Processing Overview`, `Report End of Year GL Adjustments`,
`Report Reconciliation of Inventory to GL Values`, `Report Posted Transactions`,
`Financing Payment Plan Settings`, `Advanced Customer Settings` (Point of Sale tab),
`Petty Cash Disbursement`, `Miscellaneous Fee Settings`, `Sales Tax Settings`,
`Invoice Charge Settings`, `General Ledger Accounts` (Installment Receivables Payment Plan Settings).

---

## B. Wiring findings

### FINDING 1 — The posting table is a 3-to-4 level fall-through hierarchy, not a mapping table
Trigger:    Any module transaction that must produce a GL posting
Producer:   `General Ledger Assigned Account Settings` (System Administration → Customer Settings)
Consumers:
  - Resolution order for every account: module-specific settings file → the module tab in
    `General Ledger Assigned Account Settings` → `GL Account Number Default` in `General Ledger Control Settings`
Payload:    company · root account · (optional sub-account) · cost center
Invariant:  A posting always resolves to *some* account — there is no unmapped state at the account level
Config:     `GL Account Number Default`, `General Cost Center Indicator`, `Use Sub-Accounts`, `GL Account Number Separator`
Permission: GL Account Staff Security restricts account *entry and inquiry*, not posting
Evidence:   "If GL account numbers for particular accounting categories are not found at the previous level in the account hierarchy, the system uses the default account numbers specified here." — General Ledger Assigned Account Settings, /articles/15242612074516
            "If the system finds no account number at any of these levels, it uses the GL Account Number Default on the General tab of this control file." — General Ledger Control Settings, /articles/15186501980436
Maps to:    **W-036 — CONTRADICTED**, **W-068 — CONTRADICTED**

> This is the single most important result of the batch. Our contract `W-036` asserts
> "nothing falls through to a default account." STORIS does exactly the opposite, by design,
> at every level. `W-068` ("one definition of the GL account for a transaction") is likewise
> false: there are three or four definitions and the winner is positional.

Worked example STORIS gives, verbatim in structure — finance receivables usage fee:
1. `Usage Fee GLA` field in `Financing Payment Plan Settings`
2. `Usage Fee Default` on the Finance Receivable tab of `General Ledger Assigned Account Settings`
3. `GL Account Number Default` in `General Ledger Control Settings`

Other overrides explicitly named as sitting *above* the defaults:
- `Inventory` field in **Product Group** and **Product Category** overrides `Inventory Value`
- `Cost of Sales` field in Product Group / Product Category overrides `Inventory COS`
- `Inventory Adjustment` field in Product Group / Product Category overrides `Inventory Adjustment`
- `General Ledger Account` in the **Sales Tax file** per jurisdiction overrides `Sales Tax Payable (STORIS)`
- **Gift Certificate Payment Type** file overrides the `Gift Certificate` account
- `Miscellaneous Fee Settings` overrides `Miscellaneous Fee/Charge`
- Both AP "Paid with" accounts fall back to `Bank AP Cash`

### FINDING 2 — Cost center is derived from the *customer's* assigned location, not the transacting location
Trigger:    Any transaction or AR balance that posts with a cost center
Producer:   `Advanced Customer Settings` → Point of Sale tab → `Store Assignment`
Consumers:  GL posting cost center element; AR balances
Invariant:  Cost center follows customer assignment regardless of where the event happened
Evidence:   "STORIS determines the cost center for transactions and AR balances based on the location assigned to the customer, regardless of the location at which transactions occur." — General Ledger Assigned Account Settings, /articles/15242612074516
Maps to:    **W-052 — CONTRADICTED (partially)**

> `W-052` says location context propagates from the operating location. For the GL segment it does not —
> it comes off the customer master. Two stores selling to the same customer post to the same cost center.

### FINDING 3 — Wildcard cost centers are required for gift-certificate accounts under multi-company
Trigger:    Gift certificate purchase or redemption in a multi-company install
Producer:   `General Ledger Assigned Account Settings` → Accounts Receivable tab
Consumers:  `Gift Certificate`, `Gift Certificate Adjustments`, `Gift Certificate In-Store Only` accounts
Invariant:  GL postings balance by company only if these three accounts are wildcarded
Config:     wildcard in place of cost center
Evidence:   "Warning! Balancing by company WILL NOT be possible if not wildcarding the NNNN account for a multi-company GL" — General Ledger Assigned Account Settings, /articles/15242612074516
Maps to:    NEW

> The system *warns* and lets you proceed (options are OK or Abort). A misconfiguration here
> silently unbalances the company-level GL. Note also the account must post to the store that
> *sold* the certificate, not the one that redeemed it.

### FINDING 4 — Period close is a hard gate on posting, and cascades
Trigger:    `Close/Update Fiscal Periods` → Period Close
Producer:   GL period control
Consumers:  every posting path
Invariant:  "The GL Fiscal Period Close process disallows any additional postings to the fiscal period you select for closing."
Sequencing: a GL period may be closed only if **the sales period has been closed first**
Cascade:    closing period N closes all prior open periods (warning, proceedable)
Config:     `Allow Reopen Years` in `General Ledger Control Settings` — 0 means current year only
Evidence:   "You can select any open period as long as the sales period has been closed." · "Closing a period with prior open periods results in all prior periods being closed. A warning message appears but you can proceed." — Close/Update Fiscal Periods, /articles/15186352924564
Maps to:    **W-037 — CONFIRMED**, **W-069 — CONFIRMED**

### FINDING 5 — Reopen is symmetric and also cascades
Trigger:    `Close/Update Fiscal Periods` → Period Reopen
Consumers:  reopening period N reopens all subsequent closed periods
Config:     `Allow Reopen Years` bounds how far back; check is "based on the most recent open year that has not been previously reopened, even if it occurs in the past"
Evidence:   "Re-opening a period with subsequent closed periods results in all subsequent periods being reopened." — Close/Update Fiscal Periods, /articles/15186352924564
Maps to:    **W-069 — CONFIRMED (extends it)**

### FINDING 6 — Period 13 is a real period and is the year-close latch
Trigger:    Fiscal year close
Invariant:  All 12 periods closed → period 13 must be **manually** closed → year is closed.
            Period 13 stays open even after period 1 of the next year is closed.
Payload:    End-of-year adjustments post to period 13 with **Type Y (End of Year Journal Entry)** and **no date**
Evidence:   "You must manually close period 13 to close the year, even if you close period 1 in the following year period 13 will remain open until it is closed." — End of Year Overview, /articles/50891164193940
Maps to:    NEW (extends W-037)

### FINDING 7 — Retained earnings roll is automatic on the twelfth close
Trigger:    Closing the 12th period of a fiscal year
Producer:   period close
Consumers:  `Retained Earnings` account specified in **Company Settings**
Payload:    ending balance of the closing year in that account + total of all P&L accounts for the year
Invariant:  all P&L accounts reset to zero beginning balance in the new year
Evidence:   "Since all P&L accounts reset to a zero beginning balance in the new year, their net activity is closed into retained earnings." — End of Year Overview, /articles/50891164193940
Maps to:    NEW

### FINDING 8 — Failed postings go to a *suspended batch queue*, not a suspense account
Trigger:    A GL post record that cannot be posted
Producer:   any posting module
Consumers:  `Report Suspended Postings` · `Suspended Postings Inquiry` · corrected in `Post/Update a Journal Entry`
Statuses:   suspension reasons split at least into **invalid transactions** and **hold transactions**
            (report sorts and page-breaks on GL source for invalid, on operator for hold)
Invariant:  "For invalid transactions, all reasons print beneath each batch"
Evidence:   "The Report Suspended Postings lists GL post records that have not been posted. To correct suspended batches, use the Post/Update a Journal Entry routine." — General Ledger Processing Overview, /articles/15186368847124
Maps to:    NEW — **this is the answer to run-card question 2**

> Answer to Q2: an unpostable transaction is neither blocked at source nor silently defaulted —
> it lands in a suspended batch that a human must repair in `Post/Update a Journal Entry`.
> Note that account *mapping* never fails (Finding 1), so suspension is about batch/period/validity,
> not about a missing account. The two mechanisms are independent.

### FINDING 9 — Period close pre-checks open freight batches and unposted transactions
Trigger:    Attempting a period close
Consumers:  `View Open Freight Batches` (reached from `Receive a Purchase Order with a Separate Freight Bill`) · `Report Suspended Postings`
Sequencing: system notifies before closing; open freight batches must be closed in that process; suspended postings corrected in `Post/Update a Journal Entry`
Evidence:   "Before closing the period the system will notify you that it is checking for any open freight batches and unposted transactions prior to the first day of the next period." — End of Year Overview, /articles/50891164193940
Maps to:    **W-037 — CONFIRMED (extends it)**

### FINDING 10 — Received-not-invoiced is `Received Not Recorded`, and it is reversed, not matched
Trigger:    PO receipt
Producer:   PO receiving
Consumers:  `Received Not Recorded` account (AP tab) is credited at receipt; the AP bill process **reverses that posting**
Evidence:   "This is the account that merchandise values are posted to upon receipt, before the AP bill process. Upon creating the AP bill, the previous posting to this account is reversed." — General Ledger Assigned Account Settings, /articles/15242612074516
Maps to:    **W-011 — CONFIRMED**, **W-012 — CONFIRMED in mechanism, ambiguous on variance**

> STORIS describes reversal, not three-way matching with a tolerance. No purchase price variance
> account appears on the AP tab. The nearest analogues are `Direct-Ship Value Difference`
> (PO vs AP bill price difference on direct ships) and, on the Inventory tab,
> `Cost Exceptions` (merchandise still owned) and `Valuation Difference` (merchandise no longer owned).
> **Where a standard PPV goes on a normal stock receipt is not documented here.** See section H.

### FINDING 11 — There is a full family of "Not Recorded" clearing accounts, one per flow
Trigger:    various
Consumers:
  - `Received Not Recorded` — stock receipt → reversed at AP bill
  - `Returned Not Recorded` — RTV, before vendor credit → reversed at credit AP bill
  - `Delivered Not Recorded` — direct-ship order completion, before paying vendor; credited at sales order completion, debited when AP bill processed; **mandatory if Direct Shipments is used**
  - `Exported Not Recorded` — third-party check printing; `Export Payable Checks` debits it / credits AP, `Import Completed Checks` credits it / debits AP
  - `Recorded Not Received` — pending bill paid before receipt; debit offset to Cash in Bank credit, then credited on conversion to offset Inventory Value / Freight / Tax / Misc debits. **Always uses the no-cost-center indicator.**
  - `COM Value` — customer's own materials suspense; credited at warehouse receipt of finished goods, debited through AP bill
  - `Protection Plans Not Recorded`
Evidence:   see each field description — General Ledger Assigned Account Settings, /articles/15242612074516
Maps to:    **W-044 — partially CONFIRMED** (Returned Not Recorded is the RTV accrual), rest **NEW**

### FINDING 12 — Deposits are a liability account released implicitly, mechanism not stated here
Trigger:    Customer deposit
Consumers:  `Deposit Liability` account (AR tab)
Evidence:   field `Deposit Liability` — General Ledger Assigned Account Settings, /articles/15242612074516
Maps to:    **W-033 — CONFIRMED that the account exists; the release trigger is NOT DOCUMENTED IN THIS BATCH**

### FINDING 13 — COGS posts at sales order completion from the Inventory COS account
Trigger:    Sales order completion
Consumers:  `Inventory COS` debited "in order to record the cost of merchandise"; `Inventory Value` credited "through programs such as order completion"
Overrides:  Product Group / Product Category `Cost of Sales`
Evidence:   "This account debits during sales order completion in order to record the cost of merchandise." — General Ledger Assigned Account Settings, /articles/15242612074516
Maps to:    **W-013 — CONFIRMED on timing; the "same cost that left inventory" clause is NOT stated**

### FINDING 14 — Landed cost is a paired asset/liability per add-on, resolved across three events
Trigger:    warehouse receipt → sales order completion → AP bill entry
Consumers:  `Landed Freight Asset` (debit at receipt, credit at order completion) · `Landed Freight Liability` (credit at receipt, debit at AP bill entry) · same pattern for `Landed Add-On 1–4 Asset/Liability` (Importing tab)
Config:     `Freight` on the AP tab is "either debited to expense or to liability if using landed costing"
Evidence:   "This account is debited during warehouse receipts and credited during sales order completion." / "This account is credited during warehouse receipts and debited during AP bill entry." — General Ledger Assigned Account Settings, /articles/15242612074516
Maps to:    NEW — relates to `W-061`

### FINDING 15 — Cash drawer over/short posts to one account from two different processes
Trigger:    Cash balancing where a drawer fails to balance; also `Reconcile Cash Drawer`
Consumers:  `Over or Short` account (Cash Balancing tab), debited or credited with the difference
Evidence:   "During the cash balancing process, if a drawer fails to balance, the system debits or credits this account with the difference. The system also posts to this account during the Reconcile Cash Drawer process." — General Ledger Assigned Account Settings, /articles/15242612074516
Maps to:    **W-034 — partially CONFIRMED** (drawer close leg only)

### FINDING 16 — Petty cash is a configurable 60-slot prompt→account map living on the same tab
Trigger:    Petty cash disbursement from `Balance a Cash Drawer` or `Balance Approval by Manager`
Consumers:  up to 60 `Prompt` / `GL Account` pairs
Evidence:   "Up to 60 sixty prompts and corresponding GL accounts can be entered on this screen." — General Ledger Assigned Account Settings, /articles/15242612074516
Maps to:    NEW

### FINDING 17 — Journal batches carry cross-module reference pointers
Trigger:    GL batch creation
Producer:   `Post/Update a Journal Entry` → Header tab → References
Payload:    `Primary Type` + `Number`, `Secondary Type` + `Number` — "primary references are often used for documents and the secondary for customers, although this is not required"
Evidence:   "Use these optional fields to specify references to other modules associated with this GL batch." — Post/Update a Journal Entry, /articles/15186352935316
Maps to:    **W-054 — partially relevant** (the archive link is by convention, not enforced)

> Note the "although this is not required" — the audit trail back from a GL batch to its
> source document is **conventional, not structural**. That is a design decision we should
> not copy. Our own posting rows should carry a typed, mandatory source reference.

### FINDING 18 — GL permissions are enforced unevenly and by account element
Trigger:    Editing or viewing GL postings
Producer:   `General Ledger User Permissions`
Consumers:  restrict entry and/or inquiry "based on any combination of root account, sub-account, and cost center"
Exclusions (all quoted): GL User Permissions **not enforced** in `General Ledger Control Settings` or `General Ledger Assigned Account Settings`; "GL staff security does not apply to control or settings routines"; "GL security is not enforced in this routine" (`Report Suspended Postings`); "Standard location restrictions, including Regional Processing, do not apply to the STORIS General Ledger Processing module"
Evidence:   "NOTE: GL User Permissions are not enforced in the above processes." — General Ledger Processing Overview, /articles/15186368847124
Maps to:    **W-050 — CONTRADICTED**

> Direct contradiction of "one permission check governing every path." STORIS has at least four
> documented carve-outs in a single module. Every one of them is a hole we should close, not copy.

---

## C. Screen and field inventory

**General Ledger Assigned Account Settings** — tabs: Accounts Payable, Accounts Receivable, Cash Balancing, Finance Receivable, Inventory, Sales, Service, Vendor Receivable, Multi-Company, Importing, Purchasing
- *Accounts Payable:* Accounts Payable · Sales Tax · Terms Discount · Freight · Miscellaneous Debit · Received Not Recorded · Returned Not Recorded · Delivered Not Recorded · Exported Not Recorded · Direct-Ship Value Difference · Non-Inventory · COM Value · Customer Refunds Payable · Paid with Cash · Paid with Credit Card · EFT Payment · Recorded Not Received · Virtual Card Payment · Intangible Asset - Protection Plans · Protection Plans Not Recorded
- *Accounts Receivable:* Accounts Receivable · Accounts Receivable Adjustments · Bad Debts · Bad Debt Repossession · Builder Allowance · Charge off Overpayments · Deposit Liability · Gift Certificate · Gift Certificate Adjustments · Gift Certificate In-Store Only · Gift Certificate Rewards · Installment Adjustments · Installment Deferment Fees · Installment Late Fees · Installment Miscellaneous Fees · NSF Check Charge · Manual Posting · Revolving Adjustments · Revolving Late Fees · Revolving Credit Write-Offs · Service Charges · Terms Discount – COS · Sales Tax Adjustments for Charge-offs
- *Cash Balancing:* Over or Short · Prompt · GL Account (×60)
- *Finance Receivables:* Finance Receivable · Adjustments · Usage Fee Default · Customer Payments · On Account Funds
- *Inventory:* Inventory Transfers · Inventory Value · Inventory COS · Inventory Adjustment · Valuation Difference · RTV Valuation Difference · Cost Exceptions · Landed Freight Asset · Landed Freight Liability · As-Is Write-off · Vendor Chargeback Adjustment · Trailing Credit
- *Sales:* Sales Postings · Posting Method · Sales · Customer Returns · Exchange Sale · Exchange Return · Debit Dollar Adjustment · Credit Dollar Adjustment · Sales Tax Payable (STORIS) · Customer Discount · Delivery Charge · Installation Charge · Miscellaneous Fee/Charge · Repossession Sales · Repossession Cost of Sales · Sales Line Discount · Sales Line Discount Recovery · Protection Plan Sales · Protection Plan Cost of Sales
- *Service:* Part Sales · Part Costs of Sales · Labor Sales · Labor Cost Of Sales · Labor Costs Value · Charge Sales · Charge Cost Of Sales · Charge Costs Value · Receivables from Vendor
- *Vendor Receivables:* Vendor Receivable · Adjustments · Manual Post Offset
- *Multi-Company:* Multi-Company Due To · Multi-Company Due From
- *Importing:* Landed Add-On 1–4 Asset · Landed Add-On 1–4 Liability
- *Purchasing:* Rebate Revenue · Rebate Contra-Revenue

**General Ledger Control Settings** — tabs: General, Advanced
- *General:* Next GL Batch Number · GL Account Number Separator · GL Account Number Default · Company Code Length · Cost Center Length · General Cost Center Indicator · Maintain History Years · Create Posting Document Comments · Post GL Account Transfers
- *Advanced:* GL Account Format · Root Account Mask · Use Sub-Accounts · Sub-Account Mask · General Sub-Account Indicator · End-of-Day Posted Transactions · Allow Reopen Years

**Post/Update a Journal Entry** — tabs: Header, Detail Postings. Modes: Maintenance, Inquiry
- *Header area:* Batch · TPA # · Status/Mode
- *Header tab:* Company · Type · Adjust Year · Date · Status · Source · Operator · Created · References (Primary Type, Number, Secondary Type, Number) · Comment · Actions
- *Detail Postings tab:* Account · Remark · Debit · Credit · Debit Total · Credit Total · Message · Actions
- Read-only twin: **View Individual Postings**

**Close/Update Fiscal Periods** — Company · Fiscal Year · Action · Fiscal Period

**GL Cost Center Distribution Screen** — Cost Center · Percentage (must total 100%)

**Report Distribution to General Ledger** — Company · Date Code · Starting Post Date · Ending Post Date · Account Field · Sub-Account Field · Cost Center Field · Break-On Element · Summary Only · Include Detail Remarks · Send Output to · Export Path

**Report Suspended Postings** — Company · Reason · Source · Operator · Send Output to · Export Path

**Suspended Postings Inquiry** — Status

---

## D. Control settings catalog

| Setting | Lives in | What it changes | Scope |
|---|---|---|---|
| GL module active | General System Control Settings | Switches between STORIS GL Processing and TPA. Cannot be hybrid. | System |
| GL Account Number Default | General Ledger Control Settings → General | Terminal fallback account when no level of the hierarchy yields one | System |
| GL Account Number Separator | GL Control Settings → General | Delimiter. Cannot be `_`, a letter, or a number. Dashes recommended. | System |
| Company Code Length / Cost Center Length | GL Control Settings → General | Element widths. Cost center max 4; whole account max 21 chars | System |
| General Cost Center Indicator | GL Control Settings → General | The "no cost center" token, required by some AP accounts | System |
| Next GL Batch Number | GL Control Settings → General | Batch numbering sequence | System |
| Maintain History Years | GL Control Settings → General | Retention | System |
| Create Posting Document Comments | GL Control Settings → General | (effect not stated) | System |
| Post GL Account Transfers | GL Control Settings → General | (effect not stated) | System |
| Use Sub-Accounts | GL Control Settings → Advanced | Adds a 4th element. **Once set it cannot be changed.** | System, irreversible |
| Root Account Mask / Sub-Account Mask | GL Control Settings → Advanced | Entry masks; combined parent length ≤ 16 | System |
| General Sub-Account Indicator | GL Control Settings → Advanced | (analogue of the cost center indicator) | System |
| End-of-Day Posted Transactions | GL Control Settings → Advanced | (effect not stated) | System |
| Allow Reopen Years | GL Control Settings → Advanced | How many years back a period may be reopened; 0 = current year only | System |
| Retained Earnings account | Company Settings | Target of the year-end P&L roll | Company |
| Posting Method (Transactional Post Method) | GL Assigned Account Settings → Sales | If set to Transactional, per-Group/Category sales accounts are unavailable | System |
| Store Assignment | Advanced Customer Settings → Point of Sale | Determines the cost center for that customer's transactions and AR | Customer |
| Direct Shipments feature | (not named) | Makes `Delivered Not Recorded` and `Direct-Ship Value Difference` mandatory | System |
| Vendor Receivables module active | (not named) | Makes the Vendor Receivable accounts mandatory | System |

---

## E. Security permissions catalog

| Permission | Gates | Notes |
|---|---|---|
| General Ledger User Permissions | Entry and/or inquiry of GL account information, "based on any combination of root account, sub-account, and cost center" | **Not enforced** in GL Control Settings, GL Assigned Account Settings, or any control/settings routine |
| GL Account Staff Security | Account Field / Sub-Account Field / Cost Center Field on `Report Distribution to General Ledger` | Restricts report parameters |
| (implicit) entry permission to an account | Editing postings in `Post/Update a Journal Entry` | "you must have entry permissions to view the account(s) established in General Ledger User Permissions" |
| — | `Report Suspended Postings` | "GL security is not enforced in this routine" |
| — | Whole GL module | "Standard location restrictions, including Regional Processing, do not apply" |

---

## F. State machines and enumerations

**GL account structure** — Company · Root Account · [Sub-Account] · Cost Center.
Company element mask always two numeric characters, zero-filled. Parent (root+sub) ≤ 16 chars.
Cost center ≤ 4 chars. Whole account ≤ 21 chars. Element prompt labels are not user-definable.

**Account classification** (3 levels, for reporting/inquiry): Class → Sub-Class → Group.
Maintained in `GL Class Settings`, `GL Sub-Class Settings`, `GL Group Settings`.

**Fiscal periods** — 12 periods plus **period 13** (year-end adjustments).
States: open / closed. Actions: Period Close, Period Reopen. Both cascade (prior periods on close,
subsequent on reopen), both warn and allow proceeding.

**Journal batch** — Status/Mode: Maintenance / Inquiry. Header carries Type, Status, Source, Operator.
Known Type value: **Y = End of Year Journal Entry**.

**Suspended posting reasons** — split into at least *invalid transactions* (sorted by GL source)
and *hold transactions* (sorted by operator). Full reason list not enumerated in the docs.

**Accounting method** — STORIS GL Processing **xor** Third Party Accounting (TPA, e.g. QuickBooks).
"you cannot mix elements of each to create a 'hybrid' accounting package."

**Report signing convention** — when credits mix with debits on a report they carry a preceding
negative sign; when credits are identified by a header (e.g. GL Recap) they are unsigned.

---

## G. Sequencing rules

1. Sales period must be closed **before** its GL period can be closed.
2. All 12 periods closed **before** period 13 can close the year; period 13 requires a manual close.
3. Period close checks for open freight batches and unposted transactions before proceeding.
4. Open freight batches must be closed in `View Open Freight Batches` (reached from
   `Receive a Purchase Order with a Separate Freight Bill`).
5. Suspended postings must be corrected in `Post/Update a Journal Entry`.
6. `Use Sub-Accounts` must be decided before go-live — it cannot be changed afterward.
7. `Export Payable Checks` must precede `Import Completed Checks` (they are the two halves of
   the `Exported Not Recorded` clearing pair).
8. `Report Distribution to General Ledger` also runs automatically during the End-of-Month cycle.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **Purchase price variance on a stock receipt.** `W-012` assumes a PPV account. STORIS documents
  reversal of `Received Not Recorded` at AP bill and gives no variance destination for ordinary
  stock. `Direct-Ship Value Difference`, `Cost Exceptions` and `Valuation Difference` exist but the
  docs never say which one absorbs a PO-vs-invoice price difference on a warehouse receipt. **Must resolve.**
- **`Posting Method` / "Transactional Post Method"** — named, never defined. The other value(s)
  are not given. This changes whether Group/Category-level sales accounts work at all.
- **Suspension reason enumeration** — `Reason` is a report filter with no documented value list.
- **`Create Posting Document Comments`, `Post GL Account Transfers`, `End-of-Day Posted Transactions`,
  `General Sub-Account Indicator`** — named with no description of effect.
- **Deposit release.** `Deposit Liability` exists; nothing in this batch says what event moves it
  to revenue, or what happens on cancellation or aging. `W-033` unresolved.
- **`Adjust Year` field** on the journal header — unexplained; presumably the period-13/prior-year selector.
- **Wildcard cost center semantics.** "Many GL accounts allow you to enter a wild card in place of
  the cost center" — the resolution rule for a wildcard at post time is never stated.
- **Multi-company Due To / Due From** — accounts exist; the trigger that generates an
  inter-company pair is not described.

**3. Inferences (not quotable, kept out of section B)**
- Account *mapping* cannot fail, so batch suspension is most likely driven by period state,
  out-of-balance debits/credits, or invalid account under security — not by a missing mapping.
  The docs do not say this.
- `Recorded Not Received` "always uses the no cost center indicator" implies pending-bill payments
  are company-level rather than store-level; not stated.
- The `Report Distribution to General Ledger` scope ("GL postings associated with AP bills")
  suggests it is an AP-only distribution report despite its general name.

---

## I. Unknown unknowns

Present in STORIS, absent from our target-contract list:

- **Third Party Accounting (TPA) mode** — an entire alternate accounting path with its own
  transmission, error correction, and bad-batch repair (`Bad TPA Posting Selection Screen`,
  `Correct Transmission Errors`, `Transfer Third Party Accounting Information`, `TPA Account Settings`,
  `TPA AP Bill GL Postings Screen`, `Import Vendors from Third Party Accounting`). Mutually exclusive with STORIS GL.
- **Multi-company / inter-company** — Due To / Due From accounts, per-company balancing,
  wildcard requirements, `Report Consolidated Trial Balance`.
- **GL account budgets** — `Create an Account Budget`, `Import an Existing Account Budget`,
  `View an Existing Account Budget`, `Report Account Budgeted Variances`.
- **Recurring journal entries** — `Create a Recurring Journal Entry`, `Report Recurring Journal Entries`.
- **Cost center distribution lists** — reusable percentage splits totalling 100%.
- **Account classification hierarchy** — Class / Sub-Class / Group, three reporting levels.
- **FGII data access tool** — spreadsheet-logic financial statement builder running against GL data on the host.
- **Landed costing with four generic add-ons** plus a dedicated Importing tab (broker fees, duties).
- **Protection plans as an intangible asset** — `Intangible Asset - Protection Plans`,
  `Protection Plans Not Recorded`, `Protection Plan Sales`, `Protection Plan Cost of Sales`.
- **Gift certificates as a four-account subsystem** including rewards-point issuance.
- **Repossession accounting** — `Repossession Sales`, `Repossession Cost of Sales`, `Bad Debt Repossession`.
- **Vendor Receivables as a distinct module** — bill backs, volume rebates, manual postings,
  its own trial balance and cash posting.
- **Virtual card payments** — `Virtual Card Payment` account, `Virtual Card Processing`, batch lookup.
- **Builder Allowance**, **Trailing Credit**, **Vendor Chargeback Adjustment**, **As-Is Write-off**,
  **Sales Line Discount Recovery**, **Terms Discount – COS**, **Charge off Overpayments** — each a
  posting concept we have no equivalent for.
- **Petty cash disbursement from the drawer** with 60 configurable expense prompts.
- **Multi-currency** — `Toggle Currency Action`, `Actual Exchange Rate Lookup` in Payables.
- **Service module GL** — parts / labor / charges each with sales, COS and value accounts.

---

## J. Glossary (this batch)

| STORIS term | Plain description |
|---|---|
| GL Assigned Account Settings | The module-by-module default account map; middle tier of the fallback hierarchy |
| GL Account Number Default | Terminal fallback account when nothing else resolves |
| Cost Center | 4th/last element of the account number; derived from the customer's assigned store |
| No Cost Center Indicator | Token meaning "this posting has no cost center"; set by `General Cost Center Indicator` |
| Wild card (cost center) | Placeholder allowing a cost center to be filled at post time |
| Root Account / Sub-Account | The two halves of the parent account element; sub-accounts are optional and irreversible once enabled |
| Class / Sub-Class / Group | Three-level reporting classification of GL accounts |
| Period 13 | Adjustment period after the 12 real periods; manual close latches the fiscal year |
| Type Y | End of Year Journal Entry batch type |
| Suspended posting | A GL post record that did not post; repaired in Post/Update a Journal Entry |
| Received Not Recorded (RNR) | Goods-received-not-invoiced accrual; reversed at AP bill |
| Returned Not Recorded | RTV accrual awaiting vendor credit |
| Delivered Not Recorded | Direct-ship revenue recognised before the vendor is paid |
| Exported Not Recorded | Clearing account for checks printed by a third-party package |
| Recorded Not Received | Pending bill paid before goods arrive |
| COM Value | Customer's Own Materials suspense account |
| Cost Exceptions | Cost discrepancy on merchandise still owned |
| Valuation Difference | Cost discrepancy on merchandise no longer owned |
| Landed Freight Asset / Liability | The two legs of capitalised freight between receipt, sale, and AP bill |
| TPA | Third Party Accounting — the QuickBooks-style external GL mode |
| FGII | STORIS's spreadsheet-logic data access / financial reporting tool |
| GL Recap | A report where credits are identified by header and therefore unsigned |
| Vendor Receivable | Money owed to the company by a vendor (bill backs, rebates) |
