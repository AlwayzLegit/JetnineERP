# Run 01 — Accounting — Batch 8: Revolving Receivables (open-end in-house credit)

11 articles. The second consumer-credit subsystem. Contrast with batch 7 throughout: installment
is closed-end and computed once; revolving is open-end and recomputed every cycle.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 72 | **Revolving Receivables Overview** *(Overviews → Setup)* | /articles/15202297025172 | EXTRACTED |
| 73 | Adjust Revolving Plans | /articles/15202280000916 | EXTRACTED |
| 74 | Adjust Balance | /articles/15202279412884 | EXTRACTED |
| 75 | Update MMP | /articles/15202311804308 | EXTRACTED |
| 76 | Add New MMP | /articles/15202311541012 | EXTRACTED |
| 77 | Update Disputes | /articles/15202279657876 | EXTRACTED |
| 78 | Revolving Payment Estimator | /articles/15202297026068 | EXTRACTED |
| 79 | Revolving Plan Restriction Results | /articles/15202311804180 | EXTRACTED |
| 80 | Revolving Prepayment | /articles/15202309632788 | EXTRACTED — thin |
| 81 | Revolving Credit Write-Off Export and Import | /articles/15202297024148 | EXTRACTED |
| 82 | APR Values | /articles/15202277352212 | EXTRACTED — thin |

Newly discovered, queued: `Revolving Receivables Control Settings`, `Revolving Payment Plan Settings`
(+ Restrictions tab), `Insurance Underwriter Settings`, `Revolving Worksheet (Full)`,
`Revolving Worksheet (Short)`, `View All Revolving Plan Activity for a Customer`,
`Enter a Shopping Cart`, `Report Error Messages`, `View a Customer's Historical Purchases`,
`Enter Dispute Comments`.

---

## B. Wiring findings

### FINDING 112 — Revolving is open-end and the payment is recomputed at every cycle
Trigger:    Completing an order financed with a revolving plan
Invariant:  "A Revolving Receivable is considered an 'open-ended' receivable, since the total amount
            to be paid is **not** determined at the time of the purchase." The principal goes to
            long-term receivables; the **Standard Monthly Payment (SMP)** is calculated by plan type.
Cycle:      "During cycling, the SMP amount is moved from 'long term' receivables … to open item
            receivables". "When cycled each month, the system determines the amount of interest to be
            charged" and "Insurance, if applicable, is also calculated during cycling."
            "With some revolving plans, **the SMP changes each month** depending on the principal and
            interest amounts."
Composition: SMP = interest + insurance + principal
Evidence:   Revolving Receivables Overview, /articles/15202297025172
Maps to:    NEW — mirrors batch 7, Finding 99 (same two-ledger structure, different math)

### FINDING 113 — Interest basis is a per-plan choice between two methods
Trigger:    Cycling
Config:     **`Calculate Interest On`** in `Revolving Receivables Payment Plans` —
            **Monthly Balance** at time of cycling, or **Average Daily Balance** at time of cycling
Evidence:   Revolving Receivables Overview, /articles/15202297025172
Maps to:    NEW — a `W-06x`-class single-definition value

> Average Daily Balance requires retaining daily balance history for the cycle. That is a data
> requirement, not just a formula choice, and it must exist before the first cycle runs.
> Note also the article calls the settings file `Revolving Receivables Payment Plans` here and
> `Revolving Payment Plan Settings` two paragraphs later — see section H.

### FINDING 114 — Two different add-on modules gate the two credit subsystems
Trigger:    Enabling consumer credit
Config:     Installment (batch 7) requires the **Advanced Receivables** add-on module;
            revolving requires the **Extended Receivables** add-on module — both in
            `General System Control Settings`
Conflict:   batch 7's article says Advanced Receivables "is used to activate **both** Installment
            Receivables and Revolving Receivables"; this article says Extended Receivables must be active
Evidence:   Revolving Receivables Overview, /articles/15202297025172 · Installment Receivables Overview, /articles/15202279027988
Maps to:    NEW — **the two overviews disagree**; recorded in section H

### FINDING 115 — MMP adjustment moves money between the two ledgers in a fixed direction
Trigger:    `Update MMP`
Invariant:  "**Positive adjustments result in the reduction of the long term balance and increase of
            the short term balance. Negative adjustments result in the increase of the long term
            balance and reduction of the short term balance.**" · "The MMP cannot be below zero."
