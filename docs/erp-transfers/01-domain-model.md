# 01 — Domain Model

Stack-agnostic. Field names are descriptive; match them to repo conventions (snake_case vs camelCase,
`_id` suffixes, etc.) before writing migrations.

---

## 1. Transfer (header)

The transfer document. One From location, one To location, one scheduled movement.

| Field | Type | Notes |
| --- | --- | --- |
| `transfer_number` | string, unique | Auto-assigned when auto-numbering is on. When the "next transaction number" setting is blank, the user assigns it manually via the Transaction Number Entry screen. Must also support locations configured for "automated & manual" numbering, where the user chooses per document. |
| `transaction_date` | date | Date of the transfer *transaction* (not the movement). Defaults to today. On the type-locked entry variants (As-Is / Floor Sample / Stock / Move to As-Is), **future dates are rejected**. |
| `type` | enum | `stock`, `as_is`, `floor_sample`, `auto`, `move_to_as_is`. Plus derived flag `multi_leg`. See §4. |
| `as_is_reason_code_id` | fk, nullable | Required when `type = move_to_as_is`. Defaults from the location's "As-Is Transfer Reason" setting and is then **read-only**. |
| `from_location_id` | fk | Store or warehouse. Filtered by regional processing + user location restrictions. |
| `to_location_id` | fk | Same filtering. |
| `status` | enum | `open`, `completed`, `voided`. Completed transfers move to history and are no longer editable through entry. |
| `scheduled_date` | date | Date the movement should occur. Future dates allowed. Validated against route capacity. |
| `route_id` | fk, nullable | Defaults from the location's route or the ZIP-code route table; may be entered manually. |
| `truck_id` | fk, nullable | Only when mapping is active for transfers at the From location. |
| `load_number` | int 0–99, nullable | Assigned **only** by the Schedule-and-Build-a-Manifest process. |
| `instructions` | text, unlimited | "Instructions for this Fulfillment Only". Prints on the transfer document and pack list. |
| `ship_direct` | bool | When true, ship From → To directly on save. When false, the system looks for a distribution location schema between From and To and auto-creates the additional legs. |
| `distribute_quantities` | bool | Only settable when multiple To locations are chosen and **all are stores**. Triggers distributed-quantity logic. |
| `total_volume` | decimal, derived | Sum of reserved-piece volume. |
| `print_transfer_ticket` | bool | Gate for completion; see §5 state machine. |
| `back_order_sequence` | int | 0–52. See §6. |
| `manifest_id` | fk, nullable | Set when placed on a manifest. |
| `pick_status` | enum | `none`, `submitted`, `pick_printed`, `final_pick_printed`. Drives reschedule eligibility. |
| `linked_primary_document_id` | fk, nullable | Sales order / exchange (auto-transfer) or originating transfer (multi-leg). |
| `created_by`, `updated_by`, timestamps | | |

**Derived / computed on the header**

- `total_units` — sum of line ordered quantity.
- `total_reserved` — sum of line reserved quantity.
- `estimated_volume`, `estimated_pieces` — used by manifest building.

---

## 2. TransferLine

| Field | Type | Notes |
| --- | --- | --- |
| `transfer_id` | fk | |
| `line_number` | int | Referenced by comments and by manifest exception messages. |
| `product_id` | fk | Products whose distribution status maps to inventory-availability `defective` **cannot** be added. |
| `brand` | derived from product | |
| `serial_reference_number` | string, nullable | Mandatory for As-Is transfers — identifies the specific existing as-is piece. Presence depends on serial-tracking settings. |
| `quantity_to_transfer` | int | Defaults to 1 on the type-locked variants. |
| `available_quantity` | int, derived | Quantity available at the From location. |
| `scheduled_quantity` | int | If less than ordered, the balance goes to **Hold** status (reserved to the transfer but not printed on the ticket). |
| `storage_location_id` | fk, nullable | Source storage location within the From location. |
| `line_type` | enum | Mirrors transfer type per line: `stock`, `as_is`, `floor_sample`, `auto`. |
| `purchase_order_id` | fk, nullable | For special-order / PO-linked lines. |
| `status_flags` | set | See §3. |
| `kit_master_line_id` | fk, nullable | Hard kits show the master line **and** each component line in the grid. |
| `special_order_detail_id` | fk, nullable | See §7. |

