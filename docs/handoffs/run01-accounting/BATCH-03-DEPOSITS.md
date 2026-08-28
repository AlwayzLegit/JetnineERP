# Run 01 — Accounting — Batch 3: Deposits, On-Account Money, and the Deposit→Bank Link

10 articles. Scoped to run-card question 7 (deposits) and to closing the gap batch 2 left
in question 6 (drawer → deposit → bank rec).

**The gap is closed.** Two out-of-section articles reached by link did it:
`Bank Reconciliation Overview` (Overviews & References) and `Reconcile Cash Drawer`
(Sales Processing → Financing).

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 21 | Maintain Customer Deposits | /articles/15202297406356 | EXTRACTED |
| 22 | Place Deposit On Order Screen | /articles/15202277559188 | EXTRACTED |
| 23 | Deposit Application Screen | /articles/15202309413140 | EXTRACTED |
| 24 | Take Multiple Deposits | /articles/15202277573012 | EXTRACTED |
| 25 | Maintain Order Credits | /articles/15202297407508 | EXTRACTED |
| 26 | Place Money On Account Screen | /articles/15202309632532 | EXTRACTED |
| 27 | Maintain Customer Balances | /articles/15202312760468 | EXTRACTED |
| 28 | View a Customer's Current Deposits Detail | /articles/15294751491348 | EXTRACTED |
| 29 | **Bank Reconciliation Overview** *(Overviews & References)* | /articles/15202028426260 | EXTRACTED |
| 30 | **Reconcile Cash Drawer** *(Sales Processing → Financing)* | /articles/15201704205076 | EXTRACTED |

Newly discovered, queued: `Reconciliation Deposit Type Settings`, `BAI Code Settings`,
`Finance Provider Settings` (Misc tab), `Vendor Receivables Control Settings`,
`Payment Type Override Settings`, `Cash Drawer Settings`, `Purge Cash Drawer Data`,
`Balance Approval by Manager`, `Apply Payments From Finance Provider`,
`Enter a Customer Payment/Refund/Gift Certificate`, `Extended Security (Receivables)`,
`User/User Group Receivables Security`, `Point of Sale Control Settings`,
`Accounts Receivable Control Settings` (Deposits tab), `Credits and Refunds FAQs`,
`View a Customer's Current Deposits`, `Report Reconciliation Transactions`.

---

## B. Wiring findings

### FINDING 33 — The deposit record is real, system-generated, and grained per bank × location × deposit type
Trigger:    **End of Day process**
Producer:   cash receipts file (accumulates all payments during the business day)
Consumers:  `Bank Reconciliation` file — "The End of Day process writes one Daily Deposit record
            to the Bank Reconciliation file per bank, per store location, per deposit type."
Payload:    document number built as **`{mmddy}:{deposit type}:{sequence number}`** —
            two-digit month, two-digit day, last digit of year : two-digit user-defined deposit type :
            three-digit STORIS sequence
Invariant:  only payments "for which a reconciliation deposit type has been specified" accumulate
Config:     `Reconciliation Deposit Type Settings` creates the codes; `Bank Settings` assigns them
            to payment classes; `Payment Type Override Settings` overrides per payment type
Evidence:   "STORIS tracks all bank deposits and processes them via the End of Day process. The process creates a deposit record per bank, per location, per user-defined deposit-type code." — Bank Reconciliation Overview, /articles/15202028426260
Maps to:    **W-034 — CONFIRMED, chain complete**, **W-055 — CONFIRMED** (numbering is per type per date, sequence-suffixed)

> This is the link batch 2 could not evidence. The chain in full:
> receipt → cash receipts file → **End of Day → Daily Deposit record (bank × location × deposit type)**
> → Bank Reconciliation file → matched against bank import → cleared → purged.
> Note the grain: **not per drawer**. A store with four drawers produces *one* cash deposit record.

### FINDING 34 — Drawer reconciliation is a separate, manual, out-of-system loop
Trigger:    `Reconcile Cash Drawer` (Sales Processing → Financing)
Producer:   balanced cash drawers not yet reconciled or purged
Payload:    Reference # · Date · Drawer/Store/Operator · System Total · Status (R=Reconciled) ·
            **Bank Total (keyed by hand)** · Over/Short = System Total − Bank Total
