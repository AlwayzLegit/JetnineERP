# Run 01 — Accounting — Batch 9: Credit Applications, Scoring, and the Credit-Hold State Machine

10 articles. This batch contains **the single most reusable artefact found in the run**: the
complete AR credit hold code list, 22 codes with their trigger conditions and the settings that
apply and remove them. That is a state machine we can lift almost verbatim.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 83 | Credit Application Processing Overview | /articles/15202278290452 | EXTRACTED |
| 84 | Request Credit Information | /articles/15202278288148 | EXTRACTED |
| 85 | Credit Application Entry | /articles/15202310374292 | EXTRACTED |
| 86 | Review Pending Credit Requests | /articles/15202310378004 | EXTRACTED |
| 87 | Credit Request Review | /articles/15202278094100 | EXTRACTED |
| 88 | Request New Credit Report | /articles/15202278093972 | EXTRACTED |
| 89 | Customer Credit and Scoring Information | /articles/15202278293268 | EXTRACTED |
| 90 | Customer Credit and Scoring Activity Log | /articles/15202310175380 | EXTRACTED |
| 91 | Release Orders from Credit Hold | /articles/15202312758676 | EXTRACTED — thin |
| 92 | **Credit Hold Codes List (AR)** *(Overviews → References)* | /articles/15202309408276 | EXTRACTED |

Newly discovered, queued: `Credit Application Control Settings`, `Alert Code Settings`,
`Update Receivables Credit Approvals`, `Update Financing Credit Approvals`,
`View Credit Request Responses`, `View Completed Credit Requests`, `Need Credit Report`,
`Credit Report Processor`, `Credit Application Decision Process`, `View Credit Report`,
`View Soft Credit Report`, `Audit Request Activity`, `Report Open Orders on Credit Hold`,
`Credit Holds FAQs`, `EMV Terminal Selection`, `Web Control Settings`,
`Create a User/Group Actions - Sales Security`, `Alternate Tax Interface (ATI)`.

---

## B. Wiring findings

### FINDING 128 — Twenty-two AR credit hold codes, each with a named trigger and settings source
Trigger:    Order entry, End-of-Day, payment events, external responses
Producer:   "STORIS automatically applies and/or removes AR credit holds based on your responses to
            the system settings described below."
Scope note: "AR credit hold codes are **distinct from both AP hold codes and from purchase orders
            placed on hold** via the On Hold field in Enter a Purchase Order."

| Code | Trigger | Governing setting |
|---|---|---|
| C1 | Customer exceeded credit limit. Without Extended Receivables **all** over-limit orders can hold; with Installment + Extended Receivables **only financed** orders hold | `Credit Limit`, Receivables tab, Customer Settings |
| C2 | At order entry, open A/R balance older than N days | `Past Due Days`, Point of Sale Control Settings |
| C3 | At order entry, customer inactivity exceeded N days | `Last Activity`, Point of Sale Control Settings |
| C4 | **Manual** hold on all open sales orders, service orders and debit exchanges | `Place Credit Hold`, Customer Credit and Scoring Information |
| C5 | Pre-authorised deposit — funds committed by pre-auth code, not yet captured, goods not shipped | `Use for Pre-Authorizations`, Credit Card Payment Settings |
| C6 | Revolving plan added to an order while an open credit request exists | `Linked Sales Orders Put on Hold for Open Request` (Credit Application Control Settings) + `No Credit Check` unchecked (Revolving Payment Plan Settings) |
| C7 | **Payment history hold** — past-due occurrences exceed a threshold in a time frame | `Alert Code Settings` |
| C8 | **Payment verification hold** — anti-fraud; payment/deposit total in a period exceeds a threshold | `Alert Code Settings` |
| D1 | EOD holds all orders for customers with an open past-due balance | `Past Due / Open Ord Hold`, Accounts Receivable Control Settings |
| D2 | (a) open balance exceeds `Maximum Balance`; auto-removed when balance drops. (b) order fails minimum deposit requirements | AR Control Settings → Deposits tab (`Maximum Balance`, `Over Maximum Balance` = D2) |
| E1 | Exchange placed on hold at entry | `Exchange on Hold at Entry` (POS Control Settings) + `Approve E1 credit hold placed on customer exchanges` (Sales Security). Removed via `Update Receivables Credit Approvals`. "Once a user approves an exchange, the system does not place it E1 Hold again." |
| F1 | Revolving amount financed exceeds credit limit | `Customer Credit Review` (Revolving Payment Plan Settings), `Maximum Credit per Transaction $` (Revolving Receivables Control Settings) |
| F2 | Installment contract credit hold | *(no setting given)* |
| F3 | Amount financed but third-party financing not authorised | — |
| F4 | Finance provider requires approval review; **blocks invoicing** until removed | `Approval Review Required` (Finance Provider Settings); removed only by users with `Approve F4 credit holds placed on financed orders` (Receivables Security), via the `Reviewed` field in `Update Financing Credit Approvals`. Not re-applied if financing is added later and F4 was already cleared |
| F5 | Driver's licence verification required for revolving plans | — |
| I1 | eSTORIS web order, card not yet authorised; auto-removed on authorisation | — |
| I2 | eSTORIS order authorised, deliveries held | `Credit Hold Authorized Deliveries`, Web Control Settings |
| I3 | Awaiting fraud-analysis vendor decision | — |
| I4 | Fraud-analysis vendor flagged the order or card | — |
| S1 | Mandatory signatures not obtained | `Configure Document Signature Capture` |
| T1 | Alternate tax provider returned an error and no tax amounts were received | Alternate Tax Interface (ATI) add-on |