---

## 3. Line status flag catalog

Displayed as single characters in the entry grid. Model as a set, not a single enum — a line can be
several of these.

| Code | Meaning |
| --- | --- |
| `A` | As-Is |
| `C` | Linked to a COM (customer order/merchandise link) |
| `H` | Line on hold (scheduled qty < ordered qty) |
| `P` | Linked to a purchase order |
| `S` | Linked to an open service order |
| `T` | Line to be filled by a multi-leg transfer |
| `U` | Unscheduled (added while route was over capacity and the override was declined) |
| `W` | Linked warranty |
| `X` | This is a multi-leg transfer filling another transfer |

`T` and `X` are the two halves of a multi-leg link — `T` on the consuming line, `X` on the supplying
transfer. Keep them consistent in one place.

---

## 4. Transfer type semantics

| Type | Source inventory | Effect on completion | Notes |
| --- | --- | --- | --- |
| `stock` | Saleable | Pieces move location, stay saleable | Store↔store only allowed when the "Store to Store Transfers" setting is on. |
| `as_is` | Existing as-is inventory | As-is piece moves location, stays as-is | Requires a specific piece (serial/reference). |
| `floor_sample` | Saleable at a warehouse | On completion the piece becomes as-is with the configured floor-sample reason code | Writes an **initial non-saleable inventory activity audit** on completion. Consults the "Assign Price on Floor Sample Items" setting for default selling price. |
| `move_to_as_is` | Saleable | On completion pieces become as-is with the entered reason code | Reason code mandatory. As-is piece selection is **not** available for this type. Consults "Assign Price on As-Is Items" and "Assign Price on Floor Sample Items". |
| `auto` | Saleable | Same as stock | Created by sales-order/exchange line entry, not by a human. Editable through the transfer entry screen. |
| multi-leg (`demand` / `logistics` flavor) | — | — | A chain of transfers; see `07-multi-leg-transfers.md`. Surfaced as a distinct filter value ("Multi-Leg") in manifest search. |

Re-print inventory labels for any piece moved into or out of as-is status — cycle counting depends on
label accuracy.

---

## 5. Transfer lifecycle state machine

```
                 ┌──────────────────────────────────────────────┐
                 │                                              │
   create ──▶ OPEN ──▶ (optional) PICK LIST ──▶ ON MANIFEST ──▶ COMPLETED ──▶ HISTORY
                 │            │                      │
                 │            │                      └─▶ REMOVED FROM MANIFEST ──▶ OPEN
                 │            └─▶ FINAL PICK PRINTED  (blocks reschedule)
                 └─▶ VOIDED / DELETED
```

Transition rules gathered from the source:

- **Complete Transfer** checkbox is inactive until *all* pre-conditions are met, including that
  **Print Transfer Ticket has been checked**.
- If the "Assign Specific Pieces" setting is `Creating Pick List`, a pick list must be generated
  before completion.
- Completion is gated by permissions `complete_merchandise_transfer` and
  `complete_transfer_from_receiving_location_only`.
- Completion is blocked while any **pending transfer-receiving transactions** exist for the transfer.
- Completion is blocked once `back_order_sequence` reaches 52.
- Once completed: closed, moved to history, **not** reachable through the entry screen. All
  corrections must happen before completion.
- Voided/deleted transfers cannot be printed.
- On manifest **or** final-pick-printed ⇒ not eligible for date rescheduling.

---

## 6. Back-order / partial-invoice sequence

- Maximum **52** partial back orders per transfer (also per sales order and service order).
- Each partial carries a suffix letter appended to the root invoice: `A`–`Z` then `a`–`z`.
- Warn the user at the **48th** and at the **52nd**.
- Anything past 52 must be deleted and re-entered.
- Manifest build must reject a manually added document number whose sequence is 53 or higher.

Implement as a monotonic per-document counter plus a suffix encoder; do not derive the letter from
a count in two places.

---

