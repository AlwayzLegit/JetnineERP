# Run 01 — Accounting — Batch 15: Vendor Receivables, Revolving Terms, and AR Comment/Reason Screens

10 articles. Vendor Receivables is the AR-shaped subledger for money vendors owe *us* — bill-backs,
volume rebates, manual postings — and it is the missing half of `W-044`.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 143 | Apply Payments and Maintain Vendor Receivables Balances *(Receivables Maintenance)* | /articles/15202312646932 | EXTRACTED |
| 144 | Manual Adjustments in Vendor Receivables | /articles/15202297159316 | EXTRACTED |
| 145 | Enter a Volume Rebate *(Volume Rebate Posting Entry)* | /articles/15202312642836 | EXTRACTED |
| 146 | Enter a Customer's Revolving Terms & Conditions | /articles/15202280007444 | EXTRACTED |
| 147 | Default Terms Table | /articles/15202278682644 | EXTRACTED |
| 148 | Enter Reason Code | /articles/15202311537812 | EXTRACTED — thin |
| 149 | Enter Lien Registration Information | /articles/15202278092820 | EXTRACTED |
| 150 | Credit Review Comments Entry/Inquiry Screen | /articles/15202310175124 | EXTRACTED |
| 151 | Customer Credit Comments | /articles/15202311529364 | EXTRACTED |
| 152 | Vendor Receivables Payment On Account Adjustments Screen | /articles/(queued) | LOGGED — companion screen |

Newly discovered, queued: `Vendor Receivables Control Settings`, `Bill Back Settings`,
`Vendor Rebate Settings`, `Reconciliation Deposit Type Settings`,
`Advanced Customer Settings` → `Account Comments`, `View All Revolving Activity for a Customer`.

---

## B. Wiring findings

### FINDING 201 — Vendor Receivables is a full AR-shaped subledger with cash application and disputes
Trigger:    `Apply Payments and Maintain Vendor Receivables Balances`
Tabs:       **Cash Application · Manual Adjustments · Apply On-Account**
Capabilities: post payments and adjustments to V/R items · post on-account payments ·
            **place vendor receivable items in dispute** · post manual debit and credit adjustments ·
            apply on-account payments
Cash application payload: Bank · **Deposit Number** · Deposit Amount · Document · Comment ·
            **Proof Amount** · Reference · Amount · Action · Dispute · Comment
Bank rec:   this routine is one of the seven bank-rec record creators (batch 3, Finding 35)
Evidence:   Apply Payments and Maintain Vendor Receivables Balances, /articles/15202312646932
Maps to:    **W-044 — CONFIRMED (the receivable half)**, NEW otherwise

> Vendor Receivables mirrors customer AR almost exactly — open items, cash application with a proof,
> on-account money, disputes, manual adjustments — but for vendors. We had modelled vendor money
> only as AP credits. This is a separate ledger with its own trial balance, aging and daily activity
> report (all in Accounting Views and Reports, still unread).

### FINDING 202 — A vendor receivable can be converted into an AP debit
Trigger:    `Convert to Payable` on a Vendor Receivables manual adjustment
Effect:     "convert the receivable item to a **debit that will reduce the balance payable to the
            vendor**"
Memo:       auto-fills **`RSVD/VCHR#`** when Convert to Payable is checked, or **`Adjustment`** when not
Amount:     "can be a negative or positive number"
Dispute:    checkbox toggles dispute status on the item
Evidence:   Manual Adjustments in Vendor Receivables, /articles/15202297159316
Maps to:    **W-044 — CONFIRMED end to end** (RTV → vendor receivable → debit memo → applied against payment)

> This is the mechanism `W-044` describes, and it is explicit: the receivable becomes a payable
> debit, netting against what we owe. Note also `Vendor Receivable / Credit` (`VRC`) is bill type 16
> from batch 6, and `Vendor Receivable` is a credit type on the payment selection screen (batch 4).
> Three sightings now converge.

