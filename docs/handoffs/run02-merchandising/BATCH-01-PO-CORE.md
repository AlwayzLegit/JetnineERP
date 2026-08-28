# Run 02 — Merchandising — Batch 1: Purchase Order Core

**Status: complete.** 16 articles. Supersedes `BATCH-01-PO-CORE-PARTIAL.md`.
Findings 1–11 were emitted before the browser dropped; 12–28 close the batch.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Enter a Purchase Order** | /articles/15202193113236 | EXTRACTED |
| 2 | Purchase Order Processing Screen | /articles/15203127979028 | EXTRACTED |
| 3 | Open Purchase Orders | /articles/15202207778964 | EXTRACTED |
| 4 | **Close Purchase Order** | /articles/15202192521108 | EXTRACTED |
| 5 | Remove Hold Status on Purchase Orders | /articles/15202208813332 | EXTRACTED |
| 6 | Purchase Order Line Item Distribution Window | /articles/15202192349076 | EXTRACTED |
| 7 | **Purchase Order Discounts Window** | /articles/15202192528532 | EXTRACTED |
| 8 | Purchase Orders *(NextGen → Product Search)* | /articles/360029070171 | **NO WIRING CONTENT** |
| 9 | **On Hold Purchase Order Overview** | /articles/15202208816020 | EXTRACTED |
| 10 | Acknowledge a Purchase Order | /articles/15202208815892 | EXTRACTED |
| 11 | Print a Purchase Order | /articles/15202208445332 | EXTRACTED |
| 12 | Line Item Full Display | /articles/15202208172948 | EXTRACTED — thin |
| 13 | Update Purchase Order Comments | /articles/15202208984596 | EXTRACTED |
| 14 | **Purchasing Control Settings** *(linked, System Administration)* | /articles/15186502233492 | EXTRACTED |
| 15 | **Purchase Order FAQs** *(linked, FAQ → Inventory)* | /articles/36208038538516 | EXTRACTED — all 19 answers expanded |
| 16 | Purchase Order Receiving FAQs *(identified, deferred to the receiving batch)* | /articles/15201608614548 | QUEUED |

Discovered and queued: `Minimum Deposit Requirements for Line Item Types` · `Special Order Control Settings` ·
`Inventory Control Settings` · `Advanced Vendor Settings` · `Advanced Product Settings` ·
`Vendor Ship From Settings` · `Warehouse Inventory Settings` · `Warehouse/Store Location Settings` ·
`Track Processing Activity` · `Buying Group Settings` · `Purchase Order Type Settings` ·
`Purchase Order Shipping Type Settings` · `Quick Purchase Order Settings` · `Open To Buy Department Settings` ·
`Receive a Purchase Order with a Separate Freight Bill` · `Reverse a Receiving Error` ·
`Receive without a Purchase Order` · `Additional Line Item Details` screen · `Program List Creation`.

---

## B. Wiring findings

### FINDING 1 — A purchase order has four line-type tabs, and one of them only exists via sales orders
Producer:   `Enter a Purchase Order` — tabs **General · Merchandise · Supplies ·
            Customer's Own Material · Totals**
Invariant:  the COM tab "is available **only for purchase orders created via Sales Order Entry**
            that include COM component products"
Header:     PO Number · **Payment Currency** · Volume · Weight · Pieces
General:    **PO Type** · Order Date · **Buyer ID** · Vendor · **Receive At** · **On Hold** ·
            Requested Date · Delivery Date · Carrier · **Container ID** · Ship To ·
            PO Shipping Type · Instructions · **EDI Eligible** · **Transmitted** · Taxable
Line fields (Merchandise): Vendor · Display Vendor Model · Product · Vendor Model · Description ·
            Brand · Unit Measure · Quantity · **Unit Cost · Discounted Cost · Extended Cost** · Taxable
Totals:     Terms · **Pay Prior to Receipt** · Sub Total · Freight · Miscellaneous · Tax · Total ·
            **Freight/Add-On**
Evidence:   Enter a Purchase Order, /articles/15202193113236
Maps to:    NEW — and it links three run-1 threads

> Three fields close loops from run 1: **`Pay Prior to Receipt`** is the flag that creates a pending
> AP bill (run 1 batch 4 flagged it as undescribed); **`Container ID`** and **`EDI Eligible`/
> `Transmitted`** are the EDI dimensions that surfaced on AP bill selection; and **`Freight/Add-On`**
> on the Totals tab is the entry point for the landed-cost asset/liability pairs from run 1 batch 1.
> **`Buyer ID`** on the PO header is the `Buyer` dimension that appeared unexplained on the AP aged
> trial balance (run 1 batch 25).

### FINDING 2 — Line items carry both an ordered cost and a discounted cost
Observation: every line grid (Merchandise, Supplies, COM) carries **Unit Cost · Discounted Cost ·
            Extended Cost** as separate values
Evidence:   Enter a Purchase Order, /articles/15202193113236
Maps to:    **W-061 — directly relevant**

> The PO stores the pre-discount and post-discount cost separately. Whichever of these flows to
> receipt cost determines what `Cost Change GL` and `Cost Used` diverge over (run 1 batch 24).
> **This is the thread to pull in batch 2.**

### FINDING 3 — Purchase order discounts are a five-way deduct-type enumeration
Producer:   `Purchase Order Discounts Window` — per **line item only**, "You can apply discounts to
            individual line items only"
**Deduct Type (verbatim):**
| Code | Meaning |
|---|---|
| *(blank)* | None |
| `D` | **DFI** |
| `B` | **Bill Back** |
| `C` | **Cost-Reduced Bill Back** |
| `R` | **Rebate** |
Then:       a DFI/Bill Back/Rebate **Code** — "You can enter **up to eight codes**. A **default DFI
            code** may populate."
Calculation: `Calculate By` = **Percent** or **Dollar**; percent to two decimal places in `Factor`,
            or a `Amount`
Read-only variant: `Purchase Order Discounts Window - Read Only`
Evidence:   Purchase Order Discounts Window, /articles/15202192528532
Maps to:    **W-044-adjacent**, and it is **the chargebacks/rebates wiring the run card asks for**

> This is the vendor-deduction model in one screen, and it connects directly to run 1's findings:
> **Bill Back** and **Rebate** are the two Vendor Receivable sources named in
> `Report Daily Vendor Receivables Activity` (run 1 batch 27), and `Bill Back Settings` /
> `Vendor Rebate Settings` are the settings files that surfaced there. **Cost-Reduced Bill Back**
> is new and important: a bill-back that reduces cost rather than creating a receivable, which
> would change inventory valuation rather than create a vendor debt. `DFI` is undefined so far.
> Up to eight codes per line means deductions stack.

### FINDING 4 — Closing a PO rewrites quantities to match receipts, and deletes unreceived lines
Trigger:    `Close Purchase Order` (Actions on the General tab of `Enter a Purchase Order`)
Invariant:  "the system **adjusts the quantity ordered to match the quantity received**. It reduces
            all partially-received line items to the amount already received, and **deletes all lines
            with zero receipts**."
Blockers:   "you **cannot close a purchase order in Bar Code Receiving**"; an error message explains
            why any restricted close was halted
