# Run 07 — System Administration — Batch 19: Customer Legal, Pricing Matrices and Tax

Status: complete. Findings 603–621. Read-only throughout.

**The legal/collections subsystem that batch 17 F575 exposed is now read** — it is a credit-reporting
engine built to the **Metro 2** industry format. Alongside it: the **customer price matrix**, fully
enumerated, and `Sales Tax Settings`, which turns out to be four modules wearing one name. One finding
here (**F620**) inverts the audit's most reliable idiom.

---

## A. Coverage log

| # | Article | id | Section | Status |
|---|---|---|---|---|
| 1 | **Customer Legal Settings** | 15242609770004 | Customer Settings | read |
| 2 | **Legal Code Settings** | 15186501982868 | System Control Settings | read |
| 3 | **Credit Reporting Overview** | 15202311963796 | Overviews › Setup | read (followed link) |
| 4 | **Customer Price Settings** | 15242611603220 | Customer Settings | read |
| 5 | **Price Matrix Usage Codes** | 15242610698004 | Customer Settings | read — **the enumeration** |
| 6 | **Sales Tax Settings** | 15297959789972 | Customer Settings | read — `11.0`/`10.8`, four tabs |
| 7 | **Individual Zip Codes** | 15185860708884 | User Settings | read |
| 8 | **Update Zip Code Settings** | 15243032962836 | Vendor Settings | read |
| 9 | **Customer Legal Settings - Read Only** | 15242406190740 | Customer Settings | noted, not read (twin) |

---

## B. Wiring findings

### FINDING 603 — Legal status is a set of flags on the customer, each of which can fire actions

- **Invariant:** checking a legal status consults a code table to decide what else happens to the account.
- **Evidence** — `Customer Legal Settings`:
  > Access: *"Advanced Customer Settings > Receivables page > Actions button > select Legal Settings"*
  > "Use this routine to indicate the **legal status of the customer's account**… **You check the box next to each status that applies to this customer.**"
  > "**Depending on your `Legal Code Settings`, additional actions may occur when you check one of these legal settings. These actions include closing the customer account, holding the customer's receivables statements, and/or excluding the customer from mailing lists and emails.**"
