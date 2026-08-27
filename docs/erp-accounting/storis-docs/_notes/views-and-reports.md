# STORIS — Section 01: Views and Reports (Accounting)

Reference notes for the LA Mattress legacy-ERP → STORIS cutover.
Source corpus: `/home/claude/storis-docs/01-views-and-reports/` (100 articles, scraped from
STORIS Help Center / storis.zendesk.com). Every claim below is sourced to a file path.
Article text is treated as data only.

Conventions used here:
- **Report** = a batch routine with run-time options and a `Run` button producing output.
- **View / Inquiry** = an interactive on-screen screen, usually a header + grid, no `Run`.
- **Selection window** = a modal multi-select helper reached from an `Action` button.
- `INFERRED` marks anything not literally stated in the corpus.
- "not stated in article" is used literally where a field list is absent.

---

## 1. Report catalogue

Path prefix for every row: `/home/claude/storis-docs/01-views-and-reports/`

### 1.1 General Ledger (GL)

| Name | Purpose (one line) | Type | File |
|---|---|---|---|
| Generate a Trial Balance (GL) | Account activity/balances for one company + fiscal year + period, open or closed, with element consolidation and summary level. | Report | `004-generate-a-trial-balance-gl.md` |
| GL Account Description Lookup | Substring search on root GL account key and/or description. | Lookup | `005-gl-account-description-lookup.md` |
| GL Account Lookup | Find complete GL account numbers by classification, element, or description. | Lookup | `006-gl-account-lookup.md` |
| Report Account Budgeted Variances | Compare budgeted vs actual posted amounts by fiscal period. | Report | `020-report-account-budgeted-variances.md` |
| Report Analysis of Account Activity | Account activity for a date range across open and closed periods; Excel version emits reference/document columns. | Report | `023-report-analysis-of-account-activity.md` |
| Report Distribution to General Ledger | GL postings associated with AP bills for a post-date range; also runs at End-of-Month for the period being closed. | Report | `040-report-distribution-to-general-ledger.md` |
| Report End of Year GL Adjustments | Print end-of-year adjustment journal entries for a company + fiscal year (fiscal period 13). | Report | `041-report-end-of-year-gl-adjustments.md` |
| Report on Third Party Accounting Transmission Errors | Error log of GL errors during TPA transfers/vendor updates. | Report | `042-report-on-third-party-accounting-transmission-errors.md` |
| Report Posted Transactions | Daily detail of GL transactions posted since last EOD, for a date range, or for named batches. | Report | `047-report-posted-transactions.md` |
| Report Reconciliation of Inventory to GL Values | Research discrepancies between sales-side inventory valuation and GL inventory value. | Report | `051-report-reconciliation-of-inventory-to-gl-values.md` |
| Report Recurring Journal Entries | List recurring JEs for a company; asterisk marks accounts due for posting. | Report | `054-report-recurring-journal-entries.md` |
| Report Suspended Postings | Print GL post records that have not posted (Invalid or Hold). | Report | `058-report-suspended-postings.md` |
| Suspended Postings Inquiry | Search suspended GL batches by status (All / On Hold / Invalid). | Inquiry | `061-suspended-postings-inquiry.md` |
| View Account Activity | Drill-down inquiry on one GL account: sub-account → cost center → period → source → week → day → batch detail. | Inquiry | `078-view-account-activity.md` |
| View an Existing Account Budget | Budget vs activity vs variance $ / % by fiscal period for one account. | Inquiry | `079-view-an-existing-account-budget.md` |
| View Individual Postings | Read-only view of a single GL batch: header + detail postings, debit/credit totals. | Inquiry | `091-view-individual-postings.md` |
| View Multiple Postings | Search posted GL batch history by company/source/account elements/remark/amount/document/date. | Inquiry | `092-view-multiple-postings.md` |

### 1.2 Payables (AP)

| Name | Purpose | Type | File |
|---|---|---|---|
| Report 1099 and Payables History | Calendar-year payables totals per vendor; sorts/breaks/totals by vendor class; 1099-only filter. | Report | `018-report-1099-and-payables-history.md` |
| Report Cash Requirements | Open payables due, aged, for a fiscal period / as-of date; totals by vendor, bank, company. | Report | `029-report-cash-requirements.md` |
| Report Payable Approvals On Hold | List AP bills on hold, by invoice date range, vendor, bill type. | Report | `043-report-payable-approvals-on-hold.md` |
| Report Payables Activity | Open and closed payables activity since last EOD or for a date range; optional GL detail and GL recap. | Report | `044-report-payables-activity.md` |
| Report Payables Aged Trial Balance | Payable balances as of a date, Forecast or Past Due aging. | Report | `045-report-payables-aged-trial-balance.md` |
| Report Payables Disbursement | Vendor payments / check register (print or re-print), by check run or by manual payment method. | Report | `046-report-payables-disbursement.md` |
| View a Vendor's Payable Activity | DTS inquiry — Summary (aging buckets, hold, pending, calendar YTD) + Open Bills + Closed Bills tabs. | Inquiry | `077-view-a-vendors-payable-activity.md` |
| View AP Bill | Read-only AP bill: General, Invoice Detail, Check Information tabs. | Inquiry | `080-view-ap-bill.md` |
| View Billed Purchase Orders By Vendor | Pick POs to filter the vendor payable-activity inquiry. | Selection | `082-view-billed-purchase-orders-by-vendor.md` |
| View Check Status and Payment Details | Read-only view of a check run for bank + date + time/code. | Inquiry | `083-view-check-status-and-payment-details.md` |
| View Vendor Activity | DTS vendor shell: Header, Summary, Open, Closed page headings. | Inquiry | `096-view-vendor-activity.md` |
| View Vendor Bills | Vendor current/aged balances, aging buckets, on hold / pending / open, current + prior year dollars. | Inquiry | `097-view-vendor-bills.md` |
| View Vendor Closed Bills | Filtered grid of closed AP bills for a vendor. | Inquiry | `098-view-vendor-closed-bills.md` |
| View Vendor Open Bills | Filtered grid of open AP bills for a vendor, by status/hold code. | Inquiry | `099-view-vendor-open-bills.md` |

### 1.3 Vendor Receivables (VR) — a distinct AP-adjacent module

| Name | Purpose | Type | File |
|---|---|---|---|
| Report Daily Vendor Receivables Activity | Audit trail of all daily VR activity: cash receipts (by bank), adjustments, bill-backs, volume rebates, CS order postings, AP bill postings. | Report | `037-report-daily-vendor-receivables-activity.md` |
| Report Vendor Receivables Trial Balance | Vendor account balances broken into current and aged receivables; Summary / Detail / Audit. | Report | `059-report-vendor-receivables-trial-balance.md` |
| View a Vendor's Current Balances | Open VR transactions, open balance net of disputes, disputed amount. | Inquiry | `075-view-a-vendors-current-balances.md` |
| View a Vendor's Historical Balances | Closed VR transactions (closed the moment amount-due hits zero). | Inquiry | `076-view-a-vendors-historical-balances.md` |

### 1.4 Receivables (AR) — open item, revolving, installment, collections

