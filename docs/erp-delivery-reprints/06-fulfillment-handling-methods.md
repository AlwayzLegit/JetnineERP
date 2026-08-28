# 06 — Fulfillment Handling Method Settings

Small reference module, included because the reprint article's related set points at it and because it is a dependency of third-party logistics.

Handling methods can be assigned to **products**, used in **fulfillments**, and used in **delivery charge tables**. A separate process, *Fulfillment Handling Method Assignment Settings*, associates handling methods with an **order type**. See STORIS's *Third Party Logistics Overview* / *Third-Party EDI Logistics Overview* for the wider picture.

## Data shape

| Field | Rule |
|---|---|
| **Handling Method** | Two-digit **alphanumeric** code. Primary key. |
| **Description** | Up to **50 alphanumeric** characters. Translatable via the associated extra Action. |

> These codes should correlate with the codes required by the third-party logistics company, sent in the **EDI 215** document.

That constraint is the reason for the two-character width — do not widen it without checking the 3PL's 215 spec.

## Operations

**Create** — enter a two-digit code, tab to Description, enter up to 50 characters, Save.

**Edit** — enter the code or select it via lookup; the record populates. **Only the Description is editable.** Save to commit, Clear to discard.

**Delete** — permitted only when *all* of the following hold:

1. the handling method is not used on any order fulfillment, voided order, or completed order;
2. no product carries the handling method in Advanced Product Settings; and
3. the handling method does not appear in Fulfillment Handling Method Assignment Settings for any order type.

If the criteria are met, Delete prompts a confirmation message.

Implement the three checks as a single reusable `canDelete(code) -> (bool, reasons[])` so the UI can explain *which* condition blocked the delete rather than just refusing.

---

# Appendix — Fulfillment Date on the Merchandise page

Linked from the reprint article as "multiple fulfillment dates". Determines whether the per-line Fulfillment Date field is editable — which in turn determines which of the `02` rules can ever fire on a given line.

The field is **blank and inactive** when the Delivery information Status on the order's customer page is anything other than Estimated or Scheduled.

Otherwise, by fulfillment method:

| Fulfillment method / condition | Field shows | Editable? |
|---|---|---|
| **Direct shipment** | Date merchandise is expected to be received by the customer (the direct-ship PO's receipt date) | No |
| **Customer pickup** | — | No |
| **Take with** | Current date | No |
| **Delivery**, `DELIVERY DATES - Allow multiple on order` (POS Control Settings → Logistics) **not** checked | Date from delivery information on the customer page | No |
| **Delivery**, `DELIVERY DATES - Allow multiple on order` **checked** | Defaults to the customer-page delivery date | **Yes** — a different date can be selected to schedule that line |
| **Bulk product type** | Defaults to the customer-page delivery date | **Yes**, but `Update Line Item Delivery Dates` is **not** available from the Action button — bulk products cannot have multiple delivery dates |
| **Line already has multiple delivery dates** | The **next** delivery date | No — attempting to change it raises a warning and the entry is rejected. Use Action button → `Update Line Item Delivery Dates` to change or remove dates for quantities on the line |

**Takeaway for `02`:** `DELIVERY DATES - Allow multiple on order` is the master switch for the entire multi-date reprint state machine. With it off, every order has exactly one fulfillment date per line and the rule set collapses to "any change after print sets the flag to `R`." Build the general case, but make sure the degenerate case is the fast, obviously-correct path — it will be the majority of real traffic.