Invariant:  "Reconciliation of cash drawers occurs **after your bank deposit has been made**"
Caveat:     "Bank Total information is useful only if you submit separate deposit slips for each cash drawer"
Config:     requires `Extended Cash Balancing` checked **and/or** `Group Payments by`,
            `Number of Tries`, or `Post to Suspense` in `Cash Balancing Control Settings`
Evidence:   "Reconciling cash drawer deposits to a bank statement is a required process in cash balancing." — Reconcile Cash Drawer, /articles/15201704205076
Maps to:    **W-034 — CONTRADICTED in shape**

> There are **two independent reconciliations**, not one chain:
> 1. *Drawer ↔ physical deposit slip* — manual, keyed Bank Total, per drawer, only meaningful if
>    the store writes one deposit slip per drawer.
> 2. *Daily Deposit record ↔ bank statement line* — automated, per bank × location × deposit type.
> Nothing joins them. A drawer can reconcile while its money sits in an unmatched deposit record,
> and vice versa. Our design should make the deposit a first-class object that both sides reference.

### FINDING 35 — Seven distinct events write bank reconciliation records
Trigger:    various
Producer:   Bank Reconciliation feature (when active)
Consumers:  records created automatically when you —
  1. enter payments for payment classes/types set up for reconciliation in `Bank Settings`
  2. use `Balance Approval by Manager` to enter exceptions such as overages or shortages
  3. use `Apply NSF and Correct Misapplied Payments` to enter NSF checks
  4. use `Apply Payments and Maintain Vendor Receivables Balances` (vendor receivable monies)
  5. use `Apply Payments From Finance Provider` (finance receivable monies from the bank)
  6. successfully print AP checks — gated by `All Checks Printed Successfully` in `Print Checks`
  7. void AP checks
Evidence:   Bank Reconciliation Overview, /articles/15202028426260
Maps to:    **W-034 — CONFIRMED (extends it)**, **W-032 — first hard lead**

> Item 5 plus `Finance Provider Settings` → Misc tab → **`Bank Reconciliation Funding Type`** is the
> financing funding batch that `W-032` asks about. Item 6 is notable: the AP check reconciliation
> record is created by a *reporting flag on the print run*, not by the check record itself.

### FINDING 36 — Seven payment classes, two of them excluded, one of them un-assignable
Trigger:    Money entering via Sales Order Entry, Customer Payment Entry, etc.
Enumeration (verbatim, numbered by STORIS):
  1. Cash · 2. Checks · 3. Credit Cards · 4. Third-Party Financing · 5. Miscellaneous ·
  6. Debit Cards · 7. Gift Certificates
Config:     class 4 deposit types assigned via `Finance Provider Settings`;
            **class 7 cannot be assigned deposit type codes**
Contradiction: "STORIS creates bank reconciliation records for most of these classes" — then
            "NOTE: Credit card and cash payments cannot be included in the Bank Reconciliation."
            Yet `Bank Settings` is described as specifying "default deposit types for many payment
            classes **such as Cash or Check**."
Evidence:   Bank Reconciliation Overview, /articles/15202028426260
Maps to:    **W-031 — CONTRADICTED again, and this time the docs contradict themselves**

> Section H carries this as the highest-priority ambiguity in the run. If cash truly cannot be
> bank-reconciled, then the *only* control over store cash is the manual drawer/deposit-slip loop
> in Finding 34, and the automated chain covers checks and financing only.

### FINDING 37 — EFT batches reconcile as one record, not per payment
Trigger:    EFT batch
Invariant:  "the system creates a single bank reconciliation record for the total EFT batch but not
            for individual payments within an EFT batch"
