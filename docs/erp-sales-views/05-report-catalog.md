# 05 — Report Catalog

All 63 reports (articles 33–94 and 138), grouped by domain.

`[STD …]` fields are defined in `01-reporting-platform.md` and are not repeated here. Each entry
lists **purpose**, **criteria beyond the standard set**, and **rules worth implementing**.

Unless stated otherwise, every report: applies Regional Processing scoping, offers
`[STD Send Output to]` / `[STD Export Path]` via Actions > Output Settings, and runs on **Run**.

---

## A. Sales performance

### Report Written Sales Dollars (93)
**Purpose:** written orders and/or adjustments to written orders, by store. Detail breaks each
order out by product with merchandise amount and gross profit; totals per sales order.
**Sort:** completed orders (by order date, then number), then open orders (same).
**Criteria:** `[STD Date Code]`, `[STD District]`/Store, **Order Type** (orders / adjustments /
both), **Report Type** (Detail / Summary), and — Detail only — **Include Audit Comments**,
**Include All Salespeople**, **Include Customer's Full address**.

**Rules:**
- `[GATE]` Summary → **Screen only**. Any of the three Include options → **Excel unavailable**.
- Checking Include All Salespeople renames the column **Primary Salesperson → Salespeople**;
  Include Customer's Full address renames **Customer Name → Customer Name/Address**.
- **Can include data from closed periods** whose End-of-Month has run — because EOM can purge that
  data. (The source suggests EIS or custom reports for historical written sales.)
- **Adjustments** are things like adding/removing a line or changing a price on a saved order.
  `[GATE]` **A/R adjustments — key-offs, payments, refunds — do NOT log as adjustments here.**
- **Negative margins explained:** at write time STORIS uses *average* cost because exact cost isn't
  known. When exact cost arrives (PO received, cost exception resolved) the order updates and an
  adjustment record is written to the Written Business and BTA files. Only cost changed, not price
  — so the margin adjustment is negative. **This is expected behavior, not a defect.** Worth
  reproducing the explanation in our UI; it will otherwise be reported as a bug every month.
- Columns ID, Second Description, Vendor, Category, Marketing Code 1, Marketing Code 2, PO are
  **PRV/Excel/ASCII only**.

### Report Written Sales Summary (94)
**Purpose:** open **and** completed sales orders with detail — merchandise, delivery/installation,
tax, total, deposits, balance due.
**Rules:**
- The source **recommends always setting a date range**; without one the report is slow.
- `[GATE]` **An order can appear multiple times due to partial completions.**
- Lines with a linked transfer **and** a linked PO show **`TP`** beside the back-order quantity.
- With multiple fulfillments, **each scheduled and unscheduled delivery date is its own line**.
- Protection plan charges: Charges column on print/PDF, separate column in Excel/PRV.

### Report Completed Sales Dollars (36)
**Purpose:** sales-related transactions (**excluding service orders**) by location for a date range.
**Includes:** Merchandise Sub-Total, Charges, Customer Discount, Misc Fees, Sales Tax, Total
Invoice, Gross Profit, **Profit Percentage** (= Gross Profit ÷ Net Merchandise after discount × 100,
rounded to the nearest decimal), Operator Initials.
**Criteria:** `[STD Date Code]`, **Detail / Summary / Both**, **Print GL Recap**.
**Rules:**
- **Detail** prints a recap of totals by transaction type and location. **Summary** shows totals by
  primary salesperson and location. **Both** prints Detail, Recap, and Summary.
- `[GATE]` Output restrictions conflict in the source: one passage says Summary restricts output to
  **Printer or Screen**, another says Summary and Both allow **Basic PDF or Report Archive**.
  **Verify against a live system before implementing.**
- **Includes both open and closed sales periods.**
- **Print GL Recap** adds GL account number, description, debits and credits, with company and grand
  totals.

### Report Completed Monthly Sales Dollars (35)
**Purpose:** completed sales at one or more stores for **current period-to-date or last period
total** (excluding service orders). Per order: merchandise subtotal, **landed cost**, **gross
margin**, delivery and installation charges, sales tax, order total, **protection plan price**.
**Criteria:** `[STD District]`, Warehouse Location, `[STD Date Code]`, **Primary Sort** (By Store /
By Date) and — when By Date — **Sort by Store** as secondary.
**Rules:** `[GATE]` `LPTO` against a closed period finds nothing (*"No items Selected"*). Protection
plan in Charges on print/PDF, separate column in Excel/PRV.

### Report Average Value of Sales Orders (34)
**Purpose:** average merchandise subtotal per sales order (optionally layaways), written or
completed.
**Includes** regular, direct-ship, and as-is orders. **Sorts** location → salesman → order.
`[GATE]` **Excludes exchanges, returns, adjustments, and quotes.**
**Criteria:** `[STD Date Code]`, `[STD Salesperson]`, `[STD District]`/Location, **Based On**
(Written = amount at initial entry, ignoring later changes / Completed = amount at completion),
**Include Layaways** (`[GATE]` inactive when Based On = Completed), **Summary Only**.
**Rule:** `[GATE]` **The Grand Total Order Count counts orders, not order-salesperson pairs** — two
salespeople on one order contribute 1, not 2. Get this right; it is the difference between an
honest average and an inflated one.

