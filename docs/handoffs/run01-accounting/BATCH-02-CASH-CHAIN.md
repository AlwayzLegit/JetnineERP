# Run 01 — Accounting — Batch 2: Cash Chain & Bank Reconciliation

10 articles. Scoped to run-card question 6 — drawer close → daily receipts register →
deposit → bank reconciliation, including card settlement and financing funding.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 11 | Report Daily Receipts Register | /articles/15202676866452 | EXTRACTED |
| 12 | Report Cash Requirements | /articles/15202553293460 | EXTRACTED |
| 13 | Report Cash Balancing Exceptions | /articles/15202553291668 | EXTRACTED |
| 14 | Report Cash Drawer Reconciliation Status | /articles/15202504430484 | EXTRACTED |
| 15 | Reconcile Checks | /articles/15202011443476 | EXTRACTED |
| 16 | Reconcile Bank Transactions Manually *(Manual Clearing Processing)* | /articles/15202028426388 | EXTRACTED |
| 17 | Import Bank Transactions with Automatic Reconciliation | /articles/15202013123220 | EXTRACTED |
| 18 | Import and Match Bank Transactions | /articles/15202013041428 | EXTRACTED |
| 19 | Accounts Payable Check Reconciliation Screen | /articles/15202012414612 | EXTRACTED |
| 20 | Enter a Reconciliation Transaction | /articles/15202013122452 | EXTRACTED |

Newly discovered, queued: `Reconciliation Transaction Type Settings`, `Bank Settings`,
`Cash Balancing Control Settings` *(already dissected — skip)*, `Cash Drawer Reconciliation`,
`Accounts Receivable Control Settings`, `Generate Daily Reports`, `Generate Monthly Reports`,
`Report Reconciliation Transactions`, `Report Cleared Transactions`, `Report Reconciliation Errors`,
`Report Check Transactions`, `Report Check Exceptions`, `Purge Reconciled Transactions`,
`Reconciliation Detail Display - Read Only`, `Review Reconciled Batch - Read Only`,
`GL Account Entry Screen`, `Balance a Cash Drawer` *(dissected)*, `Balance Approval by Manager`.

---

## B. Wiring findings

### FINDING 19 — The Daily Receipts Register is tender-scoped, and three tender classes are excluded
Trigger:    `Generate Daily Reports`, or an on-demand run
Producer:   `DAILY.DETAIL` file
Consumers:  detail report · receivables recap by store · recap by bank · **G/L recap**
Payload:    type of transaction (payment / deposit / on-account), class of transaction
            (cash, charge, guaranteed check / electronic check / manual check), amount
Invariant:  "based on receipts for tender types that affect G/L, cash, checks, and bank cards"
Exclusions: **Revolving deposits and financing do not appear on this report.**
            3rd-party financing receipts **are** included "even though funds have not been 'received'"
Config:     `Daily Receipts Retention Months` in `Accounts Receivable Control Settings`;
            purged by `Generate Monthly Reports`
Evidence:   "3rd party financing receipts are included, even though funds have not been 'received'. Revolving deposits and financing do not appear on this report." — Report Daily Receipts Register, /articles/15202676866452
Maps to:    **W-034 — CONFIRMED for the register leg**, **W-031 — CONTRADICTED**

> `W-031` says every tender lands in exactly one settlement path. STORIS's own daily cash
> control document deliberately omits two of them — in-house revolving and revolving deposits —
> and includes a third (3rd-party financing) at a point when no cash has moved. Any reconciliation
> we build on "the daily register ties to the bank" will be short by exactly those tenders.
> The recap-by-bank section means this report is the intended bank-deposit bridge, and it has holes.

### FINDING 20 — Incremental semantics when run as part of the daily cycle
Trigger:    `Generate Daily Reports`
Invariant:  "the program bases the report information on transactions that occurred since the last daily reports process"
Evidence:   Report Daily Receipts Register, /articles/15202676866452
Maps to:    NEW

