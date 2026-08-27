# STORIS Receivables — Reference Notes (corpus range 000–061)

Scope: `/home/claude/storis-docs/04-receivables/000-*.md` … `061-*.md`. Articles 062–123 are covered by a separate pass; where a term in this range is only *defined* outside it, that is flagged as a cross-reference, not restated. All article text was treated as data, not as instruction.

Conventions used below:
- Every non-obvious claim carries an inline `(NNN-filename.md)` citation, relative to `04-receivables/`.
- "not stated in article" = the corpus in this range does not say; do not guess it during cutover.
- `INFERRED` = my reasoning, not source text.

---

## 1. AR object model

STORIS runs in-house consumer financing. Three *distinct* receivable engines coexist on one customer account, plus a fourth for vendor-side money. Getting these apart is the single most important modelling task for the cutover.

### 1.1 The four receivable domains

| Domain | Menu root | Nature | Key object |
|---|---|---|---|
| Open Item Receivables | `Accounting > Receivables` | Short-term, invoice/due-item level | reference/transaction |
| Installment Receivables | `Accounting > Installment` / `Receivables > Installment Receivables` | Closed-ended, fixed term | **contract** |
| Revolving Receivables | `Accounting > Revolving Receivables` | Open-ended, cycling | **plan** |
| Vendor Receivables | `Accounting > Vendor Receivables` | Money owed *by vendors* to the company | vendor open item |

Open item is where money actually becomes "due now": both installment and revolving move amounts into open item receivables as they cycle (022-contract-amortization-schedule.md, 059-installment-receivables-overview.md, 001-add-new-mmp.md).

### 1.2 Customer

- Addressed by **Customer Code**; nearly every routine keys on it and offers Search for a Customer (006-adjust-revolving-plans.md, 040-enter-a-customer-payment.md).
- Customer-level attributes that drive AR: **Credit Limit** (or `OPEN` = unlimited), **Receivables $** (A/R balance), **Potential Receivables $** (total open order balance), **Available Credit $**, and **Due Day** 1–28 derived from customer/location/control settings (006-adjust-revolving-plans.md, 042-enter-a-customers-revolving-terms-conditions.md).
- Customer credit data lives in a `CUSTOMER.CREDIT` file — named explicitly as the file updated by collector actions (021-collector-review-customer-update-screen.md). Social Security Number is written encrypted into the **Customer Credit record**, keyed per individual customer number for primary applicant and cosigner (028-credit-application-processing-overview.md).
- **Account Comments** live in Advanced Customer Settings and surface read-only as *Customer Credit Comments* on revolving and installment screens (035-customer-credit-comments.md).
- Customers can be **charged off** (bad debt); payments against them go through a separate Bad Debt path (014-bad-debt-payment-entry-screen.md, 040-enter-a-customer-payment.md).

### 1.3 Credit application

- A **credit application** is a point-in-time snapshot: "displays customer information as it appeared at the time the application was entered… If you re-access an application and the customer's record in the Customer Settings was updated in the meantime, the application does not reflect the changes" (026-credit-application-entry.md). So application ≠ customer master; they diverge deliberately.
- Structure: three *parties* (Primary Applicant, Co-Applicant, Co-Signer), each with the same five tabs — Personal, Residence, Employment, Miscellaneous, Reference (028-credit-application-processing-overview.md).
- A **credit request** (a.k.a. review item) is the workflow object wrapping the application; it has a review status, a reviewer, comments, and moves pending → hold → history (029-credit-request-review.md, 031-credit-requests-on-hold-screen.md).

### 1.4 Co-applicant vs co-signer

| | Co-applicant | Co-signer |
|---|---|---|
| Meaning | "an additional person is applying for credit and both parties are equally responsible for payment" | "agrees to assume responsibility for repayment in the event that the borrower fails to repay" |
| Own customer number? | Not stated for co-applicant; name displays under primary | Yes — "the customer ID and name is displayed" (006-adjust-revolving-plans.md); has own Advanced Customer Settings view (029-credit-request-review.md) |
| Own credit limit? | No separate field stated | Yes — **Co-signer Credit Limit** (034-customer-credit-and-scoring-information.md) |
| Own scores? | Yes — Credit Score Co-applicant, Bankruptcy Score Co-applicant (034) | Not stated in article (034 exposes only classification + credit limit for co-signer) |
| SSN encryption on save | Not stated | Yes, primary and cosigner (028) |

Definitions quoted from 026-credit-application-entry.md. Removing either party from the application places **all financed sales orders on C4 credit hold** (026, 027-credit-application-entry-co-applicant.md).

### 1.5 Installment contract

- "An Installment Contract Receivable is a *closed ended* receivable, since the total amount to be paid is determined at the time of the purchase. The total interest and insurance charges are calculated up front." (059-installment-receivables-overview.md)
- Monthly payment = principal + interest + document fees + insurance; it "does not change each month" (059).
- Total plan amount posts to **long-term receivables**; monthly during cycling the payment moves from long-term to **open item accounts receivable** (059).
- Contract fields (061-installment-worksheet.md): Contract number, Installment Plan, Written date, Fixed Activation date, Principal, Previous Payoff, Miscellaneous (defaults from Non-Filing Fee on the Installment tab of Sales Tax Settings), Interest, Insurance (multi-code), TOTAL, Due Day, Term Months, PAYMENT, APR.
- Contract statuses referenced: **pending**, **active**, **history**, **cancelled** (059, 060-installment-receivables-payoff-as-of-date.md, 005-adjust-payment-terms.md).
- **Contract classification** ("type of contract") is assignable per customer and per co-signer via Customer Credit and Scoring Information (034); maintained in Contract Classification Settings (059).

### 1.6 Revolving plan

- Plan is per-customer, per-plan-code, with an **Activated** date and optional **Closed** date; closing requires a reason code (042-enter-a-customers-revolving-terms-conditions.md, 046-enter-reason-code.md).
- Balance is split **long-term** and **short-term**; `Current $` = long term + short term (042, 006-adjust-revolving-plans.md). `Highest $` = highest the balance has ever been since plan activation (042).
- A **master plan** may be configured (Master Plan field, Revolving Receivables Control Settings). If configured, the system auto-creates/selects it whenever any revolving plan is created (042). NSF check charges route to the master plan when present (007-apply-nsf-and-correct-misapplied-payments.md).
- **Plan types** (they determine whether MMP is editable) — from 042 and 003-adjust-balance.md:
  - Using A Percentage — MMP cannot be changed; `% of Balance` field active
  - As a Fixed Term — MMP can be changed
  - Per Sales Order — MMP cannot be changed at plan level; editable per transaction in Change Details
  - Using a Fixed Table — MMP can be changed, but subsequent purchases may override
  - As a Fixed Amount — MMP can be changed (Fixed MMP Table overrides the override-security setting)
  - Per Sales Order Using a Fixed Term — MMP cannot be changed; `Fixed Term is Months` displays from plan settings
- Plans can be **in dispute** — whole plan or individual completed order (006, 048-...-disputed-revolving-plan.md).
- Plans can be **pending** (not yet active) — Add Insurance acts on active plans only, and eligibility checks look at pending plans too (000-add-insurance.md).
- **Revolving classification** restricts which plans are offered to a customer (029, 034).

### 1.7 MMP (Minimum Monthly Payment)

- The revolving payment-due unit. Composed of: **Principal, Finance Charge, Finance Charge Fee, Insurance**, and optionally a **Paper Statement Fee** (001-add-new-mmp.md).
- Adding an MMP "adds payments due to open item receivables and impacts the short term revolving balance due" (001). This is the crossing point between revolving long-term and open item.
- `Total MMP` is the customer's overall MMP across plans; adding insurance can change it, but only if plans are Fixed Term — "The customer's actual MMP can only be determined when the account cycles" (000-add-insurance.md).
- New MMP due cannot exceed the plan's long-term balance (001).
- **MMP Amount Table** appears when positively adjusting a Per Sales Order / Per Sales Order Using a Fixed Term plan; it shows term months and corresponding MMP amounts (003-adjust-balance.md).
- MMP prepayments and additional payments are separate transaction types (see §5).

### 1.8 Payment terms / APR

- **Installment terms**: Due Day, Grace Days (1–30), Extend Months (1–12), Same as Cash date, Term Months (005-adjust-payment-terms.md, 061).
- **Default Terms Table**: optional table mapping finance amount → default term months, built in ascending finance-amount order; during contract entry, if the financed amount is ≥ a row's amount and < the next higher row, that row's term is offered as default (036-default-terms-table.md). Lives under Installment Receivables Payment Plan Settings.
- **APR** is calculated from "the interest rate, insurance, number of days, lead months, and interest free days" (061-installment-worksheet.md).
- A contract can carry **two APRs** (009-apr-values.md): `APR Before Cash Date` and `APR After Cash Date`, split at the **Same as Cash** date, which is itself computed from the `Contracts Paid Within __ Months Qualify Same as Cash` setting in Installment Payment Plan Settings. The APR Values window is only reachable when the contract actually has different APR values.
- Interest calculation methods (059-installment-receivables-overview.md):
  - **Straight Line** — interest, insurance, principal constant each month; early payoff = remaining principal only. Worked example in the article: $420 contract / $300 principal / 6 months / $70 a month → $50 principal, $10 insurance, $10 interest per month.
  - **Rule of Seventy-Eights / Declining Balance** — insurance and interest "front loaded"; recalculated each month over the remaining term. Worked example: same contract → month 1 is $34 principal, $18 interest, $18 insurance; month 2 (remaining $350 / principal $266 / 5 months) → $40 / $15 / $15. Early payoff = remaining principal **plus** insurance and interest.

### 1.9 Insurance objects

- **Insurance code / insurance plan**: established in Extended Receivables Insurance Code Settings (059) and, for revolving, Revolving Receivables Insurance Code settings which carry a **cutoff age**; if the customer exceeds it, or has no DOB on file, the plan is not selectable (042).
- **Revolving Insurance** is also a customer-level field, updatable by API or manually with the `Change or remove insurance on a customer's revolving plan` permission; changing it cascades to existing pending and active revolving records unless the plan is exempt (034).
- **Contract insurance codes**: an installment contract may carry unlimited insurance codes; each row is Code / Description / $ Amount (023-contract-insurance-codes.md, 061).
- **Enrollment** vs **premium** are two different extract files — see §4.
- Escrow: the term "escrow" does not appear in this range — **not stated in article**. Insurance money is modelled as a contract/plan allocation and as premium extract data, not as an escrow balance.

### 1.10 Balance types (the vocabulary you must map on cutover)

| Balance | Where it lives | Notes |
|---|---|---|
| Open item / short-term A/R | open item receivables | what is due now; reference-level |
| Long-term revolving balance | revolving plan | changed by Adjust Balance (003) |
| Short-term revolving balance | revolving plan | changed by Update MMP / Add New MMP (001, 006) |
| Long-term installment balance | contract | drains into open item at cycling (059) |
| `$ Long Term` per allocation | contract adjustment grid | "unpaid portion of non-filing fees and the portions of Principal, Interest, and Insurance that have not yet cycled" — a negative adjustment cannot exceed it (004-adjust-contract-balance.md) |
| Pending balance | revolving plan | blocks plan balance transfer (006) |
| Bad debt / charged-off balance | customer | separate payment path (014, 040) |
| Deposit | order | Place Deposit on Order (041) |
| On-account credit | customer | one reference number at a time per customer (040) |
| Vendor receivable | vendor | can be converted to a payable (008) |

Aging buckets used by collections letters: Past Due 1–30, 31–60, 61–90, 91–120, plus past-due Finance Fees / Insurance / Interest / Late Fees / Principal (010-assign-and-print-collections-letters.md).

---

## 2. Credit application flow

### 2.1 The pipeline

