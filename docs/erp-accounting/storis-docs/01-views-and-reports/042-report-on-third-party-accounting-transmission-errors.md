---
title: Report on Third Party Accounting Transmission Errors
article_id: 15203013127828
section: 01-views-and-reports
index: 42
url: https://storis.zendesk.com/hc/en-us/articles/15203013127828-Report-on-Third-Party-Accounting-Transmission-Errors
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Third Party Accounting > Report on Third Party Accounting Transmission Errors

This report provides an error log of GL errors that occurred during transfers, vendor updates, and other TPA (Third Party Accounting) processes. The report may be run for today only, for a selected date range, or for another pre-defined period. Selection for this report also includes operator, port number, and store location. The information on this report is used to identify the cause of the errors, which in many cases is a result of setup issues (missing Terms or missing Vendor in QuickBooks®, for example). Users may then resolve the setup issues and re-run the process. Once the run-time options have been selected, choose Run to produce the report.

Click here for brief explanations of the error messages that may appear. Contact your STORIS representative if further detail is needed.

Date Code Date CodeSelect either CUS (Custom Dates) to enter specific Start and End dates or select another predetermined Date Code, which will cause the Start and End dates to fill in automatically. Examples of Date Codes are: TDAY (Today), YDAY (Yesterday), CYTD (Current year to date), LYTD (Last year to date).

Start Date Start DateIf CUS (Custom Dates) was selected in the Date Code field , enter the starting date for this report. If a Date Code other than CUS was entered, this field will automatically fill in and will not be available for change.

End Date End DateIf CUS (Custom Dates) was selected in the Date Code field, enter the ending date for this report. If a Date Code other than CUS was entered, this field will automatically fill in and will not be available for change.

NOTE: The report lists all errors that occurred since the last End of Day was run for the time period selected. The End of Day process removes these errors from the current log and moves them to history. Depending on when you run the report and the End of Day process, and whether corrections were made, you may see errors on the report that occurred during a previous transfer and for setup issues already corrected. Therefore, users need to note the date and time of errors reported.

Operator OperatorEnter the User ID (from the User file) of the operator to report on errors received for that log-in ID only, or leave this field blank to report on All operators.

Port Number Port NumberEnter the computer port number to report errors received on that port only, or leave blank to report on all port numbers.

Store StoreThis field is used to indicate the store or stores to be included in this report. One, multiple, or All stores may be selected. To report on a single store, select a specific store location code at this field. To report on All Stores, leave this field blank. To report on multiple stores, use the Multiple Location Selection screen (available from Actions) to select the store locations for this report.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
