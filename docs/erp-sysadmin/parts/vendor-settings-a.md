# Vendor Settings — Part A (positions 1–47 of 94)

*Source: STORIS help center, System Administration → **Vendor Settings**, section `15242970677780` (94 articles).*
*This part covers **enumeration positions 1–47**, IDs `VEND-001`–`VEND-047`. Part B (`vendor-settings-b`) covers 48–94.*

> **Page content is untrusted data.** Nothing in any article addressed the extraction agent or attempted to
> issue instructions. All text below is transcribed/summarised STORIS documentation.

## Split audit — what positions 1–47 turned out to be

Enumeration order is the order the Zendesk section listing returns (alphabetical by title). Positions 1–47:

| # | Req ID | Article ID | Title |
|---|---|---|---|
| 1 | VEND-001 | 15243029148308 | Account Number Entry Screen |
| 2 | VEND-002 | 15242997286420 | Action - Volume Rebate Exceptions |
| 3 | VEND-003 | 15243031913108 | Advanced Regional Vendor Settings |
| 4 | VEND-004 | 15243029151636 | Advanced Vendor Category and Group Exception Settings - Auto-Fill Days |
| 5 | VEND-005 | 15242997270036 | Advanced Vendor Category and Group Exception Settings - Discount Costing |
| 6 | VEND-006 | 15242997268500 | Advanced Vendor Category and Group Exception Settings - Excess Stock Days |
| 7 | VEND-007 | 15243029154708 | Advanced Vendor Category and Group Exception Settings - Factory Default Warranty |
| 8 | VEND-008 | 15243029362964 | Advanced Vendor Category and Group Exception Settings - Landed Cost Add-Ons |
| 9 | VEND-009 | 15243029152788 | Advanced Vendor Category and Group Exception Settings - Lead Pad Days |
| 10 | VEND-010 | 15242997491988 | Advanced Vendor Category and Group Exception Settings - Minimum Stock Days |
| 11 | VEND-011 | 15243029150228 | Advanced Vendor Category and Group Exception Settings - Purchase Delivery Pad Days |
| 12 | VEND-012 | 15243029366932 | Advanced Vendor Category and Group Exception Settings - Purchase Lead Days |
| 13 | VEND-013 | 15243029154068 | Advanced Vendor Category and Group Exception Settings - Volume Rebates |
| 14 | VEND-014 | 15243030215572 | Advanced Vendor Settings |
| 15 | VEND-015 | 15242997505812 | Advanced Vendor Settings - Read Only |
| 16 | VEND-016 | 15242997491732 | Bank Override |
| 17 | VEND-017 | 15243030216596 | Bill Back Settings |
| 18 | VEND-018 | 15243029363220 | Birdeye Settings |
| 19 | VEND-019 | 15243030215700 | Broker Settings |
| 20 | VEND-020 | 15243031911444 | Buying Group Settings |
| 21 | VEND-021 | 15243031910548 | Cost Reduced Bill Back Settings |
| 22 | VEND-022 | 15243032141204 | Deduct From Invoice Settings |
| 23 | VEND-023 | 15243032739860 | Deliver To Settings |
| 24 | VEND-024 | 15243031916948 | Delivery Charge Settings |
| 25 | VEND-025 | 15243031913748 | Delivery Charge Table Settings |
| 26 | VEND-026 | 15243030217748 | Delivery Company Settings |
| 27 | VEND-027 | 15243031912852 | Delivery Contact Status Settings |
| 28 | VEND-028 | 15243032151316 | Delivery Survey Settings |
| 29 | VEND-029 | 15242997735956 | Delivery To Description Lookup |
| 30 | VEND-030 | 15243030408724 | Distribution Status Settings |
| 31 | VEND-031 | 15243029579668 | Drop Off Storage Location Table |
| 32 | VEND-032 | 15243030412308 | EDI Status Details Settings |
| 33 | VEND-033 | 15243032143252 | Electronic Merchant Settings |
| 34 | VEND-034 | 15243029579796 | Enter In Transit Days by Location |
| 35 | VEND-035 | 15242997759764 | Enter New Ship-From ID Window |
| 36 | VEND-036 | 15243029579156 | Enter Payables Company by Location |
| 37 | VEND-037 | 15243032138772 | Float Settings |
| 38 | VEND-038 | 15243032140180 | FOB Settings |
| 39 | VEND-039 | 15243032139028 | Franchise Settings |
| 40 | VEND-040 | 15243030715924 | Freight Forwarder Settings |
| 41 | VEND-041 | 15242997758740 | Group Exceptions and Category Exceptions - Advanced Vendor Settings |
| 42 | VEND-042 | 15243032419476 | Logistical Route Settings |
| 43 | VEND-043 | 15243030720660 | Maintain Invoice Charge Table Settings |
| 44 | VEND-044 | 15243029580820 | Minimum Stock Days |
| 45 | VEND-045 | 15243032412564 | Multiple Break Selection |
| 46 | VEND-046 | 15243032411156 | Per Piece Delivery Charge Settings |
| 47 | VEND-047 | 15242997738004 | Picking By Zone Assignment Window |

**Note on section scope.** The STORIS "Vendor Settings" section is *not* purely vendor-master material.
Because many of these screens are reached from a generic **Settings** menu that is shared across
Merchandising/Distribution, a large number of articles in positions 23–47 are actually **delivery,
logistics and routing code tables** (Delivery Company, Delivery Survey, Logistical Route, Picking Zone,
Distribution Status, Float). They are documented here faithfully but should be filed under
delivery/logistics in our own requirement tree, not under vendor.

---

### `VEND-001` Account Number Entry Screen
*storis_ref: article 15243029148308*

**Purpose.** Maintains the list of **account numbers we are known by at an EDI trading partner**. One vendor can carry many of our account numbers (typically one per buying office, region, or ship-to). Used to key inbound/outbound EDI documents to the right relationship.

**Where it lives.** `Vendor EDI Settings > Account Numbers field > Action button`. A grid window listing all account numbers currently associated with the selected EDI vendor.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Account Number | text | "Enter account number you want to associate with the selected vendor." Repeating — grid shows all account numbers currently associated. |

**Behavior & rules.** Pure child-table maintenance; the article documents no validation, no uniqueness rule, and no default. **The article does not say what happens when an inbound EDI document arrives with an account number that is not in this list** — that is an unspecified error path.

**Dependencies.** Child of the vendor EDI configuration (see `VEND-032` EDI Status Details Settings, and the wave-1 finding `EDI - Allow Acknowledgment to Adjust Order Quantity`). Ultimately hangs off the vendor master (`VEND-014` Advanced Vendor Settings).

**Build notes.** Model as `vendor_edi_account_number (vendor_id, account_number, active, note)` with a unique constraint on `(vendor_id, account_number)` — STORIS does not enforce one, we should. Treat it as the **allow-list for inbound EDI**: an EDI document whose account number is not on the list is rejected to an exception queue rather than silently matched to the vendor. Feed adds/removes to `RPT-AUDIT`; adding an account number widens what a trading partner may transact against.

---

### `VEND-002` Action - Volume Rebate Exceptions
*storis_ref: article 15242997286420*

**Purpose.** Attaches a **vendor volume-rebate plan to a specific product category or product group**, overriding the vendor-level default rebate plan. This is the exception layer of vendor rebate accrual.

**Where it lives.** `Advanced Vendor Settings > Volume Rebates section > Code field > Action button > Category Exceptions | Group Exceptions`. Opens the *Volume Rebates - Exceptions* screen.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Group or Category | code | "Enter the product Category or Group code to establish rebate exceptions for the specified category or group." |
| Description | display, auto | "This will fill in automatically following entry of Group or Category Code." |
| Code | code (FK) | "Enter the Vendor Rebate Settings (VR Rebate Plans) code that represents the rebate to be used for this Group or Category." |
| Type | display, auto | Auto-filled from the rebate plan. **`P` = Percent, `D` = dollar amount.** |
| Amount/Percent | display, auto | "The Plan Amount from the VR Rebate Plans file will automatically fill in." |
| Start Date | display, auto | Starting Date of the VR Rebate Plan fills in. |
| End Date | display, auto | Ending Date of the VR Rebate Plan fills in. |

**Behavior & rules.** **Everything except the scope (group/category) and the plan code is denormalised copy-down from the VR Rebate Plans file** — type, amount, start and end date are all pulled from the plan. The article does not say whether the copy is a snapshot or a live read; if a snapshot, editing the plan silently desynchronises every exception row. Two exception dimensions exist (Category, Group) and **the article does not state the precedence when a product's category and its group both have a rebate exception.**

**Dependencies.** Reads `VR Rebate Plans` (Vendor Rebate Settings) master. Parent: `VEND-014` Advanced Vendor Settings → Volume Rebates. Sibling exception screen: `VEND-013`. Regional analogue: `VEND-003`.

**Build notes.** Store the exception as `(vendor_id, scope_type ∈ {CATEGORY, GROUP}, scope_code, rebate_plan_id)` and **resolve type/amount/dates live from the plan** — do not copy them. Precedence must be decided explicitly. `[DECISION NEEDED]` Group vs Category precedence for vendor rebate exceptions — recommend most-specific-wins with an explicit ranked scope list (`PRODUCT > GROUP > CATEGORY > VENDOR`), consistent with the settings resolver.

---

### `VEND-003` Advanced Regional Vendor Settings
*storis_ref: article 15243031913108*

**Purpose.** The **regional override layer of the vendor master**: the same vendor product settings as `VEND-014` Advanced Vendor Settings, but keyed by `(vendor, region)` so a vendor can behave differently in different regions. Covers landed freight/landed cost add-ons and automatic PO replenishment.

**Where it lives.** Reachable from an unusually large number of menu paths, which is itself a finding:
- `Merchandising and Distribution > Settings > Purchasing Settings > Advanced Regional Vendor Settings`
- `Merchandising and Distribution > Purchasing > Buyer/Merchandiser Tools > Buyer Tools > Settings > Vendor Information > …`
- `… > Merchandiser Tools > Settings > Vendor Information > …`
- `… > Buyer/Merchandiser Tools > Settings > Vendor Information > …`
- `Merchandising and Distribution > Inventory > Settings > Purchasing Settings > …`
- `Accounting > Payables > Payables Settings > …`
- `Accounting > Vendor Receivables > Vendor Receivables Settings > …`
- `Accounting > Settings > Vendor Receivables Settings > …`
- `System Administration > System Settings > Merchandising and Distribution System Settings > Vendor Information Settings > …`
- `System Administration > System Settings > Accounting System Settings > Payables System Settings > …`
- `System Administration > System Settings > Accounting System Settings > Vendor Receivables Systems Settings > …`
- `Customer > Settings > Purchasing Settings > …`

Tabs: **Shipping**, **PO Replenishment**.

**Fields — key**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code (FK) | Vendor to edit. Search button opens the **Vendor Cross Reference** window. |
| Region | code (FK) | "Enter the code of the region in which to apply the vendor settings." **This is the `VENDOR_REGION` resolver scope.** |

**Fields — Shipping tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Landed Freight Active | checkbox | Establishes a default landed freight cost for this vendor **in this region**. Action button → `Category Exceptions`, `Group Exceptions`, `Vendor Ship From Exceptions`. |
| Cost | number | Works with Type: the landed freight amount or percent. |
| Type | enum | **`P` - percent, `D` - dollar.** (Freight has no custom option.) |
| Landed Cost Active 1–4 | checkbox ×4 | Four independent add-on landed cost factors. **"The label (if any) for this field is established in the Costing Control Settings"** — the add-on slots are user-labelled globally. Each has Action → `Category Exceptions`, `Group Exceptions`, `Vendor Ship From Exceptions`. |
| Cost (per add-on) | number | Amount or percent per Type. |
| Type (per add-on) | enum | **`P` - percent, `D` - dollar, `C` - custom calculation.** The `C` option exists on add-ons 1–4 but **not** on landed freight. |
| Auto-Fill Days | number (optional) | Just-In-Time Inventory auto-fill days for this vendor **within the selected region only**. Action → `Category Exceptions`, `Group Exceptions`. |

**Fields — PO Replenishment tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Generate Automatic POs | checkbox | Activates Automatic Purchase Order Replenishment for this vendor. |
| **Automatically Hold POs** | checkbox | **"place on Hold all purchase orders created automatically through this process. In this way, you can review auto POs before releasing them to your vendors."** |
| Weekly Sales Rate Calculation | 1–13 | Number of weeks used for the sales-rate calc. |
| First Average Units Period | 1–12 months | Default **4 months**. "represents the number of months prior, **not including the current month**." |
| Second Average Units Period | 1–12 months | Default **12 months**. Same prior-months semantics. |
| Variance Starting Date | date | Start of the window in which the variance percentage is applied to the sales-rate calc. |
| Variance Ending Date | date | Cut-off for the variance. **"If a variance percentage has been set up and the variance ending date has been left blank, the system will continuously calculate the sales rate using the variance percent."** |
| Variance Percentage | 1–999 | Alternate sales-rate multiplier expressed as a percent. "to project sales figures with the sales rate cut in half, enter 50 … at double the historic sales rate, enter 200." |
| Sort Criteria | enum | Sort order for Auto-PO reports: `Vendor Model`, `Product`, `Category`, `Group`. |
| Default Buyer ID | code (FK) | Buyer assigned to POs created by Auto PO Replenishment. |
| Build POs | day-of-week checkboxes | Days on which automatic POs are generated for this vendor. **"During End of Day processing, the system references this field."** |

**Behavior & rules.**
- **Exact formula, quoted:** `Sales Rate = Total Units Sold / Number of Weeks`.
- **PO HOLD TRIGGER — closes part of the `PO-080` gap.** `Automatically Hold POs` is a **vendor(+region)-level flag that puts every auto-replenishment PO on hold at creation**, explicitly as a review gate before the PO is released to the vendor. This is a documented, concrete answer to "why did this PO go on hold": *it was machine-generated by Auto PO Replenishment for a vendor whose Automatically Hold POs flag is set.* Note the scope: it applies **only** to POs created by the replenishment process, not to manually entered POs.
- **Hard rule / gotcha — regional landed cost is NOT maintained by container receiving.** Quoted note: *"Receive a Purchase Order with a Separate Freight Bill (Container Receiving) updates landed cost via the Landed Freight Cost field in the Product file. However, container receiving does not update regional product landed freight cost."* This confirms and sharpens `COST-033`: itemized container receiving and factor-based landed cost are mutually exclusive, **and the regional layer is not updated at all by container receiving**, so a shop that uses container receiving will have stale/never-populated regional landed freight.
- **Auto-Fill Days is additive, not overriding.** Quoted: *"The value entered here is **added to** the fill days calculated by the following hierarchy: 1) Auto-Fill Days in Advanced Vendor Settings (first by Product, then by Group, then by Category); 2) Auto-Fill Days in Point of Sale Control Settings."* **This is the only place in the vendor stack where the regional layer adds to rather than replaces the base layer** — every other regional field overrides. It also gives the explicit base precedence order: **Product → Group → Category**, then the POS control default.
- Landed freight `Type` has no `C` (custom calculation); add-ons 1–4 do. Any UI that shares a Type picker across freight and add-ons must suppress `C` for freight.

**Dependencies.** `CFG-VEND-FREIGHTFACTOR` / `CFG-VEND-ADDONFACTORS` (`COST-031`), overridden by product-level factors (`COST-032`), mutually exclusive with itemized container receiving (`COST-033`). Add-on labels come from **Costing Control Settings** (a `CFG-COST-*` control-settings article). Auto-Fill Days chains to **Point of Sale Control Settings**. Exceptions reference `VEND-004`, `VEND-008`, `VEND-041`, and Vendor Ship From (`CFG-VEND-SHIPFROM`, `PO-020`/`PO-021`, `VEND-035`). Requires the `VENDOR_REGION` resolver scope.

**Build notes.**
- Confirms the settings resolver needs `VENDOR_REGION` as a real scope, sitting between `VENDOR` and global.
- **Do not replicate the additive Auto-Fill Days semantics.** Mixing "add" and "override" in one resolver is a defect factory. `[DECISION NEEDED]` — recommend making every scope override, and if a genuine "pad on top of base" is wanted, model it as a separate, explicitly named `auto_fill_days_regional_pad` field.
- The four unnamed, globally-labelled "Landed Cost Active 1–4" slots are a classic ERP anti-pattern. Replace with a named `landed_cost_component` table (`code`, `label`, `calc_type ∈ {PERCENT, AMOUNT, CUSTOM}`, `sequence`) so components are self-describing and unlimited.
- `Automatically Hold POs` should be one named, auditable value in a **PO hold-reason enum** (`AUTO_REPLENISHMENT_REVIEW`), not an anonymous boolean — a PO on hold must always be able to say *why*.
- The 12 menu paths tell us the same screen is exposed to Purchasing, Inventory, Payables, Vendor Receivables, Customer and SysAdmin. Our equivalent needs **one screen with one permission**, surfaced by search/deep-link rather than duplicated into six menus.
- `[DECISION NEEDED]` Do we need per-region vendor settings at all at LA Mattress's current footprint? If not, ship the resolver scope but leave the UI unbuilt.

---

### `VEND-004` Advanced Vendor Category and Group Exception Settings - Auto-Fill Days
*storis_ref: article 15243029151636*

**Purpose.** Per-category / per-group override of the vendor's default **Auto-Fill Days** (Just-In-Time replenishment).

**Where it lives.** `Advanced Vendor Settings > Auto Fill Days field > Action button`. Two tabs — one for Group exceptions, one for Category exceptions.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display | "The vendor you specified in the Advanced Vendor Settings appears." |
| Default Days | display | "The default days from the Advanced Vendor Settings appears." |
| Category/Group Code | code (FK) | Product group or category receiving the exception. |
| Description | display, auto | Description of the selected group/category. |
| Auto Fill Days | number | Auto-fill days to apply to this group/category for this vendor. |

**Behavior & rules.** Grid-based add/edit; "After you enter the lead days and click on Add, your change appears in the grid." The Group and Category exceptions are **separate tabs of one window**, so both can be populated simultaneously; **precedence between them is not documented here** — it is only documented in `VEND-003` as *Product → Group → Category*.

**Dependencies.** Parent `VEND-014`. Regional analogue `VEND-003`. Falls back to Point of Sale Control Settings auto-fill days.

**Build notes.** One generic `vendor_product_setting_exception` table serves this and `VEND-006`, `VEND-009`, `VEND-010`, `VEND-011`, `VEND-012` — the six numeric-days exception screens are structurally identical (`vendor_id`, `scope_type`, `scope_code`, `setting_key`, `value`). Build one screen with a setting selector, not six screens.

---

### `VEND-005` Advanced Vendor Category and Group Exception Settings - Discount Costing
*storis_ref: article 15242997270036*

**Purpose.** Per-category / per-group override of the vendor's default **costing discount** (the discount applied when computing cost, as opposed to a payment/terms discount).

**Where it lives.** `Advanced Vendor Settings > Discount Costing section > Code field > Action button`. Group and Category tabs.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Group or Category | code (FK) | Scope of the discount exception. |
| Description | display, auto | Description of the selected group/category. |
| Code | code (FK) | **"Enter the DFI code you want to apply. The DFI Code you enter overrides the default for this vendor."** |
| Type | enum | `Percent` or `Dollar`. **"the system may select the discount type automatically, based on your selection at the Code field above."** |
| Amt/Percent | number | Dollar amount or percentage rate. "If available, the rate or amount defaults from the DFI Codes file." |
| Start Date | date | Starting date of this discount. |
| End Date | date | Ending date of this discount. |
| Stock | checkbox | Discount applies to **stock** merchandise. |
| Special | checkbox | Discount applies to **special order** merchandise. |

**Behavior & rules.** **Stock and Special are independent checkboxes, so a discount can apply to neither** — a row with both boxes blank is enterable and silently inert. That is a real data-quality trap. The Type and Amt/Percent are *defaulted* from the DFI Codes file but remain editable, so an exception row can legally diverge from the code it names.

**Dependencies.** `DFI Codes` master file. Parent `VEND-014` → Discount Costing. Interacts with cost calculation (`COST-*`) and with payables discount terms (see `VEND-022` Deduct From Invoice Settings).

**Build notes.** Require at least one of `applies_to_stock` / `applies_to_special` (a `CHECK` constraint). Store discount rows as a reference to the discount code with an **explicit `overridden` flag** if the amount is edited away from the code default, so reporting can tell "used the code" from "hand-keyed". Date-range overlap on the same `(vendor, scope, stock/special)` must be rejected — STORIS documents no such check.

---

### `VEND-006` Advanced Vendor Category and Group Exception Settings - Excess Stock Days
*storis_ref: article 15242997268500*

**Purpose.** Per-category / per-group override of the vendor's default **Excess Stock Days** — the horizon above which on-hand is considered excess for replenishment purposes.

**Where it lives.** `Advanced Vendor Settings > Excess Stock Days field > Action button`. Group and Category tabs.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display | From Advanced Vendor Settings. |
| Default Days | display | Default excess stock days from Advanced Vendor Settings. |
| Category/Group Code | code (FK) | Scope of the exception. |
| Description | display, auto | Description of the selected group/category. |
| **Lead Days** | number | **Mislabelled in the source:** the field that holds the excess stock days value is labelled "Lead Days" — "Enter the number of excess stock days you want to apply to this product group or category for the selected vendor." |

**Behavior & rules.** Structurally identical to `VEND-004`. **The "Lead Days" label on an excess-stock-days field is a STORIS UI bug we must not copy** (the same mislabel recurs on other days-exception screens in this family).

**Dependencies.** Parent `VEND-014`. Consumed by the replenishment/excess-stock reporting.

**Build notes.** Same generic exception table as `VEND-004`. Label the field from the `setting_key` so a mislabel is structurally impossible.

---

### `VEND-007` Advanced Vendor Category and Group Exception Settings - Factory Default Warranty
*storis_ref: article 15243029154708*

**Purpose.** Per-category / per-group override of the vendor's default **factory warranty**, so (e.g.) one vendor's frames carry a different factory warranty from their mattresses.

**Where it lives.** `Advanced Vendor Settings > Factory Default Warranty field > Action button`. Group and Category tabs.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display | From Advanced Vendor Settings. |
| Default Warranty | display | **"The default *days* from the Advanced Vendor Settings appears."** — the article describes the warranty default in days. |
| Category/Group Code | code (FK) | Scope of the exception. |
| Description | display, auto | Description of the selected group/category. |
| Warranty | number / code | "Enter the **number of** the factory default warranty you want to apply to this product group or category for the selected vendor." |

**Behavior & rules.** **The source is internally inconsistent about what this value is** — "Default Warranty … the default *days*" vs "Enter the *number of* the factory default warranty". It is most likely a **warranty code** (an FK to a warranty/service-plan master) whose display header was copy-pasted from the days-exception screens. Treat the ambiguity as a real risk when mapping legacy data.

**Dependencies.** Parent `VEND-014` → Factory Default Warranty. Feeds product warranty defaults and service/claim processing.

**Build notes.** Resolve the ambiguity before migration — inspect actual data. Model as an FK to a warranty definition (`warranty_id`) rather than a bare integer; a warranty is a term *plus* coverage rules, not a number of days. `[DECISION NEEDED]` Confirm with STORIS data whether Factory Default Warranty is a code or a day count.

