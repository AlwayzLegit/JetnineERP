# Customer Settings — Part A (positions 1–46 of 137)

*Source section: STORIS help center, System Administration → **Customer Settings**, section id `15233769370388` (137 articles).*
*This part file covers **enumeration positions 1–46**, IDs `CUST-001`–`CUST-046` (position number == ID number).*
*Parts B and C cover positions 47–91 and 92–137 respectively.*

## Split audit — what positions 1–46 turned out to be

| # | Req ID | Article ID | Title |
|---|---|---|---|
| 1 | CUST-001 | 15242611077268 | Account Status Settings |
| 2 | CUST-002 | 15242629406228 | Activity Reason Settings |
| 3 | CUST-003 | 15242629406612 | Address Exception List Settings |
| 4 | CUST-004 | 15242629407380 | Advanced Customer Settings |
| 5 | CUST-005 | 15242629418772 | Alert Code Settings |
| 6 | CUST-006 | 15242594518164 | Alternate Taxable Merchandise Calculation |
| 7 | CUST-007 | 15242611081620 | Bank Settings |
| 8 | CUST-008 | 15242406194580 | Card Length Format Action |
| 9 | CUST-009 | 15242629411604 | Cash Drawer Settings |
| 10 | CUST-010 | 15242662922644 | Cash Payment Settings |
| 11 | CUST-011 | 15242629407508 | Check Payment Settings |
| 12 | CUST-012 | 15242611077652 | Closing Probability Settings |
| 13 | CUST-013 | 15242611080468 | Collection Letter Settings |
| 14 | CUST-014 | 15242629660820 | Collector Settings |
| 15 | CUST-015 | 15242611359252 | Commission Settings |
| 16 | CUST-016 | 15242594517268 | Commission Settings Lookup |
| 17 | CUST-017 | 15242629664020 | Compliance Condition Settings |
| 18 | CUST-018 | 15242611356692 | Contract Balance Adjustment Settings |
| 19 | CUST-019 | 15242611357204 | Contract Classification Settings |
| 20 | CUST-020 | 15242629662100 | Create Check Run File |
| 21 | CUST-021 | 15242611361684 | Create/Maintain a Daily Discount Schedule |
| 22 | CUST-022 | 15242629662868 | Create/Maintain a Membership Discount Schedule |
| 23 | CUST-023 | 15242611356948 | Credit Application Settings |
| 24 | CUST-024 | 15242611600916 | Credit Bureau Code Settings |
| 25 | CUST-025 | 15242629909908 | Credit Bureau Settings |
| 26 | CUST-026 | 15242662922388 | Credit Card Payment Settings |
| 27 | CUST-027 | 15242594516884 | Credit Cards Already on File |
| 28 | CUST-028 | 15242629911700 | Credit Employment Status Settings |
| 29 | CUST-029 | 15242611595540 | Credit Review Status Code Settings |
| 30 | CUST-030 | 15242629910548 | Credit Score Percentile Settings |
| 31 | CUST-031 | 15242611595284 | Credit Source Settings |
| 32 | CUST-032 | 15242629910036 | Customer Alert Code Settings |
| 33 | CUST-033 | 15242609770004 | Customer Legal Settings |
| 34 | CUST-034 | 15242406190740 | Customer Legal Settings - Read Only |
| 35 | CUST-035 | 16917471620116 | Customer Membership Settings |
| 36 | CUST-036 | 15297959787156 | Customer Prefix Settings |
| 37 | CUST-037 | 15242611603220 | Customer Price Settings |
| 38 | CUST-038 | 15242630128788 | Customer Settings |
| 39 | CUST-039 | 15242630128916 | Customer Type Settings |
| 40 | CUST-040 | 15242406189204 | CVV Prompt |
| 41 | CUST-041 | 34519031274644 | CVV2 Prompt |
| 42 | CUST-042 | 15242390516884 | Debit Card Overview |
| 43 | CUST-043 | 15242630128404 | Debit Card Payment Settings |
| 44 | CUST-044 | 15242610006676 | Desjardins Configuration |
| 45 | CUST-045 | 15242390515860 | Enable VISA Credit Card Rules |
| 46 | CUST-046 | 15242594734612 | Enter Customer's Date of Birth |

*Note: the section is alphabetical, so positions 1–46 run from "Account Status Settings" through "Enter Customer's Date of Birth". A large share of this first third is in fact **payment / credit-processing** configuration that STORIS files under Customer Settings, plus the credit-application and code-table settings that hang off the customer master. The customer master screen itself is `CUST-038` Customer Settings.*

---

### `CUST-001` Account Status Settings
*storis_ref: article 15242611077268*

**Purpose.** Maintains the **Metro 2 account status message codes** sent to the credit bureau via the Credit Reporting Process. The file is pre-loaded with the account status codes defined in **Exhibit 4 of the Consumer Data Industry Association (CDIA) Credit Reporting Resource Guide**.

