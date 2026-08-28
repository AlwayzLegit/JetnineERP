# Run 07 — System Administration — Batch 24: The Product Hierarchy, Twilight Pricing and Price Adjustments

Status: complete. Findings 678–693. Read-only throughout.

**`Twilight` is defined** (F680) — the sixth of the audit's thirteen undefined terms to fall, and the
last one that looked like a vendor question. It is automatic time-decay markdown on As-Is inventory,
driven by a daily batch. Also here: the three-tier product hierarchy in its own words, and
`Price Adjustment Settings`, the mass-repricing engine.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Category Settings** | 15294470775956 | read — `11.0`/`10.8`, three tabs |
| 2 | **Group Settings** | 15294470776468 | read — `11.0`/`10.8`, four tabs |
| 3 | **Collection Settings** | 15294470773140 | read |
| 4 | **Brand Settings** | 15294470776852 | read |
| 5 | **Default Product Settings** | 15294524452756 | read |
| 6 | **Twilight Pricing Overview** | 15185856231060 | read — **the definition** |
| 7 | **Price Adjustment Settings** | 15294555043092 | read — `11.0`/`10.8`, four tabs |
| 8 | **Product Type Codes** | 15294523058068 | read — **the enumeration** |

**Product Settings inventoried** (88 articles, listing read in full). Remaining named-not-read
includes a large **Configurator** family (`Base/Grade Configuration`, `Configurator Clone Process`,
`Configurator Sub-Option Rules`, `Configurator Yardage Screen`, `Fabric Configuration`,
`Fabric Group Configuration`, `Grade Description Configuration`, `Assign Options`) — the third
pricing system flagged in batch 19 §I — plus `Ashley Interface Settings` · `BAI Code Settings` ·
`Discount Costing Table` · `Factory/Extended Warranty Code` · `Freight Distribution` ·
`Gross Margin Calculator` · `Image Replication Service` · `Image Wizard Settings` ·
`Non-Inventory Products` · `Price Adjustment Clone Process` · `Twilight Discount Pricing Settings` ·
`Special Order Option Settings` + ~50 more.

---

## B. Wiring findings

### FINDING 678 — The product hierarchy is three tiers, created top-down, with a stated size expectation

- **Invariant:** categories must exist before groups, and groups before products.
- **Evidence** — `Category Settings` **and** `Group Settings`, near-identical text:
  > "Within the STORIS Inventory Management feature is the following **three-tiered hierarchy structure: product categories · product groups · products**"
  > "**Prior to creating your product records, you must create your product groups. And prior to creating your product groups, you must create your product categories.** Your product groups should be relatively descriptive. **Typical STORIS users have between twelve and twenty-five product categories. By contrast, you can have an unlimited number of product groups.**"
- **Maps to:** batch 13 F491 (Inventory Formations built from brand/vendor/category/group/product) ·
  batch 15 F528 (group/category exceptions) · W-014.

> **Batch 13 F491 recovered a five-level product hierarchy — brand → vendor → category → group →
> product — from the Inventory Formation element list. This article says the hierarchy is three
> tiers.** Both are true and they answer different questions: **category → group → product is the
> *containment* hierarchy** (each product belongs to one group, each group to one category), while
> brand and vendor are **attributes** that formations can also select on. **A rebuild should model
> three levels of containment plus two cross-cutting attributes**, not five levels.
>
> **The size guidance is unusually concrete for this documentation** — twelve to twenty-five
> categories — and it is a useful sanity check against LA Mattress's live data. A category count far
> outside that range suggests the hierarchy is being used for something other than its intent.
>
> **Collections (F685) are explicitly the escape hatch** for classification that does not fit the
> tree.

### FINDING 679 — GL accounts are set at category and group, falling through to a global default record

- **Invariant:** blank GL fields on a category or group defer to General Ledger Assigned Account Settings.
- **Evidence** — `Category Settings` **and** `Group Settings`, identical wording:
  > "**The Ledger Account Number fields on this screen are optional. If you leave blank any of the GL account fields in this Category record, your accounting system uses the default general ledger accounts set up in the `General Ledger Assigned Account Settings`.**"
  Category GL fields: `Inventory` · `Sales` · `Cost of Sales` · `Inventory Adjustment` ·
  `Line Discount` · `Line Discount Recovery` · `Special Order Zero Cost Retail` ·
  `Minimum Gross Profit` · **`Repossession Depreciations`**.
  Group GL fields: `Inventory` · `Sales` · `Cost of Sales` · `Inventory Adjustment` ·
  `Sales Line Discount` · `Sales Line Discount Recovery`.
- **Maps to:** batch 12 (locations auto-create GL cost centres) · batch 21 F640 (location → bank → GL) ·
  batch 23 F667 (credit instruments carry GL accounts) · W-052.

