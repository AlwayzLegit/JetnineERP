# 01 — Corrections to the Inventory Handoff Pack

**Read this first.** The Inventory pack (`storis-inventory-handoff`) was derived from **FAQ answers** —
what users asked about. This pack was derived from the **reference screens** — what the software actually
does. Where they disagree, the reference screens win.

Thirteen corrections follow. Six change requirements already marked P0. Apply these to the Inventory pack
before building against it.

---

## C1 — `ITEM-042` Price Matrix Usage Codes: **eight codes, not six, and the factor is 100-based**
*Source: `CUST-105`*

The Inventory pack listed six usage codes taken from an FAQ. The authoritative screen has **eight**. Missing
were `Replacement Cost × Factor` and `Replacement Cost + Factor` — meaning there are **two distinct cost
bases** (average cost and replacement cost), not one.

Worse, the arithmetic was wrong. **The factor is 100-based, not a decimal multiplier.** This is proven by
the `Use Lowest Price` rule, which inactivates "provided the factor is greater than 100" — a decimal
multiplier could never exceed 100. A factor of `95` means 95%, not 9500%.

And a label trap: **`Sales Written Cost` actually operates on the `average cost` field.** The label does not
name its operand.

**Action:** rewrite `ITEM-042` with all eight codes and 100-based arithmetic. Any implementation already
written against the six-code decimal version is wrong by two orders of magnitude and must be re-tested.

## C2 — `ITEM-040` price resolution order: **the matrix is step 1, not steps 3–4**
*Source: `PRD-039`, contradicting the FAQ-derived chain*

`PRD-039` states STORIS's order as: **pricing matrix → district promo → product promo → warehouse inventory
→ district standard → product standard.** The Inventory pack had the matrix applying *after* a seven-step
chain resolved a base price.

These cannot both be true. **`[DECISION NEEDED]` — this needs settling against the live system before the
resolver is built**, because it changes which price a customer sees in the common case. Do not guess: the
Inventory pack's `ITEM-040` is currently unsafe to implement.

Related: **markdown is a `min()` applied after resolution**, not a precedence step — "uses the markdown
price unless the default price is lower."

## C3 — `ITEM-045` price scopes: **four, not three**
*Source: `PRD-039`*

The pack had PRODUCT / DISTRICT / LOCATION. There is a fourth: **REGION**. The split is meaningful —
**district carries sales settings** (price, promo, spiff, rewards) and **region carries supply settings**
(stock levels, lead days, reservation, **and landed freight and add-on costs**).

**Action:** add `REGION` to the scope enum in `ITEM-045` and to the settings resolver in
`09-control-settings.md`. `COST-032` also needs **region** and **vendor ship-from** scopes (`PRD-081`).

## C4 — Five more things beat the price chain
*Source: `PRD-050`, `PRD-052`, `PRD-062`, `PRD-072`, `PRD-084`*

Beyond `ITEM-044` (as-is piece price), all of these resolve above or before the chain:

- **Product substitution** (`PRD-052`) decides *which product* is priced before any chain runs.
- **Predefined Configured Items**, on exact match (`PRD-062`).
- **Suite grade override** (`PRD-072`).
- **Kit component pricing** (`PRD-050`) — and this one **overrides the Location Selling Price** in Warehouse
  Inventory Settings, contradicting `CFG-WHINV-PRICE`. The location price applies only when the kit's
  `Source of Price` is `Product`.
- **Warranty category percent/tier tables** (`PRD-084`), which beat the warranty product's own price.

**Action:** `ITEM-040` is not a seven-step chain; it is a chain with five pre-emptors. Model them explicitly.

## C5 — `ITEM-060` Custom Fabric Information is **not** a fixed four-column structure
*Source: `PRD-041` area*

`Frame`, `Color`, `Grade`, `Upholstery` are **user-defined, per-vendor option types** — not fixed columns.
The pack modelled them as four named fields. The PO-line-text half of `ITEM-060` is correct as written.

**Action:** remodel as a per-vendor option-type definition plus per-product values.

