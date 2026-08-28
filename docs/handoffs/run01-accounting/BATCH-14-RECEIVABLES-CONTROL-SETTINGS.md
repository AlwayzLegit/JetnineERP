# Run 01 — Accounting — Batch 14: The Receivables Control-Settings Cluster

10 articles, all in System Administration but reached by link from Accounting screens. These are
the files that decide the behaviour every earlier batch could only observe. **This batch resolves
several open questions from batches 7–13** and adds a large, directly usable configuration catalog.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 133 | Account Statement Cycling Control Settings | /articles/15186452330644 | EXTRACTED |
| 134 | Accounts Receivable Control Settings | /articles/15186452327572 | EXTRACTED |
| 135 | Revolving Receivables Control Settings | /articles/15186453252116 | EXTRACTED |
| 136 | Revolving Payment Plan Settings | /articles/15242663218836 | EXTRACTED |
| 137 | Installment Receivables Control Settings | /articles/15186452792724 | EXTRACTED |
| 138 | Installment Payment Plan Settings | /articles/15242612331412 | EXTRACTED |
| 139 | Credit Application Control Settings | /articles/15186501753876 | EXTRACTED |
| 140 | Alert Code Settings | /articles/15242629418772 | EXTRACTED |
| 141 | Revolving/Installment Fees | /articles/17304693314324 | EXTRACTED |
| 142 | Collection Letter Settings | — | LOGGED — surfaced, not yet read |

Newly discovered, queued: `Warehouse/Store Location Settings` (Revolving Payment Estimator
Defaults, due days by location), `Collection Letter Settings`, `Default Terms Table`,
`Customer Rewards Control Settings`, `Order Source Settings`, `Demographics Control Settings`,
`Shift4 Extended Receivables MOTO Authorization`, `eSTORIS Revolving Plans as Tender`.

---

## B. Wiring findings

### FINDING 180 — Cycling is per-customer, driven by due days and a cycle schedule
Trigger:    `Cycle Schedule` + per-customer due day
Config:     `Auto Assign Due Date` · `Default Due Day` · `Due Days 2, 3 and 4` · `Cycle Schedule`
Invariants: "when entering a due day, the **maximum number the system accepts is 28**" ·
            "**Due days specified by location override due days you specify globally**" ·
            "If you edit any of the following six fields … the changes you make **do not affect
            existing customers**. The changes affect only customers created after the changes"
Also:       `Number of Grace Days` · `Cycle Inactive Accounts` · `Number of Cycle Phantoms`
            (Accounts Receivable Control Settings)
Evidence:   Account Statement Cycling Control Settings, /articles/15186452330644
Maps to:    **resolves the batch-13 open question**

> Cycling is **staggered**: up to four due-day buckets, capped at day 28, assignable automatically,
> overridable per location, and frozen at customer creation. So the nightly cycle processes the
> customers whose due day comes up, not the whole book. Our engine must be per-customer-cycle, and
> our migration must carry each customer's due day — it cannot be re-derived from a global rule.

### FINDING 181 — Statement suppression is a four-way rule set, not one switch
Config:     `Generate Zero Balance Statements` · `Suppress Zero/Credit Balance Statements With
            Activity` · `Hold Credit Balance Statements` · `Suppress Revolving Plans with Zero
            Balances and No Activity from Statements`
Presentation: `Statement Sort` · `Print Purchase Detail` · `Suppress Dollar Signs on Revolving
            Statements` · `Remit-to Flag` + four remit address lines
Evidence:   Account Statement Cycling Control Settings, /articles/15186452330644
Maps to:    refines batch 13, Finding 172

### FINDING 182 — Statement overdue messaging is a five-tier ladder resolved to the oldest bucket
Config (Messages tab): `Global Message` · `Credit Balance` · `Current Balance` · `Overdue Message` ·
            `Overdue +30 days` · `+60` · `+90` · `+120`
Rule:       "If a customer account has **multiple balances overdue, the system prints the oldest
            balance message.**"
Limit:      "4 lines of 50 characters each, for a total of 200 characters … however, if you print to
            a destination other than the Forms Designer … **only the first 50 characters will display**"
