# Run 07 — System Administration — Batch 20: Credit Reporting Codes, Finance Providers and Collections

Status: complete. Findings 622–636. Read-only throughout.

The Metro 2 code tables batch 19 named are read; the **third-party finance integration** turns out to
be ~30 per-provider behaviour flags plus a transport stack; and **collections** is a routed work-queue
system with quota-carrying collectors. **`ELP` is finally traceable** (F636).

---

## A. Coverage log

| # | Article | id | Section | Status |
|---|---|---|---|---|
| 1 | **Metro 2 Code Settings** | 15242594991892 | Customer Settings | read |
| 2 | **Account Status Settings** | 15242611077268 | Customer Settings | read — `11.0`/`10.8` |
| 3 | **Special Comment Settings** | 15297965136020 | Customer Settings | read — `11.0`/`10.8` |
| 4 | **Compliance Condition Settings** | 15242629664020 | Customer Settings | read |
| 5 | **Customer Settings** | 15242630128788 | Customer Settings | read |
| 6 | **Finance Provider Settings** | 15242630366228 | Customer Settings | read — `11.0`/`10.8`, three tabs |
| 7 | **Commission Settings** | 15242611359252 | Customer Settings | read |
| 8 | **Collector Settings** | 15242629660820 | Customer Settings | read |
| 9 | **Collection Letter Settings** | 15242611080468 | Customer Settings | read |

**Customer Settings inventoried** (137 articles, listing read in full). The subsection is
**predominantly payments, credit and receivables configuration** — not customer-master maintenance as
the name suggests. Named but not read this batch, recorded for coverage: `Activity Reason Settings` ·
`Address Exception List Settings` · `Alternate Taxable Merchandise Calculation` · `Bank Settings` ·
`Card Length Format Action` · `Cash Drawer Settings` · `Cash Payment Settings` · `Check Payment
Settings` · `Closing Probability Settings` · `Commission Settings Lookup` · `Contract Balance
Adjustment Settings` · `Contract Classification Settings` · `Create Check Run File` ·
`Create/Maintain a Daily Discount Schedule` · `Create/Maintain a Membership Discount Schedule` ·
`Credit Application Settings` · `Credit Bureau Code Settings` · `Credit Bureau Settings` ·
`Credit Card Payment Settings` · `Credit Cards Already on File` · `Credit Employment Status
Settings` · `Credit Review Status Code Settings` · `Credit Score Percentile Settings` · `Credit
Source Settings` · `Customer Alert Code Settings` · `Customer Prefix Settings` · `CVV Prompt` ·
`CVV2 Prompt` · `Debit Card Overview` · `Debit Card Payment Settings` · `Desjardins Configuration` ·
`Enable VISA Credit Card Rules` · `Enter Customer's Date of Birth` · `Equivalent Pay Types Screen` ·
`eSTORIS Product Search Filter` · `Extended Receivables Insurance Code Settings` · `Finance
Application Queue Tier Settings` · `Finance Level/MMP Table` · `Finance Provider Settings by Finance
Type` + ~60 more.

---

## B. Wiring findings

### FINDING 622 — Three Metro 2 code tables are closed sets transcribed from an external industry standard

- **Invariant:** account status, special comment and compliance condition codes are CDIA-defined and cannot be added to or deleted.
- **Evidence** — `Account Status Settings`:
  > "…the Metro 2 account status message codes you send to your credit bureau… **This file contains the account status codes defined in `Exhibit 4` of the Consumer Data Industry Association Credit Reporting Resource Guide.**"
  > "**NOTE: You cannot add or delete Metro 2 account status message codes.**"
  `Special Comment Settings`:
  > "**…as defined in `Exhibit 6` of the Consumer Data Industry Association Credit Reporting Resource Guide established for Revolving Receivables. STORIS flags all special comment codes as available for entry on Revolving plans.**"
  > "**NOTE: You cannot add or delete special comment codes.**"
  > "Text appearing below the `Account Closed` field indicates whether this special comment is **available for reporting revolving receivables, installment receivables, or both.**"
  `Compliance Condition Settings`:
  > "**…as defined in `Exhibit 8` of the Consumer Data Industry Association Credit Reporting Resource Guide.** **NOTE: You cannot add or delete compliance codes.**"
- **Maps to:** batch 19 F606 · batch 14 F507 (undeletable purchase statuses) · W-034, W-064.

