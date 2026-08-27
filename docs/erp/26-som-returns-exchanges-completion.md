# Returns, Exchanges, Adjustments & Completion — Screen-Level Specification

Covers screens **9** (Adjust Dollars on a Completed Order), **21** (Commission/Spiff Updates), **49**
(Enter a Commission Adjustment), **54** (Enter a Return), **58** (Enter an Exchange), **94** (Multiple
Salesperson Commission), **98** (Order Completion Details), **99** (Order Completion Exceptions),
**100** (Order Completion Process), **104** (Original Document Select), **105** (Original Order Piece
Selection).

`02` §5 has the completion gate and its effects; `03` has the order wizard and the operator sequence.
Neither is repeated. Field sets identical to the sales order are cross-referenced, not restated — what
follows is what differs. Tagging convention: `SOURCES.md`.

---

## 1. Transaction taxonomy

Four sibling programs move money against a customer. They share the wizard shell, the customer block
and the completion machinery, and differ in four ways: sign of merchandise, inventory effect, whether
an original document is required, and what completion posts.

| | Sales Order (`03`) | Return (54) | Exchange (58) | Dollars-only Adjustment (9) |
|---|---|---|---|---|
| Steps | 4: Customer · Merchandise · Fulfillment · Payment | 3: Customer · Merchandise · Payment | 4: Customer · **Return Merchandise** · **Sale Merchandise** · Payment | 3: Customer · Merchandise · Payment |
| Merchandise sign | positive | negative | **both halves on one document** | signed amount, no quantity movement |
| Fulfillment | full model, many per order | one pickup: `R` Regular Pick Up / `C` Customer Drop Off | one method for the document: Delivery / Customer Pickup / Take With | **none** |
| Original document | n/a | **required field**, even when none exists | **required field**, even when none exists | required, same rule |
| Inventory | reserves, relieves on completion | receives merchandise back (regular or As-Is) | receives the return half, relieves the sale half | **none — inventory is not touched** `[DOC]` |
| Completion control | `Complete` per fulfillment | `Complete Customer Return` (Payment page) | `Complete Exchange` (Payment page) | implicit: Save → Completion Date Entry |
| GL timing | on completion (invoice) | **on completion only** `[DOC]` | on completion of the relevant half | on save/completion |
| Refund routing | n/a | drawer / refund check / A/R credit / finance provider / forced gift certificate | same set, off `Balance Due` | same set, off `Refund Due` |
| Commission date | own written date | **written date of the original invoice** | per half; return half suffixed `e` | **written date of the original invoice** |

Identity rules for the data model `[DOC]`:

```
Exchange document number    N        → the sale half
Exchange return half        N + "e"  → addressed separately for commission adjustment
Split Exchange              N        → becomes TWO documents: one customer return + one sales order
Re-invoice / back-order suffix       → root invoice + A..Z then a..z  (02 §5)
```

`[DECIDE]` `02` §1 flags that STORIS never publishes a canonical order-type list. Screen 49 comes
closest — `Sale | Return | Exchange Sale | Exchange Return | Dollar Adjustment` `[DOC]` — and it treats
the exchange halves as **separate document types**. Model the exchange as a parent with two child
documents, not one row with two subtotals: commission, completion, split and refund routing all
address the halves independently.

---

## 2. Enter a Return (54)

Five menu paths reach one program `[DOC]`; one route in the replacement is fine. A read-only variant
exists as *View an Existing Sales Order*.

**Header** `[DOC]`. *Return Number* auto-assigns via Enter or the Plus button. When `Automated & Manual
POS Numbers` is blank and the operator keys a **completed or voided** number, the system says the order
exists and asks whether to view it in inquiry mode — Yes read-only, No re-prompt. *Last Order* recalls
the last saved return, hidden on first access, from the main menu, after completion or deletion, and in
read-only view; recalled orders stay subject to security. `Point of Sale User Verification` may demand
user id and password right after the number is keyed.

### 2.1 Step 1 — Customer

```
Fulfillment Method   R = Regular Pick Up   (store collects the item from the customer)
                     C = Customer Drop Off (customer brings it to the store)
```

Editable until the return appears as a Regular Pick Up on a delivery manifest, then inquiry-only.
Default from the `Returns` field, POS Control Settings General tab, or no default `[DOC]`.

Fields carrying rules beyond `03`'s customer step `[DOC]`:

- **Original Order** — **required even when no original exists** (§4.3).
- **Customer Number** — the **credit-to** customer. Defaults from the original document and **may
  legitimately differ from the customer on the original sale**. **Required** when the original is a
  quick-sale order or unavailable. A merged code offers the "merged to" record, whose code is used.
- **Pickup Information Date** — Regular Pick Up only. **A pickup date is not required until you attempt
  to complete the order** — refund intent can be recorded before logistics settles.
- **Return Location** — defaults from log-in. Completing when it differs from the log-in location needs
  `Complete Returns for Return Locations Other Than Login Locations` (checked by default); unchecked
  raises a security override.
- **Return Handling Method** — Delivery and Customer Pickup only; `None Selected` and inactive for Take
  With / Direct Ship. Changing it after a ticket printed warns, and continuing counts as an override.
- **Route** — from Update Zip Code Settings via the customer zip; **once the order is on a manifest the
  route cannot be changed**.
- Date (no future dates, no closed periods; overlap-month backdating needs `Backdate Transactions`),
  Store, Salesperson, billing/shipping (50-character combined-name limit; highest-priority phone per
  type) and contact-status fields behave as in `03`.

### 2.2 Step 2 — Merchandise

If the original sales document exists, **Original Order Piece Selection** (§4.2) opens automatically
and the chosen pieces populate the grid. **A reason for returning must be selected before proceeding**
`[DOC]`.

| Field | Behaviour `[DOC]` |
|---|---|
| Quantity Returned | quantity coming back `[PARTIAL]` — see §8.4 |
| Original Purchase Price | display: original selling price minus adjustments; **not editable** |
| Unit Price | editable, seeded from original selling price minus adjustments; two reduction rules below |
| Extended Price | display: Unit Price × Quantity Returned |
| Reason Return Code | a **restricted** As-Is code (`This Reason is Used For` = "As-Is Restricted") needs Logistics Security or manager override |
| Return to As-Is | checked → received into **As-Is** inventory; blank → regular inventory. Defaults checked when `Return Pieces to As-Is` is on |

Two independent price reductions, both capped at the original price `[DOC]`:

