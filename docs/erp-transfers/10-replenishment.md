# 10 — Automatic Stock Replenishment

Source: *Replenish Assigned Stock Levels*.

Generates transfers to bring locations back to their assigned stock levels.

## Two entry points, one engine

| Trigger | Location scope |
| --- | --- |
| **Day-Ending (EOD)** batch, when the Automatic Stock Replenishment feature is active | **All** locations |
| **Replenish Assigned Stock Levels** screen, on demand, any time | Only the locations the user selects |

Build this as a **single service** taking a location set, with the EOD job passing "all". The source
is explicit that these are the same process differing only in scope — do not fork the logic.

## Screen

| Field | Behavior |
| --- | --- |
| **Location** | Enter a location code, or use Search to pick **one or more**. |
| **Grid** | Selected locations. Double-click a row to select it, then **Remove** to delete the line. |
| **Run** | Starts the replenishment process in *on-demand* mode. |

## Availability calculation

Governed by `include_incoming_po_scheduled_date_days` in Inventory Control Settings:

- **Enabled with N days** — purchase orders whose delivery date is later than `run_date + N` are
  **excluded** from quantity available.
- **N = 0** — only POs delivering **on or before the run date** count toward quantity available at the
  receiving location.

Applies identically whether run from EOD or on demand.

```
quantity_available(location, product, run_date):
    on_hand = inventory_on_hand(location, product)
    if setting.include_incoming_po_scheduled_date_days is enabled:
        cutoff = run_date + setting.days          # days may be 0
        incoming = sum(po_line.open_qty
                       for po_line in open_po_lines(location, product)
                       if po_line.delivery_date <= cutoff)
    else:
        incoming = sum(po_line.open_qty for po_line in open_po_lines(location, product))
    return on_hand + incoming - committed(location, product)
```

## Output

Transfers generated against user-defined stock level settings. These are ordinary transfers from that
point on — they flow through manifesting, picking, and receiving like any other.

**[DECISION]** The source article does not spell out the stock-level model itself (min/max, assigned
level, source-location selection). Confirm against the Inventory / PO Replenishment docs already
dissected for this repo, and reuse that model rather than inventing a second one here.

## Related

- **Product Quantity in Excess of Transfer Quantity** (`04-transfer-entry.md`) surfaces when generated
  quantities exceed the maximum transfer quantity.
- Exceeding maximum stock levels on a transfer requires
  `override_transfer_restriction_of_exceeding_maximum_stock_levels`.
