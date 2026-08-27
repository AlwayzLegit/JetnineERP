# 03 — Customer Inquiries (the customer 360)

Covers articles 4–7, 100–112, 121–124, 128, 132, 133.

These screens answer "tell me everything about this customer." In STORIS they are ~18 separate
programs; in our system they should be **one customer record page with panels**, composed the
way DTS composes them (`01` § Dynamic Tab Settings).

---

## The shared header

Every customer inquiry repeats the same header on every tab:

**Customer Code** (Search → Search for a Customer) → then read-only **Cell Phone, Home Phone,
Work Phone, Ext, Email Address**, sourced from Advanced Customer Settings.

Build it once as a context header, not per screen.

## The shared "General" panel

*View a Customer's General Information* appears as the General tab on most of these inquiries and
is documented via **View Customer Summary Information** (article 123) — a DTS-only screen, not on
any menu.

| Section | Fields |
|---|---|
| **General** | Address 1, Address 2 (hidden when empty), City/State/Zip, **Ship From Location** (derived from the customer's zip; description shown beneath), **Reward Points** (hidden when rewards disabled), **Credit Remarks** (from *Account Comments* in Advanced Customer Settings) |
| **Totals** | Sales, returns, and service orders for **current year, last year, and lifetime** — dollar amounts **and** transaction counts |

**View Customer Activity** (article 121) is the standard DTS built on this, adding **Reward
Balance** (dollar value of available reward gift certificates) and **Membership Program**, with
tabs: Open Orders, Order Line Details, Historical Purchases, Current Deposits, Historical
Deposits, Open A/R Items, Open Service Orders, Account Summary, Receivables Activity, Historical
A/R Items.

`[SETTING]` Reward Points and Membership Program are visible only when *Activate Customer Rewards
Program* is checked in POS Control Settings.

---

## Order and purchase history

### View a Customer's Open Orders (article 103)
*Menu name: View a Customer's Open Transactions.*

Covers **sales, returns, exchanges, services, and COG documents**.

`[GATE]` **Context filtering — the important rule.** When opened from inside another routine, the
inquiry shows only the order types that routine can act on. From *Enter a Sales Order* it hides
returns, exchanges, and service orders; from *View an Existing Sales Order* it shows everything,
because the inquiry cannot edit anything either way.

`[PERM]` *Maintain a Sales Order (Return/Exchange, etc.) from View Customer Activity* — with it,
double-clicking a row opens the matching **entry** process (Enter a Sales Order / Return /
Exchange / Service Order) rather than a read-only view.

**Summary block:** Credit Limit, Available Credit, Total Orders, Deposits (total deposit
liability), Total A/R (open items plus revolving and installment balances), **Unpaid Balance =
Total Orders − Deposits + Total A/R**.

**Grid:** Order, Order Type, Fulfillment Type, Order Date, Salesperson, Merchandise, Other (taxes,
delivery charges, protection plans), Total, Amount Paid, Balance, **Customer's PO** (populated
only from the Trade/Designer Information screen; 20 chars max).

### View Customer's Historical Purchases (article 124)

Completed **and voided** orders. `[GATE]` Data availability is bounded by the *Completed Orders*
and *Customer Retention Months* settings in POS Control Settings — purged invoices are simply
absent.

`[GATE]` **This inquiry ignores Regional Processing** — when reached from Customer Refund or
Exchange, all completed orders show regardless of selling location. That is correct and
deliberate: you must be able to take back what your company sold, wherever it was sold. Port it,
and note it as an explicit exception in the scoping layer.

Excluded from the grid: orders with no line items (voided ones included), and deleted line items
unless the whole order was deleted. Service lines with a *Closed Without Completion* status
(per Status Code Settings) count as closed.

**Document Filter:** Sales, Exchanges, Returns, Voided Orders, Service Orders, All Transactions.

