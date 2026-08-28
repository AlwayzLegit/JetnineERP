# Run 07 — System Administration — Batch 9: The permission catalogue, complete

Status: complete. Findings 440–452. Read-only throughout.

**All ten module security records now read.** This batch completes the consolidated permission
catalogue and closes run 02's longest-standing puzzle — the two *inverted* PO-hold permissions.

---

## A. Coverage log

| # | Record | id | Permissions | Batch |
|---|---|---|---|---|
| 1 | Sales Security | 15185859408660 | ~120 | 8 |
| 2 | **Receivables Security** | 15185875555988 | **~110** | **9** |
| 3 | Logistics Security | 15185875554452 | ~55 | 8 |
| 4 | **Purchasing Security** | 15185859411732 | **22** | **9** |
| 5 | System Security | 15185875776532 | 16 | 8 |
| 6 | **Payables Security** | 15185875557140 | **15** | **9** |
| 7 | Service Security | 15185875555220 | 10 | 8 |
| 8 | Personal Information Security | 15185859628180 | ~9 | 7 |
| 9 | **Transfer Security** | 15185859625876 | *(a matrix, not a list)* | **9** |
| 10 | **Import Data Security** | 15185859622804 | *(one per import process)* | **9** |

**Total: roughly 360 named permissions**, plus two non-list mechanisms.

---

## B. Wiring findings

### FINDING 440 — Run 02's two inverted PO-hold permissions are found, and they are inverted

- **Invariant:** the purchasing permissions grant creating orders *on* hold and taking them *off*, each with a value threshold.
- **Evidence** — `Create a User/Group Actions - Purchasing Security`, verbatim:
  > **`Create Manual Purchase Order On Hold`**
  > **`Create Manual Purchase Order On Hold` — `Threshold Amount`**
  > **`Take Purchase Order Off Hold`**
  > **`Take Purchase Order Off Hold` — `Threshold Amount`**
  Alongside: `Create replenishment purchase order not on hold` ·
  `Create purchase order not on hold from POS entry` *(Sales Security)*.
- **Maps to:** run 02 — **the two inverted permissions in the nine-source PO-hold convergence, located
  and confirmed**; run 07 F390 (`On-the-Fly PO's on Hold`); `W-024`; `W-050`.

> **Run 02 identified two *inverted* permissions inside the nine-source PO hold convergence** and the
> audit has referenced them in every run since without ever seeing them. **Here they are, and the
> inversion is real and deliberate.**
>
> The normal reading of a permission is *"allow a user to do the unusual thing."* Here:
> - **`Create Manual Purchase Order On Hold`** — the permission is to create a PO **that lands on
>   hold**. The *default* is presumably not on hold, so this grants the restrictive outcome.
> - **`Take Purchase Order Off Hold`** — the permission to release.
>
> And **each carries a `Threshold Amount`**, which is the part that makes the inversion coherent:
> **the permission applies below or above a value.** A buyer may release a purchase order up to
> £X; beyond that, someone else must. That is a spend-authority model expressed as two permissions
> and two numbers, and it is the only monetary authority threshold the audit has found.
>
> Read together with `Create replenishment purchase order not on hold` (Purchasing) and
> `Create purchase order not on hold from POS entry` (Sales), the pattern is clear: **POs default to
> hold in several paths, and bypassing that is the permissioned act.** Run 07 F390 found
> `On-the-Fly PO's on Hold` as the setting; these are the permissions around it.
>
> **Run 02's "inverted" judgment is confirmed as accurate**, four runs after it was made.

### FINDING 441 — Receivables Security is ~110 permissions and the largest concentration of financial authority

- **Invariant:** almost every receivables discretion is individually permissioned, with installment and revolving as the two largest families.
- **Evidence** — `Create a User/Group Actions - Receivables Security`. Selected verbatim, grouped:

**Installment (18)** — `Add Contract Grace Days` · `Adjust a contract balance` · `Change a contract
status` · `Contract Activation/Expiration Dates` · `Exclude Contracts from Auto Pay` ·
`Extend Contract's Number of Months` · `Forgive Late Fees on a payment due` · **`Merge Contracts`** ·
`Override Customer Return Automatic Cancellation Days` · `Override Deferment Fee` ·
`Override Deferment Settings` · `Override Due Day` · `Override Due Day/Change Settings` ·
**`Override Revoke Same as Cash Terms`** · `Override the Maximum Days for Back-Dating Payoffs` ·
**`Refinance Customers`** · plus four `Manage and Adjust - <process>` variants

