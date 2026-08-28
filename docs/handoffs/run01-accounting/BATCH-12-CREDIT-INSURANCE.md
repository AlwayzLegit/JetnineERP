# Run 01 — Accounting — Batch 12: Credit Insurance

10 articles. Credit life / disability insurance sold alongside in-house financing — a whole
regulated product line attached to both installment and revolving plans, with three named
underwriter file formats.

**Note on the three file-layout articles:** these are third-party underwriter record specifications
(fixed-length field tables). I have recorded their *shape, transaction model and constraints* here
rather than reproducing the full field tables — the articles themselves remain the authoritative
source and are linked in section A. If we end up integrating with any of these underwriters, pull
the field table directly from the article rather than from this pack.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 113 | Add Insurance | /articles/15202279413652 | EXTRACTED |
| 114 | Contract Insurance Codes | /articles/15202278691988 | EXTRACTED — thin |
| 115 | Update Revolving Insurance Plans | /articles/15202312377108 | EXTRACTED |
| 116 | Calculate Average Monthly Insurance Premium | /articles/15202278679828 | EXTRACTED |
| 117 | Create Insurance Enrollment File | /articles/15202312123284 | EXTRACTED |
| 118 | Create Insurance Premium File | /articles/15202280008724 | EXTRACTED |
| 119 | Print Insurance Forms | /articles/15202297024532 | EXTRACTED |
| 120 | Central States Indemnity Co (CSI) Insurance File Layout | /articles/46698242097940 | EXTRACTED — format spec |
| 121 | Life Of The South (LOTS) Insurance File Layouts | /articles/27276845605268 | EXTRACTED — format spec |
| 122 | Premier Insurance File Layout | /articles/27272172924820 | LOGGED — format spec, same family |

Newly discovered, queued: `Extended Receivables Insurance Code Settings` (Request Signature field),
`Insurance Underwriter Settings`, `Clear Data/Field Indicator` in `General System Control Settings`,
`Report Update Revolving Insurance Plans`, `Customer Activity Log`,
`View All Revolving Plan Activity for a Customer`, `Insurance File Format` in
`Revolving Receivables Control Settings`.

---

## B. Wiring findings

### FINDING 162 — Insurance is added to *all* active plans at once, and only if none already has it
Trigger:    `Add Insurance` from `View All Revolving Plan Activity for a Customer`
Precondition: "available if **NONE** of the customer's plans (including pending) already have
            insurance" and the receivables security setting
            `View All Revolving Activity - Add Insurance` is enabled
Effect:     "This action adds insurance to **all** of the customer's active plans (not pending) at one time."
Estimate:   "An Estimated New MMP is only recalculated if the customer has revolving plans that are
            **Fixed Term** plans. Otherwise, the new MMP is the same as the Total MMP. **The
            customer's actual MMP can only be determined when the account cycles.**"
Documents:  Save prompts to print an insurance letter; if Signature Capture is active the signature
            and archiving ceremony runs **after each printing**, and "is only available when printing
            the insurance letter using the forms designer"
Evidence:   Add Insurance, /articles/15202279413652
Maps to:    **W-054 — CONFIRMED**, NEW otherwise

> The all-or-nothing rule is a strong constraint: a customer's revolving plans share one insurance
> state. And the estimate disclaimer restates batch 8's core truth — for non-fixed-term revolving,
> nothing is knowable until cycling.

### FINDING 163 — Insurance codes can be bulk-loaded and bulk-cleared by spreadsheet, with a clear sentinel
Trigger:    `Update Revolving Insurance Plans`
Input:      tab-delimited `.txt` or `.csv` from a template on the STORIS support Downloads page
Columns:    **Customer ID** (mandatory, must exist) · **Plan ID** (required *unless*
            `Default Insurance from Other Plans` is set in `Revolving Receivables Control Settings`,
            in which case supplying one is an **error** and the code is applied to all the customer's
            plans) · **Insurance Code** (mandatory)
