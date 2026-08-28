# Run 07 — System Administration — Batch 13: Inventory Formations and Protection Plans

Status: complete. Findings 491–500. Read-only throughout.

**This batch closes the audit's highest-value undefined term.** `Inventory Formation` had **eight
sightings across runs 04, 07 and 11** with no definition, and the closeout listed it among thirteen
terms it called *"a vendor question, not a reading problem."* It is now fully defined — and it turns
out to be a set-algebra construct used across half the system.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Inventory Formations Overview** | 15294522840212 | read — **the definition** |
| 2 | **Inventory Formation Settings** | 15294524800404 | read — the maintenance screen |
| 3 | **Protection Plan Settings** | 15294555339412 | read — *"Updated as of 2/7/2024"* |

All three in **Product Settings** (88).

---

## B. Wiring findings

### FINDING 491 — An Inventory Formation is a named product set built by include/exclude algebra

- **Invariant:** a formation is assembled from five element types, each marked include or exclude.
- **Evidence** — `Inventory Formations Overview`:
  > "Use inventory formations to **group products together**. You add products to the formation and give it a name. Then, you can **recall the formation in order to apply a STORIS function to the products** in the formation."
  > "You build your inventory formations using **any combination** of the following elements: **individual products · product categories · product groups · product vendors**"
  And `Inventory Formation Settings` adds a fifth: > "products · product groups · product categories · product vendors · **product brands**"
  > "Once you specify a product, group, category, vendor, or brand, **the other four prompts inactivate** and the **`Usage Action`** field activates. For each element you add… use the Usage Action field to **specify whether to include or exclude** the products from the element."
  Fields: `Inventory Formation Code` · `Description` · Product · Group · Category · Vendor · Brand ·
  **`Usage Action`** · Grid.
- **Maps to:** batch 11 F471 · batch 12 F484 · run 04 batch 11 §F — **eight sightings, now defined**;
  `AUDIT-CLOSEOUT.md` §"What the audit could not answer".

> **The audit's highest-value undefined term, resolved.** It is not a kit, not a collection, not a
> hierarchy level — it is **a saved set expression over the product master**, built from five kinds of
> element with an include/exclude flag on each.
>
> The worked example in the source is the clearest statement: *"create an inventory formation to
> include all products from Vendor 123 **except** Product ABC."* One include element, one exclude
> element, and the set is defined.
>
> **The five element types matter for the rebuild** because they are the product hierarchy STORIS
> actually has: **brand → vendor → category → group → product**, which is also the sort order the saved
> grid uses. Seven runs met these names separately; this is the first article that puts them in order.
>
> **Run 07 inference I-83** guessed *"a product grouping used for web merchandising, user-defined
> settings scoping, and history inheritance."* **Right about grouping, and it understated the reach.**
> I-83 is retired and replaced by the definition.

### FINDING 492 — Exclusion beats inclusion inside a formation, and union wins across formations

- **Invariant:** within one formation exclusion overrides; across several formations membership is a union.
- **Evidence** — `Inventory Formations Overview`:
  > "**If an inventory formation both explicitly includes and explicitly excludes a product, the exclusion overrides the inclusion.**"
  > "**Implicitly Included** — the inventory formation defines **only exclusion criteria** and the product is not explicitly excluded (that is, **everything but the specified products**)."
  > "**NOTE: If you define multiple inventory formations for a STORIS function** (for example, discount codes), the discount code is **valid for all products included in at least one of the inventory formations — even if one of the formations excludes the products.** For example… **Product X is included in Inventory Formation 1 and excluded in Inventory Formation 2. In this example, whenever Product X appears on a line item, Sales Discount A will be available.**"
  Three formation types: **all elements included** · **all elements excluded** ·
  **some included, some excluded**.
- **Maps to:** F491; run 03 F15–F19, F75 (discount availability) — **the mechanism**; `W-055`.