> **The *blank defers* idiom, applied to the chart of accounts** — and it is the cleanest instance in
> the audit, because the fall-through terminates in a named global record rather than in an implicit
> default.
>
> **The category and group field sets differ**, which matters: category has nine GL fields, group has
> six. **`Special Order Zero Cost Retail`, `Minimum Gross Profit` and `Repossession Depreciations`
> exist only at category level** — so those three postings cannot be varied by group. A rebuild
> flattening the two levels into one would silently gain three degrees of freedom STORIS does not
> have.
>
> **`Repossession Depreciations` is the third sighting of repossession** (after batch 19 F604's
> `Allow Repossession` and the Sales Security permission). **It has a GL account, so it is a posting
> event, not just a status.** The subsystem remains unread. §I.

### FINDING 680 — `Twilight` defined: automatic time-decay markdown on As-Is inventory

- **Invariant:** As-Is pieces flagged with a twilight reason code are repriced on a schedule by a daily batch.
- **Evidence** — `Twilight Pricing Overview`:
  > "**Twilight pricing is used to discount as-is products over time for items that remain unsold. Only as-is inventory is eligible for twilight pricing.**"
  > "Twilight pricing allows you to: **Automatically mark down items based on a pre-set schedule. · Automatically create labels for stores to print so that they know the piece has a new price. · Move pieces one by one into Twilight or move them en masse.**"
  > "**The twilight process in `Generate Daily Reports` checks all pieces with a twilight reason code to determine if the current selling price needs to be changed. If so, the following pricing hierarchy determines the pricing: Group · Category · Twilight Discount Pricing Settings**"
  > "**Pricing on each of the products is updated as defined in the Twilight Discount Pricing Settings during Generate Daily Reports based on the date that the item was moved into twilight pricing.**"
  `Group Settings`: > "**Note that the twilight pricing for group overrides pricing by category.**"
  Scheme fields at both levels: `Period Measurement` · `Reduction Period` · `Reduction Percent` ·
  Round To Settings (`Line Discount Rounding Method` · `Round To` · `End In`).
  Worked example, verbatim: *"reduce in price automatically by 10% every month for 2 months and then
  20% every two weeks"* → Monthly: `Period Measurement` = Months, `Reduction Period` = 2,
  `Reduction Percent` = 10; Bi-weekly: Days / 14 / 20.
- **Maps to:** **`AUDIT-CLOSEOUT.md` §"undefined terms"** — `Twilight` was one of thirteen, and one of
  seven still open · run 04 F280 (As-Is as disposition hub) · batch 5 (the batch calendar) · W-045.

> **Sixth undefined term closed, and the one that most looked like a vendor question.** The audit met
> `Twilight` as a bare field name in Inventory Control Settings and as a tab title, with no
> definition. It is **a markdown clock for damaged and floor-sample stock**: the longer a piece sits,
> the cheaper it gets, automatically.
>
> **The pricing hierarchy is group → category → Twilight Discount Pricing Settings** — a three-rung
> chain terminating in a global scheme record, with the group-beats-category rule stated explicitly
> in `Group Settings`. **That is the same group-before-category precedence found in batch 15 F522's
> lead-days rungs 7–8.** Consistent across two unrelated subsystems; a rebuild should implement it
> once.
>
> **The schedule is compositional** — the worked example stacks a monthly reduction and a bi-weekly
> one, so a scheme is a *list* of period/percent rules, not a single rate. **And the decay is
> anchored to the date the piece entered twilight**, not to a calendar, so each piece has its own
> clock.
>
> **This runs in `Generate Daily Reports`, not End of Day** — a distinct daily process the audit has
> now seen carrying business logic. **Tenth batch-calendar responsibility.**

### FINDING 681 — Twilight is activated by a reason code that matches a control setting

- **Invariant:** a piece enters twilight when its As-Is reason code equals the code named in Inventory Control Settings.
- **Evidence** — `Twilight Pricing Overview`:
  > "**Inventory Control Settings** - On the Additional Settings tab, use the **`Twilight`** field to enter **the reason code to activate twilight products.**"
  > "This can be done one at a time in `Enter a Stock Adjustment`. **If the reason code matches the `Twilight` setting in Inventory Control Settings**, the piece selling price is required and set manually."
  > "This can be done en masse via `Perform Mass Inventory Updates`. **If the reason code matches the `Twilight` setting…, the sell price update is set automatically regardless of the value in `Assign Price on As-Is items` in Point of Control Settings.**"
  > "**Point of Sale Control Settings** - The **`Assign Price on As-Is Items`** setting controls if a price is defaulted when a piece is added to as-is. **This applies to any process that changes the status of a piece from saleable to as-is**, including `Enter a Stock Adjustment`, `Twilight Inventory Adjustments` and `Mass Inventory Updates`."
- **Maps to:** batch 6 (Reason Code Settings) · run 04 F280 · batch 1 (POS Control Settings) · W-045.