Two modes:  a valid code from `Extended Receivables Insurance Code Settings` **adds** the code —
            "Insurance charges are **not assessed on past balances**";
            the **`Clear Data/Field Indicator`** from `General System Control Settings` **removes**
            the code — "Existing insurance charges are **not forgiven**."
Validation: same rules as `Enter a Customer's Revolving Terms & Conditions`, e.g. the code must be
            valid for the customer's store
Charge-off: "insurance codes can be updated when a customer is inactive, **no updates occur when a
            customer is in charge off status**"
Audit:      "Audit comments are written to the **Customer Activity Log**, although **the master
            revolving plan is not updated**."
Errors:     `Report Update Revolving Insurance Plans` runs automatically; documented failures include
            non-existent customer, code invalid for store, customer charged off, no revolving plans,
            non-existent insurance code
Evidence:   Update Revolving Insurance Plans, /articles/15202312377108
Maps to:    **W-053 — CONTRADICTED**

> Two things stand out. First, the add/remove asymmetry is deliberate and consumer-facing: adding
> never back-charges, removing never refunds. Second — *"the master revolving plan is not updated"*
> alongside "audit comments are written". A bulk process that changes insurance but leaves the
> master plan record untouched is exactly the kind of divergence that makes a migration reconcile
> badly. **Flag for verification on the live system.**

### FINDING 164 — Installment insurance premium averaging is Rule-of-78s based
Trigger:    `Calculate Average Monthly Insurance Premium`, reached from `Merge/Refinance Contracts`
Rule:       "The calculation is based on the **Rule of 78's**."
Output:     Term (months) · Monthly Average · Premium; "The cost of insurance is available in the
            Forms Designer for installment contract printing."
Evidence:   Calculate Average Monthly Insurance Premium, /articles/15202278679828
Maps to:    NEW — ties to batch 7, Finding 100

> Confirms Rule-of-78s is not merely an interest option; it is also the insurance premium basis on
> installment. Two regulated calculations on the same method.

### FINDING 165 — Enrollment files are incremental with a reported-date stamp and a recreate mode
Trigger:    `Create Insurance Enrollment File`
Contents:   newly created revolving plans with insurance, or existing plans to which insurance was added
Normal run: selects active plans for the insurance code "that have **not already been reported**";
            "The plans update with the **date on which they were reported** to the insurance company."
Recreate:   selects plans "that were **originally reported** within the specified date range"
Format:     "fixed-length ASCII file"; if `Insurance File Format` in `Revolving Receivables Control
            Settings` is **PREM**, the output is the Premier Insurance layout
Evidence:   Create Insurance Enrollment File, /articles/15202312123284
Maps to:    NEW — same incremental+reported-date pattern as Metro 2 (batch 11)

### FINDING 166 — Premium files are cycle-scoped
Trigger:    `Create Insurance Premium File`
Contents:   "information pertaining to insurance premiums that have been **charged during a specified
            cycle period**"
Parameters: Insurance Code · **Cycle Date**
Format:     Premier layout when `Insurance File Format` = PREM
Evidence:   Create Insurance Premium File, /articles/15202280008724
Maps to:    NEW

> Two outbound files with different grains: **enrollment** is per plan per lifetime event,
> **premium** is per cycle. Both keyed by insurance code, both format-switched by one control setting.

### FINDING 167 — Insurance form signature capture requires three separate switches
Trigger:    `Print Insurance Forms`
Requirements (all): the **Insurance Code program** enabled in `Configure Document Signature Capture` ·
            signature capture hardware available · **`Request Signature`** enabled in
            `Extended Receivables Insurance Code Settings` **for that specific insurance code**
Payload:    Customer · Revolving Plan · Contract · Insurance · Print Type
Global action: `Assign Payment Terminal` → `EMV Terminal Selection`
Evidence:   Print Insurance Forms, /articles/15202297024532
Maps to:    **W-054 — CONFIRMED**

