# Customer Settings — Part B (positions 47–92 of 137)

*Section: STORIS > STORIS ERP > System Administration > Customer Settings (section id `15233769370388`, 137 articles).*
*Prefix: `CUST`. IDs `CUST-047` … `CUST-092`, numbered to match 1-indexed enumeration position.*

## Split audit — what positions 47–92 actually turned out to be

The section is enumerated in **alphabetical order by article title**. Part B's boundaries:

- Position **46** (last of part A) = *Enter Customer's Date of Birth*
- Position **47** (first of part B) = *Equivalent Pay Types Screen*  ← follows sensibly (En… → Eq…)
- Position **92** (last of part B) = *Minimum Finance Charge Table*
- Position **93** (first of part C) = *Miscellaneous Payment Settings*  ← follows sensibly (Mini… → Misc…)

**Continuity with part A is clean. No re-numbering was performed.**

**Caveat on section scope:** despite the section being named "Customer Settings", the alphabetical
run 47–92 is dominated by **General Ledger / GL master-file screens, financing and installment
configuration, and payment-type settings**. Only a minority of part B's articles are literally
customer-master fields. The customer-master field set, price category, contact/consent and tax
exemption screens the brief asks about mostly live **outside positions 47–92** (part A: "Customer …"
titles; part C: "Price …", "Sales Tax …", "Solicitation …" titles). Where part B articles touch
those themes (Hold Code Settings, Marketing Code Settings, Method of Contact Settings, Merchandise
of Interest Settings, Interest Rate Table, Minimum Finance Charge Table, Metro 2 Code Settings,
Insurance Code Jurisdiction Settings, List Zip Codes to Apply Tax Code) they are called out
explicitly and cross-referenced.

Positions in this part:

| # | Article id | Title |
|---|---|---|
| 47 | 15242390523284 | Equivalent Pay Types Screen |
| 48 | 15242630129940 | Establish Report Builder Security Codes |
| 49 | 15242630130708 | Establish Report Builder Security Groups |
| 50 | 15242611858580 | eSTORIS Product Search Filter |
| 51 | 15242630131092 | Extended Receivables Insurance Code Settings |
| 52 | 15242630130324 | Finance Application Queue Tier Settings |
| 53 | 15242406416020 | Finance Level/MMP Table |
| 54 | 15242630366228 | Finance Provider Settings |
| 55 | 15242390520468 | Finance Provider Settings by Finance Type |
| 56 | 15242610007444 | Financing Eligibility Restrictions |
| 57 | 15242630369428 | Financing Merchant Settings |
| 58 | 15242406417428 | Financing Payment Estimator Settings |
| 59 | 15242612075924 | Financing Payment Plan Settings |
| 60 | 15242630375316 | Fiscal Calendar Settings |
| 61 | 15242612074644 | Form Settings |
| 62 | 15242390520980 | General Ledger Accounts |
| 63 | 15242612074516 | General Ledger Assigned Account Settings |
| 64 | 15242630365716 | General Ledger Cost Center Settings |
| 65 | 15242406635028 | General Ledger Insurance |
| 66 | 15242612075668 | General Ledger User Permissions |
| 67 | 15242630880916 | Gift Certificate Payment Settings |
| 68 | 15242612079636 | Gift Registry Type Settings |
| 69 | 15242390750740 | GL Account Entry Screen |
| 70 | 15242630384532 | GL Account Settings |
| 71 | 15242630655124 | GL Class Settings |
| 72 | 15242612331156 | GL Group Settings |
| 73 | 15242630657300 | GL Source Settings |
| 74 | 15242594989076 | GL Sub-Account Entry Screen |
| 75 | 15242612330388 | GL Sub-Account Settings |
| 76 | 15242612335380 | GL Sub-Class Settings |
| 77 | 15242630657044 | Hold Code Settings |
| 78 | 15242630129172 | Installment Eligibility Restrictions |
| 79 | 15242612331412 | Installment Payment Plan Settings |
| 80 | 15242610252052 | Insurance Code Jurisdiction Settings |
| 81 | 15242610251284 | Interest Rate Table |
| 82 | 15242630660372 | Invoice Charge Settings |
| 83 | 15242630883476 | Invoice Charge Type Settings |
| 84 | 15242610251796 | List Zip Codes to Apply Tax Code Screen |
| 85 | 15242630881556 | Mandatory Order Comment Settings |
| 86 | 15242662912020 | Marketing Code Settings |
| 87 | 16917259015188 | Membership Reward Settings |
| 88 | 15242630656404 | Merchandise of Interest Settings |
| 89 | 15242630882324 | Method of Contact Settings |
| 90 | 15242594991892 | Metro 2 Code Settings |
| 91 | 15242390955284 | Minimum Deposit Percentage Table |
| 92 | 15242406895636 | Minimum Finance Charge Table |

---

### `CUST-047` Equivalent Pay Types Screen
*storis_ref: article 15242390523284*

**Purpose.** Lets one finance plan declare a set of *equivalent* pay types belonging to other finance providers, so that when an account number comes back from a different provider than the one originally quoted, the system can swap the plan on the order automatically.

**Where it lives.** The **Action** button on the **Equivalent Pay Types** field in **Financing Payment Plan Settings** (`CUST-059`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Pay Type | code, repeating (grid) | "Enter the code of one or more pay types, then click on Add to add them to the grid." Search button opens the **Pay Types Selection Screen** for one-at-a-time selection. |
| Grid Information | grid | The selected pay types. Select a row + **remove** to delete. **Save** returns to the previous screen. |

**Behavior & rules.**
- **Hard rule / surprising:** "If accounts are set up with one finance provider and authorizations are obtained from another, **the system automatically changes these finance plans in any associated sales order when the system receives an account number for a credit application.**" This is a silent, automatic mutation of the tender on a live sales order driven purely by which provider answered. There is no documented approval prompt and (see brief) **no general change-audit log** in STORIS to record it.
- The mapping is per-plan and one-directional: it is edited from within the plan being edited.

**Dependencies.** `CUST-059` Financing Payment Plan Settings (parent); Pay Type master (Pay Types Selection Screen); `CUST-054` Finance Provider Settings; credit-application/authorization flow. Should feed `RPT-AUDIT`.

**Build notes.** Model as `finance_plan.equivalent_pay_type_ids[]`. Implement the auto-swap but make it **explicit and logged**: emit an order event `TENDER_PLAN_SUBSTITUTED {from_plan, to_plan, provider, account_no_masked, actor:'system'}` and surface it on the order timeline. `[DECISION NEEDED]` — should substitution require a re-quote/re-signature when the substituted plan has different APR or term than the plan the customer was shown? STORIS does not ask.

---

### `CUST-048` Establish Report Builder Security Codes
*storis_ref: article 15242630129940*

**Purpose.** Creates **field-level** security codes used to blank out individual columns of data in Report Builder reports for restricted employees.

**Where it lives.** System Administration > System Settings > System Permissions > Establish Report Builder Security Codes.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Field Security Code | code | Enter code to add/edit. Existing codes appear in the grid. Add via **Add**; edit by double-click; remove by double-click then **Remove**. |
| Field Code Description | text, **max 25 alphanumeric characters** | Description of the current field security code. |
| Grid Information | grid | Existing codes; double-click a row to edit its description. |

**Behavior & rules.**
- **Hard rule — deny-by-default inversion:** applying a field security code to a field via **Maintain Report Dictionaries** "results in the … field being blocked for **all** employees in **all** Report Builder reports." Access is then granted employee-by-employee by checking that code in the **User file** (`Field Security Code` field). So one code application is a global blackout with per-user exceptions.
- Restricted output is **silent**: "the column header appears in the report but the column is empty." No error, no indication data was withheld — a reporting-integrity hazard.
- **A field security code is not bound to a field.** "A field security code is not associated with any particular field except for the time when it is being applied to one or more fields … If you remove a field security code from a field, you can immediately attach it to another." **Codes are free-floating labels — meaning the same code can silently change meaning, and the per-user grants attached to it change meaning with it.**
- Codes perform two jobs at once: (a) identify restricted fields in a source file, (b) identify (via the Staff file) the employees restricted from them.
- STORIS ships a delivered **Cost** field security code already applied to cost-bearing fields.

**Dependencies.** Maintain Report Dictionaries; User/Staff file `Field Security Code`; `CUST-049` Report Builder Security Groups (file-level counterpart); `parts/user-security-CATALOG.md`. Subject to the global **Extended Security** kill-switch established in wave 1.

**Build notes.** We want column-level masking in our report engine, but: (1) **never silently blank** — render `—` plus a "restricted" affordance and log the redaction; (2) bind the restriction to `(source_table, column)` explicitly rather than to a re-attachable label; (3) grant via role/scope in our live most-specific-scope-wins evaluator, not a copied-down user flag. Feed grants/revocations to `RPT-AUDIT`.

---

### `CUST-049` Establish Report Builder Security Groups
*storis_ref: article 15242630130708*

**Purpose.** Creates groups of **source files** (tables) that are restricted in Report Builder; employees are then granted access group-by-group.

**Where it lives.** System Administration > System Settings > System Permissions > Establish Report Builder Security Groups.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| File Security Group ID | code, **up to 10 alphanumeric characters** | The group being created/edited. Search opens the **File Security Group ID Lookup** window. Selecting a valid group displays its description and member files. |
| File Group Description | text | Description of the group. |
| File Name | dropdown (source files) | Pick a source file, then **Add** to put it in the group. |
| Description | display-only | "The description of the current source file appears. **You cannot edit this field.**" |
| Grid Information | grid | Member files. Remove: double-click so the name returns to **File Name**, then **Remove**. |
| Actions button | menu | Contains **Clone This Group to a New Name**. |

**Behavior & rules.**
- **Hard rule — file-level denial is a hard error, not a blank:** "If an employee attempts to access a Report Builder report containing a source file to which he has been restricted, an error message appears and the system denies access." (Contrast with `CUST-048`, which silently blanks.)
- **Hard rule — the delivered `Standard Files` (STD) group locks everyone out on day one:** "This group contains **all** the source files available to the Report Builder. Initially, the presence of this file causes **all users to be restricted from all Report Builder reports.**"
- Granting the **Standard Files** group to an employee gives "unlimited access to all Report Builder reports" — an all-or-nothing escape hatch that is the path of least resistance for an admin, and therefore the likely real-world state.
- **Hard rule — at least one box must be checked to use Report Builder at all:** "to run a Report Builder report, a check must appear in **at least one** box at the File Security Groups window … Otherwise, the system restricts the employee from accessing the **Run a Report** routine."
- **You cannot edit the `Standard Files` group.** STORIS advises cloning it via **Clone This Group to a New Name** when first setting up Report Builder security.
- Grants live on the **Security tab of the employee's Staff file**, field **File Security Groups**; a check *overrides* the group's restriction.

**Dependencies.** Staff/User file Security tab (`File Security Groups`); `CUST-048`; Report Builder / Run a Report; `parts/user-security-CATALOG.md`; global **Extended Security** kill-switch.

**Build notes.** Replace with table-level grants evaluated live against role + scope. Keep the *deny is an explicit error* behavior. Do **not** ship an "everything" group — it collapses to all-access in practice. `[DECISION NEEDED]` — do we want ad-hoc report building against raw tables at all, or only against curated, already-permissioned views? A curated-view model removes this entire class of setting.

---

### `CUST-050` eSTORIS Product Search Filter
*storis_ref: article 15242611858580*

**Purpose.** Defines the faceted-navigation hierarchy web customers use to narrow product search results on the eSTORIS storefront.

**Where it lives.** Conceptual/overview article. The maintenance screens named are **Web Category Filter Settings**, **Web Category Settings**, and **Advanced Product Settings**; filters and filter values can also be maintained from the **Administration page on eSTORIS** itself.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Web Master | level 1 | "The broadest level of product organization. Web masters consist of web categories." e.g. Chair. |
| Web Category | level 2 | Consist of products. e.g. Desk Chair. Products are assigned here. |
| Web Category Filter | level 3 | Subsets of web categories; consist of filter values. e.g. Size, Style. |
| Web Category Filter Value | level 4 | "The finest level of product organization." e.g. Large / Medium / Small; King / Queen / Double. |

**Behavior & rules.**
- Documented setup order (**order matters — two steps are called out as mandatory activation steps**): 1) create web masters → 2) create web categories and assign to masters → 3) create web category filters → 4) create filter values → 5) **assign filter values to filters** in Web Category Filter Settings ("**You must perform this step before you can assign your filter values to products**") → 6) assign products to web categories (Web Category Settings *or* Advanced Product Settings) → 7) assign filters to categories (Web Category Settings) → 8) **assign filter values to the products in each web category** ("**You must perform this step to activate your filters and filter values on eSTORIS**").
- UI behavior: filter values render on the left beneath the selected web category, grouped by their filter; customers may add/remove filters individually or all at once; **each add/remove reloads the page**.
- **Hard rule — filters do not work for web collections:** "NOTE: The eSTORIS Product Search Filter is **not available for web collections** at this time."
- **Hard rule — the storefront's facet data is stale by up to a day:** "**Once a day**, updated filter information per web category transfers from STORIS to the web site so that all the filter data can exist there." A filter change is not live.

**Dependencies.** Web Category Settings; Web Category Filter Settings; Advanced Product Settings; eSTORIS Administration page; product master (Inventory pack).

**Build notes.** This is a merchandising/facet taxonomy, not a customer setting — it is in this section only by alphabetical accident. Implement facets as attributes on the product record with a `facet_group` and let the storefront derive them **live** (no daily transfer). Support collections. `[DECISION NEEDED]` — do we model facets as a rigid 4-level tree (master → category → filter → value) or as free-form typed attributes with per-category display rules? The rigid tree is why STORIS needs the two redundant "you must also assign it here" steps.

---

### `CUST-051` Extended Receivables Insurance Code Settings
*storis_ref: article 15242630131092*

**Purpose.** Establishes and maintains the insurance codes applied to a customer's **revolving or installment** plan in advanced (extended) receivables — credit life / disability / property style add-ons priced per $100 financed.