Removal:    manual removal via `Update Receivables Credit Approvals`; listing via
            `Report Open Orders on Credit Hold` and `Release Orders from Credit Hold`
NextGen:    C5(implied), D2, F3, F4, I1, I3, I4, S1, T1 can be applied to NextGen-originated orders
Evidence:   Credit Hold Codes List (AR), /articles/15202309408276
Maps to:    **W-020 — CONFIRMED and enormously extended**, **W-030 — CONFIRMED** (C5 is auth-at-order,
            capture-at-fulfilment), **W-032 — CONFIRMED** (F3/F4 are the financing authorisation gates),
            **W-062 — CONFIRMED** (T1: no tax, no order)

> This is the delivery/invoicing readiness gate our `W-020` gestures at, and it is far richer than
> we assumed: 22 codes spanning credit, fraud, signature, tax and web channels, applied by at least
> four different subsystems, removed through three different screens with three different permissions.
> **Build our hold model from this table.** Note especially that F4 blocks *invoicing*, D2 auto-clears
> when the balance drops, and E1 never re-applies once approved — three different removal semantics.

### FINDING 129 — Credit application processing is a four-stage pipeline with optional bureau call
Trigger:    `Request Credit Information`
Stages:
  1. **Credit Application Entry** — enter/edit the application
  2. **Need Credit Report** — "verify whether to pull a credit report. The system generates credit
     request comments stating whether or not a credit report was pulled."
  3. **Credit Report Processor** — sends application data to the bureau and retrieves the report;
     "If a credit report is not needed, this program skips this process."
  4. **Credit Application Decision Process** — "places credit request items in the pending credit
     request waiting for a manual decision … and generates a comment stating that the credit request
     was submitted for manual review."
Invariant:  every stage writes a **credit request comment** — the audit trail is comment-based
Evidence:   Credit Application Processing Overview, /articles/15202278290452
Maps to:    **W-032 — CONFIRMED** (application → approval half of the financing chain)

### FINDING 130 — Applications snapshot the customer; later customer edits do not flow through
Trigger:    Re-accessing an existing credit application
Invariant:  "This program displays customer information **as it appeared at the time the application
            was entered**. If you re-access an application and the customer's record in the Customer
            Settings was updated in the meantime, **the application does not reflect the changes.**"
Related:    on `Credit Request Review`, "Changes to the billing or delivery address are **not**
            reflected unless the update has been made via the global Actions button on the Residence
            page of `Advanced Customer Settings`"
Evidence:   Credit Application Entry, /articles/15202310374292 · Credit Request Review, /articles/15202278094100
Maps to:    **W-053 — adjacent** — the application is an immutable snapshot, deliberately

> Correct behaviour for a credit decision (you decide on what was submitted), but it means customer
> master data and application data diverge permanently. Our model needs the same snapshot semantics
> and should say so explicitly rather than joining live.

### FINDING 131 — Three applicant roles, five tabs each, field requiredness driven by settings
Structure: **Primary Applicant · Co-Applicant · Co-Signer**, each with tabs
            **Personal · Residence · Employment · Miscellaneous · Reference**
Config:     "Activation of the check boxes is based on your `Credit Application Control Settings`";
            per-field requiredness is "optional, mandatory, or can be skipped (not needed)" per the
            same settings file