Evidence:   Bank Reconciliation Overview, /articles/15202028426260
Maps to:    NEW (pairs with Finding 31's "two batches for EFT transactions" on the GL side)

### FINDING 38 — Purging reconciled transactions rolls the bank's opening balance forward
Trigger:    `Purge Reconciled Transactions`
Consumers:  `Beginning Balance` and `As-Of-Date` fields in `Bank Settings` update
Evidence:   "During this process, the Beginning Balance and As-Of-Date fields in the Bank Settings update." — Bank Reconciliation Overview, /articles/15202028426260
Maps to:    NEW

> Purge is not merely a retention job — it is the event that advances the reconciliation baseline.
> Running it early destroys the ability to re-reconcile a period.

### FINDING 39 — A posted deposit becomes a liability, and has five exit routes
Trigger:    Posting a deposit to an account
Producer:   `Maintain Customer Deposits`
Invariant:  "After you post a deposit to an account, the amount becomes a deposit liability."
Consumers (exits):
  - move on-account money **to** a deposit
  - move deposit money from one open order to another
  - place deposit money on account
  - refund to the customer (check, cash, gift card, or credit card)
  - credit financed deposits to **Finance Receivables**
  - apply to gift certificates
Config:     `Service to Sales Deposit` on the Deposits tab of `Accounts Receivable Control Settings`
            permits moving Service Order deposits to on-account
Evidence:   "After you post a deposit to an account, the amount becomes a deposit liability." — Maintain Customer Deposits, /articles/15202297406356
Maps to:    **W-033 — CONFIRMED for the liability half; the release-at-invoice half is still NOT DOCUMENTED**

> Every documented exit is a *maintenance* action. Nothing in this batch describes the automatic
> release of deposit liability to revenue at invoice/delivery. That remains the open half of `W-033`.

### FINDING 40 — Refund method is chosen by the system from payment history, not by the operator
Trigger:    Refunding a revolving plan credit balance
Rule:       **Immediate refund** when only one payment type contributed to the credit balance.
            **Check refund** (an AP Bill is created) when multiple payments contributed —
            "even if the same payment type was used" — or when no payment history is found.
Consumers:  `View a Customer's Payment Activity` shows the refund method
Config:     `Maintain Customer Deposits Refund Receipts` in `Point of Sale Control Settings`;
            any value except "No Receipt" prompts to print, repeatedly, per receipt.
            **If the refund method is an AP refund, no receipt prints and no signature is captured.**
Evidence:   "Immediate refunds are issued when only one payment type contributed to the credit balance. Check refunds are issued when multiple payments contributed to the credit balance (even if the same payment type was used), or when no payment history is found." — Maintain Customer Deposits, /articles/15202297406356
Maps to:    NEW — creates an **AR → AP** link we had not modelled

> A customer refund can cross the subledger boundary and become a vendor-style AP bill.
> That is a wiring link `W-035` does not anticipate.

### FINDING 41 — Deposit mobility depends on the funding instrument
Trigger:    Attempting to move or refund a deposit
Rules:
  - **Finance Receivable (FR) deposits** — crediting to Finance Receivables is "the only option
    available". Cannot move FR deposits between orders. Must credit, then reapply via
    `Enter a Customer Payment/Refund/Gift Certificate`.
  - **Revolving deposits** — order deletion **automatically removes** the deposit, so it never
    reaches this screen. Refundable from open orders only if the `Revolving` box at
    `Immediate Deposit Refund Types` is checked in `Accounts Receivable Control Settings`.
    **Cannot** transfer between orders. **Cannot** move to On Account.
  - **Builder allowance and in-store-use-only gift certificates** — cannot be refunded, but their
    deposits can be applied to another sales order.
  - **Adyen credit card** — "A card must be present to complete an independent refund." Saving puts
    the money on account; the operator must then use `Enter a Customer Payment/Refund/Gift Certificate`.
Evidence:   "You can NOT transfer revolving deposits from one order to another using this process." — Maintain Customer Deposits, /articles/15202297406356
Maps to:    NEW — a matrix of (instrument × operation) permissions we have no equivalent for

### FINDING 42 — Mixed-tender refunds are serialised by session, card versus everything else
Trigger:    Immediate Refund from `Maintain Customer Deposits` where the order has multiple deposits
Producer:   `Take Multiple Deposits`
Invariant:  "If a line item in the grid has more than one payment type, only one of the payment types
            will be allowed to be processed at a time." For an Immediate Refund, card and non-card
            deposits "will not be allowed to be processed in the same session" —
            "you must exit and re-access the Take Multiple Deposits screen."
Evidence:   Take Multiple Deposits, /articles/15202277573012
Maps to:    NEW

> A single customer refund of a mixed-tender deposit is therefore **two transactions**, and there is
> no documented envelope tying them together. Partial-failure handling is on us.

### FINDING 43 — Deleted orders keep their deposits and are displayed with a `D*` prefix
Trigger:    Selecting an order in `Take Multiple Deposits`
Payload:    "If the order you select is a deleted order, the order number displays with the following
            prefix: D* For example, D*011869."
Evidence:   Take Multiple Deposits, /articles/15202277573012
Maps to:    NEW

> Order deletion does **not** cascade to deposits (except revolving — Finding 41). Deposit liability
> survives its order. Our cancel path must decide this explicitly rather than inherit it.

### FINDING 44 — On-account money has a fixed reference and is a distinct pool from deposits
Trigger:    `Place Money On Account Screen`, from the Actions menu in `Enter a Customer Payment`
            or `Maintain Customer Balances`
Invariant:  "The reference number defaults from the Customer record and you cannot edit it."
Consumers:  future application; on-account money can be moved *into* a deposit via
            `Maintain Customer Deposits`; refunding on-account money requires `Maintain Customer Balances`
Evidence:   Place Money On Account Screen, /articles/15202309632532
Maps to:    NEW

> Three distinct customer money pools now identified: **deposit** (against an order),
> **on account** (unapplied), and **open-item A/R credit**. Each has its own screen and its own
> refund path. Conflating them is the obvious modelling mistake to avoid.

### FINDING 45 — Order credits from returns/exchanges route to a refund screen, not to cash
Trigger:    Completed exchanges, returns, credit adjustments, payments on account, manual credit
            memos on completed orders that resulted in an A/R credit
Producer:   `Maintain Order Credits` (Customer > Point of Sale > Returns and Refund)
Consumers:  double-clicking a row opens the **Process Receivables tab** of
            `Enter a Customer Payment/Refund/Gift Certificate` to complete the refund
Payload filters: Start Date · End Date · Location · Payment Type Code · **Credit Card On Original Order**
Evidence:   Maintain Order Credits, /articles/15202297407508
Maps to:    **W-035 — partially CONFIRMED** (a return produces an A/R credit that must be
            separately actioned; it does not auto-refund)

> `Credit Card On Original Order` as a search filter implies STORIS retains the original tender
> for refund-to-original-card. Confirms card-linkage survives the sale.

### FINDING 46 — Manual A/R adjustment, key-off, and bad debt are three separately-permissioned tabs
Trigger:    `Maintain Customer Balances`
Tabs / gates:
  - *Manual Adjustments* — `Maintain Customer Balances; Manually Adjust an Account Balance`
    in **Extended Security (Receivables)**
  - *Keyoffs* — `Maintain Customer Balances; Key Off a Credit/Debit Balance` in **Extended Security**
  - *Bad Debt* — `Maintain Customer Balances; Charge off an Account Balance` in **Extended Security**
  - refunds from the Keyoffs tab additionally require `Maintain Customer Balances - Refund`
    in **User/User Group Receivables Security**
Action codes: **P**=Pay · **K**=Keyoff · **R**=Refund · **O**=On Account ·
              **L**=Long Term Revolving · **I**=Long Term Installment
Bad debt classes: **Charged Off · Non-Accrual · Reinstated**
Invariant:  "You cannot assign an Alert Code of 'CO' (charged off) or assign an automatic write-off
            code to accounts with active revolving plans or active installment contracts.
            Active plans/contracts must be cancelled first."
Config:     `Automatic Charge-Off` process in `Accounts Receivable Control Settings`
Scope:      "This routine may be affected by Regional Processing restrictions."
Evidence:   Maintain Customer Balances, /articles/15202312760468
Maps to:    **W-050 — partially CONFIRMED here** (two *different* security systems gate one screen),
            **W-051 — CONFIRMED**

> Note there are now **two named security subsystems** in Receivables alone — `Extended Security
> (Receivables)` and `User/User Group Receivables Security` — gating different actions on the same
> screen. Add that to the four GL carve-outs from batch 1 when assessing `W-050`.

### FINDING 47 — Card and licence data are masked at rest in views, with a permissioned full reveal
Trigger:    `View a Customer's Current Deposits Detail`
Payload:    Type (CASH, CHK, VISA, …) · Reference (masked except last 4) · Expiration Date ·
            Authorization · Driver's License (masked except last 4) · Deposit Date · Amount
Reveal:     "To view the entire credit card number or check details, click select
            **Credit Card Number Full Display** from the Actions button."
Evidence:   View a Customer's Current Deposits Detail, /articles/15294751491348
Maps to:    NEW — compliance-relevant

> STORIS stores a retrievable full PAN and exposes it behind an Actions-menu item. Whatever we
> build should not reproduce this; we should tokenise and have no full-PAN reveal path at all.
> Worth confirming with STORIS what permission gates that action, and whether it is audited.

---

## C. Screen and field inventory

**Maintain Customer Deposits** *(read-only variant exists)* — Customer Code · Total Liability ·
Applied · Refund · On-Account · FR Credit · Grid Area · Order · Action · Payment Type · Available ·
Amount to Take · Refund Method · Reason.

**Place Deposit On Order Screen** *(from Actions menu of `Enter a Customer Payment`)* —
Customer Code · Order# · Deposit.

**Deposit Application Screen** — grid of orders; double-click returns to `Maintain Customer Deposits`
with the order in the **Apply To** field.

**Take Multiple Deposits** — Action · From · Type · Available · Take.

**Maintain Order Credits** — Start Date · End Date · Location · Payment Type Code ·
Credit Card On Original Order · Search · Grid Information.

**Place Money On Account Screen** — Amount (reference is fixed from the Customer record).

**Maintain Customer Balances** — tabs: Manual Adjustments, Keyoffs, Bad Debt. Header: Date · Customer Code.
- *Manual Adjustments:* Total Adjustment · Reference · Action · In Dispute · Type · Terms ·
  Memo Reference · Adjustment Amount · Grid Information · Actions
- *Keyoffs:* Refund · Proof · Reference · Action · Plan · Amount · Installment Contract · Grid Information · Actions
- *Bad Debt:* Alert Code; displays current and past due amounts, total currently due,
  Revolving Balance, Installment Balance, total account balance, charged-off balance

**View a Customer's Current Deposits Detail** — header (Order Number, Order Date, Order Amount,
Deposit Amount — all read-only); grid: Type · Reference · Expiration Date · Authorization ·
Driver's License · Deposit Date · Amount · Actions.