> **A settings field holds a *code value*, and equality with that value is what triggers the
> behaviour.** This is a different mechanism from a boolean flag or a dedicated status — twilight is
> not a state, it is **a reason code that one setting has designated as special.**
>
> **That is fragile in an instructive way:** change the `Twilight` field in Inventory Control Settings
> and pieces already carrying the old code stop being repriced, silently, with no migration. Nothing
> in the docs warns about it. **§H**, and it is a real cutover question — LA Mattress's live twilight
> code must be identified before As-Is data is migrated.
>
> **The mass path overrides the POS setting; the single path does not.** `Perform Mass Inventory
> Updates` sets the price automatically *"regardless of"* `Assign Price on As-Is items`, while
> `Enter a Stock Adjustment` requires manual entry. **Same business event, two entry points, two
> pricing behaviours.**

### FINDING 682 — Every twilight reprice queues a label, grouped by location

- **Invariant:** moving a piece into twilight and each subsequent reprice both create Label Queue entries.
- **Evidence** — `Twilight Pricing Overview`:
  > "**When an item is moved into twilight by changing the reason code, a label is created in the label queue. Twilight pricing is updated via `Generate Daily Reports` for which a label is created via `Label Queue` to allow printing of the price changes.**"
  > "**The `Generate Daily Reports` process checks the twilight price dates and creates a Label Queue item allowing printing twilight price changes from the `Print Queued Labels` process. The Label Queue groups labels by location, allowing a store to easily print its own labels.**"
  > "From the Print Queued Labels process, **select `Twilight` from the `Source Label` section** to limit the search results…"
  > "You can print floor tags displaying twilight pricing data…You use the **`Label Matrix`** program to create the forms…"
- **Maps to:** run 06 (printing, label queues) · run 04 (floor tags) · F680 · W-064.

> **The physical world is kept in sync by a queue, not by an event.** A price change on the system is
> not a price change on the shelf until someone prints and applies a label — so **the Label Queue
> depth is a measure of how far the floor has drifted from the database.**
>
> **Location grouping is the operationally important detail:** each store prints its own. That makes
> the queue a per-location work list, and an unprinted queue at one store means **that store is
> selling at the wrong price** while the system believes otherwise.
>
> **`Label Matrix` is a third external forms tool**, alongside `Design Enhanced Laser Forms` and the
> Report Builder. §I.

### FINDING 683 — Twilight and line discounts stack, and the second is computed on the first's result

- **Invariant:** Discount 1 is twilight, Discount 2 is the line discount, and Discount 2's start price includes Discount 1.
- **Evidence** — `Twilight Pricing Overview`:
  > "In the Forms Designer, you can include any or all of the following data points for **Discount 1 and Discount 2. Discount 1 references discounts applied via Twilight Pricing, Discount 2 references discounts applied via line item discounts on sales orders. The Discount 2 start price includes calculations from Discount 1 (if present).**"
  Data fields: `line_discount1_start_price` (pre-discounted price) · `line_discount1_code` ·
  `line_discount1_description` · `line_discount1_percent` · `line_discount1_amount` ·
  `line_discount1_net_price` (initial price − discount 1 amount).
  > "**Although Twilight Discount Pricing Settings data does not appear on any STORIS report**, you can use the Design Enhanced Laser Forms and/or the Create a Report (Query Wizard Builder) routine to access the data points…"
- **Maps to:** batch 23 F668 (chain discounts compound) · the Sales Security handoff §3.1 (the
  two-axis discount model) · W-045.

> **Compounding again** — the same shape as batch 23 F668's chain discounts on the purchasing side.
> **A twilight-marked piece given a line discount is discounted twice, multiplicatively**, and the
> forms model exposes both layers separately so a document can show the customer the full markdown
> story.
>
> **These are real database field names** (`line_discount1_net_price` and siblings), which is rare —
> most of this documentation gives screen labels, not columns. **For the rebuild they are a direct
> mapping target**, and they confirm that the discount layering is materialised on the order line, not
> computed at render time.
>
> **"Does not appear on any STORIS report"** is a notable gap the vendor states plainly: twilight
> pricing is invisible to standard reporting and must be self-served through Report Builder or the
> forms designer. **So there is no out-of-the-box answer to "how much margin are we giving away to
> twilight?"** — which is a question LA Mattress will want answered.

### FINDING 684 — Reclassifying a product does not update its existing orders

- **Invariant:** changing a product's group leaves orders already carrying it unchanged.
- **Evidence** — `Group Settings`:
  > "**NOTE: If you change the product group for a product and the product appears on existing orders, the orders do not update with the change.**"
- **Maps to:** **resolve-once-and-store — twelfth instance** (batch 15 F526, batch 16 F547, batch 19
  F605/F607, batch 20 F632, batch 21 F646, batch 23 F674) · W-014.

> **The house rule reaches classification, not just values.** An order line stores the group it was
> written under, so **reclassifying the catalogue does not restate history** — which is correct for
> reporting comparability and wrong for anyone expecting a reclassification to fix past
> mis-categorised sales.
>
> **The consequence a rebuild must anticipate:** historical sales-by-group reports will not match a
> re-run after a reclassification, and both are "right". **Given that GL accounts hang off group and
> category (F679), this also means a reclassification does not change where past sales posted** —
> which is the accounting-correct behaviour and worth stating explicitly so nobody "fixes" it.