**Grid:** Order Number, View, Enter a Service Order, View Service History, **Service
Responsibility** (`x` extended warranty, `F` factory, `C` customer, `O` other), Invoice Date,
Date, **Product Code / Vendor Model** (`[SETTING]` *Default Display of Vendor Model in Point of
Sale* switches the default), Description, Quantity, Price, **Adjusted** (Yes/No — whether a
dollars-only adjustment, return, or exchange touched the line), Customer PO, Deliver To,
Protection Plan.

**Right-click:** Export Grid Data (to the local PC), More Details.
`[GATE]` A *Select* option appears only when the inquiry was called by a process expecting a
document ID. `[PERM]` Passing into Enter a Service Order requires *Create a Service Order from
Other Processes* (Service Security). *View Service History* is available for sales orders and
exchanges only.

### Customer Purchase History Inquiry Details Screen (article 6)

Reached by right-click → **More** on a historical purchase line. Display-only throughout.

Header: Customer Code, Invoice Number, Product, Date.

- **General** — **Adjustments** (invoice numbers of returns/adjustments against the original;
  "None" when there are none), Vendor Model, **Warranty Linkages**
- **Vendor** — Vendor, Vendor Model, plus a grid: AP Approval, Approval Date, Purchase Order,
  Purchase Order Date, Invoice, Serial/Reference, **Cost**
- **Linked Service Orders** — Order, Problem, Status, Scheduled Date, Technician, Serial/Reference

This screen is the "everything about this one purchased item" view — cost, PO, warranty, service
history — and it is the most useful single screen in this group. Prioritize it.

### View a Customer's Open Shopping Carts (article 104)
*Menu name: Search for a Cart by a Specific Customer.* Also reached from the Search button at the
Cart ID field in Enter a Shopping Cart.

**Summary block:** Credit Limit, Deposits, Total A/R.

**Grid** — every cart for the customer: Shopping Cart (ID), **Source** (`PS` pocket PC, `QTE` manual
cart, `WEB` eSTORIS), Create Date, Store Location, **Purchase Time Frame** (when the customer expects
to buy, captured at cart entry), Merchandise (estimated amount). The totals row sums Merchandise.
Double-click → View Shopping Cart.

This is the customer-side twin of *Search for a Cart by a Specific Product* (`02`); the two differ
only in which key they pivot on. One cart-search surface with both pivots covers both.

### Customer Order Profile Inquiry (article 5)

Reached from **Enter a Sales Order > Customer page > right-click > Customer Profile**. Line-item
detail for a selected open order.

**Order Number** lists the customer's open orders (first one auto-selected, dropdown in numeric
order); choosing one populates the grid: Product, Quantity Ordered, Quantity Reserved, Backorder
Quantity, Purchase Order Quantity, Acknowledgement Date, PO Delivery Date, PO Number, Quantity
Received, Product Description, Acknowledgement Number, Vendor, Vendor Model, Fulfillment Method,
Fulfillment Date, Fulfillment Status, Fulfillment Location.

Regional Processing applies.

---

## Deposits, balances, receivables

### View a Customer's Historical Deposits (article 102)
Open **and** closed deposits. **Total Deposit Liability** covers **open orders only**.
Grid: Order Number, **Type** (payment type code of the *original* deposit — `[GATE]` the source
warns this can differ from the Daily Receipts Register when a refund used a different payment
type), Date, Deposit Amount (initial), Activity Amount (all other transactions), Reason for
Activity. Double-click → Deposit History Detail Inquiry.

### View a Customer's Historical Balance Details (article 101)
Closed A/R items only — **fully paid, Open Balance = 0.00** — in closed-date sequence.
`[GATE]` Retention bounded by *Number of Months History* in Accounts Receivable Control Settings.
**Period** selector (current period defaults) with Fiscal Year and Date Range displayed.
Grid: Reference, Transaction Date, Due Date, Closed Date, Transaction Type, Memo Reference, Amount.

### View a Customer's Receivables Activity Summary (article 107)

The consolidated receivables view: **open item, installment, and revolving in one place**.

Header rows — Past Due, Current Due, **Total Due (= past + current)**, Total Balance — for each of
Open Item / Revolving / Installment plus a **Grand Total**.

