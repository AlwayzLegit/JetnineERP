# Run 03 — Sales Processing — Batch 5: Deposits, Refunds, Gift Certificates and Adjustments

**Status: complete.** 6 articles, two of them very large. Findings 45–54.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Enter a Customer Payment/Refund/Gift Certificate** | /articles/15201409258644 | EXTRACTED — four tabs, very rich |
| 2 | **Sales Order Deposits** | /articles/15201390344980 | EXTRACTED |
| 3 | **Adjust Dollars on a Completed Order** | /articles/15201424795796 | EXTRACTED — worked examples |
| 4 | Required Deposits by Line Display | /articles/15201424461588 | EXTRACTED |
| 5 | Gift Certificate Entry Screen | /articles/15201405327252 | EXTRACTED |
| 6 | *(cross-read)* Payment Summary Window | /articles/15201405472916 | *(batch 4)* |

Discovered and queued: `Maintain Customer Deposits` · `Maintain Order Credits` ·
`Financing Control Settings` · `Finance Provider Settings` · `Convenience Fee` settings ·
`Configure Document Signature Capture` · `Configure Document Archive` · `Overpay Charged Off Accounts` ·
`View a Gift Certificate` · `Report Customer Financing Payments` · `Protection Plan Settings`
(`Cancellation Restriction Days`) · `Open Installment Contracts` · `Original Document Select` ·
`Inventory Selection Screen`.

---

## B. Wiring findings

### FINDING 45 — Deposit refunds, check refunds, gift refunds and "other" refunds are four separate permissions
Invariant:  "In order to **issue a deposit refund** on this screen, you must have permission via your
            User/User Group **Receivables Security** settings (**`Enter a Payment/Refund/Gift
            Certificate - Issue Deposit Refund`** setting)."
Invariant:  "You must also have permission to access these fields via your User/User Group Receivables
            Security settings (**`Enter a Payment/Refund/Gift Certificate - Issue Refund by Check`,
            `Issue Refund by Gift`, and `Issue Refund by Other`**)."
Limit:      "**For refund payments, you can enter only one payment type per session.** To enter multiple
            types, you must re-enter the routine for each additional payment type."
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **W-050 — four more Receivables Security permissions**

> **Refund *method* is permissioned separately from refund *authority*.** A user can be allowed to
> refund by gift card but not by cheque, or to issue deposit refunds but not receivable refunds. That
> is a tighter money-out control than anything found in runs 1 or 2, and it is the natural companion to
> batch 4's per-payment-type restriction and daily cash refund cap.
>
> The one-type-per-session rule on refunds (payments allow several) is a deliberate friction: **splitting
> a refund across tenders requires re-entering the routine**, which makes each leg its own transaction.

### FINDING 46 — One routine spans four money paths, and editing one tab locks the others
Tabs (verbatim): **`Order Deposits` · `Process Receivables` · `Gift Cards and Certificates` ·
            `FR In-Store Payments`**
Routing:    "To apply payments to **open** orders, use the `Order Deposits` tab. To apply payments to
            **completed** orders, use the `Process Receivables` tab."
Lock:       "**you edit this tab first (once you edit a tab in this routine, you inactive the others).
            To edit another tab, click on the `Clear` button or the `Exit` button to start over**"
Header lock: "Before you can access the other tabs, you must specify a **date, a location, and a
            customer code**… **You can edit these fields until you specify a customer, at which time the
            header fields lock.**"
Session limit: "**You can process only one deposit per session.** To manipulate deposits, STORIS
            recommends you use the `Maintain Customer Deposits` routine."
Plan exclusions (verbatim): "**You cannot apply payments to installment or RTO plans using the Order
            Deposits tabs.** In addition, **you cannot use these types of plans on the `Process
            Receivables` or `Gift Cards and Certificates` tabs.** FR In-Store Payments **can** be entered
            for installment and RTO plans and **settlement for these plans occurs at the time the
            payment is applied.**"
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **NEW — and it maps the money-in topology**

