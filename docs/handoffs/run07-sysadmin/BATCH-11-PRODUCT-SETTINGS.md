# Run 07 — System Administration — Batch 11: Advanced Product Settings and Warranty Settings

Status: complete. Findings 461–474. Read-only throughout.

`Advanced Product Settings` is cited in **more findings across the audit than any record except Point
of Sale Control Settings** — run 02's pricing, run 03's protection plans, run 04's kit components and
putaway, run 07's reservations and price variance. **It is eleven pages.**

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Advanced Product Settings** | 15294524452244 | read — **eleven pages** |
| 2 | **Warranty Settings** | 15294525418772 | read — **and it does nothing** |

Both are in **Product Settings** (88).

---

## B. Wiring findings

### FINDING 461 — `Warranty Settings` is a reference table with no enforcement

- **Invariant:** warranty records are informational and do not gate anything.
- **Evidence** — `Warranty Settings`, verbatim:
  > "Use this routine to store information for the **factory warranties** included with the regular inventory products they cover, and for the **extended warranties** sold with the products to which they are linked. **Warranties can consist of multiple components linked together.**"
  > "**NOTE: Entering warranty information in this file is optional and for reference only. The information you enter here does not affect the ability to link warranties with inventory products in Sales Order Entry.**"
  Fields: `Warranty Code` · `Description` · `Vendor Code` · **`Warranty Type`** ·
  **Parts:** `Period Type` · `Periods` · `Extended Warranty Start` ·
  **Labor:** `Period Type` · `Periods` · `Extended Warranty Start` ·
  **`RF Picking Message`** · `Comments`.