**Where it lives.** *(The article's **Access** heading is present but empty — no menu path is given in the source.)* Reached in the advanced-receivables settings area. Delete via the **Delete** icon in the toolbar.

**Fields**

*Source note: this article lists field names only — the per-field description accordions are empty in the published article, and the entire body is duplicated verbatim on the page. Field semantics below are inferred from the field name and are marked as such.*

| Field | Type | Purpose / business rule |
|---|---|---|
| Insurance Code | code (key) | The code being maintained. |
| Description | text | Label. |
| Classification | code/enum *(values not published)* | Grouping of the insurance product. |
| Type | enum *(values not published)* | Insurance type. |
| Prerequisite Insurance | code ref | Another insurance code that must already be present — **a dependency chain between insurance products**. |
| Eligibility Cutoff Age is Years | numeric (years) | Age above which the customer is not eligible; ties to **Insurance After Eligibility Age** in Sales Tax Settings. |
| Maximum Threshold | container | Caps, expressed via the next two fields. |
| Financed Amount | currency | Max financed amount eligible for this insurance. |
| Monthly Payment | currency | Max monthly payment eligible for this insurance. |
| Insurance Fee Calculation | enum *(values not published)* | How the premium is derived. |
| Per $100 | rate | **Premium expressed as a rate per $100 of the financed amount** — the classic credit-insurance pricing basis. |
| Jurisdiction Settings | sub-screen | Per-jurisdiction overrides — see `CUST-080` Insurance Code Jurisdiction Settings. |
| Rebate Method | enum *(values not published)* | How unearned premium is refunded on early payoff (Rule of 78s / pro-rata style). |
| Minimum Rebate | currency | Floor below which no rebate is issued. |
| General Ledger Accounts | GL refs | Posting accounts — see `CUST-062`/`CUST-070`. |
| Request Signature | flag | Whether a signature capture is required to add the insurance. |

**Behavior & rules.**
- **Hard rule — referential lock on delete:** "**An insurance code cannot be deleted if it is set as the default value in `Insurance After Eligibility Age` in Sales Tax Settings.**"
- **Hard rule — jurisdiction is driven off the customer's bill-to state:** "When the **State Regulations Based Upon** setting in **Revolving Receivables Control Settings** is specified, the jurisdictions dropdown will populate with those that are set up in **Sales Tax Settings** as **"State/Province"**. This allows revolving insurance postings to use **the customer's bill-to state** if set as such." So a change to the customer's billing address can change which insurance regulation regime applies to an existing plan.
- `Rebate Method` + `Minimum Rebate` govern refunds on early payoff — **regulated in most states; the exact formula is not published in this article.**

**Dependencies.** Sales Tax Settings (`Insurance After Eligibility Age`, `State/Province` jurisdiction rows); Revolving Receivables Control Settings (`State Regulations Based Upon`); `CUST-080` Insurance Code Jurisdiction Settings; `CUST-065` General Ledger Insurance; customer bill-to address (customer master).

**Build notes.** Credit insurance is heavily state-regulated (rate caps, age caps, rebate method, disclosure). Model as `insurance_product` with a **versioned, jurisdiction-scoped rate table** and an explicit `rebate_method` enum with the actual amortization formula stored, not implied. **We must capture the rebate formula verbatim from the provider contract — it is not in the STORIS docs.** Signature capture must be stored as an artifact (image + timestamp + device + user), not a boolean.
`[DECISION NEEDED]` — is LA Mattress selling credit insurance at all? If not, this whole family (`CUST-051`, `CUST-065`, `CUST-080`) is out of scope. If yes, it needs licensing review before build.
`[DECISION NEEDED]` — STORIS re-evaluates insurance jurisdiction from the *current* bill-to state. We should freeze jurisdiction at contract origination and never let an address edit re-price an existing plan.

---
### `CUST-052` Finance Application Queue Tier Settings
*storis_ref: article 15242630130324*

**Purpose.** Organizes third-party finance providers into **tiers** and defines the percentage split of applications within each tier, controlling the order and distribution in which providers are contacted by the finance application queue ("waterfall").

**Where it lives.** Three entry points:
- Accounting > Financing > Financing Settings > Finance Application Queue Tier Settings
- System Administration > System Settings > Accounting System Settings > Financing System Settings > Finance Application Queue Tier Settings
- Financing Control Settings > **Actions** button on the **Transmission** tab

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| District | dropdown | Build a table scoped to a district. **Inactive when the screen is reached from Financing Control Settings.** Once a district is chosen, **Location** goes inactive. Leave blank to scope by location. |
| Location | dropdown (warehouse/store locations) | Build a table scoped to a location. Only locations **that have merchant numbers defined** appear. Once chosen, **District** goes inactive. |
| Provider | dropdown | Adds providers one at a time. Lists "**all eligible, active online providers**". Eligible = **`QUEUING – Include Provider in Application Queue` is checked in Finance Provider Settings**. If the table is for a location, only providers accessible by that location are listed. |
| Tier | numeric (e.g. 1, 2, 3) | Processing order for the provider. |
| Percentage | numeric, **up to 3 digits** | Portion of applications routed to this provider within its tier. |
| Auto Submit | checkbox, **default unchecked** | Whether finance applications at this location are automatically transmitted. |
| Grid (Provider / Tier / Percentage / Remove) | grid | Tier and Percentage are editable in-grid; **Provider is not** — remove and re-add. |

**Behavior & rules.**
- **Hard rule — scope resolution:** entering via **Financing Control Settings** edits the **global table**, which "is used as the default table if a district or location table has not been defined for the location where a finance application is being entered." So resolution order is **Location → District → Global**.
- **Hard rule — a provider may appear once, in one tier only:** "A provider can only exist in one tier, and only once within that tier."
- **Hard rule — no gaps in tier numbers, validated on Save:** "There can be no gaps in the tier numbers. For example, if you entered tiers 1, 2 and 4 only, an error states that 3 is missing and the table must be corrected."
- **Hard rule — percentages must total exactly 100 per tier, validated on Save:** "**The total percentage for each tier must equal 100%**, and is verified once the Save button is pressed."
- Grid is re-sorted on **Add**: "the grid is sorted so that the providers are listed **by tier, by percentage**."
- Whether the queue exhausts every provider in a tier before falling to the next tier is controlled elsewhere: **`Submit Non-Approved Applications to Other Providers in the Same Tier`** in **Financing Control Settings**.
- **Auto Submit** applies only where the location uses the **Finance Application Manager** (set in **Warehouse/Store Location Settings**). It is evaluated "at any point where a finance application record is created (via the Finance Application process from the menu, via **Enter a Sales Order**, or via the **Manage Customer Applications** process)". Unchecked → applications are created but not submitted.
- **Hard rule — regional processing delete lock:** "With Regional Processing active, you are not allowed to delete a district or region until all its locations have been assigned to other districts/regions **and the district is removed from the Finance Application Queue Tier Settings.**"
- Business meaning documented verbatim: tier 1 = best credit scores (named examples: Wells Fargo, GE, Capital One, TD Bank); tier 2 = "less than prime credit that typically are declined by the first tier providers" (named: Concora / previously Genesis Financial Solutions); tier 3 = "lease to own" (named: Rent-A-Center aka AcceptanceNOW).

**Dependencies.** `CUST-054` Finance Provider Settings (`QUEUING – Include Provider in Application Queue`); Financing Control Settings (`Submit Non-Approved Applications to Other Providers in the Same Tier`, Transmission tab); Warehouse/Store Location Settings (Finance Application Manager, merchant numbers); District/Region setup; Enter a Sales Order; Manage Customer Applications.

**Build notes.** Implement as `finance_waterfall(scope)` with our standard resolver scopes — this is a clean fit for **LOCATION → DISTRICT → COMPANY** most-specific-wins (add `DISTRICT` if not already in the resolver scope list alongside the wave-1 additions `COMPANY`, `VENDOR_REMIT_TO`, `VENDOR_REGION`, `TERMS_CODE`, `PRODUCT_CATEGORY`). Keep the 100%-per-tier and no-gap validations. **Percentage-based routing is effectively a random split of a consumer credit decision across lenders — this needs a fair-lending / ECOA review before we ship it**, and every routing decision must be logged (applicant, tier, provider chosen, random draw, outcome) to `RPT-AUDIT`.
`[DECISION NEEDED]` — do we auto-submit? Auto-submitting a credit application without an explicit customer authorization step per provider is a hard-pull consent problem. STORIS defaults **Auto Submit off**; we should keep it off and require per-provider consent capture.

---

### `CUST-053` Finance Level/MMP Table
*storis_ref: article 15242406416020*

**Purpose.** Defines the **Minimum Monthly Payment (MMP)** owed at each balance tier for revolving plans that use a fixed, table-driven MMP.

**Where it lives.** Revolving Receivables Payment Plans > **Actions** button > Finance Level/MMP Table.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Finance Level | currency | "the level (amount) that represents **the minimum that the revolving finance amount must be in order to be charged the corresponding MMP**." |
| MMP Amount | currency | Minimum Monthly Payment for that level. **"This amount includes the principal amount, interest and insurance amounts."** |
| Grid Information | grid, ascending | Lists levels ascending. Add via **Add**; edit by double-click a row, change values, **Add** again to update. |

**Behavior & rules.**
- **Hard rule — required whenever `Calculate MMP` = `As a Fixed MMP Amount`:** "This table … is required if you select the **As a Fixed MMP Amount** option at the **Calculate MMP** field in the revolving payment plans." Each such plan must have "at least one Finance Level and MMP Amount."
- **Hard rule — first row must be exactly `0.00` and the table must be strictly ascending in both columns:** "The first level must be entered as **zero (0.00)**, with **each subsequent setting increasing both the level and MMP Amount.**"
- **Lookup is a step function, take-the-highest-level-not-exceeding-balance.** Verbatim worked example from the article: *"The customer's finance amount is $250.00. Your table is set as follows: first level = 0.00, MMP = $10.00; second level = $200.00, MMP = $20.00; third level = $300.00, MMP = $30. Since the revolving amount ($250) is more than the 2nd level amount but less than the 3rd level, the MMP for this customer's plan is **$20.00**."*
- Single flat MMP is expressed as a one-row table: "create only one level, with the Finance Level = 0.00 and the MMP Amount equal to the MMP amount you want to default for that plan."
- **MMP is inclusive of interest and insurance** — so a rising insurance premium eats principal rather than raising the payment.

**Dependencies.** Revolving Receivables Payment Plans (`Calculate MMP` = `As a Fixed MMP Amount`); `CUST-051`/`CUST-080` insurance (component of MMP); `CUST-081` Interest Rate Table; `CUST-092` Minimum Finance Charge Table.

**Build notes.** Implement as an ordered `(min_balance, mmp_amount)` step table with validation: first row `min_balance = 0.00`, strictly increasing on both columns. Resolve with `max(row.min_balance <= balance)`. Store the table **versioned with an effective date** — changing an MMP table silently re-prices every open revolving account, and STORIS has no audit of that. Feed `RPT-AUDIT`.
`[DECISION NEEDED]` — house revolving credit is a lending product requiring state licensing. Confirm LA Mattress is doing house revolving (provider #7 "House" exists in STORIS) before building `CUST-053`, `CUST-081`, `CUST-092`.

---

### `CUST-054` Finance Provider Settings
*storis_ref: article 15242630366228*

**Purpose.** The master record for each third-party finance provider (e.g. Citi Financial, Encompass, GE Capital) — contact details, GL/posting behavior, transaction codes, transmission protocol and per-provider behavioral flags.

**Where it lives.** Tabs: **General**, **Online Transmit**, **Communications**. Support files referenced: **Zip Code, Sales Tax, Bank Master, Warehouse Location**. *(No explicit menu path is published in the article.)*

**Fields**

**Key**

| Field | Type | Purpose / business rule |
|---|---|---|
| Finance Provider | 1–2 digit numeric code | Provider key. **Hard rule: "You cannot edit, delete, or create new transmitting provider codes."** STORIS ships the transmitting providers. You may add **non-transmitting** providers only — "you cannot establish an electronic connection for instant transmission with any provider you add - only with the providers added by STORIS." |

**General tab — CONTACT INFO**

| Field | Type |
|---|---|
| Provider Name | text |
| Address Line 1 / Address Line 2 | text |
| Zip/Postal Code | code ref (Zip Code support file) |
| City/Town / State/Province | text / code |
| Phone # / Ext / Fax # | text |
| Contact Name | text |

**General tab — TRANSACTIONAL ACTIVITY**

| Field | Purpose / business rule |
|---|---|
| Auto-Pay Post Bank | Bank the provider's auto-payments post to (Bank Master). |
| Bank Reconciliation | Whether provider activity flows into bank rec. |
| Deposit Type Code | Deposit classification for provider settlements. |
| Posting Method | How provider transactions post to GL/AR. |
| Place Orders on F4 Credit Hold | **Puts orders on hold code F4 for this provider.** See `CUST-077` Hold Code Settings. |
| Refund Original Financing | Whether refunds must go back to the original finance tender. |
| Authorization Alert Message | Message shown on authorization. |
| Finance Comments Required | Forces comment entry on finance transactions. |

**General tab — IN-STORE PAYMENTS**

| Field | Purpose / business rule |
|---|---|
| Payment Type for Posting | Payment type used when posting in-store payments to this provider. |
| Customer Daily Cash Limit | **A per-customer, per-day cash ceiling on in-store payments to this provider** — an AML/structuring-relevant threshold. |
| Payment Class Access | Which payment classes may be used. |

**General tab — Transaction Codes.** "specific retail transaction codes used in data transmission to the finance provider as well as for analysis. These codes are supplied by the finance provider. **If no codes were supplied, you can enter any unique codes. However, if not using STORIS' data transmission capabilities, leave these fields blank.**" Fields: `Initial Sale`, `Add On Sale`, `Customer Return`, `In-Store Payment`, `Payment Reversal`.

**Online Transmit tab**

| Field | Purpose / business rule |
|---|---|
| Transmit this Store Location | Per-location transmit enable. |
| Transmission Method | Drives which Communications sub-sections activate: **TCP/IP** or **SSL** activate the TCP/IP block; **Web Service** activates the WEB SERVICE block. |
| Settlement Type | Settlement mode. |
| Maximum Contract Adjustment | Cap on post-sale contract adjustment. |
| Client Pay Code | Provider-assigned client code. |
| Account Number Retention Days | **How long the finance account number is retained** — a PII retention control. |
| Manual Authorization Message | Message for manual auth. |
| Type & Description | Provider type/description. |

**Online Transmit tab — behavior flags (exact labels):**

- `ACCOUNT NUMBER - Allow Entry of Finance Account Numbers on the Fly`
- `ACCOUNT NUMBER - Allow for a Finance Plan to be Applied to an Order Prior To Account Number Assignment`
- `ACCOUNT NUMBER - Default the Account Number from the Customer File` — **pulls a stored finance account number off the customer master onto a new order automatically.**
- `ACCOUNT NUMBER - Require an Account Number When Requesting Financed Authorizations`
- `CONTRACTS - Allow Adjustments after Partial Completion`
- `CONTRACTS - Allow Debit/Credit Exchanges`
- `CONTRACTS - Allow Zero Dollar Line Items After Partial Completion`
- `CREDIT HOLD - Place Orders on F3 Credit Hold if Provider Declines Financing` — **a decline automatically holds the order on code F3.**
- `CREDIT PROTECTION - Prompt for Credit Protection in the Credit Application Process`
- `CREDIT VIEW - Activate the Online Available Credit Information Inquiry`
- `INSTALLATION CHARGE - Allow installation charge on RTO orders by state/province`
- `LANGUAGE - English` / `LANGUAGE - French` / `LANGUAGE - Spanish` — define the options offered at the **Language Preference** prompt on the **Main** tab of credit application entry. **"If you leave all boxes blank, the default option is English."** "Only some providers prompt for Language Preference." **Hard rule / compliance flag: "The language you select during credit application entry is used for information only. No translation takes place."** The value is transmitted to the provider so they know which language to communicate in. **Collecting a language preference while presenting all disclosures in English is a Reg B / UDAAP exposure.**
- `LOGS - Activate Transmission Logging`
- `PROVIDER - Process as Installment`
- `QUEUING - Include Provider in Application Queue` — gate for `CUST-052`.
- `QUEUING - Treat Pending Response as Closed`
- `SALES TAX - Remove sales tax on RTO orders by state` — see the full rule below.
- `TRANSMIT - Activate the Transmission of Financed Transactions`
- `TRANSMIT - Activate the transmission of Financed Credit Applications`
- `TRANSMIT - Allow Partial Reversals`
- `TRANSMIT - Combine Transaction Dates`
- `TRANSMIT - Notify Providers When No Settlement Details Are Available`
- `TRANSMIT - Receive Electronic Authorization`
- `TRANSMIT - Activate the Transmission of Authorization Reversals`
- `TRANSMIT - Allow Entry of an Authorization Number for Online Providers`
- `TRANSMIT - Allow Resubmission of Pending Applications` — "reviewed when you resubmit an application via finance credit application entry, view finance credit responses, and via the **automatic credit application phantom**."

**Behavior & rules.**
- **Hard rule — the RTO sales-tax removal logic is inverted from intuition and is documented verbatim:** "This field is only used with online providers who offer RTO finance plans and it is **unchecked by default**. … **If you leave this field blank, sales tax is removed from ALL RTO orders for this provider, regardless of sales tax settings.** If you check this box, and check the **Remove Tax on Orders with RTO Plans** setting in **Sales Tax Settings**, tax is removed from RTO orders for this provider and the state with the 'remove' setting checked. **If the sales tax setting is not checked, but this field is checked for the provider, sales tax remains on the order.** The state to be reviewed is based on **the order's selling store**." → *Unchecked = remove tax everywhere. Checked = remove tax only where the state says so.* **A blank checkbox is the aggressive option.**
- **Hard rule — the tax carve-out is not applied consistently:** "The processes that utilize the concept of removing sales tax on RTO orders by state and provider are: **Enter a Sales Order, Enter a Return, Enter an Exchange, Enter a Service Order, Adjust Dollars on Completed Order, and Finance Payment Entry. The Finance Payment Estimator tool, available from a menu or order entry, does not consider if sales tax should be removed/added based on the finance plans entered.**" → **the estimator quotes the customer a different number than the order will actually produce.**
- **Communications tab** is inactive for providers that do not support FTP.
- **RECORD VERSION** fields: "Enter the most recent record version for each field. These fields are **not mandatory** and are **currently only used by Alliance Data Services**. **These fields are locked for STORIS use only.** … alphanumeric, **maximum length of 10 characters**." Fields: `Application`, `Authorization - Sale`, `Authorization - Return`, `Authorization Reversal`, `Available Credit`, `In-Store Payment`, `Settlement` — "**The latest settlement version is 002.66.**"
- **Communications — TCP/IP** (active only if Transmission Method is TCP/IP or SSL): `Application IP Address`, `Application Port`, `Authorization IP Address`, `Authorization Port`, `Settlement IP Address`, `Settlement Port`. **SECURED SOCKET LAYER**: `SSL Address`, `SSL Port`.
- **Communications — SFTP SETTLEMENT**: `Host Address`, `Firewall User ID`, `Firewall Password`, `User ID`, `User Password`, `Source Path`, `Settlement Filename`, `Confirmation File #1`, `Confirmation File #2`, `Host RSA Address`. **Credentials are stored as plain configuration fields on a settings screen — flag for secrets handling.**
- **Communications — WEB SERVICE** (active only if Transmission Method = Web Service): `User ID/Consumer Key, Password/Consumer Secret`, and URLs for `Application`, `Authorization - Sale`, `Authorization - Return`, `Authorization Reversal`, `Available Credit`, `In-Store Payment`, `Settlement`, `New Application - CFA`, `Resubmit Application - CFA`. **Fallback rule: "if the User ID and Password fields are empty, the system obtains the information from the Finance Merchant Settings"** (`CUST-057`).

**Dependencies.** `CUST-052` (queue eligibility), `CUST-055` Finance Provider Settings by Finance Type, `CUST-057` Financing Merchant Settings (credential fallback), `CUST-058` Finance Payment Estimator, `CUST-059` Financing Payment Plan Settings, `CUST-077` Hold Code Settings (F3/F4), Sales Tax Settings (`Remove Tax on Orders with RTO Plans`), Bank Master, Zip Code, Warehouse Location, customer master (stored finance account number).

**Build notes.** Split this monolith: (1) `finance_provider` master; (2) `finance_provider_credentials` in a **secret store**, never a settings table, never rendered; (3) `finance_provider_flags` as an explicit typed policy object. Make the RTO tax rule **positive logic** (`remove_tax_on_rto: NEVER | PER_STATE | ALWAYS`) rather than STORIS's inverted blank-means-always. **Make the payment estimator use the same tax engine as order entry** — the documented divergence is a consumer-disclosure defect. Store `account_number_retention_days` and actually enforce purge. Log all provider transmissions to `RPT-AUDIT`.
`[DECISION NEEDED]` — language preference: if we capture it, we must serve disclosures in that language. Either serve them or do not collect the field.

---

### `CUST-055` Finance Provider Settings by Finance Type
*storis_ref: article 15242390520468*

**Purpose.** Per-provider settings that differ by **finance type** (Revolving / Installment / Rent To Own), edited in a grid where the rows are settings and the columns are the three finance types.

**Where it lives.** Finance Provider Settings > **Online Transmit** tab > **Actions** button > Finance Provider Settings by Finance Type.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Finance Provider | display-only | "The current finance provider code and name are displayed." |
| Selection Grid | edit-capable grid | Rows = setting Description; columns = **Revolving**, **Installment**, **Rent To Own**. |
| Active Financing | checkbox row — **"(Locked Field - STORIS Update Only)"** | **Hard rule: the customer cannot set which finance types a provider supports; only STORIS can.** Indicates which of Revolving / Installment / Rent To Own are active for this provider. **"This setting determines the available options at the `Finance Type` field in Financing Payment Plan Settings."** |
| `ACCOUNT NUMBER - Require an Account Number When Requesting Financed Authorization` | checkbox per finance type | Whether an account number must exist before authorization. **"This setting can be skipped for Installment and RTO plans."** |
| `TRANSMIT – Notify Provider if Changes are Made to Finance Plan` | checkbox per finance type | "Installment and Rent-To-Own (RTO) providers generally need to be aware of changes made to an order so they can update contracts." |
| `TRANSMIT – Separate Point of Sale Transmissions for Exchanges` | checkbox per finance type | "Some providers require that the **return portion of an exchange be transmitted separately from the sale portion.**" |
| Card Prefix — Revolving / Installment / Rent To Own | numeric prefix list | **"These fields are used for validation purposes to ensure that the account number entered was issued by the provider."** Each setting allows **multiple prefixes**, entered directly or via the **Multiple Prefixes Selection Window**. |

**Behavior & rules.**
- **Delivered provider → finance type map, verbatim from the article:**

| Provider # | Provider Name | Finance Type |
|---|---|---|
| 1 | Citi Financial | Revolving |
| 2 | Wells Fargo | Revolving |
| 3 | Synchrony | Revolving |
| 4 | Capital One | Revolving |
| 7 | House | Revolving |
| 8 | Encompass | Installment |
| 9 | TD Bank | Revolving |
| 10 | Concora (previously Genesis) | Revolving |
| 11 | Atlanticus | Revolving |

  (Provider numbers **5 and 6 are absent** from the published list.)
- "NOTE: **Synchrony captures the promotional plan information for each authorization that is received.** The information is also stored in the finance authorization file if it needs to be included in subsequent printing of sales documents."
- Card prefix validation is **the only account-number validation documented** — it is a BIN-prefix check, not a checksum or provider lookup.

**Dependencies.** `CUST-054` Finance Provider Settings (parent); `CUST-059` Financing Payment Plan Settings (`Finance Type` options are gated by `Active Financing`); exchange/return transmission flow; Multiple Prefixes Selection Window.

**Build notes.** Model as `finance_provider_type_policy(provider_id, finance_type)` — a proper child table rather than a 3-column grid, so a fourth finance type (e.g. lease-to-own variants, BNPL) can be added without a schema change. Card prefixes: store as a list of BIN prefixes per (provider, finance_type) and validate on entry, plus a **Luhn check** which STORIS does not appear to do. Do not replicate "locked for vendor update only" — `active_financing` should be ours to configure.

---
### `CUST-056` Financing Eligibility Restrictions
*storis_ref: article 15242610007444*

**Purpose.** Decides whether a given order qualifies for a particular third-party finance plan, and whether the plan counts as a **promotional** plan.

**Where it lives.** Financing Payment Plan Settings > **General** tab > **Action** button > Financing Eligibility Restrictions.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Inventory Formation | code ref (multi) | Links one or more predefined inventory formations to the plan. Search to pick; **Action** button offers *Create new inventory formation*, *Maintain existing inventory formation*, *Select Multiple Inventory Formation Selection*. |
| All Lines Must Be Included in Formation | checkbox | Interacts with the **Usage Action** radio group (`Include` / `Exclude`) — see truth table below. |
| Ignore Sales Discount Finance Plan Restriction | checkbox | Override for the **`Cannot be combined with Third Party Financing`** setting in **Sales Discount Settings**. Checked → the order can still be financed with this plan even when such a discount is on the lines. Blank → the sales discount restriction applies. |
| Minimum Purchase Amount Required | numeric, **2 decimal places, max $99,999,999.99** | **"This amount is based on the subtotal of the order."** |
| Minimum Deposit Percent Required | numeric, **2 decimal places, max 99.99** | **"The percentage entered here is multiplied by the Net Total (merchandise subtotal plus delivery, installation, taxes, and fees) displayed on the order Payment tab."** |
| Maximum Percentage When Used as a Deposit | percent | See deposit rules below. |
| Usage Action (radio) | `Include` / `Exclude` | Governs how the inventory formation is read. |

**Behavior & rules.**
- **Hard rule — the promotional-plan test:** "If one or more of any of the following fields (**Inventory Formation, Minimum Purchase Amount Required, Minimum Deposit Percent Required**) contain a value, **this plan is considered a promotional plan.**" Promotional status is *inferred from data*, not declared by a flag.
- **Hard rule — deposit financing lockout:** "If any of the following five fields are used, this promotional finance plan **cannot** be used to finance the deposit on an order and the `Maximum Percentage When Used as a Deposit` field **defaults to 0.00**. If all 5 fields are blank, you can use this finance plan to finance a deposit, but in order to do so, you must indicate the `Maximum Percentage When Used as a Deposit`." (**The article says "five fields" but only names three in the promotional test — the full five are not enumerated in the published text. Flag as ambiguous.**)
- **Formation truth table (verbatim logic):**
  | Usage Action | `All Lines Must Be Included` | Rule to use the plan |
  |---|---|---|
  | Include | checked | **all** line items on the order must be in the formation |
  | Include | blank | **at least one** line item must be in the formation |
  | Exclude | checked | **none** of the line items may exist in the formation |
  | Exclude | blank | "at least one of the line items on the order must not be excluded" |
- **Hard rule — the failure path puts the order on credit hold rather than blocking it:** "During order entry, if the finance plan entered is not eligible for use, a message is displayed. The message indicates that **the payment type is not valid for the order, states that the order is to be placed on credit hold, and asks if you want to continue.**"
  - Answer **No** → "the plan is removed and another form of payment is required."
  - Answer **Yes** → "the system checks your security settings for the **override plan restrictions** setting."
    - Permission held → "**the order is placed on 'F4' credit hold and the order is saved.** (Use **Update Financing Credit Approvals** to approve F4 credit holds.)"
    - Permission not held → **"you must obtain the ID and password of an authorized user to continue"** — an in-screen supervisor-credential prompt. Otherwise the plan is removed.
- "NOTE: **User receivables security settings** also determine whether a user can apply a finance plan that does not meet the eligibility restrictions."
- **Deposit percentage math, verbatim:** "if the maximum deposit percentage is less than 100%, for example if you enter 50%, and **the merchandise subtotal is 1000.00, you can finance a maximum deposit of 500.00** using this plan based on that merchandise subtotal. However, **if you enter 100% the entire deposit amount, including any taxes or fees, may be financed.**" — **note the base changes from merchandise subtotal to full amount at exactly 100%.**
- "Note that the **`Allow Deposits on Stock Merchandise`** field in the **Financing Control Settings** must be active for this deposit percentage to be applicable to stock merchandise."
- "NOTE: This field is not used to designate a financing plan as being promotional."
- **Hard rule:** "**Finance Plans that are set as Finance Type = Installment or RTO cannot be used for deposits.** The `Maximum Percentage When Used as a Deposit` field defaults to 0.00 and cannot be changed."
- Restrictions "are reviewed for both offline and online providers."

**Dependencies.** `CUST-059` Financing Payment Plan Settings (parent); Inventory Formation / Stock Location Schema; Sales Discount Settings (`Cannot be combined with Third Party Financing`); Financing Control Settings (`Allow Deposits on Stock Merchandise`); Hold code **F4** (`CUST-077`); Update Financing Credit Approvals; user receivables security (`parts/user-security-CATALOG.md`); global **Extended Security** kill-switch.

**Build notes.** Implement eligibility as a declarative rule set evaluated at order save with a **structured reason code**, not a free-text prompt. Make **promotional** an explicit boolean on the plan, not an inference from three populated fields — the inference is a trap (adding a minimum purchase amount silently converts a plan to promotional and zeroes its deposit capability). Keep the two different percentage bases only if finance insists; otherwise pick one base and document it. **Supervisor-credential-in-modal is an anti-pattern** — replace with a named approval request that records approver, timestamp and reason to `RPT-AUDIT`.
`[DECISION NEEDED]` — the "five fields" the deposit lockout depends on are not enumerated in the STORIS docs; we must determine the full list from a live system or from LA Mattress's own policy before porting this rule.

---

### `CUST-057` Financing Merchant Settings
*storis_ref: article 15242630369428*

**Purpose.** Stores per-merchant (per-store, per-provider) identification and credentials used when transmitting finance data — the record that tells the provider *which merchant/store* the transaction came from.

**Where it lives.** Three paths:
- System Administration > System Settings > Accounting System Settings > Financing System Settings > Financing Merchant Settings
- Accounting > Financing > Financing Settings > Finance Merchant Settings
- Accounting > Settings > Financing Settings > Finance Merchant Settings

Support Files: **Finance Provider, Warehouse Location**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Merchant Number | **six-character alphanumeric** | Key identifying the Finance Merchant record within STORIS. |
| Description | free text | Description of the merchant. |
| Provider ID | dropdown | Links to the **Finance Provider Settings** record (`CUST-054`). |
| Merchant Name | text, **not mandatory** | "the name of the merchant **as assigned by Alliance Data Systems**." |
| Primary Merchant Number | text, **up to 16 characters** | "provided by the finance provider and is used to distinguish which merchant is sending the data." |
| Additional Information 1 | text, optional | "additional information required for transmitting FR requests for this merchant." |
| Additional Information 2 | text, optional | as above. |
| Terminal ID | numeric | "supplied by the finance provider and **may or may not be required, depending on the provider**." |
| Auto-Pay Post Bank | bank code (Read-Only Lookup Window) | **Only used when the finance provider is set to (a) Auto-Pay transactions during End of Day processing AND (b) `Post Type = Merchant`.** **Fallback: "If the finance provider is set to auto-pay and post by merchant, and this control is left blank, the `Auto-Pay Post Bank` field from the Finance Provider Settings is used."** |
| Bank Bin Number | id | "account or ID number supplied primarily by the merchant's bank and the clearinghouse being used for transaction processing." |
| Warehouse Locations | list | Valid locations where this merchant is used. **Side effect: "If this field is updated, the Location Settings (Warehouse Location) record for the store added here will be updated to indicate this Finance Merchant ID."** "Multiple locations may utilize the same Finance Merchant, if defined by the finance provider." |
| Call Center Phone Number | phone | **Drives customer-facing message text.** If populated, a pending ADS response includes: *"Customer Service assistance is needed. Please call 999-999-9999."* If not populated: *"Customer Service assistance is needed. Please call Customer Care."* |
| Settlement Error | checkbox | **Hard rule — a latch that silently halts settlement:** "This field will only be accessible if settlement for this merchant was unsuccessful and an error has been encountered. **If this field has been set (checked) from a prior day's settlement, the system will not process settlement records for this merchant.**" Must be manually un-checked after correcting the batch; "Settlement will then resume for this merchant." |
| Settlement Error Msg | text, read-back | Error returned from the provider on a failed batch close — **"used only by providers whose settlement type is TCP"**. Inactive if no settlement error exists. |
| Primary Store Code | numeric | Supplied by the provider if required. "If using the **CitiFinancial** interface, this field is used to indicate the store code where **applications** are submitted." |
| Secondary Store Code | numeric | "Currently this field will only be filled in for clients using the **CitiFinancial** interface. CitiFinancial provides separate store codes for applications and for all other types of transactions." Primary = applications; Secondary = **all other transaction types**. |
| Tertiary Store Code | numeric | "**For future use.**" |
| Current Batch | numeric — **"(LOCKED - STORIS access ONLY!)"** | Current processing batch number; "incremented during the settlement process" and included in data records for providers that require it. |

**Web Services credential fields** (all free text, **"There is no validation of this information."**):

| Field | Purpose |
|---|---|
| Application User ID / Application Password | Connect to the web service for **credit applications**. |
| Authorization User ID / Authorization Password | Connect for **authorizations**. |
| Open-to-Buy User ID / Open-to-Buy Password | Connect for **available credit (open-to-buy) inquiries**. |
| Settlement User ID / Settlement Password | Connect for **settlement**. |

**Behavior & rules.**
- **Credential fallback chain:** "When using a web service, if the **Application User ID and Password** fields are empty, the system obtains the information from the **Finance Provider Settings**." Reason given: "Some providers (**TD Bank**, for example) require different User ID's and Passwords for **each store for each web service**."
- **"NOTE: If offering 3rd party financing with ADS, all Financing Merchant Settings records should be updated with Provider ID 5."** — **This is the only reference in the section to provider #5, which is missing from the provider table in `CUST-055`. ADS = Alliance Data Services = provider 5.**
- Article carries a maintainer comment: *Stephanie Brown, February 06, 2024 — "Updated as of 2/6/2024."*

**Dependencies.** `CUST-054` Finance Provider Settings (credential + auto-pay-bank fallback, `Post Type`, End of Day auto-pay); Warehouse/Store Location Settings (bidirectional — this screen writes the Finance Merchant ID back onto the location record); Bank Master; End of Day / settlement processing.

**Build notes.** **Eight username/password pairs stored in a plain settings screen with no validation is the single worst security artifact found in this part.** In our build: credentials go in a secret manager keyed by `(provider, merchant, service)`, are write-only from the UI, are never returned by any API, and rotation is logged. Model `merchant` as a first-class record with a many-to-many to locations rather than a denormalized write-back. Replace the **Settlement Error** latch with an explicit `settlement_state` machine plus an alert — a silently stalled settlement that only clears when a human notices a checkbox is a revenue-loss bug waiting to happen. Externalize the customer-facing call-centre message into templated content, not a phone-number-present branch.

---

### `CUST-058` Financing Payment Estimator Settings
*storis_ref: article 15242406417428*

**Purpose.** Supplies the rate/term inputs the **Finance Payment Estimator** uses to quote an estimated monthly payment for a given finance plan. **These values are used *only* by the estimator** — they are not the plan's real terms.

**Where it lives.** Financing Payment Plan Settings > **Actions** > Financing Payment Estimator Settings. **Save** returns to Financing Payment Plan Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Interest Rate Percent | percent | Rate used when calculating estimated monthly payment amounts for plans that include interest. May be left empty "if the Full Plan amounts are not desired/required." |
| Term Months | integer months | Term used for estimated payments that include interest. |
| Promotional Term Months | integer months | "the number of months in the promotional plan **during which no interest is charged**." |
| % of Balance | numeric, **> 0, up to 4 decimal places**, optional | Percentage-of-balance style estimate. |
| Minimum MMP Allowed | numeric, **> 0, up to 2 decimal places**, optional | Floor for the estimated monthly payment. |

**Behavior & rules.**
- **Hard rule — mutual exclusion:** "**If `Term Months` is entered, you must leave [`% of Balance`] blank, and vice versa.** However, entry of `Promotional Term Months` and `% of Balance` **is** allowed."
- **Hard rule — the `% of Balance` formula is a division, not a percentage:** "The calculation performed by the estimator for % of balance plans **does not include interest charges**. **The calculation divides the Finance Amount by the value in this field.**" (i.e. `estimated_payment = finance_amount / pct_of_balance_value` — despite the field being named "% of Balance". **This is a naming/semantics trap; copy the behavior only after confirming it against a live system.**)
- **Minimum MMP Allowed logic, verbatim:** "If you enter an amount here, it is assigned as the Monthly Payment in the estimator **if the calculated MMP is lower than this amount**. **If the Finance Amount is lower than the amount entered here, the MMP is set to the Finance Amount.**"
- Both-terms behavior: "If **both** the term months and promotional term months are indicated for a payment plan, then when the finance payment estimator is used, estimated payment amounts are calculated **for the Full Plan and for the Promotional plan**."
- **Hard rule — silent unconfigured plans:** "In order to use the Finance Payment Estimator, **at least one** of the following settings must be populated. If the settings are left blank for a plan, **the plan appears in the available Finance Plan list, but an error message displays when that plan is selected in the estimator.**"
- **Cross-reference to `CUST-054`:** the estimator **ignores** the RTO sales-tax removal rules — "The Finance Payment Estimator tool … does not consider if sales tax should be removed/added based on the finance plans entered." **So the estimator can be wrong in two independent ways: wrong tax base and hand-maintained rates that can drift from the plan's real terms.**

**Dependencies.** `CUST-059` Financing Payment Plan Settings (parent); `CUST-054` (tax divergence); `CUST-053` Finance Level/MMP Table; `CUST-081` Interest Rate Table.

**Build notes.** **Do not build a parallel rate table.** The estimator must compute from the plan's *actual* rate, term and the *actual* tax engine. A quote a salesperson reads to a customer is a disclosure; a separately-maintained estimator table guarantees it will eventually be wrong. If a "% of balance" style product exists, name the field for what it does (`payment_divisor`) and document the formula.
`[DECISION NEEDED]` — payment quotes shown to customers may trigger Reg Z advertising/disclosure requirements (trigger terms). Legal review of the estimator UI copy is required before it ships.

---

### `CUST-059` Financing Payment Plan Settings
*storis_ref: article 15242612075924*

**Purpose.** Creates and maintains the **payment type records for third-party financing** — one record per finance plan offered to customers. This is the central plan definition that `CUST-047`, `CUST-056` and `CUST-058` all hang off.

**Where it lives.** Tabs: **General**, **Text**. Support Files: **Finance Company, Warehouse Location**. *(No menu path published; reached from financing settings.)*

**Fields**

*Source note: this article is a **field-list stub** — field names only, with empty description accordions, and the whole body duplicated on the page. Two fields (`Administrative Fee Product`, `Offline RTO Processing`) appear in the first copy of the list but `Administrative Fee Product` is absent from the second copy — a source inconsistency. Semantics below are inferred except where confirmed from sibling articles.*

| Field | Type | Purpose / business rule |
|---|---|---|
| Payment Type Code | code (key) | The plan/pay-type key. Referenced by `CUST-047` Equivalent Pay Types. |
| **General tab** | | |
| Description | text | Plan name. |
| Finance Provider | code ref | Provider (`CUST-054`). |
| Finance Type | enum: `Revolving` / `Installment` / `Rent To Own` | **Confirmed from `CUST-055`: "This setting determines the available options at the `Finance Type` field in Financing Payment Plan Settings"** — the options are gated by the provider's locked **Active Financing** row. **Confirmed from `CUST-056`: Installment and RTO plans cannot be used for deposits and their `Maximum Percentage When Used as a Deposit` is forced to 0.00 and locked.** |
| Track Receivables | flag | Whether the plan creates a tracked receivable. |
| Receivable GLA | GL account | Receivable posting account. |
| Usage Fee Percent | percent | Merchant discount / usage fee charged by the provider. |
| Usage Fee GLA | GL account | Expense account for the usage fee. |
| Due Days | integer | Days until due. |
| Activation Date | date | **Plan is not usable before this date.** |
| Expiration Date | date | **Plan is not usable after this date** — promotional plans expire. |
| Finance Provider Payment | flag/ref | Payment handling for provider remittance. |
| Equivalent Pay Types | sub-screen | See `CUST-047` — **triggers automatic plan substitution on the order.** |
| Valid Approval Days | integer | **How long a credit approval remains valid** before re-authorization is needed. |
| Transmit Transactions | flag | Whether transactions for this plan are transmitted (see `CUST-054` transmit flags). |
| Administrative Fee Product | product ref | Product used to add an administrative fee to the order. *(Present in one copy of the source list only.)* |
| Prompt for Insurance | flag | Prompts for extended-receivables insurance (`CUST-051`). |
| Limit Use to Stores | location list | Restricts the plan to specific stores. |
| Offline RTO Processing | flag | Enables RTO handling without online transmission. |
| Actions | menu | Entry point to `CUST-056` Financing Eligibility Restrictions (via General tab Action button), `CUST-058` Financing Payment Estimator Settings, and `CUST-047` Equivalent Pay Types. |
| **Text tab** | | |
| Charge Text | long text | **Customer-facing text printed on charge documents** for this plan. |
| Credit Text | long text | **Customer-facing text printed on credit documents** for this plan. |

**Behavior & rules.**
- STORIS guidance: "We recommend you create a record for **each** third-party financing payment plan you offer to your customers."
- **Hard rule (from `CUST-055`):** available `Finance Type` values are constrained by the provider's `Active Financing` row, which is **locked to STORIS update only**.
- **Hard rule (from `CUST-056`):** populating any of `Inventory Formation`, `Minimum Purchase Amount Required`, or `Minimum Deposit Percent Required` on the eligibility sub-screen implicitly makes this plan **promotional** and forces `Maximum Percentage When Used as a Deposit` to 0.00.
- **`Charge Text` / `Credit Text` are free-text fields that end up on customer documents with no approval workflow — a disclosure-control gap.**

**Dependencies.** `CUST-054`, `CUST-055`, `CUST-056`, `CUST-058`, `CUST-047`, `CUST-051` (Prompt for Insurance), `CUST-053` (MMP for revolving), GL accounts (`CUST-069`/`CUST-070`), Warehouse Location, Finance Company support file.

**Build notes.** This is the plan catalogue; build it first and make everything else a child of it. Requirements: effective-dating via `activation_date`/`expiration_date` **enforced at quote time and at authorization time, not just at plan selection**; `valid_approval_days` enforced with a visible expiry on the order; `charge_text`/`credit_text` under a **content approval workflow with versioning** since they are legal disclosures. Because this article is a stub, **the exact validation rules for these fields must be captured from a live STORIS instance or from LA Mattress's finance team before implementation** — do not assume.

---
### `CUST-060` Fiscal Calendar Settings
*storis_ref: article 15242630375316*

**Purpose.** Views/defines the starting and ending dates of each of the 12 accounting periods (plus a 13th adjustment period) for a company's fiscal year.

**Where it lives.** *(The article's **Access** heading is empty — no menu path published.)* Accounting/General Ledger settings area. **"NOTE: This routine has a read-only version in which you can view but not edit data."**

**Fields**

*Source note: field-list stub — names only, no per-field descriptions; body duplicated on the page.*

| Field | Type | Purpose / business rule |
|---|---|---|
| Company | code ref | Company whose calendar is being defined (multi-company aware). |
| Fiscal Year | year | The fiscal year for the period table. |
| Previous Year End | date | End date of the prior year; anchors period 1. |
| Fiscal Period | 1–13 | **"The program includes a 13th period for year-end adjustments."** |
| Starting Date | date | Period start. |
| Ending Date | date | Period end. |
| Grid Information | grid | The 13 period rows. |
| Account Carry-Forward | flag/behavior | See carry-forward rule below. |

**Behavior & rules.**
- Supports **all three general ledger cycle types: calendar, weekly, and other.**
- **Hard rule — editing an existing period table is gated on postings and prompts twice, verbatim:**
  - *"A check for postings to changed GL periods will be required. This may take a while."*
  - then, on proceeding: *"**Un-posted transactions for changed periods may become invalid and not post.**"*
- **Hard rule — edit preconditions:** "You can change existing period definitions **if both the Sales and GL periods are open and the GL period has not been reopened.**" The posting check "occurs as part of the pre-update processing."
- **Hard rule — creating a period table opens those periods for posting:** "**Creating a GL period table in effect opens the periods in that fiscal year for posting.**"
- **Hard rule — a hard cap of two future fiscal years, for performance reasons:** "The affect of all postings are automatically carried forward to future periods. … The effects of any postings made to current periods are carried forward to those future periods, resulting in additional over-head in the posting process and degraded performance. **Therefore, a limit of two future fiscal years is imposed.**"

**Dependencies.** General Ledger Control Settings; Sales period control; multi-company; every posting routine in `CUST-063`.

**Build notes.** Model periods as explicit rows `(company, fiscal_year, period_no 1..13, start_date, end_date, status)` with `status ∈ {FUTURE, OPEN, CLOSED, REOPENED}` — do **not** conflate "table exists" with "period is open", which is STORIS's design and the reason creating next year's calendar silently opens it for posting. Drop the two-future-years cap (it is an artifact of eager carry-forward balances; compute balances on demand or via materialized rollups). Period-definition changes must be blocked outright once any posting exists, not merely warned about, and must be logged to `RPT-AUDIT`.

---

### `CUST-061` Form Settings
*storis_ref: article 15242612074644*

**Purpose.** Assigns STORIS **print form types** (document templates, identified by number) to print jobs — copies, hold-file behavior, default printer.

**Where it lives.** Two paths:
- System Administration > Get Started - Enter Your Information > Get Started Step 2 - Printing > Form Settings
- System Administration > Print System Settings > Advanced Printer Settings > Form Settings

Support Files: **Warehouse/Store Location Settings, Printer Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Form Number | numeric ID | The STORIS form number. Documented examples: **Form 40 = shipping tickets; Form 60 = purchase orders; Form 42 = the sales order document template; Form 20 = End of Day reports.** |
| Description | text | Text description of the form. |
| Number of Copies | integer | Copies when printing this form. "This field is most often set to **1**." |
| Suppress Print | checkbox | "To allow the job to process **but with no output to the printer**". Used with **Create Hold File**. |
| Create Hold File | checkbox | Creates a hold file "that you can print at any time and as many times as desired **until the print job is manually deleted from the print queue**". |
| Alignment Program Name | text — **"(LOCKED - STORIS access ONLY!)"** | Test alignment program for the form. **"Note that no alignment programs are required for STORIS forms."** |
| Number of Page Skips | integer, **default 0** | Pages skipped between print jobs using this form. |
| Logical Printer Number | numeric | Default printer for this form. **"The number entered here must exist in the Printer File."** Used with **Default OS Form**. "The system uses the default when it finds no other print avenues using the **default hierarchy**." |
| Default OS Form | text/numeric | "the default operating system form number. **The default O/S form for Windows 2000 systems is the Printer Name.**" |
| Actions | menu | Contains **Warehouse - O/S Form** (per-location O/S form override). |

**Behavior & rules.**
- **Hard rule — a manual re-sync is required after any edit:** "**NOTE: If you edit this file, you must run the `Synchronize OS to STORIS Printers` to re-initialize the configuration.**" (Config changes are not live.)
- Worked example, verbatim: "**Form 20 (End of Day reports) has the `Suppress Print` NOT selected; the `Create Hold File` option IS selected**, in order to maintain copies of the reports in the print queue until after the End of Day reports have been generated and printed."
- Recovery path: "For any reports that did not print successfully, you can select report outputs for printing using the **Review Print Jobs** program. Once you verify that the reports have printed successfully, you can delete the hold jobs from the print queue using the Review Print Jobs program."
- "This file is typically used only to alter pre-established STORIS defaults."

**Dependencies.** Printer Settings / Printer File; Warehouse/Store Location Settings; Synchronize OS to STORIS Printers; Review Print Jobs; every document-producing routine.

**Build notes.** Print output in our ERP should be a document-rendering service (template + destination + delivery channel), not an OS-form-number mapping. Keep the concept of a **retained rendered document** (STORIS's "hold file") but make it a permanent, addressable, immutable artifact per transaction — **a customer's sales order document is a record we should never depend on a print queue to retain**, and STORIS's version is deleted manually from a queue. No manual re-sync step. `[DECISION NEEDED]` — retention period for rendered customer documents (invoices, contracts, disclosures); likely driven by the finance contract retention requirement, not by print.

---

### `CUST-062` General Ledger Accounts
*storis_ref: article 15242390520980*

**Purpose.** Sets the three GL accounts used when posting receivables and interest for a specific **installment** plan.

**Where it lives.** Installment Receivables Payment Plan Settings > **General Ledger Accounts** field > **Action** button.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Receivables | GL account | "the GL account number where **long term receivables** is to be posted for the selected plan." |
| Earned Interest | GL account | "where **earned (cycled) interest** is to be posted for the selected plan." |
| Unearned Interest | GL account | "where **unearned (activated) interest** is to be posted for the selected plan." |

All three offer a **Search** button (Read-Only Lookup Window) and an **Action** button (GL Account Entry Screen, `CUST-069`).

**Behavior & rules.**
- **Hard rule: "Entry in these GL posting fields is mandatory."** All three, per plan.
- The earned/unearned split is the accounting expression of interest accrual on an installment contract: interest is **activated** (booked unearned) at contract origination and **cycled** into earned interest over the contract's life. **The actual earning method (Rule of 78s vs. simple interest / actuarial) is not stated in this article and must be captured elsewhere — it materially changes both revenue recognition and the customer's early-payoff rebate.**

**Dependencies.** Installment Receivables Payment Plan Settings (parent); `CUST-069` GL Account Entry Screen; `CUST-063` General Ledger Assigned Account Settings (installment adjustment/fee defaults); Cycle Processing.

**Build notes.** Three mandatory account references per installment plan. Enforce mandatory at plan activation, not at save, so a plan cannot go live half-configured. **Record the interest earning method explicitly on the plan** (`earning_method: SIMPLE | ACTUARIAL | RULE_OF_78`) — it is the single most consequential undocumented value in the installment stack, and it must agree with `CUST-051`'s `Rebate Method`.

---

### `CUST-063` General Ledger Assigned Account Settings
*storis_ref: article 15242612074516*

**Purpose.** The system-wide **default GL account map**. Every module's postings fall back here when a more specific account is not found. This is the bottom-but-one rung of the GL account resolution hierarchy.

**Where it lives.** Accounting > General Ledger > General Ledger Settings > General Ledger Assigned Account Settings.
Tabs: **Accounts Payable, Accounts Receivable, Cash Balancing, Finance Receivable, Inventory, Sales, Service, Vendor Receivable, Multi-Company, Importing, Purchasing**.

**Behavior & rules — the resolution hierarchy (this is the article's core content).**
- General principle: "If GL account numbers for particular accounting categories are not found at the previous level in the account hierarchy, the system uses the default account numbers specified here."
- **Worked example, verbatim (finance receivables usage fee):** 1) `Usage Fee GLA` in **Financing Payment Plan Settings** → 2) `Usage Fee Default` on the **Finance Receivable** tab here → 3) "**the GL master account specified at the `GL Account Number Default` in the General Ledger Control Settings.**"
- **EFT hierarchy, verbatim:** 1) `EFT GL Account` in **Bank Settings** → 2) `EFT Payment GL Account` here → 3) `GL Account Number Default ($$$$$^NN)`.
- **Virtual card hierarchy, verbatim:** 1) `Virtual Card GL Account` in **Bank Settings** → 2) `Virtual Card Payment` here → 3) `GL Account Number Default ($$$$$^NN)`.
- **On-account funds hierarchy, verbatim:** 1) `On Account Funds` here → 2) `Receivables GLA` in **Financing Payment Plan Settings**. "**NOTE: The account number entered here must be defined in General Ledger Control Settings.**"
- **Inventory hierarchy:** `Inventory Value`, `Inventory COS`, `Inventory Adjustment` here are each **overridden by the same-named field in Product Group and Product Category** ("Note that the Inventory field in both Product Group and Product Category overrides this field.").
- **Trailing credit hierarchy:** "the process first checks the `Rebate/Trailing Credit General Ledger Account` in **Advanced Product Settings**. If no GL account was specified for the product, the account number indicated in this field is used."
- **Protection plan hierarchy:** `Protection Plan Sales` / `Protection Plan Cost of Sales` here are used "if the Sales GL Account / Cost of Sales GL Account in **Protection Plans Settings** is not populated."
- **Sales tax hierarchy:** `Sales Tax Payable (STORIS)` "is used only if the `General Ledger Account` field in the **Sales Tax** file is left blank for a given jurisdiction."
- **Gift certificate hierarchy:** "Gift Certificates post to this account if the **Gift Certificate Payment Type file** does not contain a General Ledger account number."
- **Miscellaneous fee hierarchy:** used "for all miscellaneous fees and charges for which an account number does not exist in the **Miscellaneous Fee Settings**."