### Report Sales Commissions (80)
**Purpose:** commission and/or spiff per salesperson per product, with salesperson and overall
totals; also by location when sorted that way.
**Criteria:** `[STD Date Code]`, **Report Type** (Both / Commission / Spiff), `[STD Salesperson]`,
Store Location, **Sort By** (Salesperson / Location), **Exclude Zero Spiff Amount**,
**Detail or Summary** (Summary = one totals line per salesperson).
**Rules:**
- `[SETTING]` Report content depends on *Sort Report By* on the Pricing and Commissions tab of POS
  Control Settings.
- `[GATE]` With Regional Processing active, **the report sorts by district first**, then by the
  chosen Sort By.
- A **legend** prints at the end of both Detail and Summary, listing the filters used plus code
  meanings. A line can carry a type code **and** one or more error codes (e.g. `RE` = commission
  setup error on a return).

| Type | | Error | |
|---|---|---|---|
| `A` | Adjustment | `C` | No Cost Found |
| `R` | Return | `D` | Salesperson Not on Original Transaction |
| `S` | Split | `E` | Commission Setup Error |
| `J` | Commission Adjustment | `O` | Original Transaction Not Found |
| | | `M` | Margin Calculation Error |
| | | `P` | No Price Found |
| | | `X` | Subroutine Error |

- **Payment commission adjustments** (commission varying by payment type) render as pseudo-lines:
  Product Number = **`Pmt Adj xxxxx`** (xxxxx = payment type code), Brand null, Unit Price and Total
  Price = the payment type amount, Comm Pcnt = the adjustment percent, Comm Dollars = the calculated
  adjustment. `[SETTING]` With *Report Type* = Profit Margin, Total Cost is the adjustment factor and
  Total Margin / Marg Pcnt are null; with *Report Type* = Customer Name, the customer name prints as
  on detail lines. Protection plan commissions report as **`P-Plan {code}`**, truncated to 20 chars.
- `[GATE]` **Because payment adjustments are included in the Unit Price and Total Price totals,
  those totals will not tie to invoice-based reports.** Flag this prominently — it is a guaranteed
  support question.

### Report Salespersons Closing Performance (90)
**Purpose:** sales activity against goals per salesperson: **Sales Leads, Orders Written, Closing
Ratio, Total Value, Average Order, Goal Budget, Goal Compare**.
**Criteria:** District Manager (multi), Location, `[STD Salesperson]`, `[STD Date Code]`. All blank
→ all leads, all salespeople.
Run-time options print on the last page.

### Report Sales Exceptions (81)
**Purpose:** exceptions raised during sales and/or service order entry.
**Criteria:** **Report Type** (Both Sales and Service / Sales Only / Customer Service Only),
**Exception Report** (which exception type), `[STD District]`/Store — `[GATE]` **at least one of
district or store is required**.

`[SETTING]` The available exception types depend on POS Control Settings preferences:

| Exception | POS Control Settings tab |
|---|---|
| Credit Checking | Customer → Credit Hold |
| Minimum Stock / Safety Stock / Zero On-hand | Inventory |
| Zero Cost / Gross Profit / Below Cost / Maximum Trade Discount | Profit and Costs |
| Below Minimum Deposit | Customer |
| No/Low Delivery Charge / Delivery Date Change | Delivery |
| Variance From Retail | Pricing and Commissions |

**Rules — read these carefully, they make the report misleading:**
- `[GATE]` **The exception is recorded every time the line is accessed** — re-opening a line with an
  exception records it again.
- `[GATE]` **Fixing the order does not un-report the original exception.**

So the report counts *encounters*, not *outstanding problems*. **Recommendation:** record an
exception once per occurrence, track its resolution state, and report open vs. resolved. As
specified, the numbers cannot support a "how are we doing" question.

### Report Sales History by Initial Marketing Code (83)
**Purpose:** written and delivered sales by the marketing code in force at order entry — marketing
attribution.
**Criteria:** **Report Period** (Current / Prior), **Detail or Summary** (Detail = per store within
each marketing code, and activates `[STD District]`/Store; Summary = per marketing code).
**Rules:** `[GATE]` **Original order amounts only — later adjustments are excluded.**
`[GATE]` **An order with multiple marketing codes applies its full amount to each code.** Totals
across codes therefore **over-count**; never sum them.

### Report Sales History by Adjusted Marketing Code (82)
**Purpose:** the counterpart — totals for **adjustments made when the marketing code changed** in
order entry.
**Criteria:** `[STD Date Code]`, **Marketing Code** (multi), `[STD District]`/Store, **Summary**,
plus a **Status** display.
**Rule:** same multiple-marketing-code over-counting caveat.

### Report Sales Tax (87)
**Purpose:** total tax liability **by jurisdiction** for completed orders over a date range.
Within a jurisdiction, orders and returns sort by completion date. The summary page gives, per
jurisdiction, **total sales, taxable sales, and tax collected**.
**Criteria:** `[STD Date Code]`, locations, tax jurisdictions (one/several/all), summary-page-only.
`[GATE]` **When using the Alternate Tax Interface, use Report Sales Tax Exceptions instead.**

### Report Sales Tax Exceptions (88)
**Purpose:** sales tax exceptions under the **Alternate Tax Interface**.
**Criteria:** `[STD Date Code]`, **Company Number** (`[GATE]` defaults and locks without
multi-company processing), **Tax Exempt Sales Only**, **Summary Page Only**, **Tax Jurisdictions**
(one/multiple/all).

