# Handoff: Sales Security — permission model for LA-Mattress-ERP

**Source:** `Create a User/Group Actions - Sales Security`
https://storis.zendesk.com/hc/en-us/articles/15185859408660-Create-a-User-Group-Actions-Sales-Security
Version badges `11.0` / `10.8`. Comment on the article: _"Updated as of 2/7/2024."_

**Audience:** Claude Code, implementing the authorization layer of LA-Mattress-ERP.
**Status:** read-only documentation dissection. Everything in §2–§6 is quoted or enumerated from the
source. §7 is design guidance and is labelled as such — it is _not_ STORIS documentation.

---

## 1. Why this record matters more than its size suggests

This is **one of ten** security records in STORIS (the full list is in `Report on User Security`:
Create a User/Group · Import Data · Logistics · Payables · Personal Information · Purchasing ·
Receivables · Sales · Service · System). Sales Security alone carries **120 distinct boolean
permissions** plus a non-boolean tail — roughly a third of the ~360 permissions across the whole
system.

It is also one of the four records the audit flagged as **ragged**: `Report on User Security` says
_"Logistics Security, Purchasing Security, Receivables Security, and Sales Security have additional
entries that appear in additional columns."_ Those additional entries are enumerated in §4 below.
**Do not model this record as a flat boolean set.**

---

## 2. The gate, and the scoping rule

Two sentences govern everything else on the page.

> "In order to use these security settings, **extended security must be active on your system via the
> General System Control Settings.**"

> "The settings shown in this topic can be accessed from **both** the Create a User and Create a User
> Group routines. **The field labels and descriptions are the same regardless of which routine you
> used to access the settings.** Settings accessed from the Create a User Group routine **apply to all
> users in that group**, while settings accessed via Create a User apply to the individual user."

### Implementation consequences

1. **One master switch disables the whole layer.** With Extended Security off, all 120 permissions
   are inert stored data. Model this explicitly — `extended_security_enabled` on the system config —
   rather than assuming permissions are always live. It matters at cutover: a STORIS extract may
   contain a fully-populated permission set that was never being enforced.

2. **The same permission exists at two scopes with identical labels.** One definition table, two
   assignment tables.

3. ⚠️ **Precedence between user and group is NOT documented.** This is a confirmed gap, not a reading
   failure — thirteen articles across the parity audit, including both user routines and the report
   that dumps every setting, say nothing about what happens when a user's value and their group's
   value disagree. `Report on User Security` gives it away by listing users and groups as **separate
   row sets**, sorted _"regardless of their user group association."_

   **Do not guess.** Pick a rule, write it down as an explicit ADR, and make it observable in the UI.
   Recommended: **most-permissive-wins with an explicit user-level deny** — i.e. tri-state at the user
   level (`inherit` / `grant` / `deny`) rather than boolean. STORIS's own two-state model is what
   makes the question unanswerable; a tri-state removes the ambiguity permanently. Flag this to the
   business as a **deliberate divergence from STORIS**, not a reimplementation.

4. **Related STORIS behaviour worth knowing:** for the Report Builder security fields, the group's
   values are **copied into the user record at creation** and never propagate again — and the group
   record carries a `Reset User Members` button to manually re-push. If the same seeded-copy idiom
   applies here, then in live STORIS **revoking a permission at group level revokes it from nobody.**
   Verify against live data before assuming inheritance semantics.

5. **Permission changes are not live in STORIS:** _"If you make a change to the User file, you must
   restart STORIS before the change can take effect."_ Our rebuild should evaluate live — but expect
   operators to report immediate enforcement as a bug the first time it surprises them.

---

## 3. The 120 permissions, grouped by capability family

The source presents these as one flat alphabetical-ish list. The grouping below is **analytical, not
from the source** — but it is the grouping the domain actually has, and it should drive the
permission naming scheme.

### 3.1 Price and discount authority — 24

The largest family. Splits into _apply_, _change_, and _override_.