**⚑ The single most customer-relevant rule in this article:**

> **"STORIS determines the cost center for transactions and AR balances based on the location assigned to the customer, regardless of the location at which transactions occur. Customer store assignment resides at the `Store Assignment` field on the `Point of Sale` tab in the Advanced Customer Settings."**

**This is a hard rule with large consequences: revenue and AR are attributed to the customer's assigned home store, not the store that made the sale. Changing a customer's `Store Assignment` re-attributes their financials. Combined with the wave-1 finding that STORIS has no general change-audit log, a `Store Assignment` edit is an untraceable inter-store revenue transfer.** (`Store Assignment` lives in **Advanced Customer Settings**, which is in another part of this section — cross-reference it there.)

**Cost centers and wild cards.**
- "**NOTE: Many GL accounts allow you to enter a wild card in place of the cost center.**" Wild card form is `NN` (e.g. `1234-NN`, "where NN is replaced with the location code"). The GL master default is written `$$$$$^NN`.
- Some AP fields **reject** any cost center and require the **No Cost Center Indicator**, set via the `General Cost Center Indicator` field in **General Ledger Control Settings**. Fields explicitly stated to always use "no cost center": `Paid with Cash`, `Paid with Credit Card`, `Recorded Not Received`. `EFT Payment` and `Virtual Card Payment` **must** use the General Cost Center Indicator.
- **Multi-company hard rule (AR):** "If using Multi-Company Processing, STORIS **strongly recommends** you use the wild carding feature to determine the cost center for this account. **If you do not enter the wild card (NN), but instead enter a cost center directly, you can balance all companies as a whole, but you cannot balance by individual companies.**"
- **Multi-company hard rule (gift certificates) with verbatim prompt:** "In order for the GL postings to balance correctly in a multi-company environment when posting gift certificate transactions, **the following three accounts should always be wild-carded** when multi-company is active. This ensures that GL postings are always made to the store that sold the Gift Certificate. If you set the GL accounts to use anything other than the wildcard, the following message displays. **'Warning! Balancing by company WILL NOT be possible if not wildcarding the NNNN account for a multi-company GL'**. Options for this message are **OK** to accept the entry or **Abort** to reject the entry." (**The article does not name which three accounts** — they appear in the Gift Certificate block: `Gift Certificate`, `Gift Certificate Adjustments`, `Gift Certificate In-Store Only`, `Gift Certificate Rewards` — four candidates for a "three accounts" rule. Ambiguity flagged.)

**Fields — Accounts Payable tab** (account type given first, as in the source)

| Field | Acct type | Rule |
|---|---|---|
| Accounts Payable | — | Credited during AP bill entry, debited through AP check processing. With STORIS Accounting, also credited for customer refunds. |
| Sales Tax | Expense | Vendor-invoiced sales tax; debited at AP bill entry. **"This account is distinct from the Sales Tax Payable account defined on the Sales tab."** |
| Terms Discount | Other Current Liability | "Cash discounts earned based upon timeliness of payments, and credited during check processing." |
| Freight | Expense or Liability | "Either debited to expense or **to liability if using landed costing**." |
| Miscellaneous Debit | Expense or Liability | Additional charges/fees posted through AP bill. |
| Received Not Recorded | Liability | Merchandise value on receipt, before AP bill; reversed on AP bill creation. |
| Returned Not Recorded | Liability | Value after return to vendor, before vendor credit; reversed on credit AP bill. |
| Delivered Not Recorded | Liability | Direct-ship completion before payment. **"If using the Direct Shipments feature, this field is mandatory."** |
| Exported Not Recorded | Suspense | For third-party check printing. Export Payable Checks → debit here, credit AP. Import Completed Checks → credit here, debit AP. |
| Direct-Ship Value Difference | Cost of Goods Sold | Price difference between PO and AP bill. **"This field is mandatory if using the Direct Shipments feature."** |
| Non-Inventory | Expense | "non-inventory goods and services such as labor, fabric protection, and warranties." |
| COM Value | Other Current Asset | **COM = "customer's own materials"** — merchandise ordered from one vendor and sent to another to complete a special order. Suspense; credited at warehouse receipt of finished goods, debited through AP bill. |
| Customer Refunds Payable | — | Credited when adding a customer refund. **"If you use STORIS Accounting, the Customer Refund type AP Bills the Customer Refunds Payable GL account is used if it is populated; otherwise it uses the Accounts Payable GL."** |
| Paid with Cash | — | Only when STORIS AP Processing is active. Credited **instead of Cash in Bank** when manually paying an AP Bill via **Enter Multiple Vendor Invoices** with Cash. **Always "no cost center".** Inactive when GL module off. |
| Paid with Credit Card | — | As above for Credit Card payment type. |
| EFT Payment | — | Credited for individual EFT payments within a batch. **Must use General Cost Center Indicator.** Batch posting debits EFT Payment, credits AP Cash. |
| Recorded Not Received | Receivable (asset) | Debit offset to Cash in Bank when paying a Pending Bill; credited on conversion. **Always "no cost center".** |
| Virtual Card Payment | — | Optional. Credited for virtual card payment; debits Accounts Payable. **Must use General Cost Center Indicator.** |
| Intangible Asset - Protection Plans | — | Debited with the **full cost** of a protection plan "when it is fully **or partially** completed", per **Protection Plan Settings**; credited as plans complete. "The remaining balance in the account represents the unrealized cost of the incomplete protection plan sales." Cost center may be specified or wild carded. |
| Protection Plans Not Recorded | Liability | Cost of plans sold but not yet AP-billed. Credited with full cost at first full/partial completion; debited during AP Bill Entry. "**this account is debited for the full cost of the protection plan when it is fully returned via the Enter a Return or credited via the Adjust Dollars on a Completed Order.**" |

**Note:** "If either of the below 'Paid with' GL accounts is not specified, the system uses the **Bank AP Cash** GL account."

**Fields — Accounts Receivable tab**

| Field | Acct type | Rule |
|---|---|---|
| Accounts Receivable | Other Current Asset | Money owed by customers on completed order merchandise/service and other charges. **Debits during sales order completion; credits when AR payments are received.** Multi-company wild-card warning applies. |
| Accounts Receivable Adjustments | Expense | "Adjustment amounts written off in A/R cash application screen. This account is offered as the offset to AR." |
| Bad Debts | Expense | "Amounts charged off through **Accounts Receivable Bad Debt Entry**." |
| Bad Debt Repossession | — | Default account "when a charged off account is repossessed." |
| Builder Allowance | — | "tracks the **builder allowance gift certificates issued to contractors**." |
| Charge off Overpayments | — | **Credited when charge-off overpayments are received; debited when reversing an overpayment.** (See *Overpay Charged Off Accounts*.) |
| Deposit Liability | Other Current Liability | "**All money posted to customer open orders** through the Accounts Receivable and Sales Order Entry programs. Credited through these processes and **debited during sales order completion.**" |
| Gift Certificate | Other Current Liability | Used if the **Gift Certificate Payment Type** file has no GL account. Credited on purchase, debited on redemption. |
| Gift Certificate Adjustments | — | "changes made **through the import process** to any type of gift certificates." |
| Gift Certificate In-Store Only | — | "when issuing in-store gift certificates." |
| Gift Certificate Rewards | Other Current Liability | "when a gift certificate is issued **using reward points**." (See `CUST-087` Membership Reward Settings.) |
| Installment Adjustments | — | Default posting for balance adjustments via **Manage and Adjust Installment Contracts** or **Automatic Sales Document Credits**. **"active only if Advanced Receivables is active."** |
| Installment Deferment Fees | — | Default posting "when **deferring a payment** in the deferment portion of Manage and Adjust Installment Contracts for the fee that can be assessed." Advanced Receivables only. |
| Installment Late Fees | — | Default posting "for all **late fee adjustments completed during Cycle Processing**." Advanced Receivables only. |
| Installment Miscellaneous Fees | — | Default posting "for all **non-filing fees during the contract activation portion of Cycle Processing**." Advanced Receivables only. |
| NSF Check Charge | Income | **"credited when NSF (that is, insufficient) check charges are applied to a customer's account. The cash account will be debited when payments are received."** |
| Manual Posting | Income | "when manual adjustments are made in **Open Item Receivables**." |
| Revolving Adjustments | — | Default for balance adjustments via **Adjust Revolving Plans → Adjust Balance**. "active only if Revolving Receivables is active." |
| Revolving Late Fees | — | Default for **all late fee adjustments** completed via **Adjust Revolving Plans → Update MMP**. Revolving Receivables only. |
| Revolving Credit Write-Offs | — | "for writing off **long term credit balances** on revolving plans." Processed via the **Revolving Credit Write-Off Export and Import** process. |
| Service Charges | Income | "**Open Item Receivable service charges billed to customers on overdue balances.**" — this is the finance-charge income account. |
| Terms Discount – COS | Cost of Goods Sold | "Discounts given to customers for **timely payment** of their AR balance." |
| Sales Tax Adjustments for Charge-offs | — | Offset to the Sales Tax Liability account "when posting sales tax adjustments created for **Open Item and Revolving Receivables charge-offs**." (See Accounts Receivable Control Settings, Sales Tax Settings.) |

