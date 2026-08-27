# 03 — Permissions & Security

Three independent mechanisms. Build all three; they compose.

1. **Menu/route security** — can the user reach the screen at all.
2. **Transfer security tables** — which From→To location pairs the user (or their logon location) may
   create transfers for.
3. **Action permissions** ("Logistics Security") — individual capability flags.

Plus a cross-cutting **security override** flow.

---

## 1. Transfer security tables

Two independent tables, both maintained through the same screen shape:

- **By logon location** — reached from the location settings. Key: (`logon_location`, `from`, `to`).
- **By user** — reached from user settings. Key: (`user_id`, `from`, `to`).

Rules:

- Enforced only when `transfers_use_transfer_security_tables` is on **[SYS]**.
- **If the switch is on and no rows exist, nobody can create a transfer.** Ship a guard/warning for
  this; it is a classic lockout.
- A user with `bypass_transfer_security_settings` skips the tables entirely and can also grant an
  override to a restricted user.
- Without permission for a pair, creating the transfer requires a security override from someone who
  has it.
- Duplicate (from, to) rows must not be created — adding an existing pair is a no-op, not an error.
- Bulk maintenance screen (**Maintain Transfer Security for Multiple Locations**) supports selecting
  many logon/from locations × many to locations, previewing the cartesian product in a grid, then
  **Add All** / **Delete All** in one operation, with per-row Remove. When selecting a logon location
  for this process, **all** locations are available regardless of restrictions.

---

## 2. Action permission catalog

These are the Logistics Security flags that touch transfers. Model as named boolean capabilities
resolvable at user **or** group level (group grants apply to all members).

### Directly transfer-related

| Capability | Effect when NOT granted |
| --- | --- |
| `complete_merchandise_transfer` | Cannot complete a transfer or a transfer manifest. |
| `complete_transfer_from_receiving_location_only` | Restricts completion to users logged into the receiving location. |
| `print_transfer_ticket_within_transfer_entry` | Print Transfer Ticket blocked in all transfer-entry variants; blocks completion by extension. |
| `distribute_transfer_quantities_to_multiple_locations` | Cannot create a distributed transfer. |
| `bypass_transfer_security_settings` | Subject to the transfer security tables; also cannot grant overrides for them. |
| `override_distribution_status_only_at_selling_location_for_transfers` | Standard security-override prompt when transferring an "Only at Selling Store" product from a warehouse. |
| `override_transfer_capacity_restrictions` | Cannot schedule transfers on over-capacity days; prompted for another user's credentials. |
| `override_transfer_restriction_of_exceeding_maximum_stock_levels` | Requires an override to exceed max stock level on a transfer. |
| `change_auto_transfer_date_to_be_greater_than_delivery_date` | Cannot push an auto-transfer past the linked order's delivery date. |
| `update_an_order_with_a_linked_auto_transfer_on_a_manifest` | Such orders open **read-only** unless overridden. |
| `create_a_manifest_with_both_transfers_and_customer_deliveries` | Cannot mix transfers onto a delivery manifest. |
| `delete_an_entire_manifest` | Override required. **Granted by default.** |
| `override_capacities_when_scheduling_routes_that_are_full` | Cannot override a full route (volume / dollars / stops / units). |
| `override_capacities_when_scheduling_delivery_routes_that_are_closed` | Cannot override a closed delivery route. |

### Complete-carton overrides — **five separate flags, do not collapse**

| Capability |
| --- |
| `override_complete_carton_requirements_purchase_orders` |
| `override_complete_carton_requirements_store_to_store_transfers` |
| `override_complete_carton_requirements_store_to_warehouse_transfers` |
| `override_complete_carton_requirements_warehouse_to_store_transfers` |
| `override_complete_carton_requirements_warehouse_to_warehouse_transfers` |

The correct flag is chosen by the **location-type pair** of the transfer (store/warehouse × store/warehouse).

### Adjacent capabilities referenced by transfer flows

| Capability | Relevance |
| --- | --- |
| `manually_reserve_stock_merchandise` | Forcing/removing reservations on a line. Override use is written to the audit comments with the granting user's ID. Not consulted by the "reassign a sales reservation" process — that one is menu-secured. |
| `schedule_deliveries_and_pickups_with_unreserved_merchandise` | Applies to linked auto-transfers too. Checked on save in order/exchange entry, and on line update in logistical scheduling. With multiple fulfillments/dates, applies only to the next delivery date. |
| `apply_or_remove_an_as_is_restricted_reason_code_to_inventory` | Assigning/removing "As-Is Restricted" reason codes. |
| `adjust_stock_directly_to_as_is` | As-Is tab of stock adjustment. |
| `set_or_change_as_is_selling_price_within_stock_adjustment_entry` | |
| `transfer_merchandise_within_stock_adjustment_entry` | Location-to-location move inside stock adjustment. |
| `change_floor_tag_print_options` | Includes Print a Transfer Floor Tag. |
| `exit_a_partially_unloaded_float_during_picking` | RF picking; unscanned pieces stay linked to the float. |
| `change_directed_putaway_storage_location` | RF putaway. |
| `create_special_order_products_within_pos_entry` | On-the-fly special-order creation from the transfer Product field. (User/User Group setting, not Logistics Security.) |
| `search_for_vendors_view_vendor_name_and_model_numbers` | Whether vendor model shows in the transfer inquiries. (Extended Security.) |

Extended security must be enabled system-wide (General System Control Settings) for any of these to
apply.

---

## 3. Security override flow

A single reusable component. When an action is attempted without the capability:

1. Show an override prompt (initials/ID + password of an authorized user).
2. Validate that the authorizing user holds the specific capability.
3. On success, perform the action and **record the authorizing user's ID in the audit comment log**.
4. On cancel/failure, block the action and leave state unchanged.

Known override points in this section: transfer security pair not permitted; complete-carton minimum;
"Only at Selling Store" distribution status from a warehouse; route over capacity; route closed;
exceeding maximum stock level; deleting an entire manifest; updating an order with a linked
auto-transfer on a manifest; reserving/unreserving stock; scheduling unreserved merchandise.

**[DECISION]** The source records overrides in audit comments but explicitly notes at least one case
(freight amount override) where "use of this security override is not recorded". Decide whether
LA-Mattress-ERP records *every* override uniformly — recommended — and note the deviation.

---

## 4. Reporting

Provide the equivalent of **Report on User Security**: for a user or group, list every capability and
whether it is granted, including whether it came from the group or the individual.
