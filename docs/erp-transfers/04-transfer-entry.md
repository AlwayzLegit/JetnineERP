# 04 — Transfer Entry Screen

Source: *Enter a Transfer* (the full-featured variant). The locked-type variants are in
`05-transfer-variants.md`.

Two tabs: **General** and **Merchandise**. Header fields sit above the tabs.

---

## Header

| Field | Behavior |
| --- | --- |
| **Transfer Number** | Enter an existing number to load. Click **+** to create. Auto-numbered unless the control setting is blank → Transaction Number Entry modal. Search opens a menu: *View Inbound Transfers* / *View Outbound Transfers*. Where "automated & manual POS numbers" is active at the location, the user may choose per document. |
| **Last Order** | Recalls the last saved transfer. Hidden when: first entering the screen; entering from the main menu; the transfer was completed or deleted; the transfer is being viewed read-only. Recalling still applies security. |
| **Total Volume** | Read-only, derived. |

### Transaction Number Entry (modal)

Single field, Transaction Number. Save validates and returns to the entry screen. Only appears when
the "next POS/service transaction" setting is blank.

---

## General tab

| Field | Behavior |
| --- | --- |
| **Date** | Transaction date, calendar picker. |
| **Type** | `Stock` / `As-Is` / `Floor Sample` / `Auto Transfer` / `Move to As-Is`. Selecting **Move to As-Is** activates and requires **Reason Code**, and disables as-is piece selection. |
| **Reason Code** | Active only for Move to As-Is. Defaults from the location's As-Is Transfer Reason and becomes read-only when defaulted. |
| **Complete Transfer** | Checkbox. Inactive until all pre-conditions are met **including Print Transfer Ticket checked**. Inactive at 52 back orders. On save: moves the pieces, closes the transfer, sends it to history, unblocks invoicing. Checks `complete_merchandise_transfer` and `complete_transfer_from_receiving_location_only`. |
| **Print Transfer Ticket** | Active only when the delivery/pickup/transfer-ticket print criteria are satisfied **and** the user has `print_transfer_ticket_within_transfer_entry`. |
| **From** | Location code + dropdown. Filtered by regional processing **and** by the user's Inventory (Region) location restrictions. |
| **To** | Location code + dropdown. Action button opens **List Entry** for selecting multiple destination locations (distributed transfer). |
| **Distribute Quantities** | Checkbox. Opens the Transfer Distribution Quantity screen. Active only when multiple To locations are selected **and every one is a store**. |
| **Delivery Information → Route** | Blank ⇒ system assigns the route from the Warehouse Location or ZIP Code table. If no default exists, the user may enter one or leave it blank. Arrow button lists transfer route codes. |
| **Delivery Information → Date** | The date the movement should occur. If the logistical route settings' "Transfer From" is blank, the calendar shows all dates as available; once a date is picked the system checks Route Capacity Settings and Route Capacity Control Settings for fullness. |
| **Instructions for this Fulfillment Only** | Unlimited text. Prints on the transfer document and the pack list; optionally included in Report Transfers by Location. |
| **Ship Direct** | Checked ⇒ ship From → To directly on save. Unchecked ⇒ look up a distribution location schema between From and To and **auto-create the additional multi-leg transfers**. |

### General tab rules

- Corrections and quantity adjustments must be made **before** checking Complete Transfer.
- Store↔store requires the `store_to_store_transfers` setting.
- A product may not be transferred when its distribution status has an inventory availability
  restricted to the selling store (override permission exists — see `03-permissions.md`).
- Ability to create a transfer at all is gated by: the transfer-security-tables switch, the user's
  transfer security rows, and Logistics Security.
- Max 52 back orders; warn at 48 and 52.
- Comments: Actions → *Sales Order Audit Text* opens the comments editor; Actions → *Additional
  Comments* opens a free-text entry window.

### General tab right-click menus

- Kit Inventory/Availability Inquiry
- Warehouse Stock Inquiry

### General tab Actions menu

- Audit Comments Log
- Additional Comments
- **Distribute Quantity Type** — active only when multiple locations were selected for a one-time-buy product
- **Print Transfer** — print or email via the output settings window. Only for open or completed
  transfers; voided/deleted cannot be printed. Email recipient and address are **not** pre-populated.
- Select a Fulfillment Date

---

## Merchandise tab

