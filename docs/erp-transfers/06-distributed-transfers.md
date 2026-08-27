# 06 — Distributed Transfers, Distributed-Quantity Transfers & One-Time-Buy

Three related features:

- **Distributed transfer** — same quantity fanned out to a list of locations.
- **Distributed-quantity transfer** — quantity *allocated* across stores by sales history. Used for
  one-time-buy products.
- **One-Time-Buy Processing** — the purchasing side that feeds distributed-quantity transfers.

---

## 1. Distributed transfers (even fan-out)

**Setup.** Distribution lists are named lists of locations, any mix of stores and warehouses, any
count. Created/selected from the **List Entry Window**, reached from the Action button on the To field
during transfer entry.

**Behavior on save.** For each location on the list, create a transfer — **except the first location
on the list, which keeps the original transfer document**. Every generated transfer gets the **same
quantity** as the original.

- Quantities can only be edited afterwards by opening each individual transfer.
- Creating one requires `distribute_transfer_quantities_to_multiple_locations`.
- Resulting transfers are discoverable via the **View Outbound Transfers** inquiry.

```
distribute_even(original_transfer, location_list):
    assert user.can('distribute_transfer_quantities_to_multiple_locations')
    first, *rest = location_list
    original_transfer.to_location = first          # original is reused, not cloned
    for loc in rest:
        clone = copy_of(original_transfer)         # same lines, same quantities
        clone.to_location = loc
        clone.transfer_number = next_number()
        save(clone)
    save(original_transfer)
```

---

## 2. Distributed-quantity transfers (sales-history allocation)

Identical to distributed transfers **except**:

- Default quantities are **system-generated** from prior written sales.
- Every transfer-to location must be a **store** (no warehouses).
- Every product on the transfer must be a **one-time-buy product**.

### Data source: the Group Sales file

- Rebuilt during **End-of-Month** processing.
- Contains **written sales over the previous 12 months**, aggregated by **store × product group**.
- Allocation looks at the whole **product group**, not the individual product.

### Allocation algorithm

```
allocate(line, distribution_stores, total_quantity):
    group = product_group_of(line.product)

    sales = { store: group_sales(store, group, months=12) for store in distribution_stores }
    # NOTE: only the stores on the distribution list participate; all other
    #       stores are excluded from the denominator entirely.

    if all(v == 0 for v in sales.values()):
        return split_evenly(total_quantity, distribution_stores)

    for store in distribution_stores:
        if sales[store] == 0 and setting.inactive_auto_distributed_transfer_calculation:
            sales[store] = average(v for v in sales.values() if v > 0)
        # otherwise a zero-sales store receives NOTHING

    total_sales = sum(sales.values())
    for store in distribution_stores:
        pct   = sales[store] / total_sales
        raw   = total_quantity * pct
        qty[store] = round_half_up(raw)          # 1.5 -> 2, 7.5 -> 8

    return qty
```

### Worked example (from the source docs — use as a fixture)

5 stores A–E. 15 units of Product Z received. Product Z is in Product Group 1 alongside X and Y.
Distribution list = A, B, C only (D and E excluded from the calculation).

| Store | Group 1 units sold (12 mo) | Share | Raw allocation | Final |
| --- | --- | --- | --- | --- |
| A | 10 | 10% | 1.5 | **1** |
| B | 50 | 50% | 7.5 | **8** |
| C | 40 | 40% | 6.0 | **6** |
| | 100 | | | 15 |

> The source states the rounding rule as "1.5 rounds to 2, 7.5 rounds to 8" and then lists the final
> result as **A = 1, B = 8, C = 6**. Applying naive half-up to every store would give 2 + 8 + 6 = 16,
> one more than the 15 units available. The published result is consistent with **round half up, then
> reconcile the total back to the available quantity by trimming the smallest allocation**.
>
> **[DECISION]** Confirm the reconciliation rule before coding. Recommended: round half up per store,
> then adjust the largest-remainder (or smallest-allocation) store so the allocations sum exactly to
> the distributed quantity. Whatever is chosen, assert `sum(qty) == total_quantity` in a test using
> this exact fixture.

### Edge cases

| Case | Behavior |
| --- | --- |
| End-of-Month never run (new install) | Group Sales file empty ⇒ no statistics ⇒ treat as all-zero. |
| All stores on the list have 0.0 sales | Allocate **evenly**, same as a regular distributed transfer. |
| One store has $0.00 sales in 12 months | It gets **nothing** — unless `inactive_auto_distributed_transfer_calculation` is on at the location, in which case substitute the average of all active locations. |
| Fractional results | Round; see the decision above. |

### Document creation

Same as distributed transfers: one transfer per allocated store, with the **first store on the list
retaining the original transfer document**. Viewable via View Outbound Transfers.

---

## 3. Transfer Distribution Quantity screen

Opened by checking **Distribute Quantities** on the General tab, or via General tab → Actions →
**Distribute Quantity Type**.

Choose the source of the quantity to distribute:

| Option | Behavior |
| --- | --- |
| **Total Available** | Distribute some or all of the one-time-buy product's quantity available for transfer at the From location. When a product is chosen on the Merchandise tab, the available quantity populates the **Distribution Quantity** field. Both Distribution Quantity and Quantity to Transfer are editable. |
| **Received on Purchase Order** | Distribute some or all of the **received** items on a selected one-time-buy PO. Activates the Purchase Order field. Creates one transfer line per product that had items received into inventory. |

**Purchase Order field** (active only for the second option):

- Search menu: *View Purchase Orders for a Specific Product*, *View Purchase Orders for a Specific Vendor*.
- The PO **must be a one-time-buy PO** and **must be at least partially received**.
- On selection, the system finds the first PO line with received quantity and populates the
  Merchandise tab, including Distribution Quantity and Quantity to Transfer.
- User edits (if any), clicks **Add**; the next line populates. Repeat until all lines with available
  quantity are processed, then **Save**.

---

## 4. One-Time-Buy Processing

- A one-time-buy PO accepts **only** one-time-buy products. If a non-one-time-buy product is entered
  first, one-time-buy products can no longer be added to that PO. (Enforce as a header-level product
  class lock set by the first line.)
- On receipt of a one-time-buy PO, send a notification email to a configured employee list.
  (STORIS Messenger → map to the repo's notification mechanism.)
- **Regional Processing does not affect One-Time-Buy Processing.**
- Stores selling the most in the product's group receive the larger share of the distribution.