> **Two different set rules at two different levels, and they point opposite ways.** Inside a
> formation, exclusion is stronger. Across formations attached to the same function, **inclusion in
> any one is enough** — an exclusion elsewhere does not veto it.
>
> The vendor states the second rule with a worked example because it is counter-intuitive, and it is
> exactly the sort of thing a rebuild gets wrong. **If we implement formations as filters and combine
> them with AND, or let exclusions propagate across formations, discounts will silently disappear.**
>
> **"Implicitly Included"** is the third membership state and it is powerful: a formation defined
> **only** by exclusions means *everything else*. So "all products except these twelve" is one
> formation with twelve rows.
>
> This closes a run-03 mechanism the audit described without explaining. Run 03 F75 found *"discount
> code availability is filtered by the customer's price category, by exclusion"* and recorded the
> exclusion behaviour as observed. **Formations are how that filtering is expressed.**

### FINDING 493 — Formations drive add-on selling, discount scoping, and "always reserved" stock

- **Invariant:** the same construct is attached to at least three unrelated functions.
- **Evidence** — `Inventory Formations Overview`:
  > "you can **link inventory formations with specific products**. Then when the product is added to an order, **a pop-up screen prompts for add-on sales of the products in the associated inventory formation(s)**."
  > "You can **link an inventory formation to a sales discount code** so that the discount code is **available only for the products in the inventory formation**."
  > "**If you have stock that is always considered reserved and are using a Third Party Logistics Company, you can use an inventory formation to designate products that are always in stock. Use the `Formation - Include as Reserved` setting in Warehouse/Store Location Settings.**"
  Plus, from earlier batches: `Formation - Exclude from Scheduling` · `Formation - Exclude from
  Alternate Stock Location` *(batch 12 F484)* · `Related Inventory Formations` · `Web Related
  Inventory Formations` · `Merge History From` *(batch 11 F471)* · user-defined settings scoping ·
  **`Inventory Formations`** on `Protection Plan Settings` *(F496)*.
- **Maps to:** run 03 F75 · batch 12 F484 · batch 11 F471; `W-055`; `W-028`.

> **At least eight functions consume formations**: add-on sales prompts · sales discount scoping ·
> always-reserved designation for 3PL · scheduling exclusion · alternate-stock exclusion · web related
> products · user-defined settings scoping · protection plan eligibility.
>
> That is why the term kept appearing across three runs without ever being explained — **it is
> infrastructure**, not a feature, and every consuming article assumed you knew.
>
> **The 3PL "always reserved" use is the one that matters operationally.** Run 04 documented an
> elaborate reservation model; this says a formation can declare certain products **permanently
> reserved** so a third-party logistics provider treats them as always available. That is a real
> bypass of the reservation machinery, keyed on a product set.
>
> **Add-on selling was invisible to seven runs.** A pop-up prompting for related products at order
> entry is a sales behaviour run 03 never surfaced, and it is driven entirely from here.

### FINDING 494 — Changing a formation silently changes what every consumer sees

- **Invariant:** formations are referenced live, and editing one alters its consumers.
- **Evidence** — `Inventory Formation Settings`:
  > "**NOTE: If you change an existing formation that is currently referenced in the system** (for example, referenced by one or more sales discount codes), **all products previously included in the formation may not be available in the formation.**"
  > "If you attempt to **delete** a formation that is currently referenced… **a warning message appears but you can continue. If you choose to continue, the program removes the formation from all discount codes prior to deletion.**"
  > "To generate a list of all discount codes associated with a formation, use the **Inventory Formations With Discounts** report in the Report Builder."
- **Maps to:** F493; run 04 F173 (handling-method deletion is referentially guarded) — **by contrast**;
  `W-034`; `W-042`.

> **Deletion is advisory, not blocked.** Run 04 F173 found handling-method deletion guarded by a
> three-part referential check reaching into completed orders. **Formations are the opposite**: a
> warning, and if you continue, the system **quietly strips the formation from every discount code**
> that used it.
>
> That is a materially different policy for two code-like tables in the same system, and the
> consequence is a live risk: **deleting one formation can silently narrow or widen a dozen discount
> codes**, and the only way to see the blast radius beforehand is a Report Builder report the article
> names.
>
> **`Inventory Formations With Discounts`** is a named Report Builder report — the first the audit has
> seen named as the impact-assessment tool for a configuration change.