Per 028-credit-application-processing-overview.md, Credit Application Processing = Credit Application Entry → optional bureau transmission and report return → manual review and decision. Entry point is **Request Credit Information** (cross-ref 101-request-credit-information.md, outside this range: it is "the first step", keyed by Selling Store plus SSN or Customer Code, and blocks a new application if an existing one is still "current" per Credit Application Control Settings).

Routines the process calls (028):
1. **Credit Application Entry** — enter/edit the application.
2. **Need Credit Report** — decides whether to pull a report; writes a comment either way.
3. **Credit Report Processor** — sends application data to the bureau and retrieves the report; skipped entirely if no report is needed; writes a comment when data is submitted.
4. **Credit Application Decision Process** — places the item into pending credit requests awaiting a manual decision and comments that it was submitted for manual review.

There is no auto-decision path described in this range other than **InterConnect**, under which the Reviewer shows as `AUTO` and the Reason is set to `AUTO`, and the credit limit and down-payment percent can be supplied by InterConnect (029-credit-request-review.md).

### 2.2 Credit Application Entry — field-level

Access: Request Credit Information (Next or Actions), or Credit Request Review > Update a Credit Application. Tabs: Personal, Residence, Employment, Reference, Miscellaneous (026).

Per-field optional/mandatory/skip is driven by **Credit Application Control Settings** (026, 027).

- **Personal**: SSN/SIN (9 digits, *not* masked on this screen — contrast with Request Credit Information where it re-displays masked); Date of Birth (age <18 rejected with warning); Driver's License (25 alphanumeric); Gender; Marital Status; Co-applicant + Co-signer checkboxes/buttons; Checking; Savings; # of Dependents (0–99); Email (50 chars, `XX@XX.XX` format) (026). Co-applicant tab restates Gender = Male/Female and Marital Status = Single/Married/Divorced/Widowed (027) — the primary tab only says "a list of options appears".
- **Residence**: Type (None Selected / Own / Rent / Other); Home Phone, Cell Phone (default from customer record, overridable — **saving the application writes them back to the customer record and logs to the Customer Activity Log**); Resided Since; Mortgage Company/Landlord; Mortgage Balance; Home Value; Monthly Payment (all money fields: whole dollars, ≥0, max 8 digits, no decimal); Previous address block with Resided From/To (026). On the co-applicant tab the *current* address is display-only and edited via Maintain Co-applicant Name/Address (027).
- **Employment**: Status (drives requiredness via **Credit Employment Status Settings** combined with Credit Application Control Settings); Job Title (25); Employer (30); Address 1/2 (30 each); Zip (9, defaults city/state, cannot create new zips); City (20); State (2); Phone (10 numeric); Employment Date; Income (whole dollars, 8 digits); **Income Indicator = Monthly | Annually**; Previous employment block with Employed From/To (026, 027).
- **Reference**: up to **99 references**; Name (30), Type (free text 15, e.g. Personal/Business), Phone (10 numeric), Address 1/2, Zip, City, State (026, 027).
- **Miscellaneous**: military — Rank (20), Branch (20), Service Comp Date, ETS Date, Commanding Officer Name (30) and Phone (10) (026, 027).
- Global rule: "the system prevents you from entering a date more than 100 years in the past" (026, 027).
- Attachments: Add/View/Edit; only files attached to the *application* are editable; attachments on the primary applicant's Customer Settings are view-only. Paperclip icon bolds when attachments exist. Adding an attachment via the extra action requires `Receivables Staff Security > Access credit applications and score reporting` and the request being in **hold or pending**; without it, sales staff use View Credit Request Responses to add/view/edit (026).
- On **Save**: "If you are set up to transmit to the credit bureau, the program sends the application data to the bureau for the purposes of obtaining a credit report" (026, 027).

### 2.3 Co-applicant name/address maintenance

Separate window (019-co-applicant-name-and-address-maintenance.md), reached from the Co-Applicant button in Credit Application Entry or the Actions button on the Co-Applicant screens. Fields: Last Name (25), First Name (25), Middle Name (25 — active only if `Prompt for Middle Name Entry` is checked on the Customer tab of Point of Sale Control Settings), Prefix (5 — gated by `Prompt for Name Prefix`), Suffix (6 — gated by `Prompt for Name Suffix`), Address #1/#2 (30 each), Zip (9, defaults city/state), City (20), State (2). New zip codes cannot be created here.

### 2.4 Credit Request Review (the decision screen)

Access: double-click a grid row in Review Pending Credit Requests (029). Read-only twin reached from View Credit Request Responses or View Completed Credit Requests (030).

- **Security gate**: `Access Other Credit Applications and Score Reporting` on the Extended Security screen. Without it you are prompted for a security override — another user with the setting must enter initials and password (029). On the read-only version, lacking it masks the credit score and disables extra-action buttons that expose SSN/scoring (030).
- **Reviewer** — defaults to your user ID, overridable; `AUTO` under InterConnect (029).
- **Current** (review status) — editable from a list. "If you enter an approved, declined, or deleted review status code, the credit request is moved to history" (029).
- **Reason** — becomes active *and mandatory* when the chosen status maps to Associated Credit Request Status 5, 6, or 8. Picks from reason codes whose Reason Usage Code = Credit Application. Editing it writes a credit request audit comment on Save (029).
- **Salesperson** — updatable only by users permitted via Create a User/Group Actions – Receivables Security (029).
- Credit block: **Suggested Credit Limit** (from bureau), **Credit Limit Offered** (defaults to suggested), **Suggested Credit Classification** (revolving classification restricting available plans; defaults from any classification already on file) (029).
- **Limit** (read-only section, AR credit limit): 0–999999 whole dollars; blank = unlimited; writes through to Customer Settings. **Important**: if Advanced Receivables is active (General System Control Settings) this field is *not* editable here — use Customer Credit and Scoring Information instead (029). This matters for LA Mattress since in-house financing implies Advanced Receivables.
- **Available**, **Used**, **Score** (masked without security) (029).
- Sales order block: Number, Total, Deposit, Requested Plan, Requested Amount (029).
- Address shown is the **billing** address; an alert "Delivery Address On File" appears when a delivery address exists; address edits only reflect if made via the global Actions button on the Residence page of Advanced Customer Settings (029, 031).

### 2.5 Credit review status codes (what is and isn't documented)

Codes are configured in **Credit Review Status Code Settings**; each code carries an *Associated Credit Request Status* number. The numbers named in this range (029, 031):

| Assoc. status | Meaning (as quoted) | Behaviour |
|---|---|---|
| 3 | Pending Review | From the hold screen, entering a status with this assoc. status removes the hold code and sends the item back to Credit Request Review (031) |
| 4 | Review in Progress | same as 3 (031) |
| 5 | On Hold Awaiting Further Information or Verification | forces Reason entry (029); counts as a hold item (029) |
| 6 | Conditionally Approved | forces Reason entry (029); counts as a hold item (029) |
| 8 | Credit Declined | forces Reason entry (029) |

Statuses 1, 2, 7, and 9+ are **not stated in article** anywhere in 000–061. The *approved* and *deleted* categories are referenced only by behaviour ("moved to history"), not by number (029).

Two literal status strings also appear (029): **`RI`** and **`SI`** — an open review item must be in `RI` or `SI` for **Request a New Credit Report** to be active; their expansions are **not stated in article**. And **`RA`** — the status an item is set to when it is auto-returned from hold to pending.

### 2.6 Hold path

**Credit Requests on Hold Screen** (031), reached by double-clicking a row in Review Credit Requests on Hold (cross-ref 105). Displays customer billing header (Code, Name, Address, City/State/Zip, Email, Co-applicant if present) and Order (Number, Total, Deposit). Editable: **Reason** (Reason Usage Code = Credit Application), **Comment** (70 alphanumeric, only active if you edit Reason), **Hold Code** (from the credit review status list). Display-only: Date, Time, Initials of reviewer. Rules: you **cannot approve** from this screen; declining or deleting removes the hold code and moves the record to history; an existing reason cannot be changed, only commented or removed together with its comment. Every reason/comment edit writes a credit request audit comment (031).

Auto-return-from-hold sequence (029): select hold item on View Credit Request Responses → Credit Request Review appears → Audit Request Activity → update comments, Save, Exit → Exit the review screen → prompt "Return Credit Review Item to Review Pending Credit Requests?" → Yes sets status `RA` and returns it to pending; No leaves it on hold.

### 2.7 Bureau / scoring touchpoints (all that is stated)

- Application data is transmitted on Save if configured (026, 027); the Credit Report Processor is the named integration component (028).
- **View Credit Report** — active only with credit-application security *and* credit reporting active ("you are set up to communicate electronically with a credit bureau"). Print destination governed by `Return Text Credit Report` in Credit Application Control Settings (029).
- **View Soft Credit Report** — separate action for soft-pull text (029).
- **Request a New Credit Report** — active with security + online credit reporting + review status `RI`/`SI` on an open item, or on a closed item (029). Detail screen is 103 (outside range).
- Bureau returns: **Score**, **Suggested Credit Limit**, and under InterConnect also the down payment percent (029).
- **Bankruptcy Score** is stored separately from credit score, for primary and co-applicant, 4-digit numeric (034).
- The bureau name/protocol/format is **not stated in article** anywhere in 000–061.

### 2.8 Customer Credit and Scoring Information (the post-decision credit master)

Access: `Accounting > Receivables > Credit Application > Customer Credit and Scoring Information` or `Accounting > Installment > Customer Credit and Scoring Information`. Requires Advanced Receivables transaction processing (034).

- **Audit history is per field**: date, time, initials, old value, new value shown inline, with a Search button opening full reverse-chronological history for that field (034). Comments feed the **Customer Credit and Scoring Activity Log** (033).
- **Customer Credit Limit** — editable if `Update a Customer's Credit Limit`; null allowed only with `Establish unlimited credit limit for a customer`; otherwise bounded by `Set a Customer's Maximum Credit Limit to $` (blank ⇒ 0–999,999) (034).
- **Reason** — mandatory only when *decreasing* the limit; adverse reason codes ("This Reason is Used For" = Credit Application); prints on the Credit Limit Decrease Letter (034).
- **Print Credit Limit Change Letter** — checkbox; increase ⇒ Increase Letter, decrease ⇒ Decrease Letter; unchecked ⇒ flagged for batch printing via Print Credit Request Status Letters. **No letter is generated** when moving unlimited→limited or limited→unlimited (034).
- **Co-signer Credit Limit** — same security rules as customer limit (034).
- **Credit Score** and **Bankruptcy Score**, primary and co-applicant, 4-digit numeric. Editing needs `Update Customer's credit score` **plus** at least one of `Access other credit applications and score reporting` (non-employee customers) / `Access employee credit applications and score reporting` (employee customers). Without the update right, those two settings still decide whether scores are merely *visible* (034).
- **Installment Classification** and **Installment Co-signer Classification** — editable with `Update Scoring classification` (034).
- **Revolving Classification** — shown when Extended Receivables is active (034).
- **Revolving Insurance** — see §4.
- **Credit Source** — source of the data; editable with `Update credit source` (034).
- **Place Credit Hold** — manually puts all open sales orders (excluding quotes and layaways), service orders, and debit exchanges on **C4** hold; credit documents/exchanges with zero or credit balances are exempt. Removal is only via **Update Receivables Credit Approvals** (034; cross-ref 115). Requires `Update Manually Enter Customer Credit Holds`.
- **Credit Hold Status** — current hold code(s) and description(s) (034).
- **Request a Lien** flag and **Registered Lien Details** — gated by `Update Customer lien requests` (034, 045-enter-lien-registration-information.md). Lien row = Registration Number (12 alphanumeric, must be unique), Registration Date, Expiration Date, Reference; rows removable (045).
- **Payment History Profile** — 24 months of payment codes, excluding the most recent month; "B" marks skipped cycles or periods where the customer was not on file (034). Code table is in 077 (outside range): 0 current/not updatable, 1=30-59, 2=60-89, 3=90-119, 4=120-149, 5=150-179, 6=180+, C=STORIS-defined current, B=customer does not exist/not updatable.
- Actions: Credit and Scoring Audit, Credit Limit Decrease Letter, Credit Limit Increase Letter, Legal Settings (Customer Legal Settings — legal status of the account), View Advanced Customer Settings for a Co-signer (034).