## 7. Special order products on transfers

- Special-order products may be added to transfers; POs may be created for them.
- On-the-fly creation of a special-order product from the transfer's Product field requires the
  "Create special order products within POS entry" permission. Without it, existing special-order
  products can still be added.
- If **Automatic PO Creation** is on in Special Order Control Settings, a PO is created for each
  non-reserved special-order item automatically. If off, the user is prompted per item to create a PO
  or substitute another product.
- Editing `quantity_to_transfer` on a special-order line that is linked to a PO **must propagate the
  quantity change to the PO**.

**Special Order Inventory Assignment** (assigning a specific piece to a special-order line):

- Assign serial numbers **one at a time** so fabric/special-order detail can be matched per piece.
- Only pieces with status `Unassigned` are selectable.
- Grid columns: Serial/Reference, Status (`As Is` / `Assigned` / `Unassigned`), Special Order Detail
  Information (from the product's advanced settings), Storage Location, Order Item, Inventory Age.

---

## 8. Supporting reference tables

| Table | Purpose | Source article |
| --- | --- | --- |
| `distribution_location_schema` | From → Via1..Via4 → To routing path for multi-leg | Maintain Distribution Location Schema |
| `transfer_schedule_period_days` | Transit days between a location pair (1–99) | Maintain Transfer Schedule Period Days |
| `transfer_security` | Allowed From/To pairs per logon location and per user | Create a User Actions - Transfer Security |
| `distribution_status` | Per-product availability rules (incl. "Only at Selling Store", "Available from Multiple Locations", "Defective") | Distribution Status Settings |
| `stock_location_schema` | Ordered list of locations searched for stock | Warehouse/Store Location Settings |
| `group_sales` | 12-month rolling sales by store × product group, refreshed at month end | Distributed-Quantity Transfers |
| `route`, `route_capacity` | Route codes, capacity limits (volume, dollars, stops, units) | Route Capacity Settings |
| `manifest`, `manifest_line` | Truck loads | Schedule and Build a Transfer Manifest |
| `route_exception` | Manifest completion exceptions | Complete the Transfer Manifest Process |
| `transfer_receiving_pending` | Scanned-but-unprocessed receiving transactions | Review RF Transfer Receiving Phantom |

### `distribution_location_schema` constraints

- Unique on (`from_location`, `to_location`).
- At least one Via location required; up to four, filled in order (Via1 before Via2, etc.).
- No Via may equal the From or the To location.
- No Via may be duplicated within a row.
- **Location access restrictions are deliberately NOT enforced** in this maintenance screen — any
  valid location may be entered.

### `transfer_schedule_period_days` constraints

- Unique on (`from_location`, `to_location`); value 1–99.
- Takes precedence over the global "Schedule Period Days" control settings.
- On save, prompt the user: "also create the inverse pair (To → From) with the same days?" — yes
  creates/updates the mirror row, no leaves it alone.
- Location access restrictions are **not** enforced here either.

### Transit-day resolution order

```
1. transfer_schedule_period_days[from, to]
2. else if auto-transfer linked to an order/exchange → control setting "Auto Schedule Period Days"
3. else if multi-leg                                 → control setting "Multi-Legged Schedule Period Days"
```

---

## 9. Audit & comments

- **Order/transfer comments** (header level) and **line item comments** are separate. RF receiving
  displays the concatenation, header comments first, truncated to the first 20 characters.
- The audit comment log is a first-class, append-only record. Known system-written entries:
  - `"Auto transfer NNNN which was associated with line NNNN was not received after this sales order was put on manifest."`
  - `"Auto-Transfer NNNN which was associated with line NNNN was deleted from the manifest after this sales order was put on manifest."`
  - Build-from-storage-location writes a comment per product code and quantity added.
  - Reservation exception overrides record the **overriding user's ID**.
- Third-party-logistics EDI 214 messages whose line status code matches the configured "estimated
  arrival" status generate audit comments carrying Estimated Arrival Date, Estimated Start/End Arrival
  Time, and Estimated Arrival Description.

Model the audit log as `document_id + line_number(nullable) + source(system|user) + body + actor + timestamp`.