**Where it lives.** System Administration > System Settings > Customer System Settings (Customer Settings section). To *assign* a status code to a customer, use the **Metro 2 Settings** option on the **Action** button of the **Receivables** tab of Advanced Customer Settings (`CUST-004`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Account Status | Code (Metro 2, fixed) | The CDIA Exhibit 4 account status code. **Read-only key — cannot be added or deleted.** |
| Description | Text | Editable description of the status. |
| Allow Manual Entry | Checkbox | Whether a user may manually assign this status to a customer account. |
| Account Closed | Checkbox | Marks the status as one that represents a closed account. |
| Actions | Button | Action menu for the row. |

**Behavior & rules.**
- **HARD RULE: "You cannot add or delete Metro 2 account status message codes."** The code set is externally governed (CDIA); only `Description`, `Allow Manual Entry` and `Account Closed` are editable.
- `Allow Manual Entry` acts as the gate on whether a human can pick the code, vs. the code only being derivable by the credit-reporting engine.

**Dependencies.** Credit Reporting Process (Metro 2 export); `CUST-004` Advanced Customer Settings → Receivables tab → Action → Metro 2 Settings; related article "Special Comment Settings" (Part B/C).

**Build notes.** Ship this as a **seeded, non-user-extensible reference table** (`metro2_account_status`) with columns `code`, `description`, `allow_manual_entry`, `is_account_closed`. Load the CDIA Exhibit 4 set at migration time; block INSERT/DELETE at the application layer. Description edits should feed `RPT-AUDIT`. `[DECISION NEEDED]` — does LA Mattress actually furnish data to credit bureaus? If we do not do in-house revolving credit, this whole Metro 2 family (`CUST-001`, credit bureau settings `CUST-024`/`CUST-025`, `CUST-030`) is out of scope for v1 and should be a stubbed table only.

---

### `CUST-002` Activity Reason Settings
*storis_ref: article 15242629406228*

**Purpose.** Creates the reason codes used when a **sales lead/contact is moved to Lead History for any reason other than the invoicing of a sale**. Used both by automatic archiving and by manual "move to history" actions.

**Where it lives.** System Administration > System Settings > Customer System Settings > **Sales Lead System Settings** > Activity Reason Settings. Support Files: None.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Lead Reason | Code, **up to 6 characters** | The activity reason code explaining why a sales lead is being moved to history (a reason other than 'invoicing'). |
| Description | Text | Description of the activity reason. |

**Behavior & rules.**
- Codes entered here are the **only acceptable entries** in the `Auto Archive Reason Code` field of **Sales Lead System Control Settings**, which auto-archives leads/contacts **at EOD after a user-specified number of days of inactivity**.
- Lead Reason codes are also the acceptable responses at the **Reason** prompt whenever a Lead/Contact is moved to history manually.
- "Invoiced" is an implicit, non-configurable disposition — this table is explicitly for *non-sale* dispositions.

**Dependencies.** Sales Lead System Control Settings (`Auto Archive Reason Code`, days-of-inactivity threshold); EOD batch; Lead History.

**Build notes.** Simple code table `lead_activity_reason (code varchar(6) pk, description)`. Our lead archive job should record **both** the reason code and whether the archive was automatic or manual — STORIS conflates them. Keep the 6-char limit only for migration fidelity; internally use a surrogate id so codes can be renamed. Archiving must be a **status change with a retained history row**, never a delete.

---

### `CUST-003` Address Exception List Settings
*storis_ref: article 15242629406612*

**Purpose.** Maintains a list of **'throw-away' terms** the system ignores when running the **Customer Ship-To Address Lookup** inquiry — chiefly street-name suffixes (St., Blvd, Way, Lane) that defeat an exact-match search when entered differently from the stored address.

**Where it lives.** System Administration > System Settings > Customer System Settings > **Sales and Service System Settings** > Address Exception List Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (throw-away term) | Text, grid | Existing throw-away terms appear in the grid, as well as any new terms you add. |

**Behavior & rules.**
- Worked example from the source: searching `18 Winding Way` will not find a customer at `18 Winding Lane`; with `Way` and `Lane` in the exception list the lookup ignores those words and returns **all invoices for customers whose address includes "18 Winding"**.
- **HARD RULE / inconsistency: "These settings are ignored when searching for a customer using the Street field in Search for a Customer."** So the same term list applies to Ship-To Address Lookup but **not** to the main customer search — two different matching behaviors on the same data.

**Dependencies.** Customer Ship-To Address Lookup inquiry; Search for a Customer (explicitly *not* using it); ship-to address history (see `CUST-004` addresses).

**Build notes.** Do **not** reproduce this as a hand-maintained stopword table. Implement proper **address normalization once, at write time** (USPS/Google-style standardization producing a canonical form plus the raw as-entered form), and search the canonical form. Then a single matcher serves both the ship-to lookup and customer search, eliminating the STORIS inconsistency. If we must keep a term list, it becomes a normalization alias map (`Way|Wy`, `Lane|Ln`) rather than a discard list — discarding the suffix means `18 Winding Way` and `18 Winding Lane` collide, which is wrong for delivery routing.

---

### `CUST-004` Advanced Customer Settings
*storis_ref: article 15242629407380*

**Purpose.** **The customer master maintenance screen** — the full retail/wholesale customer record. STORIS "strongly advises you create a customer record for each of your permanent, repeat business retail/wholesale customers"; creating them here assigns a customer number so the customer can be tracked throughout the system. This is the foundation record for sales, AR, delivery and marketing.

**Where it lives.** System Administration > System Settings > Customer System Settings > Advanced Customer Settings. Support Files: **Zip Code, Sales Tax, Warehouse Location, Terms, and Salesperson.** Page headings (tabs): **General, Point of Sale, Receivables, Advanced, eSTORIS, User Defined Settings**.

**Fields — key / identity**

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer Code | Key | The customer number. **See numbering rule below — this is the record key.** |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Primary Name → Business | Checkbox | Flags the record as a business rather than an individual; drives which name fields apply. |
| Prefix | Code | Title prefix — validated against `CUST-036` Customer Prefix Settings. |
| First / Middle / Last Name | Text | Individual name. **PII — target of the `PURGE-001` erasure routine, which overwrites name with the literal `"REMOVED"`.** |
| Business Name | Text | Used when `Business` is checked. |
| Suffix | Text | Jr./Sr./III etc. |
| Contact Name | Text | Contact at a business account. |
| Alternate Name — First, Middle, Last Name | Text | "An optional alternate contact person may be associated with the primary customer's account." |
| Alternate Name — Relationship | Code | Relationship of the alternate contact to the primary customer. |
| Billing Address — Line 1 | Text | **PII — `PURGE-001` overwrites billing address line 1 with `"REMOVED"`.** |
| Billing Address — Line 2 | Text | |
| Billing Address — Zip Code | Code | Validated against the **Zip Code** support file; **drives the City and State defaults**. **Deliberately retained by `PURGE-001`.** |
| Billing Address — City | Text | Defaults from the Zip Code record; overridable. **Retained by `PURGE-001`.** |
| Billing Address — State | Text | Written from the Zip Code record. **Retained by `PURGE-001`.** |
| Delivery Address Same as Billing Address | Checkbox | Controls whether the Primary Delivery Information block is populated from billing. |
| Primary Delivery Information — Deliver-To | Code | The primary ship-to. "This section responds to the Delivery Address Same as Billing Address field above." |
| Primary Delivery Information — Description | Text | Label for this ship-to (e.g. "Home", "Warehouse"). |
| Primary Delivery Information — Name | Text | Ship-to name. |
| Primary Delivery Information — Line 1 / Line 2 / Zip Code / City / State / Country | Address | Ship-to address; Zip Code drives City/State the same way. |
| Home / Cell / Work, Ext | Phone | **Used for duplicate detection — see below.** |
| Email | Email | **Used for duplicate detection — see below.** |
| Envelope (on Email and on the address block) | Action/icon | Compose to that address. |
| Phone — grid | Grid | "The grid displays existing phone numbers associated with this customer. Click the **Add Phone Number** button to add a new phone number." Multiple phones are supported beyond Home/Cell/Work. |
| Email — Primary / Additional | Email grid | One primary plus additional email addresses. |
| Tax — Charge on Sales | Checkbox | **"If you do NOT want the system to calculate sales tax on this customer's sales orders, do NOT select the Charge on Sales field in this record."** |
| Tax — Charge National | Checkbox | National/federal tax component (e.g. GST). |
| Tax — ID Number | Text | Tax-exemption certificate / resale ID. **PII-adjacent — treat as sensitive.** |
| Tax — ID Expiration Date | Date | Expiry of the exemption ID. |
| Tax — Alternate ID | Text | Secondary tax identifier. |
| Tax — Entity Use Code | Code | Avalara entity/use exemption code. |
| Other — Referred By | Code/Text | **Marketing attribution on the customer record.** See demographics warning below. |

**Fields — Point of Sale tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Store Location | Code | Home store for this customer (Warehouse Location support file). |
| Delivery Instructions for Billing Address | Text | Standing delivery notes tied to the billing address. |
| Account Comments | Text | Free-form account notes. |
| Salesperson 1 Code | Code | Default salesperson (Salesperson support file). |
| Salesperson 1 Commission _ % | Percent | Default split for salesperson 1. |
| Salesperson 2 Code | Code | Second default salesperson. |
| Salesperson 2 Commission _ % | Percent | Default split for salesperson 2. |
| Membership Benefit Program — Active Member | Checkbox | See `CUST-035` Customer Membership Settings. |
| Membership Benefit Program — Initial Membership Date | Date | Join date. |
| Membership Benefit Program — Renewal | Flag | Renewal handling. |
| Membership Benefit Program — Renewal Date | Date | Next renewal. |
| Membership Benefit Program — Cancellation Date | Date | Cancellation. |
| Membership Benefit Program — Product Code | Code | The item/SKU representing the membership. |
| Membership Benefit Program — Fee | Amount | Membership fee. |
| Terms — Payment Card | Code | Default payment card on file. |
| Terms — Revolving Plan | Code | Default revolving finance plan. |
| Terms — Store of Purchase | Code | Store credited with the account. |
| Terms — Linked Customer Code | Code | **Links this customer to another customer record** (household / parent account). |
| Other — **Price Category Code** | Code | **The customer price category. Feeds steps 3 and 4 of the selling-price resolver (`ITEM-040`/`ITEM-041`).** Validated against `CUST-037` Customer Price Settings. |
| Other — Commission Category Code | Code | Commission category for this customer (see `CUST-015`/`CUST-016`). |
| Other — Commission _ % | Percent | Customer-level commission override. |

**Fields — Receivables tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Credit Limit | Amount | House-account credit ceiling. |
| Terms | Code | AR terms code (Terms support file) — scope `TERMS_CODE`. |
| Due Day | Number | Day of month the balance is due. |
| Charge Late Fees | Checkbox | Whether late fees accrue. |
| Autopay on Account | Checkbox/Setup | Automatic payment against the account. |
| Finance Accounts — Account Number | Text, **encrypted** | **"The account number and finance provider code can only be entered for online financing providers."** Multiple account/provider pairs are supported (Add / Clear / Remove + grid). |
| Finance Accounts — Provider | Code | Online finance provider. |
| **PII — Date of Birth** | Date | Explicitly grouped by STORIS under a heading literally named **"Personally Identifiable Information"**. See `CUST-046`. |
| **PII — Social Security Number** | Text, encrypted | **PII.** |
| **PII — Driver License Number** | Text, encrypted | **PII.** |
| Statements — Hold Customer's Statement | Checkbox | Suppress statement generation. |
| Statements — Create to the Attention of | Text | ATTN line on the statement. |
| Statements — Revolving Statement Delivery Method | Enum | Paper / electronic delivery of revolving statements. |
| Statements — Charge Revolving Paper Statement Fee | Checkbox | Fee for paper statements. |
| Other — Revolving Credit Agreement Printed | Flag/Date | Whether the revolving agreement has been printed. |

**Fields — Advanced tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Inactive Date | Date | Marks the customer inactive as of a date. |
| Language | Code | Preferred language (drives document/print language). |
| Track Purchase History | Checkbox | Whether purchase history is accumulated for this customer. |
| Merge Details — Status | Enum | **Merge state of this record.** |
| Merge Details — By | User | Who performed the merge. |
| Merge Details — Merge To | Customer Code | **The surviving customer record this one was merged into.** |
| Other — Classification | Code | Customer classification. |
| Other — Customer Type | Code | Validated against `CUST-039` Customer Type Settings. |
| Other — Employee ID | Text | Links the customer to an employee (employee-purchase pricing). |
| Other — Accumulate Reward Points | Checkbox | Loyalty accrual on/off. |
| Other — **Okay to Solicit** | Checkbox | **Marketing consent flag — the do-not-contact gate.** |

**Fields — eSTORIS tab** (only active if this customer has an eSTORIS account set up)

| Field | Type | Purpose / business rule |
|---|---|---|
| Website Password | Password | Web account password. **Never display; store hashed.** |
| Reset Password | Action | Triggers a password reset. |
| Allow Web Access | Checkbox | Enables the web account. |
| View Financial Information Online | Checkbox | Whether the customer may see AR/financial data on the web. |

**Fields — User Defined Settings tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Setting | Label (read-only) | "The active prompts that you defined via User Defined Settings are displayed in the first column of the grid." |
| Response | Text | The answer for this customer. |
| Select | Button | Choose from predefined responses where they exist. |

**Behavior & rules.**

- **Customer numbering — HARD RULE and a real trap.** "For new customers you create on-the-fly during sales order entry, **the system assigns the sales ticket number as their customer number**. For this reason, when you initially design your customer records, **do not use numbers that may equal your future sales ticket numbers**." The customer key space and the order key space share a namespace by design.
- **You cannot edit quick sale customers.** (Quick-sale / walk-in records are frozen.)
- Creating customers here requires the **`Advanced Customer Settings; Create new customer`** permission on the **Extended Security (Receivables)** routine — and per wave 1, **Extended Security is a single global kill-switch: every per-user permission is inert unless it is on.**
- **Regional Processing** can restrict which users may access which customer records.
- **Duplicate detection (this is the dedupe spec).** Matching is on **Email, Home, Cell or Work phone**. "When entering an Email or phone number in Home, Cell or Work that is associated with an existing account, a message confirms the existence of the other account." The outcome then depends on *how the screen was reached*:
  - **When creating a sales order** and the existing account **is not used** → **you may create the new customer, even if it is a duplicate.**
  - **When creating a sales order** and the existing account **is used** → you are returned to Enter a Sales Order. **If one customer account matches, the information is populated in the order. If multiple customer accounts match, the Search for a Customer process opens** from which to select a customer.
  - **When not creating a sales order** and the existing account **is not used** → **the entry is rejected.**
  - **When not creating a sales order** and the existing account **is used** → the entry is accepted.
  - **So: duplicates are blocked in maintenance but permitted at the point of sale.** That is precisely backwards from what a clean customer master needs, and is the root cause of duplicate proliferation.
- Two further gates on duplicate email: **`Prohibit New Customers with Duplicate Email Addresses`** in **Point of Sale Control Settings**, and **`Create Customers with Duplicate Information`** in **Create a User/Group Actions - Sales Security**.
- **Merge is recorded on the losing record**, not as an event log: `Merge Details — Status / By / Merge To` on the Advanced tab. There is no merge date field exposed here and **no field-level record of what was overwritten**.
- **Tax — HARD RULE:** "When tax exemption details are updated, **you must access any open orders for this customer and change the `Charge Sales Tax` check box in Order Tax Information**." Tax validation happens only **after entering the Customer Number** in a sales order or exchange — i.e. changing exemption does *not* retro-apply to open orders.
- **Some Rent to Own financing plans qualify for tax exemption despite the settings in this process; in this case, the settings here are overridden.**
- **Avalara:** "The `Charge on Sales` and `Charge National` fields are not used when Avalara is active; however, they are considered when Avalara is offline and STORIS must make offline tax determinations." So they are the offline fallback only.
- Finance account numbers are encrypted: to edit them you need **`View encrypted finance, credit card, check account numbers`** in **Extended Security - Sales Security**.
- A **paper clip icon** on the button bar indicates a file attachment exists for the selected tab (bold = attachments exist, dimmed = none).
- User Defined Settings responses are **"for information only; no processing occurs based on this information."**

**Dependencies.** Zip Code, Sales Tax, Warehouse Location, Terms, Salesperson support files; `CUST-036` Customer Prefix Settings; `CUST-037` Customer Price Settings; `CUST-039` Customer Type Settings; `CUST-035` Customer Membership Settings; `CUST-001` (Metro 2 Settings via Receivables → Action); Point of Sale Control Settings; Extended Security (Receivables) and Sales Security (`SEC-*`, see `parts/user-security-CATALOG.md`); Regional Processing; `ITEM-040`/`ITEM-041` selling-price resolver (via Price Category Code); `PURGE-001` erasure routine; Avalara integration; eSTORIS.

**Build notes.**

- **Customer key.** Use an opaque surrogate `customer_id` plus a human-facing `customer_number` from a **dedicated sequence that can never collide with order numbers**. Explicitly reject STORIS's shared namespace. Preserve the legacy STORIS code in `legacy_customer_code` for migration lookback.
- **Dedupe — invert the STORIS rule.** Identity keys are (normalized email), (E.164 phone, any slot), and (normalized name + normalized billing address). Duplicate detection must run **hardest at point of sale**, where duplicates are actually created — surface the match inline and require an explicit "this is a different person" reason code to proceed, captured to `RPT-AUDIT`. Never silently allow a POS duplicate.
- **Phones must be one child table, not three columns.** STORIS has `Home`/`Cell`/`Work,Ext` *and* a phone grid, which means the same number can exist twice with different match behavior. Model `customer_phone (customer_id, type, e164, ext, is_primary)` and dedupe on `e164`.
- **Merge must be an event, not a status field.** Model `customer_merge (id, surviving_customer_id, merged_customer_id, merged_by, merged_at, field_level_before_json, reversal_of)` and keep the losing record as a permanent tombstone that redirects. **Contradiction to flag:** the merge-import agent's pack covers the *import* path; this screen shows the *interactive* path writes only `Status/By/Merge To` with **no timestamp and no before-image**. If those two paths differ we have two merge semantics — reconcile to one. `[DECISION NEEDED]`.
- **PII.** STORIS itself groups `Date of Birth`, `Social Security Number`, `Driver License Number` under a heading named "Personally Identifiable Information". Add to that list, as PII-bearing for our purposes: full name, all address lines, all phone numbers, all email addresses, `Tax ID Number`/`Alternate ID`, `Employee ID`, finance `Account Number`, and `Website Password`. **Wave 1 finding restated: STORIS PII masking applies only on *re-access* — the person who typed an SSN keeps seeing it in that session — and unchecking the encryption setting *bulk-decrypts stored data*. We must do neither.** Encrypt at rest with per-field envelope keys, mask on every render including immediately after entry, make the decrypt permission per-view and always log to `SAR-024`-equivalent / `RPT-AUDIT`, and make disabling encryption a **one-way, irreversible, no-bulk-decrypt** operation.
- **Erasure.** `PURGE-001` overwrites name and billing address line 1 with the literal `"REMOVED"` while retaining city/state/ZIP. Our erasure must additionally clear or tokenize **phones, emails, DOB, SSN, DL, tax IDs, and the eSTORIS password**, which STORIS's routine as described does not touch. `[DECISION NEEDED]` — retaining city/state/ZIP is deliberate (for de-identified sales analytics); confirm with counsel that ZIP+city+state+purchase history is acceptable under CCPA/CPRA de-identification.
- **Addresses.** Model billing and ship-to as rows in one `customer_address` table with `role` (`BILLING`/`SHIP_TO`), `is_primary`, `valid_from`, `valid_to` — **never destructively update an address**. STORIS keeps only current billing plus a primary delivery plus a ship-to list, and address history is only implicitly retained through the order/invoice snapshot. **We need explicit address versioning because warranty lookback happens years later** and must resolve "where was this delivered in 2019". Every order must also snapshot the address it shipped to.
- **Price Category Code.** This is the customer-level input to the selling-price resolver. Store it on the customer, snapshot the resolved value onto each order line, and make the default explicit — see `CUST-037` for assignment/defaulting.
- **Marketing attribution.** `Referred By` is a **single scalar on the customer record — it is overwritten**, exactly the wave-1 demographics problem. **We should append, not overwrite**: model `customer_attribution (customer_id, source_code, captured_at, captured_by, order_id)` as an append-only event stream so attribution history survives. Same treatment for the `User Defined Settings` responses grid, which is also last-write-wins.
- **`Okay to Solicit`** must be split into per-channel consent (`email`, `sms`, `phone`, `mail`) with `consented_at`, `source`, and `withdrawn_at` — a single boolean is not defensible under TCPA/CAN-SPAM.
- Every field on this screen should feed `RPT-AUDIT`; STORIS has no general change-audit log.
- Do **not** reproduce "you cannot edit quick sale customers" — instead make quick-sale a promotable draft record.
- Do **not** reproduce "you must manually fix open orders after changing tax exemption" — recalculate open orders on exemption change and show an impact list.

---

### `CUST-005` Alert Code Settings
*storis_ref: article 15242629418772*

**Purpose.** Edits the descriptions and parameters of the **credit hold / alert codes** applied automatically to sales orders. Specifically configures the thresholds for the **C7 (Payment History Hold)** and **C8 (payment-verification) credit holds**.

**Where it lives.** Customer Settings (System Administration). Overview of how alert codes are applied and removed lives in **Credit Hold Codes List (AR)**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Alert Code | Code (searchable) | The alert code to enter or edit. A Search button lists the available codes. |
| Description | Text | Description of the alert code. |
| **C7 — Payment History Code** | Number **0–6** | "For each revolving cycle a value between 0-6 is assigned to a customer based on their payment history, **with each higher number representing an increase in days past due**." |
| **C7 — Number of Occurrences** | Number | How many times the payment history code must match/exceed the threshold. |
| **C7 — Number of Months** | Number **1–24** | The evaluation window. |
| **C8 — Total Payment Amount** | Amount | Payment/deposit total that triggers the hold. |
| **C8 — Days to Check** | Number | Lookback window in days for that total. |
| C8 — (include financed orders) | Checkbox | "Check this box to include financed orders during C8 credit processing. **By default, this setting is unchecked.**" |
| C8 — Include Business Accounts | Checkbox | Whether business accounts are subject to the C8 hold. |
| **C8 — Payment Class Access** | Multi-select | Which payment classes count toward the total. |

**Behavior & rules.**
- **C7 rule (exact):** "if the customer's payment history code matches or exceeds the number specified above for the number of occurrences entered, **than the sales order is placed on C7 credit hold**" — evaluated within the `Number of Months` window.
- **HARD RULE: "The number of months entered must exceed the number of occurrences."** (Validation on C7.)
- **C8 rule (exact worked example):** "if you enter **$1500** in the Total Payment Amount and **7** in the Days to Check, then customers who have made payments/deposits of **$1500 or more within the last seven days** than any subsequent sales order is placed on **C8 credit hold**." This is a **payment-verification / fraud hold**, not a credit-worthiness hold.
- **HARD RULE: "Third-party financing and extended receivables financing are excluded from payment verification checking."**
- **C8 Payment Class Access default: all payment classes are selected.** Unselect any class that should not count toward the total. The classes are exactly: **Cash, Checks, Credit Cards, Debit Cards, Miscellaneous, Gift Cards**.

**Dependencies.** Credit Hold Codes List (AR); revolving cycle / AR aging engine; payment class definitions (`CUST-010` Cash, `CUST-011` Check, `CUST-026` Credit Card, `CUST-043` Debit Card payment settings); `CUST-032` Customer Alert Code Settings (customer-level alert assignment).

**Build notes.** Implement holds as **rules with named, versioned parameters** rather than editable magic codes: `credit_hold_rule (code, description, enabled, params_json, effective_from)`. Persist, for every hold placed, the **rule version and the actual computed inputs** (which payments, which cycle codes) so a manager can see *why* an order held — STORIS shows only the code. Enforce the `months > occurrences` validation. Keep the exclusion of third-party/extended financing from payment verification but make it a **configurable payment-class exclusion**, not hardcoded. C8 is effectively "large recent payments = possible fraud/chargeback risk" — for LA Mattress that mostly means large card deposits; confirm the default amount and window. `[DECISION NEEDED]` — do we want C8 at all, and if so, does it hold the order or just flag it for review?

---

### `CUST-006` Alternate Taxable Merchandise Calculation
*storis_ref: article 15242594518164*

**Purpose.** A pop-up window that defines a **partial-taxability rule for merchandise based on the single item selling price** — either a price cap above which merchandise is non-taxable, or a taxable price band. This is the mechanism for jurisdictions that tax only part of an item's price (classic for bedding/clothing thresholds).

**Where it lives.** Reached from **Sales Tax Settings**. **"Depending on your selection at the `Taxable Merchandise` field in the Sales Tax Settings, the prompts on this window prompt for either `Single Item Price Cap` information or `Single Item Price Range` information."**

**Fields — Single Item Price Cap mode**

| Field | Type | Purpose / business rule |
|---|---|---|
| Price Cap | Amount | "the single unit selling price cap **up to which** products are taxable." |
| Exclude Product Groups | Code, multi | Optional. Product Groups exempt from the price cap. **"For products in the exempt groups, the entire selling price will be taxable, regardless of the item price."** Search button selects one; **Action** button opens the **Multiple Product Group selection window** for many. |

**Fields — Single Item Price Range mode**

| Field | Type | Purpose / business rule |
|---|---|---|
| Starting Price | Amount | **"The portion of the item price that is below the Starting Price will be nontaxable."** May be left empty when used with Ending Price — meaning any item price up to the Ending Price is taxable. |
| Ending Price | Amount | **"The portion of the item price that is above the Ending Price will be nontaxable."** May be left empty when used with Starting Price — meaning any item price over the Starting Price is taxable. |

**Behavior & rules.**
- **HARD RULE: "At least one of the fields (Starting, Ending Price) must be specified in order to use this option."**
- **HARD RULE: "One of the fields may be left blank, but an entry of zero (0.00) is not acceptable in either field."** (Blank ≠ 0.00.)
- **HARD RULE: "Note that the single item price will be considered, not the calculated line extension."** Quantity does not matter.
- **HARD RULE: "For a Broken Case Factor greater than one, this price will refer to the case selling price, not the piece selling price."**
- **HARD RULE and a genuine trap: "Line discounts will be taken before the item price is qualified against the Starting or Ending Price. Therefore, the possibility exists that applying a line discount may result in a line item becoming nontaxable."** Discounting changes taxability, not just tax base.
- Price Cap mode is a **cliff** (taxable up to the cap); Price Range mode is a **band** (only the portion inside the band is taxable). These are materially different arithmetic — do not conflate.

**Dependencies.** Sales Tax Settings (`Taxable Merchandise` field selects the mode); Product Group support file; `CUST-004` Tax block; line-discount engine; Broken Case Factor on the item master (Inventory pack); Avalara (which would normally own this logic when active).

**Build notes.** Model as `tax_threshold_rule (jurisdiction, mode ENUM('PRICE_CAP','PRICE_RANGE'), price_cap, starting_price, ending_price, excluded_product_groups[])` with `effective_from`/`effective_to` — **threshold amounts change by statute and historical orders must re-compute at the rate in force on the order date.** Enforce "blank is not zero" as a nullable column, never a 0 default. Order of operations is load-bearing: **discount first, then taxability test** — write a test fixture for the case where a discount pushes an item below/above the threshold. **`[DECISION NEEDED]`** — if we run Avalara (or any tax engine), this rule must live in exactly one place; having both the ERP and the tax engine apply a threshold will double-exempt. Decide now which system owns thresholds, and keep the ERP copy as the documented offline fallback only (consistent with the `Charge on Sales`/`Charge National` offline-fallback rule in `CUST-004`).

---

### `CUST-007` Bank Settings
*storis_ref: article 15242611081620*

**Purpose.** Defines each bank the company holds funds with. Used by the financial modules for **accounts receivable, vendor receivables, financing, and other accounting information**. STORIS recommends one record per bank.

**Where it lives.** Customer Settings (System Administration). Support Files: **Company, Vendor, Warehouse Location.** Tabs: **General, Reconciliation, Third Party Processing**.

**Fields — key + General**

| Field | Type | Purpose / business rule |
|---|---|---|
| Bank Code | Alpha/numeric, **up to 4 characters** | Key representing this bank. |
| Company | Code | Company to associate. **"If not using Multi-Company Processing, only the default company (specified in the General System Control Settings) is available for selection."** |
| Name | Text | Bank name. **Required for the NACHA EFT file format.** |
| Address Line 1 | Text | Bank address line 1. |
| Address Line 2 | Text | "may be used for P.O. Box, Dept., etc." |
| Zip Code/Postal Code | Code | Drives City and State defaults. |
| City/Town | Text | **Defaults to the city/town in the zip code record; the default may be overridden.** |
| State/Province | Text | **Automatically written from the Zip Code record.** |
| Contact | Text | Name of the person most frequently contacted at the bank. |
| Telephone | Phone | Bank telephone. |
| AR → General Ledger Account → Cash | GL Account | "The system posts to this GL account when issuing payable checks from this bank and **receiving cash or checks from sales orders and/or exchanges**." |
| AR → General Ledger Account → Credit Card | GL Account | Credit card receivables. **"The system references this account in the event no GL account has been specified in the Credit Card Payment Settings for the credit card in question."** (fallback) |
| AP → General Ledger Account → Cash | GL Account | GL account for check processing. **"You cannot use wildcards for AP accounts."** |
| Next Check # | Number, **up to 9 digits** | Next pre-numbered check. **"the system automatically increments the check number each time you print a check."** For EFT payments the system instead uses `Next EFT Payment Number`. |
| Print Check # | Checkbox | Print the check number on AP checks for this bank. |
| **Account Number** | Alphanumeric, **up to 20 chars, encrypted** | **"This is an encrypted field. To view this field, you must have access via the `View Encrypted AP Account Numbers` field in Payables Security. However, the account number prints un-encrypted on AP checks printed via the Design Enhanced Laser Forms."** Required for the National Bank (NATIONAL) and Australian Bankers Association (ABA) EFT file formats. |
| **Alternate Account Number** | Alphanumeric, up to 20 chars, encrypted | Used with EFT. For **Wells Fargo EFT** the value populates **Immediate Origin (File ID) in the Wells Fargo EFT Header Record**. **"The positive pay export process will use this value, if defined, in place of the standard Account Number."** Viewing requires `View Encrypted AP Account Numbers`. |
| **Routing Number** | Numeric, **must be an 11-digit response** | "The number entered appears on the printed checks." **Viewable only with `View encrypted AP account numbers` in Create a User/Group Actions - Payables Security.** "The Australian banks use a Swift Code. That code is equivalent to the routing number." |
| Financial Institution | Numeric, **max 7 digits** | Institution number of the payer's bank. Used with Canadian EFT; **required for the National Bank and ABA EFT formats.** For ABA it accepts the **BSB code**: "the first two digits as the financial institution, the third digit identifies the state, separated by a hyphen, followed by a three digit branch." |
| Transit Number | Text | (Label only in source.) |
| Alternate ID | Text | (Label only in source.) |

**Fields — Reconciliation tab** ("If TPA is active on your system, this tab is inactive.")

| Field | Type | Purpose / business rule |
|---|---|---|
| Reconcile Transactions | Checkbox | Activates Bank Reconciliation for this bank. |
| Automated Bank Download | Checkbox | Checked = automatic reconciliation from bank-supplied data; blank = manual reconciliation. |
| Beginning Balance | Amount | **"To edit this field, you must have security clearance via the Create a User/Group Actions - Payables Security. You can use the `Track Settings Activity` routine to audit any manual changes made to this field."** Updates each time you run **Purge Reconciled Transactions**. |
| As Of | Date | As-of date for the beginning balance; used by **Report Reconciliation Transactions** as the starting date if `Starting Date` is blank; updates with the balance on Purge Reconciled Transactions. |
| Deposit Type Code (per payment class) | Code | Default reconciliation deposit type per payment class. **"If you leave this field blank, the payment class does not reconcile unless an override exists."** Action button opens **Payment Type Override Settings** to set deposit types for individual payment *types* within a class. **"You cannot assign a deposit type code to the Gift Certificate payment class. To assign a deposit type code to the Financing payment class, use the Finance Provider Settings."** |

**Fields — Third Party Processing tab** (inactive if TPA is active)

| Field | Type | Purpose / business rule |
|---|---|---|
| Payer Number | Text | EFT payer identifier. |
| Originator Short Name / Originator Long Name | Text | EFT originator names. |
| Destination Data Center | **5-digit** number | Provided by Bank of Montreal (BMO) or CIBC. **Required for CPA005 and CIBC EFT formats. Also required for National Bank (NATIONAL): "It must have a value in order for the 'Addressee' field in the 'A' record ... to be populated. The bank has specified the value as `00610`."** |
| Virtual Card File Format | Enum | Virtual card export format. |
| Virtual Card GL Account | GL Account | **"This account must use the General Cost Center Indicator specified in General Ledger Control Settings."** Posting hierarchy: **(1) Virtual Card GL Account field in Bank Settings; (2) GL Account Number Default (`$$$$$^NN`).** |
| Virtual Card Account Code / Customer ID / Code Word | Text | Virtual card credentials. **Treat as secrets.** |
| **Next EFT Payment Number** | Numeric, up to 9 digits | **"(STORIS - LOCKED FIELD! No Access available)"** — defaults to **100** on a new bank code; **contact STORIS to change it.** Auto-increments per EFT batch. Used instead of Next Check Number for EFT. **Required for CPA005, CIBC, ABA, NACHA and NATIONAL formats.** |
| **EFT File Format** | Enum | **"In order to activate this bank for EFT processing, you must specify an EFT file format at this field."** Supported: **Scotia Bank (SCPI5), Bank of Montreal (CPA005), BMO Harris (NACHA), National Bank (NATIONAL), Canadian Imperial Bank of Commerce (CIBC), SunTrust Bank (NACHA), Wells Fargo (NACHA), Australian Bankers Association (ABA).** ACH (US) uses NACHA; CPA005 is a 1464-byte Canadian format; CIBC uses the CIBC 1464-byte format. |
| EFT GL Account | GL Account | Credited for individual EFT payments in a batch. **"The GL posting for the total EFT batch debits the EFT GL Account and credits the AP Cash Account."** Lookup hierarchy: **(1) EFT GL Account in Bank Settings; (2) GL Account Number Default (`$$$$$^NN`)** — first found wins. |
| Positive Pay File Format | Enum | **"(STORIS-LOCKED FIELD! No Access available!)"** Identifies the export subroutine that formats the bank check file. |
| Positive Pay Bank Identifier / Positive Pay Short Name | Text | Positive-pay identifiers. |
| Export Checks | Checkbox | Checked = checks for this bank are **exported to an XML file instead of being printed**. **"If checked, the only available batch payment method via Select and Approve Bills for Payment is printed check."** **"This setting cannot be changed if an open check run (e.g. pending or exported status) exists for the bank."** |

**Behavior & rules.**
- **Chicken-and-egg on new company + new bank (exact procedure):** create the company in **Company Settings** choosing an *existing* bank at `Bank to Print Checks`, save, then create the new bank here, then return to Company Settings and select the new bank. **A circular FK that has to be broken manually — we should not reproduce it.**
- "Each location in STORIS contains a bank number. The system references this bank number when posting cash through Accounts Receivable and Sales Order Entry." — **the location, not the payment method, determines the bank.**
- **Serious control weakness to flag:** the AP account number is stored encrypted and gated behind a permission, but **"the account number prints un-encrypted on AP checks printed via the Design Enhanced Laser Forms."** The masking is cosmetic.
- `Export Checks` is immutable while an open check run exists.

**Dependencies.** Company Settings (`COMPANY` scope), General System Control Settings (default company; **Extended Security global kill-switch**), General Ledger Control Settings (General Cost Center Indicator), Credit Card Payment Settings (`CUST-026`, GL fallback), Finance Provider Settings (Financing deposit type), Payment Type Override Settings, Purge Reconciled Transactions, Report Reconciliation Transactions, **Track Settings Activity**, Payables Security (`View Encrypted AP Account Numbers`), Design Enhanced Laser Forms, `CUST-020` Create Check Run File.

**Build notes.** Model `bank` under the `COMPANY` scope with an addressable id, not a 4-char code. **Do not create the circular company↔bank dependency** — make `Bank to Print Checks` nullable and set it after both exist. Routing/account numbers: encrypt at rest, mask on render, and **fix the STORIS leak — never emit a full account number onto a printed form without a separate, logged authorization**. `Next Check #` and `Next EFT Payment Number` must be **transactional sequences with gap tracking**, not editable integers; do not lock the EFT number behind a vendor support call — gate it with a permission and audit it. **Note: `Track Settings Activity` exists here and audits the Beginning Balance — this is one of the few audit hooks in STORIS. Feed it into `RPT-AUDIT`.** EFT/positive-pay formats: implement as pluggable exporters; for LA Mattress only **NACHA** is likely relevant. `[DECISION NEEDED]` — do we need positive pay and virtual card at all in v1? `[DECISION NEEDED]` — the deposit-type-blank rule ("the payment class does not reconcile") silently drops classes from reconciliation; we should instead fail loudly on an unmapped payment class.

---

### `CUST-008` Card Length Format Action
*storis_ref: article 15242406194580*

**Purpose.** An **Action-button sub-screen** of Credit Card Validation Settings that exposes the **Card Information** fields controlling accepted card-number lengths/formats.

**Where it lives.** "Select **Card Length Format** from the **Actions** button in the **Credit Card Validation Settings** to access the following Card Information fields."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Card Information (fields not enumerated in the article) | — | **"Format requirements vary according to the authorization service provider. Contact your STORIS representative for further information."** |

**Behavior & rules.**
- The article is effectively a pointer: the actual field list is not published. **Format requirements are processor-dependent.**

**Dependencies.** Credit Card Validation Settings (Part B/C); `CUST-026` Credit Card Payment Settings; the card authorization service provider; `CUST-045` Enable VISA Credit Card Rules.

**Build notes.** **Do not build a per-processor card-length table.** Use standard **IIN/BIN + Luhn** validation from a maintained library, and let the payment gateway (or a P2PE/tokenizing terminal) do card validation. If we tokenize at the terminal we never see a PAN, which removes this screen and most of PCI scope. `[DECISION NEEDED]` — confirm LA Mattress is on a tokenizing/P2PE gateway; if so, mark this whole family (`CUST-008`, `CUST-040`, `CUST-041`, `CUST-045`, `CUST-042`) as "gateway-owned, not ERP-owned".

---

### `CUST-009` Cash Drawer Settings
*storis_ref: article 15242629411604*

**Purpose.** Creates cash drawer records. "The system uses these records with the **receipt of cash payments** feature and other **cash balancing and cash reconciliation** features." The drawer record also carries the terminal's printing and EMV payment-terminal defaults.

**Where it lives.** Three paths:
- System Administration > System Settings > Customer System Settings > **Sales and Service System Settings** > Cash Drawer Settings
- Customer > Point of Sale > Settings > Cash Drawer Settings
- Customer > Settings > Point of Sale Settings > Cash Drawer Settings

Support Files: None.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Cash Drawer Number | Numeric, **up to three digits** | Identifies this cash drawer. |
| Description | Text | "typically the area or department within the store where the cash drawer is located." |
| Store Location | Code | Store where the drawer is physically located. **"The `Default Payment Terminal` field remains inactive until a store location is chosen."** |
| Storis Print Form Number | Code | Form on which to print sales order hard copies at the conclusion of order entry. |
| Physical Printer Number | Code | Where documents print. "useful where multiple terminals share a single printer." |
| Default Payment Terminal | Enum (Terminal IDs + "None Selected") | Default Payment Terminal ID associated with the drawer **selected during user login**. "Since payment terminals are assigned to a single location, this field remains inactive until a Store Location is chosen." **"If a default payment terminal has been selected but the store location is changed, the default payment terminal resets to the 'None Selected' option."** |
| Cash Drawer Type | Enum | Exactly: **None Attached, Serial, USB**. |
| Open Cash Drawer Character | **1–255**, or comma-separated repeats | Only when type = Serial. **"The code you enter here must match the dip switch setting on the cash drawer."** "You can also enter a string of identical characters separated by a comma, for example `7,7,7`." **"If no characters appear in this field, the system assumes a value of 7 has been entered here."** Active unless Cash Drawer Type = None Attached. |
| Payment Terminal ID | Free text, **up to 30 characters** | The **EMV Terminal ID previously configured in the UTG/MCM**. **"only the first 16 characters are used by Tender Retail MCM messaging."** |
| Signature Capture Device | — | **"This field is for future use only."** |

**Behavior & rules.**
- **HARD RULE: "STORIS opens cash drawers automatically only for transactions in which cash is involved. For non-cash transactions, STORIS assumes your cash drawer has a slot to insert documents such as checks or credit card receipts."**
- The Open Cash Drawer Character exists to resolve **software conflicts** — "The outside program may be using code 7 for another function and could cause the cash drawer to open when accessing that function."
- To open a drawer manually, use the separate **Open Cash Drawer** routine; the character setting affects only automatic opens.
- **Silent-reset trap: changing `Store Location` wipes `Default Payment Terminal` back to "None Selected"** without (per the article) any warning.
- **Truncation trap: `Payment Terminal ID` accepts 30 characters but only the first 16 reach Tender Retail MCM.** A 20-character ID will save cleanly and fail at the terminal.

**Dependencies.** Warehouse/Store Location Settings; `CUST-010` Cash Payment Settings; `CUST-007` Bank Settings (location determines the bank/GL for cash); Payment Terminal / UTG / Tender Retail MCM integration; Open Cash Drawer routine; Design Enhanced Laser Forms (print form number); Point of Sale Control Settings.

**Build notes.** Split STORIS's single record into **device config** and **cash accountability**. Device config: `pos_terminal (id, location_id, printer, form, drawer_type ENUM('NONE','SERIAL','USB'), open_char, emv_terminal_id)`. Accountability: `drawer_session (terminal_id, opened_by, opened_at, opening_float, closed_at, counted_amount, expected_amount, variance)` — **variance must be recorded and immutable after close, and every session must reconcile to a bank deposit.** STORIS has no session concept exposed here, which is why cash balancing is a separate manual routine. **Validate `Payment Terminal ID` at 16 characters, not 30** — reject at entry rather than truncate at the terminal. Warn (don't silently reset) when a location change invalidates the default terminal. `[DECISION NEEDED]` — are we keeping physical drawers/serial dip switches at all, or moving to a cloud POS where the terminal owns the drawer? If the latter, this screen shrinks to a terminal↔location mapping.