---

### `VEND-008` Advanced Vendor Category and Group Exception Settings - Landed Cost Add-Ons
*storis_ref: article 15243029362964*

**Purpose.** The category/group exception layer for **landed freight and the four add-on landed cost factors** — i.e. the exception mechanism behind `CFG-VEND-FREIGHTFACTOR` and `CFG-VEND-ADDONFACTORS`.

**Where it lives.** Action button at any of these fields in **both** `Advanced Vendor Settings` (`VEND-014`) and `Advanced Regional Vendor Settings` (`VEND-003`):
- `Landed Freight Active`
- `ADDON 1 - Landed Cost Active`
- `ADDON 2 - Landed Cost Active`
- `ADDON 3 - Landed Cost Active`
- `ADDON 4 - Landed Cost Active`

Then choose `Category Exceptions` or `Group Exceptions`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Group or Category | code (FK) | **"For the Category or Group selected, the Cost exception entered below will override the default Cost for this Vendor."** |
| Description | display, auto | Fills in after entry of Group/Category code. |
| Cost | number | "Enter the Landed Freight or Add-on Landed cost amount or percentage for this Group or Category." Works with Type. |
| Type | enum | "The Type may be selected automatically. Otherwise, select **Percent** if the cost amount is a percentage or select **Dollar** if the cost amount is a dollar amount." |

**Behavior & rules.**
- **Confirms `COST-031`/`COST-032` scope chain and extends it.** The full landed-cost factor precedence, assembled from `VEND-003` + `VEND-008`, is: **product-level factor (`COST-032`) → vendor ship-from exception → vendor category/group exception → vendor default → (regional variants of each)**. `COST-032`'s "product overrides vendor" remains true; this article adds the two intermediate layers the Inventory pack did not have.
- **The exception form exposes only `Percent`/`Dollar` — the `C - custom calculation` type available at the vendor-level add-on field is not offered at the exception level.** So a vendor using a custom calculation cannot express a category exception in the same terms; the exception silently degrades the add-on to a flat percent or dollar for that category.
- `Vendor Ship From Exceptions` is a *third* option on the same Action menu (documented in `VEND-003`) but is **not covered by this article** — it is a separate exception dimension keyed to ship-from address.

**Dependencies.** `CFG-VEND-FREIGHTFACTOR`, `CFG-VEND-ADDONFACTORS`, `COST-031`, `COST-032`, `COST-033`. Add-on labels from **Costing Control Settings**. Ship-from dimension: `CFG-VEND-SHIPFROM`, `VEND-035`.

**Build notes.** Single `landed_cost_factor` table with a scope tuple: `(component_code, vendor_id, region_code?, ship_from_id?, product_id?, category_code?, group_code?, calc_type, value)`, resolved most-specific-wins. **Support `CUSTOM` at every scope level** rather than only at vendor level — the STORIS asymmetry is an implementation artefact, not a business rule. Landed cost changes must feed `RPT-AUDIT`; they silently restate inventory value.

---

### `VEND-009` Advanced Vendor Category and Group Exception Settings - Lead Pad Days
*storis_ref: article 15243029152788*

**Purpose.** Per-category / per-group override of the vendor's **Lead Pad Days** — the safety buffer added to purchase lead time.

**Where it lives.** `Advanced Vendor Settings > click Action button at Lead Pad Days field`. Group and Category tabs.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display | From Advanced Vendor Settings. |
| Default Days | display | "The default lead pad days from the Advanced Vendor Settings appears." |
| Category/Group Code | code (FK) | Scope of the exception. |
| Description | display, auto | Description of the selected group/category. |
| Lead Pad Days | number | Lead pad days for this group/category for this vendor. |

**Behavior & rules.** Same grid add/edit pattern. Note the source cross-labels this as "the default **purchase lead** pad days" in the Category/Group Code help text — **Lead Pad Days and Purchase Delivery Pad Days (`VEND-011`) are distinct fields but the help text conflates them.** Lead Pad Days pads *vendor lead time*; Purchase Delivery Pad Days pads *the delivery leg after receipt*.

**Dependencies.** Parent `VEND-014`. Consumed by ETA calculation on POs and by replenishment.

**Build notes.** Generic exception table (see `VEND-004`). Document the padding chain explicitly in our ETA calc: `promised_date = order_date + purchase_lead_days + lead_pad_days (+ in-transit days by location, VEND-034) + purchase_delivery_pad_days`. **STORIS never states this composition in one place** — we should, and unit-test it.

---

### `VEND-010` Advanced Vendor Category and Group Exception Settings - Minimum Stock Days
*storis_ref: article 15242997491988*

**Purpose.** Per-category / per-group override of the vendor's **Minimum Stock Days** (the safety-stock floor expressed in days of supply).

**Where it lives.** `Advanced Vendor Settings > Minimum Stock Days field > Action button`. Group and Category tabs.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display | From Advanced Vendor Settings. |
| Default Days | display | Default minimum stock days from Advanced Vendor Settings. |
| Category/Group Code | code (FK) | Scope of the exception. |
| Description | display, auto | Description of the selected group/category. |
| **Lead Days** | number | **Mislabelled again:** the input holding minimum stock days is captioned "Lead Days". |

**Behavior & rules.** Identical to `VEND-004`/`VEND-006`. See also the standalone `VEND-044` *Minimum Stock Days* article.

**Dependencies.** Parent `VEND-014`. Paired with Excess Stock Days (`VEND-006`) to bracket the replenishment band.

**Build notes.** Generic exception table. Enforce `minimum_stock_days <= excess_stock_days` at the resolved level — STORIS documents no such check, and an inverted band makes the replenishment engine's behaviour undefined.

---

### `VEND-011` Advanced Vendor Category and Group Exception Settings - Purchase Delivery Pad Days
*storis_ref: article 15243029150228*

**Purpose.** Per-category / per-group override of the vendor's **Purchase Delivery Pad Days**.

**Where it lives.** `Advanced Vendor Settings > Purchase Delivery Pad Days field > Action button`. Group and Category tabs.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display | From Advanced Vendor Settings. |
| Default Days | display | "The default delivery pad days from the Advanced Vendor Settings appears." |
| Category/Group Code | code (FK) | Scope of the exception. |
| Description | display, auto | Description of the selected group/category. |
| Purchase Delivery Pad Days | number | Value for this group/category for this vendor. |

**Behavior & rules.** Grid add/edit. **This is the only one of the six days-exception screens whose input is correctly labelled**, which is itself evidence the other labels are copy-paste defects rather than intentional reuse.

**Dependencies.** Parent `VEND-014`. Part of the ETA padding chain (see `VEND-009` build notes) and of `VEND-034` In Transit Days by Location.

**Build notes.** Generic exception table.

---

### `VEND-012` Advanced Vendor Category and Group Exception Settings - Purchase Lead Days
*storis_ref: article 15243029366932*

**Purpose.** Per-category / per-group override of the vendor's **Purchase Lead Days** — the base vendor lead time driving PO promise dates and replenishment timing.

**Where it lives.** `Advanced Vendor Settings > Purchase Lead Days field > Action button`. Group and Category tabs.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display | From Advanced Vendor Settings. |
| Default Days | display | Default purchase lead days from Advanced Vendor Settings. |
| Category/Group Code | code (FK) | Scope of the exception. |
| Description | display, auto | Description of the selected group/category. |
| Lead Days | number | Purchase lead days for this group/category for this vendor. |

**Behavior & rules.** Grid add/edit. This is the **primary lead-time requirement** the assignment asked us to hunt for: lead time in STORIS is a vendor-level number with category and group exceptions, plus a separate pad (`VEND-009`), plus an in-transit-days-by-location table (`VEND-034`). **There is no per-product lead time documented at the vendor-exception level** — product granularity, if it exists, lives on the product master, not here.

**Dependencies.** Parent `VEND-014`. Feeds Auto PO Replenishment (`VEND-003` PO Replenishment tab) and PO ETA. Interacts with `VEND-034`.

**Build notes.** Generic exception table. **Also capture observed/actual lead time** (receipt date − order date, rolling median per vendor+product) alongside the configured value — STORIS has no feedback loop from actual receipts back to lead time, and buyers therefore trust a number nobody maintains. Surface configured-vs-actual variance as a report.

---

### `VEND-013` Advanced Vendor Category and Group Exception Settings - Volume Rebates
*storis_ref: article 15243029154068*

**Purpose.** Per-category / per-group override of the vendor's default **volume rebate plan**. The screen version of `VEND-002` (which documents the same window from the Action-menu angle).

**Where it lives.** `Advanced Vendor Settings > Volume Rebate section > Code field > Action button`. Group and Category tabs. Screen title: **Volume Rebates - Exceptions**.

**Fields — Default Settings (display-only block, echoing the vendor default)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display | From Advanced Vendor Settings. |
| Code | display | "The default code (if any) from the Advanced Vendor Settings appears." |
| Type | display | Default plan type (if any). `P` = Percent, `D` = Dollar (per `VEND-002`). |
| Amount/Percent | display | Default amount or percent (if any). |
| Start Date | display | Default start date (if any). |
| End Date | display | Default end date (if any). |

**Fields — exception row**

| Field | Type | Purpose / business rule |
|---|---|---|
| Category/Group Code | code (FK) | Scope of the exception. |
| Description | display, auto | Description of the selected group/category. |
| Code | code (FK) | Volume rebate code to apply. **"The system applies the exception via the current vendor."** |
| Start Date | date | **Entered here, not inherited** — "Enter the start date for the date range for which you want to apply the exception specified at the Code field." |
| End Date | date | Entered here. |
| Type | display, auto | "The default plan type for the selected volume rebate exception appears." |
| Amount/Percent | display, auto | Amount or percent for the selected exception. |

**Behavior & rules.**
- **Contradiction with `VEND-002`, flagged.** `VEND-002` says the exception's Start Date and End Date "will fill in" automatically from the VR Rebate Plan. `VEND-013` says the user **enters** the start and end date for the exception. Both articles describe the same window. **The safe reading is: dates default from the plan but are user-overridable, so a category exception can run on a different date range than the plan it points at.** That is a material accrual risk — a rebate can be accrued outside its own plan window.
- Type and Amount/Percent are always derived from the plan; only the date range is genuinely per-exception.

**Dependencies.** `VR Rebate Plans` / Vendor Rebate Settings master. Parent `VEND-014` → Volume Rebates. Duplicate documentation: `VEND-002`. Accrual posts to Vendor Receivables (see `VEND-017` Bill Back, `VEND-021` Cost Reduced Bill Back).

**Build notes.** Do **not** allow an exception date range to exceed the underlying plan's range — clamp or reject. Store `(vendor_id, scope_type, scope_code, rebate_plan_id, effective_from, effective_to)` with a `CHECK` that the range is contained in the plan's range, and reject overlapping ranges on the same scope. `[DECISION NEEDED]` Group vs Category precedence (same open question as `VEND-002`).

---

### `VEND-014` Advanced Vendor Settings
*storis_ref: article 15243030215572*

**Purpose.** **The vendor master's purchasing/merchandising brain.** Quoted: *"Use this file to create vendor-specific criteria for sales order product reservations, purchase order discounting, merchandising, and forecasting reports. Use this file to store and track cut dates for specific vendors and product collections. Additionally, you can use the fields in this file to determine if and when to create automatic purchase orders for vendors, as well as whether to place automatic purchase orders on Hold."* This is the single most important article in the section and the parent of `VEND-002`, `VEND-004`–`VEND-013`, `VEND-041`.

**Where it lives.** 13 menu paths (again exposed to Customer, Merchandising, Inventory, Purchasing, Payables, Third Party Accounting, Vendor Receivables and System Administration). Canonical: `System Administration > System Settings > Merchandising and Distribution System Settings > Vendor Information Settings > Advanced Vendor Settings`.

Tabs: **General**, **Shipping**, **PO Cutting Date**, **Auto PO Replen**.

**Fields — key**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor Code | code (PK/FK) | The vendor. Search button lists valid vendors. |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Buying Group | code (FK) | Buying group associated with this vendor (see `VEND-020`). Search lists buying groups. |
| **Volume Limit on Replenishment POs** | number (cubes) | **"applies only to the Replenish Inventory for Backorder Needs process and overrides the Shipping Volume Limit Per PO field."** Splits large replenishment orders into multiple POs by cube. |
| Auto-Fill Days | number (optional) | Just-In-Time auto-fill days. Action → Category/Group Exceptions (`VEND-004`). |
| Lead Days | number | **"the usual number of days it takes to receive goods from this vendor after a purchase order has been generated *for the current ship-from address*."** — lead time is implicitly per ship-from. Action → exceptions (`VEND-012`). |
| Lead Pad Days | number | **"If a purchase order does not exist, this field is used in the available to promise (ATP) calculation to estimate an ATP date."** Added to Lead Days to estimate a promise date. Action → exceptions (`VEND-009`). |
| PO Pad Days | number 0–999 | Purchase delivery pad days. "added to the purchase lead days, which are used to establish an estimated ship date for incoming merchandise… This additional 'cushion' can be used to prevent salespeople from making inaccurate delivery date promises to the customers." Action → exceptions (`VEND-011`). |
| Excess Stock Days | number | Days' supply considered beyond requirements. "used in conjunction with the **Report Automatic Purchase Order Replenishments** routine, which calculates total days supply by dividing the current net available by the calculated weekly sales rate." Action → exceptions (`VEND-006`). |
| Minimum Stock Days | number | Days' supply considered below safe stock. "used with the **Product Performance and Purchase Recommendations**, which calculates total days supply by dividing the current net available by the calculated weekly sales rate." Action → exceptions (`VEND-010`). |
| Factory Default Warranty | code (FK) | Associates factory warranties with products **by vendor rather than by product**. Search lists factory warranties; Action → `VEND-007`. |
| Lead Days Calculation | enum | See below. |
| Default Requested Date | enum | See below. |

**Fields — General tab, Discount Costing section**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | code (FK) | **"Enter the Deduct From Invoice Settings (DFI Codes) that represents the discount to use as the automatic default during Purchase Order entry."** Action → `VEND-005`. |
| Type | enum | `Percent` or `Dollar`. Auto-selected if the Amount auto-filled. |
| Stock | checkbox | Discount applies to stock merchandise. |
| Special | checkbox | Discount applies to special ordered merchandise. |
| Amount | number | Rate/Amount from the DFI Codes file if available; otherwise entered. |
| Start Date / End Date | date | Discount effective range. |

**Fields — General tab, Volume Rebates section**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | code (FK) | Vendor rebate code used as the automatic default for this vendor **during Purchase Order Entry**. Action → `VEND-013`. |
| Type | enum, display | From Vendor Rebate Settings. **`D` (Dollars Per Unit Purchased)** — Amount is a dollar amount. **`P` (Percent of Dollars Purchased)** — Amount is a percent. *(This is the fullest expansion of the P/D enum anywhere in the section — note `D` is per **unit purchased** and `P` is of **dollars purchased**, two different bases.)* |
| Amount | display, auto | Plan Amount from VR Rebate Plans. |
| Start Date / End Date | display, auto | Default from the VR Rebate Plans record. |

**Fields — Shipping tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Landed Freight Active | checkbox | Activates Landed Freight for this vendor. **"If the Landed Freight Active field is not enabled in the Costing Control Settings, this field is inactive."** Action → Category Exceptions / Group Exceptions / **Vendor Ship From Exceptions**. |
| Cost | number | Landed freight amount or percent. |
| Type | enum | **`Percent` — "multiply the value in the Cost field by the line item cost of each item you purchase from this vendor." `Dollar` — "apply the value in the Cost field as a flat dollar amount for each item you purchase from this vendor."** No custom option on freight. |
| ADDON 1–4 - Landed Cost Active | checkbox ×4 | Four add-on landed cost factors. "the label (if any) specified in the Costing Control Settings appears to the left of 'Landed Cost Active'." Action → Category / Group / **Vendor Ship From** Exceptions. |
| Cost (per add-on) | number | Amount or percent. |
| Type (per add-on) | enum | `Percent`, `Dollar`, or **`Calculate` to apply a custom calculation — "Call STORIS for information."** |

**Fields — PO Cutting Date tab** (*"A cut date is the date on which the collection is no longer available from the vendor."*)

| Field | Type | Purpose / business rule |
|---|---|---|
| Collection Code | code (FK) | Collection for which a PO Cutting Date is established. |
| Description | display, auto | From the Collection record. |
| PO Cutting Date | date | "Enter the purchase order cutting date to use in the **Buyer's Management Worksheet**." Also appears on the Product Performance and Purchase Recommendations report. |

**Fields — Auto PO Replen tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Generate Automatic POs | checkbox | Activates Automatic PO Replenishment for this vendor. |
| **Automatically Hold POs** | checkbox | See the contradiction under Behavior & rules — **the article gives two incompatible descriptions of this flag.** |
| Weekly Sales Rate Calculation | 1–13 weeks | `Sales Rate = Total Units Sold / Number of Weeks`. |
| Include All Backorders | checkbox | See below — mutually exclusive with Days for Replenishment. |
| Days for Replenishment | 0–999 or blank | Window of orders considered: "orders that are considered have a delivery date that is equal to or less than the number of days set in this field." |
| First Average Units Period | 1–12 months, default **4** | Months prior, **not including the current month**. |
| Second Average Units Period | 1–12 months, default **12** | Months prior, not including the current month. |
| Variance Starting Date | date | Start of the window in which Variance Percentage applies. |
| Variance Ending Date | date | Cut-off. **Blank = the variance is applied forever.** |
| Variance Percentage | 1–999 | Sales-rate multiplier as a percent (50 = half, 200 = double). |
| Minimum Sales Rate | number, **up to 6 digits with one decimal** | Optional. "All items with weekly sales rates calculated lower than the value set in this field are **excluded from the report**." |
| Sort Criteria | enum | `Vendor Model`, `Product`, `Category`, `Group`. |
| Build POs | day-of-week checkboxes | Days on which automatic POs generate. Referenced during End of Day processing. |

**Behavior & rules.**

- **PO HOLD — `PO-080` GAP, PARTIALLY CLOSED, AND THE SOURCE CONTRADICTS ITSELF.** The article gives two mutually exclusive readings of `Automatically Hold POs`:
  1. *"use this field to place on **Hold** all purchase orders created automatically through this process. In this way, you can review auto POs before releasing them to your vendors."*
  2. *"However, if PO Replenishment is active for a vendor, the system calculates the data and generates an EOD report. The buyer can review the data and decide whether to create a purchase order. Purchase orders can then be created via Purchase Order entry… **If this field is not selected, purchase orders generate automatically via the End of Day process.** The EOD process generates a report displaying the purchase order numbers created."*

  Reading 2 says the flag suppresses PO creation entirely and produces a *worklist* instead; reading 1 says it creates the POs and holds them. **We must not guess.** `[DECISION NEEDED]` — verify against a live STORIS instance which behaviour is real. Either way, this is a documented, vendor-scoped, machine-generated PO-hold trigger and belongs in the `PO-080` answer.
- **`PO-080` scope caveat.** Everything this article documents about holds is confined to **auto-replenishment POs**. It documents **no vendor credit hold, no vendor-level approval requirement, and no manual-PO hold trigger.** The one "Credit Hold" reference in the whole article is a *sales-order* filter in the Replenish-for-Backorder-Needs option set (`Sales Order Options – Include for Replenishment > Credit Hold`), i.e. "should orders that are on customer credit hold generate replenishment demand" — **not** a vendor hold. See the Coverage note at the end of this file.
- **HARD SAVE-BLOCKING VALIDATION.** `Include All Backorders` and `Days for Replenishment` are mutually exclusive: *"If the field contains a value and this field is checked, a message indicates the conflict. **This screen cannot be saved unless this conflict is resolved.**"* This is one of very few hard validations in the whole Vendor Settings section.
- **Include All Backorders — exact semantics.** Checked: *"includes all back-ordered items (that is, all sold-but-not-reserved items)… The system looks at the quantity on order at the warehouse and subtracts the quantity ordered but not reserved to determine the **Net PO**."* Unchecked, the calculation (a) includes only sold-but-not-reserved items whose estimated/scheduled delivery date falls within the order item's **auto-fill days** based on the run date, (b) includes orders with **no delivery date but status ASAP**, and (c) **excludes orders with status CWC** (customer will call).
- **GOTCHA — the replenishment Net PO deliberately disagrees with the rest of the system.** Quoted: *"If a value exists in this field [Days for Replenishment], the Replenish Stock Inventory Based on Sales Rate process does not include CWC orders, **even if the account is set to fill CWC orders**. Additionally, the **Net PO Calculation in the replenishment process does not match the Net PO in processes such as View Product Activity.**"* Two numbers called "Net PO" in one ERP that are defined differently is exactly the kind of thing that destroys trust in a system.
- **Precedence conflict on Auto-Fill Days — flag.** This article: *"the system first checks for auto-fill days value in the Advanced Vendor Settings (**first by product group, then by product category, then by vendor**). If no value exists at any those fields, the system references the number in the Auto-Fill Days field in the **Point of Sale Control Settings**."* But `VEND-003` states the same hierarchy as *"first by Product, then by Group, then by Category"*. **The two articles disagree** (`VEND-003` inserts a Product level and reverses nothing else). Resolved order to adopt: `PRODUCT (if it exists) → GROUP → CATEGORY → VENDOR → POS Control Settings default`.
- **Excess Stock Days / Minimum Stock Days precedence — explicit and identical.** First value found wins: (1) Group exception screen, (2) Category exception screen, (3) the vendor-level field. **Group beats Category** — this settles the open precedence question raised under `VEND-002`/`VEND-013` for at least these two settings.
- **HARD RULE — vendor-sourced warranty does not write back to the product.** Quoted: *"When a product appears on an order, the system checks the **Product file** and then the **Advanced Vendor Settings** for a factory warranty, attaching the first warranty it finds or none if one is not found. NOTE: If the system attaches a factory warranty to an order item via the Advanced Vendor Settings, the system does **NOT** also update the Product file with the warranty. You must manually add the warranty to the product via the Product file."* So the same product can carry a warranty on orders while showing none on its own record.
- **`Lead Days Calculation` — exact enum and behaviour.**
  - `Use Purchasing Control Settings` — **the default.** Defers to the `LEAD DAYS CALCULATION Override Lead Days if Purchase Order Date is Greater` field in Purchasing Control Settings.
  - `Use Lead Days` — lead date from this vendor's Lead Days.
  - `Override Lead Days if Purchase Order Date is Greater` — overrides the global setting for this vendor. **"If any purchase orders exist with a date outside of the lead days, the lead days are extended to the latest purchase order's date so that it can be included as a source of supply."** i.e. the promise date is stretched to whatever the latest open PO says, so ATP silently lengthens as POs slip.
- **`Default Requested Date` — exact enum and a non-obvious side effect.**
  - `Use Vendor Lead Days` — Requested Date defaults from this vendor's Lead Days.
  - `Use Today's Date` — the PO creation date defaults in "regardless of whether or not vendor Lead Days are present."
  - **"For purchase orders created automatically, the `Use Vendor Lead Days` option allows individual lines on the purchase order to each have their own delivery date; the `Use Today's Date` option uses the delivery date that is furthest in the future."** So this setting silently changes whether an auto-PO is line-dated or header-dated.