Evidence:   Account Statement Cycling Control Settings, /articles/15186452330644
Maps to:    confirms batch 10's aging buckets from a second source

### FINDING 183 — XML statement export is capped per file and can run inside End-of-Day
Config:     `Create XML for Revolving Statements and Export To` + `Maximum Number of Customer
            Statements Per XML File`; same pair for Installment; `Create XML for Open Item
            Statements and Export To`; and **`Create XML Statements During End of Day`**
Evidence:   Account Statement Cycling Control Settings, /articles/15186452330644
Maps to:    refines batch 13, Finding 174

### FINDING 184 — Minimum deposit requirements are per order-line type and drive D2 credit hold
Config (AR Control Settings → Deposits): minimum deposit percentage for **Whole Order · Take With
            Lines · Customer Pickup Lines · Delivery Lines · Direct Shipment Lines**, plus
            `Include Estimated Tax and Fees` · `Customers with Credit Exempt` · `Service Orders Exempt`
Rules:      "if one or more line items does not meet its minimum deposit requirement, the order is
            placed on **D2 credit hold** and you can save the order. The exception … **take-with
            orders not meeting the minimum deposit requirement cannot be completed.**" ·
            "You **cannot specify a minimum deposit percent for delivery/install charges**, although
            they appear on the Required Deposits by Line screen. The whole order minimum **includes**
            delivery/install charges."
Also:       these values double as the **deposit hold-back on partial completions** when
            `Deposit Hold Back %` is unset — "This prevents the back-order from being placed on D2 credit hold."
            `Re-evaluate D2 Credit Hold When Order is Saved` · `Maximum Balance` / `Over Maximum Balance`
Evidence:   Accounts Receivable Control Settings, /articles/15186452327572
Maps to:    **W-020 — CONFIRMED and extended**, **W-033 — extended** (deposit hold-back on partial completion)

> This is a proper readiness rule with a line-type dimension and one hard stop (take-with). It also
> ties deposits to fulfilment: partial completion holds back deposit in proportion to the minimums.
> That mechanism has to exist in ours or split deliveries will mis-recognise revenue.

### FINDING 185 — Service charges on overdue AR are configured, not derived
Config:     `Service Charge Days` · `Service Charge Rate` · `Minimum Service Charge` ·
            `Credit Aging Method` · `Default Terms Code` · `Default Credit Limit` ·
            `Daily Maximum Cash Refund Per Customer` · `Auto Adjust Amount`
Evidence:   Accounts Receivable Control Settings, /articles/15186452327572
Maps to:    completes the `Service Charges` GL account from batch 1

### FINDING 186 — Charge-off has an ordering setting and a non-accrual relationship
Config:     `Automatic Charge-Off` · **`Charge-Off before Non-Accrual`** ·
            `Tax Adjustments for Charge-offs` · `Allow Overpayments on Charged Off Accounts`
Audit:      `Open Item Auditing` · `Audit All Customer Activity` · `Secured Audit Retention Months` ·
            `Number of Ledger Entries` · `Number of Months History`
Evidence:   Accounts Receivable Control Settings, /articles/15186452327572
Maps to:    completes batch 3's bad-debt classification (Charged Off / Non-Accrual / Reinstated)

### FINDING 187 — Gift cards are a prefix-validated, swipe-capable instrument with five prefixes
Config:     `Gift Processing` · `Purchase Gift` · `Add Funds to Existing` · `Refund Gift Balance` ·
            `Zero Balance Retention Days` · `Card Swipe Required` · `Validate Manual Entry` ·
            `Gift Registry Default Type` · `In-Store Use Only Default Type` ·
            **`Card Number Prefix 1–5`** · `Next Registry Certificate Number` · `Next Certificate Number`
Rules:      prefixes are "active only if **no response exists at the Next Certificate Number** prompt";
            a card number must begin with one of the prefixes "Otherwise, the system **rejects** the
            entry"; imported cards beginning with alpha characters have those characters dropped on
            manual entry or lookup