**Grid** (one row per contract, plan, or open-item account): Receivable Type, Reference (contract
number / plan / "account"), Past Due, Current Due, Total Due, Total Balance, Due Date, **After Due
Date** (amount owed if not paid by the due date, **including late fees**), **Payoff Amount** (as of
today), Active Date, Monthly Payment (installment MMP or revolving minimum), **Interest Free
Expiry Date** (installment: when interest starts; revolving: the last not-in-the-past no-interest
plan expiry), Closed Date.

Checkboxes per row, **all checked initially**; **Select** opens View a Customer's Receivables
Activity Details for the checked rows.

`[SETTING]` Activity descriptions are the generic STORIS ones and are renameable via
*Receivables Activity Type Settings*. Worth keeping — house terminology matters to collectors.

**Actions:** View Manage and Adjust Installment Contracts, View All Revolving Activity for a
Customer, View a Customer's Account Balance.

### View All Installment Activity for a Customer (article 110)
Opens **Manage and Adjust Installment Contracts** with most fields read-only. `[GATE]` Four
actions remain live (permission-dependent): **Enter a Sales Order, Enter a Payment, Request Credit
Information, Credit Request Review**.

### View a Customer's Charge Off Details (article 100)
`[GATE]` Active only for customers with **charged-off revolving plans**. Completed-order detail
for the charged-off plan(s); **remaining balance is net of payments received and repossessions
performed**.
Grid: Reference, Posted Date, Amount, Remaining, Waived, Expires, No Pay Until, MMP.

### View a Customer's Statement Messages (article 108)
From View a Customer's Revolving Statement. Read-only messages that appeared on the selected
statement period; double-click a line for the full text.

---

## Revolving — the two big ones

### View All Revolving Receivable Activity for a Customer (article 112)

A pure **DTS container**: Customer field plus thirteen tabs, each delegating to another inquiry —
General Revolving, Revolving History, Pending Plans, Promotional Terms, Current Revolving,
Revolving Statement, Transaction Details, Open Items, Open Items Summary, Deposits, A/R History,
Open Orders, Charge Off Details.

Nothing of its own. In our system this is a layout, not a program.

### View All Revolving Plan Activity for a Customer (article 111)

The **action hub** for a revolving customer, and the densest permission surface in the section.

**Customer block:** addresses, phones, **Customer Store**, **Co-applicant/Co-signer** (label
adapts; hidden when none).

**Due Day** — the customer's payment day (1–28), resolved by a three-level hierarchy:
1. *Due Day* in **Advanced Customer Settings** — seeded at customer creation from the *Store
   Assignment*'s location Due Day, and **updated when the Store Assignment changes**
2. *Due Day* in **Warehouse/Store Location Settings** — if the new store has no due day, **the
   previous value is retained**
3. *Cycle Schedule*, *Default Due Day*, *Auto Assign Due Date* in **Account Statement Cycling
   Control Settings** (global fallback)

**Credit block:** Application Date, **Credit Report Date** (displays *"Expired"* plus the expiry
when a new report is needed; `[SETTING]` governed by *For ___ Days Report is Valid* in Credit
Application Control Settings), Customer Credit Date (`[SETTING]` when *Update Customer Credit
Date* is active — the first date the customer carried a revolving balance), **Collector Assigned**
(`[GATE]` A/R Collections Processing module active and customer in collections).

**Balances:** Credit Limit (**"OPEN"** when none set), Receivables, **Potential Receivables**
(total open order balance), Available Credit, **Prepay Amount**, **Pending Amount** (financed on
plans not yet activated).

**Action buttons — each with its own permission:**

