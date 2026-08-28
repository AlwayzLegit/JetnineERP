# Run 01 — Accounting — Batch 16: Plan and Contract Maintenance Operations

10 articles. The mutation operations on live consumer-credit accounts — transfer, defer, adjust,
forgive, payoff — plus the Metro 2 payment-history code table.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 153 | Plan Balance Transfer | /articles/15202311527572 | EXTRACTED |
| 154 | Plan Deferment | /articles/15202312376724 | EXTRACTED |
| 155 | Change Details | /articles/15202279413396 | EXTRACTED |
| 156 | Adjust Payment Terms | /articles/15202279026708 | EXTRACTED |
| 157 | Forgive Late Fees | /articles/15202311187860 | EXTRACTED |
| 158 | Calculate Payoff and Rebate Amounts | /articles/15202310832788 | EXTRACTED |
| 159 | Import Revolving Plan Balance Transfer | /articles/15202312129940 | EXTRACTED |
| 160 | Import Revolving Plan Deferments | /articles/15202279426452 | EXTRACTED |
| 161 | Additional Payment | /articles/15202277336724 | EXTRACTED |
| 162 | **Payment History Profile** | /articles/20200553866004 | EXTRACTED |

Newly discovered, queued: `Report Data Imported Errors and Warnings`, `Schedule a Process` →
`Enter Process Preferences`, `Late Fee Forgiven`, `Enter Additional Revolving Payments`,
`MMP Selection - Sales Order Table`, `Co-Applicant Name and Address Maintenance`, `Installment Notes`.

---

## B. Wiring findings

### FINDING 211 — Balance transfer re-terms the balance and compares promotions explicitly
Trigger:    `Plan Balance Transfer`
Invariant:  "Transferred balances are subject to the **new plan's overrides, restrictions, and settings.**"
Comparison: "the promotional and fixed terms of the two plans are compared. **For fixed term plans,
            the term is not considered to be promotional and is compared separately.** If the fixed
            or promotional terms are different, prompts appear warning of the difference … You have
            the option to cancel or continue."
Promotion rules:
  - promotional plan → non-promotional plan: "the current promotional terms are **removed**"
  - non-promotional plan → plan with different promotional terms: "the plans terms will be applied
    **as of the original invoice date**"
Payload:    Customer · Current Plan · Balance $ · Current $ · Transfer $ · New Plan · MMP $ ·
            **Chargeback Waived Interest** · **Close Current Plan**
Audit:      "Transfer activity is recorded in the **Customer Activity Log**."
Granularity: individual transactions can be selected; "any combination of transactions from multiple
            plans can be selected to transfer to the new plan"
Evidence:   Plan Balance Transfer, /articles/15202311527572
Maps to:    NEW — retroactive re-terming is a significant behaviour

> Applying a new plan's promotional terms **as of the original invoice date** retroactively changes
> the interest already computed on that balance. That is a recalculation of history, and it explains
> the `Chargeback Waived Interest` option sitting on the same screen. Our model needs to represent
> "interest waived under a promotion" as a reversible, chargeable-back amount, not as an absence.

### FINDING 212 — Deferment moves a whole payment short-term → long-term and posts one GL batch per session
Trigger:    `Plan Deferment`
Effect:     "each revolving payment being deferred **moves from short term to long term**. Included
            in this payment are **principal, interest, insurance, and finance fees**."
Netting:    "**Payments or credits applied to a deferred payment due reduce the amount deferred** by
            that payment/credit amount."
GL:         "The general ledger is updated with **one batch for each session run**, which includes
            all payments deferred in that session."
Scope:      the grid shows revolving payments for all plans "**except payments for plans that do not
            allow deferments**"
Payload:    Current Due · Past Due · Deferred Payments $ · **Master Plan to** · Comments
Audit:      Customer Activity Log
Evidence:   Plan Deferment, /articles/15202312376724
Maps to:    NEW — and it is the **inverse of cycling** (batch 8, Finding 112)

> Cycling moves long-term → short-term; deferment moves short-term → long-term. Same two ledgers,
> opposite direction, and both preserve the principal/interest/insurance/fee decomposition. That
> symmetry is the core invariant of the whole revolving model.
> Note the GL batching differs by route: **one batch per session** here, **one batch per spreadsheet
> row** on the import (Finding 215).

