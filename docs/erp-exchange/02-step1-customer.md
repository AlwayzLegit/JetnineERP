# 02 — Step 1: Customer

Header identity, customer, addresses, and the fulfillment schedule. Most of the complexity
here is *scheduling*, not customer data.

---

## Basic Information

### Fulfillment Method
`Delivery` | `Customer Pickup` | `Take With`. Editable at **any point** in the exchange
process — not locked once set. `[SETTING]` default from *Exchanges*, General page, POS Control
Settings. `[GATE]` Take With unavailable at WMS locations. See `01` for the flows.

### Original Order
Required, even when the order doesn't exist. Search opens **Customer Buy History Inquiry**.
`[PERM]` *Enter return/exchange/dollar adjustment without original order* to proceed without a
real order number. See `01` § Core invariants.

### Date
Transaction date; defaults to current for new orders. **Cannot be a future date or fall in a
closed period.** `[PERM]` *Backdate Transactions* to backdate from an overlap month into the
previous (current) month.

### Store
Location issuing the credit memo / return. Defaults from the login location.
`[GATE]` Available locations may be restricted by **Regional Processing**.

### Salesperson (sale portion)
The salespeople credited with the **new sale**. `[GATE]` Inactive until Original Order is
specified. Multiple salespeople via the **Multiple Salesperson Commission Screen**.
`[PERM]` *Change the salesperson indicated on an open transaction* — required to edit on an
existing order; without it the field is inactive.
`[SETTING]` *Hide Salesperson Lookup in Entry Processes* hides the Search button; multiple
salespeople are then entered via the Multiple Salesperson Selection Window.

### Return Salesperson
Same mechanics, for the **return portion**. `[GATE]` Inactive until Original Order is
specified. Same multi-salesperson and lookup-hiding behavior.

**Build note:** two independent commission attributions on one document. Commission
calculation must treat them separately, including negative commission on the return leg.
Confirm with the business how return commission should behave before building — the source
doesn't say, and the answer materially affects salesperson pay.

---

## Customer Information

### Customer Number
Defaults from the sales document if available; can be changed to a different customer.

Entry behavior is **type-sensitive**:

| Input | Result |
|---|---|
| Numeric | Treated as a customer code. Valid code → populates the customer fields below |
| Contains alpha characters (e.g. a last name) | Opens **Search for a Customer** |
| Search button | Opens **Search for a Customer** |
| Action button | Opens **Advanced Customer Settings** to create a customer on the fly |

`[SETTING]` *Always Search for Customer* (POS Control Settings) — when active, the Search for a
Customer screen appears **first**.

**Merged customer records:** entering a code that has been merged into another customer offers
the "merged to" customer; selecting it uses that code on the order. Handle this — duplicate
customer records are guaranteed in any migrated dataset.

`[GATE]` Accessible customers may be restricted by **Regional Processing**.

**Tax validation happens here.** See `01` § Core invariants — exemption is checked by
comparing *Tax Id Expiration Date* (Advanced Customer Settings) against the sale's **written
date**, and status is inherited from the original invoice when one exists.

---

## Billing Information

All display-only, sourced from **Advanced Customer Settings** unless noted.

| Field | Source |
|---|---|
| **Name, Home / Cell / Work Phone, Extension** | Customer settings |
| **Primary Name + phones** | The **original order** if one was specified; otherwise Advanced Customer Settings once a customer number is entered |
| **Alternate Name, Relationship** | Populated only if available — **fields are hidden otherwise** |
| **Primary Email Address** | Customer record |
| **Address 1, Address 2, City, State, Zip** | Advanced Customer Settings |

`[GATE]` **When multiple phones of the same type exist, only the highest-priority one
displays.** So phone numbers carry a priority ordering in the customer model.

Changing Shipping Information offers the option to also change Billing Information.

**Email button** `[LEGACY]` — opens a new message in the workstation's default mail client,
pre-filling only the To line from the Primary Email Address field. Nothing is written back to
STORIS; send/save behavior belongs entirely to the mail client. In a web ERP this should
become a tracked, logged send with a template — the "no comments are written to STORIS" caveat
is a defect, not a feature.

---

## Shipping Information