> **These are the only code tables in seven runs whose contents are set by an outside body.** Every
> other vendor-owned table in STORIS is vendor-owned by convention; these are **externally
> standardised**, with the source document and exhibit number cited.
>
> **That is the strongest possible rebuild instruction:** do not model these as configuration. Import
> the CDIA exhibits, keep the codes closed, and expect them to change when the standard does. **The
> rebuild's obligation is to the standard, not to STORIS.**
>
> **Codes are scoped by product type** — special comments carry a revolving/installment/both marker.
> A rebuild that lets a user pick any code for any plan type will produce rejected submissions.

### FINDING 623 — Metro 2 codes attach at either the customer or the individual contract

- **Invariant:** the same routine is reachable from the customer record and from an installment contract.
- **Evidence** — `Metro 2 Code Settings`, two documented access paths:
  > "**Advanced Customer Settings > Receivables page > Actions button > Metro 2 Settings**"
  > "**Receivables > Installment Receivables > Manage and Adjust Installment Contracts > Review Contract Details button > Actions button > Metro 2 Settings**"
  > "Use this routine to associate various Metro 2 settings with **the customer or contract specified.**"
  Fields: `Account Status` · **`Payment Rating`** · `Special Comment` · `Compliance Condition` ·
  `Updated Date` · `Reported Date` · **`Closed Date`**.
- **Maps to:** batch 19 F605, F606, F607 · batch 17 F578 (payment history) · W-064.

> **Credit reporting is per *tradeline*, not per person** — which is correct for Metro 2, since a
> customer with three installment contracts appears as three tradelines. **The rebuild must model the
> reporting entity as the contract**, with the customer as an attribute, not the other way round.
>
> **`Payment Rating` appears here and nowhere else the audit has read.** It is a distinct Metro 2
> field from account status and from the payment history string of batch 17 F578 — a third
> delinquency-adjacent value. **No settings table backs it**, so its values presumably come from the
> standard. §H.
>
> **`Updated Date` and `Reported Date` are separate**, which means STORIS tracks when it last changed
> the codes *and* when they last went to the bureau. Useful, and a rebuild should keep both.

### FINDING 624 — Some account status codes cannot be entered by a person

- **Invariant:** an `Allow Manual Entry` flag on the code decides whether a user may select it.
- **Evidence** — `Account Status Settings` fields: `Account Status` · `Description` ·
  **`Allow Manual Entry`** · **`Account Closed`** · Actions.
- **Maps to:** F622 · batch 14 F506 (purchase status `P` is process-set only) · W-064.

> **The same pattern as purchase status `P`** (batch 14 F506): a code that only the system may
> assign. In a credit-reporting context that is a control worth having — statuses like "paid in full"
> or "charged off" should be derived from the account, not typed by a collector.
>
> **`Account Closed` on the code drives the closed-date behaviour** batch 19 F607 documented — a code
> flagged as closing sets the closed date, which then backfills the customer's inactive date if empty.
> **Three records deep, and each step is conditional.**

### FINDING 625 — `Customer Settings` and `Advanced Customer Settings` are one file with two views

- **Invariant:** the shorter routine omits the Receivables and Advanced tabs but shares the record and the create permission.
- **Evidence** — `Customer Settings`:
  > "**The Receivables and Advanced tabs are not accessible via this routine. To access those tabs, use the Advanced Customer Settings. You can also view the tabs via the View Advanced Customer Settings routine.**"
  > "**To create new customers via this routine, you must have access via the `Advanced Customer Settings; Create new customer` field on the Extended Security (Receivables) routine.**"
  Tabs: General · Point of Sale only. Field names differ slightly from the Advanced routine —
  `Charge Sales Tax` (vs `Charge on Sales`), `Tax Exempt ID Number` (vs `ID Number`),
  `Store Assignment` (vs `Store Location`), `Salesperson 1 Percent` (vs `Salesperson 1 Commission %`).
- **Maps to:** batch 18 F595, F601 · batch 16 (view-only twins) · W-036, W-050.

> **A third view of one record**, after `Advanced Customer Settings` and `View Advanced Customer
> Settings` — and it is not a permission-derived view but a *separate menu routine* that structurally
> cannot reach the sensitive tabs. **Access control by routine choice rather than by permission.**
>
> **The field labels differ between the two routines for the same underlying fields.** That is a real
> migration hazard: `Charge Sales Tax` here and `Charge on Sales` there are the same field. **A
> rebuild mapping by label across STORIS documentation will create duplicates.** Recorded in §H.
>
> **Note the permission name is unchanged** — creating a customer here still requires *"Advanced
> Customer Settings; Create new customer"*. So the permission is on the data, not the screen.

