---
title: Installment Worksheet
article_id: 15202311188500
section: 04-receivables
index: 61
url: https://storis.zendesk.com/hc/en-us/articles/15202311188500-Installment-Worksheet
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Enter a Sales Order > Payment tab > enter an Installment Receivables Payment Plan code at either the Payment or Financing field

Manage and Adjust Installment Contracts > Merge/Refinance Contracts button

Use this routine to create and maintain an installment payment plan for a customer. This screen allows you to set up installment financing on an order and have access to the customer's credit information.

Customer Customer

The customer information from the sales order is displayed in this field. This field is read-only.

Credit RemarksCredit Remarks

Remarks entered via Advanced Customer Settings for the selected customer display in this field. This field is read-only.

OrderOrder

When accessing the installment worksheet from sales order entry, the order number from the sales order is displayed in this field and is read-only.

If you access this screen via the Merge/Refinance Contracts button in Manage and Adjust Installment Contracts, you can link an installment contract to an open order, provided it has a balance due. Click the Plus button at the CONTRACT field to assign a new contract number, select the Installment Plan, and then this Order field becomes active. Enter the number of the order to be linked to the new installment plan. If you click the Search button, you can use the View a Customer's Open Transactions screen to locate the order number. Once the order is linked to a plan, the financing is added to the order and the order is placed on F2 credit hold. When you add financing using this method, there is no credit check performed. (i.e. Credit limit is not checked, etc.)

Merge ContractsMerge Contracts

This grid lists all active contracts that are able to be merged for the selected customer. Eligibility is based on the contract being active and not having a closed date assigned. The grid only displays contracts if the specified installment plan is set to allow contract rewrites in Installment Payment Plan Settings.

Grid InformationGrid Information

This grid lists all active contracts that are able to be merged for the selected customer. Eligibility is based on the contract being active and not having a closed date assigned. The grid only displays contracts if the specified installment plan is set to allow contract rewrites in Installment Payment Plan Settings.

Contract - This field in the grid displays the installment contract number.

Payoff $ - This field in the grid displays the payoff amount for the contract in that row.

Payoff Date - This field in the grid displays the payoff date of the contract in that row. You can modify this field based upon how much interest and insurance you want to rebate to the customer. However, the payoff date cannot be prior to the activation date.

Due Day - This field in the grid displays the due day of the contract in that row.

Notes Notes

In this field, the user is able to enter free text relating to the selected installment contract. This text is used for internal use only.

CONTRACT CONTRACT

If accessing the installment worksheet from the Enter a Sales Order process via the Payment tab, a new contract number populates this field. In this case, the field is read-only.

If accessing the installment worksheet from Manage and Adjust Installment Contracts, after clicking on the plus icon, a new pending contract number displays in this field.

Installment Plan Installment Plan

The drop-down contains all Installment plans that are eligible. The list is filtered by plan cutoff dates as well as the location accessibility settings in the Installment Payment Plan Settings. When the worksheet is invoked from the Enter a Sales Order routine, this field is filled in automatically and the control is deactivated.

Written Written

This control is mandatory and defaults to the system date. The calendar icon can be used to assign a specific date written.

Fixed Activation Fixed Activation

Use this field to specify a fixed contract activation date. The default setting for this field is today's date. However, the calendar icon can be used to assign a specific date. This field is only active when the installment worksheet is accessed from Manage and Adjust Installment Contracts. In that case, the control is mandatory and the default setting is the system date.

Principal Principal

When creating a new contract from Enter a Sales Order via the Payment tab, the amount due on the open sales order is the default in this field. When an order number has been specified, the principal amount cannot exceed the open amount on the order. When the installment worksheet is accessed from Manage and Adjust Installment Contracts, if the customer has an open item amount (from previously completed orders, dollars only adjustments, etc.) this field is active during Merge/Refinance. The user can enter an amount up to the open item amounts to roll into the new contract. Once the contract is active, this entry creates a negative open item posting to be keyed off to clear short term receivables.

Previous Payoff Previous Payoff

This is a display-only field that reflects the sum of the payoff amounts of checked rows in the Merge Contracts grid. Any changes to the Merge Contracts grid are shown in this field. The payoff amount is based upon the payoff dates used in the Merge Contracts Grid.

MiscellaneousMiscellaneous

The default amount in this field is based on the Non-Filing Fee field on the Installment tab of Sales Tax Settings.

InterestInterest

The total interest charge for this contract displays here. This amount is calculated based on the interest rates, Calculation Type, and term as set in Installment Receivables Control Settings.

InsuranceInsurance

Use the drop down to select and assign an insurance code to the contract. To select multiple insurance codes, click the actions button to bring up a selection grid. Once the code(s) selection has been made, the insurance amount is displayed below the drop down. The amount is calculated based on the interest rates, calculation type, and term.

NOTE: There is no limit to the number of insurance codes that can be assigned, provided they meet the Extended Receivables Insurance Code Settings.

TOTALTOTAL

This field displays the sum of the principal, previous payoff, miscellaneous, interest, and insurance amounts.

Due DayDue Day

Select the day payments are due each month. Click the Arrow button to select a day from the list of available days in the drop-down. If there are multiple days available, the default is the day that is closest to today's date. The list is populated based on the Due Date Is field in Installment Receivables Control Settings. Selection in this field is mandatory.

NOTE: Changes to the Due Day cause the system to recalculate the payments based on the day selected.

Term Months Term Months

This field is used to set the maximum length of time a customer has to pay off the contract in full and is calculated using the principal, previous payoff, miscellaneous, interest, and insurance amounts. The default for this field is the term set in Installment Receivables Control Settings. You can choose a different term from the available terms in the drop-down; doing so causes the system to recalculate the payment based on the term that is selected.

NOTE: The Term selected here cannot exceed the number of months entered in the Maximum term is field in Installment Receivables Control Settings.

PAYMENTPAYMENT

This field displays the monthly payment amount based on the principal, previous payoff, miscellaneous, interest, and insurance amounts.

APRAPR

This field displays the Annual Percentage Rate, which is calculated based on the interest rate, insurance, number of days, lead months, and interest free days. Click the Action button to access the APR Values window to view additional information about the calculation of APR; this extra Action button is only available if APR values are different.

ActionsActions

Calculate Average Monthly Insurance Premium - When you select this option a calculator appears that can be used to determine the average monthly insurance premium to be charged in a defined time frame. This option is only active if insurance code or codes have been specified.

View Contract Amortization Schedule - Selecting this option displays a grid that is populated with one row for each month in the contract's term.

View Payment Summary - When you select this option, a grid is populated with payment data for the customer.

View Customer Credit Comments - Select this option to view the customer's credit comments.

View Installment Comments - Use this routine to view and/or print the contents of the Installment Activity Log for a selected customer.

Print an Installment Contract - Select this option to print the selected installment contract.
