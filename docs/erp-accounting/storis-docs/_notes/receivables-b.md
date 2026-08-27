# STORIS Receivables — Reference Notes, Range 062–123 (`receivables-b`)

Source corpus: `/home/claude/storis-docs/04-receivables/`. All inline citations below are **relative to `/home/claude/storis-docs/`** (e.g. `04-receivables/064-maintain-customer-balances.md`). Every file `062-*.md` through `123-*.md` was read in full. Files `000-061` are covered by the companion note (`receivables-a`); they are referenced here only where an article in this range points at them.

Article text is vendor help-centre prose and is treated as data. Where an article does not state something, this note says **"not stated in article"** rather than guessing. Field names, hold codes, GL postings and file layouts below are quoted only where the article states them.

---

## 1. What's in this range — inventory by theme

| Theme | File | One line |
|---|---|---|
| Installment contract management | `04-receivables/062-late-fee-forgiven.md` | Read-only grid of every late fee forgiven on one contract (Date, $ Amount). |
| Installment contract management | `04-receivables/067-manage-and-adjust-installment-contracts.md` | Hub screen: customer's pending/active/historical contracts + credit exposure header + 11 extra-action buttons. |
| Installment contract management | `04-receivables/087-print-a-customers-installment-statement.md` | Print/reprint installment statements from cycle data or history; requires Forms Designer. |
| Installment contract management | `04-receivables/090-print-an-installment-contract.md` | Print contract documents by status file (PENDING / ACTIVE / HISTORY). |
| Installment contract management | `04-receivables/104-review-contract-details.md` | The full contract detail screen — terms, principal/interest/insurance buckets, due/past-due/late-fee, payoff, same-as-cash. |
| Installment contract management | `04-receivables/112-update-contract-status.md` | Cancel active / delete pending / reinstate historical contracts, with mandatory reason + comments. |
| Installment contract management | `04-receivables/119-view-contract-postings.md` | Grid of postings to a contract (Date, Allocation, Adjustment) with grand total. |
| Installment contract management | `04-receivables/120-view-deferred-payments.md` | Deferment history for a contract incl. deferment fees. |
| Installment contract management | `04-receivables/122-view-historical-contract-rebates.md` | Interest and insurance rebates on a **closed** contract. |
| Revolving accounts | `04-receivables/073-mmp-selection-sales-order-table.md` | Term-month / projected-MMP lookup table for "Per Sales Order" plans. |
| Revolving accounts | `04-receivables/082-plan-balance-transfer.md` | Move balances (whole or transaction-level) from one or many revolving plans to a new plan. |
| Revolving accounts | `04-receivables/083-plan-deferment.md` | Defer selected revolving payments due; moves short term → long term. |
| Revolving accounts | `04-receivables/089-print-a-customers-revolving-statement.md` | Print/reprint revolving statements; on-demand vs scheduled XML behaviour. |
| Revolving accounts | `04-receivables/093-print-insurance-forms.md` | Print insurance acceptance / cancellation forms per customer+plan. |
| Revolving accounts | `04-receivables/107-revolving-credit-write-off-export-and-import.md` | Spreadsheet-driven write-off of revolving **credit** balances. |
| Revolving accounts | `04-receivables/108-revolving-payment-estimator.md` | Side-by-side comparison of up to 3 revolving plans; estimates only. |
| Revolving accounts | `04-receivables/109-revolving-plan-restriction-results.md` | Popup listing why a chosen plan failed its Restrictions-tab rules. |
| Revolving accounts | `04-receivables/110-revolving-prepayment.md` | Post an MMP prepayment ("PP" prefixed reference) when no MMP is due. |
| Revolving accounts | `04-receivables/113-update-disputes.md` | Put a plan or a single revolving-financed order in dispute; suspends late fees + finance charges. |
| Revolving accounts | `04-receivables/114-update-mmp.md` | Adjust principal / finance charge / finance charge fee / insurance / late fee / paper statement fee on one payment due. |
| Revolving accounts | `04-receivables/116-update-revolving-insurance-plans.md` | Bulk add/remove revolving insurance codes via tab-delimited or CSV import. |
| Payment agreements | `04-receivables/075-payment-agreement-entry.md` | Maintain/view Source + ID + #Payments-Per-Month on a customer's payment agreement. |
| Payment agreements | `04-receivables/076-payment-agreements-overview.md` | End-to-end concept: setup chain, MMP splitting 1/2/4 per month, file generation and import. |
| Servicing: deposits, credits, payments, refunds | `04-receivables/064-maintain-customer-balances.md` | The core AR maintenance routine — Manual Adjustments, Keyoffs, Bad Debt tabs. |
| Servicing: deposits, credits, payments, refunds | `04-receivables/065-maintain-customer-deposits.md` | Apply / refund / on-account / finance-credit deposit liability money. |
| Servicing: deposits, credits, payments, refunds | `04-receivables/066-maintain-order-credits.md` | Search completed orders that produced an AR credit and launch the refund. |
| Servicing: deposits, credits, payments, refunds | `04-receivables/072-misapplied-nsf-payment-results-screen.md` | Confirmation screen for NSF / misapplied-payment reversal. |
| Servicing: deposits, credits, payments, refunds | `04-receivables/078-payment-information.md` | Drill-down of credits/debits composing an order's credit balance. |
| Servicing: deposits, credits, payments, refunds | `04-receivables/079-payment-types.md` | Sub-window behaviour per payment method (check, third-party finance, gift cert, credit card). |
| Servicing: deposits, credits, payments, refunds | `04-receivables/080-place-deposit-on-order-screen.md` | Apply money being taken as a deposit against a specific open order. |
| Servicing: deposits, credits, payments, refunds | `04-receivables/081-place-money-on-account-screen.md` | Park money on account for later application. |
| Servicing: deposits, credits, payments, refunds | `04-receivables/111-take-multiple-deposits.md` | Choose which deposit payment types (and amounts) fund a refund. |
| Servicing: deposits, credits, payments, refunds | `04-receivables/095-reassign-a-customers-store-location.md` | Move a customer's AR/deposit/revolving balances between stores, with full GL transfer. |
| Statements and statement messaging | `04-receivables/068-manage-statement-message-criteria-assignment.md` | Assign statement messages **to** a Plan/State/Store criterion. |
| Statements and statement messaging | `04-receivables/069-manage-statement-messages.md` | The inverse view: which criteria are assigned to a given message code. |
| Statements and statement messaging | `04-receivables/085-print-a-customer-as-of-statement.md` | "As of today" open-item statement by location/district/customer. |
| Statements and statement messaging | `04-receivables/086-print-a-customer-statement.md` | Cycle-generated open-item statements; All/Regular/Hold; reprint from history. |
| Statements and statement messaging | `04-receivables/088-print-a-customers-layaway-statement.md` | Layaway statements with user-supplied due-days, % due, cancellation days. |
| Delinquency, collections, repossession | `04-receivables/091-print-collections-letters.md` | Batch collections letters via Excel export or Enhanced Laser XML; ~40 merge fields. |
| Delinquency, collections, repossession | `04-receivables/096-reassign-collector-screen.md` | Manually reassign or remove a customer from Collections. |
| Delinquency, collections, repossession | `04-receivables/102-request-legally-entitled-to-let-documents.md` | Generate the LET (Legally Entitled To) repossession document; sets LET expiration. |
| Delinquency, collections, repossession | `04-receivables/094-process-repossessed-items.md` | Step 1 of repossession: pick customer with a current LET. |
| Delinquency, collections, repossession | `04-receivables/074-original-document-select-repossessions.md` | Step 2: pick line items and quantities to repossess. |
| Delinquency, collections, repossession | `04-receivables/123-waived-item-select.md` | Add non-LET items to the repossession list (permission-gated). |
| Credit bureau reporting / Metro 2 | `04-receivables/071-metro-2-customer-credit-recovery.md` | Restore CUSTOMER / IR.ACTIVE / IR.HISTORY from saved recovery data after a fatal Metro 2 failure. |
| Credit bureau reporting / Metro 2 | `04-receivables/077-payment-history-profile.md` | Manually edit a customer's per-cycle delinquency codes (0–6, C, B). |
| Credit bureau reporting / Metro 2 | `04-receivables/098-repair-metro-2-customer-credit-history.md` | Correct the most recent Metro 2 file (CCC, account status, special comment, DOFD). |
| Credit bureau reporting / Metro 2 | `04-receivables/099-report-metro-2-customer-credit-history.md` | Produce the bureau file; exclusion rules and Date-of-First-Delinquency semantics. |
| Credit applications, approvals and holds | `04-receivables/092-print-credit-request-status-letters.md` | Batch approve/decline/conditional + credit-limit change letters, print or email. |
| Credit applications, approvals and holds | `04-receivables/097-release-orders-from-credit-hold.md` | Monitor grid of orders on credit hold; drill into the matching approval screen. |
| Credit applications, approvals and holds | `04-receivables/101-request-credit-information.md` | Step 1 of a credit application (store, SSN/customer, bureau, marketing codes). |
| Credit applications, approvals and holds | `04-receivables/103-request-new-credit-report.md` | Re-pull a bureau report / spawn a new review item from a closed one. |
| Credit applications, approvals and holds | `04-receivables/105-review-credit-requests-on-hold.md` | Work queue of "hold"-status credit reviews. |
| Credit applications, approvals and holds | `04-receivables/106-review-pending-credit-requests.md` | Work queue of pending (non-hold) reviews; C6 hold release logic. |
| Credit applications, approvals and holds | `04-receivables/115-update-receivables-credit-approvals.md` | Approve/reject/skip AR credit holds per order×hold code; shows aging buckets. |
| Vendor receivables | `04-receivables/070-manual-adjustments-in-vendor-receivables.md` | Adjust an open vendor receivable; optional "Convert to Payable". |
| Vendor receivables | `04-receivables/117-vendor-receivables-payment-on-account-adjustments-screen.md` | Apply vendor on-account money to an open vendor receivable. |
| Views / inquiry and utility | `04-receivables/118-view-a-customers-payment-activity.md` | All payment + deposit activity in date order; drill to detail. |
| Views / inquiry and utility | `04-receivables/121-view-details-of-payment-activity.md` | One payment's detail, allocation, and receipt reprint. |
| Views / inquiry and utility | `04-receivables/063-life-of-the-south-lots-insurance-file-layouts.md` | Fixed-width LOTS enrollment + premium file layouts. |
| Views / inquiry and utility | `04-receivables/084-premier-insurance-file-layout.md` | Column-mapped Premier enrollment + premium files. |
| Views / inquiry and utility | `04-receivables/100-reportoutput.md` | Boilerplate "Send Output to / Export Path / Actions" fragment reused by report screens. |