| Name | Purpose | Type | File |
|---|---|---|---|
| Collections Activity Log | View/print the Collections Activity Log for one customer; add manual comments. | Report/Log | `000-collections-activity-log.md` |
| Open Item Receivables History Detail Inquiry | Detail (debit/credit/balance) for one historical AR reference. | Inquiry | `016-open-item-receivables-history-detail-inquiry.md` |
| Open Item Receivables Inquiry | Detail for one current open AR item; header shows Reference, Due Date, Dispute, Amount. | Inquiry | `017-open-item-receivables-inquiry.md` |
| Report Accounts Receivables Aged Trial Balance | AR balance per account split current vs aged; Detail/Summary/Audit/Total/Store Totals; Periodic/Bank/Recency aging. | Report | `021-report-accounts-receivables-aged-trial-balance.md` |
| Report Accounts with Credit Balances | List accounts carrying credit balances, sorted by store with store (and district) totals. | Report | `022-report-accounts-with-credit-balances.md` |
| Report Audited Receivables | All receivables activity since the last EOD, by district and store. | Report | `024-report-audited-receivables.md` |
| Report Collector Efficiency | Receivables collected today / yesterday / MTD / YTD per collector vs quota. | Report | `033-report-collector-efficiency.md` |
| Report Consolidated Trial Balance | Summary version of the AR Aged Trial Balance by customer / by store location. | Report | `034-report-consolidated-trial-balance.md` |
| Report Customer's Receivables Activity | One customer: open orders, open item activity, receivable history as of a date. | Report | `035-report-customer-s-receivables-activity.md` |
| Report Delinquent Accounts | Customers past due, bucketed by a user-specified aging period, within min/max balance. | Report | `038-report-delinquent-accounts.md` |
| Report Detailed Daily Adjustments | All manually posted AR transactions (the Daily Post Report), optional GL recap. | Report | `039-report-detailed-daily-adjustments.md` |
| Report Projected Fixed Term Revolving Cash Flow | Projected receipts from fixed-term revolving plans at 30/60/90/180/270/360 days and >1 year. | Report | `049-report-projected-fixed-term-revolving-cash-flow.md` |
| Report Recovered Bad Debts | Customers who paid off previously charged-off balances, and the satisfaction date. | Report | `053-report-recovered-bad-debts.md` |
| Report Suggested Account Adjustments | By location/account, credit and debit transactions that should be keyed off against each other. | Report | `055-report-suggested-account-adjustments.md` |
| Report Summarized Account Adjustments | All debit/credit manual adjustments completed in open item receivables. | Report | `056-report-summarized-account-adjustments.md` |
| Report Summarized Aging Receivables | Total A/R balance by location (summary) or by customer (detail), aged in 30-day increments. | Report | `057-report-summarized-aging-receivables.md` |
| Restricted Payment Type Entry | Build a list of revolving payment plans for statement-message linkage. | Selection | `060-restricted-payment-type-entry.md` |
| View a Customer's Account Balance | DTS shell: Open Items Summary, Accounts Receivable, Deposits, Deposits History, A/R History tabs. | Inquiry | `062-view-a-customers-account-balance.md` |
| View a Customer's Account Summary | Credit limit, credit history codes, collector, aging buckets, revolving/installment/total AR, deposit liability. | Inquiry | `063-view-a-customers-account-summary.md` |
| View a Customer's Activity for a Collector | DTS shell for collectors — 10 standard tabs incl. Open Items, A/R History, Open Orders, Service. | Inquiry | `064-view-a-customers-activity-for-a-collector.md` |
| View a Customer's Current Balance Details | Open item AR transactions with non-zero balance plus items zeroed since last Day Ending. | Inquiry | `065-view-a-customers-current-balance-details.md` |
| View a Customer's Current Deposits Detail | Payment-level detail behind one current deposit (type, masked reference, auth, deposit date, amount). | Inquiry | `066-view-a-customers-current-deposits-detail.md` |
| View a Customer's Current Revolving Activity | Current (not yet historized) revolving activity for one plan. | Inquiry | `067-view-a-customers-current-revolving-activity.md` |
| View a Customer's Historical A/R Items | Historical AR (open item, installment, revolving) for a selected fiscal period. | Inquiry | `068-view-a-customers-historical-ar-items.md` |
| View a Customer's Historical Deposits - Detail | Open and closed deposit detail for one order. | Inquiry | `069-view-a-customers-historical-deposits-detail.md` |
| View a Customer's Receivables Activity Details | Filtered transaction detail with Short Term Effect / Long Term Effect columns. | Inquiry | `070-view-a-customers-receivables-activity-details.md` |
| View a Customer's Revolving Disputes | Disputed revolving transactions for one customer plus balance/due/dispute totals. | Inquiry | `071-view-a-customers-revolving-disputes.md` |
| View a Customer's Revolving Plan History | Closed/historized revolving plan transactions. | Inquiry | `072-view-a-customers-revolving-plan-history.md` |
| View a Customer's Revolving Promotional Terms | Promotional interest and no-payment terms for a revolving plan. | Inquiry | `073-view-a-customers-revolving-promotional-terms.md` |
| View a Customer's Revolving Statement | Revolving statement history by plan and statement month/year. | Inquiry | `074-view-a-customers-revolving-statement.md` |
| View Collector Performance | PTD/YTD dollars collected per aging category vs quota, plus letters requested. | Inquiry | `084-view-collector-performance.md` |
| View Revolving Dispute Activity | Revolving disputes across all customers or one, incl. resolved, by reason and auto-removal date range. | Inquiry | `093-view-revolving-dispute-activity.md` |
| View Revolving General Info Tab | Read-only revolving plan detail: MMP, balances, cycle, YTD finance charge/insurance/late fees/fees, credit. | Inquiry | `094-view-revolving-general-info-tab.md` |
| View Revolving Transaction Details | Per-transaction revolving detail: Remaining, Waived, Expires, No Pay Until, MMP. | Inquiry | `095-view-revolving-transaction-details.md` |

### 1.5 Cash / bank reconciliation / drawers

| Name | Purpose | Type | File |
|---|---|---|---|
| Report Cash Balancing Exceptions | Two sections: Unassigned Transactions (not assigned to a drawer) and Suspense Cash Drawers (blind-balancing retries exceeded). | Report | `025-report-cash-balancing-exceptions.md` |
| Report Cash Disbursements | Cash disbursements for a check date or fiscal period, by company and bank; optional GL recap. | Report | `026-report-cash-disbursements.md` |
| Report Cash Drawer Balancing Totals | All monies received at a cash entry terminal for a day, by drawer / cashier / store. | Report | `027-report-cash-drawer-balancing-totals.md` |
| Report Cash Drawer Reconciliation Status | All cash drawers not yet purged — i.e. not balanced or reconciled — with over/short amounts. | Report | `028-report-cash-drawer-reconciliation-status.md` |
| Report Cleared Transactions | Cleared and/or matched bank-reconciliation transactions for a bank. | Report | `032-report-cleared-transactions.md` |
| Report Daily Receipts Register | Detail of sales receipts affecting GL/cash/checks/bank cards, plus GL recap; from `DAILY.DETAIL`. | Report | `036-report-daily-receipts-register.md` |
| Report Reconciliation Errors | All unmatched (not reconciled) bank transactions for a bank, with error message. | Report | `050-report-reconciliation-errors.md` |
| Report Reconciliation Transactions | Bank-reconciliation register for a bank and date range, with ending-balance proof. | Report | `052-report-reconciliation-transactions.md` |

### 1.6 Credit / financing / electronic check

| Name | Purpose | Type | File |
|---|---|---|---|
| Credit History Codes | Legend for the recent-credit-history codes shown on customer screens. | Reference | `001-credit-history-codes.md` |
| FR Cross Reference Inquiry | Disambiguate a finance account number already assigned to another customer (e.g. during payment entry). | Selection | `002-fr-cross-reference-inquiry.md` |
| FR Customer Selection | Pick which customer on a shared finance account number (e.g. View Available Financed Credit). | Selection | `003-fr-customer-selection.md` |
| Report Check Exceptions | Check exceptions for a date range (Date Code + Start/End only). | Report | `030-report-check-exceptions.md` |
| Report Check Transactions | Converted / guaranteed check transactions by location or merchant, with 4 sort levels. | Report | `031-report-check-transactions.md` |
| View Available Financed Credit Response | Provider response: balance due, credit limit, available credit, last payment, bill-to and finance-customer addresses. | Inquiry | `081-view-available-financed-credit-response.md` |
| View Completed Credit Requests | Approved/declined credit requests for a customer, newest completion first. | Inquiry | `085-view-completed-credit-requests.md` |
| View Current Financing Activity | Unresolved transactions in open finance batches, by payment type or provider + batch date. | Inquiry | `086-view-current-financing-activity.md` |
| View Customer Signatures (Checks) | Archive of electronic check transactions and captured signatures. | Inquiry | `087-view-customer-signatures-checks.md` |
| View Finance Credit Application | Read-only credit application screens for a customer/provider. | Inquiry | `088-view-finance-credit-application.md` |
| View Financing House Activity | House-finance order activity: applied / approved / cashed amounts and usage fees for financing and deposits. | Inquiry | `089-view-financing-house-activity.md` |
| View Historical Financing Activity | Resolved transactions within closed finance batches. | Inquiry | `090-view-historical-financing-activity.md` |

### 1.7 Tax

| Name | Purpose | Type | File |
|---|---|---|---|
| Multiple Tax Jurisdiction Selection Window | Multi-select of tax jurisdictions at any field accepting multiple jurisdictions. | Selection | `015-multiple-tax-jurisdiction-selection-window.md` |

This is the **only** tax-domain article in this section. No tax report (no tax liability, tax
collected, or jurisdiction summary report) exists in this corpus — see Open questions.

### 1.8 Cross-cutting selection windows and lookups (UI)

| Name | Purpose | File |
|---|---|---|
| Multiple Credit Review Status Code Selection Window | Multi-select of credit review status codes. | `008-multiple-credit-review-status-code-selection-window.md` |
| Multiple GL Account Selection Screen | Multi-select / range / list of root GL accounts. | `009-multiple-gl-account-selection-screen.md` |
| Multiple GL Batch Selection Window | Multi-select of GL batches. | `010-multiple-gl-batch-selection-window.md` |
| Multiple GL Cost Center Selection Screen | Multi-select / range / by region / by district of GL cost centers. | `011-multiple-gl-cost-center-selection-screen.md` |
| Multiple GL Source Selection Window | Multi-select of GL sources. | `012-multiple-gl-source-selection-window.md` |
| Multiple GL Sub-Account Selection Screen | Multi-select / range / list of GL sub-accounts. | `013-multiple-gl-sub-account-selection-screen.md` |
| Multiple Route Selection Window | Ordered multi-select of route codes (precedence by grid position). | `014-multiple-route-selection-window.md` |

### 1.9 Non-accounting items that landed in this section

| Name | Purpose | Domain | File |
|---|---|---|---|
| Mapping Update Audit Report | Orders that failed to be added to a manifest when a third-party mapping interface (RouteView, Advanced Dispatch Track) is active. | Logistics | `007-mapping-update-audit-report.md` |
| Report 80/20 Analysis | Products accounting for ~80% of sales, by dollars or units. | Merchandising | `019-report-80-20-analysis.md` |
| Report Product with Low Stock | Products below safety / minimum quantity, or at zero on hand. | Inventory | `048-report-product-with-low-stock.md` |

---

## 2. The common run-time option pattern

Almost every `Report *` routine in this section is the same screen skeleton. Learn it once.

### 2.1 Skeleton

```
[ scope fields ]      Company / Fiscal Year / Fiscal Period, or District / Store / Region
[ entity fields ]     Account, Sub-Account, Cost Center, Source, Batch, Vendor, Customer,
                      Vendor Class, Customer Class, Bank, Hold Code, Location, Product…
[ date fields  ]      Date Code  →  Start/Starting/From/As Of/Balance/Activity Since
                                    End/Ending/To
[ shape fields ]      Report Type (Detail / Summary / Audit / Total), Summary Only,
                      Include/Exclude checkboxes, Aging Method, Aging Days
[ sort fields  ]      Primary Sort / Secondary Sort / Tertiary Sort  (+ Quaternary on 031)
                      or Sort/Page Break rows
[ output       ]      Send Output to        (display-only)
                      Export Path           (display-only)
[ Run button   ]
```

Stated as "Once the report criteria have been selected, click Run to produce the report" in
`004`, `018`, `019`, `020`, `021`, `023`, `024`, `025`, `026`, `027`, `029`, `030`, `031`,
`032`, `033`, `034`, `035`, `036` and most others; some articles word it "Once the run-time
options have been selected, choose Run" (`037`, `038`, `039`, `040`, `041`, `043`…).