References: "You can enter up to **99 references**."
Military:   Miscellaneous captures Rank · Branch · **Service Comp Date** · **ETS Date** ·
            Commanding Officer Name · Phone
Validation: "the system prevents you from entering a date more than 100 years in the past";
            previous-residence `Resided From/To` and previous-employment `Employed From/To` must be
            ordered
Evidence:   Credit Application Entry, /articles/15202310374292
Maps to:    NEW

### FINDING 132 — Removing a co-applicant or co-signer holds every financed order
Trigger:    Removing a co-applicant or co-signer from a credit application
Consumers:  "**all financed sales orders are placed on C4 credit hold**"
Evidence:   Credit Application Entry, /articles/15202310374292
Maps to:    NEW — a cross-module cascade from application maintenance to order state

### FINDING 133 — SSNs are encrypted at save and written to a separate credit record
Trigger:    Saving a credit application
Consumers:  "The program **encrypts the social security number** for the primary and cosigner upon
            saving and writes it to the `Social Security Number` field in the **Customer Credit
            record** based on the individual customer numbers for the primary applicant and cosigner.
            The program also updates the credit application record for historical purposes."
Also:       `Request Credit Information` allows customer lookup **by Social Security #**
Also:       `Request New Credit Report` — a user without access to existing application data "can
            still use this screen to request a new review item. The screen prompts for **verification
            of the applicant's social security number**. You cannot proceed … until the social
            security number is entered."
Evidence:   Credit Application Processing Overview, /articles/15202278290452 · Request New Credit Report, /articles/15202278093972
Maps to:    NEW — compliance-relevant (third such finding)

> SSN is encrypted at rest but is also a **search key** and a **step-up verification token**. Both
> of those are patterns we should not carry forward. Note this is the third data-protection finding
> in the run, after the full-PAN reveal (batch 3) and the unencrypted bank account number in the
> check export file (batch 6).

### FINDING 134 — Credit review access is override-gated with a second user's credentials
Trigger:    Opening `Credit Request Review` from `Review Pending Credit Requests`
Gate:       `Access Other Credit Applications and Score Reporting` on the **Extended Security** screen
Override:   "If you do not have this security setting active, you are prompted for a security override
            … **A user with this extended security must enter their initials and password** in order
            for you to access this entry version of the screen."
Related:    `Access credit applications and score reporting` in **Receivables Staff Security** governs
            whether the user may add attachments to a hold/pending credit request; if unchecked,
            `View Credit Request Responses` is the alternate path "in case an underwriter needs
            additional information"
Evidence:   Credit Request Review, /articles/15202278094100 · Credit Application Entry, /articles/15202310374292
Maps to:    **W-051 — CONFIRMED** (a genuine two-person override ceremony)

### FINDING 135 — Approving a credit request either auto-authorises linked orders or leaves them held
Trigger:    Approving a credit request in `Review Pending Credit Requests`
Two paths:
  - With `Review Pending Credit Request – Manually approved linked sales order` (Receivables Staff
    Security): prompt *"Would you like to approve the linked orders manually?"* → Yes → per order
    *"Authorize order nnnnn for $nnn.nnn, finance plan xxxxx."* → **C6 hold removed**
  - No → "the process checks the available credit for the customer to ensure that it is enough to
    cover the financed amount. If it is insufficient … *'Financing has not been approved for order
    nnnnn.'* … the sales order **stays on C6 credit hold**, and the hold can only be removed if you
    **remove the revolving finance plan** from the sales order."
  - Without the permission: "Review Pending Credit Requests **automatically tries to authorize** the
    associated sales orders when the credit request undergoes approval."
Reuse:      "If a customer has already had a credit line created from a previous approved credit
            request, the previous approved credit request is evaluated when financing is applied …
            If the credit limit is enough to cover the cost of the order, the financing is approved."
Evidence:   Review Pending Credit Requests, /articles/15202310378004
Maps to:    **W-032 — CONFIRMED (approval → attach)**, **W-060 — adjacent** (available credit is the gate)

### FINDING 136 — Plan eligibility is enforced at the lookup, not just at validation
Trigger:    Choosing a finance plan on an order
Invariant:  "Finance plans that the customer does not have access to **are not shown in the finance
            plan lookup**. If you try to enter a finance plan that is not approved for the customer,
            a message appears naming why the plan is not being allowed."
Basis:      revolving restrictions in `Revolving Payment Plan Settings` — credit score, minimum
            financed amount, and other data (full rule list at batch 8, Finding 122)