```
Access global discounts on dollar only adjustments
Access global discounts on returns
Access sales order line discounts
Access Subtotal field on sales orders
Apply Subtotal Discount%, Discount Amount or Discount Codes
Change customer price category within POS entry
Change maximum trade discount for a sales line item
Change reduced return price; not exceeding original price
Change reduced warranty price; not exceeding original price
Change the Net Total on Sales Orders
Discount POS Dollar Adjustments
Discounts - Apply Automated Line Discounting
Discounts - Apply Manager Only Discounts
Discounts - Override Sales Discount Restrictions
Discounts - Suspend Automated Line Discounting while Retaining Discounts
Increase Sell price above Max Sell price for Repossessions
Override Maximum Percentage for As-Is Selling Price Adjustment
Override Sales Quote Conversion Discount Restriction
Override the Minimum Purchase Requirements on Discounts
Override the Restrictions on Combining Line and Subtotal Discounts
Override the Restriction to Limit Use of Rewards Gift Certificates to Issuing Customers
Override system calculated delivery charges
Override system calculated restocking fee
Adjustments Modify Coupons and Subtotal Discounts on Returns and Adjustments   [label mangled in source]
```

Note the **two-axis discount model**: _line_ discounts and _subtotal_ discounts are separately
permissioned, and combining them is separately restricted again. `Discounts - Suspend Automated Line
Discounting while Retaining Discounts` is a third state — not on, not off, but _frozen_ — which a
naive boolean model will lose.

### 3.2 Document lifecycle — 27

Create / edit / complete / delete, permissioned **per document type**.

```
Enter/Edit Sales Orders            Enter/Edit Sales Quotes
Enter/Edit Layaway Orders          Enter/Edit Multi Ship Masters
Enter a New Exchange               Enter Return Portion of Existing Exchange
Enter return/exchange/dollar adjustment without original order
Allow Creation of New Orders in ERP from Enter a Sales Order
Create order from eRoam
Complete sales orders              Complete customer exchanges
Complete customer returns
Delete quotes                      Delete shopping carts
Delete/Edit information on open transactions
Delete/Edit line items on transactions with deposits applied
Delete the fulfillment with the delivery charge
Maintain a Sales Order from View Customer Activity
Maintain a Return from View Customer Activity
Maintain an Exchange from View Customer Activity
Maintain a Customer's Own Goods Order from View Customer Activity
View and Manage Open Orders - Maintain Sales Orders
View and Manage Open Orders - Maintain Exchanges
View and Manage Open Orders - Maintain Returns
View and Manage Open Orders - Maintain Transfers
Dynamic Tab View-Maintain a Sales Order
Dynamic Tab View - Maintain a Service Order
Maintain customer deposits immediately after order deletion
```

⚠️ **The same capability is permissioned separately per entry point.** Maintaining a sales order is
governed by _three_ different permissions depending on whether you arrived via `View Customer
Activity`, `View and Manage Open Orders`, or the Dynamic Tab View. That is a **screen-scoped**
permission model, not a capability-scoped one.

**Recommendation:** model the capability once (`sales_order.maintain`) and treat entry point as
context, unless the business specifically wants per-screen control. If we reproduce STORIS's shape we
inherit 3× the permission surface for no expressed requirement — but flag it, because someone at LA
Mattress may be relying on exactly this to let staff edit orders in one screen and not another.

### 3.3 The override family — 27 permissions, and the key architectural signal