1. **Prorated warranty** — with `Prorate Returned Warranties` on, a returned linked warranty gets a
   prorated price; `Change reduced warranty price; not exceeding original price` allows raising it up
   to, not past, the original.
2. **Reduced return percentage** — from Costing Control Settings or Group Settings; `Change reduced
   return price; not exceeding original price` allows raising it to the original selling price minus
   adjustments.

`[DOC]` **The cost reduction does not change when the reduced price is edited.** That asymmetry is the
screen's margin trap: raising the refund raises the credit without restoring cost, so line margin moves
silently. Show both numbers.

Grid: Product · Description · Status · Return to As Is · Quantity Ordered · Unit Price · Extended
Price; *More* adds Second Description · Vendor Model Number · Regular Selling Price · Brand. Rows are
not editable in place — *Edit* highlights the row yellow and loads it upward; *Remove* confirms with
"Yes" / "Cancel". After the add, **Inventory Selection** may prompt for Quantity, Reference Number,
Storage Location (when tracked) and Reason Code.

### 2.3 Step 3 — Payment: sign convention and refund routing

The most error-prone rule on the page `[DOC]`:

```
Delivery / Pickup charge, Installation charge, Restocking fee:
    POSITIVE → REFUNDED to the customer  (increases the credit)
    NEGATIVE → CHARGED  to the customer  (reduces the credit)
```

Inverted relative to a sales order. Keep STORIS' labels ("Delivery Charge Refund", "Installation Charge
Refund") and show a running signed total, or operators will refund freight they meant to keep.

- **Discount Code / Amount** — the original order's subtotal discounts. **Removing a discount or
  reducing it increases the refund.** When the code list is built, each code's Customer Price Category
  is compared with the customer's and **matching codes are excluded** from the dropdown (§8.4 — this
  reads backwards). **Additional Discounts → Discount Amount** carries from the original and **cannot
  be changed**.
- **Restocking fee** — auto-calculated when `Restocking Fee on Returns` holds a value; overridable with
  Sales Security. A new calculation overwrites a prior override; **once manually overridden the charge
  is never recalculated again**; and **overridden charges are written to the transaction's audit
  comments** `[DOC]`. That audit write is the only trace of a waived fee.
- **Installation charge on an RTO-financed order** needs both `INSTALLATION CHARGE - Allow installation
  charge on RTO orders by state/province` (Finance Provider Settings) and `Allow Installation Charges on
  Orders with RTO Plans` (Sales Tax Settings).
- **Totals** — Merchandise Subtotal (return merchandise before tax and discounts) · Discounts · Charges
  and Fees · **Net Total** (including discounts, tax, delivery/pickup and installation/restock;
  **excludes deposits and financing**) · Refunds · **Refund Due**. Protection Plan Amount and Code are
  display-only and cumulative.

**Refund routing — five destinations** `[DOC]`:

```
1. Out of the drawer  → payment type + amount in the Payment Summary Window (Refunds → Payments)
2. Refund check       → check "Issue Refund Check"; on save an AP check is created
3. A/R credit         → enter NOTHING in Payment Summary, leave Issue Refund Check clear, Save
4. Finance provider   → Financing → Payment Type Code → Finance Receivable Entry (or Card Swipe)
5. Gift certificate   → forced, not chosen (non-refundable tender rule below)
```

Constraints `[DOC]`:

- **Gift certificate payment types cannot be selected via the Payment Summary Window** on a return or
  an exchange.
- **Non-refundable tender forces a certificate.** Where the original was paid with a `Rewards Gift
  Card` or `In-Store Use Only Gift Card`, Cash cannot be entered or selected; the message states that
  no payments on the completed order are available for refund and **a Rewards or In-Store Use Only gift
  certificate is issued instead, based on the original payment**. A refund check is refused with the
  same substitution.
- **Builder allowance certificates** cannot be refunded directly — an in-store-use-only certificate is
  issued (payment type from Accounts Receivable Control Settings). Mixed with another tender, the
  credit remaining after the certificate may post to the customer's open-item account, or become an AP
  check when `Issue Refund Check` is selected.
- **Credit-card refunds are not credited to the customer until the return is completed.**
- `Issue Refund Check` is **inactive for a customer not required to provide a valid address**.
- `Use Original Merchant ID for Returns`: on → the return transmits under the merchant id of the
  location that authorized the original order; off → the logged-in location's. Applies to Enter a
  Return, credit exchanges and credit adjustments.

*Print Pickup Ticket* needs `Print a Customer Pickup Ticket Within POS Entry`; inactive for Customer
Drop Off and until a pickup date is scheduled. *Complete Customer Return* is available **only for a
Regular Pick Up whose pickup ticket has been printed**.

### 2.4 Return business rules `[DOC]`

- **Returns do not hit the general ledger until completion.** The refund appears in the Order Comments
  file on the entry date, but **money may not move until the merchandise is received back into
  inventory and the return is completed.** This is the central control in the module: an
  entered-but-uncompleted return is an intent record, not a liability.
- **Posting location.** Returns post to the **selling** location — except transactions using STORIS'
  in-house card process (per `Settlement Type`), where credit-card returns post to the **operator's
  log-on** location. Carry both fields.
- Returning past `Allowed Number of Days on Return` needs `Override Allowed Number of Days on Returns`.
- **Audit text.** With `Require Audit Text on Returns` on, an empty Text Entry window yields
  > "Audit comments must be entered before saving the order."

  and the window reappears. `Require Audit Text on Exchanges` behaves identically on 58.
- **Protection plan cancellation.** With `Cancellation Restriction Days` set and covered products being
  returned, the **first item completion date that activated the plan** is examined; over the limit, an
  override message appears. **No** → cancellation is not allowed and **the plan is removed from the
  Return order**. **Yes** → `Override Protection Plan Cancellation Restriction Days` is checked;
  without it the operator may request an override from someone who has it. **A processed security
  override generates an order comment.**
- **Membership.** Returning a membership plan before the original order completes obliges the operator
  to deactivate the customer's membership (`Active Member`) and remove remaining membership discounts
  manually via `Suspend Automated Line Discounting - Remove Discounts`. A membership product may be
  added to a return only when the customer has **no open orders** and within `Number of Days that a
  Membership Product Can be Added to a Return`.
- A returned serial-tracked product **keeps the serial number it was sold with.**
- Discounts on returned merchandise are **re-evaluated for qualification**; `Discounts - Override Sales
  Discount Restrictions` decides whether an operator may keep one that no longer qualifies.
- **Returns and exchanges without an original order are not assigned a selling price, and no
  inventory-activity record is written.**