### FINDING 685 — Collections cut across the hierarchy, five per product, with a primary for sorting

- **Invariant:** a product may belong to up to five collections; the primary one is used on sorted reports.
- **Evidence** — `Collection Settings`:
  > "Use this file to **link specified products that share common characteristics**, for inquiry and reporting purposes… **Collections cross the 'top/down' inventory hierarchy** and allow you to select your product information in a more narrow and focused manner."
  > "**A product can belong to a maximum of five collections.** You can add them to a collection via the Collection Settings or the Product file. **When belonging to multiple collections, the system uses the primary collection on sorted reports.**"
  Fields: `Collection` · `Description` · `Price Point` · `Price` · `Vendor` · `Category` · `Group` ·
  `Style` · **`Discount Costing Table`** · **`Volume Rebate Table`** · `Product List` · `Image ID` ·
  `Web Benefits`.
  *"Support Files: Vendor, Product Category, Product Group, Product, **DFI Code**."*
- **Maps to:** F678 · batch 13 F491 (Inventory Formations — a **different** cross-cutting mechanism) ·
  batch 15 F528 / batch 23 F667 (discount costing, volume rebates) · batch 15 (PO cutting dates by
  collection) · W-014, W-062.

> **STORIS now has two cross-cutting product-set mechanisms** and they are not the same: **Inventory
> Formations** (batch 13 F491) are include/exclude set expressions used to *scope functions*;
> **Collections** are a merchandising grouping used for *inquiry, reporting and vendor terms*. A
> rebuild that merges them will lose the distinction between "which products does this rule apply to"
> and "which products belong together commercially".
>
> **The five-collection cap with a designated primary is a classic multivalue-database shape** — a
> fixed-length multi-value attribute with position 1 significant. **A rebuild should use an unbounded
> many-to-many with an explicit primary flag**, and note that the cap exists in the source data.
>
> **`Discount Costing Table` and `Volume Rebate Table` on a collection** mean vendor terms can be
> negotiated at collection level — so batch 23 F673's four-dimensional rebate lookup gains a fifth
> dimension. And batch 15's `PO Cutting Date` is also per-collection. **The collection is a
> commercial unit, not just a report grouping.**

### FINDING 686 — Brands can be auto-created from vendors by two different triggers

- **Invariant:** saving a new vendor may create a matching brand, either by prompt or automatically.
- **Evidence** — `Brand Settings`:
  > "**The `Brand` field is a required field in the Product settings.** Many STORIS reports sort by brand name. Also, **if you do not want the vendor name or code to print (for example on floor tags), you can print the brand name instead.**"
  > "When creating a new vendor, if the **`On-the-Fly Maintenance` field in the General System Control Settings is checked**, then when you click on Save, **the system asks if you want to create a new brand with the same code as the vendor.**"
  > "…if the **`Class` field on the Payables tab is set to `INV`**, then when you click on Save, **the system automatically creates a new brand and assigns it a code that matches the vendor code.**"
  Fields: `Brand Name` · `Description` · `Web Description` · `Available on Web` · `Show Web Price` ·
  `Retail Deck Manufacturer`.
- **Maps to:** batch 15 F521 (vendor = any payee) · batch 13 F491 (brand as a formation element) ·
  W-014.

> **Two triggers with different consent models**: `On-the-Fly Maintenance` produces a *prompt*, while
> `Class = INV` produces *silent creation*. **Both keyed on the same vendor save**, and the docs do
> not say what happens when both conditions hold.
>
> **`Class = INV` is the discriminator batch 15 F521 was missing.** That finding established the
> vendor file mixes suppliers, landlords and carriers, and recorded *"no classifying field is named"*
> as a §H gap. **`Class` on the Payables tab is the field**, and `INV` marks an inventory vendor.
> **Batch 15 F521's §H item 4 is closed.**
>
> **Brand is required on every product but auto-derived from vendor** — so in practice brand ≈ vendor
> unless someone intervenes, which explains why the two appear as separate formation elements
> (batch 13 F491) yet carry the same codes.

### FINDING 687 — Price Adjustment Settings is a staged mass-repricing engine with six targeting dimensions

- **Invariant:** an adjustment selects products six ways, applies a calculation, and is *loaded* as a separate confirmed step.
- **Evidence** — `Price Adjustment Settings`:
  > "You can apply product adjustments to: **vendor product lists, product groups, product categories, product collections, products in a district, or individual products.**"
  > "You can specify: **multiple lists of products to adjust, a period of time in which to apply the adjustment, a trailing credit amount and corresponding GL account, and a future date on which to begin applying the adjustment.**"
  > "**NOTE: Products with a `Markdown` status are not included in the price adjustment process because a specific markdown price has already been established for the product. This ensures that special pricing for markdowns are not overwritten.**"
  > "**Pricing for soft kit masters cannot be adjusted using this process. Promotional pricing is not permitted with products designated as soft kit masters.**"
  > "To load adjustments, access the Actions button on the Products tab and click on **`Load Adjustments`**. You can also use the **`Date to Load`** field to load adjustments on a future date. **Note that if you use either option, a confirmation box appears via which you must confirm you want to load adjustments.**"
  > "…the system updates the following fields on the Pricing tab of the Product file record: **`Promotion Code` · `Sale Starting Date` · `Sale Ending Date` · `Promotion Selling Price`**"
  Header: `Adjustment Code` · `Type` · **`Adjustments Loaded`** · **`Tags Printed`**.
  Import columns (A–M), with *"`Product Number` and `Adjusted Price` in bold are the only columns
  required"*.