- **Add-on costs are gated by a global kill-switch.** *"To edit an add-on cost on this screen, the cost must be active via the Costing Control Settings."* Structurally the same pattern as the Extended Security global kill-switch: a per-vendor setting is inert unless a global flag is on. We are deliberately not reproducing that design.
- **Volume Limit on Replenishment POs — exact behaviour.** *"When purchase orders are created via the Replenish Inventory for Backorder Needs process, a running total of the merchandise shipping volume is kept; once that volume is exceeded, a new purchase order is created to accommodate the remaining items to be ordered. Products must have the Shipping Volume properly set in the Logistics section of Advanced Product Settings. **If not set, the products are valued as 0 (zero) cubes.**"* **A product with no cube silently contributes nothing to the split, so an all-blank catalogue produces one unbounded PO.**
- **Scope split between the two replenishment engines is a trap.** *"NOTE: These settings do NOT apply to the Replenish Inventory for Current Back Order Needs routine. They are used only for the automatic PO replenishment feature, which is run during EOD or on demand via Replenish Stock Inventory Based on Sales Rate."* Meanwhile `Volume Limit on Replenishment POs` (on the General tab) applies **only** to Replenish Inventory for Backorder Needs. **The two engines read disjoint halves of the same screen.**
- **Precedence:** `Days for Replenishment` in *Replenish Stock Inventory Based on Sales Rate* **takes precedence over** the vendor-level `Days for Replenishment`.

**Behavior & rules — the embedded Replenishment use case (ship-from defaulting, `PO-020`/`PO-021`).**

The article embeds a long worked example of *Replenish Inventory for Backorder Needs* whose option set is documented nowhere else in this section:

- `Replenishment Type` — `Allocated Order Replenishment` | `Stock Level Replenishment`
- `Create PO by PO Type` — `Vendor` | `Order`
- `Sales Order Options – Fulfillment Status` — `Scheduled Date`, `Estimated Date`, `As Soon as Possible`, `Customer will call` (each true/false)
- `Sales Order Options – Include for Replenishment` — `Special Orders`, `Service Orders`, `Transfers`, **`Credit Hold`** (each true/false)
- `Days for Replenishment`
- `Shipping Volume Limit Per PO` / `Max Cubes per PO`
- `Stock Replenishment Options > Low Stock Levels` — e.g. `Safety`; plus `Include Floor Sample Quantities`

**The ship-from defaulting rule the examples demonstrate — this is the `CFG-VEND-SHIPFROM` / `PO-020` / `PO-021` behaviour, stated by example rather than by rule:**

1. Vendor with **no Ship From addresses configured** → the replenishment grid's *"Vendor's Ship From columns filled with DEFAULT info"*.
2. Vendor with **more than one Ship From address** and no product-level default → *"Ship From columns default to blank, **need to Assign**"* — **the user is forced to choose; this is the prompt behind `PO-020`/`PO-021`.**
3. Product carrying a **Vendor Ship From default** (example: PROD 3 has *"Vendor Ship From default of East Coast Warehouse, NY"*) → the grid defaults to that address even though the vendor has two.

  **So ship-from resolution is: product-level vendor-ship-from default → (if the vendor has exactly one ship-from) that one → otherwise blank and mandatory user assignment.** The user may then reassign per grid line, so **two lines of the same replenishment run for the same vendor can ship from different addresses**, which is what forces a per-line rather than per-PO ship-from.
4. Other demonstrated rules: `Create PO by PO Type = Vendor` groups lines per vendor; `= Order` groups per sales order, so **one sales order spanning two vendors still yields two POs**. Service orders and transfers are included/excluded strictly by the option flags; a transfer line linked to a special-order line is skipped when `Special Orders = False` even if `Transfers = True` (**the linkage, not the line type, decides**). In Stock Level Replenishment, *"Orders are ignored as it is assumed that Allocated Order Replenishment will be run to fill those orders with linked POs"*, incoming transfers and open POs both net down the requirement, and **a product with no Safety Stock requirement set is skipped entirely** (*"Safety Stock requirement not set! Product skipped"*).

**Dependencies.** Costing Control Settings (add-on labels + the enable kill-switch), Purchasing Control Settings (`LEAD DAYS CALCULATION`), Point of Sale Control Settings (Auto-Fill Days fallback), Advanced Product Settings → Logistics → Shipping Volume, Collection master, DFI Codes / Deduct From Invoice Settings (`VEND-022`), Vendor Rebate Settings / VR Rebate Plans, Buying Group (`VEND-020`), Vendor Ship From (`CFG-VEND-SHIPFROM`, `VEND-035`, `PO-020`, `PO-021`). Regional override: `VEND-003`. Read-only view: `VEND-015`. Exceptions: `VEND-002`, `VEND-004`–`VEND-013`, `VEND-041`. Landed cost: `CFG-VEND-FREIGHTFACTOR`, `CFG-VEND-ADDONFACTORS`, `COST-031`, `COST-032`, `COST-033`. PO lifecycle: `PO-071`, `PO-080`.

