# Run 03 — Sales Processing — Batch 9: Financing Applications, Providers and Authorisation

**Status: complete.** 8 articles. Findings 85–95.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Installment & RTO Online Financing Overview** | /articles/15201704514836 | EXTRACTED — **the section's architectural article** |
| 2 | **Finance Application** | /articles/15201688651924 | EXTRACTED — fifteen named providers |
| 3 | **Standard Finance Credit Application - Primary** | /articles/15201703750420 | EXTRACTED — five pages |
| 4 | Finance Application Management | /articles/15201688666004 | EXTRACTED |
| 5 | **Finance Payment Estimator** | /articles/15201688650644 | EXTRACTED |
| 6 | **Finance Queue Recap** | /articles/15201703499796 | EXTRACTED |
| 7 | Retailer Disclosure | /articles/15201703742996 | EXTRACTED — thin |
| 8 | Enter a Finance Application | /articles/15201703265684 | EXTRACTED — thin |

Discovered and queued: `Finance Provider Settings` · `Finance Provider Settings by Finance Type` ·
`Financing Payment Plan Settings` · **`Financing Eligibility Restrictions`** ·
**`Third Party Finance Application Control Settings`** · `Credit Application Control Settings` ·
`Financing Control Settings` *(Consumer Application Text)* · `Financing Payment Estimator Settings` ·
`Financing Merchant Settings` · `View Finance Credit Application` · `View Finance Credit Responses` ·
**`Report Sales Tax`** *(`NT Rsn` column)* · `View Available Financed Credit` · `Activity Reason Settings`.

---

## B. Wiring findings

### FINDING 85 — Fifteen named finance providers, two of which use non-standard forms
Providers (verbatim, complete): **Acima · America First Finance · Capital One · Concora · Encompass ·
            Fairstone · Fortiva · Koalafi · Progressive · Smart Sales and Lease · Synchrony · TD Bank ·
            Tower Loan · Versatile · Wells Fargo**
Invariant:  "**With the exception of the `Encompass` and `House` (custom) providers, these providers
            interface with STORIS using the standard application entry form.**"
Invariant:  "**From this point on, the finance provider you select determines the procedure.**"
Access:     Sales Order Entry / Enter an Exchange → Actions on the Payment tab → `Finance Application`;
            or the Financing menu.
Permission: "**`Access credit applications for third party on-line financing`** field in the
            **Receivables** User/User Group security settings" *(to edit existing applications)*.
Evidence:   Finance Application, /articles/15201688651924
Maps to:    **NEW**

> **Fifteen named integrations, plus a "House" custom provider**, each potentially with its own
> procedure after provider selection. This is by a wide margin the largest set of external
> integrations found anywhere in the audit — run 2 found one (Ashley ATP), batch 8 found three address
> services, batch 4 found three card processors.
>
> Two consequences for the cutover. **Whichever of these fifteen LA Mattress actually uses is a
> contractual and technical dependency that must be reproduced**, and the provider list is the single
> most important extraction target in this run. And **Encompass and House deviate from the standard
> form**, so those two are separate integration efforts if either is in play.

### FINDING 86 — RTO orders are made non-taxable, and the tax removal is reported
Invariant (verbatim): "**When you add an RTO plan to an order, the order is marked as non-taxable, and
            all sales tax is removed from the order. Any taxes required are handled by the finance
            provider and included in the payment structure that they define.** `Report Sales Tax`
            reports orders that have had the tax removed."
Reporting:  "**`Report Sales Tax` - A `No Tax Reason` (`NT Rsn`) column indicates the reason tax was not
            collected on an order.**"
Full-finance rule (verbatim): "**When an order is being paid using an RTO plan, the full amount of the
            order must be financed. If a deposit of any amount has been applied to an order, an RTO plan
            cannot be added to an order.**"
Deposit ban (verbatim): "**The use of an Installment or RTO plan as a deposit… is not allowed. The
            `Maximum Percentage When Used as a Deposit` setting on the `Financing Eligibility
            Restrictions` screen is set to `0.00` and cannot be changed for these types of plans.**"
Evidence:   Installment & RTO Online Financing Overview, /articles/15201704514836
Maps to:    **confirms batch 1 Finding 6; W-052 / W-053 relevant**

