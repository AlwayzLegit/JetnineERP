---
title: Report Payables Disbursement
article_id: 15203112881940
section: 01-views-and-reports
index: 46
url: https://storis.zendesk.com/hc/en-us/articles/15203112881940-Report-Payables-Disbursement
source: STORIS Help Center (storis.zendesk.com)
---

11.0
10.8
Access

Accounting > Payables > Payables Views and Reports > Report Payables Disbursement

Via the Print Checks routine when you click on Save at the conclusion of a successful check run.

Use this routine to report on vendor payments and print or re-print a check register. You can also report on pending check runs. This report runs during the End-of-Day process as well as on demand. Click Run to process the report.

This report has two versions. Use the Report by Check Run field to select your preference.

If you check the box at the Report by Check Run field, each check lists with a break-down of the AP bills on the check. The report breaks only for check totals. Note that where multiple purchase orders exist for a single AP bill, the purchase order numbers keys list separately on subsequent lines below the AP bill summary line. If printing a check run for multiple payment batches, each check run is printed one after another with a grand total at the bottom.

If you leave the box blank at the Report by Check Run field, you can specify multiple payment methods on which to report. This method excludes voided checks. The report sorts and breaks on payment method. You can specify multiple banks. The End-of-Day version of this report lists all banks. It page-breaks and totals on each bank.

NOTE: For refunds, the report prints the remit-to name (that is, the customer name) instead of the vendor name.

The Sort Detail Lines on Stub by field in Payables Control Settings determines the sequence in which the invoice detail information is displayed.

When a single check run is processed, checks are sorted in ascending order by check number. If multiple check runs are processed, the report sorts by bank, vendor, and payment method.

To easily collate checks and detail pages they are sorted together when Sort Detail Lines on Stub By, Print Checks by Descending Amount, and Print Refunds at the End of Check Run are selected in Payables Control Settings.

The ability to process multiple payment batches, enable the Allow Multiple Payment Batches setting in Bank Settings.

Report by Check Run

To report on a check run, check the box at this field. The fields in the top area of the screen inactivate, and the fields in the Check Run section of the screen activate. If you leave the box blank, you can run the report for manual payments only.

Print in Foreign Currency

For vendors whose currency (specified at the Currency field in the Vendor Settings) is something other than the domestic currency, use this field to include only the foreign currency amounts in the report. Note that if you check this box, the report does not include grand totals in the report.

This report reads the Currency field in the Vendor file to determine which currencies to include in the report. If you leave this field blank, the report includes amounts in domestic currency and, if the vendor's currency is something other than the domestic currency, foreign currency as well (provided your output setting is either Printer or Screen). If you set up the report to include both domestic and foreign currency amounts, the foreign currency amounts appear in brackets just below the domestic amounts.

If you check the box at this field, the report includes only the currency specified at the Currency field in the Vendor Settings, so if the vendor's currency is non-domestic, you can use this field to include only foreign currency amounts in the report.

Manual Payments

If you leave the box blank at the Report On Single Check Run field, the following fields activate:

Bank

Enter one or more banks to which you want to restrict the output of this report. If you click on the Arrow button, a list of banks appears from which you can choose. If you click on the Action button, the Multiple Bank Selection Window appears. If you leave the field blank, you select all banks.

Date Code

Click on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

Start Date

If you select CUS at the Date Code field, you activate this field. Use this field to specify the start date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

End Date

If you select CUS at the Date Code field, you activate this field. Use this field to specify the end date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

Vendor

Enter one or more vendors for which you want to report on payments. If you click on the Search button, the Vendor Name Search appears which you can use to select a vendor. If you click on the Action button, the Multiple Vendor Selection Window appears, which you can use to select one or more vendors.

Vendors

Use this field to include or exclude the vendors you specified at the Vendor field. If you leave the Vendor field blank (and thus select all vendors), the program sets this field to Include and then inactivates it.

Payment Methods to Include

Specify one or more payment methods to include in the report. You have the following options:

Printed Checks

Manual Checks

Credit Cards

Debit Cards

Online Banking

Cash

Check Run

If you check the box at the Report by Check Run field, the following fields activate:

Bank

Select a bank from the drop down list.

Date Code

If you select Custom, you can enter a date range in the Starting and Ending Date fields. Otherwise, the Starting and Ending Date fields are inactive. You have the following options:

Custom

Today

Yesterday

Detail for Checks Requiring Multiple Stubs

Select this option to create a report that includes the detail for checks that require multiple check stubs.

NOTE: This option is only available when called directly from the menu, it is not available when called from Select and Approve Bills for Payment or Generate Daily Reports.

Only check detail total is included, all other totaling is omitted.

This option can only be selected when the output option is set to Basic PDF, Enhanced PDF, or Printer.

Check Date

Enter the check date.

Reference

Enter the time of day at which the check run was initiated for the selected check date. If you click on the Arrow, a list of times for the selected check run appears. To select multiple check runs to print, use the associated Search button. Before using this option, be sure to select a Bank and a Check Date.

If no check runs exist for the selected bank and check date, the field is inactive.

Send Output to

The output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path

If you select either the Personal Report Viewer ( PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
