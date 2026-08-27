---
title: Print Insurance Forms
article_id: 15202297024532
section: 04-receivables
index: 93
url: https://storis.zendesk.com/hc/en-us/articles/15202297024532-Print-Insurance-Forms
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Revolving Receivables > Revolving Views and Reports > Revolving Reports > Print Insurance Forms

Use this routine to print or re-print the appropriate insurance forms for a selected customer and plan.

When printing insurance forms with an electronic signature, the Insurance Code program must be enabled in Configure Document Signature Capture and the appropriate signature capture hardware must be available. Additionally, the Request Signature field in Extended Receivables Insurance Code Settings must be enabled for the specific insurance code.

Customer Customer

Enter the code of the customer whose insurance form you are printing. To locate a customer code, click the Search button to access the Search for a Customer routine.

Revolving Plan Revolving Plan

Indicate the revolving plan for which you are printing insurance forms. If more than one plan is available, you can click the Arrow button and select the plan from a list of all available plans for the selected customer. If only one plan is available for this customer, the plan displays in this field and the field cannot be changed.

ContractContract

Use this field to select a contract associated with the selected revolving plan. If more than one contract is available, use the drop down to select the contract. If only one contact is available, it defaults in this field. If no contract is associated with the selected revolving plan this field is inactive.

Insurance Insurance

If active, entry in this field is mandatory. If an insurance plan has been assigned to the selected plan and customer, the plan code displays here. If no insurance code has been assigned, or if you want to override the assigned insurance plan, enter the code for the insurance plan you want to print on the form. To select an insurance code from a list of existing codes, click the Search button. You can enter an insurance code in this field provided the selected customer's age is below the cutoff age established in your Revolving Receivables Insurance Code settings. If the customer's age is greater than or equal to the established cutoff age, this field is inactive.

NOTE: If the Apply Insurance by Plan Setting in Revolving Receivable Control Settings is set to Customer the insurance code for the customer defaults here and cannot be edited so long as the Exempt from Insurance Charges field is not set in Revolving Receivable Control Settings; if the field is active the insurance dropdown is inactive.
If the Apply Insurance by Plan Setting in Revolving Receivable Control Settings is set to Plan, insurance is available for selection unless the Exempt from Insurance Charges is set in Revolving Receivable Control Settings.

Print Type Print Type

Check the box to indicate the type of insurance form you are printing:

Insurance Form - print the insurance acceptance letter

Cancellation Form - print the insurance cancellation letter

The status of the insurance code associated with the customer's plan determines whether one or both of these check boxes is active. The following conditions affect the availability of the check boxes:

If the chosen customer / plan combination has no insurance code associated with it, but you have entered an Insurance code in this print routine, the Cancellation Form check box is the only one active.

If the chosen customer / plan combination has an insurance code associated with it, both the Insurance Form and the Cancellation Form check boxes appear active.

If the chosen customer / plan combination has an insurance code associated with it, but you override the code by entering another Insurance code in this routine, the Cancellation Form check box is the only one active.

To print the selected form(s) via enhanced laser printing, click the Run button.

Assign Payment Terminal - Select this option from the global actions to access the EMV Terminal Selection screen, where you can view and edit the current payment terminal assignment.
