# Run 03 — Sales Processing — Batch 1: Sales Order Entry Core

**Status: complete.** 10 articles. Findings 1–14.

**This batch closes the run's oldest open question.** `CWC` — which appeared across four run-2 batches
as an order class, a delivery status and a status code without ever being expanded — is defined here.
See Finding 4.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Enter a Sales Order** | /articles/15201409256084 | EXTRACTED — **the largest article in the audit so far** |
| 2 | **Order Completion Process** | /articles/15201389991700 | EXTRACTED |
| 3 | Order Completion Details | /articles/15201512788628 | EXTRACTED |
| 4 | Order Completion Exceptions | /articles/15201512789012 | EXTRACTED |
| 5 | **Sales Tax Processing Overview** | /articles/15201390345364 | EXTRACTED — five-step jurisdiction algorithm |
| 6 | **Order Tax Information** | /articles/15201408810132 | EXTRACTED |
| 7 | Totals | /articles/15201408342164 | EXTRACTED — thin |
| 8 | Additional Order Detail | /articles/15201408473492 | EXTRACTED |
| 9 | **Adjust the Net Total** | /articles/15201388920980 | EXTRACTED |
| 10 | Access Control Window | /articles/15201388920596 | EXTRACTED |
| 11 | Order Source Entry | /articles/15201389991828 | EXTRACTED — thin |
| 12 | Mandatory Order Comments | /articles/15201409432212 | EXTRACTED |

Discovered and queued: `Point of Sale Control Settings` *(referenced ~30 times in one article)* ·
`Create a User/Group Actions - Sales Security` · `Logistics Security` · `System Security` ·
`Warehouse/Store Location Settings` · `Sales Tax Settings` · `Sales Discount Settings` ·
`Advanced Customer Settings` · `Protection Plan Settings` / `Protection Plans Overview` ·
`Multiple Concurrent Fulfillments Overview` · `Delivery Processing Overview` ·
`Alternate Tax Interface Overview` · `Stock Reservation Settings` · `Credit Hold Codes List (AR)` ·
`Mandatory Order Comments Settings` · `Third Party Logistics Settings` · `Membership Reward Settings` ·
`Logistical Route Settings` · `Delivery Company Settings` · `Inventory Selection Screen` ·
`Pieces Not Completed Detail` · `Completion Date Entry` · `Document Detail Screen` ·
`Route Exception file` · `Alternate Taxable Merchandise Calculation`.

---

## B. Wiring findings

### FINDING 1 — A sales order is a four-step wizard whose steps are gated in sequence
Invariant (verbatim): "Page Headings: **Step 1 - Customer, Step 2 - Merchandise, Step 3 - Fulfillment,
            Step 4 - Payment**"
Gates:      "you must enter some basic information on the Customer page before you can access this
            page" *(Merchandise)* · "This page is not available until the **Customer Number** on the
            Customer page has been entered." *(Fulfillment)*
Scope:      "create new sales orders; edit, view, or delete open sales orders; **create a sales quote
            (Order Type field) and convert existing quotes to sales orders**; convert **shopping
            carts**… to sales orders; create **layaway orders** (via the Order Type field) and convert
            existing layaways to sales orders."
Finalisation: "Use this page to establish payment and **finalize the sales order. The order is
            finalized once `Save` is clicked.**"
Evidence:   Enter a Sales Order, /articles/15201409256084
Maps to:    **NEW**

> One routine covers **five document types** — sales order, quote, layaway, shopping cart conversion,
> and the order itself — distinguished by an `Order Type` field, with documented conversions between
> them. That is the shape run 2 kept bumping into from the purchasing side: `Layaway` and quote appear
> as separate counted classes on the buyer's worksheet (run 2 F75) and in the availability formulas,
> and here is why — **they are the same record in different states.** The conversions matter for
> reservation: run 2 found layaway optionally netted out of Net PO, and Finding 8 below shows quote →
> layaway → order conversions each re-evaluate reservation.

### FINDING 2 — Nine line status codes, and one of them silently suppresses shipment
Invariant (verbatim, complete): "**`A` – As Is · `C` – Linked to a COM · `H` – Line on Hold — items on
            hold are not shipped, regardless of reservation or assignment. For example, if there are 5
            items on an order but 3 are on Hold, no more than 2 (order quantity minus hold quantity)
            are shipped. · `L` – Line-item comments exist · `P` – Linked to a PO · `S` – Linked to an
            open service order · `T` – Linked to a transfer · `U` – Unscheduled… · `W` – Linked
            warranty**"
Invariant:  "**Any one or a combination of the following can appear in the Status field**"
Evidence:   Enter a Sales Order, /articles/15201409256084
Maps to:    **NEW — and it is the sales-side mirror of run 2's PO linkage findings**

> A **composite, multi-valued status** — not an enum. Five of the nine (`C`, `P`, `S`, `T`, `W`) are
> *link* indicators to other documents, which makes the sales order line the hub the whole system
> hangs off: COM purchase orders (run 2 F136), stock POs (run 2 F50), service orders, transfers and
> warranties all attach here.
>
> **`H` is the finding.** A line-level hold suppresses shipment *partially* — three of five held means
> two ship — and it operates **regardless of reservation or assignment**, so stock can be reserved,
> assigned, on a manifest, and still not go. That is a fourth hold concept after run 2's eight PO hold
> sources and the unexplained `approval hold`; nothing so far connects them.