Components: Principal · Finance Charge · **Finance Charge Fee** · Insurance · Late Fees ·
            **Paper Statement Fee**
Evidence:   Update MMP, /articles/15202311804308
Maps to:    NEW — the clearest statement of the two-ledger invariant anywhere in the run

> This is the rule to build on: long-term + short-term is conserved across an MMP adjustment.
> `Add New MMP` is the same operation for a *new* payment row and carries the same components
> minus late fees.

### FINDING 116 — Long-term balance decreases are auto-allocated oldest-to-newest across orders
Trigger:    `Adjust Balance` with a negative amount
Consumers:  "the order balances in the plan are **automatically reduced in oldest to newest order**"
Positive:   "a new transaction is added to the plan"
Evidence:   Adjust Balance, /articles/15202279412884
Maps to:    NEW — second documented allocation algorithm (cf. batch 5, Finding 69)

### FINDING 117 — Increasing a balance can re-derive the term/MMP from a table
Trigger:    `Adjust Balance` increase on **Per Sales Order** or **Per Sales Order Using a Fixed Term** plans
Producer:   **MMP Amount Table** — "The term months and corresponding MMP amounts display based on
            the adjustment amount you entered"
Evidence:   Adjust Balance, /articles/15202279412884
Maps to:    NEW — names two plan types and implies a table-driven MMP derivation

### FINDING 118 — GL maintenance on revolving adjustments cites a *Payables* permission
Trigger:    `Adjust Balance` → Actions → `Maintain G/L Postings`
Gate:       "Security restrictions affect your access to this information. See **`General Ledger User
            Permissions`** and **`Create a User/Group Actions - Payables Security`**."
Evidence:   Adjust Balance, /articles/15202279412884
Maps to:    **W-036 — CONTRADICTED (sixth sighting)**, **W-050 — CONTRADICTED**

> A revolving-receivables GL edit gated by a *Payables* security file. Either the docs are wrong or
> the permission model genuinely crosses modules. Both are bad news for a clean permission design.

### FINDING 119 — Dispute suspends late fees and finance charges
Trigger:    `Update Disputes` on a plan or an individual revolving-financed completed order
Invariant:  "Once a plan or completed order is placed in dispute, **assessment of late fees and
            finance charges is suspended.**"
Payload:    Dispute Order · **Suspend Interest On** · (Dispute) $ · Reason · **Remove On** · **Resolved On**
Downstream: a disputed plan is **ineligible for balance transfer** (Finding 120) and, per batch 3,
            disputed amounts surface in `View a Customer's Revolving Disputes`
Evidence:   Update Disputes, /articles/15202279657876
Maps to:    NEW — a suspension state that changes the cycle's arithmetic

### FINDING 120 — Plan balance transfer has five hard eligibility rules
Trigger:    `Plan Balance Transfer` from `Adjust Revolving Plans`
Rules (all must hold):
  1. "No portion of the plan balance can be **in dispute**."
  2. "Plan must have a short term or long term balance."
  3. "Plan cannot be a **master plan**."
  4. "Plan cannot have a **pending balance**."
  5. "Plan cannot have a **payment agreement**."
Scope:      customer + plan → that plan only; customer only → all eligible plans;
            bulk across customers via `Import Revolving Plan Balance Transfer`
Evidence:   Adjust Revolving Plans, /articles/15202280000916
Maps to:    NEW — introduces **master plan** and confirms **payment agreement** as a blocking state

### FINDING 121 — Plan deferment has four preconditions including a per-plan setting
Trigger:    `Plan Deferment`
Preconditions: a customer is selected · **the customer has not been charged off** · the customer has
            a revolving payment due · "The customer's plan is set to deferment via the
            **`Allow Deferment`** setting in `Revolving Payment Plan Settings`"
Evidence:   Adjust Revolving Plans, /articles/15202280000916
Maps to:    NEW

### FINDING 122 — Plan eligibility at order entry is a rule engine with named failure messages
Trigger:    Entering an ineligible revolving plan at the Financing field in `Enter a Sales Order`
Producer:   `Revolving Plan Restriction Results` — "A message is displayed for **each** restriction
            rule that fails"
Config:     Restrictions tab in `Revolving Payment Plan Settings`
Documented rules (verbatim examples):
  - minimum deposit not applied to the order
  - minimum credit score restriction exists, customer has **no** credit score
  - customer's credit score is **less than** the minimum required
  - maximum credit score restriction exists, customer has no credit score
  - customer's credit score is **greater than** the maximum required
  - customer is greater than ___ days past due
  - the plan cannot be used in store ___