Name, phones, email, and address, defaulting from Advanced Customer Settings. **If no separate
shipping information exists on the customer, shipping initially equals billing on a new
order.** Order-specific shipping is entered via **Actions > Shipping Information**.

`[SETTING]` *Address Cleansing* (Alternate Tax Interface Control Settings) — when active, the
entered address is validated.

**On-the-fly customer creation from lookup:** in Search for a Customer, entering Phone, Email,
and/or Last Name and then exiting **without selecting a customer from the grid** propagates
that information into Advanced Customer Settings as a new customer.

`[GATE]` **Combined length of all name elements is limited to 50 characters.**

`[SETTING]` *Confirm Address on Orders and Exchanges* (POS Control Settings) — when enabled, a
**phone number is required** to save an exchange (or a sales order with delivery
fulfillments). On save, **Add Phone Number** and **Update a Customer Address** are displayed;
saving a new phone adjusts Update a Customer Address accordingly. If billing information is
updated, a message offers to **update the customer's other open orders**.

That last cascade is worth flagging: one address correction can rewrite delivery addresses on
unrelated open orders. Keep it — it's the behavior users expect — but make the confirmation
list *which* orders will change.

---

## Fulfillment Information

### Delivery Information

**Date** — estimated or scheduled delivery date, with a calendar picker. The Action button
offers **Override Route Capacity Date** and **Routing Cutoff Calendar**.
With the **Consolidate Delivery Dates** feature, the system checks for other orders already
scheduled for this customer.

**Status** — `[GATE]` active only when Fulfillment Method = Delivery:

| Status | Meaning |
|---|---|
| `Scheduled` (SCH) | The date is a real scheduled delivery date |
| `Estimated` (EST) | The date is an estimate only |
| `As soon as possible` (ASAP) | No date provided |
| `Customer will call` (CWC) | No date provided; the customer will call |

`[SETTING]` Default from *Default Delivery Status*, Logistics page, POS Control Settings.
`[PERM]` *Change Delivery Status* to change it on the current order.

**Ship From Location** — defaults from the order's Ship Location; editable. Displays read-only
per merchandise line on the Sale Merchandise page.
`[SETTING]` When defaults are driven by the customer's deliver-to zip, *Normal Fulfillment
Location* in **Individual Zip Codes** is used.
`[GATE]` Available fulfillment locations may be limited by *Fulfillment Location Restrictions*
in Create a User / Create a User Group.
`[SETTING]` *Update Stocking Location When Fulfillment Changes* — changing the fulfillment
location may also change the stock location.

**Manifest Location** — the "flyby" location merchandise is fulfilled from.
`[GATE]` Visible only when **Advanced Dispatch Track** is active. Same location list as
Fulfillment Location; defaults empty. The merchandise and location are added to the fulfillment
location's delivery manifest **as a stop**. `[GATE]` **Once on a manifest, this cannot be
changed.** When populated, the fulfillment is routed and manifested with deliveries from that
location sharing the same delivery date and route — with no requirement that it be associated
with an order fulfilled from there.

**Route** — defaults from the route code in **Update Zip Code Settings**, matched on the zip
from Advanced Customer Settings; blank and manually enterable when the zip has no route.
Search opens Route Code Lookup; Action offers **Route Calendar Display** and **Route Cutoff
Calendar**.
`[PERM]` *Override Route on Sales and Service Transactions* — absent, a security override
prompt appears.
`[GATE]` **Once an order is on a manifest, the route cannot be changed.**
`[PERM]` *Access all Delivery Route Codes* — must be **unchecked** to restrict route lookup to
routes associated with the specified zip code.

### Pickup Information

**Date** — `[GATE]` active only when Fulfillment Method = Customer Pickup.
**Status** — display-only, always `Scheduled`.
**Pickup Location** — `[GATE]` pickup orders only. `[SETTING]` default from *Customer Pickup*,
Inventory & Logistics page, Warehouse/Store Location Settings; or from *Normal Fulfillment
Location* / *Pickup Fulfillment Location* in Individual Zip Codes when zip-based defaults are
in use. `[GATE]` **If no location defaults, one must be specified before proceeding to the
next page.** Regional Processing and *Fulfillment Location Restrictions* both apply.

### Other Fulfillment Information