**Reconcile Cash Drawer** — Reference · Reconcile · Bank Total.
Grid: Reference # · Date · Drawer/Store/Operator · System Total · Status · Bank Total · Over/Short.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes | Scope |
|---|---|---|---|
| Reconciliation Deposit Type Settings | own settings file | Defines the two-digit deposit type codes used in the deposit document number | System |
| Bank Settings → Reconciliation tab | Bank Settings | Activates Bank Reconciliation; default deposit type per payment class; activates a bank for automatic reconciliation | Bank |
| Payment Type Override Settings | under Bank Settings | Overrides the class default deposit type for individual payment types | Bank |
| BAI Code Settings | own settings file | Descriptions for BAI codes on reports (informational only) | System |
| Bank Reconciliation Funding Type | Finance Provider Settings → Misc tab | Activates a finance provider for bank reconciliation (class 4 deposit types) | Provider |
| Bank Reconciliation Deposit Type | Vendor Receivables Control Settings | Activates vendor receivables for bank reconciliation | System |
| Service to Sales Deposit | Accounts Receivable Control Settings → Deposits tab | Permits moving Service Order deposits to on-account | System |
| Immediate Deposit Refund Types (Revolving box) | Accounts Receivable Control Settings | Permits immediate refund of revolving deposits from open orders | System |
| Automatic Charge-Off | Accounts Receivable Control Settings | Automated bad-debt reclassification | System |
| Maintain Customer Deposits Refund Receipts | Point of Sale Control Settings | Receipt printing behaviour on deposit refunds; "No Receipt" suppresses | System |
| Extended Cash Balancing | Cash Balancing Control Settings | Prerequisite for `Reconcile Cash Drawer` (with `Group Payments by` / `Number of Tries` / `Post to Suspense`) | System |
| Post to Suspense | Cash Balancing Control Settings | (named here for the first time) | System |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Maintain Customer Balances; Manually Adjust an Account Balance | Extended Security (Receivables) | Manual Adjustments tab |
| Maintain Customer Balances; Key Off a Credit/Debit Balance | Extended Security | Keyoffs tab |
| Maintain Customer Balances; Charge off an Account Balance | Extended Security | Bad Debt tab |
| Maintain Customer Balances - Refund | User/User Group Receivables Security | Processing customer refunds from Keyoffs |
| (unnamed) | — | `Credit Card Number Full Display` action on deposit detail |
| Regional Processing | — | Applies to `Maintain Customer Balances` |