Evidence:   Revolving Plan Restriction Results, /articles/15202311804180
Maps to:    NEW — **the most explicit business-rule engine found in the whole run**

> Note the *maximum* credit score restriction — plans deliberately withheld from high-score
> customers. And note that a missing score fails both the minimum and maximum rules. This is a
> real, reproducible rule set and should be lifted more or less verbatim into our plan model.

### FINDING 123 — The payment estimator's plan list is location-scoped by entry point
Trigger:    `Revolving Payment Estimator` (up to 3 plan comparison)
Location resolution: from the menu → **login location**; from `Enter a Sales Order` → **the order's
            store location**; from `Enter a Shopping Cart` → login location;
            from `View All Revolving Plan Activity for a Customer` → login location
Payload:    Order Amount · Deposit Amount · Finance Amount · Promotional (Interest Rate,
            Expiration Date — hidden if no promo) · Full Plan · Monthly Payment · Term Months ·
            **Fixed MMP Table**
Invariant:  "The MMP is an overall amount that includes the customer's **current and pending balances**."
Disclaimer: "This screen is used for estimations only! These are estimated calculations and may not
            accurately reflect revolving plan payments."
Evidence:   Revolving Payment Estimator, /articles/15202297026068
Maps to:    **W-052 — CONTRADICTED again** (location context resolves differently per entry point)

> Four entry points, three different location semantics, and STORIS itself warns the numbers may be
> wrong. A quoted payment that does not match the booked payment is a customer-facing defect;
> our estimator should call the same calculation the booking path calls.

### FINDING 124 — Revolving write-off is an export/edit/import cycle with a documented eligibility filter
Trigger:    `Revolving Credit Write-Off Export and Import`
Eligibility (verbatim):
  - only plans **without a current due amount**
  - customers with **legal codes** are excluded
  - customers **charged off** or in **non-accrual** status are excluded
  - plans **without any available statement history** are excluded
Filters:    State · Store Location on the screen; **`Amount Threshold`** and **`Inactivity Days`**
            in `Sales Tax Settings`
Constraint: "Additional plans cannot be added to the spreadsheet and the amount to be written off
            cannot be changed." Rows may only be **removed**.
Hazard:     "The customer's other revolving plan balances are **not considered** … If one plan has a
            balance due and another has a credit balance, **the credit balance plan is still eligible
            to be written off.**"
GL:         `Revolving Credit Write-Offs` account
Recovery:   the current export can be cleared and re-created
Errors:     `Report Error Messages`
Evidence:   Revolving Credit Write-Off Export and Import, /articles/15202297024148
Maps to:    NEW — and see section H for a settings-location contradiction

> The per-plan (not per-customer) eligibility is a genuine hazard: a customer in good standing
> overall can have a credit-balance plan written off. Worth an explicit customer-level guard in ours.

### FINDING 125 — Same-as-cash contracts carry two APRs with a switchover date
Trigger:    An installment contract with differing APR values
Payload:    **Same as Cash · APR Before Cash Date · APR After Cash Date**
Evidence:   APR Values, /articles/15202277352212
Maps to:    NEW — completes batch 7's `Same as Cash` and `Months No Interest` fields

### FINDING 126 — Prepayment is only offered when nothing is currently due
Trigger:    `Enter a Customer Payment` → Actions → Pre-Payment/Revolving Prepayment
Precondition: "at least one active revolving plan with a balance, **and no MMP's currently due**"
Evidence:   Revolving Prepayment, /articles/15202309632788
Maps to:    NEW (consistent with batch 5, Finding 68)

### FINDING 127 — The revolving worksheet has two versions selected by a control setting
Trigger:    Financing an order with a revolving plan
Config:     `Access Worksheet within Sales Order Entry` in `Revolving Receivables Control Settings` —
            checked → **Full** worksheet; unchecked → **Short** worksheet
Entry points: sales order entry, **debit exchanges**, and **service orders**
Evidence:   Revolving Receivables Overview, /articles/15202297025172
Maps to:    NEW — confirms service orders and exchanges can carry in-house financing

---

## C. Screen and field inventory