Evidence:   Review Pending Credit Requests, /articles/15202310378004
Maps to:    **W-060 — CONFIRMED** for credit availability

### FINDING 137 — An open credit request re-prompts on every save of a linked order
Trigger:    Saving a sales order associated with an open credit request
Consumers:  message *"Customer has an open credit request. Access Credit Application"* → Yes opens
            the application for processing
Entry:      "A credit request can be entered from the `Enter a Sales Order` process using the global
            extra, **Finance Application**."
Evidence:   Review Pending Credit Requests, /articles/15202310378004
Maps to:    NEW

### FINDING 138 — Credit and scoring master data is field-level audited with old/new values
Trigger:    Editing `Customer Credit and Scoring Information`
Consumers:  "For many of the fields that you edit on this screen, an **audit history of changes is
            maintained**. Displayed to the left of these fields is the most recent audit history …
            The **date, time, initials, old value, and new value** are displayed." Full history via
            a per-field Search button, shown in reverse order.
Log:        `Customer Credit and Scoring Activity Log` (Actions → Credit and Scoring Audit) —
            automatic comments plus manual comments
Evidence:   Customer Credit and Scoring Information, /articles/15202278293268
Maps to:    **W-053 — CONFIRMED** — the only place in the run with explicit before/after audit rows

> Everywhere else STORIS logs *comments*; here it logs *values*. This is the pattern `W-053` asks
> for and it exists in exactly one module. Ours should apply it to all master data, not just credit.

### FINDING 139 — The credit master carries two scores, three classifications and a lien register
Payload:    Available Credit · Customer Credit Limit · Reason · **Print Credit Limit Change Letter** ·
            Co-signer Credit Limit · **Credit Score** (primary, co-applicant) ·
            **Bankruptcy Score** (primary, co-applicant) · **Installment Classification** ·
            **Installment Co-signer Classification** · **Revolving Classification** ·
            Revolving Insurance · **Credit Source** · Place Credit Hold · Credit Hold Status ·
            **Request a Lien** · **Registered Lien Details** · Payment History Profile
Gate:       "If you process **Advanced Receivables** transactions"
Evidence:   Customer Credit and Scoring Information, /articles/15202278293268
Maps to:    NEW

### FINDING 140 — Re-pulling a credit report has two different outcomes by review state
Trigger:    `Request a New Credit Report` (pending) or `Submit a New Credit Request` (closed)
Rules:
  - review **not** complete → *"The current credit report will be discarded and replaced with the new
    credit report."*
  - review **complete** → a new review item is created; the system checks the **age of the linked
    application** — too old → a new application is required; current → "the system copies it into the
    new application where you can edit it". Also checks the **age of the credit report** — too old →
    pulls a new one. *"The new credit review item will not be associated with any order."*
Options:    Credit Bureau · Update Credit Application · **Retain Original Comments** · Social Security # · Comment
Evidence:   Request New Credit Report, /articles/15202278093972
Maps to:    NEW — application and report each carry an independent staleness rule

### FINDING 141 — Pending-queue statistics are first-class
Payload:    Total Pending Review Requests · Total Hold Review Requests ·
            **Average Initial Response Time** · **Average Decision Time**
Evidence:   Review Pending Credit Requests, /articles/15202310378004
Maps to:    NEW

---

## C. Screen and field inventory

**Request Credit Information** — Selling Store · Social Security # · Customer · Full Name ·
Billing Address (Full Name, Address 1/2, City/Town, State/Province, Zip/Postal) · Delivery Address ·
Salesperson · Credit Bureau · Marketing Code 1 · Code 2 · Review Comment · Continue.
Actions: Update a Credit Application · Resend Application to Bureau *(inactive)* ·
Update a Customer Address · Assign Payment Terminal (→ EMV Terminal Selection).

**Credit Application Entry** — header: Customer Number, Name, Address (read-only).
- *Personal:* Social Security # / Social Insurance # · Date of Birth · Driver's License · Gender ·
  Marital Status · Additional Applicant (Co-applicant, Co-signer) · Checking · Savings ·
  # of Dependents · Email
- *Residence:* Current · Type · Home Phone · Cell Phone · Resided Since · Mortgage Company/Landlord ·
  Mortgage Balance · Home · Monthly Payment · Address 1/2 · Zip · City · State · Resided From/To
