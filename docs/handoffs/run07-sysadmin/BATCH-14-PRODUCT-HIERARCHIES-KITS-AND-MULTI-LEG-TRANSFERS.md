# Run 07 — System Administration — Batch 14: Product Hierarchies, Kits, and Multi-Leg Transfers

Status: complete. Findings 501–520. Read-only throughout.

**This batch closes three things at once.** (1) The **three-level product hierarchy** —
Warehouse → District/Regional → Advanced — is now confirmed from *both* endpoints with verbatim
text, for *two different* resolved values. (2) The **kit model** is fully enumerated: two kit
kinds, four price sources, and a commission rule that inverts between them. (3) The
**multi-legged transfer model**, which the audit recorded as its single unreachable article
(`Multi-Legged Transfers Flow Chart Overview` — a flow-chart image with no text alternative),
is **recovered from its two settings records** without guessing at the picture.

---

## A. Coverage log

| # | Article | id | Section | Status |
|---|---|---|---|---|
| 1 | **Stock Location Schema** | 15243029362452 | Vendor Settings | read |
| 2 | **Warehouse Inventory Settings** | 15243033214228 | Vendor Settings | read |
| 3 | **District and Regional Product Settings** | 15294470776724 | Product Settings | read |
| 4 | **Product Kit Settings** | 15294525112980 | Product Settings | read |
| 5 | **Kit Promotion Settings** | 15294524798740 | Product Settings | read |
| 6 | **Hard and Soft Kit Rules** | 15294522839828 | Overviews › Rules | read (followed link) |
| 7 | **Component Priced Kits** | 15294468994196 | Product Settings | read (followed link) |
| 8 | **Substitute Product List Settings** | 15294469614100 | Product Settings | read (followed link) |
| 9 | **Distribution Status Settings** | 15243030408724 | Vendor Settings | read (followed link) |
| 10 | **Purchase Status Settings** | 15294525105812 | Product Settings | read (followed link) |
| 11 | **Purchase Statuses** | 15185875939860 | Overviews › References | read (followed link) |
| 12 | **Schedule Purchase Status** | 15294523057300 | Product Settings | read |
| 13 | **Set Product Purchase Status by Region** | 15234738565396 | System Administration (nested) | read |
| 14 | **Maintain Distribution Location Schema** | 15238491486996 | Inventory Mgmt › Transfers | read (followed link) |
| 15 | **Maintain Transfer Security for Multiple Locations** | 15238491484564 | Inventory Mgmt › Transfers | read (followed link) |

Two of the fifteen (`Product Kit Settings`, `Warehouse Inventory Settings`) carry the
**`11.0` / `10.8`** version badges; the rest are unversioned.

Duplicate title noted: **`Product Kit Settings`** exists twice in the help centre —
`360035377291` (legacy) and `15294525112980` (current). Only the current one was read.

---

## B. Wiring findings

### FINDING 501 — Warehouse Inventory Settings is a product×location record that the receiving process creates for you

- **Invariant:** the location-level product record is a *side effect of receiving*, not a setup step.
- **Evidence** — `Warehouse Inventory Settings`:
  > "Use this routine to specify certain pricing and inventory information **by location** for selected products. First, specify a location. Second, specify one or more products… Then, **when one or more of the products appear on an order at the selected location, the system applies the specifications you enter here** (for example, selling price)."
  > "**NOTE: Warehouse inventory records generate automatically when you use inventory receiving programs such as Receive a Purchase Order.** If you don't use Location Tracking, you can use this routine to identify the **storage location** where you usually stock each product in each warehouse/store location."
- **Maps to:** W-014, W-055 · run 04 receiving batches · batch 12 (Warehouse/Store Location Settings).

> **For the rebuild this is a data-model fact, not a settings fact.** There is a
> `(location, product)` row that comes into existence the first time stock lands, and that row is
> *the* carrier of location-level selling price, stock levels, velocity, storage category and
> distribution status. A rebuild that models these as columns on the product will get the wrong
> answer at every multi-location decision.
>
> The second sentence is the fallback for sites without Location Tracking: this row also holds the
> **default bin**. Two mechanisms, one field, chosen by whether a licensed module is on.

### FINDING 502 — Min/max/safety exist at three levels, and only one of them is seeded

- **Invariant:** the product-level stock levels are copied down **once**, at first receipt, and never again.
- **Evidence** — `Warehouse Inventory Settings`:
  > "You can also use this file to set maximum, minimum, and/or safety stock levels for each product/location combination. Note that **the first time you receive inventory for a product into the system, if minimum and safety quantities have been set in the Advanced Product Settings, those settings default here. Otherwise, these fields remain blank until you modify them using this program.**"
  Fields: `Stock Level Quantity` — `Maximum` · `Minimum` · `Safety`.
  And `District and Regional Product Settings`, Regional tab, carries the *same triple*:
  > "`Stock Level Quantity` — `Minimum` · `Maximum` · `Safety`"
- **Maps to:** batch 11 F461–F474 (Advanced Product Settings) · W-055.

> **This is a seeded copy, not a fall-through.** Every other three-level structure the audit has
> met (16+ of them) resolves at read time by walking up until a value is found. Stock levels do
> not: the product-level value is **copied into the location row once**, at first receipt, and from
> then on the two are independent. Change the Advanced Product Settings minimum afterwards and
> nothing downstream moves.
>
> The regional triple is a *third* copy with no stated relationship to either. **The docs do not
> say** which of warehouse-level and region-level wins for replenishment, nor whether the regional
> triple seeds the warehouse triple. Recorded in §H.

### FINDING 503 — The distribution-status hierarchy, confirmed verbatim from both ends

- **Invariant:** distribution status resolves **Warehouse Inventory → District/Regional → Advanced Product**, and applies only to three inventory types.
- **Evidence** — `Warehouse Inventory Settings`:
  > "The following three fields can be used **only with products whose Inventory Type is set to `Retail Inventory`, `Retail Part`, or `Retail Labor`**. These settings can also be established in District and Regional Product Settings and/or Advanced Product Settings. **The system uses the standard product hierarchy to determine a product's distribution status, checking for these settings in the following order: Warehouse Inventory Settings, District/Regional Product Settings, and then Advanced Product Settings.**"
  `District and Regional Product Settings` repeats the sentence **word for word** under its Distribution heading.
  Fields at both ends: `Current Status is` · `On this Date, Change Status to`.
- **Maps to:** batch 11 **F464** (which found the sentence at the Advanced end only) — **now confirmed
  from the other two rungs**; W-014.

> **Both endpoints of a hierarchy stating the same order is the strongest evidence this audit gets.**
> Batch 11 recorded the chain from one article and flagged it as needing corroboration. It is
> corroborated.
>
> Note the **type gate**: the hierarchy is inert for any product that is not `Retail Inventory`,
> `Retail Part` or `Retail Labor`. Special-order, non-inventory and service products have no
> distribution status at any level. That is a *fourth* outcome beyond "found at rung 1/2/3" and a
> rebuild needs it as an explicit branch.

### FINDING 504 — Directed putaway matches two independent product attributes against two location attributes