```
Override Allowed Number of Days on Returns
Override Calculated Protection Plan Price
Override Charge Sales Tax Settings
Override Commission Rules
Override Deposit Hold Back on an Order
Override Group Return Restriction Days
Override Handling Method on a Fulfillment
Override Maximum Number of Fulfillments
Override Maximum Percentage for As-Is Selling Price Adjustment
Override Minimum Deposit on Take With Orders
Override Parcel Route Requirement
Override Protection Plan Cancellation Restriction Days
Override Protection Plan Limitations
Override Route on Sales and Service Transactions
Override restriction of line updates once a linked auto transfer has been manifested
Override Sales Quote Conversion Discount Restriction
Override Same Day Pickup Restrictions
Override soft kit restrictions
Override delivery date restrictions based on available date
Override future scheduling restriction
Override system calculated delivery charges
Override system calculated restocking fee
Override the Minimum Purchase Requirements on Discounts
Override the Restrictions on Combining Line and Subtotal Discounts
Override the Restriction to Limit Use of Rewards Gift Certificates to Issuing Customers
Override Restricting Membership Products on Return
Discounts - Override Sales Discount Restrictions
```

**This is the most useful structural finding on the page.** 27 of 120 permissions — nearly a
quarter — are named `Override <X>`. Every one of them implies a **restriction configured somewhere
else**, in a control-settings record.

Two consequences:

- **The permission list is a specification for the settings layer.** You can read off 27 required
  restriction settings from these names. If the rebuild has an `Override Minimum Deposit on Take With
Orders` permission but no minimum-deposit setting, the permission is meaningless.
- **Every override needs a paired implementation:** `restriction_value` (config) + `can_override`
  (permission) + **an audit record when the override is exercised**. STORIS does not document
  override logging; we should log it. An override is by definition someone stepping outside policy —
  that is exactly the event a business wants to see later.

One confirmed pairing, verbatim from another article, showing the shape:

> "`Restrict Delivery Date Based On Available Date` field on the Delivery tab in the Point of Sale
> Control Settings controls whether users can assign delivery dates… **If you check the box at this
> field, only users with the proper security can override this restriction.**"
> — pairs with `Override delivery date restrictions based on available date` on this page.

### 3.4 Cross-location authority — 5

```
Complete Orders for Ship Locations Other Than Login Locations
Complete Returns for Return Locations Other Than Login Locations
Allow user to change stock location on Sales Orders and Exchanges
Access all Delivery Route Codes
Back Order Multi-Leg Transfer
```

⚠️ These interact with a **separate** five-axis location-restriction model on the Access tab of
`Create a User` / `Create a User Group`, plus `Order Access Limited to Selling Store` in Point of Sale
Control Settings. Location authority is configured in **three** places. Also note STORIS's location
restrictions are **self-widening**: editing an order that references a disallowed location adds that
location to the user's available list. Do not reproduce that without a deliberate decision — prefer a
scoped per-order exception.

### 3.5 Attribution, commission and identity — 7

```
Change Salesperson at Entry of Return/Exchange
Change the salesperson indicated on an open transaction
Change the calculated spiff amount within POS entry
Change the commission category within POS entry
Override Commission Rules
Access the sales margin scratchpad within POS entry
Bypass verify user ID during entry
```

These are **pay-affecting**. They deserve stricter defaults and mandatory audit logging regardless of
what STORIS does. `Bypass verify user ID during entry` in particular defeats attribution entirely —
treat it as a privileged, logged, rarely-granted permission.

### 3.6 Date authority — 6

```
Backdate Transactions
Change a transaction's completion date
Change Requested Date in Enter a Sales Order or Enter an Exchange
Change Auto Fill Days on Transactions
Override future scheduling restriction
Override delivery date restrictions based on available date
```

`Backdate Transactions` is the financially significant one — it moves revenue between periods.
`Change Auto Fill Days on Transactions` is the per-line override of a five-rung reservation
hierarchy; changing it changes when stock gets reserved.

### 3.7 Fulfillment, delivery and routing — 13

```
Change Delivery Status                 Change Pickup Status
Change delivery contact status
Change Order when a Fulfillment is Scheduled and Printed
Change Order Fulfillments with a Status of Scheduled
Change pickup quantity during quick pickup order completion
Create Multiple Fulfillments for a Method
Override Maximum Number of Fulfillments
Override Handling Method on a Fulfillment
Override Parcel Route Requirement
Override Route on Sales and Service Transactions
Override Same Day Pickup Restrictions
Update a delivery order with a scheduled status
Override restriction of line updates once a linked auto transfer has been manifested
```