### 2.2 Blank = all

The single most important convention: **leaving a selection field blank selects everything**.
Stated repeatedly and identically, e.g. "If you leave this field blank, you choose all root
accounts" (`004-generate-a-trial-balance-gl.md`), "If you leave the field blank, you select
all vendors" (`018-report-1099-and-payables-history.md`), "To report on All Stores, leave this
field blank" (`042-report-on-third-party-accounting-transmission-errors.md`).

### 2.3 The three control affordances on an entity field

Each selection field typically offers three different buttons with three different meanings:

| Control | Behaviour |
|---|---|
| **Arrow** | Drop-down list of valid values (single pick). |
| **Search** | A lookup/search screen (e.g. Search for a Customer, Vendor Name Search, GL Account Description Lookup). |
| **Action** | The multi-select **selection window** for that entity (see §4). |

Sourced from e.g. `004-generate-a-trial-balance-gl.md` (Arrow → list, Action → Multiple GL
Account Selection screen), `018-report-1099-and-payables-history.md` (Search → search
routines, Action → Multiple Vendor Selection Window), `006-gl-account-lookup.md` (Search →
Multiple GL Account Selection Screen, Action → GL Account Description Lookup — note the roles
are **swapped** on that screen).

When a multi-select has been made, the field on the parent screen shows `"..."`
(`009`, `011`, `013`, `014`, `015`).

### 2.4 Mutual exclusion between fields

Filling one field commonly clears and inactivates a sibling. Recurring pairs:

- Account ↔ Account Group / Account Sub-Class / Account Class — "If you specify a root
  account, you clear and inactivate the following fields" (`004`, `023`).
- Account Group → fills and inactivates Account Sub-Class and Account Class (`004`, `023`).
- District ↔ Store — either one de-activates the other (`021`, `036`, `039`, `049`);
  on `027` the Store field is active only if District is blank.
- Vendor → inactivates Vendor Class (`018`, `045`).
- Customer ↔ Customer Class (`021`).
- Payment Date → clears and inactivates Fiscal Year + Fiscal Period (`026`).
- Since Last End of Day / Posted Since Last End-of-Day → inactivates Start/End dates
  (`044`, `047`).
- Batch entered on Report Posted Transactions → "you inactivate all other fields" (`047`).
- Payment Agreement source → inactivates District, Store, Customer Account, Customer Class,
  Secondary Sort by Class, Group Data By (`021`).
- Balanced/Unbalanced Drawer Reference → de-activates the other Drawer fields (`027`).

### 2.5 Date Code + Start/End

The canonical wording, repeated near-verbatim in ~25 articles:

> **Date Code** — "Click on the Arrow button to view a list of date codes, then select the code
> that best indicates the time period on which to base your report."
>
> **Start Date** — "If you select CUS at the Date Code field, you activate this field… If you
> select another date code instead of CUS, this field fills in based on that selection and you
> cannot edit this field."

So: **`CUS` is the only date code that unlocks the date fields.** Any other code computes and
locks Start/End. See `023`, `030`, `031`, `036`, `037`, `039`, `040`, `042`, `043`, `044`,
`046`, `047`, `051`, `053`.

The second date field is *not* always called "End Date". Observed labels for the same slot:

| Report | Date Code label | Date field labels | File |
|---|---|---|---|
| Collections Activity Log | Date Code (locked to Custom Dates) | Starting Date / Ending Date | `000` |
| Report AR Aged Trial Balance | Date | As Of | `021` |
| Report Analysis of Account Activity | Date Code | Starting Date / Ending Date | `023` |
| Report Cash Drawer Balancing Totals | Date Code | Balance Date (+ Starting/Ending Time, HH:MM 24h) | `027` |
| Report Consolidated Trial Balance | Date Code | As Of Date | `034` |
| Report Customer's Receivables Activity | Date Code | Activity Since Date | `035` |
| Report Daily Vendor Receivables Activity | Date Code | Start Date / End Date / As Of Date | `037` |
| Report Detailed Daily Adjustments | Code | From / To | `039` |
| Report Distribution to General Ledger | Date Code | Starting Post Date / Ending Post Date | `040` |
| Report Payable Approvals On Hold | Date Code | Start Invoice Date / End Invoice Date | `043` |
| Report Payables Activity | Code | Start / End | `044` |
| Report Payables Aged TB | Date Code | As Of Date | `045` |
| Report Vendor Receivables TB | Date Code | As Of Date | `059` |

Some routines do **not** use Date Code at all and take raw dates: `052-report-reconciliation-transactions.md`
(Starting Date / Ending Date, blank = bank record's As Of date / most current record) and
`092-view-multiple-postings.md` (Start Date / End Date, blank = start/end of current fiscal
year, and both dates must fall in the same fiscal year).

`046-report-payables-disbursement.md` has a **second, reduced Date Code** in its Check Run
section whose only options are `Custom`, `Today`, `Yesterday`.

### 2.6 Date-type selectors (orthogonal to Date Code)

Several reports also ask *which* date the range applies to:

- **System Date vs Transaction Date** — `036` (Date Type), `037` (Report on Date Type),
  `051` (System/Transaction Date).
- **System Posted vs User Entered** — `039` (Date field). "System Posted (date on which
  transaction was actually posted)" / "User Entered (date you entered for date of transaction)".
- Definitions from `025-report-cash-balancing-exceptions.md`: System Date = date the
  transaction was entered; Transaction Date = date *for* which it was entered.
- Back-dated payments post to the cash drawer by **system date, not the back date**
  (`027-report-cash-drawer-balancing-totals.md`) — but they show on the back date for both the
  customer account and the GL account. This is a real reconciliation trap.

### 2.7 Sort levels

Two distinct sorting idioms coexist.

**(a) Primary / Secondary / Tertiary Sort drop-downs**, where each level removes its choice
from the levels below it:

| Report | Sort options | File |
|---|---|---|
| Generate a Trial Balance | any combination of GL account class, sub-class, group; account sort is always root → sub-account → cost center | `004` |
| Report Check Transactions | Date, Location, Check Type, Time — **four** levels (Primary, Secondary, Tertiary, Quaternary) | `031` |
| Report End of Year GL Adjustments | class, sub-class, group, account — but "the program always sorts in this order"; final sort always account number | `041` |
| Report Payable Approvals On Hold | D=Date, V=Vendor, T=Type | `043` |
| Report Product with Low Stock | C=Category, B=Brand, G=Group; None Selected allowed | `048` |
| Report Reconciliation of Inventory to GL | options not stated in article ("select from the drop-down list") | `051` |

**(b) Sort/Page Break rows**, which combine sort with an optional page break:

- `020-report-account-budgeted-variances.md`: Account, Sub-Account, Cost Center. "the report
  prints the lowest sort level in detail format, so the page break option is not available at
  the lowest sort level."
- `023-report-analysis-of-account-activity.md` (Sorting tab): Class, Sub-Class, Group,
  Account, Sub-Account, Cost Center, Date, Source. Selecting `Account` blocks all account
  element options at later levels. Selecting Date or Source adds Post Date and Time columns;
  **not** selecting one of them makes the report display starting and ending balances instead.

Fixed, non-configurable sorts worth knowing for tie-out:
- `026-report-cash-disbursements.md` — primary sort always company, then bank; lowest level is
  Payment Date or Payment Reference.
- `029-report-cash-requirements.md` — sorts and totals after each vendor, bank, and company.
- `044-report-payables-activity.md` / `047-report-posted-transactions.md` — primary sort
  Company, each company on a new page; `047` also breaks on GL source and prints a GL account
  summary after each company total.
- `021`/`034`/`038`/`055`/`056`/`057` — AR reports sort by store location (then customer).
- `018-report-1099-and-payables-history.md` — sorts, breaks and totals by vendor class.
- `052-report-reconciliation-transactions.md` — transaction date then document number.

### 2.8 Send Output to / Export Path / Output Settings

Verbatim, appearing in 43 of the 100 articles:

> **Send Output to** — "The output destination of the report displays. To change the output
> destination, click on the Actions button and select Output Settings."
>
> **Export Path** — "If you select either the Personal Report Viewer (PRV), Excel Export, or
> ASCII Export, this field displays the pre-set computer drive and folder location to which the
> system exports the report data. **You cannot edit the export path using this process.**"

Key mechanics:

1. `Send Output to` is a **display-only mirror**. The destination is changed through
   `Actions → Output Settings`, not by typing in the field.
2. `Export Path` is likewise **display-only and non-editable from the report screen**. It shows
   a pre-set drive + folder. Changing it is out of scope for every routine in this corpus —
   where the path is configured is **not stated in any article**.
3. `Export Path` is populated only for the three file-producing destinations: **Personal Report
   Viewer (PRV)**, **Excel Export**, **ASCII Export**. For Screen and Printer it is empty.
4. Where a routine cannot produce a file, the field is explicitly dead: "Because the output
   options for this routine are limited to Screen and Printer, this field is inactive"
   (`000-collections-activity-log.md`).
5. `021-report-accounts-receivables-aged-trial-balance.md` truncates the boilerplate to just
   "You cannot edit the export path using this process." — the destination list is not
   restated there.

**Destination inventory** (union of everything named anywhere in the corpus):

| Destination | Produces a file? | Evidence |
|---|---|---|
| Screen | no | `000`, `034`, `038`, `039` |
| Printer | no | `000`, `034`, `038`, `039`, `046` |
| Personal Report Viewer (PRV) | yes — writes to Export Path | boilerplate in 43 files; `039` names it in prose |
| Excel Export (Excel®) | yes | boilerplate; `023` documents its column set; `034`, `038` |
| ASCII Export | yes | boilerplate; `034` ("Ascii Export"), `038` |
| Basic PDF | yes (print file) | `036`, `046` |
| Enhanced PDF | yes (print file) | `046` |
| `.PDF` print file (automatic) | yes | `050` — auto-run writes a .PDF print file |

