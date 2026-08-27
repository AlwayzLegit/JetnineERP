---
title: Enter a Customer's Revolving Terms & Conditions
article_id: 15202280007444
section: 04-receivables
index: 42
url: https://storis.zendesk.com/hc/en-us/articles/15202280007444-Enter-a-Customer-s-Revolving-Terms-Conditions
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Revolving Receivables > Enter a Customer's Revolving Terms and Conditions

Use this routine to establish new revolving plans and maintain existing plans for customers. With this routine, you can set up a customer's revolving charge plan that can later be used to finance a purchase. You can also use it to change certain settings for the customer's existing plan, such as the MMP amount, MMP % or term, plan closed date, insurance plan, and remarks.

NOTE: Changes that you make on this screen are not applied until the next time the customer's account is cycled.

If a change is made to the revolving payment plan, a comment is logged, "New payment terms have been applied to revolving plan XXX."

Customer

Customer Customer

Enter the code of the customer to establish or maintain a revolving plan for that customer. You can click the Search button to access the Search for a Customer routine.

Name Name

After you indicate the customer code, the customer's name from Customer Settings displays.

Co-signer, Co-applicant Co-signer, Co-applicant

If the customer's request for credit includes a co-signer, the customer ID and name is displayed below the customer name. If a co-applicant exists, the name displays below the customer name.

CommentsComments

If Account Comments were entered for this customer via Customer Settings, the Comments button is active. When you click the Comments button, you access the read-only Customer Credit Comments window.

Customer Store, Home, Work, & Cell TelephoneCustomer Store, Home, Work, & Cell Telephone

The following information displays for the customer you indicated: the store assigned to the customer, the home, work, and cell telephone numbers.

Due DayDue Day

The customer's due day (1-28) displays, based on customer, location, and control settings. For information on how the due day is determined, see the Due Day field in Advanced Customer Settings.

Credit Limit $Credit Limit $

The customer's credit limit, if any, displays in this field. If no limit was set, OPEN displays here.

Receivables $Receivables $

The customer's A/R balance is displayed.

Potential Receivables $Potential Receivables $

The open order total for this customer is displayed.

Available Credit $Available Credit $

The amount of credit currently available to this customer displays.

Active Plans

This area displays the plan codes for all revolving plans that are currently active for this customer.

Plan

Plan Plan

Specify the code of the new revolving plan being established or existing revolving plan to be edited. You can click the Search button to select a code from the Read-Only Lookup Window. Note that the lookup window displays only those plans that are available to the customer based on the state, store, customer age, etc.

NOTE: The system ensures that a master revolving plan exists for a customer whenever any revolving plan is created, provided you are using the Master Plan feature. If you indicated a revolving plan in the Master Plan field of your Revolving Receivables Control Settings, and you do not select the master plan's code in this field, the system automatically selects it for you when you Save your changes on this screen.

If the payment plan for the selected revolving plan is different from what is currently defined in the Revolving Payment Plan Settings, a message appears indicating this.

ActivatedActivated

For existing plans, the date that the plan was activated for this customer displays. For new plans, today's date populates the field. You cannot edit this field.

Closed Closed

This field is active only for existing plans. If you enter a date in this field, the current revolving plan for this customer is terminated on that date and cannot be used for financing or deposits on orders after that date. When you enter a date, the Enter Reason Code window prompts for the entry of the reason you are terminating the plan.

Current Due $ Current Due $

For existing plans, the amount currently due from the customer for this plan is displayed.

Last Charge $ Last Charge $

The date and amount of the last charge to the customer's account is displayed.

Last Payment $ Last Payment $

The date and amount of the last credit/payment to the customer's account is displayed. This amount includes customer returns.

RemarksRemarks

You can enter or update revolving remarks for new and existing plans. Up to 50 characters can be entered in this field. Click the Action button to access the Description Field - Language Translation Entry screen.

Balance

Current $ Current $

The total revolving amount due for the plan displays. This is the sum of the long term and short term amounts due. For new plans, this amount is zero (0.00).

Highest $ Highest $

This field displays the highest amount that the customer's revolving balance has ever been since the plan became active.

Minimum MMP $Minimum MMP $

This is the minimum monthly payment defined for this customer’s plan. It may be different from the MMP defined in Revolving Payment Plan Settings.

-Or-

% of Balance% of Balance

