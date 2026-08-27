# 06 — Settings, Permissions, and External Dependencies

Every configuration switch and security permission the Enter an Exchange routine touches,
consolidated. This is the compliance surface of the feature.

**Read this before estimating.** The routine itself is four screens; the behavior below is why
it isn't a four-screen job.

---

## Security permissions

### Create a User/Group Actions — Sales Security

| Permission | Governs | Where |
|---|---|---|
| **Enter a New Exchange** | Creating an exchange at all; absent → view-only | `01` |
| **Enter return/exchange/dollar adjustment without original order** | Exchanging goods with no original order on file (**pre-cutover sales**) | `01`, `02` |
| **Edit Return Portion of Existing Exchange** | Editing the return leg and Return Details; absent → inquiry-only | `03`, `05` |
| **Change the salesperson indicated on an open transaction** | Editing Salesperson on an existing order | `02` |
| **Backdate Transactions** | Backdating from an overlap month to the previous (current) month | `02` |
| **Change Delivery Status** | Changing delivery status on the current order | `02` |
| **Change Requested Date in Enter a Sales Order or Enter an Exchange** | Requested Date; override is logged to Audit Comments | `02` |
| **Override Route on Sales and Service Transactions** | Overriding the route | `02` |
| **Access all Delivery Route Codes** | Must be **unchecked** to restrict lookup to the zip's routes | `02` |
| **Override Handling Method on a Fulfillment** | Manually changing a defaulted handling method; also required after a ticket has printed | `02` |
| **Override Allowed Number of Days on Returns** | Returning past the allowed window | `03` |
| **Change reduced warranty price; not exceeding original price** | Raising a prorated warranty refund, capped at original | `03` |
| **Change reduced return price; not exceeding original price** | Raising a reduced return refund, capped at original | `03` |
| **Access sales order line discounts** | Editing line Discount Code | `04` |
| **Manually Link Purchase Orders on Sales Orders and Exchanges** | Whether Purchase Order Reservations appears; absent → standard Security Override | `04` |
| **Override System Calculated Delivery Charges** | Editing the delivery charge; also Remove Delivery Override Flag | `05` |
| Restocking fee override (Sales Security) | Overriding the calculated restocking charge | `05` |

### Create a User/Group Actions — Logistics Security

| Permission | Governs | Where |
|---|---|---|
| **Override capacities when scheduling routes that are full** | The route-capacity override on line add/change and Override Route Capacity Date | `03`, `04` |
| **Print a delivery ticket within POS entry** | The Ticket Print checkbox for deliveries. Also a **prerequisite** for Print Delivery Tickets | `05` |
| **Print a customer pickup ticket within POS entry** | The Ticket Print checkbox for pickups | `05` |
| **Change Fulfillment Status to SCH with a Balance Due** | Scheduling delivery fulfillments on orders with a balance due | `05` |
| Restricted As-Is reason codes (Logistics Security) | Assigning a reason code flagged `As-Is Restricted` | `03` |

### Create a User / Create a User Group

| Permission | Governs | Where |
|---|---|---|
| **Able to Delete or Add Lines When Deposit Applied** | Add/delete lines on orders with deposits or financing | `03` |
| **Approve E1 credit holds placed on customer exchanges** | Releasing the E1 hold | `01` |
| **Fulfillment Location Restrictions** | Which fulfillment locations are selectable | `02` |
| **Delivery Contact Status Codes** | Which contact statuses a salesperson may assign. **Empty = all codes** | `02` |
| **Change Delivery Contact Status** | Updating the contact status | `02` |

### Receivables Security

| Permission | Governs | Where |
|---|---|---|
| **Revolving Worksheet; Override Required Percentage Paid for Add-on** | Add-ons before the required percentage is paid | `05` |

---

## Point of Sale Control Settings

Marked *keep* / *simplify* / *drop* as a recommendation for the new system.