> Batch 1 found the bare statement that "some Rent-to-Own plans qualify for tax exemption and override
> the settings in Advanced Customer Settings". **This is the full rule and it is stronger than that:
> adding an RTO plan strips all sales tax from the order**, because the finance provider collects and
> remits it inside the rental payment structure.
>
> Three things follow. **A financing decision changes the tax treatment of a sale** — the coupling batch
> 1 flagged as surprising is real and total. **There is a `No Tax Reason` column on `Report Sales Tax`**,
> which means STORIS keeps an auditable reason for every untaxed order — a good design worth copying.
> And **RTO is all-or-nothing**: any deposit blocks it, and the deposit cap is hard-wired to zero and
> cannot be configured otherwise.

### FINDING 87 — Two settlement models coexist, and which one applies depends on the finance type
Invariant (verbatim): "**Revolving financed transactions settle at end of day or are settled manually
            via `Transmit Financing Settlement`. Installment and RTO finance transactions settle when
            the transaction is completed. Partial completion of orders sends partial settlements for
            installment and RTO financing.**"
Evidence:   Installment & RTO Online Financing Overview, /articles/15201704514836
Maps to:    **W-012 — CONFIRMED; confirms batch 5 Finding 46**

> Batch 5 found installment and RTO payments settling "at the time the payment is applied" through the
> FR In-Store Payments tab. **This generalises it: the settlement model is a property of the finance
> type, not the screen.** Revolving batches to End-of-Day or a manual transmit; installment and RTO go
> immediately, **including partial settlements on partial completion.**
>
> That is an eleventh End-of-Day behaviour, and it means **cash timing differs by credit product**.
> A store completing half an RTO order this afternoon has settled half of it; the same half-completion
> on a revolving plan waits for the nightly run.

### FINDING 88 — Monetary changes to a financed order automatically re-authorise, in one of two ways
Invariant (verbatim): "**Any monetary changes (including changes to merchandise, discounts, sales tax,
            delivery and/or installation charges, fees) made to open orders that have had no partial
            completions** and were approved with Installment or RTO plans, **trigger a new authorization
            request to be sent to the finance provider.**"
Invariant (verbatim): "**Any monetary changes… made to open orders that have been partially completed**
            and were approved with Installment or RTO plans, **trigger an authorization adjustment
            request… This request details the differences between the original order and the updated
            order.**"
Evidence:   Installment & RTO Online Financing Overview, /articles/15201704514836
Maps to:    **NEW — and it is a genuine live integration behaviour**

> **Editing a financed order calls the finance provider.** Not on save-and-transmit, not overnight —
> the change itself triggers an outbound request, and the *shape* of that request depends on whether
> anything has been delivered yet: a **full re-authorisation** before any completion, a **delta
> adjustment** after.
>
> That is the tightest external coupling in the audit. It means **a salesperson changing a delivery
> charge on an RTO order is making a real-time credit decision request**, and it means any rebuild must
> reproduce both request shapes or the provider's records will diverge from ours.