### FINDING 3 — Reservation is evaluated at four specific moments, and insufficiency blocks the sale outright
Invariant:  "If a merchandise line contains a product that has the **Product or Vendor setting `Require
            Reservation`** enabled, that merchandise line reserves. **If the product does not have
            `Require Reservation` enabled, that setting is evaluated for the vendor.**"
Invariant:  "If the setting **`Reservation Date` in `Inventory Control Settings` is set to `Delivery
            Date Within Auto Fill Days`, products are immediately reserved. Products with `Required
            Reservation` always reserve even when the delivery date is outside Auto Fill Days.**"
Invariant:  "**If there is insufficient merchandise to fulfill the quantity entered on the sales order
            line, you are not allowed to add the product to the sales order.**"
Four evaluation points (verbatim): "Lines are evaluated for reservation if: **a new or existing line
            item is saved on the merchandise tab; a quote or a layaway that does not reserve is
            converted to a sales order; a quote is converted to a layaway when `Fill Layaways` is
            enabled** in Point of Sale Control Settings."
Rejection:  "**Product on this line must fully reserve and there is not enough quantity available to
            reserve the line.**"
Evidence:   Enter a Sales Order, /articles/15201409256084
Maps to:    **W-055 / W-056 — CONFIRMED from the demand side**

> Run 2 found reservation as an End-of-Day process producing a fill list (run 2 F95). This is the
> other half: **reservation can also be forced at line entry**, by a product-or-vendor flag that falls
> through product → vendor. When `Require Reservation` is set, **an unfillable line cannot be added at
> all** — the sale is blocked, not back-ordered. That is a hard commercial behaviour: for those
> products STORIS will not let a salesperson sell what isn't there.
>
> Note the fall-through is two-level and *implicit*: the vendor setting only applies when the product's
> is off. And conversions re-evaluate, so **a quote that could be written may fail to become an order.**

### FINDING 4 — `CWC` is **Customer Will Call**, and it is a fulfillment status alongside ASAP
Invariant (verbatim): "able to create a **single Customer Will Call** and a **single As Soon As
            Possible** fulfillment per method, even if dated fulfillments (**Estimated** or
            **Scheduled**) exist for the same method"
Invariant:  "Orders that only have **`ASAP` or `CWC` fulfillments** are reviewed last as each
            fulfillment is considered '**unscheduled**'. If an order only has these fulfillments, **the
            date and time used to create the CWC or ASAP fulfillment** will be used to determine the
            earliest delivery fulfillment it can be added to."
Fulfillment display order (verbatim): "**Delivery, Customer Pickup, Direct Ship, Take With**"
Evidence:   Enter a Sales Order, /articles/15201409256084
Maps to:    **closes a question open since run 2 batch 1**

> **`CWC` = Customer Will Call.** It ran through four run-2 batches — in the `NET AVAIL` unreserved
> definition (run 2 F17), as a counted order class on the buyer's worksheet (F75), as a delivery status
> excluded from jeopardy (F99), and in the status-code enumeration (F112) — and was never once
> expanded in the Merchandising documentation. It is defined here, in one clause, in Sales Processing.
>
> The substantive point: **`CWC` and `ASAP` are "unscheduled" by construction** — they carry no date,
> only a creation timestamp. That is *why* run 2 found them excluded from jeopardy reporting, from the
> weekly projection, and from automatic allocation. It was never that they are unimportant; **they have
> no date to test against.** And STORIS permits exactly one of each per fulfillment method per order.

### FINDING 5 — Sales tax resolves through a five-step, three-location jurisdiction algorithm
Invariant, Step 1 (verbatim): the `Charge By` field in `Sales Tax Settings` for the **selling location's
            state** — options **`Not Applicable` · `Point of Sale` · `Ship From Location` ·
            `Point of Possession`**. "`Point of Sale`… **This setting overrides all other possibilities
            for calculating tax.**"
Step 2:     resolves `Charge By` against the **`Fulfillment Method`** (Customer Pickup, Delivery, Take
            With, Direct Ship) to pick the state. Under `Point of Possession`: Take With → selling
            store; Customer Pickup → **`Pickup Location`**; Delivery or Direct Ship → **`Deliver To`,
            falling back to the customer's default address**.
Step 3:     "**In State** - If **either one** of these comparisons produces a match" *(selling state vs
            possession state; ship-from state vs possession state)*.
Step 4B:    out-of-state tax is charged **only if `Tax Out of State Sales` is checked** for the state
            determined in step 2.
Step 5:     **three separate `Additional Tax Code` lookups** — on the zip codes of the selling
            location, the delivered-from location **and** the point-of-possession location — each
            independently subject to the out-of-state test.
Exception:  "**The `Selling Store Tax Exception` field… is active only when `Charge By` is set to
            `Point of Sale`.**… the state and local tax jurisdictions are assigned based on the zip
            code of where possession occurs… **regardless of whether or not the possession state is set
            to charge tax by Point of Possession.**"
Fallback:   "**If the assigned tax jurisdictions are NOT set to tax out of state sales… the system
            calculates $0.00 tax.**"
Evidence:   Sales Tax Processing Overview, /articles/15201390345364
Maps to:    **NEW — the most consequential single algorithm found in the audit**

> Three locations, four `Charge By` modes, four fulfillment methods, an in/out-of-state test that
> passes on *either* of two comparisons, and **three independent local-tax lookups**. Two things a
> rebuild must not get wrong. **Local taxes stack from up to three zip codes** — the sale can carry
> additional tax from where it was sold, where it shipped from, *and* where the customer took
> possession, simultaneously. And **`$0.00` is a legitimate computed outcome**, not an error, when the
> jurisdictions are not set to tax out-of-state sales — so a zero-tax order is indistinguishable from
> a misconfiguration without reading three settings files.
>
> The article opens by posing the NJ-store / PA-warehouse / NY-customer case as the motivating example.
> For a multi-state operation this algorithm *is* the compliance surface.

### FINDING 6 — Tax exemption exists at two levels, and Rent-to-Own overrides both
Customer level (verbatim): "the **`Tax Exemption ID`** and **`Tax Id Expiration Date`** fields are
            populated, and the **`Tax Expiration Date` field must be on or after the written date of
            the sale.**"
Line level: "use the **`Tax Exempt Authorization Number`** field in `Additional Line Item Details`."
Override:   "**Some Rent-to-Own financing plans qualify a sale to be tax exempt. This overrides the tax
            exempt settings in `Advanced Customer Settings`.**"
Validation point: "The customer's tax status is validated **in this field** *(the Customer Number
            field)*… **If this validation fails, tax is applied to the order.**"
ATI limit:  "**Line item level tax exemption is not compatible with ATI.**" ·
            "**Subtotal discounts cannot be used in conjunction with ATI.**"
Evidence:   Sales Tax Processing Overview, /articles/15201390345364;
            Order Tax Information, /articles/15201408810132
Maps to:    **NEW**

> Exemption is validated **at customer entry, against the written date** — so an expiring exemption
> silently starts charging tax on the day it lapses, mid-order-book, with no other signal. **A
> financing product (RTO) can override a tax setting**, which is a genuinely surprising coupling:
> credit terms changing tax treatment. And **an Alternate Tax Interface removes two capabilities** —
> line-level exemption and subtotal discounts — so turning on Avalara or Vertex is not a drop-in
> substitution; it changes what the sales floor can do.

### FINDING 7 — "Adjust the Net Total" is an out-the-door price that destroys all discount detail
Invariant:  "This discount is referred to as the '**Out The Door**' total… The process then
            **recalculates the merchandise amount** so that the order total including fees, charges,
            and taxes matches the entered total amount."
Invariant (verbatim, complete): "**1) All line item discount codes are removed and prices are reset to
            their original selling prices** (prior to the adjustment). **Manually entered price
            overrides are also reset. 2) All global discounts, coded and additional, are removed.
            3) Delivery and installation charges are retained at the current amounts.**"
Permission: `Change the Net Total on Sales Orders` in Sales Security, or a security override.
Evidence:   Adjust the Net Total, /articles/15201388920980
Maps to:    **NEW — and it is a reporting hazard**

> A salesperson negotiates one number and the system **back-solves the merchandise amount**, wiping
> every discount code and price override on the order to do it. The commercial logic is sound; the
> consequence is that **all discount attribution is destroyed.** Any report answering "which discounts
> did we give" or "what did this promotion cost us" is blind to out-the-door deals, because the codes
> that would have carried that information were removed. Delivery and installation survive, so the
> whole adjustment lands on merchandise margin.
>
> Run 2 found six gross-profit percentages on the buyer's worksheet (run 2 F74) and margin computed
> against cost bases that exclude landed cost (F110). **Out-the-door pricing sits on top of that**, and
> the two together mean reported product margin can be wrong in both directions with no trace.

### FINDING 8 — Order completion is a five-precondition release, and direct ship creates an AP bill
Preconditions (verbatim, complete): "Before releasing a fulfillment for completion, the system checks
            that the following are true: **- A scheduled delivery/pickup date exists on the
            fulfillment. - Merchandise is reserved to the order. - No credit holds exist for the
            transaction. - A delivery/pickup ticket has been printed or a pick list printed and a pack
            list processed.**"
Direct ship (verbatim): "**Once you complete the direct-ship portion of a sale, the system creates an
            AP bill for the direct ship PO and marks it as closed.**"
Blocking:   "**You cannot complete direct-ship orders that contain a linked PO on hold.** For
            split-ticket orders containing direct-ship items, you cannot complete the direct-ship items
            if any one of them contains a linked PO on hold."
Partial:    "**A completed order is created for the fulfillment** with the completed lines reserved and
            the other lines unreserved. **All other fulfillments are moved with the completed order and
            none of their lines are reserved.** This way, the entire order's details are together. **The
            completed order only contains information on the completed fulfillment.**"
Status:     "The status of partially completed delivery and pickup fulfillments is determined by the
            **`Status After Partial Completion`** fields on the Logistics page of Point of Sale Control
            Settings."
Evidence:   Order Completion Process, /articles/15201389991700
Maps to:    **W-052 / W-053 — the first sales-side GL-adjacent statement; W-006 — CONFIRMED**

> **Completing a sale creates an accounts payable bill.** That is the sharpest cross-module wiring in
> the batch and it settles the direct-ship loop run 2 opened: run 2 F63 found direct-ship conversion
> blocked by a *pending AP bill*; this is where that bill comes from. A customer taking delivery is
> what makes us owe the vendor.
>
> The four preconditions are a hard gate and three of them live outside sales: **reservation**
> (Inventory), **no credit holds** (Receivables), and **a printed ticket or processed pack list**
> (Logistics). And run 2's finding that a PO on hold blocks things has a sales-side twin: **one held PO
> on a split ticket blocks every direct-ship line on it.**
>
> The partial-completion behaviour is unusual and worth stating plainly: **the completed order becomes
> the container for the whole order's details**, carrying the other fulfillments with it while leaving
> them unreserved. That is a document-splitting model, not a status change.

### FINDING 9 — Back orders are capped at 52 and suffixed alphabetically
Invariant (verbatim): "**The maximum amount of back orders permitted within `Enter a Sales Order` is
            fifty-two (52). Each partial back order includes a letter, 'A' through 'Z' and 'a' through
            'z' which will be attached to the root invoice. A warning message is displayed once the
            back order counter reaches the 48th and 52nd invoice. Any invoice entered after the 52nd
            must [be] deleted and reentered.**"
Evidence:   Enter a Sales Order, /articles/15201409256084
Maps to:    **NEW**

> A hard structural limit derived from the alphabet — **26 upper plus 26 lower case suffixes on the
> root invoice number** — with warnings at 48 and 52 and no recovery beyond it. That is a data-model
> constraint leaking into business capability, and it is exactly the kind of thing that is invisible
> until a heavily back-ordered special-order sale hits it. For the rebuild: the invoice numbering
> scheme should not encode the sequence in a character.

### FINDING 10 — Two credit hold codes are named, and one is triggered by driver-licence mismatch
Invariant:  "**When a revolving receivables financing payment code is applied to a sales order (new or
            existing) or an exchange, for the first time, the `Driver License Verification` process is
            displayed.** If the **`Verify Customer Driver License`** setting in `Advanced Receivables
            Control Setting` is checked, verification is performed… **If validation fails, the order is
            placed on `F5` Credit Hold.**"
Invariant:  "**The credit hold `C6` means that a decision is pending and has to be reviewed by the
            credit department.** The sales order and the associated credit request are shown in the
            process `Review Pending Credit Requests`. **The `C6` hold remains until the credit request
            has been approved and a credit limit established.**"
Also:       "If no credit line has been established, the message, '**A credit line must be established
            before financing can be added**'… If there is a credit line but it has expired, either the
            message, '**Credit Report required**' or '**Credit application requires update**'… **the
            sales order is placed on hold, and a new credit request must be made.**"
Evidence:   Enter a Sales Order, /articles/15201409256084
Maps to:    **W-050 / run 1's 22 AR credit hold codes (C1–T1) — two now bound to sales events**

> Run 1 catalogued 22 AR credit hold codes without saying what sets them. **Two are bound here to
> specific sales-order events**: `F5` on a failed driver-licence match, `C6` on a pending credit
> decision. Both are set *by applying a payment type* — so choosing revolving financing on the payment
> page can put the order on hold and stop completion (Finding 8's third precondition). Identity
> verification failing a customer is a compliance-relevant behaviour worth flagging alongside run 1's
> four items.

### FINDING 11 — Alternate stock location resolution picks the earliest ATP date, then falls to a tiebreak list
Invariant (verbatim): "If a line should be assigned to an alternate stock location and **there is only
            one** alternate stock location, this is used as the stock location and **a transfer from
            this to the fulfillment location is created**. **If there are multiple alternate stock
            locations, the location with the earliest ATP date is chosen. If more than one location has
            the earliest ATP date, STORIS looks at the locations set in the `Multiple Location
            Selection` process** to choose the location to use."
Four conditions (verbatim): `Use Alternate Stock Location` checked · "a line has been **initially
            entered**" · "**the line does not reserve**" · "the line's Stock Location has at least one
            alternate stock location assigned"
Exclusion:  "the **`Formation-Exclude from Alternate Stock Location`** in `Warehouse/Store Location
            Settings` is evaluated. If the product on the merchandise line belongs to the excluded
            inventory formation, the Alternate Stock Location setting is not applied."
Related:    "**`Prefer Incoming Purchase Orders Before Stock Location Schema`**… determines if incoming
            purchase orders are better suited to fill an order line **instead of** the Stock Location
            Schema or Alternate Stock Location logic."
Evidence:   Enter a Sales Order, /articles/15201409256084
Maps to:    **W-055 / W-056 — extended; and it consumes run 2's ATP**

> Sourcing a line is a **three-way contest**: the line's own stock location, an alternate stock
> location (chosen by earliest ATP, tiebroken by a configured list), or an incoming purchase order —
> with a control setting deciding whether POs win. Run 2 found ATP as a promising engine; here it is
> **being used as a sourcing decision function**, not just a date display. And **choosing an alternate
> location silently creates a transfer**, so a sales decision generates a logistics document.
>
> `Inventory Formation` appears for the first time in the audit and is used as an exclusion axis.

### FINDING 12 — Protection plans are auto-attached by a documented three-step selection with a best-plan tiebreak
Three steps (verbatim): "**1. Protection Plan Qualification** — … **Only plans based on assigned
            Inventory Formations qualify.** **2. Protection Plan Selection** — All qualified protection
            plans are presented… **multiple plans may be selected.** **3. Protection Plan Product
            Selection** — … select individual products (from the order) and link to the selected
            protection plan(s)."
Skip:       "**Steps 2 and 3 are skipped if `Automatically Add to Order` is enabled**"
Best-plan rule (verbatim): "**Qualified plans that cover the most eligible lines are always chosen
            first.**… If more than one plan has the same number of eligible lines, the best plan that
            meets the **`Maximum Quantity` and `Minimum/Maximum Subtotal`** in Protection Plan Settings
            are evaluated. Once evaluated, the **`Automatic Add Merchandise Overlap`** setting… is
            reviewed to determine the best plan."
Limit:      "**Protection Plans may not be added to a completed sales order through this process.**"
Evidence:   Enter a Sales Order, /articles/15201409256084
Maps to:    **NEW**

> An **automated upsell with a documented optimisation rule** — maximise covered lines, then apply
> quantity and subtotal bounds, then an overlap setting. Two consequences. It is **attach-rate
> machinery the business almost certainly relies on**, and its behaviour is entirely configuration.
> And **modifying merchandise on a new order prompts to clear and refresh plans**, so plans are
> derived state, not entered state — anything we build must recompute rather than store.

### FINDING 13 — Special-order price variance is checked through a three-level percentage fall-through
Invariant:  "The **base price** of a special order product is that set in Advanced Product Settings,
            **plus (+) upcharges for special order options.**"
Three no-base cases (verbatim, abridged): auto/user-priced without a base → "unit price that is **the
            sum of the option upcharges**"; without base and without priced options → "**the user must
            enter a price**"; special-order as-is → price from the `Unit Price` prompt.
Variance fall-through (verbatim): "If there is a value in the **`Variance %` setting in `Advanced
            Product Settings`**, this percentage is used… If this field does not have a value, the
            **`Special-Order Variance %` in `Warehouse/Store Location Settings`** is used… if there is
            no value [there], the **`Special-Order Variance %` setting in `Point of Sale Control
            Settings`** is used. **If all three of these are blank, no variance price check takes
            place.**"
Formula (verbatim): "the discounted price is subtracted from the original selling price, yielding the
            amount discounted. The discounted amount is **divided by the original selling price**,
            yielding the percentage discounted… If this percentage is **greater than** the Special-Order
            Variance %, there is a **price variance exception**."
Outcomes:   **`Variance Exceeded Alert`**, **`Reason Required`**, or **`Comment Required`**
Skip:       "If there is a discount code on a line, this code will be checked to **see if it should skip
            the variance check.**"
Evidence:   Enter a Sales Order, /articles/15201409256084
Maps to:    **W-061 — relevant; and a third variance mechanism in the audit**

> The audit has now found **three separate variance systems**, none of which meet: the **cost exception
> queue** (receipt vs AP bill, run 2 F29), the **landed add-on distribution analysis** (estimate vs
> actual, run 2 F40), and now **special-order price variance** (original vs discounted selling price).
> This third one is a *selling*-price control, and like the others it terminates in a human prompt
> rather than a posting. **If all three settings are blank the check silently does not happen** — a
> fourth instance of the run-2 pattern where an unconfigured threshold means no control at all.

### FINDING 14 — Order changes are audited only when a setting forces a comment
Invariant:  "This screen appears when an existing order is changed and then saved, and when the
            **`Require Comments When a Sales Order is Changed`** setting in Point of Sale Control
            Settings is enabled. When this screen appears, **you are required to select at least one of
            the available comments before the order can be saved**… **Comments are added to the Audit
            Comments Log.**"
Invariant:  "If the **`Manual Required`** checkbox in the `Mandatory Order Comments Settings` process is
            enabled, **manual comments must also be entered.**"
Exclusion:  "**This process is not invoked when converting orders to or from layaways and quotes.**"
Also:       "Changes made to fulfillments **are audited**." *(Enter a Sales Order, Step 3)*
Override log: "**The system notes the user who authorizes each security override.**" *(Access Control
            Window)* · three attempts, then return to the previous screen.
Evidence:   Mandatory Order Comments, /articles/15201409432212; Enter a Sales Order,
            /articles/15201409256084; Access Control Window, /articles/15201388920596
Maps to:    **extends the audit-switch family to six**

> Run 1 found four opt-in audit switches; run 2 added `Track Processing Activity` as a fifth. **This is
> a sixth**: `Require Comments When a Sales Order is Changed`, feeding an `Audit Comments Log`. As with
> the others, **history is reconstructable only if someone turned it on** — and here there is a
> documented blind spot even when it is on: **conversions to and from layaways and quotes are exempt.**
> A quote silently becoming an order leaves no mandatory comment.
>
> Two things that *are* always audited, without a switch: **fulfillment changes**, and **who authorised
> each security override.** The override log is the more valuable of the two for reconstructing what
> happened on a contested order.

---

## C. Screen and field inventory

**Enter a Sales Order** — header: `Order Number` · `Last Order` · **`Available Credit`** ·
**`Credit Hold`** · **`Reward Points`** · **`Reward Balance`**.
*Step 1 – Customer*: `Order Type` · `Date` · `Salesperson` · **`Fulfillment Method`** · `Store` ·
Customer Number / Last Name / Email / Phone Number · Primary Name · Home/Cell/Work Phone · Extension ·
**`Alternate Name`, `Relationship`** · Primary Email · Address 1/2 · City · State · Zip Code ·
**`Marketing Code 1`, `Marketing Code 2`**.
*Step 2 – Merchandise*: Product · Quantity Ordered · **Quantity Available** · Unit Price ·
Extended Price · **Discount Code** · Discount Amount · Fulfillment Method · Brand · **Stock Location** ·
**Purchase Order Number** · **As-Is** · **Special Order** · **Serial/Reference #** · **Room** ·
**Available to Customer Date** · **Available to Promise Date** · Add Item · Save + Add Another · Save ·
Cancel.
*Line Item Display*: Product · Description · Fulfillment Method · **Status** · Quantity Ordered ·
Quantity Reserved · Discount Code · Discount Amount · Unit Price · Extended Price.
*More expander*: Second Description · Vendor Model Number · Special Order Information · Fulfillment
Date · ATP/ATC Date · Brand · **Quantity Assigned** · Purchase Order Number · Regular Selling Price ·
Suggested Retail Price · **Extended Suggested Retail Price** · Room.
*Step 3 – Fulfillment*: Date · **Earliest Available** · Status · **Fulfillment Location** ·
Fulfillment Method · Requested · Time · **Handling Method** · Instructions for this Fulfillment Only ·
Print Delivery Instructions for this Delivery Address · Print Ticket · **Complete** · Totals · Lines ·
Deliver To block · **Total Fulfillments** · New · Delete.
*Step 4 – Payment*: Coupon ID · Discount Code · Discount Amount · **Discount %** · Delivery Charge ·
Installation Charge · Miscellaneous Fees · Sales Tax · **Protection Plan Code** · Payment Type Code ·
Total Deposit Amount · Payment Type Code *(financing)* · Total Financed Amount · **Signature** ·
Sales Order Document · Merchandise Subtotal · Protection Plans · Discounts · Charges and Fees ·
Net Total · Payments · Balance Due · **Order Outstanding Balance** · **Customer Current Balance**.

**Order Completion Details** — Order Number/Document/Transfer · Customer Name · From/To Location ·
**`Status for ALL Lines`** · Complete · Not Complete · **`Not Completed Lines`** · Details ·
`New Transfer Date` · `New Service Date` · **`Reschedule for`** · `Rescheduled Date` · grid · Actions.

**Order Tax Information** — `Charge Sales Tax` · **`Charge National Sales Tax`** · `Tax ID` ·
`Expiration Date` · *(exchange only)* Sale / Return / Net · `Fulfillment` · `Taxable Subtotal` ·
`Fulfillment Tax Detail` · **`Add Additional Tax`** · Jurisdiction · Amount · `Tax Jurisdiction Code` ·
`Tax Type` · Percent · Amount · Total · **`Zero Tax Amount`** · Remove. Rows sorted **national → state
→ local**.

**Totals** — Merchandise Subtotal · Discounts · Delivery Charge · Installation Charge · Miscellaneous
Fees · Sales Tax · Net Total. *(per fulfillment)*

**Additional Order Detail** — `Customer's PO` · **`Builder's Allowance`** · Truck · Ship Via ·
Delivery To · Time · **`Delivery Postponements While Reserved` · `Total Delivery Postponements` ·
`Pickup Postponements While Reserved` · `Total Pickup Postponements`** *(all read-only)* · `Terms` ·
`Due Day` · **`Commission Category`** · **`Deposit Hold Back`** · `Classification` · `Price Category` ·
**`Maximum Finance Approval`**.

**Adjust the Net Total** — Current Net Total · New Net Total.

**Access Control Window** — Security Requirement · **Authorized Action** · User ID · Password.
Three attempts.

**Order Source Entry** — Order Source · Save.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `Point of Sale User Verification` | POS Control Settings → Advanced | **Re-authentication to create or update an order** |
| `Prohibit Unscheduled Lines` | POS Control Settings → Logistics/Other | Manager credentials to save unscheduled lines |
| `Change Fulfillment Status to SCH with a Balance Due` | POS Control Settings → Logistics + Logistics Security | Scheduling with money outstanding |
| `Order Source Required in Enter a Sales Order` | POS Control Settings | Blocks save without a source |
| `Require Comments When a Sales Order is Changed` | POS Control Settings | **Sixth audit switch**; feeds the Audit Comments Log |
| `Require Additional Comment on Sales Order` | POS Control Settings → General | Prompts on the payment page |
| `Use Alternate Stock Location` · `Prefer Incoming Purchase Orders Before Stock Location Schema` | POS Control Settings | Line sourcing contest |
| `Auto Transfer Warning` · `Prohibit changes to lines once an associated auto-transfer has been manifested` · `Continue to prohibit changes after auto-transfer has been completed` | POS Control Settings | Auto-transfer change gates |
| `Automatically Add to Order` · `Prompt to Add to Order` · `Automatic Add Merchandise Overlap` | POS Control Settings | Protection plan attachment |
| `Automatically Apply Discounts Using Membership Discount Schedule` | POS Control Settings | Membership auto-discounting |
| `DISCOUNTS - Apply Discount Codes to Individual Line Items` | POS Control Settings | Line-level discount capability |
| `Special-Order Variance %` | POS Control Settings **and** Warehouse/Store Location Settings **and** `Variance %` in Advanced Product Settings | **Three-level fall-through; all blank ⇒ no check** |
| `ATP CALCULATION - Include New Purchase Orders / Stock Transfers / Unlinked Purchase Orders` | POS Control Settings | **All unchecked ⇒ no ATP, and no ATP comments logged** |
| `DELIVERY DATES - Consolidate Multiple Orders` | POS Control Settings | Prompts to reuse another order's date |
| `One Delivery Charge Per Order` · `Automatically Move Delivery Charge to 1st Planned Fulfillment` | POS Control Settings | Delivery charge relocation on save |
| `Require Phone Number for Delivery, Pickup, and Direct Ship` · `Confirm Address on Orders and Exchanges` | POS Control Settings | Contact validation on save |
| `Restrict Scheduled Date` | POS Control Settings + Warehouse/Store Location Settings | Scheduling window, override-able |
| `Status After Partial Completion` · `Initial Entry Default Status - Pickup` | POS Control Settings → Logistics | Fulfillment status after partial completion |
| `Route Exception` | POS Control Settings | Whether manifest exceptions are written to the Route Exception file |
| `Fill Layaways` | POS Control Settings | Whether quote→layaway conversion reserves |
| `Charge By` · `Tax Out of State Sales` · `Selling Store Tax Exception` · `Tax Rate` · `Additional Tax Code` | **Sales Tax Settings** / Zip Code records | **The whole tax jurisdiction algorithm** |
| `Reservation Date` = `Delivery Date Within Auto Fill Days` | Inventory Control Settings | Immediate vs windowed reservation |
| `Require Reservation` | Advanced Product Settings **then** Vendor | Line must fully reserve or cannot be added |
| `Formation-Exclude from Alternate Stock Location` · `Alternate Stock Location` | Warehouse/Store Location Settings | Alternate sourcing eligibility |
| `Prohibit Customer Personal Information when not Required by Sale` | Warehouse/Store Location Settings | Availability of Step 1 basic fields |
| `Sales Order Linkage` / `Sales Order Linkage Access` | **Purchasing Control Settings** | Whether the PO Reservations process appears (`Manually` / `Automatically`) |
| `Verify Customer Driver License` | **Advanced Receivables Control Settings** | **Failure ⇒ `F5` credit hold** |
| `Credit Requests - Need to exist prior to entering an order` | (finance) | Whether financing can be entered pre-approval |
| `Minimum Delivery Purchase` | **Delivery Company Settings** | Checked on save; blocks the order |
| `Manual Required` | Mandatory Order Comments Settings | Forces free-text as well as coded comments |
| Reputation Management Interface licence | General System Control Settings → Licensing | **Podium / STORIS RMI (Birdeye, Drive Social, Swell)** records written on order save |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| `Delete/Add line items on transactions with deposits applied` | Sales Security | Editing lines on deposited/financed orders |
| `Delete a Stock Merchandise Line Item Linked to a Purchase Order not on Hold` | Sales Security | Deleting linked stock lines |
| `Sell kit component products separately from their assigned kit` | Sales Security | Selling kit components loose |
| `Access sales order line discounts` | Sales Security | Line-level discount entry |
| **`Change the Net Total on Sales Orders`** | Sales Security | Out-the-door pricing |
| `Edit the calculated sales tax amount on open transactions` | Sales Security | Fulfillment tax detail editing |
| `Change Order Fulfillments with a Status of Scheduled` | Sales Security | Editing scheduled fulfillments |
| `Create multiple fulfillments for a method` | Sales Security | Adding lines to a new fulfillment |
| `Manually Link Purchase Orders on Sales Orders and Exchanges` | Sales Security | Whether PO Reservations appears |
| completion clearance **by order type** | Sales Security | Completing a fulfillment |
| `Change Taxable Settings` | **System Security** | Charge Sales Tax / National / Tax ID / Expiration |
| `Override capacities when scheduling routes that are full` | Logistics Security | Route capacity override |
| `Adjust inventory for locations when WMS is active` | Logistics Security | Completion at a WMS location |
| `Override System Calculated Delivery Charges` | Sales Security | Minimum delivery purchase failure |
| **Access Control Window** | User / User Group | Generic override; **logs the authorising user**; three attempts |

---

## F. State machines and enumerations

**Order types** — sales order · **quote** · **layaway** · shopping cart *(converts in)*; conversions
documented in both directions between quote, layaway and order.
**Fulfillment methods** — **Delivery · Customer Pickup · Direct Ship · Take With** *(display order)*.
**Fulfillment statuses** — **Estimated · Scheduled · `CWC` (Customer Will Call) · `ASAP` (As Soon As
Possible)**; CWC and ASAP are **unscheduled by construction** — one of each per method per order.
**Line status codes (composite, multi-valued)** — `A` As-Is · `C` COM-linked · **`H` Line on Hold
(suppresses shipment partially)** · `L` comments exist · `P` PO-linked · `S` service-order-linked ·
`T` transfer-linked · `U` unscheduled · `W` warranty-linked.
**`Charge By`** — `Not Applicable` · `Point of Sale` *(overrides all)* · `Ship From Location` ·
`Point of Possession`.
**Tax jurisdiction order** — national → state → local.
**Credit holds named here** — **`F5`** *(driver-licence validation failure)* · **`C6`** *(credit
decision pending; cleared only by approval + credit limit)*.
**Product purchase statuses referenced from sales** — **`D` dropped · `T` discontinued** *(first time
the letter codes appear; run 2 had only the words)*.
**Back order suffixes** — `A`–`Z`, `a`–`z`; **hard cap 52**; warnings at 48 and 52.
**Price variance outcomes** — `Variance Exceeded Alert` · `Reason Required` · `Comment Required`.
**Completion line statuses** — `Completed` *(default)* · `Not Complete` *(with Pieces Not Completed
Detail)*.
**RMI providers** — Podium · STORIS RMI (Birdeye, Drive Social, Swell).

---

## G. Sequencing rules

1. Customer information gates the Merchandise page; the Customer **Number** gates the Fulfillment page.
2. Reservation is evaluated on line save, on quote/layaway → order conversion, and on quote → layaway
   when `Fill Layaways` is on.
3. A `Require Reservation` line that cannot fully reserve **cannot be added to the order at all**.
4. Alternate stock location applies only on **initial** line entry, only when the line does not reserve.
5. Choosing an alternate stock location **creates a transfer**.
6. Route capacity is checked after each line is added; overriding needs Logistics Security.
7. Delivery charges are relocated to the first planned fulfillment **on save**, and may recalculate tax.
8. Protection plans re-qualify when merchandise changes; they cannot be added to a completed order.
9. Completion requires: scheduled date · reserved merchandise · **no credit holds** · printed ticket or
   processed pack list.
10. Completing a direct-ship portion **creates an AP bill and closes the PO**.
11. A held linked PO blocks direct-ship completion, including across a split ticket.
12. Partial completion moves all other fulfillments onto the completed order, unreserved.
13. Mandatory comments fire on save of a changed order — **except** layaway and quote conversions.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Point of Sale Control Settings`** — referenced roughly thirty times in `Enter a Sales Order`
  alone. **The single highest-priority unread article in the audit.** It is also outstanding from
  run 2 batches 3, 8 and 11.
