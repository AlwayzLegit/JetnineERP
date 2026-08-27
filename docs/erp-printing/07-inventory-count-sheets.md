# 07 — Inventory Count Sheets

Covers: **Print Count Sheets** (standard physical inventory) and **Print Bar Code Physical
Inventory Count Sheets** (bar-code physical inventory).

Two variants of the same idea, differing in whether the location is bar-code enabled. Both
are pure reports — **no side effects**.

---

## The concept that drives both: blind counting

Both routines center on one control, **Generate Blind Format**, and it is a controls concept
rather than a printing one.

| Mode | Sheet contains | Purpose |
|---|---|---|
| **Blind** (checked) | Warehouse location and storage location only | The counter records what they actually find, with no expected figure to anchor to |
| **Non-blind** (unchecked) | Expected quantities and/or serial numbers | Confirmation of piece counts and serial numbers |

`[GATE]` **Identical security rule on both routines:** access to this field requires the
*Generate count sheets with inventory quantity* permission in User/User Group settings.
**Without it, Generate Blind Format is force-checked and disabled** — the user can print only
blind sheets.

Port this exactly. Blind counting is the standard control against a counter writing down the
expected number instead of counting, and the permission is what makes it enforceable rather
than advisory. It should stay a permission, and the default for warehouse staff should be
"blind only."

---

## Print Count Sheets

**Entry:** Merchandising and Distribution > Inventory > Physical Inventory and Cycle Count >
Standard Physical Inventory > Print Count Sheets.

**Purpose:** produce a count sheet for piece counts and serial-number confirmation. The
documented procedure: record quantities counted by product per location, then after
completing a location perform a bulk count of total pieces in that location and compare
against the count sheet totals.

### Output content

Non-blind sheet, per product: storage location, product number, description, serial number,
stock quantity. Each line leaves **space to write a quantity and a serial or product
number**.

Blind sheet, per product: storage location, product number, description, **product type**.

`[GATE]` **As-Is products generate two lines** — one for stock items, one for as-is items.
This split is required: as-is inventory is a distinct valuation class and merging the counts
would corrupt it.

Regional Processing may restrict output (customers and locations you can access).

### Fields

| Field | Behavior |
|---|---|
| **Warehouse Location** | Multi-select via Multiple Locations Selection; the Search button opens Multiple Selection Lookup with **Select All**. Regional Processing applies |
| **Selection Type** | `Range` → requires Starting and Ending Storage Location; **not available when multiple warehouse locations are selected**. `List` → requires one, several, or all storage locations |
| **Starting Storage Location** | `[GATE]` required when Selection Type = `Range` |
| **Ending Storage Location** | `[GATE]` required when Selection Type = `Range` |
| **Level for Page Break** | The storage-location element to break on — e.g. `A` for Aisle, `R` for Rack, `B` for Bin. Valid values come from the prompts configured for that location in **Warehouse Location Mask Settings** |
| **Storage Location List** | `[GATE]` used when Selection Type = `List`. **If multiple warehouse locations are selected, this must be `All Storage Locations`** |
| **Generate Blind Format** | See above. Permission-gated |
| **Additional Print Lines** | Blank lines appended to the end of the sheet, for items not on it. **Note:** specifying enough lines to force a new page fills that entire page with blank lines |
| **Send Output to** / **Export Path** | Read-only; change via Actions > Output Settings |

**Run** produces the report.

---

## Print Bar Code Physical Inventory Count Sheets

**Entry:** Merchandising and Distribution > Inventory > Physical Inventory and Cycle Count >
Bar Code Physical Inventory > Print Bar Code Physical Inventory Count Sheets.

**Purpose:** the same worksheet for a bar-code-tracked physical inventory. Offers a blind
version, or a version including serial numbers or stock quantities for confirming piece
counts and serial numbers.

**Output content:** storage location, product number, descriptions, and serial numbers or
stock quantities. The blank version prints only warehouse location and storage location
(per the page-break selection), leaving room to write product, description, serial number,
quantity, counter's initials, and date/time.

### Fields

| Field | Behavior |
|---|---|
| **Warehouse Location** | Blank → **all** locations. The list **includes only** locations set to `Location tracking`, `Radio Frequency Bar Code`, or `Batch Bar Code`; and **excludes** invisible-location-type locations and locations with no mask built in **Tracked Warehouse Location Mask Settings** |
| **Physical Inventory Number** | The number generated during **Bar Code Initialization** |
| **Physical Inventory Batch** | The batch number within that physical inventory |
| **Level for Page Break** | Storage-location element to break on — e.g. `AISLE`, `RACK`, `BIN`. Values come from the prompts configured for the location in **Warehouse Location Mask Settings** |
| **Generate Blind Format** | See above. Permission-gated |
| **Send Output to** / **Export Path** | Read-only; change via Actions > Output Settings |

**Run** produces the report.

### `[GATE]` Storage-location sizing warning

Stated as *Important!* in the source, and it is an operational constraint worth carrying:

- If bar code is active at a location, **do not** build a single storage location to track all
  inventory at that store/warehouse.
- **No more than 1,000 pieces should exist in one storage location.**
- Exceeding this drastically degrades report runs and scanner-data uploads.

This is a scalability limit of the STORIS implementation, not a law of warehousing — our
system should not degrade at 1,000 pieces per location. But the underlying *warehouse*
guidance (don't model your whole building as one bin) is sound, and a warning at storage-
location setup time is worth keeping even when the technical limit is gone.

---

## Build notes

- **Two routines, one report.** The difference is which inventory-tracking model the location
  uses — bar-code-tracked locations key off a physical inventory number and batch, standard
  locations key off a storage-location range or list. Build one count-sheet generator with a
  location-selection strategy, not two screens.
- **Warehouse Location Mask Settings is a real dependency.** Both routines derive valid
  page-break levels from the per-location storage-location mask. That mask defines the
  location's addressing scheme (aisle/rack/bin or whatever the site uses). It must exist in
  the data model before count sheets can work.
- **Physical inventory number + batch is a workflow handle**, not a filter. It implies an
  initialization step that snapshots expected quantities. Confirm how the wider physical
  inventory process works before building the sheet in isolation — the sheet is the tail end
  of a process specified in the Inventory section of the help center, not this one.
- **Both are paper-first by design.** The whole point is a sheet someone carries into a
  warehouse and writes on. Preserve print fidelity — fixed-width columns, deliberate blank
  space, page breaks that align to physical aisles. Consider whether a mobile count screen
  should replace this entirely for bar-code locations; if so, the printed sheet remains the
  fallback for when the scanner network is down, which is exactly when it is needed most.