- Service orders: parts, labour and charges **cannot** be returned or exchanged, but dollars-only
  adjustments **are** allowed against them.
- Tax can be zeroed via Actions → Order Tax Information: locate the tax and check `Zero Tax Amount`.

### 2.5 Save sequence, verbatim

```
Save (Payment page)
 ├─ Issue Refund Check NOT selected →
 │     "Upon document completion, an A/R credit of NNN.NN will be posted."
 │       Yes → posts the A/R credit to the customer's account
 │       No  → returns to the Payment page
 ├─ Issue Refund Check SELECTED →
 │     "NNN.NN Credit. Will create refund check.   OK   Cancel"
 │       OK     → creates a refund check
 │       Cancel → returns to the Payment page AND the Issue Refund Check
 │                check-mark is cleared automatically
 ├─ Complete Customer Return checked → Completion Date Entry (enter date, OK)
 └─ "Would you like a printed copy of this return?  Yes  No."
```

`[INFER]` The prompts encode the rule that the last chance to choose between an A/R credit and a check
is at save — and that cancelling the check silently reverts intent to "A/R credit". Reproduce the text
and the auto-clear, but **log which of the five destinations was taken**: that is exactly the fact an
auditor needs.

---

## 3. Enter an Exchange (58)

Same five menu paths. `Enter a New Exchange` (Sales Security) is required to create one; without it the
program is view-only.

### 3.1 The two-halves model

```
Step 1  Customer            shared header; ONE fulfillment method for the document
Step 2  Return Merchandise  the RETURN half — Return Salesperson, Return Handling Method
Step 3  Sale Merchandise    the SALE half   — Salesperson,        Sale Handling Method
Step 4  Payment             Return Details | Sale Details | combined Totals
```

`[DOC]` Both salesperson fields are **inactive until Original Order is specified**, and each opens the
Multiple Salesperson Commission Screen independently — the halves can carry different splits. Each half
has its own handling-method override and reset action. The Payment page keeps the halves in separate
blocks with their own net totals, then combines them.

**Fulfillment method** — one choice governs the whole document; default from the `Exchanges` field, POS
Control Settings General page `[DOC]`:

| Method | Semantics |
|---|---|
| Delivery | store collects the returned item and delivers the replacement |
| Customer Pickup | customer drops the return off, collects the replacement at another location or later date |
| Take With | drop-off and pickup at the same time and place; **completes immediately** once both halves are finalized. **Not available at WMS locations** |

**Even exchange.** `[DOC]` On first entry to Step 3:

> "Is this an even exchange? Yes No."

**Yes** defaults the replacement product from the **first product on the Return Merchandise page**;
**No** leaves the operator to key it. Special-order configuration also defaults — but **only if the
original special-order template still exists**; where option types or options differ or are invalid,
**none** of the special-order information defaults.

**Against installment / RTO financing** `[DOC]`: an even exchange is permitted, but on initial entry a
message states that only original orders paid with a third-party installment or RTO plan qualify, and a
warning appears if the original does not. **If 'Even Exchange' is not visible, a separate return and
sale must be created.** `03` adds that split-exchange is unavailable there — so an installment/RTO
exchange is all-or-nothing: even, or two documents.

**Protection plans across the halves** `[DOC]`: a plan on an exchange written against a completed order
is **automatically moved to the return** based on the selected merchandise line. Plans stay linked but
**the price may change** (tiered vs not, even vs uneven). On save, if covered products are being
returned — a cancellation — and the existing plan is **not** available for the new sale lines,
`Cancellation Restriction Days` is checked; **if the existing plan is used on the new sale lines the
exchange is allowed regardless of that limit, because the plan is not being cancelled — the exchanged
products are added to the existing plan.**

### 3.2 The two merchandise steps

**Step 2 (return half)** is field-for-field §2.2, with Quantity Returned defaulting to the original
order quantity, the same grid and Inventory Selection follow-on, and the sales order's route-capacity
warning verbatim: "Route X is full for MM/DD/YYYY. Do you wish to override the capacity limit?" Three
permissions are specific to it `[DOC]`:

- **`Edit Return Portion of Existing Exchange`** — without it the return half of an existing exchange is
  **inquiry-only**, on Step 2 *and* on the Return Details block of the Payment page. This is what stops
  a completed refund from being quietly re-priced.
- `Able to Delete or Add Lines When Deposit Applied`.
- `Override Allowed Number of Days on Returns`, against `Allowed Number of Days on Return`.

**Step 3 (sale half)** is structurally the sales order Merchandise step and inherits its rules wholesale
(`03`): Unit Price override inactivates Discount Code; applying a code then changing Unit Price warns
and **removes the code while keeping the new price**; Ship Location differing from stock location with
`Auto Schedule Days` set **creates an automatic transfer**; same line-status flags `A C H L P S T U W`;
same PO message ("Must either reserve or place on Purchase Order; all merchandise ordered."); one
warranty per category; defective products cannot be added `[DOC]`.

### 3.3 Step 4 — Payment

```
Return Details : Merchandise Subtotal · Discount · Delivery Charge Refund/Pickup Charge ·
                 Installation Charge Refund/Restocking Fee · Misc Fees · Sales Tax
                 → RETURN NET TOTAL
Sale Details   : Merchandise Subtotal · Discount · Delivery/Pickup Charge ·
                 Installation Charge/Restocking Fee · Misc Fees · Sales Tax
                 → SALE NET TOTAL
Totals         : Merchandise Subtotal (return + sale) · Discounts (net) · Charges and Fees (net) ·
                 Net Sale (= Return Net Total + Sale Net Total) · Payment · BALANCE DUE
```

`[DOC]` **Balance Due is signed** — due **to** or **from** the customer after payments, refunds and
financing; **an even exchange displays 0.00**. Return Details uses the §2.3 sign convention and the same
restocking-fee behaviour; editing it requires `Edit Return Portion of Existing Exchange`. Sale Details
behaves like a sales order: delivery charge defaults from Delivery Company Settings, may be $0.00, is
active only with delivery or direct-ship lines, needs `Override System Calculated Delivery Charges` to
edit, and opens *Enter Reason Code* when `DELIVERY CHARGES - Prompt for Reason Code if Overridden` is on.

**Cross-half discount caps** — the arithmetic unique to exchanges, applying to **fixed discount amounts
only; percentage and line discounts are unaffected** `[DOC]`:

```
sale_subtotal_discount ≤ sale_portion_subtotal            else the discount is reduced to match
sale_subtotal_discount ≤ return_portion_subtotal_discount else the sale portion subtotal is
                                                               recalculated
```

