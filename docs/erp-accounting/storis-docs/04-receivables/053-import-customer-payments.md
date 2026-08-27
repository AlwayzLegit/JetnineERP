---
title: Import Customer Payments
article_id: 15202279998868
section: 04-receivables
index: 53
url: https://storis.zendesk.com/hc/en-us/articles/15202279998868-Import-Customer-Payments
source: STORIS Help Center (storis.zendesk.com)
---

11.0
10.8

Access

Accounting > Receivables > Import Customer Payments

Accounting > Revolving Receivables > Import Customer Payments

Accounting > Installment > Import Customer Payments

Settings User > Schedule a Process > Enter Process Preferences

Tabs: Selection, Details

Use this routine to import, post, and report customer payments received from outside sources. You can run this process on demand, as part of End of Day processing (Generate Daily Reports), through Schedule a Process, or both.

The Import Customer Payments process looks at the File Path Location field in Receivable Payment Source Settings to determine whether to extract the spreadsheet from the local PC or NFS.

Payments posted via this routine are only included in the Balance a Cash Drawer process if the Include Imported Payments on Cash Balancing Report field is checked in Accounts Receivable Control Settings.

NOTE: If you are using the payment agreements process, even when importing non-revolving payments, the Allow Payment Agreements setting in Revolving Receivables Control Settings must be checked, and at least one payment source must be defined in Receivable Payment Source Settings.

If your settings allow, you can also apply overpayments to charged off balanced. See also: Overpay Charged Off Accounts for more information.

When the Misapply Payments check box is checked, this process can only run as an On Demand process; it cannot be run as part of Generate Daily Reports. Any Receivable Payment Source Settings that are set up to run as a daily (end-of-day) report must be changed to run as On Demand or as both (On Demand and End-of-Day).

Payments can be backdated as long as the customer's last cycle date is beyond the payment post date, as certain insurance, interest, and late fees cannot be recalculated because of a late payment. If a payment cannot be posted, an error message appears: Cannot post money prior to the last cycle date."

Selection

Use the fields on this tab to select the source, posting location, and output options.

Source

Enter the code that represents the source from whom you received the payments being posted. You can click the Search button to choose the code from the list of source companies. When you indicate the source, the name displays to the right. This entry is mandatory and the source must be configured in Receivable Payment Source Settings.

Location

Indicate the location to use when posting these payments. Click the Arrow button to select a location from the list. When you select a location, the description displays to the right of the entry box.

Specify the date on which to post the payments in the batch. If you click on the Calendar Icon, a calendar appears via which you can select a date. All payments in the batch use the date you enter here to post the payments received. The date you specify cannot be:

null,

in the future,

prior to the last EOD date,

in a closed period, or

closed to payments (based on the Close Payment Dates setting on the Actions button on the General tab of the Accounts Receivable Control Settings).

Date

Specify the date on which to post the payments in the batch. If you click on the Calendar Icon, a calendar appears via which you can select a date. All payments in the batch use the date you enter here to post the payments received. The date you specify cannot be:

null,

in the future,

prior to the last EOD date,

in a closed period, or

closed to payments (based on the Close Payment Dates setting on the Actions button on the General tab of the Accounts Receivable Control Settings).

NOTE: When run from Schedule a Process, the date default to the current date and the field is inactive. The post date changes to the date when the scheduled process runs.

Misapply Payments

Check this box to misapply payments that were previously posted. When checked, the Import Customer Payments process attempts to locate the matching reference item to which the payment has been posted and misapply it. This field is unchecked by default.

When checked, the grid/report columns are affected as such:

Agreed - column is suppressed.

Paid - displays a credit as the amount to misapply.

Variance - column is suppressed.

Error - if the payment could not be misapplied, an "M" is displayed.

Audit Comments - column is available.

Misapplying payments via this process is available only when run as On Demand, and is not available as part of the Generate Daily Reports process.

When unchecked, the Import Customer Payments process imports, posts, and reports received customer payments; it does not attempt to apply misapplied payments.

