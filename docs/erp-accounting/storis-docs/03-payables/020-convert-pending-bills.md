---
title: Convert Pending Bills
article_id: 15202028504084
section: 03-payables
index: 20
url: https://storis.zendesk.com/hc/en-us/articles/15202028504084-Convert-Pending-Bills
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Convert Pending Bills

Accounting > Third Party Accounting > Payables > Convert Pending Bills

Use this batch process to convert one or more pending AP bills for one or more selected vendors. A status bar appears during the update and a final message appears displaying the number of AP bills (if any) converted. For pending AP bills for which merchandise has been received (either fully or partially), this routine generates an exception report displaying the reason they were not converted (see below).

NOTE: You can also run this process as part of the End-of-Day process.

To view converted AP bills, use the Report Payables Activity routine (check the box at the Activity Since Last End of Day field).

Vendor VendorSpecify one or more vendors for whom to convert pending AP bills. If you click on the Search button, the Vendor Name Search appears from which you can choose. If you click on the Action button, the Multiple Vendor Selection Window appears from which you can choose one or more vendors.

Action Action

Specify the action you want the routine to perform. You have the following options:

Convert Only - convert eligible pending AP bills.

Report Exceptions Only - convert no AP bills; report exceptions.

Convert and Report Exceptions - convert eligible pending AP bills; report exceptions.

Number of Days Prior to Due Date with No Receipt Number of Days Prior to Due Date with No ReceiptFor pending AP bills with no receipts, enter the number of days prior to the due date you want the report to generate exceptions. You can enter any whole number from 0 to 999. If you enter zero (0), the report generates an exception only on the day the pending bill is due. If you leave this field blank, the report does not generate exceptions.

This field is active only if you specify Report Exceptions Only or Convert and Report Exceptions at the Action field above.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.

Actions

The Actions button is active only if you select Report Exceptions Only or Convert and Report Exceptions at the Action field above.
After you select your vendors, click on Run to convert pending AP bills for the selected vendors.

Exception Report

For pending AP bills for which merchandise has been received (either fully or partially), this routine generates an exception report displaying the reason they were not converted. The report displays the

AP bill number,

invoice number, and

the reason the bill could not be converted.

The report includes pending AP bills with

at least one line with a quantity available for AP approval,

exceptions due to the Number of Days Prior to Due Date with No Receipt field below.

A separate line prints for each reason a bill cannot be converted.

Exception Codes

The following lists the codes included in the exception report. Note that the quantity available for approval is the

(quantity received on a purchase order line) - (quantity already entered on 'not pending' AP bills for that purchase order line).

For AP Bill Lines:

QTY NM (Quantity not matched) - Quantity invoiced greater than the quantity available for approval.

COST EXC (Cost exception) - Product has a zero cost exception.

COST NF (Receiving cost not found) – Quantity available for approval but receiving cost not found.

For AP Bills:

VENDOR NM (Vendor not matched) – The vendor on the AP bill does not match the vendor on the purchase order.

COST NM (Cost not matched) - The difference between the total receipt cost and the merchandise subtotal on the pending bill exceeds the pending bill conversion allowable cost variance percent in the Payables Control Settings. The merchandise subtotal is defined as the following:

(pending bill's Total Invoice Amount) - (Freight, Sales Tax, and Miscellaneous amounts)

Note that the cost on the pending bill line always matches the cost on the PO line.

DUE DATE (Close to Due Date with no receipt) – The AP bill is due within the specified number of days but has no receipts.