The last one is the tightest coupling on the page: **a logistics event (manifesting) locks a sales
document**, and this permission unlocks it.

### 3.8 Purchase-order coupling — 7

```
Create purchase order not on hold from POS entry
Manually Link Purchase Orders on Sales Orders and Exchanges
Delete a Stock Merchandise Line Item Linked to a Purchase Order not on Hold
Delete special order line item linked to a purchase order not on hold
Delete special order line from a sales order
Update special order line item linked to PO not on hold
Direct Ship - Delete a Direct Ship Order Line Item when the Linked Purchase Order is not On Hold
Delete direct ship line items on an order
```

Note the recurring qualifier **"not on hold"**. PO hold status is a _guard_ on sales-line
mutability — four separate permissions exist purely to work around it. Model PO hold state as a
first-class guard on the linked sales line, not as a PO-side attribute.

### 3.9 Product, kit and protection plan — 9

```
Create special order products within POS entry
Create stock product within POS entry
Sell designated floor sample merchandise
Sell kit component products separately from their assigned kit
Override soft kit restrictions
Override Calculated Protection Plan Price
Override Protection Plan Limitations
Override Protection Plan Cancellation Restriction Days
Protection Plans - Allow Removal of Auto Added Plans
Protection Plans - Allow Sale of Manager Only Plans
```

`Manager Only` on a protection plan is a plan-level flag unlocked by a permission here — a **flag on
the data, unlocked by a flag on the user**. That pattern recurs; implement it once.

### 3.10 Tax, deposits and financial — 8

```
Edit the calculated sales tax amount on open transactions
Override Charge Sales Tax Settings
Override Deposit Hold Back on an Order
Override Minimum Deposit on Take With Orders
Edit the builder allowance amount within POS entry
Change the COD amount due within POS entry
Enter Installation/Restocking Charges
Finance Receivables - Allow Adjustments After Partial Completion
Approve E1 credit holds placed on customer exchanges
```

`Approve E1 credit holds` names a **specific code** from the 22-code credit-hold catalogue — a
permission scoped to one enum value. If we need per-code approval authority, model it as
`credit_hold.approve[code]`, not 22 booleans.

### 3.11 Customer data — 4

```
Update a Customer Address-Modify Customer Name
Create Customers when another exists with the same Email Address
Change Marketing Code
Override Restricting Membership Products on Return
```

### 3.12 Sensitive data access — 2

```
View encrypted finance, credit card, check account numbers
Search for vendors, view vendor name and model numbers
```

⚠️ The first is **PCI-relevant**. STORIS stores these encrypted and gates decryption behind this
permission. For the rebuild: **do not store full card numbers at all** unless there is a specific,
reviewed requirement. If STORIS data contains them, the migration needs a decision _before_ extract,
not after. Vendor/model visibility is competitive-information gating, same family as cost visibility.

### 3.13 Integrations — 2

```
Import Products from Retail Deck
Create order from eRoam
```

Two named external systems. Both need confirming as in-scope or out.

---

## 4. The non-boolean tail — do not miss these

Below the checkbox grid the source lists four items that are **not** simple booleans. These are the
_"additional entries that appear in additional columns"_.