### Report Summarized Sales Receipts (92)
**Purpose:** total receipts **by payment type, by bank, by store**.
**Criteria:** `[STD Date Code]`, `[STD District]`/Store, **Payment Type** (**Detail** breaks the
Credit Cards and Financed columns into individual payment types; **Summary** shows totals only).
**Rules:** `[GATE]` Output: Screen, Printer, Excel, ASCII.
`[SETTING]` Sourced from the `DAILY.DETAIL` file, retained per *Daily Receipts Retention Months*
(Accounts Receivable Control Settings) and **purged by Generate Monthly Reports**. A short retention
window on receipts data is a real constraint — check it before designing reconciliation.

### Report Miscellaneous Fees (68)
**Purpose:** misc fees and charges collected from sales orders. **Page break and subtotal per fee.**
**Criteria:** `[STD Date Code]`, **Company Number** (`[GATE]` multi-company only), **Summary Page
Only**, **Miscellaneous Fee** (multi).
**Rules:** Runs as part of **End-of-Month**, listing that month's fees. `[GATE]` The **summary
version drops invoice number and invoice date**, replacing them with the **GL account** posted to,
and has **no page breaks between fees**.

---

## B. Open orders and fulfillment risk

### Report Open Sales Order Summary (74)
**Purpose:** open sales orders with detail — merchandise, delivery/installation, tax, total,
deposits, balance due.

**Selection tab:** **Sort By** (Selling Location / Ship-From Location / Salesperson / Customer /
Order Source), **By Customer Name** (`[GATE]` active only when Sort By = Customer; otherwise sorts
by customer number), **With Balance Due Only**, `[STD District]`/Location, `[STD Salesperson]`,
Customer, Order Source, **Delivery Status** (`D` all dated / `SCH` / `EST` / `ASAP` / `CWC`; blank =
all), **Delivery Date** and **Order Date** each with their own `[STD Date Code]` + start/end,
**Orders** (All / Deliveries / Pickups / Direct-Ship), **Back Orders** (All / Back Orders / Full
Orders), **Include** (Regular Orders / Layaway Orders / Sales Quotes — at least one required),
**Print** (Product Number / Vendor Model Number).

**Details tab — Include:** All Salespersons, Order Comments (audit comments), Line Comments, Header
Comments, Delivery Address, Delivery Instructions (plus extended), Work phone, Cell phone, Email
Address.

**Rules:**
- `[GATE]` **Orders = All forces Sort By to Selling Location** (its only option).
- `[GATE]` **Back Orders = Back Orders removes Sales Quotes** as an Include option, and removes
  **Layaway Orders** too unless *Fill Layaway Orders* is enabled (Inventory page, POS Control
  Settings).
- `[GATE]` **Any Details-tab Include option restricts output to Screen or Printer** — the source's
  own reason: the other formats "format incorrectly."
- `[GATE]` Users restricted by region or district **cannot sort the report by district/region**.
- Lines with a linked transfer **and** linked PO show **`TP`** beside the back-order quantity.
- Multiple fulfillments → one line per scheduled and unscheduled delivery date.
- Protection plan charges: Charges column on print/PDF, separate column in Excel/PRV.