**Fields — Cash Balancing tab**

| Field | Acct type | Rule |
|---|---|---|
| Over or Short | Income or Expense | "During the cash balancing process, **if a drawer fails to balance, the system debits or credits this account with the difference.** The system also posts to this account during the **Reconcile Cash Drawer** process." |
| Prompt (×up to 60) | text | Prompt name on the **Petty Cash Disbursement** screen, e.g. "Postage". |
| GL Account (×up to 60) | GL account | Account hit for that petty cash type. **"Up to 60 sixty prompts and corresponding GL accounts can be entered on this screen."** Petty Cash Disbursement is reached from **Balance a Cash Drawer** and **Balance Approval by Manager**. |

**Fields — Finance Receivables tab**

| Field | Acct type | Rule |
|---|---|---|
| Finance Receivable | Other Current Asset | "Receivables owed to your Company by third-party finance companies." **"This account is mandatory if you are using third-party financing."** |
| Adjustments | Expense | Manual post adjustments to finance receivable transactions. |
| Usage Fee Default | Expense | Used if `Usage Fee GL Account` in the finance payment type is empty. **"This account is debited when the transaction posts to Finance Receivables."** |
| Customer Payments | Other Current Liability | "finance payments received from customers at store locations." **"This account is mandatory if you are using third-party financing."** |
| On Account Funds | — | Optional; wild-cardable (`1234-NN`). Hierarchy above. |

**Fields — Inventory tab**

| Field | Acct type | Rule |
|---|---|---|
| Inventory Transfers | Other Current Asset | Transfers between stores via Sales Order Entry or Inventory Adjustment. |
| Inventory Value | Other Current Asset | Total inventory value. Debits via Inventory Adjustments / PO receiving; credits via order completion / PO un-receiving. **Overridden by Product Group and Product Category.** |
| Inventory COS | Cost of Sales | Debits during sales order completion. **Overridden by Product Group and Product Category.** |
| Inventory Adjustment | Expense | Offsets inventory during adjustments. **Overridden by Product Group and Product Category.** |
| Valuation Difference | Cost of Goods Sold | "Cost discrepancies for merchandise **no longer part of** the company's inventory post a debit to this account." |
| RTV Valuation Difference | Cost of Goods Sold | Difference between recoverable amount and material cost during Return to Vendor. **"This account is checked during the AP bill creation process if the `GENERAL LEDGER - Post RTV Valuation Difference At Completion` setting is checked in the General tab of Costing Control Settings."** **"The default account setting is the same account defined in the `Valuation Difference` field."** Also catches later unit-cost changes on an open RTV AP bill. |
| Cost Exceptions | Other Current Asset | "Cost discrepancies for merchandise **still owned** by the company post a debit… Resolution of cost exceptions credit this account." |
| Landed Freight Asset | Other Current Asset | Debited at warehouse receipt, credited at sales order completion. |
| Landed Freight Liability | Other Current Liability | Credited at warehouse receipt, debited at AP bill entry. |
| As-Is Write-off | Expense | Debited when as-is merchandise is written off via the **Write Off** tab in **Enter a Stock Adjustment**. |
| Vendor Chargeback Adjustment | Asset | **Hard rule with a data-integrity warning:** if using Vendor Receivables, enter the **Vendor Receivables GL account** here (transaction code **VCB**). "If you enter an account other than the Vendor Receivables GL account, **chargebacks do not reflect in Vendor Receivable GL batches**, and **the Aged Trial Balance report will not match the GL hits** because open receivables will exist in Vendor Receivables with no corresponding GL hit." If not using Vendor Receivables, acts as a clearing account when the AP bill is created from the **Vendor Credit** option on the Vendor Chargeback tab. |
| Trailing Credit | — | Debited during order completion; wild-cardable. Hierarchy: **Advanced Product Settings `Rebate/Trailing Credit General Ledger Account`** first, then this. **Posting: debit Rebate/Trailing Credit, credit Inventory Cost of Sales for the trailing credit amount. "The cost fields on the invoice are adjusted to reflect the trailing credit. This impacts the line's margin and also the sales commission if based upon gross profit. The cost of the inventory is NOT adjusted. The average cost and the cost of the piece are not changed in the costing table."** |

**Fields — Sales tab**

| Field | Acct type | Rule |
|---|---|---|
| Posting Method | **"This is a STORIS-locked field."** enum: `Inventory` / `Transaction Type` | `Inventory` = "uses the inventory hierarchy method in which the system searches the following files until it finds a valid account number: **Group Settings → Category Settings → General Ledger Settings**." `Transaction Type` = "determines the transaction type and posts to the appropriate account specified below." **Hard rule, stated twice: "If the posting method is set to Transactional Post Method, entering unique General Ledger Accounts for sales in the Group and Category levels is NOT available."** |
| Sales | — | Active **only if `Posting Method` = Transaction Type**. |
| Customer Returns | — | Active only under Transaction Type. |
| Exchange Sale | — | Active only under Transaction Type. |
| Exchange Return | — | Active only under Transaction Type. |
| Debit Dollar Adjustment | — | Active only under Transaction Type. |
| Credit Dollar Adjustment | — | Active only under Transaction Type. |
| Sales Tax Payable (STORIS) | Other Current Liability | Sales tax collected from customers, credited at sales order completion. **Used only if the `General Ledger Account` field in the Sales Tax file is blank for that jurisdiction.** |
| Customer Discount | Expense | Sales order discounts debit this at completion. |
| Delivery Charge | Income | Delivery charges from the delivery field credit this at completion. |
| Installation Charge | Income | **"Installation and credit memo restocking charges credit this account during sales order completion."** (Restocking fees land in Installation Charge — non-obvious.) |
| Miscellaneous Fee/Charge | Other Current Liability | Default for misc fees with no account in **Miscellaneous Fee Settings**. |
| Repossession Sales | — | Default for all repossession sales. |
| Repossession Cost of Sales | — | Default for all repossession cost of sales. |
| Sales Line Discount | — | "validated in the order mentioned in the **`Post Line Discounts to General Ledger`** field on the **Advanced** tab of **Point of Sale Control Settings**." |
| Sales Line Discount Recovery | — | Offset to Sales Line Discount; same validation order. |
| Protection Plan Sales | — | Used if `Sales GL Account` in **Protection Plans Settings** is empty. **"For partial completions, the proportionate share of the total protection plan price associated with the fulfillment is posted."** |
| Protection Plan Cost of Sales | — | Used if `Cost of Sales GL Account` in Protection Plans Settings is empty. Same proportionate-share rule for partial completions. |

**Fields — Service tab**

| Field | Acct type | Rule |
|---|---|---|
| Part Sales | Income | Credited with parts sales at service order completion. |
| Part Costs of Sales | Cost of Goods Sold | Debited with cost of parts at service order completion. |
| Labor Sales | Income | Credited with labor sales at service order completion. |
| Labor Cost Of Sales | Cost of Goods Sold | Debited with cost of labor sales at completion. |
| Labor Costs Value | Other Current Asset | "Account used to record the value of your labor." |
| Charge Sales | Income | Credited with charge sales at service order completion. |
| Charge Cost Of Sales | Cost of Goods Sold | Debited with cost of charges at completion. |
| Charge Costs Value | Other Current Asset | "Account used to record the value of your charges." |
| Receivables from Vendor | Other Current Asset | **"posted to when the vendor is responsible for the charges."** "mandatory only if you are using the Vendor Receivables module." |

**Fields — Vendor Receivables tab** ("mandatory only if the Vendor Receivables module is active")

| Field | Acct type | Rule |
|---|---|---|
| Vendor Receivable | Other Current Asset | "Receivables owed to your Company by vendors for **bill backs, volume rebates, or manually posted receivables**." |
| Adjustments | Expense | "Amounts written off in V/R cash posting." |
| Manual Post Offset | Expense | Manual post adjustments to a vendor's receivable account. |

**Fields — Multi-Company tab**

| Field | Acct type | Rule |
|---|---|---|
| Multi-Company Due To | Other Current Liability | "inter-company transactions in which money moves **into** a company." |
| Multi-Company Due From | Other Current Asset | "inter-company transactions in which money moves **out of** a company." |

**Fields — Importing tab.** Four identical Asset/Liability pairs, `Landed Add-On 1`…`4`:
- `Landed Add-On N Asset` (Other Current Asset) — "Additional costs (for example, **broker's fees, import duties**, etc.) which are included in the cost of the item. **Debited during warehouse receipts and credited during sales order completion.**"
- `Landed Add-On N Liability` (Other Current Liability) — "**Credited during warehouse receipts and debited during AP bill entry.**"

**Fields — Purchasing tab.** "Use this tab to determine how rebates impact the general ledger. You may select a wild card in place of the cost center."

| Field | Rule |
|---|---|
| Rebate Revenue | "credited for the vendor's portion of the rebate to reflect **revenue earned** from the rebate." |
| Rebate Contra-Revenue | **"If an instant customer rebate is configured to be recognized as a reduction in cost, the account selected here is to be debited for the vendor's portion of the rebate upon completion of the sale. The rebate revenue is not taken as an increase in revenue but rather a reduction in cost, thereby increasing gross profit on the sale."** |

**Dependencies.** General Ledger Control Settings (`GL Account Number Default`, `General Cost Center Indicator`); Bank Settings (EFT, Virtual Card, Bank AP Cash); Financing Payment Plan Settings (`CUST-059`); Product Group / Product Category / Advanced Product Settings (Inventory pack); Protection Plan Settings; Miscellaneous Fee Settings; Sales Tax Settings; Gift Certificate Payment Type (`CUST-067`); Point of Sale Control Settings (`Post Line Discounts to General Ledger`); Costing Control Settings (`GENERAL LEDGER - Post RTV Valuation Difference At Completion`); Accounts Receivable Control Settings; Advanced Customer Settings (`Store Assignment`); `CUST-069`/`CUST-070` GL Account screens; `CUST-064` Cost Center Settings.

**Build notes.**
- Implement a single, explicit, **testable** GL account resolver: `resolve(posting_category, context) → account`, with the chain declared as data (`[PRODUCT, PRODUCT_CATEGORY, PRODUCT_GROUP, PLAN, MODULE_DEFAULT, COMPANY_DEFAULT]`) and a **dry-run/explain mode** that shows which rung answered. STORIS documents at least six different, hand-written hierarchies; we should have one.
- **Cost-center attribution is a business decision, not a config detail.** Reproduce the `Store Assignment`-drives-cost-center rule only if LA Mattress actually wants home-store attribution; otherwise attribute to the **selling location** and keep home store as reporting metadata. Either way, `Store Assignment` changes must be audited and must not retroactively re-attribute posted transactions.
- Replace `NN` string wild cards with a structured `(account, cost_center_source)` where `cost_center_source ∈ {SELLING_LOCATION, CUSTOMER_HOME_STORE, FIXED, NONE}`.
- The **Vendor Chargeback Adjustment** mis-configuration explicitly breaks the Aged Trial Balance ↔ GL tie-out. Our equivalent must be a **derived, non-configurable** account, not a user-entered one.
- Trailing credit changing invoice margin and commission **without changing inventory cost** is intentional in STORIS; make sure our commission engine and our COGS reporting agree on which number they use.

`[DECISION NEEDED]` — Multi-company: is LA Mattress one company with multiple locations, or genuinely multi-company? Nearly all the wild-card warnings above only matter in the latter case.
`[DECISION NEEDED]` — Sales posting method: `Inventory` (product-hierarchy-driven) vs `Transaction Type`. STORIS locks this field and the two are mutually exclusive; picking `Transaction Type` permanently forfeits per-category sales accounts. Accounting must choose before go-live.

---
### `CUST-064` General Ledger Cost Center Settings
*storis_ref: article 15242630365716*

**Purpose.** Creates and maintains GL **cost centers** — normally one per store/warehouse location, but they can also exist independently of any location.

**Where it lives.** Three paths:
- Accounting > Third-Party Accounting > General Ledger Settings > General Ledger Cost Center Settings
- Accounting > General Ledger > General Ledger Settings > General Ledger Account Settings > **Step 1 - Cost Center Settings**
- System Administration > System Settings > Accounting Settings > General Ledger System Settings > General Ledger Cost Center Settings

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Cost Center | numeric code, length from `Cost Center Length` in **General Ledger Control Settings** | **Auto zero-fill rule, verbatim: "if you enter a cost center with less digits than the amount specified at the `Cost Center Length` field, the system automatically interpolates one or more zeros to satisfy the field's requirements. For example, if the Cost Center field indicates four digits and you enter '1', the system zero-fills your entry so your cost center number is '0001'."** Search opens the **GL Cost Center Lookup** window. After a valid code, one of two labels appears: **`Valid Location`** — "the cost center is associated with a location record"; **`Cost Center Only`** — "the cost center is not associated with a location record". |
| Description | text, **up to 30 alphanumeric characters** | Description of the cost center. |
| Company | code ref, **mandatory** | Company associated with the cost center. Search opens the **Company Lookup** window. **De-activated for cost centers that have a corresponding location.** |
| TPA Equivalent | text, **up to 40 characters** | "the corresponding code used by the TPA package that identifies this GL cost center." **"This field is active only if either QuickBooks® or the Generic TPA Interface is active."** |
| Actions → Update GL Accounts | action | "build GL accounts for the selected cost center… if the cost center is associated with a location and you declined to build GL accounts for the cost center when you created the associated location." **"available only for existing cost centers, and only if you are using STORIS Accounting or the Generic Interface."** |

**Behavior & rules.**
- **Automatic creation:** "STORIS creates a corresponding GL cost center whenever you create a new location."
- Cost centers not tied to a location are made "by giving the cost centers a code that does not correspond with any location code in your system."
- On **Save** of a new cost center, "the option appears to add the cost center to existing GL accounts." For an existing cost center the same option is on the **Actions** button. "The option to build GL accounts is available only if you are using STORIS Accounting or the Generic Interface."
- **Hard rule — ordering trap: "If you are creating a warehouse location and corresponding cost center, be sure to create the location FIRST. If you create a cost center first, you cannot create a warehouse with the same code."** (Unrecoverable-by-normal-means ordering dependency.)
- **Hard rule — delete locks:** "The system prevents you from deleting any GL cost center for which **non-transmitted batches** referencing that GL cost center exist. In addition, the system prevents you from deleting GL cost centers with a corresponding location, and **de-activates the `Company` field** in GL cost centers with a corresponding location."
- **Hard rule — TPA:** "If using TPA, **new GL cost centers are not available for use until GL accounts are imported from the TPA.**"

**Dependencies.** General Ledger Control Settings (`Cost Center Length`, `General Cost Center Indicator`); Warehouse/Store Location Settings; Company master; Third-Party Accounting (QuickBooks / Generic TPA Interface); `CUST-063` (wild-card `NN` cost center substitution); `CUST-069`/`CUST-070`.

**Build notes.** Keep cost centers as a first-class dimension, but derive location-backed cost centers automatically and immutably from the location record rather than allowing an independent code that can collide. **Do not implement silent zero-fill on a key field** — reject or normalize with an explicit confirmation; silent key coercion is how duplicate/mismatched cost centers get created. Retain the delete locks. `[DECISION NEEDED]` — do we need cost centers at all beyond location, or is `location` sufficient as the reporting dimension? Adding a free-standing cost-center concept early is cheap; retrofitting it is not.

---

### `CUST-065` General Ledger Insurance
*storis_ref: article 15242406635028*

**Purpose.** Sets the two GL accounts used to post earned and unearned insurance fees for an extended-receivables insurance plan.

**Where it lives.** Extended Receivables Insurance Code Settings (`CUST-051`) > **Action** button at the **General Ledger Accounts** field.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Earned Insurance | GL account | "where **earned (cycled)** insurance fees are to be posted for the selected insurance plan." Search → Read-Only Lookup Window; Action → GL Account Entry Screen. |
| Unearned Insurance | GL account | "where **unearned (activated)** insurance fees are to be posted for the selected insurance plan." Same lookups. |

**Behavior & rules.**
- Mirrors `CUST-062`: insurance premium is **activated** as unearned at contract origination and **cycled** into earned over the plan's life. **The earning schedule is not documented here** — and it must agree with the `Rebate Method` / `Minimum Rebate` on `CUST-051`, otherwise early-payoff rebates and revenue recognition disagree.
- **Save** updates and returns to the previous screen.

**Dependencies.** `CUST-051` Extended Receivables Insurance Code Settings (parent); `CUST-069` GL Account Entry Screen; `CUST-063`; Cycle Processing.

**Build notes.** Same as `CUST-062`: two mandatory accounts per insurance product, plus an **explicit earning schedule** stored on the product. Because insurance rebates are state-regulated, model `earned_to_date` as a computed function of the schedule and expose it — do not derive it only as a side effect of posting.

---

### `CUST-066` General Ledger User Permissions
*storis_ref: article 15242612075668*

**Purpose.** Per-user GL security: restricts which root accounts, sub-accounts and cost centers a user may enter to and/or inquire on, and can force all of a user's journal batches onto Hold.

**Where it lives.** Accounting > General Ledger > General Ledger Settings > General Ledger User Permissions Settings. **"It is available only if STORIS GL Processing is active on your system."**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| User ID | user ref | The user being restricted. Search lists employees. |
| **Entry Restrictions** and **Inquiry/Report Restrictions** — the next four fields exist **once per group** | | "You can restrict employee access to **entry routines, inquiry/report routines, or both**. For both … you can restrict all access or restrict by root account, sub-account, or cost center." |
| No Entry Allowed | checkbox | "To restrict this user from **all** accounts… **If you check this box, you inactivate the fields below.**" |
| Limit Root Account | checkbox + sub-screen | Checking it opens the **Staff GL Limited Access** screen to pick one or more accounts. Also reachable via the field's Action button. |
| Limit Sub Account | checkbox + sub-screen | As above, for sub-accounts. |
| Limit Cost Center | checkbox + sub-screen | As above, for cost centers. |
| Journal Entries on Hold | checkbox | **"To automatically place on Hold all batches entered by the selected user, check the box at this field. Only employees with this field un-checked can remove the batches on Hold status."** Active only if `No Entry Allowed` is **not** checked. "This check box affects accounting personnel or anyone who has access to manual GL Journal Entry." |

**Behavior & rules.**
- **Restriction is a grant list, not a deny list:** checking `Limit Root Account` means "specify specific root accounts to which you want to **grant** this user access" — so the check flips that dimension to allow-list mode.
- **Hard rule — `Journal Entries on Hold` is an elegant maker/checker built out of a single checkbox: a user with the box checked can never release their own batches, and only a user with the box un-checked can release anyone's.** This is the closest thing to segregation of duties found anywhere in this part.
- The restriction is expressed on "any combination of **root account, sub-account and cost center**" — a 3-dimensional intersection.
- Subject to the global **Extended Security** kill-switch (wave 1): every per-user permission is inert unless Extended Security is on in General System Control Settings.

**Dependencies.** General System Control Settings (**Extended Security** global kill-switch); Staff/User file; Staff GL Limited Access screen; `CUST-064` cost centers; `CUST-070`/`CUST-075` GL account and sub-account masters; `parts/user-security-CATALOG.md`; manual GL Journal Entry.

**Build notes.** Port the 3-dimension (account / sub-account / cost center) × 2-mode (entry / inquiry) matrix into our live most-specific-scope-wins evaluator; drop the copy-down template model. **Keep and generalize `Journal Entries on Hold` as a proper maker/checker capability** (`can_post_own_batches: false`) applied to more than GL — it is genuinely good design and we should reuse it for AR adjustments, credit-limit overrides and price overrides. All hold/release events go to `RPT-AUDIT`.

---

### `CUST-067` Gift Certificate Payment Settings
*storis_ref: article 15242630880916*

**Purpose.** Defines the gift certificate / gift card **payment types** referenced when selling or redeeming gift cards, and the GL account each tracks against.

**Where it lives.** Six documented paths:
- System Administration > System Settings > Accounting System Settings > Accounts Receivables System Settings > Gift Certificate Payment Settings
- System Administration > System Settings > Accounting System Settings > General Ledger System Settings > Gift Certificate Payment Settings
- Accounting > Receivables > Receivables Settings > Gift Certificate Payment Settings
- Accounting > General Ledger > General Ledger Settings > Receivables Settings > Gift Certificate Payment Settings
- Accounting > Settings > Payables Settings > Gift Certificate Payment Settings
- Accounting > Settings > General Ledger Settings > Receivables Settings > Gift Certificate Payment Settings

