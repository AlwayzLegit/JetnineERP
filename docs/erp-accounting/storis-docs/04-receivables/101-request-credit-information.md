---
title: Request Credit Information
article_id: 15202278288148
section: 04-receivables
index: 101
url: https://storis.zendesk.com/hc/en-us/articles/15202278288148-Request-Credit-Information
source: STORIS Help Center (storis.zendesk.com)
---

Access

Customer > Coordination and Logistics > Credit Application > Request Credit Information

Customer > Electronic Interfaces > Credit Application > Request Credit Information

Accounting > Receivables > Credit Application > Request Credit Information

Use this routine to enter a request for credit for a customer. This is the first step in entering a credit application. Once you enter the credit request information on this screen, the routine continues to the Credit Application Entry screens, where you complete the credit application process.

Once you specify the selling store below, you can use either the Social Security # field or the Customer Code field to select a customer. Once you specify a customer, the program pulls the customer's information from Customer Settings and displays it on the screen. To edit the customer's information, click on the Actions button at the bottom of the screen and select Customer Maintenance.

The system then checks for pending or completed credit requests for the customer. If a previous request is found, a message appears indicating the status of the last credit request for the customer for the indicated credit bureau.

NOTE: If an existing application is found to be "current" (determined by your Credit Application Control Settings), you are prevented from clicking the Next button and creating a new application. You must click the Actions button and select Credit Application Maintenance, which opens the Credit Application Entry process.

If a new application is needed, you can proceed to the Credit Application Entry process via the Next button once you have completed the necessary fields on this screen.

Use Configure Document Signature Capture and Configure Document Archive to establish parameters for capturing electronic signatures and business document archiving, respectively. If these features are enabled and the appropriate signature capture hardware exists, the signature capture ceremony is launched and this signed business document is archived.

Selling Store Selling Store

Enter the store location for which you are entering the credit application. If you click on the Arrow, a list of available locations appears from which you can choose.

Social Security # Social Security #

Enter the social security number of the customer for which you are entering this credit application. Once you specify a valid social security number, the program re-displays it in masked format.

If you specify a social security number for which no customer exists in the system, you can still either select an existing customer or create a customer on the fly.

If you specify an existing customer and the social security number you entered above does not match the existing social security number (if any) for the customer, a warning message appears but you can proceed.

NOTE: All Social Security # fields in STORIS reference the Allow Duplicate Social Security Numbers field in the Accounts Receivable Control Settings.

NOTE: The field name "Social Security #" displays when processing with the United States as your "home" country, or "Social Insurance #" when processing with Canada as your domestic country.

Customer Customer

Enter the code of the customer for which you are entering this credit application. If you click on the Search button, the Search for a Customer screen appears which you can use to select a customer. If you click on the Action button, you access the Customer Settings, which you can use to enter a new customer.

NOTE: The following applies if the "Customer Entry - Warn if Primary Email exists for other Customers" setting is checked in the Customer tab of Point of Sale Control Settings: If an email address is added or changed, the new email address is checked to determine if it has been assigned to any other customer account as a primary email address. If the email address already exists, a warning message appears that can be dismissed.

Full NameFull Name

The customer's name appears from Customer Settings. This field cannot be directly edited. To change customer information, click the Actions button and select Update a Customer Address.

Billing Address

If there is no delivery address, the billing address displays.

Full Name, Address 1, Address 2, City/Town, State/Province, Zip Code/Postal CodeFull Name, Address 1, Address 2, City/Town, State/Province, Zip Code/Postal Code

The customer's address information appears from Customer Settings. These fields cannot be directly edited. To change customer information, click the Actions button and select Update a Customer Address.

Delivery Address

Address 1, Address 2, City/Town, State/Province, Zip Code/Postal CodeAddress 1, Address 2, City/Town, State/Province, Zip Code/Postal Code

The customer's address information appears from Customer Settings. These fields cannot be directly edited. To change customer information, click the Actions button and select Update a Customer Address.

NOTE: The billing and delivery address fields are able to display expanded addresses; however, larger characters (e.g. "W") may not allow the full text to display.

Salesperson Salesperson

Enter the code of the salesperson associated with the sale/request for credit. If you click on the Search button, a list of salespersons appears from which you can choose.

Credit Bureau Credit Bureau

Enter the code of the credit bureau you want to use for this credit request. If you click on the Arrow button, a list of credit bureaus appears from which you can choose.

The program searches the following fields for a default response and displays the first one it finds:

Warehouse/Store Location Settings - Preferred Credit Bureau field on the Credit Application tab

Credit Application Control Settings - Primary Credit Bureau field on the General tab

Marketing Code 1 Marketing Code 1

Use this field to enter and/or maintain the marketing code associated with a customer. If you click the Search button, a list of all marketing codes that have previously been set up in Marketing Code Settings will appear. This field will only be active if the First Marketing Code field in Point of Sale Control Settings is set to either optional or mandatory.

Code 2 Code 2

Use this field to enter and/or maintain a second marketing code associated with a customer. If you click the Search button, a list of all marketing codes that have previously been set up in Marketing Code Settings will appear. Entries in Marketing Code 1 and Code 2 must differ.

This field will only be active if the following conditions are met:

The Second Marketing Code field in Point of Sale Control Settings is set to either optional or mandatory.

There must be a value specified in the Marketing Code 1 field above.

Review CommentReview Comment

Enter the comments (if any) you want to associate with this request for credit, for example a comment to the underwriter. The comments appear on the Credit Review Comments Entry/Inquiry Screen.

ContinueContinue

Once you finish entering credit request information for the customer, click the Continue button. The Credit Application Entry - Primary screen displays, where you enter/maintain the application for the primary applicant. You can also access the application entry screens for the co-applicant or co-signer, if any.

Update a Credit Application

Resend Application to Bureau - This option is inactive

Update a Customer Address - This option is used to update the billing and delivery address.

Assign Payment Terminal - Select this option to access the EMV Terminal Selection screen, where you can view and edit the current payment terminal assignment.

ActionsActions

Update a Credit Application - When the Access credit applications - Request Credit Information setting is enabled, sales representatives can update a credit application. Also, when this setting is checked, sales representatives can also make updates to the credit application via Request Credit Information. Once the customer number is entered, use the extra action, Update a Credit Application to make changes.

Resend Application to Bureau - This option is inactive

Update a Customer Address - This option is used to update the billing and delivery address.

Assign Payment Terminal - Select this option to access the EMV Terminal Selection screen, where you can view and edit the current payment terminal assignment.