| Setting | Page | Effect | Rec |
|---|---|---|---|
| **Exchanges** | General | Default Fulfillment Method (or none) | keep |
| **Exchanges on Hold at Entry** | — | Places every exchange on E1 hold pending approval | keep |
| Auto-assign transaction numbers | — | Plus button assigns the next sequential number | simplify — always auto |
| **Point of Sale User Verification** | Advanced | Re-authentication after entering an order number | keep |
| **Always Search for Customer** | — | Search for a Customer appears first | simplify |
| **Default Delivery Status** | Logistics | Default for the Status field | keep |
| **Restrict Scheduled Date** | — | Scheduling window for delivery/pickup; override required outside it | keep |
| **Confirm Address on Orders and Exchanges** | — | Phone number required to save | keep |
| **Prohibit Unscheduled Lines** | Logistics/Other | Manager credentials to save with unscheduled lines | keep |
| **Change Fulfillment Status to SCH with a Balance Due** | Logistics | Scheduling with a balance due | keep |
| **Require Audit Text on Exchanges** | — | Hard block: audit comments required to save | keep |
| **Require Either Requested Date or Delivery/Pickup Date on Order** | — | Forces a date when status is CWC/ASAP | keep |
| **Allowed Number of Days on Return** | — | The return window | keep |
| **Restocking Fee on Returns** | — | Auto-calculates a restocking charge | keep |
| **Prorate Returned Warranties** | — | Prorates returned linked warranty refunds | keep |
| **Return Pieces to As-Is** | — | Defaults the Return to As-Is checkbox | keep |
| **Refund Check** | — | When the refund-check prompt is available | keep |
| **Use Alternate Stock Location** | — | Enables alternate stock location logic | keep |
| **Update Stocking Location When Fulfillment Changes** | — | Fulfillment change cascades to stock location | keep |
| **Auto Schedule Days** | — | Ship ≠ Stock location creates an **automatic transfer** | keep |
| **Prefer Incoming Purchase Orders Before Stock Location Schema** | — | Sourcing preference | keep |
| **Prohibit changes to lines once an associated auto-transfer has been manifested** | — | Line change lock | keep |
| **Continue to prohibit changes after auto-transfer has been completed** | — | Extends that lock | keep |
| **Default Handling Methods on Fulfillments** | — | Defaults handling methods by hierarchy | keep |
| **Delivery Charge Recalculation - If Partially Completed** | — | Whether handling-method change recalculates the charge | keep |
| **One Delivery Charge per Order** | — | Only one delivery fulfillment carries a charge | keep |
| **DELIVERY CHARGES - Apply to Direct Shipments** | — | Enables the charge field for direct ship | keep |
| **DELIVERY CHARGES - Prompt for Reason Code if Overridden** | — | Forces a reason code on override | keep |
| **DELIVERY DATES - Allow multiple on order line** | — | Multiple delivery dates per line | simplify |
| **DELIVERY DATES - Restrict based on available date** | — | Override to schedule before ATP/ATC | keep |
| **ATP CALCULATION - Default display of ATC date in Point of Sale** | — | ATP vs ATC as the default display | simplify — show both |
| **DISCOUNTS - Apply Discount Codes to Individual Line Items** | — | Enables line-level Discount Code | keep |
| **Use Order Date for Promotional Pricing** | — | Order date vs line-added date for promo pricing | keep |
| **SOFT KIT – Allow Quantity Ordered Greater Than One** | — | Quantity prompt on soft kits | keep |
| **Allow Room Entry in Enter a Sales Order** | — | Shows the Room field | simplify |
| **Prompt Ticket Print in Order Entry** | — | Deliveries Only / Pickups Only / Both / off | keep |
| **Delivery Lead Days** | — | Window within which a ticket may print | keep |
| **Hide Salesperson Lookup in Entry Processes** | — | Hides the salesperson Search button | drop |
| **Credit Requests - Need to exist prior to entering an order** | — | Approved credit application required before financing | keep |
| Stock Location settings / **Use POS Control Settings** | General | Stock location default resolution | keep |

## Warehouse/Store Location Settings

| Setting | Page | Effect | Rec |
|---|---|---|---|
| **Automated & Manual POS Numbers** | Miscellaneous | Manual order numbering; when blank, enables the read-only original-order view | simplify |
| **Customer Pickup** | Inventory & Logistics | Default pickup location | keep |
| Stock Location settings | Inventory & Logistics | Stock location default | keep |
| **Alternate Stock Location** | — | Alternate stock locations per location (multiple allowed) | keep |
| **Formation – Exclude from Alternate Stock Location** | — | Excludes a formation's products from alternate-stock logic | keep |
| **Restrict Scheduled Date** | — | Scheduling window (with the POS setting of the same name) | keep |

## Other settings files