**Adjust Revolving Plans** — Customer · Name · Co-signer · Co-applicant · Comments ·
Customer Store/Home/Work/Cell Telephone · Due Day · Active Plans · Balance · Credit Limit $ ·
Receivables $ · Potential Receivables $ · Available Credit $ · Plan · Activated · **In Dispute** ·
Current Due $ · Last Charge $ · Last Payment $ · Balance · Current $ · **Highest $** ·
Actions (Change Customer Address, Add/Edit/View Attachments) ·
Global Actions (Adjust Balance, Update MMP, Add New MMP, Change Details, Update Disputes,
Plan Balance Transfer, Plan Deferment).

**Adjust Balance** — Customer · Plan · Activated · Balance · Current Due · Balance Details:
Reference · Adjustment · Date · MMP · Reason · MMP Amount Table (Term, MMP) ·
Actions (Maintain G/L Postings, Save).

**Update MMP** — Customer · Plan · Activated · Balance · Current Due $ · MMP Details: Reference ·
Due On · Reason · Principal $ · Finance Charge $ · Finance Charge Fee $ · Insurance $ · Late Fees $ ·
Paper Statement Fee $ · Grid · Actions · Save.

**Add New MMP** — Customer · Plan · Activated · Balance $ · Current Due $ · New MMP Details:
Principal $ · Finance Charge $ · Finance Charge Fee $ · Insurance $ · Paper Statement Fee $ ·
Due Date · Reason · Actions · Save.

**Update Disputes** — Customer · Plan · Activated · Balance $ · Current Due $ · Dispute Order ·
Suspend Interest On · (Dispute) $ · Reason · Remove On · Resolved On ·
Actions (Enter Dispute Comments, View a Customer's Account Balance, View a Customer's Historical Purchases).

**Revolving Payment Estimator** — Option 1/2/3 · Order Amount · Deposit Amount · Finance Amount ·
Promotional (Interest Rate, Expiration Date) · Full Plan · Monthly Payment · Term Months · Fixed MMP Table.

**Revolving Credit Write-Off Export and Import** — Account · Current Write-Off · Action · State ·
Store Location · File · Path.

**APR Values** — Same as Cash · APR Before Cash Date · APR After Cash Date.

**Revolving Prepayment** — Transaction · $.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Extended Receivables add-on module | General System Control Settings | Activates Revolving Receivables (**conflicts with batch 7 — see H**) |
| Calculate Interest On | Revolving (Receivables) Payment Plan Settings | Monthly Balance vs Average Daily Balance |
| Access Worksheet within Sales Order Entry | Revolving Receivables Control Settings | Full vs Short revolving worksheet |
| waived interest charged back to delinquent accounts | Revolving Receivables Control Settings | Named in the overview, not described |
| Allow Deferment | Revolving Payment Plan Settings | Enables Plan Deferment for that plan |
| Restrictions tab | Revolving Payment Plan Settings | The plan eligibility rule set (Finding 122) |
| Amount Threshold / Inactivity Days | **Sales Tax Settings** | Write-off export eligibility filters |
| Insurance Underwriter Settings | own file | Revolving insurance underwriters |
| Extended Receivables Insurance Code Settings | own file | Revolving insurance plans (shared with installment) |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| (unnamed) | General Ledger User Permissions **and** Create a User/Group Actions - **Payables** Security | `Maintain G/L Postings` from `Adjust Balance` — a revolving screen |

---

## F. State machines and enumerations

**Plan types named** — Per Sales Order · Per Sales Order Using a Fixed Term · (Full Plan) ·
**master plan** (a plan class that blocks balance transfer).

**MMP components** — Principal · Finance Charge · Finance Charge Fee · Insurance · Late Fees ·
Paper Statement Fee.

**Dispute lifecycle** — placed in dispute (interest and late fees suspended) → `Remove On` /
`Resolved On` dates → resolved.

**Interest basis** — Monthly Balance · Average Daily Balance.

**Write-off exclusions** — current due amount present · legal code · charged off · non-accrual ·
no statement history.

**Balance ledgers** — long term (total owed) ⇄ short term / open item (due now), conserved across
MMP adjustments.

---

## G. Sequencing rules (additions)

1. Order completed with revolving plan → principal to long-term → cycling moves SMP to open item.
2. Interest and insurance are computed **at cycling**, not at sale.
3. Plan balance transfer requires no dispute, a balance, not a master plan, no pending balance,
   no payment agreement.