- **Invariant:** putaway is a matching problem over `Velocity` and `Storage Category`, and both are stored at the location row.
- **Evidence** — `Warehouse Inventory Settings`:
  > "The following two settings, **`Velocity`** and **`Storage Category`**, are used by the **directed putaway process** to **attempt to match** the product's velocity setting with the storage location's velocity and/or the product's storage category with the storage location's storage category."
- **Maps to:** batch 12 (Warehouse/Store Location Settings — the location half) · run 04 WMS batches · W-056.

> **"Attempt to match" and "and/or" are both load-bearing.** The docs decline to say what happens
> when neither matches, whether one dimension outranks the other, or whether a match is required or
> merely preferred. This is the third putaway-adjacent routine the audit has read and the third
> time the tie-break is unstated. Recorded in §H as a **vendor question**, not a reading gap.

### FINDING 505 — Purchase status uses the same three-level hierarchy, but its middle rung is conditional

- **Invariant:** purchase status resolves Warehouse → District/Regional **(only if Regional Processing is active)** → Advanced.
- **Evidence** — `Purchase Statuses`:
  > "**Search Hierarchy** — To establish a purchase status, the order-entry processes search the following routines in the following order, **assigning the first purchase status found**: **Warehouse Inventory Settings · District and Regional Product Settings (if Regional Processing is active on your system) · Advanced Product Settings**"
  > "You can reference the purchase status to a product from the following processes: **Advanced Product Settings (Settings tab) · District and Regional Product Settings (Region tab) · Warehouse Inventory Settings**"
  > "**The Purchase Status field in the Advanced Product Settings is a required field while the other purchase status fields are optional.** When you create a new product, the system defaults the Active purchase status."
- **Maps to:** F503 (same three rungs, same order) · batch 6 (Regional Processing) · W-014, W-016.

> **Two different values now provably share one hierarchy.** That makes "the standard product
> hierarchy" a named, reusable resolver in STORIS rather than a coincidence of two screens — which
> is exactly the kind of wiring this audit exists to find. A rebuild should implement it **once**.
>
> Two refinements the distribution-status statement does not have:
> - **The bottom rung is mandatory.** Advanced Product Settings' purchase status is required, so the
>   walk **cannot fall through to nothing**. Distribution status has no such guarantee.
> - **The middle rung disappears** when Regional Processing is off — a licensed/flagged module
>   silently changing the length of a resolution chain. Batch 6 established Regional Processing as
>   a system-wide switch; this is the first place the audit sees it **remove a rung from a lookup**.

### FINDING 506 — Six purchase status types, each with distinct order-entry consequences

- **Invariant:** purchase status is a closed set of six *types*; user codes are aliases that inherit a type's behaviour.
- **Evidence** — `Purchase Statuses`:
  > "STORIS has **six standard purchase status types**… In addition, **you can create your own purchase statuses, each of which must be based on an existing purchase status type and thus share its characteristics** (the Purge status is not available for this purpose)."

| Code | Type | On purchase orders | On sales orders | Side effect |
|---|---|---|---|---|
| **A** | Active | yes | yes | *"This is the default purchase status."* |
| **D** | Dropped | yes, but *"you cannot create the PO via sales order entry"* | *"You cannot oversell dropped items"* | activates `Markdown Price` in Advanced Product Settings |
| **M** | Markdown | yes | yes | *"Identical to the Active status, except that it also activates the Markdown Price field"* |
| **O** | One-Time-Buy | yes | yes | *"You cannot back-order one-time-buy products, nor can they be special-order products"* |
| **P** | Purge | no | *"cannot… oversell"* | *"You cannot edit this status using this field"* — set only by the purge process |
| **T** | Discontinued | *"cannot add it to new purchase orders"* | *"cannot… oversell"* | activates `Markdown Price` |

  > "The **Purge Special Order & Obsolete Products** process purges 'obsolete' products, which are products with a purchase status of **D (dropped), T (discontinued), or P (purge status)**."
  > "For products with a purchase status that prohibits overselling on sales orders, **if the products are on a transfer, you cannot add them to an order until the transfer is complete and the products return to inventory.**"
  > "**Purchase statuses do not appear on eSTORIS.**"
- **Maps to:** W-016, W-023 · run 03 order-entry batches · batch 11 (Markdown Price).

> **Three separate things are riding on one field**, and a rebuild that treats it as a simple
> lifecycle flag will lose all three:
> 1. **A capability matrix** — the PO/SO/oversell grid above.
> 2. **A UI activation** — three of the six *turn a pricing field on*. `Markdown Price` is not
>    independently editable; its editability is a function of purchase status.
> 3. **A purge selector** — D, T and P are the purge process's input set, so setting a status is
>    also scheduling a deletion.
>
> The transfer sentence is a genuine cross-module rule: **in-transit stock does not count as
> available for a status-restricted product**, so the same product is orderable or not depending on
> whether a transfer is open. That is a *runtime* condition on a *static* setting.

### FINDING 507 — Purchase statuses can be hidden from named users and groups — a data-level visibility control

- **Invariant:** a code table row carries a user/group suppression list, and it self-heals on deletion.
- **Evidence** — `Purchase Status Settings`:
  > "Use this routine to maintain the **six purchase status 'types' that come delivered with STORIS**, as well as any user-defined purchase status 'codes' you create using this routine."
  > "**You cannot delete existing purchase statuses, and you can edit only the two Description fields.**"
  Fields: `Purchase Status` · `Description` · `Short Description` · `Type` ·
  **`Suppress from Product Search for:`** — **`User`** · **`User Group`**.
  > "**NOTE: When a user or a user group is deleted via Create a User or Create a User Group, the system reviews all purchase status codes and removes that user and/or user group from the purchase status settings.**"
- **Maps to:** batches 7–9 (the ten security records, ~360 permissions) · W-050.

> **This is access control that does not live in the security records.** Batches 7–9 catalogued six
> kinds of access control and flagged a seventh (`File Security Groups` / `Field Security Codes`).
> This is an **eighth shape**, and unlike the others it is stored *on the data row* rather than on
> the user: the purchase status knows who cannot see it.
>
> The consequence for a rebuild is that **"what can this user find in Product Search?"** cannot be
> answered from the permission model alone — you must also join the code table. The user-facing
> effect is subtle and confusing by design: the product is not hidden, only products *in that
> status* are, so two users searching the same term get different result counts with no error.
>
> The self-healing note is the **opposite policy** from batch 13 F494, where deleting an inventory
> formation *silently rewrote* its consumers, and from run 04 F173, where deleting a handling
> method was *referentially blocked*. **Three deletion policies in one system**, now catalogued.

### FINDING 508 — Two independent "change this status on a date" mechanisms, both drained by batch jobs

- **Invariant:** scheduled status changes are stored as pending rows and consumed — and erased — by a batch process.
- **Evidence** — `Schedule Purchase Status`:
  > "Use this screen to **schedule purchase status changes on a specific date**. Once the **Scheduled Settings Update** process runs, the purchase status on the selected product changes and **the data on this screen is removed**."
  > "**NOTE: The read-only version of this screen appears when accessed through a view-only version of the routine, such as View Advanced Product Settings.** In this version, you may only view the currently available selection(s)."
  Fields: `Current Status is` · `On This Date` · `Change Status To`.
  The **same three field names** appear for *distribution* status in `Warehouse Inventory Settings`
  and `District and Regional Product Settings` (F503).