| Field | Behavior |
| --- | --- |
| **Product** | Search menu offers: View Kit Product Details, As-Is Inventory Inquiry, Search for a Product, View Special Order Product Details. Action button opens Special Order Entry (needs `create_special_order_products_within_pos_entry`). Defective-status products are rejected. Description auto-fills. |
| **Brand** | Read-only, from product. |
| **Serial/Reference Number** | Availability depends on serial-tracking settings. **Mandatory for As-Is transfers** — identifies the specific existing as-is piece. |
| **Quantity to Transfer** | Quantity requested. |
| **Available** | Read-only: quantity available at the From location. |
| **Scheduled Quantity** | If < ordered, the remainder goes on **Hold**: reserved to the transfer but excluded from the transfer ticket. On completion, unheld pieces move; the transfer stays open; hold is cleared and the remainder becomes schedulable. |
| **Location** | Read-only From location. |
| **Line Type** | Read-only: Stock / As-Is / Floor Sample / Auto Transfer. |
| **Purchase Order Number** | Read-only when linked. |

### Merchandise tab rules

- Hard kits display the **kit master line plus each component line** in the grid.
- After adding a line, check route capacity. If exceeded, warn:
  `"Route X is full for MM/DD/YYYY. Do you wish to override the capacity limit?"`
  - **Yes** → requires `override_capacities_when_scheduling_routes_that_are_full`.
  - **No** → the line is added with status **U (Unscheduled)**.
  - The warning fires on **every** add/change that *increases* usage past capacity. Changes that
    *reduce* an already-over-capacity route produce **no** warning, even if still over.

### Grid

Product availability and pricing per line, plus the status flag column (see `01-domain-model.md` §3).

### Merchandise tab Actions menu

- Additional Line Item Details
- Advanced Line Item Display Screen
- Assign Pieces
- Audit Comments Log
- **Build From Storage Location** — see below
- Create Purchase Order — *only* for special-order products and hard-kit masters
- Enter Line Item Comments
- Line Item Linked Document Display
- Line Stock Availability
- Select Fulfillment Date
- View All Linked Transfers

### Build From Storage Location

Available on new stock, floor sample, or as-is transfers. **Usable once per transfer**, then disabled.
Also disabled once the first transfer line has been entered.

Flow:

1. Open the Multiple Storage Location Selection window; user picks one or more storage locations.
2. On OK, generate transfer lines for all available merchandise in those storage locations.
3. If the transfer type is **As-Is**, saving out of that window opens the **Select As-Is Pieces**
   screen instead of populating directly.

Behavior of the generated lines:

- Transfer comments are updated with each product code and quantity added.
- Like products are grouped by storage location.
- Special-order products are grouped only when their special-order details match.
- Pieces are auto-assigned to each line.
- If a piece cannot be assigned, the line's order quantity is **reduced**.
- Products with no assignable piece are **not added** at all.

Restriction: only available for locations set up as location-tracked **with no distribution list in use**.

### Select As-Is Pieces

Reached from Build From Storage Location on an as-is transfer. Lists every as-is piece in the chosen
storage location(s). Checking a row adds that piece to the transfer; on Save the pieces move from the
storage location onto the transfer.

- As-is pieces already assigned to sales orders are **excluded** (they cannot be transferred).
- Columns: Product Number, Product Description, As-Is Reason Code, As-Is Reason Code Description,
  Serial Reference Number, **Saleable** flag, Storage Location.
- **Saleable** derives from the reason code's `restrict_as_is_products_from_being_sold` setting:
  - setting enabled → `No` (piece may still be added to the transfer)
  - setting not enabled → `Yes` (piece may be added to a sales order)

---

## Confirm Required Carton Quantity for Shipment

Modal shown on **save** of a PO or transfer whose quantity is below the product's minimum carton
quantity — only when `logistical_carton_transfers` is on in Advanced Product Settings.

Grid columns: Product · Description · Purchase Status · **+** · Increase Quantity · Carton Quantity ·
Current Quantity.

- Checking **+** auto-increases the quantity to the full carton.
- Overriding the minimum requires the matching complete-carton permission for the location-type pair;
  without it, the security override screen appears.

Processes that raise this window: Enter a Purchase Order · Enter a Transfer · creating a PO from Enter
a Sales Order · Process Merchandising Decisions · Product Performance and Purchase Recommendations ·
Product Selection Screen.

> Documented caution worth carrying into the UI: creating POs from sales-order entry enforces complete
> carton requirements, so creating multiple POs instead of linking reservations to an existing PO can
> silently over-order.

---

## Product Quantity in Excess of Transfer Quantity

Informational-only screen. Grid columns: **Product · Total Quantity · Maximum Transfer Quantity**.
Surfaces when the assembled quantity exceeds the maximum transfer quantity. Read-only; no actions.
