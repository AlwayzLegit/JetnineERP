# Run 03 — Sales Processing — Batch 7: Returns, Exchanges, Quick Sale, Carts and Pickups

**Status: complete.** 7 articles, two very large. Findings 64–75.

**This batch produces the run's clearest statement on GL timing.** See Finding 64.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Enter a Return** | /articles/15201424802068 | EXTRACTED — very rich |
| 2 | **Enter an Exchange** | /articles/15201424987796 | EXTRACTED — four steps, very rich |
| 3 | **Enter a Quick Sale** | /articles/15201424805012 | EXTRACTED |
| 4 | **Enter a Shopping Cart** | /articles/15201424798228 | EXTRACTED |
| 5 | Complete a Pickup without Accessing Order Entry | /articles/15201424992788 | EXTRACTED |
| 6 | Start Customer Pickup Monitor | /articles/15201425170196 | EXTRACTED — thin |
| 7 | Original Document Select Screen | /articles/15201408811412 | EXTRACTED |

Discovered and queued: **`Split Exchanges`** · `Quick Sale Control Settings` ·
`Shopping Cart Control Settings` *(PDA tab)* · `Electronic Merchant Settings` *(`Settlement Type`)* ·
`Alternate Tax Interface Control Settings` *(`Address Cleansing`)* · `Financing Control Settings`
*(`Use Original Merchant ID for Returns`)* · `View Detailed Activity for a Product` ·
`Customer Pickup Information Screen` · `Advanced Warehouse Management (AWM)` / `RF Bar Code` modules ·
`Review Pending Credit Requests` · `Suspend Automated Line Discounting`.

---

## B. Wiring findings

### FINDING 64 — Returns do not touch the general ledger until completion
Invariant (verbatim): "**Returns do not hit the general ledger until completion. Even though the refund
            transaction appears in the `Order Comments` file on the date of entry, the system does not
            allow the actual refund of the money until you receive the merchandise back into inventory
            and complete the return.**"
Card corollary (stated twice): "**When issuing credit card refunds, the system does not credit funds to
            the customer until you complete the customer return.**"
Posting location (verbatim): "**All returns post to the selling location except for transactions using
            STORIS' in-house credit card process** (specified at the **`Settlement Type`** field in the
            `Electronic Merchant Settings`), **where returns for credit card transactions post to the
            operator's log-on location.**"
Evidence:   Enter a Return, /articles/15201424802068
Maps to:    **W-052 / W-053 — CONFIRMED, and W-012 — CONFIRMED**

> The clearest GL statement in the entire audit. **Value moves when goods come back, not when the paper
> is written** — and the money genuinely does not leave until then, including on cards. That resolves
> the timing half of `W-052`/`W-053` for the return path and matches run 1's finding that the GL posts
> on transaction date.
>
> The posting-location rule is the subtle part: **returns normally post to the selling location, but
> in-house credit card returns post to whichever location the operator logged into.** So the same return
> lands in different books depending on the tender and the settlement type. For a multi-store business
> that is a real reconciliation trap, and it is stated in one sentence in a sales article.

### FINDING 65 — An exchange is one document with two net totals, and the sale discount is capped by the return
Structure (verbatim): "Page Headings: **Step 1 - Customer, Step 2 - Return Merchandise, Step 3 - Sale
            Merchandise, Step 4 - Payment**" · "**Both the return merchandise and replacement products
            are entered on a single document.**"
Two totals: **`RETURN NET TOTAL`** and **`SALE NET TOTAL`**, each with its own Merchandise Subtotal,
            Discount, Delivery Charge Refund/Pickup Charge, Installation Charge Refund/Restocking Fee,
            Miscellaneous Fees and Sales Tax.
Discount cap (verbatim): "**The subtotal discount amount on the sale portion of an exchange will not
            exceed: - the subtotal amount of the sale portion.** If it does, the subtotal sale discount
            amount is reduced to match. **- the subtotal discount amount on the return portion of the
            exchange.** If it does, the subtotal amount of the sale portion is recalculated. **This
            applies to fixed discount amounts only; percentage discounts and line discounts are not
            affected.**"