Evidence:   Accounts Receivable Control Settings, /articles/15186452327572
Maps to:    **W-055 — CONFIRMED** (two numbering schemes: auto-sequence or prefix-validated external)

### FINDING 188 — Credit reporting exclusions and format live in AR control settings
Config (Credit Reporting tab): `NFS Export File` · **`Exclude Account if Balance Is:`** ·
            **`Metro 2 Format`** · `Retention Days`
Evidence:   Accounts Receivable Control Settings, /articles/15186452327572
Maps to:    completes batch 11, Finding 153

### FINDING 189 — Revolving plans carry their own Earned/Unearned Interest GL accounts
Config (Revolving Payment Plan Settings → General → GL Accounts):
            **`Receivables` · `Earned Interest` · `Unearned Interest` · `Other`**
Evidence:   Revolving Payment Plan Settings, /articles/15242663218836
Maps to:    **W-036 — CONTRADICTED (seventh account-resolution source)**, and **partly answers
            batch 12's missing insurance/interest GL question**

> Interest is split **earned vs unearned** at the plan level. That is the accrual mechanism the
> `General Ledger Assigned Account Settings` screen (batch 1) never showed, because it lives on the
> plan, not in the account map. Insurance still has no identified GL account — see section H.

### FINDING 190 — Revolving plan MMP derivation has four alternative bases
Config:     `Calculate MMP` · `Fixed Term Months` · `Minimum Term Months` / `Maximum Term Months`
            (which build the **Fixed MMP Table** grid) · `Lowest MMP allowed` ·
            `Percent of the Balance` · `Percent Rate` · `Use Prime Interest Rate` ·
            `Calculate Interest on`
