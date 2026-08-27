# Security & Permissions

## The model to build `[DOC]` + `[INFER]`

STORIS' authorization model has four layers, and Sales Processing depends on all four. Build the model
in phase 0 — retrofitting permissions into a completed order module is painful and always leaves gaps.

```
1. Menu/route access          can this user reach this program at all
2. Field & action permissions named capability flags checked at a specific field or button
3. Data scope                 which districts, locations, salespeople, customers this user can see
4. Inline override            an authorized second user supplies credentials to permit ONE action
```

### Layer 3 — data scope

Two independent, overlapping systems:
- **Regional processing** — restricts districts and locations; also forces district-first sorting in
  reports and limits which customers are visible
- **CRM access level** — `Salesperson` / `Store Manager` / `District Manager` / `Corporate`, driving
  lead visibility and the location dropdown *independently of* regional processing (see `08`)

Model scope as a resolved set of location ids plus a lead-visibility rule, computed once per session
and applied as a query predicate — never as a UI filter only.

### Layer 4 — the override pattern `[DOC]`

This is the pattern that makes a retail floor work, and it is worth implementing properly:

> When a user lacks a permission, an access-control dialog appears; **a different, authorized user
> enters their id and password**; the action proceeds **once**; the override is recorded.

Requirements: the override must be **scoped to the single action**, must **never** elevate the session,
must be **audited** with who overrode what for whom, and in several documented cases must **write a
comment onto the order** (tax-exempt override, price-variance override). Some overrides are
temporary-by-design — full card-number display grants visibility that expires.

`[DECIDE]` Whether managers override with a password at the terminal or approve from their own device.
Password-at-terminal is what the staff know; device approval is more auditable and avoids shared
credentials. This affects UX design in phase 0.

### Precedence gotcha `[DOC]`

For at least one financing permission, the **user-level setting overrides the user-group setting** —
the individual wins over the role. Do not assume role-then-user-additive precedence globally. Pick one
rule, document it, and apply it uniformly: `[DECIDE]` recommend "explicit user grant or deny beats
group; deny beats grant within a level."

---

## Permission catalogue

Extracted verbatim-in-substance from the source docs, grouped by the STORIS security area they live in.
Use as the seed list for the permission table; names can be normalized but keep them recognizable to
staff who are being retrained.

### Sales
- Enter / edit *{order type}* (per type)
- Delete or add line items on transactions with deposits applied
- Delete a stock merchandise line linked to a purchase order not on hold
- Sell kit component products separately from their assigned kit
- Sell designated floor-sample merchandise
- Access sales order line discounts
- Backdate transactions
- Change the salesperson on an open transaction
- Change delivery status
- Change order fulfillments with a status of Scheduled
- Change requested date in order/exchange entry
- Change auto fill days on transactions
- Change the net total on sales orders
- Create multiple fulfillments for a method
- Change stock location on sales orders and exchanges
- Override handling method on a fulfillment
- Override system-calculated delivery charges
- Override the minimum purchase requirements on discounts
- Override reservation required
- Manually link purchase orders on sales orders and exchanges
- Suspend automated line discounting while retaining discounts
- Prompt for reason code if delivery charges overridden
- Override charge sales tax
- Edit the calculated sales tax amount on open transactions
- View all sales information (gates the salesperson filter in operational views)

### Logistics
- Override capacities when scheduling routes that are full
- Adjust inventory for locations when WMS is active
- Print a delivery ticket within POS entry
- Print a customer pickup ticket within POS entry
- Manually reserve stock merchandise
- Change fulfillment status to SCH with a balance due

### System
- Change taxable settings

### Receivables
- Override daily maximum cash refund per customer
- Receive a default for the payment amount
- Issue deposit refund
- Issue refund by check / by gift / by other
- Apply payments without autopay
- Revolving worksheet access
- Override required percentage paid for add-on
- Backdate payments
- Per-payment-type access (yields "You do not have access to this payment type")

### Financing
- Access credit applications for third-party online financing
- Access other credit applications and score reporting (gates full SSN display)
- Review and resubmit failed finance settlement batches *(user-level overrides group-level)*
- Enter finance-receivable payments
- Allow negative FR payments for different day's activity
- Finance application manager *(location-level flag, not a user permission)*

### Card & sensitive data
- View encrypted finance, credit card, check account numbers
- View masked account numbers *(the second-user override credential for unmasking)*

### Other
- Point-of-sale user verification (re-enter user id and password on order create/update)
- Prohibit unscheduled lines (requires manager credentials)
- Fulfillment location restrictions
- Menu security on the cash-drawer manager-approval screen — **explicitly recommended by the docs**
  because that screen exposes system totals to the person entering counts

---

## Data protection `[DECIDE]`

Three places where the STORIS design is a product of its era and we should choose differently:

1. **Card PANs.** STORIS stores encrypted account numbers with an unmask permission. Use processor
   tokenization instead and store no PAN — see `05`.
2. **SSN.** Stored encrypted on the customer record for credit applications, with a permission for
   full display. Prefer never persisting it: collect it, pass it to the provider, discard it. If a
   provider requires re-submission, store a provider-side reference instead.
3. **Driver's licence.** Captured for check acceptance and for financing verification. Decide retention
   period explicitly; default to storing a verification result and last four, not the number.

All three are compliance decisions with real cost either way. Raise them with whoever owns compliance
before phase 3.

## Audit requirements `[DOC]`

The docs show automatic order comments written on: delivery-charge relocation, tax-exempt override
(recording product, authorization number, and the override), and price-variance override. Generalize:
**every permission override and every automatic monetary recalculation writes an immutable audit
comment on the order**, visible to staff, with actor, timestamp, and before/after values. Staff use
these comments to reconstruct what happened on a disputed order; they are a feature, not a log.