### FINDING 203 — GL maintenance on V/R adjustments is blocked in three specific states
Trigger:    `Maintain GL Postings` on the Manual Adjustments tab
Rule:       the action "will always be active … provided that the user has the proper security
            privileges", but a popup blocks access when: **no adjustment has yet been made** ·
            **a specific line item has been selected** · **the user does not have access to the GL
            accounts used as the defaults during posting** as defined in `General Ledger User Permissions`
Evidence:   Apply Payments and Maintain Vendor Receivables Balances, /articles/15202312646932
Maps to:    **W-050 — refines it** — permission is enforced against the *default accounts*, not the action

> Unusually specific and worth copying: the user must have rights to the accounts the posting would
> *default to*, not merely rights to the screen. That is account-level authorisation on a posting
> path — the thing `W-050` asks for, appearing here and almost nowhere else.

### FINDING 204 — Volume rebates post to vendor receivables and progress a goal
Trigger:    `Enter a Volume Rebate`
Effect:     "creates a **vendor receivable transaction** and posts the amount **toward the goal
            amount set in the rebate plan**"
Payload:    Date · **Based On** · Plan Code · Vendor · **Goal Type** · Goal · **Plan Type** · Amount ·
            Dates · Document · Product · Due Date
Evidence:   Enter a Volume Rebate, /articles/15202312642836
Maps to:    NEW — ties to the `Rebate Revenue` / `Rebate Contra-Revenue` accounts (batch 1, Purchasing tab)

> Rebate plans have goals, goal types and plan types, and rebate posting is *cumulative against a
> goal*. That is a whole earn-and-track model behind two GL accounts. `Vendor Rebate Settings` and
> `Bill Back Settings` are where the plans live — both unread and both in Merchandising/Vendor
> Settings, i.e. run 2 territory.

### FINDING 205 — Customer revolving terms changes take effect only at the next cycle, and log a comment
Trigger:    `Enter a Customer's Revolving Terms & Conditions`
Invariant:  "**Changes that you make on this screen are not applied until the next time the
            customer's account is cycled.**"
Audit:      "If a change is made to the revolving payment plan, a comment is logged, *'New payment
            terms have been applied to revolving plan XXX.'*"
Editable:   MMP amount · MMP % · term · **plan closed date** · insurance plan · remarks
Payload:    the same credit-position header as `Adjust Revolving Plans` (Credit Limit, Receivables,
            Potential Receivables, Available Credit) plus per-plan Activated · **Closed** ·
            Current Due · Last Charge · Last Payment · Remarks · Balance Current / **Highest** ·
            Minimum MMP $ **-Or-** % of Balance · MMP $ · Fixed Term is Months · Insurance
Evidence:   Enter a Customer's Revolving Terms & Conditions, /articles/15202280007444
Maps to:    NEW — a **deferred-effect** master-data change

> Deferred-effect edits are a real modelling requirement: between the edit and the next cycle the
> plan has one set of terms displayed and another in force. Our model needs an effective-date on
> plan terms, not a mutable current value.

### FINDING 206 — Installment default terms are a finance-amount → term lookup table
Trigger:    Installment Worksheet entry
Producer:   `Default Terms Table`, reached from `Installment Receivables Payment Plan Settings`
Structure:  Finance Amount · Term, "built in **ascending order of finance amounts**"
Evidence:   Default Terms Table, /articles/15202278682644
Maps to:    completes batch 14's `Default Terms Table` field

### FINDING 207 — Closing a plan captures a reason code and comment
Trigger:    `Enter a Customer's Revolving Terms & Conditions` → Actions → **Close Reason**
Payload:    Reason · Comment
Scope:      "indicate the reason you are closing the **installment or revolving** plan"
Evidence:   Enter Reason Code, /articles/15202311537812
Maps to:    **W-051 — CONFIRMED** (reason captured on the record), and ties to batch 7's
            Metro 2 account-status-bearing reason codes

