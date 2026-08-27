---
title: Plan Balance Transfer
article_id: 15202311527572
section: 04-receivables
index: 82
url: https://storis.zendesk.com/hc/en-us/articles/15202311527572-Plan-Balance-Transfer
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Adjust Revolving Plans > Plan Balance Transfer button

Use this routine to transfer a customer's revolving plan balance to a new plan or use it to transfer multiple plans to one plan in a single session. When transferring multiple plans, any combination of transactions from multiple plans can be selected to transfer to the new plan.

To transfer entire plans for multiple customers at one time, use the Import Revolving Plan Balance Transfer routine. Transferred balances are subject to the new plan's overrides, restrictions, and settings. Transfer activity is recorded in the Customer Activity Log.

When transferring a balance to a new plan, the promotional and fixed terms of the two plans are compared. For fixed term plans, the term is not considered to be promotional and is compared separately. If the fixed or promotional terms are different, prompts appear warning of the difference in the terms. You have the option to cancel or continue the balance transfer.

For transfers made from promotional plans to non-promotional plans, the current promotional terms are removed. For transfers made from a non-promotional plan to a plan with different promotional terms, the plans terms will be applied as of the original invoice date.

Customer Customer

The customer number as well as address from the Adjust Revolving Plans screen is displayed here.

Current Plan Current Plan

If multiple plans are eligible to be transferred, the word "Multiple" displays here. If only one plan is eligible, the plan code displays here.

Balance $ Balance $

If you selected a plan to be transferred via the previous screen, the total balance of the plan selected displays in this field, even if only part of the balance is being transferred. When the user accesses the Adjust Revolving Plans – Plan Transfers process without first selecting a plan, this field displays the total balance of all plans except the plan entered in the New Plan field.

Current $ Current $

The customer's current open item balance for the current plan displays here.

Transfer $ Transfer $

The amount selected to be transferred to the new plan is displayed here. This amount changes as transactions (shown in the below grid) are selected and de-selected from the below grid.

New Plan New Plan

This field is mandatory. This field designates the revolving plan to which to transfer the balance(s). Enter, or use the Search button to select, a plan that the customer does not already have, or an existing plan of the customer's (if any). Only a revolving plan may be entered in this field. Plans not eligible in this field are master plan, Per Sales Order plan, Per Sales Order Using a Fixed Term plan, nor can the plan be the same as the current plan.

NOTE: In order to designate the selected plan as the new plan, the Allow Other Plans to Transfer to this Plan setting in the Advanced tab of Revolving Payment Plan Settings must be enabled (checked).

MMP$ MMP$

If you selected a New Plan that is a "Using a Fixed Table" or "As a Fixed Amount" type of plan, this field is available. Use this optional field to set the MMP amount for the new plan. If the new plan is a fixed table type, you can click the Action button at this field to view the fixed table of MMP amounts. If the MMP amount entered here is below the suggested MMP (calculated MMP), a message displays when you click Save on this screen.

Chargeback Waived Interest Chargeback Waived Interest

Check this box to apply previously waved interest to the selected plan. The default setting is unchecked. If checked, waived interest for the selected transactions (shown in below grid) are transferred to the new plan and become part of the plan's long term balance. Charged back waived interest is not added to the year-to-date interest bucket. When waived interest is charged back, waived finance fees are also charged back.

This field is available when interest has been waived for any of the selected transactions (shown in the below grid).

If unchecked, the interest remains waived. The amount of waived interest is retained for each transaction, so that it can be charged back on a new plan in the future.

Close Current Plan Close Current Plan

Check this box to close the plan or plans transferred upon the completion of the plan balance transfer, either partially or in full. If checked, the current plans close only if balances are transferred. The plans are updated with a closed date of the current day's date. The default setting is unchecked.

The check box is unavailable if the plans were closed before accessing this screen.

After entering all applicable information, click Save. If there are no validation errors, the plan balance transfer process occurs. Once the balance transfer is complete, you are returned to the Adjust Revolving Plans process. That screen will have been updated to reflect any changes that occurred as a result of transferring the balance(s).

Grid InformationGrid Information

Below are descriptions of each column of this grid. All items are checked by default when the grid populates. Use the check boxes to select or deselect the transactions to be transferred to the new plan. You can check the "all" check box located in the header column to select all transactions in the grid, or you can check individual check boxes associated with specific transactions. Any combination of transactions from multiple plans can be selected to transfer to the new plan.

Transaction - The plan's individual transaction numbers.

Plan - The plan code.

Posted - The date that the transaction was posted.

Amount $ - The original amount of the transaction.

Remaining $ - The remaining amount of the transaction.

Waived $ - The amount of waived interest.

Expires - The date that the no interest period expires if there is a no interest period for the transaction.

No Pay Until - The date the No Pay Until period expires.

MMP $ - The monthly minimum payment for the transaction for per invoice plans.
