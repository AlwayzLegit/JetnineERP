---
title: Report Cash Disbursements
article_id: 15202504435348
section: 01-views-and-reports
index: 26
url: https://storis.zendesk.com/hc/en-us/articles/15202504435348-Report-Cash-Disbursements
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Payables Views and Reports > Cash Flow Reports > Report Cash Disbursements

Use this routine to report cash disbursements for a given check date or fiscal period. Click Run to produce the report.

Company CompanyIf Multi-Company Processing is active, you can specify one or more companies for which to run the report. If you click on the Action button, a list of companies appears from which you can choose. If you leave the field blank, you select all companies.

If Multi-Company Processing is not active, the system company defaults and you cannot edit this field.

Payment Date Payment DateEnter the date for which you want to run this report. If you click on the Calendar icon, a calendar appears which you can use to select a date. If you enter a date here, you clear and inactivate the Fiscal Year and Fiscal Period fields.

Fiscal Year Fiscal YearEnter the fiscal year for which you want to run this report. If you click on the Arrow, a list containing each fiscal year (whether open or closed) for which a period table exists appears from which you can choose. The list also contains a "None Selected" option. The current fiscal year defaults. If you enter a date into the Payment Date field, you clear and inactivate this and the Fiscal Period fields.

Fiscal Period Fiscal PeriodEnter the fiscal period (01-12) for which you want to run this report. If you click on the Arrow, a list containing each fiscal period (whether open or closed) for which a period table exists appears from which you can choose. The list also contains a "None Selected" option. The current fiscal period defaults.

Payment Methods to Include Payment Methods to Include

Select the payment methods for which you want to run this report. You have the following options:

Printed Checks

Manual Checks

Credit Cards

Debit Cards

Online Banking

Cash

Sort By Sort By

Select the lowest sort level. You have the following options:

Payment Date (check date)

Payment Reference (check number)

The report generates separate reports for each company, and the primary sort on each report is by company, by bank.

Print GL Recap Print GL RecapTo include a GL Recap in your output, check the box. The GL Recap prints as a separate report, listing debits and credits for individual accounts, as well as totals by company and a grand total.

The Payment Method column in the report can contain any of the following codes:

CHK - Checks

MAN - Manual Checks

CCD - Credit Cards

DCD - Debit Cards

OLB - Online Banking

CSH - Cash

The Type column displays a 4-character description of the AP bill type. The Reference column displays the check number or the reference associated with the manual payment in the Enter/Update Individual Vendor Invoice routine. Although that Reference control accepts up to 25 characters, only 15 characters print on this report.

If the letter "P" appears in the column next to the Type column, it is an indicator that the AP bill is a Pending Bill that has been paid.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