Downgrade rule (verbatim): "**If an uneven exchange is made for merchandise of lesser value, all
            subtotal discounts applied to the order are subject to the `Amount` field of `Minimum
            Eligibility Required` in `Sales Discount Settings`.** If this is the case, a message appears
            to alert the user who can determine if the transaction should proceed as a **`Split
            Exchange`**."
Evidence:   Enter an Exchange, /articles/15201424987796
Maps to:    **NEW**

> **The sale side's fixed subtotal discount cannot exceed what was discounted on the return side.** That
> is an anti-abuse rule with real teeth: a customer cannot exchange a discounted item for a full-price
> one and carry the discount across. Percentage and line discounts are exempt, which is a gap worth
> noting rather than reproducing blindly.
>
> Exchanging **down** in value re-tests every subtotal discount against a minimum-eligibility amount,
> and if it fails the operator is steered to a **Split Exchange** — a separate document type the audit
> has not yet read. `Return Salesperson` is a distinct field from `Salesperson`, so **the two halves can
> be credited to different people.**

### FINDING 66 — Exchanges can be held on entry under a dedicated credit hold code
Invariant (verbatim): "**If the `Exchanges on Hold at Entry` field is active in the Point of Sale
            Control Settings, the system puts exchange orders on `E1` Hold status pending approval from
            a user authorized via the `Approve E1 credit holds placed on customer exchanges` field in
            either the User file or User Group file.**"
Evidence:   Enter an Exchange, /articles/15201424987796
Maps to:    **run 1's 22 AR credit hold codes — a third code now bound to a sales event**

> `E1` joins `F5` (driver-licence failure) and `C6` (credit decision pending) as a hold whose trigger is
> now documented. **`E1` holds *every* exchange on entry** when the switch is on, awaiting a named
> approval permission — an all-exchanges-are-suspect control. Given batch 1 established that a credit
> hold blocks order completion and batch 3 that it blocks consolidation, **switching this on stops every
> exchange from being completed until a supervisor clears it.** That is a heavyweight control and the
> business will know whether they use it.

### FINDING 67 — Returning merchandise re-evaluates every discount on the remaining order
Invariant (verbatim, stated twice): "**Discounts associated with merchandise are reevaluated for
            qualification. The `Discounts - Override Sales Discount Restrictions` setting in Sales
            Security determines if a user is permitted to retain the discount.**"
Membership (verbatim): "**If a membership plan is being returned before the original order is completed,
            it is your responsibility to deactivate the customer's membership** via the `Active Member`
            box in `Advanced Customer Settings`." · "**Any additional membership discounts on the
            remaining open order needs to be manually removed** via the `Suspend Automated Line
            Discounting - Remove Discounts` extra action."
Evidence:   Enter a Return, /articles/15201424802068
Maps to:    **NEW — and it is a documented manual gap**

> Batch 2 found threshold discounts computed across the order against an `Inventory Formation` minimum.
> **Returning part of an order can therefore invalidate the discount on what remains** — and STORIS
> re-tests it, with a permission deciding whether the operator may keep it anyway.
>
> But **membership is not automatic**: the docs say twice that deactivating the membership and stripping
> its discounts are **the operator's responsibility**, by hand, in two different screens. That is an
> explicit statement that the system leaves a known-inconsistent state behind. Anything we build should
> close that; for now it is a live revenue leak worth measuring.