Accounting: "**If accounting is active on your system, payment approvals close the purchase order.**
            If accounting is not active, you must use this option to close fully received purchase orders."
Deferred:   "you must run the **Generate Daily Reports (End of Day)** process in order for the
            purchase order to show a **CLOSED** status. The Generate Daily Reports processing updates
            the purchase order with the **closed date**."
Also:       "The Delete button is not active for purchase orders with outstanding receipts. **You must
            create an AP bill for the receipt before you can close the associated purchase order.**"
Evidence:   Close Purchase Order, /articles/15202192521108 · Enter a Purchase Order, /articles/15202193113236
Maps to:    **W-041-adjacent**, **W-012 — CONFIRMED from the purchasing side**

> Two consequences worth carrying. First, **closing a PO is destructive to the order record** — the
> ordered quantity is overwritten with the received quantity and unreceived lines vanish. Any
> analysis of "what did we order vs what did we get" must run **before** close, or against a
> snapshot. That is a genuine reason our model should keep ordered and received as separate
> immutable facts rather than reconciling them by mutation.
> Second, **payment approval closes the PO when accounting is active** — so the AP three-way match
> (run 1 batch 4) is what terminates the purchasing lifecycle, not a purchasing action.
> Third, close is **asynchronous**: the status only becomes CLOSED at End-of-Day.

### FINDING 5 — Direct-ship POs are owned by the sales order, not by purchasing
Invariant:  "Direct ship purchase orders are created via entry of a **direct ship sales order** or a
            **parts line for an In Home service order**. To change the quantity for direct ship
            purchase orders, you must change the quantity on the **sales order** … or a **service
            order** … Only **some** fields for direct ship purchase orders are accessible for editing"
Deletion:   "direct ship purchase orders can only be deleted with a **security override**"
Service:    "The ability to **add a line** to a direct ship purchase order is **not available for
            service orders**. If an entire direct ship purchase order was deleted in error, the user
            can access the service order, access the part line … and **re-create** the purchase order."
Evidence:   Open Purchase Orders, /articles/15202207778964
Maps to:    **W-005 — CONFIRMED**, **W-006 — CONFIRMED**

> The demand document owns the PO. Quantity is not editable on the PO at all — it is a projection of
> the sales or service order line. That is the binding `W-005` describes, and it is stronger than
> our contract assumes: not merely "binds to a PO line" but "the PO line is not independently
> editable". Also note **service orders generate direct-ship POs** — parts procurement runs through
> the same mechanism, which ties to the `Receivables from Vendor` / warranty loop from run 1.

### FINDING 6 — Multi-location distribution is even-by-default and must reconcile to the line quantity
Trigger:    Specifying multiple distribution locations for a line, then Add on the Merchandise tab
Producer:   `Purchase Order Line Item Distribution Window`
Behaviour:  "The system attempts to **distribute quantities evenly** among the locations."
Invariant:  "to save your changes on this screen and exit, the **distributed quantity must equal the
            line order quantity**"
Fields:     Location · Description · Quantity · **Line Order Quantity** · **Distributed Quantity**
Evidence:   Purchase Order Line Item Distribution Window, /articles/15202192349076
Maps to:    NEW — a conservation constraint of the same family as revolving `Change Details` (run 1 batch 16)

### FINDING 7 — Purchase orders can be held, and release is a permissioned bulk action tied to EDI
Producer:   `Remove Hold Status on Purchase Orders` — "release **multiple** purchase orders from hold
            and **transmit them to the vendor using EDI**"
Gates:      user/user group **Purchasing Security** — **`Create Manual Purchase Order On Hold`** and
            **`Take Purchase Order Off Hold`**
Selection:  Date Code · Start/End Date · **Buyer** · Vendor · **Receiving Location** ·
            **Selling Store** · **Minimum Deposit Met / Not Met** · **Inventory Purchase Orders /
            Service Purchase Orders** · Terms Code
Cross-ref:  "Refer to the **Minimum Deposit Requirements for Line Item Types** topic for … minimum
            deposits on orders with special order merchandise."
Evidence:   Remove Hold Status on Purchase Orders, /articles/15202208813332
Maps to:    **W-005 — extends it**, **W-020-adjacent**

> **Minimum deposit met/not met is a purchase-order selection criterion.** So the customer's deposit
> on a special-order sales line gates whether the vendor PO is released — a direct customer-money →
> vendor-commitment link, and exactly the kind of cross-module wiring this audit is for. It connects
> to run 1's D2 credit hold (minimum deposit requirements per line type, batch 14) from the other side.

### FINDING 8 — PO printing has a three-way outcome and a reprint list
Trigger:    Save on `Enter a Purchase Order`
Branches:
  - `Print Option - Enter a Purchase Order` **enabled** in `Purchasing Control Settings` →
    `Print a Purchase Order` screen appears; **print, email, or fax** — "except for orders on hold"
  - print option **not** enabled and e-mailing enabled → the PO "can be e-mailed. The e-mail used is
    the one set in **Vendor Settings**"
  - neither → the program exits
Reprints:   "For purchase orders that were **printed previously and then modified** since the last
            printing … the option to **add the purchase order to the Reprints list** appears …
            If you choose to set the order for reprints and then print the order, the program
            **removes the order from the Reprints list**."
Evidence:   Enter a Purchase Order, /articles/15202193113236
Maps to:    **W-024-analogue for purchasing** — a change after printing invalidates the printed document

> This is the PO counterpart of the delivery-ticket reprint state machine already dissected in an
> earlier handoff. Same pattern: modification after print puts the document on a reprint list, and
> printing clears it.

### FINDING 9 — Cost editing on the PO can rewrite the product master
Trigger:    Editing the Cost field on `Purchase Order Processing Screen`
Gate:       **`Update product replacement cost within purchase entry screens`** in
            **Extended Security**
Behaviour:  "If you have access and you enter a cost that differs from the **replacement cost** for
            the product, a message appears with the **option to update the Product file with the new
            replacement cost**."
Evidence:   Purchase Order Processing Screen, /articles/15203127979028
Maps to:    **W-061 — directly relevant**, **W-053 — relevant**

> A purchasing transaction can update product master data, on a prompt, gated by one permission.
> **Replacement cost** is a new cost concept alongside unit cost and discounted cost — a third value
> in the costing picture before we even reach batch 2.

### FINDING 10 — EDI vendors with multiple accounts force a single-account choice at save
Trigger:    Saving a PO for an EDI vendor with more than one EDI code
Producer:   **`Vendor EDI Accounts`** grid — "You can only select **one** EDI code from the grid."
Evidence:   Enter a Purchase Order, /articles/15202193113236
Maps to:    NEW

### FINDING 11 — Sales orders attached to PO lines are updated on every line change
Invariant:  "You can assign and update **multiple sales orders** for each purchase order line item.
            The system **updates sales orders attached to purchase order line items each time you
            change or delete the purchase order line item.**"
Evidence:   Enter a Purchase Order, /articles/15202193113236
Maps to:    **W-042 — CONFIRMED in mechanism**

