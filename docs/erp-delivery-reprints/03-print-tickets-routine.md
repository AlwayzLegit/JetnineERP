# 03 — Print Delivery Tickets routine

Batch routine that prints or reprints all tickets for a location and, optionally, a schedule date. Covers delivery/return, pickup, and transfer orders.

**STORIS menu paths** (useful for naming, and for mapping legacy user habits):

- Customer > Coordination and Logistics > Delivery Processing > Print Delivery Tickets
- Customer > Coordination and Logistics > Transfer Processing > Print Delivery Tickets
- Merchandising and Distribution > Inventory > Inventory Management > Transfer Processing > Print Delivery Tickets
- Merchandising and Distribution > Logistics > Delivery Processing > Print Delivery Tickets
- Merchandising and Distribution > Logistics > Transfer Processing > Print Delivery Tickets

## Why it matters beyond printing

Running this routine is not a print job with a side effect — the side effects *are* the point. Completing it:

1. **assigns inventory** to the order,
2. **prepares the order for picking**, and
3. is the **first step in both manifest creation and order completion**.

After a successful print, the Logistical Scheduling grid's `D` column shows `Y`.

## Fields

| Field | Behavior |
|---|---|
| **Shipping Location** | The location tickets are printed for. Enter a code directly or pick from a list. Visible locations may be narrowed by Regional Processing restrictions. **For transfers**, a shipping location the user lacks access to *is* permitted, provided the user has access to the To Location. |
| **Order Type** | `Deliveries` (delivery sales orders/returns only), `Pickups` (customer pickup orders only), `Transfers` (transfer orders only). |
| **Print Orders / Returns / Exchanges** | Three checkboxes, **all checked by default**. Documents print first by route/truck, then by stop. Which boxes are active depends on the fulfillment method of the order type: Pickups → Orders and Exchanges active; Delivery → Orders, Returns, Exchanges active; Transfers → **none** active. |
| **To Location** | Accessible only when Order Type = Transfers. Single code, or a Multiple Locations Selection Window (reachable from the dropdown's "Multiple Locations" entry or the Action button), whose Search button opens a Multiple Selection Lookup Window with Select All. Regional Processing restrictions apply. |
| **Selection Options** | `All Documents` — all tickets including reprints. `New Prints Only` — only tickets not yet printed. `Reprints Only` — only tickets already printed **and flagged for reprint** in Logistical Scheduling. **Note:** the routine only reprints orders that actually changed; an unchanged order does not reprint. |
| **Scheduled Date** | Optional. Restricts to orders scheduled for delivery/pickup/transfer on that date. |
| **Route** | Optional; one or more route codes. Search button → Multiple Route Code Selection window; Action button → Route Code Selection window (single route). **Inactive** if Order Type = Pickup, or if Truck is populated. |
| **Truck** | Optional. Active **only if** all of: the Route Mapping Interface is active on the system; `Mapping Active` is set for the selected location in Warehouse/Store Location Settings; Order Type = Deliveries; and Route is empty. |
| **Print Preview** | Previews the run **without affecting any print flags or merchandise reservations**. Requires Order Type = Deliveries. Uses the same Point of Sale System Control → Printed Documents settings as the real run *except back order quantity*: Suppress Selling Prices and Totals, COD Amount, All Open Order Balances, Partial Order All Open Order Balances, All Receivable Balances, Bar Code Order Number. |
| **Suppress Print** | Skips the physical print but **still updates the ticket print flags** and performs all other updates where applicable: piece assignment, adding items to RF picking, and WMS interface updates for customer pickups. |
| **Update Manifest** | Creates/updates the manifest directly from this process. Active only if enabled by `Manifests - Allow updates from Delivery Ticket Print` or `Manifests - Allow updates from Transfer Ticket Print` on the Logistics tab of Point of Sale Control Settings. **Not** active if Route Map Interface is active on the Inventory & Logistics tab of Warehouse/Store Location Settings for that location. |

After all fields are complete, **Run** generates the tickets and the program **displays the number of tickets printed**.

`Print Preview` and `Suppress Print` are near-opposites and worth encoding as an explicit mode enum rather than two booleans: `PREVIEW` (no flags, no reservations, no print), `SUPPRESSED` (flags + all side effects, no print), `NORMAL` (everything).

## Default sort when neither Route nor Truck is given

The selection process takes all orders and sorts by:

- **truck** — if `Mapping Active` is checked in Warehouse/Store Location Settings **and** Order Type = Deliveries;
- **route** — if Order Type is **not** Deliveries.

## Gating: when a ticket cannot be printed

- **Balance gate.** Tickets cannot print for an order with an open balance exceeding the `Maximum Balance` field in Point of Sale Control Settings **when** `Over Maximum Balance` is set to `Disallow Ticket Print` in the same settings. Both conditions are required.
- **Auth/Capture gate.** If the Auth/Capture feature is in use and a credit card capture cannot be created, printing fails with an error message.
- **Back order ceiling.** The maximum back orders permitted within Enter a Transfer, Enter a Sales Order and Enter a Service Order is **52**. When the back order counter reaches **53**, Print Delivery Tickets raises an error.
- **POS permission.** *Print a delivery ticket within POS entry* must be enabled for tickets to print from this process.

## Finance provider note

If **Synchrony** is the selected finance provider, delivery tickets pull promotional payment plan information from the **last received authorization**. Anywhere the new ERP renders a ticket for a Synchrony-financed order, it needs that authorization record available at print time.

## Entry point from Logistical Scheduling

The Actions menu on the Confirm Schedule tab offers **Print Delivery Tickets** with Shipping Location, Scheduled Date and Route pre-filled — available only when a **single** scheduled date was specified on the Search for Schedules tab. Mirror that: the routine should accept a pre-filled parameter object.
