---
title: Generate a Trial Balance (GL)
article_id: 15202946031892
section: 01-views-and-reports
index: 4
url: https://storis.zendesk.com/hc/en-us/articles/15202946031892-Generate-a-Trial-Balance-GL
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > General Ledger > Additional GL Reports > Generate a Trial Balance

Use this routine to report on account activity for open or closed fiscal periods. Once the report criteria have been selected, click Run to produce the report.

NOTE: You can simplify this report by setting the element consolidation level to root account and the summary level to period summary. The report then sorts and subtotals by account class, account sub-class, account group, and account. All sub-accounts and cost centers consolidate into the root account. To produce a report of parent accounts with the cost centers consolidated, you can also set the element consolidation level to sub-account.

Company CompanyEnter the company for which to generate a trial balance. The default company appears. If multi-company processing is not active, this field is inactive and you must accept the default company. If multi-company processing is active, you can edit this field. If you click on the Arrow, a list of companies appears from which you can choose.

Fiscal Year Fiscal YearEnter the fiscal year for which you want to generate a trial balance. If you click on the Arrow, a list of fiscal years appears, both open and closed, for which a period table exists. The default is the current fiscal year.

Period PeriodEnter the period from the selected fiscal year for which you want to generate a trial balance. If you click on the Arrow, a list of periods appears, both open and closed. The default is the current period.

AccountAccount

Indicate the root accounts for which you want to run this report. If you leave this field blank, you choose all root accounts. If you click on the Arrow, a list of root accounts appears from which you can choose. If you click on the Action button, you access the Multiple GL Account Selection screen, from which you can choose one or more root accounts.

For each root account you select, the report includes all associated sub-accounts and cost centers. If you specify a root account, you clear and inactivate the following fields:

Account Group

Account Sub-Class

Account Class

NOTE: The lists of accounts that appear at this field are restricted by the General Ledger User Permissions routine.

Sub-AccountSub-Account

Indicate the sub-accounts for which you want to run this report. This field is active only if you use sub-accounts. If you leave this field blank, you choose all sub-accounts. If you click on the Arrow, a list of sub-accounts appears from which you can choose. If you click on the Action button, you access the Multiple GL Sub-Account Selection screen, from which you can choose one or more sub-accounts.

For each sub-account you select, the report includes all associated cost centers. If you specify no root accounts, the report includes all root accounts associated with the specified sub-accounts.

NOTE: The lists of sub-accounts that appear at this field are restricted by the General Ledger User Permissions routine.

Cost Center Cost Center

Enter the cost centers for which you want to run this report. If you leave this field blank, you choose all cost centers. If you click on the Arrow, a list of cost centers appears from which you can choose. If you click on the Action button, you access the Multiple GL Cost Center Selection screen, from which you can choose one or more cost center.

If you specify no root accounts, the report includes all root accounts associated with the specified cost centers. If you specify no sub-accounts, the report includes all sub-accounts (if any) associated with the specified cost centers.

NOTE: The lists of cost centers that appear at this field are restricted by the General Ledger User Permissions routine.

Account Group Account GroupEnter the account groups (if any) for which you want to generate a trial balance. If you leave this field blank, you select all account groups. If you click on the Arrow, a list of account groups appears from which you can choose. If you select an account group, the Account Sub-Class and Account Class fields fill in accordingly and become inactive.

Account Sub-Class Account Sub-ClassEnter the account sub-classes (if any) for which you want to generate a trial balance. If you leave this field blank, you select all account sub-classes. If you click on the Arrow, a list of account sub-classes appears from which you can choose. If you select an account sub-class, the Account Class field fills in accordingly and becomes inactive.

Account Class Account ClassEnter the account classes (if any) for which you want to generate a trial balance. If you leave this field blank, you select all account classes. If you click on the Arrow, a list of account classes appears from which you can choose.

Element Consolidation Element Consolidation

Use this field to define account consolidation based on the account element. You have the following options:

No Consolidation - Make no consolidation and list each individual, complete account number (parent account plus the cost center).

Sub-Account - This option is available only if using sub-accounts. This option consolidates the amounts for all associated cost centers into the sub-account (root and sub-account). Only sub-accounts are listed.

Root Account – This option consolidates the amounts for all associated sub-accounts and cost centers into the root account. Only root accounts are listed.

Summary Level Summary Level

Use this field to define the account summary breakdown. The following options are available:

No Summarization – Suppress any summarization and print each individual posting to the account (as defined by the element consolidation).

Period Summary – Summarize all detail postings into a single line for the selected fiscal period.

Daily Summary – Summarize all detail postings by date and print a single line for each date.

Source Summary – Summarize all detail postings by source and print a single line for each source.

Weekly Summary – Summarize all detail postings by week and print a single line for each week. This option is available only where a weekly calendar is being used.

Primary Sort, Secondary Sort, Tertiary Sort Primary Sort, Secondary Sort, Tertiary SortUse these fields to determine the sorting sequence of the resulting report. You can select any combination of GL account class, GL account sub-class, and GL account group for sorting and subtotals. The account sort is always by root account, sub-account, and cost center.

Send Output to Send Output toThe output destination of the report displays. To change the output destination, click on the Actions button and select Output Settings.

Export Path Export PathIf you select either the Personal Report Viewer (PRV), Excel Export, or ASCII Export, this field displays the pre-set computer drive and folder location to which the system exports the report data. You cannot edit the export path using this process.