| Button | Gate |
|---|---|
| Credit Status | — |
| **Request Credit** | `[PERM]` *View All Revolving Activity - Request Credit Information* |
| **Review Credit** | `[GATE]` a pending request exists; `[PERM]` *View All Revolving Activity - Request Credit Review* **and** one of *Access employee credit applications and score reporting* / *Access other credit applications and score reporting* |
| **Add Insurance** | `[GATE]` **no** plan (pending or active) already has insurance; `[PERM]` *View All Revolving Activity - Add Insurance*; `[SETTING]` *Apply Insurance* = Plan. Adds to **all active plans at once**; **pending plans are not updated** |
| Comments | `[GATE]` Account Comments exist (Point of Sale tab, Customer Settings) |
| **Enter a Sales Order** | `[PERM]` *View All Revolving Activity - Enter a Sales Order* |
| **Take a Payment** | `[PERM]` *View All Revolving Activity - Take a Payment*; opens Enter a Customer Payment with the **Process Receivables** tab pre-activated |
| **Refund** | Opens Maintain Customer Deposits with the customer defaulted and open deposits, A/R credits, and revolving credit loaded |
| Payment Activity / Payment Estimator | — |
| **Adjust Revolving** | `[PERM]` *View All Revolving Activity - Adjust Revolving Plans* |

`[SETTING]` *Single Prompt for Insurance Change* collapses the insurance-added messaging to one
prompt. `[SETTING]` A signature is required if *Signature Required* is checked in Configure
Document Signature Capture, even when the user declines to print the insurance letter.

**Grid** (pending and active plans): Plan, Total Due, Past Due, Current, Long Term, **Standard
MMP**, **Charge Off**, **In Dispute** (`Yes` whole plan / `No` / **`Partial`** — specific
orders or transactions). Every money column totals at the bottom. **The last row is `Open Item`**,
carrying past-due and current open-item amounts.

**Actions:** Update a Customer Address, **View Qualified Revolving Plans** (read-only list of plans
the customer qualifies for by location and credit-score restrictions from Revolving Payment Plan
Settings).

### View Open Sales Orders with Pending Plans (article 128)
Standard DTS. Orders whose revolving financing is still pending, by plan.
Grid: Order, Total, Deposit, Financed, Balance. Changing the Plan refreshes the grid.

---

## Protection plans

### View a Customer's Protection Plan Activity (article 105)
All registered plans for a customer.
Grid: Plan Code, Plan Description, **Plan Registration Code**, **Plan Registration Date** (date of
first completion), Order Number (original purchase), **Total Price** (completed price **plus any
payments left on an open order**, including manual adjustments), **Completed Price**.
Double-click → details.

### View a Customer's Protection Plan Details (article 106)
Read-only throughout.

Plan Code, **Third Party Provider**, **Original Selling Price**, **Adjusted Selling Price**,
**Completed Selling Price** (amount paid off), **Uncompleted Selling Price**, **First Completion**,
**Last Completion**, plus customer bill-to block.

**Grid — all orders touching this plan**, because a plan accumulates across exchanges: Order,
Type, Date, **Original Line** (the line on the original order the plan was linked to), Product,
Description, Vendor Name, Vendor Model, Brand, Quantity, Product Unit Price, Plan Price. Sortable
and filterable; **default sort by Order**.

This is the read side of the plan-transfer behavior in the Exchange handoff
(`docs/sales/enter-an-exchange/03-step2-return-merchandise.md`). A plan is a long-lived object
spanning multiple orders — model it that way, not as an order line.

---

## Rewards and gift certificates

### View Customer Rewards (article 122) and View Reward Points Earned (article 133)

Near-duplicates. Both show: Reward Points (**total available regardless of active membership
status**), Reward Balance, Membership Program / Date / Renewal Date, plus optional Start/End date
filters over the grid.

`[SETTING]` Points, Balance, and Membership visible only when *Activate Customer Rewards Program*
is checked.
`[GATE]` Part of the Reward Balance may be **unusable**: *Number of Days Before Reward Gift
Certificate Can Be Used* (Membership Reward Settings) can push a certificate's usable date past
the payment date.

**Rewards Earned grid:** Date, Order Number, Reference Number, Amount, **Points Earned**,
**Finance Points Earned**, Points Redeemed, Gift Certificate, View, **Points Available**.
Note: with a third-party loyalty program, **points not associated with an order are also shown**.

