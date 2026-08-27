# 04 — Purchase Orders

---

## PO lifecycle

### `PO-001` PO state machine

```
DRAFT → OPEN → (ACKNOWLEDGED) → PARTIALLY_RECEIVED → FULLY_RECEIVED → CLOSED
   │        │                                                              ↑
   │        └── ON_HOLD ──┘                                                │
   └── DELETED                                     (closed date stamped by EOD — PO-104)
```

Header fields: PO number, PO date, buyer id, vendor, ship-from address (`PO-020`), receive-at location
(`PO-022`), delivery/expected date, terms, freight terms, status, hold reason, distribution list
(`PO-030`), totals, EDI flag, print/fax/email sent flags.

Line fields: product, quantity ordered, quantity received, quantity available to reverse (`RCV-031`),
unit cost, landed cost factors (`COST-030`), distribution by location (`PO-031`), linked sales order
line (`PO-042`), special order info (`PO-041`), line comments/instructions (`PO-043`), line type
(stock / special order / direct ship — `PO-060`).

---

## Special orders

### `PO-040` Create a special-order PO from Sales Order Entry

_Source: D1_

From within order entry, a salesperson enters a special-order product code or creates a product on the fly.
Special-order detail is captured on a dedicated **Special Order Entry** screen (options, fabric/frame/color/
grade/upholstery, custom detail).

When there is insufficient quantity of the special-order product, the system may create the PO from inside
order entry. Behavior is settings-driven:

- `SEC-PO-SOPOS` — user/group Purchasing security: _"Create special order purchase orders within POS entry"_.
  Without it, order entry cannot create a PO.
- `CFG-SO-AUTOCREATE` — Special Order Control Settings, _"Purchase Order — Automatically Create"_:
  `PROMPT` (ask the user) | `AUTO` (create silently) | `NEVER`.
- `CFG-SO-ASSIGNREQ` — Special Order Control Settings, _"Assignment Required"_: when on, the created PO line
  **must** be reserved/linked to the originating sales order line.

### `PO-041` Create a special-order PO from PO Entry

_Source: D1_

Buyer path: create the PO header (number, date, buyer, vendor), then on the merchandise tab either enter an
existing special-order product code or create one on the fly (with the special-order flag set). A
**Special Order Information** window captures options and detail. A separate **Special Order Instructions**
window captures free-text instructions to the vendor.

### `PO-042` PO ↔ Sales Order linking

_Source: D1, D9, B8_

A PO line may be linked to one or more sales order lines. The link:

- drives reservation of received goods to the customer order,
- must be visible from both sides,
- must be removable (required before a special-order product can be converted — `ITEM-030`),
- blocks PO deletion while it exists (`PO-090`).

### `PO-043` Line comments after the PO has been printed

_Source: D6_

Once a linked PO has been **printed**, line comments become read-only in sales order entry. The buyer edits
them instead via PO Entry → merchandise line → **Special Order Instructions**, and that edit
**writes back to the linked sales order line**. Implement the write-back — a one-way edit is a parity gap
and causes the warehouse and the customer file to disagree.

### `PO-044` Prefill PO line text from the product

_Source: D7_

See `ITEM-060`. On adding a product carrying CFI or maintained PO line text, prompt
_"Use existing purchase order comments?"_; on yes, prefill and allow additional line-specific text.
Text must render on the printed PO and in the PO line detail (read-only) inquiry.

### `PO-045` Identify POs originated in Sales Order Entry

_Source: G1_

Stamp every PO with an `origin` field (`PO_ENTRY` | `SALES_ORDER_ENTRY` | `REPLENISHMENT_BACKORDER` |
`REPLENISHMENT_SALESRATE` | `AUTO_REPLENISHMENT` | `EDI` | `MIGRATION`). STORIS users have to hunt through
comment lines to work this out — a stored, indexed, filterable field removes an entire class of FAQ. Expose
it as a filter on every PO list and report, and surface PO info on the sales order line's
**Additional Line Item Details → Sales Order** tab.

---

## Multi-location distribution

### `PO-030` Distribution lists

_Source: D2_

A named, reusable list of receiving locations. Created and edited inline from the PO's `Receiving At` field.
When a list is selected, `Receiving At` displays a multi-select indicator plus the list description.

### `PO-031` Line item distribution

_Source: D2_