### FINDING 213 — `Change Details` rewrites transaction detail under a conservation constraint
Trigger:    `Change Details` from `Adjust Revolving Plans`
Invariant:  "adjustments to order details for the selected revolving plan, **without impacting the
            long or short term balance** … the **sum of the remaining balances for all transactions
            must equal the plan balance**."
Editable per transaction: Posted · Amount $ · Remaining $ · **Interest Waived $** · MMP $ ·
            **Promotion Expires** · **No Payments Until**
Evidence:   Change Details, /articles/15202279413396
Maps to:    NEW

> Promotion expiry and no-payments-until are **editable per transaction**, not just per plan. So a
> single revolving plan can hold transactions under different promotional clocks. That is a
> materially more granular model than "plan has a promotion", and it explains why promotions are
> applied as of invoice date on transfer (Finding 211).

### FINDING 214 — Contract payment terms are adjustable across six dimensions, gated by an auto-pay permission
Trigger:    `Adjust Payment Terms` (installment)
Editable:   Due Day · **Add Grace Days** · **Extend Months** · Total $ Keyed-off ·
            **Credit Reversal** · Same as Cash · **Exclude Contract from Auto Pay** · **Revoked** · Comments
Availability: active contracts always; **pending** contracts only with
            `Installment; Exclude Contracts from Auto Pay` in receivables security settings
GL:         Actions → G/L Account Maintenance → GL Distribution screen
Evidence:   Adjust Payment Terms, /articles/15202279026708
Maps to:    **W-036 — CONTRADICTED (ninth sighting of hand-edited GL)**

> `Revoked` on this screen is presumably the same-as-cash revocation flag from batch 7; and
> `Exclude Contract from Auto Pay` confirms an **auto-pay** subsystem for installment that we have
> not yet seen documented anywhere (it also appeared as `Auto-Pay Override Contract` on the payoff
> screen). Auto-pay is a genuine gap — see section H.

### FINDING 215 — Bulk plan operations have different validation and GL granularity from the interactive ones
**Balance transfer import** (`Import Revolving Plan Balance Transfer`):
  - "Only **entire plans** can be transferred using this routine; individual transactions cannot be"
  - `MMP Amount` column valid only for **"Using a Fixed Table"** or **"As a Fixed Amount"** plan types
  - a null MMP means the process calculates it, "**and the amount overrides the MMP amounts entered
    on the other rows**" for that customer/plan combination
  - "Validation occurs on a **plan by plan** basis, so that the eligible plans can be transferred,
    even if on a row with ineligible plans"
  - "**Balances can be transferred to closed plans.**"
  - errors reported via `Report Data Imported Errors and Warnings` (PDF)
**Deferment import** (`Import Revolving Plan Deferments`):
  - runs on demand or via `Schedule a Process`; **entire plans only**; "Both past due and current
    due revolving payments are deferred"
  - "The general ledger is updated with **one batch per row** on the imported spreadsheet"
  - one mandatory column: **Account Number**; tab-delimited `.txt`; PC or NFS path
Evidence:   Import Revolving Plan Balance Transfer, /articles/15202312129940 · Import Revolving Plan Deferments, /articles/15202279426452
Maps to:    NEW

> Three divergences from the interactive path worth carrying into design: bulk transfer **can target
> closed plans** (interactive transfer excludes several states); bulk transfer is plan-level only;
> and GL batching granularity differs by route (per session vs per row). Any reconciliation that
> counts GL batches will differ depending on how the operation was performed.

### FINDING 216 — Late-fee forgiveness is a multi-select over unpaid fees with GL maintenance
Trigger:    `Forgive Late Fees`
Population: "all **unpaid** late fees for the contracts selected"; sorted by contract, then
            installment, then **assessed date**
Evidence:   Forgive Late Fees, /articles/15202311187860
Maps to:    NEW — the write path behind the `Late Fee Forgiven` view and the
            `Installment Late Fees` / `Revolving Late Fees` accounts (batch 1)

