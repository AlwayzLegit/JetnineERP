# 08 — Transfer Manifests

Three screens: **Schedule and Build a Transfer Manifest**, **Add Individual Transfer**, **Complete the
Transfer Manifest Process**.

A manifest is keyed by **To Location + Route Code (or Truck Number when mapping is active) + Transfer
Delivery Date**. Building against an existing key **appends** to that manifest rather than creating a
new one.

---

## 1. Schedule and Build a Transfer Manifest

Search panel (collapsible) + results grid + manifest header + Build button.

### Search criteria

| Field | Rules |
| --- | --- |
| **Transfer From Location** | Required. Exactly one location. |
| **Transfer To Location** | Required. Exactly one location. |
| **Date Type** | `Today` / `Yesterday` / `Custom Dates`. Today and Yesterday auto-populate and disable Start/End Date; Custom enables them. |
| **Start Date / End Date** | Per above. |
| **Transfer Type** | Multi-select, **at least one required**, all selected by default: Stock, As-Is, Floor Sample, Auto, Move to As-Is, Multi-Leg. |
| **Reserved Status** | Multi-select, at least one required: Fully Reserved, Partially Reserved, **Reserved Linked Transfers** (transfers linked to another transfer on manifest). The third is only searchable when Transfer From Location is set to include transfers in anticipation of receipt of another transfer. |
| **Transfers Linked To** | Multi-select, at least one required, all checked by default: Scheduled Orders, Estimated Orders, ASAP. **Inactive** when the only Final Fulfillment Method options selected are Transfer and/or Not Linked. |
| **Primary Fulfillment Method** | Multi-select, at least one required, all default: Delivery Orders, Customer Pickup, Transfer (stock/as-is/floor sample/move-to-as-is transfers), Not Linked (a standalone single transfer). Prioritizes transfers as they are added to the manifest. |
| **Primary Fulfillment Date (Start/End)** | Use *either* this or Transfer Dates, not both. |
| **Primary Fulfillment Route** | Accepts **both delivery and transfer** route codes; multi-select; blank = all. |
| **Primary Fulfillment Truck** | Multi-select; blank = all. |
| **Include Credit Hold** | Checked: include multi-leg and auto-transfers linked to primary fulfillments on credit hold. Unchecked: exclude them. |
| **Product Category** | Match transfers having **at least one** product in the category; multi-select. |

### Manifest header fields

| Field | Rules |
| --- | --- |
| **Transfer Date**, **Route** | Both required before pieces can be added. When mapping is active at the Transfer From location the Route label becomes **Truck Number**. |
| **Volume**, **Pieces** | Read-only, auto-computed from what is already on the manifest for that date/route. |
| **Load** | 0–99. Prioritizes loading order — lower number loads first. Auto-suggests the next load number when a manifest already exists. |
| **Estimated Total Volume / Pieces** | Two readings: **Selected** (currently checked grid lines) and **Grand Total** (existing manifest + selection). |

#### Load number semantics — important

- Load numbers are assigned **only** by this process. Not by Enter a Transfer, not by the mapping
  interface.
- If a manifest was built here, any transfer added to it by another process reuses the **last load
  number assigned** within that manifest.
- Load numbers are **not sequential** and can be out of sync if a user types a specific number or
  deletes all transfers belonging to one load.

### Results grid

Header checkbox selects/deselects all. Columns:

Transfer Number · Route Code · Truck *(only when mapping is active at the From location)* ·
Customer Name *(store/warehouse name for stock transfers; for linked transfers, the customer on the
final fulfillment)* · Order Date · **View** *(opens Enter a Transfer read-only)* · **Maintain**
*(opens Enter a Transfer editable)* · Transfer Type · Delivery Date · Order Quantity ·
Reserved Quantity · Back Order Quantity · Shipping Volume *(based on total reserved pieces)* ·
Primary Order Fulfillment Method · Primary Order Number · Primary Order Fulfillment Status ·
**Primary Order Credit Hold** *(the code when there is exactly one; an ellipsis when there are several;
blank when not on hold or not linked)* · Primary Order Fulfillment Date · Primary Order Fulfillment
Route · Primary Order Fulfillment Truck · Primary Order Fulfillment Location · Category *(echoes the
searched category even if the transfer has products in other categories)* · **Vendor** *(ellipsis when
the transfer spans multiple vendors)*.

### Options

- **Print Ship Ticket** — checked: selected transfers are passed to the ticket-print process when
  Build Manifest runs.
- **Send to Picking** — checked: selected transfers are sent to picking on Build Manifest. **Defaults
  to checked when RF Barcode is active at the selected location.**

### Build Manifest

1. If no manifest exists for (To Location, Route/Truck, Transfer Delivery Date) → create one and set
   the displayed Load number.
2. If one exists → append the selected lines and set the displayed Load number.
3. Refresh the grid using the previous search criteria; transfers now on the manifest disappear from
   results.

### Exclusions and errors

- **Transfers already submitted to picking do not appear in search results.** They must be added
  manually via Actions → Add Individual Transfer.
- Manually adding a document whose back-order sequence is **53 or higher** produces an error.

