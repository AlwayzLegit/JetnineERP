# Product Settings — Part B (positions 45–88 of 88)

*Source: STORIS Help Center, System Administration → **Product Settings**, section id `15233908450836`.*
*Enumerated with the shared `grab()` helper; 88 articles returned. This file covers positions **45 through 88**
(44 articles), 1-indexed in enumeration order (which is alphabetical by title).*

## Position reconciliation

Part A ends at **position 44 = "Product Benefit Settings"**. This file starts at **position 45 = "Product
Benefits Entry"**. That is a sensible, contiguous continuation — the two titles are adjacent alphabetically
and are the two halves of the same feature (the *Settings* code table and the *Entry* screen that consumes
it). **No renumbering was required.** ID prefix `PRD`, numbered `PRD-045` … `PRD-088`, matching position.

Titles covered, in order:

| # | Title | # | Title |
|---|---|---|---|
| 045 | Product Benefits Entry | 067 | Special Order Template Settings |
| 046 | Product Clone Process | 068 | Spiff Table Entry Screen |
| 047 | Product Configuration | 069 | Substitute Product List Example |
| 048 | Product Configurator Rules Screen | 070 | Substitute Product List Settings |
| 049 | Product Family Settings | 071 | Substitute Product Selection |
| 050 | Product Kit Settings | 072 | Suite Configuration |
| 051 | Product Settings | 073 | Tariff Settings |
| 052 | Product Substitution Codes | 074 | Tax Class Settings |
| 053 | Product Type Codes | 075 | Text Field - Language Translation Entry |
| 054 | Protection Plan Product Selection | 076 | Update Product Images |
| 055 | Protection Plan Selection | 077 | Update Product Images - Left Pane |
| 056 | Protection Plan Settings | 078 | Update Product Images - Right Pane |
| 057 | Purchase Status Settings | 079 | Update Product Images - Top Pane |
| 058 | Retail Delivery Fee Overview | 080 | Vendor Inventory Quantities API Queue |
| 059 | Schedule Purchase Status | 081 | Vendor Ship From Freight and Cost |
| 060 | Set Configuration Rules | 082 | View Web Service Results |
| 061 | Set Configuration Sub-Option Rules | 083 | Volume Rebate Table |
| 062 | Set Predefined Items | 084 | Warranty Category Settings |
| 063 | Special Order Option List Settings | 085 | Warranty Component Settings |
| 064 | Special Order Option Price Settings | 086 | Warranty Overview |
| 065 | Special Order Option Settings | 087 | Warranty Replacement Screen |
| 066 | Special Order Option Type Settings | 088 | Warranty Settings |

> **Coverage note on the hunt list.** The brief asked me to hunt for a **Warehouse Inventory Settings**
> (product × location) article. **There is no article by that name anywhere in section `15233908450836`** —
> the 88-title enumeration above plus part A's 1–44 is the complete section. Product × location min/max and
> location selling price surface here only indirectly (see `PRD-051` Product Settings and `PRD-047` Product
> Configuration). `CFG-WHINV-MINSTOCK` / `CFG-WHINV-MAXSTOCK` / `CFG-WHINV-PRICE` therefore remain owned by
> the Inventory pack; the Product Settings reference screens do not contradict them but also do not define
> them. Flagged as `[DECISION NEEDED]` at the end.

---

### `PRD-045` Product Benefits Entry
*storis_ref: article 15294523057812*

**Purpose.** Free-text "product benefits" copy attached to a product — fabric/grade options, warranty info, cleaning/care instructions — used to arm the sales floor and to **print on standard floor tags**.

**Where it lives.** `Actions` button in the **Product Settings** and **Advanced Product Settings** processes. Also reachable from Product Benefit Settings (`PRD-044`, part A).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Benefits text box | multi-line text | Free text. Sequence-numbered by line (see below). |
| Actions → Language Translations | action | Per-language translation of the benefit text. |

**Behavior & rules.**
- **Line breaks are semantically load-bearing.** Exact source rule: everything typed up to the first Return is **"sequence 1"**; text up to the next Return is **"sequence 2"**, and so on. **Those sequence numbers are the addressing scheme used by the Product Benefits import and by label/tag form design** — so re-wrapping a paragraph silently re-maps what prints in each tag slot.
- A **read-only variant** of this window exists; which one you get is permission-driven. Editing is done from Product Benefit Settings / Product / Advanced Product.
- Benefits print via the **Label Processing** menu.

**Dependencies.** `PRD-044` Product Benefit Settings; `PRD-051` Product Settings and `PRD-001` Advanced Product Settings (part A) host the Action; `PRD-075` Text Field - Language Translation Entry; floor-tag/label forms; Product Benefits import.

**Build notes.** Model benefits as an **ordered list of rows** (`sequence`, `text`, `locale`) rather than a blob with newlines — that makes the label-slot binding explicit instead of implicit, and kills the whole class of "someone reflowed the text and the hang tags changed" bugs. Keep the STORIS sequence numbers as the row ordinal so existing label templates and imports port over. Read-only vs. editable is a permission, not a separate screen.

---

### `PRD-046` Product Clone Process
*storis_ref: article 15294522623508*

**Purpose.** Create a new product by duplicating an existing product record wholesale, then editing the differences.