Support Files: **Third-Party Accounting**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Payment Type Code | code (key) | The gift certificate payment type. |
| Description | text | Description of the payment type. |
| Receivable General Ledger Account | GL account (via **TPA GL Account Entry** screen from the field's Action option) | Account used to track this type of gift certificate. **"If multi-company is active and the GL account is set to use anything other than the wildcard, a warning message is issued in the same manner as in the `General Ledger Assigned Account Settings, Accounts Receivable` page."** (See `CUST-063` — the *"Warning! Balancing by company WILL NOT be possible…"* prompt.) |
| Builder's Allowance | checkbox | Marks the payment type as **builder's allowance** gift certificates. "Builder allowance gift certificates are created through the **builder allowance gift certificate import process**." **"This setting cannot be selected if the payment type is marked as `In-Store Use Only`."** |
| In-Store Use Only | checkbox | "the payment type can **only** be used for in-store purchases." "The payment type is used when processing a **return or credit exchange** on a builder allowance gift certificate." |

**Behavior & rules.**
- **Hard rule — gift certificates from returns are never refunded in cash: "NOTE: This payment type can NEVER be refunded. Instead, a new gift certificate is created and issued to the customer. It is for in-store use only."** (**Note the state-law exposure: several states, California among them, require cash-back on gift-certificate balances below a threshold. A blanket never-refund rule is a compliance risk for LA Mattress.**)
- **Hard rule — mutual exclusion enforced at entry: "While multiple builder allowance and in-store use only gift certificate payment types can be created, these settings are mutually exclusive. If you attempt to select both settings, a warning message is displayed and the entry is rejected."**
- If this file has **no** GL account for a certificate type, posting falls back to the `Gift Certificate` account on the **Accounts Receivable** tab of `CUST-063`.

**Dependencies.** `CUST-063` (Gift Certificate, Gift Certificate Adjustments, Gift Certificate In-Store Only, Gift Certificate Rewards, Builder Allowance accounts; multi-company wild-card warning); builder allowance gift certificate import process; Third-Party Accounting / TPA GL Account Entry; Gift Card Processing; `CUST-087` Membership Reward Settings (reward-issued certificates).

**Build notes.** Model gift certificates as a **liability ledger with per-certificate rows** (issue, redeem, expire, adjust), not just a payment type + GL account — STORIS's design makes per-certificate balance auditing awkward. Store `redeemable_scope ∈ {IN_STORE, ANY}`, `origin ∈ {SOLD, RETURN_CREDIT, BUILDER_ALLOWANCE, REWARD}` and `cash_redeemable` as an explicit, **jurisdiction-aware** flag rather than an absolute never-refund rule.
`[DECISION NEEDED]` — **Legal review required on gift-certificate cash redemption and expiration under CA Civil Code §1749.5 and the federal CARD Act before we replicate "can never be refunded".**

---
### `CUST-068` Gift Registry Type Settings
*storis_ref: article 15242612079636*

**Purpose.** Maintains the **gift registry type codes** (event types) offered when creating a customer gift registry.

**Where it lives.** Four paths, all under **Customer**:
- Customer > Point of Sale > Gift Registry > Gift Registry Type Settings
- Customer > Customer Service > Gift Registry > Gift Registry Type Settings
- Customer > Coordination and Logistics > Gift Registry > Gift Registry Type Settings
- Customer > Settings > Gift Registry > Gift Registry Type Settings

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Registry Type | code, **up to 5 alphanumeric characters** | Represents this registry type (event). |
| Description | text, **up to 30 alphanumeric characters** | Describes the registry type (event). |
| Grid Information | grid | Existing Registry Type + Description. Double-click a row to edit its description. |

**Behavior & rules.**
- Codes entered here "are available for selection in the **Create/Update a Customer Gift Registry** routine to indicate the type of event registry being created."
- **Two delivered standard codes: `BR` - Bridal, `GF` - Gift.**
- "NOTE: The Gift Registry feature is available on **eSTORIS**." "Web kits on the **Wish List** page and the first **Check Out** page function similarly to web kits on shopping carts."

**Dependencies.** Create/Update a Customer Gift Registry; customer master; eSTORIS storefront (Wish List, Check Out); web kits.

**Build notes.** Trivial code table — `registry_type(code ≤5, description ≤30)`. **Privacy flag:** a gift registry links a customer to named third parties (registrants, purchasers) and often to an event date; treat registry participants as customer PII subject to the same masking/erasure rules, and note the wave-1 finding that STORIS's erasure routine overwrites name and billing address 1 with the literal `"REMOVED"` while retaining city/state/ZIP — **a registry record would very likely survive that erasure and re-identify the customer.**

---

### `CUST-069` GL Account Entry Screen
*storis_ref: article 15242390750740*

**Purpose.** The reusable pop-up used at every "GL Account" field in the system to pick a root account plus a cost center (or the wild card).

**Where it lives.** "This screen appears at many GL Account fields, for example in the **Update GL Postings** routine."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Account | GL root/parent account | "Enter the GL root or parent account you want to use when posting transactions for this record." Arrow shows "a list of accounts **to which you have access**" (respects `CUST-066`). Search opens the **GL Account Description Lookup**. **"You must enter a valid General Ledger account."** |
| Cost Center | cost center code, or **`Wildcard Cost Center`** | "The program adds this code to the general ledger account when transactions are posted for this record, and then uses it to **track all GL activity involving this GL account for the current record, regardless of the locations for individual transactions.**" |

**Behavior & rules.**
- **Hard rule — a fixed cost center overrides location entirely:** as quoted above, a specified cost center captures *all* activity for that record no matter where the transaction physically occurs.
- **Wild carding, verbatim:** "To have the system wild card the cost center associated with the location at which activity occurs, select **'Wildcard Cost Center'** at the Cost Center field. When posting to GL, **the system reads the cost center associated with the location and appends it to the root account.** This way, you can track GL activity by the location's cost center."
- **This screen is where the `CUST-063` "cost center comes from the customer's assigned store" rule actually bites** — wild carding delegates the cost center to "the location", and per `CUST-063` that location is the customer's `Store Assignment`, not the selling store.
- "When you create a location record, STORIS creates a cost center automatically. **If using TPA, you must manually set up a matching cost center as a `Class` in the third-party accounting software for each cost center in STORIS.**"

**Dependencies.** `CUST-064` cost centers; `CUST-066` GL user permissions (filters the account list); `CUST-063` (wild-card semantics, `Store Assignment`); `CUST-070` GL Account Settings; Third-Party Accounting (QuickBooks Class mapping); Update GL Postings.

**Build notes.** One shared account-picker component, permission-filtered, with `cost_center_mode ∈ {FIXED, FROM_LOCATION}` as an explicit radio rather than a magic dropdown entry called "Wildcard Cost Center". Make **which** location supplies the cost center explicit and configurable (`SELLING_LOCATION` vs `CUSTOMER_HOME_STORE`) — STORIS hard-codes the latter and that is a silent revenue-attribution decision. Auto-sync TPA classes rather than requiring manual mirroring.

---

### `CUST-070` GL Account Settings
*storis_ref: article 15242630384532*

**Purpose.** Maintains the chart of accounts: root accounts, the sub-accounts linked to each root, and the cost centers linked to each parent account.

**Where it lives.** *(Access heading is empty in the source.)* Tabs: **General, Sub-Accounts, Cost Centers**. **"This process is available only if STORIS Accounting is active."**

**Fields**

**Header area (present on every tab) — three control fields:**

| Field | Type | Purpose / business rule |
|---|---|---|
| Account | root account | Specify first. This "activates the drop-down menu for the next element (sub-account if using sub-accounts, otherwise cost center)." |
| Sub-Account | dropdown incl. **`All Sub-Accounts`** | To *add* sub-accounts you must select **All Sub-Accounts**; to *edit* one, select the specific sub-account. |
| Cost Center | dropdown incl. **`All Cost Centers`** | To *add* cost centers you must select **All Cost Centers**. |

**"NOTE: Only one of the following fields is active when specifying an existing root account: Sub-Account, Cost Center."**

**General tab** (edited at the **parent account** level; **"to edit the fields on the General tab, you must select `All Sub-Accounts` at the `Sub-Account` field in the Header Area"**):

| Field | Purpose / business rule |
|---|---|
| Description | Account description. |
| Account Group | Lowest classification level — see `CUST-072` GL Group Settings. |
| Account Sub-Class | Second-highest level — see `CUST-076` GL Sub-Class Settings. |
| Account Class | Highest level — see `CUST-071` GL Class Settings. |
| Account Type | Account type. |
| Inactive | Deactivation flag; **"The General tab is active for any level so that you can access the `Inactive` field."** |

**Hard rule — field lockdown by level, verbatim:** "**When maintaining an existing sub-account, all fields except `Description` and `Inactive` are inactive. When maintaining an existing cost center, all fields except `Inactive` are inactivated.**"

**Sub-Accounts tab** — grid of sub-accounts linked to the selected root account. Field: `Sub-Account`. **"active only if you use sub-accounts."**

**Cost Centers tab** — grid of cost centers linked to the parent account. Field: `Cost Center`. **"This tab is active only if you don't use sub-accounts and you are editing an existing root account, or if using sub-accounts, you access an existing sub-account."**

**Behavior & rules.**
- **Data model, verbatim and important:** "**STORIS creates a separate general ledger account record for every possible combination of root account, sub-account, and cost center.** STORIS also creates a separate record for individual root accounts as well as root accounts combined with a sub-account (**also known as the parent account**). The root account record contains a multi-valued list of all sub-accounts and the parent account contains a multi-valued list of all cost centers." → **the chart of accounts is a fully materialized cartesian product, not a composite key.** Adding one cost center multiplies out across every account/sub-account.
- **Deleting — hard rules:**
  - "**For accounts with postings, STORIS suggests you avoid deleting these accounts and use the `Inactivate` option instead.**"
  - **The `Delete` button is a cascade: "This button deletes the accounts specified in the header area of the screen, AND ALL ACCOUNTS LINKED TO the specified accounts. … Note that the `Delete` button deletes the accounts specified in the header area REGARDLESS OF WHICH TAB YOU ARE VIEWING at the time."** It is inactive until a sub-account or cost center is specified, then activates.
  - **`Remove` on a tab is only usable before Save: "the `Remove` button is active only during the initial entry session of the account. Once you click `Save` on a tab, the `Remove` button is no longer active except for any new accounts added since the last time you clicked `Save`."**
  - Delete pre-checks: "**You cannot delete any account that appears in a definition file [or a] GL posting.**"
  - Element-level deletion routing: root accounts → this routine; **sub-accounts → GL Sub-Account Settings (`CUST-075`)**; **cost centers → General Ledger Cost Center Settings (`CUST-064`)**. "Each of these routines has it's own restrictions."

**Dependencies.** `CUST-071` GL Class, `CUST-076` GL Sub-Class, `CUST-072` GL Group, `CUST-064` Cost Centers, `CUST-074`/`CUST-075` Sub-Accounts, `CUST-069` GL Account Entry Screen, `CUST-063` assigned-account defaults, `CUST-066` GL user permissions.

**Build notes.** **Do not materialize the cartesian product.** Store the chart of accounts as `account(root, sub_account?, cost_center?)` validated by composition rules, with a `valid_combinations` policy where restriction is genuinely required. That alone removes the delete-cascade hazard, the "Remove only before Save" oddity, and the combinatorial growth. Keep `inactive` as the standard retirement mechanism and **block deletion of any account with a posting outright** (STORIS only "suggests" avoiding it in one place while blocking it in another — the docs contradict themselves; blocking is correct). A cascading Delete button that acts on the header regardless of the visible tab is a destructive-UI defect we must not reproduce.

---

### `CUST-071` GL Class Settings
*storis_ref: article 15242630655124*

**Purpose.** Defines the **highest** level of the GL account classification hierarchy, used for reporting and inquiry, and determining the posting method for associated accounts.

**Where it lives.** Accounting > General Ledger > General Ledger Settings > General Ledger Account Settings > **Step 3 - Class Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Class | code, **up to 4 alphanumeric characters** | The GL account class. Search lists existing classes. |
| Description | text | Description; editable on existing classes. |
| Report Type | enum — **exactly two values: `Balance Sheet`, `Profit & Loss`** | Which financial statement the class rolls into. |

**Behavior & rules.**
- **Hard rule — a class is effectively immutable once used: "Once you apply a class to an account, you can not change it on existing records unless no GL account records are assigned the GL Account Class."**
- **Hard rule — delete lock: "You can delete GL Account Class records as long as no GL Account Sub-Class records are linked and no GL account records are assigned the GL Account Class."**
- Hierarchy, verbatim: **Class (highest, this routine) → Sub-Class (`GL Sub-Class Settings`, `CUST-076`) → Group (`GL Group Settings`, `CUST-072`, lowest).**
- "This routine determines the method of posting associated GL accounts."

**Dependencies.** `CUST-076` GL Sub-Class Settings; `CUST-072` GL Group Settings; `CUST-070` GL Account Settings (`Account Class`); financial reporting.

**Build notes.** Straightforward three-level classification. Implement `gl_class(code ≤4, description, report_type ∈ {BALANCE_SHEET, PROFIT_AND_LOSS})`. **Note the ordering quirk: the menu labels Class as "Step 3" even though it is the highest level** — cost centers are Step 1 (`CUST-064`). Preserve the immutability and delete locks. `[DECISION NEEDED]` — two report types is thin; if we want a Statement of Cash Flows or segment reporting we need a richer `statement_mapping` than a two-value enum.

---
### `CUST-072` GL Group Settings
*storis_ref: article 15242612331156*

**Purpose.** Defines the **lowest** level of GL account classification used for reporting and inquiry.

**Where it lives.** Accounting > General Ledger > General Ledger Settings > General Ledger Account Settings > **Step 5 - Group Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Group | code, **up to 4 alphanumeric characters** | The GL account group. Search lists existing groups. |
| Description | text | Description; editable on existing groups. |
| Sub-Class | code ref, **optional ("if any")** | The GL account sub-class this group rolls up to. Search lists sub-classes. |

**Behavior & rules.**
- Hierarchy position: **Class (`CUST-071`) → Sub-Class (`CUST-076`) → Group (this routine, lowest).**
- **Delivered examples given verbatim: `Cash`, `Inventory`, `Accounts Receivable`.**
- **The `Sub-Class` link is optional**, so a group can float unattached to the hierarchy — a reporting-completeness hazard (an unlinked group's accounts will not roll up).

**Dependencies.** `CUST-071` GL Class Settings; `CUST-076` GL Sub-Class Settings; `CUST-070` GL Account Settings (`Account Group`).

**Build notes.** `gl_group(code ≤4, description, sub_class_id)`. **Make `sub_class_id` mandatory** — an optional parent in a reporting hierarchy guarantees orphaned balances that never appear on a statement.

---

### `CUST-073` GL Source Settings
*storis_ref: article 15242630657300*

**Purpose.** View General Ledger **source codes** (the code identifying which subsystem originated a posting) and edit their descriptions.

**Where it lives.** Accounting > General Ledger > General Ledger Settings > Source Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Source Code | code, **read-only key** | The GL source code to view. Search shows the list. |
| Description | text | **The only editable field.** "The description of the selected GL source code appears. You can edit this description." |

**Behavior & rules.**
- **Hard rule: "GL source codes are hard-coded by STORIS so you cannot add or delete them."** Only descriptions are editable.
- "Many GL reports use the GL source as a selection field."
- **The article does not publish the list of source codes.** They must be captured from a live system.

**Dependencies.** General Ledger Control Settings; all GL reports (source is a selection field); every posting routine.

**Build notes.** In our ERP, the posting source should be a **derived, non-editable enum** emitted by the originating module (`SALES_ORDER`, `AR_CASH`, `AP_BILL`, `INVENTORY_ADJ`, `PAYROLL`, `MANUAL_JE`, …) — not a maintainable code table at all. It is one of the few fields that makes a GL posting traceable back to a business event, so it must be reliable. **`[DECISION NEEDED]` — obtain the full STORIS source-code list during data migration so historical postings can be mapped to our enum; it is not in the documentation.**

---

### `CUST-074` GL Sub-Account Entry Screen
*storis_ref: article 15242594989076*

**Purpose.** The reusable pop-up for entering a **root account + sub-account + cost center** triple on a record. The sub-account-aware sibling of `CUST-069`.

**Where it lives.** Appears at GL sub-account fields throughout the system.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Account | GL root account | Arrow shows "a list of accounts **to which you have access**" (respects `CUST-066`). Search offers a **menu** with two choices: the **GL Account Selection** window or the **TPA Account Description Index** window. **"You must enter a valid General Ledger account."** |
| Sub-Account | GL sub-account | Arrow shows accounts you have access to, **"restricted to the sub-accounts linked to the specified root account"**. Search opens the **GL Account Description Lookup**. **"You must enter a valid General Ledger account."** |
| Cost Center | cost center code | "to be added to the GL account when transactions are posted for this record." **"This cost center is used to track all GL activity involving this GL account for this GL record, regardless of the locations for individual transactions."** |

**Behavior & rules.**
- **Hard rule — silent auto-fill and lock: "If only one cost center is available based on cost center restrictions passed AND the cost centers linked to the parent account, that cost center appears in this field and you cannot edit the field."**
- "Cost centers are set up automatically in STORIS when Location records are created. If using TPA, you must set up a matching cost center as a **`Class`** in the third-party accounting software for each cost center in STORIS."
- Note this screen — unlike `CUST-069` — does **not** document a wild-card option; the cost center here is fixed and location-independent.

**Dependencies.** `CUST-070` GL Account Settings (root↔sub-account links); `CUST-075` GL Sub-Account Settings; `CUST-064` cost centers; `CUST-066` GL user permissions; `CUST-069` (sibling screen); Third-Party Accounting.

**Build notes.** Same shared picker component as `CUST-069`, with the sub-account dimension enabled when sub-accounts are in use. Keep the "only one valid option → auto-select" behavior but **show it as a selected-and-locked value with an explanation**, not as an inert field. Make the wild-card / fixed cost-center choice available consistently across *both* pickers — the inconsistency between `CUST-069` and `CUST-074` is a source of misposted cost centers.

---

### `CUST-075` GL Sub-Account Settings
*storis_ref: article 15242612330388*

**Purpose.** Creates and maintains GL **sub-account** codes.

**Where it lives.** Accounting > General Ledger > General Ledger Settings > General Ledger Account Settings > **Step 2 - Sub-Account Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Sub-Account | code | **"The system attempts to validate your entry against the sub-account mask (if any) defined in the General Ledger Control Settings. If no mask exists, then you can enter up to 14 alphanumeric characters."** Search lists existing sub-accounts. |
| Description | text | Description of the sub-account. |

**Behavior & rules.**
- **Hard rule — double gate on availability: "This process is available only if STORIS GL Processing is active on your system AND the `Use Sub-Accounts` field is checked in the General Ledger Control process."**
- **Hard rule — delete lock: "you can only delete sub-accounts that are not being used by any GL accounts."**
- The **sub-account mask** in General Ledger Control Settings is the format authority; **the mask itself is not documented in this article.**

**Dependencies.** General Ledger Control Settings (`Use Sub-Accounts`, sub-account mask); `CUST-070` GL Account Settings (Sub-Accounts tab); `CUST-074` GL Sub-Account Entry Screen; `CUST-066`.

**Build notes.** `gl_sub_account(code, description)` with an optional configurable format mask, validated at entry with a clear error rather than a silent "attempts to validate". Retain the delete lock. `[DECISION NEEDED]` — does LA Mattress need sub-accounts at all, or are `account` + `cost center` sufficient? Turning sub-accounts on later is much harder than leaving the dimension available and unused (see `CUST-070`'s cartesian-product problem).

---

### `CUST-076` GL Sub-Class Settings
*storis_ref: article 15242612335380*

**Purpose.** Defines the **second-highest** level of GL account classification.

**Where it lives.** Accounting > General Ledger > General Ledger Settings > General Ledger Account Settings > **Step 4 - Sub-Class Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Sub-Class | code, **up to 4 alphanumeric characters** | The GL account sub-class. Search lists existing sub-classes. |
| Description | text | Description. **"Be sure not to duplicate the description of an existing sub-class."** (An instruction, **not an enforced constraint** — duplicate descriptions are apparently allowed.) |
| Class | code ref, **mandatory** ("Specify the GL account class with which to associate this sub-class") | Parent class. Search lists classes. |

**Behavior & rules.**
- **Hard rule — delete lock: "You can delete GL account sub-class records as long as no GL account group records are linked and no GL account records are assigned to the GL account sub-class."**
- **Delivered examples given verbatim: `Current Asset`, `Fixed Asset`, `Other Asset`, `Current Liability`, `Long Term Debt`, `Sales`, `Cost of Sales`, `Finance Charges`, `Other Income`, `Other Expense`.**
- Note the sub-class list contains **`Finance Charges`** as a top-level income classification — corroborating that AR service charges (`CUST-063`, `Service Charges` account) are treated as an income stream in their own right.
- **Asymmetry with `CUST-072`:** the `Class` link here is mandatory but the `Sub-Class` link on a Group is optional.

**Dependencies.** `CUST-071` GL Class Settings (parent); `CUST-072` GL Group Settings (children); `CUST-070` GL Account Settings (`Account Sub-Class`).

**Build notes.** `gl_sub_class(code ≤4, description, class_id NOT NULL)`. **Enforce description uniqueness** — the docs ask the user to do manually what the database should do. Seed with the ten delivered examples above as our starting sub-class list; they map cleanly to a standard retail chart of accounts.

---
### `CUST-077` Hold Code Settings
*storis_ref: article 15242630657044*

**Purpose.** Defines **AP hold codes for vendors**. Despite the generic title (and despite this section being "Customer Settings"), this is **not** the customer/AR credit-hold screen.

**Where it lives.** Accounting > Payables > Payables Settings > Vendor Information Settings > Hold Code Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | code | The AP hold code. Search lists existing codes. |
| Description | text | Description of the AP hold code. |

**Behavior & rules.**
- **Hard rule — assigning the hold is a blanket forward-acting block: "If you assign a hold status to a vendor (via the `Hold Code` field on the `Payable` tab of the `Vendor Settings`), the system puts on hold ALL newly created AP bills for that vendor."** (Newly created only — existing bills are not swept.)
- **Hard rule / naming trap, verbatim: "NOTE: AP hold codes are distinct from both AR credit hold codes and from purchase orders placed on hold via the `On Hold` field in `Enter a Purchase Order`."**
- **Consequence for the AR side of this pack:** the **F3** and **F4** credit holds referenced in `CUST-054` and `CUST-056` are **AR credit hold codes**, which are maintained in a *different* screen (the "Credit Hold Codes List (AR)" article, which is not in positions 47–92 — cross-reference it in another part). **Three unrelated hold namespaces exist in STORIS and share the word "hold".**

**Dependencies.** Vendor Settings (`Hold Code` on the Payable tab); AP bill creation; AR credit hold codes (separate); Enter a Purchase Order (`On Hold`, separate). Related to `CUST-054` (`Place Orders on F4 Credit Hold`, `CREDIT HOLD - Place Orders on F3 Credit Hold if Provider Declines Financing`) and `CUST-056` (F4 on eligibility failure).

**Build notes.** Model **one** hold framework with a typed subject: `hold(subject_type ∈ {VENDOR, CUSTOMER, ORDER, PURCHASE_ORDER, AP_BILL}, code, reason, placed_by, placed_at, released_by, released_at)`. Three parallel hold vocabularies is exactly the kind of accidental complexity we are rebuilding to escape. Holds must be **auditable** (who placed, who released, why) — STORIS records none of that. Decide explicitly whether placing a vendor hold sweeps existing bills; STORIS does not, which means a hold placed for a quality dispute silently lets yesterday's bills through.

---

### `CUST-078` Installment Eligibility Restrictions
*storis_ref: article 15242630129172*

**Purpose.** Restricts which orders/customers may use a given installment plan — by location, state, credit score, and financed amount.

**Where it lives.** Installment Receivables Payment Plan Settings > **Actions** menu on the **General** tab > Installment Eligibility Restrictions. (Reached from `CUST-079`, whose Actions menu labels it **Eligibility Definitions**.)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Restrict Use to | enum — **exactly four values: `No Restrictions`, `Corporate Locations`, `Franchise Locations`, `Specific Store Locations`** | The kind of location restriction. |
| Store | multi-select locations | Active when restricted to **Corporate Locations** or **Specific Store Locations**. Search → Multiple Selection Lookup Window; Action → Multiple Location Selection Window. |
| Franchise | multi-select franchises | Active when restricted to **Franchise Locations**. Search → Multiple Selection Lookup Window; Action → Multiple Franchise Selection Window. |
| State | multi-select tax jurisdictions | Restricts the plan to one or more states. Search → Read-Only Lookup Window; Action → Multiple Tax Jurisdiction Selection Window. **"You can use this setting regardless of your selection at the `Restrict Use to` field."** — i.e. the state restriction is an independent, additional filter. |
| Minimum — Credit Score | numeric | **"Once you enter a value here, this plan is available during Installment Worksheet entry to customers with a credit score EQUAL TO OR GREATER THAN this required minimum."** |
| Minimum — Financed $ | currency | **"Once you enter a value here, this plan is available during Installment Worksheet entry to customers financing an amount EQUAL TO OR GREATER THAN this required minimum."** |

**Behavior & rules.**
- Both minimums are **inclusive** (`>=`), stated explicitly.
- Restrictions compose: location restriction **AND** state restriction **AND** credit score **AND** financed amount.
- **The plan filter is applied at Installment Worksheet entry** — plans that fail simply do not appear (contrast with `CUST-056`, where an ineligible finance plan produces a prompt and a credit hold instead).
- **⚑ Compliance flag: a `Minimum Credit Score` on a credit product, combined with `State` and location restrictions, is a credit-underwriting criterion. It must be documented, consistently applied, and disclosable — adverse action notices under ECOA/Reg B may be required when a customer is not offered a plan because of a score threshold. Silently omitting a plan from a list is exactly the pattern that makes that hard to evidence.**

**Dependencies.** `CUST-079` Installment Payment Plan Settings (parent); Installment Worksheet entry; location/franchise master; Sales Tax jurisdictions; credit bureau / score source (source of `credit score` is not documented here); `CUST-090` Metro 2 Code Settings (credit reporting).

**Build notes.** Implement as an explicit `eligibility_rule` set with a `evaluate(order, customer) → {eligible, failed_rules[]}` API. **Always compute the full result, including which rule failed and by how much, and log it** — the record of *why* a customer was not offered a plan is the compliance artifact. Then decide separately whether the UI shows or hides the plan. `[DECISION NEEDED]` — where does the credit score come from, how fresh must it be, and are we permitted to store it? A stored bureau score has FCRA obligations.

---

### `CUST-079` Installment Payment Plan Settings
*storis_ref: article 15242612331412*

**Purpose.** Creates and maintains the **installment receivables payment plans** — term, interest, deferral, deposit, fees, insurance and rewrite behavior. This is the house-installment product definition.

**Where it lives.** Two paths; tabs **General**, **Advanced**:
- Accounting > Settings > Installment Receivables Settings > Installment Payment Plan Settings
- System Administration > System Settings > Accounting System Settings > Installment Receivables Settings > Installment Payment Plan Settings

**⚑ Hard rule stated up front, and it is the most important one on the screen:**
> **"NOTE: If you edit the settings for an existing installment plan, the changes do not affect customer contracts created before your edits. Only new contracts created after your changes are affected."**
> **Contracts are snapshots of the plan at origination. Plans are not live-referenced. This is correct behavior for a lending product and we must reproduce it deliberately.**

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Installment Plan | code, **up to 5 alphanumeric characters** | Plan key. |
| Description | text, **up to 30 alphanumeric characters** | Action button opens the **Description Field - Language Translation Entry** screen (so plan descriptions *are* translatable — unlike the finance-application language preference in `CUST-054`, which explicitly does not translate). |
| Active | date, optional | "the date on which the plan becomes available. **If you leave this field blank, the plan is available now.**" |
| Expires | date, optional | "the date on which the plan is no longer available. **If you leave this field blank, the plan does not expire.**" "The `Active` and `Expires` fields can be used together to define a date range or independently of each other." |
| Insurance | multi-select codes, optional | "one or multiple **default** insurance plan codes." Action → **Select Insurance** window. Links to `CUST-051`. |
| Classification | enum, **mandatory** | "the contract classification for this plan." *(Values not published.)* |
| Minimum term is Months | numeric, optional | "**checked during installment worksheet entry**." |
| Maximum term is Months | numeric, optional | "**checked during installment worksheet entry**." |
| Default Terms Table | sub-table, optional | "a table of default terms for this plan, **based on finance amounts**." Action → **Default Terms Table** window. |
| Interest Rate is __% with a Calculation | percent (**up to 4 decimal places**) + enum, optional | **Enum values, verbatim: `Straight Line Interest`, `Declining Balance (APR)`, `Straight Line Override` — "When selected, Installment Sales Tax Settings are ignored during the calculation of finance charges."** **Resolution hierarchy, verbatim: "If you do not specify a rate here, the system looks next for a rate in `Sales Tax Settings`, and then finally in `Installment Receivables Control Settings`."** |
| First Payment Due __ Days After Contract Activation | numeric days | "works in conjunction with **the due day in customer settings** to calculate the due date for the first payment." **Leave blank if using `First Payment Due On` or `No Payment for NN Months`.** |
| Contracts Paid Within __ Months Qualify for Same as Cash | numeric months | "If this is a 'same as cash' plan, enter the number of months to be used to calculate the cash date. **If there is a value in the `No Interest for __ Months` setting below, that value defaults into this field and this setting is inactive.** **If the contract is paid off prior to the cash date, interest and insurance amounts are rebated.**" |
| Revoke Same as Cash After __ Late Fees | numeric | **"Indicate the number of late fees that trigger the revocation of the same as cash terms. This is initially set to null for all plans and is only active if an entry exists in the `Contracts Paid Within __ Months Qualify for Same as Cash` field above. To revoke 'same as cash' terms past what is set in this field, either permission is required via `Installment - Override Revoke Same as Cash Terms` in `Create a User/Group Actions - Receivables Security`, or a security override is necessary."** |
| No Interest for __ Months | numeric months, optional | **Worked example verbatim: "if you set this field to '3' and the contract is written for 12 months, finance charges are calculated based on 9 months. The interest is applied to payments 4-12; payments 1-3 do not include interest."** **"If a value is entered into this field, that value defaults into the `Contracts Paid Within __ Months Qualify Same as Cash` field, which becomes inactive."** |
| No Payments for __ Months | numeric months, optional | Active only if `First Payment Due __ Days After Contract Activation` and `First Payment Due On` are blank. **Worked example verbatim: "if you set this field to '3' and a 12 month contract is written, the finance charges are calculated based on 12 months, but spread over 9 payments. The first payment due date is pushed out 3 months."** (**Note the asymmetry with `No Interest for Months`: interest is charged for the full 12 months but collected over 9 payments.**) |
| First Payment Due on | date, optional | Active only if `First Payment Due __ Days After Contract Activation` and `No Payments for __ Months` are blank. A fixed first-payment date. |
| Requires a Deposit of __%, __$ | percent or dollar, optional | Minimum deposit for this plan. **"checked during Installment Worksheet entry."** |
| General Ledger Accounts | sub-screen, **mandatory** | Action → `CUST-062` General Ledger Accounts (Receivables / Earned Interest / Unearned Interest). **"Entry in this field is mandatory."** |
| Fixed Monthly Payment Amount | currency | Low fixed payment for early installments with the balance later. "The amount you enter here displays in the **Remaining** column on the **Contract Amortization Schedule** screen. **If you enter an amount here, you must enter the number of installments at the next field.**" |
| Fixed Monthly Payment Term | integer, **range 1 to 999** | Number of payments the fixed amount applies to. **"If you enter a term in this field, you must indicate the payment amount above."** |
| Actions → **Eligibility Definitions** | menu | Opens `CUST-078` Installment Eligibility Restrictions. |

**⚑ Balloon-payment warning, verbatim and important:**
> "NOTE: The following two fields are only available when the **'No Payments for ____ Months'** is left blank. The `Review Contract Details` screen displays payment terms based on these two fields, if used. **The `Principal` column of the `Contract Amortization Schedule` may yield a NEGATIVE principal amount for the first few monthly installments as a result of the `Fixed Monthly Payment Amount`. The installments following the fixed monthly payment term on the Contract Amortization Schedule may display INFLATED payment amounts, reflecting the fact that the prior installments are under-charging.** In the example below of a 12 month contract and an 11 month fixed payment term, **the last installment is a balloon payment.** The following two fields are also available to enhanced laser printing and to the data warehouse."

**Worked examples for the fixed-payment fields, verbatim:** "If the fixed monthly payment term is set to **11** for a **12** month contract, and the fixed monthly payment amount is set to **$50**, the first 11 installments display an amount due of $50 and the last installment displays the remaining amount due. If the fixed monthly payment term is set to **12** for a **24** month contract and the fixed monthly payment amount is set to **$50**, the first 12 installments display a fixed monthly payment amount of $50 and the remaining amount due is spread out evenly among the last 12 months."

**Fields — Advanced tab** ("Activate a Setting by Selecting a Checkbox")

| Field (exact label) | Default | Purpose / business rule |
|---|---|---|
| `FEES - Late Charge` | unchecked | "To assess late fees for overdue payments **during cycle processing** for this installment plan, check the box." |
| `FEES - Non-Filing Charge` | unchecked | "To assess **document/miscellaneous/non-filing fees** for this installment plan **during Installment Worksheet entry**, check this box." |
| `INSURANCE PREMIUM - Include Interest` | **checked** | **"Check this setting to apply interest to the insurance premium when the installment contract is calculated. The default for this setting is checked."** — **i.e. by default the customer pays interest on their insurance premium.** |
| `INSURANCE PREMIUM - Use ONLY remaining term after "No Interest for Months" to calculate interest` | **checked** | **Verbatim: "If checked, interest is calculated only on the principal amount that excludes no-interest period. For example, a 24 month installment contract with a 6 month no-interest period has interest calculated for months 7-24. If unchecked, interest is calculated for the full principal amount regardless of the `No Interest for __ Months` setting. For example, for a 24 month installment contract with a 6 month no-interest period, month 7 begins interest payments calculated for the entire 24 month installment contract."** **Unchecking this retroactively charges interest for the promotional period — a deferred-interest product. That is a heavily scrutinized structure (CFPB) and must be disclosed as such.** |
| `REWRITE CONTRACTS - Merge active contracts into one` | unchecked | "To allow **add-on sales** during Installment Worksheet entry, check the box. If checked, **prior active contracts can be merged/re-written with contracts written under this plan.**" |
| `REWRITE CONTRACTS - Prompt User during Worksheet entry prior to merging contracts` | unchecked | "If this plan is a **'sale' type**, check the box… the system issues a warning message [when] merging a contract with this plan into a different plan. **If this box is not checked, no prompt is displayed.**" |

**Behavior & rules — summary of the hard ones.**
- **Plan edits never touch existing contracts** (quoted above).
- **Three mutually exclusive first-payment mechanisms:** `First Payment Due __ Days After Activation` **XOR** `No Payments for __ Months` **XOR** `First Payment Due On`. Each is only active when the other two are blank.
- **`No Interest for __ Months` hijacks the same-as-cash field**: entering it defaults and then disables `Contracts Paid Within __ Months Qualify for Same as Cash`.
- **APR-dilution warning, verbatim and consequential:** "**NOTE: Inserting a value in [`First Payment Due __ Days After Contract Activation`] impacts APR calculation by reducing the APR shown in the Installment Worksheet. For example, an installment plan is set with a 21.46% interest rate. That plan is added to a customer's order and the contract has a term of 12 months. If this field is populated with '30', the customer is given an additional 30 days at 0% interest which then causes the APR to be reduced to 19.82% since there is now a total of 13 months of financing for the price of 12 months.**" — **a configuration field silently changes the disclosed APR.**
- **Early payoff on a same-as-cash plan rebates both interest and insurance** ("If the contract is paid off prior to the cash date, interest and insurance amounts are rebated").
- **Same-as-cash can be revoked by accumulated late fees**, and overriding that revocation is a named permission: **`Installment - Override Revoke Same as Cash Terms`** in **Create a User/Group Actions - Receivables Security**.
- Interest rate resolution: **plan → Sales Tax Settings → Installment Receivables Control Settings.** (**A tax settings screen supplying an interest rate is a genuine surprise; it is presumably the per-state regulated rate.**)

**Dependencies.** `CUST-062` General Ledger Accounts (mandatory); `CUST-078` Installment Eligibility Restrictions; `CUST-051`/`CUST-065`/`CUST-080` insurance; Installment Receivables Control Settings; Sales Tax Settings / Installment Sales Tax Settings; **customer settings due day** (customer master — cross-reference the customer-master article in another part); Installment Worksheet entry; Cycle Processing; Review Contract Details; Contract Amortization Schedule; Receivables Security permissions (`parts/user-security-CATALOG.md`); Default Terms Table window; enhanced laser printing; data warehouse.

**Build notes.**
- **Contracts must snapshot the entire plan at origination** — store the resolved rate, method, term, fee flags and insurance codes on the contract row, not a foreign key to a mutable plan. STORIS gets this right; do not regress it.
- Implement the amortization engine once, with the three interest methods (`STRAIGHT_LINE`, `DECLINING_BALANCE_APR`, `STRAIGHT_LINE_OVERRIDE`) as named strategies and a **golden test suite** built from the article's worked examples (12/3 no-interest, 12/3 no-payments, 12-month with 11-month $50 fixed, 24-month with 12-month $50 fixed, the 21.46%→19.82% APR dilution case).
- **Negative principal in the amortization schedule is a defect, not a feature.** Our schedule must never show negative principal; if a fixed payment does not cover interest, either reject the configuration or model it explicitly as negative amortization with a disclosure.
- **Deferred interest (`INSURANCE PREMIUM - Use ONLY remaining term…` unchecked) needs an explicit product-level flag, mandatory disclosure text, and a legal sign-off gate before a plan using it can be activated.**
- Same-as-cash revocation must record: which late fees triggered it, when, and who (if anyone) overrode it → `RPT-AUDIT`.
- `[DECISION NEEDED]` — is LA Mattress originating house installment contracts (i.e. is this a lending business)? If yes, state lending licenses, Reg Z disclosures, and Metro 2 credit reporting (`CUST-090`) all become in-scope work packages, not settings screens.
- `[DECISION NEEDED]` — do we permit `INSURANCE PREMIUM - Include Interest`? Charging interest on an insurance premium is legal in many states but is a customer-fairness decision that should be made deliberately, not inherited as a default.

---

### `CUST-080` Insurance Code Jurisdiction Settings
*storis_ref: article 15242610252052*

**Purpose.** Per-jurisdiction configuration of an insurance code: where it is (and is not) available, the mandated acceptance form, the underwriter, and the rate override or rate table.

**Where it lives.** Extended Receivables Insurance Code Settings (`CUST-051`) > **Action** button at the **Jurisdiction Settings** field.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Jurisdiction | dropdown, **mandatory** | "the location(s) where this insurance is available… In addition, you can indicate states that require a unique acceptance form, underwriter, and/or insurance rate." **"The drop-down list you see when you click the Arrow button contains the jurisdictions where you have set up `Store` location types in STORIS."** |
| Available | checkbox | Checked = available in this jurisdiction; unchecked = **explicitly not available**. |
| Fee Per $100 | currency, optional | **"If you enter an amount here, it overrides the default amount established in the `Per $100` field on the previous screen, when calculating the insurance payment on plans sold in the selected jurisdiction. If no amount is entered here, the default amount established on the previous screen is used."** |
| Rate Table Settings | sub-screen | **"The Action button at this field is active ONLY for Installment plans with a `Type` of `Accident & Health` or `Life`."** Opens the **Rate Table Settings** screen. (**This is the only place the `Type` enum from `CUST-051` is partially revealed: `Accident & Health`, `Life`.**) |
| Underwriter | dropdown, optional | "the insurance underwriter that you do business with in the selected jurisdiction." |
| Form Template | dropdown, optional | "If the selected state requires a different insurance acceptance form…" The list "includes all of the available insurance acceptance form templates on file in your system." **Fallback: "If a form template is not selected, the form template that is designated 'active' for your system is used when printing the acceptance document."** |
| Grid | grid with columns **Jurisdiction, Available, Fee Per $100, Rate Table Settings, Underwriter, Form Template, Remove** | **Add (Plus)** button updates the grid. **Remove** prompts for confirmation. |

**Behavior & rules.**
- **Hard rule — at least one jurisdiction is required: "You must indicate at least one jurisdiction in which the insurance is available."**
- **Hard rule — availability is location-gated at point of entry, stated twice: "Only insurance codes associated with a location are available for selection at the `Insurance` field during entry" / "…during revolving finance entry."**
- **Hard rule — the Sales Tax Settings default cannot be switched off or removed, verbatim (twice):**
  - "**NOTE: If the insurance code is the default as set in `Insurance After Eligibility Age` in `Sales Tax Settings`, this check box cannot be unchecked (inactive). You must check this check box in order to Save.**"
  - "**NOTE: If the insurance code is the default as set in `Insurance After Eligibility Age` in `Sales Tax Settings`, this jurisdiction cannot be removed.**"
  (Consistent with `CUST-051`'s delete lock on the same setting.)
- Jurisdictions come only from places where a **`Store` location type** exists — **so you cannot pre-configure an insurance jurisdiction for a state you do not yet have a store in**, even if you sell/deliver there.
- **⚑ This screen is where the tax-exemption-adjacent theme in the brief actually surfaces for insurance: proof of the applicable rule is a per-jurisdiction rate + a per-jurisdiction acceptance form. There is no expiry, no certificate, and no evidence trail that the correct form version was actually presented to the customer.**

**Dependencies.** `CUST-051` Extended Receivables Insurance Code Settings (parent; `Per $100`, `Type`, `Jurisdiction Settings`); Sales Tax Settings (`Insurance After Eligibility Age`, `State/Province` jurisdiction rows); Revolving Receivables Control Settings (`State Regulations Based Upon`); insurance acceptance form templates; underwriter master; location master (`Store` type); `CUST-065` General Ledger Insurance; `CUST-079` (installment plans that carry insurance).

**Build notes.** Model as `insurance_jurisdiction_rule(insurance_code, jurisdiction, available, fee_per_100?, rate_table?, underwriter, form_template)` with **effective dating**, because insurance rate regulations change and existing contracts must keep the rate that applied at origination. Decouple the jurisdiction list from "do we have a store there" — use the tax jurisdiction master. **Store the exact rendered acceptance form (PDF + template version + timestamp + signature artifact) against the contract**, not just a template reference; the article's fallback ("if no template is selected, the active one is used") means the form actually shown is not recoverable after the fact. `[DECISION NEEDED]` — as with `CUST-051`: is credit insurance in scope at all for LA Mattress?

---
### `CUST-081` Interest Rate Table
*storis_ref: article 15242610251284*

**Purpose.** A per-**jurisdiction** table of interest rates by financed amount, used for installment contracts when the plan itself does not specify a rate. This is the middle rung of the interest-rate hierarchy named in `CUST-079`.

**Where it lives.** **Sales Tax Settings > Action button at the `Interest Table` field.** (**Yes — the regulated consumer interest rate table lives inside Sales Tax Settings. This is the "look next in Sales Tax Settings" step from `CUST-079`.**)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Baseline APR | percent, optional | **"The percentage entered here is used to calculate the interest amount and then is compared to the amount calculated using the `Interest Rate` from the table. THE HIGHER OF THE TWO AMOUNTS IS USED."** |
| is Capped | checkbox | **"To indicate that the value in the `Baseline APR` field (above) represents the MAXIMUM allowable rate, check this box."** — **checking it inverts the Baseline APR from a floor into a ceiling.** |
| Calculation | enum, **mandatory** | Applies to both the Baseline APR and the table Interest Rate. Values verbatim: **`Straight Line Interest` — "The interest, insurance, and principal amounts remain the same each month, based on the Installment payment amount."**; **`Declining balance (APR)` — "The insurance, interest, and principal amounts being paid are calculated from the payment amount each month over the term remaining."** |
| Financed | currency | The financed amount tier. See tiering rule below. |
| Interest Rate | percent | Rate for that tier. **Add** updates the grid. |
| Tiered Interest Table | checkbox, **default checked** | Switches between tiered and single-rate calculation. |
| Grid | columns **Financed $**, **Interest Rate**, **Remove** | "Financed $ - this column represents the tiered finance amounts". |

**Behavior & rules.**
- Table "is built in **ascending financed amount order**".
- **Hard rule — the Baseline APR is a floor by default and a ceiling only when `is Capped` is checked.** Combined: with `is Capped` **unchecked**, the customer is charged **the higher** of the baseline and the tier rate. **A field defaulting to "charge the customer whichever is more" on a regulated consumer credit product is exactly the kind of rule that must be surfaced to legal.**
- **Tiered vs single, verbatim:**
  - **Tiered (`Tiered Interest Table` checked, the default):** "The portion of the amount being financed that is greater than this amount, but less than or equal to the next higher amount in the table, uses the lower tier's corresponding interest rate when finance charges in this jurisdiction are assessed." → **marginal/bracketed rates, like tax brackets: each slice of the balance gets its own rate.**
  - **Single (`Tiered Interest Table` blank):** "One interest rate is used by **locating the financed amount in the table** and using the corresponding rate." → **a single flat rate for the whole balance.**
  - "With the tiered calculation, a different interest rate is assessed based on the tiers… Each tier represents a range of **a portion of** the financed amount." vs "With the single rate calculation, the amount financed is located in the interest rate table and the associated interest rate is assessed **on the amount financed**."
- Used **"if the interest rate is not specified in the plan settings"** — confirming the `CUST-079` hierarchy: **plan → this table (via Sales Tax Settings jurisdiction) → Installment Receivables Control Settings.**

**Dependencies.** Sales Tax Settings (parent, per jurisdiction); `CUST-079` Installment Payment Plan Settings (`Interest Rate is % with a Calculation`); Installment Receivables Control Settings (final fallback); `CUST-053` Finance Level/MMP Table; `CUST-092` Minimum Finance Charge Table; `CUST-051`/`CUST-080` (insurance is included in the straight-line/declining-balance definitions).

**Build notes.** Model as `interest_rate_schedule(jurisdiction, effective_from, baseline_apr, baseline_is_cap, calculation_method, tiers[(min_financed, rate)], tiered: bool)`. **Effective-dating is mandatory** — jurisdictional usury caps change and existing contracts must retain their originating schedule. Implement tiered as true marginal bracketing and single as flat lookup, with a golden test for each. **Separate this from the sales tax module entirely** — co-locating a usury table inside tax settings is why nobody will find it during a rate-cap review. `[DECISION NEEDED]` — confirm with counsel which states LA Mattress would originate installment contracts in and what each state's rate cap and calculation-method requirements are; `is Capped` unchecked ("charge the higher") is the default and is not safe.

---

### `CUST-082` Invoice Charge Settings
*storis_ref: article 15242630660372*

**Purpose.** Creates and maintains **AP invoice header charge codes** (tax, freight, miscellaneous and custom charges) applied to vendor invoices, with their GL account and automatic calculation rate.

**Where it lives.** Three paths:
- Accounting > Settings > Payables Settings > Invoice Charge Settings
- Accounting > Payables > Payables Settings > Invoice Charge Settings
- System Administration > System Settings > Accounting System Settings > Payables System Settings > Invoice Charge Settings

**"If you do not have Third Party Accounting active on your system, you can use this routine…"**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Invoice Charge | code, **up to 15 alphanumeric characters** | The charge code. Search → Read-Only Lookup Window. |
| Type | enum, **mandatory for new, read-only for existing** | Values verbatim: **`None Selected`, `FREIGHT`, `Miscellaneous`, `Sales Tax`.** "For existing invoice charges, the header charge type displays and **cannot be edited**." |
| Description | text, **up to 30 characters** | Action button → **Description Field - Language Translation Entry** window. |
| General Ledger Account | GL account, **not mandatory** | Action → GL Account Entry Screen (`CUST-069`). **"Only the General Cost Center Indicator can be used with this GL account."** **Warning on change: "if you are changing this field for an existing record, a warning is issued that the original GL account may have been used in existing AP bills."** **Fallback: "If you leave it blank, the system uses the appropriate GL account indicated on the `Accounts Payable` tab of `General Ledger Assigned Account Settings`. The account used is based on the type of charge. For example, a sales tax type invoice charge uses the `Sales Tax` GL account."** |
| Rate | percent, **0.0000 to 99.9999**, not mandatory | "to use when **automatically calculating** the AP header charge for this Invoice Charge." **"If you leave this field blank, and this invoice charge is indicated in `Maintain Invoice Charge Table Settings`, the rate is treated as ZERO (0)."** |
| Use For National Tax | checkbox | "this invoice charge should be used with AP bills with the **national sales tax code**." **Hard rule: "The checkbox can only be set for ONE invoice charge and the invoice charge type should be set to tax."** **"This setting is only active if `Imbedded National Tax` is activated in `Point of Sale Control Settings`."** |

**Behavior & rules.**
- **Three delivered standard codes: `Tax`, `Freight`, `Miscellaneous`. "You cannot delete these standard records, but you can edit the `Description`, `GL Account`, and `Rate`."**
- **Hard rule — delete lock: "If invoice charge settings that you created here exist in open or closed AP bills, you cannot delete them."**
- **A blank `Rate` silently becomes 0%** rather than "unset" — so a freight charge configured with no rate quietly calculates nothing.

**Dependencies.** `CUST-083` Invoice Charge Type Settings (the `Type` values); `CUST-063` (Accounts Payable tab fallback accounts: `Sales Tax`, `Freight`, `Miscellaneous Debit`); `CUST-069` GL Account Entry Screen; General Ledger Control Settings (`General Cost Center Indicator`); Maintain Invoice Charge Table Settings; Point of Sale Control Settings (`Imbedded National Tax`); Third-Party Accounting.

**Build notes.** `invoice_charge(code ≤15, type, description, gl_account?, rate?)` — but **make an unset rate distinct from a zero rate** and warn on save if a charge is referenced by the charge table with no rate. The GL-account-change warning should be a **blocking** change with an effective date, since it silently re-points postings for a code already used on historical bills. Keep the single-national-tax-charge constraint as a database-level partial unique index.

---

### `CUST-083` Invoice Charge Type Settings
*storis_ref: article 15242630883476*

**Purpose.** Edits the **descriptions** of the STORIS-supplied invoice charge types. Descriptions only — the types themselves are fixed.

**Where it lives.** Three paths:
- Accounting > Settings > Payables Settings > Invoice Charge Type Settings
- Accounting > Payables > Payables Settings > Invoice Charge Type Settings
- System Administration > System Settings > Accounting System Settings > Payables System Settings > Invoice Charge Type Settings

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Invoice Charge Type | code, **read-only key** | Search lists available types. |
| Description | text, **up to 30 characters** | The only editable field. Action → **Description Field - Language Translation Entry** screen. |

**Behavior & rules.**
- **Hard rule: "Invoice Charge Types are provided by STORIS; you cannot create new ones using this process."**
- **The complete delivered list, verbatim: `FHT` (Freight), `MSC` (Miscellaneous), `TAX` (Sales Tax).**
- **Note the mismatch with `CUST-082`:** the `Type` dropdown on Invoice Charge Settings shows `None Selected`, `FREIGHT`, `Miscellaneous`, `Sales Tax` — four options, three of which map to the three codes here. `None Selected` is a fourth state with no type code behind it, and `CUST-082` says `Type` is **mandatory** for new records — so whether `None Selected` is a savable value is ambiguous in the docs.

**Dependencies.** `CUST-082` Invoice Charge Settings (consumer of these types); `CUST-063` Accounts Payable tab (type-driven GL fallback).

**Build notes.** Make this a **fixed enum in code**, not a maintainable table — three values with localizable labels. Localization belongs in a translation layer, not in an editable description field on a settings screen. Do not carry `None Selected` forward; a nullable type is clearer than a sentinel option.

---

### `CUST-084` List Zip Codes to Apply Tax Code Screen
*storis_ref: article 15242610251796*

**Purpose.** Applies a **Local** tax jurisdiction to a range of ZIP codes, so that customer addresses in those ZIPs pick up the local tax code.

**Where it lives.** Sales Tax Settings > **Actions** button.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (ZIP range: starting and ending code) | ZIP, **5-digit or ZIP+4** | "specify a range of zip codes to which you want to apply the current tax jurisdiction you selected via the Sales Tax Settings." |

*(The article documents rules rather than a labelled field list; the range endpoints are the only inputs.)*

**Behavior & rules.**
- **Hard rule — Local only: "This option is available only if the `Type of Tax` field in the `Sales Tax Settings` is set to `Local` (that is, NOT `State/Province` or `National`)."** (This also confirms the `Type of Tax` enum: **`Local`, `State/Province`, `National`** — the same `State/Province` value referenced by `CUST-051`.)
- **Hard rule — format consistency: "You can specify U.S. zip codes in five-digit or zip+4 format. When entering a range of zip codes, the starting and ending codes must be in the SAME format."**
- **Hard rule — US only: "This routine does not accept Canadian postal codes because of their alphanumeric format. Thus, this screen is available only if `USA` is your domestic country in the `Country Settings`."**
- **⚑ Hard rule — a silent cap that drops updates: "Because each tax code has a limit of SEVEN additional tax codes, the system does not update any zip code that already has 7 additional tax codes."** **There is no documented error, warning or report of which ZIPs were skipped. A tax jurisdiction rollout can silently under-apply, and the resulting under-collection surfaces only at audit.**

**Dependencies.** Sales Tax Settings (`Type of Tax`, jurisdiction); Country Settings (domestic country); ZIP Code support file; customer master ship-to/bill-to address; `CUST-051`/`CUST-080` (jurisdiction sourcing).

**Build notes.** **ZIP-code-range-to-tax-jurisdiction is not a defensible sales-tax model for California**, where district taxes do not align to ZIP boundaries and a single ZIP can span multiple districts. Recommend address-level geocoded tax determination (or an external tax service) instead of a ZIP range table. If we do keep any ZIP mapping: no hard cap on stacked jurisdictions, and **every skipped/conflicting assignment must be reported, never silently dropped**.
`[DECISION NEEDED]` — sales tax determination approach for LA Mattress: internal ZIP/jurisdiction tables vs. an external tax engine (Avalara/Vertex-class). This decision also governs how tax **exemption** certificates are scoped, which is the theme flagged in the brief but whose screens fall outside positions 47–92.

---
### `CUST-085` Mandatory Order Comment Settings
*storis_ref: article 15242630881556*

**Purpose.** Defines the picklist of comment codes presented by the **Mandatory Order Comments** process when a sales order is updated, and whether a free-text comment is also required.

**Where it lives.** *(No menu path published.)* Feeds the **Mandatory Order Comments** process.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | code, **max 10 characters** | "the code displayed in Mandatory Order Comments. **This code is written to the order comments.**" |
| Description | text, **max 50 characters** | "This description is written to the order comments. **The extra action allows for multi-language translation.**" |
| Manual Required | checkbox | "Check this box to require **manual entry of a comment in addition to selection of a code**." |
| Grid | grid | Shows Code, Description, Manual Required. **Delete** button removes a code. **"Code can be placed in a specific order using the promote and demote buttons; the order in which codes are displayed here is how they appear in the Mandatory Order Comment process."** |

**Behavior & rules.**
- **Hard rule — scope is narrow and explicitly enumerated: "This process is ONLY for `Enter a Sales Order`; it does not apply to `Enter and Exchange`, `Enter a Return`, `Enter a Service Order`, or `Adjust Dollars on a Completed Order`."** **So the four transaction types where a reason code matters most for audit and loss prevention are exactly the ones excluded.**
- Codes appear in the process only after Save ("Once saved, the comment option appears in the Mandatory Order Comments process"). Add to grid with the **green plus** button.

**Dependencies.** Enter a Sales Order; Mandatory Order Comments process; order comment storage; Point of Sale Control Settings (activation of mandatory comments is presumably there — not documented in this article).

**Build notes.** This is the closest thing STORIS has to a **reason-code framework**, and it is exactly what our `RPT-AUDIT` needs. Generalize it: `reason_code(domain, code, description, requires_free_text, display_order, active)` where `domain ∈ {ORDER_CHANGE, RETURN, EXCHANGE, PRICE_OVERRIDE, DISCOUNT_OVERRIDE, CREDIT_LIMIT_OVERRIDE, ADJUSTMENT, CANCELLATION, …}` — and **apply it to returns, exchanges, service orders and dollar adjustments**, which STORIS pointedly does not. Reason codes must be written to the audit event, not only into a free-text comment blob.

---

### `CUST-086` Marketing Code Settings
*storis_ref: article 15242662912020*

**Purpose.** Maintains the **marketing / media attribution codes** captured on sales orders and sales leads — "the media source through which the customer learned about your company."

**Where it lives.** Six paths:
- Customer > Point of Sale > Settings > Marketing Code Settings
- Customer > Point of Sale > Sales Leads > Sales Leads Management Functions > Sales Lead Settings > Marketing Code Settings
- Customer > Settings > Point of Sale Settings > Marketing Code Settings
- System Administration > Get Started - Enter Your Information > Get Started Step 8 - Sales > Marketing Code Settings
- System Administration > System Settings > Customer System Settings > Sales and Service System Settings > Marketing Code Settings
- System Administration > System Settings > Customer System Settings > Sales Lead System Settings > Marketing Code Settings

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Marketing Code | code | The media source. Search → Read-Only Lookup Window. Delivered examples verbatim: **`NEWS` = Newspaper; `R814` = Radio advertisement from August 14; `TB` = Telephone book.** |
| Description | text | Action → **Description Field - Language Translation Entry** screen. |
| Activation Date / Expiration Date | dates, optional (one, both, or neither) | **"These dates are used at the `Marketing Code` fields in `Enter a Sales Order` and `Enter a Sales Lead` to restrict the marketing codes that are available when you use the marketing code lookup."** "If you do not establish activation and/or expiration dates, this marketing code appears in the lookup without restriction." |
| Delete | button | See delete lock below. |

**Behavior & rules.**
- **Two codes per order.** "The `Payment` tab in Sales Order Entry includes the **`Code 1`** and **`Code 2`** fields." They are activated by **`First Marketing Code`** and **`Second Marketing Code`** on the **Advanced** tab of **Point of Sale Control Settings**.
- **Hard rule — editing an existing order's marketing code needs both a global switch and a per-user permission: "`Allow Marketing Code Changes` - users can edit the marketing code fields on existing orders only if a check appears at this field. Note that the `Allow Marketing Code Changes` field is a GLOBAL setting. If you activate this feature globally, users must still have security clearance to edit marketing codes (via the `Change Marketing Code` field in the `Extended Security Settings`)."** (Consistent with the wave-1 finding that **Extended Security is a global kill-switch** — `Change Marketing Code` is one of the per-user flags it gates. Reuse the existing permission ID from `parts/user-security-CATALOG.md`.)
- **Hard rule — delete lock: "If a marketing code exists on any historical sales orders, the delete button is inactive… Deletion of any marketing code is only allowed if it does not exist on any completed sales orders."**
- **Attribution is versioned in reporting, not on the record:** two reports exist — **`Report Sales History by Initial Marketing Code`** and **`Report Sales History by Adjusted Marketing Code`** — meaning STORIS keeps both the original and the edited attribution. **This is the one place in this part where STORIS does preserve before/after history, and it stands in direct contrast to the wave-1 finding that demographic answers are overwritten per customer, destroying attribution history.**

**Dependencies.** Point of Sale Control Settings (Advanced tab: `First Marketing Code`, `Second Marketing Code`, `Allow Marketing Code Changes`); Extended Security Settings (`Change Marketing Code`) + global Extended Security kill-switch; Enter a Sales Order (Payment tab, Code 1/Code 2); Enter a Sales Lead; `CUST-088` Merchandise of Interest Settings (lead capture); Report Sales History by Initial/Adjusted Marketing Code.

**Build notes.** Model as `marketing_code(code, description, active_from?, active_to?)` plus, on the order, **both** `marketing_code_initial` and `marketing_code_current` with a change log — copy STORIS's initial/adjusted split, it is right. Two fixed slots (`Code 1`/`Code 2`) is a limitation; use a list with a `slot` or `role` (e.g. `primary_source`, `secondary_source`) so multi-touch attribution is possible later.
**⚑ Contact/consent adjacency:** marketing code records *how the customer found us*, which is **not** the same as *permission to contact them*. The brief's TCPA concern is about **solicitation preferences and consent capture**, and **no field on this screen or anywhere in positions 47–92 captures consent, opt-in source, timestamp, or channel.** The consent fields live on the customer master and solicitation screens outside this range — flag there. Our build needs `consent_event(customer, channel ∈ {CALL, SMS, EMAIL, MAIL}, state, captured_at, captured_by, source_artifact, ip/device, disclosure_version)` as an **append-only** log; a mutable preference flag on the customer master is not a defensible TCPA record.

---

### `CUST-087` Membership Reward Settings
*storis_ref: article 16917259015188*

**Purpose.** Defines the rules for **membership programs**: how reward points accrue and expire, how reward gift certificates are created and restricted, and what protection-plan benefits membership confers.

**Where it lives.** Point of Sale > Settings > Membership Reward Settings. Sections: **General**, **Reward Points**, **Reward Gift Certificates**, **Protection Plans**.
"Rules for one or more membership programs can be defined within this process. Different benefits can also be assigned based on the purchased program."

**Fields — General**

| Field | Type | Purpose / business rule |
|---|---|---|
| Membership Product | product ref, **required** | **"The product entered must exist in the `Advanced Product Settings` and must be designated as a membership item."** |
| Maximum Number of Linked Accounts | numeric, **null or 0–9** | **Three-state rule, verbatim: "If the entry is left null, an UNLIMITED number of accounts can be linked to share membership benefits. If the entry is set to ZERO (0), linking of accounts to share benefits is NOT supported."** 1–9 = that many; exceeding it shows a warning message. **Null meaning "unlimited" and 0 meaning "none" is a classic footgun.** |
| Auto - Renewal | enum — **`Automatically Renew` (default), `Do Not Automatically Renew`, `Prompt for Auto-Renewal`** | "allows a message to be presented when a membership product is being purchased and allows the customer to decide whether the membership should automatically renew prior to the expiration date. **Automatically Renew is selected by default.**" **⚑ A paid membership that auto-renews by default is a negative-option feature subject to ROSCA and California's automatic renewal law (Bus. & Prof. Code §17600 et seq.) — affirmative consent, clear disclosure, and easy cancellation are required. STORIS's default is the non-compliant one.** |
| Check Order's Written Date if Customer is not a Member When Completing Order | checkbox | **"If a customer's membership has expired, but the order was written when the membership was active, they can earn reward points and protection plan benefits. If active, the benefits are automatically added."** |
| Number of Days that a Membership Product Can Be Added to a Return | numeric **0–999**, optional | **"If you do not want to allow customers to be able to return a membership product, set this field to zero (0)."** "determine the amount of days permitted for the return based off the **`Initial Membership Date` in `Advanced Customer Settings`**." Blank = no restriction. |
| Number of Days New Memberships Can Be Sold Before Renewal Date | **null or 1–99** | "for a customer that already has an active membership, only allow this addition if the current date is within this number of days before the existing plan's renewal date." Null = no restriction. |
| **Not Available to these Customer Price Categories** | code list, **max 10 alphanumeric characters** | **⚑ Direct hit on the brief's price-category theme: "Use this setting to ensure that memberships are sold to the correct type of customer. Leave this field blank to sell membership products to any customer type. This field accepts a maximum of 10 alphanumeric characters; allowing restrictions of multiple customer types."** **This confirms `Customer Price Category` is used as a general customer-class gate, not only as a pricing input** — it drives eligibility for membership programs as well as steps 3 and 4 of the selling-price resolver (`ITEM-040`/`ITEM-041`) and the price matrix (`ITEM-042`) in the Inventory pack. **The assignment/defaulting of the price category itself is on the customer master (Advanced Customer Settings), outside positions 47–92 — it must be captured in another part.** |
| Prompt User For Completion of a Take With Membership Product | checkbox, **unchecked by default** | "allow a take with fulfillment to not be completed when an order is saved and the user has indicated that the item should not be completed at this time… **provides the customer with more time to confirm that they want to purchase the membership.**" |

**Fields — Reward Points**

| Field | Type | Purpose / business rule |
|---|---|---|
| Reward Points are Calculated at ___% for Customers | percent, **0–999.99%** | **Base is verbatim: "the merchandise total (merchandise subtotal minus subtotal discounts)".** Worked examples verbatim: **"If there is a one to one relationship … then 100% should be entered here. If a completed sale totaled $295.00, then 295 reward points will be earned. If 1.0% is earned for sales, that same $295.00 sale would calculate 2.95 earned reward points. Reward points will ROUND UP to the nearest whole number. The 2.95 points earned would round up to 3."** |
| Reward Points for Revolving Sales are Calculated at ___% for Customers | percent, **.01%–999.99%**, optional | **Verbatim: "If a sale earns 1% in reward points and financed sales earn 2.5%, this entry should contain 2.5%. The percentage assigned in the `Reward Points are Calculated at ___%` entry are IGNORED for fully financed sales. When sales are paid with multiple forms of payment, ONLY THE FINANCED PORTION will earn the higher reward points (2.5%). The remaining payment amount will earn 1%."** Applies specifically to a **STORIS Advanced Receivables revolving plan**. **⚑ Paying a higher reward rate for choosing credit is an inducement to finance; worth a compliance/UDAAP look.** |
| Accumulated Points are Valid for ___ Days | numeric, **max 4 digits, required, no negatives** | "the number of days, **from the date of invoicing**, the points will remain on a customer's account and be available for a gift certificate." |
| Purge Reward Points if Membership is No Longer Active | checkbox, **unchecked by default** | **Purges points "during End of Month processing or during the scheduled process, `Purge Customer Reward Points`, when the customer has the membership `Cancellation Date` set in `Advanced Customer Settings` and that the date specified is less than the End of Month purge date."** |
| Purge Grace Days | numeric **1–99**, optional | Extra time for an inactive member to use points before the End of Month purge. |

**Cross-field warning, verbatim:** "**NOTE: When gift certificates are automatically created and the `Create Reward Gift Certificates __ Months` value is LESS than the `Accumulated Points are Valid for ___ Days` value, a warning message displays since points may be purged before certificates are created.**" (**Note the comparison is months vs days — the warning as documented compares incompatible units; the intended check is presumably months×~30 > days. Flag as a probable doc or product bug.**)

**Fields — Reward Gift Certificates**

| Field | Type | Purpose / business rule |
|---|---|---|
| Gift Certificates can be Issued for ___% of the Accumulated Points | percent, **max 999.99%** | Worked example verbatim: **"If 50 is entered here, and a given customer has accumulated 500 reward points, when you specify that customer in the `Issue Customer Rewards` routine, 250 appears at the `Maximum Gift Certificate Allowed` field (that is, 50 percent of 500, and the settings restrict you from generating a gift certificate of no more than 250 dollars for that customer, regardless of the amount displayed at the `Number of Reward Points Earned` field)."** (**Points map 1:1 to dollars at issue.**) |
| Gift Certificates are Valid for ___ Days | numeric **0–9999**, **mandatory** | Validity of reward-earned certificates. |
| Gift Certificates Issued for Refunds are Valid for ___ Days | numeric **0–9999**, **mandatory** | **"only used when merchandise from the original order was paid for with a gift certificate that was earned with rewards points. If the original rewards gift certificate is not on file, a new one is issued with the expiration date based on the number of days defined here."** |
| Automatically Create Reward Gift Certificates | checkbox, **unchecked by default** | Works with the next field. |
| Create Reward Gift Certificates ___ Months | numeric **1–99** | Generation frequency in months. **"required when working in conjunction with `Automatically Create Reward Gift Certificates`. Otherwise, it should be left blank."** |
| Minimum Reward Amount | numeric, **5 characters incl. decimal point (e.g. $99.99)** | **"When creating a reward gift certificate, if the available reward points are greater than zero but LESS than the amount specified, the certificate will be created with the DOLLAR AMOUNT ASSIGNED HERE."** (i.e. it **rounds the customer up** to the minimum.) Blank = create for the calculated amount. |
| Number of Days Before Points Can Be Converted to a Gift Certificate | numeric **1–99**, optional | **"any reward points earned within the window of the current date and this number of days prior are EXCLUDED when issuing a new rewards gift certificate."** (A clawback/return-window buffer.) |
| Number of Days Before Reward Gift Certificate Can be Used | numeric **1–99**, optional | "the number of days defined here will be added to the creation date of the gift certificate to determine a start date… If the entry is null, the gift certificate can be used immediately." |
| Must be Redeemed By Customer Who Was Issued the Gift Certificate | checkbox | **"The `Customer Number` assigned in `Enter a Sales Order` must match the customer number assigned to the reward gift certificate. If the two codes do not match, the gift certificate cannot be used on the order."** Override permission, verbatim: **`Override the Restriction to Limit Use of Rewards Gift Certificates to Issuing Customer` in `Create a User/Group Actions - Sales Security`.** |
| Must be an Active Member to Redeem Reward Gift Certificate | checkbox, **unchecked by default** | "only allow customers with a current active membership to redeem the reward gift certificates, assuming the certificate has not expired." |
| Reward Gift Certificates Can Be Used To Pay For | **7 checkboxes, all enabled by default** | Verbatim list: **(1) "Products that have the `Product Type` assigned to `Non-Inventory` in `Advanced Product Settings`. (This would include membership programs, warranties, etc.)"; (2) Delivery Charges; (3) Installation Charges; (4) Miscellaneous Fees; (5) Protection Plans; (6) Sales Tax; (7) Service Orders.** **"This is strictly related to reward gift certificates (type `GCRWD`); regular purchased gift certificates have no restrictions."** |

**Fields — Protection Plans**

| Field | Type | Purpose / business rule |
|---|---|---|
| Benefit Applies to Business Customers | checkbox | **"This setting only applies to accounts that have the `Business` field enabled in `Advanced Customer Settings`."** (Confirms a `Business` flag on the customer master — a customer-type field, captured in another part.) |
| Extend/Enhance Protection Plans — Period Type | enum | **"The period type selected MUST MATCH the `Period Type` assigned in `Warranty Settings`."** |
| Periods | numeric **1–99**, optional | "used when any form of payment, **other than** a STORIS Advanced Receivables revolving plan is applied." |
| Periods When Paid With Revolving Plan | numeric **1–99**, optional | "allows periods to be defined on orders that are paid with a STORIS Extended Receivable payment plan. If Extended Receivable plans are not used, leave this field blank." (**Again a richer benefit for financing.**) |
| Minimum Finance Amount | numeric, **max 2 decimal places**, optional | **"orders with financing that meets or exceeds this minimum amount qualify for additional time for an extended or enhanced protection plan. If this minimum finance amount has been met, then the amount of time indicated in the `Periods` entry is added to the terms defined in the `Warranty Settings`."** |

**Behavior & rules — cross-cutting.**
- **Hard rule — delete lock: "A settings record can only be deleted when there has been no activity for the membership product in open orders, shopping carts, or completed orders."**
- **⚑ Hard rule — this screen can completely override the general rewards configuration, verbatim: "If `Rewards Points Accumulated Only With Purchased Membership` in `Customer Rewards Control Settings` is enabled, ALL settings in `Customer Rewards Control Settings` are IGNORED and `Membership Rewards Settings` is reviewed. If `Membership Rewards Settings` is not populated, THE CUSTOMER WILL NOT ACCRUE POINTS."** — **a single checkbox elsewhere can silently stop all point accrual.**

**Dependencies.** Advanced Product Settings (membership item designation, `Product Type = Non-Inventory`); **Advanced Customer Settings** (`Initial Membership Date`, `Cancellation Date`, `Business`, **`Customer Price Category`**); Customer Rewards Control Settings (`Rewards Points Accumulated Only With Purchased Membership`); Warranty Settings (`Period Type`); Protection Plan Settings; `CUST-067` Gift Certificate Payment Settings (certificate type **`GCRWD`**); `CUST-063` (`Gift Certificate Rewards` GL account); Issue Customer Rewards; End of Month processing; Purge Customer Reward Points; Sales Security permission `Override the Restriction to Limit Use of Rewards Gift Certificates to Issuing Customer`; Inventory pack `ITEM-040`/`ITEM-041`/`ITEM-042` (price category).

**Build notes.**
- **Points must be a ledger, not a balance.** `reward_point_event(customer, order, points, earned_at, expires_at, source, reversed_by?)`. STORIS's design — a balance plus a purge job — makes it impossible to answer "why did my points disappear", and the purge runs at End of Month against a `Cancellation Date` on the customer master.
- **Never silently round the customer up or down without a record.** `Minimum Reward Amount` (round up) and the "round up to nearest whole number" point rule are both fine, but must be shown on the certificate/statement.
- **Auto-renew must default to OFF and require affirmative, logged consent** with a stored disclosure version. Do not inherit STORIS's `Automatically Renew` default. Cancellation must be self-service.
- Reward certificates: reuse the `CUST-067` gift-certificate ledger with `origin = REWARD`, `redeemable_scope`, `not_before_date`, `bound_customer_id`, and an **allowed-charge-type set** (the 7 checkboxes). Note the same **CA gift-certificate cash-back** question as `CUST-067` applies here.
- `[DECISION NEEDED]` — **paying a materially higher reward rate and longer warranty for financed sales is an inducement to take credit.** Confirm with counsel before implementing the revolving-rate differential and `Minimum Finance Amount` warranty extension.
- `[DECISION NEEDED]` — is `Customer Price Category` the right lever for membership eligibility, or should eligibility be its own customer attribute? Overloading price category with eligibility semantics is what makes STORIS's customer classification hard to reason about, and it entangles the pricing resolver (`ITEM-040`–`ITEM-042`) with unrelated business rules.
- `[DECISION NEEDED]` — resolve the `Create Reward Gift Certificates __ Months` vs `Accumulated Points are Valid for ___ Days` unit mismatch; pick one unit (days) for both.

---

### `CUST-088` Merchandise of Interest Settings
*storis_ref: article 15242630656404*

**Purpose.** Code table for **"Merchandise of Interest"** — what merchandise a sales lead/contact is currently interested in.

**Where it lives.** System Administration > System Settings > Customer System Settings > Sales Lead System Settings > **Interested In Settings**. (**Note the screen title and menu label differ: the article is "Merchandise of Interest Settings", the menu says "Interested In Settings".**)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Merchandise Interest Code | code, **up to 6 characters** | "represent the merchandise or groups of merchandise in which the contact is interested". |
| Description | text | Description of the code. |

**Behavior & rules.**
- Used in two places: **the `Merchandise of Interest` field of the `Enter a Sales Lead` screen**, and **the `Merchandise Interest` field of the product `Group Settings`** — "for lead tracking within product groups." (**The same code table is attached to both a person and a product group, which is how leads are matched to merchandise.**)
- Thin article — no validation, defaults, or delete rules published.

**Dependencies.** Enter a Sales Lead; product **Group Settings** (`Merchandise Interest` field); `CUST-086` Marketing Code Settings (both are lead-capture attributes); customer/lead master.

**Build notes.** `merchandise_interest(code ≤6, description)` linked many-to-many to `product_group`. **Privacy note:** merchandise interest is behavioral profiling data attached to a named individual and should be covered by the same retention/erasure rules as other customer PII — the wave-1 erasure routine (overwrite name and billing address 1 with `"REMOVED"`, retain city/state/ZIP) would leave interest codes intact and linkable. Our erasure must enumerate every child table, including this one.

---
### `CUST-089` Method of Contact Settings
*storis_ref: article 15242630882324*

**Purpose.** Code table identifying **the method through which a prospect was reached and a lead generated**.

**Where it lives.** System Administration > System Settings > Customer System Settings > Sales Lead System Settings > Method of Contact Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Method of Contact | code, **up to 6 characters** | The contact method. Delivered examples verbatim: **`TR` - Telephone Retail; `NEWS` - Newspaper Ad; `TV` - Television Ad.** |
| Description | text, **up to 30 characters** | Description of the contact method. |

**Behavior & rules.**
- "You enter these codes into the **`Method of Contact`** fields in STORIS, for example the **`Enter a Sales Lead`** screen."
- Thin article — no validation, defaults, or delete rules published.
- **⚑ Critical distinction for the brief's TCPA theme — do not mistake this for consent.** Despite the promising name, **`Method of Contact` is a historical attribution code (how the lead arrived), not a contactability preference and not a consent record.** It has **no channel semantics, no opt-in/opt-out state, no timestamp, no capture source, and no per-channel granularity.** It overlaps heavily with `CUST-086` Marketing Code Settings (`NEWS` appears as an example value in both screens, with the same meaning) — **two separate 6-to-N-character code tables recording essentially the same fact.**
- **Nothing in positions 47–92 captures phone/email/SMS contactability, do-not-contact, or solicitation preferences.** Those fields are on the customer master and the solicitation screens, which fall in parts A and C of this section. **Flagging here so the gap is visible in the coverage matrix rather than assumed covered.**

**Dependencies.** Enter a Sales Lead (`Method of Contact` field); lead/customer master; `CUST-086` Marketing Code Settings (near-duplicate concept); `CUST-088` Merchandise of Interest Settings.

**Build notes.** **Collapse `Method of Contact` and `Marketing Code` into one `attribution_source` taxonomy** with a channel dimension (`PHONE_INBOUND`, `PHONE_OUTBOUND`, `WALK_IN`, `WEB`, `EMAIL`, `SMS`, `PRINT`, `BROADCAST`, `REFERRAL`, …) plus a campaign reference. Two parallel code tables with overlapping values guarantee inconsistent reporting.
**Consent is a separate, append-only structure and must not be modeled as a code on the customer record:**
`consent_event(customer_id, channel ∈ {VOICE, SMS, EMAIL, MAIL}, action ∈ {GRANT, REVOKE}, scope ∈ {TRANSACTIONAL, MARKETING, AUTODIALED_MARKETING}, occurred_at, captured_by_user, capture_method ∈ {WEB_FORM, IN_STORE_SIGNATURE, PHONE_RECORDING, IMPORT}, disclosure_version, evidence_artifact_id, ip_address?, device?)`.
**`[DECISION NEEDED]` — TCPA exposure: express written consent for autodialed/prerecorded marketing calls and texts requires a retained, timestamped, source-attributed record tied to a specific disclosure. STORIS provides no such capture trail anywhere in this section, and the wave-1 findings make it worse: PII masking applies only on re-access, and the erasure routine overwrites only name and billing address 1 (leaving city/state/ZIP), so a revoked/erased contact remains partially identifiable. LA Mattress needs an explicit consent-capture design decision and legal review before any outbound calling or SMS is built.**

---

### `CUST-090` Metro 2 Code Settings
*storis_ref: article 15242594991892*

**Purpose.** Associates **Metro 2 credit-reporting codes** with a customer or a specific installment contract. **"STORIS uses the Metro 2 format in the Credit Reporting Process."**

**Where it lives.** Two paths — and **which one you use changes what the screen means**:
- **Advanced Customer Settings > `Receivables` page > `Actions` button > Metro 2 Settings** → operates on the **customer** (revolving).
- **Receivables > Installment Receivables > Manage and Adjust Installment Contracts > `Review Contract Details` button > `Actions` button > Metro 2 Settings** → operates on the **contract** (installment).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Account Status | Metro 2 code | **"The list includes ONLY account statuses for which the `Manual Assignment` field is enabled in the `Account Status Settings`."** Description displays beside the field. |
| Payment Rating | enum, conditionally active/mandatory | **Used by the Metro 2 credit reporting process for Equifax Canada** "to determine the rating of the account based on the `Account Status`. It is used when reporting both Revolving Receivable and Installment Receivables account information." **Activation rules, verbatim:** *Not active if* — "The Metro 2 Format is set to **United States** in your `Accounts Receivable Control Settings`" **or** "The report format is Canadian and the `Account Status` is not set to **'05'** (Account transferred to another office) or **'13'** (Paid or closed account / zero balance)." *Active if* — "The Metro 2 Format is set to **Canada**" **and** "The Account Status is set to **'05'** or **'13'**." **"When active, a selection at this field is mandatory."** **Values verbatim, "based on definitions in the Metro 2 Reporting Guide for Canadian reporting": `G - Collection`, `H - Foreclosure Completed`, `J - Voluntary Surrender`, `K - Repossession`, `L - Charge Off`, `Y - Financial Counseling`.** |
| Special Comment | Metro 2 code | **Context-sensitive lookup, verbatim: "special comments applicable to REVOLVING receivables are displayed if you accessed this screen from `Advanced Customer Settings`. If you accessed this screen from the `Review Contract Details` screen, the special comments listed are applicable to INSTALLMENT receivables."** |
| Compliance Condition | Metro 2 code | **⚑ Hard rule, verbatim: "NOTE: This is a 'sticky' field. That is, once you report a compliance condition code for a customer, it 'sticks' to the customer UNTIL YOU SEND A DIFFERENT CODE (or a removal code) to your credit bureau."** |
| Updated Date | date, display-only | "The date on which you last set the customer's compliance condition code." |
| Reported Date | date, display-only | "The date on which you last reported the customer's compliance condition code to the credit bureau." **Hard rule: "the credit reporting process includes the customer's compliance code in the credit reporting file ONLY IF the `Updated Date` is GREATER THAN OR EQUAL TO the `Reported Date`."** |
| Closed Date | date, display-only | Customer's account close date (from Advanced Customer Settings) **or** the contract's close date (from Review Contract Details), depending on entry path. |

**Behavior & rules — the hard ones.**
- **⚑ This screen writes directly to a consumer's credit file.** Metro 2 `Compliance Condition` codes cover things like *"account information disputed by consumer"* and bankruptcy indicators; an incorrect or stale value has real consumer harm and **FCRA §623 (furnisher accuracy) liability**. The **sticky** behavior means an erroneous code persists indefinitely until someone remembers to send a removal code.
- The **`Updated Date >= Reported Date`** gate means **a code that is set and then re-set to the same value may not be re-transmitted** — and, more dangerously, **a removal that fails to advance `Updated Date` will never be reported.**
- Manual assignment is deliberately restricted: only statuses flagged `Manual Assignment` in **Account Status Settings** can be chosen here.
- The same screen serves customer-level (revolving) and contract-level (installment) reporting, with silently different code lists.
- **The full Metro 2 code lists are not published in the article** (only the Canadian Payment Rating values). They must be sourced from the **Metro 2 Reporting Guide** / CDIA.

**Dependencies.** **Advanced Customer Settings** (Receivables page — customer master, another part); Manage and Adjust Installment Contracts / Review Contract Details; Account Status Settings (`Manual Assignment`); Accounts Receivable Control Settings (**Metro 2 Format: `United States` / `Canada`**); Credit Reporting Process; Customer Legal Settings (related article); `CUST-079` installment contracts; `CUST-078` (credit score); credit bureau interface.

**Build notes.**
- **This must be an append-only, fully audited furnisher log**, not four editable fields on a settings screen: `credit_report_event(subject ∈ {CUSTOMER, CONTRACT}, subject_id, metro2_field, code, set_by, set_at, reported_at?, batch_id, superseded_by?)`. Every value ever sent to a bureau must be reconstructable — this is the single strongest `RPT-AUDIT` requirement found in this part, and STORIS's lack of a general change log makes its version indefensible.
- Replace the fragile `Updated Date >= Reported Date` gate with an explicit per-code **`pending_transmission`** state and a reconciliation report of codes set but never reported.
- **Build a dispute workflow.** FCRA requires investigating consumer disputes and marking accounts as disputed; a single "sticky" free-standing code with no dispute case behind it will not satisfy that.
- `[DECISION NEEDED]` — **is LA Mattress furnishing data to credit bureaus at all?** If yes, this is a compliance program (furnisher policies and procedures under FCRA §623 / Reg V, dispute handling, accuracy testing), not a settings screen. If no, `CUST-090` is out of scope and the `Credit Reporting Process` should not be ported.
- `[DECISION NEEDED]` — US-only or US+Canada? The whole `Payment Rating` field and its six-value enum exists solely for Equifax Canada.

---

### `CUST-091` Minimum Deposit Percentage Table
*storis_ref: article 15242390955284*

**Purpose.** A **credit-score-tiered minimum deposit table** for revolving payment plans: the worse the score, the larger the required down payment.

**Where it lives.** Revolving Payment Plan Settings > **Restrictions** tab > **Action** button at the **Minimum Deposit Percentage** field.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Credit Score | numeric | "the **starting** credit score for the level being defined." |
| Percentage Rate | numeric, **min 0.00%, max 99.99%**, entered without the percent sign | The deposit percentage for that score band. |
| Grid | columns **Credit Score**, **Percentage Rate** | The table. |

**Behavior & rules.**
- **Score selection rule, verbatim: "The customer or co-applicant's credit score (WHICHEVER IS HIGHER) is compared to the table."** (**The better of the two applicants' scores wins — favourable to the customer, and worth noting because it is the opposite of the conservative assumption.**)
- **Base, verbatim: "This percentage is multiplied by the `Net Total` on the `Payments` tab of the order entry process to determine the minimum deposit required."** (`Net Total` per `CUST-056` = "merchandise subtotal plus delivery, installation, taxes, and fees".)
- **Hard rule — failure blocks the plan outright: "If the minimum deposit has not been met based on the percentage required, THE PLAN IS NOT AVAILABLE TO BE USED."**
- **Hard rule — the flat minimum and the percentage table compose as a MAX, verbatim: "If a minimum deposit amount was entered for the plan and this table is also being used, the minimum deposit required is based on both settings and THE HIGHER OF THE TWO deposit amounts is the required amount."**
- **Worked examples, verbatim.** Plan `Minimum Deposit Amount` = **$25.00**; table:

  | Credit Score | Percentage |
  |---|---|
  | 0 | 50% |
  | 300 | 30% |
  | 650 | 10% |

  - **Customer #1** — Net Total **$667.00**, Credit Score **535** → **Minimum Deposit Required $200.10**. "The calculated deposit ($667.00 x 30% = $200.10), based on the customer's credit score, exceeds the minimum deposit amount defined. Therefore, the calculated deposit is required."
  - **Customer #2** — Net Total **$238.00**, Credit Score **652** → **Minimum Deposit Required $25.00**. "The calculated deposit ($238 x 10% = $23.80) … is less than the minimum deposit amount defined. Therefore, the minimum deposit of $25.00 is required."
- Lookup is a step function: score **535** falls in the `300` band (≥300, <650) → 30%.

**Dependencies.** Revolving Payment Plan Settings (`Restrictions` tab, `Minimum Deposit Amount`, `Minimum Deposit Percentage`); order entry `Net Total` (Payments tab); customer and co-applicant credit scores; `CUST-078` (installment analogue of score gating); `CUST-081` Interest Rate Table; `CUST-090` (credit reporting).

**Build notes.** `min_deposit_tier(plan_id, min_credit_score, pct)` + `plan.min_deposit_amount`, resolved as `required = max(plan.min_deposit_amount, net_total * tier(pct))`, tier by `max(applicant_score, coapplicant_score)`. Build the two worked examples above as golden tests. **Effective-date the table** and snapshot the resolved requirement onto the order.
**⚑ Compliance flag:** deposit requirements set by credit score are underwriting terms. They must be documented, uniformly applied, and — where a customer is denied a plan or given worse terms because of a score — capable of producing an **adverse action notice** with the score, the score range, and the bureau. Log every evaluation: `(applicant scores, tier selected, pct, net total, required deposit, actual deposit, outcome)`.
`[DECISION NEEDED]` — same as `CUST-078`: source, freshness, storage and permissible use of the credit score, plus whether co-applicant scores may be used this way. Also confirm the "higher of the two scores" rule is what LA Mattress wants — it is generous, and it is a policy choice, not a technical detail.

---

### `CUST-092` Minimum Finance Charge Table
*storis_ref: article 15242406895636*

**Purpose.** A per-**jurisdiction** table of **minimum finance charge** amounts by financed amount — the floor on interest charged when finance charges are assessed.

**Where it lives.** **Sales Tax Settings > Action button at the `Minimum Finance Charge Table` field.** (Same surprising home as `CUST-081` Interest Rate Table — the regulated consumer-credit tables live inside Sales Tax Settings, keyed by jurisdiction.)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Financed Amount | currency | The tier floor. **Lookup rule verbatim: "If the amount being financed is EQUAL TO OR GREATER THAN this amount, but LESS THAN the next higher amount in the table, the corresponding minimum charge is applied when finance charges are assessed in this jurisdiction."** |
| Minimum Charge | currency | "the minimum amount that can be charged in this jurisdiction when finance charges are assessed on the corresponding finance amount." |
| Delete | button | "click the Delete button and then click **Yes** when prompted to confirm deletion." |

**Behavior & rules.**
- Table "is built in **ascending financed amount order**".
- The routine is **optional**.
- Step-function lookup, half-open interval `[tier, next_tier)` — stated explicitly, unlike `CUST-053` and `CUST-081` where it must be inferred from examples.
- **⚑ A minimum finance charge is, in effect, a floor that raises the effective APR on small balances — sometimes dramatically. It is capped or prohibited in some jurisdictions and interacts with `CUST-081`'s `Baseline APR` / `is Capped` logic. The two tables together determine what a customer actually pays and are configured in two different Action buttons on the same Sales Tax Settings screen with no cross-validation documented.**

**Dependencies.** Sales Tax Settings (parent, per jurisdiction); `CUST-081` Interest Rate Table (sibling; same parent field group); `CUST-079` Installment Payment Plan Settings; `CUST-053` Finance Level/MMP Table; Cycle Processing (finance charge assessment); `CUST-063` (`Service Charges` income account).

**Build notes.** `min_finance_charge_tier(jurisdiction, effective_from, min_financed_amount, min_charge)`, resolved as a half-open step lookup. **Effective-date it** and snapshot onto the contract at origination. **Cross-validate against the jurisdiction's rate cap:** compute the effective APR implied by `min_charge` on the smallest balance in the tier and refuse or warn if it exceeds the cap in `CUST-081`. Log the applied minimum on every finance-charge assessment so a customer statement can explain it.
`[DECISION NEEDED]` — whether to apply minimum finance charges at all. It is a small revenue line with disproportionate customer-complaint and regulatory risk on low balances; if LA Mattress does want it, counsel must confirm the permitted amounts per state.

---
## Coverage confirmation

All **46** assigned articles (positions 47–92, `CUST-047` … `CUST-092`) were read in full and written up. No article was skipped or sampled.

**Articles that are stubs or partial in the source** (entries still written, per the brief):
- `CUST-051` Extended Receivables Insurance Code Settings — field names only, empty description accordions, body duplicated on the page.
- `CUST-059` Financing Payment Plan Settings — field names only, empty accordions, body duplicated; `Administrative Fee Product` appears in one copy of the list and not the other.
- `CUST-060` Fiscal Calendar Settings — field names only for the period grid; narrative rules present.
- `CUST-070` GL Account Settings, `CUST-063`, `CUST-054` — full narrative present but the page renders the body twice.
- `CUST-088` Merchandise of Interest Settings, `CUST-089` Method of Contact Settings, `CUST-077` Hold Code Settings, `CUST-073` GL Source Settings — genuinely short articles (2 fields each); no validation or delete rules published.

**Values referenced but not published anywhere in the source** (must be captured from a live STORIS instance or the vendor before build):
- `CUST-051` — `Classification`, `Type`, `Insurance Fee Calculation`, `Rebate Method` enum values (only `Accident & Health` and `Life` leak through `CUST-080`).
- `CUST-056` — the "five fields" that trigger the deposit-financing lockout; only three are named.
- `CUST-059` — `Classification` values; all field validations.
- `CUST-073` — the complete GL source code list.
- `CUST-075` — the sub-account mask format.
- `CUST-090` — the Metro 2 `Account Status`, `Special Comment` and `Compliance Condition` code lists (only the six Canadian `Payment Rating` values are published).
- `CUST-063` — which **three** gift-certificate accounts the multi-company wild-card rule applies to (four candidates exist).

**No page content in positions 47–92 addressed the reader as an agent or attempted to issue instructions.** The only non-article text encountered was a maintainer comment on `CUST-057` (*Stephanie Brown, February 06, 2024 — "Updated as of 2/6/2024."*), which is ordinary editorial metadata.

---

## Cross-references into other parts

| Topic the brief asked for | Where it actually lives | Note |
|---|---|---|
| **Customer price category** — assignment and defaulting | **Advanced Customer Settings** (part A/C of this section) | Confirmed by `CUST-087` (`Not Available to these Customer Price Categories`, max 10 alphanumeric chars, multi-value). Feeds `ITEM-040`/`ITEM-041` steps 3–4 and the price matrix `ITEM-042`. **Capture the assignment rules there.** |
| **Customer store assignment / cost-center attribution** | **Advanced Customer Settings > Point of Sale tab > `Store Assignment`** | Rule itself is documented in `CUST-063` and quoted there in full. |
| **AR behavior on the customer** (statement cycling, finance charges, credit limits, holds, aging) | Accounts Receivable Control Settings; Revolving/Installment Receivables Control Settings; **Credit Hold Codes List (AR)** | Part B holds the *rate/fee tables* (`CUST-053`, `CUST-081`, `CUST-091`, `CUST-092`) and the *GL landing accounts* (`CUST-063` AR tab), but not the cycling or aging rules. |
| **AR credit hold codes (F3 / F4)** | **Credit Hold Codes List (AR)** — a separate article, not in 47–92 | `CUST-077` is the **AP vendor** hold code screen and explicitly disclaims both AR credit holds and PO holds. |
| **Contact / consent / solicitation preferences (TCPA)** | Customer master + solicitation screens (parts A/C) | **Nothing in 47–92 records consent.** `CUST-089` Method of Contact and `CUST-086` Marketing Code are attribution, not permission. See the consent-model note under `CUST-089`. |
| **Tax exemption certificates, expiry, jurisdiction scoping** | Sales Tax Settings / customer master (parts A/C) | Nearest analogue in 47–92 is `CUST-080`'s per-jurisdiction insurance acceptance form, which has **no expiry and no certificate artifact**. `CUST-084` shows how jurisdictions are attached to ZIP ranges. |
| **Delivery-relevant customer attributes** (access notes, restrictions, zones) | Customer master / Delivery settings (parts A/C) | Not present in 47–92. `CUST-087` touches delivery only as a chargeable item type. |
| **Customer demographic answers overwritten per customer** (wave 1) | Customer master | Directly contrasted by `CUST-086`, which **does** preserve initial vs adjusted marketing attribution. **Ask why demographics were not given the same treatment.** |
| **Erasure routine writes `"REMOVED"` to name + billing address 1, retains city/state/ZIP** (wave 1) | Purge/erasure routines | Affects `CUST-068` gift registries, `CUST-088` merchandise interest, `CUST-087` reward ledgers and `CUST-090` credit-reporting records — all re-identifying. **Our erasure must enumerate every child table.** |
| Global **Extended Security** kill-switch | General System Control Settings | Gates `CUST-048`, `CUST-049`, `CUST-066`, `CUST-086` (`Change Marketing Code`), `CUST-056`, `CUST-079`, `CUST-087`. Reuse the existing permission IDs from `parts/user-security-CATALOG.md`; do not mint new ones. |
| Resolver scopes | Wave-1 list (`COMPANY`, `VENDOR_REMIT_TO`, `VENDOR_REGION`, `TERMS_CODE`, `PRODUCT_CATEGORY`) | Part B needs two more: **`DISTRICT`** and **`TAX_JURISDICTION`** (`CUST-052`, `CUST-078`, `CUST-080`, `CUST-081`, `CUST-084`, `CUST-092`). |

---

## `[DECISION NEEDED]` — collected

**Scope / "are we even in this business"**

1. **`CUST-051`, `CUST-065`, `CUST-080`** — Is LA Mattress selling **credit insurance** (credit life / accident & health / property) at all? If not, this entire family is out of scope. If yes, licensing and state rate-cap review are required before build.
2. **`CUST-053`, `CUST-062`, `CUST-079`, `CUST-081`, `CUST-091`, `CUST-092`** — Is LA Mattress originating **house revolving and/or installment credit**? STORIS ships provider `7 = House` for revolving. If yes, state lending licences, Reg Z disclosures, amortization engine and credit reporting all become work packages rather than settings screens.
3. **`CUST-090`** — Are we **furnishing data to credit bureaus**? If yes, an FCRA §623 furnisher compliance program (policies, dispute handling, accuracy testing) is in scope. If no, drop the Credit Reporting Process entirely.
4. **`CUST-090`** — US-only, or US + Canada? The whole `Payment Rating` field and its six-value enum exists solely for Equifax Canada.
5. **`CUST-063`** — Is LA Mattress genuinely **multi-company**, or one company with many locations? Almost every wild-card warning in the GL settings only matters in the former case.
6. **`CUST-049`** — Do we want **ad-hoc report building against raw tables** at all, or only against curated pre-permissioned views? The curated-view model deletes this entire class of setting.
7. **`CUST-075`, `CUST-064`** — Do we need **GL sub-accounts** and free-standing **cost centers** as dimensions, or is `account` + `location` sufficient? Cheap to include now, expensive to retrofit.

**Compliance / legal review required before implementation**

8. **`CUST-089` (TCPA — highest priority).** Express written consent for autodialed/prerecorded marketing calls and SMS requires a retained, timestamped, source-attributed record tied to a specific disclosure version. **STORIS captures none of this**, and the wave-1 findings (masking only on re-access; erasure leaves city/state/ZIP) make partial re-identification of "erased" contacts possible. Design and legal sign-off needed before any outbound calling/SMS capability is built.
9. **`CUST-087` — auto-renewing memberships.** STORIS defaults `Auto - Renewal` to **`Automatically Renew`**. Negative-option billing is governed by ROSCA and CA Bus. & Prof. Code §17600 et seq. Our default must be OFF with affirmative logged consent and easy cancellation.
10. **`CUST-067`, `CUST-087` — gift certificates that "can never be refunded."** Review against CA Civil Code §1749.5 (cash-back on small balances) and the federal CARD Act expiration rules before replicating.
11. **`CUST-079` — deferred interest.** Unchecking `INSURANCE PREMIUM - Use ONLY remaining term after "No Interest for Months"` retroactively charges interest for the promotional period. Heavily scrutinized by the CFPB; needs an explicit product flag, mandatory disclosure copy and a legal gate.
12. **`CUST-079` — interest on insurance premiums.** `INSURANCE PREMIUM - Include Interest` **defaults to checked**. A deliberate policy decision, not an inherited default.
13. **`CUST-081` — `Baseline APR` with `is Capped` unchecked charges the customer the HIGHER of baseline and tier rate.** Confirm per-state usury caps and required calculation methods; the shipped default is not safe.
14. **`CUST-092`** — Do we apply **minimum finance charges** at all? Small revenue, outsized complaint and regulatory risk on low balances.
15. **`CUST-052`, `CUST-078`, `CUST-091`** — **Credit score usage.** Where does the score come from, how fresh must it be, may we store it (FCRA), may co-applicant scores be used, and are **adverse action notices** required when a score threshold denies a plan or raises a deposit? Also confirm the `CUST-091` "higher of applicant/co-applicant score" rule is intended policy.
16. **`CUST-052` — percentage-based routing of credit applications across lenders** is effectively a random split of a consumer credit decision. Fair-lending / ECOA review required, plus full logging of every routing decision.
17. **`CUST-052` — auto-submit of credit applications.** STORIS defaults it OFF; keep it OFF and require per-provider consent capture (hard-pull authorization).
18. **`CUST-054` — language preference.** If we collect it, we must serve disclosures in that language. STORIS collects it and explicitly does not translate ("No translation takes place"). Either serve them or do not collect the field.
19. **`CUST-058` — payment quotes.** Estimator UI copy may trigger Reg Z advertising/trigger-term disclosure requirements. Legal review of the copy before ship.
20. **`CUST-087` — richer rewards and longer warranties for financed sales** (`Reward Points for Revolving Sales`, `Periods When Paid With Revolving Plan`, `Minimum Finance Amount`) are inducements to take credit. Confirm with counsel.

**Design decisions**

21. **`CUST-063` — cost-center attribution.** Reproduce STORIS's "customer's assigned store drives cost center and AR balance regardless of where the sale happened", or attribute to the **selling location**? Either way, `Store Assignment` changes must be audited and must never retroactively re-attribute posted transactions.
22. **`CUST-063` — sales posting method.** `Inventory` (product-hierarchy-driven) vs `Transaction Type`; mutually exclusive, and choosing `Transaction Type` permanently forfeits per-category sales accounts. Accounting must choose before go-live.
23. **`CUST-084` — sales tax determination.** Internal ZIP/jurisdiction tables vs. an external tax engine. ZIP ranges are not defensible for California district taxes. This decision also governs how **tax exemption certificates** are scoped.
24. **`CUST-087` — customer price category overloading.** Should membership eligibility (and other non-pricing gates) hang off `Customer Price Category`, or should eligibility be its own attribute? Overloading it entangles the selling-price resolver (`ITEM-040`–`ITEM-042`) with unrelated rules.
25. **`CUST-056`** — the **five fields** that trigger the deposit-financing lockout are not enumerated in the docs. Determine the full list from a live system or from LA Mattress policy before porting the rule.
26. **`CUST-073`** — obtain the **full STORIS GL source-code list** during data migration so historical postings can be mapped to our derived source enum.
27. **`CUST-071`** — two report types (`Balance Sheet`, `Profit & Loss`) is thin. Do we need a richer `statement_mapping` for cash-flow or segment reporting?
28. **`CUST-061`** — retention period for **rendered customer documents** (invoices, finance contracts, insurance acceptance forms). Driven by contract retention requirements, not by print configuration.
29. **`CUST-087`** — resolve the `Create Reward Gift Certificates __ Months` vs `Accumulated Points are Valid for ___ Days` **unit mismatch** in STORIS's own warning; standardize on days.
30. **`CUST-047`** — when the system auto-substitutes a finance plan because a different provider answered, should that require a **re-quote or re-signature** if APR or term differ from what the customer was shown? STORIS does not ask.

---

## Things in this part that should feed `RPT-AUDIT`

Every one of these is a change with financial, credit-file or consumer impact that **STORIS records nowhere**:

- `CUST-047` automatic finance-plan substitution on a live order.
- `CUST-052` finance application routing decisions (tier, provider, random draw, outcome).
- `CUST-053`, `CUST-081`, `CUST-091`, `CUST-092` rate/fee/deposit table edits — each silently re-prices future (and, without snapshotting, potentially existing) contracts.
- `CUST-054` provider credential changes and every transmission.
- `CUST-056`, `CUST-079` supervisor-credential overrides (eligibility override, `Installment - Override Revoke Same as Cash Terms`).
- `CUST-057` settlement-error latch set/clear.
- `CUST-060` fiscal period definition changes.
- `CUST-063` GL default account changes; **`Store Assignment` changes on the customer master**.
- `CUST-066` journal batch hold/release (maker–checker events).
- `CUST-070`, `CUST-064`, `CUST-071`, `CUST-075`, `CUST-076` chart-of-accounts structural changes and deletions.
- `CUST-077` hold placement and release (all three hold namespaces).
- `CUST-086` marketing code changes on existing orders (STORIS partially does this via initial/adjusted reports — extend it).
- `CUST-087` reward point purges, certificate issuance, issuing-customer override.
- `CUST-090` **every Metro 2 code set, changed and transmitted** — the strongest audit requirement in this part.
