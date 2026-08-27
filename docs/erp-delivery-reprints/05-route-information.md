# 05 — View Route Information

**Menu path:** Logistics > View Route Information. Can also be configured as a **Dynamic Escape** (a jump-to shortcut from other screens).

Evaluates available routes. The Search button activates once criteria are entered.

## Search fields

| Field | Behavior |
|---|---|
| **Zip or Postal Code** | Searches delivery, transfer **and** service routes assigned to that zip/postal code. Narrow with the exclusion checkboxes. |
| **Route Code** | Direct entry, or Search button → Route Code window. |
| **Starting Date** | Mandatory. Defaults to today. Calendar picker. |
| **Ending Date** | Mandatory. Defaults to one month after Starting Date. **Maximum is one year from the current date.** |
| **Exclude Closed Routes** | Omits routes that are closed or over capacity. Defaults unchecked. |
| **Exclude Delivery Routes** | Omits all delivery routes. Defaults unchecked. |
| **Exclude Transfer Routes** | Omits all transfer routes. Defaults unchecked. |
| **Exclude Service Routes** | Omits all service routes. Defaults unchecked. |

**Result-size guard:** if the search would return a significant number of rows (**more than 1,000**), a warning about extended processing time is returned; the user may continue anyway or abort and narrow the criteria. Worth carrying over — implement as a count-first-then-confirm, not a hard cap.

## Results grid

Sorted by Date then Route Code by default; re-sortable by any column. Values come from the **Route Capacity Calendar** for that day; if no calendar entry exists, from the sources named below. **For service routes the Unit columns display as HH:MM (hours and minutes), not counts.**

| Column | Meaning |
|---|---|
| **Date** | The date of the route |
| **Day of Week** | Day on which Date falls |
| **Route Code** | Route code assigned in Logistical Route Settings |
| **Status** | `Open` — capacity available this day · `Full` — has scheduled deliveries but is over capacity · `Closed` — unavailable this day or manually closed, **including days the route does not normally deliver** (a Mon/Tue/Fri route shows Closed on Wed, Thu, Sat, Sun) |
| **Route Type** | Route type of the route code, per Logistical Route Settings |
| **Description** | Route description, per Logistical Route Settings |
| **Maximum / Actual / Open Stops** | Limit for this route type this day (Route Capacity Settings) · currently scheduled · available |
| **Maximum / Actual / Open Volume** | Limit · used · available |
| **Maximum / Actual / Open Units** | Limit (pieces) · currently scheduled · still schedulable |
| **Maximum / Actual / Open Dollars** | Limit · currently scheduled · remaining |
| **Comments** | Comments about the route and/or day |

Double-clicking a row opens **View Detailed Route Information**. Available for all route types.

## Relationship to ticket printing

Route capacity is upstream of the reprint machinery but coupled to it in two places worth remembering while implementing `02`:

1. A **route code change** is one of the named triggers that flags a ticket for reprint.
2. Under rule **R9**, second and subsequent fulfillment dates appear in the route calendar under the order's **second status and second route**, not its current ones. Capacity math for future dates must read the forward-looking fields.