> Note the screen accepts **both** a Revolving Plan and a Contract — insurance spans both credit
> subsystems from one form-printing routine.

### FINDING 168 — Underwriter files are fixed-length, transaction-coded, with enrollment and cancel records
Common shape across the three documented underwriters:
  - **Fixed-length text**, no delimiters or quotation marks, one carriage return per record
  - A leading **Transaction Code** distinguishing record types — CSI uses `01` = Issue,
    `02` = Cancel; LOTS uses `01` for enrollment
  - **Enrollment records** carry: account/customer id, primary insured name and date of birth,
    secondary insured (when applicable), address, phone, insurance effective date, and an
    **Enrollment Identifier** unique per enrollment type (CSI examples: `P` paper application,
    `C` card carrier)
  - **Cancel records** carry: account id, primary insured name, cancellation effective date, and a
    **Cancel Reason Code** (CSI examples: `DL` delinquent cancel, `CL` closed account), filler to
    record length
  - CSI record length is 227; LOTS carries insurer and **producer (store) id** plus the
    **state for the store the customer is assigned to**
Constraint: "Enrollment Records should only include customers who are **eligible** for the insurance"
Evidence:   Central States Indemnity Co (CSI) Insurance File Layout, /articles/46698242097940 ·
            Life Of The South (LOTS) Insurance File Layouts, /articles/27276845605268
Maps to:    NEW

> Three underwriters, three layouts, one control setting choosing between them. If LA Mattress
> carries credit insurance at all, the underwriter identity is a hard integration dependency —
> and note LOTS keys on **store state and producer id**, so store-to-underwriter mapping matters.

### FINDING 169 — Installment insurance plans are viewable but the codes live elsewhere
Trigger:    `Review Contract Details` → Search at the Insurance field
Producer:   `Contract Insurance Codes` — "view the insurance plans associated with an installment plan"
Evidence:   Contract Insurance Codes, /articles/15202278691988
Maps to:    NEW — thin, but confirms installment contracts carry multiple insurance plans

---

## C. Screen and field inventory

**Add Insurance** — Total MMP · Insurance · Estimated New MMP $.

**Contract Insurance Codes** — grid only.

**Update Revolving Insurance Plans** — Filename. (Spreadsheet columns: Customer ID, Plan ID, Insurance Code.)

**Calculate Average Monthly Insurance Premium** — Term __ Months · Monthly Average · Premium.

**Create Insurance Enrollment File** — Insurance Code · Recreate File · Start Date · End Date ·
Send Output to · Export Path · Actions (Output Settings **inactive**).

**Create Insurance Premium File** — Insurance Code · Cycle Date · Send Output to · Export Path ·
Actions (Output Settings **inactive**).

**Print Insurance Forms** — Customer · Revolving Plan · Contract · Insurance · Print Type ·
global action Assign Payment Terminal.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Insurance File Format | Revolving Receivables Control Settings | Selects the underwriter layout (e.g. `PREM` = Premier) for both enrollment and premium files |
| Default Insurance from Other Plans | Revolving Receivables Control Settings | Applies one insurance code to all a customer's plans; makes Plan ID an error in the import |
| Request Signature | Extended Receivables Insurance Code Settings (per code) | Requires signature capture on that code's forms |
| Insurance Code program | Configure Document Signature Capture | Enables the signature ceremony for insurance forms |
| Clear Data/Field Indicator | General System Control Settings | The sentinel used to clear a field in imports |
| Insurance Underwriter Settings | own file | Underwriter master |
| Extended Receivables Insurance Code Settings | own file | Insurance plan/code master, shared by installment and revolving |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| View All Revolving Activity - Add Insurance | receivables security setting | The `Add Insurance` button |

---

## F. State machines and enumerations

**Insurance transaction types (underwriter files)** — `01` Issue/Enrollment · `02` Cancel.

**CSI enrollment identifiers (examples)** — `P` Paper Application · `C` Card Carrier.