### Report Open Sales Order Detail (73)
**Purpose:** open orders by product criteria, restrictable by order type, line type, and delivery
status.
**Criteria:** `[STD District]`/**Stock Location**, **Sort By** (Product / Brand / Vendor / Category /
Group / Order Source) — `[GATE]` **the Sort By choice determines which of the matching filter fields
is active**; **Delivery Status** (blank all / `D` / `SCH` / `EST` / `ASAP` / `CWC`), **Back Orders
Only**, **Include Order Types** (at least one), **Line Type** (All Order Lines / Deliveries Only /
Pickups Only / Direct-Ship Only).
**Rules:** On the output, **`#SCH` marks an unscheduled quantity** on an otherwise scheduled or
estimated order. Order Source values come from **Order Source Settings**. Multiple fulfillments →
separate lines per date.

### Report Open Non-Allocated Order Detail (71)
**Purpose:** line detail for orders **not currently reserved**, including layaways and quotes, with
customer name, ship-to address, and home/work phones. Breaks selling price and deposit down by
sales order and model number; totals per order and per store location.
**Sort:** location code, then sales order number.
**Criteria:** `[STD Date Code]`, **Order Type** (layaway orders / sales quotes / both),
`[STD Salesperson]`, `[STD District]`/Location.

### Report Open Orders on Credit Hold (72)
**Purpose:** all sales orders currently on credit hold, sorted by store then order. Shows order
date, estimated delivery date, order number, customer code and name, home and work phones, and the
**credit hold code with description**.
**Criteria:** **As Of Date** (defaults today, cannot be future; includes orders created on or
before), `[STD District]`/Store, **Report Type** (Both Sales and Service / Sales Type / Customer
Service).
**Rule — important:** `[GATE]` A hold code may show as **"D2 - Approved"**, meaning the order was
approved but **EOD has not run since**. EOD clears hold codes from approved orders, after which they
drop off the report. So this report **over-reports until EOD runs**. In a system without a nightly
batch, clear the hold at approval time and this artifact disappears.

### Report Sales Orders with Delivery Dates in Jeopardy (85)
**Purpose:** two reports in one — **Regular Orders**: orders whose products won't have stock by the
estimated delivery date, found by comparing quantity net available against the estimated delivery
date and the PO receiving date; lists **all open sales and purchase orders for the product** so
dates can be renegotiated. **Special Orders**: special orders whose estimated delivery date is
**earlier than the PO's** estimated delivery date.
**Criteria:** **Report** (Regular / Special), **Print Details** (`[GATE]` Regular only — adds
customer name and phones; **Special always prints them**), **Location Type** (`[GATE]` Regular locks
to Stock Location; Special allows Stock or Selling), **Region** ↔ Location, Vendor,
`[STD Salesperson]`, **Primary/Secondary Sort** (`[GATE]` Special only: Location/Region, Vendor, or
Salesperson, blank = by order number; **Regular locks Primary to location/region and Secondary
blank**).
**Rules:** `[GATE]` **Excludes CWC and ASAP orders** (no date to be in jeopardy of) and
**non-saleable products** (floor samples, as-is). With multiple fulfillments, Regular shows **all**
delivery dates; Special shows **only the first date** the PO will miss. Service orders use *Report
Service Orders with Service Dates in Jeopardy*.

This is the most operationally valuable report in the section — it is the "what will we have to
call customers about" list. Prioritize it.

### Report Sales Reservation Reassignments (86)
**Purpose:** track delivery date changes, to keep commitments.
**Criteria:** `[STD District]`/Store, **Number of Days Committed** (`[GATE]` **mandatory** — how long
an order must have stayed reserved to qualify), **Exclude Items Less Than Auto-Fill Days**.

### Report Orders Completed via a Remote Process (75)
**Purpose:** orders processed by **Remote Order Completion** — completed remotely on a mobile device,
plus those that **remain on the manifest** because they failed validation or were not delivered.
The source recommends **running it daily**.
**Criteria:** Location, **Completion Date**, **Route** (`[GATE]` inactive when the location uses
route mapping) / **Truck** (`[GATE]` active only when it does), **Exceptions Only**.
**Rule:** Line item comments display **only on the first instance of the line number**.

### Report Deleted Orders (46)
**Purpose:** voided orders.
**Criteria:** `[STD District]`/Store, Start Date, End Date.
**Rule — the EOD selection logic differs from the on-demand run.** At End of Day it reports voided
orders **not yet reported**, selected by: having a written time; not yet flagged as reported (orders
are flagged once they appear on an EOD report); and deleted on or after the last EOD date but no
later than the current one.

### Report Improperly Processed Orders (57)
**Purpose:** **voided orders that have no written time** — i.e. the ones Report Deleted Orders will
never pick up.
**Criteria:** `[STD District]`/Store, Start Date, End Date.
`[GATE]` **Does not run as part of End of Day.**

Read these two together: one reports voided orders with a written time, the other exists solely to
catch those without. That is a data-integrity gap with a report built around it. In our system,
make the written time non-nullable and neither report is needed in this form.

---

## C. Marketing, leads, and traffic

### Report Detailed Sales Leads Activity (48)
**Purpose:** detailed sales lead activity.
**Selection tab:** every field restricts to one, several, or all; **blank = All**. Fields offer some
combination of Search button, Actions button, and drop-down.
**Sort Options tab:** **Date Range Choice** (Actual Date / First Contact Date / Last Contact Date),
`[STD Date Code]`, and **Primary / Secondary / Tertiary / Quaternary** sorts each with **Ascending
or Descending** order (secondary and beyond may be blank or "None Selected").

### Report Summarized Sales Leads Activity (91)
**Purpose:** lead activity summarized by salesperson and store, **comparing a period this year with
a period last year**.
**Criteria:** District Manager, Location, and four dates: **Beginning/Ending Date Last Year** and
**Beginning/Ending Date This Year**.

### Report Sales Leads Activity Comparisons (84)
**Purpose:** compare lead activity for a period this year (week, month, or year-to-date) with the
same period last year.
**Criteria:** District Manager (multi), Location (multi), **Type of Follow-ups** (quality follow-ups
/ all follow-ups).

### Report InTouch Analysis (61)
**Purpose:** UP System detail and summary analysis: transaction date, store ID, salesperson,
**UP traffic**, **non-traffic UP**, number of sales created, new sales total, plus user-defined **UP
Action Codes** and **Lead Activity Types**.
**Criteria:** `[STD Salesperson]`, `[STD Date Code]`, Location, **Report Type** (**Daily Detail** —
by store, by salesperson, per day; **Salesperson Summary** — aggregated per salesperson per store).
**Rules:** `[GATE]` **Output limited to PRV, Excel, or ASCII.**
`[SETTING]` `[PERM]` Access to sales information is controlled by *Sales Security Access* (POS
Control Settings) and *View All Sales Information* (Sales Security).

### Report InTouch Traffic Analysis (62)
**Purpose:** traffic and non-traffic totals **by store, per hour of the day, per day** in the period.
**Criteria:** `[STD Date Code]`, Location.
`[GATE]` **PRV, Excel, or ASCII only — not Screen.**

Hourly traffic by store is staffing data. Keep it; it is one of the few genuinely analytical outputs
in the section.

---

## D. Warranties and protection plans

### Report Extended Warranties About to Expire (51)
**Purpose:** warranties expiring in a date window, with customer **Name, Home Phone, Work Phone** for
renewal calls. Covers Parts, Labor, or both.
**Criteria:** `[STD District]`/Warehouse Location (`[GATE]` at least one location when not by
district), **Report Type** (Parts / Labor / Both), **Days Before Expiration** (`[GATE]` **1–120**),
`[STD Salesperson]`.

### Report Products Sold Without Warranties (77)
**Purpose:** the follow-up list — customers who bought a product **without** a warranty.
**Criteria:** `[STD District]`/Warehouse Location, **Warranty Category** (multi), **Open or Completed
Orders** (`[GATE]` Closed activates the Date Code and Starting/Ending Date fields; Open does not),
**Report on Parts, Labor, Both**, `[STD Date Code]` (`[GATE]` **mandatory when Closed**).

### Report Salesperson's Warranty Activity (89)
**Purpose:** warranties sold vs. warranties the salesperson **could have** sold — difference in
absolute numbers, percentages, and averages. **Breaks on warranty category.**
**Criteria:** Warranty Category (multi), `[STD Date Code]`, `[STD Salesperson]`,
`[STD District]`/Warehouse Location, **Product Group** (`[GATE]` selecting one **deactivates Product
Category**), **Product Category**, **Sort Salespeople By** (Ascending / Descending within each
location), **Include Summary** (No Summary / By Salesperson / By Location / Both).
`[GATE]` **Excludes returns and exchange returns.**

### Report Missed Sales Opportunities for Protection Plans (69)
**Purpose:** the protection-plan equivalent — plans sold vs. plans that could have been sold.
**Criteria:** **Protection Plan** (multi), `[STD Date Code]`, `[STD District]`/**Selling Location**
(`[GATE]` at least one), `[STD Salesperson]`, **Include Summary** (No Summary / By Salesperson / By
Location / Both), **Open Orders** or **Completed Orders** (`[GATE]` **Completed is the default**),
**Sort Salespeople By**.
**Rule:** `[GATE]` Data comes from **completed orders** and **excludes product and product-category
fields, because protection plans apply to the whole order**, not to lines. That distinction —
plan-per-order vs. warranty-per-line — is a real modeling difference. Note it.

---

## E. Financing and credit

### Report Credit Expirations (38)
**Purpose:** approved, **undelivered** financed orders, with written date and approval expiry, plus
estimated delivery date and whether the order is on a manifest. Used to prioritize deliveries and
spot orders needing re-approval.
**Criteria:** `[STD District]`/Store Location, **Finance Provider**, **Payment Type**, **Days Until
Expiration** (`[GATE]` **mandatory**).
`[SETTING]` Expiry derives from *Valid Approval Days* in Financing Payment Plan Settings.

### Report Financing Aged Trial Balance (55)
**Purpose:** finance receivable balances aged into buckets, per line item with a customer name.
`[SETTING]` Bucket ranges come from *Number of Aging Days* in Financing Control Settings (e.g.
1–7 / 8–14 / over 14, or 1–30 / 31–60 / over 60).
**Criteria:** **Report Type** (**Detail** — transactions by payment type with per-type totals;
**Summary** — aged summary totals per payment type; **Audit** — each item of activity within each
transaction, per payment type), Finance Provider (multi), Payment Type, `[STD Date Code]`, As Of Date.
`[GATE]` **Excludes finance providers with *Auto-Pay Post Bank* enabled** in Finance Provider
Settings.

### Report Financing Settlement Status (56)
**Purpose:** settlement results, produced after settlement completes and re-runnable on demand.
`[GATE]` **Only data already updated with settlement information is available.**
**Sort:** batch number → settlement results → payment type → location → order number, with breaks on
payment type, settlement result, and batch number.
**Detail columns:** store location used at entry, order or reference number, batch date (when the
deposit/invoice posted to FR), customer name, store payment type used for authorization, the
provider-assigned account number, transaction code (`SALE` / `CREDIT` / `PAYMENT`), dollar amount
settled, authorization number, acknowledgement date, and the provider's returned response (plus any
comments if manually closed).
**Recap:** totals per settlement result with counts and dollars; approved transactions split into
sales, credits, and payments, with **approved total = sales − credits − payments**.
`[GATE]` Run from the menu, the recap is the last page. Run via **Generate Daily Reports** or
**Schedule a Process**, **the recap is a separate report.**
**Criteria:** **Finance Provider** (`[GATE]` mandatory), **Merchant Number** (`[GATE]` active only
for **TCP real-time** settlement providers; blank = all), **Batch Number** (closed batches; blank =
all closed), **Transmit Dates** `[STD Date Code]`, **Settlement Results** (blank All / `PND` pending
/ `APP` approved / `REJ` rejected / `ADJ` provider adjustments / `REV` review).

### Report Daily Financing Activity (43)
**Purpose:** all new activity posted to Finance Receivables — invoices, customer returns, and dollar
adjustments originating in Sales Order Entry.
**Criteria:** `[STD Date Code]`, **Exclude Transmitting Finance Provider Activity**, **Report on Date
Type** (System Date / Transaction Date), `[STD District]`/Store Location.
**Rule:** In Excel/PRV a **Salesperson Init** column appears; with several salespeople on an order,
**the first ID is used**.

### Report Daily Financing Adjustments (44)
**Purpose:** adjustments applied to Finance Receivables for a date or range, by system or transaction
date, per location.
**Criteria:** as above.

### Report Daily Financing Payments (45)
**Purpose:** all monies applied to Finance Receivables for a date or range, by system or transaction
date, per location.
**Criteria:** `[STD Date Code]`, **Report on Date Type**, `[STD District]`/Store Location.
`[GATE]` **As a scheduled process, output is Report Archive or XML.**

### Report Customer Financing Payments (41)
**Purpose:** **in-store** finance payments from customers, generated via Enter a Customer
Payment/Refund/Gift Certificate. `[GATE]` **Produces no data if you don't take in-store finance
payments.**
**Criteria:** `[STD District]`/Store, `[STD Date Code]`, As Of Date.

### Report Deleted Orders with Authorized Financing (47)
**Purpose:** deleted orders that carried an approval (authorization) number — the ones where an
authorization may still be live against a dead order.
**Criteria:** **Finance Provider**, `[STD District]`/Store, `[STD Date Code]`, As Of Date, **Report
Type** (System Date / Transaction Date), **Include Financed Deposits**.

### Report on Monthly Credit Applications (70)
**Purpose:** each payment type containing a credit application in the date range.
`[GATE]` **Counts are of applications — how many times financing was applied for — not of orders
with financing.** Don't read it as an order count.
**Criteria:** Finance Provider, `[STD District]`/Store, `[STD Date Code]`, As Of Date, **Include
Financed Deposits**.

### Report Installment Credit Statistics (58)
**Purpose:** authorization and pending amounts on installment contracts.
**Criteria:** `[STD Date Code]`, **Reviewer** (multi via Multiple Staff Selection; the person who made
or is making the review decision — `[GATE]` **inactive when Auto Authorizations Only is checked**),
`[STD Salesperson]`, `[STD District]`/Store (`[GATE]` **district and store are mutually exclusive**),
**Review Status** (multi), **Reason Code** (multi — `[GATE]` **only reason codes with *Reason Usage
Code* = Credit Application appear**), **Auto Authorizations Only**, **Summary Only**, and
**Primary/Secondary/Tertiary Sort** from: Reviewer, Salesperson, Location, Credit Review Status,
Reason Code, **Previously Financed Customer** (`[GATE]` **Primary mandatory**; the others may be
"None Selected").
**Rule:** auto-authorized contracts show **"Auto"** in the reviewer column.

### Report Financed Credit Holds (54)
**Purpose:** financed orders carrying one or more credit holds.
**Criteria:** District (`[GATE]` Regional Processing active), Store, `[STD Salesperson]`, Customer
Code.

### Report Financed Accounts With Multiple Customers (53)
**Purpose:** customers **sharing a finance account number** with another customer — an exception
report. An **asterisk** marks the account number updated as a result of the exception record. Name
and address come from Customer Settings; store, operator, and finance account number print **only on
the first detail line** for each account.
`[GATE]` The screen is active **only when *Multiple Customers per Finance Account* is checked** in
Financing Control Settings.
`[SIDE EFFECT]` **When processed during End of Day, the exception records are deleted once printed.**
That means the paper *is* the record. Do not reproduce that — resolve or retain the exception,
don't delete it on print.
**Criteria:** District (`[GATE]` Regional Processing active), Store.

### Report Installment Receivables Activity (60)
**Purpose:** installment transactions for a period — financed deposits, completed orders, completed
returns, and **refinanced orders**. Runs at EOD (Generate Daily Reports) and on demand.
**Criteria:** **Date** code with **From** / **To** (blank From = earliest, blank To = latest),
District, Store.

### Report Installment Delinquency Statistics Summary (59)
**Purpose:** a **point-in-time snapshot** of A/R delinquency, with totals by store and district plus
grand totals. Available on demand and during EOD `[GATE]` when Installment Receivables is active.
**Per store:** Store Location Description; **Total A/R Balance** (open item + long-term installment);
**A/R Excluding No Payment Contracts** (less the long-term balance of no-payment contracts that
haven't cycled); **A/R After Cash Date** (long-term balance for contracts with no cash date or past
it); **Delinquent Dollars** — `[GATE]` **any past-due balance makes the whole balance delinquent**;
**61 and Over Dollars** (`[GATE]` described as the sum of the 1–30, 61–90, and 90+ past-due totals —
**the inclusion of 1–30 in a "61 and over" figure is almost certainly a documentation error;
verify before implementing**).
`[GATE]` **No date selection and no customer-level detail.**

### Report Revolving Receivables Activity (79)
**Purpose:** revolving financed transactions for a period — financed deposits, completed orders,
completed returns. Runs at EOD and on demand.
`[SETTING]` **Sorting comes from *Sort Reports By* and *Sort Customer By* in Revolving Receivables
Control Settings**: by Store → sorted and subtotaled by store/district then customer; by Customer →
by customer code or name per the settings.
**Criteria:** Date code with From / To, District, Store.

### Report Expected Revolving Statement Cycling (50)
**Purpose:** a **preview** of balances and MMP totals expected at a given cycle date — a preliminary
statement register for spotting accounts needing manual adjustment before cycling.
**Columns:** Customer Code, Customer Name (**first 20 characters**), Plan, Plan Total, **Amount Due**
(short-term balance + newly calculated MMP), **Current Due** (the new MMP), **Past Due** (the
short-term balance — becomes past due if unpaid at the cycle date), Last MMP, Last Payment Amount,
Last Payment Date, Prepay Balance.
**Criteria:** **Cycle Date** — `[GATE]` **must be ≥ the current date**; only customers scheduled to
cycle that day are included; **if none are, a warning appears and another date must be chosen.**
Customers are aged with standard A/R aging and a new MMP is calculated for each.

### Report Applied Customer Credits (33)
**Purpose:** by customer A/R account, all **credit receivable items keyed off** and the **debit items
they were applied to**. Lists all key-offs entered during the period and shows the **post date**.
**Also produced automatically during Day-Ending.**
**Criteria:** `[STD Date Code]`, `[STD District]`/Store.

### Report Current Customer Deposit Amounts (39)
**Purpose:** deposit amount and total order amount per customer.
**Criteria:** **Report Period** (**Perpetual** — to the current date; **End of Period** — only to the
end of the previous unclosed sales period, `[GATE]` **requires an overlap condition on the system**),
**Number of Aging Days**, `[STD District]`/Store, **Report Type** (Detail / Summary), **Order Status**
(All Orders / Open Orders / Canceled Orders).
**Rule:** `[GATE]` **Cancelled-orders-only produces an `AR Balance` column instead of `Order
Total`.** A report whose columns change with a filter is a report that breaks downstream consumers —
worth splitting into two in our implementation.

### Report Outstanding Gift Certificates (76)
**Purpose:** purchases, refunds, redemptions, and **contributions to gift registries** for all
outstanding certificates/cards, with remaining balance and expiration date.
**Criteria:** District / Store (`[GATE]` **not both**), **Sort by Selling Store**, **Certificate
Type** (Both Registry and Non-registry / Registry Only / **Customer Rewards** / **Builder's
Allowance** / **In-Store Use Only**), **Gift Registry ID** (`[GATE]` Registry Only; entering one
**deactivates Gift Registry Type**), **Gift Registry Type**.
`[SETTING]` Sort by Selling Store is meaningful **only when the Gift Certificate GL accounts are
wild-carded** (Gift Certificate Payment Settings + General Ledger Assigned Account Settings) — it
then yields a sub-ledger you can balance to. When the GL account uses the General Cost Center
Indicator, the posting ignores the selling store and the subtotal is useless.

The five certificate types matter — Builder's Allowance and In-Store Use Only carry the refund
restrictions documented in the Exchange handoff (`05`).

### Report Purged Gift Certificates/Cards (78)
**Purpose:** purged certificates/cards, sorted by store with store totals and — `[GATE]` when
Regional Processing is active — district totals.
**Criteria:** `[STD Date Code]`, As Of Date, District (`[GATE]` Regional Processing active), Store.

### Report Electronic Check Pre-Settlement Amounts (49)
**Purpose:** pre-settlement amounts — all transactions since the last settlement. `[GATE]` Run for a
single merchant and the merchant number appears beside the report title.
**Criteria:** **Authorization Service**, **Merchant**.
**Actions:** Output Settings, **Display Last Auto Settle**.

### Report External Credit Card Transactions (52)
**Purpose:** externally processed credit and debit card transactions, for **reconciliation against
the processor's own report** — confirming STORIS agrees on transaction count and monies.
`[GATE]` Requires **Online Credit Card Processing**.
**Sort:** location → transaction date → transaction time, in three sections, **each sorted by and
breaking on the Final Disposition column**:

| Section | Meaning |
|---|---|
| **Incomplete Transactions** | `Incomplete` = never went through the resolution update. `Failed` = went through resolution but STORIS hit an error and could not update files |
| **Incomplete but Resolved** | Originally incomplete, later completed. Sorted Voided → Refunded → Posted |
| **Completed Transactions** | Completed through normal processing |

**Criteria:** `[STD Date Code]` with Starting/Ending Date, **Store Location** (multi), **Pin Pad
Identifier** (`[GATE]` Tender Retail processing only), **Credit Card Type**.
**Rules:** Runs as a scheduled process — `[GATE]` criteria must first be configured by selecting the
report at the Process field and using **Enter Process Preferences**.
With **Shift4**, an error in the **Response** column signals a possible problem with the customer's
transaction, to be verified on Shift4's site (Dollars on the Net). Identified incomplete transactions
are cleaned up via **Resolve Abandoned External Card Transactions**.

---

## F. Inventory, purchasing, and payables (reachable from this section)

### Report Merchandising Activity (67)
**Purpose:** the buyer's report — on-hand quantities per product per vendor, broken out by store and
warehouse, with replacement and average costs, freight factors, price and markup data, delivered (or
written) sales figures, and incoming PO information.

`[GATE]` **A location gets a detail line if any of:** saleable or non-saleable quantity on hand,
quantity reserved, quantity sold this month, quantity sold this year, floor samples, or a net
available quantity exists there.

**Criteria:** Vendor, Group, Category, Collection, **Region**, **Buying Group**, **Inventory** (All
Types / Retail Only / Parts Only), **Special Order** (Include / Exclude / **Only**), **Sales**
(Written / Delivered), **Primary/Secondary/Tertiary Sort** (Buying Group / Vendor / Category / Group /
Collection), **Purchase Status** (Active / Dropped / One Time Buy / **Markdown** / Discontinued),
**Include As-Is Quantity**, **Include Products With No Activity**, **Include Product's Second
Description**, **Include Warehouses** / **Include Stores** (`[GATE]` **at least one required**; both
checked by default).

**Rules:**
- `[GATE]` **Region** requires Regional Processing and limits you to regions permitted by the
  Location Restrictions tab. Selecting regions makes the report **add District and Regional Product
  Settings costs (freight, add-ons) into the replacement cost column**. One region → that region's
  costs. **Multiple regions → costs from the region of the logged-in user's login location.** That
  last rule makes the same report produce different numbers for different users; flag it.
- Buying Group selection changes the whole shape: sorts by buying group → vendor → product, **page
  breaks per buying group**, with the group name at the upper left.
- **Actions:** Output Settings, and **Written Sales Date Range** (`[GATE]` only when Sales = Written)
  opening the Date Range Selection window.

**Column abbreviations** (worth keeping as a legend, not as column names): `FS` floor samples ·
`Whs` total in all warehouses · `Res` reserved qty · `As-Is` · `N/Avl` net available · `B/O` back
ordered · `AI Res` as-is reserved · `Rep` replacement cost · `Avg` average cost · `F/F%` freight
factor · `Vol` volume · `OH` on hand · `QsMtd` quantity sold month-to-date · `QaYtd` quantity sold
year-to-date · `PRICE (Sug/Sell/Sale)` · `RE MU%` replacement-cost markup % · `AV MU%` average-cost
markup % · `DLVD SALES/PERIOD` or `WRTN SALES` — current month, prior 4 months, and last year's next
4 months.

### Report Current Inventory Adjustments (40)
**Purpose:** audit trail of every inventory adjustment **since the last End-of-Day**, grouped by type
(transfers, quantity adjustments, move to As-Is, …). Prints automatically at EOD and on demand.
**Criteria:** **Inventory Type** (All Inventory default / Retail Inventory / Parts Inventory).

### Report Count Sheet Tag Details (37)
**Purpose:** run **after** count-sheet tag entry (Enter a Single/Multiple Physical Count Tags) to
verify the tag entry was accurate. Sorted and subtotaled **by tag**.
**Criteria:** Warehouse Location (one/multiple/all), and — `[GATE]` **only when a single location is
selected** — **Starting Tag Range / Ending Tag Range** (`[GATE]` the tag numbers must exist).

### Report Merchandise Received But Not Invoiced (65)
*(Received Not Recorded Report)*
**Purpose:** purchase orders received but **not yet approved for payment** — audits the
received-not-recorded GL account.
**Criteria:** Purchase Order Number, **Reference Number** (assigned at receiving), **As Of Date**,
**Exclude AP Approvals After As Of Date** (`[GATE]` **available only when the As Of Date is before
today**), Warehouse Location (`[GATE]` at least one), Product, Group, Category, Vendor, **Sort By**
(Vendor / Product), **Inventory Type**.
**Rules:** `[GATE]` **Always shows both product number and vendor model**, regardless of *Add Vendor
Model to Reports* in Inventory Control Settings. With multiple receipts against one PO, **the
earliest receiving date is reported.**

### Report Merchandise Returned But Not Credited (66)
**Purpose:** vendor returns flagged via Create Return-to-Vendor List but with **no AP approval
entered** — audits the returned-not-recorded GL account. `[GATE]` **Once an AP bill exists for the
return, it drops off.**
**Criteria:** Warehouse Location (`[GATE]` at least one), As Of Date, Exclude AP Approvals After As Of
Date, **Return Authorization** (RA number), Product, Group, Category, Vendor, Inventory Type.

### Report Merchandise on Paid Pending Bills (63)
**Purpose:** merchandise on pending bills that are **at least partially paid**, regardless of whether
a receipt exists.
`[GATE]` **No date field — it reports current status.**
**Criteria:** Warehouse, **Type of Inventory**, Product, Group, Category, Vendor, **Sort By** (Product
/ Vendor).

### Report Merchandise Paid but Never Received (64)
**Purpose:** merchandise whose bill was paid but which never arrived. `[GATE]` **"Not received" means
the fully paid Pending Bill was closed.**
**Criteria:** `[STD Date Code]` with Start / End, **Vendor(s)** (multi).

### Volume Rebate Status (138)
**Purpose:** vendor volume rebate plans — whether rebates are posted or still pending, with total
unit quantities and purchase dollars, to assess standing against each vendor's plan.
**Criteria:** **Plan Status** (All Plans default / New / Active / Finished), **Plan Code**
(`[GATE]` when a Vendor is specified, only that vendor's plans are included), **Vendor** (one /
multiple / all), **Rebate Mode** (**Written** — earned on written POs / **Received** — on received
merchandise / **Invoiced** — on invoiced merchandise), **Detail or Summary** (Detail = every
transaction per plan; Summary = one line per plan code).

The three rebate modes are three different revenue-recognition points for the same rebate. Model the
mode explicitly rather than picking one.

---

## G. Customer purchase history

### Report Customers' Historical Purchases (42)
**Purpose:** retail history for one or all customers. **Sorted by product category, then product
group.**
**Includes:** product number, description, brand, customer name, customer phone, price paid,
**Transaction Type** (Order/Invoice, Customer Service, …), transaction Number and Date.
**Criteria:** `[STD Date Code]`, Customer Code, `[STD Product dimensions]` (Product, Group, Category,
Brand), **Show buying price** (`[GATE]` unchecked **removes the Price Paid column**).

---

## Coverage note

63 reports. The recurring shapes are worth naming, because they are what you actually build:

1. **Period + scope + sort + detail/summary** — the default (most of section A).
2. **As-of snapshot** — no range, current state (Merchandise on Paid Pending Bills, Installment
   Delinquency, Open Orders on Credit Hold).
3. **Exception list** — records that should not exist (Improperly Processed Orders, Financed
   Accounts With Multiple Customers, Merchandise Returned But Not Credited, Sales Exceptions).
4. **Reconciliation extract** — matched against an external system (External Credit Card
   Transactions, Financing Settlement Status, Electronic Check Pre-Settlement).
5. **Opportunity list** — a call list, not an accounting artifact (Extended Warranties About to
   Expire, Products Sold Without Warranties, Missed Sales Opportunities, Delivery Dates in Jeopardy).

Shapes 3 and 5 are where the business value is, and they are the ones that should become **live
queues with resolution state**, not reports that get printed and re-printed. See `07`.