- `Create a User/Group Actions - Sales Security` — fifteen permissions surfaced in one batch.
- `Multiple Concurrent Fulfillments Overview` · `Delivery Processing Overview` ·
  `Protection Plans Overview` · `Alternate Tax Interface Overview` · `Stock Reservation Settings`.
- **`Credit Hold Codes List (AR)`** — run 1 found 22 codes; this batch binds two to sales events.
  Reading it would connect the two runs.
- `Inventory Formation` — used as an exclusion and qualification axis; never defined.

**Documented but ambiguous**
- **What sets `H` (Line on Hold)** — the code is defined, the mechanism is not. It is a fourth hold
  concept after the eight PO hold sources and `approval hold`.
- **`Deposit Hold Back`** and **`Maximum Finance Approval`** on Additional Order Detail — named only,
  and both look consequential for cash and credit.
- **`Delivery Postponements While Reserved`** — a counted, read-only metric implying a postponement
  model nothing describes.
- **`Handling Method`** — on the fulfillment; carried forward from earlier work, still undefined.
- **`Commission Category`, `Classification`, `Price Category`** — three order-level classifications,
  none described.
- **Whether `Adjust the Net Total` is recorded anywhere** as having happened. The article describes
  what it destroys, not what it leaves behind.
- **`Zero Tax Amount`** on Order Tax Information — an action or a display?
- **`Earliest Available`** on the fulfillment page — presumably ATP-derived; not stated.
- The **`Auth/Capture`** feature and its "Pending Deposit" message for eSTORIS orders.
- `Builder's Allowance` and `Trade` pricing — a whole contract-sales dimension appearing only as fields.