- **Maps to:** batch 14 F506 (Markdown purchase status) · batch 14 F513/F514 (soft kits) · batch 14
  F515 (staged kit promotions) · batch 19 F611 (matrix vs promotion) · W-045.

> **The same staged shape as batch 14 F515's kit promotions**: configure → load (a confirmed,
> optionally future-dated action) → effective. **`Adjustments Loaded` and `Tags Printed` are status
> flags in the header**, so an adjustment record carries its own lifecycle — and `Tags Printed` ties
> it to the same physical-world sync problem as F682's label queue.
>
> **Two exclusions are the interesting content.** Markdown-status products are skipped *by design* so
> a permanent markdown is never overwritten by a temporary sale — which correctly implements batch 14
> F506's finding that Markdown status *activates* a dedicated price field. **Soft kit masters are
> excluded entirely**, consistent with batch 14 F514's finding that their price is derived from
> components.
>
> **`Trailing Credit Amount` with its own GL account** is vendor-funded promotion accounting — the
> retailer discounts, the vendor reimburses. **It links the pricing engine to the vendor-credit
> instruments of batch 23 F667.**

### FINDING 688 — One set of rounding rules serves three price-change paths and excludes imports

- **Invariant:** rounding method, round-to and end-in apply to price adjustments and two other repricing triggers, but not to external data loads.
- **Evidence** — `Price Adjustment Settings`:
  > "**NOTE: The following three fields are rounding options that apply when calculating: price adjustments, the new price of a product when the `Code` field on the Pricing page is changed in Advanced Product Settings, the new price of a product when the `Promotion Code` field on the District Settings tab is changed in the District and Regional Product Settings.**"
  > "**These rounding options do not apply to `Import External Data` or `RetailDeck Control Settings`.**"
  Fields: `Rounding Method` · `Round To` · `End In` · `Basis`.
  The same trio (`Line Discount Rounding Method` · `Round To` · `End In`) appears on the Twilight
  Pricing tabs of both Category and Group Settings.
- **Maps to:** F680 · batch 11 (Advanced Product Settings Pricing page) · batch 14 F510 (District tab) ·
  W-045.

> **`End In` is price-point engineering** — forcing computed prices to end in .99 or .95 — and it
> appears in **four** places: price adjustments, twilight schemes at category level, twilight at group
> level, and by reference in two other repricing paths. **A rebuild should implement one rounding
> service and let every price-producing path call it.**
>
> **The exclusion is the finding.** Prices arriving via `Import External Data` or RetailDeck **bypass
> rounding entirely**, so externally-sourced prices land unrounded while internally-computed ones are
> shaped. **That is a visible inconsistency on the shelf** and exactly the kind of thing that gets
> reported as a bug years later. Worth a deliberate decision in the rebuild rather than inheritance.

### FINDING 689 — Four product types, and Bulk changes how inventory is identified

- **Invariant:** the product type selects the inventory-tracking model; Bulk assigns one PIN per lot per storage location.
- **Evidence** — `Product Type Codes`:
  > "**Inventory** - Stock products, and/or other products you normally stock…for which you monitor and control inventory."
  > "**Non-Inventory** - Miscellaneous services that do not involve tangible goods, such as: service contracts · special-handling charges · fabric treatments. **The system does not maintain inventory counts for non-inventory products.**"
  > "**Bulk Product** - …**Instead of assigning a PIN/Reference number to each piece, the system assigns a single reference number to the lot.**… **if you receive 500 bed rails and you assign half to storage location 1A and half to storage location 1B, the system assigns one PIN number to the items in 1A and another PIN number to the items in 1B. As you add or remove pieces from the individual storage locations, the lot quantities increase or decrease accordingly.**"
  > "**NOTE: Bulk pieces - can have a bar code number. - cannot be as-is, special-ordered, or serial-tracked. - cost-out at the exact cost based on FIFO costing layers.**"
  > "**'Temporary' Special Order** - Special-order products created on-the-fly during sales order entry… **The system assigns the Special-Order (temporary) type to all new products you create on-the-fly through order processing.** Note that the `Purge Special Order & Obsolete Products` routine purges special order (temporary) products. **Therefore, if you end up stocking the item, we suggest you change the product type code to Inventory.**"
- **Maps to:** run 04 (piece-level tracking, PIN numbers) · run 04 F280 (As-Is) · batch 22 F664
  (purge qualification) · run 03 F144 (average cost) · W-014, W-061.