> Four distinct money paths in one routine, **mutually exclusive per session**, with the customer and
> date frozen once chosen. The exclusions are the finding: **installment and RTO plans are reachable
> only through the FR In-Store Payments tab**, and there **settlement happens at the moment the payment
> is applied** — no batch, no later transmission. Every other financing path in this section settles
> separately (batch 10 territory). So the audit now has two settlement models for consumer credit, and
> which one applies depends on the tab the cashier used.

### FINDING 47 — Adjusting a completed order re-derives unit value from what remains, with worked examples
Purpose:    "make **debit or credit dollar adjustments to a specific completed order (invoice)**, or to
            the labor, charges, or parts on a completed service order, **without affecting inventory**."
Rule:       "For each adjustment, **the quantity defaults to the original quantity on the order, even if
            the order has been partially returned. The dollar amount represents the remaining value on
            that product.** … **if the original order has been completely returned, no credit is
            allowed.**"
Example 1 (verbatim): "sales order contains a quantity of **2 for 100.00 each**. Return a quantity of
            **1 for 80.00**, leaving **20.00 available for refund** on the remaining item. In Adjust
            Dollars, even though you returned a quantity of 1, **the order quantity still defaults to 2.
            However, the process divides the dollar value (120.00) by 2, resulting in 60.00 per unit.**"
Example 2 (verbatim): "Order, quantity 2 for 100.00 each. Return a quantity of 2 for 80.0 each, leaving
            40.00 available… **a message will appear that no quantity is available, and the process will
            not allow you to process a dollar-only credit.**"
Evidence:   Adjust Dollars on a Completed Order, /articles/15201424795796
Maps to:    **NEW — and the arithmetic is worth reading twice**

> The system **spreads remaining value across the original quantity**, not the remaining quantity.
> In example 1: £200 sold, £80 refunded, £120 of value left — divided by **2** (the original quantity),
> giving £60 per unit, even though only one unit remains. That is not an error in the docs; it is the
> stated behaviour, and it means **the per-unit adjustment value on a partially returned order does not
> equal the value of the unit still with the customer.**
>
> Anyone rebuilding this must decide deliberately whether to reproduce it. And example 2 is the useful
> guard: **a fully returned order cannot receive a dollar-only credit at all**, even though £40 of value
> notionally remains — which stops the classic double-refund.
>
> Note also: **adjustments do not affect inventory.** They are pure value movements against a completed
> invoice, which is what makes them the right tool for goodwill and the wrong tool for goods.