---

### `CUST-010` Cash Payment Settings
*storis_ref: article 15242662922644*

**Purpose.** Creates and maintains **cash payment types** for use in sales order entry and receivables entry programs when applying deposits and payments to open and completed orders.

**Where it lives.** Customer Settings (System Administration).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Payment Type Code | Code | The cash payment type to create or edit. |
| Description | Text | Name/description of this payment type. |
| Activation Date | Date | "the date of the first day you want this payment type to be available. **The system restricts any sales transactions dated earlier than this date from using this payment type.**" |
| Expiration Date | Date | "the final day you want this payment type to be available. **The system restricts any sales transactions dated later than this date from using this payment type.**" |

**Behavior & rules.**
- **HARD RULE (bank/GL derivation): "Use the Warehouse/Store Location Settings to locate the bank (code) where payments are deposited. The Bank file contains the Cash General Ledger Account number used when posting payments."** — i.e. **the store location, not the payment type, determines the bank and cash GL account.**
- Activation/Expiration are evaluated against the **transaction date**, not the current date.

**Dependencies.** Warehouse/Store Location Settings → `CUST-007` Bank Settings (AR Cash GL account); `CUST-009` Cash Drawer Settings; `CUST-005` Alert Code Settings (Cash is one of the six C8 payment classes); Sales Order Entry; Receivables Entry.

**Build notes.** Model all payment types (cash, check, card, debit, gift, misc, financing) in **one polymorphic `payment_type` table with a `class` discriminator** rather than STORIS's five parallel screens — the class-specific columns can live in a JSON/config column or per-class child tables. Keep `effective_from`/`effective_to` semantics evaluated against **transaction date** exactly as STORIS does; this matters for backdated entries. Derive the bank and GL from location, but **snapshot the resolved bank + GL onto the payment row** so re-org of locations does not rewrite history.

---

### `CUST-011` Check Payment Settings
*storis_ref: article 15242629407508*

**Purpose.** Creates and maintains **check payment types** for sales order entry and receivables entry when applying deposits and payments to orders and invoices, including electronic check conversion (EC) handling.

**Where it lives.** Customer Settings (System Administration).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Payment Type Code | Code | The code representing this payment type. |
| Description | Text | Name/description of this payment type. |
| **Drivers License Prompt** | Enum: **Mandatory / Optional** | **"Select `Mandatory` if you require a driver's license number with each check accepted. Select `Optional` if recording the driver's license number is optional."** **This is a PII-collection switch — it causes DL numbers to be captured at POS.** |
| Receivables GL Account for EC Checks | GL Account | Active **only when the Electronic Check Authorization (On-Line Check Verification) add-on module is active.** GL account used when posting EC check payments. Action button opens the GL Account Entry screen. |
| Activation Date | Date | First day available. Transactions dated earlier are blocked from using this type. |
| Expiration Date | Date | Final day available. Transactions dated later are blocked from using this type. |
| Electronic Check Transmit | Checkbox | Active only when the Electronic Check Authorization module is active. Check if electronically transmitting check authorization requests and/or conversions using this payment type. |

**Behavior & rules.**
- Same **location→bank→cash GL** derivation as `CUST-010`: "Use the Warehouse/Store Location Settings to locate the bank (code) where payments are deposited. The Bank file contains the Cash General Ledger Account number used when posting payments."
- **HARD RULE (posting split): "The GL account you indicate is used only for EC type payments. That is, electronically processed check payments where funds are immediately debited to the customer's bank account. Guaranteed checks (authorizations only) and non-ECA checks post to the cash account."** Three distinct check behaviours: **EC (immediate debit → EC GL account)**, **guaranteed (authorization only → cash account)**, **non-ECA (→ cash account)**.
- **PII flag:** `Drivers License Prompt = Mandatory` means a **driver's license number is captured for every check taken**. That DL number is the same field STORIS treats as PII on the customer record (`CUST-004` Receivables tab). If it is written to the customer master, it is subject to the encryption/masking rules and to `PURGE-001`.

**Dependencies.** Warehouse/Store Location Settings → `CUST-007` Bank Settings; Electronic Check Authorization (On-Line Check Verification) add-on; `CUST-004` (Driver License Number PII field); `CUST-005` (Checks is a C8 payment class); Extended Security → `View encrypted finance, credit card, check account numbers`.

**Build notes.** Treat the check **MICR/account number and the driver's license number as encrypted PII from the moment of capture** — mask them on the POS screen immediately after entry, not only on re-access (this is the wave-1 re-access-only masking defect; do not reproduce it). Prefer **not** collecting DL at all: if check acceptance is guaranteed by a third party, the guarantor holds the identity data and we should store only their token and decision. `[DECISION NEEDED]` — does LA Mattress still accept checks in-store? If yes, decide whether DL capture is Mandatory (and accept the PII burden, including adding DL to the `PURGE-001` erasure field list) or Optional/off. Model the three posting behaviours (EC / guaranteed / non-ECA) explicitly as a `settlement_mode` on the payment type rather than inferring from which GL field is filled.

---

### `CUST-012` Closing Probability Settings
*storis_ref: article 15242611077652*

**Purpose.** Creates **"probability of purchase" codes** used in the **Enter a Sales Lead** routine. "The progression of a Lead/Contact from first contact to invoicing could potentially go through every probability phase from 'just looking' to 'ready to buy'."

**Where it lives.** Customer Settings (System Administration). Support Files: None.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Lead Probability Code | Code | The closing probability code. Source example: **`H - Hot`, `W - Warm`, `C - Cold`**. |
| Description | Text | Description of this closing probability. |
| **Sort Order** | Number **0–100** | "the position on lead/contacts reports and callback screens where you want this closing probability code to appear. **Number one (1) appears at the top of the list, ninety-nine (99) at the bottom.**" Source example: `1 – Hot`, `2 – Warm`, `3 - Cold`. |

**Behavior & rules.**
- **Inconsistency to note: the field accepts 0–100 but the documented semantics only describe 1 (top) through 99 (bottom).** Behaviour at 0 and 100 is undefined in the source.
- Sort order is display-only; **it does not imply a numeric probability weight.** There is no percentage field — "probability" here is an ordinal label, not a number the system does arithmetic with.

**Dependencies.** Enter a Sales Lead; lead/contact reports; callback screens; `CUST-002` Activity Reason Settings (the disposition side of the same lead lifecycle).

**Build notes.** Model as `lead_stage (code, description, sort_order, probability_pct nullable, is_won, is_lost)`. **Add the numeric `probability_pct` STORIS lacks** — we want weighted pipeline value, which an ordinal code cannot give. Record stage changes as an **append-only `lead_stage_history` stream** (lead_id, from_stage, to_stage, changed_at, changed_by) so we can measure stage conversion and time-in-stage; STORIS keeps only the current code, which is the same overwrite-destroys-history pattern flagged for demographics. Feed to `RPT-AUDIT`.

---

### `CUST-013` Collection Letter Settings
*storis_ref: article 15242611080468*

**Purpose.** Assigns **IDs to collection letters** whose templates were created in **Design Enhanced Laser Forms**, and defines which letters are available to collectors.

**Where it lives.** Two paths:
- Accounting > Settings > Collection Settings > Collection Letter Settings
- System Administration > System Settings > Accounting System Settings > Collection System Settings > Collection Letter Settings

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Collection Letter | **Up to 9 alpha-numeric characters** | Identifies the collection letter for which a template was created in Forms Designer; or an existing letter ID to edit. Search button lists existing IDs. |
| Letter Description | Text | Text description. **Action button opens the `Description Field - Language Translation Entry` screen for Multi-Lingual Processing.** |
| Letter Template | Enum (Arrow) | The collection letter form template to associate with the Collection Letter ID. |

**Behavior & rules.**
- **HARD RULE: "Only letter forms that you assign an ID to using this screen are available for selection at the `Letter` field in `Assign and Print Collections Letters` and `Print Collections Letters`."** A template existing in Forms Designer is *not* enough — it must be registered here.
- Descriptions are **translatable** (Multi-Lingual Processing), which pairs with the `Language` field on `CUST-004` Advanced tab.

**Dependencies.** Design Enhanced Laser Forms / Forms Designer; Assign and Print Collections Letters; Print Collections Letters; `CUST-014` Collector Settings; Collections Processing Control Settings; Multi-Lingual Processing; `CUST-004` (customer `Language`).

**Build notes.** `collection_letter (id, description_i18n jsonb, template_ref, active, min_days_past_due nullable)`. Keep the two-step registration (template exists → letter registered) but surface it as one screen. **Store, per letter actually sent, an immutable rendered copy plus the customer's balance and aging at send time** — collection letters are legally significant (FDCPA-adjacent) and we must be able to reproduce exactly what was mailed years later. STORIS retains only the template. `[DECISION NEEDED]` — do we do in-house collections at all, or refer to an agency? If agency, this and `CUST-014` become an export interface instead of a workflow.

---

### `CUST-014` Collector Settings
*storis_ref: article 15242629660820*

**Purpose.** Defines **collectors and their collections assignment criteria, including their yearly quotas.** This is the routing table that decides which past-due accounts land on which collector's queue.

**Where it lives.** Two paths:
- Accounting > Settings > Collection Settings > Collector Settings
- System Administration > System Settings > Accounting System Settings > Collection System Settings > Collector Settings

Also reachable **via the Action button on the General tab of the Create a User file**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Collector | Code | The collector to create or edit. Search button lists collectors. |
| **Alphabetic Range — From** | Letter | First letter of the last-name range. **"The letter you enter must be less than or equal to the letter you enter at the `Through` field."** |
| **Alphabetic Range — Through** | Letter | Last letter of the range. (Source text says "must be greater than or equal to the letter you enter at the `Through` field" — **an obvious typo in the source; it means the `From` field.**) |
| **Past-Due Age Range — From Age** | Days | Must be **≥ the `Minimum Days` set in Collections Processing Control Settings** and **≤ the `Through Age`**. |
| **Past-Due Age Range — Through Age** | Days | Must be **≥ `Minimum Days`**, **≥ `From Age`**, and **≤ 9999**. |
| **Past-Due Amount Range — From Amount** | Whole dollars | "You can specify 0 or **any multiple of the `Minimum Amount`** as specified in the Collections Processing Control Settings, but the amount must be **less than or equal to the `Through Amount`**." |
| **Past-Due Amount Range — Through Amount** | Whole dollars | "an amount ranging from the `Minimum Amount` ... **up to 999,999**". (Source then says "must be less than or equal to the `From Amount` above" — **another source typo; it must be greater than or equal to `From Amount`**.) |
| District | Code, multi | District(s) assigned to this collector. Arrow selects one or more; Action opens the **Multiple District Selection Window**. **Active only if `District` is checked in Collections Processing Control Settings.** |
| Store | Code, multi | Store(s) assigned. Action opens the **Multiple Location Selection Window**. **Active only if `Store` is checked in Collections Processing Control Settings.** |
| Allow Manual Reassignment | Checkbox | Lets this collector manually reassign customer accounts from one collector to another. |
| Allow Automatic Reassignment | Checkbox | Makes accounts belonging to this collector available for automatic reassignment. |
| Yearly Quota — 1-30 Days | Whole dollars | Quota for accounts 1–30 days past due. |
| Yearly Quota — 31-60 Days | Whole dollars | Quota for 31–60 days past due. |
| Yearly Quota — 61-90 Days | Whole dollars | Quota for 61–90 days past due. |
| Yearly Quota — 91-120 Days | Whole dollars | Quota for 91–120 days past due. |
| Yearly Quota — Over 120 Days | Whole dollars | Quota for accounts more than 120 days past due. |

**Behavior & rules.**
- **HARD RULE — destructive cascade on any criteria edit:** "**If you change any assignment criteria for a collector, the system removes the collector from all collection table records to which he/she is currently assigned.** If this removal results in no collectors being assigned to a table record, **the system assigns the default collections manager**. The system then re-assigns the collector based on the new settings. **If only the default collector was previously assigned, the system removes the default collector and assigns the new collector.**" — a single field edit silently re-routes live collection queues.
- **HARD RULE: "You cannot delete a collector to whom customers are assigned."**
- Each criteria block is **conditionally active** based on the matching switch in **Collections Processing Control Settings** (Alphabetical / Minimum Days / Minimum Amount / District / Store). The criteria are effectively a multi-dimensional AND.
- Assignment is actually performed by the **Mass Collector Reassignment** routine, not by this screen.
- Quota performance is viewed via **View Collector Performance**.
- **The aging buckets are hardcoded: 1-30, 31-60, 61-90, 91-120, Over 120.**

**Dependencies.** Collections Processing Control Settings (`Alphabetical`, `Minimum Days`, `Minimum Amount`, `District`, `Store`, default collections manager); Mass Collector Reassignment; View Collector Performance; Create a User file (General tab → Action); `CUST-013` Collection Letter Settings; AR aging engine.

**Build notes.** Model assignment as **rules evaluated at queue-build time**, not as a materialized collector-on-account field: `collector_rule (collector_id, priority, criteria_json, active_from)`. That removes the destructive cascade entirely — changing a rule changes tomorrow's queue and never mutates existing records. **If we must materialize, record the reassignment as an event (`account_collector_history`) so a re-routing storm is visible and reversible.** Make aging buckets configurable, not hardcoded. Fix the two source validation typos (`From ≤ Through` in both directions). Quotas belong in a separate `collector_quota (collector_id, year, bucket, amount)` table so history survives a rate change. Feed all criteria edits to `RPT-AUDIT` — this is exactly the kind of change STORIS cannot audit.

---

### `CUST-015` Commission Settings
*storis_ref: article 15242611359252*

**Purpose.** Specifies **the method by which commissions are calculated**, and builds the **commission matrix** — special commission rates or dollars assigned to combinations of product category and customer *or* salesperson category. Also holds the **Tiered Gross Profit Table** for variable-rate commission.

**Where it lives.** Four paths:
- Customer > Point of Sale > Settings > Commission Settings
- Customer > Settings > Point of Sale Settings > Commission Settings
- System Administration > Get Started - Enter Your Information > Get Started Step 8 - Sales > Commission Settings
- System Administration > System Settings > Customer System Settings > Sales and Service System Settings > Commission Settings

Support Files: **Customer, Salesperson, and Product.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Commission Categories (Search) | Button | Opens `CUST-016` Commission Settings Lookup to view/select an existing matrix. |
| **Customer/Salesperson** | Code | **The label is dynamic**, showing `Customer` or `Salesperson` depending on the `Calculation Method` field on the **Pricing and Commissions** tab of Point of Sale Control Settings. Customer Matrix (**single rate option**) → enter the **customer commission category code**. Salesperson Matrix (**variable rate option**) → enter the **salesperson commission category code**, and the same code must be entered at the `Category` field in **Salesperson Settings**. |
| Product | Code | The **product commission category code** for this matrix. |
| **Commission Calculation — Method** | Enum | Exactly three options: **`% x Sell Price $`** — commission = commission percent (from the Commission Source specified) × selling price. **`% x Gross Profit $`** — commission percent × gross margin dollars. **`is an Amount $`** — the commission percent (from Commission Source of Matrix) is **assumed to be a fixed dollar amount** and is used as the commission paid. **"This option is not available when the calculation method is set to Salesperson Matrix."** |
| **Commission Calculation — Source** | Enum | For a **customer** matrix: **`Customer`** (percent from the Customer file), **`Salesperson`** (percent from the Salesperson file), **`Product`** (percent from the Product file), **`Matrix`** (the Commission Rate in this record). **For a salesperson matrix, only `Matrix` can be selected.** |
| Commission Rate | Percent or Amount | Used when `Source = Matrix`. The percentage **or dollar amount** for this matrix. |
| **Tiered GP Table — Min Gross Profit %** | Percent, **2 decimals** | Minimum GP% for this tier. **"This gross profit percent is based on the selling price and the cost of an item on a sales order."** |
| **Tiered GP Table — Commission %** | Percent, **2 decimals** | Commission to use when gross profit falls between the minimum and "to" GP%. Add button updates the grid. |
| Actions → Custom Settings | Action | **"This option is only active if STORIS has programmed custom settings for your company."** |

**Behavior & rules.**
- **Matrix key formation (exact): "When entering a sales order, the program joins the customer or salesperson commission category code with the product commission category code (separately for each product ordered) to form a matrix code and searches for a commission matrix record in this file with that ID."** If a record exists, commission is calculated from it.
- **HARD RULE: "A matrix code can be alphanumeric, and you can create up to 1296 different matrices."** (1296 = 36 × 36 — **the matrix code is two base-36 characters, one from each side.** That is the real, undocumented constraint: **each category code is a single alphanumeric character.**)
- **HARD RULE: "You can specify only one commission category for each customer/salesperson and product."**
- **HARD RULE: "When the Calculation Method is set to Customer Matrix or Gross Profit, the Tiered Gross Profit Table must be empty."**
- **HARD RULE: "When the Calculation Method is set to Salesperson Matrix, the Commission Calculation Method cannot be set to 'is an Amount $' and the Commission Rate must be empty."**
- **HARD RULE: "If you need to change the calculation method to be used, you must make the change in your Point of Sale Control Settings before you can establish Commission Settings based on the new calculation method. To ensure commission information is added to order item records correctly, the updates must occur during off hours when other users are not on the system."** — a **maintenance-window-only global switch.**
- **As-Is products (exact): "use the following two matrices: the `Category` assigned in Advanced Product Settings and the `Commission Category` assigned in Reason Code Settings. Each matrix can define a separate commission calculation method and commission rate ... This allows STORIS to differentiate commission payments on a product based on a saleable versus As-Is status."**
- **Effective-dating prompt on Save (exact text): "This is a new record in the COMMISSION.MATRIX file. Does this information only apply to orders dated from MM/DD/YY?"** Based on the **system date**. **Yes** → updates apply to today's sales forward; **"If you change the date of a sale, it does not use the updated/new record you just saved."** **No** → "if you backdate a sale starting with this new date, the new rate is applied starting with the new date and going forward." **"In either case, previous orders are not updated."**
- Tiered GP grid displays in **descending gross profit percentage order** and shows **Min Gross Profit %, To Gross Profit %, and Commission %** — the "To" is derived from the next tier, not entered.

**Dependencies.** Point of Sale Control Settings → Pricing and Commissions tab → `Calculation Method` (values include **Customer Matrix, Salesperson Matrix, Gross Profit**); Salesperson Settings (`Category`); Advanced Product Settings (`Category`); Reason Code Settings (As-Is `Commission Category`); `CUST-004` (customer `Commission Category Code` and `Commission _ %`); `CUST-016` Commission Settings Lookup; Customer/Salesperson/Product support files; Commission Calculation Example article.

**Build notes.** **Do not reproduce the 1296-cell single-character matrix.** Model `commission_rule (id, scope_customer_category, scope_salesperson_category, scope_product_category, method ENUM('PCT_SELL','PCT_GP','FLAT_AMT'), source ENUM('CUSTOMER','SALESPERSON','PRODUCT','RULE'), rate, effective_from, effective_to, priority)` with proper multi-character category codes and **most-specific-scope-wins** resolution (same model we adopted for permissions). Make effective dating **a first-class column**, not a Yes/No prompt keyed off the system clock — the STORIS prompt is genuinely dangerous because the answer is unrecoverable and undiscoverable afterwards. **Snapshot the resolved commission onto the order line at write time** (rule id, method, source, rate, computed amount) so recalculation is never needed and "previous orders are not updated" becomes a property of the data rather than a caveat. Keep the As-Is dual-matrix concept — it is genuinely useful — but express it as a product-condition dimension on the rule rather than a second lookup. Remove the "off hours only" constraint by versioning rules instead of mutating them. `[DECISION NEEDED]` — LA Mattress must pick **one** calculation method family up front (matrix vs tiered GP); STORIS makes them mutually exclusive and the switch is a maintenance event.

---

### `CUST-016` Commission Settings Lookup
*storis_ref: article 15242594517268*

**Purpose.** A grid used to **view existing commission matrix settings and select a matrix to edit.**

**Where it lives.** `CUST-015` Commission Settings > **Search button at the `Commission Categories` field label.**

**Fields (grid columns)**

| Column | Type | Purpose / business rule |
|---|---|---|
| Salesperson/Customer Commission Category | Code | **Heading is dynamic:** if `Calculation Method` = **Salesperson Matrix** the heading is **Salesperson Commission Category**; **for all other calculation methods** the heading is **Customer Commission Category**. |
| Product Commission Category | Code | The product category associated with the customer/salesperson category in this matrix. |
| Commission Calculation | Enum | Method assigned when the matrix was created, displayed as **`% x Sell Price $`**, **`% x Gross Profit $`**, or **`Amount $`** ("is an Amount $" selected when matrix created). |
| Source | Enum | Displayed as **`Customer`**, **`Salesperson`**, **`Product`**, or **`Matrix`**. |

**Behavior & rules.**
- **"Double-click a line in the grid to return the record key to the Commission Settings screen, where you can edit the settings."**
- The grid is read-only; all edits happen back on `CUST-015`.
- Note the display value **`Amount $`** differs from the entry value **`is an Amount $`** — same enum, two labels.

**Dependencies.** `CUST-015` Commission Settings; Point of Sale Control Settings → Pricing and Commissions → `Calculation Method`.

**Build notes.** This is a UI affordance, not a data structure — implement as a filterable/sortable table over `commission_rule` with **columns for effective dates and priority that STORIS does not show** (you currently cannot see from this grid which matrix is live for a given date). Use one canonical label per enum value.

---

### `CUST-017` Compliance Condition Settings
*storis_ref: article 15242629664020*

**Purpose.** Maintains the **Metro 2 compliance condition codes** used in the Credit Reporting Process. The file contains the compliance condition codes **as defined in Exhibit 8 of the Consumer Data Industry Association Credit Reporting Resource Guide.**

**Where it lives.** Customer Settings (System Administration). To assign a compliance code to a customer, use the **Metro 2 Settings** option via the **Action** button on the **Receivables** tab of `CUST-004` Advanced Customer Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Compliance Condition | Code (Metro 2, fixed) | The CDIA Exhibit 8 compliance condition code. **Read-only key.** |
| Description | Text | Editable description. |
| Actions | Button | Row action menu. |

**Behavior & rules.**
- **HARD RULE: "You cannot add or delete compliance codes."** Externally governed by CDIA, same as `CUST-001`.
- Compliance condition codes are the Metro 2 mechanism for flagging accounts in dispute, in bankruptcy, affected by a natural disaster, etc. — **they materially change how a tradeline is reported and are legally consequential under the FCRA.**

**Dependencies.** Credit Reporting Process (Metro 2 export); `CUST-001` Account Status Settings; `CUST-004` Receivables tab → Action → Metro 2 Settings; `CUST-024`/`CUST-025` credit bureau settings.