> The register is *stateful* — it is a delta since the previous daily run, not a date-range query,
> when run automatically. An on-demand run for the same date is a different query over the same data.
> Two runs are not interchangeable. Worth reproducing deliberately or deliberately not.

### FINDING 21 — Regional Processing filters the register, but not the GL module
Trigger:    Running the register
Invariant:  "you can inquire only about customers and locations to which you have access"
Evidence:   "NOTE: The output of this report may be affected by Regional Processing restrictions." — Report Daily Receipts Register, /articles/15202676866452
Maps to:    **W-052 — partially CONFIRMED**, and note the contrast with Finding 18 in batch 1
            (Regional Processing explicitly does *not* apply to GL Processing)

> Same control plane, opposite answers in two modules. A cash figure on this report and the
> same cash figure in a GL inquiry can legitimately differ by the operator's regional scope.

### FINDING 22 — Unassigned transactions are a real state: cash activity belonging to no drawer
Trigger:    End-of-Day process, only when `Extend Cash Balancing` is checked
Producer:   `Report Cash Balancing Exceptions`
Consumers:  two sections — **Unassigned Transactions** and **Suspense Cash Drawers**
Causes:     transaction fell "outside the time range for which the cash balancing was run",
            **or the cash drawer was never balanced**
Payload:    System Date · Transaction Date · System Time · Store · Drawer · Operator · Reference · Pay Type · Amount
Config:     `Extend Cash Balancing` in `Cash Balancing Control Settings`
Evidence:   "lists any transaction not assigned to a cash drawer, either because it was outside the time range for which the cash balancing was run, or the cash drawer was never balanced." — Report Cash Balancing Exceptions, /articles/15202553291668
Maps to:    **W-034 — CONTRADICTED**

> `W-034` models an unbroken chain drawer → register → deposit → bank rec. STORIS documents a
> legitimate path where money enters the system attached to *no drawer at all*, and the only thing
> that surfaces it is an exception report that runs **only if an optional control setting is on**.
> If `Extend Cash Balancing` is unchecked, unassigned transactions exist and nothing reports them.
> This is the single most dangerous gap found so far.

### FINDING 23 — Blind balancing has a retry limit, and exceeding it creates a suspense drawer
Trigger:    Operator exceeds `Number of Tries` during **Blind Cash Balancing**
Producer:   Cash balancing
Consumers:  suspense file → `Report Cash Balancing Exceptions` → **requires manager approval**
Payload:    Date · Drawer Reference · Start time · End time
Config:     `Number of Tries` and `Group Payments by` (Cashier / Drawer / Store) in `Cash Balancing Control Settings`
Evidence:   "lists all transactions where the operator/cashier exceeded the number set in the Number of Tries field ... and the transactions therefore need to be approved by a manager." — Report Cash Balancing Exceptions, /articles/15202553291668
Maps to:    **W-051 — CONFIRMED** (supervisor override is a real, recorded state here)

### FINDING 24 — Drawer identity is configurable and reshapes the reports
Trigger:    Any drawer-level reporting
Config:     `Balance By` in `Cash Balancing Control Settings` — Operator / Drawer / Store.
            "If the Balance By field ... is set to Drawer or Store (that is, not set to Operator),
            the system replaces the Operator field with either a Drawer or Store field."
            Independently, `Group Payments by` — Cashier / Drawer / Store — drives the
            Drawer Reference column on the exceptions report
Evidence:   Report Cash Drawer Reconciliation Status, /articles/15202504430484
Maps to:    NEW

> Two separate settings both reshape drawer identity. Our model needs one, not two, and it needs
> to be an explicit dimension on the drawer record rather than a reporting-time substitution.

### FINDING 25 — Drawer lifecycle: balanced, reconciled, purged are three distinct states
Trigger:    End of Day, or on demand
Producer:   `Report Cash Drawer Reconciliation Status` — "list all cash drawers that have not been purged"
Consumers:  shows "drawers that have not been balanced or reconciled for the store"
Payload:    reference number · deposit date · operator's name · location · status · receive date ·
            over and short amounts for each drawer