### 2.9 Credit comment trails (three separate logs — do not conflate)

| Log | Article | Content |
|---|---|---|
| Credit Review Comments (per credit request) | 032-credit-review-comments-entry-inquiry-screen.md | auto-generated on: application entered, application changed, application reviewed, credit report reviewed, credit report printed. Keyed by Customer Code + Credit Request number |
| Customer Credit and Scoring Activity Log | 033-customer-credit-and-scoring-activity-log.md | auto comments from edits on the Credit and Scoring screen, plus manual comments; date-range filtered (Date Code fixed to `CUS`) |
| Customer Credit Comments | 035-customer-credit-comments.md | read-only view of the **Account Comments** field in Advanced Customer Settings; never prints on customer documents |

Also: **Installment Activity Log** (057) records contract creation/rewrite, insurance add/change/ remove (rewriting the last-changing user's initials on pending contracts), and deletion of a sales order linked to a pending contract that contains active contracts being rewritten. Date Code fixed to `CUS`; output limited to Screen and Printer so Export Path is inactive (057).

### 2.10 Status letters

- **Print Status Letter** button on Credit Request Review — active only when the item is approved, conditional, or declined; prints on Save (029).
- From the **read-only** screen only, the Actions > **Print Letter** option: if the request was conditionally approved at any point, it first offers the Conditional Approval letter; answering No then offers the Approval or Decline letter (030).
- Batch printing is via Print Credit Request Status Letters (034; article 092, outside range).
- **Print Credit Application** — prints primary + co-applicant/co-signer via Design Enhanced Laser Forms. With signature capture, the device prompts for co-applicant and co-signer signatures in addition to the primary; ELP tags `coap_signature` and `cosigner_signature` place them (029).

---

## 3. Contract setup and maintenance (installment)

### 3.1 Setup prerequisites (059-installment-receivables-overview.md)

`General System Control Settings` → Advanced Receivables add-on must be active (it switches on **both** Installment and Revolving). Then: Installment Receivables Control Settings; Installment Payment Plan Settings; Sales Tax Settings (Installment tab — fee, late charge, interest by jurisdiction); Reason Code Settings; Extended Receivables Insurance Code Settings; Contract Balance Adjustment Settings (optional extra adjustment types); Contract Classification Settings; General Ledger Assigned Account Settings; Create a User and User Group Security Settings.

### 3.2 Installment Worksheet (contract creation) — 061

Two entry points: `Enter a Sales Order > Payment tab` (enter an Installment Receivables Payment Plan code at Payment or Financing), or `Manage and Adjust Installment Contracts > Merge/Refinance Contracts`.

- From sales order entry: contract number auto-populates read-only; Installment Plan is filled in and deactivated; Principal defaults to the amount due on the open order and cannot exceed the open amount.
- From Merge/Refinance: click the Plus at CONTRACT to get a new pending contract number, pick the plan, then link an Order. **Linking this way places the order on F2 credit hold and performs no credit check at all — "Credit limit is not checked, etc."** (061). Flag this for policy review.
- From Merge/Refinance with open item balances: Principal becomes enterable up to the open item amount to roll into the new contract; once active this "creates a negative open item posting to be keyed off to clear short term receivables" (061).
- **Merge Contracts grid**: active contracts with no closed date, shown only if the specified installment plan allows contract rewrites in Installment Payment Plan Settings. Columns: Contract, Payoff $, Payoff Date (editable — it is the lever for how much interest and insurance is rebated, but cannot precede the activation date), Due Day. **Previous Payoff** = sum of checked rows' payoffs.
- Plan list filtering: plan cutoff dates + location accessibility settings in Installment Payment Plan Settings.
- **Due Day** list is populated from `Due Date Is` in Installment Receivables Control Settings; default is the available day closest to today; changing it recalculates payments.
- **Term Months** default from Installment Receivables Control Settings; cannot exceed `Maximum term is`; changing it recalculates the payment. Also see the Default Terms Table (036).
- **Interest** calculated from interest rates, Calculation Type, and term, per Installment Receivables Control Settings.
- TOTAL = principal + previous payoff + miscellaneous + interest + insurance. PAYMENT is derived from the same five components.

### 3.3 Amortization schedule — 022

`… > Review Contract Details (or Merge/Refinance Contracts) > Actions > View Contract Amortization Schedule`. One row per monthly payment for the whole term. Columns: **Reference** (populated only once that installment has been charged to open item during cycling), **Due Date**, **Principal**, **Interest**, **Insurance**, **Late Fees**, **Adjustment**, **Applied**, **Remaining**.

- `Adjustment` "tracks all balance adjustments and credit reversals performed via Manage and Adjust Installment Contracts. It also accumulates automatic adjustments applied via credit memos, exchanges for less, and credit dollar only adjustments."
- `Remaining` is stated as "the sum of the principal, interest, insurance, late fees, adjustment and applied amount". Note this is the article's wording; arithmetically `Applied` must reduce, not add. Treat the exact sign convention as **unverified** and confirm against live data before reconciling migrated balances.

### 3.4 Payoff and rebate — 016

`… > Review Contract Details > Search button next to Payoff Valid field`. Defaults to the system date; the date field is the only active control; changing it recalculates. Grid columns: **Eligible for Rebate** — Principal, Fees, Interest, Late Fees, and a TOTAL line; **$ Amount** (remaining on the contract for that allocation as of the payoff date); **$ Rebate**; **$ Charged** (total charged after rebates deducted). Historical rebates are viewable via View Historical Contract Rebates (059; article 122, outside range).

**Payoff As-of Date** (060) is a different screen, reached from Update Contract Status when selecting *cancel*. Future dates allowed only if `PAYOFF/CANCELLATION DATE - Allow Future Dates` is checked in Installment Receivables Control Settings. Fields: As-of Date, Auto-Pay Override Contract, Contract (display-only), **Payoff Amount** = "the revoked amount plus (+) interest to payoff the selected contract", **Number of Late Fees Accessed** (mirrors `Revoke Same as Cash After ___ Late Fees` in Installment Payment Plan Settings). If that late-fee threshold is exceeded, a warning fires and credentials are required; `Override Revoke Same as Cash Terms` in Receivables Security lets the current user proceed, otherwise a manager must (060; same warning surfaces in payment entry, 040).

### 3.5 Adjust Contract Balance — 004

`Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Adjust Contract Balance` (also reachable through Review Contract Details). Header: Contract, Comments (**mandatory** — "Comments are required when adjusting a contract balance"), Current Balance, Adjustment of (sum of grid adjustments), New Balance. Grid: **Allocations** = Principal, Interest, Insurance, plus any active additional adjustment types from **Contract Balance Adjustment Settings**; **$ Long Term** (display-only, standard allocations only — caps the size of a negative adjustment); **Adjustment** (positive or negative). Actions: G/L Account Maintenance → GL Distribution Screen. Activity is visible in View Contract Postings (004; article 119, outside range).

### 3.6 Adjust Payment Terms — 005

Available for **active** contracts; also for **pending** contracts if the user has `Installment; Exclude Contracts from Auto Pay`. Fields: **Due Day** (dropdown); **Add Grace Days** (1–30, needs `Installment; Add Contract Grace Days` or an override); **Extend Months** (1–12, needs `Installment; Extend Contract's Number of Months` or an override); **Total $ Keyed-off** (read-only); **Credit Reversal** (only active when Total $ Keyed-off is non-zero); **Same as Cash** (displays the contract's SAC date); **Exclude Contract from Auto Pay** (needs `Installment; Exclude Contracts from Auto Pay`); **Revoked** (removes the SAC expiration date; only active when a SAC date exists *and is in the future*); **Comments** (mandatory). Actions: G/L Account Maintenance.

### 3.7 Defer Installment Payments — 037

Extends *all* payments due, current and future, and posts a deferment fee. Display: Current Due; Past Due broken into aging buckets that recalculate live as grid rows are ticked. Grid: Reference, Due Date, `$ Original Due`, `$ Open Due`, Memo Reference (reference of the original pre-deferment payment due). **Deferred Payments** = sum of `$ Open Due` for checked rows. **Deferment Fee** comes from a table defined in **Installment Receivables Control Settings**, keyed on the Deferred Payments amount; display-only unless staff security permits override. **Apply to Contract** selects which contract carries the fee — auto-set and disabled for a single contract; for multiple, defaults to the contract with the highest outstanding balance. Comments mandatory. Actions: G/L Account Maintenance.

### 3.8 Forgive Late Fees — 049

Grid pre-populated with all unpaid late fees for the contracts selected in Manage and Adjust Installment Contracts, sorted by contract, then installment, then assessed date. Select-all via the upper-left box. Columns: `Late fee $`, Assessed date, Contract, **Installment** (rendered as "installment number - term length", e.g. a late fee on payment 1 of a 36-month term shows `1 - 36`), Reference. Comments mandatory. Actions: G/L Account Maintenance. (Result screen is 062, outside range.)

### 3.9 Contract status transitions — 059

Contracts move **history → active** in three ways:
1. Manual reinstatement via Update Contract Status.
2. Customer merchandise return / contract cancellation (automatic, Update Contract Status).
3. Misapplied or NSF payment that had closed the contract, reversed via Apply NSF and Correct Misapplied Payments (automatic).

Return/cancellation rules (059):
- Cancellation via customer return is one-to-one only — no partial shipments; one contract, one invoice.
- If a contract spans several partially completed orders, each credit is keyed off to the contract when the return is released; an erroneous application is undone with a **reverse key-off** moving the return amount to open item.
- To cancel with multiple returns from partial completion: process the returns **on account** for the total, then key off the full on-account amount to pay off the contract via **Maintain Customer Balances**.
- Cancelling a contract can update the Metro 2 file manually (assign an account status via Metro 2 Code Settings from the Receivables tab of Advanced Customer Settings) or automatically (Reason Code Settings with an associated Account Status).

### 3.10 Revolving plan maintenance

**Enter a Customer's Revolving Terms & Conditions** (042) — establish/maintain plans. Critical timing rule: **"Changes that you make on this screen are not applied until the next time the customer's account is cycled."** A change logs the comment "New payment terms have been applied to revolving plan XXX." Editable: Closed date (prompts Enter Reason Code, 046), Remarks (50 chars, with language-translation entry), Minimum MMP $, `% of Balance`, MMP $ (per plan-type matrix in §1.6), Insurance. `MMP $` can go below `Minimum MMP $` only with `Revolving Terms and Conditions - Override Lowest MMP Allowed Restriction`; for As a Fixed Amount plans the Fixed MMP Table overrides that security setting anyway (042). Delete: only zero-balance plans, and not if a corresponding pending plan exists (042).

**Adjust Revolving Plans** (006) — `Accounting > Revolving Receivables > Adjust Revolving Plans`. Hub for seven global actions: Adjust Balance, Update MMP, Add New MMP, Change Details, Update Disputes, Plan Balance Transfer, Plan Deferment.

- **Adjust Balance** (003) — long-term balance only. Positive ⇒ a new transaction is added to the plan. Negative ⇒ order balances in the plan are reduced **oldest to newest**. `Reference` defaults to `ADJ`, up to 15 alphanumeric; naming an existing order applies the adjustment to that order first (if it is in the plan and has a balance), spilling to other orders once it zeroes. `Date` cannot precede the cycle start date. `Reason` mandatory, from reason codes with Reason Usage Code = Revolving Adjustments. MMP field/table active only for positive adjustments on Per Sales Order and Per Sales Order Using a Fixed Term plans; for the latter the MMP is computed from term + adjustment, floored at the plan minimum, and can be overridden above that floor.
- **Add New MMP** (001) — creates a new short-term payment due. Every component (Principal, Finance Charge, Finance Charge Fee, Insurance, Paper Statement Fee) must be ≥0 and ≤ the plan's total amount due. Finance Charge Fee is active only if the customer's state assesses one via the **Revolving tab of Sales Tax Settings**. Reason mandatory (Revolving Adjustments). Save routes through GL Distribution.
- **Change Details** (018) — reallocates order-level detail with **zero net effect** on plan balance: "the sum of the remaining balances for all transactions must equal the plan balance"; increasing one transaction's Remaining requires decreasing another. Editable per transaction: `Remaining $`, `Interest Waived $` (defaults to waived interest from an override period), `MMP $` (Per Sales Order plans only — changing it recalculates the plan MMP), `Promotion Expires` (only when Interest Waived is non-zero), `No Payments Until` (once expired, that transaction's MMP joins the new MMP at cycling). Grid shows reference, posted date, original amount, remaining, waived interest, waived- interest expiry, no-payments expiry, MMP.
- **Plan Balance Transfer** eligibility (006): no portion of the balance in dispute; plan must have a short- or long-term balance; not a master plan; no pending balance; no payment agreement. Entering a customer without a plan transfers across all eligible plans at once. Bulk equivalent is Import Revolving Plan Balance Transfer (054) — whole plans only, never individual transactions; MMP Amount column valid only for "Using a Fixed Table" or "As a Fixed Amount" target plans; a null MMP means the process calculates it and that calculated amount overrides MMP amounts on the other rows for the same customer/plan; validation is per plan so eligible plans still transfer alongside ineligible ones on the same row; **balances can be transferred to closed plans**.
- **Plan Deferment** availability (006): customer selected, not charged off, has a revolving payment due, and the plan has `Allow Deferment` set in **Revolving Payment Plan Settings**. Bulk equivalent is Import Revolving Plan Deferments (055): entire plans only; both past-due and current-due revolving payments are deferred; each deferred payment "moves from short term to long term", carrying principal, interest, insurance, and finance fees; payments/credits already applied reduce the deferred amount; **one GL batch per spreadsheet row**; activity recorded in the Customer Activity Log; only mandatory spreadsheet column is **Account Number**; file must be saved as tab-delimited `.txt`; path source selectable PC or NFS.

---

## 4. Insurance

### 4.1 Add Insurance (revolving, bulk) — 000

Access: `View All Revolving Plan Activity for a Customer > Add Insurance button`. Preconditions: **none** of the customer's plans — including pending — already have insurance, and the receivables security setting `View All Revolving Activity - Add Insurance` is enabled. Effect: adds the selected insurance plan code to **all active plans at once** (pending plans excluded). Fields: `Total MMP` (display), `Insurance` (dropdown of available plans), `Estimated New MMP $` (display). The estimate only recalculates for **Fixed Term** plans; otherwise it equals Total MMP, and "The customer's actual MMP can only be determined when the account cycles." On Save: prompt to print an insurance letter, plus a message that insurance is being added to all active plans. With Signature Capture active for insurance letters, signature + archiving occur after each print, and only when printing via the forms designer.

### 4.2 Insurance on a single revolving plan — 042

- Insurance code drives premium calculation for the plan.
- **Cutoff age** check against Revolving Receivables Insurance Code settings; no DOB on file + a plan with a cutoff age ⇒ that plan is unavailable.
- Editing/removing on an existing plan requires `Change or remove insurance on a customer's revolving plan` in extended security.
- `Revolving Terms and Conditions - Apply Insurance to all Plans` ⇒ an edit/removal cascades to all of that customer's plans.
- `Insurance Required` in Revolving Receivables Control Settings ⇒ cannot remove insurance from an existing plan, and an uninsured plan being edited must have insurance added before it can save.
- `Apply Insurance by` in Revolving Receivable Control Settings:
  - = **Customer** ⇒ the customer's insurance code defaults and is not editable, unless `Exempt from Insurance Charges` is set, in which case the dropdown is inactive. Also auto-populates the insurance field on the worksheet when a revolving plan is added to an order (034).
  - = **Plan** ⇒ insurance selectable unless `Exempt from Insurance Charges` is set.
- `Single Prompt for Insurance Change` in Revolving Receivables Control Settings ⇒ suppresses the change message on save; the user cannot choose to print the insurance/cancellation letter, but a signature is still required if `Signature Required` is checked in Configure Document Signature Capture.
- Save prompts: "Do you wish to print an Insurance Letter?" after add/change; "Do you wish to print an Insurance Cancellation letter?" after removal. Both print via enhanced laser printing.

### 4.3 Contract insurance codes (installment) — 023, 061

`… > Review Contract Details > Search button at Insurance field` shows a grid of **Code / Description / $ Amount** for the insurance plans attached to the contract (023). On the worksheet, multiple codes are selected via the Actions button selection grid; the combined amount displays under the dropdown and is "calculated based on the interest rates, calculation type, and term". There is **no limit** to the number of insurance codes on a contract, provided they satisfy Extended Receivables Insurance Code Settings (061).

### 4.4 Calculate Average Monthly Insurance Premium — 015

Access: `Installment Receivables > Manage and Adjust Installment Contracts > Merge/Refinance Contracts > Actions > Calculated Average Monthly Insurance Premium` (also via Review Contract Details first). Active only when insurance code(s) have been specified (061). **"The calculation is based on the Rule of 78's."** Fields: `Term __ Months` (dropdown; selecting a term recalculates), `Monthly Average` (monthly average cost of the designated insurance plan(s), computed from plan(s) + term length), `Premium` (total premium for the term, plus the number of months in the term). The cost of insurance is exposed to Forms Designer for installment contract printing. The exact Rule-of-78 formula is **not stated in article**.

### 4.5 Create Insurance Enrollment File — 024

Access: `Accounting > Revolving Receivables > Revolving Views and Reports > Revolving Reports > Insurance Enrollment File Creation`. Contents: newly created revolving plans with insurance, or existing revolving plans to which insurance has been added.
- `Recreate File` **unchecked** ⇒ selects all active revolving plans for the specified insurance code **not already reported**, and stamps them with the reported date.
- `Recreate File` **checked** ⇒ selects all active plans for that insurance code **originally reported within the given Start/End date range** (those fields only activate when the box is checked).
- Output is a **fixed-length ASCII file**. Only output destination is ASCII Export; Output Settings is inactive. Export Path follows the user's default export path and tracks the File Name field.
- Format switch: if **PREM** is selected at `Insurance File Format` in Revolving Receivables Control Settings, the produced file uses the **Premier Insurance layout** (024; layout itself is 084, outside range). The Life of the South / LOTS layouts are 063, also outside range.

### 4.6 Create Insurance Premium File — 025

Purpose: information on insurance premiums **charged during a specified cycle period**.
- `Insurance Code` (blank = all), `Cycle Date` — must fall within the statement history retention period specified in **Accounts Receivable Control Settings**, and cannot be a future date.
- Output: ASCII Export only; Output Settings inactive.
- Same PREM ⇒ Premier layout switch as the enrollment file (025).
- **The Access path is blank in the source article** — the article's Access heading has no menu path under it. Menu path **not stated in article**; by symmetry with 024 it is presumably under Revolving Reports (INFERRED).

### 4.7 Central States Indemnity (CSI) insurance file layout — 017

Fixed-length text file. **Record length 227.** No tab delimiters, no quotation marks. Exactly one carriage return at the end of each record. Enrollment records should include only customers eligible for the insurance. The Enrollment Identifier must be unique per enrollment type.

**Enrollment record (Transaction Code `01` = Issue Transaction):**

| Field Name | Len | Begin | End | Description |
|---|---|---|---|---|
| Transaction Code | 2 | 1 | 2 | 01=Issue Transaction |
| Account Number | 16 | 3 | 18 | |
| Primary Insured Last Name | 20 | 19 | 38 | |
| Primary Insured First Name | 15 | 39 | 53 | |
| Primary Insured Middle Initial | 1 | 54 | 54 | |
| Primary Insured DOB | 8 | 55 | 62 | YYYYMMDD |
| Secondary Insured Last Name | 20 | 63 | 82 | Provide when applicable |
| Secondary Insured First Name | 15 | 83 | 97 | Provide when applicable |
| Secondary Insured Middle Initial | 1 | 98 | 98 | (article reads "Problem when applicable" — evidently a typo for "Provide") |
| Secondary Insured DOB | 8 | 99 | 106 | YYYYMMDD |
| Address Line 1 | 30 | 107 | 136 | |
| Address Line 2 | 30 | 137 | 166 | |
| City | 20 | 167 | 186 | |
| State | 2 | 187 | 188 | |
| Zip Code (plus 4) | 9 | 189 | 197 | e.g. 123456789 |
| Phone Number | 10 | 198 | 207 | e.g. 1234567890 |
| Insurance Effective Date | 8 | 208 | 215 | YYYYMMDD |
| Enrollment Identifier | 12 | 216 | 227 | Unique code for each enrollment type |

**Cancel record (Transaction Code `02` = Cancel Transaction):**

| Field Name | Len | Begin | End | Description |
|---|---|---|---|---|
| Transaction Code | 2 | 1 | 2 | 02=Cancel Transaction |
| Account Number | 16 | 3 | 18 | |
| Primary Insured Last Name | 20 | 19 | 38 | |
| Primary Insured First Name | 15 | 39 | 53 | |
| Primary Insured Middle Initial | 1 | 54 | 54 | |
| Cancellation Effective Date | 8 | 55 | 62 | YYYYMMDD |
| Cancel Reason Code | 2 | 63 | 64 | Unique code for cancel reason |
| Filler | 163 | 65 | 227 | |

Example values given in the article: Enrollment Identifier — `P` (Paper Application), `C` (Card Carrier). Cancel Reason Code — `DL` (Delinquent Cancel), `CL` (Closed Account). These are labelled *examples*, not an enumeration; the authoritative code lists are **not stated in article**. Which control setting selects the CSI layout (analogous to `PREM`) is **not stated in article**.

---

## 5. Payments

### 5.1 Enter a Customer Payment — 040

`Accounting > Receivables > Enter a Customer Payment`. Back-office entry of cash, checks, and credit card transactions. Money can post as: full/partial payments to completed orders; deposits to an existing open order; on-account credit receivable; full/partial payments to charged-off bad debts; installment payments due; additional installment payments; payments to revolving MMPs due; additional revolving payments; MMP prepayments to revolving.

- Revolving **deposits to open orders cannot** be posted here — use Enter a Customer Payment/Refund/Gift Certificate instead (040).
- `Date`: between today and the first day of the current accounting period; no future dates. Backdating within an open sales month to dates not yet closed requires `Backdate Payments` in Receivables Security, otherwise a security override is demanded.
- `Bank` defaults from Warehouse/Store Location Settings, overridable, and can itself be overridden by a Bank Override configured per location + payment class.
- `Location` is inactive when `Balance By` in Cash Balancing Control Settings = Drawer. When Cash Balancing is set to **Balance By Cashier**, an Access Control Window asks for initials/password — identification only, no security check, no Reason for Override.
- **Global Auto-Pay**: applies the payment to the revolving balance due instead of picking references. Validation occurs on checking the box, and "the payment must be the sum of the Standard MMP amount or more". Checking it deactivates the reference grid and all other payment options. Application sequence: **oldest→newest due date, then oldest→newest transaction date, then lowest→highest APR.**
- Row-level `Action`: `Pay` or `Auto Pay` (pays each debit in full from the selected line down; any remainder becomes a partial payment, an order deposit, or an on-account payment).
- `Proof = Amount − moneys posted`; must be zero to update the session.
- `Terms` = discount amount when paying less than invoice and the customer is discount-eligible. `Adjustment` writes off a discrepancy — it "deducts the amount you enter here from the A/R amount due, but does not affect the proof amount."
- Grid Action codes seen: `OA` = On Account, `DP` = Deposit, "etc." (full code list **not stated in article**).
- Only **one reference number at a time per customer** for on-account payments.
- Receipt printing requires `Use Extended Payment Receipt` on the General tab of Accounts Receivable Control Settings.
- Overpaying charged-off accounts requires `Allow Overpayments on Charged Off Accounts` in AR Control Settings **plus** receivables security.
- Bad Debt application order: when the account had revolving plans and was charged off, the payment applies against completed order balances for those plans, **oldest to newest completed order date**.
- `Revoke Same as Cash After ___ Late Fees` (Installment Payment Plan Settings) triggers a warning at payment time once exceeded.
- Subject to **Regional Processing** restrictions on both customers and locations.

Actions menu (040, 041): On Account → *Place Money on Account* screen (reference defaults from the customer record, non-editable; enter Amount); Deposit → *Place Deposit on Order* (Customer Code carried forward; Order#, locatable via View a Customer's Open Transactions; Deposit amount); Bad Debt → *Bad Debt Payment Entry* (Amount only — 014); Revolving Prepayment; Enter Additional Revolving Payments; Enter Additional Installment Payments.

### 5.2 Additional payments — 002, 044

Both are gated on the customer having **no amounts currently due** in that engine:
- **Additional Payment** (revolving, 002): available only with ≥1 active revolving plan with a balance and **no MMPs currently due**. Pick Plan, enter `$`. Save adds it to the Enter a Customer Payment grid.
- **Enter Additional Installment Payments** (044 — note the file is titled "Enter Additional Revolving Payments" but its body documents the *installment* variant): ≥1 active installment contract and **no installment payments currently due**. Pick the contract number at the `Plan` field, enter `$`.
- Both assign an automatic reference number with the prefix **`AP`**.

### 5.3 Import Customer Payments — 053

`Accounting > Receivables | Revolving Receivables | Installment > Import Customer Payments`, or via `Settings User > Schedule a Process > Enter Process Preferences`. Tabs: Selection, Details. Runs on demand, inside End of Day (Generate Daily Reports), via Schedule a Process, or a combination.

- Source file location comes from `File Path Location` in **Receivable Payment Source Settings** (local PC vs NFS). File is a `.csv`; its name/location come from **Payment Agreement Source Settings**.
- Imported payments only appear in Balance a Cash Drawer if `Include Imported Payments on Cash Balancing Report` is checked in AR Control Settings.
- Even for non-revolving payments, using payment agreements requires `Allow Payment Agreements` checked in Revolving Receivables Control Settings and ≥1 source in Receivable Payment Source Settings. If `Allow Payment Agreements` is **unchecked**, put the customer number (not a Source ID) in the spreadsheet.
- `Date` cannot be null, future, prior to the last EOD date, in a closed period, or closed to payments (`Close Payment Dates`, Actions button on the General tab of AR Control Settings). Under Schedule a Process the date is forced to the run date and the field is inactive.
- Backdating rule: "Payments can be backdated as long as the customer's last cycle date is beyond the payment post date, as certain insurance, interest, and late fees cannot be recalculated because of a late payment." Failure message: *"Cannot post money prior to the last cycle date."*
- **Misapply Payments** checkbox: reverses previously posted payments in bulk by locating the matching reference. On-demand only — never as part of Generate Daily Reports; any source configured as daily/EOD must be switched to On Demand or Both. Requires `Import Customer Payments - Misapply Payments` in Create a User/Group Actions – Receivables Security, else a Security Override screen. When checked: `Agreed` and `Variance` columns are suppressed, `Paid` shows a credit, an `M` error marks failures, and an `Audit Messages` column appears (only when output is Personal Report Viewer or Excel Export). GL nuance worth flagging: for a miscellaneous payment with no AR GL account defined, this process **credits cash in bank**, whereas the manual Apply NSF/Misapplied process uses the default GL account — explicitly "contrary" behaviour (053).
- Import error codes (053): `C` invalid customer code / employee ID (no active revolving record for the code, or for the code+plan if a plan is supplied); `A` invalid payment amount (null or non-numeric); `D` invalid payment date (not `YYYYMMDD`); `L` a Legal Code Setting that disallows payments is on the customer; `N` invalid contract number; `M` payment could not be misapplied (misapply mode only); `P` posting error — **report-only**, raised during the update.
- Report columns: customer code, source ID, customer name, plan code, agreed amount, amount paid, variance, error.

### 5.4 Payment agreements / payment file generation — 050

`Accounting > Revolving Receivables > Generation of Payment File & Payment Agreement Report`. Produces the report sent to Payment Sources telling them what to remit, and/or the `.csv` file that is later posted through Import Customer Payments.
- Only works with one of the two extraction programs in **Payment Agreement Source Settings** — "If you are set up to use the extraction program that does not import the payments to a specific plan, this process is not available."
- `Begin Date` mandatory (may default to last process date + 1), `End Date` mandatory and ≥ Begin. Selects **unpaid payment agreement MMPs** with a due date within the range.
- `Payments per Month` display-only from Payment Agreement Source Settings.
- `Import Action`: Create File | Create Report | Both.
- File contents: customer/source ID, agreed amount per payment, customer name, payment due date, plan code.
- Report contents: customer number, source ID, customer name, plan code, agreed amount, order number, original amount, remaining amount, MMP, and a blank column for the source to fill in amount paid.

### 5.5 NSF and misapplied payment correction — 007

`Accounting > Receivables > Receivables Adjustments and Refunds > Apply NSF and Correct Misapplied Payments`. Two reversal reasons, chosen at the `Reason` field:
- **NSF** — returned check; reverses the payment and charges a bank fee.
- **Misapplied** — payment posted to the wrong account. Correct the *right* account separately via Enter a Customer Payment. When the Reason field is inactive it defaults to Misapplied. Applying NSF to a *miscellaneous* payment type requires `Allow to NSF` checked on that payment type code in **Miscellaneous Payment Settings**.

Rules and edge cases (all 007):
- Reversals are based on the original cash transaction; if the transaction cannot be found, enter a manual Misapplied/NSF adjustment.
- **Blocked**: electronically processed check payments when electronic check authorization (ECA) is active.
- **Reinstatement**: "If an installment contract or revolving plan was paid off as a result of a misapplied payment, that installment contract or revolving plan is reinstated after the misapplied payment is adjusted using this process."
- Online credit/debit misapply: allowed (a card counts as online if Credit Card Gateway, EMV Shift-4, or Tender Retail is active on the system, regardless of the store's own setting). Mechanism — the original payment is reopened by posting a misapplied adjustment credit to the closed payment; **no external processor interaction, so the card is not refunded**; a manual post is created that must then be applied to the proper payment due or adjusted off the account.
- **Cannot be misapplied**: builder allowance, in-store-use-only gift certificates, customer reward gift certificates. Remove those by deleting the sales order, or replenish the gift certificate via Enter a Customer Payment/Refund/Gift Certificate with a negative value.
- `Transaction Date` defaults to today, must be in an open sales period, and is additionally bounded by `Days to Limit Backdating during NSF/Misapply` in **Accounts Receivable Control Settings**. Exceeding it rejects the entry with: *"NSF/Misapplied payment corrections can only be backdated by NN days"*. Blank setting ⇒ any backdate allowed within an open sales period.
- `NSF Check Charge` auto-fills from the **NSF Check Fee** field in **Sales Tax Settings**; must be keyed manually on a manual reversal.
- **Fee routing**: if the returned check paid a revolving item and a revolving **master plan** exists for the customer, the NSF charge posts to the master plan; with no master plan, or if the check paid a non-revolving order, it posts to **open item receivables**.
- Select Add to process; the *Misapplied / NSF Payment Results* screen follows (072, outside range).

### 5.6 Vendor receivables — 008, 043, 051

**Apply Payments and Maintain Vendor Receivables Balances** (008) — `Accounting > Vendor Receivables > Apply Payments and Maintain Vendor Receivables Balances`. Tabs: Cash Application, Manual Adjustments, Apply On-Account. Purposes: post payments/adjustments to VR items, post on-account payments, place VR items in dispute, post manual debit/credit adjustments, apply on-account payments.
- `Date` cannot be in the future. `Applied Amount` = net dollars applied this session.
- Cash Application: `Bank`; `Deposit Number` assigned from `Next Deposit Number` in **Vendor Receivables Control Settings**; `Deposit Amount`; `Document` = check number; `Comment` **mandatory**, 30 alphanumeric, prints on Report Daily Vendor Receivables Activity (Daily Receipts and Adjustments); `Proof Amount` = Deposit Amount − applied amounts, must be zero to update.
- Amounts may be positive or negative. `Action` = **Pay** (default) or **Auto-Pay** (pays each debit in full until none remain; remainder can go to a partial payment, an order deposit, or on account).
- **Dispute**: checkbox per item. "Before payments may be applied to disputed items, the dispute status must be removed."
- Manual Adjustments tab: `Company` (multi-company aware, defaults from `Default Company Number` in General System Control Settings); `Reference` (Action button assigns a new one); `Due Date` (Action button derives it from the **VR Terms Code** on the Vendor record); `Memo` shows "Manual Post"; `Type` = **MAN**; `Comment`; `Amount` (must be **negative** if converting to a payable); `Dispute`; **Convert to Payable** — converts a vendor credit into a debit that reduces the balance payable to the vendor.
- Maintain GL Postings is always active on that tab with the right security, but is blocked by popup when: no adjustment has been made yet; a specific line item is selected; or the user lacks access to the default posting GL accounts per General Ledger User Permissions.
- Apply On-Account tab: select a payment line → **Vendor Receivables Payment On Account Adjustments** window (117, outside range).

**Enter a Volume Rebate** (043) — `Accounting > Vendor Receivables > Enter a Volume Rebate`. Creates a vendor receivable transaction and posts toward the rebate plan's goal. `Based On` = Written on Purchase Order | Received from Purchase Order | Billed by Vendor. From the VR Rebate Plan: `Goal Type` **C** = Total Cost of Purchases, **U** = Total Units Purchased; `Plan Type` **P** = Percent of Dollars Purchased, **D** = Dollars Per Unit Purchased; plus Goal, Amount (rate or per-unit dollars), and plan start/end Dates from **Vendor Rebate Settings (VR Rebate Plans)**. `Due Date` Action button derives from the vendor's VR Terms Code.

### 5.7 GL distribution screens

Two near-identical screens; both require `Edit automated general ledger postings` security (the customer one cites **Extended Security**, the vendor one cites **System Security** — 052 vs 051) and both require **STORIS Accounting**.
- **GL Distribution Screen** (052) — customer side. Row 1 = the Accounts Receivable GL account from General Ledger Control Settings (only its `Remark` is editable); row 2 = the Manual Posting GL account; extra accounts may be added. Invalid accounts render the row **red**. Cannot save while the batch contains the `$$$$$-NN` default account number. `Proof = Total Debit − Total Credit` and must be zero to save out of the calling routine. Actions: Cost Center Distribution. Reached from Maintain Customer Balances, and from the revolving adjustment routines on Save (001, 003, 018).
- **GL Distribution – Vendor Receivables Manual Adjustment** (051) — same shape, row 1 = vendor receivable GL account, `Type` = Manual Adjustment.

---

## 6. Collections (in-range portion)

### 6.1 Collector Review process — 020

`Accounting > Collections > Collector Review`. Pick a collector, pick a **Function**, pick a customer. The screen title changes with the function.

| Function | Grid contents | Sort | Alert colouring |
|---|---|---|---|
| Contact | customers with next contact dates | ascending next contact date/time | **red** = call-back date/time has passed; **yellow** = due within the next hour |
| Promise To Pay | customers with PTP dates | ascending PTP date, then last name | **red** = PTP date passed without payment |
| Assignment | the collector's assignment list | ascending last collections activity date, then last name | not stated |
| Customer | jumps straight to Collector Review – Customer Update for any customer in collections, on this collector's list or not | n/a | n/a |

Header totals: Number of Accounts, Total Amount Due, Total Past Due, Total Promised to Pay. Grid columns: Customer Code, Customer Name, Last Action Date, Promise Date, Promise Amount, Next Contact Date, Next Contact Time. Global buttons: Delete and Save are **inactive**; Clear refreshes the grid; Exit returns to the menus retaining updates. Actions: View Collector Performance.

### 6.2 Collector Review – Customer Update Screen — 021

Reached from the Collector Review process. Capabilities: assign a promise-to-pay date and amount, assign a call-back date and time, request collections letters, update collector comments, reassign the customer to a different collector (or remove them from Collections), review collector performance.
- Account comments (Point of Sale tab, Advanced Customer Settings) pop up on first access.
- `Collector Review; Automatic Display of Customer User Defined Settings` in user/user-group receivables settings auto-opens the User Defined Settings entry screen on first access.
- The `Customer` field is editable **only** when arriving via the Customer function; otherwise the customer is fixed from the list screen.
- Displays: Due amounts, Credit amounts, `Last Contact` date, assigned `Collector`, and **Monthly Statement Performance** — "A code displays indicating the customer's monthly statement performance for each of the last 12 months." The code values are **not stated in article** here (the 24-month Payment History Profile codes in 077 are a different, longer series — do not assume they are the same alphabet).
- **Action** dropdown and its exact write-behaviour into `CUSTOMER.CREDIT`:
  - `None Selected` — no update; Save stays disabled.
  - `Spoke to Customer` — updates **both** Last Contact Date **and** Last Collections Activity date with the current system date.
  - `Left Message` — updates **only** Last Collections Activity date.
  - `No Answer` — updates **only** Last Collections Activity date.
- Extra actions available from here: Collector's View of Customer Activity; Advanced Customer Settings; View All Revolving Activity for a Customer; Enter a Customer Payment/Refund/Gift Certificate; Enter a Customer Payment; Print Report of Screen Detail (direct to printer); View All Installment Activity for a Customer; Customer Activity Log; View Installment Comments; View an Existing Sales Order; User Defined Settings; Manage and Adjust Installment Contracts; Maintain Customer Deposits; View a Customer's Payment Activity.

### 6.3 Promise-to-pay — 013

Via the **Promise** button on Collector Review – Customer Update. Fields: `Date` (existing PTP date displays), `Amount` (max **$99999.99**), `Collected` (total PTP amount collected since the PTP date and amount were first entered), `Amount Remaining`. The date and amount echo onto the Customer Update screen and into the customer's **Collections Comments file**.

### 6.4 Contact date and time — 012

Via the **Contact** button. `Date` (calendar picker; existing date is editable) and `Time` in **24-hour format** — "If you enter 4 digits, you do not have to enter a colon… to enter a log-in time of 8:34 AM, enter: 0834". Also written to the Collections Comments file.

### 6.5 Assign Collections Letter (single customer) — 011

Via the **Letter** button. `Collections Letter` dropdown; the chosen letter's name lands in the customer's Collections Comments file. `Print Now` — unchecked means the letter prints as part of the **first End-of-Day process after assignment**. `Print Now` is active only when generating letters via the **Enhanced Laser** option (set at `Collections Letter` in Collections Processing Control Settings) **and** the PC is configured for Enhanced Laser Printing.

### 6.6 Assign and Print Collections Letters (mass) — 010

`Accounting > Collections > Print Documents > Assign and Print Collection Letters`. Selects past-due customers who qualify for Collections and assigns a user-defined letter.
- **Non-destructive**: "For customers with letters already assigned to them, this process assigns the letters you specify here and does not overwrite the existing assignments."
- Side effects: updates the **Collector statistics file** and posts comments to the **Collector Comments file**.
- Output modes: **Export file** ⇒ an Excel spreadsheet, one column per data element, one row per customer, for mail-merge or an external letter process. **Enhanced Laser Printing** ⇒ the system creates the XML for the letters.
- Selection fields: `District` (active only if the District field is enabled in **Collections Processing Control Settings** *and* Regional Processing is active; entering one deactivates Store Location); `Store Location` (active only if the Location field is enabled in Collections Processing Control Settings; entering one deactivates District); `Collector`; `Past Due Days From/To` (**mandatory**, 1–9999, From ≤ To); `Minimum Past Due $` / `Maximum Past Due $` (optional); `Letter`; `Print Now` (inactive until a Letter is chosen; on Run, the system reads the `Collection Letters` field in Collections Processing Control Settings to decide the output file type); `Name of File` (valid Windows filename+extension; active only when the system is set to Export Letter); `Path to File` (read-only).
- **Merge fields passed to the export file or Forms Designer** (010, verbatim list): Customer Name; Address Line 1; Address Line 2; City; State; Zip Code; Home Telephone Number; Work Telephone Number; Cell Phone; Email Address; Credit Limit; Occupation; Employer; Employer Address1; Employer Address 2; Co-Applicant Name; Co-Applicant Employer; Cosigner; Cosigner Address 1; Cosigner Address 2; Cosigner Occupation; Cosigner Employer; Long Term Revolving Balance; Open Item Balance; Total Account Balance; Current Due; Past Due 1 to 30; Past Due 31 to 60; Past Due 61 to 90; Past Due 91 to 120; Past Due Finance Fees; Past Due Insurance; Past Due Interest; Past Due Late Fees; Past Due Principal; Last Payment Amount; Last Payment Date; Last Purchase Amount; Last Purchase Date; Promise to Pay Date; Promise to Pay Amount. (The article renders these in two interleaved columns; the ordering above is by logical group, the set is complete and exact.)
- Also see Print Collections Letters (091) and Reassign Collector (096) — outside this range.

### 6.7 Disputes (collections-adjacent) — 048

`Adjust Revolving Plans > Update Disputes > Actions > Enter Dispute Comments`. Entering from Update Disputes gives an editable comments box; any other entry point is read-only. Output to printer/spooler via Print Comments. Update Disputes itself is 113, outside range.

---

## 7. Control settings referenced (in-range)

Grouped by settings screen. Each entry: flag → what it controls → citing article.

**Accounts Receivable Control Settings**
- `Days to Limit Backdating during NSF/Misapply` → max backdate on NSF/misapply corrections; blank = unlimited within an open period (007)
- `NFS Export File` (Receivables tab) → whether Metro 2 download goes to NFS Export Path vs ASCII Export, and the path shown (039)
- statement history retention period → bounds the Cycle Date on the insurance premium file (025)
- `Allow Overpayments on Charged Off Accounts` → permits overpayment of charged-off balances (040)
- `Use Extended Payment Receipt` (General tab) → enables receipt printing from Enter a Customer Payment (040)
- `Include Imported Payments on Cash Balancing Report` → whether imported payments hit Balance a Cash Drawer (053)
- `Close Payment Dates` (Actions button, General tab) → dates closed to payment posting (053)
- `Allow Duplicate Social Security Numbers` → referenced by all SSN fields (cross-ref 101)

**Installment Receivables Control Settings**
- interest rates / `Calculation Type` / term → drive the Interest amount and APR on the worksheet (061)
- `Due Date Is` → populates the Due Day dropdown (061)
- default term and `Maximum term is` → default and ceiling for Term Months (061)
- deferment fee table → computes the Deferment Fee from the Deferred Payments amount (037)
- `PAYOFF/CANCELLATION DATE - Allow Future Dates` → permits a future payoff as-of date (060)

**Installment Payment Plan Settings**
- `Contracts Paid Within __ Months Qualify Same as Cash` → computes the Same as Cash date behind the dual APR (009)
- `Revoke Same as Cash After ___ Late Fees` → warning + credential gate at payment entry and payoff (040, 060)
- allow contract rewrites → whether contracts appear in the Merge Contracts grid (061)
- plan cutoff dates + location accessibility → which plans appear in the Installment Plan dropdown (061)
- `Default Terms Table` (Action button) → finance-amount→term default table (036)

**Revolving Receivables Control Settings**
- `Master Plan` → the plan auto-created/selected whenever any revolving plan is created (042); NSF fee target (007)
- `Insurance Required` → blocks removing insurance and forces adding it on edit (042)
- `Apply Insurance by` (Customer | Plan) → whether the insurance code is customer-driven and locked, or per-plan (042, 034)
- `Exempt from Insurance Charges` → suppresses insurance selection (042); also a Revolving Payment Plan Settings field (034)
- `Single Prompt for Insurance Change` → suppresses insurance-change prompts on save (042)
- `Insurance File Format` = **PREM** → enrollment and premium files emit the Premier Insurance layout (024, 025)
- `Allow Payment Agreements` → required for payment-agreement imports; when unchecked, spreadsheets carry customer numbers instead of Source IDs (053)

**Revolving Payment Plan Settings**
- `Calculate MMP` → the plan-type matrix and the lowest allowed MMP default (042)
- `Allow Deferment` → enables the Plan Deferment button (006)
- `Payment Agreement` checkbox (General tab) → exposes the Payment Agreement action on Revolving Terms & Conditions (042)
- revolving restrictions by credit score / minimum financed amount → which plans can be offered (cross-ref 106)

**Sales Tax Settings**
- Revolving tab → whether the customer's state assesses a **finance charge fee** (001)
- `NSF Check Fee` → default NSF charge amount (007)
- Installment tab → fee, late charge, interest settings by jurisdiction (059); `Non-Filing Fee` defaults the worksheet Miscellaneous amount (061)

**Collections Processing Control Settings**
- `District` field enabled → activates District selection on mass letters (010)
- `Location` field enabled → activates Store Location selection (010)
- `Collection Letters` / `Collections Letter` → output type: Export Letter vs Enhanced Laser (010, 011)

**Credit Application Control Settings**
- per-field optional / mandatory / not-needed for every application tab (026, 027)
- activation of the Co-applicant and Co-signer checkboxes (028)
- `Return Text Credit Report` → print destination for View Credit Report (029)
- "current" application determination → blocks creating a duplicate application (cross-ref 101)

**Other named settings screens**
- Credit Review Status Code Settings — `Associated Credit Request Status` 3/4/5/6/8 behaviour (029, 031)
- Reason Code Settings — `Reason Usage Code` values seen: **Credit Application** (029, 031, 034), **Revolving Adjustments** (001, 003); reasons can carry an associated Metro 2 **Account Status** (059)
- Credit Employment Status Settings — makes Employment-tab fields required per status (026, 027)
- Contract Balance Adjustment Settings — extra contract allocation/adjustment types (004, 059)
- Contract Classification Settings — installment contract classification codes (059)
- Extended Receivables Insurance Code Settings — insurance plans (059, 061)
- Revolving Receivables Insurance Code settings — insurance **cutoff age** (042)
- Point of Sale Control Settings, Customer tab — `Prompt for Middle Name Entry`, `Prompt for Name Prefix`, `Prompt for Name Suffix` (019); `Customer Entry - Warn if Primary Email exists for other Customers` (026, 027)
- General System Control Settings — **Advanced Receivables** add-on (activates Installment *and* Revolving) (029, 059); `Default Company Number` (008, 051)
- Cash Balancing Control Settings — `Balance By` = Cashier (initials prompt) or Drawer (Location inactive) (040)
- Warehouse/Store Location Settings — default Bank (040); Bank Override per location + payment class (040)
- Miscellaneous Payment Settings — `Allow to NSF` per payment type code (007)
- Vendor Receivables Control Settings — `Next Deposit Number` (008)
- Vendor Rebate Settings (VR Rebate Plans) — goal, goal type, plan type, amount, dates (043)
- General Ledger Control Settings — AR account, Vendor Receivable account, Manual Posting account (051, 052)
- General Ledger Assigned Account Settings — installment posting accounts (059)
- General Ledger User Permissions — default-account access gating for Maintain GL Postings (001, 003, 008)
- Receivable Payment Source Settings — `File Path Location` (PC vs NFS) (053)
- Payment Agreement Source Settings — extraction program choice, `.csv` name/location, `Payments per Month` (050, 053)
- Metro 2 Code Settings (Receivables tab, Advanced Customer Settings) — manual account status on contract cancellation (059)
- Configure Document Signature Capture / Configure Document Archive — `Signature Required`; signature ceremony and archiving (042, cross-ref 101)
- Customer Legal Settings — legal status of the account (034); Legal Code Settings can disallow payments (import error `L`, 053)
- Advanced Customer Settings — `Due Day` derivation (006, 042); Account Comments (035); Credit Remarks (061); Residence page global Actions is the only path whose address edits reflect on review screens (029, 031)
- Regional Processing — restricts visible customers and locations (007, 040)

**Named security settings (receivables / extended / staff)** `View All Revolving Activity - Add Insurance` (000) · `Change or remove insurance on a customer's revolving plan` (034, 042) · `Revolving Terms and Conditions - Apply Insurance to all Plans` (042) · `Revolving Terms and Conditions - Override Lowest MMP Allowed Restriction` (042) · `Installment; Exclude Contracts from Auto Pay` (005) · `Installment; Add Contract Grace Days` (005) · `Installment; Extend Contract's Number of Months` (005) · `Override Revoke Same as Cash Terms` (060) · `Backdate Payments` (040) · `Import Customer Payments - Misapply Payments` (053) · `Access Other Credit Applications and Score Reporting` (029, 030, 031) · `Access credit applications and score reporting` (026) · `Access employee credit applications and score reporting` (034) · `Update a Customer's Credit Limit` (034) · `Establish unlimited credit limit for a customer` (034) · `Set a Customer's Maximum Credit Limit to $` (034) · `Update Customer's credit score` (034) · `Update Scoring classification` (034) · `Update credit source` (034) · `Update Manually Enter Customer Credit Holds` (034) · `Update Customer lien requests` (034, 045) · `Edit automated general ledger postings` (051, 052) · `Collector Review; Automatic Display of Customer User Defined Settings` (021) · `Review Pending Credit Request – Manually approved linked sales order` (cross-ref 106).

**Credit hold codes seen in range**: `C4` (co-applicant/co-signer removed from application; manual credit hold), `F2` (order linked to a contract via Merge/Refinance — no credit check), `C6` (cross-ref 106, sales order awaiting credit-request approval). Full hold-code list **not stated in article**.

---

## 8. Menu paths (`Access` per article, verbatim)

| # | Article | Access path |
|---|---|---|
| 000 | Add Insurance | View All Revolving Plan Activity for a Customer > Add Insurance button |
| 001 | Add New MMP | Adjust Revolving Plans > Add New MMP global action button |
| 002 | Additional Payment | Enter a Customer Payment > Actions menu > Additional Payment |
| 003 | Adjust Balance | Adjust Revolving Plans > Adjust Balance global action button |
| 004 | Adjust Contract Balance | Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Adjust Contract Balance button *(also via Review Contract Details)* |
| 005 | Adjust Payment Terms | Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Adjust Payment Terms button *(also via Review Contract Details)* |
| 006 | Adjust Revolving Plans | Accounting > Revolving Receivables > Adjust Revolving Plans |
| 007 | Apply NSF and Correct Misapplied Payments | Accounting > Receivables > Receivables Adjustments and Refunds > Apply NSF and Correct Misapplied Payments |
| 008 | Apply Payments and Maintain Vendor Receivables Balances | Accounting > Vendor Receivables > Apply Payments and Maintain Vendor Receivables Balances |
| 009 | APR Values | Installment Worksheet > extra Actions at APR field; Review Contract Details > extra Actions at Annual Percentage Rate field |
| 010 | Assign and Print Collections Letters | Accounting > Collections > Print Documents > Assign and Print Collection Letters |
| 011 | Assign Collections Letter Screen | Letter button on Collector Review – Customer Update Screen |
| 012 | Assign Contact Date and Time Screen | Contact button on Collector Review – Customer Update Screen |
| 013 | Assign Promise-to-Pay Screen | Promise button on Collector Review – Customer Update Screen |
| 014 | Bad Debt Payment Entry Screen | Enter a Customer Payment > Actions menu *(no menu path stated)* |
| 015 | Calculate Average Monthly Insurance Premium | Installment Receivables > Manage and Adjust Installment Contracts > Merge/Refinance Contracts > Actions > Calculated Average Monthly Insurance Premium *(also via Review Contract Details)* |
| 016 | Calculate Payoff and Rebate Amounts | Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Review Contract Details > Search button next to Payoff Valid field |
| 017 | CSI Insurance File Layout | *no Access section — layout document only* |
| 018 | Change Details | Adjust Revolving Plans > Change Details global action button |
| 019 | Co-Applicant Name and Address Maintenance | Credit Application Entry > Co-Applicant button; or Actions button on the Co-Applicant screens |
| 020 | Collector List Review | Accounting > Collections > Collector Review |
| 021 | Collector Review – Customer Update Screen | via the Collector Review Process |
| 022 | Contract Amortization Schedule | Installment Receivables > Manage and Adjust Installment Contracts > Merge/Refinance Contracts (or Review Contract Details) > Actions > View Contract Amortization Schedule |
| 023 | Contract Insurance Codes | Installment Receivables > Manage and Adjust Installment Contracts > Review Contract Details button > Search button at Insurance field |
| 024 | Create Insurance Enrollment File | Accounting > Revolving Receivables > Revolving Views and Reports > Revolving Reports > Insurance Enrollment File Creation |
| 025 | Create Insurance Premium File | **blank in source — not stated in article** |
| 026 | Credit Application Entry | Request Credit Information (Next or Actions); Credit Request Review Screen > Update a Credit Application button |
| 027 | Credit Application Entry – Co-applicant | Request Credit Information > Credit Application Entry – Primary Personal tab > Co-applicant button; Review Pending Credit Requests (double-click) > Credit Request Review > Update a Credit Application > Personal tab > Co-applicant button |
| 028 | Credit Application Processing Overview | via the Request Credit Information routine |
| 029 | Credit Request Review | double-click a grid item in Review Pending Credit Requests |
| 030 | Credit Request Review Screen – Read Only | double-click a grid item in View Credit Request Responses, or in View Completed Credit Requests |
| 031 | Credit Requests on Hold Screen | double-click a grid item in Review Credit Requests on Hold |
| 032 | Credit Review Comments Entry/Inquiry | Audit Request Activity button in Credit Request Review |
| 033 | Customer Credit and Scoring Activity Log | Customer Credit and Scoring Information > Actions > Credit and Scoring Audit |
| 034 | Customer Credit and Scoring Information | Accounting > Receivables > Credit Application > Customer Credit and Scoring Information; Accounting > Installment > Customer Credit and Scoring Information |
| 035 | Customer Credit Comments | Comments button on revolving entry/view routines (Adjust Revolving Plans, Enter a Customer's Revolving Terms & Conditions, View All Revolving Activity for a Customer, View a Customer's Revolving Disputes); Manage and Adjust Installment Contracts > Merge/Refinance Contracts (or Review Contract Details) > Actions > View Customer Credit Comments |
| 036 | Default Terms Table | Installment Receivables Payment Plan Settings > Default Terms Table field > Action button |
| 037 | Defer Installment Payments | Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Defer Installment Payments button *(also via Review Contract Details)* |
| 038 | Deposit Application Screen | Action button at the Apply to field on Maintain Customer Deposits |
| 039 | Download Metro 2 Customer Credit History | Accounting > Revolving Receivables > Metro 2 Features > Download Metro 2 Customer Credit History |
| 040 | Enter a Customer Payment | Accounting > Receivables > Enter a Customer Payment |
| 041 | Enter a Customer Payment – Actions Menu | Actions menu in Enter a Customer Payment |
| 042 | Enter a Customer's Revolving Terms & Conditions | Accounting > Revolving Receivables > Enter a Customer's Revolving Terms and Conditions |
| 043 | Enter a Volume Rebate | Accounting > Vendor Receivables > Enter a Volume Rebate |
| 044 | Enter Additional Revolving/Installment Payments | Enter a Customer Payment > Actions menu > Enter Additional Installment Payments |
| 045 | Enter Lien Registration Information | Customer Credit and Scoring Information > Action button at Registered Lien Details field |
| 046 | Enter Reason Code | Enter a Customer's Revolving Terms & Conditions > Actions > Close Reason |
| 047 | Enter Statement Messages | Accounting > Revolving Receivables > Statements > Enter Statement Messages |
| 048 | Enter/View Dispute Comments | Adjust Revolving Plans > Update Disputes > Actions > Enter Dispute Comments |
| 049 | Forgive Late Fees | Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Forgive Late Fees button *(also via Review Contract Details)* |
| 050 | Generation of Payment File & Payment Agreement Report | Accounting > Revolving Receivables > Generation of Payment File & Payment Agreement Report |
| 051 | GL Distribution – VR Manual Adjustment | Apply Payments and Maintain Vendor Receivables Balances > Manual Adjustments tab > Actions button or Save |
| 052 | GL Distribution Screen | Maintain Customer Balances > Actions button or Save; Actions button in Enter/Update Individual Vendor Invoice, or when filing an AP bill |
| 053 | Import Customer Payments | Accounting > Receivables / Revolving Receivables / Installment > Import Customer Payments; Settings User > Schedule a Process > Enter Process Preferences |
| 054 | Import Revolving Plan Balance Transfer | Accounting > Revolving Receivables > Import Revolving Plan Balance Transfer |
| 055 | Import Revolving Plan Deferments | Menu; Schedule a Process > Select Import Revolving Plan Deferments > Actions > Enter Process Preferences |
| 056 | Indicate Message to Print on Customer Statements | Accounting > Revolving Receivables > Statements > Indicate Message to Print on Customer Statements |
| 057 | Installment Activity Log | Manage and Adjust Installment Contracts (or Review Contract Details, or Merge/Refinance Contracts) > Actions > View Installment Comments; Accounting > Installment > Installment Activity Log |
| 058 | Installment Notes | Installment Receivables > Manage and Adjust Installment Contracts > Review Contract Details > Search button by Notes field |
| 059 | Installment Receivables Overview | *overview article — no Access section* |
| 060 | Installment Receivables Payoff As-of Date | Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Update Contract Status button > select cancel at the status field *(also via Review Contract Details)* |
| 061 | Installment Worksheet | Enter a Sales Order > Payment tab > enter an Installment Receivables Payment Plan code at Payment or Financing; Manage and Adjust Installment Contracts > Merge/Refinance Contracts button |

Statement-message machinery also in range: **Enter Statement Messages** (047) defines message code (5 alphanumeric), optional `Expires` date, text, and the statement section — Payment Information / Changes to Interest Rate / Changes to Account Terms / Special Purchase Plan Summary / General Notes; choosing *Changes to Account Terms* activates an Account Terms tab building a Text/Value table (25 chars each, with Text Header and Value Header, promotable/demotable rows). **Indicate Message to Print on Customer Statements** (056) assigns messages by plan / state / store (state and store are mutually exclusive) on the Criteria tab, and per-customer assign/remove/**exclude** on the Customer tab; grid shows Expires, Code, Message, Source (Manual|Criteria), Excluded (`*`). An expired message can be assigned with a warning but will not print until the Expires date is changed or deleted.

---

## 9. Cutover implications (LA Mattress legacy ERP → STORIS)

### 9.1 Prerequisite switch
`General System Control Settings > Advanced Receivables` must be on — it is the single flag that enables **both** Installment and Revolving (059). It also *removes* the ability to edit the credit limit on the Credit Request Review screen, forcing limit maintenance through Customer Credit and Scoring Information (029). Plan the credit-limit load against that screen, not the review screen.

### 9.2 Deciding the target object per legacy balance
Map each legacy account to exactly one of: installment contract (closed-end, interest and insurance precomputed), revolving plan (open-end, cycles, MMP), or open item. INFERRED: a legacy "in-house finance account" with a fixed term and a fixed payment is a contract; one with a revolving limit and a recalculated minimum payment is a plan. Getting this wrong is not cheaply reversible — Adjust Contract Balance and Adjust Balance move money but do not convert object types, and plan balance transfer only moves *between revolving plans* (006).

### 9.3 Open installment contracts
- Migration must carry, at minimum, the worksheet's derived set: Principal, Miscellaneous (non-filing fee), Interest, Insurance, TOTAL, Term Months, Due Day, PAYMENT, APR, Written date, Fixed Activation date (061). There is **no documented import routine for installment contracts** in this range — imports exist only for customer payments (053), revolving plan balance transfers (054), and revolving plan deferments (055). INFERRED: contract load will need either API/data-level loading or manual creation via the Installment Worksheet from Merge/Refinance.
- The Merge/Refinance path is the only documented manual way to create a contract not tied to a fresh sales order (061). It sets **F2 credit hold** on the linked order and performs **no credit check** — which is convenient for migration but means the F2 holds must be cleared as a post-load step (INFERRED; the clearing routine is Update Receivables Credit Approvals, 034/115).
- Interest method must be chosen deliberately: Straight Line vs Rule of 78s changes both the monthly split and the early-payoff amount (059). If the legacy system used simple interest, neither STORIS method reproduces it exactly — reconcile payoff quotes on a sample before go-live (INFERRED).

### 9.4 Accrued interest and mid-term contracts
- STORIS front-loads the whole interest and insurance charge into the contract at creation (059), so a legacy contract that is 14 months into a 36-month term cannot be loaded at original terms without overstating remaining interest. Options, all INFERRED: (a) load with remaining principal + remaining interest + remaining insurance as a shortened-term contract, accepting that the amortization schedule (022) will not match legacy history; (b) load at original terms and then use **Adjust Contract Balance** (004) with negative Interest and Insurance allocations to reduce to actuals. Option (b) is constrained: a negative adjustment cannot exceed the `$ Long Term` value for that allocation, i.e. amounts already cycled cannot be adjusted away (004). Comments are mandatory on every such adjustment (004) — plan a standard migration comment string.
- The amortization grid's `Remaining` formula wording is ambiguous about the sign of `Applied` (022) — validate against a hand-built test contract before trusting migrated schedules.

### 9.5 Revolving plans
- Every plan needs: plan code, Activated date, long-term and short-term balances, `Highest $`, MMP or `% of Balance`, Minimum MMP, insurance code, Due Day, and any dispute flags (042, 006).
- **`Highest $`** ("highest the balance has ever been since the plan became active", 042) is a historical high-water mark that cannot be reconstructed after cutover — capture it from legacy or accept that it resets (INFERRED).
- If a **Master Plan** is configured, STORIS will auto-create it for every customer who gets any revolving plan (042). Decide before load whether LA Mattress uses master plans; NSF fee routing depends on it (007).
- **Timing trap**: changes on Enter a Customer's Revolving Terms & Conditions "are not applied until the next time the customer's account is cycled" (042). Any post-load terms correction is invisible until the next cycle — sequence data loads *before* the first cycle run (INFERRED).
- Per Sales Order and Per Sales Order Using a Fixed Term plans carry MMP at the *transaction* level (018, 003), so those plans need order-level detail migrated, not just a plan balance. Change Details enforces "sum of remaining balances = plan balance" (018) — the detail must reconcile exactly or the screen cannot be saved.
- `Import Revolving Plan Balance Transfer` (054) accepts transfers **to closed plans**, which is a useful escape hatch for consolidating legacy plan structures, but it moves whole plans only.

### 9.6 Insurance enrollments
- Two independent decisions: `Apply Insurance by` = Customer or Plan (042, 034), and whether `Insurance Required` is on (once on, insurance cannot be removed from an existing plan, 042).
- Customer-level `Revolving Insurance` changes cascade to all pending and active revolving records except plans flagged `Exempt from Insurance Charges` (034) — a single mis-set field can re-enroll an entire book. Do this deliberately and once.
- **Add Insurance** (000) only works when *no* plan, pending included, already carries insurance — so it is a one-shot tool usable at cutover but not for correcting a partially-insured book.
- Enrollment reporting is stateful: plans are stamped with a "reported to the insurance company" date, and the unchecked-`Recreate File` run selects only unreported plans (024). Migrated plans will therefore all look unreported and will flood the first enrollment file. INFERRED: either suppress the first run, or coordinate a bulk enrollment with the carrier. For CSI this means a large batch of `01` Issue records at record length 227 (017).
- Insurance **cancellations** on migrated accounts emit `02` records needing a Cancel Reason Code; only `DL` and `CL` are given as examples (017) — get the carrier's authoritative code list before the first cancel file.
- Cutoff age (Revolving Receivables Insurance Code settings) is enforced against customer DOB, and a **missing DOB blocks insurance selection entirely** (042). Verify DOB completeness in the customer load; it also gates the application (age <18 rejected, 026) and populates the CSI DOB fields (017).

### 9.7 Payment history
- **Payment History Profile** is 24 months of single-character codes, most recent month excluded, with `B` for "customer did not exist" and `0` for "cycle processing was not run" — both **not editable** (034; codes per 077). INFERRED: a migrated customer will show `B` for all pre-cutover months unless the profile is loaded, and those cells cannot be corrected through the UI afterwards. If credit decisioning or Metro 2 reporting depends on this history, load it as part of the customer record, not afterwards.
- **Monthly Statement Performance** on the collector screen is a *separate* 12-month code series (021) whose alphabet is not documented. Do not assume it is the same field as the Payment History Profile.
- Transactional payment history (View a Customer's Payment Activity, View Details of Payment Activity, View Contract Postings — 059) has no documented import. INFERRED: plan on legacy payment history living in an archive/read-only system rather than inside STORIS.
- `Import Customer Payments` (053) is the only bulk payment poster, and it is oriented at payment- agreement remittance files, not historical backfill; it also refuses to post prior to the customer's last cycle date. It is not a history-migration tool.

### 9.8 Collections state
- Migratable-looking collections attributes, all set per customer through Collector Review – Customer Update: assigned Collector, Promise-to-Pay date/amount (max $99999.99), next Contact date/time, Last Contact date, Last Collections Activity date, assigned collections letter (011–013, 020, 021). No bulk import for any of them is documented in this range — **not stated in article**. INFERRED: either re-derive collections state from aging after cutover, or budget manual re-entry.
- `Collected` and `Amount Remaining` on the PTP screen are computed "since the PTP date and amount were first entered" (013), so a migrated PTP will show zero collected regardless of legacy partial payments (INFERRED).
- The mass letter run (010) is driven purely by past-due days and past-due dollars, both of which derive from migrated aging. If aging buckets load wrong, the first collections letter run will mis-target — hold the first run until aging is reconciled (INFERRED).
- Collections letters do **not** overwrite existing letter assignments (010), so a bad run cannot be cleanly re-run over itself.

### 9.9 Credit applications and credit state
- Applications are historical snapshots by design (026); there is no reason to migrate legacy application detail into the STORIS application object. INFERRED: migrate the *outcomes* — credit limit, credit score, bankruptcy score, installment/revolving classification, credit source, lien registrations, legal status — all of which live on Customer Credit and Scoring Information (034).
- That screen keeps a **per-field audit trail** (date/time/initials/old/new, 034). A bulk load will either write no audit rows or write a wall of them under one operator ID; decide which, and tell the compliance owner.
- **Credit-limit letters**: decreasing a limit forces an adverse Reason and can auto-generate a Credit Limit Decrease Letter (034). A migration that "corrects" limits downward could mail adverse-action letters to the entire book. Confirm the letter flag is off (unchecked leaves them queued for batch printing via Print Credit Request Status Letters — also a hazard) before any limit load (INFERRED). Note the exemption: unlimited→limited and limited→unlimited generate **no** letter (034).
- Open legacy credit applications: the STORIS equivalents are pending and hold review items. INFERRED: the low-risk approach is to close them in legacy and re-enter in STORIS through Request Credit Information, since re-entry is what triggers bureau transmission and the comment trail (026, 028).
- Metro 2 credit reporting continuity: 039 (download) plus 071/098/099 (recovery/repair/report, outside range) are the toolset. Cancelling a contract can push a Metro 2 account status manually or automatically via Reason Code Settings (059). INFERRED: agree the Metro 2 account-status mapping with the bureau before the first post-cutover reporting cycle, because migrated accounts will have no STORIS-side reporting history.

### 9.10 Sequencing recommendation (INFERRED)
1. Control settings and security groups (§7) — especially Advanced Receivables, master plan, `Apply Insurance by`, `Insurance Required`, deferment fee table, Default Terms Table.
2. Customers, including DOB, SSN, Due Day, and Payment History Profile.
3. Credit state (limits with letters suppressed, scores, classifications, liens, legal codes).
4. Revolving plans with long/short-term split and, for Per Sales Order types, transaction detail.
5. Installment contracts.
6. Open item / aging.
7. Clear F2/C4/C6 holds via Update Receivables Credit Approvals.
8. Collections assignments.
9. Reconcile before the first cycle run; coordinate the first insurance enrollment file with the carrier.

---

## Open questions / not documented here

1. **Credit review status codes** — only Associated Credit Request Statuses 3, 4, 5, 6, 8 are named (029, 031). Values 1, 2, 7, 9+ and the full code table are not stated. The literal statuses `RI`, `SI`, `RA` appear without expansion (029).
2. **Credit history codes** — the task brief asks for these; nothing in 000–061 defines a "credit history code" set. The nearest documented series are the Payment History Profile codes (077, outside range) and the undocumented 12-month Monthly Statement Performance codes (021).
3. **Monthly Statement Performance code alphabet** (021) — not stated.
4. **Enter a Customer Payment grid Action codes** — only `OA` and `DP` are given, followed by "etc." (040). Full list not stated.
5. **Credit hold code list** — `C4`, `F2`, `C6` observed; the enumeration is not stated.
6. **Credit bureau identity/protocol** — never named; only "credit bureau", "InterConnect", "Credit Report Processor" (026–029).
7. **Create Insurance Premium File menu path** — the Access section is empty in the source (025).
8. **CSI layout selector** — no control setting is documented that selects the CSI layout, unlike `PREM` for Premier (017 vs 024/025).
9. **CSI Enrollment Identifier and Cancel Reason Code enumerations** — only examples given (017).
10. **Rule of 78s premium formula** used by Calculate Average Monthly Insurance Premium (015) — method named, formula not stated.
11. **Amortization `Remaining` sign convention** for the `Applied` column (022) — article wording is internally inconsistent.
12. **Escrow** — no escrow concept appears anywhere in 000–061.
13. **Bulk import for installment contracts, collections state, and payment history** — none documented in this range.
14. **Deferment fee table structure** (037) — the table lives in Installment Receivables Control Settings; its columns are not described here.
15. **Revolving Receivables Overview** — referenced by 006 but the article itself is not in this range.
16. **Contract statuses** — "pending / active / history / cancelled" are used but never enumerated as a formal status list; Update Contract Status is article 112, outside this range.
17. **File attachment size/type limits** on credit applications (026) — not stated.
18. **What `Adjustment` on the Enter a Customer Payment header aggregates** — the field is listed with no description text in 040.
19. **`Highest $` on Adjust Revolving Plans** (006) — the article's body for this field reads "Type your dropdown text here", i.e. unfinished source copy; the definition in 042 was used instead.
20. **Insurance Code field on Create Insurance Premium File** (025) also ends with the stray editor placeholder "Type your dropdown text here" — treat that article as partially unreviewed upstream.