> This is the ripple `W-042` posits — PO line changes propagate to attached sales orders — and it is
> **many-to-many** (multiple sales orders per PO line). The article states the propagation happens
> on change *and* on delete. What it does not say is **which** sales order fields update; promise
> dates are the obvious candidate and the point of the contract. Chase in batch 3
> (`Sales Order Linkage Screen`, `Purchase Order Updates from Sales Order Entry`).

---
### FINDING 12 — Hold is not one flag but a seven-source convergence, and it is the gate on both acknowledgement and receipt
Invariant:  "The hold status **must be removed before a purchase order can be acknowledged or
            received**." · "Purchase orders that are **on hold cannot be printed**."
Automatic hold sources, verbatim:
  1. "The PO order quantity is **less than the Minimum Stock Quantity** on the Settings page in
     **Advanced Product Settings**."
  2. "The PO was created via order entry **for foreign vendors**."
  3. "The PO is for an **EDI vendor** (except when transmitting directly from order entry)."
  4. "The PO was created from Enter a Sales Order, where the **Buying Group** feature is active
     (`GENERAL - Activate Buying Group` field in Purchasing Control Settings), and the system
     **does not specify a buyer**."
  5. `Advanced Vendor Settings` → **`Automatically Hold POs`** — "Automatically places all purchase
     orders for a specific vendor on hold."
  6. Sales Security → **`Create a purchase order not on hold from POS entry`** — "Purchase orders
     created via order entry are placed on hold **if this setting is not checked**." *(inverted
     permission: absence of the grant causes the hold)*
  7. Purchasing Control Settings → `DIRECT SHIP - Place Direct Ship Purchase Orders on Hold` ·
     `SPECIAL ORDERS - Place Purchase Orders Created on-the-Fly on Hold`;
     Service Control Settings → `On-the-Fly PO's on Hold` — "Place all parts purchase orders created
     on-the-fly in Enter a Service Order on hold."
Release invariant: "If you are removing the hold status from a purchase order that is **not a supply
            PO**, the system **checks the minimum order quantities for all products** on the purchase
            order before allowing it to be released from hold."
Evidence:   On Hold Purchase Order Overview, /articles/15202208816020;
            Purchasing Control Settings, /articles/15186502233492
Maps to:    **NEW** — and it answers the `Purchase Order FAQs` question "Why do some purchase orders
            go on Hold?", which merely refers back to this article.

> This is the single most load-bearing thing in batch 1. **Hold is the PO's admission gate**: nothing
> can be printed, acknowledged or received while it is set. Seven independent configuration surfaces
> can set it — a product setting, a vendor setting, a vendor's country, a vendor's EDI status, a
> buying-group rule, a *security permission whose absence sets the hold*, and three separate control
> settings files. If we rebuild this, hold has to be modelled as a **set of reasons**, not a boolean,
> or the operator cannot tell which of the seven put it there. **The docs never say STORIS records
> the reason.** Note also the asymmetric minimum-quantity check: minimum stock quantity can *cause*
> the hold at creation, and minimum *order* quantity is re-checked at release — two different
> thresholds, and supply POs are exempt from the second.

### FINDING 13 — Acknowledgement is optional, informational, and yet it seizes control of the delivery date
Invariant:  "Note that purchase order acknowledgements are **optional and for informational purposes
            only**."
Contradicting invariant (from the FAQ): "This depends on whether or not an acknowledgement has been
            entered for the purchase order. If the PO **has not** been acknowledged in STORIS, you can
            access the purchase order via Enter a Purchase Order and change the delivery date. If the
            PO **has been acknowledged, you must use the Acknowledge a Purchase Order routine** to
            change the delivery date."
Fields:     PO Number · EDI · Container # · Vendor · Ship To · **Acknowledgement # · Acknowledgement
            Date · Shipping Date · Delivery Date · Dock Scheduled** (header *and* per line) ·
            Product · Vendor Model · Quantity Received · Discount Cost · Extended Cost ·
            Tracking ID · Special Order Details · **Quantity In-Transit** · Unit Cost
Partial:    "You can acknowledge the **entire order or a portion of it**."
Read-only:  "Depending on how this screen was accessed, the **read-only version** of this process may
            be shown."
Evidence:   Acknowledge a Purchase Order, /articles/15202208815892;
            Purchase Order FAQs, /articles/36208038538516
Maps to:    **NEW — and a documented self-contradiction worth carrying forward**

> "Informational only" is false as written. Acknowledging a PO **moves ownership of the delivery
> date** out of PO entry and into the acknowledgement routine, permanently. It also introduces
> **`Quantity In-Transit`** — a third inventory state between ordered and received that run 1 never
> saw, and that any availability calculation has to account for. And a `Purchasing Control Settings`
> switch, `DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order`, means the
> acknowledgement can *compute* the direct-ship delivery date rather than record it.

### FINDING 14 — EDI acknowledgements can rewrite what you ordered
Invariant:  `Purchasing Control Settings` → **`EDI - Allow Acknowledgment to Adjust Order Quantity`**
Evidence:   Purchasing Control Settings, /articles/15186502233492
Maps to:    **NEW**

> A single control-setting switch decides whether an inbound vendor EDI acknowledgement is allowed to
> **change the ordered quantity on our own purchase order**. That is a vendor-initiated write into our
> order book. The setting is named but not described — we do not know whether it adjusts silently,
> logs, or notifies. This is a compliance-relevant switch and belongs in the cutover checklist.

### FINDING 15 — Purchase order field history exists only if a separate tracking routine is configured
Invariant:  "On-line comment tracking is an audit system that **automatically tracks the entry and
            deletion of purchase orders**. … **Optional field change comments**: field name, field
            contents before change, and field contents after change. **The tracking of these types of
            comments is controlled by settings in the `Track Processing Activity` routine.**"
Auto comments (verbatim examples): `Purchase Order Entered` · `PO Deleted` · `PO created via
            Replenish Inventory for Current Back Order Needs` · `PO created via Replenish Stock
            Inventory Based on Sales Rate`
Comment record: date and time · **operator's initials** · system-generated text · optional field
            change (name, before, after) · manual text
Read/write split: "If you are accessing the **View Purchase Order Comments** routine, you cannot edit
            comments. To edit comments, you must use the **Update Purchase Order Comments** routine."
Evidence:   Update Purchase Order Comments, /articles/15202208984596
Maps to:    **NEW — extends the run-1 audit-switch family to five**

> Run 1 found four opt-in audit switches that determine whether history is reconstructable
> (`End-of-Day Posted Transactions`, `Inventory-G/L Reconciliation Audit`, `Open Item Auditing`,
> `Track Settings Activity`). **`Track Processing Activity` is the fifth**, and it is a different
> routine from `Track Settings Activity` — settings changes and *transaction* field changes are
> tracked by two separate configurations. Entry and deletion are always logged; **everything in
> between is opt-in**. The PO comment stream is therefore both the audit log and a free-text field,
> in the same list, distinguished only by whether the text was system-generated.

### FINDING 16 — The PO comment stream is how you find order-entry-created POs
Invariant:  "Use the `Report Purchase Order Delivery Information` routine and **enter 7 (or greater)
            at the `Number of Comment Lines` prompt**. You can **review the comments for indications**
            that specific purchase orders were created via order entry."