### FINDING 89 — `F3` is a fourth credit hold, set by a "pre-qualify" response
Invariant (verbatim): "**A 'pre-qualify' response in the authorization returned indicates that the
            customer can be approved once additional information (e.g. bank account information, pay
            dates etc.) has been provided. Supplying this information is handled outside of the STORIS
            application via a web service.** (This can be provided in the response by the provider, or
            accessed separately by the user on the provider's web site.) **When a pre-qualify response
            is received, the order is placed on 'F3' credit hold.**"
Evidence:   Installment & RTO Online Financing Overview, /articles/15201704514836
Maps to:    **run 1's 22 AR credit hold codes — a fourth code now bound to an event**

> Credit hold codes bound to documented triggers now number four: **`F5`** driver-licence failure,
> **`C6`** credit decision pending, **`E1`** exchange at entry, **`F3`** pre-qualified pending customer
> data. Run 1 catalogued 22 codes with no triggers; this run has now sourced four of them.
>
> `F3` is distinctive because **clearing it happens entirely outside STORIS** — the customer supplies
> bank details on the provider's own web service. So an order sits held on our side waiting for an event
> we neither observe nor control, and nothing in the documentation describes how the hold is released.

### FINDING 90 — The credit application collects a very large set of personal and financial data
*Personal*: **`Social Security Number` · `Date of Birth`** · Home Phone · Cell Phone · Email ·
            **`Driver's License Number` · `State` · `Expiration`** · **`Marital Status`** ·
            **`Mother's Maiden Name`** · **`Language Preference`** · **`Checking Account`** ·
            **`Savings Account`** · **`Credit Protection`** · `Master Card`
*Residence*: current and **previous** address · Type · **Time At Address (Years, Months)** ·
            **`Monthly Payment` · `Mortgage Balance` · `Home Value`**
*Employment*: current and **previous** employer · Status · Job Title · Phone · Time At Employer ·
            **`Income` · `Income Indicator`**
*Reference*: multiple named references with Type, Phone and full address
*Finalize*: **`Requested Amount`** · **`Application Signed`**
Field control (verbatim): "**Determination of whether entry in these fields is `Mandatory`, `Optional`,
            or `Not Needed` is controlled by your settings in the `Third Party Finance Application
            Control Settings`.**"
Co-applicant: "**If the provider you use does not accept co-applicants**, all fields on the Co-Applicant
            tab… **should be set to `Not Needed`**… the Co-applicant button is not displayed."
Evidence:   Standard Finance Credit Application - Primary, /articles/15201703750420
Maps to:    **compliance — the largest personal-data surface in the audit**

> **SSN, date of birth, driver's licence, mother's maiden name, bank account presence, income, mortgage
> balance, home value and named third-party references** — collected in one form, stored in STORIS, and
> transmitted to a third party.
>
> This is a bigger personal-data footprint than anything runs 1 or 2 found, and it sits beside batch 8's
> unanswered questions about retention and deletion. **`Mother's Maiden Name` is the one to flag
> loudest**: it is a knowledge-based authentication token, and storing it alongside SSN and date of birth
> in the same record is the classic identity-theft dataset. Whether STORIS stores it after submission —
> and for how long — is not stated anywhere read.
>
> The three-state field control (`Mandatory` / `Optional` / `Not Needed`) is the right mechanism, and it
> means **the actual data collected is a local configuration decision.** Extracting that configuration
> should be part of the cutover privacy review.

### FINDING 91 — One application can be submitted to several providers, and the recap shows every approval
Invariant (verbatim): "**When the finance queue is utilized, this screen displays at the end of the
            queueing process. All providers that have approved the application are listed, along with
            the credit limit assigned. If the application is submitted to multiple providers, and are
            not all approved, messages are displayed indicating the status of the application.**"
Columns:    **`Finance Provider`** · **`Credit Limit`**
Evidence:   Finance Queue Recap, /articles/15201703499796
Maps to:    **NEW**

> **A finance queue submits one application to multiple providers in sequence and reports every
> approval with its credit limit.** That is a waterfall-lending pattern — try prime, then near-prime,
> then lease-to-own — and it is exactly how furniture retail finances a broad customer base.
>
> The commercial consequence is that **the salesperson chooses among approvals**, which makes the
> comparison screen (Finding 92) load-bearing. The compliance consequence is that **one customer's
> application data goes to several lenders**, and the documentation says nothing about disclosure,
> ordering, or whether declines are recorded.

### FINDING 92 — The payment estimator compares plans and only the selected one returns to the order
Invariant:  "provide a **comparison of financing alternatives**… **automatically calculates the payment
            amount**… called from the menu, and from a global Actions button in **`Enter a Sales Order`,
            `Enter an Exchange`, and `Enter a Shopping Cart`**."
Invariant:  "The estimator **limits comparisons to available finance plans based on the finance plan's
            start and end dates and location.**"
Invariant (verbatim): "**If accessed from an order, only the finance plan selected on this screen is
            returned to the order. Otherwise, all other information is for review/comparison purposes
            only and does not carry back to the order.**"
Fields:     **`Option 1, 2, 3`** · Order Amount · Deposit Amount · Discount Code/Amount ·
            **`Finance Amount`** · Select · *(Promotional)* **`Monthly Payment` · `Term Months`** ·
            *(Full Plan)* Monthly Payment · Term Months · **`Non-Financed Totals`** ·
            **`Amount Saved`** · **`Discounted Total`**
Gate:       "the applicable finance payment plans must have **at least one of the fields in `Financing
            Payment Estimator Settings` populated.**"
Evidence:   Finance Payment Estimator, /articles/15201688650644
Maps to:    **NEW**

> A **three-way side-by-side comparison** showing, for each plan, the promotional payment *and* the
> payment if the no-interest period is missed — which is the honest way to present deferred-interest
> financing and is worth preserving deliberately.
>
> **It is available from the shopping cart**, which means financing can be quoted before a customer or
> an order exists — the pre-sale conversation batch 7 found the cart supports. And the plan comparison
> is **date- and location-scoped**, so what a salesperson can offer varies by store and by promotional
> calendar.

### FINDING 93 — The consumer-facing application is a locked kiosk mode
Invariant (verbatim): "When the `Ok` button is clicked on the **`Customer Facing Application`** screen,
            **consumers can use this screen to begin the application entry process**… **Consumers cannot
            exit this screen; an authorized user must enter their initials and password to return to the
            menu.**"
Disclosure: "Customers use this screen to view the **disclosure text for their application**. This
            screen displays the text you set up on the **`Consumer Application Text` page of `Financing
            Control Settings`**."
Flow:       `Customer Facing Application` → `Enter a Finance Application` → **`Retailer Disclosure`** →
            application entry.
Evidence:   Enter a Finance Application, /articles/15201703265684;
            Retailer Disclosure, /articles/15201703742996
Maps to:    **NEW**

> **A genuine kiosk mode**: the customer types their own SSN, income and employment history on a screen
> they cannot escape without staff credentials. That is the right security posture for a terminal handed
> to a member of the public, and it is a distinct operating mode nothing else in the audit has.
>
> **The retailer disclosure text is configurable free text** in a settings file. Since this is the
> disclosure a consumer sees before submitting a credit application, **its content is a legal artefact
> held in a control setting** — worth extracting and reviewing rather than migrating blindly.

### FINDING 94 — Account numbers may or may not exist, and a provider setting decides whether they are required
Invariant (verbatim): "**In the case of Installment and RTO plans, a customer account number may or may
            not be returned for an application depending on the provider. If an account number is
            included in the application response, it is stored for future use.**"
Invariant:  "**If account numbers are not assigned by a provider when an application is approved, entry
            of an account number is not required. A provider setting defines whether account numbers are
            required.**" — **`ACCOUNT NUMBER - Require an Account Number When Requesting Finance
            Authorizations`** in `Finance Provider Settings`.
Type determination (verbatim): "**Providers who handle revolving, installment and rent-to-own types of
            financing decide which finance type the customer is qualified for when an application is
            processed.**"
Evidence:   Installment & RTO Online Financing Overview, /articles/15201704514836
Maps to:    **NEW**

> Two findings. **The provider, not the retailer, decides which credit product the customer gets** —
> a single application can come back approved for revolving, installment or RTO, and the order must then
> use a matching plan. So the finance type on a sale is an outcome of an external decision, not a sales
> choice.
>
> And **account numbers are optional by provider**, which means the customer↔account linkage that
> Receivables depends on may simply not exist for some plans. Run 1 mapped installment and revolving
> subledgers in depth; **this says the key linking a customer to a third-party account is provider-
> dependent and sometimes absent.**

### FINDING 95 — Exchanges on installment or RTO orders are constrained, and split exchange is unavailable
Invariant (verbatim): "**When processing exchanges with an Installment or RTO plan, the original order
            must have been financed with an Installment or RTO plan. Additionally, the `Split Exchange`
            action is not available.**"
Batch 7 corollary (verbatim): "**An even exchange can be completed for orders that were paid for with an
            installment or Rent To Own (RTO) financing plan**… **If 'Even Exchange' is not visible, a
            separate return and sale need to be created.**"
Out of scope: "**Printing of Installment contracts/RTO agreements, as well as collecting the first
            payment due, is not handled within STORIS.** These tasks are completed via connection to the
            provider."
Evidence:   Installment & RTO Online Financing Overview, /articles/15201704514836;
            Enter an Exchange, /articles/15201424987796
Maps to:    **W-042 relevant; completes batch 7 Finding 65**

> Batch 7 found `Split Exchange` as the documented escape route for restricted edits. **It is not
> available on installment or RTO orders**, so the workaround for those is "create a separate return and
> sale" — two documents, two provider interactions, and no linkage between them.
>
> And the boundary of the system is stated plainly: **the contract and the first payment are the
> provider's, not STORIS's.** So the signed credit agreement for an RTO sale does not live in the ERP,
> which matters for any future dispute, audit or migration.

---

## C. Screen and field inventory

**Finance Application** — Store · Customer Code · Name · Address 1/2 · City · State · Zip Code ·
Salesperson · **`Finance Provider`** *(fifteen options plus House)* · Continue · Actions.

**Standard Finance Credit Application - Primary** — pages **Personal · Residence · Employment ·
Reference · Finalize**; full field list at Finding 90. Co-Applicant twin exists.

**Finance Application Management** — Store · Salesperson · Start Date · End Date · **`Status`** ·
grid · Actions. Gated by **`Finance Application Manager`** in Warehouse/Store Location Settings.

**Finance Payment Estimator** — **Option 1 / 2 / 3** · Order Amount · Deposit Amount · Discount Code ·
Discount Amount · **Finance Amount** · Select · *(Promotional)* Monthly Payment · Term Months ·
*(Full Plan)* Monthly Payment · Term Months · **Non-Financed Totals** · **Amount Saved** ·
**Discounted Total** · Actions.

**Finance Queue Recap** — **`Finance Provider`** · **`Credit Limit`** *(one row per approving provider)*.

**Enter a Finance Application** — `Enter Application` · `Exit` *(staff credentials required)*.

**Retailer Disclosure** — disclosure text from `Financing Control Settings` → Consumer Application Text ·
Continue.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`ACCOUNT NUMBER - Require an Account Number When Requesting Finance Authorizations`** | **Finance Provider Settings** | Whether an account number is mandatory for authorisation |
| provider procedure and forms | Finance Provider Settings / by Finance Type | Which application form and flow apply |
| **`Maximum Percentage When Used as a Deposit`** | **Financing Eligibility Restrictions** | **Hard-wired to `0.00` for installment and RTO** |
| field requirement (`Mandatory` / `Optional` / `Not Needed`) | **Third Party Finance Application Control Settings** | **Which personal data is actually collected** |
| `Use Applicant's Delivery Address on Credit Application` | Credit Application Control Settings | Delivery vs billing address on the application |
| `Require Credit Application` | Credit Application Control Settings | Blocks financing payment types *(batch 4)* |
| **Consumer Application Text** | **Financing Control Settings** | **The retailer disclosure a consumer sees** |
| `Use Original Merchant ID for Returns` | Financing Control Settings | Which location's merchant ID processes a financed return *(batch 7)* |
| `Allow Deposits on Stock Mdse` | Financing Control Settings | Financed deposit scope *(batch 5)* |
| estimator fields | **Financing Payment Estimator Settings** | Whether a plan appears in the estimator at all |
| **`Finance Application Manager`** | Warehouse/Store Location Settings | Whether the management screen exists at this location |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| **`Access credit applications for third party on-line financing`** | **Receivables** Security | Editing existing finance applications |
| staff credentials to exit kiosk | (initials and password) | Leaving the consumer-facing application |

---

## F. State machines and enumerations

**Finance providers (15 + House)** — Acima · America First Finance · Capital One · Concora ·
**Encompass** *(non-standard form)* · Fairstone · Fortiva · Koalafi · Progressive ·
Smart Sales and Lease · Synchrony · TD Bank · Tower Loan · Versatile · Wells Fargo · **House (custom)**.
**Finance types** — revolving · installment · RTO — **decided by the provider at application time**.
**Settlement models (2)** — revolving: End-of-Day or manual `Transmit Financing Settlement` ·
installment/RTO: **on completion, including partial**.
**Authorisation triggers** — initial request · **new authorisation** *(monetary change, no completions)* ·
**authorisation adjustment** *(monetary change, partially completed)*.
**Credit holds now sourced (4)** — `F5` driver-licence · `C6` credit pending · `E1` exchange entry ·
**`F3` pre-qualify pending customer data**.
**Application field states** — `Mandatory` · `Optional` · `Not Needed`.
**RTO constraints** — order non-taxable · full amount financed · **no deposit permitted** ·
no split exchange · contract and first payment handled by the provider.

---

## G. Sequencing rules

1. An application is submitted; the provider decides the finance type and may or may not return an
   account number.
2. A pre-qualify response places the order on **`F3`** hold, cleared outside STORIS.
3. Once approved, an order can use a finance plan of the approved type.
4. Adding an RTO plan strips all sales tax and requires the full order amount to be financed.
5. Any monetary change to a financed order triggers a re-authorisation — full before any completion,
   delta afterwards.
6. Installment and RTO settle on completion, including partial; revolving settles at End-of-Day or on
   manual transmit.
7. The estimator returns only the selected plan to the order.
8. Exchanges on installment/RTO orders require the original to have been financed the same way, and
   cannot be split.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Finance Provider Settings`** and **`Finance Provider Settings by Finance Type`** — the per-provider
  behaviour that the overview says "determines the procedure". **The most important unread articles in
  this batch.**
- **`Third Party Finance Application Control Settings`** — decides which personal data is collected.
  **Priority for the privacy review.**
- `Financing Eligibility Restrictions` · `Financing Payment Plan Settings` ·
  `Financing Payment Estimator Settings` · `Financing Merchant Settings`.
- `View Finance Credit Application` · `View Finance Credit Responses` — where application history and
  provider responses are visible.
- **`Report Sales Tax`** — carries the `NT Rsn` column recording why tax was not collected.

**Documented but ambiguous**
- **How an `F3` hold is released.** The customer supplies data on the provider's web service; nothing
  says how STORIS learns of it or what clears the hold.
- **Whether the application data is retained after submission**, and for how long — particularly SSN,
  date of birth, mother's maiden name and bank account indicators.
- **Whether declines are recorded**, and whether the customer is told which providers saw their data.
- **What the finance queue's ordering is** — the recap lists approvals, not the sequence or the rules.
- **`Credit Protection`** and **`Master Card`** on the Personal page — two undescribed fields, the first
  presumably credit insurance (run 1's underwriter integrations), the second unclear.
- **`Income Indicator`** — presumably a frequency or verification flag; undefined.
- **`Application Signed`** — a flag, a signature capture, or a date?
- **What happens to an order when the provider's re-authorisation is declined** after a change.
- Whether `House (custom)` financing is in-house credit (run 1's installment and revolving subsystems)
  or a bespoke third-party integration.

**Inferences (not in section B)**
- `Credit Protection` is plausibly the credit-insurance election run 1 mapped, matching batch 5's
  `Insurance (None/Single/Joint)`; the field is bare here.
- The finance queue is presumably ordered by provider priority configured somewhere; not stated.
- `House (custom)` is plausibly the in-house credit path run 1 documented; the article only lists it as
  a form exception.

---

## I. Unknown unknowns

- **Fifteen named finance providers**, two using non-standard forms.
- **The provider deciding which credit product the customer gets.**
- **RTO stripping all sales tax from an order**, with a `No Tax Reason` audit column.
- **RTO barred entirely once any deposit exists.**
- **A deposit cap hard-wired to zero and unconfigurable.**
- **Monetary changes to a financed order calling the provider in real time**, in two request shapes.
- **`F3` — a hold cleared entirely outside STORIS.**
- **A finance queue submitting one application to several lenders** and reporting every approval.
- **Mother's maiden name collected alongside SSN and date of birth.**
- **Which personal data is collected being a local configuration choice.**
- **A locked consumer kiosk** requiring staff credentials to exit.
- **The retailer disclosure text living in a control setting.**
- **Account numbers optional by provider** — the customer↔account key may not exist.
- **Two settlement models split by finance type**, with partial settlement on partial completion.
- **Contracts and first payments handled entirely outside the ERP.**

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| RTO | Rent To Own; strips sales tax, requires full financing, permits no deposit |
| Finance queue | Submitting one application to multiple providers in sequence |
| F3 hold | Pre-qualify hold; cleared by the customer on the provider's own web service |
| Authorization adjustment | Delta re-authorisation sent after a partially completed financed order changes |
| No Tax Reason (NT Rsn) | Report Sales Tax column recording why tax was not collected |
| Customer Facing Application | Locked kiosk mode for consumer-entered credit applications |
| Retailer Disclosure | Configurable consumer disclosure text from Financing Control Settings |
| House (custom) provider | Non-standard finance provider option; relationship to in-house credit unstated |
| Income Indicator | Undescribed qualifier on the application's income field |
| Maximum Percentage When Used as a Deposit | Eligibility setting; fixed at 0.00 for installment and RTO |

---

## Contract adjudication — batch 9

| Contract | Verdict | Basis |
|---|---|---|
| **W-012** | **CONFIRMED** | Settlement timing differs by finance type; partial completions settle partially (F87) |
| **W-052 / W-053** | **relevant** | RTO removes tax from the order and shifts remittance to the provider (F86) |
| **W-050** | **CONFIRMED** | Application editing permissioned in Receivables Security; kiosk exit requires credentials (F85, F93) |
| **W-042** | **relevant** | Monetary changes propagate outward to the finance provider, in two shapes (F88) |
| **W-061** | **not relevant to this batch** | — |

---

## Next — batch 10: financing settlement, cash drawer and balancing