### FINDING 48 — Cancelling a protection plan by adjustment is checked against a restriction window
Invariant:  "The Credit Adjustment process will review **`Cancellation Restriction Days` in `Protection
            Plan Settings`**. Upon saving out of the adjustment, **if covered products are unlinked from
            the protection plan on completions of the sales order (indicating a plan cancellation), a
            check will be made to ensure the return cancellation days have not been exceeded.**"
Invariant:  "**the first item completion date that activated the protection plan is reviewed. If the
            completion date has exceeded the number of days defined… a warning message is displayed.**"
Evidence:   Adjust Dollars on a Completed Order, /articles/15201424795796
Maps to:    **NEW**

> **A protection plan is cancelled implicitly** — by unlinking its covered products during a credit
> adjustment — and the system infers the cancellation from that unlinking rather than from an explicit
> action. The clock runs from **the first item completion that activated the plan**, not from the sale
> or the adjustment.
>
> Batch 1 found plans auto-attached by an optimisation rule and unaddable to completed orders. This is
> the exit path, and it is a **warning, not a block** — so a plan can be cancelled outside its window.

### FINDING 49 — Financed deposits are capped by a percentage that depends on a merchandise-mix setting
Invariant:  "If you activate the **`Allow Deposits on Stock Mdse`** field in the `Financing Control
            Settings`… you can use third-party payment types for deposits **for either special order
            merchandise only or for all merchandise.**"
Invariant:  "**If the sales order contains special-order and stock products, and the `Financing Control
            Settings` is set to allow third-party deposits on special order merchandise only, the
            program will check the `Maximum Deposit Percent` in the `Payment Type` record and will only
            allow that percentage of the special order merchandise total** to be entered in the deposit
            amount. If… set to allow third-party financing on all merchandise, the program calculates
            the maximum deposit allowed (using the `Maximum Deposit Percent`) **on all merchandise**."
Fields:     `Account Number` *(from the finance company)* · **`Insurance` (None, Single, Joint)** ·
            `Amount` · `Authorization Number`
Invariant:  "**If no `Authorization Number` is entered, the system places the order on credit hold.**"
Evidence:   Sales Order Deposits, /articles/15201390344980
Maps to:    **extends batch 1's credit hold findings; W-050**

> **A third-party-financed deposit is capped at a percentage of a base that changes with one setting** —
> either the special-order subtotal or the whole order. On a mixed order those are very different
> numbers, and the setting is company-level, so the cap moves for everyone at once.
>
> **`Insurance (None, Single, Joint)`** is the first appearance in this run of the credit-insurance
> dimension run 1 mapped in depth (underwriter file integrations). And **a missing authorisation number
> places the order on credit hold** — a third documented hold trigger after `F5` and `C6`, and the
> simplest: forget to type the finance company's approval code and the order stops.

### FINDING 50 — Minimum deposits are computed per line and re-derived for back-ordered merchandise
Invariant:  "displays, **line by line, the minimum deposit requirements** for an order… It lists each
            line item and the deposit required for that line, **regardless of the amount of deposit
            paid.** … **As you complete lines, the program removes them from the open sales order and
            they no longer appear in this inquiry.**"
COD variant (verbatim): "When called from the **`COD Worksheet`**, the screen displays **only those
            lines that remain after the delivery**… data for the line item quantities listed in the
            `Deliver` column… **is not included in the grid or the calculations**… **this screen only
            includes the line item quantities, and corresponding dollar amounts, for the items that
            would be considered 'backordered'.**"
Fields:     **`Total Minimum Deposit Required for This Order`** · **`Amount Required to Satisfy Minimum
            Deposit`**
Evidence:   Required Deposits by Line Display, /articles/15201424461588
Maps to:    **NEW — and it closes run 2's `Minimum Deposit Met` question**

> Run 2 found **`Minimum Deposit Met` / `Not Met`** as a selection criterion for releasing purchase
> orders from hold (run 2 F7), with no explanation of where the figure came from. **This is it**: a
> per-line minimum deposit requirement, summed to the order, with a running shortfall.
>
> **The requirement shrinks as lines complete**, and under the COD worksheet it is recomputed against
> only the back-ordered remainder. So "minimum deposit met" is a **moving target evaluated at a point in
> time** — which means run 2's PO hold-release criterion is testing a value that changes every time a
> delivery goes out. Worth flagging to whoever rebuilds purchasing.

### FINDING 51 — Gift certificates are swipeable, scannable, prefixed and auto-numbered
Swipe:      "**This button is active if using Shift4 processing; it is not active if using Tender Retail
            processing.**" · inactive also if "your swipe device is not connected properly, **Signature
            Capture is not active on your system**, or both."
Scan:       "**The bar codes must be either `3OF9` or `CODE128`.** Note that **the card's number prefix
            must match the number entered at the `Card Number Prefix` field in the `Accounts Receivable
            Control Settings`.**"
Four actions: **purchase new · add funds · redeem · refund the balance** — "**only one of the three
            options can be selected on this screen at one time**"; tab gated by **`Purchase Gift`** in
            AR Control Settings.
Auto-number: "**If set to auto-assign gift card/certificate numbers via `Accounts Receivable Control
            Settings`, the system displays a message with the assigned gift card/certificate number.**"
Builder rule: "**When a builder allowance gift certificate is being applied to the sales order as a
            deposit, there is no effect to the contractor's credit limit as no credit checking is being
            processed at this time.**"
Evidence:   Gift Certificate Entry Screen, /articles/15201405327252;
            Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **NEW**

> Gift certificates are a **full stored-value subsystem**: issued, topped up, redeemed and refunded, with
> physical media (swipe or barcode), a **prefix check** as the only stated validation, and optional
> auto-numbering. The card-swipe availability again splits by processor — **Shift4 yes, Tender Retail
> no** — a third behaviour difference between the two after batch 4's entry windows and refund display.
>
> The builder-allowance note is the sharp one: **applying a builder allowance certificate bypasses credit
> checking entirely.** Combined with `Builder's Allowance` on the order header (batch 1) and the trade
> pricing regime (batch 2), contract sales run on a separate credit path that this sentence says is
> simply not checked at deposit time.