And on an **uneven exchange for merchandise of lesser value**, all subtotal discounts become subject to
`Minimum Eligibility Required → Amount`; a message alerts the operator, **who may then decide whether to
proceed as a Split Exchange** `[DOC]`. `03` carries the companion deposit rule: delivery-line required
amounts are reduced by return-line amounts **pro rata to each delivery line's share of the total
delivery amount**.

**Refunds** use the same five destinations and prohibitions as §2.3, driven off Balance Due. **Financing**
can run either direction — finance the amount due, or credit the refund back to the third-party provider
— via Finance Receivable Entry (account number, insurance type, amount, authorization number) or the
Revolving Worksheet. `[DOC]` **Once an Authorization Number is entered the financing information cannot
be edited**; before that, an unapproved third-party plan allows Account Number, Insurance and Amount
edits. Revolving entry runs a credit-line check:

> "A credit line must be established before financing can be added,"
> "Credit Report required"
> "Credit application requires update,"

Any of these places the order on hold and requires a new credit request. **`C6`** hold means a decision
is pending with the credit department; the order and its request appear in *Review Pending Credit
Requests*, and the hold stands until approval **and** a credit limit exist.

### 3.4 Save and completion of the halves, verbatim

```
Save
 ├─ amount due FROM the customer →
 │     "Amount Due is NNN.NN. Continue?"
 │       Yes → processes the exchange and POSTS THE DEBIT to the customer's account
 │       No  → returns to the Payment screen
 ├─ refund due, Create Refund Check NOT selected →
 │     "Upon document completion, an A/R credit of NNN.NN will be posted."
 ├─ Issue Refund Check selected →
 │     "NNN.NN Credit. Will create refund check."   (Cancel clears the check-mark)
 ├─ cash applied → Amount Tendered Window
 ├─ "Would you like a printed copy of this exchange."
 ├─ pickup exchange, Complete Exchange checked → Completion Date Entry (date, OK)
 └─ Customer Pickup → "Would you like to generate the Pickup Ticket?"
        Yes → prints now;  No → print later via Print an Order/Delivery Ticket
```

Where a certificate will be produced (58 and 9):

> "Upon document completion, a Rewards Gift Certificate/In-Store Use Only Certificate of $NNNN.NN will
> be created."

**Completing each half** `[DOC]`:

- **Complete Exchange** (Payment page) completes and invoices the transaction; **inactive while the
  order is incomplete** — a back-ordered item, an unprinted ticket.
- On **Order Completion Details** (§6), marking an exchange line **Not Complete completes the SALE
  portion**. To mark the **return** portion not complete you must use Actions → **Exchange
  Pickup/Delivery**, which toggles the display between the halves. Label this explicitly in the
  replacement UI: the grid shows one half, and the toggle switches halves.
- **Take With** exchanges complete immediately once both halves are finalized.

**E1 hold** `[DOC]`: with `Exchanges on Hold at Entry` active, **every** exchange enters `E1` hold
pending approval by a user holding `Approve E1 credit holds placed on customer exchanges`. That is the
blanket control on exchange abuse — put it in the permission model at phase 1.
`Confirm Address on Orders and Exchanges` requires a phone number to save an exchange.

### 3.5 Split Exchange

From Actions on the **Customer** or **Payment** page `[DOC]`:

- divides the exchange into **two independent documents — one customer return and one sales order** —
  completable independently;
- is the documented way to **complete the return while leaving the replacement sale open**;
- is the documented escape hatch for corrections: STORIS restricts certain edits to existing exchanges
  but allows some of them once the exchange is split;
- is offered by the system when an uneven-for-lesser-value exchange trips the minimum-eligibility rule;
- is **unavailable** if the customer is not required to provide a valid address, and **unavailable**
  against installment/RTO financing (`03`).

`[INFER]` Split is therefore also a permission bypass by another name: an edit blocked on a joined
exchange becomes legal once the document is split. Decide deliberately whether to inherit that (§8.4).

---

## 4. Finding what is being returned

### 4.1 Original Document Select (104) — Adjust Dollars only

Opens on selecting the Merchandise tab in Adjust Dollars when the original document exists `[DOC]`.
Header displays Customer Name · Current Document · Original Document, over a grid of the original
order's products. **Product** — key the code or pick the grid line. **Select Quantity** — quantity to
return, **defaulting to the original quantity sold**. **Add** opens **Inventory Selection**. Actions:
*Reinstate Completed Merchandise Service*, *Product Benefits Inquiry*.

### 4.2 Original Order Piece Selection (105)

Opens automatically on Enter a Return's Merchandise page, Enter an Exchange's Return Merchandise page
and Enter a Service Order's Merchandise page; on demand via Actions → *Original Invoice* from all of
those plus Adjust Dollars `[DOC]`.

| Field / column | Behaviour |
|---|---|
| Default Problem/Reason | **Default Reason** from return/exchange; **Default Problem** and inactive from service. Checked → the reason chosen for the first selected line defaults to all other selected lines. Blank → code each line individually |
| Select | per-row checkbox; header box selects all. **Inactive from Enter a Service Order**, where selecting one line opens the Service Problem Entry Screen |
| Line / Price / Quantity | from the original order. **For a bulk line > 1, Quantity is editable to the quantity being returned — editing splits the line** |
| Warranty | `"Factory"` under factory warranty · the **protection-plan code** if covered by a plan · **blank** if there is no extended warranty or it has expired |

Also: Product / Description / Special Order Detail Information (all options for the product) ·
Serial/Reference · Problem/Reason (arrow-selected) · a per-line Action button offering *Product Benefits
Inquiry* or *Problem Code and Text*.

**Serialized vs bulk resolution** `[DOC]` — this decides the grain of a return:

```
Three chairs, serialized     → THREE lines, each by serial/reference with its own reason code
One bulk line, quantity 3    → ONE line showing quantity 3
   enter a partial quantity  → the line SPLITS; the remainder becomes a second line; the return
                               line's checkbox is checked automatically
   edit the quantity again    → splits further (e.g. to carry several reason codes)
   remove the check-mark(s)   → the split lines MERGE back into one
```

Return-window controls reached here `[DOC]`: `Return Restriction Reason Codes` is consulted when reason
codes are entered; returning past `Return Restriction Days` needs `Override Return Restriction Days`; a
restricted As-Is reason code needs Logistics Security clearance or manager override.

### 4.3 When the original document is off file