**Revolving (19)** — eight `Revolving Payment Plan Restrictions - Override …` *(Classification Code ·
Location · **Maximum Credit Score** · **Minimum Credit Score** · Minimum Deposit Amount · Minimum
Financed Amount · Past Due Days · Plan Active Dates)* · seven `Revolving Terms and Conditions - …`
*(Add a New Plan · Apply Insurance to All Plans · Close a Plan · **Increase MMP Amount** · Maintain
Payment Agreements · Maintain Promotional Plans · Override Lowest MMP Allowed Restriction)* · two
`Revolving Worksheet - …` · six `View All Revolving Activity - …`

**Refunds (7)** — `Issue Deposit Refund` · `Issue Refund by Check` · `Issue Refund by Gift` ·
`Issue Refund by Other` · `Refund Gift Balance` · `Override Daily Maximum Cash Refund Per Customer` ·
`Maintain Customer Balances - Refund`

**Deposits (5)** — `Maintain Customer Deposits - Apply · Check Refund · Finance Credit ·
Immediate Refund · On-Account`, introduced verbatim as *"the following five settings determine user
access to the "Action" options in Maintain Customer Deposits."*

**Sensitive entry (6)** — `Type in credit card numbers if using online processing` ·
`…checking account numbers…` · `…finance account numbers…` · `Type in authorization numbers for
financed orders` · `Type in Gift Certificate/Card number during payment entry` ·
`Type in new gift card numbers if card swiping is required` — plus
**`View Encrypted Gift Card PIN`** and `Allow Manual External Credit Card Authorization` /
`EMV-Allow Manual EMV Credit Card Entry`

**Credit control (11)** — `Establish unlimited credit limit for customer` ·
**`Set a Customer's Maximum Credit Limit to $`** · `Update Customer's Credit Limit` ·
`Update Customer's credit score` · `Update bankruptcy score` · `Update Scoring classification` ·
`Update credit source` · `Update Manually Entered Customer Credit Holds` · `Update Customer's Web
Lock` · `Override Duplicate Social Security Number Restriction` · `Approve F4 credit holds placed on
financed orders`

**Non-boolean** — **`Payment Class Access`**: `Cash, Checks, Credit Cards, Financing, Miscellaneous,
Gift Cards, Debit Cards, Revolving, Installment` · **`Credit Hold Queue Codes`** ·
`Installment; Manage and Adjust Payment Method`

- **Maps to:** run 01 (Receivables) · run 03 F34, F41, F45, F85–F105 · run 04 F202 — **the governing
  permissions for two runs**; `W-030`; `W-024`; `W-050`.

> **The largest financial-authority surface in the system**, and it maps almost one-to-one onto run
> 03's financing and payments batches.
>
> **`Payment Class Access` with nine classes** is the permission behind run 03 F34's finding that
> *"seven payment types, each with its own entry window, and payment-type-level security"* — and there
> are **nine** classes, not seven. Cash · Checks · Credit Cards · Financing · Miscellaneous ·
> Gift Cards · Debit Cards · Revolving · Installment.
>
> **`Set a Customer's Maximum Credit Limit to $` is a value permission**, like Purchasing's threshold
> amounts (F440) and Sales Security's `Maximum Price Variance`. **Three value-bearing permissions**
> across the model — the only departures from booleans.
>
> **The six "Type in …" permissions are an exfiltration control**, not a data-entry convenience: if you
> cannot type a card number, you must swipe it, and the number never passes through a person. That is
> a PCI-shaped control (run 06 F323, run 07 F386) expressed as permissions.
>
> The long verbatim note on **Revolving Payment Plan Restrictions** is worth having in full: *"When a
> restriction is encountered during entry of the payment plan, **a security override prompt appears for
> each restriction**. If you have permission… or obtain a security override from another user, security
> is granted."* — **run 06 F316's override screen can fire repeatedly within one transaction**, once
> per restriction breached.
>
> And the exception it states: *"For partially invoiced orders, the open part is again subject to these
> restrictions. **Exceptions are Override Minimum Deposit Amount and Override Minimum Financed
> Amount: these are not checked again unless a material change is made.**"* Two restrictions are
> evaluated once; the other six are re-evaluated on the open portion.