### FINDING 495 — Protection Plan Settings is the record that actually governs plans

- **Invariant:** plan eligibility, pricing, costing, commission and GL all live here.
- **Evidence** — `Protection Plan Settings`:
  > "Use this routine to define and store information on protection plans. This includes **the products that qualify** for protection, **if the plan is commissionable**, as well as **the cost and selling point** of each."
  > "**NOTE: Multiple protection plans are permitted on a single order** as they may be needed to cover all merchandise."
  Fields: `Plan Code` · `Description` · **`Warranty Code`** · **`Third Party Plan Code`** ·
  **`Sales GL Account`** · **`Cost of Sales GL Account`** · `Taxable` · `Commission %` ·
  `Spiff Amount` · **`Available at Locations`** · `Use Regular Selling Price` · `Maximum Quantity` ·
  **`Inventory Formations`** · `Minimum Subtotal` · `Tax Class/SKU` · **`Manager Only`** ·
  **`Cancellation Restriction Days`** · **`Only Available for Membership Customers`** ·
  **`Pricing Method`** · **`Costing Method`** · `Price Amount/Price Percent` ·
  `Cost Amount/Cost Percent` · Grid · **`Plan Terms Information`**.
- **Maps to:** batch 11 F461 (*`Warranty Settings` is reference-only*) — **the real record**;
  run 03 F12 · run 05 F297 · run 07 F342; `W-028`; `W-052`.

> Batch 11 F461 found `Warranty Settings` to be *"optional and for reference only"* and predicted the
> plan machinery ran on `Protection Plan Settings` instead. **Confirmed**, and the record carries
> everything run 03 and run 05 documented behaviourally.
>
> **Two GL accounts — `Sales GL Account` and `Cost of Sales GL Account` — per plan.** So protection
> plan revenue and cost post separately from merchandise, which is what makes run 05 F307's
> profitability-by-payment-responsibility reporting possible.
>
> **`Warranty Code` links a plan to the reference warranty record**, which is exactly the relationship
> F461 implied: the warranty file describes the terms, the plan record does the work.
>
> **`Third Party Plan Code`** is run 07 F342's third-party provider identifier — the audit found the
> `Protection Plan Register Code` in the POS settings note and could not place it.
>
> **`Manager Only`** confirms batch 8 F429: the Sales Security permission `Protection Plans - Allow
> Sale of Manager Only Plans` unlocks plans flagged here. **A value-attached restriction with its
> permission located.**

### FINDING 496 — Plan eligibility is an Inventory Formation

- **Invariant:** which products a plan covers is a formation, not a list.
- **Evidence** — `Protection Plan Settings`: **`Inventory Formations`** — alongside
  `Available at Locations`, `Minimum Subtotal`, `Maximum Quantity`,
  `Only Available for Membership Customers`.
