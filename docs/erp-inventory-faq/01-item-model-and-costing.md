# 01 — Item Model, Pricing Resolution, and Costing

Build this first. Everything in `02`–`08` reads from it.

---

## ITEM — Product hierarchy and attributes

### `ITEM-010` Three-tier inventory hierarchy

_Source: B7_

Implement a strict three-level hierarchy: **Category → Group → Product**.

- Every product **must** belong to exactly one group. Enforce at the database level (NOT NULL FK), not
  just in the UI.
- Every group **must** belong to exactly one category. Same enforcement.
- Setup order is Category, then Group, then Product. Creation UIs must reflect this (you cannot create a
  product without an existing group).
- Group-level and category-level settings **cascade down as defaults** but are overridable at the product
  level. Store the override explicitly (a null at product level means "inherit"), so that changing a group
  setting later propagates to non-overridden products. Do not copy-down at creation time.

### `ITEM-011` Group-level policy settings

_Source: B7, I4_

The Group record must carry at minimum: default return-days window (`CFG-GRP-RTNDAYS`), default GL account
mapping, default replenishment policy, default commission treatment. Product inherits unless overridden.

### `ITEM-020` Product record — required fields

Product code (SKU), description, group, vendor(s), vendor model number, unit of measure, stocking flag,
special-order flag, serialized flag, taxable flag, active/discontinued status, dimensions/weight
(needed for freight allocation by weight/cube, see `RCV-053`).

### `ITEM-030` Convert special order product → regular inventory product

_Source: B8_

A product flagged special-order may be converted to regular stock inventory **only** when it is fully
unencumbered. The conversion routine must run these preconditions and **block with a specific, actionable
error naming each blocker** (not a generic "cannot convert"):

1. No open sales order lines reference the product.
2. No PO lines for the product are linked to sales orders.
3. No received quantity exists against any PO for the product (must be un-received first — `RCV-030`).
4. No open POs exist for the product (must be deleted first — `PO-090`).
5. Quantity on hand is zero across **all** locations.

The STORIS-documented manual sequence is: delete SO lines → remove PO↔SO links → un-receive PO → delete PO →
convert. Our version must expose that sequence as a **guided remediation UI** listing each blocker with a
deep link to resolve it. `[DECISION NEEDED]` — do we also want a privileged one-click "force convert" that
performs the whole cascade transactionally? Recommend yes, gated behind `SEC-ITEM-FORCECONVERT`.

### `ITEM-050` Product benefits text

_Source: B6_

Free-text/rich-text field on the product (colors available, warranty terms, care instructions). Prints on
floor tags. Must be editable from the product maintenance screen directly and reachable from a group-level
bulk editor. Support per-product override of group-level default benefit text.

### `ITEM-060` Extended descriptive information for POs

_Source: D7_

Two distinct pieces of text, both of which must flow onto a printed PO:

- **Custom Fabric Information (CFI)** — structured, four fields: `Frame`, `Color`, `Grade`, `Upholstery`.
  Available on **any** product, not just special-order products.
- **PO line text** — free text maintained on the product's cost/purchasing tab, appended to the PO line.

Behavior on PO entry (`PO-044`): when a product carrying either of these is added to a PO, prompt
_"Use existing purchase order comments?"_. On yes, prefill the line's special-order info window from the
product record; the buyer may then add line-specific text on top. Both the product-level and line-level
text must appear on the printed PO and on the PO line detail inquiry.

### `ITEM-070` Product images — managed upload

_Source: D10_

Multiple images per product, ordered by an explicit sequence number. Sequence `1` is the image shown
wherever a single image is displayed (order entry, inquiry, maintenance). Support reorder, replace, delete.
Store originals plus derived thumbnails.

### `ITEM-071` Product images — URL mode

_Source: D10_

Per-product image source selector: `MANAGED` | `URL`. When `URL`, an image-URL list on the product supplies
the images instead of uploaded assets. Both modes must render identically to consumers of the image API.

---

## ITEM — Pricing resolution

### `ITEM-040` Default selling price resolution order

_Source: B3_