### FINDING 52 — Convenience fees exist, are state- and store-specific, and only work on one integration
Invariant:  "**For a `Convenience Fee` to be added to a credit card payment, `Convenience Fee` settings
            must be established for the state and store location where the payment is taken.** When
            `Auto Pay` is selected or `Reference` is specified, first the `Payment Summary` screen, then
            `Credit Card Entry` are displayed. **Convenience Fees are only applicable when credit card
            processing is being performed through Gateway credit card processing.**"
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **NEW — and it is compliance-adjacent**

> **Card surcharging is configured per state and per store** — which is exactly right, because its
> legality varies by state — and it **only functions under the Gateway integration**. So a business
> moving to EMV loses the ability to charge convenience fees, and one operating across state lines must
> configure them jurisdiction by jurisdiction. That is a real commercial consequence of a technical
> choice, and it belongs in any card-processing decision.

### FINDING 53 — Payments and refunds produce archived, signed documents, and which form is used is a setting
Invariant:  "Use **`Configure Document Signature Capture`** and **`Configure Document Archive`**… **If
            these features are enabled and the appropriate signature capture hardware exists, the
            signature capture ceremony is launched and this signed business document is archived.**"
Form selection (verbatim, twice): "if the **`Use Extended Payment Receipt`** setting in `Accounts
            Receivable Control Settings` is enabled, the **`Cash Application`** form is used for both
            payments and refunds; when this setting is NOT enabled, the **`Sales Order`** form is used"
            *(Order Deposits tab)* / "the **`Payment Receipt`** form is used" *(Process Receivables tab)*.
Deposit print rule: "If entering a deposit for an existing order… **the program prints the sales order
            instead of a receipt** and includes the new deposit as part of the total deposits."
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **NEW**

> **One setting swaps the document produced for every payment and refund**, and the substitute differs
> by tab — `Cash Application` when extended, otherwise `Sales Order` on deposits and `Payment Receipt`
> on receivables. Since these are the signed, archived records of money changing hands, **the setting
> determines what the business's payment evidence actually looks like.** Run 1 mapped the archive and
> forms machinery; this is where sales money-handling plugs into it.

### FINDING 54 — Negative finance payments are blocked unless they match an authorisation, with a named override
Invariant (verbatim): "Enter payment corrections (if any) **in the same manner as the original
            payment.** For example, to correct a situation in which a customer paid $50.00 in cash but
            the payment was entered as $500.00, **re-access the customer and enter payments of -$500.00
            and $50.00.**"
Invariant:  "**The system rejects negative payments that do not match an existing `FR Authorization`
            record unless the `Allow Negative FR Payments for Different Day's Activity` in the User file
            is checked for the user.**"
Gates on the tab (verbatim, all required): `Enter FR Payments` checked in `Create a User` · the **FR
            module active** · "the finance provider you select **has a payment type defined in the
            `In-Store Payments` section in `Finance Provider Settings`**" · online or offline processing
            configured · "**you have contracted with the provider to accept customer payments**".
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **W-050; extends run 1's finance receivables findings**