**Rewards Redeemed grid** (article 122) / **View Reward Gift Certificates** (article 132): Gift
Certificate, View, Issue Date, **Start Date**, Expiration Date, Amount, **Amount Remaining**,
Order, Reference Number, Points Used.

Three articles for what is one panel with two grids. Build it once.

### View a Gift Certificate (article 109)

Inquiry by **certificate number or customer code**. With a customer selected, the Action button at
the Gift Certificate field opens **Gift Certificate Lookup** listing that customer's certificates.

Fields: Purchased Amount, Purchased Date, **Type** (the gift certificate payment type),
**Remaining Amount**, **Expiration Date** (`[SETTING]` set from *Number of Days Gift Certificate
Valid* in Customer Rewards Control Settings, for rewards-issued certificates), **Registry ID** and
**Registry Type** when linked to a gift registry.

**PIN** — `[PERM]` *View Encrypted Gift Card PIN* (Receivables Security) shows the full six digits;
without it the PIN is masked as `XXXXXX`.

**Payment Terminal** — `[GATE]` active and **required** for Shift4 processing locations; swiping a
card with no terminal assigned raises a warning.

**Certificate Activity grid:** Date, Amount, Reference (`Refund`, `Re-purchase`, `CONTRIBUTION`),
Customer (whoever redeemed, was refunded, or contributed), Customer Name.

Regional Processing applies.

---

## Activity logs

### Customer Activity Log (article 4)

The audit trail on the customer record, plus user comments.

`[SETTING]` **Audit All Customer Activity** (Accounts Receivable Control Settings) turns on
logging of: Customer Settings changes, order activity (purchases and exchanges), shopping cart
activity, billing updates, revolving plans removed from dispute during EOD, changes that put
statements on hold, on-hold customer and revolving statements generated or printed, and imported
comments.

`[SETTING]` `[GATE]` **Customer Settings changes require the Customer file to be selected in the
Track Settings Activity routine** — a second, separate switch. Two settings gating one behavior is
a trap; unify it.

`[SETTING]` Purged per *Customer Retention Months* (Customer tab, POS Control Settings).

**Imported comments** (via Import Data) are labeled *'Imported Comments'*. When the import
spreadsheet's User ID is blank, initials default by run mode: On Demand → the logged-in user;
Schedule a Process → the phantom's user; End of Day (manual) → the user running EOD; End of Day
(automated) → **`EODC`**.

Fields: Customer Code, **Date Code — fixed at Custom Dates and not editable**, Starting Date
(blank = earliest), Ending Date (blank = latest), **Update Comments** (checkbox → Text Entry
screen), Comments (the log).

`[GATE]` Output is **Screen or Printer only**; Export Path inactive.

**Actions:** Installment Activity Log, Financing Activity Log, Output Settings, Print Comments,
**Merged from Customer Activity Log** — for a merged-to customer, opens the log of the
**merged-from** duplicate.

### Financing Activity Log (article 7)

Same shape, scoped to financing comments from application processing, with manual comment entry.
Comments show **date, time, user initials, and text**.

`[GATE]` Screen or Printer only.
Note: *"Once a credit application is approved, finance providers can return up to five promotional
payment plan codes and descriptions for review."*
**Actions:** Output Settings, Print Comments, **Merged-from Financing Activity Log**.

---

## Recommendation for this whole group

Eighteen programs, one subject. Build a **customer record page** with panels — profile, orders,
purchase history, deposits, receivables (open/installment/revolving), protection plans, rewards,
gift certificates, activity log — sharing one context header and one permission model.

Two things to carry forward carefully because they are easy to lose:
1. **Merged-customer traversal.** Merge status in search results, the merged-from activity logs,
   and the merged-to redirect on customer entry are three parts of one feature. Any migrated
   dataset will have duplicates; this is not optional.
2. **The context-filtering rule** on View a Customer's Open Orders — showing only what the calling
   process can act on is genuinely good UX. Preserve the intent even if the mechanism changes.
