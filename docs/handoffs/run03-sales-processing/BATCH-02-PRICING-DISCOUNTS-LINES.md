# Run 03 — Sales Processing — Batch 2: Pricing, Discounts and Line Manipulation

**Status: complete.** 10 articles. Findings 15–24.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Pricing Rules** | /articles/15201390177300 | EXTRACTED — **a seven-level hierarchy with a reorder switch** |
| 2 | **Additional Line Item Details** | /articles/15201408965268 | EXTRACTED — five pages |
| 3 | **Enter Multiple Discounts Per Line** | /articles/15201404906388 | EXTRACTED |
| 4 | Enter Discounts on Multiple Lines | /articles/15201404903060 | EXTRACTED |
| 5 | Enter Subtotal Discount Codes | /articles/15201405129108 | EXTRACTED |
| 6 | Override Discount Amount | /articles/15201405470484 | EXTRACTED — thin |
| 7 | **Trade Pricing and Discounting** | /articles/15201409127828 | EXTRACTED |
| 8 | **Maximum Trade Discount** | /articles/15201407490580 | EXTRACTED |
| 9 | Clone From Existing Line | /articles/15201389095444 | EXTRACTED |
| 10 | Split Merchandise Lines | /articles/15201424643220 | EXTRACTED — thin |
| 11 | **Maintain Linked Lines** | /articles/15201389864340 | EXTRACTED — eight linkage rules |

Discovered and queued: `Sales Discount Settings` · `Customer Price Settings` *(customer price
matrices)* · **`Price/Spiff/Commission Table`** · `Pricing Level table` · `Warehouse Inventory
Settings` · `District and Regional Product Settings` · `Advanced Product Settings` (Pricing tab) ·
`Enter a Stock Adjustment` (Move to As-Is tab) · **`Twilight Discount Pricing`** ·
`Product Kit Settings` (`Source of Price`) · **`Report Sales Exceptions`** ·
`Trade Designer Information` · `Route Capacity Settings` · `Discounts and Coupons` ·
`Converting Order Types` · `Pricing Details` / `Component Details` / `Product Details`.

---

## B. Wiring findings

### FINDING 15 — Default selling price resolves through a seven-level hierarchy, and one setting reorders it
Invariant:  "**The hierarchy starts with rule 1, checking each rule until it finds a price.**"
Order (verbatim, 1 → 7):
            1. **`Enter a Stock Adjustment`** — as-is pricing via `As-Is Selling Price` on the Move to
               As-Is tab. "**Twilight Discount Pricing is a type of as-is pricing, and the system checks
               for Twilight pricing before it checks for other as-is pricing.**"
            2. **`Price/Spiff/Commission Table`** — checked on **two levels**: a price category matching
               "the customer's price category from the Customer Settings"; otherwise "**the highest
               price specified in the table**, provided a lower promotional price has not been
               specified elsewhere, in which case it uses **the first promotional price it finds that
               is lower**."
            3. **`District and Regional Product Settings`** — promotional sale price exceptions by
               district. "**This is the first level checked in the 'standard' pricing hierarchy.**"
            4. `Advanced Product Settings` (Pricing tab) — general promotional sale
            5. `Warehouse Inventory Settings` — price by location
            6. `District and Regional Product Settings` **again** — regular selling price by district
            7. `Advanced Product Settings` — `Selling Price`
Reorder:    "**If you enable the `Use Warehouse Inventory` field on the Miscellaneous tab of the
            `Warehouse/Store Location Settings`, the pricing hierarchy uses the warehouse inventory
            price ahead of the promotional price.** That is, the warehouse inventory price moves to
            number 4 and the promotional price drops to number 5."
Failure:    "**If the system cannot find a price within the hierarchy and no customer price matrix
            exists, no price defaults on the order.**"
Evidence:   Pricing Rules, /articles/15201390177300
Maps to:    **NEW — the sales-side twin of run 2's landed-cost hierarchy**