NOTE: To use this setting, you must have permission via the Import Customer Payments - Misapply Payments setting in Create a User/Group Actions - Receivables Security. If the user does not have permission, the Security Override Screen is presented.

When applying a miscellaneous payment via this process, cash in bank is credited if an AR GL account is not defined for the miscellaneous payment type. Note that this is contrary to the manual misapply payment process via Apply NSF and Correct Misapplied Payments process that uses the default GL account if an AR GL account is not defined for the miscellaneous payment type.

The output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Send Output to

The output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

NOTE: When run from Schedule a Process, the output is set to R (Report Archive) and cannot be changed.

Export Path

You cannot edit the export path using this process.

Actions

Save

Once you have indicated the source, location, and output settings, you must click the Save button to activate the Details tab. The system searches for the ".csv" payment agreement import file for the source you selected. (The file name and location on your system are specified in the Payment Agreement Source Settings.) If the file exists, the Details tab activates and the Details grid displays the information from the payment file.

Details
Source

The name of the source company that provided the customer payments displays.

The following fields are inactive until you select an item from the grid.

Customer/Source ID

The ID you entered for the customer on the Payment Agreement Entry screen displays. This can be the customer code or an ID provided by the source company, such as an employee number. If you used the Generation of Payment File & Payment Agreement Report process to create the payment file, you cannot edit this field. If the payment file was not generated by STORIS, you can edit this field.

NOTE: If you are not using payment agreements, enter the customer number into the spreadsheet instead of the Source ID; this option is only permitted when the Allow Payment Agreements field is unchecked in the Revolving Receivables Control Settings.

Plan

The revolving payment plan associated with the payment agreement is displayed.

Agreed Amount

The agreed payment amount per payment due is displayed.

Amount Paid

The amount paid by the customer displays from the payment file. If the source company indicated that the customer actually paid a different amount, you can select the line from the grid and edit this field, provided the payment file was generated by STORIS. Otherwise, this is a display only field.

Grid Information

The grid on the Details tab displays payment information from the import payment file. To edit details for a payment, select a line from the grid. If you generated the file in STORIS, you can only edit the Amount Paid. If you did not generate the file in STORIS, you can edit only the Customer/Source ID. Once you make changes, click the Add button to update the grid.

The following information displays in the grid.

Customer/Source ID

Name

Plan - Data in this column depends on the extraction program indicated in your Payment Agreement Source Settings. If your payment import spreadsheet (".csv" file) contains the payment plan, this column displays the plan code.

Agreed - If the Misapply Payments check box is checked, this column is suppressed.

Paid - If the Misapply Payments check box is checked, this column displays the amount to be misapplied as a credit.

Variance - If the amount paid differs from the payment agreement amount (positive or negative), the difference between the two amounts is displayed in this column. If the Misapply Payments check box is checked, this column is suppressed.

Error - If errors are found in the payment file data, this column displays an error code. Payments showing an error code in this column are not posted. The following are error codes that may appear:

C = Invalid customer code / employee ID - If no revolving plan exists in the spreadsheet, this error indicates that there are no active revolving records containing the customer code provided. If a revolving plan is included in the spreadsheet, this error indicates that there is no active revolving record containing the customer code and plan provided.

A = Invalid payment amount - Payment amount is null or not numeric

D = Invalid payment date - Payment date is not in the proper YYYYMMDD format

L = A Legal Code Setting, that does not allow payments, is associated with customer

N = Invalid contract number

M = Payment could not be misapplied. Only available if the "Misapply Payments" check box is checked.

Audit Messages - This column is available only when "Misapply Payments" is checked and is available only when Output Settings is set to Personal Report Viewer or Excel Export. This column contains audit information.

Save

Once you have reviewed the payment file information and made any necessary corrections, click the Save button to update the payments and generate a report of the payment posting.

Actions

Report Import Customer Payments - Click this option to produce the customer payment import report. The report prints the customer code, source ID, customer name, plan code, agreed amount, amount paid, variance, and error.

P = Posting Error - This error appears only on the report and indicates an error occurred during the update process.
