---
title: Review Pending Credit Requests
article_id: 15202310378004
section: 04-receivables
index: 106
url: https://storis.zendesk.com/hc/en-us/articles/15202310378004-Review-Pending-Credit-Requests
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Customer > Coordination and Logistics > Credit Application > Review Pending Credit Requests

Customer > Electronic Interfaces > Credit Application > Review Pending Credit Requests

Accounting > Receivables > Credit Application > Review Pending Credit Requests

Use this routine to review pending credit requests. The program selects all pending requests that are not on hold and displays them in the grid. Pending credit applications statistics display in the header area of the screen, including the following:

Total Pending Review Requests

Total Hold Review Requests

Average Initial Response Time

Average Decision Time

When approving a credit request in this process, you can manually approve sales orders associated with it if your receivables staff security setting , " Review Pending Credit Request – Manually approved linked sales order" has been set. If set, you are shown the message, "Would you like to approve the linked orders manually?" By clicking Yes, you process each associated sales order and are shown the message, "Authorize order nnnnn for $nnn.nnn, finance plan xxxxx." In this case, the C6 hold is removed from the sales order.

If you click No to manually approve the associated sales order, the process checks the available credit for the customer to ensure that it is enough to cover the financed amount. If it is insufficient for this, the message "Financing has not been approved for order nnnnn." appears. In this case, the sales order stays on C6 credit hold, and the hold can only be removed if you remove the revolving finance plan from the sales order.

If you are not allowed to give manual approval for associated sales orders, Review Pending Credit Requests automatically tries to authorize the associated sales orders when the credit request undergoes approval.

If a customer has already had a credit line created from a previous approved credit request, the previous approved credit request is evaluated when financing is applied to the sales order. If the credit limit is enough to cover the cost of the order, the financing is approved.

A credit request can be entered from the Enter a Sales Order process using the global extra, Finance Application.

If you call up a sales order associated with an open credit request, when the sales order is saved, the following message appears: "Customer has an open credit request. Access Credit Application". If you choose Yes, the credit application can be processed.

Revolving restrictions, defined in the Revolving Payment Plan Settings define the revolving plans that can be offered to the customer based on their credit score, minimum financed amount, and other data. Finance plans that the customer does not have access to are not shown in the finance plan lookup. If you try to enter a finance plan that is not approved for the customer, a message appears naming why the plan is not being allowed.

Sort By Sort By

The default sorting method for the grid is ascending by creation Date/Time. If you click on the Arrow button, the following list of sort options appears:

Date/Time – sorts in ascending initial request Date/Time

Initials – sorts by Reviewer's initials, then by ascending initial request Date/Time

Name – sorts by customer last Name, then by ascending initial request Date/Time

Status – sorts by review Status, then by ascending initial request Date/Time

Store – sorts by Store, then by ascending initial request Date/Time

Refresh Refresh

Click on this button to refresh (update) the grid display.

Grid InformationGrid Information

The below columns are displayed in the grid. You may export the grid information by right-clicking anywhere in the grid to select Export Grid Data. The information is saved as an Excel file to your local drive. To update a review item, double-click the item in the grid to access the Credit Request Review Screen.

Customer (code)

Name (customer)

Store (code)

Date (initial request)

Time (initial request)

Reviewer (initials) - reviewer's initials are displayed; automatically set to 'AUTO' if using InterConnect

Status (review status)

Salesperson

ActionsActions

Review Credit Requests on Hold

Assign Payment Terminal - Select this option to access the EMV Terminal Selection screen, where you can view and edit the current payment terminal assignment.

Customer Credit and Scoring Information