Evidence:   Purchase Order FAQs, /articles/36208038538516
Maps to:    **NEW**

> A worked example of a missing relational field. STORIS does not carry a queryable "created by"
> provenance attribute on the PO; the recommended method is to print seven lines of free text and
> read them. `Report Special Order Purchase Orders` is offered as the structured alternative, but it
> covers special orders only. If we rebuild, **origin is a first-class enum on the PO**, not a comment.

### FINDING 17 — Net available is a five-term subtraction, and it is not what is on hand
Invariant:  "STORIS uses the following equation to calculate the net available quantity of a product:
            **`NET AVAIL = QOH - RES - FLR - AI`** … 'net available equals the total quantity on hand
            less the number of items **reserved to orders**, less **floor samples**, and less
            **As-Is** items'. Each subsequent week then shows the prior week's ending total net
            available as the new week's beginning net available."
Second term (verbatim, presented immediately after and without its own heading): "total quantity
            currently **on open purchase orders** - *unreserved quantity - **layaway sales**.
            *The unreserved quantity of a product consists of the quantity from **non-layaway sales
            orders that are not fully reserved** (including **CWC's and ASAP's**), minus **open credit
            memos that are not flagged As-Is**."
Evidence:   Purchase Order FAQs, /articles/36208038538516
Maps to:    **NEW — the availability definition the whole replenishment run depends on**

> This is the most important formula in the section and it is documented in an FAQ, not in a
> reference article. Three things matter. First, **floor samples and As-Is stock are on hand but not
> available** — they are subtracted, so availability and inventory value diverge by construction.
> Second, the projection is **weekly and cumulative**: each week starts from the prior week's ending
> figure, so an error propagates forward rather than self-correcting. Third, the second expression is
> **printed without a label** — it is almost certainly the forward/incoming half (what open POs add,
> less what unreserved demand and layaways will consume), but the article never says so. Recorded as
> quoted; the interpretation is in section H as an inference. `CWC` and `ASAP` are undefined order
> classes appearing here for the first time.

### FINDING 18 — Deleting a received PO requires un-receiving it, and picked stock cannot be un-received
Invariant:  "To delete a purchase order that has been received, you must **remove/reverse all received
            quantity**… In `Receive a Purchase Order`, at the `Type of Activity` field, click on
            **`Reverse a Receiving Error`**… Quantities available to be removed appear in the
            **`Available`** column. If the quantities in the `Available` column **match** the
            quantities in the `Ordered` column, you can reverse receiving for the entire purchase
            order. Enter those quantities into the **`Credit`** column and click on `Save`."
Blocking invariant: "**If the quantities in the `Available` column do not match the quantities in the
            `Ordered` column, you cannot 'un-receive' the entire PO and thus cannot delete the PO.
            The `Available` column does not include items that appear on a pick list or manifest, or
            have been completed.** Therefore, you cannot un-receive such items."
Evidence:   Purchase Order FAQs, /articles/36208038538516
Maps to:    **NEW**

> Receipt is reversible only until logistics touches the stock. **A pick list or manifest line
> permanently pins the receipt**, and with it the PO. This is a hard cross-module dependency —
> Logistics state gates a Merchandising delete — and it is exactly the kind of wiring the audit is
> for. It also means "delete the PO" is not a recovery path in practice for anything that shipped.

### FINDING 19 — Over-receipt correction splits three ways by whether the vendor has been paid
Invariant (unpaid, unsold): reverse the receipt via `Reverse a Receiving Error`, entering "the
            quantity by which you want to reduce the receipt. **Enter a positive number. The system
            interpolates a negative sign to your entry.**" — "Using this method, **payable
            transactions are affected**. **Use this method only if the receipt for these items has not
            been paid.**"
Invariant (reserved): "If you have pieces reserved on sales transactions, you **must first remove the
            reservation** for those pieces by accessing the orders directly in `Enter a Sales`…"
Invariant (paid): "If the vendor has already been paid for the merchandise on the purchase order:
            You can **allow the over-receipt to exist** and then use **`Enter a Stock Adjustment`** to
            reduce your quantity-on-hand. Following the stock adjustment, **you may also need to enter
            a payable adjustment**."
Invariant (no PO): "`Receive without a Purchase Order`… Specify the original reference number and
            vendor number. Enter the quantity that was received in excess **as a negative number**."
Evidence:   Purchase Order FAQs, /articles/36208038538516
Maps to:    **W-041 — directly relevant; see the note**

> Three different mechanisms, chosen by AP state, with **opposite sign conventions** in two of them
> (positive in `Reverse a Receiving Error`, negative in `Receive without a Purchase Order`). The paid
> path is the significant one: **the receipt is deliberately left wrong** and the correction is made
> as a stock adjustment plus a manual payable adjustment. That means quantity-on-hand and
> received-on-PO are permitted to disagree, permanently, with a hand-entered AP adjustment as the
> only link. Run 1's finding that there is **no PPV account** is what forces this: the cost variance
> has nowhere to post, so the operator restates by hand. **Batch 2 should confirm.**

### FINDING 20 — PO close rules split four ways, and the FAQ contradicts its own heading
Invariant:  "Different rules apply, according to whether accounting is active on your system
            (**STORIS AP/GL or third party interface**) and whether the purchase order is **fully or
            partially received**."
Path A (partial, accounting active): `Close Purchase Order` from the **Actions button on the Header
            tab** of `Enter a Purchase Order`; or "If the **`Allow Receiving to Close Purchase Order`**
            field in **`Inventory Control Settings`** is active, the `Receive a Purchase Order` process
            **asks if you would like to manually close receiving** for the purchase order."
Path B (full, accounting active): "Fully received purchase orders (quantity ordered matches quantity
            received) are **closed by the system when you approve them for payment**."
Path C (partial, accounting not active): methods 1 or 2 above.
Path D (full, accounting not active): "you must **first answer No to the prompt that asks if you want
            to delete the purchase order** (now fully received). Once you answer No, you can use
            method 1 above."
Invariant:  "**Purchase orders are moved to a 'closed list' using the options above, but do not show
            the status of `CLOSED` until you run the `Generate Daily Reports` (End of Day)
            processing.** (During day ending processing, the closed date is updated.)"
Evidence:   Purchase Order FAQs, /articles/36208038538516
Maps to:    **W-044 — CONFIRMED**; confirms and extends batch-1 Finding 4

> Two new facts beyond Finding 4. **`Allow Receiving to Close Purchase Order` lives in Inventory
> Control Settings, not Purchasing Control Settings** — the close prompt is configured in a different
> module from the thing it closes. And **path D is a trap**: on a fully received PO with accounting
> off, the system's default prompt offers to *delete* the purchase order, and the operator has to
> decline it to reach close. A misclick destroys the order record. Note the FAQ's headings are
> mislabelled — the first block says "If accounting is active" and then a second block repeats "If
> accounting is active" where "not active" is meant; recorded as printed, flagged in H.

### FINDING 21 — Receiving location is editable, but two separate transmission-state permissions gate it
Invariant:  "**Yes, provided the purchase order has not been received** and you have permission…
            If the PO has been **submitted via EDI**, you must have the **`Edit EDI purchase orders
            that were electronically submitted`** setting enabled in your user group/user Purchasing
            Security settings. If the PO has been **printed, faxed, or emailed**, you must have the
            **`Edit purchase orders that have been printed, faxed or emailed`** setting enabled."
