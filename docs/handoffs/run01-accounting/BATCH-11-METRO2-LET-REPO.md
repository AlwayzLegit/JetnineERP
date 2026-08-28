# Run 01 — Accounting — Batch 11: Payment Agreements, Metro 2 Credit Reporting, LET & Repossession

10 articles. Two regulated subsystems (credit bureau reporting and repossession entitlement) plus
third-party payment remittance. All `NEW` against our contract list, and all carrying legal
constraints that shape the data model rather than merely the workflow.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 103 | Payment Agreements Overview | /articles/15202280008852 | EXTRACTED |
| 104 | Payment Agreement Entry | /articles/15202279660948 | EXTRACTED — thin |
| 105 | Generation of Payment File & Payment Agreement Report | /articles/15202312130196 | EXTRACTED |
| 106 | Download Metro 2 Customer Credit History | /articles/15202311962260 | EXTRACTED — thin |
| 107 | Report Metro 2 Customer Credit History | /articles/15202279810324 | EXTRACTED |
| 108 | Repair Metro 2 Customer Credit History | /articles/15202279812756 | EXTRACTED |
| 109 | Metro 2 Customer Credit Recovery | /articles/15202279814420 | EXTRACTED |
| 110 | Request Legally Entitled To (LET) Documents | /articles/15202278504596 | EXTRACTED |
| 111 | Process Repossessed Items | /articles/15202297407892 | EXTRACTED |
| 112 | Original Document Select (Repossessions) | /articles/15202277335956 | EXTRACTED — thin |

Newly discovered, queued: `Receivable Payment Source Settings` / `Payment Agreement Source Settings`,
`Miscellaneous Payment Settings`, `Customer Legal Settings`, `Maintain NFS Root Paths`,
`Group Settings` (Legally Entitled to Repossess flag), `Customer Joint record`,
`View All Receivable Activity for a Customer`, `Report Aged Trial Balance`.

---

## B. Wiring findings

### FINDING 151 — Payment agreements change MMP generation, splitting the month into 1, 2 or 4 payments
Trigger:    Cycling a revolving plan that has a payment agreement
Invariant:  plans with agreements "cycle in the same way as regular revolving plans, **with the
            exception of MMP generation**." 1, 2 or 4 MMPs are generated per the source's
            `Payments Per Month`; the month's total MMP is divided by that number, and "The breakdown
            of principal, interest, and insurance is determined for each scheduled payment, along
            with the associated due date."
Setup chain (all four must align):
  1. `Allow Payment Agreements` in `Revolving Receivables Control Settings` (off by default)
  2. the remitting organisation set up in `Receivable Payment Source Settings` with its payments
     per month, its Miscellaneous Payment type, and its delivery schedule (on demand / EOD / both)
  3. that Miscellaneous Payment type must have `Use For Payment Agreement Import` checked in
     `Miscellaneous Payment Settings`
  4. the revolving plan must be flagged to allow payment agreements in `Revolving Payment Plan Settings`
Sources named: automatic payroll deductions, Social Security, the Veterans Administration, insurance companies
Statements: agreement data is in the revolving statement XML; Source, ID and Payments per Month are
            available as enhanced-laser data elements
Evidence:   Payment Agreements Overview, /articles/15202280008852
Maps to:    NEW — and it **modifies batch 8's cycling model**

> Batch 8 established that cycling moves one SMP from long-term to open item. With a payment
> agreement it moves *the same total* as **two or four separate dated obligations**, each with its
> own principal/interest/insurance split. Our cycle engine must emit N payment rows, not one.

### FINDING 152 — The agreement lives on the plan as three fields and drives an outbound/inbound file pair
Payload:    **Source · ID · # Payments Per Month** (editable for plans without an agreement;
            source and ID editable for plans that have one)
Cycle:      `Generation of Payment File & Payment Agreement Report` produces (a) the **report sent to
            the source** telling them what to remit and (b) the **payment file** later posted through
            `Import Customer Payments`
Constraint: "there are two extraction programs available in the `Payment Agreement Source Settings`.
            If you are set up to use the extraction program that **does not import the payments to a
            specific plan**, this process is not available."
Evidence:   Payment Agreement Entry, /articles/15202279660948 · Generation of Payment File & Payment Agreement Report, /articles/15202312130196
Maps to:    NEW — a two-way integration with an external payer