---

## 2. Servicing operations

### 2.1 Maintain Customer Balances — the workhorse (`04-receivables/064-maintain-customer-balances.md`)
Three tabs, each independently security-gated:

**Manual Adjustments.** Back-office entry of manual invoices, customer returns, and adjustments to existing open items.
- `Date` — posting date; **future dates are rejected**, current date defaults.
- `Reference` — for a new manual invoice/memo the system generates it *only if* `Next Deposit Number` in **Accounts Receivables Control Settings** has a value; otherwise the reference is user-defined. STORIS **always prefixes `MP`** to the reference regardless of origin.
- `Action` — `Adjust` (new adjustment) vs `Maintain` (edit Terms, Memo Reference, In Dispute on an existing open item only).
- `Type` — `(09) Invoice` = manual debit; `(39) Memo` = manual credit memo. Not editable when adjusting an existing item.
- `Terms` — entering a valid terms code opens the Open Item Terms screen; a discount term recalculates Due Date, Discount Dates 1 & 2 and Discount Amounts 1 & 2.
- `Memo Reference` — 10 chars, defaults `MAN ADJ`.
- `In Dispute` — **items in dispute cannot be adjusted**; the dispute flag must be cleared first. Only active when an existing open item is selected AND (Action = Maintain OR the item is already in dispute).
- Grid columns: Reference, Dispute, Post, Type, Description Memo Reference, A/R Amount, Adjustment, Actions, Maintain GL Postings.

**Keyoffs.** Applies credits to debits, refunds credits, parks credits on account, and pushes open items into long-term balances.
- `Action` options: `Pay`, `Keyoff`, `Refund`, `Long Term Revolving`, `Long Term Installment`.
- `Long Term Installment` is **active only if the customer has an active installment contract and no installment payments currently due**.
- `Plan` / `Installment Contract` — keyoffs post to **one** plan or **one** contract at a time.
- `Proof` must be **zero** before the account will update. Credits keyed off increase Proof; debits paid decrease it.
- Credit amounts are entered with a minus sign.
- Grid action letters: `P=Pay, K=Keyoff, R=Refund, O=On Account, L=Long Term Revolving, I=Long Term Installment`.

**Bad Debt.** See §3.3.

### 2.2 Late fees — assessment, forgiveness, suspension
- **Forgiveness view**: `04-receivables/062-late-fee-forgiven.md` shows only Date and $ Amount per forgiven fee; the *entry* routine `Forgive Late Fees` is outside this range (`04-receivables/049-forgive-late-fees.md`).
- The forgiveness counter and last-forgiven date surface on the contract detail screen as `Late Fee Forgiven ( )` (`04-receivables/104-review-contract-details.md`).
- **Suspension by non-accrual**: alert code `NA` suspends "further accumulation of interest and late fees" (`04-receivables/064-maintain-customer-balances.md`). **Insurance charges continue to cycle even in non-accrual status** — stated explicitly.
- **Suspension by dispute**: placing a revolving plan/order in dispute "suspends assessment of late fees and finance charges" (`04-receivables/113-update-disputes.md`). Granularity of finance-charge suspension is chosen at `Suspend Interest On`: `Total Balance`, `Dispute Balance` only, or `No Suspension` (default).
- **Late fees can be adjusted directly** on a revolving payment due via the `Late Fees $` field in `04-receivables/114-update-mmp.md`; the adjustment cannot exceed the balance due for the transaction.
- **Late fees can revoke a promotion**: if `Revoke Same as Cash After ___ Late Fees` is enabled in **Installment Payment Plan Settings** and the customer exceeds the count, the displayed payoff becomes "the revoked amount plus (+) interest" (`04-receivables/104-review-contract-details.md`).

### 2.3 Payoffs and rebates
- Contract-level payoff shows on both the hub grid (`Payoff $`, calculated using the system date — `04-receivables/067-manage-and-adjust-installment-contracts.md`) and the detail screen (`Payoff Valid` with a through-date; Search button opens **Calculate Payoff and Rebate Amounts** — `04-receivables/104-review-contract-details.md`).
- `Same as Cash` on the detail screen is the date by which full payment earns "full interest and insurance rebates".
- Realised rebates on closed contracts are viewable per charge type with Original vs Rebate amounts (`04-receivables/122-view-historical-contract-rebates.md`).
- Cancelling an active contract routes through the **Installment Receivables Payoff As-of Date** screen (`04-receivables/112-update-contract-status.md`; that screen is `04-receivables/060-*`, outside this range).
- **Revolving prepayment**: allowed only when the customer has ≥1 active revolving plan with a balance **and no MMPs currently due**; reference auto-prefixed `PP` (`04-receivables/110-revolving-prepayment.md`).

### 2.4 Refunds
Refund paths documented in this range:
1. **Deposit refunds** — `04-receivables/065-maintain-customer-deposits.md`. Action codes `A`=Apply, `R`=Check Refund, `I`=Immediate Refund, `O`=On-Account, `F`=Finance Credit.
   - Immediate refund requires the payment type to be active at `Immediate Deposit Refund Types` in **Accounts Receivables Control Settings**; otherwise only Check Refund is possible.
   - If the current date is **closed for payments** (Actions button in AR Control Settings), immediate refunds are blocked.
   - Credit-card deposits refund only to the same card or to gift card; debit-card deposits refund to cash, gift, or that same debit card.
   - `Daily Maximum Cash Refund Per Customer` (AR Control Settings) caps cash refunds unless the user has `Override Daily Maximum Cash Refund Per Customer` in Receivables Security.
   - **Adyen**: card must be present for an independent refund; on save the money lands **on account** and must be issued through Enter a Customer Payment/Refund/Gift Certificate.
   - Builder allowance and in-store-use-only gift certificates **cannot be refunded** but their deposits can be applied to another order.
2. **Revolving credit-balance refunds** — same article. Processed separately from other deposit types. `I` = immediate refund to the last payment type used on the plan that generated the credit; `R` = check refund. Check refund is forced when **multiple payments** contributed to the credit balance (even the same payment type twice) or when **no payment history** is found. Partial refunds are **not permitted** — the amount field is auto-populated and inactive.
3. **Order-credit refunds** — `04-receivables/066-maintain-order-credits.md` finds exchanges, returns, credit adjustments, on-account payments and manual credit memos that produced an AR credit; the Refund column jumps to the *Process Receivables* tab of Enter a Customer Payment/Refund/Gift Certificate.
4. **Keyoff refunds** — `Refund` action in `04-receivables/064-maintain-customer-balances.md`, gated by `Maintain Customer Balances - Refund`.
5. **On-account money is refunded from Maintain Customer Balances, not from Maintain Customer Deposits** — stated explicitly in `04-receivables/065-maintain-customer-deposits.md`.
- Multi-tender refunds: `04-receivables/111-take-multiple-deposits.md` — a single session may not mix a credit/debit card line with another payment type; you must exit and re-enter the screen.
- Refund receipts are controlled by `Maintain Customer Deposits Refund Receipts` in **Point of Sale Control Settings**; an **Accounts Payable refund prints no receipt and captures no signature**.

### 2.5 Statement / billing generation
Common cycle model across open-item, installment and revolving statements (`04-receivables/086-*`, `087-*`, `089-*`):
- New statements are built by the **Cycle Process during End-of-Day**; the print routines only render them.
- After regular statements print they move to the **History file**. Unprinted statements are pushed to history at the *start* of the next cycle process.
- `Statement History Retention` (**Account Statement Cycling Control Settings**) sets how long they live; **End-of-Month purges the Statement History File**.
- `Statement Type` = All / Regular / Hold. "All" prints in fixed order: hold-customer statements → hold-credit-balance statements → regular, with a separator page after each type.
- "Hold" is set by `Hold Statement` in **Customer Settings** (open item) or `Hold Customer's Statement` in **Advanced Customer Settings** set to Yes **or blank** (installment/revolving), and/or `Hold Credit Balance Statements` in Account Statement Cycling Control Settings.
- Installment and revolving statement printing **require `Statement Form` = Forms Designer**; the open-item routine supports `Forms` (load and test-print each run) or `Laser` (direct).
- XML output is per-type and gated: `Create XML for Open Item Statements and Export To`, `Create XML for Installment Statements and Export To`, `Create XML for Revolving Statements and Export To`, all on the **Advanced tab** of Account Statement Cycling Control Settings, with NFS as the output option.
- Revolving only: run **on demand** → statement or XML, Output Options inactive unless an NFS path exists; run **scheduled** → always XML down the Output Options path (`04-receivables/089-print-a-customers-revolving-statement.md`).
- **As-of statements** (`04-receivables/085-print-a-customer-as-of-statement.md`) are printed live "as of today", not from the cycle file. Single-customer printing **overrides** `Generate Zero Balance Statements`, so a zero-balance statement will print.
- **Layaway statements** (`04-receivables/088-print-a-customers-layaway-statement.md`) are parameter-driven, not cycle-driven: `Number of Days Until Money is Due` → "Payment Due By"; `Percent of Invoice Amount Due` → amount due; `Number of Days Until Cancellation` (added to sale date) → "Must Deliver By"; `Written Start/End Day` (1–31) selects which orders print.
- Statement messages are assigned by **Plan / State / Store** criterion. State and Store are mutually exclusive (choosing one greys the other). Blank = All. Two mirror screens: message→criteria (`04-receivables/069-manage-statement-messages.md`) and criteria→messages (`04-receivables/068-manage-statement-message-criteria-assignment.md`).

### 2.6 Due-date and cycle handling
- **Store reassignment changes the cycle**: if the new store has a different due day, the new store's due date **overwrites** the customer's due date in Customer Settings, and the next cycle occurs on the first due-cycle day at least **30 days after the last cycle date** — explicitly warned as possibly producing an **extended (>30 day) cycle period** (`04-receivables/095-reassign-a-customers-store-location.md`).
- Contract due day is displayed as `Due Day` on the hub grid and is changeable via the Adjust Payment Terms / change-due-day actions listed in `04-receivables/067-manage-and-adjust-installment-contracts.md` (those entry screens are outside this range).
- Revolving MMP due dates are editable per payment via `Due On` in `04-receivables/114-update-mmp.md`.
- LET expiration date **equals the customer's next cycle date** (`04-receivables/102-request-legally-entitled-to-let-documents.md`).
- Payment-agreement plans cycle like normal revolving plans **except MMP generation**: 1, 2 or 4 MMPs per month per the source's Payments Per Month; the monthly MMP total is divided by that count and principal/interest/insurance is broken down per scheduled payment with its own due date (`04-receivables/076-payment-agreements-overview.md`).