System-wide: `Prime Interest Rate %` in `Revolving Receivables Control Settings`
Override:   the minimum MMP "can be overridden … [with] the `Revolving Terms and Conditions -
            Override Lowest MMP Allowed Restriction` setting in `Create a User/Group Actions -
            Receivables Security`"
Note:       "The MMP amounts that are displayed in the grid are defined as **including the principal,
            interest and insurance amounts**."
Evidence:   Revolving Payment Plan Settings, /articles/15242663218836
Maps to:    **W-064-class value defined**

### FINDING 191 — Promotional plans and plan-to-plan transfer are configured together
Config (Advanced tab):
  - *Plan Transfer:* `Allow Other Plans to Transfer to this Plan` · `Transfer Balance to Plan` ·
    `Days Late` · **`Transfer Balance to Plan When Promotion Expires`** ·
    `Post MMPs for Balances Transferred from this Plan`
  - *Promotional Interest:* `Percentage` · `Expires` · `Valid Days` · **`Expires on the Cycle Date`**
  - *No Payments:* `Until` / `Number of Days`
Invariant:  "If you change or add a promotion … **only newly activated customer plans are affected**.
            New orders entered for customer plans that were active prior to your edits are not affected."
Override:   "If this plan is set to allow transfers from other plans, **the transfer feature in cycle
            processing overrides the restrictions** on this tab."
Evidence:   Revolving Payment Plan Settings, /articles/15242663218836
Maps to:    **explains batch 8's `master plan`** and the automatic side of `Plan Balance Transfer`

> Promotional expiry can automatically transfer a balance to a different plan **during cycling**,
> bypassing the eligibility restrictions. That is a significant automatic state change we had no
> visibility of, and it means a customer's plan can change without any user action.

### FINDING 192 — Plan restrictions are override-able per restriction, with a security prompt each time
Trigger:    Entering a restricted plan at order entry
Behaviour:  "When a restriction is encountered … a **security override prompt appears for each
            restriction**. If you have permission via … `Revolving Payment Plan Restrictions` … or
            **obtain a security override from another user**, security is granted"
Restriction dimensions: Credit Score (Minimum/Maximum) · Deposit (Minimum Amount / Percentage) ·
            Classification · `Exclude from General Use` · Plan Dates (Valid From/Through) ·
            Location (`Restrict Use to`, Franchise, Store, State) ·
            `Minimum Financed Amount` · `Allow Multiple Pending Plans` ·
            `eSTORIS Discount Restrictions Apply` · **`Required Percentage Paid before Add-on Allowed`** ·
            `Past Due Days`
Evidence:   Revolving Payment Plan Settings, /articles/15242663218836
Maps to:    **W-051 — CONFIRMED**, completes batch 8, Finding 122

### FINDING 193 — Installment contracts support balloon payments via a fixed-payment term
Config:     `Fixed Monthly Payment Amount` + `Fixed Monthly Payment Term` — available **only when
            `No Payments for ___ Months` is blank**
Consequences (stated): "The Principal column of the Contract Amortization Schedule **may yield a
            negative principal amount** for the first few monthly installments" and later
            installments "may display **inflated payment amounts** … In the example … of a 12 month
            contract and an 11 month fixed payment term, the **last installment is a balloon payment**."
Evidence:   Installment Payment Plan Settings, /articles/15242612331412
Maps to:    NEW — extends batch 7's amortization model

> Negative principal in early periods means the payment does not cover accrued interest —
> negative amortisation, followed by a balloon. Whatever we build must reproduce this exactly if
> any such contracts exist, and should probably refuse to originate new ones.

### FINDING 194 — Same-as-cash, no-interest and no-payment promotions are three separate installment settings
Config:     `Contracts Paid Within Months Qualify for Same as Cash` ·
            `Revoke Same as Cash After Late Fees` · `No Interest for Months` ·
            `No Payments for Months` · `First Payment Due on` / `First Payment Due Days After
            Contract Activation` · `Requires a Deposit of %, $`
Insurance:  `INSURANCE PREMIUM - Include Interest` · `INSURANCE PREMIUM - Use ONLY remaining term
            after "No Interest for Months" to calculate interest`
Fees:       `FEES - Late Charge` · **`FEES - Non-Filing Charge`**
Rewrite:    `REWRITE CONTRACTS - Merge active contracts into one` ·
            `REWRITE CONTRACTS - Prompt User during Worksheet entry prior to merging contracts`
Invariant:  "If you edit the settings for an existing installment plan, the changes **do not affect
            customer contracts created before your edits**."
Evidence:   Installment Payment Plan Settings, /articles/15242612331412
Maps to:    completes batch 7's `Same as Cash`, `Months No Interest`, and **`non-filing fees`**

### FINDING 195 — Installment rebate and cancellation windows are date-bounded rights
Config:     `Rebate Calculation` · **`Cancel Contract Within Days of Activation to Receive Full
            Interest and Insurance Rebate`** · **`Merchandise Return Within Days of Activation to
            Cancel Contract`** · `Automatic Credit Threshold` · `Fixed Activation Date Future Days` ·
            `Maximum Days to Back-Date Payoffs`
Deferment:  `Deferment Fee is` · `Defer Payments Consecutively` ·
            `Defer Payments Within a Rolling 12 Month Period`
Due date:   `Due Date Is` · `Due Date may be Pushed Days Into the Future` · `Payment Grace Days` ·
            plus three Advanced toggles: allow changes if deferred / with past due amounts / multiple changes
Evidence:   Installment Receivables Control Settings, /articles/15186452792724
Maps to:    **answers batch 7's rebate and cancellation gaps**

### FINDING 196 — The installment module is gated by Extended Receivables, not Advanced Receivables
Statement:  "You must have the **Extended Receivables** Add-On module active in `General System
            Control Settings` … in order to use Installment Receivables."
Evidence:   Installment Receivables Control Settings, /articles/15186452792724
Maps to:    **largely resolves batch 8, Finding 114**

> Two of three sources now say **Extended Receivables**. Batch 7's `Installment Receivables
> Overview` claim that *Advanced Receivables* activates both is the outlier and is probably stale
> wording. Treat Extended Receivables as the gate; verify on the live system.

### FINDING 197 — Five credit bureaus are supported with one designated primary
Config:     `is the Primary` plus **Experian · Equifax · Equifax Canada · InterConnect · Trans Union**
Application rules: `Allow for Co-Signer` · `Allow for Co-Applicant` ·
            **`Credit Applications Expire after Days`** · `For Days Application is Valid for Web
            Submissions` · `Default from Expired Application` · **`Minimum Age for Auto Pull of Credit Report`**
Credit requests: `Need to exist prior to entering an order` · `Linked Sales Orders Put On Hold for
            Open Request` · **`Review again, if Initially Declined`** · `After Days Decline Requests
            on Hold` · `For Days Retain Historical Requests` · `For Days Alert if a Prior Application
            is Submitted` · **`Older Than Minutes Alert the User`**
Credit reports: `Text Format Report` · **`For Days Report is Valid`** ·
            **`After Months with Zero Balance Require New Report`**
Other:      `Decline Letter Previous Conditional Approvals` · `Approval Letter Previous Conditional
            Approvals Entry` · `Prompt for Requested Finance Type` ·
            `Use Applicant's Delivery Address on Credit Application`
