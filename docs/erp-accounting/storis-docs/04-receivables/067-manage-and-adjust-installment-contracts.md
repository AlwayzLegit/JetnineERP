---
title: Manage and Adjust Installment Contracts
article_id: 15202311165076
section: 04-receivables
index: 67
url: https://storis.zendesk.com/hc/en-us/articles/15202311165076-Manage-and-Adjust-Installment-Contracts
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Installment > Manage and Adjust Installment Contracts

Use this routine to view installment receivables contract activity for a specified customer and to access installment entry screens that you can use to manage and adjust the customer's contracts. It can be accessed from the STORIS menu, or via View All Installment Activity for a Customer.

Once you indicate the customer in the Customer field, the customer name and Co-Applicant, if any, displays. Once the customer is selected, this screen displays additional customer information and a grid that lists the customer's pending, active, and historical contracts. You can then select contracts from the grid and use the extra action buttons to perform additional installment functions, such as cancel, delete, or reinstate a contract; merge and refinance contracts; defer installment payments; adjust contract balances; change contract due day; forgive late fees; etc. (See the Extra Action Buttons section below for more detail.)

CustomerCustomer

Enter the code of the customer or click the Search button to access the Search for a Customer screen. Once you specify the customer code, the customer's name and Co-Applicant, if any, display.

Home, Cell, Work, ExtHome, Cell, Work, Ext

The customer's home, cell, and work phone numbers, including the extension, display from the customer settings.

EmailEmail

The customer's email address, if specified in customer settings, displays.

StoreStore

The store location assigned to this customer displays.

Credit Limit $Credit Limit $

The customer's credit limit, if any, displays in this field. If no limit was set, OPEN displays here.

Open Receivables $Open Receivables $

The customer's A/R balance is displayed.

Potential Receivables $Potential Receivables $

The sum of the customer's pending installment amount, pending revolving amount, and any unpaid open orders is displayed here.

Available Credit $Available Credit $

The amount of credit currently available for the customer is displayed. This amount is calculated by subtracting the total potential receivables from the customer's credit limit.

Installment (pending) $Installment (pending) $

The total amount of pending (not active) installment-financed orders for this customer displays.

Revolving (pending) + $Revolving (pending) + $

The total amount of pending (not active) revolving-financed orders for this customer displays.

Unpaid Open Orders + $ Unpaid Open Orders + $

The total amount of open unpaid orders for this customer displays.

Grid InformationGrid Information

The grid displays the pending, active, and historical contracts for the customer. For each contract listed, the following columns of information display.

Contract: The number assigned to the contract displays in this column.

Status: The status column displays one of the following.

Pending = The contract has been created but is not yet active. When a contract with this status is selected from the grid, the Extra Action Buttons for Review Contract Details and Update Contract Status are available.

Pending – Deleted = The contract was deleted while it was still in a pending status. This contract cannot be reinstated. When a contract with this status is selected from the grid, the Extra Action Button for Review Contract Details (in query mode) is available.

Active = The contract is currently active. When a contract with this status is selected, all of the Extra Action Buttons are available.

Cancelled = The contract was cancelled, assigned a closed reason code, and moved to installment history. When a contract with this status is selected, the Extra Action Button for Update Contract Status is available.

Closed – Rewritten = The contract was rewritten under a new contract and the original contract closed. When a contract with this status is selected, the Extra Action Button for Update Contract Status is available if there are no active contracts that list this contract number as a "previous" contract.

Closed – Paid = The contract has been paid off (zero balance), closed, and moved to history. No adjustments can be made to this contract. When a contract with this status is selected from the grid, the Extra Action Button for Review Contract Details is available in query mode.

Order: Orders associated with the contract are listed in this column.

Classification: This column displays a combination of the installment contract classification code and payment plan.

Cash Date: If the customer must pay this contract in full before the no-interest expiration date, the same as cash date displays here.

Financed $: This column displays the original amount financed.

Payoff $: The payoff amount for pending and active contracts is calculated using the system date and displayed in this column.

Next Payment Due: The date the next installment payment (current or future) is due displays for active contracts.

Amount Due $: The current (short-term) amount due is displayed for active contracts.

Past Due $: The past due amount is displayed for active contracts.

Due Day: The contract's due day is displayed.

Written From: If the contract was refinanced or merged, this column displays the original contract number(s).

Refinanced To: If the contract was refinanced or merged, the other (or new) contract number(s) with which this contract was merged/refinanced displays in this column.

To perform additional functions using the Extra Action Buttons, you must first select one or more contracts from the grid. You can click the check box on the grid line to select specific contracts, or click the check box in the grid header to select all lines in the grid. When one or more box is checked in the grid, some or all of the Extra Action Buttons are active. The availability of the Extra Action Buttons depends on the status of the contract(s) selected.

ActionsActions

Click the Actions button at the bottom of the screen to access the following options.

View a Customer's Account Balance

Customer Activity Log

View Installment Comments

View a Customer's Payment Activity

View an Existing Sales Order

User Defined Settings

Additional Action Buttons

Once you select contract(s) from the grid, one or more of the following action buttons are activated. Use these buttons can be used to perform additional Installment functions, including Review Contract Details, Update Contract Status, Merge/Refinance Contracts, Adjust Payment Terms, Defer Installment Payments, Adjust Contract Balance, and Forgive Late Fees.

Review Contract Details

Update Contract Status

Installment Worksheet

Adjust Payment Terms

Defer Installment Payments

Adjust Contract Balance

Forgive Late Fees

Enter a Sales Order

Enter a Customer Payment, Enter a Customer Payment/Refund/Gift Certificate

Request Credit Information - If active, use this button to maintain the credit application via the Update a Credit Application option from the Actions button.

Credit Request Review - If active, use this button to maintain the credit application.

When no selected contracts are in the grid, the availability of this button is based on the Installment - Manage and Adjust - Enter a Sales Order setting in Create a User/Group Actions - Receivables Security.

This button is not active if your system is set up to balance by cash drawer via Cash Balancing Control Settings and you did not log in with a cash drawer.

This is the only active button if the customer's account is closed (charged off, for example).

When no selected contracts are in the grid, the availability of this button is based on the Installment - Manage and Adjust - Take a Payment setting in Create a User/Group Actions - Receivables Security.

This button is not active when Credit Request Review button is active.

When no selected contracts are in the grid, the availability of this button is based on the Installment - Manage and Adjust - Request Credit Information setting in Create a User/Group Actions - Receivables Security.

This button is not active when Request Credit Information button is active.

This button is not active if an open credit request is not on file for the customer.

When no selected contracts are in the grid, the availability of this button is based on the Installment - Manage and Adjust - Credit Request Review setting in Create a User/Group Actions - Receivables Security.