**Build notes.** Same shape as `CUST-001`: seeded, non-extensible `metro2_compliance_condition` table. **Assignment of a compliance condition to a customer must be audited with who/when/why** — these codes are how a consumer dispute or bankruptcy gets reported, and getting them wrong is an FCRA exposure. STORIS records only the current value on the customer. `[DECISION NEEDED]` — same gating question as `CUST-001`: if LA Mattress does not furnish to bureaus, this is out of scope for v1.

---

### `CUST-018` Contract Balance Adjustment Settings
*storis_ref: article 15242611356692*

**Purpose.** Optional routine to define **additional installment contract adjustment types** beyond the built-in ones. "Once you establish and activate adjustment codes via this screen, they appear as available adjustment types in the **Adjust Contract Balance** grid **below the standard types for Principal, Interest, and Insurance**."

**Where it lives.** Two paths:
- Accounting > Installment > Installment Receivables Settings > Contract Balance Adjustment Settings
- System Administration > System Settings > Accounting System Settings > Installment Receivable Settings > Contract Balance Adjustment Settings

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | **Exactly two characters, alphanumeric** | The adjustment type code. Search button opens the **Read-Only Lookup Window**. |
| Description | Text, **mandatory** | Description for the adjustment type. Action button opens **Description Field - Language Translation Entry** (Multi-Lingual Processing). |
| GL Account No | GL Account | GL account used when posting this type of adjustment. Action button opens the GL Account Entry Screen. |
| Active | Checkbox | **"The default when establishing a new code is active."** **"Only active adjustment types appear in the Adjust Contract Balance grid."** |

**Behavior & rules.**
- **HARD RULE (good pattern — adopt it): "The delete option is not available on this screen. Deactivating an adjustment type prevents it from appearing in the Adjust Contract Balance grid, but retains the description for any previous activity using this adjustment code."** This is soft-delete done correctly, and it is the pattern we should use for **every** code table in this pack.
- **The three standard, non-configurable adjustment types are `Principal`, `Interest`, and `Insurance`.** User-defined types always sort below them.

**Dependencies.** Adjust Contract Balance routine; Installment Receivables; General Ledger; Multi-Lingual Processing; `CUST-019` Contract Classification Settings.

**Build notes.** `contract_adjustment_type (code, description_i18n, gl_account, is_active, is_system)` with `is_system` true for Principal/Interest/Insurance. **No hard delete anywhere.** Every adjustment posted must snapshot the GL account in force at the time — changing `GL Account No` later must not retroactively re-map historical postings. `[DECISION NEEDED]` — does LA Mattress carry in-house installment contracts? If financing is entirely third-party, this and `CUST-019` are out of scope.

---

### `CUST-019` Contract Classification Settings
*storis_ref: article 15242611357204*

**Purpose.** Creates and maintains **installment contract classification codes**, which are used to **qualify a customer for a particular type of payment plan** during the payment process in Enter a Sales Order.

**Where it lives.** Accounting > Receivables > Credit Application Settings > Contract Classification Settings. Classifications are then assigned to installment plans at the **`Classification` field on the General tab of Installment Payment Plan Settings.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Classification Code | **Up to 3 alpha-numeric characters** | The contract classification. Search button opens the Read-Only Lookup Window. |
| Description | Text, **mandatory** | Description. Action button opens **Description Field - Language Translation Entry**. |
| **Level** | Enum **1–9** | "used to qualify a customer for a particular type of payment plan during the payment process in Enter a Sales Order." **"a level one is the lowest level plan, with high interest, that can be assigned to plans offered to customers with poor credit. Conversely, a level nine is the highest level, with low interest, and can be assigned to plans offered to customers with excellent credit."** |

**Behavior & rules.**
- **HARD RULE: "At least one classification must be set up."**
- **The 1–9 Level is a credit-tier ladder: low number = worse credit = higher interest; high number = better credit = lower interest.** This is a **risk-based pricing** mechanism and therefore subject to ECOA/Reg B adverse-action requirements when a customer is assigned a lower level.
- The classification is assigned to the **plan**, and the level is what gates a **customer** to that plan. The customer's own level comes from the credit decision, not from this table.

**Dependencies.** Installment Payment Plan Settings (`Classification` on General tab); Enter a Sales Order payment step; `CUST-023` Credit Application Settings; `CUST-029` Credit Review Status Code Settings; `CUST-030` Credit Score Percentile Settings; Multi-Lingual Processing.

**Build notes.** Model as `contract_classification (code, description_i18n, tier smallint CHECK 1..9, is_active)` and a separate `customer_credit_tier` history table so the **tier a customer was assigned on a given date is recoverable** — risk-based pricing decisions must be reconstructible for a compliance request, and STORIS stores only current state. **Every tier assignment must record the inputs (bureau score, percentile band, manual override, decisioning user) and feed `RPT-AUDIT`.** `[DECISION NEEDED]` — if we do risk-based pricing at all, we need an adverse-action notice workflow; STORIS documents none here.

---

### `CUST-020` Create Check Run File
*storis_ref: article 15242629662100*

**Purpose.** Creates the **AP check run file** in the format specified for the bank and writes it to the user's PC in the standard STORIS export path. **This routine also performs the payment completion updates** — it is not a pure export.

**Where it lives.** Menu, and: **Select and Approve Bills for Payment > Check Review tab > `Create Check Run File` button.** The file format itself is established in `CUST-007` Bank Settings via the **Select Bank Check Run File Format** process.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Bank | Enum | "The banks listed here exist in the `Check Run File Format` field in the Select Bank Check Run File Format process. **The default is 'No Bank Selected'.** If no banks have been specified in the Check Run File Format field, a message displays indicating this." |
| Date, Time | Date/Time | **Populated automatically with the date and time of the bank's pending check run, then the fields become inactive.** "If the selected bank has **multiple pending check runs**, the user can choose the check run using these fields. If the selected bank does not have a pending check run, a message indicates this." |
| Send Output To | **Display-only**, fixed to **ASCII Export** | Output channel. |
| Export Path | **Display-only** | The user's default output path and file name. |

**Behavior & rules.**
- **HARD RULE — the export is the commit point. After the file is successfully written to the PC, the payment completion updates are performed:**
  1. **Update payment information and open amount in the AP bills**
  2. **If the open amount is zero, close the AP bill and write it to history**
  3. **Update payment information in the vendor**
  4. **Post GL for the payment — Debit Accounts Payable, Credit AP Cash Account**
  5. **Create a bank reconciliation record for each payment**
- **This couples a local file-system write on a workstation to an irreversible ledger posting.** If the file write succeeds and the subsequent updates fail (or vice versa), the AP subledger and the bank file diverge. **Do not reproduce this design.**
- After writing the file, the user is **prompted to run the Payables Disbursement report.**
- **When run from Select and Approve Bills for Payment, the `Bank`, `Date` and `Time` fields are populated automatically and cannot be changed.**
- To void payments in a printed check run, use the **Void Check Run** process.
- Permissions: **`Print accounts payables checks`** and **`Print refund checks`** in Create a User/Group Actions - Payables Security. (Inert unless **Extended Security** is globally on.)

**Dependencies.** `CUST-007` Bank Settings (check run file format, AP Cash GL account, `Export Checks`, `Next Check #`/`Next EFT Payment Number`); Select and Approve Bills for Payment; Void Check Run; Payables Disbursement report; Bank Reconciliation (`CUST-007` Reconciliation tab); Payables Security (`SEC-*`); General Ledger.

**Build notes.** Restructure into **two explicit phases with a durable batch record**: (1) generate and persist the payment batch server-side with status `GENERATED` and an immutable artifact stored in object storage; (2) a separate, idempotent `POST`-ing step transitions to `POSTED` and writes the GL/AR/vendor/reconciliation rows in **one transaction**. Downloading the file to a workstation must never be the trigger for a ledger posting. Support **re-download** of a generated batch without re-posting. Keep `Void Check Run` as a compensating batch that reverses the same set atomically. Record the check-number range consumed per batch. `[DECISION NEEDED]` — confirm whether LA Mattress AP will use ACH/NACHA only; if so we skip the printed-check path and much of `CUST-007`.

---

### `CUST-021` Create/Maintain a Daily Discount Schedule
*storis_ref: article 15242611361684*

**Purpose.** Creates and maintains a **daily discount schedule** — the ordered, prioritized list of discounts offered on a specific date — which the **Auto-Apply** process uses to discount sales orders consistently.

**Where it lives.**
- Point of Sale > Settings > Create/Maintain a Daily Discount Schedule (maintainable)
- Enter a Sales Order > Merchandise page > **Actions** button > **View Discount Schedule Applied to This Order** (**read-only mode**)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Date | Date | The schedule date. Calendar icon available; **tab to populate the grid.** **"If you enter a date prior to the current date the information displayed is read-only and no modifications can be made."** If no schedule exists for the date, **all discounts that qualify for the date are automatically populated into the grid** and **"Initially, all the lines are checked."** If a schedule exists, all existing discounts load. |

**Fields — grid columns**

| Column | Type | Purpose / business rule |
|---|---|---|
| Check Box | Boolean | Header checkbox selects/deselects all. Checked = apply this discount when Auto-Apply runs (if the order qualifies). **"If you leave a box blank, the Auto-Apply process ignores the discount."** |
| Discount | Code, read-only | Discount code. |
| Description | Text, read-only | Discount description. |
| Percent | Percent, read-only | Shown if the discount type is Percent. |
| Amount | Amount, read-only | Shown if the discount type is Amount. |
| **Group** | **Up to 6 alphanumeric characters**, entry field | Discount Group ID. **"Once a discount with a Group ID has been applied to any line of the order, all other discounts in the same group are disqualified for that order."** "The discounts in a group do not need to be sequentially listed in the table." |
| Minimum Amount | Amount, read-only | Minimum eligible order line or subtotal amount, if the discount requires one. |
| Minimum Quantity | Quantity, read-only | Minimum eligible quantity, if required. |

**Behavior & rules.**
- **Priority is positional: "The order in which items are listed in the grid determines their precedence."** Reordered with **Promote / Demote** buttons (one line at a time).
- **Gate: "In order to use the daily discount schedule, the `Automatically Apply Discounts Using Daily Discount Schedule` setting in Point of Sale Control Settings must be enabled."**
- **HARD RULE: "When you create/maintain an order in Enter a Sales Order and no daily discount schedule exists for the current date, the Auto-Apply Actions options (Start Automated Line Discounting, etc.) cannot be used."** — **no schedule for today means no automated discounting at all that day.** This is a daily operational dependency with no fallback.
- **Refresh semantics — HARD RULE:** "If you modify an order while the Auto-Apply process is running, the process refreshes the discounts. **This means that the existing discounts are discarded and then reapplied using the daily discount schedule.**" **Exception: a discount designated `Manager Only` can be added or removed without triggering the full refresh, and is given in addition to the scheduled discounts.**
- **Optimization: "When a discount is not eligible, the process uses a method to determine the optimal lines so that the discount can be applied in a manner that is most beneficial to the customer."** The method is not documented — **an undocumented optimizer deciding customer-facing prices.**
- **Discount Qualification Rules (exact — a discount does NOT qualify for this process if):**
  - `Line Discounts - Manager Discount Only` is checked in Sales Discount Settings
  - `Manager Discount Only` is checked in Sales Discount Settings
  - **neither** `Apply to As-Is Line Item Amounts` **nor** `Apply to Saleable Line Item Amounts` is checked
  - Sales Discount Settings contain a `Starting` or `Ending Date` and the schedule date does not meet the criteria
  - `Override Discount Amount` is checked
  - `Only Available to Link to Coupons` is checked
  - `Membership Discount Only` is checked
  - **"All other discounts qualify."**
- **HARD RULE (staleness): "If a schedule is changed during the active day, it only affects orders that are created from that point forward. If you want to apply the new schedule to an order that was discounted prior to the change you need to access the orders and refresh the discounts by selecting `Start Automated Line Discounting` from the Actions button in order entry."**
- **HARD RULE (manual sync): "If a discount is changed in Sales Discount Settings, the existing discount schedule needs to be updated with these changes."** The schedule is a **snapshot copy, not a live view** — edit a discount and every existing schedule is silently stale.
- "This grid does not allow the information to be sorted or filtered by columns."

**Dependencies.** Sales Discount Settings (all seven qualification flags, Percent/Amount, minimums, Starting/Ending Date); Point of Sale Control Settings (`Automatically Apply Discounts Using Daily Discount Schedule`); Enter a Sales Order / Enter a Quick Sale (Auto-Apply, Start Automated Line Discounting); `CUST-022` Membership Discount Schedule; `ITEM-040`/`ITEM-041` selling-price resolver (discounts apply after price resolution).

**Build notes.** **Replace the daily snapshot with a live, date-ranged rule set.** `discount_schedule_entry (discount_id, effective_from, effective_to, priority, group_id, enabled)` evaluated at order time — this eliminates both the "no schedule today = no discounting" cliff and the "schedule is stale after a discount edit" trap in one move. Auto-create nothing; **absence of a rule must mean "no discount", never "feature disabled".** Make the optimizer explicit and **document/expose the chosen allocation** — record on each order line which rule applied, its priority, its group, and why competing rules lost, so a manager can explain a price. Keep Discount Groups (mutual exclusion) — that concept is sound; widen the 6-char group id. Preserve the **Manager Only additive exception** but log every manager discount with the approving user. `[DECISION NEEDED]` — "most beneficial to the customer" vs "most beneficial to margin" is a business policy; STORIS silently chose the former. LA Mattress must choose explicitly.

---

### `CUST-022` Create/Maintain a Membership Discount Schedule
*storis_ref: article 15242629662868*

**Purpose.** Same mechanism as `CUST-021` but keyed to a **membership program** rather than a date: choose and prioritize the discounts offered for a specific membership.

**Where it lives.** Point of Sale > Settings > Create/Maintain a Membership Discount Schedule.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Membership ID | Code | "Enter a valid membership code. The grid will populate with all available sales discounts that can be selected to include in the Membership Discount Schedule." |

Grid columns are **identical to `CUST-021`**: Check Box, Discount, Description, Percent, Amount, **Group (up to 6 alphanumeric, mutual-exclusion within group)**, Minimum Amount, Minimum Quantity; ordered by **Promote/Demote** with position = precedence.

**Behavior & rules.**
- **Gate: "the `Automatically Apply Discounts Using Membership Discount Schedule` setting in Point of Sale Control Settings must be enabled."**
- **HARD RULE (scope): "Any discounts available for the discount schedule are setup for either all membership programs or the program that matches the Membership ID entered."**
- **HARD RULE (auto-add): "If `Membership Discount Only` is enabled in Sales Discount Settings, new discounts will be added to any existing Membership Discount Schedules. This includes any new discounts marked `Membership Only` in the Sales Discount Conversion Spreadsheet."** — **note this is the opposite of `CUST-021`, where `Membership Discount Only` *disqualifies* a discount.** The two schedules partition the discount universe.
- **Qualification rules are a shorter list than `CUST-021` (exact — does NOT qualify if):**
  - `Line Discounts - Manager Discount Only` is checked
  - **neither** `Apply to As-Is Line Item Amounts` **nor** `Apply to Saleable Line Item Amounts` is checked
  - `Override Discount Amount` is checked
  - `Only Available to Link to Coupons` is checked
  - **"All other discounts qualify."**
  - **Notably absent vs `CUST-021`: no `Manager Discount Only` standalone rule, no Starting/Ending Date rule, and no `Membership Discount Only` exclusion.** Membership schedules are **not date-bounded.**
- **Refresh semantics differ from `CUST-021` in a meaningful way — HARD RULE:** "If a schedule is changed, it only affects orders that are created from that point forward. If you want to apply the new schedule to an order **a message appears confirming the discount change and prompts you to apply the discounts from the new schedule. Selecting yes updates the order to follow the new schedule. If you select no, all discounts must be done manually for the order.**" — **answering "no" strands the order on manual discounting permanently.**
- Same Manager Only additive exception and same discard-and-reapply refresh behaviour as `CUST-021`.
- Same manual-sync trap: **"If a discount is changed in Sales Discount Settings, the existing discount schedule needs to be updated with these changes."**

**Dependencies.** Sales Discount Settings; Point of Sale Control Settings (`Automatically Apply Discounts Using Membership Discount Schedule`); `CUST-035` Customer Membership Settings; `CUST-004` Point of Sale tab → Membership Benefit Program block (`Active Member`, dates, Product Code, Fee); `CUST-021`; Sales Discount Conversion Spreadsheet; Enter a Sales Order / Enter a Quick Sale.

**Build notes.** Fold `CUST-021` and `CUST-022` into **one rule engine with a scope dimension** (`scope: DATE_RANGE | MEMBERSHIP | BOTH`) rather than two near-duplicate screens with subtly different qualification lists — the divergence between the two lists is a bug farm. Membership eligibility must be evaluated **at order time against the customer's membership status on the order date**, and the resolved membership + rule must be snapshotted onto the order. **Do not implement "auto-add new discounts to existing schedules"** — that silently changes live pricing; require explicit activation. Replace the yes/no refresh prompt with a non-destructive **"preview the difference, then apply"** flow; never leave an order in a permanently-manual state. `[DECISION NEEDED]` — does LA Mattress run a paid membership program (the `CUST-004` block implies a fee + product code + renewal cycle)? If not, this and `CUST-035` are deferred.

---

### `CUST-023` Credit Application Settings
*storis_ref: article 15242611356948*

**Purpose.** Creates new **finance credit applications** and maintains existing ones. **Despite the "Settings" name this is a transaction-entry process, not a configuration screen.**

**Where it lives.** Three paths:
- System Administration > System Settings > Accounting System Settings > **Financing System Settings** > Credit Application Settings
- Accounting > Financing > Financing Settings > Credit Application Settings
- Accounting > Settings > Financing Settings > Credit Application Settings

**"The screens accessed from this process are identical to those accessed via the `Financing > Entries > Finance Credit Application` process."**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (Screen 1 — customer information) | Various | **"The first screen of the process is used to gather customer information that is required on all credit applications, regardless of provider."** Individual fields are not enumerated in the article. |
| (Screen 2 — provider-specific) | Various | **"The second application screen contains prompts for information required by the finance provider. The fields found on the second screen will vary according to the requirements of the specific finance provider."** |

**Behavior & rules.**
- Two-stage form: a **provider-agnostic customer block** followed by a **provider-specific block whose field set is dynamic**.
- **PII warning — this is the highest-density PII screen in the whole section.** A finance credit application by definition collects SSN, date of birth, driver's license/ID, income, employment and housing data. The article does not enumerate the fields, but `CUST-004` confirms SSN / DOB / Driver License Number live on the customer record, `CUST-028` covers **Credit Employment Status**, and `CUST-031` covers **Credit Source**. **Everything captured here must be treated as encrypted PII, and per wave 1 STORIS masks only on re-access — the entering user continues to see the SSN.**

**Dependencies.** Finance Provider Settings; `CUST-004` Advanced Customer Settings (PII block, Finance Accounts grid, `View encrypted finance, credit card, check account numbers` permission); `CUST-024` Credit Bureau Code Settings; `CUST-025` Credit Bureau Settings; `CUST-028` Credit Employment Status Settings; `CUST-029` Credit Review Status Code Settings; `CUST-030` Credit Score Percentile Settings; `CUST-031` Credit Source Settings; `CUST-019` Contract Classification Settings; `CUST-046` Enter Customer's Date of Birth; `SAR-024` Report Secured Decryption Activity.

**Build notes.** Model the provider-specific block as a **declarative form schema per provider** (`finance_provider_form (provider_id, version, schema_json)`) so adding a lender is configuration, not code — and **version it**, because the application submitted must be reproducible. Store the submitted application as an **immutable signed document** plus a structured record; store PII fields encrypted with field-level keys and **mask on every render including the entering user's own session**. Log every decrypt to `RPT-AUDIT` / `SAR-024`-equivalent. **Retention: credit applications carry a statutory retention (ECOA 25 months for applications, longer for adverse action) — this conflicts with `PURGE-001`-style erasure. `[DECISION NEEDED]`: define which records are legal-hold-exempt from customer erasure, because blanket erasure of an applicant would violate the retention rule.** Also `[DECISION NEEDED]`: the article gives no field list — **retrieve the actual screens from the live system before building**, this is a genuine coverage gap on the most sensitive screen in the section.

---

### `CUST-024` Credit Bureau Code Settings
*storis_ref: article 15242611600916*

**Purpose.** Maintains the **message codes returned by the credit bureaus** in the Credit Application process. "These codes and descriptions are supplied by the credit bureau. If the credit bureau adds new codes, you use this process to enter them into STORIS. The credit report request process uses these codes when processing the Credit Report file."

**Where it lives.** Five paths:
- Customer > Electronic Interfaces > Credit Application > Credit Application Settings > Credit Bureau Code Settings
- Accounting > Receivables > Credit Application Settings > Credit Bureau Code Settings
- Accounting > Settings > Credit Application Settings > Credit Bureau Code Settings
- System Administration > System Settings > Customer System Settings > Interface System Settings > Credit Application Settings > Credit Bureau Code Settings
- System Administration > System Settings > Accounting System Settings > Credit Application Settings > Credit Bureau Code Settings

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Credit Bureau Code | Enum (Arrow) | "select a code from the list of **all active credit bureaus, as defined in Credit Application Control Settings**." |
| Section | Enum (Arrow) | "select a section from the list of **all the available sections for the specified credit bureau**." |
| Code | Code | New code, or Search to select existing. **"These codes are provided in a manual from the credit bureau."** |
| Description | Text, **up to 200 alphanumeric characters** | **"This text appears on the credit report when the current code is referenced."** Source examples: **"Application surname does not match credit report"** and **"Too many bank or national revolving/open accounts with outstanding balances."** Actions button → **Description Translation**. |

**Behavior & rules.**
- The code table is **three-level: Bureau → Section → Code.** A code is only meaningful within its bureau and section.
- Maintenance is **manual and reactive** — when a bureau publishes new codes, someone must key them in from the bureau's manual. **An unknown code returned by a bureau has no description and will render blank on the credit report.**
- Descriptions are translatable (Multi-Lingual Processing), consistent with `CUST-013`/`CUST-018`/`CUST-019`.

**Dependencies.** Credit Application Control Settings (defines which bureaus are active); `CUST-025` Credit Bureau Settings; Credit Report Processor / Credit Report file; `CUST-023` Credit Application Settings; Multi-Lingual Processing.

**Build notes.** `bureau_message_code (bureau_id, section, code, description_i18n)` with a composite PK. **Handle the unknown-code case explicitly**: render the raw code plus "unrecognized code — contact <bureau>" rather than a blank, and raise an alert so the table gets updated. These descriptions are **reason codes that can become adverse-action reasons**, so the exact wording matters legally — version the description and record which version was shown on a given credit report. Prefer ingesting the bureau's published code list as a file rather than hand-keying. Gated on the same `[DECISION NEEDED]` as `CUST-001` — only relevant if we run in-house credit decisioning.

---

### `CUST-025` Credit Bureau Settings
*storis_ref: article 15242629909908*

**Purpose.** Maintains the **connection and configuration settings for each supported credit bureau** used by the Credit Application process, including the **InstaTouch ID Fraud API** integration.

**Where it lives.** Five paths (same set as `CUST-024`, ending in Credit Bureau Settings). Tabs: **General, Connection, Misc.**

**Fields — key**

