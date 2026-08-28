# Run 03 — Sales Processing — Article Inventory / Coverage Queue

Section: https://storis.zendesk.com/hc/en-us/sections/51426747540884-Sales-Processing
No articles at the section's top level; everything is in five subsections.

| # | Subsection | URL | Articles |
|---|---|---|---|
| 1 | **Sales Order Maintenance** | /sections/15172885147412-Sales-Order-Maintenance | **172** |
| 2 | **Sales Views and Reports** | /sections/51935617013780-Sales-Views-and-Reports | **139** |
| 3 | **Financing** | /sections/15201703219220-Financing | **50** |
| 4 | **Salesperson** | /sections/15173051297172-Salesperson | **39** |
| 5 | **Credit Card Processing** | /sections/51664009169044-Credit-Card-Processing | **5** |
| | **TOTAL** | | **405** |

For comparison: run 1 (Accounting) was 307 articles / 30 batches / 328 findings.
Run 2 (Merchandising) was 115 in-section + 21 linked = 129 articles / 11 batches / 145 findings.

---

## Scope note

`Sales Views and Reports` (139) was dissected once before, in August 2026, as a standalone repo
handoff — not as a parity audit. Re-reading it here would adjudicate it against the `W-0xx` contracts
and the A–J format, which the earlier pass did not do. It is **sequenced last** in the plan below so
that if it is ruled out of scope, nothing is wasted.

Scope as planned: **all 405**, plus linked articles followed out of the section per the handoff rule.

---

## Planned batch order

| Batch | Subject | Source |
|---|---|---|
| 1 | Sales order entry core — `Enter a Sales Order`, totals, order completion | SOM |
| 2 | Line items — pricing, discounts, linked lines, split/clone | SOM |
| 3 | Fulfillments, delivery dates, scheduling, routes | SOM |
| 4 | Payments and tender types — cash, check, EMV, external card, gift certificate | SOM + CCP |
| 5 | Deposits, refunds, adjustments to completed orders | SOM |
| 6 | Special orders, COM, warranties, configurators, kits | SOM |
| 7 | Returns, exchanges, quick sale, shopping cart, pickups | SOM |
| 8 | Customers — creation on the fly, merge, addresses, lists, verification | SOM |
| 9 | Financing — applications, providers, settlement | Financing |
| 10 | Financing — cash drawer, balancing, on-account, manual posts | Financing |
| 11 | Salesperson — Up System, assignments, commissions | Salesperson + SOM |
| 12 | Salesperson — InTouch CRM, leads, sales analysis reporting | Salesperson |
| 13+ | Sales Views and Reports | SVR |

Batch composition will be adjusted as the wiring dictates; the handoff's rule is ~10 articles per
batch with findings emitted after each.

---

## Sales Order Maintenance (172)