> **Seven levels, one file appearing twice at different priorities, and a control setting that swaps
> two of them.** Run 2 found a thirteen-level landed cost hierarchy resolving cost; this resolves
> price, and it has the same defect: **nothing on the resulting order line records which level
> supplied the price.** A line at $899 could be an as-is price, a price-category match, a district
> promotion, a location price or the product's base — and the order does not say.
>
> Two details worth carrying. `District and Regional Product Settings` is consulted **twice**, at
> positions 3 and 6, for different purposes (promotional vs regular) — so district configuration can
> win either very early or very late. And **"no price defaults" is a valid outcome**, leaving the
> salesperson to type one, which then becomes the original selling price for every variance and margin
> calculation downstream (batch 1 Finding 13).

### FINDING 16 — Customer price matrices, markdowns and the hierarchy interact by lowest-wins, with two documented exceptions
Matrix rule (verbatim): "If a customer price matrix exists for a piece on an order and **the matrix
            price is lower than the price returned by the pricing hierarchy, order entry applies the
            matrix price — provided the pricing hierarchy does not apply a price from the `Pricing
            Level` table or the `Price/Spiff/Commission Table`, both of which override the price (if
            any) from the `Customer Price Settings`.**"
Markdown rule (verbatim): "**if the program finds a markdown price for an order item, the program uses
            the markdown price unless the default selling price is lower, in which case it uses the
            default price.**"
Markdown sources: `Advanced Product Settings` (Pricing tab) · `District and Regional Product Settings`
            (District Settings tab) · **`Single Product Review Screen`**
