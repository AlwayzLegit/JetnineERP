# Product Settings — Part A (positions 1–44 of 88)

*Section: STORIS Help Center → System Administration → Product Settings (section `15233908450836`, 88 articles).*
*This file covers **enumeration positions 1–44**. Positions 45–88 are covered by `product-settings-b`.*
*ID prefix `PRD`, numbered `PRD-001`–`PRD-044`, matching enumeration position exactly.*

Most articles in this section are published with **two version tabs** (`11.0` and `10.8`). Everything below
is read from the **11.0** tab; where 10.8 differs materially it is called out.

## Split manifest — what positions 1–44 turned out to be

| # | Article title | article id |
|---|---|---|
| 1 | Advanced Product Settings | 15294524452244 |
| 2 | Ashley Interface Settings | 15294470774036 |
| 3 | Assign Options | 15294468994324 |
| 4 | BAI Code Settings | 15294470781460 |
| 5 | Base/Grade Configuration | 15294470263060 |
| 6 | Brand Settings | 15294470776852 |
| 7 | Category Settings | 15294470775956 |
| 8 | Collection Settings | 15294470773140 |
| 9 | Component Priced Kits | 15294468994196 |
| 10 | Configurator Clone Process | 15294469951124 |
| 11 | Configurator Sub-Option Rules | 15294523580180 |
| 12 | Configurator Yardage Screen | 15294468995092 |
| 13 | Default Product Settings | 15294524452756 |
| 14 | Discount Costing Table | 15294522623380 |
| 15 | District and Regional Product Settings | 15294470776724 |
| 16 | Fabric Configuration | 15294470273812 |
| 17 | Fabric Group Configuration | 15294523901716 |
| 18 | Factory/Extended Warranty Code | 15294524453140 |
| 19 | Freight Distribution | 15294522637972 |
| 20 | Grade Description Configuration | 15294470266644 |
| 21 | Gross Margin Calculator | 15294468990612 |
| 22 | Group Settings | 15294470776468 |
| 23 | Image Replication Service | 15294522840852 |
| 24 | Image Wizard Settings | 15294555045652 |
| 25 | Inventory Formation Settings | 15294524800404 |
| 26 | Inventory Formations Overview | 15294522840212 |
| 27 | Kit Promotion Settings | 15294524798740 |
| 28 | Lay-Z-Boy Settings | 15294524801684 |
| 29 | Line Item Text | 15294522843284 |
| 30 | List Configuration | 15294523891732 |
| 31 | Maintain Code | 15294523065620 |
| 32 | Markdown Pricing | 15294469386260 |
| 33 | Option Configuration | 15294523895444 |
| 34 | Option Grade Price Configuration | 15294523891988 |
| 35 | Option Price Configuration | 15294470269844 |
| 36 | Option Type Configuration | 15294523898516 |
| 37 | Prep Code Settings | 15294524821268 |
| 38 | Price Adjustment Clone Process | 15294469389972 |
| 39 | Price Adjustment Settings | 15294555043092 |
| 40 | Price Adjustments - Actions | 15294469392020 |
| 41 | Price/Spiff/Commission Table | 15294469387156 |
| 42 | Product Attribute Title Settings | 15294555044628 |
| 43 | Product Attribute Value Settings | 15294524815252 |
| 44 | Product Benefit Settings | 15294555057556 |

(Positions 45–88, for reference, are: Product Benefits Entry; Product Clone Process; Product Configuration;
Product Configurator Rules Screen; Product Family Settings; Product Kit Settings; Product Settings; Product
Substitution Codes; Product Type Codes; Protection Plan Product Selection; Protection Plan Selection;
Protection Plan Settings; Purchase Status Settings; Retail Delivery Fee Overview; Schedule Purchase Status;
Set Configuration Rules; Set Configuration Sub-Option Rules; Set Predefined Items; Special Order Option List
Settings; Special Order Option Price Settings; Special Order Option Settings; Special Order Option Type
Settings; Special Order Template Settings; Spiff Table Entry Screen; Substitute Product List Example;
Substitute Product List Settings; Substitute Product Selection; Suite Configuration; Tariff Settings; Tax
Class Settings; Text Field - Language Translation Entry; Update Product Images; Update Product … and the
remainder — all in `product-settings-b`.)

---
### `PRD-001` Advanced Product Settings
*storis_ref: article 15294524452244*

**Purpose.** The product master maintenance screen — creates and maintains the product (SKU) record with
**every** field STORIS holds on a product. It is the superset screen: "this program contains additional
fields not available in the Product Settings program" (`Product Settings`, position 51, is the cut-down
version). This is the single most important article in the section; everything else in Product Settings is
either a code table this screen points at, or a bulk/alternate way of editing a subset of these fields.

**Where it lives.** Reached from ~14 different menu paths, notably
`System Administration > System Settings > Merchandising and Distribution System Settings > Inventory
Hierarchy Settings > Product Information Settings > Advanced Product Settings`, plus Accounting > Payables,
Accounting > Vendor Receivables, Merchandising and Distribution > Purchasing > Buyer/Merchandiser Tools, and
Customer > Customer Service. Pages (tabs): **General, Pricing, Costing, Settings, Miscellaneous, eBridge,
eBridge SEO, Interfaces, User Defined Settings, eSTORIS, API**.

**Fields — header**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | code, up to **20 alphanumeric** | The SKU. Auto-numbering available via `Next Product Number` in Inventory Control Settings; `Format = Dynamic Identifier` builds the code from the Dynamic Identifier composition rules. **Once created the Product ID is permanent — changing the components that built a Dynamic Identifier does not regenerate it; you must delete and recreate the product.** |

**Fields — General page**

| Field | Type | Purpose / business rule |
|---|---|---|
| Description | text | Line 1. **If the product is flagged Special Ordered this must be generic** — the "physical" product without fabric/cosmetic detail. Has a language-translation action. Feeds floor-tag label queue (see Selling Price rule below). |
| Second Description | text | Line 2, used by various processes when populated. Also translatable. |
| Brand | code FK → Brand Settings (`PRD-006`) | Many reports sort by brand. |
| Vendor Model | text | Vendor's model number. **Prints on the PO instead of the SKU when populated**; blank ⇒ SKU prints. Used for cross-reference inquiry, and is the join key for vendor inventory feeds. If `Report Sort By = Vendor Model` in Inventory Control Settings this becomes effectively required. If `All Vendor Products` in Vendor Settings is off, only vendor products whose order number matches a Vendor Model are updated. |
| Vendor | code FK | Primary vendor. |
| Group | code FK → Group Settings (`PRD-022`) | **Required. "All products must be associated with a group, and all groups must fall within a product category."** Cannot select an inactive group, nor a group whose category is inactive. **Changing the group does NOT update existing orders.** If ATP is in use, changing the group forces an ATP recalculation deferred to End of Day, with a warning prompt (Yes = recalc at EOD, No = cancel the update). |
| Inventory Type | enum | `Retail Inventory` \| `Retail Part` \| `Retail Labor` \| `Service Part Only` \| `Service Labor Only` \| `Service Charge Only` \| `Non-Merchandise Service`. **IRREVERSIBLE: "Once you set this field and save the product settings, you cannot change the Inventory Type."** Remedy is delete-and-recreate, allowed only when QOH = 0 and the product is on no open purchase or sales orders. Special-order on-the-fly products force `Retail Inventory`, non-editable. |
| Product Type | enum | `Inventory` \| `Non-inventory` \| `Bulk Product` \| `'Temporary' Special Order`. **Cannot be edited while open orders exist.** **Non-inventory products cannot be linked to special order products.** |
| Non-Inventory Usage | enum | `Retail Delivery Fee` \| `State Recycling Fee` \| `Installation` \| `Installation – Real Property` \| `None` (default). **Selectable only when Product Type = Non-Inventory**; every other product type is locked to `None`. Retail Delivery Fee is *not* linked to a merchandise SKU — it attaches to state jurisdictions via the `Retail Delivery Fee` field of Sales Tax Settings. With Avalara ATI, set a Tax Class Code and a **$0.00 selling price** on the fee product. |
| Inventory Activity | checkbox | Kardex activity tracking. Inventory Control Settings General tab has `Track Bin-To-Bin Transfers`, `Track As-Is Activity`, `Track As-Is Reason Code` to include/exclude data. |
| Serial Numbers | checkbox | Serial-tracks the product. **You cannot serial-track piece-less (non-referenced) products.** **Edit is rejected with an error while the product is on an open purchase order or sales order.** Default for on-the-fly products comes from Default Product Settings (`PRD-013`). |
| Special Ordered | checkbox | **Cannot be toggled when: quantity on hand exists; open purchase orders exist; or the product is a kit component whose `Use Package Price` is enabled in Product Kit Settings.** Inactive when `PO From Order Entry` is checked. **A product in a product family cannot become a special order product** (warning shown). For special-ordered products: **average cost is not maintained** — average cost, replacement cost and exact cost are tracked *per piece*; **Pieces Per Carton accepts only 1**. |
| Vendor Ship-From | code FK | Active only when the vendor has multiple ship-from addresses. Drives buyer determination under the Buying Group feature. |
| Creation Date | date | Defaults to today on create; **not manually editable and not settable via conversion spreadsheet** once set. |
| PO From Order Entry | checkbox | On a sales order with insufficient quantity, prompts "add the item to a purchase order"; Yes creates a new PO. Inventory products only. Works for **soft-kit components**; for hard-kit masters use Product Kit Settings instead. Inactive when `Special Ordered` is checked. **Checking it excludes the product from PO Replenishment**, overridable by `Include Orderable Products` in Purchasing Control Settings. With Buying Group active, the generated PO has **no buyer and is placed on hold** until a buyer is assigned. Default for on-the-fly products from Default Product Settings. Also affects eSTORIS orders. |
| Default Fulfillment Method | enum | `Delivery` \| `Customer Pick up` \| `Take With` \| `No Default`. Read **only** by Enter a Sales Order. **If a membership SKU defaults to `Take With`, no fulfillment on the order can be scheduled for delivery until that membership item is completed or removed.** Quotes do not allow `Take With`, so membership-reward products on quotes should use `Customer Pickup` + selling store. |