**Where it lives.** Advanced Product Settings > **General** page > `Actions` > **Clone Info for New Product**. (Also on Product Settings' Actions menu, per `PRD-051`.)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| New Product ID | product code | "Enter the product number of the item you are creating." On Save, the new record is created and displayed. |

**Behavior & rules.**
- Flow: load the source product on screen → Actions → Clone Info for New Product → enter `New Product ID` → Save → the new product's fields are duplicates of the original's, and you are returned to Product Settings.
- The article does **not** enumerate what is and is not carried across (pricing, warehouse settings, images, benefits, configurator rules) — a real gap.

**Dependencies.** `PRD-001` Advanced Product Settings; `PRD-051` Product Settings; `PRD-038` Price Adjustment Clone Process (part A) is the analogous cloner for price adjustments.

**Build notes.** Implement clone as an explicit, **checklist-driven copy** with a confirmation screen listing exactly which related record sets come along (pricing tiers, product × location rows, vendor links, images, benefits, kit membership, configurator rules, protection-plan eligibility) and which do not (on-hand, cost layers, serials, open orders). `[DECISION NEEDED]` — see end. STORIS's opaque clone is a known source of mystery data.

---

### `PRD-047` Product Configuration
*storis_ref: article 15294470271892*

**Purpose.** The **Product Configurator** definition for a vendor's model: which option-type prompts appear when someone special-orders this product, in what order, which are required, which option lists feed them, and what defaults apply (separately for in-store and for web).

**Where it lives.** Seven documented paths, all ending in `... > Inventory Hierarchy Settings > Product Information Settings > Product Configurator Settings > Product Configuration` — reachable from System Administration, Buyer Tools, Merchandiser Tools, Merchandising and Distribution > Inventory, and Customer > Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code + lookup | Vendor whose model is being configured. |
| Vendor Model | code | The vendor model code of the product being configured. **The configurator is keyed by vendor + vendor model, not by product/SKU.** |
| Suite | optional code + lookup (read-only lookup window) | Assign a suite to this product for the selected vendor. |
| Option Type | code + lookup, repeating rows | The option-type prompts applied to this product, in row order. |
| Required | checkbox | Makes that Option Type a required prompt on the Configurator entry screen. |
| Lists | list code(s); Search = all valid lists, Action = **Multiple List Selection Window** | Which option/fabric lists are available for this option type on this product. |
| Default | option code (arrow picker) | Default fabric/option for this option type. |
| Web > Default | option code (arrow picker) | The single web default. |
| Web > Description | text; Action → **Description Field - Language Translation Entry** | Description of the default value shown on the web. |
| Web > Image | filename e.g. `productname.jpg` | Image associated with the item. Upload to the web server requires contacting STORIS. |

**Behavior & rules.**
- **For upholstery, the option type representing the main/primary fabric MUST be in the first position of the Product Configurator, and its `Required` box must be checked.** (Legacy note: it no longer has to be literally named `BAL`.)
- **`Default` options display only on initial entry into the Special Order Configurator process, and only if the default option is associated with a price** established via Option Price Configuration (`PRD-035`, part A). A default with no price row is silently invisible.
- **Configurable products cannot be maintained in eSTORIS — only in STORIS.**
- **If a soft kit is set to `Expand on Web` (Product Kit Settings, `PRD-050`), configurable products cannot be added to that kit.**
- **Web defaults are NOT validated against the Configurator Rules.** Exact source warning: "When setting defaults for the web, the program does not reference the Rules, so be sure your web defaults do not conflict with any rules you have set up." **This is a real data-integrity hole — the web can create an order that violates the rule engine.**
- eSTORIS allows only **one** value per configurable option on the web.
- For configurable products in a web collection, that collection **cannot** be set as "one product per row".
- Actions: **Clone Info For New Product**, **Rule Assignment** (→ `PRD-048`).

**Dependencies.** `PRD-035` Option Price Configuration, `PRD-033` Option Configuration, `PRD-036` Option Type Configuration, `PRD-030` List Configuration, `PRD-072` Suite Configuration, `PRD-048` Product Configurator Rules Screen, `PRD-060`/`PRD-061` Set Configuration Rules, `PRD-050` Product Kit Settings, `PRD-075` translation entry.

**Build notes.** Keep the configurator keyed by (vendor, vendor_model) but **also resolve it through the product record** so a SKU with no vendor model does not silently lose its options. **Do not replicate the "web defaults skip the rules" behavior** — run the same rule engine on every channel, at save time and at order time. Enforce the "primary fabric must be row 1 and required" constraint as a validation, not a convention. Make "default option has no price row" a save-time warning instead of a silent no-op.

---

### `PRD-048` Product Configurator Rules Screen
*storis_ref: article 15294469952020*

**Purpose.** Assign previously-defined Configurator rules (from Set Configuration Rules) to a specific option-type row of a specific product's configurator, and say what the rule does when it fires — force/forbid an option, or adjust price and cost.

**Where it lives.** `Actions` on the **Product Configuration** screen (`PRD-047`) > **Rule Assignment**. **You must select an option type on Product Configuration first or the action is unavailable.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | display-only | Vendor model code, carried from Product Configuration. |
| Option Type | display-only | Carried from Product Configuration. |
| Rule | code, **up to 20 characters**, Action = list of rules | The rule to enter/edit. Selecting a rule activates `Operand`. |
| Operand | enum | See exact list below. Inactive until `Rule` is answered. |
| Price | signed number or zero | Applies **only** when operand is `+` or `-`. |
| Cost | signed number or zero | Applies **only** when operand is `+` or `-`. |
| Option | code + Search | Applies **only** when operand is `=` or `#`. Mutually exclusive with `List`. |
| List | code + Search | Applies **only** when operand is `=` or `#`. Mutually exclusive with `Option`. |

**Behavior & rules.** Exact operand enum:
- `Equal ( = )` — the Rule must be **true** to pass the test.
- `Not Equal ( # )` — the Rule must be **false** to pass the test.
- `Add ( + )`
- `Subtract ( - )`
- `Multiply ( * )`
- `Assigned (AS)` — if the rule is true, **the line must have an option specified**.
- `Not Assigned (NA)` — if the rule is true, **the line must be left blank**.

- **Field activation is driven by operand and is mutually exclusive:** choosing `+` or `-` **de-activates `Option` and `List`**; choosing `=` or `#` **de-activates `Price` and `Cost`**.
- **`Multiply ( * )` is listed in the enum but the article never says which fields it activates or what it multiplies** — an undocumented operand. Flagged.
- Within `=`/`#`, `Option` and `List` are mutually exclusive: specifying one blocks the other.

**Dependencies.** `PRD-060` Set Configuration Rules (where rules are defined), `PRD-061` Set Configuration Sub-Option Rules, `PRD-011` Configurator Sub-Option Rules (part A), `PRD-047` Product Configuration, `PRD-030` List Configuration, `PRD-033` Option Configuration.

**Build notes.** This is a small rule DSL: `WHEN <rule> <operand> [<option>|<list>] THEN <price/cost delta | require | forbid>`. Model it as such with a typed effect union, so the operand→field activation matrix is a consequence of the type rather than 8 lines of UI enable/disable logic. **Resolve the `Multiply` semantics with the business before shipping** — `[DECISION NEEDED]`. Rule evaluation must run identically for web and in-store (see `PRD-047`).

---

### `PRD-049` Product Family Settings
*storis_ref: article 15294555044244*

**Purpose.** Group web products that share characteristics (size, color, comfort level) into a **product family**, so the storefront can render them as swatch/variant choices — and so **Print an Inventory Floor Tag can print "groups" of products on one hang tag.**

**Where it lives.** System Administration > System Settings > **Companion Application System Settings** > Web System Settings > Product Family Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product Family ID | code + Search | Create or edit a family. |
| Description | text, **up to 50 characters**; Action → Description Field - Language Translation Entry | Family description. |
| Use Image Squares | checkbox | Display the family's members as **thumbnails** on the product page. |
| Attribute Title 1 | numeric attribute-title ID; Action → Product Attribute Title Lookup / Product Attribute Title Settings | First variant axis. Drives the prompt in the Products grid. |
| Attribute Title 2 | numeric attribute-title ID; same actions | Optional second variant axis. **Maximum of 2 attributes per family.** |
| Available On Web | checkbox | Family is published to the web. Gated by the save rule below. |
| Products > Product ID | product code; Search → **Search for a Product** | Member product. Re-selecting a grid line edits its attribute values. |
| Products > Attribute Value 1 | free text **or** picker | Label and control come from Attribute Title 1. If no values were pre-linked to the title, the first entry box is free text; if values exist, use the arrow picker on the second box. |
| Products > Attribute Value 2 | free text **or** picker | Same, driven by Attribute Title 2. |
| Grid | add/edit/reorder | `Add (Plus)` to add; double-click a line to edit; promote/demote buttons re-order lines. **Grid order is meaningful and manually curated.** |

**Behavior & rules.**
- **Hard save rule:** to save a family with **Available On Web** checked, ALL of the following must hold — at least one **Title** defined, at least one **Product** in the grid, and **every** product in the grid must have a **Value** for **each** defined Title. Partial variant matrices cannot go live.
- **If a product in the family has associated Web Related Inventory Formations (set in Advanced Product Settings), those products appear as Add-Ons on the website's product page.** Family membership therefore has a second, non-obvious side effect on cross-sell.
- Attributes must be created **first** via Product Attribute Title Settings (`PRD-042`) and Product Attribute Value Settings (`PRD-043`) before linking.
- Attributes are **synced along with the products** linked to each name/value pair.
- Intended for the **non-Legacy STORIS eCommerce** solution.

**Dependencies.** `PRD-042` Product Attribute Title Settings, `PRD-043` Product Attribute Value Settings (both part A); `PRD-001` Advanced Product Settings (Web Related Inventory Formations); `PRD-025`/`PRD-026` Inventory Formation Settings/Overview (part A); Print an Inventory Floor Tag (label subsystem); `PRD-075` translation entry.

**Build notes.** This is a **variant group**, and two attribute axes is an arbitrary STORIS limit — build for **N axes** from day one (mattress: size × comfort × height is already three). Keep the "every member must have every axis value before publish" invariant; it is the right rule. Note the floor-tag reuse: our tag renderer needs to accept a family, not just a SKU.

---

### `PRD-050` Product Kit Settings
*storis_ref: article 15294525112980*

**Purpose.** Group products into a sellable **kit** (a bundle/set), define how the kit is priced, whether its components can ship separately, and how it behaves on purchase orders and on the web. **This is the single densest pricing article in the section.**

**Where it lives.** Point of Sale Control Settings > Settings > Product Kit Settings; Purchasing > Settings > Product Kit Settings; Inventory > Settings > Product Kit Settings. Support Files: Product.

**Fields — KIT DETAILS**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product Number | product code | The kit master SKU. |
| Kit Type | enum `Hard` / `Soft` | `Hard` — components **cannot** be delivered separately. `Soft` — components **can**. **Inactive if open orders exist for the kit master.** |
| As-Is | checkbox | Designates an **as-is kit master**. As-is kits may contain as-is products *and* special-order products. Active **only** when Kit Type = `Hard` **and** `Add to a Purchase Order - From Enter Sales Order…` is NOT checked **and** no open orders exist. |
| Source of Price | enum, valid values depend on Kit Type | `Product`, `Component` (Hard); `Product`, `Component`, `Kit Package` (Soft). Full semantics below. |
| Selling Price | money | The kit selling price; defaults onto sales orders. For **soft** kits active only when Source of Price is `Component` or `Kit Package`. |
| Promotion Code | code from Price Adjustment Settings | Applies a promotional price to the kit; populates Start/End from the price adjustment. |
| Kit Promo Code | display-only | Current kit promotion code + description. **Cleared when a Promotion Code and/or Start/End dates are entered and saved.** |
| Start, End | dates | Active **only for component-priced soft kits**. Any past or future date is acceptable provided `Start <= End`; **if you enter a Start you must enter an End, and vice versa.** |
| `$` (promo total) | display-only | Total promotional price of the kit = sum of component `Promo Price $`, falling back to `This Kit $` where the promo price is blank. |
| Display all Kit Components on Website | checkbox | Expand components on eSTORIS vs. roll up to the kit master. **Active only for soft kits.** |
| Add to a Purchase Order — From Enter Sales Order; insufficient Component quantity | checkbox | **Hard kit masters only.** On each sales order, if any component is short, prompt to add to a PO; Yes creates a new PO. |
| Kit number when Printed/e-Transmitted | checkbox | Include hard kit master SKUs on printed/transmitted POs. Components appear **regardless**. |
| Kit number on e-Acknowledgements | checkbox | Include hard kit master SKUs on PO acknowledgements. Components appear **regardless**. |
| Comments | **mandatory**, up to 30 characters; Action → Description Field - Language Translation Entry | Additional info about the kit master. |

**Fields — COMPONENTS**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product Number | product code; Search → Search for a Product | Component being added/edited. Double-click a grid row to load it. |
| Description, Unit | display-only | From Product Settings (purchasing unit of measure). |
| Quantity | number | Required quantity of this component per kit. |
| Substitution | list ID; Action → Kit Substitution List Lookup / Kit Substitution List Settings | Active for **component- and product-priced soft kits**. Entering a non-existent list ID prompts to create it. |
| Web Substitution | list ID; same actions | Active for component- and product-priced soft kits. |
| Web Image | checkbox | Component appears in the kit's eSTORIS image. **Soft kit components only.** Checking it puts an asterisk `*` next to the product name on the eSTORIS Product Display screen. Also exists as "Image Displayed" in Web Kit Add-On Settings and on the eSTORIS Product Maintenance screen. |
| This Kit $ | money | **Component-priced kits only.** Populates from `Default Kit Selling Price` (if any) else the `Selling Price` on the Pricing tab of Advanced Product Settings. **Gross margin for the piece is based on this field**, which is the point — it lets you shape margin per piece inside a bundle. |
| Total | display-only | `sum(This Kit $ × Quantity)` across components, for component-priced hard and soft kits. |
| Promo $ | money | **Component-priced soft kits only.** Promotional price for the component. |
| Selling $ | display-only | Component's Selling Price from Advanced Product Settings. |
| Default $ | display-only | From `Default Kit Selling Price` on the Pricing tab of Advanced Product Settings; **if that field is blank, the `Selling Price` is used instead.** |
| Grid columns | display | Product Number, Description, Unit (= `Selling Unit of Measure` from the Miscellaneous tab of the Product record), Quantity, Selling Price $, Web Image (`Yes`/blank), Substitution, Web Substitution, This Kit Price $, Promo Price $, Default Kit Price $. |

**Behavior & rules — pricing (exact semantics).**
- **Hard / `Product`**: kit selling price comes from `Selling Price` in Advanced Product Settings, or may be set in `Selling Price` here. **"If there is a markdown or promotional price in the Product Settings for the kit master, the overall kit price is affected."** — markdown flows through to the bundle.
- **Hard / `Component`**: kit price is the total of the individual components' `This Kit $`.
- **Soft / `Product`**: **if `Soft Kit Use Lowest Price` in Point of Sale Control Settings is checked, pricing is the total of the prices derived from the pricing hierarchy for all components; if it is NOT checked, the kit price uses each component's `Default Kit Price $`.** A single POS control flag silently changes how every soft kit prices. Hard kits may be components; soft kits may be components **only if their Source of Price matches**.
- **Soft / `Component`**: kit price = total of each component's `This Kit $`. **`Selling Price` must be entered and acts as a proof amount.** **No kits of any kind may be added as components.**
- **Soft / `Kit Package`**: `Selling Price` is the package price. When components explode onto the order, **each piece's selling price is derived from that piece's cost relative to the overall kit price** (i.e. cost-weighted allocation). Hard kits may be components; soft kits only with a matching Source of Price. **Special-order products are prohibited in package-priced kits.**
- **⚠ Direct interaction with the Inventory pack:** exact source text — *"When a kit's pricing is set to Component, it overrides the Location Selling Price $ in Warehouse Inventory Settings. The Warehouse Inventory Settings price is used only if the Source of Price for the kit master is set to Product."* **This EXTENDS `ITEM-045` / `CFG-WHINV-PRICE`: the location price scope is not universally authoritative — a component-priced kit outranks it.** See the reconciliation section at the end of this file.
- **When Source of Price = `Kit Package`, commissions and spiff amounts are taken from the components' promotion information in Advanced Product Settings but calculated off the KIT MASTER price, not the individual component.**
- **Promotional price beats kit price** whenever the order date falls in the promotion date range. For component-priced soft kits, `Promo $` beats `This Kit $` within the range. **There is no proof amount for the promotional total** — only the priced total is proofed.
- For component-priced kits, **`Total` must equal the header `Selling Price`.** On save mismatch a warning asks to override: **Yes silently rewrites `Selling Price` to match `Total`**; No forces you to fix one side. (Note the default-destructive direction.)
- For component-priced soft kits, **if you enter a Promotion Code it is IGNORED — only its Start/End dates are used.** Prices come from the per-component `Promo $`.
- Editing Start/End dates that came from a Price Adjustment issues a "code is no longer valid" warning and **removes the code from the kit**.
- **For soft kits STORIS prohibits: promotional pricing (from Advanced Product Settings or Price Adjustment Settings) on `Product`- or `Kit Package`-priced kits; and special-order products in package-priced kits.**

**Behavior & rules — other.**
- **Kits cannot have components with an inventory status designated "Defective"** (per the `Inventory Availability` field in Distribution Status Settings).
- Changing Kit Type **Hard → Soft** warns that Soft and `Add to a Purchase Order…` are incompatible; answering Yes **un-checks and de-activates** that field, then allows the change.
- Checking `Add to a Purchase Order…` **excludes the product from the Purchase Order Replenishment process**, overridable via `Include Orderable Products` in Purchasing Control Settings. **This is a direct carve-out from `REPL-010`/`REPL-020`.**
- With `Kit number when Printed/e-Transmitted` checked, **PO quantity changes can be made only at the kit master level**; component-level quantity edits are allowed **only** once that component is partially received (over/under-shipment corrections).
- Kit substitution lists must have a **`Kit Price Source` matching the kit's `Source of Price`**, and **the component must exist inside the substitution list.**
- eSTORIS: shopping carts observe `Expand on Web`. **If the total price of the kit falls below the standard kit price, kit pricing inactivates for the kit.** Removing a non-expanding soft kit item from a cart removes all its components. Web kit *additions* are included in kit pricing; kit *substitutions* are not. Wish List and the first Check Out page behave like the cart. Deleting a soft kit deletes its Web Item Add-On record; removing a product from a soft kit also removes it from the `Replaced Product` field in Web Item Add-On Settings.

**Dependencies.** `PRD-009` Component Priced Kits, `PRD-027` Kit Promotion Settings (part A); `PRD-039` Price Adjustment Settings, `PRD-040` Price Adjustments - Actions (part A); `PRD-069`–`PRD-071` substitute product list articles; `PRD-052` Product Substitution Codes; `PRD-001` Advanced Product Settings (Pricing tab, `Default Kit Selling Price`, `Selling Price`); Point of Sale Control Settings (`Soft Kit Use Lowest Price`); Purchasing Control Settings (`Include Orderable Products`); Distribution Status Settings (`Inventory Availability`); Web Kit Add-On Settings. Inventory pack: `ITEM-040`/`ITEM-041` resolution chain, `ITEM-044` as-is price, `ITEM-045` price scopes, `CFG-WHINV-PRICE`, `REPL-010`/`REPL-020`.

**Build notes.** Represent a kit as `kit_master` + `kit_component[]` with an explicit `price_source` enum (`PRODUCT` | `COMPONENT` | `PACKAGE`) and `kit_type` enum (`HARD` | `SOFT`), and validate the legality matrix (which combinations allow which fields, which allow nested kits, which allow special-order/as-is) **in one table**, not scattered across the form. **Extend the price resolver spec: `ITEM-040`'s chain must gain a kit step, and the winner order we observed is `component Promo $ (in date range)` > `This Kit $` > `location price (CFG-WHINV-PRICE)` > product-level chain.** Do **not** copy the "answer Yes and we overwrite your Selling Price" mismatch behavior — make the proof a hard block with an explicit "recompute header from components" button. Package-price allocation must be a stored, auditable allocation (we need it for returns and for margin), not recomputed on the fly.

---

### `PRD-051` Product Settings
*storis_ref: article 15294525107348*

**Purpose.** **The product master, simple edition.** Creates the "skeleton" of a product record — identity, hierarchy, cost, price, type flags — with Advanced Product Settings (`PRD-001`) available for the rest. "For most products, the Product Settings entry method is sufficient."

**Where it lives.** Eight documented paths: Point of Sale > Settings; Customer Service > Settings; Purchasing > Settings; Inventory > Settings; Accounting > Vendor Receivables > Vendor Receivables Settings; System Administration > Get Started - Enter Your Information > **Get Started Step 10 - Merchandise**; System Administration > System Settings > Purchasing and Logistic System Settings > Inventory Hierarchy Settings; System Administration > System Settings > Accounting System Settings > Vendor Receivables Systems Settings. Page headings: **General**, **User Defined Settings**.

**Fields — identity**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | code, **up to 20 alphanumeric characters** | The SKU. Search opens **Search for a Product** and can build an editable product *list*. **A counter beside the field shows position/total when a product list is active.** Auto-numbering comes from `Next Product Number` in Inventory Control Settings. |
| Description | text | First description line, used system-wide with the SKU. **If the product is flagged Special Ordered this must be generic** — describe the physical product without cosmetic special-order detail. Camera icon at right shows the product image if one exists (dimmed if none). |
| Second Description | text | Second line. **Used ONLY by the Label and Tag print routines.** |
| Inventory Type | enum, **immutable after save** | See enum below. |
| Brand | code | Brand association. **Many reports sort by brand.** |
| Vendor | code | The **primary** vendor from whom you buy this product. |
| Vendor Model | text | Vendor's model number. **Prints on the PO; if blank, the SKU prints instead.** Used for product cross-reference inquiries. |
| Group | code + Search | Product group. **All products must be in a group; all groups must be in a category.** |
| Commission Category | code | Combines with the Customer file's Commission Category to select a **Commission Matrix** record. **Only used if the matrix method is selected in the Sales Order Account Control File record.** |
| Style Code | **seven-character** code/word | e.g. `CONTEMP`, `TRAD`, `ORIENT`. |
| Collection | code, single / Search / Action → **Multiple Collection Selection** | Unlimited collection codes. **The first collection entered is the "primary collection"** and is what inquiries display. **Completing this field simultaneously updates the Collection Settings record(s) with this product code** (two-way write). |
| Product Type | code | See `PRD-053` Product Type Codes. |
| WMS Group | code | Active only if the **WMS Interface** is active. **If WMS is active this field is REQUIRED for all products except non-inventory products.** |

**Fields — measurement, cost, price**

| Field | Type | Purpose / business rule |
|---|---|---|
| Volume | number | Shipping volume for one unit; drives **receiving volumes from vendors and delivery volumes to customers**. May be true cubic volume or an arbitrary consistent unit (e.g. `3` for a three-cushion sofa). **"For accurate delivery capacities, use the same measurement type for all products."** Surfaces as `Shipping Volume` in Advanced Product Settings. On new products with the WMS interface active, **defaults from the associated Product Group's shipping volume**. |
| Replacement Cost | money | The manufacturer's list cost for **one purchase unit**. **Defaults into `Unit Cost` as the PO cost in Enter a Purchase Order.** For **Service Labor** products this is the **hourly** cost. |
| Average Cost | money, **6 digits dollars + 2 cents** | Weighted average cost. **HARD RULE: once the product has quantity on hand, average cost cannot be updated.** |
| Selling Price | money, **6 digits dollars + 2 cents** | The retail price used by Sales Order entry programs. |
| Suggested Retail Price | money | MSRP. **"Used for memo purposes, and product tags and labels only. It is not used for any calculations."** |

**Fields — flags**

| Field | Type | Purpose / business rule |
|---|---|---|
| Serial Tracked | checkbox | **Rejected with an error if the product is on an open purchase or sales order.** **Piece-less (non-referenced) products cannot be serial-tracked.** Default for on-the-fly products comes from Default Product Settings (`PRD-013`). |
| Special Ordered | checkbox | Allows special-ordering. **Inactive if `PO From Order Entry` is enabled.** Also blocked when: quantity on hand exists; open sales orders exist; open purchase orders exist; or the product is a kit component whose kit has `Use Package Price` enabled. |
| PO From Order Entry | checkbox | On each sales order, if quantity is short, prompt to create a PO. **Inventory products only. Inactive if `Special Ordered` is enabled.** Ignored for kit components (use Product Kit Settings for hard-kit masters). Default for on-the-fly products from Default Product Settings. Also affects eSTORIS orders. |

**Behavior & rules.**
- **Inventory Type exact enum:** `Retail Inventory` (regular, sellable on sales orders) · `Retail Part` (service **and** sales orders) · `Retail Labor` (labor, service and sales orders) · `Service Part Only` · `Service Labor Only` · `Service Charge Only` (service orders only, **not** special orders) · `Non-Merchandise Service` (a service unrelated to a product, e.g. repairing a scratched floor).
- **Inventory Type is permanently immutable once saved.** The only remedy is delete-and-recreate, permitted only when there is no quantity on hand and the product is on no open purchase or sales order. Special-order on-the-fly products default to `Retail Inventory` and cannot edit it.
- **Product ID is permanent once created.** With auto-numbering set to `Dynamic Identifier` (Inventory Control Settings), the code is generated from the Dynamic Identifier definition; **changing the component data later does NOT regenerate the ID — you must delete and recreate the product.**
- **⚠ FLOOR TAG TRIGGER (answers the brief's floor-tag hunt):** exact source text — *"Changes made to the Description, Second Description, Selling Price, Suggested Retail Price, or Product Benefits trigger an evaluation of the change(s) made and a response as to whether a floor tag should be placed in the label queue for on-hand floor sample pieces."* Five specific fields, evaluated on change, auto-queueing floor tags for on-hand floor samples.
- **⚠ COST-EXCEPTION EQUIVALENT (answers the wave-1 `Skip on Zero` hunt):** two **Extended Security** flags let users silently rewrite product cost from downstream transaction screens — **`Update Product Replacement Cost Within Purchase Entry screens`** (Purchase Order Entry, Purchase Order Acknowledgement, Product Performance and Purchase Recommendations) and **`Change Product Replacement Cost During Vendor Invoice Entry`** (Enter/Update Individual Vendor Invoice). See the reconciliation section — this is the product-level analogue of `Skip on Zero` and it undermines `COST-040` the same way. Both are inert unless the global **Extended Security** kill-switch is on (wave-1 cross-reference).
- **For products flagged Special Ordered the system does not maintain average cost** — it tracks average cost, replacement cost and exact cost **per piece** instead.
- Inactive groups (or groups under inactive categories) **cannot be selected**. **Changing a product's group does NOT update existing orders.**
- `Report Sort By` = `Vendor Model` in Inventory Control Settings makes `Vendor Model` effectively mandatory across the catalog.
- **Actions menu (exact list):** Add Attachments · Clone info for new product · Configurator Yardage · EDI Transmission Information · Edit Attachments · Gross Margin Calculator · Line Item Text · Price/Spiff/Commission Tables · Pricing Level Table · **Remove Special-Order Template Options** ("clear all special-order information previously assigned to the product") · Product Benefits Entry · Enter Special Order Options · View Attachments.
- **User Defined Settings tab:** grid of active user-defined prompt codes (`Setting`), a typed `Response`, and a `Select` button for predefined responses ("If a predefined response does not exist you are warned that the response must be manually entered"). **"Entries on this screen are for information only; no processing occurs based on this information."**

**Dependencies.** `PRD-001` Advanced Product Settings; `PRD-013` Default Product Settings; `PRD-006` Brand, `PRD-007` Category, `PRD-008` Collection, `PRD-022` Group Settings (part A); `PRD-053` Product Type Codes; `PRD-021` Gross Margin Calculator, `PRD-029` Line Item Text, `PRD-041` Price/Spiff/Commission Table, `PRD-012` Configurator Yardage (part A); `PRD-045` Product Benefits Entry; `PRD-046` Product Clone Process; Inventory Control Settings (`Next Product Number`, `Format`/Dynamic Identifier, `Report Sort By`); Sales Order Account Control File (commission matrix); Extended Security (`SEC-*`); WMS Interface. Inventory pack: `COST-010` costing method, `COST-040` cost exceptions, `ITEM-040`/`ITEM-041`, `ITEM-045`, `ITEM-046`.

**Build notes.**
- We need **one** product master screen with progressive disclosure, not a Simple/Advanced pair that write the same table — the STORIS split is a legacy artifact and a constant source of "I edited it in the other screen" confusion.
- **Do not make Inventory Type immutable.** Make it changeable with a guarded transition (same preconditions STORIS uses for delete-and-recreate: no on-hand, no open orders) and an audit row. Delete-and-recreate destroys history.
- **Do not make Product ID depend on attribute data** (the Dynamic Identifier trap). Opaque immutable surrogate ID + a mutable, human-facing SKU/display code.
- **`Suggested Retail Price` must stay non-calculational** but should feed the "compare at" price and markdown display — register it against `ITEM-046` reporting price tiers.
- **The floor-tag trigger field list is a real requirement** — implement as a declared watch-list on (`description`, `description_2`, `selling_price`, `msrp`, `benefits`) that enqueues a tag reprint for locations holding a floor-sample piece. Make the field list configurable rather than hard-coded.
- **The average-cost lock ("cannot update once on hand") is correct and we should keep it**, but our answer to a genuinely wrong average cost must be an **explicit, permissioned, audited cost adjustment** that writes a correcting layer — not the STORIS pattern of back-dooring `Replacement Cost` from a PO screen.
- User Defined Settings is a generic EAV bag with no processing. Keep it, but make it **typed and optionally validated**, and be explicit that nothing keys off it.

---

### `PRD-052` Product Substitution Codes
*storis_ref: article 15294523269396*

**Purpose.** Code table documenting the enum behind the `Substitute Code` field — how (and whether) STORIS auto-substitutes another product when this one is ordered.

**Where it lives.** Documentation for the **`Substitute Code`** field on the **Settings** tab of **Advanced Product Settings** (`PRD-001`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Substitute Code | enum (3 values) | See below. |
| Substitute Product | product code (on Advanced Product Settings) | The target of the substitution. |

**Behavior & rules.** Exact enum and semantics:
- **`No Substitution`** — never substitute.
- **`Comparable Product`** — substitute **only if insufficient quantity exists** to satisfy the order. **The system does not split line items in this case** (it is all-or-nothing, not partial fill + partial substitute).
- **`Always Substitute`** — whenever this product appears on an order, **always** ship the substitute.

For both substituting modes: **"The system derives the product description, the selling price, and the costs from the substitute product and posts sales analysis information to the substitute product."** — i.e. **the substitute's price wins over the ordered product's price, and the sale is credited to the substitute for reporting.** That is a silent price change at order time driven by a product-master setting.

**Dependencies.** `PRD-001` Advanced Product Settings (`Substitute Code`, `Substitute Product`); `PRD-069`–`PRD-071` substitute product list articles (the *list*-based substitution used inside kits, which is a separate mechanism); Status Code Settings. Inventory pack: `ITEM-040`/`ITEM-041` selling-price resolution.

**Build notes.** **This EXTENDS `ITEM-040`/`ITEM-041`:** substitution is an additional, pre-resolution step — the resolver must first decide *which product it is actually pricing*, then run the seven-step chain against that product. Document it as step 0. `Always Substitute` in particular is a footgun (a product that can never be sold as itself); require a reason/expiry on it. **Do not silently swap price without telling the salesperson** — surface "substituted X → Y, price changed $A → $B" on the line.

---

### `PRD-053` Product Type Codes
*storis_ref: article 15294523058068*

**Purpose.** Code table documenting the enum behind the `Product Type` field in Product Settings — the axis that decides whether inventory is counted at all, and whether pieces are tracked individually or as a lot.

**Where it lives.** Documentation for the **`Product Type`** field in **Product Settings** (`PRD-051`).

**Behavior & rules.** Exact enum:
- **`Inventory`** — stock products and anything you normally stock (including special-order products created in Product Settings rather than on-the-fly) for which you monitor and control inventory.
- **`Non-Inventory`** — miscellaneous services with no tangible goods: **service contracts, special-handling charges, fabric treatments**. **No inventory counts are maintained.** **HARD RULE: non-inventory products cannot be assigned to foreign vendors — if `Home Currency` in General System Control Settings is set to a country other than the domestic country, creating a non-inventory product raises an error.**
- **`Bulk Product`** — lot-tracked. Instead of a PIN/Reference number per piece, **one PIN/Reference number per lot per storage location**. Example from the article: receive 500 bed rails, half to `1A` and half to `1B` → **two** PIN numbers, one per storage location; adding/removing pieces moves the lot quantity. Recommended for high-volume, non-distinguishable peripherals (e.g. bed frames). **Bulk pieces: can have a bar code number; CANNOT be as-is, special-ordered, or serial-tracked; and cost out at the exact cost based on FIFO costing layers.**
- **`'Temporary' Special Order`** — special-order products created **on-the-fly during sales order entry**. **The system assigns this type automatically to every on-the-fly product.** **The `Purge Special Order & Obsolete Products` routine purges products with this type** — so "if you end up stocking the item, we suggest you change the product type code to `Inventory`" or it will eventually be deleted.

**Dependencies.** `PRD-051` Product Settings; `PRD-058` Retail Delivery Fee Overview (uses `Non-Inventory` + `Non-Inventory Usage`); General System Control Settings (`Home Currency`); Purge Special Order & Obsolete Products; storage-location / PIN subsystem. Inventory pack: `COST-010` costing method — **note Bulk explicitly costs FIFO by exact cost regardless of the general costing method setting.**

**Build notes.** `Product Type` and `Inventory Type` (`PRD-051`) are **two different enums that both sound like "what kind of thing is this"** — a genuine STORIS design wart and a recurring source of miskeyed products. In our model collapse them into (a) `stock_tracking` = `SERIALIZED` | `PIECE` | `LOT` | `NONE` and (b) `sellable_on` = set of {sales order, service order, special order}. **The auto-purge of temporary special-order products is dangerous** — we should soft-archive with a review queue, never hard-delete. **Bulk's FIFO-exact-cost carve-out must be represented explicitly in the costing spec** (`COST-010`), not left implicit.

---

### `PRD-054` Protection Plan Product Selection
*storis_ref: article 15294555336084*

**Purpose.** Step 3 of protection-plan attachment: pick which **order line items** are covered by a given protection plan, see the plan's calculated vs. overridden price, and move items between plans.

**Where it lives.** Enter a Sales Order > **Payment** > **Protection Plans** > `Plan Code` (if one is selected) > **Local Extra Action**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Protection Plan Code | display-only | Code + description. |
| Suggested Price — Selected Items | display-only | Calculated plan price based on the **selected** linked merchandise. Matches the `Suggested Price` column in Protection Plan Selection. |
| Suggested Price — All Eligible Items | display-only | Calculated price across **all potentially linkable** merchandise. |
| Current Price | display/override | Calculated price based on linked lines, **or the overridden price**. |
| Show Lines Linked to Other Plans | checkbox (default checked) | Show/hide qualified lines already attached to other plans. |
| Plan Limitations — Minimum Subtotal | display-only | Minimum merchandise subtotal the plan applies to. |
| Plan Limitations — Maximum Subtotal | display-only | Maximum merchandise subtotal. |
| Plan Limitations — Maximum Quantity | display-only | Maximum quantity for the plan. |
| Plan Limitations — Number of Plans Required | display-only | **Computed from the plan limitations and the currently selected grid rows** — i.e. the system tells you how many instances of the plan you must sell to cover the selection. |
| Plan Occurrence | dropdown | One entry per existing occurrence of the plan on the order, plus **`New`**. |
| Grid columns | display | `ID`, `Product`, `Description`, `Quantity Ordered`, **`Selling Price` (includes overrides and discounts)**, **`Regular Price` (original selling price prior to discounts/overrides)**, `Protection Plan`, `Room`, `Fulfillment`. |
| Actions → Remove Price Override | action | Removes a price override from a specific line item. |

**Behavior & rules.**
- **The candidate grid is driven by the plan's Inventory Formations** (`PRD-056`). Lines already linked to *this* plan are pre-checked; lines linked to a *different* plan show that plan; unlinked standalone lines also appear.
- **Hard kits count as ONE item in the grid — components are not listed separately.**
- **Overriding `Current Price` requires the `Override Calculated Protection Plan Price` permission in `Create a User/Group - Sales Security`; without it a security override prompt is required.** When an override succeeds, the word **`Override`** displays under the current price.
- Selecting `New` at **Plan Occurrence** forces a new plan instance and **populates the grid with all merchandise lines not currently linked to a plan — "You may select any of the merchandise without regard of plan limitations."** **That is an explicit bypass of the plan's own min/max subtotal and max quantity rules.**
- The Plan Limitations panel collapses entirely when the plan defines no limitations.

**Dependencies.** `PRD-055` Protection Plan Selection (step 2), `PRD-056` Protection Plan Settings (the plan definition + Inventory Formations + limitations), `PRD-025`/`PRD-026` Inventory Formations (part A), `PRD-050` Product Kit Settings (hard kit = 1 item), Sales Security (`Override Calculated Protection Plan Price` → `SEC-*`, see `parts/user-security-CATALOG.md`), Protection Plans Overview.

**Build notes.** Model plan attachment as a **many-to-many `plan_instance ↔ order_line`** with an explicit `plan_instance` (occurrence) entity — STORIS is right about occurrences and we need them for multi-plan orders. **Do not reproduce the `New`-occurrence limitation bypass**; enforce limitations on every path and let a permissioned override be the escape hatch, logged. Price override must be an audited event (`RPT-AUDIT`) carrying old price, new price, user, and reason.

---

### `PRD-055` Protection Plan Selection
*storis_ref: article 15294525107092*

**Purpose.** Step 2 of protection-plan attachment: show every protection plan that qualifies for the order, their suggested prices, limitations and completion status, and let the user select/maintain plans.

**Where it lives.** Enter a Sales Order > Merchandise Page > `Actions`; Enter a Sales Order > Payment Page > Protection Plans > `Actions`; Enter an Exchange > **Step 3 - Sales Merchandise** > `Actions`; Enter a Return > Payment Page > Protection Plans > `Actions`; Adjust Dollars on a Completed Order > Payment Page > Protection Plans > `Actions`.

**Fields — grid**

| Column | Purpose / business rule |
|---|---|
| Plan | Plan code. |
| Description | Plan description. |
| Selected | Checked if the plan is already part of the sales order. |
| Current Price | Current selling price if the plan is already selected. |
| Overridden | Checked if the calculated selling price has been overridden. |
| Suggested Price | Price based on **potentially linkable** merchandise in the order. |
| Partially Completed | The plan has been partially completed (i.e. some covered merchandise has been delivered). |
| Minimum Subtotal / Maximum Subtotal / Maximum Quantity | Plan limitations, from `PRD-056`. |
| Eligible Items | Checked when **unlinked** products on this order could still be applied to the plan. |
| Select | Opens **Protection Plan Product Selection** (`PRD-054`). |
| Select All | **Automatically selects all qualified products for the chosen plan**; a message notifies you the plan was auto-created. |
| Deselect All | Clears the selection. |

**Behavior & rules.**
- **The documented three-step model, exactly:**
  1. **Qualification** — Protection Plan Settings and order merchandise are reviewed. **"This initial step only qualifies protection plans based on Inventory Formations; quantity and subtotal limitations are reviewed when linking products and protection plans (step 3)."** Limitations are therefore *not* applied at qualification time.
  2. **Selection** — all qualified plans are presented. **Multiple plans may be selected**; existing plans on the order can be maintained or removed.
  3. **Protection Plan Product Selection** — link individual order products to the selected plan(s); products can be **moved from one plan to another**.
- **Auto-add behavior is controlled by two Point of Sale Control Settings flags:**
  - **`Automatically Add to Order`** — qualified plans are added to the sales order automatically. **This applies to NEW sales orders only**, and the user is informed.
  - **`Prompt to Add to Order`** — the user is prompted with a list of qualified plans, **on a new or existing order that has not been partially completed**.
  - Either way, **qualified plans may be manually added at any time.**
- **The same plan may appear more than once in the grid** if it is preexisting or covers different items on the order (multiple occurrences).

**Dependencies.** `PRD-054` Protection Plan Product Selection; `PRD-056` Protection Plan Settings; `PRD-025`/`PRD-026` Inventory Formations (part A); Point of Sale Control Settings (`Automatically Add to Order`, `Prompt to Add to Order`); Enter a Sales Order / Exchange / Return / Adjust Dollars on a Completed Order; Protection Plans Overview.

**Build notes.** The **"qualification ignores limitations, linking enforces them"** split is the source of a bad salesperson experience — a plan is offered, then rejected when you try to use it. **Qualify with limitations included** (or at minimum show "would require N plans / subtotal out of range" on the offer row). `Select All` should require the same confirmation as any auto-created revenue line. `Partially Completed` is the key state guard: once any covered item is delivered, plan composition must be frozen except via a controlled adjust path.

---

### `PRD-056` Protection Plan Settings
*storis_ref: article 15294555339412*

**Purpose.** **Define a protection plan / extended warranty product**: what merchandise it covers, its price and cost tiers, its commission and spiff treatment, its GL accounts, its tax treatment, where it can be sold, and how long the customer has to cancel it.

**Where it lives.** Nine documented paths, all ending in `... > Product Information Settings > Protection Plan Settings` — Customer Service, Customer > Settings, Buyer Tools, Merchandiser Tools, Buyer/Merchandiser Tools, Merch & Distribution > Inventory, Merch & Distribution > Settings, System Administration > **Get Started Step 9 - Merchandise**, and System Administration > System Settings > Merchandising and Distribution System Settings.

**Fields — identity**

| Field | Type | Purpose / business rule |
|---|---|---|
| Plan Code | **max 14 alphanumeric, NO SPACES** | The plan code. |
| Description | **max 30 alphanumeric**; extra action → multi-lingual translation | Plan description. |
| Warranty Code | dropdown, **MANDATORY** | Selects an extended warranty. "Provides information required by Customer Service and **identifies which 3rd party vendor is providing coverage**." |
| Third Party Plan Code | optional, **max 10 alphanumeric** | The 3rd-party provider's own code. **"The vendor may use this code in multiple protection plans"** — not unique. |

**Fields — accounting & tax (answers the brief's GL/tax hunt)**

| Field | Type | Purpose / business rule |
|---|---|---|
| **Sales GL Account** | GL account; Action → GL Account Entry Screen | **"If populated, this account is used rather than the account specified in General Ledger Assigned Account Settings."** A product-level GL override. |
| **Cost of Sales GL Account** | GL account; Action → GL Account Entry Screen | Same override semantics for COS. |
| Taxable | checkbox (**checked = taxable**) | Blank exempts from state and local taxes. |
| **Tax Class/SKU** | **max 20 alphanumeric** | **Only available for clients using the Alternate Tax Interface.** "The information entered here must be set up on the tax provider's system." |

**Fields — compensation**

| Field | Type | Purpose / business rule |
|---|---|---|
| Commission % | percent | **If populated, used instead of the percentage in Point of Sale Control Settings.** **HARD RULE: if set to zero (0), NO commission is calculated regardless of the POS Control Settings value.** (So `0` ≠ blank — zero is an active suppression.) |
| Spiff Amount | money; extra action → spiff table | Dollar award to the salesperson. **"this spiff amount is determined based on the selling price of the protection plan"** (not the merchandise). |

**Fields — availability & qualification**

| Field | Type | Purpose / business rule |
|---|---|---|
| Available at Locations | location code(s); extra action → multi-select | **Blank = available at every selling location.** |
| Inventory Formations | formation code(s); extra action → Multiple Inventory Formations. Optional. | Defines the eligible merchandise. **HARD RULE: if left empty, ANY product qualifies for this plan and all order merchandise can be linked to it.** |
| Use Regular Selling Price | checkbox | Checked → the **regular** selling price of merchandise is used for both **qualification** and for **calculating the plan's price and cost**. **"If promotional pricing is enabled and active when this box is checked the promotional price is used when determining plan qualification."** Unchecked → the **discounted or overridden** price is used. |
| Manager Only | checkbox, **default unchecked** | Excludes the plan from **automatic** addition to a sales order. **It still appears in the list of alternate plans for manual selection, and manager/trusted-advisor approval is required if selected.** |
| Only Available for Membership Customers | checkbox | Marks an **'enhanced'** plan available only to customers with an **active membership** — "plans not purchased by the customer but are offered without charge because of their membership status." See Membership Rewards Settings. |
| Cancellation Restriction Days | integer **1–999**, default **null** | Customer's days to cancel. **The effective date is the FIRST DELIVERY DATE of any purchased item covered by the plan** (not the order date). Past that window, **the plan cannot be cancelled without a security override.** Null = no restriction. |

**Fields — pricing / costing tiers**

| Field | Type | Purpose / business rule |
|---|---|---|
| Maximum Quantity | integer **1–100** | Maximum merchandise quantity the plan covers. **Blank = unlimited.** **HARD RULE: "If setting a maximum quantity, the minimum subtotal on the lowest tier must be zero."** **A linked hard kit master counts as a SINGLE piece of inventory even though it contains multiple components.** |
| Minimum Subtotal | money, per tier | Minimum merchandise subtotal the tier applies to. Blank = no minimum. |
| Pricing Method | enum | **`Fixed Amount`** (dollars) or **`Percent of Merchandise`** (percent of merchandise total linked to the plan). |
| Costing Method | enum | **`Fixed Amount`** (dollars) or **`Percent of Plan Price`** (percent of the plan's own selling price). |
| Price Amount / Price Percent | money or percent | Label switches on `Pricing Method`. **Cannot be updated if the price table was populated from a preexisting protection plan.** |
| Cost Amount / Cost Percent | money or percent | Label switches on `Costing Method`. Same immutability rule. |
| Grid (tiers) | `Minimum Subtotal`, `Price Amount`, `Price Percent`, `Cost Amount`, `Cost Percent` | Tiers build as you enter the fields above; visible columns depend on the chosen methods. Double-click a row for a read-only detail view. **On preexisting grid rows, only Price Amount/Percent and Cost Amount/Cost Percent can be updated.** |
| Plan Terms Information | **free text, no character limit** | **Printed on order forms wherever protection plans are sold — printed once per protection plan on the order.** |

**Behavior & rules (tier semantics — read carefully, this is genuinely confusing).**
- **A single tier can be used to express "plan applies only at or above $X":** e.g. `Minimum Subtotal` `$100`, `Price Amount` `$15`, `Cost Amount` `$10` → the plan applies only if the qualified merchandise subtotal (per the Inventory Formation) is **$100 or more**, and **"The calculation is performed on the entire amount of the qualified purchase."**
- **⚠ Overloaded field:** exact source text — *"If a Minimum Subtotal is set without an associated Price or Cost Amount, that amount is the maximum subtotal for the chosen plan; the protection plan will not qualify for orders with more than that amount."* **The same column means "floor" when priced and "ceiling" when unpriced.** This is a hard trap.
- **"Neither a minimum or maximum subtotal can be set if a maximum quantity is configured."** — quantity-limited and subtotal-limited plans are **mutually exclusive**.
- **Multiple protection plans are permitted on a single order** because several may be needed to cover all merchandise.

**Dependencies.** `PRD-054`, `PRD-055` (the order-side selection screens); `PRD-018` Factory/Extended Warranty Code, `PRD-084`–`PRD-088` warranty articles; `PRD-025`/`PRD-026` Inventory Formations (part A); `PRD-068` Spiff Table Entry Screen; `PRD-074` Tax Class Settings; General Ledger Assigned Account Settings; Point of Sale Control Settings (commission %, auto-add flags); Sales Security (`Override Calculated Protection Plan Price`); Membership Rewards Settings; Alternate Tax Interface; `PRD-075` translation entry.

**Build notes.**
- **This is the product-level GL and tax assignment the brief asked me to hunt for** — but note it is *plan*-level, not general product-level. General product GL lives in **Group Settings** (see `PRD-058`, which routes product GL through the product's Group). Register both: `CFG-PRD-GL-SALES`, `CFG-PRD-GL-COS` (plan/group scoped overrides of General Ledger Assigned Account Settings).
- **Split the overloaded `Minimum Subtotal` into two explicit fields** (`min_subtotal`, `max_subtotal`). The STORIS encoding will produce wrong plan qualification the first time someone enters a bare threshold.
- **`Commission % = 0` must stay distinguishable from blank.** Use a nullable numeric with a separate `suppress_commission` boolean, or we will lose that behavior on the first ORM round-trip.
- Cancellation window anchored on **first delivery date** is correct and non-obvious — implement as a derived, stored date so it does not shift when fulfillments change.
- Tier immutability ("cannot be updated if populated from a preexisting plan") is a cloning artifact; we should instead **version plans** so pricing history is preserved for in-force contracts. `[DECISION NEEDED]`.

---

### `PRD-057` Purchase Status Settings
*storis_ref: article 15294525105812*

**Purpose.** Maintain **purchase statuses** — the codes that "determine your ability to re-order a product" — comprising six delivered status **types** plus any user-defined status **codes** mapped onto them.

**Where it lives.** Buyer Tools / Merchandiser Tools / Buyer-Merchandiser Tools > Settings > Inventory Hierarchy > Product Information > Purchase Status Settings; Merch & Distribution > Inventory > Settings; Merch & Distribution > Settings; Accounting > Vendor Receivables > Vendor Receivables Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Purchase Status | code, **up to 4 alphanumeric** + Search | The status code to create or edit. |
| Description | **up to 30 alphanumeric**; Action → Description Field - Language Translation Entry | Long description. |
| Short Description | **up to 10 alphanumeric**; Action → translation | **Appears in the View Product Availability routine and is usable in the Report Builder.** |
| Type | enum (arrow picker) | The delivered purchase status **type** this code maps to. **The `Purge` status is NOT available for selection here.** **Inactive when editing an existing code.** |
| Suppress from Product Search for: User | user ID(s); Search → Read-Only Lookup, Action → **Multiple Staff Selection Window** | Hide products with this status from product searches for these users. |
| Suppress from Product Search for: User Group | group ID(s); Search → Read-Only Lookup, Action → Multiple Selection Lookup | Same, per user group. |

**Behavior & rules.**
- **HARD RULE: "You cannot delete existing purchase statuses, and you can edit only the two Description fields."** Purchase statuses are effectively append-only; the `Type` mapping is set once at creation and then frozen.
- There are **six** delivered status types; the article does not enumerate them (see the separate *Purchase Statuses* article, which is outside this section). `Purge` (`P`) and `One Time Buy` (`O`) are named indirectly in `PRD-059`.
- Search suppression applies **inside STORIS and in eRoam II** (the STORIS iPad application).
- **When a user or user group is deleted via Create a User / Create a User Group, the system reviews all purchase status codes and removes that user/group from the purchase status settings.** (A rare instance of STORIS cleaning up referential debris.)

**Dependencies.** `PRD-059` Schedule Purchase Status; `PRD-001` Advanced Product Settings (Settings tab, `Purchase Status`); **Warehouse Inventory Settings** (has its own `Purchase Status` field — see coverage note); `PRD-015` District and Regional Product Settings (part A); View Product Availability; Report Builder; Create a User / Create a User Group (`SEC-*`); eRoam II. Inventory pack: `REPL-010`/`REPL-020` — **purchase status gates re-orderability and therefore gates replenishment.**

**Build notes.** Purchase status is a **lifecycle state machine** (active / discontinued / one-time-buy / purge / …) with two independent consequences: *can it be re-ordered* and *is it visible in search, for whom*. Model those as explicit attributes of the status rather than baking them into the code's identity. **Undeletable statuses with a frozen type mapping is unnecessary** — give us an `active` flag and a merge/retire path instead. The per-user/per-group search suppression is genuinely useful (hides discontinued SKUs from sales without hiding them from buyers) — keep it, but resolve it through the normal most-specific-scope-wins evaluator rather than a bespoke list on the code.

---

### `PRD-058` Retail Delivery Fee Overview
*storis_ref: article 48289352920852*

**Purpose.** How to configure **state-mandated retail delivery fees (RDF)** — e.g. Colorado's $0.28 — so they are automatically added to orders with delivery or direct-ship fulfillments to an address in that state. **"It's recommended to create different retail delivery fees for each state with the requirement."**

**Where it lives.** Not a screen — a configuration overview spanning **Advanced Product Settings**, **Group Settings**, and **Sales Tax Settings**.

**Fields — the required Advanced Product Settings configuration (exact)**

| Field | Required value | Note |
|---|---|---|
| Inventory Type | **`Retail Inventory`** | |
| Product Type | **`Non-Inventory`** | |
| **Non-Inventory Usage** | **`Retail Delivery Fee`** | The usage enum is what makes the fee machinery fire. |
| Tracking | **must NOT be `Special-Ordered`** | |
| Default Fulfillment Method | **`No Default`** | "and the Sales Tax Settings will take precedence." |
| Taxable | check if the fee is itself subject to tax | Controls the default taxability of the fee. |
| Tax Class | set if using Avalara as ATI | |
| Commissionable | **must remain unchecked** | |
| Cost | **`Replacement cost` is IGNORED.** A `Non-Inventory %` may be specified and will be used to update line items and BTA. "The rest of the settings on this page should be left empty." | |
| Selling Price | the fee amount — **or `$0.00` if using Avalara as ATI** | |
| Discountable | **should not be checked** unless the fee is genuinely discountable | |
| Promotion Code | **must not be used** — "Promotional Pricing will be used if set" | |

**Fields — Group Settings and Sales Tax Settings**

| Where | Field | Rule |
|---|---|---|
| **Group Settings** | **Ledger Account Number** | Put the fee in its own group and set the GL account there **to track the fee's GL**. |
| **Group Settings** | **Return Restriction Days** = **`1`** | **Prevents the fee from being included when returning a product.** |
| **Sales Tax Settings** | `Jurisdiction` | The state requiring the fee. |
| **Sales Tax Settings → Non-Inventory Usage Settings tab** | **Retail Delivery Fee** | The product ID of your fee. **"You can only enter one fee per state."** |

**Behavior & rules.**
- **Two entirely different behaviors depending on tax interface:**
  - **Alternate Tax Interface (e.g. Avalara):** selling price `$0.00` + a Tax Class. **The RDF does NOT display as a line item on the sales order; it is included in the sales tax total** and only visible via the order's **Order Tax Information**.
  - **STORIS tax interface:** the fee amount goes in the selling price and **is added as an additional line item** when a tangible, taxable product with a delivery or direct-ship fulfillment to an in-state address is added to the order.
- **The fee is charged ONCE per order** regardless of line-item quantity, number of deliveries, or split shipments. The fee line **may be moved between qualified fulfillments on the same order.**
- **Requalification triggers in Enter a Sales Order:** creating a new fulfillment, changing the method on an existing fulfillment, deleting a fulfillment by moving all its lines to another, changing the deliver-to address on a fulfillment, and changing the deliver-to address on a direct shipment.
- **Auto-removal:** the fee is removed automatically if the fulfillment no longer has a qualified deliver-to address or a fulfillment type of delivery/direct-ship. It can also be added/removed on open fulfillments when the deliver-to address changes in **Advanced Customer Settings**, **Update a Customer Address**, or **Deliver-to Settings**.
- **Fee changes:** update the price in Advanced Product Settings and/or the jurisdiction mapping in Sales Tax Settings. **Open orders carrying the fee are requalified with the new price and the user is notified during order completion.** **HARD OPERATIONAL RULE: fulfillments already on a manifest cannot be edited — any manifests with affected orders must be DELETED, delivery tickets reprinted, and manifests recreated so the fulfillments requalify.**
- **Exchanges:** no additional fee for even exchanges. Splitting an exchange has no effect — a fee on the sale portion stays with the standalone sales order, a fee on the return portion stays with the new standalone return order.
- **The RDF is not required for returns** — the `Return Restriction Days = 1` trick is the documented way to make it unreturnable.
- **NextGen cart:** the RDF is not a cart line item; it appears in the **Order Summary**, then as a line on the order confirmation page. **With Avalara it does not appear in the Order Summary at all — it is inside the sales tax total.**

**Dependencies.** `PRD-001` Advanced Product Settings; `PRD-053` Product Type Codes (`Non-Inventory`); `PRD-022` Group Settings (part A — `Ledger Account Number`, `Return Restriction Days`); `PRD-074` Tax Class Settings; Sales Tax Settings (`Jurisdiction`, Non-Inventory Usage Settings tab); Alternate Tax Interface / Avalara; manifest & delivery ticket routines; Advanced Customer Settings / Update a Customer Address / Deliver-to Settings.

**Build notes.**
- **Do NOT model regulatory fees as products.** This whole article is a workaround for the absence of a fee engine. Build a first-class **`jurisdictional_fee`** entity (jurisdiction, trigger conditions, amount or rate, once-per-order vs. per-line, taxable, refundable, GL account, effective date range) evaluated at fulfillment qualification. That kills the "abuse Return Restriction Days to make it non-returnable" hack and the "set price to $0 so Avalara handles it" bifurcation.
- **Fees must be effective-dated**, not edited in place — STORIS's "change the price and requalify open orders" is how you end up remitting the wrong amount for a period you can no longer reconstruct.
- The **manifest requalification hole is a real operational landmine** — our fee changes must either (a) be effective-dated so in-flight manifests are unaffected, or (b) produce a work queue of affected manifests. `[DECISION NEEDED]`.
- Note this article confirms **product-level GL assignment in our system runs through the product's Group** (`Ledger Account Number` in Group Settings), with plan-level overrides in `PRD-056`.

---

### `PRD-059` Schedule Purchase Status
*storis_ref: article 15294523057300*

**Purpose.** Schedule a **future-dated purchase status change** for a product — e.g. flip a SKU to discontinued on a set date without anyone remembering to do it.

**Where it lives.** **Advanced Product Settings > Settings Tab > `Action` button at the `Purchase Status` field**; **Warehouse Inventory Settings > `Action` button at the `Purchase Status` field**; **District and Regional Product Settings > Regional Settings Tab > `Action` button at the `Purchase Status` field**. *(Note: this is the second explicit confirmation in this section that a **Warehouse Inventory Settings** screen exists — see coverage note at the top of this file.)*

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Current Status is | display-only | The product's current purchase status. |
| On This Date | date + calendar picker | The date the status should change. |
| Change Status To | purchase status code | The target status, subject to the validation below. |

**Behavior & rules.**
- **Execution is driven by the `Scheduled Settings Update` process. When it runs, the purchase status changes AND the scheduling row is deleted** — so there is no record afterwards that the change was scheduled rather than made by a person. (Feed `RPT-AUDIT`.)
- **`Change Status To` accepts any purchase status that:**
  - **does not match the current purchase status**,
  - **is not `"P"` for purge**, and
  - **is not `"O"` for one time buy when the product type is `non-inventory`, `temporary special order`, or `special ordered`.**
- **Only ONE scheduled change can be pending at a time** (the screen models a single Current → On This Date → Change To triple, and the row is removed on execution) — you cannot queue a status ramp.
- A **read-only version** appears when reached through a view-only routine such as **View Advanced Product Settings**.
- **Note the scope collision:** the same action exists on the *product* record, on the *product × location* record (Warehouse Inventory Settings) and on the *district/region* record — three scopes can each hold a pending change for the same product with no stated precedence.

**Dependencies.** `PRD-057` Purchase Status Settings; `PRD-001` Advanced Product Settings; `PRD-015` District and Regional Product Settings (part A); Warehouse Inventory Settings; Scheduled Settings Update process; `PRD-053` Product Type Codes. Inventory pack: `REPL-010`/`REPL-020` (status gates re-order), `ITEM-045` price scopes (same product/district/location scope triple).

**Build notes.** Generalize this: we want a single **scheduled attribute change** facility (entity, scope, attribute, new value, effective date, requested-by, reason) rather than a bespoke screen per field — the same need exists for price, min/max, and web availability. **Keep the executed rows** as history instead of deleting them, and emit an audit event when the scheduler fires. **Define precedence explicitly when product, district and location each have a pending status change** — STORIS does not. `[DECISION NEEDED]`.

---

### `PRD-060` Set Configuration Rules
*storis_ref: article 15294470605716*

**Purpose.** Define, per vendor, how configurator options constrain each other — e.g. "this chair frame must use this basic fabric, and prevent users from choosing a different one." These are the rule *definitions* that `PRD-048` assigns to a product's option-type rows.

**Where it lives.** Seven paths, all ending `... > Product Information Settings > Product Configurator Settings > Set Configuration Rules` (System Administration, Buyer Tools, Merchandiser Tools, Buyer/Merchandiser Tools, Merch & Distribution > Inventory, Merch & Distribution > Settings, Customer > Settings).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code + Search | **Rules are scoped to a vendor.** |
| Rule | code, **up to 20 alphanumeric** + Search | The rule identifier. |
| Option Type | code + Search, **MANDATORY** | The option type the rule line tests. |
| Option | code + Search, **REQUIRED** | An option associated with that option type. |
| List | code + Search, optional | A list code instead of / alongside a single option. |
| Comparison Option Type | code + Search, optional | A **second** option type to compare against. **Must be different from `Option Type`.** |
| Operand | enum, **required, default `Equal`** | `Equal ( = )` · `Not Equal ( # )` · `Assigned (AS)` · `Not Assigned (NA)`. |
| Operator | enum `AND` / `OR`, **default `AND`** | Joins this rule line to the next. |

**Behavior & rules.**
- `Assigned (AS)` — the line evaluates **true** for the option type **if an option has been entered**. `Not Assigned (NA)` — true **if the option has NOT been entered / left blank**. Source note: **"The Not Assigned operand can be used in situations where the configurator option, when chosen, requires that the other options be left blank."**
- **HARD RULE: operators may not be mixed. Every row in a rule must be `AND`, or every row must be `OR`.** No parenthesisation, no precedence — the rule language cannot express `A AND (B OR C)`.
- An operator is **never** required on the last grid row; it **is** required whenever the rule has multiple tests.
- Grid maintenance: adding a row requires specifying **one of** `Option`, `List`, or `2nd Option Type`. **If the row being added is preceded by a row with no operator, you must add an operator to that row.** Removing the last row requires first removing the operator from the preceding row.
- Note the internal inconsistency in the source: `Option` is described as "required" while the grid rules say you may specify `Option` **or** `List` **or** `2nd Option Type`.

**Dependencies.** `PRD-048` Product Configurator Rules Screen (assignment); `PRD-047` Product Configuration; `PRD-061` Set Configuration Sub-Option Rules; `PRD-030` List Configuration, `PRD-033` Option Configuration, `PRD-036` Option Type Configuration (part A).

**Build notes.** This is a **flat conjunctive/disjunctive predicate list**. If we rebuild a configurator, use a proper expression tree (or at minimum allow grouped clauses) — the no-mixing restriction forces merchandisers to author many near-duplicate rules, which is where configurator data rots. Rules being **vendor-scoped** is the right granularity; keep it.

---

### `PRD-061` Set Configuration Sub-Option Rules
*storis_ref: article 15294470606356*

**Purpose.** The same rule language as `PRD-060`, but for **sub-options** entered on the Special Order Configurator screen — adds a `Level` (Sub vs. Parent) dimension so a sub-option can be constrained by its parent's value.

**Where it lives.** Seven paths ending `... > Product Configurator Settings > Set Configuration Sub-Option Rules`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code + Search | Part of the composite key. |
| Option Type (key) | code + Search, **MANDATORY** | **Composite key = vendor + option type + rule ID.** |
| Rule | code, **up to 20 characters** + Search | Part of the composite key. |
| Option Type (comparison subject) | code + Search, **MANDATORY** | The option type used for the rule comparison. |
| Level | enum `Sub` / `Parent`, **default `Sub`** | Whether the option type to its left is at sub-option or parent level. |
| Operand | enum, **required, default `Equal`** | `Equal ( = )` · `Not Equal ( # )` · `Assigned (AS)` · `Not Assigned (NA)` — same semantics as `PRD-060`. |
| Option | code + Search | The option being tested for. **If entered, `List`, `2nd Option Type` and `Level` become unavailable.** |
| List | code + Search | The list of values being tested for. **If entered, `Option`, `2nd Option Type` and `Level` become unavailable.** |
| Comparison Option Type | code + Search | The option type whose value is compared to `Option Type`. **Must differ from `Option Type`.** **If entered, `Option` and `List` become unavailable.** |
| Level (2nd) | enum `Sub` / `Parent`, default `Sub` | Level of the 2nd option type. |
| Operator | `AND` / `OR`, **default `AND`** | Joins this line to the next. |

**Behavior & rules.**
- **Strict three-way mutual exclusion** between `Option`, `List` and `2nd Option Type` — exactly one per rule line.
- Same operator constraints as `PRD-060`: **never required on the last row; required with multiple tests; may not be mixed — all `AND` or all `OR`.**
- Grid columns: `Option Type`, `Option`, `List`, `2nd Opt Type`, `Operand`, `Operator`. Same add/remove operator housekeeping as `PRD-060`.

**Dependencies.** `PRD-060` Set Configuration Rules; `PRD-011` Configurator Sub-Option Rules (part A); `PRD-047` Product Configuration; `PRD-048`; Special Order Configurator.

**Build notes.** Merge `PRD-060` and `PRD-061` into **one** rule model with an optional `level` qualifier on each operand — they are the same language with one extra field, and maintaining two parallel screens guarantees they drift.

---

### `PRD-062` Set Predefined Items
*storis_ref: article 15294525107604*

**Purpose.** Define **Predefined Configured Items** — a named, fully-specified combination of configurator options with its own **special selling price**. When a salesperson configures a product on an order and the configuration is an **exact match**, that special price is used instead of the accumulated option pricing.

**Where it lives.** System Administration > System Settings > Merchandising and Distribution System Settings > Inventory Hierarchy Settings > Product Information Settings > Product Configurator Settings > Set Predefined Items.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code + Search | |
| Vendor Model | code + Search | The configured product. |
| Predefined Name | **up to 20 alphanumeric**, unique | Identifier for this predefined combination. Re-enter it to maintain. |
| Comments | **free text, up to 15 characters** | **Displays on the Order Line Comments when this predefined item is added to an order.** |
| Selling Price $ | money | **The special price applied on exact match.** |
| Option Type / Option | grid selection | Double-click an option type in the grid to activate `Option`; enter/select the option; `Add` to the grid; `Save` when all options are specified. |
| Grid columns | display | `Option Type`, `Option Type Description`, `Option`, `Option Description`. |

**Behavior & rules.**
- **⚠ This is an additional, undocumented-in-the-Inventory-pack winner in the selling-price chain:** exact source text — *"When adding a configured product to a sales order, if the configured item is an exact match to a Predefined Configured Item, the special price established for the predefined item is used."* **Match is all-or-nothing (exact configuration), and the price replaces the computed configurator total.** See reconciliation section.
- The grid of available option types is populated **from the configurator definition** once `Predefined Name` is filled in.
- Bulk maintenance path: the **`PC Predefined Items` worksheet** in the **Configurator Conversion Spreadsheet**, uploaded via the **`Update Product Configuration Detail`** process.

**Dependencies.** `PRD-047` Product Configuration; `PRD-035` Option Price Configuration (part A); Special Order Configurator; Update Product Configuration Detail. Inventory pack: `ITEM-040`/`ITEM-041` price resolution, `ITEM-042` price matrix.

**Build notes.** This is effectively **"a SKU that happens to be a configuration"** and should be modelled as such — a saved variant with its own price, rather than a price exception hanging off the configurator. That makes it reportable, forecastable and orderable like anything else. **Register it explicitly in the price resolution spec** — an exact predefined-configuration match must sit above the option-accumulation total.

---

### `PRD-063` Special Order Option List Settings
*storis_ref: article 15294525106452*

**Purpose.** Create and maintain **pre-defined lists of special order options**, so users pick from a controlled vocabulary instead of typing free text. Optional — lists are **not required** to build special order templates.

**Where it lives.** Menu; and **Special Order Template Settings > extra `Action` button at `Option List`** — **where it is called "Create New Special Order Option List".**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code + lookup, **MANDATORY** | The vendor the list applies to. |
| Option List | code, **up to 20 characters**, unique | The list identifier. |
| Option Type | code + lookup, **MANDATORY** | **Only ONE option type per list.** |
| Description | **MANDATORY**, up to 30 alphanumeric free text; lookup → multi-lingual translation | |
| Option | code + lookup; `Action` → create a new special order option | Associates an option with the list. |
| Grid | ordered | **"The order in which you see the options is the order in which the options are presented to the user."** Re-order with promote/demote; `Remove` to detach. |

**Behavior & rules.**
- **HARD RULE: special order option lists cannot be deleted from ACTIVE templates, but can be deleted from INACTIVE templates.** The active/inactive template flag is the universal gate across all four special-order settings screens.
- Purpose is explicitly to **"limit users to only being able to select pre-defined options."**

**Dependencies.** `PRD-065` Special Order Option Settings, `PRD-066` Special Order Option Type Settings, `PRD-067` Special Order Template Settings, `PRD-064` Special Order Option Price Settings; Enter Special Order Options; `PRD-075` translation entry.

**Build notes.** Straightforward ordered pick-list. **Keep the explicit display ordering** — merchandisers rely on it. One option type per list is a reasonable constraint; keep it so the list is unambiguously the domain of one prompt.

---

### `PRD-064` Special Order Option Price Settings
*storis_ref: article 15294525105684*

**Purpose.** **Pre-define the price and cost of each special order option**, including **date-ranged sale price and sale cost** and **district-level pricing**. This is the article that answers the brief's "promotional and sale pricing with date ranges" hunt on the special-order side.

**Where it lives.** Menu (the article's Access block is empty other than the header).

**Fields — key (all three mandatory; the rest activate once these are filled)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | single product + lookup, **MANDATORY** | **Option pricing is per-PRODUCT, not per-vendor.** |
| Option Type | single option type + Special Order Option Type Lookup, **MANDATORY** | |
| Option | option + field-level extra action ("view existing options for the product vendor/option type"), **MANDATORY** | |

**Fields — pricing**

| Field | Type | Purpose / business rule |
|---|---|---|
| Regular Price | money, **MANDATORY** | Regular selling price of the option. |
| Regular Cost | money, **MANDATORY** | Regular selling cost of the option. |
| Sale Starting Date / Sale Ending Date / Sale Price | date/date/money | **Optional as a group, but ALL-OR-NOTHING: "if any are populated, they all must be populated."** |
| Cost Sale Starting Date / Cost Sale Ending Date / Sale Cost | date/date/money | Same all-or-nothing group. **Cost has its OWN independent sale window, separate from the price sale window.** |

**Fields — District Pricing** *(section is hidden entirely if regional processing is not active)*

| Field | Type | Purpose / business rule |
|---|---|---|
| District | code + Search | The district. |
| District Regular Price | money, **REQUIRED** within the district row | District-level regular selling price. |
| District Sale Price / District Sale Starting Date / District Sale Ending Date | money/date/date | **All-or-nothing group.** |
| Grid | add/remove | District pricing rows accumulate in the grid. |

**Behavior & rules.**
- **Base-price rule (exact):** *"The first pricing option built is considered the Primary Option (i.e. the base price), unless the piece has a Selling price, which would be considered the base price. In either scenario, any additional options are considered to be upcharges to the base price."* **So: piece Selling Price (if any) → else the first option built → and everything else is an upcharge.** **Note the collision with `ITEM-044`: an as-is piece's own selling price beating the chain is consistent with this, but here ANY piece-level selling price becomes the base.**
- **`Save and Add Another`** keeps the key fields for rapid entry.
- **Deletion guard (exact):** to remove a special order option price, the referenced option must **not be in use by any active special order template**, or must **not reside in any special order option list referenced by any active special order template that uses `'Automatic'` pricing.** Otherwise a message is presented and the option must first be removed from the associated active templates.
- **If a template is set to `Auto` pricing but no pricing is established here, option prices default to `$0.00`** (see `PRD-067`). **⚠ This is the special-order analogue of the wave-1 `Skip on Zero` problem: an option silently prices and COSTS at $0.00 with no exception raised, and because `Auto` pricing writes the total back to the order line, margin is wrong at the source.** Flagged in the reconciliation section.

**Dependencies.** `PRD-065`, `PRD-066`, `PRD-063`, `PRD-067`; `PRD-015` District and Regional Product Settings (part A); Enter Special Order Options; Point of Sale Control Settings. Inventory pack: **`ITEM-045` three price scopes** (this screen implements product + district, but **not** location, for special order options), `ITEM-040`/`ITEM-041`, `ITEM-044`, `COST-010`, `COST-040`.

**Build notes.**
- **Date-ranged sale price and sale cost with independent windows is a genuine requirement** — register as `CFG-PRD-SALE-PRICE-WINDOW` and `CFG-PRD-SALE-COST-WINDOW`. Our price/cost model must carry effective-dated overlays, not a single mutable value.
- **The all-or-nothing field groups should be modelled as a nullable value object** (`{start, end, amount}`), which makes the validation free.
- **District pricing here confirms `ITEM-045`'s district scope but shows the scope set is NOT uniform across entities** — special order option prices have product + district and no location tier. Our resolver should support the full scope chain everywhere and simply have no row at unused levels.
- **`Auto` + missing price = $0.00 must be a blocking exception in our build, not a silent zero.**

---

### `PRD-065` Special Order Option Settings
*storis_ref: article 15294555346196*

**Purpose.** Create and maintain the **pre-defined special order options** themselves (the values, e.g. a specific fabric), scoped to a vendor, and attach them to option types and lists.

**Where it lives.** Menu; and **Special Order Option List Settings > extra `Action` button at the `Option` field**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | **MANDATORY**; `Actions` → Vendor Name Search | **Options are vendor-scoped.** |
| Option | **up to 30 alphanumeric**, unique per vendor | **The identifier CANNOT be changed on existing records.** |
| Option Type | **MANDATORY**; lookup supports **multiple** active option types | The option types this option may be applied to. **An option type cannot be removed if a list exists for that option type.** |
| List | list code(s); `Actions` → multi-select | Lists to which this option is applied. **The entry cannot contain spaces.** **Only available when the process is reached from the menu.** |

**Behavior & rules.**
- **Options cannot be removed from option lists here** — use Special Order Option List Settings (`PRD-063`).
- **Deletion guard: to delete a special order option it must not be in use by any active special order template, nor in any special order option list referenced by any active special order template.** It must first be removed from all active lists (including lists on active templates).
- `Save and Add Another` appears once Vendor + Option + Option Type are defined, preserving Vendor and Option Type for rapid entry.

**Dependencies.** `PRD-063`, `PRD-064`, `PRD-066`, `PRD-067`; Point of Sale Control Settings; Create a User Group; Special Order Processing Overview.

**Build notes.** Vendor-scoped option values with a mutable label and an immutable code is the right shape. The three-screen split (Option Type / Option / Option List) is fine and worth preserving — it is the cleanest part of STORIS's special-order model. Implement the deletion guards as **referential integrity plus an "in use by" report**, not as an opaque error message.

---

### `PRD-066` Special Order Option Type Settings
*storis_ref: article 15294555632916*

**Purpose.** Pre-define **special order option types** — the prompts (e.g. `Fabric`, `Finish`) used across special order templates. **"These special order option types provide consistent terminology across special order templates."**

**Where it lives.** Menu; and **Special Order Template Settings > extra `Action` button at the `Option Type` field** (create on the fly).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Option Type Code | **up to 13 alphanumeric**, unique | **Cannot be changed on existing option types.** |
| Label | **up to 20 alphanumeric**, **REQUIRED** | **"This label is used in all inquiries, reports, printed documents, and EDI transmissions."** |
| Active | checkbox, **checked by default** on new codes | Availability flag. |

**Behavior & rules.**
- **HARD RULE — option types are NOT vendor-scoped:** *"Option types are can be used across templates and are not linked to a specific vendor. As an example, an option type of 'Fabric' can be used on any special order template across products of various vendors."* **Contrast with `PRD-065` options and `PRD-063` lists, which ARE vendor-scoped.** Type is global, values are per-vendor.
- **Label mutability (exact, and confusingly worded):** the label "can be changed on existing records only if it is not being used in any active or inactive special order templates. The label can be changed for a different option type regardless of use in an Active/Inactive Special Order Template. However, a label can be removed from an active template that has not already been used."
- **Inactivation guard: an option type cannot be made inactive while it is still active in a special order template.** Remove it from active templates, or inactivate those templates first.
- **Deletion guard is the strictest in the section: deletion is permitted only when the option type is not in use by ANY special order template (active or inactive), order, purchase order, completion order, or piece in inventory.**

**Dependencies.** `PRD-063`, `PRD-064`, `PRD-065`, `PRD-067`; EDI transmission; Special Order Processing Overview.

**Build notes.** Global option types + vendor-scoped values is the correct split; keep it. **The `Label` flows into EDI and printed documents — treat it as externally-visible data with change control**, not a cosmetic field. Deletion guard is right; implement as archival with an in-use report.

---

### `PRD-067` Special Order Template Settings
*storis_ref: article 15294525424020*

**Purpose.** Assemble option types into a **special order template** — the set of prompts used to build a special order product — and bind that template to products by **Product, Vendor, Category or Group**. Also decides **how special-order pricing behaves** (`None` / `User` / `Auto`).

**Where it lives.** **Purchasing > Settings > Special-Order Settings.**

**Fields — header**

| Field | Type | Purpose / business rule |
|---|---|---|
| Template Code | **up to 20 alphanumeric, NO SPACES**, unique | **Existing codes cannot be changed.** Lookup opens **Search for a Special-Order Template**, whose **`Display Active Only` checkbox defaults to CHECKED** — to see inactive templates you must uncheck it and filter the `Active` column (`Y`/`N`). |
| Description | up to 30 alphanumeric free text; extra Action → multi-lingual translation | |
| **Pricing** | enum `None` / `User` / `Auto` | Full semantics below. |
| Active | checkbox, **checked by default** | Availability. **Unchecking BYPASSES the Save validation** (documented as the way to park a partially-built template). |
| Default Detail Information | optional free text | Default special order detail presented in **Enter Special Order Options**. **Works for both stock and special order products: for STOCK products it updates the purchase order; for SPECIAL ORDER products it is a user-overwritable default.** Viewable afterwards via **Additional Line Item Details**. |

**Fields — Template Usage** *(none mandatory; inactive entirely if an Option Type already exists in Option Information)*

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | product(s); Search / extra Action for multiple | **Once specified, Vendor, Group and Category are auto-populated and INACTIVATED from the product(s).** |
| Vendor | vendor + Search | **If no Vendor is specified, Group and Category are inactive** and the template is a **"global" template used when no template can be determined for a product.** |
| Group | group(s) + Search | |
| Category | category(ies) + Search | |

**Fields — Option Information**

| Field | Type | Purpose / business rule |
|---|---|---|
| Option Type | existing **active** option type; Search; extra Action → create new | **Specifying multiple option types with the same description is not permitted.** |
| Mandatory | checkbox, **unchecked by default** | Requires an option to be specified. |
| Allow Free Text | checkbox, **checked by default** | Lets the user type instead of picking. **Unchecked and INACTIVE when `Pricing` = `Auto`, "because pre-defined prices are linked to specific special order options."** |
| Assign Options button | button → **Assign Options** window | Select/build pre-defined options for this prompt. **Active only when `Option List` is empty; otherwise it is inactive and displays as `'Options Assigned'`.** |
| Option List | existing list + Search (**auto-filtered to the selected vendor(s)**); extra Action → Create New Special Order Option List | |
| Default Option | option or free text | **If `Allow Free Text` is checked, free text is allowed here as the default; if not checked, the entry MUST match an assigned special order option.** |
| Grid columns | display | `Option Type`, `Description`, `Mandatory` (`YES`/`NO`), `Allow Free Text` (`YES`/`NO`), `Options Assigned` (`YES`/`NO`), `Default`, `Remove`. |
| Actions → **Clone Template** | action | Opens the **Template Clone** window; enter the new code, Save, and you return to Special Order Template Settings with the cloned template loaded. |

**Behavior & rules.**
- **⚠ HARD UNIQUENESS RULE: "Once the template has been saved, validation is performed. The template is not saved if template usage overlaps; no two templates can be used for the same product."** Template→product resolution is therefore required to be unambiguous — enforced at save time, globally, across Product/Vendor/Group/Category bindings.
- **Pricing enum, exact semantics:**
  - **`None`** — no display or entry of pricing.
  - **`User`** — the user is prompted for the selling price of each option; **these are a scratch pad for totalling only. The base selling price of the product comes from the current pricing hierarchy and is DISPLAY-ONLY. The resulting total is NOT used to update the order line.** **Usable only when building a special order product for a sale, return or exchange — "while set, it is ignored when building a special order product for a purchase order or transfer."**
  - **`Auto`** — uses pre-built option prices keyed by **product, option type and option** (from `PRD-064`). Prices are displayed and accumulated, **display-only**, and **the resulting total price/cost IS used to automatically update the order line.** Forces `Allow Free Text` off. **"If set to 'Auto' but no pricing is established, the option prices default to $0.00."**
- **Versioning:** *"When updating an existing template, changes are enacted on a go-forward basis... special order information for any existing usage of the original template is based on the version used when the original special order information was entered."* **Templates are effectively immutably versioned per document — a genuinely good behavior.**
- **Inactivating a template does not affect existing sales orders, purchase orders and transfers — those keep the template that was active when the document was created.** "When inactivating an existing template, one 'global' special order template exists and is active."
- **If multiple products from multiple vendors are selected in Template Usage, `Default Option` and `Assign Options` become inactive** (options are vendor-scoped, so there is no coherent option set).
- Special order options can only be assigned when the template is set up for a **single vendor**.

**Dependencies.** `PRD-063` Option List, `PRD-064` Option Price, `PRD-065` Option, `PRD-066` Option Type; `PRD-003` Assign Options (part A); `PRD-007` Category, `PRD-022` Group Settings (part A); Enter Special Order Options; Additional Line Item Details; Purchasing Control Settings; Special Order Processing Overview.

**Build notes.**
- **Adopt the document-pinned template versioning** — it is exactly what we want for reproducing a historical special order, and it is the one place STORIS gets versioning right. Do the same for protection plans (`PRD-056`) and price adjustments.
- **The no-overlap rule needs a resolution-order model instead.** "No two templates may claim the same product" is brittle at scale (any new Category binding can collide with an existing Product binding). Prefer **most-specific-scope-wins** (product > group > category > vendor > global), consistent with the resolver we are already building.
- **`Active` unchecked bypassing validation is a bad pattern** — give us an explicit `DRAFT` state instead of overloading availability.
- **`Auto` + no price = $0.00 must raise an exception.** See reconciliation section.
- `User` pricing being silently ignored on POs and transfers is a surprise; make channel applicability an explicit property of the pricing mode.

---

### `PRD-068` Spiff Table Entry Screen
*storis_ref: article 15294469613972*

**Purpose.** Build a **per-product spiff table** — tiered salesperson bonuses that pay out based on the achieved selling price.

**Where it lives.** **Advanced Product Settings > Pricing page > `Action` button at the `Spiff Amount` field**; **Enter a Stock Adjustment > `Move To As-Is` tab > `Action` at `Spiff Amount`**; **Enter a Stock Adjustment > `As-Is Status` tab > `Action` at `Spiff Amount`**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Spiff Amount | money | Dollar award to the salesperson for selling this product **within the associated price level**. |
| Price Level | money | **"Enter a selling price for this product, ABOVE which you want to award the associated spiff amount."** |

**Behavior & rules.**
- **HARD ENTRY RULE: "you must build spiff tables in descending order, meaning you must enter the highest spiff first."** The table is order-dependent, and the first matching row from the top wins.
- **Flat spiff:** to pay a flat amount regardless of selling price, **enter the amount in `Spiff Amount` and leave `Price Level` BLANK.**
- **Precedence (normal products):** **spiffs created in the `Price/Spiff/Commission Table` (`PRD-041`) OVERRIDE spiffs entered here.**
- **⚠ Precedence (as-is pieces) — direct extension of `ITEM-044`:** *"If applying a spiff to an as-is piece, this table takes precedence over any other spiff considerations defined in the system, including the Price/Spiff/Commission Table."* **The as-is piece inverts the normal precedence order** — the same pattern as `ITEM-044`'s as-is selling price beating the whole resolution chain, now applying to spiffs.
- **As-is piece binding:** when an as-is piece with an associated spiff table is added to a **sales order, exchange, quick sale or service order, that table is bound to the line item**. **On returns the original spiff paid out is taken into consideration; once the piece is returned to inventory the original spiff table is no longer associated with the piece and a new one may be attached.**
- A **read-only** variant appears via view-only routines such as **View Advanced Product Settings**.

**Dependencies.** `PRD-041` Price/Spiff/Commission Table (part A); `PRD-001` Advanced Product Settings (Pricing page); `PRD-056` Protection Plan Settings (`Spiff Amount` + spiff table); Enter a Stock Adjustment (Move To As-Is / As-Is Status). Inventory pack: **`ITEM-044` as-is pieces**, `ITEM-040`/`ITEM-041`.

**Build notes.** Spiff tiers should be **stored with explicit bounds** (`min_price`, `max_price`, `amount`), not as a manually-ordered list that must be typed high-to-low — the ordering requirement is a UI artifact that becomes a data-integrity bug the moment a row is inserted. **Model the as-is inversion once, generically:** an as-is piece carries a *pinned pricing/compensation context* that outranks catalog-level resolution for both price (`ITEM-044`) and spiff. **The "spiff table binds to the line item at sale, and detaches when the piece returns to inventory" lifecycle is correct and must be preserved** — otherwise returns re-price historical commission.

---

### `PRD-069` Substitute Product List Example
*storis_ref: article 15294469609876*

**Purpose.** A worked example of substitute product lists — no fields, pure worked semantics. It is the only place the eligibility algebra is spelled out, so it is worth preserving verbatim in spirit.

**Where it lives.** Reference article linked from Substitute Product List Settings (`PRD-070`).

**Fields.** None (narrative example).

**Behavior & rules.** The example list — seating for a 4-person dining table:
- `1 Booth "U" bench (4 people)` — **$0 adjustment**
- `2 Benches (2 people each bench)` — **$0 adjustment**
- `4 Chairs` — **$0 adjustment**
- `4 leather chairs` — **$30 adjustment**

**Three requirements to attach the list to a soft-kit component:**
1. **The component must exist in the substitute list.**
2. **The component's row in that list must have ZERO in the `$ Adjustment`.** ("you could not use this substitute if your kit had the leather chairs.")
3. **The component quantity must be equal to or greater than the quantity for that product in the substitute list.**

**Resulting eligibility rules, exactly as stated:**
- Fewer than 4 chairs in the kit → **list is ineligible**.
- Fewer than 2 benches in the kit → **list is ineligible**.
- 4 non-leather chairs → eligible; substitutable for 1 U bench / 2 benches / 1 bench + any 2 chairs / any combination of the 4 chairs.
- 2 benches → substitutable for 1 U bench / 1 bench + any 2 chairs / any combination of the 4 chairs.
- 1 U bench → substitutable for 2 benches / 1 bench + any 2 chairs / any combination of the 4 chairs.
- **"If your kit contains greater than the quantity required, all combinations of substitutions are available."** Example: 4 U benches (16 people) → any combination totalling 16 seats, e.g. 2 U benches + 1 bench + 4 regular chairs + 2 leather chairs.

**Dependencies.** `PRD-070` Substitute Product List Settings, `PRD-071` Substitute Product Selection, `PRD-050` Product Kit Settings.

**Build notes.** The underlying model is **capacity-equivalence with a multiplier and a price delta** — the list is really "N seats" with each product declaring how many units of the abstract quantity it supplies. **Make that explicit** (a `unit_equivalence` / multiplier per row, which STORIS already surfaces as `Multiplier` in `PRD-071`) rather than leaving it as folklore in an example article. The "$0 adjustment required for the default" constraint exists only because the kit price is anchored on the default component — with an explicit base + deltas model the constraint disappears.

---

### `PRD-070` Substitute Product List Settings
*storis_ref: article 15294469614100*

**Purpose.** Create and maintain **lists of product substitutions** attachable to component products of **component- and product-priced soft kits** — "customer wants the bench instead of two of the chairs."

**Where it lives.** **Product Kit Settings > `Substitution List` field > `Action` button > `Kit Substitution List Settings`.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product Substitution List | name/ID + Search | The list identifier. |
| Substitution List Comments | optional text | Surfaces to the salesperson in `PRD-071`. |
| **Kit Price Source** | enum, **defaults from `Source of Price` in Product Kit Settings** | Whether the list is available for **Product priced** or **Component priced** soft kits. |
| Product Description | display-only | From Product Settings. |
| Product Number | product code; Search → Search for a Product | A product available as a substitute. |
| Quantity | number | **"the quantity association ratio as it relates to the quantity of the default component"** — i.e. the multiplier. |
| $ Adjustment | money | Per-piece dollar difference between this substitution's price and the default component's price. **NOT used when the list is for a product-priced soft kit.** |
| Grid | editable | `Product Description`, `Product Number`, `Quantity`, `$ Adjustment`, `Remove`. Quantity and adjustment are editable **directly in the grid row**. |

**Behavior & rules.**
- **HARD RULE: "A substitution list can only contain Products with the same Product Type."**
- **Feature gate: substitution lists are usable in order entry ONLY when `Adjust Soft Kit in Order Entry` is checked on the Inventory tab of Point of Sale Control Settings.**
- **Kit Price Source semantics:** a **product-priced** kit may contain soft-kit components; when the list is designated product priced, **soft kit masters may be included in the list, and the list can substitute soft kit masters for general products or vice versa**. **Component-priced kits do not allow soft kits as components within a soft kit.**
- **Reusability conditions — a single list may be assigned to any number of kit components in any number of soft kits provided:** the product being substituted **exists in the list and has NO adjustment charge**, and **the adjustment quantity in the list is equal to or less than the Kit Quantity**.
- **Raising a component's quantity invalidates existing soft kits:** *"If the quantity of a component is raised, all existing soft kits that contain that component as the default must be verified. Any soft kit that contains a quantity less than the new quantity is no longer valid and an error message is displayed."*
- **HARD RULE: "If the adjustment charge is changed to anything other than zero, no soft kits can use that component as the default product."**
- **Removing a zero-adjustment product from a list in use requires TWO conditions:** (a) **no soft kit may have the removed product as its default kit component** (otherwise each affected kit must be modified), and (b) **at least one other product in the list must have a zero adjustment charge at save time.**
- **Delete behavior is destructive by design:** deleting a list in use displays **the number of soft kits affected**; **if you continue, the list is automatically removed from ALL soft kits where it is assigned.**

**Dependencies.** `PRD-050` Product Kit Settings, `PRD-069` example, `PRD-071` Substitute Product Selection, `PRD-052` Product Substitution Codes (the *other*, unrelated substitution mechanism), `PRD-053` Product Type Codes; Point of Sale Control Settings (`Adjust Soft Kit in Order Entry`).

**Build notes.** **Two distinct substitution mechanisms exist in STORIS** — product-level auto-substitution (`PRD-052`) and kit-component optional substitution (this) — and they are unrelated. Name them differently in our system (`auto_substitute` vs. `component_alternates`) so nobody conflates them. **Do not ship the "continue and it silently detaches from every kit" delete** — require an explicit affected-kits review. The web of "default must have zero adjustment" rules is an artifact of anchoring price on a default component; our base+delta model removes most of them.

---

### `PRD-071` Substitute Product Selection
*storis_ref: article 15294469612564*

**Purpose.** The **order-entry worksheet** for choosing substitutions on a soft-kit component — pick quantities across the default and its alternates until the total balances, with live price updates.

**Where it lives.** Appears automatically **when a soft kit component with an associated Substitute Product List is added to an order**; also via the `Action` button at the `Product` field in **Enter a Sales Order**, **Enter a Quick Sale**, **Enter an Exchange**, and **Enter a Service Order**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Substitution List | display-only | Name of the list associated with the component. |
| **This List is** | display-only, **`CURRENT` or `HISTORICAL`** | Version status — see the versioning rule below. |
| Comments | display-only | From `Substitution List Comments` in `PRD-070`. |
| Quantity Balance | display-only | Starts at `0`; updates as substitutions are chosen. **Must be in balance (at zero) to accept and save.** |
| Extended Price | display-only | Total extended price, updated live as adjustment charges apply. |
| Grid: `Product Description` | display | |
| Grid: `Product Number` | display | |
| Grid: `QTY` | **the only editable column** | Quantity of this row to use. |
| Grid: `Multiplier` | display | **"The quantity relation to the default component (i.e. 1 for 1, 2 for 1, 1 for 2, etc.)"** |
| Grid: `$ Adjustment` | display | Per-piece adjustment relative to the default component's price. |
| Grid: `$ Price` | display | Actual per-piece price **with the `$ Adjustment` included**. |
| Grid: `$ Extended` | display | Extended price for the selected quantity. |

**Behavior & rules.**
- On entry, **the default component row holds the entire required kit quantity and all substitutes default to zero.**
- **⚠ EXPLICIT LIST VERSIONING (and this is the good kind):** *"When a soft kit with a substitution list is added to a sales transaction, the current version of that list is associated with that order line item. If the list is subsequently changed in any way, a new version of the list is created and it becomes the current version... The status of the previous version of the list is flagged 'Historical'. Existing line items continue to reference the version of the list initially used."* **Same document-pinned-version pattern as special order templates (`PRD-067`).**
- **Quantities must balance to the total component quantity of the kit** before the screen can be saved.

**Dependencies.** `PRD-070`, `PRD-069`, `PRD-050`; Enter a Sales Order / Quick Sale / Exchange / Service Order; Point of Sale Control Settings (`Adjust Soft Kit in Order Entry`).

**Build notes.** **Adopt the CURRENT/HISTORICAL list versioning across the board** — it, plus `PRD-067`'s template pinning, are the two places STORIS gets historical reproducibility right, and we should generalise the pattern into the platform (immutable versioned reference data + a pointer on the document). The balance-to-zero worksheet is a good UX; keep it, and show the running margin as well as the extended price.

---

### `PRD-072` Suite Configuration
*storis_ref: article 15294470605332*

**Purpose.** Group frames or fabrics into **suites** per vendor, so that a frame-suite × fabric-suite matrix can **override the base grade** used by the Special Order Configurator — the mechanism behind "same as stock" and "limited" grade pricing.

**Where it lives.** System Administration > System Settings > Purchasing and Logistic System Settings > Inventory Hierarchy Settings > Product Configurator Settings > Suite Configuration. **Optional routine.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code; Search → Vendor Name Search | The vendor owning this suite. |
| Suite | **up to 10 characters** | Suite ID. **With no vendor indicated the lookup lists ALL suites; with a vendor, only that vendor's.** |
| Description | **up to 20 characters**; Action → Description Field - Language Translation Entry | **For existing vendor/suite combinations, ONLY the description may be edited.** Active only once vendor + suite are indicated. |

**Behavior & rules.**
- **The grade-override mechanism, exactly:** *"the frame and fabric/option suites are combined into a matrix that is used to determine when to override the base grade and use the override grades of 'same as stock' or 'limited'."*
- **Runtime behavior:** *"During order entry, the Special Order Configurator checks for a grade override following entry of the Primary Option. If a grade override is found for the vendor, frame suite, and fabric/option suite combination, the override grade becomes the base grade for the primary option entered and the override grade is displayed on the screen. If no vendor, frame suite, and fabric/option suite combination is found, the current base grade and grade price is used."* **This is a price-affecting override keyed on (vendor, frame suite, fabric suite), triggered by entry of the Primary Option.**
- Suite codes are **optional** in product, fabric and option settings.
- **Deletion guard: a suite may only be deleted if it does not exist in Product Configuration, Fabric Configuration, Option Configuration, or the Grade Override matrix.**

**Dependencies.** `PRD-047` Product Configuration, `PRD-016` Fabric Configuration, `PRD-017` Fabric Group Configuration, `PRD-005` Base/Grade Configuration, `PRD-020` Grade Description Configuration, `PRD-033` Option Configuration, `PRD-034` Option Grade Price Configuration, `PRD-035` Option Price Configuration (all part A); Grade Override matrix; Special Order Configurator; `PRD-075` translation entry.

**Build notes.** **This is another entry in the selling-price resolution chain that the Inventory pack does not have** — grade override by suite pair. If LA Mattress does not sell graded upholstery, this whole cluster (suites, grades, fabric groups, yardage) is **out of scope**; if it does, the matrix must be modelled as a real lookup with effective dates, not a hidden override. `[DECISION NEEDED]`.

---

### `PRD-073` Tariff Settings
*storis_ref: article 15294555641748*

**Purpose.** Create **tariff records linkable to products and/or vendors as LANDED ADD-ON COSTS** — a percentage uplift applied when calculating landed cost. **Directly relevant to the `COST-030`–`COST-033` landed-cost cluster.**

**Where it lives.** **Merchandising and Distribution > Settings > Purchasing Settings > Import Freight Settings > Tariff Settings.** (Note the parent: *Import Freight Settings* — tariffs sit alongside the freight factors.)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Tariff Code | **numeric, fixed mask `9999.99.9999`** — "the system enters the dots for you" | This is an **HTS/HS tariff classification number** format. Search lists existing records. |
| Description | up to 30 alphanumeric | |
| **Percentage** | percent | **"the tariff percentage you want the system to apply when calculating tariff amounts."** |
| **Effective Date** | date | The date the tariff becomes effective. **"If you leave this field blank, the system assumes the tariff is in effect."** |

**Behavior & rules.**
- Bulk load path: the **`Load Import Tariff`** routine imports a tariff file into STORIS.
- **⚠ DESTRUCTIVE DELETE: "If you attempt to manually delete a tariff record, the system scans the Product file to determine if the tariff code is in use. If so, a warning message appears. If you choose to delete the tariff code, the system removes the code from all products with which it is associated."** A single confirmation silently unclassifies every affected product — and since tariff feeds landed cost, that changes costing going forward with no trace.
- **Only ONE percentage and ONE effective date per tariff code** — there is no rate history. **Changing a rate overwrites the previous one.** With the current tariff environment that is a serious limitation: you cannot reconstruct what rate was in force when a container landed.
- **A blank `Effective Date` means "in effect now"**, so a mistyped/blank date silently applies the tariff to everything.

**Dependencies.** `PRD-081` Vendor Ship From Freight and Cost; `PRD-019` Freight Distribution (part A); Import Freight Settings; Load Import Tariff; container receiving. Inventory pack: **`COST-030`–`COST-033` landed freight factors and the mutual exclusion between preset freight factors and itemized container receiving** — see reconciliation section; **`COST-010` costing method.**

**Build notes.**
- **Tariff rates MUST be effective-dated as a series, not a single value.** Model `tariff_code → [{effective_from, effective_to, percent}]` and resolve by the landing/receipt date. This is a hard requirement, not a nicety.
- **The tariff percentage is a landed-cost component and therefore interacts with the `COST-030`–`COST-033` mutual exclusion.** The article does **not** say whether tariff is suppressed when itemized container receiving is used — **that must be resolved.** `[DECISION NEEDED]`.
- **Never cascade-clear a classification on delete.** Retire codes; block deletion while referenced.
- Keep the `9999.99.9999` HTS mask as a validated format, and store the code as a string (leading zeros matter).

---

### `PRD-074` Tax Class Settings
*storis_ref: article 15294555637268*

**Purpose.** Define **tax classes** used to group products into tax statuses (e.g. taxable / non-taxable), primarily for the **Alternate Tax Interface** (Vertex®, Avalara).

**Where it lives.** Customer > Point of Sale > Settings > Tax Class Settings; Customer > Settings > Point of Sale Settings > Tax Class Settings; Customer > **Electronic Interfaces > Alternate Tax Interface** > Tax Class Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Tax Class | code, **up to ten characters** + Search | The class code. |
| Description | up to 30 alphanumeric | |

**Behavior & rules.**
- Tax classes may be used **with Vertex®**.
- **The `Vertex-O` tab in Alternate Tax Interface Control Settings holds tax classes for: delivery charges, installation charges, and restocking charges** — i.e. non-merchandise charge types get their own class assignment outside the product record.
- Genuinely thin article: two fields and no validation rules. The real semantics live in the tax provider's system.

**Dependencies.** `PRD-056` Protection Plan Settings (`Tax Class/SKU`), `PRD-058` Retail Delivery Fee Overview (`Tax Class` on the fee product), `PRD-001` Advanced Product Settings (`Tax Class`); Alternate Tax Interface Control Settings (`Vertex-O` tab); Sales Tax Settings.

**Build notes.** **This is the product-level tax assignment the brief asked me to hunt for**, and it is deliberately thin: STORIS delegates taxability to the provider and only stores a class code. Register as **`CFG-PRD-TAXCLASS`** (scope: product, with overrides at protection-plan and non-inventory-usage level). Our implementation should (a) validate the class against the provider's published class list rather than accepting free text, and (b) keep the separate class assignments for delivery / installation / restocking charges — those are real and easy to forget.

---

### `PRD-075` Text Field - Language Translation Entry
*storis_ref: article 15294523252500*

**Purpose.** Enter **alternate-language translations** for a text field elsewhere in the system (product benefit text, web collection text, and — per the many `Action` buttons catalogued throughout this file — descriptions on most code tables).

**Where it lives.** `Actions` button in **Web Collection Settings**; `Actions` button in **Product Benefit Settings**; `Actions` button on the **read-only Product Benefits screen** (via Advanced Product Settings). In practice it is also the target of every "Description Field - Language Translation Entry" action referenced across this section.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| English | **display-only** | The existing source text. **"You cannot edit this field. To edit this text, you must go to the routine where the text was originally entered."** |
| Language | language code; also selectable by double-clicking the grid | Selecting a language **activates** the `Translation` box. |
| Translation | text | The translated text. |

**Behavior & rules.**
- **HARD LIMIT: "the option to enter up to three alternate language translations is provided."** **Three translations maximum, plus English.**
- The source language is fixed as **English** and is only editable at origin.

**Dependencies.** `PRD-044` Product Benefit Settings, `PRD-045` Product Benefits Entry; Web Collection Settings; and effectively every `Description` field in this section (`PRD-049`, `PRD-050`, `PRD-056`, `PRD-057`, `PRD-063`, `PRD-067`, `PRD-072`, …).

**Build notes.** **Do not cap translations at three.** Build i18n as a proper `translatable_text` table (`entity`, `field`, `locale`, `value`) with an unbounded locale set and a fallback chain. For LA Mattress the immediate need is **English + Spanish**, but hard-coding a small N is exactly the mistake STORIS made. Note also that translations here are **manual only** — no workflow, no staleness detection when the English changes. Add a `source_hash` per translation so we can flag translations that have gone stale.

---

### `PRD-076` Update Product Images
*storis_ref: article 15294525418516*

**Purpose.** The **Image Wizard** — a bulk image-management client for attaching image files to **products, web collections, and product families**, importing them into the STORIS Image Repository, and maintaining them afterwards.

**Where it lives.** Thirteen documented paths across System Administration, Accounting (Payables and Vendor Receivables), Buyer/Merchandiser Tools, Merch & Distribution > Inventory, Merch & Distribution > Settings, Customer Service, and Customer > Settings — all ending `... > Update Product Images`.

**Fields / structure.** Three panes, each documented in its own article: **top pane** (`PRD-079`), **left pane** (`PRD-077`), **right pane** (`PRD-078`).

**Behavior & rules.**
- **⚠ SEPARATE OS-LEVEL AUTHENTICATION:** selecting Update Product Images presents a **User Authentication** window. `Login ID`, `Host Name` and `Account` auto-populate but **the Password must be entered every time**, and **"The Login ID and Password are the operating system User ID (aka O/S Login) and Password you use to initially log in to the server."** **This screen authenticates against the OS, not against STORIS application security.** A significant security-model exception — flag for `SEC-*` review.
- **Permitted file extensions (exact list):** `JPEG, JPG, EXIF, PNG, PNM, TIF, TIFF, PCX, TGA, BMP, PSD, PCD, GIF, WMF, EMF`.
- **Auto Format Image drag-and-drop creates THREE image versions** from the source: **a large image, a standard image and a thumbnail image**.
  - If the source exceeds the maxima in **Image Wizard Settings** (`PRD-024`, part A) for any version, **the system shrinks it maintaining aspect ratio** so neither dimension exceeds the maximum.
  - **For the thumbnail ONLY, if the width or height is under maximum, the system pads with a white "canvas" so the thumbnail is exactly the configured maximum size.**
  - **"STORIS uses only the large image. Other applications, for example eSTORIS, may use the standard and thumbnail versions."**
- **Manual Format Image** lets you drag an image onto a specific **Image Type** (`Large`, `Standard`, or `Thumbnail`) in the lower left pane.
- **Bulk Import** button on the File Explorer tab imports every image in a folder; a dialog asks to continue and **"Run Bulk Import"** proceeds. **Requires a minimum SCiX version `10.4.30085.4`.**
- **Data Import (Product) behavior:** *"checks if an image is already linked to the product being imported. If already linked, a warning states this and the update is skipped."* Otherwise the image is processed and linked. **If multiple images are loaded for a single product, the sequence follows the order in the product import spreadsheet.**
- **Mass rename path:** the **`Wizard Image Name`** column on the **Product worksheet** of the **Conversion Spreadsheet** (STORIS Client Portal), via Import Data. **Multiple names are separated by the character in the `Multiple Value Indicator` field on the Miscellaneous tab of General System Control Settings. Maximum 40 characters per image source name.**
- **Image lookup hierarchy at view time (exact order):** 1. **the `STORIS.ini` file on the local PC**; 2. **the `Replicated Directory Path` field in Image Wizard Settings**; 3. **the STORIS Image Repository on the system server.** "Local access is fastest."
- **Multiple images:** **only the primary image (sequence 0) is viewable via the Product field's camera icon in STORIS**, regardless of how many are attached; all images are viewable via this routine and via eSTORIS. **Web collection images are viewable ONLY via this routine and eSTORIS.**
- **Distinct from the File Attachment feature:** Update Product Images handles large numbers of image files with file-management tooling; File Attachment handles many file types but lacks that tooling.
- Images also feed **Enhanced Laser Forms** rendering.
- Post-import, STORIS recommends **replicating** the repository to central directories via a supplied service program (see `PRD-023` Image Replication Service, part A).

**Dependencies.** `PRD-077`, `PRD-078`, `PRD-079` (panes); `PRD-024` Image Wizard Settings, `PRD-023` Image Replication Service (part A); `PRD-049` Product Family Settings; Web Collection Settings; General System Control Settings (`Multiple Value Indicator`); Import Data / Conversion Spreadsheet; Enhanced Laser Forms; SCiX; `SEC-*`.

**Build notes.**
- **This entire routine is a thick-client anachronism** (Windows Explorer trees, drag-and-drop from CD drives, a local `.ini` lookup path). **Replace with a web asset pipeline:** upload → derive renditions server-side → serve from object storage/CDN with signed URLs. No local paths, no replication service, no per-PC configuration.
- **The OS-credential authentication must NOT be reproduced.** It is a straight privilege-escalation path and it bypasses application permissions entirely. Flag to the security workstream.
- **Keep the three-rendition model** (large / standard / thumbnail) but generate renditions on demand and store the original. **Do not pad thumbnails with white canvas** — that is a 2005 workaround; use CSS object-fit.
- **Sequence 0 = primary is a useful convention**; keep an explicit `is_primary` flag rather than relying on a magic ordinal.
- The `Wizard Image Name` multi-value column separated by a globally configured indicator character is a data-migration hazard — plan a clean import mapping.

---

### `PRD-077` Update Product Images - Left Pane
*storis_ref: article 15294469614996*

**Purpose.** Documents the Image Wizard's left pane: the **Product / Web Collection / Product Family grid** and the **Image View** beneath it.

**Where it lives.** Left pane of the Update Product Images (Image Wizard) screen.

**Fields**

| Element | Type | Purpose / business rule |
|---|---|---|
| Product/Collection/Family grid | grid | Columns vary by view. **`Active on Web`** checkbox = available on the web. **`Has Images`** checkbox = an image exists. Clicking a row loads its images into the Image View. |
| Grouping / filtering | interaction | Group by dragging a column heading above the headings; filter by typing under a column heading. **"You can filter your product view by any field"** — e.g. service parts, bulk inventory. Behaves like the **Personal Report Viewer (PRV)**. |
| Image View: Image Sequence Number | editable via up/down arrows | **Primary image is sequence 0.** After changing sequences you must click **`Update Image Sequences`** in the top pane to re-order. **Only sequence 0 shows at the Product field in STORIS.** |
| Image View: Image Detail | button | Shows the Large, Standard and Thumbnail versions. |
| Image View: Remove | button | Detaches the image after a confirmation. **HARD RULE: "You cannot remove the primary image (sequence 0) if other images are attached."** |
| Image View: Image Type / Image Assigned | checkboxes | Which of `Large` / `Standard` / `Thumbnail` exist for that image. |
| Replace an Image | drag-and-drop | With the File Explorer tab active, drag a file onto an existing thumbnail; **a verification message asks whether to overwrite.** |

**Behavior & rules.**
- **On first entry the routine downloads ALL products from the STORIS Product database.** Thereafter the left-pane contents and view are **saved on close and reloaded next time**; refresh manually with `Refresh List`.
- Views switch between Product / Web Collection / Product Family from the top pane.

**Dependencies.** `PRD-076`, `PRD-078`, `PRD-079`; `PRD-049` Product Family Settings; Web Collection Settings; Personal Report Viewer (PRV).

**Build notes.** The "download the entire product file to the client and cache it locally" model does not survive a catalogue of any size; server-side paginated search with the same filter/group ergonomics is the replacement. **Preserve the two operational filters that actually matter — "products with no images" and "products with partial images"** (see `PRD-079`) — as saved views; merchandisers live in those.

---

### `PRD-078` Update Product Images - Right Pane
*storis_ref: article 15294523253908*

**Purpose.** Documents the Image Wizard's right pane: the **Product Image Explorer** and **File Explorer** tabs used to find, edit and push images into the repository.

**Where it lives.** Right pane of the Update Product Images screen.

**Fields**

| Element | Type | Purpose / business rule |
|---|---|---|
| **Product Image Explorer** tab | tree + thumbnails | Views images **already inside the database**. **The tree is limited to the path defined as the `Replication Directory`** on the Image Management Options screen, or the **Image Directory** tab of the Image Replication Configuration process. |
| `Update Image` | button (**Product Image Explorer tab only**) | Moves an edited/new image into the STORIS image database. **"This movement is done without any re-sizing."** Updates **only the selected image type**. |
| `Update All Types` | button (**Product Image Explorer tab only**) | Updates **all** image types — large, standard and thumbnail. |
| Double-click an image | interaction | Launches it in the editor defined on the **Image Editor** tab; save, then `Update Image` / `Update All Types` to push back. |
| `Thumbnails, Gallery, Pane, Details` | view buttons | Change the bottom-section image view. |
| `Thumbnail Size` | dropdown | Change thumbnail display size. |
| `Search`, `Clear` | search tool | **Prefix search only:** "Enter the first few characters of the image file name" → shows images whose file name **starts with** those characters. |
| **File Explorer** tab | Windows Explorer file manager | Navigate any folder; **defaults to the Desktop folder** on first access. Drag an image to a product row or to the Image View to attach. **Auto-Format affects this.** **"The File Explorer tab allows you to access local CD drives."** |
| Double-click a product thumbnail | interaction | Opens it in the OS default application for that extension. |

**Behavior & rules.** `Update Image` **does not resize** — it is the escape hatch for hand-prepared renditions, in contrast with the auto-format drop path in `PRD-076`.

**Dependencies.** `PRD-076`, `PRD-077`, `PRD-079`; `PRD-023` Image Replication Service, `PRD-024` Image Wizard Settings (part A); Image Management Options.

**Build notes.** Nothing here survives the move to a web pipeline except two behaviors worth keeping: (a) **the ability to upload a hand-prepared rendition that bypasses automatic resizing** (marketing will need it), and (b) **prefix search over asset filenames**, which should become full substring/fuzzy search.

---

### `PRD-079` Update Product Images - Top Pane
*storis_ref: article 15294522840340*

**Purpose.** Documents the Image Wizard's top pane — global actions, list refresh, view switching, image filters, format mode, and the **Image Management Options** configuration screen.

**Where it lives.** Top pane of the Update Product Images (Image Wizard) screen.

**Fields**

| Element | Type | Purpose / business rule |
|---|---|---|
| Actions > `Exit` | button | Closes the app, **saves the left-pane product list and current view for next time**. |
| Actions > `Options` | button | Opens **Image Management Options** (global + account configuration). |
| Actions > `Update Image Sequences` | button | Verifies and applies sequence changes. **"The primary image is assigned sequence zero; subsequent images are numbered 1-100."** **So: a maximum of 101 images per record, and only sequence 0 shows at the Product field.** |
| Actions > `Print Preview Data` | button | Print preview of the grid contents. |
| `Last Retrieved` | display | Date/time the left-pane list was last refreshed. |
| `Refresh List` | button | Re-pulls products/collections/families. |
| View > `Product View` / `Web Collection View` / `Product Family View` | buttons | Switch what the left grid shows. |
| Image Filter > `Products with No Images` | toggle | Shows only products with **no** images. |
| Image Filter > `Products with Partial Images` | toggle | Shows only products with **fewer than all three image versions** attached. |
| Format Image > `Auto Format Image` / `Manual Format Image` | radio | Applied when importing to the Image Repository. See `PRD-076` and *Image Wizard Format Options*. |

**Fields — Image Management Options → Global Configuration tab**

| Field | Purpose / business rule |
|---|---|
| Auto Format Image | **"These fields can also be edited in the Image Wizard Settings"** (`PRD-024`, part A) — two screens edit the same settings. |
| Replication Log-in | **user name, password, and current server name — required to create a replication directory via the Image Wizard.** Another credential-handling surface. |
| Replication Directory | Default replication directory path; editable. |
| Image Editor | Path to the external image editor. **Blank = use the OS default application for `.jpg`.** |
| Log Level | enum **`Errors Only`** / **`Trace`**. **"Consult STORIS before you edit this field."** |
| View Log | Displays the error log. |

**Fields — Image Management Options → Account Configuration tab**

| Field | Purpose / business rule |
|---|---|
| Accounts grid | **`Host`, `Account Name`, `User Name`, `Server Time Zone`** for the default accounts used when logging in to Update Product Images. `Add` / `Remove` buttons maintain the list. |

**Behavior & rules.** **Sequence range `0`–`100` is the only stated cap on images per record.** The two image filters are the practical merchandising tools: find products with no imagery, and find products missing renditions.

**Dependencies.** `PRD-076`, `PRD-077`, `PRD-078`; `PRD-024` Image Wizard Settings (part A); `PRD-023` Image Replication Service; `SEC-*` (stored per-account credentials).

**Build notes.** **The Account Configuration grid stores host/account/username per PC for OS-level logins** — combined with the `PRD-076` authentication window, this is a second reason the whole Image Wizard model is unacceptable for us. Rebuild as browser upload + server-side rendition generation, with a **completeness report** ("SKUs with no image", "SKUs missing web rendition") as a first-class report rather than a filter toggle in a desktop tool.

---

### `PRD-080` Vendor Inventory Quantities API Queue
*storis_ref: article 15294525418132*

**Purpose.** Read-only monitor showing **vendor catalogs loaded into the STORIS API but not yet incorporated into the STORIS database** — i.e. the inbound queue for vendor on-hand availability feeds.

**Where it lives.** `Settings_Product` > **View Inventory Quantities API Queue**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Unprocessed Records | display count | Catalog files received by the API but **not yet converted into usable data** to apply to vendor inventory quantity information. |
| Processed Records | display count | Catalog files processed by the **`Webhook processing`** scheduled process whose quantities have been applied. |
| Grid: Vendor API Code | display | **"used for vendor self-identification when connecting to the API."** |
| Grid: Vendor ID | display | The STORIS vendor ID linked to that API code. |
| Grid: Date Created / Time Created | display | When the catalog was loaded onto STORIS. |
| Grid: Date Processed / Time Processed | display | When the catalog was fully processed and vendor inventory quantity updated. |

**Behavior & rules.**
- **Two preconditions for a catalog to appear at all:** the **vendor API code must have been validated against the STORIS database**, and **the vendor in STORIS must be configured to update vendor quantities.** Feeds from unregistered or unconfigured vendors are invisible here — **a silent-failure surface.**
- Processing is asynchronous, performed by the scheduled **`Webhook processing`** job.
- **This is a monitor only — there is no documented retry, purge, error detail, or reprocess action.** If a catalog sits unprocessed there is nothing on this screen to do about it.

**Dependencies.** Vendor settings (vendor quantity update flag, vendor API code); `Webhook processing` scheduled process; `PRD-082` View Web Service Results (the analogous diagnostic for the Ashley ATP interface); `PRD-002` Ashley Interface Settings (part A). Inventory pack: `REPL-010`/`REPL-020` (vendor availability informs replenishment).

**Build notes.** Any inbound integration queue we build needs, at minimum: **per-record error detail, retry, dead-letter, and an alert when the unprocessed count or age crosses a threshold.** STORIS gives you two counters. Also expose **rejected** feeds (unknown vendor API code, vendor not configured) rather than dropping them — that is where the real incidents hide.

---

### `PRD-081` Vendor Ship From Freight and Cost
*storis_ref: article 15294469615124*

**Purpose.** **Landed freight and landed add-on cost EXCEPTIONS by vendor ship-from location, for a specific product.** This is the finest-grained landed-cost override in the product model and is directly in scope for `COST-030`–`COST-033`.

**Where it lives.** **District and Regional Product Settings > `regional settings` tab > `Action` button at the `Freight Factor` & add-on cost fields.** A **read-only** variant appears via view-only routines such as View Advanced Product Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor Ship From | dropdown | The vendor ship-from location this exception applies to. |
| **Landed Freight — Active** | checkbox | **Activates the landed freight type and amount for this ship-from address.** Unchecked = fall back to the higher-level freight factor. |
| **Landed Freight — Type** | enum **`Percent`** / **`Dollar`** | Whether the landed freight amount is a percentage or a dollar amount. |
| **Landed Freight — Amount** | number | The dollar amount or percentage. |
| **Landed Add-on Cost 1 / 2 / 3 / 4 — Active** | checkbox ×4 | **FOUR independent landed add-on cost slots**, each separately activatable. |
| **Landed Add-on Cost 1–4 — Type** | enum `Percent` / `Dollar` ×4 | Per-slot. |
| **Landed Add-on Cost 1–4 — Amount** | number ×4 | Per-slot. |
| Grid | one row per ship-from code | Displays the Landed Freight and Landed Add-on Costs 1–4 settings for each ship-from. Double-click a row to edit; plus/add button to commit. |

**Behavior & rules.**
- **The scope key is (product, district/region, vendor ship-from)** — landed cost can differ for the same product depending on which of the vendor's warehouses it shipped from. **This is a fourth scope dimension the Inventory pack does not currently model.**
- Each of the five factors (freight + 4 add-ons) has its **own independent `Active` flag and its own `Percent`/`Dollar` type** — they are not a single blended factor.
- **The article does NOT state a precedence between these ship-from exceptions and the product-level / district-level freight factors, nor how they interact with itemized container receiving.** Given `COST-030`–`COST-033` establish a **mutual exclusion between preset freight factors and itemized container receiving**, **these ship-from exceptions are preset freight factors and must fall under the same exclusion** — but that is inference, not documentation. Flagged.

**Dependencies.** `PRD-015` District and Regional Product Settings (part A — parent screen), `PRD-001` Advanced Product Settings, `PRD-019` Freight Distribution (part A), `PRD-073` Tariff Settings; container receiving. Inventory pack: **`COST-030`–`COST-033` landed freight factors and the preset-vs-itemized mutual exclusion**, `COST-010` costing method, `COST-040` cost exceptions.

**Build notes.**
- **Register the ship-from scope explicitly.** Our landed-cost resolver needs the chain: **(product × district × vendor ship-from) → (product × district) → (product) → (vendor) → (default)**, each level carrying freight + N add-on factors with independent `Percent`/`Dollar` types.
- **Four fixed add-on cost slots is an arbitrary limit** — model add-on costs as a named collection (`duty`, `tariff`, `brokerage`, `drayage`, `fuel surcharge`, …) so the components are self-describing on the cost layer. Right now nobody can tell what "Landed Add-on Cost 3" means six months later.
- **Resolve and document the interaction with itemized container receiving.** `[DECISION NEEDED]`.
- **Landed factors must be effective-dated** for the same reason tariffs must be (`PRD-073`) — a cost layer must be reproducible from the factors in force when it was created.

---

### `PRD-082` View Web Service Results
*storis_ref: article 15294523458964*

**Purpose.** Read-only diagnostic showing the **request and response of an Ashley ATP (available-to-promise) web service test** — used to troubleshoot connection errors.

**Where it lives.** **Ashley Interface Settings > `Location & Vendor` tab > `Actions` > `Test AFI First Available Date`**; and **... > `Test AFI Detailed Availability`.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Service | display, enum | **`AFI First Available Date`** or **`AFI First Detailed Availability`** — the action being tested. *(Note: the Actions menu labels it "Test AFI Detailed Availability" while this field reports "AFI First Detailed Availability" — an inconsistency in the source.)* |
| Status | display, enum | **`Error`** — an error returned from the **STORIS process**. **`Service Error`** — an error returned from the **web service**. **`Success`** — results sufficient and received without error. |
| Request | display | The information transmitted to the web service. |
| Response | display | The information received from the web service. |

**Behavior & rules.** Read-only. **Connection settings themselves are established and maintained in Ashley Interface Settings** (`PRD-002`, part A), not here. The `Error` vs. `Service Error` split — "our side failed" vs. "their side failed" — is a genuinely useful distinction.

**Dependencies.** `PRD-002` Ashley Interface Settings (part A); Ashley AFI/ATP web services; `PRD-080` Vendor Inventory Quantities API Queue (the other vendor-availability integration).

**Build notes.** Every outbound integration should have this: a **test action, a persisted request/response pair, and a tri-state status separating our failures from theirs.** Generalise it — one integration diagnostics screen for all connectors, with retained history (STORIS shows only the last test) and **redaction of credentials in the captured request**.

---

### `PRD-083` Volume Rebate Table
*storis_ref: article 15294469806228*

**Purpose.** Assign a **Vendor Receivable (VR) rebate plan** to a product (or a collection), recording that the vendor offers a volume rebate and how it is calculated — **a negative landed-cost / margin recovery component.**

**Where it lives.** **`Actions` button at the `Volume Rebate Table` field in Advanced Product Settings and in Collection Settings.** A **read-only** variant appears via view-only routines such as View Advanced Product Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | VR Rebate Plan code + Search | The rebate plan being assigned. |
| Percent/Dollar | enum **`Percent`** / **`Dollar`** | Calculation method. |
| Factor | number | The percentage or dollar amount, per the method selected. |
| Start Date | date + calendar | Date the rebate starts. |
| End Date | date + calendar | Date the rebate ends. |

**Behavior & rules.**
- **This is one of the few product-level settings in the whole section that is natively date-ranged** — start and end dates are first-class here, unlike tariff (`PRD-073`, single effective date) or freight factors (`PRD-081`, none).
- Assignable at **both product and collection** level; the article states no precedence between them. **Undocumented conflict.**
- No validation rules are documented — no statement that `Start <= End`, no overlap prevention between successive rebate rows for the same product.

**Dependencies.** `PRD-001` Advanced Product Settings, `PRD-008` Collection Settings (part A); Vendor Receivables module (VR Rebate Plans); `PRD-073` Tariff Settings, `PRD-081` Vendor Ship From Freight and Cost. Inventory pack: `COST-010`, `COST-030`–`COST-033` — **rebates move landed cost in the opposite direction from freight/tariff and must be part of the same landed-cost model.**

**Build notes.** **Decide explicitly whether volume rebates reduce inventory cost (landed) or post as a separate vendor receivable.** STORIS treats them as a Vendor Receivable, which means **inventory cost — and therefore reported gross margin — is overstated by the rebate for the life of the cost layer.** For a business that runs on vendor rebates that is a material misstatement of item margin. `[DECISION NEEDED]`. Also: enforce `Start <= End`, prevent overlapping rebate windows for the same product+plan, and define product-vs-collection precedence.

---

### `PRD-084` Warranty Category Settings
*storis_ref: article 15294555642772*

**Purpose.** Define **warranty categories** — the link table between non-inventory *warranty products* and the *inventory products* they cover. **The category also decides how the warranty is priced.**

**Where it lives.** Nine paths ending `... > Product Information Settings > Warranty Category Settings` (Customer Service, Customer > Settings, Buyer/Merchandiser Tools ×3, Merch & Distribution > Inventory, Merch & Distribution > Settings, System Administration > **Get Started Step 9 - Merchandise**, System Administration > System Settings).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Category | **alphanumeric, max 6 characters** | **"STORIS recommends you use the same code used for the product category."** |
| Description | text | Recommended to match the product category description. |
| **Type Code** | enum | `Extended Warranty` = **extends the time period of the same general coverage provided by the manufacturer's factory warranty**; `Fabric Protection` = coverage for fabric on furniture; `Leather Care` = guarantees leather quality; `Wood Care` = guarantees wood quality. |
| **Selling Price Percent** | percent | Calculates every warranty in the category as **a percentage of the selling price of the linked inventory item**. **Mutually exclusive with the Selling Price Table.** |
| Allow Links to Multiple Lines | checkbox | Lets one warranty line cover **multiple inventory line items** on the order. Unchecked = one warranty line per inventory line. Note: "some users prefer not using this option in order to simplify reporting procedures." |
| Allow Warranty Only Once Per Order | checkbox | Restricts adding a warranty in this category if it already exists **on the open order**. Applies to Enter a Sales Order, Enter a Quick Sale, Enter an Exchange. |
| Third Party Flag | checkbox | The warranty is provided by a vendor who is **neither the manufacturer nor the retailer**. **"If you select this option, be sure that the third-party vendor's code appears in the `Vendor Code` field of the individual warranty's Product record."** Enables informing those vendors of sales and changes. |
| Do Not Display | checkbox | Hides this category's warranties from the **Product Warranty Selection** window during order entry. |
| Selling Price Table — Minimum Price | **mandatory** when building a table, **0–99999.99** | Lowest selling price for this level. |
| Selling Price Table — Price | **mandatory**, **0–99999.99** | The warranty price when merchandise falls in that level. **Editable directly in the grid; the cell cannot be left blank.** |
| Selling Price Table — Maximum Price | **calculated, display-only** | Derived from the next level's minimum. |
| Selling Price Table — Remove | button | Removes a level; **remaining rows are re-examined and Maximum Prices recalculated.** |

**Behavior & rules.**
- **⚠ WARRANTY PRICE RESOLUTION ORDER (exact):** *"When determining the warranty price, the warranty category is checked first. If there is either a Selling Price Percent or Selling Price Table, it is used to calculate the warranty price. If neither are indicated, the price in the warranty product's settings is used."* **So: category percent OR category table → else the warranty product's own Selling Price. The category BEATS the product master.**
- **`Selling Price Percent` overrides the `Selling Price` field in Advanced Product Settings (Product Full) — UNLESS the warranty is unlinked, in which case `Selling Price` prevails.**
- **`Selling Price Percent` and the `Selling Price Table` are mutually exclusive.**
- **Maximum Price derivation, exactly as documented:** with minimums `0`, `100.00` and `200.00`, maximums display as **`99.99`, `199.99`, and `null`**. **A null Maximum means all selling prices above that row's minimum fall into that level.** *(Note the implied gap: a merchandise subtotal of `99.995` is not representable — the table is in cents and closed intervals.)*
- **Table pricing is evaluated against the SUBTOTAL of the selected lines linked to the warranty**, in Enter a Sales Order, Enter a Quick Sale, Enter a Return and Enter an Exchange.
- Grid rows sort **ascending by minimum price**, and **standard grid sorting and filtering are disabled.**
- **`Allow Warranty Only Once Per Order` is enforced only on OPEN orders.** The article spells out the three consequences: the warranty **can** still be applied to (A) the open portion of a partially completed order, (B) the sale portion of an exchange where the original order contains the same warranty, and (C) an order linking to merchandise on a completed order containing the same warranty.
- **The category "permits multiple products on a sales order to contain a single warranty."**

**Dependencies.** `PRD-086` Warranty Overview, `PRD-088` Warranty Settings, `PRD-085` Warranty Component Settings; `PRD-001` Advanced Product Settings (`Warranty Product Linkage` / `Inventory Product Linkage` sections on the Miscellaneous tab); `PRD-007` Product Category, `PRD-022` Product Group (part A); `PRD-053` Product Type Codes (`Non-Inventory`); `PRD-056` Protection Plan Settings (`Warranty Code` is mandatory there). Inventory pack: `ITEM-040`/`ITEM-041` price resolution, `ITEM-042` price matrix.

**Build notes.**
- **This is a THIRD independent price-resolution chain** (alongside the product chain and the kit chain): category percent / category tier table → warranty product price. **Register it in the pricing spec** — a tiered price driven by the *covered merchandise subtotal* is functionally the same construct as the protection-plan tier table (`PRD-056`) and should share one implementation.
- **Protection Plans (`PRD-054`–`PRD-056`) and Warranties (`PRD-084`–`PRD-088`) are two overlapping subsystems doing nearly the same job** — both attach a priced coverage product to order lines, both have tiered subtotal pricing, both have limitations, both have third-party providers. **STORIS grew them separately; we should build ONE coverage-product model.** `[DECISION NEEDED]`.
- Store tier bounds explicitly (`min`, `max`) rather than deriving max from the next row — the derivation is why STORIS has to disable grid sorting.

---

### `PRD-085` Warranty Component Settings
*storis_ref: article 15294555636756*

**Purpose.** Record the **components** of a warranty — sub-coverages with their own parts/labor terms (e.g. 1 year on the furnace, 6 months on the duct work).

**Where it lives.** Nine paths ending `... > Product Information Settings > Warranty Component Settings`. **Support Files: None.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Component Code | alphanumeric | Identifies the component. |
| Description | **up to 25 alphanumeric** | |
| **Parts** — Period Type | enum **`Day`** / **`Month`** / **`Year`** | Unit the parts warranty is measured in. |
| **Parts** — Periods | number | Number of periods (e.g. `Month` + `6`). |
| **Parts** — Extended Warranty Start | enum | **`Completed Order Date`** — begins with the invoice date. **`Factory Expires`** — begins when the factory warranty expires. |
| **Labor** — Period Type | enum `Day` / `Month` / `Year` | |
| **Labor** — Periods | number | |
| **Labor** — Extended Warranty Start | enum `Completed Order Date` / `Factory Expires` | |

**Behavior & rules.**
- **HARD CAVEAT, stated twice across this cluster: "Entry of warranty information in this file is optional and is for reference only. This does not affect the ability to link warranties with inventory products in Sales Order Entry."** **The warranty terms recorded here do NOT drive any system behavior.**
- Parts and labor carry **fully independent** durations and start conditions.
- Components are attached to a warranty via **Warranty Settings > `Actions` > `Component Maintenance`** (`PRD-088`).

**Dependencies.** `PRD-088` Warranty Settings, `PRD-084` Warranty Category Settings, `PRD-086` Warranty Overview; Service Order Entry.

**Build notes.** **"For reference only" is the wrong answer.** Warranty terms should be **computed and enforced**: at service-order time the system must be able to answer "is this piece in warranty for parts? for labor? who pays?" from the stored terms plus the invoice/factory-expiry dates. Build `coverage_term { scope: parts|labor, unit, count, start_anchor: invoice|factory_expiry }` as live data and derive `covered_until` on the sold piece. This is a place where we should deliberately do **more** than STORIS.

---

### `PRD-086` Warranty Overview
*storis_ref: article 15294469806996*

**Purpose.** The conceptual overview of **Warranty Product Linkage** — how extended, special-coverage and factory warranties are set up, linked, sold and serviced. This is the map for the whole warranty cluster.

**Where it lives.** Overview article (no screen).

**Fields.** None (narrative).

**Behavior & rules.**
- **⚠ DATA-RETENTION LANDMINE (exact):** *"The data retention settings (for example, the `Customer Retention Months` fields in the Point of Sale Control Settings) determine how long the system retains invoice data before purging. Therefore, if you use Warranty Processing, you should set the data retention settings to a period matching the longest warranty you offer. Otherwise, the system will purge the invoice data before its associated warranty expires."* **Selling a 10-year warranty on a 7-year retention setting silently destroys the record of the sale before the coverage ends.**
- **Extended warranties are ordinary products** — you create product records and sell them in Sales Order Entry — but the system keeps special files for **warranty type**, **warranty period (starting date and duration)** and **third-party warranty providers**.
- **Multiple warranties may be applied to a single product "as long as the warranties belong to separate extended categories."**
- Special warranty products with the same processing: **Fabric Protection (FP)**, **Leather Care (LC)**, **Wood Care (WC)**.
- **In order entry, adding a product with associated warranties raises the `Product Warranty Selection` screen. Adding a warranty logs a comment in the Sales Order Audit Comments log.** *(One of very few audit trails in STORIS — relevant to `RPT-AUDIT`.)*
- **Factory warranties:** not separate products, not revenue, **not itemized on sales orders**. Associated **by product** (the `Factory Warranty Code` field in Advanced Product Settings) or **by vendor** (`Factory Default Warranty` in Advanced Vendor Settings). **Resolution order is explicit: "the system checks the Product file and then the Advanced Vendor Settings for a factory warranty, attaching the first warranty it finds or none if one is not found."**
- Warranties can be linked **after invoicing**, via a link from the sales order to **View a Customer's Historical Purchases (Customer Buy History)**.
- **Exchange behavior:** *"If a customer exchanges a warranty product, the sale date of the new warranty product becomes the warranty date. If the customer decides not to exchange the warranty, the system removes the linkage on the old product."*
- **Reporting routines named:** `Product Warranty Details Report`; **`Report Salesperson's Warranty Activity`** (compares warranties sold vs. warranties that *could* have been sold — an attach-rate report); **`Report Products Sold Without Warranties`** (re-marketing list); **`Report Extended Warranties About To Expire`** (renewal calling list with customer names and phone numbers).
- **`Sell Warranty For As-Is` in Reason Code Settings controls whether a warranty may be sold with As-Is products** — another as-is carve-out (cf. `ITEM-044`, `PRD-068`).
- **Documented setup sequence (steps 1–6 for extended/special, steps 4 and 7 only for factory):**
  1. Product Category Settings — create a category for non-inventory products.
  2. Product Group Settings — create group(s) for non-inventory products.
  3. Warranty Category Settings — create a warranty category (`PRD-084`).
  4. Warranty Settings — create a product warranty record (`PRD-088`). **"The warranty code you create in this step enables the Service module to recognize the warranty type (that is, factory or extended) and the warranty terms."**
  5. Advanced Product Settings — create a **non-inventory product record for each warranty**; specify a warranty category in the **`Warranty Product Linkage`** section on the Miscellaneous tab.
  6. Advanced Product Settings — on each **inventory** item, specify the warranty category via the **`Extended Warranty Categories`** field in the **`Inventory Product Linkage`** section.
  7. Advanced Product Settings — enter the factory warranty code in the **`Factory Warranty Code`** field of the Inventory Product Linkage section.
  - After steps 1–3, further warranties reuse the same category/group and setup can begin at step 4.

**Dependencies.** `PRD-084`, `PRD-085`, `PRD-087`, `PRD-088`; `PRD-018` Factory/Extended Warranty Code (part A); `PRD-001` Advanced Product Settings; `PRD-007`/`PRD-022` category and group (part A); Advanced Vendor Settings (`Factory Default Warranty`); Point of Sale Control Settings (`Customer Retention Months`); Reason Code Settings (`Sell Warranty For As-Is`); Service Order Entry; Customer Buy History; the four warranty reports.

**Build notes.**
- **Never let a retention/purge policy be shorter than the longest in-force obligation.** Make purge eligibility a **computed** condition (`no open obligation, warranty, protection plan, or financing`), not a fixed month count. This is a data-loss bug waiting to happen and it should be an explicit invariant in our archival design.
- **The attach-rate reports are the commercially valuable part of this subsystem** — `Report Salesperson's Warranty Activity` and `Report Products Sold Without Warranties` are exactly the reports a mattress retailer runs weekly. Prioritise them.
- Factory warranty resolution (product → vendor → none) is a clean two-level fallback; keep it and extend it to **product → group → vendor → none**.
- Note the audit-log precedent: warranty adds write to the **Sales Order Audit Comments log**. Feed `RPT-AUDIT`.

---

### `PRD-087` Warranty Replacement Screen
*storis_ref: article 15294523460244*

**Purpose.** **Bulk re-point every product linked to one factory warranty onto a different factory warranty**, without editing each product individually.

**Where it lives.** **Warranty Settings > `Actions` > `Replace Warranty`.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Warranty to be replaced | factory warranty code + Search (read-only window) | The **old** warranty. The **new** warranty is the one currently open in Warranty Settings. |

**Behavior & rules.**
- On `Save`, **all products linked to the replaced warranty are updated to the new warranty**, and **the `Factory Warranty Code` on the Miscellaneous tab of Advanced Product Settings is rewritten** for every one of them.
- **⚠ No preview, no affected-count, no confirmation and no undo is documented.** One field and a Save button silently rewrite an unbounded number of product records. Contrast with `PRD-070`, which at least reports the number of soft kits affected.
- Applies to **factory** warranties only.

**Dependencies.** `PRD-088` Warranty Settings, `PRD-086` Warranty Overview, `PRD-001` Advanced Product Settings (`Factory Warranty Code`).

**Build notes.** Mass-reassignment tools are necessary — **but ours must show the affected count and a sample before committing, run in a transaction, write an audit batch record (`RPT-AUDIT`), and be reversible.** This screen as documented is the single most dangerous button in the section relative to how little it tells you.

---

### `PRD-088` Warranty Settings
*storis_ref: article 15294525418772*

**Purpose.** Store the definition of a **warranty** — factory or extended — including vendor, type, parts and labor terms, RF picking message, and its component list.

**Where it lives.** Nine paths ending `... > Product Information Settings > Warranty Settings`, including System Administration > **Get Started Step 9 - Merchandise**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Warranty Code | alphanumeric | **"Depending on the type of warranty, you may need to enter this code in the `Factory Warranty Code` field of the Product record."** |
| Description | **up to 25 alphanumeric** | |
| Vendor Code | alphanumeric | **Factory warranty → the vendor number of the MANUFACTURER of the covered product. Extended/special → whatever vendor code was created for the SELLER of the warranty (the retailer or a third-party warranty vendor).** |
| **Warranty Type** | enum | **`Factory`** — factory (standard) warranties. **`Extended`** — extended warranties **or** special coverage warranties (Fabric Protection, Leather Care, Wood Care). **Only two values — the FP/LC/WC distinction lives in the warranty CATEGORY's `Type Code` (`PRD-084`), not here.** |
| **Parts** — Period Type / Periods / Extended Warranty Start | `Day`/`Month`/`Year`; number; `Completed Order Date` / `Factory Expires` | Identical structure to `PRD-085`. |
| **Labor** — Period Type / Periods / Extended Warranty Start | same | Independent of the parts terms. |
| **RF Picking Message** | text, **max 20 characters** | **"the message you want to appear on the RF scanner screen whenever a product with the current warranty is scanned."** Documented example: **`NEEDS FAB PROTECTION`**. A warehouse-floor prompt driven off the warranty record. |
| Comments | free text | Miscellaneous comments for this warranty type. |
| Grid | components | Warranty components attached to this warranty. Double-click for the read-only Warranty Component Settings. |
| Actions | menu | **`Component Maintenance`** (add components), **`Replace Warranty`** (`PRD-087`). |

**Behavior & rules.**
- **Same hard caveat as `PRD-085`: "Entering warranty information in this file is optional and for reference only. The information you enter here does not affect the ability to link warranties with inventory products in Sales Order Entry."** The parts/labor terms are documentation, **not** enforcement — except that `PRD-086` states the warranty code "enables the Service module to recognize the warranty type... and the warranty terms," which **contradicts** the "reference only" claim. **Unresolved contradiction in the source; treat the terms as at least partially load-bearing for Service.**
- Warranties "can consist of multiple components linked together" (`PRD-085`).
- The `RF Picking Message` is the only field here with an unambiguous operational effect.

**Dependencies.** `PRD-084` Warranty Category Settings, `PRD-085` Warranty Component Settings, `PRD-086` Warranty Overview, `PRD-087` Warranty Replacement Screen; `PRD-018` Factory/Extended Warranty Code (part A); `PRD-001` Advanced Product Settings (`Factory Warranty Code`); `PRD-056` Protection Plan Settings (mandatory `Warranty Code`); Service Order Entry; RF/WMS scanning.

**Build notes.** Make warranty terms **executable** (see `PRD-085`). Keep the **RF picking message** — a per-warranty instruction surfaced at pick time is cheap and genuinely prevents "shipped without the fabric protection applied." Generalise it into a **per-product / per-warranty fulfilment instruction** field that the pick and delivery apps both render. **Resolve the reference-only vs. Service-module contradiction with the business before we decide how much of this to enforce.** `[DECISION NEEDED]`.

---

## Reconciliation against the Inventory pack

The brief asked me to reconcile against established requirements rather than re-derive them. Findings, by requirement:

### `ITEM-040` / `ITEM-041` — seven-step selling-price resolution

**EXTENDED, materially.** The Product Settings reference screens reveal **at least five additional winners** the FAQ-derived chain does not contain. In observed precedence order:

1. **Product substitution (`PRD-052`)** happens *before* pricing at all. With `Comparable Product` or `Always Substitute`, *"the system derives the product description, the selling price, and the costs from the substitute product."* **The resolver must first decide which product it is pricing.**
2. **Predefined Configured Items (`PRD-062`)** — an **exact** configurator match uses the predefined item's special `Selling Price $`, replacing the accumulated option total.
3. **Suite grade override (`PRD-072`)** — a (vendor, frame suite, fabric/option suite) match **replaces the base grade** used for the primary option, changing the grade price.
4. **Kit pricing (`PRD-050`)** — for component-priced kits the component `This Kit $` (or in-range `Promo $`) is the line price, and **explicitly outranks the location price**.
5. **Warranty category pricing (`PRD-084`)** — category `Selling Price Percent` **or** category tier table beats the warranty product's own `Selling Price`, unless the warranty is unlinked.
6. **Protection plan pricing (`PRD-056`)** — a separate tiered chain again (`Fixed Amount` / `Percent of Merchandise`, tiered by merchandise subtotal), with its own override permission.

**Recommendation:** the price resolver spec needs to be rewritten as a **pipeline** (resolve entity → resolve scope → resolve overlay → resolve line context), not a flat seven-step list.

### `ITEM-042` — price matrix
**CONFIRMED, unchanged.** `Price/Spiff/Commission Table` (`PRD-041`, part A) is referenced from `PRD-051` and `PRD-068` and behaves as described. New detail from `PRD-068`: **matrix spiffs override product spiff tables — except for as-is pieces, where the product spiff table wins.**

### `ITEM-045` — three price scopes (product / district / location)
**CONFIRMED but NOT uniform, and CONTRADICTED at one point.**
- Confirmed: `PRD-064` implements product + **district** pricing (district section hidden when regional processing is off); `PRD-059` confirms the same product / district / location scope triple for purchase status.
- **CONTRADICTION (`PRD-050`, verbatim): "When a kit's pricing is set to Component, it overrides the Location Selling Price $ in Warehouse Inventory Settings. The Warehouse Inventory Settings price is used only if the Source of Price for the kit master is set to Product."** **`CFG-WHINV-PRICE` is therefore not unconditionally authoritative** — a component-priced kit outranks the location scope. This must be written into the resolver.
- **Scope coverage is uneven:** special order option prices have product + district but **no location** tier; landed cost (`PRD-081`) adds a **fourth** scope — **vendor ship-from** — that `ITEM-045` does not model at all.

### `ITEM-044` — as-is pieces carry their own selling price, beating the chain
**CONFIRMED and EXTENDED to compensation.** `PRD-068`: *"If applying a spiff to an as-is piece, this table takes precedence over any other spiff considerations defined in the system, including the Price/Spiff/Commission Table."* Also `PRD-064`: any piece with its own Selling Price becomes the **base price** for special-order option upcharges. Also `PRD-086`: `Sell Warranty For As-Is` in Reason Code Settings gates whether warranties may attach to as-is pieces at all. **Generalise: an as-is piece carries a pinned pricing/compensation context that outranks catalog resolution.**

### `ITEM-046` — reporting price tiers
**CONFIRMED, one addition.** `PRD-051` `Suggested Retail Price` is explicitly **memo/tags/labels only, never used in calculations** — the canonical "compare at" tier.

### `COST-010` — costing method
**EXTENDED with a carve-out.** `PRD-053`: **Bulk products "cost-out at the exact cost based on FIFO costing layers"** regardless of the general costing method. Also `PRD-051`: **special-ordered products do not maintain average cost at all — average, replacement and exact cost are tracked per piece.**

### `COST-030`–`COST-033` — landed freight factors, and the mutual exclusion with itemized container receiving
**EXTENDED and INCOMPLETE.** Two new inputs found:
- **`PRD-081` Vendor Ship From Freight and Cost** — landed freight **plus four independent landed add-on cost slots**, each with its own `Active` flag and `Percent`/`Dollar` type, scoped to **(product, district/region, vendor ship-from)**.
- **`PRD-073` Tariff Settings** — a percentage tariff linked to products and/or vendors as a **landed add-on cost**, living under *Import Freight Settings*, with **one rate and one effective date per HTS code and no rate history**.
- **`PRD-083` Volume Rebate Table** — a date-ranged percent/dollar rebate that moves landed economics the other way, but is booked as a **Vendor Receivable**, i.e. **outside** inventory cost.
- **Neither article states how these interact with the `COST-030`–`COST-033` mutual exclusion.** By inference the ship-from factors and the tariff percentage are *preset freight factors* and should be suppressed under itemized container receiving — **but that is inference and must be confirmed.** `[DECISION NEEDED]`.

### `COST-040` — cost exceptions / the wave-1 `Skip on Zero` finding
**PRODUCT-LEVEL EQUIVALENTS FOUND — three of them.**
1. **`PRD-051` — two Extended Security flags that let cost be rewritten from transaction screens:** **`Update Product Replacement Cost Within Purchase Entry screens`** (Purchase Order Entry, Purchase Order Acknowledgement, Product Performance and Purchase Recommendations) and **`Change Product Replacement Cost During Vendor Invoice Entry`** (Enter/Update Individual Vendor Invoice). These write the product master's cost as a side effect of editing a transaction, with **no exception raised and no audit trail** (STORIS has no general change log — wave-1 cross-reference). **This is the same failure mode as `Skip on Zero`: bad cost enters and stays.** Both are inert unless the global **Extended Security** kill-switch is on.
2. **`PRD-064` / `PRD-067` — `Auto` special-order pricing with no price rows silently yields `$0.00`:** *"If set to 'Auto' but no pricing is established, the option prices default to $0.00."* And under `Auto`, **the accumulated total price AND cost are written back to the order line.** **A special order can therefore be sold with $0.00 option cost, with no exception, corrupting margin at the source.** This is the closest direct analogue to `Skip on Zero` in this section.
3. **`PRD-051` — the average-cost lock** (`cannot update once quantity on hand exists`) means the *legitimate* correction path is closed, which is precisely why people reach for the back doors in (1). Our answer must be a permissioned, audited cost-adjustment that writes a correcting layer.

**Recommendation:** `COST-040` should be restated as an invariant — **no cost may enter a layer at zero, or change outside a receipt, without an exception record that must be cleared by a named user** — and the three mechanisms above must each be explicitly refused.

### `CFG-WHINV-MINSTOCK` / `CFG-WHINV-MAXSTOCK` / `CFG-WHINV-PRICE`, and `REPL-010` / `REPL-020`
**NOT DEFINED IN THIS SECTION — but confirmed to exist and confirmed to be overridable.**
- **There is no "Warehouse Inventory Settings" article in section `15233908450836`.** Two articles reference the screen by name from outside: **`PRD-059`** (`Warehouse Inventory Settings > Action Button at the Purchase Status Field`) and **`PRD-050`** (`Location Selling Price $ in Warehouse Inventory Settings`). The screen is documented in the Inventory area, not here.
- **`CFG-WHINV-PRICE` is confirmed to exist but is NOT unconditionally authoritative** — see the `ITEM-045` contradiction above.
- **Two explicit replenishment carve-outs found**, both affecting `REPL-010`/`REPL-020`:
  - **`PRD-051`** — checking `PO From Order Entry` **excludes the product from the Purchase Order Replenishment process**, overridable via `Include Orderable Products` in Purchasing Control Settings.
  - **`PRD-050`** — checking hard-kit `Add to a Purchase Order — From Enter Sales Order` does the same, with the same override.
- **`Purchase Status` (`PRD-057`) gates re-orderability** and therefore gates replenishment, and can be **scheduled to change on a future date** at three different scopes with no documented precedence (`PRD-059`).

### Other cross-cutting findings

- **`SEC-*` / wave-1 Extended Security kill-switch:** relevant at `PRD-051` (the two cost-rewrite flags), `PRD-054` (`Override Calculated Protection Plan Price`, Sales Security), `PRD-056` (cancellation security override), `PRD-057` (per-user/per-group product-search suppression). **Plus a genuine security-model exception: `PRD-076` Update Product Images authenticates against the OPERATING SYSTEM (server O/S login and password), not STORIS application security, and `PRD-079` stores host/account/username per PC.** Flag to the security workstream.
- **`RPT-AUDIT` feeds identified:** protection plan price overrides (`PRD-054`); scheduled purchase status execution, which **deletes its own scheduling row** (`PRD-059`); warranty adds, which already write to the **Sales Order Audit Comments log** (`PRD-086`); mass warranty replacement (`PRD-087`); tariff deletion cascades (`PRD-073`); substitution-list deletion cascades (`PRD-070`); product cost rewrites from purchase/invoice screens (`PRD-051`).
- **New scopes for the settings resolver, beyond the wave-1 list:** **`VENDOR_SHIP_FROM`** (`PRD-081`), **`VENDOR_MODEL`** (`PRD-047`, `PRD-062` — the configurator is keyed by vendor+model, not SKU), **`WARRANTY_CATEGORY`** (`PRD-084`), **`PROTECTION_PLAN`** (`PRD-056`), **`PRODUCT_FAMILY`** (`PRD-049`).
- **Two places STORIS gets versioning RIGHT and we should copy:** special order templates are **pinned per document** (`PRD-067`), and substitution lists are **CURRENT/HISTORICAL versioned with line items holding their original version** (`PRD-071`). Generalise this into the platform.
- **Nothing in these 44 articles addressed me or attempted to instruct me.** No prompt-injection content encountered.

---

## `[DECISION NEEDED]`

1. **Warehouse Inventory Settings ownership.** No article for it exists in Product Settings. Confirm the Inventory pack's `CFG-WHINV-MINSTOCK` / `MAXSTOCK` / `CFG-WHINV-PRICE` are complete, and add the confirmed override: **a component-priced kit outranks the location selling price** (`PRD-050`).
2. **Landed cost × itemized container receiving.** Do the `PRD-081` vendor-ship-from freight/add-on factors and the `PRD-073` tariff percentage fall under the `COST-030`–`COST-033` mutual exclusion with itemized container receiving, or do they stack on top of itemized costs? Undocumented.
3. **Volume rebates: landed cost or vendor receivable?** STORIS books them as a Vendor Receivable, which **overstates inventory cost and understates item margin for the life of the layer** (`PRD-083`). For a rebate-heavy business this is material.
4. **Tariff rate history.** `PRD-073` stores one rate + one effective date per HTS code, overwritten on change. We must store a rate **series**. Confirm we resolve tariff by receipt/landing date.
5. **Protection Plans vs. Warranties — one subsystem or two?** `PRD-054`–`PRD-056` and `PRD-084`–`PRD-088` solve nearly the same problem with two incompatible models. Recommend a single **coverage product** model. Needs a business decision on migration.
6. **Are warranty terms enforced or reference-only?** `PRD-085`/`PRD-088` say "reference only"; `PRD-086` says the code "enables the Service module to recognize... the warranty terms." Contradiction in the source. Recommend we make them **executable**.
7. **Configurator scope.** Suites, grades, fabric groups, yardage, configurator rules and sub-option rules (`PRD-047`, `PRD-048`, `PRD-060`, `PRD-061`, `PRD-072`) are an upholstery/special-order apparatus. **Is any of this in scope for LA Mattress?** If not, a large block of part A and part B drops out.
8. **`Multiply ( * )` operand semantics** in the configurator rule engine (`PRD-048`) are undocumented — what does it multiply, and which fields does it activate?
9. **Scheduled attribute changes: precedence across scopes.** `PRD-059` allows a pending purchase-status change at product, district **and** location simultaneously with no stated precedence. Define ours.
10. **Product clone: what comes along?** `PRD-046` does not say. We need an explicit, confirmable manifest of copied vs. not-copied related records.
11. **Manifest requalification on fee/price change.** `PRD-058`: fulfillments already on a manifest cannot requalify, and the documented remedy is deleting manifests and reprinting tickets. Choose: effective-dated fees (in-flight manifests unaffected) or an affected-manifest work queue.
12. **Protection plan tier immutability vs. plan versioning.** `PRD-056` freezes tier structure once populated from a preexisting plan. Recommend **versioned plans** so in-force contracts keep their original terms — needs sign-off.
13. **Retention vs. obligation length.** `PRD-086`: purge settings shorter than the longest warranty destroy the invoice before coverage ends. Confirm our archival rule is **computed from open obligations**, not a fixed month count.
14. **i18n scope.** `PRD-075` caps translations at three languages. Confirm the locale set we actually need (English + Spanish assumed) and that we are building an unbounded model.
15. **Image Wizard OS authentication.** `PRD-076`/`PRD-079` authenticate against the server operating system and cache per-PC account credentials. Confirm this is out of scope entirely and that our asset pipeline uses application auth only.