- **Maps to:** batch 5 (the batch calendar) · run 03 F153 (End of Day releases credit holds) · W-041.

> **The audit's house rule holds again: in STORIS, the batch calendar is business logic.** A
> scheduled status change is not a timer — it is a row that a named nightly process finds and
> consumes. Nothing happens on the date if the process does not run, and the pending row is
> **destroyed** once it does, so there is no audit trail of the change on this screen.
>
> **`Scheduled Settings Update` is a newly named process** and joins End of Day, End of Month and
> `Generate Monthly Reports` on the list of jobs that carry business meaning. It is not in any
> batch-calendar article the audit has read. Added to §I.
>
> The read-only note is a **generalisable UI rule**, not a purchase-status fact: view-only wrappers
> substitute read-only versions of the sub-screens they open. The audit met this shape in batches 7–9
> as `View …` permissions; here is the mechanism.

### FINDING 509 — Distribution status decides sourcing *and* cross-location reservation, and its behaviour field is immutable

- **Invariant:** the code's `Inventory Availability` is fixed at creation; changing behaviour means creating a new code.
- **Evidence** — `Distribution Status Settings`:
  > "Use this routine to create and maintain **distribution status codes** that you can assign to products. The codes assigned to products are then used by **sales order, exchange, and transfer entry** to determine **where merchandise is coming from (stock location)** and **whether or not it can be reserved at locations other than the selling location**."
  > "**NOTE: When you edit an existing status code, only the Short and Long Description fields can be changed. The `Inventory Availability` field is not available for change; you can create a new status code and delete the old one.**"
  Fields: `Distribution Status` · `Short Description` · `Long Description` · **`Inventory Availability`**.
- **Maps to:** F503 · batch 2 F353–F365 (the reservation model) · W-055, W-056.

> **One field, two decisions.** Distribution status answers *"which location's stock?"* and
> *"may another location's stock be reserved?"* — sourcing and reservation-scope in one code. Batch 2
> built the reservation model without this input; the model is now one field larger.
>
> The immutability note is a **rebuild-critical design rule**: STORIS deliberately prevents
> retroactive behaviour change on a code that products already reference. Descriptions are cosmetic
> and editable; behaviour is not. **Every code table the audit has read should be re-examined for
> this split** — it is the difference between a label and a contract.
>
> `Inventory Availability`'s **value list is not published** in this article. One value is known
> from elsewhere — see F517.

### FINDING 510 — District and Region are two different partitions of the same locations, carrying different data

- **Invariant:** district governs selling, region governs stocking; they are separate axes, not levels of one axis.
- **Evidence** — `District and Regional Product Settings`:
  > "Tabs: **District, Regional**"
  > "Use this tab to apply **sales-oriented** information to products **by district**." → `District` · `Selling Price` · `Suggested Retail Price` · `Markdown Price` · `Spiff Amount` · Promotional Pricing (`Promotion Code` · `Starting Date` · `Ending Date` · `Promotional Price`) · `Commission Percent` · `Spiff Amount` · `Reward Factor` · `Reward Indicator`
  > "Use this tab to apply **inventory and purchasing-related** information to products **by region**." → `Region` · `Merchandising` · `Stock Level Quantity` (Min/Max/Safety) · `Purchase Status` · `Date` · `Purchase Lead Days` · Reservation · Costing · Distribution
- **Maps to:** batch 6 (Regional Processing) · batch 12 (locations) · batch 4 (rewards) · W-016, W-046.

> **The screen's name hides the most important fact about it.** "District and Regional" reads as one
> concept at two grains. It is not. **A district is a sales grouping and a region is a stocking
> grouping**, and a location belongs to both independently. Price, commission, spiff and reward
> factor vary by *district*; stock levels, purchase status, lead days, reservation, landed cost and
> distribution status vary by *region*.
>
> This is why the hierarchy sentence in F503/F505 says **"District/Regional"** with a slash and both
> resolvers name the *Regional* tab: **the district tab is not in the fall-through at all.** It is a
> pricing overlay. A rebuild that models one geography will produce wrong prices or wrong
> replenishment — and probably both.
>
> Note `Reward Factor` and `Reward Indicator` on the district tab: batch 4 closed the rewards model
> from `Membership Reward Settings` without knowing rewards could **vary by district**. That is a
> **correction by addition** to batch 4, recorded in §H.

### FINDING 511 — The reservation hierarchy confirmed, with its four methods enumerated

- **Invariant:** two fields combine to select one of four reservation methods, settable at three levels.
- **Evidence** — `District and Regional Product Settings`:
  > "Use these fields to determine the **reservation method** to be used. The **`Reservation Priority`** and **`Reservation Date`** fields **work in conjunction with each other** and together they offer the following reservation methods:
  > · Prioritize by **Product Setting** & reserve by **Product Setting** (**If you select `Use Product Setting` at Reservation Priority you must also select `Use Product Setting` at Reservation Date.**)
  > · Prioritize by **Ordered Date** & reserve by **Delivery Date within Auto Fill Days** (fill period)
  > · Prioritize by **Delivery Date** & reserve by **Delivery Date within Auto Fill Days** (fill period)
  > · Prioritize by **Ordered Date** & reserve by **Delivery Date within Auto Fill Days** (fill period)"
  > "You can also establish these settings **at the product level via Advanced Product Settings and/or globally via Inventory Control Settings**."
- **Maps to:** batch 2 **F353** — **chain now closed** (region → product → system) · W-055.

