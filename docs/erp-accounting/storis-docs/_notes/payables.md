# STORIS Accounts Payable — Engineering Reference

Scope: all 63 articles in `/home/claude/storis-docs/03-payables/` plus AP-relevant articles in
`/home/claude/storis-docs/01-views-and-reports/` and `/home/claude/storis-docs/00-accounting/`.
Everything below is sourced from those files; file paths are cited inline. Anything not stated in an
article is marked **INFERRED** or listed under "Open questions".

Corpus caveat: the articles are Zendesk HTML flattened to text. Table cells arrive as bare lines, so a
few position/length values are visibly garbled in the source. Those are reproduced verbatim and flagged
`[SOURCE SUSPECT]` — do not code against them without a bank spec.

---

## 1. AP object model

### 1.1 Vendor

- **Vendor** — master record keyed by a vendor code (5 characters per
  `/home/claude/storis-docs/00-accounting/002-import-vendors-from-third-party-accounting.md`, which
  describes a QuickBooks-derived key of "first three characters of Company Name + 2-digit sequence
  starting 00"). Maintained in **Vendor Settings** (screen not in this corpus).
- Vendor-level fields referenced by AP: `Currency`, `Separate Check per Bill`, `Free Freight Minimum`,
  `Display Comments`, default terms code, default bank, `Suppress Invoice Details on Checks`
  (`03-payables/031-enter-update-individual-vendor-invoice.md`,
  `03-payables/040-print-checks.md`).
- **Vendor Class** — grouping used as selection criteria for check runs and reporting
  (`03-payables/047-select-and-approve-bills-for-payment.md`,
  `01-views-and-reports/018-report-1099-and-payables-history.md`).
- **Vendor Remit-To** — child record of vendor, keyed by a remit-to ID. "By default, an initial
  remit-to record with the ID '1' was created when the vendor was created"
  (`03-payables/029-enter-a-recurring-vendor-invoice.md`). Carries remit name, additional name,
  address, default bank, `Default Payment Methods`, `Email Address` (and an `Other` email field), and
  for EFT: `Financial Institution`, `Transit Number`, `Account Number`
  (`03-payables/053-validate-vendor-remit-to-for-national-bank.md`,
  `03-payables/033-format-eft-data-for-national-bank.md`,
  `03-payables/026-email-remittance-advice.md`).
- **RFND vendor** — a reserved special vendor used for customer refund AP bills. Refund bills are
  never consolidated onto a shared check; the remit-to is the customer, edited through
  **Update Customer Remit-To** (`03-payables/051-update-customer-remit-to.md`,
  `03-payables/047-select-and-approve-bills-for-payment.md`). RFND is excluded from virtual card
  batches. In check export, "the Vendor Remit To Number passed is always the Refund Vendor" and the
  customer key rides in a `Customer Number` field
  (`03-payables/032-export-payable-checks.md`).

### 1.2 AP bill (vendor invoice)

The **AP bill** is the central AP document. One AP bill = one vendor invoice or vendor credit. Key
attributes (`03-payables/031-enter-update-individual-vendor-invoice.md`):

| Attribute | Notes |
|---|---|
| Bill number | Sequential; next number from `Next Number` in Payables Control Settings |
| TPA# | Third-party-accounting reference, STORIS Accounting only |
| Company | Expense company; prompted per `AP Prompt for Company` under multi-company |
| Date | AP transaction date; must be in an open sales period |
| Type | Bill type — see 1.3 |
| Vendor / Remit-To | Payee; remit-to may be created on the fly with security |
| Status | Null=Open, `C`=Closed, `H`=Hold, `P`=Pending, `D`=Deleted (closed only) |
| Hold Code | Active only when Status = Hold |
| Invoice/Credit Number + Date | Vendor's invoice number; date locked once payments exist |
| Terms | AP terms code; cascade described in §5.2 |
| Exchange Rate | Foreign vendors; changing it recalculates domestic amounts and GL |
| Freight / Sales Tax / Miscellaneous | Header charge code + amount, each expandable to many codes |
| Invoice/Credit Total | Header total incl. freight, tax, misc |
| Open Amount | Amount not yet approved for payment |
| Proof Amount | Header total minus approved detail total; must be 0.00 to exit |

Bills carry line detail (product/reference, vendor model, description, quantity, unit cost, extension,
taxable flag, PO line) and a comment log.

### 1.3 Bill types

Two enumerations appear in the corpus and they do **not** match. Both are reproduced.

**(a) Numeric codes selectable in Enter/Update Individual Vendor Invoice**
(`03-payables/031-enter-update-individual-vendor-invoice.md`):

| Code | Type |
|---|---|
| 01 | Merchandise/Invoice (referenced in the Invoice Detail tab as "bill type number 01 - Merchandise/Invoice"; not offered in the Type drop-down, which is limited to expense/freight) |
| 02 | Expense/Invoice |
| 03 | Freight/Invoice |
| 12 | Expense/Credit |
| 13 | Freight/Credit |

The Type drop-down offers only 02/03/12/13 — merchandise bills are created via the AP approval path
(Enter Multiple Vendor Invoices), not typed in directly.

**(b) Full bill-type list from Report Payable Approvals On Hold**
(`/home/claude/storis-docs/01-views-and-reports/043-report-payable-approvals-on-hold.md`):
All Bill Types, Merchandise, Expense, Direct Ship, EDI, COM, Freight, Non-Merchandise,
Merchandise Returns, Vendor Receivable, CS Charge-back, Vendor Charge-back.

**(c) Invoice vs. Credit split used by the payment selection / bill browse screens**
(`03-payables/047-select-and-approve-bills-for-payment.md`,
`03-payables/054-view-and-manage-ap-bills.md`):

| Invoice (debit) types | Credit types |
|---|---|
| Merchandise | Merchandise |
| Pending *(payment selection only)* | Expense |
| Expense | Freight |
| Freight | Vendor Receivable(s) |
| Direct Ship | Service Warranty |
| Customer's Own Material (COM) | Adjusted Inventory — "bills created in Enter a Stock Adjustment through the vendor chargeback" |
| Special Order Non-Inventory | |
| Customer Refund | |

Working definitions (synthesised from the three lists; the corpus never defines them individually):
- **Merchandise** — invoice matched to inventory receipts on a purchase order.
- **Pending** — a provisional bill created before/independent of receipt; see 1.4.
- **Expense** — non-PO expense bill, entered directly (STORIS Accounting only).
- **Freight** — freight invoice; pay-date defaulting differs (see §8, `Freight in Terms Amount`).
- **Direct Ship** — vendor ships direct to customer; the corpus mentions creating "an AP credit for a
  direct ship reimbursement" and a "direct-ship invoice"
  (`03-payables/031-enter-update-individual-vendor-invoice.md`).
- **EDI** — AP bill created from an EDI transmission; flagged separately everywhere
  (`03-payables/054-view-and-manage-ap-bills.md` has `From EDI`/`Not From EDI` filters;
  `01-views-and-reports/044-report-payables-activity.md` uses code `EDI`). EDI advance ship notices
  create Container ID / Trip ID keys used to select PO lines
  (`03-payables/030-enter-multiple-vendor-invoices.md`).
- **COM (Customer's Own Material)** — approval path `COM Activity` in Enter Multiple Vendor Invoices.
- **Non-Merchandise / Miscellaneous (Supplies)** — received items not for resale.
- **Merchandise Returns / Vendor Credit** — credits for returned goods; selected from returns records.
- **Vendor Receivable** — credit tied to the Vendor Receivables module (bill-backs, volume rebates,
  warranty reimbursements — `01-views-and-reports/037-report-daily-vendor-receivables-activity.md`).
- **CS Charge-back / Vendor Charge-back** — chargebacks; Adjusted Inventory credits originate from
  `Enter a Stock Adjustment` vendor chargeback (`03-payables/054-view-and-manage-ap-bills.md`).
- **Customer Refund** — refund AP bill on the RFND vendor.
- **Service Warranty** — warranty credit ("service warranty credit",
  `03-payables/031-enter-update-individual-vendor-invoice.md`).
- **Protection Plan** — AP bills for payables due to/from third-party protection plan providers;
  the 3rd-party plan provider code appears in the Vendor Model field
  (`03-payables/030-enter-multiple-vendor-invoices.md`,
  `03-payables/003-ap-approval-selection-screen.md`).

### 1.4 Pending bills

A **pending AP bill** is created from an open purchase order before merchandise is received
(`Pending Merchandise Receipt` process in `03-payables/030-enter-multiple-vendor-invoices.md`).
Multiple pending bills may exist per PO. Pending bills:
- have Status `P`;
- can be paid before receipt if `Allow Payment of Pending Bills` (Payables Control Settings) and the
  bill's `Pay Prior to Receipt` flag (defaulted from the PO) are set
  (`03-payables/031-enter-update-individual-vendor-invoice.md`);
- have their unit cost locked until converted;
- are converted to open bills by **Convert Pending Bills**
  (`03-payables/020-convert-pending-bills.md`), also runnable inside End-of-Day.

Conversion exception codes (`03-payables/020-convert-pending-bills.md`) — line level: `QTY NM`
(invoiced qty > qty available for approval), `COST EXC` (zero cost exception), `COST NF` (receiving
cost not found); bill level: `VENDOR NM` (bill vendor ≠ PO vendor), `COST NM` (receipt-cost vs.
merchandise-subtotal variance exceeds the allowable-cost-variance percent in Payables Control
Settings; merchandise subtotal = Total Invoice Amount − Freight − Sales Tax − Miscellaneous),
`DUE DATE` (due within N days with no receipts). Qty available for approval = qty received on PO line
− qty already on non-pending AP bills for that PO line.

### 1.5 Recurring invoice

A template record processed by End-of-Day to generate AP bills
(`03-payables/029-enter-a-recurring-vendor-invoice.md`). Keyed by `Reference`. Recurrence types:

| Type | Behaviour |
|---|---|
| None | No recurrence |
| Perpetual | Fixed amount monthly, indefinitely |
| Start/End Date | Fixed amount monthly until End Date |
| Balance Zero | Fixed amount monthly until Total Amount decrements to zero |
| Varying Amount | Amount varies (utilities/phone); Payment Amount forced to 0 and inactive; a Hold Code is mandatory and generated bills are auto-held for review; Multiple GL Account Entry unavailable |

Also carries Description, Bill Line Text, Vendor, Remit To, Remit Comment, Bank, Terms, GL Account
(offset to AP), Hold Code, Payment Amount, Total Amount, Starting Date, End Date, Due Day (1–31,
decremented to the last valid day in short months), Balance, plus display-only Last Bill Created /
Next Bill to Create. "GL hits for recurring AP bills occur on the day EOD creates the bill, and GL
hits for adjustments occur on the day of the adjustment."

Remit-to changes made after the recurring invoice is created are **not** propagated automatically.

### 1.6 Check run / payment batch

A **check run** (a.k.a. payment batch) is created per bank by **Select and Approve Bills for Payment**
(`03-payables/047-select-and-approve-bills-for-payment.md`). Key rules:

- Identified by Bank + Date + Time (single batch) or Bank + Date + **Batch Payment Code** (10 chars)
  when `Allow Multiple Payment Batches` is set in Bank Settings
  (`03-payables/023-date-for-new-batch-window.md`).
- "Only one pending payment can exist for a bank at a time" unless multiple payment batches are
  enabled.
- Batch payment method is chosen at creation: **Check** (always available), **Electronic Funds
  Transfer** (only when `EFT File Format` is populated on the bank), **Virtual Credit Card** (only
  when `Virtual Card File Format` is populated). If `Export Checks` is on for the bank, Check is the
  only method (`03-payables/023-date-for-new-batch-window.md`).
- Check-run statuses: `Pending` (not yet printed) → `Printed`. Payment statuses:
  `Pending`, `Printed`, `Reconciled`, `Voided`, plus `Completed`/`Transmitted` for EFT and virtual
  card (`03-payables/038-payment-review-screen.md`).
- The program consolidates bills with the same vendor + vendor remit-to into a single check, except
  Customer Refund bills, which are never consolidated.
- All checks in a check run must be one currency; a foreign-currency vendor needs a separate bank
  (`03-payables/036-import-completed-checks.md`).

### 1.7 EFT batch

An **EFT batch** is a payment batch whose method is Electronic Funds Transfer. Identified by bank +
batch number + date + time/code (`03-payables/025-eft-batch-lookup.md`). Life-cycle: created pending
by Select and Approve Bills for Payment → EFT file written by **Create Electronic Funds Transfer
File** → payments Completed → optionally voided by **Void EFT Batch**. Reconciled batches cannot be
voided.

### 1.8 Virtual card batch

Batch of virtual-credit-card payments (`03-payables/059-virtual-card-processing.md`). Status machine:

| Action | Batch status | Payment status | Comment |
|---|---|---|---|
| Select and Approve Bills for Payment creates batch | Pending | (not created) | |
| Virtual Card Processing > Create Payment File | Transmitted | Transmitted | |
| Virtual Card Processing > Import Response File | Completed | Transmitted or Voided | Payment populated with virtual card number; GL is posted |
| Virtual Card Processing > Import Reconciliation File | Completed | Completed | Payment cannot be voided |
| Virtual Card Processing > Void Payment Batch | Voided | Voided | |

"Another payment batch cannot be created for the same bank until the current batch has been imported
and the status is completed — this applies to any payment type (check, EFT, virtual card)."

### 1.9 Reconciliation transaction

A record in the Bank Reconciliation file representing a cash movement at a bank: system-generated
(check, EFT batch total, deposit) or manually entered (**Enter a Reconciliation Transaction**,
`03-payables/028-enter-a-reconciliation-transaction.md`). Fields: Bank, Record ID, Date, Document
Number, Transaction Type, Deposit Type Code, Transfer Bank, Amount (negative = credit),
Post to General Ledger flag, Detail Reference Information. Bank-supplied rows live in a parallel
`BANK.REC.AUTO` file keyed by **BAI code**, cross-referenced to STORIS Transaction Type codes
(`03-payables/043-reconcile-bank-transactions-manually.md`,
`03-payables/035-import-bank-transactions-with-automatic-reconciliation.md`).

### 1.10 Relationships (compact)

```
Vendor 1─n Vendor Remit-To 1─n AP Bill (bill type, status, terms)
AP Bill 1─n Bill Line (PO line / free-text reference)
AP Bill 1─n Header Invoice Charge (Freight | Sales Tax | Miscellaneous  ×  charge code)
AP Bill n─n Payment (AP.PAYMENT.REGISTER)   ← Payment Register Maintenance moves bills between checks
Payment n─1 Check Run / EFT Batch / Virtual Card Batch  (keyed Bank + Date + Time|Code)
Payment 1─1 Bank Reconciliation record        (EFT posts ONE rec record for the whole batch)
Recurring Invoice ──EOD──▶ AP Bill
Purchase Order ──receipt──▶ AP approval ──▶ AP Bill (Merchandise) / Pending AP Bill
```

Named files/records visible in the corpus: `AP.BILL`, `AP.PAYMENT.REGISTER`, `BANK`, `VENDOR`,
`CUSTOMER`, `BANK.REC.TRANS.TYPE`, `BANK.REC.DEP.TYPE`, `BANK.REC.AUTO`, `WAREHOUSE.LOCATION`.

---

## 2. AP lifecycle and the screens involved

### 2.1 Bill creation

| Screen | Role | File |
|---|---|---|
| Enter Multiple Vendor Invoices | 3-step AP approval driver: Step 1 selection criteria, Step 2 AP Approval Selection, Step 3 Enter/Update Individual Vendor Invoice. Processes: New Inventory Activity, Special Order Non-Inventory, COM Activity, Miscellaneous (Supplies), Pending Merchandise Receipt, Protection Plans. Document type: Vendor Invoice or Vendor Credit. `Auto Select` skips Step 2. | `03-payables/030-enter-multiple-vendor-invoices.md` |
| AP Approval Selection Screen | Step 2 multi-select grid: Model, Plan, Order, PO/Reference, Vendor Name, Available, Date, Type, Special Order Detail. Latest receipt date shown for multi-receipt POs. | `03-payables/003-ap-approval-selection-screen.md` |
| Enter/Update Individual Vendor Invoice | Step 3 and the general bill maintenance screen. Tabs: General, Invoice Detail, Check Information. Modes: Approval / Maintenance / Inquiry. Posts to GL immediately upon filing. Cannot edit bills on a pending check run. | `03-payables/031-enter-update-individual-vendor-invoice.md` |
| AP Select Available Screen | Item picker for type-01 merchandise bills; lists items on open POs for the bill type + vendor. Not available under TPA. | `03-payables/005-ap-select-available-screen.md` |
| Disburse Payable Invoice Charges | Multiple freight/tax/misc charge codes and amounts per bill. Not available under TPA. | `03-payables/024-disburse-payable-invoice-charges.md` |
| Actual Exchange Rate Lookup | Shows the actual (vs. estimated) rate from Country Settings. | `03-payables/001-actual-exchange-rate-lookup.md` |
| Enter a Recurring Vendor Invoice | Recurring template; EOD generates bills. | `03-payables/029-enter-a-recurring-vendor-invoice.md` |
| Convert Pending Bills | Batch convert pending→open; Convert Only / Report Exceptions Only / Convert and Report Exceptions. | `03-payables/020-convert-pending-bills.md` |
| Update Bill Comments / Update Comments | Append-only comment log per bill (existing comments cannot be edited). | `03-payables/049-update-bill-comments.md`, `03-payables/050-update-comments.md` |
| View and Manage AP Bills | Bill browser; also the bulk **Remove Hold** action. | `03-payables/054-view-and-manage-ap-bills.md` |
| View AP Bill | Read-only twin of Enter/Update. | `01-views-and-reports/080-view-ap-bill.md` |

### 2.2 Approval, hold and release

- "AP Approval" in STORIS means matching receipts/PO lines to a vendor invoice and creating the bill —
  it is the Enter Multiple Vendor Invoices → AP Approval Selection → Enter/Update chain, not a
  separate sign-off workflow (`03-payables/030-enter-multiple-vendor-invoices.md`).
- **Hold** is a bill status (`H`) plus a **hold code**. Set on the bill
  (`03-payables/031-enter-update-individual-vendor-invoice.md`), on a recurring invoice
  (`03-payables/029-enter-a-recurring-vendor-invoice.md`), and auto-applied to Varying Amount
  recurring bills.
- **Release**: bulk via View and Manage AP Bills → check rows → `Remove Hold`
  ("Hold status has been removed from ~AP bills."); per-bill by changing Status
  (`03-payables/054-view-and-manage-ap-bills.md`).
- Held bills are visible via `Report Payable Approvals On Hold`
  (`01-views-and-reports/043-report-payable-approvals-on-hold.md`) and the Hold filters on
  `Report Payables Activity`, `Report Cash Requirements`, `Report Payables Aged Trial Balance`.
- A pre-approval report exists in the corpus
  (`00-accounting/005-report-pre-approval-credit-statistics.md`) but that is **consumer-credit**
  pre-approval, not AP. **No AP "pre-approval" screen is documented in this corpus.**

### 2.3 Payment selection → payment output

| Step | Screen | File |
|---|---|---|
| 1. Start batch | Select and Approve Bills for Payment (header: Bank, Date, Time/Code, New) | `03-payables/047-select-and-approve-bills-for-payment.md` |
| 1a. New batch prompt | Date For New Batch Window (Batch Payment Date / Method / Code) | `03-payables/023-date-for-new-batch-window.md` |
| 2. Select bills | Bill Selection tab: Vendor, Vendor Class, Include AP Bills regardless of Default Payment Method, Include Payments (bill types), Include Credits, Exclude Credits Resulting in Negative Checks, Payment Date type (Due / Terms / Anticipated Pay) + Start/Cutoff, Bills With Terms Only, Always Take Terms, `Select Bills` button | same |
| 2a. EFT pre-flight | Validate Bank for National Bank; Validate Vendor Remit To for National Bank (fires on `Select Bills`) | `03-payables/052-…`, `03-payables/053-…` |
| 3. Approve | Bill Approval tab grid (Bill, Invoice, Remit-To, Bill Type, Due/Pay Date, Terms Date, Amount Due, Discount, Approved, Edit, Remove); editable Approved column; `Add Bill` | `03-payables/047-…` |
| 3a. Add bills | Add Bills to Existing Check Run → AP Check Approval Bill Selection | `03-payables/002-…`, `03-payables/004-…` |
| 4a. Checks | Check Review tab → `Print Checks` (or `Export Payable Checks` when the bank has Export Checks) and `Create Check Run File` | `03-payables/047-…` |
| 4b. EFT | EFT Review tab → `Create EFT File` | `03-payables/047-…`, `03-payables/022-…` |
| 4c. Virtual card | Virtual Card Review tab → Virtual Card Processing / Create Payment File | `03-payables/047-…`, `03-payables/059-…` |
| 5. Split/merge checks | Payment Register Maintenance Screen (double-click a Check Review row) | `03-payables/037-payment-register-maintenance-screen.md` |
| 6. Print | Print Checks | `03-payables/040-print-checks.md` |
| 6-alt. Quick check | Quick Check Processing, launched from the bill itself | `03-payables/042-quick-check-processing.md` |
| 7. Positive pay | Create Bank Check File | `03-payables/021-create-bank-check-file.md` |
| 8. Inquiry | View Check Status and Payment Details (read-only twin of Select and Approve) | `01-views-and-reports/083-…` |
| 9. Void | Void Payment Screen / Void Check Run / Void EFT Batch / Virtual Card Void Payment Batch | `03-payables/062-…`, `060-…`, `061-…`, `059-…` |
| 10. Reconcile | Reconcile Checks → Accounts Payable Check Reconciliation Screen; Reconcile Bank Transactions Manually / Automatically | `03-payables/044-…`, `000-…`, `043-…`, `035-…` |

Negative-payment guard: if any approved bill produces a negative payment for a remit-to, the grid row
is highlighted and `Print Checks` / `Create EFT File` inactivate until resolved
(`03-payables/047-select-and-approve-bills-for-payment.md`).

### 2.4 Print Checks mechanics (`03-payables/040-print-checks.md`)

- Check-run print statuses: `Not Started`, `Alignment Printed`, `In Progress`,
  `Confirm Successful Check Print`.
- `Starting Check Number` defaults from `Next Check Number` in Bank Settings; may only be increased.
  Increasing prompts to void the skipped numbers — the routine refuses to void numbers already used by
  manual checks.
- `Print Alignment` voids the current check number and increments.
- Failure path: uncheck `Checks Printed Successfully`, enter `Last Successful Check` and
  `Next Available Check`, click `Update Checks`. The program voids checks strictly between those two
  numbers and clears/reopens checks ≥ Next Available Check and < Next Check to Print.
- A voided check number can never be reused; clearing (not voiding) returns numbers to the pool.
- "You cannot start a check run print, save it, and resume it at a later time." Exiting warns that all
  checks will be voided but the check run keeps its Pending status.
- On success + Save, `Report Payables Disbursement` runs (the check register).

### 2.5 Third-party check printing (TPA export/import)

`Export Payable Checks` (`03-payables/032-export-payable-checks.md`) writes
`CheckRunExport_<bank>_MM-DD-YYYY_HH:MM:SS.xml` to the server `TPA_EXPORT` directory and sets the run
status to `Exported`; the file carries a **pending check number** linking AP bills to checks.
`Import Completed Checks` (`03-payables/036-import-completed-checks.md`) reads `TPA_IMPORT`, cross-
references the pending check number to the TPA check number, and adopts the TPA number as the STORIS
check number. Payment types in the import: `SYS` (check), `ACH`, `WIR` — all treated as checks in
STORIS, with `ACH`/`WIR` prefixed to keep check numbers unique. Actions: Validate Only /
Validate and Perform Updates. Exception report columns: Error Type, Pending Check Reference,
TPA Check Number, AP Bill, STORIS Check Run Value, Import File Value, Exception.

**Security note from the article:** "The bank account number is encrypted in the STORIS database; it
is not encrypted in the check export file."

---

## 3. Payment output formats

### 3.0 Drivers

**Create Bank Check File** (`03-payables/021-create-bank-check-file.md`) — Access:
`Accounting > Payables > Process Checks > Create Bank Check File`. Purpose: positive-pay files.
Inputs: Bank (only banks with `Positive Pay File Format` set in Bank Settings), Date Code, Check Date,
`Include Checks Already Transmitted`, Send Output To, Export Path (not editable), `Test Mode` (active
only for the Bank of Montreal format). Scope: "includes only checks printed in a check run and
excludes all others, for example electronically transmitted checks." Output container per bank, as
listed in the article: Bank of America ASCII; Bank of Montreal; BMO Harris; Chase ASCII; The Private
Bank fixed-length; US Bank ASCII fixed-length; US Bank (II) comma-delimited; Wachovia ASCII;
Wells Fargo .CSV. The supported-format list in the same article: Bank of America, Bank of Montreal,
Bank of Montreal Enhanced, Bank of Montreal Enhanced 2, BB&T Bank, BMO Harris Bank, Chase, SunTrust
Bank, The Private Bank, US Bank, Wachovia, Wells-Fargo. (Standard NACHA and Australian ABA have their
own articles but are absent from that list.)

**Create Electronic Funds Transfer File** (`03-payables/022-create-electronic-funds-transfer-file.md`)
— Access: `Accounting > Payables > Process Checks > Electronic Funds Transfer > Create Electronic
Funds Transfer File`, or the `Create EFT File` button on the EFT Review tab. EFT formats available:
**CIBC, Scotia Bank (SCP15), Bank of Montreal (CPA005), NACHA, SunTrust (modified NACHA), National
Bank (NATIONAL), Australian Bankers Association, Truist, Wells Fargo.** Fields: Bank, Date,
Time/Code, Action (`Create a New EFT File` | `Retransmit an Existing File`), EFT Batch Number,
File Name (≤25 alphanumeric), Complete Payments (`Immediately` only), Email Remittance Advice,
Send Output To (defaults ASCII Export; NFS requires a manual path), Export Path. **STORIS does not
transmit to the bank** — the customer transmits.

Payment-completion updates fired by the EFT run (verbatim list):
1. Update the payment information and open amount in the AP bills;
2. If the open amount is zero, close the AP bill and write it to history;
3. Update payment information in the vendor;
4. Post GL for the payment — **Debit Accounts Payable, Credit EFT GL Account**;
5. Create a **single** Bank Reconciliation record for the total amount of the EFT batch;
6. Post GL for the total EFT batch — **Debit EFT GL Account, Credit AP Cash Account**.

Note the article-level split: only **National Bank** has a documented EFT layout
(`03-payables/033-format-eft-data-for-national-bank.md`, §3.14). Layouts for CIBC, Scotia SCP15,
BMO CPA005, NACHA, SunTrust modified NACHA, ABA-as-EFT, Truist and Wells Fargo EFT are **not stated
in this corpus**.

### 3.1 Bank of America (`03-payables/006-bank-check-file-format-bank-of-america.md`) — ASCII

Header record:

| Field | Position | Len | Comment | Sample |
|---|---|---|---|---|
| Bank ID | 1-8 | 8 | Bank Identifier from BANK record; if null the Bank Code is used; left justified, zero filled | `DRS35500` |
| Account Number | 9-10 `[SOURCE SUSPECT]` | 10 | Account number from BANK record (positions likely 9-18) | `1463500422` |
| Process Year | 19-22 | 4 | Check year | `2009` |
| Process Month | 23-24 | 2 | Check month | `10` |
| Process Day | 25-26 | 2 | Check day | `06` |

Detail record:

| Field | Position | Len | Comment | Sample |
|---|---|---|---|---|
| Check Number | 1-10 | 10 | Right justified, zero filled | `0000110870` |
| Check Amount | 11-20 | 10 | Right justified, zero filled, implied 2 decimals | `0000152000` |
| Account Number | 21-30 | 10 | From BANK file | `1463500422` |
| Check Month | 31-32 | 2 | MM | `10` |
| Check Day | 33-34 | 2 | DD | `06` |
| Check Year | 35-36 | 2 | YY | `09` |
| Space | 37-37 | 1 | Filler | spaces |
| Payee | 38-80 | 43 | **Payee or remit-to name, NOT vendor name** | `AC PACIFIC CORPORATION` |

Footer record:

| Field | Position | Len | Comment | Sample |
|---|---|---|---|---|
| Start Count | 1-1 | 1 | Always `1` | `1` |
| EOF | 2-4 | 3 | Always `EOF` | `EOF` |
| Space | 5-5 | 1 | Filler | spaces |
| Count of Checks | 6-10 | 5 | Right justified, zero filled | `00002` |
| Space | 11-30 | 20 | Filler | spaces |
| Check Number Check Figure | 31-40 | 10 | Sum of check numbers, RJ/ZF | `0000221741` |
| Check Amount Check Figure | 41-50 | 10 | Sum of check amounts, RJ/ZF, implied 2 decimals | `0000166819` |

### 3.2 Bank of Montreal (`03-payables/007-bank-check-file-format-bank-of-montreal.md`)

The article gives **justification instead of absolute positions**. Record length is implied by summing
lengths (header 4+3+8+13+6+4+42 = 80).

Header:

| Field | Position | Len | Description |
|---|---|---|---|
| `"ARSH"` | Left | 4 | Required text |
| `"ISS"` | Left | 3 | Required text |
| Customer Name | Left | 8 | Bank Settings → EFT and Positive Pay tab → Positive Pay Bank Identifier |
| Account Number | Left | 13 | Bank Settings → EFT and Positive Pay → Alternate Account Number (if specified) else Account Number |
| Date | Right | 6 | Check date YYMMDD |
| Test Flag | Left | 4 | `TEST` in test mode, else spaces |
| Spaces | Left | 42 | Filler |

Detail:

| Field | Position | Len | Description |
|---|---|---|---|
| Account Number | Left | 13 | as header |
| Check Number | Right, zero-padded | 10 | |
| Check Amount | Right, zero-padded | 11 | 2 decimal places |
| Check Date | Complete | 6 | YYMMDD |
| Spaces | Left | 15 | |
| Transaction Type | Complete | 1 | `I`=Issued, `V`=Voided |
| Remittance Name | Left | 60 | Image zone line 1 |
| Remittance Address | Left | 60 | Image zone line 2 |
| Remittance Address | Left | 60 | Image zone line 3 |
| Remittance Address | Left | 60 | Image zone line 4 |
| Remittance City, State, Zip | Left | 60 | Image zone line 5 |
| Spaces | Left | 25 | Filler |

Footer: `"ARST"` (Left, 4) · Number of Checks (Right, 9, zero filled) · Total Check Amount
(Right, 13, zero filled) · Spaces (Left, 54).

### 3.3 Bank of Montreal Enhanced (`03-payables/008-…-enhanced.md`)

Identical field-for-field to §3.2 except the header and footer filler are **700** instead of 42/54,
and the detail filler fields are labelled `Filler 1` (15) and `Filler 2` (25). Detail field 1 is
labelled `Bank Account Number` and field 3 `Amount`. Absolute positions not stated.

### 3.4 Bank of Montreal Enhanced 2 (`03-payables/009-…-enhanced-2.md`) — 700-byte records

Header:

| Field | Position | Len | Type | Just. | Description |
|---|---|---|---|---|---|
| `"DCSH"` | 1-4 | 4 | Alphanumeric | Left | Required text |
| `"ISS"` | 5-7 | 3 | Alphanumeric | Left | Required text |
| Customer Short Name | 8-15 | 8 | Alphanumeric | Left | Bank Settings → Positive Pay Bank Identifier |
| Account Number | 16-28 | 13 | Numeric | Left | First 5 digits = Transit, then a zero, last 7 = Account Number |
| Date | 29-34 | 6 | Numeric | Right | YYMMDD |
| Currency | 35-38 | 4 | Alphanumeric | Left | `CAD` or `USD` (hard-coded CAD), left justified + trailing space |
| DCS Customer ID | 39-48 | 10 | Alphanumeric | Left | Bank Settings → Positive Pay Bank Identifier |
| Filler | 49-700 | 652 | Alphanumeric | Left | Spaces |

Detail:

| Field | Position | Len | Type | Just. | Description |
|---|---|---|---|---|---|
| DCS Account Number | 1-13 | 13 | Numeric | Left | Transit(5) + `0` + Account(7), e.g. `1234507654321` |
| Check Number | 14-23 | 10 | Numeric | Right | Left-padded with zeros |
| Check Amount | 24-34 | 11 | Numeric | Right | Zero-padded, 2 decimals implied, no explicit decimal |
| Date | 35-40 | 6 | Numeric | Right | YYMMDD |
| Additional Data | 41-55 | 15 | Alphanumeric | Left | Space filled |
| Transaction Code | 56 | 25 `[SOURCE SUSPECT]` | Alphabetic | Left | `I`=Issued, `V`=Voided. Effective length is 1 given the next field starts at 57 |
| Image Zone 1 | 57-116 | 60 | Alphanumeric | Left | Remit To Name (beneficiary) |
| Image Zone 2 | 117-176 | 60 | Alphanumeric | Left | Remit To Address line 1 |
| Image Zone 3 | 177-236 | 60 | Alphanumeric | Left | Remit To Address line 2 |
| Image Zone 4 | 237-296 | 60 | Alphanumeric | Left | Remit To Address line 3 |
| Image Zone 5 | 297-356 | 60 | Alphanumeric | Left | Remit To City, State, Zip |
| Filler | 357-700 | 344 | Alphanumeric | Left | Space filled |

Footer:

| Field | Position | Len | Type | Just. | Description |
|---|---|---|---|---|---|
| Record Type | 1-4 | 4 | Alphanumeric | Left | `DCST` trailer, required |
| Total Item Count | 5-13 | 9 | Numeric | Right | Detail record count, zero-padded |
| Total Item Amount | 14-26 | 13 | Numeric | Right | Zero-padded, 2 decimals implied |
| Filler | 27-700 | 674 | Alphanumeric | Left | Spaces |

### 3.5 BB&T Bank (`03-payables/010-bank-check-file-format-bb-t-bank.md`) — single record type

| # | Position | Field | Len | Type | Comments |
|---|---|---|---|---|---|
| 1 | 01-01 | Record Code | 1 | Alphabetic | Required, `C` = check, `V` = void |
| 2 | 02-143 `[SOURCE SUSPECT]` | Account Number | 13 | Numeric | Required, right justified, leading zeros. Length 13 and the next field at 15 imply **02-14** |
| 3 | 15-24 | Check Number | 10 | Numeric | Required, RJ, leading zeros; no commas or decimal points |
| 4 | 25-34 | Check Amount | 10 | Numeric | Required, RJ, leading zeros, two assumed decimals, format `99999999V99`; no commas/decimals |
| 5 | 35-40 | Check Date | 6 | Numeric | MMDDYY |
| 6 | 56-135 | Payee Name | 80 | Alphanumeric | Left justified, space filled |

Positions **41-55 are unaccounted for** in the article (presumed filler) — not stated.

### 3.6 BMO Harris Bank (`03-payables/011-bank-check-file-format-bmo-harris-bank.md`) — **comma-separated text**

| Contents | Chars | Format | M/O | Data validation |
|---|---|---|---|---|
| Check Number | 10 | numeric only | mandatory | ≤10 numeric chars; bank left-pads with zeros |
| Check Issue Date | 10 | mm/dd/yyyy | mandatory | mm 1-9 or 10-12; dd 1-9 or 10-31; yyyy 2 or 4 digits (`12`→`2012`); slashes required |
| Check Amount | 11 | 0 to 99999999.99 | mandatory | ≤8 digits left of decimal, ≤2 right; negative signs ignored; decimal point optional |
| Bank Number | 3 | numeric only | mandatory | 1-3 digits; bank left-pads with zeros |
| Account Number | 10 | numeric only | mandatory | ≤10 digits; bank left-pads with zeros |
| Transaction Code | 2 | specific codes | mandatory | `IA`=Insert Add, `ID`=Insert Delete, `VA`=Void Add, `VD`=Void Delete |
| Payee | 128 | alphanumeric, no commas | optional | |
| Reference | 20 | alphanumeric, no commas | (not stated) | |

Field order in the file = row order above. No positions (delimited format).

### 3.7 Chase (`03-payables/012-bank-check-file-format-chase.md`) — ASCII fixed

| Position | Field | Format | Comment |
|---|---|---|---|
| 1 | Transaction Indicator | X | Always `I` |
| 2-18 | Account Number | 9(17) | Bank checking account number, zero filled |
| 19-28 | Check Number | 9(10) | Zero filled |
| 29-34 | Check Date | 9(6) | MMDDYY |
| 35-45 | Check Amount | 9(8).99 | **Explicit** decimal point, e.g. `99999999.99` |
| 46-75 | Filler | `X30)` `[SOURCE SUSPECT]` — read as X(30) | Spaces |
| 76-125 | Payee 1 | X(50) | Remit-to from `AP.PAYMENT.REGISTER`, space filled |
| 126-175 | Payee 2 | X(50) | Remit-to Name two from `AP.PAYMENT.REGISTER`, space filled |

### 3.8 Standard NACHA "positive pay" (`03-payables/013-bank-check-file-format-standard-nacha-format.md`) — **comma-separated text**

Identical column set and validation to BMO Harris (§3.6) minus the "bank pads with leading zeros"
sentences: Check Number (10, numeric, mandatory) · Check Issue Date (10, mm/dd/yyyy, mandatory) ·
Check Amount (11, 0–99999999.99, mandatory) · Bank Number (3, numeric, mandatory) · Account Number
(10, numeric, mandatory) · Transaction Code (2, `IA`/`ID`/`VA`/`VD`, mandatory) · Payee (128,
alphanumeric no commas, optional) · Reference (20, alphanumeric no commas).

⚠️ Despite the name, this article describes a **positive-pay CSV**, not the ACH NACHA record layout.
The NACHA *EFT* layout is not stated in this corpus.

### 3.9 SunTrust Bank (`03-payables/014-bank-check-file-format-suntrust-bank.md`) — "SUN TRUST BANK", fixed-length text

| Position | Field | Len | Characteristics | Comment |
|---|---|---|---|---|
| 1-13 | Account Number | 13 | Numeric | Bank checking account number, zero-filled |
| 14-23 | Check Serial Number | 10 | Numeric | Check number, zero-filled |
| 24-33 | Check Amount | 10 | Numeric | Implied two decimals (`999999`=`9999.99`), zero-filled |
| 34-39 | Check Date | 6 | Numeric | Article says **MMDDYYYY** in a 6-byte field `[SOURCE SUSPECT]` |
| 40-54 | Additional Data | 15 | Alphanumeric | Internal identification, optional |
| 55 | Void Indicator | 1 | Alphanumeric | `V` = void check |
| 56-95 | Payee 1 | 40 | Alphanumeric | Remit-to from `AP.PAYMENT.REGISTER`, space-filled; quote the field if it contains commas. Payee Name Verification only |
| 96-135 | Payee 2 | 40 | Alphanumeric | Remit-to name two, same rules |
| 136-160 | Filler | 25 | Alphanumeric | |

### 3.10 The Private Bank (`03-payables/015-bank-check-file-format-the-private-bank.md`)

Article says "creates a comma separated text file" but then gives fixed positions — treat the
positions as authoritative and confirm the container with the bank.

| Field | Positions | Len | Characteristics | Description |
|---|---|---|---|---|
| 1 | 1 | 1 | Alphanumeric | Constant `C` |
| 2 | 2-4 | 3 | Numeric | Bank number = `992` |
| 3 | 5-6 | 2 | Numeric | Zeros |
| 4 | 7-16 | 10 | Numeric | Account number |
| 5 | 17 | 1 | Alphanumeric | Blanks |
| 6 | 18 | 1 | Alphanumeric | Transaction type `R`=Register, `V`=Void |
| 7 | 19 | 1 | Alphanumeric | Action indicator `A`=Add, `D`=Delete |
| 8 | 20 | 1 | Alphanumeric | Spaces |
| 9 | 21-30 | 10 | Numeric | Check number |
| 10 | 31-40 | 10 | Numeric | Check amount |
| 11 | 41-46 | 6 | Numeric | Issue date MMDDYY |
| 12 | 47-142 | 96 | Alphanumeric | Optional payee name |

### 3.11 US Bank (`03-payables/016-bank-check-file-format-us-bank.md`) — "USBANK", fixed-length text

| Position | Field | Format | Comment |
|---|---|---|---|
| 1-12 | Account Number | 9(12) | Bank checking account number, zero-filled |
| 13-22 | Check Number | 9(10) | Zero-filled |
| 23-34 | Check Amount | 9(10)v99 | Implied two decimals, zero-filled |
| 35-42 | Check Date | 9(8) | MMDDYYYY |
| 43-44 | Action | X(2) | `IS`=issue, `CN`=cancel |
| 45-84 | Payee 1 | X(40) | Remit-to from `AP.PAYMENT.REGISTER`, space-filled, quote if it contains commas (optional) |
| 85-124 | Payee 2 | X(40) | Remit-to name two, same rules (optional) |

**USBANK2** variant: comma-delimited text, column order —
`Bank Account Number, Payment Reference, Check Amount, Check Date, Action, Remit to Name 1, Remit to Name 2`.
No lengths stated.

### 3.12 Wachovia (`03-payables/017-bank-check-file-format-wachovia.md`) — 150-byte records

Header:

| Position | Field | Size | Type |
|---|---|---|---|
| 01-20 | `RECONCILIATIONHEADER` (literal) | 20 | Alpha |
| 21-24 | Bank Number — DC 0052, FL 0003, GA 0005, MD 0014, NC 0001, SC 0004, TN 0006, VA 0007, CT 0020, DE 0049, PA/NY/NJ 0075 | 04 | Numeric (RJ/ZF) |
| 25-37 | Account Number | 13 | Numeric (RJ/ZF) |
| 38-49 | Total Dollar Amount of File (no decimal point) or all zeros | 12 | Numeric (RJ/ZF) |
| 50-54 | Total Item Count of File (no commas) or all zeros | 05 | Numeric (RJ/ZF) |
| 55-150 | Filler, zero or blank | 96 | Alphanumeric |

Detail:

| Position | Field | Max size | Type |
|---|---|---|---|
| 01-13 | Account Number | 13 | Numeric (RJ/ZF) |
| 14-23 | Check Serial Number | 10 | Numeric (RJ/ZF) |
| 24-33 | Check Amount (no decimal point) | 10 | Numeric (RJ/ZF) |
| 34-41 | Issue Date (YYYYMMDD std.) | 8 | Numeric |
| 42 | Void Indicator (`V` std.; "Other (except X or -)") | 01 | Alphanumeric |
| 43-72 | Additional Data (SSN, payee name, etc.) | 30 | Alphanumeric |
| 73-80 | Filler, zero or blank | 8 | Alphanumeric |
| 81-130 | Payee Name for Payee Match — **required for PMPP**, left justified | 50 | Alphanumeric |
| 131-150 | Filler, zero or blank | 20 | Alphanumeric |

Article footnote: "For information to appear on paper ARP reports, use first 15 characters only; for
ARP CD's or Data Transmissions, 30 characters are available." No trailer record documented.

### 3.13 Wells Fargo (`03-payables/018-bank-check-file-format-wells-fargo.md`) — **.CSV, no positions**

Column-oriented; the article gives sourcing rules, not a layout.

| Column header | Formatting / source |
|---|---|
| BID | Payer Number from Bank Settings |
| RID | Account Number from Bank Settings |
| Routing transit number or Bank ID | From the BANK record — must be exactly 9 numeric digits |
| Account number | From the BANK record — up to 10 numeric characters, no punctuation |
| Serial number | From the AP PAYMENT REGISTER record — up to 10 numeric characters |
| Issue date | From the AP PAYMENT REGISTER record — MM-DD-YYYY |
| Amount | Sum of values from the AP PAYMENT REGISTER record — `99999.99`, decimal point and cents always present |
| Transaction type | `320` for normal checks, `430` for voided checks (APR STATUS = `VOI` in AP PAYMENT REGISTER) |
| Memo | REMIT NAME from AP PAYMENT REGISTER — up to 120 alphanumeric; may include spaces and these punctuation characters: apostrophe, double-quote, forward slash, backslash, asterisk, open paren, close paren, hash, period, hyphen, equals, backtick, underscore, dollar sign |

### 3.14 Australian Bankers Association / ABA (`03-payables/019-…-aba.md`) — 120-byte records

Header (Record Type 0):

| Position | Size | Field | Specification |
|---|---|---|---|
| 1 | 1 | Record Type | Must be `0` |
| 2-18 | 17 | Blank | Blank filled |
| 19-20 | 2 | Reel Sequence Number | `01` |
| 21-23 | 3 | Name of User's Financial Institution | Approved FI abbreviation (BOQ = `BQL`, Westpac = `WBC`). **Bank Settings → Alternate ID** |
| 24-30 | 7 | Blank | Blank filled |
| 31-56 | 26 | Name of User supplying file | 'User Preferred Specification' from the FI. **Bank Settings → Originator Long Name** |
| 57-62 | 6 | Name of User supplying file | 'User Identification Number' assigned by APCA. **Bank Settings → Payer Number** |
| 63-74 | 12 | Description | **Bank Settings → Originator Short Name** |
| 75-80 | 6 | Date to be processed | Numeric DDMMYY |
| 81-120 | 40 | Blank | Blank filled |

Detail (Record Type 1):

| Position | Size | Field | Specification |
|---|---|---|---|
| 1 | 1 | Record Type | Must be `1` |
| 2-8 | 7 | Bank/State/Branch Number | Numeric with hyphen at char 5; chars 2-3 = FI number; char 4 = state (0-9); chars 6-8 = branch. **Vendor Remit To → Financial Institution** |
| 9-17 | 9 | Account number to be credited/debited | Numeric, hyphens, blanks; strip hyphens if >9 chars; right justified, blank filled. **Vendor Remit To → Account Number** |
| 18 | 1 | Indicator | `N` for new or varied |
| 19-20 | 2 | Transaction Code | `50` for General Credit |
| 21-30 | 10 | Amount | Numeric, >0, in cents, no punctuation, RJ zero filled, unsigned |
| 31-62 | 32 | Title of Account to be credited | Vendor Remit To name; not all blanks; left justified blank filled. **Vendor Remit To → Remit to Name** |
| 63-80 | 18 | Lodgement Reference | **Bank → Originator Short Name** (the article's example literal is a specific customer name — treat as sample data, not a constant) |
| 81-87 | 7 | Trace Record (BSB `XXX-XXX`) | Chars 81-82 FI number, 83 state (0-9), 84 hyphen. **Bank → Financial Institution** |
| 88-96 | 9 | Account number | Right justified, blank filled. **Bank → Account Number** |
| 97-112 | 16 | Name of Remitter | **Bank → Originator Short Name**; not all blanks; left justified blank filled |
| 113-120 | 8 | Amount of Withholding Tax | Numeric, cents, no punctuation, RJ zero filled, unsigned |

Trailer (Record Type 7):

| Position | Size | Field | Specification |
|---|---|---|---|
| 1 | 1 | Record Type | Must be `7` |
| 2-8 | 7 | BSB Format Filler | Must be `999-999` |
| 9-20 | 12 | Blank | Blank filled |
| 21-30 | 10 | File Net Total Amount | Credit total − debit total, cents, RJ zero filled, unsigned |
| 31-40 | 10 | File Credit Total Amount | Accumulated credit detail amounts |
| 41-50 | 10 | File Debit Total Amount | Accumulated debit detail amounts |
| 51-74 | 24 | Blank | Blank filled |
| 75-80 | 6 | Count of Record Type 1 | RJ zero filled |
| 81-120 | 40 | Blank | Blank filled |

### 3.15 National Bank EFT (`03-payables/033-format-eft-data-for-national-bank.md`) — 1464-byte records

Record types: `A` (header/user), `C` (credit detail), `Z` (trailer). "Each record must have 1464
characters." A `C` record must carry **six** payment segments; short final records are blank filled.
An EFT batch must be single-currency (CAD or USD).

Header `A`:

| # | Contents | Position | Format | Description |
|---|---|---|---|---|
| 1 | `A` | 1 | X(1) | Record type |
| 2 | `000000001` | 2-10 | N(9) | Record counter, always 000000001 for `A` |
| 3 | | 11-20 | X(10) | User's Number assigned by the bank — Bank Settings → Payer Number (`BA.PAYER.NBR`) |
| 4 | | 21-24 | N(4) | File Creation Number, RJ zero filled, +1 per file (`ACR.EFT.NATIONAL.SEQ.NBR`) |
| 5 | `0YYDDD` | 25-30 | N(6) | File creation date, Julian (`ACR.EFT.FILE.CR.DATE`) |
| 6 | `00610` | 31-35 | N(5) | Addressee, always 00610 — Bank Settings → Destination Data Center (`BA.DEST.DATA.CTR`) |
| 7 | Blanks | 36-55 | X(20) | |
| 8 | | 56-58 | X(3) | Currency code `CAD`/`USD`; set from the first payment; all payments must match |
| 9 | Blanks | 59-1464 | X(1406) | |

Detail `C`, segment 1 (fields 4-21 = **240 bytes**, positions 25-264):

| # | Position | Format | Description |
|---|---|---|---|
| 1 | 1 | X(1) | `C` = credit |
| 2 | 2-10 | N(9) | Record counter, sequential, RJ zero filled (first detail = 000000002) |
| 3 | 11-24 | X(14) | Payer Number (10) + File Creation Number (4) — header fields 3 and 4 |
| 4 | 25-27 | N(3) | Operation Code — `460` for Accounts Payable |
| 5 | 28-37 | N(10)V99 | Amount, RJ zero filled, 2 decimals implied, must be > 0 |
| 6 | 38-43 | N(6) | Transaction/payment date, Julian `0YYDDD` |
| 7 | 44-52 | N(9) | Beneficiary Institutional ID: `0` + `BBB` (Vendor Remit To → Financial Institution `VTO.FINANCIAL.NBR`) + `TTTTT` (Vendor Remit To → Transit Number `VTO.TRANSIT.NBR`) |
| 8 | 53-64 | X(12) | Beneficiary account number, LJ blank filled (`VTO.ACCNT.NBR`) |
| 9 | 65-86 | N(22) | Filler — 22 zeroes |
| 10 | 87-89 | N(3) | Stored Transaction Type — zero fill |
| 11 | 90-104 | X(15) | Originator Short Name, LJ blank filled (`BA.ORIGIN.SHORT.NAME`) |
| 12 | 105-134 | X(30) | Beneficiary (payee) name, LJ blank filled (`VTO.NAME`) |
| 13 | 135-164 | X(30) | Originator Long Name, LJ blank filled (`BA.ORIGIN.LONG.NAME`) |
| 14 | 165-174 | X(10) | Originator ID — Bank Settings → Payer Number |
| 15 | 175-193 | X(19) | Cross Reference Number (`ACR.APRVD.APR.KEY`) = Vendor ID (5) + File Number (`CP` + 6 digits = 8, `APR.PAY.REF`) + payment date YYMMDD (6) |
| 16 | 194-202 | N(9) | Payer Institutional ID for returns: `0` + `BBB` (`BA.FINANCIAL.NBR`) + `TTTTT` (`BA.PAYER.TRANSIT`) |
| 17 | 203-214 | X(12) | Payer account number for returns, LJ blank filled (`BA.ACCT.NBR`) |
| 18 | 215-229 | X(15) | Originator's Sundry Information — not used, blanks |
| 19 | 230-251 | X(22) | Blanks |
| 20 | 252-253 | X(2) | Blanks |
| 21 | 254-264 | N(11) | Invalid Field Indicator — zero fill |

Segments 2-6 repeat fields 4-21 at 265-504, 505-744, 745-984, 985-1224, 1225-1464 (payments #2-#6).
"A segment containing data may not follow a blank segment within the same record."

Trailer `Z`:

| # | Position | Format | Description |
|---|---|---|---|
| 1 | 1 | X(1) | `Z` |
| 2 | 2-10 | N(9) | Record counter, RJ zero filled |
| 3 | 11-24 | X(14) | Payer Number + File Creation Number |
| 4 | 25-38 | N(14)V99 | Total value of debit transactions — always zero |
| 5 | 39-46 | N(8) | Total number of debit transactions — always zero |
| 6 | 47-60 | N(14)V99 | Total value of credit transactions |
| 7 | 61-68 | N(8) | Total number of credit transactions |
| 8 | 69-82 | N(14) | Reserved, zeroes |
| 9 | 83-90 | N(8) | Reserved, zeroes |
| 10 | 91-104 | N(14) | Reserved, zeroes |
| 11 | 105-112 | N(8) | Reserved, zeroes |
| 12 | 113-1464 | X(1352) | Filler, zeroes |

Pre-flight validation: **Validate Bank for National Bank**
(`03-payables/052-validate-bank-for-national-bank.md`) requires Financial Institution, Transit Number,
Account Number, Payer Number, Destination Data Center, Originator Short Name, Originator Long Name,
Next EFT Payment Number, EFT File Format on the bank ("Required field 'XXX' is null in Bank X").
**Validate Vendor Remit To for National Bank**
(`03-payables/053-validate-vendor-remit-to-for-national-bank.md`) requires Financial Institution,
Transit Number, Account Number on the remit-to; failing remit-tos have all their bills removed from
the batch.

### 3.16 Other payment output files

- **Check Run File** — `Create Check Run File` button on the Check Review tab; requires a
  `Check Run File Format` chosen via `Select Bank Check Run File Format` in Bank Settings.
  **Layout not stated in this corpus.** (`03-payables/047-select-and-approve-bills-for-payment.md`)
- **TPA check export XML** — see §2.5. Element names not stated; the article names only
  `Vendor Remit To Number`, `Vendor Remit To Name`, address fields, `Customer Number`, and a pending
  check number.
- **Virtual card payment file / response file / reconciliation file** — Comdata is the named provider.
  Payment file: `.txt`, ≤25-char name, ASCII Export. Response file returns virtual card number,
  expiration date, issue date. Reconciliation file returns the post date and completes payments; "all
  records in the reconciliation file belong to the same account code" and one reconciliation file may
  span multiple payment files. **Layouts not stated in this corpus.**
  (`03-payables/059-virtual-card-processing.md`)
- **Bank transaction import** — automatic reconciliation takes a **CSV** from the bank
  (`03-payables/035-…`); manual match import takes a **tab-delimited text file**
  (`03-payables/034-import-and-match-bank-transactions.md`). Column layouts not stated; the validated
  fields are Transaction Type (mandatory), Document Number (mandatory for `CHK`, ≤20 chars),
  Transaction Date, Amount, Location, Deposit Type Code.

---

## 4. Reconciliation

### 4.1 Check reconciliation (check-number driven)

`Reconcile Checks` (`03-payables/044-reconcile-checks.md`) — Access
`Accounting > Payables > Process Checks > Reconcile Checks`. Inputs: Bank, Date Code, Starting/Ending
Check Date (active on `CUS`), Starting/Ending Check Number, `Include Checks` = All Checks /
Un-reconciled Only / Voided Only. Save searches for checks with status Printed, Reconciled or Voided
and opens:

`Accounts Payable Check Reconciliation Screen`
(`03-payables/000-accounts-payable-check-reconciliation-screen.md`) — grid of the check range,
pre-ticked for already-reconciled and voided checks, unticked for Printed. All / None buttons.
On Save, selected checks become `Reconciled` and unselected become `Printed`; un-ticking a voided
check has no effect on updates but raises a warning.

### 4.2 Bank transaction reconciliation

- **Reconcile Bank Transactions Manually** (`03-payables/043-reconcile-bank-transactions-manually.md`)
  — tabs `Set Filters` and `Reconcile`. Header: Bank, Statement Start/End, Starting Statement Balance
  (bank beginning balance + transactions reconciled before Statement Start; inactive for Automated
  Bank Download banks), Ending Statement Balance (≤13 numeric, inactive for auto-download), and
  `Ending Balance Proof` / `Transaction Proof`. Filters: Show Cleared, Sort By (Posted Date, BAI Code,
  Document Number, Transaction Type), BAI Code (auto banks only), Transaction Type, Containing Text,
  Document Number Equal/Less/Greater, Amount Equal/Less/Greater.
  Grid columns: Clr, Doc Nbr, Date, Amount, Location, BAI, Type, Reference.
  Marking: double-click → `P` (pending); for auto banks each time proof returns to zero all `P` flip
  to `R` and become a reconciled **batch** (un-reconciling one row un-reconciles the whole batch);
  `*` marks previously reconciled/voided rows. Manual banks do no automatic matching. Actions:
  `Create an Adjusting Record`, `Import and Match Bank Transactions` (only when Automated Bank
  Download is off).
- **Import Bank Transactions with Automatic Reconciliation**
  (`03-payables/035-import-bank-transactions-with-automatic-reconciliation.md`) — CSV from the bank;
  one-to-one matching first, then one-to-many/many-to-one deposit matching, both via the BAI-code ↔
  Transaction-Type cross-reference. Optional `Report Cleared Transactions` and
  `Report Reconciliation Errors` at the end. Re-run handling: `Abort` (no updates) or `Ignore`
  (clear `BANK.REC.AUTO`; when unmatched records exist, `Ignore` also un-reconciles what was already
  reconciled so the month can be restarted).
- **Import and Match Bank Transactions** (`03-payables/034-import-and-match-bank-transactions.md`) —
  tab-delimited upload for manual banks. Check rows match on Transaction Type + Document Number +
  Amount; other types match on Transaction Type + Amount + Date within the `Plus/Minus Days for Match`
  window from Bank Settings, with optional Document Number / Location / Deposit Type Code. Matches are
  flagged `R`; an error report lists the validation failures verbatim listed in the article.
- **Enter a Reconciliation Transaction** — see §1.9. GL effect in §7.
- **Reconciliation Detail Display - Read Only** (`03-payables/045-…`) — Record ID, Date, Document,
  BAI Code, Transaction Type, Deposit Type Code, Transfer Bank, Status, Amount, Detail/Reference.
- **Review Reconciled Batch - Read Only** (`03-payables/046-…`) — auto-reconciled banks only; shows
  the STORIS record plus the bank spreadsheet record(s) in the batch.
- **Purge Reconciled Transactions** (`03-payables/041-purge-reconciled-transactions.md`) — deletes
  transactions reconciled before a cutoff date **and rewrites the bank's beginning balance and
  as-of date** to that cutoff. Requires the `Change reconciliation beginning balance in Bank Settings`
  security action.
- Reporting: `Report Reconciliation Transactions`, `Report Cleared Transactions`,
  `Report Reconciliation Errors` (`01-views-and-reports/052-…`, `032-…`, `050-…`).

### 4.3 Void behaviour

| Routine | Scope | Restrictions | Effects |
|---|---|---|---|
| **Void Payment Screen** (`03-payables/062-void-payment-screen.md`) | One payment. Bank + Method (`CK`,`CC`,`OL`,`DC`,`CA`,`EFT`,`VC`) + Reference (≤25 alphanumeric) | Non-check methods with multiple matches route through the Payment Selection Screen | Backs out the payment on the AP bills and reverses the GL postings. Allowed in a sales overlap period |
| **Void Check Run** (`03-payables/060-void-check-run.md`) | Whole printed check run (Bank + Date + Time/Code) | Cannot void a Pending run; cannot void if it contains a reconciled check or a check applied to an **overpaid pending bill**; already-voided checks are skipped | Voids each payment, returns AP bills from history to Open, voids the batch's bank reconciliation transaction record, and posts a reversing GL batch per payment: **Debit AP Cash, Credit Accounts Payable** |
| **Void EFT Batch** (`03-payables/061-void-eft-batch.md`) | Whole completed EFT batch | Reconciled batches are not eligible | Voids each payment, moves AP bills from history back to `AP.BILL`, voids the batch's bank reconciliation record. GL: per payment **Debit EFT GL account, Credit Accounts Payable**; for the whole batch **Credit EFT GL account, Debit AP Cash** |
| **Virtual Card > Void Payment Batch** (`03-payables/059-virtual-card-processing.md`) | Whole virtual card batch | Only `Transmitted` or `Completed` batches; not `Pending`/`Voided`; not if a payment is applied to an overpaid pending bill; once any payment is Completed you must void payment-by-payment via Void Payment Screen. With Comdata, void at Comdata **first** | Voids each payment, reinstates AP bills in history to Open, writes a void comment to AP Bill Comments |
| **Print Checks void** | Individual check numbers during a failed print | — | Voided numbers can never be reused; "cleared" numbers can |

---

## 5. Vendor-side data

### 5.1 Vendor invoice fields

See the table in §1.2 plus the Check Information tab
(`03-payables/031-enter-update-individual-vendor-invoice.md`): Remittance (display), `Pay` (remit-to
code, with View/Update/New Remit-to actions), `Comment` (default check print comment), `Bank`,
`Pay Date`, `Amount` (terms amount), `Quick Check Active`, `Separate Check`, `Terms`,
`Payment Schedule` grid (Due Date, Amount, Date Paid, populated only for Scheduled Payment terms),
`Invoice Date`, `Due Date`, `Terms Date`, `Discount`, and the Alternate Payment Method block.

### 5.2 Terms

- Terms code defaults from the **first line item of the purchase order**, if available.
- With multiple POs for the same remit-to carrying different terms, the bill uses the **vendor's**
  terms; if the vendor has none, the terms from **Payables Control Settings**.
- Terms drive Due Date, Terms Date (discount date) and Discount.
- `Amount` on the Check Information tab is the **terms amount** — freight is included only when
  `Advanced - Include Freight in Terms Amount` is enabled in Payables Control Settings; sales tax and
  miscellaneous are never included.
- For freight bills, when `Freight in Terms Amount` is **not** enabled, "the system defaults the pay
  date instead of the terms date".
- Terms of type "Scheduled Payment" populate the Payment Schedule grid.
- Payment selection can drive off Due Date, Terms Date, or Anticipated Pay Date
  (`03-payables/047-select-and-approve-bills-for-payment.md`).

### 5.3 Discounts

- Discount amount and Terms Date carry on the bill; the Bill Approval grid shows a signed (always
  negative) Discount column.
- `Bills With Terms Only` restricts selection to bills with discounts.
- `Always Take Terms` takes the discount regardless of the payment date.
- Per-bill override: `Take Discount` / `Take Override` on the Payment Register Maintenance Screen and
  the Payment Review Screen, active only when the payment date is past the Terms Date
  (`03-payables/037-…`, `03-payables/038-…`).
- Discounts are unavailable on partially paid bills.

### 5.4 Charge distribution to GL

- **Disburse Payable Invoice Charges** (`03-payables/024-disburse-payable-invoice-charges.md`) —
  multiple charge codes per bill, grouped by Type (Freight, Sales Tax, Miscellaneous). Fields: Type,
  Charge (code, validated against the invoice-charge codes for that type), `$` (must be > 0), Add.
  Grid: Type, Invoice Charge, Amount, Description. Not available under TPA.
- Standard codes: `FREIGHT`, `TAX`, `MISCELLANEOUS`; defaulted in approval mode and on unlinked
  expense bills. `Default Invoice Charges to Inactive` (Payables Control Settings) hides them; the
  `Activate Invoice Charges` action re-enables them per bill.
- Summary GL hits are held in the AP bill header and can be edited before filing via the
  `GL Postings` action (see §7).

### 5.5 Alternate payment methods (manual payments recorded on the bill)

(`03-payables/031-enter-update-individual-vendor-invoice.md`) Gated by
`Select alternate payment methods during vendor invoice entry` in Payables Security.

| Method | GL treatment | Document types |
|---|---|---|
| Manual Check | Credits the Bank Payables Cash GL account | Invoice only |
| Debit Card | Same as manual check | Credit & Invoice |
| Cash | Credits the Paid with Cash GL account | Invoice only |
| Credit Card | Credits the Paid with Credit Card GL account | Credit & Invoice |
| On Line | No GL hit until the payment date, then same as manual check | Credit & Invoice |

Required sub-fields: Reference (≤25 alphanumeric — manual check number must be numeric), Date (may be
past but not in a closed sales period), Amount. Only Manual Check and Cash are allowed on refund
bills. Not available for vendor credit bills. **Credit card and cash payments cannot be included in
the Bank Reconciliation.**

### 5.6 Virtual card payments

Covered in §1.8 and §4.3. Additional inquiry: **View Virtual Card Payment Status**
(`03-payables/057-view-virtual-card-payment-status.md`) — filters Bank, Date Code / Start / End,
Starting / Ending Payment Number, statuses Transmitted / Completed / Voided; grid columns Payment
Number, Status, Date, Vendor, Invoice Numbers, Amount, Virtual Credit Card Numbers, Expiration Date
(MM/YY), Issue Date, Post Date (the date funds actually transferred).
**Virtual Card Batch Number Lookup** (`03-payables/058-…`) — Batch Number, Date, Time/Code, Amount.
Comdata error handling: payments in the response-file error report are auto-voided with error code
`STOR` and a void comment on each bill; those must be voided manually with Comdata. A payment present
in the payment file but missing from the response file is auto-voided.

### 5.7 Remittance advice email

`Email Remittance Advice` (`03-payables/026-email-remittance-advice.md`) — Access
`Accounting > Payables > Process Checks > Electronic Funds Transfer > Email Remittance Advice`.
EFT only, completed batches only. Content per the article:
- Recipient: the vendor remit-to `Email Address`; the article also says the email "is sent to each
  email stored in the **Other** field in Vendor RemitTo Settings" — two different fields are named,
  reconcile against the live Vendor Remit-To screen.
- Subject line includes the bank used or the bank's company name.
- Line above the table: EFT Payment Number, Remit To Name, payment date.
- Table per AP bill: AP Bill Number, Invoice Number, Invoice Date, Payment Amount, Discount Amount,
  Net Amount, Remittance Comment.
- HTML or plain text depending on the server OS.
- Copy address: `Copy Emailed EFT Remittance Advice To` in Payables Control Settings.
- Requires `STORIS Server Can Send Emails` on the Email Configuration tab of
  Notifications Control Settings.
- Writes a comment to every AP bill on the payment: "Remittance Advice for EFT payment NNN emailed to
  Vendor Remit To XXXX."
- Grid: Details (→ Payment Inquiry), EFT Number, Remit To, Vendor, Amount, Status, Emailed Date.
- Can also be triggered inline from Create Electronic Funds Transfer File.

---

## 6. 1099

Coverage in this corpus is thin. What is documented:

- **Report 1099 and Payables History**
  (`01-views-and-reports/018-report-1099-and-payables-history.md`) — menu label
  `Accounting > Payables > Payables Views and Reports > Report 1099 Vendors and Payables History`.
  Reports **calendar-year** payables totals to vendors; sorts, breaks and totals by vendor class.
  Options: Vendor, Vendor Class, `1099 Vendors Only` checkbox, `Payables Year` (4-digit calendar year,
  **"You can only report on the previous two years"**), `Print Remit-To` (prints complete name and
  address for each remit-to), Send Output To, Export Path.
- The existence of the `1099 Vendors Only` filter implies a **1099 flag on the vendor master**; the
  field name and its location are **not stated in this corpus** (Vendor Settings is not in the
  corpus).
- **Calendar-year basis is explicit**: "The system uses the calendar total as opposed to fiscal year
  total because 1099 amounts are calendar-based" — View a Vendor's Payable Activity, Summary tab,
  which shows `Calendar YTD Dollars` and `Previous Year Dollars`
  (`01-views-and-reports/077-view-a-vendors-payable-activity.md`; same pair as `Current YTD` /
  `Previous Year` in `01-views-and-reports/097-view-vendor-bills.md`).

Not documented anywhere in this corpus: 1099 box/type codes, TIN storage, IRS form printing, 1099
electronic filing, corrections, or a 1099 threshold setting. See Open questions.

---

## 7. GL touchpoints

| Event | GL effect | Source |
|---|---|---|
| File an AP bill (non-pending) | Posts to GL **immediately upon filing**. Summary GL hits are stored in the AP bill header and are editable before filing via the `GL Postings` action. The GL Postings screen appears when filing any bill other than a pending bill | `03-payables/031-enter-update-individual-vendor-invoice.md` |
| Recurring invoice | GL hits on the day EOD creates the bill; adjustment hits on the adjustment date. The `GL Account` field is the offset to AP; Single or Multiple GL Account Entry available (Multiple requires a payment amount and is unavailable for Varying Amount type). Payment amount defaults as a **credit to AP**; you enter debit accounts to offset | `03-payables/029-enter-a-recurring-vendor-invoice.md` |
| Change exchange rate on a bill | "recalculates all domestic amounts and updates the appropriate GL accounts" | `03-payables/031-…` |
| Check payment | GL hits are not determined while the payment is Pending — the `General Ledger` action on Payment Register Maintenance / Payment Review is disabled for Pending payments | `03-payables/037-…`, `03-payables/038-…` |
| EFT payment | Per payment: **Dr Accounts Payable / Cr EFT GL Account**. Per batch: **Dr EFT GL Account / Cr AP Cash Account**. One bank reconciliation record for the batch total | `03-payables/022-create-electronic-funds-transfer-file.md` |
| Void check run | Per payment reversing batch: **Dr AP Cash / Cr Accounts Payable**; bank rec transaction voided | `03-payables/060-void-check-run.md` |
| Void EFT batch | Per payment: **Dr EFT GL account / Cr Accounts Payable**; per batch: **Cr EFT GL account / Dr AP Cash**; bank rec record voided | `03-payables/061-void-eft-batch.md` |
| Virtual card | "GL is posted" at Import Response File | `03-payables/059-virtual-card-processing.md` |
| Manual/alternate payment on a bill | Manual Check & Debit Card → Cr Bank Payables Cash; Cash → Cr Paid with Cash; Credit Card → Cr Paid with Credit Card; On Line → no hit until payment date | `03-payables/031-…` |
| Bank reconciliation transaction | On Save: a posting batch generates (two for EFT/transfer transactions); the bank's **Cash in the Bank** account is debited/credited and the offset comes from `Reconciliation Transaction Type Settings`. If default postings exist and security allows, the GL Account Entry Screen opens for correction. Delete posts a reversal of all original postings | `03-payables/028-enter-a-reconciliation-transaction.md` |
| Transfer between banks | Two mirrored records are written (debits/credits reversed for the transfer bank); edits and deletes apply to both | `03-payables/028-…` |
| TPA bad-batch repair | `TPA AP Bill GL Postings Screen` fixes postings to the default account only | `00-accounting/007-tpa-ap-bill-gl-postings-screen.md` |

GL reporting from AP: `Report Distribution to General Ledger`
(`01-views-and-reports/040-report-distribution-to-general-ledger.md`) — reports GL postings associated
with AP bills for a post-date range, also run during End-of-Month for the closing period; break-on
Complete Account / Root Account / Sub-Account / Cost Center; Summary Only; Include Detail Remarks.
`Report Payables Activity` and `Report Cash Disbursements` both offer `Print GL Recap` /
`Print GL Detail` (`01-views-and-reports/044-…`, `026-…`).

Period control: AP bill dates, pay dates and reconciliation-transaction dates must be in an **open
sales period** (reconciliation dates: no earlier than the first day of the current open GL period, no
later than today). Voids are explicitly permitted in a **sales overlap period**.

---

## 8. Control settings referenced

### Payables Control Settings

| Field | Controls | Cited in |
|---|---|---|
| `Next Number` | Next AP bill number | `031` |
| `AP Prompt for Company` (+ adjacent `Company`) | Whether the expense company is prompted or defaulted under multi-company | `031` |
| `Display` | Whether grids show vendor model number or product code | `003`, `005` |
| Pending bill conversion allowable cost variance percent | `COST NM` exception threshold in Convert Pending Bills | `020` |
| `Allow Payment of Pending Bills` | Enables `Pay Prior to Receipt` on pending bills | `031` |
| Default terms code | Fallback terms when PO and vendor have none | `031` |
| Default bank | Last fallback in the check-print bank cascade | `029`, `031` |
| `Default Vendor Remit To` | Auto-populate the remit-to on a new AP bill | `031` |
| `Freight in Terms Amount` / `Advanced - Include Freight in Terms Amount` | Whether freight is in the terms amount; also flips freight bills to pay-date defaulting | `031` |
| `Default Invoice Charges to Inactive` | Hides the three standard charge fields | `031` |
| `Sort Detail Lines on Stub by` (Advanced tab) | Stub detail order; also grid order on Check Review / Bill Approval and on Report Payables Disbursement | `040`, `047`, `01/046` |
| `Print Checks by Descending Amount` | Check print order (overridden by `Sort Checks by Bill Number`) | `040` |
| `Print Refunds at End of Check Run` | Refund check placement | `040`, `01/046` |
| `Detail Lines on Stub` | Threshold for `Limit Detail to One Check` | `040` |
| Check Forms vs. Enhanced Laser (Forms Designer) | Check layout engine | `040` |
| `Bill Aging Method` / `Bill Aging Days` (Advanced page) | Aging buckets and default aging method on AP reports and vendor inquiries | `01/029`, `01/045`, `01/077`, `01/097` |
| `Copy Emailed EFT Remittance Advice To` | BCC address for remittance advice | `022`, `026` |
| `Email Header Message for Remittance Advice`, `Email Sent By for Remittance Advice`, `Email Subject for Remittance Advice` | Remittance email composition | `026` |

### Bank Settings

| Field / tab | Controls | Cited in |
|---|---|---|
| `Next Check Number` | Default starting check number | `040` |
| `Allow Multiple Payment Batches` | Time-keyed vs. Code-keyed batches; multiple pending batches per bank | `023`, `040`, `042`, `047`, `01/046` |
| `EFT File Format` | Bank is EFT-capable; drives the EFT layout | `022`, `023`, `026` |
| `Positive Pay File Format` (EFT and Positive Pay tab) | Bank appears in Create Bank Check File; enables Test Mode (BMO only) | `021` |
| `Positive Pay Bank Identifier` (EFT and Positive Pay tab) | Customer short name / DCS Customer ID in BMO formats | `007`, `008`, `009` |
| `Alternate Account Number` (EFT and Positive Pay tab) | Overrides Account Number in BMO formats | `007`, `008` |
| `Virtual Card File Format` | Bank is virtual-card capable | `023`, `059` |
| `Export Checks` (Third Party Processing tab) | Forces Check-only batches; routes Print Checks to Export Payable Checks | `023`, `032`, `047` |
| `Check Run File Format` (via `Select Bank Check Run File Format`) | Enables the Create Check Run File button | `047` |
| `Automated Bank Download` | Auto vs. manual reconciliation behaviour; disables statement balance entry; hides the Import and Match action | `034`, `043` |
| `Plus/Minus Days for Match` | Date tolerance for non-check import matching | `034` |
| Beginning balance + as-of date | Reconciliation starting balance; rewritten by Purge Reconciled Transactions | `041`, `043` |
| Bank↔Company association | Restricts the bank list under multi-company | `031` |
| `Payer Number`, `Financial Institution`, `Transit Number`, `Account Number`, `Destination Data Center`, `Originator Short Name`, `Originator Long Name`, `Next EFT Payment Number`, `Alternate ID` | National Bank EFT and ABA field sources; validated pre-flight | `019`, `033`, `052`, `018` |

### Vendor Settings / Vendor Remit-To Settings

`Separate Check per Bill`, `Free Freight Minimum`, `Display Comments`, `Currency`,
`Suppress Invoice Details on Checks`, default terms, default bank
(`031`, `040`, `047`, `01/046`); remit-to `Default Payment Methods`, `Email Address`, `Other` (email),
default bank, EFT `Financial Institution` / `Transit Number` / `Account Number`
(`047`, `026`, `053`, `033`).

### Other control settings

| Setting | Controls | Cited in |
|---|---|---|
| `Multi Company Processing` (General System Control Settings, Advanced Setting tab) | Multi-company AP behaviour throughout | `031` |
| `RECEIVING – Supply Purchase Orders must be Received` (Purchasing Control Settings) | Supply AP bill defaults to quantity received | `030`, `031` |
| `Imbedded National Tax` (Point of Sale Control Settings) | Activates the `Taxable` flag on AP bill lines | `031` |
| `STORIS Server Can Send Emails` (Notifications Control Settings, Email Configuration tab) | Required for remittance advice email | `022`, `026` |
| Sales Tax Settings (national tax rate) | Rate used for the AP line `Taxable` calculation | `031` |
| Country Settings | Actual exchange rate source | `001` |
| `Reconciliation Transaction Type Settings` | Offset GL account per transaction type; `Post to General Ledger` default; `Transfer Bank Required` | `028` |
| Company Settings | Bank fallback under multi-company | `031` |
| Third-Party Accounting Control Settings (Generic tab) | Blocks deletion of transmitted AP bills | `00/009` |
| Dynamic Tab Settings (DTS Setup) | Shape of the vendor DTS inquiries | `01/077`, `01/096` |

### Security (Create a User/Group Actions – Payables Security / Extended Security)

`Print accounts payable checks` · `Print refund checks` · `Approve refund bills` ·
`Change transaction entry date for new payable bills` ·
`Select alternate payment methods during vendor invoice entry` ·
`Create vendor remit-to addresses during vendor invoice entry` ·
`Change reconciliation beginning balance in Bank Settings` ·
`Delete payable bills after third party accounting transmission` ·
`Change Exchange Rate During Vendor Invoice Entry` ·
`Change product replacement cost during vendor invoice entry` ·
`Able to Create AP Bill Vendor On the Fly` (User settings) ·
General Ledger User Permissions and GL Account Staff Security (apply to the GL Account fields and to
Report Distribution to General Ledger).
Sources: `029`, `031`, `040`, `041`, `042`, `047`, `051`, `00/009`, `01/040`.

---

## 9. Menu paths (`Access` per article)

| Article file | Title | Access path |
|---|---|---|
| `03-payables/000-…-check-reconciliation-screen.md` | Accounts Payable Check Reconciliation Screen | Reconcile Checks > Save |
| `03-payables/001-actual-exchange-rate-lookup.md` | Actual Exchange Rate Lookup | Enter/Update Individual Vendor Invoice > General tab > Exchange Rate > Search |
| `03-payables/002-add-bills-to-existing-check-run.md` | Add Bills to Existing Check Run | Select and Approve Bills for Payment > Bill Approval tab > Add Bill |
| `03-payables/003-ap-approval-selection-screen.md` | AP Approval Selection Screen | Enter Multiple Vendor Invoices, Step 2 |
| `03-payables/004-ap-check-approval-bill-selection.md` | AP Check Approval Bill Selection | Add Bills to Existing Check Run > Action at Select Bill(s) |
| `03-payables/005-ap-select-available-screen.md` | AP Select Available Screen | Enter/Update Individual Vendor Invoice > Product field > Action (type 1 bills) |
| `03-payables/006`–`019` | Bank Check File Format – 14 banks | Reference topics; no menu path (reached from Create Bank Check File) |
| `03-payables/020-convert-pending-bills.md` | Convert Pending Bills | Accounting > Payables > Convert Pending Bills · Accounting > Third Party Accounting > Payables > Convert Pending Bills |
| `03-payables/021-create-bank-check-file.md` | Create Bank Check File | Accounting > Payables > Process Checks > Create Bank Check File |
| `03-payables/022-create-electronic-funds-transfer-file.md` | Create Electronic Funds Transfer File | Accounting > Payables > Process Checks > Electronic Funds Transfer > Create Electronic Funds Transfer File · EFT Review tab > Create EFT File |
| `03-payables/023-date-for-new-batch-window.md` | Date For New Batch Window | Select and Approve Bills for Payment, when no pending run exists for the bank |
| `03-payables/024-disburse-payable-invoice-charges.md` | Disburse Payable Invoice Charges | Enter/Update Individual Vendor Invoice > Action at Freight/Sales Tax/Miscellaneous · Actions > Maintain Header Charges |
| `03-payables/025-eft-batch-lookup.md` | EFT Batch Lookup | Void EFT Batch > EFT Batch Number > Search |
| `03-payables/026-email-remittance-advice.md` | Email Remittance Advice | Accounting > Payables > Process Checks > Electronic Funds Transfer > Email Remittance Advice |
| `03-payables/027-enter-a-check-payment-update.md` | Enter a Check Payment Update | Customer > Electronic Interfaces > Check > Enter a Check Payment Update *(customer check authorisation — AR/POS, not AP)* |
| `03-payables/028-enter-a-reconciliation-transaction.md` | Enter a Reconciliation Transaction | Accounting > Payables > Reconcile Bank Transactions > Enter a Reconciliation Transaction |
| `03-payables/029-enter-a-recurring-vendor-invoice.md` | Enter a Recurring Vendor Invoice | Accounting > Payables > Enter a Recurring Vendor Invoice |
| `03-payables/030-enter-multiple-vendor-invoices.md` | Enter Multiple Vendor Invoices | Accounting > Payables > Enter Multiple Vendor Invoices · Accounting > Third Party Accounting > Payables > Enter Multiple Vendor Invoices |
| `03-payables/031-enter-update-individual-vendor-invoice.md` | Enter/Update Individual Vendor Invoice | Accounting > Payables > Enter/Update Individual Vendor Invoice · Accounting > Third Party Accounting > Payables > Enter/Update Individual Vendor Invoice |
| `03-payables/032-export-payable-checks.md` | Export Payable Checks | Accounting > Payables > Process Checks > Export Checks > Export Payable Checks · Check Review tab > Print Checks (when Export Checks is on) |
| `03-payables/033-format-eft-data-for-national-bank.md` | Format EFT Data for National Bank | Reference topic; no menu path |
| `03-payables/034-import-and-match-bank-transactions.md` | Import and Match Bank Transactions | Reconcile Bank Transactions Manually > Reconcile tab > global Actions |
| `03-payables/035-import-bank-transactions-with-automatic-reconciliation.md` | Import Bank Transactions with Automatic Reconciliation | Accounting > Payables > Reconcile Bank Transactions > Reconcile Bank Transactions Automatically > Import Bank Transactions with Automatic Reconciliation |
| `03-payables/036-import-completed-checks.md` | Import Completed Checks | Accounting > Payables > Process Checks > Export Checks > Import Completed Checks |
| `03-payables/037-payment-register-maintenance-screen.md` | Payment Register Maintenance Screen | Select and Approve Bills for Payment > Check Review tab > double-click a row |
| `03-payables/038-payment-review-screen.md` | Payment Review Screen | Enter/Update Individual Vendor Invoice > Check Information tab > Actions > View Payments |
| `03-payables/039-payment-selection-screen.md` | Payment Selection Screen | Void Payment Screen, non-check method with multiple bills |
| `03-payables/040-print-checks.md` | Print Checks | Accounting > Payables > Process Checks > Print Checks |
| `03-payables/041-purge-reconciled-transactions.md` | Purge Reconciled Transactions | Accounting > Payables > Reconcile Bank Transactions > Purge Reconciled Transactions |
| `03-payables/042-quick-check-processing.md` | Quick Check Processing | Enter/Update Individual Vendor Invoice > Check Information tab > Quick Check Active |
| `03-payables/043-reconcile-bank-transactions-manually.md` | Reconcile Bank Transactions Manually | Accounting > Payables > Reconcile Bank Transactions > Reconcile Bank Transactions Manually |
| `03-payables/044-reconcile-checks.md` | Reconcile Checks | Accounting > Payables > Process Checks > Reconcile Checks |
| `03-payables/045-reconciliation-detail-display-read-only.md` | Reconciliation Detail Display - Read Only | Reconcile Bank Transactions Manually > Reconcile tab > row > More Details |
| `03-payables/046-review-reconciled-batch-read-only.md` | Review Reconciled Batch - Read Only | Reconcile Bank Transactions Manually > Reconciliation tab > double-click a reconciled row (auto banks) |
| `03-payables/047-select-and-approve-bills-for-payment.md` | Select and Approve Bills for Payment | Accounting > Payables > Process Checks > Select and Approve Bills for Payment |
| `03-payables/048-toggle-currency-action.md` | Toggle Currency Action | Actions button on vendor / AP bill / vendor activity screens |
| `03-payables/049-update-bill-comments.md` | Update Bill Comments | Accounting > Payables > Update Bill Comments · Accounting > Third Party Accounting > Payables > Update Bill Comments |
| `03-payables/050-update-comments.md` | Update Comments | View AP Bill > General tab Actions > AP Bill Comments (also PO, credit applications, shopping carts) |
| `03-payables/051-update-customer-remit-to.md` | Update Customer Remit-To | Enter/Update Individual Vendor Invoice > RFND vendor > Action at Pay > Update Remit-to |
| `03-payables/052-validate-bank-for-national-bank.md` | Validate Bank for National Bank | Invoked from Select and Approve Bills for Payment |
| `03-payables/053-validate-vendor-remit-to-for-national-bank.md` | Validate Vendor Remit To for National Bank | Invoked from Select and Approve Bills for Payment on `Select Bills` |
| `03-payables/054-view-and-manage-ap-bills.md` | View and Manage AP Bills | **Access path not stated in article** |
| `03-payables/055-view-payment-screen.md` | View Payment Screen | Accounting > Payables > Process Checks > View Payment |
| `03-payables/056-view-payments-screen.md` | View Payments Screen | Enter/Update Individual Vendor Invoice (or View AP Bill) > Check Information tab > Actions > View Payments, when >1 payment |
| `03-payables/057-view-virtual-card-payment-status.md` | View Virtual Card Payment Status | **Access path not stated in article** |
| `03-payables/058-virtual-card-batch-number-lookup.md` | Virtual Card Batch Number Lookup | Virtual Card Processing > Virtual Card Batch Number > Search |
| `03-payables/059-virtual-card-processing.md` | Virtual Card Processing | **Menu path not stated**; also reached from Select and Approve Bills for Payment > Virtual Card Review |
| `03-payables/060-void-check-run.md` | Void Check Run | "Menu" (exact path not stated) |
| `03-payables/061-void-eft-batch.md` | Void EFT Batch | Accounting > Payables > Process Checks > Electronic Funds Transfer > Void EFT Batch |
| `03-payables/062-void-payment-screen.md` | Void Payment Screen | Accounting > Payables > Process Checks > Void Checks |

AP-relevant paths outside `03-payables/`:

| Article | Access path |
|---|---|
| `01-views-and-reports/018-report-1099-and-payables-history.md` | Accounting > Payables > Payables Views and Reports > Report 1099 Vendors and Payables History |
| `01-views-and-reports/026-report-cash-disbursements.md` | Accounting > Payables > Payables Views and Reports > Cash Flow Reports > Report Cash Disbursements |
| `01-views-and-reports/029-report-cash-requirements.md` | Accounting > Payables > Payables Views and Reports > Cash Flow Reports > Report Cash Requirements |
| `01-views-and-reports/032-report-cleared-transactions.md` | Accounting > Payables > Reconcile Bank Transactions > Reconcile Bank Transactions Automatically > Report Cleared Transactions |
| `01-views-and-reports/040-report-distribution-to-general-ledger.md` | Accounting > Payables > Payables Views and Reports > Report Distribution to General Ledger (also two GL paths) |
| `01-views-and-reports/043-report-payable-approvals-on-hold.md` | Accounting > Third Party Accounting > Payables > Payables Views and Reports > Report Payable Approvals on hold |
| `01-views-and-reports/044-report-payables-activity.md` | Accounting > Payables > Report Payables Activity |
| `01-views-and-reports/045-report-payables-aged-trial-balance.md` | Accounting > Payables > Payables Views and Reports > Generate a Trial Balance |
| `01-views-and-reports/046-report-payables-disbursement.md` | Accounting > Payables > Payables Views and Reports > Report Payables Disbursement (also fires after a successful check run) |
| `01-views-and-reports/050-report-reconciliation-errors.md` | Accounting > Payables > Reconcile Bank Transactions > Reconcile Bank Transactions Automatically > Report Reconciliation Errors |
| `01-views-and-reports/052-report-reconciliation-transactions.md` | Accounting > Payables > Reconcile Bank Transactions > Report Reconciliation Transactions |
| `01-views-and-reports/077-view-a-vendors-payable-activity.md` | Accounting > Payables > View a Vendor's Payable Activity (also under Payables Views and Reports) |
| `01-views-and-reports/080-view-ap-bill.md` | Accounting > Payables > View AP Bill (also under Payables Views and Reports) |
| `01-views-and-reports/083-view-check-status-and-payment-details.md` | Accounting > Payables > Process Checks > View Check Status and Payment Details (also under Payables Views and Reports; also from Create EFT File) |
| `01-views-and-reports/098` / `099` | Enter/Update Individual Vendor Invoice > Bill field > Search > View Vendor Closed/Open Bills |
| `00-accounting/002-import-vendors-from-third-party-accounting.md` | Accounting > Third Party Accounting > General Ledger > Import Vendors from Third-Party Accounting |
| `00-accounting/009-update-approved-customer-refunds.md` | Accounting > Third Party Accounting > Payables > Update Approved Customer Refunds |

---

## 10. Cutover implications (LA Mattress legacy → STORIS)

Everything in this section that is not directly quoted from an article is marked **INFERRED**.

### 10.1 Vendor master conversion

- Load vendors before any AP data. Each vendor needs at least one remit-to; STORIS auto-creates
  remit-to `1` at vendor creation (`03-payables/029-enter-a-recurring-vendor-invoice.md`) — decide
  whether legacy remit addresses map onto `1` or onto additional IDs. **INFERRED:** remit-to IDs are
  the join key for bills, default banks, EFT coordinates and remittance emails, so they must be stable
  from day one.
- Vendor code appears to be a 5-character key
  (`00-accounting/002-import-vendors-from-third-party-accounting.md` builds one as 3 alpha + 2
  digits; `03-payables/033-format-eft-data-for-national-bank.md` describes the cross-reference number
  as "Vendor ID – key to the VENDOR record (5 characters)"). **INFERRED:** budget for a legacy→STORIS
  vendor code crosswalk; 5 characters will collide for a large vendor list.
- Reserve/verify the special **RFND** vendor before converting customer refunds.
- Per-vendor attributes that change payment behaviour and must be converted deliberately:
  terms code, `Separate Check per Bill`, `Free Freight Minimum`, `Currency`, default bank,
  `Suppress Invoice Details on Checks`, vendor class, and the 1099 flag implied by
  `01-views-and-reports/018-report-1099-and-payables-history.md`.
- Remit-to EFT fields (`Financial Institution`, `Transit Number`, `Account Number`) and
  `Default Payment Methods` must be populated before the first EFT batch, or those bills get silently
  stripped from the batch with the message documented in
  `03-payables/053-validate-vendor-remit-to-for-national-bank.md`.
- There is **no documented vendor import utility for the STORIS-native path** in this corpus. The only
  import described is `Import Vendors from Third Party Accounting` (QuickBooks → STORIS), which
  "overwrites vendors in STORIS", is a one-time startup routine, and mints its own vendor codes
  (`00-accounting/002-…`). Ask STORIS for the supported conversion mechanism.

### 10.2 Open AP balances

- The unit of conversion is the **AP bill**. Open bills carry: vendor, remit-to, invoice number,
  invoice date, terms, due date, terms date, discount, bill type, company, bank, open amount, hold
  code, and (optionally) line detail.
- **INFERRED:** convert open bills as **type 02 Expense/Invoice** unlinked expense bills entered
  through `Enter/Update Individual Vendor Invoice` — that is the only entry point in this corpus that
  creates a bill without a purchase order. Merchandise bills (type 01) can only be created through the
  AP approval path against PO receipts, which will not exist for historical invoices.
- Consequence: **converted bills will not carry the legacy bill type** (Merchandise, Direct Ship, EDI,
  COM, etc.) unless STORIS provides a conversion loader. That affects `Include Payments` /
  `Include Credits` filtering in Select and Approve Bills for Payment and every bill-type-filtered
  report. Decide up front whether bill type fidelity matters for LA Mattress reporting.
- Every bill files a GL posting immediately (`03-payables/031-…`). **INFERRED:** point the conversion
  bills' offset at an AP conversion/suspense account rather than real expense accounts, then clear the
  suspense against the opening trial balance, otherwise conversion doubles P&L.
- The bill date must be in an **open sales period**; the pay date likewise. **INFERRED:** open the
  conversion period before loading and plan the GL period calendar around the cutover date.
- Bills already partially paid in the legacy system: the invoice date becomes uneditable once payments
  exist (`03-payables/031-…`). **INFERRED:** load the net open amount as a single bill rather than
  loading gross + a partial payment.
- Credits/debit memos: load as the matching credit type. Watch the negative-payment guard —
  `Exclude Credits Resulting in Negative Checks` and the highlighted-row block on
  `Print Checks`/`Create EFT File` (`03-payables/047-…`) will stall the first check run if a vendor's
  credits exceed its invoices.
- Held bills: load the hold code with the bill, or plan a post-load pass through
  `View and Manage AP Bills` (which can only *remove* hold in bulk, not apply it —
  `03-payables/054-…`). **INFERRED:** hold codes must exist as reference data first.
- Aged trial balance validation: `Report Payables Aged Trial Balance`
  (`01-views-and-reports/045-…`) with `Aging Type = Past Due` is the natural tie-out against the
  legacy AP aging. Note the article's warning: "AP bills that were back-dated may not be included on
  the report if they were not active on or before the As Of Date that you specify."

### 10.3 In-flight check runs

- **Do not convert mid-flight check runs.** STORIS enforces one pending payment batch per bank unless
  `Allow Multiple Payment Batches` is on (`03-payables/047-…`), and a check-run print cannot be
  saved and resumed (`03-payables/040-…`). **INFERRED:** finish, print and reconcile every legacy
  check run in the legacy system before go-live; start STORIS with zero pending batches.
- If a virtual card batch is in flight, note the hard block: no other payment batch of any type can be
  created for that bank until the current batch is `Completed`
  (`03-payables/059-virtual-card-processing.md`).
- Checks issued in the legacy system but not yet cleared still need to reconcile in STORIS.
  **INFERRED:** either (a) load them as outstanding bank reconciliation records via
  `Enter a Reconciliation Transaction` with `Post to General Ledger` **unchecked** (the flag exists
  precisely so a record can be created without a GL hit — `03-payables/028-…`), or (b) leave them to
  clear against the legacy bank account. Option (a) is what makes the STORIS bank rec tie to the first
  post-cutover statement.

### 10.4 Check number sequences

- `Next Check Number` lives on the **bank**, and Print Checks will only let you increase the starting
  number (`03-payables/040-…`). Set each bank's next check number to the true next unused stock
  number at go-live.
- Voided numbers can never be reused; "cleared" numbers can. **INFERRED:** if legacy voids exist in
  the number range being carried forward, do not attempt to represent them — just start above them.
- Under TPA export/import the STORIS check number is **adopted from the third-party package**, with
  `ACH`/`WIR` prefixes added (`03-payables/036-…`). **INFERRED:** if LA Mattress prints checks
  through a TPA, the STORIS `Next Check Number` matters far less than the TPA's sequence.
- Manual/alternate-payment check numbers are free text (must be numeric for Manual Check) and are not
  drawn from the bank sequence (`03-payables/031-…`). **INFERRED:** guard against manual checks
  colliding with the printed-check range — the Print Checks void logic explicitly checks for this.

### 10.5 Bank setup

Per bank, before go-live:
- Account Number, `Next Check Number`, company association, currency (one currency per bank — a
  foreign-currency vendor needs its own bank, `03-payables/036-…`).
- `Allow Multiple Payment Batches` — decide early; it changes the batch key from Date+Time to
  Date+Code and changes several screen labels (`023`, `040`, `047`).
- Positive pay: `Positive Pay File Format`, `Positive Pay Bank Identifier`,
  `Alternate Account Number` (`021`, `007`–`009`).
- EFT: `EFT File Format`, `Next EFT Payment Number`, plus the National Bank / ABA field set
  (`Payer Number`, `Financial Institution`, `Transit Number`, `Destination Data Center`,
  `Originator Short Name`, `Originator Long Name`, `Alternate ID`) — validated pre-flight
  (`052`, `033`, `019`).
- Virtual card: `Virtual Card File Format` (`023`, `059`).
- TPA: `Export Checks` on the Third Party Processing tab (`023`, `032`).
- Reconciliation: `Automated Bank Download`, `Plus/Minus Days for Match`, reconciliation beginning
  balance and as-of date (`034`, `041`, `043`).
- Check stock: standard stock with pre-printed check, routing and account numbers is required for both
  the Check Forms and Enhanced Laser (Forms Designer) options (`040`). **INFERRED:** order and test
  stock well before cutover; alignment printing consumes check numbers.
- **INFERRED:** run `Create Bank Check File` in Test Mode where the format supports it (BMO only) and
  otherwise send a sample positive-pay file to each bank for certification before the first live run.

### 10.6 1099 YTD carry-in

- STORIS reports 1099 totals on a **calendar year** basis and "you can only report on the previous two
  years" (`01-views-and-reports/018-report-1099-and-payables-history.md`).
- The vendor inquiries expose `Calendar YTD Dollars` and `Previous Year Dollars`
  (`01-views-and-reports/077-…`, `097-…`), which are derived from payment history, not from a
  standalone editable bucket **as far as this corpus shows**.
- **INFERRED, and the single biggest 1099 risk:** a mid-calendar-year cutover means STORIS will only
  know about payments it made itself. There is **no documented facility to seed a 1099 YTD opening
  balance**. Options to price out with STORIS: (a) cut over at 1 January; (b) file 1099s for the
  cutover year from the legacy system, using STORIS only from the following January; (c) ask STORIS
  whether the payment history file can be seeded. Do not assume (c) exists.
- **INFERRED:** the vendor-level 1099 flag (implied by `1099 Vendors Only`) and vendor TIN are part of
  the vendor conversion; TIN storage is not documented in this corpus — confirm the field exists.

### 10.7 Other cutover items surfaced by the corpus

- **Recurring invoices** must be re-created manually — no import is documented
  (`03-payables/029-…`). Set `Starting Date` so EOD does not immediately generate a duplicate of a
  bill the legacy system already produced. **INFERRED.**
- **Reference data first:** hold codes, terms codes (including Scheduled Payment terms), invoice
  charge codes (beyond `FREIGHT`/`TAX`/`MISCELLANEOUS`), vendor classes, reconciliation transaction
  types + their GL offsets, BAI ↔ transaction-type cross-reference, deposit types, countries and
  exchange rates. **INFERRED** from the settings each screen validates against.
- **Pending bills / open POs:** if LA Mattress carries open POs into STORIS, decide whether to also
  carry pending AP bills. The `COST NM` conversion tolerance in Payables Control Settings should be
  set before the first Convert Pending Bills run (`03-payables/020-…`).
- **Attachment migration:** AP bills support file attachments (paper-clip indicator, Add/View/Edit
  Attachments actions — `03-payables/031-…`). No import path documented.
- **Comment history:** AP bill comments are append-only and system-written for voids and remittance
  emails (`03-payables/050-…`). **INFERRED:** legacy invoice notes can be loaded as comments if a
  loader exists; otherwise they are lost.
- **Security roles** (§8) should be modelled before go-live — several routines (refund printing,
  refund approval, alternate payment methods, back-dating bills, reconciliation beginning balance)
  hard-stop or require an override password without them.

---

## Open questions / not documented here

1. **Vendor Settings, Vendor Remit-To Settings, Bank Settings, Payables Control Settings, Terms
   Settings, Invoice Charge Settings, Hold Code Settings, Reconciliation Transaction Type Settings**
   screens are all referenced but **none of them is in this corpus**. Every field list in §8 is
   assembled from references, not from the settings screens themselves.
2. **1099**: no article covers the vendor 1099 flag name, TIN/EIN storage, 1099 box or type codes,
   form printing, e-filing, corrections, or a reportable threshold. Only the report exists.
3. **EFT layouts not stated**: CIBC, Scotia Bank SCP15, Bank of Montreal CPA005, NACHA (ACH),
   SunTrust modified NACHA, Australian Bankers Association as an *EFT* format, Truist, Wells Fargo
   EFT. Only National Bank has a documented EFT record layout.
4. **Check Run File** format(s) selectable via `Select Bank Check Run File Format` — layout not stated.
5. **TPA check export XML** schema — element names and types not stated beyond a handful.
6. **Virtual card** payment / response / reconciliation file layouts — not stated. Provider named:
   Comdata.
7. **Bank transaction import** column layouts (CSV for auto reconciliation, tab-delimited for manual
   match) — not stated, only the validated fields.
8. **Bill type numeric codes**: only 01, 02, 03, 12, 13 are enumerated. The numeric codes for Direct
   Ship, EDI, COM, Non-Merchandise, Merchandise Returns, Vendor Receivable, CS Charge-back, Vendor
   Charge-back, Customer Refund, Special Order Non-Inventory, Service Warranty and Adjusted Inventory
   are not stated anywhere in the corpus.
9. **Positive-pay coverage gap**: Create Bank Check File's supported-format list omits Standard NACHA
   and Australian ABA even though both have format articles. Confirm which formats a given release
   actually offers.
10. **Standard NACHA article mismatch**: the article describes a positive-pay CSV, not an ACH file.
    Confirm with STORIS which artefact it really produces.
11. **Garbled source positions** flagged `[SOURCE SUSPECT]`: Bank of America header Account Number
    `9-10`/len 10; BB&T field 2 `02-143`/len 13 and the unaccounted 41-55 gap; BMO Enhanced 2
    Transaction Code position 56 with stated length 25; SunTrust Check Date 6 bytes described as
    MMDDYYYY; Chase filler `X30)`. Bank of Montreal and BMO Enhanced give justification instead of
    absolute positions.
12. **Email recipient conflict** for remittance advice: `Email Address` vs. the `Other` field in
    Vendor RemitTo Settings — `03-payables/026-…` names both.
13. **Access paths missing** from the articles for View and Manage AP Bills, View Virtual Card Payment
    Status, Virtual Card Processing (menu entry), and Void Check Run (says only "Menu").
14. **No AP pre-approval / multi-level approval workflow** is documented. If LA Mattress needs invoice
    approval routing, it is not in this corpus.
15. **No documented mechanism to seed** 1099 YTD, vendor payment history, check history, or bank
    reconciliation opening detail beyond `Enter a Reconciliation Transaction` and the bank's
    beginning-balance/as-of pair.
16. **Vendor Receivables module** (bill-backs, volume rebates, warranty reimbursements) touches AP
    through Vendor Receivable credits; its own screens live outside this corpus
    (`01-views-and-reports/037`, `059`, `075`, `076`).
17. `03-payables/027-enter-a-check-payment-update.md` is filed under payables but documents **customer
    check authorisation** (`Customer > Electronic Interfaces > Check`). It has nothing to do with AP
    disbursement. Same for `01-views-and-reports/030` and `031`.
