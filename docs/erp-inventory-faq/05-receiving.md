# 05 — Purchase Order Receiving

---

## Core receiving

### `RCV-010` Receive a Purchase Order

Header: receipt date, `Type of Activity` (see `RCV-020`), PO number, optional reference number,
receiving location, `Supply Default Quantities` toggle, user. Grid per PO line: ordered, previously
received, **available** (`RCV-031`), receiving now, credit, unit cost, extended cost, storage location
(when location tracking is on — `LOC-021`), serial/reference (when serialized — `STK-070`).

Posting writes `RECEIPT` ledger rows (`LEDGER-001`), updates QOH, applies landed cost factors
(`COST-030`) **unless** in itemized-container mode (`COST-033`), raises cost exceptions where warranted
(`COST-040`), reserves against linked sales order lines (`PO-042`), and creates the AP payable transaction.
Subject to `CFG-POS-QTYERR` (`STK-100`) and `SEC-COST-VIEW` (cost columns hidden when denied).

### `RCV-011` Receive without a Purchase Order

_Source: E2, H1_

Non-PO receipt keyed by **reference number + vendor number**. Same posting behavior as `RCV-010`.
Critically, it is also the **correction path** for non-PO receipts: entering a **negative quantity** against
the original reference number and vendor reverses an over-receipt (`RCV-033`) or performs an un-receive for
RTV (`RTV-013`).

### `RCV-020` Type of Activity

Enum on the receiving header, at minimum: `RECEIVE_FROM_PO`, `REVERSE_A_RECEIVING_ERROR`,
`RECEIVE_WITHOUT_PO`, `CREDIT_RECEIVING`. The selected type governs which columns are editable and the sign
of the resulting ledger rows.

---

## Reversal and correction

### `RCV-030` Reverse a Receiving Error ("un-receive")

_Source: B11, D9, E2, H1_

The central correction routine. Behavior:

- Select `Reverse a Receiving Error`, enter the PO (and optional reference number). Lines load into the grid.
- The user enters a **positive** number in the **Credit** column representing how much to reverse;
  **the system applies the negative sign**. Replicate this exactly — entering a negative there must be
  rejected with a clear message, because double-negation is the classic user error here.
- Reversal is capped by the **Available** column (`RCV-031`).
- **Payable transactions are affected.** Therefore this method is valid **only when the receipt has not been
  paid.** The routine must check AP status per line and block (with the invoice reference shown) when the
  line has been billed/paid, directing the user to `RCV-033` instead.

Writes `RECEIPT_REVERSAL` ledger rows with `reversal_of` pointing at the original receipt rows.

### `RCV-031` The Available column — exact definition

_Source: D9, NOTE_

`Available` = quantity received that is still freely reversible. It **excludes** pieces that:

- appear on a **pick list**,
- appear on a **manifest**,
- have been **completed** (delivered/sold/relieved).

It should also exclude pieces already reserved to sales orders until that reservation is removed (`E2`
requires removing reservations in sales order entry first). Surface the exclusion reason per line in the
grid — "3 on manifest M-1042, 1 completed" — so the user knows what to go clear.

### `RCV-032` Over-receipt correction — unsold, unpaid, unreserved

_Source: E2_

Preconditions: merchandise not sold, not paid for, not reserved. If reserved, the user must first remove
the reservation in sales order entry — link to it from the block message.

Steps: Receiving → receipt date → `Reverse a Receiving Error` → choose `Supply Default Quantities` →
enter PO and optional reference → enter the **reduction quantity as a positive number** in the grid → save.
Payables are adjusted.

### `RCV-033` Over-receipt correction — vendor already paid

_Source: B11, E2_

When the vendor has been paid, **do not** reverse the receipt (that would corrupt the settled payable).
Instead:

1. Leave the over-receipt in place.
2. Use `STK-010` Enter a Stock Adjustment with a negative quantity to reduce QOH, with an
   `OVER_RECEIPT_PAID` reason code.
3. Enter an accounts payable adjustment if required.

The receiving screen must detect this situation and route the user here explicitly rather than failing.

### `RCV-034` Credit Receiving

_Source: B11_

The credit-receiving variant referenced by the "Receive a Purchase Order" topic — used to credit back
received merchandise. Model as `Type of Activity = CREDIT_RECEIVING`; functionally a reversal that also
generates a vendor credit document rather than merely backing out the payable. Used by the RTV flow
(`RTV-011`).

---

## Freight bills and container receiving

### `RCV-050` Receive a Purchase Order with a Separate Freight Bill

_Source: B4, B5, E3_

Batch-oriented container/freight receiving. A **receiving batch** groups one or more PO receipts against a
**single freight bill**, then allocates the freight across the received merchandise as landed cost.

Batch header: batch id, freight vendor, freight bill reference, **Total Freight Amount**, allocation method
(`RCV-053`), `Action for this Batch` (`RCV-052`), status (`OPEN` | `CLOSED`).

**This is the mode that makes preset freight factors invalid — see `COST-033`.**

### `RCV-051` Receive now, freight amount later

_Source: B5_

Explicitly supported and important: a PO can be received against a freight bill that has not yet arrived.

1. Create the receiving batch, enter the PO receipt.
2. Enter `0.00` in **Total Freight Amount**.
3. Set `Action for this Batch` = **Finish Later**. The batch stays `OPEN`; merchandise is received into
   stock now.
4. When the freight invoice arrives, reopen the batch, enter the freight amount, and close it. Freight is
   then allocated and inventory cost is adjusted.

Requirement: freight may only be added **while the batch is open** (`B4`). Once closed, the batch is final
and freight must be handled as a cost adjustment/cost exception instead. Add an **aging alert on open
batches** — an open batch is un-costed inventory sitting on the balance sheet, and stale batches are exactly
what this workflow leaks.

### `RCV-052` Action for this Batch

_Source: E3, B5_

Enum: `RECEIVE_BATCH` (keep receiving more POs into this batch), `FINISH_LATER` (save and leave open),
`CLOSE_BATCH` (allocate freight and finalize).

### `RCV-053` Multiple POs against one freight bill

_Source: E3_

Documented flow to replicate:

1. Open `Receive a PO with a Separate Freight Bill`, select `Receive Batch`.
2. The receiving screen appears; receive the first PO, save, enter the next PO, save, and so on.
3. Exit at the PO Number field to return to the batch screen.
4. Choose the freight **distribution method**, then `Close Batch` and save.

Distribution methods to support: by extended cost value, by quantity/pieces, by weight, by cube/volume, and
manual per-line override. (Weight and cube require `ITEM-020` dimensions.) `[DECISION NEEDED]` — confirm
LA Mattress's standard method; recommend **by extended cost** as the default with weight available for
container imports.

### `RCV-054` Freight allocation posting

Allocated freight increases the unit cost of the received pieces and posts to inventory (not to expense).
Rounding remainder must be assigned deterministically to the largest line, and the sum of allocated amounts
must equal the freight bill total exactly. Write a test for the rounding.