Evidence:   Purchase Order FAQs, /articles/36208038538516
Maps to:    **NEW — two more Purchasing Security permissions**

> Editability is a function of **how the PO left the building**. Two permissions, one per transmission
> channel, plus the hard block on received POs. Any rebuild needs a "transmitted state" on the PO
> that is distinct from status and that gates edit rights per channel.

### FINDING 22 — Special-order POs from sales entry are governed by three settings in three files at once
Invariant:  "If there is insufficient quantity of the special order product, and you have the
            appropriate settings, you can create a purchase order for the special order product from
            within `Enter a Sales Order`. You may either be **prompted to create the PO, or it may be
            created automatically**, depending on your settings. In addition, **you may be required to
            reserve the item to the sales order**. Check the following settings on your system:
            **`Create special order purchase orders within POS entry`** user/user group **Purchasing
            Security** settings, **`Purchase Order - Automatically Create`** and **`Assignment
            Required`** fields in the **`Special Order Control Settings`**."
Plus:       Purchasing Control Settings → `SPECIAL ORDERS - Allow Electronic Transmission of POs
            During Sales Entry` · `SPECIAL ORDERS - Place Purchase Orders Created on-the-Fly on Hold`
            · **`SPECIAL ORDERS - Use Replacement Cost as a Default`**
Evidence:   Purchase Order FAQs, /articles/36208038538516;
            Purchasing Control Settings, /articles/15186502233492
Maps to:    **W-005 / W-006 — CONFIRMED and extended**

> Whether selling a special-order item creates a purchase order is decided by **a security
> permission, two Special Order Control Settings fields, and three Purchasing Control Settings
> fields — five files**. And `SPECIAL ORDERS - Use Replacement Cost as a Default` means the PO cost
> for a special order may be seeded from the **product master replacement cost** rather than a vendor
> price — tying directly to batch-1 Finding 9, where the PO screen can also *write* that value back.
> Replacement cost is therefore both an input to and an output of purchase order entry.

### FINDING 23 — Special order instructions written on the PO push back into the sales order
Invariant:  "Once the purchase order that is linked to the sales order has been printed, **you cannot
            update line comments from within order entry**. However, you can access the purchase order
            via `Enter a Purchase Order`, and select **`Special Order Instruction`** from the Actions
            button on the Merchandise tab. **When you add instructions on this screen, the linked
            sales order is also updated.**"
Evidence:   Purchase Order FAQs, /articles/36208038538516
Maps to:    **W-042 — a second confirmed propagation, this one PO → sales order for text**

> Finding 11 established that PO line *changes* update attached sales orders. This names one concrete
> propagated field: **special order instructions**, written on the PO, appear on the sales order.
> Note the direction reverses after printing — before printing, order entry owns the comment; after
> printing, the PO owns it and pushes down.

### FINDING 24 — Multi-location POs are built from a named, reusable distribution list
Invariant:  "At the **`Receiving At`** field, click the Action button to access the **`Program List
            Creation`** window. At the `List` field, enter the code of an **existing distribution list
            or enter a new code to create a list**. When you return to Purchase Order Entry, the
            `Receiving At` field indicates that multiple locations have been selected (**"..."**) and
            the list description displays below the field. … Following entry of the Quantity, the
            **`Line Item Distribution`** window displays… **By default, the system attempts to
            distribute the quantity evenly among the locations, but you can change this.**"
Evidence:   Purchase Order FAQs, /articles/36208038538516
Maps to:    **NEW — names the mechanism behind batch-1 Finding 6**

> The distribution list is a **persistent named object** (`Program List Creation`) shared across POs,
> not a per-order set of locations. Changing a list changes the behaviour of every future PO that
> uses it. `"..."` is the literal sentinel the field displays for multi-location — a UI convention
> worth noting alongside run 1's `$$$^NN`.

### FINDING 25 — Vendor ship-from selection is an interactive prompt on every PO for that vendor
Invariant:  "Once you establish alternate shipping addresses for a vendor (via the **`Vendor Ship From
            Settings`**), **each time you enter that vendor into a purchase order, a prompt appears**
            asking if you want to select a ship from location. If you say Yes, a list of ship from
            locations appears from which you can choose."
Evidence:   Purchase Order FAQs, /articles/36208038538516
Maps to:    **NEW**

> There is no default ship-from: configuring alternates converts vendor entry into a modal question
> on **every** purchase order. `Assign Default Vendor Ship From Locations` is a separate Merchandising
> article (queued, batch 3) which presumably suppresses it — the two need reading together before we
> conclude.

### FINDING 26 — Purchase orders and vendor returns print through Enhanced Laser Forms, and the addenda are conditional on Forms Designer
Invariant:  "**Purchase Orders and Return To Vendor transactions are printed via Enhanced Laser
            Forms.**" · "If you enable one or more of the following options, the documents print
            automatically after the purchase order prints, **at the same printer as the purchase
            order**. **These fields are active only if you select `Forms Designer` at the `Purchase
            Order form` field.** STORIS provides a standard version of each of these options in the
            Forms Designer. You can copy these forms and customize the copies."
Fields:     `ENHANCED LASER PRINT - Print Buyer's Copy` · `Print Domestic Addendums` ·
            `Print Import Addendums`
Evidence:   Purchasing Control Settings, /articles/15186502233492
Maps to:    **NEW**

> **Domestic and import purchase orders print different paperwork**, and which addendum prints is a
> control setting, not a property of the PO. The import/domestic distinction also appeared as a hold
> reason ("created via order entry **for foreign vendors**"), so foreign sourcing is a real dimension
> in the data model even though no field named "import" has appeared on the PO yet.

### FINDING 27 — Purchase status transitions for a product are gated by open PO quantity, and by three switches
Invariant:  `PURCHASE STATUS - Product can be 'Dropped' with Open POS Quantity` ·
            `PURCHASE STATUS - Product can be 'Discontinued' with Open POS Quantity` ·
            `PURCHASE STATUS - Include Incoming PO's when Determining Availability for Dropped and
            Discontinued Products`
Evidence:   Purchasing Control Settings, /articles/15186502233492
Maps to:    **NEW — first sighting of the product purchase-status state machine**

> Two of the product lifecycle states are named here — **Dropped** and **Discontinued** — and both
> transitions are **blocked by open sales quantity unless a control setting permits them**. The third
> switch changes whether incoming POs count toward availability for products in those states, which
> means the `NET AVAIL` formula in Finding 17 has a **state-dependent variant**. The full purchase-status
> enumeration is not given here; chase in the merchandising-decisions batch.