---

## F. State machines and enumerations

**Payment classes** (STORIS-numbered) — 1 Cash · 2 Checks · 3 Credit Cards · 4 Third-Party Financing ·
5 Miscellaneous · 6 Debit Cards · 7 Gift Certificates.
Class 4 deposit types come from `Finance Provider Settings`. Class 7 admits **no** deposit type code.

**Deposit document number** — `{mmddy}:{deposit type}:{sequence number}`
(2-digit month, 2-digit day, 1-digit year : 2-digit type : 3-digit sequence).

**Customer money pools** — deposit (order-bound) · on account (unapplied) · open-item A/R credit.

**Maintain Customer Balances action codes** — P Pay · K Keyoff · R Refund · O On Account ·
L Long Term Revolving · I Long Term Installment.

**Bad debt classification** — Charged Off · Non-Accrual · Reinstated. Alert Code `CO` = charged off.
Blocked while an active revolving plan or installment contract exists.

**Refund method selection** — one contributing payment type → Immediate Refund;
multiple contributing payments (or none found) → Check Refund via an AP Bill.

**Refund types** — check · cash · gift card · credit card.

**Drawer reconciliation status** — `R` = Reconciled. Over/Short = System Total − Bank Total.

**Deleted order display** — prefix `D*` (e.g. `D*011869`).

