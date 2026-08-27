# 08 — Inventory Transfers

_Source: J1–J5, B1_

Two fundamentally different transfer mechanisms with different accounting timing. Both are required —
they are not alternatives to pick between.

---

### `XFR-010` Two transfer mechanisms — the timing difference is the point

_Source: J1_

|                   | **Paperless (stock adjustment)**                  | **Documented (transfer entry)**                |
| ----------------- | ------------------------------------------------- | ---------------------------------------------- |
| Entry             | `STK-010` → Transfer tab                          | Enter a Transfer (Warehouse Transfer Creation) |
| Inventory posting | **Immediately** on save                           | **Only on completion**                         |
| In-transit state  | None                                              | Yes — goods sit in transit                     |
| Paper trail       | None                                              | Transfer ticket, acknowledgement, manifest     |
| Use for           | Same-building corrections, bin moves, quick fixes | Real movement between locations                |

Both write ledger rows; the documented flow writes `TRANSFER_OUT` + `TRANSFER_IN_TRANSIT` at release and
`TRANSFER_IN` at completion, so in-transit inventory is always visible and valued.

### `XFR-011` Paperless transfer via stock adjustment

_Source: J1_

In `STK-010`, after entering product information, a **Transfer** tab captures the transfer detail
(receiving location, quantity, storage location). On save, inventory values post immediately at both ends.

Specific-piece selection (`XFR-040`): after entering **Transfer Quantity** and **Receiving Location** and
clicking save, a window opens with a **Serial/Reference Number** field carrying a search button and
selection/inquiry screens to pick the exact piece.

### `XFR-012` Documented transfer — full lifecycle

_Source: J1_

```
CREATED → PRINTED → ACKNOWLEDGED → (IN_TRANSIT) → COMPLETED
```

1. **Create** the transfer in Enter a Transfer (Warehouse Transfer Creation). On creation, offer to print.
2. **Print** the transfer ticket via **Print all Delivery Tickets** or **Print a Delivery/Pick-Up/Transfer
   Ticket**.
3. **Acknowledge** — individually, or in bulk by building a **Transfer Manifest** and acknowledging the
   manifest.
4. **Complete** — either the **Complete Transfer** option on the transfer document, or, for manifests,
   **Complete the Manifest Process** (Transfer Manifest Completion).

Inventory values post **only at completion**.

### `XFR-020` Transfer manifests

Group many transfers onto one manifest for acknowledgement and completion. Manifest carries route/driver/
vehicle, ship date, and status. Completing a manifest completes all its transfers atomically; a partial
completion path must exist for short/damaged loads and must leave the shortfall in transit with an exception.

Manifested pieces are excluded from the receiving **Available** column (`RCV-031`) — the two features are
coupled; test them together.

### `XFR-030` Transfer type: Floor Sample ("nailing down" a floor sample)

_Source: J2, B1_

The `Type` field on Enter a Transfer offers **Floor Sample**. Selecting it transfers the piece **and** sets
its status to floor sample (`STK-020`), removing it from net available (`STK-050`). This is one of the five
as-is/floor-sample entry points in `STK-021`.

### `XFR-040` Specific-piece selection on transfers

_Source: J3_

Two paths, both required:

- **Stock adjustment transfer:** serial/reference window after entering transfer quantity and receiving
  location, with search/inquiry selection (see `XFR-011`).
- **Transfer completion:** at individual completion **or** manifest completion, the user may select a line
  and update the **location / reference number** of the piece actually being transferred. This matters —
  the piece picked in the warehouse is often not the piece the system guessed.

### `XFR-050` Multi-leg transfers via Ship Via

_Source: J1, NOTE_

A transfer may route through intermediate **Ship Via** / distribution locations between the from-location
and the to-location, creating a **multi-legged transfer** — a chain of legs, each with its own
acknowledgement and completion, with inventory sitting at each intermediate location in turn.

**`Ship Direct` option** in Enter a Transfer bypasses multi-leg creation and moves the goods directly.

Requirements: model legs explicitly (ordered leg records under a parent transfer), show the full route on the
document, and make the current leg obvious. Determine legs from the location routing configuration, and
`[DECISION NEEDED]` confirm LA Mattress's hub/spoke routing before building the leg-derivation rules.

### `XFR-060` Inter-regional transfers

Referenced by the auto-transfer answer. Transfers crossing region boundaries may carry additional
approval, costing, or routing rules. `[DECISION NEEDED]` — fetch the STORIS "Inter-Regional Transfers"
topic and extend before building; do not guess.

---

## Auto transfers

### `XFR-051` What triggers an auto transfer

_Source: J4_

An **auto transfer** is generated **automatically** when a sales order is entered with merchandise line
items whose **stocking location does not match** the order's _deliver-from_ or _pick-up_ location.

Key behaviors:

- The system **generates** the transfer automatically, but a user must **manually process and release** it
  for completion. It is not a hands-off movement.
- Identified by `Transfer Type` on the transfer entry screen.
- Inquiry/view screens show these as order **Type = TRN**.

### `XFR-052` Auto transfers are gated by Auto Schedule Days

_Source: J4, NOTE_

The `Auto Schedule Days` field on the **Inventory** tab of **Point of Sale Control Settings**
(`CFG-POS-AUTOSCHED`) controls the feature:

- Field contains a number → auto transfers are generated.
- Field is **blank** → auto transfers are **not** created at all.

Treat blank and zero as distinct: blank disables the feature; zero means same-day + 1 per the formula below.

### `XFR-053` Auto transfer schedule date — **exact formula**

_Source: J5_

```
transfer_date = Auto Schedule Days + today + 1
```

Then adjust for location availability:

The system checks **Automatic Replenishment Days** in **Warehouse/Store Location Settings**
(`CFG-LOC-REPLDAYS`) — the set of weekdays on which that location accepts auto stock transfers. If the
calculated `transfer_date` falls on a day **not** checked, the transfer is scheduled for the **next
available day**.

Worked example from the source, which must be a test case verbatim:

> Transfer created 4/6, `Auto Schedule Days` = 2 → calculated date Thursday 4/9. The destination location's
> `Automatic Replenishment Days` permits auto stock transfer generation only on **Tuesdays**. Therefore the
> transfer is scheduled for the following **Tuesday, 4/14**.

Edge cases to define and test: no days checked at all (must not loop forever — fail with a clear error);
holidays/blackout dates `[DECISION NEEDED]`; which end's replenishment days govern (the source implies the
receiving location — confirm).

### `XFR-054` Auto transfer processing queue

Because auto transfers require manual release, build a work queue: filter by from/to location, scheduled
date, age, and linked sales order. Show the customer commitment date alongside, so a transfer that will miss
its delivery date is visible. Bulk release supported.