### FINDING 28 — Six more purchasing-wide behaviours are set by named-only control fields
| Field | What it plainly governs | Documented? |
|---|---|---|
| `Next Purchase Order Number` | PO numbering sequence | named only |
| `Days to Keep Voided Purchase Orders` / `Days to Keep Closed Purchase Orders` | **retention/purge windows** | named only |
| `ENTRY - Allow Manually Entered Purchase Order Numbers` | whether PO numbers can be typed | named only |
| `NUMBERING - Add Location Prefix to the Purchase Order Number` | PO key composition | named only |
| `Daily Exceptions Cost Change Percent` | threshold that raises a **costing exception** | named only |
| `Vendor Rebate Chargeback Method` | how rebates are recovered | named only |
| `GENERAL - Exclude Weekends in Vendor Lead Days` / `LEAD DAYS CALCULATION Override Lead Days if Purchase Order Date is Greater` | delivery-date arithmetic | named only |
| `GENERAL - Generate Daily Reports Links POs to Sales Orders` | **End-of-Day creates PO↔SO links** | named only |
| `GENERAL - Include As-Is Quantities in GMROI Calculation` | merchandising KPI composition | named only |
| `RECEIVING - Supply Purchase Orders must be Received` | whether supply POs require receipt | named only |
| `Sales Order Linkage Access` · `New Product Creation` · `Preset Discounts` · `Days to Pad Auto Reallocation` · `AS-IS RECEIVING - Single P/O Transfers` · `VENDOR RETURNS - Calculate Freight` · `Product Reports Sort` · `Report Open to Buy Department Type` · `Sales Rate Replenishment Calculation` | various | named only |
Gating note: "**Many system control settings have powerful effects on your system and thus are
            accessible by STORIS personnel only.** Consult your STORIS representative before
            attempting to edit any of these fields."
Evidence:   Purchasing Control Settings, /articles/15186502233492
Maps to:    **NEW**

> Two of these are wiring, not preferences. **`Days to Keep Voided/Closed Purchase Orders` is a purge
> policy** — purchasing history has a configurable expiry, which bears on run 1's audit-reconstruction
> question. And **`GENERAL - Generate Daily Reports Links POs to Sales Orders`** says the PO↔sales
> order linkage is (at least partly) **established during End-of-Day**, not at entry — meaning the
> link Finding 11 relies on may not exist until the next day. `Daily Exceptions Cost Change Percent`
> is the threshold behind batch 2's costing exceptions and is carried forward.
> The whole file is **partly gated**: fields exist that only STORIS staff can set, so the operator
> view of purchasing behaviour is incomplete by design.

---

## C. Screen and field inventory

**Enter a Purchase Order** — full field list at Finding 1.

**Purchase Order Processing Screen** — Quantity Ordered · Receiving Warehouse · Scheduled Date ·
Vendor Code · Cost · Add · Save · Actions.

**Open Purchase Orders** — access by PO reference number; Date and Vendor not editable.

**Close Purchase Order** — action only; reached from the **Actions button on the Header tab**.

**Remove Hold Status on Purchase Orders** — Date Code · Start/End Date · Buyer · Vendor ·
Receiving Location · Selling Store · **Minimum Deposit Met · Minimum Deposit Not Met** ·
Inventory Purchase Orders · Service Purchase Orders · Terms Code · Select Purchase Orders ·
**Remove All from Hold** · Process Purchase Orders · Grid.

**Purchase Order Line Item Distribution Window** — Location · Description · Quantity ·
Line Order Quantity · Distributed Quantity · Grid.

**Purchase Order Discounts Window** — Deduct Type · DFI/Bill Back/Rebate Code (up to 8) ·
Calculate By · Factor · Amount · Grid. Read-only variant exists.

**Acknowledge a Purchase Order** — PO Number # · EDI · Container # · Vendor · Ship To ·
Acknowledgement # · Acknowledgement Date · Shipping Date · Delivery Date · Dock Scheduled ·
*(line grid)* Product · Vendor Model · Quantity Received · Discount Cost · Extended Cost ·
Tracking ID · Special Order Details · **Quantity In-Transit** · Unit Cost · Acknowledgement # ·
Acknowledgement Date · Shipping Date · Delivery Date · Dock Scheduled · Grid Information · Actions.
Read-only variant exists.

**Print a Purchase Order** *(Purchase Order Print)* — Purchase Order · Receiving Location · Vendor ·
Vendor Ship-To Location · Include · **Output Type** · Suppress Line Number Print ·
**Print Stock Labels** · **Include Reprints** · Run.

**Line Item Full Display** — grid of PO line items: product key · description · quantity ordered ·
quantity received · acknowledgement date. Actions.

**Update Purchase Order Comments** *(Purchase Order Comments Entry)* — Vendor Code · Purchase Order ·
Comments · Update Comments. Read-only twin: **View Purchase Order Comments**.