- **Maps to:** F491, F493 · run 03 F12 (*"protection plans are auto-attached by a documented three-step
  selection with a best-plan tiebreak"*) — **the eligibility input**; `W-028`.

> Run 03 F12 documented plan auto-attachment as *"a three-step selection with a best-plan tiebreak"*
> without saying how a plan qualifies for a product. **It qualifies by formation.**
>
> So the full eligibility test is: **the product is in the plan's formation, the location is in
> `Available at Locations`, the order meets `Minimum Subtotal`, the quantity is within
> `Maximum Quantity`, and — optionally — the customer is a member.** Five conditions, one of which is
> a set expression.
>
> **`Only Available for Membership Customers`** is a further link between the two loyalty programs
> (batch 4 F343): **membership can gate which protection plans a customer may buy.** Run 03 F158's
> reading of rewards and membership as one module is now closed from a third direction.

### FINDING 497 — Plans carry a pricing method and a costing method, each amount-or-percent

- **Invariant:** plan price and cost are each computed by a chosen method with an amount or a percentage.
- **Evidence** — `Protection Plan Settings`: **`Pricing Method`** · **`Costing Method`** ·
  `Price Amount/Price Percent` · `Cost Amount/Cost Percent` · `Use Regular Selling Price`.
- **Maps to:** run 03 F12 · run 07 F342 (`Override Calculated Protection Plan Price` permission);
  `W-061`; `W-028`.

> **Both price and cost are derived**, each by a method with a paired amount-or-percent field. So a
> plan can be *15% of the merchandise price* or *£99 flat*, and its cost to the business can be
> computed independently the same way.
>
> That is what makes run 05 F307's profitability reporting meaningful — **plan margin is a computed
> quantity, not a static one** — and it explains why batch 8 F429 found
> `Override Calculated Protection Plan Price` as a Sales Security permission: the price is calculated,
> so overriding it is an exception.
>
> **`Use Regular Selling Price`** is a third option, presumably treating the plan as an ordinary
> priced product.
>
> The values of `Pricing Method` and `Costing Method` are **not published**. Section H.

### FINDING 498 — `Cancellation Restriction Days` is on the plan, closing a run-03 permission

- **Invariant:** the plan defines its own cancellation window.
- **Evidence** — `Protection Plan Settings`: **`Cancellation Restriction Days`**.
  Against batch 8 F429's Sales Security permission
  `Override Protection Plan Cancellation Restriction Days`, and run 03 F48
  (*"cancelling a protection plan by adjustment is checked against a restriction window"*).
- **Maps to:** run 03 F48 · batch 8 F429; `W-028`; `W-050`.

> A clean three-way closure: **run 03 observed the behaviour, batch 8 found the override permission,
> and this is the field.** Per plan, not per system — so different plans can have different
> cancellation windows.
>
> That pattern — *behaviour in the process article, override in the security record, value in the
> settings record* — has now repeated often enough in run 07 to state as a reading method: **any
> restriction the audit found is a triple**, and finding two of the three means the third exists.

### FINDING 499 — Multiple plans per order is explicit

- **Invariant:** an order can carry several protection plans.
- **Evidence** — `Protection Plan Settings`:
  > "**NOTE: Multiple protection plans are permitted on a single order as they may be needed to cover all merchandise.**"
- **Maps to:** run 03 F12 · run 07 F342 (`Automatic Add Merchandise Overlap`); `W-028`.

> Run 07 F342 found **`Automatic Add Merchandise Overlap`** among the protection-plan settings in POS
> Control Settings and could not explain it. **This is the context**: several plans on one order, each
> covering different merchandise, and the setting presumably governs what happens when their coverage
> overlaps.
>
> Combined with F496's five-condition eligibility and run 03 F12's best-plan tiebreak, **plan selection
> is a genuine optimisation**: which plans qualify for which lines, which is best, and how overlaps
> resolve.

### FINDING 500 — Two of the closeout's thirteen undefined terms fall in one batch

- **Invariant:** the remaining undefined-term list is now eight.
- **Evidence**, against `AUDIT-CLOSEOUT.md` and batch 10 F460:

| Term | Status |
|---|---|
| **Inventory Formation** | **RESOLVED** — F491 |
| **Product Family** | **RESOLVED by implication** — the five formation element types are brand · vendor · category · group · product; *"Product Family"* is a `Multiple * Selection Window` name for one of these axes (run 04 batch 11 §A) |
| `Closed Without Completion` · `Repossession Maximum $` · phantom | resolved earlier in run 07 |
| `Twilight` · fly-by fulfillment · Staging Area · Float Label · `Ship Direct` · `CFO Fields` · `Bypass Interim` · `Times per Day` · dollars-only adjustment | **still open (8)** |

- **Maps to:** batch 10 F460; the closeout.

> **Five of the original thirteen are now resolved**, plus `Twilight` added and `ELP` partly
> understood. **Eight remain.**
>
> `Product Family` is recorded as **resolved by implication rather than by an article** — the audit
> met it only as a multi-select window title in run 04, and the formation element list gives the axis
> vocabulary it belongs to. **Flagged as an inference-grade resolution, not a documented one.**
>
> The closeout's claim that the thirteen were *"a vendor question, not a reading problem"* is now
> **wrong five times over.** Every one fell to an article in the section the six-run queue omitted, and
> three fell to articles of under 400 words. **The remaining eight should not be put to STORIS until
> Vendor Settings and the nested System Administration subsection have been read.**

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Inventory Formation Settings** | Inventory Formation Code · Description · Product · Group · Category · Vendor · Brand *(mutually exclusive)* · **Usage Action** *(include/exclude)* · Grid *(sorted: inclusions then exclusions; within each, brand → vendor → category → group → product)* |
| **Protection Plan Settings** | Plan Code · Description · Warranty Code · Third Party Plan Code · **Sales GL Account** · **Cost of Sales GL Account** · Taxable · Commission % · Spiff Amount · Available at Locations · Use Regular Selling Price · Maximum Quantity · **Inventory Formations** · Minimum Subtotal · Tax Class/SKU · **Manager Only** · **Cancellation Restriction Days** · **Only Available for Membership Customers** · Pricing Method · Costing Method · Price Amount/Price Percent · Cost Amount/Cost Percent · Grid · **Plan Terms Information** |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **`Usage Action`** | Inventory Formation Settings | Include or exclude, per element (F491) |
| **`Inventory Formations`** | Protection Plan Settings | Plan product eligibility (F496) |
| **`Pricing Method` / `Costing Method`** | Protection Plan Settings | Plan price and cost derivation; **values unpublished** (F497) |
| **`Cancellation Restriction Days`** | Protection Plan Settings | Per-plan cancellation window (F498) |
| **`Only Available for Membership Customers`** | Protection Plan Settings | Membership gates plan availability (F496) |

---

## E. Security permissions catalog (additions)

Three Sales Security permissions from batch 8 F429 now have their settings located:
`Protection Plans - Allow Sale of Manager Only Plans` → **`Manager Only`** ·
`Override Protection Plan Cancellation Restriction Days` → **`Cancellation Restriction Days`** ·
`Override Calculated Protection Plan Price` → **`Pricing Method`** (F495, F497, F498).

**The restriction triple** — behaviour in the process article, override in the security record, value
in the settings record — is now a stated reading method (F498).

---

## F. State machines and enumerations (additions)

- **Formation element types (5):** product · group · category · vendor · **brand** (F491).
- **Formation membership states (3):** explicitly included · explicitly excluded ·
  **implicitly included** (F492).
- **Formation types (3):** all included · all excluded · mixed (F492).
- **Set rules (2, opposite):** exclusion overrides inclusion **within** a formation; **union across**
  formations (F492).
- **Formation consumers (≥8)** (F493).
- **Plan eligibility conditions (5):** formation · location · minimum subtotal · maximum quantity ·
  membership (F496).
- **Unpublished:** `Pricing Method` · `Costing Method` values.

---

## G. Sequencing rules

1. Product added to an order → **if linked formations exist, an add-on sales pop-up prompts** for the
   formation's products (F493).
2. Plan eligibility evaluated → **formation membership** + location + minimum subtotal + maximum
   quantity + membership → run 03 F12's three-step selection and best-plan tiebreak (F496).
3. Formation edited → **consumers change immediately**; deleted → warning, then **stripped from all
   discount codes** (F494).
4. Plan sold → price and cost derived by their methods; **posts to the plan's own Sales and Cost of
   Sales GL accounts** (F495, F497).

---

## H. Open questions and gaps

### Resolved this batch

- **`Inventory Formation`** — eight sightings across three runs; **fully defined** (F491, F492).
- **`Product Family`** — resolved by implication (F500).
- **The record that governs protection plans** — batch 11 F461's prediction confirmed (F495).
- **Plan eligibility** — run 03 F12's missing input (F496).
- **`Automatic Add Merchandise Overlap`** — run 07 F342's unexplained setting, contextualised (F499).
- **Three run-03/batch-8 protection-plan triples** completed (§E).

### Newly opened

- **Add-on sales prompting** — a sales behaviour seven runs never surfaced (F493).
- **`Pricing Method` / `Costing Method` values** — unpublished (F497).
- **`Plan Terms Information`** and **`Tax Class/SKU`** — named, unexplained.
- **`Inventory Formations With Discounts`** — a named Report Builder report (F494).
- **`Kit Promotion Settings`** — a related article, unseen in seven runs.

### Still open — the undefined-term list, now eight

`Twilight` · fly-by fulfillment · Staging Area · Float Label · `Ship Direct` *(on a transfer)* ·
`CFO Fields` · `Bypass Interim` · `Times per Day` · dollars-only adjustment.
*(`ELP` partly understood.)*

### Inferences

- **I-86:** `Product Family` is one of the five formation element axes rather than a separate concept.
  *Resolved by implication from the element list; no article names it.*
- **I-87:** `Automatic Add Merchandise Overlap` governs what happens when two plans on one order cover
  the same merchandise. *From F499's multiple-plans note; the setting is never explained.*

---

## I. Unknown unknowns

- **Formations are infrastructure, consumed by at least eight functions** (F493), and seven runs met
  the term eight times without an explanation because every consuming article assumed it.
  **Terms that recur across modules without definition are load-bearing, not incidental** — a reading
  heuristic worth applying to the eight that remain.
- **Two set rules point in opposite directions** (F492), and the vendor documents the surprising one
  with a worked example. Implementing formations with AND semantics across functions would silently
  break discounting.
- **Add-on selling exists and is invisible from the sales section** (F493). A pop-up at order entry
  prompting related products is a revenue behaviour driven entirely from product configuration.
- **Deleting a formation silently rewrites discount codes** (F494), where deleting a handling method is
  referentially blocked (run 04 F173). **Two policies for two code tables in one system.**

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Inventory Formation** | A named product set built from brand/vendor/category/group/product elements, each included or excluded |
| **Usage Action** | The include/exclude flag on a formation element |
| **Implicitly Included** | Membership by absence, in an exclusion-only formation |
| **Add-on sales prompt** | Pop-up offering a formation's products when a linked product is added |
| **`Manager Only`** *(plan)* | Plan flag unlocked by a Sales Security permission |
| **Pricing Method / Costing Method** | How a plan's price and cost are derived; values unpublished |
| **Third Party Plan Code** | The external provider's identifier for a plan |

---

## Contract adjudication — batch 13

| Contract | Verdict | Basis |
|---|---|---|
| **W-028** *(protection plans and warranties)* | **CONFIRMED — the governing record found and read** | Five-condition eligibility, two GL accounts, derived price and cost (F495–F499) |
| **W-052 / W-053** *(GL)* | **CONFIRMED** | Per-plan Sales and Cost of Sales accounts (F495) |
| **W-055 / W-056** *(availability)* | **CONFIRMED** | Formations designate always-reserved stock and exclude from scheduling (F493) |
| **W-061** *(cost)* | **CONFIRMED** | Plan cost derived by method (F497) |
| **W-034** *(deletion)* | **CONFIRMED, with an asymmetry** | Formation deletion is advisory and silently rewrites consumers (F494) |
| **W-050** *(access control)* | **CONFIRMED** | Three protection-plan permissions matched to their settings (§E) |
| **Product set algebra** | **NEW — no contract covers it** | F491, F492 |
| **Add-on selling** | **NEW** | F493 |

---

## Next — batch 14

`Stock Location Schema` · `Warehouse Inventory Settings` · `District and Regional Product Settings` ·
`Kit Promotion Settings` · `Product Kit Settings` — closing **Product Settings** (88); then
**Vendor Settings** (94) for `Third Party Logistics Settings`, `Vendor EDI Settings` and
`Advanced Vendor Settings`.