### FINDING 626 — Transmitting finance providers are vendor-owned; sites may only add non-transmitting ones

- **Invariant:** the electronic-connection provider list is closed; site-added providers can never transmit.
- **Evidence** — `Finance Provider Settings`:
  > "…third-party finance providers, for example **Citi Financial, Encompass or GE Capital**. **STORIS comes pre-loaded with finance providers to which STORIS can electronically transmit financing transactions. A 1 or 2 digit numeric provider code is assigned to each of these. You cannot edit, delete, or create new transmitting provider codes. However, you can add new, non-transmitting providers. That is, you cannot establish an electronic connection for instant transmission with any provider you add - only with the providers added by STORIS.**"
- **Maps to:** batch 17 F562 (23 integrations) · batch 15 F531 (STORIS-maintained fields) ·
  `AUDIT-CLOSEOUT.md` §5 (*"fifteen finance providers"*) · W-051, W-058.

> **A hard commercial boundary expressed as a data constraint.** Adding a finance partner is not a
> configuration task — it is a STORIS release. The site can record a provider for reference and
> manual processing, but the electronic path is vendor-gated.
>
> **This is a significant cutover finding.** The closeout counted fifteen finance providers as an
> external-dependency risk; this says **which of them can be electronically integrated is not LA
> Mattress's decision today**, and in a rebuild it becomes their decision — and their build cost. Each
> transmitting provider is a protocol implementation, not a config row.
>
> **A sixth vendor-owned reserved population**, after `RFND`, `STD`, purchase status types,
> `Standard Files`, `ZZZZZ`, and the Metro 2 exhibits.

### FINDING 627 — Provider behaviour is ~30 independent flags, including two credit-hold codes

- **Invariant:** each finance provider carries its own set of order-entry, contract and transmission behaviours.
- **Evidence** — `Finance Provider Settings`, Online Transmit tab, verbatim selections:
  > "`ACCOUNT NUMBER - Allow Entry of Finance Account Numbers on the Fly` · `ACCOUNT NUMBER - Allow for a Finance Plan to be Applied to an Order Prior To Account Number Assignment` · `ACCOUNT NUMBER - Default the Account Number from the Customer File` · `ACCOUNT NUMBER - Require an Account Number When Requesting Financed Authorizations`"
  > "`CONTRACTS - Allow Adjustments after Partial Completion` · `CONTRACTS - Allow Debit/Credit Exchanges` · `CONTRACTS - Allow Zero Dollar Line Items After Partial Completion`"
  > "**`CREDIT HOLD - Place Orders on F3 Credit Hold if Provider Declines Financing`**"
  > "`CREDIT PROTECTION - Prompt for Credit Protection in the Credit Application Process` · `CREDIT VIEW - Activate the Online Available Credit Information Inquiry`"
  > "`INSTALLATION CHARGE - Allow installation charge on RTO orders by state/province` · `SALES TAX - Remove sales tax on RTO orders by state`"
  > "`PROVIDER - Process as Installment` · `QUEUING - Include Provider in Application Queue` · `QUEUING - Treat Pending Response as Closed`"
  > "`TRANSMIT - Activate the Transmission of Financed Transactions` · `…of Financed Credit Applications` · `…of Authorization Reversals` · `TRANSMIT - Allow Partial Reversals` · `TRANSMIT - Combine Transaction Dates` · `TRANSMIT - Notify Providers When No Settlement Details Are Available` · `TRANSMIT - Receive Electronic Authorization` · `TRANSMIT - Allow Entry of an Authorization Number for Online Providers` · `TRANSMIT - Allow Resubmission of Pending Applications` · `LOGS - Activate Transmission Logging`"
  General tab also carries **`Place Orders on F4 Credit Hold`**, `Refund Original Financing`,
  `Authorization Alert Message`, `Finance Comments Required`, `Customer Daily Cash Limit`,
  `Payment Class Access`, and five provider-supplied `Transaction Codes` (`Initial Sale` ·
  `Add On Sale` · `Customer Return` · `In-Store Payment` · `Payment Reversal`).