**PRV restrictions.** Four reports state that `Summary Only` "is not available for the PRV":
`023-report-analysis-of-account-activity.md`, `040-report-distribution-to-general-ledger.md`,
`045-report-payables-aged-trial-balance.md`, `047-report-posted-transactions.md`. Treat PRV as
a detail-only destination for those four.

**PDF-only options.** `046-report-payables-disbursement.md`: "Detail for Checks Requiring
Multiple Stubs… can only be selected when the output option is set to Basic PDF, Enhanced PDF,
or Printer", and is unavailable when the routine is called from Select and Approve Bills for
Payment or from Generate Daily Reports.

**Multi-part output.** `036-report-daily-receipts-register.md`: with Basic PDF, "the detail,
receivables recap by store, recap by bank, and G/L recap are generated as separate items", and
only the detail report prints a legend.

**Currency and destination interact.** `046`: foreign-currency amounts appear in brackets below
domestic amounts "provided your output setting is either Printer or Screen".

### 2.9 Run-time options are echoed into the output

`029-report-cash-requirements.md`: "The run-time options you select for each report appear on
the last page of your report output." This is the audit hook — every archived report carries
its own parameter set. Useful for cutover evidence packs.

### 2.10 Permission and regional gates on report output

- **GL User Permissions** restricts the *lists* shown at Account / Sub-Account / Cost Center
  fields (`004`, `020`, `023`, `047`) and gates whole reports: `020` requires permission via
  Inquiry/Report Restrictions; `023` requires the "No Inquiry Allowed" field to be unchecked.
- **GL Account Staff Security** restricts the account element fields on `040`.
- **GL security is explicitly NOT enforced** in `058-report-suspended-postings.md`.
- **Regional Processing** — "you can inquire only about customers and locations to which you
  have access" appears on `021`, `024`, `027`, `031`, `035`, `036`, `038`, `039`, `048`, `055`,
  `056`, `057`, `062`, `063`, `064`, `065`, `067`, `072`, `073`, `074`, `088`, `095`, `096`.
  Any tie-out run under a region-restricted login will silently under-report.

---

## 3. Date codes

Only a handful of date-code **values** are literally named anywhere in the 100 articles. Do not
assume more exist without checking the live drop-down.

| Code | Meaning | Where named |
|---|---|---|
| `CUS` | Custom Dates — the only code that activates the Start/End (or As Of) date fields | 73 occurrences across the corpus; expanded as "CUS (Custom Dates)" in `042`, "CUS (custom)" in `021`, `034`, `035`, `037`, `045`, `056`, `059` |
| `TDAY` | Today | `042-report-on-third-party-accounting-transmission-errors.md` |
| `YDAY` | Yesterday | `042-report-on-third-party-accounting-transmission-errors.md` |
| `CYTD` | Current year to date | `042-report-on-third-party-accounting-transmission-errors.md` |
| `LYTD` | Last year to date | `042-report-on-third-party-accounting-transmission-errors.md` |

`042` presents these as *examples* only: "Examples of Date Codes are: TDAY (Today), YDAY
(Yesterday), CYTD (Current year to date), LYTD (Last year to date)." The full list is
**not stated in any article**.

Related but *not* codes:

- `000-collections-activity-log.md` — the Date Code field "defaults to Custom Dates and you
  cannot edit it".
- `046-report-payables-disbursement.md` (Check Run section) — a reduced picker whose options
  are spelled out as words: `Custom`, `Today`, `Yesterday`.
- `056-report-summarized-account-adjustments.md` — describes reportable periods in prose:
  "today, yesterday, as of a specific date, for the current period-to-date, last period-to-date,
  or last period total". These are almost certainly further date codes but their mnemonics are
  not given. INFERRED: codes of the shape `CPTD` / `LPTD` / `LPER` likely exist; **verify in the
  target system, do not hard-code**.
- `033-report-collector-efficiency.md` uses a different mechanism entirely — a `Report Period`
  field with options `Current` / `Prior`, active only in an overlap condition.

---

## 4. Multi-select "selection windows"

### 4.1 The shared grid contract

Six of these windows share literally the same closing paragraphs (`009`, `011`, `013`, `015`,
and partly `008`, `014`):

- Enter values directly, or pick from the Arrow list, or click **Search** for a lookup.
- Selected items accumulate in a **grid at the bottom** of the window.
- **Delete** (bottom of window) clears the entire grid; **Remove** deletes one selected row —
  a row is selected by double-clicking it, which also activates the buttons to its right.
- Navigate with up/down arrows or the scroll bar; highlight + Enter, or double-click, selects.
- **OK** (or **Save** on `008`, `014`) returns to the parent screen; the parent field then shows
  `"..."`. **Exit** returns without applying anything.

### 4.2 The windows

| Window | What it selects | Range support | Where it is reached from | File |
|---|---|---|---|---|
| **Multiple GL Account Selection Screen** | One or more **root** GL accounts. Also offers the **List Entry Window** (Actions button) to pick a saved GL account *list*. | Yes — `Account` … `Through` | Action button at Account field in GL routines; article names View Multiple Postings. Used by Generate a Trial Balance (`004`), Report Account Budgeted Variances (`020`), Report Analysis of Account Activity (`023`), Report Posted Transactions (`047`), Report Distribution to GL (`040`), View Multiple Postings (`092`); reached via **Search** (not Action) from GL Account Lookup (`006`). | `009-multiple-gl-account-selection-screen.md` |
| **Multiple GL Sub-Account Selection Screen** | One or more GL sub-accounts; a range; or a saved list via the List Entry Window. Linking use-case: link sub-accounts to the root account chosen in GL Account Settings. | Yes | Action button at Sub-Account field. Same report set as above; also from GL Account Lookup's Search button (`006`). Field active only if sub-accounts are in use (`004`, `020`, `023`, `047`, `092`). | `013-multiple-gl-sub-account-selection-screen.md` |
| **Multiple GL Cost Center Selection Screen** | One or more cost centers; a range; **or** all cost centers belonging to selected **Regions** or **Districts** (regions/districts map to cost centers via their locations). Has its own nested Multiple Region Selection and Multiple District Selection windows. | Yes — `Cost Center` … `Through` | Action button at Cost Center field in GL Account Settings and in the GL reports listed above. | `011-multiple-gl-cost-center-selection-screen.md` |
| **Multiple GL Source Selection Window** | One or more GL **sources** (the GL book of source). Its Search button opens the generic Multiple Selection Window. | Not stated in article | Action button at Source field in GL routines; article names Report Posted Transactions. Used by `023`, `047`, `058`, and `092` (which calls it "Multiple Source Selection screen"). | `012-multiple-gl-source-selection-window.md` |
| **Multiple GL Batch Selection Window** | One or more GL **batches** by code. Its Search button opens **View Multiple Postings** to browse and pick batches. | Not stated in article | Action button at Batch field in GL routines; article names Report Posted Transactions. Note `047` says Search → View Multiple Postings, Action → this window. | `010-multiple-gl-batch-selection-window.md` |
| **Multiple Tax Jurisdiction Selection Window** | One or more tax jurisdictions. Type directly (press Enter — item + description appear in grid; bad entry raises an error) or use the **Multiple Selection Lookup** window. | Not stated in article | "fields that allow your response to include multiple items" — no specific parent routine named in this corpus. | `015-multiple-tax-jurisdiction-selection-window.md` |
| **Multiple Route Selection Window** | Route codes, chosen from a drop-down. **Order matters**: "items listed first in the grid take precedence over items lower in the grid"; reorder with **Promote / Demote**. Has a **Clear** button that empties the field but leaves the grid row untouched. Read-only variant appears in view-only routines such as View Warehouse/Store Settings. | No | Route Code fields accepting multiple values. | `014-multiple-route-selection-window.md` |
| **Multiple Credit Review Status Code Selection Window** | Credit review status codes, entered in a `Code` field (a `Description` field auto-fills) or picked via the **Read-Only Code Lookup** window. Add with the green **Add** button; **Clear** is blue; **Remove** is red. Read-only variant appears in view-only routines such as View Advanced Product Settings. Note the article's own text is generic/boilerplate — it refers to "product names" and a "Warranty Category field", which look like copy-paste artefacts from a product-selection window. | No | Not stated in article. | `008-multiple-credit-review-status-code-selection-window.md` |
| **FR Customer Selection** | Which customer, when a finance account number is already assigned to one or more customers. Grid lists all assigned customers; highlight + **Continue**, or **Exit**. Requires `Multiple Customers Per Finance Account` in Financing Control Settings. | n/a | View Available Financed Credit (named in article). | `003-fr-customer-selection.md` |
| **FR Cross Reference Inquiry** | Same grid, but raised when you *attempt to assign* an already-assigned finance account number — e.g. during payment entry. Same control setting prerequisite. | n/a | Payment entry / finance account assignment. | `002-fr-cross-reference-inquiry.md` |
| **GL Account Lookup** | Complete GL account **numbers** (root + sub-account + cost center) filtered by account group / sub-class / class / root account / sub-account / description. Empty search returns everything ("this may take a minute or two"). Double-click a grid row to return it. Group selection cascades: picking a group fills and locks sub-class and class. | n/a | Post a Journal Entry → Details tab → Action button at Account field (`006`); also from View Individual Postings' Detail Postings tab Action button (`091`). | `006-gl-account-lookup.md` |
| **GL Account Description Lookup** | **Root** GL accounts by word/substring on the account key and/or the description. Entering both makes Description a *filter* on Account. | n/a | "all screens that require you enter a root GL account", e.g. View Account Activity (`078`, reached via its Search button); also from GL Account Lookup's Action button (`006`). | `005-gl-account-description-lookup.md` |
| **Restricted Payment Type Entry** | Revolving payment plan codes (Pay Type + Description), for linking statement messages. Arrow-select auto-adds to grid; Remove deletes. | No | Indicate Message to Print on Customer Statements → Action button at Plan field. | `060-restricted-payment-type-entry.md` |
| **View Billed Purchase Orders By Vendor** | Purchase orders for one vendor, via checkboxes plus **All** / **None** buttons. Shows Order, Date, Type, PO Status, Location, Merchandise, Total, Open. | n/a | Action button at Purchase Order field in View a Vendor's Payable Activity (`077`, `099`). | `082-view-billed-purchase-orders-by-vendor.md` |
| **Suspended Postings Inquiry** | Suspended GL batches filtered by status All / On Hold / Invalid. | n/a | Action button at Batch fields, e.g. Post a Journal Entry. Also reachable as "Suspended Postings" from View Individual Postings' Batch Search menu (`091`). | `061-suspended-postings-inquiry.md` |