| Settings file | Setting(s) | Where |
|---|---|---|
| **Purchasing Control Settings** | Sales Order Linkage; Sales Order Linkage Access; Set Purchase Order to Hold; Include Incoming PO's when Determining Availability for Dropped or Discontinued Products | `04` |
| **Protection Plan Settings** | Cancellation Restriction Days | `05` |
| **Sales Discount Settings** | Start Date / End Date; Sales Quote Starting Date; Minimum Eligibility Required (Amount); Customer Price Category | `04`, `05` |
| **Advanced Product Settings** | Line discount code; Prompt User in POS; prep code defaults | `04` |
| **Advanced Customer Settings** | Name, phones, email, addresses, tax fields, Tax Id Expiration Date | `02` |
| **Costing Control Settings** / **Group Settings** | Reduced return percentage | `03` |
| **Reason Code Settings** | This Reason is Used For = As-Is Restricted | `03` |
| **Warranty Category Settings** | Allow Warranty Only Once Per Order | `04` |
| **Distribution Status Settings** | Inventory Availability = Defective | `04` |
| **Individual Zip Codes** | Normal Fulfillment Location; Pickup Fulfillment Location | `02`, `04` |
| **Update Zip Code Settings** | Route code by zip | `02` |
| **Delivery Company Settings** | Calculated delivery charge | `05` |
| **Fulfillment Handling Method Assignment Settings** | Handling method default hierarchy | `02` |
| **Alternate Tax Interface Control Settings** | Address Cleansing | `02` |
| **Credit Application Control Settings** | Require Credit Application | `05` |
| **Accounts Receivable Control Settings** | In-store gift certificate payment type | `05` |
| **Revolving Receivables Payment Plans** | Required Percentage Paid before Add-on Allowed | `05` |
| **Room Settings** | Rooms, including on-the-fly | `04` |
| **Dynamic Escape Settings** | Right-click menu definitions `[LEGACY]` | `04` |
| **Stock Reservation Settings** | Stock Location Schema | `04` |

---

## External processes this routine depends on

Named in the source and **out of scope** for this handoff. Each is a build dependency.

**Search and lookup:** Search for a Customer · Search for a Product · Customer Buy History
Inquiry / View a Customer's Historical Purchases · Open Order by Product · View a Customer's
Open Orders · Route Code Lookup · Multiple Locations Selection · Multiple Selection Lookup

**Order entry components:** Original Order Piece Selection · Inventory Selection · Multiple
Salesperson Commission Screen · Multiple Salesperson Selection Window · Payment Summary Window ·
Amount Tendered Window · Completion Date Entry · Text Entry · Extended Instructions Text Box ·
Enter Reason Code

**Financial:** Finance Receivable Entry · Revolving Worksheet (Short) and (Full) · Finance Credit
Application · Finance Payment Estimator · COD Worksheet · Review Pending Credit Requests ·
Minimum Deposit By Line · Miscellaneous Fees · Order Tax Information

**Inventory and purchasing:** Purchase Order Reservations · Purchase Order Entry · Purchase Order
Linkage Detail Maintenance · Warehouse Stock Inquiry · Kit Inventory/Availability Inquiry · View
Detailed Activity for a Product · Assign Pieces · Prep Codes

**Logistics:** Route Calendar Display · Route Cutoff Calendar · Routing Cutoff Calendar ·
Override Route Capacity Date · Select Fulfillment Date · Print an Order/Delivery Ticket ·
Complete a Pickup without Accessing Order Entry · EMV Terminal Selection

**Exchange-specific:** **Splitting Exchanges** — the highest-priority dependency; see `01` and
`05`

**Reference overviews:** Protection Plan Overview · Delivery Processing Overview (Handling
Methods, Parcel Delivery) · Alternate Tax Interface Overview · Regional Processing

**Third-party integrations:** 2020 Spaces Import · Flexsteel Import · Pro Kitchen Import ·
Ashley Furniture Industries (AFI) replenishment · signature capture · EMV terminals

---

## What this list tells you

Roughly **22 permissions** and **60+ settings** gate a single order-entry routine. That is not
flexibility, it is accumulated policy with no owner — most of these exist because one customer
once needed one of them.

**Recommendation for the rebuild:** do not port the settings one-for-one. For each `keep` above,
ask what LA Mattress's actual answer is, and **hard-code it** unless the business genuinely
varies it by location or over time. Ship a much smaller set of real settings, and put the rest
in the code where they can be tested. Every setting we don't build is a permutation we don't
have to support, and this table is the argument for that conversation with the business —
before Phase 1, not after.