Note:       "Once a credit application is approved, finance providers can return **up to five
            promotional payment plan codes** and descriptions for review."
Evidence:   Credit Application Control Settings, /articles/15186501753876
Maps to:    **answers batch 9's staleness-threshold gap**

### FINDING 198 — Application field requiredness is a 3×4 matrix with a force-re-entry flag
Structure:  three participant tabs (Primary Applicant, Co-Applicant, Co-Signer) × four field tabs
            (Personal, Employment, Reference, Miscellaneous)
Entry types: **Optional · Mandatory · Not Needed**
Force Re-Entry: "require users to **manually enter data** when updating existing credit applications.
            If you leave [it] blank, the system supplies a default response, if available"
Worked example given: a mandatory, force-re-entry `Income` field on a valid application with a closed
            review item forces the operator to key the new income rather than defaulting it
Evidence:   Credit Application Control Settings, /articles/15186501753876
Maps to:    completes batch 9, Finding 131

### FINDING 199 — C7 and C8 alert thresholds are fully specified
C7 Payment History Hold: `Payment History Code` · `Number of Occurrences` · `Number of Months`
C8 payment-verification: `Total Payment Amount` · `Days to Check` ·
            **`Only Check on Extended Receivable Financed Orders`** · `Include Business Accounts` ·
            `Payment Class Access`
Evidence:   Alert Code Settings, /articles/15242629418772
Maps to:    **completes batch 9, Finding 128** for the two codes that had no settings named

### FINDING 200 — Three revolving/installment fee types, each with its own GL account
Config:     **Finance Charge Fee** (Rate + GL Account) · **Paper Statement Fee** (Amount + GL Account) ·
            **Convenience Fee** (Calculation Method + Percent/Dollar Amount + GL Account)
Scope:      "For revolving plans, finance charge fees, paper statement fees, and convenience fees can
            all be configured. For installment plans, **only convenience fees** can be configured at
            this time."
Evidence:   Revolving/Installment Fees, /articles/17304693314324
Maps to:    **W-036 — CONTRADICTED (eighth source)**; completes batch 8's MMP fee components

---

## C. Settings inventory

*(This batch is itself a settings inventory; see section D. Screen structures below.)*

**Account Statement Cycling Control Settings** — tabs General, Messages, Advanced.
**Accounts Receivable Control Settings** — tabs General, Gift Cards and Certificates,
Credit Reporting, Deposits.
**Revolving Receivables Control Settings** — sections General, Insurance, Statement, Paper Statement
Fee, Miscellaneous.
**Revolving Payment Plan Settings** — tabs General, Advanced, Restrictions, eSTORIS.
**Installment Receivables Control Settings** — tabs General, Advanced.
**Installment Payment Plan Settings** — tabs General, Advanced.
**Credit Application Control Settings** — tab General + 3 participants × 4 field tabs.
**Alert Code Settings** — per alert code (C7, C8).
**Revolving/Installment Fees** — Finance Charge Fee, Paper Statement Fee, Convenience Fee.

---

## D. Control settings catalog

The field lists in section B are the catalog for this batch; every named field belongs to the file
named in its finding. Additional fields not called out above:

