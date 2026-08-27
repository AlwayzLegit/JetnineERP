# 03 — Physical Inventory

_Source: C1, C2, B16_

The eight-step STORIS lifecycle, implemented as an explicit **state machine** on a `physical_inventory`
entity. Illegal transitions must be impossible, not merely discouraged.

```
DRAFT → PREP → FROZEN → COUNTING → RECONCILING → POSTED → CLEARED
                  ↑                      |
                  └──────── (recount) ───┘
```

---

### `PHYS-001` Pre-flight data integrity check

_Source: C1, NOTE_

STORIS requires a technician to run file utilities against product and warehouse data **before** freezing,
to prevent errors during the freeze. Our equivalent is an automated, self-service **pre-flight validation**
that must pass before the freeze is allowed. It checks at minimum:

- Orphaned inventory rows (product or location no longer exists)
- Products with no group, groups with no category (`ITEM-010`)
- Negative quantity on hand anywhere
- Ledger-vs-projection drift: recompute QOH from the ledger and compare to the stored projection; any
  mismatch is a hard stop
- Open cost exceptions above a threshold (`COST-040`)
- Pieces in `IN_TRANSIT` with no corresponding open transfer
- Storage-location assignments pointing at deleted storage locations

Output a blocking-issues report. Freeze is disabled while blockers exist.

### `PHYS-010` Step 1 — Prepare

Define scope: which locations, which storage locations, which product categories/groups (full vs. cycle
count). Assign counters/teams. Choose count method (manual sheets, batch bar code, RF bar code). Set the
count effective date/time.

### `PHYS-020` Step 2 — Complete transactions prior to the count

Provide a **transaction settlement checklist** the user must clear before freezing, since STORIS requires
in-flight work be finished first:

- Open receiving batches (`RCV-052`) — must be closed or explicitly excluded
- Open/unacknowledged transfers and transfer manifests (`XFR-020`) — in-transit inventory must be resolved
  or explicitly accounted for
- Pick lists and manifests not yet completed
- Unposted stock adjustments
- Sales orders completed but not relieved from inventory

Each item links to the routine that clears it. Show counts, not just a warning.

### `PHYS-030` Step 3 — Freeze the inventory

Snapshot quantity on hand, status, cost, storage location, and piece detail for every in-scope
product×location as of the freeze timestamp. The snapshot is immutable.

**Freeze semantics** — `[DECISION NEEDED]`, pick one and be explicit in the UI:

- **Hard freeze:** block all inventory-moving transactions in scope until cleared. Safest, most disruptive.
- **Soft freeze (recommended):** transactions continue and are captured as **post-freeze activity**; at
  reconciliation the system compares `counted − post_freeze_activity` against the frozen snapshot. This lets
  the store keep selling during the count. It requires the ledger (`LEDGER-001`) to be exact.

Whichever is chosen, the frozen snapshot itself never changes.

### `PHYS-031` Multiple concurrent freezes

Freezes are scoped; two locations may be frozen independently. Overlapping scopes on the same
product×location must be rejected.

### `PHYS-040` Step 4 — Generate count sheets

_Source: B16_

Count sheets ordered by **storage location** walking sequence (aisle → rack → bin), one sheet per location.
Configurable: blind count (quantities hidden — recommended default) vs. non-blind. Include SKU or vendor
model per `CFG-INV-VENDORMODEL`. Support reprint with a sheet id so recounts are traceable.

### `PHYS-041` Step 5 — Count, with bulk verification

_Source: B16_

The documented STORIS counting method, which we must support directly:

1. Record quantities counted **by product, per location**, on the count sheet.
2. On completing a location, perform a **bulk count of total pieces in that location**.
3. Compare the bulk total against the sum of the sheet's line totals.

Implement step 3 as a first-class control: a per-location `bulk_piece_count` field, and the location cannot
be marked counted until bulk total = sum of line totals, or a supervisor records an explicit override with a
note. This catches transposition and skipped-line errors before reconciliation, which is the whole point.

### `PHYS-050` Step 6 — Enter counts

Entry methods: manual keying against the sheet, file import (CSV/fixed-width), batch bar code upload, RF
scan. All converge on the same `physical_count_line` table with a `capture_method` field. Support multiple
count passes per line (first count, recount, final) with the pass number retained.

### `PHYS-060` Step 7 — Reconcile

Variance report: frozen quantity vs. counted quantity vs. (soft freeze) post-freeze activity, by product,
location, storage location, with extended cost variance and variance percent. Sort/filter by absolute
dollar variance descending — that is how a controller works the list.

Required actions per variance line: accept, recount (returns the location to `COUNTING`), or investigate
(hold with a note). Variances require a reason code (`STK-080`).

Approval gate: variances above a configurable dollar or percent threshold require supervisor sign-off
(`SEC-PHYS-APPROVE`) before posting.

### `PHYS-070` Post the count

Posting writes `PHYSICAL_COUNT` ledger rows (`LEDGER-001`) for every accepted variance and the matching GL
entries (inventory vs. shrink/overage accounts derived from the reason code). One transaction; partial posts
are not allowed. Posting is irreversible — corrections after posting are ordinary stock adjustments.

### `PHYS-080` Step 8 — Clear the freeze

Releases the scope and returns normal processing. Retain the full record — snapshot, count lines, variances,
approvals, posted ledger refs — permanently for audit.

### `PHYS-090` Outside counting service integration

_Source: C2_

STORIS's answer is "that requires custom programming" — we can do better and should, because third-party
count services are common in this industry.

Build a **generic count-import adapter**: a mapping-profile UI (delimiter, column→field mapping, SKU
identifier type — our SKU vs. vendor model vs. UPC, location code translation, quantity/UOM handling),
saved per service provider and reusable. Import runs validate-then-stage-then-commit, with a rejects file
listing unmatched SKUs and locations. Ship with profiles for the common formats once we know which vendor
LA Mattress uses. `[DECISION NEEDED]` — which counting service, if any, is used today?