- **Maps to:** **run 04 F201** (the 22-code credit hold catalogue) · batch 16 §3 Sales Security
  (`Approve E1 credit holds`) · run 03 (order entry) · W-035, W-058.

> **`F3` and `F4` are two of run 04's 22 credit hold codes, and this names their triggers.** `F4` is
> placed by the provider association itself; `F3` by a decline. Run 04 catalogued the codes without
> their causes for most of the set — **two more causes now attributed.** The Sales Security permission
> `Approve E1 credit holds` covers a third code, so the audit now has three of twenty-two sourced.
>
> **A finance provider is effectively a behaviour profile that reaches into order entry, tax,
> contracts and holds.** `SALES TAX - Remove sales tax on RTO orders by state` on a *provider* record
> overlaps `Remove Tax on Orders with RTO Plans` on the *tax* record (batch 19 F616). **Two places
> configure the same RTO tax behaviour and no article states the precedence.** §H.
>
> **`QUEUING - Treat Pending Response as Closed` is quietly consequential**: it decides whether an
> application awaiting a provider answer blocks or releases the workflow.

### FINDING 628 — A block of provider fields is locked for STORIS use only

- **Invariant:** protocol record-version fields are visible, documented, and not editable by the site.
- **Evidence** — `Finance Provider Settings`, Communications tab:
  > "**RECORD VERSION** — Enter the most recent record version for each field. **These fields are not mandatory and are currently only used by Alliance Data Services. These fields are locked for STORIS use only.** These fields allow alphanumeric characters with a maximum length of 10 characters."
  > "`Settlement` - **The latest settlement version is 002.66.**"
  Fields: `Application` · `Authorization - Sale` · `Authorization - Return` ·
  `Authorization Reversal` · `Available Credit` · `In-Store Payment` · `Settlement`.
- **Maps to:** **batch 15 F531** (*"certain fields on this screen must be maintained by STORIS"* —
  unnamed) — **now a named instance** · batch 16 §I · W-058.

> **Batch 15 recorded that some settings fields are vendor-maintained and flagged that STORIS does not
> say which. Here is a case where it does say which** — an explicitly labelled, self-describing block.
>
> **That makes batch 16's unknown-unknown sharper rather than weaker:** STORIS marks vendor-locked
> fields *sometimes*. The Vendor EDI record says fields exist without naming them; this record names
> them. **So an unmarked field is not evidence that it is site-editable.** The concern stands and the
> audit now has a documented example of both behaviours.
>
> **A hard-coded protocol version in a settings field** (`002.66`) is a maintenance liability worth
> noting: the provider's protocol version lives in the database, so upgrading it is a data change made
> by the vendor.

### FINDING 629 — Web-service credentials fall back to a merchant-level record when blank

- **Invariant:** empty provider credentials defer to `Finance Merchant Settings`.
- **Evidence** — `Finance Provider Settings`, Communications › WEB SERVICE:
  > "These fields are active only if you select **Web Service** at the `Transmission Method` field… The User ID, Password, and URL information are supplied by the finance provider. **When using a web service, if the `User ID` and `Password` fields are empty, the system obtains the information from the `Finance Merchant Settings`.**"
  > "The following fields are active only if you select either **TCP/IP or SSL** at the `Transmission Method` field…"
  URLs are per-operation: `Application` · `Authorization - Sale` · `Authorization - Return` ·
  `Authorization Reversal` · `Available Credit` · `In-Store Payment` · `Settlement` ·
  `New Application - CFA` · `Resubmit Application - CFA`.