- **Maps to:** **batch 17 F575** (*"the account has legal settings assigned that do not allow payments to
  be added"* — flagged as an unread subsystem) — **now read** · F589 (menu-less routines) · W-035, W-036.

> **Batch 17 met this subsystem as a single blocking condition on membership renewal and recorded it
> as an unknown unknown. It is a full collections module.**
>
> **Multi-select, not single-status:** a customer can carry several legal statuses at once, each
> independently firing actions. So the effective account state is the **union** of the actions of all
> checked codes — which is why F605's conflict handling exists.
>
> **Another menu-less routine** (cf. F589): reachable only via an Actions button three levels into
> Advanced Customer Settings. Deny that Actions item via `Assign Screen Action Permission` and the
> entire legal subsystem becomes unreachable.

### FINDING 604 — A legal code carries up to seven actions, and a code with none is documentation

- **Invariant:** each legal code independently switches seven account behaviours; unticked, it is informational.
- **Evidence** — `Legal Code Settings`:
  > "Use this routine to maintain the **legal codes pre-built by STORIS** and to create new codes. You can also specify the actions, if any, you want to occur when a legal status is selected for a customer…"
  > "**If you do not check any of the action boxes (close account, etc.) for a particular status, that status is used for informational purposes only.**"
  > "For each legal status, you can indicate **any or all** of the following actions: **`Allow Payments` · `Inactivate Customer Account` · `Do Not Report` · `Allow Repossession` · `Do Not Solicit` · `Hold Statements` · `Activate`**"
- **Maps to:** F603, F606 · batch 17 F575 · run 01 (receivables) · W-035.

> **Seven actions, and they are not all of the same kind.** `Allow Payments` and `Allow Repossession`
> are *capability* grants; `Inactivate Customer Account` and `Hold Statements` are *state* changes;
> `Do Not Report` and `Do Not Solicit` are *suppression* flags reaching credit reporting and
> marketing respectively. **One code table drives four different subsystems.**
>
> **`Allow Payments` as an explicit action is the mechanism behind batch 17 F575's renewal block** —
> membership auto-renewal fails because a legal code did not grant it. Chain closed.
>
> **`Allow Repossession` is the audit's first sighting of repossession as a modelled process**, and it
> pairs with the Sales Security permission `Increase Sell price above Max Sell price for
> Repossessions` from the earlier handoff. **A repossession subsystem exists and no article the audit
> has read describes it.** §I.
>
> **Codes are vendor-pre-built and site-extensible** — the same ownership split as purchase statuses
> and reason codes.

### FINDING 605 — Metro 2 codes conflict-check on assignment, and existing customers are never re-coded

- **Invariant:** conflicting credit-bureau codes across multiple legal codes raise a warning; customers already coded are left alone.
- **Evidence** — `Customer Legal Settings`:
  > "**NOTE: Options set here may impact codes for `Report Metro 2 Customer Credit History`.**"
  > "**If there are values in the `Account Status`, `Special Comment` and/or `Compliance Condition` fields in Legal Code Settings, those Metro 2 codes are applied to the customer. If the Metro 2 codes conflict, or there are multiple Metro 2 codes assigned among different legal codes, a warning message displays alerting you to select the compatible legal code(s). Metro 2 codes for customers who already have a legal code assigned are not updated.**"
- **Maps to:** F603, F606 · batch 16 F547 (seeded copy, no propagation) · W-035, W-064.

> **The last sentence is the important one and it is easy to read past.** Changing a legal code's
> Metro 2 mapping **does not re-code customers who already carry that legal code**. It is the
> **eighth instance of resolve-once-and-store**, and this time the stored value is what gets reported
> to a credit bureau.
>
> **That is a compliance exposure, not just an inconsistency.** A site that corrects a wrong Metro 2
> mapping fixes it for future assignments only; every customer already reported under the wrong code
> stays wrong until someone finds them. `Repair Metro 2 Customer Credit History` exists (F606) —
> presumably for exactly this — but nothing links the two.
>
> **Conflict detection is detect-and-report** (run 04 F290): a warning, then it is the user's job to
> pick compatible codes. The system does not resolve or block.

### FINDING 606 — Credit reporting is Metro 2, scoped to installment and revolving, with layered exclusions

- **Invariant:** three delivered code tables feed a Metro 2 export; several rules exclude accounts from reporting.
- **Evidence** — `Credit Reporting Overview`:
  > "STORIS' Credit Reporting feature adheres to the **Metro 2 Credit Reporting Format**. **NOTE: STORIS uses Metro 2 reporting for installment and revolving plans only.**"
  > "The following file maintenance routines **come delivered with the codes used by Metro 2**: **`Account Status Settings` · `Compliance Condition Settings` · `Special Comment Settings`**"
  > "To associate a customer with codes…use the **`Metro 2 Code Settings`** available via the Action button on the Receivables page of Advanced Customer Settings."
  > "…**`Report Metro 2 Customer Credit History`** — generate… **`Download Metro 2 Customer Credit History`** — export… **`Repair Metro 2 Customer Credit History`** — edit the credit reporting data fields for which errors are most commonly reported."
  > "**NOTE: The following criteria exclude customers from USA Metro 2 for Revolving Reporting: Customers flagged as a business, if a Customer is assigned a legal code that is set to 'Do Not Report', and if a Customer has a charge-off date that is earlier than the start of the Metro 2 reporting period.**"
  > "Based upon exclusions set on the **Credit Reporting tab of Accounts Receivables Control Settings**, revolving accounts are excluded if any of the following settings have values: **`0.00 for 2 Months and Account Age is less than NN Months` · `$ 0.00 for NN Months` · `A Credit for NN Months` · `Closed Dates`**"
- **Maps to:** F603–F605 · run 01 (receivables) · batch 17 F578 (payment history codes) · W-035, W-064.

> **This is a regulated external reporting obligation living inside the ERP**, and it is the most
> compliance-sensitive area the audit has touched. Metro 2 is the US consumer-credit reporting
> standard; what STORIS sends here **appears on customers' credit files**.
>
> **Three delivered code tables plus a per-customer mapping screen plus three routines** — generate,
> download, repair. The existence of a dedicated **repair** routine *"for the fields for which errors
> are most commonly reported"* is itself a finding: **the vendor expects this data to be wrong often
> enough to ship a fixer.**
>
> **Exclusions come from two places** — hard rules (business customers, `Do Not Report`, old
> charge-offs) and configurable thresholds on Accounts Receivables Control Settings. A rebuild must
> implement both layers or it will report accounts the business deliberately suppresses.
>
> **Batch 17 F578's payment history codes are the *content* of this report**; this is the transport.
> The two batches now join up — **and F579's contradiction about code `0` matters more than it did**,
> because the ambiguous value is being reported to a credit bureau.

### FINDING 607 — Closing an account backfills the customer's inactive date

- **Invariant:** a close date written by credit reporting propagates into the inactive date when none exists.
- **Evidence** — `Credit Reporting Overview`:
  > "You can apply a **closed date** to customers via either of the following routines: **`Account Status Settings`** · **`Special Comment Settings`**"
  > "**For customers with no inactive date, if you close the customer's account, the customer's inactive date updates with the closed date.**"
  > "You can view the customer's closed date (if any) via the **`Metro 2 Code Settings`**."
- **Maps to:** batch 18 §C (`Inactive Date` on Advanced Customer Settings › Advanced) · F604
  (`Inactivate Customer Account`) · W-036.

> **A credit-reporting action writes a customer-master field** — one of the few places in the audit
> where a downstream reporting concern reaches back and mutates the master record.
>
> **Conditional propagation:** only *"for customers with no inactive date"*. An existing inactive date
> is preserved. That is a **fill-if-empty** rule, not an overwrite — a ninth variant of the copy
> idiom, and one a rebuild will get wrong by defaulting to overwrite.

### FINDING 608 — The price matrix is keyed on a customer category × product category pair

- **Invariant:** order entry joins the customer's price category to each product's price code and applies the matching matrix record.
- **Evidence** — `Customer Price Settings`:
  > "Use this file to create **price matrices based on selected customer/product combinations**. **Sales Order Entry references this file when calculating the default selling price** of merchandise on an order."
  > "…order-entry programs **identify the customer and then reference the code in the `Price Category` field from the Customer Settings**, **identify each product on the order and reference the code in the `Price Code` field in the Advanced Product Settings** for each."
  > "**If a Customer Price Settings record exists that includes both of these codes…the system applies the price matrix from that record** when calculating the default selling price for the order."
  > "**NOTE: Prices obtained from the pricing hierarchy can affect (and sometimes override) prices generated from the Customer Price Settings.**"
  > "**The price matrix is not designed to work with configured products. The Configurator has its own pricing overrides.** However, if you set a configured product to use the product master price as its main price instead of the graded price, then the starting price (prior to any add-ons) would be priced using the price matrix settings."
  Fields: `Customer Price Category` · `Product Price Category` · `Factor` ·
  `Price Matrix Usage Code` · `Use Lowest Price`.
- **Maps to:** batch 18 §C (`Price Category Code` on the customer) · batch 11 (Advanced Product
  Settings) · run 02 (pricing hierarchy) · W-045.

> **This is B2B/contract pricing, and it is a *second* pricing system running beside the hierarchy**,
> not a rung within it. The audit has spent three runs on the pricing hierarchy; this is orthogonal
> to it — a sparse matrix over two category dimensions.
>
> **The NOTE is doing real work and is under-specified:** *"can affect (and sometimes override)"* the
> matrix result. **"Sometimes" is not a rule.** F611 gives part of the answer; the rest is not stated.
> §H.
>
> **A third pricing system is named here** — the Configurator, with *"its own pricing overrides"* and a
> `graded price` concept the audit has not met. §I.

### FINDING 609 — Eight price matrix formulas, four of them cost-based

- **Invariant:** the usage code selects one of eight formulas applying `Factor` to price or cost.
- **Evidence** — `Price Matrix Usage Codes`, verbatim:

| Usage code | Factor is | Formula base |
|---|---|---|
| `Price * Factor` | percentage | Selling Price, Advanced Product Settings |
| `Price - Factor` | dollar | Selling Price |
| `Price + Factor` | dollar | Selling Price |
| `Price = Factor` | dollar | **substitutes** the Selling Price |
| `Sales Written Cost * Factor` | percentage | **average cost** |
| `Sales Written Cost + Factor` | dollar | average cost |
| `Replacement Cost * Factor` | percentage | **replacement cost** |
| `Replacement Cost + Factor` | dollar | replacement cost |

  > "**NOTE: Since special-order products have no replacement cost, do not use the replacement cost options with special-order products.**"
- **Maps to:** run 03 F144 (orders written at **average** cost, later restated) · batch 1 (Costing
  Control Settings) · W-045, W-061.

> **Cost-plus pricing is a first-class option, and it inherits the audit's most consequential
> chain.** `Sales Written Cost` is the **average cost** that run 03 F144 established is *provisional* —
> restated when the exact cost arrives via a received PO or a resolved cost exception.
>
> **So a cost-plus contract price is computed from a number that later changes.** The docs do not say
> whether the order's price is restated when the cost is. **This is a material question for any
> customer on cost-plus terms** and it sits at the intersection of the two most important chains in
> the audit. §H — flagged as the batch's top question.
>
> **The special-order warning is detect-and-report by documentation only** — nothing prevents the
> configuration, the docs just tell you not to.

### FINDING 610 — `Use Lowest Price` inactivates itself for formulas where it cannot apply

- **Invariant:** cost-based and price-increasing usage codes disable the lowest-price comparison.
- **Evidence** — `Price Matrix Usage Codes`:
  > "**The following usage codes cause the `Use Lowest Price` field in the Customer Price Settings to inactivate: - usage codes based on cost (for example, `Replacement Cost * Factor`) - usage codes that cause a price increase, including `Price + Factor` and `Price * Factor` (provided the factor is greater than 100)**"
  `Customer Price Settings`:
  > "…the program references the `Use Lower Price` field… If the field is **disabled**, the program uses the price in the `Selling Price` field in the Advanced Product Settings… **enabled**, the program **compares the price obtained from the pricing hierarchy with the `Selling Price` field…and uses the lesser of the two.**"
- **Maps to:** F608, F609 · run 02 (pricing hierarchy) · W-045.

> **A field whose availability is computed from another field's value, including from a *runtime*
> comparison** — `Price * Factor` inactivates it only *"provided the factor is greater than 100"*. So
> the UI state depends on the numeric content of a sibling field, not just its identity.
>
> **The two field names disagree in the same documentation set** — `Use Lowest Price` in the usage-code
> article, `Use Lower Price` in the settings article. **One field, two spellings.** Recorded; a
> rebuild mapping by label needs to know.

### FINDING 611 — A matrix price that comes out higher is applied; one that comes out lower competes

- **Invariant:** the matrix never lowers below the best existing price and never loses to a lower default.
- **Evidence** — `Customer Price Settings`:
  > "**NOTE: If the price returned by a price matrix calculation exceeds the default selling price, the system applies the higher price. If the price returned is lower than the default selling price, the system compares the price with the previous lowest price (for example, a promotional or markdown price) and applies the lowest price found.**"
- **Maps to:** F608 · batch 14 F514 (promotional pricing takes priority) · run 02 (markdown) · W-045.

> **This is asymmetric and deliberate: the matrix can raise a price unconditionally, but can only
> lower it by winning a competition against promotions and markdowns.**
>
> **It answers half of F608's "sometimes overrides"**: the pricing hierarchy overrides the matrix
> *when the hierarchy's price is lower*. It does not say what happens when the customer has a
> contract price that should beat a promotion — which is the normal B2B expectation and the opposite
> of what this rule delivers. **A trade customer on a negotiated matrix gets the promotional price
> instead if the promotion is deeper — and never gets a contract price better than the best public
> price.** Worth confirming that is intended before reproducing it.

### FINDING 612 — Tax jurisdictions stack as separate codes, joined by the zip code record

- **Invariant:** state, county and municipal rates are independent tax codes; the zip record names the extras.
- **Evidence** — `Sales Tax Settings`:
  > "Use this routine to maintain tax information **by tax jurisdiction**. The system uses this routine **with the Zip Code file** to determine the sales tax percentage for all taxable sales transactions."
  > "You must create sales tax codes for **all states and/or provinces in which you do business and in which your vendors reside.**"
  > "…you **MUST use the standard two-digit post office state code** for all states and/or provinces, for example: NY = New York · CA = California · **ON = Ontario**"
  > "**NOTE: When setting up tax jurisdictions, county and municipal rates are additional tax percentages charged within a tax jurisdiction. For example, if New York State's tax rate is 6% and New York City charges an additional 3%, you must create a tax code for each using different tax jurisdiction codes. Use the `Additional Tax Code` fields in the Zip Code record to indicate additional taxes** for the state/province associated with the zip code."
  General tab: `Description` · `Tax Rate` · `GL Account` · `Type` · `Charge By` ·
  `Delivery Taxable` · `Installation Taxable` · `Vendor Rebate Taxable` · `Validate Tax Rate` ·
  `Tax Out Of State Sales` · `Selling Store Tax Exception` · `Create Adjustments for Charge-offs` ·
  **`Gross Taxable Price Cap`** · **`State Rate Cap`** · `Tax Override Class`.
- **Maps to:** F619 (zip codes) · run 01 (tax) · batch 18 F598 (Avalara) · W-039.

> **Tax is additive across independently-defined codes, assembled per zip code.** The rate a customer
> pays is a **sum**, not a lookup — and the summands are chosen by their ship-to zip.
>
> **`Gross Taxable Price Cap` and `State Rate Cap` are threshold rules** the audit has not met
> elsewhere: some jurisdictions cap the taxable amount or the state portion. Neither is described
> beyond its name. §H.
>
> **"and in which your vendors reside"** is easy to miss and matters: tax codes are needed for vendor
> states too, so the tax file is not purely customer-facing — it serves use tax / payables as well.

### FINDING 613 — A new tax rate does not reach existing orders, and the validator will not add it

- **Invariant:** rate changes require manual per-order remediation; `Validate Tax Rate` only checks what is already there.
- **Evidence** — `Sales Tax Settings`:
  > "**If you add a new tax rate, the system does not automatically add the tax to existing sales orders. You must access the orders and update the tax manually - either by: deleting and re-entering the line item, or accessing the `Order Tax Information` and adding the tax against the entire order.**"
  > "**Note also that the `Validate Tax Rate` field below does not add new tax records to existing orders - it only validates existing tax records.**"
- **Maps to:** **batch 18 F597** (customer tax exemption changes do not propagate) — **same hole from
  the other side** · W-039.

> **Two independent tax-propagation holes now documented, one on the customer side and one on the
> jurisdiction side.** Both push remediation onto the user; neither offers a list of affected orders.
>
> **The `Validate Tax Rate` clarification is the sharper half**: a field that sounds like it would fix
> this explicitly does not. It validates rows that exist and cannot create missing ones. **That is the
> kind of near-miss that produces a confident wrong assumption in a rebuild**, and STORIS pre-empts it
> in writing.
>
> **For the cutover:** open orders at cutover may carry tax computed under superseded rates. Migrating
> them faithfully migrates the discrepancy.

### FINDING 614 — Tax has three calculation steps, each independently replaceable by STORIS-written code

- **Invariant:** jurisdiction determination, taxable-merchandise calculation and tax calculation can each be swapped for a custom routine.
- **Evidence** — `Sales Tax Settings`:
  > "**The Sales Tax file provides for alternate calculation rules to be used if STORIS' standard rules do not apply. These alternate rules are programmed by STORIS.**"
  > "**The processes can exist for any combination of the three steps in the sales tax calculation process (`Local Tax Jurisdiction` determination, `Taxable Merchandise` calculation, and `Sales Tax` calculation). A drop-down box displays the available calculation codes for each of the three steps.**"
  > "**The alternate calculation processes are identified by specific calculation codes that were assigned by STORIS and contain user-defined settings. Contact your STORIS representative** for further detail…"
  Fields: `Local Jurisdiction` · `Taxable Merchandise` · `Sales Tax` · `Miscellaneous Fee/Charge`.
- **Maps to:** batch 15 F531 (STORIS-maintained fields) · batch 18 F598 (Avalara) · W-039.

> **This is vendor-written custom code selected by a dropdown, per tax code.** It is the clearest
> example in the audit of **STORIS shipping per-customer bespoke logic as configuration** — and it is
> a serious parity risk, because the behaviour is *not documented anywhere*.
>
> **If LA Mattress has any alternate calculation codes set, the rebuild cannot reproduce them from
> documentation.** The codes name routines only STORIS has. **This belongs on the live-system
> checklist**: read the three dropdowns on every tax code, and if any is non-standard, that logic must
> be obtained from STORIS or re-derived from observed behaviour. §H — high priority.
>
> It also confirms batch 16 F531's concern in a new place: **settings screens contain values whose
> meaning is vendor-owned.**

### FINDING 615 — Tax is not owed until the order completes, because deposits remain the customer's money

- **Invariant:** money held before completion sits in deposits liability; tax liability arises at completion.
- **Evidence** — `Sales Tax Settings`:
  > "**Until you complete a sale and your customer takes possession of the merchandise, all monies remain in deposits liability and still belong to the customer. Once you complete the order, you earn the monies and owe the taxes.**"
- **Maps to:** run 01 (deposits, GL) · run 03 (order completion) · batch 18 F597 · W-039, W-052.

> **A one-sentence statement of the revenue-recognition rule the whole order lifecycle is built
> around**, and the audit has not seen it stated this plainly anywhere in seven runs. It explains why
> completion is such a heavily-permissioned event in Sales Security (three separate `Complete …`
> permissions) and why deposits have their own liability account.
>
> **For the rebuild this is the anchor for the accounting model:** cash in ≠ revenue; completion is
> the recognition event; tax follows recognition, not payment.

### FINDING 616 — Two tax tabs are gated by both a licensed module and a field value

- **Invariant:** the Revolving and Installment tabs require their module active **and** `Type of Tax` = State/Province.
- **Evidence** — `Sales Tax Settings`:
  > "**The Revolving tab is accessible only if `Revolving Receivables` is active on your system and the `Type of Tax` field in this file is set to `State/Province`.**"
  > "**The Installment tab is accessible only if `Advanced Receivables` is active on your system and the `Type of Tax` field in this file is set to `State/Province`.**"
  Revolving fields include: `Late Fees` (`Calculated as a` · `Standard %` · `Minimum $` ·
  `Maximum $` · `Fixed $` · `Grace Days`) · Late Fee Rules (`Assessed` · `If MMP is Paid` ·
  `To Existing Finance Charges` · `To Unpaid Finance Charge Fees` · `On Insurance Premiums` ·
  `Existing Late Charges` · `Compound Late Fees`) · `Charge Interest` · `Maximum %` ·
  `Include Paid in Full in Average Daily Balance` · `New Transaction's First Cycle` ·
  **`Tiered Balance Calculation`** · `Statement Notification Settings` ·
  `Insurance After Eligibility Age` · Credit Write-Off (`Amount Threshold` · `Inactivity Days`).
  Installment: `LATE FEE - Compound Delinquent Late Charges` ·
  `NON-FILING FEE - Rebate if a Contract is Cancelled` · `Non-Filing Fee Table` · `Interest Table` ·
  `Minimum Finance Charge Table` · `Standard Late Charge` · `Standard Late Percent` ·
  `Minimum Late Charge` · `Maximum Late Fee` · `Late Fee Grace Days`.
  Financing tab: `Remove Tax on Orders with RTO Plans` ·
  `Allow Installation Charge on Orders with RTO Plans`.
- **Maps to:** batch 4 (licensing) · run 01 (receivables) · batch 15 F538 · W-039, W-051.

> **`Sales Tax Settings` is not a tax record. It is four records sharing a key** — a tax jurisdiction,
> a revolving-credit terms sheet, an installment terms sheet, and a third-party-financing rules
> block. The finance terms are stored **per state** because consumer credit law is state-regulated.
>
> **That is a genuinely important modelling insight for the rebuild**, and it is invisible from the
> screen name: **late fees, interest caps, grace days and non-filing fees are jurisdiction-scoped
> regulatory data**, not commercial preferences. Getting them wrong is a legal problem, not a pricing
> one.
>
> **A double gate — licence AND field value** — is new. Batch 15 F538 found licence-gating; this adds
> a data condition on top.

### FINDING 617 — A disputed balance suppresses all late fees on the plan

- **Invariant:** any portion in dispute stops late-fee assessment for the whole plan.
- **Evidence** — `Sales Tax Settings`, Revolving tab:
  > "**NOTE: If any portion of the customer's revolving plan balance has been placed in dispute, the system does not assess late fees (compound or otherwise) on any unpaid MMP's for that plan.**"
- **Maps to:** F616 · run 01 (receivables, disputes) · W-035.

> **A regulatory protection implemented as an all-or-nothing suppression**: dispute *any* portion and
> the *entire* plan stops accruing late fees, on *all* unpaid minimum monthly payments. That is
> broader than strictly required and deliberately so — it is the safe direction to err.
>
> **A rebuild must not "improve" this by pro-rating.** The blunt rule is the compliant one.

### FINDING 618 — Statutory fees and real-property exemption live on the tax record

- **Invariant:** recycling and retail delivery fees are per-jurisdiction, and real-property purchases can be exempted.
- **Evidence** — `Sales Tax Settings`, Non-Inventory Usage Settings:
  > "Use this section to indicate that **products purchased as real-property are tax exempt** and to specify a **state retail delivery fee or recycling fee** for the jurisdiction."
  > `Products Purchased as Real Property Are Tax Exempt` · **`State Recycling Fee`** · **`Retail Delivery Fee`**
- **Maps to:** F612 · run 01 · W-039.

> **Two statutory per-transaction fees that are not tax** but are collected like it — Colorado-style
> retail delivery fees and state recycling fees on mattresses, which is directly relevant to LA
> Mattress. **These are jurisdiction-scoped, change by legislation, and must appear correctly on
> customer documents.**
>
> The real-property exemption is a construction/installation-contract rule: goods that become part of
> a building are taxed differently. Its interaction with the customer-level exemption (batch 18 F597)
> is unstated.

### FINDING 619 — Route selection walks zip+4 → zip5 → show everything

- **Invariant:** a nine-digit zip's routes win; failing that the five-digit's; failing that, all routes are offered.
- **Evidence** — `Individual Zip Codes`:
  > "**If the 9-digit zip code has a default route/routes, assign the route or allow the user to select one** from the associated route code list… **If the 9-digit zip code does not have a default route code, review the default route codes assigned to the related 5-digit zip code** and assign or allow the user to select. **If neither the 9-digit nor the 5-digit zip code has a default route code, all route codes are displayed.**"
  General tab: `Zip or Postal Code` · `Country` · `City` · `State` · **`Normal Fulfillment Location`** ·
  `Parcel Ship Location` · `Delivery Route Code` · **`Delivery Stop Time`** · `Transfer Route Code` ·
  `Service Route Code` · `Parcel Route Code` · **`Additional Tax Code`** · `Delivery Stock Location` ·
  `Pickup Fulfillment Location` · `Pickup Stock Location`.
- **Maps to:** batch 18 F590 (delivery company defaults from the zip's route code) · batch 3
  (Logistical Route Settings) · F612 · run 04 (routing) · W-059.

> **The zip code record is a junction table for three subsystems at once** — tax (`Additional Tax
> Code`), fulfilment (`Normal Fulfillment Location`, stock and pickup locations) and routing (four
> route-code fields). **It is one of the highest-leverage records in the system and it is filed under
> User Settings**, which is why the audit met it late.
>
> **The terminal rung is "show everything", not a default** — so an unconfigured zip produces a
> chooser, not a wrong answer. Better than batch 18 F590's `ZZZZZ` fallback, and inconsistent with
> it: **route selection degrades to a prompt, delivery company degrades to a sentinel.**

### FINDING 620 — On the zip Regional Settings tab, **blank overrides** — inverting the house idiom

- **Invariant:** a regional record's empty field overrides the general tab's populated value.
- **Evidence** — `Individual Zip Codes` **and** `Update Zip Code Settings`, identical text in both:
  > "**Use this tab to enter regional information for ship location and route codes. Regional Processing does not have to be active to edit these fields. The values you enter on this tab override the values entered on the General tab for the same zip or postal code. If you enter a region on this tab and leave some fields blank, the blank field value overrides any value entered in the similar field on the General tab.**"
- **Maps to:** **the fall-through idiom — 17+ instances of *blank defers, zero forbids*** · batch 14
  F525 · batch 6 (Regional Processing) · W-014, W-059.

> **This is the single most surprising finding in the batch, and it inverts the audit's most reliable
> rule.** Across seven runs and 17+ hierarchies, blank has meant *defer to the next level*. Here a
> blank regional field means **"explicitly nothing"** and wins over a populated general value.
>
> **The consequence is concrete and severe:** create a regional zip record to override *one* route
> code, leave the other five blank, and **you have just cleared all six** for that region. Nothing
> warns you. The field looks unset because it is unset — and unset is the instruction.
>
> **For the rebuild this must be modelled as a tri-state** (`inherit` / `set` / `explicitly empty`),
> the same shape recommended for user-vs-group permissions in the Sales Security handoff. A
> two-state nullable column cannot represent it.
>
> **For the migration it is a data-reading hazard:** regional zip records in the extract will contain
> blanks that are *meaningful*, and any ETL that treats null as "no override" will silently restore
> values the business had deliberately cleared.
>
> Note also *"Regional Processing does not have to be active to edit these fields"* — stated twice.
> **A regional override that works with Regional Processing off**, unlike the region rungs in the
> lead-days and purchase-status hierarchies that disappear without it (batch 14 F505, batch 15 F522).

### FINDING 621 — Zip codes created on the fly are reported to a manager on the End-of-Day report

- **Invariant:** ad-hoc zip creation during order entry is surfaced for next-day review.
- **Evidence** — `Individual Zip Codes` **and** `Update Zip Code Settings`, identical:
  > "**NOTE: New zip codes that have been built on-the-fly list on the End-of-Day report. This allows review by the manager to ensure the normal ship location and tax codes are properly set.**"
  `Update Zip Code Settings` adds range maintenance: `Start Zip or Postal Code` ·
  `End Zip or Postal Code` + the same field set.
- **Maps to:** batch 15 F529, batch 14 F520 (End of Day's job list) · F619 · run 04 · W-041, W-064.

> **A sixth End-of-Day responsibility, and the only one that is purely an *exception report*.** EOD
> releases credit holds, drives notifications, reserves hard kits, raises POs, expires reward points —
> and tells a manager which zip codes were invented yesterday.
>
> **The reason it matters is F619:** a zip created on the fly has no tax code and no fulfilment
> location, so **every order to that zip is taxed and routed wrong until someone fixes it**. The EOD
> listing is the only control. **If nobody reads the End-of-Day report, this fails silently** — which
> connects to batch 17 F580 (`When an EOD/EOM Processing Error is Reported` is itself optional).

---

## C. Screen and field inventory (additions)

Field lists inline above. `Sales Tax Settings` tab structure: **General · Open Item · Revolving ·
Installment · Financing · Non-Inventory Usage Settings**.
*Open Item tab:* `Service Charge` · `Percent` · `GL Account` · `NSF Check Fee`.

---

## D. Control settings catalog (additions)

| Setting | Record | Decides |
|---|---|---|
| Credit Reporting exclusions (`0.00 for 2 Months…`, `$0.00 for NN Months`, `A Credit for NN Months`, `Closed Dates`) | **Accounts Receivables Control Settings › Credit Reporting** | Which revolving accounts are excluded from Metro 2 (F606) |
| `Type of Tax` = State/Province | Sales Tax Settings | Second gate on the Revolving and Installment tabs (F616) |

---

## E. Security permissions catalog (additions)

None named in these articles. Two routines are **menu-less** and therefore governed by
`Assign Screen Action Permission` (F603, and cf. batch 18 F589).

---

## F. State machines and enumerations (additions)

**Legal code actions** — seven: `Allow Payments` · `Inactivate Customer Account` · `Do Not Report` ·
`Allow Repossession` · `Do Not Solicit` · `Hold Statements` · `Activate` (F604).

**Price Matrix Usage Codes** — eight formulas (F609), four price-based and four cost-based.

**Metro 2 code tables** — `Account Status Settings` · `Compliance Condition Settings` ·
`Special Comment Settings` (F606).

**Route-code resolution** — zip+4 → zip5 → all routes displayed (F619).

**Delivery company resolution** — zip route → prompt → `ZZZZZ` (batch 18 F590). **Two different
terminal behaviours for two lookups keyed on the same record.**

---

## G. Sequencing rules (additions)

**⚠️ Blank means "explicitly empty" on zip Regional Settings** (F620) — the sole documented inversion
of the *blank defers* idiom. Everywhere else in the audit, blank defers.

**Resolve once, store the answer — eighth and ninth instances**: Metro 2 codes are not updated for
customers already coded (F605); the closed date fills the inactive date only if empty (F607).

**Additive across independent records**: tax jurisdictions sum (F612); cf. rewards sources
(batch 18 F586) and auto-fill days (batch 15 F524).

---

## H. Open questions and gaps

1. **Does a cost-plus matrix price restate when the cost does?** (F609). `Sales Written Cost` is the
   provisional average cost of run 03 F144. **The batch's top question** — it joins the audit's two
   most consequential chains and affects every cost-plus customer.
2. **Alternate tax calculation codes are STORIS-written and undocumented** (F614). If any are set at
   LA Mattress, the logic is unobtainable from documentation. **High-priority live-system check.**
3. **"Prices obtained from the pricing hierarchy can affect (and sometimes override)" the matrix**
   (F608). F611 answers the lower-price case; the rest is unstated.
4. **`Gross Taxable Price Cap` and `State Rate Cap`** (F612) — named, never described.
5. **Interaction of real-property exemption with customer-level exemption** (F618, batch 18 F597).
6. **`Use Lowest Price` vs `Use Lower Price`** (F610) — one field, two spellings across two articles.
7. **What `Repair Metro 2 Customer Credit History` actually repairs** (F606), and whether it is the
   remedy for F605's non-propagation.

**Corrections / connections to earlier runs**

8. **Batch 17 F575's legal-settings block is fully explained** (F603, F604) — `Allow Payments` is a
   legal-code action.
9. **Batch 17 F579's payment-history contradiction is more serious than recorded** (F606) — the
   ambiguous code is reported to a credit bureau.

**Inferences**

- **I-100** — `Charge By` on the tax record probably selects ship-to vs selling-store sourcing, given
  `Tax Out Of State Sales` and `Selling Store Tax Exception` sit beside it. **Not stated.**
- **I-101** — `Tiered Balance Calculation` on the Revolving tab suggests banded interest rates.
  **Not described.**

---

## I. Unknown unknowns

- **A repossession subsystem exists** (F604 `Allow Repossession`; Sales Security
  `Increase Sell price above Max Sell price for Repossessions`). Two sightings, no descriptive
  article read.
- **The Configurator is a third pricing system** with *"its own pricing overrides"* and a **`graded
  price`** concept (F608). Neither term appears elsewhere in the audit.
- **STORIS ships per-site custom code as tax calculation codes** (F614). If it does this for tax, it
  may do it elsewhere. Nothing marks such fields.
- **`Insurance After Eligibility Age`** and `On Insurance Premiums` (F616) imply **credit insurance
  products** on revolving plans — an entire product line the audit has not read.

---

## J. Glossary (additions)

| Term | Plain description |
|---|---|
| **Legal code** | A customer status flag that can fire up to seven account actions |
| **Metro 2** | The US consumer credit reporting format STORIS exports to |
| **Price matrix** | Contract pricing keyed on customer price category × product price category |
| **`Sales Written Cost`** | The average cost used as a price basis — provisional, per run 03 F144 |
| **Alternate calculation code** | STORIS-written custom logic for one of the three tax steps |
| **`ZZZZZ` vs "all routes"** | The two different terminal behaviours of zip-driven lookups |
| **Retail Delivery Fee / State Recycling Fee** | Statutory per-transaction fees held per jurisdiction |

---

## Contract adjudication — batch 19

| Contract | Verdict | Basis |
|---|---|---|
| **W-035** *(receivables / collections)* | **CONFIRMED — subsystem found** | Legal codes, Metro 2 reporting, dispute suppression (F603–F607, F617) |
| **W-036** *(customer master)* | **CONFIRMED** | Legal flags and closed-date backfill write the master (F603, F607) |
| **W-039** *(tax)* | **CONFIRMED — and larger than the contract assumed** | Four modules on one record (F616); two propagation holes (F613) |
| **W-045** *(pricing)* | **CONFIRMED — a second pricing system** | The matrix runs beside the hierarchy, not within it (F608–F611) |
| **W-051** *(licensing)* | **CONFIRMED — double gate** | Licence **and** field value (F616) |
| **W-059** *(routing)* | **CONFIRMED** | zip+4 → zip5 → all routes (F619) |
| **W-041** *(batch calendar)* | **CONFIRMED — sixth EOD job** | On-the-fly zip exception listing (F621) |
| **W-064** *(auditability / compliance)* | **CONFIRMED** | Metro 2 export, repair routine, exclusion layers (F606) |
| **W-014** *(fall-through semantics)* | **CONTRADICTED — one documented inversion** | Blank overrides on zip Regional Settings (F620) |
| **Jurisdiction-scoped credit terms** | **NEW — no contract covers it** | F616 |
| **Vendor-written logic as configuration** | **NEW** | F614 |

---

## Next — batch 20

Customer Settings continued: `Metro 2 Code Settings` · `Account Status Settings` ·
`Compliance Condition Settings` · `Special Comment Settings` · `Credit Review Status Code Settings` ·
`Credit Employment Status Settings` · `Alert Code Settings` follow-ups · `Customer Comment Settings`.
