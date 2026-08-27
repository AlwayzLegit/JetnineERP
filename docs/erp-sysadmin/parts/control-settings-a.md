# System Control Settings — Part A (positions 1–44)

*Section: System Control Settings, `15172950973716` (87 articles total). This part covers the **first 44**
articles in section enumeration order (alphabetical as the Zendesk section lists them).*

**Prefix:** `SCS` · **ID range:** `SCS-001` … `SCS-044`
**Split point:** this part ends at **"Legal Code Settings"** (position 44). The second-half agent starts at
position 45, **"Maintain Credit Application Letter Print UNC Path"**, numbered `SCS-045`.

## Audit — exactly which articles positions 1–44 are

| # | Req ID | Article ID | Title |
|---|---|---|---|
| 1 | SCS-001 | 15186452330644 | Account Statement Cycling Control Settings |
| 2 | SCS-002 | 15186452327572 | Accounts Receivable Control Settings |
| 3 | SCS-003 | 15186416510612 | Add Product Attribute |
| 4 | SCS-004 | 15186451010836 | Add Text |
| 5 | SCS-005 | 15186451011092 | Add-on Calculation Process |
| 6 | SCS-006 | 15186501542164 | Alternate Tax Interface Control Settings |
| 7 | SCS-007 | 15186452328468 | API Control Settings |
| 8 | SCS-008 | 20139429218196 | Ashley Custom Cost Formula |
| 9 | SCS-009 | 15186451010708 | Automatic Transfers |
| 10 | SCS-010 | 15186416511636 | Bar Code Add-On Settings |
| 11 | SCS-011 | 15186501558292 | Bar Code Control Settings |
| 12 | SCS-012 | 15186452327700 | Cash Balancing Control Settings |
| 13 | SCS-013 | 15186416511124 | Check-Levels for Exceptions |
| 14 | SCS-014 | 15186501540756 | Collections Processing Control Settings |
| 15 | SCS-015 | 15186416511252 | Commission Calculation Code Options |
| 16 | SCS-016 | 15186501540884 | Costing Control Settings |
| 17 | SCS-017 | 15186501753876 | Credit Application Control Settings |
| 18 | SCS-018 | 15186452549524 | Customer Rewards Control Settings |
| 19 | SCS-019 | 15186501538708 | Customer's Own Materials (COM) Control Settings |
| 20 | SCS-020 | 15186452533012 | D-Tools System Control Settings |
| 21 | SCS-021 | 15186501753492 | Data Warehouse Control Settings |
| 22 | SCS-022 | 15186451247636 | Default Check Print Bank |
| 23 | SCS-023 | 15186416725012 | Default Due Day Table |
| 24 | SCS-024 | 15186451246228 | Default Store/District Assignments - Collections |
| 25 | SCS-025 | 15186416721684 | Deferment Fee Table |
| 26 | SCS-026 | 15186416719508 | Demographic Information Screen |
| 27 | SCS-027 | 15186452537748 | Demographics Control Settings |
| 28 | SCS-028 | 15186451511828 | Due Date List Entry |
| 29 | SCS-029 | 15186416970132 | eBridge Commerce Credit Revew Queue Retention Days |
| 30 | SCS-030 | 15186501753236 | EDI Control Settings |
| 31 | SCS-031 | 15186501753620 | Electronic Check Processing Control Settings |
| 32 | SCS-032 | 15186452535572 | Enter Quick Purchase Orders |
| 33 | SCS-033 | 15186452536468 | eSTORIS Control Settings |
| 34 | SCS-034 | 16918023610516 | Event Notification Control |
| 35 | SCS-035 | 15186452794644 | External Communications Settings |
| 36 | SCS-036 | 15186501985172 | Financing Control Settings |
| 37 | SCS-037 | 15186501980436 | General Ledger Control Settings |
| 38 | SCS-038 | 15186501982740 | General System Control Settings |
| 39 | SCS-039 | 15186416971540 | Hi/Lo Gross Profit Option |
| 40 | SCS-040 | 15186452790804 | Import BIN/IIN Table |
| 41 | SCS-041 | 15186416978452 | Import Document Print |
| 42 | SCS-042 | 15186452792724 | Installment Receivables Control Settings |
| 43 | SCS-043 | 15186452794132 | Inventory Control Settings |
| 44 | SCS-044 | 15186501982868 | Legal Code Settings |

> Conventions used below: **[GUARDED]** = changing this while certain state exists is unsafe;
> **[CONFLICT]** = contradicts or duplicates another setting; **[REUSE]** = already registered in the
> Inventory handoff pack (`/root/storis-inventory-handoff/09-control-settings.md`) — reuse that ID.
> "(LOCKED - STORIS access ONLY!)" is quoted verbatim from the source and means the field is vendor-locked
> in STORIS; for us it means *the setting exists but end users must not be able to edit it*.

---

### `SCS-001` Account Statement Cycling Control Settings
*storis_ref: article 15186452330644*

**Purpose.** Master settings for the Accounts Receivable **cycling** process — when accounts are cycled,
what statements look like, which statements are suppressed, dunning-message text by aging bucket, and XML
statement export. Read by End of Day (EOD) cycling and by the manual statement-print routines.

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Accounts Receivables System Settings > Account Statement Cycling Control Settings`. Tabs: **General, Messages, Advanced**.
Statement forms print via **Enhanced Laser Forms**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Number of Grace Days | int (days) | **(LOCKED - STORIS access ONLY!)** Days before service charges are assessed. "The program adds the grace days to the due date, which then determines when to calculate interest and when to add service charges." |
| Statement History Retention | int (count) | Number of statements retained in history **per account**. |
| Statement Sort | enum | **(LOCKED - STORIS access ONLY!)** `Zip Code` \| `Account Name` \| `Account Number`. |
| Print Purchase Detail | bool | Prints line-item detail per product on the statement: `delivery charges`, `installation charges`, `sales tax`, `invoice total`. **If an open balance exists on an invoice, the next statement run prints only one summary line instead of the detail.** |
| Generate Zero Balance Statements | bool | Generate zero-balance statements *regardless of activity*. **This setting overrides `Suppress Zero/Credit Balance Statements With Activity`.** |
| Suppress Zero/Credit Balance Statements With Activity | bool | Suppresses zero-balance statements that had activity this period. **Field is not accessible for change while `Generate Zero Balance Statements` is active.** **[CONFLICT]** — the two fields are mutually contradictory by design; STORIS resolves it with a hard precedence + field lock. |
| Cycle Inactive Accounts | bool | Cycle **all** accounts on their cycle date during EOD regardless of activity. Off → only accounts with activity since last cycling. **STORIS explicitly recommends leaving this un-selected.** |
| Hold Credit Balance Statements | bool | On → credit-balance statements generated with **hold status**; operator may print them separately or with regular statements, and **hold statements print first**. Off → generated with regular status. |
| Suppress Dollar Signs on Revolving Statements | bool | Format revolving-statement dollar figures without the `$` sign. |
| Suppress Revolving Plans with Zero Balances and No Activity from Statements | bool | Exclude such plans from revolving statements. |
| Remit-to Flag | enum | `Global` (use the four Remit Address lines on this screen) \| `Store` (main address of the customer's store location, from the **General** tab of Warehouse/Store Location Settings; customer's store comes from **Store Assignment** in Customer Settings) \| `Blank` (leave remit-to empty, e.g. pre-printed forms). **For Revolving statements, a remit-to address on the Revolving tab of Warehouse/Store Location Settings overrides this setting.** |
| Remit Address line One / Two / Three / Four | text | Only used when Remit-to Flag = `Global`. Documented intent: 1 = company name, 2 = street address, 3 = PO Box, 4 = city/state/zip. |
| Auto Assign Due Date | bool | Auto-assign due date on customer accounts. Off → operators manually assign a due date from **the 1st through the 28th**. **Active only when `Cycle Schedule` = `Daily`.** |
| Default Due Day | int 1–28 | If `Cycle Schedule` = `Table`, this plus Due Days 2/3/4 build the **Default Due Day Table** offered at the Due Day field in Customer Settings for new customers. If `Cycle Schedule` = `Monthly`, this is the day-of-month defaulted into Customer Settings Due Day. |
| Due Days 2, 3, and 4 | int 1–28 (×3) | Additional entries in the Default Due Day Table when `Cycle Schedule` = `Table`. |
| Cycle Schedule | enum | `Daily` (statements daily; activates Auto Assign Due Date) \| `Table` (activates the Due Day fields) \| `Monthly` (activates the Due Day fields). |
| Global Message | text 4×50 | Prints on the **first** line of comments on every statement. |
| Credit Balance | text 4×50 | Second comment line, credit-balance statements. |
| Current Balance | text 4×50 | Second comment line, statements with a current balance due. |
| Overdue Message | text 4×50 | Second comment line, balances overdue **1–30 days**. |
| Overdue +30 days | text 4×50 | Balances overdue **31–60 days**. |
| Overdue +60 days | text 4×50 | Balances overdue **61–90 days**. |
| Overdue +90 days | text 4×50 | Balances overdue **91–120 days**. |
| Overdue +120 days | text 4×50 | Balances overdue **more than 120 days**. |
| Create XML for Revolving Statements and Export To | bool + path (conditional-mandatory) | Checkbox activates a path field; **once checked, entry of the path is mandatory.** System generates the file name; you supply only the directory. Examples given: `/STATEMENTS/REVOLVING` (AIX/Unix/Linux), `E:\STATEMENTS\REVOLVING\` (Windows). |
| Maximum Number of Customer Statements Per XML File (Revolving) | int, nullable | Caps statements per XML file; system appends a sequence number to each file name. **Blank → exactly one XML file per run.** Applies only to revolving statements sent to a shared NFS drive. |
| Create XML for Installment Statements and Export To | bool + path (conditional-mandatory) | As above, for installment statements. Examples: `/STATEMENTS/INSTALLMENT`, `E:\STATEMENTS\INSTALLMENT\`. |
| Maximum Number of Customer Statements Per XML File (Installment) | int, nullable | As above, for installment. **[CONFLICT] duplicate field name** — two distinct settings share the exact same label on one tab; must be disambiguated in our model. |
| Create XML for Open Item Statements and Export To | bool + path | As above, for open-item statements. Examples: `/STATEMENTS/OPENITEM`, `E:\STATEMENTS\OPENITEM\`. (Article text for this field mistakenly says "revolving" — a source copy-paste error.) |
| Create XML Statements During End of Day | bool | On → EOD generates the XML files and writes them to the export paths above. Off → XML can still be produced manually via *Print a Customer's Revolving Statement* / *Print a Customer Statement*, provided valid export paths exist. |

**Behavior & rules.**
- **Hard rule (guarded-ish, but by design a no-op on history):** "If you edit any of the following six fields
  (that is, Auto Assign Due Date, Default Due Day fields, and/or Cycle Schedule), the changes you make **do not
  affect existing customers**. The changes affect only customers created after the changes were made."
- **Hard rule:** "when entering a due day, the maximum number the system accepts is **28**."
- **Hard rule:** "Due days specified by location override due days you specify globally via this routine."
  (scope precedence LOCATION > SYSTEM).
- **Hard rule (message selection):** when multiple balances are overdue the system prints **the oldest**
  balance's message. Worked example in the source: current due + 60-days-overdue → the *Overdue +60 days*
  message is printed.
- Messages tab fields are 4 lines × 50 chars = 200 chars, **but printing to anything other than Forms
  Designer truncates to the first 50 characters.**
- **Hard rule:** EOD XML generation **skips** customers whose `Hold Customer's Statement` field in Advanced
  Customer Settings is `Yes` **or blank**. (Note the surprising part: *blank also suppresses*.)
- Microsoft-path advice in the source (use `E:\`, not `C:\`) is guidance, not a rule.

**Dependencies.** Warehouse/Store Location Settings (General tab address; Revolving tab remit-to override;
per-location due days); Customer Settings (`Store Assignment`, `Due Day`); Advanced Customer Settings
(`Hold Customer's Statement`); `EOD-001` end-of-day job; Accounts Receivable Control Settings (`SCS-002`);
Default Due Day Table (`SCS-023`); Enhanced Laser Forms / Forms Designer.

**Build notes.**
- New IDs: `CFG-AR-GRACEDAYS` (system-locked), `CFG-AR-STMTRETAIN`, `CFG-AR-STMTSORT` (locked),
  `CFG-AR-PRINTPURCHDETAIL`, `CFG-AR-ZEROBALSTMT`, `CFG-AR-SUPPRESSZEROACT`, `CFG-AR-CYCLEINACTIVE`,
  `CFG-AR-HOLDCREDITSTMT`, `CFG-AR-NODOLLARSIGN`, `CFG-AR-SUPPRESSZEROREVPLAN`, `CFG-AR-REMITMODE`,
  `CFG-AR-REMITADDR[1..4]`, `CFG-AR-AUTODUEDATE`, `CFG-AR-DUEDAY[1..4]`, `CFG-AR-CYCLESCHEDULE`,
  `CFG-AR-MSG-*` (8 message slots), `CFG-AR-XML-*`.
- Model `CFG-AR-CYCLESCHEDULE` as the parent discriminator; Auto Assign Due Date and the Due Day table are
  **conditionally enabled** children. Our settings service needs first-class "field enabled iff" rules —
  three separate fields here are disabled by the value of another.
- `CFG-AR-DUEDAY*` scope = `SYSTEM + LOCATION` (location wins).
- **Do differently:** STORIS silently makes six of these fields apply to new customers only. We should make
  that explicit — either (a) name them `default_*` so the "template, not policy" semantics is obvious, or
  (b) offer an explicit backfill action with a preview. Silent no-op-on-existing-records is a support
  nightmare.
- **Do differently:** replace the mutually-contradictory `Generate Zero Balance` / `Suppress Zero Balance`
  pair with one enum: `zero_balance_statements ∈ {ALWAYS, SUPPRESS_IF_NO_ACTIVITY, SUPPRESS_ALWAYS}`.
- `[DECISION NEEDED]` LA Mattress: do we cycle A/R at all, or is consumer financing entirely third-party
  (Synchrony/Wells/Acima)? If third-party, most of this screen becomes out of scope and only the
  dunning-message + statement-suppression parts matter for house accounts (B2B / contract sales).
- `[DECISION NEEDED]` XML statement export to a shared drive is a 1990s integration. Replace with a
  statement-render service + object storage + signed URL, and keep only "max statements per batch" as a
  real setting.

### `SCS-002` Accounts Receivable Control Settings
*storis_ref: article 15186452327572*

**Purpose.** The master A/R policy screen: credit aging, credit holds, service charges, charge-off, secure-data
auditing, gift card/certificate issuance, Metro 2 credit-bureau reporting, and — most importantly for retail —
**minimum deposit and maximum open balance rules that drive D1/D2 credit holds at order entry.**

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Accounts Receivables System Settings > Accounts Receivables Control Settings`. Tabs: **General, Gift Cards and Certificates, Credit Reporting, Deposits**.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Credit Aging Method | enum | `Trans Date` (age all credits on transaction date) \| `Oldest Invoice` (age credits against the oldest open items). **[GUARDED]** — changing this re-buckets every existing aged balance; must not change mid-cycle or with an open A/R period. |
| Report Sort By | enum | `Customer Code` \| `Customer Name`. |
| Number of Months History | int **1–99** | Months to retain closed receivable transactions. **End-of-Month purges anything older.** **[GUARDED]** — lowering it destroys history at next EOM. |
| Default Terms Code | ref (terms code) | Defaulted when creating customers, in Customer Settings or on-the-fly in Sales Order Entry. Editable per customer. |
| Default Credit Limit | money, nullable | Default credit limit for customers built on-the-fly in sales order entry. **Blank = unlimited credit.** Per-customer override: `Credit Limit` on the Receivables tab of Advanced Customer Settings. |
| Credit Hold Queue Refresh | int seconds **30–3600**, nullable | Auto-refresh rate of the Credit Hold Queue. Blank = manual refresh only. **Default 600 seconds (10 minutes).** |
| Daily Maximum Cash Refund Per Customer | money, nullable | `1 to 9999.99` = max cash refund per customer per day; `0` = **cash refunds not allowed**; `Blank` = no restriction for this store. Applies to Maintain Customer Deposits, Enter a Return, Enter an Exchange, Enter a Customer Payment/Refund/Gift Certificate, Adjust Dollars on a Completed Order. Overridable by security action `Override Daily Maximum Cash Refund Per Customer` (Receivables Security). **Note `0` and blank mean opposite things.** |
| Exchange Payment Type | ref (payment type) | Special payment type used during exchange processing. **Amounts using it are NOT posted to cash receipts** — excluded from the Daily Cash Balancing report but included on the Daily Cash Receipts Register. |
| Open Item Auditing | bool | Retain data for the **AR Audit Report** generated during End-of-Day. |
| Past Due / Open Order Hold | bool | On → all new sales orders for customers with an open past-due balance are placed on **D1 credit hold**. **The hold is applied during EOD, not at order entry** (i.e. delayed enforcement). |
| Secured Audit Retention Months | int **12–99** | Retention for audit records written when a user views (or is denied) secure customer data — e.g. `Credit Card Number Full Display` from Deposit Detail Inquiry. Purged during Generate Monthly Reports. |
| Allow Duplicate Social Security Numbers | bool | Off (blank) → duplicate SSN requires security override via `Override Duplicate Social Security Number Restriction` (Receivables Extended Security). A warning is always issued. **If blank and a duplicate is entered, the program writes a comment to the Customer Comments file for *all* customers involved.** Applies to customers and co-applicants. |
| Automatic Display of Legal Settings | bool | On → the `Customer Legal Settings - Read Only` pop-up appears in these routines for customers with legal settings: Enter a Service Order, Enter a Sales Order, Enter a Customer Payment, Enter a Customer Payment/Refund/Gift Certificate, Enter a Return, Enter an Exchange, Request Legally Entitled To (LET) Documents, Process Repossessed Items, Collector Review - Customer Update Screen, Manage and Adjust Installment Contracts, View All Installment Activity for a Customer, Review Pending Credit Requests, Maintain Customer Balances, Enter a Customer's Revolving Terms & Conditions, Adjust Revolving Plans, View All Revolving Activity for a Customer. |
| Allow Overpayments on Charged Off Accounts | bool, **default unchecked** | Off → payments exceeding the charged-off balance are rejected. On → accepted **without reinstating the customer account**. |
| Number of Ledger Entries | int **1–999** | Max ledger lines shown in *View a Customer's Receivables Activity Summary (AR Ledger Inquiry)*; excess truncated to most-recent. |
| Number of Cycle Phantoms | int **1–4** | Parallel background processes for EOD A/R cycling. "Contact your STORIS representative for further detail." |
| Automatic Charge-Off | enum | `N - None Selected` \| `D - End of Day` \| `M - End of Month` \| `C - Cycle` (at customer cycle processing time) \| `O - One Time` (**runs during the next End of Day only**, then presumably self-clears). Charges off customers whose customer alert code is designated "Automatic Charge-Off". Manual charge-off lives in Maintain Customer Balances → Bad Debt tab. |
| Charge-Off before Non-Accrual | bool | Blank → accounts **must** be in "non-accrual" status before charge-off. Checked → accounts can be charged off immediately without non-accrual first. **Note the inverted sense: the field name reads as a permission but blank is the restrictive setting.** |
| Tax Adjustments for Charge-offs | bool | On → sales-tax adjustments are calculated/posted on manual charge-offs of open item and revolving balances. **Requires two companion settings: `Sales Tax Adjustments for Charge-offs` (Accounts Receivable tab of General Ledger Assigned Account Settings) and `Create Adjustments for Charge-offs` (General tab of Sales Tax Settings).** |
| Service Charge Days | int (grace days) | Grace days after due date before service charges generate on **open item** transactions. **Assessment actually happens at the account's next cycle after grace expiry, not on the grace-expiry date.** **Revolving monthly payments are excluded.** |
| Service Charge Rate | percent | Default rate. **Used only when no service charge rate exists for the state in Sales Tax Settings** (state rate wins). |
| Minimum Service Charge | money | Floor: assessed whenever a system-generated service charge does not exceed this amount. |
| Auto Adjust Amount | money, 2dp, **max 99.99** | EOD auto write-off threshold for open A/R. Selects customers whose **accumulated** balance (debit or credit) ≤ this amount, then posts offsetting amounts to each open A/R transaction bringing each open item and the overall open-item balance to zero. Posts to G/L: **Accounts Receivable account** debit/credit with offset to the **A/R Adjustments** account. `0.00` disables. **Does not apply to Installment and Revolving balances.** |
| Audit All Customer Activity | bool | Logs Customer Settings changes, order activity (purchases, exchanges), shopping cart activity, billing updates. Viewable in the Customer Activity Log. |
| Use Extended Payment Receipt | bool | **(Locked Field - STORIS access only!)** Enables extended print/email receipts. Checked: Enter a Customer Payment gains print/email extended receipt option; Enter a Customer Payment/Refund/Gift Certificate produces an extended receipt (**for gift certificates with multiple payment types, one combined receipt**); View a Customer's Payment Activity (gift certificates) produces an extended receipt. Unchecked: standard receipt. **Affects the form generated when Signature Capture and Document Archive are enabled.** For Maintain Customer Deposits both states produce a form determined by `Maintain Customer Deposits Refund Receipts` in Point of Sale Control Settings = "Forms Designer" (Cash Application Receipt when checked, Payment Receipt when unchecked). Emailing requires Event Notification Control setup. |
| Include Imported Payments on Cash Balancing Report | bool | On → payments from *Import Customer Payments* participate in cash balancing. |
| Days to Limit Backdating during NSF / Misapply | int, **max 2 chars**, nullable | Restricts backdating in *Apply NSF and Correct Misapplied Payments*. **Default blank = no restriction other than the transaction date must be in an open sales period.** |
| Daily Receipts Retention Months | int **2–99** | Retention of Daily Receipts data, purged by Generate Monthly Reports. Source for *Report Daily Receipts Register* and *Report Summarized Sales Receipts* — **both used for subledger auditing of the G/L**, so this is a compliance-sensitive retention value. |
| Verify Customer Driver License | bool, **default unchecked** | Verify the customer's driver's license when a revolving payment has been applied to an order. |
| **Actions → Close Payment Dates** | action (multi-select of dates) | Opens a Multiple Selection Lookup of payment dates from all open pay periods; selected dates are blocked for **all users** from posting payments. Date checked = **current date for sales orders**, **entered date for customer payments, refunds, deposits, gift certificates, and cash applications**. Error on attempt; user must enter an open date or manually open the closed date. **Affects only customer payments/refunds (including immediate refunds) — to close days for financing payments use Financing Control Settings (`SCS-036`).** |

**Fields — Gift Cards and Certificates tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Purchase Gift | bool | Allow purchase of gift cards/certificates via *Enter a Customer Payment/Refund/Gift Certificate*. **Parent switch.** |
| Add Funds to Existing | bool | Allow adding funds to existing cards. **Active only if `Purchase Gift` is checked.** |
| Refund Gift Balance | bool | Allow gift card/certificate refunds. **Active only if `Purchase Gift` is checked.** |
| Zero Balance Retention Days | int, nullable | Days to retain zero-balance gift cards; purged at End of Month. **Blank = never purge.** |
| Card Swipe Required | bool | On → swiping required at activation, manual entry disallowed; **checking it clears and inactivates `Next Certificate Number`**, and **you must then populate at least one Card Number Prefix**. Per-user override: `Type in new gift card numbers if card swiping is required` (Extended Security). |
| Validate Manual Entry | bool | On → manually typed gift card numbers must be re-entered to confirm during payment entry. |
| Gift Registry Default Type | ref (Gift Certificate Payment Settings code) | Defaults into `Gift Certificate Type` when adding funds to a gift registry's linked certificate. **Must contain a valid payment code or the Create/Update a Customer Gift Registry routine is inaccessible.** |
| In-Store Use Only Default Type | ref (Gift Certificate Payment Settings code) | Default payment type when in-store credit is required. **Lookup shows only codes with `In-Store Use Only` selected.** **To generate in-store-use-only certificates, `Next Certificate Number` must be populated.** |
| Card Number Prefix 1–5 | text, up to **16 alphanumeric**, ×5 | Allowed prefixes for gift card numbers. Prefix is fixed; only the suffix increments. **Certain prefixes are rejected to avoid credit-card collisions (e.g. `4` is rejected because Visa numbers begin with 4).** **Entering a value clears and inactivates `Next Certificate Number`.** Fields are active only if `Next Certificate Number` is empty. Imported cards beginning with alpha (A–Z) characters: **the alpha characters are dropped on manual entry/access.** |
| Next Registry Certificate Number | int (sequence), nullable | Next sequential number for certificates created via *Create/Update a Customer Gift Registry*. Works regardless of `Card Swipe Required`. Blank → the Gift Certificate Number Entry Window prompts. **Registry-only; not used for other certificates.** |
| Next Certificate Number | int (sequence), nullable | Auto-generates gift card/certificate numbers, incrementing by one. Blank → users must enter/swipe a number. **Inactive if `Card Swipe Required` is checked. Entering a value inactivates both `Card Number Prefix` and `Card Swipe Required`.** Not used for registry certificates. |

**Fields — Credit Reporting tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| NFS Export File | path, nullable | NFS path for credit-reporting file export. Blank → default export path. |
| Exclude Account if Balance Is: | 3 int (months) sub-fields | Restricts accounts from the **Metro 2 Customer Credit History** report: `$0.00 for 2 Months and Account Age is less than NN Months`; `$0.00 for NN Months`; `A Credit for NN Months`. |
| Metro 2 Format | enum, **mandatory**, default `United States` | `United States` \| `Canada`. |
| Retention Days | int **1–999**, **null by default** | Purge Metro 2 files older than this. Null = no purge. |

**Fields — Deposits tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Next Deposit Number | int (sequence), nullable | Auto-assign deposit numbers, incrementing by one. Blank → manual entry. |
| Service to Sales Deposit Move | bool | Allow moving deposit money from a service order to a sales order. |
| Deposit Hold Back % | percent, nullable | Percentage of each deposit held back on **partial-shipment delivery orders** to cover undelivered lines. Formula, quoted exactly: **`(Dollar Amount Of Line Items Not Shipped + Sales Tax + Delivery Charge + Installation Charge) X Percent (%) Entered in this Field`**. **Null/blank → the `Minimum Deposit - Delivery Lines %` is used instead (prevents the back-order going on D2 hold). Zero → nothing is held back and the back-order IS placed on D2 credit hold.** *(Worked example in source: order with $100 and $200 delivery lines, Min Deposit Delivery = 20%, $60 paid. Blank → $40 held back, $20 applied, $80 COD, no D2 hold. Zero → $0 held back, $60 applied, $20 COD, back-order goes on D2 hold.)* **This is the single most counter-intuitive setting on the screen: blank ≠ zero, and zero is the *stricter* outcome.** |
| Deposit Overpayment Allowed | bool, **default unchecked** | Allows deposit overpayments (cash, check, credit card, miscellaneous, debit). Requires user permission `Apply a Deposit Greater than the Balance Due` (Receivables Security). **An authorizing comment is added to the order.** Applies in: Enter a Sales Order, Enter a Quick Sale, Enter an Exchange, Enter a Service Order (only when a balance is due), Enter a Service Order, Adjust Dollars on Completed Order (debit only), Enter a Customer Payment/Refund/Gift Certificate (Order Deposits page only), Manifest Completion (not via WMS), eBridge `ApplyDeposits` method. **Never permitted when the order has no valid customer code (quick sale / no customer PII).** |
| Deposit Hold Back | percent | **[CONFLICT] — a second, differently-named field with nearly the same description as `Deposit Hold Back %`.** Source rule: "The Minimum Deposit fields below supercede this field, provided that the percentage on the revolving plan is greater than the amount in this field; if Deposit Hold Back is greater, it remains on the order." Two hold-back fields on one tab with a partially contradictory precedence rule — must be reconciled before we build. |
| Minimum Deposit — Whole Order | percent, nullable | Includes delivery/installation charges, taxes, fees, and other misc charges. **Rejected if `Maximum Balance` has an amount.** |
| Minimum Deposit — Take With Lines | percent, nullable | **Take-with lines complete immediately, so insufficient deposit *blocks completion* rather than merely flagging D2 hold** — the user must add payment or cancel the order. Override: `Override Minimum Deposit on Take With Orders` (User/Group Sales Security). **This is the only Minimum Deposit % that is compatible with `Maximum Balance`.** |
| Minimum Deposit — Customer Pickup Lines | percent, nullable | **Rejected if `Maximum Balance` has an amount.** |
| Minimum Deposit — Delivery Lines | percent, nullable | **Excludes delivery/installation charges from the calculation.** Doubles as the deposit hold-back basis when `Deposit Hold Back %` is blank. **Rejected if `Maximum Balance` has an amount.** |
| Minimum Deposit — Direct Shipment Lines | percent, nullable | **Rejected if `Maximum Balance` has an amount.** |
| Include Estimated Tax and Fees | bool | Include estimated sales tax and misc fees in the minimum-deposit calculation. |
| Customers with Credit Exempt | bool | Exempt from minimum deposits any customer with a `Credit Limit` on the Receivables tab of Advanced Customer Settings. |
| Service Orders Exempt | bool, **default unchecked** | Exclude service orders from deposit review. "Minimum Deposit requirements are skipped when a customer service order is processed." |
| Maximum Balance | money `.00`–`999,999.99`, nullable | Max open balance allowed on an order. Evaluated **whenever a user files (saves) an order**. Blank = any open balance allowed. **Mutually exclusive with four of the five Minimum Deposit % fields.** |
| Over Maximum Balance | enum | Action when an order exceeds `Maximum Balance`: `D2 Credit Hold` \| `Disallow Ticket Print`. **The restriction persists as long as the open balance exceeds the maximum.** |
| Re-evaluate D2 Credit Hold When Order is Saved | bool, **default blank** | On → minimum-deposit and maximum-balance checks re-run on every save **even after manual approval via Update Receivables Credit Approvals**. Blank → approved orders are not re-checked. |
| Immediate Deposit Refund Types | multi-select | `Cash`, `Credit Card`, `Miscellaneous`, `Debit Card`, `Gift Certificate`. **If all are blank, the Immediate Refund option does not appear in Maintain Customer Deposits at all.** |

**Behavior & rules (summary of the hard ones).**
- **`Maximum Balance` and Minimum Deposit % are mutually exclusive** for Whole Order, Customer Pickup,
  Delivery, and Direct Shipment — the program *rejects the entry*. Take With is the exception.
- **Credit-hold taxonomy is load-bearing:** `D1` = past-due-balance hold (applied at EOD),
  `D2` = deposit/maximum-balance hold (applied at order file), `C1` = customer credit-limit hold.
  "Maximum balance applies only to open balances on individual orders… distinct from the customer credit
  limit feature… (which involves C1 credit holds)."
- Take-with lines: **insufficient deposit hard-blocks completion**; every other line type only causes a hold.
- `Deposit Hold Back %`: **blank, 0 and a positive value are three distinct behaviors.**
- Cash refunds: **`0` disables, blank means unlimited.**
- Service charge rate resolution: **state rate (Sales Tax Settings) > this default**.
- Auto write-off posts real G/L entries (A/R vs A/R Adjustments) — it is not a display-only cleanup.

**Dependencies.** Advanced Customer Settings (`Credit Limit`); Customer Settings; Sales Tax Settings
(state service-charge rate; `Create Adjustments for Charge-offs`); General Ledger Assigned Account Settings
(`Sales Tax Adjustments for Charge-offs`, A/R and A/R Adjustments accounts) → `SCS-037`; Point of Sale
Control Settings (`Maintain Customer Deposits Refund Receipts`) → part B `Point of Sale Control Settings`;
Financing Control Settings (`SCS-036`) for closing financing payment dates; Event Notification Control
(`SCS-034`) for emailed receipts; Gift Certificate Payment Settings; Legal Code Settings (`SCS-044`);
Metro 2 credit reporting; security actions `SEC-AR-OVERRIDE-CASHREFUND`,
`SEC-AR-OVERRIDE-DUPSSN`, `SEC-AR-DEPOSIT-OVERPAY`, `SEC-SALES-OVERRIDE-MINDEP-TAKEWITH`,
`SEC-GC-MANUALENTRY`; `EOD-001`; End-of-Month (Generate Monthly Reports).

**Build notes.**
- New IDs (General): `CFG-AR-AGINGMETHOD` **[GUARDED]**, `CFG-AR-REPORTSORT`, `CFG-AR-HISTMONTHS` **[GUARDED]**,
  `CFG-AR-DEFTERMS`, `CFG-AR-DEFCREDITLIMIT`, `CFG-AR-HOLDQUEUEREFRESH`, `CFG-AR-MAXCASHREFUND`,
  `CFG-AR-EXCHPAYTYPE`, `CFG-AR-OPENITEMAUDIT`, `CFG-AR-PASTDUEHOLD`, `CFG-AR-SECAUDITMONTHS`,
  `CFG-AR-DUPSSN`, `CFG-AR-AUTOLEGALPOPUP`, `CFG-AR-CHGOFFOVERPAY`, `CFG-AR-LEDGERLINES`,
  `CFG-AR-CYCLEPHANTOMS`, `CFG-AR-AUTOCHARGEOFF`, `CFG-AR-CHGOFFBEFORENONACCRUAL`,
  `CFG-AR-CHGOFFTAXADJ`, `CFG-AR-SVCCHGDAYS`, `CFG-AR-SVCCHGRATE`, `CFG-AR-SVCCHGMIN`,
  `CFG-AR-AUTOADJUST`, `CFG-AR-AUDITCUSTACTIVITY`, `CFG-AR-EXTPAYRECEIPT` (locked),
  `CFG-AR-IMPORTEDPAYCASHBAL`, `CFG-AR-NSFBACKDATEDAYS`, `CFG-AR-DAILYRCPTMONTHS`,
  `CFG-AR-VERIFYDL`, `CFG-AR-CLOSEDPAYMENTDATES` (a *data set*, not a scalar — model as a calendar of blocked
  posting dates with audit).
- New IDs (Gift): `CFG-GC-PURCHASE`, `CFG-GC-ADDFUNDS`, `CFG-GC-REFUND`, `CFG-GC-ZEROBALDAYS`,
  `CFG-GC-SWIPEREQUIRED`, `CFG-GC-VALIDATEMANUAL`, `CFG-GC-REGISTRYTYPE`, `CFG-GC-INSTOREONLYTYPE`,
  `CFG-GC-PREFIX[1..5]`, `CFG-GC-NEXTREGISTRYNUM`, `CFG-GC-NEXTCERTNUM`.
- New IDs (Credit Reporting): `CFG-CR-NFSPATH`, `CFG-CR-EXCLUDERULES`, `CFG-CR-METRO2FORMAT`,
  `CFG-CR-RETENTIONDAYS`.
- New IDs (Deposits): `CFG-DEP-NEXTNUM`, `CFG-DEP-SVCTOSALESMOVE`, `CFG-DEP-HOLDBACKPCT`,
  `CFG-DEP-OVERPAYALLOWED`, `CFG-DEP-HOLDBACK-LEGACY` **[CONFLICT]**, `CFG-DEP-MINDEP-WHOLE`,
  `CFG-DEP-MINDEP-TAKEWITH`, `CFG-DEP-MINDEP-PICKUP`, `CFG-DEP-MINDEP-DELIVERY`,
  `CFG-DEP-MINDEP-DIRECTSHIP`, `CFG-DEP-MINDEP-INCLTAX`, `CFG-DEP-CREDITEXEMPT`,
  `CFG-DEP-SVCORDEREXEMPT`, `CFG-DEP-MAXBALANCE`, `CFG-DEP-OVERMAXACTION`,
  `CFG-DEP-REEVALD2`, `CFG-DEP-IMMEDIATEREFUNDTYPES`.
- **Guarded changes our settings service must enforce:** `CFG-AR-AGINGMETHOD` (re-ages all open items),
  `CFG-AR-HISTMONTHS` / `CFG-AR-SECAUDITMONTHS` / `CFG-AR-DAILYRCPTMONTHS` / `CFG-CR-RETENTIONDAYS` /
  `CFG-GC-ZEROBALDAYS` (lowering deletes data at next EOM — require a confirmation showing row counts),
  `CFG-GC-NEXTCERTNUM` vs `CFG-GC-PREFIX*` vs `CFG-GC-SWIPEREQUIRED` (a **three-way mutual exclusion** —
  model as one enum `gift_number_source ∈ {SEQUENCE, PREFIX_MANUAL, PREFIX_SWIPE_ONLY}` rather than three
  interlocking fields), `CFG-AR-AUTOCHARGEOFF = O (One Time)` (a *command*, not a setting — model it as a
  job trigger).
- **Do differently:** `Deposit Hold Back` vs `Deposit Hold Back %` must collapse to one field with an
  explicit tri-state (`INHERIT_FROM_MIN_DEPOSIT` / `NONE` / `PERCENT(n)`). Never ship blank-vs-zero
  semantics.
- **Do differently:** apply the past-due hold **at order entry**, not at EOD. A hold that lands overnight
  is a hold that ships merchandise it should have stopped.
- `[DECISION NEEDED]` LA Mattress minimum-deposit policy per line type, and whether we want the
  `Maximum Balance` mechanism at all (it is mutually exclusive with 4 of 5 minimum-deposit rules, which is
  a bad trade).
- `[DECISION NEEDED]` Metro 2 furnishing — do we report to bureaus? If not, drop the whole Credit
  Reporting tab.
- Retain the security-audit-on-secure-data-view behavior; it is a PCI/PII control worth copying verbatim.

### `SCS-003` Add Product Attribute
*storis_ref: article 15186416510612*

**Purpose.** Defines one **component** of a dynamically generated product ID. Each component maps a product
attribute into a fixed slice of the generated SKU string.

**Where it lives.** Two entry points, same routine:
`Inventory Control Settings > Product Identifier tab > Add Product Attribute` button, and
`Group Settings > Product Identifier tab > Add Product Attribute` button.
Only used when **`Dynamic Identifier`** is selected on the Product Identifier tab.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product Attribute | enum (drop-down of product attributes) | Which attribute supplies this component's value. |
| Maximum Length | int, **required** | Max characters for this component. **If the data exceeds it, the data is truncated as left justified** (i.e. the tail is cut). |
| Fixed Length | bool | On → component is always `Maximum Length` characters, **padded with leading zeroes**. Exact source example: fixed length 5, data `ABC` → component value `00ABC`. |
| Strip Text | text | Text removed from the attribute value before use. "In most cases, this is a single character, such as a hyphen or asterisk, but can be used to eliminate a character set as well." |

**Behavior & rules.**
- Save returns to the previous screen and appends the component to the grid — **component order in the grid
  is the order of concatenation in the generated ID** (implied; grid position is significant).
- **Hard rule:** truncation is silent and left-justified. **Two different products can therefore collide on
  the same generated ID** if their attribute values differ only past `Maximum Length`.
- Padding uses **leading zeroes even for alphanumeric data** (`00ABC`), which is unusual.

**Dependencies.** Inventory Control Settings → `SCS-043` (Product Identifier tab, `Dynamic Identifier`);
Group Settings (Product Identifier tab); product attribute master data.

**Build notes.**
- `CFG-PRODID-COMPONENTS` — an **ordered list** of component definitions, scope `SYSTEM` and `GROUP`
  (group overrides system), each `{attribute, max_length (required), fixed_length bool, strip_text}`.
- **[GUARDED]** Changing the component list after products exist changes how *new* IDs are generated but
  cannot retro-fix existing IDs — our service must refuse to change it silently and must warn that IDs
  already issued remain as-is.
- **Do differently:** silent left-justified truncation is a correctness hazard. Validate the component set
  against existing attribute data and **refuse (or warn with the exact colliding SKUs) when the configured
  lengths can produce duplicate IDs.** Add a dry-run "generate IDs for the current catalog and show
  collisions" action.
- `[DECISION NEEDED]` LA Mattress: do we want generated SKUs at all, or vendor-model-based SKUs? If
  generated, decide the component order (brand / collection / size / color is the obvious mattress schema)
  and lock it before catalog load.

### `SCS-004` Add Text
*storis_ref: article 15186451010836*

**Purpose.** Adds a **literal text component** to a dynamically generated product ID — in practice, a
delimiter between attribute components.

**Where it lives.** `Inventory Control Settings > Product Identifier tab > Add Text` button, and
`Group Settings > Product Identifier tab > Add Text` button. Used only when **`Dynamic Identifier`** is
selected on the Product Identifier tab.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Text | text | Free text used verbatim as an ID component. **Characters not permitted in a product ID are rejected — the article names `asterisk` and `quotation marks` as examples.** |

**Behavior & rules.**
- Source example, quoted: to build a Product ID containing Product Group and Collection number separated by
  a hyphen, "add the `-` (hyphen) as a text component."
- Save returns to the previous screen and appends the component to the grid; **grid order = concatenation
  order.**

**Dependencies.** Same as `SCS-003`: Inventory Control Settings (`SCS-043`) / Group Settings Product
Identifier tab, `Dynamic Identifier`.

**Build notes.**
- Same registry entry as `SCS-003`: `CFG-PRODID-COMPONENTS` gains a component kind
  `{type: LITERAL, text: "..."}` alongside `{type: ATTRIBUTE, ...}`.
- We need an explicit **allowed-character set for product IDs** as its own validated constant
  (`CFG-PRODID-ALLOWEDCHARS`), enforced both here and on manual SKU entry. STORIS only gestures at it
  ("such as an asterisk or quotation marks"); we should define it precisely — recommend
  `[A-Z0-9][A-Z0-9._-]*`, uppercase-normalized, since SKUs end up in barcodes, URLs, and CSV exports.

---

### `SCS-005` Add-on Calculation Process
*storis_ref: article 15186451011092*

**Purpose.** Registers an **alternate calculation process** for the value of a landed-cost add-on, so that
add-ons can be computed by a formula rather than entered as a flat percent/amount.

**Where it lives.** `Actions` button on the **General** tab of **Costing Control Settings** (`SCS-016`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (list of alternate add-on calculation processes) | list of named process references | The article does not enumerate individual fields — it documents the screen's effect only. **Article is effectively thin: it names the screen and its consequence but no field-level detail.** The only concrete instance documented elsewhere in this section is the **Ashley Custom Cost Formula** (`SCS-008`). |

**Behavior & rules.**
- **Hard rule / key consequence:** "Once you specify an alternate process, you can select the **'Calculated'**
  option on any of the following: Advanced Product Settings, **Cost Tab**; Advanced Vendor Settings,
  **Shipping Tab**; Advanced Regional Vendor Settings, **Shipping Tab**."
  i.e. this screen is what makes the enum value `Calculated` *available* on three other screens. If no
  alternate process is registered, `Calculated` cannot be chosen.
- Landed add-ons therefore have three value modes: fixed percent, fixed amount, or `Calculated` via a
  registered process.

**Dependencies.** Costing Control Settings (`SCS-016`); `CFG-VEND-ADDONFACTORS` **[REUSE]** and
`CFG-PROD-ADDONFACTORS` **[REUSE]** from the Inventory pack; `CFG-VEND-FREIGHTFACTOR` **[REUSE]**,
`CFG-PROD-FREIGHTFACTOR` **[REUSE]**; Advanced Regional Vendor Settings (a *third* scope level for
add-ons not present in the Inventory pack registry — see build notes); Ashley Custom Cost Formula
(`SCS-008`).

**Build notes.**
- New ID `CFG-COSTING-ADDONPROCESSES` — a registry of named, versioned add-on calculation processes.
  This is the enabling switch for the `Calculated` mode on `CFG-PROD-ADDONFACTORS` /
  `CFG-VEND-ADDONFACTORS`, so those two registry entries need their type widened from
  "named list of percent/amount" to `percent | amount | CALCULATED(process_ref)`.
- **New scope discovered:** *Advanced Regional Vendor Settings*. The Inventory pack's scope chain
  (`SYSTEM → DISTRICT → LOCATION → GROUP → PRODUCT`) plus `VENDOR` does not cover **VENDOR × REGION**.
  Add `VENDOR_REGION` between `VENDOR` and `PRODUCT` in the add-on/freight resolution order.
- **Do differently:** do not let a "calculation process" be arbitrary vendor code. Implement as a small
  set of named, unit-tested strategies with declared inputs, versioned, with a dry-run cost preview.
  **[GUARDED]** — changing or retiring a process while open receiving batches exist would change landed
  cost mid-batch; gate it the same way as `CFG-COSTING-FREIGHTMODE`.
- `[DECISION NEEDED]` Do we need vendor-specific cost formulas at all (see `SCS-008` for the Ashley case),
  or can LA Mattress standardize on itemized container freight?

### `SCS-006` Alternate Tax Interface Control Settings
*storis_ref: article 15186501542164*

**Purpose.** Configures an external sales-tax calculation engine (Avalara, CCH, or Vertex) in place of
STORIS' internal tax tables — credentials, timeouts, refresh cadence, tax-class mapping for
delivery/installation/restock charges, and the offline fallback policy.

**Where it lives.** Two paths:
`System Administration > System Settings > Customer System Settings > Interface System Settings > Alternate Tax Interface Control Settings`
and `Customer > Electronic Interfaces > Alternate Tax Interface > Alternate Tax Interface Control Settings`.
Tabs: **General, Vertex-O, CCH, Avalara** (the last three are conditionally active on the provider chosen).

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Tax Calculation Program | enum | **(Locked Field - STORIS Access Only)** `Avalara-AvaTax` \| `CCH®-Sales Tax Online` \| `CCH®-Sales Tax Office` \| `Vertex-O` (Vertex® Transaction Processing - Sales Tax Series "O" package). **`CCH Sales Tax Office` cannot be used with the STORIS SaaS solution.** This value is the discriminator that activates the Vertex-O / CCH / Avalara tabs. |
| Address Cleansing | enum | `Not Active` \| `Active`. Active → the provider's USPS-certified address cleansing runs and **STORIS overwrites stored addresses with the cleansed versions**, applying 9-digit ZIPs for U.S. addresses. |
| Request Time Out in Seconds | int seconds | How long to wait for the tax provider before timing out. |
| Interface Data Refresh Days | int **0–90**, nullable | Cadence for the *Update Alternate Tax Interface Data* routine within Generate Daily Reports (EOD). **Semantics differ by provider — this is a genuine trap:**<br>**Vertex:** default `1`; `0` or `1` → runs during **every** EOD; `>1` → EOD compares an internally stored "last refresh date" to the current date; **blank → the utility is DISABLED.**<br>**CCH:** `0–90`; **blank → runs during EVERY EOD** (the exact opposite of Vertex); otherwise uses last-refresh-date arithmetic. |
| Tax ID Expiration Days | int **0–90**, nullable | Days before re-verifying alternate tax IDs. `0` → **verify every time the ID is used**. **Blank → never re-verify; IDs never expire.** Uses an "as-of date" returned by the provider and stored per address. |
| Tax Adjustment GL Account | ref (GL account, **liability type**) | Offset account for GL adjustments when tax amounts differ during **recovery posting** of completed orders — i.e. **orders completed while the tax interface was unavailable**. See General Ledger Assigned Account Settings (`SCS-037`). |
| Error Logging | bool, **default unchecked** | Diagnostic logging. "You should check this box only when research is needed for reported problems." |
| URL | text, **mandatory** | Endpoint for the provider. |
| Schema Version | enum, **default `V1`** | Vertex On-Demand only: `V1` = Vertex O-Series Revision 4.0; `V2` = Vertex On-Demand Series Revision 8.0; `V3` = Vertex On-Demand Series Revision 9.0. "The default schema version is V1 if no schema version is specified." |
| Use STORIS calculations when offline | bool, **default unchecked** | On → when communication with Avalara or Vertex fails, STORIS' own tax routines are used. **Off (the default) → NO TAX IS APPLIED when the provider is unreachable.** The article adds: "The merchant is responsible for applying additional tax codes to the zip code settings and the proper settings must be defined in Sales Tax Settings." **This is the most dangerous default on the screen — a provider outage silently produces untaxed orders.** |

**Fields — Vertex-O tab** *(active only when the Vertex® interface is selected)*

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer Tax Exempt Status | enum | `Alternate Tax Interface` (Vertex owns exemption status; STORIS does not determine it) \| `STORIS` (STORIS owns it and **sends exemption status with the address, overriding Vertex**). |
| Product Taxable Status | enum | `Alternate Tax Interface` (Vertex owns product taxability) \| `STORIS` (STORIS sends taxable status with product code (SKU) and price, **overriding Vertex**). **Hard rule: selecting `Alternate Tax Interface` DISABLES the `Tax Override Class` field in Sales Tax Settings.** |
| Delivery Charge Tax Class | ref (Tax Class code) | Class sent with delivery charges. |
| Installation Charge Tax Class | ref (Tax Class code) | Class sent with installation charges. |
| Restock Charge Tax Class | ref (Tax Class code) | Class sent with restocking charges. |
| Trust ID | secret | Login key. **If present, Login ID/Password are not needed.** |
| Login ID | text | **Required if no Trust ID.** |
| Password | secret | **Required if no Trust ID.** |

**Fields — CCH tab** *(active only when the CCH® interface is selected)*

| Field | Type | Purpose / business rule |
|---|---|---|
| CCH Enrollment Date | date | The "live" date on which CCH use began. |
| Serial Number | text, **required** | CCH-provided serial number. |
| Delivery Charge SKU | text | **Must be defined here AND in CCH.** Delivery charges are passed to CCH **as line items**; this SKU determines, **by state**, whether delivery charges are taxed. **In CCH the product category should be set to one of the `FRGHT` settings.** |
| Installation Charge SKU | text | Must exist here and in CCH; installation charges pass as line items. |
| Restock Charge SKU | text | Must exist here and in CCH; restocking charges pass as line items. |

**Fields — Avalara tab** *(active only when the Avalara® interface is selected)*

| Field | Type | Purpose / business rule |
|---|---|---|
| Account Number | text, **required** | Provided by Avalara. |
| License Key | secret, **required** | Provided by Avalara. |
| Transaction Commitment | bool, **default checked** | **(Locked Field - STORIS Access Only)** Unchecked → the system suppresses any call other than obtaining tax for an open transaction, meaning **completed transactions are never posted to AvaTax for reporting** (breaks tax filing). |
| Verifiable Countries | multi-select (country codes), **required** | Countries to which address validation applies. **Required whenever `Address Cleansing` = `Active`.** |
| Default Product Tax Class | ref (Tax Class Settings), **required** | **Default taxable product code is `P0000000`.** |
| Delivery Charge Tax Class | ref, **required** | Identifies delivery charges to Avalara. |
| Installation Charge Tax Class | ref, **required** | Identifies installation charges to Avalara. |
| Restock Charge Tax Class | ref, **required** | Identifies restock charges to Avalara. |

**Behavior & rules.**
- **The four Avalara tax-class fields are "validated against Tax Class Settings" but the codes themselves are
  "defined within Avalara"** — a two-system contract. Establish codes in Avalara first, then enter here.
- **Recovery posting** exists: orders completed during an interface outage are posted later, and
  discrepancies land in the `Tax Adjustment GL Account`. This implies a **queue of unposted tax
  transactions** that must be reconciled.
- Provider selection is locked to the vendor; everything downstream (which tab is active, which credential
  set is required) keys off it.

**Dependencies.** Sales Tax Settings (`Tax Override Class`, state rules, zip-code tax codes);
Tax Class Settings; General Ledger Assigned Account Settings (`SCS-037`); `EOD-001` (Generate Daily
Reports / *Update Alternate Tax Interface Data*); customer address records (mutated by Address Cleansing);
General System Control Settings (`SCS-038`) for interface licensing.

**Build notes.**
- New IDs: `CFG-TAX-PROVIDER` (locked), `CFG-TAX-ADDRCLEANSE`, `CFG-TAX-TIMEOUT`,
  `CFG-TAX-REFRESHDAYS` **[CONFLICT — provider-dependent semantics]**, `CFG-TAX-IDEXPIREDAYS`,
  `CFG-TAX-ADJGLACCT`, `CFG-TAX-ERRORLOG`, `CFG-TAX-URL`, `CFG-TAX-SCHEMAVERSION`,
  `CFG-TAX-OFFLINEFALLBACK`, `CFG-TAX-VTX-*`, `CFG-TAX-CCH-*`, `CFG-TAX-AVA-*`.
- **Do differently — highest priority item on this screen:** invert `Use STORIS calculations when offline`.
  Our default must be **fail-closed**: if the tax service is unreachable, either use the cached/local rate
  table **or block order completion**. Silently charging $0.00 tax is a legal exposure, not a fallback.
  Recommend `CFG-TAX-OFFLINEPOLICY ∈ {LOCAL_TABLE, BLOCK_COMPLETION}` with **no "no tax" option at all.**
- **Do differently:** `CFG-TAX-REFRESHDAYS` has opposite blank-semantics per provider. Replace with an
  explicit `{DISABLED | EVERY_EOD | EVERY_N_DAYS(n)}` enum.
- Credentials (`Trust ID`, `Password`, `License Key`) must live in a secret store, be write-only in the UI,
  and be excluded from settings-change audit values (log "changed", not the value).
- **[GUARDED]** Changing `CFG-TAX-PROVIDER`, any tax-class mapping, or `Address Cleansing` while
  **unposted/recovery tax transactions exist** must be blocked — the recovery queue would post against the
  wrong provider/mapping.
- **[GUARDED]** `Address Cleansing = Active` **overwrites customer addresses**. Require explicit
  acknowledgement; log every address mutation.
- `[DECISION NEEDED]` LA Mattress provider choice (Avalara is the obvious one) and whether delivery,
  installation, and restock fees are taxable in CA — decide once and encode as tax classes, not per-order.

### `SCS-007` API Control Settings
*storis_ref: article 15186452328468*

**Purpose.** Parameters governing **eBridge Commerce (web/API) order submission** — which inventory the web
can see, whether out-of-stock discontinued items can be sold against an inbound PO, fulfillment defaults,
and the POS identity (store/salesperson/order source) stamped on API-created orders.

**Where it lives.** `System Administration > System Settings > General Administration System Settings > Companion Application System Settings > Web System Settings`.
Tabs: **Warehouse, Inventory, Fulfillment, Default Point of Sale, Other**.
Article carries version selectors **11.0 / 10.8**.
**Hard prerequisite: "APIs must be licensed and active via General System Control Settings. The API license has submodules, such as eBridge Commerce."** → `SCS-038`.

**Fields — Warehouse tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Warehouse Product Availability | enum + conditional multi-select | `All Locations` (main warehouse) \| `Specific Locations` (activates a location list; Search → Multiple Selection Lookup Window, or Action → Multiple Location Selection Window). A third value **`Delivery Ship from Location`** is referenced by the next field, so the real enum is at least three-valued. |
| On Display Product Locations | multi-select (locations) | Locations whose **as-is products** sync via the **On Display Product API** call rather than the **Price and Availability API** call. **Hard rule: unusable while `Warehouse Product Availability` = `Delivery Ship from Location`.** |
| On Display Reason Codes | multi-select (On Display Product Reason Codes) | Which reason codes are included in the On Display Product API call. |

**Fields — Inventory tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Require Available Merchandise | bool | On → availability check throughout cart and checkout. eBridge blocks adding zero-QOH products to a cart, and **on reopening an existing cart, zero-QOH products are removed with an error message** (destructive to the customer's cart). |
| Accept Out-Of-Stock Discontinued Products / (Dropped) | bool ×2 | Either/both. When a web order line is an out-of-stock **dropped** or **discontinued** product, the system searches scheduled purchase orders for a matching line and **auto-links the sales order line to the PO line**. |

**All five link conditions must be met (quoted):** the PO contains a line for the Discontinued or Dropped
product; **the PO's delivery location must match the stock location of the order line**; the PO must be a
type with **`Allow Sales Order Linkage to Purchase Order`** enabled; the PO line must be able to
**completely** fulfil the sales order line (net of quantity already received and already assigned to other
sales orders); **the PO cannot be on Approval Hold**.
**Hard rule: "If the conditions above are not met, or the appropriate setting (discontinued/dropped) is not checked, the entire order is rejected."** — not the line; **the whole order**.

**Fields — Fulfillment tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Parcel Route | ref (parcel route code) | Route used to ship parcels ordered on eBridge Commerce. |
| Local Parcel Shipping Only | bool, **default unchecked** | Checked → the ship-to ZIP is checked for an association with one or more route codes; **no association → the route code is not offered** (i.e. the address cannot be shipped by that route). Unchecked → route has no restrictions, "can be used to ship anywhere in the U.S." **Only used when `MultiShippingMethod` is selected in eSTORIS Admin panel > STORIS > Shipping > Settings.** |
| Direct Ship Delivery Company | ref (delivery company code), optional | Used to calculate the delivery charge for **direct-ship** line items coming from the web. Blank = feature off. |
| Minimum Number Of Lead Days | int days | Minimum days from order date before scheduled orders ship. |
| Delivery Date Status / Pickup Date Status | enum ×2 | `ASAP (As Soon As Possible)` \| `CWC (Customer Will Call)` \| `Estimated` \| `Scheduled` \| `Use Point of Sale Control Settings`. **Hard rule: with the Pre-Authorization feature, selecting `SCH` disables pre-authorization because the system then processes all eBridge orders as sales.** |
| Delivery Pad Days / Pickup Pad Days | int ×2, each with **In Stock** and **Out of Stock** variants | Sets the start date for scheduled deliveries/pickups **when ATP is turned off in STORIS**. Use the `In Stock` option when the product is available, `Out of Stock` when it is not. **eBridge Commerce reviews the next 99 days from the selected date for open delivery dates.** |

**Fields — Default Point of Sale tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Selling Store | ref (store location code) | Store stamped on **all** sales orders generated by API. |
| Salesperson | ref (salesperson code) | Salesperson stamped on **all** API-generated sales orders. |
| Order Source | enum, **default `STORIS APIs`** | Order source stamped on API orders. |
| Add Store to Manual POS Number | enum | `Point of Sale Control Setting` (defer to `Add Store To Transaction` in Point of Sale Control Settings) \| `Add Store to Transaction` (prefix the selling store number to manually assigned API order numbers) \| `Do Not Add Store to Transaction`. |

**Fields — Other tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Create Related Items From Product Collections | bool | Sync STORIS Product Collections to eBridge as Related Products (`GetProduct` method). **Must be checked for the `Web Benefits` field in Collection Settings to sync.** |
| Create Related Items From Inventory Formations | bool | Sync **Related Inventory Formations** (from Advanced Product Settings, **not** Web Related Inventory Formations) to eBridge as Related Products (`GetProduct` method). Same `Web Benefits` note. **[CONFLICT]** — the identical "must be checked for Web Benefits to sync" note is attached to *both* fields, which cannot both be independently necessary; one of the two notes is a documentation copy-paste error. |
| Salesperson (Other tab) | multi-select (salesperson codes) | One or more salesperson codes to default on all eBridge Commerce orders. **[CONFLICT] duplicates the Default Point of Sale tab's single-valued `Salesperson`** — two fields, same name, different cardinality, both claiming to default the salesperson on web orders. |
| Allow Auto PO Creation | bool | Activate automatic PO creation for eBridge Commerce orders. Interacts with `CFG-SO-AUTOCREATE` **[REUSE]**. |
| Allow Scheduling of Orders on Credit Hold | bool, **default unchecked** | On → the API returns scheduling dates and accepts rescheduling for orders **currently on credit hold**. |
| Order Source (Other tab) | enum | "Select the source of the web orders." **[CONFLICT] duplicates the Default Point of Sale tab's `Order Source`.** |
| # of Times to Attempt to Send to YOTPO | int | Retry count for sending an order to YOTPO; after N failures the order is not sent. **"This field is always available and active, even if YOTPO is not implemented or being used."** |
| Default Tax ID Number | text, **max 15 chars** | Stop-gap default so order submission can proceed **until upgrading to eBridge minimum release 2.1.0.11**. "These fields are not required to have 'real' data; for example, you can enter a tax ID of `999999`." |
| Default Tax Expiration Add On Days | text/int, **max 3 chars** | Companion stop-gap; example value `10`. |

**Behavior & rules.**
- **Whole-order rejection** on failed PO linkage is the single riskiest rule here: a web order silently
  fails in its entirety because one line's inbound PO is on Approval Hold.
- Cart mutation: `Require Available Merchandise` **removes** items from a saved cart on reopen.
- `Delivery Date Status = SCH` silently disables card pre-authorization.
- `Warehouse Product Availability` has a value (`Delivery Ship from Location`) that the field's own
  description does not list — the article documents only two of at least three options.

**Dependencies.** General System Control Settings (`SCS-038`) — API licensing and submodules;
Point of Sale Control Settings (`Add Store To Transaction`, delivery/pickup status defaults) — part B;
eSTORIS Control Settings (`SCS-033`) and eSTORIS Admin panel Shipping Settings; Purchase Order type setting
`Allow Sales Order Linkage to Purchase Order`; Collection Settings (`Web Benefits`); Advanced Product
Settings (Related Inventory Formations); parcel route / delivery company master data; ATP configuration;
`CFG-SO-AUTOCREATE` **[REUSE]**.

**Build notes.**
- New IDs: `CFG-API-AVAILSCOPE`, `CFG-API-ONDISPLAYLOCS`, `CFG-API-ONDISPLAYREASONS`,
  `CFG-API-REQUIREAVAIL`, `CFG-API-ACCEPTOOS-DISCONTINUED`, `CFG-API-ACCEPTOOS-DROPPED`,
  `CFG-API-PARCELROUTE`, `CFG-API-LOCALPARCELONLY`, `CFG-API-DIRECTSHIPCO`, `CFG-API-LEADDAYS`,
  `CFG-API-DELIVSTATUS`, `CFG-API-PICKUPSTATUS`, `CFG-API-PADDAYS-*`, `CFG-API-SELLINGSTORE`,
  `CFG-API-SALESPERSON`, `CFG-API-ORDERSOURCE`, `CFG-API-ADDSTORETONUM`, `CFG-API-RELATED-COLLECTIONS`,
  `CFG-API-RELATED-FORMATIONS`, `CFG-API-AUTOPO`, `CFG-API-SCHEDONCREDITHOLD`, `CFG-API-YOTPORETRIES`,
  `CFG-API-DEFAULTTAXID`, `CFG-API-DEFAULTTAXEXPDAYS`.
- **Do differently:** never reject a whole order because one line cannot be linked to a PO. Accept the
  order, put the unlinkable line into an exception queue, and notify. Whole-order rejection on a web
  channel is lost revenue with no operator visibility.
- **Do differently:** do not silently strip items from a customer's cart. Mark them unavailable and let the
  customer decide.
- **Do differently:** delete the `Default Tax ID Number` / `Default Tax Expiration Add On Days` pattern
  outright — settings whose documented purpose is "put fake data here so validation passes" are how bad
  data gets into a tax system permanently.
- Resolve the duplicated `Salesperson` and `Order Source` fields into one each before building.
- **[GUARDED]** `CFG-API-AVAILSCOPE` and `CFG-API-ONDISPLAYLOCS` change what the storefront can sell;
  changing them with open web carts/orders should be logged and, ideally, staged.
- `[DECISION NEEDED]` LA Mattress channel model: is the website a separate order source with its own
  store/salesperson, and do we allow web sales against inbound POs at all?

### `SCS-008` Ashley Custom Cost Formula
*storis_ref: article 20139429218196*

**Purpose.** A vendor-specific (Ashley) **custom cost formula builder**: composes a product cost from
signed terms so it matches a contractual cost that differs from the Unit Cost, Net Cost, or Discount Cost
delivered by the vendor import.

**Where it lives.** Reached as an alternate cost process; it is the concrete instance of the
`Add-on Calculation Process` mechanism (`SCS-005`). "This process is used by STORIS to create a custom cost
formula to match an Ashley contractual product cost that is different than the Unit Cost, Net Cost, or
Discount Cost found in **Select and Configure a Vendor Import**."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Current Formula | read-only text | Displays the formula currently in effect. |
| Unit Price | enum `None` \| `Plus (+)` \| `Minus (-)`, **default `None`** + `Active` checkbox | "The Unit Price is the original selling price of the product, minus any adjustments." **The change only takes effect if the `Active` checkbox is enabled.** |
| Net Price | enum `None` \| `Plus (+)` \| `Minus (-)`, **default `None`** + `Active` checkbox | "The Net Price is the unit price **after all discounts have been applied and the freight has been added**." |
| Net Price Before Freight | enum `None` \| `Plus (+)` \| `Minus (-)`, **default `None`** + `Active` checkbox | "The net price before freight is the unit price minus (-) discounts." |
| Freight | enum `None` \| `Plus (+)` \| `Minus (-)`, **default `None`** + `Active` checkbox | "Freight is the amount paid to transport goods from one place to another." |
| Discount | enum `None` \| `Plus (+)` \| `Minus (-)`, **default `None`** + `Active` checkbox | Applies a discount term to the formula. |

**Behavior & rules.**
- The formula is literally **a signed sum of five terms**: `cost = Σ ±term` over
  `{Unit Price, Net Price, Net Price Before Freight, Freight, Discount}`, each term optional.
- **The five terms overlap arithmetically.** `Net Price` already includes discounts and freight;
  `Net Price Before Freight` already includes discounts. Selecting, say, `Net Price (+)` and `Freight (+)`
  **double-counts freight**. There is **no documented validation preventing a nonsensical or
  double-counting formula.** **[CONFLICT]** — this is the clearest example in the section of a setting that
  can silently produce wrong money.
- Every term needs *both* a sign and an `Active` checkbox — **a two-part enable that makes "I set it but it
  did nothing" the default failure mode.**
- The screen is described as "used by STORIS", i.e. vendor-implemented, not customer-configurable.

**Dependencies.** `SCS-005` Add-on Calculation Process (the registry that makes `Calculated` selectable);
Costing Control Settings (`SCS-016`); Select and Configure a Vendor Import; `CFG-COSTING-METHOD` **[REUSE]**;
`CFG-VEND-FREIGHTFACTOR` / `CFG-PROD-FREIGHTFACTOR` **[REUSE]**.

**Build notes.**
- New ID `CFG-COSTING-CUSTOMFORMULA` — a named, versioned formula bound to a vendor (scope `VENDOR`, and
  per `SCS-005` possibly `VENDOR_REGION`).
- **Do differently:** model cost as a **typed expression over non-overlapping primitives**
  (`unit_price`, `discount_amount`, `freight_amount`) rather than over pre-aggregated values. Then
  `net_price` and `net_price_before_freight` become *derived*, not selectable terms, and double counting
  becomes structurally impossible.
- Require a **preview**: show the computed cost for N real recent receipts before the formula can be saved.
- Drop the separate `Active` checkbox; `None` already expresses "not used".
- **[GUARDED]** Changing a cost formula changes landed cost and therefore COGS and margin. Block changes
  while open receiving batches or unposted AP cost exceptions exist (same guard as
  `CFG-COSTING-FREIGHTMODE` **[REUSE]**), and version the formula so historical receipts keep the formula
  they were costed under.
- `[DECISION NEEDED]` Does LA Mattress need per-vendor contractual cost formulas, or can vendor cost be
  taken as-given from the invoice? Recommend the latter, with a variance exception (`CFG-COSTING-TOLERANCE`
  **[REUSE]**) rather than a formula.

---

### `SCS-009` Automatic Transfers
*storis_ref: article 15186451010708*

**Purpose.** Not a settings screen — a **behavioral specification** for when STORIS auto-creates inter-location
transfer documents to satisfy a sales order line, including the Inter-Regional Auto Transfer feature, the
"prefer incoming PO over stock-location schema" logic, and the EOD reallocation/cleanup passes. This is the
article that explains what several settings elsewhere actually *do*.

**Where it lives.** Reference article under System Control Settings; the settings it describes live in
Point of Sale Control Settings, Inventory Control Settings, Warehouse/Store Location Settings, Purchasing
Control Settings, General System Control Settings, and Extended Security.

**Fields (settings referenced, with their owning screen)**

| Field | Owning screen | Type | Purpose / business rule |
|---|---|---|---|
| Allow Store to Store (Transfers) | Point of Sale Control Settings, Inventory page | bool | **If left blank, users cannot create transfers unless the main warehouse or the regional warehouse is either the From or the To location.** |
| Auto Schedule Days | Point of Sale Control Settings, Inventory page | int, nullable | **[REUSE] `CFG-POS-AUTOSCHED`** — used to determine the date on which to schedule auto transfers. (Inventory pack already records: **blank disables auto transfers entirely; blank ≠ 0**.) The article confusingly refers to "the Auto Schedule Days field **and** the Auto Schedule Days field on the Inventory page in the Point of Sale Control Settings" — **[CONFLICT]**, apparently two same-named fields on different screens. |
| Delete Regional Auto Transfers | Point of Sale Control Settings *(also cited as Purchasing Control Settings)* | int days | **Entering a number ACTIVATES the Inter-Regional Auto Transfer feature.** Value = the number of days before the scheduled delivery date that auto transfers may remain before EOD deletes them: "if the number of days before the delivery date is **less than** the number of days you enter at this field, the system assumes it is **too late to reallocate** the inventory. The system deletes any auto transfers created for these orders and reapplies your original allocation specifications." **[CONFLICT]** — the article names **Point of Sale Control Settings** in two places and **Purchasing Control Settings** in a third for this same field. |
| Auto Transfer List (+ its `Applies To` field) | Warehouse/Store Location Settings → Actions on the **Merchandise** tab | ordered list of locations + scope filter | Secondary stock locations searched, **in list order**, for inventory. `Applies To` can restrict the list to deliveries and/or customer pickups. |
| Auto Reallocation Pad Days | Purchasing Control Settings | int days | "the number of days you want to add to the merchandise reallocation days to account for the time it takes to receive items from purchase orders and prepare them for auto transfer to the ship-from location." |
| Restrict Inter-Region Transfers | General System Control Settings (`SCS-038`) | bool | Prevents auto transfers crossing regional boundaries under Regional Processing. **Hard rule: "the Inter-Regional Auto Transfer feature OVERRIDES this field and allows transfers across regions."** **[CONFLICT] — a restriction setting that a feature flag silently defeats.** |
| Reserve ASAP Sales | Inventory Control Settings (`SCS-043`) | bool | Enabled → for a linked order with delivery status **ASAP**, the auto transfer is scheduled for **the next day**. |
| Reserve CWC Sales | Inventory Control Settings (`SCS-043`) | bool | Enabled → for a linked order with delivery status **CWC**, **the auto transfer is not scheduled and the delivery date is left blank.** |
| Prefer Incoming Purchase Orders Before Stock Location | Point of Sale Control Settings | bool | Master enable for the prefer-PO logic. "This setting enables the functionality **regardless of how the other settings are configured**." |
| Prefer Purchase Order Over Schema __ Days | Warehouse/Store Location Settings | int days | Window in which an incoming PO beats the stock-location schema; if the PO falls inside the window, **no transfers are automatically created**. |
| Reservation Priority / Reservation Date | Inventory Control Settings (General tab), Advanced Product Settings (Settings page), District and Regional Product Settings (Regional Settings tab) | enum pair | **[REUSE] `CFG-INV-RESERVEBY`** family. Only two combinations are supported with prefer-PO logic — see Behavior. |
| Change auto transfer date to be greater than delivery date | Extended Security | permission | Lets a user set an auto-transfer date **after** the linked sales order's delivery date (merchandise arrives after the customer's delivery date). |

**Behavior & rules.**
- **Auto transfer is created when:** the stock location on a sales order **delivery** line differs from the
  ship-from location; **or** all three of: Inter-Regional Auto Transfers is active, secondary stocking
  locations are defined for the order's location, and insufficient quantity exists at the stocking location
  while sufficient quantity exists at a secondary location **or on an incoming purchase order**.
  The **Automatic Store Stock Replenishment** process also generates auto transfers.
- **Hard rule: "The system does not create auto-transfers for non-inventory items."**
- **Hard rule (quantity change trap, quoted behavior):** if an order with a completed auto transfer for qty 3
  is re-accessed, the stock location changes to the ship-from location; changing it back and raising the
  quantity to 5 creates **a new auto transfer for the entire 5**, *not* for the difference of 2. "To create
  an auto transfer for the difference (2), enter a new line item." **This double-transfers merchandise.**
- **Hard rule:** with Inter-Regional Auto Transfer active, auto transfers are allowed for **SCH** orders
  only and **prevented for EST** orders.
- Auto transfer items received in time for delivery commit to the order, **but if the order is on a manifest
  the system places them on hold.**
- **Search order for available inventory (order entry):** (1) stock at the selected location; (2) open POs
  arriving at that location — `acceptable date = scheduled delivery date – delivery lead days`;
  (3) each location on the Auto Transfer List **in succession**, allocating and posting a message that the
  stock location changed; (4) open POs arriving at that list location —
  `acceptable date = scheduled delivery date – (delivery lead days + auto schedule days)`;
  (5) repeat until satisfied, else **back-order the whole line**. Order Comments are updated for each line
  changed by the process. **Note the odd rule stated twice: "If a purchase order quantity will be received
  by the acceptable date, the order line remains back-ordered."**
- **Hard rule: "To process kits, all kit components must be available at the same location."**
- **Prefer-PO criteria** — an incoming PO line qualifies only if it: is for the same product; is to be
  received at the line's current stock location; has a scheduled date before or within
  `Prefer Purchase Order Over Schema __ Days`; **is not on hold**; and has enough quantity **after
  considering other orders with priority in the reservation queue**.
- **Prefer-PO reservation-config constraint (hard):** only two configurations are supported, on
  Inventory Control Settings (General tab), Advanced Product Settings (Settings page), and District and
  Regional Product Settings (Regional Settings tab) —
  **Configuration 1:** `Reservation Priority = Delivery Date`, `Reservation Date = Delivery Date within Auto Fill Days`.
  **Configuration 2:** `Reservation Priority = Order Date`, `Reservation Date = Immediate`.
  Anything else raises a warning, both when enabling the logic and when later changing the reservation
  settings out of alignment. **This is an explicit cross-screen guarded-change requirement.**
- Prefer-PO date basis: reserving by delivery-date-within-auto-fill-days → compare to the line's scheduled
  fulfillment date; a schema applied to a **new line on an unscheduled fulfillment** → compare to
  **the current system date**; reserving by `Order Date - Immediate` → the **current system date** starts
  the preferred-PO window.
- Prefer-PO is re-evaluated on: adding a new line to a Sales Order or Exchange; changing the stock location
  on an existing line; changing the fulfillment location; adding a fulfillment date to an unscheduled
  fulfillment; moving a fulfillment date from outside to inside the fill window; changing a fulfillment
  status from **CWC or ASAP to Estimated or Scheduled**. An **audit comment** is written when a schema is
  skipped.
- **Worked use cases (verbatim scenario):** SKU `BCH1`; location `01` has a schema to warehouse `88`;
  transfer takes **5 days**; no QOH at `01`; `Prefer Purchase Order Over Schema Days = 3`; date `08/20`;
  fill window `15 days`.
  **Case 1** — PO qty 3 due at `01` on `8/28`; new line qty 1 scheduled `08/25` → PO is within 3 days of the
  line's date, so stock location stays `01`, **no transfer created**.
  **Case 2** — same PO; an earlier order for qty 2 is already in the reservation queue; new line qty 1 →
  still enough PO quantity after the earlier order, **no transfer**.
  **Case 3** — same PO; earlier order qty 2 queued; new line qty **3** → not enough PO quantity left, so
  stock location switches to `88` and **an auto transfer for the full quantity 3** is created.
  **Case 4** — same PO; new line qty 1 scheduled **`08/20`** → PO arrives more than 3 days after the line's
  date, so location switches to `88` and an auto transfer for qty 1 is created.
- **Unscheduled linked transfers:** unscheduling a sales order line unschedules its linked auto transfer;
  **if the transfer had reserved merchandise, that merchandise is unreserved**, and the EOD reservation
  process **will not reserve to unscheduled auto transfers**.
- **EOD, step 1:** examine all non-scheduled sales orders with **EST** delivery status **and** reserved
  merchandise; if a PO will arrive in time, **release the reserved pieces**. "the system does **not** release
  **assigned** pieces."
- **EOD, step 2:** re-examine orders with linked auto transfers; remove the auto transfer and set the stock
  location to the ship-from location when **both**: merchandise has become available at the ship-from
  location, **and** the days before scheduled delivery is **less than** `Delete Regional Auto Transfers`.
  Then EOD reserves remaining available merchandise.
- **EOD will not delete an auto transfer if any of these are locked (being updated by another process):
  the auto transfer, the linked order, or the PIN record.** The reason is written to the EOD
  **`Report Error Message`** report.
- **Next-PO-date calculation is skipped** for items that: are the Return portion of an Exchange order; are
  already reserved; have different ship-to and stock locations; are not a Pickup or Delivery type; are a
  delivery when deliveries are restricted via `Applies To` on the Auto Transfer List; are a customer pickup
  when pickups are restricted via `Applies To`; are not a **SCH** delivery or customer pickup order; have an
  **as-is** status; are a **special order** product; are already linked to a purchase order; are **not within
  the auto fill days**. **Hard kit components are skipped — they are processed under the kit master.**
- **EOD "Remove Reserved Merchandise"** un-reserves a line only if: a value exists in
  `Delete Regional Auto Transfers`; the line has **no assigned pieces**, **no as-is merchandise (regular or
  kit)**, **no special-ordered merchandise**; the line is **not already linked to a specific incoming PO**;
  the line is **not a hard kit component** (hard kits are evaluated as a whole via the kit master and **all**
  components must qualify); and **the delivery date on the order is equal to or prior to the delivery
  requested-by date**. Eligible lines have reserved pieces released back into inventory.
- **EOD "Remove Auto Transfers and Allocate Merchandise"** removes an auto transfer only if: a value exists
  in `Delete Regional Auto Transfers`; the line has an auto transfer attached; the auto transfer is **not
  linked to a specific incoming PO**; the line has **no as-is (regular or kit)** and **no special-ordered**
  merchandise; **the automatic transfer does not have a status of `assigned`**; and **sufficient inventory
  exists at the shipping location to completely fill the line**.

**Dependencies.** `CFG-POS-AUTOSCHED` **[REUSE]**; `CFG-INV-RESERVEBY` **[REUSE]**; `CFG-LOC-REPLDAYS`
**[REUSE]**; Point of Sale Control Settings (part B); Inventory Control Settings (`SCS-043`); Warehouse/Store
Location Settings; Purchasing Control Settings (part B); General System Control Settings (`SCS-038`);
Stock Reservation Settings; Advanced Product Settings; District and Regional Product Settings;
Extended Security; `EOD-001`; manifest/WMS.

**Build notes.**
- New IDs: `CFG-POS-ALLOWSTORE2STORE`, `CFG-POS-DELETEREGIONALAUTOXFER` (**this value doubles as the
  feature's on/off switch — split it into `CFG-XFR-INTERREGIONAL-ENABLED` (bool) +
  `CFG-XFR-REALLOC-CUTOFF-DAYS` (int) in our model**), `CFG-LOC-AUTOXFERLIST` (ordered list +
  `applies_to ∈ {DELIVERY, PICKUP, BOTH}`), `CFG-PUR-AUTOREALLOCPADDAYS`,
  `CFG-SYS-RESTRICTINTERREGION`, `CFG-INV-RESERVEASAP`, `CFG-INV-RESERVECWC`,
  `CFG-POS-PREFERPOBEFORESCHEMA`, `CFG-LOC-PREFERPODAYS`,
  `SEC-XFR-DATEAFTERDELIVERY`.
- **Guarded changes (explicitly required by the source):** enabling `Prefer Incoming Purchase Orders Before
  Stock Location` requires `Reservation Priority`/`Reservation Date` to be in Configuration 1 or 2 on
  **three** screens; and changing those reservation settings afterwards must re-validate. Implement this as
  a **cross-setting invariant** in the settings service, not a warning — STORIS only warns.
- **Guarded:** `CFG-XFR-REALLOC-CUTOFF-DAYS` and `CFG-POS-AUTOSCHED` change in-flight transfer scheduling;
  `CFG-INV-RESERVEBY` **[REUSE]** already noted as triggering a re-allocation batch. Do not allow changes
  while an EOD run is in progress.
- **Do differently (bug-level):** the qty-3→5 case creates a duplicate transfer for the whole quantity.
  Our implementation must transfer **only the delta**, and must net already-transferred quantity.
- **Do differently:** `Restrict Inter-Region Transfers` being silently overridden by a feature flag is a
  compliance hole. If a restriction is configured, no feature may override it — make the override explicit
  and permissioned.
- **Do differently:** "If a purchase order quantity will be received by the acceptable date, the order line
  remains back-ordered" reads as inverted logic in the source. Verify against live behavior before
  implementing; our rule should be: PO arrives in time → reserve against the PO, do **not** back-order.
  `[DECISION NEEDED]` — confirm with STORIS/actual system.
- Reproduce the "locked record" guard: never delete a transfer whose document, order, or inventory record is
  being mutated; log the reason to an operator-visible exception report.
- `[DECISION NEEDED]` LA Mattress network shape — how many DCs/regions, and do we need an ordered
  secondary-location search list per store at all, or a single DC-and-spoke model?

### `SCS-010` Bar Code Add-On Settings
*storis_ref: article 15186416511636*

**Purpose.** Explains the three **licensed barcode capability tiers** and what each unlocks. Not a screen of
its own — the fields live on the **Active Add-Ons** tab of General System Control Settings (`SCS-038`).

**Where it lives.** `General System Control Settings > Active Add-Ons tab` — fields
`Inventory Barcode`, `Warehouse Management Barcode`, `Advanced Warehouse Management`.
(The article says "General Control System Settings"; elsewhere the screen is "General System Control
Settings" — same screen.)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Inventory Barcode | bool (licensed add-on) | **Tier 1.** Enables, beyond the core level: **all Batch Barcode functions**, plus the RF Barcode functions — `PO receiving`, `Bin to Bin transfer`, `Cycle counting`, `Physical Inventory`, `Inventory Transfer receiving`. |
| Warehouse Management Barcode | bool (licensed add-on) | **Tier 2. Hard prerequisite: the Inventory Barcode features must already be enabled.** Enables exactly one feature: **the RF Picking process.** |
| Advanced Warehouse Management | bool (licensed add-on) | **Tier 3. Hard prerequisite: both Inventory Barcode and Warehouse Management levels must already be enabled.** Enables the **Advanced Warehouse Management (AWM)** module. |

**Behavior & rules.**
- **Strictly ordered, cumulative tiers** — tier N cannot be activated without tier N−1. This is a
  license-gated capability ladder, not three independent flags.
- These flags gate whether entire tabs appear elsewhere: the **Inventory** tab of Bar Code Control Settings
  (`SCS-011`) requires `Inventory Barcode`; the **Warehouse Management / AWM** tab requires
  `Advanced Warehouse Management`.

**Dependencies.** General System Control Settings (`SCS-038`); Bar Code Control Settings (`SCS-011`);
physical inventory, cycle count, receiving, and transfer processes.

**Build notes.**
- `CFG-LIC-BARCODE-TIER` — model as a single **ordinal** capability level
  (`NONE < INVENTORY < WMS_PICKING < AWM`) rather than three booleans, which makes the prerequisite chain
  structural instead of validated.
- **[GUARDED]** Downgrading the tier while RF batches, AWM schedules, or putaway assignments exist would
  strand in-flight work. Require the tier to be lowered only with zero open barcode batches / AWM schedules.
- `[DECISION NEEDED]` LA Mattress: is RF picking/AWM in scope for phase 1, or do we start at the
  Inventory-Barcode tier (receiving, cycle counts, physical inventory) and defer directed picking?

---

### `SCS-011` Bar Code Control Settings
*storis_ref: article 15186501558292*

**Purpose.** Governs the whole Bar Code module: sequence counters, purge/retention windows, UPC and serial
behavior on scan, Zebra label program names and print media, RF receiving/transfer rules, and AWM picking
and scheduling policy.

**Where it lives.** `System Administration > System Settings > Purchasing and Logistic System Settings > Bar Code Control Settings`.
Tabs: **General, Inventory, Warehouse Management, Labels**.
Note from the source: "Some fields in this control file apply only to either Batch Bar Code or to Radio
Frequency (RF) Bar Code. Also note that some system control settings are accessible by STORIS personnel only."

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Next Batch Number PIN | int (sequence) | Sequential counter assigning numbers to **all** bar code batches, **including Warehouse Receiving and Physical Inventory batches**. |
| Transfer Purge Days | int days | Days to hold transfers in the audit file for *Report Bar Code Bin-to-Bin Transfer Activity* (Barcode Transfer Report). |
| Consolidated Picking Purge Days | int **1–999** | Days after which Consolidated Picking Maintenance items are purged, **during Generate Daily Reports**. |
| Next Cross Reference Number | int (sequence) | Unique bar code cross-reference number assigned when a product is created; also used for **label printing and product tracking**. |
| Receive Using Bar Code Labels | bool | Controls access to *Assign a User to Physical or Cycle Count Locations* (Batch Maintenance) and the printing options in *Print a Purchase Order Merchandise Label* (Purchase Order Label Print). **Rationale quoted: leaving it inactive "prevents the accidental misuse of receiving labels as stock labels for special-ordered products, in which the labels do not accurately reflect the PIN sequence number."** |
| Use UPC | bool | Global UPC enablement. "allows RF Warehouses to enable UPC at will, without any additional support fields." |
| Use STORIS Label as Serial Number | bool | On → when serial tracking is active and a serial-tracked product is received, **STORIS auto-assigns the last five digits of the bar code label's reference number as the serial number** during RF scanning. Off → **items must be scanned twice**, the second scan assigning the serial number. |
| Prompt for Serial Number in RF Picking | bool | On → RF picking **mandatorily** prompts for a serial number when merchandise is serial tracked **but `Serial Number Tracking` is NOT active in Inventory Control Settings**. **Hard rule: cannot be selected if `UPC Tracking` in Advanced Product Settings is activated — "UPC Tracking must be deselected from all products in the account before turning on Prompt for Serial Number in RF Picking."** **[GUARDED — an account-wide data precondition.]** |
| Merchandise Label Name | text (program name) | Stock merchandise label program. Standard: **`BC.STOCK.LBL`**. Used for products with `Label Type = Standard` in Advanced Product Settings (Product Full). |
| Accessory Label Name | text | Accessory label program. Standard: **`BC.ACC.LBL`**. Used for products with `Label Type = Accessory`. |
| Warehouse Bin Label Name | text | Warehouse storage (bin) location label program. Standard: **`BC.LOCATION.LBL`**. |
| Warehouse Float Label Name | text | Warehouse float label program. Standard: **`BC.FLOAT.LBL`**. |
| Multibox Label Name | text | Multi-carton label program. Standard: **`BC.MULTI.LBL`**. Used for products with **`Boxes per Product` > 1** in Advanced Product Settings. |
| Prep Label Name | text | Prep label program. Standard: **`BC.PREP.LBL`**. "used for additional identification during the picking process." |
| Costing Batch Mandatory | bool | On → users **must** assign a costing batch in Bar Code Batch Maintenance (via *Assign Purchase Orders to a Bar Code Receiving Batch*). |
| Print Driver *(Local Printing)* | text (program name) | Barcode driver program when the Zebra label printer is connected locally to a PC or terminal. |
| Continuous Stock *(Local Printing)* | bool | Label media is one continuous label needing cutting, vs die-cut stock with pre-cut separators. |
| Cutter Installed *(Local Printing)* | bool | Zebra printer has a built-in cutter for continuous stock. |

**Fields — Inventory tab** *(available only if `Inventory Bar Code` is active on the Active Add-Ons tab of General System Control Settings — see `SCS-010`)*

| Field | Type | Purpose / business rule |
|---|---|---|
| Log Bin To Bin Exceptions Only | bool | On → log only exception messages. Off → log **all** messages including exceptions. |
| Always Prompt for Transfer-To Location | bool | On → scanner operators must scan a location label **for each product** during the transfer destination process. Off → **one location scan covers multiple products.** |
| Allow Over Receiving | bool | On → **RF users** may receive more than scheduled; "The scanned label increases the receipt quantity of the purchase order line to greater than the sum of the schedule quantity assigned to all batches that reference the purchase order line." Off → over-receiving not allowed. **Non-RF users are governed by a different control: `Allow to Over Receive Merchandise` in Create a User/Group Actions - Logistics Security.** **[CONFLICT]** — two independent over-receive authorities (a system setting for RF, a user permission for non-RF). |
| End of Day Audit Report | enum | Options for printing the **Bar Code Transfer Audit Report** at End of Day (Batch Bar Code Processing): `None` (report no exceptions) \| `Exception Only` \| `All` (all activity including exceptions). |

**Fields — Warehouse Management tab (AWM)** *(used only if the AWM application is `Active` in General System Control Settings)*

| Field | Type | Purpose / business rule |
|---|---|---|
| User(s) Picking Customer Pickups | enum | `Single (Single User)` — only one user may pick a single order \| `Multiple (Multiple Users)` — multiple users may pick the same CPU order. **"Important: If picking ranges are in use and you set this field to Single User, single users may not be able to completely pick an order."** |
| Scheduling Lead Days — Deliveries | int **0–9** | Days from the order's scheduled date within which picking may be scheduled. **`0` → only the current date is offered; `1` → today and tomorrow.** Feeds *Create an AWM Schedule* and *Create a Default AWM Schedule*. |
| Scheduling Lead Days — Transfers | int **0–9** | As above, for transfer picks. |
| Scheduling Lead Days — Receiving | int **0–9** | As above, for warehouse receipts. |
| Scheduling Lead Days — Customer Pickups | int **0–9** | As above, for CPU picks. |
| Retention Days — History | int days | Retention of warehouse management schedule data before purge. **"STORIS recommends setting this field in the 30 to 60 day range, to facilitate faster performance on the RF terminals and in the scheduling functions."** |
| Retention Days — Putaway Exceptions | int **1–999**, **initially 30** | Retention of putaway exceptions, purged during End of Day. **Mandatory if the Directed Putaway feature is used.** |
| Retention Days — Putaway Assignments | int **1–999**, **initially 30** | Retention of putaway assignment records, purged during End of Day. **Mandatory if the Directed Putaway feature is used.** |
| RF PICKING - Check Product Serial Numbers | bool | On (with serial tracking active for system and product) → prompts for specific piece numbers; **pickers must pick the exact piece assigned on the order.** Off → any piece of the same product may be picked. |
| RF PICKING - Exchange Delivery (Pickups) First | bool | On → exchange pickups are placed **ahead of** other transactions in the pick list. Off → pickup exchanges are FIFO. Rationale quoted: a damaged customer-pickup piece generates a service-department exchange that jumps the queue so the customer gets a replacement immediately. **Available for both standard RF picking and AWM scheduled picking.** |
| RF PICKING - Merchandise Transfers by Final Route | bool | Pick merchandise transfers by **destination (final) route**. **Hard prerequisite: the `RF PICKING - Merchandise Transfers by Route` check box must be enabled first.** Adds a prompt to choose a single destination route or all "transfer-to routes". **"Important! Picking Transfers by Final Route is not permitted when warehouse locations are set to pick Transfers by Final Order."** **[CONFLICT/GUARDED — mutually exclusive with a per-location setting.]** |
| RF PICKING - Merchandise Transfers by Route | bool | (Referenced as the prerequisite for the field above; not separately documented in this article.) |
| RF PICKING - Report Skipped Picks | bool, **default unchecked** | Reports skipped picks via *Report AWM User Exceptions*, sourced from the **RF Detail Transaction Log**. Log is written when the setting is checked **and** the user enters `SKIP` at either the `Scan Locn` or `Scan prod` prompt **and** RF picking was accessed from the AWM schedule. **Counting rule: for a directed quantity > 1, one log entry per piece (3 of `XYZ123` → 3 entries) EXCEPT bulk items, where a single entry carries the quantity (10 of `BULK123` → 1 skipped pick with quantity 10).** Applies to Whse Transfer, Deliveries, Customer Pickup, and Pick Special. **"When the directed picking list has been exhausted and some picks were skipped, the user can choose to pick those skipped pieces (`Pick skipped pcs`). If those products are skipped again, those 'second' skips are not logged. If the user chooses to restart picking, skipping previously skipped products log new exceptions for the same product."** RF picking also logs **damaged (`DG`)** and **not in location (`NIL`)** flags. |

**Fields — Labels tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product Image Options For Forms Designer | enum | `No Product Images` \| `Use Thumbnail` \| `Use Standard Size Image` \| `Use Large Image`. Three-part setup required: (1) select an image size here; (2) in Forms Designer, drag the **`StorisPictureBox`** control onto the label (Tools tab) and drag the **`product_image`** tag into the picture box (Form Data tab); (3) attach images to products via the **Image Wizard**. Then e.g. *Print an Inventory Floor Tag* prints images for products that have one. **"Including product images in your labels can significantly increase the download time for a label batch."** Related to `CFG-PROD-IMAGEMODE` **[REUSE]**. |
| Default Product Label Type | enum | Default for `Label Type` in Advanced Product Settings for **new** products: `Standard - (6.1 x 3.25)` \| `Accessory - (1.5 x 3.25)`. **Affects only labels printed to a Zebra printer.** |

**Behavior & rules.**
- **Serial-number acquisition has three mutually interacting controls:** `Use STORIS Label as Serial Number`
  (auto-assign last 5 digits of the label reference), `Prompt for Serial Number in RF Picking` (mandatory
  prompt when serial tracking is *off* in Inventory Control Settings), and `RF PICKING - Check Product
  Serial Numbers` (must pick the exact assigned piece). **They can be configured into contradictory states.**
- **Account-wide precondition:** `Prompt for Serial Number in RF Picking` requires **UPC Tracking to be off
  on every product in the account**.
- Purge/retention fields on this screen delete operational audit data during EOD/EOM.
- Label "names" are **program names**, entered at initial system setup "after conferring with a qualified
  STORIS representative" — effectively vendor-managed.

**Dependencies.** General System Control Settings (`SCS-038`) — `Inventory Bar Code`, AWM active flags;
Bar Code Add-On Settings (`SCS-010`); Inventory Control Settings (`SCS-043`) — `Serial Number Tracking`,
and `CFG-INV-LOCTRACK` **[REUSE]** for bin locations; Advanced Product Settings — `Label Type`,
`Boxes per Product`, `UPC Tracking`; Create a User/Group Actions - Logistics Security —
`Allow to Over Receive Merchandise`; Forms Designer / Image Wizard; `CFG-PROD-IMAGEMODE` **[REUSE]**;
`EOD-001`; Directed Putaway; warehouse location pick-sequencing settings.

**Build notes.**
- New IDs: `CFG-BC-NEXTBATCHPIN`, `CFG-BC-TRANSFERPURGEDAYS`, `CFG-BC-CONSOLPICKPURGEDAYS`,
  `CFG-BC-NEXTXREF`, `CFG-BC-RECEIVEUSINGLABELS`, `CFG-BC-USEUPC`, `CFG-BC-LABELASSERIAL`,
  `CFG-BC-PROMPTSERIALPICK`, `CFG-BC-LABELPROG-*` (6), `CFG-BC-COSTBATCHMANDATORY`,
  `CFG-BC-PRINTDRIVER`, `CFG-BC-CONTINUOUSSTOCK`, `CFG-BC-CUTTER`, `CFG-BC-LOGEXCEPTIONSONLY`,
  `CFG-BC-ALWAYSPROMPTTOLOC`, `CFG-BC-RFOVERRECEIVE`, `CFG-BC-EODAUDITREPORT`,
  `CFG-AWM-CPUPICKMODE`, `CFG-AWM-LEADDAYS-{DELIV,XFER,RCV,CPU}`, `CFG-AWM-HISTORYDAYS`,
  `CFG-AWM-PUTAWAYEXCDAYS`, `CFG-AWM-PUTAWAYASSIGNDAYS`, `CFG-AWM-CHECKSERIAL`,
  `CFG-AWM-EXCHANGEFIRST`, `CFG-AWM-XFERBYROUTE`, `CFG-AWM-XFERBYFINALROUTE`,
  `CFG-AWM-REPORTSKIPPEDPICKS`, `CFG-BC-LABELIMAGEMODE`, `CFG-BC-DEFAULTLABELTYPE`.
- **Guarded changes:** `CFG-BC-PROMPTSERIALPICK` (requires UPC Tracking off account-wide — validate, don't
  warn); `CFG-AWM-XFERBYFINALROUTE` (mutually exclusive with per-location "Transfers by Final Order");
  all retention/purge fields (lowering deletes audit data at next EOD/EOM); `CFG-BC-NEXTBATCHPIN` and
  `CFG-BC-NEXTXREF` (**sequence counters — moving them backwards causes duplicate keys; must be
  monotonic-only in our implementation**).
- **Do differently:** unify RF and non-RF over-receiving under one authority — a permission with an
  optional tolerance — rather than a system flag for RF and a user permission for everyone else.
- **Do differently:** replace label *program names* with named label **templates** in our own renderer.
  Keep the concept of per-product `label_type` and multi-carton templates.
- **Do differently:** the skipped-pick counting rule (per-piece except bulk) will make analytics
  inconsistent. Log per-piece always, with a `bulk_quantity` field.
- `[DECISION NEEDED]` Serial tracking: does LA Mattress serial-track anything (adjustable bases, warranty
  units)? If yes, decide serial capture point (receiving vs picking) once — do not replicate STORIS'
  three-flag arrangement.

### `SCS-012` Cash Balancing Control Settings
*storis_ref: article 15186452327700*

**Purpose.** Defines how cash drawers are balanced (by cashier, store, or drawer), the over/short tolerance,
the suspense mechanism for unbalanced drawers, which payment types participate, and the cashier/drawer
identity used for eBridge web pre-authorization.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Cash Balancing Control Settings`.
"NOTE: Some system control settings are accessible by STORIS personnel only."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Cash Receipt Purge Days | int days | Days **after the associated cash drawers have been balanced** that cash receipt records remain before the End of Day process purges them. **If `Extended Cash Balancing` is checked, nothing purges until full cash balancing has completed AND the purge days have elapsed. If unchecked, records purge purely on the day count.** **Hard rule: "if you select `None` at the `Group Payments by` field, you inactivate the Cash Balancing feature and ALL EXISTING CASH RECEIPT RECORDS PURGE during the End of Day process."** **[GUARDED — this is a data-destroying setting change.]** |
| Extended Cash Balancing | bool | Full cash balancing in use. Checked → **cash drawers must be balanced before purging**, and **`Group Payments by`, `Maximum Over/Short`, and `Number of Tries` all become mandatory.** |
| Extended Cash Balancing Report | bool | Extended report version, adding per transaction: `customer's name`, `cash drawer reference number`, `manager's initials (if override was necessary)`. |
| Include Written Financing | bool | Include written financing transactions when balancing a drawer. |
| Include Financed Deposits | bool | Include financed deposits when balancing a drawer. |
| Open Cash Drawer for Cash Only | bool | Checked → the physical drawer opens for **cash only**. Blank → also opens for `credit card`, `gift card`, `check`, `Miscellaneous payment`. **Hard rule: "The cash drawer does not open for debit cards or electronically-converted checks, regardless of your setting at this field."** |
| Cashier *(WEB)* | ref (user ID), optional | Associates eBridge web transactions with a specific cashier. **Active only if the eBridge module is active.** |
| Drawer *(WEB)* | ref (cash drawer ID) | Associates eBridge web transactions with a specific drawer. **Active only if `Balance By` = `Drawer`. Required to use the Pre-Authorization feature.** |
| Prompt For | enum | **(LOCKED - STORIS access ONLY!)** Restricts cash balancing prompts to `All Payment Types that exist in the database` \| `Just those Entered during the day`. **STORIS recommends `Just those Entered`.** |
| Group Payments by | enum | **Locked for STORIS access only.** Method of balancing cash receipts. **Mandatory if `Extended Cash Balancing` is checked** (STORIS then recommends `Cashier`, `Store`, or `Drawer`). Options: `None` — cash balancing not used; `Cashier` — balancing by cashier; `Store` — balancing by store; `Drawer` — **requires users to log in with a cash drawer before entering a payment** (valid whether or not Extended Cash Balancing is checked). **`Drawer` is mandatory for the Pre-Authorization feature.** |
| Next Reference Number | int (sequence) | Number used when generating cash balancing batches, incremented by one per batch. |
| Maximum Over/Short | money | Allowed variance between operator-entered **CASH** totals and system-entered **CASH** totals. Within tolerance → accepted as "balanced"; over tolerance → out-of-balance warning. **Mandatory if `Extended Cash Balancing` is checked.** |
| Number of Tries | int | With `Post to Suspense`: the number of times a user may Save-and-exit an unbalanced batch on the **Blind Cash Balancing Screen** before the drawer is suspended and totals are written to a **suspense file**, correctable only via **Balance Approval by Manager**. **Mandatory if `Extended Cash Balancing` is checked.** **"If the `Post to Suspense` field is not checked (default is checked), the system ignores the value in this field."** |
| Post to Suspense | bool, **default checked** | **(LOCKED - STORIS access ONLY!)** Checked → the `Number of Tries` mechanism applies and unbalanced drawers go to suspense. Unchecked (**"not recommended"**) → **the drawer must be balanced before the user can save and exit at all.** |
| Excluded Payment Types | multi-select (payment type codes), optional | Payment types excluded from cash balancing. Excluded types do not appear in the grid of **Blind Cash Balancing** or **Balance Approval by Manager**, nor on **Report Cash Drawer Balancing Totals**. **Hard rule: "If `Cash` is selected here, the `Daily Maximum Cash Refund Per Customer` setting in Accounts Receivable Control Settings is negated, even if an amount exists in that field."** **[CONFLICT] — a cash-balancing exclusion silently disables an unrelated A/R refund limit (`CFG-AR-MAXCASHREFUND`, `SCS-002`).** |

**Behavior & rules.**
- **Pre-Authorization setup chain (ordered, all required):** (1) `Group Payments by` = `Drawer`;
  (2) populate the WEB `Drawer` field; (3) check `Use Auth/Capture for Credit Cards` in **Web Control
  Settings**. "The web control setting is not available until you set the `Group Payments by` field to
  `Drawer` and indicate an eSTORIS Drawer."
- **`Cashier` mode identity prompt:** with `Cashier` selected, *Enter a Customer Payment* opens the Access
  Control Window for Initials and Password — **"This is to identify the user entering the payment only; no
  security check is performed and the `Reason for Override` prompt is not active."** A credential prompt
  that authenticates nothing.
- **Hard rule:** `Cashier` is **not available** if `Verify User ID During Entry` is active in **Point of
  Sale Control Settings**, **Quick Sale Control Settings**, or **Service Control Settings**.
- The article refers to the same field as both **`Group Payments by`** and **`Balance By`** — **[CONFLICT]**,
  two names for one field within a single article.

**Dependencies.** Accounts Receivable Control Settings (`SCS-002`) — `CFG-AR-MAXCASHREFUND` negation;
Web Control Settings (`Use Auth/Capture for Credit Cards`); eSTORIS Control Settings (`SCS-033`);
Point of Sale / Quick Sale / Service Control Settings (`Verify User ID During Entry`);
Financing Control Settings (`SCS-036`); payment type master data; `EOD-001`;
Balance a Cash Drawer, Blind Cash Balancing, Balance Approval by Manager routines.

**Build notes.**
- New IDs: `CFG-CASH-RECEIPTPURGEDAYS` **[GUARDED]**, `CFG-CASH-EXTENDED`, `CFG-CASH-EXTENDEDREPORT`,
  `CFG-CASH-INCLWRITTENFIN`, `CFG-CASH-INCLFINDEPOSITS`, `CFG-CASH-DRAWEROPENCASHONLY`,
  `CFG-CASH-WEBCASHIER`, `CFG-CASH-WEBDRAWER`, `CFG-CASH-PROMPTFOR` (locked),
  `CFG-CASH-GROUPBY` (locked) **[GUARDED]**, `CFG-CASH-NEXTREFNUM`, `CFG-CASH-MAXOVERSHORT`,
  `CFG-CASH-NUMTRIES`, `CFG-CASH-POSTTOSUSPENSE` (locked), `CFG-CASH-EXCLUDEDPAYTYPES` **[CONFLICT]**.
- **Guarded change, highest severity in this article:** setting `CFG-CASH-GROUPBY = None` **purges all
  existing cash receipt records at the next EOD.** Our settings service must refuse this outright unless an
  operator confirms an explicit, counted, irreversible-deletion dialog — and we should simply never
  implement "turn the feature off and delete the audit trail" as a single action.
- **Do differently:** `Excluded Payment Types` must not be able to silently void a refund limit. Make the
  A/R cash-refund cap independent of cash-balancing configuration, and surface a validation error if the two
  are configured inconsistently.
- **Do differently:** the `Cashier` identity prompt collects a password and performs no check. Either
  authenticate or don't ask. We should authenticate.
- **Do differently:** `Post to Suspense` unchecked traps a cashier who cannot balance. Always allow
  save-to-suspense; make manager approval the only path out.
- Model the Pre-Authorization prerequisite chain as a settings-service invariant, not documentation.
- `[DECISION NEEDED]` LA Mattress: balance by drawer, cashier, or store? Recommend **drawer**, since it is
  the only mode compatible with card pre-authorization and gives per-till accountability.

---

### `SCS-013` Check-Levels for Exceptions
*storis_ref: article 15186416511124*

**Purpose.** Defines the shared **four-level escalation enum** reused by every "check level" exception field
in Point of Sale Control Settings. This is a *type definition*, not a screen.

**Where it lives.** The enum's fields live throughout **Point of Sale Control Settings**; this article
documents the shared value set.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (any `*check level*` field) | enum, 4 values | `Do Not Alert` — "The system does not check data entered against any other files and does not create an exception."<br>`List on Exception Report` — "The system creates an exception."<br>`Warning Message` — "The system issues a warning message and creates an exception."<br>`Security Override` — "The system requires a security password to override the warning message. The system creates an exception and notes the user (any) who authorized the override." |

**Behavior & rules.**
- **Hard rule:** `Do Not Alert` does not merely suppress the alert — **the system does not perform the check
  at all.** It is "disable the validation", not "disable the message".
- **The four levels are strictly increasing in strictness**: no check → silent exception record → warning +
  exception → password + exception + authorizer recorded.
- **"All exceptions generated by the system appear on the `TE Exceptions` report generated during the
  End-Of-Day process."** — one common exception sink.

**Dependencies.** Point of Sale Control Settings (part B) — every check-level field, including
`CFG-POS-QTYERR` **[REUSE]**; security override subsystem; `EOD-001` (`TE Exceptions` report).

**Build notes.**
- New shared type `CHECK_LEVEL ∈ {NONE, REPORT_ONLY, WARN, SECURITY_OVERRIDE}` — declare it once in the
  settings service and reference it from every check-level setting rather than re-declaring per field.
- Every level except `NONE` must write an exception record with: rule id, entity, entered value, expected
  value, user, timestamp, and (for `SECURITY_OVERRIDE`) the authorizing user. Feed one exceptions table,
  one report.
- **Do differently:** rename `NONE` to make the semantics unmistakable — `DISABLED_NO_CHECK`. Operators
  reading "Do Not Alert" reasonably expect the check still to run.
- `[DECISION NEEDED]` LA Mattress default level per check. Recommend defaulting everything to at least
  `REPORT_ONLY` so no rule is ever silently un-enforced.

### `SCS-014` Collections Processing Control Settings
*storis_ref: article 15186501540756*

**Purpose.** Defines the criteria and cadence by which customers are assigned to (and removed from)
Collections, and which collector they land with.

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Collection System Settings > Collections Processing Control Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Alphabetical | bool | Assign customers to collectors by the first letter of the last name. Ranges are defined in **Collector Settings**. **Hard rule: un-checking this box prompts that proceeding "will clear any alpha ranges currently specified in the Collector settings. To preserve those alpha ranges, you must abort the edit."** **[GUARDED — turning a flag off destroys configuration data on another screen.]** |
| Minimum Days | int days, nullable | Days past due before a customer is eligible for collector assignment. Customers **exceeding** this value are assigned. **Blank → days-past-due is not used as a criterion.** |
| Minimum Amount | money, nullable | Minimum past-due balance qualifying for assignment. Customers whose past-due balance **equals or exceeds** this are assigned. **Blank → amount is not used as a criterion.** (Note the asymmetry: days uses *exceeds*, amount uses *equals or exceeds*.) |
| District | bool | Assign based on the district of the customer's assigned store (`Store Assignment` in Advanced Customer Settings). **Active only if Regional Processing is active AND `Location` is inactive — district and location cannot be used simultaneously.** |
| Location | bool | Assign based on the customer's assigned store. **Active only if `District` is inactive.** |
| Collection Letters | enum | `Forms Designer` — print via the *Print Collections Letters* routine \| `Export Letter` — create a data file exportable to Excel, "one column for each piece of information and one row for each customer", for mail-merge or an external process. |
| Automatic Reassignment | bool | Auto-reassign customers as their Collections criteria change. Blank → manual reassignment only. |
| Remove When Current | bool | Auto-remove customers from Collections when they no longer match the criteria. Blank → manual removal only. |
| Default Collections Manager | ref (collector) | Fallback collector "when it cannot determine a collector … (for example, the customer does not match any Collections criteria and a default collections manager is not defined for the store location to which the customer is assigned)." |
| Evaluate During | bool | **(LOCKED - STORIS access ONLY!)** Checked → customers are assigned to collections during **Cycle Processing**. Unchecked → during **End of Day** processing. |
| Number of Phantoms | int **2–9** | **Active and mandatory only when `Evaluate During` = End of Day.** "It determines how many times the phantom is run during end of day processing." |
| **Actions → District/Store Location** | action | (Sub-action of the Actions button; not further described.) |
| **Actions → Unassigned Collections** | action/report | "display gaps in the Collections Assignment table. The report lists all table entries assigned to the selected collector." |

**Behavior & rules.**
- **Assignment criteria precedence (hard, quoted):** customers may be assigned "alphabetically via the
  customer's last name", by "days overdue", or by "amount overdue" — **"If you use more than one method, the
  system uses the above hierarchy to assign Collections, applying the first found."** So the order is
  **alphabetical → days overdue → amount overdue**, first match wins. (Alphabetical, the least
  risk-relevant criterion, outranks both delinquency measures — surprising.)
- **Automatic assignment triggers:** when the customer **cycles**, and when **a payment causes a
  customer's collections criteria to change**.
- **Hard rule: "Changing the parameters on this screen does not automatically reassign customer collections
  assignments. To apply the changes, you must run the Mass Collector Reassignment routine."**
  A settings change with **no effect until a separate batch is run manually.**
- **Hard rule (installment carve-out): "When an installment transaction brings the customer's account
  current balance due to 0.00, such as when processing a payment deferment or contract re-write, the
  customer is NOT re-evaluated for collections. The customer is not automatically reassigned to a new
  collector and is not removed from collections."** — a deferment that zeroes the balance leaves the
  customer stuck in Collections.
- Manual assignment paths: **Mass Collector Reassignment** and **Collector Review - Customer Update Screen**.
- District and Location are **mutually exclusive**.

**Dependencies.** Collector Settings (alpha ranges); Advanced Customer Settings (`Store Assignment`);
Regional Processing (General System Control Settings, `SCS-038`); Default Store/District Assignments -
Collections (`SCS-024`); Account Statement Cycling Control Settings (`SCS-001`) — cycle timing;
Installment Receivables Control Settings (`SCS-042`); Forms Designer; `EOD-001`;
Mass Collector Reassignment; Collector Review.

**Build notes.**
- New IDs: `CFG-COLL-ALPHA` **[GUARDED]**, `CFG-COLL-MINDAYS`, `CFG-COLL-MINAMOUNT`,
  `CFG-COLL-BYDISTRICT`, `CFG-COLL-BYLOCATION`, `CFG-COLL-LETTERMODE`, `CFG-COLL-AUTOREASSIGN`,
  `CFG-COLL-REMOVEWHENCURRENT`, `CFG-COLL-DEFAULTMANAGER`, `CFG-COLL-EVALUATEDURING` (locked),
  `CFG-COLL-PHANTOMS`.
- Model `CFG-COLL-BYDISTRICT` / `CFG-COLL-BYLOCATION` as one enum `{NONE, DISTRICT, LOCATION}` — they are
  mutually exclusive booleans.
- Model the criteria hierarchy explicitly as an **ordered rule list**, so the precedence is visible and
  reorderable rather than hard-coded, and **[DECISION NEEDED]** decide whether alphabetical really should
  outrank delinquency for LA Mattress (it should not).
- **Guarded change:** unchecking `CFG-COLL-ALPHA` deletes collector alpha ranges. In our system, disabling
  a criterion must never delete its configuration — keep the ranges, ignore them.
- **Do differently:** a settings change that requires a manual batch to take effect is a silent-failure
  generator. Our service should either apply criteria live at evaluation time (preferred — evaluate on read)
  or automatically enqueue the reassignment job on save, with a visible job status.
- **Do differently:** re-evaluate collections membership on **every** balance-changing event including
  deferments and contract re-writes. The STORIS carve-out keeps current customers in Collections.
- `[DECISION NEEDED]` Does LA Mattress run in-house collections at all? If house accounts are minimal, this
  whole subsystem may be out of scope.

---

### `SCS-015` Commission Calculation Code Options
*storis_ref: article 15186416511252*

**Purpose.** Documents the value set of the **Calculation Code** that determines how salesperson commission
is computed, including the parameters of the Hi/Lo Gross Profit sliding scale.

**Where it lives.** The `Calculation Code` field itself lives in the commission configuration; the Hi/Lo
attributes are "reserved in the **Sales Order System Control Settings** for all sales, customers, and
products." See also `Hi/Lo Gross Profit Option` (`SCS-039`) and Commission Settings (Commission Matrix).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Calculation Code | enum | `Comm Matrix` — commission is a percentage of **selling price or gross profit**, based on customer, product, or salesperson; the Commission Matrix uses two factors, **a calculation code (percentage of price or profit)** and **a source code (`customer`, `product`, `salesperson`, or `flat rate`)**.<br>`None` — no commission calculation.<br>`Hi/Lo Gross Profit` — double sliding scale, see below.<br>(The article also references a code written as **`% * Gross Profit`** in the Hi/Lo setup instructions — **[CONFLICT]**, a fourth code name not present in the option list.) |
| Limit Percent Low | percent | "Minimum profit margin to allow Low Commission rate." |
| Limit Percent High | percent | "Minimum profit margin to allow High Commission rate." |
| Commission Percent Low | percent | "Commission rate for profit margins **between** the Low and High Limit." |
| Commission Percent High | percent | "Commission rate for profit margins **at or exceeding** the High Limit." |

**Behavior & rules.**
- **Hi/Lo mechanism, quoted:** "The program calculates commissions using **the gross profit margin and the
  gross profit dollars** from each sale, according to the limits and commission percentages set. In essence,
  it creates a **double sliding scale that produces a ratio that is the commission percentage.**"
  The exact ratio formula is **not given in the source** — a genuine gap.
- **Undefined band:** the four fields describe margins *between* Low and High and *at or above* High. **What
  happens below `Limit Percent Low` is not documented.** Assume zero commission, but this must be confirmed.
- Selecting `Hi/Lo Gross Profit` reveals a dedicated entry screen for the four attributes.
- The Hi/Lo attributes are **global** — "reserved … for all sales, customers, and products" — i.e. no
  per-product or per-salesperson override, unlike `Comm Matrix`.

**Dependencies.** Sales Order System Control Settings (holds the Hi/Lo attributes); Commission Settings
(Commission Matrix); Hi/Lo Gross Profit Option (`SCS-039`); costing (`CFG-COSTING-METHOD` **[REUSE]** —
**gross profit depends on which cost is used, so the costing method silently drives payroll**).

**Build notes.**
- New IDs: `CFG-COMM-CALCCODE`, `CFG-COMM-HILO-LIMITLOW`, `CFG-COMM-HILO-LIMITHIGH`,
  `CFG-COMM-HILO-PCTLOW`, `CFG-COMM-HILO-PCTHIGH`; `CFG-COMM-MATRIX` (the matrix itself: calculation code ×
  source code `{CUSTOMER, PRODUCT, SALESPERSON, FLAT_RATE}`).
- **[GUARDED]** Commission settings must be **versioned and effective-dated**, and must not be changeable
  for a pay period that has already been calculated or paid. This is the one settings family where a
  retroactive edit directly changes money already promised to employees.
- Because commission keys off gross profit, **`CFG-COSTING-METHOD` changes propagate into commission**.
  Our settings service should surface that dependency explicitly when either is changed.
- **Do differently:** define the sliding-scale formula precisely and test it, including the
  **below-`Limit Percent Low`** band which STORIS leaves undocumented. Recommend an explicit banded table
  (`margin_from`, `margin_to`, `commission_pct`) with full coverage from 0% to 100%, rather than four
  loose scalars.
- `[DECISION NEEDED]` LA Mattress commission model — margin-based, price-based, flat, or matrix by product
  category? Mattress retail usually runs margin-based with SPIFFs; SPIFFs are not represented in this
  STORIS model at all.

### `SCS-016` Costing Control Settings
*storis_ref: article 15186501540884*

**Purpose.** The costing rulebook: which cost basis is used for G/L postings, commissions, and
returns-to-vendor; landed freight and up to four landed add-on cost buckets; repossession depreciation;
average-cost inclusion rules; and automatic handling of zero-cost and AP-variance exceptions.
**This is the highest-blast-radius screen in the section — every value here moves COGS, margin, inventory
valuation, and commission payroll.**

**Where it lives.** `System Administration > System Settings > Purchasing and Logistic System Settings > Costing Control Settings`.
Tabs: **General, Exception Handling**. Article carries version selectors **11.0 / 10.8**.
Costing information is viewed via **View Product Cost Activity**.
"NOTE: Some system control settings are accessible by STORIS personnel only."

**The three costing methods available system-wide:** `Replacement Cost`, `Weighted Average Cost`,
`Exact (Actual) Cost`. → `CFG-COSTING-METHOD` **[REUSE]**.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| General Ledger Postings | enum | **(LOCKED - STORIS access ONLY!)** Costing method for **all completed sales and inventory activity (excluding receiving)** posted to the G/L: `Average` \| `Exact`. **Note `Replacement` is NOT an option here even though it is a system costing method.** **[REUSE/extend] `CFG-COSTING-METHOD`.** |
| Salesperson Commissions | enum | Costing method used when calculating and reporting sales commissions: `Replacement` \| `Average` \| `Exact`. **Ties directly to `SCS-015` — the commission cost basis is set here, not on the commission screen.** |
| Return to Vendor | enum | Costing method for inventory returned to vendor: `Replacement` \| `Exact` (**no Average option**). |
| Retain Days — Solved Cost Exceptions | int days | Retention of solved cost-exception data before purge. |
| Retain Days — Costed Auditing Data | int days | Retention of costed auditing data before purge. |
| Retain Days — Costing Table Data | int days | Retention of costing table data. **Purged during the first End-of-Month after the day count elapses, and "The system starts counting the days when a received product is no longer available, for example it is sold or adjusted."** |
| Commission Add On % | percent, **mandatory** | Percentage added to the cost used for sales commissions. `0` or blank/null = none. Effect: **increases cost and therefore lowers gross margin, for sales-commission reporting only.** Also used to compute cost and gross margin percentage in the **Costed Line Item Display** and **Sales Margin Scratchpad** (Actions on the Merchandise page of Enter a Sales Order). **"Note that it is not used in the Gross Margin Calculator."** **Hard rule: "Commission add-on percentages by product via the `Add to Cost %` field on the Pricing page of Advanced Product Settings are applied BEFORE this global setting."** (product-level then global — they compound, not override). |
| Reduce Customer Returns % | percent, positive, **≤ 100**, nullable | Automatically reduces the **price and cost** of all merchandise on customer returns and exchanges. **To set it per product group instead, leave this blank and use `Reduce Customer Returns %` in Group Settings.** **[CONFLICT-ish]** — the system-level field must be blank for the group-level one to apply; it is an override-by-emptiness pattern. |
| Depreciate Repossessions % | percent | Repossession depreciation rate. **Only active when `DEPRECIATE REPOSSESSIONS - Use the Monthly Table` is checked.** Active only if **Revolving Receivables** is active. |
| Calculate Received Landed By | enum | Which vendor's factors are used when calculating received landed costs: `Product Vendor` \| `Purchase Order Vendor`. **Hard rule: "If you set this field to `Purchase Order Vendor`, the system prevents you from setting the `Landed Cost Distribution` field to `General Ledger Only`, and vice versa."** |
| Landed Cost Distribution | enum | **STORIS-LOCKED.** `General Ledger Only` — use the general ledger setting (avg/replacement) \| `Allocate Upon Receipt` — use exact costs at time of receipt. **Hard rules:** (a) **Import Data** will not update freight/add-on costs that differ from the product records **unless this is `Allocate Upon Receipt`**; (b) changing from `General Ledger Only` to `Allocate Upon Receipt` **prompts to run an update utility that recalculates the Costing Table for every product with add-on costs — "If using an off-set fiscal calendar, the utility should only be run in an open period. If you choose not to run the utility, the field reverts to `General Ledger Only`."**; (c) mutually exclusive with `Calculate Received Landed By = Purchase Order Vendor`. **[GUARDED — the archetypal guarded change: it rewrites the costing table and must run in an open fiscal period.]** |
| Landed Add-on Cost Label (×4) | text | Free-text label for each of the four add-on cost buckets (examples given: `Duty`, `Broker's Fees`). "The label you specify here appears whenever the add-on cost appears in the system." **STORIS provides exactly four add-on cost buckets.** |
| Landed Add-on Cost Label Drop-Down (×4) | enum | `External` — calculated at initial receiving, unaffected by later processes; **the calculated amount posts to G/L as the landed asset and liability for that add-on**. `Upcharge` — "internal", affected by in-application processes; **generates NO G/L postings during initial receiving and the add-on amount in the costing layers is initially empty**. "Currently the only available internal add-on is a transfer upcharge." |
| DEPRECIATE REPOSSESSIONS - At Landed Cost | bool | Checked → depreciation is "a prorated value based on **total retail value and total remaining Revolving balance due** for the customer". Blank → **material cost**. Active only if Revolving Receivables is active. Completed repossession returns post to the **Repossession Sales** and **Cost of Sales** accounts on the Sales tab of General Ledger Assigned Account Settings. **[CONFLICT] — this identical description also appears verbatim under a top-level field named `Depreciate Repossessions %`; the source documents the same behavior twice under two different field names.** |
| DEPRECIATE REPOSSESSIONS - Use the Monthly Table | bool | Checked → depreciation from a **monthly depreciation table**, and **activates the `Depreciate Repossessions Percent` field**, into which the rate must be entered. Active only if Revolving Receivables is active. |
| GENERAL LEDGER - Always Adjust Stocked Inventory at the Average Cost | bool | Force inventory adjustments to use average cost. |
| GENERAL LEDGER - Post RTV Write-off of Landed Cost Assets against Landed Liability Accounts | bool | Checked → RTV freight cost posts against **Landed Freight Liability, Landed Add-On 1 Liability, Landed Add-On Liability 2, Landed Add-On Liability 3, Landed Add-On Liability 4**. Unchecked → posts against the **Inventory Adjustment** G/L account. Accounts defined in General Ledger Assigned Account Settings (`SCS-037`). |
| GENERAL LEDGER - Post RTV Valuation Difference At Completion | bool | Checked → the difference between material cost and the RTV's specified recoverable amount posts **at RTV completion**, ahead of AP bill creation, via the **RTV Valuation Difference** account (Inventory tab of General Ledger Assigned Account Settings). Unchecked → posts **at AP bill creation**. **Hard rule and good design note, quoted:** "The AP bill creation process does not check this setting because it is possible for this setting to be changed at any time; AP bill creation is the last opportunity to post any difference that was not posted during Complete Return-To-Vendor. **Posting decisions are instead based on whether or not a difference … has already been posted.**" — i.e. the system deliberately makes the downstream step idempotent rather than trusting the setting. |
| LANDED FREIGHT - Active | bool | Master switch: include freight amounts in landed costs. Relates to `CFG-COSTING-FREIGHTMODE` **[REUSE]**, `CFG-VEND-FREIGHTFACTOR` / `CFG-PROD-FREIGHTFACTOR` **[REUSE]**. |
| LANDED FREIGHT - Add-on Cost 1/2/3/4 Active | bool ×4 | Activates the correspondingly numbered landed add-on cost. |
| REDUCE CUSTOMER RETURNS - Prorate the Landed/Freight Value | bool | With a global or group reduction percentage set, checked → **landed and freight costs are also reduced on returns**; blank → **only inventory costs are reduced**. |
| REPORT - Generate a Purge Report of Solved Costing Exceptions | bool | Produce a purge report of solved costing exceptions. |
| REPORT - Generate Inventory to General Ledger Reconciliation Data | bool | **Must be checked for `Report Reconciliation of Inventory to GL Values` to contain meaningful data** — "If you check the box at this field, the system collects the data needed for the report. If not, the report does not include meaningful information for reconciliation." **[GUARDED — the data is only collected going forward; turning it on does not backfill, so a reconciliation gap is permanent.]** |
| REPORT - Include in the Daily Reports an Inventory Reconciliation | bool | Include the Inventory-GL Reconciliation Report in Generate Daily Reports. Blank → still runnable on demand. |
| REPORT - Report Value of Inventory, Use Generate Monthly Report Parameters for Costing | bool, **default unchecked** | The Costing Method selected in *Report Value of Inventory* is taken from Parameter Maintenance during Generate Monthly Reports. |
| AVERAGE COST - Include Saleable Receipts only | bool | Blank → **all** new inventory enters the average-cost calculation for stock products. Checked → **only inventory not directly received into As-Is status** is included. Applies to all barcode receiving processes and to *Receive a Purchase Order*, *Receive a Purchase Order using a POS Scanner*, *Receive a Purchase Order with a Separate Freight Bill*, and *Receive without a Purchase Order*. Decision rule: **no PO, or a PO whose PO Type has no associated As-Is Reason → saleable → included; PO whose PO Type has an associated As-Is Reason → non-saleable → excluded.** **Always excluded regardless of this setting: all returned inventory (As-Is or not), and all inventory adjustments (whether added at average or replacement cost).** **"NOTE: It is not recommended that this setting be checked when G/L posting is set to post with an average cost."** |
| **Actions → Add-On Calculation Process** | action | Opens `SCS-005`. |

**Fields — Exception Handling tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| (intro) Automatic Handling of Cost Exceptions | — | The system checks for zero costs during: **purchase order entry, inventory receiving, inventory adjustment, customer-return completion.** |
| Customer Returns Zero Cost | enum | Handling of zero-cost exceptions on customer returns. **Option list not enumerated in the article**, but `Use Average` and `Use Replacement Cost` are named as two of the values by the `Skip on Zero` description. |
| Customer Returns Non Zero Cost | enum | Handling of **non**-zero-cost exceptions on customer returns. |
| Warehouse Receipts Zero Cost | enum | Handling of zero-cost exceptions on warehouse receipts. |
| Positive Adjustments Zero Cost | enum | Handling of zero-cost exceptions on positive inventory adjustments. |
| Skip on Zero | bool | **Active only when the corresponding zero-cost field is `Use Average` or `Use Replacement Cost`.** Checked → when a zero-cost exception exists **and no average or replacement cost exists either**, the system **accepts the inventory at zero cost and clears the exception**; it then appears in *Report Solved Costing Exceptions* (End of Day or on demand). **This is a setting that lets $0.00 inventory into the books silently.** |
| Inventory AP Approval | enum | `Create Exception` — create cost exceptions for any difference between receiving cost and AP Approval cost; **"these exceptions require operator review and manual update."**<br>`Auto-adjust` — the system finds all costing layers matching the PO line item or Receiving Reference; **if the total quantity of matching layers equals the cost-exception quantity, it adjusts the cost of all matching layers; if quantities do not match (partial AP Approval), it does NOT adjust and leaves the exception open for manual correction.** **[REUSE] `CFG-COSTING-AUTORESOLVE` / `CFG-COSTING-WINNER`.** |
| Next Cost Exception Number | int (sequence) | **(LOCKED - STORIS access ONLY!)** Assigns numbers to cost exceptions. |

**Behavior & rules.**
- **Two mutually-exclusive pairs, both stated as hard rules:**
  `Calculate Received Landed By = Purchase Order Vendor` ⇎ `Landed Cost Distribution = General Ledger Only`.
- **Changing `Landed Cost Distribution` triggers a costing-table rewrite utility**; declining the utility
  **silently reverts the setting**. Must be run in an **open fiscal period** with an off-set calendar.
- **Commission cost stack (order matters):** product-level `Add to Cost %` (Advanced Product Settings →
  Pricing) is applied **first**, then the global `Commission Add On %`. Both inflate cost and deflate the
  reported margin used for commissions. The **Gross Margin Calculator deliberately ignores** the add-on,
  so **two screens in the same order can show different margins.**
- **Transfer Upcharge semantics (quoted, three cases):**
  1. DC → location in a **different company**: "The material cost of the transferred inventory, **excluding
     all freight and add-ons**, is multiplied by the up-charge percent specified in the company record for
     the shipping location. The resulting value is assigned to the reserved add-on for those inventory
     layers. In addition, the appropriate multi-company general ledger postings are completed."
  2. Inter-company transfers **not** involving a DC: "do not result in any changes in cost at the inventory
     level, but do generate multi-company general ledger batches, moving the value of the inventory and the
     add-on from the company of the transfer-from store to the company of the receiving store."
  3. Transfer **back to a DC**: "the add-on is removed entirely from the inventory layer and the appropriate
     general ledger postings made to reverse postings from the original transfer out of the distribution
     center."
- **`AVERAGE COST - Include Saleable Receipts only` combined with average-cost G/L posting is explicitly
  discouraged** — it creates a divergence between the average cost used for valuation and the receipts
  actually posted.
- **`Skip on Zero` + `Create Exception`/`Auto-adjust` interplay:** `Skip on Zero` can zero-cost inventory
  before AP approval ever sees it.
- Article notes: **"To correct type 4 cost exceptions, you must use the manual method via the Correct a Cost
  Exception routine."** — implies a typed taxonomy of cost exceptions (at least types 1–4) that this article
  does not enumerate. **Gap.**

**Dependencies.** `CFG-COSTING-METHOD`, `CFG-COSTING-AUTORESOLVE`, `CFG-COSTING-WINNER`,
`CFG-COSTING-TOLERANCE`, `CFG-COSTING-FREIGHTMODE`, `CFG-COSTING-FREIGHTALLOC`,
`CFG-VEND-FREIGHTFACTOR`, `CFG-VEND-ADDONFACTORS`, `CFG-PROD-FREIGHTFACTOR`, `CFG-PROD-ADDONFACTORS`
— **all [REUSE] from the Inventory handoff pack**; Add-on Calculation Process (`SCS-005`) and Ashley Custom
Cost Formula (`SCS-008`); General Ledger Assigned Account Settings (`SCS-037`) — Repossession Sales, Cost of
Sales, Landed Freight/Add-On 1–4 Liability, Inventory Adjustment, RTV Valuation Difference;
Group Settings (`Reduce Customer Returns %`); Advanced Product Settings (`Add to Cost %`);
Commission Calculation Code Options (`SCS-015`); Revolving Receivables; PO Types (As-Is Reason);
Import Data; company records (up-charge percent); `EOD-001`; End-of-Month.

**Build notes.**
- **[REUSE] and extend the existing `CFG-COSTING-*` family** rather than minting new IDs where they overlap.
  New IDs needed for what the Inventory pack does not cover: `CFG-COSTING-GLBASIS` (locked, `AVERAGE|EXACT`),
  `CFG-COSTING-COMMBASIS` (`REPLACEMENT|AVERAGE|EXACT`), `CFG-COSTING-RTVBASIS` (`REPLACEMENT|EXACT`),
  `CFG-COSTING-RETAIN-{SOLVEDEXC,AUDIT,COSTTABLE}`, `CFG-COSTING-COMMADDONPCT`,
  `CFG-COSTING-REDUCERETURNSPCT` (+ group-level `CFG-GRP-REDUCERETURNSPCT`),
  `CFG-COSTING-REDUCERETURNS-PRORATELANDED`, `CFG-COSTING-REPO-*`, `CFG-COSTING-LANDEDBYVENDOR`,
  `CFG-COSTING-LANDEDDISTRIBUTION` (locked) **[GUARDED]**, `CFG-COSTING-ADDON[1..4]-{LABEL,TYPE,ACTIVE}`,
  `CFG-COSTING-LANDEDFREIGHTACTIVE`, `CFG-COSTING-ADJATAVG`, `CFG-COSTING-RTVLANDEDLIABILITY`,
  `CFG-COSTING-RTVVALDIFFATCOMPLETION`, `CFG-COSTING-REPORT-*`, `CFG-COSTING-AVGSALEABLEONLY`,
  `CFG-COSTING-EXC-{CUSTRETZERO,CUSTRETNONZERO,WHRCVZERO,POSADJZERO}`, `CFG-COSTING-SKIPONZERO`,
  `CFG-COSTING-APAPPROVALMODE`, `CFG-COSTING-NEXTEXCNUM`.
- **Guarded changes our settings service MUST enforce here (this screen is the reason the guard mechanism
  exists):**
  - `CFG-COSTING-LANDEDDISTRIBUTION` — blocked unless the fiscal period is open and no open receiving
    batches exist; triggers a costing-table recalculation job with a preview of affected products.
  - `CFG-COSTING-GLBASIS`, `CFG-COSTING-COMMBASIS`, `CFG-COSTING-RTVBASIS` — effective-dated; never
    retroactive; blocked while a period is being closed or commissions are being calculated.
  - `CFG-COSTING-ADDON*-ACTIVE` / `-TYPE` — blocked while any costing layer carries a non-zero balance in
    that bucket; deactivating an add-on with value in the layers strands asset/liability balances.
  - `CFG-COSTING-COMMADDONPCT` — blocked for a pay period already calculated.
  - `CFG-COSTING-RETAIN-*` — lowering deletes audit/costing data at next EOM.
- **Do differently (correctness):** never allow `Skip on Zero`. Zero-cost inventory should always create a
  blocking exception. If we must ship an equivalent, gate it behind a permission and force a reason code.
- **Do differently:** make the Gross Margin Calculator and the Costed Line Item Display use the **same**
  margin definition. STORIS having two different margins on one order screen is a training and trust
  problem.
- **Do differently:** four fixed add-on buckets is an arbitrary limit. Model add-ons as a **named list**
  with `{code, label, type: EXTERNAL|UPCHARGE, active, asset_account, liability_account}`.
- **Do differently:** the "leave the global blank so the group-level applies" pattern (`Reduce Customer
  Returns %`) should be an explicit scope resolution (`GROUP` overrides `SYSTEM`), which our resolver
  already supports.
- Copy the **RTV valuation-difference idempotency design** verbatim — deciding from posted state rather
  than from a mutable setting is exactly right, and we should apply that pattern everywhere a setting could
  change between two halves of a workflow.
- **Gap to close:** obtain the full enum for the four Exception Handling fields and the cost-exception
  **type taxonomy (types 1–4)**; neither is in this article. `[DECISION NEEDED]` / follow-up research.
- `[DECISION NEEDED]` LA Mattress costing method (`CFG-COSTING-METHOD` is already flagged `[DECISION NEEDED]`
  in the Inventory pack). Recommend **Weighted Average** with **Allocate Upon Receipt** landed costs, and
  freight capitalized — but confirm with accounting, because this decision is effectively irreversible once
  history accumulates.

### `SCS-017` Credit Application Control Settings
*storis_ref: article 15186501753876*

**Purpose.** Controls the Credit Application module: which credit bureaus are active, application validity
and expiry, co-signer/co-applicant policy, credit-request lifecycle (hold, decline, retention), credit
report validity, decision letters, and — on the Settings tabs — **per-field required/optional/hidden
configuration for every question on the application, for each of three participants.**

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Credit Application Settings > Credit Application Control Settings`.
Tabs: **General**, plus **three sets of four Settings tabs** (Primary Applicant / Co-Applicant / Co-Signer
× Personal / Employment / Reference / Miscellaneous) — **13 tabs in total**.

**Fields — General tab, CREDIT BUREAUS**

| Field | Type | Purpose / business rule |
|---|---|---|
| Experian | bool | Activate this bureau. |
| Equifax | bool | Activate this bureau. |
| Equifax Canada | bool | Activate this bureau. Checked → selectable at `is the Primary`, at `Credit Bureau` in **Request Credit Information**, and at `Preferred Credit Bureau` in **Warehouse/Store Location Settings**. |
| InterConnect | bool | Activate this **interface** (not a bureau). "STORIS interfaces to the InterConnect software, which accesses **Equifax** credit reports and returns additional information regarding scoring and decisioning." **A STORIS web service allows InterConnect to CALL INTO the STORIS system to provide a final decision on a pending credit review item; items remain pending and are visible in Review Pending Credit Requests.** (Inbound webhook — security-relevant.) |
| Trans Union | bool | Activate this bureau. |
| is the Primary | enum | **At least one bureau must be active before this field is accessible.** Default bureau for credit requests. Documented options: `Experian`, `Equifax`, `TransUnion`, `InterConnect`. **[CONFLICT] — `Equifax Canada` is stated elsewhere in the same article to be selectable here but is absent from this option list.** Only active bureaus appear. |

**Fields — General tab, APPLICATION RULES**

| Field | Type | Purpose / business rule |
|---|---|---|
| Allow for Co-Signer | bool, **default checked** | Allows co-signer applications via *Request Credit Information*; activates the `Additional Applicant Co-signer` field on the Personal tab of Credit Application Entry. |
| Allow for Co-Applicant | bool, **default checked** | Allows co-applicant applications. **[CONFLICT] — the article says this ALSO activates the `Additional Applicant Co-signer` field, identical wording to the co-signer setting; one of the two descriptions is wrong.** |
| Credit Applications Expire after Days | int, **mandatory, default 90** | Days an application remains valid from its creation date. Past that, "the system no longer considers the application current. If you access the application, the system requires you enter a new one to proceed." |
| For Days Application is Valid for Web Submissions | int | Days a web-submitted application stays valid. **"An existing customer cannot submit a new credit request via the web if they submitted another credit application within the number of days specified here."** (A rate limit, not a validity window — note the inverted framing.) |
| Default from Expired Application | multi-select, **default unchecked** | Which data may be defaulted from an expired application onto a new credit request: `Primary`, `Co-signer`, `Co-applicant`. **Hard rule: "You must check the box for `Primary` first before you can select the `Co-signer` and/or `Co-applicant` options."** When active, **everything except fields set to `Force Re-Entry` is defaulted**, remains editable, and **if changed, is saved as a NEW application linked to the new request.** |
| Minimum Age for Auto Pull of Credit Report | int (years) | Applicants **must be at least 18**. For ages between 18 and this value, the message **"See Sales Representative for Additional Financing Options"** appears, a pending credit request is created without an automatic bureau pull, and the comment **"Applicant is under the minimum age to automatically pull a credit report"** is attached. **Hard rule: "This setting is for the primary applicant only. If a co-applicant is of the proper age but the primary applicant is below this age, the credit report is not automatically pulled."** |

**Fields — General tab, CREDIT REQUESTS**

| Field | Type | Purpose / business rule |
|---|---|---|
| Need to exist prior to entering an order | bool | Checked → **a valid credit application must be on file before a financing payment type can be entered in order entry.** Unchecked → financing payment types may be entered with no approved application. |
| Linked Sales Orders Put On Hold for Open Request | bool, **default unchecked and inactive** | Checked → when a revolving financing plan is applied to a sales order and an open credit request exists for the customer, the order and request are **linked and placed on `C6` credit hold** until the request is approved. **Hard prerequisite: `No Credit Check` in Revolving Payment Plan Settings must NOT be set for that revolving finance plan.** |
| Review again, if Initially Declined | bool | Checked → **inactivates credit review status `D` (declined)**, and a request cannot move directly from a pending status to `SD` (second review declined) without first passing through one of the "second review" status codes. Blank → all declined requests are considered resolved and moved to history. |
| After Days Decline Requests on Hold | int **0–999** | Days a request may sit in the **Review Credit Requests on Hold Queue** before End-of-Day **automatically declines it** and moves it to history. |
| For Days Retain Historical Requests | int **0–9999** | Retention of credit request detail before EOD purge. EOD purges the request and its comment records; **"EOD purges the linked credit report and credit application records only if no other linked credit requests to the credit report fall within the days allowed."** |
| For Days Alert if a Prior Application is Submitted | int **0–999** | Alert during *Review Pending Credit Requests* or *Request Credit Information* if a prior application was submitted within this window. |
| Older Than Minutes Alert the User | int (minutes) | Minutes before a pending Credit Request Review item is flagged as old; flagged items appear in **red text** in the *Review Pending Credit Requests* grid. |

**Fields — General tab, CREDIT REPORTS**

| Field | Type | Purpose / business rule |
|---|---|---|
| Text Format Report | bool | Checked → credit reports display as **Adobe PDF** via *View Credit Report* on the Credit Request Review Screen (requires a text-readable version arranged with the bureau). Blank → standard version via **Forms Designer**, requiring this setup: *Assign Printer for Enhanced Laser Forms* → double-click **Credit Report** form → Print Settings → *Select a Printer* → choose **`STORIS Print Preview`**. |
| For Days Report is Valid | int **0–999** | Days past retrieval that a credit report stays usable. Past that (**or if no report exists**), a new report is requested from the bureau during credit application processing. |
| After Months with Zero Balance Require New Report | int **1–99**, optional | Months a customer account may hold a zero balance before the credit application expires and a new one is required. **Blank → applications for zero-balance customers never expire.** |

**Fields — General tab, OTHER**

| Field | Type | Purpose / business rule |
|---|---|---|
| Decline Letter Previous Conditional Approvals | bool | Auto-generate a rejection letter when a request is declined **after having been conditionally approved**. |
| Approval Letter Previous Conditional Approvals Entry | bool | Auto-generate an acceptance letter when a request is approved after conditional approval. |
| Prompt for Requested Finance Type | bool | Activates the `Finance Type` field. |
| Use Applicant's Delivery Address on Credit Application | bool, **default unchecked** | Checked → the **primary applicant's delivery address** and the **co-applicant's additional address** are submitted. Unchecked → **primary's billing address** and **co-applicant's main address**. Applies to both STORIS and eSTORIS. **"If the billing address is used on a prior credit application and then this setting is checked, the delivery address is used on the new credit application."** |
| **Actions → Custom** | action | Plug-in for specialized credit bureau application programming, if active. |
| **Actions → eBridge Commerce Credit Review Queue Retention Days** | action/setting | See `SCS-029`. |
| **Actions → Maintain Credit Application Letter Print UNC Path** | action/setting | "create an XML output to be sent out for mass printing." See position 45 (part B). |

**Fields — the three × four Settings tabs**

| Field | Type | Purpose / business rule |
|---|---|---|
| *(every credit-application question)* Entry Type | enum | `Optional` — "field is present on credit application but an answer is not required"; `Mandatory` — "field is present … and an answer is required"; `Not Needed` — "field is not present on credit application". |
| *(every credit-application question)* Force Re-Entry | bool | Checked → the user **must manually re-enter** the value when updating an existing application; blank → the system supplies a default response if available. |

**Behavior & rules.**
- **Worked example, quoted:** with `Income` set to `Mandatory`, its `Force Re-Entry` checked, a still-valid
  application on file, and the linked credit review item closed (approved, declined, or deleted) — creating
  a new Request for Credit (e.g. to raise a credit line) **offers no default for Income; the operator must
  type the new amount.** (Note the article calls the validity field `Credit Application is Valid For` here
  and `Credit Applications Expire after Days` above — **[CONFLICT]**, two names for one field.)
- **Credit request status codes referenced:** pending statuses, `D` (declined), `SD` (second review
  declined), "second review" statuses, conditional approval, approved. `C6` is the credit-hold code for a
  sales order awaiting credit-request approval.
- **Post-approval:** "Once a credit application is approved, finance providers can return **up to five**
  promotional payment plan codes and descriptions for review."
- **Inbound integration:** InterConnect calls a STORIS web service to render a final decision — an
  **externally-triggered state transition on a credit request**.

**Dependencies.** Warehouse/Store Location Settings (`Preferred Credit Bureau`); Revolving Payment Plan
Settings (`No Credit Check`); Accounts Receivable Control Settings (`SCS-002`) — `Automatic Display of
Legal Settings` includes *Review Pending Credit Requests*; Legal Code Settings (`SCS-044`);
Financing Control Settings (`SCS-036`); eSTORIS Control Settings (`SCS-033`);
eBridge Commerce Credit Review Queue Retention Days (`SCS-029`); Maintain Credit Application Letter Print
UNC Path (part B, position 45); Forms Designer / Enhanced Laser Forms; `EOD-001`.

**Build notes.**
- New IDs: `CFG-CREDAPP-BUREAU-{EXPERIAN,EQUIFAX,EQUIFAXCA,INTERCONNECT,TRANSUNION}`,
  `CFG-CREDAPP-PRIMARYBUREAU`, `CFG-CREDAPP-ALLOWCOSIGNER`, `CFG-CREDAPP-ALLOWCOAPPLICANT`,
  `CFG-CREDAPP-EXPIREDAYS`, `CFG-CREDAPP-WEBVALIDDAYS`, `CFG-CREDAPP-DEFAULTFROMEXPIRED`,
  `CFG-CREDAPP-MINAGEAUTOPULL`, `CFG-CREDAPP-REQUIREBEFOREORDER`, `CFG-CREDAPP-HOLDLINKEDORDERS`,
  `CFG-CREDAPP-SECONDREVIEW`, `CFG-CREDAPP-AUTODECLINEDAYS`, `CFG-CREDAPP-HISTORYDAYS`,
  `CFG-CREDAPP-PRIORAPPALERTDAYS`, `CFG-CREDAPP-STALEMINUTES`, `CFG-CREDAPP-REPORTPDF`,
  `CFG-CREDAPP-REPORTVALIDDAYS`, `CFG-CREDAPP-ZEROBALMONTHS`, `CFG-CREDAPP-DECLINELETTER`,
  `CFG-CREDAPP-APPROVALLETTER`, `CFG-CREDAPP-PROMPTFINANCETYPE`, `CFG-CREDAPP-USEDELIVERYADDR`,
  plus `CFG-CREDAPP-FIELDRULES` — **a matrix keyed by (participant, tab, field) → {entry_type, force_reentry}**.
- **The field-rules matrix is the interesting part.** Build it as data, not code: a versioned form schema
  with per-field `{required|optional|hidden}` and `force_reentry`. It is the same shape we will want for
  any regulated form.
- **[GUARDED]** Changing `CFG-CREDAPP-FIELDRULES` while credit requests are pending changes what a
  half-completed application requires. Version the schema and **pin each application to the schema version
  it was created under.**
- **[GUARDED]** `CFG-CREDAPP-HISTORYDAYS` and `CFG-CREDAPP-AUTODECLINEDAYS` destroy/auto-decide records at
  EOD. Lowering either must show counts and require confirmation. **`After Days Decline Requests on Hold = 0`
  would auto-decline everything on the next EOD** — validate against 0.
- **Compliance, not just correctness:** credit applications, bureau reports, and adverse-action letters are
  **FCRA/ECOA-regulated**. Retention minimums and adverse-action notice timing are legal requirements, not
  preferences. Our settings service must enforce **floors** on `CFG-CREDAPP-HISTORYDAYS` and must not allow
  the decline-letter flags to be turned off. `[DECISION NEEDED]` — legal review required.
- **Security:** the InterConnect inbound web service is an unauthenticated-by-description callback that
  changes credit decisions. Any equivalent in our system needs signed webhooks, replay protection, and an
  allowlist. Flag to `SEC-*`.
- **Do differently:** `Minimum Age for Auto Pull of Credit Report` ignoring the co-applicant's age is a
  business rule that costs approvals. Evaluate per applicant.
- `[DECISION NEEDED]` LA Mattress runs third-party financing (Synchrony/Acima/Progressive). If we never pull
  bureau reports ourselves, the bureau half of this screen is out of scope and only the
  application-field-schema and request-lifecycle halves matter.

---

### `SCS-018` Customer Rewards Control Settings
*storis_ref: article 15186452549524*

**Purpose.** Global loyalty configuration: the earn rate on reward points, how long points live, and the
conversion cap and life of the gift certificates points are redeemed into.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Customer Rewards Control Settings`.
**"The settings in this routine are global. They affect all customers and products."** Per-product earning
is configured in **Advanced Product Settings**; excluding a customer is done in **Customer Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Reward Points Accumulated Only with Purchase Membership | bool | Checked → only members of the membership program earn points. Blank → **all** customers earn. |
| Reward Points are Calculated at ___ % for Customers | percent | Percentage of **selling price** used to compute points. **Worked example, quoted: "if you enter 100 here, and the selling price is $95.00, the program awards 95 reward points."** Applied **globally to all items on all sales orders**. **`0` → zero global reward points.** **Hard rule: "In order for a customer to earn reward points, the `Accumulate Reward Points` box on the Advanced tab in the Advanced Customer Settings must be checked."** |
| Accumulated Points are Valid for ___ Days | int days, **mandatory** | Days from **date of invoicing** that points remain on the account and available for a gift certificate. **"On the day on which the reward points expire, the system purges them during End-of-Day processing."** |
| Gift Certificates can be Issued for ___ % of the Accumulated Points | percent | Maximum share of earned points convertible via *Issue Customer Rewards*. **Worked example, quoted: 50% with 500 accumulated points → `Maximum Gift Certificate Allowed` = 250, and "the program restricts you from generating a gift certificate of more than 250 dollars for that customer, regardless of the amount displayed at the `Number of Reward Points Earned` field."** **Hard rule: "if you enter zero (0) here, users cannot access the Issue Customer Rewards routine."** |
| Gift Certificates are Valid for ___ Days | int days, **mandatory** | Days from **date of issue** that reward gift certificates remain valid. **Purged during End-of-Day on the expiry day.** |

**Behavior & rules.**
- **Points-to-dollars is implicitly 1:1** — the example converts 250 points into a $250 certificate.
  The earn percentage and the redemption percentage are the only two levers; there is **no separate
  point-value setting.**
- **Two independent enables must both be on for a customer to earn:** the global/membership rule here, and
  `Accumulate Reward Points` on the customer record.
- **Expiry is destructive at EOD** for both points and certificates.
- `0` is a meaningful disabling value in two places (earn rate → no points; issuance % → routine
  inaccessible), which differs from the blank-disables convention used elsewhere in this section.

**Dependencies.** Advanced Customer Settings (`Accumulate Reward Points`); Customer Settings (exclusions);
Advanced Product Settings (per-product point awards); Accounts Receivable Control Settings (`SCS-002`) —
gift certificate issuance, `Next Certificate Number`, `In-Store Use Only Default Type`; membership program;
`EOD-001`; Issue Customer Rewards routine.

**Build notes.**
- New IDs: `CFG-REWARD-MEMBERSONLY`, `CFG-REWARD-EARNPCT`, `CFG-REWARD-POINTVALIDDAYS`,
  `CFG-REWARD-ISSUEPCT`, `CFG-REWARD-CERTVALIDDAYS`; plus `CFG-PROD-REWARDPOINTS` (product scope) and
  `CFG-CUST-ACCUMULATEPOINTS` (customer scope) for the two override levels.
- Add an explicit `CFG-REWARD-POINTVALUE` (points per currency unit). STORIS' implicit 1:1 makes the earn
  percentage do two jobs and blocks any future change to point economics.
- **[GUARDED]** Lowering `CFG-REWARD-POINTVALIDDAYS` **expires customers' existing points at the next EOD**.
  This is a customer-facing liability being written off — require confirmation with the total point balance
  affected, and consider grandfathering existing balances. Same for `CFG-REWARD-CERTVALIDDAYS` against
  **issued, unredeemed certificates**, which are a real liability on the balance sheet.
- **Accounting note:** outstanding points and unredeemed certificates are a **deferred revenue / contract
  liability** under ASC 606. Changing the earn rate or expiry changes that liability. Our settings service
  should emit an event finance can subscribe to.
- **Do differently:** never purge points silently. Expire them with a ledger entry and a customer
  notification window, and keep the history.
- `[DECISION NEEDED]` LA Mattress loyalty economics — earn %, expiry, redemption cap — and whether points
  should differ by product category (mattresses vs accessories have very different margins, and a flat
  percentage of selling price ignores that).

### `SCS-019` Customer's Own Materials (COM) Control Settings
*storis_ref: article 15186501538708*

**Purpose.** Two settings governing COM Order Entry/Maintenance — customer-supplied-material orders
(e.g. a customer's own fabric on a special-order upholstery item).

**Where it lives.** `System Administration > System Settings > Customer System Settings > Customer's Own Materials Control Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Enter Component Cost | bool | Checked → the system **prompts for the component cost when ordering COMs**. Blank → **the cost is added later, on the purchase order.** |
| Default Component Group | ref (product group) | Default group name for COM components. **Hard rule: "This must be a non-inventory group, such as `FABRIC`, and the group must be associated with a non-inventory category."** |

**Behavior & rules.**
- **Hard validation:** the default component group must be **non-inventory**, and its **category must also
  be non-inventory** — a two-level type constraint on a foreign key.
- `Enter Component Cost` blank means a COM line **carries no cost until PO entry**, so margin on the sales
  order is understated (or zero) at the time of sale. Note this interacts with the zero-cost exception
  handling on `SCS-016` — a COM line is a legitimate zero-cost item at order time.

**Dependencies.** Group Settings / product category master (non-inventory group and category);
Costing Control Settings (`SCS-016`) — zero-cost exception handling; purchase order entry;
Special order settings (`CFG-SO-AUTOCREATE`, `CFG-SO-ASSIGNREQ` **[REUSE]**).

**Build notes.**
- New IDs: `CFG-COM-ENTERCOMPONENTCOST`, `CFG-COM-DEFAULTGROUP`.
- Enforce the non-inventory group/category constraint as a **typed reference with a predicate**, not a
  free-text code — this is exactly the kind of rule that rots into bad data.
- **[DECISION NEEDED]** Is COM in scope for LA Mattress? Custom-fabric upholstery is a furniture-retail
  feature; a mattress retailer may have no use for it. If out of scope, note that we still need *some*
  representation of "non-inventory line with cost captured later" for things like customer-supplied
  frames or third-party services.
- If in scope: require the cost prompt (checked) so gross margin is right at the point of sale, and treat a
  missing COM cost as a blocking exception rather than a silent zero.

---

### `SCS-020` D-Tools System Control Settings
*storis_ref: article 15186452533012*

**Purpose.** Configures the **import of D-Tools® project data** into STORIS by mapping STORIS product
fields to columns in a CSV exported from D-Tools.

**Where it lives.** Two paths:
`System Administration > System Settings > Customer System Settings > Interface System Settings > D-Tools System Control Settings`
and `System Administration > System Settings > General Administration System Settings > Interface System Settings > D-Tools System Control Settings`.
**"This process is available if the module is licensed, regardless of whether or not the module is active."**
Licensing status is on the **Licensing** tab of General System Control Settings (`SCS-038`).
"NOTE: Some system control settings are accessible by STORIS personnel only."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Import Path | path | Default location of the CSV-formatted D-Tools file. STORIS ships D-Tools' own default export path; editable. **If the path has no filename, the import opens a file browser at that path. If the path is entirely empty, the browser defaults to the root directory of the logged-in PC.** A fixed filename may be included if it never changes. |
| Column Names Included | bool | Checked → the first line is a header row and real data starts on line 2. Blank → **the first line is treated as valid line-item data**. **Hard rule: "If you are exporting a D-Tools file, the first line MUST consist of column names."** — i.e. for the actual supported source, the box must be checked. |
| Last Line Total Included | bool | Checked → the last line is a totals row and **is not imported**. |
| STORIS Field Name | read-only text | Populated when a grid row is double-clicked. **Not editable.** |
| D-Tools Column Name | text | The exported column name mapped to the selected STORIS field. Example given: **the D-Tools `Model` column maps to the STORIS `Product ID` field.** **Active only when `Column Names Included` is checked** (mutually exclusive with `Column`). |
| Column | int (position) | Column **position** in the exported file, used to establish column widths when the file has no header. **Active only when `Column Names Included` is blank** (mutually exclusive with `D-Tools Column Name`). |
| Default Value | text | Value used for the STORIS field when no D-Tools data is available or cannot be mapped. Example: a default vendor number used "in line-item entry or new product creation". |
| Required Field | read-only bool | Whether the field is required. **Displayed as a check box, and as `1` (required) / `0` (not) in the grid. Not editable.** |
| Grid | fixed-row grid | **"You cannot add or delete any items in the grid."** Double-click a row to edit only `D-Tools Column Name` or `Default Value`. |

**Behavior & rules.**
- **The mapping table is a fixed set of STORIS target fields** — the integration surface is closed; only the
  source column (by name or position) and a fallback default are configurable.
- `D-Tools Column Name` and `Column` are **strictly mutually exclusive**, driven by `Column Names Included`.
- **Default Value can silently create products** ("new product creation") with fabricated attribute values.
- A blank `Import Path` defaulting the browser to the **root directory of the user's PC** is a small but
  real footgun.

**Dependencies.** General System Control Settings (`SCS-038`) — Licensing tab; product master / product
creation; vendor master; Import Document Print (`SCS-041`) and Order Line Import Control Settings
(position 51, part B) for the sibling import mechanisms.

**Build notes.**
- New IDs: `CFG-DTOOLS-IMPORTPATH`, `CFG-DTOOLS-HASHEADER`, `CFG-DTOOLS-HASTOTALLINE`,
  `CFG-DTOOLS-FIELDMAP` (list of `{storis_field (fixed), source_column_name | source_column_index,
  default_value, required (fixed)}`).
- **Do differently:** file-path-on-a-server-share imports should be replaced with an upload endpoint plus a
  parsed, previewable staging step. Never import straight from a path with no dry run.
- **Do differently:** a `Default Value` that can create new products means bad mappings quietly generate
  catalog garbage. Require an explicit "create products" permission and a review queue; never auto-create
  from a defaulted vendor number.
- **[GUARDED]** Changing the field map while an import is running or partially applied must be blocked;
  version the map and stamp each import batch with the map version used.
- `[DECISION NEEDED]` D-Tools is an AV/custom-integration design tool — almost certainly **out of scope**
  for LA Mattress. Keep only the generic lesson: a reusable **CSV-to-entity mapping profile** type that
  Order Line Import and vendor catalog imports can share.

### `SCS-021` Data Warehouse Control Settings
*storis_ref: article 15186501753492*

**Purpose.** Settings for the **STORIS Data Warehouse (SDW)** nightly export — batch sequencing, file
naming, logging, source identification, and which subject areas ("data marts") are exported.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Interface System Settings > Data Warehouse Settings > Data Warehouse Control Settings`.
"Use SDW to export STORIS data into a centralized reporting database. Then, you separate the data into
reporting units known as 'data marts.'"
"NOTE: Some system control settings are accessible by STORIS personnel only."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Next Batch Number | int (sequence) | **(LOCKED - STORIS access ONLY!)** "used in the transmission of multiple files each night. The files are grouped for transmission sequentially." |
| Suffix for Xmit Files | text (file extension) | **(LOCKED - STORIS access ONLY!)** Extension used when transmitting files to the Data Warehouse. |
| Suppress Message Log Success Messages | bool | **The label and the description contradict each other:** the label says *suppress* success messages, the description says "To have the system **create** a message log entry for successful file transmissions … check the box." **[CONFLICT] — polarity of this flag is ambiguous in the source; must be verified against the running system before implementing.** **"Error messages always display, regardless of this flag."** |
| Resync/Setup Data Warehouse | bool | **(LOCKED - STORIS access ONLY!)** Checked → **the End of Day process does NOT run the Data Warehouse export.** Used during initial installation or a full re-sync. "Normally, you leave this field blank." **[GUARDED — a flag left checked silently stops all warehouse loading; reporting goes stale with no error.]** |
| Data Source Warehouse ID | int/text | **(LOCKED - STORIS access Only!)** Source ID for this data source; **"All records imported into the Data Warehouse include a Source ID number."** STORIS assigns one per data source. **[GUARDED — changing it after loading orphans or duplicates every previously-loaded record.]** |
| Data Marts Active | multi-select | **(LOCKED - STORIS access ONLY!)** Which subject areas export: `Inventory`, `Purchasing`, `Sales Analysis`, `Accounts Receivable`. |

**Behavior & rules.**
- The export "usually runs during **End of Day (EOD)**".
- Every field except the log flag is **vendor-locked**, so in practice this is a vendor-managed integration.
- **Failure mode worth naming:** `Resync/Setup` checked + success messages suppressed = a warehouse that
  silently stops updating, with only the absence of data as a signal.

**Dependencies.** `EOD-001`; General System Control Settings (`SCS-038`) for module licensing;
reporting/BI consumers.

**Build notes.**
- New IDs: `CFG-SDW-NEXTBATCH` (locked, monotonic), `CFG-SDW-FILESUFFIX` (locked),
  `CFG-SDW-LOGSUCCESS` **[CONFLICT — verify polarity]**, `CFG-SDW-PAUSEEXPORT` **[GUARDED]**,
  `CFG-SDW-SOURCEID` (locked) **[GUARDED]**, `CFG-SDW-ACTIVEMARTS`.
- **Do differently:** rename the pause flag to what it does (`export_paused`) and make it **self-expiring**
  — require an end time, or raise an alert every day it remains set. A permanent "off" switch with a
  reassuring name is how data pipelines die quietly.
- **Do differently:** file-drop-with-a-suffix transmission should be replaced by an idempotent, versioned
  extract with per-batch manifests, row counts, and a load-status table the business can see.
- **[GUARDED]** `CFG-SDW-SOURCEID` must be immutable after the first successful load.
- Emit **freshness metrics** (last successful load per mart) rather than relying on message-log entries.
- `[DECISION NEEDED]` LA Mattress BI target (warehouse/lakehouse choice) is out of scope here, but the
  four-mart split — Inventory, Purchasing, Sales Analysis, Accounts Receivable — is a reasonable starting
  domain decomposition to reuse.

---

### `SCS-022` Default Check Print Bank
*storis_ref: article 15186451247636*

**Purpose.** Documents the **resolution hierarchy** for the default check print bank used when creating
checks to pay AP bills. Not a settings screen — a precedence specification across four other screens.

**Where it lives.** The resolved value appears at the `Bank` field on the **Check Processing** tab of
*Enter/Update Individual Vendor Invoice*, after a `Company` is chosen on the General tab.

**Fields (the settings that participate)**

| Field | Owning screen | Type | Purpose / business rule |
|---|---|---|---|
| Default check print bank | **Vendor Remit-To Settings** | ref (bank) | **Highest precedence.** "applicable only if you have set up multiple remit-to addresses for one or more vendors." |
| Default check print bank | **Vendor Settings** | ref (bank) | Second precedence. |
| Print Bank | **Payables Control Settings** | ref (bank), **mandatory** | Lowest precedence in single-company mode. **"The Print Bank field in the Payables Control Settings is mandatory. Thus, the system can always find a default check print bank."** **Hard rule: under Multi-Company Processing this field "clears and inactivates".** |
| Default Check Print Bank | **Company Settings** | ref (bank), **mandatory under Multi-Company** | Lowest precedence in multi-company mode, replacing Payables Control Settings. |

**Behavior & rules.**
- **Standard hierarchy (highest first):** `Vendor Remit-To Settings` → `Vendor Settings` →
  `Payables Control Settings`.
- **Multi-Company hierarchy (highest first):** `Vendor Remit-To Settings` → `Vendor Settings` →
  `Company Settings`.
- **Hard multi-company rule, quoted:** "The system accepts **only banks associated with the selected company
  on the bill** for which you are printing a check. Therefore, if a default check bank exists for the vendor
  remit-to or vendor associated with the selected AP bill, **that bank must be associated with the selected
  company (via the Bank Settings). Otherwise, the system uses the default bank associated with the selected
  company.**" — i.e. the more-specific value is **silently discarded** when it fails the company
  association test. A fallback, not an error.
- The mandatory bottom of each hierarchy guarantees resolution never fails.
- The user may always override by typing a bank directly.

**Dependencies.** Vendor Remit-To Settings; Vendor Settings; Payables Control Settings (`SCS-052`/part B —
`Print Bank`); Company Settings; Bank Settings (company association); Multi-Company Processing;
Enter/Update Individual Vendor Invoice.

**Build notes.**
- This is a **scope-resolution instance**, and it fits the Inventory pack's resolver model well — but note
  it introduces two scopes the pack's chain (`SYSTEM → DISTRICT → LOCATION → GROUP → PRODUCT`) does not
  have: **`COMPANY`** and **`VENDOR_REMIT_TO`**. Extend the resolver:
  `VENDOR_REMIT_TO → VENDOR → COMPANY → SYSTEM`.
- New ID `CFG-AP-DEFAULTCHECKBANK` with declared scopes `SYSTEM | COMPANY | VENDOR | VENDOR_REMIT_TO`,
  plus the **validity predicate** "bank must be associated with the bill's company".
- **Do differently:** silently falling back when the more-specific bank is not valid for the company is
  dangerous — checks would print on an unexpected bank account. Our resolver should **surface the fallback**
  (a visible warning on the check-run screen naming which bank was overridden and why), and ideally block
  the run until an operator confirms.
- **[GUARDED]** Enabling Multi-Company Processing **clears and inactivates** `Payables Control Settings >
  Print Bank`. That is a settings change on one screen wiping a mandatory value on another — exactly the
  guarded-change pattern. Require Company Settings defaults to be populated **before** multi-company can be
  enabled.
- `[DECISION NEEDED]` Does LA Mattress operate multiple legal entities? If yes, the company scope must be in
  the settings resolver from day one, not retrofitted.

---

### `SCS-023` Default Due Day Table
*storis_ref: article 15186416725012*

**Purpose.** Explains the derived **Default Due Day Table** offered when creating a customer. It is not an
independently editable table — it is generated from four fields on another screen.

**Where it lives.** Derived from `Account Statement Cycling Control Settings` (`SCS-001`); consumed at the
`Due Day` field in **Customer Settings** when creating a new customer record.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (derived) Default Due Day Table | list of up to 4 day-of-month values | Built from the **four Due Day fields** (`Default Due Day` + `Due Days 2, 3, and 4`) in Account Statement Cycling Control Settings, **only when `Cycle Schedule` = `Table`**. Presented as the selectable options at `Due Day` in Customer Settings for new customers. |

**Behavior & rules.**
- **Hard precondition: the table exists only when `Cycle Schedule` = `Table`.** With `Monthly`, the single
  `Default Due Day` value is simply defaulted; with `Daily`, `Auto Assign Due Date` governs instead.
- Inherits the constraints from `SCS-001`: **maximum accepted due day is 28**, and **per-location due days
  override the global ones**.
- Inherits the surprising rule from `SCS-001`: **editing the Due Day fields does not affect existing
  customers** — the table applies to newly created customers only.

**Dependencies.** Account Statement Cycling Control Settings (`SCS-001`); Customer Settings (`Due Day`);
Warehouse/Store Location Settings (per-location due days).

**Build notes.**
- No new setting ID — this is the **presentation of `CFG-AR-DUEDAY[1..4]`** under
  `CFG-AR-CYCLESCHEDULE = TABLE`. Register it as a *derived view*, not a stored table, so the two can never
  drift.
- Enforce `1 ≤ due_day ≤ 28` at the type level.
- **Do differently:** allow more than four due days (the four-slot limit is arbitrary), and make the option
  list a proper set with de-duplication.
- Surface the location override in the same picker so a user creating a customer at a store sees that
  store's due days, not the global list.

### `SCS-024` Default Store/District Assignments - Collections
*storis_ref: article 15186451246228*

**Purpose.** Assigns a **default collector per location or per district**, filling the middle tier of the
collections-assignment fallback chain.

**Where it lives.** `Actions` button on **Collections Processing Control Settings** (`SCS-014`).
**"This option is active only if you check the box at either the `District` or `Location` fields."**
Which dimension the grid shows depends on which of those two is selected (they are mutually exclusive).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| District/Location | ref (grid selection) | Double-click a grid item to select the district or location. |
| Collector | ref (collector code) | Default collector for that district/location. Enter the code directly or use Search. |

**Behavior & rules.**
- **Fallback chain (hard, quoted):** "If you do not assign a collector to a district or location, **and the
  customer does not match any Collections criteria**, the system uses the default collector specified in the
  Collections Processing Control Settings." So the resolution order is
  **matching criteria → district/location default → `Default Collections Manager`.**
- **"Changes performed on this screen do not update immediately - only when you click on Save."**
- **Hard rule: "This process changes only DEFAULT assignments. To change a current assignment, use the
  Collector Review process or the Mass Collector Reassignment process."** — same silent-no-op-on-existing
  pattern as `SCS-014` and `SCS-001`.

**Dependencies.** Collections Processing Control Settings (`SCS-014`) — `District` / `Location` /
`Default Collections Manager`; collector master; Collector Review; Mass Collector Reassignment;
Regional Processing.

**Build notes.**
- New ID `CFG-COLL-DEFAULTCOLLECTOR` with scopes `DISTRICT | LOCATION | SYSTEM` — this is a clean scope
  resolution and should use the standard resolver rather than a bespoke screen.
- **[GUARDED]** Switching `CFG-COLL-BYDISTRICT` ↔ `CFG-COLL-BYLOCATION` changes which dimension this grid
  keys on; the other dimension's assignments become unreachable. Keep both sets of data; do not delete.
- **Do differently:** as with `SCS-014`, apply defaults at evaluation time so that changing a default takes
  effect without a manual batch, or auto-enqueue the reassignment with visible job status.
- Dependent on the `[DECISION NEEDED]` from `SCS-014` — whether in-house collections is in scope at all.

---

### `SCS-025` Deferment Fee Table
*storis_ref: article 15186416721684*

**Purpose.** An optional **tiered fee schedule** mapping a deferred installment amount to a flat dollar
deferment fee.

**Where it lives.** `Installment Receivables Control Settings > General tab > "Deferment Fee is" field > Action button` (see `SCS-042`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Deferment $ | money | Lower bound of a tier. **Matching rule, quoted: "If the amount deferred for this contract is equal to or greater than this amount, but less than the next higher Deferment Amount in this table, the corresponding Fee is assessed."** |
| Fee $ | money | **Flat** dollar fee charged for that tier. |
| Grid columns | `$ Deferment`, `$ Fee`, `Remove` | `Remove` deletes a grid line. |

**Behavior & rules.**
- **"The table is built in ascending deferment amount order."** — ordering is intrinsic to the lookup.
- **Hard rule: "If you do not create a table, deferment fees are not assessed."** — an empty table means
  free deferments, not an error.
- **Undefined below the first tier:** an amount less than the lowest `Deferment $` has no matching row; the
  article does not say what happens. Presumably no fee. **Gap.**
- **Unbounded top tier:** the highest row implicitly covers everything above it.

**Dependencies.** Installment Receivables Control Settings (`SCS-042`) — `Deferment Fee is`;
installment contract deferment processing; Collections Processing Control Settings (`SCS-014`) — note the
carve-out there that a deferment zeroing a balance does **not** re-evaluate collections.

**Build notes.**
- New ID `CFG-INST-DEFERMENTFEETABLE` — an ordered list of `{amount_from, fee}` with the top row unbounded.
- Store as **explicit closed/open ranges** (`amount_from`, `amount_to`) with validation for gaps and
  overlaps, rather than relying on implicit "next higher row" semantics. Define the below-first-tier
  behavior explicitly.
- **[GUARDED]** Fee tables are consumer-facing charges. **Version and effective-date** them; a contract's
  deferment must be priced with the table in force at the time of the deferment, and the applied fee must
  be stored on the transaction, not re-derived.
- **Compliance:** deferment fees on consumer installment contracts are regulated (state usury / fee caps,
  and disclosure). `[DECISION NEEDED]` — legal review before any equivalent ships.
- `[DECISION NEEDED]` Is in-house installment lending in scope for LA Mattress? If financing is entirely
  third-party, `SCS-025` and `SCS-042` are informational only.

---

### `SCS-026` Demographic Information Screen
*storis_ref: article 15186416719508*

**Purpose.** The customer-facing capture screen for up to **three user-defined demographic questions**,
presented at the end of sales order entry.

**Where it lives.** **"Pops up when you save and exit from `Enter a Sales Order` if the Demographic Control
Settings have been activated."** (See `SCS-027`.)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Question 1 / 2 / 3 response | free text, length-capped | Three responses about the current sales customer. **"The field labels are user-defined in the Demographic Control Settings. You can enter any free-text response as long as it does not exceed the maximum character limit."** The maximum is not stated in this article — see `SCS-027`. |

**Behavior & rules.**
- **Hard limit: exactly three questions.**
- Triggered on **save-and-exit** of a sales order, gated entirely by `SCS-027`.
- Responses are **unconstrained free text** — no code list, no validation, therefore not reliably
  analyzable. (This is the real weakness: the feature exists to collect marketing attribution data but
  stores it as prose.)

**Dependencies.** Demographics Control Settings (`SCS-027`); Enter a Sales Order.

**Build notes.**
- No new setting ID here — the settings are in `SCS-027`; this article documents the capture UX.
- **Do differently:** make demographic questions a **configurable list (not fixed at three)** of typed
  questions — `{single_select from a code list | multi_select | free_text | numeric}` — with required/
  optional per question. "How did you hear about us?" must be a code list if it is ever going to drive
  marketing spend.
- Consider making this **non-blocking** (a task, not a modal on save) so it does not slow the close of a
  sale, and track answer rate as a metric.
- Privacy: demographic answers about a customer are PII. They need the same audit and retention treatment as
  the rest of the customer record. `[DECISION NEEDED]` — what LA Mattress wants to ask, and whether it
  belongs on the order or on the customer.

### `SCS-027` Demographics Control Settings
*storis_ref: article 15186452537748*

**Purpose.** Defines up to **three** demographic questions asked at the end of sales order entry — prompt
text, length, mandatory flag, optional validation against a STORIS file, and data type. Responses feed the
**Create a Mailing List** routine.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Demographics Control Settings`.
"If you specify one or more demographic questions here, you activate this feature in which a pop-up window
displaying the questions appears when filing out of order entry."
"Some system control settings are accessible by STORIS personnel only."

**Fields** *(the same five fields repeat for the First, Second, and Third Demographic Question)*

| Field | Type | Purpose / business rule |
|---|---|---|
| Operator Prompt | text, **max 20 characters** | Prompt text shown on the Demographic Information Screen (`SCS-026`). |
| Max Len | int | Maximum characters the operator may enter at that prompt. |
| Mandatory | bool | Response required. |
| Validation File | text (STORIS file/dictionary name), optional | Validates the response against a STORIS file. **Worked example, quoted: prompting for a marketing source, enter `MARKETING.CODE`; the operator types `TV` and "the system verifies the operator's entry against the `MARKETING.CODE` file. If `TV` does not match, EXACTLY, a record ID in the `MARKETING.CODE` file, a warning is issued and the response is rejected."** File names are the same as the **dictionary names used in Report Builder**; a list is available via *Maintain Report Dictionaries* → arrow at the `File Name` field. **Blank → no validation at all; any response is accepted subject only to `Max Len` and `Data Type`.** |
| Data Type | enum | `Date` \| `Number` \| `Text`. |

**Behavior & rules.**
- **Feature activation is implicit:** specifying at least one question turns the pop-up on. There is no
  separate enable flag. **[CONFLICT-ish]** — `SCS-026` says the screen appears "if the Demographic Control
  Settings have been activated", implying a switch that does not exist as a field.
- **Hard rule, quoted: "Once you establish a demographic question, you should not change it. If you do, you
  may invalidate previous demographic data."** **[GUARDED — the source explicitly warns that editing this
  setting corrupts historical data, and provides no protection against it.]**
- **Hard rule: "For each customer, the system retains only THE MOST RECENT responses entered in the
  demographic information window during order entry."** — answers are **overwritten per customer**, so
  attribution history across orders is destroyed. A customer who bought via TV in 2024 and Instagram in
  2026 has only the Instagram answer.
- Validation is **exact record-ID match**, case- and whitespace-sensitive by implication.
- Consumed by **Create a Mailing List** as selection criteria.

**Dependencies.** Demographic Information Screen (`SCS-026`); Enter a Sales Order; Create a Mailing List;
Report Builder / Maintain Report Dictionaries; the referenced validation files (e.g. `MARKETING.CODE`).

**Build notes.**
- New ID `CFG-DEMO-QUESTIONS` — a **list** (not three fixed slots) of
  `{prompt, max_len, mandatory, data_type ∈ {DATE, NUMBER, TEXT, CODE_LIST}, code_list_ref}`.
- **[GUARDED] — this is one of the clearest guarded-change cases in the whole section.** Editing a question
  silently re-labels historical answers. Our implementation must:
  (a) make questions **immutable once answered** — edits create a new question version;
  (b) store each answer with the **question version id** it was answered against;
  (c) never overwrite a prior answer — **store answers per order, not per customer**, and derive
  "most recent" at read time.
- **Do differently:** replace `Validation File` (an arbitrary internal file name, exact-match) with a proper
  **code list** reference and a picker in the UI. Free-text marketing attribution is worthless for analysis;
  a code list is the whole point.
- The 20-character prompt limit is too short for a real question. Drop it.
- `[DECISION NEEDED]` LA Mattress: which attribution questions, and should attribution live on the order
  (recommended) or the customer?

---

### `SCS-028` Due Date List Entry
*storis_ref: article 15186451511828*

**Purpose.** Optionally restricts which **days of the month** can be chosen as the Due Day when creating an
installment contract.

**Where it lives.** `Installment Receivables Control Settings > General tab > "Due Date Is" field > Action button` (see `SCS-042`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Day of the Month | multi-select checkbox set (days of month) | Check each day to include in the allowed list. **"If you select specific days using this screen, only those days are offered as selections in the drop-down at the `Due Day` field of the Installment Worksheet entry."** Changes take effect on **Save**. |

**Behavior & rules.**
- **Optional routine: if no days are selected, the restriction does not apply** and the full range is
  presumably offered.
- **Hard rule: "only one of those days can be selected as the Due Day for the contract during creation of
  the customer's contract."**
- **Note the inconsistency with A/R:** `SCS-001`/`SCS-023` cap due days at **28** and offer at most **four**
  table entries; this installment screen appears to offer the full month with no stated cap and no stated
  28-day limit. **[CONFLICT] — two different due-day models in one system (A/R open-item/revolving vs
  installment).**

**Dependencies.** Installment Receivables Control Settings (`SCS-042`) — `Due Date Is`;
Installment Worksheet entry; contrast with Account Statement Cycling Control Settings (`SCS-001`) and
Default Due Day Table (`SCS-023`).

**Build notes.**
- New ID `CFG-INST-ALLOWEDDUEDAYS` — a set of day-of-month values, empty = unrestricted.
- **Unify with `CFG-AR-DUEDAY[1..4]`.** One concept — "which due days may a customer be assigned" — should
  have one representation, scoped and reused by A/R and installment alike, with the 1–28 rule applied once
  (days 29–31 do not exist in February and are a perennial source of billing bugs).
- **[GUARDED]** Removing a day that existing contracts already use does not (and must not) change those
  contracts, but our UI must say so explicitly rather than leaving it ambiguous.
- Dependent on the same `[DECISION NEEDED]`: is in-house installment lending in scope?

---

### `SCS-029` eBridge Commerce Credit Revew Queue Retention Days
*storis_ref: article 15186416970132*

*(Title misspelling "Revew" is as published.)*

**Purpose.** Sets how long **processed** records in the eBridge Commerce credit-review queue are kept before
purge. The queue holds Equifax data arriving via the eBridge Commerce `Update Pending Credit Review` method.

**Where it lives.** `Credit Application Control Settings > General tab > "eBridge Commerce Credit Review Queue Retention Days" option in global Actions` (see `SCS-017`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Retention Days | int **0–999**, **default 30** | Days to retain **processed** queue records. **`0` → "queue records are deleted immediately after processing"; `999` → "records are never deleted."** Purge runs via **Schedule a Process**. |

**Behavior & rules.**
- **Flow, quoted:** "When communicating with Equifax, the call made to the eBridge Commerce method results
  in data that is validated and then written to a queue. Credit review items are updated via the scheduled
  process option, **Webhook processing**."
- **`999` is a magic sentinel meaning "infinite", not "999 days"** — the kind of encoded special value our
  settings service should never reproduce.
- Purging is done by a **scheduled process**, not EOD — so a disabled scheduler silently stops purging.

**Dependencies.** Credit Application Control Settings (`SCS-017`); eBridge Commerce / API Control Settings
(`SCS-007`); Equifax (via InterConnect, `SCS-017`); Schedule a Process; Review Pending Credit Requests.

**Build notes.**
- New ID `CFG-CREDAPP-EBRIDGEQUEUEDAYS`, type `int | NEVER_DELETE` — model the "never" case as its own
  value, not as `999`.
- **Compliance:** this queue holds **consumer credit bureau data**. Retention is an FCRA/GLBA-relevant
  control, and `0` (delete immediately) may destroy the audit trail for a credit decision. Recommend a
  **floor** on this setting and separate the *queue* retention from the *decision record* retention
  (`CFG-CREDAPP-HISTORYDAYS`, `SCS-017`) — they should not be tunable to inconsistent values.
  `[DECISION NEEDED]` — legal review.
- Encrypt at rest; exclude from general logging; treat the queue as a PII store with its own access audit.
- `[DECISION NEEDED]` Only relevant if we ingest bureau data ourselves. With third-party financing, this is
  out of scope.

### `SCS-030` EDI Control Settings
*storis_ref: article 15186501753236*

**Purpose.** All EDI configuration: file-drop paths for the network provider, control numbering, inbound
processing schedule, PO acknowledgement handling (cost, quantity, and date changes from vendors), inbound
810 invoice-to-AP-bill hold rules, and shipping-notification delivery.

**Where it lives.** Three paths — under `Customer System Settings > Interface System Settings`,
`Merchandising and Distribution System Settings`, and
`General Administration System Settings > Interface System Settings`, all → **EDI Control Settings**.
**Hard prerequisite: "To use the EDI module, a STORIS representative must set `EDI Processing` to `Active`
on the Active Add-Ons tab of the General System Control Settings."** → `SCS-038`.

**Fields — paths and transport**

| Field | Type | Purpose / business rule |
|---|---|---|
| Live Account Directory Path | path | Path to the Live account, e.g. `/storis/ud/CUSTOMERNAME` (Unix) or `c:\storis\ud\CUSTOMERNAME` (Windows). |
| I/O Data Directory Path - Live | path | Where the network provider software (**Exim** given as the example) reads/writes for the **Live** account, e.g. `/storis/exim/live`, `c:\storis\exim\live`. |
| I/O Data Directory Path - Learn | path | Same for the **Learn** (training) account, e.g. `/storis/exim/learn`. **[GUARDED] — pointing Learn at the Live directory would transmit training data to real vendors.** |
| Process Inbound EDI During End of Day | bool | Checked → **Dispatch Inbound EDI Data** runs during EOD and processes **all inbound** document types. **"It does not process any outbound EDI documents."** Blank → run manually via *Import Received EDI Documents*, or as a scheduled phantom (`Dispatch EDI Invoice Documents` and/or `Dispatch EDI Acknowledgement/Notification Documents`). |
| Last Control Number Used | int (sequence) | Unique control number per outbound transmission to the network provider; increments by one after each transmission. **"Important: STORIS strongly recommends you do not edit the `Last Control Number Used` field."** **[GUARDED — editing produces duplicate control numbers and rejected transmissions.]** |
| Prompt for Outbound Creation | bool | Checked → prompt before creating an outbound document. Blank → **the system automatically creates and transmits electronic documents.** |
| Set Selling Location | bool | Governs the `EDI Buyer Store` field on **EDI 850 and 860** documents generated from a PO. Blank → buyer store = **the user's login location**. Checked → for POs with no selling location already: (1) PO linked to a **single** sales order → use that sales order's **Selling Store Location**; (2) **unattended** generation (e.g. EOD) with no linked sales orders or multiple linked orders with different selling stores → **the user's login location**; (3) **attended** generation (e.g. PO entry) in the same ambiguous case → a **Selling Location window** appears after answering Yes to the `"Submit PO for EDI transmission"` prompt. |
| Flag P/O Printed | bool | Checked → POs submitted for EDI transmission are flagged **"printed"**. Blank → considered **"not printed"**. **"This field does not affect existing purchase orders that have already been transmitted."** **Hard rule: "If using the WMS Interface, be sure to check the box at this field."** |
| Days to Archive | int days | Retention of EDI transmission/receiving data before purge. **"STORIS recommends you set this field to at least 120 days."** |
| 997 Late Days | int days | Days to wait for a functional acknowledgement (**EDI 997**) from a vendor, counted **from the PO transmit date**. If none arrives, the PO is added to the **End-of-Day PO F/A Exception Report**. "We recommend you set this field to a minimum of 3." |
| Unreceived 997 Purge Days | int days | Days before un-received 997 documents are purged. |
| Purge Days for EDI 215 Transaction Logs | int **1–9999**, **default null** | Retention of 215 transaction logs. **"All transactions with a creation date older than this number of days AND where the order is no longer open will be purged."** Purge basis is **either the deletion date or the completion date of the order involved**. **Null → logs are never purged.** |

**Fields — vendor-driven cost and quantity changes**

| Field | Type | Purpose / business rule |
|---|---|---|
| Update Costs for Acknowledged PO | enum | `Never` — never accept the vendor's changed costs \| `Only When Lower` — accept only if lower than the PO cost \| `Always` — always accept. **This is a vendor unilaterally changing your cost of goods; `Always` should be considered dangerous.** |
| Update Costs on Vendor Billing | enum | Same three values, applied to vendor **billings** rather than acknowledgements. |
| Update Quantity for Acknowledged PO — Decreases | bool | Update PO quantities for decreases on an **855 or 865** transaction. **"A decrease allows the purchase order quantity to be brought down to zero."** |
| Update Quantity for Acknowledged PO — Increases Within the Maximum | bool | Update PO quantities for increases **≤ `Maximum Quantity Increase`**. |
| Maximum Quantity Increase | int > 0, **mandatory when `Increases Within the Maximum` is checked** | Cap on vendor-initiated quantity increases. |
| Suppress Date Change on Acknowledgement | bool | Suppress vendor date changes on acknowledgements. |
| Use Receiving Calendar for Advanced Ship Notification Updates | bool | The **EDI Advanced Ship Notice Dates** process uses the receiving calendar from **Warehouse/Store Receiving Settings**. **"The `Receiving Calendar` setting in Vendor EDI Settings checks to see whether or not this setting is enabled when `Use Default` is selected."** |

**These quantity settings can be set globally here or per vendor in Vendor EDI Settings.**
**"If you do not enable these settings, purchase orders are not updated with quantity changes."**

**Fields — Inbound 810 Invoice Company**

| Field | Type | Purpose / business rule |
|---|---|---|
| Use Receipt Warehouse Location's Company | bool | For multi-company invoicing: use the warehouse where the invoice was received as the invoice company for inbound 810s. **Mutually exclusive with `Use Specific Company To Pay For Invoices`.** |
| Use Specific Company To Pay For Invoices | ref (company) | For non-multi-company setups: the company invoiced for 810 documents. **Unavailable when the field above is checked.** |

**Fields — inbound bill hold rules**

| Field | Type | Purpose / business rule |
|---|---|---|
| Hold Code for Incoming Bills | ref (hold code), optional | Hold code applied to bills. **"If a hold code exists, the below seven check boxes are checked by default."** **Hard rule: "If any of the following check boxes are checked and hold code has not been entered, the user receives an error message and is unable to save the record. The error message is `A Hold Code must be entered if incoming Bills will be placed on hold.`"** |
| Hold Incoming Bills with no Variances | bool, **default unchecked** | Hold the AP bill even when the incoming bill and PO **match with no variance**. |
| Incoming Bill Price Greater | bool, **default unchecked** | Hold when the incoming bill price **exceeds** the PO price. **"Note that the AP bill is created whether this setting is checked or unchecked. When the incoming bill price does not match the purchase order, an exception is generated whether the variance is higher or lower."** — so a *lower* price generates an exception but **cannot** trigger a hold. **[CONFLICT/gap — there is no `Incoming Bill Price Lower` hold flag, though there is one for quantity.]** |
| Incoming Bill Quantity Greater | bool, **default unchecked** | Hold when the billed quantity exceeds what was received. **Hard rule: "If the purchase order has no received product, the AP bill is NOT created."** If unchecked and at least one item was received, the bill is created and not held. |
| Incoming Bill Quantity Lower | bool, **default unchecked** | Hold when the billed quantity is lower than received. |
| Incoming Bill with Tax | bool, **default unchecked** | Hold when the incoming bill has tax. |
| Incoming Bill with Miscellaneous Charges | bool, **default unchecked** | Hold when the bill has a miscellaneous charge. |
| Incoming Bill with Freight Charges | bool, **default unchecked** | Hold when the bill has a freight charge. |

**Fields — Tracking Number Notification (ASN 856, direct ship)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Use ELP | enum option, **the default** | Email the Direct Shipping Notification via STORIS' **Enhanced Laser Printing**. **"The emailing is automatic upon receipt of the inbound ASN."** Order comment generated verbatim: **"A copy of the Direct Shipping Notification for Order NNNNNN has been sent to the customer."** |
| Use Digital | enum option | Send the notification to **flexEngage** for emailing. Processed via **Webhook Processing** under *Schedule a Process*. **Requires the flexEngage license `Digital Receipts Interface` to be active.** |

**Scope note, quoted:** "These setting pertain only to Direct Shipping Notification information, while the
`Digital Receipts Enabled` setting in Warehouse/Control Settings pertains only to sales and service
documents."

**Behavior & rules.**
- **Vendor-initiated mutation of your own purchase orders is configuration-driven**: cost (three modes),
  quantity down to zero, quantity up to a cap, and dates. Getting these wrong lets a vendor silently
  change what you owe.
- **A PO with nothing received will not produce an AP bill at all** — a hard gate, independent of the hold
  flags.
- The seven hold flags **default to checked** when a hold code is entered, and the record cannot be saved
  with any flag checked and no hold code.
- **Learn vs Live path separation is the only thing preventing test EDI traffic reaching real vendors.**

**Dependencies.** General System Control Settings (`SCS-038`) — `EDI Processing` active add-on;
Vendor EDI Settings (per-vendor overrides, `Receiving Calendar`); Warehouse/Store Receiving Settings
(receiving calendar); Payables / AP bill creation and hold codes; Purchasing Control Settings;
`CFG-COSTING-TOLERANCE` **[REUSE]** (cost variance); Costing Control Settings (`SCS-016`) —
`Inventory AP Approval`; WMS Interface; External Communications Settings (`SCS-035`) — flexEngage;
Warehouse/Control Settings (`Digital Receipts Enabled`); Schedule a Process; `EOD-001`.

**Build notes.**
- New IDs: `CFG-EDI-PATH-{LIVE,IOLIVE,IOLEARN}` **[GUARDED]**, `CFG-EDI-INBOUNDATEOD`,
  `CFG-EDI-LASTCONTROLNUM` **[GUARDED, monotonic]**, `CFG-EDI-PROMPTOUTBOUND`,
  `CFG-EDI-SETSELLINGLOCATION`, `CFG-EDI-FLAGPOPRINTED`, `CFG-EDI-ARCHIVEDAYS`,
  `CFG-EDI-997LATEDAYS`, `CFG-EDI-997PURGEDAYS`, `CFG-EDI-215PURGEDAYS`,
  `CFG-EDI-COSTUPDATE-ACK`, `CFG-EDI-COSTUPDATE-BILLING`, `CFG-EDI-QTYDEC`, `CFG-EDI-QTYINC`,
  `CFG-EDI-QTYINCMAX`, `CFG-EDI-SUPPRESSDATECHANGE`, `CFG-EDI-USERECEIVINGCALENDAR`,
  `CFG-EDI-810COMPANYMODE`, `CFG-EDI-810COMPANY`, `CFG-EDI-BILLHOLDCODE`,
  `CFG-EDI-HOLD-{NOVAR,PRICEGT,QTYGT,QTYLT,TAX,MISC,FREIGHT}`, `CFG-EDI-ASNNOTIFYMODE`.
- **Guarded changes:** the Live/Learn I/O paths (cross-environment contamination), `LASTCONTROLNUM`
  (duplicate control numbers break the trading-partner relationship), and all purge windows.
- **Do differently:** never accept vendor cost changes automatically. Model as
  `{NEVER | WITHIN_TOLERANCE(tolerance) | REVIEW_QUEUE}` and route everything else to a cost exception —
  reuse `CFG-COSTING-TOLERANCE` **[REUSE]** rather than inventing "Only When Lower". A vendor lowering the
  cost is still a change you should record and approve.
- **Do differently:** add the missing `Incoming Bill Price Lower` hold flag, or better, replace the seven
  booleans with a **rule table** of `{condition, action ∈ {PASS, HOLD, REJECT}, tolerance}` so price-under,
  price-over, qty-over, qty-under, tax, misc, and freight are all expressible symmetrically.
- **Do differently:** environment separation (Live vs Learn) belongs in deployment configuration, not in a
  user-editable settings screen where a typo transmits test POs to real vendors.
- `[DECISION NEEDED]` Which trading partners does LA Mattress actually run EDI with, and which document
  types (850/855/856/860/865/810/997/215)? That determines how much of this is in scope.

---

### `SCS-031` Electronic Check Processing Control Settings
*storis_ref: article 15186501753620*

**Purpose.** Parameters for **Electronic Check Authorization/Acceptance (ECA)** — check acceptance at POS,
including the customer-signed acceptance statement text.

**Where it lives.** Two paths — `Customer System Settings > Interface System Settings` and
`General Administration System Settings > Interface System Settings` → **Electronic Check Processing Control Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Electronic Check Authorization Transaction Sequence | int (sequence) | Reference number for the first ECA transaction; incremented by one per new ECA transaction. |
| History Retention Days | int days | Days to retain ECA transactions in history before purge. |
| DL Number Prompt | enum | Driver-license capture: `Mandatory` \| `Optional` \| `None - de-activates the field`. |
| Processor Time Out Limit (hhmm) | duration `HH:MM` | "the variable time limit … that you want to keep the phantom process running after a transmission has been initiated. **The transaction processor starts looking for transactions to process after the time specified here.**" **[CONFLICT] — the two sentences describe opposite things: a time limit for keeping a process alive, and a delay before the processor starts. Must be verified before implementing.** |
| Manual Authorizations at Non-Process Location | bool | Allow manual entry of authorizations at locations that cannot reach the processing house. |
| Separate Receipt Printer | bool | A dedicated printer is configured for receipt tickets. |
| Default Payment Type | ref (payment type) | **Must be set to the `Type 2` payment type (the Check payment type)** used for check payments; the Search list shows only Type 2 payment types. |
| Receipt Text | long text | The **ECA Acceptance Statement** — "the statement permitting the electronic deposit of the customer's check into the merchant's bank account". Appears on the receipt the customer signs at the time of purchase. **"This text, including fee amounts, is usually supplied by the Electronic Check Authorization/Acceptance service provider."** |
| Allow Company Checks | bool | Checked → accept business checks. Blank → **personal checks only**. |

**Behavior & rules.**
- **`Receipt Text` is a legal disclosure, not a cosmetic string.** It authorizes electronic deposit and
  states fee amounts; it is supplied by the processor and is what the customer signs.
- Driver-license capture is a **fraud control** and, when `Mandatory`, a PII collection point.
- `Default Payment Type` is constrained by payment-type *class* (Type 2 = Check) — a typed reference.

**Dependencies.** Payment type master (Type 2 / Check); Cash Balancing Control Settings (`SCS-012`) —
the cash drawer does **not** open for electronically-converted checks; Accounts Receivable Control Settings
(`SCS-002`); Payment Card and Device Settings (position 53, part B); receipt printing / Forms Designer.

**Build notes.**
- New IDs: `CFG-ECA-SEQUENCE` (monotonic), `CFG-ECA-HISTORYDAYS`, `CFG-ECA-DLPROMPT`,
  `CFG-ECA-PROCESSORTIMEOUT` **[CONFLICT — clarify semantics]**, `CFG-ECA-MANUALAUTHOFFLINE`,
  `CFG-ECA-SEPARATERECEIPTPRINTER`, `CFG-ECA-DEFAULTPAYTYPE`, `CFG-ECA-RECEIPTTEXT`,
  `CFG-ECA-ALLOWCOMPANYCHECKS`.
- **[GUARDED] `CFG-ECA-RECEIPTTEXT`** — treat as a **versioned legal document**: effective-dated, with the
  version id stored on every signed receipt. Never edit in place. This is the same pattern as
  `CFG-CREDAPP-FIELDRULES` and `CFG-INST-DEFERMENTFEETABLE`.
- **Do differently:** `Manual Authorizations at Non-Process Location` is an offline-acceptance bypass —
  make it a **permission plus a reason code plus a mandatory follow-up authorization**, not a global bool.
- Driver-license numbers are sensitive PII; store encrypted, mask in the UI, and audit views the same way
  `CFG-AR-SECAUDITMONTHS` (`SCS-002`) audits full card numbers.
- `[DECISION NEEDED]` Does LA Mattress accept paper checks at POS at all? If not, this screen is out of
  scope; if yes, the acceptance-statement versioning requirement stands.

### `SCS-032` Enter Quick Purchase Orders
*storis_ref: article 15186452535572*

**Purpose.** A minimal-entry PO creation routine: enter products and quantities, and the system **splits
them into multiple purchase orders automatically** grouped by vendor and ship-from. Filed under System
Control Settings because its behavior is entirely governed by **Quick Purchase Order Settings**.

**Where it lives.** `Menu > Enter Quick Purchase Orders`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Receiving Location | display-only | **Always set to the login location** for all created POs. Not editable. |
| Purchase Order Type | enum | Options come from **`Purchase Order Types Available`** in Quick Purchase Order Settings; default from **`Quick Purchase Order Type`** in the same settings. **Hard rule: "If an As-Is Reason code is assigned in this field, ALL products received on the purchase orders created are assigned that code as well."** (Ties to `SCS-016` `AVERAGE COST - Include Saleable Receipts only`: an As-Is PO type excludes those receipts from average cost.) |
| Product | ref (product code or vendor model number) | Search opens *Search for a Product*; products are presented one at a time. A green `+` button adds the product to the grid. A camera icon shows the product image where available. |
| Quantity | int, **mandatory, 1 – 999,999**, positive | Quantity ordered. |
| Unit of Measure | display-only | UOM of the entered product. |
| Taxable | bool, **default unchecked** | Checked → tax is calculated **at the national tax rate in Sales Tax Settings**. **Active only when the `Imbedded National Tax` setting in Point of Sale Control Settings is set.** |
| Grid columns | `Product`, `Description`, `Quantity`, `Taxable` (`Y`/`N`), `Tax Amount`, `Remove` | Double-click a row to load it into the companion entry area; `Quantity`, `Add`, `Remove`, `Clear` become active and the quantity may be updated. |

**Behavior & rules.**
- **PO splitting rule, quoted:** on Save, "the process groups the products into purchase orders based on the
  **Vendor and Vendor Ship From** that is specified in **Advanced Product Settings**." A message states how
  many POs will be created; `No` returns to the screen, `Yes` creates them and shows their details in the
  grid. Ties to `CFG-VEND-SHIPFROM` **[REUSE]**.
- **Hard eligibility rules, quoted:** "Only products with a **Purchase Status Type of Active** and products
  specified in the **`Inventory Formation`** field in Quick Purchase Order Settings are allowed. **New
  products may not be created on the fly** in the Enter Quick Purchase Orders process. **Special Order or
  configurated products are not allowed** in this process."
- **Confusing confirmation copy on Remove:** "If the product is removed, a warning message appears
  confirming the deletion of the line. If yes is chosen, the product line is removed, and **if cancel is
  chosen, the item remains on the grid, and the purchase orders are created.**" — **[CONFLICT]** the
  cancel branch describes PO creation, which is a different action entirely. Source error or a genuinely
  surprising behavior; verify before copying.

**Dependencies.** Quick Purchase Order Settings (`Purchase Order Types Available`, `Quick Purchase Order
Type`, `Inventory Formation`) — part B; Advanced Product Settings (`Vendor`, `Vendor Ship From`,
`Purchase Status Type`); `CFG-VEND-SHIPFROM` **[REUSE]**; Point of Sale Control Settings
(`Imbedded National Tax`); Sales Tax Settings (national tax rate); PO Types and As-Is Reason codes;
Costing Control Settings (`SCS-016`).

**Build notes.**
- This is a *routine*, not a settings screen — the settings behind it are `CFG-QPO-*` in Quick Purchase
  Order Settings (part B). Record here: `CFG-QPO-POTYPESAVAILABLE`, `CFG-QPO-DEFAULTPOTYPE`,
  `CFG-QPO-INVENTORYFORMATION`, plus `CFG-POS-IMBEDDEDNATIONALTAX`.
- **Do differently:** hard-wiring the receiving location to the login location prevents a buyer at HQ from
  raising POs for a store. Make it default-to-login-location but overridable with permission.
- **Do differently:** silent multi-PO splitting with only a count in the confirmation is thin. Show the
  actual split (vendor, ship-from, line count, value) before committing.
- Keep the As-Is-Reason-propagates-to-receipts rule — but make it **visible on the confirmation**, since it
  changes both inventory status and average-cost participation.
- `[DECISION NEEDED]` Verify the Remove/Cancel behavior against the live system before implementing.

---

### `SCS-033` eSTORIS Control Settings
*storis_ref: article 15186452536468*

**Purpose.** Parameters for **eSTORIS** (STORIS' own ecommerce front end) order submission: which inventory
the site sees, payment and tax-difference handling, fulfillment date defaults, discount mapping, and online
bill pay. Structurally parallel to `SCS-007` (API/eBridge) but a separate, overlapping settings set.

**Where it lives.** `System Administration > System Settings > Companion Application System Settings > Web System Settings > eSTORIS Control Settings`.
Pages: **Warehouse, Payment, Fulfillment, Other**.

**Fields — Warehouse page**

| Field | Type | Purpose / business rule |
|---|---|---|
| Warehouse Product Availability | enum + conditional multi-select | `All Locations` (main warehouse) \| `Specific Locations` (activates a location list). A `Delivery Ship from Location` value is implied by the next field. |
| On Display Product Locations | multi-select (locations) | Locations whose as-is products sync via **On Display Product Sync** (eSTORIS Administration panel) rather than the **Price and Availability** sync. **Unusable when `Warehouse Product Availability` = `Delivery Ship from Location`.** **Requires eSTORIS release bundle ≥ 41.4.x.** |
| On Display Reason Codes | multi-select (reason codes) | Which On Display Product Reason Codes sync. **Requires eSTORIS release bundle ≥ 42.1.x.** |
| Direct Ship Warehouse | text (warehouse code), optional, **empty by default** | A **virtual warehouse holding no physical inventory**, used to track 3rd-party vendor inventory. If populated, **direct ship products for ALL vendors are affected.** Flow: at product delta sync, `Direct Ship Quantity` (Advanced Product Settings) is read, then this field; if set, both values sync and the product's quantity on hand for the direct ship warehouse is updated in eSTORIS. **Hard warning: "This field is not validated. Ensure that this warehouse is identical to the warehouse ID configured in eSTORIS."** **[GUARDED — an unvalidated free-text key that must match an external system exactly.]** |

**Fields — Payment page**

| Field | Type | Purpose / business rule |
|---|---|---|
| Web Miscellaneous Payment Type | ref (payment type) | **(STORIS Locked Field!)** Payment type used for web payments from sources **other than Shift4** (PayPal, Google, etc.). |
| Use Miscellaneous Payment Type for Under Charged Tax | bool + conditional ref (payment type), optional | Handles the case where **eSTORIS charged LESS tax than STORIS calculates**. Checked → indicate the misc payment type used to post the under-charged amount. **Four documented outcomes:**<br>• **Shift4 + Active:** the card is charged the **under amount passed in by eSTORIS**, and the Misc payment type makes up the difference.<br>• **Shift4 + not Active:** the card is charged the **full order amount as calculated by STORIS**, even though eSTORIS passed a lesser amount.<br>• **No Shift4 + Active:** the eSTORIS amount is applied via `Web Miscellaneous Payment Type`, and this setting's payment type makes up the difference.<br>• **No Shift4 + not Active:** the eSTORIS amount is applied and **no additional payment is made — the order carries a balance due.** |
| Finance Payment Type | ref (finance payment type) or `None Selected` | Finance tender available on eSTORIS. **"One finance payment type can be selected at a time."** |
| Finance Provider | display-only | Name of the provider behind the selected finance payment type. |

**Over-charged tax (documented as a NOTE, not a field):** when eSTORIS calculated **more** tax than STORIS —
with Shift4, "Shift4 charges the correct amount"; without Shift4, the excess "is stored as a **tax over
charge**", reportable via Report Builder using **`S$EstorisOrderTax`** and **`S$EstorisInvoiceTax`**.
**In all tax-differential cases, order comments are written.**

**Fields — Fulfillment page**

| Field | Type | Purpose / business rule |
|---|---|---|
| Parcel Route | ref (route code) | Default parcel route for eSTORIS orders. |
| Local Parcel Shipping Only | bool, **default unchecked** | Ship-to ZIP must be associated with a route code, else the route is not offered. Unchecked → no restriction, "can be used to ship anywhere in the U.S." **Only used when `MultiShippingMethod` is selected in eSTORIS Admin panel > STORIS > Shipping > Settings.** |
| Delivery Date Status | enum | `ASAP` \| `CWC` \| `Estimated` \| `Scheduled` \| `Use Point of Sale Control Settings`. **With Pre-Authorization, selecting `SCH` disables pre-authorization "because the system then processes all eBridge orders as sales."** (Note: the eSTORIS article says *eBridge* here — **[CONFLICT]**, copy from `SCS-007`.) |
| Pickup Date Status | enum | Same five values, same pre-authorization caveat. |
| Delivery Pad Days | int, with `In Stock` / `Out of Stock` variants | Start date for scheduled deliveries **when ATP is off**. **"eSTORIS reviews the next 99 days from the selected date for open delivery dates."** |
| Pickup Pad Days | int, with `In Stock` / `Out of Stock` variants | Same for pickups; same 99-day window. |
| Schedule Orders on Credit Hold | bool, **default unchecked** | Permit scheduling of credit-held orders from the eSTORIS Order Details page. |

**Fields — Other page**

| Field | Type | Purpose / business rule |
|---|---|---|
| Restrict Customer Search to Application Location for CFA | bool | Restricts customer search in the **customer-facing credit application** to the login location; customers outside it are excluded. |
| Create Related Items From Product Collections | bool | Sync Product Collections to eSTORIS as Related Products. **Required for `Web Benefits` (Collection Settings) to sync.** |
| Create Related Items From Inventory Formations | bool | Sync Related Inventory Formations (Advanced Product Settings; **not** Web Related Inventory Formations). Same `Web Benefits` note. **[CONFLICT] — same duplicated note as in `SCS-007`.** |
| Accept All Out-of-Stock Products | bool, **default blank** | Checked → **any** product may be ordered "regardless if there is any stock available or if the product's status is dropped or discontinued." **This is a blunter, less safe version of `SCS-007`'s `Accept Out-Of-Stock Discontinued Products`, which at least required a linkable inbound PO.** **[CONFLICT] — two web channels with materially different out-of-stock policies.** |
| Salesperson | multi-select (salesperson codes) | Defaults on all eSTORIS orders. |
| Allow Auto PO Creation | bool | Automatic PO creation for eSTORIS orders. |
| Order Source | enum | Source of the web orders. A value **`eSTORIS 2`** is referenced by the two discount fields below. |
| Allocated Discount Code | ref (discount code) | **Used when `Order Source` = `eSTORIS 2`; required if allocated discounts from eSTORIS are allowed.** The chosen code must be configured in Sales Discount Settings as: **(1) `Line Discounts - Apply as an Allocated Dollar Discount` CHECKED; (2) `Override Discount Amount` CHECKED; (3) `Line Discounts - Cannot be Combined with other Discounts` NOT checked.** |
| Line Item Discount Code | ref (discount code) | **Required if `Allocated Discount Code` is set.** Must be configured as: **(1) `Apply as an Allocated Dollar Discount` NOT checked; (2) `Override Discount Amount` CHECKED; (3) `Cannot be Combined with other Discounts` NOT checked.** **If set, "all web pricing that results in a reduction of the current selling price for the line receives a discount for that amount and the discount amount is applied to the Line Item Discount Code. If you do not select a discount code at this field, all web pricing is treated as a PRICE OVERRIDE."** — a material difference in how web pricing is recorded and reported. |
| # of Times to Attempt to Send to YOTPO | int | Retries before an order is abandoned for YOTPO. **"This field is always available and active, even if YOTPO is not implemented or being used."** |
| Use Customer Home Store for OBP | bool, **default unchecked** | Online Bill Pay posting destination: checked → the **customer's home store**; unchecked → **the web store**. **Three prerequisites, quoted:** check it "in conjunction with the `Allow OBP Payments` setting on the Credit Card page of Warehouse/Store Location Settings"; "Each home store must be configured with an Shift4 eCommerce Location Authorization"; "Each location for the merchant must have **Token Sharing** enabled at Shift4 Payment Card and Device Settings." |

**Behavior & rules.**
- **Tax differential handling is the highest-risk area on this screen:** four distinct outcomes depending on
  two booleans, one of which leaves an **order with a permanent balance due**, and another of which
  **charges the customer's card more than the website quoted**. Both are customer-facing failures.
- **Cross-version dependencies:** two settings require minimum eSTORIS release bundles (41.4.x, 42.1.x) —
  the settings service and the storefront version are coupled.
- `Direct Ship Warehouse` is an **unvalidated external key**.
- Discount-code settings impose **three-condition validity contracts** on records in another screen
  (Sales Discount Settings), with no stated enforcement.

**Dependencies.** API Control Settings (`SCS-007`) — near-duplicate settings for the eBridge channel;
Sales Discount Settings; Warehouse/Store Location Settings (`Allow OBP Payments`, Credit Card page);
Payment Card and Device Settings (Shift4, Token Sharing) — position 53, part B; Point of Sale Control
Settings (delivery/pickup status defaults); Sales Tax Settings and Alternate Tax Interface (`SCS-006`);
Advanced Product Settings (`Direct Ship Quantity`, Related Inventory Formations); Collection Settings
(`Web Benefits`); Cash Balancing Control Settings (`SCS-012`) — eSTORIS drawer/cashier and
Pre-Authorization; `CFG-SO-AUTOCREATE` **[REUSE]**; Report Builder (`S$EstorisOrderTax`,
`S$EstorisInvoiceTax`).

**Build notes.**
- New IDs: `CFG-ESTORIS-AVAILSCOPE`, `CFG-ESTORIS-ONDISPLAYLOCS`, `CFG-ESTORIS-ONDISPLAYREASONS`,
  `CFG-ESTORIS-DIRECTSHIPWH` **[GUARDED]**, `CFG-ESTORIS-WEBMISCPAYTYPE` (locked),
  `CFG-ESTORIS-UNDERTAXPAYTYPE`, `CFG-ESTORIS-FINANCEPAYTYPE`, `CFG-ESTORIS-PARCELROUTE`,
  `CFG-ESTORIS-LOCALPARCELONLY`, `CFG-ESTORIS-DELIVSTATUS`, `CFG-ESTORIS-PICKUPSTATUS`,
  `CFG-ESTORIS-PADDAYS-*`, `CFG-ESTORIS-SCHEDONCREDITHOLD`, `CFG-ESTORIS-CFALOCATIONONLY`,
  `CFG-ESTORIS-RELATED-COLLECTIONS`, `CFG-ESTORIS-RELATED-FORMATIONS`,
  `CFG-ESTORIS-ACCEPTALLOOS`, `CFG-ESTORIS-SALESPERSON`, `CFG-ESTORIS-AUTOPO`,
  `CFG-ESTORIS-ORDERSOURCE`, `CFG-ESTORIS-ALLOCDISCOUNTCODE`, `CFG-ESTORIS-LINEDISCOUNTCODE`,
  `CFG-ESTORIS-YOTPORETRIES`, `CFG-ESTORIS-OBPHOMESTORE`.
- **Merge the two web channels.** `SCS-007` and `SCS-033` duplicate roughly fifteen settings with subtly
  different semantics (out-of-stock policy especially). In our ERP there should be **one channel settings
  type, instantiated per channel**, not two divergent screens. This is the single biggest structural
  cleanup available in this half of the section.
- **Do differently — tax differential:** never silently charge more than the site quoted, and never leave a
  balance due on a completed web order. Correct policy: the **site's quoted total is the contract**;
  post any difference to a tax-variance account and raise an exception for finance. Make that one behavior,
  not four configuration-dependent ones.
- **[GUARDED]** `CFG-ESTORIS-DIRECTSHIPWH` must be validated against the storefront's warehouse list before
  save; and changing it after products have synced strands quantities in eSTORIS.
- **[GUARDED]** `CFG-ESTORIS-ALLOCDISCOUNTCODE` / `-LINEDISCOUNTCODE` — enforce the three-condition
  contracts on the referenced discount codes as **validation on save**, and re-validate if the discount
  code itself is later edited. STORIS documents the contract but does not enforce it.
- Model the eSTORIS minimum-version requirements as **capability gates** read from the storefront, not as
  documentation.
- `[DECISION NEEDED]` LA Mattress storefront platform and whether web pricing should record as a
  **discount** (reportable, margin-attributable) or a **price override** (invisible). Strongly prefer
  discount.

### `SCS-034` Event Notification Control
*storis_ref: article 16918023610516*

**Purpose.** Per-event notification configuration: for one selected business event, define **how (and
whether) the customer, the salesperson, and an "other" recipient are notified** — email or SMS — and with
what template.

**Where it lives.** `Notification Control Settings > Data Capture Notifications > Select event within the grid` (see `SCS-050`, part B).

**Fields** *(the same block repeats three times: **Customer**, **Salesperson**, **Other**)*

| Field | Type | Purpose / business rule |
|---|---|---|
| Event | display-only | The event selected from the Data Capture Notifications grid. |
| Method | enum | `None` — recipient is not notified about this event \| `Email` — **"only available if a Notifications Server is available"** \| `Text` — SMS. |
| ELP Form | ref (Enhanced Laser Printing form) | **"The available forms are based on the Major Event selected from the grid."** |
| Subject | text | **"automatically populated with a `%Token%` plug-in"**; may be cleared and replaced. An action button opens the **multi-lingual translation process**. |
| Format | enum | `HTML` \| `PDF`. |
| Body ELP Form | ref (ELP form) | Form used for the email body. |
| Verbiage (Text) | text, **max 160 characters** ("the standard SMS message character limit") | SMS message text. Extra action provides multi-lingual capabilities. |
| Phone *(Other only)* | phone number | "Specify the phone number in which to send text notifications." |

**Available message tokens (identical for all three recipients), quoted exactly:**
`%first name%`, `%last name%`, `%order number%`, `%order date%`, `%order type%`,
`%fulfillment date%`, `%fulfillment method%`, `%completion date%`.

**Behavior & rules.**
- **Repeated hard note, quoted:** "While these settings are associated to Customer Email, they are **active
  regardless of email being the selected as the method** used to the event." — i.e. **the email/text
  template fields stay live even when `Method = None` or `Text`.** The same note is attached to the SMS
  section. This means the templates are *configuration*, and `Method` alone gates delivery.
- **Source copy errors worth flagging:** the `Salesperson` and `Other` sections both describe `Method` as
  "communication with the **customer**", and the `Salesperson`/`Other` email notes both say "associated to
  **Customer** Email". **[CONFLICT]** — documentation copy-paste; the fields are per-recipient.
- Email delivery depends on a **Notifications Server** being present; without it, `Email` is unavailable.
- 160 characters with token expansion is a **hard truncation risk** — the token values are substituted at
  send time and can push the message past the limit.

**Dependencies.** Notification Control Settings (`SCS-050`, part B) — Data Capture Notifications grid and
the event taxonomy ("Major Event"); Enhanced Laser Printing / Forms Designer; Notifications Server;
Notification Text Provider settings in External Communications Settings (`SCS-035`);
Accounts Receivable Control Settings (`SCS-002`) — emailed extended payment receipts require
"Event Notification Control" setup; EDI Control Settings (`SCS-030`) — ASN notifications.

**Build notes.**
- New ID `CFG-NOTIFY-EVENTCONFIG` — a matrix keyed by **(event, recipient_role)** →
  `{method ∈ {NONE, EMAIL, SMS}, email_template, subject, format, sms_body}`.
  Model `recipient_role` as an **extensible list** (`CUSTOMER`, `SALESPERSON`, `OTHER`, and later
  `STORE_MANAGER`, `DELIVERY_TEAM`), not three hard-coded blocks.
- Support **multiple channels per recipient** (email *and* SMS) — the STORIS enum forces a choice, which is
  wrong for, say, a delivery reminder.
- **Token safety:** validate that every token in a template is valid for that event, and **render a preview
  with realistic values**, enforcing the 160-char SMS limit *after* substitution, not before.
- **Compliance:** SMS to customers is TCPA-regulated. We need explicit **consent capture, per-channel
  opt-out, quiet hours, and a suppression list** — none of which appear anywhere in this STORIS screen.
  `[DECISION NEEDED]` — legal review; this is a real gap, not a nice-to-have.
- **[GUARDED]** Enabling a customer-facing notification on a high-frequency event can blast thousands of
  messages. Require a **dry-run count** ("this event fired N times in the last 7 days") before a
  customer-facing method can be switched on.
- Store the rendered message per send, with the template version, for dispute handling.

---

### `SCS-035` External Communications Settings
*storis_ref: article 15186452794644*

**Purpose.** One screen holding the **connection credentials and endpoints for every third-party
integration** — e-signature, identity, delivery, payment gateways, fraud, reputation, digital receipts,
SMS, protection plans, EDI, and vendor catalogs. **This is the system's credential store.**

**Where it lives.** `System Administration > System Tools > External Communications Settings`.
Article carries version selectors **11.0 / 10.8**.
Tabs (as published): **Silanis, White Pages, Circle Graphics, RetailDeck, Server Login, Ensenda,
Tender Retail, U2 Server, Shift-4, Podium, STORIS RMI, Advanced Dispatch Track, Signifyd, Kount,
flexEngage, Notification Text Provider, Montage, Guardsman, Ashley API, EDI, GBS, Phoenix, Extend** — 23 tabs.

**Fields by tab**

| Tab | Field | Type | Purpose / business rule |
|---|---|---|---|
| **Silanis** (e-signature on installment contracts) | API Key | secret | "encoded user ID and password"; equivalent to the Authorization Token. **Requires a Silanis partnership and UniData v7.3.x or higher.** |
| | Authorization Token | secret | **Format is strictly `userID:password`.** |
| | API URL | url | Base Silanis server. |
| **White Pages** (WhitePages Pro API 2.0) | API Key | secret, **up to 50 alphanumeric, no spaces** | Required for all queries; used to track usage. |
| | API URL | url, **unlimited length, no spaces** | Defaults to the WhitePages Pro API 2.0 address; editable. |
| **Circle Graphics** | URL | url | Site accessed to retrieve data. |
| | Access Token | secret | Provided by Circle Graphics. |
| | Customer ID | text | |
| | Web Service Inactivity Timeout (Milliseconds) | int ms | Terminate the web service after this inactivity. |
| **RetailDeck** | URL | url | |
| | Public Key | text | Issued per customer. |
| | Affiliate ID | text | Identifies the customer as a RetailDeck customer. |
| | Billable Account ID | text | Supplied to RetailDeck for accounting. |
| | Version | text | Version of the RetailDeck data set requested. |
| **Server Login** | User ID | text | **RetailDeck** user ID. |
| | Password | secret | **RetailDeck** password. **[CONFLICT] — a tab named generically "Server Login" that in fact holds only RetailDeck credentials.** |
| **Ensenda** (delivery) | Activate Service | bool | **"If the Activate Service field is checked, the remaining fields on this screen are mandatory."** Must be checked to access `Send to Ensenda` on the Actions menu of *Print a Manifest*. |
| | FTP Host Address | text, **max 30** | |
| | User ID | text, **max 40** | |
| | Password | secret, **max 40** | |
| | Default File Name | text, **max 40** | **"For each transmission of manifest data, the transmit process appends the location code, date, and time to the BEGINNING of this default file name."** |
| **Tender Retail** (MCM payment servers) | MCM Server ID | text, **max 30**, unique | "once an identifier is established, it **cannot be deleted**." Recommended short (`MCM1`, `MCM2`). |
| | Description | text, **max 30** | Action button → Description Field - Language Translation Entry. |
| | IP Address | **IPv4 or IPv6** | |
| | IP Port Number | int **1–65535** | |
| | Location(s) | multi-select (locations) | **Hard rule: "Once a location is associated with an MCM server, it cannot be associated with another. You must remove the location from the original server before it can be assigned to a different server."** |
| | Refund Terminal ID | text, **max 30** | Pin pad or MOTO terminal where a refund is processed **when the refund location uses a different server than the original transaction**. |
| | Settlement Type | enum, **default `Terminal Based`** | `Host Based` — STORIS issues no batch-close commands; the acquirer's host closes the batch, produces the report, and funds it. `Terminal Based` — STORIS → Tender Retail → acquirer messages close the batch and release funds; the pin pad must send the close message. **"STORIS skips host based terminals during the settlement process."** With `Terminal Based`, STORIS captures per-pin-pad batch totals and can report them on **Report Error Messages** during EOD. Settlement runs during EOD or on demand. |
| **U2 Server** | Host IP Address | ip | |
| **Shift-4** (legacy UTG) | UTG Server ID | text, **max 30**, unique | "once an identifier is established, it **cannot be deleted**." **These settings are for the Legacy Shift4 configuration; Shift4 Cloud is set up elsewhere.** |
| | Description | text, max 30 | |
| | Server Address or Name | text | |
| | Port Number | int **1–65535** | |
| | CXM External Server URI | url / url:port / ip:port (IPv4 or IPv6) | **Publicly accessible** URI for the UTG server's REST interface. |
| | Location(s) | multi-select | **Unlike Tender Retail, "The same Location can be associated to more than one UTG server."** **[CONFLICT] — two payment-server tabs with opposite location-uniqueness rules.** Removing a location validates that no UTGs and no EMV terminals are attached. |
| | *(grid removal rule)* | — | **A UTG server cannot be deleted while payment terminals reference it; you must exit and remove them in EMV Terminal Settings first.** |
| **Podium** (reputation) | STORIS ID | secret | **STORIS-locked.** Identifies the connection as STORIS-type; distributed via Automatic Updates. |
| | STORIS SECRET | secret | **STORIS-locked.** Access token used to obtain a session token. |
| | Merchant ID | text | Company-wide identifier at Podium. |
| | Sender Email | email | **"must match the email address that Podium has on file for the merchant."** |
| | Podium URI | url | Used **only when `Datafeed URI` is empty**; authenticates with the **Merchant ID**. |
| | Datafeed URI | url, optional | **If populated, takes precedence.** Authenticates by submitting STORIS ID + STORIS Secret to obtain a **per-session token that is destroyed after the session**. |
| | *(licensing)* | — | Requires the **Reputation Management Interface** module and **Podium** submodule licensed and active (Licensing tab, `SCS-038`). |
| **STORIS RMI** (reputation, Birdeye) | STORIS RMI URL | url | **"not validated by STORIS, so it is the responsibility of the user to ensure that the data entered is correct."** |
| | API Key | secret | Same non-validation warning. |
| | Send By Text | bool, **default unchecked** | Checked → **Birdeye** sends SMS; unchecked → email. |
| **Advanced Dispatch Track** | API Code | text, **max 255**, **mandatory**, not validated | |
| | API Key | text, **max 17**, **mandatory**, not validated | "This identifier can be used to allow multiple accounts. If this API Key does not allow multiple accounts, only one account is used." |
| | API URL | text, **max 100**, no spaces, **mandatory**, not validated | **Enter only the server URL; "The API name … is automatically added by STORIS."** |
| **Signifyd** (fraud) | Connection URI | url | |
| | API Key | secret | |
| | Timeout | minutes + seconds | |
| | UTC Offset | signed int **0–24**, **default 0** | **"if there is no operator (+/-) it is assumed that the offset should be ADDED to the UTC."** Examples given: `NY, NY USA -5`; `Houston, TX USA -6`; `San Francisco, CA USA -7`. |
| **Kount** (fraud) | RIS Connection URI | url | Risk tests. |
| | REST Connection URI | url | Checking for updates to orders with holds. |
| | API Key | secret | |
| | Merchant ID | text | |
| | Include Kount Defined Fields | bool | Send User Defined Fields data with a fraud analysis request. |
| **flexEngage** (digital receipts) | User ID | text | **"The User ID, password, and URL are encrypted on the STORIS database."** |
| | Password | secret | |
| | URL | url | **"This URL can be used for testing and live processing."** **[GUARDED — one field for both test and production.]** |
| | Merchant ID | text | |
| | Timeout Setting | int ms | Allowed time for a flexReceipt response. |
| | *(licensing)* | — | Requires **Digital Receipts Interface** active; **"Setup of this tab is permitted even if the Digital Receipts Interface module is not active."** |
| **Notification Text Provider** (SMS) | API URL | url | |
| | API Key | secret | |
| | API Token | secret | "encoded user ID and password". |
| | From Telephone Used by Provider | phone | The "From" number shown to customers. |
| **Montage** (protection plans) | API Key | secret | |
| | Client Secret | secret | |
| | API URL | url | |
| | OAuth Token | secret | "Montage oAuth token for their new auth system." |
| | Vendor Code | ref (vendor) | Vendor associated with the protection plan. |
| **Guardsman** (protection plans) | SFTP Host Address | text | |
| | Public Key | text | Secure transmission key. |
| | User ID | text | |
| | Password | secret | |
| | Retail Number | text | Generated by Guardsman, unique per retailer, used in the protection file. |
| **Ashley API** | API Key | secret | |
| | API URL | url | Used to obtain the Ashley catalog. |
| | Customer Number | text | "the same identification number used to identify the Ashley dealer." |
| | Ship To Number | text | Identifies each Ashley dealer. |
| | Login ID | text | |
| | Password | secret | |
| | Activate Service | bool | Checked → the Ashley catalog load uses the API service; unchecked → **the standard Ashley catalog process** is used. |
| | Custom Cost | bool | **(STORIS-LOCKED FIELD! No Access available, Contact STORIS to change the value of this field)** Enables creation of the **Ashley Custom Cost Formula** (`SCS-008`). **"When selected, a prompt for a password is displayed as this is a locked field and STORIS needs to create the formula."** |
| **EDI** | EDI Provider Name | text | The provider performing EDI communications. |
| | I/O Data Directory Inbound Live | path | **[CONFLICT] — four EDI path fields here overlap `SCS-030`'s `I/O Data Directory Path - Live` / `- Learn`; this screen splits inbound and outbound, the other does not.** |
| | I/O Data Directory Outbound Live | path | |
| | I/O Data Directory Inbound Learn | path | |
| | I/O Data Directory Outbound Learn | path | |
| **GBS** (protection plans) | SFTP Host Address | text | |
| | Public Key | text | |
| | User ID | text | |
| | Password | secret | |
| | Retailer Number | text | Generated by GBS, unique per retailer. |
| | Vendor Code | text, **max 5, required** | **"The code entered must exist in Vendor Settings and have been created in Warranty Settings."** |
| **Phoenix** (protection plans) | SFTP Host Address | text | |
| | Public Key | text | **"This field is only active for Windows operating systems. A CRON process oversees the actual transmission of the file. This key is generated with the first execution of the CRON process."** |
| | User ID | text | |
| | Password | secret | |
| | Dealer Number | numeric, **max 2 characters, required** | Generated by Phoenix A.M.D. |
| | Vendor Code | text, **max 5, required** | Must exist in Vendor Settings; taken from Warranty Settings. |
| | Inventory Formations (Appliances) | list of inventory formations, optional | **Classification rule: a product whose inventory formation is listed here is designated an APPLIANCE and added to the appliance data file; otherwise it is designated FURNITURE and added to the furniture data file. If the list is empty, everything registers as furniture and only a furniture file is created.** **"A product without an associated protection plan is not transmitted. However, 'dummy' free protection plans can be created for items that have zero cost but that should still be covered under a plan."** |
| **Extend** (protection plans) | API URL | url | |
| | Access Token | secret | "each merchant generates their own access token." |
| | Store ID | text | |
| | Vendor Code | ref | Protection plan vendor. |
| | *(save-time validation)* | — | **"Extend's API requires that the customer have an email address on file. … upon saving out of this process, Point of Sale Control Settings will be reviewed to ensure the `Email Address Required` setting is enabled. If not, a warning message is displayed."** — a **cross-screen validation on save**, exactly the pattern our settings service needs. |

**Behavior & rules.**
- **This screen is the single largest concentration of secrets in STORIS**, and most fields are documented
  as plain entry. Only flexEngage is explicitly stated to be encrypted at rest.
- **Repeated "not validated by STORIS" warnings** (STORIS RMI, Advanced Dispatch Track, and by implication
  others) mean a typo produces a silent integration failure.
- **Test/production separation is inconsistent:** EDI has Live/Learn paths; flexEngage explicitly shares one
  URL for testing and live.
- **Referential integrity rules worth copying:** UTG servers and MCM server IDs cannot be deleted once
  created; a UTG cannot be removed while terminals reference it; a location can belong to only one MCM
  server but to many UTG servers.
- Several tabs are usable **before** the corresponding module is licensed (Advanced Dispatch Track,
  flexEngage) — setup-before-license is deliberate.

**Dependencies.** General System Control Settings (`SCS-038`) — Licensing tab for Reputation Management
Interface (+Podium/STORIS RMI submodules), Digital Receipts Interface, EDI Processing;
EMV Terminal Settings; Payment Card and Device Settings (position 53, part B) — Shift4 Cloud, Token Sharing;
Warehouse/Store Location Settings; Vendor Settings and Warranty Settings (protection-plan vendor codes);
EDI Control Settings (`SCS-030`); Event Notification Control (`SCS-034`) and Notification Control Settings
(`SCS-050`); Point of Sale Control Settings (`Email Address Required`); Ashley Custom Cost Formula
(`SCS-008`); Print a Manifest; `EOD-001` (settlement, error reporting).

**Build notes.**
- **Do not reproduce this screen.** Credentials belong in a **secret manager** (per-environment, rotatable,
  write-only, never returned to the UI, never in settings-change audit values). What we keep in the settings
  service is the **non-secret** part: endpoint IDs, feature toggles, timeouts, and mappings, with a
  reference to the secret.
- New non-secret IDs worth registering: `CFG-INT-<PROVIDER>-ENABLED`, `CFG-INT-<PROVIDER>-ENDPOINT`,
  `CFG-INT-<PROVIDER>-TIMEOUT`, plus the genuinely business-meaningful ones:
  `CFG-INT-TENDERRETAIL-SETTLEMENTTYPE`, `CFG-INT-TENDERRETAIL-LOCATIONMAP`,
  `CFG-INT-SHIFT4-LOCATIONMAP`, `CFG-INT-SIGNIFYD-UTCOFFSET`, `CFG-INT-KOUNT-INCLUDEUDF`,
  `CFG-INT-RMI-SENDBYTEXT`, `CFG-INT-ASHLEY-USEAPI`, `CFG-INT-ASHLEY-CUSTOMCOST` (locked),
  `CFG-INT-PHOENIX-APPLIANCEFORMATIONS`, `CFG-INT-<PLAN>-VENDORCODE`.
- **Every endpoint must be environment-scoped** (`dev|staging|prod`) at the platform level, not as separate
  fields on one screen. The flexEngage "one URL for testing and live" pattern is how test receipts get
  emailed to real customers.
- **Validate on save.** Where STORIS says "not validated", we should do a **connection test** and refuse to
  save an unreachable endpoint, or at minimum record a health status the operator can see.
- **Copy the Extend cross-screen validation pattern** (`Email Address Required` must be on) — but make it a
  hard block, not a warning.
- **Copy the referential-integrity rules** for terminal/server relationships; they prevent orphaned payment
  routing.
- **`CFG-INT-SIGNIFYD-UTCOFFSET`** — do not reproduce. Send RFC 3339 timestamps with real offsets; a manual
  0–24 offset field that defaults to "add" is a DST bug waiting to happen.
- **[GUARDED]** Location↔payment-server mappings, settlement type, and any protection-plan vendor code
  change must be blocked while an **open payment batch** exists (settlement in flight) — mis-routing
  settlement moves real money.
- `[DECISION NEEDED]` LA Mattress integration inventory: which of these 23 are actually needed? Likely
  candidates: a payment gateway, a delivery/routing provider, an SMS provider, a review platform, and one
  protection-plan administrator. Everything else is furniture-industry specific and should be dropped
  rather than ported.

### `SCS-036` Financing Control Settings
*storis_ref: article 15186501985172*

**Purpose.** Preferences for the **Finance Receivables (FR)** module — tracking money owed by **third-party
finance companies and credit card companies** — plus online credit application transmission, the
**finance provider queue** (multi-provider application routing), and settlement transmission.

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Financing System Settings > Financing Control Settings`.
Tabs: **Receivables, Transmission, Consumer Application Text**.
**Coverage gap: the article documents Receivables and Transmission only — the `Consumer Application Text`
tab is named but has no field documentation. Flagging as unread content within a read article.**

**Fields — Receivables tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Number of Days History | int days, nullable | Retention of **closed** FR transactions; purged during **End-of-Month**. **Hard rule: "If this field is left blank, history records will be deleted during the next End of Month."** — **blank means delete everything, not keep forever.** **[GUARDED — one of the most dangerous blank-semantics in the section.]** |
| Next Reference Number | int (sequence), nullable | Next reference number when manual adjustments create receivable records; increments after each use. **Blank → operators must enter a reference number manually.** |
| Next Deposit Number | int (sequence), nullable | Auto-assigned deposit numbers. **Blank → manual entry.** |
| Display Customer Name | bool | Checked → customer **name** in the Customer column of grids in *Apply Payments from Finance Provider*, *View Current Financing Activity*, *View Historical Financing Activity*, *Report Daily Financing Payments*. Blank → customer **code**, except on-account transactions which show **`ON ACCNT`**. |
| Default Due Days | int **0–99** | Days from transaction date until the financed amount is due from the finance company; past that it is **past due**. |
| Number of Aging Days | int | Days per aging bucket on the **Trial Balance** report. "Typical entry for this field is 30." |
| Allow Deposits on Stock Mdse | bool | Checked → merchandise type is **not** checked when a financed deposit is entered; the maximum deposit percentage is checked against the **merchandise subtotal**. Blank → **third-party financed deposits are restricted to special-order merchandise only.** Maximum deposit percentage is defined in **Financing Payment Plan Settings**. |
| Months to Retain Registers | int months | Retention of FR register information. **Hard rule: "When using online financing, you must enter 12 or greater in this field. If you enter a number less than 12, a warning message displays and your entry is not accepted."** — a conditional minimum enforced at save. |
| Break On Store in Registers | bool | FR registers (Daily Receipts, Daily Activity, etc.) page-break per store. |
| Tracking Type Reference | enum | **(LOCKED - STORIS access ONLY!)** Which FR transaction types are tracked: `Both` \| `Credit Cards` \| `Finance Providers`. **"This field works in conjunction with the `Track Receivables` flag in the individual Payment Type records."** |
| Multiple Customers Per Finance Account | bool | **(LOCKED - STORIS access ONLY!)** Allow multiple customers on one finance account number. **Verbatim warning: "Important! If you activate this field, it becomes possible for operators to enter invalid finance accounts number for your customers, thus creating a potential for FRAUD. By activating this field, you accept responsibility in the event fraud occurs as a result of this functionality."** **This is the only setting in the whole section where the vendor explicitly disclaims liability.** |
| Use Original Merchant ID for Returns | bool, **default unchecked** | Checked → a finance receivable **return** uses the merchant ID of the **location of the original order**. Unchecked → uses the merchant ID of the **user's logged-in location**. |
| Reinstatement Date | enum | Date used when reinstating closed FR items: `Original Date` \| `System Date`. **With `Original Date`: reinstates at the original posting date only if that date is in an OPEN sales month; if the month is closed, a message offers reinstatement at the current system date or cancellation.** |
| Finance Payment Estimator Defaults — Option 1, 2, 3 | ref (finance plan) ×3 | Default options shown in the Finance Payment Estimator. **Precedence rule: the `Finance Payment Estimator Defaults` in Warehouse/Store Location Settings are checked FIRST; to use these system-level settings, the location-level Option 1/2/3 must be set to `None Selected`.** **"When one or more defaults are set here, all three financing defaults are carried into the Finance Payment Estimator."** **An expired/non-valid plan here produces a warning in the Estimator rather than being filtered out.** |
| Finance Payment Estimator Defaults — Allow Changes | bool ×3 | Checked → the corresponding Option field renders as a **drop-down of all available finance plans**; unchecked → a **static, inactive** field. "These settings can be checked in any combination." |
| **Actions → Close Payment Dates** | action (multi-select of dates) | Blocks **all users** from posting **financing** payments on selected dates from open pay periods. **The system checks the DEPOSIT DATE.** Error on attempt; user must enter an open date or manually open the closed date. **"This field affects only financing payments. To close days for customer payments, use the Accounts Receivable Control Settings."** (`SCS-002` has the mirror-image action.) |

**Note quoted from the source:** "If the `Maximum Deposit Percent` defined in the Financing Payment Plan
Settings is set to **100%**, the system allows the **total invoice amount, including all incidental
charges**, to be paid using a financed deposit."

**Fields — Transmission tab**
*(Hard prerequisite, quoted: "for these fields to affect the system, both the Finance Receivable module and On-Line Financing Approvals feature must be active in the General System Control Settings.")*

| Field | Type | Purpose / business rule |
|---|---|---|
| Next Application Number | text/int (sequence), **max 7 characters**, nullable | **(LOCKED - STORIS access ONLY!)** Auto-generates credit application numbers, incrementing by one **"provided the number has not already been used in the system"**. **Blank → manual entry.** |
| Number of Days Application is Valid | int days | Days after the application date that **approved** finance applications remain valid. **Three interacting rules, quoted:** (1) the Finance Credit Application routine "allows you to process only applications for revolving providers that are **younger than** the number of days entered here and **have not yet been approved**"; (2) if validity is exceeded on an approved application **and** no finance-provider account number is stored on the customer record, a **new application is required**; (3) **"When a customer has an account number for the finance provider stored in the customer record, a new finance credit application is not required and CANNOT be entered."** and **"When a customer has an approved finance application and Number of Days Application is Valid has not been exceeded, a new finance application is not required and CANNOT be entered."** **Does not apply to contract-type providers (Installment or Rent to Own).** |
| Authorization History Retention Days | int days | Retention of authorized finance payments; **End of Day** purges older items. |
| Credit Application History Retention Days | int days | Retention of credit applications and their comments; purged during **the first End-of-Month after expiry**. **To purge sooner, use `FR Credit Application History Purge` in Schedule a Process.** |
| Finance Queue Maximum Approvals | int > 0, nullable | Maximum number of providers that may approve one application when using the finance queue. **Requires the Finance Receivables Application Queue module licensed and active.** **Blank → an application not approved for the full requested amount "is submitted to a provider in ALL TIERS of the queue if necessary."** The queue stops when **any one** of: the full requested amount is approved by one provider; approvals equal `Finance Queue Maximum Approvals`; or providers from **each tier** have received the application. **Verbatim caution: "since each approval can have an impact on a customer's credit score, it is recommended that you limit the number of approvals."** |
| Auto EOD Transmit | bool | Checked → finance settlements process automatically during Generate Daily Reports (EOD). Blank → manual via *Transmit Financing Settlement*. |
| Transmit Applications | bool | Enable electronic transmission of finance applications to providers. |
| Receive Electronic Auths | bool | Enable receipt of electronic authorizations for online finance processing, **including deposits and payments**. |
| Clear Approved and Declined Credit Application Response Data | bool | **Online providers only.** Checked → **purge credit application information once an approve/decline response is received.** **[GUARDED — this destroys the record of the decision inputs; see compliance note.]** |
| Submit Non-Approved Applications to Other Providers in Same Tier | bool, **default unchecked** | Applies when multiple providers share a tier (Finance Application Queue Tier Settings). Checked → if the first provider returns **declined or pending**, or approves **less than the full amount**, the application may go to another provider **in the same tier before moving to the next tier**. Unchecked → move straight to the next tier. Applies to both the Finance Queue and the Finance Application Management process. **"The sequence that the providers receive the application depend first on the TIER RANKING, then the established PERCENTAGE within that tier"** (`Tier` and `Percentage` fields of Finance Application Queue Tier Settings). |
| CFA - Terminate Finance Provider Queue Upon First Approval Received | bool | Customer Facing Applications terminate the provider queue **upon the first approval status for ANY amount** (not just the full amount). **"This setting only affects CFA."** |
| **Actions → Finance Application Queue Tier Settings** | action | Establishes the **global** queue tier table. **"To establish a location or district table, access Finance Application Queue Tier Settings from the STORIS menu."** |

**Behavior & rules.**
- **The finance queue is a credit-shopping engine.** It fans one customer application out across tiers and
  providers until the amount is covered — with the documented side effect of **multiple hard credit
  inquiries**. `Finance Queue Maximum Approvals`, `Submit Non-Approved … Same Tier`, and
  `CFA - Terminate … First Approval` together decide how many inquiries a customer takes. Blank means
  "try every provider in every tier".
- **Blank `Number of Days History` deletes FR history at the next EOM.**
- **Reinstatement is period-aware** — closed sales months force a system-date reinstatement.
- **Two separate "close payment dates" calendars exist** — one here for financing, one in A/R (`SCS-002`).
  **[CONFLICT-adjacent]** — same concept, two implementations, checked against different dates
  (deposit date here, current/entered date there).
- Conditional minimum: `Months to Retain Registers ≥ 12` when online financing is used, **enforced by
  rejecting the entry**.

**Dependencies.** General System Control Settings (`SCS-038`) — Finance Receivable module, On-Line
Financing Approvals, Finance Receivables Application Queue module; Financing Payment Plan Settings
(`Maximum Deposit Percent`); Finance Application Queue Tier Settings (global / location / district,
`Tier`, `Percentage`); Warehouse/Store Location Settings (Finance Payment Estimator Defaults, merchant IDs);
Payment Type records (`Track Receivables`); Accounts Receivable Control Settings (`SCS-002`) —
customer-payment date closing; Credit Application Control Settings (`SCS-017`);
eSTORIS Control Settings (`SCS-033`) — `Finance Payment Type`; Schedule a Process
(`FR Credit Application History Purge`); `EOD-001`; End-of-Month.

**Build notes.**
- New IDs: `CFG-FR-HISTORYDAYS` **[GUARDED]**, `CFG-FR-NEXTREFNUM`, `CFG-FR-NEXTDEPOSITNUM`,
  `CFG-FR-DISPLAYCUSTNAME`, `CFG-FR-DEFAULTDUEDAYS`, `CFG-FR-AGINGDAYS`,
  `CFG-FR-ALLOWSTOCKDEPOSITS`, `CFG-FR-REGISTERMONTHS`, `CFG-FR-BREAKONSTORE`,
  `CFG-FR-TRACKINGTYPE` (locked), `CFG-FR-MULTICUSTPERACCOUNT` (locked) **[GUARDED]**,
  `CFG-FR-RETURNMERCHANTID`, `CFG-FR-REINSTATEDATE`, `CFG-FR-ESTIMATOROPTION[1..3]`,
  `CFG-FR-ESTIMATORALLOWCHANGE[1..3]`, `CFG-FR-CLOSEDPAYMENTDATES`,
  `CFG-FR-NEXTAPPNUM` (locked), `CFG-FR-APPVALIDDAYS`, `CFG-FR-AUTHHISTORYDAYS`,
  `CFG-FR-CREDAPPHISTORYDAYS`, `CFG-FR-QUEUEMAXAPPROVALS`, `CFG-FR-AUTOEODTRANSMIT`,
  `CFG-FR-TRANSMITAPPS`, `CFG-FR-RECEIVEAUTHS`, `CFG-FR-CLEARRESPONSEDATA` **[GUARDED]**,
  `CFG-FR-SAMETIERRESUBMIT`, `CFG-FR-CFATERMINATEONFIRSTAPPROVAL`,
  `CFG-FR-QUEUETIERS` (global/district/location scoped).
- **Guarded changes:**
  - `CFG-FR-HISTORYDAYS` — **never allow blank to mean "purge all".** Require an explicit value with a
    compliance floor; blank must mean "retain indefinitely" or be disallowed.
  - `CFG-FR-CLEARRESPONSEDATA` — purging application response data destroys the evidence behind an adverse
    action. **Recommend we do not implement this at all.**
  - `CFG-FR-MULTICUSTPERACCOUNT` — the vendor's own fraud warning is sufficient reason to omit it. If it
    must exist, gate it behind a permission, log every use, and require a reason code.
  - `CFG-FR-QUEUEMAXAPPROVALS` blank — treat blank as **1**, never as "all providers, all tiers".
- **Do differently — unify the two payment-date calendars.** One `posting_calendar` service with a
  `payment_class` dimension (`CUSTOMER`, `FINANCING`), one date basis defined explicitly per class.
- **Do differently:** filter expired finance plans out of the Estimator defaults rather than warning at
  point of use.
- **Compliance:** multiple provider submissions = multiple credit inquiries. ECOA/FCRA adverse-action
  notices are required per declining provider. Our implementation must **record every provider submission,
  response, and amount**, and must retain them. `[DECISION NEEDED]` — legal review.
- **Coverage gap to close:** the `Consumer Application Text` tab. Given `SCS-031`'s ECA receipt text and
  `SCS-017`'s letters, expect legally-significant disclosure text there — treat as **versioned legal
  content** when documented.
- `[DECISION NEEDED]` LA Mattress: this module (tracking money owed *by* finance companies, settlement
  transmission, and a multi-provider waterfall) is **very likely in scope** — it is how Synchrony/Acima/
  Progressive receivables get reconciled. Prioritize it above the in-house A/R screens.

### `SCS-037` General Ledger Control Settings
*storis_ref: article 15186501980436*

**Purpose.** Defines the **shape of the GL account number** (company / root account / sub-account / cost
centre, with masks and lengths), the fallback defaults used when no account can be resolved, GL history
retention, multi-company due-to/due-from posting mode, and the EOD posted-transactions report.

**Where it lives.** Two paths:
`System Administration > System Settings > Accounting System Settings > General Ledger System Settings > GL Control Settings`
and `Accounting > Settings > Control Settings > General Ledger Control Settings`.
Tabs: **General, Advanced** (Advanced applies to **STORIS General Ledger Processing only**).

**Account resolution hierarchy, quoted:** "When you enter information, the system searches each level of the
hierarchy structure for an account number. If the system finds no account number in the previous hierarchy
levels (for example, **the Product Category file**), it uses the appropriate **default module settings**. If
the system finds no account number at any of these levels, it uses the **`GL Account Number Default`** on
the General tab of this control file." The same cascade applies to **cost centres**, ending at the
**default cost center**.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Next GL Batch Number | int (sequence) | **(LOCKED Field – STORIS access only!)** Next sequential GL Posting Batch Number. |
| GL Account Number Separator | char | **(LOCKED Field – STORIS access only!)** Delimiter between GL account and cost centre. **Hard rule: "If using the STORIS Accounting Interface AND the FGII reporting module, you must enter a dash (`-`) into this field."** |
| GL Account Number Default | ref (GL account) | Last-resort account "for postings in which the correct account number cannot be established, for example in the case of a missing default account number." **This is the account that silently absorbs every misconfiguration in the system.** |
| Company Code Length | int **2–4**, **mandatory, default 2** | **(LOCKED Field – STORIS access only!)** Maximum length of the company number field **throughout STORIS**. |
| Cost Center Length | int, **max 4** | **(LOCKED - STORIS access ONLY!)** Length of the cost centre element. **"if a user enters a cost center whose length is less than the value specified here, the system ZERO-FILLS GL cost centers to match this length."** |
| General Cost Center Indicator | ref (cost centre) | **(LOCKED - STORIS access ONLY!)** System-wide cost centre for accounts that are **not** cost-centre-specific (e.g. many AP accounts), "since STORIS requires a cost center for ALL accounts". **Must already exist in General Ledger Cost Center Settings.** **"If using Third-Party Accounting, when transferring data to the third-party accounting package, the system replaces the general cost center indicator you enter here with a NULL account number (that is, no account number)."** |
| Maintain History Years | int, **max 99** | Years of GL history retained before purge. Referenced by the `End Year` field of the **Purge GL Data** routine. **Hard rule: "To purge all GL data except the current fiscal year, enter `0`."** — **`0` is maximum destruction, not "keep nothing extra".** "the more data you retain in the system, the more likely system performance may slow down." **[GUARDED]** |
| Create Posting Document Comments | bool | Generate document comments for GL postings; **the comment includes the GL batch number.** |
| Post GL Account Transfers | enum | Multi-company due-to/due-from mode, applicable with **three or more companies**: `By Individual Company` — **the `Multi-Company Due From` and `To` fields in General Ledger Assigned Account Settings are NOT used, and the `Multi-Company Transfer` field in Company Settings becomes MANDATORY**; `Globally` — process multi-company postings using the Due From/To fields in General Ledger Assigned Account Settings. |

**Fields — Advanced tab (STORIS GL Processing only)**

**Account structure, quoted:** GL account numbers have three basic elements — **company**, **parent account**,
**cost center**. The parent account may be split into **root** and **sub-account**.
**"The combined length may not exceed 16 characters. The maximum length of the entire account number is 21
characters, including the Cost Center (maximum of 4 characters)."**
**"The Company element mask is always two numeric characters, zero-filled."**
**"the prompts for the Company, Root Account, Sub-Account and Cost Center element prompt labels are NOT
user-defined."**

| Field | Type | Purpose / business rule |
|---|---|---|
| Root Account Mask | mask string, **mandatory** | Validates the **root account element only** (not the whole account). Characters: **`A` - alpha; `N` - numeric; `X` - alphanumeric (A-Z, 0-9)**. Used when building accounts via **GL Account Maintenance**. **Hard rule: "If using sub-accounts, the combination of both masks may not exceed 14 characters (16 characters less 1 character for the sub-account delimiter and at least 1 character for the sub-account)."** |
| Use Sub-Accounts | bool | **STORIS-locked.** Splits the account element into root + sub-account and activates the sub-account fields. |
| Sub-Account Mask | mask string, **mandatory** | **STORIS-locked.** Same `A`/`N`/`X` alphabet. Used by **GL Sub-Account Maintenance**. **"When specifying GL account numbers for posting purposes, the system validates against the list of valid sub-accounts defined for the specified GL account."** |
| General Sub-Account Indicator | ref (sub-account), **required** | Default sub-account "when sub-accounts are not appropriate for certain root accounts". **Must be a valid, existing GL sub-account.** |
| End-of-Day Posted Transactions | enum | Behavior of *Report Posted Transactions* during EOD: `Report All`; `Report Manual Only` (manually-generated postings only); `No Report` — **suppresses the report but GL Post Register records still generate and remain available for the on-demand report**; `Suppress Register Build` — **suppresses both the report AND the generation of GL Post Register records.** |
| Allow Reopen Years | int | Number of **closed years** that may be re-opened for postings. **`0` → no closed year can be re-opened.** **[GUARDED — this is the control that decides whether prior-year financials can be altered.]** |

**Behavior & rules.**
- **Length arithmetic is exact and load-bearing:** company (2, fixed) + parent account (≤ 16, or root +
  delimiter + sub-account ≤ 14 of mask characters) + cost centre (≤ 4) ≤ **21 characters total**.
- **Zero-filling of cost centres** means `12` and `0012` are the same cost centre — relevant for any
  external system that does not zero-fill.
- **`Suppress Register Build` destroys the audit trail**, not just the report. It is one enum value away
  from `No Report`, which preserves it.
- **`Maintain History Years = 0` purges everything but the current fiscal year.**
- Third-Party Accounting **rewrites the general cost centre to null** on export — so the internal and
  exported representations differ.

**Dependencies.** General Ledger Assigned Account Settings (referenced by `SCS-002`, `SCS-006`, `SCS-016`
for A/R Adjustments, Repossession Sales/Cost of Sales, Landed Freight & Add-On 1–4 Liability, Inventory
Adjustment, RTV Valuation Difference, Tax Adjustment, Multi-Company Due From/To);
General Ledger Cost Center Settings; Company Settings (`Multi-Company Transfer`); Product Category file;
GL Account Maintenance; GL Sub-Account Maintenance; Purge GL Data; STORIS Accounting Interface + FGII;
Third-Party Accounting; Costing Control Settings (`SCS-016`); `EOD-001`.

**Build notes.**
- New IDs: `CFG-GL-NEXTBATCHNUM` (locked, monotonic), `CFG-GL-SEPARATOR` (locked) **[GUARDED]**,
  `CFG-GL-DEFAULTACCOUNT`, `CFG-GL-COMPANYCODELENGTH` (locked) **[GUARDED]**,
  `CFG-GL-COSTCENTERLENGTH` (locked) **[GUARDED]**, `CFG-GL-GENERALCOSTCENTER` (locked),
  `CFG-GL-HISTORYYEARS` **[GUARDED]**, `CFG-GL-POSTINGCOMMENTS`, `CFG-GL-MULTICOTRANSFERMODE`,
  `CFG-GL-ROOTMASK` **[GUARDED]**, `CFG-GL-USESUBACCOUNTS` (locked) **[GUARDED]**,
  `CFG-GL-SUBMASK` (locked) **[GUARDED]**, `CFG-GL-GENERALSUBACCOUNT`,
  `CFG-GL-EODPOSTEDTXNMODE`, `CFG-GL-ALLOWREOPENYEARS` **[GUARDED]**.
- **These are the strictest guarded changes in the entire section.** Account structure settings
  (`SEPARATOR`, `COMPANYCODELENGTH`, `COSTCENTERLENGTH`, `ROOTMASK`, `SUBMASK`, `USESUBACCOUNTS`) **must be
  immutable once any GL account exists**, or changing them requires a full, previewed, reversible migration
  of every account, every posting, and every external mapping. Treat them as **install-time schema**, not
  runtime settings. This is the clearest case in the section for a settings class that is
  "set once at implementation, then frozen".
- `CFG-GL-ALLOWREOPENYEARS` should additionally be **permission-gated and audited per reopen**, with the
  reopen event itself recorded — SOX-style controls.
- **Do differently:** remove `Suppress Register Build`. Never offer an option that stops writing the
  posting audit trail.
- **Do differently:** the "silently post to the default account when nothing resolves" pattern hides
  configuration errors in the financials. Post to a **clearly-named suspense account** and raise a
  **blocking exception** with the resolution path that failed. Reuse the `CHECK_LEVEL` type from `SCS-013`
  for the escalation.
- Our resolver's scope chain must be extended for GL: **`PRODUCT_CATEGORY → module default → SYSTEM
  default`**, and the same for cost centre. Record the resolved level on every posting so the source of an
  account is auditable.
- `[DECISION NEEDED]` LA Mattress chart-of-accounts shape: company / root / sub / cost-centre lengths and
  masks. Decide **before** any GL data exists, with the ERP's own accounting owner and whatever external
  accounting package (if any) has to consume it. Note the 21-character total ceiling is a STORIS
  limitation we need not inherit.

### `SCS-038` General System Control Settings
*storis_ref: article 15186501982740*

**Purpose.** The global system settings screen: branding, company/currency defaults, report retention,
on-the-fly record creation, EOD scheduling and file save, time zone handling, **all authentication and
session security**, **field-level database encryption**, **module licensing and activation**, regional
restrictions, comm-server paths, and data-import tokens. **Together with `SCS-016` and `SCS-037`, this is
one of the three highest-stakes screens in the section — and it is the licensing gate that most other
articles refer back to.**

**Where it lives.** The article's Access path is published as
`System Administration > System Settings > Accounting System Settings > General Ledger System Settings > General Ledger > General Ledger Control Settings`
— **[CONFLICT] this is plainly the wrong path (it is `SCS-037`'s path); every other article refers to this
screen as `General System Control Settings` with an `Active Add-Ons` and `Licensing` tab.**
Tabs: **General, Security, Licensing, Miscellaneous** — note that other articles also reference an
**`Active Add-Ons`** tab on this screen (`SCS-010`, `SCS-011`, `SCS-030`), which is **not among the four
tabs listed here**. **[CONFLICT / coverage gap — the Active Add-Ons tab is referenced by at least three
other articles but not documented in this one.]**
"Most of the options on this screen are activated by your STORIS representative … NOTE: Some system control
file fields are accessible by STORIS personnel only."
**Undocumented behavior, quoted: "Log files are active and retained for a period of 5 days until
automatically turned off by Generate Daily Reports (End of Day process) and purged. This amount of time can
be manually changed only by STORIS. There is no setting displayed for this function."**

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Terminal Mode Screen Title | text, **max 40 alphanumeric** | CRT logo at the top of character-based STORIS screens. |
| Report Displayed/Print Title | text, **max 60 alphanumeric** | Header text on STORIS reports. |
| Font for PDF Reports | enum (font), **default `Lucida Sans Typewriter`** | |
| Default Company Number | text, **standard `01`** | **(LOCKED - STORIS access ONLY!)** Default company for all processing. |
| Home Currency | country code, **default `USA`** | Domestic currency. **Hard rule: "Non-inventory products cannot be assigned to foreign vendors. If this field is set to a country other than the domestic country, an error is received when creating a non-inventory product."** |
| Report Retention Days | int **0–9999**, nullable | Used by **Purge Review Print Jobs** and **Purge Review Archive Reports** during EOD. **Null → no purge is performed — "This is not recommended, nor is a large number of days recommended, due to the size of some print jobs and reports."** (Field is also referred to as `Report Archive Retention Days` in its own description — **[CONFLICT]**, two names.) |
| Include Legend on Reports | bool | Adds a page showing the run-time options selected for the report. |
| Print Company Header | bool | Checked → print company details from the **Company File** record onto the STORIS Universal Form; blank → assumes pre-printed forms. |
| On-The-Fly Maintenance | bool, **delivered active** | Allows creating records directly from entry routines. **Hard rule: "once you inactivate the On-the-Fly feature, you must contact STORIS to re-activate it."** When active, Day-Ending generates **Report Files Created via Entry Processes**. **Exact scope, quoted:** `Product` — Enter a Stock Adjustment, Twilight Inventory Adjustments, Create an As-Is Kit (kit master products only); `Vendor` — Enter a Purchase Order (General tab), Enter/Update Individual Vendor Invoice (AP Bill Entry); `Brand` — Vendor Settings (vendor creation); `Zip Code` — any routine in which a zip code can be entered. |
| EOD Completion Email Address | email, optional | Notifies an individual when EOD **begins** and when it **completes**. **"You must use an external email address; you cannot use STORIS Messenger."** **Requires `STORIS Server Can Send Emails` enabled in Notifications Control Settings.** |
| File Save with Scheduled EOD | bool | Scheduled EOD runs a file save (backup). |
| File Save Storage Device | enum (device) | **Inactive on Windows NT®.** |
| Eject Tape on AIX Server | bool | Auto-eject the EOD file-save tape on AIX. |
| Maximum Scheduled Processes | int **1–999** | Maximum concurrent scheduled processes. |
| Auto Start Process Scheduler Phantom | bool | Checked → STORIS checks at login and on return to the menu whether the scheduler phantom is running, and starts it if not. Blank → **the scheduler does not auto-launch.** |
| Auto Start FR CFA Phantom | bool | Auto-start the FR CFA phantom at login. **Only runs when the Finance Queue is active and at least one warehouse location uses the Finance Application Manager.** Blank → **the phantom runs and processes all pending transactions when the next credit application is created** (i.e. deferred, not never). |
| Additional "Logto" Account Name | text, **case-sensitive** | Target account for *Log to Additional Account* (System Permissions menu) — used to switch between **LIVE and LEARN**. **"Remember to edit the corresponding field in your destination account so you can log back."** |
| Cloud Service (SaaS) Time Zone | enum | `EST` (account and server both U.S. Eastern) \| `CST` (account Central, server Eastern) \| `MST` (account Mountain, server Eastern) \| `PST` (account Pacific, server Eastern) \| `OTH - Other` (**"The `Offset Cloud Server by ___ Hours` setting MUST be used with this option"**). **Note the four named options all assume an Eastern server.** |
| Ignore Daylight Savings | bool | Checked → no DST adjustment. **Hard constraints, quoted: "Accounts in time zones that observe daylight savings must be hosted on servers in time zones that observe the same daylight savings time change schedule"** (Cuba vs U.S. DST start times given as the example) **"Additionally, a server in a time zone that does not observe daylight savings cannot host any accounts that are in time zones that do observe daylight savings."** |
| Offset Cloud Server by ___ Hours | signed int hours | **Active only when SaaS Time Zone = `Other`.** **Exact formula, quoted: `(Account standard UTC offset - server standard UTC offset) * -1 = Offset Hours`, and the calculation "must always use the 'Standard' UTC +/- time … not a daylight savings time UTC offset."** Worked examples: PST account (UTC−8) on MST server (UTC−7) → `1`; MST on MST → `0`; CST (UTC−6) on MST (UTC−7) → `−1`; AST (UTC−4) on EST (UTC−5) → `−1`. **"Minute settings are not currently supported."** |
| **Actions → System Notifications** | action | |

**Fields — Security tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| System Admin ID | ref (STORIS User ID) | Designated system administrator; used during initial installation to permit access to the **System Settings Wizard** (an internal STORIS process). |
| User ID at Login | bool | Require a User ID at the log-in screen. **Hard rule: "If you leave this box blank, you cannot activate Extended Security."** and **"To use the Complex Passwords feature, you must check the box at this field."** |
| Extended Security | bool | Enables per-program/process access restriction via User settings **and requires a password at login**. **Cannot be edited unless `User ID at Login` is checked.** **Turning it off "renders all the Extended Security fields in the User and User Group settings inactive (although each field RETAINS its setting in the event you want to reactivate)."** **[GUARDED — a single checkbox that disables the entire per-user permission system while silently preserving the settings, so nothing looks wrong.]** |
| Use Active Directory Authentication | bool + `Server` + `Port` (**default 80**) + `Certificate Name` | Authenticate STORIS logins against Windows® Active Directory. **"The user's username and password for both Windows® and STORIS must be the same."** Global; per-user exclusion via `Exempt from Active Directory Authentication` (Security tab of Create a User). **"This setting is not available for SaaS or Cloud servers."** Multi-server: "STORIS recommends using networking hardware to perform load-balancing … and to provide a single target address." |
| Report Builder Security | bool | Enables Report Builder security. **"This field does not affect the `Access` field in the Create a Report routine."** |
| Complex Passwords | bool | **(STORIS locked field)** **Requires both `User ID at Login` and `Extended Security` active.** |
| Password Expires After | int **10–99** days, nullable | **Blank → passwords never expire.** **"If using the Complex Passwords feature, we recommend you set this field to 90 to comply with the PCI maximum."** Behavior: on the expiry day a warning appears and the user **may proceed without changing**; from **day N+1** the password is expired and a change is **required** before login completes. |
| Menu Timeout After | minutes (**≤ 99**) + seconds (**≤ 59**) | Menus and non-updating programs time out to the **User Log In Screen**. Works with `Menu Timeout Active` in User Group settings. |
| Report Error Messages *(menu timeout)* | bool | Include the menu-timeout alert (**error code 42**) in Report Error Messages. Visible by selecting `All` or `40 Alert message` in the Enter Error Code field. |
| Login Timeout After | minutes (**≤ 99**) + seconds (**≤ 59**), optional | The **User Log In Screen** times out to the **operating system**. **"the `Menu Timeout Active` field in the Create a User Group routine does not affect this field."** |
| Report Error Messages *(login timeout)* | bool | Include the login-timeout alert (**error code 41**) in Report Error Messages. **[CONFLICT] — two distinct fields with the identical label `Report Error Messages` on one tab.** |
| Timeout Notification | minutes + seconds | Lead time between the warning and the logout. **Worked example, quoted: "if `Menu Timeout After` is set for 10 minutes and `Timeout Notifications` is set for 4 minutes, the session will detect inactivity and after 6 minutes, the user is notified of the impending timeout. 4 minutes later, the session will be terminated."** |
| Encrypt Credit Application | bool, **default checked** | Field-level encryption of credit application data. |
| Encrypt Credit Scores | bool, **default checked** | |
| Encrypt Date of Birth | bool, **default checked** | |
| Encrypt Driver's License Numbers | bool, **default checked** | |
| Encrypt Social Security Numbers | bool, **default checked** | Covers credit customers, co-applicants, and co-signers. |
| Document Archive Mask PII | bool, **default checked** | Masks PII when archiving documents. **Exact masking formats, quoted: date of birth `MM/DD/YYYY` → `xx/xx/xxxx`; driver's license — all but the last four characters, e.g. `M320-540-227-0` → `xxxxxxxxxx27-0`; SSN `123-45-6789` → `xxx-xx-6789`.** Empty source fields appear empty. **"This setting does not affect masking of printed documents containing PII; that is controlled via Create a User/Group Actions - Personal Information Security."** |

**Encryption change procedure (quoted, and important):** the five encryption settings "can only be changed
if you have permission via your user/user group system security setting, **`Modify General System Control
Settings data encryption`**. After each option is checked or unchecked **a user security login request is
shown. The user must enter their User ID and password, or obtain an override from another user with
permission to proceed.** If you **uncheck** any of the boxes, **the encrypted data is converted to decrypted
via a phantom process (`SYS.ENCRYPT.DECRYPT.PTM`)** … "The process of encrypting/decrypting data can take a
significant amount of time. It is recommended that if this process is required, you run it when there are no
other users on the system."
**This is the single most consequential guarded change in the section: one checkbox bulk-decrypts every SSN
in the database.**

**Fields — Licensing tab** *(all display-only, set by STORIS)*

| Field | Type | Purpose / business rule |
|---|---|---|
| Licensed Client ID | display-only | |
| Licensing Expires | display-only date | |
| Licensed Users | display-only int | |
| AWM Sites | display-only int | Active AWM site licences. **Referenced when verifying activation of Advanced Warehouse Management for a location on the Barcode tab of Warehouse/Store Location Settings.** |
| AWM Putaway Sites | display-only int | Locations licensed for **Directed Putaway** (a separately purchased companion application). Referenced when verifying `Directed Putaways (by Volume, for a location)`. |
| WMS Sites | display-only int | Site licences for WMS; referenced when verifying **RF Picking** for a location. |
| Barcode Sites | display-only int | Site licences for warehouse-management barcode; referenced when verifying **Barcode** for a location. |
| Activation grid — `Active` | bool per module | **Hard rule: editable only on a NON-LIVE account (e.g. LEARN). "If you access this screen while logged in to your LIVE (production) account, these check boxes are STORIS locked and require a password to change the status."** |
| Activation grid — `Module` | display-only | |
| Activation grid — `Licensed` | display-only `Yes`/`No` | Attempting to activate an unlicensed module raises an error. |
| Activation grid — `Number` | display-only | "For future use." |
| Activation grid — `Submodules` | button | Lists submodules of a parent module (e.g. the API module's eBridge Commerce submodule per `SCS-007`; Reputation Management Interface → Podium / STORIS RMI per `SCS-035`). |

**Fields — Miscellaneous tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Multi-Company Processing | bool | **(LOCKED - STORIS access ONLY!)** Indicates Multi-Company Processing is active. Drives `SCS-022` (check bank hierarchy) and `SCS-037` (`Post GL Account Transfers`). |
| Regional Processing | bool (display of licence state) | **"You cannot activate the module using this field; activation and licensing of Regional Processing must be performed on the Licensing tab."** When active, the four Restrictions fields below become available. |
| Restrictions — Customer Lookup | bool | Restrict customer lookups along regional lines. Blank → all customers selectable. |
| Restrictions — Inter-Region Stock Transfers | bool | Prevent **manual** stock transfers crossing regions. **"this setting overrides all attempts to create inter-regional transfers, EVEN IF THE USER HAS FULL AND UNRESTRICTED ACCESS."** |
| Restrictions — Inter-Region Auto-Transfers | bool | Prevent **automatic** transfers crossing regions. **Hard rule: "The Inter-Regional Auto-Transfers feature OVERRIDES this setting. However, if that feature is not active, this setting overrides all attempts … even if the user has full and unrestricted access."** **[CONFLICT — confirms the override noted in `SCS-009`.]** |
| Restrictions — Product Use/Lookup | bool | Restrict product use by the regions set at `Limit Use By Region` in Advanced Product Settings. |
| Product IDs Starting with Zero | bool | **(LOCKED - STORIS access ONLY!)** Allow product IDs to begin with `0`. (Relevant to `SCS-003`'s zero-padding.) |
| Only Complete Product on Ship Ticket | bool | **(LOCKED - STORIS access ONLY!)** Checked → **only items on the ship ticket are completed**; other items on the order are **reserved** after completion of the ticket items. Blank → **all items including newly reserved ones are completed.** |
| 'Alternate' English same as 'English' | bool | **(LOCKED - STORIS access ONLY!)** With this checked and a user's Language Code = **`4` (Alternate)**, an untranslated item falls back to the English version. **Unchecked → "the item is NOT FOUND when searching."** |
| Skip EDI Data Encryption | bool | Skip EDI data encryption. **[GUARDED — a plain "turn off encryption" switch with no stated justification.]** |
| Use Expanded Customer Address | bool, **default unchecked** | Expands `Address Line 1`/`Address Line 2` to **60 characters** and `City` to **45 characters** on: Advanced Customer Settings; Co-Applicant Name and Address Maintenance; Credit Application Entry (address in header only); Credit Application Entry - Co-applicant (header only); Customer Settings; Design Enhanced Laser Forms; Enter a Customer Payment/Refund/Gift Certificate; Individual Zip Codes (city field only); Request Credit Information; Shipping Information Window - Order Entry; Update Co-Applicant Personal Information; Update a Customer Address; Update a Customer/Co-applicant Shipping Address. **"If importing data using the expanded number of characters while setting is unchecked, the TRUNCATED number of characters appear in STORIS."** and **"If a long address is used, some reports and/or views may cut off the full address."** |
| File Redirect *(+ `Redirect` TEST button)* | path | Communications-server redirection path (STORIS server → shared folder on the Comm server). **Rationale quoted: activating it "helps protect your data in the event of a network failure, and assists in PCI compliance."** |
| SCiX AU Deployment *(+ `Deployment` TEST button)* | path + bool | Deployment server path; enables **Automatic Updates** to push SCI and Help updates to the Comm server for workstation self-update. **"distinct from the Automatic Updates process that sends program updates to your STORIS server."** |
| Bassett XML Catalog *(+ `XML Catalog` TEST button)* | path | Maps a network drive to the catalog XML file so *Import External Data* need not load it through the comm server — a load-speed optimization. |
| End of Day AIX Back Up *(+ `AIX Backup` TEST button)* | path or **multiple absolute paths** (Multiple Path Entry window) | Path(s) backed up during EOD. |
| Column Calculation Indicator | text token, **default `<+>`** | Placed in a spreadsheet column to have the import **generate/calculate** the value. Exact behaviors: **Product** — in the `Product` column, the product code is auto-generated; **Purchase Order Header** — in the `Purchase Order Number` column with a value in `Document Reference` (**required when the symbol is used**), the Document Reference becomes the PO number; **Purchase Order Item** — same PO-number behavior, plus in the `Unit Cost` column the **costing routine derives the unit cost**, and in the `Discount Codes` column the **discount routine determines discounts from the discount table**; **Vendor Remit To** — in the `Payable Remittance ID` column, the ID is auto-generated. |
| Clear Data/Field Indicator | text token, **default `<&>`** | Placed in a spreadsheet column to **clear** existing data (product, vendor remit-to, vendor ship-from imports). **"If a column in the spreadsheet is highlighted in blue, the symbol in this field can be entered into that column to clear the data following initial data creation."** **"This indicator must be set for the selling price to be removed from the specified districts in the `District` column of the District and Regional import process."** |
| Multiple Value Indicator | text delimiter, **default `<space>` when blank** | Delimits multiple values in import spreadsheets. **"A combination of delimiters are not allowed; the delimiter is either the value in this field or a space."** |
| Days Retain Import Errors | int **0–999** | Retention of conversion errors before purge. |
| Days Retain Interface Queue (`Processed` and `Failed`) | int **0–999** each, **default 30** | **`0` → deleted immediately after processing; `999` → never deleted.** Purged via **Schedule a Process**. **[CONFLICT-adjacent — identical `0`/`999` sentinel convention as `SCS-029`.]** |

**Note quoted:** "Regional restriction by district or region is **not available to Cloud (SaaS) users**.
However, Cloud users can use the **location restriction** feature … and regional/district pricing is
available as well."

**Behavior & rules — the ones that matter most.**
- **Security is a three-link chain with a hard order:** `User ID at Login` → `Extended Security` →
  `Complex Passwords`. Breaking the first link silently disables everything downstream while preserving the
  configuration, so the system *looks* secured.
- **Unchecking any encryption flag bulk-decrypts existing data** via a long-running phantom, gated only by a
  permission plus a re-authentication prompt.
- **Module activation is editable on non-LIVE accounts** — which is right — and password-locked on LIVE.
- **`Skip EDI Data Encryption`** and **`Password Expires After` = blank** are two one-field paths to a
  materially less secure system.
- **Regional restrictions beat user permissions** ("even if the user has full and unrestricted access") —
  except that the Inter-Regional Auto-Transfers *feature* beats the restriction.
- **Time zone handling is entirely manual** (an integer offset, standard-time only, no minutes) and
  constrained by unenforceable hosting rules about DST.

**Dependencies.** Practically everything. Explicitly: Notifications Control Settings
(`STORIS Server Can Send Emails`) → `SCS-050`; Create a User / User Group (Extended Security fields,
`Exempt from Active Directory Authentication`, `Menu Timeout Active`,
`Modify General System Control Settings data encryption`, Personal Information Security);
Warehouse/Store Location Settings (Barcode tab — AWM, Directed Putaway, RF Picking, Barcode activation
against site licence counts); Advanced Product Settings (`Limit Use By Region`); Company File / Company
Settings; General Ledger Control Settings (`SCS-037`); Automatic Transfers (`SCS-009`);
Bar Code Add-On Settings (`SCS-010`) and Bar Code Control Settings (`SCS-011`);
EDI Control Settings (`SCS-030`); API Control Settings (`SCS-007`); Financing Control Settings (`SCS-036`);
D-Tools (`SCS-020`); External Communications Settings (`SCS-035`); Import External Data / Data Import;
Schedule a Process; `EOD-001`.

**Build notes.**
- New IDs (selected): `CFG-SYS-SCREENTITLE`, `CFG-SYS-REPORTTITLE`, `CFG-SYS-PDFFONT`,
  `CFG-SYS-DEFAULTCOMPANY` (locked), `CFG-SYS-HOMECURRENCY`, `CFG-SYS-REPORTRETENTIONDAYS`,
  `CFG-SYS-REPORTLEGEND`, `CFG-SYS-PRINTCOMPANYHEADER`, `CFG-SYS-ONTHEFLY` **[GUARDED]**,
  `CFG-SYS-EODEMAIL`, `CFG-SYS-EODFILESAVE`, `CFG-SYS-FILESAVEDEVICE`, `CFG-SYS-EJECTTAPE`,
  `CFG-SYS-MAXSCHEDPROCESSES`, `CFG-SYS-AUTOSTARTSCHEDULER`, `CFG-SYS-AUTOSTARTCFA`,
  `CFG-SYS-LOGTOACCOUNT`, `CFG-SYS-SAASTIMEZONE`, `CFG-SYS-IGNOREDST`, `CFG-SYS-SERVEROFFSET`;
  `SEC-SYS-ADMINID`, `SEC-SYS-USERIDATLOGIN` **[GUARDED]**, `SEC-SYS-EXTENDEDSECURITY` **[GUARDED]**,
  `SEC-SYS-ADAUTH` (+ server/port/cert), `SEC-SYS-REPORTBUILDERSEC`, `SEC-SYS-COMPLEXPASSWORDS` (locked),
  `SEC-SYS-PASSWORDEXPIREDAYS`, `SEC-SYS-MENUTIMEOUT`, `SEC-SYS-LOGINTIMEOUT`,
  `SEC-SYS-TIMEOUTNOTICE`, `SEC-SYS-ENCRYPT-{CREDAPP,CREDSCORE,DOB,DL,SSN}` **[GUARDED]**,
  `SEC-SYS-ARCHIVEMASKPII`;
  `CFG-LIC-*` (read-only licence facts + per-module activation);
  `CFG-SYS-MULTICOMPANY` (locked), `CFG-SYS-REGIONALPROCESSING`,
  `CFG-SYS-RESTRICT-{CUSTLOOKUP,MANUALXFER,AUTOXFER,PRODUCTUSE}`,
  `CFG-SYS-PRODIDLEADINGZERO` (locked), `CFG-SYS-COMPLETEONLYSHIPTICKET` (locked),
  `CFG-SYS-ALTENGLISHFALLBACK` (locked), `CFG-SYS-SKIPEDIENCRYPTION` **[GUARDED]**,
  `CFG-SYS-EXPANDEDADDRESS`, `CFG-SYS-COMMPATH-*`, `CFG-IMPORT-CALCTOKEN`,
  `CFG-IMPORT-CLEARTOKEN`, `CFG-IMPORT-MULTIVALUEDELIM`, `CFG-IMPORT-ERRORDAYS`,
  `CFG-IMPORT-QUEUEDAYS-{PROCESSED,FAILED}`.
- **Do differently — security posture (highest priority in this article):**
  - **There must be no way to turn authentication off.** `User ID at Login` and `Extended Security` should
    not exist as switches. Authentication and per-user authorization are always on.
  - **Encryption of SSN/DOB/DL/credit data must not be a toggle.** Encrypt always; there is no legitimate
    reason to expose a "decrypt the whole database" checkbox, permission-gated or not. Field-level
    encryption belongs to the schema, not to settings.
  - Delete `Skip EDI Data Encryption` entirely.
  - `Password Expires After` blank → disallow, or move authentication to SSO/OIDC and drop password policy
    from the ERP altogether (**recommended**: delegate to an IdP; then AD-style integration, MFA, and
    rotation policy stop being our problem).
- **Do differently — licensing:** module enable/disable is a legitimate settings concept and the
  LIVE-vs-non-LIVE editability rule is good. Keep it, and keep the **site-count licences** pattern
  (`AWM Sites`, `WMS Sites`, `Barcode Sites`) as a **counted capability** the location settings validate
  against — that is a genuinely useful mechanism.
- **Do differently — time zones:** store every timestamp in UTC with a real IANA zone per location
  (`America/Los_Angeles`). Never a manual integer offset, never "standard time only", never a rule that
  couples DST behavior to where the server happens to live.
- **Do differently — the default-catch-all pattern:** `Report Retention Days` null = never purge, and the
  `0`/`999` sentinel convention (also in `SCS-029`) both need replacing with explicit
  `{DISABLED | KEEP_FOREVER | DAYS(n)}` types.
- **Keep:** the **on-the-fly creation audit report** (`Report Files Created via Entry Processes`) — a list
  of every master record created as a side effect of transaction entry is exactly the kind of control that
  keeps master data clean. Also keep the **import calculation/clear tokens** concept, but bind them to a
  named import profile rather than a global string.
- **[GUARDED] summary for this screen:** `SEC-SYS-USERIDATLOGIN`, `SEC-SYS-EXTENDEDSECURITY`, all five
  `SEC-SYS-ENCRYPT-*`, `CFG-SYS-SKIPEDIENCRYPTION`, `CFG-SYS-ONTHEFLY` (one-way — re-enabling requires the
  vendor), `CFG-SYS-DEFAULTCOMPANY`, `CFG-SYS-HOMECURRENCY` (changing it breaks non-inventory product
  creation), module activation on a LIVE account, and `CFG-SYS-EXPANDEDADDRESS` (turning it **off** with
  long addresses already stored silently truncates on next import).
- `[DECISION NEEDED]` Authentication strategy (recommend IdP/SSO), timezone model (recommend IANA + UTC),
  whether LA Mattress is multi-company and/or multi-region, and which "modules" our ERP will gate at all.

### `SCS-039` Hi/Lo Gross Profit Option
*storis_ref: article 15186416971540*

**Purpose.** The full specification of the **Hi/Lo Gross Profit** commission method — the double sliding
scale that converts a sale's margin percentage into a commission percentage. **This article supplies the
formula that `SCS-015` omits.**

**Where it lives.** Selected via the `Calculation Code`; the attributes are **"reserved in the Point of Sale
Control Settings for all sales, customers, and products."**
**[CONFLICT] — `SCS-015` says these same attributes are "reserved in the Sales Order System Control
Settings"; this article says Point of Sale Control Settings. Two articles name two different owning
screens for the same four fields.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Calculation Code | enum | Selects the method (see `SCS-015`). |
| Limit Percent Low (`LL`) | percent | "Minimum profit margin to allow Low Commission rate." |
| Limit Percent High (`HL`) | percent | "Minimum profit margin to allow High Commission rate." |
| Commission Percent Low (`LC`) | percent | "Commission rate for profit margins between the Low and High Limit." |
| Commission Percent High (`HC`) | percent | "Commission rate for profit margins at or exceeding the High Limit." |

**Behavior & rules — the complete piecewise function, quoted verbatim.**
- **"If the margin is 0 or below, the commission percent is 0"**
- **"If the margin is less than or equal to the lower limit, the commission percentage is equal to the low
  commission percentage."**
- **"If the margin is greater than or equal to the higher limit, the commission percentage is equal to the
  high commission percentage."**
- **"If the margin is between the high and low limits, the commission percentage is calculated with the
  following equation:"**

  **`(HC-LC)/(HL-LL) * (MPCT-LL)+LC`**

  where `HC` = High Commission Percentage, `LC` = Low Commission Percentage, `HL` = High Limit,
  `LL` = Low Limit, `MPCT` = Margin Percentage.
- **This resolves the `SCS-015` gap** ("what happens below Limit Percent Low"): margin ≤ `LL` pays `LC`,
  and margin ≤ 0 pays nothing. **Note the two rules overlap at margin ≤ 0 when `LL` is negative — the
  zero rule is stated first and should win.**
- **Division-by-zero hazard: if `HL = LL`, the interpolation term divides by zero.** The source does not
  mention this. **Hard validation requirement for us: `HL > LL`.**
- The calculation uses **"the gross profit margin AND the gross profit dollars from each sale"** — but the
  published formula uses **margin percentage only**. **[CONFLICT] — the prose claims a two-variable
  ("double sliding scale") calculation while the equation is a single linear interpolation on margin
  percent. Verify against the live system.**

**Dependencies.** Commission Calculation Code Options (`SCS-015`); Point of Sale Control Settings
*(or Sales Order System Control Settings — see the conflict above)*; Costing Control Settings (`SCS-016`) —
`Salesperson Commissions` cost basis and `Commission Add On %` both change the margin this formula consumes;
`CFG-COSTING-METHOD` **[REUSE]**.

**Build notes.**
- Reuse the IDs from `SCS-015`: `CFG-COMM-HILO-LIMITLOW` (`LL`), `CFG-COMM-HILO-LIMITHIGH` (`HL`),
  `CFG-COMM-HILO-PCTLOW` (`LC`), `CFG-COMM-HILO-PCTHIGH` (`HC`).
- **Validation (hard):** `HL > LL`; all four in `[0, 100]`; and reject a configuration where `HC < LC`
  unless explicitly confirmed (an inverted scale that pays more for lower margin is almost always a typo).
- Implement as the exact piecewise function above, with the **margin ≤ 0 → 0%** rule evaluated first, and
  unit tests at each boundary (`0`, `LL`, midpoint, `HL`, above `HL`).
- **[GUARDED]** As in `SCS-015`: effective-dated, immutable for any pay period already calculated, and the
  applied commission percentage stored on the transaction rather than recomputed.
- **Resolve before building:** which screen owns these four fields, and whether gross profit *dollars*
  genuinely participate. Both are `[DECISION NEEDED]` / verification items.
- **Do differently:** express the whole thing as a **banded interpolation table**
  (`margin_from`, `margin_to`, `pct_from`, `pct_to`, `interpolate: bool`) covering 0–100% with no gaps.
  That generalizes the Hi/Lo scale, removes the division-by-zero case, and lets LA Mattress add more than
  two bands without a code change.

---

### `SCS-040` Import BIN/IIN Table
*storis_ref: article 15186452790804*

**Purpose.** Acquires, parses, and loads the **BIN/IIN table** (bank identification / issuer identification
numbers used to identify a card's issuer and type) from a designated third-party provider.

**Where it lives.** `System Administration -> System Tools -> Import BIN/IIN Table`.
**"This routine is available from both the STORIS menu system and as a STORIS scheduled process."**
The screen displays **the last date the process ran successfully**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Start time | time `HH:MM` ("standard STORIS format"), nullable | **"Any time after the current time is accepted."** **Blank → the process runs immediately on clicking `Run`.** |
| Log off when finished | bool | Checked → log off on completion; blank → return to the STORIS menu. |
| *(display)* Last successful run date | display-only date | |

**Behavior & rules.**
- **Error handling, quoted:** run manually, "those errors are displayed on your screen prior to logging off
  or returning to the menu system. Further, those errors are logged in the STORIS logging system and are
  available when **End-Of-Day Report Error Messages** is generated." Run as a scheduled process, errors go
  only to the log and the same EOD report.
- The source of the BIN/IIN file itself, its format, and the provider are **not documented here**.
- **No setting controls what happens if the table is stale** — only a displayed last-run date.

**Dependencies.** Payment Card and Device Settings (position 53, part B); Accounts Receivable Control
Settings (`SCS-002`) — gift card prefixes explicitly avoid colliding with card BINs (e.g. Visa's `4`);
Electronic Check Processing (`SCS-031`); Schedule a Process; `EOD-001` (Report Error Messages);
External Communications Settings (`SCS-035`) — the third-party provider connection.

**Build notes.**
- New IDs: `CFG-BIN-IMPORTSCHEDULE` (a scheduled-job definition, not a scalar setting),
  `CFG-BIN-PROVIDER` (endpoint + credential reference, in the secret store per `SCS-035`),
  `CFG-BIN-STALENESSALERT` — **new, not in STORIS**.
- **Do differently:** a stale BIN table silently mis-classifies cards (wrong issuer, wrong debit/credit
  routing, wrong surcharge eligibility). Add a **freshness SLA with an alert**, and surface the table's
  age wherever card type drives a business decision. STORIS shows a date and nothing else.
- Make the load **transactional** — parse and validate the whole file, then swap atomically. A partially
  loaded BIN table is worse than an old one.
- Keep the "run now or schedule" duality, but as a standard job-runner feature rather than a bespoke screen
  with a `Log off when finished` checkbox.
- `[DECISION NEEDED]` Does LA Mattress need issuer-level card classification at all? Relevant if we do
  surcharging, debit routing, or card-type-specific promotions; otherwise the payment gateway already
  handles it and this is out of scope.

---

### `SCS-041` Import Document Print
*storis_ref: article 15186416978452*

**Purpose.** Documents the **addendum forms printed alongside an import purchase order**, and where the
selection of an optional extra addendum is made.

**Where it lives.** Forms are maintained in the **Forms Designer**; the optional addendum is selected in
**Terms Code Settings**. **"The default selection is None."**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| *(Terms Code Settings)* Import addendum selection | enum, **default `None`** | Chooses **one** of the additional import addendum forms: `DP – Document against Payment` \| `TT – Telegraphic Transfer` \| `None`. |
| *(Forms Designer)* Standard addendum forms | 4 form templates | **Always printed with an import purchase order**, in addition to the PO itself: `CII - Commercial Invoice Instructions`; `CIR - Commodities Invoice Requirements`; `C-TPAT – Customs Trade Partnership Against Terrorism security requirements`; `IPI - Import Purchase Information`. |
| *(Forms Designer)* Optional addendum forms | 2 form templates | `DP – Document against Payment`; `TT – Telegraphic Transfer`. |

**Behavior & rules.**
- **Hard rule: the four standard addenda always print with an import PO** — they are not individually
  selectable.
- **The optional addendum is chosen per Terms Code**, i.e. **payment terms determine which trade-finance
  document accompanies the PO** (`DP` = documents against payment, `TT` = telegraphic/wire transfer).
  That is a sensible coupling and worth preserving.
- **`C-TPAT` is a U.S. Customs security-program document** — a compliance artifact, not a convenience form.

**Dependencies.** Forms Designer / Enhanced Laser Forms; Terms Code Settings; purchase order printing;
Purchasing Control Settings (part B); vendor/import configuration.

**Build notes.**
- New ID `CFG-TERMS-IMPORTADDENDUM` (scope: **TERMS CODE**) — another scope our resolver does not yet have;
  add `TERMS_CODE` alongside `VENDOR`, `COMPANY`, and `VENDOR_REMIT_TO` (see `SCS-005`, `SCS-022`).
- Register the six forms as **named document templates** with a `document_set` for "import PO packet",
  rather than hard-coding four always-on addenda. That lets the packet vary by country of origin, which is
  how real import compliance works.
- **Compliance:** `C-TPAT` content is externally specified. Treat these as **versioned documents** with an
  effective date, like the ECA receipt text (`SCS-031`) and consumer application text (`SCS-036`).
- `[DECISION NEEDED]` Does LA Mattress import directly (its own POs to overseas mills), or buy domestically
  from distributors? Direct import brings landed-cost, container, and customs-document requirements that
  connect back to `CFG-COSTING-FREIGHTMODE = ITEMIZED_CONTAINER` **[REUSE]**.

### `SCS-042` Installment Receivables Control Settings
*storis_ref: article 15186452792724*

**Purpose.** Global rules for **in-house installment lending**: when contracts activate, interest rate and
method, term limits, due-date policy, deferment limits and fees, interest rebate on early payoff, return/
cancellation windows, and payment-application order.

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Installment Receivables Settings > Installment Receivables Control Settings`.
Tabs: **General, Advanced**.
**Hard prerequisite: "You must have the Extended Receivables Add-On module active in General System Control Settings … in order to use Installment Receivables."** → `SCS-038`.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Activate Contracts | enum, **mandatory** | `Upon Approval` — contracts activate **during the next End of Day after credit approval** of installment-financed orders. `Upon Delivery` — activate **during the next EOD after completion** of those orders. **Activation starts the interest clock and the first-payment countdown, so this single choice moves the entire amortization schedule.** |
| Interest Rate is % | percent, **4 decimal places** | Default interest rate. **Resolution hierarchy, quoted: `Installment Payment Plan Settings > Sales Tax Settings > Installment Receivables Control Settings` — "This rate is the last one checked in the interest rate hierarchy."** (Note the middle tier: **the state's Sales Tax Settings carry an interest rate** — usury caps by state.) |
| with a Calculation | enum, **mandatory when a rate is entered** | `Declining Balance (APR)` \| `Straight Line Interest`. |
| Default Terms are Months | int, **mandatory** | Default contract term. "the term for the new contract defaults from the installment plan or from this control setting if no term is specified for the plan." |
| Minimum term is Months | int, **mandatory** | Used when the plan specifies no minimum. |
| Maximum term is Months | int, **mandatory** | Used when the plan specifies no maximum. **Hard rule: "If you enter an override to the default terms, your entry cannot be less than the minimum or greater than the maximum established here or in the plan settings (if any)."** |
| First Payment Due Months after Contract Activation | int months, **mandatory** | Combined with the contract's due day to compute the first payment date. |
| Payment Grace Days | int days, **mandatory** | **(LOCKED - STORIS access ONLY!)** Days after the due day a payment may be made before a **late fee** is assessed. |
| Due Date Is | multi-select day-of-month **1 through 28**, optional | Opens the **Due Date List Entry** window (`SCS-028`). Populates the `Due Day` drop-down on the Installment Worksheet. **"If multiple days are selected, the default is the day that is CLOSEST TO TODAY'S DATE."** **Note: this article explicitly caps the list at 28, resolving the ambiguity flagged in `SCS-028`.** |
| Due Date may be Pushed Days Into the Future | int days, optional | Maximum days a due date may be moved beyond the current due date. **Worked example, quoted: "the current due date is June 1 and this field is set to 10. The due date can be pushed to June 10, but not to June 15."** |
| Deferment Fee is | table, optional | Opens the **Deferment Fee Table** (`SCS-025`). **"If you do not create a table, deferment fees are not assessed."** |
| Defer Payments Consecutively | int | Number of **consecutive** deferments allowed on a contract. |
| Defer Payments Within a Rolling 12 Month Period | int | Number of deferments allowed in a **rolling 12-month** window. |
| Rebate Calculation | enum, **mandatory** | Interest rebate method on early payoff: **`Rule of 78's`** \| **`Straight-line`**. **Rule of 78 front-loads interest and is prohibited or restricted for many consumer credit terms in the U.S. — a compliance-critical choice.** |
| Cancel Contract Within Days of Activation to Receive Full Interest and Insurance Rebate | int days, optional | "full interest and insurance rebate" window — cancel within this many days of activation and **full** interest and insurance rebates are calculated. |
| Merchandise Return Within Days of Activation to Cancel Contract | int days, optional | "return cancellation" window — a **FULL** merchandise return within this many days of activation allows the contract to be cancelled. (Emphasis on **full** is the source's.) |
| Automatic Credit Threshold | money | Maximum dollar amount automatically credited to a contract from **a return, an exchange (for less), or a dollar-only credit adjustment**. |
| Fixed Activation Date Future Days | int, **mandatory, max 99** | Limits how far into the future a **fixed contract activation date** may be set during Installment Worksheet entry. |
| Maximum Days to Back-Date Payoffs | int days | Maximum back-dating of a payment so it falls within the payoff "as of" period. |

**Fields — Advanced tab**
*(All are checkboxes; a header-row checkbox activates or clears all of them at once.)*

| Field | Type | Purpose / business rule |
|---|---|---|
| DUE DATE - Allow Changes if Deferred | bool | Permit due-date changes on payments that have been **deferred**. |
| DUE DATE - Allow Changes with Past Due Amounts | bool | Permit due-date changes on contracts **with past-due amounts**. |
| DUE DATE - Allow Multiple Changes | bool | Permit **more than one** due-date change per contract. |
| INSURANCE - Prompt the User to Print the Insurance Letter | bool | Prompt to print insurance letters during sales entry. **Parent switch.** |
| INSURANCE - Consolidate Insurance Codes on Letters | bool | Consolidate letters "whose insurance codes' form templates **for the customer's jurisdiction** match". Blank → one letter per insurance code. **Requires the prompt setting above to be checked.** |
| PAYMENTS DUE - Round Up to the Nearest Dollar | bool | Round regular monthly payments up to the nearest dollar, **excluding the final payment** (which absorbs the remainder). |
| PENDING CONTRACTS - Allow Customer to have Multiple Pending Contracts | bool | Allow more than one pending contract per customer. |
| STATEMENTS - Generate for Installment Receivables | bool | Update and generate installment statements during installment cycle processing. (Ties to `SCS-001`'s installment XML statement export.) |
| ADDITIONAL PAYMENTS - Apply as Prepayment | bool | **Checked → additional payments apply to the BEGINNING of the contract, in payment-due sequence** — the customer pays ahead. *Worked example, quoted: payments due are $100; an additional $300 covers the next 3 payments, so "The customer does not have a payment due for 3 months."* **Blank → additional payments apply to the END of the contract, in last-installment-to-first sequence; "Payments continue to be cycled due on the due date, but by applying the payment to the end of the contract, customers can pay off the contract in a shorter amount of time."** **Hard rule: "Installment payment reversals are ALWAYS applied in last installment to first sequence."** |
| ADDITIONAL PAYMENTS - Credits Apply as Prepayment | bool | Same two behaviors, for **credits** rather than payments. **[CONFLICT] — the source's description of this field is a verbatim copy of the previous field's, saying "additional payments" throughout rather than "credits"; the distinction between the two fields is only in the field name.** |
| PAYOFF/CANCELLATION DATE - Allow Future Dates | bool, **default unchecked** | Permit **future** dates when cancelling a contract via `Update Contract Status` (extra Action in *Manage and Adjust Installment Contracts*) or when taking payments via *Enter a Customer Payment* / *Enter a Customer Payment/Refund/Gift Certificate*. |

**Behavior & rules.**
- **Interest rate resolution is three-tier with the state (Sales Tax Settings) in the middle** —
  plan → state → system default. That middle tier is how usury caps get applied, and it means the system
  default is a fallback, not a policy.
- **Payment-application order is the highest-impact Advanced setting.** Prepayment vs
  apply-to-end changes the customer's next-due date, the interest accrued, and whether they appear
  delinquent. **Reversals ignore the setting entirely and always go last-to-first**, so a payment and its
  reversal are **not symmetric** — repeated pay/reverse cycles will drift the schedule.
- **`Rule of 78's`** as a selectable rebate method is a legal exposure in many jurisdictions.
- **The header-row "check all" on the Advanced tab** makes it trivially easy to enable every permissive
  due-date and payment option in one click.
- Deferment is bounded two ways (consecutive count and rolling-12-month count) and priced by the
  `SCS-025` table.

**Dependencies.** General System Control Settings (`SCS-038`) — Extended Receivables Add-On;
Installment Payment Plan Settings (term, rate overrides); Sales Tax Settings (state interest rate);
Deferment Fee Table (`SCS-025`); Due Date List Entry (`SCS-028`); Account Statement Cycling Control Settings
(`SCS-001`) — installment statements and XML export; Accounts Receivable Control Settings (`SCS-002`) —
`Automatic Display of Legal Settings` covers *Manage and Adjust Installment Contracts* and
*View All Installment Activity*; Collections Processing Control Settings (`SCS-014`) — **the carve-out that
a deferment zeroing the balance does not re-evaluate collections**; Financing Control Settings (`SCS-036`)
— contract-type providers are exempt from the finance application validity rule; Legal Code Settings
(`SCS-044`); insurance codes and jurisdiction form templates; `EOD-001`.

**Build notes.**
- New IDs: `CFG-INST-ACTIVATEWHEN` **[GUARDED]**, `CFG-INST-DEFAULTRATE`, `CFG-INST-INTERESTMETHOD`,
  `CFG-INST-DEFAULTTERM`, `CFG-INST-MINTERM`, `CFG-INST-MAXTERM`, `CFG-INST-FIRSTPAYMONTHS`,
  `CFG-INST-GRACEDAYS` (locked), `CFG-INST-ALLOWEDDUEDAYS` (**= `SCS-028`**),
  `CFG-INST-DUEDATEPUSHDAYS`, `CFG-INST-DEFERMENTFEETABLE` (**= `SCS-025`**),
  `CFG-INST-MAXCONSECUTIVEDEFERMENTS`, `CFG-INST-MAXDEFERMENTS12MO`,
  `CFG-INST-REBATEMETHOD` **[GUARDED]**, `CFG-INST-FULLREBATEDAYS`, `CFG-INST-RETURNCANCELDAYS`,
  `CFG-INST-AUTOCREDITTHRESHOLD`, `CFG-INST-FIXEDACTIVATIONFUTUREDAYS`,
  `CFG-INST-MAXPAYOFFBACKDATEDAYS`, `CFG-INST-DUEDATE-{DEFERRED,PASTDUE,MULTIPLE}`,
  `CFG-INST-INSURANCELETTERPROMPT`, `CFG-INST-INSURANCECONSOLIDATE`,
  `CFG-INST-ROUNDUPPAYMENT`, `CFG-INST-MULTIPLEPENDING`, `CFG-INST-GENERATESTATEMENTS`,
  `CFG-INST-ADDLPAYMENTMODE`, `CFG-INST-CREDITAPPLYMODE`, `CFG-INST-ALLOWFUTUREPAYOFFDATE`.
- **[GUARDED] — every setting on this screen is contract-terms configuration and must be
  effective-dated and immutable for existing contracts.** A contract must carry its own rate, term,
  rebate method, grace days, and payment-application rule, captured at origination. Changing a global here
  must **never** re-amortize a live contract. This is the strongest version of the versioning requirement
  that also applies to `SCS-025`, `SCS-031`, and `SCS-017`.
- **Do differently:** make payment reversal symmetric with payment application, or make the asymmetry an
  explicit, documented, tested rule with a reconciliation report. As specified, pay-then-reverse loses
  schedule fidelity.
- **Do differently:** remove `Rule of 78's` unless legal explicitly requires it; default to actuarial/
  straight-line rebate.
- **Do differently:** remove the Advanced tab's "check all" header control. One click that relaxes every
  due-date and payoff restriction simultaneously is an audit finding waiting to happen.
- **Compliance:** interest calculation method, rebate method, grace days, late fees, deferment fees, and
  the right to cancel on full return are all **regulated consumer-credit terms** (TILA/Reg Z, state
  retail-installment-sales acts). Every one must be disclosed on the contract and must match what the
  system computes. `[DECISION NEEDED]` — full legal review before any of this is built.
- `[DECISION NEEDED]` **Is in-house installment lending in scope for LA Mattress at all?** This is the
  single biggest scoping question raised by part A. If financing is entirely third-party, `SCS-025`,
  `SCS-028`, and `SCS-042` become reference-only, and `SCS-036` (finance receivables from providers)
  becomes the priority instead.

### `SCS-043` Inventory Control Settings
*storis_ref: article 15186452794132*

**Purpose.** The master Inventory Control screen: serial and location tracking, main warehouse, Kardex
history, **stock reservation method**, image display mode, reason codes for special inventory states,
receiving/transfer permissions, payables defaults from receiving, **automatic stock replenishment**, and
**product ID auto-generation**. **Heavy overlap with the Inventory handoff pack — most settings here already
have registry IDs and MUST reuse them.**

**Where it lives.** `System Administration > System Settings > Merchandising and Distribution System Settings > Inventory Control Settings`.
Tabs: **General, Additional Settings, Replenishment, Product Identifier**.
"NOTE: Some system control settings are accessible by STORIS personnel only."

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Serial Number Tracking | bool | **(LOCKED - STORIS access ONLY!)** Global serial tracking. **Hard rule: "This field must be set by STORIS before you begin using the system. Once set, you CANNOT CHANGE this field."** **Subtle behavior: "If you activate the Serial Number Tracking flag in the Product file WITHOUT activating this flag, the system prompts for serial numbers only as the product LEAVES the system during the order completion process."** With it on, per-product selection is made in Advanced Product Settings. **[GUARDED — irreversible.]** |
| Confirm During Pickup Completion | bool | Require serial-number confirmation during **customer-pickup manifest completion**. Active only when serial tracking is active. |
| Main Warehouse | ref (warehouse location code) | Must already exist in Warehouse/Store Location Settings. **"The system uses the location you select here as the default location during entry programs."** |
| Location Tracking | bool | **[REUSE] `CFG-INV-LOCTRACK`** — **(LOCKED - STORIS access ONLY!)** Global switch, **"must be set by STORIS before you begin using the system. Once this field is set, you cannot change it."** Then **per-location** activation in Warehouse/Store Location Settings. Confirms the Inventory pack's "two-step, guarded" note — and adds that in STORIS it is **irreversible**, not merely guarded. |
| Layaway in Net Purchase Order | bool | Include layaway quantities in the Net PO calculation. **Hard rule with exact error text: "If `Fill Layaway Orders` in Point of Sale Control Settings is already set when you press Save, you cannot check the `Layaway in Net Purchase Order` box. If you attempt to do so, the error message, `Fill Layaway Orders cannot be active while Layaway in Net Purchase Order is set` appears, and you cannot save your changes."** **[CONFLICT/GUARDED — cross-screen mutual exclusion enforced at save.]** |
| Add Vendor Model to Reports | bool | **[REUSE] `CFG-INV-VENDORMODEL`.** On → show vendor model number on reports; blank → product number only. |
| Kardex History Months | int **1–99** | Retention of Kardex history. **"The system maintains a detailed Kardex history for all products for the CURRENT processing month. This flag sets on-line history retention for PREVIOUS calendar months."** |
| Track Bin to Bin Transfers | bool | Include bin-to-bin transfers in Kardex. |
| Track As-Is Activity | bool | Include as-is items in Kardex. |
| Track As-Is Reason Code | bool | Include as-is reason-code changes in Kardex. |
| *(scope note)* | — | **"To turn Kardex reporting on or off for selected products, use the `Inventory Tracking` field in the Product Settings."** — product-level override of these three globals. |
| Warehouse Management History Months | int months | WMS history retention; **EOM purges older data but "does not purge data for the current month or the closing month."** **Worked example, quoted:** on November 7 closing October with this set to `2`, the system keeps November (current), October (closing), **and September and August**, purging everything else. **Active only if WMS is active.** |
| Receiving Schedule Retention Days | int **1–999**, optional | Used by the **Receiving Schedule Purge** process. **"If this field is left empty, Receiving Schedule Purge does not remove any receiving schedules from the system."** |
| Reservation Priority | enum | **[REUSE] `CFG-INV-RESERVEBY`** (the pack records this family as "Stock Reservations / Reserve by Date Type (General tab)"). Options: `Delivery Date` \| `Ordered Date`. |
| Reservation Date | enum | Second half of the same pair: `Delivery Date within Auto Fill Days` \| `Immediate`. |
| *(the three supported reservation methods, quoted)* | — | 1. "Prioritize by **Delivery Date** & reserve by **Delivery Date within Auto Fill Days** (fill period)." 2. "Prioritize by **Order Date** & reserve by **Delivery Date within Auto Fill Days** (fill period)." 3. "Prioritize by **Ordered Date** & reserve **Immediately** (prioritize orders by date of entry and reserve regardless of Fulfillment Date)". **Overridable at product level (Advanced Product Settings) and regional product level (District and Regional Product Settings).** Compare `SCS-009`, which states only **two** combinations are valid when prefer-PO logic is enabled. **[CONFLICT — three methods here, two permitted there.]** |
| Online Receipts Reservations | bool | Checked → goods received from POs commit to open sales orders or transfers **immediately upon receiving**. Blank → commit **during End-of-Day**. **"hard kits are not eligible for online receipts reservations."** |
| Reserve ASAP Sales | bool | Reserve inventory for **ASAP**-status sales order lines; also applies to **Service orders** (e.g. ASAP pending service orders for parts reservations). **"any auto transfers written for ASAP orders are scheduled for one day in the future."** **Inactive if `Daily Auto Release of Stock` is checked on the Inventory tab of Point of Sale Control Settings.** |
| Reserve CWC Sales | bool | Reserve inventory for **CWC** lines; also applies to Service orders. **"any auto transfers written for CWC orders do not have delivery dates assigned and the transfers are UNSCHEDULED."** **Inactive if `Daily Auto Release of Stock` is active.** |
| *(ATP constraint on the two fields above, quoted)* | — | **"You cannot activate `Reserve ASAP Sales` or `Reserve CWC Sales` while ATP is active unless Stock Reservation `Reservation Priority` is set to `Order Date` and `Reservation Date` is set to `Immediate`."** Also: you may check them when ATP is active **provided existing products are NOT set to be reserved by `Delivery Date within Auto Fill Days` in District and Regional Product Settings.** **ATP is active when any of `Include New Purchase Orders`, `Include Stock Transfers`, `Include Unlinked Purchase Orders` is on in Point of Sale Control Settings.** **[GUARDED — a cross-screen, data-dependent precondition.]** |
| Report Sort By | enum | `Product Number` \| `Vendor Model`. "If the report contains its own sort fields, they may override this field." **"If you set this field to `Vendor Model` but the Product record contains no vendor model number, the report prints the product number appended by two asterisks (`**`)."** |
| Screen Image Display | enum | **[REUSE] `CFG-PROD-IMAGEMODE`** (`MANAGED` \| `URL`). `Image` → camera-icon processes show the product image, **falling back to the URL if no image**; `URL` → show the URL, **falling back to the image if no URL**. "If there is no image or URL for a product, the camera icon is inactive." |
| Forms and Labels Image Display | enum | Same two values and the same reciprocal fallback, applied to **ELP forms and labels**. **"To allow images to be substituted on forms and labels, the form or label must have the tags `product_image` and `product_image_url`."** Ties to `SCS-011` `Product Image Options For Forms Designer`. **[CONFLICT-adjacent — image behavior for labels is configured in two places.]** |

**Fields — Additional Settings tab: Reason Codes**

| Field | Type | Purpose / business rule |
|---|---|---|
| Floor Sample | ref (reason code) | **(LOCKED - STORIS access ONLY!)** Designates floor samples. **"Only users authorized via the `Sell designated floor sample merchandise` field in Create a User/Group Actions - Sales Security can sell floor samples."** Unauthorized attempts warn and block; an authorized override **updates the audit file with the authorizing user**. **Must be set to `Not Required` at the `Reason Usage Code` field in Reason Code Settings.** |
| Not in Location | ref (reason code) | **(LOCKED - STORIS access ONLY!)** Assigned to products not found in their assigned locations during physical inventory. **Must be flagged `Not Available for Sales` and `Reason Usage Code` = `Not Required`.** |
| In Service | ref (As-Is reason code) | **(LOCKED - STORIS access ONLY!)** For service orders against a warehouse stock piece. **"The piece must already be in As-Is status. Once you create the service order, the system changes the reason code to the code you specify here."** **Must be `Reason Usage Code = Not Required`.** |
| Twilight | ref (reason code), **max 3 characters** | Activates **Twilight Pricing**. Appears in the Reason column of the Serial/Reference Tracking Inquiry via the Remove from Twilight / Twilight Maintenance tabs. **Hard rule: "cannot be the same as the `Not In Location`, `Floor Sample`, or `In Service` reason codes."** |
| Repossession | ref (reason code) | For repossessed items. **Hard rule: "you cannot use this code as a regular as-is reason code. The system prevents use of the Repossession reason code in — regular customer returns and exchanges, manifest completion when designating an item as Not Delivered, and the `Move to As-Is` and `As-Is Status` tabs of the Enter a Stock Adjustment routine."** |
| Vendor Chargebacks | ref (reason code), optional | Default reason on the vendor chargeback process; editable at entry. Must already exist in the Reason Code file. |

**Fields — Additional Settings tab: Setting Descriptions grid**

| Field | Type | Purpose / business rule |
|---|---|---|
| PICK LIST - Print Line Order Comments | bool | Print line comments on the pick list. |
| PRODUCT SEARCH - Exclude Obsolete Merchandise | bool | Exclude obsolete products from *Search for a Product* and from **eRoam II** (STORIS' iPad application) searches. |
| RECEIVING - Allow a User to Close a Partially Received PO | bool | **[REUSE] `CFG-INV-RCVCLOSE`.** Blank → users cannot close partially received POs. |
| RECEIVING - Allow Without a PO | bool | Allow *Receive without a Purchase Order*. Blank → **purchase orders are required for warehouse receipts.** |
| RECEIVING - Generate End of Day Costed Receipts Report | bool | Print product **costs** on *Report Current Costs of Received Purchase Orders* at EOD; blank → the standard (uncosted) report. |
| TRANSFERS - Restrict Transfers that Exceed Maximum Stock | bool | Restrict transfers exceeding `CFG-WHINV-MAXSTOCK` **[REUSE]** in Warehouse Inventory Settings. |
| TRANSFERS - Use Transfer Security Tables | bool | Restrict transfers to security tables built **by logon and/or by user**. **Hard rule: "If this box is checked and no tables are created, USERS CANNOT CREATE TRANSFERS."** Tables: *Logon* — Actions on the **Inventory & Logistics** tab of Warehouse/Store Location Settings; *User* — Actions on the **Security** tab of Create a User. Users without the right must obtain a security override. **[GUARDED — enabling this with no tables defined halts all transfers.]** |
| **Actions → RetailDeck Control Settings** | action | See `SCS-035` RetailDeck tab. |

**Fields — Additional Settings tab: Payables / Vendor Chargebacks / Control and Distribution / As-Is Pricing**

| Field | Type | Purpose / business rule |
|---|---|---|
| Auto-Create Freight Bill | enum | `Yes` — auto-create freight bills on freight receiving; `No`; `Prompt`. |
| Payables Hold Code | ref (hold code) | Default hold code for AP bills. (Compare `SCS-030`'s `Hold Code for Incoming Bills` — **[CONFLICT-adjacent]**, two default AP hold codes from different origins.) |
| Recalculate Sell Price % | percent | Default new-selling-price calculation percentage for vendor chargebacks (price adjustments) in Enter a Stock Adjustment; **overridable by the user.** |
| Chargeback Method | enum | `None Selected (leave field blank)` \| `Vendor Credit` \| `Vendor Receivable`. Defaults on the Vendor Chargeback tab of Enter a Stock Adjustment. |
| Retain Adjustments for Days | int **0–999** | Retention of inventory adjustment data; purged during **End of Month**. |
| Retain Completed As-Is Lists Days | int > 0, or blank | Retention of processed designated As-Is inventory lists; purged during **End of Period**. **Blank → the lists are not purged.** |
| Storage Location Velocity | ref (velocity code), optional | Default velocity during putaway planning when a storage location has none. **Blank → the system uses the slowest velocity, as defined in Velocity Settings.** |
| Maximum Percentage Reduction *(As-Is Pricing Adjustment)* | percent **0.01–99.99**, nullable | Maximum percentage by which an as-is piece's price may be lowered in Enter a Stock Adjustment. **Blank → no limit; any price may be entered.** |

**Fields — Replenishment tab**
*Scope note, quoted: the feature "does not include the following product types: **special-order product, non-inventory product, kit masters**." Replenishment locations can be set in several settings screens; see "Automatic Stock Replenishment for Locations" for the checking hierarchy.*

| Field | Type | Purpose / business rule |
|---|---|---|
| For Stores — Replenishment Active | bool | Activates Automatic Stock Replenishment for stores (and activates the warehouse-list fields). |
| For Stores — First / Second / Third / Fourth / Fifth Warehouse | ref (warehouse location) ×5, ordered | **[REUSE/extend] `CFG-LOC-REPLSOURCE`** (the Inventory pack records it as LOCATION-scoped; **this screen shows a SYSTEM-level ordered list of five, split by target type**). Each **must be a `warehouse`-type location** at `Location Type` on the General page of Warehouse/Store Location Settings. **"A first location must be chosen before choosing a second location"** — the list must be filled in order. |
| For Warehouses — Replenishment Active | bool | Same, for warehouse targets. |
| For Warehouses — First … Fifth Warehouse | ref ×5, ordered | Same rules. |
| Stock Level | enum | Quantity indicator used to compute availability: `Minimum` \| `Safety`. **Exact formula, quoted: `Qty On-Hand – Qty reserved - Minimum (or Safety) Stock Qty`.** Levels are defined in Warehouse Inventory Settings (`CFG-WHINV-MINSTOCK` **[REUSE]**). |
| Stock Level Target | enum, **default `Maximum`** | Used by *Replenish Assigned Stock Levels*: replenish up to the `Minimum` or the `Maximum` for the location. **"This selection is only available when the `Stock Level` above is set to `Minimum`; it is not available when set to `Safety`."** |
| Available is Less Than Minimum Stock | bool | Checked → replenish locations below the **minimum** stock level; blank → replenish locations below the **maximum** stock level. **[CONFLICT] — a single boolean whose blank state means "use maximum", overlapping `Stock Level` and `Stock Level Target`; three fields govern the same threshold decision.** |
| Auto Store Stock Replenishment Transfer Days | int days | Days before the estimated delivery date that an automatic stock transfer may be scheduled. |
| Include Incoming Purchase Order Scheduled Date Days | int **0–999** | Which POs count toward quantity available at the receiving location. **"If this setting is enabled, purchase orders with a delivery date GREATER THAN the run date and the days specified are EXCLUDED from the quantity available when Automatic Stock Replenishment is run during End of Day or from Replenish Assigned Stock Levels."** |
| As-Is Merchandise in Availability | bool | Include As-Is merchandise when determining replenishment transfer quantities. |
| Reason Code *(As-Is)* + Include/Exclude | multi-select + enum | Active only when the field above is checked. **`Include` → the listed reason codes are counted, or leave the list blank to include ALL reason codes. `Exclude` → you MUST select one or more reason codes.**  |

**Fields — Product Identifier tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Format | enum, **default `Next Product Number`** | `Next Product Number` — sequential counter; `Dynamic Identifier` — composed from the components defined below. **Group-level equivalent: the Product Identifier tab of Group Settings.** |
| Next Product Number | int, **max 10 numeric**, nullable | **(LOCKED - STORIS access ONLY!)** Starting SKU/model number; increments by one per assignment. **Blank → users assign product numbers manually.** **"If you enter a number with 1 to 7 characters, the program pads the number with zeros on the left to form an 8-digit number."** **Action button → `Product Auto-Numbering Exclusion Ranges` screen, where any number of numeric ranges can be excluded from automatic numbering.** |
| Sequential Counter — Maximum Length | int, **required when Format = Dynamic Identifier** | Length of the internal sequential counter **appended to the END of the defined components**. |
| Sequential Counter — Fixed Length | bool | Pad the counter with **preceding zeros** to `Maximum Length`. *Example, quoted: max length 5, counter at 123 → `00123`; unchecked → `123`.* |
| Current Combined Component Length | display-only int | Running total of all component maximum lengths **plus the sequential counter**. **"This total cannot exceed the Maximum Identifier Length."** |
| Maximum Identifier Length | display-only int | The ceiling for a Product ID. |
| Grid — Product Attribute | ref | The attribute supplying this component (see `SCS-003`). |
| Grid — Text | text | A literal component (see `SCS-004`). **"Text and Product Attribute components cannot exist on the same row of the grid."** |
| Grid — Maximum Length | int | **Product Attributes only.** Over-length data is **"truncated using left justification"** — *example, quoted: max length 5, data `123456` → `12345`.* |
| Grid — Fixed Length | bool | **Product Attributes only.** Pads with **leading zeros** — *example: max length 5, data `123` → `00123`.* |
| Grid — Strip Text | text | **Product Attributes only.** *Example, quoted: product group attribute `123-45` with `-` as strip text → component `12345`.* |
| Grid — Remove | button | Remove a component. |
| Promote/Demote | buttons | **Reorders components — component sequence in the grid is the ID's concatenation order** (confirming the inference in `SCS-003`/`SCS-004`). |
| Add Product Attribute / Add Text | buttons | Open `SCS-003` and `SCS-004` respectively. **"Add Text … adds a Text component to the LAST ROW of the grid."** |

**Behavior & rules — the hard ones.**
- **Two settings are permanently irreversible once set: `Serial Number Tracking` and `Location Tracking`.**
  The Inventory pack records `CFG-INV-LOCTRACK` as "guarded"; STORIS is stricter than guarded — it is
  one-way. **Our implementation should be guarded but reversible with a migration, not one-way.**
- **`Layaway in Net Purchase Order` ⇎ `Fill Layaway Orders`** — mutual exclusion across two screens,
  enforced at save with a named error message.
- **ATP vs `Reserve ASAP/CWC Sales`** — a precondition that depends both on another screen's settings **and
  on existing product data** in District and Regional Product Settings.
- **`TRANSFERS - Use Transfer Security Tables` with no tables blocks all transfers.**
- **The four reason codes are mutually constrained** (`Twilight` ≠ the other three; `Repossession` may not
  be used as a normal as-is code; two of them require specific `Reason Usage Code` / `Not Available for
  Sales` flags in Reason Code Settings).
- **Replenishment threshold is over-specified** by `Stock Level`, `Stock Level Target`, and
  `Available is Less Than Minimum Stock`, with conditional availability between them.

**Dependencies.** **Inventory handoff pack — reuse `CFG-INV-LOCTRACK`, `CFG-INV-VENDORMODEL`,
`CFG-INV-RESERVEBY`, `CFG-INV-RCVCLOSE`, `CFG-PROD-IMAGEMODE`, `CFG-LOC-REPLSOURCE`,
`CFG-WHINV-MINSTOCK`, `CFG-WHINV-MAXSTOCK`, `CFG-REPL-PROFILES`, `EOD-001`.**
Point of Sale Control Settings (`Fill Layaway Orders`, `Daily Auto Release of Stock`, ATP calculation
settings, `CFG-POS-AUTOSCHED` **[REUSE]**); Warehouse/Store Location Settings (`Location Type`, per-location
Location Tracking, transfer security by logon, Barcode tab); Advanced Product Settings (serial tracking,
reservation overrides, `Inventory Tracking`); District and Regional Product Settings (reservation
overrides); Warehouse Inventory Settings; Reason Code Settings; Velocity Settings; Group Settings (Product
Identifier); Create a User (transfer security by user, Sales Security `Sell designated floor sample
merchandise`); Bar Code Control Settings (`SCS-011`); Automatic Transfers (`SCS-009`);
Costing Control Settings (`SCS-016`); Add Product Attribute (`SCS-003`); Add Text (`SCS-004`);
RetailDeck (`SCS-035`); End-of-Month / End of Period.

**Build notes.**
- **Reuse, do not re-mint:** `CFG-INV-LOCTRACK`, `CFG-INV-VENDORMODEL`, `CFG-INV-RESERVEBY`,
  `CFG-INV-RCVCLOSE`, `CFG-PROD-IMAGEMODE`, `CFG-LOC-REPLSOURCE`, `CFG-WHINV-MINSTOCK`,
  `CFG-WHINV-MAXSTOCK`.
- **Corrections/extensions to the Inventory pack registry, from this article:**
  - `CFG-INV-RESERVEBY` is **two fields, not one** (`Reservation Priority` + `Reservation Date`) with
    **three valid combinations**, and it has **PRODUCT** and **DISTRICT/REGION** overrides. Record it as an
    enum pair with a validated combination set, scopes `SYSTEM | DISTRICT | PRODUCT`.
  - `CFG-INV-LOCTRACK` — STORIS makes it **irreversible**, not merely guarded. Note the divergence.
  - `CFG-LOC-REPLSOURCE` — there is also a **SYSTEM-level ordered list of up to five source warehouses,
    separately for store targets and warehouse targets**. Extend the registry entry accordingly.
- New IDs: `CFG-INV-SERIALTRACK` (locked, irreversible), `CFG-INV-CONFIRMSERIALPICKUP`,
  `CFG-INV-MAINWAREHOUSE`, `CFG-INV-LAYAWAYINNETPO` **[CONFLICT]**, `CFG-INV-KARDEXMONTHS`,
  `CFG-INV-KARDEX-{BINTOBIN,ASIS,ASISREASON}`, `CFG-INV-WMSHISTORYMONTHS`,
  `CFG-INV-RCVSCHEDRETENTIONDAYS`, `CFG-INV-ONLINERECEIPTRESERVE`, `CFG-INV-RESERVEASAP`,
  `CFG-INV-RESERVECWC`, `CFG-INV-REPORTSORT`, `CFG-INV-FORMSIMAGEMODE`,
  `CFG-INV-REASON-{FLOORSAMPLE,NOTINLOCATION,INSERVICE,TWILIGHT,REPOSSESSION,VENDORCHARGEBACK}`,
  `CFG-INV-PICKLISTCOMMENTS`, `CFG-INV-EXCLUDEOBSOLETE`, `CFG-INV-RCVWITHOUTPO`,
  `CFG-INV-EODCOSTEDRECEIPTS`, `CFG-INV-RESTRICTXFEROVERMAX`, `CFG-INV-USEXFERSECURITY` **[GUARDED]**,
  `CFG-INV-AUTOFREIGHTBILL`, `CFG-INV-PAYABLESHOLDCODE`, `CFG-INV-CHARGEBACKSELLPCT`,
  `CFG-INV-CHARGEBACKMETHOD`, `CFG-INV-ADJRETAINDAYS`, `CFG-INV-ASISLISTRETAINDAYS`,
  `CFG-INV-DEFAULTVELOCITY`, `CFG-INV-ASISMAXREDUCTIONPCT`,
  `CFG-REPL-ACTIVE-{STORES,WAREHOUSES}`, `CFG-REPL-SOURCES-{STORES,WAREHOUSES}` (ordered, ≤5),
  `CFG-REPL-STOCKLEVELBASIS`, `CFG-REPL-STOCKLEVELTARGET`, `CFG-REPL-BELOWMINIMUM` **[CONFLICT]**,
  `CFG-REPL-TRANSFERDAYS`, `CFG-REPL-INCLUDEPODAYS`, `CFG-REPL-INCLUDEASIS`,
  `CFG-REPL-ASISREASONFILTER`, `CFG-PRODID-FORMAT`, `CFG-PRODID-NEXTNUMBER` (locked, monotonic),
  `CFG-PRODID-EXCLUSIONRANGES`, `CFG-PRODID-COUNTERLENGTH`, `CFG-PRODID-COUNTERFIXED`,
  `CFG-PRODID-COMPONENTS` (**= `SCS-003`/`SCS-004`**), `CFG-PRODID-MAXLENGTH`.
- **Guarded changes:** `CFG-INV-SERIALTRACK` and `CFG-INV-LOCTRACK` (irreversible in STORIS; for us,
  guarded + migration); `CFG-INV-RESERVEBY` (**the Inventory pack already notes it triggers a re-allocation
  batch** — plus the ATP precondition documented here); `CFG-INV-USEXFERSECURITY` (blocks all transfers if
  enabled with no tables — validate that at least one table exists); all retention fields
  (`KARDEXMONTHS`, `WMSHISTORYMONTHS`, `ADJRETAINDAYS`, `RCVSCHEDRETENTIONDAYS`,
  `ASISLISTRETAINDAYS`); `CFG-PRODID-*` (changing the generator after SKUs are issued —
  see `SCS-003`); `CFG-INV-REASON-*` (repointing a reason code re-classifies existing inventory states).
- **Do differently:**
  - Collapse `Stock Level` / `Stock Level Target` / `Available is Less Than Minimum Stock` into **one
    replenishment rule**: `trigger_when_below ∈ {MIN, SAFETY, MAX}` + `replenish_up_to ∈ {MIN, MAX}`.
  - Make the replenishment source list a proper **ordered list with per-entry conditions**, unified with the
    `Auto Transfer List` from `SCS-009` — STORIS has **two separate ordered source-location lists** for
    overlapping purposes.
  - Do not make tracking flags irreversible. Guard them, require zero conflicting state, and provide a
    migration.
  - Enforce the reason-code uniqueness and usage-flag constraints as **typed references with predicates**,
    not documentation.
  - `Maximum Percentage Reduction` blank = unlimited is another blank-means-off case; make it explicit.
- `[DECISION NEEDED]` LA Mattress: serial tracking (adjustable bases?), location/bin tracking in the DC,
  reservation method (recommend **Order Date + Immediate**, the only combination compatible with both ATP
  and the prefer-PO logic in `SCS-009`), and the replenishment source topology.

### `SCS-044` Legal Code Settings
*storis_ref: article 15186501982868*

**Purpose.** Defines **legal status codes** for customer accounts (bankruptcy, fraud, deceased, litigation,
etc.) and, for each, the **automatic actions** the system takes when that status is applied to a customer —
including closing the account, suppressing statements, blocking payments, excluding from marketing, and
setting **Metro 2 credit-bureau reporting codes**.

**Where it lives.** Two paths:
`Accounting > Revolving Receivables > Revolving Receivables Settings > Legal Settings`
and `Accounting > Installment > Installment Receivables Settings > Legal Settings`.
**"Use this routine to maintain the legal codes pre-built by STORIS and to create new codes."**
**Key rule, quoted: "If you do not check any of the action boxes (close account, etc.) for a particular
status, that status is used for INFORMATIONAL PURPOSES ONLY."**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Legal Code | code (system-assigned) | Edit by entering the code or double-clicking a grid row; **the Plus button creates a new code and "The system assigns the next available legal code."** |
| Description | text, **max 30 alphanumeric** | Editable on existing codes. Action button → **Language Translation Entry** window. |
| Allow Payments | bool | Checked → users may post payments to a customer with this legal code. Blank → blocked, **but "Payments can still be posted if a user has the proper security clearance via the `Legal Settings; Override Payment Restrictions` setting in Receivables Security"**; otherwise a security override from an authorized user is required. |
| Inactivate Customer Account | bool | Checked → applying this legal status in Advanced Customer Settings **closes the account by updating the `Inactive Date` with the current date.** |
| Do Not Report | bool | Checked → **the legal code is excluded from the credit reporting file.** |
| Allow Repossession | bool, **defaults to CHECKED on new codes** | Permits posting repossessions to customers with this code. **Note the permissive default — a newly created legal code allows repossession unless someone unchecks it.** |
| Do Not Solicit | bool | Checked → applying the status **sets the `Do Not Solicit` box on the Advanced tab of the customer's settings**, excluding them from **all mailing lists and eSTORIS emails**. |
| Hold Statements | bool | Checked → applying the status **changes `Hold Customer's Statement` to `Yes` on the Receivables tab of the customer's settings**, putting statements on hold. (Ties to `SCS-001`: EOD XML statement generation skips customers whose `Hold Customer's Statement` is `Yes` **or blank**.) |
| Activate | bool, **defaults to checked on new codes** | Whether the code is available for use. **Hard rule: "If a legal code is assigned to a customer in Advanced Customer Settings you CANNOT inactivate it."** |
| Account Status | ref (Metro 2 account status code), optional | Applied to the customer when this legal code is added. |
| Special Comment | ref (Metro 2 code), optional | Applied to the customer when this legal code is added. *(The article's description says "Metro 2 account status code" for all three lookups — **[CONFLICT]**, `Special Comment` and `Compliance Condition` are distinct Metro 2 field types, not account status codes.)* |
| Compliance Condition | ref (Metro 2 code), optional | Applied to the customer when this legal code is added. |
| Consumer Information Indicator (CII) | display-only, **auto-assigned** | **"The CII cannot be manually assigned to a legal code. Instead, CIIs are AUTOMATICALLY assigned to legal codes related to bankruptcy or reaffirmation of debt."** Shown in the grid for reference. "When a legal code with a CII is assigned to a customer, the CII will be applied accordingly, and the Metro2 reporting process will reflect this in greater detail when reporting bankruptcy information." |
| Grid columns | `Legal Code`, `Description`, `Allow Payments`, `Inactivate Customer Account`, `Do Not Report`, `Hold Statements`, `Activate`, `Allow Repossession`, `Account Status`, `Special Comment`, `Compliance Condition` | **`Y` = checked, `N` = unchecked.** Double-click a row to maintain. **Note `Do Not Solicit` is a field but is NOT one of the grid columns — [CONFLICT]/gap.** |

**Pre-built legal codes shipped by STORIS (verbatim list):**
`Chapter 13 Bankruptcy`, `Chapter 7 Bankruptcy`, `Charge Off`, `Collections Responsible`, `Deceased`,
`Deferred Bankruptcy`, `Franchise Charged Account`, `Franchise Not Responsible`, `Franchise Responsible`,
`Fraud`, `Insurance`, `Litigation`, `Outside Collections`, `Repossession`, `Skipped`.

**Behavior & rules.**
- **A legal code is a bundle of side effects, not just a label.** Applying one status to a customer can
  simultaneously close the account, hold statements, set do-not-solicit, block payments, change what is
  reported to the bureaus, and stamp a Metro 2 status — **all from one checkbox on the customer record.**
- **The "no actions checked = informational only" rule** means a code can look meaningful and do nothing.
- **`Allow Repossession` defaulting to checked** on new codes is the wrong default for a field of this kind.
- **A code in use cannot be inactivated** — good referential hygiene.
- **`Do Not Report` interacts with `SCS-002`'s Metro 2 reporting** and with `Account Status` /
  `Special Comment` / `Compliance Condition`: a code can both suppress reporting and carry Metro 2 codes,
  which is contradictory. **[CONFLICT]**
- **Payment blocking is overridable by permission**, which is correct for e.g. a deceased account where an
  estate pays, but must be audited.

**Dependencies.** Advanced Customer Settings (legal status checkboxes, `Inactive Date`, `Do Not Solicit`
on the Advanced tab, `Hold Customer's Statement` on the Receivables tab); Accounts Receivable Control
Settings (`SCS-002`) — `Automatic Display of Legal Settings` pops the `Customer Legal Settings - Read Only`
screen in 16 routines, and the Credit Reporting tab / Metro 2 configuration; Account Statement Cycling
Control Settings (`SCS-001`) — statement hold behavior; Collections Processing Control Settings (`SCS-014`);
Installment Receivables Control Settings (`SCS-042`); Revolving Receivables Settings;
Receivables Security (`Legal Settings; Override Payment Restrictions`); Costing Control Settings (`SCS-016`)
— repossession depreciation; Inventory Control Settings (`SCS-043`) — the `Repossession` reason code;
mailing lists and eSTORIS email (`SCS-033`).

**Build notes.**
- New IDs: `CFG-LEGAL-CODES` — a **table**, each row
  `{code, description (i18n), allow_payments, inactivate_account, do_not_report, allow_repossession,
  do_not_solicit, hold_statements, active, metro2_account_status, metro2_special_comment,
  metro2_compliance_condition, cii (derived)}`;
  plus `SEC-AR-OVERRIDE-LEGALPAYMENT` for the payment override.
- **This is a rules table, and it should be modeled as one** — a legal status is an event that triggers a
  declared set of effects. Implement the effects as **explicit, logged state transitions on the customer**
  (account closed, statements held, marketing suppressed), each individually reversible and each carrying
  the legal code that caused it. STORIS mutates other screens' fields silently; we should record causality.
- **[GUARDED] — high severity.** Editing a legal code's actions **changes behavior for every customer
  already assigned that code**, but STORIS applies the actions only at assignment time. That means editing
  a code produces an inconsistent population: some customers had the old effects applied, some will get the
  new ones. Our service must (a) version legal codes, (b) show how many customers hold the code before
  allowing an edit, and (c) offer an explicit "re-apply to existing holders" action with a preview.
- **Do differently:** `Allow Repossession` must default to **unchecked**. And `Do Not Report` must be
  **mutually exclusive** with the three Metro 2 code fields, validated at save.
- **Compliance (this is the most legally sensitive table in part A):** Chapter 7/13 bankruptcy, deceased,
  fraud, and litigation statuses carry **FDCPA, FCRA, and bankruptcy-stay obligations**. Automatic
  suppression of collection activity, statements, and solicitation on a bankruptcy code is not a preference
  — it is required. Recommend: **certain effects are non-configurable** for bankruptcy and deceased codes
  (no collection contact, no solicitation, statements held), with the configurable fields limited to the
  reporting codes. `[DECISION NEEDED]` — legal review, and confirmation of which Metro 2 codes map to which
  legal statuses.
- Keep the **CII auto-derivation** — deriving a bureau indicator from the legal code rather than letting an
  operator pick it is exactly right, and we should extend that principle to the other three Metro 2 fields.
- Keep the **"cannot inactivate a code in use"** rule.
- `[DECISION NEEDED]` If LA Mattress carries no house receivables, the collection-related effects are moot,
  but **`Deceased`, `Fraud`, `Litigation`, and `Do Not Solicit` still matter** for any customer record —
  so a slimmed legal-status table is in scope regardless.

---

## Part A summary notes

**Coverage.** 44 of 44 assigned articles written up (`SCS-001` … `SCS-044`), positions 1–44 of the
System Control Settings section enumeration. No article was skipped or sampled.

**Known content gaps inside articles that were read** (not missed articles — the source itself does not
document these):
- `SCS-016` — the option list for the four **Exception Handling** enums, and the **cost exception type
  taxonomy** (a "type 4" is referenced).
- `SCS-036` — the **`Consumer Application Text`** tab is named but has no field documentation.
- `SCS-038` — the **`Active Add-Ons`** tab is referenced by `SCS-010`, `SCS-011`, and `SCS-030` but is not
  among the four tabs this article documents; the article's own Access path is also wrong.
- `SCS-005` — no field-level detail; only the screen's effect.
- `SCS-015` — the Hi/Lo formula is missing here but supplied in full by `SCS-039`.

**No article content addressed the reader as an agent or attempted to give instructions.** All text was
ordinary product documentation.
