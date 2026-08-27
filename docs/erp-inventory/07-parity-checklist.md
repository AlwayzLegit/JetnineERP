# Parity checklist

The definition of done. Each item is a test that can be written and run, with the rule ID it enforces. Name the tests after the IDs so a failing test points straight at the source article.

Run each case **twice** — once in STORIS, once in LA Mattress ERP — and diff. Where a case cannot be run in STORIS without side effects, run it in a STORIS test company.

---

## A. Ledger and quantities

| #   | Case                                                                                                                                 | Enforces         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| A1  | Replaying all movements for a product reproduces on hand, reserved, on P/O, as-is, twilight and in-transit exactly                   | cross-cutting §3 |
| A2  | A correction produces a second movement with `reversal_of_id`; no movement row is ever updated                                       | cross-cutting §3 |
| A3  | Kardex signs: `+` additions, `−` deductions, **`0`** for intra-location transfers                                                    | M23              |
| A4  | Row 1 of the Kardex Regular grid is the ending balance, not a transaction                                                            | M24              |
| A5  | Bin-to-bin moves change bin partition but not location totals, and appear in Kardex **only** when `Track Bin to Bin Transfers` is on | §2               |
| A6  | `Available` matches STORIS across a sample including as-is, twilight, floated and RF-picking pieces                                  | Q-I1             |
| A7  | `Net Available` (M1) and `Component Available` (M4) are computed by **different** formulas and are not interchangeable               | M1, M4           |

## B. Guarded transitions

| #   | Case                                                                                                                    | Enforces  |
| --- | ----------------------------------------------------------------------------------------------------------------------- | --------- |
| B1  | A piece reserved to a sales order can be moved bin-to-bin but not warehouse-transferred and not as-is'd                 | §2 inv. 1 |
| B2  | A `REP` piece cannot leave as-is                                                                                        | §4.3      |
| B3  | An "in service" piece cannot be written off until the reason code changes                                               | §4.3      |
| B4  | A `NIL` piece cannot move to a `NIL` location, goes to `RESEARCH`, and is excluded from "all" searches and mass updates | §4.3      |
| B5  | A floated piece cannot be transferred until unloaded via Review Float Status                                            | §4.3      |
| B6  | Bulk products cannot hold as-is status → no RTV, no as-is adjustment tab                                                | §4.3      |
| B7  | An As-Is Restricted reason code requires the logistics permission or a manager override                                 | R-F23     |

## C. Fulfillment scheduling

| #   | Case                                                                                                                                                   | Enforces   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| C1  | `ASAP`/`CWC` → `EST`/`SCH` succeeds; the reverse is rejected                                                                                           | R-F1, §4.1 |
| C2  | Only `SCH` fulfillments are transmitted to a mapping interface and eligible for a manifest                                                             | R-F1       |
| C3  | `Restrict Scheduled Date` is evaluated **location first, then global**, and beyond the limit demands a security override                               | R-F2       |
| C4  | Changing date, `EST`→`SCH`, or route recalculates the delivery charge when enabled                                                                     | R-F3       |
| C5  | `Consolidate Stops` merges same customer + same deliver-to, **except** when `Past Dates` is checked                                                    | R-F4       |
| C6  | Rescheduling onto a date already used by another fulfillment on the same order warns and refuses to combine                                            | R-F5       |
| C7  | A credit-held order shows the hold code in place of status, shows no date, and cannot be scheduled                                                     | R-F6       |
| C8  | Scheduling onto a full route day requires an override and writes a capacity-log row carrying previous/new/max for stops, units, dollars **and** volume | §1.3       |
| C9  | Volume resolves `Volume` → `Capacity Units` → `Default Weight` → 0                                                                                     | R-F31      |

## D. Ticket and pick-list flags

| #   | Case                                                                                                        | Enforces |
| --- | ----------------------------------------------------------------------------------------------------------- | -------- |
| D1  | An update affecting first-date inventory sets first-date line + header flags `P` → `R`                      | R-F24    |
| D2  | If the same update also affects second-date inventory, second-date flags are **cleared**, not set to `R`    | R-F24    |
| D3  | `SCH` → `EST` clears **all** ticket flags on header and lines                                               | R-F25    |
| D4  | Nulling a ticket flag for a date also nulls that date's pick-list flag                                      | R-F26    |
| D5  | Header changes (next delivery date, any deposit, added line) reset header flags to `R` and cascade to lines | R-F27    |
| D6  | Second-date tickets print only under the two documented preconditions                                       | R-F28    |
| D7  | The same rules apply to customer pickup tickets and service work-order tickets                              | R-F30    |

## E. Manifests and completion

