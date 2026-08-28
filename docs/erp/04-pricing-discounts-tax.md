# Pricing, Discounts & Tax

## The price hierarchy `[DOC]`

Every point-of-sale process walks one ordered hierarchy and **stops at the first price found**.

```
1.  As-is pricing (stock adjustment / move-to-as-is)
       └─ Twilight discount pricing is a type of as-is pricing and is checked BEFORE other as-is
2.  Price / Spiff / Commission table
       a) if a price range carries a price category matching the customer's price category → that price
       b) otherwise the HIGHEST price in the table
          ...unless a lower promotional price exists elsewhere, in which case the FIRST
             promotional price found that is lower
3.  District & regional product settings — promotional sale price for the originating district
4.  Advanced product settings (pricing tab) — general promotional sale
5.  Warehouse inventory settings — price by location
6.  District & regional product settings — regular selling price for the originating district
7.  Advanced product settings — selling price
```

**Reordering `[DOC]`.** If the location's "use warehouse inventory" setting is on, warehouse
inventory price moves to position **4** and the promotional price drops to **5**.

**Kits `[DOC]`.** When a kit's source-of-price is `Component`, it overrides the location selling
price in warehouse inventory settings. The warehouse price is used only when the kit master's
source-of-price is `Product`.

**Customer price matrices `[DOC]`** are applied *after* the hierarchy resolves:

```
matrix price < hierarchy price  →  matrix price wins
   ...EXCEPT when the hierarchy price came from the Price/Spiff/Commission table (level 2) —
      that table overrides the matrix
no hierarchy price AND no matrix →  NO PRICE DEFAULTS ON THE ORDER
```

That last line matters: STORIS deliberately leaves the price blank rather than defaulting to zero.
Copy that — a zero-priced line is worse than an empty one.

`[DECIDE]` The source wording names two overriding tables — "the Pricing Level table or the
Price/Spiff/Commission table" — but only the latter appears anywhere in the hierarchy. Either they are
the same object under two names (assumed above) or a pricing-level table exists that the docs never
place. Confirm before phase 2.

**Markdown prices `[DOC]`.** The markdown price is used **unless the default selling price is
lower**, in which case the default wins.

### Implementation note `[INFER]` + `[DECIDE]`

Model this as an ordered list of resolver strategies returning `Option<Money>` plus a provenance
tag, then a post-pass for matrix and markdown — that much is `[INFER]`. `[DECIDE]`: persist the provenance
on the line (this is a new requirement, not STORIS behaviour; test `PRC-01` depends on it) — "why is this
price what it is" is the single most common support question in a retail ERP, and the price
hierarchy is deep enough that nobody can reconstruct it by inspection.

---

## Discounts `[DOC]`

- **Line-level** discount codes, **multiple per line**, selectable only if the product is flagged
  discountable *and* the "apply discount codes to individual line items" setting is on. Editing
  requires the line-discounts permission or an override.
- **Subtotal-level** discount code and amount, plus an additional discount percent/amount.
- **Coupons** — single coupon id per order; redemption sets a flag that a net-total adjustment
  resets.
- **As-is discounts** appear only after the line is flagged as-is *and* a piece with a matching
  reason code is assigned.
- **Formation-qualifying discounts** appear only if another qualifying line exists on the order.
- Subtotal-adjustment discounting requires the "apply to sales order by adjusting subtotal amount"
  setting *and* a maximum-subtotal-discount-percent of zero or null.
- Dropping below a discount's or coupon's minimum subtotal requires the override-minimum-purchase
  permission.
- Global/subtotal discounts are unavailable under an alternate tax interface (the field inactivates).
- Net-total adjustment and discounts/coupons are mutually exclusive (see `03`).

`[DECIDE]` The source docs never enumerate discount *types* or their precedence among themselves —
only price derivation. Define the discount type set and stacking rules explicitly before phase 2.
This is the most likely place for a silent margin leak.

---

## Tax `[DOC]`

Tax is calculated **per fulfillment**, and stored as one row per jurisdiction per fulfillment.

```
taxable_subtotal = merchandise subtotal + taxable charges
                   (vendor rebates, installment amounts, delivery amounts, …)
```

Applied tax rows sort **national → state → local**. Each row carries a jurisdiction code and a tax
type, and nests a row per fulfillment type with percent and amount, plus a total when multiple
fulfillment types exist.

### Order tax exemptions

| Field | Behaviour |
|---|---|
| Charge Sales Tax | Defaults from the customer's charge-on-sales setting. **Unchecking** a defaulted-checked value needs the override permission — **except no security is required if the customer is tax exempt**. **Checking** a defaulted-unchecked value clears tax id and expiration for this order. Toggling recalculates applied tax. |
| Charge National Sales Tax | Same pattern; editing needs the change-taxable-settings permission or an override |
| Tax ID | Display-only from the customer record. Under a CCH interface, becomes **required** if either charge flag is blank |
| Expiration Date | Read-only from the customer record |

All of these apply to **this order only** and never change the customer's future tax status.

### Editing calculated tax

Editing the calculated amount requires an explicit permission. Amount and jurisdiction code are
editable **only** when reached from the completed-order adjustment path — everywhere else they are
read-only. A "zero tax amount" checkbox zeroes applied tax. Remove applies only to local
jurisdictions in certain scenarios and is hidden otherwise.

### Third-party tax interfaces

Two are referenced: an **alternate tax interface** (ATI) and **CCH**/Avalara-style engines. Under
ATI, the entire tax list view and companion area inactivate — the external engine owns the numbers —
but the **exemptions section still applies**. Line-level tax-exempt authorization numbers are capped
at 20 alphanumeric characters for Avalara.

`[DECIDE]` Whether LA Mattress calculates tax internally or integrates a tax engine. This decision
changes the shape of phase 2 substantially: with an engine, tax rows become a cached response and
the editing surface shrinks to exemptions and overrides. Answer this before writing tax code.

**RTO note `[DOC]`.** Rent-to-own orders are forced **non-taxable** — all sales tax is stripped and
the provider handles tax inside its payment structure. The sales-tax report flags these with a
no-tax-reason code. This is a hard interaction between financing and tax; see `06`.