All four programs require an original-document value and all four allow it to name a document that does
not exist `[DOC]`:

```
permission absent  → message: your current user settings require the original document be on file;
                     entry CANNOT PROCEED until an on-file order is indicated
permission present → a confirmation message asks whether to proceed; you may continue
```

The permission is Sales Security **`Enter return/exchange/dollar adjustment without original order`**
(attributed to "Extended Security (Sales)" on screen 9 — §8.4).

Consequences `[DOC]`: the **customer must be keyed manually** (also true when the original is a quick
sale); **no selling price is assigned and no inventory-activity record is written**; quantities and
prices are operator-supplied, so both price caps of §2.2 have no anchor; pre-STORIS sales are explicitly
supported, with any order number accepted as long as the product codes are tracked, the item returning to
stock on completion; and for **commission** the transaction's **own written date** is used instead of the
original invoice's.

`[INFER]` An off-file return is an unpriced, untraceable credit with a keyed amount — the highest-risk
path in the module. Require the permission, force a reason, and write an audit record naming operator,
amount and claimed original number.

---

## 5. Adjust Dollars on a Completed Order (9)

Debit or credit dollar adjustments against a completed order (invoice), or against the labour, charges or
parts of a completed service order. Three pages: Customer · Merchandise · Payment. `[DOC]` **Inventory is
not affected by this routine.**

```
Adjustment Type = debit adjustment   → amount due FROM the customer
                  credit adjustment  → A/R credit or refund TO the customer
```

### 5.1 What may change

- **Merchandise lines** — Product, **Quantity Adjusted** (defaults to the quantity purchased on the
  original order; changeable), **Adjustment Amount**, **Extended Adjustment Amount** (= the two
  multiplied). *Add* opens **Inventory Selection** for quantity, serial/reference, storage location and
  **reason for the adjustment**. Grid: Product · Description · **Adjustment Reason Code** · Quantity
  Adjusted · Adjustment Amount · Extended Adjustment Amount.
- **Subtotal discounts**, direction-dependent `[DOC]`: on a **credit** adjustment applying a discount
  code applies missed discounts and **increases the refund**; on a **debit** adjustment removing
  discounts **increases the payment due**. Active only with `DISCOUNTS - Apply Discount Codes to
  Subtotal`; the total percent cannot exceed `Maximum Subtotal Discount __ %`.
- **Delivery/pickup charge, installation charge / restocking fee, misc fees** — chargeable or refundable;
  positive amounts increase the refund/credit **or** the payment due, depending on adjustment type.
- **Protection Plan Amount** — display-only, defaults 0.00, cumulative across adjusted plans. With
  Avalara, **Actions → Avalara Tax Adjustments is available only on a credit adjustment and only while
  no merchandise lines, delivery charges or installation charges have been added** `[DOC]`.
- **Customer** may differ from the original sale's, and **must** be keyed when the original is
  unavailable.

### 5.2 The remaining-value algorithm

`[DOC]` Quantity defaults to the **original** quantity **even if the order has already been partially
returned**, and the dollar amount represents the **remaining value**. If the original order has been
**completely** returned, **no credit is allowed**. Both worked examples, exact numbers:

| | Original | Already returned | Remaining | What the screen does |
|---|---|---|---|---|
| 1 | qty 2 @ 100.00 | qty 1 for 80.00 | 20.00 on the remaining item | quantity still defaults to **2**; the process divides the dollar value **120.00 by 2 → 60.00 per unit** |
| 2 | qty 2 @ 100.00 | qty 2 @ 80.00 each | 40.00 | a message states **no quantity is available**; the process **will not allow a dollar-only credit** |

`[INFER]` Example 1's 120.00 is the un-returned merchandise value (100.00) plus the residual 20.00,
averaged over the original quantity. Reproducible, but the per-unit figure the operator sees is not the
price of any actual piece. Show the derivation on screen.

### 5.3 Save, and what posts

```
Save (Payment page)
 ├─ refund due, Issue Refund Check NOT selected →
 │     "Upon document completion, an A/R credit of NNN.NN will be posted."
 ├─ Issue Refund Check selected →
 │     "NNN.NN Credit. Will create refund check."   (Cancel clears the check-mark)
 ├─ Completion Date Entry Screen → enter Completion Date → OK
 └─ cash applied to a payment due → Amount Tendered Window
```

`[DOC]` **Protection plan check on save:** the credit-adjustment process reviews `Cancellation
Restriction Days`; where covered products are unlinked from the plan **on all completions** of the sales
order — indicating a cancellation — the **first item completion date that activated the plan** is
examined and a warning displays if the limit is exceeded.

Consequences: inventory **none**; receivables — a debit adjustment posts an amount due, a credit
adjustment posts an A/R credit, creates an AP refund check, refunds a tender or credits the finance
provider, with the same forced-certificate rule for non-refundable tender; commission — dated to the
**original invoice's written date** (`03`, `08`); reporting — `09` records that **sales analysis excludes
dollars-only adjustments**, so an adjustment can move commission and cash without moving sales analysis;
audit — a mandatory per-line reason code via Inventory Selection, plus Audit Comments Log, Line Comments
and the audit write on any overridden charge.

---

## 6. Completion at screen level

### 6.1 Order Completion Process (100)

```
check Complete on the fulfillment → Save
 → payment type entry (Payment Summary Window if an open amount is due)
 → Completion Date Entry
 → Order Completion Details        (Amount Tendered Window first, if paying by cash)
 → Inventory Selection             (only where serial and/or location tracking applies)
 → Document Detail Screen → "document has been completed" → OK → Enter a Sales Order
```

