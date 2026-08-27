# 01 — Domain model

## Vocabulary

| Term | Meaning |
|---|---|
| **Fulfillment** | A scheduled movement of merchandise to a destination: delivery/return, customer pickup, transfer, or service call. An order can have several. |
| **Fulfillment date** | The scheduled (or estimated) date of one fulfillment. STORIS orders order these as *first date*, *second date*, *third date*… |
| **Header** | The order-level record. Carries its own ordered list of fulfillment dates and one ticket flag per date. |
| **Line item** | A merchandise line. Carries its own ordered list of fulfillment dates (a subset of, or overlapping with, the header's) and one ticket flag per date. |
| **Ticket** | The printed delivery / pickup / service work order document for one fulfillment date. |
| **Pick list** | A separate document with its own per-date print flag, coupled to the ticket flag (see rule R7 in `02`). |
| **Manifest** | The dispatch document grouping stops for a route/truck on a date. Ticket print is the first step toward creating one. |

**Important:** a line item's first date is *not* necessarily the header's first date, and a line's second date is not necessarily the header's second date. The two date lists are independent sequences that happen to intersect. Nearly every subtlety in the reprint rules comes from this.

## Ticket flag values

Internally there are three states per (record, date-slot):

| Value | Meaning |
|---|---|
| `null` / blank | No ticket has been printed for this date. |
| `P` | Ticket printed and current. |
| `R` | Ticket printed but the underlying data has changed — reprint required. |

`R` is advisory only. **It does not block further processing of the order.** It is a reminder.

STORIS writes header/line flag pairs as `first:second`, e.g. `P:P`, `R:P`, `R:` — this notation is used throughout `02` and `07`.

### Display mapping (Logistical Scheduling grid, `D` column)

| Internal | Grid shows |
|---|---|
| `P` | `Y` |
| `R` | `R` |
| `null` | blank |

Keep the storage value and the display value distinct in the model. The published docs use `Y` when describing the screen and `P` when describing the rules; they are the same state.

## Suggested storage shape

Stack-agnostic. Whatever the repo already does for ordered child records, follow it.

```
order_header
  id
  fulfillment_status          -- e.g. ESTIMATED | SCHEDULED (see R6)
  ...

order_header_fulfillment      -- one row per header fulfillment date
  header_id
  sequence                    -- 1 = first date, 2 = second date, ...
  fulfillment_date
  ticket_flag                 -- null | 'P' | 'R'
  pick_list_flag              -- null | 'P'   (see R7)
  delivery_status             -- current for seq 1; "future" value for seq >= 2 (see R9)
  route_code                  -- same caveat as delivery_status
  manifest_location           -- optional; takes precedence over fulfillment location

order_line
  id
  header_id
  ...

order_line_fulfillment        -- one row per line fulfillment date
  line_id
  sequence
  fulfillment_date
  quantity_scheduled
  quantity_reserved
  quantity_assigned
  ticket_flag
  pick_list_flag
```

Two properties the schema should make cheap, because the rules query them constantly:

1. **"Which header date slot does this line date map to?"** — join line date → header sequence.
2. **"Which lines are scheduled on header date slot N?"** — the inverse.

## Quantity states referenced by the rules

- **Scheduled** — assigned to a specific fulfillment date.
- **Unscheduled** — on the line but not on any date. A line can be partly scheduled and partly unscheduled.
- **Reserved** — inventory committed to the line.
- **Assigned** — specific pieces (e.g. serial-tracked units) attached. Ticket print is what performs assignment.

Rule R10 in `02` distinguishes *reserved* from *assigned*; do not collapse them.

## Scope note

> The same ticket reprint rules apply to customer pickup tickets and customer service work order tickets.

Model the flag machinery on the fulfillment, not on a delivery-specific type.
