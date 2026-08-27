# Pricing, Discounts, Fees & Tax — Screen-Level Specification

The money arithmetic of Sales Order Maintenance, at screen level. Companion to `04`; the later, deeper
read, and it closes two of `04`'s open questions.

**Screens:** 3 Additional Discounts Fields · 10 Adjust the Net Total · 16 Builder's Allowance · 26 Cost
Entry · 28 Coupon Code Entry · 43 District Pricing · 60 Enter Discounts on Multiple Lines · 63 Enter
Multiple Discounts Per Line · 66 Enter Subtotal Discount Codes · 79 Group Pricing · 91 Maximum Trade
Discount · 92 Miscellaneous Fees · 93 Multiple Delivery Charge Entry · 102 Order Tax Information · 107
Override Discount Amount · 111 Pricing Rules · 128 Remove Taxes · 139 Sales Tax Processing Overview ·
161 Trade Pricing and Discounting.

---

## 1. Price resolution — additions to `04`

Screen 111 is the article `04`'s hierarchy came from. Field-level reading confirms all seven levels and
the reordering rule, and adds four things.

**1.1 Level 3 is the entry point `[DOC]`.** Of District and Regional Product Settings, 111 says: *"This
is the first level checked in the 'standard' pricing hierarchy."* Levels 1–2 are pre-hierarchy lookups
— as-is/Twilight state on the *piece*, Price/Spiff/Commission on the *customer's* price category —
while 3–7 are product/location-scoped. Implement as override lookups, then the ordered chain.

**1.2 Markdown sources `[DOC]`.** Advanced Product Settings (Pricing tab), District and Regional
Product Settings (District Settings tab), and the Single Product Review Screen.