### FINDING 68 — Return windows, audit text and protection-plan cancellation each have their own override
Return window: "To allow a user to return merchandise past the number of days set in **`Allowed Number
            of Days on Return`** in POS Control Settings, use the **`Override Allowed Number of Days on
            Returns`** setting in Sales Security."
Audit text (verbatim): "When saving a new return, and **`Require Audit Text on Returns`** within POS
            Control Settings is enabled, the user is prompted to enter audit comments in the **`Text
            Entry`** window. If no comment(s) is entered… '**Audit comments must be entered before saving
            the order.**'" — the same applies to **`Require Audit Text on Exchanges`**.
Protection plan (verbatim): "**a message to override and cancel the protection plan is displayed. Select
            `No` to not allow the plan cancellation and have it removed from the Return order. Select
            `Yes`, and the Sales Security setting, `Override Protection Plan Cancellation Restriction
            Days`, is reviewed.** … **If a security override is processed, an order comment is
            generated.**"
Return location: "**`Complete Returns for Return Locations Other Than Login Locations`** setting **is
            checked by default**… When unchecked, returns may not be completed with varying login
            locations."
Evidence:   Enter a Return, /articles/15201424802068
Maps to:    **extends the audit-switch family to seven; W-050**

> Run 1 found four opt-in audit switches, run 2 a fifth, batch 1 a sixth. **`Require Audit Text on
> Returns` / `on Exchanges` is a seventh** — and unlike the mandatory-comments switch of batch 1, this
> one **blocks the save outright** rather than offering codes.
>
> The protection-plan path is better designed than batch 5's: here the override is **permissioned and
> generates an order comment**, where the adjustment path (batch 5 F48) only warned. Same restriction,
> two different enforcement strengths depending on which routine you cancel from.

### FINDING 69 — Returns without an original order create untracked, unpriced inventory
Invariant (verbatim): "**When the price of non-saleable inventory items is changed, this information is
            available on the `View Detailed Activity for a Product`, on the As-Is Inventory Detail page.
            Returns and exchanges without an original order are not assigned a selling price and no
            record is included in the inventory activity.**"
Line field: **`Return to As-Is`** · **`Reason Return Code`** · **`Original Purchase Price`**
Evidence:   Enter a Return, /articles/15201424802068; Enter an Exchange, /articles/15201424987796
Maps to:    **W-061 — relevant; and a data-quality finding**

> **A return with no original order produces inventory with no selling price and no activity record.**
> Run 2 found as-is pieces carry a reason code, a date and a cost that follows the GL posting method
> (run 2 F118); this says the *price* side is simply absent when provenance is missing.
>
> That matters because run 2 also found as-is discounts are restricted by reason code (batch 1) and
> as-is spiff is awarded from a table at completion (batch 2 F24). **A no-original-order return enters
> that machinery with a hole in it**, and nothing flags the piece as differently sourced.

### FINDING 70 — Quick Sale is a deliberately constrained take-with-only path with a default customer
Constraints (verbatim): "**You can use Quick Sale Entry for take-with transactions only.**" ·
            "**The Quick Sale feature limits you to entering new transactions only. You cannot re-open
            and edit existing quick sale transactions. The sell date is always the current date and the
            sell location is always the current location.**" · "**Quick Sale Entry does not support
            Shopping Cart processing or Product Configuration (unless the configurated products are in
            stock).**" · "**if the default warehouse location for the log-on user has the WMS Interface
            active, an error message appears and the system returns to the menu.**"
Default customer (verbatim): "**The system does not require you specify a customer** for each
            transaction. The system provides a default '**Fast Cash Customer**' you can use for all sales
            in which you don't specify a customer. In this way, you can use the Quick Sale Customer to
            **track Quick sales in the system**."
Customer lock: "**After you enter a payment, the `Customer` field becomes inactive**… However, if you
            have entered a payment but not a customer, **you can delete the payments made for this
            transaction to re-activate the `Customer` field.**"
Prerequisite: "**auto numbering for sales orders must be active at the `Next Transaction Number` field
            in the Point of Sale Control Settings.**"
Evidence:   Enter a Quick Sale, /articles/15201424805012
Maps to:    **NEW**

> A cash-and-carry lane with **five deliberate exclusions**, an **immutable record** (no reopening, date
> and location fixed), and a **synthetic "Fast Cash Customer"** so anonymous sales still aggregate
> somewhere. Two things echo earlier findings: **take-with requires payment in full** (batch 4 F34), and
> **auto-numbering is a functional prerequisite** — the second time a numbering setting gates a feature,
> after run 2's eSTORIS auto-PO rule.
>
> The customer-field lock is a small, well-judged rule: **payment freezes the customer**, but deleting
> the payment unfreezes it, so a mis-scanned anonymous sale is recoverable.

### FINDING 71 — Shopping carts are customerless, expiring, and deleted at End-of-Day
Invariant:  "**Unlike other order entry processes, a customer does not have to be specified for a
            shopping cart.**"
Conversion: "enter the **`Shopping Cart ID`** into the `Order Number` field in Sales Order Entry…
            **if a cart contains multiple hard kits, Sales Order Entry creates a line item for each kit**
            when you convert."
Deletion (verbatim): "**The system deletes shopping carts after conversion. The system deletes carts
            that are older than the number of days specified at the `PDA Shopping Cart Retention Days`
            field on the PDA tab of the `Shopping Cart Control Settings`; carts are deleted during the
            `Generate Daily Reports` process.**"
Sources:    "You can also create shopping carts using **eSTORIS or eRoam**."
Header:     **`Available to Deliver`** · **`Available to Pickup`** · `Salesperson` ·
            *(Other Details)* **`Purchase Time Frame`** · `Status of Cart` · `Created Date` · `Time` ·
            **`Source`**
Evidence:   Enter a Shopping Cart, /articles/15201424798228
Maps to:    **NEW — and an eighth End-of-Day behaviour**

> Carts are **pre-customer, pre-reservation interest lists** with a retention timer, purged by
> End-of-Day. Run 2 counted nine End-of-Day merchandising behaviours; **cart purging is a sales-side
> tenth**, and it means abandoned-cart analysis has a hard horizon set by one setting.
>
> **`Purchase Time Frame`** and **`Source`** are genuine CRM fields — when the customer intends to buy,
> and where the cart came from (in-store, eSTORIS, eRoam). Combined with the salesperson stamp, the cart
> is the closest thing in this section to a pipeline record, and batch 12's sales-lead machinery will
> presumably meet it.

### FINDING 72 — Pickup completion has a dedicated, deliberately restricted screen with signature capture
Invariant (verbatim): "**For security reasons, this routine does not allow changes to an order, and you
            cannot use this routine to complete a layaway order.**"
Balance:    "**If you attempt to save an order with a balance due, a warning message appears but you can
            proceed.**"
Signature (verbatim): "**If `Signature Capture` is active for this routine, then when you click on
            `Save`, a prompt appears with the option to capture a customer signature. If you choose to
            save the signature to disc, you can view it later by accessing the completed order**… the
            system either **prompts you each time** to save the signature to disc, **or saves the
            signature automatically when the customer taps `Accept`** on the signature pad."
Multi-fulfilment: "the **earliest Customer Pick Up fulfillment by fulfillment date for which the ticket
            has been printed** displays."
WMS:        "**If WMS is active, this routine is not available for WMS locations.**"
Monitor:    `Start Customer Pickup Monitor` — a refreshing status board for "a customer waiting room";
            requires **AWM and RF Bar Code modules**.
Evidence:   Complete a Pickup without Accessing Order Entry, /articles/15201424992788;
            Start Customer Pickup Monitor, /articles/15201425170196
Maps to:    **NEW**

> A read-only completion terminal for the loading dock: **it can invoice but not edit**, which is
> exactly the right shape for a screen sitting where customers are. The **balance-due warning is
> bypassable**, so goods can leave against money owed — deliberate, but worth a control decision.
>
> The **signature is stored to disc and retrievable from the completed order**, which makes it the one
> piece of proof-of-delivery this run has found. Batch 5 found the same ceremony on payments; together
> they are the business's signed-evidence trail.

### FINDING 73 — Financed returns choose a merchant ID by a single setting, and it changes which entity is credited
Invariant (verbatim): "**If `Use Original Merchant ID for Returns`, in `Financing Control Settings`, is
            enabled, the return is processed using the merchant ID for the location the original order
            was authorized from. When not checked, the return authorization transmission process uses
            the merchant ID from the location the user is logged into.**"
Scope (verbatim): "used for processes in which a return can be processed, that is, **`Enter an Exchange`
            (for a credit exchange) and `Adjust Dollars on a Completed Order` (credit adjustment).**"
Evidence:   Enter a Return, /articles/15201424802068
Maps to:    **NEW — and it pairs with Finding 64**

> A second location-attribution rule, on the financing side this time, and it can point the **opposite
> way** from the credit-card rule in Finding 64: card returns under in-house settlement post to the
> *log-on* location, while financed returns post to the *original* location when this setting is on.
> **Three tenders, three attribution rules, two settings.** Reconciling store-level returns therefore
> requires knowing the tender, the settlement type and this switch.

### FINDING 74 — Exchange edits are permissioned by portion, and splitting is the documented escape
Invariant:  "This process checks the **`Edit Return Portion of Existing Exchange`** field in Sales
            Security to ensure that the user has permission to update the return portion. **Otherwise,
            the user can only view the return portion of the exchange in inquiry mode.**" *(stated twice
            — for Step 2 and for the Step 4 Return Details)*
Invariant:  "**STORIS restricts certain edits to existing exchanges, but allows some of those edits if
            you split the exchange.**"
Even exchange: "**An even exchange can be completed for orders that were paid for with an installment or
            Rent To Own (RTO) financing plan.**… **If 'Even Exchange' is not visible, a separate return
            and sale need to be created.**"
Deposit rule: "To add or delete line items on orders to which deposits and/or financing have been
            applied, user access must be granted via the **`Able to Delete or Add Lines When Deposit
            Applied`** field in either the User or User Group files."
Evidence:   Enter an Exchange, /articles/15201424987796
Maps to:    **W-050 — and a third name for the same permission**

> **The return half of an exchange is separately permissioned from the sale half**, and a user without
> it sees the return in inquiry mode only. That is a sensible segregation — the return side is where
> money leaves.
>
> **`Split Exchanges` is the documented workaround** for edits STORIS otherwise refuses, and it now
> appears twice (here and in Finding 65's downgrade path). It is an unread article and belongs in the
> next batch.
>
> Note the naming drift: the deposit-line permission has now appeared as **`Delete/Add line items on
> transactions with deposits applied`** (batch 1, Sales Security), **`Delete/Edit line items on
> transactions with deposits applied`** (batch 5, Extended Security) and **`Able to Delete or Add Lines
> When Deposit Applied`** (here, User/User Group). Three names, three homes, presumably one control.

### FINDING 75 — Discount code availability is filtered by the customer's price category, by exclusion
Invariant (verbatim): "When building the available discount code list for an order, the **`Customer Price
            Category`** in each sales discount code is reviewed. **Discount codes with a customer price
            category that matches the same category for the customer is excluded from the dropdown** and
            available discount codes are displayed once a customer number has been entered."
Evidence:   Enter an Exchange, /articles/15201424987796
Maps to:    **NEW — and it reads as inverted**

> As printed, **a discount whose customer price category *matches* the customer's is excluded**. That is
> the opposite of what one would expect, and it is stated once, in one article, in one sentence.
>
> The plausible reading is that customers on a price category already receive that pricing through the
> hierarchy (batch 2 Finding 15, level 2), so offering the matching discount again would double-count.
> **But the documentation does not say that**, and the sentence is grammatically rough. Recorded
> verbatim and flagged: **this needs confirming against the live system**, because it decides which
> discounts a salesperson can even see.

---

## C. Screen and field inventory

**Enter a Return** — pages **Customer · Merchandise · Payment**. `Return Number` · `Last Order` ·
**`Available Credit`** · Fulfillment Method · Original Order · Date · Store · Salesperson · customer,
billing and shipping blocks · *(Pickup Information)* Date · **`Return Location`** · Route ·
Instructions · Print Delivery Instructions · **`Return Handling Method`** · Contact Status/Date/Business
Contact · *(Merchandise)* Product · Brand · **`Quantity Returned`** · **`Original Purchase Price`** ·
Unit Price · Extended Price · **`Reason Return Code`** · **`Return to As-Is`** · *(Payment)* Discount
Code/Amount · **`Delivery Charge Refund/Pick-Up Charge`** · **`Installation Charge Refund/Restocking
Fee`** · Miscellaneous Fees · Protection Plan Amount · Sales Tax · Payment Type Code · Total Payment
Amount · **`Issue Refund Check`** · Total Financed Amount · Net Total · **`Refund Due`** ·
**`Print Pickup Ticket`** · **`Complete Customer Return`**.

**Enter an Exchange** — pages **Step 1 Customer · Step 2 Return Merchandise · Step 3 Sale Merchandise ·
Step 4 Payment**. Adds **`Return Salesperson`** · *(Delivery Information)* Ship From Location ·
Manifest Location · Route · *(Pickup)* Pickup Location · **`Sale Handling Method` / `Return Handling
Method`** · **`Number of Postponements`** · *(Step 4)* **`RETURN NET TOTAL`** and **`SALE NET TOTAL`**
blocks · `Net Sale` · Payment · Balance Due · **`Print Delivery/Pickup Ticket`** ·
**`Complete Exchange`**.

**Enter a Quick Sale** — Quantity Ordered · **As Is** · Product · Unit Price · Extended Price ·
Discount Code · Discount Amount · Line Item Display · Protection Plans · Subtotal Discounts ·
Order Information · **`Finish and Pay`** · Merchandise Subtotal · Discounts · Sales Tax · Net Total
*(all display-only)* · **Escapes** · Actions.

**Enter a Shopping Cart** — **`Shopping Cart ID`** · Salesperson · **`Available to Deliver`** ·
**`Available to Pickup`** · Product · Brand · ATP/ATC Date · Quantity Ordered · Quantity Available ·
Unit Price · Extended Price · Stock Location · **`Line Status`** · Fulfillment Method ·
*(side panel)* Estimated Totals · Customer Code · First/Last/Middle Name · Email · **`No Auto Email`** ·
Cell Phone · Alternate Name/Relationship · Home/Work Phone · Address · **`Delivery Route`** ·
**`Purchase Time Frame`** · Store · Ship Location · **`Status of Cart`** · Created Date · Time ·
**`Source`**.

**Complete a Pickup without Accessing Order Entry** — Order Number · Selling Store · Customer Code ·
Home/Work Phone · Document Date · Salesperson · **`Pick Up Date`** · Product Number ·
**`Quantity Picked Up`** · grid · Save.

**Original Document Select Screen** — Customer Name · Current Document · Original Document · Product ·
**Camera button** *(product image, dimmed when none exists)* · **`Select Quantity`** *(defaults to the
original quantity sold)* · Add → Inventory Selection.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`Exchanges on Hold at Entry`** | POS Control Settings | **Every exchange goes on `E1` hold** |
| `Allowed Number of Days on Return` | POS Control Settings | Return window |
| **`Require Audit Text on Returns` / `on Exchanges`** | POS Control Settings | **Seventh audit switch; blocks save** |
| `Next Transaction Number` auto-numbering | POS Control Settings | **Prerequisite for Quick Sale** |
| `Settlement Type` | **Electronic Merchant Settings** | Whether card returns post to selling or log-on location |
| **`Use Original Merchant ID for Returns`** | **Financing Control Settings** | Which location's merchant ID processes a financed return |
| `Address Cleansing` | **Alternate Tax Interface Control Settings** | Validates entered addresses |
| `PDA Shopping Cart Retention Days` | **Shopping Cart Control Settings** → PDA | Cart purge horizon; executed at End-of-Day |
| (various) | **Quick Sale Control Settings** | Quick Sale customisation |
| `Complete Pickup Transactions Without Accessing Order Entry` | **Payment Card and Device Settings** | Signature capture on the pickup screen |
| `Minimum Eligibility Required` (Amount) | Sales Discount Settings | Re-tested when an exchange downgrades in value |
| **`Customer Price Category`** | Sales Discount Settings | **Excludes matching discounts from the dropdown** |
| `Active Member` | Advanced Customer Settings | **Manually** deactivated when a membership is returned |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| **`Approve E1 credit holds placed on customer exchanges`** | User / User Group | Releasing exchanges from `E1` |
| `Override Allowed Number of Days on Returns` | Sales Security | Returning outside the window |
| **`Override Protection Plan Cancellation Restriction Days`** | Sales Security | Cancelling a plan late; **generates an order comment** |
| `Discounts - Override Sales Discount Restrictions` | Sales Security | Retaining a discount that no longer qualifies |
| `Complete Returns for Return Locations Other Than Login Locations` | Sales Security | **Checked by default**; completing cross-location returns |
| **`Edit Return Portion of Existing Exchange`** | Sales Security | Editing vs viewing the return half |
| `Enter/Edit a Sales Order` | Sales Security | Quick Sale; converting a cart |
| `Able to Delete or Add Lines When Deposit Applied` | User / User Group | Third name for the deposit-line permission |

---

## F. State machines and enumerations

**Document types in this section** — sales order · quote · layaway · shopping cart · **return** ·
**exchange** · **split exchange** · quick sale · dollar-only adjustment.
**Exchange structure** — one document, **two net totals** (return, sale), two salespeople.
**Credit hold codes now bound to sales events (4)** — `F5` driver-licence · `C6` credit pending ·
**`E1` exchange at entry** · missing finance authorisation number.
**Return posting location** — selling location, **except** in-house credit card settlement ⇒ log-on
location; financed returns ⇒ original or log-on per `Use Original Merchant ID for Returns`.
**Quick Sale constraints** — take-with only · new transactions only · current date and location ·
no carts · no configuration unless in stock · not available at WMS locations.
**Cart lifecycle** — created *(in-store, eSTORIS, eRoam)* → converted *(deleted)* or aged out *(deleted
at End-of-Day per retention days)*.
**End-of-Day sales behaviours** — shopping cart purge *(tenth EOD behaviour in the audit)*.

---

## G. Sequencing rules

1. **Returns post to the GL only on completion**, after merchandise is received back into inventory.
2. Credit card refunds are not credited until the return completes.
3. Exchanges go on `E1` hold at entry when the switch is on, blocking completion until approved.
4. Returning merchandise re-evaluates discounts on the remainder; membership must be handled by hand.
5. A late protection-plan cancellation requires an override and writes an order comment.
6. Fixed subtotal discounts on the sale half cannot exceed those on the return half.
7. Downgrade exchanges re-test subtotal discounts against minimum eligibility; failure steers to a split.
8. Quick Sale requires auto-numbering and is take-with only; payment freezes the customer field.
9. Carts are deleted on conversion, or at End-of-Day once past their retention days.
10. Pickup completion cannot edit the order and cannot complete layaways.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Split Exchanges`** — referenced twice as the escape route for restricted edits and failed
  eligibility. **Highest-priority unread article for batch 8.**