### FINDING 217 — Payoff and rebate are recalculated live per date
Trigger:    `Calculate Payoff and Rebate Amounts`, from `Review Contract Details` → Payoff Valid
Behaviour:  "the payoff calculations default using the **system date** … When you select a different
            date, the payoff amount **and rebates** are recalculated"; the date is the only active field
Evidence:   Calculate Payoff and Rebate Amounts, /articles/15202310832788
Maps to:    completes batch 7, Finding 107 — **payoff and rebate are both date-functions, not stored values**

### FINDING 218 — Additional revolving payments get an `AP` reference prefix
Trigger:    `Enter a Customer Payment` → Actions → Additional Payment
Precondition: at least one active revolving plan with a balance and **no MMPs currently due**
Invariant:  "A reference number with the prefix **'AP'** is automatically assigned to the transaction."
Evidence:   Additional Payment, /articles/15202277336724
Maps to:    **W-055 — CONFIRMED** (typed reference prefixes)

### FINDING 219 — The Metro 2 payment history profile is an editable 7-code monthly grid
Codes (verbatim):
| Code | Meaning |
|---|---|
| `0` | 0 payments past due (current account) — **cannot update** |
| `1` | 30–59 days past due date |
| `2` | 60–89 days past due date |
| `3` | 90–119 days past due date |
| `4` | 120–149 days past due date |
| `5` | 150–179 days past due date |
| `6` | 180+ days past due date |
| `C` | STORIS defined for Current |
| `B` | Customer does not exist — **cannot update** |
Rules:      "The **most recent cycle period cannot be edited** and has been omitted from the display.
            In the grid, month 1 indicates the cycle period **before** the most recent period." ·
            "Periods in which the code is 0 cannot be updated because **cycle processing was not run**
            for the customer." · periods coded `B` predate the customer. Editing either "will result
            in a warning message being displayed and the entry being rejected."
Evidence:   Payment History Profile, /articles/20200553866004
Maps to:    completes batch 11 (`Payment History Profile` as a Metro 2 repairable field) and
            batch 9 (as a credit-master field)

> Two things matter here. First, this is a **per-cycle-period delinquency history** maintained per
> customer — a 24-month rolling profile in Metro 2 terms — and it is **hand-editable** except for
> the current period and structurally impossible periods. Second, code `0` doubles as "cycle
> processing did not run", which means an absent cycle is indistinguishable from a current account
> in the stored history. That is a data-quality landmine for migration.

---

## C. Screen and field inventory

**Plan Balance Transfer** — Customer · Current Plan · Balance $ · Current $ · Transfer $ ·
New Plan · MMP $ · Chargeback Waived Interest · Close Current Plan · Grid.

**Plan Deferment** — Current Due · Past Due · Deferred Payments $ · Master Plan to · Comments · Grid.

**Change Details** — Customer · Plan · Activated · Balance · Current Due $ · Transaction · Posted ·
Amount $ · Remaining $ · Interest Waived $ · MMP $ · Promotion Expires · No Payments Until · Grid · Save.

**Adjust Payment Terms** — Contract · Due Day · Add Grace Days · Extend Months · Total $ Keyed-off ·
Credit Reversal · Same as Cash · Exclude Contract from Auto Pay · Revoked · Comments ·
Actions (G/L Account Maintenance).

**Forgive Late Fees** — Comments · Grid · Actions (G/L Account Maintenance).

**Calculate Payoff and Rebate Amounts** — Payoff/Rebate Date · Grid.

**Import Revolving Plan Balance Transfer** — PC Path of Spreadsheet.

**Import Revolving Plan Deferments** — Path (with PC / NFS selector and Browse).

**Additional Payment** — Customer · Plan · $.

**Payment History Profile** — per-cycle-period code grid (month 1 = period before most recent).

---

## D. Control settings catalog (additions)

*(No new settings files; this batch exercises those catalogued in batch 14.)*
Plan types named here: **"Using a Fixed Table"** and **"As a Fixed Amount"** — two of the
`Calculate MMP` values from `Revolving Payment Plan Settings`.

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Installment; Exclude Contracts from Auto Pay | receivables security settings | `Adjust Payment Terms` on **pending** contracts, and the auto-pay exclusion flag |