**1.3 District Pricing (43) feeds levels 3 and 6, at configurator granularity `[DOC]`.** Option Price
Configuration or Base/Grade Configuration → Actions. Per district: a **Selling Price** (regular) and a
**Sale Price** bracketed by **Sale Start**/**Sale End**, for one *option or grade* — not the whole
product. District picked via the Read-Only Lookup Window; Vendor, Base Frame, Option Type,
Option/Grade, Fabric Grade display from the prior screen. Grid: District · Selling Price · Sale Start ·
Sale End · Sale Price. **Add** pushes a row; **Save** commits and returns. `[INFER]` Sale price feeds
level 3 (district promotional), selling price level 6 (district regular) — the names map exactly onto
the two district levels, though 43 never says so. `[DECIDE]` Configurator machinery; out of scope if LA
Mattress sells no configured goods.

**1.4 Group Pricing (79) is a price, not a discount `[DOC]` + `[INFER]`.** Merchandise tab → Actions.
Bundles lines of the current order into a numbered **Group** with one **Group Price** for the set
(framed as "10% off a bedroom set, 25% off a living room set", but what is stored is a price). All
lines start in **group 0**. Two edit paths: multi-select checkboxes then **Update Group**, or the
in-grid **Maintain** button opening *Update Product Price* for one line — Maintain is *selectable only
when no group is active on the screen*. Grid: Checkbox · Product/Vendor Model · Quantity · Price ·
Maintain · Group Price · Group · Extension (the group's price, last column of that group) ·
Description; **Order Subtotal** display-only. A product flagged **Kit Component** in Advanced Product
Settings cannot participate, and STORIS' own docs recommend kits instead. `[INFER]` It writes a
per-line price displacing the hierarchy price — hence the same variance check as a discount (§4.4),
with no discount audit trail. `[DECIDE]` Recommend not porting it; use kits plus a bundle code.

**1.5 Is there a separate "Pricing Level table"? — still open `[DECIDE]`.** Not settled here, and
neither 43 nor 79 is it. Screen 111 names it twice: in the customer-matrix rule, where the matrix loses
to *"the Pricing Level table or the Price/Spiff/Commission Table, both of which override"*, and in its
settings list as an entry distinct from "Price/Spiff/Commission Table". So the source treats it as a
separate object beating customer price matrices, yet never places it among the seven levels and gives
it no screen. Ask STORIS; meanwhile implement one Price/Spiff/Commission resolver behind a named seam.

---

## 2. The discount taxonomy and stacking precedence

Closes `13` #5b and `04`'s "define the discount type set and stacking rules". Every fact is documented;
the *assembly into one taxonomy* is `[INFER]` — no single article presents it.

### 2.1 A discount is a code plus five orthogonal attributes `[DOC]`

Codes live in **Sales Discount Settings**.

| Attribute | Domain | Effect |
|---|---|---|
| Value type | `Amount` / `Percent` | Amount-type shows dollars plus a derived percent; percent-type the reverse. Percent stored as a whole number, two decimals |
| Basis | Standard selling price / SRP | "Apply Discount to Suggested Retail Price" — computes off CRP or SRP |
| Scope | Line / Subtotal | Line needs POS Control "Apply To = Individual Line Items"; subtotal needs "Apply Discount Codes to Subtotal" |
| Combinability | combinable / exclusive | "Line Discounts - Cannot be Combined with other Discounts" *inactivates* the line's Discount field |
| Overridable | yes / no | "Override Discount Amount" opens screen 107 on entry |

Plus three gates: **Minimum Eligibility Amount**; **activation flags** ("Activation – Apply to Saleable
Line Item Amounts", "Activation – Apply to As Is Line Item Amounts"); and **"Only Available to Link to
Coupons"**, which removes the code from direct entry entirely.

### 2.2 The mechanism set `[DOC]` / `[PARTIAL]`

```
LINE SCOPE
  L1  Discount code on the line                (Merchandise > Discount Code)
  L2  Multiple codes on one line               (63)
  L3  One code across many lines               (60)
  L4  Coupon at the line                       (28 — resolves to a code + overrides)
  L5  Price override on the line               (161 / Merchandise Price field)
  L6  Trade / designer discount                (161 — computed, not chosen)
  L7  As-is and Twilight pricing               (a price; hierarchy level 1)
  L8  Group price                              (79 — a price; §1.4)
  L9  Membership-plan automated line discounts (see `03`)
SUBTOTAL SCOPE
  S1  Coded subtotal discounts, ordered grid   (66)
  S2  Subtotal coupon                          (66 — exclusive with S1)
  S3  Additional discount Percent              (3 / 66)
  S4  Additional discount Amount               (3 / 66)
ORDER SCOPE
  O1  Net total ("Out The Door") adjustment    (10 — destructive; §4.1)
  O2  Builder's allowance                      (16 — credit against amount due, NOT a discount)
```

`[PARTIAL]` Two special *forms* are named, never enumerated: **BOGO** and **Apply to Additional
Purchase** — both disqualify other lines, so they apply one line at a time and are excluded from screen
60's check-box mechanism. A third is **formation-qualifying** (§3.1). Treat `{standard, BOGO,
apply-to-additional-purchase, formation}` as observed-not-closed.

### 2.3 Stacking precedence — the order of operations

Sequence is a **setting**, not entry order: screen 60 defines its Price column as *"original unit price
minus all other discounts applied earlier in the Order of Operation"*; 63 says removal recalculates the
rest *"based on the order of operation established by Point of Sale Control Settings"*. `[DOC]` except
where marked.

```
STAGE 0  PRICE RESOLUTION (per line)
         hierarchy (04, "The price hierarchy") → customer matrix → markdown → group price (79)
         ⇒ original_selling_price ; SRP available in parallel

STAGE 1  BASIS SELECTION
         The PRIMARY discount fixes the basis for the whole line:
           "Automatically Select Optimal Lines for a New Discount" ON → the code giving the best
           discount becomes primary regardless of entry order;  OFF → first entered wins.
         SRP and Standard codes MAY coexist on a line, but every non-primary code computes against
         the PRIMARY's basis — an SRP code after a standard primary computes off the standard
         price, not MSRP.

STAGE 2  LINE DISCOUNTS — SEQUENTIAL AND COMPOUNDING
         for each code in Order-of-Operation sequence:
             running_balance −= code_value(running_balance)
         Screen 63 records Balance = "the ledger total at the time the discount is applied".
         Discounts COMPOUND on the running net; they do NOT each apply to the original price.
         Gates: an exclusive code ends the line (field inactivates); Minimum Eligibility Amount
         (or the coupon's override of it) must be met.

STAGE 3  PRICE OVERRIDE — MUTUALLY EXCLUSIVE WITH STAGE 2
         discount then override → warning, discount code REMOVED
         override then discount → warning, entry REJECTED

STAGE 4  TRADE DISCOUNT (trade/referral orders only) — after regular discounts / override; §5.2

STAGE 5  MERCHANDISE SUBTOTAL = Σ line net_selling_price × qty
         (60: Net Selling Price "matches the Subtotal amount on the Payment tab")

STAGE 6  CODED SUBTOTAL DISCOUNTS (S1/S2) — applied in GRID ORDER, top to bottom, each against the
         running balance. Grid position reflects how the discount is to be applied, not entry order.

STAGE 7  ADDITIONAL AMOUNT / PERCENT (S3/S4)
         NET SUBTOTAL = subtotal − coded subtotal discounts − additional amount/percent
         [INFER] additional applies AFTER coded — the coded grid's Balance is computed without
         reference to the additional fields, which appear as a separate display total. NOT stated.
         [DECIDE] confirm: with a percent-type additional discount the orderings differ in money.

STAGE 8  CAPS
         • total discount percent ≤ "Maximum Subtotal Discount __ %"
         • "Reduce Subtotal Discount Amount when it exceeds the Open Order Subtotal" → clamp to
           subtotal, with a confirmation prompt
         • trade: per-line "Maximum Trade Discount" percent (§4.3)

STAGE 9  CHARGES, FEES, TAX (§6, §7) — never discounted by any of the above

STAGE 10 NET TOTAL ADJUSTMENT (O1) — destructive; unwinds stages 2, 3, 6, 7 (§4.1)
```

**Exclusions, as a set `[DOC]`:**

| A | B | Relationship |
|---|---|---|
| Line discount code | Line price override | Exclusive per line, asymmetric outcomes |
| Subtotal Discount Code | Subtotal Coupon Code | Exclusive — a code inactivates the coupon field, *unless* the code is "Only Available to Link to Coupons", when a message states the code cannot be entered alone and a coupon is required |
| Exclusive line code | Any other line code | Field inactivates |
| BOGO / Apply-to-Additional-Purchase | Multi-line application | One line at a time |
| Subtotal discounts (S1–S4) | Alternate Tax Interface active | Fields inactivate. **Line discounts remain available under ATI** |
| Net total adjustment | All discounts and coupons | Mutually exclusive |
| Line-level tax exemption | Alternate Tax Interface | Not compatible (§7.4) |

`[INFER]` The ATI rule reveals the required internal representation: a tax engine prices per line, so a
discount with no line to attach to cannot be transmitted. With an engine, either drop subtotal
discounts or allocate them pro-rata to taxable lines before the call. Decide before phase 2 — this is
the margin-leak seam `04` warned about.

---

## 3. Discount entry screens, field by field

### 3.1 Enter Discounts on Multiple Lines (60) — one code, many lines `[DOC]`

Actions menu on the Merchandise page of Sales Order / Exchange / Quick Sale, and the Parts, Labor,
Charges pages of Service Order.

The **Discount** arrow lists codes eligible for *any* line. Selecting one lists every eligible line and
applies the discount to all; unchecking a line's box removes it there, recomputing on each toggle; the
header box toggles all. Once a code is selected an **Amount** or **Percent** field appears (hidden
until then). Overridable amount-types open screen 107; afterwards the per-line amount is editable
directly in the grid's Discount column. Extra actions: Coupon Code Entry, View Order Discounts.

Display: Order · Type · Store · **Original Selling Price** (merchandise pre-discount) · **Discount
Total** (this discount, across the grid) · **Other Discounts** · **Net Selling Price** (after all line
discounts; equals the Payment-tab Subtotal) · **Minimum Required** (the code's Minimum Eligibility
Amount, or a coupon's override; hidden when the code has no minimum).

**Formation Total** — display-only; hidden until a formation-associated code is selected, hidden
entirely absent a formation association, and *no impact on eligibility*. Shows the subtotal of every
line qualifying for the inventory formation **including lines flagged not discountable and lines
failing the discount for any other reason**, from the *original* price; an SRP-basis discount on a line
converts that line's original price to SRP before accumulation. A threshold base deliberately wider
than the discount base — a separate computation, not a filter.

Grid: Check Box · Line reference · Product (or Vendor ID when toggled) · Description · **Price** (unit
price before *this* discount = original minus discounts applied earlier in the Order of Operation) ·
Discount (per unit price) · Quantity · Net Price. No sorting, no column hiding.

### 3.2 Enter Multiple Discounts Per Line (63) — many codes, one line `[DOC]`

From the Discount Code field's Action button. Display: Product · Description · Order · Date · Type ·
Store. **Discount** takes a code (Search → Read-Only Lookup Window); each is added to the grid at once
and the field re-arms. **Original Selling Price** shows the current selling price or SRP per the primary
code's basis. **Discount** totals all line discounts; **Line Extension** is the extended amount after
them.

Grid, one row per code: Discount · Description · Percent · Amount · Quantity · **Balance** (ledger
total when that discount was applied) · **Remove**. No edit in place — remove and re-enter, or use
screen 60 to adjust the amount. Removal re-runs the Order of Operation over the remaining codes and
refreshes the display.

### 3.3 Coupon Code Entry (28) `[DOC]`

Extra action button at any Discount / Discount Code field, including inside 60 and 63. One field,
**Coupon ID**, validated against **Sales Coupon Settings**. On success the system pulls the associated
discount code, that code's settings, **and the coupon's overrides** — the discount percentage or
amount, the minimum amount required, and the active dates.

1. **A coupon can resurrect an unusable code.** Documented example: a code whose ending date was a week
   ago is absent from the Discount Code drop-down, but a coupon whose end-date override runs to next
   week applies both. **Both** coupon and code are validated; failure rejects the coupon with a message.
2. **Removing the coupon removes the associated discount code.** The pair is atomic.

Auto-invocation: the screen opens by itself when "Activation – Apply to Saleable Line Item Amounts"
and/or "Activation – Apply to As Is Line Item Amounts" is checked **and** "Only Available to Link to
Coupons" is also checked.

### 3.4 Enter Subtotal Discount Codes (66) `[DOC]`

Payment page → Action button at the Discount Code field, from Sales Order, Quick Sale, Exchange,
Return. The only screen showing all four subtotal mechanisms together.

**Additional Discounts > Percent / Amount** — §3.5. **Discount Code** — Search → Discount Code window,
multiple codes; active only if POS Control "Apply Discount Codes to Subtotal" is checked; overridable
amount-types open screen 107, reachable later via Action → Override Discount Amount. **Coupon Code** —
validated on entry against three conditions: exists in Sales Coupon Settings; flagged **Coupon
Reusable** *or* **Coupon Redeemed** unchecked; passes all normal discount-code validation. A second
pass runs when **Add** commits it to the grid.

Totals: SUBTOTAL (merchandise, pre-subtotal-discount) · Coded Discount · Additional Discount · NET
SUBTOTAL. Grid: Discount Code · Description · Coupon Code · Percent · Amount · Balance · Remove.
Amount-type codes show dollars plus derived percent; percent-type the reverse. Removal confirms, then
recalculates the net subtotal. Save returns to the Payment page with Discount Code set to the new
calculated amount.

**Coupon redemption lifecycle `[DOC]` — implement exactly:**

```
add to grid, Save                     → Coupon Redeemed set
remove the grid row                   → Coupon Redeemed cleared
order returned / voided / adjusted    → Coupon Redeemed NOT cleared
order deleted                         → Coupon Redeemed cleared
net total adjustment                  → Coupon Redeemed cleared (per 03 / 04)
manual                                → editable in Sales Coupon Settings
```

**"Modify Coupons and Subtotal Discounts on Returns and Adjustments"** is validated when the grid
updates; without it an authorised override is required.

### 3.5 Additional Discounts fields — Payment page (3) `[DOC]`

A fixed **Discount Amount** and a discount **percent** against the order subtotal. They *do not alter
any line item's selling price* — a subtotal reduction with no line allocation. Active only when POS
Control → Pricing and Commissions → "DISCOUNTS – Apply Additional Amount or Percent to Subtotal" is
checked. Inactive under ATI (line discounts still allowed). Capped by "Maximum Subtotal Discount __ %".
Clamped, with a confirmation prompt, when "DISCOUNTS – Reduce Subtotal Discount Amount when it exceeds
the Open Order Subtotal" is checked.

**Exchange rule `[DOC]`:** on an exchange against an original order carrying a fixed Discount Amount,
*the sale-side discount may not exceed the return-side discount*. A distinct clamp from Maximum
Subtotal Discount, on exchanges only.

---

## 4. Overrides and limits

### 4.1 Adjust the Net Total (10) — the destructive one `[DOC]`

Payment page → Actions. Negotiate the "Out The Door" figure — merchandise plus tax, fees, delivery,
installation — and let the system back-solve merchandise. **Current Net Total** (display) and **New Net
Total**; the new total *cannot be less than the current sum of charges, fees and taxes*. On Save:

```
1. removes ALL line-item discount codes and resets prices to original selling prices
2. resets manually entered price overrides
3. removes ALL global discounts — coded and additional
4. RETAINS delivery and installation charges at their current amounts
```

Not another discount layer: a reset-then-solve that destroys the discount audit trail. `[DECIDE]`
Snapshot what was removed and persist a derived implied-discount figure, or margin analysis cannot tell
a negotiated order from a full-price one. Not STORIS behaviour.

Permission: **"Change the Net Total on Sales Orders"** (Sales Security); without it the Security
Override Screen appears at the Action button.

### 4.2 Override Discount Amount (107) `[DOC]`

Opens automatically whenever a code flagged **Override Discount Amount** in Sales Discount Settings is
entered — Merchandise or Payment tab, and from inside 60, 63, 66. One field, **Discount Amount**:
pre-filled with the code's default if one exists (Save accepts it), otherwise **required**. Must be
greater than zero.

### 4.3 Maximum Trade Discount (91) `[DOC]`

Trade Pricing and Discounting → Actions → Adjust Trade Percent. **Maximum Trade Discount** shows the
percent established for the product or vendor; a new value applies **to this line item only** and *does
not affect product or vendor settings*. **Any change generates an exception record**, reportable at EOD
or on demand via Report Sales Exceptions. Permission: **"Change maximum trade discount for a sales
line"**, or a security override.

### 4.4 The special-order price-variance check `[DOC]`

Fires from discounting (60) and group pricing (79) alike:

```
variance% = (original_selling_price − discounted_price) / original_selling_price
if variance% > applicable Special-Order Variance %  →  price variance exception
```

Threshold from Advanced Product Settings → Variance %, Warehouse/Store Location Settings →
Special-Order Variance %, or POS Control Settings → Special-Order Variance %. `[DOC]` Precedence is the
cascade recorded in `03` (product → location → POS control; all blank means no check), which comes from
the order-entry article. Superseded note: an earlier draft of this file called precedence undocumented.
`[PARTIAL]` Remaining uncertainty is only whether a blank at one level falls through or terminates. Precedence
among the three is never stated. Option prices can move the original selling price and so the ratio.
**Variance Exceeded Alert**, **Reason Required** and **Comment Required** govern how it surfaces. Same
formula as `03`.

---

## 5. Trade, builder and program pricing

### 5.1 Trade Pricing and Discounting (161) `[DOC]`

Merchandise tab: a trade product code, or the extra Action button at the Price field, opens this
per-line screen — the only place regular discounting, price override and trade discount meet.

| Field | Behaviour |
|---|---|
| Suggested Retail Price | Display — SRP from product settings |
| Current Retail Price | Display — CRP as calculated when the product went on the order |
| Regular Discount | Discount code for this line. *"This field is active only if the product is set as Discountable in the Product record and the Apply To field in the Point of Sale Control Settings is set to Individual Line Items."* Computed amount shows at far right; behaves identically to the Merchandise-tab Discount field |
| Price Override | Override to the calculated CRP; same rules as the Merchandise-tab Price field |
| New Selling Price | Unlabelled, right of Price Override. Starts at CRP; shows the discounted price however arrived at |
| Trade Discount | Computed percent and amount (§5.2); changeable only via Adjust Trade Percent (91) |
| Net Selling Price | After regular discounts, trade discounts and/or price override; written back to the Merchandise-tab Price field |

*"When you make changes to the fields on this screen, the Trade Discount and Net Selling Price fields
are recalculated and re-displayed immediately."*

Mutual exclusion, verbatim: *"You cannot enter both a discount and a price override on the same line
item. If you enter a discount using this field, and then enter a Price Override, the system issues a
warning and removes the discount code. If you enter an override price and then attempt to enter a
discount code, the system issues a warning and rejects the entry."*

Re-entry: changing **Apply the Trade/Designer's Discount** on the Trade Designer Information screen of
an existing order opens this screen automatically for **every Merchandise line, one at a time**, with
Trade Discount reflecting the change and Regular Discount and Price Override active. Removing the
designer does *not* trigger it. `[INFER]` A bulk recalculation implemented as a forced per-line walk;
batch it.

### 5.2 The trade discount calculation `[DOC]`

```
1. ratio          := CRP / SRP
2. pct_available  := Trade Designer Discount Settings table lookup(ratio)
                     — the portion of the maximum discount allowed at that ratio
3. max_pct        := Maximum Trade Discount from product or vendor settings
                     (overridable per line via screen 91)
4. applicable_pct := pct_available × max_pct
5. applied_pct    := f(applicable_pct, "Application of Trade Discount" on Trade Designer Information)
```

Worked example, verbatim numbers: selling price $1400, SRP $2000 → ratio 70%; the table gives 50% at a
minimum ratio of 70%; maximum trade discount for the product is 20%; applicable = 50% × 20% = **10%**.
With "Apply 50% of trade discount to Sales Order" selected, the applied trade discount is **5%, or
$70.00**.

### 5.3 Builder's Allowance (16) `[DOC]`

Not a discount and not a price — a **per-fulfillment credit against amount due**, entered on Additional
Order Detail. Documented case: a contractor allots $12,000 across 12 refrigerators; each delivery
fulfillment carries its own Deliver To address and a $1,000 allowance, and the end customer pays any
excess.

- Used with **delivery** fulfillment methods.
- Both Additional Order Detail and the Payments page include it when computing amount due.
- **STORIS Standard Print forms omit it**; a form showing it must be built in Forms Designer.
- **Shipment gate:** allowance + all deposits must cover the entire order total. No ship ticket for a
  sub-document with a builder's allowance still carrying a balance due.
- An order containing **both** a builder's allowance **and** a non-delivery line item cannot be filed
  and cannot print a delivery ticket.
- **Gift certificates:** created through Import Data from a conversion spreadsheet, applied via a
  payment type configured in Gift Certificate Payment Settings. Merchandise bought with one **cannot be
  refunded as cash** — refunds issue as in-store-use-only gift certificates, whose payment types are
  also configured there.

**Content defect `[DOC]`:** the permission is **"Allow Change to Builder Allowance"** here and **"Edit
the builder allowance amount within POS entry"** in the Additional Order Detail article. One control,
two names.

---

## 6. Charges and fees

### 6.1 Miscellaneous Fees (92) `[DOC]`

Customer page → Actions, from five processes — editable from exactly one, **Adjust Dollars on a
Completed Order**. Sales Order, Exchange, Return and Service Order all get a **read-only** version.

**Fee Charge** (code; Search opens the Fee Charge window; double-click a grid row to edit an existing
one) · **Rate** (display-only, from setup) · **Amount**. Grid: Fee/Charge · Description · Rate · Amount
· **Taxable** · **Fulfillment**. Code, description, rate and taxable flag originate in **Miscellaneous
Fee Settings**. **With multiple fulfillments these fees are calculated at the fulfillment level** —
consistent with tax and delivery (`03`, `04`).

`[DECIDE]` A misc fee cannot be added during original order entry at all, only afterwards through a
dollar adjustment. If LA Mattress charges haul-away, setup surcharges or restocking at the point of
sale, this is a real workflow break, not a doc artefact.

### 6.2 Multiple Delivery Charge Entry (93) `[DOC]`

Payments tab → Actions → Multiple Delivery Charges. **Delivery Charge** (delivery items) and
**Direct-Ship Charge** (direct-ship items). Active **only if both**: POS Control Settings →
**Direct-Ship Delivery Charges** is checked, **and** the order contains both delivery *and* direct-ship
items. While active, **the ordinary Delivery Charges field on the Payments tab is inactive** —
alternatives, never additive. `[INFER]` This split is per charge-class, whereas the misc fee grid is
per-fulfillment; do not unify them.

---

## 7. Tax

### 7.1 Which jurisdiction gets the money — the five-step decision (139) `[DOC]`

The model `04` lacks. Decided per order:

```
STEP 1  What is tax based on?
        Read the Store field on the order and the selling location's zip (Warehouse/Store Location
        Settings), then Charge By in Sales Tax Settings (General tab) for that state.
        Charge By ∈ {Not Applicable, Point of Sale, Ship From Location, Point of Possession}
        Not Applicable → no tax.   Point of Sale → overrides all other possibilities.

STEP 2  Which state receives the tax?  (Charge By × Fulfillment Method)
        Point of Sale       : all four methods → selling store's state
        Ship From Location  : Take With → selling store's state (Store field location code)
                              Delivery / Customer Pickup / Direct Ship → state in Ship From Location
        Point of Possession : Take With → selling store's state
                              Customer Pickup → state of the Pickup Location field
                              Delivery / Direct Ship → state in Deliver To, else customer default

STEP 3  In state or out of state?  Two comparisons:
          (a) selling store's state       vs state of possession
          (b) Ship From Location's state  vs state of possession
        EITHER matches → In State → 4A.   NEITHER → Out Of State → 4B.

STEP 4A In State     → read Sales Tax Settings for the Step-2 state, add its Tax Rate % → Step 5
STEP 4B Out of State → read Tax Out of State Sales for the Step-2 state
                       unchecked → no state tax;  checked → add that state's Tax Rate % → Step 5

STEP 5  Additional (local) rates. For EACH of the three locations — selling, delivered-from,
        point-of-possession — read the Additional Tax Code on that zip code's settings:
            Out of State + Tax Out of State Sales unchecked → not charged
            Out of State + checked                          → charged
            In State                                        → charged
```

**Selling Store Tax Exception `[DOC]`.** Active only when Charge By = Point of Sale. Selling state and
possession state differing, flag checked → state and local jurisdictions assigned from the **possession
zip** (warehouse zip for pickups; shipping-address zip for deliveries and direct ships) *regardless of
whether the possession state charges by Point of Possession*. Unchecked → from the selling store. No
effect in-state. If the assigned jurisdictions do not tax out-of-state sales, computed tax is
**$0.00** — a legitimate zero; log the reason. Both worked examples in the source (AR/TN/MO, TN/AR/MS)
reduce to one rule: only jurisdictions with "Tax Out of State Sales" checked contribute.

**Refunds and exchanges `[DOC]`:** credit is given for the original tax paid while the completed order
is on file, *even if the refund occurs in a different jurisdiction at a different rate*. Tax credit
comes from the original document; never recomputed.

### 7.2 Order Tax Information (102) — beyond `04`

- **Access `[DOC]`:** Adjust Dollars on a Completed Order, Quick Sale, Return, Exchange, and **both**
  the Customer page and the Payment page of Sales Order entry.
- **Permission split `[DOC]`:** the *whole* Order Tax Exemptions section is gated by **Change Taxable
  Settings** (System Security) with an inline override box. Unchecking a defaulted-checked Charge Sales
  Tax additionally needs **Override Charge Sales Tax** (Sales Security) — *except* when the customer is
  tax exempt, where no security is required. Fulfillment Tax Detail is gated separately by **Edit the
  calculated sales tax amount on open transactions** (Sales Security).
- **Field sources `[DOC]`:** Charge Sales Tax ← **Charge on Sales**; Charge National ← **Charge
  National**; Expiration Date ← **ID Expiration Date** (Advanced Customer Settings); Tax ID ← Customer
  Settings.
- **Add Additional Tax `[DOC]`:** present on entry; reveals a companion area with **Jurisdiction**
  (Search → Jurisdiction window) and **Fulfillment Method**, plus Save + Add Another / Save / Cancel. A
  manual tax-row insert, distinct from editing a calculated row.
- **Completed-order asymmetry `[DOC]`:** companion **Amount**, row **Amount** and **Tax Jurisdiction
  Code** (with lookup) are editable **only** from Adjust Dollars on a Completed Order; elsewhere
  read-only, companion amount hidden. **Tax Type** always display-only. **Zero Tax Amount** zeroes
  applied tax. **Remove** applies only to local jurisdictions in certain scenarios, hidden otherwise.
  **Total** appears only with >1 fulfillment method. **Exchange Order Displayed** (Sale / Return / Net)
  only on exchanges. Actions → **Display Original Payments** opens the read-only Payment Summary.
- **Open-order propagation `[DOC]`:** when a customer's taxable status changes, this screen is the
  mechanism for pushing it onto that customer's **open orders**. `[DECIDE]` Batch or per-order is not
  stated; assume manual and plan a bulk re-tax job, or a customer becoming exempt mid-quarter leaves
  taxed open orders.

### 7.3 The exemption lifecycle `[DOC]`

```
LEVEL 1  CUSTOMER  Advanced Customer Settings: Charge on Sales, Charge National,
                   Tax Exemption ID, Tax Id Expiration Date
         validation on a sales order, or the SALE half of an exchange:
             Tax Exemption ID populated
         AND Tax Id Expiration Date populated
         AND expiration date >= the WRITTEN DATE of the sale
         viewable read-only via Order Tax Information (Tax ID, Expiration Date)

LEVEL 2  ORDER     Order Tax Information — Charge Sales Tax / Charge National Sales Tax
         THIS ORDER ONLY; never alters the customer's future tax status
         toggling either flag recalculates the applied tax rows immediately
         checking a defaulted-unchecked Charge Sales Tax CLEARS Tax ID and Expiration for the order

LEVEL 3  LINE      Additional Line Item Details — Tax Exempt Authorization Number
                   (max 20 alphanumeric under Avalara, per 04)
         NOT COMPATIBLE with an Alternate Tax Interface

LEVEL 4  PLAN      Some Rent-to-Own financing plans make the sale tax exempt, OVERRIDING
                   Advanced Customer Settings. Where the RTO plan is not itself tax exempt,
                   the Level 1 criteria must be met.
```

`[DOC]` Under **CCH**, if Charge Sales Tax and/or Charge National Sales Tax are blank, **Tax ID becomes
required**.

**Content defect `[DOC]`:** screen 139 announces "three criteria" for non-exempt RTO orders then lists
two (ID populated; expiration on or after the written date). `[DECIDE]` The third is probably the
customer's Charge on Sales flag; confirm.

### 7.4 Alternate Tax Interface behaviour `[DOC]`

- ATI active → the entire Order Tax Information list view and companion area are **inactive (greyed)**.
  The exemptions section is **not** affected.
- **Subtotal discounts cannot be used with ATI** (§2.3); **line-level tax exemption is not compatible
  with ATI**.
- Some ATI interfaces use the **tax class** rather than the product taxable setting.
- Unchecking **Charge National Sales Tax** under ATI: with a customer Tax ID, Tax ID and Expiration
  populate from the customer; **without** one, the flag is forced back to checked and a message states
  Tax ID is mandatory and the customer's tax settings must be updated.
- **Offline fallback `[DOC]`, stated twice in the source:** when communication with Avalara or Vertex is
  offline, STORIS' own five-step method (§7.1) is used. An engine therefore does **not** remove the need
  for internal tax tables — it makes them the degraded mode. This materially changes `13` #5.

### 7.5 Remove Taxes (128) — Avalara-only tax refund `[DOC]`

Global extra Action button on the Payment page of Adjust Dollars on a Completed Order. Refunds **all**
sales tax on a completed order as a credit dollar-only adjustment. Display-only Order Number and
Fulfillment; a grid of the current fulfillment's taxes; **Remove Tax**, then **Save** (enabled only
after Avalara validation passes).

Pre-entry validation: (1) ATI module licensed **and** provider is Avalara; (2) Original Order number is
a valid, completed order; (3) the order was created in a location that reports to Avalara —
Warehouse/Store Location Settings → Alternate Tax Interface = `Use Active Alternate Tax Interface` or
`Use STORIS Sales Tax and Report to ATI`.

On Remove Tax, Avalara checks whether the order exists on its system and **whether a sales tax return
has already been created for the month the original order was completed** — if so it refuses the
override; if the return has been *filed*, the adjustment cannot be done at all.

Constraints: only orders from Enter a Sales Order, Quick Sale (valid Customer Code), or the **sale
portion** of an Exchange. All tax is refunded — **individual jurisdictions cannot be selected**. Any
prior merchandise adjustment (return or dollar-only) blocks it. No merchandise may be added before or
after. Afterwards the total tax shows in the Sales Tax field and the Totals column for refund, and you
**cannot** return to the Merchandise page or make any other Payment-page adjustment.

`[DOC]` The source spells the enum `User Active Alternate Tax Interface`; read as `Use Active…`.

---

## 8. Cost Entry Screen (26)

`[DOC]` Appears automatically during order-entry processes when **no cost can be found for the selected
product**; the operator supplies one. Documented example: an exchange whose original invoice is
unknown, on a special-order product.

`[DOC]` **Content defect.** One paragraph. No Access breadcrumb (every sibling screen article has one),
no field definitions at all — no label, mandatory flag, validation or default for the cost field — no
buttons or actions. Body size sits at the section's minimum boilerplate baseline: the content never
migrated.

`[DECIDE]` Cost drives margin, commission and spiff (`13` #2), and letting a salesperson type an
arbitrary cost at the till is a reporting hazard. Recommend defaulting to vendor/last cost, requiring a
reason, restricting by permission, flagging the line for review. None of that is STORIS behaviour.

---

## 9. Consolidated

### 9.1 New business rules

Stacking rules are §2.3 and not repeated. Beyond those:

1. A **coupon can apply an otherwise-unavailable discount code** via its date / amount / minimum
   overrides; removing the coupon removes the code.
2. Coupon redemption survives return, void and adjustment; cleared only by deletion, grid-row removal,
   or a net-total adjustment.
3. **Net-total adjustment resets all prices and removes all discounts** but retains delivery and
   installation charges — destroying the discount audit trail.
4. Miscellaneous fees are **read-only outside Adjust Dollars on a Completed Order**; multiple delivery
   charges **replace**, not supplement, the Payments-tab delivery charge.
5. **Formation totals include non-discountable and non-qualifying lines**, from original price, and
   never affect eligibility.
6. Trade discount is **computed**, not chosen; any per-line maximum change writes an **exception
   record** reportable at EOD.
7. Tax credit on refunds/exchanges comes from the **original document**, never recomputed at the current
   rate; and an ATI does **not** replace the internal tax engine — the five-step method is its offline
   fallback.

### 9.2 Enums introduced

```
Sales Discount value type      : Amount | Percent
Discount basis                 : Standard selling price | Suggested Retail Price
Discount scope (POS "Apply To"): Individual Line Items | Subtotal
Discount special form          : standard | BOGO | Apply to Additional Purchase | formation  [PARTIAL]
Product Kit Source of Price    : Component | Product
Tax Type                       : National | State | Local     (sort: national → state → local)
Charge By                      : Not Applicable | Point of Sale | Ship From Location | Point of Possession
Fulfillment Method (tax)       : Customer Pickup | Delivery | Take With | Direct Ship
Sale classification            : In State | Out of State
Location ATI mode              : Use Active Alternate Tax Interface | Use STORIS Sales Tax and Report to ATI
Exchange Order Displayed       : Sale | Return | Net
Tax fulfillment selector       : (the order's fulfillment methods) + None
```

### 9.3 Settings referenced

**POS Control Settings** — Apply Additional Amount or Percent to Subtotal · Apply Discount Codes to
Subtotal · Maximum Subtotal Discount % · Reduce Subtotal Discount Amount when it exceeds the Open Order
Subtotal · Apply To · Automatically Select Optimal Lines for a New Discount · discount **Order of
Operation** · Special-Order Variance % · Variance Exceeded Alert · Reason Required · Comment Required ·
Direct-Ship Delivery Charges · Default Display of Vendor Model in POS.
**Sales Discount Settings** — Override Discount Amount + default · Minimum Eligibility Amount · Apply
Discount to Suggested Retail Price · Line Discounts – Cannot be Combined with other Discounts · Only
Available to Link to Coupons · Activation – Apply to Saleable / As Is Line Item Amounts.
**Sales Coupon Settings** — Coupon Reusable · Coupon Redeemed · percent/amount, minimum and date
overrides.
**Sales Tax Settings (General)** — Charge By · Tax Rate · Tax Out of State Sales · Selling Store Tax
Exception. **Zip Code settings** — Additional Tax Code.
**Advanced Customer Settings** — Charge on Sales · Charge National · Tax Exemption ID · ID Expiration
Date. **Advanced Product Settings** — Variance % · not-discountable · Kit Component · Pricing tab.
**Warehouse/Store Location Settings** — Special-Order Variance % · selling zip · Alternate Tax
Interface mode · Use Warehouse Inventory. **Miscellaneous Fee Settings** — Fee Code · Description ·
Rate · Taxable. **Trade Designer Discount Settings** — CRP/SRP ratio → % of maximum discount table.
**Product / Vendor settings** — Maximum Trade Discount · Discountable. **Gift Certificate Payment
Settings** — builder-allowance and in-store-use-only types. Also referenced: District and Regional
Product Settings · Price/Spiff/Commission Table · Customer Price Settings · Product Kit Settings ·
Single Product Review Screen · Forms Designer · Import Data.

### 9.4 Permissions referenced

| Permission | Area | Guards |
|---|---|---|
| Change the Net Total on Sales Orders | Sales | Screen 10 |
| Change maximum trade discount for a sales line | Sales | Screen 91 |
| Modify Coupons and Subtotal Discounts on Returns and Adjustments | Sales | Grid updates in screen 66 |
| Override Charge Sales Tax | Sales | Unchecking a defaulted-checked Charge Sales Tax (waived if the customer is exempt) |
| Edit the calculated sales tax amount on open transactions | Sales | Fulfillment Tax Detail, screen 102 |
| Change Taxable Settings | **System** | The whole Order Tax Exemptions section |
| Allow Change to Builder Allowance / "Edit the builder allowance amount within POS entry" | Sales | Builder's allowance — **two names, one control** |
| Sales security user settings (unnamed) | Sales | Additional Discounts and subtotal Discount Code fields |

Every one accepts a **security override** entered by an authorised user in place of the permission,
consistent with `10` and `13` #13.

### 9.5 `04` open questions this slice CLOSES

- **"The docs never enumerate discount types or their precedence"** → **CLOSED.** §2.1 the
  attribute-based type system, §2.2 the mechanism set across line / multi-line / subtotal / order scope,
  §2.3 the ten-stage order of operations and the exclusion matrix. `13` #5b can be struck, leaving the
  residual sub-questions below.
- **"Internal tax or an engine changes the shape of phase 2"** → **narrowed.** §7.4: the internal
  five-step model is the mandatory offline fallback under both Avalara and Vertex, so an engine does not
  delete the internal tax surface; and an engine *removes* two features outright — subtotal discounts
  and line-level exemptions. A feature trade-off, not an architecture unknown. Rewrite `13` #5 so.
- **"A Pricing Level table may exist that the docs never place"** → **NOT closed** (§1.5). Named as a
  distinct settings object and a peer override to Price/Spiff/Commission, never placed. Neither District
  Pricing (43) nor Group Pricing (79) is it.

### 9.6 Remaining open questions

1. `[DECIDE]` **Additional vs coded subtotal discount order (Stage 7)** — never stated; with a
   percent-type additional discount the orderings differ in money.
2. `[DECIDE]` **Is the tax base gross or net subtotal?** Screen 102 defines Taxable Subtotal as
   "merchandise subtotal plus taxable charges" without saying whether subtotal discounts are already
   deducted. Compliance-relevant; resolve before writing tax code.
3. `[DECIDE]` **Order of Operation** — what are its configurable values? Referenced three times, never
   enumerated. Without it, discount arithmetic is not reproducible.
4. `[DECIDE]` **Pricing Level table** — same object as Price/Spiff/Commission, or an eighth resolver?
5. `[PARTIAL]` **Special-Order Variance % precedence** across product / location / POS settings.
6. `[PARTIAL]` **Discount special forms** — is `{standard, BOGO, apply-to-additional-purchase,
   formation}` closed?
7. `[DECIDE]` **Misc fees uneditable during order entry** — accept, or make editable?
8. `[DECIDE]` **Open-order re-tax on customer status change** — batch or per-order?

### 9.7 Content defects in the source

- **Cost Entry Screen (26)** — body never migrated: no fields, no access path, no actions (§8).
- **Builder's allowance permission** — two names across two articles (§5.3).
- **Screen 139** — promises "three criteria" for non-exempt RTO, lists two (§7.3).
- **Screen 128** — enum reads `User Active Alternate Tax Interface`; almost certainly `Use Active…`
  (§7.5).
- **Screen 43** — never states which hierarchy levels its two prices feed (§1.3).