### FINDING 442 — Transfer Security is a location-pair matrix, and enabling it with no table locks everyone out

- **Invariant:** transfer rights are a From/To grid per logon or user, and an empty grid denies all.
- **Evidence** — `Create a User Actions - Transfer Security`:
  > "Use this routine to create and maintain **transfer security tables by either logon and/or user**. Once you have accessed this screen, select **all the From/To location combinations** for which the user/logon can create transfers."
  > "In order to use these tables you must check the **`TRANSFERS - Use Transfer Security Tables`** setting on the Additional Settings tab in Inventory Control Settings. **If this box is checked and no tables are created, users cannot create transfers.**"
  > "If you do not have the security to create a transfer, you must **obtain a security override** from a user with the ability to create the transfer."
  Fields: **`Logon / User` · `From Location` · `To Location` · Check · Clear · Grid**.
- **Maps to:** run 04 F251 — **CONFIRMED as the fourth *kind* of access control**; run 07 F364, F406;
  `W-050`.

> Run 04 F251 identified this as *"a security **table**, not just a permission — not 'may this user do
> X' but 'may stock move from A to B'"* and called it a genuinely new kind of control. **Confirmed
> exactly**, with two details the audit could not have inferred.
>
> **It is keyed by logon *or* user** — so the matrix can be attached to a workstation identity as well
> as a person. Nothing else in the model does that.
>
> **Enabling the feature with no table configured denies every transfer, system-wide.** That is the
> most severe configuration trap the audit has found: one checkbox in Inventory Control Settings, and
> until somebody builds the matrix, **nobody can transfer anything**. The vendor states it plainly and
> offers the security override as the workaround — which would mean every transfer requiring a
> supervisor.

### FINDING 443 — Import Data Security is per-import-process, and defaults to fully open

- **Invariant:** each import process is individually permissioned, all granted by default.
- **Evidence** — `Create a User/Group Actions - Import Data Security`:
  > "Use the grid to allow a user/user group to access **individual imports** via the Import Data process."
  > "Items listed in the grid **correspond to the import processes listed in the Import Data routine**. Check the box to grant access. **Uncheck the box to require the user/user group to obtain a security override** in order to access the import process. **All import processes are checked by default.**"
- **Maps to:** run 07 F389 (import tokens) · the `Importing Data` subsection; `W-050`; `W-034`.

> **Default-open**, uniquely in this model — every other record grants nothing until checked. And
> unchecking does not deny; it **escalates to a security override**, which is a third behaviour beside
> allow and deny.
>
> Given that batch 5 F394 found **"data conversion imports also update audit comments"** and that
> imports write directly to settings and master data, **default-open import access is the widest
> default in the system.** For a cutover it is also the mechanism our migration would use.

### FINDING 444 — Payables Security is gated on modules being active

- **Invariant:** the payables permissions only exist if AP, GL or TPA is installed.
- **Evidence** — `Create a User/Group Actions - Payables Security`:
  > "**NOTE: These settings are available only if AP, GL or TPA is active.**"
  Fifteen permissions, including **`Access General Ledger Account Settings`** ·
  **`Change exchange rate during vendor invoice entry`** ·
  `Change product replacement cost during vendor invoice entry` ·
  `Change reconciliation beginning balance in Bank Settings` ·
  **`Delete payable bills after third party accounting transmission`** ·
  `Print accounts payable checks` · `Print refund checks` · `Approve refund bills` ·
  `Update an exported check run` · **`View encrypted AP account numbers`** ·
  `Create new vendors during vendor invoice entry`.
- **Maps to:** run 01 (Payables, General Ledger) · run 04 F272, run 07 F387 (currency) · run 07 F377
  (licensing); `W-052` / `W-053`; `W-050`.