Kit override: "**When a kit's pricing is set to `Component` (`Source of Price` field in `Product Kit
            Settings`), it overrides the `Location Selling Price $` in `Warehouse Inventory Settings`.**"
Evidence:   Pricing Rules, /articles/15201390177300
Maps to:    **NEW**

> Price resolution is therefore **three systems layered**: the seven-level hierarchy, then a lowest-
> wins comparison against the customer matrix (with two hierarchy levels immune to it), then a
> lowest-wins comparison against markdown. **Two independent "take the lower" comparisons with
> different exception rules.**
>
> Note that **`Single Product Review Screen`** is a markdown source — that is the run-2 merchandising
> decisions wizard (run 2 F71/F72), whose single Save writes prices, transfers and purchase orders.
> So the bulk merchandising tool feeds directly into point-of-sale price resolution, and run 2's
> finding that it **skips regional overrides** now has a visible consequence: a markdown set there
> competes with a district price it did not update.

### FINDING 17 — Multiple discounts per line have a "primary" whose identity a setting can change
Invariant:  "**SRP discounts (applied to the manufacturer's suggested retail price) can be combined on
            the same line with `Standard` discounts (applied to standard selling price). The primary
            discount applied (SRP or STANDARD) determines how the remaining discounts are applied.**
            For example, if the primary discount is a standard type discount, and you also enter an SRP
            discount, **the SRP discount and any others that follow are applied to the standard selling
            price rather than the MSRP.**"
Invariant:  "**If the `Automatically Select Optimal Lines for a New Discount` setting is checked in your
            Point of Sale Control Settings the discount code that provides the best discount becomes
            the primary discount, regardless of whether it was entered first or not. If that control
            setting is not checked, the first entered discount code becomes the primary discount.**"
Evidence:   Enter Multiple Discounts Per Line, /articles/15201404906388
Maps to:    **NEW — and it is a genuine commercial lever**

> Two discount *bases* — suggested retail and standard selling price — and **whichever discount is
> primary retrospectively changes the base every other discount on that line computes against.** With
> the optimal-selection setting on, the system silently picks the best-for-the-customer primary; with
> it off, entry order decides.
>
> That means **the same two discount codes entered in the opposite order can produce a different total**
> when the setting is off. For a business negotiating on the floor, this is worth knowing about
> explicitly, and it is the kind of behaviour that quietly diverges if a rebuild picks one convention.

### FINDING 18 — Discounts operate at three scopes, and the subtotal scope is incompatible with ATI
Scopes:     **line** *(`Enter Multiple Discounts Per Line`)* · **multi-line by eligibility**
            *(`Enter Discounts on Multiple Lines`)* · **order subtotal** *(`Enter Subtotal Discount
            Codes`)*.
Subtotal fields (verbatim): `Additional Discounts` · `Percent` · `Amount` · `Discount Code` ·
            **`Coupon Code`** · `SUBTOTAL` · **`Coded Discount`** · **`Additional Discount`** ·
            `NET SUBTOTAL`
Multi-line fields: `Original Selling Price` · `Discount Total` · **`Other Discounts`** ·
            `Net Selling Price` · **`Formation Total`** · **`Minimum Required`**
Eligibility: "a discount only appears if there is **another line on the order that meets the
            `Qualifying Inventory Formation` requirement**, as well as any other eligibility
            requirements set." *(batch 1)*
ATI limit:  "**Subtotal discounts are not compatible with ATI and the field is displayed as
            inactive.**" *(batch 1)*
Evidence:   Enter Subtotal Discount Codes, /articles/15201405129108; Enter Discounts on Multiple Lines,
            /articles/15201404903060; Enter a Sales Order, /articles/15201409256084
Maps to:    **NEW**

> Three discount scopes, plus coupons as a fourth code type at subtotal level. The interesting field
> is **`Formation Total` / `Minimum Required`** on the multi-line screen: **discount eligibility is
> computed across the order against an `Inventory Formation` threshold** — buy enough within a
> formation and a discount unlocks. That is a real promotion mechanic (bundle/threshold offers) and
> `Inventory Formation` has now appeared in three roles across two batches: protection-plan
> qualification, alternate-stock-location exclusion, and discount eligibility. **It is a load-bearing
> classification the audit has not been able to define.**
>
> And turning on an Alternate Tax Interface **removes the entire subtotal discount scope** — a second
> capability lost to ATI after line-level tax exemption (batch 1 F6).

### FINDING 19 — Trade sales are a separate pricing regime with a capped discount and an exception record
Invariant:  "This screen is used **only with trade/referral sales**."
Fields (verbatim): `Suggested Retail Price` · `Current Retail Price` · `Regular Discount` ·
            `Price Override` · *(unlabelled)* **`New Selling Price`** · **`Trade Discount`** ·
            **`Net Selling Price`**
Cascade:    "If you access an existing order and change the **`Apply the Trade/Designer's Discount`**
            field on the `Trade Designer Information` screen for the order, **each line item in the
            Merchandise grid of the order is selected one at a time and this Trade Pricing and
            Discounting screen is displayed automatically for each item.** (This does not occur in
            cases where you **remove** the designer from the order.)"
Cap:        "Use this routine to make changes to the **maximum trade discount percent** available for
            the line item on a trade sales order. **Note that any change you make to the trade discount
            percent results in the generation of an exception record, which you can report during EOD
            or on demand via `Report Sales Exceptions`.**"
Permission: `Change maximum trade discount for a sales line` in Sales Security, or an override.
Evidence:   Trade Pricing and Discounting, /articles/15201409127828;
            Maximum Trade Discount, /articles/15201407490580
Maps to:    **NEW — and a fourth exception system**

> A parallel pricing model for the designer/trade channel, stacking **regular discount and trade
> discount** to a net price, with a **per-line maximum** that can only be raised with permission —
> and doing so **writes an exception record reportable at End-of-Day**.
>
> That is the audit's **fourth exception mechanism**: cost exceptions (run 2 F29), landed add-on
> distribution analysis (run 2 F40), special-order price variance (batch 1 F13), and now trade
> discount exceptions. All four are queues or reports rather than postings. **STORIS's consistent
> answer to "someone did something unusual" is to write a line on a report.**
>
> Note the asymmetric cascade: **adding a designer walks every line and forces a review; removing one
> does not.** So trade discounts can be left on an order whose designer has been removed.