**Requested Date** — when the customer prefers to receive the merchandise. Must be equal to or
later than the order date. Used by Ashley Furniture Industries (AFI) replenishment to try to
ship early, but usable informationally without AFI.
`[SETTING]` *Require Either Requested Date or Delivery/Pickup Date on Order* — when checked and
the status is CWC or ASAP, either a Requested Date must be given or the status changed to EST
or SCH with a date. Unchecked → Requested Date is always optional.
`[PERM]` *Change Requested Date in Enter a Sales Order or Enter an Exchange* — without it, a
security override is required, and the override **is logged in the sales order Audit
Comments**.

**Instructions for this Fulfillment Only** — unlimited characters, always defaults empty,
scoped to this fulfillment. Entries here have **no effect on other fulfillments sharing the
same delivery address.**

**Print Delivery Instructions for this Address** — opens the Extended Instructions Text Box for
additional shipping instructions; Action edits previously entered text. (These are the extended
instructions that print on the manifest — see the Printing handoff, `06`.)

**Sale Handling Method / Return Handling Method** — two independent handling methods, one per
leg. `[GATE]` Apply to Delivery and Customer Pickup only; for Take With and Direct Ship both
default to `None Selected` and are inactive.
`[SETTING]` *Default Handling Methods on Fulfillments* defaults them via the hierarchy in
**Fulfillment Handling Method Assignment Settings**.
`[PERM]` *Override Handling Method on a Fulfillment* to change the default manually.
Overrides are cleared via the global Actions options **Remove Return Handling Method
Override** and **Remove Sale Handling Method Override**.

Three interactions to preserve:
- `[SETTING]` If *Delivery Charge Recalculation - If Partially Completed* is **unchecked** and
  the fulfillment is partially completed, changing Handling Method does **not** recalculate the
  delivery charge.
- If a delivery ticket has already been printed, changing Handling Method raises a warning and
  is treated as an **override**, requiring the permission above.
- `[SETTING]` With *One Delivery Charge per Order* enabled, only the fulfillment carrying the
  delivery charge uses its Handling Method; the field is **disabled on delivery fulfillments
  without delivery charges** (though still displayed). Customer Pickup fulfillments are
  unaffected by this setting.

**Number of Postponements** — read-only, delivery and pickup fulfillments only.
`[SIDE EFFECT]` Incremented by 1 whenever the order is saved with a fulfillment date **later**
than the current one. Moving a date **earlier** does not update it.
Setting status to ASAP or CWC **pauses** the fulfillment: the counter is inactivated (still
visible), and resumes incrementing when the status returns to EST or SCH.

A postponement counter is a genuinely useful service metric. Keep it, and expose it — it's the
cleanest available signal for "this customer has been jerked around."

---

## Contact Information

**Status** — Delivery Contact Status code for the order.
`[PERM]` *Change Delivery Contact Status* to update. `[GATE]` Inactive if no delivery contact
statuses exist in the system.
`[GATE]` A salesperson sees only the codes defined for them in **Delivery Contact Status
Codes** in Create a User; **if none are defined, they can access all codes on the system.**
Setting a status enables the Date field.

**Date** — `[GATE]` inactive until a Status other than "None" is selected.

**Business Contact** — optional alternate or business contact name.

> The "no codes defined means all codes" default is a fail-open permission. Ours should
> fail closed, or the empty case should be explicit rather than implied.

---

## Step 1 Actions

- Add Attachments / Edit Attachments / View Attachments
- Additional Comments
- Additional Order Detail
- Audit Comments Log
- Finance Application
- Miscellaneous Fees
- Order Source Entry
- Order Tax Information
- **Print Exchange** — `[GATE]` available in *View an Existing Sales Order* only; to print from
  this routine the order must be completed first
- Select Fulfillment Date
- Shipping Information
- **Split Exchange** — `[GATE]` not available if the customer is not required to provide a
  valid address
- Trade/Designer Information
- **View Signature** — the customer signature captured via *Complete a Pickup without Accessing
  Order Entry*. `[GATE]` active only for completed orders whose pickup ticket has been printed
- **Assign Payment Terminal** — opens EMV Terminal Selection to view/edit the terminal
  assignment
