---
title: Report Cash Requirements
article_id: 15202553293460
section: 01-views-and-reports
index: 29
url: https://storis.zendesk.com/hc/en-us/articles/15202553293460-Report-Cash-Requirements
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Payables Views and Reports > Cash Flow Reports > Report Cash Requirements

Use this routine to report cash requirements for a fiscal period. The report sorts and totals after each vendor, bank, and company. Once the report criteria have been selected, click Run to produce the report.

NOTE: This report includes an unmarked column between the Type and the Invoice Number columns. This unmarked column displays the AP bill status code. For example, for AP bills with a Hold status, "H" prints in the unmarked column.

The Past Due column is only populated when the bills' invoice date has surpassed the as-of date indicated on this report. If reporting off the Anticipated Pay Date or Discount Date which is prior to the As-Of date indicated on this report then the invoice date is used to indicate when the bill should be paid or if it's past due.

Company Company

If Multi-Company Processing is active, you can specify one or more companies for which to run the report. If you click on the Action button, a list of companies appears from which you can choose. If you leave the field blank, you select all companies.

If not using Multi-Company Processing, the default company appears and the field is inactive.

Bank Bank

Enter one or more banks for which you want to run this report. If you click on the Arrow, a list of banks appears from which you can choose. If you click on the Action button, the Multiple Bank Selection Window, from which you can choose one or more banks.

Country CountrySpecify a payables country (AP bill document currency) for reporting. If you leave the field blank, you report for all countries.

Sort by Country Sort by CountryTo sort the report by payables country, check the box. Otherwise, leave the box blank. If you check this field, the report provides a secondary sort and break on payables country.

As of Date As of DateEnter the as-of date for which you want to run this report.

Aging Method Aging Method

Select the method by which you want to age open bills. Your options are:

Invoice Due Date

Discount Terms Date

Anticipated Payment Date

The default appears based on the Bill Aging Method field in the Payables Control Settings.

Aging Days Aging DaysEnter the number of days to use for aging buckets. The default is set based on the Bill Aging Days from the Payables Control Settings.

Pending Bills Pending Bills

To include pending AP bills in this report, check this box. Otherwise, leave the box blank. If you check this box, click the Arrow button to select one of the following report options:

All

Pay Before Receipt

Don't Pay Before Receipt

Hold Codes Hold CodesTo include AP bills on hold in the report, check this box.
You can restrict the report to AP bills associated with one or more hold codes. If you click on the Arrow, a list of hold codes appears from which you can choose. If you click on the Action button, the Multiple Hold Codes Selection window appears from which you can choose.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer ( PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.

Actions

NOTE: Within the report, the Options Selected box displays the selected run-time options for this sample, but does not appear when you run the actual report. The run-time options you select for each report appear on the last page of your report output. To close the report sample, click the "X" in the full image's upper right corner.