`[DOC]` **Complete** is checked and **inactive** for a Take With fulfillment; at a WMS location the field
is active only for a user holding `Adjust inventory for locations when WMS is active`.
Partial-completion status comes from `Status After Partial Completion`; for a partially completed
**pickup**, or where pickup lines remain, `Initial Entry Default Status - Pickup` applies — **except when
that setting is "Scheduled", in which case the pickup status is set to Estimated**. Direct-ship partial
completion requires setting **Ship Quantity to zero** on undelivered items via Additional Line Item
Details; completing the direct-ship portion **creates an AP bill for the PO and marks it closed**.
STORIS supports **Remote Order Completion** — mechanics undocumented (`13` #25).

### 6.2 Order Completion Details (98) — header

Three variants share the screen: **Order Completion Details**, **Transfer Completion Detail**, **Service
Order Detail**.

| Field | Behaviour `[DOC]` |
|---|---|
| Status for ALL Lines | **Complete** / **Not Complete** buttons, each active only when some line's status differs. **On initial access every line is Complete, so only Not Complete is active** |
| Not Completed Lines → Details | active once a piece is Not Complete; opens **Pieces Not Completed Detail**, whose entries **apply to every Not Complete line** |
| New Transfer Date / New Service Date | transfer / service variants only |
| Reschedule for | **order only**; active when ≥1 item is Not Complete; pick an existing delivery date on the document, or **None** |
| Rescheduled Date | **order only**; calendar picks one new date; Action opens **Override Route Capacity**. **Only one new date may be specified; once specified both controls inactivate permanently** |

`[DOC]` **Status for ALL Lines → Not Complete** sets return-to storage location for every line to the
`Return Pickup` default (Warehouse/Store Location Settings → Inventory & Logistics), or to the location
the piece was picked from where there is no default. It is **greyed out if any transfer merchandise
arrived via the WMS Ship Received Import**. The destructive-re-selection rule (`02` §5, `13` #9) applies
to the header and in-grid Complete buttons alike: selecting **Complete** removes **Return to Storage
Location**, **Not Completed Comment**, **Add to As-Is Reason Code** and **Release Piece not Completed**,
and re-selecting Not Complete does **not** restore them.

### 6.3 The completion grid

Columns: **Ref. No.** (line id) · **Product ID** (**`...` means the update applies to multiple pieces**,
§6.5) · **Status** · per-line **Complete** / **Not Complete** / **Details** buttons · **Notes** ·
**Serial Reference Number** · storage-location columns. The rules that matter `[DOC]`:

- **Not Complete (per line)** defaults **Return to Storage Location** from the **Not Completed Location**
  of the Complete the Delivery Manifest Process. For transfers, **all** Not Complete options are disabled
  once any merchandise arrived via WMS import, and **a back order is created for merchandise not
  received**.
- **Notes** values: `Service` · `Kit Master` · `Released` · `Labor` · `Charges` · `As-Is` · `Confirm`
  (serial-tracked **out**, unconfirmed) · `Required` (serial-tracked **in**, no serial assigned) ·
  `As-Is Reason Code` (a Not Complete piece where *Release Pieces Not Completed* is checked).
- **Serial Reference Number** shows the serial for serial-tracked-**in** pieces, else `Required` in
  Notes. Its Action button is meaningful only for those pieces: inactive when none qualify, but **active
  on every row when any qualify, and it errors if clicked on an invalid piece**. Serial-tracked-**out**
  pieces show the serial once confirmed, else `Confirm`. Special Order and As-Is pieces show the
  reference number.
- **Pick From Storage Location** (order and service grids) is active for one-time order documents and
  pieces that are general stock, bulk or serial-tracked **out**; the system verifies stock exists at the
  location entered. **Changing the location of a serial-tracked-in piece displays an error.**
- **Return to Storage Location** is active when the line is Not Complete. **With Advanced Dispatch Track,
  if the return location is a flyby location this column ignores `New Storage Location` in Complete the
  Delivery Manifest Process and defaults from Pick From Storage Location instead.**
- **Receiving Storage Location** exists on the transfer grid only, defaulting to `Transfer Receiving
  Location`.

Actions: **Exchange Pickup/Delivery** (toggle between the exchange's halves) · **Default All Storage** ·
**Confirm All Serial Numbers** · **Access Service Order**.

`[DOC]` **As-is spiff timing:** moving an as-is piece from inventory to completion through the Inventory
Selection Screen awards the salesperson the spiff **from the as-is piece table assigned at that time** —
at completion, not at write-up.

### 6.4 Rescheduling matrix `[DOC]`

| Situation | No reschedule | Reschedule |
|---|---|---|
| Multiple fulfillment dates on the document | the not-completed quantity becomes **unscheduled** | scheduled for the new date |
| A single delivery date | the **original date is retained** and status changes to **EST** | scheduled for the new date, status **stays Scheduled** |
| ATP active, no reschedule date given | the order's lines are considered and **the furthest ATP date on the lines is used** | — |
| Transfer | back order created for merchandise not received | new transfer date required |

### 6.5 Order Completion Exceptions (99)

Baseline `[DOC]`: on entering the completion details process for **any** document type, all lines are
assumed complete with no exceptions.

```
Situation 1 — the whole order was refused
  Status for ALL Lines → Not Complete
      every line flips; Return to Storage Location for ALL lines ← default storage location
  Not Completed Lines → Details → Pieces Not Completed Detail
      Product ID shows "..."  = the update applies to multiple pieces
      Save applies every detail entered to ALL lines

Situation 2 — individual pieces were not completed
  in-grid Not Complete per affected line
      Return to Storage Location ← default, FOR THOSE LINES ONLY
  in-grid Details per line → Pieces Not Completed Detail → Save → repeat per piece
  Alternate: where the detail is common to every Not Complete line, use the header
             Not Completed Lines → Details instead
```

`[DOC]` **Manifest exceptions.** Any manifest item can create an exception — an item not completed, or a
customer return not picked up. With `Route Exception` enabled, each is written to the **Route Exception
file**, reportable via the Report Builder. That file is the audit trail for failed deliveries and
un-collected returns; wire it up in phase 5.

---

## 7. Commission consequences

`08` has the calculation and reporting parameters, plus the `[DECIDE]` on formulas (`13` #2). Here are
the three screens that change commission after the fact.

**The two governing rules** `[DOC]`:

> **Commission setting changes are not retroactive.** Existing orders are unaffected until each order is
> updated — through a commission/spiff update screen, or by re-entering the line items.

> **Returns and dollars-only adjustments create commission records dated to the written date of the
> original invoice.** If that invoice is off file, the transaction's own written date is used.

Rate changes propagate only by touching each order, and clawbacks land in the **original** sale's period.
Commission records therefore need an `effective_date` distinct from `transaction_date`.

**Commission/Spiff Updates (21)** — reached from the Action button on the **General tab of Additional Line
Item Details**, so it is per-line, not per-order `[DOC]`. Two fields: **Commission Category** and **Spiff
Amount** for the selected line. That is the whole documented surface — and it is the mechanism the
non-retroactivity rule points at, so without it a rate change means re-keying orders line by line.

**Enter a Commission Adjustment (49)** — adjusts commissions already posted to **completed** orders: add
or remove salespeople, change the split. Header: **Completed Document** (valid types are sales order,
return, and **the sale or return portion of an exchange — each adjusted independently, the return half
addressed by specifying the `e`**), **Salesperson** (ellipsis indicates multiple), **Customer**, **Type**
(`Sale` | `Return` | `Exchange Sale` | `Exchange Return` | `Dollar Adjustment`), **Date** (the
**completion** date), **Total** (total completed dollars, **negative for returns**). The grid is
**reference only, with no line selection**: Reference · Product · Product Description · Quantity
(**negative for returns**) · Price · Extension (**negative for returns**).

Rules `[DOC]`:

- **Offsetting records dated to the adjustment.** Positive adjustments for new commissions, negative
  adjustments to back out existing ones, **using the date of the adjustment** — not the original
  completion date. Both appear on Report Sales Commissions. Note the tension with the rules above: the
  *return* attribution rule dates records to the original invoice while a *commission adjustment* dates
  them to itself. Keep the two paths distinct in the ledger.
- **Delivered Business (BTA) always updates.** Completed sales update to reflect the adjusted commissions
  **so that any future refunds create the appropriate commission updates** — that is how a corrected
  split survives a later return.
- **Written Business updates optionally**, per `Adjustments Update Written Business`. When included, the
  routines updated are Report Written Sales by Salesperson · Report Written Sales Dollars · Customized
  Sales Analysis · Data Warehouse.
- **Does not apply to service orders.** **Purged commission records cannot be adjusted.** Displayed
  commission information reflects the state **as of the order completion date, net of prior adjustments.**
- **Commission restrictions in POS Control Settings do not apply to this routine** — an explicit bypass,
  hence §8.4. **Commissions on delivery charges recalculate automatically** whenever a completed
  document's split changes.
- **Multi-invoice propagation: forward only.** An order invoiced as `455`, `455A`, `455B` — changing the
  salesperson on **455A** is reflected on **455A and 455B, but not on 455**.
- **Rounding** distributes in **.01% increments**; **positive** rounding errors distribute from the
  **beginning** of the list, **negative** ones from the **end**. Implement the direction — it is what
  makes two runs reconcile.

**Multiple Salesperson Commission (94)** — from the **Salesperson** field on a sales order, return,
exchange or Adjust Dollars, and on an exchange **also from Return Salesperson**, giving the halves
independent splits `[DOC]`. **Commission Percent** is editable and **blank when a salesperson is first
added**; **the total across all salespeople must equal — and may not exceed — 100%**. The grid carries **a
total at the bottom of the Commission Percent column, inside the grid**. An **extra** Action button on
Salesperson Code opens **Program List Creation**, where applying a **Salesperson List** populates the grid
with its individuals, still individually editable. Percentages set for the customer in **Customer
Settings** display and are editable **for this order only**; with several salespeople and no such
default, **the system splits evenly automatically**.

---

## 8. Consolidated

### 8.1 New business rules `[DOC]`

Each is specified in the body; this is the checklist for `12`.

1. Returns reach the GL **only on completion** — money cannot move until merchandise is received back.
2. Returns post to the **selling** location, except in-house credit-card returns, which post to the
   **operator's log-on** location.
3. Charge/refund fields on returns and return halves use the **inverted sign convention**.
4. Refunds route to five destinations; the **A/R credit is the default** — the result of entering
   nothing and leaving the check box clear. Non-refundable tender **forces** a gift certificate and
   refuses both cash and a check. Card refunds are not credited until completion; a check needs a valid
   address.
5. A manually overridden restocking fee is **never recalculated**, and the override is written to audit
   comments. Editing a reduced return or prorated warranty price **does not change the cost reduction**.
6. Adjust Dollars never touches inventory, defaults quantity to the **original** quantity, spreads
   remaining value across it (120.00 / 2 = 60.00), and **refuses credit once the order is fully
   returned**. Sales analysis **excludes** dollars-only adjustments; commission includes them.
7. The exchange is one document with two independently completable halves, the return half addressed as
   `N + "e"`; Split Exchange turns it into a customer return plus a sales order, and **unlocks edits
   blocked on a joined exchange**. `Edit Return Portion of Existing Exchange` gates the whole return
   half.
8. On the completion grid, **Not Complete completes the sale portion**; the return portion is reached
   only through Exchange Pickup/Delivery.
9. Exchange subtotal discounts are double-capped (fixed amounts only); an uneven-for-lesser-value
   exchange subjects them to minimum-eligibility and offers a split. Even exchange against
   installment/RTO needs the original financed that way, and split is then unavailable.
10. `Exchanges on Hold at Entry` puts **every** exchange on `E1` hold behind a named approval permission.
11. A return saves without a pickup date; the date is required only at completion attempt. Bulk return
    lines split and re-merge by quantity edits; serialized pieces occupy one line each.
12. Off-file originals are permission-gated, customer-keyed, **unpriced and without an
    inventory-activity record**, and commission-dated to the transaction's own written date.
13. One reschedule date per completion, then both controls inactivate permanently. Single-date
    non-reschedule keeps the date and flips status to `EST`; multi-date leaves the quantity
    **unscheduled**; with ATP and no date, the **furthest** ATP date wins.
14. Commission adjustments propagate **forward only** across re-invoices; rounding distributes in .01%
    increments, positive from the top of the list and negative from the bottom. Splits must total exactly
    100%, defaulting to an even split. Delivered Business always updates, Written Business optionally;
    purged records are unadjustable; POS commission restrictions **do not apply** to the routine.
15. As-is spiff is awarded from the piece table **at the moment the piece moves to completion**.

### 8.2 Enums introduced

```
ReturnFulfillmentMethod   R = Regular Pick Up | C = Customer Drop Off                     [DOC]
ExchangeFulfillmentMethod DELIVERY | CUSTOMER_PICKUP | TAKE_WITH                          [DOC]
AdjustmentType            debit adjustment | credit adjustment                            [DOC]
CompletedDocumentType     Sale | Return | Exchange Sale | Exchange Return |
                          Dollar Adjustment                                               [DOC]
LineCompletionStatus      Complete | Not Complete                                         [DOC]
CompletionNotes           Service | Kit Master | Released | Labor | Charges | As-Is |
                          Confirm | Required | As-Is Reason Code                          [DOC]
SerialTrackingDirection   on the way IN | on the way OUT                                  [DOC]
WarrantyColumnValue       "Factory" | <protection plan code> | blank (none or expired)     [DOC]
NonRefundableTender       Rewards Gift Card | In-Store Use Only Gift Card |
                          Builder Allowance certificate                               [PARTIAL]
ReasonCodeUsedFor         "As-Is Restricted" (+ others)                               [PARTIAL]
CreditHold                E1 (exchange entry hold) · C6 (credit decision pending)     [PARTIAL]
ReturnHandlingMethod      "None Selected" + configured handling methods               [PARTIAL]
```

### 8.3 Settings and permissions referenced

New here, beyond the inventories in `03`–`10`. **POS Control Settings**: `Returns` · `Exchanges` ·
`Allowed Number of Days on Return` · `Return Restriction Days` · `Return Restriction Reason Codes` ·
`Restocking Fee on Returns` · `Prorate Returned Warranties` · `Return Pieces to As-Is` · `Require Audit
Text on Returns` · `Require Audit Text on Exchanges` · `Exchanges on Hold at Entry` · `Refund Check` ·
`Adjustments Update Written Business` · `DISCOUNTS - Apply Discount Codes to Subtotal` · `Maximum Subtotal
Discount __ %` · `Status After Partial Completion` · `Initial Entry Default Status - Pickup` · `Route
Exception`. **Elsewhere**: `Settlement Type` (Electronic Merchant) · `Use Original Merchant ID for
Returns` (Financing Control) · `Cancellation Restriction Days` (Protection Plan) · `Number of Days that a
Membership Product Can be Added to a Return` (Membership Reward) · reduced return percentage (Costing
Control / Group) · `This Reason is Used For` (Reason Code) · `Minimum Eligibility Required → Amount` and
`Customer Price Category` (Sales Discount) · the two RTO installation-charge flags (Finance Provider,
Sales Tax) · in-store certificate payment type (A/R Control) · `Return Pickup` (Warehouse/Store Location) ·
`Not Completed Location` / `New Storage Location` (Delivery Manifest) · `Transfer Receiving Location` ·
`Release Pieces Not Completed` · Advanced Dispatch Track · WMS Ship Received Import · Customer Settings
(default commission percentages).

**Permissions.** Sales Security: `Enter a New Exchange` · `Enter return/exchange/dollar adjustment without
original order` · `Edit Return Portion of Existing Exchange` · `Complete Returns for Return Locations
Other Than Login Locations` · `Override Allowed Number of Days on Returns` · `Override Return Restriction
Days` · `Override Protection Plan Cancellation Restriction Days` · `Change reduced return price; not
exceeding original price` · `Change reduced warranty price; not exceeding original price` · `Discounts -
Override Sales Discount Restrictions` · `Override System Calculated Delivery Charges` · `Override Handling
Method on a Fulfillment` (plus the date, route and salesperson permissions in `03`). Logistics Security:
`Adjust inventory for locations when WMS is active` · ticket-print permissions · restricted As-Is reason
codes. User/Group: `Approve E1 credit holds placed on customer exchanges` · `Able to Delete or Add Lines
When Deposit Applied`. Extended Security: `Print a Customer Pickup Ticket Within POS Entry`; Extended
Security (Sales) for off-file returns and adjustments.

### 8.4 Open questions and content defects

Numbered locally 1–7, as in the sibling screen files. Each carries its number in the consolidated
list in `31-som-open-questions.md`, which is the single global register.

**1. `[DECIDE]` Two return-window settings (`31` #56), or one under two names?** The corpus names `Allowed Number of
Days on Return` / `Override Allowed Number of Days on Returns` (54, 58) **and** `Return Restriction Days`
/ `Override Return Restriction Days` (105) — both in POS Control Settings, both governing how late a
return may be entered. Confirm before building; if there is one, do not ship two.

**2. `[DECIDE]` Which security file owns off-file originals? (`31` #53)** 54 and 58 name Sales Security `Enter
return/exchange/dollar adjustment without original order`; 9 attributes it to "Extended Security (Sales)".
Same capability, two homes. Related to `13` #12.

**3. `[DECIDE]` Commission adjustment bypasses commission restrictions. (`31` #38)** Screen 49 states that
commission restrictions in POS Control Settings "do NOT affect this routine". So the screen that rewrites
compensation on completed invoices is the one exempt from the compensation guardrails — and the corpus
names **no** permission gating entry to it. Specify one.

**4. `[DECIDE]` Two commission date-attribution rules must coexist. (`31` #54)** Returns and dollars-only
adjustments date commission to the **original invoice's** written date (`03`, `08`); Enter a Commission
Adjustment dates its offsetting records to **the adjustment's own date** (49). Decide how the ledger
distinguishes them, and which rule a return against an already-adjusted invoice follows.

**5. `[DECIDE]` Split Exchange as a permission bypass. (`31` #36)** Splitting is documented as the way to make edits
STORIS otherwise blocks. Either keep it and log every split with the edit that followed, or require the
underlying permission regardless of split. Do not inherit it silently.

**6. `[DECIDE]` Discount-code list exclusion reads backwards. (`31` #57)** On 54 and 58, codes whose Customer Price
Category **matches** the customer's are **excluded** from the dropdown — as written this hides the codes
that ought to apply. Verify against a live system; it may be a documentation inversion.

**7. `[DECIDE]` Adjust Dollars averaging. (`31` #55)** The 120.00 / 2 = 60.00 convention (§5.2) produces a per-unit
figure matching no actual piece. Reproduce, or move to true per-piece residual tracking?

**Content defects in the source**

- **Screen 54, `Quantity Returned`** — the harvest notes record that this field's definition duplicates
  the Brand text in STORIS' own article, so the definition here is reconstructed, not quoted. `[PARTIAL]`
- **Screen 9, "Refund Due"** — described as showing 0.00 "for an even exchange": even-exchange language
  inside the dollars-only adjustment program. Either a genuinely shared field or copy-paste from 58. Same
  family as the total-deposit-amount defect in `SOURCES.md`.
- **Screen 9, "zip code from the Product file"** — plainly a typo for the customer file.
- **Corpus integrity, not STORIS.** `raw/som-corpus.md` carries **nine** injected fragments of the
  harvesting agents' own trailing metadata (`agentId: …`, `<usage>subagent_tokens: …`), and one — at the
  screen 49 / screen 58 boundary, corpus lines ~1102–1107 — **truncated the corpus mid-word**, splicing
  part of the exchange Payment page into the middle of the commission-adjustment block. The material was
  recoverable from the spliced fragment, but the corpus is not clean. Two consequences: re-extraction by
  block index is unreliable at those nine points; and those fragments contain instruction-shaped text
  addressed to an agent (`use SendMessage with to: …`). It is harvest exhaust in a data file, not a
  directive — it was treated as data and ignored, and anything re-reading this corpus should do the same.