Access Control Window · Add Escapes to Current Screen · Add Phone Number · Additional Discounts Fields
Payment Page · Additional Financed Amount Screen · Additional Fulfillment Information · Additional Line
Item Details · Additional Order Detail · Address Verification · Adjust Dollars on a Completed Order ·
Adjust the Net Total · Advanced Line Item Display Screen · Amount Tendered Window · Assign Rooms to
Order · Associated Product Selection Screen · Automatic Payment Results · Builder's Allowance ·
Canceled Orders by Salesperson · Check Entry Window · Clone From Existing Line · COM Order Entry
Maintenance · Commission Spiff Updates Screen · Complete a Pickup without Accessing Order Entry ·
Create a Purchase Order Window · Create a RetailDeck Product · Creating Customers On-the-Fly ·
Credit Card EMV Entry Window · Credit Card External Entry Window · Credit Card Entry Read Only ·
Credit Card Entry Window · Credit Card Security Screen · Customer Lists · Customer Pickup Information
Screen · Debit Card Payment Entry Window · Deleting COM Purchase Orders · Delivery Date Entry ·
District Pricing · Document Selection Screen · Driver License Verification · Electronic Check Entry
Window · Email Address Entry Screen · EMV Terminal Selection · Enter a Commission Adjustment · Enter a
Customer Payment Refund Gift Certificate · Enter a Customer's Revolving Plan · Enter a Customer's
Installment (…) · Enter a Quick Sale · Enter a Return · **Enter a Sales Order** · Enter a Sales Order
New Fulfillment Button · Enter a Shopping Cart · Enter an Exchange · Enter Customer Name · Enter
Discounts on Multiple Lines · Enter Exception Comments · Enter Line Item Comments · Enter Multiple
Discounts Per Line · Enter Order Comments · Enter Special Order Options · Enter Subtotal Discount
Codes · Extended Instructions Text Box · Extended Warranty Data Entry · Finance Credit Application
Selection · Finance Receivable Entry Screen · Fixed MMP Table · Flexsteel Import Process · Fulfillment
Date Merchandise Page · Fulfillment Selection · Gift Certificate Entry Screen · Gift Certificate Manual
Authorization Entry Screen · Gift Certificate Number Entry Window · Gift Registry Name Lookup · Group
Pricing · Import Item Selection · Inventory Selection Screen · Is Customer Address Required · Issue
Customer Rewards · Line Item Linked Document Display · Line Stock Availability Read Only · Main Fabric
Selection · Maintain Linked Lines · Manage Customer Merge List · Mandatory Order Comments ·
Manufacturer's Serial Number Screen · Maximum Trade Discount · Miscellaneous Fees · Multiple Delivery
Charge Entry Window · Multiple Salesperson Commission Screen · Open Cash Drawer · Open Installment
Contracts · Option Selection Screen · Order Completion Details · Order Completion Exceptions · **Order
Completion Process** · Order Source Entry · Order Tax Information · Orders To Be Scheduled Window ·
Original Document Select Screen · Original Order Piece Selection · Override a Capacity Date · Override
Discount Amount · Payment Summary Window · Phone Number Grid · Pre-Authorized Deposit · **Pricing
Rules** · Print Options Window · Pro Kitchen Import Process · Product Configurator Scratch Pad ·
Product Warranty Selection · Purchase Order Linkage Detail Maintenance Screen · Purchase Order
Reservations Screen · Quick Sale Customers · Quick Sale Kits · Quick Sale Order Information · Quick
Sale Printing on Slip Printers · Quick Sale Product Types · Quick Sale Sales and Warranties · Quick
Sale Serial Tracked Products · Reassign a Sales Reservation · Receipt Lookup by Credit Card · Related
Product Selection · Remove Taxes · Report Product Warranty Details · Required Deposits by Line Display ·
Review Status and Merge Individual Customers · Revolving Worksheet Full · Revolving Worksheet Short ·
Room Settings · Route Calendar Display Window · Route Code Entry Window · Sales Margin Scratchpad ·
**Sales Order Deposits** · **Sales Tax Processing Overview** · Schedule Fulfillments by Customer ·
Search for Duplicate Customers to Merge · Select a Delivery Date · Select a Fulfillment Date · Select a
Warranty Screen · Select Route Code Window · Serial Reference Number · Shipping Information Window
Order Entry · Shopping Cart Costed Line Item Display · Shopping Cart Line Item Display · Signature
Acceptance · Special Order Lay-Z-Boy Entry Screen · Special Order Cart Options · Special Order
Configurator · Special Order Entry · Split Merchandise Lines · Start Customer Pickup Monitor ·
Submodules Window · Term MMP Table Read Only · Totals · Trade Designer Information · Trade Pricing and
Discounting · Update a Customer Address · Update a Customer Co-applicant Shipping Address · Update
Customer Mailing Data · Update Line Item Delivery Dates · Update Order Comments · Update Product
Price · Vendor PO Acknowledgement Information Screen · View a Customer's Account Summary Window · View
Linked Transfers · Warranty Linkage Selection

*(list captured from the section index; a small number of entries were truncated in capture and will be
re-derived when their batch is read)*

## Financing (50)