- *Employment:* Current · Status · Job · Employer · Address 1/2 · Zip · City · State · Phone ·
  Employment · **Income** · **Income Indicator** · Previous (Job Title, Employer, address, Phone) ·
  Employed From/To
- *Reference:* Name · Type · Phone · Address 1/2 · Zip · City · State (up to 99)
- *Miscellaneous:* Rank · Branch · Service Comp Date · ETS Date · Commanding Officer Name · Phone

**Credit Request Review** — Review Status · Reviewer · Current · Reason · Salesperson · Credit ·
**Suggested Credit Limit** · **Credit Limit Offered** · **Suggested Credit Classification**.
Read-only: Customer Information (Code, Name, Phone, Address 1/2, City, State, Zip, Email, Co-Signer) ·
Credit Information (Limit, Available, Used, Score) ·
Sales Order Information (Number, Total, Deposit, Requested Plan, Requested Amount).
Extra actions: Update a Credit Application · View Credit Report · **View Soft Credit Report** ·
Request a New Credit Report · Access Requests on Hold · **Audit Request Activity** ·
View an Existing Sales Order · Submit a New Credit Request · Credit and Scoring · Print Status Letter.

**Review Pending Credit Requests** — Total Pending Review Requests · Total Hold Review Requests ·
Average Initial Response Time · Average Decision Time · Sort By · Refresh · Grid · Actions.

**Customer Credit and Scoring Information** — see Finding 139.

**Customer Credit and Scoring Activity Log** — Customer Code · Date Code · Starting/Ending Date ·
Update Comments · Comments · Send Output to · Export Path · Actions.

**Release Orders from Credit Hold** — Orders on Credit Hold · Last Refreshed · Grid.
Grid may be restricted by hold code via `Create a User/Group Receivables Security`.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Credit Application Control Settings | own file | Co-applicant/co-signer availability; per-field optional/mandatory/skip; application "current" age; `Linked Sales Orders Put on Hold for Open Request` |
| Alert Code Settings | own file | C7 past-due occurrence thresholds; C8 payment/deposit fraud thresholds |
| Past Due Days / Last Activity | Point of Sale Control Settings | C2 / C3 triggers |
| Exchange on Hold at Entry | Point of Sale Control Settings | E1 trigger |
| Customer Entry - Warn if Primary Email exists for other Customers | POS Control Settings → Customer tab | Duplicate-email warning on application entry |
| Past Due / Open Ord Hold | Accounts Receivable Control Settings | D1 at End-of-Day |
| Maximum Balance / Over Maximum Balance | AR Control Settings → Deposits tab | D2 |
| Use for Pre-Authorizations | Credit Card Payment Settings | C5 |
| No Credit Check | Revolving Payment Plan Settings | Suppresses C6 |
| Customer Credit Review | Revolving Payment Plan Settings | F1 |
| Maximum Credit per Transaction $ | Revolving Receivables Control Settings | F1 |
| Approval Review Required | Finance Provider Settings | F4 |
| Credit Hold Authorized Deliveries | Web Control Settings | I2 |
| Configure Document Signature Capture | own routine | S1 |
| Alternate Tax Interface (ATI) | add-on | T1 |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Access Other Credit Applications and Score Reporting | **Extended Security** | Entry version of Credit Request Review; overridable by another user's credentials |
| Access credit applications and score reporting | **Receivables Staff Security** | Adding attachments to a hold/pending credit request |
| Review Pending Credit Request – Manually approved linked sales order | Receivables Staff Security | Manual vs automatic order authorisation on approval |
| Approve F4 credit holds placed on financed orders | Create a User/Group Actions - Receivables Security | Removing F4 via Update Financing Credit Approvals |
| Approve E1 credit hold placed on customer exchanges | Create a User/Group Actions - **Sales** Security | E1 application and approval |
| (hold-code restriction) | Create a User/Group **Receivables Security** | Which hold codes appear in Release Orders from Credit Hold |

> Two more subsystem names appear here — **Receivables Staff Security** and
> **Create a User/Group Receivables Security** (distinct in wording from
> `Create a User/Group Actions - Receivables Security`). Running total: eleven.

---

## F. State machines and enumerations

**AR credit hold codes** — C1–C8, D1, D2, E1, F1–F5, I1–I4, S1, T1 (22 codes; see Finding 128).
Removal semantics vary: auto-clearing (D2, I1), one-shot (E1), permission-gated (F4),
manual-only (C4), plan-removal-only (C6).

