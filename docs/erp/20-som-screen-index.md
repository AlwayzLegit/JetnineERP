# Sales Order Maintenance — Complete Screen Index

Every one of the **172 screens** STORIS documents in its Sales Order Maintenance section, grouped by
the spec file that specifies it. This is the coverage contract: if a screen is in this table, its
behaviour is specified in files `21`–`28`. Nothing was sampled or skipped.

Read `00-HANDOFF.md` first for the tagging convention and the phase plan. Files `01`–`13` are the
module-level spec (domain model, state machines, phase plan, cutover). Files `20`–`31` are this
screen-level layer underneath it.

| Spec file | Area | Screens |
|---|---|---|
| `21-som-order-entry.md` | Order entry wizard, comments subsystem, auxiliary windows | 19 |
| `22-som-line-items.md` | Line construction, configuration, linkage, serials, warranties, rooms | 27 |
| `23-som-tender-deposits.md` | Payment summary and every tender window, deposits, MMP tables | 31 |
| `24-som-pricing-discounts-tax.md` | Price resolution, the discount taxonomy, fees, tax | 19 |
| `25-som-fulfillment-scheduling.md` | Dates, capacity, routes, scheduling worklist, pickup | 19 |
| `26-som-returns-exchanges-completion.md` | Returns, exchanges, post-invoice adjustment, completion, commission | 11 |
| `27-som-special-orders-com-quicksale.md` | Special orders, PO coupling, COM, vendor imports, Quick Sale | 24 |
| `28-som-customer-identity-lists.md` | Customer creation, verification, dedupe/merge, lists, loyalty | 22 |
| **Total** | | **172** |

## How to use this index

**Do not build 172 screens.** A large share are single-field modal windows that in a modern UI are a
combo box, an inline validation message, or a drawer — not a screen. The index exists so that when
Claude Code implements a flow, it can check which documented behaviours attach to it, and so nothing
is silently dropped.

Build priority, in the order that produces a usable system soonest:

1. **The spine** — Enter a Sales Order (55) with its four steps, line detail (6), Fulfillment
   Selection (74), Payment Summary (108), Order Completion Process (100). Everything else decorates
   these five.
2. **Money correctness** — the tender windows for the types LA Mattress actually accepts, Required
   Deposits by Line (130), Order Tax Information (102), the discount entry screens (28, 60, 63, 66).
3. **Scheduling** — Select a Fulfillment Date (143), Override a Capacity Date (106), Route Code
   Entry (136), Orders To Be Scheduled (103).
4. **Reverse flows** — Enter a Return (54), Enter an Exchange (58), Order Completion Exceptions (99),
   Adjust Dollars on a Completed Order (9).
5. **The rest**, as the operational need appears.

Screens tagged `[LEGACY]` in the spec files — the vendor-specific integrations (Lay-Z-Boy 151,
Flexsteel 72, Pro Kitchen 113, RetailDeck 31) and STORIS-internal plumbing (Submodules 157, Add
Escapes 1) — should not be ported. Their *patterns* matter; their specifics do not.

## The full inventory

### Order entry — spec file `21` (19 screens)