> **The only record whose availability is conditional on modules** — a further instance of run 04's
> licensing pattern, now reaching the permission model itself.
>
> **`Change exchange rate during vendor invoice entry`** is the third currency sighting after run 04
> F272's landed-cost exchange rate and run 07 F387's `Home Currency`. **Foreign-denominated vendor
> invoices are entered directly**, not only through landed-cost distribution. That widens the
> multi-currency requirement slightly from batch 4's reading.
>
> **`Delete payable bills after third party accounting transmission`** is a strong permission — undoing
> something already sent to an external accounting system. **`TPA`** (third-party accounting) matches
> `Third-Party Accounting Control Settings` and `TPA Transmission Phantom` in System Control Settings.

### FINDING 445 — Purchasing Security governs editing already-transmitted purchase orders

- **Invariant:** POs that have been printed, emailed or sent by EDI need permission to edit.
- **Evidence** — `Create a User/Group Actions - Purchasing Security`:
  **`Edit EDI purchase orders that were electronically submitted`** ·
  **`Edit purchase orders that have been printed or emailed`** ·
  **`Reopen a Closed Purchase Order`** ·
  `Electronically submit (EDI) purchase orders within POS entry` ·
  `Reduce Special Order quantities on Purchase Orders linked to a Sales Order` ·
  **`Reduce purchase quantity below billed quantity`** ·
  `Change purchase order Pay Before Receipt setting` ·
  `Update product replacement or special order option cost within purchase entry screens` ·
  `Change Total Cost on a Configured Product` · `View True PO Delivery Date` ·
  `View expected receipt date for a product` · `Access product settings during the replenishment process`
- **Maps to:** run 02 (purchase orders) · run 04 F228 · run 07 F373 (vendor rewrites PO quantities);
  `W-005`; `W-042`.

> **Three permissions guard the PO after it has left the building** — edit after print/email, edit
> after EDI submission, and reopen after closing. That is the right set, and it sits alongside the two
> mechanisms by which the PO gets rewritten *without* anyone asking: over-receipt (run 04 F228) and
> vendor EDI acknowledgements (run 07 F373).
>
> **The asymmetry is worth stating.** A human editing a transmitted PO needs permission; **the vendor
> changing it by 855/865 message needs only a setting.**
>
> **`Reduce purchase quantity below billed quantity`** implies POs can be billed before being fully
> received — consistent with `Change purchase order Pay Before Receipt setting` and with run 03 batch
> 16's `Report Merchandise Paid but Never Received`.
>
> **`View True PO Delivery Date`** implies there is a displayed date and a true one. Unexplained.

### FINDING 446 — Three permissions carry monetary or numeric values

- **Invariant:** the model is booleans except for three thresholds.
- **Evidence**:
  **Purchasing** — `Create Manual Purchase Order On Hold` → `Threshold Amount`;
  `Take Purchase Order Off Hold` → `Threshold Amount` (F440)
  **Receivables** — `Set a Customer's Maximum Credit Limit to $` (F441)
  **Sales** — `Maximum Price Variance` (batch 8 F429)
- **Maps to:** F428 (a flat boolean model); run 07 F345; `W-050`.

> **Four value-bearing entries in roughly 360.** Everything else is a checkbox.
>
> That is the shape of a spend-authority model that was never generalised: purchase-order release has
> thresholds, credit limits have a ceiling, price reduction has a percentage — **and nothing else
> does.** There is no per-user refund limit, no per-user discount cap in dollars, no approval ladder.
>
> For the rebuild this is a clear improvement opportunity and a clear migration question: **the
> business's real approval hierarchy is probably enforced socially, not systemically**, because the
> system offers only four places to express it.

### FINDING 447 — The override prompt can fire repeatedly within one transaction

- **Invariant:** each restriction breached raises its own override prompt.
- **Evidence** — `Receivables Security`, on Revolving Payment Plan Restrictions:
  > "When a restriction is encountered during entry of the payment plan, **a security override prompt appears for each restriction**. If you have permission via these settings **or obtain a security override from another user**, security is granted and the entry of the payment plan is allowed. **Otherwise, the entry is not allowed.**"
- **Maps to:** run 06 F316 — **materially extends it**; F441; `W-050`.

> Run 06 F316 documented the override screen as a single event. **It is per restriction.** A revolving
> plan breaching four of the eight restrictions raises **four prompts**, each needing permission or a
> supervisor.
>
> That is a meaningful operational fact — it is the difference between a manager walking over once and
> walking over four times — and it explains why the eight overrides are separately permissioned rather
> than bundled.