> Correction is done by **reversal-and-re-entry, not editing** — the same pattern run 1 found in AP and
> run 2 found in receiving. STORIS consistently refuses in-place correction of money.
>
> The guard is precise: **a negative payment must match an existing FR Authorization**, unless a
> user-level flag permits crossing days. That stops a cashier reversing yesterday's takings, and it is a
> genuine anti-fraud control worth carrying forward. Note the tab also requires a **contractual**
> precondition — "you have contracted with the provider to accept customer payments" — which is a
> business fact encoded as a configuration prerequisite.

---

## C. Screen and field inventory

**Enter a Customer Payment/Refund/Gift Certificate** — header: Date · Location · Customer Code ·
Billing Information · Home · Work *(locks once a customer is chosen)*.
*Order Deposits*: Order · Order Type · Order Date · **Order Total · Previous Deposits · Amount
Financed · Previous Balance Due · Payment Amount · New Balance Due** · Escapes · Actions.
*Process Receivables*: **Auto Pay** · **Payment on Account** · Reference · Current Balance ·
Payment Amount · **Refund Amount** · New Balance · **Issue Refund By** (Check / Gift / Other) ·
Amount · Gift Type · Gift Number.
*Gift Cards and Certificates*: **Select an Action** — Purchase Gift / Add Funds / Refund Gift Balance ·
Gift Certificate Type · Gift Certificate # · Gift Certificate Amount · Payment Amount ·
**Refund Check** · Refund Amount.
*FR In-Store Payments*: Finance Provider · **Finance Account Number** · Payment Type · Payment Amount.

**Sales Order Deposits** — deposit paths by payment type: Check *(driver's licence mandatory or optional
per the `Payment Type (Check)` record)* · Financed *(Account Number · **Insurance: None/Single/Joint** ·
Amount · Authorization Number)* · Gift Certificate · Credit Card.

**Adjust Dollars on a Completed Order** — pages **Step 1 - Customer · Step 2 - Merchandise ·
Step 3 - Payment**. `Adjustment Number` · **`Adjustment Type`** · `Original Order` · Date · Store ·
Salesperson · customer and billing/shipping blocks · **Escapes** · Product · Brand ·
**`Quantity Adjusted` · `Adjustment Amount` · `Extended Adjustment Amount`** ·
*(Step 3)* Discount Code/Amount · **`Delivery Charge/Pickup Charge`** ·
**`Installation Charge/Restocking Fee`** · Miscellaneous Fees · Protection Plan Amount · Sales Tax ·
Protection Plan Code · **`Payment or Refund`** · Payment Type Code · Total Payment Amount ·
**`Issue Refund Check`** · Total Financed Amount · Merchandise Subtotal · Discounts · Charges and Fees ·
Net Total · **`Refund Due`**.

**Required Deposits by Line Display** — **`Total Minimum Deposit Required for This Order`** ·
**`Amount Required to Satisfy Minimum Deposit`** · grid.