| Item                                       | Shape                                                                    | Notes                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Deletion of Existing Sales Documents`** | Group of **4 booleans**: `Orders` · `Exchanges` · `Returns` · `Layaways` | Deletion authority is per document type, separate from the create/edit permissions in §3.2                                                          |
| **`View All Sales Information`**           | Boolean, listed separately                                               | Reads as a broad visibility grant. Scope undocumented on this page — **verify before implementing**; a mis-scoped "view all" is a data-exposure bug |
| **`Delivery Contract Status Codes`**       | **List/multi-select of status codes**                                    | Not a permission — a _scope_. The user may act on these statuses                                                                                    |
| **`Maximum Price Variance`**               | **Numeric**                                                              | A per-user threshold, not a yes/no. Pairs with the discount family in §3.1                                                                          |

**`Maximum Price Variance` is the important one architecturally.** It means the permission model is
not boolean — at least one entry is a **per-user numeric limit**. Combined with `Delivery Contract
Status Codes` (a per-user set), the schema needs:

```
permission_value := boolean | numeric_threshold | code_set
```

A boolean-only permission table cannot hold this record. Design for the union type now; retrofitting
it later means migrating the assignment table.

---

## 5. Documentation defects in the source — read before scraping

If you scrape this page to seed the permission table, these will bite:

1. **`Override Deposit Hold Back on an Order` appears twice** in the list.
2. **`Override Handling Method on a Fulfillment` is duplicated within a single line** — the raw text
   reads `Override Handling Method on a Fulfillment Override Handling Method on a Fulfillment`.
3. **`Adjustments Modify Coupons and Subtotal Discounts on Returns and Adjustments`** — the leading
   "Adjustments" is almost certainly a rendering artefact; the real label is probably
   _"Modify Coupons and Subtotal Discounts on Returns and Adjustments"_. **Not corrected in the count
   above** — verify against the live screen.
4. **`Override Charge Sales Tax Settings`** is followed by a bare `Use Case` line — a link or expander
   that did not render. There is worked-example content behind it that we have not read.

**120 is the de-duplicated count.** A naive scrape yields 122.

---

## 6. Verified cross-references

These permissions are confirmed to interlock with mechanisms documented elsewhere in the parity
audit. Each is a real wiring point, not an inference:

| Permission                                                                             | Interlocks with                                                                         |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `Override delivery date restrictions based on available date`                          | `Restrict Delivery Date Based On Available Date`, POS Control Settings › Delivery       |
| `Override soft kit restrictions`                                                       | Hard/soft kit rules; `Adjust Soft Kit in Order Entry`, POS Control Settings › Inventory |
| `Change Auto Fill Days on Transactions`                                                | The 4+1-rung auto-fill hierarchy; `Fill Days` on Product Full Display                   |
| `Approve E1 credit holds…`                                                             | The 22-code credit hold catalogue; End of Day releases holds                            |
| `Back Order Multi-Leg Transfer`                                                        | Stock Location Schema (sourcing) + Distribution Location Schema (routing)               |
| `Override Maximum Percentage for As-Is Selling Price Adjustment`                       | As-Is as the disposition hub                                                            |
| `Protection Plans - Allow Sale of Manager Only Plans`                                  | `Manager Only` flag in Protection Plan Settings                                         |
| `View encrypted finance, credit card…`                                                 | The `SYS.ENCRYPT.DECRYPT.PTM` UniData routine                                           |
| `Override restriction of line updates once a linked auto transfer has been manifested` | The manifest takes an exclusive system-wide lock                                        |

**Undefined term sighting:** `Access global discounts on dollar only adjustments` and `Discount POS
Dollar Adjustments` both reference **"dollar only adjustment"**, which remains one of the parity
audit's undefined terms across seven runs. It is a **document type** — it appears alongside
return/exchange in `Enter return/exchange/dollar adjustment without original order`. Still not
defined anywhere. Treat as an open question for the vendor, not something to infer.

---

## 7. Recommended implementation shape

> **This section is design guidance, not STORIS documentation.** Everything above is sourced; this is
> what I would build.

### Schema

```
permission_definition
  key              text primary key      -- 'sales.discount.override_line_subtotal_combination'
  module           text                  -- 'sales' (one of the ten)
  family           text                  -- §3 grouping
  value_type       enum(boolean, numeric, code_set)
  is_override      boolean               -- true for the 27; drives audit requirement
  restriction_ref  text null             -- the settings key this overrides
  legacy_label     text                  -- verbatim STORIS label, for migration mapping