**Purchasing Control Settings** — full field list at Findings 26–28, plus:
Next Purchase Order Number · Days to Keep Voided Purchase Orders · Days to Keep Closed Purchase
Orders · Vendor Class for Vendor Search (**Include / Exclude — mutually exclusive**) ·
Product Reports Sort · Daily Exceptions Cost Change Percent · Sales Order Linkage Access ·
New Product Creation · Preset Discounts · Purchase Order Type Default · Purchase Order Shipping Type
Default · Days to Pad Auto Reallocation · Report Open to Buy Department Type · Sales Rate
Replenishment Calculation · Vendor Rebate Chargeback Method · Type - Description · then the
prefixed switch list (AS-IS RECEIVING, BACK ORDER REPLENISH, DELIVERY DATE/DIRECT SHIP, DIRECT SHIP,
EDI, ENHANCED LASER PRINT ×3, ENTRY, GENERAL ×4, LEAD DAYS CALCULATION, NUMBERING, PRINT,
PURCHASE STATUS ×3, RECEIVING, SALES RATE REPLENISH ×3, SPECIAL ORDERS ×3, VENDOR RETURNS).

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `Print Option - Enter a Purchase Order` | Purchasing Control Settings | Whether print/email/fax appears on save |
| `PRINT - Prompt the User Within Enter a Purchase Order` | Purchasing Control Settings | Same prompt, switch form |
| `GENERAL - Activate Buying Group` | Purchasing Control Settings | Enables buying group; **no buyer ⇒ PO on hold** |
| `DIRECT SHIP - Place Direct Ship Purchase Orders on Hold` | Purchasing Control Settings | Auto-hold direct ship |
| `SPECIAL ORDERS - Place Purchase Orders Created on-the-Fly on Hold` | Purchasing Control Settings | Auto-hold on-the-fly POs |
| `SPECIAL ORDERS - Allow Electronic Transmission of POs During Sales Entry` | Purchasing Control Settings | EDI from order entry (also the exception to EDI auto-hold) |
| `SPECIAL ORDERS - Use Replacement Cost as a Default` | Purchasing Control Settings | Seeds PO cost from product master |
| `EDI - Allow Acknowledgment to Adjust Order Quantity` | Purchasing Control Settings | **Vendor can change our ordered quantity** |
| `DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order` | Purchasing Control Settings | Delivery date computed at acknowledgement |
| `Days to Keep Voided / Closed Purchase Orders` | Purchasing Control Settings | **Purchasing history retention** |
| `Daily Exceptions Cost Change Percent` | Purchasing Control Settings | Costing-exception threshold |
| `GENERAL - Generate Daily Reports Links POs to Sales Orders` | Purchasing Control Settings | **PO↔SO link built at End-of-Day** |
| `GENERAL - Exclude Weekends in Vendor Lead Days` | Purchasing Control Settings | Lead-day arithmetic |
| `LEAD DAYS CALCULATION Override Lead Days if Purchase Order Date is Greater` | Purchasing Control Settings | Lead-day arithmetic |
| `PURCHASE STATUS - Product can be 'Dropped' / 'Discontinued' with Open POS Quantity` | Purchasing Control Settings | Product lifecycle gate |
| `PURCHASE STATUS - Include Incoming PO's when Determining Availability…` | Purchasing Control Settings | **Alters availability for dropped/discontinued** |
| `ENHANCED LASER PRINT - Print Buyer's Copy / Domestic Addendums / Import Addendums` | Purchasing Control Settings | Conditional on `Forms Designer` |
| `ENTRY - Allow Manually Entered Purchase Order Numbers` · `NUMBERING - Add Location Prefix` | Purchasing Control Settings | PO key composition |
| `RECEIVING - Supply Purchase Orders must be Received` | Purchasing Control Settings | Supply PO lifecycle |
| `Automatically Hold POs` | **Advanced Vendor Settings** | Auto-hold all POs for a vendor |
| `Minimum Stock Quantity` (Settings page) | **Advanced Product Settings** | Under-minimum PO ⇒ hold |
| `Purchase Order - Automatically Create` · `Assignment Required` | **Special Order Control Settings** | Auto-create / reserve special order POs |
| `On-the-Fly PO's on Hold` | **Service Control Settings** | Auto-hold parts POs from service orders |
| `Allow Receiving to Close Purchase Order` | **Inventory Control Settings** | Close prompt during receiving |
| field-change tracking | **Track Processing Activity** | Whether PO field history is recorded |
| alternate ship-from addresses | **Vendor Ship From Settings** | Prompts a ship-from choice on every PO |
| accounting active (STORIS AP/GL or third-party interface) | (system) | Payment approval closes fully received POs |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| `Create Manual Purchase Order On Hold` | Purchasing Security | Checking the On Hold box in PO entry |
| `Take Purchase Order Off Hold` | Purchasing Security | Unchecking it, and the bulk release routine |
| `Create a purchase order not on hold from POS entry` | **Sales Security** | **Inverted** — unchecked ⇒ order-entry POs are held |
| `Create special order purchase orders within POS entry` | Purchasing Security | Creating special order POs from sales entry |
| `Edit EDI purchase orders that were electronically submitted` | Purchasing Security | Editing a transmitted PO |
| `Edit purchase orders that have been printed, faxed or emailed` | Purchasing Security | Editing a printed PO |
| `Update product replacement cost within purchase entry screens` | **Extended Security** | Writing replacement cost back to the product master |
| (unnamed override) | — | Deleting a direct-ship purchase order |
| STORIS-personnel-only fields | System Control Settings | Many purchasing behaviours are not operator-settable |

---

## F. State machines and enumerations

**PO line types (tabs)** — Merchandise · Supplies · Customer's Own Material.
**PO status** — open → "closed list" → **`CLOSED` only at Generate Daily Reports (End of Day)**, which
also stamps the closed date. Voided is a separate retained state (`Days to Keep Voided…`).
**PO transmission state** — not transmitted · **printed/faxed/emailed** · **EDI submitted** — each with
its own edit permission.
**PO hold** — set by any of seven independent sources (Finding 12); release re-checks minimum order
quantities for non-supply POs.
**Acknowledgement state** — unacknowledged · partially acknowledged · acknowledged; acknowledgement
transfers delivery-date ownership to `Acknowledge a Purchase Order`.
**Inventory positions on a PO line** — Ordered · **In-Transit** · Received · Available *(Available
excludes pick-listed, manifested and completed items)*.
**Deduct types** — blank/None · `D` DFI · `B` Bill Back · `C` Cost-Reduced Bill Back · `R` Rebate
(up to 8 stacked).
**Discount calculation** — Percent (2dp Factor) or Dollar (Amount).
**Cost values on a PO line** — Unit Cost · Discounted Cost · Extended Cost; plus **replacement cost**
on the product master (both an input default and a write target).
**PO classes for hold release** — Inventory Purchase Orders · Service Purchase Orders.
**Product purchase status** *(partial)* — … · **Dropped** · **Discontinued**.
**Order classes appearing in the availability formula** — layaway · non-layaway · **CWC** · **ASAP** ·
open credit memo (As-Is flagged or not) · floor sample · As-Is.
**Availability** — `NET AVAIL = QOH - RES - FLR - AI`, projected weekly and cumulatively.
**Receiving reversal sign convention** — `Reverse a Receiving Error` takes a **positive** number;
`Receive without a Purchase Order` takes a **negative** one.

---

## G. Sequencing rules

1. **Hold blocks print, acknowledgement and receipt.** Nothing moves until it is cleared.
2. Releasing a non-supply PO from hold re-checks minimum order quantities for every product on it.
3. Once acknowledged, the delivery date can only be changed in `Acknowledge a Purchase Order`.
4. A PO with outstanding receipts cannot be deleted; an AP bill must exist for the receipt before the
   PO can be closed.
5. Deleting a received PO requires reversing **all** receipts first, and **pick-listed, manifested or
   completed items cannot be reversed** — so such a PO can never be deleted.
6. With accounting active, payment approval closes a **fully** received PO; partial closes are manual
   or prompted by `Allow Receiving to Close Purchase Order`.
7. With accounting inactive, a fully received PO first prompts to **delete**; answer No, then close.
8. `CLOSED` status and the closed date are set only by End-of-Day.
9. Close rewrites ordered quantities to received and deletes zero-receipt lines.
10. Distributed quantity must equal line order quantity before the distribution window saves.
11. Direct-ship PO quantities change only on the originating sales or service order.
12. Modification after printing offers the Reprints list; printing clears it.
13. Before printing, order entry owns line comments; after printing, the PO owns them and pushes
    special order instructions down to the sales order.
14. PO↔sales order links may be (re)built during End-of-Day when
    `GENERAL - Generate Daily Reports Links POs to Sales Orders` is on.
15. Over-receipt correction path is chosen by AP state: unpaid ⇒ reverse; paid ⇒ stock adjustment
    plus manual payable adjustment.

---

## H. Open questions and gaps

**Gated or unreachable**
- **STORIS-personnel-only control settings.** `Purchasing Control Settings` states outright that many
  fields are accessible only to STORIS staff. We cannot enumerate which, so the operator-visible
  configuration surface for purchasing is knowably incomplete.
- **`Track Processing Activity`** — the routine that decides whether PO field history exists. Not yet
  read; queued.
- Field-level descriptions for `Acknowledge a Purchase Order`, `Print a Purchase Order` and
  `Line Item Full Display` — all three articles list field names with **no descriptions at all**.

**Documented but ambiguous**
- **"Acknowledgements are optional and for informational purposes only"** is contradicted three
  paragraphs later in the FAQ, where acknowledgement is the *only* way to change the delivery date.
  Recorded as a documentation contradiction, not resolved.
- **The `Purchase Order FAQs` close-rules answer repeats the heading "If accounting is active"** where
  the second occurrence must mean "not active". Transcribed as printed; the four-path reading in
  Finding 20 assumes the intended sense.
