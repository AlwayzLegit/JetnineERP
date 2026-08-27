---
title: Adjust Balance
article_id: 15202279412884
section: 04-receivables
index: 3
url: https://storis.zendesk.com/hc/en-us/articles/15202279412884-Adjust-Balance
source: STORIS Help Center (storis.zendesk.com)
---

Access

Adjust Revolving Plans, click Adjust Balance global action button

Use this routine to increase or decrease the long-term balance of the Revolving plan. When you enter a positive adjustment, a new transaction is added to the plan. When you enter a negative adjustment, the order balances in the plan are automatically reduced in oldest to newest order.

Customer Customer

The customer code, name, and address display.

PlanPlan

The code of the revolving plan being adjusted displays from the previous screen.

ActivatedActivated

The date the plan was activated for this customer displays.

Balance Balance

The customer's plan balance displays.

Current Due Current Due

The amount currently due from the customer for this plan displays.

Balance Details

Reference Reference

Use this optional field to indicate a reference number for this balance adjustment. You can enter up to 15 alpha-numeric characters to represent the completed transaction number. The reference ADJ defaults in this field, but you can change it. If you specify an existing order number here, the balance adjustment is applied to that order first, provided it is in the plan and it has a balance. Once the order balance is zero, any remaining adjustment amount is applied to other orders in the plan.

AdjustmentAdjustment

Enter the adjustment amount. You can enter a positive amount to increase the long-term revolving balance or a negative amount to decrease the long-term revolving balance. If you are making adjustments to a Per Sales Order or Per Sales Order Using a Fixed Term plan and you enter a positive amount in this field, the MMP Amount Table displays on this screen.

DateDate

Today's date defaults as the adjustment date. You can click the calendar icon and select a different date, provided it is not prior to the cycle start date.

MMPMMP

This field is only active when you are entering a positive adjustment for a Per Sales Order or Per Sales Order Using a Fixed Term plan. For Per Sales Order plans, this field does not default and you can enter the MMP amount for this plan.

For Per Sales Order Using a Fixed Term plans, the MMP is calculated and displayed based on the plan's term setting and the current adjustment amount. If the calculated MMP is less than the minimum defined for the plan, the minimum is displayed here. You can override the calculated MMP, provided it is not below the minimum for the plan.

ReasonReason

Use this mandatory field to indicate the reason for the adjustment. Click the Arrow button and select the reason from the drop-down list. Only reason codes with the Reason Usage Code field set to Revolving Adjustments appear in the list.

MMP Amount Table

The MMP Amount Table is displayed only when you are adjusting Per Sales Order or Per Sales Order Using a Fixed Term plans and you have entered an adjustment amount that increases the balance.

Term, MMP The term months and corresponding MMP amounts display based on the adjustment amount you entered.

Actions

Maintain G/L Postings - Use this routine to view and modify auto-generated GL postings for this adjustment. Security restrictions affect your access to this information. See General Ledger User Permissions and Create a User/Group Actions - Payables Security.

SaveSave

When you click the Save button to update the adjustment, the GL Distribution Screen displays, provided you have access to this information. (See Actions button above.) You can use this screen to view the proposed G/L postings and make any necessary adjustments.