> Note the two extraction programs: one plan-specific, one not. That is a fork in the data model
> (payment→plan vs payment→customer) hidden inside a settings choice.

### FINDING 153 — Metro 2 reporting is incremental, US-only, revolving-only, with four exclusion rules
Trigger:    `Report Metro 2 Customer Credit History`
Scope:      "The report includes data created **since the last time you ran this report**." If no new
            data exists the routine cannot be accessed.
Includes only: **United States customers**, **Revolving Receivables information**, plus compliance
            condition codes and date of first delinquency "based on the requirements of the Fair
            Credit Reporting Act and/or Fair Credit Billing Act"
Excludes:   customers whose charge-off date precedes the reporting period · customers with
            `Do Not Report to Credit Bureau` checked in `Customer Legal Settings` · plus three
            AR-Control-Settings exclusions: paid out for N cycles, credit balance for N cycles, or
            zero cycle balance + zero last cycle balance + account younger than N months
Evidence:   Report Metro 2 Customer Credit History, /articles/15202279810324
Maps to:    NEW

> **Installment contracts are not reported here** — only revolving. Yet batch 7 found that
> cancelling an *installment* contract sets a Metro 2 account status, and `Metro 2 Customer Credit
> Recovery` is reachable from both the Revolving and the Installment menus. Either installment is
> reported by another routine or the account-status write is orphaned. Flagged in section H.

### FINDING 154 — Compliance condition code reporting is date-triple logic
Trigger:    Running the Metro 2 report
Rule:       the program examines the **compliance condition code**, its **updated date**, and its
            **reported date**. "If the compliance condition code reported date is greater than or
            equal to the compliance condition code updated date, or no compliance condition code
            exists … a blank appears in the report". Otherwise the code is reported, and the
            **Compliance Condition Code Reported Date** is stamped with the current system date.
Evidence:   Report Metro 2 Customer Credit History, /articles/15202279810324
Maps to:    NEW — a precise, reproducible algorithm

### FINDING 155 — Date of first delinquency is sticky until the account becomes current
Trigger:    Customer becomes delinquent
Invariant:  "the system does **not** remove a delinquent date until the customer becomes current.
            Once current, if the customer becomes delinquent again, the system assigns a **new** date
            of first delinquency."
Purpose:    consumer reporting agencies use it to age off delinquency under the FCRA
Evidence:   Report Metro 2 Customer Credit History, /articles/15202279810324
Maps to:    NEW — a legally-load-bearing derived date

> This is exactly the kind of value `W-06x` is about: one definition, one owner, no recomputation.
> Getting it wrong has consumer-law consequences, not just reconciliation consequences.

### FINDING 156 — Bureau corrections are constrained to the current file, one repair per period
Trigger:    `Repair Metro 2 Customer Credit History`
Scope:      "available only for the **last** credit history file created" — "The Credit Reporting
            Resource Guide specifies you must make changes prior to the next file submission.
            Because of this restriction, STORIS **prevents changes to historical data files**."
Output:     creates `MM_DD_YYYY_REPAIR`; "only **one** 'repair' file can exist for a reporting
            period", so later changes overwrite it, including re-changes to the same records
Repairable fields: Metro 2 ID · Payment History Profile · Compliance Condition Code · Account Status ·
            Special Comment · Consumer Information Indicator · Date of First Delinquency
Audit:      "The program also updates the **Customer Comments file** when [you] change a field via this routine."
Evidence:   Repair Metro 2 Customer Credit History, /articles/15202279812756
Maps to:    **W-053 — partially CONFIRMED** (comment-level audit on a regulated correction)

> Immutability of submitted history is enforced deliberately. Good design, worth copying —
> but note the repair file itself is *mutable and overwritten*, so the intermediate states of a
> correction are not retained. Only the final repair survives.

### FINDING 157 — Metro 2 has an explicit crash-recovery path with lock-skip semantics
Trigger:    Fatal error that "physically stopped the Metro2 process"
Producer:   `Metro 2 Customer Credit Recovery` — copies saved recovery data back to the
            **CUSTOMER**, **IR.ACTIVE** and/or **IR.HISTORY** files
Semantics:  per-customer recovery flag set true on success; customers skipped **due to locking**
            leave the flag false; the process is re-runnable and "only the records that have not
            been previously updated are selected"
