# 05 — Type-Locked Transfer Entry Variants

Source: *Enter a Transfer (As-Is, Floor Sample, Stock)*.

Four menu entries — **Enter an As-Is Transfer**, **Enter a Floor Sample Transfer**, **Enter a Move to
As-Is Transfer**, **Enter a Stock Transfer** — that render the *same* screen as Enter a Transfer with
the **Type field locked** to whatever the menu entry implies.

Implement as **one screen with a `lockedType` parameter**, not four copies.

## Differences from the general Enter a Transfer screen

| Aspect | Enter a Transfer | Type-locked variants |
| --- | --- | --- |
| Type field | Editable | Read-only, set by entry point |
| Transaction Date | Free | Defaults to today, **future dates rejected** |
| Quantity to Transfer | No stated default | **Defaults to 1**, editable |
| Delivery Date | Future allowed | Future allowed (explicitly stated) |
| Build From Storage Location | Stock, floor sample, or as-is transfers | Documented as available for **As-Is** transfers |
| Line status flags | Includes `T` and `X` (multi-leg) | Documented set omits `T`/`X` |
| Instructions field label | "Instructions for this Fulfillment Only" | "Instructions" |
| General-tab actions | Includes *View All Linked Transfers* and *Select a Fulfillment Date* | *Select Fulfillment Date* only |

Everything else — From/To, Distribute Quantities, Route, Complete Transfer gating, Print Transfer
Ticket gating, comments, the Merchandise tab, the Actions menus, hard-kit expansion, Create Purchase
Order limited to special-order products and hard-kit masters — is identical.

## Type-specific side effects on completion

| Type | Side effects |
| --- | --- |
| **Stock** | Pieces move location. Saleable status unchanged. |
| **As-Is** | The specific as-is piece moves. Requires serial/reference. Piece must already exist in as-is inventory at the From location. |
| **Floor Sample** | Piece moves from saleable warehouse stock into as-is with the configured floor-sample reason code. Writes an **initial non-saleable inventory activity audit**. Selling price defaults per `assign_price_on_floor_sample_items`. Price changes to non-saleable items are visible in *View Detailed Activity for a Product* → As-Is Inventory Detail. |
| **Move to As-Is** | Pieces move **and** become as-is with the entered reason code. Reason code mandatory. As-is piece selection unavailable. Selling price defaults per `assign_price_on_as_is_items` / `assign_price_on_floor_sample_items`. |

## Operational note to carry into the UI

For cycle-count accuracy, prompt the user to **re-print inventory labels** for any piece moved into or
out of as-is inventory.
