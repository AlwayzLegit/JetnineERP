# 11 — Scheduling, Route Capacity & Rescheduling

## 1. Route capacity enforcement during entry

On every line add/change in transfer entry:

1. Recompute the route's usage for the scheduled date.
2. If capacity is exceeded, warn:
   `Route X is full for MM/DD/YYYY. Do you wish to override the capacity limit?`
   - **Yes** → requires `override_capacities_when_scheduling_routes_that_are_full`; without it, prompt
     for an authorized user's credentials.
   - **No** → add the line with status **U (Unscheduled)**.
3. **Only fire the warning when the change increases usage.** A change that reduces usage on an
   already-over-capacity route produces no warning, even though the route is still over.

Capacity dimensions: volume, dollar amount, stops, units. Sources: Route Capacity Settings and Route
Capacity Control Settings. Establishing those settings requires
`establish_route_capacity_control_settings`.

Related permissions: `override_transfer_capacity_restrictions` (transfer route restrictions and
over-capacity days), `override_capacities_when_scheduling_delivery_routes_that_are_closed`.

## 2. Route defaulting

Blank route on a transfer ⇒ assign from the Warehouse Location table, else the ZIP Code table. If
neither has a default, the field may be entered manually or left blank.

If the logistical route settings' **Transfer From** is blank, the delivery-date calendar shows all
dates as available; capacity is checked only after a date is chosen.

## 3. Transfers Eligible for Date Re-Scheduling

**Access:** Logistical Scheduling → Confirm tab → Actions → *Re-schedule Transfers*.

Bulk-move a group of transfers to a new date and/or route/truck.

| Field | Behavior |
| --- | --- |
| **New Date** | Calendar picker. You may assign a date alone, or a date **and** a route. |
| **Transfer From** | Read-only — the originating location from the Search for Schedules tab of Logistical Scheduling. |
| **Assign Route** | Dropdown. You may assign a route alone, or a date and a route. |
| **Assign Truck** | Active **only** when mapping is enabled for Transfers at the From location. |
| **Submit for Re-Pick** | Checked: selected transfers are rescheduled **and** submitted for re-picking. Unchecked: rescheduled only. |

### Eligibility

The grid is populated from the Confirm Schedule tab of Logistical Scheduling, **excluding**:

- transfers currently in picking (**final pick list printed**), and
- transfers **on a manifest**.

A transfer whose **non-final** pick list has been printed, that is not on a manifest, **is** still
eligible — and the routine asks whether to submit it for re-pick.

### Grid columns

Transfer (order number) · Customer Name (transfer-to location description, or the customer of the
order the auto-transfer is linked to) · Date (current scheduled date) · Route · Truck · Transfer To ·
Total Units (sum of ordered quantity) · Total Reserved (sum of reserved quantity) · Volume (total
volume of the reserved quantity).

### Save behavior

1. Check each selected transfer for the boxes ticked in the grid.
2. Verify each can still be moved — **eligibility can change while the screen is open** (another user
   can add the order to a manifest or print a final pick list).
3. Skip any transfer that is no longer eligible and **issue a message stating why**.
4. Change eligible transfers to the new date/route/truck and **remove them from the grid**.
5. Exit returns to the Confirm Schedule tab.

Implement step 2 as a re-validation inside the save transaction, not as a pre-check — this is a
documented race the source explicitly calls out.

## 4. Related date rules

- `change_auto_transfer_date_to_be_greater_than_delivery_date` — without it, an auto-transfer's date
  cannot be pushed past the linked sales order's delivery date (which would land the merchandise after
  the customer's delivery).
- `override_maximum_delivery_date_postponements_for_stores` — continue postponing after auto-release;
  only relevant when the Auto Stock Release feature is active.
- Transit days between two locations come from the per-pair table first (see `01-domain-model.md` §8).