### Warnings for linked auto-transfers

When an auto-transfer is on a manifest and its associated sales order is *also* on a manifest, warn the
user if:

- the transfer is removed from the manifest, **or**
- the entire transfer manifest is deleted and there is exactly one associated order on manifest, **or**
- more than one sales order on manifest is associated with any of the deleted transfers.

If the user continues, write to each associated order's comments:

```
Auto-Transfer NNNN which was associated with line NNNN was deleted from the manifest
after this sales order was put on manifest.
```

### Global Actions

- **Add Individual Transfer**
- **Build Manifest** — only available when the grid is populated **and** Transfer Date and
  Route/Truck Number have been entered.

---

## 2. Add Individual Transfer

Modal reached from Schedule and Build a Transfer Manifest → Global Actions.

- Enter a transfer number directly, or use the lookup — which opens **Open Transfer Inquiry (Out)**
  (the View Outbound Transfers inquiry under a different name) to search by product code.
- **Save and Add Another** validates the number and adds it to the manifest grid.

Validation failures (surface the specific reason, not a generic error):

1. The transfer's **From** location does not match the Transfer From Location.
2. The transfer's **To** location does not match the Transfer To Location.
3. The transfer **has no reservations**.
4. The transfer is **already on a manifest**.

---

## 3. Complete the Transfer Manifest Process

The last step, run after the merchandise has physically moved and the driver has returned the manifest
document. It exists to:

- record the actual transfer of the items on the manifest
- record pieces **not** transferred
- change transferred quantities
- reschedule items not transferred for later transfer

### Permission and setting checks

- Requires `complete_merchandise_transfer` and `complete_transfer_from_receiving_location_only`.
- Reads `include_fulfillments_with_reserved_auto_transfers_on_manifest` **[LOC]**. When checked and
  the transfer being completed is linked to an order line whose order is on a manifest:
  - the **manifest** is updated to include the received piece in the unit calculation;
  - the **order** is updated to allow the piece to be completed.
- Blocked entirely while the manifest contains **pending transfer-receiving transactions**.

### Undelivered merchandise with a linked sales order

Warn, with the option to continue. On continue, write an order comment:

```
Auto transfer NNNN which was associated with line NNNN was not received
after this sales order was put on manifest.
```

### Manifest completion exceptions

Any item on a manifest can produce an exception (item not delivered, customer return not picked up,
etc.). When `manifest_exception_retention` is set on the Logistics page of Point of Sale Control
Settings, each exception is written to an exceptions store (STORIS: `ROUTE.EXCEPTION`) available to
the report builder.

### Fields

| Field | Behavior |
| --- | --- |
| **Warehouse** | The location merchandise was transferred **from**. Location list subject to regional processing. |
| **Date** | Scheduled transfer date of the manifest being completed. |
| **Route** | **Mandatory.** Search opens the Route Window. |
| **Type** | Read-only: Delivery / Transfer / Service. |
| **Truck** | **Not available for transfer manifest completions** — third-party mapping is not used with transfer processing. |
| **Carrier** | Read-only shipping/freight company. |
| **COD, Collected, Bank** | Not applicable to transfer manifest completion. |
| **Not Completed Location** | Default storage location for pieces not delivered. Delivery manifest → defaults from Default Storage Locations - Receiving; service manifest → from Default Storage Locations - Service/Repair, falling back to Receiving. Active when the manifest includes a delivery or in-home-service document. |
| **Return Location** | Default storage location for pieces picked up on a return. Defaults from Default Storage Locations - Return Pickup, falling back to Receiving. Active when a return/pickup document is on the manifest. |
| **Transfer Receiving Location** | Default storage location for received pieces. **Hidden when the manifest has multiple 'transfer to' warehouses.** Defaults from Default Storage Locations - Receiving. Active when a transfer document is on the manifest. |
| **Document** | Enter or select a transfer document number → opens **Order Completion Details**, where pieces actually transferred are recorded and un-transferred pieces are rescheduled. |
| **Action** | **Payment is not used** for transfer manifests. **Detail** is auto-selected and Order Completion Details opens. |

> The three location fields are activated by the **document types present on the manifest**, not by the
> manifest's own type. Implement the activation rule on document-type presence.

### Grid

Lists the manifest's documents. Selecting one opens Order Completion Details.

| Column | Notes |
| --- | --- |
| Document | Transfer document ID |
| **Complete** | `All` / `Part` / `None` |
| Customer Name | Account name |
| **Load** | Populated **only** when a load number was assigned via Schedule and Build a Transfer Manifest |
| Document Type | Transfer, in this context |

### Other manifest rules

- **In-Shop service documents cannot be put on a manifest** — nothing is shipped or picked up.
- A **customer's own good (COG)** can be on a manifest, but its pieces are **not put into inventory**;
  the user may enter the new storage location to use when the pieces move to a service location.
- Mixing transfers onto a delivery manifest requires
  `create_a_manifest_with_both_transfers_and_customer_deliveries`.
- Deleting an entire manifest requires `delete_an_entire_manifest` (granted by default).
