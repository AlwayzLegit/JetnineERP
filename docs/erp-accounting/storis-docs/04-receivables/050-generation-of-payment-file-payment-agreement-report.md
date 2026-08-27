---
title: Generation of Payment File & Payment Agreement Report
article_id: 15202312130196
section: 04-receivables
index: 50
url: https://storis.zendesk.com/hc/en-us/articles/15202312130196-Generation-of-Payment-File-Payment-Agreement-Report
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Revolving Receivables > Generation of Payment File & Payment Agreement Report

Use this routine to generate the Payment Report that you send to Payment Sources informing them of the amounts to be remitted for payment agreement customers. Additionally this routine can be used to create the payment file that you post (Import Customer Payments) after you receive the payments from the source company.

NOTE: Currently, there are two extraction programs available in the Payment Agreement Source Settings. If you are set up to use the extraction program that does not import the payments to a specific plan, this process is not available.

SourceSource

Indicate the source company for the payment agreement. You can click the Search button to access the Read-Only Lookup Window, where you can select a source from the list. Once you enter the source, the source name displays and the remaining fields on the screen become active.

Begin Date Begin Date

Entry of the beginning date is mandatory. Depending on previous processing for the specified source, this date may default to the last process date plus 1, but can be changed. You can click the calendar icon to select a date from the drop-down calendar. When you run this routine, unpaid payment agreement MMP's that have a due date greater than or equal to this date are selected.

End DateEnd Date

Entry of the ending date is mandatory and must be greater than or equal to the Begin Date. You can click the calendar icon to select a date from the drop-down calendar. When you run this routine, unpaid payment agreement MMP's that have a due date less than or equal to this date are selected.

Payments per MonthPayments per Month

This display only field shows the number of payments to be submitted each month, as established in the Payment Agreement Source Settings.

Import ActionImport Action

Indicate the action to be taken when you run this process. Choose Create File if you are creating only the payment agreement file you use to post the payments. Choose Create Report if you are only creating the payment agreement report. Or, choose Both to create the payment agreement posting file and report.

When you choose to create the payment file, a comma separated ".csv" document in Microsoft ® Excel format is created that contains the customer/source ID, agreed amount per payment, customer name, payment due date, and plan code.

If you choose to generate the report, the report includes the customer number, source ID, customer name, plan code, agreed amount, order number, original amount, remaining amount, MMP, and a column where the source can fill in the amount paid for each customer. Click the Report Sample button below to see a sample of this report.

Send Output to Send Output to

The output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export Path

You cannot edit the export path using this process.

Actions

Once the run-time options have been selected, choose Run to produce the report.