---

## F. State machines and enumerations

**Payment history profile codes** — `0` `1` `2` `3` `4` `5` `6` `C` `B` (see Finding 219).

**Revolving plan MMP types (partial)** — Using a Fixed Table · As a Fixed Amount · (Percent of
Balance and Fixed Term seen in batch 14).

**Ledger movement directions** — cycling: long term → short term · deferment: short term → long term.
Both carry principal + interest + insurance + finance fees.

**Reference prefixes** — `AP` (additional revolving payment) · `D*` (deleted order, batch 3) ·
`LET_` (repossession export, batch 11) · `MM_DD_YYYY_REPAIR` (Metro 2, batch 11).

---

## G. Sequencing rules (additions)

1. Deferment nets against any payment or credit already applied to the deferred payment due.
2. Bulk transfer validates per plan, so a mixed row partially succeeds.
3. Bulk transfer may target closed plans; interactive transfer may not (batch 8 eligibility rules).
4. GL batching: deferment interactive = one batch per session; deferment import = one batch per row.
5. Payoff and rebate are computed per selected date, never stored.
6. Late fees must be **unpaid** to be forgivable.
7. The most recent cycle period of the payment history profile is never editable.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **Auto-pay for installment contracts.** `Exclude Contract from Auto Pay`, `Auto-Pay Override
  Contract` (batch 7), `Auto Pay` on the tender screen (batch 6) and `Global Auto-Pay` (batch 5) all
  point at an automatic payment subsystem that **no article has described**. Where the mandate lives,
  when it runs, and what it does on failure are all unknown. **Material gap.**
- **`Chargeback Waived Interest`** — appears here and as a control setting (`Charge Back Waived
  Interest on MMP Balances, Days Overdue`, batch 14) and neither is explained. Waived interest is
  evidently retained and recoverable; the rule is undocumented.
- **`Credit Reversal`** and **`Total $ Keyed-off`** on Adjust Payment Terms — named, undescribed.
- **`Master Plan to`** on Plan Deferment — the third sighting of "master plan" and still no definition.
- **Rebate calculation method** — `Rebate Calculation` is a control setting (batch 14) with no
  documented values; the payoff screen shows rebates without saying how they are derived. Given
  Rule-of-78s is in play, this is regulatorily significant.
- **What `Close Current Plan` does to remaining transactions** on a partial transfer.

**3. Inferences (not quotable, kept out of section B)**
- Auto-pay is probably tied to the payment agreements subsystem (batch 11) or to a stored card
  mandate; nothing links them.
- The `0` = "cycle processing was not run" overload strongly suggests the payment history profile is
  written *by* cycling, one code per cycle period; not stated.
- `Chargeback Waived Interest` on transfer probably recovers promotional interest forgiven under the
  old plan when the balance leaves it; not stated.

---

## I. Unknown unknowns (additions)

- **Auto-pay** on installment contracts (and its exclusion flag).
- **Retroactive promotional re-terming** as of original invoice date on balance transfer.
- **Per-transaction promotion clocks** within one revolving plan.
- **Waived interest as a recoverable amount.**
- **Transfers into closed plans** via import but not interactively.
- **Per-cycle-period payment history codes** maintained per customer and hand-editable.
- **`Report Data Imported Errors and Warnings`** as a shared import-error reporting surface.
- **`Schedule a Process`** with per-process `Enter Process Preferences`.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Plan Balance Transfer | Moving balances (or selected transactions) onto another revolving plan, re-termed |
| Chargeback Waived Interest | Recovering interest previously waived under a promotion |
| Change Details | Editing transaction-level detail without changing plan balances |
| Interest Waived $ | Per-transaction record of interest forgiven |
| Promotion Expires / No Payments Until | Per-transaction promotional clocks |
| Add Grace Days / Extend Months | Contract term adjustments |
| Exclude Contract from Auto Pay | Flag removing a contract from automatic payment collection |
| Payment History Profile | Per-cycle-period delinquency code history reported to Metro 2 |
| AP prefix | Reference prefix for an additional revolving payment |
