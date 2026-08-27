---
title: Report Account Budgeted Variances
article_id: 15202503962516
section: 01-views-and-reports
index: 20
url: https://storis.zendesk.com/hc/en-us/articles/15202503962516-Report-Account-Budgeted-Variances
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Account Budgets > Report Account Budgeted Variances

Use this report to compare, on a period basis, amounts budgeted with actual amounts posted. Once the report criteria have been selected, click Run to produce the report.

NOTE: To run this report, the user must have permission via the Inquiry/Report Restrictions section in General Ledger User Permissions.

Company CompanyEnter the company for which to run this report. The default company appears. If multi-company processing is not active, this field is inactive and you must accept the default company. If multi-company processing is active, you can edit this field. If you click on the Arrow, a list of companies appears from which you can choose.

Fiscal Year Fiscal YearSelect the fiscal year for which to generate the report. If you click on the Arrow, a list appears of fiscal years for which a period table exists. The list includes both open and closed fiscal years. The default is the current fiscal year.

Period PeriodEnter the period from the selected fiscal year for which to generate a trial balance. If you click on the Arrow, a list of periods appears, both open and closed. The default is the current period.

Account Account

Indicate the root accounts for which to run this report. If you leave this field blank, you choose all root accounts. If you click on the Arrow, a list of root accounts appears from which you can choose. If you click on the Action button, you access the Multiple GL Account Selection screen, from which you can choose one or more root accounts.

For each root account you select, the report includes all associated sub-accounts and cost centers.

NOTE: The lists of accounts that appear at this field are restricted by the General Ledger User Permissions routine.

Sub-Account Sub-Account

Indicate the sub-accounts for which to run this report. If you leave this field blank, you choose all sub-accounts. If you click on the Arrow, a list of sub-accounts appears from which you can choose. If you click on the Action button, you access the Multiple GL Sub-Account Selection screen, from which you can choose one or more sub-accounts.

For each sub-account you select, the report includes all associated cost centers. If you specify no root accounts, the report includes all root accounts associated with the specified sub-accounts.

NOTE: The use of sub-accounts is optional via the Use Sub-Accounts field in the General Ledger Control settings.

The lists of sub-accounts that appear at this field are restricted by the General Ledger User Permissions routine.

Cost Center Cost Center

Enter the cost centers for which to run this report. If you leave this field blank, you choose all cost centers. If you click on the Arrow, a list of cost centers appears from which you can choose. If you click on the Action button, you access the Multiple GL Cost Center Selection screen, from which you can choose one or more cost center.

If you specify no root accounts, the report includes all root accounts associated with the specified cost centers. If you specify no sub-accounts, the report includes all sub-accounts (if any) associated with the specified cost centers.

NOTE: The lists of cost centers that appear at this field are restricted by the General Ledger User Permissions routine.

Sort/Page Break Sort/Page Break

Use these fields to specify your sort sequence and to insert page breaks (if any) between sorts. You can select any combination of the following:

Account

*Sub-Account

Cost Center

NOTE: The Account option sorts by root account, sub-account, and cost center. Note also that the report prints the lowest sort level in detail format, so the page break option is not available at the lowest sort level.

*The use of sub-accounts is optional via the Use Sub-Accounts field in the General Ledger Control settings.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