## C6 — `PO-080` PO hold triggers: **gap partially closed**
*Source: `VEND-041` area, `VEND-084`, `VEND-087`*

The Inventory pack could not determine why POs go on hold and deferred it. Four real mechanisms found:

1. **`Automatically Hold POs`** — vendor- and vendor+region-scoped flag on Advanced Vendor Settings. Applies
   **only to auto-replenishment POs**. Note: *the source contradicts itself* on whether it holds created POs
   or suppresses creation and emits a buyer worklist; the older read-only copy carries only the "hold"
   wording, so the worklist text appears to be a later change. `[DECISION NEEDED]`.
2. **Buying-group single-buyer block** — with `Activate Buying Group` on, every PO line must resolve to the
   same buyer or the PO cannot be built.
3. **`Hold Code`** (Vendor Settings → Payables) — assigns a hold to all newly created AP bills for that
   vendor; those bills are ineligible for payment approval until manually released per bill.
4. **`Payable Bill Hold Days`** (Vendor EDI) — blocks AP approval on partially received POs; past the
   window it creates a partial payment approval **plus an exception**, and every later increment is manual
   forever.

**Not found anywhere:** vendor credit hold, approval workflow, dollar thresholds, or manual PO holds. If we
want those — and we probably do — they are our own design, not parity.

Mechanism 3 also explains something the pack got wrong: **`PO-102` "fully received POs close automatically
when approved for payment" never fires for a held vendor**, because a held bill never reaches approval.

## C7 — `PO-104` EOD close is conditional
*Source: `SYS-019` area, `SYS-048`+*

Verbatim: end-of-day closes purchase orders **"provided the orders have been completely AP approved"** —
and that gate applies **only when Third-Party Accounting is active**. The pack stated the close as
unconditional.

Also, and this matters for any batch we build: **EOD posts using the operator's `As-of Date`, not
wall-clock — and a catch-up run collapses several missed days onto one date.**

## C8 — `REPL-040` confirmed, with the step number
*Source: `SYS-023`*

`Replenish Stock Inventory Based on Sales Rate` (program `PO.400.PRE`) is **step 30 of 48** in Generate
Daily Reports. `REPL-041`'s ordering requirement is *supported but not proven* — `PO.400.PRE` sits after
all inventory, transfer, costing and receivable entries and before AP/GL, which reads as process-flow
order, but no article states that listing order equals execution order.

**And the finding that matters most for our EOD design**, verbatim from `SYS-019`:

> *"Checking this box suppresses the printing of the report only. Updates performed during the Generate
> Daily Reports process… continue whether or not this box is checked."*

**EOD is an update job with reports attached, not a reporting job.** You cannot disable a side effect by
turning off its report. See `04-eod-eom-and-jobs.md`.

## C9 — `COST-040` cost exceptions are undermined in four places
*Source: `SCS-016`, `SCS-087`, `PRD-064`/`PRD-067`, two Extended Security flags*

The pack treats cost exceptions as the safety net for unknown cost. Four documented bypasses defeat it:

- **`Skip on Zero`** (`SCS-016`) — accepts inventory at $0.00 and clears the exception.
- **`Skip the Exception`** (`SCS-087`) — receives at zero cost and clears the exception, corrupting margin
  for the life of that cost layer.
- **`Update Product Replacement Cost Within Purchase Entry screens`** and **`Change Product Replacement
  Cost During Vendor Invoice Entry`** — rewrite product cost from transaction screens with **no exception
  raised and no audit**.
- **`Auto` special-order pricing with no price rows silently prices *and costs* options at $0.00**, writing
  that total back to the order line (`PRD-064`/`PRD-067`).

**Action:** `COST-042`'s rule "auto-resolution must never fire on a $0.00 receipt cost" is necessary but
not sufficient. We must also refuse to *create* a zero-cost layer without an explicit, permissioned,
audited override. Do not port any of these four bypasses.

