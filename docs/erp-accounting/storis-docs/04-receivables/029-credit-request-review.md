---
title: Credit Request Review
article_id: 15202278094100
section: 04-receivables
index: 29
url: https://storis.zendesk.com/hc/en-us/articles/15202278094100-Credit-Request-Review
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Double-click on a grid item in the Review Pending Credit Requests routine.

Tabs: Display-Only Fields, Credit/Review Status Fields, Extra Actions Buttons

Use the Credit Request Review screen to manually review and decision credit requests/applications. This screen appears when you double-click on a grid item in the Review Pending Credit Requests routine.

Security

Once you select a grid item in the Review Pending Credit Requests routine, STORIS security references the Access Other Credit Applications and Score Reporting field on the Extended Security screen to determine if you have access. If you do not have this security setting active, you are prompted for a security override when you attempt to access this screen via the Review Pending Credit Requests routine. A user with this extended security must enter their initials and password in order for you to access this entry version of the screen.

NOTE: If comments have been updated for the selected review item, the system displays a message informing you that comments were entered for this credit request and asks if you would like to review the comments. Click Yes to access the Credit Review Comments Entry/Inquiry Screen.

If you are requesting credit for a customer for whom a credit request was recently completed, the system displays a message stating the customer has a recently closed credit request that can be viewed using the View Completed Credit Requests routine.

Review Status

Reviewer Reviewer

Indicate the user ID of the credit application reviewer. Your user ID defaults, but you can override the default. If using InterConnect, the reviewer shows as 'AUTO'. If you click on the Search button, a list of users appears from which you can choose.

Current Current

The current review status appears. You can edit the status. If you click on the Arrow, a list of review statuses appears from which you can choose. If you enter an approved, declined, or deleted review status code, the credit request is moved to history. If you specify a credit review status code for which one of the following associated credit request statuses has been specified, the program requires you to enter a reason code.

5. On Hold Awaiting Further Information or Verification

6. Conditionally Approved

8. Credit Declined

Reason Reason

Enter the reason for the new status. This field is active and mandatory if your entry in the Current field (above) is a status code whose Associated Credit Request Status field is set to 5, 6, or 8 in the Credit Review Status Code Settings. If you click the Arrow button, a list of credit reason codes (codes with the Reason Usage Code is set to Credit Application) appears, from which you can select a reason. If you edit this field, the program writes a credit request audit comment when you click Save on this screen. You can view the comments via the Credit Review Comments Entry/Inquiry Screen. If using InterConnect, the Reason is set to 'AUTO'.

SalespersonSalesperson

Use this field to enter the Salesperson. Click the Search button to use the Read-Only Lookup Window to select a Salesperson from the list. Only a user with permissions defined in Create a User/Group Actions - Receivables Security can update this field.

Credit

Suggested Credit LimitSuggested Credit Limit

If the credit bureau returned a suggested credit limit, the amount displays here.

NOTE: The credit limit and down payment percent are added to the review item if this is provided by InterConnect.

Credit Limit OfferedCredit Limit Offered

Use this optional field to enter the credit limit offered to the customer. If a suggested credit limit is populated in the field above, this field defaults to that credit limit.

Suggested Credit ClassificationSuggested Credit Classification

Use this optional field to select a revolving classification to restrict the revolving plans made available to the customer. If a revolving classification is already on file for the customer it defaults here.

Read-Only
Customer Information

Code, Name, Phone, Address 1, Address 2, City, State, Zip Code, Email, Co-Signer

NOTE: The address displayed is the customer's billing address. If the primary applicant has a delivery address, an alert displays "Delivery Address On File". Changes to the billing or delivery address are not reflected unless the update has been made via the global Actions button on the Residence page of Advanced Customer Settings.

Credit Information

Limit Limit

Use this field to establish a new AR credit limit for the customer. Enter a whole dollar, numeric value between 0 and 999999. If you leave the field blank, you establish unlimited credit for the customer. Any updates you make here reflect in the Credit Limit field in the Customer Settings.

NOTE: Important! If Advanced Receivables is not active on your system (General System Control Settings), the credit limit field on this screen is active. If Advanced Receivables is active on your system, you cannot edit the credit limit field via this screen. You can use Customer Credit and Scoring Information to edit the customer's credit limit, provided you have permission via your User/User Group settings.

Available Available

The amount of credit currently available displays here.

Used Used

The amount of credit currently used displays here.

Score Score

The credit score returned by the credit bureau displays here, provided you have access to information via your User/User Group settings. (See Security above.) If you do not have access, the credit score is masked.