**Build notes.**
- **This screen is four unrelated products bolted together** (cost factors, lead-time/stock policy, collection cut dates, replenishment engine config). Split them: `vendor_purchasing_policy`, `vendor_landed_cost_factor`, `vendor_collection_cut_date`, `vendor_replenishment_policy`.
- Every "days" field must live in the generic scoped-setting resolver (`PRODUCT → GROUP → CATEGORY → VENDOR_SHIP_FROM → VENDOR_REGION → VENDOR → COMPANY`) with **one documented, tested precedence** — STORIS states three different orders in three articles.
- **Define "Net PO" exactly once**, system-wide, and make the replenishment engine use that definition. If a variant is genuinely needed, give it a different name.
- Never let a null cube silently mean zero. Refuse to volume-split a PO if any line's product has no cube; raise it as a data exception.
- The `Calculate`/`C` custom landed-cost type is documented as *"Call STORIS for information"* — an undocumented escape hatch. Replace with a declared, versioned expression stored as data.
- `[DECISION NEEDED]` Resolve the `Automatically Hold POs` contradiction (hold-the-PO vs don't-create-the-PO) before implementing.
- `[DECISION NEEDED]` Do we want a "generate a buyer worklist" mode at all, or only "create POs in `DRAFT` status"? Recommend the latter — a draft PO is auditable, a report is not.
- Warranty resolution must write the resolved warranty onto the order line **and** be reportable back to the product, so the STORIS "product shows no warranty but sells with one" split cannot happen.
- Feed all of it to `RPT-AUDIT`: lead days, landed cost factors, rebate codes and discount codes all move money.

---

### `VEND-015` Advanced Vendor Settings - Read Only
*storis_ref: article 15242997505812*

**Purpose.** A **read-only rendering of `VEND-014`** surfaced from within a report so a buyer can inspect a vendor's settings without leaving the analysis. Quoted: *"NOTE: This is a read-only screen. You cannot edit any data on this screen."*

**Where it lives.** `Actions button on the Purchasing tab of the Product Performance and Purchase Recommendations routine.` Same four tabs: General, Shipping, PO Cutting Date, Auto PO Replen.

**Fields.** Identical set to `VEND-014` except as noted below — not repeated here; see `VEND-014` for the full table.

**Behavior & rules — this article is more useful for its *differences* than its content.**

- **NEW FACT not present in `VEND-014`: the Buying Group field is a permission control.** Quoted: *"This is optional field works with the **Restrict Entry to a Single Buyer** field in the **Purchasing Control Settings**. Use this field to indicate the buying group responsible for this vendor."* **So `Buying Group` on the vendor is not merely reporting metadata — combined with a Purchasing Control Setting it restricts who may transact against that vendor.** That is a genuine authorisation rule hiding in a merchandising field, and it is the closest thing in this half of the section to a *vendor-level approval requirement* (relevant to `PO-080`).
- **The read-only doc is a stale snapshot of an older screen version.** It omits fields the live screen has: `Volume Limit on Replenishment POs`, `Lead Pad Days`, `PO Pad Days`, `Lead Days Calculation`, `Default Requested Date`, `Days for Replenishment`, `Minimum Sales Rate`. It also calls the lead-time field **`Purchase Lead Days`** where `VEND-014` calls it **`Lead Days`**, and its Lead Days definition drops the *"for the current ship-from address"* qualifier. Its Shipping-tab Action menus offer only `Category Exceptions` and `Group Exceptions` — **no `Vendor Ship From Exceptions`** — confirming ship-from exceptions were added later.
- **This resolves the `Automatically Hold POs` contradiction's provenance.** Here the field has only the original description — *"use this field to place on Hold all purchase orders created automatically through this process"* — with **none** of the "generates an EOD report / buyer decides whether to create a purchase order" text that `VEND-014` appends. The worklist paragraph is therefore a **later behavioural change layered onto the old wording**, which makes it the more likely current behaviour. Still verify.
- Its Shipping-tab preamble says *"activate add-on costs **in your system**"* where `VEND-014` says *"for the selected vendor"* — a copy-paste from the global Costing Control Settings doc.
- Everything else (Auto-Fill precedence, Excess/Minimum Stock Days first-found-wins order, the Factory Default Warranty no-writeback rule, the `D`/`P` rebate enum, the `Percent`/`Dollar`/`Calculate` add-on enum, `Sales Rate = Total Units Sold / Number of Weeks`, the 4- and 12-month defaults) is **verbatim identical** to `VEND-014`, which corroborates those rules.

**Dependencies.** `VEND-014`. **Purchasing Control Settings → `Restrict Entry to a Single Buyer`.** Buying Group (`VEND-020`). Product Performance and Purchase Recommendations report.

**Build notes.** We do not need a separate read-only screen — render one screen and let field-level permissions decide editability. **Do capture `Restrict Entry to a Single Buyer` as a real requirement**: `CFG-PUR-RESTRICTBUYER`, evaluated as "user's buying group must match the vendor's buying group to enter a PO against that vendor". That is an authorisation rule and belongs in the permission model, not in a merchandising settings file. Two divergent copies of the same documentation is itself a warning: **do not fork screens.**

---

### `VEND-016` Bank Override
*storis_ref: article 15242997491732*

**Purpose.** **Not a vendor setting** — despite its placement in the Vendor Settings section, this specifies **alternate banks for posting customer payments at a warehouse/store location**, by payment class.

**Where it lives.** `Warehouse/Store Location Settings > Bank Number field > click action button`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Cash Bank | code (FK), optional | Bank for cash postings instead of the location's default. Search → cash bank Read-Only Lookup Window. |
| Check Bank | code (FK), optional | Bank for check postings. |
| Credit Card Bank | code (FK), optional | Bank for credit card postings. |
| Debit Card Bank | code (FK), optional | Bank for debit card postings. |

**Behavior & rules.**
- **HARD RULE — company containment.** *"All entries on this screen are optional and must be associated with the **same company as the location**."* Repeated per field: *"The bank you enter here must be associated with the same company as the location."* This is a concrete use of the `COMPANY` resolver scope registered in wave 1.
- Resolution: *"If an override bank number has been assigned for a payment class, it is used for posting purposes instead of the default bank number. If an override bank number has not been assigned, the default bank number indicated at the Bank Number prompt for the location is used."* Plain most-specific-wins with one fallback.
- **Explicit exclusion list (hard rule).** *"Miscellaneous payments post to the default bank… **Gift certificate/cards, revolving and installment payment classes are intentionally not included in this override feature.** 3rd party financing is also excluded since a posting bank can be assigned in the Finance Provider Settings via **Auto-Pay Post Bank**."* Note the word *intentionally* — this is a designed limitation, not an oversight, and it means the payment-class enum is **not** uniformly overridable.
- Each entry allows only **a single bank** per payment class.

**Dependencies.** Warehouse/Store Location Settings (`Bank Number`), Bank Settings, Company master, Finance Provider Settings → `Auto-Pay Post Bank`. Bank Reconciliation.

**Build notes.** File this under **location/treasury**, not vendor. Model as `location_payment_class_bank (location_id, payment_class, bank_id)` with a `CHECK` that `bank.company_id = location.company_id` — STORIS states the rule in prose; we should enforce it in the schema. **Make the payment-class list data-driven and allow every class to be overridden**, rather than hard-coding four and excluding the rest; the STORIS exclusions look like accumulated implementation debt. Bank reassignment must feed `RPT-AUDIT` — it redirects cash.

---

### `VEND-017` Bill Back Settings
*storis_ref: article 15243030216596*

**Purpose.** **A core vendor-chargeback mechanism.** Bill Back codes are used in Purchase Order Processing to record that *"the vendor for a PO line item owes money that will **not** automatically be deducted from the bill. When you use a bill back code, the system creates a **vendor receivable** for the money owed from the vendor instead."* This is the "we bill the vendor" half of the pair whose other half is Deduct From Invoice (`VEND-022`, "we short-pay the vendor").

**Where it lives.** 20 menu paths across System Administration, Accounting (Payables / Vendor Receivables / General Ledger → Purchase Discount Settings) and Merchandising & Distribution (Buyer Tools / Merchandiser Tools / Inventory). `Support Files: None.`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Bill Back Code | text, **up to 6 alphanumeric** | Identifies this code. |
| Description | text, **up to 20 characters** | Describes the code. |
| General Ledger Account | GL account | Action button → **TPA GL Account Entry** screen. "the General Ledger Account that will be used in posting the Vendor Receivable created through the use of this Bill Back Code." |
| Percent or Dollar | enum | `Percent` (rate goes in Rate or Amount) or `Dollar` (amount goes in Rate or Amount). |
| Rate or Amount | number | The percentage rate or the dollar amount, per the field above. |
| Chain Discount | checkbox | See below. |
| Include Service Parts | checkbox | *"Bill backs may optionally be used for service parts. Select (check) this field to include service parts when this bill back code is used."* |

**Behavior & rules.**
- **Chain Discount — exact rule, quoted.** *"Use this feature if you want to include multiple DFI discounts on a single line item. After applying the first DFI, the system applies the subsequent DFI discounts to the **reduced cost**, rather than the 'before discount' amount. That is, the system applies the DFI discount to the previously discounted amount."* Unchecked: *"leave the field blank to have the system calculate the amount based on the **original invoice cost**."*
  So: **chained = multiplicative/compounding on the running net; unchained = each discount computed against the original cost.** `10% then 10%` chained gives `0.81 × cost`; unchained gives `0.80 × cost`. **The article does not state the sequence in which multiple DFIs are applied**, which fully determines the result whenever dollar and percent codes are mixed. That is a material gap.
- **A bill back does not reduce what we pay** — it creates a receivable. The AP invoice is paid in full and the money is chased separately. That is a fundamentally different cash and aging profile from a deduction, and materially different from `VEND-021` Cost Reduced Bill Back.
- The Chain Discount note is introduced as covering *"the following three fields"* (Percent or Dollar, Rate or Amount, Chain Discount), so the whole rate block is chain-aware.

**Dependencies.** DFI Codes / Deduct From Invoice Settings (`VEND-022`), Cost Reduced Bill Back Settings (`VEND-021`), Vendor Receivables module, General Ledger / TPA GL Account Entry, `VEND-014` → Discount Costing, Purchase Order Processing. Category/group discount exceptions: `VEND-005`.

**Build notes.**
- **`[DECISION NEEDED]` Define and freeze the DFI application sequence** (recommend: explicit integer `sequence` on each code, percent-before-dollar tie-break, documented and unit-tested with a worked example in the spec).
- Model three distinct chargeback dispositions explicitly — `DEDUCT_FROM_INVOICE`, `BILL_BACK_RECEIVABLE`, `COST_REDUCED_BILL_BACK` — as one enum on one `vendor_chargeback` entity rather than three separate code files, because they differ only in posting treatment.
- 6-character codes and 20-character descriptions are 1980s constraints; do not inherit them.
- Every bill back is a claim against a vendor and needs an **age, a status, and an owner**. STORIS gives it a GL account and nothing else. Add `status ∈ {OPEN, SUBMITTED, DISPUTED, RECOVERED, WRITTEN_OFF}` and require a reason on write-off.

---

### `VEND-018` Birdeye Settings
*storis_ref: article 15243029363220*

**Purpose.** **Not a vendor setting** — configures the **STORIS RMI / Birdeye customer review-and-survey integration** per store/warehouse location.

**Where it lives.** `Warehouse/Store Location Settings > Miscellaneous page > Actions button > Birdeye Settings`. *"Surveys are sent are for this store/warehouse location."*

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Business ID | text | "Enter the STORIS RMI Business ID for this location." |
| Survey on Written Business | checkbox, **default checked** | Sends the consumer a survey about their **store** experience. "The survey is based on the selling store." |
| Survey on Delivered Goods | checkbox, **default unchecked** | Sends a survey about the **delivery** experience. Works with Days to Delay Survey. |
| Days to Delay Survey | 0–99, **default 0** | Days STORIS delays sending Birdeye the *Survey on Delivered Goods* requests. **"This field does not effect the Survey on Written Business survey requests."** |

**Behavior & rules.**
- **HARD SAVE-BLOCKING VALIDATION — mutual exclusion.** *"The following two settings cannot be used together. If both settings are checked, a warning message appears indicating that they cannot be selected at the same time; the user must then un-check one or both of the settings before saving. **If both settings are unchecked, no survey is sent to the customer.**"* So the field pair is a three-state control (`WRITTEN` / `DELIVERED` / `NONE`) implemented as two booleans with an XOR guard — a modelling error we should not copy.
- **Survey on Delivered Goods eligibility — exact and narrow.** *"This survey is created during the **Complete the Delivery Manifest Process**. This applies **only to sales orders**; other order types, such as exchanges, returns, service, etc. are not included. The order must undergo the **first completion of a delivery fulfillment**. Additionally, the order **cannot be a Take With, Pick Up, or Direct Ship order**."*

**Dependencies.** Warehouse/Store Location Settings. Delivery Manifest completion. Order type and fulfillment type. Related: `VEND-028` Delivery Survey Settings.

**Build notes.** File under **customer experience / integrations**, not vendor. Replace the two-boolean XOR with a single `survey_trigger ∈ {NONE, WRITTEN_BUSINESS, DELIVERED_GOODS}` — the exclusivity then cannot be violated. Business ID is a **third-party tenant identifier**: it is per-location credential-adjacent configuration and changes to it must feed `RPT-AUDIT`. `[DECISION NEEDED]` LA Mattress's review platform — if it is not Birdeye, this is a straight non-port; keep only the abstract trigger model.

---

### `VEND-019` Broker Settings
*storis_ref: article 15243030215700*

**Purpose.** Maintains the **customs brokerages** used when importing merchandise. *"The system references the Broker Settings when entering import purchase orders and printing import purchase order documents via Design Enhanced Laser Forms."*

**Where it lives.** `Merchandising and Distribution > Settings > Purchasing Settings > Import Freight Settings > Broker Settings`.

The article defines the role: brokers *"navigate goods through customs barriers on behalf of importers and exporters"*, and they *"prepare documents and/or electronic submissions"*, *"calculate (and often pay) taxes, duties and excises on behalf of the client"*, and *"facilitate communication between the importer/exporter and governmental authorities."* They may be independent or affiliated with freight forwarders (`VEND-040`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Broker ID | code, **up to 5 alphanumeric** | Identifier. Search lists existing brokers; entering a new code creates a record. |
| Description | text, **up to 30 alphanumeric** | Broker name/description. |
| Country | code (FK) | **Must exist in the Country file.** Drives address/phone formatting — see below. |
| Address Line | text ×3, **30 alphanumeric each** | Broker address. |
| City | text | Label derived from the Country file. |
| State | text | Label derived from the Country file. |
| Zip Code | text | Label derived from the Country file. |
| Contact Name | text | Contact person at the brokerage. |
| Dial Prefix | display, auto | *"The dial prefix (if any) specified in the Country file for the selected country appears. It indicates the international dialing prefix required when calling the specified country."* |
| Telephone Number | text | **"The format of the field is derived from the Country file record for the specified country."** |
| Ext | text | Telephone extension. |
| Fax Number | text | Format also derived from the Country file. |

**Behavior & rules.**
- **HARD ORDERING RULE.** *"You **must specify a country before you can enter the remainder of the address fields**. That is, the system formats the address and telephone number fields on this screen based on the 'masks' set up in the Country File for each country."* The worked explanation: *"the Zip Code field in the United States is analogous to the Postal Code field in Canada. However, because they have different names and different formats, you use the Country File to specify the differences so that when you enter a country here in this routine, the system formats the prompts and fields properly."*
- **This is a reusable, system-wide pattern, not a broker quirk.** The Country file drives **field labels, input masks and dial prefixes** for every address-bearing entity. It is the mechanism our own vendor remit-to / ship-from addressing must adopt (`VEND-035`, `CFG-VEND-SHIPFROM`, and the `VENDOR_REMIT_TO` scope).
- The article documents **no uniqueness, no active/inactive flag, no duty-rate or account fields** — the broker record is purely a name-and-address book entry consumed by import PO forms.

**Dependencies.** Country file (labels, masks, dial prefix). Import purchase order entry. Design Enhanced Laser Forms (document printing). Freight Forwarder Settings (`VEND-040`). FOB Settings (`VEND-038`).

**Build notes.**
- Do not build a bespoke broker table. **Model brokers, freight forwarders, delivery companies and vendors as roles on one `business_party` entity** with a shared address book — this section alone contains four near-identical name-and-address code files (`VEND-019`, `VEND-026`, `VEND-040`, plus the vendor master).
- Adopt the Country-file pattern deliberately: one `country` reference table carrying `address_label_map`, `postal_code_format`, `phone_format`, `dial_prefix`, and render every address form from it. This is the single best idea in this half of the section.
- 5-character IDs and 30-character names are legacy limits; do not inherit them.
- `[DECISION NEEDED]` Does LA Mattress import directly (own customs entries) or buy DDP/landed from domestic importers? If the latter, brokers, freight forwarders and FOB terms are all out of scope and the landed-cost factor model in `VEND-014` carries the whole import story.

---

### `VEND-020` Buying Group Settings
*storis_ref: article 15243031911444*

**Purpose.** **An authorisation mechanism disguised as a merchandising code file.** *"Use this routine to assign purchasing responsibilities to users based on vendor, vendor ship-from, and individual product."* A buying group binds **one buyer** to a set of vendors, vendor ship-from addresses and products. This is the second half of the `Restrict Entry to a Single Buyer` rule discovered in `VEND-015` and the **closest thing in positions 1–47 to a PO approval/ownership control**.

**Where it lives.** `Purchasing > Settings > Buying Group Settings`. Tabs: **Vendor**, **Vendor Ship-From**, **Product**.

Each buying group specifies *"a single buyer ID, one or more vendors, one or more vendor ship-from addresses, and specific products."*

**Fields — key**

| Field | Type | Purpose / business rule |
|---|---|---|
| Buying Group | code (PK) | The group to create/edit. Search lists existing groups. |

**Fields — Vendor tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Description | text, **up to 30 alphanumeric** | Description of the buying group. |
| Buyer Initials | code (FK → user) | **"the code of the buyer (that is, the user) responsible for buying products within this group."** Search lists users. **One buyer per group.** |
| Vendor | code (FK), repeating | One or more vendors assigned to this group. **"If you select a vendor that already belongs to a buyer group, an error message appears and you must select another vendor."** |

**Fields — Vendor Ship-From tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | code (FK) | Vendor whose ship-from locations are being assigned. **Two hard errors:** (a) *"If you select a vendor that already belongs to a buyer group, an error message appears"*; (b) *"If **no additional ship-from addresses have been established for the vendor**, an error message appears and you must select another vendor."* |
| Ship-From | code (FK) | Ship-from address to assign. Arrow lists the ship-from addresses associated with the selected vendor. |
| Grid | grid | Double-click a row to edit; to Remove, **both** the vendor code and the ship-from code must be present in the fields above the grid. |

**Fields — Product tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Product | code (FK), repeating | Products assigned to this group. **"If you select a product that already belongs to a buyer group, an error message appears and you must select another product."** |
| Grid | grid | Double-click to edit; product code must be in the Product field to Remove. |

**Behavior & rules.**
- **HARD RULE, PO-BLOCKING — this is a real answer to "why can't this PO be entered/why does it need someone else".** Quoted: *"To activate the Buying Group feature, check the box at the **GENERAL - Activate Buying Group** field in the **Purchasing Control Settings**. If you activate this feature, **all products added to a purchase order must contain a buyer and they must all contain the same (single) buyer.**"* So with the feature on, **a PO that mixes products belonging to two different buyers cannot be built**, and a product with no resolvable buyer cannot be purchased at all. That is a genuine, hard, purchasing-side gate — worth flagging against `PO-080`.
- **Another global kill-switch.** The whole feature is inert unless `GENERAL - Activate Buying Group` is on in Purchasing Control Settings — the same pattern as Extended Security and the Costing Control Settings add-on gate.
- **Exclusivity is enforced at every level.** A vendor may belong to only one buying group; a product may belong to only one buying group. Combined with one buyer per group, this makes buyer assignment a **partition**, not an overlay.
- **The documented buyer-resolution hierarchy is corrupt in the source.** Quoted verbatim: *"The system uses the following hierarchy to search for a buyer: 1) Search the **Advanced Product Settings** for a buying group. If none is found, 2) Search the Advanced Product Settings for a **Vendor Ship-From address**. If found, check the Vendor Ship-From record for a buying group. If none is found, 3) Search the **Advanced Product Settings** for a buying group."* **Steps 1 and 3 are identical — step 3 is almost certainly meant to be "search the *Vendor* record for a buying group."** The intended hierarchy is therefore `PRODUCT → VENDOR SHIP-FROM → VENDOR`, which matches the three tabs of the screen exactly. **Do not implement the article as written.**
- *"Once a buying group is established, the system pulls the buyer's initials from the Buying Group record."*
- The Vendor Ship-From tab's help text says *"the **products** you select appear in the grid below"* — copy-paste from the Product tab; the grid holds vendor/ship-from pairs.

**Dependencies.** **Purchasing Control Settings → `GENERAL - Activate Buying Group`** and → `Restrict Entry to a Single Buyer` (`VEND-015`). Advanced Product Settings (product-level buying group). Vendor Ship-From records (`CFG-VEND-SHIPFROM`, `VEND-035`, `PO-020`, `PO-021`). `VEND-014` → Buying Group field. User master (buyer). Purchase Order entry.

**Build notes.**
- **Register this as a security requirement, not a settings file: `SEC-PUR-BUYERSCOPE`.** It determines who may transact against which vendors and products. Cross-reference `parts/user-security-CATALOG.md`.
- Implement the resolution as `PRODUCT → VENDOR_SHIP_FROM → VENDOR` in the standard scoped resolver — it is the same precedence machinery as everything else in this section, and the ship-from level again justifies a `VENDOR_SHIP_FROM` scope alongside `VENDOR_REGION` and `VENDOR_REMIT_TO`.
- **Relax the one-buyer-per-group partition.** A single-buyer-per-vendor partition breaks the moment two buyers cover one vendor across categories, or someone goes on holiday. Model `buying_group` as a set of *members* with a primary owner, and allow coverage/delegation with an effective date range.
- **Do not block PO creation on mixed buyers.** Warn, and let the PO carry a buyer per line — a hard block just teaches people to split POs to route around the control.
- Changes to buyer scope must feed `RPT-AUDIT`.

---

### `VEND-021` Cost Reduced Bill Back Settings
*storis_ref: article 15243031910548*

**Purpose.** Maintains **CRD (cost-reduced discount) codes** used when processing cost-reduced bill-back purchase credits. Quoted: *"CRD purchase credits are a 'hybrid' of the existing bill-backs and DFI's (deduct from invoice)."* **This is the third and most consequential vendor-chargeback disposition** — the discount is taken into inventory cost immediately *and* a vendor receivable is raised.

**Where it lives.** 20 menu paths (same sprawl as `VEND-017`), across System Administration, Accounting (Payables / Vendor Receivables / GL → Purchase Discount Settings) and Merchandising & Distribution.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Cost Reduced Bill Back Code | code, **up to 6 alphanumeric** | The CRD code. Search → read-only lookup window. |
| Description | text, **up to 20 alphanumeric** | Description. Action button → **Description Field - Language Translation Entry** screen. |
| General Ledger Account | GL account | **"the General Ledger account you want to *credit* when applying this CRD code."** Action → GL Account Entry Screen. |
| Include Service Parts | checkbox | Allows this CRD code to apply discounts to **customer service parts**. |

**Behavior & rules.**
- **HARD RULE — you cannot enter CRD discounts on a PO until at least one code exists.** *"To enter CRD discounts during Purchase Order entry, you must create at least one CRD code using this routine."*
- **Exact double-entry posting, quoted in full — this is the most precise accounting statement in the section.**

  When you apply a CRD to a purchase order line item, the system:
  1. *"uses the discounted cost as the **receipt cost** (similar to a DFI),"*
  2. *"**debits** the inventory general ledger account, and"*
  3. *"**debits** the costing table."*

  When you approve the AP bill for the product, the system:
  1. *"creates a **vendor receivable open item** for the discounted amount (similar to a bill-back),"*
  2. *"**debits** the vendor receivables account, and"*
  3. *"**credits** the CRD general ledger account."*

- **The three chargeback dispositions differ only in timing and posting — state the difference plainly:**

  | | Receipt cost | AP invoice | Vendor receivable |
  |---|---|---|---|
  | **DFI** (`VEND-022`) | reduced | short-paid | none |
  | **Bill Back** (`VEND-017`) | full | paid in full | raised |
  | **CRD** (`VEND-021`) | **reduced** | paid in full | **raised** |

  **CRD therefore takes the benefit into margin at receipt while still leaving the cash to be collected.** If the vendor never pays the receivable, margin has already been booked and only the receivable write-off reverses it — **that is the single biggest financial-control risk in this half of the section.**
- Unlike Bill Back (`VEND-017`) and DFI (`VEND-022`), **CRD has no Percent/Dollar, no Rate or Amount, and no Chain Discount field** — the amount is evidently entered per line at PO entry rather than defaulted from the code.

**Dependencies.** `VEND-017` Bill Back Settings, `VEND-022` Deduct From Invoice Settings, Vendor Receivables module, General Ledger, costing table / inventory GL, Purchase Order entry, AP bill approval, Advanced Product Settings (service parts flag). Language translation subsystem.

**Build notes.**
- **`[DECISION NEEDED]` Do we support CRD at all?** Recommend **no** for v1. Recognising a vendor credit into inventory cost before it is collected is a policy decision the finance owner must make explicitly, not a code file a buyer can create.
- If we do support it: require an **explicit approval** to create a CRD code, force a receivable ageing/dunning workflow, and add a periodic reconciliation that compares CRD margin taken to CRD cash collected. STORIS provides neither.
- Unify with `VEND-017` and `VEND-022` under one `vendor_chargeback_type` with an explicit `posting_profile` — the three code files are the same entity with three posting rules.
- Every CRD application must feed `RPT-AUDIT`; it restates inventory value and margin in one step.

---

### `VEND-022` Deduct From Invoice Settings
*storis_ref: article 15243032141204*

**Purpose.** Maintains **DFI codes** — the discounts applied to purchase orders and deducted directly from the vendor's invoice. *"Use this file to add discounts to purchase orders and to set up chain discounts."* This is the code file referenced by `VEND-014` → Discount Costing, `VEND-005`, `VEND-017` and `VEND-021`.

**Where it lives.** 21 menu paths across Merchandising & Distribution, Accounting (Payables / Vendor Receivables / GL / Third Party Accounting) and System Administration. *"You can add DFI codes via the **Advanced Vendor Settings** and **Collection Settings**."*

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| DFI Code | code | The code representing this discount. |
| Percent or Dollar | enum | `Percent` or `Dollar` — specifies how Rate or Amount is interpreted. |
| Rate or Amount | number | Percentage rate or dollar amount for the Chain Discount. |
| Chain Discount | checkbox | Checked → chain calculation; blank → *"have the system calculate the amount based on the **original invoice cost**."* |
| Description | text, **up to 20 characters** | Describes the DFI code. |
| Include Service Parts | checkbox | *"To allow users to apply DFI discounts to line items that are service parts, check the box."* |

**Behavior & rules.**
- **Chain Discount — identical wording to `VEND-017`, so this is one shared engine.** *"Use this feature if you want to include multiple DFI discounts on a single line item. After applying the first DFI, the system applies the subsequent DFI discounts to the **reduced cost**, rather than the 'before discount' amount. That is, the system applies the DFI discount to the previously discounted amount."*
- **The critical gap, restated: the source never defines the ORDER in which chained DFIs are applied.** With mixed percent and dollar codes the order changes the answer, and with `Chain Discount` set per-code rather than per-line it is not even clear whether the flag governs *this* code's basis or the whole chain's behaviour. **This must be pinned down before any implementation.**
- A DFI **reduces what we pay** (short-pay/deduct), as distinct from a Bill Back (`VEND-017`, raise a receivable) and a CRD (`VEND-021`, both).
- Notably absent compared with `VEND-017`: **no General Ledger Account field.** A DFI is a cost reduction, so it needs no separate GL landing account — which corroborates the disposition table in `VEND-021`.
- The DFI is the default discount on PO entry via `VEND-014` → Discount Costing → Code, overridable per category/group via `VEND-005`, where **the code, type, amount and dates may all be hand-edited away from the DFI master.**

**Dependencies.** `VEND-014` → Discount Costing; `VEND-005`; `VEND-017`; `VEND-021`; **Collection Settings** (a second place DFI codes can be attached); Purchase Order entry; AP invoice matching.

**Build notes.**
- **`[DECISION NEEDED]` (P1) — define chained-discount semantics precisely:** application order, whether `chain` is a property of the code or of the line, rounding at each step, and behaviour with mixed percent/dollar. Write it as a worked numeric example in the spec and unit-test it. This single ambiguity affects landed cost, margin, AP matching and vendor claims simultaneously.
- Recommend: an explicit integer `sequence`, chaining as a property of the *line's* discount stack rather than of each code, round only at the final net, and store the **full computed discount ladder** on the PO line so AP can reproduce it exactly at invoice time.
- Store both `gross_cost` and `net_cost` on the PO line, never just the net — STORIS's "reduced cost" chain destroys the audit trail of how a cost was reached.
- Merge with `VEND-017`/`VEND-021` per the `VEND-021` build note.

---

### `VEND-023` Deliver To Settings
*storis_ref: article 15243032739860*

**Purpose.** **Not a vendor setting — a customer-side addressing file.** Creates and maintains **multiple Deliver To addresses for one customer**, used with multiple fulfillments during order entry. *"For example, if the customer is an apartment complex management company or a housing development corporation, the customer may purchase merchandise that will be paid for by the company but delivered to multiple addresses."*

**Where it lives.**
- `System Administration > System Settings > Purchasing and Logistic System Settings > Logistical System Settings > Deliver To Settings`
- `Logistics > Settings > Deliver To Settings`
- `Enter a Sales Order > Fulfillment page > global Actions button > Create New Deliver To option`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer Code | code (FK) | **"A customer record must already exist for this customer."** Once entered, the Description field becomes active. |
| Deliver To | text, **up to 30 characters** | Identifies this location. **"Each Deliver To location for this customer must be unique."** |
| Name | text, **mandatory** | Name of the deliver-to. **Defaults from the associated Customer record but can be changed.** |
| Contact Name | text | Person to contact at this location. **"The length of all name elements combined is limited to 50 characters."** |
| Address 1 | text | First address line. |
| Address 2 | text | *"for P.O. Box, Dept., etc. It is **not** meant for city, state, and zip code."* |
| Zip Code | text | Drives City and State defaults. |
| City | text | **Defaults from the zip code file record; overridable.** |
| State | text | **Automatically defaults from the zip code file record.** |
| Country | text | Defaults to the address's country. |
| Home Phone / Cell Phone / Work Phone / Extension | text | Default from the associated customer; optional and changeable. |
| Email | text | Optional; defaults from the customer's primary email. **See the contradictory formatting rule below.** |
| Primary Delivery Address | checkbox | Marks this as the Primary Delivery Address maintained in **Advanced Customer Settings**. |
| Carrier | code (FK) | Carrier used to deliver to this location. |
| Delivery Instructions for this Address | long text | See below. |

**Behavior & rules.**
- **The source contradicts itself on email separators, in consecutive sentences.** Quoted: *"For multiple email addresses, separate with a **comma or semicolon**. **No spaces are permitted.** For multiple email addresses, separate with a **return. Commas and semicolons are not permitted in this field.**"* **Two mutually exclusive rules for one field.** Do not guess; the second (newline-separated) reading is the later-written one and matches the "no commas" wording of the button behaviour.
- **HARD DEFAULTING RULE.** *"If Deliver to address(es) exist and **none are set as the Primary Delivery Address, then it must be manually selected for the Sales Order**. If one does exist, it is defaulted in any new order."* Structurally **the same pattern as vendor ship-from defaulting** in `VEND-014` (one default → auto-fill; none → force the user to choose).
- **Delivery instructions propagate to open orders.** *"The text you enter here defaults into the Extended Instructions Text Box in order entry when using this specified address. **This applies to all open orders for this customer.**"* Printing is gated by the `Print Delivery Instructions for this Address` checkbox in order entry. Fulfillment-specific text goes in `Instructions for this Fulfillment Only`, which *"is independent of the default text in this setting."*
- **The email icon opens the desktop mail client, outside STORIS.** *"Since the email window is opened via a separate Windows® process, not STORIS, the email's functionality (e.g. sending, saving as a draft, etc.) is controlled through the email client. Additionally, **no comments are written to STORIS**."* — i.e. **customer communication sent this way leaves no record in the ERP.** Same class of defect as the wave-1 EDI "mitigated only by an after-the-fact email" finding.

**Dependencies.** Customer master, Advanced Customer Settings (Primary Delivery Address), zip code file, Carrier master, Sales Order entry / Fulfillment page, `VEND-029` Delivery To Description Lookup, Address Verification.

**Build notes.** File under **customer/logistics**. Adopt the "one default → auto; none → mandatory choice" pattern as a shared rule with vendor ship-from. **Pick one email-separator rule and validate it** — store emails as a normalised child table (`deliver_to_email`) rather than a delimited string, which removes the ambiguity entirely. **Never send customer communication through an untracked channel**: any email we offer must be sent by the system and logged against the customer. `[DECISION NEEDED]` Does LA Mattress have commercial/multi-site customers that need this at all?

---

### `VEND-024` Delivery Charge Settings
*storis_ref: article 15243031916948*

**Purpose.** **Not a vendor setting.** Specifies **default delivery charges on sales orders** by zip code and optionally by product/group/category.

**Where it lives.** `Customer > Settings > Logistical Settings > Delivery Charge Settings`; `Merchandising and Distribution > Settings > Logistical Settings > …`; `System Administration > System Settings > Customer System Settings > Logistical System Settings > …`. *(The article also refers the reader to the "Delivery Charges learning path in STORIS Academy".)*

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Level | enum | `None Selected`, `Zip Code Only`, `Zip Code and Category`, `Zip Code and Group`, `Zip Code and Product`. **"Once you make a selection, the corresponding fields activate on the screen. All active fields are mandatory."** |
| Zip Code/Postal Code | code | The zip/postal code. With `Zip Code Only`, multiple zip codes can be selected via the Action button. |
| Product | code (FK) | Search → *Search for a Product* window; Actions → *Multiple Product Selection Window*. |
| Group | code (FK) | **"if you select a group at this field, you inactivate the Product and Category fields."** Arrow → Multiple Group Selection Window. |
| Category | code (FK) | **"if you select a category at this field, you inactivate the Product and Group fields."** Arrow → Multiple Category Selection Window. |
| Delivery Charge | money | *"The amount defaults into the Delivery Charge field during sales order processing, but **users can override this amount**."* |

**Behavior & rules.**
- **Exact resolution hierarchy, first found wins:** **`Product → Product Group → Product Category → Zip Code`.** Note the **product dimension outranks the zip dimension entirely** — a product-level charge wins regardless of destination.
- **HARD RULE — edits do not reprice open orders.** *"Changes made here to an existing delivery charge **will not apply to open orders** unless the **fulfillment method or deliver-to address are changed**."* So a repricing silently applies to some open orders (those later edited) and not others.
- **Bulk-edit prompt with a real footgun.** *"If the Delivery Charge field contains an amount that has already been specified for another zip code (or zip code/product combination), a prompt appears with the option to **edit the delivery charge for all found to share the same delivery charge**. If you say **Yes**, `" ... "` appears in the Zip Code/Postal Code field, indicating multiple codes are selected for editing… To edit only the current zip code, answer **No** to the prompt."* **Answering Yes silently repoints every unrelated record that merely happened to carry the same dollar amount.** Amount-equality is being used as an identity key. That is dangerous and we must not copy it.
- The three product dimensions are mutually exclusive at entry time by field inactivation, but the *resolution* hierarchy still ranks all three, implying rows of different levels coexist.

**Dependencies.** Zip code file, product/group/category masters, Sales Order entry (`Delivery Charge` field), `VEND-046` Per Piece Delivery Charge Settings, `VEND-025` Delivery Charge Table Settings, Fulfillment Handling Method Settings. Related article: *Track Settings Activity*.

**Build notes.** File under **logistics/pricing**. Implement as the standard scoped resolver (`PRODUCT → GROUP → CATEGORY → ZIP`). **Never key a bulk edit on a value; key it on identity** — offer an explicit multi-select instead of "everything that costs the same". Decide repricing policy explicitly: **`[DECISION NEEDED]`** should a delivery-charge change reprice open orders, never reprice, or flag them for review? STORIS's "only if you touch the order" is the worst of the three. Note *Track Settings Activity* exists as a related article — worth checking whether it is a real audit facility that contradicts the wave-1 finding that STORIS has no general change-audit log.

---

### `VEND-025` Delivery Charge Table Settings
*storis_ref: article 15243031913748*

**Purpose.** **Not a vendor setting.** Creates tiered **delivery charge tables** (banded by merchandise dollars or weight) attached to a delivery company. *"This process is **only accessible through Delivery Company Settings and is not available through the menu**."*

**Where it lives.** `Delivery Company Settings > Delivery Charge Tables tab > Code field extra-action button`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | text, **up to 10 characters, cannot contain spaces** | Unique identifier. **"When maintaining an existing delivery charge table, this field is inactive and cannot be changed."** |
| Description | text, **required, up to 30 characters** | Action button → Description Field - Language Translation Entry. |
| Value Type | enum, **required** | `Percent of Dollars` — **only valid when Range Unit of Measure is Dollars**; `Per Weight Unit` — **only valid when Range Unit of Measure is Weight**; `Flat Charge` — valid with either. |
| Range Unit of Measure | enum, **required** | `Dollars` or `Weight`. |
| Inventory Formation | code (FK), optional | Associates the table with specific products/groups/categories. Action → `Create New Inventory Formation`, `Maintain Assigned Inventory Formations`, `Multiple Formations`. |
| All Lines Must Be Included in Formation | checkbox | **Checked → "the charge table only applies to orders with ALL lines included in the specified inventory formations."** Unchecked → *"applies to orders with **any** lines included in **any** of the specified inventory formations."* |
| Handling Method | code (FK), optional, multi | Associates one or more handling methods with this table. |
| Membership Product Code | code (FK), optional | For membership benefits offering reduced/free delivery. **"a valid Membership Product Code (which can be found when a product has the Membership Program box checked in Advanced Product Settings) must be entered here."** |
| Lower Range | number, repeating | Merchandise value or weight starting each tier. |
| Value | number, repeating | Flat charge amount, percent-of-value, or per-weight-unit rate per Value Type. |

**Behavior & rules.**
- **Validation is deferred to save, not blocked at entry.** *"While **any** combination of Value Type and Range Unit of Measure can be entered, the combination is checked **upon saving**. If an invalid combination is specified, a message appears to indicate this."* So the UI knowingly allows an invalid state and rejects it late.
- **Tier construction — exact rule, quoted.** *"When entering the first Lower Range item, you enter **0 (zero)** and the corresponding value. Enter the next Lower Range (10 for example) to create a range from 0 to the number you enter (10 in this example). If you then enter 20, your table will then have three ranges: **from zero to 10, from >10 to 20, and >20** (that is, any number greater than 20). Note that **you must create a range using 0**. In this way, you cover the area from 0 to the lowest range number in the grid delivery charge table."* Bands are therefore **`[0,10]`, `(10,20]`, `(20,∞)`** — lower-inclusive at zero, upper-inclusive thereafter. **The zero row is mandatory or the table has a hole.**
- *"The information in the Delivery Charge Table grid is automatically sorted in **descending** order."*
- **Flat vs per-unit semantics, quoted example:** *"1) calculate by weight using a series of one more or flat charges… you can assess a flat delivery charge of \$1 to deliver up to one pound of merchandise, \$2 for two pounds… OR 2) calculate by weight using a series of one or more per-weight-unit charges **to be multiplied by the number in the Lower Range field**."* **The second reading is suspect** — multiplying by the *Lower Range* rather than by the order's actual weight would make the charge a step function, yet the same sentence then says *"multiply the **total weight of the order** by \$1"*. **The source states both bases in one paragraph; resolve before implementing.**
- **Membership recommendation (not enforced):** *"It is recommended that the Value Type be set to **Flat Charge** and the Range Unit of Measure be set to **Dollars**. This allows for a flat dollar amount to be assigned when a customer has an active membership program for the membership product supplied."*
- **Worked selection example, quoted:** *"Table 1 = Inventory Formation is Mattress, Handling Method is White Glove; Table 2 = Inventory Formation is Mattress, Handling Method is Curbside."* — **directly applicable to LA Mattress.**
- **The article does not state which table wins** when several tables match one order (formation × handling method × membership). With `All Lines Must Be Included` unchecked, several tables can match simultaneously. **Unspecified precedence on a money-moving calculation.**

**Dependencies.** Delivery Company Settings (`VEND-026`, sole entry point), Inventory Formation Settings, Fulfillment Handling Method Settings, Advanced Product Settings (`Membership Program` flag), `VEND-024`, `VEND-046`. Language translation subsystem.

**Build notes.** File under **logistics/pricing**. Make Value Type × Range Unit a **single composite enum** (`FLAT_BY_DOLLARS`, `FLAT_BY_WEIGHT`, `PCT_OF_DOLLARS`, `RATE_PER_WEIGHT_UNIT`) so an invalid combination is unrepresentable rather than caught at save. **Validate tier coverage**: require a row at 0 and reject gaps/overlaps at entry. **`[DECISION NEEDED]`** resolve the per-weight-unit basis (order weight vs tier lower bound) and **define table-selection precedence explicitly** when multiple tables match. Store the resolved table id and the computed ladder on the order so a charge can be explained after the fact.

---

### `VEND-026` Delivery Company Settings
*storis_ref: article 15243030217748*

**Purpose.** **Not a vendor setting** (though filed under Vendor Information Settings in one path). Maintains the **delivery companies/carriers** we ship with, and the method used to calculate freight automatically on orders. It is the parent of `VEND-025` Delivery Charge Table Settings.

**Where it lives.** Seven paths including `System Administration > Get Started - Enter Your Information > Get Started Step 6 - Purchasing > Delivery Company Settings` and `System Administration > System Settings > Merchandising and Distribution System Settings > Vendor Information Settings > Delivery Company Settings`. Tabs: **General**, **Delivery Charge Tables**.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Delivery Company Code | code | The delivery company to create/edit. |
| Name | text | Company name. |
| Address Line 1 / 2 | text | Line 2 *"for P.O. Box, Floor #, Dept., etc., but not city, state, or ZIP code."* |
| Zip Code/Postal Code | code (FK) | **"The code you enter must already exist in the Zip Code file."** |
| City/Town | text | Defaults from the Zip Code; overridable. |
| State/Province | text | Defaults from the Zip Code; overridable. |
| Telephone | text | Phone number. |
| Contact | text | Contact name. |
| Delivery Company Type | enum | `Self-Owned`, `Third Party`, `Parcel` — see below. |
| Use Delivery Charge Tables | checkbox | **"If you check the box at this field, you clear and inactivate the Flat Rate field below."** |
| Flat Charge | money | Flat delivery rate not based on value or weight. **"If you enter a response here, you clear the Delivery Charge Tables and inactivate the Delivery Charge Tables tab."** |
| Third Party Logistics EDI Code | code (FK) | **"The EDI code entered here must be a valid code set in Third Party Logistics EDI Settings."** See EDI note below. |

**Fields — Delivery Charge Tables tab** (*"To access this tab, a check must appear at Use Delivery Charge Tables field on the General tab."*)

| Field | Type | Purpose / business rule |
|---|---|---|
| Minimum Charge | money | **"This amount overrides the calculated amount… in the event the calculated amount is less than the amount specified here."** |
| Maximum Charge | money | Overrides the calculated amount when it is greater. |
| Additional Charge | money | Added onto the charge calculated by the delivery charge table or delivery matrix. |
| Minimum Purchase Amount | money, optional | Minimum merchandise subtotal for delivery. **Enforced with a security override — see below.** |
| Alternate Charge | money | Flat override based on product type. **"Zero is a valid charge; a null charge indicates that this is not being used."** **"If you specify an alternate charge here, it is used FIRST in the hierarchy to determine delivery charges."** |
| Inventory Formation | code (FK), multi | Qualifies products for the Alternate Charge. Action → `Create New Inventory Formation`, `Maintain Assigned Inventory Formations` (single code only), `Multiple Formation`. |
| All Lines Must Be Included in Formation | checkbox | Checked → all product lines must qualify; blank → **any** line qualifying is enough. |
| Code (Delivery Charge Tables grid) | code (FK), multi, ordered | Tables applied to this company. Action → creates a new table via `VEND-025`. Added to the **bottom** of the grid. |
| Grid columns | display | `Code`, `Description`, `Value Type` (`Flat Charge`/`Percent of Dollars`/`Per Weight Unit`), `Unit of Measure` (`Weight`/`Dollars`), `Inventory Formation` (**multiple shown as an ellipsis `"..."`**), `All Lines`, `Remove`, `Edit`. |
| Promote / Demote | buttons | **"Delivery charge tables are applied in top-down order, which is the order the tables are checked when calculating an order's delivery charge."** |

**Behavior & rules.**
- **HARD RULE — a magic undeletable fallback record.** *"STORIS comes installed with a default delivery company whose code is **ZZZZZ**. **You cannot delete this delivery company**, as STORIS applies it to orders for which a delivery company cannot otherwise be found."*
- **Delivery-company defaulting hierarchy on sales order entry, quoted:**
  1. *"If the customer's zip code contains a **default route code**, sales order-entry defaults the delivery company associated with that route code."*
  2. *"If the customer's zip code does not contain a default route code, the **Route Code Entry Window** appears, via which you can enter a route code."*
  3. *"If the customer's zip code does not contain a default route code and you do not enter a route code…, the program uses the **default delivery code (ZZZZZ)**."*
  Overridable at the `Ship Via` field on the **Additional Fulfillment Information** screen. **Only one freight company per order.**
- **Recalculation triggers, quoted:** *"STORIS calculates (or recalculates) the delivery charge in any of the following situations within an order-entry routine: you change the ship-to zip code; you access the Totals page of the routine."* — **so a charge can silently change simply because someone opened the Totals page.**
- **Delivery Company Type — exact semantics, and the two non-obvious ones matter:**
  - `Self-Owned` — company vehicles. *"STORIS' standard way of delivering."*
  - `Third Party` — e.g. Yellow, Roadway. *"You define the delivery company via the **Route Code** field in the Logistical Route Settings. The order-entry program determines the delivery company based on the **delivery destination**."*
  - `Parcel` — e.g. UPS, DHL, FedEx. **"STORIS delivers by parcel service based on the PRODUCTS on the order as opposed to the order destination."** and *"The system **automatically assigns** parcel products to ship via parcel companies. Use the **Delivery Method** field in the **Product file** to identify products as Parcel products."*
  **So carrier selection is destination-driven for Third Party but product-driven for Parcel — two different selection algorithms behind one enum.**
- **HARD RULE — Flat Charge and Delivery Charge Tables are mutually exclusive and each destructively clears the other.** Setting one *"clears and inactivates"* the other. **Data loss on toggle**, not merely disablement.
- **Split-order charging, quoted:** *"For split orders, the system applies the **full delivery charge during the initial release** for completion of the order. That is, **even if only a portion of the order is for delivery, the system still calculates delivery charges based on the entire order** and defaults the charge during the initial release for completion. You can override this amount."*
- **`Minimum Purchase Amount` is enforced by a security override — a rare explicit permission linkage.** Quoted: *"If the subtotal of the sales order is less, the user is presented with a warning message. If the user chooses to continue with the sale, the **`Override System Calculated Delivery Charges`** setting in **Create a User/Group Actions - Sales Security** is examined; if checked, the sale can continue, but if unchecked, the user is presented with the security override, where a user with credentials can allow the sale to continue."* The subtotal *"is the subtotal of merchandise, it does not include discounts, charges, or fees."*
  **Loophole, quoted:** *"If a sales order is **partially completed** and the user returns to edit the remaining portion, **no additional checks occur** to determine if it satisfies the minimum purchase amount."*
  The same paragraph also contains a **contradiction**: the first version says the user gets a warning and may continue via override; the second says *"the user is presented with a warning message and **the order is not accepted**."* Two versions of the rule in one field's help text.
- **Alternate Charge / Inventory Formation pairing is a warning, not a constraint.** *"If you enter an alternate charge and leave the inventory formation field blank, or vice versa, a warning message appears… You have the option to answer **No** to continue and enter the missing data or answer **Yes and save the record as is**."* **A half-configured alternate charge is savable.**
- *"The Point of Sale Control Settings field **Recalculate Delivery Charge** determines whether alternate delivery charges are re-calculated."*
- **UI trap:** *"If a new delivery charge table has been created, the **Clear button does not delete the new table**."* And `Remove` on the grid only disassociates; `Edit` opens `VEND-025` where the table can be genuinely deleted.
- The tab text says *"Multiple tables **per vendor** may be set up and prioritized"* — **"vendor" here means delivery company**, a terminology collision worth noting given this section's name.

**EDI — vendor/carrier write access (flagged per the assignment).**
**`Third Party Logistics EDI Code` grants an external logistics provider the ability to write fulfillment state into our system.** Quoted: *"When this field is populated and this company is chosen as the carrier from Build a Manifest, information from the Third Party Logistics EDI Settings is used to determine the EDI options. For example: Can the company accept **215's**? If so, an option in Build a Manifest to send this company a 215 EDI document for the manifest is activated. Will this third party logistics company acknowledge receipt/delivery of merchandise via the **214** EDI document? **If they send 214's, do we accept partial completions from this third party logistics company?**"*
**FLAG — "do we accept partial completions" is a third party writing delivery-completion status onto our orders.** It is the same risk class as the wave-1 `EDI - Allow Acknowledgment to Adjust Order Quantity` finding: an external party mutating our transactional records. A 214 that reports partial completion changes what we believe was delivered, which drives revenue recognition, customer billing and the delivery survey trigger. The actual flags live in **Third Party Logistics EDI Settings** (not in this half of the section — likely `vendor-settings-b` or another part). **Whoever holds that article must document the partial-completion flag in full.**

**Dependencies.** Zip Code file, Logistical Route Settings (`VEND-042`), Route Code Entry Window, **Third Party Logistics EDI Settings**, Inventory Formation Settings, Product file → `Delivery Method`, Point of Sale Control Settings → `Recalculate Delivery Charge`, **Create a User/Group Actions - Sales Security → `Override System Calculated Delivery Charges`** (cross-reference `parts/user-security-CATALOG.md`), `VEND-025`, `VEND-024`, `VEND-046`, Build a Manifest, Membership Reward Settings, General Ledger Assigned Account Settings.

**Build notes.**
- File under **logistics**. Merge the carrier record into the shared `business_party` model proposed in `VEND-019`.
- **Never destructively clear one pricing method when another is chosen.** Model `charge_method ∈ {FLAT, TABLES}` and retain both configurations.
- **Do not implement a magic undeletable `ZZZZZ`.** Model "unassigned carrier" as a nullable FK plus a validation at release, so an order without a carrier is *visibly* incomplete rather than silently assigned to a placeholder.
- Make the full charge hierarchy explicit and testable: `Alternate Charge (formation match) → prioritised Delivery Charge Tables (top-down) → Flat Charge`, then apply `Additional Charge`, then clamp to `[Minimum Charge, Maximum Charge]`. **Record the resolved path on the order.**
- Close the partial-completion loophole in `Minimum Purchase Amount` — re-validate on every edit, not only at first entry. And resolve the warn-vs-reject contradiction. `[DECISION NEEDED]`
- **`[DECISION NEEDED]` (P1) — do we accept EDI 214 partial completions from third-party carriers at all?** Default should be **no**: accept the document, stage it, and require a human or a reconciliation rule to apply it. External parties should not directly mutate fulfillment state.

---

### `VEND-027` Delivery Contact Status Settings
*storis_ref: article 15243031912852*

**Purpose.** **Not a vendor setting.** A two-field code table of **delivery contact status codes** (the outcome of attempting to contact a customer about a delivery).

**Where it lives.** `Customer > Settings > Logistical Settings > Delivery Contact Status Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | text, **up to 6 alphanumeric** | The status code. Search lists existing codes. |
| Description | text, **up to 30 characters** | Action button → **Description Field - Language Translation Entry** screen (multi-language descriptions). |

**Behavior & rules.** No validation, defaults, or state transitions documented. **The article does not say what consumes these codes or whether any are system-reserved** — a pure open code list. (Article rated *0 out of 2 found this helpful*, which is consistent with how little it says.)

**Dependencies.** Delivery contact / delivery scheduling screens (not named in the article). Language translation subsystem.

**Build notes.** File under **logistics**. Codes that drive workflow should not be a free code list — attach a `behaviour` classification (`REACHED`, `NO_ANSWER`, `RESCHEDULED`, `REFUSED`, …) so reporting and automation can key on semantics rather than on customer-invented codes. Note the **Description Field - Language Translation Entry** pattern recurs across this section (`VEND-021`, `VEND-025`, `VEND-027`): descriptions are translatable everywhere — if we need multi-language, build it once as a generic translatable-string facility.

---

### `VEND-028` Delivery Survey Settings
*storis_ref: article 15243032151316*

**Purpose.** **Not a vendor setting.** Creates and maintains the **customer delivery survey question bank**. *"You can define an unlimited number of survey questions and their associated response types, order types, and active question statuses."*

**Where it lives.** The article's Access section is **empty** — no menu path is given. The article is published in two version variants (**11.0** and **10.8**) whose bodies are identical. Downstream: *"use the **Delivery Survey Screen** to select the orders you want to conduct surveys on."*

**Fields** — **the article lists field names as headings with no descriptive text under them.** Recorded verbatim, without detail:

| Field | Type | Purpose / business rule |
|---|---|---|
| Survey ID | code | *(No description in the source.)* |
| Question | text | *(No description in the source.)* |
| Response Type | enum | *(No description; enum values are not given anywhere in the article.)* |
| Order Type | enum | *(No description; values not given.)* |
| Active Question | flag | *(No description in the source.)* |
| Buttons | — | *(Heading present, no content.)* |

**Behavior & rules.** The *rules* are documented even though the fields are not, and they are unusually strict:
- **HARD RULE — questions can never be deleted.** *"Because removing an existing question invalidates any existing results for that question, the program prevents you from deleting questions. Thus, the **Remove button for the grid and the Delete button are never active** in this routine."*
- **HARD RULE — editing a question's Response Type or Order Type is blocked outright.** *"if you edit the **Response Type or Order Type** fields, an error message appears stating that changing these fields may invalidate existing answers in the survey results file. **The program cancels the Add, and prevents you from saving the changes.**"*
- Editing the **question text** is allowed with a warning only: *"a message appears warning that changing the context of the question may invalidate previous results… You can continue or cancel."* **So the wording of a question can drift while its answers are retained — the one immutability hole in an otherwise immutable design.**
- **Retention rule.** *"The system **purges survey responses (but not the questions) via the End-of-Month process**."* — **survey answers are destroyed monthly.** Any trend analysis must be extracted before EOM.
- *"You create the questions in advance, and you cannot edit individual questions once you create them. In this way, you establish continuity in your surveys."*

**Dependencies.** Delivery Survey Screen; End-of-Month process; order type master. Related: `VEND-018` Birdeye Settings (the third-party survey path — **note the two survey systems are unrelated and can both be active**).

**Build notes.** File under **customer experience**. The immutability instinct is right but implemented as edit-blocking; **version the question instead** (`survey_question_version`), keep responses bound to the version they answered, and allow new versions freely — that preserves analysis integrity *and* lets the question evolve. **Do not purge responses monthly**; aggregate and retain. `[DECISION NEEDED]` Do we run in-house surveys, Birdeye-style third-party surveys, or both? Running both doubles customer contact.

---

### `VEND-029` Delivery To Description Lookup
*storis_ref: article 15242997735956*

**Purpose.** A small lookup window for choosing an **existing Deliver To** belonging to the current customer, from within `VEND-023` Deliver To Settings.

**Where it lives.** `Deliver To Settings > Action button at Description field`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Customer | display-only | The selected customer code and the customer's name. |
| Grid | display | *"All existing Deliver To's associated with this customer appear in the grid. The grid displays the Deliver To's description (from the Deliver To Setting's **Description** field) as well as the associated address (from the Deliver To Setting's **Shipping Address** section)."* |

**Behavior & rules.** *"Double-click a grid item to select it. This window closes and the selected information is pulled into Deliver To Settings."* **Terminology inconsistency worth noting:** this article calls the field **Description**, while `VEND-023` calls the same field **Deliver To**.

**Dependencies.** `VEND-023` Deliver To Settings; Customer master.

**Build notes.** File under **customer/logistics**. Not a separate requirement — this is a picker component. Build one reusable scoped-entity picker rather than a screen per lookup; this section contains several near-identical "Read-Only Lookup Window" articles.

---

### `VEND-030` Distribution Status Settings
*storis_ref: article 15243030408724*

**Purpose.** **Not a vendor setting.** Maintains **distribution status codes assigned to products** that control *"where merchandise is coming from (stock location) and whether or not it can be reserved at locations other than the selling location."* Consumed by sales order, exchange and transfer entry.

**Where it lives.** `Merchandising and Distribution > Settings > Logistical Settings > Distribution Status Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Distribution Status | code, **up to 10 alphanumeric** | Unique code. Search → Read-Only Lookup Window. |
| Short Description | text, **up to 10 alphanumeric** | Action → Description Field - Language Translation Entry. |
| Long Description | text, **up to 30 alphanumeric** | Action → Description Field - Language Translation Entry. |
| Inventory Availability | **four checkboxes** | `Only at Selling Location`, `From Multiple Locations`, `Limit Distribution`, `Defective`. See rules. |

**Behavior & rules.**
- **HARD RULE — the behavioural field is immutable after creation.** *"When you edit an existing status code, **only the Short and Long Description fields can be changed**. The Inventory Availability field is not available for change; **you can create a new status code and delete the old one**."* (Note the article blithely suggests deleting a code that products may still reference.)
- **`Only at Selling Location`** — *"Products with this status entered on a sale are required to have **matching selling store and stock location**. There must be **sufficient quantity on-hand** to fulfill the line item **before you can save** these items on the order. **Transfers cannot be created if this setting is checked.**"*
- **`From Multiple Locations`** — *"If there is not sufficient quantity available at the stock location, the system checks the **warehouse/store location settings for a hierarchy of locations** to check for available merchandise in order to fulfill the sales order or sale portion of the exchange."*
- **`Limit Distribution`** — *"Products with this status are **restricted from being transferred from a location that is NOT designated as a Store, as defined by Location Type**, regardless of available quantity. Store locations can transfer merchandise to either other stores or warehouses, provided there is sufficient quantity to transfer."* **i.e. warehouses cannot ship these products out at all.**
- **`Defective` — a hard, system-wide sell-block, with the exact message text.** *"The other check boxes in this setting… cannot be checked; conversely, if one of the other check boxes are checked, this option cannot be checked."* Products with this status **cannot be added to**: `Enter a Sales Order`, `Enter an Exchange` (sale merchandise), `Enter a Quick Sale`, `Enter a Shopping Cart`, `Enter a Transfer`, `Enter a Stock Transfer`, `Enter an As-Is Transfer`, `Enter a Floor Sample Transfer`, `Enter a Move to As-Is Transfer`. **Exact prompt text: `"Product XXXXXX is defective and cannot be added."`** Also: *"**Auto transfers are not created** for products with this status"* and *"Products with this setting **cannot be added to kits or as-is kits, including as a substitute product**."*
- So `Defective` is mutually exclusive with all three others; the other three are documented as independently checkable, each with the redundant note that Defective cannot be combined.

**Dependencies.** Product master (status assignment), Warehouse/Store Location Settings (location hierarchy, `Location Type`), sales order / exchange / quick sale / shopping cart / all transfer routines, kit and as-is kit definitions, auto-transfer generation. Related: Maintain Distribution Location Schema.

**Build notes.** File under **inventory/logistics**. This is a genuinely good idea (**a product-recall kill-switch that blocks every sales and transfer path with one flag**) — worth reproducing as `INV-DISTSTATUS`. Model `Inventory Availability` as a **single enum** (`SELLING_LOCATION_ONLY`, `MULTI_LOCATION`, `LIMIT_DISTRIBUTION`, `DEFECTIVE`) rather than four XOR-ish booleans. **Do not make it immutable**; make it *versioned and audited* — immutability just leads to orphaned codes and the article's own "delete the old one" advice, which risks dangling references. Deleting a status code that any product references must be blocked.

---

### `VEND-031` Drop Off Storage Location Table
*storis_ref: article 15243029579668*

**Purpose.** **Not a vendor setting.** Pre-defines **drop-off storage locations by route/truck** so an RF-gun operator receiving a transfer does not have to scan the drop location.

**Where it lives.** `Warehouse/Store Location Settings > Barcode page > global Actions button > Drop Off Storage Location Table`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Route Code/Truck | text | Route or truck whose pieces drop at the defined Storage Location. **"This field accepts any entry and is not validated."** |
| Storage Location | code (FK) | Storage location for the **current** warehouse/store location. |

**Behavior & rules.**
- **Exact resolution, quoted:** *"During the transfer receiving process, if the linked document's truck or route is included in this table for the receiving warehouse, the scanned piece is dropped in the corresponding storage location; this location is displayed on the scanner. **If the linked document's truck or route is not found in this table, or the linked document is a customer pick up, the piece is dropped in the initially entered storage location.**"*
- **HARD GOTCHA — the key field is unvalidated free text.** A typo in `Route Code/Truck` produces no error; it simply never matches, and stock silently lands in the fallback location. **An unvalidated join key on a physical-inventory routine is a real operational defect.**
- The table is scoped to the receiving warehouse and *"can be updated at any time"*.

**Dependencies.** Warehouse/Store Location Settings, Storage Location master, Logistical Route Settings (`VEND-042`, source of route codes), RF transfer receiving process.

**Build notes.** File under **warehouse/RF**. **Make `Route Code/Truck` a validated FK** to the route/truck master — this is a one-line fix for a class of silent misplacement. Log every fallback (route not found) as an exception so the mis-keyed rows surface instead of hiding.

---

### `VEND-032` EDI Status Details Settings
*storis_ref: article 15243030412308*

**Purpose.** Maintains **EDI status detail codes used to track shipment milestones** when using EDI processing. *"These codes are referenced in the EDI Status Details screen, available from purchasing entry and view routines."*

**Where it lives.** `Merchandising and Distribution > Purchasing > Electronic Data Interface > EDI Status Details Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| EDI Status Details Code | code, **up to 2 alphanumeric** | Identifier. Search lists existing codes. |
| EDI Status Details Description | text, **up to 30 characters free text** | Action → Description Field - Language Translation Entry. |

**Behavior & rules.**
- **STORIS-supplied seed codes, verbatim** (*"The Status Details Codes shown below are supplied by STORIS. You can create additional codes as needed using this process."*):

  | Code | Description |
  |---|---|
  | `AE` | Loaded on Vessel |
  | `AR` | Arrived by Rail at Destination |
  | `CT` | Customs Released |
  | `VA` | Arrival of First Port |
  | `X1` | Arrived at delivery location |

  These are **ANSI X12 214 status codes** — an import/ocean-freight milestone vocabulary, which tells us this feature is aimed at container import tracking.
- **The article documents no ordering, no milestone sequence, and no mapping of code → PO state.** The codes are labels only; nothing here says receiving `X1` does anything to the PO. **Whatever consumes them lives in the EDI Status Details screen, which is not documented in positions 1–47.**
- **EDI note (per the assignment): this file itself grants no write access.** It is a shared vocabulary. The write access is on the *inbound document handlers* — see the flags in `VEND-026` (EDI 214 partial completions) and `VEND-034` (acknowledgement-driven date recalculation), and the wave-1 `EDI - Allow Acknowledgment to Adjust Order Quantity`.

**Dependencies.** EDI Status Details screen (purchasing entry and view routines), inbound EDI 214/315-class documents, `VEND-001` Account Number Entry Screen, import PO processing (`VEND-019`, `VEND-038`, `VEND-040`).

**Build notes.** Do not invent our own codes — **adopt the X12 214 status-code set wholesale** and store the raw code plus our normalised milestone enum, so a trading partner sending an unmapped code produces an exception rather than a silently dropped update. **Every inbound EDI status must be recorded with sender, document, timestamp and raw payload**, and must never be allowed to move a PO state without a mapping rule we control. Feed to `RPT-AUDIT`. 2-character codes are an X12 constraint, not ours — keep the code but allow a longer internal key.

---

### `VEND-033` Electronic Merchant Settings
*storis_ref: article 15243032143252*

**Purpose.** **Not a vendor setting.** Stores **payment-processing merchant configuration** — credit cards, e-checks and third-party financing. *"Merchant data for many of these fields is supplied primarily by the merchant's bank and the clearinghouse being used for transaction processing."*

**Where it lives.** `Accounting > Receivables > Receivable Settings > Electronic Merchant Settings`; `Customer > Electronic Interfaces > Credit Card > Electronic Merchant Settings`. Tabs: **General**, **Regional**.

**Fields — key**

| Field | Type | Purpose / business rule |
|---|---|---|
| Setup Merchant ID | code | *"the ID number supplied by STORIS to allow the client company to classify electronic transactions internally."* |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Description | text | Description of the merchant. |
| Authorization Service | code (FK) | Service used to authorize electronic transactions. **"This is a STORIS-defined field."** |
| Payment Class | enum | `Credit Card`, `Finance Provider`, `Check Authorization`. **Selecting `Credit Card` activates `Debit Card OK`; selecting `Check Authorization` activates `Electronic Conversion of Funds`.** *"to process electronic guarantee (EG) and electronic conversion (EC) transactions using this merchant, you must select Check Authorization."* |
| Finance Provider | code | **Magic values:** Payment Class `Finance Company` → the finance company code; Payment Class `Credit Card` → **enter `CREDIT`**; Electronic Check Processing → **enter `CHECK`**. |
| Merchant Number | text | Assigned by the financing/credit company. *"You can specify one merchant number for all locations or separate merchant numbers for each location."* |
| Merchant Name / Merchant Address / City State Zip / Merchant Phone | text | Merchant identity block. |
| Terminal ID | text | Assigned to the terminal by the bank or clearinghouse. |
| Bank Bin Number | text | From the merchant's bank/clearinghouse. |
| Agent Number | text | From the merchant's bank/clearinghouse. |
| Chain Number | text | From the merchant's bank/clearinghouse. |
| MCC/SIC Code | text | From the merchant's bank/clearinghouse. |
| Current Batch | display | Current batch number, supplied by the bank/clearinghouse. |
| Settlement Type | enum | `Terminal-Based` — *"card-swipe data is processed by a third-party authorization service, for example Paymentech or TSYS (Visanet)"*; `Host-Based` — *"card-swipe data is processed by an in-house intermediary, for example PPI."* |
| Debit Card OK | checkbox | **"If you leave the field blank, the system does not present the PIN pad during transactions."** Requires Payment Class = Credit Card. |
| Electronic Conversion of Funds | checkbox | See below. Requires Payment Class = Check Authorization. |

**Fields — Regional tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| Country Code / Region Code / Time Differential / Location Code / Store Code / Terminal Code | text | All *"supplied primarily by the merchant's bank and the clearinghouse."* |
| Automatic Settlement | checkbox | Settles direct-credit for this merchant ID during End-of-Day. **"This option is available only with STORIS Direct Credit. It is not available on systems using off-line third-party verification software."** |
| Authorized Master Dealer Number | text | **"This field is specific to CitiFinancial."** |
| Authorized Merchant Number | text | **Specific to CitiFinancial.** |
| Authorized Store Code | text | **Specific to CitiFinancial.** |

**Behavior & rules.**
- **Multi-merchant resolution.** *"If you set up more than one merchant ID on an account, the system uses the **Location Settings (Warehouse Location)** routine to specify the merchant ID by location."*
- **HARD SETTLEMENT RULE.** *"The system settles **all host-based merchants automatically** during the End-of-Day process. However, you have the option to settle **terminal-based** merchants manually via the Credit Card Settlement process, **or** automatically via the End-of-Day process if you check the box at the `Automatic Settlement` field on the Regional tab."* So settlement automation is **unconditional for host-based** and **optional for terminal-based** — the checkbox only has meaning for one of the two types.
- **`Electronic Conversion of Funds` — exact business meaning.** Checked: *"When the check payment is processed electronically, the system **immediately debits the customer's checking account**… you scan the check as with electronic guarantee transactions, but **you do not keep the check for deposit**. The funds are immediately debited to the customer's checking account and the check is returned to the customer."* Unchecked (with Check Authorization): *"you can use this merchant **only for electronic guarantee (EG)** transactions. That is, you receive authorization of payment, but **no immediate withdrawal of funds occurs**."*
- **Named third parties in the source:** Paymentech, TSYS (Visanet), PPI, CitiFinancial.
- *"Not all of the fields are required for each function. Please contact your STORIS representative for further detail on setting up this file."* — i.e. **the required-field matrix is undocumented.**

**Dependencies.** Warehouse/Store Location Settings (merchant-by-location), Credit Card Settlement process, End-of-Day, Finance Provider Settings (see `VEND-016`, `Auto-Pay Post Bank`), Receivables.

**Build notes.**
- File under **payments/treasury**, not vendor. **This is the most security-sensitive screen in positions 1–47** — it holds merchant identifiers, terminal IDs and processor credentials-adjacent data. Every field change must feed `RPT-AUDIT`, and the screen needs its own permission distinct from general settings access.
- **Do not use magic sentinel values (`CREDIT`, `CHECK`) in a foreign-key field.** Make `finance_provider_id` genuinely nullable and let `payment_class` carry the meaning.
- Model `payment_class` × dependent-field activation as a discriminated union so `Debit Card OK` cannot exist on a check merchant.
- Vendor-specific fields (CitiFinancial) do not belong on the core entity — put processor-specific configuration in a typed `processor_config` JSON/extension keyed by processor.
- **`[DECISION NEEDED]`** LA Mattress's processor stack — most of this file is a straight non-port if we use a modern PSP with tokenised, hosted payments. Keep only merchant-by-location resolution and settlement scheduling.

---

### `VEND-034` Enter In Transit Days by Location
*storis_ref: article 15243029579796*

**Purpose.** **A genuinely important vendor/PO setting.** Overrides **in-transit days per destination warehouse** for a vendor or vendor ship-from **when using EDI vendors**, so a PO acknowledgement's shipping date converts into an accurate expected delivery date per receiving location.

**Where it lives.**
- `Vendor Settings Miscellaneous tab > Action button at In Transit Days field`
- `Vendor Ship-From Settings General tab > Action button at In Transit Days field`

*(Both parent screens — **Vendor Settings** and **Vendor Ship-From Settings** — are the actual vendor master articles and fall outside positions 1–47.)*

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Location | code (FK) | Destination location for which override in-transit days are established. Search lists locations. |
| In Transit Days | number | *"the number of days to be added to the **Shipping Date** in purchase order acknowledgements to determine the **Delivery Date** for purchase orders being shipped from this vendor/vendor ship-from to this location."* |
| Grid | display | Columns: `Location ID`, `Location Name`, `In Transit Days`, `Remove`. |

**Behavior & rules.**
- **Exact rule, quoted — this is `PO-071` acknowledgement behaviour.** *"After you establish in-transit days for a specific receiving location, the system uses the 'by location' in-transit days **when a purchase order for that vendor/vendor ship-from and destination location is acknowledged**. The in-transit days are added to the Shipping Date on the acknowledgement to determine the expected delivery date of the merchandise."*
  Formula: **`Expected Delivery Date = Acknowledgement Shipping Date + In Transit Days (resolved for vendor/ship-from → destination location)`**.
- **HARD GATE — another global kill-switch.** *"To enable in-transit days for Acknowledge a Purchase Order, the **`DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order`** setting in **Purchasing Control Settings** is checked."* Without it, this whole table is inert.
- **EDI FLAG (per the assignment) — the vendor's acknowledgement drives our promise dates.** The `Shipping Date` on the inbound acknowledgement is **the vendor's number**, and it becomes the basis of the delivery date our salespeople promise customers. Combined with the wave-1 `EDI - Allow Acknowledgment to Adjust Order Quantity` (vendor rewrites our quantity), **the acknowledgement document lets a vendor move both *how much* and *when* on our own PO.** In-transit days are the only thing we control in that calculation. **This should be flagged alongside the quantity finding as vendor write access to our data.**
- **A hierarchy exists but is not stated here.** *"For more detail on the hierarchy the system follows, refer to the **In Transit Days Hierarchy** topic."* — **that topic is not in positions 1–47 and must be picked up.** The implied chain is `vendor ship-from + location → vendor + location → vendor ship-from default → vendor default`.
- *"The read-only version of this screen appears when accessed through a view-only version of the routine, such as **View Vendor Settings**."*

**Dependencies.** **Purchasing Control Settings → `DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order`.** Vendor Settings (Miscellaneous tab → In Transit Days), Vendor Ship-From Settings (General tab → In Transit Days) — both outside this part. Acknowledge a Purchase Order (`PO-071`). Location master. **In Transit Days Hierarchy topic (NOT YET FETCHED).** Interacts with the lead/pad day chain (`VEND-009`, `VEND-011`, `VEND-012`).

**Build notes.**
- Register as `CFG-VEND-INTRANSITDAYS`, scoped `(vendor | vendor_ship_from) × destination_location`, resolved most-specific-wins, with an explicit documented fallback chain — **do not inherit an undocumented hierarchy.**
- **Treat a vendor acknowledgement as a *proposal*, not a fact.** Store the acknowledged ship date and computed delivery date as *vendor-asserted* values distinct from our own committed promise date, and require a tolerance rule (e.g. slip > N days) to either auto-accept or raise an exception. This is the correct general answer to the wave-1 EDI-quantity finding as well.
- **Capture actuals.** Compare configured in-transit days to realised receipt dates per vendor→location lane and report variance; the configured number will otherwise rot exactly like lead days (`VEND-012`).
- Feed changes to `RPT-AUDIT` — this number directly moves customer delivery promises.

---

### `VEND-035` Enter New Ship-From ID Window
*storis_ref: article 15242997759764*

**Purpose.** A one-field modal for creating the **identifier of a new vendor ship-from address**. This is the entry point of `CFG-VEND-SHIPFROM`.

**Where it lives.** `Vendor Settings > Shipments tab > Actions button > Add Ship From option > Enter New Ship-From ID Window`. **This confirms the vendor master carries a `Shipments` tab holding the ship-from collection** (the parent *Vendor Settings* article is outside positions 1–47).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Enter New Ship-From ID | text | *"Enter the identification number you want to use for the ship-from address you are creating."* |

**Behavior & rules.** *"When you are done, click **Save** to save your results or click **Exit** to exit without saving."* **The article documents no format, no length limit, no uniqueness check and no validation of any kind** for an identifier that becomes a foreign key used by buying groups (`VEND-020`), landed-cost exceptions (`VEND-003`/`VEND-008`), in-transit days (`VEND-034`) and PO entry prompting (`PO-020`, `PO-021`).

**Dependencies.** `CFG-VEND-SHIPFROM`; Vendor Settings → Shipments tab; Vendor Ship-From Settings; `PO-020`, `PO-021`; `VEND-003`, `VEND-008`, `VEND-020`, `VEND-034`.

**Build notes.**
- **Do not let users mint the primary key of a ship-from.** Use a system-generated surrogate id plus a user-facing, editable label. Every downstream reference then survives a rename, which a user-keyed ID does not.
- **Ship-from is a first-class scope in our resolver** (`VENDOR_SHIP_FROM`), alongside the `VENDOR_REMIT_TO` and `VENDOR_REGION` scopes wave 1 identified. Note the section confirms **remit-to and ship-from are genuinely different axes**: ship-from drives lead time, in-transit days, landed cost and buyer assignment; remit-to drives payment. They must not be collapsed.
- Enforce uniqueness per vendor and prevent deletion of a ship-from referenced by an open PO, a buying group, or any exception row — STORIS documents no such protection.
- `[DECISION NEEDED]` Do we allow a vendor ship-from to have its own payment terms and remit-to, or is remit-to strictly vendor-level? (Positions 1–47 never answer this; the answer likely sits in the *Vendor Settings* / *Vendor Ship-From Settings* articles in part B.)

---

### `VEND-036` Enter Payables Company by Location
*storis_ref: article 15243029579156*

**Purpose.** **A genuine AP/vendor setting.** Overrides which **payables company** an AP Bill is created under, per **receiving location**, when the bill originates from an **EDI 810 Invoice** from a given EDI vendor.

**Where it lives.** `Vendor EDI Settings > Action button at Payables Company field.` — a child of the vendor's EDI configuration, sibling of `VEND-001`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Location | code (FK) | Receiving location. Search → Read-Only Lookup Window. |
| Payables Company | code (FK) | Payables company to associate with that receiving location. Search → Read-Only Lookup Window. Add via the **Add (Plus)** button. |
| Grid | display | Columns: `Location ID`, `Location Name`, `Payables Company`, `Remove`. **"A confirmation prompt appears asking if you are sure you want to delete the location/company combination from the grid."** |

**Behavior & rules.**
- **Exact override rule, quoted.** *"When a receiving location and payables company combination exist and an AP bill is being created from **EDI 810 Invoices** received from this EDI Vendor for that receiving location, **the associated payables company is used instead of the company specified on the previous screen**."*
  So resolution is: **`(EDI vendor, receiving location) → payables company`**, falling back to the **vendor EDI record's own Payables Company** field.
- **This is the `COMPANY` resolver scope doing real work in AP** — and note it is only documented for the **EDI 810** path. **The article says nothing about how the payables company is chosen for a manually keyed AP bill**, which is an obvious asymmetry: the same physical receipt could book to a different legal entity depending on whether the invoice arrived by EDI or by hand. **That is a material multi-entity accounting risk.**
- No validation is documented — nothing prevents mapping a location to a payables company that does not own it (contrast `VEND-016`, which *does* require bank and location to share a company).

**Dependencies.** Vendor EDI Settings (parent, outside positions 1–47), `VEND-001` Account Number Entry Screen, Company master, Location master, AP Bill creation from EDI 810, `COMPANY` resolver scope.

**Build notes.**
- Register as `CFG-VEND-PAYABLESCOMPANY`, scoped `(vendor, receiving_location) → company`, and **apply it to every AP bill creation path, not just EDI 810.** One rule, one resolver, regardless of how the invoice arrived.
- **Add the containment check STORIS omits**: the payables company must be a company that actually operates the receiving location.
- Company assignment determines which set of books an invoice lands in — **every change here must feed `RPT-AUDIT`**, and the resolved company should be stamped on the AP bill for later reconciliation.

---

### `VEND-037` Float Settings
*storis_ref: article 15243032138772*

**Purpose.** **Not a vendor setting.** Creates and maintains **floats** — interim warehouse holding locations used by the RF picking process *"when merchandise that has been picked but not moved to the next step (prep or stage) is temporarily stored in an interim location."*

**Where it lives.** `Merchandising and Distribution > Inventory > Inventory Management > Advanced Warehouse Management > Advanced Warehouse Management Settings > Float Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Location | code (FK) | Warehouse/store location. **"Only locations that are accessible to you and whose `Location Tracked` and `Verified` fields in warehouse/store location settings are checked can be selected."** |
| Float ID | text, **up to 12 characters** | **"Your entry can be numeric (0-9), alphabetic (A-Z, caps only), or a combination… you can use hyphens ( - ) but not as a starting or ending character."** |
| Grid | display | `Float ID`, `Status`, `Remove`. |

**Behavior & rules.**
- **HARD RULE — Float IDs must not collide with the storage-location namespace.** Quoted: *"the system validates to ensure that **a storage location matching your entry does not exist** and also whether or not the ID **matches the existing storage location mask**. If the ID you enter matches an existing storage location, a message is displayed and **you must enter a different ID**. If the ID you enter falls **within the storage location mask** defined for this location, a **warning** message displays and you have the option to continue or cancel… If you choose to continue and later build new storage locations using the defined mask, **a storage location matching the Float ID cannot be created.**"*
  **So an existing collision is a hard error, but a *future* collision is only a warning — and taking the warning permanently poisons a slot in the storage-location namespace.**
- **Status enum, exact:** `New` (*"if you added the float in the current session"*), `In Use` (*"if merchandise is currently assigned to the float"*), `Empty` (*"if there is no merchandise assigned to the float at this time"*).
- **HARD RULE — "You cannot delete floats with a status of In Use."**
- Actions button → **Label Print** for selected floats.
- Access is filtered by **user location accessibility** — a rare per-user data filter in this section; cross-reference `parts/user-security-CATALOG.md`.

**Dependencies.** Warehouse/Store Location Settings (`Location Tracked`, `Verified`, storage location mask), Storage Location master, RF picking process, label printing, user location permissions.

**Build notes.** File under **warehouse/RF**. **Put floats and storage locations in one namespace with one uniqueness constraint** rather than validating across two — the mask-collision warning exists only because they are separate tables sharing an identifier space. Model float status as derived from contents (`In Use` iff assigned quantity > 0) rather than stored, so it cannot drift. Keep the "cannot delete while occupied" rule.

---

### `VEND-038` FOB Settings
*storis_ref: article 15243032140180*

**Purpose.** Assigns **freight forwarders and shipping ports to FOB records**, and — importantly — carries the **Do Not Ship Before/After day offsets** that become PO ship windows. *"You can also indicate FOBs directly in the alternate **Vendor Ship-From** settings, which are then indicated in Purchase Order entry and printed on available import purchase order Design Enhanced Laser Forms documents."*

The article defines the term: *"An FOB is applied when the seller pays for transportation of goods to the port of shipment, plus loading costs. The buyer pays freight, insurance, unloading costs, and transportation from the arrival port to the final destination. Typically, this is referred to in shipping terms when the retailer **has assumed ownership of the goods, but has not yet received those goods**."*

**Where it lives.** `Merchandising and Distribution > Settings > Purchasing Settings > Import Freight Settings > FOB Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| FOB Code | code, **up to 5 alphanumeric** | The FOB record. Search lists existing records. |
| Description | text, **up to 30 alphanumeric** | Description. |
| Freight Forwarder | code (FK) | Freight forwarder associated with this FOB (`VEND-040`). |
| Shipping Port | code (FK) | Shipping port associated with this FOB. |
| First Contact | code (FK) | First contact for this FOB. |
| Dial Prefix | display, auto | International dial prefix for the contact's country. |
| Phone Number | display, auto | Phone number of the selected contact. |
| Second Contact | code (FK), optional | Second contact. |
| **Do Not Ship Before Days** | integer, **may be positive or negative**, optional | See formula below. |
| **Do Not Ship After Days** | integer, **may be positive or negative**, optional | See formula below. |
| Dial Prefix / Phone Number (2nd) | display, auto | For the second contact. |

**Behavior & rules.**
- **Exact formulas, with the source's own worked examples — and note the first example is arithmetically inconsistent with its own wording.**
  - `Do Not Ship Before Date = Purchase Order Requested Date + Do Not Ship Before Days`
    Source example: *"if you enter **7** into this field, and the purchase order requested date is **2/1/2024**, then the Do Not Ship Before Date is **1/25/24**."* — **7 days before, not after.** So the stated "+7" actually yields −7. **Either the field is subtracted, or the example intends `-7`.** Given the field explicitly allows negative values, the example is probably wrong; **verify before implementing.**
  - `Do Not Ship After Date = Purchase Order Requested Date + Do Not Ship After Days`
    Source example: *"if you enter **30**… and the purchase order requested date is **2/1/2023**, then the Do Not Ship After Date is **3/2/23**."* — **this one is consistent** (+29/30 days).
  **The two examples use opposite sign conventions for the same stated formula. This is a hard, must-resolve ambiguity on a field that controls when a vendor is contractually permitted to ship.**
- **Where the dates land, quoted:** *"populated in the **Review Extended Information Window**, the **Automatic Purchase Order Creation** process, and **Enter a Purchase Order** — **when the Vendor Ship From has an associated FOB code**."* So the FOB reaches the PO **through the vendor ship-from**, not through the vendor — reinforcing ship-from as the operative scope.
- The FOB record bundles commercial terms (ship window), logistics partners (forwarder, port) and contacts into one code — **three concerns in one entity**.

**Dependencies.** Freight Forwarder Settings (`VEND-040`), Shipping Port master, Contact master, Country file (dial prefix), **Vendor Ship From Settings → Import Information tab → FOB Code** (outside positions 1–47), Enter a Purchase Order, Automatic Purchase Order Creation, Review Extended Information Window, Design Enhanced Laser Forms, Broker Settings (`VEND-019`).

**Build notes.**
- **`[DECISION NEEDED]` (P1) — resolve the Do Not Ship Before sign convention** against live data before any implementation. Then store the *computed dates* on the PO, not just the offsets, so a later change to the FOB record cannot retroactively rewrite an issued PO's ship window.
- Separate **Incoterm** (a commercial term: FOB/CIF/DDP/EXW, which determines when title and risk transfer) from **routing configuration** (forwarder, port, contacts) from **ship-window policy** (before/after offsets). STORIS conflates all three under "FOB code"; the term itself is the part that drives accounting (when we own the goods, i.e. when they hit our in-transit inventory).
- **The ship window is a vendor obligation — measure compliance.** Record actual ship date vs the window and report violations per vendor; this is chargeback evidence and STORIS captures none of it.
- 5-character codes: do not inherit.

---

### `VEND-039` Franchise Settings
*storis_ref: article 15243032139028*

**Purpose.** **Not a vendor setting.** A two-field code table of **franchise/dealer records**. *"If any of your locations are run by dealers, you can enter the dealer information here and then reference the franchise number in the Warehouse/Store Location Settings."*

**Where it lives.** `System Administration > Get Started - Enter Your Information > Get Started Step 3 - Business Information > Franchise Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Franchise Number | code, **up to 10 alphanumeric** | The franchise. |
| Description | text, **up to 30 alphanumeric** | Action → Description Field - Language Translation Entry. |

**Behavior & rules.** **Thin — effectively a stub.** Despite the stated purpose ("enter the dealer information here"), the record holds **no dealer information at all** — no address, no contact, no terms, no ownership or settlement configuration. It is a label referenced from Warehouse/Store Location Settings. Nothing about what a franchise flag *does* to pricing, inventory ownership, or reporting is documented anywhere in this article.

**Dependencies.** Warehouse/Store Location Settings (references the franchise number). Language translation subsystem.

**Build notes.** File under **organisation/company structure**. Likely a **non-port** for LA Mattress unless there are dealer-operated locations. If we ever need it, a franchise is a *party with an ownership relationship to locations* — model it on the shared `business_party` entity (see `VEND-019`) rather than as a bare code. `[DECISION NEEDED]` Does LA Mattress have any dealer/franchise-operated locations? If no, drop entirely.

---

### `VEND-040` Freight Forwarder Settings
*storis_ref: article 15243030715924*

**Purpose.** Creates and maintains **import freight-forwarder records** with **an unlimited number of contacts each**. *"The system references these contacts when entering import purchase orders and printing import purchase order documents via the Design Enhanced Laser Forms process."*

The article defines the role: *"A freight forwarder is an individual or company that dispatches shipments via carriers… and arranges space for those shipments."* They prepare *"commercial invoices, shipper's export declarations, and other documents required by the carrier or country of export, import, or transshipment."*

**Where it lives.** `Merchandising and Distribution > Settings > Purchasing Settings > Import Freight Settings > Freight Forwarder Settings`.

**Fields — Header Area**

| Field | Type | Purpose / business rule |
|---|---|---|
| Name | code, **up to 10 alphanumeric** | Confusingly, the *code* field is labelled "Name". Search lists existing forwarders. |
| **Freight Vendor** | code (FK → EDI-eligible vendor) | *"Use this field if you are transmitting purchase order information via EDI to freight vendors. Indicate the **EDI eligible vendor** that is responsible for freight and to whom the purchase order information is to be transmitted via EDI."* |
| Description | text, **up to 30 alphanumeric** | Description. |
| Type | enum | **`Ship` or `Air`.** |

**Fields — Contact Information (repeating)**

| Field | Type | Purpose / business rule |
|---|---|---|
| Code | code | **"Once you create this code you cannot change it."** |
| Country | code (FK) | **Must exist in the Country file**; drives label/mask/dial-prefix formatting (same pattern as `VEND-019`). |
| Contact Name | text | Contact name. |
| Dial Prefix | display, auto | From the Country file. |
| Phone | text | Contact's phone. |
| Ext | text, **up to 5 characters** | Extension. |
| Fax | text | Fax number. |
| Email | text | Email address. |
| Address Line | text ×3, **30 alphanumeric each** | Contact address. |
| City / State / Zip Code | text | **Labels derive from the Country file**; US defaults shown. |
| Grid | display | All contacts for this forwarder. Double-click to view/edit; `Add` saves; `Remove` deletes; `Clear` exits without saving. |

**Behavior & rules.**
- **EDI ROUTING HIERARCHY — exact, quoted. This is the most operationally useful rule in the article.** *"When transmitting EDI purchase orders, the system determines the freight vendor to whom the PO information is to be sent by checking the following settings, **in this order**:*
  1. *Vendor Ship-From Settings, **Import Information tab, FOB Code** field*
  2. *FOB Settings, **Freight Forwarder** field*
  3. *Freight Forwarder Settings, **Freight Vendor** field"*

  **So an outbound EDI PO is routed to a third party by a three-hop chain that starts on the vendor ship-from.** A misconfiguration at any hop silently sends our purchase order — including quantities, costs and destinations — **to the wrong external company.**
- **EDI FLAG (per the assignment).** This is **outbound** data disclosure rather than inbound write access, but it belongs on the same risk register: `Freight Vendor` designates an external party that automatically receives our PO data with no per-transaction confirmation. **A vendor-level EDI setting that causes our commercial data to leave the building should require the same review as one that lets data in.**
- **HARD RULE — referential protection.** *"You cannot delete freight-forwarder records that are in use in one or more FOB records."* (Contrast `VEND-030`, which cheerfully suggests deleting an in-use distribution status.)
- **Contact `Code` is immutable once created**, with no stated reason and no versioning.

**Dependencies.** Country file (labels, masks, dial prefix), FOB Settings (`VEND-038`), Vendor Ship-From Settings → Import Information tab → FOB Code (outside positions 1–47), EDI purchase order transmission, Design Enhanced Laser Forms, Broker Settings (`VEND-019`), vendor master (EDI-eligible vendors).

**Build notes.**
- Merge into the shared `business_party` model with a `FREIGHT_FORWARDER` role and a generic contacts child table (see `VEND-019`).
- **Implement the three-hop EDI routing as one explicit resolver with a visible "resolved recipient" preview on the PO before transmission.** Never transmit to a recipient the user has not seen. Log every transmission with the resolved recipient, the hop that decided it, and the payload hash — feed to `RPT-AUDIT`.
- Adopt the Country-file formatting pattern once, globally.
- Do not make contact codes immutable; use surrogate keys.

---

### `VEND-041` Group Exceptions and Category Exceptions - Advanced Vendor Settings
*storis_ref: article 15242997758740*

**Purpose.** The **umbrella article for the whole category/group exception family** — it names every field on `VEND-014`/`VEND-003` that supports exceptions and describes the shared Exceptions screen. Companion to the per-field articles `VEND-004`–`VEND-013`.

**Where it lives.** Action button at the listed fields in **Advanced Vendor Settings** (`VEND-014`) and **Advanced Regional Vendor Settings** (`VEND-003`), then `Category Exceptions` or `Group Exceptions`.

**Fields supporting exceptions — the authoritative list, quoted:**
- **`Auto Fill Days`** — *"the auto-fill days are **added to** the fill days calculated from the **Product, Group, Category, Advanced Vendor Settings, Point of Sale Control Setting** hierarchy."*
- `Lead Days`
- `Lead Pad Days`
- **`Purchase Order Pad Days`** *(named `PO Pad Days` on `VEND-014` and `Purchase Delivery Pad Days` on `VEND-011` — **three names for one field***)
- `Excess Stock Days`
- `Minimum Stock Days`
- `Factory Default Warranty`

*(Note: this list omits `Discount Costing`, `Volume Rebates`, `Landed Freight Active` and the four `Landed Cost Active` add-ons, which also carry exception Action menus per `VEND-005`, `VEND-013` and `VEND-008`. **So even the umbrella article is not a complete list.**)*

**Fields — the shared Exceptions screen**

| Field | Type | Purpose / business rule |
|---|---|---|
| Vendor | display, **locked** | *"populate[s] automatically and cannot be edited."* |
| Default Days *(or Default Warranty)* | display, **locked** | Automatically populated; *"for Factory Default Warranty Exceptions, this is the **Default Warranty** field."* |
| Category Code **or** Group Code | code (FK) | *"For the selected Category or Group Code, the exception days entered below **overrides** the default days for this vendor."* |
| Description | display, auto | *"If this field is not displayed, the description of the selected Category or Group Code appears next to the Category or Group Code."* |
| Auto Fill Days **or** Lead Days *(or Warranty)* | number | *"the number of days entered here **overrides** the default days for this vendor."* |
| Add | button | Adds the row to the grid. |

**Behavior & rules.**
- **CRITICAL, HIGHLY SURPRISING RULE — quoted in full, and it undercuts most of this exception machinery:**
  > *"**NOTE: These settings do not apply to the Enter a Purchase Order process. The delivery date on the Purchase Order Entry is determined when the vendor is entered.**"*

  **So the entire category/group exception layer for lead days, lead pad days, PO pad days, auto-fill days, excess/minimum stock days and factory warranty is IGNORED during manual purchase order entry.** The PO's delivery date is fixed from the **vendor-level** values at the moment the vendor is keyed — before any line items exist, so no product, group or category is even known yet. The exceptions therefore only influence **replenishment, ATP/merchandising analysis and reporting**, not the date on the PO a buyer actually types.
  **This is the single most important gotcha in positions 1–47.** It means a shop can configure elaborate per-category lead times and see them silently ignored on every hand-keyed PO.
- **Confirms `Auto Fill Days` is ADDITIVE, and gives the fullest hierarchy of the three versions in the section:** `Product → Group → Category → Advanced Vendor Settings → Point of Sale Control Settings`. This matches `VEND-003` (which includes Product) and contradicts `VEND-014` (which omits Product). **Two of three articles include Product, so Product is in.**
- **Every other exception field OVERRIDES; only Auto Fill Days ADDS.** Stated here explicitly for both behaviours in the same article.
- Naming inconsistency across the family is severe: the same physical field appears as `PO Pad Days`, `Purchase Order Pad Days` and `Purchase Delivery Pad Days`; the exception input is variously captioned `Lead Days`, `Auto Fill Days` or the correct name depending on the screen (see `VEND-006`, `VEND-010`, `VEND-012`).

**Dependencies.** `VEND-014`, `VEND-003`, and the per-field articles `VEND-004`–`VEND-013`. Point of Sale Control Settings (auto-fill fallback). Enter a Purchase Order (**explicitly does NOT consume these**). Replenishment, ATP, Product Performance and Purchase Recommendations, Report Automatic Purchase Order Replenishments.

**Build notes.**
- **Do not reproduce the "PO entry ignores exceptions" behaviour.** It is a performance shortcut (resolve once at vendor entry rather than per line) masquerading as a rule, and it makes configuration lie. **Resolve lead time per PO line, at the line's product, using the full scope chain, and recompute the header date as the max of the line dates.** Call this out explicitly in the spec so nobody "helpfully" reintroduces the STORIS behaviour for speed.
- Build **one** exception screen driven by a `setting_key`, not seven — the fields, layout and rules are identical across the family, and one screen makes the label bugs impossible.
- **Normalise the field naming once** (`purchase_delivery_pad_days`, `purchase_lead_days`, `lead_pad_days`, `auto_fill_days`, `minimum_stock_days`, `excess_stock_days`, `factory_warranty_id`) and never surface an alias.
- Settle the additive-vs-override question: **recommend all-override**, with any genuine padding modelled as its own named field (see `VEND-003`).

---

### `VEND-042` Logistical Route Settings
*storis_ref: article 15243032419476*

**Purpose.** **Not a vendor setting.** Defines **delivery / transfer / in-home-service routes**, the days each route runs, and its capacity. *"Use this file to define routes for dispatching delivery, transfer, and customer-service orders, and indicate the days on which to make the routes available for use."*

**Where it lives.** `Customer > Settings > Logistical Settings > …`; `Merchandising and Distribution > Settings > Logistical Settings > …`; `System Administration > Get Started - Enter Your Information > Get Started Step 4 - Delivery > …`; `System Administration > System Settings > Customer System Settings > Logistical System Settings > …`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Route Code | code, **up to 5 alphanumeric** | **"once an order appears on a manifest, you cannot change the route."** |
| Description | text | Route description. |
| Route Type | enum | `Delivery`, `Transfer`, `In-Home Service` (*"active only if using the Customer Service module"*). **"Once you schedule orders for a route, you cannot modify the route type."** |
| Parcel Only | checkbox | *"this route can be used by products with a **Delivery Type of Parcel or Both**."* **"To change this field, this route cannot be assigned to any zip code via Update Zip Code Settings or Individual Zip Codes."** Only active when Route Type = `Delivery`. |
| Available Days | code per weekday | See enum below. |
| Stops / Units / Volume / Dollars | integers, **whole numbers only, no decimals** | Per-day maxima. **"If a field does not have a value, the corresponding value set in Route Capacity Control Settings is used as the maximum value."** |
| Service Employee | code (FK → Staff File) | Only for `In-Home Service` routes. *"Service employees must exist in the **Create a User (Staff File)** record."* |
| Shared Route Capacity | code (FK) | Links the route to a shared capacity pool. **"Only shared capacity pools with the same route type are available in the list. The shared pool you link to the route is in effect on all days that the route is available."** |
| Dispatch Track Account | text, **up to 20 alphanumeric incl. special characters and spaces**, optional | *"This account is to be used for exceptions and Types other than Delivery. If no account is entered here, the **Dispatch Track Default Account** field in Warehouse/Store Location Settings is used."* Available whether or not Advanced Dispatch Track is active. |
| Cut Off Routes Days Prior to Scheduled Date | integer | See rules — **has a one-way latch.** |
| Delivery Company | code (FK) | **"If you select Delivery at the Route Type field, this field is mandatory."** |
| Transfer From | code (FK), optional | Only active when Route Type = `Transfer`. Ties the route to a stock location. |
| Actions → Transfer To Locations | action | Only for transfer routes. *"create and maintain a list of Transfer-To locations linked to this transfer route."* |

**Behavior & rules.**
- **`Available Days` — exact enum, per weekday:** `A = ALL`, `1 = FIRST`, `2 = SECOND`, `3 = THIRD`, `4 = FOURTH`, `5 = FIFTH`, `Blank = no deliveries on this day`. **Multiple values are comma-separable** — *"enter 1,3 in the Friday field… the first and third Friday of each month."*
- **HARD TRAP — Available Days are silently unenforced for transfer routes without a Transfer From.** Quoted: *"if you leave the Transfer From field blank and choose to continue, **the restrictions in the Available Days fields are not enforced**… the route calendar displays **all days as available** when creating the transfer."* You get a warning and may proceed. **A configured schedule that silently does nothing is worse than no schedule.**
- **Date verification on order entry, quoted:** *"When you enter the delivery date or scheduled date on a sales or service order, the program verifies that the route assigned to the **customer's ship-to zip code** delivers on that day. When you enter the scheduled delivery date on a transfer, the system verifies that the route assigned to the **warehouse location's zip code** transfers goods on that date."*
- **`Cut Off Routes Days Prior to Scheduled Date` — exact semantics, quoted examples:** *"If **1** is entered, the delivery cannot be scheduled on the day the delivery order was created… If **2**… the day the delivery order was created and the next day… If **3**… this day and the next two days."* So the cutoff counts **inclusive of today**.
  Fallback chain: *"If you leave the field blank in the Logistical Route Settings for any delivery/service/transfer route, the system uses this field in the **Point of Sale Control Settings** or **Service Control Settings**, depending on the route type."* Blank in all three → feature ignored.
  **HARD, SURPRISING RULE — the closure is a one-way latch.** *"If you use this feature to close dates, **they remain closed even if you access this field again and change the number of days**. You can 're-open' the closed dates **only** by doing the following: 1) change the number of days in this field… and then 2) access the dates via **Route Capacity Settings** and change the maximum number of stops for those dates."* **Reducing the cutoff does not reopen anything; a two-step manual dance is required.** This is a materialised side effect masquerading as a setting.
- **Referential protection:** *"If open orders exist for this route, you cannot Delete the entire route code."*
- **Immutability once in flight:** route cannot change after an order hits a manifest; route type cannot change once orders are scheduled; `Parcel Only` cannot change while assigned to any zip code.
- Capacity limits are per-route (`Route Capacity Settings`) with a global fallback (`Route Capacity Control Settings`).

**Dependencies.** Zip Code file (`Route Code` field), Route Capacity Settings, Route Capacity Control Settings, Shared route capacity pools, Delivery Company Settings (`VEND-026`), Staff File / Create a User, Point of Sale Control Settings, Service Control Settings, Warehouse/Store Location Settings (`Transfer Route` on the Inventory & Logistics tab, `Dispatch Track Default Account`), Advanced Product Settings (`Delivery Type`), Dispatch Track integration, `VEND-031` (route codes for drop-off).

**Build notes.** File under **logistics**. **Never materialise a derived closure into stored state** — compute route availability from `(available_days, cutoff_days, capacity)` at read time so changing the setting immediately changes the calendar. Model `Available Days` as a proper recurrence (weekday × ordinal set) rather than a comma string. **Make the Transfer From requirement a hard constraint**, not a warning — an unenforced schedule is a defect. Keep the immutability rules (route locked after manifest) but express them as state-machine guards with clear messages.

---

### `VEND-043` Maintain Invoice Charge Table Settings
*storis_ref: article 15243030720660*

**Purpose.** **A real AP/vendor setting.** Establishes an **invoice charge matrix** that assigns an invoice charge **for both vendor purchases and vendor returns**, keyed by **company state/province and/or vendor state/province**. *"Based on these rules, the invoice charge is determined and later passed to the **AP Bill creation process**."*

**Where it lives.** `Accounting > Settings > Payables Settings > …`; `Accounting > Payables > Payables Settings > …`; `System Administration > System Settings > Accounting System Settings > Payables System Settings > …`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Invoice Charge | code (FK), **mandatory** | The charge code being added/maintained. Arrow → list of charge codes. *"Once specified, the description of the charge displays."* |
| Company State | code, **optional** | Associates the charge with the **company's** state/province. |
| Vendor State | code, **optional** | Associates the charge with the **vendor's** state/province. |
| Grid | display | Columns: `Invoice Charge`, `Company State`, `Vendor State`. Double-click a line to edit; `Add` updates the grid. *(The article's grid legend mislabels the third column: "Vendor State - displays the **vendor code**, if entered" — it displays the state.)* |

**Behavior & rules.**
- **Exact 'best match' hierarchy, quoted — first match wins:**
  1. *"Match of **both** company state/province and vendor state/province"*
  2. *"Match of **company** state/province and **empty vendor** state/province"*
  3. *"Match of **vendor** state/province and **empty company** state/province"*
  4. *"**Empty** company state/province and **empty** vendor state/province."*

  **Note the asymmetry: company state outranks vendor state.** A row matching only the company wins over a row matching only the vendor. That ordering is a real business decision and must be preserved deliberately, not accidentally.
  *"The Company State/Province and Vendor State/Province fields are not mandatory, allowing you to develop a 'best match' hierarchy."*
- **This is a use tax / vendor tax matrix in disguise.** *"NOTE: If using this screen to create a **tax matrix for use with the vendor return process**, click here for additional information."* — **the linked article is not in positions 1–47 and must be picked up elsewhere.** The company-state × vendor-state key is exactly the shape of a US sales/use-tax nexus determination, and it applies symmetrically to purchases and returns.
- **No effective dating.** Tax rates and charge applicability change on legislative dates; this matrix has no start/end date, so a change silently rewrites the treatment of *every* future bill with no record of the prior rule.
- The article documents **no uniqueness constraint** on `(company_state, vendor_state)` — two rows with the same key and different charges have undefined resolution.

**Dependencies.** Invoice Charge code master, Company master (state), Vendor master (state — **this is the `VENDOR_REGION`-adjacent axis, and arguably a `VENDOR_REMIT_TO` axis, since which address defines "vendor state" is not stated**), AP Bill creation, vendor return process, the linked vendor-return tax-matrix article (**NOT FETCHED**).

**Build notes.**
- Register as `CFG-AP-INVOICECHARGEMATRIX`, resolved with the exact four-step precedence above, implemented as a scored best-match (specificity = number of non-null key columns, company-state weighted above vendor-state) so the ordering is explicit in code.
- **`[DECISION NEEDED]` (P1) — which vendor address defines "vendor state": the remit-to, the ship-from, or the vendor's legal/primary address?** For a use-tax determination this is the whole question, and the article never says. Wave 1's `VENDOR_REMIT_TO` scope makes this a live ambiguity. **Do not implement until answered.**
- **Add effective dating** (`effective_from`, `effective_to`) and a unique constraint on `(company_state, vendor_state, effective_from)`.
- **Stamp the resolved charge and the matrix row id on the AP bill** so a bill can be re-explained years later during an audit.
- Every change must feed `RPT-AUDIT` — this table determines tax treatment.

---

### `VEND-044` Minimum Stock Days
*storis_ref: article 15243029580820*

**Purpose.** **(Article is a glossary stub — a single paragraph defining one field of `VEND-014`, with no Access section, no field table and no screen of its own.)** It defines the `Minimum Stock Days` field in the Advanced Vendor Settings.

**Where it lives.** No menu path given. The field itself lives on `Advanced Vendor Settings` (`VEND-014`) → General tab.

**Fields.** None — the article documents no screen.

**Behavior & rules.** Quoted in full: *"This field in the Advanced Vendor Settings represents the number of days' supply of merchandise considered to be below the safe stock level. This field is used with the **Product Performance and Purchase Recommendations (Full Buyer's Work Sheet)**, which calculates total days supply by dividing the current net available by the calculated weekly sales rate."*

**One new fact vs `VEND-014`:** it names the report's full title — **"Product Performance and Purchase Recommendations (Full Buyer's Work Sheet)"**. Otherwise verbatim.

Implied formula: **`Total Days Supply = Current Net Available / Calculated Weekly Sales Rate`** (with `Sales Rate = Total Units Sold / Number of Weeks` from `VEND-014`). **Note the unit mismatch the source never addresses: dividing units by a *weekly* rate yields days-supply expressed in weeks, yet the value is compared against a field measured in days.** Either the rate is normalised to daily somewhere undocumented, or the comparison is wrong by a factor of 7. **Verify against live data before implementing.**

**Dependencies.** `VEND-014` → Minimum Stock Days; `VEND-010` (category/group exceptions); Product Performance and Purchase Recommendations report; `VEND-006` Excess Stock Days (the paired upper bound).

**Build notes.** Not a separate requirement — fold into `VEND-014`. **But do resolve the days-vs-weeks unit question**; it affects every replenishment recommendation. `[DECISION NEEDED]`

---

### `VEND-045` Multiple Break Selection
*storis_ref: article 15243032412564*

**Purpose.** **Not a vendor setting.** Schedules **operator breaks during merchandise receiving**, so receiving capacity planning accounts for non-working time.

**Where it lives.** `Menu > Inventory > Settings > Receiving Capacity Settings > Receiving Group Code > Associate Extra Action`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Break Start Time | time, **military time** | *"The time entered must be set in military time (i.e. 13:00 for 1:00pm)."* |
| Break Interval | number, **1–999** | *"the length of time of each assigned break."* |
| Grid | display | Columns: `Break Start`, `Break Interval`. |

**Behavior & rules.** **Very thin.** **The unit of `Break Interval` is never stated** — 1–999 of *what*? Minutes is the only sensible reading, but the article does not say, and a 999-unit break is nonsense in any unit. No validation is documented for overlapping breaks, for breaks outside the receiving window, or for the relationship to the receiving group's operating hours.

**Dependencies.** Receiving Capacity Settings, Receiving Group Code.

**Build notes.** File under **warehouse/receiving**. **State the unit explicitly** (`break_duration_minutes`). Reject overlapping breaks and breaks outside the group's working window. Better still: model non-working time once as a generic `capacity_exception` on the receiving calendar rather than as a bespoke break table — the same mechanism serves holidays, maintenance windows and breaks.

---

### `VEND-046` Per Piece Delivery Charge Settings
*storis_ref: article 15243032411156*

**Purpose.** **Not a vendor setting.** Configures **per-piece delivery charges**: a base charge covering a piece allowance, plus a fixed charge for each piece over the limit. *"The system applies this amount to **all zip codes**."*

**Where it lives.** `Customer > Settings > Logistical Settings > Per Piece Delivery Charge Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Base Delivery Charge | money, **positive, up to 9,999.99** | *"the base delivery or stop charge. The amount you enter here populates the delivery charge **at the line level** if not already populated using the **Delivery Matrix** method."* **"if you leave this field empty and the Delivery Matrix method obtains no charge for a line, the system assesses no charges."** |
| Base Piece Limit | integer, **1–9999** | Qualified pieces allowed for the base charge. **"If you leave this field blank, the system assesses a charge for each piece."** |
| Additional Piece Charge | money, **positive, up to 9,999.99** | Charge per piece over the limit. |
| Inventory Formation | code (FK), multi | *"the system restricts the piece count to products associated with those inventory formations."* Action → `Create a new Inventory Formation`, `Maintain Assigned Inventory Formations` (single code only), `Multiple Inventory Formation Selection`. |

**Behavior & rules.**
- **Paired-field constraint, stated twice:** *"if you enter a base piece limit here, you must also enter an additional piece charge below"* and vice versa.
- **Save rule:** *"although **none** of the above settings is mandatory, **at least one must be specified in order to Save** this record."*
- **Delete rule:** *"The **Delete** button will only be active if **Per Piece Charge is not selected as a Delivery Calculation Method**."*
- **Activation gate:** *"To select **'Per Piece Charge'** as a delivery calculation method (via the **Delivery Charge Settings** field on the **Delivery** tab in the **Point of Sale Control Settings**), you must **first** create a per-piece method in this routine."*
- **Inclusion semantics are stated two contradictory ways — flag.** The intro says *"You can **exclude** selected products, product groups, or product categories from the piece limit count"*, and the worked example uses exclusion (*"choose to exclude Product Group A"*). But the `Inventory Formation` field says *"specify the products (if any) you want to be **included** in per-piece delivery charges… the system **restricts** the piece count to products associated with those inventory formations."* **Inclusion and exclusion are opposite. The field description (inclusion) is the more precise text and is almost certainly correct; the prose example is written from the user's mental model.** Verify.
- **Worked example, quoted, and it does not add up on its own terms:** *"assume you specify a piece limit of 10 and a fixed charge of \$5 per piece over the limit, and also choose to exclude Product Group A… If you enter an order for 20 pieces, five of which are from Product Group A, then the system first applies any base delivery charges… then adds an additional \$5 per-piece delivery charge for 5 pieces, **totaling \$25**. That is, the piece count for the order exceeds the piece limit by 10, but 5 of the pieces belong to Product Group A which you excluded… Thus, the over-the-limit count is 5."*
  **Arithmetic check:** 20 pieces − 5 excluded = 15 qualified; 15 − 10 limit = **5 over**; 5 × \$5 = **\$25**. The total is right, but the sentence *"the piece count for the order exceeds the piece limit by 10"* describes the raw 20 against the limit — the example silently switches between counting all pieces and counting qualified pieces. **The operative rule is: exclusions are removed BEFORE the limit is applied.** That is worth stating explicitly because the alternative (apply the limit to all pieces, then drop excluded pieces from the overage) gives \$25 here too but diverges in other cases.
- **Layering:** per-piece charges are **additive on top of** the base delivery charge from `VEND-024` — *"first applies any base delivery charges as per the Delivery Charge settings, then adds…"*.

**Dependencies.** Point of Sale Control Settings → Delivery tab → `Delivery Charge Settings` (activation), Delivery Matrix method, `VEND-024` Delivery Charge Settings, `VEND-025` Delivery Charge Table Settings, `VEND-026` Delivery Company Settings, Inventory Formation Settings.

**Build notes.** File under **logistics/pricing**. **Resolve the include-vs-exclude ambiguity and write the piece-count algorithm as an explicit, tested sequence:** `qualified_pieces = pieces matching formation` → `overage = max(0, qualified_pieces − base_piece_limit)` → `charge = base_delivery_charge + overage × additional_piece_charge`. Store the computed breakdown on the order line. Replace the "at least one field" save rule with a proper valid-configuration check.

---

### `VEND-047` Picking By Zone Assignment Window
*storis_ref: article 15242997738004*

**Purpose.** **Not a vendor setting.** Assigns **picking-zone search priorities per order type** for a warehouse, so pickers are directed to storage locations in a chosen sequence.

**Where it lives.** `Action button on the Inventory & Logistics tab of Warehouse/Store Location Settings.`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Warehouse Code | display | Code and description of the selected warehouse. |
| Deliveries | zone sequence | Sequence of picking zones searched for delivery-type orders. |
| Transfers | zone sequence | Sequence for transfers. |
| Customer Pick-Ups | zone sequence | Sequence for customer pick-up orders. |
| Takens | zone sequence | Sequence for take-with orders. |

**Behavior & rules.**
- **Exact encoding, quoted:** *"You can assign storage locations a picking zone of **1, 2, or 3**. On this screen, you tell the system the sequence in which to pick from the storage zones. For example, if you enter **321** at the Delivery field, you tell system search for products in zone 3 first, zone 2 second, and zone 1 third."*
  **The sequence is a positional digit string, not a list.** Three zones only.
- **Precondition:** *"The picking zone feature allows you, **for locations that are location-tracked and verified**, to specify the storage locations you want your pickers to pick from first, second, and third."* (Same `Location Tracked` / `Verified` gate as `VEND-037` Float Settings.)
- Each sequence is optional — *"the sequence of picking zones **(if any)**"*.
- **The article does not say what happens with a partial sequence** (e.g. `31`), a repeated digit (`33`), or when product exists only in a zone omitted from the sequence. **Undefined behaviour on a physical-picking routine.**
- **The four order types are exactly: `Deliveries`, `Transfers`, `Customer Pick-Ups`, `Takens`** — note `Customer Pick-Ups` and `Takens` (take-with) are distinguished, matching the fulfillment-type vocabulary used in `VEND-018` (*"cannot be a Take With, Pick Up, or Direct Ship order"*).

**Dependencies.** Warehouse/Store Location Settings (`Location Tracked`, `Verified`, Inventory & Logistics tab), Storage Location master (picking zone 1/2/3), picking/RF processes, `VEND-037` Float Settings.

**Build notes.** File under **warehouse/picking**. **Do not encode an ordered list as a digit string** — store an ordered array of zone ids and allow more than three zones. **Define the fallback explicitly**: if a product exists only outside the configured sequence, pick from it anyway and log an exception, rather than failing or silently skipping. Validate the sequence (no duplicates, all zones known) at entry.

---

## `PO-080` — PO HOLD TRIGGERS: what positions 1–47 do and do not close

**This was flagged as a P1 open gap: STORIS's "why do POs go on hold" answer deferred to a topic never fetched.**
Here is exactly what this half of Vendor Settings contributes.

### Closed — documented PO-hold / PO-block triggers found

1. **`Automatically Hold POs` (vendor-scoped, and vendor+region-scoped).** `VEND-014` → Auto PO Replen tab, and `VEND-003` → PO Replenishment tab. A per-vendor (and per-vendor-per-region) flag that holds POs created by Automatic Purchase Order Replenishment *"In this way, you can review auto POs before releasing them to your vendors."*
   **Scope limit: it applies ONLY to POs generated by the auto-replenishment process, not to manually entered POs.**
   **Unresolved contradiction, must be verified:** `VEND-014` appends a paragraph saying that when PO Replenishment is active the system instead *"calculates the data and generates an EOD report. The buyer can review the data and decide whether to create a purchase order… If this field is not selected, purchase orders generate automatically via the End of Day process."* `VEND-015` (the older read-only copy of the same doc) carries **only** the original "place on Hold" wording. So the worklist behaviour is a later change layered onto old text. **See `[DN-01]`.**

2. **Buying-group single-buyer block — a hard PO-entry gate.** `VEND-020` + `VEND-015`. With `GENERAL - Activate Buying Group` on in Purchasing Control Settings: *"all products added to a purchase order must contain a buyer and they must all contain the same (single) buyer."* Combined with `Restrict Entry to a Single Buyer` (Purchasing Control Settings, revealed only by `VEND-015`), and with vendors/products exclusively partitioned into buying groups, this means **a PO can be refused because its lines belong to two buyers, or because a product has no resolvable buyer.** This is the nearest thing in positions 1–47 to a vendor-level *approval requirement*.

3. **`Minimum Purchase Amount` security override (sales side, same mechanism class).** `VEND-026`. Not a PO hold, but it is the section's one worked example of *how* STORIS gates a transaction: warn → check a named permission (`Override System Calculated Delivery Charges` in *Create a User/Group Actions - Sales Security*) → if absent, present a credentialed override prompt. **Use this as the pattern for our own PO approval gates.**

### Still open — NOT found anywhere in positions 1–47

- **No vendor credit hold.** Nothing in these 47 articles places a vendor on credit hold or blocks purchasing from a vendor for financial reasons. The only "Credit Hold" reference (`VEND-014`'s replenishment option set) is a **customer** credit-hold filter deciding whether such sales orders generate replenishment demand.
- **No PO approval workflow, no approval limits, no dollar-threshold routing.**
- **No manual-PO hold reason, no hold/release state machine, no hold audit.**
- **Likely locations of the remaining answer** (for whoever holds them): the **`Vendor Settings`** and **`Vendor Ship-From Settings`** master articles (referenced by `VEND-034` and `VEND-035`, and confirmed to have `Miscellaneous`, `Shipments` and `Import Information` tabs) — both in positions 48–94; **Purchasing Control Settings** (a control-settings part); and the **Payables/Vendor Receivables** vendor screens.

---

## EDI — every setting in positions 1–47 that gives an external party access to our data

Per the assignment, each is flagged. Wave 1's `EDI - Allow Acknowledgment to Adjust Order Quantity` (vendor's EDI-856 rewrites our PO quantity ordered, mitigated only by an after-the-fact email) is **not** in this range, but three siblings are.

| # | Setting | Article | Direction | What the external party gets |
|---|---|---|---|---|
| **E1** | **`Third Party Logistics EDI Code`** — and specifically *"If they send **214's**, do we accept **partial completions** from this third party logistics company?"* | `VEND-026` Delivery Company Settings | **INBOUND WRITE** | **A third-party carrier writes delivery-completion status onto our orders**, including partial completion. Drives what we believe was delivered → revenue recognition, customer billing, survey triggers. **Same risk class as the wave-1 quantity finding.** The actual flags live in **Third Party Logistics EDI Settings** — *whoever holds that article must document the partial-completion flag in full.* |
| **E2** | **In-transit-days-on-acknowledgement** (`DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order`) | `VEND-034` Enter In Transit Days by Location | **INBOUND WRITE (dates)** | `Expected Delivery Date = vendor's acknowledgement Shipping Date + our in-transit days`. **The vendor's asserted ship date becomes the basis of the delivery date we promise customers.** Together with the wave-1 quantity finding, **the acknowledgement document lets a vendor move both *how much* and *when* on our own PO.** |
| **E3** | **`Freight Vendor`** on a freight forwarder, resolved through a three-hop chain (`Vendor Ship-From → FOB Code` → `FOB Settings → Freight Forwarder` → `Freight Forwarder Settings → Freight Vendor`) | `VEND-040` Freight Forwarder Settings | **OUTBOUND DISCLOSURE** | Our full PO data (quantities, costs, destinations) is transmitted automatically to an external company selected by a three-hop lookup. **A misconfiguration at any hop silently sends our commercial data to the wrong company, with no per-transaction confirmation.** |
| E4 | **`Payables Company by Location` on EDI 810** | `VEND-036` Enter Payables Company by Location | INBOUND (routing) | An inbound vendor invoice determines which **legal entity's books** the AP bill lands in, via a mapping with no containment validation. Not vendor write access, but vendor-initiated data steering our accounting. |
| E5 | `Account Numbers` on an EDI vendor | `VEND-001` Account Number Entry Screen | INBOUND (identity) | The account-number list is the de-facto identity key for inbound EDI. **STORIS documents no rejection path for an unrecognised account number.** |
| E6 | `EDI Status Details` codes (`AE`, `AR`, `CT`, `VA`, `X1`) | `VEND-032` EDI Status Details Settings | INBOUND (vocabulary) | The code file itself grants nothing, but it is the vocabulary by which inbound X12 214 milestones enter the system. No code→PO-state mapping is documented anywhere in this range. |

**Cross-cutting build rule we should adopt from all of the above:** *treat every inbound EDI document as a **proposal**, never as a fact.* Stage it, record sender/document/timestamp/raw payload, apply it only through a mapping and tolerance rule we control, and raise an exception outside tolerance. Never let an external party mutate quantity, date, or fulfillment state directly.

---

## Coverage against the assignment's hunt list

| Asked for | Found in positions 1–47? | Where |
|---|---|---|
| Vendor identity and dedupe | **No.** Nothing on vendor creation, duplicate detection, merge, or vendor numbering. | — (expect in the `Vendor Settings` master article, positions 48–94) |
| Remit-to vs ship-from addressing | **Partial — ship-from richly, remit-to not at all.** Ship-from is confirmed as a first-class scope driving lead time, in-transit days, landed cost, buyer assignment and FOB. **Remit-to appears nowhere in this range.** | `VEND-035`, `VEND-034`, `VEND-020`, `VEND-003`, `VEND-008`, `VEND-038`, `VEND-040`; `VEND-014`'s worked examples give the defaulting rule |
| Payment terms and discount terms | **Partial.** Purchase *cost* discounts (DFI / bill back / CRD) are fully covered. **Payment terms, due-date calculation and early-payment discount terms are absent** — no `TERMS_CODE` screen in this range. | `VEND-017`, `VEND-021`, `VEND-022`, `VEND-005`, `VEND-014` |
| 1099 handling | **No.** Not mentioned in any of the 47 articles. | — |
| Vendor holds | **Partial — see the `PO-080` section above.** Auto-replenishment PO holds and buying-group PO blocks, but **no vendor credit hold.** | `VEND-014`, `VEND-003`, `VEND-020`, `VEND-015` |
| Minimum order requirements / order multiples | **Partial and only by volume.** `Volume Limit on Replenishment POs` and `Shipping Volume Limit Per PO` split POs by cube. **No minimum order value, no minimum quantity, no order multiple / case pack.** | `VEND-014` |
| Lead times | **Yes, thoroughly.** `Lead Days`, `Lead Pad Days`, `PO Pad Days`, `Lead Days Calculation` enum, per-location in-transit days, plus category/group exceptions for each. **And the critical finding that PO entry ignores the exception layer entirely.** | `VEND-014`, `VEND-009`, `VEND-011`, `VEND-012`, `VEND-034`, `VEND-041` |
| Chargebacks and vendor claims | **Yes — the strongest area.** Three distinct dispositions (DFI / Bill Back / CRD) with exact posting. **But no claim lifecycle: no status, no ageing, no dunning, no recovery tracking.** | `VEND-017`, `VEND-021`, `VEND-022`, `VEND-043` |
| Vendor-product relationships | **Yes, extensively** — via the category/group exception family and vendor-level product policy (warranty, lead time, stock days, rebates, discounts, landed cost). Note there is **no vendor-product cross-reference / vendor model number screen** in this range. | `VEND-002`–`VEND-013`, `VEND-014`, `VEND-041` |

---

## `[DECISION NEEDED]` — collected

**P1 — resolve before implementing anything in this area**

- **`[DN-01]`** **`Automatically Hold POs`: does it hold the created POs, or suppress PO creation and emit a buyer worklist?** `VEND-014` and `VEND-015` document both. Verify against a live instance. (`VEND-014`, `VEND-003`, `VEND-015`)
- **`[DN-02]`** **Chained discount semantics (DFI / Bill Back / CRD):** application order, whether `Chain Discount` is a property of the code or of the line's discount stack, rounding per step, and behaviour with mixed percent/dollar codes. Affects landed cost, margin, AP matching and vendor claims simultaneously. Write it as a worked numeric example and unit-test it. (`VEND-017`, `VEND-022`, `VEND-005`)
- **`[DN-03]`** **Which vendor address defines "vendor state" in the invoice charge / vendor-return tax matrix** — remit-to, ship-from, or legal address? This is the entire question for a use-tax determination, and the article never says. Directly implicates the `VENDOR_REMIT_TO` scope. **Do not implement until answered.** (`VEND-043`)
- **`[DN-04]`** **`Do Not Ship Before Days` sign convention.** The source's own two worked examples use opposite signs for the same stated formula. This field controls when a vendor may legally ship. (`VEND-038`)
- **`[DN-05]`** **Do we accept EDI 214 partial completions from third-party carriers at all?** Recommended default: **no** — stage the document and require a human or reconciliation rule to apply it. (`VEND-026`, flag **E1**)
- **`[DN-06]`** **Do we support CRD (cost-reduced bill back) at all?** Recommended: **no for v1.** It books margin at receipt against cash that has not been collected. If yes, it needs an approval to create codes, a receivable ageing/dunning workflow, and a periodic margin-taken-vs-cash-collected reconciliation — STORIS provides none of these. (`VEND-021`)

**P2 — model/precedence decisions**

- **`[DN-07]`** **One canonical scope precedence for every vendor product setting.** STORIS states three different orders across `VEND-003`, `VEND-014` and `VEND-041`. Proposed: `PRODUCT → GROUP → CATEGORY → VENDOR_SHIP_FROM → VENDOR_REGION → VENDOR → COMPANY → global`. Adopt once, test once, never fork.
- **`[DN-08]`** **Additive vs override for `Auto Fill Days`.** STORIS makes it the *only* additive setting in the family. Recommend: make everything override, and model any genuine padding as its own named field.
- **`[DN-09]`** **Group vs Category precedence.** `VEND-014` settles it for Excess/Minimum Stock Days (**Group beats Category**); `VEND-002` and `VEND-013` leave it open for rebates. Adopt Group-beats-Category everywhere.
- **`[DN-10]`** **Is `Factory Default Warranty` a warranty code or a day count?** The source says both. Inspect live data. (`VEND-007`)
- **`[DN-11]`** **Days-supply unit mismatch:** `Total Days Supply = Current Net Available / Weekly Sales Rate` yields weeks, but is compared against a field in days. Off by a factor of 7 unless normalised somewhere undocumented. (`VEND-044`, `VEND-014`)
- **`[DN-12]`** **`Per Piece Delivery Charge` — include or exclude?** The prose says exclude, the field says include. Also confirm exclusions are applied *before* the piece limit. (`VEND-046`)
- **`[DN-13]`** **Delivery charge table selection precedence** when several tables match one order (formation × handling method × membership), and the **per-weight-unit basis** (order weight vs tier lower bound — the source states both in one paragraph). (`VEND-025`, `VEND-026`)
- **`[DN-14]`** **Delivery-charge repricing policy for open orders.** STORIS reprices only if someone edits the fulfillment method or deliver-to address — the worst of the three options. Choose: always reprice, never reprice, or flag for review. (`VEND-024`)
- **`[DN-15]`** **`Minimum Purchase Amount`: warn-and-override, or hard reject?** The source's own help text says both, in one paragraph. Also close the partial-completion re-edit loophole. (`VEND-026`)
- **`[DN-16]`** **Email separator rule for Deliver To** — comma/semicolon or newline? The source states both in consecutive sentences. Resolved by normalising emails into a child table. (`VEND-023`)

**P3 — scope decisions for LA Mattress (may be straight non-ports)**

- **`[DN-17]`** Do we need **per-region vendor settings** at our footprint? If not, ship the `VENDOR_REGION` resolver scope but leave the UI unbuilt. (`VEND-003`)
- **`[DN-18]`** Do we **import directly** (own customs entries) or buy DDP/landed from domestic importers? If the latter, brokers, freight forwarders, FOB and shipping ports are all out of scope. (`VEND-019`, `VEND-038`, `VEND-040`)
- **`[DN-19]`** **Review/survey platform** — Birdeye, in-house delivery surveys, both, or neither? Running both doubles customer contact. (`VEND-018`, `VEND-028`)
- **`[DN-20]`** **Payment processor stack** — most of Electronic Merchant Settings is a non-port with a modern tokenising PSP. Keep only merchant-by-location resolution and settlement scheduling. (`VEND-033`)
- **`[DN-21]`** Any **dealer/franchise-operated locations**? If no, drop Franchise Settings entirely. (`VEND-039`)
- **`[DN-22]`** Do we have **commercial/multi-site customers** needing multiple Deliver To addresses? (`VEND-023`)
- **`[DN-23]`** May a **vendor ship-from carry its own payment terms and remit-to**, or is remit-to strictly vendor-level? Positions 1–47 never answer; the answer likely sits in the `Vendor Settings` / `Vendor Ship-From Settings` articles in part B. (`VEND-035`)

---

## Cross-references established or confirmed by this part

**Reused, not re-minted:** `CFG-VEND-FREIGHTFACTOR`, `CFG-VEND-ADDONFACTORS`, `CFG-VEND-SHIPFROM`, `COST-031`, `COST-032`, `COST-033`, `PO-020`, `PO-021`, `PO-071`, `PO-080`, `RPT-AUDIT`, `parts/user-security-CATALOG.md`.

**New requirement IDs proposed here:**

| ID | What | Source |
|---|---|---|
| `CFG-PUR-RESTRICTBUYER` | Purchasing Control Settings → `Restrict Entry to a Single Buyer` | `VEND-015` |
| `SEC-PUR-BUYERSCOPE` | Buying group = who may transact against which vendors/products (an authorisation rule, not a settings file) | `VEND-020` |
| `CFG-VEND-INTRANSITDAYS` | In-transit days scoped `(vendor \| vendor_ship_from) × destination_location` | `VEND-034` |
| `CFG-VEND-PAYABLESCOMPANY` | Payables company scoped `(vendor, receiving_location)` — apply to **all** AP paths, not just EDI 810 | `VEND-036` |
| `CFG-AP-INVOICECHARGEMATRIX` | Invoice charge / vendor-return tax matrix, `company_state × vendor_state` best-match | `VEND-043` |
| `INV-DISTSTATUS` | Distribution status incl. the `Defective` system-wide sell/transfer kill-switch | `VEND-030` |

**Resolver scopes this part confirms are needed:** `COMPANY` (`VEND-016`, `VEND-036`), `VENDOR_REGION` (`VEND-003`), **`VENDOR_SHIP_FROM`** (new — `VEND-020`, `VEND-034`, `VEND-035`, `VEND-038`, `VEND-040`), `PRODUCT_CATEGORY` and product group (the whole exception family). **`VENDOR_REMIT_TO` is *not* exercised anywhere in positions 1–47** — but `[DN-03]` shows we cannot finish the AP tax matrix without knowing how it relates to `VENDOR_REGION`.

**Global kill-switch pattern (the Extended Security anti-pattern) recurs five more times here** — we are deliberately not reproducing it:

| Global switch | Renders inert | Article |
|---|---|---|
| Costing Control Settings → `Landed Freight Active` / add-on active flags | The entire Shipping tab of the vendor master | `VEND-014`, `VEND-003` |
| Purchasing Control Settings → `GENERAL - Activate Buying Group` | All of Buying Group Settings | `VEND-020` |
| Purchasing Control Settings → `Restrict Entry to a Single Buyer` | Buyer restriction on PO entry | `VEND-015` |
| Purchasing Control Settings → `DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order` | All in-transit-days-by-location rows | `VEND-034` |
| Point of Sale Control Settings → Delivery tab → `Delivery Charge Settings = Per Piece Charge` | Per Piece Delivery Charge Settings | `VEND-046` |
| Warehouse/Store Location Settings → `Location Tracked` + `Verified` | Floats and picking zones | `VEND-037`, `VEND-047` |

**Possible contradiction of a wave-1 finding, for someone to check:** wave 1 established that **STORIS has no general change-audit log** (only `SAR-024`). `VEND-024` lists a related article titled **`Track Settings Activity`**, and one appears in the "Recently viewed" list on the help centre. **Someone should fetch `Track Settings Activity` and confirm whether it is a real settings-change audit facility.** If it is, the wave-1 conclusion needs qualifying.

**Untrusted-content check.** No article in positions 1–47 contained text addressing the extraction agent, claimed authority over it, or attempted to direct any action. Two articles contain "click here" links to further topics (`VEND-043` → vendor-return tax matrix; `VEND-034` → *In Transit Days Hierarchy*); both are noted above as unfetched dependencies rather than followed.