| # | Screen | Purpose |
|---|---|---|
| 0 | Access Control Window | Security-override prompt allowing a user with clearance to authorize access to a restricted… |
| 1 | Add Escapes to Current Screen | Lets authorized users update right-click escape menus directly from the routine they are in, instead of… |
| 7 | Additional Order Detail | Enter or view further information about the current order. |
| 17 | Canceled Orders by Salesperson | View information about a salesperson's canceled (voided) orders. |
| 44 | Document Selection Screen | Display a list of documents associated with an original document (for example a sales order or a GL… |
| 55 | Enter a Sales Order |  |
| 56 | Enter a Sales Order - New Fulfillment Button | Create a new fulfillment; primary use is linking existing lines to it. |
| 57 | Enter a Shopping Cart | Create/edit a list of merchandise a customer is interested in; convertible to a sales order. A customer is… |
| 61 | Enter Exception Comments | Enter and/or edit exception comments for products where an exception comment is required. The comment is… |
| 64 | Enter Order Comments | Enter comments for the current transaction (order-level; no line item selection needed). |
| 67 | Extended Instructions Text Box | Specify additional information about the delivery of the items on the current sales or service order… |
| 82 | Is Customer Address Required | Determine whether customer personal information must be captured for the current order, in… |
| 89 | Mandatory Order Comments | Track changes to existing orders by forcing the user to record why the order changed. |
| 101 | Order Source Entry | Assign or change the order source code for sales orders, returns, exchanges, and dollar-only adjustments. |
| 112 | Print Options Window | Provide the option to print, email and/or digitally deliver the sales document or receipt. |
| 137 | Sales Margin Scratchpad | Examine projected sales price and sales margin scenarios; change the selling price and view the effect on… |
| 157 | Submodules Window | View licensing information for the sub-modules associated with the selected parent module. |
| 159 | Totals | Summary of the dollars associated with the current fulfillment on an order. |
| 166 | Update Order Comments (also titled "Sales Order Comments") | On-line comment tracking — an audit system that automatically tracks the entry and deletion of sales… |

### Line items — spec file `22` (27 screens)

| # | Screen | Purpose |
|---|---|---|
| 6 | Additional Line Item Details | Display/maintain detailed information for a selected sales order line item. |
| 11 | Advanced Line Item Display Screen | Display inventory and delivery information by line item for a selected sales order, and display line… |
| 13 | Assign Rooms to Order | Assign a room designation to multiple line items on an order. |
| 14 | Associated Product Selection Screen | Prompt for add-on sales of products from associated inventory formations. Products belonging to the… |
| 19 | Clone From Existing Line | Clone an existing configurator or special order line on an order. The grid displays existing special order… |
| 27 | Costed Line Item Display Screen - Read Only | Read-only inquiry to view cost and margin details for sales order or exchange records. |
| 62 | Enter Line Item Comments | Add comments to the selected line item. |
| 68 | Extended Warranty Data Entry | Enter information about an extended warranty (for unlinked third-party warranties). |
| 81 | Inventory Selection Screen | Specify serial/reference number, storage location, and/or reason code when the system requires it — e.g.… |
| 84 | Line Item Linked Document Display | View information about linked transfers or purchase orders for line item(s) on the current order. |
| 85 | Line Stock Availability - Read Only | Read-only detailed information on line items in a selected sales order, return, exchange, or service order. |
| 86 | Main Fabric Selection | Read-only screen to select a Primary Option (main fabric) from the list of possible options for the product. |
| 87 | Maintain Linked Lines | Link existing line items on the order to the currently selected fulfillment. All lines on an order must be… |
| 90 | Manufacturer's Serial Number Screen | Enter the manufacturer's serial number for a serial-tracked product. |
| 97 | Option Selection Screen | Read-only screen to select a primary option from the list of possible options for the product. |
| 114 | Product Configurator Scratch Pad | Create price quotes for configured products, giving the salesperson the ability to offer individual price… |
| 115 | Product Warranty Selection | Select one or more linked product warranties for purchase. |
| 127 | Related Product Selection | Prompt for add-on sales of products from inventory formations associated with the product just added. |
| 129 | Report Product Warranty Details | List tangible inventory products that carry a warranty code in their Product records, with warranty… |
| 134 | Room Settings | Create rooms (e.g. Bedroom, Living Room) to be associated with merchandise on an order. |
| 144 | Select a Warranty Screen | Choose which products' warranties the customer wants to return. |
| 146 | Serial/Reference Number | Specify a piece reference number for as-is, special-order, or serial-tracked merchandise (when Serial… |
| 148 | Shopping Cart Costed Line Item Display | View cost and margin details for shopping cart records. |
| 149 | Shopping Cart Line Item Display | View product availability details for shopping cart records. |
| 155 | Split Merchandise Lines | View a line on a sales order and designate a portion of the quantity ordered to be split onto a new line. |
| 167 | Update Product Price | Manually update the group price of an individual line item. |
| 171 | Warranty Linkage Selection | Specify the order (if any) to which you want to link the warranty. |

### Tender & deposits — spec file `23` (31 screens)

| # | Screen | Purpose |
|---|---|---|
| 4 | Additional Financed Amount Screen | Increase the financing amount on the order using the customer's existing credit authorization, rather than… |
| 12 | Amount Tendered Window | Show the cash applied, the total payments applied, and the change due to the customer. |
| 15 | Automatic Payment Results | Review payment information and apply the payment(s) entered on the Process Receivables tab using the Auto… |
| 18 | Check Entry Window | Enter customer payments made by check. |
| 33 | Credit Card (EMV) Entry Window | Process manually entered credit/debit card payment transactions with Shift-4 (EMV-Shift4); also used to… |
| 34 | Credit Card (External) Entry Window | Enter credit card payments for the current transaction where card-holder sensitive data is captured on the… |
| 35 | Credit Card Entry - Read Only | View (not edit) credit card payments for the current transaction. |
| 36 | Credit Card Entry Window | Enter credit card payments for the current transaction. |
| 37 | Credit Card Security Screen | Require the user to manually key the last four digits of the swiped card before the transaction can… |
| 40 | Debit Card Payment Entry Window | Enter debit card payments for the current transaction. |
| 46 | Electronic Check Entry Window | Enter customer payments made by check that are electronically transmitted using the ECA (electronic check… |
| 48 | EMV Terminal Selection | Assign a payment terminal for the current session. |
| 50 | Enter a Customer Payment/Refund/Gift Certificate | Enter one or more payments and/or payment types in a single session (deposits on open orders, receivables… |
| 51 | Enter a Customer's Revolving Plan | Select the revolving plan for which you are entering an additional Revolving Receivables payment. |
| 52 | Enter a Customers Installment Contract | Select the installment contract for which you are entering an additional Installment Receivables payment. |
| 69 | Finance Credit Application Selection | Select the type of credit application being submitted for the customer. |
| 70 | Finance Receivable Entry Screen | Enter payments from a third-party financing provider. The screen prompts for the account number supplied… |
| 71 | Fixed MMP Table | Display the monthly terms and projected MMP amounts as established in the plan settings, for selection or… |
| 75 | Gift Certificate Entry Screen | Redeem all or part of a gift card/certificate as payment on the transaction. |
| 76 | Gift Certificate Manual Authorization Entry Screen | Manually enter/assign a gift certificate number when automatic numbering is disabled. |
| 77 | Gift Certificate Number Entry Window | Assign a number to the gift card/certificate currently being purchased. |
| 95 | Open Cash Drawer | Manually open a cash drawer connected to your machine. |
| 96 | Open Installment Contracts | Review a customer's open installment contracts to help prevent over-payments being posted to the account,… |
| 108 | Payment Summary Window | Specify the type(s) of payment to apply to this transaction; multiple payment types can be applied to a… |
| 110 | Pre-Authorized Deposit | Process pre-authorized deposits — obtain a new pre-authorization or release an existing pre-authorized… |
| 126 | Receipt Lookup by Credit Card | View, print, and email a customer receipt located by credit card number. |
| 130 | Required Deposits by Line Display | Display, line by line, the minimum deposit requirements for an order. |
| 132 | Revolving Worksheet (Full) | Establish a revolving payment plan for the customer, with salesperson access to the customer's credit… |
| 133 | Revolving Worksheet (Short) | Abbreviated worksheet to establish a revolving payment plan without giving the salesperson access to the… |
| 138 | Sales Order Deposits | Describe the deposit-entry sub-windows invoked by payment type during sales order creation. |
| 158 | Term MMP Table - Read Only | View the Sales Order Table (used with Per Sales Order revolving plans only) to determine the term months… |

### Pricing, discounts, tax — spec file `24` (19 screens)

| # | Screen | Purpose |
|---|---|---|
| 3 | Additional Discounts Fields - Payment Page | Apply an additional amount or percent discount to the order subtotal (as opposed to line-item pricing). |
| 10 | Adjust the Net Total | Adjust the net ("Out The Door") total of a sales order — negotiate the total order amount including… |
| 16 | Builder's Allowance | Explain the builder's allowance feature and builder's allowance gift certificates. |
| 26 | Cost Entry Screen | Specify a cost for the selected product when STORIS has no cost on file for it. |
| 28 | Coupon Code Entry | Enter a coupon code to apply a line-item discount; the coupon resolves to a discount code plus… |
| 43 | District Pricing | Used with the product configurator settings to establish regular and sale district pricing for a specific… |
| 60 | Enter Discounts on Multiple Lines | Apply (or remove) one sales discount across multiple eligible lines on the order at once. |
| 63 | Enter Multiple Discounts Per Line | Apply multiple discounts to the selected line item, one at a time, then Save to return to order entry. |
| 66 | Enter Subtotal Discount Codes | Apply or remove multiple global (subtotal) discount codes; add codes to a grid, remove them via the row's… |
| 79 | Group Pricing | Create pricing groups for items on the current sales order so a set of items can be sold at a discounted… |
| 91 | Maximum Trade Discount | Change the maximum trade discount percent available for a line item on a trade sales order. |
| 92 | Miscellaneous Fees | View, enter, or edit miscellaneous fees/charges for the order. |
| 93 | Multiple Delivery Charge Entry Window | Enter separate delivery charges for sales orders containing both delivery items and direct-ship items. |
| 102 | Order Tax Information | View and/or manage the taxes applied to the current order. |
| 107 | Override Discount Amount | Enter, accept, or override the discount amount for the discount code being applied to the order. |
| 111 | Pricing Rules | Documents the pricing hierarchy all STORIS point-of-sale processes follow when determining a default… |
| 128 | Remove Taxes | Refund all sales tax on a completed order via a credit dollar-only adjustment (Avalara only). |
| 139 | Sales Tax Processing Overview | Explain how STORIS decides which state/local sales tax applies across multiple jurisdictions for pickup… |
| 161 | Trade Pricing and Discounting | Enter merchandise pricing and discount information for the current line item; used only with… |

### Fulfillment scheduling — spec file `25` (19 screens)

| # | Screen | Purpose |
|---|---|---|
| 5 | Additional Fulfillment Information | Add another fulfillment to a sales order. |
| 22 | Complete a Pickup without Accessing Order Entry | Fast completion (invoicing) of customer pickup orders at the pickup area itself — e.g. an employee at the… |
| 23 | Completion Date Entry Screen | Enter an order completion date. All GL hits and date references for this order completion use the date… |
| 39 | Customer Pickup Information Screen | Show, for a selected RF bar code location, the status of all pickup orders as they move through the system… |
| 42 | Delivery Date Entry | Specify a delivery date for a line item being converted to a delivery line. |
| 73 | Fulfillment Date - Merchandise Page | Reference topic describing when the Fulfillment Date field on the Merchandise page is active or inactive,… |
| 74 | Fulfillment Selection | Select an existing fulfillment or create a new fulfillment for the new line, allowing a new fulfillment… |
| 103 | Orders To Be Scheduled Window | Used with the "consolidate delivery dates" feature to reschedule other eligible orders onto a common… |
| 106 | Override a Capacity Date | Override the route capacity date so a date outside the available delivery dates for an otherwise-full… |
| 125 | Reassign a Sales Reservation | Manually override the reserve/back-order decisions made by the Just-In-Time Inventory (Automatic Stock… |
| 135 | Route Calendar Display Window | Display available delivery dates for a selected zip code or delivery route. |
| 136 | Route Code Entry Window | Capture a delivery route code when the system cannot find a default one. |
| 140 | Schedule Fulfillments by Customer | Change delivery dates and/or delivery status on multiple orders for a single customer, one fulfillment… |
| 142 | Select a Delivery Date | Schedule the line item for a delivery date that already exists on the order. |
| 143 | Select a Fulfillment Date | Choose a delivery/pickup date for transfers and exchanges, using a calendar of suggested dates based on… |
| 145 | Select Route Code Window | Pick one route code when the customer's ship-to zip code maps to more than one. |
| 147 | Shipping Information Window - Order Entry | Edit shipping address information when entering a Sales Order, Return, Exchange, or Service Order. |
| 156 | Start Customer Pickup Monitor | Specify the location and the update interval (screen-refresh interval) to use when displaying the Customer… |
| 165 | Update Line Item Delivery Dates | Choose multiple delivery dates for the same line item — specify a delivery date and the quantity scheduled… |

### Returns, exchanges, completion — spec file `26` (11 screens)

| # | Screen | Purpose |
|---|---|---|
| 9 | Adjust Dollars on a Completed Order | Make debit or credit dollar adjustments to a specific completed order (invoice), or to the labor, charges,… |
| 21 | Commission/Spiff Updates Screen | Update the commission category and/or the spiff amount for the selected line item. |
| 49 | Enter a Commission Adjustment | Adjust commissions posted to COMPLETED orders (for example to correct an order) — add and/or remove… |
| 54 | Enter a Return | Enter customer merchandise returns and customer refunds. |
| 58 | Enter an Exchange | Enter merchandise exchanges — return merchandise and replacement products on a single document; even,… |
| 94 | Multiple Salesperson Commission Screen | View and edit salesperson commission percentages (the split) for an order, and add salespeople to the order. |
| 98 | Order Completion Details | Specify which pieces were actually completed or not completed while completing fulfillments for sales… |
| 99 | Order Completion Exceptions | Describe how to handle common types of completion exceptions. |
| 100 | Order Completion Process | Describes the end-to-end process of completing individual fulfillments within an order via Sales Order Entry. |
| 104 | Original Document Select Screen | Specify the items and quantity for return during Adjust Dollars on a Completed Order. |
| 105 | Original Order Piece Selection | Specify the items and quantity for return (or adjustment / service problem entry) from an identified… |

### Special order / COM / Quick Sale — spec file `27` (24 screens)

| # | Screen | Purpose |
|---|---|---|
| 20 | COM Order Entry/Maintenance | Enter information on COM (customer's own material) components to be ordered; the system links the COM… |
| 30 | Create a Purchase Order Window | Create a purchase order on-the-fly for a stock product that has insufficient quantity to fill the order,… |
| 31 | Create a RetailDeck Product | Import product data from RetailDeck into the current sales order; STORIS creates a record in the Product… |
| 41 | Deleting COM Purchase Orders | Explain the two ways to remove COM (Custom Order Management / cut-order-made) components from a sales… |
| 53 | Enter a Quick Sale | Fast alternative to Sales Order Entry to speed a customer through point-of-sale (with a scanner: scan the… |
| 65 | Enter Special Order Options | Enter special-order options for a standard special-order product based on the special-order template built… |
| 72 | Flexsteel Import Process | Import the Flexsteel XML file to populate merchandise lines on the order. |
| 80 | Import Item Selection | Select imported (Flexsteel XML) products to be added to the order. |
| 113 | Pro Kitchen Import Process | Populate merchandise lines with product data exported from Pro Kitchen 3rd-party design software. |
| 116 | Purchase Order Linkage Detail Maintenance Screen | Link direct ship line items to purchase orders. |
| 117 | Purchase Order Reservations Screen | Link sales order line items to existing open purchase orders. |
| 118 | Quick Sale Customers | Explains the auto-generated Quick Sale customer code used when no customer is specified on a Quick Sale… |
| 119 | Quick Sale Kits | Explains how hard and soft kits behave in Quick Sale entry. |
| 120 | Quick Sale Order Information | Display general information regarding the current Quick Sale, and allow changing the customer from the… |
| 121 | Quick Sale Printing on Slip Printers | Describes slip-printer receipt printing for Quick Sale. |
| 122 | Quick Sale Product Types | Describes how as-is, serial-tracked, and special-ordered products behave in Quick Sale Entry. |
| 123 | Quick Sale Sales and Warranties | Describes warranty handling in Quick Sale Entry. |
| 124 | Quick Sale Serial-Tracked Products | Describes serial-number handling for serial-tracked products in Quick Sale. |
| 151 | Special Order (Lay-Z-Boy) Entry Screen | Enter the special order product details (frame/fabric/finish/options) required by Lay-Z-Boy to send to the… |
| 152 | Special Order Cart Options | Use with the Custom Art Interface to import custom art options (currently provider Larson Juhl) for the… |
| 153 | Special Order Configurator | Specify the options for a product set to use the standard Configurator when it is added to an order. |
| 154 | Special Order Entry | Create or edit special order products on-the-fly, or specify options/detail/cost for an existing special… |
| 168 | Vendor PO Acknowledgement Information Screen | View purchase order acknowledgement information for the special order items on the Special Order Entry… |
| 170 | View Linked Transfers | View the transfers involved in a multi-leg sequence of transfers for the selected order line. "They are… |

### Customer identity & lists — spec file `28` (22 screens)

| # | Screen | Purpose |
|---|---|---|
| 2 | Add Phone Number | Add/update phone numbers associated with a customer (used when multiple fulfillments are in use); the data… |
| 8 | Address Verification | Identify and select alternate matching addresses to ensure accuracy for delivery and credit reporting… |
| 24 | Confirm Mailing List | View statistical information on the current list and select or re-select the list prior to printing. |
| 25 | Copy/Save-As List Name Screen | Create a duplicate of the mailing list currently loaded in Create a Mailing List, under a new name. |
| 29 | Create a Mailing List | Build named customer selection lists (for mailings/marketing) that are later exported/printed via the… |
| 32 | Creating Customers On-the-Fly | Concept/procedure article — create a new customer without exiting the order-entry program; both methods… |
| 38 | Customer Lists | Overview of generating customer lists containing names, addresses, and/or email addresses, exportable to… |
| 45 | Driver License Verification | Enter the driver's license for the associated customer; the process validates the driver's license when… |
| 47 | Email Address Entry Screen | Capture an email address for a customer who has none, so order entry can continue; the system updates… |
| 59 | Enter Customer Name | Enter the customer name associated with the current order. |
| 78 | Gift Registry Name Lookup | Search for a gift registry by the registry owner's name or by the alternate name. |
| 83 | Issue Customer Rewards | Generate gift certificates based on accumulated customer reward points for selected customers. |
| 88 | Manage Customer Merge List | View and manage the current merge status of customers selected for merging. |
| 109 | Phone Number - Grid | List, add, edit and delete the phone numbers associated with a customer account; an unlimited number of… |
| 131 | Review Status and Merge Individual Customers | Merge individual customers, recommend them for merging, or remove a recommend status. |
| 141 | Search for Duplicate Customers to Merge | Search for duplicate and merge-to customers by last name, phone number, email address and/or SSN,… |
| 150 | Signature Acceptance | Review the customer's captured electronic signature and Accept or Decline it before it is applied to a… |
| 160 | Trade Designer Information | Enter additional information about the trade designer and indicate how the trade discount, if any, should… |
| 162 | Update a Customer Address | Change address and phone information for existing customers; updates the customer record in Advanced… |
| 163 | Update a Customer/Co-applicant Shipping Address | Add, view, change or delete a customer shipping address or a co-applicant additional address (the screen… |
| 164 | Update Customer Mailing Data (also titled "Customer History Maintenance") | Maintain selected header information for customer records stored in the Customer History file (used in… |
| 169 | View a Customer's Account Summary Window | View merge eligibility information for the selected customer. |