Sales Order Information

The following information displays in the top portion of the screen:

Number (order), Total, Deposit, Requested Plan (code), Requested Amount (whole dollars)

Extra Actions Buttons

This group of extra actions buttons appears on the lower right side of the screen. Click a button image below to see a description of the action.

Update a Credit ApplicationUpdate a Credit Application

Use this action to access the Credit Application Entry screens. This option is only available if you have security access to credit applications via your User/User Group settings (see Security above). If you have access, you can use this option to update the application associated with the current review item. If you click this button from the read-only version of this screen, the Credit Application Entry screens also appear in read-only mode.

View Credit ReportView Credit Report

Use this action to view and/or print the credit report linked to the current review item. The print destination of the report is determined by the Return Text Credit Report field in the Credit Application Control Settings.

If no credit report exists, a message appears. To submit a request for a new report, use the Request a New Credit Report action.

This action is active only if you have access to view credit application information (see Security above) and credit reporting is active (you are set up to communicate electronically with a credit bureau).

View Soft Credit ReportView Soft Credit Report

Use this action to review the soft credit report text. If no credit report exists, a message appears.

Request a New Credit ReportRequest a New Credit Report

Use this action to submit a request to the credit bureau for a new credit report. The Request New Credit Report window appears when you click this action button. This action is active if the following is true.

You have security access (via User/User Group settings) to credit application information.

Online credit reporting is active.

You are maintaining an open review item for which the review status is RI or SI.

OR:

You are inquiring on a closed review item.

Access Requests on HoldAccess Requests on Hold

Use this action to access the Review Credit Requests on Hold routine, which you can use to review and update requests that require additional information in order to make a decision. You can use this action from the entry and view versions of this screen.

Audit Request ActivityAudit Request Activity

Use this action to access the Audit Comments window, where you can view, add, and print system-updated and manually-entered credit review comments. This extra action is also available in view (read-only) mode.

Updating Comments for Hold Items

If you use this action to update comments for a hold item (Associated Credit Request Status field in Credit Review Status Code Settings is set to 5 or 6), the system can automatically take the item off hold and return it to pending with an updated status. To receive a prompt that allows you to use this feature, do the following:

Select the hold item from the grid on the View Credit Request Responses screen.

The Credit Request Review screen displays.

Click the Audit Request Activity button.

Update the comments, click Save, and then click Exit on the Audit Comments screen.

On the Credit Request Review screen, click the Exit button.

The system asks Return Credit Review Item to Review Pending Credit Requests?

If you answer Yes, the review item is taken off hold, and is returned to pending with an updated status of "RA".

You can then review the item using the Review Pending Credit Requests routine.

If you answer No, the item remains on Hold.

View an Existing Sales OrderView an Existing Sales Order

Use this action to access the View an Existing Sales Order routine.

Submit a New Credit RequestSubmit a New Credit Request

Use this option to submit a request for a new review item based on the currently displayed closed item. The Create New Credit Request Review screen displays. This action is only active if the following is true.

You are reviewing a closed credit request (via View Completed Credit Requests or View Credit Request Responses) and

you have access to credit application information (see Security above) or you were the reviewer who closed the item.

Credit and Scoring Credit and Scoring

Click this button to view Customer Credit and Scoring Information.

Print Status LetterPrint Status Letter

Click this button to generate a status review letter of the current review item. This field is only active if the review item has been approved, conditional, or declined. The credit status letter prints upon saving.

ActionsActions

Display Hold Comments - Use this action to access the Credit Requests on Hold Screen, where you can maintain credit request items on hold. You can view and update hold comments, reason code, and hold code. ( You cannot approve a credit request using the Credit Requests on Hold routine.)

Print Credit Application - Use this action to print the credit application linked to the current review item. Information for the primary applicant, as well as for the co-applicant or co-signer, if any, is printed using the Design Enhanced Laser Forms process. This action is available only if you have security access to view credit applications (see Security above). Note: If using signature capture, when a credit application is printed the attached signature capture device prompts for both the co-applicant and co-signer signatures in addition to the primary applicant signature. The ELP tags, “coap_signature” and “cosigner_signature”, can be used to print captured co-applicant the co-signer signatures on the printed credit application.

Print Status Letter - This option is available only from the read-only version of this screen. To print status letters from the entry version, use the Print Letter check box.

View Advanced Customer Settings for a Co-Signer – Use this option to access the View Advanced Customer Settings screen for the co-signer on the application.