*Revolving Receivables Control Settings* — `Round Payment Up to Next Highest Dollar` · `Plan Auditing` ·
`Prompt User to Add New Order Balance to Plan` · `Update Customer Credit Date` ·
`Charge Back Waived Interest on MMP Balances, Days Overdue` · **`State Regulations Based Upon`** ·
`Master Plan` · `Revolving Credit Hold Amount` · `Dispute Retention Months` · `Sort Reports By` ·
`Sort Customer By` · Insurance block (`Insurance Required`, `Prompt For Insurance If Not Added To
Revolving Worksheet`, `Single Prompt for Insurance Change`, `Default Insurance From Other Plans`,
`Insurance File Format`, `Do Not Default Insurance After Days`, **`Apply Insurance By`**) ·
Payment Notification Parameters (`Percentage of Balance to Calculate MMP`, `… (Ins)`,
`APR to Calculate Interest Rate`, `Minimum MMP Amount`) · Revolving Payment Estimator Defaults
(Option 1/2/3, `Allow Changes`) — overridable in `Warehouse/Store Location Settings`.

*Accounts Receivable Control Settings, General* — `Report Sort By` · `Credit Hold Queue Refresh` ·
`Exchange Payment Type` · **`Allow Duplicate Social Security Numbers`** ·
`Automatic Display of Legal Settings` · **`Days to Limit Backdating during NSF / Misapply`** ·
`Verify Customer Driver License`.

*Accounts Receivable Control Settings, Deposits* — `Next Deposit Number` · `Service to Sales Deposit
Move` · `Deposit Hold Back %` · `Deposit Overpayment Allowed` · `Deposit Hold Back` ·
`Immediate Deposit Refund Types`.