| #   | Case                                                                                                                                                                     | Enforces |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| E1  | An order on a manifest is locked to other processes; only contact status and stop time are editable, with permission                                                     | R-F7     |
| E2  | An order released for completion cannot be removed from the manifest                                                                                                     | R-F8     |
| E3  | Removing an order from a **pre-existing** manifest prompts for a reason code once per batch and logs an exception; the prompt does **not** fire during original creation | R-F9     |
| E4  | Adding an order whose date differs prompts to reschedule; for multi-date orders the new date must precede the second date                                                | R-F10    |
| E5  | Manifest `Units` = reserved − hold, excluding linked auto-transfer pieces; a manifested order may legitimately show zero units                                           | R-F11    |
| E6  | Auto transfers are included when `transfer manifest date + configured days <= delivery manifest date`                                                                    | R-F12    |
| E7  | Orders with no reserved merchandise are dropped at completion, left open, and given the exact documented comment string                                                  | R-F17    |
| E8  | In-shop service documents cannot be manifested                                                                                                                           | R-F18    |
| E9  | COG pieces may be manifested but never enter inventory                                                                                                                   | R-F19    |
| E10 | A fully undelivered order forces the not-delivered reason on save and appends it to order comments                                                                       | R-F20    |
| E11 | `Not Completed Location` / `Return Location` / `Transfer Receiving Location` activate by **document type present**, not manifest type                                    | R-F21    |
| E12 | `Release Pieces Not Completed` honours Yes/No/Prompt, and entering an as-is reason auto-checks it                                                                        | R-F22    |
| E13 | Partial completion creates a back order; a Parcel-route partial whose remainder has delivery method `Both` moves to a standard delivery route                            | R-F16    |
| E14 | Every not-delivered item and not-picked-up return writes a `ROUTE.EXCEPTION` row, retained per setting                                                                   | §7       |
| E15 | COD applies to the location bank unless a bank override exists                                                                                                           | §1.3     |
| E16 | Driver/associate data is **not** updated when orders are removed and completed via single-ticket completion                                                              | R-F44    |

## F. Transfers

| #   | Case                                                                                                                                                     | Enforces |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| F1  | Transfer lines reserve **at entry**, not at ship                                                                                                         | §5.1     |
| F2  | `Scheduled Quantity` < ordered pushes the balance to hold: reserved at origin, off the ticket, not moved at completion, transfer stays open              | §5.2     |
| F3  | Complete Transfer moves only non-hold items and closes the transfer to history                                                                           | §5.3     |
| F4  | Receipt is a separate event landing in `Transfer Receiving Location`, via manifest completion (None/Part/All) or RF scan → pending transaction → phantom | §5.4     |
| F5  | A downstream leg can reserve goods that are still in transit (Reserved Linked Transfers)                                                                 | §5.5     |
| F6  | IN PICKING (non-final) → SCHEDULED is allowed and prompts Submit for Re-Pick; IN PICKING (final) and ON MANIFEST are re-schedule-blocked                 | §4.2     |
| F7  | Manifest edits are blocked entirely while pending RF transfer-receiving transactions exist                                                               | §4.2     |
| F8  | Distributed-quantity splits conserve the ordered total                                                                                                   | Q-T2     |
| F9  | Voided/deleted transfers are terminal and cannot be printed                                                                                              | §4.2     |

## G. Physical inventory

| #   | Case                                                                                                                                                    | Enforces |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| G1  | Freeze → count → update → clear is a three-phase batch; `Perform Clear Only` destroys all count data                                                    | §S4      |
| G2  | A count shortage that cannot support an existing reservation raises a **commitment exception** rather than silently dropping the reservation            | §2       |
| G3  | As-is exceptions, exclusions, duplicate scans and the update audit trail all reconcile to the same freeze                                               | Phase 10 |
| G4  | Adjustment history earlier than `last EOM − Inventory Adjust Hold Days` silently returns nothing — and the UI says so rather than showing an empty grid | M68      |

## H. Reports

| #   | Case                                                                                                                                     | Enforces |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| H1  | `M1`–`M28` reproduce exactly against live STORIS output for a sampled product set                                                        | 03a §B   |
| H2  | `M53`–`M83` reproduce exactly for a sampled date range                                                                                   | 03b §B   |
| H3  | `Curr ATP` prints a quantity **only** when the ATP date is today, and only when Net Available > 0                                        | M56      |
| H4  | Required Delivery Quantities excludes returns, the credit half of exchanges, service orders, credit-hold orders, as-is and special-order | M63/M64  |
| H5  | Slotting reports treat a blank filter as "only records missing the attribute" — the inverse of every other report                        | M74/M75  |
| H6  | Duplicate-scan reporting: a set qualifies if **at least one** label is in a selected location, then **all** its scans print              | M79      |
| H7  | Purge eligibility = product type 5 **and** zero reservations, sales orders, POs and on hand                                              | M54      |

---

## Cutover-day reconciliation

Before switching over, run these three side by side and require an exact match:

1. **Value of Inventory** by location, under the valuation basis finance actually uses.
2. **Stock Status** — on hand / reserved / on P/O / available per product per location.
3. **Open fulfillments and open transfers** — count, units and dollars by route and by date.

Any discrepancy is a ledger bug, not a reporting bug. Fix it upstream.