Messages:   full success, or "XX customer records were skipped due to locking and the recovery
            process needs to be rerun"
Security:   "**there is no special staff security used** when allowing access to this process" —
            menu access is the only control
Evidence:   Metro 2 Customer Credit Recovery, /articles/15202279814420
Maps to:    **W-050 — CONTRADICTED** (a regulated, data-mutating process with no permission at all)

> Two things worth carrying: (a) the idempotent, resumable, per-record-flagged recovery pattern is
> genuinely good and we should copy it; (b) protecting a credit-bureau data rewrite with nothing but
> menu placement is not. Note also the file names — `IR.ACTIVE` / `IR.HISTORY` — confirm installment
> receivables have active and history stores, matching batch 7's history→active transitions.

### FINDING 158 — LET documents are the legal precondition for repossession, and they expire on the cycle
Trigger:    `Request Legally Entitled To (LET) Documents`
Basis:      "For all sales of merchandise financed using a Revolving Receivables payment plan,
            STORIS tracks the sale and any subsequent applications of deposits, payments, and fees,
            thus maintaining the level of detail necessary to produce … LET documents."
Expiry:     each print "references the customer's **next cycle date**", records it as the LET
            expiration date, and "uses the date as the **flag allowing or disallowing the
            repossession return** to be activated for the customer"
Reprint:    if an expiration date exists a reprint prompt appears; printing refreshes the expiry
Retention:  "For customers beyond the number of months retention, the **End-of-Month** process purges
            all LET documents older than the customer's **last zero balance date**."
Gate:       `Repossession - Access Waived (LET) Items` in `Create a User/Group Actions - Receivables
            Security`; without it the *Items Purchased Since Last Zero Balance Date* section is omitted
Evidence:   Request Legally Entitled To (LET) Documents, /articles/15202278504596
Maps to:    **W-054 — CONFIRMED**, **W-020-like readiness gate for repossession** — NEW

### FINDING 159 — LET item selection is a documented algorithm over unpaid invoices
Rule:       the Legally-Entitled-To section lists **only items on invoices not yet paid in full**,
            ordered by invoice date then invoice #, and within an invoice by **retail price paid,
            least to most expensive**; items are "taken from the last piece on the order, until the
            **remaining revolving balance has been filled**"