*Revolving Payment Plan Settings, General* — `Signature` · `Print Credit Agreement` ·
`Charge Late Fees` · `Subject to Paper Statement Fee` · `Exempt from Insurance Charges` ·
`Activate in Sales Order` · `Payment Agreement` · `Can be used to Purchase Gift Certificates/Cards` ·
`Allow Deferment` · `Customer Credit Review`.

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Revolving Terms and Conditions - Override Lowest MMP Allowed Restriction | Create a User/Group Actions - Receivables Security | Setting an MMP below the plan minimum |
| Revolving Payment Plan Restrictions | Create a User/Group Actions - Receivables Security | Overriding each plan restriction at order entry (or another user's override) |

---

## F. State machines and enumerations

**Credit bureaus** — Experian · Equifax · Equifax Canada · InterConnect · Trans Union (one primary).

**Application field entry types** — Optional · Mandatory · Not Needed (+ Force Re-Entry flag).

**Order line types for minimum deposit** — Whole Order · Take With · Customer Pickup · Delivery ·
Direct Shipment. (Delivery/install charges cannot carry their own minimum but count in the whole-order minimum.)

**Overdue message tiers** — Current · +30 · +60 · +90 · +120 (oldest wins).

**Due day buckets** — Default Due Day + Due Days 2, 3, 4; maximum day 28; location overrides global.

**Revolving plan GL accounts** — Receivables · Earned Interest · Unearned Interest · Other.

**Fee types** — Finance Charge Fee (rate) · Paper Statement Fee (amount) · Convenience Fee
(method + percent/dollar). Installment supports convenience fee only.

---

## G. Sequencing rules (additions)

1. Cycle schedule + per-customer due day determines when a customer cycles; due day is fixed at
   customer creation and not retro-updated by settings changes.
2. Plan and control-settings edits are **not retroactive** — installment contracts, revolving
   promotions and customer due days all keep the values in force when they were created.
3. Promotional expiry can transfer a balance to another plan **during cycle processing**, overriding
   that plan's restrictions.
4. Minimum deposit failures place the order on D2 and (except take-with) still allow saving.
5. `Re-evaluate D2 Credit Hold When Order is Saved` re-runs the deposit test on every save.
6. Charge-off ordering relative to non-accrual is a setting, not a fixed sequence.

---

## H. Open questions and gaps

**1. Gated or unreachable** — several fields are noted as "accessible by STORIS personnel only"
(both `Revolving Receivables Control Settings` and `Account Statement Cycling Control Settings` say
so). We can read the documentation but the operator may not be able to change or even see them.

**2. Documented but ambiguous**
- **Insurance still has no GL account.** Revolving plans carry Receivables / Earned Interest /
  Unearned Interest / Other; the fee settings carry three fee accounts; `General Ledger Assigned
  Account Settings` has none for insurance. Either insurance rides in `Other`, or it posts through
  the underwriter as a liability we have not found. **Still the biggest accounting hole in the
  consumer-credit area.**
- **`Number of Cycle Phantoms`** — a cycling concept with no explanation anywhere.
- **`State Regulations Based Upon`** — clearly the switch that makes revolving behave per state
  (customer state vs store state), and it is a single unexplained field. Regulatory significance.
- **`Apply Insurance By`**, **`Charge Back Waived Interest on MMP Balances, Days Overdue`**,
  **`Master Plan`** (as a control-settings field), **`Automatic Credit Threshold`**,
  **`Rebate Calculation`**, **`Due Date Is`**, **`Default Terms Table`**, **`Calculate MMP`**,
  **`Payment History Code`**, **`Payment Class Access`** — all named, none described.
- **`Allow Duplicate Social Security Numbers`** — a setting that permits duplicate SSNs across
  customers. Worth knowing whether it is on before any customer-merge work.
- **Collection Letter Settings** — surfaced as a related article; not yet read. It presumably holds
  the automatic collector-assignment rules that batch 10 could not find.
- **Whether `Cycle Schedule` is a calendar or a code** — the field is named, its values are not given.

**3. Inferences (not quotable, kept out of section B)**
- `Number of Cycle Phantoms` is likely a parallelism setting for the cycle job (phantom = background
  process in Pick/UniVerse-style systems, which the `IR.ACTIVE` / `BANK.REC` file naming also
  suggests). Not stated.
- `Master Plan` appearing in both the control settings and as a transfer exclusion (batch 8) suggests
  one designated plan acts as a consolidation target. Not stated.
- Insurance most likely posts to `Other` on the revolving plan; unverified.

---

## I. Unknown unknowns (additions)

- **Negative amortisation and balloon payments** on installment contracts.
- **Promotional plan expiry auto-transferring balances** during cycling.
- **Five credit bureaus** including Equifax Canada and InterConnect.
- **Franchise** as a restriction dimension distinct from store.
- **eSTORIS revolving as a checkout tender**, with its own plan name, display order and availability.
- **Gift card prefixes and swipe validation**, and gift registry certificate numbering.
- **`Required Percentage Paid before Add-on Allowed`** — a re-purchase gate on revolving plans.
- **Non-filing charge** as a configurable installment fee.
- **`Charge Back Waived Interest`** — waived interest recoverable on delinquency.
- **Prime-rate-linked revolving plans** (`Use Prime Interest Rate`, `Prime Interest Rate %`).
- **Daily maximum cash refund per customer** as an anti-fraud control.
- **Business accounts** as a customer class (C8 setting).
- **Shift4 MOTO authorization** for extended receivables.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Cycle Schedule | The configuration determining when customers cycle |
| Due Day | Per-customer statement/payment day, 1–28, up to four buckets, location-overridable |
| Cycle Phantom | Undocumented cycling concurrency concept |
| Earned / Unearned Interest | Plan-level GL accounts splitting accrued from deferred interest |
| Fixed MMP Table | Term-to-payment grid built from a plan's min/max term months |
| Fixed Monthly Payment Amount/Term | Installment settings producing negative amortisation and a balloon |
| Non-Filing Charge | Installment fee (the "non-filing fee" seen in contract balances) |
| Convenience Fee | Card-payment surcharge; the only fee configurable on installment |
| Force Re-Entry | Credit-application flag requiring manual re-keying rather than defaulting |
| State Regulations Based Upon | Undescribed switch selecting the jurisdiction basis for revolving rules |
| Master Plan | Designated consolidation plan; excluded from balance transfer |
| Deposit Hold Back | Portion of deposit retained on partial completion |
