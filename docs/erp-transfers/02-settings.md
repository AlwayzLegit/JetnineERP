# 02 — Settings & Configuration

Every setting the Transfers section depends on. STORIS splits these across several settings screens;
LA-Mattress-ERP should collapse them into whatever configuration mechanism the repo already uses, but
**keep the scope of each setting** (system-wide vs per-location vs per-product) — the scope is load
bearing, several behaviors differ by it.

Legend: **[SYS]** system-wide · **[LOC]** per warehouse/store location · **[PROD]** per product ·
**[REG]** per region/district

---

## Point of Sale Control Settings **[SYS]**

| Setting | Type | Effect |
| --- | --- | --- |
| `store_to_store_transfers` | bool | When off, a store may not be both the From and the To location on a transfer. |
| `next_pos_service_transaction` | number, nullable | When blank, transfer numbers are **not** auto-assigned — the Transaction Number Entry screen appears. |
| `assign_specific_pieces` | enum | When `Creating Pick List`, a pick list must be generated before a transfer can be completed. |
| `assign_price_on_as_is_items` | rule | Default selling price when pieces become as-is (Move to As-Is). |
| `assign_price_on_floor_sample_items` | rule | Default selling price for floor-sample pieces. |
| `auto_schedule_period_days` | int | Transit days for auto-transfers linked to sales orders/exchanges. Must be **> 0** for an auto-transfer to be created at all. |
| `multi_legged_schedule_period_days` | int | Transit days for multi-leg transfers. |
| `use_stock_location_schema` | bool | Enables the **demand** flavor of multi-leg transfers. |
| `use_distribution_location_schema` | bool | Enables the **logistics** flavor of multi-leg transfers. |
| `manifest_exception_retention` | int (Logistics page) | When set, manifest completion exceptions are retained and reportable. |
| `change_fulfillment_status_to_sch_with_balance_due` | bool | When on, *all* users may schedule unpaid delivery fulfillments and the per-user permission is not consulted. |

## Inventory Control Settings **[SYS]**

| Setting | Effect |
| --- | --- |
| `transfers_use_transfer_security_tables` | Master switch for the transfer security tables. **If on and no tables exist, no user can create any transfer.** |
| `floor_sample_reason_code` | Reason code applied when a floor-sample transfer completes. |
| `include_incoming_po_scheduled_date_days` | When enabled, POs with a delivery date later than (run date + N days) are excluded from quantity-available during auto replenishment. When N = 0, only POs delivering on or before the run date count toward availability at the receiving location. |

## Warehouse/Store Location Settings **[LOC]**

| Setting | Effect |
| --- | --- |
| `as_is_transfer_reason` | When present, defaults into the transfer's Reason Code and makes it read-only. |
| `default_storage_locations.receiving` | Fallback default for not-completed / return / transfer-receiving locations. |
| `default_storage_locations.service_repair` | Default not-completed location for service manifests. |
| `default_storage_locations.return_pickup` | Default return location. |
| `include_fulfillments_with_reserved_auto_transfers_on_manifest` | When checked and a transfer being completed is linked to an order line whose order is on a manifest: the manifest is updated to include the received piece in the unit calculation, **and** the order is updated to allow the piece to be completed. |
| `active_types` (Inventory & Logistics tab) | Whether **mapping** is active for Transfers at this location. Drives Truck vs Route labeling and makes Truck mandatory. |
| `alternate_stock_location` | Secondary stock location used when the default has no stock. Requires default stock location and ship location to be the same. Works for both stores and warehouses. |
| `ignore_stock_schema_at_alternate_location` | Bypasses schema evaluation at the alternate location. |
| `stock_location_schema` | Ordered hierarchy of locations searched for available stock. Can be scoped to Customer Pickup only, Delivery only, or both. |
| `cross_dock_transfer_days`, `cross_dock_order_days` | Enable cross-dock label printing during RF transfer completion. |
| `rf_physical_count_use_storis_label_as_upc` | Gates the "Recount Storage Location" permission's applicability. |
| `automated_and_manual_pos_numbers` | Lets the user choose manual vs auto numbering per document. |
| `inactive_auto_distributed_transfer_calculation` | Overrides a zero-sales store with the average of active locations during distributed-quantity allocation. |

## Advanced Product Settings **[PROD]**

| Setting | Effect |
| --- | --- |
| `logistical_carton_transfers` (Settings page) | Turns on the minimum-carton check. When on, saving a PO or transfer below the minimum carton quantity opens the Confirm Required Carton Quantity screen. |
| `carton_quantity` | The complete-carton requirement. |
| `distribution_status` | Per-product distribution code. Also settable at region/district **[REG]** and warehouse **[LOC]** level. |
| `special_order_info` | Special order detail shown when assigning pieces. |

## Distribution Status Settings **[SYS]**

Defines codes assigned to products. Relevant values referenced by Transfers:

- **Inventory Availability = restricted to selling store** ("Only at Selling Store") → the product
  cannot be transferred without the "Override Distribution Status - Only at Selling Location for
  Transfers" permission. The override applies to transfers originating **from a warehouse**.
- **Inventory Availability = Defective** → product cannot be added to a transfer at all.
- **Available from Multiple Locations** → required for a product to be eligible for demand-based
  multi-leg transfers.

## Reason Code Settings **[SYS]**

- `restrict_as_is_products_from_being_sold` per reason code. Drives the **Saleable** flag shown when
  selecting as-is pieces:
  - setting enabled → Saleable = **No**; the piece may still be added to a transfer.
  - setting not enabled → Saleable = **Yes**; the piece may be added to a sales order.
- `as_is_restricted` designation — applying or removing these codes needs a dedicated permission.

## Special Order Control Settings **[SYS]**

- `automatic_po_creation` — on: auto-create a PO for every non-reserved special-order item. Off:
  prompt the user per item.

## Third Party Logistics Settings **[SYS]**

- `estimated_arrival_status_code` — an inbound EDI 214 line status matching this code generates the
  audit comment described in `01-domain-model.md` §9.

## Bar Code Control Settings **[SYS]**

- `allow_over_receiving` — governs RF users' ability to over-receive (the per-user Logistics Security
  setting does **not** apply to RF users).

## Phantom Process Settings **[SYS]**

- RF Transfer Receiving Phantom registration, administration, and status. See `09-receiving.md`.

## Scheduled processes

| Process | What it does |
| --- | --- |
| `Manage Transfer of Merchandise` | Reviews the stock location schema of all open orders and the efficiency of product assignment; manages DC→DC and DC→store transfers. Does **not** apply to alternate stock locations. |
| `Scheduled Settings Update` | Refreshes product distribution status from Advanced Product Settings. |
| Day-Ending (EOD) | Runs Automatic Stock Replenishment across **all** locations. |
| End-of-Month (EOM) | Rebuilds the Group Sales file (12-month rolling written sales by store × product group). |

---

## Regional Processing

Regional processing restrictions filter the **list of locations a user can see** at every location
field, and the output of most transfer inquiries and reports. Two deliberate exceptions found in the
source:

- **One-Time-Buy Processing is not affected by regional processing.**
- Maintain Distribution Location Schema and Maintain Transfer Schedule Period Days **do not enforce**
  location restrictions.

Implement location filtering as a single reusable scope so these exceptions are explicit opt-outs
rather than forgotten checks.