### FINDING 208 — Registered liens are maintained per customer with their own permission
Trigger:    `Customer Credit and Scoring Information` → Registered Lien Details → Action
Payload:    Registration Number · Registration Date · **Expiration Date** · Reference
Gate:       `Update Customer lien requests` in receivables security settings; without it the grid
            is **view-only**
Evidence:   Enter Lien Registration Information, /articles/15202278092820
Maps to:    NEW

### FINDING 209 — Credit review comments are auto-generated at five defined events
Trigger:    Credit application pipeline
Producer:   `Credit Review Comments Entry/Inquiry Screen`, reached from `Audit Request Activity`
Events that write a comment: **application entered · application changed · application reviewed ·
            credit report reviewed · credit report printed**
Evidence:   Credit Review Comments Entry/Inquiry Screen, /articles/15202310175124
Maps to:    **W-053 — partially CONFIRMED**; completes batch 9, Finding 129

> This is the audit trail for the credit pipeline, and it is event-level rather than value-level.
> Note *credit report printed* is an audited event — appropriate for a regulated document.

### FINDING 210 — There are two distinct comment stores on a customer, with different visibility
Store 1:    **Account Comments** in `Advanced Customer Settings` — surfaced read-only as
            `Customer Credit Comments` from revolving and installment screens.
            "The comments shown on this screen **do not print on customer documents**. They are used
            by sales/credit personnel to view credit information that should be taken into
            consideration when working with a customer's account."
Store 2:    **Credit review comments** — per credit request, auto-generated (Finding 209)
Plus:       `Collections Comments file` (batch 10), `Customer Activity Log` (batch 12),
            `Customer Credit and Scoring Activity Log` (batch 9), `Installment Activity Log` (batch 7),
            `Collections Activity Log` (batch 10), `Customer Comments file` (batch 11)
Evidence:   Customer Credit Comments, /articles/15202311529364
Maps to:    NEW — and a warning

> **Seven distinct comment/log stores** are now named across the run, several reachable from the same
> screens under different buttons. Consolidating these into one timestamped, typed activity stream
> is one of the clearest wins available in the rebuild — and one of the harder migration mappings,
> because the docs never say which store a given "Comments" button writes to.

---

## C. Screen and field inventory

**Apply Payments and Maintain Vendor Receivables Balances** — Date · Vendor · Applied Amount.
- *Cash Application:* Bank · Deposit Number · Deposit Amount · Document · Comment · Proof Amount ·
  Reference · Amount · Action · Dispute · Comment
- *Manual Adjustments:* Company · Reference · Due Date · Memo · Type · Comment · Amount · Dispute ·
  Convert to Payable · Actions (Maintain GL Postings)
- *Apply On-Account:* Company · Reference

**Manual Adjustments in Vendor Receivables** (entry window) — Reference · Open Amount · Due Date ·
Dispute · Amount · Convert to Payable · Memo · Comment.

**Enter a Volume Rebate** — Date · Based On · Plan Code · Vendor · Goal Type · Goal · Plan Type ·
Amount · Dates · Document · Product · Due Date · grid checkbox column.

**Enter a Customer's Revolving Terms & Conditions** — Customer · Name · Co-signer · Co-applicant ·
Comments · Customer Store/Home/Work/Cell Telephone · Due Day · Credit Limit $ · Receivables $ ·
Potential Receivables $ · Available Credit $ · Active Plans · Plan · Activated · Closed ·
Current Due $ · Last Charge $ · Last Payment $ · Remarks · Balance Current $ · Highest $ ·
Minimum MMP $ / % of Balance · MMP $ · Fixed Term is Months · Insurance · Actions · Save · Delete.

**Default Terms Table** — Finance Amount · Term · Grid.

**Enter Reason Code** — Reason · Comment.

**Enter Lien Registration Information** — Registration Number · Registration Date ·
Expiration Date · Reference · Grid (Remove button).

**Credit Review Comments Entry/Inquiry Screen** — Customer Code · Credit Request · Update Comments ·
Comments · Send Output to · Export Path · Actions.