After entering a line quantity on a multi-location PO, a **Line Item Distribution** window opens showing the
per-location split. Default: distribute evenly across the list's locations; remainder handling must be
deterministic (`[DECISION NEEDED]` — recommend allocating the remainder to the list's primary location).
The user may override any location's quantity. The window must not close while the distributed total ≠ line
quantity. Receiving then occurs per location against the distributed quantities.

---

## Vendor and location on the PO

### `PO-020` Vendor ship-from addresses

_Source: D4_

Multiple alternate ship-from addresses per vendor (STORIS: Vendor Ship From Settings, reachable both
standalone and from the vendor record's miscellaneous tab).

### `PO-021` Ship-from prompt at PO entry

_Source: D4_

When a vendor with alternate ship-from addresses is entered on a PO, prompt _"select a ship from location?"_;
on yes, present the list. The chosen address is stored on the PO header and prints on the PO. Vendors with a
single address must not prompt.

### `PO-022` Change the receiving location

_Source: E1_

`Receive At` on the PO header (general tab) is editable **only while the PO is unreceived**. Once any
quantity is received, it is locked. Additional gates:

- PO submitted via EDI → requires `SEC-PO-EDIT-EDI` (_"Edit EDI purchase orders that were electronically
  submitted"_)
- PO already printed, faxed, or emailed → requires `SEC-PO-EDIT-SENT` (_"Edit purchase orders that have been
  printed, faxed or emailed"_)

Both gates apply to **any** edit of a sent/EDI PO, not just the receiving location. Track `printed_at`,
`faxed_at`, `emailed_at`, `edi_sent_at` on the header so the gate can be evaluated.

---

## Dates and acknowledgement

### `PO-070` Change delivery date — unacknowledged PO

_Source: D3_

If the PO has **not** been acknowledged, edit the delivery date directly in PO Entry.

### `PO-071` Change delivery date — acknowledged PO

_Source: D3_

Once a vendor **acknowledgement** has been recorded, the delivery date is no longer editable in PO Entry; it
may only be changed through the **Acknowledge a Purchase Order** routine, which records the acknowledgement
context (vendor confirmation reference, acknowledged ship date, acknowledged quantities).

Implement acknowledgement as a first-class record with history, so date-change accountability survives. The
PO Entry field must be disabled with an inline explanation and a link to the acknowledgement routine — not
silently ignored.

---

## Hold, close, delete

### `PO-080` On-hold purchase orders

_Source: D8_

POs enter `ON_HOLD` automatically under defined conditions and may be placed on hold manually. Model hold
as a **hold record** (reason, set by, set at, released by, released at) rather than a boolean, so multiple
holds can coexist and history is retained.

`[DECISION NEEDED]` — the STORIS answer defers to a separate "On Hold Purchase Order Overview" topic that is
outside the Inventory FAQ section. **Action for Claude Code: do not guess the trigger conditions.** Fetch
that topic (and the vendor/credit-hold settings it references) and extend this requirement before building.
Likely triggers to confirm: vendor on credit hold, cost variance beyond tolerance, budget/open-to-buy
exceeded, missing required approval, unapproved new vendor.

### `PO-081` Release from hold

Requires `SEC-PO-HOLDRELEASE`. Held POs may not be printed, transmitted, or received. Releasing writes an
audit row.

### `PO-100` Close a partially received PO — manual

_Source: E4_

Action on the PO header: **Close Purchase Order**. Available whether or not accounting is active. Closing a
partially received PO cancels the outstanding balance.

### `PO-101` Close a partially received PO — prompt at receiving

_Source: E4_

When `CFG-INV-RCVCLOSE` (Inventory Control Settings, _"Allow Receiving to Close Purchase Order"_) is active,
the receiving routine asks whether to close receiving for a partially received PO.

### `PO-102` Close a fully received PO — accounting active

_Source: E4_

When accounting is active (AP/GL in-system or third-party interface), a PO whose received quantity matches
the ordered quantity is **closed automatically by the system when it is approved for payment**. Do not
require a manual close in this path.

### `PO-103` Close a fully received PO — accounting not active

_Source: E4_

When accounting is not active, a fully received PO triggers a prompt asking whether to **delete** the now
fully-received PO. Answering **No** leaves the PO available to be closed via `PO-100`.

`[DECISION NEEDED]` — this branch exists only because STORIS supports running without accounting.
Confirm LA Mattress will always run with accounting active. If yes, implement `PO-102` only and record
`PO-103` as intentionally not implemented.

### `PO-104` Closed status is stamped by end-of-day

_Source: E4, NOTE_

Important subtlety to replicate deliberately: closing moves a PO to a **closed list** immediately, but its
status does not read `CLOSED` and the **closed date is not stamped** until the end-of-day job
(`EOD-001`, "Generate Daily Reports") runs.

`[DECISION NEEDED]` — this is a batch-era artifact. Recommend we **close immediately and stamp immediately**,
and have EOD only reconcile stragglers. Confirm with accounting that no period-close process depends on the
deferred stamp before diverging from STORIS here. Whichever we choose, `closed_at` must be a real timestamp,
not derived at read time.

### `PO-090` Delete an unreceived PO

_Source: D9_

Open PO Entry, retrieve the PO, delete. Blocked if any linked sales order lines exist (`PO-042`) or the PO
has been EDI-transmitted without the appropriate permission. Deletion is a soft delete retaining the record
and an audit row — a PO number must never be silently reusable.

### `PO-091` Delete a received PO — full reversal precondition

_Source: D9_

A received PO can be deleted only after **all** received quantity is reversed:

1. In Receiving, set `Type of Activity = Reverse a Receiving Error`, enter the PO. Lines appear in a grid.
2. The **Available** column shows how much may be reversed. Compare to **Ordered**.
3. If Available matches Ordered for every line, enter those quantities in the **Credit** column and save.
4. Then delete per `PO-090`.

**Hard rule:** if Available < Ordered on any line, the PO cannot be fully un-received and therefore
**cannot be deleted**. Available **excludes** pieces that are on a pick list, on a manifest, or completed
(`RCV-031`). The UI must state exactly which lines and which quantities are blocking, and why — a bare
"cannot delete" is the single most common support call this rule generates.

---

## Direct ship

### `PO-060` Direct shipment POs

_Source: B15, I7_

A sales order line typed **direct ship** generates a PO to the vendor using the **customer's address as the
ship-to**. The goods never touch our inventory: no receipt into stock, no QOH impact; the PO receipt relieves
directly against the sales order and posts cost of sale.

Required by two separate FAQ paths: consignment/store-closing where inventory will never arrive (`STK-061`),
and exchanges where replacement merchandise ships direct from the vendor (`RTN-061`). Line type must be
changeable to direct ship on an existing open sales order line.
