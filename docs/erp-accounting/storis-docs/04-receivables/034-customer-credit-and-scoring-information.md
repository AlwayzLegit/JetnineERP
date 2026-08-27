---
title: Customer Credit and Scoring Information
article_id: 15202278293268
section: 04-receivables
index: 34
url: https://storis.zendesk.com/hc/en-us/articles/15202278293268-Customer-Credit-and-Scoring-Information
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Receivables > Credit Application > Customer Credit and Scoring Information

Accounting > Installment > Customer Credit and Scoring Information

If you process Advanced Receivables transactions, you can use this screen to update credit and scoring information for specific customers.

Audit History

For many of the fields that you edit on this screen, an audit history of changes is maintained. Displayed to the left of these fields is the most recent audit history information, if any. The date, time, initials, old value, and new value are displayed.

To view prior audit history, click the Search button next to the field. A window displays audit transaction history, in reverse order, for that field. The Date, Time, Operator, Old Value, and New Value for each edit are displayed in the grid.

Customer CodeCustomer Code

Enter the code of the customer for whom you are editing credit and scoring information. Click the Search button to access the Search for a Customer window, where you can search for a customer by name, phone number, etc. Once you indicate the customer code, the customer name displays to the right of the entry box.

Co-ApplicantCo-Applicant

If a co-applicant exists for the primary applicant, this field label and the co-applicant's name appear below the customer code.

Co-signerCo-signer

If a co-signer exists for the primary applicant, the field label and co-signer's customer number and name appear below the customer code.

Available Credit Available Credit

The customer's available credit amount is displayed.

Customer Credit LimitCustomer Credit Limit

The customer's credit limit displays and can be edited, depending on your receivables security settings. The following security settings are checked to determine your options for editing this field.

If the Update a Customer's Credit Limit setting is enabled in your user settings, you can edit the customer credit limit field on this screen.

If your security settings allow you to Establish unlimited credit limit for a customer, you can leave this field null to grant the customer unlimited credit.

If you do not have permission to establish unlimited credit, you must enter a credit limit value. The Set a Customer's Maximum Credit Limit to $ field is checked and if left blank for your user settings, the value you enter in this field must be between 0 and 999,999. If a maximum is established for your user settings, the value you enter must be between 0 and the maximum credit limit.

Reason Reason

If you decrease the customer's credit limit on this screen, this prompt becomes active and required. Click the arrow button and select the adverse reason that the credit limit was decreased. The list of reason codes available for selection are those with "This Reason is Used For" set to Credit Application. The adverse reason code and description selected are displayed on the Customer Credit and Scoring Information screen and are printed on the Credit Limit Decrease Letter.

Print Credit Limit Change LetterPrint Credit Limit Change Letter

If the credit limit is changed, this check box is active. If you check the box, a Credit Limit Change Letter is generated and the Print Status Letter screen displays immediately after you save out of the process. If the credit limit is increased, a Credit Limit Increase Letter is generated. If the credit limit is decreased, a Credit Limit Decrease Letter is generated. If you leave the check box blank, when you save out of the process the letter is flagged as needing to be printed and is available to print in batch mode via the Print Credit Request Status Letters process.

NOTE: A Credit Limit Letter is not generated when the customer’s credit limit is changed from unlimited (no credit limit defined) to an actual credit limit. Conversely, a Credit Limit Letter is not generated when the customer’s credit limit is changed from an actual credit limit to unlimited.

Co-signer Credit LimitCo-signer Credit Limit

If the customer's request for credit includes a co-signer, the customer's credit limit (with an associated co-signer) is displayed and can be edited, depending on your receivables security settings. The following security settings are checked to determine your options for editing this field.

If the Update a Customer's Credit Limit setting is enabled in your user settings, you can edit the customer credit limit field on this screen.

If your security settings allow you to Establish unlimited credit limit for a customer, you can leave this field null to grant the customer unlimited credit.

If you do not have permission to establish unlimited credit, you must enter a credit limit value. The Set a Customer's Maximum Credit Limit to $ field is checked and if left blank for your user settings, the value you enter in this field must be between 0 and 999,999. If a maximum is established for your user settings, the value you enter must be between 0 and the maximum credit limit.

Credit Score Primary, Co-applicantCredit Score Primary, Co-applicant

These fields are used to display and edit the primary and co-applicant's credit scores. Entry is numeric, with a 4-digit maximum. Your receivables security settings determine whether these fields display the credit scores at all, and whether they are display only or can be edited. The following receivables security settings determine your options for these fields.

Update Customer's credit score: In order to edit the credit score fields, you must have this field and at least one of the next two fields enabled in your security settings. If this setting is not enabled, the next two fields determine whether the score for those customers is displayed, but the scores cannot be edited.