Related: **three-way-match tolerances do not exist in STORIS** (`VEND-084`). What the pack called a
tolerance is really four `Never / Only When Lower / Always` cost-update switches. Our
`CFG-COSTING-TOLERANCE` is a genuine improvement, not parity.

## C10 — `CFG-INV-RESERVEBY` is a **two-field pair**, not one setting
*Source: `SCS-009` area*

It is two fields with **three valid combinations**, plus product-level and regional overrides. The pack
modelled it as a single enum. Recommended target: **Order Date + Immediate** — per the part-A analysis,
the only combination compatible with both ATP (`STK-053`) and prefer-PO behavior.

Related: `CFG-LOC-REPLSOURCE` also has a **SYSTEM-level ordered five-warehouse list**, split by whether the
target is a store or a warehouse.

## C11 — Irreversibility: the pack guessed wrong in both directions
*Source: `SCS-038` area, `PRD-*`*

- **`CFG-INV-LOCTRACK` is irreversible**, not merely guarded. The pack had it as a guarded change.
- **Serial tracking is guarded, not irreversible** — wave 1 reported the opposite; the product reference
  screens corrected it.
- Other genuinely irreversible product settings found: **Product ID, Inventory Type, Boxes per Product**
  (once above 1, never back to 1), **Merge History From**, Creation Date, and price adjustment codes
  (undeletable, and uneditable once loaded).

## C12 — `RCV-050` freight: vendor default is **go-forward only**
*Source: `VEND-090`*

The vendor-level `Freight Amount` default populates `RCV-050`'s Total Freight Amount **for new batches
only**. It does not retroactively affect open batches. Worth stating explicitly in `RCV-051`, since the
open-batch aging alert we specified will otherwise mislead.

## C13 — Group permissions are a **copy-down template**, not inheritance
*Source: `USR-007`, verbatim*

> *"the system applies any changes you make here to all other users in the current user group (that is, the
> system updates those individual user records)"*

The `Reset User Members` checkbox mass-overwrites every member's record — no preview, no undo, and it
silently destroys per-user exceptions. Unchecked, group edits are a **no-op for existing members**.
Enforcement reads only the user row, so **the user-level value always wins**. Group membership is
**single-valued and required**.

The Inventory pack's `10-security-permissions.md` assumed live three-state inheritance. That file is
**superseded by `02-permissions-catalog.md`** in this pack, which specifies live evaluation, most-specific
scope wins, deny beats allow, default deny, and explainable decisions — and carries all **355** real
permission flags rather than the 30 the Inventory pack inferred.

---

## Also worth knowing (not corrections, but they change plans)

- **`ITEM-010` three-tier hierarchy is confirmed verbatim**, plus a behavior the pack missed: `Active`
  **cascades** — an inactive category makes all its groups inactive.
- **Two customer-keyed pricing mechanisms exist and the pack conflated them:** product `Price Code` ×
  customer `Price Category` → Price Matrix; *and* the product Price/Spiff/Commission table's `Price
  Category` rows × customer **`Class`** code. These are different fields doing different jobs.
- **The customer `Price Category` has no default, no derivation, and no validation anywhere in all 137
  Customer Settings articles** — yet `CUST-117` gates *discount eligibility* on it. Steps 3–4 of `ITEM-040`
  depend on a field STORIS never reliably sets. We must design its assignment ourselves.
- **No `Warehouse Inventory Settings` article exists in Product Settings** (confirmed against the full
  88-title enumeration) despite `PRD-050` and `PRD-059` referencing it. `CFG-WHINV-*` remains specified
  from the Inventory pack only.
- **A vendor's EDI can rewrite our data in three ways:** quantity ordered (EDI 856 acknowledgement),
  delivery date (acknowledgement `Shipping Date` + in-transit days), and delivery completion state (EDI 214
  via `Third Party Logistics EDI Code`, including partial completions). Do not port vendor write access.
- **`VEND-041`, verbatim:** *"These settings do not apply to the Enter a Purchase Order process."* The
  entire category/group exception layer — lead days, pads, warranty, stock days — **is ignored on manually
  keyed POs**. That is almost certainly a defect we should not reproduce.