### 4.3 Selection windows referenced but **not documented** in this corpus

These are named by report articles as the target of an Action button, but have no article here.
Assume they follow the §4.1 contract; confirm during config.

Multiple Vendor Selection Window (`018`, `043`, `044`, `045`, `046`); Multiple Vendor Classes
Selection Window (`018`, `045`); Multiple Company Selection screen (`041`, `047`, `054`, `058`,
`077`, `078`, `092`, `098`, `099`); Multiple Location Selection Window (`021`, `024`, `027`,
`031`, `036`, `039`, `042`, `048`, `051`); Multiple District Selection Window (`011`, `021`,
`027`, `036`, `039`, `049`); Multiple Region Selection Window (`011`, `022`, `048`); Multiple
Customer Selection Window (`021`); Multiple Entry Window for customer classes (`021`); Multiple
Bank Selection Window (`029`, `046`); Multiple Hold Code(s) Selection Window (`029`, `044`,
`045`, `077`, `099`); Multiple Country Selection Window (`045`); Multiple Merchant Selection
Window (`031`); Multiple Staff / Operator Selection Window (`027`, `058`); Multiple AP Bill
Selection window (`044`); Multiple Bill Type Selection Window (`077`, `098`, `099`); Multiple
Remit-To Selection Window (`044`, `077`, `098`, `099`); Multiple Purchase Order Selection Window
(`098`); Multiple Invoice Entry / Enter Multiple Invoices (`077`, `098`, `099`); Multiple
Product / Product Group / Product Category / Brand / Purchase Status Selection screens (`019`,
`048`, `051`); Multiple Selection Lookup Window (`015`, `024`, `048`, `098`, `099`); List Entry
Window (`009`, `011`, `013`, `040`).

---

## 5. Reconciliation and control reports

These are the tie-out instruments. For each: what it proves.

### 5.1 GL trial balance

**Generate a Trial Balance (GL)** — `004-generate-a-trial-balance-gl.md`
Proves: that a company's GL account activity for one fiscal year + period foots, at a chosen
level of account granularity. Scope is Company + Fiscal Year + Period (both open and closed
periods selectable).
The two knobs that decide what "a balance" means here:
- **Element Consolidation**: `No Consolidation` (every complete account number = parent +
  cost center), `Sub-Account` (roll cost centers into the sub-account), `Root Account` (roll
  sub-accounts *and* cost centers into the root).
- **Summary Level**: `No Summarization` (one line per posting), `Period Summary` (one line for
  the period), `Daily Summary`, `Source Summary`, `Weekly Summary` (weekly calendar only).
The article's own recommendation for the cleanest comparable: element consolidation = Root
Account, summary level = Period Summary — "The report then sorts and subtotals by account
class, account sub-class, account group, and account."

**Report Consolidated Trial Balance** — `034-report-consolidated-trial-balance.md`
Despite the name this is an **AR** report, not GL: "a summary version of the Aged Trial Balance
by customer", detail sorts by store location then customer; summary is store-location only, no
customer information. Only run-time options are Date Code and As Of Date. Do not mistake it for
a GL trial balance during planning.

### 5.2 Aged trial balances

**Report Accounts Receivables Aged Trial Balance** — `021-report-accounts-receivables-aged-trial-balance.md`
Proves: the AR subledger balance per customer as of a date, split into current and aged buckets,
and (critically) that it can be tied to the GL.
- Five report types: `Detail` (by transaction type), `Summary` (total per account, code only, no
  name), `Audit` (adds component amounts — deposit applied, payment received, etc.),
  `Total` (grand totals only), `Store Totals` (summary with store totals; forces Exclude
  Comments on).
- Three aging methods: `Periodic` (balance split across current/past due/future due),
  `Bank` (whole balance reported at the age of its **oldest** AR item), `Recency` (whole balance
  aged from the **last payment date**; never lands in 1-30; falls back to Bank if the customer
  has never paid).
- **Aging is forced to Periodic** — and cannot be changed — when the report runs by Store of
  Activity or as Detail or Audit.
- **The GL-audit trap:** "Group by Store of Activity… if you select this option, you cannot use
  the resulting report to audit your general ledger." Leaving it unchecked groups by the
  customer's Store Assignment (Advanced Customer Settings). Long-term receivable balances are
  reported **only** when this box is unchecked.
- Long term revolving amounts appear on an on-demand run **only if the As Of Date is today**.
- Grand totals are broken out by Open Item and Long Term Revolving.
- Runs as part of End-of-Month, where it groups by store assignment.
- Excluding customers with zero balance still reports customers holding a long-term receivable
  balance even when the open-item balance nets to zero.

**Report Payables Aged Trial Balance** — `045-report-payables-aged-trial-balance.md`
Proves: the AP subledger balance as of a date. Access path is oddly labelled
`Payables > Payables Views and Reports > Generate a Trial Balance`.
- **Aging Type**: `Forecast` (standard — outstanding invoices as of a future date, used to size
  cash requirements) or `Past Due` (alternate; pair with `Past Due Only` to suppress current).
- Aging Days defaults from `Bill Aging Days` in Payables Control Settings.
- **Back-dating trap:** "AP bills that were back-dated may not be included on the report if they
  were not active on or before the As Of Date that you specify."
- `Debit Balances Only` is active **only when the As of Date is the current date**.
- `Summary Only` is not available for the PRV.

**Report Vendor Receivables Trial Balance** — `059-report-vendor-receivables-trial-balance.md`
Proves: the VR subledger balance per vendor, current vs aged. Summary = one line per vendor;
Detail = each open VR transaction/reference ID; Audit = each adjustment/payment inside each open
VR transaction.

**Report Summarized Aging Receivables** — `057-report-summarized-aging-receivables.md`
Proves: AR aged in flat 30-day increments, by location (summary) or by customer (detail), with
percentage of past-due total. A cheaper cross-check against `021`.
Run-time options other than output are **not stated in the article**.

### 5.3 Cash balancing and drawer reconciliation

**Report Cash Drawer Balancing Totals** — `027-report-cash-drawer-balancing-totals.md`
Proves: total monies received at cash entry terminals for one day, broken out and totalled by
payment type, balanced by drawer / cashier / store.
Known exclusions that will otherwise look like variances:
- Credit card **refunds on customer returns** do not appear (they usually aren't tied to a
  drawer entry). STORIS does not post such refunds to Cash Balancing at entry time except for
  customer drop-offs; the posting happens when the customer return is *completed*.
- Electronically converted check payments (`EC`) are totalled **separately** from non-EC checks.
- Back-dated payments post to the drawer by system date (see §2.6).
Also supports Balanced / Unbalanced **Drawer Reference** lookups, which show all postings to a
drawer regardless of posting date — this is how you see manager overrides performed on a
different day.

**Report Cash Drawer Reconciliation Status** — `028-report-cash-drawer-reconciliation-status.md`
Proves: nothing is left un-reconciled. Lists every cash drawer **not yet purged** — i.e. not
balanced or reconciled — with reference number, deposit date, operator name, location, status,
receive date, and **over and short amounts** per drawer. Prints automatically at End-of-Day.
If `Balance By` in Cash Balancing Control Settings is Drawer or Store rather than Operator, the
Operator column is replaced by a Drawer or Store column.

**Report Cash Balancing Exceptions** — `025-report-cash-balancing-exceptions.md`
Proves: no cash transaction is orphaned or stuck awaiting approval. Runs at End-of-Day only when
`Extend Cash Balancing` is checked in Cash Balancing Control Settings. Two sections:
- **Unassigned Transactions** — transactions not assigned to a drawer, because they fell outside
  the balancing time range or the drawer was never balanced. Columns: System Date, Transaction
  Date, System Time, Store, Drawer, Operator, Reference, Pay Type (Check, Cash, Credit Card, or
  a financing code — e.g. `MC` for MasterCard), Amount.
- **Suspense Cash Drawers** — transactions where the cashier exceeded `Number of Tries` during
  Blind Cash Balancing; these need manager approval. Columns: Date, Drawer Reference (which is
  Cashier, Drawer, or Store depending on `Group Payments by`), Start and End times.

**Report Daily Receipts Register** — `036-report-daily-receipts-register.md`
Proves: the day's receipts by tender type reconcile to the GL. Based on receipts for tender
types that affect G/L: cash, checks, bank cards. **Third-party financing receipts are included
even though funds have not been received.** **Revolving deposits and financing do not appear.**
Reports transaction type (payment / deposit / on-account), class (cash, charge,
guaranteed/electronic/manual check), and amount, plus a **GL recap** (`Print General Ledger
Recap`). Data source is the `DAILY.DETAIL` file; retention is governed by `Daily Receipts
Retention Months` in Accounts Receivable Control Settings and purged by Generate Monthly
Reports. Use this — not Cash Drawer Balancing Totals — when you need both system date and
transaction date on the same line.

### 5.4 Bank reconciliation

**Report Reconciliation Transactions** — `052-report-reconciliation-transactions.md`
Proves: the bank register ties from a defined balance-forward to a stated ending balance.
- `Ending Balance` field computes an **ending balance proof**: the process subtracts the bank
  balance from the ending balance you supply; both appear below the bank balance in the summary.