### FINDING 20 — Line item details carry the shipment, warranty and protection-plan links, and split by document type
Pages (verbatim): **Header · General · Sales Order · Return · Direct Ship** — the last three "active
            only if accessing from" that document type.
*General*: Vendor · Brand · Vendor Model · Sell Price · **`Taxable`** · **`National Tax Exempt`** ·
            **`Commissionable`** · **`Commission Category`** · **`Shipment Tracking Number`** ·
            **`Direct Ship Tracking ID`** · `Line Reference` · **`Line Type`** · `Written Date` ·
            **`Purchase Status`** · Product Group · **`Product Type`** · **`Substitution Code`** ·
            **`Substitute Product`** · `Unit of Measure` · **`Unit Conversion`** · Shipping Weight ·
            Comments.
*Sales Order*: `Tax Exempt Authorization Number` · Date · Status · **`Fill Days`** · Ordered Quantity ·
            **`Scheduled` · `Total Scheduled` · `Unscheduled`** · Serial-Tracked · Serial Number ·
            Storage Location · **`Reserved` · `Ship` · `Purchase Order` · `Reserved Transfer`** ·
            **`Factory Warranty` · `Warranty Linkage`** · Order · Line Reference ·
            **`Protection Plan Linkage`**.
*Return*: Factory Warranty · **`Reason Code`** · Serial Tracked/Number · Storage Location ·
            **`Pickup Date`** · Purchase Order · **`Linked Order`**.
*Direct Ship*: Factory Warranty · Serial Tracked · Purchase Order · **`Open Purchase Order Quantity`** ·
            **`Ship Quantity`** · **`Ship Date`** · **`Acknowledgement Date`**.
Evidence:   Additional Line Item Details, /articles/15201408965268
Maps to:    **W-042 — the sales-side view of PO linkage; W-061 — commission basis**

> This is the record behind batch 1's nine status codes. Four quantity concepts coexist on one line —
> **`Reserved`, `Ship`, `Purchase Order`, `Reserved Transfer`** — alongside `Scheduled` / `Total
> Scheduled` / `Unscheduled`, which is **seven quantity fields on a single sales order line.** Run 2
> found four on a purchase order line (Ordered, Received, Due, Billed); the sales side is denser.
>
> The direct-ship page carries **`Open Purchase Order Quantity`, `Ship Quantity` and `Acknowledgement
> Date` read across from the purchase order** — which is how batch 1's direct-ship partial completion
> works (set Ship Quantity to zero to leave a portion open). And **`Substitution Code` / `Substitute
> Product`** appear for the first time in the audit: a product substitution mechanism nothing else has
> mentioned.

### FINDING 21 — Moving lines between fulfillments is governed by eight rules, three of which reach other modules
Invariant (verbatim, complete):
            "**Partial lines cannot be linked to different fulfillments** (i.e. a partial quantity for
              a single line cannot be linked to one fulfillment and the balance quantity to another).
            **Hard kit components cannot be selected. Only the hard kit master can be selected.**
            **Soft kit components can be moved to other fulfillments regardless of the fulfillment
              method.**
            **Non-inventory lines (e.g. warranties) linked to inventory lines are selected only if its
              linked inventory line is selected.**
            **Lines that cannot be fully reserved cannot be moved to a `Take With` fulfillment.**
            **Lines linked to a fulfillment on a delivery manifest cannot be moved.**
            **Products set as `Parcel Only` cannot be moved to a fulfillment that does not have the
              `Delivery Company` set to `Parcel`.**
            **If a line is added to a route, `Route Capacity Settings` are checked and an override may
              occur.**"
Reprint:    "**Moving lines to/from a fulfillment where the Deliver/Customer Pickup Ticket has already
            been printed results in the fulfillment being flagged for reprinting.**"
