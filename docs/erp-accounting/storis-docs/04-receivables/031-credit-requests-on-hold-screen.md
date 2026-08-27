---
title: Credit Requests on Hold Screen
article_id: 15202278095124
section: 04-receivables
index: 31
url: https://storis.zendesk.com/hc/en-us/articles/15202278095124-Credit-Requests-on-Hold-Screen
source: STORIS Help Center (storis.zendesk.com)
---

Use this routine to maintain credit request items on hold. This screen appears when you double-click on a grid item in the Review Credit Requests on Hold screen, displaying the following information for the selected item. Note that you cannot enter an approval status code using this routine. To approve the credit request, use the Credit Request Review process.

Security

Once you select a grid item in the Review Credit Requests on Hold screen, STORIS security references the Access Other Credit Applications and Score Reporting field on the Extended Security tabs to determine if you have access. If you do not, the Access Control Window appears, prompting for information from an authorized user.

Information Displayed

The customer's billing address information appears in the Header section of this screen:

Customer

Code

Name

Address

City, State, Zip Code

Email

Co-applicant - This information displays if a co-applicant is present on the application.

NOTE: The address displayed is the customer's billing address. If the primary applicant has a delivery address, an alert displays "Delivery Address On File". Changes to the billing or delivery address are not reflected unless the update has been made via the global Actions button on the Residence page of Advanced Customer Settings.

Order

Number

Total

Deposit

The following prompts and information fields appear in the lower portion of the screen:

Reason Reason

Enter a reason code. If you click on the Arrow, you can choose from a list of reason codes whose Reason Usage Code field in the Reason Code Settings is set to Credit Application.

Comment Comment

Use this field to enter a comment on your edit to the Reason field or edit an existing comment. You can enter up to 70 alphanumeric characters. This field is active only if you edit the Reason field.

Hold Code Hold Code

Enter a hold code. If you click on the Arrow, a list of credit review statuses appears from which you can choose.
If you decline the credit request or choose to delete it, the program removes the hold status code from the credit request record and moves it to history. If you enter a credit review status with one of the following application statuses, the program removes the hold status code and sends it back to the Credit Request Review process:

3 - Pending Review
4 - Review in Progress

Date Date

The request status change date appears.

Time Time

The request status change time appears.

Initials Initials

The reviewer's user ID appears.

NOTE: You cannot change an existing reason, but you can add/edit comments or remove it along with the associated comment.

ActionsActions

Credit Application Maintenance – this option is active only if you have access to view existing credit application information.

Credit Application Print – this option is active only if you have access to view existing credit application information.

View Credit Report – this option is active only if you have access to view existing credit application information. This option also allows printing of the credit report.

Credit Request Auditing – The system adds credit request audit comments any time you edit a reason code or comment.

Sales Order Inquiry