| Field | Type | Purpose / business rule |
|---|---|---|
| Bureau Code | Code | The bureau to view or edit. Search button lists bureaus. |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Name | **Up to 30 alphanumeric** | "You can change the name of the credit bureau, **but you cannot delete it**." |
| Address 1, 2, and 3 | **Up to 30 alphanumeric each**, optional | Bureau address. |
| Phone | **Up to 10 numeric**, optional | Bureau phone. |

**Fields — Connection tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Bureau URL/IP Address | **Up to 999 alphanumeric**, optional | Endpoint of the credit bureau. |
| Member Number | **Up to 20 alphanumeric**, optional | Member number assigned by the bureau. Referenced by the Credit Report Processor. **"If you have not established a member number by location, the system uses the one you establish here as the default member number."** |
| Identification Number | **Up to 7 alphanumeric**, optional | Referenced by Credit Bureau Reporting. |
| Program Identifier | **Up to 10 alphanumeric**, optional | Referenced by Credit Bureau Reporting. |
| **SSL Login/Password** | **Up to 50 alphanumeric**, optional | **Credential used when accessing the bureau via SSL. Stored as a plain settings field — see build notes.** |
| SSL Certificate Path | **Up to 50 alphanumeric**, optional | **"Use this field with the Experian and TransUnion credit bureaus only and not for Equifax."** |
| SSL Server Name | **Up to 50 alphanumeric**, optional | **"referenced by Equifax and Equifax Canada only."** A request parameter passed via the Credit Report Processor. |
| Organization | **Up to 20 characters** | Credit bureau organization code — **"supplied by your Equifax provider."** |
| Store Identifier | **Up to 20 characters** | Credit bureau store identification code — supplied by your Equifax provider. |
| Online Identifier | **Up to 20 characters** | Credit bureau online identification code — supplied by your Equifax provider. |

**Fields — Misc. tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Advanced Credit Scoring | Checkbox | Alerts the bureau that advanced credit scoring is requested. **"Currently, this field is used only by Equifax."** |
| **Error Logging** | Checkbox | **"(LOCKED - STORIS access ONLY!)"** Writes raw credit application information to the **Credit Report Logging file**. See the destructive behaviour below. |
| Schema Version | **Up to 4 characters** | XML schema version. **"If this field is left blank, V1 is used as the default."** |
| InstaTouch — Active | Checkbox | Enables the fraud check; **"This field is active only if using InterConnect. This is unchecked by default."** |
| InstaTouch — URI | Text | URI assigned by Equifax. |
| InstaTouch — User ID | Text | User ID assigned by Equifax. |
| InstaTouch — Password | Text | Password assigned by Equifax. |
| InstaTouch — Authorization Code | **Display-only** | "shows an **encoded** User ID and Password. This field is used as part of the communication between InstaTouch for authentication." |
| InstaTouch — Merchant ID | Text | Merchant ID assigned by Equifax. |
| InstaTouch — Handshake Password | Text | Handshake password assigned by Equifax. |
| **InstaTouch — Fraud Check Score** | Number | "the **maximum fraud check score tolerated by the merchant** once returned from the InstaTouch fraud API. **If the returned fraud score is close to or greater than the entry in this field, the credit application likely will be denied upon further review.**" |

**Behavior & rules.**
- **HARD RULE: "You cannot add or delete credit bureau records, but you can edit them."** Supported bureaus are a fixed list: **Experian, Equifax, Equifax Canada, TransUnion, InterConnect.**
- **"InterConnect is not actually a credit bureau. STORIS interfaces to the InterConnect software, which accesses Equifax credit reports and returns additional information regarding scoring and decisioning."**
- **Inbound callback: "A STORIS web service allows InterConnect to initiate a call to the STORIS system in order to provide a final decision on a pending credit review item. Items remain pending and can be viewed in `Review Pending Credit Requests`."** — an externally-initiated write into the ERP.
- **HARD RULE — destructive prompt on Error Logging (exact): "Once unchecked, a message appears with the option to delete the credit logs: if 'Yes', then log records are deleted once the Save button is clicked; if 'No', then logging remains active until this setting is checked again."** Note the odd semantics: answering **No leaves logging active despite the checkbox being unchecked.** And: **"If this setting is not checked, the logs are deleted automatically as part of the Generate Daily Reports process."** — **raw credit report logs are auto-purged daily by default.**
- **HARD RULE (PII/crypto): "Fraud scores are stored and encrypted if the `Encrypt Credit Scores` setting in General System Control Settings is checked."** This is the same global encryption switch pattern wave 1 flagged: **unchecking such a setting bulk-decrypts stored data.**
- **"Once populated, these [InstaTouch] fields are not cleared."** — credentials persist even after deactivation.
- **The fraud score result "is stored in the customer record"** — another PII-bearing customer field to add to the erasure list.

**Dependencies.** Credit Application Control Settings; `CUST-024` Credit Bureau Code Settings; `CUST-023` Credit Application Settings; Credit Report Processor; Credit Bureau Reporting; Review Pending Credit Requests; **General System Control Settings → `Encrypt Credit Scores`** (and the global **Extended Security** kill-switch); `CUST-030` Credit Score Percentile Settings; `SAR-024` Report Secured Decryption Activity.

**Build notes.**
- **Never store bureau/InstaTouch credentials as ordinary settings fields.** Put `SSL Login/Password`, InstaTouch `Password` and `Handshake Password` in a secrets manager, referenced by handle; the record here holds only the handle. The `Authorization Code` "encoded User ID and Password" is almost certainly Base64 Basic auth — **encoding is not encryption; do not display it at all.**
- **Do not reproduce the `Encrypt Credit Scores` global toggle.** Credit scores and fraud scores are encrypted, always, with no user-facing off switch, and disabling encryption must never bulk-decrypt.
- **Do not auto-purge credit report logs.** Raw bureau request/response is the evidence trail for an FCRA dispute. Retain per a defined retention policy in tamper-evident storage, redacting PII; make deletion an explicit, audited, permissioned action — never a side effect of a daily report job or of unchecking a box.
- The inbound InterConnect callback must be an **authenticated, replay-protected webhook** with idempotency keys, writing to a pending-decision queue rather than directly mutating the application.
- `Fraud Check Score` threshold: STORIS's wording ("close to or greater than") is fuzzy. **Define the comparison exactly** (`>=` threshold → route to manual review; `>` hard-decline threshold → decline) and record the score, threshold, and decision on the application. Threshold changes must be versioned and audited.
- Add `fraud_score` and `credit_score` to the PII inventory feeding `PURGE-001`.

---

### `CUST-026` Credit Card Payment Settings
*storis_ref: article 15242662922388*

**Purpose.** Creates and maintains **credit card payment types** for order-entry and receivables programs when applying deposits and payments to orders and receivables. Also carries the merchant-fee and receivables-tracking accounting for each card type.

**Where it lives.** Nine paths, including:
- System Administration > System Settings > Accounting System Settings > {Accounts Receivables | Financing | General Ledger} System Settings > Credit Card Payment Settings
- Accounting > {Receivables > Receivables Settings | Financing > Financing Settings | General Ledger > General Ledger Settings > Receivables Settings} > Credit Card Payment Settings
- Accounting > Settings > {Payables | Financing | General Ledger Settings > Receivables} Settings > Credit Card Payment Settings

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Payment Type Code | Code | Represents this credit card payment type. |
| Description | Text | Name/description. |
| Telephone | Phone | Telephone number of the credit card company. |
| Activation Date | Date | First day available; **transactions dated earlier are blocked.** |
| Expiration Date | Date | Final day available; **transactions dated later are blocked.** |
| **Track Receivables** | Checkbox | Check "to track receivables **on a transaction level in the Financing module** for credit card companies **from whom you do not receive automatic deposit of funds**." Leave blank "If the monies charged by customers on this credit card are entered into your bank account virtually immediately." **"to track receivables, the Financing module must be active on your system. In addition, this box must be checked in order for usage fees to post to the General Ledger."** |
| Receivables GL Account | GL Account | GL account tracking receivables charged to this payment type. Action button → **TPA GL Account Entry** screen. |
| Usage Fee Percent | Percent | "the fee charged by the credit card company for the use of their credit card ... as a percentage of the charges made. **Use this field only if the credit card company charges a standard fee for all uses of this credit card.**" **Requires `Track Receivables` to post to GL.** |
| Usage Fee GL Account | GL Account | GL account tracking usage fees for this payment type. **Requires `Track Receivables` to post to GL.** |
| Due Days | Number | "the terms you are extending to this credit card or finance company." |
| **External Processor Code** | **Up to two alphanumeric characters** | External processor code for this payment type. **"This field is active only if a check appears at the `External Credit Card Processor` field in the Payment Card and Device Settings."** **HARD RULE: "you can assign external processor codes to only one STORIS payment type at a time."** |
| **Prompt for CID** | Checkbox | Requires users to enter a CID/CVV into the `CID# Number` field on the Credit Card Entry screen **when manually entering credit card numbers** for this card type. **"The system does not require CID numbers when swiping credit cards, only for manual entry."** |
| Card Type | Enum | "Select the Card Type used for processing. Transactions processed via **Credit Card Gateway** with the specified card type are associated with this payment type code." |
| Expiration Date Prompt | Enum: **Mandatory / Optional** | **"If using On-Line Credit Card Processing for this payment type, set this field to Mandatory."** |
| Authorization Prompt | Enum: **Mandatory / Optional** | Requires a credit card authorization number in the Credit Card Entry Window. |
| Actions → Desjardins Configuration | Action | Configures this payment type for **Desjardins Accord D** processing — see `CUST-044`. |

**Behavior & rules.**
- **Supported online processors: Shift-4 and Tender Retail.**
- **Shift-4 card type codes (exact enum):** **`AX` American Express, `DB` Debit (check card), `DC` Diners Club, `JC` JCB/Japan Credit Bureau, `MC` Master Card, `NS` Discover/Novus, `SR` Sears, `VS` Visa.** **"To use any of the above card types, you must use this field to associate its external processing code with a credit card payment type."**
- **"If you are setting up a payment type for use with Accord D, it is strongly recommended that the code you enter here matches the Payment Type Code."**
- **CID vs CVV terminology (exact): "Cards like AMEX and Discover use CID (card identification number), while cards like Visa and Mastercard use CVV (card verification value)."**
- **The usage-fee posting chain is a three-way AND: Financing module active → `Track Receivables` checked → `Usage Fee Percent` and `Usage Fee GL Account` populated. Miss any one and merchant fees silently do not post to the GL.**
- Note `Receivables GL Account` here also interacts with `CUST-007`: the **Bank Settings AR Credit Card GL account is the fallback** "in the event no GL account has been specified in the Credit Card Payment Settings for the credit card in question."

**Dependencies.** `CUST-007` Bank Settings (Credit Card GL fallback); Payment Card and Device Settings (`External Credit Card Processor`, `Token Sharing Active`); Financing module; General Ledger / TPA GL Account Entry; Credit Card Entry Window; `CUST-040` CVV Prompt / `CUST-041` CVV2 Prompt; `CUST-008` Card Length Format Action; `CUST-044` Desjardins Configuration; `CUST-045` Enable VISA Credit Card Rules; `CUST-027` Credit Cards Already on File; `CUST-005` (Credit Cards is a C8 payment class).

**Build notes.** Merchant fees should not be a flat `Usage Fee Percent` — **real interchange is per-card-network, per-transaction-type, plus per-transaction cents.** Model `card_fee_schedule (payment_type_id, effective_from, pct, per_txn_cents, tier)` and **reconcile the accrued fee against the processor's actual settlement file** rather than trusting an estimate. Make the "silently does not post" chain impossible: if `Usage Fee Percent > 0` and the posting prerequisites are not met, **fail validation at save time**. `External Processor Code`'s one-payment-type-at-a-time rule should be a real unique constraint. **PCI:** with a tokenizing gateway the ERP never stores a PAN, so `Prompt for CID`, card-length rules, and manual-entry paths mostly disappear — see `CUST-008` build notes. Keep `Activation`/`Expiration` transaction-date semantics consistent with `CUST-010`/`CUST-011`.

---

### `CUST-027` Credit Cards Already on File
*storis_ref: article 15242594516884*

**Purpose.** Views the **card numbers and types currently on file for a customer** (stored as shared gateway tokens), and — from the customer master only — removes them.

**Where it lives.** Two paths, with **different capabilities**:
- **Advanced Customer Settings > Actions button > Credit Cards Already on File** — view **and remove**
- **Payment Summary Window > Actions button > Credit Cards Already on File** — **select a card for the transaction, but cannot maintain the cards**

**Fields (grid columns)**

| Column | Type | Purpose / business rule |
|---|---|---|
| Card Type | Enum | The type of credit card (Visa, MasterCard, etc). |
| **Ending With** | Text | **The last 4 digits of the credit card. Only the last 4 are shown — no full PAN.** |
| Last Used | Date | The date the card was last used. |
| Remove | Button | Removes the card from the customer. **"This column is only visible when this screen is accessed via Advanced Customer Settings."** |

**Behavior & rules.**
- **HARD RULE (double gate on the Remove action): "For this extra action to be enabled, both the `Shift4` module AND the `Token Sharing Active` setting in `Payment Card and Device Settings` must be enabled."**
- **"This information appears when shared credit card token information is present."** — the grid is **token-backed**; the ERP holds a gateway token, not a card number.
- Selection flow from Payment Summary: **"Once selected, the Credit Card Entry Window displays, with the encrypted card number and type filled in. If the CVV number is required, the CVV Prompt window displays after clicking the Save button on the Credit Card Entry screen."**
- **PII note:** a stored card token plus last-4 plus last-used date is customer payment data. **`PURGE-001` as described does not touch it** — erasing a customer must also revoke the gateway tokens.

**Dependencies.** `CUST-004` Advanced Customer Settings (Actions); Payment Summary Window; Payment Card and Device Settings (**`Token Sharing Active`**); Shift4 module; Credit Card Entry Window; `CUST-040` CVV Prompt / `CUST-041` CVV2 Prompt; `CUST-026` Credit Card Payment Settings.

**Build notes.** **This is the correct pattern and we should generalize it: store only a gateway token + brand + last4 + expiry-month/year, never a PAN.** Model `customer_payment_token (customer_id, gateway, token, brand, last4, exp_month, exp_year, added_at, added_by, last_used_at, revoked_at)`. **Removal must call the gateway to revoke the token, not merely hide the row** — a soft-delete that leaves a live token at the processor is a real liability. Add a **cardholder-consent record** for storing a card on file (network rules require it) with the consent text version and timestamp. Wire token revocation into `PURGE-001` and into account closure. Log every token add/use/revoke to `RPT-AUDIT`. Note the asymmetric permissions STORIS uses (view everywhere, remove only in the customer master) — reproduce that as **two distinct permissions** rather than a screen-path accident.

---

### `CUST-028` Credit Employment Status Settings
*storis_ref: article 15242629911700*

**Purpose.** Establishes **employment status codes** used on the **employment tabs of Credit Application Entry** to indicate the applicant's employment status, and controls whether employment detail is mandatory for each status.

**Where it lives.** Accounting > Receivables > Credit Applications Settings > Credit Employment Status Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Employment Status | **A single number or letter**, **mandatory** | The employment status code. Edit by entering the code or selecting from the grid. |
| Description | **Up to 35 characters**, **mandatory** | Describes the status. Action button → **Description Field - Language Translation Entry**. |
| **Require Employment Information** | Checkbox | "To require entry of employment information on the application when this employment status is selected, check this box." |

**Grid columns:** Status code, Description, **Employment Information Required (Y/N)**. Double-click a line to edit all three.

**Behavior & rules.**
- **HARD RULE (this override is the interesting part): "This check box can be used to either make entry of the employment information required or not required, *regardless of whether the fields are set to mandatory or optional entry in your Credit Application Control Settings*."** — **a per-status flag that overrides the global field-mandatory configuration in both directions.**
- **The code is a single character**, so the status universe is capped at 36 values (and STORIS conventionally uses far fewer: employed / retired / self-employed / unemployed / student / military).
- Add/Plus button commits the row to the grid.

**Dependencies.** Credit Application Entry (employment tabs); **Credit Application Control Settings** (global mandatory/optional field configuration, which this overrides); `CUST-023` Credit Application Settings; `CUST-019` Contract Classification Settings; Multi-Lingual Processing.

**Build notes.** `employment_status (code, description_i18n, requires_employment_detail tri-state)` — model the override explicitly as **`INHERIT | REQUIRED | NOT_REQUIRED`** rather than a boolean, because STORIS's checkbox genuinely means "force on" vs "force off" and the article's wording hides that a blank box *relaxes* a globally-mandatory field. Widen the code beyond one character. **ECOA note: employment status collected on a credit application is regulated data; income and employment cannot be used in a prohibited-basis way, and the application record must be retained 25 months.** Feed status-code changes to `RPT-AUDIT`.

---

### `CUST-029` Credit Review Status Code Settings
*storis_ref: article 15242611595540*

**Purpose.** Views, edits and creates the **credit review status codes** entered at the **`Review Status` prompt on the Credit Request Review Screen**, and maps each to an underlying credit request status and optional webhook.

**Where it lives.** Five paths (same family as `CUST-024`/`CUST-025`), ending in Credit Review Status Code Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Credit Review Status Code | **Up to 4 alphanumeric characters** | The status code. Search button lists codes. Delivered examples: **`CA` (Conditional Approval)**, **`D` (Declined)**. |
| Description | **Up to 30 alphanumeric characters** | Description. Action button → **Description Field - Language Translation Entry**. |
| **Associated Credit Request Status** | Enum | The underlying credit request status. **"This field is active only for codes you create. It is inactive for STORIS' standard codes."** |
| **Create Webhook Notification** | Checkbox | See webhook rule below. |

**Associated Credit Request Status — exact enum, in order (the numbering matters, see rules):**
1. **Pending Decision**
2. **Transmission in Progress**
3. **Pending Review**
4. **Review in Progress**
5. **On Hold Awaiting Further Information or Verification**
6. **Conditionally Approved**
7. **Credit Approved**
8. **Credit Declined**
9. **Credit Request Closed**

**Behavior & rules.**
- **HARD RULE: "You cannot delete the standard codes, and you can only edit the Description field. For codes you create, you can delete them or you can edit all fields except the key field."** Two-tier ownership: system codes vs user codes.
- **HARD RULE: "Codes with this field set to 5 or 6 (see above) are considered 'on hold' by the system."** — i.e. **`On Hold Awaiting Further Information or Verification` and `Conditionally Approved` both count as on-hold.** (Conditional approval being treated as a hold is non-obvious.)
- **HARD RULE (mandatory reason code): "When editing the `Current` field in the Credit Request Review Screen, if you specify a credit review status code for which one of the following associated credit request statuses has been specified, the program requires you enter a reason code": `5. On Hold Awaiting Further Information or Verification`, `6. Conditionally Approved`, `8. Credit Declined`.** — **status 8 Credit Declined always requires a reason. That reason is the adverse-action reason.**
- **Webhook: "If this checkbox is checked and a review item is changed to this status via `Review Pending Credit Requests` or `Request Credit Information` or via API Processing (`Submit Credit Application` or `Update Credit Application Status`), then a webhook event will be triggered for consumption by a web process to continue the credit process with the applicant. For example, send them a text message."** **"Note, you must be subscribed to the webhook for the notification event to take place."**
- **The webhook fires on the *status code*, not on the underlying status** — two codes mapping to the same underlying status can behave differently.

**Dependencies.** Credit Request Review Screen (`Review Status`, `Current`); Review Pending Credit Requests; Request Credit Information; API Processing (`Submit Credit Application`, `Update Credit Application Status`); webhook subscription registry; `CUST-025` (InterConnect inbound decision callback lands on pending items); `CUST-024` bureau reason codes; Multi-Lingual Processing.

**Build notes.** Model as a **state machine, not a free code table**: `credit_request_status` is the canonical enum (the 9 values above, kept verbatim for migration), and `credit_review_status_code` is a labelled transition into one of them with `requires_reason`, `is_on_hold`, `emits_webhook`. **Define the legal transitions explicitly** — STORIS lets any code be selected at any time. **Every transition to Declined (8) must capture the reason code AND generate the ECOA/Reg B adverse-action notice within 30 days; make the notice an artifact of the transition, not a manual step.** Persist the full status history with actor, timestamp, source (UI / API / webhook callback) — never just the current status. Webhooks: signed payloads, retries with backoff, idempotency keys, and a delivery log; "you must be subscribed" silently no-ops today, which is a bad failure mode — **surface unsubscribed-but-enabled as a configuration error.** `[DECISION NEEDED]` — reason codes are referenced but not defined in this section; locate the reason-code table (likely in Part B/C or another pack) before building.

---

### `CUST-030` Credit Score Percentile Settings
*storis_ref: article 15242629910548*

**Purpose.** Maintains a table of **percentile data based on applicants' credit scores**. "The percentile data for both the **primary and co applicant** is available to be added to enhanced laser print forms, **allowing you to be Dodd Frank compliant** and print this information on **credit status letters**."

**Where it lives.** Accounting > Receivables > Credit Application Settings > Credit Score Percentile Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Maximum Score | Number, **required** | "the maximum credit score for which you are entering a corresponding rank % in the next field." |
| Ranks Higher Than 'X' % | **Whole number percent**, **required** | "the rank percentage, in whole numbers, that corresponds to the maximum score you entered." |

**Grid columns:** **Minimum Score, Maximum Score, Ranks Higher Than 'X' %.**

**Behavior & rules.**
- **HARD RULE (derived minimum): "the minimum score is automatically generated for each row by adding one to the previous maximum score. The default minimum score for row one is zero."** Bands are contiguous by construction — **you cannot create a gap, and you cannot create an overlap.**
- **HARD RULE (partial immutability): "You can edit the grid to change the `Ranks Higher Than 'X' %`. You cannot change the minimum or maximum scores in the grid, but you can delete a line and re-enter the correct information."** Remove button deletes a line.
- **"During the printing of the credit status letters, the percentile data is captured based on where the credit score falls on this credit score percentile table."** — **the percentile is resolved at print time, not at decision time.** If the table is edited between the credit decision and the letter, the letter shows a different percentile than was in force when the decision was made.
- The stated compliance driver is **Dodd-Frank** (the credit-score disclosure requirement in risk-based pricing / adverse action notices — score, range, key factors, and the percentile ranking).

**Dependencies.** Design Enhanced Laser Forms (credit status letters); `CUST-025` Credit Bureau Settings (`Encrypt Credit Scores` in General System Control Settings); `CUST-029` Credit Review Status Code Settings (declines trigger letters); `CUST-023` Credit Application Settings; `CUST-019` Contract Classification Settings.

**Build notes.** `credit_score_percentile_band (score_min, score_max, rank_pct, model, effective_from, effective_to)`. **Add a `model` column — a percentile band is only meaningful for a specific scoring model and version (FICO 8 vs VantageScore 4 vs a bureau-specific model), and STORIS has no such column at all. Using one band table across models produces legally wrong disclosures.** **Resolve and snapshot the percentile at the moment of the credit decision, and print the snapshot** — do not re-resolve at print time. Keep bands immutable once used: supersede with a new effective-dated version rather than deleting and re-entering. Feed edits to `RPT-AUDIT`. `[DECISION NEEDED]` — Dodd-Frank/FCRA §615(h) disclosure content should be confirmed with counsel; the source of the percentile data is normally the bureau itself, so a hand-maintained table may be the wrong source entirely.

---