---

## 3. Delinquency, collections and recovery

### 3.1 Collector workflow
- **Assignment** is evaluated by the system; store reassignment triggers a re-evaluation and reassigns the customer "to the appropriate collector for their new location" (`04-receivables/095-reassign-a-customers-store-location.md`).
- **Manual reassignment / removal** via `04-receivables/096-reassign-collector-screen.md`, reached from the *Collector Review – Customer Update Screen* (`04-receivables/021-*`, outside range). Only available for collectors whose `Allow Manual Assignment` is enabled in **Collector Settings**. Checking `Remove` clears and disables `New Collector`. Both actions are written to the customer's **Collections Comments** file.
- **Collections letters** (`04-receivables/091-print-collections-letters.md`) filter by District / Store Location / Collector / Letter. District and Store Location are mutually exclusive; each is active only if the corresponding field is enabled in **Collections Processing Control Settings** (District additionally requires Regional Processing active).
- Output is either an **Excel export** (one column per data element, one row per customer, for mail-merge) or **Enhanced Laser XML**, chosen by `Collections Letter` = Export Letter in Collections Processing Control Settings. `Name of File` / `Path to File` are active only in export mode (UNC or drive path).
- **Merge data passed per letter** (verbatim list): Customer Name, Address 1/2, City, State, Zip, Home/Work/Cell phone, Email, Credit Limit, Occupation, Employer + Employer Address 1/2, Co-Applicant Name, Co-Applicant Employer, Cosigner + Cosigner Address 1/2, Cosigner Occupation, Cosigner Employer, **Long Term Revolving Balance, Open Item Balance, Total Account Balance, Current Due, Past Due 1 to 30, Past Due 31 to 60, Past Due 61 to 90, Past Due 91 to 120, Past Due Finance Fees, Past Due Insurance, Past Due Interest, Past Due Late Fees, Past Due Principal**, Last Payment Amount/Date, Last Purchase Amount/Date, Promise to Pay Date, Promise to Pay Amount.
  - Note the two distinct past-due decompositions: **by age** (4 buckets to 120) and **by component** (principal / interest / late fees / finance fees / insurance).

### 3.2 Aging buckets — where they appear in this range
| Screen | Buckets |
|---|---|
| `04-receivables/115-update-receivables-credit-approvals.md` | Current, 1-30, 31-60, 61-90, **Over 90** |
| `04-receivables/083-plan-deferment.md` | 1-30, 31-60, 61-90, **91-120, 120 +** |
| `04-receivables/091-print-collections-letters.md` | Current Due, 1-30, 31-60, 61-90, **91-120** (no >120 field listed) |
| `04-receivables/077-payment-history-profile.md` | Metro-2 codes 1..6 = 30-59, 60-89, 90-119, 120-149, 150-179, 180+ |
There is **no single canonical bucket set**; the deferment screen carries five buckets while the credit-approval screen carries four. Not reconciled in any article.

### 3.3 Bad debt: charge-off, non-accrual, reinstatement (`04-receivables/064-maintain-customer-balances.md`)
Reclassification is **always manual** on the Bad Debt tab; an **Automatic Charge-Off process** exists separately via Accounts Receivable Control Settings.
- Screen shows: current and past due amounts, total currently due, **Revolving Balance, Installment Balance, total account balance, charged-off balance**.
- `Alert Code` values:
  - **`NA` (Non-Accrual)** — suspends further interest and late-fee accumulation; excludes the customer from all mailing lists by auto-enabling `Do Not Solicit` in Customer Settings. **Insurance still cycles.**
  - **`CO` (Charged Off)** — reduces **both long and short term receivable balances to zero**, removes all existing open items, and prohibits all sales-order and receivable processing **except payment applications**. The charge-off executes on **Save**: balance removed, GL posted, account closed to new activity.
  - **`None Selected`** — reinstatement. Prompt: "Reinstate the customer to current status? Yes No." Answering Yes moves the previously zeroed A/R back into current A/R via a manual adjustment.
- **Sequencing control**: if `Charge-Off before Non-Accrual` is enabled in AR Control Settings, `CO` is only selectable after the account has been set to `NA`.
- **Hard blocker**: you **cannot** assign `CO` or an automatic write-off code to accounts with **active revolving plans or active installment contracts** — those must be cancelled first.
- **Revolving reinstatement mechanics**: reinstated revolving plans reopen with a long-term balance equal to the charged-off amount **net of payments applied and repossessions processed while charged off**. A reinstated plan **has long-term balance only and generates no MMPs until it cycles**; MMPs needed immediately must be posted manually via Adjust Revolving Plans.
- Payments to charged-off accounts go through Enter a Customer Payment/Refund/Gift Certificate or Enter a Customer Payment (the Bad Debt Payment Entry screen is `04-receivables/014-*`, outside range).

### 3.4 Revolving credit write-off (`04-receivables/107-revolving-credit-write-off-export-and-import.md`)
This is write-off of **credit** balances (customer-owed-to-us reversed), distinct from bad-debt charge-off.
- Three actions: `Export New Credit Write-Off`, `Clear Current Credit Write-Off`, `Import Current Credit Write-Off`.
- Filter by **State or Store Location** (mutually exclusive); both fields are unavailable during import.
- Selection volume is further filtered by `Amount Threshold` and `Inactivity Days` in **Sales Tax Settings** (as stated — an unusual home for these fields).
- Eligibility exclusions, verbatim: plans **with** a current due amount; customers with **legal codes**; customers **charged off or non-accrual**; plans **without any available statement history**.
- The spreadsheet may only have rows **removed** — rows cannot be added and amounts cannot be edited.
- **Other plan balances are not netted**: a customer with one debit-balance plan and one credit-balance plan will still have the credit plan selected.
- GL target: `Revolving Credit Write-Offs` on the **Revolving page of General Ledger Assigned Account Settings**.
- Import errors surface in **Report Error Messages**.