- `Quick Sale Control Settings` · `Shopping Cart Control Settings` · `Electronic Merchant Settings` ·
  `Financing Control Settings` · `Alternate Tax Interface Control Settings`.
- `Review Pending Credit Requests` — where `C6`-held orders wait.
- `Customer Pickup Information Screen` · AWM / RF Bar Code modules.

**Documented but ambiguous**
- **The `Customer Price Category` exclusion rule (F75)** reads inverted and is stated once. **Must be
  confirmed against the live system** — it decides which discounts appear.
- **`Return Handling Method` / `Sale Handling Method`** — `Handling Method` is now unexplained across
  four batches and two runs.
- **`Reason Return Code`** vs the as-is `Reason Code` — one list or two?
- **What an even exchange does to an installment/RTO plan** — permitted, but the plan mechanics are not
  described.
- **Whether a returned warranty or protection plan is prorated** — still open from batch 6.
- **`Available to Deliver` / `Available to Pickup`** on the cart header — availability by fulfillment
  method, presumably, but undefined.
- **`Status of Cart`** and **`Purchase Time Frame`** enumerations.
- **`Line Status`** on the cart — the same nine codes as an order, or a different set?
- Whether the three names for the deposit-line permission are genuinely one control.

**Inferences (not in section B)**
- The `Customer Price Category` exclusion presumably avoids double-discounting customers who already get
  category pricing through the hierarchy; **the docs give no reason at all**.