- **The second half of the `NET AVAIL` answer is unlabelled** — "total quantity currently on open
  purchase orders - unreserved quantity - layaway sales" has no stated left-hand side.
- **`CWC` and `ASAP`** — order classes used in the availability definition, never expanded.
- **`Quantity In-Transit`** — appears on the acknowledgement line grid; nothing says how it is set,
  whether it reduces on receipt, or whether it counts toward availability.
- **`EDI - Allow Acknowledgment to Adjust Order Quantity`** — named, never described. Silent or
  notified? Logged where?
- **`Dock Scheduled`** — on both acknowledgement header and line; undescribed, and a probable
  Logistics link.
- **`Output Type`** on Print a Purchase Order — the print/email/fax enumeration is never given.
- **`Include`** on Print a Purchase Order — a filter field with no stated domain.
- **`DFI`**, **`Cost-Reduced Bill Back` vs `Bill Back`**, **`PO Type` enumeration**, **which sales
  order fields update on PO line change**, **`Freight/Add-On`**, **`Pay Prior to Receipt`**,
  **`PO Shipping Type`**, **`Receive At` vs `Ship To`**, **`Volume/Weight/Pieces`** — all carried
  forward unresolved from the partial batch.
- **Whether the hold *reason* is stored.** Seven sources can set the flag; nothing says the system
  records which one did.
- **`Vendor Rebate Chargeback Method`** — the enumeration is not given, and it decides how rebate
  deductions are recovered. Batch 2.
- **`Minimum Stock Quantity` (Advanced Product Settings) vs minimum *order* quantity** checked at
  release — two thresholds, never distinguished in one place.

**Inferences (not in section B)**
- The unlabelled second expression in the `NET AVAIL` answer is most likely the **incoming/forward**
  half of the weekly projection. The docs do not say so.
- `Discounted Cost` is presumably `Unit Cost` less the line's deduct-type discounts; not stated.
- `Available` in `Reverse a Receiving Error` is presumably received-minus-committed; the article
  defines it only by exclusion (not pick-listed, manifested or completed).
- Since payment approval closes the PO, the AP `Convert Pending Bills` tolerance (run 1 batch 4)
  effectively also governs when purchasing lifecycles end; not stated.
- `Assign Default Vendor Ship From Locations` presumably suppresses the per-PO ship-from prompt from
  Finding 25; the two articles have not been read together.

---

## I. Unknown unknowns

- **Hold as a seven-source convergence**, including a security permission whose *absence* sets it.
- **`Quantity In-Transit`** as a distinct inventory position between ordered and received.
- **A vendor EDI acknowledgement permitted to change our ordered quantity.**
- **`Track Processing Activity`** as a fifth opt-in audit switch, separate from `Track Settings Activity`.
- **Purchasing history retention windows** (`Days to Keep Voided / Closed Purchase Orders`).
- **PO↔sales order linkage established during End-of-Day**, not at entry.
- **Pick lists and manifests permanently pinning a receipt** — Logistics gating a Merchandising delete.
- **The paid-vendor over-receipt path deliberately leaving the receipt wrong** and correcting by stock
  adjustment plus manual payable adjustment.
- **Domestic vs import addendum printing**, and foreign vendors as an automatic hold reason.
- **`Program List Creation`** — reusable named distribution lists shared across purchase orders.
- **`"..."`** as the multi-location sentinel in `Receiving At`.
- **Floor samples and As-Is stock subtracted from availability** — availability and inventory value
  diverge by construction.
- **A weekly, cumulative availability projection** rather than a point-in-time number.
- **The delete-prompt trap** on fully received POs with accounting inactive.
- **`Cost-Reduced Bill Back`**, eight stacked deduction codes, replacement cost editable from a PO
  screen, minimum deposit met/not met as a release criterion, service orders generating direct-ship
  POs, multiple vendor EDI accounts, the Reprints list, Payment Currency/Volume/Weight/Pieces —
  carried forward from the partial batch.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| On Hold | PO admission gate; blocks print, acknowledgement and receipt. Set by any of seven sources |
| Acknowledgement | Vendor's confirmation of a PO; once entered, owns the delivery date |
| Quantity In-Transit | Inventory position between ordered and received, shown on acknowledgement lines |
| Dock Scheduled | Acknowledgement field, header and line; undescribed |
| Available (receiving) | Received quantity still reversible — excludes pick-listed, manifested, completed |
| Reverse a Receiving Error | Receiving activity type that un-receives; takes a positive number |
| NET AVAIL | `QOH - RES - FLR - AI`; projected weekly and cumulatively |
| CWC / ASAP | Undefined sales order classes counted in unreserved quantity |
| Program List Creation | Reusable named multi-location distribution list |
| Track Processing Activity | Routine enabling PO field-change history |
| Enhanced Laser Forms / Forms Designer | Print stack for POs and vendor returns; gates addendum printing |
| Domestic / Import Addendum | Conditional extra PO paperwork by sourcing type |
| Dropped / Discontinued | Product purchase statuses gated by open sales quantity |
| Buying Group | Purchasing consortium feature; active with no buyer ⇒ PO on hold |
| Deduct Type | Line-level vendor deduction class: DFI, Bill Back, Cost-Reduced Bill Back, Rebate |
| Discounted Cost | The PO line cost after deductions, stored beside Unit Cost |
| Replacement cost | Product-master cost; both a PO cost default and a PO write target |
| Pay Prior to Receipt | PO flag producing a pending AP bill |
| Receive At | Receiving location on the PO header, distinct from Ship To |
| Reprints list | Queue of POs modified since last printing |
| Distributed Quantity | Sum of per-location quantities; must equal the line order quantity |

---

## Contract adjudication — batch 1

| Contract | Verdict | Basis |
|---|---|---|
| **W-005** | **CONFIRMED** | Special order sale creates a PO; gated by five settings across three files (F22) |
| **W-006** | **CONFIRMED** | Direct-ship POs owned by the originating sales/service order (F5, F22) |
| **W-041** | **relevant, not yet adjudicated** | Over-receipt handling depends on AP state; cost variance restated by hand (F19). Settle in batch 2 |
| **W-042** | **CONFIRMED in mechanism, fields still unknown** | PO line change updates attached sales orders (F11); special order instructions named as one propagated field (F23) |
| **W-044** | **CONFIRMED** | PO close is gated by accounting mode and receipt completeness; CLOSED set at End-of-Day (F20, F4) |
| **W-061** | **partially confirmed** | Unit / Discounted / Extended cost carried separately on every line (F2) |

---

## Next — batch 2: costing and cost exceptions

`Report Active Costing Exceptions` · `Report Solved Costing Exceptions` ·
`Report Purchase Orders with Changed Costs` · `Report Current Costs of Received Purchase Orders` ·
`Report Historical Costs of Received Purchase Orders` · `View Product Cost Activity` ·
plus `Daily Exceptions Cost Change Percent` and `Vendor Rebate Chargeback Method` in context.

Open target: **whether STORIS has any purchase price variance mechanism at all**, which run 1 left
unresolved and Finding 19 now suggests it does not.