- **Maps to:** run 05 §H, §I (*"never read in seven runs, despite protection plans running through runs
  02, 03 and 05"*) — **read, and it is not what the audit expected**; run 05 F297; `W-028`.

> **Run 05 flagged this record twice** — in §H as a carried gap and in §I as an unknown unknown, on the
> reasoning that protection plans are sold in run 03, consumed in run 05, and reported on in both, so
> the settings record must matter.
>
> **It does not.** The vendor states plainly that the file is *optional and for reference only* and
> that it **does not affect the ability to link warranties** to products at order entry. It is a place
> to record what a manufacturer's warranty says, not a mechanism.
>
> **That is a genuinely useful negative finding.** It means the protection-plan machinery documented
> across runs 02, 03 and 05 — auto-attachment (run 07 F342), the four payment responsibilities (run 05
> F297), the third-party register code — **runs on `Protection Plan Settings`, not this**. Run 05's
> gap was real but pointed at the wrong record.
>
> Two details are still substantive. **Parts and labour carry separate periods and separate
> `Extended Warranty Start` dates** — so a warranty can cover parts for five years and labour for one,
> starting at different points. That is exactly the structure run 05 F297's payer columns need.
>
> And **`RF Picking Message`** is a small surprise: **a warranty can put a message in front of a
> warehouse picker.** Nothing in run 04's RF picking work suggested product-level messages reached the
> scanner.

### FINDING 462 — Trailing credits reduce written cost at the moment of sale, with their own GL accounts

- **Invariant:** a product can carry up to two vendor rebates that reduce recorded cost as it is sold.
- **Evidence** — `Advanced Product Settings`, **Costing** page, **Rebate/Trailing Credit**:
  > "Sales transaction processes such as **Enter a Sales Order, Enter an Exchange, Enter a Quick Sale, and Enter a Service Order** allow the use of trailing credits. **When a sales line is written, the product is examined to determine if a rebate/trailing credit is in effect. If so, the unit amount and general ledger account are recorded. The written cost fields in the order are reduced to reflect the trailing credit. Sales of As-Is pieces are eligible for trailing credits.**"
  > "you can establish **one or two** trailing credits. To set up a second, you must enter Amount 1 and End Date 1 for the first."
  Fields: `Adjustment Code` · `Amount 1, Amount 2` · `Start Date 1, Start Date 2` ·
  `End Date 1, End Date 2` · **`General Ledger Account 1, General Ledger Account 2`**.
- **Maps to:** `W-061` — **a cost mechanism the audit never saw**; `W-046`; `W-052`; run 03 F144.

> **Seven runs and this is the first sighting of trailing credits**, and they belong in the same
> conversation as run 03 F144's cost restatement.
>
> The mechanism is precise: at the moment a sales line is written, **the product's written cost is
> reduced** by a dated rebate amount, and **the amount and its GL account are recorded on the line.**
> So margin at the point of sale already reflects a vendor rebate that has not been received.
>
> That interacts directly with the audit's central cost chain. Run 03 F144 established that sales are
> written at **average cost** and restated when the exact cost arrives. **Trailing credits reduce that
> written cost further, at the same moment**, on a dated schedule with **two independent GL accounts**.
> Anyone reconciling written margin to received cost has three moving parts, not two.
>
> **Two credits with sequenced setup** — the second requires the first to have an amount and an end
> date — implies overlapping rebate programmes, which is normal in furniture buying.
>
> **`Sales of As-Is pieces are eligible`** is stated explicitly, which matters given run 04 F280's
> finding that As-Is is the disposition hub: **damaged goods still earn the vendor rebate.**

### FINDING 463 — Directed putaway's inputs are six product dimensions, closing run 04's gap

- **Invariant:** putaway volume is computed from stored dimensions, matched on velocity and category.
- **Evidence** — `Advanced Product Settings`, **Settings** page, **Directed Put-Away Storage**:
  > "The following fields are used to **calculate the volume of a product when using the directed putaway process**. **You should enter these values based on how the product is stored.**"
  **`Height` · `Width` · `Depth` · `Weight` · `Velocity` · `Category`**
  Separately, on the **Miscellaneous** page: **Logistics:** `Shipping` *(Weight, Volume)* ·
  `Delivery` *(Volume, Method)* · **`Unload Time __ Minutes`** · `Assembly Required` ·
  `Inspection Required` · **`Include in Cross Dock`**.
- **Maps to:** run 04 F227, F285 · run 07 F369 — **the algorithm's inputs, at source**;
  run 04 F232 (crossdock); `W-055`.

> Run 04 F227 found directed putaway *"automatically designating"* destinations and could not say how;
> run 04 F285 found it matches **velocity and storage category** between product and location; run 07
> F369 found the system-level defaults. **These are the per-product values**, and the instruction is
> unusually specific: *"enter these values based on **how the product is stored**"* — not the product's
> own dimensions, but its dimensions **as stacked in the rack.**
>
> **Storage dimensions and shipping dimensions are separate fields**, on separate pages. `Height/Width/
> Depth/Weight` under Directed Put-Away Storage; `Weight/Volume` under Logistics → Shipping; and a
> further `Volume` under Logistics → Delivery. **Three sets of measurements for three purposes**, which
> is right — a mattress stores flat, ships rolled, and delivers as a piece — and which means run 07
> F369's warning about estimated capacity applies to whichever set is missing.
>
> **`Unload Time __ Minutes` per product** feeds run 07 F369's route-mapping time model at line level.
>
> **`Include in Cross Dock`** is the product-level half of run 04 F232's crossdock finding — the audit
> found only a filter checkbox on the putaway plan and recorded crossdock as *"a whole inbound pattern
> with no descriptive article."* **Products opt in.** The pattern itself is still undescribed.

### FINDING 464 — Distribution status resolves through three levels and can be scheduled to change

- **Invariant:** a product's distribution status is checked warehouse-first and can flip on a date.
- **Evidence** — `Advanced Product Settings`, **Miscellaneous** page, **Distribution Status**:
  > "The system uses the **standard product hierarchy** to determine a product's distribution status, checking for these settings in the following order: **Warehouse Inventory Settings, District/Regional Product Settings, and then Advanced Product Settings.**"
  > "Once the **New Status Date** and **New Status** have been established, set up the **Scheduled Settings Update** to run in the **Schedule a Process** program. Based on the end of day date and the status change date, the update process **updates this Current Status field and the New Status Date and New Status fields are reset to null.**"
  Fields: `Current Status` · `New Status Date` · `New Status`.
  > "can be used only with products whose **Inventory Type is set to Retail Inventory, Retail Part, or Retail Labor**."
- **Maps to:** run 04 F252 (`Inventory Availability` can forbid transfer) · batch 6 F413 · run 07 F351
  — **the fifteenth fall-through hierarchy**; `W-012`; `W-055`.

> **A future-dated status change with a batch process to apply it**, and the fields self-clear once
> applied. That is a small, well-made mechanism: set the date, the nightly update flips it, the
> scheduling fields reset.
>
> Run 04 F252 found that distribution status can **forbid a product from being transferred**. So
> **a product can be scheduled to become untransferable on a date** — which is exactly how a retailer
> retires a line, and nothing in run 04 suggested it was schedulable.
>
> **The three-level hierarchy is stated as "the standard product hierarchy"**, which implies it governs
> more than distribution status. It is **warehouse-first**, which is the opposite direction from the
> reservation hierarchy (batch 2 F353: region-product → product → system). **Two product hierarchies
> running in opposite directions** is a real trap for anyone implementing either.
>
> **`Schedule a Process`** and **`Scheduled Settings Update`** are named routines the audit has not
> read; the former is in User Settings.

### FINDING 465 — Handling methods are set four ways per product, and the EDI sends current values

- **Invariant:** a product carries a handling method per transaction type, resolved at transmission.
- **Evidence** — `Advanced Product Settings`, **Miscellaneous** page, **Handling Methods**:
  > "Use these four settings to **communicate delivery requirements for a product to the 3rd party logistics company**. … If a fulfillment method does not exist in the **Fulfillment Handling Method Assignment** for the applicable order type, **a message is presented but does not prohibit use** of the chosen handling method."
  > "**NOTE: When order information is sent to the third party logistics company via the 215 EDI document, the handling method information sent is based on the current settings, not the settings at the time the product was added to the order.**"
  Fields: **`Sale` · `Return` · `Exchange` · `Transfer`**
- **Maps to:** run 04 F172, F173, F174 — **the product-level half**; run 07 F371 (EDI 215); `W-042`.

> Run 04 F172 found handling methods as two-character codes constrained by the 3PL's EDI 215 codes,
> assignable to *"products, fulfillments and delivery charge tables"*, and F174 found them prioritised
> per order type. **This is the product side, and it is four separate fields** — a product can be
> handled one way outbound on a sale and another on a return.
>
> **The 215 note is the finding.** *"Based on the current settings, not the settings at the time the
> product was added to the order"* means **changing a product's handling method retroactively changes
> what the carrier is told about orders already taken.** Every other cost and price mechanism in this
> ERP snapshots at write time; this one resolves at transmission.
>
> That is a real operational hazard — a merchandiser correcting a handling code alters instructions
> for goods already scheduled — and it is documented in one note.

### FINDING 466 — Product substitution is a two-field mechanism

- **Invariant:** a product can name a substitute and a substitution method.
- **Evidence** — `Advanced Product Settings`, **Settings** page, **Substitution**:
  **`Method`** · **`Product`**
- **Maps to:** run 04 F218, F239, F242 (*"an undocumented automatic re-sourcing engine"*) — **a
  candidate mechanism**; `W-055`.

> Run 04 flagged as its most consequential undocumented behaviour a **warehouse-wide replacement
> search** with three call sites — damaged pick, `NIL` at the scan prompt, damage in prep — and no
> description anywhere.
>
> **This may be part of it.** A product-level `Substitution Method` and `Substitution Product` is
> exactly what an automatic re-source would consult. **Recorded as a candidate, not a resolution** —
> the two fields are named with no explanation, and run 04's search is described as finding *another
> piece of the same product*, not a different product.
>
> The distinction matters: **replacement** (another unit of the same SKU) and **substitution**
> (a different SKU) are different operations, and STORIS may have both. Section H.

### FINDING 467 — Reservation settings appear at product level with four options, confirming the three-level model

- **Invariant:** the product record carries the same reservation pair as the system and regional levels.
- **Evidence** — `Advanced Product Settings`, **Settings** page, **Reservations**:
  > "Prioritize by **Inventory Control Setting** & reserve by Inventory Control Setting *(If you select Use Inventory Control Setting at Reservation Priority you must **also** select Use Inventory Control Setting at Reservation Date.)*
  > Prioritize by Ordered Date & reserve by Delivery Date within Auto Fill Days · Prioritize by Delivery Date & reserve by Delivery Date within Auto Fill Days · Prioritize by Ordered Date & reserve Immediately"
  Fields: **`Auto Fill __ Days`** · `Priority` · `Date` · **`Require Reservation`**
- **Maps to:** batch 2 F353, F354 — **CONFIRMED from the product record**; `W-055`.

> Batch 2 read this from `Stock Reservation Settings`; **here it is in place**, with two fields that
> article did not surface.
>
> **`Auto Fill __ Days` is per product.** The fill window — the forward horizon within which
> delivery-dated reservation operates — is a product-level number. So a mattress and a floor lamp can
> have different fill windows, which is sensible and considerably more granular than the audit assumed.
>
> **`Require Reservation`** is new: a product can be flagged as **unsellable without a reservation.**
> That is a strong constraint and nothing in four runs of availability work mentioned it.

### FINDING 468 — Price variance rules exist at product level too, closing the override screen's chain

- **Invariant:** the four price-variance controls are set per product as well as system and location.
- **Evidence** — `Advanced Product Settings`, **Pricing** page, **Price Variance Rules**:
  **`Variance %` · `Variance Exceeded Alert` · `Reason Required` · `Comment Required`**
- **Maps to:** run 07 F345 (POS Control Settings) · run 06 F316 (the override screen's *"price variance
  settings"*) — **the third level**; run 03 F13; `W-050`; `W-061`.

> Run 07 F345 found these in Point of Sale Control Settings with a **location override** in
> Warehouse/Store Location Settings. **The product record is a third level.**
>
> So run 06 F316's statement that the override screen's fields are decided by *"your security settings
> and price variance settings"* resolves through **three records** — product, location, system — plus
> the per-user `Maximum Price Variance` permission (batch 8 F429). **Four levels for one control.**
>
> That is the most-layered single control the audit has found, and it is worth stating for the
> rebuild: **how far a price may be cut is answered by a product, a store, a system default and a
> person.**

### FINDING 469 — Three named furniture manufacturers have dedicated product fields

- **Invariant:** the product record carries vendor-specific integration fields.
- **Evidence** — `Advanced Product Settings`, **Interfaces** page, complete:
  **`Bassett Product Class` · `Warehouse Management System Group` · `Ashley Quantity Buffer` ·
  `La-Z-Boy EDI Transmission Information`**
- **Maps to:** run 07 F386 (`Bassett XML Catalog`, `Ashley Custom Cost Formula`) — **extended to a
  third**; run 04 F206 (external dependencies); **NEW**.

> Batch 4 F386 found `Bassett XML Catalog` as a server path and `Ashley Custom Cost Formula` as an
> article title, and observed that **some of what looks like configuration is supplier-specific
> product features.** **A whole page of the product record is given over to it**, and **La-Z-Boy** is a
> third.
>
> Three named manufacturers, each with a different integration shape: **Bassett a product class,
> Ashley a quantity buffer, La-Z-Boy EDI transmission data.** For a mattress and furniture retailer
> these are among the largest suppliers, and it means STORIS's fit for LA Mattress partly depends on
> **which brands they carry.**
>
> **`Warehouse Management System Group`** on the same page is the product-level key for run 07 F375's
> WMS boundary.

### FINDING 470 — Customer rewards and membership both reach the product record

- **Invariant:** points earning and membership terms are product-level.
- **Evidence** — `Advanced Product Settings`, **Miscellaneous** page:
  **Customer Rewards:** > "award reward points to customers based on their purchases of **selected products**. Customers can then **redeem those points for gift certificates**."
  **`Product Earns Reward Points` · `Promotional Points Factor`**
  **Other:** > "The follow two fields are used for the **Customer Membership Program** feature."
  **`Membership Program` · `Membership Terms`**
- **Maps to:** batch 4 F343 (two loyalty programs) · batch 4 F381 (the five-field rewards model) —
  **both confirmed at product level**; `W-028`.

> Batch 4 F381 quoted the rewards record's own note that points can be awarded *"on a product-by-
> product basis via the Advanced Product Settings."* **Confirmed**, with a **`Promotional Points
> Factor`** the rewards record did not mention — a multiplier for promotional periods.
>
> And **`Membership Program` / `Membership Terms` are separate fields on the same page**, which is the
> clearest confirmation yet of batch 4 F343: **two programs, both product-aware, independently
> configured.** Run 03 F158's reading of them as one module is definitively closed.

### FINDING 471 — `Inventory Formation` appears three times and is still undefined

- **Invariant:** products relate to formations, and history can be merged from one.
- **Evidence** — `Advanced Product Settings`:
  **Settings** page, Other: **`Related Inventory Formations`** · **`Merge History From`**
  **eSTORIS** and **API** pages: **`Web Related Inventory Formations`**
  **User Defined Settings** page: > "This page is active when more than one user defined setting record is present and at least one of those records is set up **without an associated inventory formation**."
- **Maps to:** run 04 batch 11 §F (`Multiple Inventory Formation Selection`) · run 04 batch 8
  (`Inventory Formations Overview` named as a related article) — **a fourth and fifth sighting, still
  undefined**; the audit's ten remaining undefined terms.

> **Five sightings across two runs and no definition.** From context it is a **grouping of products** —
> related formations drive web merchandising, user-defined settings can be scoped to one, and history
> can be merged from one product to another within it.
>
> **`Merge History From`** is the substantive part: **a product can inherit another product's history.**
> That is how a replaced SKU keeps its sales record, and it has direct consequences for any migration —
> **product history in STORIS may not belong to the product it is attached to.**
>
> `Inventory Formations Overview` exists as an article (named in run 04 batch 8) and remains unread.
> **It is now the highest-value of the ten remaining undefined terms**, because it touches history.

### FINDING 472 — Product settings changes are auditable through a named source

- **Invariant:** the settings-audit facility covers products.
- **Evidence** — `Advanced Product Settings`, opening line:
  > "Use the **Product source in Review Settings Activity** to see **historical changes made to products' settings**."
- **Maps to:** batch 3 F368 · batch 5 F394 (`Track Settings Activity`) · batch 7 F427 — **the audit
  facility, applied**; `W-064`.

> **First sighting of a named *source* within `Review Settings Activity`.** Batch 5 F394 found the
> auditing works **at file granularity** — turn it on for a file and all its attributes are audited.
> **"The Product source"** confirms the reporting side is organised by file too.
>
> That makes the tool concretely useful for a cutover question the audit could not otherwise answer:
> **when did this product's cost, price or status last change, and who changed it?** Given batch 5
> F394's warning that disabling auditing deletes the history, **whether the Product source is enabled
> today is worth checking before relying on it.**

### FINDING 473 — Eleven pages, and four of them are e-commerce

- **Invariant:** the product record is substantially a web-catalogue record.
- **Evidence** — `Advanced Product Settings` page headings, verbatim:
  > **General · Pricing · Costing · Settings · Miscellaneous · eBridge · eBridge SEO · Interfaces · User Defined Settings · eSTORIS · API**
  > "This page is used to maintain settings for the **STORIS eBridge e-commerce solution**. Some fields on this page **also appear on the eBridge SEO and eSTORIS tabs. Updating a field on one page automatically updates the same field on the other pages.**"
  eBridge SEO fields: `Keywords` · `Meta Description` · `Title Tag` · `Image Alt Tag` · `SEO URL`.
- **Maps to:** run 03 batch 1 (eSTORIS orders enter by their own path) · run 04 F201 (`I1`–`I4` web
  hold codes) · run 03 batch 16 F164 (`View Web Transactions`); **NEW**.

> **Four of eleven pages are web** — eBridge, eBridge SEO, eSTORIS, API — and they share fields that
> update each other automatically. That is a meaningful proportion, and it says something the audit
> has not registered: **STORIS is also the e-commerce product catalogue**, complete with SEO metadata.
>
> Seven runs have met eSTORIS repeatedly at the edges: web orders with their own hold codes
> (`I1`–`I4`), `View Web Transactions`, `Web Control Settings`, the shopping-cart machinery. **The
> product side is larger than any of that suggested.**
>
> **`eBridge` and `eSTORIS` are two distinct e-commerce products** with overlapping fields, plus an
> `API` page with its own subset. Three web surfaces on one record. For a rebuild that is a direct
> question: **does LA Mattress sell online through STORIS, and if so through which?**

### FINDING 474 — Non-inventory products carry usage types and a linkage model

- **Invariant:** non-inventory products declare what they are for and what they link to.
- **Evidence** — `Advanced Product Settings`:
  **General** page: `Inventory Type` · `Product Type` · **`Non-Inventory Usage`** *(listed twice)*
  **Miscellaneous** page, **Non-Inventory Product Linkage**:
  > **`Usage - None`** · **`Usage - Installation & Installation Real-Property Usage Formations`** ·
  > **`Usage - State Recycle Fee`**
  > "The following three fields are used for **non-inventory products**: `Link to Inventory` ·
  > `Extended Code` · `Extended Category`. The following two fields are used for **inventory
  > products**: `Extended Categories` · `Factory Code`."
  Inventory Types named elsewhere: **Retail Inventory · Retail Part · Retail Labor · Service Labor**.
- **Maps to:** run 04 F279 (*"inventory type is a fundamental branch, not an attribute"*) — **CONFIRMED
  and enumerated further**; run 03 (miscellaneous fees); `W-055`; `W-052`.

> Run 04 F279 found bulk and non-inventory products excluded from four operations and concluded
> **inventory type is a fundamental branch.** This gives the vocabulary: **Retail Inventory · Retail
> Part · Retail Labor · Service Labor**, plus bulk and non-inventory from run 04.
>
> **`Usage - State Recycle Fee`** is the interesting one — a non-inventory product type that exists to
> carry a **statutory fee**, which is a real requirement for mattress retail in several US states and
> which nothing in seven runs mentioned. **`Usage - Installation & Installation Real-Property Usage
> Formations`** is the other named usage, and it invokes *formations* again (F471).
>
> **`Service Labor` products use `Selling Price` as the hourly rate** — stated on the Pricing page —
> which is how run 05 F383's `Default Labor Rate Per Hour` reaches a line.

---

## C. Screen and field inventory

**`Advanced Product Settings`** — eleven pages:

| Page | Blocks |
|---|---|
| **General** | Descriptive *(7)* · **Tracking** *(Inventory Activity · Serial Numbers · Special Ordered)* · Other *(Vendor Ship-From · Creation Date · PO From Order Entry · Default Fulfillment Method)* |
| **Pricing** | Price *(5)* · Discount *(5)* · Promotion *(5)* · **Price Variance Rules** *(4)* · Taxes *(3)* · Commissions *(5)* · Service *(Minimum Labor Time · Service Repair Charges Apply to)* |
| **Costing** | Cost *(Replacement · Average · Non-Inventory %)* · Exception *(Minimum Gross Profit %)* · Purchasing *(Volume Rebate Table · Discount Costing Table)* · Importing *(Import Tariff Code 1, 2)* · Purchasing *(Minimum Order Quantity · Maintain PO Line Text · Buying Group)* · **Rebate/Trailing Credit** *(9)* · **Landed Freight and Add-On Approximations** *(Freight Factor · Add-On 1–4 Factor · Cost Fields 1–4)* |
| **Settings** | Purchasing *(Lead Days)* · Purchase Status *(4)* · Packing *(5)* · UPC *(4)* · **Directed Put-Away Storage** *(6)* · Default Warehouse Quantities *(Maximum · Minimum · Safety Stock)* · **Substitution** *(2)* · **Reservations** *(4)* · Prep *(Code · Prompt User in POS)* · Other *(Style · Collection · Label Type · Kit Component · Product Status · **Related Inventory Formations** · **Merge History From** · **Limit Use By Region**)* |
| **Miscellaneous** | Unit of Measure *(6)* · **Logistics** *(Shipping W/V · Delivery V/Method · Assembly Required · **Unload Time** · Inspection Required · **Include in Cross Dock**)* · **Handling Methods** *(Sale · Return · Exchange · Transfer)* · **Non-Inventory Product Linkage** *(3 usages + 5 fields)* · **Distribution Status** *(3)* · **Customer Rewards** *(2)* · Additional Description *(Color · Size · Fabric)* · Direct Ship *(2)* · Display Images *(2)* · Other *(User Product Code · Related Parts · Comments · **Membership Program** · **Membership Terms** · Image URL)* |
| **eBridge** | Web Description · Web Category · Additional Web Categories · Availability *(3)* · Dimensions *(3)* · Web Benefits · Company Special |
| **eBridge SEO** | Keywords · Meta Description · Title Tag · Image Alt Tag · SEO URL |
| **Interfaces** | Bassett Product Class · Warehouse Management System Group · Ashley Quantity Buffer · La-Z-Boy EDI Transmission Information |
| **User Defined Settings** | Setting · Response · Select *(informational only)* |
| **eSTORIS** | Available on Web · eSTORIS Published Status · Direct Ship *(2)* · Web Description · Minimum Web Stock Available Quantity · Web Store · Web Related Inventory Formations · **Stocked in Vendor Warehouse** · Dimensions *(3)* |
| **API** | Available on Web · Direct Ship from Web · Web Related Inventory Formations · **Alternate Product ID** · Dimensions *(3)* |

**`Warranty Settings`** — Warranty Code · Description · Vendor Code · Warranty Type · Parts *(Period
Type · Periods · Extended Warranty Start)* · Labor *(same three)* · **RF Picking Message** · Comments.

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Rebate/Trailing Credit** *(9 fields)* | Advanced Product Settings → Costing | Reduces written cost at sale, with two GL accounts (F462) |
| **Directed Put-Away Storage** *(6)* | → Settings | Volume, velocity and category for putaway (F463) |
| **Distribution Status** *(3)* | → Miscellaneous | Three-level hierarchy, **warehouse-first**, schedulable (F464) |
| **Handling Methods** *(4)* | → Miscellaneous | Per transaction type; **215 sends current values** (F465) |
| **Reservations** *(4)* incl. `Auto Fill __ Days`, `Require Reservation` | → Settings | Product-level reservation method and fill window (F467) |
| **Price Variance Rules** *(4)* | → Pricing | Third level of the variance chain (F468) |
| **`Include in Cross Dock`** | → Miscellaneous | Product opts into crossdocking (F463) |
| **`Merge History From`** | → Settings | A product inherits another's history (F471) |

---

## F. State machines and enumerations (additions)

- **Inventory Types named:** Retail Inventory · Retail Part · Retail Labor · Service Labor
  *(+ bulk, non-inventory from run 04)* (F474).
- **Non-inventory usages (3):** None · Installation *(and real-property formations)* ·
  **State Recycle Fee** (F474).
- **Product hierarchies (2, opposite directions):** distribution status is **warehouse → district/
  region → product** (F464); reservation is **region-product → product → system** (batch 2 F353).
- **Handling method slots (4):** Sale · Return · Exchange · Transfer (F465).
- **Trailing credits (2, sequenced)** with two GL accounts (F462).
- **Web surfaces (3):** eBridge · eSTORIS · API (F473).
- **Named manufacturer integrations (3):** Bassett · Ashley · La-Z-Boy (F469).

---

## G. Sequencing rules

1. Sales line written → product examined for a **trailing credit in effect** → **written cost reduced**,
   amount and GL account recorded (F462).
2. `New Status Date` reached → **Scheduled Settings Update** at end of day → `Current Status` updated,
   scheduling fields **reset to null** (F464).
3. Order sent by **215** → handling method taken from **current** product settings, not the order's
   (F465).
4. Distribution status resolved **warehouse → district/region → product** (F464).

---

## H. Open questions and gaps

### Resolved this batch

- **`Warranty Settings`** — carried from run 05; **read, and it is reference-only** (F461).
- **Directed putaway's inputs** — run 04 F227's *"how?"* (F463).
- **Crossdock opt-in** — partially closes run 04 F232 (F463).
- **Product-level reservation and price variance** — confirming batch 2 and batch 4 (F467, F468).
- **Two loyalty programs at product level** — batch 4 F343 confirmed (F470).

### Newly opened

- **Trailing credits** — a cost mechanism unseen in seven runs, interacting with run 03 F144's
  restatement (F462).
- **`Substitution` Method and Product** — a candidate for run 04's undocumented re-sourcing engine,
  or a separate mechanism (F466).
- **`Require Reservation`** — a product can be unsellable without a reservation (F467).
- **`Stocked in Vendor Warehouse`**, **`Alternate Product ID`**, **`Prep Code`**,
  **`Service Repair Charges Apply to`**, **`Discount Costing Table`**, **`Import Tariff Code 1/2`** —
  named, unexplained.
- **State recycle fees** as a non-inventory usage (F474).

### Still open

- **`Inventory Formation`** — five sightings, no definition. **`Inventory Formations Overview` is now
  the highest-value unread article** of the ten remaining undefined terms, because `Merge History From`
  touches history (F471).
- `Protection Plan Settings` — the record that actually governs plans, given F461. **Now a priority.**

### Inferences

- **I-82:** `Substitution Method`/`Product` is a *different-SKU* mechanism, distinct from run 04's
  *same-SKU* replacement search. *Both are undescribed; the distinction is inferred from the words.*
- **I-83:** An Inventory Formation is a product grouping used for web merchandising, user-defined
  settings scoping, and history inheritance. *Assembled from five field contexts; never defined.*

---

## I. Unknown unknowns

- **Written cost is reduced at sale by trailing credits** (F462), on top of run 03 F144's average-cost
  writing and later restatement. **Three mechanisms move cost on one line**, and seven runs had two.
- **A product can inherit another product's history** (F471). Any migration that treats product history
  as belonging to its product may be wrong.
- **Handling methods resolve at transmission, not at write time** (F465) — the only mechanism found
  that does. Changing a code retroactively changes carrier instructions.
- **Four of eleven product pages are e-commerce** (F473). STORIS is also the web catalogue, and the
  audit has been treating eSTORIS as a peripheral order source.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Trailing credit** | A dated vendor rebate that reduces written cost as the line is sold |
| **Directed Put-Away Storage** | Product dimensions **as stored**, plus velocity and category |
| **Distribution Status** | Warehouse-first, schedulable product status governing availability and transfer |
| **`Include in Cross Dock`** | Product-level crossdock opt-in |
| **`Merge History From`** | Inherits another product's history |
| **Inventory Formation** | A product grouping; **still undefined** after five sightings |
| **eBridge / eSTORIS / API** | Three web surfaces on the product record |
| **`Usage - State Recycle Fee`** | Non-inventory product type carrying a statutory fee |

---

## Contract adjudication — batch 11

| Contract | Verdict | Basis |
|---|---|---|
| **W-061** *(cost and margin)* | **CONFIRMED and extended** | **Trailing credits reduce written cost at sale** with two GL accounts (F462) |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED** | Product-level reservation, fill window and `Require Reservation` (F467); putaway inputs (F463) |
| **W-052 / W-053** *(GL)* | **CONFIRMED** | Two trailing-credit GL accounts (F462) |
| **W-028** *(warranties and plans)* | **CONFIRMED — with a negative finding** | `Warranty Settings` is reference-only (F461); rewards and membership at product level (F470) |
| **W-012** *(dates)* | **CONFIRMED** | Scheduled distribution status change at end of day (F464) |
| **W-042** *(propagation)* | **CONFIRMED, with a hazard** | 215 sends **current** handling methods, not order-time (F465) |
| **W-050** *(access control)* | **CONFIRMED** | `Limit Use By Region` at product level (batch 6 F413) |
| **W-064** *(retention)* | **CONFIRMED** | Product settings changes auditable via the Product source (F472) |
| **Vendor-specific integrations** | **NEW — three manufacturers** | F469 |
| **E-commerce catalogue** | **NEW** | F473 |

---

## Next — batch 12

`Protection Plan Settings` *(now a priority given F461)* · `Inventory Formations Overview` ·
`District and Regional Product Settings` · `Warehouse Inventory Settings` · `Product Settings` ·
`Product Kit Settings` — completing **Product Settings** (88), then **`Warehouse/Store Location
Settings`** in the nested System Administration subsection, referenced from six batches of run 04.
