---
title: Report Distribution to General Ledger
article_id: 15202676863764
section: 01-views-and-reports
index: 40
url: https://storis.zendesk.com/hc/en-us/articles/15202676863764-Report-Distribution-to-General-Ledger
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Fiscal Periods > Report Distribution to General Ledger

Accounting > General Ledger > Additional GL Reports > Report Distribution to General Ledger

Accounting > Payables > Payables Views and Reports > Report Distribution to General Ledger

Use this routine to report GL postings associated with AP bills for a specified range of dates. It also runs during the End-of-Month cycle process to report activity for the period being closed. Once the run-time options have been selected, choose Run to produce the report.

Company CompanyIf Multi-Company Processing is active, you can specify one or more companies for which to run the report. If you click on the Action button, a list of companies appears from which you can choose. If you leave the field blank, you select all companies.

If Multi-Company Processing is not active, the system company defaults and you cannot edit this field.

Date Code Date CodeClick on the Arrow button to view a list of date codes, then select the code that best indicates the time period on which to base your report.

Starting Post Date Starting Post DateIf you select CUS at the Date Code field, you activate this field. Use this field to specify the start date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

Ending Post Date Ending Post DateIf you select CUS at the Date Code field, you activate this field. Use this field to specify the end date of the custom date range for which you want to run this report. If you click on the Calendar Icon, you can select a date from the calendar that appears.

If you select another date code instead of CUS, this field fills in based on that selection and you cannot edit this field.

The following account element fields are restricted by GL Account Staff Security.

Account Field Account FieldIf you leave this field blank, you select all accounts. If you click on the Arrow, a list of accounts appears from which you can select one or more. If you click on the Action button, the Multiple GL Account Selection Screen appears, from which you can select one or more accounts and can also access the List Entry Window.

Sub-Account Field Sub-Account FieldIf you leave this field blank, you select all accounts. If you click on the Arrow, a list of accounts appears from which you can select one or more. If you click on the Action button, the Multiple GL Account Selection Screen appears, from which you can select one or more accounts and can also access the List Entry Window. Note that this field is active only if you are using sub-accounts.

Cost Center Field Cost Center FieldIf you leave this field blank, you select all accounts. If you click on the Arrow, a list of accounts appears from which you can select one or more. If you click on the Action button, the Multiple GL Account Selection Screen appears, from which you can select one or more accounts and can also access the List Entry Window.

Break-On Element Break-On Element

Use this field to specify a break and subtotal on either the full account or account element. You have the following options:

Complete Account

Root Account

Sub-Account

Cost Center

Summary Only Summary OnlyTo generate a summary report of GL account totals without the AP bill detail, check the box. Otherwise, leave the box blank.

NOTE: This option is not available for the PRV.

Include Detail Remarks Include Detail RemarksTo include GL remarks on the report, check the box. Otherwise, leave the box blank. This field is active for the detail version of this report.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