- Reporting Mode: Run Summary Only / Run Detail Only / Run Both.
- `Report Status as of Ending Date` (available only when an Ending Date is given) shows each
  check's status as it *was* on that date rather than its current status — essential for
  reproducing a prior month's reconciliation.
- Columns (from the Bank Reconciliation File): Document Number, Reference/Comment, Description,
  Transaction Type, **Debit** (holds amounts stored as *credit* transactions, subtracted from the
  running balance), **Credit** (holds amounts stored as *debit* transactions, added to the running
  balance — note the deliberate inversion "to maintain consistency with banks reports"), Issued,
  Status (`CLEAR`/`OPEN`, driven by the `MATCHED` flag), Origin (`EOD` for deposits, `APC` for
  checks, or a manual posting code), Balance, Reconciliation Date, Locn.
- Balance-forward semantics: the Bank file holds the balance "from the beginning of time" — i.e.
  as of the last time the reconciliation file was cleared and recalculated by the purge process.
  If your starting date is later than the last purge date, all prior transactions are used to
  compute a beginning balance as of the requested starting date.
- Mis-applied-funds behaviour: same-bank reapplications do **not** appear; cross-bank
  reapplications appear as a Debit on the original bank and a Credit on the receiving bank.
- Total descriptions come from the `Short Description` of each Transaction Type record.

**Report Cleared Transactions** — `032-report-cleared-transactions.md`
Proves: what actually matched. Columns: BAI Code, BAI Description, Reference/Description,
Document Number (check or deposit number), Amount, Transaction Type, **Paid Date**.

**Report Reconciliation Errors** — `050-report-reconciliation-errors.md`
Proves: what failed to match, and why. Same column set as `032` but with **Bank Date** instead of
Paid Date, plus an **Error Message** column. When run automatically via Import Bank Transactions
with Automatic Reconciliation the bank defaults and output goes to a `.PDF` print file; on
demand you must name both the bank and the destination.

### 5.5 Distribution to GL / posting control

**Report Distribution to General Ledger** — `040-report-distribution-to-general-ledger.md`
Proves: that AP bill activity for a post-date range produced the GL postings you expect —
i.e. the AP-to-GL bridge. Also runs at End-of-Month for the period being closed.
`Break-On Element` subtotals at Complete Account / Root Account / Sub-Account / Cost Center.
`Summary Only` gives GL account totals with no AP bill detail (not available for the PRV).
`Include Detail Remarks` adds GL remarks, detail version only.
Account element fields here are restricted by **GL Account Staff Security**.

**Report Posted Transactions** — `047-report-posted-transactions.md`
Proves: every GL transaction that posted, either since the last EOD, over a date range, or for
named batches. Sorts by company then GL source with breaks and subtotals; a **GL account summary
prints after each company total**. Its EOD behaviour is configurable four ways via
`End-of-Day Posted Transactions` in GL Control Settings: generate reporting all transactions;
generate reporting only manual transactions; do not generate; or suppress both the report and
the generation of GL Post Register records. Entering a Batch inactivates every other field.

**Report Suspended Postings** — `058-report-suspended-postings.md`
Proves: nothing is stuck un-posted. Two reasons: `Invalid` (activates Source, deactivates
Operator; all reasons print beneath each batch) and `Hold` (activates Operator, deactivates
Source). Sorts by company with a page break each; invalid runs also break on GL source, hold
runs on operator. **GL security is not enforced in this routine.** Fix via Post/Update a Journal
Entry.

**Report Analysis of Account Activity** — `023-report-analysis-of-account-activity.md`
Proves: what hit a given account, and from where, across open *and* closed periods. Selecting
Date or Source as a sort adds Post Date and Time columns; **omitting both makes the report show
starting and ending balances** — that variant is the one you want for period tie-out.

**Report End of Year GL Adjustments** — `041-report-end-of-year-gl-adjustments.md`
Proves: the year-end adjusting entries. These are period-13 postings — from
`091-view-individual-postings.md`: an `End of Year Journal Entry` posts to fiscal period 13, the
fiscal year must be open and period 12 of that year closed, and the source changes to `GLAJ`.
(A `Reversing Journal Entry` auto-posts a reversal in the following period, source `GLRV`.)

**Report Reconciliation of Inventory to GL Values** — `051-report-reconciliation-of-inventory-to-gl-values.md`
Proves: the sales-side inventory valuation agrees with the GL inventory value.
Three versions: `Summary` (totals per transaction classification; "By looking at the bottom line
you can determine if a problem exists"), `Detail` (Old Cost, New Cost, **Cost Change GL** = the
exact dollar value of the cost change, **Cost Used** = the amount posted to GL), `Audit`
(per-piece and per-costing-layer).
**Prerequisite:** `Inventory-G/L Reconciliation Audit` must be checked in Costing Control
Settings or the system does not collect the data. `Inventory G/L Recon EOD Report` adds it to
Day-Ending.

**Report Account Budgeted Variances** — `020-report-account-budgeted-variances.md`
Proves: actuals vs budget per period per account. Gated by Inquiry/Report Restrictions in GL
User Permissions.

### 5.6 Mapping update audit

**Mapping Update Audit Report** — `007-mapping-update-audit-report.md`
Proves: no order silently failed to reach a manifest when routing is done in a third-party
mapping product (RouteView, Advanced Dispatch Track) and handed back to STORIS for manifest
build. One Location only. Optional Scheduled Date (delivery date) and Download Date filters.
`Report` field: `All` (all updates) or `New` (updates since the report was last run).
This is an operational, not financial, control — it appears in the brief's reconciliation list
but does not tie out any balance.

### 5.7 Check exceptions

**Report Check Exceptions** — `030-report-check-exceptions.md`
Proves: which electronic-check transactions errored. This is a **customer check interface**
report (`Customer > Electronic Interfaces > Check`), **not** an AP check-run report. Its only
run-time options are Date Code, Start Date, End Date, Send Output to, Export Path. The columns
it produces are **not stated in the article**.

**Report Check Transactions** — `031-report-check-transactions.md`
Companion to the above: Converted and/or Guaranteed check transactions, by Location or by
Merchant, History or Current transactions, with an `Include Invalid Transactions` switch and
Both/Detail/Summary output. Four sort levels (Date, Location, Check Type, Time).

For AP check exceptions you instead want `046-report-payables-disbursement.md` (check register,
excludes voided checks in the non-check-run mode) and
`083-view-check-status-and-payment-details.md` (per-check-run status: `Pending` = not yet
printed, `Printed`).

### 5.8 Cash requirements

**Report Cash Requirements** — `029-report-cash-requirements.md`
Proves: how much cash is needed, by vendor / bank / company, to clear payables as of a date.
- `Aging Method`: Invoice Due Date / Discount Terms Date / Anticipated Payment Date; default
  comes from `Bill Aging Method` in Payables Control Settings.