---

## G. Sequencing rules (additions)

1. Payments accumulate in the cash receipts file all day → **End of Day** writes Daily Deposit
   records → those become reconcilable bank rec lines.
2. `Reconcile Cash Drawer` runs **after** the physical bank deposit has been made.
3. Drawer must be **balanced** before it appears in `Reconcile Cash Drawer`; **reconciled** before
   it can be purged.
4. FR deposits: credit to Finance Receivables **first**, then reapply via
   `Enter a Customer Payment/Refund/Gift Certificate`.
5. Adyen independent refund: save (money lands on account) **then** issue via
   `Enter a Customer Payment/Refund/Gift Certificate`.
6. Mixed-tender immediate refunds: card and non-card require **separate sessions**.
7. Active revolving plans / installment contracts must be **cancelled before** an account can be
   charged off.
8. `Purge Reconciled Transactions` advances `Beginning Balance` / `As-Of-Date` — run last, and once.
9. AP check bank rec records depend on `All Checks Printed Successfully` being set in `Print Checks`.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **Cash and credit cards in bank reconciliation — the docs contradict themselves.**
  `Bank Reconciliation Overview` says bank rec records are created for "most of these classes"
  and that `Bank Settings` sets "default deposit types for many payment classes such as Cash or
  Check", then states flatly: "Credit card and cash payments cannot be included in the Bank
  Reconciliation." Both sentences are in the same article. **This must be resolved with STORIS or
  in a sandbox before we model settlement.** It decides whether store cash is machine-reconciled
  at all.