4. Plan deferment requires an un-charged-off customer with a payment due on a deferment-enabled plan.
5. Prepayment requires an active plan with a balance and **no MMP currently due**.
6. Write-off: export → edit (remove rows only) → import; or clear the export and start again.
7. A disputed plan or order accrues neither late fees nor finance charges until resolved.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **Which add-on module gates what.** `Installment Receivables Overview` says **Advanced
  Receivables** activates *both* subsystems; `Revolving Receivables Overview` says **Extended
  Receivables** is required for revolving. These cannot both be right. **Must resolve before we
  scope which credit features LA Mattress is licensed for.**
- **Where the revolving write-off GL account lives.** This article says the
  `Revolving Credit Write-Offs` field is on the **"Revolving page" of `General Ledger Assigned
  Account Settings`**. Batch 1's dissection of that screen lists eleven tabs and **there is no
  Revolving tab** — `Revolving Credit Write-Offs` appears on the **Accounts Receivable** tab.
  One of the two articles is wrong.
- **`Amount Threshold` and `Inactivity Days` in `Sales Tax Settings`.** Write-off filters in the
  sales-tax file. Either a documentation error or a genuinely surprising placement — the same file
  also holds installment fee/late-charge/interest settings by jurisdiction (batch 7), so it may be
  a general "state-level rules" file with a misleading name.
- **Settings-file naming drift** — `Revolving Receivables Payment Plans` vs
  `Revolving Payment Plan Settings` in the same article.
- **SMP vs MMP.** The overview uses **Standard Monthly Payment (SMP)**; every screen uses
  **Minimum Monthly Payment (MMP)**. Same thing or not is never stated. Given batch 5 also used MMP,
  this is a real terminology hazard.
- **`Master plan`** — named only as a transfer exclusion; never defined.
- **`Pending balance`** on a plan — named as an exclusion; never defined.
- **`Highest $`** on the plan grid — presumably high credit; not stated.
- **`Change Details`** — a global action described only as adjusting "order details … without
  impacting the long or short term balance". No article read yet.
- **`Paper Statement Fee`** appears in MMP composition; where it is configured is unstated.
- **Waived interest charged back to delinquent accounts** — named in the overview, undescribed.
- **Promotional financing** — the estimator shows a promotional rate and expiration; the mechanism
  that applies and expires it is undocumented here.

**3. Inferences (not quotable, kept out of section B)**
- SMP and MMP are almost certainly the same value under two names, since the overview's SMP
  description matches the screens' MMP components. Not stated.
- `Sales Tax Settings` is probably a general per-jurisdiction rules file rather than a tax file;
  its name is legacy. Not stated.
- Because interest is computed at cycling, a mid-cycle payoff quote for revolving is necessarily
  a different computation from installment's `Payoff As-of Date`. No revolving payoff article found.

---

## I. Unknown unknowns (additions)

- **Average Daily Balance** interest, implying retained daily balance history.
- **Master plans** and **plan balance transfer** (consolidating several plans into one).
- **Payment agreements** as a state that blocks transfer.
- **Legal codes** on customers as a write-off exclusion.
- **Paper statement fees** as an MMP component.
- **Finance charge fee** as distinct from finance charge.
- **Promotional financing** with its own rate and expiration date.
- **Maximum credit score restrictions** on plans.
- **Per-store plan availability.**
- **Customer attachments** (Add/Edit/View Attachments on the revolving screen).
- **Debit exchanges** and **service orders** as financeable transactions.
- **`Enter a Shopping Cart`** as a distinct order-entry path.
- **Non-accrual** reappearing as a write-off exclusion (first seen batch 3).

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Revolving receivable | Open-end in-house credit; payment recomputed each cycle |
| SMP — Standard Monthly Payment | The overview's name for the cycled payment amount |
| MMP — Minimum Monthly Payment | The screens' name for the same figure |
| Long term / short term balance | Total owed vs amount currently due; conserved across MMP adjustments |
| Calculate Interest On | Per-plan choice of Monthly Balance or Average Daily Balance |
| Master plan | Plan class ineligible for balance transfer; otherwise undefined |
| Plan Balance Transfer | Moving one or many plan balances onto a new plan |
| Plan Deferment | Extending revolving payments due, gated per plan |
| In Dispute | State suspending late fees and finance charges |
| Finance Charge Fee | Charge distinct from the finance charge itself |
| Paper Statement Fee | Per-cycle fee component of the MMP |
| Legal code | Customer marker excluding them from automated write-off |
| MMP Amount Table | Term-to-payment table used when increasing a plan balance |
| Fixed MMP Table | Estimator's table of fixed payment options |
| APR Before/After Cash Date | The two APRs on a same-as-cash contract |