### `CUST-031` Credit Source Settings
*storis_ref: article 15242611595284*

**Purpose.** Creates **credit source descriptions** referenced at the **`Credit Source` field in Customer Credit and Scoring Information**. "You use the credit source to **define where changed information for that screen was retrieved**."

**Where it lives.** Accounting > Receivables > Credit Applications Settings > Credit Source Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Description | Text, **mandatory** | The credit source description. **There is no separate code field — the description *is* the record.** Add/Plus button creates it. Action button → **Description Field - Language Translation Entry**. Double-click a grid line to edit. |

**Grid:** "displays all credit source descriptions that are currently available. As you add new descriptions, the grid is updated." Click **Save** to commit.

**Behavior & rules.**
- **Data-model smell: the description is the key.** Editing a description therefore either rewrites history or orphans references, depending on how STORIS stores it. **Editing a source name here silently changes the provenance label on every past record that used it.**
- Semantically this is **provenance metadata on a credit-scoring change** — "where did this number come from" (bureau pull, manual entry, InterConnect, imported, customer-supplied).

**Dependencies.** Customer Credit and Scoring Information screen (`Credit Source` field); `CUST-025` Credit Bureau Settings; `CUST-023` Credit Application Settings; Multi-Lingual Processing.

**Build notes.** Give it a **surrogate id and a stable code** so renaming the label never rewrites history: `credit_source (id, code, label_i18n, is_active)`. Better still, **make provenance automatic rather than user-selected** — record the actual origin of every credit/score change (`BUREAU_PULL:{bureau,pulled_at,request_id}`, `MANUAL:{user}`, `API:{caller}`, `IMPORT:{file}`) as part of an append-only `customer_credit_history` stream. A hand-picked dropdown is not trustworthy provenance. **This is a direct instance of the wave-1 pattern: STORIS stores current state plus a hand-typed label instead of an event log.** Feed to `RPT-AUDIT`.

---

### `CUST-032` Customer Alert Code Settings
*storis_ref: article 15242629910036*

**Purpose.** Creates and edits **customer alert codes** — the AR-side flags assigned to a customer that drive **non-accrual status** and **automatic charge-off**.

**Where it lives.** Accounting > Receivables > Receivables Settings > Customer Alert Code Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer Alert Code | Code | The alert code to enter or edit. Search button lists codes. |
| Description | Text | Description of the alert code. |
| **Non-Accrual** | Checkbox | **"If you check the box at this field, you assign a non-accrual status to all customers to which you assign this alert code."** — stops interest accrual. |
| **Automatic Charge-Off** | Checkbox | **"If you check the box at this field, the Automatic Charge-Off process charges off all customers to which you assign this alert code."** |

**Behavior & rules.**
- **HARD RULE (protected codes): "The following codes are used by the Bad-Debt Charge-Off process and are not available for deletion: `CO` (charged off), `NA` (non-accrual)."**
- **HARD RULE and a real hazard: checking `Automatic Charge-Off` on an alert code causes the Automatic Charge-Off process to charge off *every customer already carrying that code*.** Ticking a checkbox on a configuration screen writes off receivables in bulk. **This must not be reproduced as an unguarded toggle.**
- Same bulk-effect applies to `Non-Accrual`: checking it retroactively changes accrual status for all customers holding the code.
- Note this is a **different table from `CUST-005` Alert Code Settings** (which configures the C7/C8 *credit hold* codes). Two "alert code" tables with different purposes and different owners (AR vs POS credit hold) — **easy to confuse; keep them distinct in our model.**

**Dependencies.** Bad-Debt Charge-Off process; Automatic Charge-Off process; AR interest accrual; `CUST-004` (alert codes are assigned to customers); `CUST-005` Alert Code Settings (distinct); `CUST-014` Collector Settings / collections queues; General Ledger (bad debt expense).

**Build notes.** Two tables, clearly named: `customer_ar_alert_code` (this) and `credit_hold_code` (`CUST-005`). **Make the bulk effects explicit and reviewable:** changing `Non-Accrual` or `Automatic Charge-Off` on a code must show **an impact preview ("this affects N customers, $X balance") and require confirmation plus a permission**, and the resulting charge-offs must be a **named, reversible batch** with a GL journal, not a silent sweep. Keep `CO` and `NA` as system codes (`is_system`, undeletable, per the good soft-delete pattern from `CUST-018`). Every alert-code assignment and removal on a customer belongs in an append-only history — charge-off and non-accrual are material accounting events. Feed all of it to `RPT-AUDIT`.

---

### `CUST-033` Customer Legal Settings
*storis_ref: article 15242609770004*

**Purpose.** Indicates the **legal status of a customer's account** (bankruptcy, litigation, cease-communication, deceased, etc. — the specific codes come from Legal Code Settings). "You can use these settings to track and report the status of the account and determine any additional steps that are required for that account."

**Where it lives.** **Advanced Customer Settings > Receivables page > Actions button > select `Legal Settings`.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (grid of legal codes) | Checkbox per code | "This grid contains the legal codes maintained in **Legal Code Settings**. Click the check box next to the legal codes that apply." Header checkbox selects/deselects all. Save commits. |

**Behavior & rules.**
- **HARD RULE (cascading side effects): "Depending on your `Legal Code Settings`, additional actions may occur when you check one of these legal settings. These actions include closing the customer account, holding the customer's receivables statements, and/or excluding the customer from mailing lists and emails."** — **ticking a checkbox here can close an account and suppress all marketing to that customer.**
- **HARD RULE (Metro 2 interaction): "If there are values in the `Account Status`, `Special Comment` and/or `Compliance Condition` fields in Legal Code Settings, those Metro 2 codes are applied to the customer."**
- **HARD RULE (conflict handling): "If the Metro 2 codes conflict, or there are multiple Metro 2 codes assigned among different legal codes, a warning message displays alerting you to select the compatible legal code(s)."** — a **warning**, not a block.
- **HARD RULE and a genuine data-integrity trap: "Metro 2 codes for customers who already have a legal code assigned are not updated."** — **once a customer has any legal code, later Metro 2 code changes do not propagate. The customer's bureau reporting silently freezes at whatever was applied first.**
- "Options set here may impact codes for **Report Metro 2 Customer Credit History**."
- **Automatic display:** if `Automatic Display of Legal Settings` is checked in **Accounts Receivable Control Settings**, the read-only screen (`CUST-034`) pops up in **fifteen** routines: **Enter a Sales Order, Enter a Customer Payment, Enter a Customer Payment/Refund/Gift Certificate, Enter a Return, Enter an Exchange, Request Legal Entitled to (LET) Documents, Process Repossessed Items, Collector Review - Customer Update Screen, Manage and Adjust Installment Contracts, View All Installment Activity for a Customer, Review Pending Credit Requests, Maintain Customer Balances, Enter a Customer's Revolving Terms & Conditions, Adjust Revolving Plans, View All Revolving Activity for a Customer.**

**Dependencies.** **Legal Code Settings** (defines the codes and their side effects: close account / hold statements / exclude from mailing lists and emails / Metro 2 `Account Status`, `Special Comment`, `Compliance Condition`); Accounts Receivable Control Settings (`Automatic Display of Legal Settings`); `CUST-034` Customer Legal Settings - Read Only; `CUST-001` Account Status Settings; `CUST-017` Compliance Condition Settings; Special Comment Settings; Report Metro 2 Customer Credit History; `CUST-004` (reached from its Receivables Actions menu); `CUST-032` Customer Alert Code Settings.

**Build notes.**
- **This is the marketing-suppression and account-closure kill switch, so it must be modelled as an event stream, not a checkbox set.** `customer_legal_flag (customer_id, legal_code, applied_at, applied_by, removed_at, removed_by, reason)` — append-only. "Excluded from mailing lists and emails" for a legal reason (e.g. a cease-and-desist under FDCPA, or a bankruptcy automatic stay) must be **reconstructible for any past date** to prove we did not contact someone we were barred from contacting.
- **Fix the freeze bug.** "Metro 2 codes for customers who already have a legal code assigned are not updated" is almost certainly a defect, not a policy. Our implementation must **recompute derived Metro 2 codes on every legal-flag change** and surface conflicts as a **blocking** validation with an explicit override that is logged — not a dismissible warning.
- **Legal flags must dominate marketing consent.** Wire them as a hard suppression layer above the per-channel consent model proposed for `CUST-004`'s `Okay to Solicit`: legal suppression cannot be overridden by a later opt-in.
- Bankruptcy/deceased flags should also **stop collection activity, statements, late fees and interest accrual** — coordinate with `CUST-032` (`Non-Accrual`) and `CUST-014`.
- Feed everything here to `RPT-AUDIT`; this is among the highest-consequence data in the customer master.
- `[DECISION NEEDED]` — Legal Code Settings itself is not in positions 1–46; **whoever covers it must document the exact code list and each code's side-effect matrix**, because that table, not this screen, holds the real rules.

---

### `CUST-034` Customer Legal Settings - Read Only
*storis_ref: article 15242406190740*

**Purpose.** Read-only view of **all legal settings assigned to a customer, with the date each code was added**, plus the customer's alert code and the date it was applied. Used as the **warning pop-up** shown to staff before they transact with a flagged customer.

**Where it lives.** Appears as a pop-up in the fifteen routines listed in `CUST-033` **if `Automatic Display of Legal Settings` is checked in Accounts Receivable Control Settings** and the customer has one or more legal settings. Settings are assigned via **Advanced Customer Settings > Receivables page > Actions button > Legal Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer Alert Code Description | Display-only | "If an alert code was assigned to this customer **on the `Bad Debt` tab of `Maintain Customer Balances`**, the description displays here." |
| Date (alert code) | Display-only | The date the alert code was assigned to the customer. |
| Legal Settings Description | Display-only | The description for each legal code assigned to the customer. |
| Date Added | Display-only | **The date each legal code was added to the customer's legal settings.** |

**Behavior & rules.**
- **"You cannot edit these settings using this screen."**
- **Note the split of authorship: legal codes are assigned in `CUST-033` (Advanced Customer Settings → Receivables → Actions), but alert codes are assigned in `Maintain Customer Balances` → `Bad Debt` tab** — two different screens feeding one warning panel.
- **STORIS does record a `Date Added` per legal code — so partial history exists here even though most of the customer master has none.** There is no "date removed", so **removing a legal code destroys the fact that it was ever applied.**

**Dependencies.** `CUST-033` Customer Legal Settings; Legal Code Settings; Accounts Receivable Control Settings (`Automatic Display of Legal Settings`); Maintain Customer Balances (Bad Debt tab); `CUST-032` Customer Alert Code Settings; the fifteen transaction routines listed in `CUST-033`.

**Build notes.** Implement as a **single "customer risk & legal banner" component** rendered inline (not a modal the user reflexively dismisses) in every transaction surface, driven by the append-only `customer_legal_flag` and `customer_alert_history` tables — so it shows **applied and removed dates, by whom, and why**. Make the banner **blocking for the actions the flag forbids** (e.g. no collection call while a cease-communication flag is live) rather than purely informational. Consolidate the two assignment paths into one screen with one permission. `[DECISION NEEDED]` — should the banner be acknowledgeable-and-logged (staff clicks "understood", we record who saw it and when)? For bankruptcy/cease-communication that acknowledgement is useful evidence.

---

### `CUST-035` Customer Membership Settings
*storis_ref: article 16917471620116*

**Purpose.** Reviews and updates a customer's **membership program** enrolment — the same block that appears on the Point of Sale tab of `CUST-004`, exposed as its own maintenance screen.

**Where it lives.** Point of Sale > Settings > Customer Membership Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer Code | Code | The customer whose membership is being maintained. |
| **Active Member** | Checkbox | "If checked, the customer currently participates in a membership program. **While this box can be unchecked if a customer wants to opt out of the membership program before it expires, the only way this setting can be updated is when a customer includes a membership program on a sales order.**" — **it can be turned off here, but only a sales order can turn it on.** |
| Initial Membership Date | **Display-only** | The date the membership program was first purchased. |
| Renewal | Checkbox | "Check this box to indicate that the membership plan **auto-renews when payment is available**." |
| Renewal Date | **Display-only** | The date the customer is due to renew. |
| Cancellation Date | **Display-only** | See the update rules below. |
| Product Code | **Display-only** | The Product ID of the membership program. **"This code is used to identify the price at which to charge the customer upon renewal of their membership as well as the membership time frame."** **Not cleared on manual cancellation.** |
| Fee | **Display-only** | "the price charged to the customer for the membership program. **While the price is initially set in the `Selling Price` field of Advanced Product Settings, the actual price is the price on the invoice, which may be subject to a discount, etc.**" **Not cleared on manual cancellation.** |
| Terms | **Display-only** | **"the number of months for which the membership will be active. This number comes from the membership product and is used to determine the number of months until the next renewal date."** **Not cleared on manual cancellation.** |
| **Payment Card** | **Last four digits** | "Enter the last four digits of the credit card used to purchase the membership. **If set to renew, this card is charged.**" |
| Revolving Plan | Code | "If a revolving plan should be used for the auto-renewal process, the plan information can be entered here. **A valid and active revolving payment plan for the customer must already exist.**" |
| Store of Purchase | **Display-only** | The selling store where the membership was originally purchased. **Not cleared on manual cancellation.** |
| **Linked Customer Code** | Code | "Enter a **primary customer code** (for a customer who has purchased a membership program) to be assigned. **The customer being updated cannot have an active membership of their own.** The rules regarding the linking of a customer, as defined above in Advanced Customer Settings, apply here." — this is how **household members share one membership**. |
| Accumulate Reward Points | Checkbox | "To allow this customer to accumulate Customer Reward points, check the box. If you leave the box blank, you restrict this customer from participating in the feature." |

**Behavior & rules.**
- **HARD RULE (Cancellation Date automation, exact):** "**If the `Active Member` field is unchecked, this field is updated automatically with the current date.** If a renewal cannot be automatically processed, the **Schedule a Process phantom** updates this field with the processing date. **If a customer purchases a membership, this field is cleared.**"
- **HARD RULE: membership can only be *started* through a sales order** — this screen can end it but not begin it.
- **The renewal price is `Fee`, which is the discounted invoice price, not the product's list `Selling Price`.** So a promotional first-year discount silently becomes the permanent renewal price unless the product's price is used instead. **Flag this — it is a revenue leak by design.**
- **Renewal charges a card identified only by its last four digits.** That cannot be a real payment instrument reference — it implies a lookup against stored tokens (`CUST-027`) at renewal time, with obvious ambiguity if the customer has two cards ending in the same four digits.
- **Renewal Date is derived: Initial/last renewal date + `Terms` months, where `Terms` comes from the membership product.**
- Linking requires the linked-to customer to hold the membership and the linking customer to have none of their own.

**Dependencies.** `CUST-004` Advanced Customer Settings (Point of Sale tab Membership block, `Linked Customer Code`, `Accumulate Reward Points`); Advanced Product Settings (`Selling Price`, membership term); `CUST-022` Membership Discount Schedule; `CUST-027` Credit Cards Already on File (the renewal card); revolving payment plans; **Schedule a Process phantom** (the renewal batch); Customer Reward points; Enter a Sales Order (the only enrolment path); Transaction Codes.

**Build notes.**
- Model membership as a **subscription with a term history**, not a set of display-only fields on the customer: `membership (customer_id, product_id, started_at, term_months, current_period_start, current_period_end, price_cents, auto_renew, payment_token_id, revolving_plan_id, cancelled_at, cancel_reason, source_order_id)` plus `membership_period` rows per renewal. That makes "was this customer a member on 2024-03-12" answerable — required for honouring member pricing on a warranty claim years later.
- **Decide renewal pricing explicitly** rather than inheriting the discounted invoice price. Store `list_price` and `charged_price` separately and renew at a defined rule. `[DECISION NEEDED]`.
- **Never identify a renewal payment method by last-4.** Reference the stored gateway token id from `CUST-027`; last-4 is display only.
- **Auto-renew is a recurring charge**: it needs stored-credential consent, advance notice, and a documented cancellation path (several US states now mandate click-to-cancel style requirements). STORIS's "the only way this setting can be updated is when a customer includes a membership program on a sales order" means **a customer cannot self-serve enrol, but staff can cancel — build a customer-facing cancel path.**
- Linked/household memberships: model as `membership_beneficiary (membership_id, customer_id, added_at, removed_at)`, so entitlement history is auditable and one customer cannot silently inherit benefits after the primary cancels.
- Feed all membership state changes to `RPT-AUDIT`.

---

### `CUST-036` Customer Prefix Settings
*storis_ref: article 15297959787156*

**Purpose.** Creates, updates or deletes **customer abbreviations or titles** (name prefixes). "This screen defines the abbreviations and titles used in the **name prefix** setting in Advanced Customer Settings."

**Where it lives.** Customer > Point of Sale > Settings > Customer Prefix Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | **Up to 5 alphanumeric characters** | The prefix code. Search button selects an existing code for update or delete. |
| Prefix | **Up to 5 alphanumeric characters** | The prefix text itself. Editable when an existing Code is selected. |

**Behavior & rules.**
- **HARD RULE (validation is opt-in, two switches): "To insure that only these prefixes are used when creating or updating a customer, go to the `Customer` tab in the Point of Sale Control Settings and select `Optional` or `Required` in the `Prompt for Name Prefix` field AND check the box for `CUSTOMER ENTRY - Validate Name Prefix`."** — **without both settings, the prefix field on the customer record is free text and this table is decorative.**
- **Deletion is permitted** here (unlike most code tables in this section), with no stated protection for prefixes already in use on customer records. **Deleting a prefix in use will orphan those customer records.**
- `Code` and `Prefix` are both 5 characters and both alphanumeric — the distinction is code vs display text (e.g. `MR` → `Mr.`).

**Dependencies.** `CUST-004` Advanced Customer Settings (General tab → `Prefix`); Point of Sale Control Settings → Customer tab (`Prompt for Name Prefix` = **Optional / Required**, `CUSTOMER ENTRY - Validate Name Prefix`).

**Build notes.** Trivial table (`name_prefix (code, display, sort_order, is_active)`) but **apply the `CUST-018` soft-delete pattern — never hard-delete a code that customer records reference.** Make validation the default rather than an opt-in pair of switches. **Privacy/inclusivity note: honorifics are frequently a gender proxy; keep the field genuinely optional, include a blank and a neutral option, and do not use it to infer gender for marketing segmentation.** Prefix is part of the customer name and therefore within scope of the `PURGE-001` `"REMOVED"` overwrite.

---

### `CUST-037` Customer Price Settings
*storis_ref: article 15242611603220*

**Purpose.** **The customer price matrix.** Creates price matrices based on selected **customer price category × product price code** combinations. **"Sales Order Entry references this file when calculating the default selling price of merchandise on an order."** This is the screen behind steps 3 and 4 of the selling-price resolver (`ITEM-040`/`ITEM-041` in the Inventory handoff pack).

**Where it lives.** Three paths:
- Customer > Point of Sale > Settings > Pricing Settings > Customer Price Settings
- Customer > Settings > Pricing Settings > Customer Price Settings
- System Administration > System Settings > Customer System Settings > Pricing System Settings > Customer Price Settings

Support Files: **Product, Customer.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| **Customer Price Category** | Code | "Enter the **Price Category** code (from the Customer record) for this price matrix ID." This is the `Price Category Code` field on `CUST-004` Point of Sale tab / `CUST-038` Pricing and Commissions. |
| **Product Price Category** | Code | "Enter the **Price Code** (from the Product record) for this price matrix ID." From **Advanced Product Settings**. |
| **Factor** | **Two-decimal percentage OR a dollar amount** | "the factor you want to use when calculating the selling price. You enter either a two-decimal percentage or a dollar amount - **depending on your response at the `Price Matrix Usage Code` field**. That is, **some usage codes require a percentage and some require a dollar amount**." |
| **Price Matrix Usage Code** | Enum | The **formula** for the calculation. "Each usage code consists of a formula that applies the contents of the Factor field in a different way. For example, one usage code multiplies the factor by the base product price, and another subtracts the factor from the base product price." (Full enum lives in the related article **Price Matrix Usage Codes** — not in positions 1–46.) |
| **Use Lowest Price** | Checkbox | Determines **where the system gets the base price** for the calculation. See resolution rules below. **Inactivated by certain usage codes.** |

**Behavior & rules — how the matrix is selected (exact):**
- "When determining whether to apply a customer price matrix calculation, order-entry programs
  1. **identify the customer and then reference the code in the `Price Category` field from the Customer Settings**,
  2. **identify each product on the order and reference the code in the `Price Code` field in the Advanced Product Settings for each.**
  **If a Customer Price Settings record exists that includes both of these codes ... the system applies the price matrix from that record when calculating the default selling price for the order.**"
- **So the customer price category is assigned on the customer record (`CUST-004` / `CUST-038`) and joined to the product's price code to form the matrix key. It is a two-dimensional lookup, exactly like the commission matrix in `CUST-015`.**

**Behavior & rules — base price selection (exact):**
- **`Use Lowest Price` disabled** → "the program uses the price in the **`Selling Price` field in the Advanced Product Settings** for the selected product."
- **`Use Lowest Price` enabled** → "the program **compares the price obtained from the pricing hierarchy with the `Selling Price` field in the Advanced Product Settings** for the selected product **and uses the lesser of the two**."
- **HARD RULE — `Use Lowest Price` is force-inactivated for:**
  - **"usage codes based on cost (for example, `Replacement Cost * Factor`)"**
  - **"usage codes that cause a price increase, including `Price + Factor` and `Price * Factor` (provided the factor is greater than 100)"**

**Behavior & rules — final price resolution (exact, and this is the important one):**
- **"If the price returned by a price matrix calculation exceeds the default selling price, the system applies the higher price. If the price returned is lower than the default selling price, the system compares the price with the previous lowest price (for example, a promotional or markdown price) and applies the lowest price found."**
- **Read that carefully: the matrix is NOT a lowest-price-wins rule. A matrix result above the default selling price WINS and raises the price; a matrix result below the default selling price then competes against promo/markdown and the lowest wins. The rule is asymmetric — upward moves are unconditional, downward moves are contested.**
- **"Prices obtained from the pricing hierarchy can affect (and sometimes override) prices generated from the Customer Price Settings."**

**Behavior & rules — configured products:**
- **"The price matrix is not designed to work with configured products. The Configurator has its own pricing overrides. However, if you set a configured product to use the product master price as its main price instead of the graded price, then the starting price (prior to any add-ons) would be priced using the price matrix settings."**

**Dependencies.** `CUST-004` Advanced Customer Settings (`Price Category Code`) and `CUST-038` Customer Settings (`Price Category`); Advanced Product Settings (`Price Code`, `Selling Price`, `Replacement Cost`); **Price Matrix Usage Codes** article (the formula enum — **not in this third; whoever covers it must capture the full list**); `ITEM-040`/`ITEM-041` selling-price resolver (Inventory pack); Pricing Rules; Price Adjustment Settings; Product Configurator; promotional/markdown pricing; Sales Order Entry.