- `Available to Deliver` / `Available to Pickup` presumably show quantity available by method; not stated.
- The three deposit-line permission names are presumably one control documented inconsistently; the
  articles place it in three different files.

---

## I. Unknown unknowns

- **Returns not hitting the GL until completion**, with the refund visible in comments from entry.
- **Return posting location varying by tender and settlement type.**
- **A financed return's merchant ID chosen by a setting**, pointing the opposite way from cards.
- **One exchange document carrying two net totals and two salespeople.**
- **The sale half's fixed discount capped by the return half's.**
- **`E1` — a hold placed on every exchange at entry**, with its own approval permission.
- **Membership deactivation and discount removal left explicitly to the operator.**
- **Returns without an original order producing unpriced, unrecorded inventory.**
- **A synthetic "Fast Cash Customer"** for anonymous quick sales.
- **Payment freezing the customer field**, reversible by deleting the payment.
- **Carts purged at End-of-Day** on a retention timer — a tenth EOD behaviour.
- **Carts originating from eSTORIS and eRoam**, carrying `Purchase Time Frame` and `Source`.
- **A pickup terminal that can invoice but not edit**, with a bypassable balance-due warning.
- **Signatures saved to disc and retrievable from the completed order.**
- **A discount dropdown that excludes codes matching the customer's price category.**

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| E1 hold | Credit hold placed on every exchange at entry when the switch is on |
| Split Exchange | Separate document type; the escape route for restricted edits and failed eligibility |
| Return to As-Is | Line flag routing returned goods into as-is inventory |
| Reason Return Code | Return reason; relationship to the as-is reason list unstated |
| Fast Cash Customer | Default customer for anonymous quick sales |
| Shopping cart | Pre-customer interest list; purged on conversion or at End-of-Day |
| Purchase Time Frame / Source | Cart CRM fields: when the customer intends to buy, and where the cart came from |
| Use Original Merchant ID for Returns | Setting choosing which location's merchant ID processes a financed return |
| Settlement Type | Electronic Merchant Settings field deciding where card returns post |
| Customer Price Category | Discount-code attribute that **excludes** matching codes from the dropdown |

---

## Contract adjudication — batch 7

| Contract | Verdict | Basis |
|---|---|---|
| **W-052 / W-053** | **CONFIRMED** | "Returns do not hit the general ledger until completion"; posting location varies by tender (F64) |
| **W-012** | **CONFIRMED** | GL timing tied to physical receipt, not entry date (F64) |
| **W-050** | **CONFIRMED, extended** | Eight permissions in one batch, including per-portion exchange editing (F66, F68, F74) |
| **W-061** | **relevant** | Returns without an original order carry no selling price (F69) |
| **W-055 / W-056** | **relevant** | Exchanges reuse alternate stock location and ATP logic wholesale (F65 context) |

---

## Next — batch 8: customers, merges, addresses and verification