Access other credit applications and score reporting: This security setting is used to control access to the credit score fields for non-employee customers.

Access employee credit applications and score reporting: This security setting is used to control access to the credit score fields for employee customers.

Bankruptcy Score Primary, Co-applicant Bankruptcy Score Primary, Co-applicant

These fields are used to display and edit the primary and co-applicant's bankruptcy scores. Entry is numeric, with a 4-digit maximum. Your receivables security settings determine whether these fields display the bankruptcy scores at all, and whether they are display only or can be edited. The following receivables security settings determine your options for these fields.

Update Customer's credit score: In order to edit the bankruptcy score fields, you must have this field and at least one of the next two fields enabled in your security settings. If this setting is not enabled, the next two fields determine whether the score for those customers is displayed, but the scores cannot be edited.

Access other credit applications and score reporting: This security setting is used to control access to the bankruptcy score fields for non-employee customers.

Access employee credit applications and score reporting: This security setting is used to control access to the bankruptcy score fields for employee customers.

Installment ClassificationInstallment Classification

The current contract classification (type of contract) assigned to this customer, if any, displays. If you have permission to edit this field via the Update Scoring classification field in your user receivables security settings, you can click the Arrow button to select a contract classification from the drop-down list.

Installment Co-signer ClassificationInstallment Co-signer Classification

The current contract classification (type of contract) assigned to this co-signer customer, if any, displays. If you have permission to edit this field via the Update Scoring classification field in your user receivables security settings, you can click the Arrow button to select a contract classification from the drop-down list.

Revolving ClassificationRevolving Classification

The revolving classification code, if any, displays when Extended Receivables is active. You can select from all available Revolving Classification Codes using the dropdown. When audit information is available, the most recent information displays to the left of the entry.

Revolving InsuranceRevolving Insurance

The revolving insurance code, if any, is displayed here. This field is updated via API, or manually, if the user has permission via the Change or remove insurance on a customer's revolving plan in Create a User/User Group - Receivables Security.

If a change is made to the insurance code, existing pending and active revolving records are updated accordingly with the new insurance code, unless the revolving plan is exempt from insurance charges from the Exempt from Insurance Charges setting in Revolving Payment Plan Settings.

Note: If the Apply Insurance By field in the Revolving Receivable Control Settings is set to Customer it will automatically populate the Revolving Insurance field in the worksheet when a revolving plan is being added to an order

Credit SourceCredit Source

This field is used to define the source of the information used to update the data for this customer. If you have permission to edit this field via the Update credit source field in your user receivables security settings, you can click the Arrow button to select a Credit Source from the drop-down list.

Place Credit HoldPlace Credit Hold

Use this field to manually place all open sales orders (excluding quotes and layaways), service orders, or debit exchanges for a customer on C4 credit hold. If you have permission to edit this field via the Update Manually Enter Customer Credit Holds field in your user receivables security settings, you can check the box at this field to place this customer's orders on credit hold. Credit documents including exchanges with zero or credit balances are not placed on hold. Once orders or exchange documents are manually placed on credit hold, you must use the Update Receivables Credit Approvals process to remove them from credit hold.

Credit Hold StatusCredit Hold Status

If there are open sales orders on credit hold for this customer, this field displays the current credit hold code and description. If more than one credit hold code exists, you can click the Search button to view a list of all credit hold codes and descriptions for this customer.

Request a Lien Request a Lien

This field is used to flag the customer for the lien selection process. If you have permission to edit this field via the Update Customer lien requests field in your user receivables security settings, you can check the box at this field to include this customer in your lien selection processing.

Registered Lien DetailsRegistered Lien Details

This field is used to view and maintain lien registration information for this customer. Click the Action button to access the Enter Lien Registration Information window, where existing registered lien details are listed for this customer. If you have permission to edit this information via the Update Customer lien requests field in your user receivables security settings, you can click the Action button to view, edit, add, and/or delete registered lien details. If you do not have security clearance, you can view the registered lien details, but you cannot edit the information.

Payment History ProfilePayment History Profile

This field displays the customer's past 24-month payment history, excluding the most recent month. Each number represents a payment code for that given cycle period, while the letter "B" indicates periods where the cycle period was skipped or the customer was not on file.

Select the extra action to update revolving customers' payment history using the Payment History Profile.

ActionsActions

When you click the Actions button, the following options are listed.

Credit and Scoring Audit - Use this option to view comments generated via changes made to this screen.

Credit Limit Decrease Letter

Credit Limit Increase Letter

Legal Settings - Use this option to access the Customer Legal Settings screen where you view and maintain the legal status of the customer account.

View Advanced Customer Settings for a Co-signer - Use this option to access a view only version of customer settings for the co-signer.