Invariant:  "**All lines on an order must be linked to a fulfillment.**" · fulfillments with no lines
            are auto-deleted on save.
Evidence:   Maintain Linked Lines, /articles/15201389864340
Maps to:    **NEW**

> Eight rules, and the constraints come from **Inventory** (full reservation for Take With),
> **Logistics** (manifests, route capacity, parcel delivery) and **product structure** (hard vs soft
> kits). The hard/soft kit asymmetry is the sharpest: **hard kit components are locked to their
> master's fulfillment; soft kit components move freely, even across fulfillment methods.** That is a
> real difference in what a "kit" means, and run 2 only saw the hard-kit side (run 2 F89, F120).
>
> **A manifested line cannot be moved at all** — the fifth appearance across the audit of manifests as
> a hard freeze (run 2 F18, F70; batch 1 F8). And the reprint flag is the mechanism behind the delivery
> ticket reprint state machine the user had dissected separately.

### FINDING 22 — Cloning a configured line copies options but deliberately not prices
Invariant (configurator, verbatim): "**All options and sub-options common to both lines are cloned.**
            Sub-options related to an option do not need to be the same to clone the line. Option and
            sub-options do not need to be in the same order. **Prices are defaulted from the current
            line and not the cloned line.** Options and sub-options are cloned **only if applicable to
            the current configurator product**."
Invariant (special order, verbatim): "**All options are cloned if the same option type exists on the
            current special order product. Prices and costs are not cloned, and must be entered if
            required.** If able to enter the price or cost, a message appears to verify the price or
            cost."
Grid:       Line · Product · **`Option 1` / `Option 2` / `Option 3`** displayed as "Option Type: Option"
            *(e.g. "Fabric: Blue")* · Special Order Details.
Evidence:   Clone From Existing Line, /articles/15201389095444
Maps to:    **NEW**

> Two different clone semantics for two product classes. **Configurator lines keep the current line's
> prices; special-order lines carry no price at all and force re-entry with a verification prompt.**
> That is deliberate — it stops a salesperson silently propagating a negotiated special-order price to
> a second item — and it connects to batch 1 Finding 13: a re-entered special-order price becomes the
> **original selling price** for the variance check, so cloning resets the variance baseline.
>
> Only **three options** are displayed in the clone grid, matching the "up to three options" limit run
> 2 saw on `Report Purchase Orders to be Received`. Whether three is the model's limit or the display's
> is still unstated.

### FINDING 23 — Splitting a line is a supported operation, and it is how partial fulfilment is expressed
Invariant:  "designate **a portion of the quantity ordered to be split onto a new line**… Once saved,
            **all required updates are made to the order** and the user is returned to the Merchandise
            page."
Complement: "**Partial lines cannot be linked to different fulfillments**" *(Finding 21)*
Evidence:   Split Merchandise Lines, /articles/15201424643220;
            Maintain Linked Lines, /articles/15201389864340
Maps to:    **NEW**

> These two articles are the same rule from both sides. Because a partial quantity **cannot** be linked
> to a second fulfillment, **splitting the line is the only way to fulfil part of a quantity
> separately.** So a customer taking two of four chairs today creates a line split, not a partial
> allocation — and every downstream count of "lines on the order" changes as a result. Anything
> reconciling line counts across time has to expect them to grow without merchandise changing.