**Build notes.**
- **This is the single most important article in positions 1–46 for the pricing model.** Capture the resolver as an explicit, ordered, testable pipeline rather than the implicit hierarchy STORIS uses.
- Structure: `customer_price_matrix (customer_price_category, product_price_category, usage_code, factor, use_lowest_price, effective_from, effective_to)` with a composite unique key on the two categories **plus effective dates** (STORIS has none — matrix changes silently reprice everything).
- **Model `factor` as two typed columns (`factor_pct`, `factor_amount`) rather than one polymorphic field whose meaning depends on the usage code.** The STORIS design guarantees data-entry errors.
- **Implement the asymmetric final rule verbatim and test it**, then raise it as a policy question: `[DECISION NEEDED]` — do we want a customer price category to be able to *raise* a price above the product's selling price unconditionally? For a retail mattress business a "price category" that increases price is almost certainly wrong; if we only ever want it to discount, say so and make the resolver monotone.
- **Snapshot the resolution onto the order line**: base price source, matrix record id, usage code, factor, computed price, and every candidate price that lost (promo, markdown, hierarchy). Without that, nobody can answer "why did this line price at $X" — which is the number-one support question in a pricing system.
- Cost-based usage codes (`Replacement Cost * Factor`) mean **a cost change silently reprices open orders**. Decide whether cost is snapshotted at order entry. `[DECISION NEEDED]`.
- **How the category is assigned/defaulted (answering the brief's question directly):** the customer price category is a **plain code field on the customer record, entered manually or defaulted by whatever created the customer**; the article documents **no default value, no derivation from customer type/class, and no validation that the code exists in this matrix file.** A customer with a blank or unmatched price category simply gets no matrix and falls through to the normal pricing hierarchy. **We should do better: make `price_category` a validated FK, give it an explicit system default, and derive it from `customer_type`/`classification` where a rule exists (e.g. Trade/Designer accounts) rather than relying on data entry.** `[DECISION NEEDED]` — LA Mattress must define the price category list and the default assignment rule before migration; getting this wrong misprices every order.

---

### `CUST-038` Customer Settings
*storis_ref: article 15242630128788*

**Purpose.** **The simplified customer master** — the same customer file as `CUST-004` but limited to the **General** and **Point of Sale** tabs. "Use this file to maintain information about your retail customers." This is the screen a salesperson uses; `CUST-004` is the full-access version.

**Where it lives.** **"This option is not available on STORIS standard menus. You must add it to your own menus."** Tabs: **General, Point of Sale.**

**Fields — key**

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer Code | Code | "If creating a new customer, enter a **unique code** to identify this customer." Search button → **Search for a Customer**. |
| Full Name | **Display-only** | "The customer's full name (first name, middle initial, last name) **or the customer's company contact** displays here." |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| **Business** | Checkbox | "indicates that this customer is a company, not an individual... **When you check the box, the `Prefix`, `First Name`, `Middle`, and `Suffix` become inactive; the `Last Name` field becomes the `Business Name` field, and the `Business Contact` field becomes active.**" |
| Business Contact | Text | Main contact for the business. **Inactive unless `Business` is checked.** |
| Prefix | Code | e.g. Dr., Ms., Mr. **"The activation of this field is controlled by the Point of Sale Control Settings, Customer Name Prompts."** Validated against `CUST-036`. |
| First Name | Text | **PII.** |
| Middle | Text | Middle name or initial. Activation controlled by Customer Name Prompts. |
| Last Name / **Business Name** | Text | **Same physical field, relabelled by the `Business` checkbox.** |
| Suffix | Text | "degrees, numerals, or professional status." Activation controlled by Customer Name Prompts. |
| Address 1 | Text | **PII — `PURGE-001` overwrites this with `"REMOVED"`.** |
| Address 2 | Text | **"This field is to be used for P.O. Box, Floor #, Dept., etc., not city, state and zip code."** |
| **Zip Code** | Code | "If the zip code entered exists on the system, **the city and state default from the Zip Code file**. **If the zip code does not exist, a message appears with the option to create a new zip code entry.**" **"If using Automatic Freight Calculation, the system references the customer's zip code when determining delivery charges for an order."** **Retained by `PURGE-001`.** |
| City | Text | Defaults from the Zip Code record; overridable. **Retained by `PURGE-001`.** |
| State | Text | Defaults from the Zip Code record; overridable. **"If the default state and this customer's state differ, it usually indicates an error that should be corrected in the Sales Tax file."** **Retained by `PURGE-001`.** |
| **Home Phone** | Phone, with area code | **"This is an important field, as cross-references can be performed using the home telephone number of the customer during Sales Order entry."** — the primary dedupe/lookup key. **PII.** |
| Work Phone | Phone, with area code | **PII.** |
| Work Extension | Text | Extension for the work phone. |
| Cell Phone | Phone, with area code | **PII.** |
| **Primary Email Address** | Email | "For multiple email addresses, **separate each with a semicolon and no spaces**." **PII.** See the mandatory/default rules below. |
| Additional Email Address | Text area, **up to 99 lines × 50 characters** | "Multiple email addresses are entered one per line and must be in the proper email format (`xxxxxx@xxxx.xxx`). **This field is not used by any STORIS process; it is for informational purposes only.**" |
| Charge Sales Tax | Checkbox | "To charge sales tax to this customer, check the box." **"If you do NOT want the system to calculate sales tax on this customer's sales orders, do NOT select the `Charge Sales Tax` field in this record."** |
| Charge National Sales Tax | Checkbox | **"The field is active only if the National Tax feature is active on your system. The field defaults to 'checked'."** |
| Tax Exempt ID Number | Text, optional | "the sales tax number assigned by the state to this customer." **Sensitive identifier.** |
| Alternate Tax ID | **10-digit code**, display | "used with the **Alternate Tax Interface to Vertex**. It displays the 10-digit code assigned to the taxing area based on the customer's address and zip code. Vertex references this number when determining which tax jurisdictions to use." |

**General tab — Actions menu:** **Add Attachments, Co-applicants, Edit Attachments, Look-up by Serial Number, Look-up by Ship-To Address, Update a Customer Shipping Address, View Attachments.**

**Fields — Point of Sale tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| **Store Assignment** | Code | "The system associates the customer's **deposits and AR balance** with the store you specify here, **regardless of the location at which transactions occur**. **Once AR activity occurs for the customer, you cannot edit this field.**" **"For customers you create on-the-fly, the system automatically assigns the store associated with the order."** **"If the location you specify here has an associated due day, that due day defaults into the `Due Day` field in this routine."** Requires the **`Advanced Customer Settings; Change customer store location`** permission on **Extended Security (Receivables)**. |
| Delivery Instructions | Text | **"The text you enter here defaults into the `Instructions` field on sales and service orders for this customer."** |
| Extended Delivery Instructions | Text | Additional delivery instructions. |
| Account Comments | Text | "account comments on the credit history of the selected customer... **The comments you enter here appear in various routines and inquiries throughout the system, for example the Collector Review - Customer Update Screen.**" |
| **Price Category** | Code | **"Enter the code of the price category you want to use for the selected product when creating price matrices in the `Customer Price Settings`. The Sales Order Entry process references this field in conjunction with the `Price Category` field in the Product file record to access the Price Matrix file. Use of the Price Matrix file allows for different pricing of this product for each customer."** — **this is the price-category assignment point; see `CUST-037`.** |
| **Commission Category** | Code | Used with the Product record's Commission Category to reach the Commission Matrix. **"The default for this field is `Z`."** |
| Commission Percent | Percent | "use this field to enter the percentage you want to use to calculate commissions **when the `Commission Source` field in the Commission Matrix record is set to `Customer`**." |
| Salesperson 1 | Code | Defaults into the `Salesperson` field for this customer's orders **"provided the box is not checked at the `Do Not Default Salesperson` field in the Point of Sale Control Settings."** |
| **Salesperson 1 Percent** | Percent, **up to two decimals** | "**If you do not assign a second salesperson to this customer, enter 100.** If you assign a second salesperson to this customer, **the total percentage for both salespersons must equal 100**." Defaults during order entry but editable via the **Multiple Salesperson Commission Screen**. |
| Salesperson 2 | Code | Second default salesperson. |
| Salesperson 2 Percent | Percent, up to two decimals | **Must sum to 100 with Salesperson 1 Percent.** |

**Point of Sale tab — Actions menu:** **Add Attachments, View Attachment, Edit Attachments, Look-up by Serial Number, Look-up by Ship-To Address.**

**Behavior & rules.**
- **HARD RULE (same customer-numbering trap as `CUST-004`): "New customers created on-the-fly during sales order entry are automatically assigned the sales ticket number as their customer number. For this reason ... do not use numbers that may equal your future sales ticket numbers."**
- **HARD RULE: "The `Receivables` and `Advanced` tabs are not accessible via this routine. To access those tabs, use the Advanced Customer Settings. You can also view the tabs via the `View Advanced Customer Settings` routine."** — **this is the de-facto PII segregation mechanism: SSN / DOB / Driver License live on the Receivables tab, which this screen cannot reach.**
- Creating customers requires **`Advanced Customer Settings; Create new customer`** on **Extended Security (Receivables)**; changing store location requires **`Advanced Customer Settings; Change customer store location`** on the same routine. (Both inert unless the global **Extended Security** switch is on.)
- **Regional Processing** can restrict user access to customer records.
- **HARD RULE (email mandatory logic, exact): "If a default customer email address appears at the `Default Email Address` field on the Advanced tab of the Point of Sale Control Settings, this field is mandatory. If this field is mandatory, and a check appears at the `Load Default Email Address` field on that same tab, the default customer email address defaults into this field whenever a user attempts to exit the Customer Settings without specifying an email address for the customer. If this field is mandatory and a check does NOT appear at the `Load Default Email Address` field, the program requires users to enter an email address for the customer before exiting the routine."** — **`Load Default Email Address` silently stamps a house email address onto real customer records to satisfy a mandatory field. That poisons the marketing list and destroys the ability to distinguish "no email" from "default email".**
- **The `"no email"` convention (exact): "If you enter `no email` here, then if you generate an Excel report of mailing labels that includes the current customer, `no email` appears for the customer in the column where email addresses normally appear, indicating you should contact the customer by a means other than email."** — **a magic string in a data field standing in for a null.**
- **Customer Telephone Number Lookup: "Following entry of either the Home Phone number or Work Phone number for new customers, you can use the Customer Telephone Number Lookup feature to search the web for customer name and address information, by phone number."** — **an outbound reverse-lookup of a customer's phone number against a third-party web service. Flag this: it is a data-sharing event that likely needs disclosure under CCPA/CPRA and is not something we should reproduce without an explicit decision.**
- **`Store Assignment` becomes immutable once AR activity exists** — and it, not the transaction location, owns the customer's deposits and AR balance.
- **`Additional Email Address` (99 lines) is documented as unused by any process** — a data graveyard.

**Dependencies.** `CUST-004` Advanced Customer Settings (the full version; Receivables/Advanced tabs); View Advanced Customer Settings; Search for a Customer; Zip Code file; Sales Tax file; **Vertex** (Alternate Tax Interface); Automatic Freight Calculation; Point of Sale Control Settings (**Customer Name Prompts**, `Default Email Address`, `Load Default Email Address`, `Do Not Default Salesperson`, `Calculation Method`, `Prompt for Name Prefix`, `Validate Name Prefix`); `CUST-036` Customer Prefix Settings; `CUST-037` Customer Price Settings; `CUST-015`/`CUST-016` Commission Settings; Multiple Salesperson Commission Screen; Extended Security (Receivables) (`SEC-*`); Regional Processing; Collector Review - Customer Update Screen; Customer Telephone Number Lookup (external web service); Warehouse/Store Location Settings (store due day); `PURGE-001`.

**Build notes.**
- **Do not build two customer screens.** One customer record, one screen, with **field-level permissions** hiding the PII/AR block from users who lack the right. STORIS's "two screens, one file" approach means the security model is an accident of which menu entry someone has.
- **Kill the magic values.** `"no email"` becomes a real nullable column plus an explicit `email_status` (`NONE_PROVIDED`, `DECLINED`, `BOUNCED`, `VALID`). **Never auto-stamp a default email onto a customer record** — if email is required, block the save with a clear message; if it is not required, allow null.
- Emails: one row per address in `customer_email (customer_id, address, is_primary, verified_at, consent_state)`. **Semicolon-delimited emails in one field and a separate 99-line free-text box are both unusable for marketing and unusable for erasure.** The "Additional Email Address" field is documented as used by nothing — migrate it into the real table and validate.
- Phones: same treatment as `CUST-004` — one child table, E.164 normalized, since Home Phone is the de-facto dedupe key.
- **`Customer Telephone Number Lookup` — `[DECISION NEEDED]`: do not implement third-party reverse phone lookup without a privacy review and, if implemented, log every lookup with the requesting user and purpose.**
- `Store Assignment` immutability: keep the *intent* (AR ownership is stable) but implement as an **auditable transfer** with a GL/AR reassignment, rather than a hard lock that forces data surgery when a store closes.
- Salesperson split validation (must total 100) belongs in the data model as a check constraint over a `customer_salesperson (customer_id, salesperson_id, pct)` child table — which also removes the arbitrary two-salesperson cap.
- `Commission Category` default `Z` — reproduce as an explicit named default, not a magic letter.
- **Attachments** appear on both tabs (`Add/View/Edit Attachments`, paper-clip indicator): attachments on a customer record frequently contain **scanned IDs, tax exemption certificates and credit applications**, i.e. dense PII. **Attachment storage must be encrypted, access-logged, and included in `PURGE-001`.** STORIS's purge as described does not mention attachments at all. **Flag this as a gap.**
- **`Co-applicants` action** (General tab) implies a second person on the account with their own PII — capture it under Part B/C if a dedicated article exists; it must be in the erasure scope too.

---

### `CUST-039` Customer Type Settings
*storis_ref: article 15242630128916*

**Purpose.** Creates and maintains **customer type codes used with the Trade/Designer feature**. "Once you have established these codes, you enter them in the `Customer Type` field on the **Advanced** tab of Advanced Customer Settings for accounts that you want to designate as **Trade** customers."

**Where it lives.** Customer > Point of Sale > Settings > Customer Type Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer Type | **Up to 10 alpha/numeric characters** | The customer type code. Search button → Read-Only Lookup Window. |
| Description | **Up to 30 characters** | Describes this customer type. |
| **Customer Type Usage** | Enum: **`Trade` / `User Defined`** | "select **Trade** if this customer type is being used with the **Trade/Designer functionality**, or select **User Defined** if you are only using this customer type **for reporting purposes**." |

**Behavior & rules.**
- **HARD RULE (referential integrity, but manual): "The system does not permit you to delete a customer type code (via the Delete button on this screen) if it is currently assigned to any customers. Before deleting a code, you should run a Report Builder report to list customers with the customer type code assigned in the `Customer Type` field of Advanced Customer Settings. Once you remove the code from those customer records, you can delete the customer type code from the system using this routine."**
- **`Customer Type Usage` is the switch between functional behaviour (`Trade`) and pure reporting (`User Defined`).** A type marked `Trade` activates Trade/Designer pricing and workflow; `User Defined` is inert.
- **This is the natural place to derive a customer's price category from** — Trade/Designer accounts are exactly the population that should get a different price matrix (`CUST-037`). STORIS does not link them; the two fields are independently keyed.

**Dependencies.** `CUST-004` Advanced Customer Settings (Advanced tab → `Customer Type`); Trade/Designer feature; Report Builder; `CUST-037` Customer Price Settings (the natural but absent link).

**Build notes.** `customer_type (code, description, usage ENUM('TRADE','USER_DEFINED'), is_active, default_price_category)` — **add `default_price_category` so that assigning a customer to a Trade type automatically defaults the price category, closing the gap identified in `CUST-037`.** Enforce referential integrity with a real FK and **soft-delete** (the `CUST-018` pattern) instead of the manual "run a report, clean up by hand, then delete" dance. Note that `Customer Type` is one dimension and `Classification` (also on the Advanced tab) is another, with no documented relationship — `[DECISION NEEDED]`: LA Mattress should decide whether we need both, or a single customer segmentation dimension.

---

### `CUST-040` CVV Prompt
*storis_ref: article 15242406189204*

**Purpose.** A modal window that collects the **CVV number** for a manually-entered credit card, shown after Save on the Credit Card Entry Window.

**Where it lives.** **Credit Card Entry screen > click Save.** "If entry of the CVV number is required, **according to the `Require CVV` setting in your Payment Card and Device Settings**, this window displays after you click Save on the Credit Card Entry Window."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| CVV (Required) | Text | "Enter the CVV number that appears **on the back of the credit card**." |

**Behavior & rules.**
- **HARD RULE: "When you click Save on this window, the processing for the transaction begins."** — **the CVV prompt is the transaction commit point.**
- Gated by **`Require CVV`** in Payment Card and Device Settings; also interacts with **`Prompt for CID`** per card type in `CUST-026`.
- Triggered on **manual card entry**, and per `CUST-027` also after selecting a stored token when CVV is required.

**Dependencies.** Payment Card and Device Settings (`Require CVV`); Credit Card Entry Window; `CUST-026` Credit Card Payment Settings (`Prompt for CID`); `CUST-027` Credit Cards Already on File; `CUST-041` CVV2 Prompt; card authorization service (Shift-4 / Tender Retail).

**Build notes.** **PCI: the CVV/CVC/CID must never be stored, logged, or persisted in any form after authorization — not in the database, not in an application log, not in an error report, not in a screenshot/session replay.** Capture it in a field that is write-only to the gateway SDK and cleared from memory immediately. With a P2PE/tokenizing terminal, CVV is captured by the device and the ERP never sees it — **strongly preferred.** Make "Save begins processing" explicit in the UI (a "Charge $X" button, not a "Save" button) so the operator knows the commit point. `[DECISION NEEDED]` — see `CUST-008`: if we go terminal-tokenized, `CUST-040`/`CUST-041` disappear.

---

### `CUST-041` CVV2 Prompt
*storis_ref: article 34519031274644*

**Purpose.** Collects the customer's **card security data or the last four digits of their SSN** when entering or updating a **financing payment**. Distinct from `CUST-040` — this one sits in the financing flow, not the ordinary card-payment flow.

**Where it lives.** Three entry points:
- Enter a Sales Order > Financing Payment > Finance Receivable Entry > CVV2 Prompt
- Complete a Delivery Manifest
- Update Financing Credit Approvals

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| CVV | Text | "the CVV security code on the back of the customer's card." |
| Expiration Date (MMYY) | **MMYY** | The card expiration date. |
| **Last 4 Digits SSN** | 4 digits | **"This is an optional field if the CVV and expiration date are not entered."** — i.e. **SSN last-4 is an alternative authenticator to CVV+expiry.** |

**Behavior & rules.**
- **HARD RULE — silent fallback to stored SSN (exact): "If financing with Synchrony, the last four digits entered are passed to the Synchrony database, if no digits are entered and the customer's social security number is on file, the last four digits in the STORIS database are passed to Synchrony."** — **if the operator leaves the field blank, STORIS silently transmits the last four digits of the SSN it already holds to a third party. The customer is never prompted and no consent step is documented.**
- This is a **PII-transmitting screen**: SSN last-4 leaves the system.
- The choice between "CVV + expiry" and "SSN last-4" is a **cardholder-vs-borrower authentication switch** depending on the financing product.

**Dependencies.** `CUST-004` Advanced Customer Settings (Receivables tab → PII → `Social Security Number`); Synchrony financing integration; Finance Receivable Entry; Complete a Delivery Manifest; Update Financing Credit Approvals; `CUST-040` CVV Prompt; `CUST-026` Credit Card Payment Settings; Extended Security → `View encrypted finance, credit card, check account numbers`.

**Build notes.**
- **Do not implement the silent SSN fallback.** If a lender requires SSN last-4, it must be an **explicit, logged decision by the operator**, with the stored value surfaced as "use SSN on file (••••1234)?" and the transmission recorded in `RPT-AUDIT` / the decryption-activity log. Automatically shipping identity data to a third party because a field was left empty is exactly the kind of behaviour we are migrating away from.
- **CVV must never persist** (see `CUST-040`).
- Add **`ssn`, `ssn_last4`** to the PII inventory and to `PURGE-001`'s erasure scope — the current purge routine (name + billing address 1 → `"REMOVED"`) does not touch SSN at all, which is the single biggest gap in the erasure design.
- Note the multi-entry-point pattern: the same prompt is reachable from delivery and from credit-approval maintenance, so **PII capture is not confined to the sales desk** — permission checks must be on the operation, not the screen.

---

### `CUST-042` Debit Card Overview
*storis_ref: article 15242390516884*

**Purpose.** Explains how **Debit Card Processing** works in STORIS — the prerequisites, the swipe-only rule, PIN handling, and the refund restrictions.

**Where it lives.** Conceptual overview article (no screen of its own). Configuration lives in **Credit Card Validation Settings** and `CUST-043` Debit Card Payment Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (no fields — overview article) | — | Prerequisites: **`Authorization Service` = `PPI` (Payment Processing, Inc.) or `TSYS` (VISANET)** in Credit Card Validation Settings, plus **the proper merchant ID number set up in STORIS for PPI or TSYS.** |

**Behavior & rules.**
- **HARD RULE: "You must swipe debit cards. STORIS treats all cards you enter manually as credit cards. If you try to manually enter a debit card, an error message appears and the system rejects the transaction."**
- **HARD RULE (PIN handling — this is the correct security posture): "STORIS captures the encrypted PIN and forwards it to the clearing house along with the Derived Unique Key Per Transaction (DUKPT). This data is not stored in any STORIS file, nor is the transaction 'batched' or stored and sent in a batch after the re-establishment of communication ... If the communication port is not available and/or no response is returned to the authorization program, debit card transactions fail and send a reversal."** — **no offline debit, ever; failure produces a reversal.**
- "STORIS initiates the PIN pad prompting at payment entry time if the card that has been swiped is a **Visa, MasterCard, or an unidentified card type**."
- "**The transaction amount is sent to the PIN pad device as a requirement of Debit Card Processing.** Once confirmed as a debit transaction at the PIN pad by the customer and the PIN code has been entered, the data is returned to the Debit Card Payment Entry Window."
- **`Enter`/`Credit` button: "Upon first display, the button says `Credit`. If you enter a PIN, the button switches to `Enter`."** — entering a PIN is what converts the transaction from credit to debit.
- "The payment entry routine checks for PIN pad data and if present, processes the entry as a debit card **with a payment type of `DEBIT`** and **stores the debit card data in memory (this data is never written to file)** until the update / credit card authorization process completes."
- **HARD RULE: "If successful, the authorization number is updated and no further changes are allowed for the debit transaction."**
- "If you **void an order prior to initial filing**, STORIS clears the PIN pad data from memory."
- **HARD RULE (refunds): "If you cancel the order after the initial filing, the system treats credits to debit card accounts as refunds. You must enter the debit card and PIN number prior to issuing the refund. You can also refund cash for the amount of the debit transaction."**
- **HARD RULE (post-invoice refunds are impossible): "STORIS does not permit debit card refunds once the order has been delivered (invoiced). In this instance, you must issue a refund check or a cash refund if a refund is required."** — **a hard operational constraint with real customer-service consequences: a mattress returned after delivery cannot be refunded to the debit card it was paid with.**
- **"Debit Card Processing uses Payment Class 6."**
- **HARD RULE (online/offline location split): "If a company uses online processing, debit payment type is not accepted at any locations that are not processing online. If the company is not using online processing, debit payment type is accepted at all locations."**

**Dependencies.** Credit Card Validation Settings (`Authorization Service` = PPI / TSYS, merchant ID); `CUST-043` Debit Card Payment Settings; PIN pad / Signature Capture device; `CUST-008` Card Length Format Action; payment class definitions (`CUST-005` C8 payment class list includes **Debit Cards**); Warehouse/Store Location Settings (online processing per location).

**Build notes.** **Keep the strong parts verbatim: swipe/dip only, DUKPT-encrypted PIN never stored, no offline/store-and-forward, failed comms → reversal.** Those are correct and non-negotiable. **Fix the refund story:** modern debit networks support post-settlement refunds to the original card via the gateway; the "no refund after invoice" rule is a limitation of an old integration, not of debit. Build refunds as **linked credits against the original authorization/token**, with cash/check as a fallback only. Record `payment_class = 6` (or our equivalent enum) explicitly so reporting matches history. Model the online/offline location rule as a **capability flag per location** with a clear operator message rather than a silent absence of the payment type. `[DECISION NEEDED]` — PPI and TSYS/VISANET are legacy; confirm the actual processor LA Mattress will use and build to that gateway's SDK.

---

### `CUST-043` Debit Card Payment Settings
*storis_ref: article 15242630128404*

**Purpose.** Creates and maintains **debit card payment types** used by Sales Order Entry and Receivables programs when applying deposits and payments to orders and receivables.

**Where it lives.** Nine paths, mirroring `CUST-026` (Accounts Receivables / Financing / General Ledger System Settings, and the Accounting > … > Settings equivalents), ending in Debit Card Payment Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Payment Type Code | Code | "For example, you may want to create a payment type called **Visa** and another called **National Bank**." Actions button lists available payment types. |
| Description | Text | "The description displays typically on screens that require you specify a payment type." |
| Activation Date | Date | Earliest date users can use this payment type. **"If you leave this field blank, the system does not perform an 'earliest date' check."** |
| Expiration Date | Date | Latest date users can use this payment type. **"If you leave this field blank, the system does not perform a 'latest date' check."** |
| Receivables GL Account | GL Account | Actions button → **TPA GL Account Entry**. **"If the TPA (General Ledger account) module is active, this field is mandatory and is validated against the chart of accounts."** |
| External Processor Code | **Up to two alphanumeric characters** | **"This field is active only if a check appears at the `Credit Card Transactions` field on the `Legacy Signature` field in Payment Card and Device Settings."** **HARD RULE: "you can assign external processor codes to only one STORIS payment type at a time."** Supported: **Tender Retail and Shift-4.** |
| Authorization Prompt | Enum: **Mandatory / Optional** | **`Mandatory`** – entry of an authorization number is mandatory. **`Optional`** – the authorization field is available but entry is optional. |
| Actions → **Debit Card Number Full Display** | Action | **"If the option is active, you can view the full number."** |

**Behavior & rules.**
- Restates the `CUST-042` rules: **debit cards must be swiped**, manual entry is treated as credit, the PIN pad button flips **`Credit` → `Enter`** once a PIN is entered, and **post-initial-filing cancellations are handled as refunds requiring card + PIN (or cash).**
- **HARD RULE (location gating): "If a company uses online processing, debit payment type is not accepted at any locations that are not processing online. If the company is not using online processing, debit payment type is accepted at all locations."**
- **Card Swipe button diagnostics (exact): "If the Card Swipe button is not active, either your swipe device is not connected properly, Signature Capture is not active on your system, or both."**
- **Blank activation/expiration means "no check" — not "never valid".** Note this differs in wording from `CUST-010`/`CUST-011`/`CUST-026`, where the same fields are described only as restricting; here the blank behaviour is stated explicitly. Assume the same semantics across all four.
- **SECURITY FLAG: `Debit Card Number Full Display` exposes the full card number from the payment-type maintenance screen's Actions menu.** This directly contradicts the `CUST-042` claim that debit card data "is never written to file" — **if the full number can be displayed, it is stored somewhere.** Contradiction to raise.

**Dependencies.** `CUST-042` Debit Card Overview; Payment Card and Device Settings (`Credit Card Transactions` on `Legacy Signature`); TPA / General Ledger chart of accounts; Tender Retail / Shift-4; Signature Capture device; Warehouse/Store Location Settings (online processing); `CUST-005` (Debit Cards is a C8 payment class); `CUST-026` Credit Card Payment Settings.

**Build notes.** Fold into the single polymorphic `payment_type` model proposed at `CUST-010`. **Do not implement any "full card number display" action** — with tokenization there is nothing to display; last-4 plus brand is the maximum. **Raise the contradiction between "never written to file" and "Debit Card Number Full Display" with STORIS/the migration team before trusting either statement; if PANs exist in the legacy database, the migration must not carry them over — extract, tokenize at the gateway, and discard.** Make blank activation/expiration explicitly `NULL = unbounded` in the schema. `External Processor Code` uniqueness = a real unique constraint.

---

### `CUST-044` Desjardins Configuration
*storis_ref: article 15242610006676*

**Purpose.** Configures a **Desjardins line-of-credit card payment type** for **Accord D** transactions. "The requirements ... are unique because they **qualify the payment type as using the consumer's line of reserved credit**." Tells Desjardins what payment plan is being used, the plan number, and related parameters.

**Where it lives.** **`CUST-026` Credit Card Payment Settings > Actions button > Desjardins Configuration.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| **Deferred Payments** | Checkbox | Checked = the payment type includes **a number of deferred payments** → **`Grace Period in Months` becomes required.** Blank = **an equal number of payments over a period of months only (no deferred payments)** → **`Number of Payments in Months` becomes required.** |
| **Limit Use to Stores** | Multi-select, **mandatory** | One or more store locations where this payment type can be used. Search → **Multiple Selection Lookup Window**; Action → **Multiple Location Selection Window**. **"The locations you select at this field must be configured as Tender Retail locations using a Desjardins server."** |
| **Plan Number** | **Up to three characters**, **mandatory** | "the number assigned to this Accord D plan, **as supplied by Desjardins**." |
| Grace Period in Months | **Numeric 1–99** | Required when `Deferred Payments` is checked. Months payments are deferred. |
| Number of Payments in Months | **Numeric 1–99** | Required when `Deferred Payments` is blank. Number of monthly payments required on purchases using this plan. |
| Actions → Payment Commissions Adjustments | Action | Adjusts commissions for this payment plan. |

**Behavior & rules.**
- **The two mode fields are mutually exclusive and each is conditionally mandatory** — deferred (grace months) XOR equal-payment (number of months). There is no "both" and no "neither".
- **`Limit Use to Stores` is mandatory** and carries an unenforced external precondition: **the selected locations must already be Tender Retail locations on a Desjardins server.** Nothing in the screen validates that.
- Per `CUST-026`: **"If you are setting up a payment type for use with Accord D, it is strongly recommended that the code you enter here [External Processor Code] matches the Payment Type Code."**
- **Commission interaction:** deferred/promotional financing plans typically carry a merchant fee, and the `Payment Commissions Adjustments` action exists to claw that back from commission — **capture that rule wherever the commission engine is specified (`CUST-015`).**

**Dependencies.** `CUST-026` Credit Card Payment Settings (parent screen, `External Processor Code`); Tender Retail; Desjardins Accord D; Warehouse/Store Location Settings; `CUST-015` Commission Settings (Payment Commissions Adjustments); `CUST-019` Contract Classification Settings (plan tiers).

**Build notes.** **Desjardins/Accord D is Canadian — almost certainly out of scope for LA Mattress.** `[DECISION NEEDED]` — confirm and, if out of scope, do not port. **The generalizable pattern worth keeping is: a payment type can carry a promotional-financing plan definition (deferred months XOR equal payments, plan id, eligible locations) plus a commission adjustment.** That maps directly onto US promo-financing (Synchrony/Wells Fargo "12 months no interest"), which LA Mattress almost certainly does run. Model it as `promo_finance_plan (provider, plan_code, mode ENUM('DEFERRED','EQUAL_PAY'), months, eligible_location_ids[], merchant_fee_pct, commission_adjustment_rule)` and validate the location precondition at save time by querying the gateway configuration rather than trusting the operator.

---

### `CUST-045` Enable VISA Credit Card Rules
*storis_ref: article 15242390515860*

**Purpose.** Enforces **VISA's rules prohibiting use of a VISA credit card to pay interest-bearing debt.** "Enforcing VISA rules is activated at the store/warehouse level via the **`Enable VISA Rules for Payment of Extended Receivables`** setting in Warehouse/Store Location Settings."

**Where it lives.** Setting on the **Credit Card page of Warehouse/Store Location Settings**; the behaviour manifests in payment entry.

**Key definition — HARD RULE:** **"Extended Receivables in STORIS is defined as an MMP due for Revolving, a payment due for Installment, or an Addpay or Prepay on a Revolving plan or Installment Contract."**

**Fields / setup steps (in the required order)**

| Step | Where | Purpose / business rule |
|---|---|---|
| 1 | **Payment Card and Device Settings → BIN/IIN File page** | "store the information needed to download and process a BIN/IIN file." |
| 2 | **Import BIN/IIN Table** | "acquire, parse and load a file received from the designated 3rd party provider of the BIN/IIN data." |
| 3 | **Warehouse/Store Location Settings → Credit Card page → authorization Actions** | "obtain access tokens." |
| 4 | **Warehouse/Store Location Settings → Credit Card page** | Check **`Enable VISA Rules for Payment of Extended Receivables`**. |

**Behavior & rules.**
- **HARD RULE: "If a location is not set up properly (all of the above settings), and you are entering a payment against an extended receivables transaction, access to the process is not allowed until all setup has been completed."**
- **Swipe-only for extended receivables: "For in-store payments on a customer's extended receivables account, the Shift4 payment terminal is restricted to card swiping only, even for chip-enabled cards."** Shift4 reads the swipe, determines if the card is a VISA credit card, and **"returns a message indicating that VISA credit cards are not accepted for this type of transaction."**
- **"Note that VISA-backed debit cards are still allowed in these situations."**
- **"This feature is available for the Shift4 platform only and applies only to VISA credit cards."**
- **Token routing — three different Shift4 access tokens (exact):**
  - **not an extended receivables payment** → the token from the **Shift4 Authorization** screen
  - **extended receivable + swipe transaction** → the token from the **Shift4 Extended Receivables Authorization** screen
  - **extended receivable + manual or card-on-file authorization** → the token from the **Shift4 Extended Receivables MOTO Authorization** screen
- **Shift4 side: "When swiping the card for an extended receivables payment with the VISA rules enforced, Shift4 does not approve the payment. When non-swipe (manual or card on file) payments are made, the process uses the `BIN.TABLE` to determine if the card's BIN is present. If it is, STORIS stops with an error. If it is not in the `BIN.TABLE`, it goes through the Extended Receivables MOTO access token. The Shift4 merchant ID for this token is set up to accept VISA."**
- **Access gating in Enter a Customer Payment/Refund/Gift Certificate: "the process checks the `Enable VISA Rules...` setting ... then checks for the existence of an extended receivables client access token and the existence of the BIN/IIN table. If one of these is not present, an error message is displayed and you are prevented from accessing the `Process Receivables` tab. All access to this tab is restricted until the settings are correctly updated."**
- **HARD RULE and a significant customer-experience trap (exact): "Once a customer code has been entered on this screen and before any payment is taken, all of the available open items are analyzed to determine if any of them are considered Extended Receivables. If it is determined that there are no Extended Receivables in the list of items available to pay (including Addpay and Prepay), payment is accepted without checking to see if VISA rules are being enforced. If there are any Extended Receivable items in the open items list (including Addpay and Prepay), *regardless of the consumer's intent to pay for those items*, this process evaluates the setting..."** — **the mere presence of an extended-receivable open item blocks VISA credit acceptance for the whole payment session, even when the customer is paying for something else entirely.**

**Dependencies.** Warehouse/Store Location Settings → Credit Card page (`Enable VISA Rules for Payment of Extended Receivables`, authorization Actions/access tokens); Payment Card and Device Settings → BIN/IIN File page; Import BIN/IIN Table (3rd-party BIN data provider); `BIN.TABLE`; Shift4 (Authorization / Extended Receivables Authorization / Extended Receivables MOTO Authorization screens and merchant IDs); Enter a Customer Payment/Refund/Gift Certificate (Process Receivables tab); Revolving and Installment modules (MMP, Addpay, Prepay); `CUST-008` Card Length Format Action; `CUST-026` Credit Card Payment Settings.

**Build notes.** **Only relevant if LA Mattress carries its own interest-bearing receivables.** `[DECISION NEEDED]` — if all financing is third-party (Synchrony et al.), the card network rule does not bite and this is out of scope. If we do carry paper: implement the check **at the item level, not the session level** — evaluate the specific open items the customer is actually paying, not the whole open-item list. STORIS's "regardless of the consumer's intent" behaviour will produce declined VISA payments on ordinary merchandise, which is a real revenue and CX loss. Maintain the BIN/IIN table as a **scheduled automated refresh with staleness monitoring** (a stale BIN table silently mis-routes payments), and treat missing token/table as a **loud configuration alarm**, not a blocked tab a cashier discovers mid-transaction. Record on every payment which rule path and which merchant token was used, for chargeback defence.

---

### `CUST-046` Enter Customer's Date of Birth
*storis_ref: article 15242594734612*

**Purpose.** A single-field modal that captures the **customer's date of birth** when a new customer is created from within order entry.

**Where it lives.** **Enter a Sales Order or Enter a Quick Sale > `Customer` field > click the Action button to `Create a New Customer`.** "This screen appears **if `Require Date of Birth` is selected on the `Customer` tab in the Point of Sale Control Settings** and you are creating a new customer via the Enter a Sales Order or Enter a Quick Sale process."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| MM/DD/YYYY | Date, format **MM/DD/YYYY** | "Enter the customer's date of birth in this field." **PII — DOB is one of the three fields STORIS itself files under "Personally Identifiable Information" on the `CUST-004` Receivables tab.** |

**Behavior & rules.**
- Gated entirely by **`Require Date of Birth`** on the **Customer** tab of Point of Sale Control Settings.
- **Notable interaction with the tab-level PII segregation in `CUST-038`:** DOB normally lives on the **Receivables** tab, which the simplified Customer Settings screen cannot reach — **but this prompt collects it from within ordinary order entry, so a salesperson who cannot view the PII tab can still create the DOB value.** Combined with the wave-1 finding that **masking applies only on re-access**, the person who typed it continues to see it.
- No validation rules (minimum age, plausibility, future dates) are documented.

**Dependencies.** Point of Sale Control Settings → Customer tab → `Require Date of Birth`; Enter a Sales Order; Enter a Quick Sale; `CUST-004` Advanced Customer Settings (Receivables tab → PII → `Date of Birth`); `CUST-023` Credit Application Settings; `PURGE-001`; Extended Security / PII view permissions.

**Build notes.**
- **Ask why before collecting.** DOB is high-value PII with narrow legitimate uses (credit application identity verification, age-restricted purchase, birthday marketing). **If we are not running in-house credit, do not collect DOB at point of sale at all** — and if we do, capture the *purpose* alongside the value. `[DECISION NEEDED]`.
- Validate: not in the future, plausible age range (e.g. 16–120), and reject obvious placeholder values (01/01/1900) which is what mandatory-field pressure always produces.
- **Store encrypted, mask on every render including the entering user's session, log every decrypt.** Add DOB to the `PURGE-001` erasure scope — the current routine does not touch it.
- If the only need is age verification, store a **derived boolean/`age_verified_at`** rather than the date itself. That is a strictly better privacy posture and satisfies the usual business need.

---

## `[DECISION NEEDED]` items — Customer Settings Part A

Collected from the entries above, grouped by theme.

### Scope gates (answer these first — several whole families depend on them)
1. **Do we furnish data to credit bureaus / run in-house revolving credit?** If not, `CUST-001` (Metro 2 account status), `CUST-017` (Metro 2 compliance conditions), `CUST-024`, `CUST-025`, `CUST-029`, `CUST-030`, `CUST-031`, and the Metro 2 half of `CUST-033` are all out of scope for v1.
2. **Do we carry in-house installment contracts?** If not, `CUST-018` and `CUST-019` drop out.
3. **Do we carry interest-bearing extended receivables?** If not, `CUST-045` (VISA rules) does not apply.
4. **Do we run a paid membership program?** If not, `CUST-022` and `CUST-035` defer.
5. **Do we do in-house collections or refer to an agency?** Determines whether `CUST-013`/`CUST-014` are workflows or an export interface.
6. **Do we still accept paper checks in-store?** Determines whether `CUST-011` and its driver's-license PII capture exist at all.
7. **Is Desjardins/Accord D (`CUST-044`) relevant?** Almost certainly not — but the promotional-financing pattern behind it is.
8. **Which payment gateway?** If it is a tokenizing/P2PE gateway, `CUST-008`, `CUST-040`, `CUST-041`, `CUST-042`, `CUST-043` and `CUST-045` collapse to gateway configuration and most PCI scope disappears. PPI/TSYS/VISANET named in `CUST-042` are legacy.
9. **Do we need positive pay and virtual cards (`CUST-007`)?** And is AP disbursement ACH-only (which would let us skip most of `CUST-020`)?

### Data model / identity
10. **Merge semantics must be reconciled.** The interactive merge on `CUST-004` writes only `Merge Details — Status / By / Merge To` with **no timestamp and no before-image**. The separate merge-import pack describes the import path. **If those two paths differ we have two merge semantics — pick one, and make it an event with a field-level before-image and a reversal path.**
11. **Do we need both `Customer Type` (`CUST-039`) and `Classification` (`CUST-004` Advanced tab)?** They are independent dimensions with no documented relationship.
12. **Customer price category: define the list and the default assignment rule before migration** (`CUST-037`, `CUST-039`). STORIS has no default, no derivation, and no validation that the code exists.
13. **Should a customer price category be able to *raise* a price?** STORIS's rule is asymmetric: a matrix result **above** the default selling price wins unconditionally; a result **below** it must beat promo/markdown. For retail this is probably wrong — decide and make the resolver monotone if so (`CUST-037`).
14. **Is cost snapshotted at order entry?** Cost-based price-matrix usage codes (`Replacement Cost * Factor`) otherwise reprice open orders when cost changes (`CUST-037`).
15. **Commission: pick one calculation-method family up front** (customer matrix vs salesperson matrix vs tiered gross profit). STORIS makes them mutually exclusive and switching is a maintenance-window event (`CUST-015`).

### Privacy, PII and erasure
16. **`PURGE-001`'s field list is far too narrow.** It overwrites **name** and **billing address line 1** with `"REMOVED"` and deliberately retains city/state/ZIP. Everything else we found in positions 1–46 is untouched: **SSN, SSN last-4, Date of Birth, Driver License Number, all phone numbers, all email addresses (primary, additional, and the 99-line free-text box), tax exempt ID / alternate tax ID, employee ID, finance account numbers, eSTORIS website password, stored card tokens (`CUST-027`), credit and fraud scores (`CUST-025`), customer attachments (scanned IDs, exemption certificates, credit applications — `CUST-038`), and co-applicant records.** Decide the full erasure scope.
17. **Confirm with counsel that retaining city + state + ZIP alongside purchase history meets the de-identification standard** we are claiming (`CUST-004`).
18. **Credit applications carry statutory retention (ECOA ~25 months, longer with adverse action) that conflicts with customer erasure.** Define which records are legal-hold-exempt (`CUST-023`).
19. **Third-party reverse phone lookup (`Customer Telephone Number Lookup`, `CUST-038`) sends a customer's phone number to an external web service.** Privacy review required before implementing; if implemented, log every lookup with user and purpose.
20. **Do not implement the Synchrony silent SSN fallback (`CUST-041`).** Confirm the lender's actual requirement and make transmission explicit and logged.
21. **Should the legal/risk banner (`CUST-034`) be acknowledgeable-and-logged?** For bankruptcy and cease-communication flags, a recorded acknowledgement is useful evidence.
22. **Is DOB collection at POS justified (`CUST-046`)?** If the need is age verification, store a derived flag instead of the date.
23. **Confirm whether PANs exist in the legacy database.** `CUST-042` says debit card data "is never written to file" while `CUST-043` offers a **`Debit Card Number Full Display`** action. **These cannot both be true — resolve before migration and do not carry PANs across.**

### Business policy
24. **"Most beneficial to the customer" vs "most beneficial to margin"** — STORIS's undocumented discount optimizer silently chose the former (`CUST-021`). Choose explicitly.
25. **Membership renewal pricing (`CUST-035`)**: STORIS renews at the discounted invoice price, not list. Decide the renewal-price rule.
26. **Do we want the C8 payment-verification hold at all (`CUST-005`), and should it hold the order or only flag it for review?** Plus the C8 threshold amount and lookback window.
27. **Deposit-type-blank silently drops a payment class from bank reconciliation (`CUST-007`).** We should fail loudly on an unmapped payment class instead — confirm.
28. **Obtain the real definition of the `Taxable Merchandise` / alternate-calculation setting currently in force (`CUST-006`)**, and decide whether the ERP or the tax engine owns price-threshold taxability. Both applying it will double-exempt.
29. **Reason codes are referenced by `CUST-029` but defined nowhere in positions 1–46** — locate the reason-code table before building the credit-review state machine.
30. **`Legal Code Settings` is not in positions 1–46 but holds the real side-effect matrix behind `CUST-033`/`CUST-034`** (close account / hold statements / exclude from mail and email / Metro 2 codes). Whoever covers it must document each code's side effects.
31. **`Price Matrix Usage Codes` is not in positions 1–46** but holds the full formula enum behind `CUST-037` — the single most important missing piece for the pricing model. Must be captured.

---

## Cross-cutting findings for the architecture team

- **Overwrite-destroys-history is the dominant anti-pattern in the customer master**, and it is not confined to demographics. Confirmed instances in positions 1–46: `Referred By` (marketing attribution, `CUST-004`), User Defined Settings responses (`CUST-004`), `Credit Source` (provenance label that is also the primary key, `CUST-031`), lead probability code (`CUST-012`), legal codes (a `Date Added` but no `Date Removed`, `CUST-034`), collector assignment (`CUST-014`), and every address field (`CUST-004`/`CUST-038`). **In every one of these we should append, not overwrite.**
- **Address history in particular must be explicitly versioned.** STORIS retains address history only incidentally, through order/invoice snapshots. **Warranty lookback happens years after delivery** and must resolve "where was this delivered in 2019" — so `customer_address` needs `valid_from`/`valid_to` and every order must snapshot its ship-to.
- **PII masking on re-access only (wave 1) is compounded here**: `CUST-046` and `CUST-041` let staff who cannot open the PII tab still *create* PII values, and then keep seeing them.
- **Global encryption toggles that bulk-decrypt** appear again as `Encrypt Credit Scores` in General System Control Settings (`CUST-025`). Same treatment as wave 1: no off switch, never bulk-decrypt.
- **Configuration screens that perform bulk data mutations** are a recurring hazard: `Automatic Charge-Off` on an alert code writes off every customer holding that code (`CUST-032`); changing a collector's criteria re-routes every assigned account (`CUST-014`); `Error Logging` unchecking offers to delete all credit logs (`CUST-025`). **Every one of these needs an impact preview, a permission, and an audit record.**
- **`RPT-AUDIT` feed candidates from this third:** all customer master field changes, merges, PII decrypt events, legal-flag apply/remove, alert-code apply/remove and charge-off batches, collector reassignment, commission and price-matrix rule changes, credit decisions and status transitions, card token add/use/revoke, bank account/routing edits, and every configuration change that triggers a bulk mutation.

---

*End of Part A (positions 1–46, `CUST-001`–`CUST-046`). All 46 articles were read in full; none were unreadable. Two articles (`CUST-006`, `CUST-009`) initially appeared empty due to an extraction artifact and were re-fetched and written up in full.*
