---
title: Update Receivables Credit Approvals
article_id: 15202312987156
section: 04-receivables
index: 115
url: https://storis.zendesk.com/hc/en-us/articles/15202312987156-Update-Receivables-Credit-Approvals
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Revolving Receivables > Update Receivables Credit Approvals

Accounting > Receivables > Update Receivables Credit Approvals

Accounting > Installment > Update Receivables Credit Approvals

Use this program to approve orders that have been placed on AR credit hold. Depending on the Initial Check and Final Check fields in the Point of Sale Control Settings, the system may place orders on AR credit hold. Note that credit approval and rejection information for specific orders appears in sales order comment tracking screens.

To remove from credit hold an order for which multiple credit holds exist, you must approve all hold codes. To approve F3 (unapproved financing) credit holds, use the Update Financing Credit Approvals (3rd Party Finance Approvals) program.

To approve C5 (Preauthorized Deposit) credit holds cannot be approved here. Instead, access the order directly using Enter a Sales Order then go to the Payment tab, open the Payment Summary Window and select Pre-Authorized Deposit from the extra Actions button.

If you attempt to work with a sales order on C6 credit hold, you are redirected to Review Pending Credit Requests. Here, you can approve the credit request and thus release it from hold. If you attempt to remove a C6 credit hold from a sales order, the following message is displayed: "Revolving pending credit decision credit holds cannot be maintained in this process."

Customer Code Customer Code

Enter the number of the customer whose credit hold status you want to approve or reject. If you click on the search button, you access the Search for a Customer (Customer Code Lookup), from which you can search for a customer.

NOTE: The customers you can access at this and other Customer fields may be restricted by Regional Processing.

Order Number * Hold Code Order Number * Hold Code

Orders on hold for the selected customer display, along with the hold codes assigned to each order. Select the order number and hold status you want to approve/reject/skip. You cannot edit this field if the credit hold has either been approved or rejected, or if a comment has been entered.

NOTE: More than one hold code may exist per order. For example, the order may have exceeded the customer's credit limit (C1) and has a financed amount that has not yet been approved (F3). However, if a hold code of F3 exists, approval must be completed using the Update Financing Credit Approvals (3rd Party Finance Approvals) program.

Hold Code Description Hold Code Description

Once you specify an Order Number x Hold Code, the description for the hold code displays here.

Customer Credit Comments Customer Credit Comments

Credit comments for this customer may be viewed/entered/modified here. The customer record will be updated with comments entered/modified in this field.

Approve/Reject/Skip Approve/Reject/Skip

Select Skip to skip entry of this field for the selected order/hold code. Select Reject to reject the selected order/hold code. Select Approve to approve the selected order/hold code.

Approval Comments Approval Comments

Comments relating to the approval/rejection of the selected order/hold status may be entered here.

Last Invoice Date Last Invoice Date

The date of the last completed order for this customer will display here.

Current, 1-30, 31-60, 61-90, Over 90 Current, 1-30, 31-60, 61-90, Over 90

The customer's accounts receivable balance, broken down by aging categories, will display.

Last Payment Date Last Payment Date

The date of the last payment applied to this account will display.

Last Payment Amount Last Payment Amount

The amount of the last payment applied to this account will display.

Credit Limit Credit Limit

The customer's current credit limit displays from the customer record. If no credit limit has been established for the customer, this field is blank.

If approving a C1 = Over credit limit status, you must increase the customer's credit limit here in order to process the approval.

Important! If Advanced Receivables is not active on your system (General System Control Settings), the credit limit field on this screen is active. If Advanced Receivables is active on your system, you cannot edit the credit limit field via this screen. You can use Customer Credit and Scoring Information to edit the customer's credit limit, provided you have permission via your User/User Group settings.

Available Available

The customer's current available credit will be displayed. The available credit is based on the following equation: Credit Limit - Open A/R - Open Order Balance Due (this does not include orders on 3rd Party Financing).

Merchandise Subtotal Merchandise Subtotal

The total dollar amount for the merchandise on the order, before tax and delivery/install charges are applied, will be displayed.

Sales Tax Sales Tax

The sales tax amount of the selected order will be displayed.

Delivery/Install Charge Delivery/Install Charge

All delivery and/or installation charges for this order will be displayed.

Order Subtotal Order Subtotal

This field displays the total of merchandise on the order, including discounts applied and additional charges (sales tax, delivery, installation charges). This total does not include deposits/financing amounts.

Deposit Deposit

The total amount of deposits entered for this order will display.

Total Amount Financed Total Amount Financed

The total amount financed (using third party financing) on this order will display.

Balance Due Balance Due

The total balance due from the customer for this order will be displayed.

ActionsActions

Advanced Customer Settings
Customer Credit and Scoring Information
Advanced Customer Settings for Co-Signer