**CSI cancel reason codes (examples)** — `DL` Delinquent Cancel · `CL` Closed Account.

**Insurance elected at finance tender** (batch 5) — None · Single · Joint.

**Outbound file grains** — enrollment (per plan, once, with reported date) ·
premium (per cycle period).

**Insurance add/remove asymmetry** — adding does not assess past balances; removing does not
forgive existing charges.

---

## G. Sequencing rules (additions)

1. Insurance may be added to revolving only when **no** plan (including pending) already has it.
2. Actual MMP after adding insurance is known only at the next cycle.
3. Enrollment file: normal run reports unreported plans and stamps them; recreate re-emits by
   original report date range.
4. Premium file is generated per cycle date.
5. Insurance code imports do not apply to charged-off customers.
6. Signature on insurance forms requires the program, the hardware and the per-code flag.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **"the master revolving plan is not updated"** in the bulk insurance import. Either the master
  plan legitimately does not carry the insurance code (it lives on the MMP rows), or this is a known
  gap. **Verify on the live system** — it determines where our model stores insurance election.
- **Insurance premium accounting.** Premiums appear as an MMP component (batch 8) and an installment
  allocation (batch 7), and premium *files* are sent to underwriters — but no article read so far
  states the GL treatment: is the premium a liability owed to the underwriter, or revenue with a
  cost? The `General Ledger Assigned Account Settings` tabs (batch 1) contain no insurance account.
  **Material gap.**
- **Insurance cancellation on payoff, charge-off or repossession** — the underwriter files support
  cancel records, but no STORIS routine read so far *generates* them. What triggers a cancel record
  is undocumented.
- **`Print Type`** on Print Insurance Forms — no options given.
- **Refunds of unearned premium** on early payoff — batch 7 says Straight Line early payoff means
  the customer "pays only the remaining principal", implying unearned insurance is dropped; the
  mechanism and any underwriter notification are unstated.
- **Which underwriter formats are current** — three layouts, two added recently (2024–2025 article
  ids), and `Insurance File Format` documents only the `PREM` value.

**3. Inferences (not quotable, kept out of section B)**
- Cancel records are probably produced by the same enrollment routine when a plan's insurance is
  cleared or the account closes, since no other routine exists; not stated.
- Because LOTS carries store state and producer id, underwriter eligibility is probably
  state-regulated per store; the articles only imply it.
- The absence of an insurance GL account suggests premiums ride inside the finance-charge or
  interest accounts; unverified and important.

---

## I. Unknown unknowns (additions)

- **Credit insurance as a product line** attached to both credit subsystems.
- **Three underwriter integrations** (Central States Indemnity, Life Of The South, Premier) with
  distinct fixed-length formats.
- **Enrollment identifiers** distinguishing how the customer enrolled (paper vs card carrier).
- **Cancel reason codes** as an underwriter-facing enumeration.
- **Producer (store) id** and store state as underwriter file keys.
- **Insurance letters** as signature-captured, archived customer documents.
- **Rule-of-78s premium averaging** as a distinct calculator.
- **A spreadsheet template distributed via the STORIS support Downloads page** as part of a
  supported workflow.
- **`Clear Data/Field Indicator`** — a system-wide sentinel for clearing fields in imports
  (relevant well beyond insurance).

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Insurance code | The insurance plan identifier, valid per store, shared by installment and revolving |
| Enrollment file | Fixed-length file notifying the underwriter of newly insured plans |
| Premium file | Per-cycle file of premiums charged |
| Enrollment Identifier | Underwriter code for how the customer enrolled (e.g. paper, card carrier) |
| Cancel Reason Code | Underwriter code for why coverage ended (e.g. delinquent, closed account) |
| Producer | The store, as identified to the underwriter |
| Recreate File | Enrollment mode re-emitting previously reported plans by original report date |
| Clear Data/Field Indicator | System-wide sentinel meaning "clear this field" in an import |
| Request Signature | Per-insurance-code flag requiring signature capture on printed forms |