> **Batch 2 built the reservation model from the system end; this is the regional end, and the two
> agree.** The three-rung chain region → product → system is now stated from both directions.
>
> **The source lists four bullets but only three distinct methods** — bullets 2 and 4 are
> character-for-character identical (*"Prioritize by Ordered Date & reserve by Delivery Date within
> Auto Fill Days"*). This is a **documentation defect**, not a hidden fourth mode: a plausible
> reading is that one bullet should say *Requested Date* or *Available Date*, but **the audit will
> not guess**. Recorded in §H under *documented but ambiguous*.
>
> The parenthesised rule is a **paired-field constraint**: `Use Product Setting` is not independently
> selectable on the two fields — choosing it on one forces it on the other. A rebuild needs this as
> a validation, not a default.

### FINDING 512 — Landed-cost add-ons are labelled centrally and valued regionally

- **Invariant:** the add-on cost *rows* are defined once in Costing Control Settings; their *amounts* are entered per region.
- **Evidence** — `District and Regional Product Settings`:
  > "Use the following fields to specify **add-on landed costs** such as **duties, tariffs, additional freight, broker's fees, and overhead costs**."
  > "**These fields, including the add-on labels (`DUTY`, `UPCHARGE`, etc.) for each row, are defined in the Costing Control Settings.**"
  Fields: `Freight Cost $` · `Freight Factor is` · `Type` · `Amount`.
- **Maps to:** batch 1 (Costing Control Settings) · W-061, W-062.

> **A vendor-owned label with a site-owned value — the audit's recurring code-table idiom, applied to
> costing.** Batch 1 read Costing Control Settings and catalogued the label slots; it could not say
> where the numbers went. They go here, per region, per product.
>
> The practical consequence: **landed cost is regional**, so the same product has different costs in
> different regions and therefore different margins on identical orders. Any margin calculation in a
> rebuild must take region as an input.

### FINDING 513 — Hard and soft kits invert the commission rule

- **Invariant:** hard-kit commission comes from the master and ignores components; soft-kit commission comes from components and ignores the master.
- **Evidence** — `Hard and Soft Kit Rules`:
  > "**Commissions for hard kits calculate based on the commission percentages (if any) set up for the kit master only. The calculation ignores any commissions set up for a hard kit's components.**"
  > "**Commissions for soft kits calculate based on commission percentages (if any) set up for kit components only. The calculation ignores any commissions set up for the soft kit master.**"
  The same inversion governs discounts:
  > "If a product discount is applied to a **hard** kit, the discount code must be added to the **kit master item**… If a product discount is applied to a **soft** kit, the discount code must be added to the **kit component items**. **The soft kit master record does not allow adding a discount code.**"
  > "Only soft kits with the Source of Price set to **Product** in Product Kit Settings are considered. **Kits with the source of the Component or Kit Package ignore any assigned product discount code.**"
  And the hard-kit restriction set:
  > "When a hard kit appears on a sales order, **you cannot substitute components**."
  > "Once a hard kit is added to the sales order, **individual line item comments cannot be entered** for the kit components or the kit master."
  > "Once added to a sales order, **the delivery type of the kit master or components cannot be changed at the line item level**."
  > "**If a hard kit exists on one or more open sales orders, you cannot edit the components of the hard kit in the Product Kit Settings.**"
  > "**STORIS does not allow partial shipment of hard kits, and prevents back-ordered components from shipping.**"
  > "**Hard kits cannot contain other kit masters (hard or soft) as components**, nor can they contain **special-ordered or non-inventory products** as components."
  Soft kits are the mirror: *"you can add, substitute, or remove components"* · *"The system allows partial shipment"* · *"Soft kits can contain hard kit masters as components. They can also contain non-inventory or special-ordered products."*
  > "**NOTE: Before you create a kit master ID (via the Product Kit Settings), you must first create a corresponding product in the Product file.**"
- **Maps to:** run 03 (commission and spiff) · run 04 (partial shipment, back orders) · W-024, W-046, W-047.

> **This is the sharpest inversion the audit has found in seven runs, and it is invisible from the
> settings screen.** `Kit Type` looks like a two-value flag. It is a switch that relocates *four*
> separate calculations — commission, discount, spiff and price — between the master row and the
> component rows.
>
> **The rebuild consequence is concrete:** a commission engine cannot ask "what is the commission on
> this line?" It must ask "is this line part of a kit, of which kind, and am I looking at the master
> or a component?" — and then *deliberately ignore* correctly-populated data on the other row.
> Populated-and-ignored is exactly the kind of field that survives a data migration and then produces
> silently wrong pay.
>
> Two more that a rebuild will otherwise miss:
> - **Edit locking on the definition:** an *open sales order* prevents editing the *product setup*.
>   Master data is locked by transaction state.
> - **The composition rules are asymmetric:** soft may contain hard; hard may contain neither.
>   Component-priced kits (F514) may contain no kit masters at all.

### FINDING 514 — Four price sources, and the component-priced kit is a proof-total with a cascade prompt

- **Invariant:** `Source of Price` selects one of four algorithms; `Component` makes the header price a *proof amount*, not the price.
- **Evidence** — `Hard and Soft Kit Rules` enumerates the four:
  > "**kit package** — use the amount specified at the Selling Price field in Product Kit Settings. Note that **STORIS prevents the use of special-order products in kits with a package selling price.**"
  > "**product** — The selling price is determined using the **`Default Kit Price $`** in Product Kit Settings for all components in the kit."
  > "**component** — You specify a total selling price for the kit in the Selling Price field… **This is used as a proof amount when assigning the selling price to each component** listed in the kit."
  > "**hierarchy price** — use the **sum of the amounts derived from the pricing hierarchy** for each component in the kit. **To use this option, check the box at the `Soft Kit Use Lowest Price` field in the Point of Sale Control Settings.**"
  `Component Priced Kits` adds the mechanics:
  > "The **`Default Kit Selling Price`** field (if specified) on the **Pricing page of Advanced Product Settings** is used as the `Default Kit Price $` for the component in Product Kit Settings. **If that field is blank, the Selling Price specified in Advanced Product Settings is used as the default.**"
  > "**All components in the kit must have a `This Kit Price $` amount assigned. Zero or higher is acceptable.**"
  > "**The assigned component prices are used for the current kit only.**"
  > "**Changes to the component prices in the Product Kit Settings process only affects subsequent additions of kits to sales transactions. Existing transactions are unaffected.**"
  > "**If you change the `Default Kit Selling Price` of the component product in Advanced Product Settings, you are prompted with the option to automatically update the `This Kit Price $` of all hard and soft 'Component-Priced' kits where the `This Kit Price $` for that component matches the previous price.** If you answer Yes to the prompt, the component product price and total kit price are updated in Product Kit Settings."
  > "**Promotional pricing takes priority over component kit prices**, provided the order date is within the date range specified (if any) for the promotion."
  > "**Line item discounts** can be applied at the kit master level for component priced **Hard** kits, **but not** for component priced **Soft** kits."
  > "**Markdown Pricing** is available for component priced **Hard** kits, **but not** for component priced **Soft** kits."
  > "**If you remove a component from the order after the soft kit has been expanded, the `SOFT KIT - Apply Pricing Hierarchy to kit components in a sale when the kit is changed` field in Point of Sale Control Settings determines how the prices of the remaining components are to be adjusted.** Depending on how this field is set, the system either **retains the prices established in the kit or reverts to their standard selling prices.**"
- **Maps to:** batch 1 (Point of Sale Control Settings, nine pages) · batch 11 (Advanced Product Settings Pricing page) · W-024, W-045.

> **Two of the four price sources are gated by a Point of Sale Control Setting.** `hierarchy price`
> requires `Soft Kit Use Lowest Price`; and what happens to a partially-dismantled kit is decided by
> a second POS setting with a 79-character field name. Batch 1 catalogued ~250 POS fields without
> knowing what these two did. **They decide kit pricing.**
>
> **The cascade prompt is the most operationally dangerous mechanic in this batch.** Editing one
> product's default price offers to rewrite `This Kit Price $` across *every* kit — hard and soft —
> where the old value still matches. It is an opt-in mass update, triggered from a screen that looks
> like single-product maintenance, and its blast radius is invisible at the prompt. A rebuild that
> reproduces the behaviour should show the count first.
>
> **The "existing transactions are unaffected" sentence is the correct rule and worth stating
> explicitly:** kit component prices are **copied onto the order line at add time**. This is the same
> copy-at-transaction-time pattern the audit met for tax, commission and cost. Consistent, and easy
> to get wrong by joining live.

### FINDING 515 — Kit promotions are pre-loaded rows that a monthly job purges on a POS-configured retention

- **Invariant:** a kit promotion is a dated, pre-staged price set with a load flag, purged by End-of-Month.
- **Evidence** — `Kit Promotion Settings`:
  > "Use this routine to enter promotional information **in advance** for **component-priced soft kits**. Kit components, promotional prices, and a promotion codes can be manually entered. **This allows kits to be identified on multiple promotions at different times.**"
  > "**Kit promotion information is purged during the `Generate Monthly Reports` process. Criteria for purging is established via the `Promotional Pricing Retention Period` in Point of Sale Control Settings.**"
  > "**NOTE: The soft kit entered must have the Source of Price set to 'Component' in Product Kit Settings. If the entry does not have component pricing, a warning message is displayed.**"
  Fields: `Promotion Code` · `Description` · `Kit Master Product Number` · **`Date to Load`** ·
  `Start Date, End Date` · **`Promotion Loaded`** · `Component Product Number` · `Unit` ·
  `Kit Component Quantity` · `Selling Price` · `Default Price` · `Promo Price` · `This Kit Price`.
- **Maps to:** batch 1 (POS Control Settings retention periods) · batch 5 (the batch calendar) · W-045, W-041.

> **Three dates and a flag, which is one more date than a promotion needs.** `Date to Load` is
> separate from `Start Date`, and `Promotion Loaded` is a *status flag* — so the promotion is
> **staged, then applied by a process, then effective**. That is a small state machine (staged →
> loaded → active → expired → purged) and it is nowhere drawn as one. Added to §F.
>
> **The retention setting is a data-loss control living in an unrelated screen.** Set
> `Promotional Pricing Retention Period` too short in Point of Sale Control Settings and next month's
> `Generate Monthly Reports` deletes promotions **that have not run yet** — nothing in this screen
> warns of it. Recorded in §I.

### FINDING 516 — Substitution lists are shared objects with referential rules and a global on/off gate

- **Invariant:** one list can serve many kits; edits and deletions are validated against every kit using it.
- **Evidence** — `Substitute Product List Settings`:
  > "Use this routine to create and maintain **lists of product substitutions** that you can associate with component products (via Product Kit Settings) when creating and maintaining **component and product priced soft kits**."
  > "**A substitution list can only contain Products with the same Product Type.**"
  > "**If the quantity of a component is raised, all existing soft kits that contain that component as the default must be verified.** Any soft kit that contains a quantity less than the new quantity is **no longer valid and an error message is displayed**."
  > "**If the adjustment charge is changed to anything other than zero, no soft kits can use that component as the default product.**"
  > "If you click the **Delete** button on this screen, the list is removed **provided that it is not being used in any soft kits**. If the substitution list is in use, **a message is displayed providing the number of soft kits affected. If you choose to continue with the deletion, the substitution list is automatically removed from all soft kits where it is assigned.**"
  > "**There must be at least one other product in the list with an adjustment charge of zero at the time the adjusted substitution list is saved.**"
  > "**NOTE: The ability for you to use the substitution list functionality in order entry is active only when the `Adjust Soft Kit in Order Entry` setting is checked on the Inventory tab of your Point of Sale Control Settings.**"
  Fields: `Product Substitution List` · `Substitution List Comments` · `Kit Price Source` ·
  `Product Description` · `Product Number` · `Quantity` · `$ Adjustment` · Grid.
- **Maps to:** F513, F514 · batch 1 (POS Control Settings, Inventory tab) · batch 13 F494 · W-034.

> **A fourth deletion policy: warn-with-a-count, then cascade.** The audit's catalogue is now
> complete enough to be worth stating as a house table (see §G). This one is the *best* of the four —
> it tells the user the blast radius **before** acting — and it is the only one that does.
>
> **"At least one product with a zero adjustment charge" is an invariant on the list, not on a
> row** — the list must always contain a free option. A rebuild will implement this as a save-time
> validation over the whole collection, and will only discover it exists by reading this sentence.
>
> The gate sentence matters for parity testing: with `Adjust Soft Kit in Order Entry` unchecked, all
> of this setup exists in the database and **does nothing in order entry**.

### FINDING 517 — Kit components are screened by a distribution-status behaviour, tying kits to F509

- **Invariant:** "Defective" is a value of `Inventory Availability`, and it disqualifies a product from kit membership.
- **Evidence** — `Product Kit Settings`:
  > "**Kits cannot have components designated as 'Defective'. This product status is determined in the `Inventory Availability` field in Distribution Status Settings.**"
  And the web/eSTORIS wiring from the same article:
  > "**If a customer deletes a soft kit with an associated Web Item Add-On record, the system deletes that record as well.**"
  > "If a customer removes a product from a soft kit, **the system also removes the product from the `Replaced Product` field Web Item Add-On Settings**, if it exists there for the selected kit."
  > "eSTORIS shopping carts observe the **`Expand on Web`** field in this routine."
  > "**If the total price of the kit falls below the standard kit price, the ability to use kit prices inactivates for the kit.**"
  > "If a customer removes a soft kit item from a cart, and that item is a **non-expanding kit, the program removes all the components the kit contains.**"
  > "The program **includes web kit additions in kit pricing issues, but does not include kit substitutions.**"
  > "**NOTE: Web kits on the Wish List page and the first Check Out page function similarly to web kits on shopping carts.**"
  Header fields: `Product Number` · **`Kit Type`** · `As-Is` · **`Source of Price`** · `Selling Price` ·
  `Promotion Code` · `Kit Promo Code` · `Start, End` · `$` ·
  **`Display all Kit Components on Website`** · `Add to a Purchase Order` ·
  **`From Enter Sales Order; insufficient Component quantity`** ·
  `Kit number when Printed/e-Transmitted` · `Kit number on e-Acknowledgements` · `Comments`.
  Component grid: `Product Number` · `Description, Unit` · `Quantity` · **`Substitution`** ·
  `Web Image` · `Web Substitution` · `This Kit $` · `Total` · `Promo $` · `Selling $` · `Default $`.
- **Maps to:** F509 (the immutable `Inventory Availability`) · run 04 F280 (As-Is disposition hub) · W-055.

> **This recovers one value of the unpublished `Inventory Availability` enumeration** — `Defective` —
> and shows what the field is *for*: it is not a label on stock, it is **a behaviour class that other
> modules test against**. Kit membership is one such test. There will be others the audit has not
> found. Added to §F as a partially-known enumeration.
>
> The eSTORIS block is a **second consumer of the kit model with its own rules**, and two of them are
> destructive cascades initiated by a *customer*, not a user: deleting a soft kit removes a Web Item
> Add-On record; removing a component rewrites another settings record's `Replaced Product` field.
> **A shopper's cart action edits merchandising configuration.** That is worth flagging loudly in any
> rebuild's threat model.
>
> `From Enter Sales Order; insufficient Component quantity` is a **field name that is a whole
> policy question** — what order entry does when a kit cannot be completed — and its value list is
> not published. Recorded in §H.

### FINDING 518 — The multi-legged transfer model, recovered from its two settings records

- **Invariant:** *where stock may come from* and *how it physically gets there* are two separate, independently maintained schemas.
- **Evidence** — `Stock Location Schema`:
  > "Used with the **Multi-Legged Transfers** feature to establish **secondary stock locations**."
  > "**Alternate Stock Location** — Must be a **single** location. Applicable to stores and warehouses."
  > "**Stock Location Schema** — **One or more locations**… set in the **order of precedence** should there be a need to select stock to fill a **sales order, exchange or transfer**."
  > "**If sufficient quantity is not found, the remaining quantity is back-ordered.**"
  > "**NOTE: If Regional Processing is active on your system and you select a location from a different region, a warning message appears but you can proceed.**"
  Fields: `Applies To` · `Location` · `Route Code`; **Promote / Demote** buttons order the list.
  Reached *"via the Actions button on the Inventory and Logistics page of Warehouse/Store Location Settings"*.
  And `Maintain Distribution Location Schema`:
  > "Use this routine to set up or update **distribution schemas for Demand and Logistic multi-leg transfers** by assignment of **locations that merchandise must pass through** to get from the From Location to the To Location. **It is only required when an intermediary location is necessary** in moving product from location to another."
  > "Warehouse 88 has a **stock schema (demand)** from warehouse 66 · There is **not a direct truck** from 66 to 88. Warehouse 66 only goes to warehouse 77. · There would be a **Distribution Location Schema of 66 to 88 with a via of 77**."
  Fields: `From Location` · `To Location` · **`Via Location 1, 2, 3, 4`**.
- **Maps to:** run 04 (transfers) · batch 12 (Warehouse/Store Location Settings) · batch 6 (Regional Processing) · W-057, W-058, W-059.

> **The audit's only unreachable article is no longer a gap.** `Multi-Legged Transfers Flow Chart
> Overview` is a picture with no text alternative and was recorded as unreadable rather than
> reconstructed. Its two settings records state the model in words, and the worked example above is
> the flow chart in prose.
>
> **The model is two orthogonal schemas, and conflating them is the obvious rebuild error:**
> - **Stock Location Schema** = *sourcing policy*. An **ordered** list ("order of precedence",
>   maintained with Promote/Demote) answering *which locations may fill this demand, and in what
>   order*. Terminates in a **back order** when exhausted — so the fall-through has a defined floor,
>   unlike most in this system.
> - **Distribution Location Schema** = *routing*. A `(from, to)` pair with **up to four via
>   locations**, answering *which trucks actually connect these two places*. Required **only** when
>   no direct leg exists.
>
> Sourcing picks the origin; routing then discovers the origin is three legs away. **Maximum path
> length is six locations** (from + four via + to) — a hard, useful number for a rebuild's transfer
> data model.
>
> `Alternate Stock Location` vs `Stock Location Schema` is a **cardinality distinction with its own
> field**: one location versus an ordered many. The docs do not say which is consulted first when
> both are populated. Recorded in §H.
>
> `Route Code` on the schema row is the join to run 04's routing model: a sourcing choice
> **carries a delivery route with it**.

### FINDING 519 — Both transfer schemas decline to enforce the constraints the rest of the system publishes

- **Invariant:** location validity and regional boundaries are warned about, not enforced, in transfer setup.
- **Evidence** — `Maintain Distribution Location Schema`:
  > "**NOTE: Any valid location can be entered; location restrictions are not enforced in this process.**"
  `Stock Location Schema`:
  > "**NOTE: If Regional Processing is active on your system and you select a location from a different region, a warning message appears but you can proceed.**"
  And the bulk security routine, `Maintain Transfer Security for Multiple Locations`:
  > "Use this routine to **maintain, add, and delete transfer security records for multiple logon locations at one time**. Once you have accessed this screen, select all the **Logon/From** and **To** location combinations for which the user/logon **can maintain transfer security records**."
  Fields: `Transfer Security` · `Logon/From Location` · `To Location` · `Add All Items` ·
  `Delete All Items` · `Add` · `Clear`.
- **Maps to:** run 04 **F290** (*detect-and-report as house style*) · batch 6 (Regional Processing) · W-050, W-059.

> **Run 04's F290 called detect-and-report the house style. Here it is again, in setup rather than
> operations, and stated twice in two articles.** STORIS lets you build a schema that violates its
> own location restrictions and its own regional boundaries, tells you once, and stores it.
>
> **For the cutover this is a data-quality warning, not a design question.** The live STORIS system
> very likely contains transfer schemas that a stricter rebuild would reject at import. Validate the
> extracted schemas *before* the rebuild's constraints are switched on, or the migration will fail on
> data the source system knowingly accepted.
>
> The bulk security routine is the **transfer-security analogue of the batch-9 permission catalogue**,
> and its wording is recursive in a way worth reading twice: it grants the ability to **maintain
> transfer security records**, not the ability to transfer. It is permission-to-administer-permission,
> scoped by `(logon/from, to)` location pair. That is a **ninth access-control shape** (cf. F507) and
> the first one the audit has seen that is *pairwise* rather than per-object.

### FINDING 520 — Hard kits are excluded from real-time reservation and commit at End of Day instead

- **Invariant:** receipt-time reservation skips hard kits; a batch process reserves them later.
- **Evidence** — `Hard and Soft Kit Rules`:
  > "**Hard kits are not eligible for online receipts reservations. Instead, received hard kits commit to open sales orders during End-of-Day processing.**"
  And the As-Is variant:
  > "**As-is soft kits share many rules that govern hard kits.** · As-is soft kits are presented **only with their default components. Substitutions are not permitted.** · **Kit masters cannot be used as a component.** · The Source of Price is the same as hard kits. · **When on an order, as-is soft kits appear and function as hard kits.**"
  > "**NOTE: If a hard kit is a component in a soft kit, the system ignores both the hard kit's selling and kit prices and instead uses each component's kit selling price.**"
  > "**Soft kits flagged to use a package price are eligible for promotional pricing at the product level.** This excludes commission percents and spiff amounts."
  > "When updating the selling price of a soft kit master, use the Product Kit settings. That is, **changing the Selling Price field in the Product file for individual kit components does not update Selling Price field in the Product file for any soft kit masters** associated with those products."
  Price-adjustment eligibility, stated as a table in the source:

| Kit | `Source of Price` | Price adjustments |
|---|---|---|
| Soft | Kit Package | **Permitted** |
| Soft | Product | Not permitted |
| Soft | Component | Not permitted |
| Hard | Product | **Permitted** |
| Hard | Component | **Permitted** |

- **Maps to:** batch 2 F353–F365 (reservation) · run 03 F153 (End of Day releases credit holds) · batch 11 (Price Adjustment Settings) · W-041, W-055.

> **A third End-of-Day responsibility, and the same shape as the first two.** Run 03 F153 found that
> End of Day releases credit holds; batch 5 found it drives notifications; here it performs the
> reservation that receiving declined to do. **End of Day is not a reporting job — it is where
> STORIS puts work that cannot be done inline**, and a rebuild that makes everything real-time will
> change hard-kit availability semantics without meaning to.
>
> The operational consequence is visible to staff: receive a hard kit at 2pm and it is **not**
> reserved against the waiting order until that night. Anyone checking availability in between sees
> free stock that is spoken for.
>
> **`As-Is` is a third kit behaviour wearing the soft kit's name.** `Kit Type` says soft; `As-Is`
> says behave like hard. Batch 13 and run 04 F280 both found As-Is acting as a disposition hub that
> overrides normal rules; **this is the same override applied to kits**, and it means the effective
> kit behaviour is `(Kit Type, As-Is)` — a pair, not a flag.
>
> The five-row price-adjustment table is a **published exception table with no stated rationale**.
> It cannot be derived from any other rule in the article. A rebuild must carry it as data.

---

## C. Screen and field inventory (additions)

**`Warehouse Inventory Settings`** — `Warehouse/Store Location` · `Product Number` ·
`Showroom Merchandise` · `Location Selling Price $` · `Purchasing Status` ·
`Stock Level Quantity` (`Maximum` · `Minimum` · `Safety`) · `Velocity` · `Storage Category` ·
`Distribution Status` (`Current Status is` · `On this Date, Change Status to`) ·
`User Defined Warehouse Inventory Code` · `Cross Dock`; page 2 **User Defined Settings** —
`Setting` · `Response` · `Select`.

> The User Defined Settings page carries its own activation rule, verbatim:
> *"This page is active when **more than one user defined setting record is present and at least one
> of those records is set up without an associated inventory formation**. If there is only one user
> defined setting record assigned to an inventory formation, **the product being updated must exist
> in the system** in order for this page to be active."* — and its own disclaimer:
> *"**Entries on this screen are for information only; no processing occurs based on this
> information.**"* This is the **third** consumer of Inventory Formations (batch 13 F491) and
> confirms formations scope user-defined settings.

**`District and Regional Product Settings`** — Tabs `District` | `Regional`; fields as listed in F510,
F511, F512; Distribution (F503); `Grid Information`.

**`Product Kit Settings`** — header and component grid as listed in F517.

**`Kit Promotion Settings`** — as listed in F515.

**`Substitute Product List Settings`** — as listed in F516.

**`Distribution Status Settings`** — `Distribution Status` · `Short Description` · `Long Description` ·
`Inventory Availability`.

**`Purchase Status Settings`** — `Purchase Status` · `Description` · `Short Description` · `Type` ·
`Suppress from Product Search for:` (`User` · `User Group`).

**`Schedule Purchase Status`** — `Current Status is` · `On This Date` · `Change Status To`.

**`Set Product Purchase Status by Region`** — `Region` · `Purchase Status`.

**`Stock Location Schema`** — `Applies To` · `Location` · `Route Code` · Promote / Demote.

**`Maintain Distribution Location Schema`** — `From Location` · `To Location` ·
`Via Location 1, 2, 3, 4` · `Grid Information`.

**`Maintain Transfer Security for Multiple Locations`** — `Transfer Security` · `Logon/From Location` ·
`To Location` · `Add All Items` · `Delete All Items` · `Add` · `Clear` · `Grid Information`.

---

## D. Control settings catalog (additions)

Point of Sale Control Settings fields newly identified by function (batch 1 catalogued the names):

| Field | Page | What it actually decides |
|---|---|---|
| `Soft Kit Use Lowest Price` | — | Enables the **hierarchy price** source (F514) |
| `SOFT KIT - Apply Pricing Hierarchy to kit components in a sale when the kit is changed` | — | Whether a dismantled kit keeps kit prices or reverts (F514) |
| `Adjust Soft Kit in Order Entry` | **Inventory** | Master gate for substitution lists (F516) |
| `Promotional Pricing Retention Period` | — | Purge criteria for kit promotions (F515) |

Costing Control Settings: defines the **add-on landed cost row labels** (`DUTY`, `UPCHARGE`, …)
whose amounts are entered regionally (F512).

Inventory Control Settings: the **global rung** of the reservation hierarchy (F511).

---

## E. Security permissions catalog (additions)

| Mechanism | Shape | Where stored |
|---|---|---|
| `Suppress from Product Search for:` User / User Group | **Negative, per-code-table-row** | On the purchase status record (F507) |
| Transfer security | **Pairwise** `(Logon/From Location, To Location)` | Transfer security records (F519) |
| Bulk maintenance of transfer security | **Permission to administer permission** | `Maintain Transfer Security for Multiple Locations` (F519) |

> Running total of distinct access-control shapes across the audit: **nine**. The six catalogued in
> batches 7–9, the seventh flagged there (`File Security Groups` / `Field Security Codes`, still
> unread), and these two new ones.

---

## F. State machines and enumerations (additions)

**Purchase status** — closed set of six types (F506), extensible by site-defined codes that inherit a
type. `P` is process-set only.

**Kit behaviour** — effective behaviour is the pair **(`Kit Type`, `As-Is`)**:

| Kit Type | As-Is | Behaves as |
|---|---|---|
| Hard | — | Hard |
| Soft | no | Soft |
| Soft | **yes** | **Hard** (F520) |

**`Source of Price`** — four values: `Kit Package` · `Product` · `Component` · *hierarchy price*
(the fourth is selected by a POS control setting rather than by this field — the docs are not explicit
that it is a fifth enum value; recorded in §H).

**`Inventory Availability`** (on Distribution Status Settings) — **partially known**. One value
recovered: `Defective` (F517). Full list unpublished. **Immutable once the code exists** (F509).

**Kit promotion lifecycle** — staged (`Date to Load`) → loaded (`Promotion Loaded`) → active
(`Start Date`–`End Date`) → purged (`Generate Monthly Reports` × retention). Nowhere drawn as a
state machine in the docs; assembled here from field names (F515).

---

## G. Sequencing rules (additions)

**The standard product hierarchy** — one resolver, at least two values:

```
Warehouse Inventory Settings
  → District and Regional Product Settings   (Regional tab; skipped if Regional Processing is off)
    → Advanced Product Settings              (mandatory rung for purchase status)
```
Applies to **distribution status** (F503) and **purchase status** (F505). Stated verbatim in three
separate articles.

**Reservation** — region → product → system (F511), a *different* three rungs.

**Stock levels** — **not** a hierarchy. Product-level values are **copied once** at first receipt
(F502).

**Sourcing then routing** — Stock Location Schema picks the origin (ordered, terminating in a back
order); Distribution Location Schema then supplies up to four via legs (F518).

**Deletion policies — the complete house catalogue (four):**

| Policy | Example | Behaviour |
|---|---|---|
| **Blocked** | Handling method (run 04 F173) | Referential integrity refuses |
| **Silent cascade** | Inventory formation (batch 13 F494) | Rewrites consumers without asking |
| **Warned cascade** | Substitution list (F516) | States the affected count, then cascades on confirm |
| **Self-healing** | User/group in purchase statuses (F507) | Consumers clean themselves up |

> Four policies for the same verb. A rebuild should pick one and apply it everywhere, but must know
> which one STORIS used **for each table** to predict what the legacy data looks like at cutover.

---

## H. Open questions and gaps

**Documented but ambiguous**

1. **The reservation-method list has a duplicate bullet** (F511). Bullets 2 and 4 are identical. Either
   a documentation defect or a mis-transcribed fourth method. **Not guessed at.**
2. **`Source of Price` may have four or five values** (F514). Four are named on the field; *hierarchy
   price* is described as an option but selected via a POS control setting.
3. **Regional vs warehouse stock levels** (F502). Both hold Min/Max/Safety. Which governs
   replenishment, and whether one seeds the other, is unstated.
4. **Putaway tie-breaks** (F504). "Attempt to match… and/or" — no stated precedence between `Velocity`
   and `Storage Category`, and no stated behaviour on no match.
5. **`Alternate Stock Location` vs `Stock Location Schema`** (F518). Both configured, both sourcing —
   precedence unstated.
6. **`From Enter Sales Order; insufficient Component quantity`** (F517). A field whose name is a policy
   question; values unpublished.
7. **`Inventory Availability` enumeration** (F509, F517). One value recovered; the rest unpublished.
8. **`Showroom Merchandise`, `Cross Dock`, `User Defined Warehouse Inventory Code`** — named on
   `Warehouse Inventory Settings` with no description at all.

**Correction by addition**

9. **Batch 4's rewards model was location-blind.** `District and Regional Product Settings` carries
   `Reward Factor` and `Reward Indicator` on the **District** tab (F510) — rewards vary by district.
   Batch 4 closed the rewards model from `Membership Reward Settings` alone and did not know this.
   The model is not wrong, it is **incomplete by one dimension**.

**Gap closed**

10. **`Multi-Legged Transfers Flow Chart Overview`** (the audit's only unreachable article) is
    superseded by F518. The *picture* remains unread; the *model* is documented in words elsewhere and
    is now recorded. The article stays on the unreachable list; the gap it created is closed.

**Inferences (recorded as inference, not finding)**

- **I-88** — `Velocity` is probably an ABC-style movement classification, given the name and the
  putaway use. **The docs never define it or list its values.** Not treated as fact.
- **I-89** — the duplicate reservation bullet (H1) most plausibly should read *Requested Date* or
  *Available Date*, since STORIS uses both terms elsewhere. **Explicitly not adopted.**
- **I-90** — `Showroom Merchandise` is likely a floor-sample flag at the location level, which would
  connect it to run 04's As-Is/floor-sample handling. **No supporting sentence exists.**

---

## I. Unknown unknowns

- **`Scheduled Settings Update`** — a **newly named batch process** (F508) that consumes scheduled
  status changes. It appears in no batch-calendar article the audit has read. **What else does it
  drain?** This is the fourth named periodic process (End of Day, End of Month,
  `Generate Monthly Reports`, and now this) and the audit has no consolidated list.
- **A shopper's cart action can rewrite merchandising configuration** (F517). Removing a soft-kit item
  from an eSTORIS cart edits `Web Item Add-On Settings`. If the eSTORIS surface does that, **what
  else does it write?** No article the audit has read frames eSTORIS as a writer of settings.
- **`Promotional Pricing Retention Period` can delete promotions that have not run** (F515). A
  retention setting acting as a scheduler constraint is a design smell that may recur in the other
  retention periods batch 1 catalogued without functional descriptions.
- **The cascade prompt in `Advanced Product Settings`** (F514) mass-updates kit component prices from
  a single-product screen. **Are there other prompts like it?** The audit has seen this shape once;
  the phrasing suggests a pattern.
- **`Product Kit Settings` exists twice** (`360035377291`, `15294525112980`). Duplicate live articles
  mean the help centre has legacy content still reachable by search — a reminder that **article age is
  not visible** and version badges appear on only some articles.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Warehouse inventory record** | The `(location, product)` row, auto-created by receiving; carries location-level price, stock levels, velocity, storage category, distribution status |
| **District** | A **sales** grouping of locations — price, commission, spiff, reward |
| **Region** | A **stocking** grouping of locations — stock levels, purchase status, reservation, landed cost |
| **The standard product hierarchy** | The named resolver Warehouse → District/Regional → Advanced, used for at least two values |
| **Purchase status** | Six-type closed set governing PO eligibility, oversell, markdown-field activation and purge selection |
| **Distribution status** | Code deciding sourcing location and cross-location reservation; behaviour immutable after creation |
| **Hard kit** | Sold whole; commission and discount at the master; no substitution, no partial shipment |
| **Soft kit** | Editable; commission and discount at the components; partial shipment allowed |
| **As-Is soft kit** | Typed soft, behaves hard |
| **Component-priced kit** | Header price is a **proof total**, not the price; each component carries `This Kit $` |
| **Stock Location Schema** | Ordered list of locations that may fill demand; falls through to back order |
| **Distribution Location Schema** | `(from, to)` plus up to four **via** locations — physical routing when no direct leg exists |
| **Substitution list** | Shared, same-product-type list with at least one zero-adjustment option |
| **`Scheduled Settings Update`** | Batch process that applies and then erases scheduled status changes |
| **Velocity / Storage Category** | Two product attributes matched against location attributes by directed putaway; values undefined |

---

## Contract adjudication — batch 14

| Contract | Verdict | Basis |
|---|---|---|
| **W-014** *(product master resolution)* | **CONFIRMED — from both endpoints** | The standard product hierarchy stated verbatim in three articles (F503, F505) |
| **W-016** *(product lifecycle status)* | **CONFIRMED** | Six purchase status types with a full capability matrix (F506) |
| **W-023** *(purge)* | **CONFIRMED** | D/T/P are the purge process's input set (F506) |
| **W-024** *(bundles / kits)* | **CONFIRMED, and larger than the contract assumed** | Two kit kinds, four price sources, inverted commission (F513, F514) |
| **W-034** *(deletion behaviour)* | **CONFIRMED — fourth policy found** | Warned cascade with an affected count (F516); complete catalogue in §G |
| **W-041** *(batch calendar)* | **CONFIRMED — a fourth named process** | `Scheduled Settings Update` (F508); End of Day reserves hard kits (F520) |
| **W-045** *(promotional pricing)* | **CONFIRMED** | Staged kit promotions with load flag and retention purge (F515) |
| **W-046** *(commission and spiff)* | **CONFIRMED, with an inversion** | Master-only vs component-only by kit type (F513) |
| **W-047** *(discount codes)* | **CONFIRMED** | Same inversion; two price sources ignore discounts entirely (F513) |
| **W-050** *(access control)* | **CONFIRMED — two new shapes** | Code-row suppression (F507); pairwise transfer security (F519) |
| **W-055 / W-056** *(reservation and availability)* | **CONFIRMED — chain closed** | Region → product → system (F511); distribution status sets cross-location scope (F509) |
| **W-057 / W-058 / W-059** *(transfers)* | **CONFIRMED — model recovered** | Sourcing schema + routing schema, six-location maximum path (F518) |
| **W-061 / W-062** *(landed cost)* | **CONFIRMED** | Central labels, regional amounts (F512) |
| **Seeded-copy stock levels** | **NEW — no contract covers it** | F502 — the one three-level structure that is *not* a fall-through |
| **District ≠ Region** | **NEW** | F510 — two orthogonal partitions behind one screen name |
| **eSTORIS as a settings writer** | **NEW** | F517 — customer cart actions edit merchandising records |

---

## Next — batch 15

**Vendor Settings** (94, 91 unread) — `Third Party Logistics Settings` · `Vendor EDI Settings` ·
`Advanced Vendor Settings` · `Tracked Storage Location Settings` · `EDI Status Details Settings`.
Then the two highest-priority unread security records, **`File Security Groups`** and
**`Field Security Codes`** — the seventh access-control kind, still documented only as two field names.