**Inferences (not in section B)**
- `H` (Line on Hold) is plausibly related to credit holds, since credit holds block completion and `H`
  blocks shipment — but **no article connects them**, and this is mine.
- `Earliest Available` is presumably the ATP date surfaced on the fulfillment; not stated.
- The 52-back-order cap presumably reflects a single-character suffix in the invoice key; the article
  states the behaviour, not the cause.

---

## I. Unknown unknowns

- **`CWC` = Customer Will Call** — and that CWC/ASAP are *unscheduled by construction*, which explains
  four separate run-2 exclusions.
- **A line-level hold that suppresses shipment partially**, regardless of reservation or assignment.
- **Composite multi-valued line status** — five of nine codes are links to other documents.
- **Completing a direct-ship sale creates an AP bill and closes the purchase order.**
- **Three independent local-tax lookups** — selling, ship-from and possession zip codes all stack.
- **`$0.00` tax as a legitimate computed outcome.**
- **A Rent-to-Own financing plan overriding customer tax exemption settings.**
- **Out-the-door pricing that erases every discount code and price override on the order.**
- **A hard 52-back-order cap** encoded in alphabetic invoice suffixes.
- **A failed driver-licence match putting the order on credit hold `F5`.**
- **Alternate stock location chosen by earliest ATP date**, creating a transfer as a side effect.
- **Protection plan auto-attach with a documented best-plan optimisation.**
- **A third variance system** (special-order selling price) that also terminates in a human prompt.
- **Reputation-management records written on order save**, to up to two providers at once.
- **Partial completion splitting the document** and carrying other fulfillments onto the completed one.
- **Mandatory order comments exempting layaway and quote conversions.**

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| CWC | **Customer Will Call** — an unscheduled fulfillment status; one per method per order |
| ASAP | As Soon As Possible — the other unscheduled fulfillment status |
| Line status `H` | Line on hold; suppresses shipment for the held quantity only |
| Out The Door | `Adjust the Net Total` — back-solves merchandise price to a negotiated total |
| Charge By | Sales Tax Settings field selecting the tax basis: POS, ship-from, or possession |
| Selling Store Tax Exception | Point-of-Sale-only override reassigning jurisdictions to the possession zip |
| Inventory Formation | Grouping used to qualify protection plans and exclude alternate stock locations |
| Alternate Stock Location | Secondary source chosen by earliest ATP; creates a transfer |
| Require Reservation | Product-then-vendor flag; an unfillable line cannot be added |
| F5 / C6 | Credit holds for driver-licence failure and pending credit decision |
| Audit Comments Log | Where mandatory order-change comments are written |
| RMI | Reputation Management Interface — Podium, Birdeye, Drive Social, Swell |
| Deposit Hold Back / Maximum Finance Approval | Undescribed order-level credit and cash fields |

---

## Contract adjudication — batch 1

| Contract | Verdict | Basis |
|---|---|---|
| **W-006** | **CONFIRMED from the sales side** | Direct-ship completion creates the AP bill and closes the PO (F8) |
| **W-052 / W-053** | **PARTIALLY DOCUMENTED — first sales-side statement** | Completion creates an AP bill; no GL accounts named yet (F8) |
| **W-055 / W-056** | **CONFIRMED** | Reservation evaluated at four points; unfillable `Require Reservation` lines are blocked; ATP drives alternate sourcing (F3, F11) |
| **W-050** | **consistent** | Fifteen Sales Security permissions plus a logged override window (F14, section E) |
| **W-061** | **relevant** | Out-the-door pricing destroys discount attribution; special-order variance is a third variance system (F7, F13) |
| **W-012** | **relevant** | Tax exemption validated against the **written date** (F6) |

---

## Next — batch 2: line items, pricing, discounts and linked lines