Statuses:   balanced → reconciled → purged (implied by the report's own scoping)
Evidence:   "Use this report to list all cash drawers that have not been purged. It shows the drawers that have not been balanced or reconciled for the store." — Report Cash Drawer Reconciliation Status, /articles/15202504430484
Maps to:    **W-034 — partially CONFIRMED**

> Note `deposit date` and `receive date` on the drawer record. These are the hooks that should
> connect a drawer to a bank deposit — but no article in this batch describes the process that
> *creates* the deposit from the drawer. See section H.

### FINDING 26 — Check status is a three-value machine driven by the reconciliation screen
Trigger:    `Reconcile Checks` → Save → `Accounts Payable Check Reconciliation Screen` → Save
Statuses:   **Printed · Reconciled · Voided**
Invariant:  "the program assigns a status of Reconciled to all selected checks and a status of
            Printed to all unselected checks"
Hazard:     voided checks can be un-checked; "un-checking voided checks has no affect on updates";
            a warning appears that voided checks have been unchecked
Evidence:   Accounts Payable Check Reconciliation Screen, /articles/15202012414612
Maps to:    NEW

> The second Save is destructive in a non-obvious way: any previously-reconciled check left
> unselected is silently demoted back to Printed. There is no separate "un-reconcile" action —
> it is a side effect of the save. We should make un-reconciliation an explicit, audited action.

### FINDING 27 — Bank reconciliation has two distinct engines selected per bank
Trigger:    Bank reconciliation session
Producer:   `Reconcile Bank Transactions Manually` (a.k.a. **Manual Clearing Processing**)
Consumers:
  - *Automatic banks:* many-to-many matching allowed; running **proof of reconciled debits vs credits**;
    "an automatic reconciliation update occurs each time the proof amount equals zero";
    filter criteria may be changed **only while proof = 0**; rows marked P flip to R at proof zero
    and are grouped into a reconciled **batch**
  - *Manual banks:* no automatic matching; mark any number of transactions; filters changeable any time
Payload:    proof calculation "adds locally-generated records to the proof amount and subtracts bank-generated records"
Statuses:   `Clr` column — **P** (pending) → **R** (reconciled); un-marking an R removes it from
            *all* transactions in that batch
Selection:  records "not yet reconciled or voided as of the statement start date" and
            "with a transaction date on or before the statement end date"
Sources:    `Bank Reconciliation` file (by transaction type) + `Bank Reconciliation Auto` file (by BAI code);
            specifying either code pulls all codes associated with the other
Evidence:   "an automatic reconciliation update occurs each time the proof amount equals zero" — Reconcile Bank Transactions Manually, /articles/15202028426388
Maps to:    NEW — **W-034 final leg CONFIRMED**

### FINDING 28 — BAI code ↔ Transaction Type cross-reference is the matching backbone
Trigger:    Automatic bank import
Producer:   `Import Bank Transactions with Automatic Reconciliation`
Consumers:  pass 1 — one-to-one match against the Bank Reconciliation file;
            pass 2 — deposits matched one-to-many and/or many-to-one
Payload:    "the system uses the cross reference table linking the BAI codes and Transaction Type codes"
Evidence:   Import Bank Transactions with Automatic Reconciliation, /articles/15202013123220
Maps to:    NEW

> Deposits get their own second matching pass precisely because a bank deposit is a *sum* of
> receipts. This is the mechanism our own drawer→deposit→bank chain will need.

### FINDING 29 — The auto-import abort/ignore prompt can silently un-reconcile a whole month
Trigger:    Completing an automatic bank import
Consumers:
  - all records reconciled → **Abort** (no update) or **Ignore** (clear `BANK.REC.AUTO`, reconciled flags survive)
  - unmatched records exist → **Abort** or **Ignore**, where Ignore *"un-reconcile[s] any transactions that have already reconciled"* and clears `BANK.REC.AUTO`
Evidence:   "Ignore - 'un-reconcile' any transactions that have already reconciled and clear the BANK.REC.AUTO file so the process can import the spreadsheet for the same month" — Import Bank Transactions with Automatic Reconciliation, /articles/15202013123220
Maps to:    NEW

> The same button label means "keep everything" in one branch and "throw away the month's work"
> in the other. Worth building as two distinctly-named actions.

### FINDING 30 — Two different import routines exist with different file formats and different matching rules
Trigger:    Loading bank data
Producer A: `Import Bank Transactions with Automatic Reconciliation` — **CSV-type spreadsheet**, BAI-driven, auto-reconciles
Producer B: `Import and Match Bank Transactions` — **tab delimited text file**, matches into the
            manual reconciliation grid and flags `R`
Matching (B):
  - Check transactions → Transaction Type + Document Number + Amount
  - All other types → Transaction Type + Amount + Date, with `Plus/Minus Days for Match` from **Bank Settings**
  - optional if populated: Document Number, Location, Deposit Type Code
Hazard:     "Manual grid filtering had no effect on the item's ability for reconciliation" — items
            outside the visible filter are still matched and saved
Evidence:   "For the Date, the Plus/Minus Days for Match setting in Bank Settings is considered." — Import and Match Bank Transactions, /articles/15202013041428
Maps to:    NEW

### FINDING 31 — Manual reconciliation transactions post to GL immediately, with an EFT mirror
Trigger:    Saving `Enter a Reconciliation Transaction`
Producer:   bank reconciliation
Consumers:
  - "A posting batch generates to the General Ledger (**two batches for EFT transactions**)"
  - `Cash in the Bank` account for the indicated bank is debited or credited
  - the **offsetting account is taken from `Reconciliation Transaction Type Settings`**
  - if default postings exist and the user has security access, `GL Account Entry Screen` opens to correct them
Transfer:   with a Transfer Bank present, the system creates **two records**, the second with debits
            and credits reversed; edits update both; deletes remove both
Delete:     available only for an existing, **not yet reconciled** transaction; "the system posts a
            reversal of all original postings to the General Ledger"
Use cases:  bank service charges, credit card usage fees, correcting minor reconciliation errors
Evidence:   "the 'Cash in the Bank' account for the indicated bank debits or credits accordingly and the offsetting account is taken from the Reconciliation Transaction Type Settings." — Enter a Reconciliation Transaction, /articles/15202013122452
Maps to:    **W-036 — refines it** (a fourth mapping table), **W-035 — CONFIRMED pattern** (delete posts a reversal, not an in-place edit)

> Note this is a **fifth** account-resolution source we hadn't catalogued: `Reconciliation
> Transaction Type Settings`. And note the operator can hand-edit the resulting GL accounts
> if they hold the right permission — so the posting is a *suggestion*, not a rule.

### FINDING 32 — AP bill status is carried as an unlabelled column on the cash requirements report
Trigger:    `Report Cash Requirements`
Payload:    unmarked column between Type and Invoice Number = **AP bill status code** ("H" = Hold)
Aging:      `Past Due` populates only when the invoice date has passed the as-of date; reporting off
            `Anticipated Pay Date` or `Discount Date` earlier than the as-of date falls back to invoice date
Config:     Company · Bank · Country · Sort by Country · As of Date · Aging Method · Aging Days ·
            Pending Bills · Hold Codes
Evidence:   Report Cash Requirements, /articles/15202553293460
Maps to:    NEW — relates to `W-069` (dating rules) and the AP state machine

---

## C. Screen and field inventory

**Report Daily Receipts Register** — Date Code · Start Date · End Date · Report Type · Date Type ·
District · Store · Print General Ledger Recap · Send Output to · Export Path.
Output components under Basic PDF: detail · receivables recap by store · recap by bank · G/L recap
(only detail prints a legend).

**Report Cash Requirements** — Company · Bank · Country · Sort by Country · As of Date · Aging Method ·
Aging Days · Pending Bills · Hold Codes · Send Output to · Export Path · Actions.
Sorts and totals after each vendor, bank, and company.

**Report Cash Balancing Exceptions** — Send Output to · Export Path.
*Unassigned Transactions columns:* System Date · Transaction Date · System Time · Store · Drawer ·
Operator · Reference · Pay Type · Amount.
*Suspense Cash Drawers columns:* Date · Drawer Reference · Start time · End time.

**Report Cash Drawer Reconciliation Status** — Send Output to · Export Path.
*Columns:* reference number · deposit date · operator's name (or Drawer/Store) · location · status ·
receive date · over and short amounts.

**Reconcile Checks** — Bank · Date Code · Starting Check Date · Ending Check Date ·
Starting Check Number · Ending Check Number · Include Checks.

**Accounts Payable Check Reconciliation Screen** — grid of checks with checkbox; All / None buttons.

**Reconcile Bank Transactions Manually** — tabs: Set Filters, Reconcile.
*Header:* Bank · Statement Start · Statement End · Starting Statement Balance ·
Ending Statement Balance · Ending Balance / Transaction Proof.
*Set Filters tab:* Show Cleared · Sort By · BAI Code · Transaction Type · Containing Text ·
Document Number (Equal To / Less Than / Greater Than) · Amount (Equal To / Less Than / Greater Than).
*Reconcile tab:* grid with `Clr` column · Grid Information · Actions.
Buttons: Save · Clear · Exit. **Delete is not available.**

**Import Bank Transactions with Automatic Reconciliation** — Bank · Statement Ending Date ·
Path to Spreadsheet · Name of Spreadsheet · At Conclusion of Process · Run Cleared Transaction Report ·
Run Error Transactions Report. Buttons: Run · Clear · Exit.

**Import and Match Bank Transactions** — PC Path of Spreadsheet (+ Action button / Windows Explorer).

**Enter a Reconciliation Transaction** — Bank · Record ID · Date · Document Number · Transaction Type ·
Deposit Type Code · Transfer Bank · Amount · Post to General Ledger · Detail Reference Information.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes | Scope |
|---|---|---|---|
| Extend Cash Balancing | Cash Balancing Control Settings | Gates whether `Report Cash Balancing Exceptions` runs at End-of-Day at all | System |
| Number of Tries | Cash Balancing Control Settings | Blind-balance retry limit before a suspense drawer is created | System |
| Group Payments by | Cash Balancing Control Settings | Cashier / Drawer / Store — drives Drawer Reference on the exceptions report | System |
| Balance By | Cash Balancing Control Settings | Operator / Drawer / Store — substitutes the identity column on the status report | System |
| Daily Receipts Retention Months | Accounts Receivable Control Settings | Retention of `DAILY.DETAIL`; purged by `Generate Monthly Reports` | System |
| Plus/Minus Days for Match | Bank Settings | Date tolerance when matching non-check bank transactions | Bank |
| bank reconciliation mode | Bank Settings (implied) | Automatic vs manual — changes matching, proof behaviour, and filter locking | Bank |
| Reconciliation Transaction Type Settings | (own settings file) | Offsetting GL account per reconciliation transaction type | System |

---

## E. Security permissions catalog (additions)

| Permission | Gates | Notes |
|---|---|---|
| manager approval (unnamed) | Releasing suspense cash drawers created by exceeding `Number of Tries` | Named as a requirement, not as a permission code |
| (unnamed) GL correction access | Editing default postings via `GL Account Entry Screen` from `Enter a Reconciliation Transaction` | "if default postings are present **and you have security access**" |
| Regional Processing | Customers/locations visible on `Report Daily Receipts Register` | Applies here; explicitly does **not** apply to the GL module |

---

## F. State machines and enumerations

**Check status** — Printed · Reconciled · Voided.
Save on the reconciliation screen sets selected → Reconciled, unselected → Printed. Voided is inert.

**Bank reconciliation clear flag (`Clr`)** — blank → **P** (pending) → **R** (reconciled).
For auto banks, all P flip to R when proof = 0 and are grouped into a *batch*; un-marking one R
removes R from the whole batch.

**Cash drawer lifecycle** — unbalanced → balanced → reconciled → purged.
Side states: *suspense* (retry limit exceeded, awaits manager), *unassigned transaction*
(belongs to no drawer at all).

**Daily receipts transaction type** — payment · deposit · on-account.
**Daily receipts transaction class** — cash · charge · guaranteed check · electronic check · manual check.
**Pay Type (exceptions report)** — Check · Cash · Credit Card (card brand code, e.g. MC) · financing type code.

**Bank reconciliation record sources** — `BANK.REC` (by transaction type) · `BANK.REC.AUTO` (by BAI code).
Supporting files named in validation errors: `BANK.REC.TRANS.TYPE`, `BANK.REC.DEP.TYPE`,
`WAREHOUSE.LOCATION`. Document Number ≤ 20 characters; mandatory for `CHK` type.

**Import error taxonomy** (verbatim list) — Transaction Type NULL / missing from BANK.REC.TRANS.TYPE ·
Document Number NULL for CHK · Document Number > 20 chars · Transaction Date NULL / invalid ·
Amount NULL / non-numeric · Location missing from WAREHOUSE.LOCATION · Deposit Type Code missing
from BANK.REC.DEP.TYPE · Check already matched · Check amount mismatch · Check does not exist for
this bank · Transaction could not be matched.

**Auto-import completion branches** — all reconciled → {Abort, Ignore(keep flags)} ·
unmatched exist → {Abort, Ignore(un-reconcile all)}.

---

## G. Sequencing rules (additions)

1. `Reconcile Checks` → Save → `Accounts Payable Check Reconciliation Screen` → Save. Two-step commit.
2. `Import Bank Transactions with Automatic Reconciliation` runs **before** `Reconcile Bank
   Transactions Manually` handles the residue.
3. `Import and Match Bank Transactions` writes `R` flags into the manual grid; the operator must
   still click Save for them to take effect.
4. Filter criteria on an auto-reconciliation bank may be changed **only when the proof amount is zero**.
5. `Report Cash Balancing Exceptions` runs at End-of-Day only if `Extend Cash Balancing` is checked.
6. `Report Cash Drawer Reconciliation Status` prints automatically as part of End-of-Day.
7. `Report Daily Receipts Register` runs as part of `Generate Daily Reports`, incrementally.
8. `Generate Monthly Reports` purges `DAILY.DETAIL` per `Daily Receipts Retention Months`.
9. `Purge Reconciled Transactions` is the terminal step for bank rec records (not yet read).
10. Delete on a reconciliation transaction is possible **only before** it is reconciled.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **The deposit step is missing.** This is the centre of question 6. `Report Cash Drawer
  Reconciliation Status` carries a `deposit date` and a `receive date`, and bank rec records carry a
  `Deposit Type Code`, but **no article in this batch describes the process that turns balanced
  drawers into a bank deposit record**. The chain we can evidence is
  drawer → balanced/reconciled → *(gap)* → bank rec line → matched → cleared.
  Candidate articles not yet read: `Cash Drawer Reconciliation`, `Take Multiple Deposits`,
  `Deposit Application Screen`, `Place Money On Account Screen`. **Must resolve.**
- **Card settlement batches are not described anywhere in the cash chain.** The exceptions report
  shows a card brand code as a Pay Type, and the register covers "bank cards", but no article says
  how an authorised card transaction becomes a settlement batch or a bank deposit line. `W-030`
  and the card half of `W-031` are `NOT DOCUMENTED IN THIS SECTION` so far.
- **Financing funding batches likewise.** 3rd-party financing receipts appear on the register
  before funds arrive; nothing here describes the funding batch or its reconciliation. `W-032` open.
- **`Post to General Ledger` field** on `Enter a Reconciliation Transaction` — a field of that name
  implies posting is **optional**. If so, a bank reconciliation entry can clear the bank without
  touching the ledger. Not stated either way. **High-severity ambiguity.**
- **`Include Checks`** on `Reconcile Checks` — value list not given.
- **`Report Type` / `Date Type`** on the Daily Receipts Register — value lists not given.
- **`Aging Method`** on Cash Requirements — value list not given.
- **AP bill status codes** — only "H = Hold" is given by example; the full enumeration is absent.
- **`At Conclusion of Process`** on the auto-import — value list not given.
- **Over/short posting** — batch 1 gave the `Over or Short` account; nothing here says at which
  moment the drawer variance posts, or whether a suspense drawer posts before manager approval.

**3. Inferences (not quotable, kept out of section B)**
- The `recap by bank` section of the Daily Receipts Register is probably the intended bridge from
  receipts to deposits, but the docs never say it drives anything — it appears to be a report only.
- `Purge Reconciled Transactions` presumably makes drawer records eligible for the "purged" state
  in the drawer status report; the two articles never reference each other.
- Because auto-bank filter changes are locked unless proof = 0, a partially-matched session is
  effectively a lock on the operator. Not stated as a design intent.

---

## I. Unknown unknowns (additions)

- **BAI code support** — a full banking-standard code set with a maintained cross-reference to
  STORIS transaction types. We have nothing equivalent planned.
- **Transfer banks / book transfers** — `Transfer Bank` field creates mirrored double records
  with reversed debits and credits, edited and deleted as a pair.
- **EFT as a two-batch GL posting** — "two batches for EFT transactions".
- **Multi-country AP** — `Country` and `Sort by Country` on Cash Requirements; `Toggle Currency
  Action` and `Actual Exchange Rate Lookup` elsewhere in Payables.
- **Anticipated Pay Date and Discount Date** as distinct AP dates driving aging.
- **Pending Bills** as a reportable class on cash requirements (ties to `Recorded Not Received`).
- **Blind Cash Balancing** as a named mode with a retry counter.
- **Petty cash disbursement from within the balancing routine** (from batch 1).
- **`Deposit Type Code`** as a first-class dimension on bank reconciliation records.
- **Guaranteed / electronic / manual check** as three distinct tender classes.
- **District** as a reporting dimension above Store.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| DAILY.DETAIL | Receipts detail file behind the Daily Receipts Register; retention-controlled and purged monthly |
| G/L Recap | The ledger-posting summary section of the Daily Receipts Register |
| Extend Cash Balancing | Control setting that enables the End-of-Day cash exceptions report |
| Blind Cash Balancing | Balancing mode where the operator cannot see expected totals; has a retry limit |
| Suspense Cash Drawer | A drawer whose balancing exceeded the retry limit; awaits manager approval |
| Unassigned Transaction | A receipt attached to no cash drawer at all |
| Balance By / Group Payments by | Two settings that independently redefine drawer identity (Operator / Drawer / Store) |
| Manual Clearing Processing | Alternate name for `Reconcile Bank Transactions Manually` |
| Proof (Ending Balance / Transaction Proof) | Running debit-vs-credit balance of a reconciliation session; zero triggers the auto update |
| Clr column | Clear flag on a bank rec row: blank, P (pending), R (reconciled) |
| Reconciled batch | The group of rows that flipped to R together at a single proof-zero event |
| BAI code | Banking-standard transaction code, cross-referenced to STORIS transaction types |
| BANK.REC / BANK.REC.AUTO | The locally-recorded and bank-supplied reconciliation files |
| Deposit Type Code | Classification on a bank reconciliation record (`BANK.REC.DEP.TYPE`) |
| Cash in the Bank | The bank's GL cash account, debited/credited by reconciliation transactions |
| Reconciliation Transaction Type Settings | Settings file supplying the offset account for manual reconciliation entries |
| Transfer Bank | Counterparty bank on a book transfer; generates a mirrored reversed record |
| Anticipated Pay Date / Discount Date | AP dates that can drive cash-requirements aging instead of invoice date |