> **Bulk is a different data model, not a flag.** Every other product type tracks pieces individually
> — which run 04 established is the basis of the entire picking, damage and As-Is machinery. **Bulk
> replaces the piece with a lot keyed by storage location**, so quantity becomes a number that goes up
> and down rather than a set of PINs.
>
> **Three capabilities are lost as a direct consequence** and the docs list them: bulk cannot be
> As-Is, special-ordered, or serial-tracked. **That is coherent** — all three require identifying an
> individual piece — and it means **bulk products are outside the As-Is disposition hub entirely**
> (run 04 F280), and outside twilight pricing (F680), which requires As-Is.
>
> **"Cost-out at the exact cost based on FIFO costing layers" is a significant exception to run 03
> F144.** The audit's headline chain is that orders are written at *average* cost and later restated.
> **Bulk products cost out at exact FIFO cost instead** — so for bulk, margin is *not* provisional.
> **A rebuild must carry two costing paths.** §H — this deserves confirmation against live data since
> it changes the margin story for a whole product class.
>
> **The temporary special-order type is a self-cleaning population** (batch 22 F664) with a documented
> footgun: stock the item and forget to reclassify, and the purge deletes it.

### FINDING 690 — Non-inventory products cannot belong to foreign vendors

- **Invariant:** creating a non-inventory product errors when the home currency is not the domestic country's.
- **Evidence** — `Product Type Codes`:
  > "**NOTE: Non-inventory products cannot be assigned to foreign vendors. If the `Home Currency` field in General System Control Settings is set to a country other than the domestic country, an error is received when creating a non-inventory product.**"
- **Maps to:** batch 15 F537 (`Currency`, `Update Exchange Rate` on the vendor) · batch 20 F626 ·
  F689 · W-014.

> **A currency constraint expressed as a product-type restriction**, and the wording is odd enough to
> flag: the trigger is `Home Currency` being *"set to a country other than the domestic country"* —
> which conflates a currency field with a country concept.
>
> **The practical reading is that services cannot be purchased in a foreign currency**, presumably
> because non-inventory products have no landed-cost machinery to revalue. **For LA Mattress this is
> probably inert** — a US retailer with USD home currency — but it should be confirmed rather than
> assumed, since it would block a whole class of vendor relationship.

### FINDING 691 — Group settings hold the second level of the routing capacity hierarchy

- **Invariant:** delivery volume, weight and unload time are defined at group as a middle rung under Route Mapping Control Settings.
- **Evidence** — `Group Settings`, Routing section:
  > "**These fields make up the second level of the hierarchy mentioned in the `Route Mapping Control Settings`, the purpose of which is to allow a broad definition of capacities and unload times.**"
  Fields: `Delivery Volume` · `Capacity Weight` · `Unload Time` · `Shipping Volume`.
- **Maps to:** batch 3 (Route Capacity / Route Mapping Control Settings) · run 04 (route capacity,
  manifest building) · W-059.

> **Batch 3 read the route capacity control records and could not say where the per-product numbers
> came from. They come from the product group** — a middle rung between the global control settings
> and, presumably, the individual product.
>
> **This is why route capacity works at all without per-SKU data entry:** a retailer sets volume and
> unload time once per group ("sofas", "mattresses") and every product inherits it. **A rebuild
> should keep the group-level default rather than requiring per-product dimensions**, which is the
> obvious but much more expensive design.
>
> `Shipping Volume` alongside `Delivery Volume` implies **two different cube figures** — one for
> truck loading, one for delivery capacity. Their difference is not explained. §H.

### FINDING 692 — Automatic stock replenishment reads a five-warehouse cascade at category and group

- **Invariant:** five ordered source warehouses plus target locations are configured at both hierarchy levels.
- **Evidence** — `Category Settings` **and** `Group Settings`, identical:
  > "These fields are used with the **Automatic Stock Replenishment** feature. **You can set replenishment locations in several settings screens. See the `Automatic Stock Replenishment for Locations` topic for more information and the hierarchy in which locations are checked for available stock.**"
  Fields: `First Warehouse` · `Second Warehouse` · `Third Warehouse` · `Fourth Warehouse` ·
  `Fifth Warehouse` · `Target Location(s)`.
- **Maps to:** batch 15 F518 (Stock Location Schema — ordered sourcing) · batch 15 F529 (auto PO
  replenishment) · W-016, W-055.