- **Maps to:** the **blank-defers idiom** · batch 17 F564 (Podium's presence-as-mode-switch) ·
  batch 19 F620 (the one inversion) · W-058.

> **Blank defers, correctly** — the house idiom holding in an integration context, which makes batch
> 19 F620's zip-code inversion look even more like an anomaly rather than a second convention.
>
> **Three transmission methods with mutually-exclusive field sets** (TCP/IP, SSL, Web Service), plus
> SFTP for settlement. **Nine separate endpoint URLs per provider** means the integration is
> operation-granular, not service-granular — a rebuild cannot model a provider as "one base URL".

### FINDING 630 — Commission uses the same matrix shape as customer pricing, capped at 1,296 codes

- **Invariant:** a matrix code is the concatenation of two category codes; one category per customer/salesperson and per product.
- **Evidence** — `Commission Settings`:
  > "**A matrix code can be alphanumeric, and you can create up to 1296 different matrices.** The system reviews each line item on a sales transaction to determine the correct commission percent. **You can specify only one commission category for each customer/salesperson and product.**"
  > "When entering a sales order, the program **joins the customer or salesperson commission category code with the product commission category code (separately for each product ordered) to form a matrix code** and searches for a commission matrix record in this file with that ID."
  > "If you set the `Calculation Method` field to **Customer Matrix or Salesperson Matrix** in the Point of Sale Control Settings, you can use this file to create the matrices."
  Fields: `Commission Categories` (`Customer/Salesperson` · `Product`) · Commission Calculation
  (`Method` · `Source` · `Commission Rate`) · Tiered Gross Profit Table (`Min Gross Profit %` ·
  `Commission %`).
- **Maps to:** batch 19 F608 (the price matrix, same shape) · batch 18 F601 · run 03 (commission) ·
  batch 14 F513 (kit commission inversion) · W-046.

> **1,296 = 36².** Each category is one alphanumeric character (26 letters + 10 digits), and the matrix
> code is the two concatenated. **That is a hard structural limit the rebuild should not inherit** —
> and it explains why STORIS calls these "categories" rather than allowing arbitrary keys.
>
> **The same two-category-join design as the price matrix** (batch 19 F608). STORIS solves
> customer-specific pricing and customer-specific commission with one idiom. **A rebuild should
> implement a general category-matrix once.**
>
> **"Customer *or* salesperson"** — the first dimension is whichever the calculation method selects,
> so the same file holds two different matrix types distinguished by a control setting elsewhere.

### FINDING 631 — The calculation method gates which commission fields may legally be filled

- **Invariant:** a POS control setting determines which Commission Settings configurations are valid, with explicit emptiness requirements.
- **Evidence** — `Commission Settings`:
  > "**NOTE: When the `Calculation Method` is set to `Customer Matrix` or `Gross Profit`, the `Tiered Gross Profit Table` must be empty.**"
  > "**When the `Calculation Method` is set to `Salesperson Matrix`, the `Commission Calculation Method` cannot be set to 'is an Amount $' and the `Commission Rate` must be empty.**"
  > "**If you need to change the calculation method to be used, you must make the change in your Point of Sale Control Settings before you can establish Commission Settings based on the new calculation method.**"
- **Maps to:** batch 1 (POS Control Settings) · F630, F633 · W-046.

> **Cross-record validation expressed as required emptiness** — a shape the audit has not met. It is
> not "this field is inactive"; it is "this field must contain nothing, or the configuration is
> invalid".
>
> **The ordering requirement is a real operational constraint:** change the control setting *first*,
> then the matrices. Doing it the other way leaves an invalid configuration. **A rebuild should
> validate the whole commission configuration as a unit** rather than field by field.
>
> **At least four calculation methods are implied** — `Customer Matrix`, `Salesperson Matrix`,
> `Gross Profit`, and whatever the default is. The full enumeration lives in POS Control Settings and
> was not captured in batch 1's field sweep. §H.

### FINDING 632 — Changing the commission method rewrites order item records and must be done off-hours

- **Invariant:** the change back-fills commission data onto existing order items and requires an empty system.
- **Evidence** — `Commission Settings`:
  > "**To ensure commission information is added to order item records correctly, the updates must occur during off hours when other users are not on the system.**"
- **Maps to:** run 04 F177 (the manifest takes an exclusive system-wide lock) · batch 15 F526
  (resolve once, store the answer) · W-046.

> **A settings change that mutates transaction data** — and the only mitigation offered is "do it when
> nobody is working". No lock, no batch job, no warning dialog documented: **an operational
> convention standing in for a technical control.**
>
> This is the second system-wide-exclusivity requirement in the audit after run 04's manifest lock,
> and the first that is *advisory rather than enforced*. **For the rebuild the lesson is not to copy
> the convention but to note what it implies:** commission data is denormalised onto order items
> (consistent with the resolve-once idiom), so any change to the derivation requires a backfill.

### FINDING 633 — Commission can vary by the line's gross margin through a tiered table

- **Invariant:** a min-gross-profit-percent table maps margin bands to commission rates, used only under Salesperson Matrix.
- **Evidence** — `Commission Settings`:
  > "Use the following fields to create a **variable rate table that applies variable commission rates based on the gross margin percentage earned for a line item**. This table is used **only when you have selected the variable commission rate option (`Calculation Method` = `Salesperson Matrix` in Point of Sale Control Settings)**."
  Fields: `Min Gross Profit %` · `Commission %`.
- **Maps to:** **run 03 F144** (margin is provisional — orders written at average cost, later
  restated) · batch 19 F609 (cost-based price matrix) · W-046, W-061.

> **This is the same exposure as batch 19 F609, on the pay side rather than the price side.**
> Commission banded on gross margin is computed from a margin that run 03 F144 established is
> **provisional** — restated when the true cost arrives.
>
> **So a salesperson's commission band can be determined by a cost figure that later changes**, and
> nothing the audit has read says whether the commission is recalculated. Combined with F632's
> statement that commission data is written onto order items, **the likely answer is that it is not.**
> That is an inference, not a finding — recorded as **I-102** — but it is the single most checkable
> question in this batch and it affects people's pay. §H.

### FINDING 634 — Collectors are assigned work by three range criteria, each gated by a control setting

- **Invariant:** alphabetic, past-due-age and past-due-amount ranges are each active only if the corresponding Collections Processing Control Setting is configured.
- **Evidence** — `Collector Settings`:
  > "**Alphabetic Range** — active only if a check appears at the `Alphabetical` field in the **Collections Processing Control Settings** (that is, only if your company assigns customers to collections **based on the first letter of the customer's last name**)… the `Mass Collector Reassignment` routine assigns them to the selected collector."
  > "**Past-Due Age Range** — active only if you have specified a **minimum days quantity** in the Collections Processing Control Settings… define the range of past-due days (for example, days 31-60)…"
  > "**Past-Due Amount Range** — active only if you have specified a **Minimum Amount**… define the range of balance-due amounts…"
  Also: `District` · `Store` · `Allow Manual Reassignment` · `Allow Automatic Reassignment` ·
  Yearly Quota by ageing bucket (`1-30 Days` · `31-60` · `61-90` · `91-120` · `Over 120 Days`).
  > "Access to this routine is available via the **Action button on the General tab of the Create a User file.**"
  > "**NOTE: To view quota performance, use the `View Collector Performance` routine.**"
- **Maps to:** batch 19 F603 (the legal subsystem) · batch 17 F575 · W-035.

> **Collections is a routed work-queue with five-bucket quotas** — a whole operational discipline the
> six-run queue never reached, and it is configured on the *user* record.
>
> **Five assignment dimensions can compose** (alphabet, age, amount, district, store) and **no
> precedence is stated** when a customer matches several collectors' criteria. §H. Given batch 16
> F552's finding that STORIS explicitly *advises against* combining location-restriction axes, the
> same caution probably applies here — but it is not written down.
>
> **A fourth menu-less routine** (cf. batch 18 F589, batch 19 F603): reachable only from an Actions
> button on `Create a User`.

### FINDING 635 — Changing a collector's criteria detaches them from every assigned record and re-runs assignment

- **Invariant:** a criteria edit cascades — remove, fall back to the default manager if empty, then reassign.
- **Evidence** — `Collector Settings`:
  > "**NOTE: If you change any assignment criteria for a collector, the system removes the collector from all collection table records to which he/she is currently assigned. If this removal results in no collectors being assigned to a table record, the system assigns the default collections manager. The system then re-assigns the collector based on the new settings. If only the default collector was previously assigned, the system removes the default collector and assigns the new collector.**"
  > "**You cannot delete a collector to whom customers are assigned.**"
- **Maps to:** batch 17 F577 (deletion policies) · batch 13 F494 (silent cascade) · W-034, W-035.

> **A four-step cascade documented in one sentence, with a sentinel fallback in the middle.** The
> default collections manager plays the same role as `ZZZZZ` and `Standard Files` — **a guaranteed
> assignee so no record is ever unowned.** Seventh instance of the reserved-fallback pattern.
>
> **It is a silent cascade** (batch 13 F494's category): no count, no confirmation, and a collector's
> entire book moves on a criteria edit. **For a rebuild, show the affected count first** — the same
> recommendation batch 14 F516 drew from the substitution-list example.
>
> **Deletion is referentially blocked**, consistent with the house catalogue.

### FINDING 636 — Collection letters must be registered before collectors can use them — and `ELP` becomes traceable

- **Invariant:** only letter templates given an ID here appear in the letter-printing routines.
- **Evidence** — `Collection Letter Settings`:
  > "Use this routine to assign ID's to collection letters **for which you created templates in `Design Enhanced Laser Forms`**, and define which letters are available to collectors. **Only letter forms that you assign an ID to using this screen are available for selection at the `Letter` field in `Assign and Print Collections Letters` and `Print Collections Letters`.**"
  Fields: `Collection Letter` · `Letter Description` · `Letter Template`.
- **Maps to:** batch 5 (`ELP` recorded as *"partly understood as a notification template system"*) ·
  batch 17 F559 (*"`ELP` form", "`Event Email ELP Selection`"*) · run 06 (printing) · W-064.

> **`Design Enhanced Laser Forms` is almost certainly what `ELP` abbreviates** — Enhanced Laser
> Print/Forms. The audit has carried `ELP` as an undefined term since run 05, upgraded in batch 17 to
> "a form selected per event type", and here is a routine whose name expands the initials.
>
> **This is recorded as a strong inference, not a finding** — no article writes "ELP stands for…", and
> the audit's rule is not to fill a gap with a plausible expansion. **I-103.** But it is actionable:
> if `ELP` = Enhanced Laser Forms, then **the notification templates of batch 17 and the collection
> letters here and the print forms of run 06 are all one templating system**, which would consolidate
> three separate models into one for the rebuild.
>
> **The two-step registration** (design the template, then register it to expose it) is the same shape
> as batch 17 F559's vendor-owned event list: **the system separates authoring from availability.**

---

## C. Screen and field inventory (additions)

Field lists are inline above.

`Finance Provider Settings` tab structure: **General · Online Transmit · Communications**, with
*"Support Files: Zip Code, Sales Tax, Bank Master, and Warehouse Location."*
Online Transmit header fields: `Transmit this Store Location` · `Transmission Method` ·
`Settlement Type` · `Maximum Contract Adjustment` · `Client Pay Code` ·
**`Account Number Retention Days`** · `Manual Authorization Message` · `Type & Description`.
Communications › SFTP SETTLEMENT: `Host Address` · `Firewall User ID` · `Firewall Password` ·
`User ID` · `User Password` · `Source Path` · `Settlement Filename` · `Confirmation File #1` ·
`Confirmation File #2` · `Host RSA Address`.

---

## D. Control settings catalog (additions)

| Setting | Record | Decides |
|---|---|---|
| `Calculation Method` | POS Control Settings | Which commission configuration is legal (F630, F631, F633) |
| `Alphabetical` | Collections Processing Control Settings | Enables alphabetic collector assignment (F634) |
| minimum days quantity | Collections Processing Control Settings | Enables age-based collector assignment (F634) |
| `Minimum Amount` | Collections Processing Control Settings | Enables amount-based collector assignment (F634) |

---

## E. Security permissions catalog (additions)

| Permission | Record | Effect |
|---|---|---|
| `Advanced Customer Settings; Create new customer` | Extended Security (Receivables) | Governs creation in **both** customer routines (F625) |

Four **menu-less routines** now catalogued, each governed only by `Assign Screen Action Permission`:
`Delivery Charge Table Settings` (batch 18 F589) · `Customer Legal Settings` (batch 19 F603) ·
`Metro 2 Code Settings` (F623) · `Collector Settings` (F634).

---

## F. State machines and enumerations (additions)

**Metro 2 code tables** — three closed CDIA-defined sets: Exhibit 4 (account status), Exhibit 6
(special comment), Exhibit 8 (compliance condition) (F622).

**Credit hold codes** — `F3` (provider declined) and `F4` (provider association) attributed (F627);
three of run 04's twenty-two now sourced, with `E1` from Sales Security.

**Commission calculation methods** — at least four: `Customer Matrix` · `Salesperson Matrix` ·
`Gross Profit` · default. Full list in POS Control Settings, uncaptured (F631).

**Finance transmission methods** — TCP/IP · SSL · Web Service (+ SFTP for settlement) (F629).

---

## G. Sequencing rules (additions)

**Two-category matrix join — second instance**: commission (F630); cf. customer pricing
(batch 19 F608). One idiom, two domains.

**Reserved fallback assignee — seventh instance**: the default collections manager (F635);
cf. `ZZZZZ`, `STD`, `RFND`, `Standard Files`, purchase status types, Metro 2 exhibits.

**Blank defers — holding**: finance web-service credentials fall back to merchant settings (F629).

**Cross-record validation by required emptiness** — new shape (F631).

---

## H. Open questions and gaps

1. **Is banded commission recalculated when provisional cost is restated?** (F633 + run 03 F144).
   **The batch's top question — it affects people's pay**, and it is the pay-side twin of batch 19's
   cost-plus pricing question.
2. **Two records configure RTO sales tax removal** — the finance provider (F627) and the tax
   jurisdiction (batch 19 F616). Precedence unstated.
3. **Collector assignment precedence** across five composable dimensions (F634).
4. **`Payment Rating`** (F623) — a Metro 2 field with no backing settings table and no description.
5. **The full `Calculation Method` enumeration** (F631) — lives in POS Control Settings; batch 1's
   sweep did not capture values.
6. **Field labels differ between `Customer Settings` and `Advanced Customer Settings`** for the same
   fields (F625). A label-based mapping will duplicate.
7. **`Customer Daily Cash Limit` and `Payment Class Access`** (F627) — named, undescribed.

**Inferences**

- **I-102** — commission is denormalised onto order items (F632) and therefore probably **not**
  recalculated when cost restates. Two independent statements point this way; **neither says it.**
- **I-103** — **`ELP` = Enhanced Laser Print/Forms**, from `Design Enhanced Laser Forms` (F636). If
  correct, notification templates, collection letters and print forms are one system. **Not adopted
  as fact.**

---

## I. Unknown unknowns

- **`Design Enhanced Laser Forms`** (F636) — a forms designer the audit has never read, apparently
  underlying notifications, collection letters and printing.
- **`Finance Merchant Settings`** (F629) — a merchant-level credential record above the provider
  level. Unread.
- **`Collections Processing Control Settings`** (F634) — gates three assignment modes. Unread.
- **`View Collector Performance`** and quota tracking (F634) — a performance-management surface.
- **Credit protection / credit insurance** (F627 `CREDIT PROTECTION - Prompt for Credit Protection`;
  batch 19 `Insurance After Eligibility Age`) — a product line with two sightings and no article read.

---

## J. Glossary (additions)

| Term | Plain description |
|---|---|
| **Metro 2 exhibits 4 / 6 / 8** | CDIA-standard code sets for account status, special comment, compliance condition |
| **`Payment Rating`** | A Metro 2 field distinct from account status and payment history |
| **Transmitting provider** | A finance provider STORIS can electronically reach; vendor-defined, closed set |
| **Commission matrix code** | Two concatenated single-character categories; 1,296 maximum |
| **Tiered Gross Profit Table** | Commission rate bands keyed on line gross-margin percent |
| **Default collections manager** | The reserved fallback assignee for unowned collection records |
| **`Design Enhanced Laser Forms`** | The forms/template designer behind letters and print output |

---

## Contract adjudication — batch 20

| Contract | Verdict | Basis |
|---|---|---|
| **W-064** *(credit reporting / compliance)* | **CONFIRMED — externally standardised** | CDIA exhibits, closed code sets, per-contract tradelines (F622–F624) |
| **W-035** *(receivables / collections)* | **CONFIRMED — collections is a routed queue** | F634, F635 |
| **W-036** *(customer master)* | **CONFIRMED** | Three views of one record; label drift (F625) |
| **W-046** *(commission)* | **CONFIRMED — and exposed to the margin chain** | Matrix join (F630), method gating (F631), margin bands (F633) |
| **W-051 / W-058** *(licensing / interfaces)* | **CONFIRMED** | Transmitting providers are vendor-closed (F626); locked field block (F628) |
| **W-034** *(deletion)* | **CONFIRMED** | Collector deletion blocked; criteria change silently cascades (F635) |
| **W-039** *(tax)* | **CONTRADICTED in part** | RTO tax removal configurable in two records with no stated precedence (F627) |
| **Cross-record validation by required emptiness** | **NEW** | F631 |
| **Settings change that rewrites transaction data** | **NEW** | F632 |

---

## Next — batch 21

Customer Settings payments block: `Credit Card Payment Settings` · `Debit Card Payment Settings` ·
`Cash/Check Payment Settings` · `Bank Settings` · `Credit Application Settings` ·
`Credit Bureau Settings` · `Finance Level/MMP Table` · `Contract Classification Settings`.