**Customer Credit Comments** — read-only text box.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Account Comments | Advanced Customer Settings | Free-text credit notes shown to sales/credit staff, never printed |
| Default Terms Table | Installment Receivables Payment Plan Settings | Finance-amount-banded default term months |
| Vendor Rebate Settings / Bill Back Settings | Vendor Settings | Rebate plan definitions (goal, goal type, plan type) — **unread, run 2** |
| Vendor Receivables Control Settings | own file | Includes `Bank Reconciliation Deposit Type` (batch 3) |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Update Customer lien requests | receivables security settings | Editing registered lien information |
| (account-level) | General Ledger User Permissions | Access to the **default posting accounts** for a V/R adjustment |

---

## F. State machines and enumerations

**Vendor receivable item states** — open · in dispute · adjusted · **converted to payable** · applied.

**V/R memo auto-values** — `RSVD/VCHR#` (when converted to payable) · `Adjustment` (otherwise).

**Credit review comment events** — application entered · application changed · application reviewed ·
credit report reviewed · credit report printed.

**Customer comment/log stores identified so far** — Account Comments · Credit review comments ·
Collections Comments · Customer Activity Log · Customer Credit and Scoring Activity Log ·
Installment Activity Log · Collections Activity Log · Customer Comments file.

---

## G. Sequencing rules (additions)

1. Revolving terms changes apply **at the next cycle**, not on save.
2. `Maintain GL Postings` on a V/R adjustment requires an adjustment to exist, no line selected, and
   account-level GL permission.
3. Volume rebate posting creates a V/R transaction and advances the rebate plan's goal.
4. Convert-to-Payable turns a V/R item into a debit against the vendor's payable balance.
5. Closing a plan requires a reason code (and may drive Metro 2 account status — batch 7).

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **`Based On`, `Goal Type`, `Plan Type`** on the volume rebate screen — the whole rebate model is
  three unexplained enumerations. Definitions live in `Vendor Rebate Settings` (run 2).
- **Which comment store each "Comments" button writes to.** Batch 10's collections screens, the
  revolving screens here, and the installment screens all have a Comments button; three different
  stores are plausible and the docs never disambiguate. **Material for migration mapping.**
- **`Type`** on the V/R manual adjustment — undescribed (as with the GL Distribution screens).
- **`Plan closed date`** — editable on the terms screen; what closing does to an outstanding balance
  is not stated here.
- **`Highest $`** appears again (batch 8) and is still undefined; almost certainly high credit.
- **Vendor Receivables Payment On Account Adjustments Screen** — logged, not yet read.

**3. Inferences (not quotable, kept out of section B)**
- `RSVD/VCHR#` presumably records the voucher the receivable was converted against; the docs give
  the literal but not the semantics.
- Because the V/R cash application screen has Bank, Deposit Number and Deposit Amount, vendor
  remittances are deposited and reconciled exactly like customer receipts. Consistent with batch 3's
  seven bank-rec creators but not stated as such.

---

## I. Unknown unknowns (additions)

- **Vendor Receivables as a full parallel subledger** with disputes, on-account money and cash application.
- **Convert to Payable** as an inter-subledger transfer.
- **Volume rebate goals** with goal types and plan types.
- **Registered liens** with registration and expiration dates.
- **Deferred-effect plan term changes** (applied at next cycle).
- **Plan closed date** as an editable field.
- **Seven-plus separate customer comment stores.**

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Vendor Receivable (V/R) | Money a vendor owes the company — bill-backs, rebates, manual postings |
| Convert to Payable | Turning a V/R item into a debit reducing the vendor's payable balance |
| RSVD/VCHR# | Auto memo on a converted V/R adjustment |
| Volume rebate | Vendor rebate earned against a goal, posted to V/R |
| Account Comments | Customer credit notes visible to staff, never printed |
| Credit review comments | Auto-generated per-credit-request audit trail |
| Close Reason | Reason code captured when closing an installment or revolving plan |
| Default Terms Table | Finance-amount-to-term lookup used by the Installment Worksheet |