### FINDING 448 — Credit application access is three-way, with a self-service carve-out

- **Invariant:** who may see a credit application depends on whose it is and who created it.
- **Evidence** — `Receivables Security`:
  **`Access credit applications for Third Party On-Line financing`** ·
  **`Access employee credit applications and score reporting`** ·
  **`Access other credit applications and score reporting`** ·
  `Access credit applications - Request Credit Information`
  > "If you do **not** have access to general credit request processing via one of the "Access…credit applications…" fields above, **you may still be able to re-access a credit application that you created** to make changes… the application must be **open (no decision has been applied)** and the **salesperson code on the credit request must match the logged in user**. **Once the request item is declined or approved, all restrictions are in affect**, limiting your access to sensitive information."
- **Maps to:** run 03 F90–F94 · batch 7 F418 (`Access employee credit applications…` also appears in
  Personal Information Security); `W-030`; `W-050`.

> **A well-judged carve-out**: a salesperson can work their own in-progress application without
> holding the general permission, **and loses access the moment a decision lands.** That is exactly
> the right boundary — you may help your customer apply; you may not see the outcome data.
>
> **`Access employee credit applications and score reporting` appears in two records** — here and in
> Personal Information Security (batch 7 F418). **Twelfth terminology overlap**, and the first time
> the audit has found the *same permission* in two module records. Whether they are one setting shown
> twice or two independent ones is not stated.

### FINDING 449 — Payment classes are nine, not seven

- **Invariant:** payment access is granted per class from a nine-value list.
- **Evidence** — `Receivables Security`, **`Payment Class Access`**:
  > `Cash, Checks, Credit Cards, Financing, Miscellaneous, Gift Cards, Debit Cards, Revolving, Installment`