> **A third ordered-sourcing mechanism**, after Stock Location Schema (batch 15 F518) and the
> distribution/routing schemas. **Five positional slots rather than a promotable list** — the same
> fixed-length multivalue shape as F685's five collections.
>
> **`Automatic Stock Replenishment for Locations` names the precedence article** and it is unread —
> which matters, because with replenishment sources configurable at category *and* group *and*
> (per that article's title) locations, **there is a resolution order the audit does not have.** §H.
>
> **This is distinct from purchase-order replenishment** (batch 15 F529, `Auto PO Replen`): that buys
> from vendors, this transfers between warehouses. **Two replenishment engines**, and a rebuild must
> not conflate them.

### FINDING 693 — Product IDs can be auto-generated from a composable format defined at group or globally

- **Invariant:** a dynamic identifier is assembled from ordered components plus a sequential counter.
- **Evidence** — `Group Settings`, Product Identifier tab:
  > "Use this tab to establish **format preferences for auto-generation of product ID's at the product group level. To establish these settings at the global level, use the Product Identifier tab of `Inventory Control Settings`.**"
  > "If you select **`Dynamic Identifier`** at the `Format` field, use this section to define the format and components of the auto-generated product code."
  Fields: `Format` · `Sequential Counter` · `Maximum Length` · `Fixed Length` · `Components` ·
  `Current Combined Component Length` · `Maximum Identifier Length` · Grid ·
  **`Promote/Demote`** · **`Add Product Attribute`** · **`Add Text`**.
- **Maps to:** batch 18 F595 (customer numbering collision) · batch 15 F518, F593 (Promote/Demote
  ordering) · W-014.

> **A fourth Promote/Demote ordered list**, and here the order defines a *string format* — components
> are concatenated in sequence, with `Current Combined Component Length` warning against overflow.
>
> **`Add Product Attribute` means the identifier can encode data** — brand, category, a style code —
> which makes product numbers self-describing and therefore **unstable if the attribute changes**.
> Nothing says what happens if a product's category changes after its ID was generated from it.
> **§H**, and it pairs with F684: the group change does not propagate, and presumably neither does the
> ID.
>
> **Two levels, group overriding global**, consistent with the rest of the hierarchy — and
> **contrast batch 18 F595**, where *customer* numbering has no such machinery and collides with the
> ticket sequence. **STORIS solved the numbering problem for products and not for customers.**

---

## C. Screen and field inventory (additions)

`Category Settings` tabs: **General · Twilight Pricing · User Defined Settings**. Additional General
fields: `Active` · **`Inventory Family`** · `Non-Inventory` · `Action Required`.
`Group Settings` tabs: **General · Twilight Pricing · Product Identifier · User Defined Settings**.
Additional Other fields: `Retail Deck Minor` · `Lead Tracked Management` · `Merchandise Interest` ·
**`Allow As-Is POS Scan`** · `Return Restriction Days` · `Return Restriction Reason Codes` ·
`Installation Charge` · `Special Order Zero Cost Retail` · `Minimum Gross Profit` ·
`Depreciate Repossessions` · **`Reduce Customer Returns ___ %`** · `Restocking Fee on Returns %` ·
**`Repossessable`**. Contact Management fields are gated by *"the Lead Information tab in the
`Sales Lead System Control Settings`"*.
`Default Product Settings`: `PO from Order Entry` · `Serial Tracked` · `National Tax Exempt` ·
**`Velocity`**.

> **`Velocity` appears as a defaultable product attribute** — third sighting after batch 14 F504
> (product×location) and batch 15 F535 (storage location). **Still undefined at all three.**

---

## D. Control settings catalog (additions)

| Setting | Record | Decides |
|---|---|---|
| `Twilight` | **Inventory Control Settings › Additional Settings** | The reason code that activates twilight repricing (F681) |
| `Assign Price on As-Is Items` | POS Control Settings | Whether a price defaults on As-Is entry; overridden by mass update (F681) |
| `On-the-Fly Maintenance` | General System Control Settings | Prompts to create a brand from a new vendor (F686) |
| `Class` = `INV` | Vendor Settings › Payables | **Silently** creates a matching brand; classifies inventory vendors (F686) |
| `Home Currency` | General System Control Settings | Blocks non-inventory products for foreign vendors (F690) |
| Product Identifier tab | Inventory Control Settings | Global product-ID format, overridden at group (F693) |
| General Ledger Assigned Account Settings | *(record)* | Terminal default for category/group GL fields (F679) |

---

## F. State machines and enumerations (additions)

**Product Type** — four values: `Inventory` · `Non-Inventory` · `Bulk Product` ·
`'Temporary' Special Order` (F689).

**Twilight pricing hierarchy** — Group → Category → Twilight Discount Pricing Settings (F680).

**Discount layers on a line** — Discount 1 (twilight) then Discount 2 (line discount), compounding
(F683).

---

## G. Sequencing rules (additions)

**Group beats category** — twilight pricing (F680), matching the group-before-category order in
batch 15 F522's lead-days rungs. **Consistent across two subsystems.**

**Blank defers to a named global record** — category/group GL accounts → General Ledger Assigned
Account Settings (F679).

**Resolve once, store the answer — twelfth instance**: product group changes do not update existing
orders (F684).

**Ordered fixed-length slots** — five collections with a primary (F685); five replenishment
warehouses (F692). A multivalue-database shape distinct from the promotable lists.

**Compounding discounts — second domain**: twilight then line discount (F683); cf. chain discounts on
purchasing (batch 23 F668).

---

## H. Open questions and gaps

1. **Bulk products cost out at exact FIFO, not average** (F689). This is an exception to run 03
   F144's headline chain — **margin is not provisional for bulk**. Confirm against live data; it
   means two costing paths.
2. **Changing the `Twilight` reason code in Inventory Control Settings orphans existing twilight
   pieces** (F681). No migration, no warning. **A cutover question: what is LA Mattress's twilight
   code?**
3. **Replenishment source precedence across category, group and location is unread** (F692) —
   `Automatic Stock Replenishment for Locations` names it.
4. **`Delivery Volume` vs `Shipping Volume`** (F691) — two cube figures, difference unexplained.
5. **Product IDs can encode attributes that later change** (F693). No stated behaviour.
6. **Both brand auto-creation triggers can hold at once** (F686) — prompt and silent creation.
7. **Twilight pricing appears on no STORIS report** (F683) — no built-in answer to "what is twilight
   costing us".
8. **Externally-imported prices bypass rounding** (F688).

**Resolved this batch**

9. **`Twilight` is defined** (F680). **Sixth of the thirteen undefined terms closed.** Six remain:
   fly-by fulfillment · `Float Label` · `Ship Direct` (on a transfer) · `CFO Fields` ·
   `Bypass Interim` · `Times per Day` · dollars-only adjustment · `Velocity`.
10. **Batch 15 F521 §H item 4 is closed** (F686). The vendor-classifying field is `Class` on the
    Payables tab; `INV` marks an inventory vendor.

**Inferences**

- **I-109** — `Inventory Family` on Category Settings is likely a higher grouping above category, but
  **it is named and never described.** Not adopted.
- **I-110** — the two brand-creation triggers probably do not both fire (the `Class = INV` path likely
  supersedes the prompt). **No support in the text.**

---

## I. Unknown unknowns

- **The Configurator family** — eight unread articles (`Base/Grade Configuration`, `Fabric
  Configuration`, `Grade Description Configuration`, `Configurator Sub-Option Rules`, yardage,
  cloning). Batch 19 F608 established it is a **third pricing system with its own overrides and a
  `graded price`**. This is the largest unread coherent subsystem left in run 07.
- **`Label Matrix`** (F682) — a third external forms tool.
- **Repossession has a GL account** (F679 `Repossession Depreciations`, plus `Depreciate
  Repossessions` and `Repossessable` at group). **Fourth sighting; still no descriptive article.**
- **`Sales Lead System Control Settings` / InTouch CRM** (§C) — group settings carry contact-management
  fields gated by it. The CRM subsystem remains unread (batch 16 §I).
- **`Reduce Customer Returns ___ %`** (§C) — a group-level returns reduction with no explanation.

---

## J. Glossary (additions)

| Term | Plain description |
|---|---|
| **Twilight pricing** | Automatic scheduled markdown of unsold As-Is pieces, run by Generate Daily Reports |
| **Twilight reason code** | The As-Is reason code named in Inventory Control Settings that activates twilight |
| **Collection** | A cross-hierarchy merchandising grouping; max five per product, one primary |
| **Bulk product** | A type tracked by lot-per-storage-location rather than by piece; FIFO costed |
| **Trailing credit** | Vendor reimbursement of a promotional discount, with its own GL account |
| **`End In`** | Price-point rounding — forcing computed prices to end in chosen digits |
| **Dynamic Identifier** | An auto-generated product code assembled from ordered components |

---

## Contract adjudication — batch 24

| Contract | Verdict | Basis |
|---|---|---|
| **W-014** *(product master)* | **CONFIRMED — three tiers plus cross-cutting sets** | F678, F685 |
| **W-045** *(pricing)* | **CONFIRMED — and twilight is a distinct engine** | F680–F683, F687, F688 |
| **W-052** *(GL)* | **CONFIRMED** | Category/group accounts falling through to a global record (F679) |
| **W-061** *(cost)* | **CONTRADICTED in part** | Bulk costs at exact FIFO, not average (F689) |
| **W-041** *(batch calendar)* | **CONFIRMED — tenth responsibility** | Generate Daily Reports drives twilight (F680) |
| **W-055 / W-016** *(replenishment)* | **CONFIRMED — two engines** | Warehouse cascade vs auto PO replen (F692) |
| **W-059** *(routing)* | **CONFIRMED — second-level capacities found** | F691 |
| **W-062** *(vendor terms)* | **CONFIRMED — a fifth dimension** | Discount costing and rebate tables at collection level (F685) |
| **Time-decay pricing** | **NEW — no contract covers it** | F680 |
| **Lot-based inventory identity** | **NEW** | F689 |

---

## Next — batch 25

**System Control Settings tail** (~71 unread) — the remaining control records, each a potential
cross-module gate: `Purchasing Control Settings` · `Collections Processing Control Settings` ·
`Revolving Receivables Control Settings` · `Accounts Receivables Control Settings` ·
`Sales Lead System Control Settings` · `API Control Settings` · `Twilight Discount Pricing Settings`.
