# 02 — EDI Advanced Ship Notice Dates

**Source:** https://storis.zendesk.com/hc/en-us/articles/15202192520468-EDI-Advanced-Ship-Notice-Dates
**STORIS area:** STORIS ERP > Merchandising
**Related:** `01-selling-location.md` (same EDI purchasing track)

---

## Access path (verbatim from source)

> Enter a Purchase Order > Merchandise tab > Actions button > EDI Advanced Ship Notice Dates

The source is precise about the gating, and the gating is the interesting part:

> This screen is available through the extra Actions button on the Merchandise tab of Enter a Purchase Order **only when a line item is selected** and **EDI is active for the vendor**.

## Purpose

Update the Advanced Ship Notice (ASN) **Shipping Date** and/or **Delivery Date** for the **selected line item** on the current purchase order.

Scope is per-line-item, not per-purchase-order. Two line items on the same PO can carry different ASN dates.

## Critical dependency — the receiving calendar

Transcribed verbatim, because it is the only piece of real logic in the article:

> **NOTE:** This process uses the **Receiving Calendar** setting in **Vendor EDI Settings** to determine when, if at all, to use the receiving calendar established in **Warehouse/Store Receiving Settings**.

Read that carefully — it is a two-level switch:

- `Vendor EDI Settings > Receiving Calendar` decides **whether and when** the receiving calendar applies for this vendor.
- `Warehouse/Store Receiving Settings` holds **the actual calendar** (which days the warehouse/store can receive).

Neither settings screen is dissected in this handoff. Do not implement date snapping or validation against a calendar until you have both. Stub the calendar check behind an interface and log it.

## Fields

### ASN Shipping Date

Use this field to update the ASN Shipping Date. You can enter a new ASN date or overwrite an existing one.

**Constraint:** the date in this field must be the **same as or before** the ASN Delivery Date field.

### ASN Delivery Date

Use this field to update the ASN Delivery Date. You can enter a new ASN date or overwrite an existing one.

**Constraint:** the date in this field must be the **same as or after** the ASN Shipping Date.

Note that the two constraints are the same constraint stated from both sides: `shipping_date <= delivery_date`. Implement it once; surface the error on whichever field the user is editing.

## Behavior rules

1. The Actions-button entry for this screen is hidden or disabled unless a line item is selected on the Merchandise tab.
2. The entry is also unavailable unless EDI is active for the purchase order's vendor.
3. Both dates are editable: a blank field may be filled, a populated field may be overwritten.
4. `ASN Shipping Date <= ASN Delivery Date` must hold. Equal dates are explicitly valid.
5. Saving applies the dates to the selected line item only.
6. The receiving calendar, when the vendor's EDI settings call for it, comes from Warehouse/Store Receiving Settings. Exact effect on the entered dates is **not stated in the source**.

## Data model `[INFERRED]`

- Purchase order line item gains nullable `asn_shipping_date` and `asn_delivery_date`.
- Vendor gains an EDI-active flag and a `receiving_calendar` setting (mode/value unknown).
- Warehouse/store entity owns a receiving calendar (shape unknown).

## Acceptance criteria

- With no line item selected, the Actions menu does not offer EDI Advanced Ship Notice Dates.
- With a line item selected but a non-EDI vendor, the option is not offered.
- With a line item selected and an EDI-active vendor, the option opens the screen.
- Entering a shipping date later than the delivery date is rejected.
- Entering a delivery date earlier than the shipping date is rejected.
- Equal shipping and delivery dates are accepted.
- An existing date can be overwritten.
- Editing line 2's dates leaves line 1's dates untouched.

## Open questions

- **What does the receiving calendar actually do to these dates?** Block non-receiving days? Snap forward to the next receiving day? Warn only? The source says only "when, if at all, to use" it. This is the single largest gap in this screen.
- **What are the possible values of `Vendor EDI Settings > Receiving Calendar`?** Needs that article.
- **Are these dates recalculated automatically** when an inbound ASN (EDI 856) arrives, or are they manual-only? The screen is described as manual update; the automatic path is undefined here.
- **Is there any validation against the PO's own expected/due dates?** Not mentioned.
- **What happens to these dates if the line item quantity is split or the line is deleted?** Not mentioned.