- **Maps to:** run 03 F34 (*"seven payment types, each with its own entry window, and payment-type-level
  security"*) — **corrected to nine**; `W-050`.

> Run 03 F34 counted **seven payment types** from the entry windows. **The security model has nine
> classes**, adding Revolving and Installment — which are receivables plans rather than tender at the
> counter, and so would not have appeared as payment entry windows.
>
> A small correction, and a useful one: **payment *class* and payment *type* are different
> vocabularies**, and the security model uses the broader one.

### FINDING 450 — Every record states the same three structural facts

- **Invariant:** the permission model's constraints are documented identically ten times.
- **Evidence** — in all ten records, verbatim:
  > "In order to use these security settings, **extended security must be active**…"
  > "Settings accessed from the **Create a User Group** routine apply to **all users in that group**, while settings accessed via **Create a User** apply to the **individual user**."
  > "To view which security settings are enabled and not enabled…, use **Report on User Security**."
- **Maps to:** batch 8 F433; run 06 F323; batch 7 F427; `W-050`.

> Ten identical statements is as strong as this documentation gets. **The three facts are: the model
> is switchable off, it has exactly two levels, and it needs a report to be readable.**
>
> **The conflict rule between user and group is still not stated in any of the ten.** Batch 8 F433
> flagged it; ten records later it remains the single most important undocumented fact in the access
> model, because **it determines what a permission actually means.**

### FINDING 451 — The catalogue's shape by module reveals where discretion lives

- **Invariant:** permission counts are wildly uneven and follow money and risk.
- **Evidence**, from §A:

| Module | Permissions | Share |
|---|---|---|
| Sales | ~120 | 33% |
| **Receivables** | **~110** | **31%** |
| Logistics | ~55 | 15% |
| Purchasing | 22 | 6% |
| System | 16 | 4% |
| Payables | 15 | 4% |
| Service | 10 | 3% |
| Personal Information | ~9 | 3% |
| Transfer / Import Data | *(non-list)* | — |

- **Maps to:** F428; all six prior runs.

> **Two-thirds of the entire permission model is Sales and Receivables** — the counter and the credit
> desk. That is where money is committed and where a business is defrauded, and STORIS's authorisation
> effort is concentrated there almost exactly in proportion.
>
> **Service has ten permissions to Sales's hundred and twenty**, which matches run 05's finding that
> service is the best-instrumented but least-governed module — it has event-sourced status history and
> almost no authorisation.
>
> **Logistics's 55 is the surprise**, and it reflects run 04's finding that warehouse work is full of
> physical-world discretion: overriding capacity, exiting a float, recounting a location, over-receiving.
>
> For the rebuild, **this distribution is a better guide to where authorisation matters than any
> abstract role design**, and it comes from twenty years of a vendor responding to customer requests.

### FINDING 452 — User Settings coverage statement

- **Invariant:** the subsection is enumerated and its high-value records read.

**User Settings — 49 articles, disposition:**

| Family | Articles | Disposition |
|---|---|---|
| **Module security** | 10 | **All 10 read** (batches 7–9) |
| **Identity** | `Create a User` · `Create a User Group` · `User Group Clone Process` · `Managing Users` | **1 read**; three named, unread |
| **Access model** | `Regional Processing - Rules, Notes, and Exceptions` · `- Reporting Rules` | **Both read** (batches 6–7) |
| **Audit** | `Track Settings Activity` · *(`Review Settings Activity`, `Report on User Security` named elsewhere)* | **1 read** (batch 5) |
| **Codes and tables** | `Reason Code Settings` · `Reason Code Spiff Table` · `Miscellaneous Fee Settings` · `Rate Table Settings` · `Receivable Payment Source Settings` · `Import Provider Type Settings` · `Insurance Underwriter Settings` · `Telephone Mask Settings` · `Individual Zip Codes` · `Country Settings` · `Company Settings` · `Set Domestic Country` | **1 read** (`Reason Code Settings`, batch 6); 11 named |
| **Attachments** | `Attachment Description Entry Screen` · `Edit File Attachments` · `View File Attachments` | 3 named — **run 05's gap, located** (batch 6 F411) |
| **Credit / installment** | `Installment Credit Approval Limits` · `Installment Credit Approval Rules` · `Tax Jurisdiction Reduction Percent Screen` | 3 named |
| **Other** | `Schedule a Process` · `Schedule Daily Reports Preferences` · `Sales Performance Report` · `RF Barcode User Settings` · `PC Applications Window` · `User Defined Settings` · `Customer Purge` · `Convert Comment Files` · `Description Field - Language Translation Entry` · `Foreign Processing Overview` · `Protection Plans Overview` · `Restricted Payment Type Select Window` · `Remove from Hold & Send via EDI Preferences` · `Customer Service Maintenance - User File` | 14 named |

**16 of 49 read in full**, weighted entirely toward the access model. **No article skipped silently.**

---

## C–E. Consolidated permission catalogue

**See batch 8 §E for the model.** Completed here:

| Record | Permissions | Notable |
|---|---|---|
| Sales | ~120 | `Maximum Price Variance` *(value)*; four-way deletion sub-grid |
| Receivables | ~110 | `Payment Class Access` *(9 classes)*; `Set a Customer's Maximum Credit Limit to $` *(value)*; six "Type in…" exfiltration controls |
| Logistics | ~55 | Two route-override states; `Apply or Remove an As-Is Restricted Reason Code` |
| Purchasing | 22 | **Two `Threshold Amount` permissions — run 02's inverted pair** |
| System | 16 | `Access ECL command line mode` |
| Payables | 15 | **Conditional on AP/GL/TPA being active** |
| Service | 10 | Covered/uncovered warranty split |
| Personal Information | ~9 | PII masking × 4 surfaces |
| **Transfer** | *(matrix)* | From/To grid by **logon or user**; **empty table denies all** |
| **Import Data** | *(per process)* | **Default open**; unchecking escalates to override |

**Three behaviours beyond allow/deny:** value thresholds *(4 entries)* · escalate-to-override
*(Import Data)* · per-restriction repeated prompting *(Revolving)*.

---

## F. State machines and enumerations (additions)

- **Payment classes (9)** — F449.
- **Revolving plan restrictions (8)**, each separately overridable and prompted (F441, F447).
- **Installment contract actions (18)** including merge and refinance (F441).
- **Refund methods (5):** deposit · check · gift · other · gift balance (F441).
- **Maintain Customer Deposits actions (5):** Apply · Check Refund · Finance Credit · Immediate
  Refund · On-Account (F441).
- **Credit application classes (3):** third-party online · **employee** · other (F448).

---

## G. Sequencing rules

1. Extended Security active → the ten records apply; **Payables additionally requires AP, GL or TPA**
   (F444, F450).
2. `TRANSFERS - Use Transfer Security Tables` checked → **the From/To matrix governs; empty means
   nobody transfers** (F442).
3. Revolving plan entered → **one override prompt per restriction breached**; two restrictions are not
   re-checked on the open part of a partially invoiced order unless materially changed (F441, F447).
4. Credit application created → the creating salesperson may re-access **while open**; **on decision,
   all restrictions apply** (F448).
5. Purchase order created → lands on hold in several paths → **release is permissioned, with a value
   threshold** (F440).

---

## H. Open questions and gaps

### Resolved this batch

- **Run 02's two inverted PO-hold permissions** — located, confirmed inverted, and explained by their
  threshold amounts (F440). **Open since run 02.**
- **Run 04 F251's location-pair matrix** — confirmed, with the empty-table trap (F442).
- **Run 03 F34's payment types** — corrected from seven to nine classes (F449).
- **The consolidated permission catalogue** — **complete: ten of ten records** (§C–E).

### Still open — and now prominent

- **User-versus-group conflict resolution** — stated nowhere in ten records (F450). **The single most
  important undocumented fact in the access model.**
- **Whether `Access employee credit applications and score reporting` in two records is one setting or
  two** (F448).
- **`View True PO Delivery Date`** — implies a displayed date differs from a true one (F445).
- `Assign Screen Action Permission` — a possible eighth kind of control, still unread.
- `File Security Groups` · `Field Security Codes` — still two field names (batch 7 F417).

### Inferences

- **I-78:** The `Threshold Amount` on the two PO-hold permissions is a monetary ceiling below which
  the permission applies. *The field name and pairing strongly imply it; no article states the
  direction.*
- **I-79:** `Payment Class Access` is the mechanism behind run 03 F34's "payment-type-level security".
  *The concepts align; the two articles never reference each other.*

---

## I. Unknown unknowns

- **The model has four value-bearing permissions in ~360** (F446). Approval hierarchies that any
  business has — who may refund how much, who may discount how far — **are not expressible here**, so
  they are enforced by convention. Migrating "the way we do approvals" will mean building something
  STORIS never had.
- **One checkbox can stop all transfers** (F442). Enabling transfer security tables without building
  them denies the whole company. That is a live risk in any configuration change.
- **Import access is default-open** (F443) in a model where everything else is default-closed, and
  imports write to settings and master data.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Threshold Amount** | Value ceiling attached to the two PO-hold permissions |
| **Payment Class Access** | Nine-class permission over tender and receivables plans |
| **Transfer Security Table** | From/To location matrix, keyed by logon or user |
| **TPA** | Third-party accounting; one of three modules gating Payables Security |
| **MMP** | Minimum monthly payment *(revolving plans)* |

---

## Contract adjudication — batch 9

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED — the catalogue is complete at ten records, ~360 permissions** | F440–F451 |
| **W-024** *(holds)* | **CONFIRMED — run 02's inverted PO-hold permissions located** | F440 |
| **W-030** *(financing)* | **CONFIRMED and extended** | ~110 receivables permissions; per-restriction override prompting (F441, F447) |
| **W-005** *(purchasing)* | **CONFIRMED** | Editing transmitted POs is permissioned; vendor EDI rewrites are not (F445) |
| **W-052 / W-053** *(GL)* | **CONFIRMED** | Payables permissions conditional on AP/GL/TPA (F444) |
| **W-061** *(cost)* | **CONFIRMED** | Cost-change permissions in Purchasing and Payables |
| **W-034** *(deletion)* | **CONFIRMED** | `Delete payable bills after third party accounting transmission` (F444) |

---

## Next — batch 10

`Create a User Group` · `User Group Clone Process` · `Assign Screen Action Permission` ·
`Report on User Security` — then **Customer Settings** (137), where **`Alert Code Settings`**
*(the fraud engine behind hold codes `C7`/`C8`)* and **`Status Code Settings`** *(five articles across
two runs, one value ever named)* live.