This is a **business rule with a strict precedence order**. Implement it as a single, pure, unit-tested
resolver function — `resolveSellingPrice(product, location, district, customer, date)` — used by every
consumer (order entry, quotes, price book, exports). Do not reimplement the logic anywhere else.

Precedence, first match wins:

1. **District promotional price**, when `date` falls in the district sale date range.
2. **Product promotional price**, when `date` falls in the product promotional date range.
3. **Price table value matching the customer's price category** — _customer-dependent_.
4. **Highest value in the product price table**, when no entry exists for the customer's price category.
5. **Location selling price** (from the location/warehouse inventory settings for that product).
6. **District selling price.**
7. **Product selling price.**

See `ITEM-041` for the critical carve-out.

### `ITEM-041` Customer-less price resolution (price books, exports, reporting)

_Source: B3_

Steps 3 and 4 are customer-dependent and therefore must be _skippable_.
The resolver takes a `customerContext` that may be null. When null (price books, catalog exports, reporting,
the analytics store), steps 3–4 are bypassed. This is why a printed price book can legitimately differ from
the price on an order — document that in the UI, not just the code.

### `ITEM-042` Price matrix

_Source: B3_

A matrix keyed by (customer price category × product price category) producing a factor plus a usage code.
Supported usage codes, evaluated against the price derived in `ITEM-040`:

| Code             | Formula                  |
| ---------------- | ------------------------ |
| Percent of price | `derived_price × factor` |
| Less amount      | `derived_price − factor` |
| Plus amount      | `derived_price + factor` |
| Percent of cost  | `derived_cost × factor`  |
| Cost plus amount | `derived_cost + factor`  |
| Fixed            | `factor`                 |

The matrix applies **after** `ITEM-040` resolves a base price. Store `usage_code` as an enum; never infer
it from the sign of the factor.

### `ITEM-043` "Z" price-category override for reporting

_Source: B3, NOTE_

STORIS rule: for data-warehouse/reporting purposes, if a `Z` price-category entry exists in the product
price table, use it **even if it is not the highest value** — i.e. it overrides step 4. Replicate this in
the reporting resolver only. `[DECISION NEEDED]` — this is a STORIS legacy convention. Confirm LA Mattress
actually uses a `Z` category before implementing; if not, record it as intentionally-not-implemented in the
matrix rather than silently skipping it.

### `ITEM-044` As-is piece pricing

_Source: B3_

An as-is piece carries its **own** selling price stored on the individual piece record. When an as-is piece
is selected on an order, that piece price wins over the entire `ITEM-040` chain. If the piece has no price,
fall through to the normal chain.

### `ITEM-045` Price storage model

_Source: B3_

STORIS spreads pricing across three files (`PRODUCT`, `PRODUCT.SUB` by district, `WAREHOUSE.INVENTORY` by
location). Our model must carry the same three scopes:

- **Product scope:** selling price, sale price, sale start date, sale end date, price table (multi-valued).
- **District scope:** selling price, sale price, sale start date, sale end date.
- **Location scope:** selling price.

Model these as one `product_price` table with a `scope` discriminator (`PRODUCT` | `DISTRICT` | `LOCATION`)
and a nullable scope key, plus a separate `product_price_table` for price-category tiers. Do not create three
parallel tables.

### `ITEM-046` Reporting price tier flattening

_Source: B3_

For the analytics/reporting store, flatten all pricing into one `product_pricing` table where each row
carries a numeric **tier code** identifying the origin of that price (product / district / location /
promo / price-table tier). The tier code enum must be **extensible** — new tiers are expected. Reporting
consumers select the applicable tier rather than re-running the resolver.

---

## COST — Costing

### `COST-010` Costing method

`[DECISION NEEDED]` — STORIS defaults to **average cost** with per-piece cost tracking. Confirm LA Mattress's
method (average vs. FIFO vs. specific-identification per piece) before building. This pack assumes
**moving average at the product×location level, with per-piece actual cost retained** on serialized/as-is
pieces, because `ITEM-044` and `RTV-*` require piece-level cost.

### `COST-020` Cost is always sourced, never typed blind