### FINDING 24 — Commission and spiff are decided at line level, and as-is spiff is fixed at the moment of completion
Line fields: **`Commissionable`** · **`Commission Category`** *(also an order-level field, batch 1)*
Invariant:  "**When moving an as-is piece from inventory to completion via the `Inventory Selection
            Screen`, the salesperson is awarded the spiff amount based on the as-is piece table
            assigned at the time.**" *(Order Completion Details)*
Source:     `Price/Spiff/Commission Table` — also **pricing hierarchy level 2** (Finding 15).
Evidence:   Additional Line Item Details, /articles/15201408965268; Order Completion Details,
            /articles/15201512788628; Pricing Rules, /articles/15201390177300
Maps to:    **W-061 — relevant**

> One table supplies **price, spiff and commission together**, and it sits at level 2 of the pricing
> hierarchy — so **the same configuration object that sets what the customer pays sets what the
> salesperson earns.** Changing a price category to win a deal moves the commission with it.
>
> The as-is spiff rule is the sharp one: the spiff is **fixed at completion, from the table assigned at
> that time** — not at the sale. So a piece sold in one period and delivered in another pays whatever
> the table said on the delivery date. Run 2 found as-is inventory carries a reason code and a date
> (run 2 F118); this adds a compensation consequence to it.

---

## C. Screen and field inventory

**Pricing Rules** — no screen; the seven-level hierarchy at Finding 15, plus customer price matrices
and markdown rules.

**Additional Line Item Details** — five pages; full field list at Finding 20. Read-only variant exists.

**Enter Multiple Discounts Per Line** — Product · Description · Order · Date · Type · Store ·
`Discount` · **`Original Selling Price`** · `Discount` · **`Line Extension`** · grid.

**Enter Discounts on Multiple Lines** — `Discount` · Amount · Percent · Order · Type · Store ·
`Original Selling Price` · `Discount Total` · **`Other Discounts`** · `Net Selling Price` ·
**`Formation Total`** · **`Minimum Required`** · grid.

**Enter Subtotal Discount Codes** — `Additional Discounts` · Percent · Amount · Discount Code ·
**Coupon Code** · `SUBTOTAL` · `Coded Discount` · `Additional Discount` · `NET SUBTOTAL` · grid ·
Remove.

**Override Discount Amount** — `Discount Amount`. Appears only when `Override Discount Amount` is
checked in Sales Discount Settings.

**Trade Pricing and Discounting** — Suggested Retail Price · Current Retail Price · Regular Discount ·
Price Override · *(unlabelled)* New Selling Price · Trade Discount · Net Selling Price · Add · Actions.

**Maximum Trade Discount** — `Maximum Trade Discount`.

**Clone From Existing Line** — Line · Product · Option 1 · Option 2 · Option 3 · Special Order Details.
Double-click clones; Exit returns without cloning.

**Split Merchandise Lines** — Order Number *(display-only)* · `Line Number` · Product ·
Quantity Ordered · **`Split Quantity`** · Add · Save · grid.

**Maintain Linked Lines** — Status · Order · Fulfillment · Total Fulfillments · Deliver To
*(conditional)* · **Select All** · **Update** · grid with per-line checkboxes · Actions.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`Use Warehouse Inventory`** | Warehouse/Store Location Settings → Miscellaneous | **Reorders the pricing hierarchy** — location price ahead of promotional |
| `As-Is Selling Price` | Enter a Stock Adjustment → Move to As-Is | Pricing hierarchy level 1 |
| **Twilight Discount Pricing** | (as-is pricing) | Checked **before** other as-is pricing |
| `Price/Spiff/Commission Table` | (table) | **Price, spiff and commission together**; hierarchy level 2; overrides customer matrices |
| `Pricing Level table` | (table) | Also overrides customer price matrices |
| `Customer Price Settings` | (customer matrices) | Applied when **lower**, unless levels above override |
| markdown prices | Advanced Product Settings · District and Regional Product Settings · **Single Product Review Screen** | Applied unless the default price is lower |
| `Source of Price` = `Component` | Product Kit Settings | **Overrides `Location Selling Price $`** in Warehouse Inventory Settings |
| **`Automatically Select Optimal Lines for a New Discount`** | POS Control Settings | Whether the **best** or the **first** discount becomes primary |
| `Override Discount Amount` | Sales Discount Settings | Whether the override window appears |
| `Qualifying Inventory Formation` · `Minimum Required` | Sales Discount Settings | Threshold-based discount eligibility across the order |
| `Apply the Trade/Designer's Discount` | Trade Designer Information | **Adding a designer walks every line; removing one does not** |
| `Parcel Only` / `Delivery Company = Parcel` | Product / Logistical settings | Restricts which fulfillments a line can move to |
| `Route Capacity Settings` | Logistics | Checked when a line joins a route |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| **`Change maximum trade discount for a sales line`** | Sales Security | Raising the trade discount cap; **writes an exception record** |
| `Create multiple fulfillments for a method` | Sales Security | Access to `Maintain Linked Lines` |
| `Access sales order line discounts` | Sales Security | Line discount entry *(batch 1)* |
| route capacity override | Logistics Security | Adding a line to a full route |