- `Aging Days` defaults from `Bill Aging Days`.
- Optional inclusion of `Pending Bills` (All / Pay Before Receipt / Don't Pay Before Receipt)
  and of bills on hold, restricted by hold code.
- An **unmarked column** sits between Type and Invoice Number holding the AP bill status code —
  e.g. `H` for Hold.
- Past Due column is populated only when the bill's invoice date has passed the as-of date; when
  reporting off Anticipated Pay Date or Discount Date earlier than the as-of date, the invoice
  date decides past-due status.

**Report Cash Disbursements** — `026-report-cash-disbursements.md`
Proves: what actually went out, for a check date or a fiscal period. Payment Method codes:
`CHK` Checks, `MAN` Manual Checks, `CCD` Credit Cards, `DCD` Debit Cards, `OLB` Online Banking,
`CSH` Cash. Type column = 4-character AP bill type description. Reference = check number or the
manual-payment reference from Enter/Update Individual Vendor Invoice — the control accepts 25
characters but **only 15 print**. A `P` next to the Type column marks a paid Pending Bill.
`Print GL Recap` emits a separate report of debits and credits by account with company totals and
a grand total.

---

## 6. Reports that produce data files

"Produces a data file" = the article states an Excel Export, ASCII Export, PRV, or PDF file
destination. Because §2.8's boilerplate is generic, the table below distinguishes **generic**
(boilerplate only, fields not enumerated) from **specific** (the article lists actual columns).

### 6.1 Specific — columns stated in the article

| Report | Destination | Stated fields | File |
|---|---|---|---|
| **Report Analysis of Account Activity** | **Excel®** specifically | `Reference Type` — one of `CUS` customer, `VEN` vendor, `WLO` location, `FRV` finance provider, `STA` staff, or null; `Reference Number` — key to a file, per Reference Type; `Reference Name`; `Document` — document number with a 3-char prefix: `APB` AP bill, `ORH` order incl. service, `POH` purchase order, `CDR` cash drawer, `PRO` product, `VOI` vendor open item, `COI` customer open item, `FRA` FR account number. For sources `APVE` and `APVM` only, Reference Number and Reference Name hold display-only vendor number and vendor name. | `023-report-analysis-of-account-activity.md` |
| **Report Cleared Transactions** | PRV / Excel / ASCII (boilerplate) | BAI Code, BAI Description, Reference/Description, Document Number (check or deposit number), Amount, Transaction Type, Paid Date. | `032-report-cleared-transactions.md` |
| **Report Reconciliation Errors** | PRV / Excel / ASCII (boilerplate); auto-run writes `.PDF` | BAI Code, BAI Description, Reference/Description, Document Number, Amount, Transaction Type, Bank Date, Error Message. | `050-report-reconciliation-errors.md` |
| **Report Reconciliation Transactions** | PRV / Excel / ASCII | Document Number, Reference/Comment, Description, Transaction Type, Debit, Credit, Issued, Status, Origin, Balance, Reconciliation Date, Locn. (See §5.4 for the Debit/Credit inversion.) | `052-report-reconciliation-transactions.md` |
| **Report Accounts with Credit Balances** | PRV / Excel / ASCII | Report Column Headings: Customer Number, Account Name, Work Phone, Home Phone, Total Balance, Store (Number and Description), Store Total. | `022-report-accounts-with-credit-balances.md` |
| **Report Daily Receipts Register** | Basic PDF splits into separate items; also PRV/Excel/ASCII | With Basic PDF: detail, receivables recap by store, recap by bank, and G/L recap as **separate items**; only the detail report prints a legend. Column list itself is not stated in the article. | `036-report-daily-receipts-register.md` |
| **Report Payables Disbursement** | Basic PDF / Enhanced PDF / Printer for the multi-stub option; PRV/Excel/ASCII otherwise | `Detail for Checks Requiring Multiple Stubs` is PDF/Printer-only and includes only the check detail total, omitting all other totalling. Foreign-currency amounts print in brackets under domestic amounts only when output is Printer or Screen. | `046-report-payables-disbursement.md` |

### 6.2 Generic — standard PRV / Excel Export / ASCII Export boilerplate, no field list

The following 43 articles carry the standard `Send Output to` + `Export Path` boilerplate naming
PRV, Excel Export, and ASCII Export. Seven of them (`022`, `023`, `032`, `036`, `046`, `050`,
`052`) additionally enumerate content and are covered in §6.1; for the remaining 36 the exported
fields are **not stated in article**:

`004`, `018`, `019`, `020`, `021` (truncated boilerplate), `022`, `023`, `024`, `025`, `026`,
`027`, `028`, `029`, `030`, `031`, `032`, `033`, `034`, `035`, `036`, `037`, `038`, `039`,
`040`, `041`, `042`, `043`, `044`, `045`, `046`, `047`, `048`, `049`, `050`, `051`, `052`,
`053`, `054`, `055`, `056`, `057`, `058`, `059`.

Explicit prose confirmations of file output, over and above the boilerplate:
- `034-report-consolidated-trial-balance.md`: "Screen, Printer, Excel® Export, or Ascii Export
  are the output options."
- `038-report-delinquent-accounts.md`: "Screen, Printer, Excel® Export, or ASCII Export are the
  output options."
- `039-report-detailed-daily-adjustments.md`: "The on-demand version can be run to Screen,
  Printer, Personal Report Viewer, Excel®, or as an ASCII Export."

### 6.3 Explicitly cannot produce a data file

- `000-collections-activity-log.md` — "the output options for this routine are limited to
  Screen and Printer"; Export Path inactive.
- `087-view-customer-signatures-checks.md` — generates **graphical print files** similar to
  PrintScreen images; Print goes to the **Windows Print Window**, not the STORIS print function.
  To print to the default STORIS printer you must have it installed on the local PC.
- All `View *` / `* Inquiry` articles (`016`, `017`, `061`–`099` except the reports above) —
  no Send Output to / Export Path fields documented at all.

### 6.4 Where files land

Every file-producing report writes to the **pre-set** Export Path, which is display-only and
"You cannot edit the export path using this process." The configuration point for that path is
**not stated anywhere in this corpus** — resolve it before any export-based cutover plan.
INFERRED: because the path is per-workstation ("the pre-set computer drive and folder location"),
exports likely land on the *client* machine rather than the server; confirm before assuming a
shared drop directory for automated pulls.

---

## 7. Cutover implications

Everything in this section is judgement built on the corpus. Treat the ordering as a proposal.

### 7.1 What must tie, and with which report

| Balance to tie | STORIS report | Basis | File |
|---|---|---|---|
| GL trial balance | Generate a Trial Balance (GL) | Company + FY + Period; consolidation = Root Account, summary = Period Summary | `004` |
| AR subledger → GL | Report Accounts Receivables Aged Trial Balance | As Of date; **Group by Store of Activity must be UNCHECKED** | `021` |
| AR aged cross-check | Report Summarized Aging Receivables / Report Consolidated Trial Balance | 30-day buckets / store-level summary | `057`, `034` |
| AR credit balances | Report Accounts with Credit Balances | store and district totals | `022` |
| Deposit liability | View a Customer's Account Summary (Liability → Deposits) | per customer only — **no deposit-liability report exists in this corpus** | `063` |
| AP subledger → GL | Report Payables Aged Trial Balance | As Of date, Forecast aging | `045` |
| AP-to-GL bridge | Report Distribution to General Ledger | post-date range; Break-On = Complete Account | `040` |
| VR subledger | Report Vendor Receivables Trial Balance | As Of date, Audit version | `059` |
| Bank / cash | Report Reconciliation Transactions (+ Cleared, + Errors) | Ending Balance proof; Report Status as of Ending Date | `052`, `032`, `050` |
| Drawers closed | Report Cash Drawer Reconciliation Status | must return empty | `028` |
| No orphan cash | Report Cash Balancing Exceptions | both sections must be empty | `025` |
| Nothing un-posted | Report Suspended Postings | must return empty for both Invalid and Hold | `058` |
| Inventory → GL | Report Reconciliation of Inventory to GL Values | Summary first, then Detail on any variance | `051` |
| 1099 base | Report 1099 and Payables History | calendar year; only the previous two years are reportable | `018` |

### 7.2 Proposed run order at cutover — INFERRED

Run each step on **both** systems where a legacy equivalent exists, with the *same* as-of date,
and archive the output (remember: run-time options print on the last page — `029`).

**Phase 0 — freeze and drain (before the balance snapshot)**
1. Run **Report Cash Drawer Reconciliation Status** (`028`) — every drawer must be balanced and
   reconciled. Un-purged drawers mean cash is still in motion. INFERRED: this must be clean
   before anything else is meaningful.
2. Run **Report Cash Balancing Exceptions** (`025`) — clear Unassigned Transactions and get
   manager approval on every Suspense Cash Drawer.
3. Run **Report Suspended Postings** (`058`) for Reason = Invalid *and* Reason = Hold. Fix via
   Post/Update a Journal Entry. Anything left here is GL activity that will never post.
4. Run **Report on Third Party Accounting Transmission Errors** (`042`) if TPA is in play. Note
   the article's warning: End of Day moves errors to history, so already-corrected errors can
   still appear — check the date/time on each.
5. Run the final **End-of-Day**, then **Report Posted Transactions** (`047`) with
   `Posted Since Last End-of-Day` to confirm the drain.

**Phase 1 — subledger snapshots (all at the same As Of date)**
6. **Report Accounts Receivables Aged Trial Balance** (`021`) — Report = `Audit`, Group by Store
   of Activity **unchecked**, As Of = cutover date. Audit gives component amounts, and Detail/Audit
   force Periodic aging, which is the version that reconciles to GL. Note: long-term revolving
   amounts only appear on an on-demand run when As Of = today, so run it **on** cutover day.
7. **Report Summarized Aging Receivables** (`057`) and **Report Consolidated Trial Balance**
   (`034`) as independent cross-foots of step 6.
8. **Report Accounts with Credit Balances** (`022`) — these are the accounts most likely to
   migrate with a sign error.
9. **Report Payables Aged Trial Balance** (`045`) — Aging Type `Forecast`, As Of = cutover date,
   Summary Only **off** (needed at detail; also PRV cannot do Summary Only). Re-run with
   `Debit Balances Only` (only works when As Of = current date) to isolate vendor debits.
10. **Report Cash Requirements** (`029`) — establishes the forward payment obligation the new
    system must reproduce.
11. **Report Vendor Receivables Trial Balance** (`059`) — Audit version, if VR is in use.
12. **Report 1099 and Payables History** (`018`) for each of the two reportable calendar years —
    1099 data is calendar-based (confirmed by `077`: "The system uses the calendar total as
    opposed to fiscal year total because 1099 amounts are calendar-based").

**Phase 2 — GL snapshot**
13. **Generate a Trial Balance (GL)** (`004`) at Root Account / Period Summary for the cutover
    period. Then re-run at `No Consolidation` for the account-level detail needed to load
    opening balances per complete account number (root + sub-account + cost center).
14. **Report Analysis of Account Activity** (`023`) for the control accounts (AR control, AP
    control, inventory, cash), with **neither Date nor Source selected as a sort** so the report
    prints starting and ending balances. Export to Excel to get the Reference Type / Reference
    Number / Document columns (§6.1) — that is the only place in this section where GL postings
    carry their subledger keys in machine-readable form.
15. **Report Distribution to General Ledger** (`040`) for the period, Break-On = Complete
    Account — this is the AP→GL proof.
16. **Report Reconciliation of Inventory to GL Values** (`051`) — Summary first; drill to Detail
    only on a non-zero bottom line.
17. **Report Account Budgeted Variances** (`020`) if budgets are being migrated.
18. **Report Recurring Journal Entries** (`054`) — the asterisked accounts are due for posting
    and must be re-created as recurring entries in STORIS, not migrated as history.
19. **Report End of Year GL Adjustments** (`041`) for any open prior year — remember these are
    period-13 / source `GLAJ` postings (`091`).

**Phase 3 — cash and bank**
20. **Report Reconciliation Transactions** (`052`) per bank, Reporting Mode = `Run Both`, with
    `Ending Balance` set to the bank statement balance so the ending-balance proof computes, and
    `Report Status as of Ending Date` checked so statuses are frozen at the cutover date.
21. **Report Cleared Transactions** (`032`) and **Report Reconciliation Errors** (`050`) per
    bank — the outstanding-items list that must be carried into the new bank rec.
22. **Report Cash Drawer Balancing Totals** (`027`) and **Report Daily Receipts Register** (`036`)
    for the final day. Reconcile them against each other knowing the documented differences:
    credit-card refunds on customer returns are absent from `027`; revolving deposits and
    financing are absent from `036`; third-party financing receipts are present in `036` even
    though no funds moved.
23. **Report Cash Disbursements** (`026`) with `Print GL Recap` for the period.
24. **Report Payables Disbursement** (`046`) — final check register per bank.

**Phase 4 — open transactional detail that must migrate, not just balances**
25. **Report Payable Approvals On Hold** (`043`) — bills on hold must arrive on hold with the
    same hold codes.
26. **Report Payables Activity** (`044`) with `Print GL Detail` for the period — gives the
    per-bill GL distribution. Note: checking Print GL Detail or Print GL Recap suppresses the
    vendor invoice number and invoice date for space, so run a second pass without them if you
    need invoice numbers.
27. **Report Detailed Daily Adjustments** (`039`) with `Include GL Postings` — all manual AR
    adjustments; run once per Transactions category (`Open Item`, `Deposit Liability`,
    `Revolving`, `Installment`, `Bad Debt Write Offs`) so each maps to the right STORIS bucket.
28. **Report Suggested Account Adjustments** (`055`) — offsetting debits/credits that should be
    keyed off **before** conversion, so you migrate net positions rather than paired noise.
29. **Report Recovered Bad Debts** (`053`) and the bad-debt write-off slice of `039` — charge-off
    history is easy to lose in a conversion.
30. **Report Projected Fixed Term Revolving Cash Flow** (`049`) — the forward revolving cash
    curve; a post-cutover re-run should reproduce it.
31. **Report Delinquent Accounts** (`038`) and **Report Collector Efficiency** (`033`) — the
    collections state, so collector quotas and delinquency buckets restart correctly.
32. **Report Audited Receivables** (`024`) — requires `Open Item Auditing` in Accounts
    Receivables Control Settings; if that flag is off, this report and the audit trail behind it
    do not exist. Turn it on **well before** cutover, not at cutover.

**Phase 5 — post-cutover proof**
33. Re-run steps 6, 9, 11, 13, 20 on STORIS with the same As Of date and diff against the
    archived legacy output.
34. Re-run **Report Posted Transactions** (`047`) and **Report Suspended Postings** (`058`) after
    the first STORIS End-of-Day.

### 7.3 Settings that must be right *before* the reports mean anything — INFERRED

These control settings change what the reconciliation reports collect or how they group. Each is
stated in the corpus as a prerequisite; getting them wrong invalidates the tie-out.

| Setting | Where | Effect | Source |
|---|---|---|---|
| `Open Item Auditing` | Accounts Receivables Control Settings | Without it, Report Audited Receivables does not exist and open-item/revolving audit data is not retained. | `024` |
| `Inventory-G/L Reconciliation Audit` | Costing Control Settings | Without it the system "does not collect all the data pertinent to the report". | `051` |
| `Extend Cash Balancing` | Cash Balancing Control Settings | Gates whether Report Cash Balancing Exceptions runs at EOD. | `025` |
| `Extended Cash Balancing Report` | Cash Balancing Control Settings | Chooses standard vs extended format for Cash Drawer Balancing Totals. | `027` |
| `Balance By` / `Group Payments by` / `Number of Tries` | Cash Balancing Control Settings | Determine drawer grouping columns and blind-balancing suspense behaviour. | `025`, `027`, `028` |
| `Daily Receipts Retention Months` | Accounts Receivable Control Settings | Controls how long `DAILY.DETAIL` survives before Generate Monthly Reports purges it — sets the window in which the Daily Receipts Register can be re-run. | `036` |
| `Credit Aging Method` | Accounts Receivable Control Settings | How credits are applied in Periodic/Bank aging. | `021` |
| `Report Sort By` | Accounts Receivable Control Settings | Whether AR ATB Detail shows customer code or name. | `021` |
| `Bill Aging Method` / `Bill Aging Days` | Payables Control Settings | Defaults for AP aging on `029`, `045`, `077`, `097`. | `029`, `045` |
| `End-of-Day Posted Transactions` | General Ledger Control Settings | Four-way switch that can **suppress GL Post Register record generation entirely**. | `047` |
| `Use Sub-Accounts` | General Ledger Control Settings | Turns the entire Sub-Account dimension on/off across every GL report. | `020`, `023` |
| `Multi Company Processing` | General System Control Settings | Whether Company is selectable or forced to the default on ~15 reports. | `004`, `026`, `029`, `040`, `041`, `044`, `045`, `047`, `054`, `058`, `077`–`099` |
| `Regional Processing` | General System Control Settings | Silently narrows report output to accessible customers/locations. | 23 articles, listed in §2.10 |
| `Summarize GL Postings` | TPA Control Settings | Enables summary batches, visible in View Multiple Postings. | `092` |
| `Multiple Customers Per Finance Account` | Financing Control Settings | Gates the FR Customer Selection / FR Cross Reference screens. | `002`, `003` |
| `Display Customer Name` | Financing Control Settings | Whether financing grids show name or code (on-account rows show `ON ACCNT` when set to codes). | `086`, `090` |

### 7.4 Known reconciliation traps — collected

1. **AR ATB grouped by Store of Activity cannot audit the GL** (`021`). Single most likely cause
   of a phantom AR-to-GL variance.
2. **Back-dated payments** hit the cash drawer on system date but the customer account and GL on
   the back date (`027`). Cash reports and GL will legitimately disagree across a back-dated day.
3. **Back-dated AP bills** may be excluded from the Payables ATB if they were not active on or
   before the As Of Date (`045`).
4. **Credit-card refunds on customer returns** are absent from Cash Drawer Balancing Totals and
   post only when the return is *completed* (`027`).
5. **Third-party financing receipts** appear on the Daily Receipts Register despite no funds
   received; **revolving deposits and financing do not appear at all** (`036`).
6. **Long-term revolving** appears on an on-demand AR ATB only when As Of = today (`021`).
7. **Debit/Credit columns are inverted** on Report Reconciliation Transactions relative to the
   stored values, deliberately, to match bank statements (`052`).
8. **Bank balance-forward** depends on the last purge date; a starting date earlier than that
   changes how the beginning balance is derived (`052`).
9. **Excluding zero-balance customers** still reports customers with a long-term receivable
   balance (`021`).
10. **GL security is not enforced** on Report Suspended Postings (`058`), so its totals can
    exceed what a restricted user sees elsewhere.
11. **PRV cannot render Summary Only** on `023`, `040`, `045`, `047` — a Summary Only + PRV
    request silently is not an option, so archived PRV copies of those four are always detail.
12. **Print GL Detail / Print GL Recap suppress invoice number and invoice date** on Report
    Payables Activity (`044`).
13. **Reference field truncation**: 25 characters accepted, 15 printed, on Report Cash
    Disbursements (`026`).
14. **TPA error log churn**: End of Day moves errors to history, so a report run after EOD can
    show already-fixed errors (`042`).

---

## 8. Open questions / not documented here

1. **The full list of date codes.** Only `CUS`, `TDAY`, `YDAY`, `CYTD`, `LYTD` are named, and
   `042` presents them as examples. `056` implies period-to-date codes exist but names none.
2. **Where Export Path is configured.** Every article says it is pre-set and non-editable "using
   this process"; no article says where it *is* editable.
3. **Whether Export Path is per-workstation or server-side.** The wording "computer drive and
   folder" suggests client-side; unconfirmed.
4. **Exported field lists** for 36 of the 43 file-producing reports (§6.2). Only `022`, `023`,
   `032`, `050`, `052` enumerate columns.
5. **Report Delinquent Accounts run-time options** (`038`) — the article describes the min/max
   balance, days-delinquent and aging-period behaviour in prose but documents no fields beyond
   Send Output to / Export Path.
6. **Report Summarized Aging Receivables run-time options** (`057`) — same gap.
7. **Report Suggested Account Adjustments run-time options** (`055`) — the whole-dollar
   credit-amount threshold is described but not documented as a field.
8. **Report Check Exceptions output columns** (`030`) — none stated.
9. **Report Cash Drawer Reconciliation Status run-time options** (`028`) — the output columns are
   listed but no selection fields are documented.
10. **Report Collector Efficiency access path** (`033`) — the Access section is empty.
11. **Report Reconciliation of Inventory to GL sort options** (`051`) — "select from the
    drop-down list", contents unstated.
12. **No tax reports.** The only tax artefact in this section is the Multiple Tax Jurisdiction
    Selection Window (`015`), and even that names no parent routine. Tax liability / tax
    collected / jurisdiction reporting must live in another section of the help centre.
13. **No deposit-liability report.** Deposit liability is visible per-customer (`063`, `066`,
    `069`) and as a Transactions filter on `039`, but there is no standalone report of total
    deposit liability by store — a real gap for cutover, since deposit liability is a balance
    sheet account.
14. **`View Revolving General Info Tab` (`094`) and `View Vendor Bills` (`097`) have empty Access
    sections** — reachable only as DTS tabs, presumably.
15. **`Report 80/20 Analysis` (`019`), `Report Product with Low Stock` (`048`),
    `Mapping Update Audit Report` (`007`)** are not accounting reports and are almost certainly
    mis-filed into this section; their true home is Merchandising/Inventory/Logistics.
16. **Multiple Credit Review Status Code Selection Window (`008`)** — the article body appears to
    be boilerplate lifted from a product-selection window (it references "product names" and a
    "Warranty Category field"). Its actual behaviour for credit review status codes is unverified.
17. **`Report Audited Receivables` (`024`) and `Report Summarized Aging Receivables` (`057`)** both
    say "Click here for your output options" — the linked list did not survive the scrape.
18. **Fifteen-plus selection windows are referenced but not documented** in this corpus (§4.3).
19. **`Report Payables Aged Trial Balance` access path** is listed as
    `Payables > Payables Views and Reports > Generate a Trial Balance` (`045`) — same menu label
    as the GL trial balance. Confirm the actual menu text to avoid the wrong report being run at
    cutover.
20. **`Report Payable Approvals On Hold` access path** goes through Third Party Accounting
    (`Accounting > Third Party Accounting > Payables > …`) in `043` — unclear whether the report
    exists outside TPA installations.