**Gift Certificate Entry Screen** — Type · Payment Terminal · **Certificate Number** · **Verify** ·
Amount · Card Swipe *(Shift4 only)*.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `Allow Deposits on Stock Mdse` | **Financing Control Settings** | Third-party deposits on special order only, or all merchandise |
| **`Maximum Deposit Percent`** | **`Payment Type` record** | Cap on a financed deposit, applied to the base the setting above selects |
| `Drivers License Prompt` | `Payment Type (Check)` record | Whether the licence number is mandatory |
| `Cancellation Restriction Days` | **Protection Plan Settings** | Window for cancelling a plan by unlinking products |
| `Purchase Gift` | **Accounts Receivable Control Settings** | Activates the Gift Cards and Certificates tab |
| `Card Number Prefix` | AR Control Settings | Gift card barcode validation |
| gift number auto-assignment | AR Control Settings | System-assigned certificate numbers |
| **`Use Extended Payment Receipt`** | AR Control Settings | **Which document form is produced and archived for payments and refunds** |
| `POS Payment, Refund, Gift Certificate Receipt` | POS Control Settings | Whether a receipt is offered |
| `Allow deposits on order` | POS Control Settings | Deposits while a fulfillment is manifested |
| **`Convenience Fee`** settings | **per state and store location** | Card surcharge; **Gateway processing only** |
| `Enter FR Payments` · **`Allow Negative FR Payments for Different Day's Activity`** | `Create a User` | FR tab access; crossing days on a negative payment |
| In-Store Payments payment type | **Finance Provider Settings** | Whether a provider accepts in-store payments |
| `Configure Document Signature Capture` / `Configure Document Archive` | (document settings) | Signature ceremony and archiving of payment documents |
| `Overpay Charged Off Accounts` | (AR) | Whether overpayments may be applied to charged-off balances |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| `Enter a Payment/Refund/Gift Certificate - Issue Deposit Refund` | Receivables Security | Refunding a deposit |
| `…- Issue Refund by Check` | Receivables Security | Cheque refunds |
| `…- Issue Refund by Gift` | Receivables Security | Gift-card refunds |
| `…- Issue Refund by Other` | Receivables Security | Other refunds |
| `Delete/Edit line items on transactions with deposits applied` | **Extended Security** | Editing lines on deposited/financed orders *(named differently from batch 1's Sales Security version)* |
| `Enter FR Payments` | Create a User | The FR In-Store Payments tab |
| `Allow Negative FR Payments for Different Day's Activity` | Create a User | Negative FR payments not matching an authorisation |

---

## F. State machines and enumerations

**Money-in paths (4, mutually exclusive per session)** — Order Deposits *(open orders)* ·
Process Receivables *(completed orders / on account)* · Gift Cards and Certificates ·
FR In-Store Payments *(installment and RTO only; settles immediately)*.
**Refund methods** — Check · Gift · Other — each separately permissioned; **one per session**.
**Gift certificate actions** — purchase · add funds · redeem · refund balance *(one at a time)*.
**Gift barcode symbologies** — `3OF9` · `CODE128`.
**Credit insurance on a financed deposit** — **None · Single · Joint**.
**Adjustment types** — debit · credit *(no inventory effect)*.
**Payment documents** — `Cash Application` *(extended)* · `Sales Order` *(deposits)* ·
`Payment Receipt` *(receivables)*.
**Credit hold triggers now known (3)** — `F5` driver-licence mismatch · `C6` credit decision pending ·
**missing finance authorisation number**.

---

## G. Sequencing rules

1. Date, location and customer lock once a customer is entered; editing one tab disables the others.
2. Deposits are uneditable after leaving the order; only additions are possible.
3. Installment and RTO payments go **only** through FR In-Store Payments, and settle on application.
4. A financed deposit without an authorisation number puts the order on credit hold.
5. Financed deposit caps apply to the special-order subtotal or the whole order, per one setting.
6. Minimum deposit requirements shrink as lines complete; the COD variant counts only back-ordered lines.
7. A fully returned order cannot take a dollar-only credit.
8. Unlinking covered products in a credit adjustment cancels the protection plan and checks the window.
9. FR payment corrections are entered as a matching negative plus the correct positive.
10. Refunds are one payment type per session.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Maintain Customer Deposits`** — STORIS's own recommended route for manipulating deposits, and the
  only one that can do more than append. Unread.
- **`Maintain Order Credits`** — the EMV refund entry point.
- `Financing Control Settings` · `Finance Provider Settings` · `Accounts Receivable Control Settings` —
  three settings files now referenced from four batches.
- `Convenience Fee` settings · `Overpay Charged Off Accounts` · `View a Gift Certificate`.

**Documented but ambiguous**
- **Whether the example-1 arithmetic is intended.** Dividing remaining value by the *original* quantity
  is stated plainly and twice, but it produces a per-unit figure that matches neither the original price
  nor the remaining value per remaining unit. **This needs testing against the live system.**
- **`Escapes`** — a named element on two screens in this batch and one in batch 1; never explained.
- **`Payment on Account`** vs `Payment Amount` on Process Receivables — undescribed.
- **`Adjustment Type`** — debit/credit is implied but the enumeration is not given.
- **`Installation Charge/Restocking Fee`** — one field serving two purposes depending on direction.
- **Whether a protection plan cancellation outside the window is ever blocked**, or only warned.
- **What "Other" means** as a refund method — the third permission has no described mechanism.
- Whether `Minimum Deposit` on the Payment Summary (batch 4) is `Amount Required to Satisfy Minimum
  Deposit` from this batch. Almost certainly, but not stated.

**Inferences (not in section B)**
- `Escapes` is plausibly a keyboard-shortcut or exit-action panel; it appears as a field label with no
  description on three screens.
- Refund "by Other" presumably covers store credit or on-account; not stated.
- The per-unit adjustment arithmetic is presumably intended to spread goodwill evenly across the
  original sale rather than track units; the docs give the rule, not the reasoning.

---

## I. Unknown unknowns

- **Refund method permissioned separately from refund authority** — check, gift and other each gated.
- **One refund payment type per session**, while payments allow several.
- **Four money paths in one routine, mutually exclusive once one is touched.**
- **Installment and RTO settling at the moment of payment**, unlike every other financing path.
- **Remaining value divided by the *original* quantity** on partially returned orders.
- **A fully returned order barred from dollar-only credits.**
- **Protection plans cancelled implicitly by unlinking products**, with the clock from first completion.
- **Financed deposit caps whose base changes with a company setting.**
- **A missing finance authorisation number placing the order on credit hold.**
- **Minimum deposit as a moving, per-line, per-delivery figure** — the value run 2's PO hold release
  tests against.
- **Builder allowance certificates bypassing credit checking.**
- **Convenience fees configured per state and store, and only under Gateway processing.**
- **One setting swapping the signed, archived document produced for every payment and refund.**
- **Negative FR payments rejected unless they match an authorisation record.**

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Order Deposits / Process Receivables | Payments against open vs completed orders |
| FR In-Store Payments | Finance-receivable payments taken in store; settle on application |
| Adjust Dollars on a Completed Order | Debit/credit value adjustment to an invoice, without inventory effect |
| Cancellation Restriction Days | Window for cancelling a protection plan, measured from first completion |
| Maximum Deposit Percent | Cap on a financed deposit, from the Payment Type record |
| Insurance (None/Single/Joint) | Credit insurance election on a financed deposit |
| Required Deposits by Line | Per-line minimum deposit; the source of run 2's `Minimum Deposit Met` |
| Convenience Fee | Card surcharge, per state and store; Gateway processing only |
| Cash Application / Payment Receipt / Sales Order form | The three payment documents, selected by one setting |
| FR Authorization | Record a negative finance payment must match |
| Escapes | Undescribed screen element appearing on three entry screens |

---

## Contract adjudication — batch 5

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** | **CONFIRMED, extended** | Four refund permissions, FR payment gates, and a user-level negative-payment override (F45, F54) |
| **W-052 / W-053** | **relevant, no new accounts** | Adjustments move value without inventory effect; the postings are not named here |
| **W-012** | **relevant** | Protection plan windows run from first completion; FR negatives are day-bounded (F48, F54) |
| **W-055 / W-056** | **relevant** | Minimum deposit is recomputed as lines complete and against back-order remainders (F50) |
| **W-061** | **not relevant to this batch** | — |

---

## Next — batch 6: special orders, COM, warranties and configurators
