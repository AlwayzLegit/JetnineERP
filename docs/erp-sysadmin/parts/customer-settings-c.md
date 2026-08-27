# Customer Settings — Part C (positions 93–137 of 137)

*Section: Customer Settings, id `15233769370388`. Enumerated 137 articles via the `grab()` helper.*
*This part covers positions **93 through 137** (the final third), IDs `CUST-093` … `CUST-137` — 45 articles.*

## Enumeration boundary check

**Verified.** My enumeration of section `15233769370388` returned **137 articles**, alphabetical.
Position **92** is `Minimum Finance Charge Table` (article 15242406895636) — exactly where part B ended.
Position **93** is **`Miscellaneous Payment Settings`** (article 15242662922260) — exactly as briefed.
No renumbering was necessary; parts A (1–46), B (47–92) and C (93–137) tile the section with no gap
and no overlap.

## Standing cross-references carried into this part

Reused, not re-minted (established wave 1 / parts A–B):

- **Extended Security is a single global kill-switch** in General System Control Settings — every
  per-user permission below is inert unless it is on. We are deliberately not reproducing that design.
- Permission IDs live in `parts/user-security-CATALOG.md` (355 flags, 10 domains).
- STORIS group permissions are a **copy-down template**, not live inheritance. We replace with live
  most-specific-scope-wins evaluation.
- **STORIS has no general change-audit log.** Only `SAR-024` Report Secured Decryption Activity exists.
  We are specifying `RPT-AUDIT` ourselves; every table below that is a money/pricing/tax lever is
  flagged as an `RPT-AUDIT` feeder.
- PII masking applies **only on re-access**, not on first entry.
- The erasure routine overwrites name and billing address 1 with the literal `"REMOVED"` and
  **retains city/state/ZIP**.
- Attribution fields are **overwritten, not appended** — last-touch only, no attribution history.
- Addresses have **no versioning** — this threatens 10-year warranty lookback.
- Resolver scopes beyond the Inventory pack: `COMPANY`, `VENDOR_REMIT_TO`, `VENDOR_REGION`,
  `TERMS_CODE`, `PRODUCT_CATEGORY`.

---

### `CUST-093` Miscellaneous Payment Settings
*storis_ref: article 15242662922260*

**Purpose.** Creates *miscellaneous payment types* — payment codes that post to a nominated GL account
and fall outside the built-in categories (cash, credit card, finance). Typical uses: absorbing
pre-conversion legacy balances at installation, and one-off/odd tender that still needs to land in the
general ledger and appear on cash reports.