**General page — Actions.** Add/Edit/View Attachments; **Clone info for new products**; Configurator
Yardage; Gross Margin Calculator (`PRD-021`); Line Item Text (`PRD-029`); **Product Benefits**; **Enter
Special Order Options**; **Remove Special-Order Template Options** ("clear all special-order information
previously assigned to the product").

**Fields — Pricing page**

Header banner: **"District settings active"** appears when District and Regional Product Settings rows exist
for this product (`PRD-015`).

| Field | Type | Purpose / business rule |
|---|---|---|
| Selling Price | money, 6.2 | The product-scope selling price. **Explicitly documented as only one input to the hierarchy: "the price you enter at this field may not actually default into sales order line items."** For `Service Labor` inventory types this is **the hourly rate divided by 60** (enter `1` for a $60/hr rate) so fractional hours work. If SRP-based discounts are used, applying the discount **replaces** selling price with SRP; removing it reverts — unless the product has no selling price, in which case it stays at SRP. |
| Suggested Retail | money | **Memo/tag/label only — never used in any calculation** (except the SRP-discount swap above). |
| Kit Selling Price | money | Default price used when this product is added to a kit in Product Kit Settings. Blank ⇒ Selling Price is used. **Works only for Hard Kits using component pricing; a Soft Kit built with component pricing ignores it.** |
| Markdown Price | money + auto date | **Active only when Purchase Status is `M` (Markdown), `D` (Dropped) or `T` (Discontinued).** The edit date displays beside the field. **Changing status away from M/D/T clears and inactivates both the price and its date.** Also settable by region and via Single Product Review Screen. |
| **Price Code** | code | **This is the product side of the price matrix.** "Enter the Price Category code to be used in the Customer Price Settings. During Sales Order entry, this field is used in conjunction with the Price Category field in the Customer record to access the Price Matrix file." |
| Discountable | checkbox | Eligible for line-item discounts configured in Point of Sale Control Settings. |
| Exclude Minimum Quantity | checkbox (default off) | Excludes this product's units when accumulating quantity toward a discount's `Minimum Eligibility Required - Quantity`. Applies to both order-level and line-level minimums. **Hard/Soft kit quantity accumulation counts all components — to exclude kit components you must set this flag on the component products.** |
| Maximum Trade Merchant Discount % | percent | Default max discount on a trade/referral sale. Blank ⇒ falls back to `Maximum Trade Discount` on the Vendor record. **Trade discounts are wholly independent of the `Discountable` flag and of all other discounts.** Overridable during order entry subject to sales security. |
| Code (Discount) | code, max 6 alphanumeric | Auto-applies a product discount to sales and prints on floor tags. Must exist in Sales Discount Settings **and be set up as a product discount**. **Can only be added when Selling Price or Kit Selling Price > $0.00.** |
| Promotion — Code | code FK | Price adjustment/promotion code. **A promotion code alone does nothing — Start Date and End Date must also be set.** Codes shown in the lookup are those **not yet loaded** from Price Adjustment Settings. |
| Promotion — Price | money 6.2 | Promotional selling price applied to all sales orders between start and end date. **During the sale period no other discounts may be applied.** |
| Promotion — Start Date / End Date | date | The promo window. |
| Promotion — Commission % | percent | Commission awarded when sold at promo price. **Applies only when the product is the commission source; it does not override commission-matrix percentages.** |
| Promotion — Spiff Amount | money | Flat spiff when sold at promo price. |
| Variance % | percent 0.00–100.00 | Max % the selling price may be **reduced** by. **Resolution order: product level → selling store location → Point of Sale Control Settings.** Blank ⇒ you *must* pick `Use Warehouse/Store Settings` at Variance Exceeded Alert and leave Reason Required blank. Populated ⇒ you *cannot* pick `Use Warehouse/Store Settings`. Also applies to special-order products, measured against Advanced Product Settings selling price **plus special-order option upcharges**. |
| Variance Exceeded Alert | enum | `Use Warehouse/Store Settings` \| `Do Not Alert` \| `List on Exception Report` \| `Warning Message` \| `Security Override Required` (records the authorizing user). |
| Reason Required | checkbox | Requires a reason code on a variance exception. Must be blank if Variance % is blank. |
| Comment Required | checkbox | Requires a comment; comment is stored **against the whole order, not the line** (viewable via View/Edit Exception Comments on the Merchandise tab). Must be blank if Variance % is blank. |
| | | **Price variance checks run against the line item price, the modified order subtotal, and within group pricing.** |
| Taxable | checkbox | State/local tax only; does not affect national taxation. **Inactive when Alternate Tax Interface is enabled.** |
| National Exempt | checkbox | Defaultable via Default Product Settings. |
| Tax Class | code FK → Tax Class Settings | Blank ⇒ taxability from `Taxable`. If the class appears in `Tax Override Class` of Sales Tax Settings the line's taxable status may be overridden. Used to classify for Vertex® under ATI; **if either product or tax class is not set up with the provider, the product defaults to taxable.** |
| Commissionable | checkbox | |
| Commission % | percent | Used when `Calculation Code` in POS Control Settings = matrix and this product is the commission source. |
| Category (commission) | code | Paired with the **Commission Category on the Customer record** to look up a Commission Matrix row. Referenced only when Calculation Method = Matrix. |
| Add To Cost % | percent −99.99 … 99.99 | Added to cost **for sales-commission reporting only** (inflates cost, lowers reported GM). **Overrides `Commission Add on %` on the Pricing page of Costing Control Settings — including a literal `0`, which suppresses the global add-on for this product.** |
| Spiff Amount | action | Opens the Spiff Table Entry Screen (position 68). |
| Minimum Labor Time | number | Only when Inventory Type = `Service Labor Only`. |
| Service Repair Charges Apply to | multi-checkbox | Only when Inventory Type = `Service Charge Only`. Options: `In Home`, `In Shop`, `Quick Service`. |

**Fields — Costing page**

Header banner: **"Regional settings active"** when regional rows exist in `PRD-015`.

| Field | Type | Purpose / business rule |
|---|---|---|
| Replacement (cost) | money | Manufacturer's list cost for **one purchase unit**. Defaults into `Unit Cost` in purchasing routines. Action button → **Vendor Ship From Replacement Cost Settings** (per-ship-from cost exceptions). Auto-update on Unit Cost edit is gated by Extended Security (Purchasing) `Update Product Replacement Cost Within Purchase Entry Screens` (PO Entry, PO Acknowledgement, Product Performance and Purchase Recommendations) and Extended Security (Payables) `Change Product Replacement Cost During Vendor Invoice Entry`. For Service Labor products this is the **hourly cost**. |
| Average (cost) | money 6.2 | Weighted average cost. **HARD RULE: "Once this product has quantity on hand, you cannot update the average cost."** |
| Non-Inventory % | percent | Non-inventory products only. Cost is derived as a percentage of retail price at the moment of entry; **the calculated cost is frozen — later price changes do not recompute it.** |
| Minimum Gross Profit % | percent | Minimum GM% to hold when the default selling price is edited during order entry; violation raises an exception depending on check level. **STORIS resolves min-GP% and check level through a hierarchy** (article does not enumerate it here). |
| Volume Rebate Table | action | Assign a pre-established VR Rebate Plan (vendor volume rebate). |
| Discount Costing Table | action | Pre-establish PO-entry default discount codes with start/end dates → `PRD-014`. |
| Import Tariff Code 1 / 2 | code FK → Tariff Settings | **Display-only unless a plug-in sub-routine is installed.** To make tariffs actually cost, you must define an add-on cost named **Tariff** in Costing Control Settings and set that add-on's **Type = `Calculation`** here. The tariff then appears in `Estimated Landed Cost` on the PO and is folded into the designated add-on cost at receipt. **If both codes are populated, the plug-in decides whether one or both apply.** |
| Minimum Order Quantity | int, 3 digits | PO Entry **blocks** (not warns-and-continues) a smaller quantity. **Under Automated PO Replenishment, a calculated quantity below this puts the PO on hold regardless of `Automatically Hold POs` in Advanced Vendor Settings.** |
| Maintain PO Line Text | multi-value text | PO line information for this product; **the comments entered here appear in the Enter Special Order Options window**. On import via the Product conversion spreadsheet, multiple values are separated by carriage return (also true of the multi-value indicator from General System Control Settings). |
| Buying Group | code FK | **Supersedes buying-group information on Advanced Vendor Settings and on Vendor Ship-From records.** |
| Adjustment Code | display-only | Shows the price adjustment code from the last Price Adjustment Settings load. |
| Rebate/Trailing Credit — Amount 1 / 2 | money 0.01–999,999.00 | Fixed dollar amount **per piece**. Required to set up a trailing credit. **To create a second trailing credit you must first have Amount 1 and End Date 1.** |
| — Start Date 1 / 2 | date | Optional for credit 1 (blank ⇒ effective immediately). **Required for credit 2 and must be greater than End Date 1.** |
| — End Date 1 / 2 | date | Optional for credit 1 (blank ⇒ indefinite, **and then a second trailing credit is not allowed**). If both dates present, End ≥ Start. |
| — General Ledger Account 1 / 2 | GL account, cost-center wildcard allowed | Debited at order completion. Fallback when blank: the `Trailing Credit` account on the Inventory page of General Ledger Assigned Account Settings. |
| Freight — Factor | enum + value | `Percent` (multiplies the line item amount) or `Dollar` (flat unit amount). **The Percent option requires `LANDED FREIGHT - Active` to be enabled in Costing Control Settings.** If a percent is entered, the Dollar field is **continuously overwritten with the latest calculated cost on each purchase**. Action → **Vendor Ship From Landed Freight and Addon Cost Settings** for per-ship-from exceptions. |
| Add-On 1–4 Factor + Cost Fields 1–4 | enum + value ×4 | Duties, tariffs, extra freight, broker's fees, overhead. **Factor type enum is `Percent` \| `Dollar` \| `Calculation`.** The four add-on **field names themselves are defined in Costing Control Settings** — they are user-labelled slots, not fixed columns. |

**Fields — Settings page**

| Field | Type | Purpose / business rule |
|---|---|---|
| Lead Days | int 0–999 | 0 = no lead days (today is the receipt date). **Blank ⇒ fall through to the next level of the lead-days hierarchy** (i.e. blank ≠ zero). |
| Purchase Status — Current Status | code FK → Purchase Status Settings | Governs re-orderability. Also assignable from District and Regional Product Settings, Single Product Review Screen, Warehouse Inventory Settings, and **Set Product Status by Region** (mass assign). **Cannot be set to `D` (dropped) or `T` (discontinued) while quantity-on-order exceeds quantity-on-hand**, unless the user holds Extended Security `Dropped Purchase Status with Open POS Quantity` / `Discontinued Purchase Status with Open POS Quantity`. Changing to/from `M`/`D`/`T` while Markdown Price is populated prompts to generate a **markdown list** for reprinting floor tags (printed via the `Stock Type` field in Print an Inventory Floor Tag / Print a Bar Code Floor Tag). |
| Purchase Status — Date | display date | Date the status last moved off `A` (active). Cleared when status returns to `A`. |
| New Status Date / New Status | date + code | Deferred status change, applied by the **Scheduled Settings Update** process in Schedule a Process. New Status must: not equal current status; **not be `P` (purge)**; **not be `O` (one time buy) when Product Type is non-inventory, temporary special order, or special ordered**. |
| Boxes per Product | int | Boxes per single saleable unit; drives RF barcode label counts. **IRREVERSIBLE-ish: "Once this field is set to an amount greater than 1, this field's value can be increased or decreased, but cannot be set back to 1."** It also cannot be decreased to 1 while inventory is on hand. Changing it with stock on hand **reprints product labels at all RF-barcode stock locations**. **Products with >1 box cannot be scanned with Batch Barcode.** Scan requirements: Receiving = all labels; Bin-to-bin, Cycle count, Physical inventory = first label; Picking = all labels. |
| Logistical Carton Quantity | int | Saleable units per shipping carton. **Special order products accept only 1.** Must be >1 to use Logistical Carton Transfers. **Only one of Boxes per Product / Logistical Carton Quantity may exceed 1.** |
| Logistical Carton Transfers | checkbox | Forces transfers in complete-carton multiples, manual and automatic. Under-quantity transfers raise the **Confirm Required Carton Quantity for Shipment** screen and need the "Override Complete Carton Requirements" User/User Group Logistics Security permission. |
| Purchase Carton Quantity | int, 3 digits | Vendor inner-pack. **PO quantities must be divisible by this number — non-divisible entry is rejected.** Blank ⇒ 1. Interacts with `PO From Order Entry`: ordering 3 of a 2-pack generates a PO for 2 units (4 pieces), links 3 to the sales order and puts 1 into stock. The **Purchase conversion** field can "break apart" cartons (carton 4 + conversion 2 ⇒ 6 orderable, 5 not). **A PO line created from a direct-ship sales order ignores this field entirely.** |
| UPC Enabled | checkbox | **Special order products cannot be UPC enabled.** |
| Unique Tracking | checkbox | Requires a UPC scan **and** a serial scan per item. **Cannot be selected while `Prompt for Serial Number in RF Picking` is checked in Bar Code Control Settings.** |
| Vendor UPC Number | text | Used by POS scanning and RF UPC. |
| Alternate UPC Number | text ≤20 alphanumeric, multi-value | Cross-reference for vendors' non-UPC barcodes. Multi via Multiple Barcode Cross Reference Selection Window. **Not printable from STORIS.** |
| Height / Width / Depth | numeric, 8 chars incl. 2 dp | Directed put-away volume. **Required if directed putaway is used.** Units follow the Unit of Measure `Method` (U.S./Metric) on the Miscellaneous tab. |
| Weight | 1–99999 | Put-away max-weight check. Blank ⇒ weight ignored in putaway. |
| Velocity | code FK | Defaults from Default Product Settings for new products. Resolution: **Warehouse Inventory Settings velocity first, then this field.** **A null velocity is treated as the slowest velocity.** |
| Category (storage) | code FK | Restricts placement to storage locations of that category. |
| Maximum / Minimum / Safety Stock | int | **These are only defaults copied into Warehouse Inventory Settings on first receipt at a location — the operative values live there.** **Special order products are never replenished on minimum level: values here are not defaulted and are ignored by Replenish Inventory for Current Back Order Needs.** POS Control Settings `Minimum Quantity` / `Safety Quantity` control whether dipping below raises a sales-order exception. |
| Substitution Method | enum | `No Substitution` \| `Use Comparable Product when Available` \| `Use Comparable Product even if Not Available` \| `Always Substitute`. **On substitution, description, selling price and costs all come from the substitute and sales analysis posts to the substitute.** The system **does not split line items** in the "when available" case. |
| Product (substitute) | code FK | Must already exist. **Substitute products cannot be kit masters.** |
| Auto Fill Days | int ≤999 | **No merchandise is ever reserved when the delivery date is more than 999 days out.** |
| Priority (reservation) | enum | `Use Inventory Control Setting` \| `Ordered Date` \| `Delivery Date`. |
| Date (reservation) | enum | `Use Inventory Control Setting` \| `Delivery Date within Auto Fill Days` \| `Immediate`. **If Priority = Use Inventory Control Setting then Date must also be Use Inventory Control Setting.** Valid combinations: (ICS, ICS); (Ordered Date, Delivery Date within Auto Fill Days); (Delivery Date, Delivery Date within Auto Fill Days); (Ordered Date, Immediate). Also settable at regional level (`PRD-015`) and globally (Inventory Control Settings). Changing it triggers a deferred **ATP recalculation at End of Day** with a Yes/No prompt. |
| Require Reservation | checkbox | On save, scans for open unreserved merchandise lines; if QOH cannot fully reserve them all, errors: **"Not enough quantity is available to fully reserve all existing merchandise lines for this product."** **Enabling it does not retroactively reserve existing orders.** Reassign/unassign then needs the Sales Security permission **"Override Reservation Required"**. **Cannot be enabled for special order products, and is incompatible with `PO From Order Entry`** (which can create backordered lines). **If any soft-kit component with Require Reservation has no available quantity, the entire soft kit cannot be added to a sales order** (soft kits whose components are merely backorderable can still be added). |
| Prep — Code | multi-value code FK → Prep Code Settings (`PRD-037`) | **Unlimited number of prep codes per product.** Auto-applied to sales order, exchange, and service-parts lines. Ellipsis shown when multiple. |
| Prep — Prompt User in POS | checkbox (default off) | Only controls whether the prep-code picker auto-opens; prep codes work either way. |
| Style | text, 7 chars | Free style descriptor, e.g. `CONTEMP`, `TRAD`, `ORIENT`. |
| Collection | multi-value code FK → Collection Settings (`PRD-008`) | **Unlimited collections; the first entered is the "primary collection"** and is what inquiries display. **Writing this field simultaneously updates the Collection file's maintenance records with this product code** (two-way maintenance). |
| Label Type | enum | `Standard - (6.1 x 3.25)` \| `No Label` \| `Accessory - (1.5 x 3.25)`. Default from `Default Product Label Type` in Bar Code Control Settings. |
| Kit Component | checkbox | Sellable **only** as part of a kit. **Overridable per user by the sales-security permission "Sell kit component products separately from their assigned kit".** Does not affect as-is pieces. **A kit-component product cannot be used to build on-the-fly kits via the Group Pricing Screen.** View Product Availability shows "Kit Component Only". |
| Product Status | free text ≤10 | Displayed on View Product Availability and exposed to Enhanced Laser Forms as `product_status`. Pure annotation, e.g. `LIMITED`. |
| Related Inventory Formations | multi-value code FK → `PRD-025`/`PRD-026` | Cross-sell lists offered when the product is added to an order. |
| **Merge History From** | code FK, one-shot process | Merges another product's history into this one. Preconditions: source must be **active status, not linked to a product, same vendor and same product group**. Effects: history is **removed** from the source and added to the target; **source is set to purchase status `T` (Discontinued)**; remaining inventory keeps the original product code but its transactions record into the new product's history. **IRREVERSIBLE: "Merge from history cannot be retrieved from the Merge from Product once the process is complete."** **The source's costing tables are NOT merged.** |
| Limit Use By Region | multi-value region codes | Compares against the user's log-on region; no match ⇒ **the user cannot access the product at all**. **Inert unless `Restrict Product Use/Lookup by Region` is checked in General System Control Settings** (another global kill-switch, cf. Extended Security). |

**Fields — Miscellaneous page**

| Field | Type | Purpose / business rule |
|---|---|---|
| Unit of Measure — Method | enum | `U.S.` \| `Metric`. **Governs the interpretation of every dimension/weight field on the record** (Settings putaway block, eBridge and eSTORIS dimension blocks). |
| Unit of Measure — Purchasing / Piece / Selling | code FK → Unit of Measure Settings | Three separate UoMs. Each must already exist in Unit of Measure Settings. **All three default to `EA`.** `Piece` describes the sub-unit a selling unit can be broken into. |
| Conversion — Unit | int, default 1 | Fractional selling. **Available only when creating a new product AND Product Type = Non-Inventory.** Value = denominator: 2 = halves, 3 = thirds, 8 = eighths. Order-entry quantity syntax is `N:NN` — whole units, colon, fraction numerator (2½ with conversion 2 ⇒ `2:1`; 10⅜ with conversion 8 ⇒ `10:3`). Labor convention: conversion `60` ⇒ `1:00` is one hour, `:30` is half an hour, `1:30` is 1½ hours. **Excel/PRV export converts `N:NN` to decimal `N.NNN` (10:3 ⇒ 10.375).** |
| Conversion — Purchase | int | Same fractional scheme for purchasing (fabric by the ¼ yard, chairs sold in 4s). **Editable only when on-hand = 0, on-PO = 0, and all invoices for the product are paid.** |
| Shipping Weight | 3.2 lbs | For delivery charges by the pound. |
| Shipping Volume | numeric | Used for receiving volume from vendors and delivery volume to customers; may be true cubic volume or an arbitrary unit ("3" for a three-cushion sofa). **Changing it prompts that increased volume may push routes over capacity: Yes updates route calendars for all orders containing the product; No updates only the product record and leaves open orders and route calendars at the old volume.** New products with WMS active default this from the Product Group. |
| Delivery Volume | numeric | Same prompt/behaviour; visible in Route Capacity Settings. STORIS recommends one consistent unit of measure across all products. |
| Method (delivery) | enum | `Non-Parcel` \| `Parcel` \| `Either`. With `Either`, the line follows the other lines on the order; if it is the only line or all lines are `Either`, the route code's freight company is used. |
| Assembly Required | checkbox | Edits appear in **Review Settings Activity**. Used by AWM. |
| Unload Time (Minutes) | int | Per-unit unload/delivery time. |
| Inspection Required | checkbox | Prioritises picking; exported to Data Warehouse and on the conversion spreadsheet; used by AWM. |
| Include in Cross Dock | checkbox (default off) | Prints cross-dock labels and makes piece assignment prefer cross-dock locations. Exported to Data Warehouse. |
| Handling Methods — Sale / Return / Exchange / Transfer | code FK → Fulfillment Handling Method Settings | 3PL handling instructions. A method missing from Fulfillment Handling Method Assignment for the order type **warns but does not block**. **The 215 EDI document sends the handling method as it is *now*, not as it was when the product was added to the order.** |
| Non-Inventory Product Linkage — Usage None | multi-value product FK | Links non-inventory products (fees, services) that are **auto-added as extra order lines** on sales, exchanges and fast cash. Linked products must be Non-Inventory; the host product must be Product Type `Inventory`, `Bulk Product`, or `Special Order`. |
| — Usage Installation / Installation Real-Property Formations | inventory-formation FK | Adding the product to a sales order **pops a required selection** of one installation non-inventory product from the formation. |
| — Usage State Recycle Fee | multi-value product FK | Auto-adds the recycle-fee lines. |
| Warranty — Link to Inventory | enum incl. `None` | `None` ⇒ no linkage possible for this product. |
| Warranty — Extended Code | code FK → Warranty Settings | Non-inventory extended-warranty products only. **The referenced warranty record must have Warranty Type = `Extended`.** |
| Warranty — Extended Category | code FK → Warranty Category | Non-Inventory product type only. **Must be defined for the product to be linkable.** |
| Warranty — Extended Categories | multi-value | Inventory products only: which extended/special-coverage warranty categories may be sold against this item. **If none are selected, warranty products cannot be linked.** Drives the salesperson's warranty picker. **The Group record's `Warranty Categories` field populates this for special-order, built-on-the-fly products.** |
| Warranty — Factory Code | code FK | **Referenced record must have Warranty Type = `Factory`.** Active only when Product Type = `Inventory`. Factory warranties can also be associated by vendor. |
| Distribution Status — Current / New Status Date / New Status | code + date | **Only for Inventory Type `Retail Inventory`, `Retail Part`, `Retail Labor`.** Used by multi-legged transfers; determines default stocking location and whether the product can be entered/reserved on a sales order, exchange or transfer. **Resolution order: Warehouse Inventory Settings → District/Regional Product Settings → Advanced Product Settings.** The Scheduled Settings Update process applies New Status on the date and **nulls both New fields**. New Status Date must be > system date. |
| Product Earns Reward Points | checkbox (default on) | Customer Rewards eligibility. |
| Promotional Points Factor | enum + value | `No reward` \| `Amount` (flat points per unit) \| `Percent` (points = % of selling price). |
| Color / Size | text | Appear on printed export documents. Color is overwritten by the Ashley Catalog Load import. |
| Fabric | text ≤20 alphanumeric | |
| Direct Ship | enum | `Allowed` (default for all but non-inventory) \| `Not Allowed` (default for non-inventory, **and cannot be changed for them**) \| `Required`. Read by Enter a Sales Order and by Parts on In-Home service orders. **`Allow on Sales Orders` / `Allow on Layaways` / `Allow on Quotes` in POS Control Settings take precedence** — if `Allow on Quotes` is off, quote lines cannot direct-ship even when set to Required. On quotes/layaways (which cannot be split-ticket) a `Not Allowed` or `Required` mismatch with the order's Order Type **blocks the product with a message**. In NextGen, `Required` products can still be added to the cart and are auto-assigned to a direct-ship fulfillment. Prints "Direct Ship" text/image on ELP Hangtag, Hangtag As-Is, Hangtag Kit, Hangtag As-Is Kit, Inventory Barcode, and the floor-tag prints — **kit master portion only, not components**. |
| Direct Ship — Default | checkbox | Only meaningful when Direct Ship = `Allowed`. Unchecked ⇒ the line follows the previous line, or the order. |
| **Screen Image Display** | enum | `Image` \| `URL` \| `Use Inventory Control Settings` (**default**). `Image` falls back to URL when no image exists, and vice versa. **Product-level setting has priority over the same-named setting in Inventory Control Settings.** |
| **Forms and Labels Image Display** | enum | Same three values and same precedence, for ELP forms/labels. **The form or label must carry the tags `product_image` and `product_image_url` for substitution to work.** No image and no URL ⇒ the camera is inactive and ELP prints no image. |
| User Product Code | free text | **Only used by the Query Wizard report builder** (Product Query Wizard select/sort). |
| Related Parts | multi-value product FK | **Not available for kit masters or non-inventory items. Only products with Inventory Type `Retail Part` or `Service Part Only` are eligible.** Deleting a product removes it from every Related Parts list referencing it. |
| Comments | free text ≤30 | ELP data tag `product_misc_comments` (Design Label Form, Hangtag As Is Kit). |
| Membership Program | checkbox (default off) | **Product must be non-inventory and must not be a special order product.** If checked, Membership Terms is required. |
| Membership Terms | int 1–99 months | Required when Membership Program is checked. |
| **Image URL** | multi-value URL | Alternative to importing images. Consumers: the camera icon inside SCiX (**only the first URL is referenced**), eSTORIS (the URL is sent rather than a replicated asset), and CXM. May point at an image-resizing service rather than a static file. |

**eBridge page.** `Web Description` (≤50 chars, translatable), `Web Category` (**required for a product to
be available on the web**), `Additional Web Categories`, `Minimum Web Stock Available Quantity` (threshold
that fires the product's "low stock activity" action; reversed on restock when `Allow Automatic Product
Re-Publish` is on), `Available on Web`, `Direct Ship from Web` (**mixing direct-ship and non-direct-ship
lines creates a split-ticket order**), `Suppress Add to Cart` (legacy eSTORIS only), `Height/Width/Depth`
(9 chars), `Web Benefits` (use literal `<br>` for line breaks), `Company Special`. **Fields shared between
eBridge, eBridge SEO and eSTORIS pages are the same underlying field — editing one updates the others.**

**eBridge SEO page.** `Keywords` (comma-separated, unlimited), `Meta Description`, `Title Tag`,
`Image Alt Tag`, `SEO URL` — **each SEO URL must be globally unique across STORIS files** (a Product SEO URL
blocks a Web Category from using the same string).

**Interfaces page.** `Bassett Product Class` (only valid value `NSOU` = Non-Special Order Upholstery, which
lets Special-Ordered-flagged products be EDI-ordered from Bassett); `Warehouse Management System Group`
(**required for all products except non-inventory when the WMS interface is active**); `Ashley Quantity
Buffer` (0–99, **overrides** the buffer in Ashley Interface Settings, `PRD-002`); `La-Z-Boy EDI Transmission
Information` action → `PRD-028`.

**User Defined Settings page.** Grid of `Setting` / `Response` / `Select`. Prompts come from **User Defined
Settings** (a Control-Settings-side screen). **"Entries on this screen are for information only; no
processing occurs based on this information."** The page is active only when more than one user-defined
setting record exists and at least one has no associated inventory formation; with a single formation-bound
record, the product must already exist for the page to activate.

**eSTORIS page.** `Available on Web`, `eSTORIS Published Status` (display-only: "Published on eSTORIS" /
"Not published on eSTORIS"), `Direct Ship` + `Direct Ship Quantity` (**mutually required — either both or
neither**; quantity ≥ 0, loaded into the specialised eSTORIS direct-ship warehouse named in eSTORIS Control
Settings), `Web Description` (warranty description; **synced to eSTORIS where it cannot be edited**; for
updates it does **not** override an existing eSTORIS description), `Minimum Web Stock Available Quantity`
(**here it means: below this, the product is hidden on eSTORIS** — note this is a *different* rule from the
same-named eBridge field), `Web Store` (multi-location restriction; blank = all web stores),
`Web Related Inventory Formations`, `Stocked in Vendor Warehouse`, `Height/Width/Depth`, and in 10.8 an
`Icovia Information` block (`Include in Room Builder`, `Icon ID`) that is **absent in 11.0**.

**API page.** `Available on Web`, `Direct Ship from Web`, `Web Related Inventory Formations`,
`Alternate Product ID` (≤50 chars, for the eBridge Commerce API, **not validated**, null by default),
`Height/Width/Depth`.

**Reconciliation against the Inventory pack**

- **`ITEM-010` CONFIRMED, verbatim.** "All products must be associated with a group, and all groups must
  fall within a product category." Enforcement extends further than we specified: **an inactive group, or a
  group under an inactive category, cannot be selected at all**. What lives at each tier is established
  here and in `PRD-007`/`PRD-022`.
- **`ITEM-010` EXTENDED — cascade is copy-down at creation, not live inheritance.** Our pack says group and
  category settings "cascade down as defaults but are overridable… Do not copy-down at creation time."
  STORIS actually copies down at creation in the cases it documents (Group `Warranty Categories` → product
  `Extended Categories` for on-the-fly special orders; Group shipping volume → product Shipping Volume when
  WMS is active; Default Product Settings → new product), and it explicitly notes **"If you change the
  product group for a product and the product appears on existing orders, the orders do not update."** We
  are deliberately doing this differently (live inheritance); keep `ITEM-010`'s wording and note STORIS's
  divergence.
- **`ITEM-045` CONFIRMED and refined.** Product-scope pricing here is: Selling Price, Suggested Retail, Kit
  Selling Price, Markdown Price, Price Code, Promotion Code/Price/Start/End, promo Commission %, promo Spiff.
  Note that our pack listed "sale price / sale start / sale end" — in the reference screens these are the
  **Promotion** fields, and there is an additional **Markdown Price + markdown date** pair that our model
  does not have and that is **status-gated (M/D/T only)**. Add markdown to the product-scope price model.
- **`ITEM-040` PARTIALLY CONFIRMED.** The screen confirms the hierarchy exists and that the product Selling
  Price is only the last resort ("the price you enter at this field may not actually default into sales
  order line items"), and that district settings sit above it. The full seven-step ordering is documented in
  the linked "Pricing Rules" article, not here. **`ITEM-042` CONFIRMED with the missing half of the key:
  the product side of the price matrix is the `Price Code` field, which holds a Price Category code from
  Customer Price Settings and is matched against the customer's `Price Category`.** Reuse `ITEM-042`; add
  `Price Code` as the product attribute name.
- **`ITEM-030` EXTENDED.** Our pack covers special-order → regular. The reverse (regular → special order) has
  its **own** preconditions documented here: QOH = 0, no open POs, and **not a kit component with
  `Use Package Price` enabled**, plus **a product in a product family can never become special order**.
  Add these as `ITEM-030b`.
- **`ITEM-050` CONFIRMED.** Product Benefits is an action on the General page; **editing it queues a floor
  tag** when `Create Floor Sample Label Queue on Product Change` is on in Warehouse/Store Location Settings
  (along with Description, Second Description, Selling Price and Suggested Retail). Our pack does not have
  that side effect — add it.
- **`ITEM-060` PARTIALLY CONTRADICTED.** Our pack says CFI is "structured, four fields: Frame, Color, Grade,
  Upholstery." The reference screen does **not** show a four-field CFI block on the product; what it has is
  `Maintain PO Line Text` on the Costing page ("comments entered here appear in the Enter Special Order
  Options window") plus the **Enter Special Order Options** action on the General page, and separate
  `Color`, `Size`, `Fabric` free-text fields on Miscellaneous. The Frame/Color/Grade/Upholstery structure is
  the **special-order option/configurator model** (`PRD-003`, `PRD-005`, `PRD-016`, `PRD-020`, `PRD-033`–
  `PRD-036`, and positions 63–67), not a fixed four-column CFI record. **Flagging this: `ITEM-060` should be
  rewritten as "special-order option types are user-defined code tables, of which Frame/Color/Grade/
  Upholstery are the conventional four", not as four hard-coded fields.** The PO-line-text half of
  `ITEM-060` is confirmed exactly.
- **`ITEM-070`/`ITEM-071` CONFIRMED and sharpened.** `CFG-PROD-IMAGEMODE` is real but is **two settings, not
  one**: `Screen Image Display` and `Forms and Labels Image Display`, each `Image | URL | Use Inventory
  Control Settings`, defaulting to the global. **Product-level overrides the Inventory Control Settings
  global.** Each mode **falls back to the other** when its own source is empty — so this is a preference
  order, not an exclusive switch. Image URL is **multi-value** but SCiX only ever shows the first.
- **`COST-030` CONFIRMED and EXTENDED.** Landed Freight Factor is `Percent | Dollar`; but the four Add-On
  factors accept a **third type, `Calculation`** (used for the tariff plug-in). Our `factor_type` enum must
  be `PERCENT | AMOUNT | CALCULATION`. Also: **the four add-on slots are user-labelled in Costing Control
  Settings** — they are named columns, so our model needs named add-on definitions rather than fixed ones.
  The Percent option is gated by `LANDED FREIGHT - Active` in Costing Control Settings.
- **`COST-032` CONFIRMED** — factors are on the product record's Cost tab, exactly as stated. **New scope
  discovered below both: `Vendor Ship From`.** Both the Freight and the Add-On action buttons open **Vendor
  Ship From Landed Freight and Addon Cost Settings**, and Replacement Cost has a parallel **Vendor Ship From
  Replacement Cost Settings**. So the real precedence chain is *vendor → vendor ship-from → product*, not
  vendor → product. Add `VENDOR_SHIP_FROM` to the settings-resolver scope list alongside `VENDOR_REMIT_TO`
  and `VENDOR_REGION`.
- **Wave-1 irreversibility claim — PARTIALLY CONTRADICTED.** Serial tracking here is **guarded, not
  irreversible**: "If this product is on an open purchase order or sales order and you attempt to edit this
  field, an error message appears and the system rejects your change" — implying it *can* be turned off when
  the product is unencumbered. The truly irreversible product-level settings on this screen are listed
  below. Recommend re-checking the wave-1 source for `CFG-INV-LOCTRACK`/serial before we treat serial as
  one-way.

**Irreversible / one-way settings found on this screen** (flagging per the wave-1 instruction)

1. **Product ID** — permanent once created; delete-and-recreate is the only change path.
2. **Inventory Type** — cannot be changed after the first save, full stop.
3. **Boxes per Product** — once > 1, can never return to 1 (and cannot be reduced to 1 with stock on hand).
4. **Merge History From** — one-way; source history is destroyed, source is forced to status `T`.
5. **Creation Date** — write-once, not editable by hand or by conversion spreadsheet.
6. Effectively one-way while stock exists: **Average Cost** (locked once QOH exists) and **Purchase
   Conversion** (only editable at zero on-hand, zero on-PO, all invoices paid).

**Dependencies.** Inventory Control Settings (`Next Product Number`, `Format`/Dynamic Identifier, Kardex
tracking flags, Display Images defaults, reservation defaults, `Report Sort By`); Costing Control Settings
(`LANDED FREIGHT - Active`, add-on field names/types, `Commission Add on %`, `Salesperson Commissions`);
Point of Sale Control Settings (discount options, `Calculation Code`/Method, `Minimum Quantity`,
`Safety Quantity`, `Allow on Sales Orders/Layaways/Quotes`, price-variance fallback); General System Control
Settings (`Restrict Product Use/Lookup by Region`, multi-value indicator); Purchasing Control Settings
(`Include Orderable Products`, `Activate Buying Group`); Bar Code Control Settings (`Default Product Label
Type`, `Prompt for Serial Number in RF Picking`); Warehouse/Store Location Settings (`Create Floor Sample
Label Queue on Product Change`, price-variance level); Warehouse Inventory Settings (min/max/safety,
velocity, distribution status, location selling price); District and Regional Product Settings (`PRD-015`);
Default Product Settings (`PRD-013`); Group/Category (`PRD-022`, `PRD-007`); Brand (`PRD-006`); Collection
(`PRD-008`); Prep Code (`PRD-037`); Inventory Formations (`PRD-025`, `PRD-026`); Discount Costing Table
(`PRD-014`); Tariff Settings, Tax Class Settings, Purchase Status Settings, Unit of Measure Settings,
Warranty Settings, Sales Discount Settings, Fulfillment Handling Method Settings, Product Kit Settings,
Schedule a Process (`Scheduled Settings Update`). Security: Extended Security (Purchasing) `Update Product
Replacement Cost Within Purchase Entry Screens`; Extended Security (Payables) `Change Product Replacement
Cost During Vendor Invoice Entry`; Extended Security `Dropped Purchase Status with Open POS Quantity`,
`Discontinued Purchase Status with Open POS Quantity`; Sales Security `Sell kit component products
separately from their assigned kit`, `Override Reservation Required`; Logistics Security `Override Complete
Carton Requirements` — see `parts/user-security-CATALOG.md`. **Remember Extended Security is a single global
kill-switch: all of those permissions are inert unless it is on.**

**Audit.** This screen **does** feed an audit surface: "Use the **Product** source in **Review Settings
Activity** to see historical changes made to products' settings", and `Assembly Required` explicitly says
"Edits made to this field appear in the Review Settings Activity routine". This is a narrow exception to the
wave-1 finding that STORIS has no general change-audit log — it is a *settings*-activity log scoped by
source. Product changes must feed our `RPT-AUDIT`; at minimum price, cost, group, status, and every
irreversible field above.

**Build notes.**
- Model the product as one aggregate with explicit *scope-aware* price and cost children, per `ITEM-045`,
  extended with a `MARKDOWN` price kind and a `PROMOTION` kind carrying code/start/end/commission/spiff.
- Implement `Price Code` on the product and keep it as the sole product-side key into the price matrix.
- Do **not** copy STORIS's "Inventory Type is permanent" design. Make type changes a **privileged, audited
  migration** with the same preconditions STORIS uses for delete-and-recreate (QOH = 0, no open documents),
  rather than forcing users into delete/recreate which destroys history. Same for `Boxes per Product`.
- `Merge History From` is worth having, but ours must be **reversible for N days** (soft-merge with a
  restore window) and must merge or at least archive costing tables, which STORIS drops on the floor.
- Blank ≠ zero on `Lead Days` (blank = inherit). Make that distinction explicit in the schema (nullable int
  + a resolver), and apply the same pattern everywhere STORIS uses blank-means-inherit.
- The four add-on cost slots must be **named, configurable add-on definitions**, not `addon1..addon4`.
- The three-way UoM (purchasing / piece / selling) plus two conversion factors (unit, purchase) is genuinely
  needed for a mattress retailer selling by the piece and buying by the carton. Keep the model; **replace
  the `N:NN` quantity syntax with a real decimal quantity** — the colon notation is a 1980s artifact and the
  article itself documents that exports silently convert it to decimals.
- Reservation configuration is a **three-level resolver** (product → district/region → global) producing
  one of four valid (priority, date) pairs. Implement the pair as a single enum, not two independent fields,
  so the "if ICS then ICS" constraint is unrepresentable-by-construction.
- `[DECISION NEEDED]` — do we implement **Require Reservation**? It is powerful (guarantees no oversell) but
  incompatible with PO-from-order-entry and with special orders, and it blocks soft kits wholesale.
- `[DECISION NEEDED]` — do we keep **two** image-mode settings (screen vs forms/labels) or collapse to one?
- `[DECISION NEEDED]` — **Trailing credits / vendor rebates**: STORIS supports up to two dated trailing
  credits per product that reduce written cost and post a GL entry without touching inventory cost. Confirm
  with the controller whether LA Mattress receives vendor rebates in this form.
- `[DECISION NEEDED]` — the **User Defined Settings** page is informational only ("no processing occurs").
  Our product attributes must instead be *typed and queryable*. Decide whether we support free-text UDFs at
  all or force everything into typed Product Attributes (`PRD-042`/`PRD-043`).

---
### `PRD-002` Ashley Interface Settings
*storis_ref: article 15294470774036*

**Purpose.** Configuration for the Ashley Furniture ATP (available-to-promise) web service and the Ashley
replenishment (AFI) feed. Vendor-specific integration, not a general product setting — included here only
because the product record carries an `Ashley Quantity Buffer` override.

**Where it lives.** Tabs: **General**, **Location & Vendor**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| WSDL URI / Action URI / Namespace URI / Service Method | text | Web-service endpoint definition. |
| Timeout Seconds | int | Connection timeout. |
| Quantity Buffer | int 0–99 | **Added to the requested quantity before asking Ashley for an ATP date**, so the date returned is the first date `buffer + requested` is available. Lower buffer ⇒ earlier (riskier) date. Overridden per product by `Ashley Quantity Buffer` in `PRD-001`. |
| Availability Days | int 0–999 | Max days out the service may return availability for. |
| Use Transit Time From Service | checkbox | Checked ⇒ use the service's transit time; blank ⇒ use the vendor's `In Transit Days`. |
| Use Standard Lead Time if Error | checkbox | On timeout/auth failure/unavailable stock: checked ⇒ fall back to standard lead time; blank ⇒ **no lead time returned at all**. |
| Override Ashley ATP Date if Purchase Order Date is Greater | checkbox (default off) | **When on, an existing PO with a later date extends the ATP date to that PO's date so the PO can be used as the merchandise source**; the ATP calculation then includes all sources dated on or before the extended date. No PO ⇒ Ashley's date is used. |
| Replenishment Elapsed Minutes | int 0–999 | Max staleness between the AFI data-set timestamp and processing of the purchasing advice. **If exceeded — or if the value is not specified at all — the purchasing advice is NOT processed.** (Blank means "never process", not "no limit".) |
| XML Path | path | Directory for the replenishment XML; must be visible to the STORIS transactional server. |
| Messenger Users — Success Alerts / Exception Alerts | user or mail-group code | Blank ⇒ no message sent. |
| Location & Vendor grid | Location, Vendor, External ID, Key Code, User ID, Password, Account ID, Ship-to ID, Entity ID, Pad Days | **Must be established for every location × vendor combination Ashley ships to.** Location and Vendor stay editable until both are specified. |
| Pad Days | int 0–999, default 2 | Days added to the ATP date after a sales order is created, used to calculate the PO requested date under Replenish Inventory for Current Back Order Needs. **Default 2 exists specifically to stop merchandise being promised same-day or next-day.** `0` enables same-day fulfilment. |
| Replenishment | checkbox | Requires the **Replenishment - External Ashley** licensed module. |
| ATP Web Service | checkbox | Requires the **ATP - External Ashley** licensed module. |

**Behavior & rules.** Actions `Test AFI First Available Date` (requested qty 1, plus whichever buffer is
set — product-level buffer or the General-tab buffer; if both blank, qty stays 1) and `Test AFI Detailed
Availability` (no quantity). **Both test actions work whether or not `ATP Web Service` is checked**, so
configuration can be validated before go-live. Results appear in View Web Service Results.

**Dependencies.** `PRD-001` (`Ashley Quantity Buffer`), Vendor Settings (`In Transit Days`),
Warehouse/Store Location Settings, STORIS Messenger, Replenish Inventory for Current Back Order Needs.
Passwords are stored in a grid column here — **note for `SEC-*`: this screen displays vendor-portal
credentials in a grid; our equivalent must store them in a secret store and never render them.**

**Build notes.** Not applicable to LA Mattress unless we integrate an Ashley-style vendor ATP service. The
transferable ideas are: (a) a per-vendor **availability buffer with a per-product override**, (b) **pad days**
so an ATP date is never promised same-day, and (c) an explicit **stale-data guard** on inbound replenishment
feeds. `[DECISION NEEDED]` — do we need a vendor ATP web-service abstraction at all, or is vendor
availability handled by flat-file import?

---
### `PRD-003` Assign Options
*storis_ref: article 15294468994324*

**Purpose.** (Article is near-stub — three sentences.) A picker used to attach existing special-order
options to a special-order template, or create a new one, for a given vendor and option type.

**Where it lives.** `Special Order Template Settings > Assign Options` button.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Template | display-only | The current special order template. |
| Option Type Code | display-only | The current special order option type code. |
| Grid | checkbox list | Populated with the special-order options available **for the current vendor and that option type**, with previously selected options pre-checked. |

**Behavior & rules.** Options are scoped by **vendor × option type**. Nothing else is documented.

**Dependencies.** Special Order Template Settings (position 67), Special Order Option Settings (65),
Special Order Option Type Settings (66) — all in `product-settings-b`.

**Build notes.** Relevant to `ITEM-060`: this is the machinery that actually produces
Frame/Color/Grade/Upholstery-style attributes on a special order. Confirms those are **user-defined option
types per vendor**, not fixed columns.

---
### `PRD-004` BAI Code Settings
*storis_ref: article 15294470781460*

**Purpose.** Bank-reconciliation support table mapping three-digit BAI (Banking Administration Institute)
transaction codes to descriptions and to STORIS transaction types. **This article is mis-filed — it is an
Accounting/bank-reconciliation code table with no product relationship whatsoever.**

**Where it lives.** `Accounting > Payables > Reconcile Bank Transactions > Settings > BAI Code settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (BAI code) | 3 digits | **Delivered with STORIS; you cannot add or change the codes.** |
| Description | text | Default description shown, overridable. |
| Auto Reconcile to Transaction Type | code FK | Used **only** by the Automatic Reconciliation process. If the bank record's BAI code maps to the matching transaction type, the transaction auto-reconciles; **otherwise an error is written to the Report Reconciliation Errors routine** (it does not silently skip). |

**Dependencies.** Reconcile Bank Transactions, Report Reconciliation Errors.

**Build notes.** Out of scope for the product model. Record it so the coverage matrix is honest, and hand it
to whoever owns bank reconciliation. The one reusable pattern: **a read-only, vendor-delivered code table
that users may annotate but not extend** — we need that concept (e.g. for tax jurisdiction codes).

---
### `PRD-005` Base/Grade Configuration
*storis_ref: article 15294470263060*

**Purpose.** Price/cost table for the Product Configurator: for a given **vendor + base frame model**, the
selling price and cost of each **fabric grade**. This is how a configured upholstery item gets priced.

**Where it lives.** `… > Product Information Settings > Product Configurator Settings > Base/Grade
Configuration` (plus Buyer/Merchandiser Tools and Customer paths).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code FK | The vendor whose base/fabric pricing this is. |
| Vendor Model | code | **The base frame's vendor model code** — the key is (vendor, vendor model, fabric grade), *not* the STORIS product code. |
| Fabric Grade | code FK → Grade Description Configuration (`PRD-020`) | |
| Regular Selling Price, Regular Cost | money | The price/cost for this frame at this grade. |
| Sale Starting Date, Sale Ending Date, Sale Selling Price | date/date/money | **Dated sale price**, independent of the product-level promotion. |
| Cost Sale Starting Date, Cost Sale Ending Date, Sale Cost | date/date/money | **Dated sale *cost*** — a separate window from the sale price window. |

**Behavior & rules.** With Regional Processing active, the **District Pricing** action lets you set regular
and sale pricing **by district** at this same (vendor, model, grade) key.

**Dependencies.** Product Configurator (`PRD-010`–`PRD-012`, `PRD-033`–`PRD-036`, positions 47–48, 60–62),
Grade Description Configuration (`PRD-020`), Fabric Configuration (`PRD-016`), District/Regional pricing.

**Reconciliation.** **Extends `ITEM-040`/`ITEM-045` significantly.** There is an entire pricing axis our
Inventory pack does not model: a configured product's price is not the product's selling price at all — it
is looked up from a (vendor, base model, fabric grade) matrix, with its own regular/sale windows and its own
district scope. **Also note the separate *cost* sale window — dated cost, which `COST-*` does not have.**

**Build notes.** If LA Mattress sells any made-to-order upholstery, this table is required and the price
resolver needs a configurator branch *ahead of* the `ITEM-040` chain. `[DECISION NEEDED]` — does LA Mattress
do grade-based configured pricing at all? If not, mark the whole configurator cluster (`PRD-003`, `-005`,
`-010`, `-011`, `-012`, `-016`, `-017`, `-020`, `-033`–`-036`) intentionally-not-implemented in one block.

---
### `PRD-006` Brand Settings
*storis_ref: article 15294470776852*

**Purpose.** The brand code table. Brand is a **required** field on the product record and is the
merchandising-facing alternative to printing the vendor name.

**Where it lives.** `System Administration > System Settings > Merchandising and Distribution System
Settings > Inventory Hierarchy Settings > Product Information Settings > Brand Settings`, also under
`Get Started Step 9 - Merchandise`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Brand Name | up to 20 chars | The code/name. |
| Description | text | Full manufacturer name. |
| Web Description | text | Shown on the eSTORIS Product Detail page (bottom of the left block). Maintainable here **or** on eSTORIS's Brand Maintenance page. |
| Available on Web | checkbox | Puts the brand in the eSTORIS Product Search brand filter. |
| Show Web Price | checkbox | Displays price on product detail for this brand's products. **Note the trap: "you cannot check out with items in your cart that do not have a price"** — hiding price by brand makes those items un-purchasable online. |
| Retail Deck Manufacturer | multi-value, ≤50 chars each | Maps RetailDeck manufacturer strings to this brand. **Must be globally unique — if the code already exists on another Brand record an error is raised.** During RetailDeck auto product create, a match assigns this brand; no match assigns the default brand from Retail Deck Control Settings. |

**Behavior & rules.** **Brands can be auto-created from vendors, two ways:** (1) if `On-the-Fly Maintenance`
is checked in General System Control Settings, saving a new vendor prompts "create a new brand with the same
code as the vendor?"; (2) if the vendor's Payables-tab `Class` = `INV`, saving **automatically** creates a
brand whose code matches the vendor code, with no prompt. Actions: `Web Benefits`, `Translation`.

**Dependencies.** `PRD-001` (Brand field — required), Vendor Settings, General System Control Settings
(`On-the-Fly Maintenance`), Retail Deck Control Settings, eSTORIS.

**Build notes.** Keep brand as a first-class dimension (reports sort by it; floor tags print it instead of
vendor). **Do not replicate the silent auto-create on `Class = INV`** — an unprompted side effect that
creates master data is exactly the kind of thing that leaves an ERP with 900 junk brands. If we auto-suggest
a brand from a vendor, prompt, and log it to `RPT-AUDIT`.

---
### `PRD-007` Category Settings
*storis_ref: article 15294470775956*

**Purpose.** The **top tier** of the inventory hierarchy. Carries GL account mapping, gross-profit floors,
replenishment routing, twilight (as-is markdown) pricing, and rounding rules for the whole category.

**Where it lives.** `System Administration > System Settings > Merchandising and Distribution System
Settings > Inventory Hierarchy Settings > Category Settings`; also under Accounting > … > General Ledger
Settings, and `Get Started Step 9 - Merchandise`. Tabs: **General, Twilight Pricing, User Defined Settings**.

**The hierarchy, stated by STORIS.** "Within the STORIS Inventory Management feature is the following
three-tiered hierarchy structure: **product categories → product groups → products**. Prior to creating your
product records, you must create your product groups. And prior to creating your product groups, you must
create your product categories." **Typical STORIS users have 12–25 product categories; the number of product
groups is unlimited.**

**Fields — General**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product Category | alphanumeric code | |
| Description | text | |
| Active | checkbox, defaults **checked** on create | **Cascading deactivation: unchecking the category makes every group under it inactive *even if the individual group is marked active*, and no group under an inactive category can be assigned to a product.** |
| Inventory Family | free-text user-defined | A grouping *above* category for sales-analysis reporting only. **"An inventory family is a user-defined criteria and does not require a specific file to be built"** — i.e. it is a free string, not a validated FK. Example: categories TV/STEREO/DVD/VCR → family `HOME ENT`. |
| Non-Inventory | checkbox | Marks the category as holding non-inventory products (warranties, fabric protection). |
| Action Required | checkbox | **Active only for non-inventory categories.** Says the warranty products in this category require a delivery-time action (e.g. apply fabric protection). Sent to the WMS interface. |
| Inventory / Sales / Cost of Sales / Inventory Adjustment (GL) | GL account | Optional. Blank ⇒ fall back to the corresponding default in General Ledger Assigned Account Settings (`Inventory Value`, `Sales`, `Inventory COS`, `Inventory Adjustment`). Action button opens the TPA GL Account Entry screen. |
| Line Discount / Line Discount Recovery (GL) | GL account | Validated in the order given by `Post Line Discounts to General Ledger` on the Advanced tab of Point of Sale Control Settings. |
| Special Order Zero Cost Retail | percent | Approximates cost for **zero-cost special-ordered products** as a percentage of selling price, for gross-profit reporting. **Resolution hierarchy: Group Settings → Category Settings → Special Order Control Settings, first non-null wins. `0` is a valid value and stops the search; only NULL falls through.** The derived cost is **not written to the purchase order**; it feeds `Report Written Sales Dollars` and `Report Written Sales by Salesperson`. **Overridden entirely when `Use Replacement Cost as Default` is checked on the Miscellaneous tab of Purchasing Control Settings** — then replacement cost is used instead. |
| Minimum Gross Profit % | percent | Category-level floor for edited selling prices during order entry; raises an exception per the check level. Resolved through a hierarchy with the product-level and (per `PRD-022`) group-level values. |
| Repossession Depreciations | percent | Depreciation rate for repossessed items in this category. |
| First … Fifth Warehouse | location FK ×5 | Auto Stock Replenishment source warehouses, checked in order 1→5. **`First Warehouse` is mandatory when Auto Stock Replenishment is used.** Each must be `Location Type = warehouse` in Warehouse/Store Location Settings. |
| Target Location(s) | multi location FK | Destinations. **Inaccessible until a primary replenishment warehouse is set. A target may not also be one of the source warehouses.** **At category level you cannot define different replenishment sources for store vs warehouse targets — the same 5 sources serve all targets.** |
| | | **Group-level replenishment overrides category-level entirely** — category routing applies to all its products *except* those in a group that has its own replenishment locations. |

**Fields — Twilight Pricing** (**As-Is inventory only**; an automatic age-based markdown ladder)

| Field | Type | Purpose / business rule |
|---|---|---|
| Period Measurement | enum | `Months` \| `Days`. |
| Reduction Period | int | Elapsed time before a reduction applies. **"if you set your reduction period to 30 days, the system applies twilight discount pricing every 31st day until the item is sold"** — it repeats, it is not one-shot. |
| Reduction Percent | percent | Applied to the item's **As-Is starting price** (not the current price) each time a period expires. |
| | | **Twilight pricing set at Group level overrides these category settings.** |

**Fields — Round To Settings**

| Field | Type | Purpose / business rule |
|---|---|---|
| Line Discount Rounding Method | enum | `None` \| `Up` \| `Down` \| `Nearest`. |
| Round To | enum | `None` \| `Penny` \| `Dime` \| `Dollar` \| `Ten` \| `Hundred` \| `Thousand`. **Mutually exclusive with `End In` — using one greys out the other.** |
| End In | money | Charm-price target. Example from the article: `End In = 4.99` + `Up` turns a computed $24.31 into **$24.99**; `End In = .99` + `Down`/`Nearest` turns $24.31 into **$23.99**. |

**Fields — User Defined Settings.** Same informational-only grid as `PRD-001` (`Setting` / `Response` /
`Select`); **"Entries on this screen are for information only; no processing occurs."**

**Behavior & rules.** Right-click menu `View Product Category Details`, editable via Dynamic Escape Settings.
Action: `Line Item Text`.

**Reconciliation.** **`ITEM-010` CONFIRMED — the three-tier hierarchy and the mandatory setup order are
stated verbatim by STORIS.** **`ITEM-011` CONFIRMED and EXTENDED**: our pack expected group-level GL mapping,
replenishment policy, return-days and commission treatment. The reference screens put **GL mapping,
replenishment routing, minimum gross profit, zero-cost-retail %, repossession depreciation, twilight pricing
and discount rounding at *category* level as well as group level**, with **group overriding category**.
Update `ITEM-011` to name both tiers and to record that the resolution rule is *first non-null, most
specific wins*, with the important carve-out that **`0` counts as a value and stops the search** (only NULL
inherits).

**Dependencies.** `PRD-022` Group Settings (overrides most of this), `PRD-001` (product overrides group),
General Ledger Assigned Account Settings, Point of Sale Control Settings (`Post Line Discounts to General
Ledger`), Purchasing Control Settings (`Use Replacement Cost as Default`), Special Order Control Settings,
Warehouse/Store Location Settings, Automatic Stock Replenishment, WMS interface, Dynamic Escape Settings.

**Build notes.**
- Implement Category, Group, Product as one settings-resolution chain with scope `PRODUCT_CATEGORY` (already
  on the resolver's list) and a new `PRODUCT_GROUP` scope. **The resolver must distinguish NULL from 0.**
- **Cascading `Active`** is a genuinely good rule — replicate it, but make the UI show *why* a group is
  inactive rather than silently hiding it.
- **Twilight pricing is worth stealing.** An automatic ladder that marks down aged floor-model/as-is stock on
  a schedule is directly applicable to mattress floor models. Note the base is the *starting* as-is price, so
  reductions are simple, not compounding.
- The rounding block (`Rounding Method` × (`Round To` | `End In`)) should be a **shared, reusable price-
  rounding service** used by every discount, promotion and markdown path — not re-implemented per feature.
- `[DECISION NEEDED]` — `Inventory Family` is an unvalidated free-text grouping above category. Either make
  it a real fourth tier (validated) or drop it. Free-text grouping keys rot.

---
### `PRD-008` Collection Settings
*storis_ref: article 15294470773140*

**Purpose.** Collections link products that share characteristics (a furniture "suite", a mattress line)
**across** the category/group hierarchy, for inquiry, reporting, cross-sell and web merchandising.
"Collections cross the 'top/down' inventory hierarchy."

**Where it lives.** `… > Inventory Hierarchy Settings > Product Information Settings > Collection Settings`
(and Vendor Receivables paths). Support files: Vendor, Product Category, Product Group, Product, DFI Code.
Tabs: **General, User Defined Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Collection | code | |
| Description | ≤30 alphanumeric | |
| Price Point | text, `NN-NN` | Two whole dollar amounts separated by a dash — a price *range* covering the collection's items (selling prices or costs, per your convention). |
| Price | money | Free-meaning: price of the collection sold as a unit, or of its most expensive piece, "or any dollar value which follows the logic of your collection structure". **Explicitly not a computed value.** |
| Vendor | code FK | |
| Category | code FK | |
| Group | code FK | |
| Style | ≤7 chars | Matches the product `Style` field's width. |
| Discount Costing Table | DFI code FK | Default purchasing-discount code for PO Entry for this collection → `PRD-014`. |
| Volume Rebate Table | code FK | Vendor volume rebate associated with the collection. |
| Product List | multi product FK | **"Collections can include an unlimited number of products."** |
| Image ID | filename | Collection image for eSTORIS. |
| Web Benefits | text | Collection-level benefits text for eSTORIS. **Syncs only when `Create Related Items From Product Collections` is checked in eSTORIS Control Settings, and only when at least one product in the collection is web-available.** |

**Behavior & rules.**
- **CONTRADICTION INSIDE STORIS'S OWN DOCS — flagging.** This article: **"A product can belong to a maximum
  of five collections."** `PRD-001` Advanced Product Settings: "An unlimited number of collection codes may
  be listed." One of the two is wrong. Treat **5** as the safer assumption for data migration and confirm
  with STORIS/the data before relying on either.
- **Membership is maintained from both ends** — add products here, or add collections on the product record;
  writing either side updates the other.
- **The primary collection (first one entered on the product) is what sorted reports use.**
- **Audit:** "Changes made to this field is recorded in **Track Settings Activity** as
  `PRODUCT.COLLECTION.BENEFITS`." — a second named settings-activity source, alongside `Review Settings
  Activity`'s `Product` source from `PRD-001`.
- User Defined Settings tab: informational only, no processing.

**Dependencies.** `PRD-001` (Collection field), `PRD-014` Discount Costing Table, Volume Rebate Table,
eSTORIS Control Settings (`Create Related Items From Product Collections`), Track Settings Activity.

**Build notes.**
- Model collections as a **many-to-many tag with an ordered position**, position 1 = primary. Enforce a
  configurable cap (default 5) rather than hard-coding either STORIS answer.
- Two-way maintenance is right; implement it as one join table edited from two screens, not two stores that
  must be kept in sync.
- `Price Point` as a dashed string and `Price` as a free-meaning number are both bad data modelling.
  Ours: `price_point_low` / `price_point_high` as money, and drop the ambiguous `Price` unless someone can
  state its meaning — `[DECISION NEEDED]`.
- Collections are the natural home for **bundle/suite merchandising**; note that STORIS does *not* price or
  reserve a collection as a unit (that is Kits — `PRD-009`, `PRD-027`, position 50). Collections are
  descriptive only.

---
### `PRD-009` Component Priced Kits
*storis_ref: article 15294468994196*

**Purpose.** Explains the `Component` option of the `Source of Price` field in Product Kit Settings — i.e.
**how a bundle prices**. This is a concept article, not a screen.

**Where it lives.** Behaviour of `Product Kit Settings > Source of Price = Component` (Product Kit Settings
is position 50, in `product-settings-b`).

**Behavior & rules — how a component-priced kit prices**

1. Product Kit Settings holds a **total `Selling Price` for the kit, used only as a "proof amount"** against
   which the sum of the component prices is checked. It is not itself the price charged.
2. Each component's default price comes from **`Kit Selling Price` on the Pricing page of Advanced Product
   Settings** (`PRD-001`); **if blank, the component's ordinary `Selling Price` is used.** That becomes
   `Default Kit Price $` in Product Kit Settings.
3. Each component's price may be overridden per-kit in **`This Kit $`**. **Every component must have a
   `This Kit Price $`; zero or higher is acceptable.** Values are **scoped to that kit only**.
4. On a sales transaction, the component's currently-assigned kit price is the selling price **for soft-kit
   components, and is used for all margin calculations for both hard and soft kits**.
5. **Changing component prices in Product Kit Settings affects only subsequent additions of the kit to
   transactions — existing transactions are untouched.**
6. **Component-priced kits cannot contain other kit masters** (no nesting).
7. Editing `Kit Selling Price` on the product prompts to **cascade the change into every hard and soft
   component-priced kit whose `This Kit Price $` still equals the previous price**; answering Yes updates
   both the component price and the kit total.
8. When a component is removed from an order after a soft kit is expanded, the POS Control Settings field
   **"SOFT KIT - Apply Pricing Hierarchy to kit components in a sale when the kit is changed"** decides
   whether the remaining components keep their kit prices or revert to standard selling prices.
9. **Promotional pricing beats component kit pricing** — a component may carry its own promotion code/date
   range and price, and it wins if the order date falls inside the range.
10. Component-priced **soft** kits support **substitution lists** per component, but only when
    `Adjust Soft Kit in Order Entry` is checked on the Inventory page of POS Control Settings.
11. **Line item discounts apply at kit-master level for component-priced HARD kits, but NOT for component-
    priced SOFT kits.**
12. **Markdown Pricing is available for component-priced HARD kits, but NOT for component-priced SOFT kits.**

**Dependencies.** `PRD-001` (`Kit Selling Price`), Product Kit Settings (pos. 50), POS Control Settings
(`SOFT KIT - Apply Pricing Hierarchy…`, `Adjust Soft Kit in Order Entry`), Substitute Product List Settings
(pos. 70), `PRD-027` Kit Promotion Settings, `PRD-032` Markdown Pricing.

**Reconciliation.** **Extends `ITEM-040` materially.** The pack's seven-step resolver has no kit branch. The
real precedence inside a component-priced kit is:
**component promotion (in date) → `This Kit $` → product `Kit Selling Price` → product `Selling Price`.**
Note also that `ITEM-044` (as-is piece price wins over everything) and this kit chain both sit *above* the
`ITEM-040` chain — the resolver needs an explicit ordering of these override layers.

**Build notes.**
- Implement kits with an explicit `price_source` enum on the kit master (at minimum `KIT` / `COMPONENT`; the
  full enum comes from Product Kit Settings in part B) and a `component_price` on each kit line.
- **Hard vs soft kit is the load-bearing distinction**: a hard kit is a single sellable master (discountable,
  markdownable, one line); a soft kit explodes into component lines (each priced individually, not
  discountable at master level). Model them as one entity with an `explode_on_order` flag and make the
  discount/markdown eligibility rules fall out of that flag rather than being separately configured.
- The "prompt to cascade a price change into all kits where the old price still matches" pattern is good —
  it is a safe bulk edit. Reproduce it, but log it to `RPT-AUDIT` with the list of kits changed.
- `[DECISION NEEDED]` — do we allow **nested kits**? STORIS forbids them for component pricing. Recommend we
  forbid nesting entirely; it is the single biggest source of pricing bugs in bundle systems.
- `[DECISION NEEDED]` — a mattress + foundation + frame bundle is exactly this shape. Confirm whether LA
  Mattress bundles reserve at component level (soft kit) or as a unit (hard kit); **that decision determines
  whether availability is computed per component or on the master**, and it cannot be changed cheaply later.

---
### `PRD-010` Configurator Clone Process
*storis_ref: article 15294469951124*

**Purpose.** Copies a product's Product Configurator setup (option types, fabrics, options) onto another
product, so a matching sofa/loveseat/chair set need only be configured once.

**Where it lives.** `Actions` button on the **Product Configuration** screen (position 47).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| New Product Id | vendor model number | **Not the STORIS product code — the vendor model number.** The target must (a) already exist in the Product file, (b) **have the same vendor as the source**, and (c) **have no existing option type data**. |

**Behavior & rules.** Clone then adjust; Save returns to Product Configuration with the new vendor model
shown. **The "no existing option type data" precondition means clone is create-only, never a merge/overwrite**
— despite the article's own wording "clone … and merge it with another product".

**Dependencies.** Product Configuration (pos. 47), `PRD-005`, `PRD-033`–`PRD-036`.

**Build notes.** Generic pattern worth having system-wide: **clone-with-preconditions**. Ours should support
clone-into-non-empty with an explicit "replace" confirmation, and should be audited.

---
### `PRD-011` Configurator Sub-Option Rules
*storis_ref: article 15294523580180*

**Purpose.** Assigns rules that adjust price/cost of, or constrain the validity of, a **sub-option** relative
to its parent option in the Product Configurator. This is the configurator's rule engine.

**Where it lives.** `Option Type Configuration` (`PRD-036`) → **Enter Rules** button.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Option Type / Sub-Option Type | display-only | Carried in from Option Type Configuration. |
| Rule | code ≤20 chars, **mandatory** | Must be a rule ID already established via **Set Configuration Sub-Option Rules** (position 61) **and must exist for this option type**. |
| Operand | enum | `+` (Add) \| `-` (Subtract) \| `*` (Multiply) \| `=` (Equal) \| `#` (Not Equal). |
| Price | money | Arithmetic operands only: applied to **the parent option's add-on price**. |
| Cost | money | Arithmetic operands only: applied to **the parent option's add-on cost**. |
| Sub-Option | code FK | Comparison operands only. Mutually exclusive with `List`. |
| List | code FK → List Configuration (`PRD-030`) | Comparison operands only. Mutually exclusive with `Sub-Option`. |

**Behavior & rules.**
- **`+`, `-`, `*` act on the parent option's add-on price/cost using the Price and Cost entered.** With an
  arithmetic operand you **must** enter a value in Price or Cost.
- **`=` and `#` compare the entered sub-option against another sub-option or a list; if the comparison
  fails, an error is presented and the entered sub-option is rejected.** So comparison rules are *validation*
  (compatibility constraints), not pricing.
- **Field gating: choosing `+` or `-` deactivates Sub-Option and List; choosing `=` or `#` deactivates Price
  and Cost.** (Note the article does not say `*` deactivates them — likely an omission, treat `*` as
  arithmetic.)
- Rules accumulate in a grid: Rule, Operand, Price, Cost, Sub-Option, List.

**Dependencies.** `PRD-036` Option Type Configuration, `PRD-030` List Configuration, Set Configuration
Sub-Option Rules (pos. 61), Set Configuration Rules (pos. 60).

**Build notes.** If we build a configurator, split these two concerns that STORIS conflates in one grid:
**(a) price/cost modifiers** and **(b) compatibility constraints**. They have different lifecycles, different
test strategies, and different failure modes. A constraint that silently doubles as a price rule is a trap.

---
### `PRD-012` Configurator Yardage Screen
*storis_ref: article 15294468995092*

**Purpose.** Records how much fabric or leather a frame consumes, so a configured upholstery item can be
costed and the fabric ordered.

**Where it lives.** `Actions` button in **Advanced Product Settings** and in **Product Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Frame | display-only | The product's **vendor model number**. |
| Base Fabric Yards | numeric, 3 dp, **>0 and <100**, optional | |
| Inside Fabric Yards | same | |
| Outside Fabric Yards | same | |
| Base Leather Yards | same | |
| Inside Leather Yards | same | |
| Outside Leather Yards | same | |

**Behavior & rules.** All six are optional; all six are `0 < x < 100` with three decimals. Fabric and leather
are tracked as parallel triples (base / inside / outside).

**Dependencies.** `PRD-005` Base/Grade Configuration, `PRD-016` Fabric Configuration, `PRD-001` (action).

**Build notes.** Only relevant if we do made-to-order upholstery. Covered by the same `[DECISION NEEDED]`
raised at `PRD-005`.

---
### `PRD-013` Default Product Settings
*storis_ref: article 15294524452756*

**Purpose.** The defaults applied to **products created on-the-fly** (and, per the intro, "via product
settings") — a four-field new-product template.

**Where it lives.** `Customer > Point of Sale > Settings > Default Product Settings`;
`Merchandising and Distribution > Inventory > Settings > Default Product Settings`;
`Merchandising and Distribution > Settings > Purchasing Settings > Default Product Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| PO from Order Entry | checkbox | Default for the product-level `PO From Order Entry` flag on on-the-fly products. |
| Serial Tracked | checkbox | Default for the product-level `Serial Numbers` flag on on-the-fly products. |
| National Tax Exempt | checkbox | Checked ⇒ `National Tax Exempt` defaults **active** on new products in Advanced Product Settings and Product Settings; blank ⇒ inactive. **This one applies to all new products, not only on-the-fly ones.** |
| Velocity | code FK | Default putaway velocity code for new products. |

**Behavior & rules.** The whole on-the-fly capability is gated by **`On-The-Fly Maintenance` on the General
tab of General System Control Settings** — another global kill-switch of the same family as Extended Security.

**Dependencies.** `PRD-001`, General System Control Settings (`On-The-Fly Maintenance`), directed putaway.

**Build notes.** **This screen is far too thin to be the new-product template.** Everything else on a product
comes from Group/Category inheritance or is typed by hand. In our system, replace it with a proper
**Product Template** entity (multiple named templates, e.g. "Mattress — Queen", "Foundation", "Accessory")
carrying a full field set, selectable at create time and recorded on the product so we can tell later which
template produced it. `[DECISION NEEDED]` — do we allow on-the-fly product creation from order entry at all?
It is the classic source of duplicate SKUs; recommend permission-gated and always flagged for merchandiser
review.

---
### `PRD-014` Discount Costing Table
*storis_ref: article 15294522623380*

**Purpose.** Defines **DFI codes** — dated purchasing discounts applied to *cost* during Purchase Order
Entry. Referenced from the product's Cost tab and from Collection Settings.

**Where it lives.** `Actions` button at the `Discount Costing Table` field in **Advanced Product Settings**
(`PRD-001`) and **Collection Settings** (`PRD-008`). **A read-only variant appears when reached through a
view-only routine such as View Advanced Product Settings** — selections are visible but not editable.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Discount Code | DFI code | |
| Percent/Dollar | enum | `Percent` \| `Dollar`. |
| Factor | numeric | Percentage or dollar amount per the above. |
| Start Date | date | |
| End Date | date | |
| Stock | checkbox | Include stock products in the discount. |
| Special Order | checkbox | Include special-order products in the discount. |

**Behavior & rules.** Dated cost discounts that default into PO Entry. The `Stock` / `Special Order` pair
means a discount can be scoped to one, the other, or both. **Nothing in the article says what happens when
both are unchecked** — presumably the discount never applies; validate on build.

**Dependencies.** `PRD-001` (Cost tab), `PRD-008` (Collection), Purchase Order Entry, Volume Rebate Table.

**Reconciliation.** **Relevant to `COST-030`/`COST-032`.** These are *cost reductions* applied at PO entry,
distinct from the landed-cost *additions* (freight/add-ons). Our costing model needs both directions:
**dated purchase discounts (down) and landed factors (up)**, resolved at the same point (receipt costing).

**Build notes.** Same `factor_type` enum as the landed factors (`PERCENT` | `AMOUNT`) — reuse it. The
read-only-when-reached-from-a-view-routine behaviour should be a property of the **route**, not of the
screen; in our system that is one permission check, not two components.

---
### `PRD-015` District and Regional Product Settings
*storis_ref: article 15294470776724*

**Purpose.** Holds per-**district** pricing and per-**region** inventory/purchasing/costing overrides for a
single product. This is the middle scope of the three-scope price model, and it is **two different scopes,
not one**.

**Where it lives.** `… > Inventory Hierarchy Settings > Product Information > District and Regional Product
Settings` (13 paths). Tabs: **District**, **Regional**. Header field: `Product`.

**Fields — District tab (sales-oriented)**

| Field | Type | Purpose / business rule |
|---|---|---|
| District | code FK | Only districts the user has access to. The Actions button **bulk-populates the grid with every accessible district**. **Pricing defaults in from the Product file.** |
| Selling Price | money | District regular price. **Bulk-maintainable via the District and Regional Product import in Import Data — this is how a price is changed or removed across many districts at once.** A change is evaluated for adding a floor tag to the label queue for on-hand floor samples. |
| Suggested Retail Price | money | District SRP. |
| Markdown Price | money + auto date | **HARD RULE / DIVERGENCE FROM PRODUCT LEVEL: "The markdown price is active regardless of the purchase status of the product (as opposed to the markdown price field in Advanced Product Settings which is not active when the product status is active.)"** Also: **a selling-price change does NOT evaluate the markdown price for the floor-sample label queue.** |
| Spiff Amount | action → spiff table | Builds a **district spiff table, which must be entered in descending order**: pairs of (`Spiff Amount`, `Price Level`) where Price Level is the selling price at or above which the spiff is earned. **A blank Price Level means the spiff is earned on every sale regardless of price.** |
| Promotion Code | code FK | May have been loaded by Price Adjustment Settings (`PRD-039`). **Rounding options configured in Price Adjustment Settings apply here.** |
| Starting Date / Ending Date | date | **If you enter a starting date you must enter an ending date.** |
| Promotional Price | money | **If you enter a promotional price you must enter both dates.** |
| Commission Percent | percent | Commission for selling at the district promo price. |
| Spiff Amount (promo) | money | Spiff for selling at the district promo price. |
| Reward Factor | numeric | With `Reward Indicator` = `A` (Amount) it is absolute points per item; with `P` (Percentage) it is a percentage of selling price. |
| Reward Indicator | enum | `Amount` \| `Percent` \| `No reward`. |

**Fields — Regional tab (inventory / purchasing / costing)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Region | code FK | Only regions the user has access to; Action bulk-populates the grid. |
| Minimum / Maximum / Safety (stock level quantity) | int | Regional stock policy for this product. |
| Purchase Status | code FK | Regional purchase status. **Inactive when open-order quantity exceeds inventory quantity.** **The one-time-buy (`O`) status is not available in this routine.** Action button → **Schedule Purchase Status** (pos. 59) for a dated change. |
| Date | display date | Date status last moved off `A`; clears when returned to `A`. |
| Purchase Lead Days | int 0–999 | Regional lead days. **Blank ⇒ fall through to the next level of the hierarchy; `0` ⇒ same-day receipt.** |
| Reservation Priority | enum | `Use Product Setting` \| `Ordered Date` \| `Delivery Date`. |
| Reservation Date | enum | `Use Product Setting` \| `Delivery Date within Auto Fill Days` \| `Immediate`. **If Priority = `Use Product Setting` then Date must also be `Use Product Setting`.** Changing it forces a deferred ATP recalculation at End of Day (Yes/No prompt). |
| Freight Cost $ | money | Active when `Freight Factor is` Type = `Dollars`. Average per-unit freight charged by vendor/carrier. |
| Freight Factor is — Type / Amount | enum + value | `Percent` uses the Amount as a percentage, **only if Landed Freight is active in Costing Control Settings**. Action → **Vendor Ship From Landed Freight and Addon Cost Settings**. |
| Add-on cost rows 1–4 — Type / Amount | enum + value | **`Percent` \| `Dollar` \| `Calculate`.** **The add-on row labels (`DUTY`, `UPCHARGE`, …) are defined in Costing Control Settings**, same as at product level. |
| Current Status is | distribution status FK | Only for Inventory Type `Retail Inventory` / `Retail Part` / `Retail Labor`. **Resolution order: Warehouse Inventory Settings → District/Regional Product Settings → Advanced Product Settings.** |
| On this Date / Change Status to | date + code | Deferred distribution-status change applied by the **Update Distribution Status** process in Schedule a Process; both fields reset to null afterwards. Date must be > system date. |

**Behavior & rules.** Both tabs are grid-based: fill the fields, click add/plus to write a row per
district/region, double-click a row to edit. The presence of rows here is what makes `PRD-001` display
**"District settings active"** on its Pricing page and **"Regional settings active"** on its Costing page.

**Reconciliation — this is the most important divergence in my half.**
- **`ITEM-045` is INCOMPLETE and partly wrong.** Our pack says three scopes: product / district / location,
  with district carrying "selling price, sale price, sale start date, sale end date". In reality STORIS has
  **four scopes**: product, **district** (price/promo/spiff/commission/rewards/markdown/SRP), **region**
  (stock min/max/safety, purchase status, lead days, reservation method, **landed freight and add-on costs**,
  distribution status), and **location** (Warehouse Inventory Settings). District and region are *different
  dimensions* with disjoint field sets — district is a sales geography, region is a supply geography.
  **Update `ITEM-045` to a `scope` discriminator of `PRODUCT | DISTRICT | REGION | LOCATION`** and split the
  field sets accordingly.
- **`COST-032` is INCOMPLETE.** Landed freight and add-on factors exist at **region** scope as well as
  product and vendor-ship-from scope. Full precedence chain to establish: vendor → vendor ship-from →
  region → product. `[DECISION NEEDED]` — confirm the exact winner order with STORIS or by testing; the
  article does not state it.
- **`ITEM-040` step 1 CONFIRMED** ("District promotional price when date falls in the district sale date
  range") and step 6 confirmed (district selling price). **New finding: the district row also carries SRP,
  markdown, spiff table, commission and reward factor** — the promo is not the only district-scoped price.
- **New hard rule not in the pack:** district markdown price is active regardless of purchase status, while
  product markdown price is only active at status M/D/T. **Two same-named fields with different activation
  rules at different scopes is a bug factory** — see build notes.

**Dependencies.** `PRD-001`, `PRD-039` Price Adjustment Settings (promo load + rounding), Import Data
(District and Regional Product import), Warehouse Inventory Settings, Costing Control Settings, Inventory
Control Settings, Schedule a Process (`Update Distribution Status`), Schedule Purchase Status (pos. 59),
Set Product Status by Region, Single Product Review Screen, Commission Settings, Customer Rewards.
**Row-level security applies: users only see districts/regions they have access to** — record this against
`SEC-*`; our resolver needs the same scoping on the settings-maintenance UI.

**Build notes.**
- Implement **one** `product_setting` table with `(product_id, scope, scope_key, field...)` where scope is
  `PRODUCT | DISTRICT | REGION | LOCATION`, per `ITEM-045`'s "do not create parallel tables" instruction —
  but the scope enum must have four members, not three.
- **Do not replicate the markdown activation divergence.** Pick one rule (recommend: markdown price is a
  price *kind* that is only in effect when the product's lifecycle status is `MARKDOWN`/`DROPPED`/
  `DISCONTINUED`, at every scope) and apply it uniformly.
- The **descending-order spiff table with an optional blank price level** is a neat compact form for
  "tiered incentive with a floor". Model it as ordered rows with a nullable threshold, and validate the
  ordering on save rather than trusting the user.
- Bulk maintenance matters: the article specifically calls out an **import path to change or remove a price
  across many districts**. Our equivalent needs a first-class bulk price-change tool with preview and
  rollback, not just a spreadsheet import.
- Every district/region price change must feed `RPT-AUDIT` and must be able to answer "what was the price in
  district X on date Y" — the floor-tag label queue depends on knowing the change happened.

---
### `PRD-016` Fabric Configuration
*storis_ref: article 15294470273812*

**Purpose.** One record per fabric available from a configurator vendor: its grade, its fabric groups, its
waste factor and availability.

**Where it lives.** `… > Product Information Settings > Product Configurator Settings > Fabric Configuration`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code FK | **Fabrics are namespaced per vendor** — the lookup lists only fabrics previously created for this vendor. |
| Fabric | code, ≤15 alphanumeric | |
| Suite | code FK, optional | Assigns a suite to this fabric for the vendor (feeds the grade-override matrix, `PRD-020`). |
| Description / Color | text | Should identify the vendor's own name for the fabric. |
| Groups | multi FK → Fabric Group Configuration (`PRD-017`) | **A fabric may belong to multiple fabric groups.** |
| Grade | code FK → Grade Description Configuration (`PRD-020`) | |
| Waste Factor | percent, 3 dp, **< 100**, optional | Extra material to allow for pattern alignment etc. **Per-fabric, not global.** |
| Available | checkbox | Checked = currently available; **unchecked = discontinued / no longer available from this vendor**. This is the fabric-level lifecycle flag. |
| Additional Information | long text, translatable | **Surfaces to the salesperson: the text appears in the `Additional Information` field on the Special Order Configurator screen when this fabric is chosen as the Primary Option.** Intended for availability/lead-time notes ("Not in stock – requires 6 week lead time"). |

**Dependencies.** `PRD-017`, `PRD-020`, `PRD-005`, `PRD-012`, Special Order Configurator, Suite Configuration
(pos. 72).

**Build notes.** Two transferable ideas even if we skip the configurator: **(a) a per-option "availability
note" that reaches the salesperson at the point of selection** — far better than a buyer knowing and nobody
else; **(b) a waste factor on the material, not on the finished good.**

---
### `PRD-017` Fabric Group Configuration
*storis_ref: article 15294523901716*

**Purpose.** Groups a vendor's fabrics into selling groups so a clerk at POS is not scrolling hundreds of
fabric codes.

**Where it lives.** `… > Product Configurator Settings > Fabric Group Configuration`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code FK | The vendor's full name displays beside the field. **Fabric groups are per-vendor.** |
| Fabric Group | alphanumeric code | Lookup shows only groups already created for this vendor. |
| Description | text | Should match the vendor's own name for the group. |

**Behavior & rules.** **"Individual fabrics can belong to multiple fabric groups"** — many-to-many, not a
hierarchy.

**Dependencies.** `PRD-016`.

**Build notes.** Trivial table. If we build a configurator, note this is a **tagging** relationship (m:n),
which is different from the category→group product hierarchy (1:n) — do not reuse the same abstraction.

---
### `PRD-018` Factory/Extended Warranty Code
*storis_ref: article 15294524453140*

**Purpose.** (Article is a short concept note, ~5 sentences.) States the typing rule linking product
warranty fields to the Warranty Settings file.

**Where it lives.** Concept behind the `Factory Code` and `Extended Code` fields on the Miscellaneous page of
Advanced Product Settings (`PRD-001`).

**Behavior & rules.**
- **Both fields accept only codes created in the product Warranty Settings File.**
- **`Extended Warranty Code` (on non-inventory extended-warranty products) requires the referenced warranty
  record to have `Warranty Type = Extended`.**
- **`Factory Warranty Code` (on regular inventory products) requires `Warranty Type = Factory`.**

**Dependencies.** `PRD-001`, Warranty Settings, Warranty Category.

**Build notes.** A single `warranty` table with a `type` discriminator, and **the FK constraint on the
product must carry the expected type** — enforce in the schema (two FKs each with a check), not in the UI.

---
### `PRD-019` Freight Distribution
*storis_ref: article 15294522637972*

**Purpose.** (Short concept note.) How container-receiving distributes a separate freight bill across the
received lines.

**Where it lives.** `Receive a Purchase Order With a Separate Freight Bill` (Container Receiving) —
set `Action for this Batch = Close Batch`, then choose `Freight Distribution By`.

**Behavior & rules.**
- Freight dollars can be distributed **by original cost**, or **by `Volume` or `Weight` units (typically
  cubic feet)** — enum `Volume` | `Weight`.
- **Source resolution: the system reads `Shipping Weight` or `Shipping Volume` from the Product record; if
  not found, it falls back to the product *Group* record's `Capacity Weight` or `Capacity Units` fields.**

**Dependencies.** `PRD-001` (Shipping Weight/Volume), `PRD-022` Group Settings (`Capacity Weight`,
delivery/shipping volume), Container Receiving.

**Reconciliation.** **Confirms `RCV-053` (freight allocation by weight/cube) and is the other half of
`COST-033`.** Container receiving with a separate freight bill is the *itemized* mode that is mutually
exclusive with the preset landed-freight factors of `COST-030`. **New detail for `RCV-053`: the weight/volume
lookup has a product→group fallback**, so a missing product weight does not abort the allocation.

**Build notes.** Implement the allocation basis as an enum `COST | WEIGHT | VOLUME`, and implement the
product→group fallback explicitly. **Add a guard STORIS lacks: if neither product nor group supplies a
weight/volume for a line, the allocation must fail loudly rather than silently allocating zero freight to
that line** — silent zero is how a container's freight ends up entirely on one SKU.

---
### `PRD-020` Grade Description Configuration
*storis_ref: article 15294470266644*

**Purpose.** Defines a vendor's fabric grades, and — via a grid — a **grade override matrix** keyed by
frame suite × fabric/option suite.

**Where it lives.** `… > Product Configurator Settings > Grade Description Configuration`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code FK | Grades are per-vendor. STORIS recommends **adhering to the vendor's own grade naming**. |
| Grade Key | alphanumeric code | |
| Grade Description | text | Should identify the vendor grade it maps to. |
| Fabric/Option Suite | suite code FK, optional | Must be valid for this vendor. |
| Frame Suite | suite code FK, optional | Must be valid for this vendor. |

**Behavior & rules.** Adding (Fabric/Option Suite, Frame Suite) pairs to the grid builds a **grade override
matrix**. **That matrix is checked in the Special Order Configurator inside Enter a Sales Order to decide
whether a grade override applies when calculating the current configuration.** Rows are removable.

**Dependencies.** `PRD-005` Base/Grade Configuration (price/cost per grade), `PRD-016` Fabric Configuration,
Suite Configuration (pos. 72), Special Order Configurator.

**Build notes.** The override matrix is a **rules layer above the price table** — the same shape as the price
matrix (`ITEM-042`): a two-dimensional key producing an override. If we ever build this, reuse one generic
"2-D matrix lookup with fallthrough" component for price matrix, grade override, and commission matrix
rather than three bespoke ones.

---
### `PRD-021` Gross Margin Calculator
*storis_ref: article 15294468990612*

**Purpose.** A what-if calculator on the product: solve for gross margin % given a price, or for price given
a target gross margin %.

**Where it lives.** `Actions` button on the **General** tab of Advanced Product Settings (`PRD-001`).
**Can be added as a dynamic escape** (Dynamic Escape Settings).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | display-only | Defaults to the selected product. |
| Cost Type | enum | `Replacement` \| `Average`. |
| Landed | checkbox | Include landed costs in the computation. |
| Cost | computed | Derived from Cost Type + Landed, **read from the product file's cost fields**. |
| Price | computed/entered | Recomputes Gross Margin % on every change. |
| Gross Margin % | computed/entered | Recomputes Price on every change. |

**Behavior & rules.** Two-way binding between Price and Gross Margin % around a fixed Cost.
**HARD RULE / GOTCHA: "The Gross Margin Calculator performs all calculations in domestic currency. It does
not reference the exchange rate when making calculations."** For imported goods costed in foreign currency
this silently produces the wrong margin.

**Reconciliation.** Confirms `COST-010`/`COST-030`: the product carries **both** `Replacement` and `Average`
cost, and **landed cost is an additive layer that can be included or excluded from a margin view**. Our
costing model must be able to answer "cost with and without landed factors" as a first-class query.

**Build notes.** Build this as a **pure function** (`grossMargin(cost, price)` / `priceForMargin(cost, gm)`)
shared with the min-gross-profit exception check and the commission `Add To Cost %` logic, so a margin shown
in the calculator can never disagree with the margin that triggers an exception. **Do handle currency** —
that is a real defect in the STORIS version and we import.

---
### `PRD-022` Group Settings
*storis_ref: article 15294470776468*

**Purpose.** The **middle tier** of the inventory hierarchy and, in practice, the most policy-dense record in
the product model: GL mapping, routing capacities, replenishment routing, returns policy, restocking fees,
as-is/twilight pricing, lead tracking, and the auto-generated-SKU format.

**Where it lives.** `System Administration > System Settings > Merchandising and Distribution System
Settings > Inventory Hierarchy Settings > Group Settings`, plus Accounting GL Settings and `Get Started
Step 9 - Merchandise`. Support file: Category. Tabs: **General, Twilight Pricing, Product Identifier, User
Defined Settings**.

**Fields — General**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product Group | alphanumeric code | **Unlimited number of groups** (vs 12–25 categories). |
| Description | ≤30 chars | |
| Active | checkbox, defaults checked | Unchecked ⇒ **the group cannot be entered at the Group prompt in Advanced Product Settings or Product Settings**, for new products *or* for reassigning existing ones. |
| Non-Inventory | checkbox | Group holds non-inventory products (warranties, fabric protection). |
| Product Category | code FK | **The lookup hides inactive categories, and typing an inactive category code directly is rejected with an error.** Changing the category triggers a deferred ATP recalculation at End of Day (Yes/No prompt). |
| Warranty Categories | multi FK | Warranty categories whose warranty products may be linked to this (tangible) group. **Used to populate `Extended Categories` on special-order products built on the fly** (`PRD-001`). |
| Inventory / Sales / Cost of Sales / Inventory Adjustment (GL) | GL account | **Three-level GL fallback, stated explicitly: Group → Category → General Ledger Assigned Account Settings default.** |
| Sales Line Discount / Sales Line Discount Recovery | GL account | Validated per `Post Line Discounts to General Ledger` (POS Control Settings, Advanced tab). |
| Contact Management (section) | — | Governed by the Lead Information tab of Sales Lead System Control Settings; leave blank if not using InTouch CRM. |
| Delivery Volume | numeric | Group default delivery volume per unit. **"You need to enter a value in this field only if the delivery volume of the product differs from the receiving volume."** |
| Capacity Weight | lbs | Max weight that fits on a delivery truck; **also the group-level fallback for weight-based freight distribution** (`PRD-019`). |
| Unload Time | minutes | Only used when third-party mapping is active. |
| Shipping Volume | numeric | Group default; **also the group-level fallback for volume-based freight distribution** (`PRD-019`). Copied to new products' Shipping Volume when WMS is active. |
| | | These four are described as **"the second level of the hierarchy mentioned in the Route Mapping Control Settings"** — capacities and unload times resolve product → group → route mapping control. |
| First … Fifth Warehouse | location FK ×5 | Auto Stock Replenishment sources, checked in order. `First Warehouse` mandatory when the feature is used; each must be a warehouse-type location. |
| Target Location(s) | multi location FK | **Only accessible once First Warehouse is set; a target cannot also be a source.** Same limitation as category: **no separate source lists for store vs warehouse targets at group level.** **Group-level replenishment overrides category-level.** |
| Retail Deck Minor | multi, ≤50 chars | Maps RetailDeck "minor" codes to this group. **Must be globally unique across Group records (error if reused).** **RetailDeck "minor" = STORIS product group; RetailDeck "major" = STORIS product category.** If an imported product has no minor, **STORIS assumes the major maps to the STORIS product group** — a silent, lossy fallback. No match ⇒ default group from Retail Deck Control Settings. |
| Lead Tracked Management | checkbox | **Completing an order for a product in a lead-tracked group closes a lead — and if no lead existed, the system creates one and immediately closes it "to maintain an accurate historical record."** |
| Merchandise Interest | code FK | **Active and mandatory when Lead Tracked Management is checked.** |
| Allow As-Is POS Scan | checkbox | When on, a product scanned into the Product field of Enter a Sales Order is checked against the group to decide as-is vs stock, and **the correct line type is created automatically**: for an available as-is piece the As-Is box is ticked, the Serial/Reference number is assigned, the Unit Price defaults, and the line defaults to **Take With** (changeable to Delivery/Pick Up). **If the piece is not available the scan is rejected with an error.** |
| **Return Restriction Days** | int 1–999, default blank | **This is `CFG-GRP-RTNDAYS`.** Blank = no group restriction. It is an **exception that tightens** the global `Allowed Number of Days on Returns` in POS Control Settings (global 180 / group 90 ⇒ returns after 90 days need an override). Override permission: **`Override Group Return Restriction Days`** in Create a User/Group Actions – Sales Security. **Evaluated during Original Order Piece Selection.** |
| Return Restriction Reason Codes | multi code FK | Restricts which reason codes may be used to return this group's merchandise. **Valid codes must be designated `Not Required` or `As-Is Restricted` at `This Reason Code is Used for` in Reason Code Settings, and must NOT be one of the Inventory Control Settings Additional-tab reason codes (Floor Sample, Not in Location, In Service, Twilight, Repossession).** Also evaluated during Original Order Piece Selection. |
| Installation Charge | money | **Automatically added to retail sales orders for every product in the group.** Retail sales only. |
| Special Order Zero Cost Retail | percent | Same field and same hierarchy as `PRD-007`: **Group → Category → Special Order Control Settings, first non-null wins; `0` is a value and stops the search.** Overridden by `Use Replacement Cost as Default` in Purchasing Control Settings. |
| Minimum Gross Profit % | percent | Group-level GM floor for edited order prices. |
| Depreciate Repossessions | percent | **Only meaningful when `Repossessable` is checked.** |
| Reduce Customer Returns % | percent, positive, ≤100 | **Automatically reduces the price AND cost of this group's merchandise on returns and exchanges.** Blank ⇒ use the global `Reduce Customer Returns by ___ %` in Costing Control Settings. |
| Restocking Fee on Returns % | percent 0.00–100.00, default blank | Blank ⇒ the group is included in the global `Restocking Fee on Returns %` (POS Control Settings). **Entering `0` means no restocking fee for this group** (again: 0 ≠ blank). **The automatic calculation must be active globally for the group value to apply — the control-settings percentage cannot be blank. If the control setting is `0`, only group-level fees are calculated.** |
| Repossessable | checkbox | |

**Fields — Twilight Pricing.** Identical to `PRD-007`: `Period Measurement` (`Months`|`Days`),
`Reduction Period` (recurring — "every 31st day until the item is sold"), `Reduction Percent` (applied to the
as-is **starting** price), plus the same Round To block (`Line Discount Rounding Method` =
`None`|`Up`|`Down`|`Nearest`; `Round To` = `None`|`Penny`|`Dime`|`Dollar`|`Ten`|`Hundred`|`Thousand`,
**mutually exclusive with** `End In`). **Group twilight pricing overrides category twilight pricing.**

**Fields — Product Identifier** (**this is the answer to "product attributes vs user-defined fields"**)

| Field | Type | Purpose / business rule |
|---|---|---|
| Format | enum | `Use Inventory Control Settings` (**default for all new groups**) \| `Next Product Number` (global sequential counter) \| `Dynamic Identifier` (composed here, per group). |
| Sequential Counter — Maximum Length | int, **required when Format = Dynamic Identifier** | Length of the internal counter appended to the end of the composed ID. |
| Sequential Counter — Fixed Length | checkbox | Zero-pads the counter to Maximum Length (max 5, counter 123 ⇒ `00123`); unchecked ⇒ `123`. |
| Current Combined Component Length | display-only | Running total of all component max-lengths + counter length. **Cannot exceed Maximum Identifier Length.** |
| Maximum Identifier Length | display-only | The cap (product code is 20 chars per `PRD-001`). |
| Components grid — Product Attribute | FK → Product Attribute Title/Value (`PRD-042`/`PRD-043`) | A structured product attribute used as an ID component. |
| Components grid — Text | literal text | A literal component, "in most cases … used as a delimiter to separate Product Attributes" (e.g. a hyphen). **Text and Product Attribute cannot both exist on the same grid row.** |
| Components grid — Maximum Length | int | **Product Attributes only.** Over-length values are **truncated left-justified** (max 5, data `123456` ⇒ `12345`). |
| Components grid — Fixed Length | checkbox | **Product Attributes only.** Zero-pads to Maximum Length (`123` ⇒ `00123`). |
| Components grid — Strip Text | text | **Product Attributes only.** Characters removed from the attribute before use (`123-45` with strip `-` ⇒ `12345`). |
| Promote / Demote | buttons | Reorder components. |

**Fields — User Defined Settings.** Same informational-only `Setting`/`Response`/`Select` grid; **no
processing occurs based on it.**

**Reconciliation.**
- **`ITEM-010` CONFIRMED again, from the group side**, including the "prior to creating your product records
  you must create your product groups" ordering and the "changing a product's group does not update existing
  orders" caveat.
- **`ITEM-011` CONFIRMED and substantially EXTENDED.** Our pack predicted group-level return-days
  (`CFG-GRP-RTNDAYS` — **confirmed, and it is named `Return Restriction Days`, range 1–999, blank = none,
  and it *tightens* rather than replaces the global**), GL mapping (**confirmed, with a three-level
  Group→Category→Global fallback**), replenishment policy (**confirmed, group overrides category**), and
  commission treatment (**not found at group level — commission lives on the product and on the
  commission matrix**). Additional group-level policy our pack does not have: restocking fee %, reduce-
  customer-returns %, installation charge, repossession flag + depreciation %, minimum gross profit %,
  zero-cost-retail %, twilight pricing, return reason-code restriction, lead tracking, as-is POS scan, route
  capacities, and the **auto-SKU format**.
- **Product Attributes vs User-Defined Fields — resolved.** `Product Attribute` values are **structured,
  referenced by other machinery, and can compose the product code**; `User Defined Settings` are explicitly
  **informational only, "no processing occurs"**. These are two entirely different concepts that happen to
  both look like "custom fields". Carry that distinction into our model.

**Dependencies.** `PRD-007` Category Settings (parent + fallback), `PRD-001` (Group field, Warranty
Categories, Shipping Volume), `PRD-042`/`PRD-043` Product Attributes, `PRD-019` Freight Distribution,
General Ledger Assigned Account Settings, POS Control Settings (`Post Line Discounts to General Ledger`,
`Allowed Number of Days on Returns`, `Restocking Fee on Returns %`), Costing Control Settings
(`Reduce Customer Returns by %`), Purchasing Control Settings (`Use Replacement Cost as Default`), Special
Order Control Settings, Inventory Control Settings (Product Identifier tab, `Next Product Number`,
Additional Settings reason codes), Reason Code Settings, Route Mapping Control Settings, Warehouse/Store
Location Settings, Retail Deck Control Settings, Sales Lead System Control Settings, Dynamic Escape Settings.
Security: **`Override Group Return Restriction Days`** (Sales Security) — add to
`parts/user-security-CATALOG.md` cross-reference.

**Build notes.**
- Group is where most policy actually lives. Our `PRODUCT_GROUP` settings scope must carry **at least** the
  fields above, and the resolver must implement **first-non-null wins with 0 as a real value** — that rule
  appears at least four times (zero-cost retail, restocking fee, lead days, min GP).
- **Steal `Return Restriction Days` as a tightening exception, not a replacement.** Same for restocking fee.
  Model global-and-scope as `(global_value, scope_override, override_semantics = TIGHTEN | REPLACE)` so the
  intent is explicit instead of implied by a paragraph of help text.
- **The Dynamic Identifier is worth building.** A composed SKU (`GROUP-COLLECTION-0012`) from validated
  product attributes with per-component truncation/padding/strip rules is genuinely useful for a mattress
  catalogue, and it is the concrete reason to make Product Attributes typed and validated. **But note
  `PRD-001`'s warning: the composed ID is generated once and never regenerates** — so make the composition
  rules versioned and record which rule version produced each SKU.
- **Do not replicate the RetailDeck "if no minor, assume the major is the group" fallback**, or any import
  fallback that silently maps a missing child key to a parent key. Fail the row and queue it for review.
- `[DECISION NEEDED]` — do we want **automatic lead creation-and-immediate-closure** for reporting
  completeness? It produces accurate funnel numbers but pollutes the lead table; recommend a derived
  "attributed sale" record instead of a synthetic lead.
- `[DECISION NEEDED]` — `Installation Charge` auto-adds a fee line to every retail order for the group.
  Confirm whether LA Mattress wants group-level automatic fees (delivery/haul-away/setup) here or modelled
  as non-inventory product linkage (`PRD-001`, Usage-Installation) — **STORIS supports both, which means two
  places to look when a fee is wrong. Pick one.**

---
### `PRD-023` Image Replication Service
*storis_ref: article 15294522840852*

**Purpose.** A Windows service that copies the STORIS Image Repository out into a plain folder structure on
a central server, on local PCs, and on the eSTORIS web server, because reading images from the repository is
slow.

**Where it lives.** Installed from the STORIS disc; configured from the **Windows Control Panel**, not from
inside STORIS. Configuration is under a **Global Configuration** tab with five sub-tabs.

**Fields / behaviour**

| Area | Detail |
|---|---|
| Replication Login tab | Server password, user name, server name, STORIS account name. `Test Connection` prompts for an account path such as `/Customer/AccountType/AccountName`. |
| Service Schedule tab | `Replication Schedule` = `Off` (**default**) \| `Daily`. Daily activates a run-time prompt in **24-hour `HH:MM`** format (16:00 = 4 pm). Setting Off and clicking OK **stops the service**; setting Daily and clicking OK starts it. |
| Replication Directory tab | Destination `Image Directory Root` on the local drive (**`PRODIMG` in the web root for the eSTORIS web server**). **Once populated you must also update the user's `storis.ini` record**, after which SCI retrieves images from that path instead of the repository. Required on any PC actually running the service. |
| Image Name | Defines the derived Windows filename. **Full path = `Image Directory Root` + brand code + size folder (large/standard/thumbnail) + (vendor model number \| model number) + `.jpg`.** |
| Logging tab | Errors-only or detailed; retention in days before purge. |
| View Log tab | Today's logs only. |

**Behavior & rules.**
- **Replication is incremental and time-based**: the repository stores each image's last-updated time; the
  service records when it last ran and copies everything updated since.
- **Folder structure is by Brand code, and under each brand three folders `Enlarged`, `Standard`, `Thumb`.**
  **This makes Brand part of the image storage key — changing a product's brand moves its images.**
- Auto Replication syncs the central and local directories to the newest version of each image.

**Reconciliation.** Relevant to `ITEM-070`. STORIS's managed-image mode is a **database repository plus an
out-of-band file replication tier**, which is exactly the architecture `ITEM-071`'s URL mode exists to avoid.

**Build notes.** **Do not build any of this.** Store images in object storage behind a CDN, addressed by a
stable immutable key (product UUID + size + content hash) that is **independent of brand and model number**,
and serve derived sizes on demand. Record the whole article as intentionally-not-implemented. The one thing
to carry over: the **three canonical sizes** (large / standard / thumbnail) and the fact that consumers pick
a size by name.

---
### `PRD-024` Image Wizard Settings
*storis_ref: article 15294555045652*

**Purpose.** Global settings for the **Update Product Images** (Image Wizard) routine: where replicated
images live, the auto-resize maxima for the three generated sizes, and how image filenames are derived.

**Where it lives.** `System Administration > System Settings > Merchandising and Distribution System
Settings > Image Wizard Settings`. **Many of these are also editable from inside Update Product Images.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Replicated Directory Path | path | Where the repository was replicated to. **Without it STORIS cannot find the directory.** |
| Large — Height, Width | pixels, **mandatory** | Auto-Format maxima. |
| Standard — Height, Width | pixels, **mandatory** | |
| Thumbnail — Height, Width | pixels, **mandatory** | |
| Image Item Name | enum, **"LOCKED - STORIS access ONLY!"** | `Product Number` \| `Vendor Model Number` — which one appears in the replicated filename. **Web-collection images always use the web collection ID instead.** |
| Use Kit Image If No Item Image | checkbox | See below. |

**Behavior & rules.**
- **Image lookup order — first hit wins: (1) the `STORIS.ini` file on the local PC (a local image
  directory), (2) the `Replicated Directory Path` from these settings, (3) the STORIS database.** Speed
  order is the reverse: local folder fastest, database slowest.
- **Auto-Format produces three `.jpg` renditions** (large, standard, thumbnail) on import when auto-sizing
  is on.
- **`0` height is used as a deliberate wildcard**: STORIS ships a default height of **zero** for large and
  standard, meaning height is unconstrained unless the width maximum is exceeded, in which case **height is
  reduced proportionally to preserve aspect ratio**.
- **`Use Kit Image If No Item Image`**: when a component has no image, the system searches its **kit
  masters, most recent kit first**, and returns the first kit-master image it finds; if none of the kit
  masters has an image, no image is shown.

**Reconciliation.** **Extends `ITEM-070`.** Our pack says "store originals plus derived thumbnails" — the
reference system has **three** named renditions and a documented **resolution chain with a kit-master
fallback**. Add both: (a) an image *resolution* function separate from image *storage*, and (b) the fallback
chain product → (kit master, most recent first) → none.

**Build notes.** Keep the resize maxima as configuration but express them as `{name, max_w, max_h}` triples
so a fourth rendition can be added without a schema change. **Reject the `0 = unconstrained` overload** —
use an explicit null. `[DECISION NEEDED]` — do we want the kit-master image fallback? For a mattress bundle
it is reasonable (show the set photo for the foundation); confirm with merchandising.

---
### `PRD-025` Inventory Formation Settings
*storis_ref: article 15294524800404*

**Purpose.** Builds a named, rule-based **set of products** by including and excluding whole dimensions.
Formations are the reusable "which products does this apply to?" primitive across STORIS.

**Where it lives.** `Actions` button in **Sales Discount Settings** and **Per Piece Delivery Charge
Settings** (also reachable from the product record's Related Inventory Formations action, `PRD-001`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Inventory Formation Code | code | Enter one, or click Add for a **system-generated code** — **the generated code is not displayed until you Save**. Once set, the Action button opens **Maintain Code** (`PRD-031`) to rename it. |
| Description | text, translatable | Defaults from the calling process when entered from another screen; blank when entered from the menu. |
| Product / Group / Category / Vendor / Brand | code FK, multi | **The five formation element types.** **Selecting any one of the five inactivates the other four and activates `Usage Action`** — you add one element type at a time. |
| Usage Action | enum | `Include` \| `Exclude`. Inactive until an element is chosen. |
| Grid | Type / Item / Action | The assembled rule set. |

**Behavior & rules.**
- Inclusions and exclusions may be added in any order; **on save the grid re-sorts to inclusions first, then
  exclusions, and within each block: brand → vendor → category → group → product** (broadest to narrowest).
- **Editing a formation that is already referenced silently changes what it matches**: "all products
  previously included in the formation may not be available in the formation."
- **Deleting a referenced formation warns but lets you continue — and on continue the program removes the
  formation from all discount codes before deleting it.** That is a destructive cascade behind a soft
  warning.
- `Inventory Formations With Discounts` in Report Builder lists which discount codes use a formation.

**Dependencies.** `PRD-026` (semantics), `PRD-031` Maintain Code, Sales Discount Settings, Per Piece
Delivery Charge Settings, `PRD-001` (Related Inventory Formations, installation-usage formations, web
related formations), Warehouse/Store Location Settings (`Formation - Include as Reserved`).

**Build notes.** This is a good primitive and we should have it — a **saved product predicate** — but:
- Make it **versioned and impact-aware**: before saving an edit, show what enters and leaves the set and
  what references it. STORIS's "may not be available" note describes a live footgun.
- **Never cascade-delete references behind a warning.** Deleting a referenced formation must be blocked
  until the references are cleared, or must be a soft-delete.
- Evaluate lazily (a predicate) rather than materialising a product list, so hierarchy changes propagate.

---
### `PRD-026` Inventory Formations Overview
*storis_ref: article 15294522840212*

**Purpose.** The semantics of formation membership. Concept article; **this is the one that defines the
evaluation rules**, so it matters more than its "overview" title suggests.

**Behavior & rules — membership semantics**

Elements: individual products, product categories, product groups, product vendors (and, per `PRD-025`,
brands). A product's status within one formation is one of:

| Status | Meaning |
|---|---|
| Explicitly Included | the formation includes the product, or its vendor/category/group. |
| Explicitly Excluded | the formation excludes the product, or its vendor/category/group. |
| Implicitly Included | the formation defines **only** exclusion criteria and the product is not excluded — i.e. "everything but". |

Three formation shapes: **all elements included** (whitelist), **all elements excluded** (blacklist —
everything else is in), **mixed**.

- **HARD RULE (within one formation): exclusion overrides inclusion.** Include Vendor 123, exclude Product
  ABC ⇒ ABC is not in the formation. Note this is *not* most-specific-wins; it is exclusion-wins regardless
  of specificity.
- **HARD RULE (across formations): the union wins, and exclusion does NOT carry across.** "If you define
  multiple inventory formations for a STORIS function… the discount code is valid for all products included
  in at least one of the inventory formations — **even if one of the formations excludes the products**."
  Worked example from the article: Discount A is assigned to Formation 1 (includes Product X) and Formation 2
  (excludes Product X) — **Product X still gets Discount A.** This is a genuine trap: adding a formation to
  restrict a discount can never narrow it, only widen it.
- Formations also drive add-on selling: linking a formation to a product pops an add-on-sale prompt when
  that product is added to an order (`PRD-001` Related Inventory Formations).
- **`Formation - Include as Reserved` in Warehouse/Store Location Settings** uses a formation to designate
  products that are **always considered reserved** when working with a third-party logistics company.

**Build notes.**
- Implement as a predicate: `included = (matches any include rule OR no include rules exist) AND NOT
  (matches any exclude rule)`, evaluated per formation; then **OR across formations** for a given consumer.
  Encode both rules in one well-tested function with the article's two worked examples as fixture tests.
- **Surface the cross-formation union rule in the UI.** Show, on any screen that attaches two or more
  formations, an explicit "effective product set" preview — otherwise someone will attach a second formation
  expecting an intersection.
- `[DECISION NEEDED]` — is union-across-formations actually what LA Mattress wants, or should multiple
  attached formations intersect? Recommend making the combinator explicit (`ANY` / `ALL`) per attachment
  rather than hard-coding STORIS's `ANY`.

---
### `PRD-027` Kit Promotion Settings
*storis_ref: article 15294524798740*

**Purpose.** Pre-stages promotional pricing for **component-priced soft kits** so a kit can be scheduled onto
several promotions at different times.

**Where it lives.** `System Administration > System Settings > Point of Sale System Settings > Pricing System
Settings > Kit Promotion Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Promotion Code | code, display | **Once the code has been loaded to the soft kit master, the promotion can no longer be changed.** |
| Description | ≤30 alphanumeric, **required**, multi-lingual | |
| Kit Master Product Number | product FK | **Must exist in Product Kit Settings; must be a soft kit master; must have `Source of Price = Component`.** Any of these failing gives a warning message. |
| Date to Load | date, **required** | **The adjustments are applied during the day-ending process on this date.** **It "cannot interfere with the End Date of another promotion", but it MAY equal that end date** (article example: promotion A ends 31 Jul 2019 ⇒ Date to Load cannot be before 31 Jul, but 31 Jul itself is allowed). |
| Start Date, End Date | date | **Cannot overlap another promotion for the same kit master** — warning if they do. |
| Promotion Loaded | date, display-only | Set when the promotion has been loaded into the soft kit master. |
| Component Product Number / Unit / Kit Component Quantity / Selling Price | display-only | Pulled from the kit. |
| Default Price | display-only | The kit's default selling price; **if none is available, the selling price is displayed** (mirrors the `Kit Selling Price` → `Selling Price` fallback of `PRD-009`). |
| Promo Price | money, per component | **Maximum 15 kit component promotional prices.** |
| This Kit Price | money, per component | **Maximum 15 kit prices.** |

**Behavior & rules.** **Kit promotion records are purged by the `Generate Monthly Reports` process according
to the `Promotional Pricing Retention Period` in Point of Sale Control Settings** — i.e. promotional history
is destroyed on a schedule by a *reporting* job. Flag that: an unrelated monthly job silently deletes pricing
history.

**Reconciliation.** Adds a scheduling layer to `PRD-009`/`ITEM-040`: a component-priced soft kit's promotion
is **staged in advance and activated by a batch job on a date**, not evaluated live from a date range on the
kit. **Two different promotion mechanisms therefore exist** (live date-range evaluation on the product per
`PRD-001`, and staged batch load here); their interaction is not documented.

**Build notes.**
- Model promotions **declaratively with effective date ranges evaluated at read time** — one mechanism, no
  batch "load" step, no `Promotion Loaded` flag, no "cannot change once loaded" lock. That removes the
  overlap-validation problem and the day-ending dependency at a stroke.
- **Never purge pricing history from a reporting job.** If retention is needed, archive, and make it an
  explicit data-retention policy with its own audit entry.
- The **15-component cap** is an implementation limit, not a business rule — do not reproduce it.

---
### `PRD-028` Lay-Z-Boy Settings
*storis_ref: article 15294524801684*

**Purpose.** Maintains the special-order option list for the EDI vendor code **`LAZY`**, feeding the
Special Order (La-Z-Boy) Entry screen.

**Where it lives.** `Merchandising and Distribution > Purchasing > Electronic Data Interface >
Lay-Z-Boy Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Options | code FK | Lookup is **the Product Configurator's Option lookup window** — La-Z-Boy options are configurator options. |
| Description | display | |
| Fabric Flag | checkbox | This option is a fabric type. |
| Color Flag | checkbox | This option is a color. |

**Behavior & rules — setup sequence.**
1. Create a **Vendor EDI Settings** record literally named `LAZY` and check **`Special Order CFO Pop-up`** —
   **a STORIS-locked field that only STORIS can set.**
2. Set `EDI Vendor Code = LAZY` on every vendor you want interfaced.
3. Result: **for all products using one of those vendors, the Special Order (La-Z-Boy) Entry screen appears
   during special order entry.**

**Reconciliation — relevant to `ITEM-060`.** Here is a concrete instance of the Frame/Color/Grade/Upholstery
idea: **`Fabric Flag` and `Color Flag` are booleans marking which option type an option represents.** It
confirms that STORIS classifies option semantics with flags on a generic option record, rather than having
fixed CFI columns. Reinforces the `ITEM-060` rewrite proposed in `PRD-001`.

**Build notes.** Vendor-specific; out of scope unless LA Mattress carries La-Z-Boy. Note the anti-pattern to
avoid: **a customer-visible behaviour gated behind a field only the vendor's support staff can set.**

---
### `PRD-029` Line Item Text
*storis_ref: article 15294522843284*

**Purpose.** Free text attached to a **product, product group, or product category** that prints on sales and
exchange documents.

**Where it lives.** `Actions` button in the **Product**, **Group**, or **Category** files (i.e. `PRD-001`,
`PRD-022`, `PRD-007`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| (text body) | **up to 8 lines × 40 alphanumeric characters per line** | Multi-lingual via the `Description Field - Language Translation Entry` action. |

**Behavior & rules.**
- **Printing requires adding the associated data element to the form in Forms Designer** — it does not print
  by default.
- **Resolution: "the Forms Designer searches for line item text using the above hierarchy and applies the
  first text found"** — i.e. **Product → Group → Category, first hit wins.** Confirms the hierarchy is a
  *resolution* chain, not additive.
- **The `Delete` button deletes all line item text including any multi-lingual text** — no per-language
  delete.
- **Text is not saved until you save out of the order-entry routine.**
- **On reprint of an open order or exchange, the CURRENT line item text prints, not the text from the
  original printing.** Documents are therefore not reproducible after a text edit.

**Reconciliation.** **Distinct from `ITEM-050` (product benefits) and from `ITEM-060` (PO line text).** Three
separate text channels exist: benefits (floor tags / consumer-facing), line item text (sales & exchange
documents, three-tier resolved), and PO line text (purchase orders). Our model should name all three and
keep them separate; do not collapse them into one "notes" field.

**Build notes.** Implement as a resolved-inheritance text field on the `PRODUCT | GROUP | CATEGORY` scopes
using the same resolver as everything else. **Snapshot the text onto the printed document** so a reprint
reproduces the original — the STORIS behaviour is defensible for open orders but unacceptable for anything
the customer signed.

---
### `PRD-030` List Configuration
*storis_ref: article 15294523891732*

**Purpose.** Builds named lists of valid configurator options and fabric groups, which are then assigned to
specific products to constrain what can be chosen.

**Where it lives.** `… > Product Configurator Settings > List Configuration`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code FK | **Lists are per-vendor.** |
| List | alphanumeric code, **up to 20 characters, unique** | Lookup shows previously created lists for this vendor. |
| Option Type | code FK → `PRD-036` | **The list belongs to exactly one option type.** |
| Other tab — Option Code | multi FK | Options included in the list; Add pushes each into the grid. |
| Fabric tab — Fabric Group | multi FK → `PRD-017` | Fabric groups included in the list. |

**Behavior & rules.** A list is a **whitelist of allowed values for one option type**, expressed either as
explicit options (Other tab) or as whole fabric groups (Fabric tab). Referenced by `PRD-011` Configurator
Sub-Option Rules as the right-hand side of `=` / `#` comparisons.

**Dependencies.** `PRD-011`, `PRD-017`, `PRD-036`, Product Configuration (pos. 47).

**Build notes.** Same generic primitive as inventory formations, applied to option values instead of
products: **a named, reusable value set**. If we build the configurator, build *one* "named value set"
mechanism and use it for both, rather than two.

---
### `PRD-031` Maintain Code
*storis_ref: article 15294523065620*

**Purpose.** (Article is a stub — four sentences.) Renames an inventory formation's code.

**Where it lives.** `Inventory Formation Settings > Action button at the Inventory Formation Code field`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Inventory Formation Code | code | The current code displays and can be overwritten. **Works for both system-generated and manually assigned codes, on new and existing formations.** |

**Behavior & rules.** Nothing else is documented — notably **not** what happens to existing references to
the old code.

**Dependencies.** `PRD-025`.

**Build notes.** Use surrogate keys with a separate mutable human code, so renaming is free and references
never break. Contrast with `PRD-001`'s permanent Product ID — STORIS is inconsistent about this, which is a
symptom of using the business code as the primary key in some files and not others. **We should never use a
user-editable business code as a primary key.**

---
### `PRD-032` Markdown Pricing
*storis_ref: article 15294469386260*

**Purpose.** Concept article defining how clearance markdown prices are set and how they win (or lose) at
order entry.

**Behavior & rules.**
- **HARD RULE — markdown is a "lower of" comparison, not a precedence step: "In order entry, if the program
  finds a markdown price for an order item, the program uses the markdown price unless the default price is
  lower, in which case it uses the default price."** So markdown does not sit at a fixed position in the
  `ITEM-040` chain; it is applied **after** the chain resolves a default price, and the **lower of the two
  wins**.
- Markdown prices can be set in exactly three routines: **Advanced Product Settings (Pricing tab)**
  (`PRD-001`), **District and Regional Product Settings (District Settings tab)** (`PRD-015`), and the
  **Single Product Review Screen (Product tab)**.
- **The Markdown Price field is active only when purchase status is `M` (Markdown), `D` (Dropped) or `T`
  (Discontinued)** — this article repeats the product-level rule and does **not** mention the district-level
  exception documented in `PRD-015` ("active regardless of purchase status"). **The two articles disagree;
  see the `[DECISION NEEDED]` list.**
- **Every edit stamps a date, displayed next to the price.**
- **HARD RULE: "simply assigning a purchase status of Markdown to a product does not establish a markdown
  price"** — the status and the price are independent; you must enter an amount.
- A **markdown list** of products newly moved to Markdown status is generated via **Process Merchandising
  Decisions**, and floor tags print from it.

**Reconciliation.** **Extends `ITEM-040` with a post-resolution step.** Correct sequencing appears to be:
1. resolve base price via the `ITEM-040` chain (with `ITEM-044` as-is and kit overrides above it);
2. apply the `ITEM-042` price matrix;
3. **if a markdown price exists, take `min(resolved_price, markdown_price)`.**
Step 3 is new and must be added to the resolver spec.

**Build notes.** Model markdown as a **price ceiling**, not a price. Implement it literally as
`min(resolved, markdown)` so it can never accidentally *raise* a price — which is exactly the failure a
naive "markdown wins" precedence rule would produce on a product that also has a deeper promotion.
**Decouple lifecycle status from markdown price** as STORIS does, but make the UI show clearly that setting
the status alone does nothing.

---
### `PRD-033` Option Configuration
*storis_ref: article 15294523895444*

**Purpose.** Creates the individual **options** (e.g. "white pillow", "large throw pillow") that belong to
option types in the Product Configurator.

**Where it lives.** `… > Product Configurator Settings > Option Configuration`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code FK | Options are per-vendor. |
| Option Key | **up to 15 alphanumeric** | |
| Option Description | text | **Displayed on the Special Order Configurator screen during order entry** — customer/salesperson facing. |
| Option Types | multi FK → `PRD-036` | **One option may belong to several option types.** |
| Options List | FK → `PRD-030` | Blank on initial creation; populated after List Configuration maintenance. |
| Grade | **10 characters** | Groups like-quality options sharing the same base price **when the option is entered as a primary option**. **MANDATORY if any of the option's option types has `Graded` checked in Option Type Configuration; optional otherwise** — a conditional-required driven by a flag on a *related* record. |
| Suite | code FK, optional | |
| Activate Sub-Options | checkbox, **default unchecked** | When checked, the sub-option entry window pops during configurator entry if the option type has sub-options. |
| Group | enum | `Other` \| `Fabric`. |

**Dependencies.** `PRD-036` Option Type Configuration, `PRD-030` List Configuration, `PRD-020` Grade
Description Configuration, `PRD-005` Base/Grade Configuration, `PRD-034`, `PRD-035`.

**Build notes.** Note the **`Fabric` / `Other` duality** that runs through the whole configurator (option
groups, list tabs, option types). It exists because fabrics carry grades and yardage and options do not. If
we build this, model it as one option entity with an optional "material" sub-record rather than a two-valued
enum that every screen has to branch on.

---
### `PRD-034` Option Grade Price Configuration
*storis_ref: article 15294523891988*

**Purpose.** Upcharge price/cost for configurator options **at the grade level** — all options of the same
grade share one price.

**Where it lives.** Product Configurator Settings (Access section is blank in the article).
**The remaining fields activate only once Vendor, Vendor Model, Option Type and Grade are all populated.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code FK | |
| Vendor Model | search by full or partial name | The base product. |
| Option Type | code FK | The option type the upcharge applies to. |
| Grade | code FK → `PRD-020` | |
| Regular Selling Price | money | **The upcharge**, not an absolute price. |
| Regular Cost | money | |
| Sale Starting Date / Sale Ending Date / Sale Selling Price | date/date/money | Dated sale upcharge. |
| Cost Sale Starting Date / Cost Sale Ending Date / Sale Cost | date/date/money | **Separate dated sale-cost window.** |

**Behavior & rules.** Key is **(vendor, vendor model, option type, grade)**. Contrast `PRD-035`, which is
keyed to an individual option. **Grade-level pricing is the coarser of the two mechanisms and the article
does not state which wins when both exist** — flagging as unresolved.

**Dependencies.** `PRD-035`, `PRD-020`, `PRD-036`, `PRD-005`.

**Build notes.** Same shape as `PRD-005` and `PRD-035`: a small pricing table with paired regular/sale price
and regular/sale cost windows. Build **one** "dated price+cost" value object and reuse it across all of
them (and across the product's own promotion fields) instead of six near-identical tables.

---
### `PRD-035` Option Price Configuration
*storis_ref: article 15294470269844*

**Purpose.** Upcharge price/cost for a **specific option** on a **specific base frame**.

**Where it lives.** `… > Product Configurator Settings > Option Price Configuration`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code FK | |
| Base Frame | vendor model code | |
| Option Type | code FK | |
| Option | code FK | **This is the difference from `PRD-034`: keyed to the individual option.** |
| Regular Selling Price / Regular Cost | money | The upcharge and its cost. |
| Sale Starting Date / Sale Ending Date / Sale Selling Price | date/date/money | |
| Cost Sale Starting Date / Cost Sale Ending Date / Sale Cost | date/date/money | |

**Behavior & rules.** With Regional Processing, the **District Pricing** action sets regular and sale pricing
by district at this key — **so configurator upcharges have a district scope too**.

**Reconciliation.** Reinforces the `PRD-005` finding: **the district scope of `ITEM-045` extends beyond the
product record to configurator base prices and option upcharges.** If we implement any configured pricing,
the district scope must apply to all of it, not just to products.

**Build notes.** See `PRD-034`. `[DECISION NEEDED]` — resolution order between `PRD-034` (grade-level) and
`PRD-035` (option-level) upcharges is undocumented; most-specific-wins (option beats grade) is the sane
assumption but must be confirmed before migration.

---
### `PRD-036` Option Type Configuration
*storis_ref: article 15294523898516*

**Purpose.** Defines the **option types** (main fabric, fringe fabric, throw pillow…) that a product frame
can be configured with, including whether the type is graded and what sub-options it has.

**Where it lives.** `… > Product Configurator Settings > Option Type Configuration`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code FK | Option types are per-vendor. |
| Option Type | code | |
| Description | text | **Displays on the Special Order Configurator screen during sales order entry.** |
| Group | enum | `Fabric` \| `Other`. |
| **Graded** | checkbox, **default unchecked** | **Determines where the configured item's BASE price comes from: checked ⇒ the base price is taken from Base/Grade Configuration (`PRD-005`); unchecked ⇒ the base price is the product's selling price.** This is a genuine branch in the pricing engine controlled by a checkbox on a code table. |
| Sub-Options — Option Type | code FK | The nested option type. |
| Sub-Options — Required | checkbox, **default CHECKED** | Whether the sub-option prompt is mandatory on the configurator screen. |
| Sub-Options — Lists | FK → `PRD-030` | Blank until List Configuration maintenance is done. |
| Sub-Options — Default | value | Optional; **must belong to the list for this sub-option**. |
| Enter Rules | action | Opens `PRD-011` Configurator Sub-Option Rules. |

**Behavior & rules.**
- **HARD RULE / ORDERING: "For upholstery, an option type representing the main or primary fabric must be in
  the first position of the Product Configurator."** Position is semantically load-bearing.
- Historical note: **the primary-fabric option type no longer has to be named `BAL`** as it did in earlier
  revisions — worth knowing for data migration from an older STORIS install.

**Reconciliation.** **This is the strongest evidence for the `ITEM-060` rewrite.** Frame / Color / Grade /
Upholstery are not four fixed CFI fields; they are **user-defined, per-vendor option types**, one of which
must be positioned first, each optionally graded, each with sub-options and rules. Update `ITEM-060`
accordingly and reference `PRD-001`, `PRD-003`, `PRD-028`, `PRD-033`, `PRD-036`.

**Build notes.** If built: option types are an **ordered list per product/frame**, with position 1 special.
Make "primary" an explicit boolean rather than an implicit position — implicit position rules break on every
reorder. `Graded` should be an enum `BASE_PRICE_SOURCE = PRODUCT | GRADE_TABLE`, not a checkbox.

---
### `PRD-037` Prep Code Settings
*storis_ref: article 15294524821268*

**Purpose.** The prep-code table — codes indicating preparation work required for a product on a sales,
exchange or service order line.

**Where it lives.** `Point of Sale > Settings > Prep Code Settings`; `Inventory > Settings > Prep Code
Settings`; `Logistics > Settings > Prep Code Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Prep Code | **max 10 alphanumeric** | |
| Description | text | |
| Active | checkbox, **default checked** | Deactivating removes it from selection lists. |

**Behavior & rules.**
- **Prep code information on order lines is transmitted to warehouse management for internal prep-label
  print processes.**
- **Deactivation is NOT retroactive on transactions: "If a prep code has been added to an open transaction
  during sales order entry, but is subsequently deactivated, it will not be removed from the transaction
  automatically and will still show in the list of selected prep codes."**
- **HARD RULE: "If you attempt to deactivate a prep code which has been assigned to a product in Advanced
  Product Settings, you will be prevented from proceeding and an error message will display."** So the
  product reference is a *hard* block while the transaction reference is *not* — an inconsistency worth
  noting.

**Dependencies.** `PRD-001` (Prep `Code`, `Prompt User in POS`), warehouse management prep labels.

**Build notes.** Good, small pattern to copy: **referential integrity on deactivation of master data**. Make
it uniform though — check *all* live references (products, open orders, templates) and present the blocking
list, rather than blocking on one reference type and ignoring another. Prep codes are directly applicable to
mattress retail (law-tag check, leg attachment, unwrap-and-inspect, haul-away prep).

---
### `PRD-038` Price Adjustment Clone Process
*storis_ref: article 15294469389972*

**Purpose.** Creates a new price adjustment (promotion) code by duplicating an existing one.

**Where it lives.** `Price Adjustment Settings > General tab > Actions > Clone Info for New Price
Adjustment`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| New Adjustment Code | code | The new code. On save, the new record is created with **all field data duplicated from the original**, then displayed for editing. |

**Behavior & rules.** Straight copy-then-edit. **Unlike `PRD-010` (Configurator Clone), no preconditions are
documented** — in particular nothing says the target must not already exist.

**Dependencies.** `PRD-039` Price Adjustment Settings.

**Build notes.** Worth having — promotions are almost always built from last year's. Ours should copy the
*definition* but deliberately **null the dates and the loaded/applied state**, so a cloned promotion can
never go live on the old promotion's schedule by accident. Log the clone lineage (`cloned_from`) for audit.

---
### `PRD-039` Price Adjustment Settings
*storis_ref: article 15294555043092*

**Purpose.** The mass price-change tool: select a population of products by vendor/group/category/collection/
purchase-status/district, define an adjustment formula, preview and tune the resulting prices per product,
and load them either immediately or on a future date. This is the primary bulk-pricing screen and the second
most important article in my half.

**Where it lives.** `System Administration > System Settings > Point of Sale System Settings > Price
Adjustment Settings`. Tabs: **General, Adjustments, Products, Import/Export**. **A read-only version appears
depending on how the screen is reached, and also whenever a loaded adjustment code is opened.**

**Fields — header (on every tab)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Adjustment Code | ≤10 alphanumeric | **HARD RULE: "Once an adjustment code has been created, it cannot be deleted."** Selecting an already-loaded code opens the read-only version. |
| Type | display | Mirrors the Type field below. |
| Adjustments Loaded | display date | When the selected products were loaded with this adjustment. |
| Tags Printed | display date | Last date tags were printed for this adjustment. |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Description | ≤30 alphanumeric | |
| Type | enum | **`PP` Promotional Price** (updates the Promotional Pricing fields in the Product **and Product Subsidiary Regional** files, for the Starting/Ending date range) \| **`SP` Selling Price** \| **`SR` Suggested Retail** \| **`RC` Replacement Cost** (updates the **Costing Table** and the Product file) \| **`DC` Discount Code** (applies a single discount code to a product). **`RC` only appears if the logged-on user has `View and access product cost information` in Extended Security** — reuse `SEC-COST-VIEW`. |
| Vendor / Group / Category / Collection / Purchase Status | multi FK | Population selectors; **several may be combined** (e.g. Vendor and Group). **If you select a population here but list no individual products on the Products tab, `Load Adjustments` warns and offers to abort or to proceed for all selected products.** |
| Include Products with Inactive Purchase Status | checkbox | Includes obsolete products — **defined as purchase status `D` (dropped), `T` (discontinued) or `P` (purge)**. **Inactive when the Purchase Status field is populated.** |
| Include Zero Quantity | checkbox | Includes products with **both** zero quantity-on-hand and zero net PO quantity. |
| Discountable Only | checkbox | **Active only for Type `PP`.** |
| Product Type | enum | `All Products` \| `Retail products` \| `Service Only Products`. **For Type `PP` the system forces `Retail Products` and inactivates the field**, because promotions can never apply to service-only products. |
| Change District Price | checkbox | **Active for `PP`, `SP`, `SR` only.** **Inactive if Purchase Status is populated at the product level.** |
| District | code FK | Requires `Change District Price`. Updates the **Product Subsidiary Regional** record for each product in the district. |
| Date to Load | date | **The `Generate Daily Reports` process loads adjustments that are within one day of this date — a 27/01 date is loaded by the run on 26/01.** **If populated, `Load Products` on the Products tab is unavailable** (documented workaround: run Load Products first, then set Date to Load before saving). |
| Starting Date / Ending Date | date | **Type `PP` only.** Start ≥ today; End > Start. |
| Commission Percent / Spiff Amount | percent / money | **Type `PP` only. Used only if no individual Price/Spiff/Commission table exists for the product** (`PRD-041` wins). |

**Fields — Adjustments tab** (updates product Pricing-tab fields `Promotion Code`, `Sale Starting Date`,
`Sale Ending Date`, `Promotion Selling Price`)

| Field | Type | Purpose / business rule |
|---|---|---|
| Type | enum | `Dollars` \| `Percent`. |
| Percentage / Amount | numeric, default 0 | **The field is renamed by the Type selection.** |
| Direction | enum | `Increase` \| `Decrease`. **Default is `Increase`** — a bulk *price-cut* tool that defaults to raising prices. |
| Discount Code | ≤6 alphanumeric | **Required for Type `DC`.** Must exist in Sales Discount Settings, be set up as a **product discount**, and have **`Automatically Apply as a Product Discount`** set. |
| Rounding Method | enum | `None` \| `Up` \| `Down` \| `Nearest`. |
| Round To | enum | `penny` \| `dime` \| `dollar` \| `ten` \| `hundred` \| `thousand`. **Mutually exclusive with `End In`.** |
| End In | money | Charm-price target (same $24.31 → $24.99 / $23.99 examples as `PRD-007`). |
| Basis | enum | `Suggested Retail Price` \| `Selling Price` \| `Replacement Cost` (cost types only for the cost adjustment type). **Basis values are pulled from Advanced Product Settings, unless `Change District Price` + `District` are set, in which case they are pulled from District and Regional Product Settings.** |
| | | **These three rounding options also apply to two other places: the new price when the `Code` (discount) field on the product Pricing page changes, and the new price when the `Promotion Code` on the District Settings tab changes. They do NOT apply to Import External Data or RetailDeck Control Settings.** |

**Fields — Products tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | code FK | Individually added products, or bulk-loaded via `Load Products`. Vendor model number is accepted in this field too. |
| Basis / Current / Adjusted | money, computed | `Current` is **blank when no promotion is currently active**. `Adjusted` is calculated but **manually overridable; the override must be greater than zero.** |
| Trailing Credit Amount | money $0.01–$999,999.00 | **Required if a Trailing Credit GL Account is entered.** |
| Trailing Credit GL Account | GL account | Written to `General Ledger Account 1` in the product's Rebate/Trailing Credit section. If an amount is given with no account, the `Trailing Credit` account from General Ledger Assigned Account Settings is used. |
| | | **HARD RULE: "Pricing for soft kit masters cannot be adjusted using this process. Promotional pricing is not permitted with products designated as soft kit masters."** (Which is exactly why `PRD-027` Kit Promotion Settings exists.) |
| | | Before adding a product when `Change District Price` is checked, **the District field must be populated**. |

**Fields — Import/Export tab.** Round-trips the Products grid through Excel. Columns:
`A Product Number`, `B Description`, `C Basis Price`, `D Current Price`, `E Adjusted Price`,
`F Calculation Basis`, `G Vendor Model`, `H Brand`, `I Group`, `J Category`, `K Trailing Credit Amount`,
`L Trailing Credit GL Account`, `M Collection`. **Only columns A (Product Number) and E (Adjusted Price) are
required and only those two are used on import** — the rest is informational. **The file must be CSV with
values quoted and comma-separated.** Import **overwrites** the grid, validates every product code, re-reads
description/basis/current from the Product or Costing Table file, and confirms uniqueness. **Any error fails
the whole import.** **Once an adjustment is complete the Actions options go inactive and you can no longer
export or import that record** — clone it instead.

**Behavior & rules.**
- **HARD RULE: "Products with a Markdown status are not included in the price adjustment process because a
  specific markdown price has already been established for the product."** Markdown products are immune to
  bulk repricing.
- Floor tags for the adjusted set print via the `Product Adjustment` field in `Print an Inventory Floor Tag`.
- For `SP`/`SR` types, `Create Floor Sample Label Queue on Product Change` (Warehouse/Store Location
  Settings) decides per location whether a floor tag hits the label queue.

**★ THE STATED PRICING HIERARCHY — CONTRADICTS `ITEM-040`. ★**
The article states, in the District field's note, the order STORIS actually uses:

> Use price from **pricing matrix** → Use **district promotional price** → Use **product promotional price**
> → Use price from **warehouse inventory** → Use **district standard price** → Use **product standard price**

Compare `ITEM-040` (from FAQ answers): district promo → product promo → **price table matching customer price
category** → **highest value in price table** → location selling price → district selling price → product
selling price.

**Two material differences:**
1. **The pricing matrix is FIRST here, above both promotional prices** — in `ITEM-040` the customer-dependent
   steps are third and fourth, *below* the promotions. This inverts the customer-vs-promotion precedence.
2. This list has **six** steps and does not separate "price table match" from "highest price-table value";
   `PRD-041` shows those are two behaviours of one mechanism, so the two lists can be reconciled on that
   point — but not on the position of the matrix.

Also stated here: **"if a district price exists for a product included in an adjustment, the district price
always takes precedence over the product promotional price. The district price does not reflect any
promotional or price adjustment."**

**Reconciliation.** `ITEM-040` must be re-derived from reference material, not FAQ answers.
**`ITEM-041` is CONFIRMED in spirit** — the matrix step is customer-dependent and therefore skippable — but
if the matrix is genuinely step 1, then a customer-less price book diverges from the order price far more
often than `ITEM-041` implies. Also note `PRD-041`'s rule that a promotion competes with the table price by
**lower-of**, not by precedence, which is a third description again.

**Dependencies.** `PRD-001`, `PRD-015`, `PRD-041`, `PRD-032`, `PRD-038` (clone), `PRD-040` (actions), Sales
Discount Settings, Generate Daily Reports / Day-Ending, Print an Inventory Floor Tag, Warehouse/Store
Location Settings, General Ledger Assigned Account Settings, Extended Security (`View and access product
cost information` = `SEC-COST-VIEW`).

**Build notes.**
- We need this tool. Build it as: **saved population predicate (reuse inventory formations, `PRD-025`) +
  adjustment formula + preview grid + scheduled effective date.**
- **Default `Direction` to `Decrease`**, or better, force an explicit choice with no default.
- **Do not make adjustment codes undeletable and un-editable after load.** Make price changes *effective-
  dated records* that can be superseded and reversed, with the reversal audited. STORIS's "load" model —
  destructively overwriting product fields on a date via a nightly report job — is the root cause of half
  the awkwardness on this screen (no delete, no edit, clone-to-fix, no re-export).
- Keep the **markdown immunity** rule; it is correct and prevents clearance prices being clobbered.
- Keep the **preview grid with per-product override**; that is genuinely good and should be mandatory before
  any bulk price change commits.
- `[DECISION NEEDED]` — resolve the `ITEM-040` ordering contradiction before the price resolver is written.
  This is a blocker, not a nicety.

---
### `PRD-040` Price Adjustments - Actions
*storis_ref: article 15294469392020*

**Purpose.** Documents the Actions-button options on each tab of Price Adjustment Settings.

**Actions — General tab**

| Action | Behaviour |
|---|---|
| **Load Adjustments** | Immediately applies the price/cost adjustments: checks all mandatory controls, files the record, and stamps the Price Adjustment record with today's date as the loaded date. **HARD RULE: "After you load adjustments for an adjustment code, you can no longer edit the adjustment code."** Clone to reuse. **Unavailable when (a) `Date to Load` contains a date — then loading happens in the Day-Ending process on that date — or (b) `Percentage / Amount` on the Adjustments tab is not greater than 0.00.** |
| **Clone Info for new Price Adjustment** | Prompts for a new Adjustment Code and duplicates the record. **Valid for existing records whether or not they were loaded.** **When cloning a loaded adjustment, the system clears all loading, tag-printing and active-date information.** The screen enters Inquiry mode when a loaded adjustment is opened in Maintenance mode, and this action stays available there. |

**Actions — Products tab**

| Action | Behaviour |
|---|---|
| **Load Products** | Populates the grid from the General-tab criteria. **Destructive: "This process removes any existing products from the grid and replaces them."** Applies the Adjustments-tab formula to each so you can experiment. **"This process does not load the current product adjustments"** — populating the grid is not the same as committing. **Unavailable when `Date to Load` is populated.** |

**Actions — Import/Export tab**

| Action | Behaviour |
|---|---|
| **Export to Excel** | Exports the five grid columns plus informational columns F–M (Calculation Basis, Vendor Model Number, Brand, Product Group, Product Category, Trailing Credit Amount, Trailing Credit GL Account, Collection). Warns if the file exists but proceeds. |
| **Import from Excel** | **Uses only column 1 (product code) and column 5 (adjusted price/cost)**; those two are the only required columns. Overwrites the grid, validates each product code, re-reads description/basis/current from the Product or Costing Table file, confirms uniqueness. **"Any error in the process causes the import to fail"** (all-or-nothing). **File must be CSV with quoted, comma-separated values.** |

**Build notes.** Two patterns to keep — **all-or-nothing import validation** and **clone-clears-state** — and
two to drop: the **immutable-after-load** record, and **"Load Products" silently wiping a hand-curated
grid** (should be an explicit replace/merge choice). Our bulk-price tool should have a genuine
**dry-run → review → commit → reversible** lifecycle.

---
### `PRD-041` Price/Spiff/Commission Table
*storis_ref: article 15294469387156*

**Purpose.** The per-product **price table** — tiered price levels, each optionally carrying a spiff amount
and a commission percentage, plus a price category for customer-class matching and lock rules that bound
what a salesperson may type. **This is the mechanism behind `ITEM-040` steps 3–4 and it is materially
different from the Price Matrix of `ITEM-042`.**

**Where it lives.** `Advanced Product Settings > Pricing page > Actions button`. **A read-only version exists
for view-only routes.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | display | Defaults from the calling screen. |
| Replacement Cost | display | Shown for reference when setting levels. |
| Price Level | money | **The cutoff price for the level. The level applies when the sale price is ≥ this amount and < the next highest Price Level.** |
| **Lock Price Table** | enum | `Top` (block prices above the highest table price — e.g. the highest advertised price) \| `Bottom` (block prices below the lowest — "preventing the item from being given away") \| `Neither` \| `Both`. **This is a per-product price floor/ceiling enforced in Sales Order Entry.** |
| Price Category | **≤5 alphanumeric** | Matched against the **customer record's `Class` code** (see below). |
| Spiff Amount | money | Paid when sold at ≥ this Price Level. |
| Commission Percentage | percent | Paid when sold at ≥ this Price Level. |
| Calc Method | enum | `Selling Price` (percentage × selling price) \| `Gross Profit` (percentage × gross profit amount). |

**Behavior & rules — price defaulting in Sales Order Entry**
1. **No table ⇒ the regular selling price is used, as normal.**
2. Table present:
   a. **"The system checks the customer record `Class` code. If a Class code is present in the customer
      record and that class matches the `Price Category` field in the price table, the selling price defaults
      to the corresponding price level from the table."**
   b. **"If the customer record does not contain a class that is also present (as a Price Category) in the
      price table, the system uses the HIGHEST price level from the table as the default selling price."**
3. **"If a sales promotion is in effect for a product, the system determines the selling price as the LOWER
   of the promotional price or the default table price based on the customer class."**
4. The salesperson may open the table from Merchandise tab → Actions → Price/Spiff/Commission Table and pick
   a level; manual override beyond that is subject to system settings and to `Lock Price Table`.

**Behavior & rules — commission and spiff**
- **"If a price table is present, the system ALWAYS bases commission on information from the table for the
  product"** — the table overrides the normal commission derivation entirely.
- **Selecting a promotional price still takes commission/spiff from the table.**
- **Soft kits: commission per component line is computed by running the KIT selling price against the table.**
- **Hard kits: commission/spiff come from the KIT MASTER's table.**
- **Giveaway guard: "To ensure that a negative commission is charged on 'giveaways', include a zero sell
  price line at the bottom of the table with a Gross Profit calculation method."**
- **Spiff timing is go-forward only, at order-entry time.** An order created before a spiff edit but
  completed after it does **not** pick up the new spiff; to apply it you must re-enter the line.
- Editing commission/spiff here does not touch existing orders; fix them via the **Commission/Spiff Updates
  Screen** (Sales Order Entry → line → Actions → Additional Line Item Details → General → Actions) or by
  re-entering the lines.
- **Spiffs entered on the Commission/Spiff Updates Screen override the Spiff Table Entry Screen — EXCEPT for
  as-is pieces, where the Spiff Table Entry Screen wins.**

**Spiff hierarchy for as-is pieces (first match wins):**
1. Any **user-overridden** spiff amount
2. The **As-Is Piece spiff table** — **as-is kit components skip this level but honour the rest**
3. The **District spiff table** for the product (`PRD-015`)
4. The **Pricing level spiff table** — note: **if the piece has an As-Is Piece spiff table, that spiff is
   used but the COMMISSION still comes from the Pricing Level table** (spiff and commission can resolve at
   different levels)
5. The **Product spiff table**

**The Reason Code Spiff Table is ADDITIVE — "added as a separate additional spiff to the spiff determined in
the above hierarchy."**

**Reconciliation — important.**
- **`ITEM-040` steps 3 and 4 CONFIRMED almost verbatim**, including the "highest value in the price table
  when no entry matches" fallback.
- **CONTRADICTION on the customer-side key.** `ITEM-040`/`ITEM-042` say the customer's **Price Category**.
  This article says the customer's **`Class` code**. `PRD-001`'s `Price Code` field says the product's Price
  Code pairs with "the `Price Category` field in the Customer record to access the **Price Matrix** file".
  **Reading these together: STORIS has TWO customer-keyed pricing mechanisms — (a) product `Price Code` ×
  customer `Price Category` → Price Matrix (`ITEM-042`), and (b) the product's Price/Spiff/Commission table's
  `Price Category` rows × customer `Class` (this article).** Our pack conflated them. Split them.
- **CONTRADICTION on promotion precedence.** Here a promotion competes with the table price by **lower-of**;
  `PRD-039` says the district price "always takes precedence over the product promotional price"; `ITEM-040`
  says strict precedence. Three descriptions, three different rules.
- **NEW, not in the pack: `Lock Price Table`.** A per-product enforced floor/ceiling on the price a
  salesperson can enter. This is distinct from the price variance % of `PRD-001` (which measures deviation
  and raises exceptions) — Lock is a hard bound. Both exist simultaneously.
- **NEW: commission calc method `Selling Price` vs `Gross Profit`, and the negative-commission giveaway
  guard.**

**Dependencies.** `PRD-001` (Pricing page, `Price Code`, commission fields), `PRD-015` (district spiff
table), `PRD-039` (`Commission Percent`/`Spiff Amount` used only when no table exists), Spiff Table Entry
Screen (pos. 68), Commission Settings / Commission Matrix, Customer record `Class`, POS Control Settings
(`Calculation Code`/Method), Reason Code Spiff Table, `ITEM-044` as-is pieces.

**Build notes.**
- The price table is a **tiered lookup with two independent consumers** (price defaulting and incentive
  calculation). Model it once, expose two pure functions: `defaultPrice(product, customerClass)` and
  `incentive(product, actualPrice)` — because the tier used for commission is the tier containing the
  **actual sale price**, not necessarily the tier used to default.
- **Implement `Lock Price Table` as a hard constraint in the pricing service, not the UI.**
- **Adopt the giveaway guard as a first-class feature**, not a modelling trick: an explicit "commission on
  below-floor sales" rule rather than "add a zero row with GP method".
- **Fix the spiff timing.** "Applied at order entry, never updated" is a support burden; ours should
  evaluate incentives at order *completion* against the rules effective on the order date, and store the
  computed values with their inputs.
- `[DECISION NEEDED]` — do we keep **two** customer-keyed pricing mechanisms (Price Matrix and price table),
  or collapse to one? Recommend one: a customer-tier dimension on the product price table. Confirm what LA
  Mattress actually uses (contract/trade pricing, employee pricing, etc.).

---
### `PRD-042` Product Attribute Title Settings
*storis_ref: article 15294555044628*

**Purpose.** Defines **attribute titles** — `Color`, `Comfort Level`, `Bed Size` — optionally with an
enumerated, ordered list of permitted values. **This is STORIS's structured product-attribute model, as
opposed to the free-text User Defined Settings.**

**Where it lives.** `System Administration > System Settings > Companion Application System Settings > Web
System Settings > Product Attribute Title Settings`. **Note the location: attributes live under *Web*
settings, not under Inventory Hierarchy.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Attribute Title ID | numeric, **system-assigned** | Click Plus to create. |
| Description | text, **mandatory**, translatable | **"The text you enter here appears on the web as the heading for the product attributes listing."** |
| Enumerate Attribute Values | checkbox | Checked ⇒ values come from the enumeration grid. **"If you do not specify values, you cannot save this title with the box checked."** Unchecked ⇒ **values are entered as free-form text when the attribute is linked to a product.** |
| Attribute Value ID | numeric FK → `PRD-043` | **Mandatory when `Enumerate Attribute Values` is checked.** Action button offers Product Attribute Value Lookup and inline Product Attribute Value Settings. |
| Grid | ordered list | **Order is meaningful and maintained with promote/demote buttons.** |

**Behavior & rules.**
- **Attributes are linked to products via a `Product Family`** (position 49, `product-settings-b`) — **not
  directly to a product.** That is a significant structural fact: the product-attribute model hangs off
  product families.
- **Deletion protection: an attribute title in use by a Product Family cannot be deleted, and the message
  lists the product families using it.** Likewise **a value cannot be removed from a title while the
  attribute is in use with a Product Family.**

**Reconciliation — answers the assignment's question directly.**
**Product Attributes vs User-Defined Fields in STORIS:**

| | Product Attributes (`PRD-042`/`PRD-043`) | User Defined Settings (tab on `PRD-001`, `PRD-007`, `PRD-008`, `PRD-022`) |
|---|---|---|
| Values | Optionally **enumerated and ordered**, else free text | Free text, with optional predefined responses |
| Attached to | **Product Family**, then to products | Directly to product / group / category / collection |
| Consumed by | **The web product-attribute listing** and **the Dynamic Identifier SKU composer** (`PRD-022`) | **Nothing — "for information only; no processing occurs"** |
| Referential integrity | **Enforced; cannot delete while in use** | None documented |

**Build notes.**
- Build **one** typed attribute system: `attribute_definition(code, label, data_type, enumerated?, ordered
  values[], unit)` + `product_attribute_value`. Support `TEXT | NUMBER | ENUM | BOOLEAN | DIMENSION`.
- **Attach attributes to the product directly**, with defaults inheritable from group/category, rather than
  routing everything through a Product Family. Product families should be a *grouping* of variants, not the
  only carrier of attributes.
- Keep the **deletion protection with an explanatory list of dependents** — that is exactly the pattern our
  master-data screens need everywhere.
- Attributes are the right home for mattress-specific facts: comfort level, height/profile, size, cover
  material, coil count, warranty years. They must be **filterable and reportable**, which is precisely what
  the STORIS User Defined Settings are not.
- `[DECISION NEEDED]` — do we allow free-form (non-enumerated) attribute values at all? Recommend no:
  enumerate everything, and add values through a governed process. Free text here becomes unfilterable data.

---
### `PRD-043` Product Attribute Value Settings
*storis_ref: article 15294524815252*

**Purpose.** The value side of the attribute model — `Extra Firm`, `Firm`, `Soft` — created independently
and then attached to titles.

**Where it lives.** `System Administration > System Settings > Companion Application System Settings > Web
System Settings > Product Attribute Value Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Attribute Value ID | numeric, **system-assigned** | Plus button to create. |
| Description | text, **mandatory**, translatable | The displayed value. |

**Behavior & rules.** Values are a **global pool**, not owned by a title — the same value record can be
attached to multiple titles via `PRD-042`. **If a title has no values specified, values are entered as
free-form text when the attribute is linked to a product via Product Family Settings.**

**Dependencies.** `PRD-042`, Product Family Settings (pos. 49), `PRD-022` (Dynamic Identifier components).

**Build notes.** A global value pool shared across titles is a modelling smell — "Firm" as a comfort level
and "Firm" as a pillow type are different things that will end up sharing a record and then diverge. **Scope
values to their attribute definition.** Keep the translatable description.

---
### `PRD-044` Product Benefit Settings
*storis_ref: article 15294555057556*

**Purpose.** Bulk entry screen for **product benefits text** — the consumer-facing selling copy that prints
on floor tags.

**Where it lives.** `… > Inventory Hierarchy Settings > Product Information Settings > Product Benefit
Settings` (7 paths). Also reachable via the **Actions button in the Product (Quick) and Advanced Product
(Full) routines**. **A read-only format exists.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | code FK | A product-list counter appears beside it showing position in an active list. |
| Benefits Text | multi-line text, scrolling | See sequencing rule below. |

**Behavior & rules.**
- **HARD RULE — line breaks are semantically significant and define addressable sequence numbers:**
  "Everything you enter in the text box up to the point you first press the Return key is considered
  **sequence 1**. Once you press the Return key, the next line of text entered until you press the Return key
  again is **sequence 2**, and so on."
- **Those sequence numbers are the addressing scheme used by the Product Benefits import and by label/form
  design** — a tag design references benefit line 2 by number. **So reflowing someone's benefit text
  silently re-points every label that references a line number.**
- Intended content: fabric and grade options, warranty information, cleaning/care instructions.
- Action: `Language Translations`.

**Reconciliation.** **`ITEM-050` CONFIRMED and EXTENDED.** Our pack has product benefits as a free/rich-text
field printing on floor tags, editable from product maintenance and from a group-level bulk editor, with
per-product override of group default text. Reality:
- **CONFIRMED**: free text, prints on standard floor tags, editable from the product screens and from this
  dedicated bulk screen.
- **NOT FOUND**: any **group-level** benefits text or group default with per-product override. Benefits are
  **product-scoped only** in the reference screens. (`PRD-008` has collection-level `Web Benefits` and
  `PRD-001` has an eBridge `Web Benefits` — both web-only and separate from this field.) **Flagging: the
  `ITEM-050` claim of group-level default benefit text with product override is not supported by the
  reference documentation.** Either it comes from a screen in the other half of the section, or the FAQ
  source was wrong.
- **NEW and important**: **benefits text is a numbered sequence of lines, not a blob** — and label designs
  bind to those numbers.
- **NEW**: editing benefits text **queues a floor tag** for on-hand floor samples when `Create Floor Sample
  Label Queue on Product Change` is enabled (from `PRD-001`).

**Dependencies.** `PRD-001` (Product Benefits action, floor-sample label queue), Print an Inventory Floor
Tag / Print a Bar Code Floor Tag, Design Enhanced Laser Forms, Product Benefits import.

**Build notes.**
- **Model benefits as an ordered list of lines with stable IDs**, not a text blob whose meaning depends on
  where the user pressed Return. Labels bind to line IDs; reordering is then explicit and safe.
- Support **inheritance from group/category with product override** even though STORIS does not — for a
  mattress retailer, care instructions and warranty text are genuinely group-level, and re-typing them per
  SKU guarantees drift. This is a deliberate divergence from STORIS; record it as such.
- Keep the **label-queue side effect**: any change to description, selling price, SRP or benefits on a
  product with on-hand floor samples must queue a tag reprint.
- `[DECISION NEEDED]` — confirm with merchandising whether benefits should be authored per SKU, per group,
  or both (with override). This determines the data model and cannot be retrofitted cheaply.

---
## Cross-cutting findings for positions 1–44

### A. Reconciliation summary against `01-item-model-and-costing.md`

| Pack ID | Verdict | Where |
|---|---|---|
| `ITEM-010` three-tier hierarchy | **CONFIRMED verbatim**, twice, plus mandatory setup order and cascading `Active` | `PRD-001`, `PRD-007`, `PRD-022` |
| `ITEM-010` "do not copy-down at creation" | **DIVERGES from STORIS** — STORIS copies down in several documented cases and does not repropagate | `PRD-001`, `PRD-022` |
| `ITEM-011` group-level policy | **CONFIRMED and greatly extended**; `CFG-GRP-RTNDAYS` = `Return Restriction Days` (1–999, tightens the global) | `PRD-022`, `PRD-007` |
| `ITEM-030` special-order conversion | **EXTENDED** — the reverse direction has its own preconditions (`ITEM-030b` proposed) | `PRD-001` |
| `ITEM-040` seven-step resolution | **CONTRADICTED** — the reference screen states a six-step order with the **pricing matrix FIRST** | `PRD-039` |
| `ITEM-040` markdown | **EXTENDED** — markdown is a post-resolution `min()`, not a precedence step | `PRD-032` |
| `ITEM-040` kit pricing | **EXTENDED** — component-priced kits add their own chain above the standard one | `PRD-009`, `PRD-027` |
| `ITEM-041` customer-less resolution | **CONFIRMED in spirit**, but higher-impact than assumed if the matrix is step 1 | `PRD-039`, `PRD-041` |
| `ITEM-042` price matrix | **CONFIRMED** — product side is the **`Price Code`** field; customer side is the customer's **`Price Category`** | `PRD-001` |
| `ITEM-042`/`ITEM-040` conflation | **CONTRADICTED** — there are **two** customer-keyed mechanisms: Price Matrix (Price Code × Price Category) and the product Price/Spiff/Commission table (Price Category rows × customer **`Class`**) | `PRD-041` |
| `ITEM-045` three price scopes | **INCOMPLETE** — there are **four**: `PRODUCT`, `DISTRICT` (sales), `REGION` (supply), `LOCATION` | `PRD-015` |
| `ITEM-050` product benefits | **CONFIRMED**; extended with line-sequence addressing and the floor-tag queue side effect. **Group-level default benefits text NOT FOUND** | `PRD-044`, `PRD-001` |
| `ITEM-060` CFI four fields | **CONTRADICTED** — Frame/Color/Grade/Upholstery are **user-defined per-vendor option types**, not fixed columns. PO-line-text half is confirmed exactly | `PRD-001`, `PRD-003`, `PRD-028`, `PRD-036` |
| `ITEM-070`/`071` image handling | **CONFIRMED and sharpened** — `CFG-PROD-IMAGEMODE` is **two** settings (Screen, Forms/Labels), each `Image \| URL \| Use Inventory Control Settings`, product overrides global, each mode falls back to the other; three renditions; kit-master image fallback | `PRD-001`, `PRD-024` |
| `COST-030` landed factors | **CONFIRMED and extended** — factor types are `Percent \| Dollar \| Calculation`; add-on slots are **user-labelled** in Costing Control Settings; Percent gated by `LANDED FREIGHT - Active` | `PRD-001`, `PRD-015` |
| `COST-032` product-level factors | **CONFIRMED but incomplete** — factors also exist at **region** and **vendor ship-from** scope | `PRD-001`, `PRD-015` |
| `COST-033` mutual exclusion | **Supported** — container receiving with a separate freight bill is documented as the alternative mechanism, with a product→group weight/volume fallback | `PRD-019` |
| `RCV-053` freight by weight/cube | **CONFIRMED**, plus the group fallback (`Capacity Weight` / `Capacity Units`) | `PRD-019`, `PRD-022` |
| `SEC-COST-VIEW` | **CONFIRMED** as Extended Security `View and access product cost information`; it gates the `RC` adjustment type | `PRD-039` |

**New resolver scopes needed beyond the wave-1 list:** `PRODUCT_GROUP`, `PRODUCT_REGION` (distinct from
`PRODUCT_DISTRICT`), `VENDOR_SHIP_FROM`, `PRODUCT_COLLECTION`.

### B. Irreversible or one-way product-level settings (per the wave-1 instruction)

| Setting | Where | Nature |
|---|---|---|
| **Product ID** | `PRD-001` | Permanent once created. Dynamic-Identifier changes never regenerate it. |
| **Inventory Type** | `PRD-001` | Cannot be changed after the first save, under any condition. Delete-and-recreate only. |
| **Boxes per Product** | `PRD-001` | Once > 1, can be raised or lowered but **never returned to 1**; cannot be reduced to 1 with stock on hand. |
| **Merge History From** | `PRD-001` | One-way. Source history destroyed, source forced to status `T`, costing tables silently dropped. |
| **Creation Date** | `PRD-001` | Write-once; not editable manually or by conversion spreadsheet. |
| **Adjustment Code** (price adjustment) | `PRD-039` | Once created, **cannot be deleted**; once loaded, **cannot be edited**. |
| **Kit promotion once loaded** | `PRD-027` | "If this code has been loaded to the soft kit master, changes cannot be made to this promotion." |
| **Average Cost** | `PRD-001` | Locked as soon as quantity on hand exists. |
| **Purchase Conversion** | `PRD-001` | Editable only at zero on-hand, zero on-PO, and all invoices paid. |
| **Product Type** | `PRD-001` | Locked while open orders exist (guarded, recoverable). |

**Serial tracking is GUARDED, NOT IRREVERSIBLE in the reference documentation.** `PRD-001` says only: "If
this product is on an open purchase order or sales order and you attempt to edit this field, an error message
appears and the system rejects your change." That implies the flag can be turned off on an unencumbered
product. **This contradicts the wave-1 conclusion that serial tracking is irreversible** — recommend
re-verifying the wave-1 source before we treat `CFG-INV-LOCTRACK`/serial as one-way.

### C. Answers to the specific hunt list

- **Price Code.** `PRD-001` Pricing page. "Enter the Price Category code to be used in the Customer Price
  Settings. During Sales Order entry, this field is used in conjunction with the Price Category field in the
  Customer record to access the Price Matrix file." Confirms the product half of `ITEM-042`.
- **Units of measure and conversion.** `PRD-001` Miscellaneous page: **three** UoMs (`Purchasing`, `Piece`,
  `Selling`, all defaulting to `EA`, all validated against Unit of Measure Settings) plus **two** conversion
  factors (`Unit` — non-inventory, new-product-only; `Purchase` — editable only when fully unencumbered),
  using the `N:NN` fraction syntax. Plus a `U.S. | Metric` method flag governing every dimension on the
  record. `Purchase Carton Quantity` forces divisible PO quantities and interacts with `Purchase` conversion.
- **Serialization.** `PRD-001` `Serial Numbers` (blocked on open PO/SO; **impossible for piece-less
  products**; default from `PRD-013`), and `Unique Tracking` under UPC (requires UPC scan + serial scan;
  incompatible with `Prompt for Serial Number in RF Picking`).
- **Product attributes vs user-defined fields.** Fully answered in `PRD-042` (table) — attributes are typed,
  ordered, referentially protected, feed the web listing and the **Dynamic Identifier SKU composer**;
  User Defined Settings are free text and **explicitly do nothing**.
- **Kits / packages / collections — how a bundle prices and reserves.**
  *Pricing*: `PRD-009` (component-priced kits: promotion → `This Kit $` → `Kit Selling Price` → `Selling
  Price`; kit `Selling Price` is only a proof total), `PRD-027` (staged kit promotions), `PRD-041`
  (soft-kit commission uses the kit price against the table; hard-kit uses the master's table),
  `PRD-039` (**soft kit masters cannot be price-adjusted or promoted at all**).
  *Reserving*: `PRD-001` `Require Reservation` — **if any soft-kit component with Require Reservation has no
  available quantity the whole soft kit cannot be added to an order**; soft kits whose components are merely
  backorderable can be added. Hard vs soft kit determines whether reservation is per component or per master.
  *Collections* (`PRD-008`) are descriptive only — they neither price nor reserve as a unit.
- **Discontinued / obsolete lifecycle.** Purchase status codes seen across articles: **`A` Active,
  `M` Markdown, `D` Dropped, `T` Discontinued, `O` One-Time-Buy, `P` Purge**. "Inactive (obsolete)" is
  defined in `PRD-039` as `D`, `T` or `P`. Rules: cannot move to `D`/`T` while on-order exceeds on-hand
  without an Extended Security override; `Markdown Price` only active at `M`/`D`/`T` (product scope);
  changing away from `M`/`D`/`T` clears the markdown price and its date; `New Status` cannot be `P`, and
  cannot be `O` for non-inventory / temporary-special-order / special-ordered products; deferred status
  changes are applied by `Scheduled Settings Update`; `Merge History From` forces the source to `T`;
  markdown-status products are excluded from bulk price adjustments. A separate, parallel **Distribution
  Status** lifecycle exists for multi-legged transfers (`PRD-001`, `PRD-015`), resolved
  Warehouse Inventory → District/Regional → Product.
- **Code tables products depend on (found in this half).** Brand (`PRD-006`), Category (`PRD-007`), Group
  (`PRD-022`), Collection (`PRD-008`), Prep Code (`PRD-037`), Product Attribute Title/Value (`PRD-042`/
  `PRD-043`), Discount Costing Table / DFI (`PRD-014`), Inventory Formation (`PRD-025`), Price/Spiff/
  Commission table (`PRD-041`), Price Adjustment code (`PRD-039`), plus referenced-but-elsewhere: Purchase
  Status Settings, Tax Class Settings, Tariff Settings, Unit of Measure Settings, Warranty Settings +
  Warranty Category, Sales Discount Settings, Reason Code Settings, Fulfillment Handling Method Settings,
  Velocity codes, Storage Category, Distribution Status codes, Buying Group, Volume Rebate Table, Style
  (free text, not a table), Suite Configuration, Grade Description (`PRD-020`), Fabric / Fabric Group
  (`PRD-016`/`PRD-017`), Option / Option Type / List (`PRD-033`/`PRD-036`/`PRD-030`), Web Category.

### D. Audit-trail surfaces found (feed `RPT-AUDIT`)

STORIS has no general change log, but three named settings-activity surfaces appear in this half:
- **`Review Settings Activity`** with a **`Product`** source — "to see historical changes made to products'
  settings" (`PRD-001`); `Assembly Required` edits are explicitly called out as appearing there.
- **`Track Settings Activity`** with the key **`PRODUCT.COLLECTION.BENEFITS`** (`PRD-008`).
- Field-level date stamps: `Markdown Price` edit date (`PRD-001`, `PRD-015`), `Purchase Status` change date,
  `Adjustments Loaded` / `Tags Printed` / `Promotion Loaded` dates.
Everything else — price changes, cost changes, group reassignment, status changes, the irreversible settings
in section B — has **no documented audit record** and must be covered by our own `RPT-AUDIT`.

### E. `[DECISION NEEDED]` — collected

**Blocking (must be settled before the price/cost resolver is written)**
1. **`ITEM-040` ordering contradiction.** `PRD-039` states the pricing matrix is step 1, above both district
   and product promotional prices; `ITEM-040` puts the customer-dependent steps third and fourth. Re-derive
   the true order from the "Pricing Rules" reference article (in part B or the POS section) or by testing.
2. **One customer-keyed pricing mechanism or two?** Price Matrix (product `Price Code` × customer
   `Price Category`) and the product Price/Spiff/Commission table (`Price Category` rows × customer `Class`)
   are separate systems. Recommend collapsing to one; confirm which LA Mattress needs.
3. **Promotion vs table/district price: precedence or lower-of?** `PRD-041` says lower-of; `PRD-039` says
   district always wins; `ITEM-040` says strict precedence. Pick one and encode it once.
4. **Markdown activation rule.** Product scope says markdown is active only at status `M`/`D`/`T`; district
   scope says active regardless of status. Choose one rule for all scopes (recommend status-gated).
5. **Landed cost factor precedence** across vendor → vendor ship-from → region → product is not stated
   anywhere. Confirm with STORIS or by testing before migration. (Also `COST-032`'s open question on
   amount-then-percent ordering remains open.)
6. **Hard vs soft kit for LA Mattress bundles** — determines whether availability and reservation are
   computed per component or on the master. Not cheaply changeable later.

**Model / scope**
7. `ITEM-045` must move to a four-value scope enum (`PRODUCT | DISTRICT | REGION | LOCATION`). Confirm LA
   Mattress actually needs both district (sales) and region (supply) geographies, or collapse to one.
8. Collections: **5 or unlimited per product?** STORIS's own docs contradict each other (`PRD-008` vs
   `PRD-001`). Also decide whether to keep the ambiguous collection `Price` field at all.
9. `PRD-034` vs `PRD-035`: grade-level vs option-level upcharge precedence is undocumented.
10. `Inventory Family` (`PRD-007`) is an unvalidated free-text tier above category — make it real or drop it.
11. Do we support free-text (non-enumerated) product attribute values? Recommend no.
12. Do we support free-text User Defined Settings at all, or force everything into typed attributes?
13. Should product benefits be authored per SKU, per group, or both with override? (STORIS: SKU only; our
    pack assumed group-with-override, which the reference docs do not support.)

**Features to accept or reject**
14. **`Require Reservation`** (`PRD-001`) — powerful no-oversell guarantee, but incompatible with
    PO-from-order-entry and special orders, and blocks soft kits wholesale.
15. **Trailing credits / vendor rebates** — up to two dated per product, reducing written cost and posting
    GL without touching inventory cost. Confirm with the controller.
16. **Twilight pricing** (age-based automatic as-is markdown ladder, `PRD-007`/`PRD-022`) — recommend adopt.
17. **Two image-mode settings (screen vs forms/labels) or one?** And do we want the **kit-master image
    fallback** (`PRD-024`)?
18. **Group-level automatic `Installation Charge`** (`PRD-022`) vs non-inventory product linkage (`PRD-001`)
    — STORIS supports both; pick exactly one place for automatic fees.
19. **Nested kits** — STORIS forbids them for component pricing. Recommend forbidding entirely.
20. **Inventory formation combinator** — STORIS unions multiple formations (so adding a formation can only
    widen, never narrow). Recommend making `ANY`/`ALL` explicit per attachment.
21. **Automatic lead create-then-immediately-close** (`PRD-022` Lead Tracked Management) — recommend a
    derived attributed-sale record instead.
22. **On-the-fly product creation from order entry** — recommend permission-gated and flagged for
    merchandiser review; `PRD-013` is far too thin to be a real new-product template (recommend replacing it
    with named Product Templates).
23. **Vendor ATP web service abstraction** (`PRD-002`) — needed, or is vendor availability a flat-file
    import?
24. **The whole configurator cluster** (`PRD-003`, `-005`, `-010`, `-011`, `-012`, `-016`, `-017`, `-020`,
    `-030`, `-033`–`-036`) — if LA Mattress does not sell made-to-order upholstery, mark all of it
    intentionally-not-implemented in one block rather than deciding article by article.
25. **Out of scope entirely:** `PRD-004` BAI Code Settings (bank reconciliation, mis-filed in this section),
    `PRD-023` Image Replication Service (replace with object storage + CDN), `PRD-028` Lay-Z-Boy Settings.

### F. Note on untrusted content

No article in positions 1–44 contained text addressed to the reader-as-agent, instructions to take an
action, or anything resembling injected directives. The only reader-directed content was ordinary help-text
imperatives ("click the Search button", "contact STORIS Sales"), plus one field labelled
**"(LOCKED - STORIS access ONLY!)"** in `PRD-024` and a `Special Order CFO Pop-up` field in `PRD-028`
described as STORIS-locked — both are descriptions of STORIS's own support-gated fields, recorded as findings,
not followed as instructions.