Apply Payments From Finance Provider · Balance a Cash Drawer · Balance Approval by Manager · Balancing
Payment Type Totals · Blind Cash Balancing Screen · Closed Item Batch Selection · COD Worksheet ·
Credit Application Actions Menu · Customer Facing Application · Encompass Credit Application
Co-Applicant · Encompass Credit Application Main Applicant · Enter a Finance Application · Enter On
Account Payment Type · Finalize Financing Settlement · Finance Application · Finance Application
Acknowledgement · Finance Application Entry Primary Read Only · Finance Application Management ·
Finance Payment Estimator · Finance Queue Recap · FR Application Submission Result Screen · FR
Authorization Display Screen · FR Manual Adjustment Detail Actions · FR Manual Adjustments Detail
Screen · FR Manual Post Add New Transaction · FR Re-Write Details Screen · **Installment/RTO Online
Financing Overview** · Maintain Financed Balances · Manage Customer Applications · Manual Authorization
Entry Screen · Manual Post Batch Selection · Manually Close Financing Settlement · Petty Cash
Disbursement · Purge Cash Drawer Data · Reconcile Cash Drawer · Reinstate Action Field · Reopen a
Financed Transaction · Resubmit Settlement Errors · Retailer Disclosure · Retailer Disclosure Signoff ·
Review Application Information · Search for Existing Customer · Standard Finance Credit Application
Co-Applicant · Standard Finance Credit Application Primary · Text Display Read Only · Transfer Financed
On Account Funds · Transmit Financing Settlement · Update Alternate Tax Interface Data · Update
Co-Applicant Personal Information Screen · Update Financing Credit Approvals

## Salesperson (39)

Action Codes · Alternate Contact Information · Assign Salesperson Screen · Column Detail Maintenance
Screen · Create a Sales Analysis Report · Date Range Entry Window Sales Analysis Reporting · District
Manager Settings · District Settings · Edit Assignment Screen · Editing Assignments in the Up System ·
Enter a Sales Lead · Enter Report Parameters · EOD Close Button · Export Customer Sales Lead Activity ·
Export Quote Activity · InTouch CRM Access Levels · **InTouch CRM Overview** · InTouch CRM Security ·
List Entry Window Sales Analysis Reports · Maintain Archived UPs · Maintain Archived UPs Select UP for
Editing · Original Line Up Screen · Range Entry Window Sales Analysis Reports · Reason Entry · Reassign
Customers · Reassign Sales Leads · Refresh Button · Report Written Sales by Salesperson · Retaining a
Salesperson's Rotation Spot in the Up System · Review a Sales Analysis Report Format · Run a Sales
Analysis Report · Sales Analysis Report Fields · Sales Analysis Report Merge Screen · Sales Lead User
Defined Settings · Salesperson Status Screen · Special Occasion Dates · Type of Activity Settings ·
Unstack or Available Screen · **Up System Control Settings**

## Credit Card Processing (5)

Authorization Display Screen · Check Authorization Display Screen · Reprint an External Credit Card
Receipt · Resolve Abandoned External Card Transactions · Review Customer Credit Card Transactions

## Sales Views and Reports (139)

Article list to be enumerated when the run reaches batch 13; section URL above.

---

## Contracts expected this run

Carried from `BROWSER-AGENT-HANDOFF.md`, plus those left open by runs 1 and 2:
`W-005` / `W-006` *(special order and direct ship, from the sales side this time)* ·
`W-012` *(dates and periods)* · `W-042` *(PO↔SO propagation — run 2 contradicted it for stock
products; the sales-side articles are where it is settled)* · `W-050` *(access control)* ·
`W-052` / `W-053` *(GL consequences — run 2 found Merchandising almost silent; sales order completion
is where postings should appear)* · `W-055` / `W-056` *(availability and reservation)* ·
`W-061` *(cost and margin)*.

Open questions run 2 handed forward that this run may settle:
- **`CWC`** — an order class, delivery status and status code across four batches, never expanded.
  Sales Processing is where it should finally be defined.
- **`ASAP`** — same; excluded from allocation, jeopardy and projection in run 2.
- **`approval hold`** — surfaced unexplained in run 2 batch 10.
- **Transaction code `02`** — the gap in the `00`/`01`/`03` enumeration.
- **Which sales order fields update when a PO line changes** — run 2 found the rule runs mostly the
  other way; `Purchase Order Linkage Detail Maintenance Screen` and `Purchase Order Reservations
  Screen` are in this section.