### 3.5 Repossession chain
Three-screen flow plus the LET prerequisite:
1. **LET document** (`04-receivables/102-request-legally-entitled-to-let-documents.md`) — STORIS tracks every revolving-financed sale plus subsequent deposits, payments and fees in order to produce it. Shows outstanding debt, purchase history since last zero balance date, and payment history.
   - `LET Expiration Date` = the customer's **next cycle date**; printing (re)stamps it, and that date is the flag that enables/disables the repossession return.
   - Only the **short form** exists (`LET Print Version` is inactive).
   - Sections: Legally Entitled To Items; Retail Purchases since Last Zero Balance Date; Repossession Notice; Waiver of Rights.
   - Legally-Entitled-To Items lists only items on **invoices not paid in full**, ordered by invoice date, then by price paid **least→most expensive**, taken **from the last piece on the order backwards** until the remaining revolving balance is filled. Excludes items already returned or repossessed and items whose product **Group** has `Legally Entitled to Repossess` unchecked (article's example: flooring).
   - Item columns: Seq Nbr, Invoice Date, Invoice #, Product Number, Description, Brand, Piece Number, Sell Price, Price Paid.
   - **Legal-code gate**: if any legal code assigned to the customer disallows repossession, only users with `Repossession; Override Legal Setting for Allowing Repossessions` (Receivables Security) may generate the LET.
   - Without `Repossession - Access Waived (LET) Items`, the *Items Purchased Since Last Zero Balance Date* section is **omitted from the printed report**.
   - XML export filename pattern: `LET_<customer account>_<mmddyyyy>.XML` (example given: `LET_10133781_02242009.XML`), written to the **Maintain NFS Root Paths** location; **same-name files are overwritten**.
   - **Retention**: End-of-Month purges all LET documents older than the customer's last zero balance date, for customers beyond the months-retention setting.
   - Zero balance date definition: the most recent date on which no open balance amounts existed; captured when a customer pays down to zero **and when a new customer account is set up**.
2. **Process Repossessed Items** (`04-receivables/094-process-repossessed-items.md`) — only customers with a LET generated **during the current cycle period** are selectable, and only items appearing on a LET are returnable. The routine is **not available at all** unless such LETs exist. Delete button inactive. Save advances to step 3.
3. **Original Document Select** (`04-receivables/074-original-document-select-repossessions.md`) — items sold on the same line item are grouped on one grid row; `Repossessed Quantity` is editable 0..available; previously returned items are unavailable. Remove and Delete buttons inactive. Grid: Product, Description, Transaction #, Transaction Date, Selected, Reason, Price, Available.
4. **Waived Item Select** (`04-receivables/123-waived-item-select.md`) — reached from the Actions button in step 3; lists **all other items purchased by the customer excluding third-party-financed items**, ordered by completion date then selling price. Permission-gated by `Repossession - Access Waived (LET) Items`.

### 3.6 NSF and misapplied payments
- `04-receivables/072-misapplied-nsf-payment-results-screen.md` is only the confirmation step of *Apply NSF and Correct Misapplied Payments* (`04-receivables/007-*`, outside range): tick `Proceed With Update`, view transaction comments.
- **After a misapplied-payment reversal you must re-apply the payment using Enter a Customer Payment** — the reversal does not re-post it.
- Receipt reprint is **blocked for payments that have been misapplied or NSF'd** (`04-receivables/121-view-details-of-payment-activity.md`).

### 3.7 Disputes (`04-receivables/113-update-disputes.md`, plus open-item disputes in `064`)
Two independent dispute mechanisms:
- **Open item dispute** — checkbox on Maintain Customer Balances; blocks adjustment of the item until cleared. Also present on vendor receivables (`04-receivables/070-manual-adjustments-in-vendor-receivables.md`).
- **Revolving dispute** — plan-level or single order/transaction. `Dispute Order` = All Orders vs a specific transaction. When a specific transaction is chosen, the dispute amount is enterable but **cannot exceed the transaction's remaining balance**; for All Orders the field shows the plan balance read-only.
  - `Reason` is **mandatory** and must carry Usage Code **Revolving Disputes**.
  - `Remove On` = auto-resolve date processed at **month-end**; `Resolved On` = immediate resolution.
  - Disputed plans are excluded from the master-plan deferment target list (`04-receivables/083-plan-deferment.md`).

### 3.8 Credit-bureau delinquency reporting (Metro 2)
- **Report** (`04-receivables/099-report-metro-2-customer-credit-history.md`): reports only data created since the last run; start date is fixed at last-run+1 and end date at today (both read-only).
  - Scope: **United States customers only, Revolving Receivables information only**, plus compliance condition codes and date of first delinquency per FCRA/FCBA.
  - Excludes: customers whose charge-off date precedes the reporting period; customers with `Do Not Report to Credit Bureau` checked in **Customer Legal Settings** (Actions → Legal Settings on the Receivables page of Advanced Customer Settings).
  - Three additional AR Control Settings exclusions: paid out for N cycles; credit balance for N cycles; cycle balance zero + last cycle balance zero + account younger than N months.
  - **Compliance Condition Code logic**: report the CCC only when the *reported date* is **less than** the *updated date*; otherwise report blank. On reporting, `Compliance Condition Code Reported Date` is stamped with the system date.
  - **Date of First Delinquency**: recorded by the system; **not removed until the customer becomes current**, and a **new** DOFD is assigned if the customer re-delinquates.
- **Repair** (`04-receivables/098-repair-metro-2-customer-credit-history.md`): editable only against the **most recent** credit history file — historical files are protected because the Credit Reporting Resource Guide requires corrections before the next submission. Produces `MM_DD_YYYY_REPAIR`; **only one repair file per reporting period**, later edits overwrite it. Every field change is logged to the **Customer Comments** file.
  - `Metro 2 ID` format: revolving = Customer Code; installment = `Customer Code*Installment Plan`.
  - Editable: Compliance Condition Code, Account Status (only statuses with `Manual Assignment` enabled in **Account Status Settings**, and only if the customer already has a manually-assignable status), Special Comment, Date of First Delinquency.
  - `Consumer Information Indicator` **cannot be manually assigned**; CIIs attach automatically to bankruptcy/reaffirmation legal codes and are shown in the **Legal Code Settings** grid.
  - `Payment History Profile` shows the past **24 months excluding the most recent month**; the word `Modified` appears if it has been edited.
- **Payment History Profile editing** (`04-receivables/077-payment-history-profile.md`): codes `0`=current (**not updatable**), `1`=30-59, `2`=60-89, `3`=90-119, `4`=120-149, `5`=150-179, `6`=180+, `C`=STORIS-defined Current, `B`=customer did not exist (**not updatable**). The most recent cycle period is omitted from the display and cannot be edited. Month 1 in the grid = the cycle period *before* the most recent.
- **Recovery** (`04-receivables/071-metro-2-customer-credit-recovery.md`): re-copies saved recovery data back into **CUSTOMER, IR.ACTIVE and/or IR.HISTORY** after a fatal mid-run failure, then the report can be restarted. Sets a per-record recovery flag true; records skipped due to **locking** keep the flag false and require a re-run. Re-runnable; only un-updated records are reselected. **No special staff security exists on this process** — menu access is the only control (the article says so explicitly).

### 3.9 Legal / settlement handling
Legal handling appears only indirectly in this range: legal codes gate repossession (`102`), gate revolving write-off eligibility (`107`), and drive Metro 2 CII assignment (`098`). The **Legal Code Settings**, **Customer Legal Settings** and lien-registration screens themselves are outside this range (`04-receivables/045-enter-lien-registration-information.md`). No settlement, payment-plan-negotiation, or promise-to-pay *entry* screen exists in 062–123 — Promise to Pay only appears as two collections-letter merge fields (`091`) and its entry screen is `04-receivables/013-*`.

---

## 4. Revolving accounts

### 4.1 Plan-level restructuring
**Plan Balance Transfer** (`04-receivables/082-plan-balance-transfer.md`)
- Transfers one plan or **many plans → one plan**, at **individual transaction granularity** (any combination of transactions across plans).
- Transferred balances become subject to the **new plan's** overrides, restrictions and settings. Activity is written to the **Customer Activity Log**.
- **Term comparison**: promotional and fixed terms of the two plans are compared; fixed term is compared separately and is *not* treated as promotional. Differences raise a warning with cancel/continue.
  - Promotional → non-promotional: **current promotional terms are removed**.
  - Non-promotional → different-promotional: the new plan's terms are applied **as of the original invoice date**.
- `New Plan` is mandatory and **cannot** be a master plan, a Per Sales Order plan, a Per Sales Order Using a Fixed Term plan, or the same as the current plan. The target plan must have `Allow Other Plans to Transfer to this Plan` enabled on the **Advanced tab of Revolving Payment Plan Settings**.
- `MMP$` override is available only when the new plan is "Using a Fixed Table" or "As a Fixed Amount"; entering below the calculated MMP produces a message on Save.
- `Chargeback Waived Interest` (default **unchecked**): if checked, previously waived interest on the selected transactions transfers to the new plan and becomes part of its **long term balance**, and **waived finance fees are charged back too**. Charged-back waived interest is **not added to the year-to-date interest bucket**. If unchecked the interest stays waived and the waived amount is **retained per transaction** for a possible future chargeback.
- `Close Current Plan` (default unchecked) stamps a closed date of the current day, and only if balances actually transferred.
- Grid columns: Transaction, Plan, Posted, Amount $, Remaining $, Waived $, Expires (no-interest expiry), No Pay Until, MMP $ (per-invoice plans).
- Bulk equivalent: **Import Revolving Plan Balance Transfer** (`04-receivables/054-*`, outside range).

**Plan Deferment** (`04-receivables/083-plan-deferment.md`)
- Grid lists revolving payments for **all** plans except plans that do not allow deferments; those plans are also excluded from the Current Due and Past Due totals shown.
- On deferment each payment moves **short term → long term**, carrying **principal, interest, insurance and finance fees**.
- Payments/credits already applied to a deferred payment due **reduce the deferred amount** by that amount.
- **GL: one batch per session**, covering all payments deferred in that session.
- `Master Plan to` selects the destination plan for master-plan deferments; the list is the customer's open plans **not in dispute**; default is a plan without promotional terms that has a balance, falling back to the promotional plan if that's the only one with a balance.
- Comments are editable until the deferment completes and are posted to the **Customer Activity Log** on save.
- Bulk equivalent: **Import Revolving Plan Deferments** (`04-receivables/055-*`, outside range).

### 4.2 Minimum monthly payment (MMP)
- **Adjustment** (`04-receivables/114-update-mmp.md`): components adjustable are `Principal $`, `Finance Charge $`, `Finance Charge Fee $`, `Insurance $`, `Late Fees $`, `Paper Statement Fee $`. **None may exceed the balance due** for the selected transaction (paper statement fee: cannot exceed the current fee amount, may be positive or negative).
  - **Directionality is explicit**: *positive adjustments reduce the long term balance and increase the short term balance; negative adjustments increase long term and reduce short term.* **MMP cannot go below zero.**
  - `Finance Charge Fee $` is only active if the customer's state assesses one via the **Revolving tab of Sales Tax Settings**.
  - `Reason` is mandatory, restricted to reason codes with Reason Usage Code = **Revolving Adjustments**.
  - Grid (informational): Transaction Type, Memo reference, Date, Debit, Credit, Balance.
- **Estimation** (`04-receivables/108-revolving-payment-estimator.md`): compares up to 3 plans. The estimator's MMP is an **overall** MMP that includes the customer's **current and pending balances** — not just this order. Explicit disclaimer that figures are estimates.
  - Plan availability is limited by plan dates and **location restrictions**, where the location depends on entry point: menu → login location; Enter a Sales Order → the order's store location; Shopping Cart → login location; View All Revolving Plan Activity → login location.
  - Defaults come from **Revolving Payment Estimator Defaults** in Warehouse/Store Location Settings and Revolving Receivables Control Settings; an order-supplied plan always wins for Option 1. Whether the user may change an option is governed by the `Allow Changes` setting at each Option field.
  - `Deposit Amount`: an existing order deposit is **NOT** used as a default — the plan's minimum deposit is used instead.
  - Promotional interest rate and expiration date display only if promotional financing is defined on the plan.
- **Per Sales Order MMP table** (`04-receivables/073-mmp-selection-sales-order-table.md`): term months enumerated as **2, 3, 6, 12, 18, 24, 36, 48, 60** ascending, with Projected MMP Amount descending; double-click writes back to Monthly Payment / Term Months on the estimator.

### 4.3 Plan eligibility and restrictions
`04-receivables/109-revolving-plan-restriction-results.md` lists the messages surfaced when an ineligible plan is keyed on the sales-order Payment tab. Rules live on the **Restrictions tab of Revolving Payment Plan Settings**. Example messages given: minimum deposit not applied; minimum credit score restriction exists but customer has no score; score below minimum; maximum score restriction exists but no score; score above maximum; customer more than N days past due; plan cannot be used in store X.
`04-receivables/106-review-pending-credit-requests.md` adds: restricted plans are **not shown in the finance plan lookup**, and keying one produces a message naming the failing reason.

### 4.4 Insurance on revolving plans
- **Bulk maintenance** (`04-receivables/116-update-revolving-insurance-plans.md`): import spreadsheet with `Customer ID`, `Plan ID`, `Insurance Code`. Template is downloaded from the STORIS support site; the file must be saved as **tab-delimited .txt or .csv**.
  - `Plan ID` is required unless `Default Insurance from Other Plans` is checked in **Revolving Receivables Control Settings**; when that setting is on, the code is applied to **all** the customer's revolving plans and supplying a Plan ID is an error.
  - `Insurance Code` = a valid code from **Extended Receivables Insurance Code Settings** (adds to an active plan; **insurance charges are not assessed on past balances**) **or** the `Clear Data/Field Indicator` from **General System Control Settings** (removes the code from an active or inactive plan; **existing insurance charges are not forgiven**).
  - Audit comments go to the **Customer Activity Log**; the **master revolving plan is not updated**.
  - Works on inactive customers; **no updates occur for customers in charge-off status**. Errors are reported by the auto-run *Report Update Revolving Insurance Plans*.
- **Forms** (`04-receivables/093-print-insurance-forms.md`): prints the acceptance letter and/or cancellation letter per customer + revolving plan (+ contract, if the plan has one).
  - Insurance code entry is blocked once the customer's age is **≥ the cutoff age** in Revolving Receivables Insurance Code settings.
  - `Apply Insurance by Plan` = **Customer** → the customer's insurance code defaults and is locked (unless `Exempt from Insurance Charges` is set, which inactivates the dropdown); = **Plan** → selectable unless exempt. Both settings live in **Revolving Receivable Control Settings**.
  - Checkbox availability rules: no code on the customer/plan but a code typed here → **Cancellation Form only**; code present → both; code present but overridden here → **Cancellation Form only**.
  - E-signature requires the Insurance Code program enabled in **Configure Document Signature Capture**, signature hardware, and `Request Signature` enabled for that code in **Extended Receivables Insurance Code Settings**.
- **Third-party insurance file layouts** — see §10.

### 4.5 Payment agreements
Setup chain, in order (`04-receivables/076-payment-agreements-overview.md`):
1. `Allow Payment Agreements` in **Revolving Receivables Control Settings** — off by default.
2. Each remitting organisation (payroll, SSA, VA, insurer) defined in **Receivable Payment Source Settings**: payments per month (**1, 2, or 4**), the Miscellaneous Payment type used to post, and delivery/processing mode (**on demand, at End of Day, or both**).
3. That Miscellaneous Payment type must have `Use For Payment Agreement Import` checked in **Miscellaneous Payment Settings**.
4. Only revolving plans flagged to allow payment agreements in **Revolving Payment Plan Settings** may be linked.
- Per-customer linkage is entered on `04-receivables/075-payment-agreement-entry.md`: `Source` (lookup) and `ID` (free text, **15 chars**, e.g. the employee number). `# Payments Per Month` is display-only, pulled from Payment Agreement Source Settings. Entry mode allows editing source and ID even on existing plans; access from a revolving **view** routine renders both read-only.
- Payment-agreement data is included in the **revolving statement XML**, and Source / ID / Payments per Month are available as enhanced-laser data elements.

### 4.6 Revolving prepayment and general info
- `04-receivables/110-revolving-prepayment.md` — see §2.3.
- Revolving plan **general information** screens (View a Customer's Current Revolving Activity, Revolving Worksheet (Full), Enter a Customer's Revolving Terms & Conditions) are referenced from `075`/`076` but their own articles sit outside this range.

---

## 5. Views and inquiry screens — what each exposes

| Screen | File | Exposes |
|---|---|---|
| Late Fee Forgiven | `04-receivables/062-late-fee-forgiven.md` | Date, $ Amount per forgiven late fee on one contract. Nothing else — no user, no reason code. |
| View Contract Postings | `04-receivables/119-view-contract-postings.md` | Date, **Allocation** (where the money was applied), Adjustment amount, plus grand total. |
| View Deferred Payments | `04-receivables/120-view-deferred-payments.md` | Header: total Deferred Payments, total Deferment Fee. Grid: Deferred Date, $ Deferment Fee, Reference, **Due Date (original)**, Memo Reference (pre-deferment payment-due reference). |
| View Historical Contract Rebates | `04-receivables/122-view-historical-contract-rebates.md` | Type of Charge, $ Original, $ Rebate + totals. **Closed contracts only.** |
| View a Customer's Payment Activity | `04-receivables/118-view-a-customers-payment-activity.md` | Date, Paid With (payment type), $ Amount — **includes deposits and refunds of deposits/payments**, ascending date, sortable. Also the documented way to see the **refund method used for a revolving credit refund**. |
| View Details of Payment Activity | `04-receivables/121-view-details-of-payment-activity.md` | Total amount, how it was applied, payment type; **check number** for checks, **last four digits** for cards. Actions: Output Settings, Print Comments, Reprint Receipt (balances replaced with 'Reprint'; blocked for misapplied/NSF payments). |
| Payment Information | `04-receivables/078-payment-information.md` | Payment type, date, amount applied to the original order; **credits positive, debits negative**, Amount column totalled. For on-account payments and manual credit memos the **AR memo reference** appears in the Payment Type Code column ('...' when multiple). |
| Manage and Adjust Installment Contracts (header) | `04-receivables/067-manage-and-adjust-installment-contracts.md` | Credit Limit $ (or **OPEN** if none), Open Receivables $, Potential Receivables $, Available Credit $ (= credit limit − total potential receivables), Installment (pending) $, Revolving (pending) $, Unpaid Open Orders $. Plus phones, email, store. |
| Manage and Adjust — contract grid | same | Contract, Status, Order, Classification (classification code + payment plan), Cash Date, Financed $, Payoff $, Next Payment Due, Amount Due $, Past Due $, Due Day, Written From, Refinanced To. |
| Review Contract Details | `04-receivables/104-review-contract-details.md` | Terms block (Months, Months No Interest, APR + APR Values window, Elapsed Months, Months Extended, Months No Payments, First Due → amortization schedule, Payments of, second Payments of for fixed-monthly-payment plans, Final Payment is, Payments Remain, Insurance). Amount block with **Original Amt vs Adjusted Amt** columns for Principal, Refinanced Payoff, Miscellaneous, Interest, Total Contract, plus Remaining Balance. Activity block: Postings(n), Current Due, Past Due (ellipsis if multiple → Open Item Receivables Inquiry), Late Fee (ellipsis if multiple), Deferred(n), Late Fee Forgiven(n), Total Due, Next Due, Payoff Valid, Same as Cash. Banner `Excluded from Auto Pay!` when `Exclude Contract from Auto Pay` is set on Adjust Payment Terms. |
| Release Orders from Credit Hold | `04-receivables/097-release-orders-from-credit-hold.md` | Count of orders on hold (scoped to the user's location/security), Last Refreshed timestamp, grid: Order, Date, Customer Code, Customer Name, Credit Hold Code, Code Hold Description, Hold Date. **One row per hold code** for multi-hold orders. |
| Update Receivables Credit Approvals | `04-receivables/115-update-receivables-credit-approvals.md` | Aging (Current, 1-30, 31-60, 61-90, Over 90), Last Invoice Date, Last Payment Date/Amount, Credit Limit, Available, Merchandise Subtotal, Sales Tax, Delivery/Install Charge, Order Subtotal, Deposit, Total Amount Financed, Balance Due. |
| Review Pending Credit Requests / on Hold | `04-receivables/106-*`, `04-receivables/105-*` | Header stats: Total Pending Review Requests, Total Hold Review Requests, **Average Initial Response Time, Average Decision Time**. Grid: Customer, Name, Store, Date, Time, Reviewer initials (**'AUTO' when using InterConnect**), Status, Salesperson. Grid is exportable to Excel via right-click → Export Grid Data. |
| Maintain Order Credits | `04-receivables/066-maintain-order-credits.md` | Reference (original order), Refund action, View Order action, Return (or 'Multiple'), Location, Customer, Customer Name, Credit Amount, **Last Activity Date** (last completed order or open-item payment — *excludes* new open orders and deposit application), Payment Type (or 'Multiple'), View Payment, Billing Address 1/2, City, State, Zip. |
| Maintain Customer Deposits | `04-receivables/065-maintain-customer-deposits.md` | Total Liability, running Applied / Refund / On-Account / FR Credit totals, per-order deposits, Payment Type (last 4 of card, or 'Multiple Deposits'), Available. |

---

## 6. Money movement and GL touchpoints

### 6.1 Screens in this range that explicitly state GL behaviour
| Screen | GL statement |
|---|---|
| Reassign a Customer's Store Location (`04-receivables/095-*`) | Five explicit postings — see 6.2. |
| Maintain Customer Balances → Bad Debt (`04-receivables/064-*`) | "The charged-off balance is removed…, the appropriate G/L posts are completed" on Save. Sales-tax adjustment transactions are created and posted **to the General Ledger (see General Ledger Assigned Account Settings) before the actual charge-off**, and are included on **Report Sales Tax**. |
| Maintain Customer Balances → Manual Adjustments (`04-receivables/064-*`) | `Maintain GL Postings` is a grid action per adjustment line. |
| Update MMP (`04-receivables/114-*`) | `G/L Maintenance` action to view/modify auto-generated postings; on **Save** the **GL Distribution Screen** displays for review/adjustment (subject to GL User Permissions and Create a User/Group Actions – Payables Security). |
| Update Contract Status (`04-receivables/112-*`) | Actions → `G/L Account Maintenance` → G/L Distribution screen for installment contract accounts. |
| Plan Deferment (`04-receivables/083-*`) | "The general ledger is updated with **one batch for each session run**, which includes all payments deferred in that session." |
| Revolving Credit Write-Off (`04-receivables/107-*`) | Target account = `Revolving Credit Write-Offs`, Revolving page of **General Ledger Assigned Account Settings**. |
| Manual Adjustments in Vendor Receivables (`04-receivables/070-*`) | `Convert to Payable` converts the receivable to a debit that reduces the vendor payable; Memo auto-fills `RSVD/VCHR#` when converted, `Adjustment` when not. GL screen itself is `04-receivables/051-*`, outside range. |

### 6.2 Store-reassignment postings, verbatim structure (`04-receivables/095-reassign-a-customers-store-location.md`)
1. Deposit Liability: **Dr** old store / **Cr** new store.
2. Accounts Receivable: **Dr** new store / **Cr** old store (long-term balance of active revolving plans).
3. Long Term Revolving: **Dr** new store / **Cr** old store.
4. Unearned Interest: **Dr** new store / **Cr** old store — payment types determined **from the memo reference for the MMP**.
5. Unearned Insurance: **Dr** new store / **Cr** old store — insurance code determined **from the memo reference for the insurance portion of the MMP**.
> The article lists items 2 and 3 as separate postings using near-identical wording ("The following General Ledger posting transfers the long term balance for all of the customer's active Revolving plans…" twice, once against AR and once against Long Term Revolving). Whether these are two legs of one entry or two distinct entries is **not stated in article** — verify against a live posting before relying on it for reconciliation mapping.
> Also stated: interest and insurance post to **'Unearned'** accounts when the revolving plans **cycle**, and are **earned when a revolving MMP is paid**.
> Also: the Store Location field in Customer Settings updates, a comment posts to the Customer Activity Log, and collections assignment is re-evaluated.

### 6.3 Balance-classification rules (short term vs long term)
- Deferment (revolving): short term → long term, carrying principal + interest + insurance + finance fees (`04-receivables/083-*`).
- Update MMP: positive adjustment = long term ↓ / short term ↑; negative = long term ↑ / short term ↓ (`04-receivables/114-*`).
- Keyoff to `Long Term Revolving` / `Long Term Installment` moves an open item into the long-term balance; charge-off zeroes **both** long and short term and deletes open items; a reinstated revolving plan carries a **long term balance only** until it cycles (all `04-receivables/064-*`).
- Store reassignment screen: "The Installment Receivables balance that is displayed is the long-term balance. **Any short term balances are included in the Open Item balance**" (`04-receivables/095-*`) — the single clearest statement of the AR bucket model in this range.
- Charged-back waived interest becomes part of the new plan's **long term balance** and is **excluded from the YTD interest bucket** (`04-receivables/082-*`).

### 6.4 Deposit liability
- Posting a deposit creates a **deposit liability** (`04-receivables/065-*`). Movement options: apply to another order, on-account, refund, or credit to third-party Finance Receivables (`F`).
- **FR (financed) deposits**: crediting to Finance Receivables is the **only** option; they cannot be moved order-to-order. To reuse them you must credit, then re-apply via Enter a Customer Payment/Refund/Gift Certificate.
- **Revolving deposits**: cannot be transferred order-to-order, cannot go to On Account, are auto-removed when the order is deleted, and can only be refunded from an open order if the **Revolving** box is checked at `Immediate Deposit Refund Types`.
- Service-order deposits can move to on-account only if `Service to Sales Deposit` is checked on the **Deposits tab** of AR Control Settings.
- Pre-authorised payments (per `Allow Pre-Authorizationed Deposits` in **Payment Card and Device Settings**) are neither displayed nor maintainable here.

### 6.5 Distribution / allocation rules stated
- `View Contract Postings` exposes an **Allocation** column ("where the money for a particular posting was applied") but the waterfall itself is **not stated in article** (`04-receivables/119-*`). Payment-agreement MMP split = monthly MMP ÷ payments-per-month with principal/interest/insurance broken out per scheduled payment (`04-receivables/076-*`). LET item selection order (retail value, last piece backwards, `04-receivables/102-*`) is a *legal entitlement* allocation, not a cash allocation. **No article in this range states the cash-application hierarchy — gap.**

---

## 7. Control settings referenced (by settings screen)

| Settings screen | Named fields / flags and what they control (article index in backticks) |
|---|---|
| **Accounts Receivable(s) Control Settings** | `Next Deposit Number` (auto reference generation, `064`); Automatic Charge-Off process (`064`); sales tax adjustment feature (`064`); `Charge-Off before Non-Accrual` (`064`); `Immediate Deposit Refund Types` incl. the Revolving box (`065`); `Daily Maximum Cash Refund Per Customer` (`065`); `Service to Sales Deposit` on the Deposits tab (`065`); date-closed-for-payments via Actions (`065`); `Allow Duplicate Social Security Numbers` (`101`); credit-hold grid refresh rate (`097`); three Metro-2 account exclusion fields — paid-out cycles, credit-balance cycles, zero-cycle-balance/account-age (`099`). |
| **Account Statement Cycling Control Settings** | `Generate Zero Balance Statements` (`085`); `Statement History Retention` (`086`,`087`,`089`); `Statement Form` = Forms / Laser / Forms Designer (`086`,`087`,`089`); `Hold Credit Balance Statements` (`086`,`087`,`089`); `Corporate Access Log-on` (`088`); NFS export path (`086`,`087`,`089`); Advanced tab: `Create XML for Open Item Statements and Export To` (`086`), `Create XML for Installment Statements and Export To` (`087`), `Create XML for Revolving Statements and Export To` (`089`). |
| **Customer Settings / Advanced Customer Settings** | `Hold Statement` (`086`); `Hold Customer's Statement` = Yes or blank (`087`,`089`); `Do Not Solicit`, auto-enabled by NA status (`064`); `Store Location` / Store Assignment (`095`); LET expiration date stored on the Customer record (`102`); Legal Settings → `Do Not Report to Credit Bureau` (`099`); email address required for status-letter emailing (`092`). |
| **Point of Sale Control Settings** | `Maintain Customer Deposits Refund Receipts` (`065`); `Initial Check` / `Final Check` drive AR credit holds (`115`); `Customer Entry - Warn if Primary Email exists for other Customers` (`101`); `First Marketing Code` / `Second Marketing Code` optional-or-mandatory (`101`). |
| **Payment Card and Device Settings** | `Allow Pre-Authorizationed Deposits` (`065`). |
| **Check Payment Settings** | `Drivers License Prompt` (mandatory/optional DL capture) (`079`). |
| **Revolving Receivables Control Settings** | `Allow Payment Agreements` (`076`); `Apply Insurance by Plan` = Customer/Plan (`093`); `Exempt from Insurance Charges` (`093`); `Default Insurance from Other Plans` (`116`); Revolving Payment Estimator Defaults + `Allow Changes` per option (`108`). |
| **Revolving Payment Plan Settings** | `Allow Other Plans to Transfer to this Plan` (Advanced tab) (`082`); allow-payment-agreements flag (`076`); Restrictions tab rules (`109`,`106`); promotional interest rate and expiration date (`108`); plan terms feeding the estimator (`108`). |
| **Receivable Payment Source Settings / Payment Agreement Source Settings** | payments per month (1/2/4), Miscellaneous Payment type, file delivery mode (`076`); `# Payments Per Month` displayed on the entry screen (`075`). |
| **Miscellaneous Payment Settings** | `Use For Payment Agreement Import` (`076`). |
| **Installment Payment Plan Settings** | `Fixed Monthly Payment Amount` / `Fixed Monthly Payment Term` (drive the second "Payments of" field) (`104`); `Revoke Same as Cash After ___ Late Fees` (`104`). |
| **Sales Tax Settings** | `Amount Threshold` and `Inactivity Days` filtering the revolving credit write-off export (`107`); Revolving tab finance-charge-fee-by-state (`114`). |
| **General Ledger Assigned Account Settings** | `Revolving Credit Write-Offs` on the Revolving page (`107`); sales-tax-adjustment accounts for charge-off (`064`). |
| **Collections Processing Control Settings** | `District` field enabled (+ Regional Processing) (`091`); `Location` field enabled (`091`); `Collections Letter` = Export Letter vs Enhanced Laser (`091`). |
| **Collector Settings** | `Allow Manual Assignment` (`096`). |
| **Credit Application Control Settings** | `Primary Credit Bureau` on the General tab (`101`); application "current"/age-in-days threshold blocking a new application and forcing Update Credit Application (`101`,`103`). |
| **Warehouse/Store Location Settings** | `Preferred Credit Bureau` on the Credit Application tab (`101`); Revolving Payment Estimator Defaults (`108`). |
| **Notification Control Settings** | must permit emailing of credit status letters (`092`). |
| **Maintain Credit Application Letter Print UNC Path** | `Create XML for Credit Decision Letters` (`092`). |
| **Extended Receivables Insurance Code Settings** | valid insurance codes for import (`116`); `Request Signature` per code (`093`). |
| **Revolving Receivables Insurance Code Settings** | customer age cutoff (`093`). |
| **Account Status Settings** | `Manual Assignment` flag controls which Metro-2 account statuses are repairable (`098`). |
| **Legal Code Settings** | displays the CII in the grid for legal codes that carry one (`098`). |
| **Reason Code Settings** | `Account Status` field documents installment reason codes (`112`); Reason Usage Code = `Revolving Adjustments` (`114`); Reason Usage Code = `Revolving Disputes` (`113`). |
| **General System Control Settings** | `Advanced Receivables` (when active, the credit limit field on Update Receivables Credit Approvals becomes read-only) (`115`); `Clear Data/Field Indicator` used as the insurance-code clear designator (`116`). |
| **Cash Balancing Control Settings** | if balancing by cash drawer, the payment button on Manage and Adjust Installment Contracts is inactive unless logged in with a drawer (`067`). |
| *(other, single-mention)* | **Marketing Code Settings** (`101`), **Group settings → `Legally Entitled to Repossess`** (`102`), **Maintain NFS Root Paths** (`102`), **Configure Document Signature Capture / Configure Document Archive** (`093`,`101`), **Metro 2 Code Settings** (accessible from Review Contract Details, `104`). |
| **Security (Extended Security (Receivables) / Create a User/Group Actions – Receivables Security)** | `Maintain Customer Balances; Manually Adjust an Account Balance`, `Maintain Customer Balances - Refund`, `Maintain Customer Balances; Key Off a Credit/Debit Balance`, `Maintain Customer Balances; Charge off an Account Balance` (`064`); the "Maintain Customer Deposits" permission group (`065`); `Override Daily Maximum Cash Refund Per Customer` (`065`); `Repossession - Access Waived (LET) Items` (`074`,`102`,`123`); `Repossession; Override Legal Setting for Allowing Repossessions` (`102`); `Installment - Manage and Adjust - Enter a Sales Order / Take a Payment / Request Credit Information / Credit Request Review` (`067`); `Review Pending Credit Request – Manually approved linked sales order` (`106`); `Access Other Credit Applications and Score Reporting` (`103`); `Access credit applications - Request Credit Information` (`101`); hold-code restriction of the credit-hold grid (`097`); General Ledger User Permissions + Payables Security for GL maintenance (`114`). |

**Regional Processing** is called out as restricting customer/location visibility on `064`, `065`, `094`, `102`, `115`, and as a precondition for the District filter on `091`.

---

## 8. Menu paths (`Access` line per article)

| File | Access path(s) as stated |
|---|---|
| `062-late-fee-forgiven.md` | Installment Receivables > Manage and Adjust Installment Contracts > Review Contract Details button > Search button by Late Fee Forgiven field |
| `063-life-of-the-south-lots-insurance-file-layouts.md` | *No Access section — reference document* |
| `064-maintain-customer-balances.md` | Accounting > Receivables > Receivables Adjustments and Refunds > Maintain Customer Balances |
| `065-maintain-customer-deposits.md` | Accounting > Receivables > Receivables Adjustments and Refunds > Maintain Customer Deposits · Accounting > Receivables > Point of Sale > Returns and Refunds > … · Customer > Point of Sale > Returns and Refunds > … · Customer > Customer Service > Returns and Refunds > … |
| `066-maintain-order-credits.md` | Customer > Point of Sale > Returns and Refund |
| `067-manage-and-adjust-installment-contracts.md` | Accounting > Installment > Manage and Adjust Installment Contracts (also from View All Installment Activity for a Customer) |
| `068-manage-statement-message-criteria-assignment.md` | Indicate Message to Print on Customer Statements > (blank Message Code) > Manage Criteria Assignment button |
| `069-manage-statement-messages.md` | Indicate Message to Print on Customer Statements > enter Message Code > Manage Message Assignment button |
| `070-manual-adjustments-in-vendor-receivables.md` | *No Access section* — Apply Payments and Maintain Vendor Receivables Balances > Manual Adjustments tab > select open item |
| `071-metro-2-customer-credit-recovery.md` | Accounting > Revolving Receivables > Metro 2 Features > Metro 2 Recovery · Accounting > Installment > Metro 2 Features > Metro 2 Recovery |
| `072-misapplied-nsf-payment-results-screen.md` | Apply NSF and Correct Misapplied Payments > select a payment from the grid > Add |
| `073-mmp-selection-sales-order-table.md` | Revolving Payment Estimator > Sales Order Table button |
| `074-original-document-select-repossessions.md` | *Access header present but no menu path* — second step of the Repossession process (from Process Repossessed Items > Save) |
| `075-payment-agreement-entry.md` | Enter a Customer's Revolving Terms & Conditions > Actions > Payment Agreement · View All Receivable Activity for a Customer > Payment Agreement button (General Info tab) · View a Customer's Revolving Statement > Payment Agreement button · Revolving Worksheet (Full) > Actions > Payment Agreement |
| `076-payment-agreements-overview.md` | *No Access section — concept article* |
| `077-payment-history-profile.md` | Accounting > Receivables > Credit Application > Customer Credit and Scoring Information > Payment History Profile |
| `078-payment-information.md` | Maintain Order Credits > Payment Type in grid |
| `079-payment-types.md` | *No Access section* — Payment Summary window, Payment Method field |
| `080-place-deposit-on-order-screen.md` | *No Access section* — Actions menu in Enter a Customer Payment |
| `081-place-money-on-account-screen.md` | *No Access section* — Actions menu in Enter a Customer Payment **or** Maintain Customer Balances |
| `082-plan-balance-transfer.md` | Adjust Revolving Plans > Plan Balance Transfer button |
| `083-plan-deferment.md` | Adjust Revolving Plans > Plan Deferment |
| `084-premier-insurance-file-layout.md` | *No Access section — reference document* |
| `085-print-a-customer-as-of-statement.md` | Accounting > Receivables > Print Receivables Document > Print a Customer As Of Statement |
| `086-print-a-customer-statement.md` | Accounting > Receivables > Print Receivables Document > Print a Customer Statement |
| `087-print-a-customers-installment-statement.md` | Accounting > Installment > Installment Statements > Print a Customer's Installment Statement |
| `088-print-a-customers-layaway-statement.md` | Accounting > Receivables > Print Receivables Document > Print a Customer's Layaway Statement |
| `089-print-a-customers-revolving-statement.md` | Accounting > Revolving Receivables > Revolving Reports > Print a Customer's Revolving Statement |
| `090-print-an-installment-contract.md` | Accounting > Installment > Print an Installment Contract |
| `091-print-collections-letters.md` | Accounting > Collections > Print Documents > Print Collections Letters |
| `092-print-credit-request-status-letters.md` | Customer > Electronic Interfaces > Credit Application > Print Credit Status Letters · Accounting > Receivables > Credit Application > Print Credit Status Letters |
| `093-print-insurance-forms.md` | Accounting > Revolving Receivables > Revolving Views and Reports > Revolving Reports > Print Insurance Forms |
| `094-process-repossessed-items.md` | Accounting > Receivables > Receivables Adjustments and Refunds > Process Repossessed Items |
| `095-reassign-a-customers-store-location.md` | Accounting > Receivables > Reassign a Customer's Store Location · Accounting > Revolving Receivables > Reassign a Customer's Store Location |
| `096-reassign-collector-screen.md` | Reassign button on the Collector Review – Customer Update Screen |
| `097-release-orders-from-credit-hold.md` | Accounting > Receivables > Release Order from Credit Hold |
| `098-repair-metro-2-customer-credit-history.md` | Accounting > Revolving Receivables > Metro 2 Features > Repair Metro 2 Customer Credit History |
| `099-report-metro-2-customer-credit-history.md` | Accounting > Revolving Receivables > Metro 2 Features > Report Metro 2 Customer Credit History |
| `100-reportoutput.md` | *No Access section — shared UI fragment* |
| `101-request-credit-information.md` | Customer > Coordination and Logistics > Credit Application > Request Credit Information · Customer > Electronic Interfaces > Credit Application > … · Accounting > Receivables > Credit Application > … |
| `102-request-legally-entitled-to-let-documents.md` | Accounting > Receivables > Print Receivables Document > Request Legally Entitled To (LET) Documents |
| `103-request-new-credit-report.md` | Credit Request Review Screen > Request a New Credit Report button (pending) · Credit Request Review Screen > Submit a New Credit Request button (closed) |
| `104-review-contract-details.md` | Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Review Contract Details button |
| `105-review-credit-requests-on-hold.md` | Customer > Coordination and Logistics > Credit Application > Review Credit Requests on Hold · Customer > Electronic Interfaces > … · Accounting > Receivables > Credit Application > … |
| `106-review-pending-credit-requests.md` | Customer > Coordination and Logistics > Credit Application > Review Pending Credit Requests · Customer > Electronic Interfaces > … · Accounting > Receivables > Credit Application > … |
| `107-revolving-credit-write-off-export-and-import.md` | Receivables > Revolving Receivables *(article gives no leaf item)* |
| `108-revolving-payment-estimator.md` | Accounting > Revolving Receivables > Revolving Payment Estimator · Enter a Sales Order > Payment page > Actions · Enter a Shopping Cart > Actions · View All Installment Activity for a Customer > Payment Estimator button |
| `109-revolving-plan-restriction-results.md` | Enter a Sales Order > Payment tab > entering an ineligible revolving plan at the Financing field |
| `110-revolving-prepayment.md` | Enter a Customer Payment > Actions menu > Pre-Payment/Revolving Prepayment |
| `111-take-multiple-deposits.md` | *No Access section* — from Maintain Customer Deposits (multi-deposit order, Actions field) or the Action button at Amount to Take |
| `112-update-contract-status.md` | Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Update Contract Status button · … > Review Contract Details > Update Contract Status button |
| `113-update-disputes.md` | Adjust Revolving Plans > Update Disputes |
| `114-update-mmp.md` | Adjust Revolving Plans > Update MMP global action button |
| `115-update-receivables-credit-approvals.md` | Accounting > Revolving Receivables > Update Receivables Credit Approvals · Accounting > Receivables > … · Accounting > Installment > … |
| `116-update-revolving-insurance-plans.md` | Receivables > Revolving Receivables > Update Revolving Insurance Plans |
| `117-vendor-receivables-payment-on-account-adjustments-screen.md` | *No Access section* — select a payment line in Apply Payments and Maintain Vendor Receivables Balances |
| `118-view-a-customers-payment-activity.md` | Installment Receivables > Manage and Adjust Installment Contracts > Merge/Refinance Contracts > Actions > View A Customer's Payment Activity · … > Review Contract Details > Actions > … · Accounting > Receivables > Receivables Views and Reports > Receivables Views > … · Accounting > Revolving Receivables > … |
| `119-view-contract-postings.md` | Installment Receivables > Manage and Adjust Installment Contracts > Review Contract Details button > Search button by Postings field |
| `120-view-deferred-payments.md` | Installment Receivables > Manage and Adjust Installment Contracts > Review Contract Details button > Search button by Deferred field |
| `121-view-details-of-payment-activity.md` | View a Customer's Payment Activity > double-click a grid line |
| `122-view-historical-contract-rebates.md` | Installment Receivables > Manage and Adjust Installment Contracts > Review Contract Details > Actions > View Historical Contract Rebates |
| `123-waived-item-select.md` | Actions button on the Original Document Select (Repossessions) screen |

> Note the menu-root inconsistency across articles: `Accounting > Receivables`, `Accounting > Revolving Receivables`, `Accounting > Installment`, `Receivables > Installment Receivables`, `Receivables > Revolving Receivables` and `Accounting > Collections` all appear. The corpus does not state whether these are alternate labels for the same nodes or genuinely different menus.

---

## 9. Cutover implications for LA Mattress

Everything marked **INFERRED** is my reasoning from the articles, not a statement in them.

### 9.1 Delinquency status carry-over
- STORIS's delinquency state is spread across at least six independent stores: the **customer Alert Code** (`CO`/`NA`/none, `064`), **collector assignment** (`096`), the **Metro-2 24-month Payment History Profile** (`077`,`098`), **Date of First Delinquency** (`099`), **legal codes** (`098`,`102`,`107`), and **dispute flags** at open-item and revolving-plan level (`064`,`113`). Each must be mapped separately from the legacy ERP.
- **Hard ordering constraint at load time**: you cannot set Alert Code `CO` on a customer who has an active revolving plan or active installment contract — the plan/contract must be cancelled first (`064`). **INFERRED:** charged-off legacy accounts must therefore be loaded either (a) as balance-only shells with no active plan, or (b) loaded active, then cancelled, then charged off — and option (b) will fire real GL postings, so it needs a clearing-account strategy.
- **INFERRED:** if `Charge-Off before Non-Accrual` is enabled, conversion must set `NA` before `CO` for every charged-off account, doubling the number of status transitions to script.
- `NA` auto-sets `Do Not Solicit` on the customer (`064`). **INFERRED:** conversion of non-accrual accounts silently changes marketing eligibility; confirm with marketing before load.
- Alert code changes appear to be Save-time transactional events with GL consequences, not attribute writes (`064`). **INFERRED:** a bulk import that simply writes an alert-code column would bypass the GL and the open-item removal; there is no documented bulk charge-off import in this range.

### 9.2 Aging buckets
- The bucket definitions differ by screen (see §3.2). **INFERRED:** pick one canonical mapping for conversion (the collections-letter set is the richest, with both age buckets and component buckets) and accept that the deferment screen's 91-120 / 120+ split will not tie to the credit-approval screen's single "Over 90".
- Aging in STORIS is derived from open-item **Due Date**, which is itself derived from the **Terms** code (`064` — entering a terms code recalculates Due Date and discount dates). **INFERRED:** you must convert terms codes, not just due dates, or re-aging after any Maintain action will produce different buckets than the legacy system.
- Past-due **component** split (principal / interest / late fees / finance fees / insurance) is a first-class concept in collections letters (`091`) and in MMP adjustment (`114`). **INFERRED:** legacy balances that are stored as a single past-due number will need to be decomposed, or collections letters will print zeros in most component fields.

### 9.3 Late fee accrual
- Late fees accrue as **components of a revolving payment due** (adjustable per-payment, `114`) and as a **contract-level Late Fee bucket** on installment (`104`). They are suspended by `NA` (`064`) and by dispute (`113`).
- **INFERRED:** open late fees must be converted as line-level components of the MMP/payment-due records, not as separate charges, or `Update MMP` will refuse adjustments (the adjustment cannot exceed the balance due for the transaction) and Forgive Late Fees will have nothing to act on.
- **Forgiven** late fee history is a distinct log with only date and amount (`062`). **INFERRED:** legacy forgiveness history probably cannot be loaded at all (no documented import); plan to retain it in the legacy archive.
- `Revoke Same as Cash After ___ Late Fees` (`104`) counts late fees. **INFERRED:** if the late-fee *count* is not converted, promotional revocation thresholds restart at zero and customers who should have lost their same-as-cash promo will keep it.

### 9.4 Bad debt history and recovery
- Charge-off is destructive by design: it zeroes both balances and **removes existing open items** (`064`). Post-cutover, the *detail* of what was charged off survives only as the "charged-off balance" figure and, for revolving, as the reinstatement basis (charged-off amount net of subsequent payments and repossessions).
- **INFERRED:** if LA Mattress needs charged-off invoice-level detail for recovery or legal work, it must be preserved outside STORIS — the target schema does not retain open items after charge-off.
- Reinstatement rebuilds revolving plans **long-term-only with no MMPs until the next cycle** (`064`). **INFERRED:** any legacy "on a payment plan after charge-off" account will lose its schedule on reinstatement and needs manual MMP posting via Adjust Revolving Plans.
- Sales-tax adjustment on charge-off is optional and posts to GL **before** the charge-off, and reinstatement may require **manual** GL corrections to sales tax (`064`). **INFERRED:** decide the sales-tax-adjustment flag *before* converting charged-off accounts; flipping it later creates asymmetric history.
- Revolving **credit** write-off is a separate, spreadsheet-mediated process with its own GL account (`107`) and refuses plans with a current due amount, legal codes, charge-off/non-accrual status, or no statement history. **INFERRED:** converted plans will have **no statement history** on day one, so they are ineligible for credit write-off until at least one cycle has run — schedule any legacy credit-balance cleanup either before cutover or after the first cycle.

### 9.5 Statement continuity
- Statements are produced by the **End-of-Day Cycle Process**, not on demand (`086`,`087`,`089`). The first STORIS statement a customer receives will cover the first STORIS cycle only.
- **INFERRED:** there is no documented way to load historical statements into the Statement History File; reprints of pre-cutover statements will have to come from the legacy system. `Statement History Retention` plus the End-of-Month purge means STORIS history is short-lived anyway.
- Store reassignment can create a **>30-day extended cycle** (`095`). **INFERRED:** if conversion assigns customers to STORIS store codes that differ from their legacy due-day grouping, a wave of customers will get one long first cycle — with correspondingly larger first MMPs/interest. Model this before choosing store mapping.
- Zero-balance statement suppression is global (`Generate Zero Balance Statements`) but overridden for single-customer as-of prints (`085`). **INFERRED:** useful as the manual fallback for cutover-period statement queries.
- Statement **messages** are assigned by Plan/State/Store criteria (`068`,`069`). **INFERRED:** these are configuration, not data — they must be authored fresh; no legacy equivalent will migrate.
- The revolving statement XML carries payment-agreement Source/ID/Payments-per-month (`076`). **INFERRED:** if LA Mattress has any payroll-deduction or SSA/VA arrangements, those must be configured (four settings screens deep) before the first revolving cycle or the statements will be wrong.

### 9.6 Other cutover risks worth flagging
- **`MP` reference prefix** is forced on every manual adjustment (`064`). Legacy reference numbers cannot be preserved verbatim on converted manual adjustments. **INFERRED.**
- **Deposit liability** conversion is constrained: FR deposits can only be credited to Finance Receivables, revolving deposits cannot go to on-account or move between orders (`065`). **INFERRED:** deposits attached to legacy orders that do not convert must be landed on-account, and that path is closed for revolving/FR deposits.
- **LET / repossession** is entirely dependent on STORIS-tracked revolving purchase history since last zero balance date (`102`). **INFERRED:** for converted customers there is no purchase history, so LET documents will be empty or unproducible until post-cutover purchases accumulate. Any in-flight repossessions must complete in the legacy system.
- **Metro 2** reporting starts from "the day after you last ran a credit reporting" (`099`,`071`) — read-only, system-derived. **INFERRED:** the first STORIS bureau run needs an intentional Last Credit Reporting Date, and the 24-month Payment History Profile should be pre-loaded (it is manually editable per `077`, but one customer at a time — no bulk import documented). This is a likely large manual effort or a custom load.
- **Credit holds**: hold codes referenced in this range are `C1` (over credit limit), `C5` (pre-authorized deposit — not approvable in the standard screen), `C6` (revolving pending credit decision — redirects to Review Pending Credit Requests and cannot be maintained in Update Receivables Credit Approvals), `F3` (unapproved financing — must use Update Financing Credit Approvals), `S1` (**cannot be manually released**; obtain the signature or delete the order) (`097`,`115`,`106`). **INFERRED:** any converted open orders must be checked against these codes; S1 in particular can strand an order.
- **`Advanced Receivables`** (General System Control Settings) changes where credit limits are maintained (`115`). **INFERRED:** decide this flag before conversion — it determines whether the credit-limit field on the approval screen is writable, and therefore which screen the conversion and the day-2 process use.

---

## 10. Third-party insurance file layouts (reference only)

**Life Of The South (LOTS)** — `04-receivables/063-life-of-the-south-lots-insurance-file-layouts.md`. Fixed-width, named COBOL-style fields.
- *Insurance Enrollment* (`EN…`): `ENTRAN`=Transaction Type '01' (2), `ENCUST`=Customer ID (16, left-justified space-filled), `ENINSURER`='AF' (2), `ENPRODUCER`=Store ID (8), `ENSTATE`=state of the store the customer is assigned to (2), `ENEFDT`=plan open date MMDDYY (6), primary name/DOB/sex (`ENPRMLNAM` 15, `ENPRMFNAM` 10, `ENPRMINIT` 1, `ENPRMDOB` 6, `ENPRMSEX` 1 = "M"/"F"/null), co-applicant equivalents (`ENSEC…`), address (`ENADDR1`/`ENADDR2` 40 each, `ENCITY` 38, `ENBSTATE` 2, `ENZIP` 5, `ENZIP4` 4), plus numerous filler blocks (`ENFILL1`–`ENFILL9`, `ENRESPTYPE`, `ENPOLICYFRM`, `ENCOVPLAN`, `ENDEBTTYPE`, `ENRCVDT`).
- *Premium Enrollment* (`EM…`): `EMTRAN` '01', `EMPRODUCER` Store ID, `EMLOANACT`= **number of active revolving plans assessed insurance during the cycle period** (6), `EMMNTHDT`= **the first day of the calendar month containing the cycle date** — explicitly *not* the start of the cycle (6), `EMAVEBAL`=`9(7)V99` sum of average daily balance for all accounts with the insurance code(s) for the period, `EMPREM`=`9(5)V99` sum of premiums assessed, `EMPOLCYFRM`/`EMFILLER`/`EMRCVDT` fillers.

**Premier** — `04-receivables/084-premier-insurance-file-layout.md`. Column-lettered (spreadsheet-style), no lengths or types given.
- *Insurance Enrollment* — "notifies the insurance provider when insurance has been added or removed from a revolving account". Columns A–R: Account Number, Account Status (Active/Cancelled), Status Date, first/last name, DOB, Address 1/2, City, State, Zip, Phone, Email, DPP Enrollment Date (= activation date), DPP Plan Code (= insurance code), DPP Cancellation (= plan cancellation date), Revolving Plan.
- *Insurance Premium* — "informs the insurance provider that was charged during cycle processing". Columns A–W add: Statement Outstanding Balance (current balance), Statement as of Date, Minimum Payment Due, Minimum Payment Due Date, DPP Plan Fees Charged, Interest Fees, **Late Charges**, Last Payment Date, Revolving Plan.
- **Note**: both Premier layouts skip column **G** in the article's own table (A–F then H). Whether G is a real unused column or a transcription error is **not stated in article**.

---

## 11. Open questions / not documented here

1. **Cash-application waterfall.** No article in 062–123 states the order in which a payment is applied across late fees, insurance, finance fees, interest and principal. `View Contract Postings` shows an "Allocation" column but not the rule (`119`).
2. **Late fee assessment rules.** Nothing in this range states when/how late fees are *charged* (grace days, flat vs %, per-plan vs per-state). Only forgiveness, adjustment and suspension appear. Likely in `04-receivables/006-adjust-revolving-plans.md` / `049-forgive-late-fees.md` or in a control-settings section.
3. **Interest calculation method.** Average daily balance is implied by the LOTS premium file (`063`); the accrual method itself is never stated.
4. **Automatic Charge-Off process.** Referenced as existing in AR Control Settings (`064`) but its criteria, timing and GL behaviour are undocumented in this range.
5. **Automatic collector assignment criteria.** `095` says the system "evaluates the customer for Collections assignment"; the rule is not stated. Probably in `020-collector-list-review.md` / `021-*`.
6. **Which GL accounts** are hit by charge-off, keyoff, refund and deferment — only the store-transfer postings (`095`) and the revolving-credit-write-off account (`107`) are named.
7. **Aging bucket definition.** No article states whether aging is by due date or invoice date, or the day-count convention.
8. **Bulk/conversion imports.** Documented imports in this range are only: revolving insurance codes (`116`) and revolving credit write-offs (`107`). Adjacent imports referenced but outside range: Import Customer Payments (`053`), Import Revolving Plan Balance Transfer (`054`), Import Revolving Plan Deferments (`055`). **No documented import for customers, open items, contracts, plans, balances, aging, statements or payment history.**
9. **Payment History Profile bulk load.** Editable one customer at a time (`077`); no import documented.
10. **`Charge-Off before Non-Accrual`, `Advanced Receivables`, `Apply Insurance by Plan`** — the articles state what each flag does but never a recommended setting or the migration consequence of changing it later.
11. **Three transcription/consistency doubts to verify live:** Premier layout skips column G (§10); store-reassignment GL may be two entries or one (§6.2); menu roots are inconsistent across articles (§8 note).
12. **Statement history import.** No mechanism documented for loading pre-cutover statements; End-of-Month purges the history file.
13. **Settlement / negotiated payoff workflow.** Absent from this range entirely; only Promise to Pay merge fields (`091`) hint at it.
14. **`Repossession - Access Waived (LET) Items`** gates both the waived-item screen and the printed LET's purchase-history section (`074`,`102`,`123`) — whether these are one flag or two identically-named ones is not stated.
15. **Revolving credit write-off "Sales Tax Settings" filters.** `Amount Threshold` and `Inactivity Days` are stated to live in Sales Tax Settings (`107`); this is odd enough to be worth verifying against the live system.