Exclusions: items already returned by customer return or repossession; items in a product group whose
            **`Legally Entitled to Repossess`** box is unchecked in `Group Settings` (STORIS's example: flooring)
Companion section: *Items Purchased Since Last Zero Balance Date* lists all revolving purchase
            activity since that date, same ordering, **including delivery and installation charges**
Zero balance date: "the most recent date on which no open balance amounts existed for the customer",
            captured when the account is paid to zero **and when a new customer account is set up**
Document sections: Legally Entitled To Items · Retail Purchases since Last Zero Balance Date ·
            Repossession Notice · Waiver of Rights
Sources:    customer name, balance and co-applicant names come from the **Customer** and
            **Customer Joint** records
Evidence:   Request Legally Entitled To (LET) Documents, /articles/15202278504596
Maps to:    NEW — a third documented allocation algorithm (cf. batches 5 and 8)

> Per-item fields carried: Seq Nbr, Invoice Date, Invoice #, Product Number, Description, Brand,
> Piece Number, Sell Price, Price Paid. Note **Piece Number** — repossession operates at piece
> granularity, not SKU. That is a serial/unit-level requirement on our inventory model, and it
> aligns with `W-023` (allocation binds a specific unit).

### FINDING 160 — Repossession return is gated on a current LET and restricted to LET items
Trigger:    `Process Repossessed Items`
Invariant:  "only customers with a **current LET document** (that is, a LET document generated during
            the customer's current cycle period) are eligible for selection … and **only items that
            appear in a LET document** are eligible for return."
Availability: the routine "is available only if LET documents generated during the current cycle
            period exist for one or more customers"
Step 2:     `Original Document Select (Repossessions)` — items sold on the same line item are grouped
            on one grid line with the returned quantity in the **Selected** column
Accounts:   `Repossession Sales`, `Repossession Cost of Sales`, `Bad Debt Repossession` (batch 1)
Evidence:   Process Repossessed Items, /articles/15202297407892 · Original Document Select (Repossessions), /articles/15202277335956
Maps to:    **W-035 — adjacent** (a reversal that returns goods to inventory), NEW

### FINDING 161 — LET export writes a deterministic, overwriting XML filename
Format:     `LET_<customer account number>_<mmddyyyy>.XML`, written to the path from
            `Maintain NFS Root Paths`; "If a file with the same name already exists in the NFS
            shared folder, the program **overwrites** it."
Evidence:   Request Legally Entitled To (LET) Documents, /articles/15202278504596
Maps to:    **W-055 — CONTRADICTED for exported documents** (same-day reprints collide and overwrite)

---

## C. Screen and field inventory

**Payment Agreement Entry** — Source · ID · # Payments Per Month.

**Generation of Payment File & Payment Agreement Report** — Source · Begin Date · End Date ·
Payments per Month · Import Action · Send Output to · Export Path · Actions.

**Download Metro 2 Customer Credit History** — Import File · Name · Destination · Output To · Export Path.

**Report Metro 2 Customer Credit History** — Start Date · Ending Date.

**Repair Metro 2 Customer Credit History** — Credit History File Name · Customer Code (both
inactivate once a valid customer is chosen) · Metro 2 ID · Payment History Profile ·
Compliance Condition Code · Account Status · Special Comment · Consumer Information Indicator ·
Date of First Delinquency.

**Metro 2 Customer Credit Recovery** — Start Date · Ending Date.

**Request Legally Entitled To (LET) Documents** — Customer · LET Expiration · **LET Print Version** ·
Send Output to · Export Path · Actions.

**Process Repossessed Items** — Customer. (Delete inactive; Save → step 2.)

**Original Document Select (Repossessions)** — Customer · Product · Repossessed Quantity · Grid
(Selected column) · Actions.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Allow Payment Agreements | Revolving Receivables Control Settings | System-wide enable; **off by default** |
| payments per month (1/2/4) | Receivable Payment Source Settings | How many MMPs cycling generates |
| extraction program choice | Payment Agreement Source Settings | Whether imported payments target a specific plan |
| Use For Payment Agreement Import | Miscellaneous Payment Settings | Marks the payment type usable for agreement imports |
| allow payment agreements (per plan) | Revolving Payment Plan Settings | Plan eligibility for agreements |
| Do Not Report to Credit Bureau | Customer Legal Settings (via Advanced Customer Settings → Receivables → Legal Settings) | Excludes a customer from Metro 2 |
| paid-out cycles / credit-balance cycles / young-zero-balance months | Accounts Receivable Control Settings | Three Metro 2 exclusion filters |
| Legally Entitled to Repossess | Group Settings | Marks a product group as non-repossessable |
| months retention (LET) | (not named) | Drives End-of-Month LET purge |
| Maintain NFS Root Paths | own routine | Destination for exported XML |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Repossession - Access Waived (LET) Items | Create a User/Group Actions - Receivables Security | The *Items Purchased Since Last Zero Balance Date* section of the LET report |
| — *(none)* | — | `Metro 2 Customer Credit Recovery`: "there is no special staff security used" |

---

## F. State machines and enumerations

**Metro 2 repairable fields** — Metro 2 ID · Payment History Profile · Compliance Condition Code ·
Account Status · Special Comment · Consumer Information Indicator · Date of First Delinquency.

**Metro 2 files touched by recovery** — `CUSTOMER` · `IR.ACTIVE` · `IR.HISTORY`.

**Payments per month** — 1 · 2 · 4.

**LET document sections** — Legally Entitled To Items · Retail Purchases since Last Zero Balance
Date · Repossession Notice · Waiver of Rights.

**LET item fields** — Seq Nbr · Invoice Date · Invoice # · Product Number · Description · Brand ·
Piece Number · Sell Price · Price Paid.

**Date of first delinquency lifecycle** — assigned on delinquency → retained through continued
delinquency → cleared only on becoming current → **new** date on re-delinquency.

**Zero balance date** — set when the account reaches zero open balance, and at new-account setup.

---

## G. Sequencing rules (additions)

1. Payment agreements: enable system-wide → define source → flag the misc payment type → flag the
   plan → finance and complete orders → generate report to source → receive funds → generate/import
   payment file.
2. Metro 2: report (incremental) → optionally repair before the **next** submission → download/export.
   Historical files are immutable.
3. Metro 2 recovery runs only after a fatal interruption; re-runnable until all records flag true.
4. Repossession: print LET (sets expiry to next cycle date) → `Process Repossessed Items` →
   `Original Document Select` → items return to inventory.
5. LET expiry is the flag enabling repossession return; expired LET means reprint first.
6. End-of-Month purges LET documents older than the last zero balance date, past retention.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **Is installment reported to Metro 2 at all?** `Report Metro 2 Customer Credit History` says the
  report "includes only … Revolving Receivables information", yet the recovery routine is on both
  the Revolving and Installment menus, touches `IR.ACTIVE`/`IR.HISTORY`, and batch 7 documents an
  installment cancellation writing a Metro 2 account status. **Unresolved and consequential.**
- **`Payment History Profile`** appears as a Metro 2 field, a credit-master field (batch 9) and a
  standalone article — three contexts, no definition read yet.
- **`Special Comment` / `Consumer Information Indicator` / `Compliance Condition Code` / `Account
  Status`** — Metro 2 standard code sets; STORIS names them but enumerates none. We will need the
  Metro 2 Resource Guide, not STORIS docs, for the values.
- **`LET Print Version`** — a field with no stated options; the article describes a "Short Form",
  implying a long form exists and is undocumented.
- **`Import Action`** on the payment-file generator — undescribed.
- **The two extraction programs** in Payment Agreement Source Settings are never named or contrasted
  beyond plan-specific vs not.
- **`Receivable Payment Source Settings` vs `Payment Agreement Source Settings`** — two names,
  probably one file (cf. batch 5, where the former governed payment import).
- **What happens to a repossessed item's cost basis** — the accounts exist (batch 1) but no article
  read so far states the posting on repossession return.

**3. Inferences (not quotable, kept out of section B)**
- `IR.` almost certainly stands for Installment Receivables, which would suggest installment *is*
  in scope for Metro 2 despite the report's wording. Not stated.
- The LET "last piece on the order" rule combined with least-to-most-expensive ordering appears
  designed to repossess the fewest, cheapest items that cover the balance. The docs describe the
  mechanics without stating the intent.
- The LET filename collision on same-day reprint is probably harmless in practice (the content is
  regenerated identically) but would lose an audit copy. Not stated.

---

## I. Unknown unknowns (additions)

- **Payment agreements with external payers** (payroll, SSA, VA, insurers) driving multi-payment cycling.
- **Metro 2 credit bureau reporting** as a full subsystem with repair and crash recovery.
- **FCRA / FCBA compliance artefacts** — compliance condition codes, date of first delinquency,
  consumer information indicator.
- **Customer Legal Settings** with a do-not-report flag.
- **LET (Legally Entitled To) documents** as an expiring legal instrument gating repossession.
- **Waiver of Rights** and **Repossession Notice** as generated customer-signed documents.
- **Product groups flagged non-repossessable** (e.g. flooring).
- **Piece Number** — piece-level identity on financed merchandise.
- **Zero balance date** as a retention and reporting anchor.
- **Customer Joint record** as a distinct store for co-applicant identity.
- **NFS root path configuration** for document export.
- **Record-level locking** surfacing as a user-visible batch outcome.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Payment agreement | Arrangement where a third party (payroll, SSA, VA, insurer) remits a customer's revolving payments |
| Payment source | The remitting organisation, with its own schedule and payment type |
| Metro 2 | Consumer credit bureau reporting format |
| Compliance condition code | Metro 2 field reported once, tracked by updated/reported dates |
| Date of first delinquency | FCRA aging anchor; cleared only when the account becomes current |
| Consumer Information Indicator | Metro 2 field repairable in STORIS |
| Repair file | `MM_DD_YYYY_REPAIR`; single mutable correction file per reporting period |
| IR.ACTIVE / IR.HISTORY | Installment receivable active and history stores |
| LET — Legally Entitled To | Expiring document listing merchandise eligible for repossession |
| LET expiration date | The customer's next cycle date; the flag enabling repossession return |
| Zero balance date | Most recent date the customer had no open balance; retention anchor |
| Legally Entitled to Repossess | Product-group flag excluding items (e.g. flooring) from LET |
| Piece Number | Per-unit sequence identifying a specific physical item on an order |
| Waiver of Rights | Signed form allowing repossession of items not on the LET |