This field is inactive for plans that calculate the MMP based on a fixed term or on fixed MMP table settings. If the plan calculates the MMP using a percentage (of the plan balance), the percentage from the plan settings defaults here. You can edit this field to establish a different percentage rate for this customer's plan.

MMP $MMP $

For new plans, the default is the lowest minimum monthly payment allowed as set in the Calculate MMP field of Revolving Payment Plan Settings. Plans can be edited here as follows:

Using A Percentage - cannot be changed

As a Fixed Term - can be changed

Per Sales Order - cannot be changed

Using a Fixed Table - can be changed but note that this may be overridden by subsequent purchases

As a Fixed Amount - can be changed *

Per Sales Order Using a Fixed Term - cannot be changed

For existing customer plans, the MMP amount can be edited for fixed term, fixed table, and fixed amount plans only. The amount you enter here cannot exceed the balance due. If you change the MMP for a fixed amount plan, the system issues a reminder message stating that subsequent purchases may override the new amount you entered.

NOTE: The MMP $ can be set below the Minimum MMP$ if permission is granted via the Revolving Terms and Conditions - Override Lowest MMP Allowed Restriction setting in Create a User/Group Actions - Receivables Security.

*If the plan is As a Fixed Amount, the Fixed MMP Table overrides the aforementioned security setting.

Fixed Term is MonthsFixed Term is Months

For Per Sales Order Using a Fixed Term plans, the number of term months is displayed from the Revolving Payment Plan Settings and cannot be edited.

InsuranceInsurance

Use this optional field to specify the insurance purchased with this revolving plan. The code you enter is used when insurance premiums for the plan are calculated. To access a list of insurance codes, click the Search button and select from the Read-Only Lookup Window.

NOTE: Entry in this field is evaluated against the cutoff age, if any, established in Revolving Receivables Insurance Code settings. If the age has been exceeded, the insurance plan is not available for selection for this customer. If no date of birth was entered for the customer and the insurance plan has an established cutoff age, that insurance plan is unavailable for selection for the customer.

If insurance has already been associated with the selected plan for this customer, the code displays here. You can edit or remove the insurance for existing plans if the Change or remove insurance on a customer's revolving plan is checked in your extended security settings.

If Revolving Terms and Conditions- Apply Insurance to all Plans is checked in your security settings and you edit or remove the insurance for an existing plan, your changes are applied to all plans for that customer.

If the Insurance Required field is enabled in your Revolving Receivables Control Settings, you cannot remove insurance from an existing plan. If you are editing a plan without insurance, you must add it in order to save your changes.

If the Apply Insurance by Plan Setting in Revolving Receivable Control Settings is set to Customer the insurance code for the customer defaults here and cannot be edited so long as the Exempt from Insurance Charges field is not set in Revolving Receivable Control Settings; if the field is active the insurance dropdown is inactive.

If the Apply Insurance by Plan Setting in Revolving Receivable Control Settings is set to Plan, insurance is available for selection unless the Exempt from Insurance Charges is set in Revolving Receivable Control Settings.

If you add, change, or remove insurance from a plan in this routine, the system offers the option to print the appropriate insurance form when you click the Save button. (See Save below.)

Entry in this field evaluates if the Single Prompt for Insurance Change setting within Revolving Receivables Control Settings is enabled.

If Single Prompt for Insurance Change is enabled, users are not presented with a message regarding a change in insurance when saving out of the process.

The user may not choose to print the insurance and/or cancellation letter; however, a signature is required if Signature Required within Configure Document Signature Capture process is checked.

ActionsActions

Change Customer Address

View Revolving Payment Plan - Select this option to view a read-only version of the Revolving Receivables Payment Plans routine.

Close Reason

Payment Agreement - In order to access this option, the Payment Agreement check box in the General tab of Revolving Payment Plan Settings must be checked.

Add Attachments

Edit Attachments

View Attachments

SaveSave

When you click the Save button additional prompts can appear, depending on whether you edited the Insurance field.

When you click the Save button after adding or changing the insurance code, the system asks Do you wish to print an Insurance Letter? Yes No Click Yes to print the letter via enhanced laser printing.

When you click the Save button after removing insurance from the plan, the system asks Do you wish to print an Insurance Cancellation letter? Yes No Click Yes to print the letter via enhanced laser printing.

DeleteDelete

To remove a customer's active plan, click the Delete button. Plans with a balance due greater than zero cannot be deleted. Zero balance plans with a corresponding pending plan also cannot be deleted. Once you click the Delete button, the system prompts for confirmation that you want to delete the plan.