- **Deposit release to revenue.** Still undocumented after two batches. We have the liability
  account (batch 1), the liability statement (Finding 39), and every manual exit — but no article
  states what happens to deposit liability at invoice/delivery. `W-033` half-open.
- **Whether the two reconciliation loops ever join.** Nothing states that a reconciled drawer and
  a matched Daily Deposit record are checked against each other.
- **`Post to Suspense`** — named in `Reconcile Cash Drawer` prerequisites, never described.
- **`In Dispute`, `Terms`, `Memo Reference`** on Manual Adjustments — named, undescribed.
- **`Proof`** on the Keyoffs tab — presumably a running balance like the bank rec proof; not stated.
- **`Reason`** on `Maintain Customer Deposits` — no reason-code enumeration given.
- **`Applied / Refund / On-Account / FR Credit`** header buckets — shown as fields, semantics not given.
- **Gift certificate deposits** — class 7 has no deposit type, so gift-certificate money never
  reaches bank rec. Where it is controlled instead is not stated.
- **`Credit Card Number Full Display`** — which permission gates it, and whether the reveal is audited.

**3. Inferences (not quotable, kept out of section B)**
- Because the Daily Deposit record is grained per bank × location × deposit type and the drawer
  loop is per drawer, a multi-drawer store almost certainly cannot tie the two without the
  separate-deposit-slip discipline the article recommends. The docs stop short of saying so.
- The `D*` prefix implies deposits outlive deleted orders generally; only the revolving case is
  documented as auto-removing.
- `Maintain Order Credits` filtering on `Credit Card On Original Order` implies refund-to-original-card
  is supported; no article in this batch says it outright.

---

## I. Unknown unknowns (additions)

- **Non-Accrual** as a bad-debt state distinct from Charged Off.
- **Alert Codes** on customer accounts, with `CO` as a reserved value.
- **Automatic write-off codes** and an `Automatic Charge-Off` batch process.
- **Long Term Revolving / Long Term Installment** as key-off destinations (`L`, `I`).
- **Revolving MMPs** (Minimum Monthly Payment plans) as key-off targets.
- **Builder allowance** and **in-store-use-only gift certificates** as non-refundable instruments.
- **Adyen** as a named card processor with card-present rules for independent refunds.
- **Service Orders holding deposits** that can migrate to sales, gated by a control setting.
- **Customer refunds becoming AP Bills** — a documented AR→AP crossing.
- **Signature capture on refund receipts** (absent for AP refunds).
- **Driver's licence capture and masking** on check deposits.
- **`Purge Cash Drawer Data`** as a distinct routine from `Purge Reconciled Transactions`.
- **Two parallel Receivables security subsystems** (Extended Security vs User/User Group Receivables Security).
- **Miscellaneous** as a first-class payment class (class 5).

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Daily Deposit record | The End-of-Day-generated bank rec row: one per bank, per location, per deposit type |
| Deposit type code | User-defined two-digit code classifying money for bank reconciliation |
| Payment class | STORIS's seven-way categorisation of incoming money (Cash … Gift Certificates) |
| Cash receipts file | Intraday accumulator of all payments, drained by End of Day |
| Deposit liability | What a posted customer deposit becomes |
| On account | Unapplied customer money, distinct from a deposit and from an A/R credit |
| Key-off | Applying a credit open item against a debit open item |
| Immediate Refund | Refund issued on the spot; only when a single payment type funded the credit |
| Check Refund | Refund issued by creating an AP Bill; used for multi-tender or unknown history |
| FR deposit | A deposit funded through Finance Receivables; immobile between orders |
| Revolving deposit | A deposit funded on an in-house revolving plan; immobile and auto-removed on order delete |
| MMP | Minimum Monthly Payment plan on revolving credit |
| Non-Accrual | Bad-debt classification distinct from Charged Off |
| Alert Code | Status marker on a customer account; `CO` = charged off |
| Bank Total | Hand-keyed deposit-slip amount used to reconcile a cash drawer |
| Over/Short | System Total minus Bank Total on a drawer |
| Post to Suspense | Cash balancing control setting, undescribed in the docs |
| D* prefix | Display convention marking a deleted order that still carries deposits |