**Where it lives.** Six documented paths, all landing on the same maintenance routine:
- `Accounting > Receivables > Receivables Settings > Miscellaneous Payment Settings`
- `Accounting > General Ledger > General Ledger Settings > Receivables Settings > Miscellaneous Payment Settings`
- `Accounting > Settings > Payables Settings > Miscellaneous Payment Settings`
- `Accounting > Settings > General Ledger Settings > Receivables Settings > Miscellaneous Payment Settings`
- `System Administration > System Settings > Accounting System Settings > Accounts Receivables System Settings`
- `System Administration > System Settings > Accounting System Settings > General Ledger System Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Payment Type Code` | code (key) | Code of the payment type to create or edit. Search button opens the **Payment Type Code Lookup** window to pick an existing type. |
| `Description` | text | Description of the payment type. |
| `Activation Date` | date, optional | Earliest date users can access this payment type. **Blank = system does not check for an "earliest date"** (i.e. no lower bound, not "never"). |
| `Expiration Date` | date, optional | Latest date users can access this payment type. **Blank = system does not check for a "latest date"**. |
| `Receivables GL Account` | GL account no. | GL account to which payments of this type post. **If the TPA module (third-party accounting) is active, this field is mandatory and validates against the chart of accounts** — otherwise it is optional and unvalidated. |
| `For Import Customer Payments Only` | checkbox, default **unchecked** | When checked the code is **only** available to the receivables *Import Customer Payments* process and **cannot be used in payment posting during order entry, manual post, or cash application**. |
| `Allow to NSF` | checkbox, default **unchecked** | When checked, this payment type may be NSF'd in the *Apply NSF and Correct Misapplied Payments* process. |
| `Account Number Prompt` | enum | Controls the `Account#` prompt in the Miscellaneous Payment Type Entry window (`CUST-094`). Exact values: `No prompt` (de-activates the Account# field), `Entry is Optional`, `Entry is Mandatory`. |

**Behavior & rules.**
- **Hard rule — miscellaneous payment types are a deliberate integration blind spot.** For these types the
  system does **NOT** perform: *"transmissions of any kind"*, *"FR receivable tracking"*, and
  *"approvals, authorizations, or validations."* They are unvalidated tender by design.
- Despite the above, **the system reports and subtotals miscellaneous payment types as appropriate on all
  cash reports** — so they *do* hit cash reconciliation even though nothing authorizes them.
- **Import fallback posting rule:** when used by Import Customer Payments, *"If you define a G/L account
  for this payment type, the system uses that account for the debit posting during the payment import
  process. Otherwise, the A/R Cash Account defined for the bank is used."* — i.e. a silent fallback to a
  bank-level account when the code has no GL account.
- Activation/Expiration form an inclusive availability window, each side independently optional.

**Dependencies.**
- Chart of accounts (validated only under TPA — see `CUST-133` / `CUST-134` TPA articles).
- Bank record's *A/R Cash Account* (import fallback).
- `CUST-094` Miscellaneous Payment Type Entry Window consumes `Account Number Prompt`.
- Apply NSF and Correct Misapplied Payments process consumes `Allow to NSF`.
- Import Customer Payments process consumes `For Import Customer Payments Only`.
- `CUST-103` Payment Type Override Settings, `CUST-123` Settlement Type — sibling tender configuration.

**Build notes.**
- Implement as `PAYMENT_TYPE` rows with `kind = MISC`, an effective-dated window
  (`active_from` / `active_to`, both nullable and each independently ignorable), and a nullable
  `gl_account_id`.
- **Do differently:** make `gl_account_id` mandatory and FK-validated *unconditionally*, not only under a
  TPA flag. A tender code that can post to a null account and silently fall back to the bank's cash
  account is an unreconcilable-difference generator.
- **Do differently:** do not ship a tender class that bypasses all approval/authorization/validation.
  Replace with an explicit `requires_manager_approval` flag plus a permission
  (`SEC-AR-MISC-TENDER`) and make every use write an `RPT-AUDIT` row (user, amount, code, order,
  timestamp). This is exactly the surface where shrink hides.
- `Account Number Prompt` → three-value enum `NONE | OPTIONAL | REQUIRED` on the payment type; the entry
  window enforces it.
- `[DECISION NEEDED]` Do we need a misc-tender class at all at LA Mattress, or is the legacy-balance
  migration use-case a one-time data load that should never become a permanent POS-visible tender?
  Recommend: allow the code for migration, but hard-restrict it to `For Import Only` semantics.

---

### `CUST-094` Miscellaneous Payment Type Entry Window
*storis_ref: article 15242406901140*

**Purpose.** The small capture window that appears when a user picks a miscellaneous payment type at the
`Type` field of the Payment Summary Window, to enter the amount and an optional reference/account number.

**Where it lives.** Pops from the `Type` field in the **Payment Summary Window** whenever the selected
type is a miscellaneous type (as opposed to e.g. cash).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Type` | display-only | The selected payment type code and its description appear. |
| `Amount` | money | **Defaulting is security-driven:** *"Depending on the Receive a Default for the Payment Amount field in your user/user group receivables security settings, the full outstanding amount may default in this field, but you can change it."* If no default is offered, the user must key the amount. |
| `Account Number` | alphanumeric, **max 16 characters** | Free reference number associated with the transaction. **Required / optional / inactive purely by the `Account Number Prompt` setting on the Payment Type record** (`CUST-093`). |

**Behavior & rules.**
- **A user-level security flag controls a *defaulting* behaviour, not an access right** — `Receive a Default
  for the Payment Amount` in user/user-group receivables security decides whether the full outstanding
  amount prefills. This is a recurring STORIS pattern worth calling out: permissions and UX defaults are
  conflated in the same flag catalogue.
- The account number is a pure free-text reference: no validation, no format mask, no uniqueness is
  described. 16 alphanumeric characters.

**Dependencies.**
- `CUST-093` Miscellaneous Payment Settings (`Account Number Prompt`).
- User/User Group **Receivables Security Settings** → `Receive a Default for the Payment Amount`
  (see `parts/user-security-CATALOG.md`; gated by the global **Extended Security** kill-switch).
- Payment Summary Window (order entry / cash application).

**Build notes.**
- Model as a tender line: `payment_type_id`, `amount`, `reference_no varchar(16)`.
- Keep the three-state requiredness driven off the payment type, but **validate the reference against a
  per-type regex** rather than accepting any 16 characters — for the migration use case the reference is
  the legacy account number and should be checkable.
- **Do differently:** separate "may default the outstanding amount" from the permission model — that is a
  user *preference*, not a security right. Put it in user preferences, not the permission catalogue.
- Feed every misc tender entry into `RPT-AUDIT`.

---

### `CUST-095` Move Customer Purchase History for Completed Order
*storis_ref: article 15242406632084*

**Purpose.** Re-associates the purchase history of a **completed order** from one customer to another —
built for the case where the buyer and the servicing customer differ (e.g. a builder bought the item and
sold the house/goods on to the end consumer who now needs warranty service).

**Where it lives.** Not a standalone menu item — it is a prompt raised from two lookup screens:
- **Serial Number Look-Up** — from *Advanced Customer Settings* → `Actions` → `Look-up by Serial Number`;
  or from *Enter a Service Order* → `Search` at the `Original Document` field → `Product Serial Number Lookup`.
- **View Customer Ship-To Addresses** — from *Advanced Customer Settings* → `Actions` →
  `Look-Up by Ship-To Address`; or from *Enter a Service Order* → `Search` at the `Original Document`
  field → `Customer Ship To Address Lookup`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (grid) completed order documents | selection grid | Results of the serial-number or ship-to-address lookup. |
| (prompt) move confirmation | Yes / No | Raised only when the order's customer ≠ the customer on the originating screen. |

**Behavior & rules.**
- Trigger condition is exact: *"If the customer for the selected order does not match the customer
  specified in the original screen (customer settings or service order), a question appears asking if you
  want to move the customer history for the selected completed order to the customer on the original
  screen."* Answer `Yes` to move, `No` to return without moving.
- **Hard rule and a trap — "move" is actually a copy.** The article's own NOTE: *"the system copies the
  completed order history to the customer history record of the 'move-to' customer, causing the completed
  order information to exist in history for both customers."* The feature is named *Move* and behaves as
  *Duplicate*. **Purchase history is therefore double-counted across two customer records after use.**
- No permission is cited for this action; no audit trail is described. Combined with the
  **no general change-audit log** finding, an ordinary service writer can silently graft another
  customer's purchase history onto a record with no record of having done so.
- **Touches carried-forward finding: attribution/history integrity.** Because the copy leaves the source
  intact and stamps no provenance, any downstream "lifetime spend", "units purchased" or loyalty metric
  computed from customer history is inflated by every use of this routine.

**Dependencies.**
- Advanced Customer Settings; Enter a Service Order.
- Serial number registry (serial → order document) and ship-to address index — relates to the
  **addresses have no versioning** finding: a ship-to lookup resolves against *current* address rows only,
  which is precisely the 10-year warranty lookback risk.
- Customer purchase-history store.

**Build notes.**
- We need this capability — builder/landlord/property-manager purchase followed by end-consumer service is
  a real furniture/mattress pattern — but implement it correctly:
- **Model the relationship, do not copy the rows.** Add a `service_entitlement` link:
  `(order_line_id, entitled_party_customer_id, granted_by_user, granted_at, reason)`. The purchasing
  customer stays the owner of the sale; the serviced customer gains a *view/claim* entitlement.
  Lifetime-value and history metrics then stay correct for both parties.
- Require a permission (`SEC-CUST-HISTORY-LINK`) and write an `RPT-AUDIT` row on every grant, including
  both customer IDs.
- Provide a reverse action (revoke the entitlement). STORIS documents no way to undo the copy.
- **This is a hard blocker for warranty lookback:** entitlement rows must be immutable and address-snapshot
  bearing, since addresses are not versioned upstream.
- `[DECISION NEEDED]` For LA Mattress, is B2B/builder purchasing with consumer-side service in scope for
  v1? If yes this needs to be first-class, not a lookup-screen side-effect.

---

### `CUST-096` Multiple Line Discounts Overview
*storis_ref: article 15242595452052*

**Purpose.** The conceptual overview of STORIS sales-discount processing: multiple discounts on a single
order line, the Auto-Apply engine driven by a Daily Discount Schedule, the three promotional discount
types, and the line-vs-subtotal discount split. **This is the anchor article for the whole discount
subsystem and the most build-relevant article in this part.**

**Where it lives.** Overview article; the behaviour applies across `Enter a Sales Order` (sales order,
sales quote, layaway order), `Enter an Exchange` (sale portion), `Enter a Quick Sale`,
`Enter a Service Order` (parts, labor, charges).

**Fields** — (overview article; the configurable fields live in `CUST-117` Sales Discount Settings, Point of
Sale Control Settings, and Create/Maintain a Daily Discount Schedule.)

| Element | Type | Purpose / business rule |
|---|---|---|
| Daily Discount Schedule | dated schedule | Set of discounts that qualify for a given order date. Required for Auto-Apply. |
| `Order of Operation` | sequence | Sequence in which each discount in the schedule is applied. |
| `Discount Group` | grouping | **Once a discount from a group is applied to any line of the order, it disqualifies all other discounts in the same group for that order.** Group exclusivity is *order-wide*, not line-wide. |
| ineligible flag | flag | Discount qualifies for the day but is *ignored* by Auto-Apply. |
| `Discount is a` | enum on Sales Discount Settings | Must be set to `Percent` for BOGO. |
| `Line Discounts - Apply as an Allocated Dollar Discount` | checkbox | Required for the allocated-dollar type. |
| `Apply Discount to Subtotal` | checkbox on Sales Discount Settings | Required for a discount to be usable at subtotal level. |
| `Allow Subtotal Discount combined with Line Discount` | checkbox on Sales Discount Settings | Permits mixing line and subtotal discounts. |
| `Minimum Eligibility Required Amount/Quantity` | money / qty | Threshold for the *Apply to Additional Purchase* type. |

**Behavior & rules.**
- **Auto-Apply actions** (from `Actions` within Enter a Sales Order / Enter a Quick Sale — auto-apply is
  **not** available in Exchange or Service Order):
  - `Start Automated Line Discounting` — applies the discounts using the Daily Discount Schedule and starts the process.
  - `Suspend Automated Line Discounting - Remove Discounts` — removes **all** line discounts from the order and suspends.
  - `Suspend Automated Line Discounting - Retain Discounts` — suspends but keeps the discounts. **"This action requires a special security setting."**
- **`BOGO Discount` — exact rule.** *"only eligible for an order line when another line exists on the order
  that has both a quantity and unit price equal to or greater than the order line. Once a line has received
  a BOGO discount or is used as the source to qualify a BOGO discount for another line, it is disqualified
  from being used as the source of any other BOGO."* **Requires `Discount is a` = `Percent`.**
  So: the qualifying line must dominate on *both* quantity and unit price, and each line can be consumed
  as a BOGO source exactly once.
- **`Allocated Dollar Discount` — exact rule.** A fixed dollar amount *"allocated proportionally to all
  lines where the discount has been applied based on the unit price."* On delete of a line or removal of
  the discount from a line, **all other lines carrying the discount are recalculated to reach the amount**.
  If no other line carries it, the discount is removed with no further action.
  **Overflow rule: "If the summary of the unit price of all lines applied is less than the discount, all
  lines are discounted 100%, resulting in a line extension of zero. The remainder of the discount is
  discarded."** — the excess silently evaporates rather than becoming a credit or an error.
- **`Apply to Additional Purchase` — exact rule.** Applicable to any order line once the total of *all
  other* order lines meets or exceeds the `Minimum Eligibility Required Amount/Quantity`.
  **"Once the discount is applied to a line, the amount or quantity of the line is no longer included in
  the total used to qualify other lines."** (i.e. qualifying spend is *consumed*.)
  **"Non-inventory order lines are not included in the amount used to qualify a discount's minimum
  eligibility."**
- **Commission asymmetry — a hard, surprising rule.** *"Any discount applied at the line level effects the
  merchandise amount and will reduce commission."* versus *"Because subtotal discounts are applied to the
  order total, the commission on individual line-items is not affected."*
  **The same dollar of discount costs the salesperson money at line level and costs them nothing at
  subtotal level.** That is a direct incentive to push discounting to the subtotal, and it is a live
  gaming vector.
- Combining line + subtotal discounts requires either `Allow Subtotal Discount combined with Line Discount`
  on the discount, **or** the user holding `Override the Restrictions on Combining Line and Subtotal
  Discounts` in Sales Security Settings.
- Access gates: `Access sales order line discounts` (user/user group Sales Settings) for line discounts;
  `Access Subtotal Discount%, Discount Amount, or Discount Codes` for subtotal discounts. Subtotal
  discounting additionally requires the Point of Sale Control Settings switch to be active.
- **Return-time disqualification.** On `Enter a Return`, the system checks whether the returned line was
  used to qualify discounts on *other* lines. If so and those lines are not also being returned,
  **a message displays stating the reason that the return disqualifies the discount**; the user may
  proceed with permission, or obtain a manager override, **to return the item and retain the discount**.
  So the default posture is "returning the qualifier should claw back the discount", overridable.

**Dependencies.**
- `CUST-117` Sales Discount Settings — the discount definitions (`Discount is a`, `Apply Discount to
  Subtotal`, `Allow Subtotal Discount combined with Line Discount`, allocated-dollar flag).
- `CUST-116` Sales Coupon Settings — sibling promotional mechanism.
- Point of Sale Control Settings → Discounts section, incl. `Automatically Apply Discounts using Daily
  Discount Schedule` (control-settings parts; treat as `CFG-POS-*`).
- Create/Maintain a Daily Discount Schedule.
- User/User Group **Sales** Security Settings (see `parts/user-security-CATALOG.md`): auto-apply use,
  manager discounts, `Override the Restrictions on Combining Line and Subtotal Discounts`, return-time
  discount retention. All inert without the global **Extended Security** kill-switch.
- Commission engine — `CUST-102` Payment Commission Adjustments Screen, `CUST-128` Spiff Table Settings,
  `CUST-120` Salesperson Settings.
- Pricing resolver `ITEM-040`/`ITEM-041` (Inventory pack) — discounts sit *after* price resolution.

**Build notes.**
- This is the specification for our promotions engine. Required primitives:
  1. **Multiple discounts per line**, evaluated in an explicit **order of operation** (sequence integer on
     the schedule row). Order matters because percent discounts compound differently by sequence — we must
     pin whether each step applies to original unit price or to the running discounted price.
     `[DECISION NEEDED]` STORIS does not state the compounding base. **We must define it explicitly:
     recommend all percent line discounts compute off the *resolved base price*, not the running total,
     and are summed, to keep margin math predictable and auditable.**
  2. **Discount groups** with order-wide mutual exclusion (first one applied wins, rest disqualified for
     the whole order).
  3. **Date-effective daily schedule** with a per-entry `eligible_for_auto_apply` flag (STORIS's "ineligible").
  4. Discount types: `PERCENT`, `AMOUNT`, `BOGO`, `ALLOCATED_DOLLAR`, `ADDITIONAL_PURCHASE`.
- **Do differently — the allocated-dollar overflow.** Silently discarding the remainder is wrong; it hides
  a pricing error from everyone. We should block the save and surface
  *"discount exceeds discountable amount by $X"*, or convert the remainder to an explicit written-off
  amount that shows on the order and in reporting.
- **Do differently — commission neutrality.** Compute commission from the *net* merchandise amount after
  **all** discounts, line and subtotal alike, so the two paths are economically identical to the
  salesperson. Removing this asymmetry removes the gaming vector; it is also a change with comp-plan
  implications, so: `[DECISION NEEDED]` confirm with sales leadership before flipping.
- **Do differently — return clawback.** Make discount re-qualification on return *automatic and
  deterministic* (recompute the order's discounts against the post-return line set), with an explicit
  manager-approved "retain discount" exception that is written to `RPT-AUDIT`. STORIS's message-and-proceed
  model leaves the order in an economically inconsistent state.
- Every discount application, auto-apply start/suspend, override and return-time retention must feed
  `RPT-AUDIT` with user, discount code, line, and before/after amounts.
- BOGO source-consumption must be tracked as an explicit link (`bogo_source_line_id` on the discounted
  line) so it survives edits and is visible in the discount ledger, matching STORIS's *View Order Discounts*.

---

### `CUST-097` Non-Filing Fee Table
*storis_ref: article 15242406901908*

**Purpose.** Optional per-tax-jurisdiction lookup table that defaults a **non-filing fee** (the fee charged
in lieu of filing a UCC/security-interest financing statement) onto an installment worksheet, banded by the
financed amount.

**Where it lives.** `Sales Tax Settings > Installment tab > Non-Filing Fee Table field > click Action button`
(i.e. it hangs off `CUST-119` Sales Tax Settings and is therefore **scoped to a tax jurisdiction**).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Financed Amount` | money | Lower bound of a band. *"If the amount being financed is greater than or equal to this amount, but less than the next amount in this table, the corresponding non-filing fee is defaulted during worksheet entry."* |
| `Non-Filing Fee` | money | **Flat dollar amount** of the fee for that band. |
| `Delete` | button | Deletes a line; confirm `Yes` when prompted. |
| `Save` | button | Commits table changes. |

**Behavior & rules.**
- **Maximum five bands.** *"Up to five financed amounts and five corresponding non-filing fees can be
  entered and the table is built in ascending finance amount order."* The system maintains ascending order
  itself.
- Band matching is **half-open, lower-inclusive**: `[amount_n, amount_n+1)`. The top band is unbounded
  above. Nothing is said about amounts *below* the first band — a financed amount under the lowest
  threshold presumably gets no default.
- **Hard rule — the table, if it exists, is not overridable.** *"If you create a table, the fees default
  during installment worksheet entry **and cannot be changed**. If you do not establish a table of fees,
  you can enter a non-filing fee during worksheet entry."* Presence of the table converts an editable
  field into a locked one. This is an all-or-nothing lockout per jurisdiction, with no permission to
  override.
- The table is **optional**; absent it, the fee is free entry per worksheet.

**Dependencies.**
- `CUST-119` Sales Tax Settings (Installment tab) — parent, and the jurisdiction scope.
- Installment worksheet entry (consumer-finance origination).
- Related consumer-finance tables in this part: `CUST-091` (part B) Minimum Deposit Percentage Table,
  `CUST-092` (part B) Minimum Finance Charge Table, `CUST-104` Percentage Break Level Table,
  `CUST-113`/`CUST-114`/`CUST-115` revolving settings.

**Build notes.**
- Model as `fee_band(jurisdiction_id, kind='NON_FILING', min_financed_amount, fee_amount)` with a unique
  index on `(jurisdiction_id, kind, min_financed_amount)`.
- **Do differently — drop the five-row cap.** It is an arbitrary legacy limit; make the band list
  unbounded and validate only that bands are strictly ascending and non-overlapping.
- **Do differently — make the lock explicit and overridable.** Keep "table wins" as the default, but expose
  a `SEC-AR-OVERRIDE-STATUTORY-FEE` permission and log overrides to `RPT-AUDIT`. Also define the
  below-lowest-band case explicitly (recommend: fee = 0, and require a band starting at 0 so the table is
  total).
- This is a **regulated fee** — non-filing fees are capped by state law in several jurisdictions. Bands
  must be effective-dated (`effective_from`/`effective_to`) so a statutory change is a new version rather
  than an in-place edit, and every change must feed `RPT-AUDIT`.
- `[DECISION NEEDED]` Does LA Mattress originate its own installment paper, or is all consumer finance
  third-party (Synchrony/Acima/Progressive style)? If it is all third-party, this entire consumer-finance
  cluster (`CUST-091`, `-092`, `-097`, `-104`, `-113`, `-114`, `-115`, `-130`) is out of scope and should
  be explicitly descoped rather than half-built.

---

### `CUST-098` O/S Form Screen
*storis_ref: article 15242595235092*

**Purpose.** Maps STORIS's internal named print *forms* to operating-system printer/queue names for a given
printer, so the application knows where to send each document type.

**Where it lives.** `Actions` button on the **Printer Settings** screen (`CUST-106`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `STORIS Form` | lookup | The STORIS form to associate with this printer. Search button lists available forms. |
| `O/S Form` | text | The **operating system printer name or queue name**. |

**Behavior & rules.**
- **Hard rule — this list is a whitelist, not a convenience.** *"When setting up the Select Form list, you
  must include all STORIS forms that require access to this printer. **STORIS cannot send jobs to printers
  not listed here.**"* An unmapped (form, printer) pair is simply unprintable.
- Grid maintenance: double-click an entry or use `Remove` to remove a form; `Add` then `OK` to save.
- The example given is a Windows Server 2003 queue — this is a legacy, OS-coupled integration.

**Dependencies.**
- `CUST-106` Printer Settings (parent), `CUST-107` Printer Zone Settings, `CUST-137` Warehouse - O/S Form List.
- The STORIS form catalogue (document templates).

**Build notes.**
- We should **not** reproduce an OS-queue-name mapping table. Modern equivalent: a `print_destination`
  registry keyed by logical destination (e.g. `STORE_12_DELIVERY_DESK`) resolving to an IPP/CUPS endpoint
  or a cloud print/PDF-render target, plus a `document_type → destination` routing rule set with a
  wildcard default so an unmapped document degrades to "render PDF and prompt" rather than failing silently.
- **Do differently:** never let an unmapped form be unprintable. Default-route to PDF download/email.
- Keep the *concept* of per-zone/per-store routing (see `CUST-107`) — that part is genuinely needed for
  warehouse pick tickets and delivery manifests.

---

### `CUST-099` Open To Buy Budget by Category
*storis_ref: article 15242390968084*

**Purpose.** Sub-screen for entering a monthly planned-sales and planned-EOM-inventory budget broken out
**by product category** within an Open To Buy (OTB) department.

**Where it lives.** Appears when you **double-click a grid item on the `Planning Table` tab of
`CUST-100` Open To Buy Department Settings** — but **only if** `Open To Buy Department Control` in
*Purchasing Control Settings* is set to `Region/Buying Group` **and** the selected OTB department contains
both regions and buying groups.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Category` | lookup | Category to budget. Arrow shows a list, or double-click a grid row. |
| `Planned Sales` | money **in thousands** | Planned sales dollars expected for this category in the selected month. |
| `Planned Inventory EOM` | money **in thousands** | Planned end-of-month inventory **cost** dollars for this category. |
| `Month/Year` | display-only | Inherited from the month selected on Open To Buy Department Settings. |
| `Total Planned Sales` | display-only | Total planned sales, all categories, department, month. |
| `Total Planned Inventory EOM` | display-only | Total planned EOM inventory balance, all categories, department, month. |

**Grid columns.** `Category`, `Description`, `Last Year Planned Sales`, `% of Plan` (percent of last year's
planned sales), `Planned Sales`, `% of Plan` (percent of this month's plan), `Planned EOM`.

**Behavior & rules.**
- **Category list is activity-filtered, not catalogue-filtered.** *"For new OTB departments, the system
  scans all products in that department and displays all categories associated with those products.
  However, **only categories whose products have had inventory activity within the OTB region appear in
  the grid**."* A brand-new category with no movement in the region is invisible and therefore
  un-budgetable — a real trap when launching a new line.
- *"The percentages calculate as each category's percent of the total budget for the indicated month."*
- **`Planned EOM` includes landed costs** (explicit note on the grid column).
- **All dollar entry is in thousands** — a units-of-measure trap.
- `Add` saves; `Clear` abandons changes.

**Dependencies.**
- `CUST-100` Open To Buy Department Settings (parent).
- *Purchasing Control Settings* → `Open To Buy Department Control` / `Open to Buy` field (see control-settings parts).
- Product category master (`PRODUCT_CATEGORY` scope), region master, landed-cost calculation.
- Report Open To Buy Information.

**Build notes.**
- OTB budgeting is a merchandising-planning feature; for LA Mattress it is likely **v2 or out of scope** —
  flag rather than build. If built, model as `otb_plan(department_id, category_id, period_ym,
  planned_sales, planned_eom_inventory_cost)`.
- **Do differently:** store real dollars, not thousands. The "in thousands" convention is a legacy
  screen-width artifact and a guaranteed source of 1000x errors.
- **Do differently:** show *all* categories in the department, with zero-activity ones flagged, rather than
  hiding them. Hiding new categories defeats the purpose of a plan.
- `[DECISION NEEDED]` Is open-to-buy planning in scope at all? Recommend descope for v1 — LA Mattress's
  buying is narrower than a full-line furniture retailer's.

---

### `CUST-100` Open To Buy Department Settings
*storis_ref: article 15242662921876*

**Purpose.** Defines **Open To Buy (OTB) departments** — buying budget units — and their monthly planning
table (planned sales, planned EOM inventory, gross margin, freight factor, stock mix). Feeds the
*Report Open To Buy Information* routine so buyers can compare actual vs planned sales, cost, and inventory
dollars and see what budget remains "open to buy".

**Where it lives.** Seven documented paths under `Merchandising and Distribution > Purchasing > …`, all
ending in `… > Open to Buy > Open To Buy Department Settings` (via Buyer Tools, Merchandiser Tools,
Purchasing Cost Views and Reports, or Purchasing Views and Reports).

**Tabs.** `Category`, `Group`, `Region`, `Buyer`, `Planning Table`.

**Fields**

| Field | Tab | Type | Purpose / business rule |
|---|---|---|---|
| `Department Code` | (header) | code | Identifies the OTB department. |
| `Department Description` | Category / Region | text | Description of the buying department. |
| `Category` | Category | lookup, multi | Categories reporting to this department. `Add` / `Remove`. **Tab active only if `Open to Buy` in Purchasing Control Settings = `Product/Category Group`.** |
| `Group` | Group | lookup, multi | Product groups reporting to this department. Same activation condition. |
| `Region` | Region | lookup, multi | Regions reporting to this department. **Tab active only if `Open to Buy` = `Region/Buying Group`.** |
| `Buying Group` | Buyer | lookup, multi | Buyers reporting to this department. Same activation condition. |
| `Gross Margin %` | Planning Table | percent, **one decimal place** | Anticipated gross margin for the department. |
| `Freight Factor %` | Planning Table | percent, **one decimal place** | Freight factor used in calculations requiring **landed cost** on the OTB report. |
| `Stock %` | Planning Table | percent | Percent of inventory that is stock merchandise; **the remainder is implicitly special-ordered merchandise**. |
| `Month/Year` | Planning Table | period | Month to plan. **Any month from the previous year through the following year.** |
| `Planned Sales` | Planning Table | money **in thousands** | Planned sales per month. **If the department is by region/buying group, this displays the total of all categories in the department** (i.e. becomes a roll-up, not an entry). |
| `Planned Inventory EOM` | Planning Table | money **in thousands** | Planned EOM inventory cost. **"The system applies this amount to all months."** Must include landed add-on costs. |
| `Last Year Planned Sales` | Planning Table | display-only | Prior-year planned sales per month, if available. |

**Behavior & rules.**
- **The department's composition mode is a global switch, not a per-department choice.** Departments are
  built from *either* categories+groups *or* regions+buyers, decided by `Open to Buy Department Control` in
  Purchasing Control Settings. Two of the four composition tabs are always dead.
- **Hard rule — exclusive assignment.** *"You can assign each category/group or region/buyer to a single
  department only."* And: **"NOTE: You cannot combine the same region and buying group in more than one
  department."**
- **Hard rule — non-empty.** *"Records must contain at least one valid category/group or region/buying group."*
- **Hard rule and a genuine surprise — asymmetric regional security.** *"Regional Processing rules do not
  apply when entering or editing records in this routine, but they do apply in the Report Open To Buy
  Information routine."* **A regional user can author a budget spanning regions they are not permitted to
  report on.** Setup is unrestricted; reporting is restricted.
- **`Planned Inventory EOM` is applied to all months from a single entry** — it is a flat carry, not a
  per-month figure, despite sitting on a per-month tab.
- Double-clicking a Planning Table grid row opens `CUST-099` Open To Buy Budget by Category.

**Dependencies.**
- *Purchasing Control Settings* → `Open to Buy` / `Open To Buy Department Control` (control-settings parts).
- `CUST-099` Open To Buy Budget by Category (child).
- Category, group, region, and buyer masters. New resolver scopes `PRODUCT_CATEGORY`, and region.
- Landed cost calculation (freight factor).
- Report Open To Buy Information.
- Regional Processing rules (regional security) — see user-security parts.

**Build notes.**
- See `CUST-099` — likely descoped for v1.
- If built: **do differently** on all three counts —
  (a) allow per-department composition (category *or* region) rather than a single global mode;
  (b) apply regional scoping consistently to *both* authoring and reporting — the split is a security hole;
  (c) make `Planned Inventory EOM` genuinely per-month, and store real dollars not thousands.
- Exclusive assignment should be a DB unique constraint on `(category_id)` / `(region_id, buying_group_id)`
  across OTB departments, surfaced as a clear error, not a silent overwrite.

---

### `CUST-101` Order Source Settings
*storis_ref: article 15242662911764*

**Purpose.** Defines the valid **order source codes** — how an order was initiated (in-store, phone, web,
etc.) — assignable during Enter a Sales Order, Enter a Return, Enter an Exchange, and Adjust Dollars on a
Completed Order.

**Where it lives.** `Point of Sale > Settings > Order Source Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Order Source Code` | code, **max 6 characters** | Identifies the source. Search button opens the **Read-Only Lookup Window** to pick an existing code to edit. |
| `Description` | text, **max 30 characters** | Description. **`Action` button opens `Description Field - Language Translation Entry`** — descriptions are localizable. |
| `Exclude During Order Entry` | checkbox, **default unchecked** | Checked = hide this source from the order-entry search lists. Unchecked = include. Filters presentation only; does not deactivate the code. |

**Behavior & rules.**
- **Defaulting is split across two control-settings screens:** the `Order Source` field in **Point of Sale
  Control Settings** supplies the default for new orders in *sales order and exchange entry*; for orders
  processed online the default comes from **Web Control Settings**.
- **Hard rule — referential protection.** *"NOTE: Source codes set as the default in Point of Sale Control
  Settings or Web Control Settings cannot be deleted."*
- `Exclude During Order Entry` is the deprecation mechanism: STORIS offers **no expiry/inactive date** on
  an order source, only hide-from-picker. Historical orders keep the code.
- **Carried-forward finding — attribution is overwritten, not appended.** Order source is a *per-order*
  attribution field, so it does not itself suffer the customer-level overwrite problem; but note that
  `Adjust Dollars on a Completed Order` can **change the order source after the fact**, with no version
  history and no audit log. Reported channel mix is therefore mutable retroactively.

**Dependencies.**
- Point of Sale Control Settings → `Order Source` (default). Web Control Settings → online default.
- `CUST-112` Referred By Settings, `CUST-118` Sales Lead Origin Settings, `CUST-086` (part B) Marketing
  Code Settings — the sibling attribution taxonomies. **These four overlap heavily and should be
  consolidated in our model (see build notes).**
- Enter a Sales Order / Return / Exchange; Adjust Dollars on a Completed Order.
- `Description Field - Language Translation Entry`.

**Build notes.**
- Implement as `order_source(code, description, active_from, active_to, hidden_from_entry)` with i18n
  descriptions in a side table.
- **Do differently — add real effective dating.** "Hide from picker" is not deactivation. We want
  `active_to` so reporting can distinguish "retired 2024" from "still live but hidden".
- **Do differently — protect by reference count, not by a hardcoded default check.** Block delete if the
  code is referenced by *any* order or by any control setting; offer retire instead of delete.
- **Consolidation recommendation:** STORIS has at least four parallel attribution taxonomies —
  `Order Source` (how the order was placed), `Sales Lead Origin` (`CUST-118`), `Referred By` (`CUST-112`),
  `Marketing Code` (`CUST-086`, part B). Model these as **one `attribution` table with a `dimension`
  discriminator** (`CHANNEL`, `LEAD_ORIGIN`, `REFERRAL`, `CAMPAIGN`) so the picker sets, reporting, and
  permissions are uniform.
- Retroactive change of order source on a completed order must write `RPT-AUDIT` (old value, new value,
  user, timestamp).
- `[DECISION NEEDED]` 6 characters is too short for modern channel codes (`GOOGLE_LSA`, `INSTA_DM`).
  Recommend a slug of 32 chars. Confirm no downstream fixed-width export depends on 6.

---

### `CUST-102` Payment Commission Adjustments Screen
*storis_ref: article 15242390971412*

**Purpose.** Defines percentages used to compute a **commission adjustment on financed orders** — typically
to claw back (or bonus) commission in proportion to the discount/fee the financing company charges the
retailer.

**Where it lives.** `Financing Payment Plan Settings > Actions button`, and
`Desjardins Configuration > Actions button` (see `CUST-044`, part A).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `% of Financed Amount` | percent, **range 0.01% – 100.00%** | The *adjustment factor* — the percentage of the payment amount that represents the cost of financing the sale (e.g. the finance company's fee). |
| `% for Commission Adjustment` | percent, **signed** | Percentage **of the adjustment factor** by which to adjust commission. **"A negative percentage reduces commissions, and a positive percentage increases commissions."** |

**Behavior & rules.**
- **Exact formula (two-step, quoted):**
  1. *"Multiply the order financed payment amount by the adjustment factor (xxx.xx% of Payment Amount)."*
  2. *"Multiple the result of step 1 by the commission adjustment percentage (xxx.xx% for Commission Adjustment)."*

  i.e. `commission_adjustment = financed_amount × pct_of_financed_amount × pct_for_commission_adjustment`

- **Worked example, verbatim:** plan = 36 months equal payments; `% of Payment Amount` = 17%;
  `% for Commission Adjustment` = -12.5%; Amount Financed = $1258.95.
  `Adjustment Factor = $1258.95 * 17% = $214.02`; `Commission Adjustment = $214.02 * -12.5% = $-26.75`.
  **Note the double-percentage structure: the second percentage is applied to the fee, not to the sale.**
  A naive reading ("17% fee, 12.5% commission hit") gives a wildly different number. This is the single
  easiest thing to get wrong when porting.
- **Hard rule — class restriction.** *"NOTE: At this time, this feature is available for **class 4
  (financing) payment types** only."* `class 4` is an exact enum value in STORIS's payment-class taxonomy.
- **Commission records are created at the time of order completion** — not at order entry, and not at
  payment settlement. Timing matters for period cutoffs.
- Commission lines for payment types with adjustment rates appear on the **Sales Commission Report**.
- Note the field is called `% of Financed Amount` in its own label but `% of Payment Amount` in the
  formula text — **STORIS uses the two names interchangeably in the same article.**

**Dependencies.**
- Financing Payment Plan Settings; `CUST-044` Desjardins Configuration (part A).
- Payment class taxonomy (`class 4 = financing`) — see `CUST-093`, `CUST-103`, `CUST-123`.
- Commission engine: `CUST-120` Salesperson Settings, `CUST-128` Spiff Table Settings,
  `CUST-096` (line vs subtotal discount commission asymmetry), Report Sales Commissions.
- `CUST-114`/`CUST-115` revolving plan and fee settings.

**Build notes.**
- Implement as a rate pair on the finance plan: `(finance_fee_pct, commission_adjustment_pct)` with the
  two-step multiplication above, and **store the computed adjustment on the commission record with both
  input rates snapshotted**, so a later rate change does not retroactively restate historical commission.
- **Do differently — this is really "pass a share of the finance cost to the salesperson."** Model it that
  way with a single, clearly-named `commission_share_of_finance_cost_pct` and derive the finance fee from
  the actual finance plan rather than re-keying it. Re-keying the finance company's discount rate in a
  commission screen means it drifts from the real contract.
- Signed adjustments: keep support for positive (bonus for promoting a plan) and negative (clawback).
- Every rate change here is a compensation change — **must** feed `RPT-AUDIT`, and should be
  effective-dated so mid-period changes are unambiguous.
- `[DECISION NEEDED]` Confirm whether LA Mattress commission should be affected by finance costs at all.
  If sales staff cannot choose the finance plan, penalising them for its cost is unfair and will be
  disputed.

---

### `CUST-103` Payment Type Override Settings
*storis_ref: article 15242595231636*

**Purpose.** Lets you override, for an **individual payment type**, the default bank-reconciliation
*deposit type* that was set at the **payment class** level on the bank record.

**Where it lives.** `Action` buttons at the `Deposit Type Code` field in **Bank Settings**.
**Used only if the Bank Reconciliation feature is active on your system.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (grid) payment types | display grid | All payment types within the specified payment class; existing overrides show in the `Deposit Type` column. |
| `Deposit Type` | code (above the grid) | The override deposit type for the selected payment type. Double-click a grid row to edit. |

**Behavior & rules.**
- Two-level resolution: **bank + payment class → default deposit type** (set in Bank Settings,
  Reconciliation tab); **bank + payment type → override** (set here). Most-specific wins.
- **Hard rule — removals are not retroactive.** *"Note that removing existing overrides applies only to
  future transactions."* Already-posted transactions keep the deposit type they were stamped with.
  (Implicitly, the deposit type is **snapshotted onto the transaction at post time**, not resolved at
  reconciliation time — good, and worth copying.)
- Overrides are **per bank** — the same payment type can map differently at different banks.

**Dependencies.**
- Bank Settings → Reconciliation tab (`Deposit Type Code`, per payment class defaults).
- `CUST-110` Reconciliation Deposit Type Settings — defines the deposit types themselves.
- `CUST-111` Reconciliation Transaction Type Settings.
- Payment class / payment type taxonomy (`CUST-093`, `CUST-102` class 4, `CUST-123` Settlement Type).
- Bank Reconciliation feature flag.

**Build notes.**
- Implement the resolver as an ordered lookup: `(bank_id, payment_type_id)` → `(bank_id, payment_class)` →
  null. This is a small, well-behaved instance of the general most-specific-scope-wins pattern we are
  building; reuse the same resolver rather than special-casing it. Add `BANK` and `PAYMENT_CLASS` to the
  scope list alongside `COMPANY`, `VENDOR_REMIT_TO`, `VENDOR_REGION`, `TERMS_CODE`, `PRODUCT_CATEGORY`.
- **Copy the snapshot-at-post-time behaviour deliberately** — reconciliation must be reproducible; never
  re-resolve deposit type at reconcile time.
- Config changes here move money between reconciliation buckets — feed `RPT-AUDIT`.

---

### `CUST-104` Percentage Break Level Table
*storis_ref: article 15242631136532*

**Purpose.** Establishes the **revolving APR break-level table** that determines the base interest rate
applied to a revolving plan balance, either as a single rate or as **tiered** rates across balance bands.

**Where it lives.** `Revolving Payment Plan Settings > Actions button > Percentage Break Level Table`
(`CUST-114`). **NOTE: it can be opened read-only — the screen looks identical to the editable version but
the fields cannot be edited**, which is an easy support-call generator.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Break Level` | money | Lower bound of a balance band; **"The level represents the revolving balance subject to finance charges."** |
| `Percentage Rate` | percent (APR) | Base annual rate for that band. |

**Behavior & rules.**
- **Hard rules on table shape (all quoted):**
  - *"This table must be built in **ascending Break Level order** and is **required**."*
  - *"**At least one Break Level and corresponding Percentage Rate must be established.**"*
  - *"**The first level is entered as zero (0.00)**, with each subsequent setting increasing the level and
    decreasing the percentage."* — **levels ascend, rates descend; a non-monotonic table is not
    contemplated.**
  - *"The first level and percentage rate are established **automatically** when you enter the
    `Percentage Rate` field in Revolving Receivables Payment Plans."* The row-1 rate is therefore the plan's
    headline rate, mirrored into this table.
- **Variable-rate plans:** *"If the plan you are creating/editing is a variable rate plan and you have the
  `Use Prime Interest Rate` field checked, interest is calculated using the **prime interest rate from the
  Revolving Receivables Control Settings plus the base rate from this Percentage Break Level Table**."*
  → `effective_apr = prime_rate + break_level_base_rate`.
- **Tiered vs non-tiered — and the switch lives somewhere unexpected.**
  **The `Use Tiered Interest Rates` field is in `Sales Tax Settings` (`CUST-119`), not in the revolving
  settings.** This is a genuinely surprising coupling: **interest-calculation methodology is configured on
  the tax jurisdiction record.**
  - **Checked (tiered / marginal):** *"each portion of the customer's balance greater than or equal to a
    break level in the table is charged the associated interest rate."*
  - **Unchecked (flat / cliff):** *"the interest rate is determined using the current plan balance that is
    subject to finance charges and the associated interest rate"* — i.e. the whole balance is charged at
    the single rate for the band the balance falls into.
- **Verbatim worked example — reproduce this as a unit test.** Balance subject to finance charges $6000;
  table: `Level 1 = 0.00, 25.9%`; `Level 2 = $1000.00, 21.9%`; `Level 3 = $5000.00, 18.9%`.
  - Tiered: 25.9% (**2.15833% monthly**) on the first $1000; 21.9% (**1.825% monthly**) on the next $4000;
    18.9% (**1.575% monthly**) on the remaining $1000 → **finance charge $110.33**.
  - Non-tiered: 18.9% (**1.575% monthly**) on the whole $6000 → **finance charge $94.50**.
  - **Monthly rate = APR / 12, carried to 5+ decimal places** (25.9/12 = 2.158333…). Rounding is applied to
    the resulting charge, not to the monthly rate — reproducing $110.33 requires that ordering.
- **The flat mode charges *less* than the tiered mode here ($94.50 vs $110.33)** because rates descend with
  balance. Switching the tax-jurisdiction checkbox silently changes every customer's finance charge.

**Dependencies.**
- `CUST-114` Revolving Payment Plan Settings (parent); `CUST-113` Revolving Classification Settings;
  `CUST-115` Revolving/Installment Fees.
- **`CUST-119` Sales Tax Settings → `Use Tiered Interest Rates`** (the tiering switch).
- *Revolving Receivables Control Settings* → prime interest rate (control-settings parts).
- `CUST-092` (part B) Minimum Finance Charge Table — floors the computed charge.
- `CUST-091` (part B) Minimum Deposit Percentage Table, `CUST-097` Non-Filing Fee Table,
  `CUST-130` Statement Notification Days.

**Build notes.**
- Model `apr_break(plan_id, min_balance, apr)` with constraints: first row `min_balance = 0`, strictly
  ascending, at least one row. **Do not** enforce descending APR — allow it, but warn, since ascending-rate
  tiers are legitimate elsewhere.
- Implement **both** modes explicitly as `interest_mode ENUM('TIERED','FLAT_BY_BAND')` and
  **move it onto the revolving plan, not the tax jurisdiction.** Coupling APR methodology to a tax record
  is a defect we should not inherit.
- Variable rate: store `index_rate_source` + `spread`, compute `apr = index + spread` at charge time, and
  **snapshot the resolved APR, the index value, and the table version onto every finance-charge
  transaction** — this is a Reg Z / TILA disclosure requirement, and STORIS's in-place-editable table
  means historical charges cannot currently be re-derived.
- Rate tables must be **effective-dated and immutable once used**; every change feeds `RPT-AUDIT`.
- Port the two worked examples above as regression tests, including the $110.33 / $94.50 figures.
- `[DECISION NEEDED]` See `CUST-097` — is in-house revolving credit in scope? This whole cluster is heavy
  regulated-lending machinery.

---

### `CUST-105` Price Matrix Usage Codes
*storis_ref: article 15242610698004*

> **TARGETED ARTICLE #1 — the formula enum. This is the authoritative list. It does NOT match the six
> codes in the Inventory pack's `ITEM-042`.**

**Purpose.** Enumerates the valid values of the **`Price Matrix Usage Code`** field in **Customer Price
Settings**, each of which defines the formula used to derive a customer-specific price from a product's
price or cost.

**Where it lives.** Reference article for the `Price Matrix Usage Code` field in **Customer Price Settings**
(the customer-level price matrix). `Factor` refers to the value in the **`Factor`** field on the same
screen. All operands are fields on **Advanced Product Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Price Matrix Usage Code` | enum (8 values, below) | Selects the derivation formula. |
| `Factor` | number — **percent or dollar, determined by the usage code** | The operand. **The same field is a percentage for `* Factor` codes and a dollar amount for `+`, `-`, `=` codes.** |
| `Use Lowest Price` | checkbox | Inactivated by certain usage codes — see below. |

**Behavior & rules — the authoritative enum, verbatim.**

| # | Usage code (exact) | Factor is | Operand (Advanced Product Settings) | Formula |
|---|---|---|---|---|
| 1 | `Price * Factor` | **percentage** | selling price | *"multiply it by the selling price"* → `price × factor%` |
| 2 | `Price - Factor` | **dollar amount** | selling price | *"subtract it from the selling price"* → `price − factor` |
| 3 | `Price + Factor` | **dollar amount** | selling price | *"add it to the selling price"* → `price + factor` |
| 4 | `Price = Factor` | **dollar amount** | selling price | *"substitute it for the selling price"* → `factor` (fixed price) |
| 5 | `Sales Written Cost * Factor` | **percentage** | **average cost** | *"multiply it by the average cost"* → `avg_cost × factor%` |
| 6 | `Sales Written Cost + Factor` | **dollar amount** | **average cost** | *"add it to the average cost"* → `avg_cost + factor` |
| 7 | `Replacement Cost * Factor` | **percentage** | replacement cost | *"multiply it by the replacement cost"* → `repl_cost × factor%` |
| 8 | `Replacement Cost + Factor` | **dollar amount** | replacement cost | *"add it to the replacement cost"* → `repl_cost + factor` |

**Reconciliation against `ITEM-042` (Inventory handoff pack) — CORRECTED AND EXTENDED.**

`ITEM-042` derived six usage codes from an FAQ: *percent of price, less amount, plus amount, percent of
cost, cost plus amount, fixed*. Mapping them onto the authoritative list:

| `ITEM-042` code | Maps to | Status |
|---|---|---|
| percent of price | `Price * Factor` | ✅ confirmed |
| less amount | `Price - Factor` | ✅ confirmed |
| plus amount | `Price + Factor` | ✅ confirmed |
| fixed | `Price = Factor` | ✅ confirmed |
| percent of cost | `Sales Written Cost * Factor` | ⚠️ **confirmed but ambiguous** — see below |
| cost plus amount | `Sales Written Cost + Factor` | ⚠️ **confirmed but ambiguous** — see below |
| — | `Replacement Cost * Factor` | ❌ **MISSING from `ITEM-042`** |
| — | `Replacement Cost + Factor` | ❌ **MISSING from `ITEM-042`** |

**→ `ITEM-042` must be extended from six codes to eight.** The correction is material, not cosmetic:

- **There are TWO distinct cost bases, not one.** `Sales Written Cost` and `Replacement Cost` are separate
  fields on Advanced Product Settings and produce different prices. `ITEM-042`'s generic "cost" collapses
  them and will silently pick the wrong basis.
- **Naming trap — `Sales Written Cost` resolves to the `average cost` field.** The article says the
  `Sales Written Cost * Factor` code *"multiply it by the **average cost** in the Advanced Product
  Settings"*. **The enum label and the operand field name do not match.** Anyone implementing from the
  label alone will look for a "sales written cost" column that is not the one used.
- There is **no `Price / Factor`, no `Cost - Factor`, and no `Cost = Factor`** — subtraction and
  substitution exist only on the price basis; the cost bases support only `*` and `+`.

**Additional hard rules from the article:**
- **Special-order exclusion (hard rule):** *"NOTE: Since special-order products have no replacement cost,
  **do not use the replacement cost options with special-order products**."* This is guidance, **not an
  enforced validation** — STORIS does not block it. A replacement-cost matrix applied to a special-order
  item will compute against a null/zero cost.
- **`Use Lowest Price` auto-inactivation (exact):** *"The following usage codes cause the `Use Lowest Price`
  field in the Customer Price Settings to inactivate:*
  - *usage codes based on cost (for example, `Replacement Cost * Factor`)*
  - *usage codes that cause a price increase, including `Price + Factor` and **`Price * Factor` (provided
    the factor is greater than 100)**"*

  → **`Price * Factor` is conditionally disqualifying: at factor ≤ 100 it is a markdown and `Use Lowest
  Price` stays live; at factor > 100 it is a markup and `Use Lowest Price` inactivates.** The threshold is
  **100**, confirming the factor is expressed as a whole-number percentage (e.g. `90` = 90% of price), not
  a decimal multiplier. **This is the single most useful precision detail in the article — `ITEM-040`/
  `ITEM-041` must treat the factor as percent-of-100, not 0.90-style.**
  → All four cost-based codes (5–8) unconditionally inactivate `Use Lowest Price`.

**Dependencies.**
- **Customer Price Settings** (the parent screen; positions 1–46, part A) — owns `Price Matrix Usage Code`,
  `Factor`, `Use Lowest Price`.
- **Advanced Product Settings** — supplies `selling price`, `average cost`, `replacement cost`.
- `ITEM-040` / `ITEM-041` pricing resolver and `ITEM-042` usage-code enum (Inventory pack) — **`ITEM-042`
  requires correction; see above.**
- `CUST-096` Multiple Line Discounts — discounts apply *after* matrix price resolution.
- `CUST-117` Sales Discount Settings, `CUST-116` Sales Coupon Settings.

**Build notes.**
- Define the enum with **all eight** members and an explicit basis + operator decomposition, which is
  cleaner than STORIS's flat list:
  `basis ENUM('SELLING_PRICE','AVERAGE_COST','REPLACEMENT_COST')` ×
  `operator ENUM('MULTIPLY_PCT','ADD_AMOUNT','SUBTRACT_AMOUNT','SET_AMOUNT')`, with the legal
  combinations being all four for `SELLING_PRICE` and `{MULTIPLY_PCT, ADD_AMOUNT}` for the two cost bases.
  Reject the rest at validation time rather than shipping eight opaque codes.
- **Factor units must be typed.** A single untyped `Factor` field that means percent for two operators and
  dollars for two others is a mispricing waiting to happen. Store `factor_pct` and `factor_amount` as
  distinct nullable columns, or store `factor` plus a derived, displayed unit label. **The UI must show
  `%` or `$` next to the field the moment a usage code is chosen.**
- **Percent scale is 100-based.** `Price * Factor` with factor `90` = 90% of price. Assert `factor > 0`;
  warn above 100 on price basis (it is a markup) and require confirmation.
- **Enforce the special-order rule that STORIS only advises:** block (or hard-warn) replacement-cost bases
  when the product is special-order or has a null replacement cost, and never let a null cost silently
  resolve to `0` — that would price the item at the factor alone.
- **Cost-based customer pricing leaks margin data.** Any user who can see a cost-based matrix result can
  back out cost. Gate cost-basis usage codes behind a cost-visibility permission (`SEC-INV-VIEW-COST`).
- **`Use Lowest Price` interaction:** implement as a derived-disabled state exactly as documented
  (disabled for all cost bases; disabled for `Price + Factor`; disabled for `Price * Factor` when
  `factor > 100`), and **persist the flag's value rather than clearing it**, so re-selecting a compatible
  usage code restores the prior intent.
- Every matrix change is a price change — feed `RPT-AUDIT`, and effective-date the matrix rows so a
  historical order's price can be re-derived.
- `[DECISION NEEDED]` Which cost basis should LA Mattress's cost-plus customer pricing (contract/trade
  accounts) use — moving-average cost or replacement cost? STORIS supports both and they diverge sharply
  in an inflationary mattress market. Recommend **replacement cost** for trade pricing so margin does not
  erode on rising costs, with a documented exception for special-order.

---

### `CUST-106` Printer Settings
*storis_ref: article 15242631136276*

**Purpose.** Defines the system printers available to STORIS, their OS binding, their default form, and
(for Zebra label printers) driver/stock parameters.

**Where it lives.**
- `System Administration > Get Started - Enter Your Information > Get Started Step 2 - Printing > Printer Settings`
- `System Administration > Print System Settings > Advanced Printer Settings > Printer Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Printer Number` | text (name) | **"The printer name must be identical to the name given to the printer in Windows® and is case-sensitive."** Despite being called a *Number* it is a name. |
| `Description` | text | Type or location, e.g. `HP LaserJet 880C`, `Computer Room`, `Accounts Payable Office`. |
| `Standard Form` | form no. | Default STORIS Form for this printer. **"In the case of an administrative printer, this will most likely be zero (0). Examples: Enter 42 for a sales order printer; 60 for purchase orders."** |
| `Physical Printer Number` | fixed literal | The port number. **"The value of `S35` will always be entered in this field."** — a constant masquerading as a field. |
| `STORIS Printer Control` | checkbox | Checked = STORIS enables/disables the printer; blank = managed outside STORIS. |
| `Printer Driver` | lookup | **Available only when configuring Zebra Barcode Printers**; depends on Zebra model. *"Please contact STORIS for assistance with determining which driver is appropriate."* |
| `Continuous Stock` | checkbox | **Zebra only.** Checked = continuous roll with no breaks; blank = die-cut stock with a break between labels. |
| `Use Windows Driver` | checkbox | Route jobs through the installed Windows driver. **Active for Windows-based systems only.** |

**Actions.** `O/S Form Screen` (`CUST-098`).

**Behavior & rules.**
- **Hard rule — edits require a re-initialisation step.** *"NOTE: If you edit this file, you must run the
  **Synchronize OS to STORIS Printers** to re-initialize the configuration."* Changes are not live.
- **The raw-data printing gotcha, quoted.** If **both** of the following are true, *"no formatting is
  applied to the print job and your printer may not be able to format it correctly"*:
  1. the `Document Destination` field in **User Print Settings** is set to `STORIS Form Settings` for the
     logged-on user, **and**
  2. the document type being printed is set to `Standard Print` (or `Form` for some document types).

  The documented remedy is to check `Use Windows Driver`. Document-type print options live on the
  **`Document Type` section of the `Printed Documents` tab of Point of Sale Control Settings**.
- Printer identity is bound to the **case-sensitive Windows printer name** — renaming a printer in Windows
  silently breaks STORIS printing.

**Dependencies.**
- `CUST-098` O/S Form Screen (child), `CUST-107` Printer Zone Settings, `CUST-137` Warehouse - O/S Form List.
- User Print Settings → `Document Destination`, `Printer Zone`.
- Point of Sale Control Settings → Printed Documents tab → Document Type.
- Synchronize OS to STORIS Printers routine.

**Build notes.**
- Do **not** port this model. Modern target: `print_destination(id, label, transport ENUM('IPP','CUPS','ZPL_TCP','PDF_EMAIL','BROWSER'), endpoint, default_document_type)` with **no dependency on the host
  OS printer name** and **no re-sync step** — configuration must take effect immediately.
- Keep the Zebra/ZPL specifics (`continuous vs die-cut stock`) — mattress law-tag and warehouse label
  printing genuinely needs them — but express them as label-media profiles, not driver names.
- **Do differently:** never produce an unformatted raw job as a silent failure mode. Render server-side to
  PDF/ZPL and send bytes the device can definitely handle.
- Retain the *concept* of a default form per destination.

---

### `CUST-107` Printer Zone Settings
*storis_ref: article 15242631137172*

**Purpose.** Groups logical printers into named **zones**, so the same form can be printed to more than one
printer in a location, and so **user access to printers can be restricted by zone**.

**Where it lives.** `System Administration > Print System Settings > Advanced Printer Settings > Printer Zone Settings`
Support files: `Create a User`, `Warehouse/Store Location Settings`, `Printer Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Printer Zone` | name (key) | Zone name. Search button lists existing zones. |
| `Description` | text | Zone description. |
| `Logical Printers` | multi-select | Printers in this zone. Search lists logical printers; **`Action` button opens the `Multiple Printer Selection` window**. The entry screen behind `Action` takes the `Printer number` from `CUST-106` Printer Settings for each printer. |

**Behavior & rules.**
- **Zones are optional** — *"Printer zones are necessary only if you want to print the same form to more
  than one printer in the same location."* But they double as an **access-control mechanism**:
  *"You can also use printer zones to restrict user access to specific printers."*
  Example given: sales people get the `SALES` zone but not the `REPORT` zone.
- **Hard rule — the runtime workflow is per-logon and manual.** *"users then need to select a printer zone
  at the `Printer Zone` field in the **User Print Settings**, and then select a printer from the **Printer
  Definitions** screen **whenever they log on to the system**."* **Printer selection is not persisted
  across sessions** — every logon requires re-selection. This is a well-known operational annoyance and a
  source of misprinted confidential documents.
- Zone assignment to users happens in `Create a User`.

**Dependencies.**
- `CUST-106` Printer Settings; `CUST-098` O/S Form Screen; `CUST-137` Warehouse - O/S Form List.
- Create a User / user group (zone assignment) — see `parts/user-security-CATALOG.md`; note that
  printer-zone restriction is **not** a permission flag and is therefore **not** subject to the global
  **Extended Security** kill-switch. Worth confirming — it is one of the few access controls that appears
  to work independently of it.
- Warehouse/Store Location Settings; User Print Settings.

**Build notes.**
- Keep zones as a routing + access concept: `print_zone(id, name)` ⟷ `print_destination` many-to-many, and
  grant zones to roles/users.
- **Do differently — persist the user's printer choice** per (user, workstation, document class), with a
  sensible default derived from the user's store/warehouse. Re-selecting every logon is unacceptable and is
  the direct cause of documents landing on the wrong printer.
- **Do differently — route by document class, not by user memory.** Pick tickets → warehouse zone,
  invoices → front desk, law tags → label printer, automatically.
- Printer zones should be scoped to store/location so a multi-store rollout does not need one flat global
  namespace.

---

### `CUST-108` Problem Code Settings
*storis_ref: article 15297959793684*

**Purpose.** Defines **service problem codes** used in Service Order entry to classify why merchandise
needs servicing, plus up to four scripted prompt questions that guide the person taking the call.

**Where it lives.**
- `System Administration > System Settings > Customer System Settings > Sales and Service System Settings > Problem Code Settings`
- `Merchandising and Distribution > Settings > Service Settings > Problem Code Settings`
- `Customer > Customer Service > Settings > Problem Code Settings`
- `Customer > Settings > Service Settings > Problem Code Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Problem Code` | code, **up to 5 characters** | Represents the problem causing the service need. Search to find an existing code. |
| `Description` | text | **Length is stated inconsistently in the article — the intro says "an associated sixteen character description field", the field help says "Up to 20 characters may be entered".** Example: code `MISPT` → description `MISSING PART`. **This text prints on work orders, trip sheets, and the vendor charge-back report.** |
| `Question 1` – `Question 4` | text, optional ×4 | Questions displayed on screen when this problem code is entered during service order creation. *"used as prompts to the operator entering the call, reminding them to obtain specific information from the customer regarding the problem."* |

**Behavior & rules.**
- **Documentation conflict on description length (16 vs 20 characters) — resolve against the live schema
  before migrating data.** Either way the field is far too short: it feeds the **vendor charge-back
  report**, i.e. it is the text a vendor sees when we bill them for a defect.
- The four questions are **prompts only** — nothing indicates the answers are captured, stored, or
  validated. **The scripted questions produce no structured data.** That is a significant miss: the
  answers are exactly the diagnostic data needed for warranty claims and vendor quality analysis.
- No expiry/inactive flag, no severity, no default resolution, no linkage to a product category or vendor.

**Dependencies.**
- Enter a Service Order; work orders; trip sheets; **vendor charge-back report**.
- `CUST-131` Status Code Settings, `CUST-126` Special Comment Settings — sibling service taxonomies.
- `CUST-095` Move Customer Purchase History for Completed Order — the service-order path that re-attributes
  purchase history.
- Serial number registry (warranty lookback) — see the **addresses have no versioning** finding.

**Build notes.**
- Model `problem_code(code, description, active_from, active_to, default_severity, applies_to_category[])`
  with a **generous description length (120+ chars)** and separate short/long forms for print vs screen.
- **Do differently — make the scripted questions structured.** Define
  `problem_code_question(problem_code_id, seq, prompt, answer_type ENUM('TEXT','BOOL','ENUM','PHOTO'), required)`
  and **store the answers on the service order**. Mattress-specific example: body impression depth is a
  measured value with a warranty threshold — it must be a number with a photo, not a verbal reminder.
  This is the highest-value improvement in this article.
- Photo capture at intake should be first-class (warranty denial defence).
- Map problem codes to vendor charge-back categories explicitly rather than relying on free text.
- `[DECISION NEEDED]` Agree the mattress-defect taxonomy (body impression, sagging, seam failure, fill
  migration, law-tag/hygiene, comfort exchange, delivery damage) and the measurement thresholds per vendor,
  before building the question sets.

---

### `CUST-109` Receivables Activity Type Settings
*storis_ref: article 15242631134228*

**Purpose.** Lets you attach **your own descriptions** to STORIS's built-in receivables transaction
activity codes (installment, revolving and open-item). It does **not** let you create activity types.

**Where it lives.** Six paths:
- `Accounting > Receivables > Receivables Settings > Receivables Activity Type Settings`
- `Accounting > Settings > Revolving Receivables Settings > Receivables Activity Type Settings`
- `Accounting > Settings > Installment Receivables Settings > Receivables Activity Type Settings`
- `System Administration > System Settings > Accounting System Settings > Accounts Receivables System Settings > Receivables Activity Type Settings`
- `System Administration > System Settings > Accounting System Settings > Revolving Receivables Settings > Receivables Activity Type Settings`
- `System Administration > System Settings > Accounting System Settings > Installment Receivables Settings > Receivables Activity Type Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Activity Code` | code (select only) | The code to edit. **Once specified, the STORIS standard description displays to the right of the entry box** (read-only). |
| `User Defined Description` | text, **up to 40 alphanumeric characters** | Your override description. `Action` button opens **`Description Field - Language Translation Entry`**. |

**Behavior & rules.**
- **Hard rule — closed enum.** *"The activity codes are created by STORIS and each one has a STORIS
  standard description. **You cannot create new codes using this process.**"* The receivables activity
  taxonomy is fixed by the vendor; only labels are customer-editable.
- Two descriptions coexist per code (standard + user-defined). **The article does not state which one wins
  on statements, reports, or the GL** — a real ambiguity to resolve against the live system before
  migrating.
- Localizable via the translation entry screen.

**Dependencies.**
- Installment, revolving and open-item receivables ledgers.
- `CUST-111` Reconciliation Transaction Type Settings (analogous but *open* enum), `CUST-110` Reconciliation
  Deposit Type Settings.
- `Description Field - Language Translation Entry` (shared with `CUST-101`).

**Build notes.**
- We control our own schema, so the STORIS constraint disappears: define our receivables activity types as
  **our own closed enum in code** (posting logic depends on them — they must not be user-extensible) with a
  **user-editable display label** per locale in a side table. That reproduces the useful half of this
  screen without the vendor lock-in.
- Make the precedence explicit and documented: **user label wins everywhere customer-facing; the canonical
  code is what appears in the GL, exports and audit.**
- Never let a label edit alter posting behaviour; label changes still feed `RPT-AUDIT` (they change what
  customers see on statements).

---

### `CUST-110` Reconciliation Deposit Type Settings
*storis_ref: article 15242663219220*

**Purpose.** Creates the **bank reconciliation deposit types** used to categorise bank deposits.

**Where it lives.** `Accounting > Payables > Reconcile Bank Transactions > Settings > Reconciliation Deposit Type Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Bank Deposit Type Code` | **two-digit** code | The deposit type code. Search lists existing codes. |
| `Description` | text, **up to 20 alphanumeric characters** | Description of the deposit type. |

**Behavior & rules.**
- **Referential-integrity rule:** *"You can create as many as you want, but **you cannot remove any records
  that are currently in use by any bank or payment type record**."* — deletion is blocked by *configuration*
  references (bank records, payment type records), **not** by transaction history. Contrast `CUST-111`,
  where deletion is blocked unconditionally and forever.
- **Two digits gives a maximum of 100 deposit types** — a hard capacity ceiling.
- No activation/expiry dates; no GL account of its own (the GL side comes from the bank / transaction type).

**Dependencies.**
- Bank Settings → Reconciliation tab (`Deposit Type Code` per payment class).
- `CUST-103` Payment Type Override Settings (per-payment-type override).
- `CUST-111` Reconciliation Transaction Type Settings → `Requires Deposit Type Code`.
- Reconcile Bank Transactions; EOD Close.

**Build notes.**
- Straightforward reference table: `deposit_type(code, description, active_from, active_to)`.
- **Do differently:** use an unbounded slug key rather than a 2-digit code, and **retire rather than
  delete** — blocking delete only on live config references means a type still stamped on historical
  transactions can be deleted once the config stops pointing at it, orphaning history. Block on *any*
  reference, config or transactional, and offer retirement.

---

### `CUST-111` Reconciliation Transaction Type Settings
*storis_ref: article 15242663219092*

**Purpose.** Creates **bank reconciliation transaction types** used (a) when keying manual reconciliation
records via *Enter a Reconciliation Transaction*, and (b) to match **BAI codes** on imported bank data
during automatic clearing.

**Where it lives.** `Accounting > Payables > Reconcile Bank Transactions > Settings > Reconciliation Transaction Type Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Bank Reconciliation Type Code` | code, **up to five digits** | The transaction type code. Search lists existing types. |
| `Description` | text, **up to 30 alphanumeric characters** | Description. |
| `Short Description` | text, **up to 10 alphanumeric characters** | Used for totals and summary lines on the **Report Reconciliation Transactions** routine. |
| `General Ledger Account` | GL account, optional | **"the default GL account number (if any) you want to use to offset the 'Cash in the Bank' post."** |
| `Post to General Ledger` | checkbox | Defaults the `Post to General Ledger` check-mark in *Enter a Reconciliation Transaction* when this type is used. Blank = default unchecked. |
| `Requires Deposit Type Code` | checkbox | When checked, the `Deposit Type Code` field **activates and becomes mandatory** in *Enter a Reconciliation Transaction*. |
| `Requires Transfer Bank` | checkbox | When checked, the `Transfer Bank` field activates and a second bank ID **must** be entered. **"Note that the system generates two reconciliation records to represent each transfer."** |
| `Auto Reconcile to BAI` | multi-select BAI codes | One or more BAI codes associated with this transaction type. `Action` button lists BAI codes. |

**Behavior & rules.**
- **Hard rule — transaction types are permanent.** Stated twice: *"you cannot remove any bank
  reconciliation transaction types once you create them."* **No reference check, no retirement, no
  expiry — a typo'd code is in the system forever.** (Compare `CUST-110`, which at least checks references.)
- Pre-loaded records exist and **can be edited** but not removed.
- **Auto-reconciliation matching, quoted:** *"The Import Bank Transactions with Automatic Reconciliation
  process uses this field to assist in reconciling transactions. **If one of the BAI codes from the bank's
  transaction record matches the transaction type, an automatic reconciliation occurs for the transaction.
  If not, the system writes an error message to the Report Reconciliation Errors routine.**"*
  → unmatched bank transactions fail to an error report; they are not queued for manual review in-line.
- **Hard rule — conditional mandatory field.** *"If any bank in your system is set to auto reconcile, this
  field is mandatory."* Turning auto-reconcile on for **one** bank retroactively makes `Auto Reconcile to
  BAI` mandatory on **every** transaction type, system-wide. A single bank's setting changes validation
  everywhere.
- Transfers are modelled as **two reconciliation records**, generated by the system.
- `Post to General Ledger` here is only a **default**, overridable per transaction — so the same
  transaction type can sometimes post and sometimes not.

**Dependencies.**
- `CUST-110` Reconciliation Deposit Type Settings (`Requires Deposit Type Code`).
- `CUST-103` Payment Type Override Settings; Bank Settings (incl. per-bank auto-reconcile flag, Bank Override).
- Enter a Reconciliation Transaction; Import Bank Transactions with Automatic Reconciliation;
  Report Reconciliation Transactions; Report Reconciliation Errors.
- Chart of accounts (`General Ledger Account`).
- BAI code list (industry standard bank transaction codes).

**Build notes.**
- Model as `bank_txn_type(code, description, short_description, gl_account_id, post_to_gl_default,
  requires_deposit_type, requires_transfer_bank, bai_codes[], active_from, active_to)`.
- **Do differently — permit retirement.** Never ship a table where a mistyped row is immortal. Enforce
  "cannot delete if referenced" and add `active_to` for retirement.
- **Do differently — make BAI mapping mandatory only where auto-reconcile is actually used**, i.e. scope
  the requirement to (bank × transaction type), not globally. The global-mandatory rule is a migration
  landmine: enabling auto-reconcile on one account blocks saving unrelated types.
- Unmatched imports should land in a **manual-match work queue** with suggested matches, not an error
  report. Auto-reconciliation quality is measured by how good the exception queue is.
- Transfers: keep the two-record model (it is correct double-entry), but link the pair with a
  `transfer_group_id` so they can never be reconciled independently.
- `post_to_gl` being a *default* rather than a property means the same type can produce inconsistent GL
  impact — **log every override to `RPT-AUDIT`**.

---

### `CUST-112` Referred By Settings
*storis_ref: article 15242663218068*

**Purpose.** Maintains the list of **customer referral sources** (friends, organizations) that appear in
lookup windows at `Referred By` prompts throughout STORIS.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Sales Lead System Settings > Referred By Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Referral Flag` | code, **up to 6 characters** | Code for this referral source. |
| `Description` | text | Description of the referral source. |

**Behavior & rules.**
- Thin article — a two-field reference table with no stated validation, no default, no expiry, no
  uniqueness rule beyond the implicit key, and no translation action (unlike `CUST-101`/`CUST-109`).
- **Carried-forward finding — attribution is overwritten, not appended.** `Referred By` is one of the
  customer-level attribution fields subject to this. **A customer referred by Jane in 2022 and by Bob in
  2025 retains only Bob.** There is no referral history, no date, and therefore **no reliable basis for a
  refer-a-friend reward programme** (see `CUST-087` Membership Reward Settings, part B).
- Note this is a *free-text-ish taxonomy* — an individual referring friend cannot be identified; only a
  category code. Referring **customer** identity is not captured here at all.

**Dependencies.**
- Sales Lead System Settings; `Referred By` prompts on the customer master and lead entry.
- Sibling attribution taxonomies: `CUST-101` Order Source Settings, `CUST-118` Sales Lead Origin Settings,
  `CUST-086` Marketing Code Settings (part B). See the consolidation recommendation in `CUST-101`.

**Build notes.**
- Fold into the single `attribution` table with `dimension = 'REFERRAL'` (see `CUST-101`).
- **Do differently — make referral an event, not a field.**
  `customer_attribution_event(customer_id, dimension, value_id, referring_customer_id NULL, captured_at,
  captured_by, source_channel)`, append-only. This fixes the overwrite problem for all four taxonomies at
  once and is a prerequisite for any referral-reward or true first-touch/last-touch reporting.
- Capture the **referring customer's ID** where the referrer is an existing customer — that is the whole
  point of a refer-a-friend programme and STORIS cannot express it.
- 6 characters is too short; use a slug.

---

### `CUST-113` Revolving Classification Settings
*storis_ref: article 18106520558996*

**Purpose.** Creates **Classification Codes** for revolving payment plans. Assigning a classification to a
customer and to a plan **restricts which revolving plans that customer can be offered** — a customer-level
eligibility segmentation for in-house credit.

**Where it lives.** `Menu > Revolving Classification Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Classification Code` | code, **max 3 alphanumeric characters**, **required** | The classification code. Enter or look up. |
| `Description` | text, **up to 30 characters**, **required** | Description. **"Select the extra action button for multi-lingual translation."** |

**Behavior & rules.**
- Codes are assigned in **`Customer Credit Scoring Information`** (customer side) and in
  **`Revolving Payment Plan Settings`** (plan side — see `CUST-114` `Classification` field).
- **Hard rule — referential protection:** *"Note: Classification codes cannot be deleted if they are
  assigned to any customer or revolving plan."*
- **3 characters is a very tight key space** for a segmentation dimension.
- **This is the closest thing in this part to a customer-level eligibility category** — see the
  Price Category note in `CUST-137a` (targeted-topic findings section at the end of this file).

**Dependencies.**
- `CUST-114` Revolving Payment Plan Settings → `Classification`, `Exclude from General Use`.
- Customer Credit and Scoring Information (customer master, credit block).
- `CUST-104` Percentage Break Level Table; `CUST-115` Revolving/Installment Fees.

**Build notes.**
- Model as `credit_classification(code, description, active_from, active_to)` with i18n descriptions; use a
  slug key, not 3 chars.
- Enforce delete-protection as a FK plus retire-instead-of-delete.
- **Fair-lending caution:** a classification code that gates which credit plans a customer may be offered is
  a **credit-eligibility decision**. Under ECOA/Reg B it must be based on documented, non-prohibited
  criteria, and adverse decisions require adverse-action notices. **The classification assignment must be
  audited (`RPT-AUDIT`: who assigned it, when, on what basis) — STORIS records none of this.**
- `[DECISION NEEDED]` If in-house revolving credit is out of scope (see `CUST-097`), this and
  `CUST-104`/`CUST-114`/`CUST-115` go with it.

---

### `CUST-114` Revolving Payment Plan Settings
*storis_ref: article 15242663218836*

**Purpose.** Creates and maintains **Revolving Receivables payment plans** — the full definition of an
in-house revolving credit offer: minimum-payment method, interest, fees, GL posting, promotional terms,
plan-to-plan transfer, and eligibility restrictions. **This is the largest and most rule-dense article in
this part.**

**Where it lives.** `Accounting > Settings > Revolving Receivables Settings > Revolving Receivables Payment Plans`
Tabs: `General`, `Advanced`, `Restrictions`, `eSTORIS`.
**NOTE: reached from an inquiry routine (e.g. `View a Customer's Revolving Statement`) it opens read-only —
identical fields, not editable.**

**Header field**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Revolving Plan` | code, **up to 5 alphanumeric characters** | Plan code. Search opens the Read-Only Lookup Window. |

#### General tab

| Field | Type | Purpose / business rule |
|---|---|---|
| `Description` | text, **up to 30 chars** | `Action` button → Language Translations. |
| `Calculate MMP` | enum — **6 exact values, see below** | How the Minimum Monthly Payment is computed. |
| `Fixed Term Months` | integer | Term length. **Active and mandatory only for `As a Fixed Term` and `Per Sales Order Using a Fixed Term`.** |
| `Minimum Term Months` | integer **1–99** | **Mandatory if `Calculate MMP` = `As a Fixed Amount`.** Must be less than the maximum. |
| `Maximum Term Months` | integer **1–99** | **Mandatory if `Calculate MMP` = `As a Fixed Amount`.** Must be greater than the minimum. |
| `Lowest MMP allowed` | money, optional | Floor for the MMP — see rules. |
| `Percent of the Balance` | percent | Used when `Calculate MMP` = `Using a Percentage`. **Calculated on the total revolving balance — "includes long term & short term revolving receivables".** |
| `Percent Rate` | percent, **mandatory** | Base interest rate. See interlock with `CUST-104`. |
| `Use Prime Interest Rate` | checkbox | Prime (from Revolving Receivables Control Settings) **+** base rate from the Percentage Break Level Table. |
| `Calculate Interest on` | enum: `Monthly Balance` \| `Average Daily Balance` | **Default = `Average Daily Balance`.** Evaluated at cycling time. |
| `Print Credit Agreement` | checkbox | Print the credit agreement. |
| `Print Addendum Form` | checkbox | Print the addendum form; requires `Addendum Form Name`. |
| `Addendum Form Name` | ELP template lookup | Revolving Plan ELP form template (Design Enhanced Laser Forms). **Mandatory only when `Print Addendum Form` is checked.** |
| `Charge Late Fees` | checkbox | Assess late fees on late monthly payments. Unchecked = no late fees. |
| `Subject to Paper Statement Fee` | checkbox, **default unchecked** | Reviewed during revolving cycling. |
| `Receivables` (GL) | GL account, **mandatory** | Long-term receivables posting. `Action` → GL Account Entry Screen (account + optional cost center). |
| `Earned Interest` (GL) | GL account, **mandatory** | **Earned (paid)** interest posting. |
| `Unearned Interest` (GL) | GL account, **mandatory** | **Unearned (cycled)** interest posting. |
| `Exempt from Insurance Charges` | checkbox, **default unchecked** | **When exempt, an insurance plan cannot be added to the revolving plan.** |
| `Activate in Sales Order` | checkbox | If unchecked, **the plan is unusable as payment in order entry.** |
| `Payment Agreement` | checkbox | **Active only if `Allow Payment Agreement` in Revolving Receivables Control Settings is checked.** |
| `Can be used to Purchase Gift Certificates/Cards` | checkbox | Permits financing gift cards on this plan. |
| `Allow Deferment` | checkbox, **default checked** | When unchecked, payments are **not displayed in the Plan Deferment process and are not deferred by Import Revolving Plan Deferments**. |
| `Customer Credit Review` | enum — **3 exact values** | Hold-code policy — see below. |

**`Calculate MMP` — the six exact enum values and their rules:**

1. **`Using a Percentage`** — *"The MMP can vary each month… the system uses the percentage indicated in the
   `% of the Balance` field."*
2. **`As a Fixed Term`** — *"The MMP does not change each month; it is a 'fixed' amount, determined when the
   order is written… calculated based on the interest rate, principal amount, and term (number of months)."*
   **Requires `Fixed Term Months`. "Payments to this type of plan are applied to the oldest invoice first."**
   **Add-on ratchet rule (hard, asymmetric, quoted):**
   - *"If the customer has a balance and then adds another purchase to the plan, and the MMP needs to
     increase in order to pay off the order in the fixed term time frame, the MMP is increased."*
   - *"If the customer has a balance, adds another purchase to the plan, and the new balance would cause the
     MMP to be calculated at a lower amount, **the MMP is NOT changed**. In most situations, the MMP is not
     recalculated if the result is a lower amount."*
   - *"However, if the customer had a balance, **paid it down to a zero balance**, and then adds a purchase
     to the plan, the MMP is recalculated based on the new plan balance. In this situation, the MMP could
     potentially be lower than the original MMP."*
   → **MMP is a one-way ratchet upward, released only by reaching a zero balance.**
3. **`Per Sales Order`** — MMP calculated per completed sales order.
   **Partial-completion rule (quoted, applies to this value and to value 6):** *"When a sales order is
   partially completed, the MMP amount is updated for each completion so that the customer total MMP amount
   for the sales order is as defined on the Revolving Worksheet. Once all deliveries on the order are
   completed, the system sets the MMP for the last partial shipment to the full amount of the MMP and
   **resets the previous shipments' MMPs to zero**. When payments to multiple invoices for the same order
   are received, the payment amount is **evenly divided and applied to each invoice**, based on the total
   MMP amount."*
4. **`Using a Fixed Table`** — *"the minimum monthly payment is a fixed amount each month, and is based on
   the **amount being financed rather than the term**. The system uses the **Finance Level/MMP Table**."*
   (Accessed via `Actions`.)
5. **`As a Fixed Amount`** — MMP manually entered using a grid of monthly terms and projected MMP amounts as
   a guideline. **Activates `Minimum Term Months` / `Maximum Term Months`.**
   *"a Fixed MMP Amount plan with a minimum monthly term set to 6 and the maximum monthly term set to 24
   months displays a grid with months 6 through 24 and their corresponding MMP amounts. The MMP amounts
   that are displayed in the grid are defined as **including the principal, interest and insurance
   amounts**."*
   (Note the article names this value inconsistently — `As a Fixed Amount` in the enum, `As a Fixed MMP
   Amount` in the `Finance Level/MMP Table` action description.)
6. **`Per Sales Order Using a Fixed Term`** — MMP calculated automatically per completed sales order from the
   financed amount and the plan's term. **`Fixed Term Months` entry is mandatory.** Same partial-completion
   rules as value 3.

**`Customer Credit Review` — three exact values:**
- `No Credit Check` — *"New pending plans do not go on revolving credit hold."*
- `Revolving Hold` — *"The system checks the amount financed on the sale against the **Revolving Credit Hold
  Amount** in Revolving Receivables Control Settings, if the amount is greater, the order is placed on
  **F1 credit hold**."*
- `Unconditional Hold` — *"All new pending revolving plans are placed on **F1 credit hold**."*

**Interest / MMP interlocks (hard rules):**
- **`Percent Rate` ⟷ `CUST-104` Percentage Break Level Table are mutually exclusive controls:**
  *"Once you enter the percentage here, the Percentage Break Level Table is automatically updated with a
  break level of 0 and the rate you entered here. **If you add levels and rates to the Percentage Break
  Level Table, this field becomes inactive.**"* Adding a second break level permanently disables the plain
  rate field.
- `Use Prime Interest Rate` checked → `prime (Revolving Receivables Control Settings) + base rate (break
  level table)`. Unchecked → the table rate alone.
- **`Lowest MMP allowed` floor:** *"During cycling, the MMP amount is calculated based upon your **Sales Tax
  Settings** and plan settings and then compared with the value you entered here. If the calculated MMP is
  lower than the amount in this field, the amount you entered here is used."*
  **Note the MMP calculation reads Sales Tax Settings — the same screen that holds `Use Tiered Interest
  Rates` (`CUST-104`, `CUST-119`). Tax settings are load-bearing for credit math.**
- **`Lowest MMP allowed` edits are not retroactive:** *"only new customer revolving financing is affected by
  this change. Pending or active revolving plans entered for a customer before you edited the lowest MMP
  are not affected."*
- The minimum MMP can be overridden at `Enter a Customer's Revolving Terms & Conditions` with the
  **`Revolving Terms and Conditions - Override Lowest MMP Allowed Restriction`** permission
  (Create a User/Group Actions - Receivables Security).

#### Advanced tab — promotions and plan transfer

**NOTE (hard rule, quoted):** *"If you change or add a promotion via the fields on this tab for an existing
payment plan, **only newly activated customer plans are affected**. New orders entered for customer plans
that were active prior to your edits are not affected by the new/modified promotion settings."*
→ **Promotion terms are snapshotted onto the customer plan at activation.**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Allow Other Plans to Transfer to this Plan` | checkbox, **default unchecked** | Makes this plan a valid *Transfer To* target. **"Once this box is checked and there are plans set to transfer to this plan, you cannot clear this check box."** |
| `Transfer Balance to Plan` | plan code | Destination plan for **delinquency** transfer. Search lists only plans flagged as Transfer To. |
| `Days Late` | integer | Days a payment must be late before the balance transfers. **"When customer accounts are cycled, customer revolving plans are evaluated to determine if they are delinquent. If they are eligible to be transferred, they are automatically transferred."** |
| `Transfer Balance to Plan When Promotion Expires` | plan code, optional | **Active only if a promotional `Percentage` is specified.** Blank = no transfer at promo end. |
| `Post MMPs for Balances Transferred from this Plan` | checkbox | Post MMPs for transferred-out balances. |
| `Percentage` (Promotional Interest) | percent | Promotional rate. **Entering a value activates the following fields.** |
| `Expires` | date | Promo end date. **If entered, `Expires on the Cycle Date` is inactive.** After this date the system reverts to the General-tab rate. |
| `Valid Days` | integer | Alternative to `Expires`. **"If you entered a `Percentage`, you must enter either a number of days in this field or an expiration date in the `Expires` field."** (exactly one required) |
| `Expires on the Cycle Date` | checkbox, **default unchecked** | **Active only with `Percentage` + `Valid For __ Days`.** Checked → the promo expiry for each order posted to the plan is **the first cycle date after the end of the promotional interest period**. Unchecked → expiry = **transaction date + Valid For Days**. **"If you remove the `Percentage` or the `Valid For Days`, this field is cleared."** |
| `Until` (No Payments) | date | End of the "no payments due" period; normal cycling resumes on this date. |
| `Number of Days` (No Payments) | integer | Used if `Until` is blank. |

#### Restrictions tab

*"Use this tab to define a period during which the plan is valid and to define plan restrictions by
corporate or franchise store (if franchising is active), individual store location, state and/or minimum
credit score."*

| Field | Type | Purpose / business rule |
|---|---|---|
| `Minimum Credit Score` | whole number **> 0**, optional | Plan restricted to customers at or above this score. |
| `Maximum Credit Score` | whole number **> 0**, optional | At or below this score. **Must exceed the minimum if one is set.** **"the credit score for the customer or co-applicant (whichever is higher) is compared to this score. If the score is higher than the maximum defined, the plan is not available for use."** |
| `Minimum Deposit Amount` | money, **max 999999.99**, optional | **"a deposit must be added to the order prior to the entry of the revolving plan. If the minimum deposit amount has not been met, the plan is not available for use."** |
| `Minimum Deposit Percentage` | table (Action button) | Opens the **Minimum Deposit Percentage Table** (`CUST-091`, part B): min credit score → percentage. **"the system uses the customer or co-applicant (whichever is higher) credit score… The percentage is multiplied by the order net total."** |
| `Classification` | code, optional | Revolving Classification Code (`CUST-113`). **"when a classification code is entered, the revolving plan is only made available to customers who have the code assigned in Customer Credit and Scoring Information."** |
| `Exclude from General Use` | checkbox | **"the plan cannot be used by customers that do not have a revolving classification specified."** |
| `Valid From`, `Through` | dates, optional | Plan validity window; either or both. **"Dates entered in these fields must be greater than or equal to the system date."** |
| `Restrict Use to` | enum — 4 exact values | `No Restrictions` (**default**), `Corporate Locations`, `Franchise Locations`, `Specific Store Locations`. |
| `Franchise` | multi-select | Active only for `Franchise Locations`. **"Any location set up as a franchise via the Warehouse/Store Location Settings cannot also be a corporate location."** |
| `Store` | multi-select | Active for the three restricted options; **mandatory for `Specific Store Locations`**. |
| `State` | multi-select, optional | States where the plan is available. **"Restrictions by state override those placed by location."** Multiple Tax Jurisdiction Selection Window. |
| `Minimum Financed Amount` | money, optional | Minimum financeable amount on this plan. |
| `Allow Multiple Pending Plans` | checkbox, **default checked** | Unchecked → *"if the customer has a pending financed order with this plan, you cannot finance the new order with this plan… you must either finance the new order using a different plan code or add the new merchandise to the existing pending order."* |
| `eSTORIS Discount Restrictions Apply` | checkbox | *"promotional financing plans cannot be combined with promotional discounts that are set up in eSTORIS. If attempted, a warning message is displayed asking if you want to continue with the finance plan or promotional discount."* |
| `Required Percentage Paid before Add-on Allowed` | integer **0–100**, or blank | See the paydown rule below. |
| `Past Due Days` | integer, optional | *"if the customer is past due this number of days or greater, this plan is not available for use for that customer. The calculation for past due days uses the same concept used to determine **'C2' credit holds**."* |

**Restriction enforcement (quoted):** *"When you enter a revolving plan manually in the order entry process
and the system determines it is not eligible, an error message displays giving you the option to review the
plan requirements… When a restriction is encountered during entry of the payment plan, **a security
override prompt appears for each restriction**. If you have permission via the Create a User/Group Actions
- Receivables Security **`Revolving Payment Plan Restrictions`** settings or obtain a security override from
another user, security is granted and the entry of the payment plan is allowed. Otherwise, the entry is not
allowed."*

**Hard rule — transfers bypass restrictions entirely:** *"If this plan is set to allow transfers from other
plans, **the transfer feature in cycle processing overrides the restrictions on this tab**."* A customer who
could never be sold this plan can be *moved onto* it by delinquency processing.

**`Required Percentage Paid before Add-on Allowed` — exact rules:**
- **Blank = NO add-on allowed at all.** (Counter-intuitive: blank is the *most* restrictive value, not the
  least.)
- `0` = add-ons allowed subject to credit limit and other restrictions, regardless of balance.
- `1`–`100` = the existing plan must be paid down to this percentage **or below** before an add-on is allowed.
- **Exact calculation, quoted:** *"the calculation to determine what percentage of the plan balance has been
  paid is calculated by **dividing the sum of the remaining balances for all invoices on the plan by the sum
  of the original amount for all invoices on the plan**."*
  → the computed figure is actually the **percentage remaining**, and the field named
  *"Required Percentage **Paid**"* is compared against it.
- **Worked example, verbatim:** financed $1,000, current balance $500, setting = 40%. *"The customer's
  balance is paid down by 50% so an add-on would be allowed."* At a $750 balance: *"it would only be paid
  down by 25% therefore an add-on would not be allowed."*
  → With balance $500/$1000 the ratio is 50% and the threshold 40%; **the test that reproduces both
  examples is `remaining_ratio ≤ threshold`** (50% ≤ 40% is false → yet the article says allowed).
  **The article's own worked example is internally inconsistent with its stated formula** — 50% remaining
  vs a 40% threshold should fail under either reading unless the comparison is on *paid* ratio
  (`paid_ratio = 1 − remaining_ratio`; 50% ≥ 40% → allowed; 25% ≥ 40% → denied, which matches).
  **Conclusion: the field means "percent PAID must be ≥ threshold"; the stated formula describes the
  remaining ratio and omits the `1 −`. Implement against the worked examples, not the prose.**
- Override permission: **`Revolving Worksheet; Override Required Percentage Paid for Add-on`** in Receivables
  Security, or a security override by an authorized user.

#### eSTORIS tab

| Field | Type | Purpose / business rule |
|---|---|---|
| `Plan Name` | text | Name shown to customers on the eSTORIS website. **Required if `Plan Availability` is `On Web Only` or `Both In Store and On Web`.** |
| `Display Order` | positive integer | 1 = displayed first. **"If more than one plan has the same display order, the plan name is used to determine the order (i.e. alphabetical)."** |
| `Plan Availability` | enum: `In Store Only` (**default**), `On Web Only`, `Both In Store and on Web` | Where the plan is offered. |

**Actions.** `Percentage Break Level Table` (`CUST-104`); `Finance Level/MMP Table`
(*Payment Type Revolving Finance Level/MMP Table* — **used only with `Calculate MMP` = fixed MMP amount**).

**Dependencies.**
- `CUST-104` Percentage Break Level Table; `CUST-113` Revolving Classification Settings;
  `CUST-115` Revolving/Installment Fees; `CUST-091` Minimum Deposit Percentage Table (part B);
  `CUST-092` Minimum Finance Charge Table (part B); `CUST-130` Statement Notification Days.
- **Revolving Receivables Control Settings** — prime rate, `Revolving Credit Hold Amount`,
  `Allow Payment Agreement`.
- **`CUST-119` Sales Tax Settings** — MMP calculation input and `Use Tiered Interest Rates`.
- Customer Credit and Scoring Information (credit score, co-applicant score, classification).
- Warehouse/Store Location Settings (corporate vs franchise); tax jurisdiction / state list.
- Chart of accounts + cost centers (three mandatory GL accounts).
- Receivables Security permissions: `Revolving Terms and Conditions - Override Lowest MMP Allowed
  Restriction`, `Revolving Payment Plan Restrictions`, `Revolving Worksheet; Override Required Percentage
  Paid for Add-on` — all inert without the global **Extended Security** kill-switch.
- Design Enhanced Laser Forms (ELP templates); Configure Document Signature Capture; Configure Document
  Archive; eSTORIS checkout.
- Cycling engine; Plan Deferment; Import Revolving Plan Deferments; F1 and C2 credit holds.

**Build notes.**
- **This is a consumer-lending product definition, not a settings screen.** If LA Mattress does not
  originate its own revolving paper, **descope the entire cluster** (`CUST-104`, `-113`, `-114`, `-115`,
  plus part B's `-091`/`-092`) and integrate a third-party provider instead. See the `[DECISION NEEDED]`
  in `CUST-097`. Everything below assumes we build it.
- Model the plan as **immutable, versioned product terms**: `credit_plan_version(plan_id, version,
  effective_from, …)`. STORIS already half-does this by snapshotting promotions and `Lowest MMP allowed`
  at activation; make it total and explicit. **Every customer plan stores its plan_version_id.**
- **MMP method is a strategy enum** — implement all six as named strategies with unit tests, especially:
  the fixed-term **upward ratchet** and its zero-balance reset; the partial-completion "last shipment gets
  the full MMP, earlier shipments reset to zero" rule; and the even payment split across invoices.
- **Reg Z / TILA:** APR, finance charge, payment schedule, and promo expiry must be computable and
  reproducible from stored snapshots. Store the resolved APR, the prime index value, the break-level table
  version, and the tiering mode on every cycled finance charge.
- **Do differently — blank must not mean "most restrictive".** `Required Percentage Paid before Add-on
  Allowed` blank = no add-ons is a trap. Use an explicit `add_on_policy ENUM('NEVER','ALWAYS','THRESHOLD')`
  plus a threshold value.
- **Do differently — fix the paid/remaining formula.** Implement `paid_ratio ≥ threshold` per the worked
  examples and document it; the prose formula is wrong.
- **Do differently — transfers must not bypass eligibility.** A delinquency transfer that moves a balance
  onto a plan the customer is ineligible for is a fair-lending and disclosure problem. Require the target
  plan to be independently permissible, or treat the transfer as a new credit decision with notice.
- **Do differently — decouple credit math from tax settings.** `Use Tiered Interest Rates` and the MMP
  calculation must not read the tax jurisdiction record (see `CUST-104`).
- **Do differently — irreversible flags.** `Allow Other Plans to Transfer to this Plan` cannot be un-checked
  once used. Model as a versioned setting with a documented migration path instead of a one-way door.
- **State restriction overriding location restriction** is the correct precedence for lending (state law
  governs) — keep it, and make it explicit in the resolver rather than implicit.
- Credit-score gating uses **max(applicant, co-applicant)**. Confirm this is our intended policy —
  using the *higher* score is generous and is a documented underwriting choice, not an accident.
- **Every field on this screen is a compensation-, pricing-, or credit-policy lever: the whole record must
  feed `RPT-AUDIT` with before/after values, and changes must be effective-dated.**
- `[DECISION NEEDED]` `Can be used to Purchase Gift Certificates/Cards` — financing gift cards is a
  money-transmission and fraud red flag. Recommend hard-disabling regardless of what STORIS permits.
- `[DECISION NEEDED]` Franchise vs corporate location modelling — does LA Mattress have franchise
  locations? If not, collapse `Restrict Use to` to `No Restrictions | Specific Stores` and drop the
  franchise branch.

---

### `CUST-115` Revolving/Installment Fees
*storis_ref: article 17304693314324*

**Purpose.** Configures the **additional fees** chargeable on revolving and installment plan payments —
finance charge fees, paper statement fees, and convenience fees — with their GL accounts.

**Where it lives.**
- `Sales Tax Settings > Revolving Tab > Actions > Revolving Fees`
- `Sales Tax Settings > Installment Tab > Actions > Installment Fees`

**Hard rule — asymmetric availability:** *"For revolving plans, finance charge fees, paper statement fees,
and convenience fees can all be configured. For installment plans, **only convenience fees can be
configured at this time**."*

**Hard rule — these fees are scoped to the tax jurisdiction.** Living under Sales Tax Settings means fee
configuration is **per state/jurisdiction**, which is correct for consumer-credit fee legality, but again
places credit machinery on the tax record (see `CUST-104`, `CUST-114`).

**Fields**

| Group | Field | Type | Purpose / business rule |
|---|---|---|---|
| Finance Charge Fee | `Rate` | numeric, **up to 4 decimal places**, optional | *"If this state allows an additional fee to be assessed on finance charges, use this field to indicate the rate."* **Entering a rate activates the `(Applicable to) Finance Charge Fee` and `GL Account` fields.** Blank = no additional fee. |
| Finance Charge Fee | `GL Account` | GL account | Tracks finance charge fees **added during the cycling process**. Search → Read-Only Lookup Window; Action → GL Account Entry Screen. |
| Paper Statement Fee | `Amount` | numeric **0–99** | *"the amount clients will be charged to utilize paper statements."* **Charged during revolving cycling.** |
| Paper Statement Fee | `GL Account` | GL account | Tracks paper statement fees added during the revolving cycle process. |
| Convenience Fee | `Calculation Method` | enum: `percent` \| `amount` | How the fee applies to the revolving balance. **Determines the name of the next field.** |
| Convenience Fee | `Percent/Dollar Amount` | positive number **> 0** | *"it is then accessed by the **Enter a Customer Payment/Refund/Gift Certificate** process."* Field name follows `Calculation Method`. |
| Convenience Fee | `GL Account` | GL account | **Mandatory once an amount is entered** in `Percent/Dollar Amount`. |

**Behavior & rules.**
- **The state-legality caveat is advisory only.** *"If this state allows an additional fee…"* — STORIS
  states the condition but **does not validate it**. Nothing stops configuring an illegal fee.
- **Convenience fees are charged at payment time**, not at cycling — they are consumed by
  *Enter a Customer Payment/Refund/Gift Certificate*. Finance charge fees and paper statement fees are
  charged at **cycling**. Three fees, two different trigger points.
- **Paper statement fee is capped at 99** and is a flat amount, gated per-plan by
  `Subject to Paper Statement Fee` (`CUST-114`).
- The `Rate` field's 4-decimal precision suggests a per-dollar or per-cent rate; the article does not state
  the base it multiplies. **Ambiguity to resolve against the live system.**

**Dependencies.**
- `CUST-119` Sales Tax Settings (parent; Revolving and Installment tabs).
- `CUST-114` Revolving Payment Plan Settings → `Charge Late Fees`, `Subject to Paper Statement Fee`.
- `CUST-104` Percentage Break Level Table; `CUST-092` Minimum Finance Charge Table (part B);
  `CUST-097` Non-Filing Fee Table.
- Chart of accounts; revolving cycling engine; Enter a Customer Payment/Refund/Gift Certificate.

**Build notes.**
- Model as `credit_fee(jurisdiction_id, plan_type ENUM('REVOLVING','INSTALLMENT'), fee_type
  ENUM('FINANCE_CHARGE','PAPER_STATEMENT','CONVENIENCE'), calc_method, rate_or_amount, gl_account_id,
  effective_from, effective_to)`.
- **Convenience fees on payments are a live regulatory hazard** — several states prohibit or cap them, card
  network rules restrict surcharging, and Reg Z treats some as finance charges. **Do differently:** make
  the fee configuration carry an explicit `legal_basis` note and a per-state allow-list that is *enforced*,
  not merely described in help text.
- **Do differently:** capture the fee's **base** explicitly (`% of payment amount`, `% of balance`,
  `flat per payment`) rather than inferring it from where the field lives.
- Fees are consumer-facing charges — effective-date them, snapshot the applied rate onto every fee
  transaction, and feed all changes to `RPT-AUDIT`.
- `[DECISION NEEDED]` See `CUST-097` — if consumer finance is third-party, only the convenience-fee concept
  may survive, and even that should probably be declined.

---

### `CUST-116` Sales Coupon Settings
*storis_ref: article 15242631136660*

**Purpose.** Creates **individually-tracked sales coupons**, each bound to a sales discount code, able to
override that discount's percent/amount, active dates and minimum subtotal, and optionally bound to a
single customer and to single-use redemption.

**Where it lives.** `System Administration > System Settings > Point of Sale System Settings > Pricing System Settings > Sales Coupon Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Coupon Code ID` | **up to 20 alphanumeric characters** | **"No special characters other than a hyphen are allowed."** **"The ID you enter here cannot be the same as any existing sales discount codes."** (and the reverse is enforced in `CUST-117`) — coupon IDs and discount codes share one namespace. |
| `Sales Discount Code ID` | lookup, **mandatory** | Links the coupon to a discount code. **"All discount types are available. You are not restricted to only discount codes that have the `Only Available to Link to Coupons` setting in Sales Discount Settings enabled."** |
| `Percentage` | percent, **up to 100.000000, six decimal places**, **> 0**, optional | **Active only if the linked discount's `Discount is a` = `Percent`.** Overrides the discount's percent. |
| `Amount` | money, **up to 9999.99, two decimals**, **> 0**, optional | **Active only if the linked discount's `Discount is a` = `Amount`.** Overrides the discount's amount. |
| `Minimum Amount Required` | money **≥ 0**, up to **99999.99**, optional | Minimum purchase to apply this coupon or its discount. **Applies to subtotal *and* line discounts.** |
| `Starting Date`, `Ending Date` | dates, optional | Coupon validity window. |
| `Coupon Reusable` | checkbox, **default unchecked** | Checked = usable multiple times without limit. Unchecked = **single use**. |
| `Coupon Redeemed` | checkbox, **default unchecked**, **editable** | Redemption state. |
| `Customer Code` | customer lookup, optional | **"To apply the coupon to a sales order, the coupon's customer code must match the customer code on the sales order."** |

**Behavior & rules.**
- **Inheritance from the discount, quoted:** *"coupons inherit **location restrictions, inventory
  formations, and the sales discount GL account** from the sales discount settings."*
- **Override precedence — date fields (exact, and asymmetric):** *"If you leave these fields blank, the
  coupon is valid for the range of dates specified in the associated sales discount. **If you enter the
  starting OR ending date for this coupon, the dates for the discount code are not used.**"*
  → **Entering *either* coupon date discards *both* inherited dates.** Setting only a start date silently
  removes the discount's end date, creating a never-expiring coupon.
- **Override precedence — minimum amount (three-way):**
  - blank → the discount's `Minimum Eligibility Required Amount$` is used;
  - a value → **takes precedence** over the discount's minimum;
  - **`0` → "no minimum subtotal is required and this coupon can be used, even when the associated discount
    code contains a minimum purchase requirement."** — **explicit zero is a bypass, not an absence.**
- **Minimum-amount calculation and cascade (quoted):** *"The minimum purchase amount is calculated as the
  sum of the net line extensions of all line items on the order. The first discount is applied against the
  amount in the `Subtotal` field on Payment page of the sales order. **The next discount is applied against
  the subtotal after the first discount is applied.**"* → **subtotal discounts compound sequentially.**
- **Validation timing:** *"This requirement is validated **when you save the sales order**. If the subtotal
  amount does not meet the required minimum purchase amount, **a manager override is required to proceed**."*
  Late validation — the coupon can be applied and only fails at save.
- **`Coupon Redeemed` un-redemption rules (quoted):**
  - Reusable + redeemed → still usable.
  - Not reusable + redeemed → cannot be used again.
  - **The flag is manually editable:** *"if you return, void, or adjust the order after this field is set to
    'redeemed', you can un-check the box to indicate that the coupon can be used."*
  - Automatic clearing: *"When a coupon code is removed from all line items on an order or the entire order
    is deleted, this field is unchecked."*
  - **But: "If this field is checked and an order contains a completed line(s) when the coupon code is
    removed from all open lines, this field remains checked."** — partial completion pins the redemption.
- **Hard rule / fraud surface — redemption state is a manually editable checkbox with no audit.** Combined
  with **STORIS having no general change-audit log**, a single-use coupon can be silently reset and re-used
  an unlimited number of times, and nothing records who did it. **This is the sharpest control weakness in
  this part of the section.**
- Coupon amount can be further overridden at order entry when the discount has `Override Discount Amount`
  checked — *"the Override Discount Amount window displays during order entry with the coupon amount as the
  default value. This amount can be adjusted to an amount greater than zero."* **So a "$50 coupon" is
  really "a suggested $50" whenever that discount flag is on.**
- `Customer Code` binding is **exact match on the order's customer code** — no household, no
  ship-to/bill-to distinction.

**Dependencies.**
- `CUST-117` Sales Discount Settings — the linked discount, and the shared code namespace, inherited
  locations/formations/GL account, `Only Available to Link to Coupons`, `Apply Discount to Subtotal`
  (**disabling it invalidates all associated coupons — documented as a deliberate mass-invalidation
  technique**), `User can Override this Discount Dollar Amount`, `Discount is a`.
- `CUST-096` Multiple Line Discounts Overview — order of operation, combination rules.
- Customer master (`Customer Code`); selling locations; inventory formations; chart of accounts.
- eSTORIS (coupon-to-eSTORIS discount linking requires `Apply Discount to Subtotal`).
- Manager override permission in Sales Security.

**Build notes.**
- Model `coupon(code, discount_id, override_pct, override_amount, min_purchase_amount, valid_from,
  valid_to, single_use, customer_id, status)`.
- **Do differently — redemption must be an event log, not a boolean.**
  `coupon_redemption(coupon_id, order_id, redeemed_at, redeemed_by, reversed_at, reversed_by, reason)`.
  Derive usability from the log. This fixes the un-redeem fraud hole, the partial-completion pinning bug,
  and gives us redemption reporting for free. **Highest-priority deviation in this article.**
- **Do differently — make date inheritance per-field.** A coupon start date should not silently discard the
  discount's end date. Inherit each bound independently.
- **Do differently — distinguish "no minimum" from "inherit minimum" explicitly** with a nullable field plus
  an `override_minimum boolean`, rather than overloading `0`.
- **Do differently — validate eligibility at apply time, not at save.** Failing only at save, then offering
  a manager override, trains staff to override.
- Support usage limits beyond binary single-use/unlimited: `max_redemptions`, `max_per_customer`.
- Coupon codes should be generated, high-entropy, and optionally single-issue; a 20-char human-typed
  namespace shared with discount codes invites collisions and guessing.
- All coupon creation, amount override, redemption and un-redemption feed `RPT-AUDIT`.

---

### `CUST-117` Sales Discount Settings
*storis_ref: article 15242631135764*

> **The definitional screen for the entire discount subsystem — the settings `CUST-096` describes
> conceptually and `CUST-116` extends. Very large; every documented field is captured below.**
> *(Accordion sections on this page required forced expansion to read; noted here for reproducibility.)*

**Purpose.** Creates the **discount codes** used in order entry, for line items and/or order subtotals,
with amount/percent, dates, location scoping, product scoping via inventory formations, GL posting,
rounding, instant-rebate/vendor-chargeback configuration, eligibility minimums, and a large set of
combination rules.

**Where it lives.**
- `Customer > Point of Sale > Settings > Pricing Settings > Sales Discounts Settings`
- `Customer > Settings > Pricing Settings > Sales Discounts Settings`
- `System Administration > Get Started - Enter Your Information > Get Started Step 8 - Sales > Sales Discounts Settings`
- `System Administration > System Settings > Customer System Settings > Pricing System Settings > Sales Discounts Settings`

**Preconditions (quoted) — all three must be true to use discount codes in Sales Order, Quick Sale and
Return entry:**
1. *"the '`Apply to`' types of discounts allowed must be enabled in **Point of Sale Control Settings**"*
2. *"the user must have access to discount fields via **User/User Group Sales Security settings**"*
3. *"the **`Discountable`** field in the **Advanced Product Settings** record is enabled for the selected line item"*

**Two global hard rules stated up front:**
- **"Discount codes can only be calculated on regular retail price. If the regular retail price is manually
  changed within an order, a discount code cannot be applied to that line item."** — manual price entry and
  discount codes are mutually exclusive on a line.
- **SRP substitution:** *"If using discounts that are applied to the Suggested Retail Price (SRP), the
  selling price (set in Advanced Product Settings) is changed to the SRP when the discount is applied. If
  the discount is removed, the price is reverted back to the selling price. **However, if the product has no
  selling price, the selling price remains as the SRP.**"* → **removing an SRP discount from a product with
  no selling price permanently leaves the line at SRP.**

#### General tab

| Field | Type | Purpose / business rule |
|---|---|---|
| `Discount Code` | **up to 6 alphanumeric characters** | **"If you use Sales Coupons, the system prevents you from creating a sales discount code using the same ID as the sales coupon ID."** |
| `Description` | text, **up to 30 chars** | `Action` → `Description Field - Language Translation Entry`. |
| `Discount is a` | enum: `Percent` \| `Amount` | `Percent` = a percentage of the **default selling price**. `Amount` = *"subtract the specified amount from the default selling price of a **single piece**… and use the resulting price for the calculation of the line extension."* **Max 9999.99.** **"If the discount is greater than or equal to the selling price of a single piece, a warning message appears. If you choose to continue, the program sets the price to zero."** **"in the case of a product with a unit conversion other than one, the program applies the discount to each piece in the case."** *"This field does not affect fixed-amount discounts submitted via eSTORIS."* **"If your system is set to use imbedded national tax, this field defaults to `Percent` and you cannot edit it."** Also fixes which coupon override field is active (`CUST-116`). |
| `Percent` | number | The percentage value when `Discount is a` = `Percent`. |
| `Maximum Discount Amount` | money **> 0**, 2 decimals, **max $999999.99**, optional | **"When `Maximum Discount Amount` is assigned, it supersedes any calculated discount amount previously specified."** — a cap on a percent discount. **Visible only when `Discount is a` = `Percent`**, and only available to line discounts when `Apply Discount for SALEABLE`/`ASIS Line Items` is enabled. |
| `Location(s)` | multi-select, blank = all | Selling locations where the code may be used. **"Sales coupons associated with this discount can only be used at the selling locations specified here."** |
| `Start Date` / `End Date` | dates, optional | *"you cannot use this discount code on sales orders written before/after this date."* Inherited by coupons unless the coupon sets its own (see `CUST-116`). |
| `Start Adding Discount On` | date, optional | **Sales-quote pre-loading:** lets a discount be added to a **sales quote** before the advertised sale starts. **"If you specify a date in this field it must be earlier than the date you specified in the `Starting Date` field."** **To convert such a quote to an order before the sale start date the user needs `Override Sales Quote Conversion Discount Restriction` in sales security, or a security override.** |
| `Expiration Days for a Quote` | enum/int | **`No Entry` (default) = no expiration.** **`0` = "Sales quote must be converted to a sales order on the same date that this discount is applied to the quote. Otherwise, discount is removed from the quote."** **`1`–`999` = days the discount stays valid on the quote.** |
| `Apply Discount for ASIS Line Items` | checkbox | Allows the code on As-Is merchandise. |
| `Apply Discount for SALEABLE Line Items` | checkbox | Allows the code on regular saleable merchandise. |
| `Apply Discount to Subtotal` | checkbox | Allows use as a global discount in `Discounts - Code(s)` on the Payment tab. **"If you remove the check from this field and there are sales coupons with this discount code assigned, a warning is issued but you can leave it unchecked… any coupons associated with this discount cannot be used. In this way, you can invalidate all associated coupons regardless of other settings."** **Must be enabled to link coupon codes to eSTORIS discounts.** |
| `Cannot Be Combined with Third Party Financing` | checkbox | Blocks third-party **promotional financing plans only** on orders where any line carries this discount. **Applies to both offline and online finance plans.** Overridable per plan via **`Financing Eligibility Restrictions` → `Ignore Sales Discount Finance Plan Restriction`**; user receivables security also governs. |
| `User can Override this Discount Dollar Amount` | checkbox | **Requires `Discount is a` = `Amount`.** Checked → `Discount $` is optional; if empty, no default and the `Override Discount Amount` window **requires** an amount > 0; if populated, it defaults and may be overridden (> 0). Unchecked → **`Discount $` is mandatory at setup and must be > 0.** |
| `Allow Subtotal Discount Combined with Line Discount` | checkbox | Allows this code as a subtotal discount alongside other subtotal discount codes. **Unchecked → "this discount code or a sales coupon with this discount code assigned is restricted to not allow multiple subtotal discounts on an order. Only that coupon or sales discount code is allowed."** (Note the field name says line+subtotal; the help text describes subtotal+subtotal exclusivity — **the label and behaviour disagree**; `CUST-096` describes it as governing line/subtotal combination.) |
| `Only Available to Link to Coupons` | checkbox | Restricts the code to coupon use. Applies to subtotal and line discounts. **"If this setting is checked, this discount cannot be used via the `Create/Maintain a Daily Discount Schedule`."** (i.e. coupon-only discounts are excluded from Auto-Apply.) Note `CUST-116` says coupons are **not** restricted to codes with this flag — the flag restricts the *discount*, not the coupon. |
| `Only Applicable to Orders with Extended Receivables Revolving Plans` | checkbox | Discount usable only on orders financed with a revolving plan. |
| **`Not Available to these Customer Price Categories`** | multi-select of customer price categories | **"Enter one or more customer price categories to exclude customers within that price category from using this discount."** — **see the targeted-topic findings at the end of this file: this is a *consumer* of the customer `Price Category` field, and the only place in positions 93–137 where price category appears.** |

#### Line Discount tab

| Field | Type | Purpose / business rule |
|---|---|---|
| `Automatically Apply as a Product Discount` | checkbox | Auto-assigns the discount to specified product(s) on sales orders, the sale portion of an exchange, or quick sale. **"The specified discount only applies to saleable merchandise. Therefore, the `Apply Discount for SALEABLE Line Items` must be checked."** *"This type of discount should be used to further reduce the selling price of an item by the dollar discount amount."* |
| `Inventory Formation` | multi-select | Product scoping. *"this discount excludes any merchandise line where the Product is not part of the specified Inventory Formation. An inventory formation must include the ability to include/exclude products by the following categories: **product group, category, vendor, and specific product**."* **"cannot be the same formation(s) as the ones defined in `Qualifying Inventory Formation`."** Actions: `Create a new Inventory Formation`, `Maintain Assigned Inventory Formations`, `Multiple Inventory Formation Selection`. |
| `Product must be included in all Inventory Formations` | checkbox | Requires membership in **all** assigned formations (AND) rather than the default ANY. |
| `Line Discount GL Account` | GL account, **not mandatory** | Posting account for **line** discount amounts at sales transaction completion. |
| `Reason Code` | multi-select | **"If any reason codes are assigned here, the discount is only eligible if the As-Is reason code associated with the product on the sales order line matches a code entered here. Sales Discounts with reason codes specified in this field can only be applied to line items."** Reason codes may be designated `Not Required`, `As-Is` or `As-Is Restricted` in Reason Code Settings → `This Reason is Used for`; **`Obsolete` can be used here.** |
| `Membership Discount Only` | checkbox | *"can only be applied to orders for customers with an existing customer membership."* **"If this field is unchecked, the discount is not available as an active discount within the `Membership Discount Schedule`."** **"This option is only available for line item discounts, it cannot be selected if the `Apply Discount to Subtotal` option is selected."** |
| `Membership Product Code` | lookup, optional | Restricts to a specific membership. Blank + `Membership Discount Only` → any membership qualifies. |
| `Line Discount Rounding Method` | enum: `None` \| `Up` \| `Down` \| `Nearest` | `Up` = round the new sale price up; `Down` = down; `Nearest` = to whichever is closest. |
| `Round To` | enum: `None`, `Penny`, `Dime`, `Dollar`, `Ten`, `Hundred`, `Thousand` | **Mutually exclusive with `End In`.** |
| `End In` | money | **Mutually exclusive with `Round To`.** **Verbatim example: "if you enter 4.99 in this field and select `Up`… the system rounds each sale price to the next highest number that ends in 4.99. The sale price calculated by the system as $24.31 would be changed to $24.99. If you enter .99 in this field and select either `Down` or `Nearest`, the $24.31 price would be lowered to $23.99."** |

**Rounding activation and combination rule (quoted):** the three rounding fields are active only if
`Discount is a` = `Percent` **and** at least one of `Apply Discount to ASIS Line Item Amounts` /
`Apply Discount to Saleable Line Item Amounts` is on. *"If rounding is active for this discount, other
discounts can be combined with rounding discounts on the same line item, provided the `Cannot be Combined
with other Discounts` setting is not checked. **Only the primary discount honors the rounding and rounding
on secondary discounts is ignored.**"*

**Instant Rebate group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Vendor` | vendor lookup | Vendor responsible for the rebate. |
| `Chargeback Percent` | percent **0.01–100.00**, 2 decimals | Percentage of the rebate charged back to the vendor. *"if the rebate requires your company to pay a co-pay, the `Chargeback` value should be set to the percentage of the rebate for which the vendor is responsible."* **"If `Vendor Rebate Taxable` is checked for the Jurisdiction, the tax amount is applied to the order based on the `Chargeback Percent`. For example, if a dollar discount for $10 has a 2% `Chargeback Percent`, $2 is taxable."** |
| `Rebate Application Method` | enum — 3 values | `Increase in Revenue` — *"The rebate is taken as revenue, which does not affect cost."* **`Reduction in Cost` (default)** — *"The associated merchandise is cost adjusted. If this option is chosen, products designated as **special order, bulk, or non-inventory are not available for selection**. The cost applied to the sales order for the merchandise is reduced by the vendor's portion of the rebate; **this cost change impacts salesperson commission, margin reporting, and any other feature using the exact cost of merchandise from order completion**."* `Offset Sales Discount` — *"the sales discount GL account is reduced (credited) by the offset to the Vendor Receivables posting."* |

**Instant-rebate hard rules:**
- **Both `Vendor` and `Chargeback` must be specified** to make the discount an instant rebate; both blank =
  not a rebate.
- **"While instant customer rebates can be applied to order lines, they cannot be configured to apply to
  subtotal amounts."** If `Vendor`/`Chargeback` are set and `Apply Discount to Subtotal` is checked,
  **an error message appears on Save.**
- *"Rebates added to sales quotes are not charged back to the vendor until the quote is converted to a sales
  order and has been completed."*
- **"NOTE: Commission is based off of the line item discount price, not retail price, regardless of which
  `Rebate Application Method` is selected."** Documented workaround: *"To base commission off of retail
  price while using instant rebates, apply a discount through the Payment page of the order; the discount
  applies to all line items and the vendor charge back will have to be created/applied via the AP Bill
  process as a rebate charge."* — **STORIS's own documentation recommends a manual AP workaround to avoid
  penalising salespeople, which is a strong signal the commission model is wrong (cf. `CUST-096`).**

**Minimum Eligibility Required group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Quantity` | number **> 0**, up to **99999** | Minimum quantity to use the code. Applies to subtotal *and* line discounts. **"To exclude specific products from discount eligibility based on quantity, use the `Exclude Minimum Quantity` setting in Advanced Product Settings."** |
| `Amount` | number **> 0**, up to **99999.99** | Minimum purchase amount. *"calculated as the sum of the net line extensions of all line items on the orders (**although non-inventory order lines are not included**)."* *"When used for subtotal discounts, the minimum eligibility amount is determined for the order's subtotal, not for the minimum subtotal of the qualified product."* **Coupon `Minimum Subtotal Required` takes precedence over this.** **"validated when you save the sales order… a manager override is required to proceed."** |
| `Qualifying Inventory Formation` | multi-select | The merchandise that must be *purchased* for the discount to be allowed (as opposed to `Inventory Formation`, which is what the discount *applies to*). **Not mutually exclusive with Quantity/Amount — "an inventory formation can be combined with either the Quantity or Amount requirement or can exist solely on its own"**, and *"both the Quantity and Amount requirements will work in tandem"* when it is used. |

**`Quantity` and `Amount` are mutually exclusive** — *"once one is entered, the other becomes inactive."*
(Except via `Qualifying Inventory Formation`, which makes them work in tandem.)

**`Qualifying Inventory Formation` validations (quoted):**
- The formation must already exist in Inventory Formation Settings.
- **"The `Qualifying Inventory Formation` cannot match the `Inventory Formation` if one has been assigned."**
- **"When a `Qualifying Inventory Formation` exists, the discount is for line discounts only and the
  `Apply Discount to Subtotal` box cannot be checked."**
- **"The `Apply to Additional Purchase` option is required when using a `Qualifying Inventory Formation`."**
- **"The `Minimum Required based on Eligible Lines Only` does not work with this setting and cannot be set."**

**Line Discount "Other" flags** — **"NOTE: Many of the following Line Discount settings conflict with one
another and with other settings on this screen. When you click Save, validation for the compatibility of
these settings occurs. Setting conflicts can either be **prohibited** and result in you being unable to save
the settings, or **not recommended**, in which case a warning is issued but you can still save."**

| Flag | Rule |
|---|---|
| `Apply as an Allocated Dollar Discount` | Fixed dollar allocated proportionally across all lines carrying it, **based on unit price**. On line delete or discount removal, remaining lines **recalculate to reach the amount**; if none remain, the discount is removed. **"Should the summary of the unit price of all lines applied be less than the discount, all lines are discounted 100%, resulting in a line extension of zero. The remainder of the discount is discarded."** |
| `Apply Last in the Order of Operation` | Applied last regardless of the defined order of operations, *"so as not to affect the amounts or qualification of existing discounts."* **Ties broken by the `DISCOUNTS - Apply Fixed Amount Line Discounts First` setting and by type (Percent vs Amount); within those, "they are applied in the order they were entered."** |
| `Apply Minimum Eligibility Requirement to Individual Line` | Minimum is per line rather than per order subtotal. **Cannot be checked if `Minimum Required based on Eligible Lines Only` is checked.** |
| `Apply to Additional Item of Equal or Lesser Value` | **BOGO.** Eligible only when another line has **both** quantity and unit price ≥ the discounted line. **Source lines are consumed:** *"Once a line has received a BOGO discount or is used as the source to qualify a BOGO discount for another line, it is disqualified from being used as the source of any other BOGO discounts."* **Verbatim example: "line 1 with a quantity of 3 and unit price of $1,000.00. Lines 2, 3 and 4 have a quantity of 1 and a unit price of $900.00. Only one line qualifies for the BOGO discount. In order to qualify lines 2, 3 and 4 for the discount, you need to split line 1 into 3 different order lines."** — **quantity 3 does NOT qualify three BOGOs.** **Requires `Discount is a` = `Percent`.** |
| `Apply to Additional Purchase` | Applicable to any line once the total of all *other* lines meets the minimum. **"Once the discount is applied to a line, the amount/quantity of the line is no longer included in the total used to qualify other lines."** |
| `Apply to Suggested Retail Price` | Applies the discount to SRP instead of selling price. **Only available if `Apply to Saleable Line Item Amounts` is enabled.** **Verbatim example: selling price $220, SRP $229, 10% code → the selling price is removed, SRP displayed, extended price $206.10; removing the code restores $220.** |
| `Cannot be applied to Product already on Promotion` | Discount ineligible on promoted items. **"However, if the discount includes a minimum eligible required quantity/amount, all lines (whether they are on promotion or not) are included in the total."** — promoted lines still *qualify* the discount, they just do not *receive* it. |
| `Cannot be Combined with other Discounts` | Line-level exclusivity in both directions. |
| `Manager Discount Only` | *"This discount can only be applied by a user with manager security."* |
| `Skip Price Variance Exceptions` | Suppresses price-variance exception reporting on lines using this code. **A reporting-suppression switch on a discount code — a control weakness worth flagging.** |
| `Reduce Qualifying Order Amount by Minimum Required` | Deducts the `Minimum Eligibility Required` amount from the qualifying amount for subsequent discounts that share this setting. **Requires: `Amount` populated; `Apply Minimum Eligibility Requirement to Individual Lines` unchecked; `Apply to Additional Purchase` unchecked; and if `Discount is a` = `Amount`, `Line Discounting - Apply as an Allocated Discount` must be checked.** |
| `Minimum Required based on Eligible Lines Only` | Bases the minimum amount/quantity only on qualifying lines. **Requires a `Minimum Eligibility Required Amount`; `Apply Minimum Eligibility Requirement to Individual Lines` cannot be checked.** Unchecked → the whole order's merchandise subtotal and quantity are used. |

**`Reduce Qualifying Order Amount by Minimum Required` — verbatim worked example (port as a test).**
Order total before discounts **$2,000**. Four stacked discounts A–D.

*Enabled:*

| Discount | Amount | Min purchase | Eligible? | Price after | New qualifying amount |
|---|---|---|---|---|---|
| A (1st) | $500 | $2,995 | No | $2,000 | N/A |
| B (2nd) | $200 | $1,195 | **Yes** | $1,800 | $2,000 − $1,195 = **$805** |
| C (3rd) | $100 | $495 | **Yes** | $1,700 | $805 − $495 = **$310** |
| D (4th) | $50 | $350 | No | $1,700 | N/A |

Final price **$1,700** (B and C only). *"If there was an additional discount after Discount D that had an
eligible minimum purchase amount that did NOT have this setting checked, the qualifying amount would be
$1,700."*

*Not enabled:*

| Discount | Amount | Min purchase | Eligible? | Price after | New qualifying amount |
|---|---|---|---|---|---|
| A (1st) | $500 | $2,995 | No | $2,000 | N/A |
| B (2nd) | $200 | $1,195 | **Yes** | $1,800 | $2,000 − $200 = **$1,800** |
| C (3rd) | $100 | $495 | **Yes** | $1,700 | $1,800 − $100 = **$1,700** |
| D (4th) | $50 | $350 | **Yes** | $1,650 | $1,700 − $50 = **$1,650** |

Final price **$1,650** (B, C and D). **The two modes differ: with the flag on, the qualifying amount is
reduced by the *minimum required*; with it off, by the *discount taken*. The flag makes stacking
materially harder.**

#### Subtotal Discount Settings tab

| Field | Type | Purpose / business rule |
|---|---|---|
| `Discount GL Account` | GL account, **not mandatory** | Posting account for **subtotal** discount amounts at sales transaction completion. **"This setting is also used when posting to the general ledger for any sales coupon containing this sales discount code."** May be the same account as `Line Discount GL Account`. |
| `Allow Multiple Discounts on the Order` | checkbox | Allows combining this code with other subtotal discounts. |

**Dependencies.**
- `CUST-096` Multiple Line Discounts Overview (the runtime semantics); `CUST-116` Sales Coupon Settings
  (shared namespace, inheritance); `CUST-105` Price Matrix Usage Codes (pricing happens first).
- Point of Sale Control Settings → allowed `Apply to` discount types, `DISCOUNTS - Apply Fixed Amount Line
  Discounts First`, `Automatically Apply Discounts using Daily Discount Schedule`.
- Advanced Product Settings → `Discountable`, `Exclude Minimum Quantity`, selling price, SRP.
- Inventory Formation Settings; Reason Code Settings (`This Reason is Used for`); Membership settings
  (`CUST-087`, part B) and `Membership Discount Schedule`.
- Financing Eligibility Restrictions → `Ignore Sales Discount Finance Plan Restriction`; third-party
  finance plans; `CUST-114` revolving plans.
- `CUST-119` Sales Tax Settings → `Vendor Rebate Taxable` per jurisdiction; imbedded national tax setting.
- Vendor master + Vendor Receivables / AP Bill (rebate chargebacks); chart of accounts.
- **Customer `Price Category`** (via `Not Available to these Customer Price Categories`).
- User/User Group Sales Security: discount field access, manager discount, `Override Sales Quote Conversion
  Discount Restriction`, manager override on minimum eligibility. All inert without **Extended Security**.
- Create/Maintain a Daily Discount Schedule; Report Builder → `Inventory Formations With Discounts`.

**Build notes.**
- **This screen has ~40 interacting flags with documented conflicts resolved only at Save, some "prohibited"
  and some "not recommended". That is unmaintainable.** Our promotions engine should replace the flag soup
  with a small set of **named promotion types** (`PERCENT_OFF`, `AMOUNT_OFF`, `BOGO`, `ALLOCATED_DOLLAR`,
  `THRESHOLD_ADDITIONAL_PURCHASE`, `INSTANT_REBATE`) each with a *typed* config, so illegal combinations are
  unrepresentable rather than caught by a save-time validator.
- **Port these behaviours deliberately (they are correct and non-obvious):**
  - `Maximum Discount Amount` as a cap on percent discounts — essential margin protection.
  - Formation-based product scoping with explicit ANY vs ALL semantics
    (`Product must be included in all Inventory Formations`).
  - Separate "what qualifies" (`Qualifying Inventory Formation`) from "what receives"
    (`Inventory Formation`) — a genuinely good model.
  - Rounding to `End In` values (`.99`, `4.99`) — real retail price-point behaviour.
  - Instant rebate with vendor chargeback and three GL treatments; the taxability-follows-chargeback rule.
  - Separate line vs subtotal GL accounts.
- **Do differently:**
  - **Multi-formation OR-semantics is a trap:** *"the code is valid for all products included in at least
    one of the inventory formations — even if one of the formations excludes the products."* **An explicit
    exclusion in one formation is silently defeated by inclusion in another.** Make exclusions win.
  - **Stale-formation leakage:** *"If you change an existing formation such that when you re-access a line
    item the sales discount code specified for the line is no longer associated with the product, STORIS
    still makes that code available for the line item."* Re-validate on every line access.
  - **The SRP-with-no-selling-price one-way door** must not exist; never mutate the line's price basis
    irreversibly.
  - **`Skip Price Variance Exceptions`** — do not build a per-discount switch that hides variances from
    exception reporting. If it must exist, it is a permission, and every use is an `RPT-AUDIT` row.
  - **Commission on instant rebates** — STORIS's own documented workaround (route it through the Payment
    page and hand-key an AP chargeback) proves the model is broken. Compute commission on the **retail
    price net of *customer-funded* discounts only**, excluding vendor-funded rebate value. That is the
    economically correct answer and removes the workaround.
  - **`Discount is a = Amount` on a case/unit-conversion product applies per piece in the case** — a
    $50-off code on a 2-piece set takes $100. Make the per-piece vs per-line basis explicit and defaulted
    to per-line.
  - **Zero-price fallout:** *"If the discount is greater than or equal to the selling price of a single
    piece, a warning message appears. If you choose to continue, the program sets the price to zero."*
    A $0 line should require manager approval and an audit row, not a dismissible warning.
- Discount codes are **6 characters** and share a namespace with 20-character coupon IDs — unify on a single
  `promotion` table with a slug key and a `kind` discriminator.
- Effective-date everything and snapshot the applied discount definition onto the order line, so a
  historical order's pricing is reproducible after the code is edited.
- Every discount definition change and every manager override feeds `RPT-AUDIT`.
- `[DECISION NEEDED]` Order-of-operation compounding base (carried from `CUST-096`) — this screen adds
  `Apply Last in the Order of Operation` and the `Apply Fixed Amount Line Discounts First` POS setting.
  **We must write down one canonical ordering and one canonical base and stop there.**
- `[DECISION NEEDED]` `Reduce Qualifying Order Amount by Minimum Required` — do we want stacking-threshold
  erosion at all? It is confusing to staff and customers. Recommend: no; pick one clear stacking rule.

---

### `CUST-118` Sales Lead Origin Settings
*storis_ref: article 15297965121940*

**Purpose.** Maintains the list of **sales lead origins** — special events such as clearance sales or trade
shows that generate leads. The entries appear in lookup windows at `Sales Lead Origin` prompts.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Sales Lead System Settings > Sales Lead Origin Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Special Type` | code, **up to 6 characters** | Identifies this sales lead origin. **Note the field is labelled `Special Type`, not `Sales Lead Origin`** — a naming mismatch between the field and the prompt it feeds. |
| `Description` | text | Description, *"for example the type of event where the lead or contact was generated."* |

**Behavior & rules.**
- Thin article — two fields, no validation, no dates, no expiry, no translation action.
- **Carried-forward finding — attribution is overwritten, not appended.** Same problem as `CUST-112`: a
  customer captured at a trade show in 2023 and again at a clearance sale in 2025 retains only the latter.
  **No event dating, so lead-origin ROI cannot be computed.**
- No linkage between a lead origin and a marketing spend, an event date, or a store.

**Dependencies.**
- Sales Lead System Settings; `Sales Lead Origin` prompts on lead/customer entry.
- Sibling taxonomies: `CUST-101` Order Source Settings, `CUST-112` Referred By Settings, `CUST-086`
  Marketing Code Settings (part B). See the consolidation recommendation in `CUST-101`.

**Build notes.**
- Fold into the unified `attribution` table with `dimension = 'LEAD_ORIGIN'`, captured as an **append-only
  event** with a timestamp, capturing user, and store (see `CUST-112` build notes).
- **Add the fields STORIS omits and marketing will immediately ask for:** `event_start`, `event_end`,
  `store_id`, `spend`, `campaign_id`. Without these, lead-origin data is a label with no analytic value.
- Rename to `lead_origin`; do not carry `Special Type` forward.

---

### `CUST-119` Sales Tax Settings
*storis_ref: article 15297959789972*

> **The tax-jurisdiction master. Also — unexpectedly — the home of large parts of the consumer-credit
> configuration (late fees, interest caps, tiering), referenced by `CUST-104`, `CUST-114`, `CUST-115`,
> `CUST-097`, `CUST-092`.**
> *(Accordion sections required forced expansion; noted for reproducibility.)*

**Purpose.** Maintains tax information **by tax jurisdiction**. Used with the **Zip Code file** to determine
the sales tax percentage for all taxable sales transactions.

**Where it lives.** Eight paths, including
`Customer > Point of Sale > Settings > Sales Tax Settings`;
`Accounting > Settings > Revolving Receivables Settings > Sales Tax Settings`;
`Accounting > Third Party Accounting > General Ledger > General Ledger Settings > Sales Tax Settings`;
`System Administration > Get Started - Enter Your Information > Get Started Step 1 - Tax and Banking > Sales Tax Settings`;
`System Administration > System Settings > Customer System Settings > Sales and Service System Settings > Sales Tax Settings`.
Tabs: `General`; `Open Item`; `Revolving`; `Installment`; `Financing`; `Non-Inventory Usage Settings`.

**Setup rules stated up front (quoted):**
- *"You must create sales tax codes for **all states and/or provinces in which you do business and in which
  your vendors reside**."*
- *"you **MUST** use the standard two-digit post office state code for all states and/or provinces"* —
  `NY`, `CA`, `ON`.
- County/municipal codes are **additional** percentages layered above the state rate, each with its own
  jurisdiction code (e.g. `NYC`), tied to zip codes via the **`Additional Tax Code`** fields in the Zip Code
  record.
- **Revenue-recognition statement (quoted):** *"Until you complete a sale and your customer takes possession
  of the merchandise, all monies remain in deposits liability and still belong to the customer. Once you
  complete the order, you earn the monies and owe the taxes."*
- **Hard rule — new rates are NOT retroactive to open orders (quoted):** *"If you add a new tax rate, the
  system does not automatically add the tax to existing sales orders. You must access the orders and update
  the tax manually - either by: deleting and re-entering the line item, or accessing the `Order Tax
  Information` and adding the tax against the entire order. Note also that the `Validate Tax Rate` field
  below does not add new tax records to existing orders - **it only validates existing tax records**."*
  **A brand-new local jurisdiction never lands on an open order without manual intervention.** For a
  furniture/mattress retailer with long order-to-delivery lags this is a material under-collection risk.

**Header**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Jurisdiction` | code | **State/province: the standard two-letter post office abbreviation (mandatory).** County, municipal and national: **up to 10 alphanumeric characters**. Must be unique. |

#### General tab

| Field | Type | Purpose / business rule |
|---|---|---|
| `Description` | text | e.g. `NEW JERSEY` for `NJ`. |
| `Tax Rate` | percent, **up to 4 decimal places** | e.g. six and one half percent = `6.5` or `6.5000`. |
| `GL Account` | GL account | Sales-tax account for this jurisdiction. Action → TPA GL Account Entry screen. |
| `Type` | enum: `Local` \| `State/Province` \| `National` | **"This field is active only when creating a new tax record."** — **the jurisdiction type is immutable after creation.** |
| `Charge By` | enum — 4 values | See below. |
| `Delivery Taxable` | checkbox | Apply this tax to the sales order **delivery** amount. |
| `Installation Taxable` | checkbox | Apply this tax to the sales order **installation** amount. |
| `Vendor Rebate Taxable` | checkbox | Apply this tax to the vendor rebate amount. **"For the tax to be applied, the vendor rebate must be applied to a line item."** **Only available for `State/Province` type.** **Does not apply with Alternate Calculations `Taxable Merchandise` = `0003 - AR FullOrder Tax Cap`, `0004 - Imbedded Tax`, or `Sales Tax` = `001 - Imbedded Tax`.** (Consumed by `CUST-117` instant rebates.) |
| `Validate Tax Rate` | checkbox | Recalculate tax on open sales orders each time an open order is accessed for this jurisdiction, **and on manifest completion**. Blank = the order keeps the rate first applied. **Per-jurisdiction, so state rate can be frozen while local rates recalculate (and vice-versa).** **Defaults from `Update Tax Rate Changes` on the Advanced page of Point of Sale Control Settings at record creation.** **"This field should be disabled if the `Gross Taxable Price Cap` field is populated."** |
| `Tax Out Of State Sales` | checkbox | **"If you leave this field blank, and the Sales Order Entry process determines the sale is out-of-state, the program overrides (that is, **zeroes out**) the calculated tax."** Inactivated when `Type` = `National`. **"If using the Avalara® Alternate Tax Interface, out-of-state taxes are not collected if 1) this setting is not checked, and 2) connection to Avalara is offline."** |
| `Selling Store Tax Exception` | checkbox | **Active only when `Charge By` = `Point of Sale`.** When the selling-store state and possession state differ and this is checked, jurisdictions are assigned from **the possession zip** (pickup warehouse zip, or the order's shipping address zip) *"regardless of whether or not the possession state is set to charge tax by Point of Possession."* Unchecked → the selling store's location governs. **"This field does not affect in-state orders."** **"If the assigned tax jurisdictions are NOT set to tax out of state sales… the system calculates $0.00 tax."** |
| `Create Adjustments for Charge-offs` | checkbox | Sales-tax adjustments when open-item or revolving balances are manually charged off via the **Bad Debt tab of Maintain Customer Balances**. **Active only if `Tax Adjustments for Charge-offs` is checked on the General tab of Accounts Receivable Control Settings.** Not used with a third-party tax provider; **new jurisdictions returned by the provider are auto-created with this NOT checked.** |
| `Gross Taxable Price Cap` | money, optional | Maximum sales amount taxed in this jurisdiction. *"the system exempts tax on the portion (if any) of the order price that exceeds this amount."* **Applied separately per line-item type — verbatim example: cap $500, $2,000 order with two delivery lines totalling $600 and three pickup lines totalling $1,400 → $500 of the delivery total is taxed AND $500 of the pickup total is taxed.** Primarily for local taxes. **"When this field is populated, the `Validate Tax Rate` field should not be enabled."** |
| `State Rate Cap` | percent, **up to 4 decimals** | **Active only for `Type` = `State/Province`.** Maximum combined tax percentage **excluding national tax**. Overflow is stripped from the bottom of the jurisdiction list. |
| `Tax Override Class` | multi-select tax classes | **"For sales order line items with a tax class specified at the `Tax Class` field in the Advanced Product Settings, the system searches all tax jurisdictions associated with the sales order. If a product's `Tax Class` matches any of those in the Jurisdiction `Tax Override Class` list, the taxable nature of the sales order line is **reversed** (e.g. from taxable to not taxable, or not taxable to taxable)."** **"Tax Class settings are not impacted by the status of the `Delivery Taxable` or the `Installation Taxable` fields."** Vertex: only effective if `Product Taxable Status` = STORIS in Alternate Tax Interface Control Settings. **CCH: this field has no effect.** |
| `Miscellaneous Fee/Charge` | multi-select fee codes | Fees applied to orders whose **point of customer possession** is in this jurisdiction. Restrictable to stores via `Apply Only When Written at Store(s)` in Miscellaneous Fee Settings. Total shows at `Fees/Charges` on the Payment tab; **"the fee total can include fees associated with one or more locations."** |

**`Charge By` — four exact values and their zip-resolution rules:**
- **`Not Applicable`** — *"the default setting for new tax jurisdictions and **must always be assigned to the
  Local and National tax types**. **This setting cannot be assigned to the State/Province tax type.**"*
- **`Point of Sale`** — tax by the **Selling Location**; the location record's zip governs.
- **`Ship From Location`** — tax by the **Shipping Location**; that location record's zip governs.
- **`Point of Possession`** — tax by the **delivery destination**; **the customer's ship-to address zip governs**.

**Zip-resolution matrix, verbatim:**

| `Charge By` | Take With | Customer Pickup | Delivery / Direct Ship |
|---|---|---|---|
| `Point of Sale`, `Selling Store Tax Exception` **unchecked** | selling store zip | selling store zip | selling store zip *(article: "The zip code for the selling store is used for all delivery types.")* |
| `Point of Sale`, `Selling Store Tax Exception` **checked** | (selling store) | **pickup location zip** | **customer's address zip** |
| `Ship From Location` | selling store zip | **pickup location zip** | **shipping location zip** |
| `Point of Possession` | selling store zip | **pickup location zip** | **customer's address zip** |

**`State Rate Cap` — exact algorithm and verbatim worked example.**
*"The system reviews all pertinent jurisdictions, noting the order in which they were added to the tax list,
and reduces the tax amount from the jurisdictions on the bottom of the list. The general taxing order is as
follows: national tax code (if one exists); state tax code; local jurisdictions in the order they appear in
the Zip Code file."*
Cap = 10%. National omitted. State 7% + Local 2% + Local 2% + Local 2% = 13% →
**State 7%, Local 1 = 2%, Local 2 = 1%, Local 3 = 0% (total 10%).**
*"When the tax cap is reached (see Local Tax 2), the system adjusts that tax amount to maintain the cap
level, then adds no tax from any subsequent jurisdictions."*
**Order of jurisdictions in the Zip Code file therefore determines which municipality loses revenue — a
data-entry ordering decision with real fiscal consequences.**

**Alternate Calculations** — three **`(LOCKED Field – STORIS access only!)`** dropdowns covering the three
steps of tax calculation (`Local Tax Jurisdiction determination`, `Taxable Merchandise calculation`,
`Sales Tax calculation`):

| Field | Values / rules |
|---|---|
| `Local Jurisdiction` | Alternate rules for determining which jurisdictions apply. **Vendor-locked.** |
| `Taxable Merchandise` | `TN Single Item Price Cap`, `TN Single Item Price Range`, `AR Full Order Tax Cap`, `Imbedded Tax`. **`AR Full Order Tax Cap`: "reviews previous invoicing to determine the amount of tax to calculate for a selected jurisdiction and prevents the total tax from all invoices for that order from going over the cap."** **`Imbedded Tax` can be used for national tax only.** |
| `Sales Tax` | Alternate to the standard method (**"Tax Rate x Taxable Merchandise"**). **Vendor-locked.** |

**Hard rule — these are `LOCKED Field – STORIS access only!`.** State-specific statutory tax behaviour
(Tennessee single-item caps, Arkansas full-order caps) **is only obtainable by asking the vendor.** This is
the clearest example in the whole handoff of why we are rebuilding.

**Actions.** `Apply to Zip Codes`.

#### Open Item tab

| Field | Type | Purpose / business rule |
|---|---|---|
| `Service Charge` → `Percent` | percent, **2 decimals** | Works with `Service Charge Days` in Accounts Receivable Control Settings. **"When a transaction is overdue by the number of days found in the `Service Charge Days` field, a service charge is generated."** |
| `Service Charge` → `GL Account` | GL account | Credited when service charges are generated. |
| `NSF Check Fee` | money | Dollar amount charged for returned checks in this jurisdiction. **Defaults into `NSF Check Charge` in the Apply NSF and Correct Misapplied Payments routine.** |

#### Revolving tab
**Accessible only if Revolving Receivables is active AND `Type` = `State/Province`.**

| Group | Field | Rule |
|---|---|---|
| Late Fees | `Calculated as a` | enum `Percentage` (**default**) \| `Fixed Amount`. `Percentage` activates `Standard %` and `Minimum $`; `Fixed Amount` activates `Fixed $`. |
| Late Fees | `Standard %` | Standard rate for late charges on delinquent revolving plans in this jurisdiction. |
| Late Fees | `Minimum $` | Minimum late charge assessable. |
| Late Fees | `Maximum $` | Maximum late fee per plan or account (per `Assessed`). **Range `.01` to `99.99`.** |
| Late Fees | `Fixed $` | **The article's help text for `Fixed $` is a verbatim duplicate of `Maximum $` ("the maximum late fee amount that can be assessed"), which is clearly a documentation error — it should describe the fixed late fee amount.** Same `.01`–`99.99` range. |
| Late Fees | `Grace Days` | Days a revolving payment can be late before late fees are assessed; **per-state**. Blank → falls back to `Number of Grace Days` in Account Statement Cycling Control Settings. **"The 'as of' date is calculated by adding the grace days… to the current cycle's payment due date."** |
| Late Fee Rules | `Assessed` | enum: **`Per Payment Plan` (default)** — each revolving plan with an unpaid payment is assessed; **`By Customer Account`** — only selectable **if a Master Plan is indicated in Revolving Receivables Control Settings**; the master plan is assessed if any plan has an unpaid payment. **"NOTE: Only one late fee, not to exceed the state statutory amount, can be applied to the master revolving plan per billing cycle."** |
| Late Fee Rules | `If MMP is Paid` | **Default checked.** Checked → assess late fees when an MMP is past due **regardless of the payment amount received**. Unchecked → no additional late fee if at least the minimum MMP was paid before the late "as of" date. |
| Late Fee Rules | `To Existing Finance Charges` | Include finance charges in the late-fee base. |
| Late Fee Rules | `To Unpaid Finance Charge Fees` | **Help text is a verbatim duplicate of the previous field — another documentation error; this should read "finance charge *fees*".** |
| Late Fee Rules | `On Insurance Premiums` | Include insurance charges in the late-fee base. |
| Late Fee Rules | `Existing Late Charges` | **Available only if `Calculated as a` = `Percentage` AND `Compound Late Fees` is checked.** Include unpaid late charges in the base. |
| Late Fee Rules | `Compound Late Fees` | **Default unchecked.** Runs as part of **End of Day**. Checked → late fees calculated on all unpaid MMPs even if a prior late fee was calculated. Unchecked → no further late fee on an MMP that already carries one. **"NOTE: If any portion of the customer's revolving plan balance has been placed in dispute, the system does not assess late fees (compound or otherwise) on any unpaid MMP's for that plan."** |
| Charge Interest | `Maximum %` | **"The rate you enter in this field overrides the `Percentage Rate %` in the Revolving Receivables Payment Plans, provided the payment plan rate is higher than the rate you entered here."** — **the jurisdiction's usury cap silently clamps the plan rate.** |
| Charge Interest | `Include Paid in Full in Average Daily Balance` | Checked → compute ADB for the cycle even if the plan is paid off by the cycle date. Blank → **override ADB to zero** when paid off by cycle date. |
| Charge Interest | `New Transaction's First Cycle` | enum: `Never` \| `Always` \| `Only if previous statement balance`. Governs whether interest accrues in the first cycle for a newly added order. |
| Charge Interest | `Tiered Balance Calculation` | **This is the `Use Tiered Interest Rates` switch referenced by `CUST-104`.** Checked → marginal/tiered rates per the Percentage Break Level Table. Unchecked → single rate for the band the whole balance falls in. |
| — | `Statement Notification Settings` (button) | Opens `CUST-130` Statement Notification Days. |
| — | `Insurance After Eligibility Age` | Optional insurance code auto-added to revolving accounts **when all other types of insurance have been automatically removed**. No default. Checked during cycle processing. **The code must: have a `Classification` of `Revolving`; have no value in `Eligibility Cutoff Age`; and be flagged `Available` for the jurisdiction per Jurisdiction Settings.** |
| Credit Write-Off | `Amount Threshold` | Lowest credit amount that can be written off. **Verbatim: "if $50.00 is the lowest credit amount, long term balances between $-50.00 and $0.00 are eligible to be written off."** (These are *credit* balances — money owed to the customer.) |
| Credit Write-Off | `Inactivity Days` | Days a plan must be inactive before the Revolving Credit Write-Off process selects it. |

**Actions.** `Revolving Fees` (`CUST-115`).

#### Installment tab
**Accessible only if Advanced Receivables is active AND `Type` = `State/Province`.**

| Field | Rule |
|---|---|
| `LATE FEE - Compound Delinquent Late Charges` | **Default unchecked.** Allows late fees on delinquent late-fee amounts. |
| `NON-FILING FEE - Rebate if a Contract is Cancelled` | Non-filing fees rebatable on cancelled contracts in this jurisdiction. |
| `Non-Filing Fee Table` | Action → `CUST-097` Non-Filing Fee Table. |
| `Interest Table` | Action → **Interest Rate Table window**. Default interest rates by financed amount. **"The interest rates defined in this table are used if there is no interest rate defined in the installment plan settings."** |
| `Minimum Finance Charge Table` | Action → `CUST-092` Minimum Finance Charge Table (part B). |
| `Standard Late Charge` | Flat late fee. **"If you enter an amount in this field, the `Standard Late Percent`, `Minimum Late Charge`, and `Maximum Late Fee` fields become inactive."** |
| `Standard Late Percent` | Percentage late fee. **"If you enter a percentage in this field, the `Standard Late Charge` field becomes inactive."** **"If you do not enter a value in either the Late Charge or Late Percent field, no late fees are assessed on contracts in this jurisdiction."** |
| `Minimum Late Charge` | **"If you do not establish a minimum late fee amount, a late fee of as little as one penny can be assessed."** |
| `Maximum Late Fee` | Blank = **no maximum**. |
| `Late Fee Grace Days` | Days an installment payment can be late before late fees are assessed. |

**Actions.** `Installment Fees` (`CUST-115`).

#### Financing tab — *"This page is specific to 3rd party financing."*

| Field | Rule |
|---|---|
| `Remove Tax on Orders with RTO Plans` | **Only for `Type` = `State/Province`; unchecked by default.** Works with `SALES TAX - Remove sales tax on RTO orders by state` in **Finance Provider Settings**. **Truth table (quoted): provider setting checked + this checked → tax automatically removed from RTO orders; provider setting checked + this unchecked → calculated tax remains; provider setting unchecked → this setting is not evaluated and *tax is removed*.** **The "unchecked provider" branch removes tax — the opposite of what the field names suggest. Verify against the live system before relying on it.** |
| `Allow Installation Charge on Orders with RTO Plans` | **Checked by default.** Affects Enter a Sales Order, Enter a Return, Adjust Dollars on a Completed Order, Update Financing Credit Approvals. Works with `INSTALLATION CHARGE - Allow installation charge on RTO orders by state/province` in Finance Provider Settings. |

#### Non-Inventory Usage Settings tab

| Field | Rule |
|---|---|
| `Products Purchased as Real Property Are Tax Exempt` | *"Check this option to make merchandise with a linked `Installation – Real Property` non-inventory product tax exempt. **This is determined by the deliver-to state.**"* |
| `State Recycling Fee` | Add non-inventory product(s) with usage type `State Recycling Fee`. *"The recycling fee is automatically applied to an order when merchandise has the recycling fee linked [and] the fulfillment's deliver-to is in the jurisdiction."* **Directly relevant to mattress recycling fees (CA, CT, RI).** |
| `Retail Delivery Fee` | Non-inventory product delivery fee for this state; the product must have `non-inventory usage type` = `Retail Delivery Fee` in Advanced Product Settings. **"Retail delivery fees can only be created at the State/Province jurisdiction level. Only one retail fee can be configured per state. The taxability of this fee is determined by the `Taxable` field in the product's settings."** (CO/MN-style retail delivery fees.) |

**Dependencies.**
- **Zip Code file** (jurisdiction assignment, `Additional Tax Code`, jurisdiction ordering — which drives
  `State Rate Cap` allocation).
- Point of Sale Control Settings → `Update Tax Rate Changes` (Advanced page).
- Accounts Receivable Control Settings → `Service Charge Days`, `Tax Adjustments for Charge-offs`.
- Account Statement Cycling Control Settings → `Number of Grace Days`.
- Revolving Receivables Control Settings → Master Plan, prime rate, `Revolving Credit Hold Amount`.
- `CUST-104` Percentage Break Level Table (`Tiered Balance Calculation`); `CUST-114` Revolving Payment Plan
  Settings (`Maximum %` clamp); `CUST-115` Revolving/Installment Fees; `CUST-097` Non-Filing Fee Table;
  `CUST-092` Minimum Finance Charge Table (part B); `CUST-130` Statement Notification Days.
- `CUST-117` Sales Discount Settings → `Vendor Rebate Taxable`, imbedded national tax.
- Advanced Product Settings → `Tax Class`, `Taxable`, non-inventory usage types.
- Finance Provider Settings (RTO); Extended Receivables Insurance Code Settings; Miscellaneous Fee Settings.
- Alternate Tax Interface (Avalara, Vertex, CCH); TPA GL Account Entry (`CUST-134`).
- Maintain Customer Balances → Bad Debt tab; Apply NSF and Correct Misapplied Payments.
- Warehouse/Store Location Settings (location zips).

**Build notes.**
- **Do differently — separate tax from credit.** Late-fee rules, interest caps, ADB treatment, tiering and
  insurance auto-add have **no business being on the tax-jurisdiction record**. Create a
  `credit_jurisdiction_policy` keyed by state, referenced by credit plans. The only legitimate link is that
  both are keyed by state. This single change removes the confusing coupling noted in `CUST-104`,
  `CUST-114`, `CUST-115` and `CUST-097`.
- **Do differently — do not hand-maintain rates.** Use a tax-service integration (Avalara/Vertex) as the
  source of truth with a cached rate table, and **always** store the resolved rate, jurisdiction set, and
  rule version on the order line at completion. STORIS already gets the snapshot half right (`Validate Tax
  Rate` off = frozen rate) but exposes it as a checkbox rather than a policy.
- **Do differently — new jurisdictions must reach open orders.** A background revalidation job should flag
  (not silently alter) open orders whose jurisdiction set changed, and present them for review. The current
  "delete and re-enter the line item" instruction guarantees under-collection.
- **Keep and model explicitly:** the four `Charge By` modes and the full zip-resolution matrix; the
  `Selling Store Tax Exception` interstate rule; `Gross Taxable Price Cap` **applied per line-item type**;
  `State Rate Cap` with an explicit, deterministic jurisdiction ordering (**do not** let data-entry order
  decide which municipality gets zeroed — define the order in code); `Tax Override Class` reversal
  semantics; retail delivery fee and state recycling fee as non-inventory products.
- **Mattress-specific:** state **mattress recycling fees** (CA/CT/RI) map onto `State Recycling Fee`;
  confirm the fee is per-unit and non-discountable, and that returns/exchanges handle it correctly.
- **Tax exemption — see the targeted-topic findings at the end of this file.** This screen contains **no
  customer tax-exemption certificate handling** of any kind. The only exemptions here are
  jurisdiction-level (`Gross Taxable Price Cap`, `Products Purchased as Real Property Are Tax Exempt`,
  `Tax Override Class`, out-of-state zeroing).
- Every field here is a tax or credit policy lever — the whole record feeds `RPT-AUDIT` and must be
  effective-dated. **Tax rate history is a statutory record-keeping obligation; an in-place-editable rate
  field is not acceptable.**
- `[DECISION NEEDED]` Tax engine: build vs Avalara/Vertex. Strong recommendation: **integrate**, do not
  build. The `LOCKED Field – STORIS access only!` alternate calculations are proof that per-state statutory
  quirks (TN single-item caps, AR full-order caps) are endless.
- `[DECISION NEEDED]` `Charge By` policy for LA Mattress. Recommend **`Point of Possession`** with
  `Selling Store Tax Exception` semantics, since delivery is the dominant fulfilment mode and destination
  sourcing is the majority US rule.

---

### `CUST-120` Salesperson Settings
*storis_ref: article 15297965129748*

**Purpose.** Maintains the salesperson master — identity, home address, store/department, email, and the
commission-relevant category/rate/plan — plus CRM sales goals. **Order entry accepts only salesperson codes
established here.**

**Where it lives.**
- `Actions` button on the **General tab of Create a User** settings (creates a salesperson whose number = the
  logged-on user's User ID)
- `Customer > Point of Sale > Settings > Salesperson Settings`
- `Customer > Settings > Point of Sale Settings > Salesperson Settings`
- `System Administration > Get Started - Enter Your Information > Get Started Step 8 - Sales > Salesperson Settings`
- `System Administration > System Settings > Customer System Settings > Sales and Service System Settings > Salesperson Settings`

Tabs: `General`, `Commission`, `Goals`.

**Fields**

| Field | Tab | Type | Purpose / business rule |
|---|---|---|---|
| `Salesperson Code` | (key) | code | **"This field is the key to the Salesperson record and must be unique."** *"We suggest that the salesperson code match the operator's initials specified in the Create a User file."* **`ZZZ` is the reserved "house" code for sales with no salesperson.** |
| `Name` | General | text | Salesperson name. |
| `Address Line 1` | General | text | **Salesperson's HOME address.** |
| `Address Line 2` | General | text | **"This field is for P.O. Box, Apartment Number, Floor #, etc., not city, state and zip code."** |
| `Zip Code/Postal Code` | General | text | Home zip. |
| `City/Town` | General | text | **Auto-defaults from the zip code file; overridable.** |
| `State/Province` | General | text | **Auto-defaults from the zip code file record; overridable.** |
| `Telephone` | General | phone | **Salesperson's HOME telephone number.** |
| `Selling Store` | General | lookup | Store location associated with this salesperson. **"The list does not include warehouse locations."** |
| `Department` | General | text | Sales department; **appears on the Sales Performance Report**. |
| `Email Address` | General | email, optional | Printable on sales order, quick sale, return, exchange and service order **where this salesperson is the primary one on the order**, via the ELP tag **`salesperson_email_address`**. **Fallback: "If the primary salesperson on an order has no email defined, the email address (if any) for the user ID associated with that salesperson is used."** **"NOTE: For exchanges, the email address for the salesperson entered on the sale portion of the exchange is used, and not the salesperson for the return portion."** |
| `Category` | Commission | code, **up to 5 characters**, **NO VALIDATION** | Salesperson level/category, *"e.g. R=Regular, S=Senior, M=Manager"*. **"You can enter any code of up to 5 characters; there is no validation of this entry."** Used when `Calculation Method` on the Pricing & Commissions tab of Point of Sale Control Settings = `Salesperson Matrix`. |
| `Rate` | Commission | percent | Used with the commission matrix method **when `Commission Calculation Source` in Commission Settings = `Salesperson`**. |
| `Plan` | Commission | text, **up to ten characters** | Commission plan associated with this salesperson. |
| `Display Salesperson Code in Lookup` | Commission | checkbox, **default checked** | Controls inclusion in Search/Lookup at Salesperson fields (Enter a Sales Order, View Salesperson Activity, Advanced Customer Settings, Reassign Customers). **"If you uncheck the box, you can still manually enter the salesperson code directly into the Salesperson field. This setting only affects the ability to view and select from Search (Lookup) button."** — **hiding is not disabling.** |
| `Year` | Goals | year | Year for sales goals. **"If you click on `None Selected` from the list, you clear this field as well as the months fields."** |
| `Months` | Goals | money ×12 | Monthly sales goal. **"Enter the number only, no punctuation."** |

**Behavior & rules.**
- **Default-salesperson resolution chain (exact, quoted):** if `Do Not Default Salesperson` in **Point of
  Sale Control Settings** is **blank** (i.e. defaulting is on), *"the system first checks the `Salesperson 1`
  and `Salesperson 2` fields in the **Customer Settings** to find a default salesperson for the selected
  customer. If those fields are empty, the **House** account defaults."*
  → customer record → `ZZZ`. **This is the only customer-level defaulting rule found in positions 93–137,
  and it is for salesperson, not price category (see targeted-topic findings).**
- **Hard rule — deletion protection:** *"You cannot delete salespersons for whom activity exists in the
  system, **including Up System activity**."*
- **`Category` is an unvalidated free-text field that drives commission calculation.** A typo silently
  changes which matrix row applies. **This is a money bug waiting to happen.**
- **PII concern — the salesperson master holds employee home address and home telephone.** This is employee
  PII sitting in an operational file that order-entry users can open from `Actions` on Create a User.
  Combined with **PII masking applying only on re-access** and **no general change-audit log**, employee
  home addresses are effectively unprotected.
- **`Goals` tab is active only if the Customer Relations Management (CRM) module is active.** Goals feed
  `Report Salesperson's Closing Performance`.
- **Actions:** `Custom Commission Information` (active only when a custom commission calculation is in use);
  `Add Salesperson Picture` / `View Salesperson Picture` / `Edit Salesperson` — pictures are for the
  **STORIS Up System** (the sales-floor rotation/"up" queue).

**Dependencies.**
- Create a User / Staff File (`user-security` parts) — salesperson-to-user linkage, email fallback.
- Point of Sale Control Settings → `Do Not Default Salesperson`; `Calculation Method` (Pricing &
  Commissions tab) = `Salesperson Matrix`.
- Commission Settings → `Commission Calculation Source`; `CUST-102` Payment Commission Adjustments;
  `CUST-128` Spiff Table Settings; `CUST-096`/`CUST-117` discount-commission interactions.
- **Customer Settings → `Salesperson 1`, `Salesperson 2`** (customer-level default).
- Warehouse/Store Location Settings; zip code file; sales departments.
- ELP forms (`salesperson_email_address`); STORIS Up System; CRM module; Sales Performance Report;
  Report Salesperson's Closing Performance; View Salesperson Activity; Reassign Customers.

**Build notes.**
- **Do differently — do not duplicate the employee record.** Salesperson should be a **role on the user/
  employee record**, not a parallel master with its own name, home address and phone. One identity, one
  place to protect PII, no drift between `Salesperson Code` and User ID.
- **Do differently — `Category` must be a validated FK** to a commission-category table. Unvalidated
  free text driving a commission matrix is unacceptable.
- **Do differently — do not store employee home address/phone in the sales-facing record at all.** Keep it
  in HR; expose only work contact details to POS.
- Keep: the `ZZZ`/house-sale concept (as a nullable salesperson with an explicit `is_house` flag), the
  customer-level default salesperson chain, deletion protection by activity, and the
  hidden-but-still-enterable lookup flag — though **make "hidden" and "retired" separate states**, since
  hiding without disabling lets a departed salesperson keep receiving credit.
- Goals belong in a `sales_target(salesperson_id, period_ym, amount)` table, not twelve columns.
- Commission category/rate/plan changes are compensation changes — effective-date them and feed `RPT-AUDIT`.
- `[DECISION NEEDED]` `Salesperson 1` / `Salesperson 2` on the customer implies **split credit**. Confirm
  LA Mattress's split-commission policy and whether customer-level default salesperson (i.e. "this customer
  belongs to Maria") is wanted — it is a source of floor conflict.

---

### `CUST-121` Select Bank Check Run File Format
*storis_ref: article 15242407154196*

**Purpose.** Selects the file format used when producing a bank check-run file.

**Where it lives.** `Bank Settings > Third Party Processing tab > Global actions button > Check Run File Format`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Check Run File Format` | enum (list not enumerated in the article) | The format for printing a check run file. **"The default is 'None Selected'."** |

**Behavior & rules.**
- **The article does not enumerate the available formats** — a documentation gap. Whatever they are, they
  are bank-specific positive-pay / ACH / check-print layouts.
- Selecting a format is the **precondition** for running checks: *"Once a file format is selected, a check
  run can be conducted via the **Create Check Run File** process that can be accessed either from the menu
  or via the **Select and Approve Bills for Payment** process."*
- Set **per bank** (it lives on Bank Settings).

**Dependencies.**
- Bank Settings → Third Party Processing tab; Create Check Run File; Select and Approve Bills for Payment.
- `CUST-110`/`CUST-111` reconciliation settings; `CUST-103` Payment Type Override Settings.

**Build notes.**
- Accounts-payable disbursement is largely outside the Customer Settings scope, but note the pattern: a
  **per-bank export format registry**. Implement as `bank_file_format(bank_id, purpose ENUM('CHECK_RUN',
  'ACH','POSITIVE_PAY'), format_id)` with pluggable formatters.
- **Do differently:** treat the file format as a versioned, testable formatter with a golden-file test per
  bank. Bank layout drift silently corrupts payment files.
- Check-run files move money — generation must feed `RPT-AUDIT` (who ran it, which bank, total, count).
- `[DECISION NEEDED]` Is AP in scope for the ERP rebuild, or does it stay in the accounting package?
  This article suggests STORIS's AP is deeply intertwined with the receivables/bank config we are porting.

---

### `CUST-122` Select Insurance Window
*storis_ref: article 15242610699540*

**Purpose.** Multi-select picker for choosing which **insurance plans default** during entry of an
installment receivables payment plan.

**Where it lives.** `Installment Receivables Payment Plan Settings > Insurance field > Action button`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (grid) available insurance plan codes + descriptions | checkbox list | **"To select a plan, check the box next to the plan code."** `Save` commits. |

**Behavior & rules.**
- Thin article — a picker, no validation described. The plans chosen here **default** onto the installment
  plan; nothing states whether they can be removed at worksheet entry.
- Credit insurance (credit life, disability, involuntary unemployment, property) attached to installment
  contracts is **heavily regulated** — it must be optional, separately disclosed, and separately priced.
  **Defaulting insurance plans onto a contract is precisely the "pre-checked box" pattern regulators treat
  as a deceptive practice.**

**Dependencies.**
- Installment Receivables Payment Plan Settings (parent).
- Extended Receivables Insurance Code Settings (plan definitions; see `CUST-119` `Insurance After
  Eligibility Age` — `Classification`, `Eligibility Cutoff Age`, per-jurisdiction `Available` flag).
- `CUST-114` Revolving Payment Plan Settings → `Exempt from Insurance Charges`.
- `CUST-119` Sales Tax Settings → jurisdiction insurance availability, late fees `On Insurance Premiums`.

**Build notes.**
- If installment lending is descoped (see `CUST-097`), this goes with it.
- **If built: do NOT default insurance on.** Make the selection an explicit, per-contract, customer-initialled
  opt-in with the premium disclosed before selection, and record `offered_at`, `accepted`, `accepted_by`,
  `disclosure_version`. **Treat any pre-selection as prohibited.**
- Jurisdiction availability must be *enforced*, not advisory.
- All insurance attach/detach events feed `RPT-AUDIT`.
- `[DECISION NEEDED]` Does LA Mattress intend to sell credit insurance at all? Recommend no — the
  compliance burden vastly exceeds the margin for a mattress retailer.

---

### `CUST-123` Settlement Type
*storis_ref: article 15242407154324*

**Purpose.** Reference article for the **`Settlement Type`** field on a finance provider record — the
transmission/settlement method used with that provider.

**Where it lives.** The `Settlement Type` field on the finance provider configuration (Finance Provider
Settings). No explicit menu path is given.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Settlement Type` | enum — **4 exact values** | Transmission/settlement method for this finance provider. |

**Behavior & rules — the four exact values:**

1. **`Manual`** — *"no electronic transmission/settlement occurs. The **Manually Close Financing Settlement
   (Manual Settlement Close)** process may be used to manually approve/decline and close transactions."*
2. **`TCP`** — a **"one-step"** process. *"Detailed transactions of the day's activity transmit to the
   provider and you receive a response immediately."* On receipt, STORIS completes **all** required
   processing:
   - *"responses returned are used to update the **authorization history records**"*
   - *"**batch settlement record** updates"*
   - *"**Settlement Report** prints"*
   - *"the **message log** updates with a status record for the result of the batch."*
3. **`FTP`** — the **"two-step"** batch settlement method. *"A batch is created containing all required
   transactions and is transmitted to the finance provider. The provider processes that batch **overnight**
   and the response file is retrieved **the next day**. **The updating and completion of STORIS required
   processing will not take place until the response is received.**"*
4. **`Order Completion`** — *"used to indicate that an order should be settled **at the time the order is
   completed**. **The provider you use determines if this option can be selected.**"*

- **Hard rule — with `FTP`, settlement state is unresolved for a full day.** Authorization history, batch
  settlement records and the message log all lag by one business day, which means **AR, cash reporting and
  order status are knowingly stale overnight**. Any reconciliation built on same-day data will be wrong for
  FTP providers.
- `Order Completion` is **provider-gated** — not freely selectable.
- `TCP`/`FTP` here name transport mechanisms, not settlement semantics; **the real distinction is
  synchronous vs asynchronous settlement.**

**Dependencies.**
- Finance Provider Settings (parent record); third-party finance plans.
- Manually Close Financing Settlement (Manual Settlement Close); Settlement Report; message log;
  authorization history; batch settlement records.
- `CUST-102` Payment Commission Adjustments (class 4 financing payment types);
  `CUST-119` Sales Tax Settings → Financing tab (RTO settings); `CUST-093` payment classes.

**Build notes.**
- Model as `settlement_mode ENUM('MANUAL','SYNCHRONOUS','BATCH_ASYNC','ON_ORDER_COMPLETION')` on the finance
  provider — **name the semantics, not the transport**. Transport (`TCP`, `FTP`, `HTTPS/REST`) belongs in a
  separate `transport` field; modern providers are all REST/webhook.
- **Do differently — model settlement as a state machine with explicit pending state.** `AUTHORIZED →
  SUBMITTED → SETTLED | DECLINED | ERROR`, with timestamps. Then a one-day FTP lag is visible and reportable
  rather than an invisible staleness.
- Provider capability flags (`supports_order_completion_settlement`) should be data on the provider record,
  enforced by validation.
- Settlement batches move money — every batch submission and response feeds `RPT-AUDIT`, and unmatched
  responses go to an exception queue (same pattern as `CUST-111`).
- `[DECISION NEEDED]` Which finance providers does LA Mattress use, and do any still require batch/FTP? If
  all are synchronous REST, we can drop the async branch entirely and simplify the settlement model.

---

### `CUST-124` Solicitation of Customer Information
*storis_ref: article 15297965125140*

> **TARGETED TOPIC #3 — this is the *only* article in positions 93–137 that addresses customer contact data
> as a legal matter, and it is the OPPOSITE of consent capture. See the targeted-topic findings at the end
> of this file.**

**Purpose.** Implements the requirement, in **certain states**, that a retailer **must not solicit personal
customer information when it is not required by the sale**. *"If subject to this requirement, an order can
be created where the customer is only required to provide their name without any other information, such as
address and phone number."*
(This is the US state credit-card-PII regime — e.g. California's Song-Beverly Credit Card Act and its
analogues — which prohibits requesting/recording personal identification information as a condition of a
credit card transaction.)

**Where it lives.** Behavioural article, no menu path. Page headings: `Rules for Requirement`,
`STORIS Settings`, `Order Validation - Initial Entry`, `Order Validation - Upon Final Save`.

**Fields / settings involved**

| Setting | Location | Purpose / business rule |
|---|---|---|
| `Prohibit Customer Personal Information when not Required by Sale` | **Warehouse/Store Location Settings** | **A STORIS-locked field. Default unchecked.** When checked, qualifying sales orders at that store auto-generate a name-only customer. **Locked = the retailer cannot turn its own compliance switch on; the vendor must.** |
| Address Verification Settings (AVS) | Electronic Service Settings | **"Address Verification Settings (AVS) for credit card purchases cannot be active."** — **AVS and this compliance mode are mutually exclusive**, i.e. complying costs you card-fraud protection. |
| `Sales Orders`, `Exchanges`, `Returns` (Fulfillment Methods section) | Point of Sale Control Settings | **"STORIS recommends setting these three settings to 'No Default'. Note that this is only a recommendation and is not enforced."** |
| `Validate Name Prefix` | Point of Sale Control Settings | Validates the generated `TW` customer prefix. |
| `Inactive Date` | Advanced Customer Settings | Set on the generated customer to prevent new activity. |

**Behavior & rules.**
- **Qualification criteria — ALL five must be true (quoted):**
  1. *"The order is a Customer Pickup or Take With for which the customer is taking the entire order with them."*
  2. *"Warranty lines are not present."*
  3. *"Payment has been made by credit card only."*
  4. *"Customer is not using a resale license."*
  5. *"No merchandise is back ordered."*

  *"If any of these criteria are NOT met, the order entry process continues as usual."*
- **Scope is by store location**, since the rule is state-based: *"these STORIS requirements and methods are
  based on the store location of the sales order."*
- **Initial-entry flow (quoted):**
  - With the setting checked, **"the `Customer` field in the Enter a Sales Order process is inaccessible."**
  - **"The Store must be selected prior to selecting Fulfillment Method. Once the Fulfillment Method is
    specified, the `Store` field becomes inactive."**
  - If store + fulfilment method qualify, the **`Is Customer Address Required`** window opens.
    **Bypassed if the Fulfillment Methods settings are set to `Customer Pick Up` or `Take With`** — in which
    case a customer can be entered without restriction.
  - Choosing **`None of the Above`** + Save opens the **`Enter a Customer Name`** window.
- **The generated anonymous customer (exact):**
  - **Customer ID has a prefix of `"TW"` (e.g. `TW88123804`).**
  - **`Address Line 1` is set to the literal `"No Address Required"`.**
  - **City, State and Zip are populated from the Store Location.**
  - *"The new customer assigned to the order is **not accessible for future orders**. An error is returned if
    the Customer ID is entered directly when attempting to add this customer to a delivery order."*
  - *"These customers are treated the same as **Quick Sale Customers**."*
- **Carried-forward finding — this mirrors the erasure routine exactly.** The erasure routine overwrites
  name and billing address 1 with the literal `"REMOVED"` and **retains city/state/ZIP**; this routine
  writes the literal `"No Address Required"` into address 1 and **populates city/state/ZIP from the store**.
  **STORIS consistently uses magic strings in `Address Line 1` as a status flag, and consistently leaves
  geographic fields populated.** Both patterns must be replaced with real nullable fields plus an explicit
  `address_status` enum (`REAL`, `ANONYMOUS_NOT_REQUIRED`, `ERASED`). **Magic strings in an address line
  will corrupt any address-based analytics, geocoding, or delivery-zone assignment we build.**
- **Escalation to a real customer (quoted):** *"The newly assigned customer may be accessible if a change to
  the order is made that requires the user to enter a valid address… the user is brought to the `Update a
  Customer Address` window… If the user Exits or does not provide a valid address, a message is presented
  that includes the reason the address is required. Once the address is provided, the order is saved and
  **the reason for the address is logged as order comment(s)**."*
- **Final-save validation, sales order (quoted):** *"If an order was saved in a manner that allowed a
  customer address, but was then subsequently modified where an address was prohibited, the user is
  permitted to save the order. In this case, the **order comments record why the customer address was
  associated with the order**. Additionally, **the User ID is logged in the order and associated with a time
  stamp**. This information is accessible via `Create a Report` using the **`ORDER`, `INVOICE.HOLD` or
  `VOIDED.ORDER`** files. **If the order is modified again in a manner that requires an address, the User ID
  and Time Stamp is removed.**"*
  → **A compliance audit trail that DELETES ITSELF on the next qualifying edit.** This is the single most
  important thing in the article: **the only compliance evidence STORIS captures is destructible by
  ordinary order editing, and there is no general change-audit log to fall back on.**
- **Balance-due rules:**
  - *"An order for a customer with no valid address **cannot have a Balance Due greater than zero**."* Error;
    pay or delete. **"If deleted, any credit card charges are voided."**
  - Negative balance due: saveable, **but a refund is required**; a warning asks the user to retain the order
    number as a reference. *"While the refund for the customer is permitted, **new orders are not allowed for
    the customer**."*
- **Returns:** if the original invoice has no valid address, the return is validated for whether one is
  needed (e.g. a pickup from the customer's home). If required, the address entered is **applied to the
  original order's customer code as well as the original order**, and the original order gets the comment
  **`"A valid customer address was required for this order due to Return."`** The customer then becomes
  accessible for future delivery orders. **Returns with no specified original invoice always require a valid
  address.** Returns for a no-address customer **must have zero balance**; a 2-click refund is voided if the
  order is deleted.
- **Exchanges:** same pattern; comment text **`"A valid customer address was required for this order due to
  Exchange."`** **Split exchanges are not permitted** for a customer without a valid address (the
  `Split Exchange` Actions option is inactive). Balance rules: positive → payment required or delete;
  negative → **full refund required, the exchange cannot be saved**, user must perform a 2-click refund.
  **Credit exchange → the order must be deleted since a post of AR is not possible. Debit exchange → pay or
  delete; debit exchanges cannot be saved.**
- **Service orders: an address is ALWAYS required.** No-address original invoice → choose an existing
  customer or create a new one.
- **Sales quotes and layaways: an address is ALWAYS required.** On conversion the `Is Customer Address
  Required` window opens; **choosing `None of the Above` blocks conversion — "the quote/layaway must be
  deleted and a new order must be created."**
- **The `Inactive Date` trap (quoted NOTE):** *"In order to allow a refund due to a negative balance or
  deleted order, STORIS requires that the customer become a standard customer. However, the `Inactive Date`
  field in Advanced Customer Settings is set so that new activity is not permitted… **if a return or exchange
  is required, the `Inactive Date` must be temporarily removed** in order to process the return or
  exchange."* — **a documented manual workaround requiring staff to disable a control to serve a customer.**

**Dependencies.**
- **Warehouse/Store Location Settings** → `Prohibit Customer Personal Information when not Required by Sale`
  (**STORIS-locked**).
- Electronic Service Settings → AVS (must be off).
- Point of Sale Control Settings → Fulfillment Methods (`Sales Orders`, `Exchanges`, `Returns`),
  `Validate Name Prefix`.
- Advanced Customer Settings → `Inactive Date`.
- Enter a Sales Order / Return / Exchange / Service Order; sales quote and layaway conversion; 2-click refund.
- `Create a Report` files `ORDER`, `INVOICE.HOLD`, `VOIDED.ORDER`.
- Related article: `Legal Code Settings`.
- Quick Sale customer handling.
- **`CUST-108`** (service orders always need an address) and the warranty-lookback concern
  (**addresses have no versioning**).

**Build notes.**
- **We need this capability** — it is a genuine statutory requirement in states LA Mattress operates in, and
  a take-with mattress sale paid by card is exactly the qualifying pattern.
- **Do differently — never write magic strings into address fields.** Model
  `customer.address_status ENUM('REAL','NOT_REQUIRED','ERASED')` with genuinely NULL address lines. This
  fixes both this routine and the erasure routine, and unblocks delivery-zone assignment and geocoding.
- **Do differently — the compliance audit trail must be immutable.** Record a
  `pii_solicitation_event(order_id, store_id, qualified boolean, criteria_snapshot jsonb, outcome,
  user_id, at)` row, append-only, in `RPT-AUDIT`. **STORIS's User-ID-and-timestamp stamp that is erased on
  the next edit is worse than nothing — it creates the appearance of an audit trail that will be empty
  exactly when it is needed.**
- **Do differently — the store-level switch must be ours to set, not the vendor's.** Drive it from a
  per-state compliance policy table with an effective date.
- **Do differently — do not force a choice between compliance and AVS.** Card fraud controls and PII rules
  are independent; run AVS on the billing address supplied to the processor without persisting it to the
  customer record.
- **Do differently — the `Inactive Date` workaround must not exist.** Refunds and returns to an anonymous
  customer should be first-class flows, not something that requires a clerk to disable a control.
- Keep: the five qualification criteria (implement as an explicit predicate with a stored snapshot), the
  store-scoped applicability, the always-required-address cases (service, quote, layaway, no-original-invoice
  return/exchange), and the zero-balance constraints.
- Anonymous customers should be **transaction-scoped identities**, not permanent rows that must be
  suppressed from lookup — and a later address supply should *promote* the identity with a recorded event,
  which STORIS half-does via order comments.
- `[DECISION NEEDED]` Which states does LA Mattress operate in, and which impose the no-solicitation rule?
  This determines whether the whole anonymous-customer flow is v1 or v2. **If California is in scope, it is
  v1.**

---

### `CUST-125` Special Character Settings
*storis_ref: article 15242595454868*

**Purpose.** Defines the special characters that must be **stripped out of credit application data** before
it is transmitted to a finance provider, because they cause validation errors at the provider.

**Where it lives.** `Finance Provider Settings > Online Transmit tab > global Actions button > Special Character Settings`
(therefore **per finance provider**).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Special Character` | single character | The character to omit from credit application data. `Add` puts it in the grid. |
| (grid) `Special Characters` | list | The characters to be omitted. |
| (grid) `Remove` | action | **"Removing the special character means it is transmitted with the credit application."** |

**Behavior & rules.**
- **Hard rule — the retailer cannot discover the list; the provider must supply it.** *"NOTE: The finance
  provider must supply the list of special characters causing the validation errors."*
- **The characters are silently *omitted*, not rejected or escaped.** So `O'Brien` transmits as `OBrien`,
  and `123½ Main St` loses the fraction. **Applicant name and address are the primary matching keys for a
  credit bureau pull — silently mangling them degrades match quality and can cause a false decline or, worse,
  a match to the wrong consumer.** Nothing in the article warns about this or records what was stripped.
- No character-class support (no "strip all non-ASCII"), no per-field configuration — it is a global
  character blacklist applied to the whole application payload for that provider.

**Dependencies.**
- Finance Provider Settings → Online Transmit tab; credit application submission; `CUST-123` Settlement Type.
- Customer master name/address fields (the data being mangled).
- **Carried-forward finding — PII masking applies only on re-access.** Credit application payloads contain
  SSN/DOB; this screen is part of that transmission path and is worth flagging to whoever owns
  `SAR-024` Report Secured Decryption Activity.

**Build notes.**
- Implement as a per-provider **transformation profile**, not a blacklist: `provider_field_transform(
  provider_id, field, transform ENUM('STRIP_CHARS','TRANSLITERATE','TRUNCATE','UPPERCASE'), config)`.
- **Do differently — transliterate, do not delete.** `Ñ → N`, `é → e`, `½ → 1/2`, `' → (removed)` are
  different decisions with different match consequences. Unicode normalisation (NFKD + ASCII fold) is the
  correct default for name/address fields going to a US bureau.
- **Do differently — record the transformation.** Store both the original and the transmitted value on the
  credit application record so a mismatch or dispute can be investigated. Feed `RPT-AUDIT`.
- Validate outbound payloads against the provider's schema **before** send, and surface a clear error, rather
  than quietly mutating data and hoping.
- `[DECISION NEEDED]` Whether we transmit credit applications at all depends on the finance-provider
  decision (see `CUST-097`, `CUST-123`).

---

### `CUST-126` Special Comment Settings
*storis_ref: article 15297965136020*

**Purpose.** Maintains the **Metro 2 special comment message codes** reported to credit bureaus through the
Credit Reporting Process. The codes are the standard set from **Exhibit 6 of the Consumer Data Industry
Association (CDIA) Credit Reporting Resource Guide**.

**Where it lives.**
- `Accounting > Revolving Receivables > Metro 2 Features > Metro 2 Settings > Special Comment Settings`
- `Accounting > Installment > Metro 2 Features > Metro 2 Settings > Special Comment Settings`
- `System Administration > System Settings > Accounting System Settings > Metro 2 Settings > Special Comment Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Special Comment Code` | code (select only) | The Metro 2 special comment to view or edit. Search lists them. |
| `Description` | text, **max 200 characters** | Description of the special comment. **`Action` → `Description Translation`** (multilingual). |
| `Account Closed` | checkbox | **See the cascade below.** |
| (label under `Account Closed`) | display | *"Text appearing below the `Account Closed` field indicates whether this special comment is available for reporting revolving receivables, installment receivables, or both."* |

**Behavior & rules.**
- **Hard rule — closed enum.** *"NOTE: **You cannot add or delete special comment codes.**"* The set is
  fixed by the CDIA standard (and by STORIS). *"STORIS flags all special comment codes as available for entry
  on Revolving plans."*
- **Hard rule — `Account Closed` triggers a three-way cascade on the customer.** If checked, applying this
  comment to a customer (via **Metro 2 Code Settings**, `CUST-090` in part B) causes the system to:
  1. **close the customer's account**,
  2. **apply the closed date to the customer's record**, and
  3. **inform the credit bureau the customer's account is closed.**
  *"You can view the customer's closed date (if any) via the Metro 2 Code Settings."*
  → **A comment-code configuration checkbox silently causes account closure and a bureau report. This is a
  reportable consumer-credit action driven by a settings-screen flag.**
- Assignment to a customer is done at **`Metro 2 Settings` via the `Action` button on the Receivables tab in
  Advanced Customer Settings** — i.e. on the customer record, not here.

**Dependencies.**
- `CUST-090` Metro 2 Code Settings (part B) — customer-level assignment and closed-date display.
- Advanced Customer Settings → Receivables tab → Metro 2 Settings.
- Credit Reporting Process (Metro 2 file generation); revolving and installment receivables.
- `CUST-131` Status Code Settings; General System Control Settings (**Extended Security** kill-switch).
- CDIA Credit Reporting Resource Guide, Exhibit 6.

**Build notes.**
- Keep the code set as a **code-defined closed enum** sourced from the current CDIA Resource Guide, with a
  user-editable localised description — same pattern as `CUST-109`. **Never let users invent Metro 2 codes.**
- **The `Account Closed` cascade must be an explicit, permissioned, audited workflow, not a side effect.**
  Closing a consumer's account and reporting it to a bureau is an **FCRA-significant act**: it requires
  accuracy, a dispute path, and evidence of who did it and why. Implement as
  `credit_report_action(customer_id, action, metro2_code, effective_date, actor, reason, dispute_status)`
  appended to `RPT-AUDIT`, with the bureau file generated *from* that log.
- **FCRA §623 accuracy and dispute obligations** mean the Metro 2 pipeline needs: a dispute flag that
  suppresses adverse reporting (STORIS has an analogue — see the `Compound Late Fees` dispute rule in
  `CUST-119`), reinvestigation tracking, and a full history of what was reported when. **STORIS's lack of a
  general change-audit log makes FCRA reinvestigation effectively impossible; ours must not.**
- Metro 2 file generation must be reproducible from stored history, not recomputed from current state.
- `[DECISION NEEDED]` Does LA Mattress furnish data to credit bureaus? Only relevant if we originate our own
  credit (see `CUST-097`). **If we do not, descope the entire Metro 2 cluster (`CUST-090`, `CUST-126`,
  `CUST-131`) — becoming a furnisher is a serious compliance undertaking that should be a deliberate
  business decision, never a side effect of porting a settings screen.**

---

### `CUST-127` Special Occasion Settings *(Special Dates)*
*storis_ref: article 15297959796628*

**Purpose.** Maintains the list of **special occasions / special dates** — customer anniversaries, birthdays
and similar — that appear in lookup windows at `Special Occasion` prompts.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Sales Lead System Settings > Special Occasion Settings`
Support Files: **None.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Special Dates` | code, **up to 6 characters** | Identifies this special occasion. (Field label is `Special Dates`; the article title is `Special Occasion Settings`.) |
| `Description` | text, **up to 30 characters** | Description of the occasion. |

**Behavior & rules.**
- Thin article — a two-field taxonomy. No dates stored *here*; this defines the *types* of occasion. The
  actual date per customer lives on the customer record.
- **Privacy note — this is the marketing-trigger side of the customer date-of-birth field** (`CUST-046`
  Enter Customer's Date of Birth, part A). Combined with the finding that **PII masking applies only on
  re-access**, birthdays are personal data being collected for marketing purposes.
- **No consent linkage.** There is nothing here (or anywhere in positions 93–137) tying an occasion-based
  marketing touch to a customer's contact preference or opt-in. See the targeted-topic findings.
- No expiry, no translation action, no store scoping.

**Dependencies.**
- Sales Lead System Settings; `Special Occasion` prompts on the customer record.
- `CUST-046` Enter Customer's Date of Birth (part A); `CUST-089` Method of Contact Settings (part B);
  `CUST-086` Marketing Code Settings (part B); `CUST-087` Membership Reward Settings (part B).

**Build notes.**
- Model `occasion_type(code, description)` plus `customer_occasion(customer_id, occasion_type_id, month,
  day, year NULL)` — note the year should be optional so an anniversary can be stored without exposing an
  age, and so a birthday can be stored as month/day only.
- **Do differently — gate every occasion-triggered outbound message on an explicit, recorded consent for
  that channel.** An automated birthday SMS with no consent record is precisely the TCPA exposure flagged in
  the targeted-topic findings. **Do not build occasion-based outbound marketing until the consent model
  exists.**
- Support more than 6-character codes; add store/brand scoping if occasions drive campaigns.

---

### `CUST-128` Spiff Table Settings
*storis_ref: article 15297959789076*

**Purpose.** Creates **spiff tables for as-is pieces** — banded dollar bonuses paid to the salesperson for
selling a specific as-is (damaged/clearance) piece at or above given price levels.

**Where it lives.** No explicit menu path given in the article. Applied via the **`Spiff Amount` field on the
`As-Is Status` and `Move to As-Is` tabs in `Enter a Stock Adjustment`**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Code` | code, **up to 10 characters**, **unique** | Spiff table identifier. Search to look up an existing table. |
| `Description` | text | Description. **Extra `Action` button → multilingual description.** |
| `Spiff Amount` | money | Dollar amount awarded to the salesperson for selling this product within the associated price level. |
| `Price Level` | money | *"Enter a selling price for this product, **above which** you want to award the associated spiff amount."* |

**Behavior & rules.**
- **Flat-spiff convention (stated twice, from both fields):** *"To pay a flat dollar amount to the salesperson
  whenever this product is sold, regardless of the selling price, enter the flat dollar amount in the
  `Spiff Amount` field and **leave the `Price Level` field blank**."*
- Application flow: *"Once a spiff table has been selected via the `Spiff Amount` field on the `As-Is Status`
  and `Move to As-Is` tabs in `Enter a Stock Adjustment`, it is **automatically applied to the piece**,
  although **you can modify the values or clear the table if necessary**."* → **the table is a template
  copied onto the piece, then editable per piece.** Same copy-down (not live-inheritance) pattern as STORIS
  group permissions — worth flagging as a consistent design we are replacing.
- Award condition: *"When this product appears on an order, the salesperson can be awarded the spiff based on
  the price level specified in the table."* The word *can* is doing work — the article does not state whether
  the award is automatic or requires a commission run.
- **Hard rule — permission-gated application:** *"While spiff tables may be created, **they cannot be applied
  via `Enter a Stock Adjustment` unless you have permission via `Enter a Stock Adjustment - Update an as-is
  piece spiff table` in `Create a User/Group Actions - Logistics Security`**."* Note the permission is in
  **Logistics** security, not Sales — spiffs are set by whoever marks the piece as-is, i.e. the warehouse,
  not sales management. Inert without the global **Extended Security** kill-switch.
- **`Price Level` is "above which"** — the article does not say whether the comparison is strict (`>`) or
  inclusive (`≥`), and does not describe multi-band precedence. **Ambiguity to resolve; assume banded
  ascending like `CUST-097`/`CUST-104`, highest qualifying band wins.**
- **Per-piece editable spiff amounts on as-is merchandise, set by warehouse staff, with no audit log, is a
  self-dealing surface**: the person who marks a piece as-is can set the bonus paid for selling it.

**Dependencies.**
- Enter a Stock Adjustment → `As-Is Status`, `Move to As-Is` tabs; as-is piece records.
- `CUST-120` Salesperson Settings; `CUST-102` Payment Commission Adjustments; commission engine;
  Report Sales Commissions.
- `CUST-117` Sales Discount Settings → `Apply Discount for ASIS Line Items`, `Reason Code` (As-Is reason
  codes) — **as-is pieces are both spiffed and discountable, and the two interact on margin.**
- Create a User/Group Actions - **Logistics Security** → `Enter a Stock Adjustment - Update an as-is piece
  spiff table` (`parts/user-security-CATALOG.md`).
- Related: `Price/Spiff/Commission Table` (referenced from `CUST-116`).

**Build notes.**
- Model `spiff_table(code, description)` + `spiff_band(table_id, min_selling_price NULL, amount)`, and
  `as_is_piece.spiff_table_id` **plus a snapshot** of the bands actually applied, so a later table edit does
  not restate historical spiffs.
- **Do differently — reference the table, do not copy it, and make per-piece overrides an explicit,
  permissioned, audited exception** rather than free editing. This is the same correction we are making to
  group permissions (live evaluation, not copy-down).
- **Do differently — separate the authority to mark a piece as-is from the authority to set its spiff.**
  Warehouse marks as-is; sales/finance management approves the spiff. Two permissions, two people.
- Define the band comparison explicitly (recommend `selling_price >= min_selling_price`, highest qualifying
  band wins, null `min_selling_price` = flat/always).
- As-is spiffs are cash compensation tied to inventory disposition — **every table change and every
  per-piece override feeds `RPT-AUDIT`**, and there should be an exception report on pieces whose spiff
  exceeds a threshold or exceeds the piece's margin.
- `[DECISION NEEDED]` As-is/clearance spiffing is genuinely useful for mattress floor models and damaged
  freight. Confirm the policy and the approval chain before building.

---

### `CUST-129` Staff GL Limited Access Detail Screen
*storis_ref: article 15242407154068*

**Purpose.** Defines the specific **General Ledger accounts and account ranges** a user may access. Prompts
for root accounts, sub-accounts, or cost centers depending on the responses given in the *General Ledger User
Permissions* routine.

**Where it lives.** Reached from the **General Ledger User Permissions** routines (the user is specified
there; this screen captures the account detail). No direct menu path.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Account Element` | display-only | The account element specified in the General Ledger User Permissions routine. |
| `Employee` | display-only | The employee specified in the General Ledger User Permissions routine. |
| `Account Element or Range` | account or range | Single account or a range. **The prompt name changes dynamically: "if you specified `Limit Root Account`, the field below would be called '`Root Account or Range`'."** Search lists accounts; `Action` → **`Multiple GL Account Selection`** screen. **"If using sub-accounts, the GL Account lookup excludes records that contain the GL Account Separator."** |
| (grid) | display | Accounts and ranges specified. **"For individual accounts, the `Description` column displays the description from the GL Account record. For account ranges, the system displays 'From 9999 to 9999.'"** |

**Behavior & rules.**
- **Hard rule — minimum specification:** *"You must specify **at least one root account** and **at least one
  sub-account or cost center**."*
- **Hard rule and a real defect — unvalidated, overlapping ranges:** *"when specifying ranges, you can enter
  **starting and ending accounts that do not need exist on file**. Furthermore, when specifying multiple
  ranges, **the system makes no check to adjust overlapping ranges**."*
  → **GL access grants can reference non-existent accounts and can overlap arbitrarily, with no
  normalisation. Whether a given account is permitted is therefore not statically determinable from the
  UI — an auditor cannot read the grant and know what it allows.**
- **Access is the intersection of the three element lists (verbatim example):**
  - Root accounts: `1000, 1100` (a range), plus `1200`, plus `1300`.
  - Sub-accounts: `10AA`, `20AA`.
  - Cost centers: `01, 09` (a range).
  - *"Only the allowed root accounts in combination with sub-accounts `10AA` or `20AA` will appear on
    inquiries."* … *"This further limits the allowable combinations of root account and sub-account to cost
    centers `01` through `09`."*
  → **permitted = root ∈ R **AND** sub ∈ S **AND** cost center ∈ C.** A cross-product grant, so adding one
  root account widens access across every permitted sub-account and cost center.
- The example is framed as **"inquiry privileges"** — read access. The article does not distinguish read from
  post/edit; that presumably lives in General Ledger User Permissions.
- **Note the field is labelled `Employee`, not `User`** — another instance of the employee/user/salesperson
  identity confusion seen in `CUST-120`.

**Dependencies.**
- **General Ledger User Permissions** (parent) — decides which account element is being limited.
- Chart of accounts: root accounts, sub-accounts, cost centers, **GL Account Separator** setting.
- `CUST-134` TPA GL Account Entry; `CUST-133` TPA Account Description Index.
- `parts/user-security-CATALOG.md` — all of it gated by the global **Extended Security** kill-switch, so
  **these GL restrictions are inert unless Extended Security is on.** That is a serious exposure to note:
  a single global flag turns off financial-data segregation.

**Build notes.**
- Implement GL scoping as **explicit, validated rules**, not free-text ranges:
  `gl_access_rule(principal_id, effect ENUM('ALLOW','DENY'), root_account_pattern, sub_account_pattern,
  cost_center_pattern, capability ENUM('VIEW','POST','ADJUST'))`, evaluated with
  **most-specific-scope-wins and DENY overriding ALLOW** — consistent with the live-evaluation model we are
  replacing STORIS's copy-down group permissions with.
- **Do differently — validate range endpoints against the chart of accounts** and reject or normalise
  overlaps. An access grant that cannot be evaluated statically cannot be audited.
- **Do differently — make grants effective-dated and fully audited.** Who can see which GL accounts is a
  SOX-relevant control; changes must feed `RPT-AUDIT`.
- **Do differently — never let one global switch disable financial segregation.** Drop the Extended Security
  pattern entirely (already the agreed position); GL scoping must be always-on.
- Provide an "explain access" tool: given a user and an account, show which rule granted or denied it. This
  is the direct answer to STORIS's unevaluatable overlapping ranges.
- Separate `VIEW` from `POST` explicitly — the article only discusses inquiry.

---

### `CUST-130` Statement Notification Days
*storis_ref: article 15242391204500*

**Purpose.** Specifies **when** (a window of days before the event) and **where** (which statement section)
automatic warning messages appear on a customer's revolving statement for four events: promotional interest
expiration, no-payment period expiration, waived-interest chargeback jeopardy, and plan transfer.

**Where it lives.** `Sales Tax Settings > Revolving tab > Statement Notification Days` button
(so, again, **scoped to a tax jurisdiction/state** — see `CUST-119`).

**Fields** — four event rows, each with the same three fields:

| Event row | Fields | Purpose / business rule |
|---|---|---|
| `Promotional Interest Expiration` | `Start Days`, `Stop Days`, `Print Within the ___ Section` | Days **prior to** the promotional interest expiration date (from `CUST-114`, Advanced tab) to start / stop printing. |
| `No Payment Expiration` | same | Days prior to expiry of the no-payment promotion (`CUST-114`, Advanced tab). |
| `Chargeback Waived Interest` | same | Days prior to expiry of the waived-interest promotion. |
| `Plan Transfer When Delinquent` | same | Days prior to the transfer date (`CUST-114` `Transfer Balance to Plan` / `Days Late`). |

| Field | Type | Purpose / business rule |
|---|---|---|
| `Start Days` / `Stop Days` | integer **0–99** | The notification window, expressed as days **before** the event. |
| `Print Within the ___ Section` | enum — **5 exact values** | **"If you have established Start and Stop Days, selection at this field is mandatory."** Values: `Payment Information`, `Changes to Interest Rate`, `Changes to Account Terms`, `Special Purchase Plan Summary`, `General Notes`. |

**Behavior & rules.**
- Messages are inserted **during cycling**.
- **`Special Purchase Plan Summary` has a silent-failure rule (quoted):** *"This option only applies to 0%
  interest special plans (promotional interest percentage on the advanced tab of Revolving Payment Plan
  Settings is set to zero). If you select this option for any of the notification days settings on this
  screen, **and the override interest is not 0%, nothing prints**."* — **a required disclosure can be
  silently suppressed by a configuration mismatch.**
- **Exact generated message templates (verbatim — these are consumer disclosures and must be ported
  precisely or replaced with counsel-approved equivalents):**
  - **Promotional Interest Expiration** — printed *"if any of the transactions posted to the plan have a
    remaining balance and the promotional interest expiration date falls within the statement notification
    days specified here"*:
    > `The interest rate on Order Number 9999999999 with remaining balance $99999.99 will change from 99.99% to 99.9% on MM/DD/YY`
  - **No Payment Expiration** — same remaining-balance condition:
    > `The no payment period for Order Number 9999999999 with remaining balance $99999.99 will expire on MM/DD/YY`
  - **Waived Interest Chargeback** — printed if `Charge Back Waived Interest on MMP Balances, NN Days
    Overdue` is set in **Revolving Receivables Control Settings** and the plan is delinquent, **or** if a
    no-interest plan is not paid off by the waived-interest expiration date:
    > `Special Purchase Plan Warning: [Plan xxxx] You must make your minimum payment due each month and pay your special purchase plan balance on order xxxxxx in full by [cycle date] to avoid paying accrued interest charges.`
  - **Plan Transfer, non-tiered** — printed if `Transfer Balance to Plan XX if Payment is NN Days Late` is
    set, the plan is past due, and transfer is in jeopardy within the window:
    > `You have failed to timely make your required minimum monthly payment under your Special Purchase Program for plan [xxx]. Accordingly, if we don't receive your minimum monthly payment by [cycle date], we will apply to your account all interest accrued from the date of purchase at the regular APR of [state override]% These rates will then continue to apply indefinitely to your outstanding balance under the Special Purchase Program and to all other balances for old and new transactions.`
  - **Plan Transfer, tiered:**
    > `You have failed to timely make your required minimum monthly payment under your Special Purchase Program for plan [xxx]. Accordingly, if we don't receive your minimum monthly payment by [cycle date], we will apply to your account all interest accrued from the date of purchase at the regular APR of [plan %](applied to the average daily balance of your account which is $[plan $ from table] or less) and [plan %] (applied to the portion of the average daily balance of your account which is more than $[plan $ from table]). These rates will then continue to apply indefinitely to your outstanding balance under the Special Purchase Program and to all other balances for old and new transactions.`
  - **Tiered vs non-tiered is selected by `Use Tiered Interest Rates` on `Sales Tax Settings > Revolving`
    (i.e. `CUST-104` / `CUST-119` `Tiered Balance Calculation`).**
  - Note the non-tiered template substitutes **`[state override]%`** — the jurisdiction's `Maximum %`
    interest cap from `CUST-119`, not the plan rate. **The disclosed APR comes from the state cap.**
- **Retroactive-interest ("deferred interest") disclosure is the core purpose here.** These are the messages
  that warn a consumer their 0%/no-payment promotion is about to convert and accrued interest will be
  charged back to the purchase date. **This is among the most heavily scrutinised disclosures in consumer
  retail finance (CFPB deferred-interest enforcement).**
- Additional, manually authored statement messages are available via `Enter Statement Messages` and
  `Indicate Message to Print on Customer Statements`.

**Dependencies.**
- `CUST-119` Sales Tax Settings → Revolving tab (parent), `Use Tiered Interest Rates` / `Tiered Balance
  Calculation`, `Maximum %` state override.
- `CUST-114` Revolving Payment Plan Settings → Advanced tab (promotional `Percentage`, `Expires` /
  `Valid Days`, no-payment `Until` / `Number of Days`, `Transfer Balance to Plan`, `Days Late`).
- `CUST-104` Percentage Break Level Table (tiered amounts in the tiered template).
- Revolving Receivables Control Settings → `Charge Back Waived Interest on MMP Balances, NN Days Overdue`.
- Cycling engine; statement rendering; Enter Statement Messages; Indicate Message to Print on Customer
  Statements.

**Build notes.**
- Implement as `disclosure_rule(jurisdiction_id, event_type, start_days_before, stop_days_before,
  statement_section, template_id)` with **versioned, counsel-approved templates**.
- **Do differently — never silently suppress a disclosure.** The `Special Purchase Plan Summary` /
  non-zero-override combination must raise a configuration error, not print nothing. Add a pre-cycle
  validation that every configured disclosure will actually render, and an exception report for suppressed
  disclosures.
- **Do differently — record what was disclosed.** Store the rendered message, its template version, and the
  values substituted, against the statement and the customer. **Deferred-interest disputes are won or lost
  on proof of disclosure**, and STORIS keeps no such record. Feed `RPT-AUDIT`.
- Templates must be data, effective-dated, and reviewable; **do not** hard-code them.
- `[DECISION NEEDED]` Deferred-interest ("no interest if paid in full") promotions carry significant
  regulatory risk. If LA Mattress offers them through a third-party provider, the provider owns these
  disclosures and this whole article is out of scope. **Confirm who owns the disclosure obligation before
  building anything here.**

---

### `CUST-131` Status Code Settings
*storis_ref: article 16917916176788*

**Purpose.** Establishes the **status codes for open service calls** (e.g. `NEW` = new service call,
`CLS` = closed), with follow-up tickling, an expected-duration benchmark, and a close-without-completion
capability.

**Where it lives.**
- `System Administration > System Settings > Customer System Settings > Sales and Service System Settings > Status Code Settings`
- `Merchandising and Distribution > Settings > Service Settings > Status Code Settings`
- `Customer > Customer Service > Settings > Status Code Settings`
- `Customer > Settings > Service Settings > Status Code Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Status Code` | code, **up to 3 characters** | Represents the service status. Examples given: `NEW`, `CLS`. |
| `Description` | text, **up to 20 characters** | Description of the status. |
| `Tickle on Change To` | checkbox | *"whether the representative to whom this call has been assigned will be **tickled to call the customer** when the service call has been modified."* — an automatic follow-up task on status change. |
| `Average Number of Days` | integer | *"used in tracking service orders that have remained in this status **longer than the average** set here."* — an aging/SLA benchmark per status. |
| `Close Without Completion` | checkbox | *"To use this status code to close service orders **without scheduling a service line, printing a ticket, or assigning a technician**, check this box."* |

**Behavior & rules.**
- **Two hard restrictions on `Close Without Completion` (quoted):**
  - *"Status Codes designated as `Close Without Completion` **cannot be set as the `Status for Closed
    Orders`** as found in the **Service Control Settings**."*
  - *"Status codes with this box checked **cannot be used to close Quick In-Shop service orders**."*
- **`Close Without Completion` is an abandonment path**: a service order can be closed with no technician,
  no ticket and no service line. **Necessary (customer cancels, duplicate call, warranty denied) but it is
  also the route by which unresolved service complaints disappear from the queue.** No reason code, no
  permission and no audit is described.
- **3-character codes and 20-character descriptions** are tight for a modern service workflow.
- Nothing here models allowed transitions — **the status set is a flat list, not a state machine.**

**Dependencies.**
- Service Control Settings → `Status for Closed Orders`.
- `CUST-108` Problem Code Settings; `CUST-126` Special Comment Settings (sibling taxonomies).
- Enter a Service Order; Quick In-Shop service orders; Logistical Scheduling; technician assignment;
  work orders / trip sheets.
- Tickler / follow-up task system.

**Build notes.**
- Model as a real **state machine**: `service_status(code, description, is_terminal, closes_without_work,
  sla_days, triggers_followup)` **plus** `service_status_transition(from, to, requires_permission,
  requires_reason)`. A flat status list guarantees illegal transitions.
- **Do differently — require a reason code and a permission on `Close Without Completion`, and audit every
  use.** Add an exception report: service orders closed without completion, by user, by week. This is a
  customer-satisfaction and warranty-liability control, and it is exactly the sort of thing
  `RPT-AUDIT` exists for.
- Keep `Average Number of Days` but express it as an **SLA target** with automatic aging alerts, not just a
  report benchmark.
- Keep `Tickle on Change To`, but implement as a proper task/notification with an owner, due date and
  completion record — **and gate any *outbound customer contact* it generates on the consent model** (see
  targeted-topic findings).
- Allow longer codes and descriptions.

---

### `CUST-132` Terms Settings
*storis_ref: article 15297965130132*

**Purpose.** Establishes **terms codes** used both to calculate due dates for **accounts receivable** and to
define **payment terms for vendors** (AP), including two discount tiers and multi-payment schedules.

**Where it lives.** **Twenty-one documented paths** — the most of any article in this part — spanning
Merchandising and Distribution (Buyer/Merchandiser Tools, Purchase Discount Settings), Accounting
(Receivables, Payables, General Ledger, Third Party Accounting) and System Administration
(`Get Started Step 6 - Purchasing`, and four System Settings routes).
Tabs: `General`, `Scheduled Payments`.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Terms Code` | code, **up to 6 characters** (stated in the `TPA Equivalent` help) | The terms record. **"STORIS allows you to specify two levels of discounts within each terms code."** Examples: `N30` = Net 30 Days; `2/10` = 2% if paid within 10 days, net due in 30. |
| `Description` | text, **up to 20 characters** | Description. |
| `Due Days` | integer | *"the number of days from the **vendor invoice date** that final payment of the invoice is due, regardless of any discounts."* |
| `Terms One Days` | integer, **mandatory** | Days from the vendor invoice date within which the terms-one discount applies. |
| `Terms One Discount` | percent, **two decimals**, **mandatory** | The terms-one discount. **"Example: enter 2% as 2.00."** Applied if payment is within `Terms One Days`. |
| `Terms Two Days` | integer, **optional** | Days for the terms-two discount. |
| `Terms Two Discount` | percent, two decimals | **"This is an optional field unless the `Terms Two Days` field contains a value."** (The help text mislabels it *"the amount of the terms-**one** discount"* — **a documentation error.**) |
| `Number of Payments` | integer, **default `1`** | **Active only if STORIS AP Processing is active.** **Entering > 1 activates the `Scheduled Payments` tab and INACTIVATES `Due Days`, `Terms One Days`, `Terms One Discount`, `Terms Two Days`, `Terms Two Discount`** (stated twice in the article). |
| `TPA Equivalent` | text, optional | Cross-reference to the Third-Party Accounting system's terms ID when the codes differ. **"If you leave this field blank, the TPA system uses the ID for this record."** Verbatim example: QuickBooks record `NET 30 DAYS` ↔ STORIS `N30`, **"because the `Terms Code` field only accepts up to 6 characters."** |
| `Purchase Order Print Addendum` | enum — **3 exact values** | For **import** purchase orders, an addendum enhanced-laser form printed whenever the PO uses this terms code: `None`, `Document Against Payment`, `Telegraphic Transfer`. (Trade-finance instruments — D/P and T/T.) |

**Fields — Scheduled Payments tab** (active only when `Number of Payments` > 1)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Months Before First Payment` | integer **1–12** | *"the number of months you want to expire before the first scheduled payment date… becomes due. If you enter 1, the first scheduled payment is due in the first month after the invoice date."* |
| `Invoice Cutoff Day` | integer **1–31** | *"Invoices dated on or before the day of the month you enter here become due on the corresponding day in the `Due Day` column."* **"The numbers you enter must be between 1 and 31 and in ascending order with 31 as the last value."** |
| `Due Day` | integer **1–31** | Day of month payments become due for the associated cutoff day. |

**Behavior & rules.**
- **Hard rule — the payment schedule grid does NOT control amounts.** *"The grid does not affect the number
  or amount of the payments. **The program distributes payments evenly based on the invoice terms amount and
  the number of payments specified.**"* You can enter as many due dates as you like; amounts are always an
  even split.
- **Hard rule — month-end rollback (quoted):** *"If you enter a number that doesn't exist in a month, for
  example 2/31/08, the program **decrements the number by one until it finds a valid date**."* So a due day
  of 31 becomes 28 (or 29) in February. Deterministic and worth copying.
- **Verbatim worked example:** terms code with three payments, a single cutoff day of `31`, a due day of
  `10`, and `2` months before the first payment. Invoice dated **8/15/09** → due dates **10/10/09,
  11/10/09, 12/10/09.**
- **Hard rule — TPA terms must be maintained twice, by hand:** *"If the Third-Party Accounting module is
  active, you must set up terms in **both** STORIS and in the third-party accounting software (for example,
  QuickBooks®). You must do this **manually; no automatic transfer of terms codes is possible** from STORIS
  to QuickBooks or from QuickBooks to STORIS."* — a documented, permanent manual-sync burden.
- **One terms table serves both AR and AP**, and all the field help is written from the **vendor invoice**
  perspective. **How a terms code behaves on the receivable side is not documented here at all** — a real
  gap when the same code is used for customer due dates.
- Everything is measured from the **invoice date**, not the ship date or the statement date.

**Dependencies.**
- Vendor master (payment terms), purchase orders, AP bill entry, `Select and Approve Bills for Payment`,
  `CUST-121` Select Bank Check Run File Format.
- Accounts receivable due-date calculation; `CUST-119` Sales Tax Settings → Open Item service charges
  (`Service Charge Days`).
- Third-Party Accounting (QuickBooks) — `TPA Equivalent`; `CUST-133` TPA Account Description Index;
  `CUST-134` TPA GL Account Entry.
- Enhanced laser forms (PO addendum); import purchasing / trade finance.
- **Reuses the `TERMS_CODE` resolver scope already registered in wave 1.**

**Build notes.**
- **Do differently — split AR terms from AP terms.** They share a shape but not a lifecycle, not an owner,
  and not a set of business rules. One table serving both is why the AR behaviour is undocumented. Keep the
  shared `TERMS_CODE` scope for the resolver, but two tables.
- Model discount tiers as a list, not two fixed pairs: `terms_discount(terms_id, within_days, pct)` — some
  vendors offer three tiers, and `2/10 net 30` is just the common case.
- **Keep the month-end rollback rule verbatim** (decrement until valid) and unit-test 31→Feb, leap years.
- **Do differently — allow uneven scheduled payments.** Even distribution is a limitation, not a feature;
  import terms frequently require a deposit plus balance.
- Explicitly define the **base date** (invoice date) and support alternatives (EOM, proximo, receipt date) —
  common vendor terms STORIS cannot express.
- **Do differently — eliminate the manual TPA double-entry** by syncing terms through the accounting
  integration. If we cannot, at minimum add a reconciliation report that flags terms present in one system
  and not the other.
- Terms changes alter payment timing and discount capture — effective-date them and feed `RPT-AUDIT`.
- 6-character codes are too short; use slugs.

---

### `CUST-133` TPA Account Description Index
*storis_ref: article 15242391204884*

**Purpose.** A GL account **search-by-description** helper: type a word string and see every GL account whose
description contains it.

**Where it lives.** Reached from GL account fields, via the `Action` menu on `CUST-134` TPA GL Account Entry.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Account` | text (search string) | *"Enter a word string into the `Account` field and press Enter. All GL accounts containing the word string appear."* |
| `Search` button | action | Opens the **`GL Account Selection`** window. |

**Behavior & rules.**
- Thin article — a substring lookup on GL account descriptions. No wildcard syntax, no field selection, no
  scoping to the user's permitted accounts is described.
- **Note the gap against `CUST-129`:** nothing says this index respects the user's **Staff GL Limited Access**
  restrictions. **A description search that returns accounts the user cannot otherwise see would leak the
  chart of accounts.** Unverified, but worth checking on the live system.

**Dependencies.**
- `CUST-134` TPA GL Account Entry (parent); `GL Account Selection` window.
- Chart of accounts (maintained in the third-party accounting system — see `CUST-134`).
- `CUST-129` Staff GL Limited Access Detail Screen (the restriction this lookup should honour).

**Build notes.**
- Trivially replaced by a typeahead on account number **and** description, ranked, with fuzzy matching.
- **Do differently — enforce access scoping in the lookup.** Every account picker must filter by the user's
  GL access rules (`CUST-129` build notes). Search results are an access-control surface.

---

### `CUST-134` TPA GL Account Entry
*storis_ref: article 15242610698132*

**Purpose.** The shared GL-account picker that appears *"at many GL Account fields, for example in the
Post/Update a Journal Entry routine"* — captures the account plus an optional cost center, including a
**wildcard-by-location** mode.

**Where it lives.** Appears at GL Account fields throughout the system (referenced by `CUST-093`,
`CUST-111`, `CUST-114`, `CUST-115`, `CUST-117`, `CUST-119`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Account` | GL account, **must be valid** | *"The account you enter must be a valid General Ledger account."* `Action` → `GL Account Selection` window or `TPA Account Description Index` (`CUST-133`). |
| `Cost Center` | cost center code, **or `Wildcard Cost Center`** | Appended to the GL account when transactions post, *"and then uses it to track all GL activity involving this GL account for the current record, **regardless of the locations for individual transactions**."* |

**Behavior & rules.**
- **Hard rule — the chart of accounts is not owned by STORIS (quoted):** *"You create General Ledger accounts
  using a third-party accounting software (for example, QuickBooks®) and then transfer them to STORIS."*
  **The ERP is downstream of the accounting package for account creation.**
- **Two cost-center modes, and the difference matters:**
  - A **fixed cost center**: every transaction for this record posts to that cost center, **regardless of
    where the transaction actually happened.**
  - **`Wildcard Cost Center`** (selected from the list of available locations): *"The program determines the
    Location associated with the transaction (for example, the sales location or the location where goods
    were received into inventory), and **appends the location code to the General Ledger account, with the
    separation character (specified in the General Ledger Control Settings) inserted in between the two**."*
    → **this is how per-store P&L is achieved. Choosing a fixed cost center silently collapses multi-store
    activity into one bucket.**
- **Hard rule — cost centers must be mirrored manually in the accounting package:** *"STORIS creates cost
  centers automatically when you create a Location record. Note that **for each cost center in STORIS, you
  must set up a matching cost center as a `Class` in your third-party accounting software** (for example,
  QuickBooks)."* Same manual double-maintenance burden as `CUST-132` `TPA Equivalent`.
- The **GL Account Separator** character is a global setting in General Ledger Control Settings, and
  `CUST-129` notes the GL lookup **excludes records containing the separator** when sub-accounts are in use.

**Dependencies.**
- Third-party accounting system (QuickBooks) — chart of accounts and Classes.
- General Ledger Control Settings → separation character.
- Warehouse/Store Location Settings (cost centers auto-created per location).
- `CUST-133` TPA Account Description Index; `GL Account Selection`; `CUST-129` Staff GL Limited Access.
- Every screen with a GL account field: `CUST-093`, `CUST-111`, `CUST-114` (three mandatory accounts),
  `CUST-115`, `CUST-117` (line and subtotal discount accounts), `CUST-119`.
- Post/Update a Journal Entry.

**Build notes.**
- **Keep the wildcard-cost-center concept — it is genuinely good.** Model GL coding as a structured tuple
  `(account, cost_center)` where `cost_center` may be a literal or the token `@TRANSACTION_LOCATION`,
  resolved at post time from the transaction's location. **Do not** implement it as string concatenation
  with a separator character; that is a 1980s COBOL account-code convention and it makes every account
  string parse-dependent.
- **Do differently — own the chart of accounts in the ERP** and push to the accounting package, or sync
  bidirectionally. Being downstream for account creation while being the source of every transaction is the
  wrong dependency direction, and it is why cost centers must be hand-mirrored.
- **Do differently — eliminate manual cost-center mirroring** via the accounting integration; failing that,
  a reconciliation report (locations without a matching Class).
- Enforce GL access scoping (`CUST-129`) in this picker.
- GL coding changes on configuration records are high-impact — feed `RPT-AUDIT`.

---

### `CUST-135` Track Processing Activity
*storis_ref: article 15242611859732*

> **⚠️ THIS ARTICLE PARTIALLY CONTRADICTS AN ESTABLISHED WAVE-1 FINDING. See the correction note below and
> the targeted-topic findings at the end of this file.**

**Purpose.** Configures **field-level change auditing** ("on-line comment tracking") for order, purchase
order, AP bill and special-order records. *"On-line comment tracking is an audit system that automatically
tracks the entry, edit, and deletion of purchase orders and sales orders. You can also track selected
fields."*

**Where it lives.** `System Administration > System Settings > General Administration System Settings > Track Processing Activity`
Support Files: **None.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Audit Settings For File` | enum — **9 exact values** | The file whose fields you want to audit. Values: **`Order`, `Order Item`, `Purchase Order`, `Purchase Order Item`, `AP Bill`, `AP Bill Item`, `Special Order Option`, `Special Order Grade`, `Special Order Sub-Option`.** Selecting one populates the grid with that file's fields. |
| `This Field Should Be Audited` | checkbox | Per-field audit toggle. Select a field in the grid, set the checkbox, click `Add`. **Audited status displays as `Y` or `N`.** |
| (grid) | display | `Field Name` and `Audited` (`Y`/`N`) for the selected file. |

**Behavior & rules.**
- **What is captured per change (exact, quoted):** *"Each time a user modifies a selected field, the
  following is added to this file for the specific transaction: **system date**, **operator's initials**,
  **original field contents**, **any new contents**."*
  → date (**no time**), operator initials (**not a user ID**), before value, after value.
- **Hard rule — unsaved work is invisible (quoted):** *"If you delete or change orders during their initial
  entry session and do not save your entries, the system does not track that activity. **You must save the
  entries/orders for the system to track changes/deletions.**"*
- **Viewing is indirect:** tracked activity is read through **`Update Purchase Order Comments`** (POs) and
  **`Update Order Comments`** (sales orders) — **the audit trail is surfaced as order comments**, which is
  also how `CUST-124` surfaces its compliance reasons. **Audit data and user-authored comments share a
  channel.**
- *"You can update your list of fields at any time."* — **turning auditing on for a field is not
  retroactive**, and (by implication) turning it **off** stops capture with no record that it was ever on.
  **Nothing indicates the audit configuration itself is audited.**

**⚠️ Correction to the wave-1 cross-reference.**
Wave 1 established: *"**STORIS has no general change-audit log.** Only `SAR-024` Report Secured Decryption
Activity exists."* **That is too strong, and this article is the counter-example.** The accurate statement is:

> STORIS has **no general, system-wide change-audit log**, but it does have **two narrow, opt-in audit
> facilities**: `SAR-024` Report Secured Decryption Activity, and **`Track Processing Activity`
> (`CUST-135`) — configurable field-level before/after auditing limited to nine transactional files:
> `Order`, `Order Item`, `Purchase Order`, `Purchase Order Item`, `AP Bill`, `AP Bill Item`, and the three
> Special Order files.**

**The gap that remains is still severe, and is exactly where the risk sits.** `Track Processing Activity`
covers **transactions only**. It does **not** cover:
- the **customer master** (so PII edits, address changes, erasure, `Referred By`/`Marketing Code`
  overwrites, `Price Category` assignment, and Metro 2 `Account Closed` are all unaudited);
- **any settings screen** in this section (discount definitions, coupon redemption flags, tax rates, APR
  tables, spiff tables, commission rates, GL access grants);
- **salesperson/commission** records;
- **security and permission** changes.

So every "no audit trail" flag raised elsewhere in this part stands. Note also that even within its scope
the capture is weak: **date without time, initials without a user ID, and no record of configuration
changes to the auditing itself.**

**Dependencies.**
- Update Order Comments; Update Purchase Order Comments; order comment store.
- `CUST-124` Solicitation of Customer Information (also writes justification into order comments, and
  **deletes its own User-ID/timestamp stamp on re-edit**).
- `SAR-024` Report Secured Decryption Activity (the other narrow audit facility).
- Order, Purchase Order, AP Bill and Special Order files; `CUST-132` Terms Settings (AP bills).
- **Our `RPT-AUDIT` requirement** — this is the STORIS feature `RPT-AUDIT` supersedes.

**Build notes.**
- **`RPT-AUDIT` should be the generalisation of this feature, done properly.** Requirements this article
  makes concrete:
  - **Always-on, not opt-in per field.** Configuring which fields are audited is itself a control weakness;
    capture everything and control *retention* and *visibility* instead.
  - **Full timestamp** (date **and** time, with timezone), not just a system date.
  - **Actor as an immutable user ID** (plus session/IP), not operator initials — initials are not unique and
    are re-used when staff turn over.
  - **Before and after values** for every changed field, plus the change reason where one is required.
  - **Universal scope:** customer master, settings, security, pricing, commissions, credit — not just
    transactions.
  - **A separate, append-only store** that is not the order-comment channel. Mixing audit records with
    user-authored comments makes both harder to trust and lets a user's comment be mistaken for evidence.
  - **The audit configuration and the audit store must themselves be audited and immutable.**
- Keep the useful idea that draft/unsaved state is not audited — but be explicit: audit on commit, and make
  "abandoned draft" a first-class, discardable state rather than an untracked hole.
- Explicitly enumerate the high-risk events this part identified as `RPT-AUDIT` feeders:
  coupon un-redemption (`CUST-116`), misc-tender entry (`CUST-093`/`CUST-094`), customer-history copy
  (`CUST-095`), discount/manager overrides (`CUST-096`/`CUST-117`), spiff overrides (`CUST-128`), tax and
  APR table edits (`CUST-119`/`CUST-104`), Metro 2 account closure (`CUST-126`), GL access grants
  (`CUST-129`), service close-without-completion (`CUST-131`), PII solicitation events (`CUST-124`).

---

### `CUST-136` Trade Designer Discount Settings
*storis_ref: article 15297960049684*

**Purpose.** For the **trade/designer sales** feature: defines what **portion of the maximum discount allowed
for a product** may be applied on a trade sale, banded by the ratio of **Current Retail Price (CRP) to
Suggested Retail Price (SRP)**. In effect: the closer an item is to full SRP, the more trade discount the
designer may take.

**Where it lives.** `Customer > Point of Sale > Settings > Pricing Settings > Trade/Designer Discount Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Table` | enum — **3 exact values** | `None Selected` — **the default**; *"No discount table is applied. All fields are inactive."* `Global` — *"use this for any vendor that does not have a specific discount table defined. Once selected, the `CRP/SRP Minimum Ratio` field becomes active."* `Vendor` — a table for one specific vendor; *"Once selected, the `Vendor` field becomes active."* |
| `Vendor` | vendor code, **up to five alphanumeric characters** | The vendor this table applies to. **Active only when `Table` = `Vendor`.** Search button lists vendors. |
| `CRP/SRP Minimum Ratio` | percent **0.00–100.00** | *"the minimum ratio of current retail price to suggested retail price for which the corresponding trade discount percentage is available. For example, if you enter 90.00 in this field, the corresponding percent you enter in the next field is used to calculate the available trade discount for items whose CRP/SRP ratio is **equal to or greater than 90%**."* |
| `Percent of Trade Discount Available` | percent **0.00–100.00** | *"the **portion of the maximum discount allowed (established for product or vendor)** that can be applied to a sale, based on the CRP/SRP ratio."* |

**Behavior & rules.**
- **Band construction (exact):** *"Newly added items are displayed in the grid in **ascending order of
  CRP/SRP Minimum Ratio**. **The ending range for a grid row is inferred as being less than the subsequent
  grid row, or in the case of the last grid row the range ends at 100.00%.**"*
  → half-open bands `[min_ratio_n, min_ratio_n+1)`, top band closes at 100.00%.
  **Note the top band ends at 100% — the article does not say what happens when CRP > SRP** (a marked-up
  item, ratio > 100%). **Undefined behaviour; resolve before porting.**
- **Resolution order (stated twice, exact):** *"When an item is added to an order that is associated with a
  trade discount table, the system searches **first for the discount table associated with the item's
  vendor**; if the table is not found, the discount percent is obtained from the **global discount table**."*
  → vendor table → global table → (implicitly) none. A clean most-specific-wins resolution;
  **add `VENDOR` to the resolver scope list** alongside the already-registered `VENDOR_REMIT_TO` and
  `VENDOR_REGION`.
- **Hard rule — hard kits resolve by the kit master's vendor:** *"NOTE: For hard kits, the discount table
  used is based on the vendor assigned to the **kit master**."* — not the component vendors.
- **The discount is a discount ON a discount.** The output is a *percentage of the product's maximum allowed
  discount*, not a percentage off price. **Two multiplications, and the "maximum discount allowed" comes from
  the product or vendor record, not from this screen.** Easy to misimplement — cf. the same double-percentage
  structure in `CUST-102`.
- **The economic logic is worth stating plainly:** an item already marked down (low CRP/SRP) yields little or
  no trade discount; an item at full SRP yields the full trade discount. This protects margin on clearance
  while keeping the designer programme attractive on regular stock.
- `None Selected` is the default, so **the trade/designer feature is inert until a table is built.**

**Dependencies.**
- Advanced Product Settings — **Current Retail Price**, **Suggested Retail Price**, and the product's
  **maximum discount allowed**; vendor record's maximum discount.
- Vendor master; kit master (hard kits).
- `CUST-117` Sales Discount Settings (`Apply to Suggested Retail Price` also manipulates the CRP/SRP
  relationship — **the two features interact and the article does not say how**);
  `CUST-105` Price Matrix Usage Codes; `CUST-096` Multiple Line Discounts.
- Trade/designer sales feature; customer **`Price Category`** (trade accounts are the natural consumer of
  price categories — see the targeted-topic findings).
- **New resolver scope: `VENDOR`.**

**Build notes.**
- Model `trade_discount_table(scope ENUM('GLOBAL','VENDOR'), vendor_id NULL)` +
  `trade_discount_band(table_id, min_crp_srp_ratio, pct_of_max_discount)`, resolved vendor→global.
- **Define the CRP > SRP case explicitly** (recommend: clamp the ratio to 100% and use the top band).
- **Make the two-step calculation explicit and visible on the order line:**
  `max_allowed_discount_pct → × pct_of_trade_discount_available → effective_trade_discount_pct`.
  Show all three to the salesperson; the whole reason this design confuses people is that the middle number
  is invisible.
- **Trade/designer programmes are the strongest argument for a real customer price-category model** — see the
  targeted-topic findings. Tie trade discount eligibility to a customer's trade status, and require a valid
  resale certificate where the trade account also claims tax exemption.
- Kit resolution by kit master is correct — keep it, and make it explicit in the resolver.
- Trade discount tables are margin controls; effective-date them and feed `RPT-AUDIT`.
- `[DECISION NEEDED]` Does LA Mattress run a trade/designer/contract programme (hospitality, property
  management, interior designers)? If yes, this article plus `CUST-105` and the price-category gap below are
  the three pieces that must be designed together.

---

### `CUST-137` Warehouse - O/S Form List
*storis_ref: article 15242629258644*

**Purpose.** Assigns **warehouse/store locations to operating-system forms**, so a given STORIS Form prints
to the right OS printer/queue **based on the warehouse location**.

**Where it lives.** `Form Settings screen > Actions button > Warehouse - O/S Form List`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Warehouse` | location code | The warehouse/store location to which an O/S form is assigned. |
| `O/S Form` | printer/queue name | *"the printer name or queue name of the operating system form you want to associate with the specified location."* Arrow lists forms; `Add` updates the grid. |

**Behavior & rules.**
- **"You can specify multiple warehouse/OS form associations."** `Save` then `Exit`.
- This is the **location dimension** of print routing, complementing `CUST-098` O/S Form Screen (the
  printer dimension) and `CUST-107` Printer Zone Settings (the user/access dimension).
  **Three separate screens configure one routing decision** — the reason warehouse printing is a chronic
  support burden.
- Same legacy coupling as `CUST-098`/`CUST-106`: the target is a **host OS printer/queue name**.

**Dependencies.**
- Form Settings screen; `CUST-098` O/S Form Screen; `CUST-106` Printer Settings; `CUST-107` Printer Zone
  Settings; Warehouse/Store Location Settings; Synchronize OS to STORIS Printers.

**Build notes.**
- Collapse `CUST-098`, `CUST-106`, `CUST-107` and `CUST-137` into **one routing rule table**:
  `print_route(document_type, location_id NULL, zone_id NULL, destination_id, priority)` resolved
  most-specific-first, with a guaranteed fallback to PDF. **One screen, one mental model.**
- **Do differently:** never bind to OS printer names (see `CUST-106`).
- This is the piece that genuinely matters operationally — pick tickets, delivery manifests and law tags must
  print at the right warehouse without a human choosing a queue.

---

## Targeted-topic findings (the five items part C was asked to hunt down)

### 1. `Price Matrix Usage Codes` — **CORRECTED AND EXTENDED: eight codes, not six**

**Found.** `CUST-105` (article 15242610698004) is the authoritative enumeration. Full formulas and the
verbatim reconciliation table are in that entry. Summary for the Inventory pack:

- **`ITEM-042` lists six usage codes. The authoritative list has EIGHT.** All six of `ITEM-042`'s are
  confirmed; **two are missing entirely**: `Replacement Cost * Factor` and `Replacement Cost + Factor`.
- **There are two distinct cost bases, not one.** `ITEM-042`'s generic "cost" conflates
  **`Sales Written Cost`** (which the article states resolves to the **`average cost`** field on Advanced
  Product Settings — **the label and the operand field do not match**) with **`Replacement Cost`**. They
  produce different prices.
- **The factor is a whole-number percentage (100-based), not a decimal multiplier.** Proof: the
  `Use Lowest Price` rule inactivates for `Price * Factor` *"provided the factor is greater than 100"* —
  100 is the break-even point, so `90` means 90%. **`ITEM-040`/`ITEM-041` must not treat the factor as
  `0.90`.**
- The `Factor` field is **percent for the two `* Factor` codes and dollars for the `+`, `-`, `=` codes** —
  one untyped field with two meanings.
- Cost bases support only `*` and `+`. There is **no `Cost - Factor`, no `Cost = Factor`, no `Price / Factor`**.
- **Special-order products have no replacement cost**, and STORIS only *advises* against using
  replacement-cost codes with them — it does not enforce it.
- `Use Lowest Price` inactivates for: **all four cost-based codes**, `Price + Factor`, and
  `Price * Factor` when `factor > 100`.

**Action for the Inventory pack: amend `ITEM-042` to eight codes and correct the factor scale in
`ITEM-040`/`ITEM-041`.**

### 2. Customer price-category assignment rules — **NOT FOUND. Gap CONFIRMED, and now with a consumer.**

**Part A found the customer `Price Category` field has no default and no validation on the customer master.
Positions 93–137 contain no article that assigns, defaults, derives, or validates it. The gap is
confirmed for the whole Customer Settings section.**

What positions 93–137 *do* contribute:

- **`CUST-117` Sales Discount Settings has a field `Not Available to these Customer Price Categories`** —
  *"Enter one or more customer price categories to exclude customers within that price category from using
  this discount."* **This is the only appearance of customer price category in my range, and it is a
  *consumer* of the field, not a source of it.** So price category is load-bearing for discount eligibility
  while remaining unassigned, undefaulted and unvalidated. **An unset price category means a customer
  matches no exclusion — i.e. the permissive outcome.**
- **`CUST-105` Price Matrix Usage Codes** confirms the mechanism price category feeds
  (**Customer Price Settings**), and gives the exact formulas — but says nothing about how a customer
  arrives in a category.
- **`CUST-136` Trade Designer Discount Settings** is the closest *conceptual* neighbour: a customer-type-driven
  pricing programme. But it keys off the **product's CRP/SRP ratio and the item's vendor**, not off the
  customer's price category at all. **STORIS runs trade pricing and customer price categories as two
  unconnected systems.**
- **`CUST-113` Revolving Classification Settings** is the one *analogous* customer-segmentation mechanism
  that does have documented assignment rules — assigned in `Customer Credit Scoring Information`, matched
  against a plan's `Classification`, with an `Exclude from General Use` flag and a documented default
  (*"If a customer does not have a classification assigned, any plan with a classification may be
  applied"*). **This is the pattern the price-category model should copy.**
- **`CUST-120` Salesperson Settings** shows STORIS *can* express customer-level defaulting — the
  `Salesperson 1` / `Salesperson 2` → `ZZZ` chain. **The absence of an equivalent for price category is a
  design omission, not a documentation gap.**

**Recommendation for `ITEM-040`/`ITEM-041`:** we must design price-category assignment ourselves. Specify:
`customer.price_category_id` **NOT NULL with an explicit `RETAIL` default**; assignment via a permissioned
action with a reason and an `RPT-AUDIT` row; optional derivation rules (trade account + valid resale
certificate → `TRADE`; employee → `EMPLOYEE`); an effective-dated history so a historical order's price is
reproducible; and an explicit resolver precedence
`customer price matrix → price category → base price`. Model it on `CUST-113`, and **wire the trade
programme (`CUST-136`) to it** rather than leaving them disconnected.

### 3. Contact and consent — **DEFINITIVELY ABSENT. Confirmed gap, with TCPA exposure.**

**Part B found no consent capture in positions 47–92. I confirm there is none in positions 93–137 either.
Across the entire Customer Settings section there is no channel-level consent model: no opt-in/opt-out
state, no channel (phone / SMS / email / mail), no timestamp, no source of consent, no proof-of-consent
record, and no do-not-contact or suppression list.**

What exists in my range, and why none of it is consent:

- **`CUST-124` Solicitation of Customer Information** is the only article touching customer contact data as a
  legal matter, and **it is the inverse of consent**: a statutory prohibition on *asking for* PII when the
  sale does not require it (the Song-Beverly-style credit-card PII regime). It governs **collection**, not
  **use**. It says nothing about whether we may contact a customer whose details we legitimately hold.
- **`CUST-089` Method of Contact Settings** (part B) is a taxonomy of contact *methods*, not a consent state —
  part B already established this.
- **`CUST-127` Special Occasion Settings**, **`CUST-112` Referred By Settings**, **`CUST-118` Sales Lead
  Origin Settings**, and **`CUST-101` Order Source Settings** are all **marketing-trigger and attribution**
  machinery with **no consent gate whatsoever**. `CUST-127` in particular exists to drive birthday and
  anniversary outreach.
- **`CUST-131` Status Code Settings** `Tickle on Change To` generates an instruction to **call the customer**
  — an outbound call triggered by a status change, with no consent check.
- **`CUST-130` Statement Notification Days** concerns statement *content*, and statement delivery is a
  transactional communication, not marketing.

**Consequences — state this plainly to the client:**
- **TCPA exposure is real and uncapped.** Automated or manual marketing calls and texts require prior
  express written consent for the marketing case; statutory damages are **$500–$1,500 per call/text**, and
  these actions are commonly brought as class actions. A retailer with no consent record **cannot mount the
  consent defence at all**, because the burden of proving consent is on the caller.
- **Do-not-call obligations cannot be met.** With no suppression list and no internal DNC register, an
  opt-out request has nowhere to be recorded.
- **CAN-SPAM** requires a working unsubscribe honoured within 10 business days and a record of suppressions —
  also absent.
- **This compounds the attribution-overwrite finding.** Even the marketing-source data STORIS does keep is
  last-touch-only and undated, so we could not reconstruct *when or how* a contact entered the file.

**Build requirement (new, not a port):**
`consent(customer_id, channel ENUM('VOICE','SMS','EMAIL','MAIL','PUSH'), purpose ENUM('TRANSACTIONAL','MARKETING'),
state ENUM('GRANTED','DENIED','REVOKED','UNKNOWN'), captured_at, captured_by, source ENUM('IN_STORE','WEB','PHONE','IMPORT','SMS_KEYWORD'),
evidence_ref, expires_at NULL)` — **append-only, never updated in place**, with the current state derived.
Plus a suppression list keyed by phone/email (independent of customer identity, since the same number may
reach multiple customer records), and an **enforcement point every outbound message must pass through** —
not a flag that senders are expected to check. **Default state must be `UNKNOWN`, and `UNKNOWN` must block
marketing sends.** All of it feeds `RPT-AUDIT`.

**This turns a suspected gap into a confirmed one. It should be raised as a compliance finding, not a
backlog item.**

### 4. Tax exemption — **jurisdiction-level only. NO customer exemption-certificate handling anywhere in
positions 93–137.**

`CUST-119` Sales Tax Settings is the tax master, and I read every tab. **It contains no customer tax-exemption
certificate handling of any kind: no certificate number, no issuing jurisdiction, no effective or expiry
date, no document image, no renewal or lapse behaviour, and no per-jurisdiction scoping of a customer's
exempt status.** The word "exempt" appears only in jurisdiction-level contexts.

What *does* exist in my range:

| Mechanism | Article | What it exempts | Scope |
|---|---|---|---|
| `Gross Taxable Price Cap` | `CUST-119` | *"exempts tax on the portion (if any) of the order price that exceeds this amount"* — **applied separately per line-item type** | jurisdiction |
| `Products Purchased as Real Property Are Tax Exempt` | `CUST-119` (Non-Inventory Usage Settings) | merchandise with a linked `Installation – Real Property` non-inventory product; **determined by the deliver-to state** | jurisdiction |
| `Tax Override Class` | `CUST-119` | **reverses** the taxable status of lines whose product `Tax Class` matches; unaffected by `Delivery Taxable`/`Installation Taxable` | jurisdiction × product tax class |
| `Tax Out Of State Sales` unchecked | `CUST-119` | **zeroes out** calculated tax on out-of-state sales | jurisdiction |
| `State Rate Cap` | `CUST-119` | caps combined tax; strips overflow from the bottom of the jurisdiction list | jurisdiction |
| `Remove Tax on Orders with RTO Plans` | `CUST-119` (Financing) | removes tax on rent-to-own orders (with a **counter-intuitive truth table** — see the entry) | jurisdiction × provider |

**The only trace of a *customer*-level exemption in my range is oblique:** `CUST-124`'s qualification criteria
include ***"Customer is not using a resale license"*** — proof that a resale-licence concept exists on the
customer record, but **nothing in positions 93–137 defines, validates, dates or expires it.**

**Conclusion: customer tax-exemption certificate management does not exist in the Customer Settings section
at all.** If it exists in STORIS it is elsewhere (the customer master, or the third-party tax interface).
Given the Avalara/Vertex/CCH integration points documented in `CUST-119`, **it is likely delegated to the
tax provider's exemption-certificate module (e.g. Avalara CertCapture).**

**Build requirement (treat as new):**
`exemption_certificate(customer_id, jurisdiction_id, certificate_number, exemption_reason, issued_on,
expires_on, document_ref, verified_by, verified_at, status ENUM('PENDING','VALID','EXPIRED','REVOKED'))`,
with: **per-jurisdiction scoping** (a certificate valid in one state does not exempt another); **hard expiry
that flips the customer back to taxable automatically** with advance-warning reporting; **an audit trail of
every exempt sale linked to the certificate version in force at the time**; and **blocking exempt sales
where no valid certificate exists** rather than trusting a flag. In an audit, an exempt sale with no
supporting certificate is assessed against us with penalties and interest — **this is a real, quantifiable
liability and it must not be left implicit.**

### 5. Delivery-relevant customer attributes — **essentially absent; only indirect touches.**

**No article in positions 93–137 defines delivery access notes, delivery restrictions, gate/buzzer codes,
stairs/elevator flags, parking notes, COI requirements, or delivery zones as customer attributes.**

The only delivery-adjacent material in my range:

- **`CUST-119` Sales Tax Settings** — the **`Charge By` / `Point of Possession` / `Selling Store Tax
  Exception`** machinery resolves tax from the **customer's ship-to address zip**, and the **`Retail Delivery
  Fee`** and **`State Recycling Fee`** apply based on the **fulfilment's deliver-to jurisdiction**. So the
  delivery address drives *tax*, but carries no operational delivery metadata.
- **`CUST-124` Solicitation of Customer Information** — the entire anonymous-customer flow hinges on
  delivery vs take-with vs pickup, and generates customers with **`Address Line 1` = `"No Address Required"`**
  who are **blocked from delivery orders**. This is the closest thing to a "delivery restriction", and it is
  a side-effect of a privacy rule.
- **`CUST-095` Move Customer Purchase History** — the **View Customer Ship-To Addresses** lookup implies
  multiple ship-to addresses per customer, but says nothing about their attributes.
- **`CUST-107` Printer Zone Settings** / **`CUST-137` Warehouse - O/S Form List** — delivery *documents*
  (manifests, trip sheets) route by warehouse location, not by customer.
- **`CUST-108` Problem Code Settings** — service calls reach the customer's home; `CUST-131` service statuses
  govern technician assignment. Neither carries access information.

**Two carried-forward findings bite hard here and should be escalated together:**
1. **Addresses have no versioning.** Delivery, service and warranty lookback all resolve against the
   *current* address. `CUST-095`'s ship-to-address lookup and `CUST-108`'s service flow both depend on this.
   **A 10-year mattress warranty claim cannot be tied to the address the product was delivered to.**
2. **Magic strings in `Address Line 1`.** `CUST-124` writes `"No Address Required"`; the erasure routine
   writes `"REMOVED"`; both **retain city/state/ZIP**. **Any delivery-zone assignment, route optimisation,
   or geocoding we build will silently ingest these as real addresses.** They must become a proper
   `address_status` enum with genuinely null lines before any delivery logic is built on top.

**Build requirement (new):** delivery attributes belong on the **address**, not the customer, and the address
must be **versioned and immutable once used on a fulfilment**:
`address(id, customer_id, lines, city, state, zip, status ENUM('REAL','NOT_REQUIRED','ERASED'),
geocode, valid_from, valid_to)` plus
`address_delivery_profile(address_id, access_notes, gate_code, floor, has_elevator, stair_count,
parking_notes, coi_required, delivery_window_restrictions, zone_id)`, and every fulfilment records
`address_version_id`. **This is a prerequisite for both delivery operations and warranty lookback, and
nothing in STORIS's Customer Settings provides it.**

---

## `[DECISION NEEDED]` items — consolidated

**Scope decisions (answer these first; several cascade):**
1. **Does LA Mattress originate its own consumer credit (revolving and/or installment), or is all consumer
   finance third-party?** If third-party, descope `CUST-104`, `CUST-113`, `CUST-114`, `CUST-115`, `CUST-122`,
   `CUST-126`, `CUST-130`, plus part B's `CUST-090`/`CUST-091`/`CUST-092`, and `CUST-097`. This is the single
   largest scope lever in this part. *(raised in `CUST-097`)*
2. **Do we furnish data to credit bureaus?** Only if (1) is yes. Becoming a Metro 2 furnisher is a deliberate
   business decision with FCRA obligations — it must not happen by porting a settings screen.
   *(`CUST-126`)*
3. **Is Open-To-Buy merchandise planning in scope?** Recommend descope for v1. *(`CUST-099`, `CUST-100`)*
4. **Is accounts payable in scope, or does it stay in the accounting package?** *(`CUST-121`, `CUST-132`)*
5. **Do we run a trade / designer / contract programme?** If yes, `CUST-136`, `CUST-105` and the price-category
   model must be designed together. *(`CUST-136`)*
6. **Which states does LA Mattress operate in, and which impose the no-solicitation-of-PII rule?** If
   California is in scope, the anonymous-customer flow (`CUST-124`) is v1. *(`CUST-124`)*

**Pricing and promotions:**
7. **Which cost basis for cost-plus customer pricing — moving-average or replacement cost?** They diverge
   sharply when costs rise. Recommend replacement cost for trade, with a special-order exception.
   *(`CUST-105`)*
8. **Canonical discount order-of-operation and compounding base.** STORIS offers `Apply Last in the Order of
   Operation`, a POS-level `Apply Fixed Amount Line Discounts First`, and per-schedule sequencing, and never
   states the compounding base. **We must write down one ordering and one base.** Recommend: all percent line
   discounts compute off the resolved base price and sum. *(`CUST-096`, `CUST-117`)*
9. **`Reduce Qualifying Order Amount by Minimum Required` — do we want stacking-threshold erosion at all?**
   Recommend no; pick one clear stacking rule. *(`CUST-117`)*
10. **Commission neutrality between line and subtotal discounts, and on vendor-funded instant rebates.**
    STORIS penalises line discounts and not subtotal discounts, and its own docs recommend a manual AP
    workaround to avoid penalising staff on rebates. Fixing this changes comp — confirm with sales
    leadership. *(`CUST-096`, `CUST-117`, `CUST-102`)*
11. **Should commission be reduced by third-party finance costs at all**, given sales staff often cannot
    choose the plan? *(`CUST-102`)*

**Compliance and risk (recommend raising as findings, not backlog):**
12. **Consent capture does not exist anywhere in Customer Settings.** Confirmed absent across all 137
    articles. TCPA/CAN-SPAM/DNC exposure. Requires a new consent + suppression model before any
    occasion-based or lifecycle marketing is built. *(targeted topic 3)*
13. **Customer tax-exemption certificate management does not exist in this section.** Decide: build it, or
    adopt the tax provider's certificate module (e.g. Avalara CertCapture). Either way it must be
    per-jurisdiction, hard-expiring, and audited. *(targeted topic 4)*
14. **Tax engine: build vs integrate.** Strong recommendation: integrate. The
    `LOCKED Field – STORIS access only!` alternate calculations prove per-state statutory quirks are endless.
    *(`CUST-119`)*
15. **`Charge By` policy.** Recommend `Point of Possession` with `Selling Store Tax Exception` semantics.
    *(`CUST-119`)*
16. **Deferred-interest ("no interest if paid in full") promotions** — who owns the disclosure obligation, us
    or the provider? Confirm before building `CUST-130`. *(`CUST-130`)*
17. **Do we sell credit insurance?** Recommend no. If yes, never default it on. *(`CUST-122`)*
18. **`Can be used to Purchase Gift Certificates/Cards` on a credit plan** — recommend hard-disabling
    regardless of what STORIS permits (money-transmission and fraud red flag). *(`CUST-114`)*
19. **Credit-score gating uses max(applicant, co-applicant).** Confirm this is intended underwriting policy.
    *(`CUST-114`)*

**Data model / operations:**
20. **Customer price-category assignment must be designed from scratch** — no default, no validation, no
    assignment rules exist anywhere in the section, yet `CUST-117` gates discounts on it. Model on
    `CUST-113`. *(targeted topic 2)*
21. **Address versioning and delivery attributes must be built** — prerequisite for delivery operations and
    for 10-year warranty lookback; blocked today by magic strings in `Address Line 1`. *(targeted topic 5)*
22. **Is B2B/builder purchasing with consumer-side service in scope for v1?** Determines whether
    `CUST-095`'s history-copy needs to become a proper entitlement model. *(`CUST-095`)*
23. **Order source code length** — 6 chars is too short for modern channel codes; confirm no fixed-width
    export depends on it. *(`CUST-101`)*
24. **Split commission** — confirm the `Salesperson 1` / `Salesperson 2` policy and whether customer-level
    default salesperson ("this customer belongs to Maria") is wanted. *(`CUST-120`)*
25. **Agree the mattress-defect taxonomy and per-vendor measurement thresholds** before building service
    problem codes and their structured questions. *(`CUST-108`)*
26. **As-is/clearance spiff policy and approval chain.** *(`CUST-128`)*
27. **Franchise vs corporate locations** — if LA Mattress has no franchises, collapse the `Restrict Use to`
    enum and drop the franchise branch. *(`CUST-114`)*
28. **Which finance providers, and do any still require batch/FTP settlement?** If all are synchronous REST,
    drop the async settlement branch. *(`CUST-123`)*
29. **Misc payment tender class** — do we need one at all, or is legacy-balance migration a one-time load
    that should never become a POS-visible tender? *(`CUST-093`)*