permission_assignment
  principal_type   enum(user, group)
  principal_id     ...
  permission_key   -> permission_definition
  state            enum(inherit, grant, deny)   -- tri-state; resolves the STORIS ambiguity
  numeric_value    numeric null
  code_set         text[] null
```

Keep `legacy_label` verbatim. It is the only reliable join back to a STORIS extract, and several
labels are too mangled (§5) to re-derive.

### Resolution

Write the rule down as an ADR before writing code. Suggested: `deny` at user level > `grant` at user
level > group `grant` > default deny. Then make it visible — an "effective permissions" view that
shows _which_ assignment won. STORIS's inability to answer this question is a defect we should not
inherit.

### Auditing

Log every exercise of an `is_override` permission with actor, document, restriction, configured
value, and the value used. STORIS does not do this; the business will want it the first time a margin
question comes up.

### Migration

`Report on User Security` in STORIS emits the **entire** effective permission matrix — every user and
group, every setting, YES/NO — straight to Excel. **That export is the ground truth for this work.**
Get it before building the assignment table; it answers "what does LA Mattress actually have
configured" in a way no amount of documentation reading can. Note it is not archived, so each run is a
point-in-time snapshot with no history.

### Scope check before building

- Confirm Extended Security is actually **on** in LA Mattress's system. If it is off, this entire
  record is dormant data and the real access model is somewhere else.
- Confirm which of `Retail Deck` and `eRoam` are in scope.
- Get a decision on card-number storage **before** the extract.

---

## 8. Open questions for the business or the vendor

1. **User vs group precedence** for these 120 permissions — undocumented across the whole help
   centre. Needs a decision from LA Mattress, or a vendor answer, or (best) an observation from live
   STORIS behaviour.
2. **Is the STORIS group→user relationship inheritance or a seeded copy?** Changes what "revoke"
   means. Testable against live data.
3. **Scope of `View All Sales Information`** — undocumented, potentially broad.
4. **Per-screen vs per-capability** permissioning (§3.2) — is anyone relying on the three separate
   sales-order-maintenance permissions?
5. **What is a "dollar only adjustment"?** A document type used in four permissions and defined
   nowhere.
6. **The `Use Case` content behind `Override Charge Sales Tax Settings`** — unread.

---

## Appendix — the 120 permissions, source order

Preserved verbatim for migration mapping. Duplicates removed per §5.

```
Access Subtotal field on sales orders
Access all Delivery Route Codes
Access global discounts on dollar only adjustments
Access global discounts on returns
Access sales order line discounts
Access the sales margin scratchpad within POS entry
Allow user to change stock location on Sales Orders and Exchanges
Apply Subtotal Discount%, Discount Amount or Discount Codes
Approve E1 credit holds placed on customer exchanges
Back Order Multi-Leg Transfer
Backdate Transactions
Bypass verify user ID during entry
Change Auto Fill Days on Transactions
Change Marketing Code
Change a transaction's completion date
Change customer price category within POS entry
Change delivery contact status
Change Delivery Status
Change maximum trade discount for a sales line item
Change Order when a Fulfillment is Scheduled and Printed
Change Order Fulfillments with a Status of Scheduled
Change pickup quantity during quick pickup order completion
Change Pickup Status
Change reduced return price; not exceeding original price
Change reduced warranty price; not exceeding original price
Change Requested Date in Enter a Sales Order or Enter an Exchange
Change Salesperson at Entry of Return/Exchange
Change the COD amount due within POS entry
Change the Net Total on Sales Orders
Change the calculated spiff amount within POS entry
Change the commission category within POS entry
Change the salesperson indicated on an open transaction
Complete customer exchanges
Complete customer returns
Complete Orders for Ship Locations Other Than Login Locations
Complete Returns for Return Locations Other Than Login Locations
Complete sales orders
Create Customers when another exists with the same Email Address
Allow Creation of New Orders in ERP from Enter a Sales Order
Create Multiple Fulfillments for a Method
Create order from eRoam
Create purchase order not on hold from POS entry
Create special order products within POS entry
Create stock product within POS entry
Delete a Stock Merchandise Line Item Linked to a Purchase Order not on Hold
Delete direct ship line items on an order
Delete quotes
Delete special order line from a sales order
Delete shopping carts
Delete special order line item linked to a purchase order not on hold
Delete the fulfillment with the delivery charge
Delete/Edit information on open transactions
Delete/Edit line items on transactions with deposits applied
Direct Ship - Delete a Direct Ship Order Line Item when the Linked Purchase Order is not On Hold
Discount POS Dollar Adjustments
Discounts - Apply Automated Line Discounting
Discounts - Apply Manager Only Discounts
Discounts - Override Sales Discount Restrictions
Discounts - Suspend Automated Line Discounting while Retaining Discounts
Dynamic Tab View - Maintain a Service Order
Dynamic Tab View-Maintain a Sales Order
Enter Return Portion of Existing Exchange
Edit the builder allowance amount within POS entry
Edit the calculated sales tax amount on open transactions
Enter Installation/Restocking Charges
Enter a New Exchange
Enter return/exchange/dollar adjustment without original order
Enter/Edit Layaway Orders
Enter/Edit Multi Ship Masters
Enter/Edit Sales Orders
Enter/Edit Sales Quotes
Finance Receivables - Allow Adjustments After Partial Completion
Import Products from Retail Deck
Increase Sell price above Max Sell price for Repossessions
Maintain a Customer's Own Goods Order from View Customer Activity
Maintain a Return from View Customer Activity
Maintain a Sales Order from View Customer Activity
Maintain an Exchange from View Customer Activity
Maintain customer deposits immediately after order deletion
Manually Link Purchase Orders on Sales Orders and Exchanges
Adjustments Modify Coupons and Subtotal Discounts on Returns and Adjustments
Override Allowed Number of Days on Returns
Override Calculated Protection Plan Price
Override Charge Sales Tax Settings
Override Commission Rules
Override Deposit Hold Back on an Order
Override Group Return Restriction Days
Override Handling Method on a Fulfillment
Override Maximum Number of Fulfillments
Override Maximum Percentage for As-Is Selling Price Adjustment
Override Minimum Deposit on Take With Orders
Override Parcel Route Requirement
Override Protection Plan Cancellation Restriction Days
Override Protection Plan Limitations
Override Route on Sales and Service Transactions
Override restriction of line updates once a linked auto transfer has been manifested
Override Sales Quote Conversion Discount Restriction
Override Same Day Pickup Restrictions
Override soft kit restrictions
Override delivery date restrictions based on available date
Override future scheduling restriction
Override system calculated delivery charges
Override system calculated restocking fee
Override the Minimum Purchase Requirements on Discounts
Override the Restrictions on Combining Line and Subtotal Discounts
Override the Restriction to Limit Use of Rewards Gift Certificates to Issuing Customers
Override Restricting Membership Products on Return
Protection Plans - Allow Removal of Auto Added Plans
Protection Plans - Allow Sale of Manager Only Plans
Search for vendors, view vendor name and model numbers
Sell designated floor sample merchandise
Sell kit component products separately from their assigned kit
Update a Customer Address-Modify Customer Name
Update a delivery order with a scheduled status
Update special order line item linked to PO not on hold
View and Manage Open Orders - Maintain Exchanges
View and Manage Open Orders - Maintain Returns
View and Manage Open Orders - Maintain Sales Orders
View and Manage Open Orders - Maintain Transfers
View encrypted finance, credit card, check account numbers
```

Plus the non-boolean tail (§4): `Deletion of Existing Sales Documents` (Orders · Exchanges ·
Returns · Layaways) · `View All Sales Information` · `Delivery Contract Status Codes` ·
`Maximum Price Variance`.