**Credit request lifecycle** — entered → (bureau pull, optional) → **pending** → **hold** →
manually decisioned → completed/closed. Closed items can seed a new review item.

**Applicant roles** — Primary Applicant · Co-Applicant · Co-Signer.

**Application tabs** — Personal · Residence · Employment · Miscellaneous · Reference.

**Scores held** — Credit Score and **Bankruptcy Score**, each for primary and co-applicant.

**Classifications** — Installment Classification · Installment Co-signer Classification ·
Revolving Classification · Suggested Credit Classification.

---

## G. Sequencing rules (additions)

1. `Request Credit Information` → (existing-application currency check) → `Credit Application Entry`
   → Need Credit Report → Credit Report Processor → Decision Process → pending queue.
2. A "current" existing application **blocks** creating a new one; you must maintain the existing one.
3. Saving the application transmits to the bureau if the site is set up to transmit.
4. Approval either authorises linked orders (removing C6) or leaves them held.
5. F4 blocks **invoicing** until reviewed.
6. Removing a co-applicant/co-signer immediately places all financed orders on C4.
7. Re-pulling a report discards the old one only while the review is incomplete.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **F2 (installment contract credit hold), F3, F5, I1, I3, I4** have triggers but **no governing
  setting named**. We cannot reproduce when they apply.
- **`Suggested Credit Limit` vs `Credit Limit Offered` vs `Suggested Credit Classification`** —
  who or what suggests them is never stated. If it is a scorecard, that scorecard is undocumented.
- **`Credit Source`, `Income Indicator`, `Payment History Profile`, `Type` (reference), `Home`
  (residence)** — named, undescribed.
- **`View Soft Credit Report`** — soft vs hard pull is a regulated distinction and appears only as a
  button label.
- **Application "current" age and credit-report age thresholds** — both drive behaviour, neither
  value nor location is given beyond "your Credit Application Control Settings".
- **`Request a Lien` / `Registered Lien Details`** — lien registration is referenced here and has its
  own article (`Enter Lien Registration Information`, unread).
- **Marketing Code 1 / Code 2** on the credit request — purpose unstated.
- **NextGen** — referenced repeatedly as an alternate order-origination channel with its own hold
  behaviour; no article read.

**3. Inferences (not quotable, kept out of section B)**
- The comment-based audit trail across the credit pipeline is probably the same `Credit Review
  Comments Entry/Inquiry Screen` seen in the Cash Drawer cluster; not stated here.
- `Suggested Credit Limit` is likely bureau-derived given it sits beside the score; not stated.
- C5's description implies the pre-authorised deposits that batch 6 found invisible to the payment
  screen; the two articles never connect.

---

## I. Unknown unknowns (additions)

- **Bankruptcy score** held alongside credit score.
- **Soft credit reports** as a distinct artefact.
- **Fraud analysis vendor** integration (I3/I4) as an external decisioning service.
- **eSTORIS** web channel and **NextGen** as order origins with their own hold codes.
- **Alternate Tax Interface** whose failure blocks the order (T1).
- **Military service data** captured on credit applications (rank, branch, ETS date, commanding officer).
- **Up to 99 references** per application.
- **Lien registration** against customers.
- **Credit limit change letters** printed from the credit master.
- **Marketing codes** captured at credit request.
- **Payment terminal assignment** (EMV Terminal Selection) from the credit request screen.
- **Queue SLA metrics** (average initial response time, average decision time) built into the review screen.
- **Co-signer credit limit** as a separate limit from the customer's.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Credit hold code | Two-character code (C1…T1) blocking an order; applied and removed by named subsystems |
| Credit request / review item | The unit of work in the credit pipeline; distinct from the application |
| Need Credit Report | The stage deciding whether to pull a bureau report |
| Credit Report Processor | The bureau integration stage |
| Credit Application Decision Process | The stage that queues a request for manual decision |
| Soft credit report | Non-hard-pull report viewable from the review screen |
| Bankruptcy score | Second bureau score held per applicant |
| Installment / Revolving Classification | Credit classifications driving plan eligibility |
| Credit Source | Undescribed provenance field on the credit master |
| C4 hold | Manual, customer-wide hold across sales orders, service orders and debit exchanges |
| C6 hold | Order held because a revolving plan was added while a credit request is open |
| F4 hold | Provider-mandated approval review; blocks invoicing |
| Audit Request Activity | Per-request activity audit reachable from the review screen |
| Retain Original Comments | Option carrying comments forward to a new review item |