Every cost change writes a `cost_history` row with: source (`RECEIPT` | `AP_INVOICE` | `ADJUSTMENT` |
`EXCEPTION_RESOLUTION` | `MIGRATION`), old cost, new cost, quantity affected, user, timestamp, and the
document that caused it.

### `COST-030` Landed freight and add-on cost factors

_Source: A1, B4_

Preset "factors" that inflate inventory cost at receipt. Each factor is expressed as **either a percent or a
flat dollar amount** (store `factor_type` explicitly). Two kinds:

- **Landed freight factor**
- **Landed cost add-on factors** (duty, brokerage, handling, etc. — support multiple named add-ons)

### `COST-031` Factor scope: vendor level

_Source: A1_

Factors settable on the vendor record (STORIS: Advanced Vendor Settings → Shipping tab).

### `COST-032` Factor scope: product level

_Source: A1_

Factors settable on the product record (STORIS: Advanced Product Settings → Cost tab). **Product-level
overrides vendor-level.** Where both a percent and an amount exist at the same scope, apply amount then
percent — `[DECISION NEEDED]`, confirm ordering with the controller.

### `COST-033` Mutual exclusion with itemized container freight — **hard rule**

_Source: A1, NOTE_

Preset landed-freight factors and the separate-freight-bill/container receiving process (`RCV-050`) are
**mutually exclusive** — using both double-counts freight into inventory value.

Implementation requirement: this must be enforced, not documented. Add a system-level mode setting
`freight_costing_mode` = `PRESET_FACTORS` | `ITEMIZED_CONTAINER`. When `ITEMIZED_CONTAINER`, the preset
freight factor fields are disabled/read-only and ignored by the receipt costing routine, with an inline
explanation. Changing the mode while open receiving batches exist must be blocked.

### `COST-040` Cost exceptions — creation

_Source: A2_

The system raises a **cost exception** whenever it cannot confidently determine the cost of a piece.
Minimum triggers:

- Merchandise received at cost `0.00`.
- Received cost ≠ cost approved for payment on the vendor invoice.
- Received cost deviates from the product's current average cost by more than a configurable tolerance
  (percent and/or absolute) — `CFG-COSTING-TOLERANCE`.
- Cost missing entirely on a receipt line.
- Migration rows imported without a cost (see `MIG-020`).

A cost exception record holds: product, location, piece/serial ref (nullable), document ref, expected cost,
actual cost, variance, trigger reason, status (`OPEN` | `AUTO_RESOLVED` | `RESOLVED` | `WAIVED`), resolver,
resolution timestamp, resulting GL entry ref.

### `COST-041` Cost exceptions — manual resolution

_Source: A2_

An "Update a Product Cost" routine: work the open-exception queue, set the correct cost, and post the
resulting inventory-value and GL adjustment. Resolution must be a single transaction that writes the ledger
row, the cost history row, and the GL entry together.

**Operational requirement:** exceptions are to be worked **daily or weekly**. Build a dashboard tile plus an
aging alert (exceptions open > N days) so this cannot silently rot — a stale cost-exception queue is how
inventory valuation goes wrong.

### `COST-042` Cost exceptions — automatic resolution

_Source: A2_

Rules-driven auto-resolution governed by `CFG-COSTING` (see `09`). At minimum: auto-resolve when variance is
within tolerance, by choosing a configured winner (`RECEIPT_COST` | `AP_INVOICE_COST` | `PRODUCT_AVG_COST` |
`LAST_COST`). Auto-resolutions still write a full audit trail with status `AUTO_RESOLVED` and the rule that
fired. Auto-resolution must never fire on a `0.00` receipt cost.

### `SEC-COST-VIEW` Restrict cost visibility

_Source: A3_

A permission — assignable to **both users and user groups** — controlling access to product cost. When
denied, cost is suppressed **everywhere**, specifically including:

- Purchase order receiving screens
- All inquiry/view screens (product, availability, activity)
- Reports and exports (the column is omitted, not blanked, in exports)
- API responses (the field is absent, not null — do not leak cost through the API while hiding it in the UI)

Implement as a server-side field-level redaction in the serialization layer. A UI-only hide is a defect.