---

## F. State machines and enumerations

**Pricing hierarchy (7 levels)** — as-is/Twilight → Price/Spiff/Commission Table → district promotional
→ product promotional → warehouse location price → district regular → product selling price.
*(levels 4 and 5 swap under `Use Warehouse Inventory`)*
**Price overlays** — customer price matrix *(lower wins, unless Pricing Level or Price/Spiff/Commission
supplied the price)* · markdown *(lower wins)*.
**Discount bases** — **`SRP`** *(suggested retail)* · **`STANDARD`** *(standard selling price)*;
the **primary** discount's base governs all others on the line.
**Discount scopes** — line · multi-line by eligibility · order subtotal · coupon.
**Line quantity fields (7)** — Ordered · Scheduled · Total Scheduled · Unscheduled · Reserved · Ship ·
Purchase Order · Reserved Transfer.
**Line-move constraints (8)** — partial lines · hard kit components · soft kit components ·
non-inventory linked lines · unreservable lines to Take With · manifested lines · Parcel Only ·
route capacity.
**Kit types** — **hard** *(components locked to the master's fulfillment)* · **soft** *(components move
freely across methods)*.
**Exception systems in the audit (4)** — cost exceptions · landed add-on distribution ·
special-order price variance · **trade discount exceptions**.

---

## G. Sequencing rules

1. Price resolves down the hierarchy until a value is found; **no value is a valid outcome**.
2. Customer matrix and markdown are then applied on a lowest-wins basis, with two hierarchy levels
   immune to the matrix.
3. The primary discount is set by entry order, or by best-value when the optimal setting is on; it then
   determines the base for every other discount on the line.
4. A discount code applied **before** a unit price change is removed by that change *(batch 1)*.
5. Adding a designer to an existing order forces a per-line trade pricing review; removing one does not.
6. Raising a maximum trade discount writes an exception record reportable at End-of-Day.
7. Every line must belong to a fulfillment; empty fulfillments are deleted on save.
8. A partial quantity cannot go to a second fulfillment — **split the line instead**.
9. Moving lines to or from a printed fulfillment flags it for reprinting.
10. As-is spiff is awarded from the table in force **at completion**, not at sale.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Sales Discount Settings`** — governs override behaviour, qualifying formations, reason-code
  restrictions on as-is discounts, and quote start dates. Referenced from both batches; unread.
- **`Price/Spiff/Commission Table`** and the **`Pricing Level table`** — two pricing objects that
  override customer matrices, neither documented in this section.
- `Customer Price Settings` · `Warehouse Inventory Settings` · `District and Regional Product Settings`.
- **`Report Sales Exceptions`** — the destination for trade discount exceptions, and probably for the
  price variance exceptions of batch 1. **Reading it would connect the section's exception systems.**
- `Trade Designer Information` — the screen driving the trade cascade.
- **`Inventory Formation`** — now in four roles across two batches (protection plans, alternate stock
  location, discount eligibility, and as a `Formation Total`), still never defined.

**Documented but ambiguous**
- **`Twilight Discount Pricing`** — named as a priority-1 as-is price type; nothing says what it is.
- **`Substitution Code` / `Substitute Product`** — a product substitution mechanism appearing once.
- **`Line Type`** and **`Product Type`** — two more unenumerated classifications on the line.
- **`Fill Days`** on the line — related to run 2's `auto-fill days`, still undefined.
- **`Unit Conversion`** — implies selling in a different unit from stocking; nothing describes it.
- **Whether three special-order options is a model limit or a display limit** (the clone grid, the PO
  report, and Special Order Entry all show three).
- **What `Formation Total` / `Minimum Required` compare against** — quantity, value, or both.
- Whether the **unlabelled `New Selling Price`** on the trade screen is stored or purely display.
- Whether a **line split** preserves the original line's discount codes and reservation.

**Inferences (not in section B)**
- `Twilight Discount Pricing` is plausibly an end-of-life clearance price checked ahead of general
  as-is; the article gives only its priority.
- `Formation Total` / `Minimum Required` presumably implement threshold promotions ("spend X in this
  formation"); not stated.
- The pricing hierarchy's silence about which level won is inferred from its absence in the line
  detail field list, not from a statement.

---

## I. Unknown unknowns

- **A seven-level pricing hierarchy** with one file at two priorities and a setting that reorders it.
- **Two independent lowest-wins overlays** (customer matrix, markdown) with different exemptions.
- **One table supplying price, spiff and commission together.**
- **A "primary" discount whose base retroactively governs every other discount on the line** — and a
  setting that changes which one is primary.
- **Threshold discounts computed across the order against an Inventory Formation.**
- **A trade/designer pricing regime** with a permissioned per-line cap and an EOD exception report.
- **Adding a designer walking every line; removing one not.**
- **Seven quantity fields on a single sales order line.**
- **Hard kit components locked to a fulfillment while soft kit components move freely.**
- **Split-the-line as the only route to partial fulfilment.**
- **Configurator clones keeping prices; special-order clones deliberately not.**
- **As-is spiff fixed at completion, from the table in force that day.**
- **`Substitution Code` / `Substitute Product`** — an undocumented substitution mechanism.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Pricing hierarchy | Seven-level fall-through resolving a line's default selling price |
| Twilight Discount Pricing | Highest-priority as-is price type; otherwise undocumented |
| Price/Spiff/Commission Table | Table supplying price by category, plus spiff and commission |
| Customer price matrix | Per-customer/product price; applied when lower, with two exemptions |
| Markdown price | Applied unless the default price is lower; settable from three places |
| Primary discount | The discount whose base (SRP or STANDARD) governs all others on the line |
| SRP vs STANDARD | Discounts against suggested retail vs standard selling price |
| Formation Total / Minimum Required | Threshold test for discount eligibility across an order |
| Trade / designer sale | Separate pricing regime stacking regular and trade discounts |
| Maximum Trade Discount | Per-line cap; raising it writes an EOD exception record |
| Hard kit / soft kit | Components locked to the master's fulfillment vs freely movable |
| Split Merchandise Lines | The only way to fulfil part of a line quantity separately |
| Substitution Code / Substitute Product | Undocumented product substitution fields |

---

## Contract adjudication — batch 2

| Contract | Verdict | Basis |
|---|---|---|
| **W-061** | **CONFIRMED, extended to price** | A seven-level price hierarchy with no provenance on the result; one table sets price, spiff and commission together (F15, F24) |
| **W-042** | **relevant** | The line detail carries `Purchase Order`, `Open Purchase Order Quantity` and `Ship Quantity` read from the PO (F20) |
| **W-055 / W-056** | **extended** | Unreservable lines cannot move to Take With; manifested lines cannot move at all (F21) |
| **W-050** | **consistent** | Trade discount cap and line discounts both permissioned, with override (F19) |
| **W-052 / W-053** | **not documented in this batch** | Pricing and discounting articles state no GL effects |

---

## Next — batch 3: fulfillments, delivery dates, scheduling and routes
